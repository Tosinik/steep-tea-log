function computeStats(){
  const sessions = state.sessions;
  const totalSessions = sessions.length;
  const totalSteeps = sessions.reduce((a,s)=>a+steepCountOf(s),0);
  const totalGrams = sessions.reduce((a,s)=>a+(Number(s.gramsUsed)||0),0);
  const totalLiters = sessions.reduce((a,s)=>{
    const v = vesselById(s.vesselId);
    const cap = v ? Number(v.capacityMl)||0 : 0;
    return a + (cap*steepCountOf(s))/1000;
  },0);
  const days = new Set(sessions.map(s=>dayKey(s.date)));
  const uniqueTeas = new Set(sessions.map(s=>s.teaId)).size;

  // type breakdown by session count
  const typeCounts = {};
  TYPES.forEach(t=>typeCounts[t.k]={count:0, teas:{}});
  sessions.forEach(s=>{
    const tea = teaById(s.teaId); if(!tea) return;
    if(!typeCounts[tea.type]) typeCounts[tea.type]={count:0,teas:{}};
    typeCounts[tea.type].count++;
    typeCounts[tea.type].teas[tea.name] = (typeCounts[tea.type].teas[tea.name]||0)+1;
  });

  // most brewed teas
  const brewCounts = {};
  sessions.forEach(s=>{ brewCounts[s.teaId]=(brewCounts[s.teaId]||0)+1; });
  const mostBrewed = Object.entries(brewCounts).map(([id,c])=>({tea:teaById(id),count:c})).filter(x=>x.tea).sort((a,b)=>b.count-a.count).slice(0,5);

  // top rated (teas with a rating>0)
  const topRated = [...state.teas].filter(t=>t.rating>0).sort((a,b)=>b.rating-a.rating).slice(0,5);

  const favorites = state.teas.filter(t=>t.isFavorite);

  const lowStock = state.teas.filter(t=>Number(t.amountGrams)<lowStockG());

  const totalSpent = state.teas.reduce((a,t)=>a+(Number(t.costTotal)||0),0);
  const gramsBought = state.teas.reduce((a,t)=>a+(Number(t.costOriginalGrams)||0),0);
  const avgCostPerGram = gramsBought>0 ? totalSpent/gramsBought : 0;

  // streak — local day keys, matching the heatmap. If today has no session yet,
  // don't break the run; count from yesterday.
  const daySet = days;
  let streak = 0;
  let cur = new Date();
  if(!daySet.has(dayKey(cur))) cur.setDate(cur.getDate()-1);
  while(daySet.has(dayKey(cur))){ streak++; cur.setDate(cur.getDate()-1); }

  const coldBrewCount = sessions.filter(s=>s.isColdBrew).length;
  const nightSessionCount = sessions.filter(s=>{ const h=new Date(s.date).getHours(); return h>=22||h<5; }).length;
  const typesUsedCount = Object.values(typeCounts).filter(t=>t.count>0).length;
  const vesselsUsedCount = new Set(sessions.map(s=>s.vesselId)).size;
  const fiveStarSessions = sessions.filter(s=>Number(s.rating)===5).length;

  // time of day distribution (2h buckets)
  const hourBuckets = new Array(12).fill(0);
  sessions.forEach(s=>{ hourBuckets[Math.floor(new Date(s.date).getHours()/2)]++; });
  let peakBucket = -1, peakVal = 0;
  hourBuckets.forEach((v,i)=>{ if(v>peakVal){ peakVal=v; peakBucket=i; } });

  return {totalSessions, totalSteeps, totalGrams, totalLiters, days, uniqueTeas, typeCounts, mostBrewed, topRated, favorites, lowStock, totalSpent, avgCostPerGram, streak, coldBrewCount, nightSessionCount, typesUsedCount, vesselsUsedCount, fiveStarSessions, hourBuckets, peakBucket};
}

