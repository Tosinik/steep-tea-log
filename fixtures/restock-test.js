/* PERMANENT validation — Smart Restock (R184): the purchase log + single-writer commitRestock.
 * Guards the invariants restock rides: it ONLY sets amountGrams (stockTier reads it) and openedDate
 * (freshnessReading reads it); the log is the source of truth for cost; the "opening now?" toggle
 * decouples buy from open; a stockpiled bag opens only on the explicit control; the legacy buy-#1 seed;
 * name+vendor soft-link; per-batch lifespan reads OPENED dates; honest floor on an empty log.
 *
 * Synthetic (restock is pure state math; no CSV dependency; stays green on a fresh clone).
 * Run: node fixtures/restock-test.js   (exit non-zero on any failure)
 */
const fs=require('fs'), path=require('path'), vm=require('vm');
const repo=path.join(__dirname,'..');
const SRC=['steep-knowledge.js','steep-tea-types.js','steep-core.js','steep-dashboard.js','steep-teas.js']
  .map(f=>fs.readFileSync(path.join(repo,f),'utf8')).join('\n;\n');
const ctx={};ctx.window=ctx;ctx.globalThis=ctx;ctx.console=console;
ctx.document={documentElement:{setAttribute(){},getAttribute(){return'light'}},
  getElementById:()=>null,querySelector:()=>null,querySelectorAll:()=>[],
  createElement:()=>({style:{},setAttribute(){},appendChild(){},classList:{add(){}}})};
ctx.localStorage={getItem:()=>null,setItem(){},removeItem(){}};
ctx.matchMedia=()=>({matches:false});ctx.navigator={onLine:true};
ctx.setTimeout=()=>{};ctx.clearTimeout=()=>{};ctx.setInterval=()=>{};ctx.clearInterval=()=>{};
ctx.addEventListener=()=>{};
vm.createContext(ctx);vm.runInContext(SRC,ctx);
vm.runInContext('state.settings=Object.assign({},DEFAULT_SETTINGS);',ctx);
ctx.render=()=>{}; ctx.showToast=()=>{}; ctx.persistTea=()=>{}; ctx.syncAchievements=()=>{};
const S = vm.runInContext('state', ctx);

let passed=0, failures=0;
const ok=(c,m)=>{ if(c){passed++;} else {failures++; console.log('  FAIL: '+m);} };
const round=(n,d)=>Math.round(n*Math.pow(10,d))/Math.pow(10,d);
// A restock form event, mocked (commitRestock reads f.grams/date/cost/openingNow off ev.target).
const evt = (grams,date,cost,openingNow)=>({ preventDefault(){}, target:{
  grams:{value:String(grams)}, date:{value:date}, cost:{value:cost==null?'':String(cost)}, openingNow:{checked:!!openingNow} } });
const seed = (over)=>{ S.teas=[Object.assign({ id:'t1', name:'Dan Cong', type:'oolong', source:'Vendor A',
  harvestYear:'2024', amountGrams:0, costTotal:0, costOriginalGrams:0, openedDate:null, purchaseDate:null,
  wouldRebuy:false, purchaseType:'first', purchaseLog:[] }, over||{})]; S.restockFor='t1'; S.sessions=[]; };

// ---- A. restock, opening now (toggle ON): single writers + append ----
seed({ amountGrams:20, openedDate:null });
ctx.commitRestock(evt(50,'2025-01-09',10,true));
let t = S.teas[0];
ok(t.amountGrams===70, 'A1 amountGrams += grams (20+50=70) — stockTier reads the new total');
ok(t.openedDate==='2025-01-09', 'A2 opening now SETS openedDate (freshnessReading refreshes)');
ok(t.wouldRebuy===true, 'A3 wouldRebuy flips true (honest — you rebought it)');
ok(t.purchaseLog.length===1 && t.purchaseLog[0].opened==='2025-01-09', 'A4 the event is appended with opened=date');
ok(ctx.freshnessClock(t) && ctx.freshnessClock(t).measured===true, 'A5 freshnessClock reads the openedDate (measured)');
console.log('  A opening now: 5 checks');

// ---- B. restock, stockpiling (toggle OFF): openedDate untouched, opened=null ----
seed({ amountGrams:20, openedDate:'2024-06-01' });
ctx.commitRestock(evt(40,'2025-02-01',8,false));
t = S.teas[0];
ok(t.amountGrams===60, 'B1 amountGrams still grows when stockpiling (sealed stock IS stock)');
ok(t.openedDate==='2024-06-01', 'B2 stockpiling leaves openedDate UNTOUCHED (buy is not open)');
ok(t.purchaseLog[t.purchaseLog.length-1].opened===null, 'B3 the stockpiled event records opened=null');
console.log('  B stockpiling: 3 checks');

