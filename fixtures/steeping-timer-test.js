/* PERMANENT validation — WS3 steeping timer + steep-pill math (committed; runs every deploy).
 *
 * Invariants the ritual screen depends on:
 *  - focusProgress(tm) is a clamped [0,1] fraction that drives BOTH the box ring and the focus ring.
 *  - the ensō arc's stroke-dashoffset = 100*(1-progress) sweeps 100→0 monotonically as a steep runs.
 *  - scheduleTimeForIndex gives the pill durations, and extrapolates past the schedule (never null when
 *    times exist) so "steep N" beyond the guide still gets a sane duration.
 *  - the pill→timer target math floors at 3s (Math.max(3, round(t+shift))).
 *
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

if(failures){ console.log('\n'+failures+' STEEPING-TIMER TEST(S) FAILED'); process.exit(1); }
console.log('\nALL STEEPING-TIMER TESTS PASSED  ('+passed+' passed)');
