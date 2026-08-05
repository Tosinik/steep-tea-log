/* PERMANENT validation — #10 Focus and the steeping surface it shares (committed; every deploy).
 *
 * THE MOST IMPORTANT ASSERTION HERE IS SECTION D, and it is not about Focus at all.
 *
 * Focus and every non-Focus steeping state are the SAME shipped function: sessionSteepingHTML()
 * renders the steep list, the timer, the per-steep feedback and the cold-brew handling, and
 * sessionFocusHTML() is the immersive overlay on top of it. R53 accepted the states this board does
 * not draw as round-1 — so restyling Focus must not quietly edit them. Section D pins each of those
 * states against shipped output. A slice that "improved" a state nobody drew would be building past
 * a ruling, and the diff would look like an improvement.
 *
 * R94 · Kachi-iro is the Focus ring and NOWHERE ELSE — visual contract 4, "one surface total". It
 *   shipped unimplemented for the whole round: the ring was #E3A15C amber and no token existed, while
 *   two comments in the repo already deferred to it as if it did. The scarcity is the mechanism; an
 *   accent on two surfaces is a colour, not a signal. Section B asserts the confinement, which is the
 *   part that decays silently — nothing breaks if kachi leaks onto a second selector.
 * R95 · #10's "BUILD FIRST" stamp and its live-bug headline are expired: the write shipped in v3.92
 *   (d_nudgeNextSteep → steeps[last].feedback, gated by steepFbActive). Section C asserts the write
 *   still ships and the gate is unchanged — this slice is a restyle and must not touch either.
 *
 * Run: node fixtures/focus-test.js   (exit non-zero on any failure)
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
ctx.render=()=>{}; ctx.showToast=()=>{};
const S = vm.runInContext('state', ctx);

let passed=0, failures=0;
const ok=(c,m)=>{ if(c){passed++;} else {failures++; console.log('  FAIL: '+m);} };
const css = fs.readFileSync(path.join(repo,'styles.css'),'utf8');
const sessSrc = fs.readFileSync(path.join(repo,'steep-sessions.js'),'utf8');
// R73: split on /\r?\n/ before any line-based scan — the working copy carries \r under autocrlf.
const cssLines = css.split(/\r?\n/);

const draft = (over) => Object.assign({
  teaId:'t1', vesselId:'v1', isColdBrew:false, brewStyle:'gongfu', gramsUsed:5, waterMl:'',
  sessionDate:'2026-08-05T09:00', steeps:[], infusionCount:1, stage:'steeping', schedule:null,
  timeShift:0, brewMode:'guide', advice:null, feedback:null, mood:null, curTemp:'', curTime:'',
  curSteepTags:[], curSteepDesc:'', sessionTags:[], sessionRating:0, sessionDesc:'', isShared:false,
  activeSteep:null, focusMode:false, timer:{mode:'timer',target:25,elapsed:0,running:false,intervalId:null}
}, over||{});
const seed = () => {
  S.teas=[{id:'t1',name:'Dawang Feng Da Hong Pao',type:'oolong',amountGrams:20}];
  S.vessels=[{id:'v1',name:'Dragon Gaiwan',type:'Gaiwan',capacityMl:110},
             {id:'v2',name:'Hario Coldbrew',type:'Cold brew jar',capacityMl:750}];
  S.sessions=[];
};

/* ---- A. the token exists in BOTH theme blocks (R94) ---- */
const rootBlock = css.slice(css.indexOf(':root'), css.indexOf('html[data-theme="dark"]'));
const darkBlock = css.slice(css.indexOf('html[data-theme="dark"]'));
for(const t of ['--kachi','--kachi-ink','--kachi-soft','--kachi-line']){
  ok(new RegExp(t.replace(/-/g,'\\-')+'\\s*:').test(rootBlock), 'A1 '+t+' defined in :root');
  ok(new RegExp(t.replace(/-/g,'\\-')+'\\s*:').test(darkBlock), 'A2 '+t+' defined in the dark block');
}
console.log('  A kachi tokens in both themes: 8 checks');

/* ---- B. …and it is confined to the Focus ring (R94's whole point) ---- */
/* This is the assertion that decays silently: nothing breaks if kachi leaks onto a second selector,
   the accent just stops meaning anything. Allowed users are the ring's two selectors, the breathing
   glow that surrounds them, and .focus-screen's own scoped re-declaration (Focus is always dark, so
   it pins the dark lift locally instead of inheriting :root's light value). */
