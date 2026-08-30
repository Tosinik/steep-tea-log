/* brew-advice-v4-test.js — R175 the context-gated diagnosis engine (Stage 1, dormant).
 *
 * Tests the LOGIC, never live values (SPEC-brew-advice-v4.md §2/§3/§6/§7):
 *  A  each character tap → the correct lever + mechanism
 *  B  context-gating — same tap, different type/temp → different lever (bitter on already-cool green → time,
 *     not temp; astringent on hot black → temp)
 *  C  the by-design-light shape gate — flat on a gongfu/senchadō OPENING steep → "extend the next", never
 *     "add leaf"; flat on western → "add leaf"; flat on a gongfu MIDDLE steep → "add leaf"
 *  D  the water/freshness gate — flat routes through the water check until water is ruled out
 *  E  the weak≡flat read-side alias (non-destructive)
 *  F  the net-sign auto-delta is RETIRED — computeBrewAdvice returns hasNudge:false, tuned===base
 *  G  KB shape sanity (KB_TYPE_SHAPE / KB_STYLE_SHAPE)
 *  H  real data — every legacy feedback value diagnoses without crashing; 'weak' takes the flat path
 * Run fixtures/export-gate-test.js FIRST.
 */
const fs=require('fs'), path=require('path'), vm=require('vm');
const REPO=path.resolve(__dirname,'..');
const SRC=['steep-knowledge.js','steep-tea-types.js','steep-core.js','steep-teas.js','steep-sessions.js']
  .map(f=>fs.readFileSync(path.join(REPO,f),'utf8')).join('\n;\n');
const ctx={}; ctx.window=ctx; ctx.globalThis=ctx; ctx.console=console;
ctx.document={documentElement:{setAttribute(){},getAttribute(){return'light'}},getElementById:()=>null,querySelectorAll:()=>[],querySelector:()=>null,addEventListener(){},createElement:()=>({style:{},setAttribute(){},appendChild(){},classList:{add(){},remove(){}}})};
ctx.localStorage={getItem:()=>null,setItem(){},removeItem(){}};
ctx.matchMedia=()=>({matches:false}); ctx.navigator={onLine:true};
ctx.setTimeout=()=>{}; ctx.clearTimeout=()=>{}; ctx.setInterval=()=>{}; ctx.clearInterval=()=>{}; ctx.addEventListener=()=>{};
ctx.SteepDB={newId:()=>'x',getUser:()=>({id:'u'})};
vm.createContext(ctx); vm.runInContext(SRC, ctx);
const G=e=>vm.runInContext(e,ctx);
G('state.settings=Object.assign({},DEFAULT_SETTINGS);state.teas=[];state.sessions=[];state.vessels=[];');

let passed=0, failed=0;
const ok=(c,m)=>{ if(c){passed++;} else {failed++; console.log('  FAIL: '+m);} };
// diagnose(tap, ctxObj) → the result object (or null)
function dg(tap, c){ return G('diagnoseFeedback('+JSON.stringify(tap)+','+JSON.stringify(c||{})+')'); }

console.log('BREW-ADVICE v4 — the context-gated diagnosis (R175)');

/* ---- A · each tap → the correct lever + mechanism ---- */
const midGongfuGreen = { type:'green', style:'gongfu', infusionRole:'middle', curTempC:80, waterOK:true };
ok(dg('good', midGongfuGreen)===null, 'A good → null (affirmation, no advice)');
{ const d=dg('strong', midGongfuGreen); ok(d && d.lever==='ratio' && /concentration/i.test(d.why), 'A strong → ratio (less leaf/more water), "concentration"'); }
{ const d=dg('flat', { type:'black', style:'western', infusionRole:'opening', curTempC:95, waterOK:true });
  ok(d && d.lever==='leaf' && /more leaf/i.test(d.why), 'A flat (western, water ruled out) → leaf, "more leaf first"'); }
{ const d=dg('astringent', { type:'black', style:'western', curTempC:95, waterOK:true });
  ok(d && d.lever==='temp' && /tannins/i.test(d.why), 'A astringent (hot black) → temp, "tannins"'); }
{ const d=dg('bitter', { type:'green', style:'gongfu', curTempC:85, waterOK:true });
  ok(d && d.lever==='temp' && /caffeine|catechins/i.test(d.why), 'A bitter (hot delicate green) → temp'); }

