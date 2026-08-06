/* PERMANENT validation — R25's pass record and the #08 Social screen (committed; every deploy).
 *
 * SECTION E IS THE REASON THIS SUITE IS COMMITTED, and it is worth saying why plainly: a pass note
 * is the first text ANOTHER USER AUTHORED that this app renders on your screen outside the feed.
 * Everything else on a SlowCup surface is your own writing, where an escaping slip is a cosmetic
 * bug. Here it is a cross-account injection: the sender controls `note`, `tea_name` and — through
 * `profiles` — their own display name, and all three land in an innerHTML template. The note,
 * the tea name and the sender's name go through escapeHtml, or the pass record becomes the way in.
 *
 * Four more things nothing else can see:
 *
 * 1. THE SQL AND THE MAPPERS AGREE. `passes` is written by hand in the Supabase editor and read by
 *    a mapper pair in steep-data.js. Adding a column to one and not the other is the house's
 *    oldest drift (CLAUDE.md: "adding a persisted field means updating BOTH mappers"), and on this
 *    table it fails silently — a missing column reads as an empty string on the receive side.
 * 2. THE CIRCLE IS BOTH DIRECTIONS. The shipped app only ever read getFollowing(); a follower you
 *    don't follow back (pebbi, in the real export) was invisible to it. If circleHTML ever narrows
 *    back to `following`, the circle quietly loses a person and looks completely normal.
 * 3. R36'S TIER IS DECIDED BY COVERAGE, NEVER BY THE USER, and exactly one tier always applies.
 *    Asserted as a CLASS over real names, not as a pinned count — coverage moves when the catalog
 *    is authored (R97 is why that upgrade reaches passes already sent).
 * 4. R68 — the board's stamped figures ("5 of 31 · 16%", "A circle of three") are counted at render
 *    time or not drawn. Asserted on the source, because a literal that is true today goes quietly
 *    false while every number around it stays correct.
 *
 * Run: node fixtures/pass-record-test.js   (exit non-zero on any failure)
 * Run fixtures/export-gate-test.js FIRST — a green suite over a stale export proves nothing.
 */
const fs=require('fs'), path=require('path'), vm=require('vm');
const repo=path.join(__dirname,'..');
// steep-shopping.js is loaded for R109: the wishlist is where a passed tea now goes, so its writer
// (persistWish) and R49's join (wishHasTeaName) are part of the path under test, not a stub.
const SRC=['steep-knowledge.js','steep-tea-types.js','steep-core.js','steep-dashboard.js','steep-teas.js','steep-reference.js','steep-shopping.js','steep-social.js','steep-sessions.js']
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
const G = expr => vm.runInContext(expr, ctx);
const S = G('state');

let passed=0, failures=0;
const ok=(c,m)=>{ if(c){passed++;} else {failures++; console.log('  FAIL: '+m);} };

// R73: the working copy carries \r under core.autocrlf, and `.` does not cross a line terminator.
const lines = s => s.split(/\r?\n/);
const socialSrc = fs.readFileSync(path.join(repo,'steep-social.js'),'utf8');
/* Every "this string appears nowhere" scan below runs on the source with COMMENTS REMOVED, and
   that is not fussiness: four of these assertions failed on their first run by matching the
   comment that explains why the string must not be there. A prose scan that reads its own
   rationale as a violation is a suite that can only be made green by deleting the explanation. */
