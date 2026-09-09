/* PERMANENT validation — Tea Tasting mode (guided mode, D4 slices c1 + c2; committed, every deploy).
 *
 * Guards the cross-module invariants c1 rides, each of which fails silently:
 *   - tasting_record round-trips through BOTH session mappers (steep-data) — a one-way add drops it;
 *   - a tasting is NEVER shareable: sessionToDb forces is_shared false when tasting_record is present
 *     (the F3 finding hands the whole shared row to followers; a tasting must stay out of that path);
 *   - aroma is scoped per stage: ONLY the cup stages (liquor aroma + taste notes) feed the tea's
 *     flavour profile; dry/wet-leaf aroma stay blob-only, so three stages never muddy the profile;
 *   - the blob shape is stable and versioned, so c2/c3 nest with no further migration.
 * c2 adds the fleshed axes and pins the conventions that bite if broken:
 *   - worded scales store a FROZEN {word,position} (never a bare index; the record renders the stored
 *     word, so a later ladder re-tune can never rewrite an old tasting); named steps store the enum key;
 *   - palate position is MULTI-select (places, not amounts);
 *   - the tradition lens REFLECTS captured values and never asks for new input; hou-yun is gated by
 *     tea TYPE (oolong/pu-erh), not method; a confirmed discard clears the persisted draft; and the
 *     smell rooms ask about smell, only the taste room asks about taste (the c1 leak).
 *
 * Run: node fixtures/tasting-mode-test.js   (exit non-zero on any failure). Run export-gate FIRST.
 */
const fs=require('fs'), path=require('path'), vm=require('vm');
const repo=path.join(__dirname,'..');
const FILES=['steep-knowledge.js','steep-tea-types.js','steep-core.js','steep-settings.js',
  'steep-dashboard.js','steep-insights.js','steep-teas.js','steep-reference.js',
  'steep-shopping.js','steep-passport.js','steep-social.js','steep-sessions.js'];
const SRC=FILES.map(f=>fs.readFileSync(path.join(repo,f),'utf8')).join('\n;\n');
const ctx={};ctx.window=ctx;ctx.globalThis=ctx;ctx.console=console;
ctx.document={documentElement:{setAttribute(){},getAttribute(){return'light'}},
  getElementById:()=>null,querySelectorAll:()=>[],querySelector:()=>null,addEventListener(){},
  createElement:()=>({style:{},setAttribute(){},appendChild(){},classList:{add(){},remove(){},toggle(){}}})};
ctx.localStorage={getItem:()=>null,setItem(){},removeItem(){}};
ctx.matchMedia=()=>({matches:false});ctx.navigator={onLine:true};
ctx.setTimeout=()=>{};ctx.clearTimeout=()=>{};ctx.setInterval=()=>{};ctx.clearInterval=()=>{};
ctx.addEventListener=()=>{};ctx.SteepDB={newId:()=>'x',getUser:()=>({id:'u'})};
vm.createContext(ctx);vm.runInContext(SRC,ctx);
vm.runInContext('state.settings=Object.assign({},DEFAULT_SETTINGS);',ctx);
const G=e=>vm.runInContext(e,ctx);
let passed=0,failures=0;
const ok=(c,m)=>{ if(c){passed++;} else {failures++; console.log('  FAIL: '+m);} };

console.log('TEA TASTING MODE — guided mode c1 + c2 (SPEC-guided-mode-FINAL.md)');

/* ---- A · the walk + vocab constants ---- */
const rooms=G('TASTING_ROOMS');
ok(Array.isArray(rooms)&&rooms.length===8, 'A1 the walk is 8 rooms (got '+(rooms&&rooms.length)+')');
ok(rooms.map(r=>r.key).join(',')==='dryLeaf,wetLeaf,liquor,liquorAroma,taste,mouthfeel,finish,verdict',
   'A2 rooms in spine order, ending at the verdict');
ok(rooms.every(r=>r.key&&r.label&&r.cue), 'A3 every room has a key, an expert label and a guide cue');
const forms=G('DRY_LEAF_FORMS');
ok(Array.isArray(forms)&&forms.length===8&&forms.includes('needle')&&forms.includes('downy'),
   'A4 the dry-leaf FORM set is the 8 observational chips (SPEC §4), NOT the stored leaf_form');
ok(G('TASTING_SCHEMA_V')===1, 'A5 the blob carries a schema version stamp (v=1)');
console.log('  A the walk: 5 checks');

/* ---- B · the blob shape (c1 keys; c2/c3 nest with no migration) ---- */
const blob=G('newTastingBlob()');
ok(blob.v===1 && blob.register===null && typeof blob.startedAt==='string' && blob.endedEarly===false,
   'B1 a fresh blob carries v, register, startedAt, endedEarly');
