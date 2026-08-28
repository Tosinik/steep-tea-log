/* PERMANENT validation — R108: every view renders, on real data and on an empty account.
 *
 * WHY THIS EXISTS. `statusLine` returned a string until B3 made it a structured `{text, tone}`
 * reading. Three slices later H1 wrote the shopping rows against the old shape and every row
 * rendered `[object Object]` — on first paint, in the middle of the screen. Nothing was wrong with
 * the assertions on `statusLine` itself and nothing ever would be: it was a CONTRACT CHANGE WITH NO
 * CONSUMER TEST, a third gap shape beside R104's (a guard whose reach stopped short) and R105's
 * (instruments exempting themselves). More assertions on the helper cannot close it. Only something
 * that renders the view can.
 *
 * At the time of writing, **14 of 15 top-level views had no suite calling them** — `viewTeas` was
 * the only exception. Component coverage is wide and is NOT the same thing: a component test cannot
 * see a type change at the seam between a helper and a view, which is precisely where this landed.
 *
 * WHAT IT ASSERTS, deliberately shallow: the view renders without throwing, returns a string, and
 * emits none of `[object Object]`, `[object `, `undefined`, `NaN`. It does not check layout, copy or
 * behaviour — those belong to the per-surface suites, which are the deep ones. This is the smoke
 * alarm, not the inspection: it is worth having because it is the only thing that fires when a
 * shared helper changes shape underneath a consumer nobody re-read.
 *
 * TWO PASSES, and the second is the one that finds things. Real data exercises the populated path;
 * an EMPTY account exercises every "no rows yet" branch, which is where `undefined` and `NaN` come
 * from — a division by zero, a `[0]` on an empty array, a field read off a row that isn't there.
 *
 * Run: node fixtures/render-smoke-test.js   (exit non-zero on any failure)
 * Run fixtures/export-gate-test.js FIRST.
 */
const fs=require('fs'), path=require('path'), vm=require('vm');
const repo=path.join(__dirname,'..');

// Load order mirrors index.html: data+core first, features after. steep-data.js is skipped (it is an
// IIFE around the Supabase client and needs a live SDK); SteepDB is stubbed below instead.
const FILES=['steep-origins-map.js','steep-knowledge.js','steep-tea-types.js','steep-core.js','steep-settings.js',
  'steep-dashboard.js','steep-insights.js','steep-teas.js','steep-reference.js','steep-shopping.js',
  'steep-passport.js','steep-social.js','steep-sessions.js'];
const SRC=FILES.map(f=>fs.readFileSync(path.join(repo,f),'utf8')).join('\n;\n');

const ctx={};ctx.window=ctx;ctx.globalThis=ctx;ctx.console=console;
ctx.document={documentElement:{setAttribute(){},getAttribute(){return'light'}},
  getElementById:()=>null,querySelectorAll:()=>[],querySelector:()=>null,
  addEventListener(){}, createElement:()=>({style:{},setAttribute(){},appendChild(){},classList:{add(){},remove(){}}})};
ctx.localStorage={getItem:()=>null,setItem(){},removeItem(){}};
ctx.matchMedia=()=>({matches:false});ctx.navigator={onLine:true};
ctx.setTimeout=()=>{};ctx.clearTimeout=()=>{};ctx.setInterval=()=>{};ctx.clearInterval=()=>{};
ctx.addEventListener=()=>{};
ctx.SteepDB={ newId:()=>'00000000-0000-4000-8000-000000000000', getUser:()=>({id:'u'}),
  putTea(){return Promise.resolve()}, putSession(){return Promise.resolve()},
  putWishItem(){return Promise.resolve()}, removeWishItem(){return Promise.resolve()},
  saveSettings(){return Promise.resolve()}, pendingWrites:()=>0 };
vm.createContext(ctx);vm.runInContext(SRC,ctx);
const G = e => vm.runInContext(e, ctx);
const S = G('state');

let passed=0, failures=0;
const ok=(c,m)=>{ if(c){passed++;} else {failures++; console.log('  FAIL: '+m);} };

function parseCSV(t){const R=[];let r=[],c='',q=false;for(let i=0;i<t.length;i++){const ch=t[i];
 if(q){if(ch==='"'){if(t[i+1]==='"'){c+='"';i++;}else q=false;}else c+=ch;}
 else if(ch==='"')q=true;else if(ch===','){r.push(c);c='';}
 else if(ch==='\n'){r.push(c);R.push(r);r=[];c='';}else if(ch!=='\r')c+=ch;}
 if(c||r.length){r.push(c);R.push(r);}
 const h=(R[0]||[]).map(x=>x.trim());
 return R.slice(1).filter(x=>x.length===h.length).map(x=>Object.fromEntries(h.map((k,i)=>[k,x[i]])));}
