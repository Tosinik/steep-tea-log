/* PERMANENT validation — #16 (v3.82) period lens on the stat grid. Committed (graceful CSV skip).
 *
 * Invariants guarded:
 *  - CALENDAR windows, not rolling: week = Monday 00:00 local (the Home week card's anchor, so both
 *    surfaces say the same number under the same word), month = the 1st 00:00 local. A session AT
 *    the boundary is IN (date >= start); one ms earlier is out. Pinned through the PRODUCTION card
 *    filter, not a re-implementation.
 *  - gridStats windows all six numbers honestly over a filtered sessions array; teas brewed =
 *    distinct teaIds in the window; days logged = distinct local days in the window.
 *  - computeStats delegates its six all-time fields to gridStats (single writer — the grid's
 *    all-time numbers and the achievements inputs can never drift apart).
 *  - tealog_statPeriod persistence whitelists week|month, defaults 'all' on absence or garbage.
 *  - An empty window renders quiet zeros (0 / 0.0), never NaN, no apology copy.
 *  - Label honesty: the card carries an eyebrow naming the active window, and the grid's week
 *    Sessions equals the Home week card's number.
 *
 * Run: node fixtures/stat-period-test.js   (exit non-zero on any failure)
 */
const fs=require('fs'), path=require('path'), vm=require('vm');
const REPO=path.resolve(__dirname,'..');
const SRC=['steep-knowledge.js','steep-core.js','steep-dashboard.js','steep-insights.js','steep-teas.js']
  .map(f=>fs.readFileSync(path.join(REPO,f),'utf8')).join('\n;\n');
const LS={};   // mutable localStorage backing store so gridPeriod()/setGridPeriod() are observable
const ctx={}; ctx.window=ctx; ctx.globalThis=ctx; ctx.console=console;
ctx.document={documentElement:{setAttribute(){},getAttribute(){return 'light';}},getElementById:()=>null,querySelectorAll:()=>[],
  createElement:()=>({style:{},setAttribute(){},appendChild(){},classList:{add(){}}})};
ctx.localStorage={getItem:k=>LS[k]===undefined?null:LS[k], setItem:(k,v)=>{LS[k]=String(v);}, removeItem:k=>{delete LS[k];}};
ctx.matchMedia=()=>({matches:false}); ctx.navigator={onLine:true};
ctx.setTimeout=()=>{}; ctx.clearTimeout=()=>{}; ctx.setInterval=()=>{}; ctx.clearInterval=()=>{};
ctx.addEventListener=()=>{};
vm.createContext(ctx); vm.runInContext(SRC,ctx);
vm.runInContext('state.settings=Object.assign({},DEFAULT_SETTINGS); render=function(){};',ctx);

function parseCSV(t){const R=[];let r=[],c='',q=false;for(let i=0;i<t.length;i++){const ch=t[i];
 if(q){if(ch==='"'){if(t[i+1]==='"'){c+='"';i++;}else q=false;}else c+=ch;}
 else if(ch==='"')q=true;else if(ch===','){r.push(c);c='';}
 else if(ch==='\n'){r.push(c);R.push(r);r=[];c='';}else if(ch!=='\r')c+=ch;}
 if(c||r.length){r.push(c);R.push(r);}
 const h=R[0];return R.slice(1).filter(x=>x.length===h.length)
   .map(x=>Object.fromEntries(h.map((k,i)=>[k,x[i]])));}

let passed=0, failures=0;
const ok=(c,m)=>{ if(c)passed++; else{failures++;console.log('  FAIL: '+m);} };
const setState=obj=>vm.runInContext('state.teas='+JSON.stringify(obj.teas||[])+';state.vessels='+JSON.stringify(obj.vessels||[])+';state.sessions='+JSON.stringify(obj.sessions||[])+';',ctx);
const gws=(p,iso)=>vm.runInContext(`(function(){const r=gridWindowStart('${p}'${iso?`, new Date('${iso}')`:''}); return r?r.getTime():null;})()`,ctx);
const totalsHTML=()=>vm.runInContext('dashCardsHome(computeStats()).totals',ctx);
const numsOf=html=>[...html.matchAll(/<div class="num">([^<]*)<\/div>/g)].map(m=>m[1]);

