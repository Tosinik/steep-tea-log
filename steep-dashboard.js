// #16 (v3.82): the six raw grid numbers over ANY sessions array — the totals card windows by
// filtering first; computeStats delegates its all-time copies so one writer exists.
function gridStats(sessions){
  const totalSessions = sessions.length;
  const totalSteeps = sessions.reduce((a,s)=>a+steepCountOf(s),0);
  const totalGrams = sessions.reduce((a,s)=>a+(Number(s.gramsUsed)||0),0);
  const totalLiters = sessions.reduce((a,s)=>{
    const v = vesselById(s.vesselId);
    const cap = v ? Number(v.capacityMl)||0 : 0;
    // #24 (v3.85): the per-session water override wins over vessel capacity. Number() because the
    // edit modal leaves a string in state until the next load re-maps it.
    const ml = Number(s.waterMl)>0 ? Number(s.waterMl) : cap;
    return a + (ml*steepCountOf(s))/1000;
  },0);
  const days = new Set(sessions.map(s=>dayKey(s.date)));
  const uniqueTeas = new Set(sessions.map(s=>s.teaId)).size;
  return {totalSessions, totalSteeps, totalGrams, totalLiters, days, uniqueTeas};
}
// #16 calendar windows: 'week' = Monday 00:00 local (same anchor as the Home week card, so both
// say the same number under the same word), 'month' = the 1st 00:00 local, 'all' = null.
// Boundary sessions are IN (date >= start). `now` is a parameter so fixtures can pin boundaries.
function gridWindowStart(period, now){
  const d = new Date(now||Date.now()); d.setHours(0,0,0,0);
  if(period==='week'){ d.setDate(d.getDate()-((d.getDay()+6)%7)); return d; }
  if(period==='month'){ d.setDate(1); return d; }
  return null;
}
// Persisted device-local like tealog_teaDensity — a lens, not a setting worth syncing.
function gridPeriod(){ try{ const v=localStorage.getItem('tealog_statPeriod'); return (v==='week'||v==='month') ? v : 'all'; }catch(e){ return 'all'; } }
function setGridPeriod(p){ try{ localStorage.setItem('tealog_statPeriod', (p==='week'||p==='month')?p:'all'); }catch(e){} render(); }

function computeStats(){
  const sessions = state.sessions;
  const {totalSessions, totalSteeps, totalGrams, totalLiters, days, uniqueTeas} = gridStats(sessions);

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

  const lowStock = state.teas.filter(t=>isRunningLow(t));   // #18: shared predicate — goLowStock() lands on the Low chip, sets must agree

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
  // R100 — peakBuckets is the real answer and may hold more than one index; peakBucket keeps the
  // single-index shape for callers that only need somewhere to point. Empty buckets are filtered
  // out first: an all-zero clock has no peak, and argmaxTies would otherwise tie all twelve.
  const peakSet = argmaxTies(hourBuckets.map((v,i)=>[i,v]).filter(([,v])=>v>0));
  const peakBuckets = peakSet.keys, peakBucket = peakBuckets.length ? peakBuckets[0] : -1;

  return {totalSessions, totalSteeps, totalGrams, totalLiters, days, uniqueTeas, typeCounts, mostBrewed, topRated, favorites, lowStock, totalSpent, avgCostPerGram, streak, coldBrewCount, nightSessionCount, typesUsedCount, vesselsUsedCount, fiveStarSessions, hourBuckets, peakBucket, peakBuckets};
}

/* ---------- monthly spend (v3.26) ----------
   Groups priced teas by purchase MONTH. Teas without a purchase date (stock you
   already had) are excluded from the monthly view but surfaced separately, so an
   initial backlog isn't read as this month's spending. Builds a continuous
   last-12-months series so gaps show as empty bars. */
function computeMonthlySpend(){
  const byMonth = {};
  let undated = 0, undatedCount = 0;
  (state.teas||[]).forEach(t=>{
    const cost = Number(t.costTotal)||0;
    if(cost<=0) return;
    if(!t.purchaseDate){ undated += cost; undatedCount++; return; }
    const k = monthKey(t.purchaseDate);
    (byMonth[k] = byMonth[k] || {total:0,count:0,teas:[]});
    byMonth[k].total += cost; byMonth[k].count++; byMonth[k].teas.push(t);
  });
  const now = new Date();
  const series = [];
  for(let i=11;i>=0;i--){
    const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
    const k = d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
    const e = byMonth[k] || {total:0,count:0};
    series.push({key:k, total:e.total, count:e.count});
  }
  const nowK = monthKey(now);
  const totalDated = Object.values(byMonth).reduce((a,e)=>a+e.total,0);
  const activeMonths = Object.keys(byMonth).length;
  return {
    byMonth, series,
    thisMonth: (byMonth[nowK]&&byMonth[nowK].total)||0,
    thisMonthCount: (byMonth[nowK]&&byMonth[nowK].count)||0,
    thisMonthTeas: (byMonth[nowK]&&byMonth[nowK].teas)||[],
    undated, undatedCount, activeMonths, totalDated,
    avgPerActiveMonth: activeMonths ? totalDated/activeMonths : 0
  };
}

function viewSpend(){
  const ms = computeMonthlySpend();
  const nowK = monthKey(new Date());
  const max = Math.max(1, ...ms.series.map(m=>m.total));
  const hasAny = ms.totalDated>0 || ms.undated>0;

  const bars = ms.series.map(m=>{
    const h = Math.max(2, Math.round((m.total/max)*96));
    const isNow = m.key===nowK;
    return `<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:5px;min-width:0;">
      <div style="font-size:10px;color:var(--ink-soft);height:12px;">${m.total?currencyFmt(m.total,0):''}</div>
      <div title="${monthLabel(m.key,true)}: ${currencyFmt(m.total)}" style="width:66%;max-width:24px;height:${h}px;border-radius:4px 4px 0 0;background:${isNow?'var(--amber)':'var(--jade)'};opacity:${m.total?1:.2};"></div>
      <div style="font-size:9.5px;color:var(--ink-soft);white-space:nowrap;">${monthLabel(m.key,false)}</div>
    </div>`;
  }).join('');

  const teaRows = ms.thisMonthTeas.slice()
    .sort((a,b)=>(Number(b.costTotal)||0)-(Number(a.costTotal)||0))
    .map(t=>`<div style="display:flex;justify-content:space-between;gap:10px;padding:9px 0;border-top:1px solid var(--line);cursor:pointer;" onclick="openTeaDetail('${t.id}','teas')">
      <div style="min-width:0;"><div style="font-weight:600;">${escapeHtml(t.name)}</div><div style="font-size:11px;color:var(--ink-soft);">${t.source?escapeHtml(t.source)+' · ':''}${t.purchaseDate?fmtDate(t.purchaseDate):''}</div></div>
      <div class="mono" style="white-space:nowrap;">${currencyFmt(Number(t.costTotal)||0)}</div>
    </div>`).join('');

  const thisMonthName = new Date().toLocaleDateString(undefined,{month:'long',year:'numeric'});

  return `
    <button class="detail-back" onclick="goView('insights')">← Back to Insights</button>
    <div class="section-title"><h2 style="font-family:var(--font-display);font-size:20px;">Spending</h2></div>
    ${!hasAny ? `<div class="card empty">No priced purchases yet. Add a tea with a price and a purchase date and it'll show up here.</div>` : `
    <div class="card">
      <div class="eyebrow">${thisMonthName}</div>
      <div style="display:flex;align-items:baseline;gap:8px;margin-top:2px;">
        <div style="font-size:30px;font-weight:700;font-family:var(--font-display);">${currencyFmt(ms.thisMonth)}</div>
        <div style="font-size:12px;color:var(--ink-soft);">${ms.thisMonthCount} tea${ms.thisMonthCount===1?'':'s'} this month</div>
      </div>
      <div style="display:flex;align-items:flex-end;gap:4px;height:130px;margin-top:16px;">${bars}</div>
      <div style="display:flex;justify-content:space-between;margin-top:12px;font-size:12px;color:var(--ink-soft);">
        <span>Avg / active month: <strong style="color:var(--ink);">${currencyFmt(ms.avgPerActiveMonth)}</strong></span>
        <span>Tracked total: <strong style="color:var(--ink);">${currencyFmt(ms.totalDated)}</strong></span>
      </div>
    </div>
    ${teaRows ? `<div class="card"><div class="eyebrow">Bought this month</div><div style="margin-top:2px;">${teaRows}</div></div>` : ''}
    ${ms.undatedCount ? `<div class="card" style="font-size:12px;color:var(--ink-soft);"><strong style="color:var(--ink);">${currencyFmt(ms.undated)}</strong> from ${ms.undatedCount} priced tea${ms.undatedCount===1?'':'s'} without a purchase date isn't shown by month. Add a purchase date on a tea to include it.</div>` : ''}
    `}
  `;
}


