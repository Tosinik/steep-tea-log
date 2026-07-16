/* PERMANENT validation — tea reference layer (Phase A). Committed: it guards a cross-module
 * data contract (the two-level taxonomy + the §3 hedge-visible rule) and the reconciliation
 * rulings that shaped tea-types.json.
 *
 * Loads steep-tea-types.js (the 55-row TEA_TYPES global + the read path in one module, the
 * steep-knowledge.js pattern) and grounds the matcher in the REAL teas_rows.csv. Pins, in order:
 *  A  data integrity — 55 rows, unique slugs, resolvable parents, no covers collisions
 *  B  member inheritance — a member borrows the parent's processing facts
 *  C  confidence is PER-ROW, never inherited (Da Hong Pao 'contested' under 'canonical' parent)
 *  D  the DHP hedge renders end-to-end (typeConfidenceHedge non-empty) — the §3 contract, at
 *     the row that proves it; a field-only check would miss the point
 *  E  covers resolution — a library tea resolves to the MEMBER; the parent is browse-reachable
 *     but is NOT the matcher's answer (the exact ambiguity the two-level model introduces)
 *  F  disambiguation traps — the matcher never token-infers (bai≠white, EN black≠ZH hei cha,
 *     one name = two teas)
 *  G  real teas_rows.csv — every library tea maps to its expected type; the other user's row maps to none
 *
 * Run: node fixtures/tea-types-test.js   (exit non-zero on any failure)
 */
const fs=require('fs'), path=require('path'), vm=require('vm');
const repo=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(repo,'steep-tea-types.js'),'utf8');
const ctx={}; ctx.window=ctx; ctx.globalThis=ctx; ctx.console=console;
vm.createContext(ctx); vm.runInContext(src, ctx);
const data=vm.runInContext('TEA_TYPES', ctx);   // the module's own inline array — the exact data the app ships

// Quote-aware CSV parser (fixtures contain quoted commas).
function parseCSV(t){const R=[];let r=[],c='',q=false;for(let i=0;i<t.length;i++){const ch=t[i];
 if(q){if(ch==='"'){if(t[i+1]==='"'){c+='"';i++;}else q=false;}else c+=ch;}
 else if(ch==='"')q=true;else if(ch===','){r.push(c);c='';}
 else if(ch==='\n'){r.push(c);R.push(r);r=[];c='';}else if(ch!=='\r')c+=ch;}
 if(c||r.length){r.push(c);R.push(r);}
 const h=R[0];return R.slice(1).filter(x=>x.length===h.length)
   .map(x=>Object.fromEntries(h.map((k,i)=>[k,x[i]])));}

let passed=0, failures=0;
const ok=(c,m)=>{ if(c)passed++; else{failures++;console.log('  FAIL: '+m);} };
const match=n=>ctx.matchTeaType(n);
const resolve=s=>ctx.resolveTeaType(s);
const bySlug=s=>ctx.ttBySlug(s);

// ---- A. data integrity ----
ok(data.length===55, 'A1 exactly 55 reconciled rows (got '+data.length+')');
const slugs=data.map(r=>r.slug);
ok(new Set(slugs).size===slugs.length, 'A2 slugs unique (dupes: '+slugs.filter((s,i)=>slugs.indexOf(s)!==i).join(',')+')');
const slugSet=new Set(slugs);
ok(data.filter(r=>r.parent&&!slugSet.has(r.parent)).length===0, 'A3 every member parent resolves');
const cov={}; data.forEach(r=>(r.covers||[]).forEach(n=>(cov[n]=cov[n]||[]).push(r.slug)));
ok(Object.values(cov).every(v=>v.length===1), 'A4 no covers collisions (each library tea covered by one type)');
ok(data.filter(r=>!r.parent).length + data.filter(r=>r.parent).length === 55, 'A5 every row is a parent/standalone or a member');
console.log('  A data integrity: 5 checks');

// ---- B. inheritance (a member borrows the parent's processing facts) ----
const dhp=resolve('dhp');
ok(dhp.leaf_shape==='strip-twisted', 'B1 dhp inherits leaf_shape strip-twisted from Wuyi Yancha');
ok(dhp.oxidation_low===40 && dhp.oxidation_high===70, 'B2 dhp inherits oxidation 40–70');
ok(dhp.roast==='medium-heavy', 'B3 dhp inherits roast medium-heavy');
ok(dhp.family==='oolong' && /Wuyi Mountains/.test(dhp.region), 'B4 dhp inherits family + region');
ok(dhp.typical_brew && dhp.typical_brew.g_per_100ml===6, 'B5 dhp inherits typical_brew');
ok(dhp.display_name==='Da Hong Pao' && /blend/.test(dhp.note), 'B6 dhp keeps its OWN display_name + note (not the parent\'s)');
ok(resolve('sencha').family==='green', 'B7 a standalone resolves its own fields');
console.log('  B inheritance: 7 checks');

// ---- C. confidence is PER-ROW, never inherited ----
ok(bySlug('wuyi-yancha').confidence==='canonical', 'C1 parent Wuyi Yancha is canonical');
ok(resolve('dhp').confidence==='contested', 'C2 member Da Hong Pao is contested — its OWN value, not the parent\'s canonical');
ok(resolve('rou-gui').confidence==='canonical', 'C3 a member without confidence defaults canonical (not silently contested)');
ok(bySlug('rou-gui').confidence===undefined, 'C4 …and that default is applied at resolve, not baked into the data');
console.log('  C confidence per-row: 4 checks');

