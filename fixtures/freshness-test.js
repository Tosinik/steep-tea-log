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
// v3.98: steep-tea-types.js joins the bundle — freshnessReading reaches the catalog through
// ttFreshness, so without it every tea silently degrades to the elapsed-only rung and the suite
// would "pass" a model that had lost its windows entirely.
vm.runInContext(['steep-tea-types.js','steep-teas.js'].map(f=>fs.readFileSync(path.join(repo,f),'utf8')).join('\n;\n'), ctx, {filename:'freshness-bundle.js'});

// Inner text of the cue. Keyed on the CLASS, not on an inline style string — the v3.62 extractor
// matched `italic;">` and would have gone quietly blank the moment the styling moved to a stylesheet,
// reporting "no cue" for every tea rather than failing.
const cueText=tea=>{ const h=ctx.freshnessCueHTML(tea); const m=/class="fresh-cue">([\s\S]*?)<\/div>$/.exec(h);
  return m ? m[1].replace(/<[^>]+>/g,'') : ''; };

let pass=0, fail=0;
const check=(n,c)=>{ if(c)pass++; else{fail++; console.log('  FAIL: '+n);} };

const cues=TEAS.map(t=>({name:t.name, cue:cueText(t)})).filter(x=>x.cue);
console.log('cues fired on real data ('+cues.length+' of '+TEAS.length+' owner-scoped teas):');
cues.forEach(c=>console.log('  '+c.name+' -> '+c.cue));

/* THE BLOCK IS THE CLOCK'S. A cue renders for a row exactly when the CLOCK grounds — openedDate, else
   a parseable harvest year — regardless of whether a window does. That is the elapsed-only rung, and
   it is the reason the model doesn't punish the field it is asking Niklas to start filling: `covers`
   is hand-curated, so every newly added tea starts uncovered, and without this rung a freshly typed
   opened_date would show nothing until someone edited the catalog. */
let biconditional=true, offenders=[];
TEAS.forEach(t=>{
  const fires = cueText(t)!=='';
  const hasClock = ctx.freshnessClock(t)!==null;
  if(fires!==hasClock){ biconditional=false; offenders.push(t.name+' (fires='+fires+', clock='+hasClock+')'); }
});
check('a cue renders exactly when the CLOCK grounds'+(offenders.length?' — '+offenders.join('; '):''), biconditional);

/* Every rung must be exercised by the real shelf, or the biconditional above proves little. At the
   time of writing: 2 teas ground both keys, 4 are clock-only (elapsed rung), 15 have no clock. Those
   are reported, never pinned — they move whenever a cup is brewed or a covers entry is authored. */
const rungOf = t => { const r=ctx.freshnessReading(t); if(!r) return 'none';
  return !r.grounded ? 'elapsed' : (r.ageing ? 'ageing' : 'window'); };
const tally = TEAS.reduce((a,t)=>(a[rungOf(t)]=(a[rungOf(t)]||0)+1,a),{});
console.log('  rungs on the real shelf: '+JSON.stringify(tally));
/* The elapsed-only rung has NO live example, and that is not a defect — the R70 shape again.
   §2 justified it as the rung "every new tea starts on, by construction", which was true when the
   window keyed on the catalog alone. R85's third rung changed that: `teas.type` is CHECK-constrained
   to six values that all carry a window, so a real tea can no longer be window-less. The rung is now
   defensive rather than routine, which is strictly better — a newly added tea gets a real window
   immediately instead of a bare date. So this REPORTS coverage and asserts the rung still WORKS,
   synthetically, rather than requiring the shelf to contain an example it can no longer produce. */
check('at least one fully grounded reading on the real shelf', (tally.window||0)+(tally.ageing||0)>0);
check('every real tea grounds a window (R85 rung 3 — elapsed-only is now defensive, '+(tally.elapsed||0)+' live)', (tally.elapsed||0)===0);
// The estimated rung says so. A harvest-grounded reading must never pass itself off as measured.
TEAS.filter(t=>!t.openedDate && rungOf(t)==='window').forEach(t=>
  check(t.name+' (harvest-grounded) carries the sealed-assumption hedge', /assumes sealed until opened/.test(ctx.freshnessCueHTML(t))));
// R85's anti-regression clause, asserted as a SET and not a count: every tea that reads a window
// today must still read one. A count survives one tea gaining coverage while another loses it —
// exactly the shape the `Guandong` typo produced.
const WINDOW_GROUNDED = ['2021 Fujian White Tea','Fei Bing Beeng Cha','Shincha Saemidori Kagoshima',
  'Moonlight White - Yue Guang Bai','Chiran Sencha Okumidori','Spring White Anji Green Tea'];
WINDOW_GROUNDED.forEach(n=>{ const t=TEAS.find(x=>x.name===n);
  check('R85: "'+n+'" still grounds a reading (it would lose one under slug→family alone)',
    !!t && ctx.freshnessReading(t)!==null); });

// synthetic — the ladder, rung by rung
// Relative to the vm's PINNED now, not the real one. The first draft used the host clock while the
// sandbox ran at 2026-07-10, so "30 days ago" arrived as 4 — a synthetic that silently tested a
// different case than it named. Same wrong-representation shape as the rest of this round.
const D = n => { const d=new Date(NOW); d.setDate(d.getDate()-n); return d.toISOString().slice(0,10); };
check('no clock at all -> no block (absent, not a zero)', cueText({name:'Keemun',type:'black'})==='');
check('garbage year is not a clock', cueText({name:'Test Sencha',type:'green',harvestYear:'nextyear'})==='');
check('openedDate alone grounds the clock even with no harvest',
  /^Opened /.test(cueText({name:'Sencha Kagoshima Premium',type:'green',openedDate:D(30)})));
check('an UNCOVERED tea with an opened date reads elapsed-only, no window claim',
  cueText({name:'A Tea Nobody Curated 12345',type:'not-a-type',openedDate:D(30)})==='Opened 4 wks ago');
check('ageing (pu-erh, via teas.type -> dark) frames as history, never a countdown',
  /deepens with age\.$/.test(cueText({name:'Sheng Cake',type:'puerh',harvestYear:'2018',harvestSeason:'Autumn'})));
check('a measured ageing clock does not repeat itself ("Opened 2 yrs ago — 2 yrs rested")',
  !/rested/.test(cueText({name:'Sheng Cake',type:'puerh',openedDate:D(800)})));
check('harvest-grounded reading is hedged as an assumption',
  /assumes sealed until opened/.test(ctx.freshnessCueHTML({name:'Sencha Kagoshima Premium',type:'green',harvestYear:String(new Date().getFullYear()),harvestSeason:'Spring'})));
check('no reading anywhere renders a raw day count (seeds stay soft, §3)',
  !/\b\d{2,3} days?\b/.test(TEAS.map(cueText).join(' ')));

// Same banner shape as the other committed suites. It read only "N passed, M failed" while this file
// was local-only; now that it is tracked and runs on every deploy, an output line that differs from
// its eighteen siblings is one a reader scanning a wall of results can skim straight past.
console.log(fail ? `\n${fail} FRESHNESS TEST(S) FAILED` : `\nALL FRESHNESS TESTS PASSED (${pass} passed)`);
process.exit(fail?1:0);