/* ---- B · context-gating — the temperature threshold flips the lever ---- */
{ const cool=dg('bitter', { type:'green', curTempC:70 });   // curTempC == green tempMin → already cool
  ok(cool && cool.lever==='time', 'B bitter on an ALREADY-COOL green (70°=tempMin) → time, NOT temp'); }
{ const hot=dg('bitter', { type:'green', curTempC:85 });
  ok(hot && hot.lever==='temp', 'B bitter on a not-cool green (85°) → temp'); }
{ const blk=dg('astringent', { type:'black', curTempC:95 });
  ok(blk && blk.lever==='temp', 'B astringent on hot black (95° > tempMin 90) → temp'); }
{ const coolAstr=dg('astringent', { type:'green', curTempC:70 });
  ok(coolAstr && coolAstr.lever==='time', 'B astringent on already-cool green → time'); }
{ const robustBitter=dg('bitter', { type:'black', curTempC:98 });   // not delicate → time even when hot
  ok(robustBitter && robustBitter.lever==='time', 'B bitter on robust black → time (delicate-only gets temp-first)'); }

/* ---- C · the by-design-light shape gate ---- */
{ const gf=dg('flat', { type:'green', style:'gongfu', infusionRole:'opening', curTempC:80, waterOK:true });
  ok(gf && gf.lever==='time' && /extend the next/i.test(gf.dir) && !/leaf/i.test(gf.dir), 'C flat on a gongfu OPENING steep → "extend the next", never "add leaf"');
  ok(/poured off/i.test(gf.why), 'C the opening-steep mechanism names the pour-off ("you may have poured off too fast")'); }
{ const sn=dg('flat', { type:'green', style:'senchado', infusionRole:'opening', curTempC:70, waterOK:true });
  ok(sn && sn.lever==='time' && /extend the next/i.test(sn.dir), 'C flat on a senchadō OPENING steep → "extend the next" (senchadō is light-by-design too)'); }
{ const mid=dg('flat', { type:'green', style:'gongfu', infusionRole:'middle', curTempC:80, waterOK:true });
  ok(mid && mid.lever==='leaf', 'C flat on a gongfu MIDDLE steep (not opening) → add leaf'); }
{ const w=dg('flat', { type:'green', style:'western', infusionRole:'opening', curTempC:80, waterOK:true });
  ok(w && w.lever==='leaf', 'C flat on a WESTERN opening steep → add leaf (western is not light-by-design)'); }

/* ---- D · the water/freshness caveat (§6, v4.33) — rule out water, but NEVER dead-end on the check ---- */
{ const noWater=dg('flat', { type:'green', style:'western', waterOK:false });
  ok(noWater.lever==='leaf' && noWater.waterCaveat===true, 'D flat + no water → the leaf lever WITH a water caveat (actionable, not a dead-end)');
  ok(dg('flat', { type:'green', style:'western' }).waterCaveat===true, 'D flat + water UNKNOWN → water caveat too (default: rule it out)');
  ok(!dg('flat', { type:'green', style:'western', waterOK:true }).waterCaveat, 'D flat + water logged → the lever alone, no caveat');
  const openNoWater=dg('flat', { type:'green', style:'gongfu', infusionRole:'opening', waterOK:false });
  ok(openNoWater.lever==='time' && !openNoWater.waterCaveat, 'D a by-design-light OPENING flat + no water → extend, NO water caveat (by design, not flat-from-water)'); }

/* ---- E · the weak≡flat read-side alias (non-destructive) ---- */
[ { type:'green', style:'western', infusionRole:'opening', curTempC:80, waterOK:true },
  { type:'green', style:'gongfu',  infusionRole:'opening', curTempC:80, waterOK:true },
  { type:'green', style:'western', waterOK:false } ].forEach((c,i)=>{
  ok(JSON.stringify(dg('weak',c))===JSON.stringify(dg('flat',c)), 'E legacy "weak" diagnoses identically to "flat" (ctx '+i+')');
});