// ---- D. the DHP hedge renders end-to-end (§3 content contract) ----
ok(ctx.typeConfidenceHedge(resolve('dhp'))!=='', 'D1 Da Hong Pao renders WITH a hedge (contested → visible), not as flat fact');
ok(ctx.typeConfidenceHedge(resolve('rou-gui'))==='', 'D2 a canonical row renders with no hedge');
ok(ctx.typeConfidenceHedge(resolve('ruan-zhi-oolong'))!=='', 'D3 the other contested row (Ruan Zhi) also hedges');
console.log('  D hedge end-to-end: 3 checks');

// ---- E. covers resolution — member is the matcher target, parent stays browse-reachable ----
const dawang=match('Dawang Feng Da Hong Pao');
ok(dawang && dawang.slug==='dhp', 'E1 "Dawang Feng Da Hong Pao" resolves to the MEMBER dhp');
ok(dawang.slug!=='wuyi-yancha', 'E2 …not to the parent Wuyi Yancha');
ok(bySlug('wuyi-yancha').covers.length===0, 'E3 the parent carries no covers (member-only)');
const browse=ctx.browseTeaTypes();
ok(browse.some(b=>b.type.slug==='wuyi-yancha'), 'E4 …yet Wuyi Yancha is still a browse category');
ok(browse.find(b=>b.type.slug==='wuyi-yancha').members.some(m=>m.slug==='dhp'), 'E5 …with Da Hong Pao grouped under it');
const yashi=match('Yashi Xiang Dancong Guandong');
ok(yashi && yashi.slug==='ya-shi-xiang', 'E6 Ya Shi Xiang resolves to the member, not phoenix-dancong');
ok(browse.some(b=>b.type.slug==='phoenix-dancong'), 'E7 Phoenix Dan Cong stays browse-reachable');
console.log('  E covers resolution: 7 checks');

// ---- F. disambiguation traps — never token-infer ----
const anji=match('Anji Bai Cha');
ok(anji===null || anji.family!=='white', 'F1 "Anji Bai Cha" is never routed to WHITE by the "bai" token');
ok(bySlug('anji-bai-cha') && bySlug('anji-bai-cha').family==='green', 'F2 …the seed files it correctly as green');
ok(match('Some Random Black Tea')===null, 'F3 a bare "black tea" string is not force-matched (EN black ≠ a guess)');
ok(bySlug('hong-cha').family==='black' && bySlug('hei-cha').family==='dark', 'F4 EN black (hong cha) and ZH hei cha (pu-erh) are DIFFERENT families');
ok(bySlug('shui-xian-wuyi').parent==='wuyi-yancha' && bySlug('phoenix-shui-xian').parent==='phoenix-dancong', 'F5 "Shui Xian" names two teas — a Wuyi member AND a Dan Cong member');
ok(match('Shui Xian')===null, 'F6 …so a bare "Shui Xian" matches nothing — context disambiguates, tokens never do');
ok(match('')===null && match(null)===null, 'F7 empty/nullish name → no match');
console.log('  F disambiguation traps: 7 checks');

// ---- G. real teas_rows.csv grounding ----
const csvPath=path.join(__dirname,'teas_rows.csv');
if(fs.existsSync(csvPath)){
  const teas=parseCSV(fs.readFileSync(csvPath,'utf8'));
  const EXPECT={
    'Sencha Megumi No. 1 Hoshino':'sencha', '2021 Fujian White Tea':'fujian-white',
    'Honey Oolong Gui Fei':'gui-fei-oolong', 'Sencha Kagoshima Premium':'sencha',
    'Dawang Feng Da Hong Pao':'dhp', 'Shincha Saemidori Kagoshima':'shincha',
    'Oriental Beauty':'oriental-beauty', 'Kabusecha Kagoshima':'kabusecha',
    'Ruby Ruanzhi':'ruan-zhi-oolong', 'Yashi Xiang Dancong Guandong':'ya-shi-xiang',
    'Huang Ya Yellow Tips':'huang-ya', 'Ali Shan Fo Shou Dong Pian':'alishan-gaoshan',
    'Yunnan Silver Bud Ya Bao':'ya-bao-yunnan'
  };
  let n=0;
  teas.forEach(t=>{
    if(t.name in EXPECT){ const m=match(t.name);
      ok(m && m.slug===EXPECT[t.name], 'G "'+t.name+'" → '+EXPECT[t.name]+' (got '+(m?m.slug:'null')+')'); n++; }
  });
  ok(match('Test')===null, 'G "Test" (the other user\'s row) matches no type');
  // every main-library tea is expected — a new library tea with no mapping is a signal to author a row, not a silent miss
  const unmapped=teas.filter(t=>t.name!=='Test' && !(t.name in EXPECT)).map(t=>t.name);
  ok(unmapped.length===0, 'G all main-library teas have an expected mapping (unmapped: '+unmapped.join(', ')+')');
  console.log('  G real CSV grounding: '+(n+2)+' checks');
} else {
  console.log('  G real CSV grounding: SKIPPED (teas_rows.csv not present)');
}

if(failures){ console.log('\n'+failures+' TEA-TYPES TEST(S) FAILED'); process.exit(1); }
console.log('\nALL TEA-TYPES TESTS PASSED  ('+passed+' passed)');
