/* PERMANENT validation — R63 vessel identity ladder + R64/R72 method lanes (committed; every deploy).
 *
 * Why this suite exists at all: the ladder is INVISIBLE on current data. All five of Niklas's vessels
 * carry a photo, so rungs 2 and 3 never render in the app today — a browser check would prove nothing
 * and a "looks fine" would be meaningless. The fixture is the only way to see it, which is exactly why
 * R63 said build it small and fixture it.
 *
 * Ladder (R63): photo → kanji plate → type-tinted stripe. NOT an extension of shelfPhoto, which is the
 * TEA tile keyed on tea.type — 蓋碗 there would mean a tea of type gaiwan. Kanji covers only the three
 * types the boards drew; 旅 is deliberately absent because VESSEL_TYPES has no traveller entry and the
 * "Travel cuppa" is typed Porcelain teapot, so that glyph was keyed off a free-text NAME.
 *
 * Lanes (R72): the control is four lanes over three stored values plus a boolean. resolve:true is a
 * DRAFT (#04) and lights what commitSession will store; resolve:false is a RECORD (#02b) and shows
 * only stored brew_style — a lit lane over a null column would claim knowledge the app lacks (R64).
 *
 * Run: node fixtures/vessel-identity-test.js   (exit non-zero on any failure)
 */
const fs=require('fs'), path=require('path'), vm=require('vm');
const repo=path.join(__dirname,'..');
const SRC=['steep-knowledge.js','steep-tea-types.js','steep-core.js','steep-dashboard.js','steep-teas.js','steep-sessions.js']
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
// `const`/`let` at a vm script's top level stay in its lexical scope — only function declarations
// become sandbox properties. Consts (VESSEL_KANJI, VESSEL_TYPES, state) must be read through the
// context, by reference, which is how the other committed suites reach `state`.
const G = expr => vm.runInContext(expr, ctx);
const S = G('state');

let passed=0, failures=0;
const ok=(c,m)=>{ if(c){passed++;} else {failures++; console.log('  FAIL: '+m);} };

/* ---- A. the ladder, rung by rung ---- */
const photo = ctx.vesselPhoto({id:'1',name:'Dragon Gaiwan',type:'Gaiwan',image:'https://x/y.jpg'},'thumb');
ok(/background-image:url\(https:\/\/x\/y\.jpg\)/.test(photo), 'A1 photo wins when present');
ok(!/vessel-kanji/.test(photo) && !/is-ph/.test(photo), 'A2 a photographed vessel gets neither kanji nor stripe');

const gaiwan = ctx.vesselPhoto({id:'2',name:'Some Gaiwan',type:'Gaiwan'},'thumb');
ok(/蓋碗/.test(gaiwan), 'A3 photo-less Gaiwan falls to the 蓋碗 plate');
ok(/vessel-kanji/.test(gaiwan) && /v-gaiwan/.test(gaiwan), 'A4 kanji plate carries its type class for the tint');
ok(/絞/.test(ctx.vesselPhoto({type:'Shiboridashi'},'thumb')), 'A5 Shiboridashi → 絞');
ok(/冷/.test(ctx.vesselPhoto({type:'Cold brew jar'},'thumb')), 'A6 Cold brew jar → 冷');
ok(/v-cold-brew-jar/.test(ctx.vesselPhoto({type:'Cold brew jar'},'thumb')), 'A7 multi-word type slugifies to v-cold-brew-jar');

for(const t of ['Kyusu','Yixing teapot','Porcelain teapot','Glass teapot','Mug','Other']){
  const h = ctx.vesselPhoto({type:t},'thumb');
  ok(/is-ph/.test(h) && !/vessel-kanji/.test(h), 'A8 unmapped type "'+t+'" falls to the stripe, not a kanji');
}
const none = ctx.vesselPhoto({name:'No type'},'thumb');
ok(/is-ph/.test(none) && /v-unknown/.test(none), 'A9 a vessel with no type still renders the stripe (v-unknown)');

/* 旅 must never be a MAPPED GLYPH — the point of R63's second half. Scanning the raw file would only
   catch the comment that explains its absence, so assert on the map and on rendered output instead. */