const rows=f=>parseCSV(fs.readFileSync(path.join(__dirname,f),'utf8'));

const SES=rows('sessions_rows.csv'), TEA=rows('teas_rows.csv'), VES=rows('vessels_rows.csv'),
      STP=rows('steeps_rows.csv'), WSH=rows('wishlist_rows.csv'), USR=rows('user_settings_rows.csv'),
      PRF=rows('profiles_rows.csv'), FOL=rows('follows_rows.csv');
const OWNER=SES[0].user_id;                                   // R69: derived, never hardcoded
const bool=v=>v==='true'||v==='t';

/* Every view this app can route to. `render()`'s own if/else chain is the source of this list —
   a view added there and not added here is the gap this suite exists to prevent. */
const VIEWS=[
  ['viewDashboard','dashboard'],['viewInsights','insights'],['viewTeas','teas'],
  ['viewTeaDetail','tea-detail'],['viewSessions','sessions'],['viewSessionDetail','session-detail'],
  ['viewSessionEdit','session-edit'],['viewSessionFlow','session'],['viewFriends','friends'],
  ['viewShopping','shopping'],['viewSpend','spend'],['viewWrapped','wrapped'],
  ['viewVessels','vessels'],['viewOrigins','origins'],['viewAchievements','achievements'],
  ['viewPickTea','pick-tea'],['viewPickVessel','pick-vessel']    // v4.21 (#14): the R58 picker screens
];
// The output smells that mean a value reached the DOM in the wrong shape.
const SMELLS=[['[object Object]','a value was interpolated instead of a field of it'],
              ['[object ','an object of any class reached the markup'],
              ['undefined','a missing field was printed rather than omitted'],
              ['NaN','arithmetic on an absent or non-numeric value']];

function seedReal(){
  const teas=TEA.filter(t=>t.user_id===OWNER).map(t=>({id:t.id,name:t.name,type:t.type,origin:t.origin||'',
    source:t.source||'',amountGrams:+t.amount_grams||0,rating:+t.rating||0,harvestYear:t.harvest_year||'',
    harvestSeason:t.harvest_season||'',cultivar:t.cultivar||'',costTotal:+t.cost_total||0,
    costOriginalGrams:+t.cost_original_grams||0,brewGuide:t.brew_guide||'',description:t.description||'',
    isFavorite:bool(t.is_favorite),wouldRebuy:bool(t.would_rebuy),purchaseType:t.purchase_type||'first',
    image:t.image_data||null,purchaseDate:t.purchase_date||'',leafForm:t.leaf_form||'',
    openedDate:t.opened_date||'',dateAdded:t.created_at}));
  const vessels=VES.map(v=>({id:v.id,name:v.name,type:v.type,material:v.material||'',
    capacityMl:v.capacity_ml?+v.capacity_ml:null,image:v.image_data||null}));
  const byId={};
  const sessions=SES.map(r=>{const o={id:r.id,teaId:r.tea_id,vesselId:r.vessel_id,
    date:r.session_date.replace(' ','T').replace('+00','Z'),isColdBrew:bool(r.is_cold_brew),
    gramsUsed:+r.grams_used||0,rating:+r.rating||0,isShared:bool(r.is_shared),mood:r.mood||null,
    waterMl:r.water_ml?+r.water_ml:null,brewStyle:r.brew_style||'',teaName:r.tea_name||'',
    teaType:r.tea_type||'',vesselName:r.vessel_name||'',description:r.description||'',
    feedback:r.feedback||null,tags:[],photoUrl:r.photo_url||null,
    infusionCount:r.infusion_count?+r.infusion_count:null,steeps:[]};byId[o.id]=o;return o;});
  STP.forEach(x=>{const s=byId[x.session_id];if(s)s.steeps.push({timeSeconds:+x.time_seconds||0,
    tempC:x.temp_c?+x.temp_c:null,description:x.description||'',tags:[],feedback:x.feedback||null});});
  S.teas=teas;S.vessels=vessels;S.sessions=sessions;
  S.wishlist=WSH.map(w=>({id:w.id,name:w.name,vendor:w.vendor||'',type:w.tea_type||'',
    note:w.note||'',done:bool(w.done),createdAt:w.created_at}));
  const own=USR.find(u=>u.user_id===OWNER);
  G('state.settings=Object.assign({},DEFAULT_SETTINGS);');
  if(own){ try{ Object.assign(S.settings, JSON.parse(own.settings)); }catch(e){} }
  const profs={};PRF.forEach(p=>profs[p.id]={id:p.id,username:p.username,displayName:p.display_name||'',avatarUrl:p.avatar_url||null});
  S.social={loaded:true,busy:false,profile:profs[OWNER],
    following:FOL.filter(f=>f.follower_id===OWNER).map(f=>f.followee_id),
    followers:FOL.filter(f=>f.followee_id===OWNER).map(f=>f.follower_id),
    profiles:profs,feed:{sessions:[],profiles:{},following:[],hasMore:false},
    passes:{sent:[],received:[],profiles:{}},passesFailed:false,
    search:null,searchOpen:false,profileEditOpen:false,draft:null,err:null};
  S.activeTeaId=teas[0].id;
  S.activeSessionId=sessions[0].id;
  S.editingSession=JSON.parse(JSON.stringify(sessions[0]));
  S.sessionDraft=null;
  return {teas:teas.length,sessions:sessions.length};
}
function seedEmpty(){
  S.teas=[];S.vessels=[];S.sessions=[];S.wishlist=[];S.tagLibrary=[];
  G('state.settings=Object.assign({},DEFAULT_SETTINGS);');
  S.activeTeaId=null;S.activeSessionId=null;S.editingSession=null;S.sessionDraft=null;
  S.social={loaded:true,busy:false,profile:{id:'u',username:'you',displayName:'',avatarUrl:null},
    following:[],followers:[],profiles:{},feed:{sessions:[],profiles:{},following:[],hasMore:false},
    passes:{sent:[],received:[],profiles:{}},passesFailed:false,
    search:null,searchOpen:false,profileEditOpen:false,draft:null,err:null};
}
const LEN={};
function runPass(label){
  console.log('\n'+label);
  VIEWS.forEach(([fn,view])=>{
    S.view=view;
    let out=null, threw=null;
    try{ out = G(fn+'()'); }catch(e){ threw = e; }
    if(threw){ ok(false, fn+' threw: '+(threw && threw.message)); return; }
    ok(typeof out==='string', fn+' returns a string (got '+typeof out+')');
    if(typeof out!=='string') return;
    SMELLS.forEach(([s,why])=>ok(out.indexOf(s)<0, fn+' emits "'+s+'" — '+why));
    LEN[label]=LEN[label]||{}; LEN[label][fn]=out.length;
  });
}