function computePersona(s){
  const sorted = Object.entries(s.typeCounts).filter(([k,v])=>v.count>0).sort((a,b)=>b[1].count-a[1].count);
  let title;
  if(sorted.length===0) title = 'New Explorer';
  else if(sorted.length===1) title = typeLabel(sorted[0][0])+' Devotee';
  else title = typeLabel(sorted[0][0])+' & '+typeLabel(sorted[1][0])+' Explorer';

  let subtitle = '';
  if(s.totalSessions===0){ subtitle = 'your story starts with one steep'; }
  else if(s.coldBrewCount>0 && s.coldBrewCount/s.totalSessions>=0.25){ subtitle = 'cold-brew curious'; }
  else if(s.nightSessionCount>0 && s.nightSessionCount/s.totalSessions>=0.3){ subtitle = 'brews after dark'; }
  else if(s.streak>=14){ subtitle = 'never misses a steep'; }
  else if(s.favorites.length>=3){ subtitle = 'fiercely loyal to a few favorites'; }
  else if(s.typesUsedCount>=5){ subtitle = 'chasing every leaf'; }
  else if(s.totalSessions>=10){ subtitle = 'settling into a rhythm'; }
  else{ subtitle = 'still finding their rhythm'; }

  return {title, subtitle};
}

function brewingClockHTML(s){
  if(s.totalSessions===0) return '';
  const max = Math.max(1, ...s.hourBuckets);
  const labels = ['0','2','4','6','8','10','12','14','16','18','20','22'];
  const bars = s.hourBuckets.map((v,i)=>{
    const h = Math.round(v/max*100);
    const isPeak = i===s.peakBucket && v>0;
    return `<div class="clock-col">
      <div class="clock-bar-track"><div class="clock-bar" style="height:${h}%;background:${isPeak?'var(--amber)':'var(--jade)'};"></div></div>
      <div class="clock-lbl">${labels[i]}</div>
    </div>`;
  }).join('');
  const peakLabel = s.peakBucket>=0 ? `${s.peakBucket*2}:00–${s.peakBucket*2+2}:00` : '—';
  return `<div class="section card">
    <div class="section-title"><h2>When you brew</h2><span class="mono" style="font-size:12px;color:var(--amber);">peak ${peakLabel}</span></div>
    <div class="clock-chart">${bars}</div>
  </div>`;
}

