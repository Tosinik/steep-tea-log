/* PERMANENT validation — v3.83 quickLogSession draft-discard guard (committed; runs every deploy).
 *
 * Invariants (issue #23 audit F4 — the WS6 bottom bar renders Log during the session flow):
 *  - sessionDraftDirty: null → false; any stage past 'setup' → true (steeping/finish/quick carry
 *    logged work); in 'setup' only a form edited away from its fresh-draft fingerprint is dirty,
 *    and reverting an edit makes it clean again (fingerprint equality, not a touched flag).
 *  - UI-state fields (showMoreDetails, flavorMore, …) never dirty the draft.
 *  - quickLogSession(btn): clean/no draft → replaces silently; dirty + btn → arms the two-step
 *    confirm and leaves the draft UNTOUCHED until Yes; dirty + no btn → never silently discards,
 *    routes back to the session view instead.
 *  - startSessionFor clears the old draft's running interval (no orphaned tick after replacement).
 *
 * Sections A–C are synthetic (stay green on a fresh clone). Section D grounds the round-trip in the
 * real CSV exports and SKIPS with a reported count when the gitignored CSVs are absent.
 * Run: node fixtures/log-guard-test.js   (exit non-zero on any failure)
 */
const fs=require('fs'), path=require('path'), vm=require('vm');
const repo=path.join(__dirname,'..');
const src=['steep-knowledge.js','steep-core.js','steep-sessions.js'].map(f=>fs.readFileSync(path.join(repo,f),'utf8')).join('\n;\n');
const ctx={}; ctx.window=ctx; ctx.globalThis=ctx; ctx.console=console;
ctx.document={documentElement:{setAttribute(){},getAttribute(){return 'light';}},getElementById(){return null;},querySelector(){return null;},querySelectorAll(){return[];},createElement(){return{style:{},setAttribute(){},appendChild(){},classList:{add(){}}};}};
ctx.localStorage={getItem(){return null;},setItem(){},removeItem(){}}; ctx.matchMedia=()=>({matches:false}); ctx.navigator={onLine:true};
let clearedIds=[];
ctx.setTimeout=()=>{};ctx.clearTimeout=()=>{};ctx.setInterval=()=>{};ctx.clearInterval=id=>{clearedIds.push(id);};ctx.addEventListener=()=>{};
vm.createContext(ctx); vm.runInContext(src, ctx);
vm.runInContext('state.settings=Object.assign({},DEFAULT_SETTINGS);', ctx);
const S=vm.runInContext('state', ctx);   // `const state` doesn't attach to the ctx object — grab the reference
// Neutralise DOM-touching house machinery; record what the guard routes to instead.
let armed=[], toasts=[];
vm.runInContext('render=function(){};', ctx);
ctx.showToast=m=>{toasts.push(m);};
ctx.armConfirm=(btn,msg,onYes)=>{armed.push({msg,onYes});};
vm.runInContext('armConfirm=window.armConfirm; showToast=window.showToast;', ctx);

let passed=0, failures=0;
const ok=(c,m)=>{ if(c)passed++; else{failures++;console.log('  FAIL: '+m);} };
const FAKE_BTN={style:{}};
const seed=()=>{ S.teas=[{id:'T1',name:'Sencha',type:'green',amountGrams:40},{id:'T2',name:'Shou',type:'puerh',amountGrams:0}];
  S.vessels=[{id:'V1',name:'Gaiwan',capacityMl:120}]; S.sessionDraft=null; armed=[]; toasts=[]; clearedIds=[]; };

// ---- A. sessionDraftDirty — the predicate ----
seed();
ok(ctx.sessionDraftDirty(null)===false, 'A1 no draft → not dirty');
ctx.startSessionFor(null);
const d=S.sessionDraft;
ok(d && d.stage==='setup' && ctx.sessionDraftDirty(d)===false, 'A2 fresh setup draft → not dirty');
d.gramsUsed='4.5';
ok(ctx.sessionDraftDirty(d)===true, 'A3 gramsUsed edit → dirty');
d.gramsUsed='';
ok(ctx.sessionDraftDirty(d)===false, 'A4 reverting the edit → clean again (fingerprint, not a flag)');
d.teaId='T2';
ok(ctx.sessionDraftDirty(d)===true, 'A5 tea change → dirty');
d.teaId='T1';
d.sessionDate='2026-07-01T09:00';
ok(ctx.sessionDraftDirty(d)===true, 'A6 "when" edit → dirty');
seed(); ctx.startSessionFor(null);
const d2=S.sessionDraft;
d2.showMoreDetails=true; d2.flavorMore=true; d2.flavorFreeOpen=true;
ok(ctx.sessionDraftDirty(d2)===false, 'A7 UI-state toggles (fold/chips) never dirty the draft');
d2.mood='steady';
ok(ctx.sessionDraftDirty(d2)===true, 'A8 mood chip → dirty');
d2.mood=null;
['steeping','finish','quick'].forEach(st=>{ d2.stage=st;
  ok(ctx.sessionDraftDirty(d2)===true, 'A9 stage '+st+' → always dirty (even with pristine fields)'); });
