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
// steep-tea-types.js joins the bundle in v3.98: statusLine → freshnessReading → ttFreshness → the
// catalog. The shelf's status line now depends on catalog data, which is the point of the model.
const src=['steep-knowledge.js','steep-tea-types.js','steep-core.js','steep-teas.js'].map(f=>fs.readFileSync(path.join(repo,f),'utf8')).join('\n;\n');
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

/* ---- A. the three-rung window cascade (v3.98, R85) — REWRITTEN, not patched ----
   This section used to pin statusCategory's type→ages|delicate|neutral map. That function is RETIRED:
   it was a second type→class writer beside freshnessClass, and both are subsumed by catalog data
   reached through slug → family → teas.type. What is pinned now is the cascade itself, because rung 3
   is the whole reason the model doesn't regress: at 21 teas the catalog covers 13, and slug→family
   alone would have taken a working freshness reading away from four teas on the most-seen surface. */
ok(typeof ctx.statusCategory==='undefined', 'A1 statusCategory is gone, not dormant (no second type→class writer)');
ok(typeof ctx.freshnessClass==='undefined', 'A1b freshnessClass is gone too — same reason');
ok(typeof ctx.FRESH_WINDOW_MONTHS==='undefined' && typeof ctx.FRESH_NEAR_WEEKS==='undefined',
   'A1c the two global window constants are gone — one window for every tea is what the model replaces');
const fr = t => ctx.ttFreshness(t);
ok(fr({name:'Shincha Saemidori Kagoshima',type:'green'}).rung==='slug', 'A2 a covered tea with a slug override grounds at rung 1 (slug)');
ok(fr({name:'Dawang Feng Da Hong Pao',type:'oolong'}).rung==='family', 'A3 a covered tea with no slug override grounds at rung 2 (family)');
ok(fr({name:'A Tea Nobody Curated 12345',type:'green'}).rung==='type', 'A4 an UNCOVERED tea still grounds at rung 3 (teas.type) — the anti-regression rung');
ok(fr({name:'Fei Bing Beeng Cha',type:'puerh'}).ageing===true,
   'A5 the shelf\'s only pu-erh has no catalog row, so ageing reaches it only through teas.type→dark (R85)');
ok(fr({name:'x',type:'not-a-type'})===null, 'A6 an unknown type grounds nothing — no window is invented');
// The R85 constant is the ONE place the two vocabularies meet. Inlining the mapping elsewhere is the
// drift it exists to prevent, so assert it stays a named constant and stays correct.
// A top-level `const` stays in the vm script's lexical scope — only function declarations become
// sandbox properties — so the constant is read through the context, as the other suites do.
const TYPE_MAP = vm.runInContext('TT_TYPE_TO_FAMILY', ctx);
ok(TYPE_MAP && TYPE_MAP.puerh==='dark', 'A7 TT_TYPE_TO_FAMILY maps puerh→dark by name (§7.2)');
ok(Object.keys(TYPE_MAP).length===6, 'A8 …and covers all six teas.type values');
const ttSrc = fs.readFileSync(path.join(repo,'steep-teas.js'),'utf8').split(/\r?\n/)
  .filter(l=>!/^\s*(\/\/|\*|\/\*)/.test(l)).join('\n');
