/* PERMANENT validation — the session-edit round trip (committed; every deploy).
 *
 * WHY THIS EXISTS, AND WHY IT WAS WRITTEN BEFORE THE SURFACE MOVED.
 *
 * The edit surface shows a session's OVERALL tags. It does not show per-steep taste words
 * (steeps[].tags) or the v3.89 per-steep strength tap (steeps[].feedback). Those survive an edit
 * only because openSessionEdit takes a DEEP COPY (JSON.parse(JSON.stringify(s))) and saveSessionEdit
 * writes the WHOLE OBJECT back (state.sessions[idx] = e). Neither mechanism is announced anywhere in
 * the UI; both are load-bearing. R57 rules the un-surfaced gap gets built as drawn, so the copy
 * semantics must survive the modal→screen move (R58) verbatim.
 *
 * On the current export that is 67 field-values at risk: 30 steeps carry real taste tags and 37 carry
 * per-steep feedback, across 40 sessions / 133 steeps. If the move broke the copy, nothing would
 * surface it — no error, no visible change — and the user would find out weeks later when a tasting
 * note they wrote was gone. Silent is the whole problem.
 *
 * THE ASSERTION MUST DISTINGUISH EMPTY FROM ABSENT. 103 of the 133 steeps carry [] and 30 carry real
 * words. A check that treated those alike could pass while deleting every real value — it would only
 * be comparing "falsy to falsy" on the majority and never notice the minority vanish.
 *
 * This suite was run GREEN against the unmoved modal first, so it measures known-good behaviour
 * rather than whatever the move produced. It must stay green and UNEDITED across the move: a guard
 * adjusted while the surface changes proves nothing.
 *
 * WHAT IT ACTUALLY CATCHES — verified with two negative controls, not assumed:
 *   · deep copy replaced by Object.assign (a SHALLOW copy)  → section B goes red, C stays GREEN.
 *     Aliasing doesn't lose data, it shares it: the draft and the store point at the same steeps, so
 *     nothing looks missing afterwards. Only B's identity checks see it — and an aliased draft means
 *     a cancelled edit silently keeps its changes.
 *   · whole-object writeback replaced by an enumerated field list → C and D go red (30 of 30 taste
 *     words and 37 of 37 feedback values lost), B stays GREEN.
 * So B and C cover different failure modes and neither substitutes for the other. That is the reason
 * both are here, and the reason neither may be dropped as redundant later.
 *
 * Run: node fixtures/session-edit-test.js   (exit non-zero on any failure)
 */
const fs=require('fs'), path=require('path'), vm=require('vm');
const repo=path.join(__dirname,'..');
const SRC=['steep-knowledge.js','steep-tea-types.js','steep-core.js','steep-dashboard.js','steep-teas.js','steep-reference.js','steep-sessions.js']
  .map(f=>fs.readFileSync(path.join(repo,f),'utf8')).join('\n;\n');
const ctx={};ctx.window=ctx;ctx.globalThis=ctx;ctx.console=console;
ctx.document={documentElement:{setAttribute(){},getAttribute(){return'light'}},
  getElementById:()=>null,querySelectorAll:()=>[],
  createElement:()=>({style:{},setAttribute(){},appendChild(){},classList:{add(){}}})};
ctx.localStorage={getItem:()=>null,setItem(){},removeItem(){}};
ctx.matchMedia=()=>({matches:false});ctx.navigator={onLine:true};
ctx.setTimeout=()=>{};ctx.clearTimeout=()=>{};ctx.setInterval=()=>{};ctx.clearInterval=()=>{};
ctx.addEventListener=()=>{};
vm.createContext(ctx);vm.runInContext(SRC,ctx);
vm.runInContext('state.settings=Object.assign({},DEFAULT_SETTINGS);',ctx);
// After the load — function declarations in the bundle become sandbox properties and would
// overwrite a stub set earlier. This suite drives real state transitions, so these actually fire.
ctx.render=()=>{}; ctx.showToast=()=>{};
ctx.SteepDB={ putTea:()=>Promise.resolve(), putSession:()=>Promise.resolve() };
ctx.persistSession=()=>{}; ctx.persistTea=()=>{}; ctx.syncAchievements=()=>{};
const S = vm.runInContext('state', ctx);

