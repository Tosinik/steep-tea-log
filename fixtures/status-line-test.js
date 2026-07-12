/* PERMANENT validation — WS5 shelf status line (committed; runs every deploy).
 *
 * Invariant: statusLine(tea) picks the right TONE + phrasing from type + amount + freshness window,
 * and running-low teas sort to the top. This is the calm-first "one status line, same slot, only the
 * words change" rule (steep-teas.js). Grounded in Niklas's real teas_rows.csv; a couple of synthetic
 * greens exercise the harvest-window branch that real data (mostly harvest-less) never reaches.
 * #18 (v3.81) added session-aware tiers — cups left = amount ÷ avg logged dose, gram floor only
 * without history. Sections A–E run with state.sessions=[] (floor fallback → unchanged); F/G seed
 * sessions explicitly and pin the tier boundaries, precedence, and the issue's own 12g case.
 *
 * Run: node fixtures/status-line-test.js   (exit non-zero on any failure)
 */
const fs=require('fs'), path=require('path'), vm=require('vm');
const repo=path.join(__dirname,'..');
const src=['steep-knowledge.js','steep-core.js','steep-teas.js'].map(f=>fs.readFileSync(path.join(repo,f),'utf8')).join('\n;\n');
const ctx={}; ctx.window=ctx; ctx.globalThis=ctx; ctx.console=console;
ctx.document={documentElement:{setAttribute(){},getAttribute(){return 'light';}},getElementById(){return null;},querySelectorAll(){return[];},createElement(){return{style:{},setAttribute(){},appendChild(){},classList:{add(){}}};}};
ctx.localStorage={getItem(){return null;},setItem(){},removeItem(){}}; ctx.matchMedia=()=>({matches:false}); ctx.navigator={onLine:true};
ctx.setTimeout=()=>{};ctx.clearTimeout=()=>{};ctx.setInterval=()=>{};ctx.clearInterval=()=>{};ctx.addEventListener=()=>{};
vm.createContext(ctx); vm.runInContext(src, ctx);
vm.runInContext('state.settings=Object.assign({},DEFAULT_SETTINGS);', ctx);

// Quote-aware CSV parser (fixtures contain quoted commas).
function parseCSV(t){const R=[];let r=[],c='',q=false;for(let i=0;i<t.length;i++){const ch=t[i];
 if(q){if(ch==='"'){if(t[i+1]==='"'){c+='"';i++;}else q=false;}else c+=ch;}
 else if(ch==='"')q=true;else if(ch===','){r.push(c);c='';}
 else if(ch==='\n'){r.push(c);R.push(r);r=[];c='';}else if(ch!=='\r')c+=ch;}
 if(c||r.length){r.push(c);R.push(r);}
 const h=R[0];return R.slice(1).filter(x=>x.length===h.length)
   .map(x=>Object.fromEntries(h.map((k,i)=>[k,x[i]])));}
const csvPath=path.join(__dirname,'teas_rows.csv');
const haveCSV=fs.existsSync(csvPath);
// Map DB snake_case → the app's camelCase (same fields statusLine reads), like teaFromDb.
const teaFromRow = r => ({ id:r.id, name:r.name, type:(r.type||'').toLowerCase(),
  amountGrams:Number(r.amount_grams)||0, harvestYear:r.harvest_year||'', harvestSeason:r.harvest_season||'',
  isFavorite: r.is_favorite==='true'||r.is_favorite==='t' });

let passed=0, failures=0;
const ok=(c,m)=>{ if(c)passed++; else{failures++;console.log('  FAIL: '+m);} };
const S = t => ctx.statusLine(t);

// ---- 1. statusCategory mapping ----
ok(ctx.statusCategory({type:'green'})==='delicate', 'A1 green → delicate');
ok(ctx.statusCategory({type:'yellow'})==='delicate', 'A2 yellow → delicate');
ok(ctx.statusCategory({type:'white'})==='ages', 'A3 white → ages');
ok(ctx.statusCategory({type:'puerh'})==='ages', 'A4 puerh → ages');
ok(ctx.statusCategory({type:'oolong'})==='neutral', 'A5 oolong → neutral');
ok(ctx.statusCategory({type:'black'})==='neutral', 'A6 black → neutral');
console.log('  A statusCategory: 6 checks');