/* Cost medians (#08 rev 3). NOT a recompute of anything shipped: `avgCostPerGram` is a POOLED
   ratio (totalSpent / gramsBought), which is a different statistic — one expensive 500 g brick
   moves it and moves no median. Both figures are derived here at render time from the user's own
   rows, and the board's €0.17/g · €0.86/session are not used: that method (cost_total ÷ grams) on
   this shelf gives €0.236/g, and the board's provenance is unknown.
   Partial by construction — cost is optional on a tea — so the card SAYS how many rows answered
   rather than implying the whole shelf. Below two data points a median is not a median: render
   nothing (the three-tier cascade's third rung), never a zero. */
function costMedians(){
  const med = a => { if(!a.length) return null; const v=[...a].sort((x,y)=>x-y), m=v.length>>1;
    return v.length%2 ? v[m] : (v[m-1]+v[m])/2; };
  const rate = {};                                   // teaId → cost per gram, only where both are known
  const perGram = [];
  (state.teas||[]).forEach(t=>{
    const c = Number(t.costTotal)||0, g = Number(t.costOriginalGrams)||0;
    if(c>0 && g>0){ rate[t.id] = c/g; perGram.push(c/g); }
  });
  const perSession = [];
  (state.sessions||[]).forEach(s=>{
    const r = rate[s.teaId], g = Number(s.gramsUsed)||0;
    if(r && g>0) perSession.push(r*g);
  });
  return { perGram: med(perGram), perGramN: perGram.length, teaN: (state.teas||[]).length,
           perSession: med(perSession), perSessionN: perSession.length, sessionN: (state.sessions||[]).length };
}
function costMediansHTML(){
  const m = costMedians();
  const cells = [];
  if(m.perGramN>=2)    cells.push(`<div class="stat"><div class="num">${currencyFmt(m.perGram)}</div><div class="lbl">Median / gram</div></div>`);
  if(m.perSessionN>=2) cells.push(`<div class="stat"><div class="num">${currencyFmt(m.perSession)}</div><div class="lbl">Median / session</div></div>`);
  if(!cells.length) return '';
  // R68: the denominator is generated, so the line can never claim a coverage it doesn't have.
  const src = [];
  if(m.perGramN>=2)    src.push(`${m.perGramN} of ${m.teaN} teas priced`);
  if(m.perSessionN>=2) src.push(`${m.perSessionN} of ${m.sessionN} sittings costable`);
  return `<div class="grid grid-2" style="margin-bottom:10px;">${cells.join('')}</div>
    <div class="mono" style="font-size:10px;color:var(--ink-soft);margin-bottom:12px;">${src.join(' · ')}</div>`;
}

