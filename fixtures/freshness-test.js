/* PERMANENT validation — freshness cues (v3.62; committed and repaired v3.97).
 *
 * Loads the REAL freshnessCueHTML from steep-teas.js in a vm with stubbed globals and feeds it the
 * real teas CSV.
 *
 * v3.97 repair, the same two faults as status-line and tea-types (R69/R79 family):
 *   1. It asserted `cues.length === 2` — a SNAPSHOT (R67). Five cues fire now, because teas were
 *      added to the shelf since v3.62; the rule never broke, the count moved. What is asserted now
 *      is the ENGINE'S OWN BICONDITIONAL: a cue fires for a row exactly when freshnessClass(tea) and
 *      freshnessYear(tea) are both non-null, and the wording follows the class. That cannot go stale
 *      when Niklas buys a tea.
 *   2. It was UNSCOPED, so another account's row (R69) was in the sample.
 *
 * NOTE for slice B3: this suite guards the SHIPPED cue. SPEC-freshness-model.md §3/§4 replaces the
 * model with opened_date + catalog windows, at which point these expectations are rewritten, not
 * patched — the same instruction the spec gives for status-line-test.js §D.
 *
 * Run: node fixtures/freshness-test.js
 */
const fs=require('fs'), path=require('path'), vm=require('vm');
const repo=path.join(__dirname,'..'), dl=__dirname;
function parseCSV(text){ const rows=[]; let row=[], field='', q=false;
  for(let i=0;i<text.length;i++){ const c=text[i];
    if(q){ if(c==='"'){ if(text[i+1]==='"'){ field+='"'; i++; } else q=false; } else field+=c; }
    else if(c==='"') q=true; else if(c===','){ row.push(field); field=''; }
    else if(c==='\n'){ row.push(field); rows.push(row); row=[]; field=''; } else if(c==='\r'){} else field+=c; }
  if(field.length||row.length){ row.push(field); rows.push(row); }
  const head=rows.shift();
  return rows.filter(r=>r.length>1||r[0]!=='').map(r=>{ const o={}; head.forEach((h,i)=>o[h]=r[i]); return o; });
}
// R69: the export is not user-scoped. Derive the owner from who owns the sessions — never hardcode a
// UUID, never exclude a row by name (the mistake tea-types-test.js G made).
const sessPath=path.join(dl,'sessions_rows.csv');
const OWNER=fs.existsSync(sessPath) ? (parseCSV(fs.readFileSync(sessPath,'utf8'))[0]||{}).user_id : null;
const teaRows=parseCSV(fs.readFileSync(path.join(dl,'teas_rows.csv'),'utf8'))
  .filter(r=>!OWNER || r.user_id===OWNER);
const TEAS=teaRows.map(t=>({ id:t.id, name:t.name, type:t.type, cultivar:t.cultivar,
  harvestYear:t.harvest_year, harvestSeason:t.harvest_season }));

// vm context: pin "now" to 2026-07-10 so the year window (<= now+1) is stable
const NOW='2026-07-10T12:00:00';
const ctx={ console, Math, JSON, Array, Object, Number, String, RegExp, parseInt };
class FakeDate extends Date{ constructor(...a){ if(!a.length) super(NOW); else super(...a); } static now(){ return new Date(NOW).getTime(); } }
ctx.Date=FakeDate; ctx.window=ctx; ctx.globalThis=ctx;
ctx.escapeHtml=s=>String(s); ctx.escapeJsArg=s=>String(s);
ctx.typeLabel=k=>({green:'Green',white:'White',oolong:'Oolong',puerh:'Pu-erh',yellow:'Yellow',black:'Black'})[k]||k;
// stubs for the rest of steep-teas.js top-level (only the freshness helpers are exercised)
ctx.state={}; ctx.teaById=()=>null; ctx.render=()=>{};
vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(repo,'steep-teas.js'),'utf8'), ctx, {filename:'steep-teas.js'});