/* ---- F · the net-sign auto-delta is RETIRED ---- */
G(`state.teas=[{id:'t1',name:'T',type:'green'}];
   state.sessions=[
     {id:'s1',teaId:'t1',date:'2026-05-01T08:00:00Z',steeps:[{feedback:'weak'}]},
     {id:'s2',teaId:'t1',date:'2026-05-02T08:00:00Z',steeps:[{feedback:'weak'}]},
     {id:'s3',teaId:'t1',date:'2026-05-03T08:00:00Z',steeps:[{feedback:'good'}]}];`);
{ const adv=G(`(function(){ var base={tempC:90,rinseSeconds:0,times:[15,20,25],form:'open',generated:false};
    var a=computeBrewAdvice(state.teas[0], base); return {hasNudge:a.hasNudge, sameBase:a.tuned===base, count:a.count, tempAdjC:a.tempAdjC, timeAdjPct:a.timeAdjPct}; })()`);
  ok(adv.hasNudge===false, 'F computeBrewAdvice.hasNudge is always false (auto-tuning retired)');
  ok(adv.sameBase===true, 'F tuned === base (the schedule is NOT mutated by feedback)');
  ok(adv.tempAdjC===undefined && adv.timeAdjPct===undefined, 'F the tempAdjC/timeAdjPct delta fields are gone');
  ok(adv.count===3, 'F the feedback COUNTS survive (for the memory line)'); }

/* ---- G · KB shape sanity ---- */
{ const TS=G('KB_TYPE_SHAPE'), SS=G('KB_STYLE_SHAPE'), TYPES=G('TYPES.map(t=>t.k)');
  ok(TYPES.every(k=>TS[k] && TS[k].tempMin<TS[k].tempMax && TS[k].failHot && TS[k].failCool), 'G KB_TYPE_SHAPE covers every TYPES key with a valid window + failure modes');
  ok(SS.gongfu.openingLightByDesign===true && SS.senchado.openingLightByDesign===true && SS.western.openingLightByDesign===false, 'G openingLightByDesign: gongfu/senchadō true, western false');
  ok(SS.senchado.sencha.tempMin===70 && SS.senchado.sencha.tempMax===80 && SS.senchado.gyokuro.tempMin===50 && SS.senchado.gyokuro.tempMax===60, 'G senchadō shape carries sencha ~70-80 / gyokuro ~50-60 (§7, moved to the KB)'); }

/* ---- H · real data — every legacy value diagnoses without crashing; 'weak' takes the flat path ---- */
function parseCSV(t){const R=[];let r=[],c='',q=false;for(let i=0;i<t.length;i++){const ch=t[i];
 if(q){if(ch==='"'){if(t[i+1]==='"'){c+='"';i++;}else q=false;}else c+=ch;}
 else if(ch==='"')q=true;else if(ch===','){r.push(c);c='';}
 else if(ch==='\n'){r.push(c);R.push(r);r=[];c='';}else if(ch!=='\r')c+=ch;}
 if(c||r.length){r.push(c);R.push(r);}
 const h=(R[0]||[]).map(x=>x.trim());return R.slice(1).filter(x=>x.length===h.length).map(x=>Object.fromEntries(h.map((k,i)=>[k,x[i]])));}
const rd=f=>{ try{ return parseCSV(fs.readFileSync(path.join(__dirname,f),'utf8')); }catch(e){ return null; } };
const steeps=rd('steeps_rows.csv'), sessions=rd('sessions_rows.csv');
if(steeps && sessions){
  const vals=[]; [steeps,sessions].forEach(rows=>rows.forEach(r=>{ const v=(r.feedback||'').trim(); if(v) vals.push(v); }));
  const rctx={ type:'green', style:'gongfu', infusionRole:'middle', curTempC:80, waterOK:true };
  let crashed=0, weakSeen=0, weakEqFlat=0;
  vals.forEach(v=>{ let d; try{ d=dg(v, rctx); }catch(e){ crashed++; return; }
    if(v==='weak'){ weakSeen++; if(JSON.stringify(d)===JSON.stringify(dg('flat',rctx))) weakEqFlat++; } });
  ok(crashed===0, 'H every one of the '+vals.length+' legacy feedback values diagnoses without crashing');
  ok(weakSeen>0 && weakEqFlat===weakSeen, 'H all '+weakSeen+' legacy "weak" values take the flat path (alias holds on real data)');
  console.log('  H real-data: '+vals.length+' legacy values · '+weakSeen+' weak → flat');
} else { console.log('  H skipped — no real CSVs'); }

/* ---- I · render wiring (Slice 2, R176) — the capture surfaces render each state + the role-aware
   timeShift maps correctly. Render strings only (no browser); the visual reading is smoke.md §v4.32. ---- */
