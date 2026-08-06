/* ============================================================================
   steep-insights.js — the Insights tab (v3.44). Split out of steep-dashboard.js
   along the Home/Insights seam (review finding #10). Owns the analytics cards:
   Recap (now with an All-time option), Steep Wrapped, the Insights reading,
   "What you brewed" (type breakdown), and Most-brewed / Top-rated. Rendered via
   the shared dashLayout registry with surface='insights' (see steep-dashboard.js).
   ============================================================================ */

/* recap (period stats grid + week/month/all-time toggle) was retired in WS2 (v3.65) — the Insights
   reflective room replaces it with the hero observation + the "vs last month" reading. Home's totals
   card still carries the raw all-time numbers. */

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
/* ---------- WS2 (v3.65): the reflective room ----------
   Insights is now a curated, hierarchical surface — one observation to land on, then quieter
   readings in a shared tiny data-viz family (sparkline / type-bar / time-of-day / steep-shape).
   Register: observations AS SENTENCES, never KPIs — no up/down arrows, no vs-last-week %, no
   targets. Each builder degrades to '' when its data is missing (renderDashboard skips empties).
   These render as insights-surface dashLayout cards whose HTML carries its own styling, so the
   concatenation reads as one room: jade-pale hero, hairline-topped sections, deep-jade teaser. */

// Hero window: the last 7 days if it holds enough signal, else widen (28d, then all-time) with an
// honest eyebrow, so a sparse logger still gets a truthful observation. null = nothing to observe.
function insHeroData(){
  const sessions = state.sessions; if(!sessions.length) return null;
  const now = Date.now(), DAY = 86400000;
  const windows = [[7,'This week, mostly'],[28,'Lately, mostly'],[Infinity,'Mostly']];
  let eyebrow = 'Mostly', inWin = [];
  for(const [days,lbl] of windows){
    inWin = days===Infinity ? sessions.slice() : sessions.filter(s=> (now-new Date(s.date))<=days*DAY);
    if(inWin.length>=3 || days===Infinity){ eyebrow = lbl; break; }
  }
  if(!inWin.length) return null;
  const tc = {}; inWin.forEach(s=>{ const t=teaById(s.teaId); if(t&&t.type) tc[t.type]=(tc[t.type]||0)+1; });
  let topType=null, tn=0; Object.entries(tc).forEach(([k,c])=>{ if(c>tn){ tn=c; topType=k; } });
  const parts = timeOfDayBuckets(inWin);
  const topPart = Object.entries(parts).sort((a,b)=>b[1]-a[1])[0][0];
  const hours = new Array(12).fill(0); inWin.forEach(s=>{ hours[Math.floor(new Date(s.date).getHours()/2)]++; });
  const ranges = {morning:[5,12], afternoon:[12,17], evening:[17,22]};
  const inPart = s=>{ const h=new Date(s.date).getHours();
    if(topPart==='night') return h>=22||h<5;
    const [a,b]=ranges[topPart]; return h>=a && h<b; };
  const partSteeps = inWin.filter(inPart).reduce((a,s)=>a+steepCountOf(s),0);
  const totalSteeps = inWin.reduce((a,s)=>a+steepCountOf(s),0);
  return { eyebrow, topType, topPart, hours, partSteeps, totalSteeps };
}
function insHeroHTML(){
  const h = insHeroData(); if(!h || !h.topType) return '';
  const max = Math.max(1, ...h.hours);
  const bars = h.hours.map(v=>`<div class="ins-bar" style="height:${v>0?Math.max(8,Math.round(v/max*100)):8}%;opacity:${v>0?(0.3+0.7*v/max).toFixed(2):0.18}"></div>`).join('');
  const partWhen = {morning:'in the morning', afternoon:'in the afternoon', evening:'in the evening', night:'late'};
  const sub = h.totalSteeps ? `${h.partSteeps} of your ${h.totalSteeps} steep${h.totalSteeps!==1?'s':''} came ${partWhen[h.topPart]}.` : '';
  return `<div class="ins-hero">
    <div class="ins-hero-eyebrow">${h.eyebrow}</div>
    <div class="ins-hero-title">${typeLabel(h.topType)}, and ${partWord(h.topPart)}.</div>
    <div class="ins-bars">${bars}</div>
    ${sub?`<div class="ins-hero-sub">${sub}</div>`:''}
  </div>`;
}