// ---- A. gridWindowStart calendar boundaries (pinned `now` values — deterministic forever) ----
// 2026-07-15 is a Wednesday; 2026-07-13 the Monday before it; 2026-08-01 a Saturday.
ok(gws('week','2026-07-15T14:30:00')===new Date(2026,6,13).getTime(), 'A1 Wednesday → week starts the Monday before, 00:00 local');
ok(gws('month','2026-07-15T14:30:00')===new Date(2026,6,1).getTime(), 'A2 mid-month → month starts the 1st, 00:00 local');
ok(gws('week','2026-07-13T09:00:00')===new Date(2026,6,13).getTime(), 'A3 a Monday maps to its own midnight (not last week)');
ok(gws('week','2026-07-19T23:59:59')===new Date(2026,6,13).getTime(), 'A4 Sunday night still belongs to the Monday-anchored week');
ok(gws('month','2026-08-01T10:00:00')===new Date(2026,7,1).getTime(), 'A5 the 1st maps to its own midnight');
ok(gws('week','2026-08-01T10:00:00')===new Date(2026,6,27).getTime(), 'A6 week may start in the PREVIOUS month (Aug 1 → Mon Jul 27)');
ok(gws('all','2026-07-15T14:30:00')===null, 'A7 all-time → no window');
console.log('  A window boundaries: 7 checks');

// ---- B. per-stat windowing through the PRODUCTION card (live now; membership via the >= rule) ----
const wsMs=gws('week'), msMs=gws('month'), nowIso=new Date().toISOString();
const VES={v100:100, v200:200};
const SEEDS=[
  // in both windows (today): 3 steeps, 5g, 100ml vessel
  {id:'p1', teaId:'TA', vesselId:'v100', date:nowIso, steeps:[{},{},{}], gramsUsed:5},
  // EXACTLY Monday 00:00:00.000 — the boundary pin: IN the week
  {id:'p2', teaId:'TB', vesselId:'v200', date:new Date(wsMs).toISOString(), infusionCount:2, gramsUsed:4},
  // one ms before the week — OUT of the week
  {id:'p3', teaId:'TA', vesselId:'v100', date:new Date(wsMs-1).toISOString(), steeps:[{}], gramsUsed:3},
  // EXACTLY the 1st 00:00:00.000 — IN the month
  {id:'p4', teaId:'TC', vesselId:'v200', date:new Date(msMs).toISOString(), infusionCount:1, gramsUsed:2},
  // one ms before the month — OUT of the month
  {id:'p5', teaId:'TB', vesselId:'v100', date:new Date(msMs-1).toISOString(), steeps:[{},{}], gramsUsed:6},
  // ancient + vessel-less (0 liters) — all-time only
  {id:'p6', teaId:'TC', vesselId:'', date:new Date(Date.now()-400*86400000).toISOString(), infusionCount:4, gramsUsed:8},
  // same instant as p1 (distinct-days + gramsless-session coverage)
  {id:'p7', teaId:'TA', vesselId:'v200', date:nowIso, infusionCount:2}
];
setState({ teas:[{id:'TA',name:'A',type:'green'},{id:'TB',name:'B',type:'black'},{id:'TC',name:'C',type:'oolong'}],
  vessels:[{id:'v100',name:'Gaiwan',capacityMl:100},{id:'v200',name:'Kyusu',capacityMl:200}], sessions:SEEDS });
// membership by the documented rule; expected stats computed independently of gridStats
const memb=start=>start==null?SEEDS.slice():SEEDS.filter(s=>new Date(s.date).getTime()>=start);
const stepsOf=s=>s.steeps?s.steeps.length:(Number(s.infusionCount)||0);
const expect=list=>({ sessions:list.length, steeps:list.reduce((a,s)=>a+stepsOf(s),0),
  grams:list.reduce((a,s)=>a+(Number(s.gramsUsed)||0),0),
  liters:list.reduce((a,s)=>a+((VES[s.vesselId]||0)*stepsOf(s))/1000,0),
  days:new Set(list.map(s=>new Date(s.date).toDateString())).size,
  teas:new Set(list.map(s=>s.teaId)).size });
