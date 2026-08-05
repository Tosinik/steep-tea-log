/* PERMANENT validation — WS5 shelf status line (committed; runs every deploy).
 *
 * Invariant: statusLine(tea) picks the right TONE + phrasing from type + amount + freshness window,
 * and running-low teas sort to the top. This is the calm-first "one status line, same slot, only the
 * words change" rule (steep-teas.js). Grounded in Niklas's real teas_rows.csv; a couple of synthetic
 * greens exercise the harvest-window branch that real data (mostly harvest-less) never reaches.
 * #18 (v3.81) added session-aware tiers — cups left = amount ÷ avg logged dose, gram floor only
 * without history. Sections A–E run with state.sessions=[] (floor fallback → unchanged); F/G seed
 * sessions explicitly and pin the tier boundaries, precedence, and the issue's own 12g case.
 * v3.82 adds H: the Home "Running low" card membership (restockCandidate) — 'few' informs on
 * the shelf but never earns the nudge card.
 * v3.86 (#26/#27) splits the 0g tier by evidence — 'empty' (tracked, drained) vs 'untracked'
 * (bare 0 = unknown, never plenty/empty) — and widens restockCandidate to low-or-empty
 * ('few' still never qualifies). Section I pins the split; H relabelled accordingly.
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
/* v3.96 repair. This section was red against three successive exports because it did two things wrong,
   both of the shape R69 describes:
     1. It never seeded lowStockThreshold, so it ran the engine at DEFAULT_SETTINGS' 15 while the owner's
        real setting is in user_settings_rows.csv. Three teas are low at 15, two at 11 — the suite was
        comparing the engine's answer under one threshold against a shelf counted under another.
     2. It was UNSCOPED: teas_rows.csv carries another account's row (R69), and E1's absolute
        `low.length===2` survived only because that row happens to be inert at 0 g.
   The repair takes both, and drops the pinned names. A count and a name list are SNAPSHOTS (R67) — they
   move whenever a cup is brewed — so what is asserted now is the engine's own agreement with itself:
   the low set is exactly the set stockTier calls 'low', every member reads the low tone, and the
   threshold is the boundary it claims to be. Nothing here goes stale when Niklas drinks something. */
const ownerOf = () => {
  const sp = path.join(__dirname,'sessions_rows.csv');
  if(!fs.existsSync(sp)) return null;
  const ses = parseCSV(fs.readFileSync(sp,'utf8'));
  return ses.length ? ses[0].user_id : null;     // sessions are single-owner; export-gate-test asserts it
};
/* setTh is scoped, not global: the real threshold (11) belongs to the real-data sections only. Setting
   it once at the top silently reinterpreted the SYNTHETIC section F, whose 12 g case is written against
   the default floor of 15 — F15 went red and would have read as a regression in the tier engine rather
   than as one suite leaking a setting into another. Restore after every real-data block. */