/* ================= ACHIEVEMENTS (tiered) ================= */
// Each achievement is a family with escalating tiers. metric(s) returns the
// current value; the level is how many thresholds have been passed.
const ACHIEVEMENTS = [
  {id:'first_steep',    title:'First Steep',     tiers:[1],              metric:s=>s.totalSessions,                              label:n=>`Log your first session`},
  {id:'sessions',       title:'Steeper',         tiers:[10,50,100,500], metric:s=>s.totalSessions,                              label:n=>`Log ${n} sessions`},
  {id:'century',        title:'Century Club',    tiers:[100,250,500,1000], metric:s=>s.totalSteeps,                             label:n=>`Log ${n} infusions`},
  {id:'liter_club',     title:'Liter Club', unit:'L', tiers:[5,25,50,100], metric:s=>s.totalLiters,                             label:n=>`Brew ${n} liters total`},
  {id:'leaf_muncher',   title:'Leaf Muncher', unit:'g', tiers:[100,500,1000,2500], metric:s=>s.totalGrams,                      label:n=>`Brew ${n}g of leaf total`},
  {id:'collector',      title:'Collector',       tiers:[20,50,100,200], metric:s=>state.teas.length,                           label:n=>`Keep ${n} teas in your library`},
  {id:'deep_dive',      title:'Deep Dive',       tiers:[10,25,50,100],  metric:s=>s.mostBrewed.length?s.mostBrewed[0].count:0, label:n=>`Brew one tea ${n} times`},
  {id:'streak',         title:'Steady Steeper', unit:'d', tiers:[7,30,100,365], metric:s=>s.streak,                            label:n=>`Reach a ${n}-day streak`},
  {id:'explorer',       title:'Explorer',        tiers:[3,5,6],         metric:s=>s.typesUsedCount,                            label:n=>`Brew ${n} different tea types`},
  {id:'vessel_variety', title:'Vessel Variety',  tiers:[3,5,8],         metric:s=>s.vesselsUsedCount,                          label:n=>`Brew with ${n} different vessels`},
  {id:'perfect_cup',    title:'Perfect Cup',     tiers:[1,10,25,50],    metric:s=>s.fiveStarSessions,                          label:n=>`Rate ${n} session${n>1?'s':''} 5 stars`},
  {id:'cold_brewer',    title:'Cold Brewer',     tiers:[1,10,25,50],    metric:s=>s.coldBrewCount,                             label:n=>`Log ${n} cold brew${n>1?'s':''}`},
  {id:'night_owl',      title:'Night Owl',       tiers:[1,10,25,50],    metric:s=>s.nightSessionCount,                         label:n=>`Log ${n} session${n>1?'s':''} after 10pm`},
  {id:'big_spender',    title:'Big Spender', unit:'$', tiers:[50,200,500,1000], metric:s=>s.totalSpent,                        label:n=>`Spend ${n} on tea`},
  {id:'type_master',    title:'Type Master',     tiers:[1,3,6],         metric:s=>Object.values(s.typeCounts).filter(t=>t.count>=10).length, label:n=>`Brew ${n} type${n>1?'s':''} 10+ times each`},
];
function computeAchievements(s){
  return ACHIEVEMENTS.map(a=>{
    const value = a.metric(s);
    const level = a.tiers.filter(t=>value>=t).length;
    const maxed = level===a.tiers.length;
    return {...a, value, level, maxed, unlocked:level>0, tierCount:a.tiers.length,
      unlockedTier: level>0?a.tiers[level-1]:null, nextTier: maxed?null:a.tiers[level]};
  });
}
function fmtMetric(a,v){ return a.unit==='L' ? (Math.round(v*10)/10) : Math.round(v); }
function aUnit(a){ return a.unit==='L' ? ' L' : (a.unit||''); }
function badgeHTML(a){
  const denom = a.maxed ? a.unlockedTier : (a.nextTier ?? a.tiers[0]);
  const pct = a.maxed ? 100 : Math.min(100, Math.round(a.value/denom*100));
  const tierPip = a.tierCount>1 ? `<span class="badge-tier">Lv ${a.level}/${a.tierCount}</span>` : '';
  const desc = a.maxed ? (a.tierCount>1?`Maxed — ${a.label(a.unlockedTier)}`:'Earned') : (a.unlocked ? `Next: ${a.label(a.nextTier)}` : a.label(a.tiers[0]));
  const u = aUnit(a);
  const progNum = a.maxed ? (a.tierCount>1 ? `${denom}${u} ✓` : 'Complete') : `${fmtMetric(a,a.value)}${u} / ${denom}${u}`;
  return `<div class="badge ${a.unlocked?'unlocked':'locked'} ${a.maxed?'maxed':''}" data-akey="${a.id}#${a.level}">
    <div class="badge-icon">${a.maxed?'★':a.unlocked?'✓':'—'}</div>
    <div class="badge-title">${a.title}${tierPip}</div>
    <div class="badge-desc">${desc}</div>
    <div class="badge-prog"><div class="badge-prog-fill" style="width:${pct}%"></div></div>
    <div class="badge-prog-num">${progNum}</div>
  </div>`;
}
function achievementsHTML(s){
  const list = computeAchievements(s);
  const started = list.filter(a=>a.unlocked).length;
  const totalTiers = list.reduce((n,a)=>n+a.tierCount,0);
  const earnedTiers = list.reduce((n,a)=>n+a.level,0);
  const collapsed = !!state.settings.achievementsCollapsed;
  const head = `<div class="section-title"><h2>Achievements</h2>
    <span style="display:flex;align-items:center;gap:12px;">
      <span class="mono" style="font-size:12px;color:var(--amber);">${earnedTiers}/${totalTiers} tiers</span>
      <button class="btn-ghost" style="text-decoration:none;font-size:15px;padding:0;" onclick="toggleAchievementsCollapsed()" title="${collapsed?'Expand':'Minimize'}">${collapsed?'▸':'▾'}</button>
    </span></div>`;
  if(collapsed){
    return `<div class="section card">${head}
      <div style="font-size:12.5px;color:var(--ink-soft);">${started} of ${list.length} achievements started · tap ▸ to expand</div>
    </div>`;
  }
  return `<div class="section card">${head}<div class="badge-grid">${list.map(badgeHTML).join('')}</div></div>`;
}
function toggleAchievementsCollapsed(){
  state.settings.achievementsCollapsed = !state.settings.achievementsCollapsed;
  persistSettings(); render();
}