// ---- 2. fmtStockG ----
ok(ctx.fmtStockG(16)==='16g', 'B1 whole grams → "16g"');
ok(ctx.fmtStockG(6)==='6g', 'B2 "6g"');
ok(ctx.fmtStockG(16.5)==='16.5g', 'B3 fractional → "16.5g"');
ok(ctx.fmtStockG(0)==='0g', 'B4 zero → "0g"');
console.log('  B fmtStockG: 4 checks');

// ---- 3. tone rules on synthetic controls (independent of wall clock where possible) ----
ok(S({type:'green',amountGrams:2}).tone==='low', 'C1 low green → low tone');
ok(/running low$/.test(S({type:'oolong',amountGrams:5}).text), 'C2 low text ends "running low"');
ok(S({type:'white',amountGrams:30}).tone==='ages' && /ages well$/.test(S({type:'white',amountGrams:30}).text), 'C3 white → ages well');
ok(S({type:'puerh',amountGrams:30}).tone==='ages' && /ages gracefully$/.test(S({type:'puerh',amountGrams:30}).text), 'C4 puerh → ages gracefully');
ok(S({type:'oolong',amountGrams:30}).tone==='plenty' && /· plenty$/.test(S({type:'oolong',amountGrams:30}).text), 'C5 stocked oolong → "· plenty"');
ok(S({type:'green',amountGrams:30}).tone==='plenty' && /fresh, plenty$/.test(S({type:'green',amountGrams:30}).text), 'C6 stocked green, no harvest → "fresh, plenty"');
console.log('  C tone rules (synthetic): 6 checks');

// ---- 4. freshness-window branch (needs a near harvest; relative to now so it stays true) ----
const now=new Date();
const nearGreen={type:'green',amountGrams:30,harvestYear:String(now.getFullYear()-1),harvestSeason:'autumn'};
const nearWk=ctx.freshnessWeeksLeft(nearGreen);
ok(nearWk!=null, 'D1 harvest → a computable week count');
const nearRes=S(nearGreen);
// last-autumn harvest + 12mo window: some weeks should remain but < ~6mo → countdown fires.
ok(nearRes.tone==='freshness' && /best within \d+ wks?$|best enjoyed soon$/.test(nearRes.text), 'D2 near/late window green → freshness phrasing');
const farGreen={type:'green',amountGrams:30,harvestYear:String(now.getFullYear()),harvestSeason:'spring'};
ok(S(farGreen).tone==='plenty', 'D3 this-year spring green (window wide open) → plenty not countdown');
const oldGreen={type:'green',amountGrams:30,harvestYear:String(now.getFullYear()-3),harvestSeason:'spring'};
ok(S(oldGreen).tone==='freshness' && /best enjoyed soon$/.test(S(oldGreen).text), 'D4 long-past window → "best enjoyed soon"');
console.log('  D freshness window: 4 checks');