const wSet=memb(wsMs);
ok(wSet.some(s=>s.id==='p2') && !wSet.some(s=>s.id==='p3'), 'B1 boundary: Monday 00:00.000 in, 23:59:59.999 Sunday out');
ok(memb(msMs).some(s=>s.id==='p4') && !memb(msMs).some(s=>s.id==='p5'), 'B2 boundary: the 1st 00:00.000 in, prior month last ms out');
[['all',null,'All-time'],['month',msMs,'This month'],['week',wsMs,'This week']].forEach(([p,start,eyebrow])=>{
  LS.tealog_statPeriod=p;
  const html=totalsHTML(), n=numsOf(html), e=expect(memb(start));
  ok(n.length===6, 'B '+p+': six stat tiles render');
  ok(n[0]===String(e.sessions), 'B '+p+' sessions = '+e.sessions+' (got '+n[0]+')');
  ok(n[1]===String(e.steeps), 'B '+p+' infusions = '+e.steeps+' (got '+n[1]+')');
  ok(n[2]===String(e.days), 'B '+p+' days logged = '+e.days+' (got '+n[2]+')');
  ok(n[3]===e.grams.toFixed(1), 'B '+p+' grams = '+e.grams.toFixed(1)+' (got '+n[3]+')');
  ok(n[4]===e.liters.toFixed(1), 'B '+p+' liters = '+e.liters.toFixed(1)+' (got '+n[4]+')');
  ok(n[5]===String(e.teas), 'B '+p+' teas brewed = '+e.teas+' (got '+n[5]+')');
  ok(html.indexOf('>'+eyebrow+'<')>-1, 'B '+p+' eyebrow says "'+eyebrow+'"');
  ok(new RegExp('class="density-seg active"[^>]*setGridPeriod\\(\'' +p+ '\'\\)').test(html), 'B '+p+' active segment matches');
});
// Decision-1 agreement: the grid's week Sessions equals the Home week card's number.
LS.tealog_statPeriod='week';
(function(){ const cards=vm.runInContext('dashCardsHome(computeStats())',ctx);
  const wk=(cards.week.match(/<div class="week-num">(\d+)<\/div>/)||[])[1];
  ok(wk===numsOf(cards.totals)[0], 'B9 week grid sessions === Home week card ('+wk+')'); })();
console.log('  B per-stat windowing (production card): '+(2+3*8+1)+' checks');

// ---- C. single writer — computeStats delegates its six all-time fields to gridStats ----
(function(){ const same=vm.runInContext(`(function(){ const g=gridStats(state.sessions), c=computeStats();
  return g.totalSessions===c.totalSessions && g.totalSteeps===c.totalSteeps && g.totalGrams===c.totalGrams
    && g.totalLiters===c.totalLiters && g.days.size===c.days.size && g.uniqueTeas===c.uniqueTeas; })()`,ctx);
  ok(same, 'C1 gridStats(all sessions) ≡ computeStats() on all six fields'); })();
console.log('  C all-time equivalence: 1 check');

// ---- D. empty window — quiet zeros, never NaN, no prompt to brew ----
setState({ teas:[{id:'TC',name:'C',type:'oolong'}], vessels:[], sessions:[SEEDS[5]] });   // only the 400-day-old session
['week','month'].forEach(p=>{
  LS.tealog_statPeriod=p;
  const html=totalsHTML(), n=numsOf(html);
  ok(n.join('|')==='0|0|0|0.0|0.0|0', 'D '+p+' empty window → quiet zeros (got '+n.join('|')+')');
  ok(html.indexOf('NaN')<0, 'D '+p+' no NaN');
  // calm-first: nothing but the standard furniture — strip eyebrow/segments/labels/digits and
  // assert no empty-state copy remains
  const rest=html.replace(/<[^>]*>/g,' ').replace(/All-time|This month|This week|Month|Week|Sessions|Infusions|Days logged|Grams brewed|Liters \(est\.\)|Teas brewed|[0-9.]/g,'').trim();
  ok(rest==='', 'D '+p+' no apology/prompt copy (leftover: "'+rest+'")');
});
LS.tealog_statPeriod='all';
ok(numsOf(totalsHTML())[0]==='1', 'D all-time still shows the old session');
console.log('  D empty window: 7 checks');