// The two-digit bucket name the boards use: 08–10, not 8:00–10:00.
function bucketLabel(i){ const p=n=>String(n).padStart(2,'0'); return `${p(i*2)}–${p(i*2+2)}`; }
function brewingClockHTML(s){
  if(s.totalSessions===0) return '';
  const max = Math.max(1, ...s.hourBuckets);
  const labels = ['0','2','4','6','8','10','12','14','16','18','20','22'];
  const peaks = new Set(s.peakBuckets||[]);
  const bars = s.hourBuckets.map((v,i)=>{
    const h = Math.round(v/max*100);
    const isPeak = peaks.has(i);                       // R100: every tied peak is lit, not just the first
    return `<div class="clock-col">
      <div class="clock-bar-track"><div class="clock-bar" style="height:${h}%;background:${isPeak?'var(--amber)':'var(--jade)'};"></div></div>
      <div class="clock-lbl">${labels[i]}</div>
    </div>`;
  }).join('');
  // R100 — a tie is named, never resolved. "peak 08–10 and 12–14" says what is true; picking one
  // asserts a hierarchy that doesn't exist, and the old label did it silently.
  const pk = s.peakBuckets||[];
  const peakLabel = pk.length ? `${pk.length>1?'joint peak':'peak'} ${andList(pk.map(bucketLabel))}` : '';
  return `<div class="section card">
    <div class="section-title"><h2>When you brew</h2>${peakLabel?`<span class="mono" style="font-size:12px;color:var(--amber);">${peakLabel}</span>`:''}</div>
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
  // unit:'cur' is a MARKER, not a symbol — aUnit resolves it through currencySymbol() so the currency
  // pref is the single writer here too. A hardcoded '$' here was a wrong value waiting for someone to
  // flip ACHIEVEMENTS_ENABLED back on.
  {id:'big_spender',    title:'Big Spender', unit:'cur', tiers:[50,200,500,1000], metric:s=>s.totalSpent,                      label:n=>`Spend ${n} on tea`},
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
function aUnit(a){ return a.unit==='L' ? ' L' : (a.unit==='cur' ? ' '+currencySymbol() : (a.unit||'')); }
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
    if(animate && !state.settings.quietMode && ACHIEVEMENTS_ENABLED) celebrateAchievements(fresh);
  }
}
function celebrateAchievements(list){
  const names = list.map(a=>a.tierCount>1?`${a.title} (Lv ${a.level})`:a.title);
  showToast('Unlocked: '+names.join(' · '));
  confettiBurst();
}
function showToast(msg, ms){
  let host = document.getElementById('toastHost');
  if(!host){ host=document.createElement('div'); host.id='toastHost'; document.body.appendChild(host); }
  const t=document.createElement('div'); t.className='toast'; t.textContent=msg;
  host.appendChild(t);
  requestAnimationFrame(()=>t.classList.add('show'));
  setTimeout(()=>{ t.classList.remove('show'); setTimeout(()=>t.remove(),320); }, ms||4200);
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

// v3.83 (#23 audit F17): the streak framing goes — this was the last ungated streak surface after
// v3.72 hid achievements. The calendar heatmap stays on Sessions (per Niklas, v3.44), now neutral.
function streakCardHTML(){
  const s = computeStats();
  return `<div class="section card" style="margin-top:16px;">
    <div class="section-title"><h2>Brewing days</h2></div>
    ${heatmapHTML(s.days)}
  </div>`;
}
function teaForecast(tea){
  // v2 (v3.28): prefer a purchase-date LEDGER — actual net drawdown since you bought it,
  // (bought − on-hand) / days elapsed — which also captures untracked use. Falls back to
  // the older session-span estimate when there's no usable purchase anchor. Return shape
  // is unchanged so the restock card + tea detail sharpen automatically.
  const amt = Number(tea.amountGrams)||0;
  // Frequency × dose across ALL this tea's sessions (incl. cold brew and grams-less ones):
  // sessions/day sets the pace, the average logged dose sets the amount. Only one
  // grams-logged session is needed to anchor the dose — so any tea you've actually brewed
  // gets a prediction, not just teas with a purchase date or 2+ weighed sessions.
  const all = state.sessions.filter(s=>s.teaId===tea.id).sort((a,b)=>new Date(a.date)-new Date(b.date));
  const gramsPer = teaAvgDose(tea);   // #18: the one dose definition (steep-teas.js) — same math as before
  let sessionRate = null; // g/day
  if(gramsPer){
    const spanDays = Math.max(3, (Date.now()-new Date(all[0].date))/86400000);
    const perDay = (all.length/spanDays)*gramsPer;
    if(perDay>0) sessionRate = perDay;
  }

  // Ledger rate — anchored to a real buy date and the amount bought.
  let ledgerRate = null, sincePurchaseDays = null;
  const bought = Number(tea.costOriginalGrams)||0;
  if(tea.purchaseDate && bought>0){
    sincePurchaseDays = (Date.now()-new Date(tea.purchaseDate))/86400000;
    const consumed = bought - amt;
    // sane only: something's been used, on-hand not above what was bought, a few days elapsed
    if(sincePurchaseDays>=3 && consumed>0 && amt<=bought){
      ledgerRate = consumed/sincePurchaseDays;
    }
  }

  let perDay=null, method=null;
  if(ledgerRate!=null){ perDay=ledgerRate; method='ledger'; }
  else if(sessionRate!=null){ perDay=sessionRate; method='sessions'; }
  if(perDay==null || perDay<=0) return null;

  return {
    perWeek: perDay*7,
    perDay,
    daysLeft: amt>0?Math.round(amt/perDay):0,
    sessions: all.length,
    method,
    sincePurchaseDays: sincePurchaseDays!=null?Math.round(sincePurchaseDays):null,
    // a real elapsed window is inherently trustworthy; sessions need a little volume
    confident: method==='ledger' ? (sincePurchaseDays>=10) : (all.length>=4)
  };
}

/* Inventory-over-time (v3.28): reconstruct the stock curve for a tea from its purchase
   anchor (bought grams on the purchase date) down to today's on-hand amount, then a
   dashed projection to the estimated run-out. Only defined when a real buy anchor exists;
   teas you already had (no purchase date) simply have no chart. Endpoints are hard facts,
   so the spine is honest and always monotonic (amt is clamped into [0, bought]). */
function inventoryHistory(tea){
  const bought = Number(tea.costOriginalGrams)||0;
  if(!tea.purchaseDate || bought<=0) return null;
  const t0 = new Date(tea.purchaseDate).getTime();
  const now = Date.now();
  if(!(now>t0)) return null;
  const amt = Math.max(0, Math.min(bought, Number(tea.amountGrams)||0));
  const f = teaForecast(tea);
  const projT = (f && f.daysLeft>0 && amt>0) ? now + f.daysLeft*86400000 : null;
  return { t0, now, bought, amt, projT, forecast:f };
}

function inventorySparkline(tea){
  const h = inventoryHistory(tea);
  if(!h) return '';
  const { t0, now, bought, amt, projT } = h;
  const W=300, H=84, x0=6, x1=W-6, y0=10, y1=H-18;
  const tEnd = (projT && projT>now) ? projT : now;
  const tSpan = Math.max(1, tEnd - t0);
  const gMax  = Math.max(1, bought);
  const X = t => x0 + ((t - t0)/tSpan)*(x1 - x0);
  const Y = g => y1 - (Math.max(0,Math.min(gMax,g))/gMax)*(y1 - y0);
  const bx=X(t0), by=Y(bought), nx=X(now), ny=Y(amt);
  const area  = `M ${bx} ${y1} L ${bx} ${by} L ${nx} ${ny} L ${nx} ${y1} Z`;
  const spine = `M ${bx} ${by} L ${nx} ${ny}`;
  let proj='';
  if(projT && projT>now){
    const px=X(projT), py=Y(0);
    proj = `<path d="M ${nx} ${ny} L ${px} ${py}" fill="none" stroke="var(--amber)" stroke-width="2" stroke-dasharray="3 3" stroke-linecap="round"/>`
         + `<circle cx="${px}" cy="${py}" r="2.5" fill="var(--amber)"/>`;
  }
  const gLabel = g => (g%1 ? g.toFixed(1) : g)+'g';
  const runout = (projT && projT>now) ? 'runs out ~'+fmtDate(new Date(projT).toISOString()) : (amt<=0 ? 'empty' : '');
  return `
  <div class="inv-spark" style="margin-top:10px;">
    <svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block;" role="img" aria-label="Stock over time for ${escapeHtml(tea.name||'this tea')}">
      <line x1="${x0}" y1="${y1}" x2="${x1}" y2="${y1}" stroke="var(--line)" stroke-width="1"/>
      <path d="${area}" fill="var(--jade-pale)" opacity="0.7"/>
      <path d="${spine}" fill="none" stroke="var(--jade)" stroke-width="2" stroke-linecap="round"/>
      ${proj}
      <circle cx="${nx}" cy="${ny}" r="3" fill="var(--jade)"/>
    </svg>
    <div style="display:flex;justify-content:space-between;font-size:10px;color:var(--ink-soft);margin-top:2px;">
      <span>${fmtDate(new Date(t0).toISOString())} · ${gLabel(bought)}</span>
      <span>${runout}</span>
    </div>
  </div>`;
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
  const tail = !f.confident ? ' · rough estimate, sharpens as you log more'
             : (f.method==='ledger' ? ' · from your purchase date' : '');
  return `<div class="forecast-line">At your pace (~${wk}g/week), about <b>${fmtDaysLeft(f.daysLeft)}</b> left${tail}.</div>`;
}
/* DAY ONE (R115) — the greeting and ONE door. It replaces the three-step onboarding checklist, which
   was gated on `sessions.length===0` and therefore also met a user who had a shelf but had not
   brewed yet; board 4d draws exactly that user (one tea, two cups) getting an ordinary Home. The
   gate is now the shelf, which is what the copy is about.
   The checklist went for two reasons beyond the board: its step 2 ("add a vessel") is obsolete under
   R43, which made the vessel optional and never blocking; and a to-do list is a nag on the one
   surface whose whole argument is that it has nothing to nag with.
   ONE DOOR, NOT TWO. Board 4c also draws "or log a cup you've already had" — that link cannot work
   here: quick log requires a tea (`quickLogSession` toasts "Add a tea first." on an empty shelf, and
   R88 makes a tea mandatory for the record), so on a shelf of nothing it is a door to a toast.
   Ruling 5's own words are "the greeting and one door"; the text is buildable and the drawing is not,
   so the text wins. Flagged rather than quietly dropped. */
function dayOneHTML(){
  const now = new Date();
  const eyebrow = `${now.toLocaleDateString('en-US',{weekday:'long'})} ${d_hourBucket(now.getHours())}`;
  return `<div class="home-masthead">
      <div class="greeting-eyebrow">${escapeHtml(eyebrow)}</div>
      <h2 class="greeting-head">Nothing on the shelf yet.</h2>
      <div class="greeting-body">Add a tea and this becomes the page that tells you what&rsquo;s ready and what&rsquo;s running out.</div>
      <div class="mast-act"><button class="btn-clay" onclick="goView('teas')">Add your first tea</button></div>
    </div>`;
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
      <h2 style="font-family:var(--font-display);font-size:20px;">Achievements</h2>
      <span class="mono" style="font-size:12px;color:var(--amber);">${earnedTiers}/${totalTiers} tiers · ${started} started</span>
    </div>
    <div class="card"><div class="badge-grid">${list.map(badgeHTML).join('')}</div></div>
  `;
}
/* ================= STEEP WRAPPED =================
   A calm, seasonal recap built entirely from existing session data. No new
   infra. Northern-hemisphere meteorological seasons (matches Steep's users);
   flip the month ranges for a southern-hemisphere option later. */

/* ---------- editable dashboard (v3.27) ----------
   Home cards are a named registry rendered in a saved order with a hidden set,
   persisted in synced settings (settings.dashLayout). Edit mode adds move/hide
   controls; unknown/new cards fall back to the default order (forward-compatible).
   A generic "configurable synced surface" — reusable for other views later. */
// WS2 (v3.65) reworked the Insights surface into the reflective room: the flat recap/insights/types/
// mostrated cards were replaced by hero → reading → typemix → steepshape → notes → wrapped (built in
// steep-insights.js). Old ids drop out of saved layouts automatically (dashLayout filters to this list).
// WS2 (v3.74): Home reduced to glance cards only — greeting · running low · favourites · one number
// ('week'). The stat grid + brewing clock + cost + recent moved to Insights (reflection lives there
// now). Nothing deleted — the relocated cards stay editable/hideable, so no data or view is stranded.
/* R115 — THE GREETING IS NOT A CARD. It is the masthead: fixed, unmovable, unhideable, the app's
   voice and the one thing every Home has in common. Removing its id from this array is the whole
   migration, and it is free by construction: `dashLayout()` filters BOTH `order` and `hidden`
   against DASH_DEFAULT_ORDER, so a saved layout that hid the greeting simply stops mentioning a card
   that no longer exists — no write, no phantom row in edit mode, nothing else disturbed.
   Stated plainly because it OVERRIDES A DELIBERATE HIDE: a user who hid their greeting now sees it
   again. The alternative was a Home with no voice and no control left to bring it back, since the
   thing that would have unhidden it is a card list the greeting has just left. */
