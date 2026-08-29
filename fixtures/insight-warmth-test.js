/* insight-warmth-test.js — R5/R170 the colour clock + the Teas-brewed strip (steep-dashboard.js).
 *
 * Tests the LOGIC, never live values: clockDominant (dominant tea per 2-hour slot; tie/empty/no-liquor →
 * null → --heat-empty), the peak-rule set (peakBuckets → .clock-peak.is-peak), and teasBrewedStrip
 * (distinct brewed-tea liquors, ramp-ordered; none → ''). A final pass runs over the REAL exports and
 * asserts only that every emitted colour is a real --liquor-* token and nothing crashes.
 * Run fixtures/export-gate-test.js FIRST.
 */
const fs=require('fs'), path=require('path'), vm=require('vm');
const REPO=path.resolve(__dirname,'..');
const SRC=['steep-knowledge.js','steep-tea-types.js','steep-core.js','steep-teas.js','steep-insights.js','steep-dashboard.js']
  .map(f=>fs.readFileSync(path.join(REPO,f),'utf8')).join('\n;\n');
const ctx={}; ctx.window=ctx; ctx.globalThis=ctx; ctx.console=console;
ctx.document={documentElement:{setAttribute(){},getAttribute(){return'light'}},getElementById:()=>null,querySelectorAll:()=>[],querySelector:()=>null,addEventListener(){},createElement:()=>({style:{},setAttribute(){},appendChild(){},classList:{add(){},remove(){}}})};
ctx.localStorage={getItem:()=>null,setItem(){},removeItem(){}};
ctx.matchMedia=()=>({matches:false}); ctx.navigator={onLine:true};
ctx.setTimeout=()=>{}; ctx.clearTimeout=()=>{}; ctx.setInterval=()=>{}; ctx.clearInterval=()=>{}; ctx.addEventListener=()=>{};
ctx.SteepDB={newId:()=>'x',getUser:()=>({id:'u'})};
vm.createContext(ctx); vm.runInContext(SRC, ctx);
const G=e=>vm.runInContext(e,ctx);
G('state.settings=Object.assign({},DEFAULT_SETTINGS);state.vessels=[];');

let passed=0, failed=0;
const ok=(c,m)=>{ if(c){passed++;} else {failed++; console.log('  FAIL: '+m);} };
// n sessions in a given 2-hour slot (slot s → local hour s*2), naming teaId.
const atSlot=(slot,teaId,n)=>Array.from({length:n},(_,i)=>{ const d=new Date(Date.now()-i*3600000*0.1); d.setHours(slot*2,0,0,0); return {id:teaId+slot+'_'+i,teaId,date:d.toISOString(),steeps:[]}; });
function seed(teas, sessions){ G('state.teas='+JSON.stringify(teas)+';state.sessions='+JSON.stringify(sessions)+';'); }

console.log('INSIGHT WARMTH — the colour clock + the Teas-brewed strip (R170)');

/* ---- A · clockDominant: dominant / tie / empty / no-liquor (SYNTHETIC) ---- */
seed(
  [{id:'A',name:'Amber Tea',type:'oolong',liquor:'amber'},
   {id:'B',name:'Green Tea',type:'green',liquor:'jade-pale'},
   {id:'C',name:'No-Liquor Tea',type:'oolong'}],           // no liquor field, no catalog match → liquorFor null
  [].concat(
    atSlot(3,'A',3), atSlot(3,'B',1),   // slot 3: 3 A + 1 B  → dominant A
    atSlot(4,'A',2), atSlot(4,'B',2),   // slot 4: tie        → null
    atSlot(6,'C',2)                     // slot 6: C only, no liquor → null
    // slot 5 (and others): empty → null
  ));
const dom=G('clockDominant(state.sessions)');
ok(Array.isArray(dom) && dom.length===12, 'A clockDominant returns 12 slots');
ok(dom[3]==='amber', 'A dominant slot → the top tea\'s liquor key ('+dom[3]+')');
ok(dom[4]===null, 'A a tie for top → null (→ --heat-empty, never-guess)');
ok(dom[5]===null, 'A an empty slot → null');
ok(dom[6]===null, 'A a dominant tea with no liquor → null (never a guessed colour)');

/* ---- B · the rendered fill follows clockDominant; null → --heat-empty (SYNTHETIC) ---- */
{ const s=G('computeStats()');
  const html=G('brewingClockHTML(computeStats())');
  ok(/var\(--liquor-amber\)/.test(html), 'B the dominant slot paints var(--liquor-amber)');
  ok(/var\(--heat-empty\)/.test(html), 'B a null slot paints var(--heat-empty), not a guessed colour');
  ok(!/var\(--jade\)/.test(html) && !/background:var\(--amber\)/.test(html), 'B the old flat-jade / amber-peak fills are gone (fill is data now)'); }

