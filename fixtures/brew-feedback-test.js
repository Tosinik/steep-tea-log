/* PERMANENT validation — phase-2 brew advice: per-steep feedback (the A2 capture control).
 * Committed; runs every deploy. Guards the read-side aggregation CONTRACT that spans
 * steep-data (the mapper) + steep-core (reduceSteepFeedback / feedbackSignalOf / the gate).
 *
 * The contract (SPEC-brew-advice-v3-feedback.md §2): tuning reads a precedence ladder
 *     per-steep curve → session verdict → tag inference → null
 * Per-steep wins whenever ANY steep on the session carries a tap; the session verdict is a
 * strict fallback, NEVER merged. reduceSteepFeedback is net-sign only (shape shelved): tie
 * → 'good' (a fully-tapped neutral session is the most-engaged logging and must stay
 * gate-visible). sessionHasFeedback ships as a real function so its steep-only→true linchpin
 * — without which A2's own data would be invisible to its own gate — is pinned here.
 *
 * Synthetic sections A–I carry the boundary assertions and run everywhere; the real-data
 * pass is the forward no-op regression, degrading gracefully when fixtures/{sessions,steeps}
 * _rows.csv are absent (gitignored). computeBrewAdvice assertions pass an explicit
 * ratio-scaled baseOverride so this suite isolates the feedback layer from ratio math.
 *
 * Run: node fixtures/brew-feedback-test.js   (exit non-zero on any failure)
 */
const fs=require('fs'), path=require('path'), vm=require('vm');
const repo=path.resolve(__dirname,'..');
const src=['steep-knowledge.js','steep-core.js'].map(f=>fs.readFileSync(path.join(repo,f),'utf8')).join('\n;\n');
const ctx={}; ctx.window=ctx; ctx.globalThis=ctx; ctx.console=console;
ctx.document={documentElement:{setAttribute(){},getAttribute(){return 'light';}},getElementById(){return null;},querySelectorAll(){return[];},createElement(){return{style:{},setAttribute(){},appendChild(){},classList:{add(){}}};}};
ctx.localStorage={getItem(){return null;},setItem(){},removeItem(){}}; ctx.matchMedia=()=>({matches:false}); ctx.navigator={onLine:true};
ctx.setTimeout=()=>{};ctx.clearTimeout=()=>{};ctx.setInterval=()=>{};ctx.clearInterval=()=>{};ctx.addEventListener=()=>{};
vm.createContext(ctx); vm.runInContext(src, ctx);
vm.runInContext('state.settings=Object.assign({},DEFAULT_SETTINGS);', ctx);

let passed=0, failures=0;
const ok=(c,m)=>{ if(c)passed++; else{failures++;console.log('  FAIL: '+m);} };
const eq=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
// The real functions under test — never reimplement.
const reduce=s=>ctx.reduceSteepFeedback(s);
const sig=s=>ctx.feedbackSignalOf(s);
const has=s=>ctx.sessionHasFeedback(s);
// steeps: shorthand array of feedback strings (or null) → steep objects.
const st=(...fbs)=>fbs.map((f,i)=>({order:i+1, feedback:f}));
// computeBrewAdvice reads state.sessions via adviceSessionsFor; set it inside the sandbox.
const setSessions=arr=>vm.runInContext('state.sessions='+JSON.stringify(arr)+';', ctx);
const sess=(steeps,extra)=>Object.assign({teaId:'T', date:'2026-01-01T08:00:00.000Z', isColdBrew:false, tags:[], feedback:null, steeps}, extra||{});

// ---- A · reduceSteepFeedback unit (net-sign; tie → 'good'; untapped ignored) ----
ok(reduce(st('strong','strong','good'))==='strong', 'A1 [strong,strong,good] → strong (net -2)');
ok(reduce(st('weak'))==='weak',                       'A2 [weak] → weak');
ok(reduce(st('strong','weak'))==='good',              'A3 [strong,weak] → good (tie, counted)');
ok(reduce(st('good','good'))==='good',                'A4 [good,good] → good (net-neutral, any=true)');
ok(reduce([])===null,                                 'A5 [] → null');
ok(reduce(st(null,null))===null,                      'A6 all-untapped → null');
console.log('  A reduceSteepFeedback unit: 6 checks');

