/* insight-engine-test.js — R5/R159 lead-insight engine (computeLeadInsight, steep-dashboard.js).
 *
 * Tests the LOGIC, never live values: does each type fire (or gate) given a data shape; the pick
 * (most-specifically-true, not in cooldown); the sticky-per-day + ~7-day cooldown; the never-guess
 * floor (null). Synthetic states are the negative controls / gate probes and are marked as such; a
 * final pass runs the engine over the REAL exports and asserts only that it produces a VALID pick or
 * null (any named tea resolves; text non-empty) — never which type or tea (that is live data).
 * Run fixtures/export-gate-test.js FIRST.
 */
const fs=require('fs'), path=require('path'), vm=require('vm');
const REPO=path.resolve(__dirname,'..');
const SRC=['steep-knowledge.js','steep-tea-types.js','steep-core.js','steep-teas.js','steep-insights.js','steep-dashboard.js']
  .map(f=>fs.readFileSync(path.join(REPO,f),'utf8')).join('\n;\n');
const ctx={}; ctx.window=ctx; ctx.globalThis=ctx; ctx.console=console;
ctx.document={documentElement:{setAttribute(){},getAttribute(){return'light'}},getElementById:()=>null,querySelectorAll:()=>[],querySelector:()=>null,addEventListener(){},createElement:()=>({style:{},setAttribute(){},appendChild(){},classList:{add(){},remove(){}}})};
const LS={}; ctx.localStorage={getItem:k=>(k in LS?LS[k]:null), setItem:(k,v)=>{LS[k]=String(v);}, removeItem:k=>{delete LS[k];}};
ctx.matchMedia=()=>({matches:false}); ctx.navigator={onLine:true};
ctx.setTimeout=()=>{}; ctx.clearTimeout=()=>{}; ctx.setInterval=()=>{}; ctx.clearInterval=()=>{}; ctx.addEventListener=()=>{};
ctx.SteepDB={newId:()=>'x',getUser:()=>({id:'u'})};
vm.createContext(ctx); vm.runInContext(SRC, ctx);
const G=e=>vm.runInContext(e,ctx);
G('state.settings=Object.assign({},DEFAULT_SETTINGS);state.vessels=[];');

let passed=0, failed=0;
const ok=(c,m)=>{ if(c){passed++;} else {failed++; console.log('  FAIL: '+m);} };
const clearLS=()=>{ for(const k in LS) delete LS[k]; };
// dayKey of (now - n days) — the same key format the engine stores, computed relative so the cooldown
// test is deterministic regardless of the wall-clock date it runs on.
const keyAgo=n=>G('dayKey(new Date(Date.now()-'+n+'*86400000))');
const iso=n=>new Date(Date.now()-n*86400000).toISOString();
function seed(teas, sessions){ clearLS(); G('state.teas='+JSON.stringify(teas)+';state.sessions='+JSON.stringify(sessions)+';'); }
const lead=()=>G('computeLeadInsight()');

console.log('INSIGHT ENGINE — computeLeadInsight (R159)');

/* ---- A · the global floor (matches computeInsights <5) ---- */
seed([{id:'t1',name:'A',type:'green',rating:0}],
     [1,2,3].map(i=>({id:'s'+i,teaId:'t1',date:iso(i),steeps:[]})));
ok(lead()===null, 'A <5 sessions → null (never-guess floor)');

/* ---- B · morning-truth fires on a real skew, gates on a flat spread (SYNTHETIC) ----
   No ratings, no dated teas, no timed steeps, <8 sessions → the only gate that can pass is
   morning-truth, so the pick isolates it. */
const morningSessions = Array.from({length:6},(_,i)=>({id:'m'+i,teaId:'t1',date:new Date(Date.now()-i*86400000).setHours?undefined:undefined,steeps:[]}));
// build 6 sessions all at 07:00 local across 6 days (a hard morning skew)
const atHour=(n,h,tea)=>Array.from({length:n},(_,i)=>{ const d=new Date(Date.now()-i*86400000); d.setHours(h,0,0,0); return {id:'x'+h+i,teaId:tea||'t1',date:d.toISOString(),steeps:[]}; });
seed([{id:'t1',name:'A',type:'green',rating:0},{id:'t2',name:'B',type:'black',rating:0}], atHour(6,7));
{ const L=lead(); ok(L && L.type==='morning-truth', 'B morning skew → morning-truth fires ('+(L&&L.type)+')');
  ok(L && !L.teaId, 'B …and names no tea → no swatch (teaId absent)'); }