G("state.teas=[{id:'t1',name:'Sencha',type:'green'}]; state.vessels=[]; state.settings.brewAdvice=true; render=function(){}; applyScheduleToCurrentSteep=function(){};");
const draftJS=extra=>"state.sessionDraft=Object.assign({teaId:'t1',brewStyle:'gongfu',waterType:'filtered',waterTDS:'',timeShift:0,schedule:{tempC:80,times:[30,40,50],form:'open'},steeps:[{tempC:80,timeSeconds:30,feedback:null}]},"+JSON.stringify(extra||{})+");";
G(draftJS()); { const h=G('brewNudgeRowHTML(state.sessionDraft)');
  ok(/how did it pour/i.test(h) && !/✓/.test(h) && !/Bitter/.test(h), 'I1 collapsed: faint "how did it pour?", no marker, no open chips'); }
G(draftJS({pourFbOpenIdx:0})); { const h=G('brewNudgeRowHTML(state.sessionDraft)');
  ok(/Just right/.test(h) && /Too strong/.test(h) && /Flat/.test(h) && /Drying/.test(h) && /Bitter/.test(h), 'I2 expanded: the five taps'); }
G(draftJS({steeps:[{tempC:80,timeSeconds:30,feedback:'bitter'}]})); { const h=G('brewNudgeRowHTML(state.sessionDraft)');
  ok(/✓ bitter/.test(h), 'I3 recorded: the ✓ character marker');
  ok(/pour-advice/.test(h) && /Next time, try/.test(h), 'I3 …and the experiment-framed advice line'); }
G(draftJS()); G("d_nudgeNextSteep('bitter');"); ok(G('state.sessionDraft.timeShift')===-5, 'I4 bitter → shorten the next pour (−)');
G(draftJS()); G("d_nudgeNextSteep('flat');"); ok(G('state.sessionDraft.timeShift')===5, 'I4 flat on a by-design-light OPENING steep → extend the next (+)');
G(draftJS()); G("d_nudgeNextSteep('strong');"); ok(G('state.sessionDraft.timeShift')===0, 'I4 strong → advice only, no mid-brew timer change');
G(draftJS({steeps:[{feedback:null},{feedback:null},{feedback:null},{tempC:80,feedback:null}]})); G("d_nudgeNextSteep('flat');"); ok(G('state.sessionDraft.timeShift')===0, 'I4 flat on a LATE steep (idx≥3) → advice only (add leaf), no extend');
G(draftJS()); G("d_nudgeNextSteep('astringent');"); ok(G("state.sessionDraft.steeps[0].feedback")==='astringent', 'I5 the tap writes the character on the pour');
G("state.sessionDraft={teaId:'t1',brewStyle:'western',feedback:'bitter',waterType:'filtered',schedule:{tempC:95}};");
{ const h=G('feedbackRowHTML(state.sessionDraft)');
  ok(/Just right/.test(h) && /Drying/.test(h) && /Bitter/.test(h), 'I6 session-level row has the five taps');
  ok(/pour-advice/.test(h), 'I6 …and surfaces advice when a non-good tap is set'); }
// v4.33 bug 2 — flat + no water: the advice pairs the water caveat WITH the actionable lever (not water-only)
{ const h=G('pourAdviceHTML(diagnoseFeedback("flat",{type:"green",style:"western",waterOK:false}))');
  ok(/Could be your water/i.test(h) && /more leaf/i.test(h), 'I7 flat + no water → advice pairs the water caveat WITH the lever, never a dead-end'); }
// v4.33 bug 1 — the change-reopen path: rec set + open (pourFbOpenIdx===idx) → the five chips, current pick active
G(draftJS({steeps:[{tempC:80,timeSeconds:30,feedback:'bitter'}],pourFbOpenIdx:0}));
{ const h=G('brewNudgeRowHTML(state.sessionDraft)');
  ok(/Just right/.test(h) && /Bitter/.test(h) && !/✓/.test(h), 'I8 change-reopen: rec set + open → the five chips, not the ✓ marker');
  ok(/lib-chip active/.test(h), 'I8 …with the current pick highlighted so a re-tap changes it'); }
console.log('  I render wiring + role-aware timeShift: 13 checks');

console.log('');
if(failed){ console.log('BREW-ADVICE-V4 TESTS FAILED — '+failed+' failed, '+passed+' passed'); process.exit(1); }
console.log('ALL BREW-ADVICE-V4 TESTS PASSED ('+passed+' passed)');
