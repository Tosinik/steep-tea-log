/* reflection-test.js — R5/R172 the reflection deep pages + the deep-link mechanism (Slice A, v4.30).
 *
 * Tests the LOGIC, never live values:
 *  A  openReflection sets view + reflectFocus (+ activeTeaId), goView clears reflectFocus  (render stubbed)
 *  B  reflectRouteForInsight — the lead-type → {view,focus} map; unmapped types → null (Slices B/C)
 *  C  routing wiring is a source fact — HISTORY_VIEWS has palate/ritual, PERSISTED_VIEWS does not
 *  D  palate: families × ratings aggregation (session-count order + per-type average) — SYNTHETIC
 *  E  ritual: temps-by-type average + vessels count aggregation — SYNTHETIC
 *  F  REAL data — viewRitual()/viewPalate() render the spine + the #reflect-* anchors, nothing crashes
 *  G  the deep-link SCROLL is non-vm (needs a DOM + rAF): assert its SOURCE facts (smoke.md certifies it)
 * Run fixtures/export-gate-test.js FIRST.
 */
const fs=require('fs'), path=require('path'), vm=require('vm');
const REPO=path.resolve(__dirname,'..');
const SRC=['steep-origins-map.js','steep-knowledge.js','steep-tea-types.js','steep-core.js','steep-teas.js','steep-passport.js','steep-insights.js','steep-dashboard.js']
  .map(f=>fs.readFileSync(path.join(REPO,f),'utf8')).join('\n;\n');   // v4.36 (R174): +origins-map/+passport for terroir
const ctx={}; ctx.window=ctx; ctx.globalThis=ctx; ctx.console=console;
ctx.document={documentElement:{setAttribute(){},getAttribute(){return'light'}},getElementById:()=>null,querySelectorAll:()=>[],querySelector:()=>null,addEventListener(){},createElement:()=>({style:{},setAttribute(){},appendChild(){},classList:{add(){},remove(){}}})};
ctx.localStorage={getItem:()=>null,setItem(){},removeItem(){}};
ctx.matchMedia=()=>({matches:false}); ctx.navigator={onLine:true};
ctx.setTimeout=()=>{}; ctx.clearTimeout=()=>{}; ctx.setInterval=()=>{}; ctx.clearInterval=()=>{}; ctx.addEventListener=()=>{};
ctx.SteepDB={newId:()=>'x',getUser:()=>({id:'u'})};
vm.createContext(ctx); vm.runInContext(SRC, ctx);
const G=e=>vm.runInContext(e,ctx);
G('state.settings=Object.assign({},DEFAULT_SETTINGS);state.vessels=[];');
G('render=function(){reflectRenderCount=(typeof reflectRenderCount==="undefined"?0:reflectRenderCount)+1;};');  // stub the full re-render; count calls

let passed=0, failed=0;
const ok=(c,m)=>{ if(c){passed++;} else {failed++; console.log('  FAIL: '+m);} };
function seed(teas, sessions, vessels){ G('state.teas='+JSON.stringify(teas||[])+';state.sessions='+JSON.stringify(sessions||[])+';state.vessels='+JSON.stringify(vessels||[])+';'); }

console.log('REFLECTION — the deep pages + the deep-link mechanism (R172)');

/* ---- A · openReflection sets view+focus(+teaId); goView clears focus (render stubbed) ---- */
G('state.reflectFocus=null;state.activeTeaId=null;openReflection("palate","families");');
ok(G('state.view')==='palate', 'A openReflection sets state.view');
ok(G('state.reflectFocus')==='families', 'A openReflection sets state.reflectFocus');
ok(G('state.activeTeaId')===null, 'A no teaId → activeTeaId null (a non-per-tea deep link)');
G('openReflection("tea-detail","freshness","t7");');
ok(G('state.view')==='tea-detail' && G('state.reflectFocus')==='freshness' && G('state.activeTeaId')==='t7', 'A the per-tea form carries teaId (Slice B shape)');
G('state.reflectFocus="clock";goView("teas");');
ok(G('state.reflectFocus')===null, 'A goView clears a stale reflectFocus (a plain tab tap never carries it)');