// ---- C. legacy buy-#1 seed on the first restock ----
seed({ amountGrams:15, costTotal:18, costOriginalGrams:100, purchaseDate:'2024-03-12', openedDate:'2024-03-15', purchaseLog:[] });
ctx.commitRestock(evt(50,'2025-01-09',10,true));
t = S.teas[0];
ok(t.purchaseLog.length===2, 'C1 first restock of a legacy tea seeds buy #1 THEN appends (2 events)');
ok(t.purchaseLog[0].grams===100 && t.purchaseLog[0].cost===18 && t.purchaseLog[0].opened==='2024-03-15', 'C2 buy #1 seeded from cost_original_grams / cost_total / openedDate');
console.log('  C legacy seed: 2 checks');

// ---- D. opening a stockpiled bag later (the explicit control) ----
seed({ amountGrams:60, openedDate:'2024-06-01', purchaseLog:[{grams:20,date:'2024-06-01',cost:5,opened:'2024-06-01'},{grams:40,date:'2025-02-01',cost:8,opened:null}] });
ok(ctx.unopenedBatch(S.teas[0])===true, 'D1 a sealed bag is detected');
ctx.d_openBatch('t1');
t = S.teas[0];
ok(t.purchaseLog[1].opened && t.openedDate===t.purchaseLog[1].opened, 'D2 opening sets the oldest sealed event.opened AND resets openedDate to it');
ok(ctx.unopenedBatch(t)===false, 'D3 no sealed bag remains');
console.log('  D open a stockpiled bag: 3 checks');

// ---- E. weighted cost/gram + legacy fallback + honest floor ----
seed({ purchaseLog:[{grams:100,date:'2024-03-12',cost:18,opened:'2024-03-15'},{grams:50,date:'2025-01-09',cost:10,opened:'2025-01-09'}] });
let tot = ctx.purchaseTotals(S.teas[0]);
ok(tot && !tot.legacy && tot.spend===28 && tot.grams===150 && round(tot.perGram,4)===round(28/150,4), 'E1 weighted cost/gram = Σcost/Σgrams across the log (28/150g)');
seed({ costTotal:18, costOriginalGrams:100, purchaseLog:[] });
let leg = ctx.purchaseTotals(S.teas[0]);
ok(leg && leg.legacy===true && round(leg.perGram,4)===round(18/100,4), 'E2 no log → legacy cost_total/cost_original_grams fallback');
seed({ costTotal:0, costOriginalGrams:0, purchaseLog:[] });
ok(ctx.purchaseTotals(S.teas[0])===null, 'E3 honest floor: no log AND no legacy cost → null (never a guessed cost)');
console.log('  E cost math: 3 checks');

// ---- F. per-batch lifespan reads the OPENED dates ----
seed({ purchaseLog:[{grams:100,date:'2024-01-01',cost:0,opened:'2024-01-01'}] });
let ls = ctx.batchLifespanDays(S.teas[0]);
ok(ls!=null && ls>0, 'F1 the latest opened bag has a lifespan in days ('+ls+')');
seed({ purchaseLog:[{grams:40,date:'2025-02-01',cost:8,opened:null}] });
ok(ctx.batchLifespanDays(S.teas[0])===null, 'F2 a sealed-only entry has no lifespan (honest floor)');
console.log('  F lifespan: 2 checks');

// ---- G. soft-link by name + vendor across harvests (read-only) ----
S.teas=[ {id:'a',name:'Dan Cong',source:'Vendor A',harvestYear:'2024'},
         {id:'b',name:'Dan Cong',source:'Vendor A',harvestYear:'2023'},
         {id:'c',name:'Dan Cong',source:'Vendor B',harvestYear:'2024'},
         {id:'d',name:'Long Jing',source:'Vendor A',harvestYear:'2024'} ];
let links = ctx.teaSoftLinks(S.teas[0]);
ok(links.length===1 && links[0].id==='b', 'G1 soft-link = same name+vendor across harvest (b); a different vendor (c) or tea (d) is separate');
console.log('  G soft-link: 1 check');

// ---- H. stockTier reads the restocked total ----
seed({ amountGrams:1 });
const tierBefore = ctx.stockTier(S.teas[0]);
ctx.commitRestock(evt(80,'2025-01-09',0,true));
ok(tierBefore!=='plenty' && ctx.stockTier(S.teas[0])==='plenty', 'H1 stockTier moves low→plenty off the restocked amountGrams (single writer)');
console.log('  H stockTier reads the total: 1 check');

console.log(failures ? '\n'+failures+' RESTOCK TEST(S) FAILED' : '\nALL RESTOCK TESTS PASSED ('+passed+' passed)');
process.exit(failures?1:0);
