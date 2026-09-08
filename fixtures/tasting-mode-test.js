/* PERMANENT validation — Tea Tasting mode (guided mode, D4 slice c1; committed, every deploy).
 *
 * Guards the cross-module invariants c1 rides, each of which fails silently:
 *   - tasting_record round-trips through BOTH session mappers (steep-data) — a one-way add drops it;
 *   - a tasting is NEVER shareable: sessionToDb forces is_shared false when tasting_record is present
 *     (the F3 finding hands the whole shared row to followers; a tasting must stay out of that path);
 *   - aroma is scoped per stage: ONLY the cup stages (liquor aroma + taste notes) feed the tea's
 *     flavour profile; dry/wet-leaf aroma stay blob-only, so three stages never muddy the profile;
 *   - the blob shape is stable and versioned, so c2/c3 nest with no further migration.
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

console.log('TEA TASTING MODE — guided mode c1 (SPEC-guided-mode-FINAL.md)');

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
ok(blob.taste&&Array.isArray(blob.taste.notes), 'B5 taste: notes[] note');
ok(blob.mouthfeel&&('note'in blob.mouthfeel)&&blob.finish&&('note'in blob.finish), 'B6 mouthfeel + finish: note only (the fleshed axes are c2)');
ok(blob.verdict&&('liked'in blob.verdict)&&('teaRatingOffered'in blob.verdict), 'B7 verdict: liked teaRatingOffered');
console.log('  B the blob: 7 checks');

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
console.log('  G the record: 6 checks');

console.log('');
if(failures){ console.log('FAILED: '+failures+' of '+(passed+failures)); process.exit(1); }
console.log('ALL TASTING-MODE TESTS PASSED ('+passed+' passed)');