// Sessions per week for the last N weeks (oldest → newest), for the sparkline.
function insWeeklySeries(weeks){
  const now = new Date(), DAY = 86400000, counts = new Array(weeks).fill(0);
  state.sessions.forEach(s=>{ const age=(now-new Date(s.date))/DAY; if(age<0) return; const w=Math.floor(age/7); if(w<weeks) counts[weeks-1-w]++; });
  return counts;
}
function insReadingHTML(){
  const n = computeInsights(); if(!n) return '';
  const series = insWeeklySeries(8);
  if(series.filter(v=>v>0).length < 2) return '';           // too few weeks to draw a line
  const obs = n.trend==='down' ? 'A touch less than last month — and unhurried about it.'
    : n.trend==='up' ? 'A little more than last month — the pot’s seeing you often.'
    : n.trend==='steady' ? 'About the same as last month — a steady rhythm.'
    : 'Your cups, week by week.';
  const max = Math.max(1, ...series), step = 200/(series.length-1);
  const pts = series.map((v,i)=>`${Math.round(i*step)},${(30-v/max*26).toFixed(1)}`).join(' ');
  return `<div class="ins-sec">
    <div class="ins-obs">${obs}</div>
    <svg class="ins-spark" viewBox="0 0 200 34" preserveAspectRatio="none" aria-hidden="true"><polyline points="${pts}" fill="none" stroke="var(--jade)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
    <div class="ins-cap">sessions · last 8 weeks</div>
  </div>`;
}

// Type mix as one slim stacked bar in the fixed type colors (.dot-*) + a mono legend.
function insTypeMixHTML(s){
  const entries = TYPES.map(t=>[t.k,(s.typeCounts[t.k]||{}).count||0]).filter(([,c])=>c>0).sort((a,b)=>b[1]-a[1]);
  if(entries.length < 2) return '';                          // needs an actual mix
  const total = entries.reduce((a,[,c])=>a+c,0);
  const [k1,c1] = entries[0], [k2,c2] = entries[1];
  const obs = (c1-c2) <= Math.max(1, Math.round(c1*0.15))
    ? `${typeLabel(k1)} leads; ${typeLabel(k2).toLowerCase()}’s catching up.`
    : `${typeLabel(k1)} leads the cup.`;
  const segs = entries.map(([k,c])=>`<span class="dot-${k}" style="width:${(c/total*100).toFixed(1)}%"></span>`).join('');
  const legend = entries.map(([k])=>`<span><span class="ins-sw dot-${k}"></span>${typeLabel(k).toLowerCase()}</span>`).join('');
  return `<div class="ins-sec">
    <div class="ins-obs">${obs}</div>
    <div class="ins-typebar">${segs}</div>
    <div class="ins-legend">${legend}</div>
  </div>`;
}

