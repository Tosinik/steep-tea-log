/* PERMANENT validation — the D3 hierarchical tagger (slice b, v4.41) that replaced flavorCaptureHTML's
 * flat grid. Guards the cross-module contract the tagger rides: FLAVOR_TREE structure → the family cloud,
 * flavorResolve → the two shortcut rows (this-tea profile ∩ family, earned vocab ∩ family = Bug B), the
 * honest floor (empty rows omitted, a word the tree can't place is never force-fit), the taste-&-structure
 * strip (vocab but non-resolving), and SESSION-LEVEL writes (D2 — the tagger never touches curSteepTags).
 *
 * Synthetic + resolver-grounded (no CSV dependency; the resolver R31 is the source of truth for membership).
 * Run: node fixtures/flavor-tagger-test.js   (exit non-zero on any failure)
 */
const fs=require('fs'), path=require('path'), vm=require('vm');
const repo=path.join(__dirname,'..');
const SRC=['steep-knowledge.js','steep-tea-types.js','steep-core.js','steep-dashboard.js','steep-teas.js','steep-reference.js','steep-sessions.js']
  .map(f=>fs.readFileSync(path.join(repo,f),'utf8')).join('\n;\n');
const ctx={};ctx.window=ctx;ctx.globalThis=ctx;ctx.console=console;
ctx.document={documentElement:{setAttribute(){},getAttribute(){return'light'}},
  getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[],
  createElement:()=>({style:{},setAttribute(){},appendChild(){},insertBefore(){},classList:{add(){}}})};
ctx.localStorage={getItem:()=>null,setItem(){},removeItem(){}};
ctx.matchMedia=()=>({matches:false});ctx.navigator={onLine:true};
ctx.setTimeout=()=>{};ctx.clearTimeout=()=>{};ctx.setInterval=()=>{};ctx.clearInterval=()=>{};
ctx.addEventListener=()=>{};
vm.createContext(ctx);vm.runInContext(SRC,ctx);
vm.runInContext('state.settings=Object.assign({},DEFAULT_SETTINGS);',ctx);
ctx.render=()=>{}; ctx.showToast=()=>{};
const S = vm.runInContext('state', ctx);
const g = expr => vm.runInContext(expr, ctx); // const arrays (FLAVOR_TREE, FLAV_STRIP) don't attach to ctx
const TREE = g('FLAVOR_TREE'), STRIP = g('FLAV_STRIP');

let passed=0, failures=0;
const ok=(c,m)=>{ if(c){passed++;} else {failures++; console.log('  FAIL: '+m);} };

// A tea with a real noted profile + an earned tagLibrary, all resolver-grounded (D2: session-level tags).
const seed = ()=>{
  S.teas=[{id:'t1',name:'Test Oolong',type:'oolong',amountGrams:20}];
  S.sessions=[
    {id:'s1',teaId:'t1',date:'2026-08-01T09:00',tags:['honey','jasmine'],steeps:[]},
    {id:'s2',teaId:'t1',date:'2026-08-02T09:00',tags:['honey'],steeps:[]}
  ];
  S.tagLibrary=['cocoa','vanilla','custardapple']; // cocoa/vanilla → Confectionery · custardapple → bare
  S.sessionDraft={ teaId:'t1', sessionTags:[], curSteepTags:[], flavFam:null, flavorFreeOpen:false, steeps:[] };
};
seed();

/* ---- A. the 12-family structure is DERIVED from FLAVOR_TREE, not hand-listed ---- */
const fams = ctx.flavorFamilies();
ok(fams.length===12, 'A1 exactly 12 families (got '+fams.length+')');
ok(new Set(fams).size===12, 'A2 no family listed twice');
const withSubs = fams.filter(f=>TREE.some(n=>n.f===f && n.s));
const noSubs   = fams.filter(f=>!TREE.some(n=>n.f===f && n.s));
ok(withSubs.length===4, 'A3 four families carry sub-families (got '+withSubs.length+': '+withSubs.join(',')+')');
ok(noSubs.length===8,   'A4 eight families have no sub-families (got '+noSubs.length+')');
ok(['Vegetal','Floral','Fruity','Woody'].every(f=>withSubs.includes(f)), 'A5 the sub-family families are Vegetal/Floral/Fruity/Woody');
console.log('  A family structure from FLAVOR_TREE: 5 checks');

