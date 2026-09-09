/* PERMANENT, data-free invariant — inferLeafForm puerh FORM classification (steep-core.js).
 *
 * Guards the v4.51 correctness fix: a tea's leaf FORM is loose-vs-compressed, NOT ripe-vs-raw.
 * `shou` and `ripe` are PROCESSING words, not FORM words. Lumping them with `loose` made a ripe
 * CAKE (a name with no cake-word that kbResolve also missed) infer `open` when a cake is
 * `compressed` — and the brew logic that keys on form then advised it wrong.
 *
 * Synthetic tea names only (no CSV), so this is a pure inference guard that runs on any clone.
 *
 * MECHANISM — inferLeafForm resolves in THREE ordered steps, and only the third is what v4.51 changed:
 *   1. kbResolve(name+cultivar+origin) first. The KB maps any name matching a puerh alias
 *      (`shou`/`shu puerh`/`ripe puerh`/`sheng`/`raw puerh`/`gushu`/`pu erh`/`pu-erh`/`pu'er`/`puerh`/
 *      `heicha`/...) to leafForm `compressed` — the common-cake default. Such a name returns here and
 *      NEVER reaches step 3. This is why "Loose Shou" is `compressed` (KB, step 1), not `open`: it is
 *      not this branch's call, and changing it would mean re-tuning the KB default (out of scope).
 *   2. name-keyword checks, incl. `has('cake','bing','tuo','brick','compressed','pressed')` -> `compressed`.
 *      An explicit compressed FORM word wins before the type switch. ("Sheng Cake" also hits step 1.)
 *   3. the `switch(type)` case 'puerh' (steep-core.js line ~559) — reached ONLY when steps 1+2 both miss.
 *      THIS is where the bug lived: it read `has('loose','shou','ripe','maocha') ? 'open' : 'compressed'`,
 *      so a ripe name kbResolve missed (e.g. "Menghai Ripe 2019": no `ripe puerh` alias, no cake word)
 *      matched `ripe` and returned `open`. The fix drops the processing words: `has('loose','maocha','散')`.
 * So: A exercises step 3's fixed path (ripe -> compressed); B exercises step 3's kept loose signals;
 * C exercises steps 1/2 (cake/tuo -> compressed); D pins step 1's pre-emption; E confirms non-puerh
 * types never enter the switch's puerh case at all.
 *
 * Run: node fixtures/leaf-form-test.js   (exit non-zero on any failure).
 */
const fs=require('fs'),path=require('path'),vm=require('vm');
const repo=path.join(__dirname,'..');
const SRC=['steep-knowledge.js','steep-core.js'].map(f=>fs.readFileSync(path.join(repo,f),'utf8')).join('\n;\n');
const ctx={};ctx.window=ctx;ctx.globalThis=ctx;ctx.console=console;
ctx.document={documentElement:{setAttribute(){},getAttribute(){return'light'}},
  getElementById:()=>null,querySelectorAll:()=>[],querySelector:()=>null,addEventListener(){},
  createElement:()=>({style:{},setAttribute(){},appendChild(){},classList:{add(){},remove(){},toggle(){}}})};
ctx.localStorage={getItem:()=>null,setItem(){},removeItem(){}};
ctx.matchMedia=()=>({matches:false});ctx.navigator={onLine:true};
ctx.setTimeout=()=>{};ctx.clearTimeout=()=>{};ctx.setInterval=()=>{};ctx.clearInterval=()=>{};
ctx.addEventListener=()=>{};ctx.SteepDB={newId:()=>'x',getUser:()=>({id:'u'})};
vm.createContext(ctx);vm.runInContext(SRC,ctx);
let passed=0,failures=0;
const ok=(c,m)=>{ if(c){passed++;} else {failures++; console.log('  FAIL: '+m);} };
const form=(tea)=>vm.runInContext('inferLeafForm('+JSON.stringify(tea)+')',ctx);
const expect=(tea,want)=>ok(form(tea)===want, JSON.stringify(tea)+' -> '+want+' (got '+form(tea)+')');

console.log('LEAF-FORM INFERENCE — puerh FORM is loose vs compressed, not ripe vs raw (v4.51)');

/* A · THE BUG: a ripe (shou) tea that kbResolve misses must NOT read `open` — a ripe cake is compressed. */
expect({name:'Menghai Ripe 2019', type:'puerh'}, 'compressed');   // was `open` (the branch's dropped `ripe`)
expect({name:'Ripe Puer', type:'puerh'},         'compressed');   // `ripe` without the KB `ripe puerh` alias
expect({name:'2019 Ripe', type:'puerh'},         'compressed');
console.log('  A ripe cakes -> compressed (the fix): 3 checks');

/* B · genuine loose SIGNALS still read `open` (form, not processing). */
expect({name:'Loose Leaf Puer', type:'puerh'}, 'open');
expect({name:'maocha', type:'puerh'},          'open');
expect({name:'2015 散 puer', type:'puerh'}, 'open');          // Chinese 散 (loose) is a form signal too
console.log('  B loose signals -> open: 3 checks');

/* C · any explicit compressed form is compressed. */
expect({name:'Sheng Cake 2018', type:'puerh'}, 'compressed');
expect({name:'Shou Cake', type:'puerh'},       'compressed');
expect({name:'Xiaguan Tuo', type:'puerh'},     'compressed');     // tuocha
console.log('  C cakes/tuo -> compressed: 3 checks');

/* D · kbResolve pre-empts a `shou`/`sheng` name to compressed BEFORE this branch (a KB default, not
   this branch's doing). Pinned so the two-layer behaviour is documented, not a surprise. */
ok(form({name:'Loose Shou', type:'puerh'})==='compressed',
   'D1 a `shou` name is compressed via kbResolve, never reaching the loose/compressed branch');
console.log('  D kbResolve pre-emption (documented): 1 check');

/* E · the fix is puerh-scoped: a non-puerh with `ripe`/`shou` in the name never consults this branch. */
expect({name:'Ripe Assam', type:'black'}, 'open');
expect({name:'Longjing', type:'green'},   'green_cn');
console.log('  E non-puerh unchanged: 2 checks');

console.log('');
if(failures){ console.log('FAILED: '+failures+' of '+(passed+failures)); process.exit(1); }
console.log('ALL LEAF-FORM TESTS PASSED ('+passed+' passed)');
