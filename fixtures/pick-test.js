/* PERMANENT validation — v4.21 (#14): the tea & vessel picker SCREENS (board 04 rev 6, R58). Guards the
 * two invariants a select→screen swap can silently break: (1) the native <select>s are RETIRED and the
 * setup/quick/edit fields OPEN the picker; (2) pickChoose dispatches BY KIND to the EXISTING setter so
 * its side effects run — crucially d_setVessel's methodPrefillFor is NOT bypassed by a raw vesselId
 * write (ruling 1). Plus finished-teas handling (ruling 3) and the optional "No vessel" choice (R43).
 *
 * Synthetic teas are used for the finished-teas edge case (explicit control, per the vm-fixture
 * convention); the vessel rows are real-shaped and include a Kyusu so the method prefill is exercised.
 * Run: node fixtures/pick-test.js   (exit non-zero on any failure)
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
// render() reaches for #app, which does not exist here — stub AFTER the load so the bundle's own
// declaration doesn't overwrite the stub. The suite drives real state transitions and asserts state.
ctx.render=()=>{}; ctx.showToast=()=>{};
const G = expr => vm.runInContext(expr, ctx);
const S = G('state');
let passed=0, failures=0;
const ok=(c,m)=>{ if(c){passed++;} else {failures++; console.log('  FAIL: '+m);} };

S.teas = [
  {id:'ta', name:'Active Green', type:'green', amountGrams:20, costOriginalGrams:50, purchaseType:'first'},
  {id:'tb', name:'Active Oolong', type:'oolong', amountGrams:15, costOriginalGrams:50, purchaseType:'first'},
  {id:'tf', name:'Finished White', type:'white', amountGrams:0, costOriginalGrams:50, purchaseType:'first'},
];
S.vessels = [
  {id:'vg', name:'Dragon Gaiwan', type:'Gaiwan', material:'Clay', capacityMl:110},
  {id:'vk', name:'Main Kyusu', type:'Kyusu', material:'Clay', capacityMl:210},
];
ok(G('isTeaFinished')(S.teas[2])===true && G('isTeaFinished')(S.teas[0])===false,
   'pre the synthetic teas read as intended — tf finished, ta active');

/* ---- A. the native selects are RETIRED; the fields open the picker ---- */
G('startSessionFor')('ta');
const setup = G('sessionSetupHTML')(S.sessionDraft);
ok(!/class="trio-select/.test(setup) && !/onchange="d_setTea/.test(setup) && !/onchange="d_setVessel/.test(setup),
   'A1 setup has NO native tea/vessel <select> — the OS pop-out is gone');
ok(/openPicker\('draft-tea','session'\)/.test(setup) && /openPicker\('draft-vessel','session'\)/.test(setup),
   'A2 …the setup fields OPEN the picker screens instead');
G('beginQuickLog')();
const quick = G('sessionQuickHTML')(S.sessionDraft);
ok(/openPicker\('draft-tea','session'\)/.test(quick) && /openPicker\('draft-vessel','session'\)/.test(quick) && !/class="trio-select/.test(quick),
   'A3 the quick-log twin retires its selects too (one vocabulary)');
const sessSrc = fs.readFileSync(path.join(repo,'steep-sessions.js'),'utf8');
ok(!/onchange="es_set\('vesselId'/.test(sessSrc) && /openPicker\('edit-vessel','session-edit'\)/.test(sessSrc),
   'A4 the edit modal\'s vessel <select> is retired → opens the edit-vessel picker');
console.log('  A select retirement: 4 checks (+1 pre)');

/* ---- B. pickChoose dispatches BY KIND to the existing setter (side effects run) ---- */
G('startSessionFor')('ta');
G('openPicker')('draft-tea','session');
ok(S.view==='pick-tea' && S.pickerCtx && S.pickerCtx.kind==='draft-tea', 'B1 openPicker opens the tea screen with a ctx tag');
G('pickChoose')('tb');
ok(S.sessionDraft.teaId==='tb' && S.view==='session' && S.pickerCtx===null,
   'B2 pickChoose(draft-tea) writes through d_setTea and returns to the setup view');
S.sessionDraft.brewStyle=null; S.sessionDraft.brewStyleLocked=false;
G('openPicker')('draft-vessel','session');
G('pickChoose')('vk');
ok(S.sessionDraft.vesselId==='vk', 'B3 pickChoose(draft-vessel) writes the vessel');
ok(S.sessionDraft.brewStyle==='senchado',
   'B4 …THROUGH d_setVessel, so methodPrefillFor ran — a Kyusu set brewStyle senchado, NOT bypassed by a raw write (ruling 1)');
S.editingSession = { id:'s1', vesselId:'vg', steeps:[] };
G('openPicker')('edit-vessel','session-edit');
G('pickChoose')('vk');
ok(S.editingSession.vesselId==='vk' && S.view==='session-edit',
   'B5 pickChoose(edit-vessel) writes editingSession.vesselId via es_set and returns to the edit screen');
console.log('  B dispatch by kind: 5 checks');

/* ---- C. finished-teas in the tea picker (ruling 3) ---- */
G('startSessionFor')('ta'); S.sessionDraft.showFinishedTeas=false;
S.pickerCtx={kind:'draft-tea',returnView:'session',currentId:'ta'}; S.pickerQuery=''; S.pickerFilter='';
const listHid = G('pickTeaListHTML')();
ok(!/Finished White/.test(listHid) && /show finished/.test(listHid),
   'C1 finished teas are HIDDEN by default, behind a "show finished (n)" toggle');
S.sessionDraft.showFinishedTeas=true;
ok(/Finished White/.test(G('pickTeaListHTML')()), 'C2 …and appear when the toggle is on');
S.sessionDraft.showFinishedTeas=false; S.pickerCtx.currentId='tf';
ok(/Finished White/.test(G('pickTeaListHTML')()),
   'C3 a finished tea that is the CURRENT selection is shown regardless of the toggle');
console.log('  C finished teas: 3 checks');

/* ---- D. the optional "No vessel" choice (R43) ---- */
S.pickerCtx={kind:'draft-vessel',returnView:'session',currentId:'vk'}; S.pickerQuery='';
ok(/No vessel/.test(G('pickVesselListHTML')()), 'D1 the vessel picker offers a "No vessel" row — optional means selectable-as-none');
G('startSessionFor')('ta'); S.sessionDraft.vesselId='vk';
G('openPicker')('draft-vessel','session');
G('pickChoose')('');
ok(S.sessionDraft.vesselId==='' && S.view==='session', 'D2 choosing "No vessel" clears the vessel (no throw, no prefill)');
console.log('  D optional vessel: 2 checks');

if(failures){ console.log('\n'+failures+' FAILED'); process.exit(1); }
console.log('\nALL PICK TESTS PASSED ('+passed+' passed)');
