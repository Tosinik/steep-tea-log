/* PERMANENT validation — WS4 flavour honesty ladder (committed; runs every deploy).
 *
 * The calm-first honesty rule: the tea-page "What you taste" module must never draw a shape the
 * data hasn't earned. teaFlavorProfile(teaId) picks its rung from sessionCount + distinctTermCount
 * over the last 6 sessions THAT CARRY FLAVOUR DATA:
 *     <=2 → counted chips · >=3 → ranked bars · (>=5 && >=4 distinct terms) → radar unlocks.
 *
 * NOTE ON sessionCount SEMANTICS (do not "fix" to raw session count): it counts only sessions
 * containing >=1 vocabulary term, capped at 6. The ladder measures CAPTURED DATA, not brewing
 * volume — a tea brewed often but never tasted-for stays "still early". This is intentional.
 *
 * Vocabulary = membership in KB_FLAVOR_CHIPS (bare + membership scheme). Free-typed words live in
 * the same tags array but are NOT vocabulary, so they never inflate distinctTermCount / unlock radar.
 * Every generated observation is an observation of what happened across steeps, never a %/score/grade.
 *
 * Synthetic controls carry the boundary assertions and run everywhere; the real-data pass is a smoke
 * check that degrades gracefully when fixtures/{sessions,steeps}_rows.csv are absent (gitignored).
 *
 * Run: node fixtures/flavor-ladder-test.js   (exit non-zero on any failure)
 */
const fs=require('fs'), path=require('path'), vm=require('vm');
const repo=path.resolve(__dirname,'..');
const src=['steep-knowledge.js','steep-core.js','steep-teas.js','steep-sessions.js'].map(f=>fs.readFileSync(path.join(repo,f),'utf8')).join('\n;\n'); // steep-sessions since v3.85: section H pins the #29 commit path
const ctx={}; ctx.window=ctx; ctx.globalThis=ctx; ctx.console=console;
ctx.document={documentElement:{setAttribute(){},getAttribute(){return 'light';}},getElementById(){return null;},querySelectorAll(){return[];},createElement(){return{style:{},setAttribute(){},appendChild(){},classList:{add(){}}};}};
ctx.localStorage={getItem(){return null;},setItem(){},removeItem(){}}; ctx.matchMedia=()=>({matches:false}); ctx.navigator={onLine:true};
ctx.setTimeout=()=>{};ctx.clearTimeout=()=>{};ctx.setInterval=()=>{};ctx.clearInterval=()=>{};ctx.addEventListener=()=>{};
vm.createContext(ctx); vm.runInContext(src, ctx);
vm.runInContext('state.settings=Object.assign({},DEFAULT_SETTINGS);', ctx);

let passed=0, failures=0;
const ok=(c,m)=>{ if(c)passed++; else{failures++;console.log('  FAIL: '+m);} };
// state.sessions lives in the context scope (const `state`); set it by running code inside the sandbox.
const setSessions = arr => vm.runInContext('state.sessions='+JSON.stringify(arr)+';', ctx);
// A synthetic session for tea `T`: steeps = array of per-steep tag arrays.
const mk = (dayOffset, steeps, teaId='T') => ({ teaId, date:new Date(2026,0,1+dayOffset).toISOString(), steeps:steeps.map((tags,i)=>({order:i+1, tags})) });
const profile = (teaId='T') => ctx.teaFlavorProfile(teaId);

// ---- 1. Family completeness: the 4 capture families are a curated subset of the vocabulary ----
// R30: KB_FLAVOR_CHIPS is the flavour VOCABULARY (isFlavorVocab membership + tag_library seed); the
// families are the WS4 quick-tap CAPTURE grid, a curated 20-of-25. The five seed-only orphans
// (roasted/sweet/astringent/buttery/citrus) are vocabulary but intentionally not capture chips.
const fam = JSON.parse(vm.runInContext(`JSON.stringify({
  n:KB_FLAVOR_FAMILIES.length,
  keys:Object.keys(KB_FLAVOR_CHIPS),
  flat:[].concat.apply([],KB_FLAVOR_FAMILIES.map(f=>f.terms)),
  labels:KB_FLAVOR_FAMILIES.map(f=>f.label)
})`, ctx));
const R30_ORPHANS=['roasted','sweet','astringent','buttery','citrus'];
ok(fam.n===4, 'A1 exactly four families (got '+fam.n+')');
ok(fam.keys.length===25, 'A2 KB_FLAVOR_CHIPS has 25 vocabulary keys (got '+fam.keys.length+')');
ok(fam.flat.length===20, 'A3 families list 20 capture terms total (got '+fam.flat.length+')');
ok(new Set(fam.flat).size===20, 'A4 no term appears in two families');
ok(fam.flat.every(t=>fam.keys.includes(t)), 'A5 every family term is valid vocabulary (subset of chip keys)');
ok(R30_ORPHANS.every(k=>fam.keys.includes(k) && !fam.flat.includes(k)), 'A6 R30 orphans are vocabulary but not capture chips');
ok(fam.labels[0]==='Vegetal & marine' && fam.flat.slice(0,6).includes('umami') && fam.flat.slice(0,6).includes('grassy'), 'A7 umami + grassy homed in Vegetal & marine');
console.log('  A family completeness: 7 checks');

