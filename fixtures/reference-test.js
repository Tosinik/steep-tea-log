/* PERMANENT validation — R51 Go Deeper, the Teas tab's second mode (committed; every deploy).
 *
 * Three things this guards that nothing else can:
 *
 * 1. THE REFERENCE NEVER WRITES. steep-tea-types.js's own header says "reference SUGGESTS, it never
 *    writes over logged data". That is a one-line rule and a one-line violation away from being
 *    false; a browse surface sitting next to an editable shelf is exactly where a convenience
 *    "save this to my tea" would appear. Asserted structurally, on the module's source.
 * 2. COVERAGE IS RENDERED HONESTLY. matchTeaType is exact-fold `covers`-only by design, so most
 *    categories are NOT on your shelf. #13 dims those and marks the rest. If the marker ever
 *    defaulted to "owned", the surface would claim knowledge of teas it has never matched — and on
 *    real data that error is invisible, because a shelf that looks fully covered looks fine.
 * 3. THE THREE-TIER CASCADE. user value → catalog default → SHOW NOTHING. A fact the catalog lacks
 *    is omitted, never rendered as an empty label, a dash or a zero.
 *
 * Run: node fixtures/reference-test.js   (exit non-zero on any failure)
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
const G = expr => vm.runInContext(expr, ctx);
const S = G('state');

let passed=0, failures=0;
const ok=(c,m)=>{ if(c){passed++;} else {failures++; console.log('  FAIL: '+m);} };
const refSrc = fs.readFileSync(path.join(repo,'steep-reference.js'),'utf8');
// R73: the working copy carries \r under core.autocrlf, and `.` does not cross a line terminator —
// a line-based scan that forgets this matches nothing and degrades silently to green.
const refLines = refSrc.split(/\r?\n/);

/* ---- A. the reference writes NOTHING ---- */
const WRITERS = ['SteepDB','persistTea(','putTea(','saveKey(','persistVessel(','putSession(','removeTea('];
const codeLines = refLines.filter(l=>!/^\s*(\/\/|\*|\/\*)/.test(l));
for(const w of WRITERS){
  ok(!codeLines.some(l=>l.indexOf(w)>=0), 'A1 steep-reference.js never calls '+w);
}
// state may be READ; the only writes allowed are the surface's own transient view state.
const assigns = [...refSrc.matchAll(/state\.([A-Za-z_]+)\s*=/g)].map(m=>m[1]);
ok(assigns.every(k=>k==='refSearch'||k==='refOpen'),
   'A2 the only state it assigns is its own view state (got: '+([...new Set(assigns)].join(', ')||'none')+')');
console.log('  A the reference never writes: '+(WRITERS.length+1)+' checks');

/* ---- B. every catalog category reaches the list ---- */
const cats = G('browseTeaTypes()');
// `class="ref-row` PREFIX-matches ref-rowhead and ref-rowmid — counting on it reports 108 rows for
// 27 categories. The trailing character class is what makes this a row count rather than a substring
// count; the first draft of this suite got it wrong and failed loudly, which is the good direction.
const rowCount = h => (h.match(/class="ref-row[ "]/g)||[]).length;
S.teas=[]; S.refSearch=''; S.refOpen=null;
const empty = ctx.refListHTML();
ok(cats.length>0, 'B1 browseTeaTypes() returns categories ('+cats.length+')');
let allDrawn = cats.every(c=>empty.indexOf(ctx.escapeHtml(c.type.display_name))>=0);
ok(allDrawn, 'B2 all '+cats.length+' categories render with an empty shelf');
ok(rowCount(empty)===cats.length, 'B3 one row per category, no duplicates or drops (got '+rowCount(empty)+')');
// With no teas, NOTHING may be marked owned — the marker is evidence, never a default.
ok(empty.indexOf('on your shelf')<0, 'B4 an empty shelf marks nothing as owned');
ok((empty.match(/is-unowned/g)||[]).length===cats.length, 'B5 with no teas every row is dimmed');
console.log('  B every category reaches the list: 5 checks');

/* ---- C. the owned marker comes from matchTeaType, never a guess ---- */
const covered = cats.find(c=>(c.type.covers||[]).length) ||
                cats.find(c=>c.members.some(m=>(m.covers||[]).length));
