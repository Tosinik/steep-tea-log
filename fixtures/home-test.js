/* PERMANENT validation — R4's Home revision (committed; every deploy).
 *
 * WHY ITS OWN SUITE. Home's rulings are INVARIANTS about a surface the user composes, which is the
 * hardest kind to keep: every one of them is a rule about what must NOT appear, and absences decay
 * silently. The greeting must not be a card. A card must not carry clay. A surface must not carry
 * two. A card with nothing to say must not draw an apology — but must still be reachable in edit
 * mode, or you cannot unhide what you cannot see.
 *
 * R116 IS THE REASON §D EXISTS. Three of the five visual contracts shipped unimplemented — locked,
 * cited across boards, and never built — and two rulings were then reasoned from that phantom state.
 * A locked contract is not implemented until something asserts it, so each contract that IS built
 * gets a guard naming its token and the selectors it is permitted on.
 *
 * WHAT THIS SUITE CANNOT SEE: composition. It knows the masthead is not a card and that clay appears
 * once; it does not know whether Home looks right. `fixtures/home-review.js` renders it for a human,
 * which is how the last three defects in this project were found.
 *
 * Run: node fixtures/home-test.js   (exit non-zero on any failure)
 * Run fixtures/export-gate-test.js FIRST.
 */
const fs=require('fs'), path=require('path'), vm=require('vm');
const repo=path.join(__dirname,'..');
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
G('state.settings=Object.assign({},DEFAULT_SETTINGS);');

let passed=0, failures=0;
const ok=(c,m)=>{ if(c){passed++;} else {failures++; console.log('  FAIL: '+m);} };
function parseCSV(t){const R=[];let r=[],c='',q=false;for(let i=0;i<t.length;i++){const ch=t[i];
 if(q){if(ch==='"'){if(t[i+1]==='"'){c+='"';i++;}else q=false;}else c+=ch;}
 else if(ch==='"')q=true;else if(ch===','){r.push(c);c='';}
 else if(ch==='\n'){r.push(c);R.push(r);r=[];c='';}else if(ch!=='\r')c+=ch;}
 if(c||r.length){r.push(c);R.push(r);}
 const h=(R[0]||[]).map(x=>x.trim());
 return R.slice(1).filter(x=>x.length===h.length).map(x=>Object.fromEntries(h.map((k,i)=>[k,x[i]])));}
const rows=f=>parseCSV(fs.readFileSync(path.join(__dirname,f),'utf8'));

console.log('HOME — R4 revision (R113 · R114 · R115 · R116)');
const OWNER=rows('sessions_rows.csv')[0].user_id;                  // R69: derived, never hardcoded
const TEAS=rows('teas_rows.csv').filter(t=>t.user_id===OWNER)
  .map(t=>({id:t.id,name:t.name,type:t.type,origin:t.origin||'',amountGrams:Number(t.amount_grams||0),
            isFavorite:t.is_favorite==='true'||t.is_favorite==='t'}));
// Steeps come from the real export: `brewCountLabel` reads `steeps.length`, so a session seeded
// without them renders a diary line with an empty count. Seeding the shape the app actually stores.
const STEEPS_BY_SESSION=rows('steeps_rows.csv').filter(s=>s.user_id===OWNER)
  .reduce((m,s)=>{ (m[s.session_id]=m[s.session_id]||[]).push({}); return m; }, {});
const SESSIONS=rows('sessions_rows.csv').filter(s=>s.user_id===OWNER)
  .map(s=>({id:s.id,teaId:s.tea_id,vesselId:s.vessel_id,date:s.session_date,teaName:s.tea_name,
            teaType:s.tea_type,steeps:STEEPS_BY_SESSION[s.id]||[]}));
const seed=()=>G('state.teas='+JSON.stringify(TEAS)+';state.sessions='+JSON.stringify(SESSIONS)
  +';state.vessels=[{id:"v1",name:"Dragon Gaiwan",capacityMl:110}];state.settings.dashLayout=undefined;state.dashEdit=false;');
seed();
/* EVERY source this suite reads is comment-stripped, and the rule is general on purpose. A2 failed
   on its first run against this deploy's own CSS comment explaining what `.greeting-card` used to
   be — the sixth time in two rounds that a check has read prose instead of the thing the prose
   describes, and the second time the "fix" was applied to one language and not the others.
   An absence check must never see a comment. Not the code's, not its own. */
