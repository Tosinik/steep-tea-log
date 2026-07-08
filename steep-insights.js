/* ============================================================================
   steep-insights.js — the Insights tab (v3.44). Split out of steep-dashboard.js
   along the Home/Insights seam (review finding #10). Owns the analytics cards:
   Recap (now with an All-time option), Steep Wrapped, the Insights reading,
   "What you brewed" (type breakdown), and Most-brewed / Top-rated. Rendered via
   the shared dashLayout registry with surface='insights' (see steep-dashboard.js).
   ============================================================================ */

/* ---------- recap ---------- */
function periodRange(period){
  const now = new Date();
  const end = new Date(now); end.setHours(23,59,59,999);
  let start;
  if(period==='all'){
    start = new Date(0);                        // everything up to now
  } else if(period==='month'){
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
  const label = period==='all'
    ? 'All time'
    : period==='month'
    ? r.start.toLocaleDateString(undefined,{month:'long',year:'numeric'})
    : `${r.start.toLocaleDateString(undefined,{month:'short',day:'numeric'})} – today`;
  const toggle = `<div class="recap-toggle">
    <button class="${period==='week'?'active':''}" onclick="setRecapPeriod('week')">This week</button>
    <button class="${period==='month'?'active':''}" onclick="setRecapPeriod('month')">This month</button>
    <button class="${period==='all'?'active':''}" onclick="setRecapPeriod('all')">All time</button>
  </div>`;
  if(r.sessions===0){
    const none = period==='week' ? 'this week' : period==='month' ? 'this month' : 'yet';
    return `<div class="section card recap-card">
      <div class="section-title"><h2>Recap</h2>${toggle}</div>
      <div class="recap-range">${label}</div>
      <div class="empty" style="padding:10px 0 2px;">No sessions logged ${none} — the pot's waiting.</div>
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
    ${r.mostBrewed?`<div class="recap-line"><span class="recap-k">Most brewed</span><span class="recap-v">${escapeHtml(r.mostBrewed.name)} · ${r.mostN}×</span></div>`:''}
    ${r.topSession?`<div class="recap-line"><span class="recap-k">Top rated</span><span class="recap-v">${escapeHtml(r.topSession.teaName||(teaById(r.topSession.teaId)||{}).name||'—')} ${renderStarsStatic(r.topSession.rating,false)}</span></div>`:''}
    ${r.newTeas?`<div class="recap-line"><span class="recap-k">New teas added</span><span class="recap-v">${r.newTeas}</span></div>`:''}
    ${typeChips?`<div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap;">${typeChips}</div>`:''}
  </div>`;
}
function setRecapPeriod(p){ state.recapPeriod=p; render(); }

/* ---------- insights reading ---------- */
// Sort sessions into four time-of-day buckets by local hour. Shared by Insights and Wrapped.
function timeOfDayBuckets(sessions){
  const parts = {morning:0, afternoon:0, evening:0, night:0};
  sessions.forEach(s=>{ const h=new Date(s.date).getHours();
    if(h>=5&&h<12) parts.morning++; else if(h>=12&&h<17) parts.afternoon++;
    else if(h>=17&&h<22) parts.evening++; else parts.night++; });
  return parts;
}
/* Gentle, self-knowledge readings drawn from session timestamps + grams.
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
  const parts = timeOfDayBuckets(sessions);
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
  inSeason.forEach(s=>{ if(s.isColdBrew) return; (s.steeps||[]).forEach(st=>{ steepSeconds += Number(st.timeSeconds)||0; }); }); // cold brews would skew this
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

  const parts = timeOfDayBuckets(inSeason);
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
  const back = `<button class="detail-back" onclick="goView('insights')">← Back to insights</button>`;
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
      <h2 style="margin:6px 0 2px;">${escapeHtml(w.topTea.name)}</h2>
      <div style="color:var(--ink-soft);font-size:13px;">${typeLabel(w.topTea.type)} · brewed ${w.topTeaN} time${w.topTeaN>1?'s':''}</div>
    </div>` : ''}

    <div class="section card">
      ${w.topType?`<div class="recap-line"><span class="recap-k">Leaf of the season</span><span class="recap-v">${typeLabel(w.topType)} · ${w.topTypeN}</span></div>`:''}
      <div class="recap-line"><span class="recap-k">Favourite time</span><span class="recap-v">${cap(partWord(w.topPart))}</span></div>
      <div class="recap-line"><span class="recap-k">New this season</span><span class="recap-v">${w.newTeas.length} tea${w.newTeas.length!==1?'s':''}</span></div>
      ${w.standout?`<div class="recap-line"><span class="recap-k">Standout cup</span><span class="recap-v">${escapeHtml(w.standout.teaName||(teaById(w.standout.teaId)||{}).name||'—')} ${renderStarsStatic(w.standout.rating,false)}</span></div>`:''}
    </div>

    ${w.newTeas.length?`<div class="section card">
      <div class="eyebrow">Teas you met this ${w.season.name.toLowerCase()}</div>
      <div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:6px;">${w.newTeas.slice(0,12).map(t=>`<span style="font-size:12px;padding:5px 10px;border:1px solid var(--line);border-radius:999px;">${escapeHtml(t.name)}</span>`).join('')}</div>
    </div>`:''}

    <div class="section card" style="text-align:center;">
      <p style="color:var(--ink-soft);font-size:14px;margin:0 0 14px;">A season of quiet cups. Here's to the next one.</p>
      <button class="btn btn-primary" onclick="shareWrapped()">Share my ${w.season.name}</button>
    </div>
  `;
}

/* ---------- the Insights tab view ---------- */
// Insights-surface cards, keyed by id. Built by the shared dashCards() (steep-dashboard.js) so a
// card moved to Home still has its HTML there; takes the shared computeStats result.
function dashCardsInsights(s){
  const maxTypeCount = Math.max(1, ...Object.values(s.typeCounts).map(t=>t.count));
  const typeBars = TYPES.map(t=>{
    const info = s.typeCounts[t.k];
    if(!info || info.count===0) return '';
    const pct = Math.round(info.count/maxTypeCount*100);
    const topTeas = Object.entries(info.teas).sort((a,b)=>b[1]-a[1]).slice(0,2).map(([n,c])=>`${escapeHtml(n)} (${c}x)`).join(', ');
    return `<div class="typebar-row">
      <div class="typebar-head"><strong>${t.label}</strong><span class="mono" style="font-size:12px;color:var(--ink-soft)">${info.count}x</span></div>
      <div class="typebar-track"><div class="typebar-fill dot-${t.k}" style="width:${pct}%;background:var(--jade)"></div></div>
      ${topTeas?`<div class="typebar-sub">top: ${topTeas}</div>`:''}
    </div>`;
  }).join('');
  const mostBrewedHTML = s.mostBrewed.length ? s.mostBrewed.map((x,i)=>`
    <div class="rank-row"><span class="rank-num">${i+1}.</span><span class="rname">${escapeHtml(x.tea.name)}</span>${dotsRow(x.count,x.count)}<span class="rval">${x.count}x</span></div>
  `).join('') : '<div class="empty">Log a session to see your most brewed teas.</div>';
  const topRatedHTML = s.topRated.length ? s.topRated.map((t,i)=>`
    <div class="rank-row"><span class="rank-num">${i+1}.</span><span class="rname">${escapeHtml(t.name)}</span><span class="rval">${fmtStars(t.rating)}/5</span></div>
  `).join('') : '<div class="empty">Rate a tea to see it here.</div>';

  return {
    recap: recapHTML(),
    wrapped: wrappedTeaser(),
    insights: insightsHTML(),
    types: `<div class="section card">
      <div class="section-title"><h2>What you brewed</h2></div>
      ${typeBars || '<div class="empty">No sessions yet.</div>'}
    </div>`,
    mostrated: `<div class="section grid grid-2">
      <div class="card">
        <div class="section-title"><h2>Most brewed</h2></div>
        ${mostBrewedHTML}
      </div>
      <div class="card">
        <div class="section-title"><h2>Top rated</h2></div>
        ${topRatedHTML}
      </div>
    </div>`
  };
}

function viewInsights(){
  if(state.sessions.length===0){
    return `<div class="section-title"><h2 style="font-family:'Fraunces',serif;font-size:20px;">Insights</h2></div>
      <div class="card empty">No sessions yet — your insights, recaps and Wrapped fill in as you log.</div>`;
  }
  return `<div class="section-title"><h2 style="font-family:'Fraunces',serif;font-size:20px;">Insights</h2></div>${renderDashboard(dashCards(),'insights')}`;
}