// flat spread across the four parts → no skew, nothing else eligible → floor
seed([{id:'t1',name:'A',type:'green',rating:0}], [7,13,19,1,7,13,19,1].map((h,i)=>{ const d=new Date(Date.now()-i*86400000); d.setHours(h,0,0,0); return {id:'f'+i,teaId:'t1',date:d.toISOString(),steeps:[]}; }));
ok(lead()===null, 'B flat time-of-day + nothing else eligible → null');

/* ---- C · highest-rated names a tea (swatch data); specificity beats palate-lean (SYNTHETIC) ---- */
seed([{id:'t1',name:'Da Hong Pao',type:'oolong',rating:4.6},{id:'t2',name:'B',type:'green',rating:0}],
     Array.from({length:9},(_,i)=>({id:'r'+i, teaId:(i%2?'t2':'t1'), date:iso(i+1), steeps:[]})));
{ const L=lead(); ok(L && L.type==='highest-rated', 'C a ≥4 tea + 9 sessions/2 types → highest-rated wins on specificity ('+(L&&L.type)+')');
  ok(L && L.teaId==='t1', 'C …and it names the tea (teaId set → swatch rides)');
  ok(L && /Da Hong Pao/.test(L.text), 'C …text names the tea, no second clause'); }

/* ---- D · palate-lean gate: needs ≥8 sessions across ≥2 types (SYNTHETIC) ---- */
seed([{id:'t1',name:'A',type:'green',rating:0},{id:'t2',name:'B',type:'black',rating:0}],
     [7,13,19,1,7,13].map((h,i)=>{ const d=new Date(Date.now()-i*86400000); d.setHours(h,0,0,0); return {id:'p'+i, teaId:(i%2?'t2':'t1'), date:d.toISOString(), steeps:[]}; }));  // 6<8, spread (no skew), no ratings
ok(lead()===null, 'D 6 sessions (2 types, no skew/ratings/dates) → palate-lean gated → null');
seed([{id:'t1',name:'A',type:'green',rating:0},{id:'t2',name:'B',type:'black',rating:0}],
     [7,13,19,1].concat([7,13,19,1]).concat([13,19]).map((h,i)=>{ const d=new Date(Date.now()-i*86400000); d.setHours(h,0,0,0); return {id:'q'+i, teaId:(i%2?'t2':'t1'), date:d.toISOString(), steeps:[]}; }));  // 10, 2 types, no skew
{ const L=lead(); ok(L && L.type==='palate-lean' && !L.teaId, 'D 10 sessions/2 types, no skew → palate-lean fires, names a type not a tea ('+(L&&L.type)+')'); }

/* ---- E · the cooldown: sticky per day, ~7-day skip, then re-eligible (SYNTHETIC) ---- */
seed([{id:'t1',name:'Da Hong Pao',type:'oolong',rating:4.6},{id:'t2',name:'B',type:'green',rating:0}],
     Array.from({length:9},(_,i)=>({id:'c'+i, teaId:(i%2?'t2':'t1'), date:iso(i+1), steeps:[]})));
const first=lead();
ok(first && first.type==='highest-rated', 'E first render picks + stamps highest-rated');
ok(JSON.stringify(lead())===JSON.stringify(first), 'E same day, re-render → STICKY (identical pick, no churn)');
// simulate: highest-rated shown 2 days ago (within cooldown) → it is skipped, the next firing type is picked
LS['tealog_insightlog']=JSON.stringify({'highest-rated':keyAgo(2)});
{ const L=lead(); ok(L && L.type!=='highest-rated', 'E stamped 2 days ago → highest-rated skipped, next-specific picked ('+(L&&L.type)+')'); }
// simulate: shown 8 days ago (past cooldown) → eligible again
LS['tealog_insightlog']=JSON.stringify({'highest-rated':keyAgo(8)});
ok((lead()||{}).type==='highest-rated', 'E stamped 8 days ago (> cooldown) → highest-rated eligible again');

