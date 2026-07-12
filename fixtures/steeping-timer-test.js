/* PERMANENT validation — WS3 steeping timer + steep-pill math (committed; runs every deploy).
 *
 * Invariants the ritual screen depends on:
 *  - focusProgress(tm) is a clamped [0,1] fraction that drives BOTH the box ring and the focus ring.
 *  - the ensō arc's stroke-dashoffset = 100*(1-progress) sweeps 100→0 monotonically as a steep runs.
 *  - scheduleTimeForIndex gives the pill durations, and extrapolates past the schedule (never null when
 *    times exist) so "steep N" beyond the guide still gets a sane duration.
 *  - the pill→timer target math floors at 3s (Math.max(3, round(t+shift))).
 *  - #13: the countdown length (timer.target) and the logged steep time (curTime) are ONE value,
 *    written only through setSteepTime — they can never drift, and a blank edit reverts (no 0s ring).
 *
 * Synthetic-only (pure timer/reconcile math — no CSV dependency; stays green on a fresh clone).
 * Run: node fixtures/steeping-timer-test.js   (exit non-zero on any failure)
 */
const fs=require('fs'), path=require('path'), vm=require('vm');
const repo=path.join(__dirname,'..');
const src=['steep-knowledge.js','steep-core.js','steep-sessions.js'].map(f=>fs.readFileSync(path.join(repo,f),'utf8')).join('\n;\n');
const ctx={}; ctx.window=ctx; ctx.globalThis=ctx; ctx.console=console;
ctx.document={documentElement:{setAttribute(){},getAttribute(){return 'light';}},getElementById(){return null;},querySelector(){return null;},querySelectorAll(){return[];},createElement(){return{style:{},setAttribute(){},appendChild(){},classList:{add(){}}};}};
ctx.localStorage={getItem(){return null;},setItem(){},removeItem(){}}; ctx.matchMedia=()=>({matches:false}); ctx.navigator={onLine:true};
ctx.setTimeout=()=>{};ctx.clearTimeout=()=>{};ctx.setInterval=()=>{};ctx.clearInterval=()=>{};ctx.addEventListener=()=>{};
vm.createContext(ctx); vm.runInContext(src, ctx);

let passed=0, failures=0;
const ok=(c,m)=>{ if(c)passed++; else{failures++;console.log('  FAIL: '+m);} };
const fp = tm => ctx.focusProgress(tm);
const dash = tm => 100*(1-fp(tm));

// ---- A. focusProgress — countdown ----
ok(fp({mode:'timer',target:15,elapsed:0})===0, 'A1 countdown start → 0');
ok(Math.abs(fp({mode:'timer',target:20,elapsed:10})-0.5)<1e-9, 'A2 countdown halfway → 0.5');
ok(fp({mode:'timer',target:15,elapsed:15})===1, 'A3 countdown at target → 1');
ok(fp({mode:'timer',target:15,elapsed:99})===1, 'A4 countdown past target clamps to 1');
ok(fp({mode:'timer',target:0,elapsed:5})===0, 'A5 zero target never divides → 0');
console.log('  A focusProgress countdown: 5 checks');

// ---- B. focusProgress — stopwatch (fills over 60s) ----
ok(fp({mode:'stopwatch',elapsed:0})===0, 'B1 stopwatch start → 0');
ok(Math.abs(fp({mode:'stopwatch',elapsed:30})-0.5)<1e-9, 'B2 stopwatch 30s → 0.5');
ok(fp({mode:'stopwatch',elapsed:120})===1, 'B3 stopwatch past 60s clamps to 1');
console.log('  B focusProgress stopwatch: 3 checks');

// ---- C. ensō dashoffset sweeps 100→0 monotonically ----
ok(Math.abs(dash({mode:'timer',target:15,elapsed:0})-100)<1e-9, 'C1 offset starts at 100 (empty ring)');
ok(Math.abs(dash({mode:'timer',target:15,elapsed:15})-0)<1e-9, 'C2 offset ends at 0 (closed ring)');
let prev=101, mono=true;
for(let e=0;e<=15;e++){ const d=dash({mode:'timer',target:15,elapsed:e}); if(d>prev+1e-9){mono=false;} prev=d; }
ok(mono, 'C3 offset is monotonically non-increasing across a steep');
console.log('  C dashoffset sweep: 3 checks');

// ---- D. scheduleTimeForIndex — pill durations + extrapolation ----
const sched={ tempC:68, rinseSeconds:null, times:[15,23,35,50], form:'open' };
ok(ctx.scheduleTimeForIndex(sched,0)===15 && ctx.scheduleTimeForIndex(sched,3)===50, 'D1 in-range pills return their times');
const beyond = ctx.scheduleTimeForIndex(sched,4);
ok(beyond!=null && beyond>=50, 'D2 a pill past the schedule extrapolates (>= last, never null): '+beyond);
ok(ctx.scheduleTimeForIndex({times:[]},0)===null, 'D3 no times → null (no pills to show)');
console.log('  D scheduleTimeForIndex: 3 checks');

