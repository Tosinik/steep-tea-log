/* PERMANENT validation — v3.84 shelf order: the interim sort + the float branch (committed; runs every deploy).
 *
 * Invariants (issue #23 F1 — TASK-23-interim-sort.md, decision 3 is the branch under guard):
 *  - default sort 'type': running-low actives float to the top (shelfSort is stable over the
 *    engine's type-then-name order — within the float groups that order is preserved).
 *  - ANY explicit sort: NO float — the engine's order is the user's order (a low-stock 3-star
 *    tea sits below a plenty 5-star tea under 'rating').
 *  - finished teas group at the bottom under default AND explicit sorts (split is upstream).
 *  - null tails (definitional, per v3.40 lifecycle): unrated → 0 → tail of 'rating'; an untracked
 *    tea → 0 → head of 'stock-low' among actives. "Tracked" needs EVIDENCE (amount>0, a recorded
 *    purchase quantity, or a grams-logged session) — a bare 0 g tea with none is UNKNOWN ≠ empty
 *    and stays active; tracked-and-drained ⇒ finished, never among actives at all.
 *  - grid and rows densities render the identical order (they share one input list).
 *
 * Sections A–C are synthetic (green on a fresh clone). Section D grounds every sort key in the
 * real CSV export and SKIPS with a reported count when the gitignored CSVs are absent.
 * Run: node fixtures/shelf-order-test.js   (exit non-zero on any failure)
 */
const fs=require('fs'), path=require('path'), vm=require('vm');
const repo=path.join(__dirname,'..');
const src=['steep-knowledge.js','steep-core.js','steep-teas.js'].map(f=>fs.readFileSync(path.join(repo,f),'utf8')).join('\n;\n');
const ctx={}; ctx.window=ctx; ctx.globalThis=ctx; ctx.console=console;
ctx.document={documentElement:{setAttribute(){},getAttribute(){return 'light';}},getElementById(){return null;},querySelector(){return null;},querySelectorAll(){return[];},createElement(){return{style:{},setAttribute(){},appendChild(){},classList:{add(){}}};}};
let store={}; // switchable localStorage so the density pass can flip tealog_teaDensity
ctx.localStorage={getItem:k=>(k in store?store[k]:null),setItem:(k,v)=>{store[k]=String(v);},removeItem:k=>{delete store[k];}};
ctx.matchMedia=()=>({matches:false}); ctx.navigator={onLine:true};
ctx.setTimeout=()=>{};ctx.clearTimeout=()=>{};ctx.setInterval=()=>{};ctx.clearInterval=()=>{};ctx.addEventListener=()=>{};
vm.createContext(ctx); vm.runInContext(src, ctx);
vm.runInContext('state.settings=Object.assign({},DEFAULT_SETTINGS);', ctx);
const S=vm.runInContext('state', ctx);

let passed=0, failures=0;
const ok=(c,m)=>{ if(c)passed++; else{failures++;console.log('  FAIL: '+m);} };
// Order extractor — both density builders emit class="shelf-name">NAME<, actives before the
// finished block, so DOM order IS the assertion surface.
const names=()=>{ const out=[]; const re=/class="shelf-name">([^<]*)</g; let m,h=ctx.teaShelfHTML();
  while((m=re.exec(h))) out.push(m[1]); return out; };

// Synthetic shelf: one low, two plenty, one untracked, one finished (tracked 0 g).
const TEAS=[
  {id:'A',name:'Alpine Green', type:'green',  amountGrams:100, rating:5, dateAdded:'2026-01-10'},
  {id:'B',name:'Bold Black',   type:'black',  amountGrams:5,   rating:3, dateAdded:'2026-03-01'},  // low (floor 15, no sessions)
  {id:'C',name:'Calm White',   type:'white',  amountGrams:50,            dateAdded:'2026-02-01'},  // unrated
  {id:'D',name:'Dust Oolong',  type:'oolong', amountGrams:'',  rating:4, dateAdded:'2025-12-01'},  // UNTRACKED — active, 0 for stock sorts
  {id:'E',name:'Empty Puerh',  type:'puerh',  amountGrams:0, costOriginalGrams:50, rating:4, dateAdded:'2026-02-15'},  // tracked (purchase evidence) + 0 g ⇒ finished
];
const seed=(sort)=>{ S.teas=TEAS.map(t=>Object.assign({},t)); S.sessions=[]; S.teaSort=sort;
  S.teaSearch=''; S.teaFilter={type:'',vendor:'',lowStock:false,favorite:false}; };

// ---- A. default 'type' — the float, and only here ----
seed('type');
let o=names();
ok(o[0]==='Bold Black', 'A1 default sort: the low tea floats to the top');
const engine=ctx.sortTeasByTypeThenName(S.teas.filter(t=>!ctx.isTeaFinished(t))).map(t=>t.name).filter(n=>n!=='Bold Black');
ok(JSON.stringify(o.slice(1,4))===JSON.stringify(engine), 'A2 float is stable: non-low actives keep type-then-name order');
ok(o[o.length-1]==='Empty Puerh', 'A3 finished tea renders last (bottom group)');
ok(o.length===5, 'A4 all five teas render exactly once');
console.log('  A default-sort float: 4 checks');