ok(blob.dryLeaf&&Array.isArray(blob.dryLeaf.form)&&('colour'in blob.dryLeaf)&&('mottled'in blob.dryLeaf)&&Array.isArray(blob.dryLeaf.aroma)&&('note'in blob.dryLeaf),
   'B2 dryLeaf: form[] colour mottled aroma[] note');
ok(blob.wetLeaf&&Array.isArray(blob.wetLeaf.aromaShift), 'B3 wetLeaf: aromaShift[] note');
ok(blob.liquor&&('colour'in blob.liquor)&&Array.isArray(blob.liquor.aroma), 'B4 liquor: colour aroma[] note');
ok(blob.taste&&Array.isArray(blob.taste.notes)&&blob.taste.axes&&('sweet'in blob.taste.axes)&&('bitter'in blob.taste.axes)&&('sour'in blob.taste.axes)&&('umami'in blob.taste.axes)&&Array.isArray(blob.taste.palatePosition),
   'B5 taste: notes[] note + axes{sweet,bitter,sour,umami} + palatePosition[] (c2 nests, no migration)');
ok(blob.mouthfeel&&('note'in blob.mouthfeel)&&('body'in blob.mouthfeel)&&blob.mouthfeel.astringency&&('level'in blob.mouthfeel.astringency)&&('quality'in blob.mouthfeel.astringency),
   'B6 mouthfeel: note + body + astringency{level,quality} (c2)');
ok(blob.finish&&('note'in blob.finish)&&('length'in blob.finish)&&('huigan'in blob.finish)&&('houYun'in blob.finish),
   'B7 finish: note + length + huigan + houYun (c2)');
ok(blob.verdict&&('liked'in blob.verdict)&&('teaRatingOffered'in blob.verdict), 'B8 verdict: liked teaRatingOffered');
// every c2 axis starts empty (nothing forced, all optional)
ok(blob.taste.axes.sweet===null&&blob.mouthfeel.body===null&&blob.mouthfeel.astringency.level===null&&blob.finish.length===null&&blob.finish.huigan===null&&blob.finish.houYun===null&&blob.taste.palatePosition.length===0,
   'B9 a fresh blob leaves every c2 axis empty (null / [])');
console.log('  B the blob: 9 checks');

/* ---- C · the mappers round-trip BOTH ways (or the field drops silently — the house rule) ---- */
const dataRaw=fs.readFileSync(path.join(repo,'steep-data.js'),'utf8');
ok(/tastingRecord: r\.tasting_record \|\| null/.test(dataRaw), 'C1 sessionFromDb reads tasting_record');
ok(/tasting_record: s\.tastingRecord \|\| null/.test(dataRaw), 'C2 …and sessionToDb writes it — both mappers, or the round trip drops it');
console.log('  C the mappers: 2 checks');

/* ---- D · NOT SHAREABLE — the belt at the single writer (F3) ---- */
ok(/is_shared: \(!s\.tastingRecord && !!s\.isShared\)/.test(dataRaw),
   'D1 sessionToDb FORCES is_shared false whenever tasting_record is present — a tasting never enters the followers-read path, whatever the UI did');
ok(fs.existsSync(path.join(repo,'sql/v3_13-tasting-record.sql')), 'D2 the migration is committed as v3_13 (SQL-first, applied before this code)');
console.log('  D not shareable: 2 checks');

/* ---- E · aroma scoping — ONLY the cup stages feed the profile (dry/wet leaf stay blob-only) ---- */
const b2=G('newTastingBlob()');
b2.dryLeaf.aroma=['hay','DUSTY']; b2.wetLeaf.aromaShift=['cut grass']; b2.liquor.aroma=['Stonefruit','honey']; b2.taste.notes=['honey','orchid'];
const cup=G('tastingProfileTags('+JSON.stringify(b2)+')');
ok(cup.includes('stonefruit')&&cup.includes('orchid'), 'E1 the cup stages (liquor aroma + taste notes) feed the profile');
ok(!cup.includes('hay')&&!cup.includes('dusty')&&!cup.includes('cut grass'),
   'E2 dry-leaf + wet-leaf aroma DO NOT feed the profile — leaf observations are a different layer');
ok(cup.filter(t=>t==='honey').length===1, 'E3 deduped across stages (honey in both liquor + taste → once)');
ok(cup.every(t=>t===t.toLowerCase()), 'E4 lowercased, matching the tagger + session.tags convention');
console.log('  E aroma scoping: 4 checks');