const teasSrc = fs.readFileSync(path.join(repo,'steep-teas.js'),'utf8');
ok(!Object.values(G('VESSEL_KANJI')).includes('旅'), 'A10 旅 is not a mapped glyph');
ok(!G('VESSEL_TYPES').some(t=>/travel/i.test(t)), 'A10b VESSEL_TYPES still has no traveller entry');
ok(!/旅/.test(['Gaiwan','Kyusu','Shiboridashi','Matcha bowl','Yixing teapot','Porcelain teapot','Glass teapot','Mug','Cold brew jar','Other','']
     .map(t=>ctx.vesselPhoto({name:'Travel cuppa',type:t},'thumb')).join('')),
   'A10c 旅 never renders — not even for a vessel NAMED "Travel cuppa"');
ok(Object.keys(G('VESSEL_KANJI')).length===3, 'A11 VESSEL_KANJI holds exactly the three drawn types (got '+Object.keys(G('VESSEL_KANJI')).length+')');
ok(Object.keys(G('VESSEL_KANJI')).every(t=>G('VESSEL_TYPES').includes(t)),
   'A12 every kanji key is a real VESSEL_TYPES entry — no glyph keyed to a non-type');
// #31 (v4.18): Matcha bowl joins VESSEL_TYPES. VESSEL_KANJI stays 3 (A11) — a chawan has no kanji
// plate, and A12 counts kanji keys not types, which is why one entry + this line is the whole diff.
ok(G('VESSEL_TYPES').includes('Matcha bowl'), 'A13 VESSEL_TYPES includes "Matcha bowl" (#31)');
ok(!('Matcha bowl' in G('VESSEL_KANJI')), 'A13b …and it has no kanji plate — it falls to the type-tinted stripe, by design');
// The tea tile must stay untouched: its kanji are TEA types, and mixing the two was the original bug.
ok(/白/.test(teasSrc) && /餅/.test(teasSrc), 'A13 shelfPhoto still carries its own 白/餅 tea kanji');
ok(!/VESSEL_KANJI\[[^\]]*tea/.test(teasSrc), 'A14 the vessel map is never keyed by a tea');
console.log('  A vessel identity ladder: 22 checks');

/* ---- B. every kanji type has a tint in BOTH theme blocks ---- */
const css = fs.readFileSync(path.join(repo,'styles.css'),'utf8');
const dark = css.slice(css.indexOf('.vessel-kanji'));
for(const t of Object.keys(G('VESSEL_KANJI'))){
  const slug = ctx.vesselTypeSlug(t);
  ok(new RegExp('\\.vessel-kanji\\.v-'+slug+'\\{').test(css), 'B1 light tint defined for v-'+slug);
  ok(new RegExp('html\\[data-theme="dark"\\] \\.vessel-kanji\\.v-'+slug+'\\{').test(dark), 'B2 dark tint defined for v-'+slug);
}
// The stripe must keep its shipped look for unmapped types: the custom props fall back to the originals.
ok(/--vph-a,var\(--porcelain-dim\)/.test(css) && /--vph-b,var\(--white\)/.test(css),
   'B3 the stripe falls back to its shipped colours, so unmapped vessels look identical to before');
console.log('  B tints in both themes: 7 checks');

/* ---- B2. the 'tile' kind (v3.96, #05) ----
   Slice A shipped `kind` as a parameter with only 'thumb' in use, and wrote that the larger tile
   "arrives with slice B". A second kind is where a ladder silently loses a rung: if .vessel-tile
   existed but .vessel-tile.is-ph did not, rung 3 would render as a bare box at the new size and
   nobody would see it, because every real vessel has a photo. Assert all three rungs at BOTH kinds. */
