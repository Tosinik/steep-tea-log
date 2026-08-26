/* PERMANENT validation — v4.18 (#33 wake-lock R7 + #30-B pause-on-hide, R142) — committed.
 *
 * THE INVARIANT: the screen wake lock follows the timer's RUNNING state, never the existence of a
 * session (R142). Acquire when the timer runs, release when it stops, re-acquire on return to the app
 * ONLY while running — so a timer paused on background does not hold the screen awake over a frozen
 * clock (the inverted calm-first waste R7 exists to prevent). A mechanical edit could quietly drop
 * the running-guard and hold the lock over a paused steep; this suite reddens if it does.
 *
 * NON-AUTOMATABLE GATE (do not delete): navigator.wakeLock has no vm reach — the SCREEN staying lit
 * and the lock following running-state are verified BY NIKLAS ON DEVICE (smoke.md, v4.18). What runs
 * here: onAppHidden's pause logic (pure state), and the source facts of the lock wiring.
 *
 * Run: node fixtures/wake-timer-test.js   (exit non-zero on any failure)
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
ctx.matchMedia=()=>({matches:false});ctx.navigator={onLine:true};      // NO wakeLock — acquire must no-op, never throw
ctx.setTimeout=()=>{};ctx.clearTimeout=()=>{};ctx.setInterval=()=>7;ctx.clearInterval=()=>{};
ctx.addEventListener=()=>{};
vm.createContext(ctx);vm.runInContext(SRC,ctx);
ctx.render=()=>{}; ctx.showToast=()=>{};
const G=e=>vm.runInContext(e,ctx);
// string-aware comment stripper (naive /* */ eats accept="image/*" — see session-draft-test.js).
function strip(src){ let out='',i=0,q=null; const n=src.length;
  while(i<n){ const c=src[i],d=src[i+1];
    if(q){ out+=c; if(c==='\\'){ out+=(d==null?'':d); i+=2; continue; } if(c===q) q=null; i++; continue; }
    if(c==='"'||c==="'"||c==='`'){ q=c; out+=c; i++; continue; }
    if(c==='/'&&d==='*'){ i+=2; while(i<n&&!(src[i]==='*'&&src[i+1]==='/')) i++; i+=2; out+=' '; continue; }
    if(c==='/'&&d==='/'){ i+=2; while(i<n&&src[i]!=='\n') i++; out+=' '; continue; }
    out+=c; i++; }
  return out; }
let passed=0, failures=0;
const ok=(c,m)=>{ if(c){passed++;} else {failures++; console.error('FAIL: '+m); } };

const withTimer = (running) => G('state.sessionDraft={teaId:"t",vesselId:"v",steeps:[],stage:"steeping",timer:{mode:"timer",target:25,elapsed:12,running:'+running+',intervalId:'+(running?'7':'null')+'}}; state.view="session"; state.loaded=true;');

/* ---- A · onAppHidden — #30-B pause-on-hide (pure state, runnable) ---- */
withTimer(true);
ok(G('onAppHidden()')===true, 'A1 onAppHidden pauses a RUNNING steep and reports it');
ok(G('state.sessionDraft.timer.running')===false && G('state.sessionDraft.timer.intervalId')===null,
   'A2 …the timer is now paused with no live interval — it holds where it was, no wall-clock guess (R142)');
ok(G('state.sessionDraft.timer.elapsed')===12, 'A3 …and elapsed is UNCHANGED — frozen at the last observed value, not advanced');
withTimer(false);
ok(G('onAppHidden()')===false && G('state.sessionDraft.timer.running')===false,
   'A4 an already-PAUSED timer is untouched (no double-pause, no side effects)');
G('state.sessionDraft=null;');
ok(G('onAppHidden()')===false, 'A5 no draft → no-op (safe to fire on any hide)');

/* ---- B · timerRunning + acquire never throws without wakeLock ---- */
withTimer(true);  ok(G('timerRunning()')===true,  'B1 timerRunning true while running');
withTimer(false); ok(G('timerRunning()')===false, 'B2 timerRunning false while paused');
ok(G('(function(){ try{ acquireWakeLock(); releaseWakeLock(); return "ok"; }catch(e){ return "threw:"+e.message; } })()')==='ok',
   'B3 acquire/release are fail-silent on a browser with no wakeLock — never throw (the vm navigator has none, like an old phone)');

/* ---- C · #33 wiring — the lock follows RUNNING, source-asserted (no vm reach) ---- */
const sess=strip(fs.readFileSync(path.join(repo,'steep-sessions.js'),'utf8'));
// acquire only where the timer STARTS running; release on every stop.
const startPause=(sess.match(/function timerStartPause\(\)\{[\s\S]*?\n\}/)||[''])[0];
ok(/tm\.running=true;\s*acquireWakeLock\(\)/.test(startPause), 'C1 acquireWakeLock fires exactly when the timer starts running (in timerStartPause)');
ok((startPause.match(/releaseWakeLock\(\)/g)||[]).length>=2, 'C2 releaseWakeLock fires on pause AND on auto-complete inside timerStartPause');
ok(/function clearTimerInterval\([\s\S]*?releaseWakeLock\(\)/.test(sess), 'C3 clearTimerInterval releases too — cancel/reset/replace all drop the lock');
// count CALL SITES (…();), not the declaration `function acquireWakeLock(){` — which contains the
// substring `acquireWakeLock()` and would be the helper counted as a user of itself (the F1/F2 trap).
ok((sess.match(/acquireWakeLock\(\);/g)||[]).length===2, 'C4 acquireWakeLock has exactly TWO call sites — the start branch and the guarded onAppVisible; nowhere unconditional (got '+(sess.match(/acquireWakeLock\(\);/g)||[]).length+')');
// the R142 named condition: onAppVisible re-acquires ONLY while running.
const onVis=(sess.match(/function onAppVisible\(\)\{[\s\S]*?\n\}/)||[''])[0];
ok(/if\(\s*timerRunning\(\)\s*\)\s*acquireWakeLock\(\)/.test(onVis),
   'C5 onAppVisible re-acquires the lock GUARDED by timerRunning() — a paused steep is never held awake (R142, the ruling\'s real content)');

/* ---- D · the shared visibilitychange event wires both, in the right order ---- */
const boot=strip(fs.readFileSync(path.join(repo,'steep-boot.js'),'utf8'));
const visBlock=(boot.match(/addEventListener\('visibilitychange'[\s\S]*?\}\);/)||[''])[0];
ok(/hidden[\s\S]*onAppHidden\(\)[\s\S]*_persistSessionDraft\(\)/.test(visBlock),
   'D1 on hide: the timer is FROZEN (onAppHidden) BEFORE the draft is persisted — the saved draft reflects the pause');
ok(/visible[\s\S]*onAppVisible\(\)/.test(visBlock), 'D2 on return: onAppVisible runs (the guarded re-acquire)');

console.log('');
if(failures){ console.log('FAILED: '+failures+' of '+(passed+failures)); process.exit(1); }
console.log('ALL WAKE-TIMER TESTS PASSED ('+passed+' passed)');