// ---- B · Precedence ladder + disagreement (per-steep wins; each lower rung fires alone) ----
ok(sig(sess(st('strong','strong','good'), {feedback:'good'}))==='strong', 'B1 per-steep beats a disagreeing session verdict');
ok(sig(sess([], {feedback:'weak'}))==='weak',                             'B2 session-verdict rung fires when no steep tapped');
ok(sig(sess([], {feedback:null, tags:['bitter']}))==='strong',           'B3 tag-inference rung fires when the two above are empty');
ok(sig(sess([], {feedback:null, tags:['watery']}))==='weak',             'B4 weak tag inference');
ok(sig(sess([], {feedback:null, tags:[]}))===null,                       'B5 nothing anywhere → null (no-op)');
console.log('  B precedence + disagreement: 5 checks');

// ---- C · Tie wins over session (the tie returns a counted verdict, not the session token) ----
ok(sig(sess(st('strong','weak'), {feedback:'weak'}))==='good', 'C1 {feedback:weak, steeps:[strong,weak]} → good');
console.log('  C tie wins over session: 1 check');

// ---- D · Partial tap (one tap among untapped steeps still drives the curve) ----
ok(reduce(st(null,null,'weak',null,null))==='weak',            'D1 5 steeps, one weak → weak (reduce)');
ok(sig(sess(st(null,null,'weak',null,null)))==='weak',         'D2 5 steeps, one weak → weak (signal)');
console.log('  D partial tap: 2 checks');

// ---- E · Steepless + absence ----
ok(sig(sess([], {feedback:'weak'}))==='weak',                  'E1 steeps:[] + feedback weak → weak (fallback)');
ok(sig(sess([], {feedback:null, tags:[]}))===null,             'E2 steeps:[] + no feedback + no tags → null');
console.log('  E steepless + absence: 2 checks');

// ---- F · Malformed value ignored (no DB CHECK, so a non-enum value must count as no-signal) ----
ok(reduce([{feedback:'garbage'}])===null,                      'F1 [{feedback:garbage}] → null, no throw (reduce)');
ok(sig(sess([{order:1,feedback:'garbage'}]))===null,           'F2 malformed steep → null, no throw (signal)');
console.log('  F malformed ignored: 2 checks');

// ---- G · computeBrewAdvice composition (feedback tunes ON TOP of a ratio-scaled base) ----
const base={tempC:90, rinseSeconds:null, times:[15,20,30], form:'open', generated:false};
// Two 'strong' sessions → strong=2, net=-2 → tempAdjC=-4, timeAdjPct=-16.
setSessions([ sess(st('strong','strong')), sess([], {feedback:'strong', date:'2026-01-02T08:00:00.000Z'}) ]);
let adv=ctx.computeBrewAdvice({id:'T'}, base);
ok(adv.net===-2 && adv.tempAdjC===-4 && adv.timeAdjPct===-16, 'G1 net=-2 → tempAdjC=-4, timeAdjPct=-16');
ok(adv.tuned.tempC===86,                                       'G2 tuned.tempC = 90-4 = 86');
ok(eq(adv.tuned.times,[13,17,25]),                             'G3 tuned.times = [13,17,25] (×0.84)');
ok(adv.hasNudge===true,                                        'G4 hasNudge true');
// Convergence: same verdict, different SOURCE (all-steep vs all-session) → identical tuned.
setSessions([ sess(st('strong','strong')), sess(st('strong','strong'), {date:'2026-01-02T08:00:00.000Z'}) ]);
const tunedSteep=ctx.computeBrewAdvice({id:'T'}, base).tuned;
setSessions([ sess([], {feedback:'strong'}), sess([], {feedback:'strong', date:'2026-01-02T08:00:00.000Z'}) ]);
const tunedSess=ctx.computeBrewAdvice({id:'T'}, base).tuned;
ok(eq(tunedSteep,tunedSess),                                   'G5 swapping signal source for the same verdict yields identical tuned');
// Absence → no nudge, tuned is the base itself, count 0 (nothing to prompt).
setSessions([ sess(st(null,null), {tags:[]}) ]);
adv=ctx.computeBrewAdvice({id:'T'}, base);
ok(adv.hasNudge===false && adv.tuned===adv.base && adv.count===0, 'G6 absence → hasNudge false, tuned===base, count 0');
console.log('  G computeBrewAdvice composition: 6 checks');