// extract the inner text of the cue (strip the wrapping div)
const cueText=tea=>{ const h=ctx.freshnessCueHTML(tea); const m=/italic;">([\s\S]*?)<\/div>/.exec(h); return m?m[1]:''; };

let pass=0, fail=0;
const check=(n,c)=>{ if(c)pass++; else{fail++; console.log('  FAIL: '+n);} };

const cues=TEAS.map(t=>({name:t.name, cue:cueText(t)})).filter(x=>x.cue);
console.log('cues fired on real data ('+cues.length+' of '+TEAS.length+' owner-scoped teas):');
cues.forEach(c=>console.log('  '+c.name+' -> '+c.cue));

/* The rule, not the count. A cue fires for a row exactly when BOTH keys ground — the style has a
   freshness class and the harvest year parses — and stays silent otherwise. Checked per row across
   the whole real shelf, so a new tea extends the coverage instead of breaking the suite. */
let biconditional=true, wording=true, offenders=[];
TEAS.forEach(t=>{
  const fires = cueText(t)!=='';
  const grounded = ctx.freshnessClass(t)!==null && ctx.freshnessYear(t)!==null;
  if(fires!==grounded){ biconditional=false; offenders.push(t.name+' (fires='+fires+', grounded='+grounded+')'); }
  if(!fires) return;
  const cls = ctx.freshnessClass(t);
  const ok = cls==='ages' ? /deepens with age\.$/.test(cueText(t)) : /is at its best young\.$/.test(cueText(t));
  if(!ok){ wording=false; offenders.push(t.name+' (class '+cls+', wrong wording)'); }
});
check('a cue fires exactly when class AND year both ground'+(offenders.length?' — '+offenders.join('; '):''), biconditional);
check('every fired cue\'s wording follows its class (ages vs young)', wording);
// Both branches must be exercised by the real shelf, or the biconditional above proves little.
const classes=new Set(TEAS.map(t=>ctx.freshnessClass(t)).filter(Boolean));
check('the real shelf exercises both classes (got: '+[...classes].sort().join(', ')+')', classes.has('young')&&classes.has('ages'));
// A tea with a class but no parseable year is the silent case that matters most — never invent an age.
const classNoYear=TEAS.filter(t=>ctx.freshnessClass(t)!==null && ctx.freshnessYear(t)===null);
check('classed teas with no parseable year stay silent ('+classNoYear.length+' such: '+
  (classNoYear.map(t=>t.name).join(', ')||'none')+')', classNoYear.every(t=>cueText(t)===''));

// synthetic edge cases
check('young style + future/garbage year silent', cueText({name:'Test Sencha',type:'green',harvestYear:'nextyear',harvestSeason:'Spring'})==='');
check('young style + valid year, no season -> no season prefix', cueText({name:'Dragonwell',type:'green',harvestYear:'2025',harvestSeason:''})==='2025 harvest — longjing is at its best young.');
check('ages style (puerh) + year -> ages cue', cueText({name:'Sheng Cake',type:'puerh',harvestYear:'2018',harvestSeason:'Autumn'})==='Autumn 2018 harvest — this style deepens with age.');
check('neutral style (black) stays silent even with year', cueText({name:'Keemun',type:'black',harvestYear:'2024',harvestSeason:'Spring'})==='');
check('generic green fallback word "green tea"', cueText({name:'House Green',type:'green',harvestYear:'2025',harvestSeason:''})==='2025 harvest — green tea is at its best young.');

// Same banner shape as the other committed suites. It read only "N passed, M failed" while this file
// was local-only; now that it is tracked and runs on every deploy, an output line that differs from
// its eighteen siblings is one a reader scanning a wall of results can skim straight past.
console.log(fail ? `\n${fail} FRESHNESS TEST(S) FAILED` : `\nALL FRESHNESS TESTS PASSED (${pass} passed)`);
process.exit(fail?1:0);