ok(!/['"]puerh['"]\s*:\s*['"]dark['"]/.test(ttSrc), 'A9 the puerh→dark mapping is not inlined a second time in steep-teas.js');
console.log('  A window cascade (R85): 10 checks');

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
// C6 v3.98: a green with no harvest and no opened date has NO CLOCK, so the shelf falls through to
// the plain quantity tone. It used to read "fresh, plenty" — an affirmation the app could not ground,
// which is exactly what the two-key rule removes. "30g · plenty" is a stock statement, not a
// freshness claim, and that is what keeps never-guess intact on a surface that cannot be blank.
ok(S({type:'green',amountGrams:30}).tone==='plenty' && /· plenty$/.test(S({type:'green',amountGrams:30}).text), 'C6 stocked green, no clock → plain quantity tone, no freshness claim');
console.log('  C tone rules (synthetic): 6 checks');

/* ---- C2. the shelf is TWO-KEY (§2) ---- */
const clockNoWindow = {name:'A Tea Nobody Curated 12345',type:'not-a-type',amountGrams:30,harvestYear:String(new Date().getFullYear()-1),harvestSeason:'spring'};
ok(ctx.freshnessReading(clockNoWindow) && ctx.freshnessReading(clockNoWindow).grounded===false,
   'C7 clock without window → a reading that knows it is ungrounded');
ok(S(clockNoWindow).tone==='plenty', 'C8 …and the SHELF falls through to quantity, never an empty slot (WS5)');
ok(ctx.freshnessCueHTML(clockNoWindow)!=='', 'C9 …while DETAIL still shows the elapsed-only rung — a date fact, not a freshness claim');
const noClock = {name:'Dawang Feng Da Hong Pao',type:'oolong',amountGrams:30};
ok(ctx.freshnessReading(noClock)===null, 'C10 window without clock → no reading at all');
ok(ctx.freshnessCueHTML(noClock)==='', 'C11 …and detail renders NO BLOCK — absent, not a zero');
console.log('  C2 two-key shelf: 5 checks');

/* ---- D. the graded ladder (§2) — REWRITTEN to the opened-vs-sealed model ----
   The old section pinned one global 12-month window and a 26-week countdown threshold for every tea.
   Both are retired. What is pinned now is the ladder's SHAPE, which is what the model actually
   promises: measured beats estimated, an estimate says it is one, and the countdown stays relative to
   the tea's own window rather than to a constant. Dates are relative to now, so nothing goes stale. */
const now=new Date();
const daysAgo = n => { const d=new Date(now); d.setDate(d.getDate()-n); return d.toISOString().slice(0,10); };
// Rung 1 — measured. A sencha opened 5 weeks ago is past its ~45-day opened window.
const openedSencha={name:'Sencha Kagoshima Premium',type:'green',amountGrams:30,openedDate:daysAgo(35)};
const r1=ctx.freshnessReading(openedSencha);
ok(r1 && r1.measured===true && r1.grounded===true, 'D1 opened_date → a measured, grounded reading');
ok(r1.totalDays===45, 'D2 …against the OPENED window (45d for sencha), not the sealed one');
ok(!/assumes sealed/.test(ctx.freshnessCueHTML(openedSencha)), 'D3 …and a measured reading carries no sealed-assumption hedge');
// Rung 2 — estimated from harvest. Same tea, no opened date: the sealed window applies, hedged.
const sealedSencha={name:'Sencha Kagoshima Premium',type:'green',amountGrams:30,harvestYear:String(now.getFullYear()),harvestSeason:'spring'};
const r2=ctx.freshnessReading(sealedSencha);
ok(r2 && r2.measured===false && r2.totalDays===270, 'D4 harvest only → the SEALED window (270d)');
ok(/assumes sealed until opened/.test(ctx.freshnessCueHTML(sealedSencha)), 'D5 …and says so, rather than passing an estimate off as measured');
// Measured beats estimated when both exist — the ladder is ordered, not merged.
const both=Object.assign({},sealedSencha,{openedDate:daysAgo(35)});
ok(ctx.freshnessReading(both).measured===true && ctx.freshnessReading(both).totalDays===45,
   'D6 with both, the measured clock wins outright');
// The countdown is WINDOW-RELATIVE, not a global threshold: past halfway it speaks, before that it doesn't.
const fresh=Object.assign({},sealedSencha,{harvestYear:String(now.getFullYear()),harvestSeason:'spring',openedDate:daysAgo(3)});
ok(S(fresh).tone==='plenty', 'D7 a just-opened tea reads as stock — a calm app does not count down from far');
const late=Object.assign({},sealedSencha,{openedDate:daysAgo(40)});
ok(S(late).tone==='freshness', 'D8 …and speaks up once past the halfway mark of its OWN window');
// Ageing reads as history: no countdown, no urgency, on either surface.
const aged={name:'Fei Bing Beeng Cha',type:'puerh',amountGrams:96,harvestYear:'2016'};
ok(ctx.freshnessReading(aged).ageing===true && ctx.freshnessReading(aged).leftDays===undefined,
   'D9 an ageing tea has no countdown at all');
ok(/deepens with age/.test(ctx.freshnessCueHTML(aged)) && !/best (within|enjoyed)/.test(ctx.freshnessCueHTML(aged)),
   'D10 …and detail frames it as a record, never an alarm');
// Seeds render soft (§3): guidance disagrees by up to ~2x, so no exact day count reaches the UI.
const allCopy = [openedSencha,sealedSencha,late,aged].map(t=>ctx.freshnessCueHTML(t)+' '+S(t).text).join(' ');
ok(!/\b\d{2,3} days?\b/.test(allCopy), 'D11 no reading renders a raw day count — "~5 wks", never "35 days"');
console.log('  D graded ladder: 11 checks');

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
  /* E4 v3.98: the tone used to be checked against statusCategory, which is retired. It is now checked
     against the READING, which is the single writer — the point being that no surface may reach a tone
     the engine did not ground. Ungrounded must be quantity-only; grounded-and-ageing must be 'ages';
     grounded-with-a-window may be plenty or a countdown depending on where in its own window it sits. */
  teas.filter(t=>Number(t.amountGrams)>0 && !ctx.isRunningLow(t) && ctx.stockTier(t)!=='few').forEach(t=>{
    const w=ctx.ttFreshness(t), r=ctx.freshnessReading(t), tone=S(t).tone;
    // Ageing is read from the WINDOW (no clock required — "ages well" is about the leaf); the
    // countdown is read from the READING (two-key). The assertion mirrors that split deliberately.
    const okTone = (w && w.ageing) ? tone==='ages'
      : (!r || !r.grounded) ? tone==='plenty'
      : (tone==='plenty'||tone==='freshness');
    ok(okTone, 'E4 '+t.name+' ('+t.type+') → tone '+tone+' disagrees with window '+JSON.stringify(w&&{a:w.ageing,r:w.rung})+' / reading '+JSON.stringify(r&&{g:r.grounded}));
  });
  /* E5 REPLACED. It pinned "whites read ages well", which was true only because statusCategory keyed
     ageing on teas.type. Ageing is catalog data now (R86), so what matters is that the two surfaces
     AGREE: a tea the engine calls ageing says so on the shelf and on detail, and one it doesn't,
     doesn't. Two clocks disagreeing about one tea is the bug class this whole slice closes. */
  teas.filter(t=>Number(t.amountGrams)>0).forEach(t=>{
    const w=ctx.ttFreshness(t), r=ctx.freshnessReading(t);
    const shelfAges=/ages (well|gracefully)$/.test(S(t).text), detailAges=/deepens with age/.test(ctx.freshnessCueHTML(t));
    const ageing = !!(w && w.ageing);
    // Detail needs a clock to say anything at all, so it only claims ageing when one exists; the
    // shelf claims it whenever the window does, unless quantity has outranked it (#18 precedence).
    const shelfOk = ageing ? (shelfAges || ctx.stockTier(t)!=='plenty') : !shelfAges;
    const detailOk = (ageing && r) ? detailAges : !detailAges;
    ok(shelfOk && detailOk, 'E5 '+t.name+' — shelf/detail disagree on ageing (window says '+ageing+', clock '+(r?'yes':'no')+')');
  });
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