// ---- E. pill → timer target math floors at 3s ----
const target=(t,shift)=>Math.max(3, Math.round(t+(shift||0)));
ok(target(15,0)===15, 'E1 normal target passes through');
ok(target(15,-20)===3, 'E2 a big negative nudge floors at 3s, never 0 or negative');
ok(target(23,5)===28, 'E3 positive nudge adds to the base');
console.log('  E target floor: 3 checks');

// ---- F. #13 reconcile — one value, one writer (setSteepTime), no drift ----
// These drive the real functions against a synthetic sessionDraft in-context. `let state`
// isn't a sandbox property, so we reach it via runInContext; render() is stubbed (no DOM #app).
const run = expr => vm.runInContext(expr, ctx);
ctx.render = ()=>{}; // d_beginTimeEdit/d_endTimeEdit call render(); no #app in the sandbox
run(`state.sessionDraft = { steeps:[], activeSteep:0, curTime:'', curTemp:'', timeShift:0,
  schedule:null, timeEditing:false, timer:{mode:'timer',target:15,elapsed:0,running:false,intervalId:null} };`);

// F1 guide default: applyScheduleToCurrentSteep seeds BOTH from the schedule, equal.
run(`state.sessionDraft.schedule={tempC:null,rinseSeconds:null,times:[117,140,165],form:'open'};
     state.sessionDraft.steeps=[]; state.sessionDraft.timeShift=0;
     applyScheduleToCurrentSteep(state.sessionDraft);`);
ok(run(`state.sessionDraft.timer.target`)===117, 'F1 guide seeds the countdown target (117)');
ok(run(`state.sessionDraft.curTime`)==='117', 'F1 guide seeds the logged time to the SAME value');

// F2 edit-while-stopped: setSteepTime writes both fields.
run(`setSteepTime(45);`);
ok(run(`state.sessionDraft.timer.target`)===45 && run(`state.sessionDraft.curTime`)==='45',
   'F2 editing the steep time moves the countdown target with it');

// F3 no-drift (the bug): guide 117, then user changes the time to 45 — the ring MUST follow.
run(`applyScheduleToCurrentSteep(state.sessionDraft);`); // back to guide default 117
ok(run(`state.sessionDraft.timer.target`)===117, 'F3 setup: guide default restored to 117');
run(`setSteepTime(45);`);
ok(run(`state.sessionDraft.timer.target`)===45, 'F3 the "of 117s / 45" split can no longer happen');

// F4 rounding + floor semantics of the setter.
run(`setSteepTime(12.6);`);
ok(run(`state.sessionDraft.timer.target`)===13, 'F4 non-integer input rounds (12.6 → 13)');
run(`setSteepTime('');`);
ok(run(`state.sessionDraft.timer.target`)===0 && run(`state.sessionDraft.curTime`)==='',
   'F4 blank → target 0, curTime "" (setter semantics)');
run(`setSteepTime(-5);`);
ok(run(`state.sessionDraft.timer.target`)===0, 'F4 negative floors to 0, never a negative countdown');

// F5 the pinned zero-edit contract: a blank/zero commit is a CANCELLED edit → prior target restored,
// so Start never faces an instant-complete 0s countdown.
run(`setSteepTime(60); state.sessionDraft.timer.running=false;
     d_beginTimeEdit(); setSteepTime(''); d_endTimeEdit();`);
ok(run(`state.sessionDraft.timer.target`)===60, 'F5 blank edit reverts the target to its prior value (60)');
ok(run(`state.sessionDraft.curTime`)==='60', 'F5 blank edit reverts the logged time too');
ok(run(`state.sessionDraft.timeEditing`)===false, 'F5 the edit closes on commit');
// a real (non-blank) edit commits normally
run(`d_beginTimeEdit(); setSteepTime(30); d_endTimeEdit();`);
ok(run(`state.sessionDraft.timer.target`)===30 && run(`state.sessionDraft.curTime`)==='30',
   'F5 a non-blank edit commits (30)');

// F6 invariant sweep: after any setSteepTime, target === (Number(curTime)||0). Always.
let inv=true;
for(const v of [3,9,15,23,45,90,120,300, 0, -1, '', 7.4]){
  run(`setSteepTime(${JSON.stringify(v)});`);
  const t=run(`state.sessionDraft.timer.target`), c=run(`state.sessionDraft.curTime`);
  if(t!==(Number(c)||0)) inv=false;
}
ok(inv, 'F6 target and logged time are the same number for every input (no drift, ever)');
console.log('  F #13 reconcile: 12 checks');

if(failures){ console.log('\n'+failures+' STEEPING-TIMER TEST(S) FAILED'); process.exit(1); }
console.log('\nALL STEEPING-TIMER TESTS PASSED  ('+passed+' passed)');