const ALLOWED = ['.focus-halo', '.focus-enso .enso-arc', '.focus-enso-breathe', '.focus-screen'];
const users = [];
cssLines.forEach((line,i)=>{
  if(!/var\(--kachi/.test(line)) return;
  if(/^\s*(\/\*|\*)/.test(line)) return;                 // the explanatory comments are not users
  const sel = (line.split('{')[0]||'').trim();
  if(!ALLOWED.some(a=>sel.indexOf(a)>=0)) users.push((i+1)+': '+sel);
});
ok(users.length===0, 'B1 kachi is used by the Focus ring only'+(users.length?' — leaked onto: '+users.join(' | '):''));
ok(/\.focus-enso \.enso-arc\{stroke:var\(--kachi\)/.test(css), 'B2 the ring arc is ON kachi (it was #E3A15C amber for the whole round)');
ok(!/\.focus-enso \.enso-arc\{stroke:#/.test(css), 'B3 …and not a hex at the render site (the v3.95 currency lesson)');
// The steeping screen keeps its shipped accents — the board paints them kachi, R53 froze that surface.
const steepChrome = css.slice(css.indexOf('.timer-box'), css.indexOf('.focus-screen'));
ok(!/var\(--kachi/.test(steepChrome), 'B4 the non-Focus steeping chrome carries NO kachi (R53 + contract 4)');
console.log('  B kachi confinement: 4 checks');

/* ---- C. the v3.92 write and its gate are untouched (R95) ---- */
ok(/last\.feedback = \(kind==='weak'\)/.test(sessSrc), 'C1 d_nudgeNextSteep still WRITES steeps[last].feedback');
ok(/function steepFbActive\(d\)\{[\s\S]{0,240}isColdBrew \|\| state\.settings\.brewAdvice===false/.test(sessSrc),
   'C2 …and steepFbActive still gates on cold brew + the brewAdvice opt-out');
seed();
const gongfu = draft({steeps:[{tempC:100,timeSeconds:45,tags:[],description:'',feedback:null}]});
ok(ctx.steepFbActive(gongfu)===true, 'C3 gongfu is in the gate');
ok(ctx.steepFbActive(draft({isColdBrew:true}))===false, 'C4 cold brew is not');
S.settings.brewAdvice=false;
ok(ctx.steepFbActive(gongfu)===false, 'C5 …and the brewAdvice opt-out still closes it');
S.settings.brewAdvice=true;
// The ✓ saved state is a READ. It appears only once a verdict exists, and never invents one.
S.sessionDraft = draft({schedule:{tempC:100,times:[45,30],form:'open'},steeps:[{tempC:100,timeSeconds:45,tags:[],description:'',feedback:null}]});
ok(!/✓ saved/.test(ctx.brewNudgeRowHTML(S.sessionDraft)), 'C6 no saved marker before a verdict is recorded');
S.sessionDraft.steeps[0].feedback='good';
ok(/✓ saved/.test(ctx.brewNudgeRowHTML(S.sessionDraft)), 'C7 …and one appears once it is');
console.log('  C the write + its gate: 7 checks');

/* ---- D. R53's guarantee: every non-Focus steeping state renders unchanged ---- */
/* The states #10 does not draw. Each must still render, still carry its shipped affordances, and
   still differ from the others in the ways it did before. This is what stops a Focus restyle from
   quietly becoming a steeping-screen redesign. */
seed();
const states = {
  'no steeps yet':        draft({steeps:[]}),
  'mid-session gongfu':   draft({steeps:[{tempC:100,timeSeconds:45,tags:['floral'],description:'n',feedback:'good'}], schedule:{tempC:100,times:[45,30],form:'open'}}),
  'stopwatch mode':       draft({timer:{mode:'stopwatch',target:25,elapsed:12,running:true,intervalId:null}}),
  'cold brew':            draft({isColdBrew:true, vesselId:'v2', brewStyle:null}),
  'advice off':           draft({brewMode:'off', schedule:null}),
  'senchado':             draft({brewStyle:'senchado', vesselId:'v1'})
};
Object.entries(states).forEach(([name,d])=>{
  S.sessionDraft=d;
  let html=''; let threw=false;
  try{ html = ctx.sessionSteepingHTML(d); }catch(e){ threw=true; }
  ok(!threw && html.length>0, 'D1 "'+name+'" still renders');
  ok(/timer-box/.test(html), 'D2 "'+name+'" keeps the timer');
  ok(/saveSteepAndContinue/.test(html) && /finishSteeping/.test(html), 'D3 "'+name+'" keeps both commit actions');
  // No kachi may reach any steeping state's markup — the accent belongs to the immersive overlay.
  ok(!/--kachi|kachi/i.test(html), 'D4 "'+name+'" carries no kachi');
});
// Cold brew specifically must keep its shipped exclusion from the per-steep feedback cards.
S.sessionDraft = states['cold brew'];
ok(ctx.steepFbActive(states['cold brew'])===false, 'D5 cold brew still shows no per-steep feedback cards');
console.log('  D R53: non-Focus states unchanged: 25 checks');

/* ---- E. the timer is TWO MODES plus ONE ACTION (not three peers) ---- */
seed();
S.sessionDraft = draft({timer:{mode:'timer',target:25,elapsed:0,running:false,intervalId:null}});
const timerHtml = ctx.sessionSteepingHTML(S.sessionDraft);
ok(/setTimerMode\('timer'\)/.test(timerHtml) && /setTimerMode\('stopwatch'\)/.test(timerHtml), 'E1 both MODES render');
ok(!/useTimerValue\(\)/.test(timerHtml), 'E2 "Use time" is absent in countdown mode — it is an action, not a third mode');
S.sessionDraft = draft({timer:{mode:'stopwatch',target:25,elapsed:12,running:false,intervalId:null}});
ok(/useTimerValue\(\)/.test(ctx.sessionSteepingHTML(S.sessionDraft)), 'E3 …and present in stopwatch mode');
console.log('  E timer shape: 3 checks');

/* ---- F. R44 + the always-dark rule, verified and left alone ---- */
seed();
S.sessionDraft = draft({focusMode:true, schedule:{tempC:100,times:[45],form:'open'}});
const focusHtml = ctx.sessionFocusHTML(S.sessionDraft);
ok(!/avatar/i.test(focusHtml), 'F1 no avatar on Focus (R44: tab-level screens only)');
ok(/#100F0B/.test(css), 'F2 Focus keeps its own dark field, independent of theme');
ok(/--kachi:#7FA6C4/.test(css.slice(css.indexOf('.focus-screen'))), 'F3 …so it pins kachi\'s DARK lift locally rather than inheriting the light value');
console.log('  F R44 + always-dark: 3 checks');

/* ---- G. the context line is generated, and omits per part (R68) ---- */
seed();
ok(ctx.steepContextHTML(draft({vesselId:null, schedule:null, curTemp:''}))==='', 'G1 nothing known → no line at all');
const full = ctx.steepContextHTML(draft({curTemp:'95', schedule:{tempC:100,times:[25],form:'open'}}));
ok(/95/.test(full) && /guide 25s/.test(full) && /Dragon Gaiwan/.test(full), 'G2 all three parts when all three are known');
const noVessel = ctx.steepContextHTML(draft({vesselId:null, curTemp:'95', schedule:{tempC:100,times:[25],form:'open'}}));
ok(!/Dragon Gaiwan/.test(noVessel) && /95/.test(noVessel), 'G3 a missing part is omitted, not rendered empty');
/* Scanned on CODE ONLY. A whole-file scan matches the comment above steepContextHTML that QUOTES the
   board's example line — the third time this round a guard has fired on its own explanation (slice
   B2's Import-backup check, slice C's mood-figure check). `[\s\S]` not `.`, because a block comment
   spans lines and `.` does not cross a terminator (R73, from the other side). */
const sessCode = sessSrc.replace(/\/\*[\s\S]*?\*\//g,' ').split(/\r?\n/).filter(l=>!/^\s*\/\//.test(l)).join('\n');
ok(!/95°C · guide 25s · Dragon Gaiwan/.test(sessCode), 'G4 the board\'s example line is not hard-coded as copy');
console.log('  G generated context: 4 checks');

console.log(failures ? '\n'+failures+' FOCUS TEST(S) FAILED' : '\nALL FOCUS TESTS PASSED ('+passed+' passed)');
process.exit(failures?1:0);
