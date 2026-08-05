/* PERMANENT validation — #12 Quick log, the retrospective twin (committed; every deploy).
 *
 * Slice C built this against three board claims that were FALSE at HEAD, so what it guards is the
 * decisions taken instead — a suite pinned to the board here would pin the errors:
 *
 *  R87 · The bottom-nav Log button opens SETUP, not quick log. #12 rev 1 asserts, "as checked", that
 *        both the nav and the in-setup shortcut reach quick log. They don't: quickLogSession →
 *        startSessionFor(null) → stage:'setup', and beginQuickLog() is the only path to 'quick'.
 *        The nav's destination stays setup — the prospective posture is the recoverable one, since
 *        setup reaches quick log in one more tap while quick log cannot reach the timer at all.
 *  R88 · Quick log gains both pickers and CARRIES THE TEA FORWARD. "Starts empty and asks" is not
 *        built: under R87 you arrive from setup, where a tea was chosen one tap earlier, so an empty
 *        start would discard a live choice. Vessel stays optional and never blocks the log (R43).
 *  R89 · The #14 custom listbox is deferred — the <select> mechanics are shared with setup, one
 *        vocabulary across the twins.
 *
 * The other invariant here is the DATE POSTURE: one field (sessionDate), two placements. Folded on
 * setup because a live cup is "now"; promoted here because a retrospective cup's date needs saying.
 * Both screens must write the same field, or the two postures become two records.
 *
 * Run: node fixtures/quick-log-test.js   (exit non-zero on any failure)
 */
const fs=require('fs'), path=require('path'), vm=require('vm');
const repo=path.join(__dirname,'..');
const SRC=['steep-knowledge.js','steep-tea-types.js','steep-core.js','steep-dashboard.js','steep-teas.js','steep-reference.js','steep-sessions.js']
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
/* AFTER the load, not before: function declarations in the bundle become sandbox properties and
   would overwrite a stub set earlier. This suite drives real state transitions (startSessionFor,
   beginQuickLog), so render() actually fires and reaches for #app, which does not exist here. */
ctx.render=()=>{}; ctx.showToast=()=>{};
const G = expr => vm.runInContext(expr, ctx);
const S = G('state');

let passed=0, failures=0;
const ok=(c,m)=>{ if(c){passed++;} else {failures++; console.log('  FAIL: '+m);} };
const sessSrc = fs.readFileSync(path.join(repo,'steep-sessions.js'),'utf8');
const coreSrc = fs.readFileSync(path.join(repo,'steep-core.js'),'utf8');

const seed = () => {
  S.teas=[{id:'t1',name:'Dawang Feng Da Hong Pao',type:'oolong',amountGrams:20},
          {id:'t2',name:'Sencha Kagoshima Premium',type:'green',amountGrams:8},
          {id:'t3',name:'Drained',type:'green',amountGrams:0,costOriginalGrams:50}];
  S.vessels=[{id:'v1',name:'Dragon Gaiwan',type:'Gaiwan',capacityMl:110},
             {id:'v2',name:'Main Kyusu',type:'Kyusu',capacityMl:210}];
  S.sessions=[]; S.sessionDraft=null;
};