const DASH_DEFAULT_ORDER = ['restock','favorites','week','hero','reading','typemix','steepshape','notes','wrapped','recent','totals','clock','cost','origins'];
const DASH_LABELS = { restock:'Running low', favorites:'Favourites', week:'Sessions this week', recent:'Recent sessions', totals:'Totals', clock:'Brewing clock', cost:'Cost overview', hero:'This week, mostly', reading:'Cadence reading', typemix:'Type mix', steepshape:'Steep shape', notes:'Quiet notes', wrapped:'SlowCup Wrapped', origins:'Origins' };
// Each card's home surface (v3.44 split): 'home' or 'insights'. Reorder/hide work per-tab.
// Migration is automatic — existing saved {order,hidden} keep their visibility and gain a surface
// from this map (nothing a user hid can reappear); ids no longer present are filtered out.
/* R115's default-set rule, applied: a card defaults to Home if removing it would leave you unable to
   answer WHAT NOW without navigating. `restock` passes (what is running out) and `favorites` passes
   (what you reach for). **`week` fails** — it counts what already happened, which is Sessions' job
   and Insights' tense — so it defaults to Insights, the only other surface. Anyone who has moved it
   keeps it: the rule governs the DEFAULT SET, and a user's override still wins in `dashSurface()`. */
const DASH_SURFACE = {
  restock:'home', favorites:'home',
  week:'insights',
  recent:'insights', totals:'insights', clock:'insights', cost:'insights',
  hero:'insights', reading:'insights', typemix:'insights', steepshape:'insights', notes:'insights', wrapped:'insights',
  origins:'insights'   // R54 — and PINNED there by DASH_PINNED below; this entry is only the default
};
// Per-user surface override (v3.47): edit mode can move a card between Home and Insights.
// dashLayout.surface maps id→'home'|'insights', overriding the built-in DASH_SURFACE. Absent
// key = use the built-in; old saved layouts (no surface key) just fall through unchanged.
function dashSurfaceOverride(){ const L=state.settings.dashLayout; return (L&&L.surface)||{}; }
// A pinned card's surface is not negotiable — the override is ignored even if one exists in an
// older saved layout, so a move written before the pin can't strand a map on Home (R102).
function dashSurface(id){ return dashPinnedTo(id) || dashSurfaceOverride()[id] || DASH_SURFACE[id] || 'home'; }
function dashLayout(){
  const L = state.settings.dashLayout || {};
  let order = Array.isArray(L.order) ? L.order.filter(id=>DASH_DEFAULT_ORDER.includes(id)) : [];
  DASH_DEFAULT_ORDER.forEach(id=>{ if(!order.includes(id)) order.push(id); }); // append any new cards
  const hidden = new Set((Array.isArray(L.hidden)?L.hidden:[]).filter(id=>DASH_DEFAULT_ORDER.includes(id)));
  return { order, hidden };
}
function saveDashLayout(order, hidden){ state.settings.dashLayout = { order, hidden:[...hidden], surface:dashSurfaceOverride() }; persistSettings(); }
function dashToggleEdit(){ state.dashEdit = !state.dashEdit; render(); }
function dashMoveCard(id, dir){
  const { order, hidden } = dashLayout();
  const i = order.indexOf(id); if(i<0) return;
  const surf = dashSurface(id);
  let j = i+dir;
  while(j>=0 && j<order.length && dashSurface(order[j])!==surf) j += dir; // swap only with same-tab cards
  if(j<0 || j>=order.length) return;
  [order[i], order[j]] = [order[j], order[i]];
  saveDashLayout(order, hidden); render();
}
function dashHideCard(id){ const { order, hidden } = dashLayout(); hidden.add(id); saveDashLayout(order, hidden); render(); }
function dashShowCard(id){ const { order, hidden } = dashLayout(); hidden.delete(id); saveDashLayout(order, hidden); render(); }
// Move a card to the other tab. Stores an override (or clears it when moving back to the card's
// built-in surface, so no-op overrides don't accumulate) and re-lands it at the bottom of the
// destination tab. Reorder-within-tab (dashMoveCard) then works because dashSurface reflects the override.
/* R102 — the fence lives HERE, not in DASH_SURFACE. That table sets a DEFAULT; this function
   writes an override for any id, so a registry entry of 'insights' left a user free to move Origins
   to Home — exactly what R54 exists to prevent (Home has no revision board; a map is not a glance
   card). A default is not a constraint. Pinned ids keep their move control unrendered AND refuse the
   move if one is somehow invoked, because the two are different failure modes. */
const DASH_PINNED = { origins:'insights' };
function dashPinnedTo(id){ return DASH_PINNED[id] || null; }
function dashMoveToSurface(id){
  if(dashPinnedTo(id)) return;                        // R54 via R102: refuse, don't just hide the button
  const { order, hidden } = dashLayout();
  const dest = dashSurface(id)==='home' ? 'insights' : 'home';
  const ov = {...dashSurfaceOverride()};
  if((DASH_SURFACE[id]||'home')===dest) delete ov[id]; else ov[id]=dest;
  state.settings.dashLayout = { order, hidden:[...hidden], surface:ov }; // set override first so dashSurface below reflects dest
  const i = order.indexOf(id); if(i>=0) order.splice(i,1);
  let at = 0; for(let k=0;k<order.length;k++){ if(dashSurface(order[k])===dest) at=k+1; } // land at bottom of destination tab
  order.splice(at,0,id);
  saveDashLayout(order, hidden); render();
}
function dashResetLayout(){ state.settings.dashLayout = { order:[...DASH_DEFAULT_ORDER], hidden:[], surface:{} }; persistSettings(); render(); }
function renderDashboard(cards, surface){
  surface = surface || 'home';
  const { order, hidden } = dashLayout();
  const editing = !!state.dashEdit;
  const onSurface = id => dashSurface(id)===surface && cards[id]!=null; // only this tab's cards
  const editBar = `<div style="display:flex;justify-content:flex-end;margin-bottom:10px;">
    <button class="lib-chip ${editing?'active':''}" onclick="dashToggleEdit()">${editing?'✓ Done':`${icon('i-edit-hl',13)} Edit layout`}</button>
  </div>`;
  const visible = order.filter(id=>onSurface(id) && !hidden.has(id));
  const body = visible.map(id=>{
    const html = cards[id]; if(html==null) return '';
    if(!editing) return html;
    const isEmpty = String(html).trim()==='';
    const inner = isEmpty ? `<div class="card empty" style="opacity:.6;">${DASH_LABELS[id]} — nothing to show right now</div>` : html;
    return `<div style="border:1px dashed var(--line);border-radius:12px;padding:8px;margin-bottom:12px;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px;">
        <span style="font-size:12px;color:var(--ink-soft);font-weight:600;">${DASH_LABELS[id]}</span>
        <span style="display:flex;gap:4px;">
          <button class="lib-chip" onclick="dashMoveCard('${id}',-1)" aria-label="Move up">↑</button>
          <button class="lib-chip" onclick="dashMoveCard('${id}',1)" aria-label="Move down">↓</button>
          ${dashPinnedTo(id) ? '' : `<button class="lib-chip" onclick="dashMoveToSurface('${id}')" title="Move to the other tab">${surface==='home'?'→ Insights':'→ Home'}</button>`}
          <button class="lib-chip" onclick="dashHideCard('${id}')">Hide</button>
        </span>
      </div>
      <div style="pointer-events:none;">${inner}</div>
    </div>`;
  }).join('');
  const hiddenIds = order.filter(id=>onSurface(id) && hidden.has(id));
  const hiddenPanel = editing ? `<div class="section card">
    <div class="section-title"><h2>Hidden cards</h2></div>
    ${hiddenIds.length ? hiddenIds.map(id=>`<div class="rank-row"><span class="rname">${DASH_LABELS[id]}</span><button class="lib-chip" onclick="dashShowCard('${id}')">Show</button></div>`).join('') : '<div class="empty">Nothing hidden — every card is on your dashboard.</div>'}
    <div style="margin-top:14px;"><button class="btn" onclick="dashResetLayout()">Reset to default order</button></div>
  </div>` : '';
  return `${editBar}${body}${hiddenPanel}`;
}

