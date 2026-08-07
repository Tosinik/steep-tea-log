/* PERMANENT validation — #09 the door / first run (committed; every deploy).
 *
 * R112 — THIS SUITE ASSERTS AGAINST SOURCE, AND THAT IS A STRUCTURAL LIMIT, NOT A CHOICE.
 * `renderLogin` is closure-private inside an IIFE that requires the Supabase global, so no sandbox
 * can call it: the door is the one surface in the app that runs BEFORE boot, with no `state` and no
 * `render()`. So sections A-C prove the door's SOURCE contains what was ruled — the canonical copy,
 * no removed provider, no redeem control, no reserved accent, one ensō definition rather than two.
 * **They cannot prove the door renders.** Only a browser can, and this round has not had one.
 *
 * What IS genuinely covered is §D: the three zero-tea surfaces the door hands off to are ordinary
 * views, reachable in the sandbox, and they are rendered here against an empty account. That half is
 * behavioural. The halves are labelled so nobody reads a green run as more than it is.
 *
 * Run: node fixtures/landing-test.js   (exit non-zero on any failure)
 * Run fixtures/export-gate-test.js FIRST.
 */
const fs=require('fs'), path=require('path'), vm=require('vm');
const repo=path.join(__dirname,'..');
let passed=0, failures=0;
const ok=(c,m)=>{ if(c){passed++;} else {failures++; console.log('  FAIL: '+m);} };
const DATA=fs.readFileSync(path.join(repo,'steep-data.js'),'utf8');
const CSS=fs.readFileSync(path.join(repo,'styles.css'),'utf8');
const INDEX=fs.readFileSync(path.join(repo,'index.html'),'utf8');
/* The door's source, isolated — so a string found somewhere else in the data layer cannot pass for
   it — and with COMMENTS STRIPPED. The first run of B1 failed on this file's own comment saying
   "there is no Apple": a negative check that reads prose is testing the prose. */