const codeOf = s => lines(s.replace(/\/\*[\s\S]*?\*\//g,'')).filter(l=>!/^\s*\/\//.test(l)).join('\n');
const socialCode = codeOf(socialSrc);
const dataSrc   = fs.readFileSync(path.join(repo,'steep-data.js'),'utf8');
const sqlSrc    = fs.readFileSync(path.join(repo,'sql','v3_10-pass-record.sql'),'utf8');

function parseCSV(t){const R=[];let r=[],c='',q=false;for(let i=0;i<t.length;i++){const ch=t[i];
 if(q){if(ch==='"'){if(t[i+1]==='"'){c+='"';i++;}else q=false;}else c+=ch;}
 else if(ch==='"')q=true;else if(ch===','){r.push(c);c='';}
 else if(ch==='\n'){r.push(c);R.push(r);r=[];c='';}else if(ch!=='\r')c+=ch;}
 if(c||r.length){r.push(c);R.push(r);}
 const h=R[0];return R.slice(1).filter(x=>x.length===h.length)
   .map(x=>Object.fromEntries(h.map((k,i)=>[k,x[i]])));}
const rows=f=>parseCSV(fs.readFileSync(path.join(__dirname,f),'utf8'));

const PROFILES = rows('profiles_rows.csv');
const FOLLOWS  = rows('follows_rows.csv');
const SESSROWS = rows('sessions_rows.csv');
const TEAROWS  = rows('teas_rows.csv');
// R69 — the export is not user-scoped. Sessions are single-owner (the gate asserts it); derive the
// owner from them rather than hardcoding a uuid, and scope the teas by it.
const OWNER = SESSROWS[0].user_id;
const ME = PROFILES.find(p=>p.id===OWNER);

console.log('R25 PASS RECORD + #08 SOCIAL — fixtures/*.csv');
console.log('  owner '+OWNER.slice(0,8)+' · profiles '+PROFILES.length+' · follow edges '+FOLLOWS.length+' · sessions '+SESSROWS.length);

/* ---- A. the SQL and the mappers describe the same row ---- */
const createBlock = (sqlSrc.match(/create table if not exists passes \(([\s\S]*?)\n\);/)||[])[1]||'';
const sqlCols = lines(createBlock).map(l=>(l.trim().match(/^([a-z_]+)\s+(uuid|text|timestamptz)/)||[])[1]).filter(Boolean);
ok(sqlCols.length===9, 'A1 the migration declares 9 columns — got '+sqlCols.length+' ('+sqlCols.join(', ')+')');
ok(sqlCols.includes('tea_name') && sqlCols.includes('tea_type'),
   'A2 R96: the denormalised snapshot columns exist — a recipient cannot read `teas` (owner-only RLS)');
ok(!sqlCols.includes('catalog_slug'),
   'A3 R97: no catalog_slug column — the tier resolves at read time so a later `covers` entry upgrades old passes');
ok(/tea_name\s+text\s+not null/.test(createBlock),
   'A4 tea_name is NOT NULL — a pass with no readable name renders a blank row on the receive side');
ok(/default gen_random_uuid\(\)/.test(createBlock),
   'A5 id defaults to gen_random_uuid() like every other table — a manual insert is the only way to exercise the receive side');

const fromBlock = (dataSrc.match(/const passFromDb = r => \(\{([\s\S]*?)\}\);/)||[])[1]||'';
const toBlock   = (dataSrc.match(/const passToDb = p => \(\{([\s\S]*?)\}\);/)||[])[1]||'';
ok(fromBlock && toBlock, 'A6 both mappers exist in steep-data.js');
const readCols  = [...new Set((fromBlock.match(/r\.([a-z_]+)/g)||[]).map(s=>s.slice(2)))];
// Anchor on start-of-line OR a comma: several keys share a line, and an anchor that only sees the
// first of them reports the rest as "missing" — a scan that fails loudly rather than silently, but
// a scan that would have been wrong in the other direction just as easily.
const writeCols = [...new Set((toBlock.match(/(?:^|,)\s*([a-z_]+):/gm)||[]).map(s=>s.replace(/[^a-z_]/g,'')))];
const missingRead = sqlCols.filter(c=>!readCols.includes(c));
ok(missingRead.length===0, 'A7 passFromDb reads every column the migration declares — missing: '+missingRead.join(', '));
const strayWrite = writeCols.filter(c=>!sqlCols.includes(c));
ok(strayWrite.length===0, 'A8 passToDb writes no column the migration lacks — stray: '+strayWrite.join(', '));
// created_at is the ONE legitimate write-side omission: the DB default owns it.
const missingWrite = sqlCols.filter(c=>!writeCols.includes(c) && c!=='created_at');
ok(missingWrite.length===0, 'A9 passToDb writes every column except created_at (DB default) — missing: '+missingWrite.join(', '));

/* ---- B. the circle is BOTH directions of the follow graph ---- */
const following = FOLLOWS.filter(f=>f.follower_id===OWNER).map(f=>f.followee_id);
const followers = FOLLOWS.filter(f=>f.followee_id===OWNER).map(f=>f.follower_id);
const profMap = {}; PROFILES.forEach(p=>{ profMap[p.id]={id:p.id,username:p.username,displayName:p.display_name||'',avatarUrl:p.avatar_url||null}; });
S.social = { loaded:true, busy:false, profile:profMap[OWNER], following, followers, profiles:profMap,
             feed:{sessions:[],profiles:{},following,hasMore:false}, passes:null, passesFailed:false,
             search:null, searchOpen:false, profileEditOpen:false, draft:null, err:null };
const circle = G('circleHTML()');
ok(followers.length>following.length,
   'B1 the real graph HAS an inbound-only edge — otherwise this section proves nothing (following '+following.length+' / followers '+followers.length+')');
const inboundOnly = followers.filter(id=>!following.includes(id));
inboundOnly.forEach(id=>ok(circle.includes(profMap[id].username),
   'B2 @'+profMap[id].username+' follows you and is drawn — invisible to the shipped getFollowing() read'));
const mutuals = following.filter(id=>followers.includes(id));
mutuals.forEach(id=>ok(circle.includes('is-mutual'),
   'B3 the mutual thread with @'+profMap[id].username+' is marked, not just listed'));
ok((circle.match(/class="circle-row/g)||[]).length===new Set(following.concat(followers)).size,
   'B4 every edge draws exactly one row, no duplicates across the two directions');
ok(!circle.includes(OWNER), 'B5 you are not in your own circle');
// doUnfollow is shipped capability: without it a follow can never be undone in-app (R61).
mutuals.forEach(()=>ok(/doUnfollow\(/.test(circle), 'B6 unfollow stays reachable on the edges you own'));
ok(!/doUnfollow\('\s*'\)/.test(circle) && (circle.match(/doUnfollow/g)||[]).length===following.length,
   'B7 unfollow is drawn on exactly the edges you own, never on an inbound-only one');

/* ---- C. R68 — the figures are counted, never transcribed ---- */
const teas = TEAROWS.filter(t=>t.user_id===OWNER).map(t=>({id:t.id,name:t.name,type:t.type}));
const sessions = SESSROWS.map(r=>({id:r.id,teaId:r.tea_id,vesselId:r.vessel_id,date:r.session_date,
  teaName:r.tea_name||'',teaType:r.tea_type||'',brewStyle:r.brew_style||'',
  isColdBrew:r.is_cold_brew==='true'||r.is_cold_brew==='t',isShared:r.is_shared==='true'||r.is_shared==='t'}));
S.teas=teas; S.sessions=sessions; S.vessels=[];
const sharedN = sessions.filter(s=>s.isShared).length;
const shared = G('sharedByYouHTML()');
console.log('  shared by you: '+sharedN+' of '+sessions.length+' (reported, not pinned)');
ok(shared.includes(sharedN+' of '+sessions.length),
   'C1 the fraction is the engine\'s own count of the loaded rows');
ok(!/5 of 31|16%/.test(socialCode), 'C2 the board\'s stamped "5 of 31 · 16%" appears nowhere in the code');
ok(!/A circle of three|circle of 3/i.test(socialCode), 'C3 "A circle of three" is counted, not written');
ok(/circleCountLine/.test(socialCode) && /if\(!total\) return ''/.test(socialCode),
   'C4 the circle count omits itself at zero rather than reading "a circle of 0"');
// The half matters: a rounded 53% stops reconciling with its own fraction (hand-off §1).
const pct = Math.round((sharedN/sessions.length)*1000)/10;
ok(shared.includes(String(pct)+'%'), 'C5 the percentage keeps its half — '+pct+'%');
// R90: a null brew_style contributes no method word, on this surface as on the hero.
const nullStyle = sessions.filter(s=>s.isShared && !s.brewStyle && !s.isColdBrew);
ok(/sessionMethodLabel\(/.test(socialCode) && !/SESSION_METHODS\.find/.test(socialCode),
   'C6 the shared row calls R90\'s single writer instead of relabelling the method itself'
   + (nullStyle.length?' ('+nullStyle.length+' shared row(s) carry no stored method)':''));

/* ---- D. R36 — coverage picks the destination, and exactly one tier applies ---- */
const names = [...new Set(teas.map(t=>t.name))];
let covered=0, preview=0;
names.forEach(n=>{
  const cat = G('passCategoryFor('+JSON.stringify(n)+')');
  const isCat = !!cat;
  if(isCat){ covered++; ok(!!G('resolveTeaType('+JSON.stringify(cat)+')'),
    'D1 '+n+' → a category that actually resolves ('+cat+'), never a member slug that opens nothing'); }
  else preview++;
});
console.log('  R36 destinations over '+names.length+' shelf names: Go Deeper '+covered+' · minimal preview '+preview);
ok(covered+preview===names.length, 'D2 every name lands in exactly one tier — never both, never neither');
ok(preview>0, 'D3 the minimal preview is the COMMON case on real data, not a fallback — '+preview+' of '+names.length+' uncovered');
// R98: script's only source is a CJK entry in a catalog row's aka, so it CANNOT render on the
// no-catalog branch. Asserted, because the board draws it there.
names.filter(n=>!G('passCategoryFor('+JSON.stringify(n)+')')).forEach(n=>
  ok(G('passScriptFor('+JSON.stringify(n)+')')==='',
     'D4 R98: "'+n+'" is uncovered, so its preview has no script — by construction, not by omission'));
const covName = names.find(n=>G('passCategoryFor('+JSON.stringify(n)+')'));
ok(covName && /social-tile/.test(G('socialTileHTML("green",'+JSON.stringify(covName)+')')),
   'D5 the tile renders for a covered tea');
ok(!/liquor|swatchColor|--liquor/.test(socialCode),
   'D6 R93: no liquor swatch is invented here — the tile is the shipped type tint');
/* D7 is slice B's cascade bug, guarded at the only place it is visible. `.social-tile` and `.t-green`
   are both (0,1,0), and this block is appended BELOW the .t-* palette, so a `background` on the base
   rule wins on source order and flattens every type tint to one colour. It shipped that way in this
   very slice and was caught by reading the computed background, not by checking the rule existed —
   exactly how `.vessel-tile` was caught in v3.96. An assertion that the rule EXISTS cannot see this. */
const cssSrc = fs.readFileSync(path.join(repo,'styles.css'),'utf8');
const tileBase = (cssSrc.match(/\n\.social-tile\{([^}]*)\}/)||[])[1]||'';
ok(tileBase, 'D7a the .social-tile base rule is findable');
ok(!/background/.test(tileBase),
   'D7b the base rule sets NO background — equal specificity plus later source order would flatten every type tint');
ok(/\.social-tile\.t-unknown\{[^}]*background/.test(cssSrc),
   'D7c the untyped case gets its colour from a COMPOUND rule, so every tile is coloured by a .t-* class');

/* ---- E. THE SECTION THIS SUITE EXISTS FOR: another user's text ---- */
const XSS = '<img src=x onerror=alert(1)>';
S.social.profiles = { ...profMap, 'attacker': {id:'attacker',username:'a'+XSS,displayName:XSS,avatarUrl:null} };
const evil = { id:'p1', fromProfile:'attacker', toProfile:OWNER, sessionId:null, teaId:null,
               teaName:XSS+' Rou Gui', teaType:'oolong', note:'nice tea '+XSS, createdAt:'2026-07-12T09:00:00Z' };
const evilRow = G('passRowHTML('+JSON.stringify(evil)+', state.social.profiles.attacker)');
ok(!/<img src=x/.test(evilRow), 'E1 the sender\'s NOTE cannot inject markup');
/* Escaping NEUTRALISES, it does not strip: "onerror=" survives as visible TEXT and that is correct.
   So the assertion cannot be "the string is absent" — the row legitimately carries our own
   onclick= handlers, and a scan that can't tell the two apart is a scan that passes by luck.
   Render the SAME row twice, benign and hostile, and require the count of attribute-position
   handlers to be identical: hostile input that opens even one new handler moves this number. */
const benign = { ...evil, teaName:'Rou Gui', note:'nice tea' };
const benignRow = G('passRowHTML('+JSON.stringify(benign)+', {id:"attacker",username:"a",displayName:"Ruth"})');
// ATTRIBUTE POSITION means inside a real tag. Escaped text reads "&lt;img … onerror=…&gt;" and
// contains no raw `<`, so it is never captured here — which is precisely the property being
// asserted, and why a whole-string scan reported four phantom handlers on the first run.
const tagsOf = s => (s.match(/<[^>]*>/g)||[]).join(' ');
const handlers = s => (tagsOf(s).match(/\son[a-z]+\s*=/g)||[]).length;
ok(handlers(evilRow)===handlers(benignRow),
   'E2 hostile text opens no attribute-position handler — '+handlers(evilRow)+' vs '+handlers(benignRow)+' in the benign row');
ok(handlers(benignRow)>0, 'E2b …and the comparison is meaningful: the row does carry real handlers');
ok(!/"/.test(G('escapeHtml(\'a " b\')')) , 'E2c escapeHtml turns a double quote into &quot; — the attribute-break primitive');
ok(evilRow.includes('&lt;img'), 'E3 the hostile text is rendered as visible text, not dropped silently');
ok(evilRow.includes('nice tea'), 'E4 the note still READS — escaping, not stripping');
const evilTile = G('socialTileHTML("oolong", '+JSON.stringify(XSS)+')');
ok(!/<img src=x/.test(evilTile), 'E5 the tile escapes the name it derives its script from');
// The name also travels back out through an onclick argument on Add to shelf.
ok(!/onclick="addPassToShelf\('[^']*<img/.test(evilRow), 'E6 the id in the inline handler is escapeJsArg\'d');
// And the same three fields on the SEND side, where they are your own but still user text.
ok(/escapeJsArg\(t\.name\)/.test(fs.readFileSync(path.join(repo,'steep-teas.js'),'utf8')),
   'E7 the tea name entering the send sheet from #03 is escaped for an inline handler');
ok(/escapeJsArg\(s\.teaName\|\|''\)/.test(fs.readFileSync(path.join(repo,'steep-sessions.js'),'utf8')),
   'E8 the same from #02b, using the SNAPSHOT name — history is not re-spelled on the way out');

/* ---- F. structure: one writer, no shelf mutation, the feed preserved ---- */
const code = socialCode;
ok(/function openPassSheet\(/.test(code) && (code.match(/SteepDB\.sendPass\(/g)||[]).length===1,
   'F1 exactly ONE call site sends a pass — two send surfaces, one writer (the methodLanesHTML lesson)');
['putTea(','persistTea(','saveKey(','removeTea('].forEach(w=>
  ok(!code.includes(w), 'F2 receiving a pass never mutates your shelf directly ('+w+' absent)'));
ok(/state\.teaPrefill/.test(code) && /openTeaForm\(\)/.test(code),
   'F3 Add to shelf opens the prefilled create FORM — nothing is written until the user commits it');

/* ---- F9–F14 · R109: a pass is a RECOMMENDATION, so it goes to the wishlist ----
   R36 made Add-to-shelf the only action. Using the app overturned it: a shelf row claims ownership
   of a tea you have only been told about, and the claim PROPAGATES — 0 g enters stock, reads
   `empty` under stockTier, surfaces in Shopping's running-low list, and takes a slot in the tea
   count. The propagation is asserted below rather than described, because it is the actual argument
   and it is the part a future "simplification" back to one action would not notice. */
// The writer touches the persistence + toast + render surface; stub only those, so what is being
// asserted is the writer's own logic rather than a re-implementation of it.
let _wrote = 0;
ctx.SteepDB = { newId: () => 'w' + (++_wrote), putWishItem: () => Promise.resolve() };
ctx.showToast = () => {};
vm.runInContext('render=function(){};', ctx);
S.teas=teas; S.wishlist=[];
const passIn = { id:'p9', fromProfile:'attacker', toProfile:OWNER, sessionId:null, teaId:null,
                 teaName:'Rou Gui', teaType:'oolong', note:'the second steep is where it opens',
                 createdAt:'2026-07-12T09:00:00Z' };
S.social.passes = { sent:[], received:[passIn], profiles:{} };
S.social.profiles = { ...profMap, attacker:{id:'attacker',username:'ruth',displayName:'Ruth',avatarUrl:null} };
const rowR109 = G('passRowHTML(state.social.passes.received[0], state.social.profiles.attacker)');
ok(/addPassToWishlist\(/.test(rowR109), 'F9 R109 the PRIMARY action is Add to wishlist');
ok(/Add to wishlist/.test(rowR109), 'F10 …and it says so in words, not just in the handler');
ok(/addPassToShelf\(/.test(rowR109), 'F11 R109 Add-to-shelf survives as the secondary action — someone may already own it');
ok(rowR109.indexOf('addPassToWishlist') < rowR109.indexOf('addPassToShelf'),
   'F12 …and the wishlist comes FIRST in the markup, so it is the default rather than a peer');
// The writer, and its guard. addWishFromTea's guard had to move to the writer once rebuyYes
// inherited the bug; this one starts there.
G("addPassToWishlist('p9');");
ok(S.wishlist.length===1 && S.wishlist[0].name==='Rou Gui', 'F13 the pass lands on the wishlist as a want');
ok(/second steep/.test(S.wishlist[0].note||'') && /Ruth/.test(S.wishlist[0].note||''),
   'F14 the sender\'s note is CARRIED with its attribution — the shelf had nowhere to put it');
G("addPassToWishlist('p9');");
ok(S.wishlist.length===1, 'F15 adding the same pass twice creates ONE row — the guard is at the writer');
// The propagation R109 exists to prevent: had it gone to the shelf, this tea would be stock at 0 g.
const wouldBeShelfRow = { id:'x', name:'Rou Gui', type:'oolong', amountGrams:0 };
ok(G('stockTier')(wouldBeShelfRow)!=='plenty',
   'F16 a 0 g shelf row is NOT neutral — it reads as a stock tier, which is why a recommendation must not become one');
S.wishlist=[];
ok(/function circleFeedHTML\(/.test(code) && /feedHTML\(\)/.test(code),
   'F4 R61: the feed keeps its home on the new screen — the board absorbed two tabs and orphaned this one');
ok(/loadMoreFeed/.test(code), 'F5 feed paging (v3.66) survives the rebuild');
ok(!/setSocialTab/.test(code), 'F6 the replaced tab chrome is gone, not left dangling with no caller');
ok(/searchProfiles|doSearch/.test(code), 'F7 find-by-handle survives as the ＋ row');
// R35: presence is parked. Nothing may ship, not even a placeholder.
ok(!/presence|right now|having tea/i.test(socialCode),
   'F8 R35: presence is PARKED — no strip, no placeholder, no dormant helper');

/* ---- G. an empty shelf and a MISSING TABLE must not look the same ---- */
S.social.passes = { sent:[], received:[], profiles:{} }; S.social.passesFailed = false;
const emptyShelf = G('passesHTML()');
S.social.passes = null; S.social.passesFailed = true;
const brokenShelf = G('passesHTML()');
ok(/Nothing passed your way yet/.test(emptyShelf), 'G1 no passes yet reads as an empty shelf');
ok(/v3_10-pass-record\.sql/.test(brokenShelf), 'G2 a FAILED read names the migration instead');
ok(emptyShelf!==brokenShelf,
   'G3 the two are distinguishable — "nothing passed yet" over a failed read is a lie shaped exactly like the truth');
// On ship day the shelf is empty by construction: zero passes exist anywhere.
console.log('  NOTE: Passed-to-you is empty by construction on ship day — no pass record exists yet (the B3 0/21 shape).');

console.log('');
if(failures){ console.log('FAILED: '+failures+' of '+(passed+failures)); process.exit(1); }
console.log('ALL PASS-RECORD TESTS PASSED ('+passed+' passed)');