// Steep-shape — average steep duration by steep index across timed sessions; an ascending amber line.
function insSteepShape(){
  const byIdx = [];
  state.sessions.forEach(s=>{ if(s.isColdBrew) return; (s.steeps||[]).forEach((x,i)=>{ const sec=Number(x.timeSeconds)||0; if(sec<=0) return; (byIdx[i]=byIdx[i]||{sum:0,n:0}); byIdx[i].sum+=sec; byIdx[i].n++; }); });
  const series = [];
  for(let i=0;i<byIdx.length && i<8;i++){ if(byIdx[i] && byIdx[i].n>=2) series.push(byIdx[i].sum/byIdx[i].n); else break; }
  return series;
}
function insSteepShapeHTML(){
  const series = insSteepShape(); if(series.length < 3) return '';
  const min = Math.min(...series), rng = Math.max(1, Math.max(...series)-min), step = 190/(series.length-1);
  const y = v => (34-(v-min)/rng*29).toFixed(1);
  const pts = series.map((v,i)=>`${Math.round(6+i*step)},${y(v)}`).join(' ');
  const dots = series.map((v,i)=> i%2===0 ? `<circle cx="${Math.round(6+i*step)}" cy="${y(v)}" r="2.4"/>` : '').join('');
  const obs = series[series.length-1] > series[0] ? 'Your steeps stretch as the session settles.' : 'Your steeps keep an even measure.';
  const caption = series.slice(0,5).map(v=>fmtSecShort(Math.round(v))).join(' · ') + (series.length>5?' …':'');
  return `<div class="ins-sec">
    <div class="ins-obs">${obs}</div>
    <svg class="ins-shape" viewBox="0 0 200 40" preserveAspectRatio="none" aria-hidden="true"><polyline points="${pts}" fill="none" stroke="var(--amber)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><g fill="var(--amber)">${dots}</g></svg>
    <div class="ins-cap">${caption}</div>
  </div>`;
}

// Two quiet notes (leaf = most reached-for, hanko = highest note) — not a leaderboard.
function insNotesHTML(s){
  const rows = [];
  if(s.mostBrewed.length){ const m=s.mostBrewed[0];
    rows.push(`<div class="ins-note"><svg class="ins-note-ic ins-note-leaf" viewBox="0 0 24 24" aria-hidden="true"><use href="#fav-leaf"/></svg><div><div class="ins-note-k">Most reached-for</div><div class="ins-note-v">${escapeHtml(m.tea.name)} · ×${m.count}</div></div></div>`); }
  if(s.topRated.length){ const t=s.topRated[0];
    rows.push(`<div class="ins-note"><svg class="ins-note-ic" viewBox="0 0 24 24" aria-hidden="true"><use href="#hanko"/></svg><div><div class="ins-note-k">Highest note</div><div class="ins-note-v">${escapeHtml(t.name)} ${renderStarsStatic(t.rating,false)}</div></div></div>`); }
  if(!rows.length) return '';
  return `<div class="ins-sec ins-notes">${rows.join('')}</div>`;
}

// Wrapped teaser — a single quiet deep-jade strip into the WS1 season sequence.
function insWrappedTeaserHTML(){
  const w = computeWrapped(); if(w.empty) return '';
  return `<div class="ins-teaser" onclick="goView('wrapped')">
    <div><div class="ins-teaser-k">Last month</div><div class="ins-teaser-title">Your ${w.season.name}, wrapped</div></div>
    <span class="ins-teaser-arrow">→</span>
  </div>`;
}

/* ================= STEEP WRAPPED =================
   A calm retrospective built entirely from existing session data. No new infra.
   The window is the LAST COMPLETE MONTH (R103, amending R38's "monthly, explicit") — see
   wrappedPeriod() below for why the amendment was needed rather than the ruling applied.
   `seasonInfo()` was deleted here: R103 left it with zero callers, and R38's future sibling is
   YEARLY, not seasonal, so nothing is waiting on it. The `w.season` key keeps its name — it is the
   shape every card destructures, and renaming it would have touched twenty render sites to say the
   same thing. Its `.name` is now a month ("July"), which is what the cards print. */
function partWord(p){ return ({morning:'mornings', afternoon:'afternoons', evening:'evenings', night:'late nights'})[p] || p; }
function fmtSteepDuration(sec){
  if(sec<60) return Math.round(sec)+'s';
  const m = Math.round(sec/60);
  if(m<90) return m+' min';
  const h = Math.floor(m/60), r = m%60;
  return r ? `${h}h ${r}m` : `${h}h`;
}
/* R103 — Wrapped's window is the LAST COMPLETE MONTH, not the current one. This amends R38, which
   ruled the period "monthly, explicit" when the log was a 16-day July: monthly and so-far were the
   same thing then, so nobody had to decide whether Wrapped was a live view or a retrospective. The
   log now spans two months and they have separated. The answer is retrospective — "Wrapped" denotes
   a closed period wherever the word is used, and Insights already covers the current month through
   its shipped week/month/all control. A thin-month Wrapped would duplicate that surface and do it
   worse: the same handful of sittings, dressed as a review.
   No threshold, no fallback rule, no thin-month state. If the last complete month is empty, fall
   back to the most recent month that isn't, labelled by its own name — which is not a special case
   so much as the same rule applied honestly. If no month has sittings, render nothing. */