// ---- 2. Rung guard: never draw a higher rung than the data earns ----
setSessions([ mk(0,[['umami']]), mk(1,[['grassy']]) ]);
let p=profile();
ok(p.sessionCount===2 && p.rung==='chips', 'B1 2 sessions → chips rung (never bars/radar)');

setSessions([ mk(0,[['umami']]), mk(1,[['grassy']]), mk(2,[['marine']]), mk(3,[['umami']]) ]);
p=profile();
ok(p.sessionCount===4 && p.distinctTermCount===3 && p.rung==='bars', 'B2 4 sessions + 3 terms → bars, never radar');

setSessions([ mk(0,[['umami']]), mk(1,[['grassy']]), mk(2,[['marine']]), mk(3,[['umami']]), mk(4,[['grassy']]) ]);
p=profile();
ok(p.sessionCount===5 && p.distinctTermCount===3 && p.rung==='bars', 'B3 5 sessions but only 3 terms → still bars, radar stays locked');

setSessions([ mk(0,[['umami']]), mk(1,[['grassy']]), mk(2,[['marine']]), mk(3,[['vegetal']]), mk(4,[['umami']]) ]);
p=profile();
ok(p.sessionCount===5 && p.distinctTermCount===4 && p.rung==='radar', 'B4 5 sessions AND 4 distinct terms → radar unlocks');

setSessions([]); ok(profile().rung==='none', 'B5 no sessions → none (module omitted, no empty state)');
setSessions([ mk(0,[[]]), mk(1,[['not a flavour word']]) ]);
ok(profile().rung==='none', 'B6 sessions with no vocabulary → none (empty steeps + a free word only)');
console.log('  B rung guard: 6 checks');

// ---- 3. sessionCount = captured data, not brewing volume; cap at last 6 ----
setSessions([ mk(0,[['umami']]), mk(1,[[]]), mk(2,[[]]), mk(3,[['grassy']]) ]); // 4 brews, 2 tasted-for
p=profile();
ok(p.sessionCount===2, 'C1 only sessions with vocabulary count toward the ladder (got '+p.sessionCount+')');
const many=[]; for(let i=0;i<9;i++) many.push(mk(i,[['umami']])); setSessions(many);
ok(profile().sessionCount===6, 'C2 sessionCount caps at the last 6 (got '+profile().sessionCount+')');
console.log('  C captured-data semantics: 2 checks');

// ---- 4. Free words never inflate distinctTermCount / unlock radar ----
ok(ctx.isFlavorVocab('umami')===true && ctx.isFlavorVocab('Sweetness')===true, 'D1 vocabulary keys are recognised (case-insensitive)');
ok(ctx.isFlavorVocab('smells like rain')===false, 'D2 a free phrase is not vocabulary');
// 5 sessions, 3 vocab terms, every session also carries the same free phrase → distinct stays 3, radar locked.
setSessions([
  mk(0,[['umami','smells like rain']]), mk(1,[['grassy','smells like rain']]), mk(2,[['marine','smells like rain']]),
  mk(3,[['umami','smells like rain']]), mk(4,[['grassy','smells like rain']])
]);
p=profile();
ok(p.distinctTermCount===3, 'D3 free words excluded from distinctTermCount (got '+p.distinctTermCount+')');
ok(p.rung==='bars', 'D4 the free phrase does NOT push a 3-vocab-term tea into radar');
ok(!p.tally['smells like rain'], 'D5 free words never become a bar/axis');
console.log('  D free-word isolation: 5 checks');