/* ---- newly-unlocked detection + celebration ---- */
function syncAchievements(animate){
  const list = computeAchievements(computeStats());
  const keys = list.filter(a=>a.level>0).map(a=>`${a.id}#${a.level}`);
  let seen = state.settings.seenAchievements;
  if(!Array.isArray(seen)){ // first ever run: record silently, never a burst of old unlocks
    state.settings.seenAchievements = keys; persistSettings(); return;
  }
  const seenSet = new Set(seen);
  const fresh = list.filter(a=>a.level>0 && !seenSet.has(`${a.id}#${a.level}`));
  if(fresh.length){
    state.settings.seenAchievements = Array.from(new Set([...seen, ...keys])); // accumulate, so drops don't re-fire
    persistSettings();
    if(animate && !state.settings.quietMode) celebrateAchievements(fresh);
  }
}
function celebrateAchievements(list){
  const names = list.map(a=>a.tierCount>1?`${a.title} (Lv ${a.level})`:a.title);
  showToast('🎉 Unlocked: '+names.join(' · '));
  confettiBurst();
}
function showToast(msg){
  let host = document.getElementById('toastHost');
  if(!host){ host=document.createElement('div'); host.id='toastHost'; document.body.appendChild(host); }
  const t=document.createElement('div'); t.className='toast'; t.textContent=msg;
  host.appendChild(t);
  requestAnimationFrame(()=>t.classList.add('show'));
  setTimeout(()=>{ t.classList.remove('show'); setTimeout(()=>t.remove(),320); }, 4200);
}
function confettiBurst(){
  const host=document.createElement('div'); host.className='confetti';
  const colors=['#C17A3E','#3F5E42','#8B5E4A','#C6A825','#5B9440'];
  for(let i=0;i<30;i++){
    const p=document.createElement('i');
    p.style.left=Math.random()*100+'%';
    p.style.background=colors[i%colors.length];
    p.style.animationDelay=(Math.random()*0.25).toFixed(2)+'s';
    p.style.setProperty('--rot',(Math.random()*360|0)+'deg');
    host.appendChild(p);
  }
  document.body.appendChild(host);
  setTimeout(()=>host.remove(),2000);
}


function heatmapHTML(days){
  // 13 weeks x 7 days, Monday-aligned (matches the recap + local convention)
  const weeks = 13;
  const today = new Date(); today.setHours(0,0,0,0);
  const start = new Date(today); start.setDate(start.getDate()-(weeks*7-1));
  start.setDate(start.getDate()-((start.getDay()+6)%7)); // back to Monday
  const dayLabels = ['Mon','','Wed','','Fri','','']; // rows Mon…Sun
  const labelCol = '<div class="heat-week heat-labels">'+dayLabels.map(l=>`<div class="heat-label">${l}</div>`).join('')+'</div>';
  let cols = '';
  for(let w=0; w<weeks; w++){
    let col = '<div class="heat-week">';
    for(let d=0; d<7; d++){
      const cellDate = new Date(start); cellDate.setDate(start.getDate()+w*7+d);
      const key = dayKey(cellDate);
      const has = days.has(key);
      const future = cellDate>today;
      const isToday = cellDate.getTime()===today.getTime();
      col += `<div class="heat-cell${isToday?' heat-today':''}" style="background:${future?'transparent':has?'var(--heat-fill)':'var(--heat-empty)'}" title="${key}${isToday?' (today)':''}"></div>`;
    }
    col += '</div>';
    cols += col;
  }
  return `<div class="heatmap-wrap">
    <div class="heatmap">${labelCol}${cols}</div>
    <div class="heat-caption">Each square is a day · past 13 weeks · columns are weeks</div>
    <div class="heat-legend">
      <span><i class="heat-swatch" style="background:var(--heat-empty)"></i>no tea</span>
      <span><i class="heat-swatch" style="background:var(--heat-fill)"></i>logged</span>
      <span><i class="heat-swatch heat-today" style="background:var(--heat-fill)"></i>today</span>
    </div>
  </div>`;
}