for(const kind of ['thumb','tile']){
  const p = ctx.vesselPhoto({type:'Gaiwan',image:'https://x/y.jpg'},kind);
  const k = ctx.vesselPhoto({type:'Gaiwan'},kind);
  const s = ctx.vesselPhoto({type:'Kyusu'},kind);
  ok(new RegExp('vessel-'+kind).test(p) && new RegExp('vessel-'+kind).test(k) && new RegExp('vessel-'+kind).test(s),
     'B4 all three rungs carry the vessel-'+kind+' class');
  ok(/蓋碗/.test(k) && /vessel-kanji/.test(k), 'B5 rung 2 (kanji) renders at kind='+kind);
  ok(/is-ph/.test(s) && /v-kyusu/.test(s), 'B6 rung 3 (stripe) renders at kind='+kind);
  ok(new RegExp('\\.vessel-'+kind+'\\{').test(css), 'B7 .vessel-'+kind+' is styled');
  ok(new RegExp('\\.vessel-'+kind+'\\.is-ph\\{').test(css), 'B8 .vessel-'+kind+'.is-ph is styled — the stripe is not a bare box at this size');
  ok(new RegExp('\\.vessel-'+kind+'\\.vessel-kanji span\\{').test(css), 'B9 the kanji is sized for .vessel-'+kind);
  /* B9b — CASCADE ORDER, not just presence. `.vessel-<kind>` and `.vessel-kanji` are both (0,1,0),
     so the later declaration wins: a base rule written BELOW .vessel-kanji silently replaces the
     kanji plate's per-type tint with the plain jade base. That is exactly what happened on the
     first tile build, and it was invisible to "the rule exists" — caught in the browser by reading
     computed background, then pinned here as source order. */
  ok(css.indexOf('.vessel-'+kind+'{') < css.indexOf('.vessel-kanji{'),
     'B9b .vessel-'+kind+'’s base rule is declared ABOVE .vessel-kanji, so the tint still wins');
}
console.log("  B2 both kinds carry all three rungs: 12 checks");

