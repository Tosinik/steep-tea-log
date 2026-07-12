/* v3.80 #19 — Library search predicate. Loads steep-knowledge + steep-core + steep-teas and
 * exercises the REAL teaSearchNorm / teaMatchesSearch / filteredSortedTeas. Covers case, umlaut/ß
 * folding (German is first-class), multi-field match, and chip+search composition (AND). A no-crash
 * pass over fixtures/teas_rows.csv runs when present, and is SKIPPED with a reported count when the
 * (gitignored) CSV is absent — fresh clones stay green. Committed via a .gitignore exception.
 */
const fs=require('fs'),path=require('path'),vm=require('vm');
const REPO=path.resolve(__dirname,'..');
const SRC=['steep-knowledge.js','steep-core.js','steep-teas.js']
  .map(f=>fs.readFileSync(path.join(REPO,f),'utf8')).join('\n;\n');
const ctx={};ctx.window=ctx;ctx.globalThis=ctx;ctx.console=console;
ctx.document={documentElement:{setAttribute(){},getAttribute(){return'light'}},
  getElementById:()=>null,querySelectorAll:()=>[],
  createElement:()=>({style:{},setAttribute(){},appendChild(){},classList:{add(){}}})};
ctx.localStorage={getItem:()=>null,setItem(){},removeItem(){}};
ctx.matchMedia=()=>({matches:false});ctx.navigator={onLine:true};
ctx.setTimeout=()=>{};ctx.clearTimeout=()=>{};ctx.setInterval=()=>{};ctx.clearInterval=()=>{};
ctx.addEventListener=()=>{};

function parseCSV(t){const R=[];let r=[],c='',q=false;for(let i=0;i<t.length;i++){const ch=t[i];
 if(q){if(ch==='"'){if(t[i+1]==='"'){c+='"';i++;}else q=false;}else c+=ch;}
 else if(ch==='"')q=true;else if(ch===','){r.push(c);c='';}
 else if(ch==='\n'){r.push(c);R.push(r);r=[];c='';}else if(ch!=='\r')c+=ch;}
 if(c||r.length){r.push(c);R.push(r);}
 const h=R[0];return R.slice(1).filter(x=>x.length===h.length)
   .map(x=>Object.fromEntries(h.map((k,i)=>[k,x[i]])));}

// Real-data no-crash pass — injected as a global so the vm can normalize it. Skipped when absent.
const csvPath=path.join(__dirname,'teas_rows.csv');
if(fs.existsSync(csvPath)){
  ctx.__CSV_TEAS=parseCSV(fs.readFileSync(csvPath,'utf8'))
    .map(r=>({name:r.name,origin:r.origin,cultivar:r.cultivar,source:r.source}));
} else { ctx.__CSV_TEAS=null; }

vm.createContext(ctx);
vm.runInContext(SRC,ctx);

const testCode=`
  let failures=0,passes=0;
  const check=(n,c)=>{ if(c)passes++; else{failures++;console.log('  FAIL: '+n);} };

  // Synthetic rows (negative controls + German edge cases) — real data can't guarantee an ß in a name.
  const g1={id:'g1', name:'Grüner Tee', type:'green',  origin:'Japan', cultivar:'Yabukita', source:'Keiko',       amountGrams:20};
  const s1={id:'s1', name:'Straße Sencha', type:'green', origin:'',    cultivar:'',         source:'',            amountGrams:20};
  const o1={id:'o1', name:'Da Hong Pao', type:'oolong', origin:'Wuyi', cultivar:'Rougui',   source:'Verdant',     amountGrams:20};
  const b1={id:'b1', name:'Keemun',      type:'black',  origin:'Anhui',cultivar:'',         source:'Grüner-Shop', amountGrams:20};

  // --- teaSearchNorm: lowercase + ß→ss + diacritic fold ---
  check('norm folds Grüner→gruner', teaSearchNorm('Grüner')==='gruner');
  check('norm folds Straße→strasse', teaSearchNorm('Straße')==='strasse');
  check('norm lowercases GRÜNER→gruner', teaSearchNorm('GRÜNER')==='gruner');

  // --- teaMatchesSearch folds the query ITSELF (callers pass raw) ---
  check('raw GRÜNER query hits predicate (case+umlaut)', teaMatchesSearch(g1,'GRÜNER')===true);
  check('gruner (no umlaut) matches Grüner', teaMatchesSearch(g1,'gruner')===true);
  check('strasse matches Straße', teaMatchesSearch(s1,'strasse')===true);
  check('straße matches Straße', teaMatchesSearch(s1,'straße')===true);

  // --- multi-field: name / origin / cultivar / source ---
  check('matches cultivar', teaMatchesSearch(g1,'yabukita')===true);
  check('matches origin',   teaMatchesSearch(g1,'japan')===true);
  check('matches vendor(source)', teaMatchesSearch(g1,'keiko')===true);
  check('matches origin on oolong', teaMatchesSearch(o1,'wuyi')===true);

  // --- negatives + empty query ---
  check('no match returns false', teaMatchesSearch(g1,'zzz')===false);
  check('empty query matches all', teaMatchesSearch(o1,'')===true);
  check('whitespace query matches all', teaMatchesSearch(o1,'   ')===true);

  // --- chip + search composition = AND (via the real filteredSortedTeas) ---
  // 'gruner' alone matches BOTH g1 (name) and b1 (source 'Grüner-Shop'); the green chip must narrow to g1.
  state.teas=[g1,o1,b1]; state.teaSort='name';
  state.teaFilter={type:'',vendor:'',lowStock:false,favorite:false}; state.teaSearch='gruner';
  const searchOnly=filteredSortedTeas().map(t=>t.id).sort().join(',');
  check('search alone matches name AND vendor (g1,b1)', searchOnly==='b1,g1');
  state.teaFilter.type='green';
  const withChip=filteredSortedTeas().map(t=>t.id).join(',');
  check('green chip + search narrows to g1 (AND)', withChip==='g1');
  state.teaSearch=''; state.teaFilter={type:'',vendor:'',lowStock:false,favorite:false};

  // --- real-data no-crash pass (skips when the gitignored CSV is absent) ---
  if(__CSV_TEAS){
    let n=0; __CSV_TEAS.forEach(r=>{ teaSearchNorm(r.name); teaSearchNorm(r.origin); teaSearchNorm(r.cultivar); teaSearchNorm(r.source); n++; });
    console.log('real-CSV no-crash pass: '+n+' teas normalized across 4 fields');
  } else {
    console.log('SKIP real-CSV pass — fixtures/teas_rows.csv absent (fresh clone); '+passes+' synthetic checks still ran');
  }

  console.log('\\n'+(failures===0?'ALL TEA-SEARCH TESTS PASSED':failures+' FAILED')+'  ('+passes+' passed)');
  if(failures) throw new Error('tea-search test failed');
`;
vm.runInContext(testCode, ctx, {filename:'tea-search-bundle.js'});