// ---- 5. Honesty guard: observations read as observation, never verdict/score/grade ----
// Allowed: "peaks at steep 1" (a steep index). Forbidden: %, arrows, score/grade/rating/best/worst, N/M fractions.
const BAD=/[%↑↓→]|\b(score|scored|grade|graded|rating|rated|ranked|rank|best|worst|out of)\b|\d+\s*\/\s*\d+/i;
const obsCases=[
  {terms:['umami'],   positions:{umami:[1,2,2]},    tally:{umami:3}},      // → climbs in later steeps
  {terms:['sweetness'],positions:{sweetness:[0,0]}, tally:{sweetness:2}},  // → peaks at steep 1, softens after
  {terms:['marine'],  positions:{marine:[0,1,2]},   tally:{marine:3}},     // → runs steady / climbs
  {terms:['honey'],   positions:{honey:[0]},        tally:{honey:1}},      // → '' (not enough signal)
  {terms:[],          positions:{},                 tally:{}}              // → ''
];
let nonEmpty=0;
obsCases.forEach((pp,i)=>{ const o=ctx.flavorObservation(pp); if(o) nonEmpty++; ok(typeof o==='string' && !BAD.test(o), 'E'+(i+1)+' observation clean: "'+o+'"'); });
ok(nonEmpty>=2, 'E6 at least two of the synthetic cases produce an observation');
ok(/climbs in later steeps/.test(ctx.flavorObservation(obsCases[0])), 'E7 later-skewed term → "climbs in later steeps"');
ok(/peaks at steep 1/.test(ctx.flavorObservation(obsCases[1])), 'E8 steep-1-skewed term → "peaks at steep 1, softens after"');
// the static "still early" footer is copy, not a verdict
ok(!BAD.test('Still early — a couple of notes so far. The picture fills in as you brew.'), 'E9 "still early" footer is clean copy');
console.log('  E honesty guard: 9 checks');

// ---- 6. Renderers don't throw and surface the right rung markers ----
setSessions([ mk(0,[['umami']]), mk(1,[['grassy']]) ]);
let html=ctx.flavorProfileHTML({id:'T'});
ok(/What you taste/.test(html) && /Still early/.test(html) && /×/.test(html), 'F1 chips rung renders title + still-early + ×N counts');
setSessions([ mk(0,[['umami']]), mk(1,[['grassy']]), mk(2,[['umami']]) ]);
html=ctx.flavorProfileHTML({id:'T'});
ok(/the everyday form/.test(html) && /flavp-track/.test(html) && !/i-lock-hl/.test(html), 'F2 bars rung renders the everyday-form badge + bars, no unlock');
setSessions([ mk(0,[['umami']]), mk(1,[['grassy']]), mk(2,[['marine']]), mk(3,[['vegetal']]), mk(4,[['umami']]) ]);
html=ctx.flavorProfileHTML({id:'T'});
ok(/unlocked/.test(html) && /i-lock-hl/.test(html), 'F3 radar-rung tea shows the unlocked badge');
ok(ctx.flavorProfileHTML({id:'NOPE'})==='', 'F4 a tea with no flavour data renders nothing');
console.log('  F renderers: 4 checks');

// ---- 7. Real data (sessions_rows.csv + steeps_rows.csv), graceful when absent ----
function parseCSV(t){const R=[];let r=[],c='',q=false;for(let i=0;i<t.length;i++){const ch=t[i];
 if(q){if(ch==='"'){if(t[i+1]==='"'){c+='"';i++;}else q=false;}else c+=ch;}
 else if(ch==='"')q=true;else if(ch===','){r.push(c);c='';}
 else if(ch==='\n'){r.push(c);R.push(r);r=[];c='';}else if(ch!=='\r')c+=ch;}
 if(c||r.length){r.push(c);R.push(r);}
 const h=R[0];return R.slice(1).filter(x=>x.length===h.length).map(x=>Object.fromEntries(h.map((k,i)=>[k,x[i]])));}
// Postgres text[]/jsonb tags exported as CSV → "{umami,grassy}" or "[\"umami\"]".
function parseTags(v){ if(!v) return []; v=String(v).trim(); if(v==='{}'||v==='[]'||v==='') return [];
  if((v[0]==='{'&&v.slice(-1)==='}')||(v[0]==='['&&v.slice(-1)===']')) v=v.slice(1,-1);
  return v.split(',').map(s=>s.trim().replace(/^"+|"+$/g,'').toLowerCase()).filter(Boolean); }