/* ---- B. the tagger renders session-level, never per-steep ---- */
const html = ctx.flavorCaptureHTML(S.sessionDraft);
ok(/What are you tasting\?/.test(html), 'B1 the prompt renders');
ok(/toggleSessionFlavor\(/.test(html) && !/toggleFlavor\(/.test(html), 'B2 chips write SESSION-level (toggleSessionFlavor), not per-steep (toggleFlavor)');
ok(/class="flav-fams"/.test(html) && (html.match(/flav-fam-chip/g)||[]).length>=12, 'B3 the 12-family cloud renders');
ok(/data-target="session"/.test(html) || !/tagInputField/.test(html), 'B4 the free-word door targets session (or is closed)');
// strip: sweet · umami · crisp
ok(STRIP.join(',')==='sweet,umami,crisp', 'B5 the taste-&-structure strip is exactly sweet · umami · crisp');
console.log('  B session-level tagger render: 5 checks');

/* ---- C. expand a family → the two shortcut rows + notes; honest floor when empty ---- */
S.sessionDraft.flavFam='Confectionery';
const conf = ctx.flavFamilyPanelHTML(S.sessionDraft);
ok(/You've noted in this tea/.test(conf) && /honey/.test(conf), "C1 row 1 = this tea's noted profile ∩ family (honey → Confectionery)");
ok(/Words you've used/.test(conf) && /cocoa/.test(conf) && /vanilla/.test(conf), 'C2 row 2 = earned vocab ∩ family (Bug B — cocoa/vanilla, no retype)');
ok(!/custardapple/.test(conf), 'C3 a bare earned word never appears in a family panel (never force-fit)');
S.sessionDraft.flavFam='Marine';
const marine = ctx.flavFamilyPanelHTML(S.sessionDraft);
ok(!/You've noted in this tea/.test(marine) && !/Words you've used/.test(marine), 'C4 honest floor: empty shortcut rows are omitted, not rendered blank');
ok(/algae|kelp|iodine|marine/.test(marine) && !/flav-eyebrow/.test(marine.replace(/flav-chips/g,'')), 'C5 a childless family shows its notes straight up (no sub-family scaffold)');
S.sessionDraft.flavFam='Fruity';
const fruity = ctx.flavFamilyPanelHTML(S.sessionDraft);
ok(/Fresh fruits/.test(fruity) && /Citrus/.test(fruity), 'C6 a family WITH sub-families shows its sub-family group rows');
console.log('  C expand: shortcut rows + honest floor: 6 checks');

/* ---- D. the strip is vocab-but-structural; creamy lives in Milky, not the strip ---- */
ok(['sweet','umami','crisp'].every(t=>ctx.isFlavorVocab(t)), 'D1 strip words are flavour vocabulary');
ok(['sweet','umami','crisp'].every(t=>ctx.flavorResolve(t)===null), 'D2 …but resolve into NO tree family (structural, above the twelve)');
ok(!STRIP.includes('creamy') && ctx.flavorResolve('creamy') && ctx.flavorResolve('creamy').family==='Milky', 'D3 creamy is NOT in the strip — it has a tree home in Milky');
console.log('  D strip is structural: 3 checks');

/* ---- E. selection writes sessionTags (session-level) and toggles; storage as written ---- */
seed();
ctx.toggleSessionFlavor('honey');
ok(S.sessionDraft.sessionTags.includes('honey') && S.sessionDraft.curSteepTags.length===0, 'E1 tapping a note adds to sessionTags and NEVER curSteepTags (D2)');
ctx.toggleSessionFlavor('honey');
ok(!S.sessionDraft.sessionTags.includes('honey'), 'E2 tapping again removes it (toggle)');
// a German word resolves to its node and is NOT rewritten to the English canonical
ok(ctx.flavorResolve('Aprikose') && ctx.flavorResolve('Aprikose').family==='Fruity' && ctx.flavorResolve('Aprikose').subFamily==='Fresh fruits', 'E3 "Aprikose" resolves to Fruity · Fresh fruits (case/diacritic-tolerant)');
ok(ctx.flavorResolve('custardapple')===null, 'E4 a word the tree cannot place stays bare (the honest floor)');
ok(ctx.flavorLabel('Aprikose').toLowerCase()!=='apricot', 'E5 a resolved German word is never displayed as its English canonical (never rewritten)');
console.log('  E session-level writes + storage-as-written: 5 checks');

/* ---- F. escaping — the tagger renders user words, which can be hostile ---- */
seed();
S.sessionDraft.sessionTags=["<img src=x>","o'brien"];
const esc = ctx.flavorCaptureHTML(S.sessionDraft);
ok(!/<img src=x>/.test(esc) && /&lt;img/.test(esc), 'F1 a selected free word is HTML-escaped in the chosen row');
ok(/o\\'brien|o&#39;brien|o&#x27;brien/.test(esc) || !/removeSessionTag\('o'brien'\)/.test(esc), 'F2 an apostrophe word is JS-arg-escaped in its remove handler');
console.log('  F escaping: 2 checks');

/* ---- G. honey resolves to Confectionery per the tree (do not move it) ---- */
ok(ctx.flavorResolve('honey').family==='Confectionery', 'G1 honey → Confectionery (per the ratified tree)');
console.log('  G resolver anchor: 1 check');

console.log(failures ? '\n'+failures+' FLAVOR-TAGGER TEST(S) FAILED' : '\nALL FLAVOR-TAGGER TESTS PASSED ('+passed+' passed)');
process.exit(failures?1:0);