// ---- H · sessionHasFeedback (the gate predicate; steep-only→true is the linchpin) ----
ok(has(sess([], {feedback:'weak'}))===true,        'H1 session-only → true');
ok(has(sess(st('weak')))===true,                   'H2 steep-only → true (LINCHPIN — A2 data visible to its own gate)');
ok(has(sess(st(null,null)))===false,               'H3 neither → false');
ok(has(sess(st('strong'), {feedback:'good'}))===true, 'H4 both → true');
console.log('  H sessionHasFeedback: 4 checks');

// ---- I · Determinism (same rows → same token/tuned across repeated calls in one run) ----
const dSess=sess(st('strong','weak','strong'), {feedback:'weak'});
ok(sig(dSess)===sig(dSess) && reduce(dSess.steeps)===reduce(dSess.steeps), 'I1 reduce/signal deterministic');
setSessions([ sess(st('weak','weak')) ]);
ok(eq(ctx.computeBrewAdvice({id:'T'},base).tuned, ctx.computeBrewAdvice({id:'T'},base).tuned), 'I2 computeBrewAdvice deterministic');
console.log('  I determinism: 2 checks');

// ---- Real data (sessions_rows.csv + steeps_rows.csv), graceful when absent ----
// Forward no-op regression: every existing session predates the steeps.feedback column, so
// reduceSteepFeedback(session.steeps) MUST be null for all of them — which is exactly why
// computeBrewAdvice stays byte-identical for every existing tea. Guards against a future
// change letting the per-steep path fire on legacy (untapped) rows.
function parseCSV(t){const R=[];let r=[],c='',q=false;for(let i=0;i<t.length;i++){const ch=t[i];
 if(q){if(ch==='"'){if(t[i+1]==='"'){c+='"';i++;}else q=false;}else c+=ch;}
 else if(ch==='"')q=true;else if(ch===','){r.push(c);c='';}
 else if(ch==='\n'){r.push(c);R.push(r);r=[];c='';}else if(ch!=='\r')c+=ch;}
 if(c||r.length){r.push(c);R.push(r);}
 const h=R[0];return R.slice(1).filter(x=>x.length===h.length).map(x=>Object.fromEntries(h.map((k,i)=>[k,x[i]])));}
const sPath=path.join(__dirname,'sessions_rows.csv'), stPath=path.join(__dirname,'steeps_rows.csv');
if(fs.existsSync(sPath) && fs.existsSync(stPath)){
  const byId={};
  // Mirror steep-data.js mappers: feedback = r.feedback || null (steeps CSV has no such column
  // pre-v3_9, so every real steep resolves to null).
  const sessions=parseCSV(fs.readFileSync(sPath,'utf8')).map(r=>{ const s={ id:r.id, teaId:r.tea_id, date:r.session_date, isColdBrew:r.is_cold_brew==='true'||r.is_cold_brew==='t', feedback:r.feedback||null, tags:[], steeps:[] }; byId[r.id]=s; return s; });
  parseCSV(fs.readFileSync(stPath,'utf8')).forEach(r=>{ const s=byId[r.session_id]; if(s) s.steeps.push({order:Number(r.steep_order)||0, feedback:r.feedback||null}); });
  let noop=0;
  sessions.forEach(s=>{ ok(reduce(s.steeps)===null, 'R no-op: session '+s.id+' has no per-steep feedback → reduce null'); if(reduce(s.steeps)===null) noop++; });
  // Gate-count reproduction is informational until a FRESH export (with taps) is dropped in;
  // on this legacy export sessionHasFeedback reduces to session-level feedback only. Assert that
  // identity holds (no steep feedback anywhere) and report the count rather than pinning a number.
  sessions.forEach(s=>ok(has(s)===!!s.feedback, 'R gate: session '+s.id+' — sessionHasFeedback === session-level feedback (no steep taps yet)'));
  const gate=sessions.filter(has).length;
  console.log('  R real data: '+sessions.length+' sessions, '+noop+' no-op-clean, '+gate+' carry session-level feedback (gate-count anchor reproduces on a fresh export)');
} else {
  console.log('  R real data: SKIPPED (sessions_rows.csv / steeps_rows.csv not present)');
}

if(failures){ console.log('\n'+failures+' BREW-FEEDBACK TEST(S) FAILED'); process.exit(1); }
console.log('\nALL BREW-FEEDBACK TESTS PASSED  ('+passed+' passed)');