// Every dashboard card, keyed by id, built once so either tab can render any of them — cross-tab
// moves (dashMoveToSurface) need a card's HTML available on whichever surface it lands on.
// renderDashboard(cards, surface) filters this by effective surface. Home builders live here;
// Insights builders (dashCardsInsights) live in steep-insights.js — both share one computeStats.
function dashCards(){ const s=computeStats(); return {...dashCardsHome(s), ...dashCardsInsights(s)}; }
/* ---------- greeting card (v3.54, window-aware v3.55) — the calm replacement for the removed
   persona banner. A time-of-day greeting + ONE gentle tea suggestion, deterministic per calendar
   day so it doesn't reshuffle on every render. Ritual-first: no identity label, no streaks/gaps,
   never "you haven't logged". (Seasonal word from the task is left out — "warm/cold" is hemisphere-
   dependent and we don't know the user's, so a plain time-of-day line stays safe.)
   v3.55: respect the user's real drinking window. If NOW is outside the buckets they actually brew
   in (given enough signal), don't nudge a brew now — look forward to the next active window and
   suggest FOR that one. The greeting line still tells the truth about now. */
const GREETING_LINE = { morning:'Good morning', afternoon:'Good afternoon', evening:'Good evening', night:'A quiet night' };
const BUCKET_NOUN   = { morning:'morning', afternoon:'afternoon', evening:'evening', night:'late-night' };
const BUCKET_WHEN   = { morning:'this morning', afternoon:'this afternoon', evening:'this evening', night:'tonight' };
const BUCKET_CYCLE  = ['morning','afternoon','evening','night'];
// Same hour cutoffs as timeOfDayBuckets (steep-insights.js): 5–12 / 12–17 / 17–22 / else.
function d_hourBucket(h){ if(h>=5&&h<12) return 'morning'; if(h>=12&&h<17) return 'afternoon'; if(h>=17&&h<22) return 'evening'; return 'night'; }
// Stable FNV-1a hash — equal-score candidates tie-break the same way all day (no Math.random,
// which would reshuffle the pick on every re-render).
function d_hash(str){ let h=2166136261>>>0; for(let i=0;i<str.length;i++){ h^=str.charCodeAt(i); h=Math.imul(h,16777619)>>>0; } return h>>>0; }
// v3.61: pick one line from a pool, stable for the whole calendar day (own '|copy' seed so the copy
// choice is independent of which tea gets picked). One voice per day, no reshuffle on re-render.
// v3.67: optional `salt` lets two pools on the same card draw independently (ack + tail) yet stay
// stable per day — without it both would land on the same index.
function d_copyPick(pool, todayKey, salt){ return pool[d_hash(todayKey+'|copy'+(salt||'')) % pool.length]; }
// v3.67: same-day type-variety guard — after a session, a forward suggestion for LATER TODAY won't
// repeat the just-logged type (Niklas: "not two greens in a row in the morning"). Tunable so a later
// phase-2 pass can replace the hard rule with the user's observed repeat behaviour.
const VARIETY_GUARD_SAME_DAY = true;
// Deterministic top pick for a target time-of-day bucket. `excludeIds` (Set) drops brewed-today teas;
// `excludeType` drops one leaf type (the variety guard). Same scoring as the greeting always used —
// target-bucket history dominates, rating/favourite are small nudges, a date-seeded hash breaks ties.
// Returns {t,bucketCount,score,tie} or null when nothing qualifies.
// #25 (v3.88): a tea brewed within the last RECENCY_DAYS *prior* days is softly demoted so the
// greeting doesn't re-suggest what was just had. SOFT (a score penalty, not an exclude) so a tiny
// shelf never runs out of picks and a strongly-habitual tea can still surface. PRIOR days only —
// today is excluded so logging a tea today can't retroactively change the day's predicted pick
// (the predicted-vs-actual stability at the session-aware branch). Deterministic: the window is
// measured from the passed-in todayKey ('YYYY-MM-DD'), never Date.now(). Both tunables.
const RECENCY_DAYS = 3;         // v3.90 (#25 follow-up): 2 was too narrow — a two-days-ago brew sat at
const RECENCY_PENALTY = 1.75;   // the window edge (half strength), so a habitual favourite still won.
                                // proximity-scaled: nearest prior day = full penalty, tapering to 1/DAYS
                                // at the window's far edge. Tuned against real data (a bucket-lead-of-1
                                // favourite brewed 2 days ago is now demoted; a strongly-habitual tea, or
                                // one with no recent brew, still surfaces). Both tunables; taste dial.
function d_scorePick(target, todayKey, excludeIds, excludeType){
  const sessions = state.sessions || [];
  const candidates = (state.teas||[]).filter(t=> !isTeaFinished(t)
    && !(excludeIds && excludeIds.has(t.id))
    && !(excludeType && t.type===excludeType));
  if(!candidates.length) return null;
  const todayMs = Date.parse(todayKey);   // calendar-day anchor; both sides parsed as UTC midnight → exact day diff
  const scored = candidates.map(t=>{
    const mine = sessions.filter(se=>se.teaId===t.id);
    const bucketCount = mine.filter(se=>d_hourBucket(new Date(se.date).getHours())===target).length;
    let recency = 0;   // nearest prior-day brew within the window drives the penalty
    mine.forEach(se=>{ const d=Math.round((todayMs-Date.parse(dayKey(se.date)))/86400000);
      if(d>=1 && d<=RECENCY_DAYS){ const p=RECENCY_PENALTY*(RECENCY_DAYS-d+1)/RECENCY_DAYS; if(p>recency) recency=p; } });
    const score = bucketCount + (Number(t.rating)||0)*0.05 + (t.isFavorite?0.15:0) - recency;
    return { t, bucketCount, score, tie:d_hash(todayKey+'|'+t.id) };
  }).sort((a,b)=> b.score-a.score || b.tie-a.tie);
  return scored[0];
}
// v3.70 — habit-aware ingredients (issues #4 + #5). All tunable; register is guilt-free / celebratory,
// never caffeine-nagging or absence-scolding (see triage addendum, Niklas 2026-07-10).
const REDISCOVERY_WEEKS = 3;   // an in-stock tea unbrewed this long may resurface as the day's pick
const REDISCOVERY_ODDS  = 4;   // deterministic 1-in-N days it may fire (d_hash(todayKey+'|shelf') % N === 0)
const ORDINALS = ['zeroth','first','second','third','fourth','fifth','sixth','seventh','eighth','ninth','tenth'];
function d_ordinal(n){ return ORDINALS[n] || (n+'th'); }
function d_cap(s){ return s.charAt(0).toUpperCase()+s.slice(1); }
// Typical sessions/day from history EXCLUDING today (so today's excess actually reads as excess); null
// until a 5-distinct-day signal exists — below that we can't call any count "more than usual".
function d_typicalPerDay(todayKey){
  const sessions = state.sessions||[]; const byDay={};
  sessions.forEach(se=>{ const k=dayKey(se.date); if(k===todayKey) return; byDay[k]=(byDay[k]||0)+1; });
  const days = Object.keys(byDay); if(days.length<5) return null;
  let total=0; days.forEach(k=>total+=byDay[k]); return total/days.length;
}
// Most-neglected in-stock tea: never brewed OR last brew ≥ REDISCOVERY_WEEKS ago. Oldest-waiting first,
// date-seeded hash tie-break. Honours the same exclusions as d_scorePick. Returns {t,weeks|null} or null.
function d_rediscoveryPick(todayKey, excludeIds, excludeType){
  const sessions = state.sessions||[]; const now=Date.now();
  const cutoff = REDISCOVERY_WEEKS*7*24*3600*1000;
  const lastBrew = {};
  sessions.forEach(se=>{ const t=+new Date(se.date); if(!(se.teaId in lastBrew)||t>lastBrew[se.teaId]) lastBrew[se.teaId]=t; });
  const cands = (state.teas||[]).filter(t=> !isTeaFinished(t)
    && !(excludeIds && excludeIds.has(t.id))
    && !(excludeType && t.type===excludeType)
    && (!(t.id in lastBrew) || (now-lastBrew[t.id])>=cutoff));
  if(!cands.length) return null;
  cands.sort((a,b)=>{ const la=(a.id in lastBrew)?lastBrew[a.id]:0, lb=(b.id in lastBrew)?lastBrew[b.id]:0;
    return la-lb || d_hash(todayKey+'|'+b.id)-d_hash(todayKey+'|'+a.id); });
  const top=cands[0]; const weeks=(top.id in lastBrew)?Math.floor((now-lastBrew[top.id])/(7*24*3600*1000)):null;
  return { t:top, weeks };
}
/* THE MASTHEAD (R115), and the app's only clay action (R113).
   Renamed from `greetingCardHTML` because it is no longer a card: `viewDashboard` draws it above the
   stack, it cannot be hidden, moved or reordered, and R114 puts it on bare ground rather than the
   jade-pale panel it used to sit in.
   CLAY IS THE SECOND ARGUMENT, and only the branch that suggests a tea for NOW passes one. Contract
   2 is at most one committing action per surface, not exactly one: an evening Home that reports the
   day rather than proposing a cup correctly carries none, and a redirected suggestion ("save the X
   for tomorrow") must not offer to brew it now — the button would contradict the sentence above it.
   The copy in `greet`/`sub` is untouched; this is a container change plus one action. */