/* The month name is COPY here, not a data value, and the two take different rules. `fmtDate` renders
   dates in the user's locale and rightly stays that way — "11. Juli 2026" is a date. But
   "Your Juli, wrapped" is an English sentence with one German word in it, and since the app carries
   no i18n, that reads as a bug rather than as localisation. So the period name is pinned English and
   used only in sentence positions; nothing else in the app changes. */
const WRAP_MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];
function wrappedPeriod(now, sessions){
  const monthOf = d => ({ name: WRAP_MONTHS_EN[d.getMonth()], year: d.getFullYear(),
                          short: WRAP_MONTHS_EN[d.getMonth()].slice(0,3).toUpperCase(),
                          start: new Date(d.getFullYear(), d.getMonth(), 1),
                          end: new Date(d.getFullYear(), d.getMonth()+1, 1) });
  const start = new Date(now.getFullYear(), now.getMonth()-1, 1);   // the last complete month
  const has = d => (sessions||[]).some(s=>{ const t=new Date(s.date); return t>=d && t<new Date(d.getFullYear(), d.getMonth()+1, 1); });
  if(has(start)) return monthOf(start);
  // Walk back to the most recent month that actually holds sittings. Bounded by the oldest session,
  // so an empty log terminates immediately rather than scanning history forever.
  const dates = (sessions||[]).map(s=>new Date(s.date)).filter(d=>d<start);
  if(!dates.length) return null;
  const newest = new Date(Math.max(...dates));
  return monthOf(new Date(newest.getFullYear(), newest.getMonth(), 1));
}
function computeWrapped(){
  const now = new Date();
  const season = wrappedPeriod(now, state.sessions);
  if(!season) return { season:null, empty:true };
  const inSeason = state.sessions.filter(s=>{ const d=new Date(s.date); return d>=season.start && d<season.end; });
  if(inSeason.length===0) return { season, empty:true };

  const infusions = inSeason.reduce((a,s)=>a+steepCountOf(s),0);
  const grams = inSeason.reduce((a,s)=>a+(Number(s.gramsUsed)||0),0);
  let steepSeconds = 0;
  inSeason.forEach(s=>{ if(s.isColdBrew) return; (s.steeps||[]).forEach(st=>{ steepSeconds += Number(st.timeSeconds)||0; }); }); // cold brews would skew this
  const activeDays = new Set(inSeason.map(s=>dayKey(s.date))).size;
  const coldN = inSeason.filter(s=>s.isColdBrew).length;

  // R100 — both of these took the first maximum and never revisited it. Two teas reached for
  // equally often is a truer thing to say than an arbitrary winner, so the tie is carried through
  // to the card rather than resolved here. topTea/topType keep the single-value shape the share
  // text and the older callers use; the arrays are what the cards read.
  const teaCounts = {};
  inSeason.forEach(s=>{ teaCounts[s.teaId]=(teaCounts[s.teaId]||0)+1; });
  const teaTop = argmaxTies(Object.entries(teaCounts));
  const topTeas = teaTop.keys.map(teaById).filter(Boolean);
  const topTea = topTeas[0] || null, topTeaN = teaTop.value;
  const distinctTeas = Object.keys(teaCounts).length;

  const typeCounts = {};
  inSeason.forEach(s=>{ const t=teaById(s.teaId); if(t) typeCounts[t.type]=(typeCounts[t.type]||0)+1; });
  const typeTop = argmaxTies(Object.entries(typeCounts));
  const topTypes = typeTop.keys, topType = topTypes[0] || null, topTypeN = typeTop.value;

  const parts = timeOfDayBuckets(inSeason);
  const topPart = Object.entries(parts).sort((a,b)=>b[1]-a[1])[0][0];

  // "New this month" = teas whose first-ever session lands in the window (R103: the last complete one).
  const firstSeen = {};
  state.sessions.forEach(s=>{ const t=new Date(s.date).getTime(); if(firstSeen[s.teaId]==null || t<firstSeen[s.teaId]) firstSeen[s.teaId]=t; });
  const newTeas = Object.keys(firstSeen)
    .filter(id => firstSeen[id]>=season.start.getTime() && firstSeen[id]<season.end.getTime())
    .map(id=>teaById(id)).filter(Boolean);

  const standout = inSeason.filter(s=>Number(s.rating)>0)
    .sort((a,b)=> (b.rating-a.rating) || (new Date(b.date)-new Date(a.date)))[0] || null;

  return { season, empty:false, n:inSeason.length, infusions, grams, steepSeconds, activeDays,
    coldN, topTea, topTeas, topTeaN, distinctTeas, topType, topTypes, topTypeN, topPart, parts, newTeas, standout };
}
function wrappedShareText(w){
  const lines = [`SlowCup Wrapped · ${w.season.name} ${w.season.year}`];
  lines.push([`${w.n} session${w.n>1?'s':''}`, `${w.infusions} infusion${w.infusions>1?'s':''}`,
    `${w.distinctTeas} tea${w.distinctTeas>1?'s':''}${w.newTeas.length?` (${w.newTeas.length} new)`:''}`].join(' · '));
  if(w.topTea) lines.push(`Companion: ${w.topTea.name} ×${w.topTeaN}`);
  if(w.standout){ const sn = w.standout.teaName||(teaById(w.standout.teaId)||{}).name||'—'; lines.push(`Standout: ${sn} ★${Number(w.standout.rating)}`); }
  lines.push(`Quietly, that's a month.`);
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
// WS1 (v3.64) — SlowCup Wrapped as a horizontal scroll-snap sequence of full-width story cards.
// Cards degrade gracefully: any card whose stat is missing is dropped and the catalogue numbering
// re-flows (see wrappedKinds). Only JS is dot-tracking (bindDynamic) + share (shareWrapped).
const WRAP_PART_LABEL = {morning:'AM', afternoon:'MID', evening:'PM', night:'NT'};
function wrappedKinds(w){
  const k = ['cover','sessions'];                 // cover + sessions always present (n>=1)
  if(w.steepSeconds>0 || w.coldN>0) k.push('time');
  if(w.topTea) k.push('companion');
  if(w.topType) k.push('rhythm');
  if(w.newTeas.length) k.push('discoveries');
  if(w.standout) k.push('standout');
  k.push('keep');
  return k;
}
function wrappedCardHTML(kind, i, total, w){
  const pad = n => String(n).padStart(2,'0');
  const no = pad(i);
  const foot = `<div class="wrap-foot">${no} / ${pad(total)}</div>`;
  const cat = (label, right) => `<div class="wrap-cat"><span>№ ${no}</span><span>${right!=null?right:label}</span></div>`;
  const cap = s => s.charAt(0).toUpperCase()+s.slice(1);
  if(kind==='cover'){
    // The old range spanned three months of a season; a month window makes both ends the same, so
    // it rendered "JUL — JUL". The title already names the month — this line carries the days.
    const dayN = new Date(w.season.end.getTime()-86400000).getDate();
    const months = `1—${dayN} ${w.season.short}`;
    return `<div class="wrap-card wf-jade">
      <svg class="wrap-enso-bg" viewBox="0 0 120 120" aria-hidden="true"><use href="#enso"/></svg>
      ${cat(null, `${w.season.name} · ${w.season.year}`)}
      <div class="wrap-body">
        <div class="wrap-display wrap-cover-title">${w.season.name}<br>${w.season.year}</div>
        <div class="wrap-cover-sub">${months} · a month of quiet cups</div>
      </div>
      <div class="wrap-cover-foot"><svg class="wrap-leaf" aria-hidden="true"><use href="#fav-leaf"/></svg><span>swipe →</span></div>
    </div>`;
  }
  if(kind==='sessions'){
    return `<div class="wrap-card wf-por">
      ${cat('Sessions')}
      <div class="wrap-body">
        <div class="wrap-bignum"><span class="wrap-big">${w.n}</span><span class="wrap-big-unit">session${w.n>1?'s':''}</span></div>
        <div class="wrap-display wrap-lead">Quietly, that's a month.</div>
        <div class="wrap-sub">Across ${w.activeDays} day${w.activeDays>1?'s':''} you made the time — no more, no less.</div>
      </div>
      ${foot}
    </div>`;
  }
  if(kind==='time'){
    const body = w.steepSeconds>0
      ? `<div class="wrap-display wrap-hero">${fmtSteepDuration(w.steepSeconds)}</div>
         <div class="wrap-display wrap-hero-lead">spent watching leaves unfurl.</div>
         <div class="wrap-sub-mono">${w.infusions} infusion${w.infusions>1?'s':''} · none of them rushed</div>`
      : `<div class="wrap-bignum"><span class="wrap-big">${w.coldN}</span><span class="wrap-big-unit">cold brew${w.coldN>1?'s':''}</span></div>
         <div class="wrap-display wrap-lead">Steeped slow, on their own time.</div>
         <div class="wrap-sub-mono">${w.infusions} infusion${w.infusions>1?'s':''} in all</div>`;
    return `<div class="wrap-card wf-amber">
      ${cat('Time at the table')}
      <div class="wrap-body">${body}</div>
      ${foot}
    </div>`;
  }
  if(kind==='companion'){
    // R100 — when two teas were reached for equally often, both are named and the count reads
    // "each". "Always first" is a claim about a single tea, so it goes when there isn't one.
    const tied = (w.topTeas||[]).length>1;
    const names = tied ? andList(w.topTeas.map(t=>escapeHtml(t.name))) : escapeHtml(w.topTea.name);
    return `<div class="wrap-card wf-jade">
      ${cat(tied?'Your companions':'Your companion')}
      <div class="wrap-body">
        <div class="wrap-display wrap-teaname">${names}</div>
        <div class="wrap-count"><span class="wrap-x">×${w.topTeaN}${tied?' each':''}</span><span class="wrap-x-sub">of ${w.n}<br>sessions</span></div>
        <div class="wrap-display wrap-lead-sm">${tied?`Neither one led.`:`Mostly ${partWord(w.topPart)}, always first.`}</div>
      </div>
      <svg class="wrap-leaf wrap-leaf-foot" aria-hidden="true"><use href="#fav-leaf"/></svg>
    </div>`;
  }
  if(kind==='rhythm'){
    const p = w.parts, mx = Math.max(1, p.morning, p.afternoon, p.evening, p.night);
    const bars = ['morning','afternoon','evening','night'].map(part=>
      `<div class="wrap-bar-col"><div class="wrap-bar-slot"><div class="wrap-bar-fill" style="height:${Math.round(p[part]/mx*100)}%"></div></div><div class="wrap-bar-lbl">${WRAP_PART_LABEL[part]}</div></div>`
    ).join('');
    return `<div class="wrap-card wf-por">
      ${cat('Your rhythm')}
      <div class="wrap-body">
        <div class="wrap-display wrap-lead" style="margin-top:0;">${(w.topTypes||[]).length>1
          ? `${andList(w.topTypes.map(k=>typeLabel(k).toLowerCase()))},<br>evenly.`
          : `Mostly ${typeLabel(w.topType).toLowerCase()},<br>mostly ${partWord(w.topPart)}.`}</div>
        <div class="wrap-bars">${bars}</div>
        <div class="wrap-sub-mono">${andList((w.topTypes||[]).map(k=>typeLabel(k).toLowerCase()))} · ${w.topTypeN}${(w.topTypes||[]).length>1?' each':''} of ${w.n}</div>
      </div>
      ${foot}
    </div>`;
  }
  if(kind==='discoveries'){
    const names = w.newTeas.slice(0,3).map(t=>escapeHtml(t.name)).join('<br>');
    const more = w.newTeas.length>3 ? `<span class="wrap-names-more"> · +${w.newTeas.length-3}</span>` : '';
    return `<div class="wrap-card wf-amber">
      ${cat('New this month')}
      <div class="wrap-body">
        <div class="wrap-bignum"><span class="wrap-big">${w.newTeas.length}</span><span class="wrap-display wrap-big-unit-lg">tea${w.newTeas.length>1?'s':''} found<br>their way in.</span></div>
        <div class="wrap-names">${names}${more}</div>
      </div>
      ${foot}
    </div>`;
  }
  if(kind==='standout'){
    const st = w.standout;
    const name = escapeHtml(st.teaName || (teaById(st.teaId)||{}).name || '—');
    const t = teaById(st.teaId) || {};
    const date = new Date(st.date).toLocaleDateString(undefined,{day:'numeric',month:'short'});
    const ves = vesselById(st.vesselId);
    const segs = [date];
    if(ves && ves.name) segs.push(escapeHtml(ves.name));
    segs.push(`${steepCountOf(st)} steep${steepCountOf(st)!==1?'s':''}`);
    const meta = [t.type?typeLabel(t.type).toLowerCase():'', t.origin?escapeHtml(String(t.origin).toLowerCase()):''].filter(Boolean).join(' · ');
    return `<div class="wrap-card wc-standout">
      <div class="wrap-plate">
        <span class="wrap-hanko"><svg viewBox="0 0 24 24" aria-hidden="true"><use href="#hanko"/></svg></span>
        <div class="wrap-cat"><span>№ ${no} · To keep</span></div>
        <div class="wrap-body">
          <div class="wrap-eyebrow-clay">The standout</div>
          <div class="wrap-display wrap-standout-name">${name}</div>
          <div class="wrap-stars">${renderStarsStatic(st.rating,false)}</div>
          <div class="wrap-sub">${segs.join(' · ')}. The one you'd brew again tomorrow.</div>
        </div>
        ${meta?`<div class="wrap-plate-foot">${meta}</div>`:''}
      </div>
    </div>`;
  }
  // keep / share
  const distinct = `${w.distinctTeas} tea${w.distinctTeas>1?'s':''}${w.newTeas.length?`, ${w.newTeas.length} new`:''}.`;
  return `<div class="wrap-card wf-jade">
    <div class="wrap-seigaiha"><svg preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="100%" height="100%" fill="url(#seigaiha)"/></svg></div>
    ${cat('Kept')}
    <div class="wrap-body">
      <div class="wrap-display wrap-keep-lines">${w.n} session${w.n>1?'s':''}.<br>${w.infusions} infusion${w.infusions>1?'s':''}.<br>${distinct}</div>
      <div class="wrap-display wrap-keep-tag">Quietly, that's a month.</div>
    </div>
    <div class="wrap-share-wrap">
      <button class="wrap-share" onclick="shareWrapped()">Share your ${w.season.name}</button>
      <div class="wrap-share-note">copies as text · no image, no account</div>
    </div>
  </div>`;
}
// Scroll the carousel to card i; respects reduced-motion. Dot state follows via the scroll listener.
function wrapGo(i){
  const t = document.getElementById('wrapTrack'); if(!t) return;
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  t.scrollTo({left:i*t.clientWidth, behavior:reduce?'auto':'smooth'});
}
function viewWrapped(){
  const w = computeWrapped();
  // R103 — no decorated empty card. Wrapped is a retrospective: with no completed month behind you
  // there is nothing to look back on, and "your August is just beginning" was a live-view sentence
  // on a surface that is no longer a live view. The teaser already withholds itself when empty, so
  // this is reachable only by a stale saved view; it says the plain thing and offers the way out.
  if(w.empty){
    return `<div class="wrap">
      <div class="wrap-head"><div class="wrap-head-brand"><svg aria-hidden="true"><use href="#fav-leaf"/></svg><span class="wrap-head-lbl">SlowCup Wrapped</span></div><button class="wrap-close" onclick="goView('insights')" aria-label="Close">×</button></div>
      <p style="color:var(--ink-soft);font-size:14px;max-width:34ch;margin:24px auto;text-align:center;">Wrapped looks back at a finished month. Yours arrives once one has passed.</p>
    </div>`;
  }
  const kinds = wrappedKinds(w);
  const total = kinds.length;
  const cards = kinds.map((k,i)=>wrappedCardHTML(k,i,total,w)).join('');
  const dots = kinds.map((_,i)=>`<button class="wrap-dot${i===0?' active':''}" onclick="wrapGo(${i})" aria-label="Go to card ${i+1}"></button>`).join('');
  return `<div class="wrap">
    <div class="wrap-head"><div class="wrap-head-brand"><svg aria-hidden="true"><use href="#fav-leaf"/></svg><span class="wrap-head-lbl">SlowCup Wrapped · ${w.season.name} ${w.season.year}</span></div><button class="wrap-close" onclick="goView('insights')" aria-label="Close">×</button></div>
    <div class="wrap-track" id="wrapTrack">${cards}</div>
    <div class="wrap-dots">${dots}</div>
  </div>`;
}

/* ---------- the Insights tab view (WS2, v3.65 — the reflective room) ---------- */
// Insights-surface cards, keyed by id. Built by the shared dashCards() (steep-dashboard.js) so a
// card moved to Home still has its HTML there; takes the shared computeStats result. renderDashboard
// concatenates these in order, so each carries its own styling and the run reads as one room:
// hero (jade-pale, the ONE thing) → hairline-topped observations → deep-jade Wrapped teaser.
/* The Origins card (R46/R54/R101) — an ENTRY POINT, and deliberately not a map.
   R101 keeps the map as one build in slice H beside #37, because drawing geography needs d3-geo
   and a Natural Earth topology: the first third-party runtime dependency since Supabase, on an app
   with no bundler that precaches every asset it ships. R28 also *defines* the country tier as a
   polygon label, so half the shelf has no placement rule without those polygons. A mini-map here
   that a full map in H would then have to agree with is the second-writer problem this round has
   already paid for twice.
   So this reads the tiers and says what it knows. There is no tap target yet — the destination
   lands in H, and a control that goes nowhere is worse than one that isn't drawn (the honest-absence
   pattern). Both figures are counted, never written (R68), and a shelf with no origins renders
   nothing at all rather than an empty frame. */
function insOriginsHTML(){
  if(typeof originTier!=='function') return '';
  let region=0, country=0;
  (state.teas||[]).forEach(t=>{ const tier=originTier(t); if(tier==='region') region++; else if(tier==='country') country++; });
  const placed = region+country;
  if(!placed) return '';
  const lead = region
    ? `${region} of your teas name where they grew.`
    : `Your shelf names countries, not yet places.`;
  const sub = country
    ? `${country} name only the country — a place makes the map finer.`
    : `Every placed tea names a region.`;
  // The tap target G deliberately left absent now has an honest destination for the first time.
  return `<div class="section card org-entry" onclick="goOrigins()" role="button" tabindex="0">
    <div class="eyebrow" style="margin-bottom:8px;">Origins</div>
    <div class="ins-obs">${lead}</div>
    <div class="ins-cap" style="margin-top:6px;">${sub}</div>
    <div class="org-entry-go mono">Open the atlas →</div>
  </div>`;
}
function dashCardsInsights(s){
  return {
    hero: insHeroHTML(),
    reading: insReadingHTML(),
    typemix: insTypeMixHTML(s),
    steepshape: insSteepShapeHTML(),
    notes: insNotesHTML(s),
    wrapped: insWrappedTeaserHTML(),
    origins: insOriginsHTML()
  };
}

function viewInsights(){
  if(state.sessions.length===0){
    return `<div class="section-title"><h2 style="font-family:var(--font-display);font-size:20px;">Insights</h2></div>
      <div class="card empty">No sessions yet — your insights and Wrapped fill in as you log.</div>`;
  }
  // No page title — the hero observation leads (matches Home, whose greeting leads). WS2.
  return renderDashboard(dashCards(),'insights');
}