function streakCardHTML(){
  const s = computeStats();
  return `<div class="section card" style="margin-top:16px;">
    <div class="section-title"><h2>Drinking streak</h2><span class="mono" style="font-size:13px;color:var(--amber);font-weight:600;">${s.streak} day${s.streak===1?'':'s'} current</span></div>
    ${heatmapHTML(s.days)}
  </div>`;
}
function periodRange(period){
  const now = new Date();
  const end = new Date(now); end.setHours(23,59,59,999);
  let start;
  if(period==='month'){
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  } else {
    start = new Date(now); start.setHours(0,0,0,0);
    const monFirst = (start.getDay()+6)%7; // Mon=0 … Sun=6
    start.setDate(start.getDate()-monFirst);
  }
  return { start, end };
}
function computeRecap(period){
  const { start, end } = periodRange(period);
  const inRange = state.sessions.filter(s=>{ const d=new Date(s.date); return d>=start && d<=end; });
  const infusions = inRange.reduce((a,s)=>a+steepCountOf(s),0);
  const grams = inRange.reduce((a,s)=>a+(Number(s.gramsUsed)||0),0);
  const liters = inRange.reduce((a,s)=>{ const v=vesselById(s.vesselId); const cap=v?Number(v.capacityMl)||0:0; return a+(cap*steepCountOf(s))/1000; },0);
  const counts={}; inRange.forEach(s=>{ if(s.teaId) counts[s.teaId]=(counts[s.teaId]||0)+1; });
  let mostBrewed=null, mostN=0;
  Object.entries(counts).forEach(([id,n])=>{ if(n>mostN){ mostN=n; mostBrewed=teaById(id); } });
  const topSession = inRange.filter(s=>Number(s.rating)>0).sort((a,b)=>b.rating-a.rating)[0]||null;
  const typeCounts={}; inRange.forEach(s=>{ const t=s.teaType||(teaById(s.teaId)||{}).type; if(t) typeCounts[t]=(typeCounts[t]||0)+1; });
  const days = new Set(inRange.map(s=>dayKey(s.date)));
  const newTeas = state.teas.filter(t=>{ const d=new Date(t.dateAdded||0); return d>=start && d<=end; }).length;
  return { start, end, sessions:inRange.length, infusions, grams, liters, uniqueTeas:new Set(inRange.map(s=>s.teaId).filter(Boolean)).size, mostBrewed, mostN, topSession, typeCounts, daysActive:days.size, newTeas };
}
function recapHTML(){
  const period = state.recapPeriod || 'week';
  const r = computeRecap(period);
  const label = period==='month'
    ? r.start.toLocaleDateString(undefined,{month:'long',year:'numeric'})
    : `${r.start.toLocaleDateString(undefined,{month:'short',day:'numeric'})} – today`;
  const toggle = `<div class="recap-toggle">
    <button class="${period==='week'?'active':''}" onclick="setRecapPeriod('week')">This week</button>
    <button class="${period==='month'?'active':''}" onclick="setRecapPeriod('month')">This month</button>
  </div>`;
  if(r.sessions===0){
    return `<div class="section card recap-card">
      <div class="section-title"><h2>Recap</h2>${toggle}</div>
      <div class="recap-range">${label}</div>
      <div class="empty" style="padding:10px 0 2px;">No sessions logged ${period==='week'?'this week':'this month'} yet — the pot's waiting.</div>
    </div>`;
  }
  const typeChips = TYPES.filter(t=>r.typeCounts[t.k]).map(t=>`<span class="pill t-${t.k}">${typeLabel(t.k)} ${r.typeCounts[t.k]}</span>`).join(' ');
  return `<div class="section card recap-card">
    <div class="section-title"><h2>Recap</h2>${toggle}</div>
    <div class="recap-range">${label}</div>
    <div class="grid grid-3" style="margin-top:10px;">
      <div class="stat"><div class="num">${r.sessions}</div><div class="lbl">Sessions</div></div>
      <div class="stat"><div class="num">${r.infusions}</div><div class="lbl">Infusions</div></div>
      <div class="stat"><div class="num">${r.daysActive}</div><div class="lbl">Days</div></div>
      <div class="stat"><div class="num">${r.uniqueTeas}</div><div class="lbl">Teas</div></div>
      <div class="stat"><div class="num">${r.liters.toFixed(1)}</div><div class="lbl">Liters</div></div>
      <div class="stat"><div class="num">${r.grams.toFixed(0)}</div><div class="lbl">Grams</div></div>
    </div>
    ${r.mostBrewed?`<div class="recap-line"><span class="recap-k">Most brewed</span><span class="recap-v">${r.mostBrewed.name} · ${r.mostN}×</span></div>`:''}
    ${r.topSession?`<div class="recap-line"><span class="recap-k">Top rated</span><span class="recap-v">${(r.topSession.teaName||(teaById(r.topSession.teaId)||{}).name||'—')} ${renderStarsStatic(r.topSession.rating,false)}</span></div>`:''}
    ${r.newTeas?`<div class="recap-line"><span class="recap-k">New teas added</span><span class="recap-v">${r.newTeas}</span></div>`:''}
    ${typeChips?`<div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap;">${typeChips}</div>`:''}
  </div>`;
}
function setRecapPeriod(p){ state.recapPeriod=p; render(); }
function onboardingHTML(){
  const hasTea = state.teas.length>0;
  const hasVessel = state.vessels.length>0;
  const ready = hasTea && hasVessel;
  const step = (done, n, title, sub, btn) => `
    <div class="ob-step ${done?'done':''}">
      <div class="ob-check">${done?'✓':n}</div>
      <div class="ob-step-body">
        <div class="ob-step-title">${title}</div>
        <div class="ob-step-sub">${sub}</div>
      </div>
      ${done?'<span class="ob-done-tag">done</span>':(btn||'')}
    </div>`;
  return `
    <div class="ob-hero">
      <div style="display:flex;justify-content:center;margin-bottom:14px;">${steepLogoSVG(52)}</div>
      <h1>Welcome to Steep</h1>
      <p class="ob-lede">A calm home for your tea. Log a few sessions and this space fills with your rhythms — what you brew, your streak, your favourites. No rush.</p>
    </div>
    <div class="card ob-steps">
      ${step(hasTea, 1, 'Add your first tea', 'Name and type are enough; add a photo and notes if you like.', `<button class="btn btn-primary ob-btn" onclick="goView('teas')">Add tea</button>`)}
      ${step(hasVessel, 2, 'Add a vessel', 'A gaiwan, teapot, or mug — whatever you brew in.', `<button class="btn btn-primary ob-btn" onclick="goView('vessels')">Add vessel</button>`)}
      ${step(false, 3, 'Log your first session', ready?"Everything's ready — go brew something.":'Add a tea and a vessel first.', ready?`<button class="btn btn-primary ob-btn" onclick="quickLogSession()">Log session</button>`:'')}
    </div>
    ${backupSectionHTML()}
  `;
}
function viewAchievements(){
  const s = computeStats();
  const list = computeAchievements(s);
  const totalTiers = list.reduce((n,a)=>n+a.tierCount,0);
  const earnedTiers = list.reduce((n,a)=>n+a.level,0);
  const started = list.filter(a=>a.unlocked).length;
  return `
    <button class="detail-back" onclick="goView('dashboard')">← Back to dashboard</button>
    <div class="section-title" style="margin-top:6px;">
      <h2 style="font-family:'Fraunces',serif;font-size:20px;">Achievements</h2>
      <span class="mono" style="font-size:12px;color:var(--amber);">${earnedTiers}/${totalTiers} tiers · ${started} started</span>
    </div>
    <div class="card"><div class="badge-grid">${list.map(badgeHTML).join('')}</div></div>
  `;
}
function viewDashboard(){
  if(state.sessions.length===0){
    return onboardingHTML();
  }
  const s = computeStats();
  const persona = computePersona(s);
  const maxTypeCount = Math.max(1, ...Object.values(s.typeCounts).map(t=>t.count));

  const typeBars = TYPES.map(t=>{
    const info = s.typeCounts[t.k];
    if(!info || info.count===0) return '';
    const pct = Math.round(info.count/maxTypeCount*100);
    const topTeas = Object.entries(info.teas).sort((a,b)=>b[1]-a[1]).slice(0,2).map(([n,c])=>`${n} (${c}x)`).join(', ');
    return `<div class="typebar-row">
      <div class="typebar-head"><strong>${t.label}</strong><span class="mono" style="font-size:12px;color:var(--ink-soft)">${info.count}x</span></div>
      <div class="typebar-track"><div class="typebar-fill dot-${t.k}" style="width:${pct}%;background:var(--jade)"></div></div>
      ${topTeas?`<div class="typebar-sub">top: ${topTeas}</div>`:''}
    </div>`;
  }).join('');

  const favHTML = s.favorites.length ? `<div class="grid grid-3">${s.favorites.slice(0,6).map(t=>teaCardHTML(t)).join('')}</div>` : '<div class="empty">No favorites marked yet.</div>';

  const mostBrewedHTML = s.mostBrewed.length ? s.mostBrewed.map((x,i)=>`
    <div class="rank-row"><span class="rank-num">${i+1}.</span><span class="rname">${x.tea.name}</span>${dotsRow(x.count,x.count)}<span class="rval">${x.count}x</span></div>
  `).join('') : '<div class="empty">Log a session to see your most brewed teas.</div>';

  const topRatedHTML = s.topRated.length ? s.topRated.map((t,i)=>`
    <div class="rank-row"><span class="rank-num">${i+1}.</span><span class="rname">${t.name}</span><span class="rval">${fmtStars(t.rating)}/5</span></div>
  `).join('') : '<div class="empty">Rate a tea to see it here.</div>';

  const lowStockHTML = s.lowStock.length ? s.lowStock.map(t=>`
    <div class="rank-row"><span class="rname">${t.name}</span><span class="rval" style="color:var(--red)">${Number(t.amountGrams).toFixed(1)}g left</span></div>
  `).join('') : '<div class="empty">All stocked up.</div>';

  const recent = [...state.sessions].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,4);
  const recentHTML = recent.length ? `
    <div class="section card">
      <div class="section-title"><h2>Recent sessions</h2></div>
      ${recent.map(se=>{
        const tea = teaById(se.teaId);
        return `<div class="rank-row" onclick="openSessionEdit('${se.id}')" style="cursor:pointer;">
          <span class="rname">${se.teaName || (tea?tea.name:'—')}${se.rating?' '+renderStarsStatic(se.rating,false):''}</span>
          <span class="rval" style="color:var(--ink-soft);font-size:12px;">${brewCountLabel(se)} · ${new Date(se.date).toLocaleDateString()}</span>
        </div>`;
      }).join('')}
    </div>` : '';

  return `
    <div class="persona"><div class="eyebrow">Your tea persona</div><h2>${persona.title}</h2><div class="persona-sub">${persona.subtitle}</div></div>

    ${recapHTML()}

    ${recentHTML}

    <div class="section grid grid-3">
      <div class="stat"><div class="num">${s.totalSessions}</div><div class="lbl">Sessions</div></div>
      <div class="stat"><div class="num">${s.totalSteeps}</div><div class="lbl">Infusions</div></div>
      <div class="stat"><div class="num">${s.days.size}</div><div class="lbl">Days logged</div></div>
      <div class="stat"><div class="num">${s.totalGrams.toFixed(1)}</div><div class="lbl">Grams brewed</div></div>
      <div class="stat"><div class="num">${s.totalLiters.toFixed(1)}</div><div class="lbl">Liters (est.)</div></div>
      <div class="stat"><div class="num">${s.uniqueTeas}</div><div class="lbl">Teas brewed</div></div>
    </div>

    ${brewingClockHTML(s)}

    <div class="section card">
      <div class="section-title"><h2>What you brewed</h2></div>
      ${typeBars || '<div class="empty">No sessions yet.</div>'}
    </div>

    <div class="section grid grid-2">
      <div class="card">
        <div class="section-title"><h2>Most brewed</h2></div>
        ${mostBrewedHTML}
      </div>
      <div class="card">
        <div class="section-title"><h2>Top rated</h2></div>
        ${topRatedHTML}
      </div>
    </div>

    <div class="section">
      <div class="section-title"><h2>Favorites</h2></div>
      ${favHTML}
    </div>

    <div class="section card">
      <div class="section-title"><h2>Cost overview</h2></div>
      <div class="grid grid-3">
        <div class="stat"><div class="num">${s.totalSpent.toFixed(0)}</div><div class="lbl">Total spent</div></div>
        <div class="stat"><div class="num">${s.avgCostPerGram.toFixed(2)}</div><div class="lbl">Avg / gram</div></div>
        <div class="stat"><div class="num">${s.lowStock.length}</div><div class="lbl">Low stock</div></div>
      </div>
      ${s.lowStock.length ? `<div style="margin-top:12px;">${lowStockHTML}</div>` : ''}
    </div>

    ${backupSectionHTML()}
  `;
}

/* ================= TEAS ================= */
