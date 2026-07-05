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
  // Monday-aligned grid. Span starts at the week of your FIRST logged day (clamped
  // 4–13 weeks) so a brand-new log doesn't show a long empty run of unused weeks.
  const weeksMax = 13, weeksMin = 4;
  const today = new Date(); today.setHours(0,0,0,0);
  const monThisWeek = new Date(today);
  monThisWeek.setDate(today.getDate() - ((today.getDay()+6)%7)); // Monday of this week
  let earliest = null;
  days.forEach(k=>{ const p=k.split('-'); const dt=new Date(+p[0], +p[1]-1, +p[2]); if(!earliest || dt<earliest) earliest=dt; });
  let weeks = weeksMax;
  if(earliest){
    const monFirst = new Date(earliest);
    monFirst.setDate(earliest.getDate() - ((earliest.getDay()+6)%7));
    const span = Math.floor((monThisWeek - monFirst)/(7*86400000)) + 1;
    weeks = Math.max(weeksMin, Math.min(weeksMax, span));
  } else {
    weeks = weeksMin;
  }
  const start = new Date(monThisWeek);
  start.setDate(monThisWeek.getDate() - (weeks-1)*7);
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
    <div class="heat-caption">Each square is a day · ${weeks} week${weeks>1?'s':''} · columns are weeks</div>
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
function teaForecast(tea){
  // Estimate consumption from grams-tracked sessions. More sessions → sharper estimate.
  const ss = state.sessions.filter(s=>s.teaId===tea.id && Number(s.gramsUsed)>0).sort((a,b)=>new Date(a.date)-new Date(b.date));
  if(ss.length<2) return null; // need at least two data points
  const totalG = ss.reduce((a,s)=>a+Number(s.gramsUsed),0);
  const spanDays = Math.max(3, (Date.now()-new Date(ss[0].date))/86400000);
  const perDay = totalG/spanDays;
  if(perDay<=0) return null;
  const g = Number(tea.amountGrams)||0;
  return { perWeek: perDay*7, daysLeft: g>0?Math.round(g/perDay):0, sessions: ss.length, confident: ss.length>=4 };
}
function fmtDaysLeft(days){
  if(days<=0) return 'out';
  if(days<14) return '~'+days+' days';
  if(days<60) return '~'+Math.round(days/7)+' weeks';
  if(days<365) return '~'+Math.round(days/30)+' months';
  return 'over a year';
}
function forecastLine(tea){
  const f = teaForecast(tea);
  if(!f) return '';
  const wk = f.perWeek<1 ? f.perWeek.toFixed(1) : Math.round(f.perWeek);
  if((Number(tea.amountGrams)||0)<=0) return `<div class="forecast-line">Out of stock — you were going through ~${wk}g/week.</div>`;
  return `<div class="forecast-line">At your pace (~${wk}g/week), about <b>${fmtDaysLeft(f.daysLeft)}</b> left${f.confident?'':' · rough estimate, sharpens as you log more'}.</div>`;
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

/* ================= INSIGHTS =================
   Gentle, self-knowledge readings drawn from session timestamps + grams.
   Calm-first: observational, never guilt. Rows only appear once there's
   enough signal to be meaningful; the whole card hides below 5 sessions. */
function computeInsights(){
  const sessions = state.sessions;
  if(sessions.length < 5) return null;
  const now = new Date();
  const DAY = 86400000;
  const age = d => (now - new Date(d));

  // Cadence — last 28 days, and the 28 before that for a gentle trend.
  const last28 = sessions.filter(s=>{ const a=age(s.date); return a>=0 && a<=28*DAY; });
  const prev28 = sessions.filter(s=>{ const a=age(s.date); return a>28*DAY && a<=56*DAY; });
  // Divide by the span you've ACTUALLY been logging in this window, not a flat 4
  // weeks — so a recent ramp-up reads as your real recent pace instead of a diluted
  // monthly average. Floored at ~half a week so one busy day can't spike it.
  const firstInWindow = last28.length ? Math.min(...last28.map(s=>new Date(s.date).getTime())) : now.getTime();
  const spanWeeks = Math.max(0.5, (now - firstInWindow)/(7*DAY));
  const perWeek = last28.length / spanWeeks;
  const activeDays28 = new Set(last28.map(s=>dayKey(s.date))).size;
  let trend = null;
  if(prev28.length>=3 && last28.length>=3){
    const ratio = last28.length/prev28.length;
    trend = ratio>=1.25 ? 'up' : ratio<=0.8 ? 'down' : 'steady';
  }

  // Weekend vs weekday (all sessions). Sun=0, Sat=6.
  let weekendCount=0;
  sessions.forEach(s=>{ const d=new Date(s.date).getDay(); if(d===0||d===6) weekendCount++; });
  const weekendShare = weekendCount/sessions.length;

  // Favourite weekday.
  const dow = new Array(7).fill(0);
  sessions.forEach(s=>{ dow[new Date(s.date).getDay()]++; });
  let favDow=-1, favN=0; dow.forEach((n,i)=>{ if(n>favN){ favN=n; favDow=i; } });

  // Time of day (four parts) — complements the brewing clock with a one-liner.
  const parts = {morning:0, afternoon:0, evening:0, night:0};
  sessions.forEach(s=>{ const h=new Date(s.date).getHours();
    if(h>=5&&h<12) parts.morning++; else if(h>=12&&h<17) parts.afternoon++;
    else if(h>=17&&h<22) parts.evening++; else parts.night++; });
  const topPart = Object.entries(parts).sort((a,b)=>b[1]-a[1])[0];
  const topPartShare = topPart[1]/sessions.length;

  // This calendar month vs last.
  const mStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lmStart = new Date(now.getFullYear(), now.getMonth()-1, 1);
  const gramsOf = arr=>arr.reduce((a,s)=>a+(Number(s.gramsUsed)||0),0);
  const thisMonth = sessions.filter(s=>new Date(s.date)>=mStart);
  const lastMonth = sessions.filter(s=>{ const d=new Date(s.date); return d>=lmStart && d<mStart; });
  const month = { thisN:thisMonth.length, lastN:lastMonth.length,
    thisG:gramsOf(thisMonth), lastG:gramsOf(lastMonth), hasCompare:lastMonth.length>0 };

  return { perWeek, activeDays28, trend, last28n:last28.length,
    weekendShare, favDow, favN, topPart:topPart[0], topPartShare, month,
    enough: sessions.length>=8, total:sessions.length };
}
function insightsHTML(){
  const n = computeInsights();
  if(!n) return '';
  const DOW = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const partLabel = {morning:'mornings', afternoon:'afternoons', evening:'evenings', night:'late nights'};

  let lead;
  if(n.last28n===0){
    lead = `It's been a quiet month — nothing logged in the last 28 days. The pot's here whenever you are.`;
  } else {
    let cadence;
    if(n.perWeek >= 6.5){
      const perDay = n.perWeek/7;
      cadence = perDay >= 1.5 ? `about <b>${Math.round(perDay)}×</b> a day` : `about <b>once</b> a day`;
    } else if(n.perWeek >= 1){
      cadence = `about <b>${Math.round(n.perWeek)}×</b> a week`;
    } else {
      cadence = `about <b>${n.perWeek.toFixed(1)}×</b> a week`;
    }
    const trendPhrase = n.trend==='up' ? ', a little more than the month before'
      : n.trend==='down' ? ', a touch less than the month before — no pressure'
      : n.trend==='steady' ? ', holding steady with the month before' : '';
    lead = `You've been steeping ${cadence} lately${trendPhrase} — tea on ${n.activeDays28} of the last 28 days.`;
  }

  const rows = [];
  if(n.enough){
    const wePct = Math.round(n.weekendShare*100);
    if(n.weekendShare>=0.4) rows.push(['Weekends', `your ritual — ${wePct}% of sessions`]);
    else if(n.weekendShare<=0.18) rows.push(['Rhythm', `a weekday habit — ${wePct}% land on weekends`]);
    else rows.push(['Weekends', `${wePct}% of your sessions`]);

    if(n.topPartShare>=0.35) rows.push(['Time of day', `mostly ${partLabel[n.topPart]} — ${Math.round(n.topPartShare*100)}%`]);

    if(n.favN>=3 && n.favDow>=0) rows.push(['Steepiest day', `${DOW[n.favDow]} · ${n.favN} sessions`]);
  }
  if(n.month.hasCompare){
    const arrow = n.month.thisN>n.month.lastN ? '↑' : n.month.thisN<n.month.lastN ? '↓' : '→';
    const g = (n.month.thisG>0||n.month.lastG>0) ? ` · ${n.month.thisG.toFixed(0)}g vs ${n.month.lastG.toFixed(0)}g` : '';
    rows.push(['This month vs last', `<span style="color:var(--ink-soft);">${arrow}</span> ${n.month.thisN} vs ${n.month.lastN} sessions${g}`]);
  }

  const rowsHTML = rows.map(([k,v])=>`<div class="recap-line"><span class="recap-k">${k}</span><span class="recap-v">${v}</span></div>`).join('');
  return `<div class="section card">
    <div class="section-title"><h2>Insights</h2><span class="mono" style="font-size:11px;color:var(--ink-soft);">your patterns</span></div>
    <div style="font-size:14px;line-height:1.55;color:var(--ink);margin-top:2px;">${lead}</div>
    ${rowsHTML}
  </div>`;
}
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
/* ================= STEEP WRAPPED =================
   A calm, seasonal recap built entirely from existing session data. No new
   infra. Northern-hemisphere meteorological seasons (matches Steep's users);
   flip the month ranges for a southern-hemisphere option later. */
function seasonInfo(date){
  const m = date.getMonth(), y = date.getFullYear();
  if(m===11 || m<=1){ const sy = m===11 ? y : y-1; return {name:'Winter', start:new Date(sy,11,1), end:new Date(sy+1,2,1), year:m===11?y+1:y}; }
  if(m<=4) return {name:'Spring', start:new Date(y,2,1), end:new Date(y,5,1), year:y};
  if(m<=7) return {name:'Summer', start:new Date(y,5,1), end:new Date(y,8,1), year:y};
  return {name:'Autumn', start:new Date(y,8,1), end:new Date(y,11,1), year:y};
}
function partWord(p){ return ({morning:'mornings', afternoon:'afternoons', evening:'evenings', night:'late nights'})[p] || p; }
function fmtSteepDuration(sec){
  if(sec<60) return Math.round(sec)+'s';
  const m = Math.round(sec/60);
  if(m<90) return m+' min';
  const h = Math.floor(m/60), r = m%60;
  return r ? `${h}h ${r}m` : `${h}h`;
}
function computeWrapped(){
  const now = new Date();
  const season = seasonInfo(now);
  const inSeason = state.sessions.filter(s=>{ const d=new Date(s.date); return d>=season.start && d<season.end && d<=now; });
  if(inSeason.length===0) return { season, empty:true };

  const infusions = inSeason.reduce((a,s)=>a+steepCountOf(s),0);
  const grams = inSeason.reduce((a,s)=>a+(Number(s.gramsUsed)||0),0);
  let steepSeconds = 0;
  inSeason.forEach(s=>(s.steeps||[]).forEach(st=>{ steepSeconds += Number(st.timeSeconds)||0; }));
  const activeDays = new Set(inSeason.map(s=>dayKey(s.date))).size;
  const coldN = inSeason.filter(s=>s.isColdBrew).length;

  const teaCounts = {};
  inSeason.forEach(s=>{ teaCounts[s.teaId]=(teaCounts[s.teaId]||0)+1; });
  let topTeaId=null, topTeaN=0; Object.entries(teaCounts).forEach(([id,c])=>{ if(c>topTeaN){ topTeaN=c; topTeaId=id; } });
  const topTea = teaById(topTeaId);
  const distinctTeas = Object.keys(teaCounts).length;

  const typeCounts = {};
  inSeason.forEach(s=>{ const t=teaById(s.teaId); if(t) typeCounts[t.type]=(typeCounts[t.type]||0)+1; });
  let topType=null, topTypeN=0; Object.entries(typeCounts).forEach(([k,c])=>{ if(c>topTypeN){ topTypeN=c; topType=k; } });

  const parts = {morning:0, afternoon:0, evening:0, night:0};
  inSeason.forEach(s=>{ const h=new Date(s.date).getHours();
    if(h>=5&&h<12) parts.morning++; else if(h>=12&&h<17) parts.afternoon++;
    else if(h>=17&&h<22) parts.evening++; else parts.night++; });
  const topPart = Object.entries(parts).sort((a,b)=>b[1]-a[1])[0][0];

  // "New this season" = teas whose first-ever session lands in the window.
  const firstSeen = {};
  state.sessions.forEach(s=>{ const t=new Date(s.date).getTime(); if(firstSeen[s.teaId]==null || t<firstSeen[s.teaId]) firstSeen[s.teaId]=t; });
  const newTeas = Object.keys(firstSeen)
    .filter(id => firstSeen[id]>=season.start.getTime() && firstSeen[id]<season.end.getTime())
    .map(id=>teaById(id)).filter(Boolean);

  const standout = inSeason.filter(s=>Number(s.rating)>0)
    .sort((a,b)=> (b.rating-a.rating) || (new Date(b.date)-new Date(a.date)))[0] || null;

  return { season, empty:false, n:inSeason.length, infusions, grams, steepSeconds, activeDays,
    coldN, topTea, topTeaN, distinctTeas, topType, topTypeN, topPart, newTeas, standout };
}
function wrappedTeaser(){
  const w = computeWrapped();
  if(w.empty) return '';
  return `<div class="section card" style="cursor:pointer;" onclick="goView('wrapped')">
    <div class="section-title"><h2>Your ${w.season.name} in tea</h2><span class="mono" style="font-size:11px;color:var(--ink-soft);">wrapped →</span></div>
    <div style="font-size:14px;color:var(--ink-soft);margin-top:2px;">${w.n} session${w.n>1?'s':''} this ${w.season.name.toLowerCase()} so far — tap for your recap.</div>
  </div>`;
}
function wrappedShareText(w){
  const cap = s => s.charAt(0).toUpperCase()+s.slice(1);
  const lines = [`My ${w.season.name} ${w.season.year} in tea · Steep`,
    `${w.n} sessions · ${w.infusions} infusions${w.grams?` · ${w.grams.toFixed(0)}g`:''}`];
  if(w.topTea) lines.push(`Most brewed: ${w.topTea.name} (${w.topTeaN}×)`);
  if(w.topType) lines.push(`Mostly ${typeLabel(w.topType).toLowerCase()}, mostly ${partWord(w.topPart)}`);
  if(w.newTeas.length) lines.push(`${w.newTeas.length} new tea${w.newTeas.length>1?'s':''} discovered`);
  return lines.join('\n');
}
async function shareWrapped(){
  const w = computeWrapped();
  if(w.empty) return;
  const text = wrappedShareText(w);
  try{
    if(navigator.share){ await navigator.share({ text }); return; }
    await navigator.clipboard.writeText(text);
    showToast('Copied your recap — paste it anywhere.');
  }catch(e){
    if(e && e.name==='AbortError') return; // user dismissed the share sheet
    showToast('Could not copy — you can screenshot this instead.');
  }
}
function viewWrapped(){
  const w = computeWrapped();
  const back = `<button class="detail-back" onclick="goView('dashboard')">← Back to dashboard</button>`;
  if(w.empty){
    return `${back}
    <div class="section card" style="text-align:center;padding:34px 20px;">
      <div class="eyebrow">Steep Wrapped</div>
      <h2 style="font-family:'Fraunces',serif;font-size:26px;margin:8px 0 6px;">Your ${w.season.name} is just beginning</h2>
      <p style="color:var(--ink-soft);font-size:14px;max-width:34ch;margin:0 auto;">No sessions logged this ${w.season.name.toLowerCase()} yet. Brew a few cups and your recap fills in here.</p>
    </div>`;
  }
  const cap = s => s.charAt(0).toUpperCase()+s.slice(1);
  const sixth = w.steepSeconds>0
    ? `<div class="stat"><div class="num">${fmtSteepDuration(w.steepSeconds)}</div><div class="lbl">Steeping time</div></div>`
    : `<div class="stat"><div class="num">${w.coldN}</div><div class="lbl">Cold brews</div></div>`;
  return `${back}
    <div class="section card" style="text-align:center;padding:30px 20px;background:linear-gradient(160deg,var(--white,#fff),var(--porcelain,#f4efe4));">
      <div class="eyebrow">Steep Wrapped</div>
      <h2 style="font-family:'Fraunces',serif;font-size:28px;margin:8px 0 4px;">Your ${w.season.name} in tea</h2>
      <div class="mono" style="font-size:12px;color:var(--ink-soft);">${w.season.year} · so far</div>
    </div>

    <div class="section grid grid-3">
      <div class="stat"><div class="num">${w.n}</div><div class="lbl">Sessions</div></div>
      <div class="stat"><div class="num">${w.infusions}</div><div class="lbl">Infusions</div></div>
      <div class="stat"><div class="num">${w.activeDays}</div><div class="lbl">Days with tea</div></div>
      <div class="stat"><div class="num">${w.grams.toFixed(0)}</div><div class="lbl">Grams brewed</div></div>
      <div class="stat"><div class="num">${w.distinctTeas}</div><div class="lbl">Teas explored</div></div>
      ${sixth}
    </div>

    ${w.topTea ? `<div class="section card">
      <div class="eyebrow">Your ${w.season.name.toLowerCase()} companion</div>
      <h2 style="margin:6px 0 2px;">${w.topTea.name}</h2>
      <div style="color:var(--ink-soft);font-size:13px;">${typeLabel(w.topTea.type)} · brewed ${w.topTeaN} time${w.topTeaN>1?'s':''}</div>
    </div>` : ''}

    <div class="section card">
      ${w.topType?`<div class="recap-line"><span class="recap-k">Leaf of the season</span><span class="recap-v">${typeLabel(w.topType)} · ${w.topTypeN}</span></div>`:''}
      <div class="recap-line"><span class="recap-k">Favourite time</span><span class="recap-v">${cap(partWord(w.topPart))}</span></div>
      <div class="recap-line"><span class="recap-k">New this season</span><span class="recap-v">${w.newTeas.length} tea${w.newTeas.length!==1?'s':''}</span></div>
      ${w.standout?`<div class="recap-line"><span class="recap-k">Standout cup</span><span class="recap-v">${(w.standout.teaName||(teaById(w.standout.teaId)||{}).name||'—')} ${renderStarsStatic(w.standout.rating,false)}</span></div>`:''}
    </div>

    ${w.newTeas.length?`<div class="section card">
      <div class="eyebrow">Teas you met this ${w.season.name.toLowerCase()}</div>
      <div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:6px;">${w.newTeas.slice(0,12).map(t=>`<span style="font-size:12px;padding:5px 10px;border:1px solid var(--line);border-radius:999px;">${t.name}</span>`).join('')}</div>
    </div>`:''}

    <div class="section card" style="text-align:center;">
      <p style="color:var(--ink-soft);font-size:14px;margin:0 0 14px;">A season of quiet cups. Here's to the next one.</p>
      <button class="btn btn-primary" onclick="shareWrapped()">Share my ${w.season.name}</button>
    </div>
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

  const nearLow = lowStockG()*2;
  const restock = state.teas
    .filter(t=>(t.isFavorite||t.wouldRebuy) && Number(t.amountGrams)>0 && Number(t.amountGrams)<nearLow)
    .sort((a,b)=>Number(a.amountGrams)-Number(b.amountGrams));
  const restockHTML = restock.length ? `
    <div class="section card">
      <div class="section-title"><h2>Running low</h2><span class="mono" style="font-size:11px;color:var(--ink-soft);">favourites & rebuys</span></div>
      ${restock.map(t=>{
        const g=Number(t.amountGrams); const low=g<lowStockG();
        const f=teaForecast(t); const est=f&&f.daysLeft>0?' · '+fmtDaysLeft(f.daysLeft):'';
        return `<div class="rank-row" onclick="openTeaDetail('${t.id}')" style="cursor:pointer;">
          <span class="rname">${t.isFavorite?'♥ ':''}${t.name}</span>
          <span class="rval" style="color:${low?'var(--red)':'var(--amber)'};font-weight:600;">${g.toFixed(1)}g${est}</span>
        </div>`;
      }).join('')}
    </div>` : '';

  return `
    <div class="persona"><div class="eyebrow">Your tea persona</div><h2>${persona.title}</h2><div class="persona-sub">${persona.subtitle}</div></div>

    ${recapHTML()}

    ${wrappedTeaser()}

    ${restockHTML}

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

    ${insightsHTML()}

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
