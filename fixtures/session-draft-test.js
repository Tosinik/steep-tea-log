/* PERMANENT validation — v4.17 (#35 draft persistence + #34 back-gesture history) — committed.
 *
 * WHY COMMITTED: two cross-module invariants live here, both of which fail silently and both of which
 * a mechanical edit could reintroduce:
 *   1. R139 — the PERSISTED draft must NEVER carry an inline `data:` image. A multi-MB data URL beside
 *      the offline write queue risks a QuotaExceededError that breaks the QUEUE — a worse loss than
 *      the dropped sitting this feature exists to prevent. Same rule as the offline queue's own strip.
 *   2. #34's history fence — the live session flow (session/steeping/finish/quick) must NEVER be in
 *      `HISTORY_VIEWS`. popstate is not cancellable, so a session-flow view in that list would let the
 *      OS Back gesture drop the user INTO or resurrect a running steep. Absence is the safety.
 *
 * NON-AUTOMATABLE GATE (do not delete this note): no Node/vm suite can exercise `pushState`/`popstate`
 * or a real back gesture — the DOM History API isn't driven here. #34's back-gesture behaviour is
 * verified BY NIKLAS ON DEVICE before the slice ships (this slice's /slowcup-deploy step 7). Same
 * shape as landing-test.js asserting the door's SOURCE because renderLogin can't be sandboxed. What
 * this suite CAN guard is the two invariants above plus the single-writer/one-fence source facts.
 *
 * Run: node fixtures/session-draft-test.js   (exit non-zero on any failure)
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
const G=e=>vm.runInContext(e,ctx);
// comment-strip before every ABSENCE check — a negative check that reads prose is testing the prose.
// STRING-AWARE, deliberately: the naive /\/\*[\s\S]*?\*\//g the other suites use eats
// `accept="image/*"` — the /* inside a string opens a phantom block that swallows real code below it
// (found the hard way building this suite; it is this round's own how-it-is-written lesson, in a
// stripper). This walker respects '…' "…" `…` so a /* inside a string stays string.
function strip(src){
  let out='',i=0,q=null; const n=src.length;
  while(i<n){ const c=src[i],d=src[i+1];
    if(q){ out+=c; if(c==='\\'){ out+=(d==null?'':d); i+=2; continue; } if(c===q) q=null; i++; continue; }
    if(c==='"'||c==="'"||c==='`'){ q=c; out+=c; i++; continue; }
    if(c==='/'&&d==='*'){ i+=2; while(i<n&&!(src[i]==='*'&&src[i+1]==='/')) i++; i+=2; out+=' '; continue; }
    if(c==='/'&&d==='/'){ i+=2; while(i<n&&src[i]!=='\n') i++; out+=' '; continue; }
    out+=c; i++;
  }
  return out;
}
let passed=0, failures=0;
const ok=(c,m)=>{ if(c){passed++;} else {failures++; console.error('FAIL: '+m);} };

/* A sample steeping draft, shaped like the real one (steep-sessions.js:559). A live timer with an
   interval handle, one logged steep, and a _pristine snapshot. */
const draft = () => ({
  teaId:'t1', vesselId:'v1', sessionDate:'2026-08-17T09:00', isColdBrew:false, waterType:'', waterTDS:'',
  gramsUsed:5, brewStyle:'gongfu', waterMl:110, steeps:[{order:1,timeSeconds:30,tags:['floral']}],
  stage:'steeping', mood:'calm', sessionRating:0, sessionTags:[], _pristine:'x|y|z',
  timer:{mode:'timer', target:25, elapsed:12, running:true, intervalId:98765}
});

/* ---- A · draftForPersist — the R139 strip (the reason this suite is committed) ---- */
const IMG_DATA = 'data:image/jpeg;base64,'+'A'.repeat(4000);
ok(G('draftForPersist')(draft(), IMG_DATA).draftImage===null,
   'A1 an inline data: image is STRIPPED from the persisted payload (R139 — quota safety, must never reach localStorage beside the queue)');