const strip=s=>s.replace(/\/\*[\s\S]*?\*\//g,' ');
const dashSrc=strip(fs.readFileSync(path.join(repo,'steep-dashboard.js'),'utf8'));
const cssSrc=strip(fs.readFileSync(path.join(repo,'styles.css'),'utf8'));

/* ---- A · the greeting is the masthead, not a card (R115) ---- */
const home=G('viewDashboard()');
ok(/home-masthead/.test(home), 'A1 Home draws the masthead');
ok(!/greeting-card/.test(home) && !/greeting-card/.test(cssSrc),
   'A2 …and the jade-pale greeting CARD is gone from markup and stylesheet — a masthead is the top of a page, not an element on one (R114)');
ok(G('DASH_DEFAULT_ORDER.indexOf("greeting")')===-1 && G('DASH_LABELS.greeting===undefined')
   && G('DASH_SURFACE.greeting===undefined'),
   'A3 …and it is in none of the three card registries, so it cannot be reordered, hidden or moved');
/* The migration, which is free by construction: dashLayout() filters BOTH order and hidden against
   DASH_DEFAULT_ORDER, so a saved layout that hid the greeting stops naming a card that no longer
   exists. Seeded with a REAL saved shape, since this is the case that would strand a user. */
G('state.settings.dashLayout={order:["greeting","restock","favorites"],hidden:["greeting"]};');
const hidHome=G('viewDashboard()');
ok(/home-masthead/.test(hidHome),
   'A4 a saved layout that HID the greeting still renders the masthead — the override is deliberate: the control that would unhide it is a card list the greeting has just left');
ok(G('dashLayout().order.indexOf("greeting")')===-1 && G('[...dashLayout().hidden].indexOf("greeting")')===-1,
   'A5 …and the stale id is pruned on read, so edit mode shows no phantom card');
seed();
console.log('  A the masthead: 5 checks');

/* ---- B · clay: one per surface, spine only (R113) ---- */
const clayHome=(home.match(/btn-clay/g)||[]).length;
ok(clayHome<=1, 'B1 Home draws at most ONE clay action (got '+clayHome+') — contract 2 is one committing action per screen');
ok(!/btn-clay/.test(G('renderDashboard(dashCards(),"home")')),
   'B2 …and no CARD carries clay: a card moves between surfaces, so it would either bring a second clay onto a screen that has one or change appearance on arrival');
ok(!/btn-clay/.test(G('viewInsights()')),
   'B3 Insights carries no clay — the reflective room has nothing to commit');
ok(/\.btn-clay\{[^}]*var\(--clay\)/.test(cssSrc), 'B4 clay is a token, not a hex at the render site');
// R113's own premise, pinned: the Wrapped teaser was never clay, so this is clay's FIRST use.
ok(/\.ins-door\{[^}]*var\(--white\)/.test(cssSrc) && !/\.ins-door\{[^}]*--clay/.test(cssSrc),
   'B5 the Wrapped door is --white, NOT clay — R113 was a correction of a misuse that does not exist (R116); R161 de-boxed the #2A4130 teaser to the .ins-door BOX');
ok(/bn-log-circle\{[^}]*var\(--jade\)/.test(cssSrc),
   'B6 the raised Log stays jade — chrome shared by every tab is a different register from content');
/* B7 is SOURCE-asserted (R112's shape) and it exists because a negative control found nothing to
   fail: offering clay on a redirected suggestion left every other check green. The redirect branch
   fires on the wall clock — "your morning window has passed, save it for tonight" — so a sandbox
   cannot reach it without owning the clock. What can be pinned is the gate itself. */
ok(/return card\(sub, redirected \? null : pick\.t\);/.test(dashSrc),
   'B7 a REDIRECTED suggestion carries no clay — "save the X for tomorrow" beside a Start-steeping button would argue with its own caption');
/* B8 IS THE CHECK B1 SHOULD HAVE BEEN. "At most one clay" passes happily at ZERO, and the first
   build of this slice shipped exactly that: clay was wired into the bucket branch only, so a
   furnished Home whose greeting took the REDISCOVERY branch ("the X has been waiting 4 weeks —
   today?") carried no committing action at all. Niklas found it by looking at the rendered page;
   nothing here could, because branch selection turns on the wall clock and a date hash.
   So the masthead's return paths are enumerated instead. Two propose a tea for NOW and pass one; the
   rest name no tea, or name one for a LATER window. If a new one appears, this reddens and someone
   has to decide which kind it is — which is the whole point.

   IT DID EXACTLY THAT AT v4.16, and the classification is recorded rather than absorbed: R123 adds a
   SEVENTH path — sittings today, none in this window — and it commits NOTHING. Its tail is the same
   forward suggestion the bucket branch builds, so R120 reaches it by its own terms and clay stays
   suppressed the same way that branch suppresses it: by passing no tea, not by a new rule. Six → 7
   paths, still exactly 2 committing. */
const mast=(dashSrc.split('function greetingMastheadHTML')[1]||'').split('\nfunction ')[0];
const returns=(mast.match(/return card\(/g)||[]).length;
// Counted at the ARGUMENT, not by trying to span a whole nested `card(...)` call: the rediscovery
// return is a multi-line ternary of copy pools, and a regex that has to walk it is a regex that will
// silently stop matching the day someone reflows the copy.
const withTea=(mast.match(/,\s*redis\.t\)/g)||[]).length
            + (mast.match(/,\s*redirected \? null : pick\.t\)/g)||[]).length;