/* ---- F · flavArrayFor routes the reused tagger per stage; default is the session's tags ---- */
G('state.sessionDraft={sessionTags:[],tasting:newTastingBlob()};');
ok(G('(function(){var d=state.sessionDraft; d.flavCtx=null; return flavArrayFor(d)===d.sessionTags;})()'),
   'F1 no flavCtx → the tagger writes the SESSION tags (D2 default, unchanged — so the session flow is untouched)');
ok(G('(function(){var d=state.sessionDraft; d.flavCtx="dryLeaf"; return flavArrayFor(d)===d.tasting.dryLeaf.aroma;})()'),
   'F2 flavCtx dryLeaf → the dry-leaf aroma array');
ok(G('(function(){var d=state.sessionDraft; d.flavCtx="liquorAroma"; return flavArrayFor(d)===d.tasting.liquor.aroma;})()'),
   'F3 flavCtx liquorAroma → the liquor aroma array');
ok(G('(function(){var d=state.sessionDraft; d.flavCtx="taste"; return flavArrayFor(d)===d.tasting.taste.notes;})()'),
   'F4 flavCtx taste → the taste notes array');
console.log('  F tagger scoping: 4 checks');

/* ---- G · the record read renders (full + ended-early), and the routing/badge are wired ---- */
G('state.teas=[{id:"t1",name:"Test Sencha",type:"green",rating:0}];');
G('state.vessels=[{id:"v1",name:"Kyusu",type:"Kyusu"}];');
const full=G('newTastingBlob()'); full.dryLeaf.form=['needle']; full.dryLeaf.colour='jade'; full.liquor.colour='gold-pale'; full.liquor.aroma=['stonefruit']; full.taste.notes=['umami']; full.verdict.liked='clean and sweet';
const sFull={id:'s1',teaId:'t1',vesselId:'v1',date:new Date().toISOString(),rating:4,tags:['stonefruit','umami'],tastingRecord:full};
const recHTML=G('viewTastingRecord('+JSON.stringify(sFull)+')');
ok(typeof recHTML==='string'&&/Test Sencha/.test(recHTML)&&/tasting/.test(recHTML), 'G1 the record renders the tea + the tasting kicker');
ok(/--liquor-gold-pale/.test(recHTML)&&/--leaf-jade/.test(recHTML), 'G2 …and paints the per-cup liquor + leaf colour swatches from the stored blob keys');
ok(/clean and sweet/.test(recHTML), 'G3 …and the verdict takeaway');
const early=G('newTastingBlob()'); early.endedEarly=true; early.dryLeaf.aroma=['hay'];
const sEarly={id:'s2',teaId:'t1',date:new Date().toISOString(),rating:0,tags:[],tastingRecord:early};
ok(typeof G('viewTastingRecord('+JSON.stringify(sEarly)+')')==='string', 'G4 an ended-early tasting renders without throwing (no verdict, no rating invented)');
const sessRaw=fs.readFileSync(path.join(repo,'steep-sessions.js'),'utf8');
ok(/if\(s\.tastingRecord\) return viewTastingRecord\(s\)/.test(sessRaw), 'G5 viewSessionDetail routes a tasting to the rich read, not the plain session view');
ok(/s\.tastingRecord\?' · tasting'/.test(sessRaw), 'G6 the sessions list badges a tasting');
// c2 axes are render-only in the record (Tier-2): the FROZEN word for scales, the step label for steps
const full2=G('newTastingBlob()');
full2.taste.axes.umami={word:'strong',position:3}; full2.taste.palatePosition=['front','back'];
full2.mouthfeel.body='full'; full2.mouthfeel.astringency.level={word:'light',position:1}; full2.mouthfeel.astringency.quality='pleasant';
full2.finish.length={word:'lingering',position:3}; full2.finish.huigan='clear';
const recAx=G('viewTastingRecord('+JSON.stringify({id:'s3',teaId:'t1',date:new Date().toISOString(),rating:3,tags:[],tastingRecord:full2})+')');
ok(/strong/.test(recAx)&&/lingering/.test(recAx), 'G7 the record renders the FROZEN worded-axis words (umami level, finish length)');
ok(/Full/.test(recAx)&&/Clear/.test(recAx)&&/Pleasant/.test(recAx), 'G8 …and the named-step labels (body, huigan, astringency quality)');
ok(/Front/.test(recAx)&&/Back/.test(recAx), 'G9 …and every selected multi-select palate place');
console.log('  G the record: 9 checks');