ok(G('draftForPersist')(draft(), 'https://x/y.jpg').draftImage==='https://x/y.jpg',
   'A2 a non-data image URL is kept (defensive; a session draft never actually holds one, but the rule keys on data: not on presence)');
ok(G('draftForPersist')(draft(), null).draftImage===null, 'A3 a null image stays null');
{ const p=G('draftForPersist')(draft(), IMG_DATA);
  ok(p.draft.timer.intervalId===null && p.draft.timer.running===false,
   'A4 the live timer handle is nulled and the timer paused — a restored steep resumes STOPPED at its saved elapsed, never pretending to have counted while the app was gone');
  ok(p.draft.timer.elapsed===12, 'A5 …but the saved elapsed is preserved');
}
ok(G('draftForPersist')(null, IMG_DATA)===null, 'A6 a null draft returns null — which clears the persisted copy (saveDraft removes the key)');
/* the input draft is not mutated — the resolver clones (a restored-then-saved draft must not lose its live handle mid-session) */
{ const d=draft(); G('draftForPersist')(d, IMG_DATA); ok(d.timer.intervalId===98765 && d.timer.running===true,
   'A7 draftForPersist does NOT mutate the live draft it is handed — it clones (the running session keeps ticking)'); }
/* photoDropped — the flag that lets restore be HONEST: a null image at restore is otherwise ambiguous
   between "stripped for quota" and "never had one", and R139's notice must only fire for the former. */
ok(G('draftForPersist')(draft(), IMG_DATA).photoDropped===true, 'A8 photoDropped is true when a data: image was stripped — restore can say so');
ok(G('draftForPersist')(draft(), null).photoDropped===false, 'A9 …and false when there was no inline photo to drop — no false notice');

/* ---- B · the serialisation round-trip is faithful (what saveDraft→loadDraft actually do) ---- */
// saveDraft = setItem(JSON.stringify(draftForPersist(...))); loadDraft = JSON.parse(getItem()). So the
// fidelity IS this round-trip — asserted here without the DB layer (steep-data needs the Supabase global).
{ const round = JSON.parse(JSON.stringify(G('draftForPersist')(draft(), IMG_DATA)));
  ok(round.draft.steeps.length===1 && round.draft.steeps[0].tags[0]==='floral', 'B1 logged steeps survive the round-trip');
  ok(round.draft.stage==='steeping' && round.draft._pristine==='x|y|z', 'B2 stage and the _pristine dirty-snapshot survive — so the restored draft answers sessionDraftDirty correctly, no re-derivation');
  ok(round.draftImage===null, 'B3 …and the image is still gone after the round-trip');
}

/* ---- C · the dirty gate — only a DIRTY draft is ever persisted (steep-boot's hook) ---- */
G('state.sessions=[]; state.teas=[{id:"t1",name:"X",type:"green",amountGrams:20}]; state.vessels=[{id:"v1",name:"V",type:"Gaiwan",capacityMl:110}];');
ok(G('sessionDraftDirty')(null)===false, 'C1 no draft → not dirty → the hook clears the key');
{ const setup=draft(); setup.stage='setup'; setup._pristine=G('draftFingerprint')(setup);
  ok(G('sessionDraftDirty')(setup)===false, 'C2 a pristine SETUP draft is not dirty — an untouched setup screen does not get persisted');
  setup.gramsUsed=9;
  ok(G('sessionDraftDirty')(setup)===true, 'C3 …but an edited setup draft IS dirty and will persist'); }
ok(G('sessionDraftDirty')(draft())===true, 'C4 a steeping draft is always dirty — logged work always persists');

/* ---- D · #34 history fence — the live session flow must NOT be in HISTORY_VIEWS ---- */
const HV=G('HISTORY_VIEWS');
['session','steeping','finish','quick'].forEach(v=>ok(HV.indexOf(v)===-1,
   'D1 the session-flow view "'+v+'" is NOT in HISTORY_VIEWS — popstate is not cancellable, so Back can never resurrect a live steep (this absence is the safety)'));
['dashboard','insights','teas','sessions','tea-detail'].forEach(v=>ok(HV.indexOf(v)!==-1,
   'D2 the read surface "'+v+'" IS in HISTORY_VIEWS — Back steps off it instead of exiting the app'));