const DEFAULT_TH = vm.runInContext('DEFAULT_SETTINGS.lowStockThreshold', ctx);
const setTh = v => vm.runInContext('state.settings.lowStockThreshold='+(v==null?DEFAULT_TH:v)+';', ctx);
const thresholdOf = owner => {
  const up = path.join(__dirname,'user_settings_rows.csv');
  if(!fs.existsSync(up) || !owner) return null;
  const own = parseCSV(fs.readFileSync(up,'utf8')).find(r=>r.user_id===owner);
  const m = own && /"lowStockThreshold"\s*:\s*(\d+)/.exec(own.settings||'');
  return m ? Number(m[1]) : null;                // null = the owner has no row; fall back to the default
};
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
  const OWNER = ownerOf();
  const TH = thresholdOf(OWNER);
  // state is a vm-scoped top-level let (see the seed helper below) — reach it through the context.
  setTh(TH);
  const teas=parseCSV(fs.readFileSync(csvPath,'utf8'))
    .filter(r=>!OWNER || r.user_id===OWNER)                 // R69: never by name — tea-types-test.js G did that
    .map(teaFromRow).filter(t=>t.name && t.type);
  // The low set is whatever stockTier calls low; the assertions are about agreement, not about which
  // teas happen to be low today.
  const low=teas.filter(t=>ctx.isRunningLow(t));
  ok(low.length===teas.filter(t=>ctx.stockTier(t)==='low').length,
     'E1 isRunningLow agrees exactly with stockTier==="low" across the real shelf ('+low.length+' low at threshold '+(TH==null?'DEFAULT':TH)+')');
  ok(low.every(t=>S(t).tone==='low'), 'E2 every running-low tea gets the low tone');
  // The threshold is a real boundary, both directions — no tea above it is low, and every tracked tea
  // below it (and in stock) is. This is what E3's name list was standing in for.
  ok(low.every(t=>Number(t.amountGrams) < (TH==null?15:TH)) &&
     teas.filter(t=>Number(t.amountGrams)>0 && Number(t.amountGrams) < (TH==null?15:TH) && ctx.cupsLeft(t)==null)
         .every(t=>ctx.isRunningLow(t)),
     'E3 the threshold is the boundary in both directions (grams-based teas; cups-based ones use their own rule)');
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
  setTh(null);   // hand the synthetic sections back the default floor they are written against
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
  const OWNER = ownerOf();
  const TH = thresholdOf(OWNER);
  setTh(TH);
  const teas=parseCSV(fs.readFileSync(csvPath,'utf8'))
    .filter(r=>!OWNER || r.user_id===OWNER).map(teaFromRow).filter(t=>t.name && t.type);
  const before=teas.filter(t=>ctx.isRunningLow(t)).map(t=>t.name).sort().join('|');
  seed(parseCSV(fs.readFileSync(sessCsvPath,'utf8')).map(r=>({teaId:r.tea_id, gramsUsed:Number(r.grams_used)||0})));
  /* G1 v3.96: what #18 actually promised is that seeding real dose history does not silently move the
     low set — the cups rule may only ADD a tea the grams floor missed (a heavy-dose tea running out
     faster than its gram count suggests), never remove one. The old form pinned two names, which is a
     snapshot, and it went red the moment the shelf changed rather than when the rule broke. */
  const after=teas.filter(t=>ctx.isRunningLow(t)).map(t=>t.name).sort();
  ok(before.split('|').filter(Boolean).every(n=>after.includes(n)),
     'G1 seeding real dose history never REMOVES a tea from the low set (before: '+(before||'none')+' → after: '+(after.join(', ')||'none')+')');
  // The five tiers must all be reachable from the engine on real rows — a tier no path returns is dead.
  const tiers=new Set(teas.map(t=>ctx.stockTier(t)));
  ok(tiers.size>=3 && [...tiers].every(x=>['empty','untracked','low','few','plenty'].includes(x)),
     'G2 the real shelf exercises several of the five tiers and returns no tier outside them (got: '+[...tiers].sort().join(', ')+')');
  /* G3 keeps the ISSUE pin, because that is a rule and not a snapshot: whichever tea is the shelf's
     heaviest-dose green, at 12 g it must read the middle tier rather than "plenty". Found by dose, not
     by name — the name was the stale part. */
  const doseRanked=teas.filter(t=>ctx.teaAvgDose(t)>0).sort((a,b)=>ctx.teaAvgDose(b)-ctx.teaAvgDose(a));
  const heavy=doseRanked[0];
  ok(heavy && S(Object.assign({},heavy,{amountGrams:12})).text==='12g · a few cups left',
     'G3 issue #18 holds: the heaviest-dose real tea ('+(heavy&&heavy.name)+' @ '+(heavy?ctx.teaAvgDose(heavy).toFixed(1):'?')+'g) reads "a few cups left" at 12g');
  // …and a well-stocked light-dose tea still reads plenty, the other side of the same rule.
  const light=doseRanked[doseRanked.length-1];
  ok(light && ctx.stockTier(Object.assign({},light,{amountGrams:120}))==='plenty',
     'G4 the lightest-dose real tea at 120g still reads plenty');
  seed([]); setTh(null);
  console.log('  G #18 tiers (real data): 4 checks');
} else {
  console.log('  G #18 tiers (real data): SKIPPED, 4 checks not run (need teas_rows.csv + sessions_rows.csv)');
}