/* ---- H · the fleshed axes: worded scales freeze {word,position}; steps store keys; palate multi ---- */
G('render=function(){};');   // the axis writers re-render; stub render so we exercise the pure state change
G('state.sessionDraft={isTasting:true,tasting:newTastingBlob()};');
const INT=G('TASTING_INTENSITY'), FLEN=G('TASTING_FINISH_LEN');
G('tastingSetAxis("sweet",2);');
const sweet=G('state.sessionDraft.tasting.taste.axes.sweet');
ok(sweet&&sweet.word===INT[2]&&sweet.position===2, 'H1 a worded taste axis stores the FROZEN {word,position}, never a bare index');
G('tastingSetAxis("sweet",2);');
ok(G('state.sessionDraft.tasting.taste.axes.sweet')===null, 'H2 re-tapping the same stop clears it (nothing is forced)');
ok(['sweet','bitter','sour','umami'].every(a=>{G('tastingSetAxis("'+a+'",1)');const v=G('state.sessionDraft.tasting.taste.axes.'+a);return v&&v.word===INT[1]&&v.position===1;}),
   'H3 all four taste axes (sweet/bitter/sour/umami) are worded scales');
G('tastingSetAstrLevel(0);');
const al=G('state.sessionDraft.tasting.mouthfeel.astringency.level');
ok(al&&al.word===INT[0]&&al.position===0, 'H4 astringency LEVEL is a worded scale (faint…pronounced), distinct from quality');
G('tastingSetFinishLen(4);');
const fl=G('state.sessionDraft.tasting.finish.length');
ok(fl&&fl.word===FLEN[4]&&fl.position===4, 'H5 finish LENGTH is a worded scale on its own ladder (gone at once…long)');
G('tastingSetBody("full"); tastingSetAstrQuality("harsh"); tastingSetHuigan("clear"); tastingSetHouYun("faint");');
ok(G('state.sessionDraft.tasting.mouthfeel.body')==='full', 'H6 body stores the STEP key (named steps: thin/medium/full)');
ok(G('state.sessionDraft.tasting.mouthfeel.astringency.quality')==='harsh', 'H7 astringency QUALITY stores a step key (pleasant/just-there/harsh)');
ok(G('state.sessionDraft.tasting.finish.huigan')==='clear'&&G('state.sessionDraft.tasting.finish.houYun')==='faint', 'H8 huigan + houYun store step keys');
G('tastingTogglePalate("front"); tastingTogglePalate("back");');
ok(JSON.stringify(G('state.sessionDraft.tasting.taste.palatePosition'))==='["front","back"]', 'H9 palate position is MULTI-select (places, not amounts)');
G('tastingTogglePalate("front");');
ok(JSON.stringify(G('state.sessionDraft.tasting.taste.palatePosition'))==='["back"]', 'H10 …and each place toggles independently');
console.log('  H the c2 axes: 10 checks');

/* ---- I · the tradition lens: a READ-ONLY re-reading, filled from captured values, off by default ---- */
G('state.sessionDraft={isTasting:true,_lensOn:true,tasting:newTastingBlob()};');
G('state.sessionDraft.tasting.taste.axes.sweet={word:"medium",position:2};');
G('state.sessionDraft.tasting.taste.axes.bitter={word:"faint",position:0};');
G('state.sessionDraft.tasting.taste.axes.umami={word:"pronounced",position:4};');
G('state.sessionDraft.tasting.mouthfeel.astringency.level={word:"light",position:1};');
const lens=G('tastingLensBlock(state.sessionDraft)');
ok(/medium/.test(lens)&&/faint/.test(lens)&&/pronounced/.test(lens)&&/light/.test(lens),
   'I1 the lens FILLS from the captured values (amami←sweet, nigami←bitter, umami←umami, shibumi←astringency)');
ok(/Amami/.test(lens)&&/Nigami/.test(lens)&&/Umami/.test(lens)&&/Shibumi/.test(lens), 'I2 …and names all four tradition terms');
ok(!/tastingSetAxis|tastingSetAstr|toggleSessionFlavor|tastingTogglePalate/.test(lens), 'I3 the lens is READ-ONLY: no capture handlers, it never asks for new input');
ok(/data-info=/.test(lens), 'I4 each lens term carries its glossary ⓘ (infoMark)');
ok(G('tastingLensType({type:"green"})')===true && !G('tastingLensType({type:"black"})') && !G('tastingLensType({type:"oolong"})'),
   'I5 the lens is surfaced by tea TYPE (green), not by method, and is off otherwise');
G('state.sessionDraft._lensOn=false;');
ok(!/Amami/.test(G('tastingLensBlock(state.sessionDraft)')), 'I6 default OFF: the panel is collapsed until the toggle is tapped');
console.log('  I the tradition lens: 6 checks');