let passed=0, failures=0;
const ok=(c,m)=>{ if(c){passed++;} else {failures++; console.log('  FAIL: '+m);} };

/* ---- real export, owner-scoped (R69) ---- */
function parseCSV(t){const R=[];let r=[],f='',q=false;
  for(let i=0;i<t.length;i++){const c=t[i];
    if(q){ if(c==='"'){ if(t[i+1]==='"'){f+='"';i++;} else q=false; } else f+=c; }
    else if(c==='"') q=true; else if(c===','){ r.push(f);f=''; }
    else if(c==='\n'){ r.push(f);R.push(r);r=[];f=''; } else if(c!=='\r') f+=c; }
  if(f.length||r.length){r.push(f);R.push(r);}
  const h=R.shift(); return R.filter(x=>x.length>1).map(x=>Object.fromEntries(h.map((k,i)=>[k.trim(),x[i]])));}
const have = n => fs.existsSync(path.join(__dirname,n));
const rows = n => parseCSV(fs.readFileSync(path.join(__dirname,n),'utf8'));

if(!have('sessions_rows.csv') || !have('steeps_rows.csv')){
  console.log('  SKIPPED — private CSVs absent. This suite is only meaningful against real data.');
  console.log('\nALL SESSION-EDIT TESTS PASSED (0 passed, suite skipped)');
  process.exit(0);
}
const rawSes = rows('sessions_rows.csv');
const OWNER = rawSes[0].user_id;
const jsonOrEmpty = v => { try{ const p=JSON.parse(v||'[]'); return Array.isArray(p)?p:[]; }catch(e){ return []; } };
const steepsBySession = {};
rows('steeps_rows.csv').forEach(r=>{
  (steepsBySession[r.session_id] = steepsBySession[r.session_id] || []).push({
    id:r.id, order:Number(r.steep_order), tempC:r.temp_c===''?null:Number(r.temp_c),
    timeSeconds:Number(r.time_seconds)||0, description:r.description||'',
    tags:jsonOrEmpty(r.tags), feedback:r.feedback||null });
});
Object.values(steepsBySession).forEach(a=>a.sort((x,y)=>x.order-y.order));
const sessions = rawSes.filter(r=>r.user_id===OWNER).map(r=>({
  id:r.id, userId:r.user_id, teaId:r.tea_id, vesselId:r.vessel_id, date:r.session_date,
  isColdBrew:r.is_cold_brew==='true', waterType:r.water_type||'', waterTDS:r.water_tds===''?null:Number(r.water_tds),
  gramsUsed:Number(r.grams_used)||0, rating:Number(r.rating)||0, description:r.description||'',
  tags:jsonOrEmpty(r.tags), isShared:r.is_shared==='true', teaName:r.tea_name||'', teaType:r.tea_type||'',
  vesselName:r.vessel_name||'', infusionCount:r.infusion_count===''?null:Number(r.infusion_count),
  photoUrl:r.photo_url||null, feedback:r.feedback||null, mood:r.mood||null,
  waterMl:r.water_ml===''?null:Number(r.water_ml), brewStyle:r.brew_style||null,
  steeps:(steepsBySession[r.id]||[]) }));
const teas = rows('teas_rows.csv').filter(r=>r.user_id===OWNER)
  .map(r=>({id:r.id,name:r.name,type:r.type,amountGrams:Number(r.amount_grams)||0}));
const vessels = rows('vessels_rows.csv').filter(r=>r.user_id===OWNER)
  .map(r=>({id:r.id,name:r.name,type:r.type,capacityMl:Number(r.capacity_ml)||null}));