/* ---- C · the peak-rule set — peakBuckets → .clock-peak.is-peak, ties all lit (SYNTHETIC s) ---- */
{ const s1={totalSessions:10, hourBuckets:[0,0,0,3,5,0,2,0,0,0,0,0], peakBuckets:[4]};
  const h1=G('brewingClockHTML('+JSON.stringify(s1)+')');
  ok((h1.match(/clock-peak is-peak/g)||[]).length===1, 'C one peak → exactly one .clock-peak.is-peak');
  ok((h1.match(/class="clock-peak"/g)||[]).length===11, 'C the other 11 columns carry a plain (transparent) .clock-peak');
  const s2={totalSessions:10, hourBuckets:[0,0,0,5,0,0,5,0,0,0,0,0], peakBuckets:[3,6]};
  const h2=G('brewingClockHTML('+JSON.stringify(s2)+')');
  ok((h2.match(/clock-peak is-peak/g)||[]).length===2, 'C a joint peak lights BOTH columns (R100 ties all named)'); }

/* ---- D · teasBrewedStrip: distinct brewed-tea liquors, ramp-ordered; none → '' (SYNTHETIC) ---- */
seed(
  [{id:'A',name:'Amber',type:'oolong',liquor:'amber'},
   {id:'B',name:'Green',type:'green',liquor:'jade-pale'},
   {id:'D',name:'Dupe',type:'oolong',liquor:'amber'},      // same liquor as A → deduped
   {id:'E',name:'Plain',type:'oolong'}],                   // no liquor → contributes nothing
  [{id:'s1',teaId:'A',date:new Date().toISOString(),steeps:[]},
   {id:'s2',teaId:'B',date:new Date().toISOString(),steeps:[]},
   {id:'s3',teaId:'D',date:new Date().toISOString(),steeps:[]},
   {id:'s4',teaId:'E',date:new Date().toISOString(),steeps:[]}]);
{ const strip=G('teasBrewedStrip(state.sessions)');
  ok(/ins-strip/.test(strip), 'D a strip renders when brewed teas have liquors');
  ok((strip.match(/var\(--liquor-/g)||[]).length===2, 'D distinct liquors only — amber+jade-pale, the dupe collapses, the no-liquor tea adds nothing ('+((strip.match(/var\(--liquor-/g)||[]).length)+')');
  ok(strip.indexOf('jade-pale') < strip.indexOf('amber'), 'D ordered by the ramp (jade-pale before amber), not session order'); }
seed([{id:'E',name:'Plain',type:'oolong'}],[{id:'s1',teaId:'E',date:new Date().toISOString(),steeps:[]}]);
ok(G('teasBrewedStrip(state.sessions)')==='', 'D no strip when no brewed tea has a liquor (never-guess)');

/* ---- E · REAL data — every emitted colour is a real --liquor-* token; nothing crashes ---- */
function parseCSV(t){const R=[];let r=[],c='',q=false;for(let i=0;i<t.length;i++){const ch=t[i];
 if(q){if(ch==='"'){if(t[i+1]==='"'){c+='"';i++;}else q=false;}else c+=ch;}
 else if(ch==='"')q=true;else if(ch===','){r.push(c);c='';}
 else if(ch==='\n'){r.push(c);R.push(r);r=[];c='';}else if(ch!=='\r')c+=ch;}
 if(c||r.length){r.push(c);R.push(r);}
 const h=(R[0]||[]).map(x=>x.trim());return R.slice(1).filter(x=>x.length===h.length).map(x=>Object.fromEntries(h.map((k,i)=>[k,x[i]])));}
const rd=f=>{ try{ return parseCSV(fs.readFileSync(path.join(__dirname,f),'utf8')); }catch(e){ return null; } };
const teaCSV=rd('teas_rows.csv'), sesCSV=rd('sessions_rows.csv');
if(teaCSV && sesCSV){
  const OWNER=sesCSV[0].user_id;
  const teas=teaCSV.filter(t=>t.user_id===OWNER).map(t=>({id:t.id,name:t.name,type:t.type,liquor:t.liquor||'',origin:t.origin||'',cultivar:t.cultivar||''}));
  const sessions=sesCSV.filter(s=>s.user_id===OWNER).map(s=>({id:s.id,teaId:s.tea_id,date:s.session_date,steeps:[]}));
  seed(teas, sessions);
  const dom2=G('clockDominant(state.sessions)'), strip2=G('teasBrewedStrip(state.sessions)');
  const KEYS=G('typeof LIQUOR_KEYS!=="undefined" ? LIQUOR_KEYS : null');
  const emitted=[...dom2.filter(Boolean), ...[...strip2.matchAll(/--liquor-([a-z-]+)\)/g)].map(m=>m[1])];
  ok(emitted.every(k=>!KEYS || KEYS.includes(k)), 'E every emitted colour key is a real --liquor-* stop (no invented colour)');
  ok(typeof G('brewingClockHTML(computeStats())')==='string', 'E brewingClockHTML renders over real data without crashing');
  console.log('  E real-data: '+dom2.filter(Boolean).length+'/12 slots coloured · strip '+((strip2.match(/var\(--liquor-/g)||[]).length)+' liquors');
} else { console.log('  E skipped — no real CSVs'); }

console.log('');
if(failed){ console.log('INSIGHT-WARMTH TESTS FAILED — '+failed+' failed, '+passed+' passed'); process.exit(1); }
console.log('ALL INSIGHT-WARMTH TESTS PASSED ('+passed+' passed)');