// ---- 5. real data (teas_rows.csv) ----
if(haveCSV){
  const teas=parseCSV(fs.readFileSync(csvPath,'utf8')).map(teaFromRow).filter(t=>t.name && t.type);
  // running-low set = in stock but under threshold. Expect exactly Shincha + Honey Oolong.
  const low=teas.filter(t=>ctx.isRunningLow(t));
  ok(low.length===2, 'E1 real data has exactly 2 running low (got '+low.length+': '+low.map(t=>t.name).join(', ')+')');
  ok(low.every(t=>S(t).tone==='low'), 'E2 both running-low teas get the low tone');
  ok(low.some(t=>/Shincha/i.test(t.name)) && low.some(t=>/Honey Oolong/i.test(t.name)), 'E3 the two are Shincha + Honey Oolong');
  // every in-stock, non-low tea's tone agrees with its category
  teas.filter(t=>Number(t.amountGrams)>0 && !ctx.isRunningLow(t)).forEach(t=>{
    const cat=ctx.statusCategory(t), tone=S(t).tone;
    const okTone = cat==='ages' ? tone==='ages'
      : cat==='neutral' ? tone==='plenty'
      : (tone==='plenty'||tone==='freshness'); // delicate → plenty, or countdown if harvest-dated
    ok(okTone, 'E4 '+t.name+' ('+t.type+', cat '+cat+') → unexpected tone '+tone);
  });
  // whites in the export read "ages well"
  teas.filter(t=>t.type==='white' && Number(t.amountGrams)>0).forEach(t=>
    ok(/ages well$/.test(S(t).text), 'E5 '+t.name+' (white) → "ages well"'));
  // shelfSort puts every running-low tea ahead of every non-low one
  const sorted=ctx.shelfSort(teas.filter(t=>Number(t.amountGrams)>0));
  const firstNonLow=sorted.findIndex(t=>!ctx.isRunningLow(t));
  const lastLow=sorted.map(t=>ctx.isRunningLow(t)).lastIndexOf(true);
  ok(firstNonLow===-1 || lastLow<firstNonLow, 'E6 shelfSort: running-low teas all sort to the top');
  console.log('  E real data: '+(6 + teas.filter(t=>Number(t.amountGrams)>0 && !ctx.isRunningLow(t)).length + teas.filter(t=>t.type==='white'&&Number(t.amountGrams)>0).length)+' checks');
} else {
  console.log('  E real data: SKIPPED (teas_rows.csv not present)');
}

// ---- 6. #18 session-aware tiers (synthetic controls; sessions injected explicitly) ----
// state is a top-level `let` in the vm — reachable only by running a script in the context.
const seed = arr => vm.runInContext('state.sessions='+JSON.stringify(arr)+';', ctx);
const dose = (teaId,g) => ({teaId, gramsUsed:g});
seed([dose('f-low',5), dose('f-two',5), dose('f-under5',5), dose('f-five',5), dose('f-issue',5),
      dose('f-big',8), dose('f-white',10), dose('f-green',5), dose('f-heavy',15), dose('f-light',2)]);