ok(returns===7, 'B8 the masthead has seven return paths (got '+returns+') — a new one must be classified, not defaulted (six until v4.16; R123 added the sittings-today branch)');
ok(withTea===2, 'B9 …and STILL exactly TWO of them commit: the rediscovery pick and the bucket pick, the only two that propose a tea for NOW (got '+withTea+') — R123 added a path and no clay');
console.log('  B clay: 9 checks (B7–B9 source-asserted — branch selection needs the wall clock)');

/* ---- C · the present tense: default set, and cards that say nothing ---- */
ok(G('dashSurface("restock")')==='home' && G('dashSurface("favorites")')==='home',
   'C1 R115: Running low and Favourites default to Home — you cannot answer "what now" without them');
ok(G('dashSurface("week")')==='insights',
   'C2 …and Sessions this week does NOT: it counts what already happened, which is a past tense');
G('state.teas=[];state.sessions=[];');
ok(/Nothing on the shelf yet/.test(G('viewDashboard()')),
   'C3 day one is the greeting and one door — gated on the SHELF, not the session count');
ok((G('viewDashboard()').match(/btn-clay/g)||[]).length===1 && !/quickLogSession|Log a cup/.test(G('viewDashboard()')),
   'C4 …ONE door: board 4c\'s second link cannot work on an empty shelf, because quick log requires a tea (R88)');
ok(!/ob-step|Welcome to SlowCup/.test(G('viewDashboard()')) && !/ob-step/.test(cssSrc),
   'C5 …and the three-step checklist is gone, markup and styles — step 2 was obsolete under R43 and a to-do list nags on the one surface that must not');
// A furnished shelf with nothing to say in two of its cards.
G('state.teas='+JSON.stringify(TEAS.map(t=>Object.assign({},t,{isFavorite:false})))+';state.sessions=[];');
const bare=G('renderDashboard(dashCards(),"home")');
ok(!/Favourites/.test(bare) && !/sessions<br>this week/.test(bare),
   'C6 a card with nothing to say is ABSENT, not an apology — four empty cards would be four of them');
G('state.dashEdit=true;');
const edit=G('renderDashboard(dashCards(),"home")');
ok(/Favourites/.test(edit) && /nothing to show right now/.test(edit),
   'C7 …but EDIT MODE still names it: you cannot reorder or unhide what you cannot see (R61)');
G('state.dashEdit=false;'); seed();
console.log('  C present tense: 7 checks');

/* ---- E · Earlier today (R117) and the glance destination (R118) ---- */
// Two of today's own sittings, stamped onto real exported rows rather than invented ones.
const noonToday=new Date(); noonToday.setHours(11,0,0,0);
const todays=SESSIONS.slice(0,2).map((s,i)=>Object.assign({},s,{date:new Date(noonToday.getTime()+i*3600e3).toISOString()}));
G('state.sessions='+JSON.stringify(todays.concat(SESSIONS))+';');
const withToday=G('viewDashboard()');
ok(/Earlier today/.test(withToday), 'E1 the card appears once a cup is logged today');
ok(G('dashSurface("today")')==='home',
   'E2 `today` is present-tense, on Home (R117) — its Insights twin `recent` was culled in R161');
ok(G('DASH_DEFAULT_ORDER.indexOf("today")')===0 && G('DASH_DEFAULT_ORDER.indexOf("today") < DASH_DEFAULT_ORDER.indexOf("restock")'),
   'E3 …and it LEADS the stack: today outranks supply, so the first card changes through the day');
/* The boundary check is the one that matters, because its failure is absurd rather than subtle: the
   masthead announcing a second pour over a card showing one row. Both must read the same filter. */
/* Anchored on the CALL SITE, not the name. The first version tested for `sessionsToday(now)`, which
   is a substring of the function's own declaration `function sessionsToday(now){` — so it matched
   itself and passed with the masthead re-deriving its boundary. Caught by a negative control that
   refused to bite. Assert the consumer, never the definition. */