console.log('  A sessionDraftDirty: 11 checks');

// ---- B. quickLogSession — guard routing ----
seed();
ctx.quickLogSession(FAKE_BTN);
ok(!!S.sessionDraft && armed.length===0, 'B1 no prior draft → starts silently, nothing armed');
const b_first=S.sessionDraft;
ctx.quickLogSession(FAKE_BTN);
ok(S.sessionDraft!==b_first && armed.length===0, 'B2 clean setup draft → replaced silently');
const b_dirty=S.sessionDraft; b_dirty.gramsUsed='5';
ctx.quickLogSession(FAKE_BTN);
ok(armed.length===1 && armed[0].msg==='Discard the session in progress?', 'B3 dirty draft + button → arms the two-step confirm');
ok(S.sessionDraft===b_dirty && b_dirty.gramsUsed==='5', 'B4 draft untouched while the confirm is armed');
armed[0].onYes();
ok(S.sessionDraft!==b_dirty && S.sessionDraft.stage==='setup' && ctx.sessionDraftDirty(S.sessionDraft)===false, 'B5 Yes → fresh clean draft replaces the old one');
const b_steep=S.sessionDraft; b_steep.stage='steeping'; S.view='dashboard';
ctx.quickLogSession();
ok(S.sessionDraft===b_steep && armed.length===1 && S.view==='session', 'B6 dirty + no button → never discards, routes back to the session');
seed(); S.teas=[];
ctx.quickLogSession(FAKE_BTN);
ok(!S.sessionDraft && toasts.some(t=>/tea first/i.test(t)), 'B7 no teas → early toast path, guard never reached');
console.log('  B quickLogSession routing: 7 checks');

// ---- C. startSessionFor — interval hygiene ----
seed(); ctx.startSessionFor(null);
const c_old=S.sessionDraft;
c_old.timer.intervalId=42; c_old.timer.running=true; c_old.stage='steeping';
ctx.startSessionFor(null);
ok(clearedIds.includes(42), 'C1 replacing the draft clears the old running interval');
ok(c_old.timer.intervalId===null, 'C2 old timer handle nulled (no double-clear target left behind)');
ok(S.sessionDraft.timer.intervalId===null && S.sessionDraft.timer.running===false, 'C3 new draft starts with a stopped timer');
console.log('  C interval hygiene: 3 checks');

// ---- D. real-data grounding (skips without the private CSVs) ----
function parseCSV(t){const R=[];let r=[],c='',q=false;for(let i=0;i<t.length;i++){const ch=t[i];
 if(q){if(ch==='"'){if(t[i+1]==='"'){c+='"';i++;}else q=false;}else c+=ch;}
 else if(ch==='"')q=true;else if(ch===','){r.push(c);c='';}
 else if(ch==='\n'){r.push(c);R.push(r);r=[];c='';}else if(ch!=='\r')c+=ch;}
 if(c||r.length){r.push(c);R.push(r);}
 const h=R[0];return R.slice(1).filter(x=>x.length===h.length)
   .map(x=>Object.fromEntries(h.map((k,i)=>[k,x[i]])));}
const teasCsv=path.join(__dirname,'teas_rows.csv'), vesCsv=path.join(__dirname,'vessels_rows.csv');
if(fs.existsSync(teasCsv) && fs.existsSync(vesCsv)){
  S.teas=parseCSV(fs.readFileSync(teasCsv,'utf8')).map(r=>({id:r.id,name:r.name,type:r.type,
    amountGrams:r.amount_grams===''?null:Number(r.amount_grams),isFavorite:r.is_favorite==='true'||r.is_favorite==='t'}));
  S.vessels=parseCSV(fs.readFileSync(vesCsv,'utf8')).map(r=>({id:r.id,name:r.name,
    capacityMl:r.capacity_ml===''?null:Number(r.capacity_ml)}));
  S.sessionDraft=null; armed=[];
  ctx.startSessionFor(null);
  const rd=S.sessionDraft, rt=S.teas.find(t=>t.id===rd.teaId);
  ok(!!rt && !ctx.isTeaFinished(rt), 'D1 real shelf: fresh draft defaults to an in-stock tea');
  ok(ctx.sessionDraftDirty(rd)===false, 'D2 real shelf: fresh draft reads clean');
  rd.stage='finish';
  ctx.quickLogSession(FAKE_BTN);
  ok(armed.length===1 && S.sessionDraft===rd, 'D3 real shelf: finish-screen mis-tap arms, session survives');
  console.log('  D real-data grounding: 3 checks');
}else{
  console.log('  D real-data grounding: SKIPPED (private CSVs absent) — 3 checks not run');
}

if(failures){ console.log(`LOG-GUARD TESTS FAILED (${failures} failed, ${passed} passed)`); process.exit(1); }
console.log(`ALL LOG-GUARD TESTS PASSED (${passed} passed)`);