const DOOR=((DATA.split('the door (#09)')[1]||'').split('function renderMigratePrompt')[0])
  .replace(/\/\*[\s\S]*?\*\//g,' ').replace(/^\s*\/\/.*$/gm,' ');

console.log('#09 — THE DOOR (source-asserted, see R112)');

/* ---- A · R32's canonical copy, verbatim ---- */
ok(/a slower cup, better kept/.test(DOOR), 'A1 the tagline is drawn as ruled');
ok(/Keep the tea you brew — every steep, how it poured, what it cost and where it grew — and the few you share it with\./.test(DOOR),
   'A2 the what-it-is sentence is verbatim — R32 adopted it as canonical, so a paraphrase is a change');
['Keep','Brew','Share'].forEach(w=>ok(new RegExp('door-p-l">'+w+'<').test(DOOR), 'A3 the pillar "'+w+'" is drawn'));
ok(/your shelf, every steep/.test(DOOR) && /led by the leaf/.test(DOOR) && /no feed/.test(DOOR),
   'A4 …each with its sub-line, "no feed" included — the honest differentiator, not decoration');
ok(!/start your journey|get started|join us/i.test(DOOR),
   'A5 the voice stays observational — no "start your journey", which is the register R32 was written against');
console.log('  A canonical copy: 7 checks');

/* ---- B · R47, R34, R94: what is NOT on the door ---- */
ok(!/Apple/i.test(DOOR), 'B1 R47: no Apple button — the door draws only configured providers, and Apple is not one');
ok(/googleBtn/.test(DOOR) && /signInWithGoogle/.test(DATA),
   'B2 …and Google IS drawn, because it IS configured — R47 cuts the unconfigured, it does not cut the tier');
ok(/Invitation-only for now\./.test(DOOR), 'B3 R34: the invite line is passive');
ok(!/redeem|invite code|enter your code/i.test(DOOR),
   'B4 …with no redeem mechanism, and no copy claiming enforcement — signups are toggled ON, so a locked-door claim would be false');
ok(/Send magic link/.test(DOOR),
   'B5 the button names its own mechanism: tapping it sends an email, and the label says so before the tap');
/* Contract 4. The confinement assertion is the one that decays silently — nothing breaks when an
   accent spreads — and this is the screen most tempting to spend it on. */
/* Comment-stripped for the same reason the door's source is (see above), and it took a SECOND
   instance to make the rule stick: E1 first failed against this block's own comment explaining
   what an auto top margin does. An absence check must never read prose — not the code's, not
   its own. */
const doorCSS=((CSS.split('the door (#09')[1]||'').split('/* ---------- auth /')[0])
  .replace(/\/\*[\s\S]*?\*\//g,' ');
ok(doorCSS.length>200 && !/kachi/.test(doorCSS),
   'B6 R94: no kachi token anywhere in the door\'s CSS — the ring in Focus stays the only place the accent is spent');
ok(!/#[0-9A-Fa-f]{6}/.test(doorCSS), 'B7 …and no hex at a render site; the door is tokens only, so both themes come free');
console.log('  B what is not there: 7 checks');

/* ---- C · R33: one ensō, shared with the timer ---- */
ok(/href="#enso"/.test(DOOR), 'C1 R33: the door reaches the shared ensō symbol');
ok(/<symbol id="enso"/.test(INDEX), 'C2 …which is defined once, in the index sprite');
ok((DATA.match(/a45 45 0 1 0 33 14|a44 44 0 1 0 34 15/g)||[]).length===0,
   'C3 …and the door carries no second copy of the path, which is the drift R33\'s "one motif" is about');
ok(/id="app"/.test(INDEX) && INDEX.indexOf('<symbol id="enso"') < INDEX.indexOf('<div id="app">'),
   'C4 the sprite sits OUTSIDE #app, so renderLogin overwriting #app cannot delete the symbol it references');
ok(/timer-enso|focus-enso/.test(fs.readFileSync(path.join(repo,'steep-sessions.js'),'utf8')),
   'C5 …and the timer still uses it — "door and timer" is two surfaces, not one');
console.log('  C the ensō: 5 checks');

/* ---- D · the three surfaces the door opens onto (BEHAVIOURAL — these actually render) ----
 * FR6: a brand-new account has zero teas and zero sessions. The door is only a threshold; if what it
 * opens onto is blank, the first signed-in moment is a blank screen. Verified present, not assumed. */
const FILES=['steep-origins-map.js','steep-knowledge.js','steep-tea-types.js','steep-core.js',
  'steep-settings.js','steep-dashboard.js','steep-insights.js','steep-teas.js','steep-reference.js',
  'steep-shopping.js','steep-passport.js','steep-social.js','steep-sessions.js'];
const SRC=FILES.map(f=>fs.readFileSync(path.join(repo,f),'utf8')).join('\n;\n');
const ctx={};ctx.window=ctx;ctx.globalThis=ctx;ctx.console=console;
ctx.document={documentElement:{setAttribute(){},getAttribute(){return'light'}},
  getElementById:()=>null,querySelectorAll:()=>[],querySelector:()=>null,addEventListener(){},
  createElement:()=>({style:{},setAttribute(){},appendChild(){},classList:{add(){},remove(){}}})};
ctx.localStorage={getItem:()=>null,setItem(){},removeItem(){}};
ctx.matchMedia=()=>({matches:false});ctx.navigator={onLine:true};
ctx.setTimeout=()=>{};ctx.clearTimeout=()=>{};ctx.setInterval=()=>{};ctx.clearInterval=()=>{};
ctx.addEventListener=()=>{};ctx.SteepDB={newId:()=>'x',getUser:()=>({id:'u'})};
vm.createContext(ctx);vm.runInContext(SRC,ctx);
const G=e=>vm.runInContext(e,ctx);
G('state.settings=Object.assign({},DEFAULT_SETTINGS);state.teas=[];state.sessions=[];state.steeps=[];state.vessels=[];state.wishlist=[];');
const origins=G('viewOrigins()'), shelf=G('viewTeas()'), home=G('viewDashboard()');
ok(/Your atlas fills in as you add teas/.test(origins),
   'D1 R19: zero teas gives Origins its empty state — the addendum #09 could not be written until Origins existed');
ok(!/org-map/.test(origins), 'D2 …and draws no map of nowhere');
ok(/No teas yet/.test(shelf), 'D3 the empty shelf says what to do next');
/* D4 CHANGED IN v4.10, and the change was flagged before it happened. R115 replaced the three-step
   onboarding checklist with the greeting and one door, gated on the SHELF rather than the session
   count — so "Welcome to SlowCup" is gone and this asserts what actually greets a new account now.
   The door still opens onto something that speaks; only the words behind it moved. */
ok(/Nothing on the shelf yet/.test(home) && /Add your first tea/.test(home),
   'D4 …and the first signed-in moment is day one\'s masthead and its one door, not a blank Home');
ok(!/href="#enso"/.test(home),
   'D5 day one keeps the app\'s own voice, NOT the ensō — R33 gives the motif to the door and the timer only');
[['origins',origins],['shelf',shelf],['home',home]].forEach(([n,h])=>
  ok(h && h.trim().length>60, 'D6 '+n+' returns real markup on an empty account (the check every other one here would pass without)'));
console.log('  D empty-account hand-off: 8 checks');

/* ---- E · the slack is BOUNDED (source-asserted, and it cannot see the look) ----
 * The board draws the door in an 812 px frame and distributes with one `margin-top:auto`. That is
 * composition at 812 and a defect at every other height: all extra viewport height lands in the
 * single gap between the pillars and the sign-in, so the hole grows with the screen. Niklas saw
 * ~500 px of it — the third defect this round found by looking and the third not found by measuring.
 * WHAT THESE FOUR CHECKS ARE: a guard on the RULE that caused it, so it cannot come back unnoticed.
 * WHAT THEY ARE NOT: a judgement of the layout. Nothing here knows what the door looks like at any
 * height; only a browser does, and `fixtures/door-review.js` renders it at four for a human. Stated
 * rather than papered over, per R104 and R112. */
ok(!/margin-top:\s*auto/.test(doorCSS),
   'E1 no `margin-top:auto` in the door — the rule that put every extra pixel of height into ONE gap');
ok(/\.door-auth\{[^}]*margin-top:\s*clamp\(/.test(doorCSS),
   'E2 …the gap above the sign-in is clamped, so height cannot accumulate there');
ok(/\.door\{[^}]*justify-content:\s*center/.test(doorCSS),
   'E3 …and the column is centred, so the excess goes ABOVE and BELOW the group rather than through it');
ok(/\.door\{[^}]*min-height:/.test(doorCSS) && !/\.door\{[^}]*[^-]height:\s*100/.test(doorCSS),
   'E4 min-height, not height — a short viewport grows the container instead of centring content above the scroll origin');
console.log('  E bounded slack: 4 checks (layout itself is only judgeable by looking)');

console.log('');
if(failures){ console.log('FAILED: '+failures+' of '+(passed+failures)); process.exit(1); }
console.log('ALL LANDING TESTS PASSED ('+passed+' passed)');