/* ---- A. R87: the nav's destination is setup, and quick log is reached from it ---- */
seed();
ctx.startSessionFor(null);
ok(S.sessionDraft && S.sessionDraft.stage==='setup', 'A1 startSessionFor(null) lands on SETUP, not quick (the nav Log path)');
ok(/beginQuickLog/.test(sessSrc), 'A2 beginQuickLog exists as the in-setup shortcut (R5)');
// The nav button must not be re-pointed without a ruling that argues the posture on its own merits.
ok(/quickLogSession\(/.test(coreSrc) && !/beginQuickLog\(/.test(coreSrc),
   'A3 the bottom nav calls quickLogSession, never beginQuickLog directly (R87)');
ctx.beginQuickLog();
ok(S.sessionDraft.stage==='quick', 'A4 beginQuickLog is the path to stage:quick');
ok(Array.isArray(S.sessionDraft.steeps) && S.sessionDraft.steeps.length===0, 'A5 quick log carries no timed steeps');
console.log('  A R87 entry points: 5 checks');

/* ---- B. R88: the tea carries forward; the vessel is optional ---- */
seed();
ctx.startSessionFor('t2');                 // setup launched from a chosen tea
ctx.beginQuickLog();
ok(S.sessionDraft.teaId==='t2', 'B1 entering quick log from setup PRESERVES the chosen tea (R88 carry-forward)');
// The regression this guards: reverting to "the first in-stock tea" would silently swap the record.
ok(S.sessionDraft.teaId!==S.teas[0].id || 't2'===S.teas[0].id, 'B2 …it does not revert to the first in-stock tea');
const quickHTML = ctx.sessionQuickHTML(S.sessionDraft);
ok(/onchange="d_setTea\(/.test(quickHTML), 'B3 quick log renders a TEA picker (it had none at all before)');
ok(/onchange="d_setVessel\(/.test(quickHTML), 'B4 …and a VESSEL picker (R43)');
ok(/<option value="" [^>]*>Which vessel\? \(optional\)/.test(quickHTML), 'B5 the vessel picker offers a real empty choice — optional means selectable-as-none');
ctx.d_setVessel('');
ok(S.sessionDraft.vesselId==='' && S.sessionDraft.brewStyle===null, 'B6 choosing no vessel is safe (no prefill, no throw)');
ok(/Save cup/.test(ctx.sessionQuickHTML(S.sessionDraft)), 'B7 …and never blocks the save (R43: optional, never blocking)');
// A tea, though, IS the record. No tea → no save.
S.sessionDraft.teaId='';
ok(/disabled/.test(ctx.sessionQuickHTML(S.sessionDraft)), 'B8 with no tea the save is disabled — a cup with no tea is not a record');
console.log('  B R88 pickers + carry-forward: 8 checks');

/* ---- C. R89: one vocabulary, not a second control ---- */
seed(); ctx.startSessionFor('t1');
const setupHTML = ctx.sessionSetupHTML(S.sessionDraft);
ctx.beginQuickLog();
const qh = ctx.sessionQuickHTML(S.sessionDraft);
ok(/class="trio-select/.test(setupHTML) && /class="trio-select/.test(qh), 'C1 both twins use the same trio-select mechanics');
ok(/<optgroup label=/.test(qh), 'C2 quick log groups teas by type, as setup does');
ok(!/listbox|role="combobox"/.test(qh), 'C3 no custom listbox — #14 stays deferred (R89)');
// The long-press colour correction cannot ship: no per-tea colour column (R78), no palette (R82).
ok(!/longpress|long-press|setTeaColor|liquorColor/i.test(sessSrc), 'C4 no long-press colour correction reached the pickers (R78/R82)');
console.log('  C R89 shared vocabulary: 4 checks');

/* ---- D. the date posture: ONE field, two placements ---- */
seed(); ctx.startSessionFor('t1');
const setupWhen = ctx.sessionSetupHTML(S.sessionDraft);
ok(!/class="when-chips"/.test(setupWhen), 'D1 setup does NOT promote the date — a live cup is "now"');
ok(!/d_set\('sessionDate'/.test(setupWhen), 'D2 …and with the fold closed the field is not even rendered — that IS the folding');
S.sessionDraft.showMoreDetails=true;
ok(/d_set\('sessionDate'/.test(ctx.sessionSetupHTML(S.sessionDraft)),
   'D2b …but it is there behind More details, already shipped (slice C finding F5: #04\'s half of the inversion needed no work)');
S.sessionDraft.showMoreDetails=false;
ctx.beginQuickLog();
const quickWhen = ctx.sessionQuickHTML(S.sessionDraft);
ok(/class="when-chips"/.test(quickWhen), 'D3 quick log PROMOTES it — a retrospective cup needs its date said');
ok(/d_set\('sessionDate'|d_setWhenChip\(/.test(quickWhen), 'D4 …writing the same sessionDate field, not a second one');
// The chips are derived from the date, so a typed date lights the right chip — two sources cannot disagree.
ctx.d_setWhenChip('yesterday');
ok(ctx.quickWhenActive(S.sessionDraft)==='yesterday', 'D5 the active chip is DERIVED from sessionDate, not stored beside it');
const y=new Date(); y.setDate(y.getDate()-1);
ok(S.sessionDraft.sessionDate.slice(0,10)===ctx.toLocalDatetimeValue(y).slice(0,10), 'D6 "Yesterday" actually moves the date back a day');
ctx.d_setWhenChip('now');
ok(ctx.quickWhenActive(S.sessionDraft)==='now', 'D7 …and "Just now" returns to today');
// An arbitrary typed date belongs to no chip, and must say so rather than lighting the nearest one.
S.sessionDraft.whenPick=null; S.sessionDraft.sessionDate='2026-01-05T11:30';
ok(ctx.quickWhenActive(S.sessionDraft)==='pick', 'D8 a date matching no chip reads as "Pick a date", never the nearest chip');
console.log('  D date posture: 9 checks');

/* ---- E. the schedule strip names its derivation, generated (R68) ---- */
seed(); ctx.startSessionFor('t1');
const stripOff = (()=>{ S.sessionDraft.brewMode='off'; return ctx.brewGuidePreviewHTML(S.sessionDraft); })();
ok(!/sched-derivation/.test(stripOff), 'E1 with the strip off nothing is derived, so no derivation line');
S.sessionDraft.brewMode='guide';
const stripOn = ctx.brewGuidePreviewHTML(S.sessionDraft);
// Only stages that ACTUALLY fired may appear — a static string would claim a ratio scaling that
// never happened, which is the R68 shape.
if(/sched-derivation/.test(stripOn)){
  const line=/sched-derivation">([^<]*)</.exec(stripOn)[1];
  ok(!/ratio-scaled/.test(line), 'E2 no ratio stage is claimed when the ratio did not apply');
  ok(!/your tuning/.test(line), 'E3 no tuning stage is claimed in guide mode');
}else{
  ok(true,'E2 single-stage derivation renders no chain (nothing to show)'); ok(true,'E3 —');
}
ok(!/derived: brew guide → ratio-scaled → feedback-learned/.test(sessSrc),
   'E4 the board\'s example chain is not hard-coded as copy');
console.log('  E schedule derivation: 4 checks');

/* ---- F. the mood pill is computed, never the board's stamped 48% (15/31) ---- */
/* F1 scans CODE LINES ONLY. The first draft scanned the whole file and failed on this suite's own
   sibling comment explaining what the stamped figure was — a guard firing on its own explanation,
   the same shape as slice B2's Import-backup check. Assert the symbol, never the prose. */
/* A real stripper, not a line filter. The line-filter version dropped `/*` and `*`-prefixed lines
   but kept an unprefixed CONTINUATION line inside a block comment — so it still matched the prose
   two lines below the opening. `[\s\S]` rather than `.` because a block comment spans lines and `.`
   does not cross a terminator (R73, from the other direction). */
const stripComments = s => s.replace(/\/\*[\s\S]*?\*\//g,' ').split(/\r?\n/).filter(l=>!/^\s*\/\//.test(l)).join('\n');
const sessCode = stripComments(sessSrc);
ok(!/48%|15\/31/.test(sessCode), 'F1 the board\'s stamped mood figure is not transcribed into any rendered string');
seed();
ok(ctx.moodUptakeHTML()==='', 'F2 with no sessions the pill is absent — a percentage of nothing says less than silence');
S.sessions=Array.from({length:12},(_,i)=>({id:'s'+i,teaId:'t1',mood:i<5?'steady':null}));
const pill=ctx.moodUptakeHTML();
ok(/5 of your 12/.test(pill), 'F3 …and with real sessions it counts THEM (got: '+pill.replace(/<[^>]*>/g,'')+')');
S.sessions=S.sessions.map(s=>({...s,mood:null}));
ok(ctx.moodUptakeHTML()==='', 'F4 nobody has used it yet → silence, not "0 of 12"');
console.log('  F mood uptake: 4 checks');

/* ---- G. R72 untouched: setup is still a DRAFT surface ---- */
seed(); ctx.startSessionFor('t1');
ok(/resolve:true/.test(sessSrc), 'G1 setup still passes resolve:true — the lit lane is what commitSession will store');
ok(/resolve:false/.test(sessSrc), 'G2 …and the edit surface still passes resolve:false (the record contract)');
ok(ctx.draftFingerprint(S.sessionDraft).split('|').length>=10, 'G3 draftFingerprint still guards every field it did (F4 mis-tap protection)');
ok(/d\.sessionDate/.test(/function draftFingerprint[\s\S]*?\n}/.exec(sessSrc)[0]), 'G4 …including sessionDate, which slice C made user-visible on #12');
console.log('  G R72 + draft guard: 4 checks');

/* ---- H. R91: brew-again carries the vessel always, the method only when STORED ----
   This file owns the startSessionFor entry points, so the carry belongs here. The failure it guards
   is subtle and would look correct in passing: brew-again from a null-brew_style session must not
   turn the capacity heuristic into a stored record on the next save — R64's laundering, arriving
   through a door nobody was watching. The distinction that makes it testable: the v3.91 vessel-TYPE
   prefill may still apply (it is the same thing choosing that vessel by hand does), but brewMethodFor's
   capacity inference may not. Travel cuppa separates them — typed Porcelain teapot so the prefill map
   misses it, 115 ml so the capacity heuristic says gongfu. */
seed();
S.vessels.push({id:'v3',name:'Travel cuppa',type:'Porcelain teapot',capacityMl:115});
const nullSrc = {id:'x1',teaId:'t1',vesselId:'v3',brewStyle:null,gramsUsed:3,steeps:[]};
const storedSrc = {id:'x2',teaId:'t1',vesselId:'v2',brewStyle:'senchado',gramsUsed:4,steeps:[]};
S.sessions=[nullSrc,storedSrc];
ok(ctx.brewMethodFor(null,115)==='gongfu', 'H1 the capacity heuristic WOULD say gongfu for this vessel — the trap is real');
ok(ctx.methodPrefillFor('v3')===null, 'H2 …while the vessel-type prefill has no opinion about it');
ctx.brewAgain('x1');
ok(S.sessionDraft.vesselId==='v3', 'H3 brew-again carries the vessel always');
ok(S.sessionDraft.brewStyle===null, 'H4 …and carries NO method from a null session — the inference is not laundered');
ctx.cancelSession();
ctx.brewAgain('x2');
ok(S.sessionDraft.brewStyle==='senchado', 'H5 a STORED method does carry forward');
ctx.cancelSession();
// Copy-to-new carries the same, plus leaf/water, and writes nothing until the user commits.
const before = S.sessions.length;
ctx.copySessionToNew('x1');
ok(S.sessionDraft.gramsUsed===3 && S.sessionDraft.stage==='setup', 'H6 copy-to-new opens a prefilled DRAFT');
ok(S.sessions.length===before, 'H7 …and writes nothing — a copy is a starting point, never a silent duplicate');
ctx.cancelSession();
console.log('  H R91 brew-again carry: 7 checks');

console.log(failures ? '\n'+failures+' QUICK-LOG TEST(S) FAILED' : '\nALL QUICK-LOG TESTS PASSED ('+passed+' passed)');
process.exit(failures?1:0);