ok(G('sessionsToday().length')===2 && /todaySessions = sessionsToday\(/.test(dashSrc)
   && !/todaySessions = sessions\.filter/.test(dashSrc),
   'E4 the card and the masthead share ONE day boundary — the greeting READS `sessionsToday` rather than re-deriving it');
ok(!/renderStarsStatic/.test((withToday.split('Earlier today')[1]||'').split('</div></div>')[0]),
   'E5 no stars on a diary line — R2 moved ratings to detail, and time · tea · steeps · ★★★★½ is a scorecard');
/* Asserted on the CONTENT of the two spans, not their presence. The review harness rendered a diary
   line with an empty steeps span for exactly this reason — it seeded sessions with no `steeps`, and
   `brewCountLabel` returns '' for those. A class-exists check passes against an empty element. */
const dayRow=(withToday.match(/<div class="today-row"[\s\S]*?<\/div>\s*<\/div>/)||[''])[0];
ok(/today-time mono">\d\d:\d\d</.test(dayRow),
   'E6 a diary line carries a real clock time, derived from the session date (R27 — the board\'s times are illustrative)');
ok(/today-steeps mono">\d+ (steep|infusion)/.test(dayRow),
   'E7 …and a real steep count, not an empty span where one belongs');
G('state.sessions='+JSON.stringify(SESSIONS.map(s=>Object.assign({},s,{date:"2020-01-02T09:00:00Z"})))+';');
ok(!/Earlier today/.test(G('viewDashboard()')),
   'E8 and it is ABSENT on a day with no cup — blank until written on, not an empty card apologising');
G('state.sessions='+JSON.stringify(todays.concat(SESSIONS))+';');
const cards=G('dashCards()');
ok(/openSessionDetail/.test(cards.today) && !/openSessionEdit/.test(cards.today),
   'E9 R118: a diary row opens DETAIL, not the edit form — tapping a line to look at it must not land in a form');
// E10 retired — `recent` (Recent sessions) culled in R161; its R118 fix is covered by E9 on `today`.
ok(/\$\{body\}\$\{editBar\}/.test(dashSrc) && /\.dash-edit-bar\{[^}]*justify-content:\s*center/.test(cssSrc),
   'E11 Edit layout sits BELOW the stack, centred, on both surfaces — above it, it read as a third action in the masthead\'s row');
seed();
console.log('  E earlier today: 10 checks');

/* ---- D · the contract guards R116 ordered ---- */
const claySel=(cssSrc.match(/^[^\n{]*\{[^}]*var\(--clay\)[^}]*\}/gm)||[]).map(s=>s.split('{')[0].trim());
ok(claySel.length<=8, 'D1 clay\'s uses are enumerable ('+claySel.length+'): '+claySel.join(', '));
ok(claySel.filter(s=>/^\.btn-clay$/.test(s)).length===1,
   'D2 …and exactly one of them is an ACTION; the rest are decorative or textual, which is what R116 found');
const xan=(cssSrc.match(/^[^\n{]*\{[^}]*var\(--xanthous-wash\)[^}]*\}/gm)||[]).map(s=>s.split('{')[0].trim());
ok(xan.length>0 && xan.every(s=>/\.active$/.test(s)),
   'D3 contract 3 holds: xanthous appears only on selected STATE ('+xan.join(', ')+') — never identity, never action');
ok(!/kachi/.test((cssSrc.split('/* WS2 Home')[1]||'').split('/* v3 —')[0]),
   'D4 contract 4 holds on Home: kachi-iro is the Focus ring and nowhere else (R94)');
ok(!/washi/i.test(dashSrc) && !/washi/i.test(cssSrc),
   'D5 contract 5: washi has zero occurrences — its probation was deferred once (R59) on something never built');
/* D6 is the one check here that WANTS comments, so it reads unstripped source deliberately: what it
   asserts is that contract 1's absence is DECLARED. That is the difference R116 turns on — unbuilt
   is fine, unbuilt-and-believed-built is not, and a comment saying "this is the type tint, not the
   liquor swatch" is what kept anyone from ruling on a swatch that was never there. */
const rawCss=fs.readFileSync(path.join(repo,'styles.css'),'utf8');
const rawSocial=fs.readFileSync(path.join(repo,'steep-social.js'),'utf8');
ok(/TYPE tint, not a liquor swatch/.test(rawCss) && /NOT the liquor swatch/.test(rawSocial),
   'D6 contract 1 is unbuilt and SAYS SO, in two files — the shape the other four should have had (R116)');
console.log('  D contract guards: 6 checks · clay ['+claySel.join(' ')+']');

console.log('');
if(failures){ console.log('FAILED: '+failures+' of '+(passed+failures)); process.exit(1); }
console.log('ALL HOME TESTS PASSED ('+passed+' passed)');