// boundary pins (one 5g session each — also pins that n=1 anchors the average):
ok(S({id:'f-low',type:'oolong',amountGrams:9.95}).tone==='low', 'F1 1.99 cups → low');
ok(S({id:'f-two',type:'oolong',amountGrams:10}).text==='10g · a few cups left' && S({id:'f-two',type:'oolong',amountGrams:10}).tone==='few', 'F2 2.0 cups → few, exact string');
ok(S({id:'f-under5',type:'oolong',amountGrams:24.95}).tone==='few', 'F3 4.99 cups → few');
ok(S({id:'f-five',type:'oolong',amountGrams:25}).tone==='plenty', 'F4 5.0 cups → plenty (exactly five reads plenty)');
// the issue's shape: 12g at a 5g dose = 2.4 cups → the middle tier, not "plenty"
ok(S({id:'f-issue',type:'oolong',amountGrams:12}).text==='12g · a few cups left', 'F5 12g @ 5g dose → "a few cups left"');
ok(vm.runInContext('STATUS_TONE_COLOR.few',ctx)==='var(--ink-soft)', 'F6 few tone is ink-soft (information, not urgency)');
// one big single session must NOT brand a full tin (56g @ 8g = 7 cups):
ok(S({id:'f-big',type:'green',amountGrams:56}).tone==='plenty', 'F7 single 8g session on 56g → plenty');
// cups govern when history exists — in BOTH directions across the gram floor (15):
ok(S({id:'f-heavy',type:'oolong',amountGrams:20}).tone==='low', 'F8 20g @ 15g dose (1.3 cups) → low despite being over the floor');
ok(S({id:'f-light',type:'oolong',amountGrams:10}).tone==='plenty', 'F9 10g @ 2g dose (5 cups) → plenty despite being under the floor');
// precedence: quantity wins while remarkable — few outranks ages AND the freshness countdown:
ok(S({id:'f-white',type:'white',amountGrams:30}).text==='30g · a few cups left', 'F10 white w/ 3 cups → few beats "ages well"');
const fewGreen={id:'f-green',type:'green',amountGrams:15,harvestYear:String(now.getFullYear()-1),harvestSeason:'autumn'};
ok(S(fewGreen).text==='15g · a few cups left', 'F11 near-window green w/ 3 cups → few beats the countdown');
ok(!/fresh/.test(S(fewGreen).text), 'F12 no composition — never "fresh · a few cups left"');
// few has NO sort effect (WS5: only low sorts to the top):
ok(ctx.isRunningLow({id:'f-issue',type:'oolong',amountGrams:12})===false, 'F13 few tea is not isRunningLow');
const fLow={id:'f-low',type:'oolong',amountGrams:9.95}, fFew={id:'f-issue',type:'oolong',amountGrams:12}, fPlenty={id:'f-five',type:'oolong',amountGrams:25};
const fSorted=ctx.shelfSort([fPlenty,fFew,fLow]);
ok(fSorted[0]===fLow && fSorted[1]===fPlenty && fSorted[2]===fFew, 'F14 shelfSort: low tops, few does NOT precede plenty');
// no-history fallback: the floor (15) keeps deciding, exactly as before #18:
seed([]);
ok(S({id:'f-none',type:'oolong',amountGrams:12}).text==='12g · running low', 'F15 12g, no sessions → floor fallback "running low"');
console.log('  F #18 tiers (synthetic): 15 checks');

// ---- 7. #18 tiers on real data (needs BOTH teas + sessions CSVs; pins move on re-export) ----
const sessCsvPath=path.join(__dirname,'sessions_rows.csv');
if(haveCSV && fs.existsSync(sessCsvPath)){
  const teas=parseCSV(fs.readFileSync(csvPath,'utf8')).map(teaFromRow).filter(t=>t.name && t.type);
  seed(parseCSV(fs.readFileSync(sessCsvPath,'utf8')).map(r=>({teaId:r.tea_id, gramsUsed:Number(r.grams_used)||0})));
  // cups math must not move the low set: still exactly Shincha + Honey Oolong
  const lowT=teas.filter(t=>ctx.isRunningLow(t));
  ok(lowT.length===2 && lowT.some(t=>/Shincha/i.test(t.name)) && lowT.some(t=>/Honey Oolong/i.test(t.name)),
    'G1 real sessions seeded: low set still exactly Shincha + Honey Oolong (got '+lowT.map(t=>t.name).join(', ')+')');
  const sencha=teas.find(t=>/Sencha Kagoshima Premium/i.test(t.name));
  ok(sencha && ctx.stockTier(sencha)==='few', 'G2 Sencha Kagoshima Premium (16g @ ~5g dose) → few');
  // THE issue pin: the same tea at the screenshot's 12g reads the middle tier, not "plenty"
  ok(sencha && S(Object.assign({},sencha,{amountGrams:12})).text==='12g · a few cups left', 'G3 issue #18: 12g Sencha → "a few cups left"');
  const megumi=teas.find(t=>/Megumi/i.test(t.name));
  ok(megumi && ctx.stockTier(megumi)==='plenty', 'G4 Megumi 56g (one 8g session) → plenty');
  seed([]);
  console.log('  G #18 tiers (real data): 4 checks');
} else {
  console.log('  G #18 tiers (real data): SKIPPED, 4 checks not run (need teas_rows.csv + sessions_rows.csv)');
}

if(failures){ console.log('\n'+failures+' STATUS-LINE TEST(S) FAILED'); process.exit(1); }
console.log('\nALL STATUS-LINE TESTS PASSED  ('+passed+' passed)');