/* ---- B · reflectRouteForInsight — the lead-type → {view,focus} map ---- */
const route=t=>G('JSON.stringify(reflectRouteForInsight('+JSON.stringify(t?{type:t}:null)+'))');
ok(route('palate-lean')==='{"view":"palate","focus":"families"}', 'B palate-lean → palate/families');
ok(route('highest-rated')==='{"view":"palate","focus":"rated"}', 'B highest-rated → palate/rated');
ok(route('morning-truth')==='{"view":"ritual","focus":"clock"}', 'B morning-truth → ritual/clock');
ok(route('temps')==='{"view":"ritual","focus":"temps"}', 'B temps → ritual/temps');
ok(route('freshness')==='{"view":"tea-detail","focus":"freshness"}', 'B freshness → tea-detail/freshness (R173 B2 — the last unmapped types now land)');
ok(route('haven-t')==='{"view":"tea-detail","focus":"why"}', 'B haven-t → tea-detail/why');
ok(route('little-notice')==='null' && route(null)==='null', 'B a still-unmapped type / a null insight → null (graceful Insights fallback)');
// the Home door reads the route; tea-page routes carry the tea's id so the deep-link lands on THAT tea's page
const leadSrc=fs.readFileSync(path.join(REPO,'steep-dashboard.js'),'utf8');
ok(/route\.view==='tea-detail'/.test(leadSrc) && /openReflection\('tea-detail','\$\{route\.focus\}','\$\{escapeJsArg\(li\.teaId/.test(leadSrc), 'B the lead-door passes li.teaId for tea-detail routes (openReflection with the tea id)');
ok(/:\s*`goView\('insights'\)`/.test(leadSrc), 'B an unmapped type still falls back to Insights (never a broken door)');
// openReflection sets teaDetailFrom='insights' for a tea-page deep-link (Back returns to Insights)
ok(/view==='tea-detail'\) state\.teaDetailFrom = 'insights'/.test(fs.readFileSync(path.join(REPO,'steep-core.js'),'utf8')), 'B a tea-page deep-link sets teaDetailFrom=insights (Back → Insights)');

/* ---- C · routing wiring — HISTORY_VIEWS has palate/ritual, PERSISTED_VIEWS does not ---- */
ok(G('HISTORY_VIEWS.includes("palate") && HISTORY_VIEWS.includes("ritual")'), 'C palate/ritual are in HISTORY_VIEWS (Back returns to the opening tab)');
ok(G('!PERSISTED_VIEWS.includes("palate") && !PERSISTED_VIEWS.includes("ritual")'), 'C the deep pages do NOT persist across reload (sub-views, not tabs)');

/* ---- D · palate families × ratings (SYNTHETIC) — session-count order + per-type average ---- */
seed(
  [{id:'g1',name:'Sencha',type:'green',rating:5},{id:'g2',name:'Gyokuro',type:'green',rating:4},{id:'b1',name:'Keemun',type:'black',rating:3}],
  [{id:'s1',teaId:'g1',date:'2026-05-01T08:00:00Z',steeps:[]},{id:'s2',teaId:'g1',date:'2026-05-02T08:00:00Z',steeps:[]},
   {id:'s3',teaId:'g2',date:'2026-05-03T08:00:00Z',steeps:[]},{id:'s4',teaId:'b1',date:'2026-05-04T08:00:00Z',steeps:[]}]);
{ const html=G('palateFamiliesHTML(computeStats())');
  ok(/Families you reach for/.test(html), 'D the families section renders');
  ok(/avg 4\.5/.test(html), 'D green average = (5+4)/2 = avg 4.5 (per-type mean, not global)');
  ok(/avg 3\.0/.test(html), 'D black average = avg 3.0');
  ok(html.indexOf('Green') < html.indexOf('Black'), 'D ordered by sessions reached-for (green 3 before black 1)'); }

/* ---- E · ritual temps-by-type + vessels (SYNTHETIC) ---- */
seed(
  [{id:'g1',name:'Sencha',type:'green'},{id:'b1',name:'Keemun',type:'black'}],
  [{id:'s1',teaId:'g1',date:'2026-05-01T08:00:00Z',vesselId:'v1',steeps:[{tempC:80},{tempC:80}]},
   {id:'s2',teaId:'g1',date:'2026-05-02T08:00:00Z',vesselId:'v1',steeps:[{tempC:80},{tempC:80}]},
   {id:'s3',teaId:'b1',date:'2026-05-03T18:00:00Z',vesselId:'v2',steeps:[{tempC:95},{tempC:95}]}],
  [{id:'v1',name:'Gaiwan'},{id:'v2',name:'Kyusu'}]);
{ const t=G('ritualTempsHTML(state.sessions)');
  ok(/80°/.test(t) && /95°/.test(t), 'E temps average per type (green 80°, black 95°)');
  ok(t.indexOf('Green') < t.indexOf('Black'), 'E temps ordered by timed-steep count (green 4 before black 2)');
  const v=G('ritualVesselsHTML(state.sessions)');
  ok(/Gaiwan/.test(v) && /×2/.test(v), 'E vessels count by session (Gaiwan ×2)');
  ok(v.indexOf('Gaiwan') < v.indexOf('Kyusu'), 'E vessels ordered by use (Gaiwan 3 before Kyusu 1)');
  // a cold-brew steep is excluded from temps (matches computeLeadInsight)
  seed([{id:'c1',name:'ColdGreen',type:'green'}],[{id:'s1',teaId:'c1',date:'2026-05-01T08:00:00Z',isColdBrew:true,steeps:[{tempC:20},{tempC:20}]}]);
  ok(G('ritualTempsHTML(state.sessions)')==='', 'E a cold-brew session contributes no temperature (excluded)'); }

/* ---- F · REAL data — the views render the spine + anchors, nothing crashes ---- */
function parseCSV(t){const R=[];let r=[],c='',q=false;for(let i=0;i<t.length;i++){const ch=t[i];
 if(q){if(ch==='"'){if(t[i+1]==='"'){c+='"';i++;}else q=false;}else c+=ch;}
 else if(ch==='"')q=true;else if(ch===','){r.push(c);c='';}
 else if(ch==='\n'){r.push(c);R.push(r);r=[];c='';}else if(ch!=='\r')c+=ch;}
 if(c||r.length){r.push(c);R.push(r);}
 const h=(R[0]||[]).map(x=>x.trim());return R.slice(1).filter(x=>x.length===h.length).map(x=>Object.fromEntries(h.map((k,i)=>[k,x[i]])));}
const rd=f=>{ try{ return parseCSV(fs.readFileSync(path.join(__dirname,f),'utf8')); }catch(e){ return null; } };
const teaCSV=rd('teas_rows.csv'), sesCSV=rd('sessions_rows.csv'), steepCSV=rd('steeps_rows.csv'), vesCSV=rd('vessels_rows.csv');
if(teaCSV && sesCSV){
  const OWNER=sesCSV[0].user_id;
  const teas=teaCSV.filter(t=>t.user_id===OWNER).map(t=>({id:t.id,name:t.name,type:t.type,liquor:t.liquor||'',origin:t.origin||'',cultivar:t.cultivar||'',rating:t.rating?Number(t.rating):0}));
  const byS={}; (steepCSV||[]).forEach(x=>{ (byS[x.session_id]=byS[x.session_id]||[]).push({tempC:x.temp_c?Number(x.temp_c):0}); });
  const sessions=sesCSV.filter(s=>s.user_id===OWNER).map(s=>({id:s.id,teaId:s.tea_id,vesselId:s.vessel_id||'',date:s.session_date,isColdBrew:(s.is_cold_brew==='true'||s.is_cold_brew==='t'),rating:s.rating?Number(s.rating):0,steeps:byS[s.id]||[]}));
  const vessels=(vesCSV||[]).filter(v=>v.user_id===OWNER).map(v=>({id:v.id,name:v.name,type:v.type||''}));
  seed(teas, sessions, vessels);
  const ritual=G('viewRitual()'), palate=G('viewPalate()');
  ok(typeof ritual==='string' && ritual.length>0, 'F viewRitual renders over real data');
  ok(/id="reflect-clock"/.test(ritual) && /id="reflect-vessels"/.test(ritual) && /id="reflect-temps"/.test(ritual) && /id="reflect-rhythm"/.test(ritual), 'F ritual carries all four #reflect-* section anchors (deep-link targets)');
  ok(/class="band reflect-band"/.test(ritual), 'F ritual wears the reflection BAND masthead (spine)');
  ok(typeof palate==='string' && /id="reflect-families"/.test(palate) && /id="reflect-rated"/.test(palate), 'F viewPalate renders with its #reflect-* anchors');
  ok(/class="band reflect-band"/.test(palate), 'F palate wears the reflection BAND masthead (spine)');
  console.log('  F real-data: ritual '+ritual.length+' chars · palate '+palate.length+' chars over '+sessions.length+' sessions');
} else { console.log('  F skipped — no real CSVs'); }

/* ---- G · the deep-link SCROLL is non-vm — assert its SOURCE facts (smoke.md certifies the behaviour) ---- */
const coreSrc=fs.readFileSync(path.join(REPO,'steep-core.js'),'utf8');
ok(/state\.reflectFocus\)\s*\{[\s\S]*?getElementById\('reflect-'\+f\)[\s\S]*?scrollIntoView/.test(coreSrc), 'G render() scrolls #reflect-<focus> into view after paint (the deep-link lands ON the section)');
ok(/const f = state\.reflectFocus; state\.reflectFocus = null;/.test(coreSrc), 'G reflectFocus is a one-shot — nulled before the frame, so a later re-render never re-scrolls');
ok(/state\.reflectFocus=null;/.test(coreSrc.replace(/const f = state\.reflectFocus; state\.reflectFocus = null;/,'')), 'G goView also nulls reflectFocus (the stale-focus fence)');

/* ---- J · B2 the tea's page — palate connection + type-aware freshness (R173) ---- */
G("state.teas=[]; state.sessions=[]; state.vessels=[];");
// ttFreshness roast unit — the catalog roast field drives oolong ageing (real cover names so matchTeaType hits)
ok(/"ageing":true/.test(G('JSON.stringify(ttFreshness({name:"Dawang Feng Da Hong Pao", type:"oolong"}))')), 'J ttFreshness: a medium/heavy-roast oolong (Da Hong Pao ← Wuyi) → ageing:true (age-friendly)');
ok(/"ageing":false/.test(G('JSON.stringify(ttFreshness({name:"Ali Shan Fo Shou Dong Pian", type:"oolong"}))')), 'J ttFreshness: a light/floral oolong (Alishan) → ageing:false (fresh-window)');
// the reading framing FITS the type (the sticky-rice fix): fade-fast urgency vs age-friendly holding
function freshOf(name,type,extra){ G("state.teas=[Object.assign({id:'x',name:"+JSON.stringify(name)+",type:"+JSON.stringify(type)+"},"+JSON.stringify(extra||{})+")]; state.activeTeaId='x';"); return G("teaFreshnessHTML(state.teas[0])"); }
{ const yr=String(new Date(Date.parse('2026-08-30')).getFullYear());
  const g = freshOf('Sencha','green',{harvestYear:yr});
  const o = freshOf('Dawang Feng Da Hong Pao','oolong',{harvestYear:yr});
  ok(/peak|Best within|Best enjoyed soon/.test(g) && !/ages|Holding/.test(g), 'J a fade-fast green reads drink-fresh (peak/urgency), not age-friendly');
  ok(/ages|Holding/.test(o) && !/Best within|Best enjoyed soon|freshest/i.test(o), 'J a roasted oolong reads HOLDING, never "freshest now" (the sticky-rice fix)'); }
// palate connection: shared type across favourites → the why line (#reflect-why); too little signal → ''
G("state.teas=[{id:'t',name:'Test Oolong',type:'oolong'},{id:'f1',name:'A',type:'oolong',isFavorite:true},{id:'f2',name:'B',type:'oolong',rating:5}]; state.activeTeaId='t';");
{ const w=G("teaWhyHTML(state.teas[0])"); ok(/id="reflect-why"/.test(w) && /reaching for oolong/i.test(w), 'J palate connection: shared type → the why line, anchored #reflect-why'); }
G("state.teas=[{id:'t',name:'Lonely',type:'green'}]; state.activeTeaId='t';");
ok(G("teaWhyHTML(state.teas[0])")==='', 'J too little palate signal → empty (the curated character stands alone)');
console.log('  J B2 tea-page content: 6 checks');

/* ---- K · Slice C (R174) — terroir census/gravitate + teas-over-time bucketing, both LOGIC ---- */
// terroir — shelf-weighted census groups by country, sorted by count; brew-weighted gravitate counts sessions.
seed([{id:'a',name:'A',origin:'China'},{id:'b',name:'B',origin:'Japan'},{id:'c',name:'C',origin:'China'}]);
{ const cen=JSON.parse(G('JSON.stringify(terroirCensus())'));
  ok(cen.length===2 && cen[0].country==='China' && cen[0].n===2 && cen[1].country==='Japan', 'K terroirCensus groups by country, sorted by count desc'); }
seed([{id:'x',name:'Zzz'}]);
ok(G('terroirCensus().length')===0, 'K terroirCensus empty when no origin resolves (never-guess)');
seed([{id:'a',name:'A',origin:'China'},{id:'b',name:'B',origin:'Japan'}], [{id:'s1',teaId:'a',date:'2026-08-01'},{id:'s2',teaId:'a',date:'2026-08-02'},{id:'s3',teaId:'b',date:'2026-08-03'}]);
{ const g=JSON.parse(G('JSON.stringify(terroirGravitate())'));
  ok(g[0].country==='China' && g[0].n===2, 'K terroirGravitate is brew-weighted (sessions per origin)'); }
// viewOrigins now renders as terroir: reflect-band masthead + span/reach anchors (country-tier, no map)
seed([{id:'a',name:'A',origin:'China'}], [{id:'s1',teaId:'a',date:'2026-08-01'}]);
{ const v=G('viewOrigins()');
  ok(/reflect-band/.test(v) && /Your terroir/.test(v) && /id="reflect-span"/.test(v) && /id="reflect-reach"/.test(v), 'K viewOrigins renders as terroir — reflect-band masthead + span/reach anchors'); }
// teas over time — month bucketing (sessions + acquisitions), arrivals chronology, then-vs-now gate
seed([{id:'a',name:'A',purchaseDate:'2026-06-15'}], [{id:'s1',teaId:'a',date:'2026-06-01'},{id:'s2',teaId:'a',date:'2026-07-01'},{id:'s3',teaId:'a',date:'2026-07-15'}]);
{ const ser=JSON.parse(G('JSON.stringify(overtimeSeries())'));
  ok(ser.length===2 && ser[0].month==='2026-06' && ser[0].sessions===1 && ser[0].acquired===1 && ser[1].month==='2026-07' && ser[1].sessions===2, 'K overtimeSeries buckets sessions + acquisitions by month, sorted'); }
seed([{id:'a',name:'A'},{id:'b',name:'B'}], [{id:'s1',teaId:'a',date:'2026-06-01'},{id:'s2',teaId:'b',date:'2026-07-01'},{id:'s3',teaId:'a',date:'2026-08-01'}]);
{ const arr=JSON.parse(G('JSON.stringify(overtimeArrivals().map(function(r){return r.tea.id;}))'));
  ok(arr[0]==='b' && arr[1]==='a', 'K overtimeArrivals is first-cup chronology, newest first (a first-seen June, b July)'); }
seed([{id:'a',name:'A',type:'green'}], [{id:'s1',teaId:'a',date:'2026-07-01'},{id:'s2',teaId:'a',date:'2026-08-01'}]);
ok(G('overtimeThenVsNow()')===null, 'K then-vs-now gated: <3 distinct months → null (never-guess)');
seed([{id:'a',name:'A',type:'green'},{id:'b',name:'B',type:'oolong'}], [{id:'s1',teaId:'a',date:'2026-06-01'},{id:'s2',teaId:'a',date:'2026-07-01'},{id:'s3',teaId:'b',date:'2026-08-01'},{id:'s4',teaId:'b',date:'2026-08-02'}]);
{ const t=JSON.parse(G('JSON.stringify(overtimeThenVsNow())'));
  ok(t && t.earlyType==='green' && t.recentType==='oolong', 'K then-vs-now splits early vs recent by month median'); }
// viewTimeline renders the spine + anchors; the Insights door gates on ≥2 months
seed([{id:'a',name:'A',type:'green'}], [{id:'s1',teaId:'a',date:'2026-06-01'},{id:'s2',teaId:'a',date:'2026-07-01'},{id:'s3',teaId:'a',date:'2026-08-01'}]);
{ const tl=G('viewTimeline()');
  ok(/reflect-band/.test(tl) && /Teas over time/.test(tl) && /id="reflect-timeline"/.test(tl) && /id="reflect-arrivals"/.test(tl), 'K viewTimeline renders the spine + #reflect-* anchors'); }
ok(/openReflection\('timeline'/.test(G('insOvertimeHTML()')), 'K insOvertimeHTML is the door into the timeline (≥2 months)');
seed([{id:'a',name:'A'}], [{id:'s1',teaId:'a',date:'2026-08-01'}]);
ok(G('insOvertimeHTML()')==='', 'K insOvertimeHTML absent under 2 months (never-guess)');
ok(G('HISTORY_VIEWS.includes("timeline")'), 'K timeline is in HISTORY_VIEWS (Back returns to Insights)');
console.log('  K Slice C terroir + teas-over-time: 12 checks');

console.log('');
if(failed){ console.log('REFLECTION TESTS FAILED — '+failed+' failed, '+passed+' passed'); process.exit(1); }
console.log('ALL REFLECTION TESTS PASSED ('+passed+' passed)');