/* ---- F · floor when every firing type is in cooldown → null (SYNTHETIC) ---- */
seed([{id:'t1',name:'Da Hong Pao',type:'oolong',rating:4.6}],
     [7,13,19,1,7,13].map((h,i)=>{ const d=new Date(Date.now()-i*86400000); d.setHours(h,0,0,0); return {id:'z'+i, teaId:'t1', date:d.toISOString(), steeps:[]}; }));  // 6, spread (no skew), 1 type → only highest-rated fires
LS['tealog_insightlog']=JSON.stringify({'highest-rated':keyAgo(1)});
ok(lead()===null, 'F sole firing type in cooldown → floor = null (never a fabricated stat)');

/* ---- G · REAL data — valid pick or null, never asserting which (values are live) ---- */
function parseCSV(t){const R=[];let r=[],c='',q=false;for(let i=0;i<t.length;i++){const ch=t[i];
 if(q){if(ch==='"'){if(t[i+1]==='"'){c+='"';i++;}else q=false;}else c+=ch;}
 else if(ch==='"')q=true;else if(ch===','){r.push(c);c='';}
 else if(ch==='\n'){r.push(c);R.push(r);r=[];c='';}else if(ch!=='\r')c+=ch;}
 if(c||r.length){r.push(c);R.push(r);}
 const h=(R[0]||[]).map(x=>x.trim());return R.slice(1).filter(x=>x.length===h.length).map(x=>Object.fromEntries(h.map((k,i)=>[k,x[i]])));}
const rd=f=>{ try{ return parseCSV(fs.readFileSync(path.join(__dirname,f),'utf8')); }catch(e){ return null; } };
const teaCSV=rd('teas_rows.csv'), sesCSV=rd('sessions_rows.csv'), stpCSV=rd('steeps_rows.csv');
if(teaCSV && sesCSV){
  const OWNER=sesCSV[0].user_id;
  const teas=teaCSV.filter(t=>t.user_id===OWNER).map(t=>({id:t.id,name:t.name,type:t.type,rating:Number(t.rating||0),origin:t.origin||'',
    amountGrams:Number(t.amount_grams||0),isFavorite:t.is_favorite==='true'||t.is_favorite==='t',purchaseDate:t.purchase_date||'',openedDate:t.opened_date||'',harvestYear:t.harvest_year||'',harvestSeason:t.harvest_season||''}));
  const stById={}; (stpCSV||[]).filter(s=>s.user_id===OWNER).forEach(s=>{ (stById[s.session_id]=stById[s.session_id]||[]).push({tempC:Number(s.temp_c||0),timeSeconds:Number(s.time_seconds||0)}); });
  const sessions=sesCSV.filter(s=>s.user_id===OWNER).map(s=>({id:s.id,teaId:s.tea_id,date:s.session_date,rating:Number(s.rating||0),
    gramsUsed:Number(s.grams_used||0),isColdBrew:s.is_cold_brew==='true'||s.is_cold_brew==='t',teaType:s.tea_type,steeps:stById[s.id]||[]}));
  clearLS(); G('state.teas='+JSON.stringify(teas)+';state.sessions='+JSON.stringify(sessions)+';');
  const L=lead();
  ok(L===null || (typeof L.text==='string' && L.text.length>0 && typeof L.type==='string'),
     'G real data → a valid pick or null (never a crash); type+text present when it fires');
  ok(!L || !L.teaId || teas.some(t=>t.id===L.teaId), 'G …any named tea resolves to a real shelf tea (swatch is real data)');
  console.log('  G real-data lead: '+(L?('type='+L.type+(L.teaId?' (names a tea)':' (no tea)')):'null (floor)'));
} else { console.log('  G skipped — no real CSVs (export-gate should have caught this)'); }

console.log('');
if(failed){ console.log('INSIGHT ENGINE TESTS FAILED — '+failed+' failed, '+passed+' passed'); process.exit(1); }
console.log('ALL INSIGHT-ENGINE TESTS PASSED ('+passed+' passed)');