/* ---- E · single writer — saveView owns view history + the tea-detail deep-link ---- */
const teasSrc=strip(fs.readFileSync(path.join(repo,'steep-teas.js'),'utf8'));
ok(/function openTeaDetail\(/.test(teasSrc) && !/openTeaDetail[\s\S]{0,240}localStorage\.setItem\('tealog_view'/.test(teasSrc),
   'E1 openTeaDetail no longer hand-writes tealog_view — it calls saveView (the F24 two-writers-for-one-fact trap, closed)');
ok(/saveView\('tea-detail'\)/.test(teasSrc), 'E2 …openTeaDetail calls saveView(\'tea-detail\'), so history + deep-link have ONE writer');
const coreSrc=strip(fs.readFileSync(path.join(repo,'steep-core.js'),'utf8'));
ok(/function saveView\(v\)\{[\s\S]*?history\.pushState/.test(coreSrc), 'E3 saveView is where history.pushState lives');
ok(/tea-detail[\s\S]{0,120}state\.activeTeaId/.test(coreSrc), 'E4 saveView persists activeTeaId for the tea-detail deep-link');

/* ---- F · popstate honours the pop WITHOUT re-pushing (no goView → no Back loop) ---- */
const bootSrc=strip(fs.readFileSync(path.join(repo,'steep-boot.js'),'utf8'));
const popBlock=(bootSrc.match(/addEventListener\('popstate'[\s\S]*?\}\);/)||[''])[0];
ok(/popstate/.test(bootSrc) && popBlock.length>0, 'F1 a popstate handler exists');
ok(!/goView\(/.test(popBlock), 'F2 the popstate handler never calls goView — goView calls saveView, which would push again and turn Back into a loop; it sets state.view directly');
ok(/pagehide/.test(bootSrc) && /visibilitychange/.test(bootSrc), 'F3 the draft is persisted on pagehide AND visibilitychange:hidden (the backgrounding that precedes eviction)');

/* ---- G · the two clear sites + the SteepDB surface ---- */
const sessSrc=strip(fs.readFileSync(path.join(repo,'steep-sessions.js'),'utf8'));
ok((sessSrc.match(/SteepDB\.clearDraft\(\)/g)||[]).length>=2, 'G1 clearDraft() fires at BOTH sessionDraft=null sites (cancel + commit) — a committed/cancelled sitting must not resurrect on next launch');
const dataSrc=strip(fs.readFileSync(path.join(repo,'steep-data.js'),'utf8'));
ok(/saveDraft, loadDraft, clearDraft/.test(dataSrc), 'G2 saveDraft/loadDraft/clearDraft are exposed on window.SteepDB');
ok(/typeof draftForPersist === 'function'/.test(dataSrc), 'G3 saveDraft delegates the strip to the pure draftForPersist (one definition of the persist-safe shape)');

/* ---- H · boot restores silently into the session (R140) ---- */
ok(/loadDraft\(\)[\s\S]{0,260}state\.view *= *'session'/.test(coreSrc),
   'H1 boot restores a found draft and lands on the session view — silent (R140), no prompt; only dirty drafts are ever saved, so any restore is real work');
ok(/photoDropped[\s\S]{0,220}showToast\(/.test(coreSrc),
   'H2 a dropped photo is announced ONCE at restore via showToast (R139) — gated on photoDropped, so it never fires when nothing was dropped');
/* the notice states a fact, asks nothing — the imperative fence (R139). Guard against a "re-add"/"tap
   to" instruction creeping into the restore copy. */
ok(!/wasn['’]t kept[\s\S]{0,4}(re-?add|tap|add it|upload)/i.test(coreSrc), 'H3 the restore notice carries no imperative — states the loss, does not instruct the user to fix it (R139 fence)');

console.log('');
if(failures){ console.log('FAILED: '+failures+' of '+(passed+failures)); process.exit(1); }
console.log('ALL SESSION-DRAFT TESTS PASSED ('+passed+' passed)');