/* ---- J · hou-yun is offered by tea TYPE (oolong/pu-erh), open in guide, closed in terse ---- */
G('state.sessionDraft={isTasting:true,register:"guide",tasting:newTastingBlob()};');
const finOolong=G('tr_finish(state.sessionDraft,{type:"oolong"})');
ok(/hou yun/i.test(finOolong)&&/tastingSetHouYun\(/.test(finOolong), 'J1 hou yun is OFFERED and drawn OPEN for oolong in the guide register');
ok(/hou yun/i.test(G('tr_finish(state.sessionDraft,{type:"puerh"})')), 'J2 …and for pu-erh');
ok(!/hou yun/i.test(G('tr_finish(state.sessionDraft,{type:"green"})')), 'J3 …but NOT for a green (offered by tea type, SPEC §4)');
G('state.sessionDraft.register="expert";');
const finTerse=G('tr_finish(state.sessionDraft,{type:"oolong"})');
ok(/tst-disclose/.test(finTerse)&&!/tastingSetHouYun\(/.test(finTerse), 'J4 the terse register draws hou yun CLOSED (a disclosure; steps hidden until opened)');
console.log('  J hou yun gating: 4 checks');

/* ---- K · a confirmed discard clears the draft AND the persisted copy; accidents still keep ---- */
G('var _cleared=false; SteepDB.clearDraft=function(){_cleared=true;};');
G('state.sessionDraft={isTasting:true,tasting:newTastingBlob()};');
G('discardTasting();');
ok(G('state.sessionDraft')===null, 'K1 a confirmed discard clears the in-memory draft');
ok(G('_cleared')===true, 'K2 …and clears the PERSISTED draft (SteepDB.clearDraft called)');
G('state.sessionDraft={isTasting:true,stage:"tasting",tasting:newTastingBlob()};');
ok(G('sessionDraftDirty(state.sessionDraft)')===true, 'K3 a tasting stays always-dirty → an accidental leave KEEPS it; discard is the only path that clears');
console.log('  K deliberate discard: 3 checks');

/* ---- L · the smell/taste prompt fix (c1 leak): smell rooms ask smell, only taste asks taste ---- */
G('state.sessionDraft={sessionTags:[],tasting:newTastingBlob()};');
G('state.sessionDraft.flavCtx="dryLeaf";');
ok(/What do you smell\?/.test(G('flavorCaptureHTML(state.sessionDraft)')), 'L1 the dry-leaf room asks about SMELL (c1: "What are you tasting?" leaked in here)');
G('state.sessionDraft.flavCtx="liquorAroma";');
ok(/What do you smell\?/.test(G('flavorCaptureHTML(state.sessionDraft)')), 'L2 the liquor-aroma room asks about smell');
G('state.sessionDraft.flavCtx="taste";');
ok(/What are you tasting\?/.test(G('flavorCaptureHTML(state.sessionDraft)')), 'L3 only the TASTE room asks about taste');
G('state.sessionDraft.flavCtx=null;');
ok(/What are you tasting\?/.test(G('flavorCaptureHTML(state.sessionDraft)')), 'L4 the ordinary session flow (no flavCtx) is UNCHANGED');
console.log('  L smell/taste prompt fix: 4 checks');

/* ---- M · authored §6 room copy + the §5 glossary ship, both in house voice (no dashes) ---- */
const EM=String.fromCharCode(8212), EN=String.fromCharCode(8211);
const rms=G('TASTING_ROOMS');
ok(rms.find(r=>r.key==='dryLeaf').cue.indexOf('Tip the leaves into your hand')===0, 'M1 the dry-leaf room ships the authored §6 coaching line');
ok(rms.find(r=>r.key==='wetLeaf').cue.indexOf('smell the hot leaves')>0, 'M2 the warmed-leaf room uses smell language (not "What are you tasting?")');
ok(rms.every(r=>r.cue.indexOf(EM)<0 && r.cue.indexOf(EN)<0), 'M3 no em/en dashes in any room cue (house voice)');
const gloss=G('TASTING_GLOSSARY');
ok(['umami','amami','shibumi','nigami','astringency','huigan','houyun'].every(k=>gloss[k]&&gloss[k].length>20), 'M4 all seven §5 glossary definitions ship');
ok(Object.values(gloss).every(v=>v.indexOf(EM)<0 && v.indexOf(EN)<0), 'M5 no em/en dashes in the glossary (house voice)');
console.log('  M authored copy + glossary: 5 checks');

console.log('');
if(failures){ console.log('FAILED: '+failures+' of '+(passed+failures)); process.exit(1); }
console.log('ALL TASTING-MODE TESTS PASSED ('+passed+' passed)');