// ---- E. persistence — whitelist week|month, default all, garbage-safe ----
delete LS.tealog_statPeriod;
ok(vm.runInContext('gridPeriod()',ctx)==='all', 'E1 no key → all (default)');
LS.tealog_statPeriod='yesterday';
ok(vm.runInContext('gridPeriod()',ctx)==='all', 'E2 garbage value → all');
LS.tealog_statPeriod='week';  ok(vm.runInContext('gridPeriod()',ctx)==='week', 'E3 week honored');
LS.tealog_statPeriod='month'; ok(vm.runInContext('gridPeriod()',ctx)==='month', 'E4 month honored');
vm.runInContext('setGridPeriod("bogus")',ctx); ok(LS.tealog_statPeriod==='all', 'E5 setter whitelists garbage to all');
vm.runInContext('setGridPeriod("week")',ctx);  ok(LS.tealog_statPeriod==='week', 'E6 setter persists week');
console.log('  E persistence: 6 checks');

// ---- F. real data (graceful skip) — window monotonicity per stat over the actual rows ----
const need=['teas_rows.csv','sessions_rows.csv','vessels_rows.csv'].map(f=>path.join(__dirname,f));
if(need.every(f=>fs.existsSync(f))){
  const teas=parseCSV(fs.readFileSync(need[0],'utf8')).map(r=>({id:r.id,name:r.name,type:(r.type||'').toLowerCase(),amountGrams:Number(r.amount_grams)||0,isFavorite:r.is_favorite==='true',wouldRebuy:r.would_rebuy==='true',rating:Number(r.rating)||0,costTotal:Number(r.cost_total)||0,costOriginalGrams:Number(r.cost_original_grams)||0}));
  const sess=parseCSV(fs.readFileSync(need[1],'utf8')).map(r=>({id:r.id,teaId:r.tea_id,vesselId:r.vessel_id,date:r.session_date,gramsUsed:Number(r.grams_used)||0,infusionCount:Number(r.infusion_count)||0,rating:Number(r.rating)||0,isColdBrew:r.is_cold_brew==='true'}));
  const vess=parseCSV(fs.readFileSync(need[2],'utf8')).map(r=>({id:r.id,name:r.name,capacityMl:Number(r.capacity_ml)||0}));
  setState({teas,vessels:vess,sessions:sess});
  const G=p=>vm.runInContext(`(function(){ const st=gridWindowStart('${p}');
    const g=gridStats(st?state.sessions.filter(s=>new Date(s.date)>=st):state.sessions);
    return [g.totalSessions,g.totalSteeps,g.totalGrams,g.totalLiters,g.days.size,g.uniqueTeas]; })()`,ctx);
  const W=G('week'), M=G('month'), A=G('all');
  const NAMES=['sessions','infusions','grams','liters','days','teas'];
  NAMES.forEach((nm,i)=>{
    ok(W[i]<=M[i] && M[i]<=A[i], 'F1 '+nm+' monotone week ≤ month ≤ all ('+W[i]+' ≤ '+M[i]+' ≤ '+A[i]+')');
    ok([W[i],M[i],A[i]].every(Number.isFinite), 'F2 '+nm+' finite in every window');
  });
  ok(W[4]<=7, 'F3 week window spans at most 7 distinct days (got '+W[4]+')');
  ['all','month','week'].forEach(p=>{ LS.tealog_statPeriod=p;
    ok(totalsHTML().indexOf('NaN')<0, 'F4 '+p+' card over real rows has no NaN'); });
  console.log('  F real data: '+(NAMES.length*2+1+3)+' checks over '+sess.length+' sessions');
} else {
  console.log('  F real data: SKIPPED, 16 checks not run (need teas/sessions/vessels _rows.csv)');
}