// ---- B. explicit sorts — engine order, no float ----
seed('rating'); o=names();
ok(o.indexOf('Bold Black')>o.indexOf('Alpine Green'), 'B1 rating: low 3-star sits BELOW plenty 5-star (no float)');
ok(JSON.stringify(o)===JSON.stringify(['Alpine Green','Dust Oolong','Bold Black','Calm White','Empty Puerh']), 'B2 rating: 5→4→3→unrated-as-0 tail, finished still last');
seed('stock-low'); o=names();
ok(JSON.stringify(o)===JSON.stringify(['Dust Oolong','Bold Black','Calm White','Alpine Green','Empty Puerh']), 'B3 stock-low: untracked-blank reads 0 → head; ascending grams; finished last');
ok(!o.slice(0,4).includes('Empty Puerh'), 'B4 definitional: a tracked 0 g tea is finished, never among actives');
ok(ctx.isTeaFinished({amountGrams:0})===false, 'B4b predicate pin: bare 0 g with no evidence = unknown ≠ empty → active');
ok(ctx.isTeaFinished({amountGrams:0,costOriginalGrams:50})===true, 'B4c predicate pin: purchase evidence + 0 g → finished');
seed('stock-high'); o=names();
ok(JSON.stringify(o.slice(0,4))===JSON.stringify(['Alpine Green','Calm White','Bold Black','Dust Oolong']), 'B5 stock-high: descending grams among actives');
seed('newest'); o=names();
ok(JSON.stringify(o.slice(0,4))===JSON.stringify(['Bold Black','Calm White','Alpine Green','Dust Oolong']), 'B6 newest: dateAdded descending, no float');
seed('name'); o=names();
ok(JSON.stringify(o.slice(0,4))===JSON.stringify(['Alpine Green','Bold Black','Calm White','Dust Oolong']), 'B7 name: A–Z, no float');
seed('oldest'); o=names();
ok(o[0]==='Dust Oolong', 'B8 oldest: dateAdded ascending head');
console.log('  B explicit sorts: 10 checks');

// ---- C. grid ≡ rows — one list, two densities ----
seed('rating'); store['tealog_teaDensity']='grid'; const grid=names();
store['tealog_teaDensity']='rows'; const rows=names();
ok(JSON.stringify(grid)===JSON.stringify(rows), 'C1 grid and rows render the identical order');
seed('type'); store['tealog_teaDensity']='rows';
ok(names()[0]==='Bold Black', 'C2 rows density: default-sort float holds');
delete store['tealog_teaDensity'];
console.log('  C density agreement: 2 checks');

// ---- D. real-data grounding (skips without the private CSVs) ----
function parseCSV(t){const R=[];let r=[],c='',q=false;for(let i=0;i<t.length;i++){const ch=t[i];
 if(q){if(ch==='"'){if(t[i+1]==='"'){c+='"';i++;}else q=false;}else c+=ch;}
 else if(ch==='"')q=true;else if(ch===','){r.push(c);c='';}
 else if(ch==='\n'){r.push(c);R.push(r);r=[];c='';}else if(ch!=='\r')c+=ch;}
 if(c||r.length){r.push(c);R.push(r);}
 const h=R[0];return R.slice(1).filter(x=>x.length===h.length)
   .map(x=>Object.fromEntries(h.map((k,i)=>[k,x[i]])));}
const teasCsv=path.join(__dirname,'teas_rows.csv');
if(fs.existsSync(teasCsv)){
  const real=parseCSV(fs.readFileSync(teasCsv,'utf8')).map(r=>({id:r.id,name:r.name,type:r.type,
    amountGrams:r.amount_grams===''?null:Number(r.amount_grams),rating:r.rating===''?null:Number(r.rating),
    dateAdded:r.date_added||r.created_at,isFavorite:r.is_favorite==='true'||r.is_favorite==='t'}));
  const KEYS=['type','newest','oldest','name','stock-high','stock-low','rating'];
  let rendered=0, monotonic=true;
  for(const k of KEYS){
    S.teas=real.map(t=>Object.assign({},t)); S.sessions=[]; S.teaSort=k; S.teaSearch='';
    S.teaFilter={type:'',vendor:'',lowStock:false,favorite:false};
    const list=ctx.filteredSortedTeas();
    if(list.length===real.length) rendered++;
    if(k==='stock-low'||k==='stock-high'){
      const g=list.filter(t=>!ctx.isTeaFinished(t)).map(t=>Number(t.amountGrams)||0);
      for(let i=1;i<g.length;i++) if(k==='stock-low'?g[i]<g[i-1]:g[i]>g[i-1]) monotonic=false;
    }
    ctx.teaShelfHTML(); // no-crash pass over the real shelf, every key
  }
  ok(rendered===KEYS.length, 'D1 every sort key returns the full real shelf ('+real.length+' teas)');
  ok(monotonic, 'D2 stock sorts are monotonic over the real actives');
  S.teas=real.map(t=>Object.assign({},t)); S.sessions=[]; S.teaSort='type'; S.teaSearch='';
  S.teaFilter={type:'',vendor:'',lowStock:false,favorite:false};
  const lowNames=S.teas.filter(t=>!ctx.isTeaFinished(t)&&ctx.isRunningLow(t)).map(t=>t.name);
  const ro=names();
  ok(lowNames.every(n=>ro.indexOf(n)<lowNames.length), 'D3 default sort still floats the real low set ('+lowNames.length+' low) to the top');
  console.log('  D real-data grounding: 3 checks');
}else{
  console.log('  D real-data grounding: SKIPPED (private CSVs absent) — 3 checks not run');
}

if(failures){ console.log(`SHELF-ORDER TESTS FAILED (${failures} failed, ${passed} passed)`); process.exit(1); }
console.log(`ALL SHELF-ORDER TESTS PASSED (${passed} passed)`);