console.log('RENDER SMOKE — R108: a contract change with no consumer test');
const shape=seedReal();
console.log('  seeded '+shape.teas+' teas · '+shape.sessions+' sessions · owner '+OWNER.slice(0,8));
runPass('A · real data, every view render() can route to');
seedEmpty();
runPass('B · an EMPTY account — the "no rows yet" branches');

/* C — the suite must be able to fail, or it is the instrument R105 warns about. Each smell is
   proven detectable on a string that carries it, so a future refactor of the checker itself
   cannot quietly turn the whole file into a no-op. */
console.log('\nC · the checker can fail');
SMELLS.forEach(([s])=>ok(('<div>'+s+'</div>').indexOf(s)>=0, 'the "'+s+'" check matches when present'));
ok(VIEWS.length===17, 'C: all 17 top-level views are listed — a new view added to render() must be added here too (got '+VIEWS.length+')');
// The list must match render()'s own routing, or a view can be added there and silently skipped here.
const coreSrc=fs.readFileSync(path.join(repo,'steep-core.js'),'utf8');
const routed=[...coreSrc.matchAll(/body\s*=\s*(view[A-Z]\w*)\s*\(/g)].map(m=>m[1]);
const listed=new Set(VIEWS.map(v=>v[0]));
const unlisted=[...new Set(routed)].filter(v=>!listed.has(v));
ok(unlisted.length===0, 'C: every view render() routes to is covered here — unlisted: '+unlisted.join(', '));

/* D — the check that stops C from being decorative. Every assertion above passes trivially against
   an EMPTY STRING, so a view that silently returned '' would sail through the whole suite while
   rendering a blank screen. On real data the main surfaces must produce real markup. The threshold
   is deliberately low: this is asserting "something rendered", not "the right thing rendered". */
console.log('\nD · the views actually produced markup on real data');
seedReal();
const SUBSTANTIAL=['viewDashboard','viewInsights','viewTeas','viewTeaDetail','viewSessions',
                   'viewSessionDetail','viewShopping','viewWrapped','viewFriends','viewVessels'];
SUBSTANTIAL.forEach(fn=>{
  let out=''; try{ out=G(fn+'()'); }catch(e){ out=''; }
  ok(typeof out==='string' && out.length>200 && /<\w/.test(out),
     'D '+fn+' rendered markup on real data (got '+(out||'').length+' chars) — every other check here passes against an empty string');
});
console.log('  D substantial output: '+SUBSTANTIAL.length+' checks');

console.log('');
if(failures){ console.log('FAILED: '+failures+' of '+(passed+failures)); process.exit(1); }
console.log('ALL RENDER-SMOKE TESTS PASSED ('+passed+' passed)');