function greetingMastheadHTML(){
  const now = new Date();
  const bucket = d_hourBucket(now.getHours());
  const greet = GREETING_LINE[bucket];
  const sessions = state.sessions || [];
  // WS2 (v3.74): greeting is the hero — mono eyebrow (weekday + time-of-day) over a full-voice Shippori
  // headline, then the engine's line as the body. Reskin only; the copy in `greet`/`sub` is unchanged.
  // Force English for this UI chrome (bucket words are English too) — a locale-mixed "Freitag evening"
  // reads broken. User INPUT (notes/tags) stays whatever the user types; this is chrome only.
  const eyebrow = `${now.toLocaleDateString('en-US',{weekday:'long'})} ${bucket}`;
  const card = (sub, commitTea) => `<div class="home-masthead">
      <div class="greeting-eyebrow">${escapeHtml(eyebrow)}</div>
      <h2 class="greeting-head">${greet}.</h2>
      ${sub ? `<div class="greeting-body">${sub}</div>` : ''}
      ${commitTea ? `<div class="mast-act">
        <button class="btn-clay" onclick="homeStartSteeping(this,'${escapeJsArg(commitTea.id)}')">Start steeping</button>
        <button class="btn-ghost mast-quiet" onclick="homeLogCup(this,'${escapeJsArg(commitTea.id)}')">Log a cup &rarr;</button>
      </div>` : ''}
    </div>`;
  const todayKey = dayKey(now);
  if(!sessions.length) return card(d_copyPick([
    `The kettle&rsquo;s patient whenever you are.`,
    `Nothing brewing yet — the kettle&rsquo;s patient.`,
    `A fresh shelf and a warm kettle. No rush.`,
    `Whenever you&rsquo;re ready, the first steep is waiting.`,
  ], todayKey));
  const teaLink = t => `<span onclick="openTeaDetail('${escapeJsArg(t.id)}')" style="color:var(--jade-deep);font-weight:600;cursor:pointer;text-decoration:underline;">${escapeHtml(t.name)}</span>`;
  const todaySessions = sessions.filter(se=>dayKey(se.date)===todayKey);
  const brewedToday = new Set(todaySessions.map(se=>se.teaId));
  // v3.70 (issue #4) — a "more than usual" day: today's session count beats the user's typical per-day
  // (5-day signal, today excluded from the baseline). Celebratory, count-aware; surfaced in the ack below.
  const typicalPerDay = d_typicalPerDay(todayKey);
  const bigDay = typicalPerDay!=null && todaySessions.length>=2 && todaySessions.length>typicalPerDay;

  // v3.55 active-window detection: a bucket is "active" if it holds ≥2 sessions OR ≥15% of the
  // total. Needs ≥5 sessions of signal; below that keep v3.54 behaviour (too little to say "you
  // never brew now").
  const counts = { morning:0, afternoon:0, evening:0, night:0 };
  sessions.forEach(se=>{ counts[d_hourBucket(new Date(se.date).getHours())]++; });
  const isActive = b => counts[b]>=2 || counts[b] >= sessions.length*0.15;
  const enoughSignal = sessions.length>=5;

  // v3.70 (issue #4) — zero-session EVENING: history exists, nothing logged today, and the user's
  // brewing windows have passed unused (evening/night aren't windows they brew in). A guilt-free,
  // playful line — the tea/kettle/shelf is the character, never the user's absence. Evening-only and
  // self-limiting: a new day resets todayKey so it's gone by morning; never references counts or
  // consecutive days (DECIDED guilt-free register, triage addendum 2026-07-10).
  if(enoughSignal && !todaySessions.length && bucket==='evening' && !isActive('evening') && !isActive('night')){
    return card(d_copyPick([
      `The gaiwan enjoyed the day off.`,
      `Quiet day — the shelf held the fort.`,
      `The kettle took the evening easy.`,
      `A still day on the shelf; it suits the leaves fine.`,
      `The teas kept each other company today.`,
      `No steam today — the kettle caught up on rest.`,
      `The shelf had a slow, unhurried day.`,
      `Leaves rested, kettle cooled — all&rsquo;s well.`,
    ], todayKey, 'off'));
  }

  // v3.67 — SESSION-AWARE (issue #2): a session already logged in the CURRENT bucket today. Don't
  // nudge another same-bucket brew. Acknowledge the ritual (referencing the day's deterministic
  // prediction — predicted-vs-actual), then either suggest FORWARD for a later active window (with
  // the same-day variety guard) or let the card rest.
  const bucketSessions = todaySessions.filter(se=>d_hourBucket(new Date(se.date).getHours())===bucket);
  if(bucketSessions.length){
    const last = bucketSessions.reduce((a,b)=> new Date(b.date)>new Date(a.date)?b:a);
    const loggedTea = teaById(last.teaId);
    // Prediction is recomputable (same seed); compare WITHOUT excluding brewed-today so it's stable
    // before/after the log — otherwise logging the predicted tea would silently change the answer.
    const predicted = d_scorePick(bucket, todayKey, null, null);
    const tookPredicted = !!(predicted && loggedTea && predicted.t.id===loggedTea.id);
    let ack;
    if(loggedTea){
      ack = tookPredicted
        ? d_copyPick([ `Good choice — the ${teaLink(loggedTea)} it is.`,
                       `The ${teaLink(loggedTea)} — a lovely start.`,
                       `The ${teaLink(loggedTea)} in the pot already. Nice.`,
                       `The ${teaLink(loggedTea)}, just as the day called for.`,
                       `Right on cue — the ${teaLink(loggedTea)}.` ], todayKey, 'ack')
        // ack rider (v3.88): a *retrospective* on the cup already brewed, never a suggestion —
        // every line reads past-tense / in-the-pot so it can't be mistaken for "brew this next".
        : d_copyPick([ `The ${teaLink(loggedTea)} today — a nice surprise in the pot.`,
                       `The ${teaLink(loggedTea)} instead — a lovely, unexpected pour.`,
                       `Ooh, the ${teaLink(loggedTea)} — not what I&rsquo;d have guessed you&rsquo;d reach for.`,
                       `The ${teaLink(loggedTea)} — a turn off the usual, already steeped.`,
                       `The ${teaLink(loggedTea)} in the pot — lovely, and unexpected.` ], todayKey, 'ack');
    } else {
      ack = d_copyPick([ `Nicely steeped already.`, `Well steeped this ${BUCKET_NOUN[bucket]}.`,
                         `A good pour already behind you.` ], todayKey, 'ack');
    }
    // v3.70 (issue #4) — on a more-than-usual day the count itself is worth a warm nod; it overrides the
    // predicted-vs-actual ack (celebratory, count-aware, never nagging for more). Tail below still runs.
    if(bigDay){
      const ord = d_cap(d_ordinal(todaySessions.length));
      ack = d_copyPick([
        `${ord} pour today — a proper tea day.`,
        `The kettle&rsquo;s earning its keep today.`,
        `A generous tea day; the shelf approves.`,
        `${ord} steep in — the leaves are well looked-after today.`,
        `Big tea day — the kettle&rsquo;s humming.`,
        `More tea than usual today. Lovely.`,
        `A day of many pours; the kettle&rsquo;s glad of it.`,
      ], todayKey, 'ack');
    }
    // A later ACTIVE window today that has no session yet? (needs signal to call a window "active".)
    let laterWindow = null;
    if(enoughSignal){
      const idx = BUCKET_CYCLE.indexOf(bucket);
      for(let i=idx+1;i<BUCKET_CYCLE.length;i++){ const b=BUCKET_CYCLE[i];
        if(isActive(b) && !todaySessions.some(se=>d_hourBucket(new Date(se.date).getHours())===b)){ laterWindow=b; break; } }
    }
    // Forward pick for that window, minus brewed-today and (variety guard) the just-logged type.
    let fwd = null;
    if(laterWindow){
      const excludeType = (VARIETY_GUARD_SAME_DAY && loggedTea) ? loggedTea.type : null;
      fwd = d_scorePick(laterWindow, todayKey, brewedToday, excludeType);
    }
    const tail = fwd
      ? d_copyPick([ `Maybe the ${teaLink(fwd.t)} ${BUCKET_WHEN[laterWindow]}?`,
                     `The ${teaLink(fwd.t)} could round out ${BUCKET_WHEN[laterWindow]}.`,
                     `How about the ${teaLink(fwd.t)} ${BUCKET_WHEN[laterWindow]}?`,
                     `Perhaps the ${teaLink(fwd.t)} to come ${BUCKET_WHEN[laterWindow]}.`,
                     `The ${teaLink(fwd.t)} would sit well ${BUCKET_WHEN[laterWindow]}.` ], todayKey, 'tail')
      : d_copyPick([ `That&rsquo;s the day&rsquo;s brewing — the kettle can rest.`,
                     `Well steeped today; the shelf can rest now.`,
                     `The kettle&rsquo;s earned its quiet.`,
                     `A good day&rsquo;s steeping. Let it settle.`,
                     `The leaves have done their part today.` ], todayKey, 'tail');
    return card(ack + ' ' + tail);
  }

  // v3.70 (issue #5) — rediscovery: on a deterministic ~1-in-N days, the day's pick becomes the most-
  // neglected in-stock tea (never brewed, or quiet ≥ REDISCOVERY_WEEKS) instead of the habitual one, in
  // its own "remember this?" register. Needs shelf signal; excludes brewed-today; the seed is date-only
  // so the choice is stable across the day and independent of the copy pick.
  if(enoughSignal && d_hash(todayKey+'|shelf') % REDISCOVERY_ODDS === 0){
    const redis = d_rediscoveryPick(todayKey, brewedToday, null);
    if(redis){
      const rname = teaLink(redis.t);
      return card(redis.weeks!=null
        ? d_copyPick([
            `The ${rname} has been waiting ${redis.weeks} weeks — remember it?`,
            `Remember the ${rname}? It&rsquo;s been about ${redis.weeks} weeks.`,
            `The ${rname}&rsquo;s been quiet on the shelf for ${redis.weeks} weeks. Today?`,
            `It&rsquo;s been ${redis.weeks} weeks since the ${rname} — maybe today.`,
          ], todayKey, 'shelf')
        : (isTeaUnopened(redis.t)
            // #17 (v3.88): only claim "unopened" when the shelf agrees — no purchase data, or stock
            // still at/above what was bought. A tea drawn down below its purchase amount HAS been
            // opened (just not brewed in-app), so it gets the neglected-tea register, never "unopened".
            ? d_copyPick([
                `The ${rname} is still unopened — today could be the day.`,
                `You&rsquo;ve not brewed the ${rname} yet; it&rsquo;s waited patiently.`,
                `The ${rname}&rsquo;s never been steeped — shall we?`,
              ], todayKey, 'shelf')
            : d_copyPick([
                `The ${rname} has waited patiently on the shelf — today?`,
                `The ${rname}&rsquo;s been open a while without a steep; maybe today.`,
                `Time to return to the ${rname}? It&rsquo;s been waiting.`,
              ], todayKey, 'shelf')));
    }
  }

  // ---- no session in the current bucket yet: v3.55 window-aware suggestion (unchanged) ----
  // If the current bucket is inactive, redirect the suggestion to the next active bucket and speak
  // forward instead of nudging a brew now.
  let target = bucket, redirected = false;
  if(enoughSignal && !isActive(bucket)){
    for(let i=1;i<=3;i++){ const cand = BUCKET_CYCLE[(BUCKET_CYCLE.indexOf(bucket)+i)%4];
      if(isActive(cand)){ target = cand; redirected = true; break; } }
  }
  // Forward within the same day order = still today; a wrap past night into morning = tomorrow.
  const targetToday = !redirected || BUCKET_CYCLE.indexOf(target) > BUCKET_CYCLE.indexOf(bucket);
  // exclude already-brewed-today only when the target window is still today (tomorrow can repeat).
  const pick = d_scorePick(target, todayKey, (targetToday?brewedToday:null), null);
  if(!pick) return card('');
  const name = teaLink(pick.t);
  // v3.61: each branch draws from a small pool, ONE voice per calendar day (a copy-seeded hash,
  // independent of the tea pick, so it doesn't reshuffle on re-render). Tea name stays the tap-target.
  let sub;
  if(redirected){
    const tn = BUCKET_NOUN[target], tw = BUCKET_WHEN[target];
    if(bucket==='night'){
      // Night spans midnight, so "the morning" is safe either way — don't claim "tomorrow" here.
      sub = d_copyPick([
        `The ${name} will be waiting for the ${tn}.`,
        `Sleep well — the ${name} will keep till ${tn}.`,
        `The ${name} isn&rsquo;t going anywhere before ${tn}.`,
        `The ${name} will still be there come ${tn}.`,
        `Rest easy; the ${name} holds till ${tn}.`,
      ], todayKey);
    } else if(targetToday){
      sub = d_copyPick([
        `Maybe save the ${name} for ${tw}.`,
        `How about the ${name} ${tw}?`,
        `The ${name} could be a good ${tn} plan.`,
        `The ${name} might suit ${tw} nicely.`,
        `Perhaps the ${name} when ${tn} comes.`,
      ], todayKey);
    } else {
      sub = d_copyPick([
        `Maybe save the ${name} for tomorrow ${tn}.`,
        `How does the ${name} sound for tomorrow ${tn}?`,
        `Tomorrow ${tn} has the ${name}&rsquo;s name on it.`,
        `The ${name} could open tomorrow ${tn}.`,
        `Pencil in the ${name} for tomorrow ${tn}.`,
      ], todayKey);
    }
  } else {
    const bn = BUCKET_NOUN[bucket], bw = BUCKET_WHEN[bucket];
    // Only claim "your <bucket> pick" when there's real bucket history; otherwise a neutral nudge.
    sub = pick.bucketCount>0
      ? d_copyPick([
          `Maybe the ${name}? It&rsquo;s been your ${bn} pick.`,
          `How about the ${name}? It&rsquo;s been carrying your ${bn}s lately.`,
          `How do you feel about the ${name} ${bw}?`, // v3.62: BUCKET_WHEN, so night reads "tonight" not "this late-night"
          `Your ${bn} usually says ${name}.`,
          `The ${name} has your ${bn}s&rsquo; measure.`,
          `A ${bn} like this often wants the ${name}.`,
        ], todayKey)
      : d_copyPick([
          `Maybe the ${name} ${bw}?`,
          `How about the ${name} ${bw}?`,
          `Feeling like the ${name} ${bw}?`,
          `The ${name} could be lovely ${bw}.`,
          `Perhaps the ${name} to ease into ${bw}.`,
        ], todayKey);
  }
  // The ONLY clay on Home. `redirected` means the sentence proposes a later window ("save the X for
  // tomorrow"), so a Start-steeping button beside it would argue with its own caption.
  return card(sub, redirected ? null : pick.t);
}