const coveredRow = (covered.type.covers||[]).length ? covered.type : covered.members.find(m=>(m.covers||[]).length);
const coverName = coveredRow.covers[0];
S.teas=[{id:'t1',name:coverName,type:'oolong',amountGrams:10}];
const oneOwned = ctx.refListHTML();
ok((oneOwned.match(/on your shelf/g)||[]).length>=1, 'C1 a tea the catalog covers marks its category (via "'+coverName+'")');
ok((oneOwned.match(/is-unowned/g)||[]).length===cats.length-1, 'C2 exactly one category loses the dim');
// A name the catalog does not cover must mark NOTHING — matchTeaType returns null, never a near-miss.
S.teas=[{id:'t2',name:'A Tea Nobody Curated 12345',type:'green',amountGrams:10}];
const noneOwned = ctx.refListHTML();
ok(noneOwned.indexOf('on your shelf')<0, 'C3 an uncovered tea marks nothing (no fuzzy ownership)');
ok(G('matchTeaType("A Tea Nobody Curated 12345")')===null, 'C4 matchTeaType itself returns null rather than guessing');
console.log('  C owned marker is evidence, not default: 4 checks');

/* ---- D. three-tier cascade: an absent fact is omitted, not emptied ---- */
S.teas=[]; S.refOpen=cats[0].type.slug;
const openHtml = ctx.refListHTML();
ok(openHtml.indexOf('ref-body')>=0, 'D1 the expanded category renders its body');
ok(!/ref-fact-v"><\/span>/.test(openHtml), 'D2 no fact renders with an empty value');
ok(!/ref-fact-v">(—|-|0|null|undefined)</.test(openHtml), 'D3 no fact renders as a dash, a zero or an undefined');
// A row stripped of every optional field must render its head and nothing else.
const bare = ctx.refFactsHTML({slug:'x',display_name:'Bare',confidence:'canonical'});
ok(bare.indexOf('ref-fact')<0 && bare.indexOf('ref-sig')<0, 'D4 a row with no catalog facts renders no fact lines at all');
/* D5–D7: a member shows only what it ADDS. TT_INHERIT resolves a member to its parent's
   region/leaf/oxidation/roast/brew verbatim, so drawing them again repeated eight identical lines
   nine times under Wuyi Yancha — found in the browser, not in a test, which is why it is pinned now.
   Confidence is EXEMPT: it is per-row by design, so a contested member keeps its hedge. */
const parented = cats.find(c=>c.members.length>1);
if(parented){
  const pKeys = ctx.refFactKeys(parented.type);
  const memberSlug = parented.members[0].slug;
  const full = ctx.refFactsHTML(G('resolveTeaType('+JSON.stringify(memberSlug)+')'), null);
  const trimmed = ctx.refFactsHTML(G('resolveTeaType('+JSON.stringify(memberSlug)+')'), pKeys);
  ok(trimmed.length < full.length, 'D5 a member drops the facts it merely inherits');
  ok(pKeys.region && trimmed.indexOf(ctx.escapeHtml(pKeys.region))<0, 'D6 the inherited region is not repeated under its parent');
  const contestedMember = parented.members.find(m=>m.confidence==='contested');
  if(contestedMember){
    ok(ctx.refFactsHTML(G('resolveTeaType('+JSON.stringify(contestedMember.slug)+')'), pKeys).indexOf('ref-hedge')>=0,
       'D7 a contested member keeps its hedge even when every inherited fact is trimmed');
  }
}
S.refOpen=null;
console.log('  D three-tier cascade: '+(parented?7:4)+' checks');

/* ---- E. contested rows carry their hedge (the content contract, §3 of steep-tea-types.js) ---- */
const contested = G('TEA_TYPES.filter(t=>t.confidence==="contested").map(t=>t.slug)');
ok(contested.length>0, 'E1 the catalog still holds contested rows ('+contested.join(', ')+')');
let hedgedAll = true, hedgedNone = true;
contested.forEach(slug=>{ if(ctx.refFactsHTML(G('resolveTeaType('+JSON.stringify(slug)+')')).indexOf('ref-hedge')<0) hedgedAll=false; });
ok(hedgedAll, 'E2 every contested row renders the hedge');
G('TEA_TYPES.filter(t=>(t.confidence||"canonical")!=="contested").map(t=>t.slug)')
  .forEach(slug=>{ if(ctx.refFactsHTML(G('resolveTeaType('+JSON.stringify(slug)+')')).indexOf('ref-hedge')>=0) hedgedNone=false; });
ok(hedgedNone, 'E3 a canonical row renders no hedge — the hedge means something');
console.log('  E confidence hedge: 3 checks');

/* ---- F. search folds through the catalog's own normaliser ---- */
S.teas=[]; S.refOpen=null;
const wuyi = cats.find(c=>/wuyi/i.test(c.type.display_name));
if(wuyi){
  const probes = ['wuyi','WUYI','Wúyí'];
  probes.forEach(q=>{ S.refSearch=q; ok(ctx.refListHTML().indexOf(wuyi.type.display_name)>=0, 'F1 "'+q+'" reaches Wuyi'); });
  // a CJK alias must reach its own row — ttNormName passes CJK through untouched
  const cjk = (wuyi.type.aka||[]).find(a=>/[㐀-鿿]/.test(a));
  if(cjk){ S.refSearch=cjk; ok(ctx.refListHTML().indexOf(wuyi.type.display_name)>=0, 'F2 the CJK alias "'+cjk+'" reaches its row'); }
  S.refSearch='oolong';
  const fam = ctx.refListHTML();
  ok(rowCount(fam) < cats.length, 'F3 a family query narrows the list ('+rowCount(fam)+' of '+cats.length+')');
  ok(rowCount(fam) > 0, 'F4 …but does not empty it');
  S.refSearch='zzzznothing';
  ok(ctx.refListHTML().indexOf('empty')>=0, 'F5 a query matching nothing says so rather than rendering a blank list');
  S.refSearch='';
}
console.log('  F search: '+(wuyi?6:0)+' checks');

/* ---- G. the tab's three states, one variable ---- */
for(const [input,expect] of [['teas','teas'],['vessels','vessels'],['deeper','deeper'],['nonsense','teas'],[undefined,'teas']]){
  S.teaSeg=input;
  ok(ctx.teaSegOf()===expect, 'G1 teaSeg '+JSON.stringify(input)+' normalises to '+expect);
}
S.teaSeg='deeper'; S.teas=[]; S.vessels=[]; S.sessions=[]; S.refSearch=''; S.teaOverflowOpen=false;
const deeperView = ctx.viewTeas();
ok(deeperView.indexOf('refList')>=0, 'G2 the deeper segment renders the reference');
ok(deeperView.indexOf('tea-segs')<0, 'G3 Go Deeper draws no teas/vessels segment row (#13 draws none)');
ok(deeperView.indexOf('toggleTeaOverflow')<0, 'G4 Go Deeper draws no ⋯ overflow (#13 draws none)');
ok(deeperView.indexOf('openTeaForm')<0, 'G5 Go Deeper offers no Add — it is not your shelf');
S.teaSeg='teas';
const shelfView = ctx.viewTeas();
ok(shelfView.indexOf('tea-segs')>=0 && shelfView.indexOf('toggleTeaOverflow')>=0, 'G6 the shelf draws both the segment row and the ⋯');
ok(shelfView.indexOf('openTeaForm()')>=0, 'G7 Add stays VISIBLE on the shelf, not behind the ⋯ (§0.5 contract 2)');
// Assert the SYMBOL, not the prose: scanning for the label "Import backup" matched this module's own
// comment saying it is deliberately absent — a guard that fails on its own explanation is the
// green-adjacent failure R73 was written about, from the other side.
const teasSrc = fs.readFileSync(path.join(repo,'steep-teas.js'),'utf8');
ok(!/triggerImport/.test(teasSrc), 'G8 no second Import-backup entry point reached the Teas tab (it ships in Settings)');
console.log('  G tab states: 12 checks');

/* ---- H. escaping — catalog strings and tea names both reach innerHTML ---- */
S.teas=[{id:'x',name:'<img src=x onerror=alert(1)>',type:'green',amountGrams:5}];
S.teaSeg='deeper'; S.refSearch=''; S.refOpen=cats[0].type.slug;
const hostile = ctx.viewTeas();
ok(hostile.indexOf('<img src=x')<0, 'H1 a hostile tea name never reaches the reference unescaped');
S.refSearch='<script>';
ok(ctx.viewTeas().indexOf('value="<script>"')<0, 'H2 the search value is escaped back into the input');
S.refSearch=''; S.refOpen=null; S.teas=[];
console.log('  H escaping: 2 checks');

/* ---- J. R51's contextual half (slice B2): the deep link and the borrow ----
   Two failure modes here are silent by nature. A deep link that passes a MEMBER slug to state.refOpen
   opens nothing, and a closed row looks exactly like a row nobody tapped. A borrow that quietly
   widened its no-guide guard would overwrite a user's own words with no symptom at all. Both pinned. */
const SRC_TEAS_B2 = fs.readFileSync(path.join(repo,'steep-teas.js'),'utf8');
/* borrowGuideFrom is the first thing here that WRITES, so it needs the persistence and re-render
   seams stubbed. Deliberately narrow: putTea records the call so J-section can assert the write
   actually reached the persistence layer rather than only mutating state in memory. */
let putCalls = 0;
ctx.SteepDB = { putTea: () => { putCalls++; return Promise.resolve(); } };
ctx.render = () => {};
ctx.showToast = () => {};
const parentCovered = cats.find(c=>c.members.some(m=>(m.covers||[]).length));
if(parentCovered){
  const covered = parentCovered;
  const member = covered.members.find(m=>(m.covers||[]).length);
  S.teas=[{id:'m1',name:member.covers[0],type:'oolong',amountGrams:10}];
  ok(ctx.matchTeaType(member.covers[0]).slug===member.slug, 'J1 the matcher resolves this name to the MEMBER row');
  ok(ctx.refCategoryFor(S.teas[0])===covered.type.slug,
     'J2 the deep link walks the member up to its browse CATEGORY (a member slug would open nothing)');
  ok(ctx.refEntryLabel(S.teas[0])===member.display_name, 'J3 the source line names the matched row, not the parent');
}
// A top-level match resolves to itself — the walk must not over-climb.
const topCovered = cats.find(c=>(c.type.covers||[]).length);
if(topCovered){
  const tt={id:'m2',name:topCovered.type.covers[0],type:'oolong',amountGrams:10};
  ok(ctx.refCategoryFor(tt)===topCovered.type.slug, 'J4 a top-level match resolves to itself');
}
// An uncovered tea gets NO deep link and NO borrow — absent, not disabled (the honest-absence rule).
const un={id:'u1',name:'A Tea Nobody Curated 12345',type:'green',amountGrams:10};
ok(ctx.refCategoryFor(un)===null, 'J5 an uncovered tea has no category to link to');
ok(ctx.borrowButtonHTML(un)==='' && ctx.goDeeperLinkHTML(un)==='', 'J6 …so neither control renders at all');
ok(ctx.borrowButtonHTML({id:'c1',name:topCovered?topCovered.type.covers[0]:'x',type:'oolong'})!=='',
   'J7 …while a covered tea does get the borrow button');
// The guard is KEPT, not widened: borrow returns early on an existing guide, exactly as saveSuggestedGuide does.
ok(/if\(!tea \|\| tea\.brewGuide\) return;/.test(SRC_TEAS_B2),
   'J8 borrowGuideFrom keeps the no-guide guard — replacing a saved guide is a separate decision');
ok(/scheduleToGuideText/.test(SRC_TEAS_B2), 'J9 borrow writes through the one parser-safe emitter');
ok(!/typical_brew[\s\S]{0,80}times/.test(SRC_TEAS_B2), 'J10 borrow never invents per-step times from the catalog');
// End to end: borrow, then re-parse. The written guide must round-trip or the timer reads it wrong.
if(topCovered && (topCovered.type.covers||[]).length){
  const name = topCovered.type.covers[0];
  S.teas=[{id:'b1',name:name,type:'oolong',amountGrams:10,brewGuide:''}];
  S.sessions=[];
  ctx.borrowGuideFrom('b1');
  const written = S.teas[0].brewGuide;
  const reparsed = ctx.parseBrewGuide(written);
  ok(!!written, 'J11 borrow writes a guide ('+JSON.stringify(written)+')');
  ok(reparsed && reparsed.times && reparsed.times.length>0, 'J12 the written guide re-parses to a real schedule');
  const before = ctx.effectiveGuideSchedule({id:'x',name:name,type:'oolong'}, true);
  ok(before && JSON.stringify(reparsed.times)===JSON.stringify(before.times),
     'J13 the times survive the round trip unchanged (generateFormTimes → text → parseBrewGuide)');
  const catTemp = (topCovered.type.typical_brew||{}).temp_c;
  if(catTemp && catTemp.length) ok(reparsed.tempC===catTemp[0], 'J14 the CATALOG temp is what got written, not the KB\'s');
  // Second borrow must be a no-op: the guard, exercised rather than only grepped.
  const snapshot = S.teas[0].brewGuide, callsBefore = putCalls;
  ctx.borrowGuideFrom('b1');
  ok(S.teas[0].brewGuide===snapshot, 'J15 borrowing again leaves the saved guide untouched');
  ok(putCalls===callsBefore, 'J16 …and writes nothing to the persistence layer either');
  S.teas=[];
}
console.log('  J deep link + borrow: '+((parentCovered?3:0)+(topCovered?12:0)+3)+' checks');

/* ---- I. real data (owner-scoped per R69) ---- */
function parseCSV(t){const rows=[];let f='',r=[],q=false;
  for(let i=0;i<t.length;i++){const c=t[i];
    if(q){ if(c==='"'){ if(t[i+1]==='"'){f+='"';i++;} else q=false; } else f+=c; }
    else if(c==='"') q=true; else if(c===','){ r.push(f);f=''; }
    else if(c==='\n'){ r.push(f);rows.push(r);r=[];f=''; } else if(c!=='\r') f+=c; }
  if(f.length||r.length){r.push(f);rows.push(r);}
  const h=rows.shift(); return rows.filter(x=>x.length>1).map(x=>Object.fromEntries(h.map((k,i)=>[k.trim(),x[i]])));}
const teasCsv=path.join(__dirname,'teas_rows.csv'), sessCsv=path.join(__dirname,'sessions_rows.csv');
if(fs.existsSync(teasCsv) && fs.existsSync(sessCsv)){
  // R69: the export is NOT user-scoped. Derive the owner from who owns the sessions, as
  // figures-report.js does — never hardcode a UUID, never exclude a row by name.
  const owner = parseCSV(fs.readFileSync(sessCsv,'utf8'))[0].user_id;
  const real = parseCSV(fs.readFileSync(teasCsv,'utf8')).filter(r=>r.user_id===owner)
    .map(r=>({id:r.id,name:r.name,type:r.type,amountGrams:Number(r.amount_grams)||0}));
  S.teas=real; S.refSearch=''; S.refOpen=null; S.teaSeg='deeper';
  const html = ctx.refListHTML();
  const ownedRows = (html.match(/on your shelf</g)||[]).length;
  const dimRows = (html.match(/is-unowned/g)||[]).length;
  const matched = real.filter(t=>G('matchTeaType('+JSON.stringify(t.name)+')')).length;
  ok(ownedRows + dimRows === cats.length, 'I1 every category is either marked or dimmed, never neither ('+ownedRows+' + '+dimRows+' = '+cats.length+')');
  ok(ownedRows > 0 && dimRows > 0, 'I2 the real shelf produces BOTH states — a surface that is all-one is not being tested');
  ok(matched < real.length, 'I3 the catalog genuinely under-covers the shelf ('+matched+'/'+real.length+' matched) — this is the honest gap #13 renders, not a bug to hide');
  // The count of dim rows is TRACKED, not pinned: it moves when the catalog or the shelf grows, and
  // a literal here would go stale exactly the way R68 describes.
  console.log('  I real data: '+ownedRows+' marked · '+dimRows+' dimmed · '+matched+'/'+real.length+' teas matched — 3 checks');
}else{
  console.log('  I real data: SKIPPED (private CSVs absent) — 3 checks not run');
}

console.log(failures ? '\n'+failures+' REFERENCE TEST(S) FAILED' : '\nALL REFERENCE TESTS PASSED ('+passed+' passed)');
process.exit(failures?1:0);