/* The values at risk — counted, and REPORTED, so the suite can never quietly cover nothing. */
const realTagSteeps  = sessions.flatMap(s=>s.steeps).filter(st=>st.tags && st.tags.length>0);
const emptyTagSteeps = sessions.flatMap(s=>s.steeps).filter(st=>Array.isArray(st.tags) && st.tags.length===0);
const fbSteeps       = sessions.flatMap(s=>s.steeps).filter(st=>st.feedback);
const atRisk = realTagSteeps.length + fbSteeps.length;
console.log('  at risk: '+realTagSteeps.length+' steeps with REAL tags · '+fbSteeps.length+
  ' with per-steep feedback = '+atRisk+' values, across '+sessions.length+' sessions / '+
  sessions.flatMap(s=>s.steeps).length+' steeps ('+emptyTagSteeps.length+' carry [])');

/* ---- A. the sample is real, and empty is distinguished from absent ---- */
ok(sessions.length>0, 'A1 the export loaded ('+sessions.length+' owner-scoped sessions)');
ok(realTagSteeps.length>0, 'A2 some steeps carry REAL taste words — without these the suite covers nothing');
ok(emptyTagSteeps.length>0, 'A3 …and some carry [] — the two must be distinguishable, or a delete looks like a pass');
ok(fbSteeps.length>0, 'A4 some steeps carry per-steep feedback (the v3.89 tap)');
// The trap, asserted directly: [] and absent are NOT the same value, and the suite must know it.
ok(JSON.stringify([])!==JSON.stringify(undefined), 'A5 [] and undefined serialise differently — the comparison can tell them apart');
console.log('  A the sample: 5 checks');

/* ---- B. openSessionEdit takes a DEEP copy ---- */
S.teas=teas; S.vessels=vessels; S.sessions=JSON.parse(JSON.stringify(sessions));
const target = S.sessions.find(s=>s.steeps.some(st=>st.tags&&st.tags.length)) || S.sessions[0];
ctx.openSessionEdit(target.id);
const draft = S.editingSession;
ok(draft && draft.id===target.id, 'B1 the draft is the requested session');
ok(draft!==target, 'B2 the draft is a different object from the stored session');
ok(draft.steeps!==target.steeps, 'B3 …and its steeps array is a different array (a shallow copy would share it)');
ok(draft.steeps[0]!==target.steeps[0], 'B4 …and each steep object too');
if(draft.steeps[0] && Array.isArray(draft.steeps[0].tags)){
  ok(draft.steeps[0].tags!==target.steeps[0].tags, 'B5 …down to the per-steep tags array itself');
}else{ ok(true,'B5 (no tags array on steep 0 of this session)'); }
// Mutating the draft must not reach the store until saveSessionEdit says so.
const before = JSON.stringify(target.steeps);
draft.steeps[0].description = 'MUTATED IN THE DRAFT';
if(Array.isArray(draft.steeps[0].tags)) draft.steeps[0].tags.push('mutant');
ok(JSON.stringify(S.sessions.find(s=>s.id===target.id).steeps)===before,
   'B6 mutating the draft leaves the stored session untouched — the copy is genuinely deep');
ctx.closeSessionEdit();
console.log('  B deep copy: 6 checks');

/* ---- C. the round trip preserves every un-surfaced field, on EVERY session ---- */
/* Surfaced by the edit surface: teaId · vesselId · brewStyle · isColdBrew · gramsUsed · waterMl ·
   date · mood · rating · description · session tags · infusionCount · isShared · and per steep
   tempC / timeSeconds / description. Everything else must come out the way it went in. */