/* The masthead's two actions. Both mirror `quickLogSession`'s dirty-draft guard rather than calling
   `startSessionFor` bare, because this button is the first thing on the first screen and it would
   otherwise DISCARD A RUNNING STEEP in silence. Tea detail's two entries (`steep-teas.js`) still call
   it bare — shipped behaviour, preserved under R61 and named here rather than left as a surprise.
   `homeLogCup` is the retrospective sibling: same tea, recorded rather than brewed. It re-checks the
   draft because `startSessionFor` early-returns when there is no vessel, and `beginQuickLog` would
   then run against a draft that return never created. */
function homeStartSteeping(btn, teaId){
  if(sessionDraftDirty(state.sessionDraft)){
    if(btn){ armConfirm(btn, 'Discard the session in progress?', ()=>startSessionFor(teaId)); return; }
    state.view='session'; render(); return;
  }
  startSessionFor(teaId);
}
function homeLogCup(btn, teaId){
  const go = ()=>{ startSessionFor(teaId); if(state.sessionDraft) beginQuickLog(); };
  if(sessionDraftDirty(state.sessionDraft)){
    if(btn){ armConfirm(btn, 'Discard the session in progress?', go); return; }
    state.view='session'; render(); return;
  }
  go();
}

function dashCardsHome(s){
  const lowStockHTML = s.lowStock.length ? s.lowStock.map(t=>`
    <div class="rank-row"><span class="rname">${escapeHtml(t.name)}</span><span class="rval" style="color:var(--red)">${Number(t.amountGrams).toFixed(1)}g left</span></div>
  `).join('') : '<div class="empty">All stocked up.</div>';

  const recent = [...state.sessions].sort((a,b)=>new Date(b.date)-new Date(a.date)).slice(0,4);
  const recentHTML = recent.length ? `
    <div class="section card">
      <div class="section-title"><h2>Recent sessions</h2></div>
      ${recent.map(se=>{
        const tea = teaById(se.teaId);
        return `<div class="rank-row" onclick="openSessionEdit('${escapeJsArg(se.id)}')" style="cursor:pointer;">
          <span class="rname">${escapeHtml(se.teaName || (tea?tea.name:'—'))}${se.rating?' '+renderStarsStatic(se.rating,false):''}</span>
          <span class="rval" style="color:var(--ink-soft);font-size:12px;">${brewCountLabel(se)} · ${new Date(se.date).toLocaleDateString()}</span>
        </div>`;
      }).join('')}
    </div>` : '';

  // v3.82: membership back to LOW-only (restockCandidate, steep-teas.js) — v3.81's {low,few}
  // put "a few cups" rows under a "Running low" headline beside a ~months forecast.
  // v3.86 (#26 B): empty favourites/rebuys join; their cell reads "empty" — a "0.0g" would claim
  // a precision the drained tin doesn't need. The grams sort floats them to the top for free.
  const restock = state.teas.filter(restockCandidate)
    .sort((a,b)=>Number(a.amountGrams)-Number(b.amountGrams));
  const restockHTML = restock.length ? `
    <div class="section card">
      <div class="section-title"><h2>Running low</h2><span class="mono" style="font-size:11px;color:var(--ink-soft);">favourites & rebuys</span></div>
      ${restock.map(t=>{
        const g=Number(t.amountGrams);
        const f=teaForecast(t); const est=f&&f.daysLeft>0?' · '+fmtDaysLeft(f.daysLeft):'';
        return `<div class="rank-row" onclick="openTeaDetail('${escapeJsArg(t.id)}')" style="cursor:pointer;">
          <span class="rname" style="display:flex;align-items:center;gap:9px;">${favLeaf(15)}${escapeHtml(t.name)}</span>
          <span class="rval mono" style="color:var(--clay);font-size:13px;">${isTeaFinished(t)?'empty':`${g.toFixed(1)}g${est}`}</span>
        </div>`;
      }).join('')}
    </div>` : '';

  return {
    restock: restockHTML,
    recent: recentHTML,
    // #16 (v3.82): a period lens on the RAW numbers only — scoped reinstatement; v3.65's
    // "observations, not KPIs" line stands everywhere else. The eyebrow names the window so a
    // cropped screenshot can't pass a week off as all-time. Empty windows read as quiet zeros.
    totals: (function(){
      const p = gridPeriod(), start = gridWindowStart(p);
      const g = start ? gridStats(state.sessions.filter(se=>new Date(se.date)>=start)) : s;
      const eyebrow = p==='week' ? 'This week' : p==='month' ? 'This month' : 'All-time';
      const seg = (k,lbl)=>`<button class="density-seg ${p===k?'active':''}" style="font-family:var(--font-mono);font-size:11px;" onclick="setGridPeriod('${k}')">${lbl}</button>`;
      return `<div class="section">
      <div class="section-title"><span class="eyebrow">${eyebrow}</span>
        <div class="density-toggle" role="group" aria-label="Stats period">${seg('all','All-time')}${seg('month','Month')}${seg('week','Week')}</div></div>
      <div class="grid grid-3">
      <div class="stat"><div class="num">${g.totalSessions}</div><div class="lbl">Sessions</div></div>
      <div class="stat"><div class="num">${g.totalSteeps}</div><div class="lbl">Infusions</div></div>
      <div class="stat"><div class="num">${g.days.size}</div><div class="lbl">Days logged</div></div>
      <div class="stat"><div class="num">${g.totalGrams.toFixed(1)}</div><div class="lbl">Grams brewed</div></div>
      <div class="stat"><div class="num">${g.totalLiters.toFixed(1)}</div><div class="lbl">Liters (est.)</div></div>
      <div class="stat"><div class="num">${g.uniqueTeas}</div><div class="lbl">Teas brewed</div></div>
      </div></div>`;
    })(),
    clock: brewingClockHTML(s),
    /* R115 — a card is ABSENT until it has something to say. Four empty cards would be four
       apologies, and on day two that is most of the screen. The empty branches are dropped rather
       than reworded: "No favourites marked yet" is a card explaining why it is a card.
       `renderDashboard`'s edit-mode shell still names an empty card, and must — you cannot reorder
       or unhide what you cannot see (R61). */
    favorites: s.favorites.length ? `<div class="section card">
      <div class="eyebrow" style="margin-bottom:12px;">Favourites</div>
      ${s.favorites.slice(0,6).map(t=>`<div class="fav-row" onclick="openTeaDetail('${escapeJsArg(t.id)}')">${favLeaf(15)}<span>${escapeHtml(t.name)}</span></div>`).join('')}
    </div>` : '',
    // WS2 (v3.74) — the one number that earns Home: sessions since the start of this week (Mon-anchored).
    week: (function(){
      const ws = new Date(); ws.setHours(0,0,0,0); ws.setDate(ws.getDate() - ((ws.getDay()+6)%7));
      const n = state.sessions.filter(se=> new Date(se.date) >= ws).length;
      // Absent at zero (R115): "0 sessions this week" is a scoreboard reading, and a calm-first app
      // does not open by telling you that you have not brewed. The week is Monday-anchored, as it
      // has been since WS2 — Design drew no weekly figure because it could not verify a boundary
      // from the export; this one is derived here, from `sessions` and that anchor.
      return n ? `<div class="section card week-card"><div class="week-num">${n}</div><div class="week-cap">sessions<br>this week</div></div>` : '';
    })(),
    cost: `<div class="section card">
      <div class="section-title"><h2>Cost overview</h2></div>
      ${costMediansHTML()}
      <div class="grid grid-3">
        <div class="stat" onclick="goView('spend')" style="cursor:pointer;" title="Monthly spending"><div class="num">${currencyFmt(s.totalSpent,0)}</div><div class="lbl">Total spent ›</div></div>
        <div class="stat"><div class="num">${currencyFmt(s.avgCostPerGram)}</div><div class="lbl">Avg / gram</div></div>
        ${s.lowStock.length
          ? `<div class="stat" onclick="goLowStock()" style="cursor:pointer;" title="View low-stock teas"><div class="num">${s.lowStock.length}</div><div class="lbl">Low stock ›</div></div>`
          : `<div class="stat"><div class="num">0</div><div class="lbl">Low stock</div></div>`}
      </div>
      ${(function(){ const ms=computeMonthlySpend(); return ms.thisMonth>0 ? `<div style="margin-top:12px;font-size:12.5px;color:var(--ink-soft);cursor:pointer;" onclick="goView('spend')">This month: <strong style="color:var(--ink);">${currencyFmt(ms.thisMonth)}</strong> across ${ms.thisMonthCount} tea${ms.thisMonthCount===1?'':'s'} · see monthly ›</div>` : ''; })()}
      ${s.lowStock.length ? `<div style="margin-top:12px;">${lowStockHTML}</div>` : ''}
    </div>`
  };
}

/* Home = the masthead (spine) + the stack. The spine is drawn HERE rather than by
   `renderDashboard`, because renderDashboard renders one surface's cards and the masthead is not a
   card and belongs to one surface only. Insights keeps its own head. */
function viewDashboard(){
  if(!state.teas.length) return dayOneHTML();
  return `${greetingMastheadHTML()}${renderDashboard(dashCards(), 'home')}`;
}

/* ================= TEAS ================= */
