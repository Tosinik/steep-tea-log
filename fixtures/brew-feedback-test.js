/* PERMANENT validation — phase-2 brew advice: per-steep feedback (the A2 capture control).
 * Committed; runs every deploy. Guards the read-side aggregation CONTRACT that spans
 * steep-data (the mapper) + steep-core (reduceSteepFeedback / feedbackSignalOf / the gate).
 *
 * The contract (SPEC-brew-advice-v4.md, reusing v3's ladder): the read side resolves a precedence ladder
 *     per-steep character → session verdict → tag inference → null
 * Per-steep wins whenever ANY steep on the session carries a tap; the session verdict is a strict
 * fallback, NEVER merged. v4: reduceSteepFeedback returns the dominant CHARACTER (was v3's net-sign
 * verdict) — most-frequent wins, a tie surfaces the most-actionable (FB_TIE_ORDER); legacy 'weak' reads as
 * 'flat' (FB_ALIAS). sessionHasFeedback ships as a real function so its steep-only→true linchpin — without
 * which A2's own data would be invisible to its own gate — is pinned here.
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

// ---- A · reduceSteepFeedback unit (v4: dominant CHARACTER; weak→flat alias; tie→most-actionable) ----
ok(reduce(st('strong','strong','good'))==='strong',            'A1 [strong,strong,good] → strong (2 vs 1)');
ok(reduce(st('bitter'))==='bitter',                            'A2 [bitter] → bitter');
ok(reduce(st('astringent','astringent','flat'))==='astringent','A3 [astringent×2, flat] → astringent (2 vs 1)');
ok(reduce(st('strong','flat'))==='strong',                     'A4 tie [strong,flat] → strong (FB_TIE_ORDER: most-actionable)');
ok(reduce(st('weak'))==='flat',                                'A5 legacy [weak] → flat (non-destructive alias)');
ok(reduce([])===null && reduce(st(null,null))===null,          'A6 [] / all-untapped → null');
console.log('  A reduceSteepFeedback unit: 6 checks');

// ---- B · Precedence ladder + disagreement (per-steep wins; each lower rung fires; tag→character) ----
ok(sig(sess(st('bitter','bitter','good'), {feedback:'good'}))==='bitter', 'B1 per-steep beats a disagreeing session verdict');
ok(sig(sess([], {feedback:'flat'}))==='flat',                            'B2 session-verdict rung fires when no steep tapped');
ok(sig(sess([], {feedback:'weak'}))==='flat',                            'B2b legacy session verdict weak → flat');
ok(sig(sess([], {feedback:null, tags:['bitter']}))==='bitter',           'B3 tag inference → bitter (its own character now, not net-sign strong)');
ok(sig(sess([], {feedback:null, tags:['astringent']}))==='astringent',   'B3b tag inference → astringent (separate from bitter)');
ok(sig(sess([], {feedback:null, tags:['watery']}))==='flat',             'B4 weak-family tag → flat');
ok(sig(sess([], {feedback:null, tags:[]}))===null,                       'B5 nothing anywhere → null (no-op)');
console.log('  B precedence + disagreement: 7 checks');

// ---- C · Per-steep tie beats the session verdict (returns a character, not the session token) ----
ok(sig(sess(st('strong','flat'), {feedback:'bitter'}))==='strong', 'C1 per-steep tie [strong,flat] → strong, beats session bitter');
console.log('  C tie wins over session: 1 check');

// ---- D · Partial tap (one tap among untapped steeps still drives the character) ----
ok(reduce(st(null,null,'bitter',null,null))==='bitter',       'D1 5 steeps, one bitter → bitter (reduce)');
ok(sig(sess(st(null,null,'flat',null,null)))==='flat',        'D2 5 steeps, one flat → flat (signal)');
console.log('  D partial tap: 2 checks');

// ---- E · Steepless + absence ----
ok(sig(sess([], {feedback:'astringent'}))==='astringent',     'E1 steeps:[] + session astringent → astringent (fallback)');
ok(sig(sess([], {feedback:null, tags:[]}))===null,            'E2 steeps:[] + no feedback + no tags → null');
console.log('  E steepless + absence: 2 checks');

// ---- F · Malformed value ignored (no DB CHECK, so a non-enum value must count as no-signal) ----
ok(reduce([{feedback:'garbage'}])===null,                     'F1 [{feedback:garbage}] → null, no throw (reduce)');
ok(sig(sess([{order:1,feedback:'garbage'}]))===null,          'F2 malformed steep → null, no throw (signal)');
console.log('  F malformed ignored: 2 checks');

// ---- G · computeBrewAdvice — v4 (R175): feedback is ADVICE, the net-sign auto-delta is RETIRED ----
// v3 turned weak−strong into a uniform temp/time nudge; v4 retires it (it conflated intensity with
// over-extraction and was shape-blind — the diagnosis in brew-advice-v4-test.js replaces it). The COUNTS
// survive for the memory line; tuned === base (no mutation); hasNudge is always false.
const base={tempC:90, rinseSeconds:null, times:[15,20,30], form:'open', generated:false};
setSessions([ sess(st('strong','strong')), sess([], {feedback:'strong', date:'2026-01-02T08:00:00.000Z'}) ]);
let adv=ctx.computeBrewAdvice({id:'T'}, base);
ok(adv.strong===2 && adv.count===2,                            'G1 the feedback COUNTS survive (two strong → strong=2)');
ok(adv.hasNudge===false,                                       'G2 hasNudge is always false (the auto-delta is retired)');
ok(adv.tuned===base,                                           'G3 tuned === base (the schedule is not mutated by feedback)');
ok(adv.tempAdjC===undefined && adv.timeAdjPct===undefined,     'G4 no tempAdjC/timeAdjPct delta fields remain');
// The precedence ladder still classifies for the COUNTS: same verdict from steep vs session → same counts.
setSessions([ sess(st('strong','strong')), sess(st('strong','strong'), {date:'2026-01-02T08:00:00.000Z'}) ]);
const cntSteep=ctx.computeBrewAdvice({id:'T'}, base);
setSessions([ sess([], {feedback:'strong'}), sess([], {feedback:'strong', date:'2026-01-02T08:00:00.000Z'}) ]);
const cntSess=ctx.computeBrewAdvice({id:'T'}, base);
ok(cntSteep.strong===2 && cntSess.strong===2,                  'G5 swapping signal source for the same verdict yields identical counts');
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
// A LIVE guard now that real sessions carry per-steep feedback (v3.89 shipped, taps exist):
//  1. the reducer's TWO directions on real rows — null when no steep is tapped, non-null when one is
//     (the old "every real session → null" assumption expired the moment four sessions gained taps);
//  2. the v3.89 path is live end to end — at least one real session qualifies via steep feedback ALONE
//     (sessionHasFeedback true while session-level feedback is absent): the steep-only linchpin, on real data;
//  3. gate count REPORTED, never pinned (re-editing a hard number every export is the trap), with the
//     method split on STORED brew_style — what was actually brewed, not the capacity heuristic's inference.
function parseCSV(t){const R=[];let r=[],c='',q=false;for(let i=0;i<t.length;i++){const ch=t[i];
 if(q){if(ch==='"'){if(t[i+1]==='"'){c+='"';i++;}else q=false;}else c+=ch;}
 else if(ch==='"')q=true;else if(ch===','){r.push(c);c='';}
 else if(ch==='\n'){r.push(c);R.push(r);r=[];c='';}else if(ch!=='\r')c+=ch;}
 if(c||r.length){r.push(c);R.push(r);}
 const h=R[0];return R.slice(1).filter(x=>x.length===h.length).map(x=>Object.fromEntries(h.map((k,i)=>[k,x[i]])));}
const sPath=path.join(__dirname,'sessions_rows.csv'), stPath=path.join(__dirname,'steeps_rows.csv');
if(fs.existsSync(sPath) && fs.existsSync(stPath)){
  const byId={};
  // Mirror steep-data.js mappers: feedback = r.feedback || null; brewStyle from the stored column.
  parseCSV(fs.readFileSync(sPath,'utf8')).forEach(r=>{ byId[r.id]={ id:r.id, brewStyle:r.brew_style||'', feedback:r.feedback||null, steeps:[] }; });
  parseCSV(fs.readFileSync(stPath,'utf8')).forEach(r=>{ const s=byId[r.session_id]; if(s) s.steeps.push({order:Number(r.steep_order)||0, feedback:r.feedback||null}); });
  const sess=Object.values(byId);
  // 1 · reducer fires in BOTH directions on real rows (was the stale one-directional no-op check).
  sess.forEach(s=>{
    const tapped=s.steeps.some(st=>!!st.feedback);
    if(tapped) ok(reduce(s.steeps)!==null, 'R reducer non-null on a real steep-tapped session '+s.id);
    else       ok(reduce(s.steeps)===null, 'R reducer null on a real untapped session '+s.id);
  });
  // 2 · the steep-only linchpin, live on real data (replaces the has===!!feedback identity, only ever
  //     true when no steep feedback existed): at least one session qualifies via steep feedback ALONE.
  const steepOnly=sess.filter(s=>has(s) && !s.feedback);
  ok(steepOnly.length>=1, 'R at least one real session qualifies via steep feedback ALONE (steep-only='+steepOnly.length+')');
  // 3 · gate count + method split REPORTED, not pinned (survives any export); split on stored brew_style.
  const gate=sess.filter(has);
  const split={}; gate.forEach(s=>{ const k=s.brewStyle||'(none)'; split[k]=(split[k]||0)+1; });
  const tapped=sess.filter(s=>s.steeps.some(st=>!!st.feedback)).length;
  console.log('  R real data: '+sess.length+' sessions · '+tapped+' steep-tapped · '+gate.length+' with feedback (by brew_style: '+JSON.stringify(split)+')');
} else {
  console.log('  R real data: SKIPPED (sessions_rows.csv / steeps_rows.csv not present)');
}

if(failures){ console.log('\n'+failures+' BREW-FEEDBACK TEST(S) FAILED'); process.exit(1); }
console.log('\nALL BREW-FEEDBACK TESTS PASSED  ('+passed+' passed)');