// ---- G. #24 (v3.85) — liters respect the per-session water override (synthetic by necessity:
// the real export predates the fix, so no row carries water_ml yet — flagged per convention) ----
setState({ teas:[{id:'TA',name:'A',type:'green'}],
  vessels:[{id:'v100',name:'Gaiwan',capacityMl:100},{id:'v200',name:'Kyusu',capacityMl:200}], sessions:[] });
const litersOf=s=>vm.runInContext('gridStats(['+JSON.stringify(s)+']).totalLiters',ctx);
const now=new Date().toISOString();
ok(Math.abs(litersOf({id:'g1',teaId:'TA',vesselId:'v200',date:now,steeps:[{},{},{}],gramsUsed:5,waterMl:90})-0.27)<1e-9,
  'G1 override wins: 90ml × 3 steeps = 0.27 L, not the 200ml vessel\'s 0.6 (the #24 shape)');
ok(Math.abs(litersOf({id:'g2',teaId:'TA',vesselId:'v200',date:now,steeps:[{},{}],gramsUsed:4})-0.4)<1e-9,
  'G2 no override → vessel capacity fallback (200ml × 2 = 0.4 L)');
ok(Math.abs(litersOf({id:'g3',teaId:'TA',vesselId:'v200',date:now,steeps:[{},{}],gramsUsed:4,waterMl:'90'})-0.18)<1e-9,
  'G3 string waterMl (edit-modal path pre-remap) coerces, not NaN');
ok(Math.abs(litersOf({id:'g4',teaId:'TA',vesselId:'',date:now,infusionCount:1,gramsUsed:8,isColdBrew:true,waterMl:500})-0.5)<1e-9,
  'G4 vessel-less session counts via its override (0 L before #24); cold brew participates unchanged');
ok(Math.abs(litersOf({id:'g5',teaId:'TA',vesselId:'v100',date:now,steeps:[{}],gramsUsed:3,waterMl:0})-0.1)<1e-9,
  'G5 non-positive override never zeroes the estimate — capacity fallback');
setState({ teas:[{id:'TA',name:'A',type:'green'}],
  vessels:[{id:'v100',name:'Gaiwan',capacityMl:100},{id:'v200',name:'Kyusu',capacityMl:200}],
  sessions:[
    {id:'g1',teaId:'TA',vesselId:'v200',date:now,steeps:[{},{},{}],gramsUsed:5,waterMl:90},
    {id:'g2',teaId:'TA',vesselId:'v200',date:now,steeps:[{},{}],gramsUsed:4},
    {id:'g4',teaId:'TA',vesselId:'',date:now,infusionCount:1,gramsUsed:8,isColdBrew:true,waterMl:500}
  ]});
ok(Math.abs(vm.runInContext('gridStats(state.sessions).totalLiters',ctx)-(0.27+0.4+0.5))<1e-9,
  'G6 mixed shelf composes: 0.27 + 0.4 + 0.5 = 1.17 L');
ok(vm.runInContext('gridStats(state.sessions).totalLiters===computeStats().totalLiters',ctx),
  'G7 single writer holds with waterMl in play (computeStats still delegates exactly)');
ok(Math.abs(litersOf({id:'g6',teaId:'TA',vesselId:'v200',date:now,infusionCount:1,gramsUsed:10,isColdBrew:true,waterMl:750})-0.75)<1e-9,
  'G8 cold brew: liters counted from its waterMl (0.75 L), not the 200ml vessel — no cold-brew exclusion in gridStats');
console.log('  G water override (#24): 8 checks');

if(failures){ console.log('\n'+failures+' STAT-PERIOD TEST(S) FAILED'); process.exit(1); }
console.log('\nALL STAT-PERIOD TESTS PASSED  ('+passed+' passed)');