// ---- 8. v3.82 Home "Running low" card membership — 'few' never earns the card ----
// The #18 correction: 23g at a 5g dose = 4.6 cups ('few') sat under the "Running low" headline
// beside a ~6-month forecast — two clocks disagreeing under one title. Only 'low' (and, since
// v3.86 #26 B, 'empty') earns the card.
const RC=t=>ctx.restockCandidate(t);
seed([dose('h-dawang',5), dose('h-low',5), dose('h-plain',5), dose('h-rebuy',5), dose('h-plenty',5)]);
ok(RC({id:'h-low',type:'oolong',amountGrams:9,isFavorite:true})===true, 'H1 favourite at 1.8 cups (low) → on the card');
ok(RC({id:'h-dawang',type:'oolong',amountGrams:23,isFavorite:true})===false, 'H2 the Dawang case: fav, 23g @ 5g dose = 4.6 cups (few) → NOT on the card');
ok(ctx.stockTier({id:'h-dawang',amountGrams:23})==='few', 'H3 …while the shelf still says few for that same tea');
ok(RC({id:'h-plain',type:'oolong',amountGrams:9})===false, 'H4 low but neither favourite nor rebuy → out of scope');
ok(RC({id:'h-rebuy',type:'oolong',amountGrams:9,wouldRebuy:true})===true, 'H5 would-rebuy at low → on the card');
ok(RC({id:'h-plenty',type:'oolong',amountGrams:40,isFavorite:true})===false, 'H6 favourite with plenty → no nudge');
// h-out has no seeded session and no cost evidence — it is UNTRACKED, not finished (v3.40 rule),
// so it stays off the card even after v3.86 widened membership to low-or-empty.
ok(RC({id:'h-out',type:'oolong',amountGrams:0,isFavorite:true})===false, 'H7 bare-0g favourite is untracked (unknown ≠ empty) → no nudge');
seed([]);
console.log('  H v3.82 restock-card membership: 7 checks');

// ---- 9. v3.86 (#26) the 0g split: empty vs untracked, and empty joins the card ----
seed([dose('i-fin-s',5)]);
const iUnk={id:'i-unk',type:'green',amountGrams:0};
ok(ctx.stockTier(iUnk)==='untracked', 'I1 bare 0g, no evidence → tier untracked');
ok(S(iUnk).text==='quantity not tracked' && S(iUnk).tone==='untracked', 'I2 untracked statusLine: exact string, no gram prefix');
ok(!/plenty|fresh|empty|0g/.test(S(iUnk).text), 'I3 untracked never reads plenty/fresh/empty/0g (the "0g · fresh, plenty" bug)');
const iCost={id:'i-cost',type:'oolong',amountGrams:0,costOriginalGrams:50};
ok(ctx.stockTier(iCost)==='empty', 'I4 0g + purchase evidence → tier empty');
ok(S(iCost).text==='empty' && S(iCost).tone==='empty', 'I5 empty statusLine: the one word, no gram prefix');
ok(ctx.stockTier({id:'i-fin-s',type:'black',amountGrams:0})==='empty', 'I6 0g + a gramsUsed session → empty (usage is evidence too)');
ok(RC(Object.assign({},iCost,{isFavorite:true}))===true, 'I7 empty favourite → on the card (#26 B)');
ok(RC(Object.assign({},iCost,{wouldRebuy:true}))===true, 'I8 empty would-rebuy → on the card');
ok(RC(iCost)===false, 'I9 empty but neither favourite nor rebuy → off (scope unchanged)');
ok(RC(Object.assign({},iUnk,{isFavorite:true}))===false, 'I10 untracked favourite → off (unknown ≠ empty, by construction)');
ok(ctx.isRunningLow(iCost)===false, 'I11 empty is not "running low" — Low chip/float stay tier-low only');
ok(vm.runInContext('STATUS_TONE_COLOR.empty',ctx)==='var(--ink-soft)' && vm.runInContext('STATUS_TONE_COLOR.untracked',ctx)==='var(--ink-soft)', 'I12 both new tones are ink-soft (information, not urgency)');
seed([]);
console.log('  I v3.86 empty/untracked split: 12 checks');

if(failures){ console.log('\n'+failures+' STATUS-LINE TEST(S) FAILED'); process.exit(1); }
console.log('\nALL STATUS-LINE TESTS PASSED  ('+passed+' passed)');
