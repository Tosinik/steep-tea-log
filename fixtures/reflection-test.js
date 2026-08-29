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
const SRC=['steep-knowledge.js','steep-tea-types.js','steep-core.js','steep-teas.js','steep-insights.js','steep-dashboard.js']
  .map(f=>fs.readFileSync(path.join(REPO,f),'utf8')).join('\n;\n');
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
ok(route('freshness')==='null', 'B freshness → null (tea-page destination, Slice B — a graceful Insights fallback, never a broken door)');
ok(route('haven-t')==='null' && route('little-notice')==='null', 'B other unmapped types → null');
ok(route(null)==='null', 'B a null insight → null');
// the Home door reads the route: mapped → openReflection, unmapped → goView('insights')
const leadSrc=fs.readFileSync(path.join(REPO,'steep-dashboard.js'),'utf8');
ok(/route\s*\?\s*`openReflection\(/.test(leadSrc) && /:\s*`goView\('insights'\)`/.test(leadSrc), 'B the lead-door onclick branches on the route (openReflection when mapped, Insights otherwise)');

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

console.log('');
if(failed){ console.log('REFLECTION TESTS FAILED — '+failed+' failed, '+passed+' passed'); process.exit(1); }
console.log('ALL REFLECTION TESTS PASSED ('+passed+' passed)');