const UNSURFACED_STEEP = ['tags','feedback','id','order'];
const UNSURFACED_SESSION = ['feedback','photoUrl','waterType','waterTDS','userId'];
let tripFails = [], tagsLost = 0, fbLost = 0;
sessions.forEach(orig=>{
  S.sessions = JSON.parse(JSON.stringify(sessions));
  S.editingSession = null; S.sessionEditOpen = false;
  ctx.openSessionEdit(orig.id);
  const e = S.editingSession;
  // Touch ONLY surfaced fields, the way a user editing the screen would.
  ctx.es_set('description', (e.description||'') + ' [edited]');
  // es_set, not setEditSessionRating — that helper writes innerHTML directly, so it is a DOM
  // affordance rather than a state path. The field it sets is the same one.
  ctx.es_set('rating', 4);
  if(e.steeps.length) ctx.es_setSteep(0,'description','a note the user typed');
  ctx.saveSessionEdit();
  const after = S.sessions.find(s=>s.id===orig.id);
  if(!after){ tripFails.push(orig.id+': session vanished'); return; }
  UNSURFACED_SESSION.forEach(k=>{
    if(JSON.stringify(after[k])!==JSON.stringify(orig[k])) tripFails.push(orig.id+' session.'+k);
  });
  if(after.steeps.length!==orig.steeps.length){ tripFails.push(orig.id+': steep count changed'); return; }
  orig.steeps.forEach((st,i)=>{
    UNSURFACED_STEEP.forEach(k=>{
      if(JSON.stringify(after.steeps[i][k])!==JSON.stringify(st[k])){
        tripFails.push(orig.id+' steep#'+i+'.'+k);
        if(k==='tags' && st.tags && st.tags.length) tagsLost++;
        if(k==='feedback' && st.feedback) fbLost++;
      }
    });
  });
});
ok(tripFails.length===0, 'C1 every un-surfaced field survives an edit on all '+sessions.length+
   ' sessions'+(tripFails.length?' — lost: '+tripFails.slice(0,8).join(', ')+(tripFails.length>8?' …+'+(tripFails.length-8):''):''));
ok(tagsLost===0, 'C2 no REAL taste words were lost ('+tagsLost+' of '+realTagSteeps.length+')');
ok(fbLost===0, 'C3 no per-steep feedback was lost ('+fbLost+' of '+fbSteeps.length+')');
console.log('  C round trip over the whole export: 3 checks');

/* ---- D. the writeback is WHOLE-OBJECT, not field-by-field ---- */
S.sessions = JSON.parse(JSON.stringify(sessions));
const t2 = S.sessions.find(s=>s.steeps.some(st=>st.feedback)) || S.sessions[0];
ctx.openSessionEdit(t2.id);
// A field the surface never touches, invented in the draft: a field-by-field writeback would drop it.
S.editingSession._canaryUnsurfaced = 'survives only under whole-object writeback';
ctx.saveSessionEdit();
const saved = S.sessions.find(s=>s.id===t2.id);
ok(saved._canaryUnsurfaced==='survives only under whole-object writeback',
   'D1 the whole draft object replaces the stored session — an enumerated field list would drop this');
ok(saved.steeps.length===t2.steeps.length, 'D2 …with its steeps intact');
console.log('  D whole-object writeback: 2 checks');

/* ---- E. the mechanisms are still in the source, named ---- */
const sessSrc = fs.readFileSync(path.join(repo,'steep-sessions.js'),'utf8');
ok(/JSON\.parse\(JSON\.stringify\(/.test(sessSrc), 'E1 the deep copy is still literally there');
ok(/state\.sessions\[idx\]\s*=\s*e;/.test(sessSrc), 'E2 the whole-object writeback is still literally there');
// The gap R57 documents: the edit surface must not silently start writing per-steep tags either.
ok(!/es_setSteep\(\s*\d+\s*,\s*'tags'/.test(sessSrc) && !/es_setSteep\([^)]*,'feedback'/.test(sessSrc),
   'E3 the edit surface still does not write per-steep tags or feedback (R57: the gap is documented, not silently filled)');
console.log('  E mechanisms present: 3 checks');

console.log(failures ? '\n'+failures+' SESSION-EDIT TEST(S) FAILED' : '\nALL SESSION-EDIT TESTS PASSED ('+passed+' passed)');
process.exit(failures?1:0);