/* ---- B3. #05's list renders through the ladder, not around it ---- */
const sessSrc = fs.readFileSync(path.join(repo,'steep-sessions.js'),'utf8');
ok(/vesselPhoto\(v,'tile'\)/.test(sessSrc), 'B10 the vessel list uses vesselPhoto — no second image path');
ok(!/v\.image\s*\?/.test(sessSrc), 'B11 no inline v.image branch survives outside vesselPhoto (the pre-R63 two-step thumb)');
// Delete moved off the row and into the form; armConfirm stays the primitive (never a native confirm).
ok(/armConfirm\(this,'Delete this vessel\?'/.test(sessSrc), 'B12 vessel delete still goes through armConfirm');
ok(!/confirm\(|alert\(/.test(sessSrc.replace(/armConfirm\(/g,'')), 'B13 no browser confirm()/alert() reached the vessel surface');
console.log('  B3 #05 list wiring: 4 checks');

/* ---- C. method lanes: four drawn, three stored + a boolean ---- */
const draft = {brewStyle:null, isColdBrew:false, capacityMl:110, resolve:true, onMethod:'d_pickMethodLane', onCold:'d_pickColdLane()'};
const lanesDraft = ctx.methodLanesHTML(draft);
ok((lanesDraft.match(/<button/g)||[]).length===4, 'C1 four lanes drawn');
['Gongfu','Senchadō','Western','Cold brew'].forEach((l,i)=>
  ok(lanesDraft.indexOf(l) > (i?lanesDraft.indexOf(['Gongfu','Senchadō','Western','Cold brew'][i-1]):-1),
     'C2 lane order: '+l+' follows its predecessor'));

// Parse the buttons instead of measuring regex distance — a proximity match silently depends on the
// handler name's length, which is how C6 first failed against correct code.
const activeLanes = html => [...html.matchAll(/<button[^>]*class="([^"]*)"[^>]*>([^<]*)<\/button>/g)]
  .filter(m => /\bactive\b/.test(m[1])).map(m => m[2]);

// R72 draft side: a null brewStyle still lights the lane commitSession will store.
ok(JSON.stringify(activeLanes(lanesDraft))===JSON.stringify(['Gongfu']),
   'C3 draft, null brewStyle, 110ml → lights Gongfu alone (resolve:true — the show IS the store); got '+JSON.stringify(activeLanes(lanesDraft)));
const draftKyusu = ctx.methodLanesHTML(Object.assign({},draft,{capacityMl:210}));
ok(JSON.stringify(activeLanes(draftKyusu))===JSON.stringify(['Western']), 'C4 draft at 210ml resolves to Western alone');

// R64 record side: null brewStyle lights NOTHING.
const rec = {brewStyle:null, isColdBrew:false, capacityMl:110, resolve:false, onMethod:'es_pickMethodLane', onCold:'es_pickColdLane()'};
const lanesRec = ctx.methodLanesHTML(rec);
ok(activeLanes(lanesRec).length===0, 'C5 RECORD with null brew_style lights NO lane (R64); got '+JSON.stringify(activeLanes(lanesRec)));
ok(JSON.stringify(activeLanes(ctx.methodLanesHTML(Object.assign({},rec,{brewStyle:'senchado'}))))===JSON.stringify(['Senchadō']),
   'C6 record with a stored value lights exactly that lane');
ok(!activeLanes(lanesRec).includes('Gongfu'), 'C7 the 110ml capacity heuristic never leaks into the record side');

// Cold brew is a peer lane and mutually exclusive on BOTH sides.
const cold = ctx.methodLanesHTML(Object.assign({},rec,{isColdBrew:true, brewStyle:'gongfu'}));
ok(JSON.stringify(activeLanes(cold))===JSON.stringify(['Cold brew']),
   'C8 cold brew is the only lit lane, even with a stale stored brewStyle; got '+JSON.stringify(activeLanes(cold)));
ok(/d_pickColdLane\(\)/.test(lanesDraft) && /es_pickColdLane\(\)/.test(lanesRec),
   'C9 each surface wires its own cold-lane picker');
// C8 pinned the ENTRY direction on the record side only. It must hold on the draft side too, where
// resolve:true would otherwise be free to resolve a stale brewStyle into a second lit lane.
const coldDraft = ctx.methodLanesHTML(Object.assign({},draft,{isColdBrew:true, brewStyle:'gongfu'}));
ok(JSON.stringify(activeLanes(coldDraft))===JSON.stringify(['Cold brew']),
   'C10 DRAFT side: cold brew still wins alone over a stale brewStyle — isColdBrew is read before resolve; got '+JSON.stringify(activeLanes(coldDraft)));
console.log('  C method lanes: 14 checks');

/* ---- D. no second writer, and the old controls are gone ---- */
const sesSrc = fs.readFileSync(path.join(repo,'steep-sessions.js'),'utf8');
ok(!/ratioSetupHTML/.test(sesSrc), 'D1 dead ratioSetupHTML is gone (its 2-button segment would light neither lane for senchadō)');
ok(!/onchange="d_setColdBrew\(this\.checked\)"/.test(sesSrc), 'D2 the setup cold-brew checkbox is replaced by the lane');
ok(!/es_set\('isColdBrew', this\.checked\)/.test(sesSrc), 'D3 the edit cold-brew checkbox is replaced by the lane');
ok((sesSrc.match(/function methodLanesHTML\(/g)||[]).length===1, 'D4 exactly one lane writer');
// The pickers must COMPOSE the existing setters, never assign state themselves.
const pickers = sesSrc.slice(sesSrc.indexOf('function d_pickMethodLane'), sesSrc.indexOf('function d_setTea'));
ok(!/\b(d|e)\.(isColdBrew|brewStyle)\s*=/.test(pickers),
   'D5 lane pickers assign no state directly — they delegate to the existing setters');
ok(/function esMethodReadLabel\(/.test(sesSrc), 'D6 esMethodReadLabel survives as the separate read-only derived label');
// JC1: saveSessionEdit must still pass brewStyle through untouched, so opening a null session writes nothing.
const save = sesSrc.slice(sesSrc.indexOf('function saveSessionEdit'));
ok(!/brewStyle\s*[:=]\s*brewMethodFor/.test(save.slice(0, save.indexOf('\nfunction '))),
   'D7 saveSessionEdit never resolves brewStyle — JC1 intact, a null session saves as null');
console.log('  D single writer + removals: 7 checks');

/* ---- E. currency: one writer, no stray symbols ---- */
ok(ctx.currencyFmt(1.5)==='€1.50', 'E1 currencyFmt defaults to € with 2 digits (got '+ctx.currencyFmt(1.5)+')');
ok(ctx.currencyFmt(12,0)==='€12', 'E2 digits override works (got '+ctx.currencyFmt(12,0)+')');
S.settings.currency='$';
ok(ctx.currencyFmt(1.5)==='$1.50', 'E3 the pref is read, not baked (got '+ctx.currencyFmt(1.5)+')');
ok(ctx.aUnit({unit:'cur'})===' $', 'E4 achievement unit resolves through the pref too (got "'+ctx.aUnit({unit:'cur'})+'")');
S.settings.currency='€';
// Strip line comments before scanning: the only remaining '$' in either file is the comment that
// explains why it was removed, and a raw grep would flag that forever.
// split on /\r?\n/, not '\n': core.autocrlf leaves \r in the Windows working copy, and JS `.` won't
// cross a \r, so a naive split leaves every comment line unstripped and the scan silently no-ops.
const decomment = s => s.split(/\r?\n/).map(l=>l.replace(/^\s*\/\/.*$/,'')).join('\n');
const dashSrc = fs.readFileSync(path.join(repo,'steep-dashboard.js'),'utf8');
ok(!/'\$'/.test(decomment(teasSrc)) && !/'\$'/.test(decomment(dashSrc)),
   'E5 no hardcoded \'$\' remains in live code in either file');
ok(ctx.currencyFmt(null)==='€0.00', 'E6 a null cost formats rather than printing NaN');
console.log('  E currency single writer: 6 checks');

/* ---- F. R104: the SITE-level half of E ----
 *
 * E guards that `currencyFmt` BEHAVES. It cannot see a render site that never calls it — and six
 * such sites (seven render positions) shipped in the spend view through four slices, printing
 * amounts with no symbol at all, while E stayed green the whole time. A behavioural guard on a
 * helper must be paired with a scan for the sites that should be using it.
 *
 * Design note, because the naive version is the tempting one: "`.toFixed(` near a cost-shaped word"
 * gave SIX false positives and ZERO true ones on this tree — `perGramN` (a COUNT) matched `perGram`
 * by substring, an opacity ternary matched `m.total`, a form `value=` matched `costTotal`. A scan
 * like that gets disabled by the first person who trips over it. So the money-producing FIELDS are
 * enumerated instead, and a site is flagged only when the field is actually EMITTED — the whole
 * `${...}`, or `.toFixed`-formatted for output. Conditions, arguments and longer identifiers are
 * not renders. Form `value=` is skipped deliberately: an input must hold the RAW number, because
 * "€15" would not survive a save.
 *
 * ITS LIMITATION, STATED RATHER THAN DISCOVERED (R104's own shape, one level up): this catches a
 * KNOWN money field rendered without currencyFmt. It CANNOT catch a NEW money field nobody added to
 * MONEY_FIELDS below. The allowlist failing closed is the mitigation — adding a money field means
 * editing this list on purpose — but it is a mitigation, not a proof. Do not read a green F as
 * "every amount in the app carries a symbol"; read it as "every amount we have named does".
 */
const MONEY_FIELDS = ['costTotal','totalSpent','avgCostPerGram','costPerSession','thisMonth',
                      'avgPerActiveMonth','totalDated','undated','perGram','perSession','m.total'];
function moneySiteScan(src, file){
  const hits = [];
  src.split(/\r?\n/).forEach((line, i) => {
    [...line.matchAll(/\$\{([^}]*)\}/g)].forEach(mm => {
      const e = mm[1];
      if(/value\s*=\s*["']?$/.test(line.slice(0, mm.index))) return;   // form round-trip stays raw
      for(const f of MONEY_FIELDS){
        const re = new RegExp('(?:^|[^A-Za-z0-9_.$])((?:[A-Za-z_$][A-Za-z0-9_$]*\\.)*' + f.replace(/\./g,'\\.') + ')(?![A-Za-z0-9_$])','g');
        let m;
        while((m = re.exec(e))){
          const after = e.slice(m.index + m[0].length);
          if(!(e.trim()===m[1] || /^\s*\.toFixed\s*\(/.test(after))) continue;
          if(/currencyFmt\s*\(/.test(e)) continue;
          hits.push(`${file}:${i+1} [${f}] ${e.trim().slice(0,70)}`);
        }
      }
    });
  });
  return hits;
}
const RENDER_FILES = fs.readdirSync(repo).filter(f=>/^steep-.*\.js$/.test(f));
const moneyHits = RENDER_FILES.flatMap(f => moneySiteScan(fs.readFileSync(path.join(repo,f),'utf8'), f));
ok(moneyHits.length===0, 'F1 every named money field renders through currencyFmt — offending sites:\n      '+moneyHits.join('\n      '));
// The scan must be able to FAIL, or it is the instrument R105 warns about. Proven against a
// synthetic render of a real money field rather than trusted.
ok(moneySiteScan('`<div>${ms.thisMonth.toFixed(2)}</div>`','synthetic').length===1,
   'F2 the scan detects a bare money render — a scan that cannot fail guards nothing');
ok(moneySiteScan('`<div>${currencyFmt(ms.thisMonth)}</div>`','synthetic').length===0,
   'F3 …and passes the same field once it goes through the writer');
ok(moneySiteScan('`<span>${m.perGramN} of ${teaN}</span>`','synthetic').length===0,
   'F4 a COUNT whose name contains a money field is not a money render (the naive scan\'s false positive)');
ok(moneySiteScan('<input value="${t.costTotal}">','synthetic').length===0,
   'F5 a form value stays raw — "€15" would not survive a save');
console.log('  F R104 money-site scan: 5 checks over '+RENDER_FILES.length+' files');

/* ---- G. the cold-brew ENTRY path, as a state sequence ----
   C8/C10 pin what RENDERS. This pins what the lane taps DO, because the render is only half the
   question: entering cold brew leaves a stale brewStyle and a still-locked brewStyleLocked behind it.
   Both are inert, and that is a tested claim here rather than an argument: the ONLY exit from
   cold-brew mode is tapping a method lane, and that tap sets brewStyle explicitly, so a prefill the
   lock suppressed can never become visible. Storage is unaffected either way — commitSession writes
   brewStyle null whenever isColdBrew (steep-sessions.js:1285). */
S.vessels=[{id:'g',name:'Gaiwan',type:'Gaiwan',capacityMl:110},{id:'k',name:'Kyusu',type:'Kyusu',capacityMl:210}];
const savedRender = ctx.render; ctx.render = ()=>{};
const lit = () => activeLanes(ctx.methodLanesHTML({ brewStyle:S.sessionDraft.brewStyle,
  isColdBrew:S.sessionDraft.isColdBrew, capacityMl:(ctx.vesselById(S.sessionDraft.vesselId)||{}).capacityMl,
  resolve:true, onMethod:'d_pickMethodLane', onCold:'d_pickColdLane()' }));

S.sessionDraft={teaId:'t',vesselId:'g',isColdBrew:false,brewStyle:null,steeps:[]};
ctx.d_setBrewStyle('gongfu');
ok(S.sessionDraft.brewStyleLocked===true, 'G1 an explicit method tap locks the vessel prefill (v3.91)');
ctx.d_pickColdLane();
ok(S.sessionDraft.isColdBrew===true && S.sessionDraft.brewStyle==='gongfu',
   'G2 entering cold brew sets the boolean and leaves brewStyle untouched (storage nulls it at commit)');
ok(JSON.stringify(lit())===JSON.stringify(['Cold brew']), 'G3 exactly one lane lights on entry, and it is the cold one');
ok(S.sessionDraft.brewStyleLocked===true,
   'G4 the lock SURVIVES the cold-brew tap — deliberately: clearing it would let a later vessel change silently overwrite an explicit choice, which is a new surprise traded for one that cannot occur');
ctx.d_setVessel('k');
ok(S.sessionDraft.brewStyle==='gongfu', 'G5 a vessel change while cold does not re-prefill (lock holds) — invisible, because…');
ctx.d_pickMethodLane('senchado');
ok(S.sessionDraft.isColdBrew===false && S.sessionDraft.brewStyle==='senchado',
   'G6 …the ONLY cold exit is a lane tap, which sets brewStyle explicitly — so the suppressed prefill never surfaces');
ok(JSON.stringify(lit())===JSON.stringify(['Senchadō']), 'G7 after the exit exactly the tapped lane lights');
// And with no prior explicit tap the prefill is free to run, unchanged from v3.91.
S.sessionDraft={teaId:'t',vesselId:'g',isColdBrew:false,brewStyle:null,steeps:[]};
ctx.d_pickColdLane(); ctx.d_setVessel('k');
ok(S.sessionDraft.brewStyle==='senchado' && !S.sessionDraft.brewStyleLocked,
   'G8 with no explicit tap, the vessel prefill still runs while cold — v3.91 behaviour unchanged');
ctx.render = savedRender;
console.log('  G cold-brew entry path: 8 checks');

if(failures){ console.log(`VESSEL-IDENTITY TESTS FAILED (${failures} failed, ${passed} passed)`); process.exit(1); }
console.log(`ALL VESSEL-IDENTITY TESTS PASSED (${passed} passed)`);