const sPath=path.join(__dirname,'sessions_rows.csv'), stPath=path.join(__dirname,'steeps_rows.csv');
if(fs.existsSync(sPath) && fs.existsSync(stPath)){
  const byId={};
  const sessions=parseCSV(fs.readFileSync(sPath,'utf8')).map(r=>{ const s={ id:r.id, teaId:r.tea_id, date:r.session_date, steeps:[] }; byId[r.id]=s; return s; });
  parseCSV(fs.readFileSync(stPath,'utf8')).forEach(r=>{ const s=byId[r.session_id]; if(s) s.steeps.push({order:Number(r.steep_order)||0, tags:parseTags(r.tags)}); });
  setSessions(sessions);
  const teaIds=[...new Set(sessions.map(s=>s.teaId).filter(Boolean))];
  let reached={none:0,chips:0,bars:0,radar:0};
  teaIds.forEach(tid=>{ const q=profile(tid); reached[q.rung]=(reached[q.rung]||0)+1;
    // the guard must hold on real shapes too, whatever the tag data looks like
    ok(q.rung!=='radar' || (q.sessionCount>=5 && q.distinctTermCount>=4), 'G radar only when earned — tea '+tid);
    ok(q.rung!=='bars'  || q.sessionCount>=3, 'G bars only at 3+ — tea '+tid);
    ok(q.rung!=='chips' || q.sessionCount<=2, 'G chips only at <=2 — tea '+tid);
  });
  console.log('  G real data: '+teaIds.length+' teas → '+JSON.stringify(reached)+' ('+(teaIds.length*3)+' checks)');
} else {
  console.log('  G real data: SKIPPED (sessions_rows.csv / steeps_rows.csv not present)');
}

// ---- 8. #29 (v3.85) — the free-word commit path the Enter/blur wiring calls ----
// Pins the pure half of the fix: addTag routing/dedupe, addTagFromInput trim+lowercase+clear, the
// refocus discipline (blur path must not steal focus back), and the suggest markup's mousedown
// binding (a tap must not blur-commit the half-typed word first). The DOM focus/blur events
// themselves are browser-verified at deploy time, not vm-verified — this harness has no real DOM.
vm.runInContext('render=function(){}; persistTag=function(){}; state.sessionDraft={curSteepTags:[],sessionTags:[]}; state.tagLibrary=[];',ctx);
const fakeInp={value:''}, fakeBox={innerHTML:''};
ctx.document.getElementById=id=>id==='tagInputField'?fakeInp:(id==='tagSuggestBox'?fakeBox:null);
let refocusTimers=0; ctx.setTimeout=()=>{refocusTimers++;};
vm.runInContext('addTag("caramel","steep")',ctx);
ok(vm.runInContext('state.sessionDraft.curSteepTags.join()',ctx)==='caramel', 'H1 addTag routes a steep word to curSteepTags');
vm.runInContext('addTag("caramel","steep")',ctx);
ok(vm.runInContext('state.sessionDraft.curSteepTags.length',ctx)===1, 'H2 duplicate add is a no-op');
fakeInp.value='  ChocoLate '; fakeBox.innerHTML='stale';
vm.runInContext('addTagFromInput("steep", false)',ctx);
ok(vm.runInContext('state.sessionDraft.curSteepTags.includes("chocolate")',ctx)===true, 'H3 input commit trims + lowercases');
ok(fakeInp.value==='' && fakeBox.innerHTML==='', 'H4 commit clears the field and the suggest box');
const t0=refocusTimers; fakeInp.value='   ';
vm.runInContext('addTagFromInput("steep", false)',ctx);
ok(vm.runInContext('state.sessionDraft.curSteepTags.length',ctx)===2 && refocusTimers===t0, 'H5 whitespace-only input is a no-op');
fakeInp.value='malty';
vm.runInContext('addTagFromInput("steep", false)',ctx);
ok(refocusTimers===t0, 'H6 blur path (refocus=false) never schedules a refocus');
fakeInp.value='honeyed';
vm.runInContext('addTagFromInput("steep")',ctx);
ok(refocusTimers===t0+1, 'H7 Enter path keeps the type-another refocus');
vm.runInContext('addTag("evening","session")',ctx);
ok(vm.runInContext('state.sessionDraft.sessionTags.join()',ctx)==='evening' && vm.runInContext('state.sessionDraft.curSteepTags.includes("evening")',ctx)===false, 'H8 session target routes to sessionTags, not the steep list');
vm.runInContext('state.tagLibrary=["caramel","malty","candied"]; renderTagSuggest("ca","steep");',ctx);
ok(/onmousedown="event\.preventDefault\(\);pickTagSuggest\(/.test(fakeBox.innerHTML) && fakeBox.innerHTML.indexOf('onclick=')<0, 'H9 suggestion picks bind mousedown+preventDefault, never onclick');
console.log('  H #29 commit path: 9 checks');

if(failures){ console.log('\n'+failures+' FLAVOR-LADDER TEST(S) FAILED'); process.exit(1); }
console.log('\nALL FLAVOR-LADDER TESTS PASSED  ('+passed+' passed)');
