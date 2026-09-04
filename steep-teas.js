/* ============ WS5 shelf status line (the core rule) ============
   ONE status line, same slot + weight on every card — only the words + tone change.
   tone ∈ { low(clay·sorts top) · few(ink-soft·no sort, #18) · freshness(ink-soft) · plenty(jade) ·
   ages(jade) }. Computed from amount + the freshness reading — never free text. #18 made quantity
   session-aware: cups left = on-hand ÷ this tea's average logged dose; the gram floor only decides
   when a tea has no brewing history.
   v3.98 (slice B3): the ages bucket is no longer a type map. It is the catalog `ageing` flag reached
   through the three-rung cascade (R85), so the 2026-07-11 note about oolong — resolved then toward
   the mock because freshnessClass "never calls oolong 'ages'" — is now data, not a hard-coded
   grouping: oolong defaults ageing:false and widens with roast, per tea, in editable catalog data. */
/* ============ Freshness, v3.98 (slice B3) — SPEC-freshness-model.md ============
   RETIRED here: statusCategory (a type→ages|delicate|neutral map — subsumed by the catalog `ageing`
   flag plus per-type windows), and the FRESH_WINDOW_MONTHS / FRESH_NEAR_WEEKS globals (one window
   for every tea, which is the thing the model exists to stop). freshnessReading is now the SINGLE
   WRITER for freshness on every surface: two clocks disagreeing about one tea is the bug class this
   project guards by name, and "detail is richer, the shelf is legacy" is how that starts.

   TWO independent groundings, and they fail independently (§2):
     clock  — when the tea started ageing:  openedDate → harvest → nothing
     window — how long this kind holds:     catalog slug → family → teas.type (R85)

     clock measured  + window → full            (countdown, or history when ageing)
     clock estimated + window → full, softened  (harvest assumes the pouch stayed sealed)
     clock any       + no window → elapsed-only ("opened 6 wks ago") — no countdown, no window claim
     no clock        + any      → NO READING. Absent. Not a guess, not a zero.

   Elapsed-only is not a guess: the DATE is measured, only the window would be invented, and that is
   exactly what gets withheld. It matters practically — `covers` is hand-curated, so every newly
   added tea starts uncovered, and without this rung the one field we are asking Niklas to start
   filling would show nothing until someone edits the catalog. */
function fmtStockG(g){ g = Number(g)||0; return (Math.round(g)===g ? String(g) : g.toFixed(1)) + 'g'; }
// Seeds are soft by contract (§3): published guidance disagrees by up to ~2x. Days are the storage
// unit; nothing renders a day count. "~5 wks", never "35 days", and never as settled fact.
function fmtSoftDays(days){
  if(days==null) return '';
  const wk = Math.round(days/7);
  if(wk < 9) return '~' + Math.max(wk,1) + ' wk' + (wk===1?'':'s');
  const mo = Math.round(days/30);
  if(mo < 18) return '~' + mo + ' month' + (mo===1?'':'s');
  return '~' + Math.round(days/365) + ' yr' + (Math.round(days/365)===1?'':'s');
}
function fmtElapsed(days){
  if(days==null) return '';
  const wk = Math.round(days/7);
  if(days < 14) return days <= 1 ? 'today' : days + ' days ago';
  if(wk < 9) return wk + ' wks ago';
  const mo = Math.round(days/30);
  if(mo < 18) return mo + ' months ago';
  const yr = Math.round(days/365);
  return yr + ' yr' + (yr===1?'':'s') + ' ago';
}
// The clock. Measured when the user typed a date; estimated from harvest, which ASSUMES the pouch
// stayed sealed until now — stated in the copy rather than hidden. Purchase is deliberately absent:
// it says when the tea reached you, not when it was made, so a 2023 harvest bought in 2026 would
// read as fresh. It keeps every one of its other jobs (stock curve, ledger rate, cost-by-month).
function freshnessClock(tea){
  const od = tea && tea.openedDate ? new Date(tea.openedDate) : null;
  if(od && !isNaN(od)) return { since: od, measured: true };
  const y = freshnessYear(tea); if(!y) return null;
  const seasonMonth = { spring:3, summer:6, autumn:9, fall:9, winter:0 };
  const s = String(tea.harvestSeason||'').trim().toLowerCase();
  return { since: new Date(y, (s in seasonMonth) ? seasonMonth[s] : 5, 1), measured: false };
}
function freshnessReading(tea){
  const clock = freshnessClock(tea);
  if(!clock) return null;                                    // no clock → no reading, on every surface
  const days = Math.max(0, Math.round((Date.now() - clock.since.getTime()) / 86400000));
  const win = (typeof ttFreshness==='function') ? ttFreshness(tea) : null;
  if(!win) return { grounded:false, measured:clock.measured, days, ageing:false };
  // An ageing tea reads elapsed time as a RECORD, never an alarm — no countdown, no urgency tone.
  if(win.ageing) return { grounded:true, measured:clock.measured, days, ageing:true, rung:win.rung };
  const total = clock.measured ? win.opened_days : win.sealed_days;
  if(total==null) return { grounded:false, measured:clock.measured, days, ageing:false };
  return { grounded:true, measured:clock.measured, days, ageing:false, rung:win.rung,
           leftDays: total - days, totalDays: total };
}
// #18 session-aware tiers. One grams-logged session anchors the average (the teaForecast
// precedent — a real shelf rarely has two); no history → the lowStockG() floor keeps the
// old binary behavior. All styles count: cold brew and quick sessions consume leaf too.
function teaAvgDose(tea){
  const gs = (state.sessions||[]).filter(s=>s.teaId===tea.id && Number(s.gramsUsed)>0);
  return gs.length ? gs.reduce((a,s)=>a+Number(s.gramsUsed),0)/gs.length : null;
}
function cupsLeft(tea){
  const amt = Number(tea.amountGrams)||0, avg = teaAvgDose(tea);
  return (amt>0 && avg) ? amt/avg : null;
}
// <2 cups → low · 2–5 → few · ≥5 → plenty (exactly 5.0 reads plenty — it defuses the
// one-big-gongfu-session outlier, and five cups on the shelf IS plenty in a calm app).
function stockTier(tea){
  const amt = Number(tea.amountGrams)||0;
  // 0g splits by evidence (v3.86 #26): tracked-and-drained = 'empty', bare 0 = 'untracked' —
  // the DB defaults amount_grams to 0, so 0 alone is ambiguous (v3.40 rule: unknown ≠ empty).
  if(amt<=0) return isTeaFinished(tea) ? 'empty' : 'untracked';
  const cups = cupsLeft(tea);
  if(cups!=null) return cups<2 ? 'low' : (cups<5 ? 'few' : 'plenty');
  return amt<lowStockG() ? 'low' : 'plenty';
}
function statusLine(tea){
  const amt = Number(tea.amountGrams)||0;
  const g = fmtStockG(amt);
  const tier = stockTier(tea);
  // neither 0g branch carries a gram prefix — "0g · …" would state as fact the number that's in doubt.
  if(tier==='empty') return { text:'empty', tone:'empty' };
  if(tier==='untracked') return { text:'quantity not tracked', tone:'untracked' };
  if(tier==='low') return { text:`${g} · running low`, tone:'low' };
  // quantity wins while remarkable: 'few' outranks ages + the freshness countdown — an
  // "ages well" or "best within N wks" on a nearly-empty tin hides the #18 lie.
  if(tier==='few') return { text:`${g} · a few cups left`, tone:'few' };
  /* THE SHELF IS TWO-KEY (§2): a freshness tone fires only when clock AND window both ground.
     Ungrounded falls through to the plain quantity tone — WS5 requires one status line in the same
     slot on every card, so "the block is absent" has no shelf equivalent; an empty slot is not an
     option and a guess is not either. `23 g · plenty` is a STOCK statement, not a freshness claim,
     so never-guess survives intact. A tea can therefore read `23 g · plenty` here and "opened 6 wks
     ago" on detail: one is a stock fact, the other a date fact, and neither claims freshness. */
  /* AGEING NEEDS NO CLOCK. A countdown is meaningless without a date, but "ages well" is a statement
     about the LEAF, not about elapsed time — it says this one isn't going off, and that is knowable
     from the window rung alone. Requiring both keys here dropped the label from every ageing tea with
     no harvest date (Yunnan Silver Bud on the real shelf), which §4 explicitly rules out: ageing is
     shipped behaviour for white and pu-erh and this slice is a COPY replacement over it, not a
     removal. Detail still needs the clock for the elapsed figure — that part is genuinely two-key. */
  const win = (typeof ttFreshness==='function') ? ttFreshness(tea) : null;
  if(win && win.ageing){
    const phrase = (tea.type||'').toLowerCase()==='puerh' ? 'ages gracefully' : 'ages well';
    return { text:`${g} · ${phrase}`, tone:'ages' };
  }
  const fr = freshnessReading(tea);
  if(fr && fr.grounded){
    /* FRESH_NEAR_WEEKS retires as a GLOBAL, not as an idea. It withheld the countdown until ≤26 of
       a 12-month window remained — half — so a tea with most of its life ahead read as stock, not as
       a clock. Keeping that posture window-RELATIVE is the actual upgrade: half of a 30-day opened
       shincha is two weeks, half of a two-year oolong is a year, and one global number could never
       say both. Beyond halfway, the plain quantity tone; a calm app does not count down from far. */
    if(fr.leftDays > fr.totalDays/2) return { text:`${g} · plenty`, tone:'plenty' };
    if(fr.leftDays >= 7) return { text:`${g} · best within ${fmtSoftDays(fr.leftDays).replace(/^~/,'')}`, tone:'freshness' };
    return { text:`${g} · best enjoyed soon`, tone:'freshness' };
  }
  return { text:`${g} · plenty`, tone:'plenty' };
}
const STATUS_TONE_COLOR = { low:'var(--clay)', few:'var(--ink-soft)', freshness:'var(--ink-soft)', plenty:'var(--jade)', ages:'var(--jade)', empty:'var(--ink-soft)', untracked:'var(--ink-soft)' };
// running-low teas float to the top of the shelf in any density/filter (WS5 rule) — but only
// under the DEFAULT 'type' sort since v3.84 (#23 F1): an explicit sort keeps the engine's order.
// THE low predicate — every surface ("Low" chip, header count, cost card, restock pulls)
// derives from it so no two surfaces can disagree (#13 bug class). 'few' gets NO sort effect.
function isRunningLow(tea){ return stockTier(tea)==='low'; }
// Home "Running low" card membership (v3.82, #18 correction): 'few' never earns the card — a 'few'
// tea beside a ~months forecast puts the cups clock and the days clock under one headline; few's
// home is the shelf status line. v3.86 (#26 B): 'empty' joins 'low' — a drained favourite/rebuy is
// what a restock surface is for; 'untracked' never qualifies (unknown ≠ empty, by construction).
function restockCandidate(tea){ const tier=stockTier(tea); return !!(tea.isFavorite||tea.wouldRebuy) && (tier==='low'||tier==='empty'); }
function shelfSort(list){ return [...list].sort((a,b)=> (isRunningLow(b)?1:0)-(isRunningLow(a)?1:0)); }

// Photo area (grid ~100px / row 50px): the user's image, else a type-tinted stripe, else a kanji
// plate for white (白) / pu'er (餅). CSS owns the tints so both themes stay calm.
function shelfPhoto(tea, kind){
  const type = (tea.type||'').toLowerCase();
  const kanji = type==='white' ? '白' : (type==='puerh' ? '餅' : '');
  if(tea.image) return `<div class="shelf-${kind} shelf-img" style="background-image:url(${escapeHtml(tea.image)})"></div>`;
  if(kanji) return `<div class="shelf-${kind} shelf-kanji t-${escapeHtml(type)}"><span>${kanji}</span></div>`;
  return `<div class="shelf-${kind} shelf-ph t-${escapeHtml(type||'unknown')}"></div>`;
}
function shelfPill(tea){ return `<span class="shelf-pill t-${escapeHtml(tea.type||'')}">${escapeHtml(typeLabel(tea.type))}</span>`; }

/* THE ONE WRITER that paints a swatch (contract 1, v4.15). Takes a resolved liquor key — or null —
   the tea's type, and (v4.20) `hasLabel`, R124's predicate: does the row that holds this swatch also
   render a type label? Return is POLYMORPHIC BY SITE, and single-writer is one function owning the
   write path, not one output format (R124):
     · hasLabel FALSE (ref-swatch/social-tile/today-tint) → CSS attributes, UNCHANGED — the liquor as a
       background when there is a key, the shipped type tint when there is not. Tier 3 lives here, not
       in `liquorFor`, because a tint is a CSS class and the resolver has no business with stylesheets.
     · hasLabel TRUE (the shelf row, v4.20) → an inline SVG `<path>` at BOTH tiers (R145), because
       R144's dashed plate can't be a CSS border (dash length isn't settable there): filled 1px for a
       measured swatch, a dashed 1.5px PLATE for tier 3 — one object with its outline broken, so a
       filled block and an empty plate read as different things at the near-black end.
   The predicate reaches three of four sites (R125); only the shelf passes it now. When a later version
   enables it on ref-swatch/social-tile they flip CSS→SVG too — R145's "both tiers an SVG path" landing
   as R125 staged.

   `key` is validated by `isLiquorKey` upstream so it cannot inject; `type` is escaped anyway. The
   plate `d` is lifted VERBATIM from Design's board (shelf-swatch-ruling.dc.html:776) — R128, do not
   re-derive. style="…var(--line)…" not stroke="…" so the token resolves on the SVG stroke and themes;
   the board bakes #332F24 because it is a dark mockup, shipped code must not. */
const SHELF_SWATCH_PATH = "M9.75 0.75 H19.25 A4 4 0 0 1 23.25 4.75 V23.25 A8 8 0 0 1 15.25 31.25 H5.75 A5 5 0 0 1 0.75 26.25 V9.75 A9 9 0 0 1 9.75 0.75 Z";
function swatchAttr(base, key, type, hasLabel){
  if(hasLabel){
    const stroke = key
      ? `fill:var(--liquor-${escapeHtml(key)});stroke:var(--line);stroke-width:1;`
      : `fill:none;stroke:var(--line);stroke-width:1.5;stroke-dasharray:13 6;`;
    return `<svg class="${base}" viewBox="0 0 24 32"><path d="${SHELF_SWATCH_PATH}" style="${stroke}"/></svg>`;
  }
  return key ? `class="${base}" style="background:var(--liquor-${escapeHtml(key)});"`
             : `class="${base} t-${escapeHtml((type||'unknown').toLowerCase())}"`;
}

// Vessel identity ladder (R63): photo → kanji plate → type-tinted stripe. NOT an extension of
// shelfPhoto — that one is the TEA tile and its kanji key on tea.type (白 white, 餅 puerh), so 蓋碗
// there would mean a tea of type gaiwan. Vessels have no liquor swatch; photo/kanji IS their identity.
// Kanji covers only the types the boards drew. 旅 is deliberately absent: VESSEL_TYPES has no
// traveller entry and the "Travel cuppa" is typed Porcelain teapot, so that glyph was keyed off a
// vessel's free-text NAME — identity never keys off free text. Every unmapped type falls to the
// stripe, by design. Invisible on current data (all five vessels have photos); this is the
// graceful-degradation floor, fixtured rather than gold-plated.
const VESSEL_KANJI = { 'Gaiwan':'蓋碗', 'Shiboridashi':'絞', 'Cold brew jar':'冷' };
function vesselTypeSlug(type){ return ((type||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')) || 'unknown'; }
function vesselPhoto(v, kind){
  const cls = `vessel-${kind}`;                       // 'thumb' ships today; #05's larger tile arrives with slice B
  const slug = vesselTypeSlug(v && v.type);
  if(v && v.image) return `<span class="${cls}" style="background-image:url(${escapeHtml(v.image)})"></span>`;
  const kanji = VESSEL_KANJI[(v && v.type) || ''] || '';
  if(kanji) return `<span class="${cls} vessel-kanji v-${slug}"><span>${kanji}</span></span>`;
  return `<span class="${cls} is-ph v-${slug}"></span>`;
}
function statusLineHTML(tea){
  const st = statusLine(tea);
  // plain fav-leaf (no .i-fav jade override) so it inherits the clay status colour on 'low'.
  const leaf = st.tone==='low' ? icon('fav-leaf',13) : '';
  return `<span class="shelf-status" style="color:${STATUS_TONE_COLOR[st.tone]||'var(--ink-soft)'}">${leaf}${escapeHtml(st.text)}</span>`;
}

// Grid card (density = grid) — photo + type pill over name + the one status line. Ratings live on
// detail now (WS5), not here. Favourite still gets a quiet leaf on the photo (keeps issue #11 met).
function teaCardHTML(t){
  const fin = isTeaFinished(t);
  const fav = t.isFavorite ? `<span class="fav">${icon('fav-leaf',15)}</span>` : '';
  const rebuy = (fin && !rebuyAsked(t.id)) ? `<div class="shelf-rebuy" onclick="event.stopPropagation()">
      <span>Rebuy?</span>
      <button class="lib-chip" style="padding:1px 8px;font-size:11px;" onclick="event.stopPropagation();rebuyYes('${escapeJsArg(t.id)}')">Yes</button>
      <button class="btn-ghost" style="font-size:11px;padding:1px 4px;" onclick="event.stopPropagation();rebuyNo('${escapeJsArg(t.id)}')">No</button>
    </div>` : '';
  return `<div class="shelf-card${fin?' tea-finished':''}" onclick="openTeaDetail('${escapeJsArg(t.id)}')">
    <div class="shelf-photo-wrap">${shelfPhoto(t,'photo')}${shelfPill(t)}${fav}</div>
    <div class="shelf-cbody">
      <div class="shelf-name">${escapeHtml(t.name)}</div>
      ${statusLineHTML(t)}
      ${rebuy}
    </div>
  </div>`;
}
// v4.21 (#14): the row's IDENTITY block — swatch (R124/R145) + name + type pill + status — extracted as
// the ONE writer, so shelfRowHTML and the tea-picker row wrap the SAME identity and the spine's frame
// rollout re-dresses both at once (reuse, not invent). Two wrappers, one identity.
function teaRowIdentity(t){
  return `${swatchAttr('shelf-swatch', liquorFor(t), t.type, true)}
    <div class="shelf-row-mid">
      <div class="shelf-name">${escapeHtml(t.name)}</div>
      <div class="shelf-row-meta">${shelfPill(t)}${statusLineHTML(t)}</div>
    </div>`;
}
// Row (density = rows) — the swatch LEADS (identity), the PHOTO trails as a small square thumb before
// the caret (evidence) — board S1/S2, photo kept not dropped (F4/TD1). v4.20.
function shelfRowHTML(t){
  const fin = isTeaFinished(t);
  return `<div class="shelf-row${fin?' tea-finished':''}" onclick="openTeaDetail('${escapeJsArg(t.id)}')">
    ${teaRowIdentity(t)}
    ${shelfPhoto(t,'thumb')}
    <span class="shelf-caret">${icon('i-caret-hl',20)}</span>
  </div>`;
}
/* ---------- the tea & vessel pickers (v4.21, #14 / board 04 rev 6) ----------
   R58 SCREENS (not overlays, not native <select> — the OS pop-out is the gap #14 names). Opened from
   session setup / the quick flow / the edit modal; each carries a SERIALIZABLE ctx TAG (kind +
   returnView + currentId), and pickChoose dispatches BY KIND to the existing setter so its side effects
   run — crucially d_setVessel's methodPrefillFor, never a raw vesselId write (ruling 1). NOT in
   HISTORY_VIEWS: in-screen back → returnView; a browser back-gesture exits draft-safe (the v4.17
   pattern, ruling 2). Tea rows reuse teaRowIdentity (one writer, two wrappers); vessel rows reuse
   vesselPhoto as-is (ruling 4). Search is a DOM-partial list refresh (mirrors onTeaSearchInput) so the
   input keeps focus; the type filter and show-finished re-render (a click, focus is not at stake). */
function openPicker(kind, returnView){
  const d = state.sessionDraft, e = state.editingSession;
  const currentId = (kind==='draft-tea') ? (d&&d.teaId) : (kind==='draft-vessel') ? (d&&d.vesselId) : (e&&e.vesselId);
  state.pickerCtx = { kind, returnView, currentId: currentId||'' };
  state.pickerQuery = ''; state.pickerFilter = '';
  state.view = (kind==='draft-tea') ? 'pick-tea' : 'pick-vessel';
  render();
}
function closePicker(){ const c=state.pickerCtx; state.pickerCtx=null; state.view=(c&&c.returnView)||'session'; render(); }
function pickChoose(id){
  const c = state.pickerCtx; if(!c) return;
  state.pickerCtx = null; state.view = c.returnView;   // return view set BEFORE the setter so its own render() lands there
  if(c.kind==='draft-tea') d_setTea(id);
  else if(c.kind==='draft-vessel') d_setVessel(id);    // methodPrefillFor runs — NOT bypassed (ruling 1)
  else if(c.kind==='edit-vessel') es_set('vesselId', id);
  render();   // es_set doesn't render; d_set* do — the idempotent double-render is accepted (ruling 1)
}
function onPickSearchInput(val){
  state.pickerQuery = val;
  const list = document.getElementById('pickList');
  if(list) list.innerHTML = (state.view==='pick-vessel') ? pickVesselListHTML() : pickTeaListHTML();
  const x = document.getElementById('pickSearchX'); if(x) x.style.display = val ? '' : 'none';
}
function clearPickSearch(){ state.pickerQuery=''; render(); }
function pickSetFilter(type){ state.pickerFilter = (state.pickerFilter===type) ? '' : type; render(); }
// TEA picker (setup + quick). Flat list, search + one type filter, NO optgroups (ruling 3). Finished
// hidden behind "show finished (n)" (reuses d.showFinishedTeas), dimmed inline when shown, and the
// current selection is always shown even when finished, regardless of the toggle.
function pickTeaListHTML(){
  const d = state.sessionDraft, c = state.pickerCtx;
  const curId = c ? c.currentId : '', q = state.pickerQuery, ft = state.pickerFilter;
  const showFin = !!(d && d.showFinishedTeas);
  const finishedN = state.teas.filter(isTeaFinished).length;
  let rows = state.teas.filter(t=>{
    if(!teaMatchesSearch(t, q)) return false;
    if(ft && (t.type||'')!==ft) return false;
    if(isTeaFinished(t) && !showFin && t.id!==curId) return false;   // finished hidden unless shown, or it's the current pick
    return true;
  });
  rows = sortTeasByTypeThenName(rows);
  const list = rows.length ? rows.map(t=>pickTeaRow(t, curId)).join('') : `<div class="pick-empty">No teas match.</div>`;
  const finLink = (!showFin && finishedN)
    ? `<button type="button" class="pick-showfin" onclick="d_showFinishedTeas()">show finished (${finishedN})</button>` : '';
  return list + finLink;
}
function pickTeaRow(t, curId){
  const sel = t.id===curId, fin = isTeaFinished(t);
  return `<div class="pick-row${fin?' tea-finished':''}${sel?' is-selected':''}" role="button" tabindex="0" aria-pressed="${sel?'true':'false'}" onclick="pickChoose('${escapeJsArg(t.id)}')">
    ${teaRowIdentity(t)}
    ${sel?'<span class="pick-tick">✓</span>':''}
  </div>`;
}
function pickTypeChips(){
  const types = [...new Set(state.teas.map(t=>t.type).filter(Boolean))].sort();
  if(types.length<2) return '';
  return `<div class="pick-filter">${types.map(ty=>`<button type="button" class="pick-chip${state.pickerFilter===ty?' is-on':''}" onclick="pickSetFilter('${escapeJsArg(ty)}')">${escapeHtml(typeLabel(ty))}</button>`).join('')}</div>`;
}
function viewPickTea(){
  return `
    <button class="detail-back" onclick="closePicker()">← Back</button>
    <h2 style="margin:2px 0 6px;">Choose a tea</h2>
    <div class="pick-search">
      <input id="pickSearchInput" type="text" placeholder="search your shelf…" value="${escapeHtml(state.pickerQuery)}" oninput="onPickSearchInput(this.value)" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Search your shelf">
      <button id="pickSearchX" class="lib-search-x" onclick="clearPickSearch()" aria-label="Clear search" style="${state.pickerQuery?'':'display:none;'}">✕</button>
    </div>
    ${pickTypeChips()}
    <div id="pickList" class="pick-list">${pickTeaListHTML()}</div>
    <button type="button" class="pick-add" onclick="openTeaForm()">＋ Add a new tea</button>
  `;
}
// VESSEL picker (setup + quick + edit). Identity = vesselPhoto (photo → kanji → stripe, as-is, ruling 4).
function vesselMatchesSearch(v, q){ q=teaSearchNorm(q); if(!q) return true; return [v.name,v.material,v.type].some(f=>teaSearchNorm(f).includes(q)); }
function pickVesselListHTML(){
  const c = state.pickerCtx, curId = c ? c.currentId : '', q = state.pickerQuery;
  const rows = state.vessels.filter(v=>vesselMatchesSearch(v,q));
  // "No vessel" — the vessel is OPTIONAL (R43), so a real selectable-as-none choice, at the top when
  // not searching. pickChoose('') → d_setVessel('') clears it (methodPrefillFor('') is a no-op).
  const none = q ? '' : `<div class="pick-row${curId?'':' is-selected'}" role="button" tabindex="0" aria-pressed="${curId?'false':'true'}" onclick="pickChoose('')"><span class="shelf-name" style="color:var(--ink-soft);">No vessel</span>${curId?'':'<span class="pick-tick">✓</span>'}</div>`;
  if(!rows.length && !none) return `<div class="pick-empty">No vessels match.</div>`;
  return none + rows.map(v=>pickVesselRow(v, curId)).join('');
}
function pickVesselRow(v, curId){
  const sel = v.id===curId;
  const meta = [v.material, v.capacityMl?`${v.capacityMl} ml`:''].filter(Boolean).join(' · ');
  return `<div class="pick-row${sel?' is-selected':''}" role="button" tabindex="0" aria-pressed="${sel?'true':'false'}" onclick="pickChoose('${escapeJsArg(v.id)}')">
    ${vesselPhoto(v,'thumb')}
    <div class="shelf-row-mid"><div class="shelf-name">${escapeHtml(v.name)}</div><div class="shelf-row-meta">${escapeHtml(meta)}</div></div>
    ${sel?'<span class="pick-tick">✓</span>':''}
  </div>`;
}
function viewPickVessel(){
  return `
    <button class="detail-back" onclick="closePicker()">← Back</button>
    <h2 style="margin:2px 0 6px;">Choose a vessel</h2>
    <div class="pick-search">
      <input id="pickSearchInput" type="text" placeholder="search vessels…" value="${escapeHtml(state.pickerQuery)}" oninput="onPickSearchInput(this.value)" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Search vessels">
      <button id="pickSearchX" class="lib-search-x" onclick="clearPickSearch()" aria-label="Clear search" style="${state.pickerQuery?'':'display:none;'}">✕</button>
    </div>
    <div id="pickList" class="pick-list">${pickVesselListHTML()}</div>
    <div class="pick-footer">
      <button type="button" class="pick-add" onclick="openVesselForm()">＋ Add a vessel</button>
      <button type="button" class="pick-manage" onclick="goVessels()">manage vessels ›</button>
    </div>
  `;
}
// grid|rows density — a device-local preference (persists like theme), not synced.
function teaDensity(){ try{ return localStorage.getItem('tealog_teaDensity')==='rows' ? 'rows' : 'grid'; }catch(e){ return 'grid'; } }
function setTeaDensity(d){ try{ localStorage.setItem('tealog_teaDensity', d==='rows'?'rows':'grid'); }catch(e){} render(); }
/* rebuy affordance memory — device-local (localStorage), one-time per tea. "Yes" also records
   would_rebuy (synced) and drops the tea on the shopping list; "No" just remembers we asked. */
function rebuyAsked(id){ try{ return JSON.parse(localStorage.getItem('tealog_rebuyAsked')||'[]').includes(id); }catch(e){ return false; } }
function markRebuyAsked(id){ try{ const a=JSON.parse(localStorage.getItem('tealog_rebuyAsked')||'[]'); if(!a.includes(id)){ a.push(id); localStorage.setItem('tealog_rebuyAsked', JSON.stringify(a)); } }catch(e){} }
function rebuyYes(id){
  const t = teaById(id);
  if(t){ t.wouldRebuy = true; persistTea(t); }
  markRebuyAsked(id);
  if(typeof addWishFromTea==='function') addWishFromTea(id); else render(); // addWishFromTea re-renders
}
function rebuyNo(id){ markRebuyAsked(id); render(); }

function distinctVendors(){
  return [...new Set(state.teas.map(t=>(t.source||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
}
// R180 D4: the analog of distinctVendors over the vessel shelf, feeding the material suggester.
function distinctMaterials(){
  return [...new Set(state.vessels.map(v=>(v.material||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
}
// R179/R180: the shop/vendor + material inline suggesters, replacing the native <datalist>/OS strip.
// Each substring-filters a distinct-values set through the shared renderFieldSuggest; a tap writes the
// value straight into the input (a plain DOM write — the forms are uncontrolled, read on submit), and a
// brand-new typed value is simply left as-is. Parametrized by input/box id for their call sites.
function renderVendorSuggest(query, inputId, boxId){
  renderFieldSuggest(boxId, query, distinctVendors(), m=>`pickFieldSuggest('${escapeJsArg(m)}','${escapeJsArg(inputId)}','${escapeJsArg(boxId)}')`);
}
function renderMaterialSuggest(query, inputId, boxId){
  renderFieldSuggest(boxId, query, distinctMaterials(), m=>`pickFieldSuggest('${escapeJsArg(m)}','${escapeJsArg(inputId)}','${escapeJsArg(boxId)}')`);
}
// R180: generic pick — sets the input value and clears the box. Was pickVendorSuggest (R179); renamed
// when material became the second caller, so the name no longer lies. Both suggesters bind it.
function pickFieldSuggest(val, inputId, boxId){
  const inp = document.getElementById(inputId); if(inp) inp.value = val;
  const box = document.getElementById(boxId); if(box) box.innerHTML = '';
}
function vendorManagerHTML(){
  const vendors = distinctVendors();
  const rows = vendors.map(v=>{
    const count = state.teas.filter(t=>(t.source||'').trim()===v).length;
    return `<div class="vendor-row">
      <input type="text" value="${escapeHtml(v)}" data-old="${escapeHtml(v)}" onchange="renameVendorFromInput(this)" onkeydown="if(event.key==='Enter')this.blur()">
      <span class="vendor-count">${count} tea${count===1?'':'s'}</span>
    </div>`;
  }).join('');
  return `<div class="card" style="margin-bottom:14px;">
    <div class="section-title" style="margin-bottom:6px;"><h2 style="font-family:var(--font-display);font-size:17px;">Vendors</h2><button class="lib-chip" onclick="toggleVendors()">Done</button></div>
    <div style="font-size:12px;color:var(--ink-soft);margin-bottom:10px;">Rename to fix a typo, or type an existing name to merge duplicates. Changes apply across every tea from that shop.</div>
    ${vendors.length ? rows : '<div class="empty" style="padding:10px;">No vendors yet — add a shop when you add a tea.</div>'}
  </div>`;
}
function toggleVendors(){ state.vendorsOpen = !state.vendorsOpen; render(); }
function renameVendorFromInput(el){ renameVendor(el.dataset.old, el.value.trim()); }
function renameVendor(oldName, newName){
  oldName = (oldName||'').trim();
  if(!newName || newName===oldName){ render(); return; }
  let changed = 0;
  state.teas.forEach(t=>{ if((t.source||'').trim()===oldName){ t.source = newName; window.SteepDB.putTea(t).catch(saveErr); changed++; } });
  if(changed) showToast(`✓ "${oldName}" → "${newName}" (${changed} tea${changed===1?'':'s'})`);
  render();
}
/* #19 Library search — light normalization so German input is first-class: lowercase, ß→ss, and
   fold combining diacritics (ü→u, ä→a, é→e…). Folding only ever *broadens* a match, so no tea can be
   hidden by it — the asymmetric-risk argument. Applied to BOTH the query and every field. */
function teaSearchNorm(s){ return String(s||'').toLowerCase()
  .replace(/ß/g,'ss')
  .normalize('NFD').replace(/[̀-ͯ]/g,'')
  .trim(); }
// The query is folded INSIDE the predicate so the invariant is structural — callers pass raw text.
// Matches across name / origin / cultivar / vendor(source). Empty query matches everything.
function teaMatchesSearch(t,q){ q=teaSearchNorm(q); if(!q) return true;
  return [t.name,t.origin,t.cultivar,t.source].some(f=>teaSearchNorm(f).includes(q)); }
function filteredSortedTeas(){
  const F = state.teaFilter;
  const list = state.teas.filter(t=>{
    if(F.type && t.type!==F.type) return false;
    if(F.vendor && (t.source||'').trim()!==F.vendor) return false;
    if(F.lowStock && !isRunningLow(t)) return false;   // #18: tier-aware; finished/untracked no longer match
    if(F.favorite && !t.isFavorite) return false;
    if(!teaMatchesSearch(t, state.teaSearch)) return false;   // #19: composes with chips as AND
    return true;
  });
  const time = t => new Date(t.dateAdded||0).getTime();
  const s = state.teaSort;
  if(s==='type') return sortTeasByTypeThenName(list);   // grouped by type, alpha within (default)
  if(s==='newest') list.sort((a,b)=>time(b)-time(a));
  else if(s==='oldest') list.sort((a,b)=>time(a)-time(b));
  else if(s==='name') list.sort((a,b)=>(a.name||'').localeCompare(b.name||''));
  else if(s==='stock-high') list.sort((a,b)=>(Number(b.amountGrams)||0)-(Number(a.amountGrams)||0));
  else if(s==='stock-low') list.sort((a,b)=>(Number(a.amountGrams)||0)-(Number(b.amountGrams)||0));
  else if(s==='rating') list.sort((a,b)=>(Number(b.rating)||0)-(Number(a.rating)||0));
  return list;
}
/* #13 header rework (R3 slice B). Two controls, one three-valued state: the MODE pair (your shelf ↔
   Go Deeper, R51) is always drawn; the teas/vessels segment row is shelf-mode only, which is what
   #13 draws and what makes the two axes collapse into one variable. Go Deeper draws neither the
   segment row nor the overflow. */
function teaSegOf(){ const s = state.teaSeg; return (s==='vessels'||s==='deeper') ? s : 'teas'; }
function teaHeadHTML(seg){
  const low = state.teas.filter(t=>isRunningLow(t)).length;
  const empty = state.teas.filter(t=>isTeaFinished(t)).length;
  // The count line is GENERATED (R68) — a zeroed segment is dropped rather than printed as "0".
  const shelfCount = [ `${state.teas.length} on the shelf`, low?`${low} running low`:'', empty?`${empty} empty`:'' ].filter(Boolean).join(' · ');
  const sittings = (state.sessions||[]).filter(s=>s.vesselId).length;
  const vesselCount = [ `${state.vessels.length} vessel${state.vessels.length===1?'':'s'}`, sittings?`${sittings} sittings logged`:'' ].filter(Boolean).join(' · ');
  const meta = seg==='deeper' ? 'the reference · not your shelf'
             : seg==='vessels' ? vesselCount : shelfCount;
  const title = seg==='deeper' ? 'Go Deeper' : (seg==='vessels' ? 'Vessels' : 'Teas');
  // One committing action per screen (§0.5 contract 2) — it stays VISIBLE, never behind the ⋯.
  // R5 spine: the shelf's ONE committing action is the SLAB (clay), mirroring Home's masthead — reuse
  // .btn-clay (no second clay container). Board draws it as a bottom block; kept in the masthead here
  // (containers only — no layout move), spine-consistent with Home carrying its clay action in the head.
  const add = seg==='deeper' ? ''
    : `<button class="btn-clay btn-add-slab" onclick="${seg==='vessels'?'openVesselForm()':'openTeaForm()'}">${icon('i-plus-hl',14)} Add</button>`;
  // Overflow is the shelf's, not the reference's or the vessel list's.
  const more = seg==='teas'
    ? `<button class="tea-more" onclick="toggleTeaOverflow()" aria-label="More" aria-expanded="${state.teaOverflowOpen?'true':'false'}">⋯</button>` : '';
  // R5 spine pilot: the masthead is a BAND (full-bleed --band stripe). Title + generated count line lead;
  // the one committing action (the clay slab) + ⋯ sit on the right. Containers only — copy/data unchanged.
  return `<div class="band lib-band">
      <div class="lib-title">
        <h2>${title}</h2>
        <span class="lib-kicker mono">${escapeHtml(meta)}</span>
      </div>
      <div class="lib-head-actions">${add}${more}</div>
    </div>`;
}
function teaModeHTML(seg){
  const on = seg==='deeper' ? 'deeper' : 'shelf';
  const modes = `<div class="tea-modes" role="group" aria-label="Shelf or reference">
      <button class="tea-mode ${on==='shelf'?'active':''}" onclick="setTeaSeg('teas')">Your shelf</button>
      <button class="tea-mode ${on==='deeper'?'active':''}" onclick="setTeaSeg('deeper')">Go Deeper</button>
    </div>`;
  if(on==='deeper') return modes;    // the reference has no segment row (#13 draws none)
  return `${modes}<div class="tea-segs">
      <button class="tea-seg ${seg==='teas'?'active':''}" onclick="setTeaSeg('teas')">teas</button>
      <button class="tea-seg ${seg==='vessels'?'active':''}" onclick="setTeaSeg('vessels')">vessels</button>
    </div>`;
}
/* The ⋯ sheet. Holds the controls the header rework moved off the count row — sort (R60a: the seven
   engine sorts are PRESERVED, relocated, not removed) and density. Filter chips and search stay
   visible; "Import backup" is deliberately NOT here (it ships in Settings and is the app's most
   destructive action — a second entry point is new work no ruling asked for). */
function teaOverflowHTML(){
  if(!state.teaOverflowOpen) return '';
  const density = teaDensity();
  const vendors = distinctVendors();
  return `<div class="hub-scrim" onclick="toggleTeaOverflow()"></div>
    <div class="hub-sheet" role="dialog" aria-label="Shelf options">
      <div class="hub-grab"></div>
      <div class="ovf-row">
        <span class="ovf-k mono">Sort</span>
        <div class="lib-sort">
          <select onchange="setTeaSort(this.value)" aria-label="Sort teas">${TEA_SORT_OPTS.map(([k,l])=>`<option value="${k}" ${state.teaSort===k?'selected':''}>${l}</option>`).join('')}</select>
          <span class="lib-sort-caret">${icon('i-caret-hl',14)}</span>
        </div>
      </div>
      <div class="ovf-row">
        <span class="ovf-k mono">Density</span>
        <div class="density-toggle" role="group" aria-label="Density">
          <button class="density-seg ${density==='rows'?'active':''}" onclick="setTeaDensity('rows')" aria-label="List view">${icon('i-rows-hl',16)}</button>
          <button class="density-seg ${density==='grid'?'active':''}" onclick="setTeaDensity('grid')" aria-label="Grid view">${icon('i-grid-hl',16)}</button>
        </div>
      </div>
      ${vendors.length ? `<button class="hub-row" onclick="openVendorManager()">${icon('i-shopping-hl',20)}<span>Edit vendors</span></button>` : ''}
    </div>`;
}
function toggleTeaOverflow(){ state.teaOverflowOpen = !state.teaOverflowOpen; render(); }
function openVendorManager(){ state.teaOverflowOpen=false; state.vendorsOpen=true; render(); }
// v3.84 (#23 F1): the 7 engine sorts. Module-level since v3.96 so the overflow sheet and the R61
// preservation guard read the same list — R60a preserves the capability, not the markup that
// happened to express it.
const TEA_SORT_OPTS = [['type','Type'],['newest','Recently added'],['oldest','Oldest first'],['name','Name A–Z'],['stock-high','Most stock'],['stock-low','Least stock'],['rating','Highest rated']];
function viewTeas(){
  // Teas + Vessels live under one tab (v3.46); Go Deeper joins them as the third state of the same
  // variable (R51/#13). One segmented control switches segments, one switches modes.
  const seg = teaSegOf();
  const head = teaHeadHTML(seg) + teaModeHTML(seg);
  if(seg==='vessels') return `${head}${viewVessels()}`;         // viewVessels lives in steep-sessions.js
  if(seg==='deeper') return `${head}
    <div class="lib-search">
      <input id="refSearchInput" type="text" placeholder="Search the reference…" value="${escapeHtml(state.refSearch||'')}" oninput="onRefSearchInput(this.value)" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Search the reference">
      <button id="refSearchX" class="lib-search-x" onclick="clearRefSearch()" aria-label="Clear search" style="${state.refSearch?'':'display:none;'}">✕</button>
    </div>
    <div id="refList">${refListHTML()}</div>`;                  // refListHTML lives in steep-reference.js
  const F = state.teaFilter;
  const vendors = distinctVendors();
  // The counts moved into teaHeadHTML's generated kicker (#13's header rework).
  // Filter chips: All · <types you own, in canonical order> · Low · Favs. These stay VISIBLE — only
  // sort and density moved into the ⋯ sheet. "Edit vendors" left the chip row for that sheet (R52
  // names the shelf's overflow as the vendor manager's home).
  const typesPresent = [...new Set(state.teas.map(t=>(t.type||'').toLowerCase()).filter(Boolean))].sort((a,b)=>typeRank(a)-typeRank(b));
  const noFilter = !F.type && !F.lowStock && !F.favorite;
  const chips = state.teas.length ? `
    <div class="chip-row">
      <button class="lib-chip ${noFilter?'active':''}" onclick="clearTeaFilters()">All</button>
      ${typesPresent.map(ty=>`<button class="lib-chip ${F.type===ty?'active':''}" onclick="toggleTypeFilter('${ty}')">${escapeHtml(typeLabel(ty))}</button>`).join('')}
      <button class="lib-chip ${F.lowStock?'active':''}" onclick="toggleLowStockFilter()">Low</button>
      <button class="lib-chip ${F.favorite?'active':''}" onclick="toggleFavoriteFilter()">${favLeaf(13)} Favs</button>
    </div>` : '';
  // #19 quiet hairline search — sits below the chips (chips stay the primary WS5 control). The ✕ is
  // always in the DOM, hidden when empty, so onTeaSearchInput can toggle it without a full re-render.
  const searchRow = state.teas.length ? `
    <div class="lib-search">
      <input id="teaSearchInput" type="text" placeholder="Search teas…" value="${escapeHtml(state.teaSearch)}" oninput="onTeaSearchInput(this.value)" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Search teas">
      <button id="teaSearchX" class="lib-search-x" onclick="clearTeaSearch()" aria-label="Clear search" style="${state.teaSearch?'':'display:none;'}">✕</button>
    </div>` : '';
  return `
    ${head}
    ${chips}
    ${searchRow}
    ${state.vendorsOpen && vendors.length ? vendorManagerHTML() : ''}
    <div id="teaShelf">${teaShelfHTML()}</div>
    ${teaOverflowHTML()}
  `;
}
// #19: the shelf body (active + finished, or the empty line). Split out so onTeaSearchInput can swap
// ONLY this node's innerHTML on each keystroke — a full render() would drop focus/caret from the input.
function teaShelfHTML(){
  const density = teaDensity();
  const list = filteredSortedTeas();
  // v3.84 (#23 F1): the WS5 running-low float decorates ONLY the default type sort — under an
  // explicit sort it would silently reorder the user's chosen order. Finished split is upstream
  // of the branch, so finished teas group at the bottom in ALL sorts.
  const actives = list.filter(t=>!isTeaFinished(t));
  const active = state.teaSort==='type' ? shelfSort(actives) : actives;
  const finished = list.filter(t=>isTeaFinished(t));
  const renderShelf = (teas) => density==='rows'
    ? `<div class="shelf-rows">${teas.map(shelfRowHTML).join('')}</div>`
    : `<div class="tea-grid">${teas.map(teaCardHTML).join('')}</div>`;
  const finishedBlock = finished.length ? `
      <div class="section-title" style="margin-top:22px;opacity:.75;"><h2 style="font-family:var(--font-display);font-size:15px;color:var(--ink-soft);">Finished</h2><span class="mono" style="font-size:11px;color:var(--ink-soft);">${finished.length}</span></div>
      <div style="opacity:.62;">${renderShelf(finished)}</div>` : '';
  if(list.length) return `${renderShelf(active)}${finishedBlock}`;
  const empty = state.teas.length
    ? (state.teaSearch.trim() ? 'No teas match your search.' : 'No teas match these filters.')
    : 'No teas yet — add your first one.';
  return `<div class="card empty">${empty}</div>`;
}
function onTeaSearchInput(val){
  state.teaSearch = val;
  const shelf = document.getElementById('teaShelf'); if(shelf) shelf.innerHTML = teaShelfHTML();
  const x = document.getElementById('teaSearchX'); if(x) x.style.display = val ? '' : 'none';
}
function clearTeaSearch(){ state.teaSearch=''; render(); }
// Type chip toggles: pick a type, or clear it if it's already the active one (back to All).
function toggleTypeFilter(type){ state.teaFilter.type = (state.teaFilter.type===type) ? '' : type; render(); }
// Three states, one variable (#13): teas · vessels · deeper. Anything else normalises to teas, so a
// stale persisted value can never render an empty tab.
function setTeaSeg(seg){ state.teaSeg = (seg==='vessels'||seg==='deeper') ? seg : 'teas'; state.view='teas'; state.teaOverflowOpen=false; render(); }
function setTeaSort(v){ state.teaSort=v; render(); }
function setTeaFilter(key, val){ state.teaFilter[key]=val; render(); }
function toggleLowStockFilter(){ state.teaFilter.lowStock=!state.teaFilter.lowStock; render(); }
function clearTeaFilters(){ state.teaFilter={type:'',vendor:'',lowStock:false,favorite:false}; render(); }
function toggleFavoriteFilter(){ state.teaFilter.favorite=!state.teaFilter.favorite; render(); }
function goLowStock(){ state.teaFilter={type:'',vendor:'',lowStock:true,favorite:false}; goView('teas'); }

function openTeaForm(existing){
  state.editingTea = existing || null;
  state._draftImage = existing ? existing.image : null;
  state.teaFormOpen = true;
  _kbSuggestDismissed = false; _kbSuggest = null;
  _cultivarHintDismissed = false; // v3.90: fresh cultivar hint per form open
  _teaFormTouched = false; // WS1: reset dirty-tracking so a fresh form closes freely
  render();
}
// WS1: guard against losing a half-filled form. Dropping the explicit Cancel button (× + tap-outside)
// means a stray backdrop tap must NOT silently discard typed work. `_teaFormTouched` flips true on the
// first edit (form-level oninput, which also catches the photo file input). Backdrop tap is inert while
// dirty; the × arms an inline confirm while dirty; a clean form closes freely either way.
let _teaFormTouched = false;
function teaFormBackdrop(){ if(!_teaFormTouched) closeTeaForm(); } // dirty → do nothing (no accidental discard)
function teaFormCloseGuard(btn){
  if(_teaFormTouched) armConfirm(btn, 'Discard changes?', ()=>closeTeaForm());
  else closeTeaForm();
}

/* ---------- gentle knowledge-base prefill (v3.38) ----------
   As a name is typed on a NEW tea, offer the KB's type/origin as a suggestion the user
   can accept or ignore — never auto-applied (calm-first). leafForm is left to
   inferLeafForm (which also consults the KB). Only offers fields that aren't already set. */
let _kbSuggest = null, _kbSuggestDismissed = false;
// Soft cultivar check (v3.90): on blur, if the typed cultivar is really a tea name/style/place per the
// reference catalog, show a quiet, dismissable heads-up. NEVER blocks or rewrites — the value saves as
// typed (submitTeaForm reads f.cultivar.value unchanged). Silent on real cultivars and unknowns.
let _cultivarHintDismissed = false;
function cultivarHintCheck(){
  const box = document.getElementById('teaCultivarHint');
  if(!box) return;
  if(_cultivarHintDismissed || typeof cultivarNameHint!=='function'){ box.innerHTML=''; return; }
  const form = document.getElementById('teaForm');
  const val = form ? (form.elements['cultivar'].value||'').trim() : '';
  const hit = val ? cultivarNameHint(val) : null;
  if(!hit){ box.innerHTML=''; return; }
  box.innerHTML = `<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:6px;font-size:12px;color:var(--ink-soft);background:var(--jade-pale);border:1px solid var(--line);border-radius:8px;padding:7px 10px;">
    <span>“${escapeHtml(val)}” looks like a tea name or style rather than a cultivar — kept as you typed it.</span>
    <button type="button" class="btn-ghost" style="font-size:12px;padding:2px 4px;" onclick="dismissCultivarHint()">dismiss</button>
  </div>`;
}
function dismissCultivarHint(){
  _cultivarHintDismissed = true;
  const box = document.getElementById('teaCultivarHint'); if(box) box.innerHTML='';
}
function teaFormNameSuggest(){
  const box = document.getElementById('teaKbSuggest');
  if(!box) return;
  const form = document.getElementById('teaForm');
  if(!form || state.editingTea || _kbSuggestDismissed || typeof kbResolve!=='function'){ box.innerHTML=''; return; }
  const name = (form.elements['name'].value||'').trim();
  const curType = form.elements['type'].value;
  const curOrigin = (form.elements['origin'].value||'').trim();
  const curCultivar = (form.elements['cultivar'].value||'').trim();
  const kb = name ? kbResolve([name, curCultivar, curOrigin].join(' ')) : null;
  const wantType = (kb && TYPES.some(t=>t.k===kb.type) && kb.type!==curType) ? kb.type : null;
  const wantOrigin = (kb && kb.country && !curOrigin) ? kb.country : null;
  if(!wantType && !wantOrigin){ box.innerHTML=''; _kbSuggest=null; return; }
  _kbSuggest = { type:wantType, origin:wantOrigin };
  const msg = (wantType && wantOrigin) ? `Looks like ${typeLabel(wantType)} from ${wantOrigin}.`
    : wantType ? `Looks like ${typeLabel(wantType)}.` : `Looks like it's from ${wantOrigin}.`;
  box.innerHTML = `<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:6px;font-size:12px;color:var(--ink-soft);background:var(--jade-pale);border:1px solid var(--line);border-radius:8px;padding:7px 10px;">
    <span>${escapeHtml(msg)}</span>
    <button type="button" class="lib-chip" onclick="applyKbSuggest()">Use this</button>
    <button type="button" class="btn-ghost" style="font-size:12px;padding:2px 4px;" onclick="dismissKbSuggest()">dismiss</button>
  </div>`;
}
function applyKbSuggest(){
  const form = document.getElementById('teaForm');
  if(!form || !_kbSuggest) return;
  if(_kbSuggest.type) form.elements['type'].value = _kbSuggest.type;
  if(_kbSuggest.origin && !(form.elements['origin'].value||'').trim()) form.elements['origin'].value = _kbSuggest.origin;
  _kbSuggest = null;
  const box = document.getElementById('teaKbSuggest'); if(box) box.innerHTML='';
  liquorRefresh();   // applied type may change the tier-3 tint; the liquor itself still follows name (F2)
}
function dismissKbSuggest(){
  _kbSuggestDismissed = true; _kbSuggest = null;
  const box = document.getElementById('teaKbSuggest'); if(box) box.innerHTML='';
}
function closeTeaForm(){ state.teaFormOpen=false; state.editingTea=null; state.teaPrefill=null; state._draftImage=null; render(); }

/* #06 rev 4 draws Add and Edit as DISTINCT STATES, and the build treated them identically. Rating,
   brew guide and favourite already shipped — folded behind Specifics — so this is a promotion, not
   three new fields (the board's "adds the three missing editables" describes a gap that closed
   earlier). They move above the fold on EDIT ONLY:
     · Add exists to get a new tin recorded before you forget it. Everything past name and type is
       friction, and WS1's "name and type are all you need" stays exactly as it is.
     · Edit is opened because something specific changed — a rating formed, the brewing got worked
       out, it earned favourite. Making you expand a fold to reach the field you came for is the
       wrong default on that path.
   THOSE THREE AND NOTHING ELSE. The fold holds thirteen fields; "promote what Edit is for" drifts
   into harvest, origin, cultivar, vendor, cost very easily, and that is scope creep dressed as
   layout. The fields are rendered once by a shared builder and placed on one side or the other, so
   the two states cannot drift into two different forms. */
function teaFormModal(){
  const t = state.editingTea || state.teaPrefill || {};
  const isEdit = !!t.id;
  const typeOpts = TYPES.map(ty=>`<option value="${ty.k}" ${t.type===ty.k?'selected':''}>${ty.label}</option>`).join('');
  const ratingField = `<div class="field"><label>Your rating</label><div id="teaRatingWrap">${renderStarsInteractive(Number(t.rating)||0,true,'setTeaFormRating')}</div><input type="hidden" name="rating" id="teaRatingInput" value="${t.rating||0}"></div>`;
  const brewField = `<div class="field span2"><label>How to brew</label><textarea name="brewGuide" placeholder="95°C, 5s rinse, 15s / 20s / 30s...">${escapeHtml(t.brewGuide||'')}</textarea></div>`;
  const favField = `<label class="checkrow"><input type="checkbox" name="isFavorite" ${t.isFavorite?'checked':''}> Favorite</label>`;
  const promoted = isEdit ? `<div class="form-grid" style="margin-top:14px;">${ratingField}<div class="field">${favField}</div>${brewField}</div>` : '';
  return `<div class="overlay" onclick="if(event.target===this) teaFormBackdrop()">
    <div class="modal">
      <div class="modal-head"><h2>${t.id?'Edit tea':'Add a tea'}</h2><button class="close-x" onclick="teaFormCloseGuard(this)">✕</button></div>
      <form id="teaForm" onsubmit="submitTeaForm(event)" oninput="_teaFormTouched=true">
        <!-- WS1: photo · name · type up front (the minimum to save); everything else folds behind
             "Specifics". The fold is a DOM toggle, NOT a re-render — submitTeaForm reads the fields on
             submit, so they must stay in the DOM (display:none inputs still submit their values). -->
        <div class="img-upload dropzone${state._draftImage?' has-img':''}" id="imgUploadWrap" onclick="openPhotoSheet()" style="${state._draftImage?`background-image:url(${state._draftImage})`:''}">
          ${state._draftImage?'':`${icon('i-camera-hl',26)}<span>Add a photo</span>`}
        </div>
        ${photoInputs()}
        <div class="field" style="margin-top:14px;"><label>Name</label><input type="text" name="name" required value="${escapeHtml(t.name||'')}" oninput="teaFormNameSuggest();liquorRefresh()" placeholder="e.g. Sencha Kagoshima"><div id="teaKbSuggest"></div></div>
        <div class="field" style="margin-top:12px;"><label>Tea type</label><select name="type" onchange="liquorRefresh()">${typeOpts}</select></div>
        ${promoted}
        ${liquorRowHTML(t)}
        <div class="fold-row" onclick="toggleSpecifics(this)" role="button" aria-expanded="false" style="margin-top:14px;">
          <span class="fold-label">Specifics <span class="fold-sub">· amount, harvest, origin…</span></span>
          <span class="fold-caret">${icon('i-caret-hl',22)}</span>
        </div>
        <div class="form-grid specifics-body" id="teaSpecifics" style="display:none;">
          <div class="field span2"><label>Amount on hand (g)</label><input type="number" step="0.1" name="amountGrams" value="${t.amountGrams??''}">
            <label class="checkrow" style="margin-top:6px;font-size:12px;"><input type="checkbox" name="inclPackaging" onchange="var r=document.getElementById('tareRow'); if(r) r.style.display=this.checked?'flex':'none';"> Weighed with packaging</label>
            <div id="tareRow" style="display:none;align-items:center;gap:8px;margin-top:6px;"><span style="font-size:12px;color:var(--ink-soft);">subtract</span><input type="number" step="0.1" name="packagingTare" value="${state.settings.defaultPackagingTareG??10}" style="width:64px;"><span style="font-size:12px;color:var(--ink-soft);">g packaging</span></div>
          </div>
          ${isEdit?'':ratingField}
          <div class="field"><label>Harvest year</label><input type="text" name="harvestYear" value="${escapeHtml(t.harvestYear||'')}" placeholder="2025"></div>
          <div class="field"><label>Harvest season</label><select name="harvestSeason">
            <option value="" ${!t.harvestSeason?'selected':''}>—</option>
            <option ${t.harvestSeason==='Spring'?'selected':''}>Spring</option>
            <option ${t.harvestSeason==='Summer'?'selected':''}>Summer</option>
            <option ${t.harvestSeason==='Autumn'?'selected':''}>Autumn</option>
            <option ${t.harvestSeason==='Winter'?'selected':''}>Winter</option>
          </select></div>
          <div class="field"><label>Origin</label><input type="text" name="origin" value="${escapeHtml(t.origin||'')}" placeholder="Fujian, China">${originOfferHTML(t)}</div>
          <div class="field"><label>Cultivar</label><input type="text" name="cultivar" value="${escapeHtml(t.cultivar||'')}" placeholder="Qi Dan" onblur="cultivarHintCheck()"><div id="teaCultivarHint"></div></div>
          <div class="field span2"><label>Shop / vendor</label>
            <!-- R179: the native <datalist> is retired — on a phone its OS popup fought the keyboard
                 for the bottom strip. Reuses the .tag-suggest inline popover (renderFieldSuggest);
                 name="source" is unchanged so submitTeaForm still reads the value on submit. -->
            <div class="tag-input-wrap"><input type="text" name="source" id="teaVendorInput" value="${escapeHtml(t.source||'')}" autocomplete="off" style="width:100%;" placeholder="Pick a shop you've used, or type a new one" oninput="renderVendorSuggest(this.value,'teaVendorInput','teaVendorSuggest')"><div id="teaVendorSuggest"></div></div></div>
          <div class="field"><label>Price paid</label><input type="number" step="0.01" name="costTotal" value="${t.costTotal??''}" placeholder="12.50"></div>
          <div class="field"><label>Grams bought (for that price)</label><input type="number" step="0.1" name="costOriginalGrams" value="${t.costOriginalGrams??''}" placeholder="50"></div>
          <div class="field span2"><label>Purchase date <span style="color:var(--ink-soft);font-weight:400;">· for spend tracking. Leave blank if you already had it.</span></label>
            <div style="display:flex;gap:6px;align-items:center;">
              <input type="date" name="purchaseDate" value="${escapeHtml(t.purchaseDate||'')}" style="flex:1;">
              <button type="button" class="lib-chip" onclick="setPurchaseToday(this)">Today</button>
            </div>
          </div>
          <!-- v3.98: beside purchase date because they share a provenance cluster, NOT because they
               are the same join. Purchase = cost + inventory; opened = the freshness clock. Sealed
               vs opened is roughly a 5-10x swing, which is why this is the one measured rung. -->
          <div class="field span2"><label>Opened <span style="color:var(--ink-soft);font-weight:400;">· when you broke the seal. Freshness counts from here.</span></label>
            <div style="display:flex;gap:6px;align-items:center;">
              <input type="date" name="openedDate" value="${escapeHtml(t.openedDate||'')}" style="flex:1;">
              <button type="button" class="lib-chip" onclick="setOpenedToday(this)">Today</button>
            </div>
          </div>
          <div class="field span2"><label>Leaf form <span style="color:var(--ink-soft);font-weight:400;">· shapes the suggested steep times when there's no guide, and how they ramp past the last listed steep.</span></label>
            <select name="leafForm">
              <option value="" ${!t.leafForm?'selected':''}>Auto — infer from type &amp; name</option>
              ${LEAF_FORM_KEYS.map(k=>`<option value="${k}" ${t.leafForm===k?'selected':''}>${LEAF_PROFILES[k].label}</option>`).join('')}
            </select>
            ${!t.leafForm?`<div style="font-size:11px;color:var(--ink-soft);margin-top:4px;">Currently reads as <b>${LEAF_PROFILES[effectiveLeafForm(t)].label}</b>.</div>`:''}
          </div>
          ${isEdit?'':brewField}
          <div class="field span2"><label>Description</label><textarea name="description" placeholder="Tasting notes, character, story...">${escapeHtml(t.description||'')}</textarea></div>
          <div class="field span2" style="flex-direction:row;gap:18px;flex-wrap:wrap;">
            ${isEdit?'':favField}
            <label class="checkrow"><input type="checkbox" name="wouldRebuy" ${t.wouldRebuy?'checked':''}> Would rebuy</label>
          </div>
        </div>
        <button type="submit" class="btn btn-primary begin-btn" style="margin-top:20px;">Save tea</button>
        <div class="form-helper">name and type are all you need</div>
        ${t.id?`<div style="text-align:center;margin-top:14px;"><button type="button" class="btn-danger btn" onclick="armConfirm(this,'Delete this tea? Session history stays but shows as an unknown tea.',()=>deleteTea('${escapeJsArg(t.id)}'))">Delete tea</button></div>`:''}
      </form>
    </div>
  </div>`;
}
// WS1: reveal the "specifics" fold via DOM (not render) so in-progress inputs survive — the tea form
// reads its fields on submit, not per-keystroke, so a re-render here would wipe unsaved values.
function toggleSpecifics(row){
  const body = document.getElementById('teaSpecifics');
  if(!body) return;
  const hidden = getComputedStyle(body).display==='none'; // currently collapsed → open it
  body.style.display = hidden ? '' : 'none';
  const use = row.querySelector('.fold-caret use');
  if(use) use.setAttribute('href', hidden ? '#i-caret-up-hl' : '#i-caret-hl');
  row.setAttribute('aria-expanded', hidden?'true':'false');
}
function setTeaFormRating(v){
  document.getElementById('teaRatingInput').value = v;
  document.getElementById('teaRatingWrap').innerHTML = renderStarsInteractive(v,true,'setTeaFormRating');
}
function setPurchaseToday(btn){ const f=btn.closest('form'); if(f&&f.purchaseDate) f.purchaseDate.value = dayKey(new Date()); }
function setOpenedToday(btn){ const f=btn.closest('form'); if(f&&f.openedDate) f.openedDate.value = dayKey(new Date()); }
let _teaFormSaving = false;
async function submitTeaForm(e){
  e.preventDefault();
  if(_teaFormSaving) return;   // guard re-entrant double-submit (async gap before state push)
  _teaFormSaving = true;
  try {
  const f = e.target;
  const imageUrl = await resolveDraftImage();
  const data = {
    id: state.editingTea?.id || uid(),
    name: f.name.value.trim(),
    type: f.type.value,
    amountGrams: (function(){ var g=f.amountGrams.value?Number(f.amountGrams.value):0; if(f.inclPackaging&&f.inclPackaging.checked){ g=Math.max(0, g-(Number(f.packagingTare&&f.packagingTare.value)||0)); } return g; })(),
    rating: Number(document.getElementById('teaRatingInput').value)||0,
    harvestYear: f.harvestYear.value.trim(),
    harvestSeason: f.harvestSeason.value,
    origin: f.origin.value.trim(),
    cultivar: f.cultivar.value.trim(),
    source: f.source.value.trim(),
    costTotal: f.costTotal.value?Number(f.costTotal.value):0,
    costOriginalGrams: f.costOriginalGrams.value?Number(f.costOriginalGrams.value):0,
    brewGuide: f.brewGuide.value.trim(),
    description: f.description.value.trim(),
    isFavorite: f.isFavorite.checked,
    wouldRebuy: f.wouldRebuy.checked,
    purchaseType: state.editingTea ? state.editingTea.purchaseType : 'first',   // R184: isRepeat retired (rebuy = Restock, not a new row); legacy purchaseType kept on edit
    purchaseDate: f.purchaseDate.value || null,
    openedDate: f.openedDate.value || null,
    leafForm: f.leafForm.value || null,
    // v4.19 — F1: liquor was SILENTLY DROPPED here (data wrote 22 of teaFromDb's 23 keys; latent until
    // the picker could set tier 1). Gated through isLiquorKey so a tampered DOM can't persist junk;
    // '' (the cleared/default cell) → null → tier 2 by construction. §G asserts data ⊇ teaFromDb.
    liquor: (f.liquor && isLiquorKey(f.liquor.value)) ? f.liquor.value : null,
    image: imageUrl,
    purchaseLog: (state.editingTea && state.editingTea.purchaseLog) || [],   // R184: form never rebuilds the log, so preserve it on edit (else teaToDb wipes the JSONB); buy #1 seeded below
    dateAdded: state.editingTea?.dateAdded || new Date().toISOString()
  };
  // R184: seed buy #1 on a NEW add when a quantity was entered (an edit preserves via the literal above).
  if(!state.editingTea && data.amountGrams>0) data.purchaseLog = [{ grams:data.amountGrams, date:data.purchaseDate||dayKey(new Date()), cost:data.costTotal||0, opened:data.openedDate||null }];
  if(state.editingTea){
    const idx = state.teas.findIndex(t=>t.id===data.id);
    state.teas[idx] = data;
  } else {
    state.teas.push(data);
  }
  persistTea(data);
  state.teaFormOpen = false; state.editingTea = null; state.teaPrefill = null; state._draftImage = null;
  syncAchievements(true);
  render();
  } finally { _teaFormSaving = false; }
}
function deleteTea(id){
  state.teas = state.teas.filter(t=>t.id!==id);
  dropTea(id);
  state.teaFormOpen=false; state.editingTea=null; state.view='teas'; state.activeTeaId=null;
  render();
}

function openTeaDetail(id, from){ state.activeTeaId=id; state.teaDetailFrom = from||'teas'; state.view='tea-detail'; state.flavorView='bars'; state.teaMenuOpen=false; // WS4: bars is the default view on every visit — the toggle is deliberately NOT persisted (radar must never become sticky)
  saveView('tea-detail');   // v4.17: saveView is the ONE writer of view history + the tea-detail deep-link (was a hand-write here — the F24 two-writers trap)
  render(); }

// v3.62 freshness cue — one soft, observational line on tea detail (never on Home/the picker, never
// a badge/alarm). Requires a VALID year to reason about age (season is optional decoration); stays
// silent on garbage ("-", blank, out of range) and on styles with no clear age story. Direction by
// style: fresh greens are best young; whites/pu-erh deepen with age. All values here come from a
// numeric year, a whitelisted season, and a whitelisted style word — no raw user text is rendered.
const FRESH_SEASONS = { spring:'Spring', summer:'Summer', autumn:'Autumn', winter:'Winter' };
function freshnessYear(tea){ const y = parseInt(String(tea.harvestYear||'').trim(),10);
  const nowY = new Date().getFullYear(); return (y>=1980 && y<=nowY+1) ? y : null; }
function freshnessSeason(tea){ return FRESH_SEASONS[String(tea.harvestSeason||'').trim().toLowerCase()] || null; }
/* freshnessClass and freshnessStyleWord are DELETED in v3.98 (slice B3), not left dormant.
   freshnessClass was a second type→class writer sitting beside statusCategory — the exact drift the
   single-writer rule exists to prevent — and its name-regex heuristics (`/shincha|sencha|gyokuro/`)
   are what the catalog's curated `covers` join replaces. freshnessStyleWord only ever fed its copy.
   Both are subsumed by ttFreshness + freshnessReading; keeping them "just in case" would leave two
   answers to one question, which is the bug class this slice closes. */
/* Detail's ladder is GRADED where the shelf's tone is binary (§2). The four rungs, in order, and
   each says how much it knows rather than rounding up to a confident answer.
   v3.98 replaces the v3.62 cue: that one keyed on freshnessClass + harvest only, so it could not
   distinguish an opened pouch from a sealed one — the 5–10× variable the whole model exists for. */
function freshnessCueHTML(tea){
  const fr = freshnessReading(tea);
  if(!fr) return '';                                   // rung 4 — no clock, no block. Absent, not zero.
  const wrap = s => `<div class="fresh-cue">${s}</div>`;
  const opened = tea && tea.openedDate;
  const when = opened ? `Opened ${fmtElapsed(fr.days)}` : `${freshnessSeason(tea)?freshnessSeason(tea)+' ':''}${freshnessYear(tea)} harvest`;
  // rung 3 — elapsed only. The date is measured; only the WINDOW would be invented, so it is withheld.
  if(!fr.grounded) return wrap(escapeHtml(when) + (opened ? '' : ' — no window for this type yet.'));
  if(fr.ageing){
    // "Opened 2 yrs ago — 2 yrs rested" says one thing twice: a measured clock already carries the
    // elapsed figure in its own lead. Only a harvest lead ("2021 harvest") needs the years spelled out.
    const rested = (!opened && fr.days>=365) ? ` — ${escapeHtml(fmtElapsed(fr.days).replace(' ago',' rested'))}` : '';
    return wrap(escapeHtml(when) + rested + ' — this style deepens with age.');
  }
  const soft = fmtSoftDays(Math.max(fr.leftDays,0));
  // "about another 1 wk" is grammatical and reads badly; the singular gets a word, not a numeral.
  const span = soft.replace(/^~/,'');
  const body = fr.leftDays >= 7
    ? `at its best for about another ${span==='1 wk' ? 'week' : escapeHtml(span)}`
    : 'best enjoyed soon';
  // rung 2 — harvest-grounded. Say the assumption out loud rather than presenting an estimate as measured.
  const hedge = fr.measured ? '' : ' <span class="fresh-hedge">(assumes sealed until opened)</span>';
  return wrap(escapeHtml(when) + ' — ' + body + '.' + hedge);
}
// v3.62 rider — when the stock curve is absent only because there's no purchase date (but there IS a
// bought amount to draw from), offer a quiet way to complete it. Silent otherwise.
function sparklineHintHTML(tea){
  if(tea.purchaseDate || Number(tea.costOriginalGrams)<=0) return '';
  return `<div style="margin-top:8px;font-size:12px;color:var(--ink-soft);">Add a <span onclick="openTeaForm(teaById('${escapeJsArg(tea.id)}'))" style="color:var(--jade-deep);cursor:pointer;text-decoration:underline;">purchase date</span> to see the stock curve.</div>`;
}

/* ---------- WS4: "What you taste" — the honesty ladder ----------
   Aggregates a tea's recent flavour captures and renders only the shape the data has earned:
     sessionCount <= 2            → plain counted chips ("still early")
     sessionCount >= 3            → ranked bars (the everyday default)
     sessionCount >= 5 && >=4 terms → radar unlocks (bars stay default; radar/cloud are alt views)
   Never render a higher rung than the data earns. Every generated line is an observation of what
   happened across the steeps, never a verdict/score of the palate. Guarded by fixtures/flavor-ladder-test.js. */
const FLAVOR_PROFILE_RECENT = 6;                    // "last 6" sessions carrying flavour data
const FLAVOR_WARM = ['sweetness','honey','malty'];  // rendered amber on bars/radar (sweet/warm notes)

function distinctVocab(session){ // distinct vocabulary in a session — session-level primary + per-steep overlay (D2)
  const set=[];
  const add=arr=>(arr||[]).forEach(t=>{ t=String(t).toLowerCase(); if(isFlavorVocab(t) && !set.includes(t)) set.push(t); });
  add(session.tags);                               // D2: session-level tasting is the primary source (quick/cold-brew feed the profile too)
  (session.steeps||[]).forEach(st=>add(st.tags));  // per-steep overlay — guided mode + legacy per-steep data
  return set;
}
function teaFlavorProfile(teaId){
  const sessions = state.sessions.filter(s=>s.teaId===teaId).sort((a,b)=>new Date(b.date)-new Date(a.date));
  const recent=[];
  for(const s of sessions){ const vocab=distinctVocab(s); if(vocab.length){ recent.push({s,vocab}); if(recent.length>=FLAVOR_PROFILE_RECENT) break; } }
  const tally={}, positions={}; // positions[term] = steep indices (0-based) it appeared at, across recent sessions
  recent.forEach(({s,vocab})=>{
    vocab.forEach(t=>{ tally[t]=(tally[t]||0)+1; });
    (s.steeps||[]).forEach((st,i)=>(st.tags||[]).forEach(t=>{ t=String(t).toLowerCase(); if(isFlavorVocab(t)) (positions[t]=positions[t]||[]).push(i); }));
  });
  const terms = Object.keys(tally).sort((a,b)=> tally[b]-tally[a] || a.localeCompare(b));
  const sessionCount = recent.length, distinctTermCount = terms.length;
  const rung = (sessionCount>=5 && distinctTermCount>=4) ? 'radar' : (sessionCount>=3) ? 'bars' : (sessionCount>=1) ? 'chips' : 'none';
  return { sessionCount, distinctTermCount, tally, terms, positions, rung };
}
// One observation about how a note moves across steeps. Observation, never a verdict/score.
function flavorObservation(p){
  if(!p || !p.terms || !p.terms.length) return '';
  for(const t of p.terms){
    const pos=p.positions[t]||[]; if(pos.length<2) continue;
    const avg=pos.reduce((a,b)=>a+b,0)/pos.length;
    if(avg>=1.2) return `${capWord(flavorLabel(t))} climbs in later steeps`;
  }
  // D2: only a real per-steep SPREAD speaks (a note logged across distinct steeps), never a note's
  // ABSENCE in later steeps — the retired "peaks at steep 1, softens after" read fade from a lone-index tag.
  const top=p.terms[0], pos=p.positions[top]||[];
  return (pos.length>=2 && new Set(pos).size>=2) ? `${capWord(flavorLabel(top))} runs steady across the steeps` : '';
}
function setFlavorView(v){ state.flavorView=v; render(); } // not persisted — see openTeaDetail
function flavpChipsHTML(p){
  return `<div class="flavp-chips">${p.terms.map(t=>`<span class="flavp-chip">${escapeHtml(flavorLabel(t))} <span class="flavp-x mono">×${p.tally[t]}</span></span>`).join('')}</div>`;
}
function flavpBarsHTML(p){
  const max=Math.max.apply(null, p.terms.map(t=>p.tally[t]).concat([1]));
  return `<div class="flavp-bars">${p.terms.map(t=>{
    const w=Math.round(100*p.tally[t]/max), warm=FLAVOR_WARM.includes(t);
    return `<div class="flavp-bar"><div class="flavp-bar-top"><span>${escapeHtml(flavorLabel(t))}</span><span class="mono">${p.tally[t]}</span></div><div class="flavp-track"><div class="flavp-fill${warm?' warm':''}" style="width:${w}%"></div></div></div>`;
  }).join('')}</div>`;
}
function flavpRadarHTML(p){
  const terms=p.terms.slice(0,6), max=Math.max.apply(null, terms.map(t=>p.tally[t]).concat([1]));
  const cx=100, cy=100, R=64, n=terms.length;
  const pt=(i,rad)=>{ const a=-Math.PI/2 + i*2*Math.PI/n; return [cx+rad*Math.cos(a), cy+rad*Math.sin(a)]; };
  const rings=[R/3,2*R/3,R].map(r=>`<circle cx="${cx}" cy="${cy}" r="${r.toFixed(1)}" class="flavp-radar-ring"/>`).join('');
  const spokes=terms.map((t,i)=>{ const [x,y]=pt(i,R); return `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" class="flavp-radar-spoke"/>`; }).join('');
  const poly=terms.map((t,i)=>pt(i,R*p.tally[t]/max)).map(([x,y])=>`${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const dots=terms.map((t,i)=>{ const [x,y]=pt(i,R*p.tally[t]/max); return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.6" class="flavp-radar-dot"/>`; }).join('');
  const labels=terms.map((t,i)=>{ const [x,y]=pt(i,R+15); return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" class="flavp-radar-label" text-anchor="middle" dominant-baseline="middle">${escapeHtml(flavorLabel(t))}</text>`; }).join('');
  return `<div class="flavp-radar"><svg viewBox="0 0 200 200" role="img" aria-label="Flavour radar">${rings}${spokes}<polygon points="${poly}" class="flavp-radar-poly"/>${dots}${labels}</svg></div>`;
}
function flavpCloudHTML(p){
  const max=Math.max.apply(null, p.terms.map(t=>p.tally[t]).concat([1]));
  return `<div class="flavp-cloud">${p.terms.map(t=>`<span class="flavp-cloud-term" style="font-size:${(13+9*p.tally[t]/max).toFixed(1)}px">${escapeHtml(flavorLabel(t))}</span>`).join('')}</div>`;
}
function flavorProfileHTML(tea){
  const p = teaFlavorProfile(tea.id);
  if(p.rung==='none') return ''; // nothing captured — no empty state on the tea page
  if(p.rung==='chips'){
    return `<div class="flavp">
      <div class="flavp-head"><span class="flavp-title">What you taste</span><span class="flavp-count mono">${p.sessionCount} session${p.sessionCount===1?'':'s'}</span></div>
      ${flavpChipsHTML(p)}
      <div class="flavp-foot">Still early — a couple of notes so far. The picture fills in as you brew.</div>
    </div>`;
  }
  const radarUnlocked = p.rung==='radar';
  let view = state.flavorView||'bars';
  if(view==='radar' && !radarUnlocked) view='bars';
  const badge = radarUnlocked ? `<span class="flavp-badge unlocked">${icon('i-lock-hl',13)} unlocked</span>` : `<span class="flavp-badge">the everyday form</span>`;
  const toggle = `<div class="flavp-views">
     <button type="button" class="${view==='bars'?'on':''}" onclick="setFlavorView('bars')">bars</button>
     ${radarUnlocked?`<button type="button" class="${view==='radar'?'on':''}" onclick="setFlavorView('radar')">radar</button>`:''}
     <button type="button" class="${view==='cloud'?'on':''}" onclick="setFlavorView('cloud')">cloud</button>
   </div>`;
  const body = view==='radar' ? flavpRadarHTML(p) : view==='cloud' ? flavpCloudHTML(p) : flavpBarsHTML(p);
  const obs = flavorObservation(p);
  return `<div class="flavp">
    <div class="flavp-head"><span class="flavp-title">What you taste ${badge}</span><span class="flavp-count mono">last 6</span></div>
    ${toggle}
    ${body}
    ${obs?`<div class="flavp-foot">${escapeHtml(obs)}</div>`:''}
  </div>`;
}

/* #03 rev 3, slice B2. The detail splits into character (what the leaf is) and provenance (where it
   came from and what it cost). Empty fields are OMITTED, not dashed — the three-tier cascade the
   hand-off states for this board: user value → catalog default → show nothing. A missing origin means
   no origin row at all; nothing reads as broken.

   FRESHNESS STAYS PUT. freshnessCueHTML rides Harvest in this block, exactly where the shipped layout
   has it, and is untouched by this slice. Slice B3 replaces the READING (opened_date + catalog windows
   per SPEC-freshness-model.md §3 windows / §4 ageing) — not the position. Do not draw the board's
   confidence ladder here: it needs a column that does not exist until B3's migration, and drawing a
   ladder over absent data is what R81 was written for. */
function teaCharacterHTML(t){
  const cells = [];
  const cell = (label, val, extra) => { if(val) cells.push(`<div><div class="eyebrow">${label}</div><div>${escapeHtml(val)}</div>${extra||''}</div>`); };
  cell('Origin', t.origin);
  cell('Cultivar', t.cultivar);
  const harvest = [t.harvestSeason,t.harvestYear].filter(Boolean).join(' ');
  if(harvest) cells.push(`<div><div class="eyebrow">Harvest</div><div>${escapeHtml(harvest)}</div>${freshnessCueHTML(t)}</div>`);
  else if(freshnessCueHTML(t)) cells.push(`<div>${freshnessCueHTML(t)}</div>`);   // cue can ground on year alone
  if(!cells.length) return '';
  return `<div class="grid grid-2" style="margin-top:16px;">${cells.join('')}</div>`;
}
// "Where this came from" — vendor · cost · purchase. The photo is a LABEL: provenance evidence, never
// identity (identity is the type tint, R78), so it never leads and a photo-less tea is whole.
function teaProvenanceHTML(t, costPerSession){
  const rows = [];
  const row = (label, val) => { if(val) rows.push(`<div><div class="eyebrow">${label}</div><div>${val}</div></div>`); };
  row('Vendor', t.source ? escapeHtml(t.source) : '');
  const totals = purchaseTotals(t);
  const log = t.purchaseLog||[];
  // R184: purchase HISTORY from the log (oldest → newest); a legacy row (no log) keeps its single first-buy line.
  if(log.length) row(log.length>1?'Purchases':'Purchase', escapeHtml(log.map(e=>`${fmtStockG(Number(e.grams)||0)} · ${fmtDate(e.date)}${e.cost?` · ${currencyFmt(Number(e.cost)||0)}`:''}${e.opened?'':' · sealed'}`).join('  →  ')));
  else row('Purchase', `${t.purchaseType==='repeat'?'Repeat buy':'First time'}${t.purchaseDate?` · ${fmtDate(t.purchaseDate)}`:''}`);
  // Cost/gram: weighted across the log (R184), else the legacy cost_total / cost_original_grams.
  row('Cost / gram', totals ? currencyFmt(totals.perGram) : '');
  if(totals && !totals.legacy && totals.buys>1) row('Total spent', currencyFmt(totals.spend));
  row('Cost / session', costPerSession>0 ? currencyFmt(costPerSession) : '');
  // Soft-link: the same tea + vendor across harvests (read-only, never merged).
  const links = teaSoftLinks(t);
  const linkLine = links.length ? `<div class="tea-softlink mono">You come back to this. Also on your shelf: ${links.map(l=>`<button type="button" class="linklike" onclick="openTeaDetail('${escapeJsArg(l.id)}')">${escapeHtml(l.harvestYear||l.name||'other harvest')}</button>`).join(', ')}</div>` : '';
  if(!rows.length && !linkLine && !t.image) return '';
  // R177: returns bare content — viewTeaDetail's tdSec provides the "Where this came from" RULE header.
  // R180 D2/D3: the always-on photo-label caption moved behind an info mark, rewritten plain.
  return `<div class="grid grid-2" style="margin-top:8px;">${rows.join('')}</div>${linkLine}${t.image?`<div class="tea-label-note">${infoMark("This photo is the tea's label, not the tea itself. It shows where the tea came from.","About the photo")}</div>`:''}`;
}
// R173 (B2) — the palate connection: why THIS tea, for YOU. The tea's traits (type, roast) crossed with your
// favourites + highly-rated teas (behaviour × character; type/rating reliable now, flavour-grain later —
// never a claim it can't support). Anchors #reflect-why (the haven't-reached-for door lands here). Graceful:
// too little palate signal → '', and the curated character above it stands alone.
function teaWhyHTML(t){
  if(!t) return '';
  const mine = (state.teas||[]).filter(x=>x && x.id!==t.id && (x.isFavorite || Number(x.rating)>=4));
  if(mine.length < 2) return '';
  const roastOf = x => { const r = (typeof matchTeaType==='function') && matchTeaType(x.name); return r ? String(r.roast||'') : ''; };
  const bits = [];
  if(mine.filter(x=>x.type===t.type).length >= 2) bits.push(`You keep reaching for ${typeLabel(t.type).toLowerCase()} — this is one of them.`);
  if(/medium|heavy/.test(roastOf(t)) && mine.filter(x=>/medium|heavy/.test(roastOf(x))).length >= 2) bits.push(`Your favourites lean toward roasted teas, like this one.`);
  if(!bits.length) return '';
  return `<div id="reflect-why" class="td-why"><div class="eyebrow">Why you like it</div><div class="td-why-line">${escapeHtml(bits[0])}</div></div>`;
}
// R173 (B2) — the type-aware freshness reading (SPEC §7). Reads freshnessReading, which is type-aware via
// ttFreshness (incl. the R173 oolong-by-roast fix). Framing FITS the type: fade-fast → peak/urgency;
// age-friendly (white, pu-erh, roasted oolong) → holding/stable, never drink-fresh urgency. Anchors
// #reflect-freshness (the freshness door lands here). Age-friendly reads even without a date (statusLine precedent).
function teaFreshnessHTML(t){
  const fr = (typeof freshnessReading==='function') ? freshnessReading(t) : null;
  const win = (typeof ttFreshness==='function') ? ttFreshness(t) : null;
  if(!fr){
    if(win && win.ageing) return `<div class="td-fresh">This kind of tea ages rather than fades — no rush.</div>`;
    return '';
  }
  const since = fr.days!=null ? `${fmtSoftDays(fr.days).replace(/^~/,'')} since ${fr.measured?'opened':'harvested'}` : '';
  if(fr.ageing) return `<div class="td-fresh">Holding well — this kind of tea ages rather than fades.${since?` <span class="ins-cap">${since}.</span>`:''}</div>`;
  if(fr.grounded){
    if(fr.leftDays > fr.totalDays/2) return `<div class="td-fresh">At its peak — plenty of its fresh window still ahead.</div>`;
    if(fr.leftDays >= 7) return `<div class="td-fresh">Best within ${fmtSoftDays(fr.leftDays).replace(/^~/,'')} — a fresh-window tea; drink it while it's bright.</div>`;
    return `<div class="td-fresh">Best enjoyed soon — near the end of its fresh window.</div>`;
  }
  return since ? `<div class="td-fresh ins-cap">${since}.</div>` : '';
}
/* R55's offer, and the ONLY new affordance on this field — R56 rules out a suggestion list, so the
   input stays free text with no `list=`. The rule lives in `originOffer` (steep-passport.js, the
   Origins home per R66); this is just its card. Absent, not disabled, when there is nothing to
   offer: uncovered teas, region-tier teas and country CONFLICTS all render nothing at all, which is
   the point of the conflict rule — a catalog region naming a different country is not a weaker
   offer, it is not an offer. */
function originOfferHTML(tea){
  if(typeof originOffer!=='function') return '';
  const offer = originOffer(tea);
  if(!offer) return '';
  return `<div class="origin-offer">
    <span class="origin-offer-txt">The catalog places this in <strong>${escapeHtml(offer)}</strong>.</span>
    <button type="button" class="lib-chip" onclick="acceptOriginOffer(this,'${escapeJsArg(offer)}')">Use it</button>
  </div>`;
}
// Fills the field the user is looking at, and nothing else — no write, no save. The tea is committed
// by the form's own submit, so an accepted offer is still a decision the user makes.
function acceptOriginOffer(btn, value){
  const form = btn && btn.closest('form');
  const input = form && form.querySelector('input[name=origin]');
  if(!input) return;
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles:true }));   // marks the form dirty (WS1 guard)
  const row = btn.closest('.origin-offer');
  if(row) row.innerHTML = '<span class="origin-offer-txt">Origin set — save to keep it.</span>';
}

/* ---------- the liquor picker (contract 1, R39 · slice 3, v4.19) ----------
   The COLOUR row in the tea form: a preview swatch, a tier-honest source note, and an inline grid that
   writes a per-tea correction (tier 1). Modelled on acceptOriginOffer, NOT Borrow — it fills a hidden
   field and the FORM's own Save commits; a second self-committing control inside a form would make
   colour the only field that saves itself (#06 is the boarded SECONDARY path; tea detail, the primary,
   renders no swatch and is not this slice, F6). F2: the default follows the NAME via matchTeaType, never
   the type — picking a type changes the resolved liquor nothing; type only re-tints the tier-3 fallback.
   Open/close and selection are DOM-only, never render() — the form reads its fields on submit, so a
   re-render mid-edit wipes unsaved values (toggleSpecifics' constraint). Geometry is R121 (scale the
   lock): preview 26x34 (.social-tile family), cells 22x22 (#06's 40x50 4:5 not adopted). */
function liquorLabel(k){ return k.charAt(0).toUpperCase() + k.slice(1).replace(/-/g,' '); }
function liquorSourceText(tier, tea){
  if(tier===1) return 'your correction';
  if(tier===2){ const m = matchTeaType(tea.name||''); return 'catalog default · ' + (m ? m.display_name : ''); }
  return 'no colour yet — shows its type tint';
}
// v4.45: the ramp is 25 stops now, so the flat grid becomes a TWO-STEP drill-down (SPEC-colour-system.md
// "picker"). A DEFAULT/clear SHADE first (value '' → clears → tier 2 by construction), then six family
// rows; the family holding the current correction opens (its 44px shades shown), the others stay as their
// mini strip so the neighbourhood reads before committing. Every shade a real <button type=button>
// (keyboard-reachable, testable without synthesised pointer events; type=button so it never submits).
function liquorGridCells(tea){
  const type = tea.type || (TYPES[0] && TYPES[0].k) || 'green';
  const correction = tea.liquor || '';
  const defaultKey = liquorFor(Object.assign({}, tea, {liquor:null}));   // tier 2/3 — what clearing returns to
  const defAttr = defaultKey ? `class="liquor-shade" style="background:var(--liquor-${escapeHtml(defaultKey)});"`
                             : `class="liquor-shade t-${escapeHtml((type||'unknown').toLowerCase())}"`;
  const defCell = `<button type="button" ${defAttr} data-liquor="" aria-pressed="${correction===''?'true':'false'}" aria-label="Default — catalog colour or type tint" onclick="liquorSelect('')"></button>`;
  const openFam = (correction && liquorFamilyOf(correction)) ? liquorFamilyOf(correction).key : '';  // open the correction's family, else all closed
  const fams = LIQUOR_FAMILIES.map(f=>{
    const strip = f.keys.map(k=>`<span style="background:var(--liquor-${k});"></span>`).join('');
    const shades = f.keys.map(k=>`<button type="button" class="liquor-shade" style="background:var(--liquor-${k});" data-liquor="${k}" aria-pressed="${correction===k?'true':'false'}" aria-label="${escapeHtml(liquorLabel(k))}" onclick="liquorSelect('${escapeJsArg(k)}')"></button>`).join('');
    return `<div class="liquor-fam-group${f.key===openFam?' is-open':''}" data-fam="${escapeHtml(f.key)}">`
      + `<button type="button" class="liquor-fam" aria-expanded="${f.key===openFam?'true':'false'}" onclick="liquorOpenFamily('${escapeJsArg(f.key)}')"><span class="liquor-fam-name">${escapeHtml(f.name)}</span><span class="liquor-fam-strip">${strip}</span></button>`
      + `<div class="liquor-shades">${shades}</div></div>`;
  }).join('');
  return `<div class="liquor-defrow">${defCell}</div><div class="liquor-fams">${fams}</div>`;
}
function liquorRowHTML(tea){
  const type = tea.type || (TYPES[0] && TYPES[0].k) || 'green';
  const correction = tea.liquor || '';
  const resolved = liquorFor(tea);                                       // tier 1/2/3 (null → tier 3)
  const defaultKey = liquorFor(Object.assign({}, tea, {liquor:null}));
  const tier = (correction && isLiquorKey(correction)) ? 1 : (defaultKey ? 2 : 3);
  const prevAttr = resolved ? `class="liquor-preview" style="background:var(--liquor-${escapeHtml(resolved)});"`
                            : `class="liquor-preview t-${escapeHtml((type||'unknown').toLowerCase())}"`;
  return `<div class="field liquor-field" style="margin-top:12px;">
    <label>Colour</label>
    <div class="liquor-row">
      <span id="liquorPreview" ${prevAttr}></span>
      <div class="liquor-row-txt">
        <span class="liquor-source" id="liquorSource">${escapeHtml(liquorSourceText(tier, tea))}</span>
        <button type="button" class="liquor-open" id="liquorOpen" aria-expanded="false" aria-controls="liquorGrid" onclick="toggleLiquorGrid(this)">${resolved?'correct the colour ›':'set a colour ›'}</button>
      </div>
    </div>
    <div class="liquor-grid" id="liquorGrid" role="group" aria-label="Tea colour" style="display:none;">${liquorGridCells(tea)}</div>
    <input type="hidden" name="liquor" id="liquorInput" value="${escapeHtml(correction)}">
  </div>`;
}
function toggleLiquorGrid(btn){
  const g = document.getElementById('liquorGrid'); if(!g) return;
  const open = getComputedStyle(g).display==='none';
  g.style.display = open ? '' : 'none';           // '' → the .liquor-grid CSS default (flex); mirrors toggleSpecifics
  btn.setAttribute('aria-expanded', open?'true':'false');
}
// Fills the hidden field and marks the form dirty (WS1) — exactly acceptOriginOffer's dispatch, so a
// backdrop tap does not discard the choice silently. '' clears; submitTeaForm maps '' → null (tier 2).
function liquorSelect(key){
  const inp = document.getElementById('liquorInput'); if(!inp) return;
  inp.value = key;
  inp.dispatchEvent(new Event('input', { bubbles:true }));
  liquorRefresh();
}
// DOM-only repaint of preview + source note + default cell + aria-pressed, from the live form. Reads,
// never writes or dispatches, so it is safe on initial setup and on every name/type change.
function liquorRefresh(){
  const form = document.getElementById('teaForm'); if(!form) return;
  const inp = document.getElementById('liquorInput'); if(!inp) return;
  const name = (form.elements['name'].value||'').trim();
  const type = form.elements['type'].value;
  const correction = inp.value || '';
  const resolved = liquorFor({ name, type, liquor: correction });        // F2: resolution follows NAME, not type
  const defaultKey = liquorFor({ name, type, liquor: null });
  const prev = document.getElementById('liquorPreview');
  if(prev){ if(resolved){ prev.className='liquor-preview'; prev.style.background='var(--liquor-'+resolved+')'; }
            else { prev.className='liquor-preview t-'+((type||'unknown').toLowerCase()); prev.style.background=''; } }
  const tier = (correction && isLiquorKey(correction)) ? 1 : (defaultKey ? 2 : 3);
  const srcEl = document.getElementById('liquorSource'); if(srcEl) srcEl.textContent = liquorSourceText(tier, { name, type });
  const openEl = document.getElementById('liquorOpen'); if(openEl) openEl.textContent = resolved ? 'correct the colour ›' : 'set a colour ›';
  const grid = document.getElementById('liquorGrid');
  if(grid){
    const def = grid.querySelector('.liquor-shade[data-liquor=""]');
    if(def){ if(defaultKey){ def.className='liquor-shade'; def.style.background='var(--liquor-'+defaultKey+')'; }
             else { def.className='liquor-shade t-'+((type||'unknown').toLowerCase()); def.style.background=''; } }
    grid.querySelectorAll('.liquor-shade').forEach(c=>c.setAttribute('aria-pressed', (c.getAttribute('data-liquor')||'')===correction ? 'true':'false'));
  }
}
// v4.45: open one family, close the rest — DOM-only (the form reads its fields on submit, so a
// re-render mid-edit wipes unsaved values). Toggles .is-open (CSS shows/hides the 44px shades) and aria.
function liquorOpenFamily(fam){
  const grid = document.getElementById('liquorGrid'); if(!grid) return;
  grid.querySelectorAll('.liquor-fam-group').forEach(g=>{
    const on = g.getAttribute('data-fam')===fam;
    g.classList.toggle('is-open', on);
    const btn = g.querySelector('.liquor-fam'); if(btn) btn.setAttribute('aria-expanded', on?'true':'false');
  });
}
// Leaf-appearance picker (v4.45, SPEC-colour-system.md) — a FLAT strip (nine well-separated colours,
// no family step) plus a `mottled` MODIFIER cell (a split swatch, tracked separately from the colour).
// Built here as the READY control; c1's dry-leaf room renders it with a hidden #leafInput (+ #leafMottled)
// and reads them on save. DOM-only like the liquor picker, so a re-render never wipes an in-progress form.
function leafLabel(k){ return k.charAt(0).toUpperCase() + k.slice(1).replace(/-/g,' '); }
function leafGridCells(value){
  const cur = value || '';
  let cells = LEAF_KEYS.map(k=>`<button type="button" class="leaf-cell" style="background:var(--leaf-${k});" data-leaf="${k}" aria-pressed="${cur===k?'true':'false'}" aria-label="${escapeHtml(leafLabel(k))}" onclick="leafSelect('${escapeJsArg(k)}')"></button>`).join('');
  cells += `<button type="button" class="leaf-cell is-mottled" data-leaf="mottled" aria-pressed="false" aria-label="Mottled: variegated, over the dominant colour" onclick="leafToggleMottled(this)"></button>`;
  return cells;
}
function leafSelect(key){
  const inp = document.getElementById('leafInput'); if(!inp) return;   // rendered by c1; a no-op until then
  inp.value = key;
  inp.dispatchEvent(new Event('input', { bubbles:true }));
  const grid = document.getElementById('leafGrid');
  if(grid) grid.querySelectorAll('.leaf-cell').forEach(c=>c.setAttribute('aria-pressed', (c.getAttribute('data-leaf')||'')===key ? 'true':'false'));
}
function leafToggleMottled(btn){   // mottled is a MODIFIER (variegation, not a hue) — its own flag, not a LEAF_KEYS value
  const on = btn.getAttribute('aria-pressed')!=='true';
  btn.setAttribute('aria-pressed', on?'true':'false');
  const flag = document.getElementById('leafMottled'); if(flag){ flag.value = on?'1':''; flag.dispatchEvent(new Event('input',{bubbles:true})); }
}

/* The ⋯ menu (#03), enumerated to what actually exists. Pass-tea LANDS HERE in v4.02, on the R25
   pass record — it was omitted rather than disabled in v3.97 because its migration hadn't shipped.
   Go Deeper still appears only when the catalog covers the tea. */
function toggleTeaMenu(){ state.teaMenuOpen = !state.teaMenuOpen; render(); }
function teaMenuHTML(t){
  if(!state.teaMenuOpen) return '';
  const listed = (typeof wishHasTeaName==='function') && wishHasTeaName(t.name);
  const deeper = (typeof refCategoryFor==='function') && refCategoryFor(t)
    ? `<button class="hub-row" onclick="goDeeperFor('${escapeJsArg(t.id)}')">${icon('i-cup-hl',20)}<span>Go Deeper — reference entry</span></button>` : '';
  return `<div class="hub-scrim" onclick="toggleTeaMenu()"></div>
    <div class="hub-sheet" role="dialog" aria-label="Tea options">
      <div class="hub-grab"></div>
      <button class="hub-row" onclick="openPassSheet({teaId:'${escapeJsArg(t.id)}',teaName:'${escapeJsArg(t.name)}',teaType:'${escapeJsArg(t.type||'')}'})">${icon('i-friends-hl',20)}<span>Pass this tea to the circle</span></button>
      ${listed
        ? `<div class="hub-row" style="color:var(--ink-soft);">${icon('i-shopping-hl',20)}<span>On your list ✓</span></div>`
        : `<button class="hub-row" onclick="teaMenuAddWish('${escapeJsArg(t.id)}')">${icon('i-shopping-hl',20)}<span>Add to shopping list</span></button>`}
      ${deeper}
      <button class="hub-row" style="color:var(--red);" onclick="armConfirm(this,'Delete this tea? Session history stays but shows as an unknown tea.',()=>deleteTea('${escapeJsArg(t.id)}'))">${icon('i-settings-hl',20)}<span>Delete this tea</span></button>
    </div>`;
}
function teaMenuAddWish(id){ state.teaMenuOpen=false; addWishFromTea(id); }   // addWishFromTea renders

/* ===== Smart Restock (R184, retires R11): one entry + a purchase log. The log is
   [{grams, date, cost, opened}] — `date` is the buy, `opened` is when that bag was opened (null while
   stockpiled). Source of truth for cost + purchase history; cost_total/cost_original_grams are the
   legacy fallback for rows with no log. Single writers untouched: restock only SETS amountGrams
   (stockTier reads it) and openedDate (freshnessReading reads it). ===== */
function purchaseTotals(tea){                        // total spend + a true weighted cost/gram across all buys
  const log = tea.purchaseLog||[];
  if(!log.length) return Number(tea.costOriginalGrams)>0
    ? { spend:Number(tea.costTotal)||0, grams:Number(tea.costOriginalGrams)||0, perGram:(Number(tea.costTotal)||0)/Number(tea.costOriginalGrams), legacy:true, buys:0 } : null;
  let spend=0, grams=0;
  log.forEach(e=>{ spend+=Number(e.cost)||0; grams+=Number(e.grams)||0; });
  return { spend, grams, perGram: grams>0?spend/grams:0, legacy:false, buys:log.length };
}
function openedEvents(tea){ return (tea.purchaseLog||[]).filter(e=>e.opened).sort((a,b)=>new Date(a.opened)-new Date(b.opened)); }
function batchLifespanDays(tea){                      // the latest opened bag: days it has been open
  const ev=openedEvents(tea); if(!ev.length) return null;
  return Math.max(0, Math.round((Date.now()-new Date(ev[ev.length-1].opened).getTime())/86400000));
}
function unopenedBatch(tea){ return (tea.purchaseLog||[]).some(e=>!e.opened); }   // a sealed bag awaits opening
// Read-only soft-link: the same tea from the same vendor across harvest years (never merged).
function teaSoftLinks(tea){
  const key = t => String(t.name||'').trim().toLowerCase()+'|'+String(t.source||'').trim().toLowerCase();
  const k = key(tea);
  return (state.teas||[]).filter(t=>t.id!==tea.id && key(t)===k).sort((a,b)=>String(b.harvestYear||'').localeCompare(String(a.harvestYear||'')));
}
function openRestock(teaId){ state.restockFor = teaId; state.teaMenuOpen=false; render(); }
function closeRestock(){ state.restockFor = null; render(); }
function restockModal(){
  const t = teaById(state.restockFor); if(!t) return '';
  return `<div class="overlay" onclick="if(event.target===this) closeRestock()">
    <div class="modal" style="max-width:420px;">
      <div class="modal-head"><h2>Restock ${escapeHtml(t.name)}</h2><button class="close-x" onclick="closeRestock()">✕</button></div>
      <form onsubmit="commitRestock(event)">
        <div class="form-grid">
          <div class="field"><label>Grams bought</label><input type="number" name="grams" step="0.1" min="0" required inputmode="decimal" autofocus></div>
          <div class="field"><label>Date</label><input type="date" name="date" value="${dayKey(new Date())}"></div>
          <div class="field span2"><label>Cost (${currencySymbol()})</label><input type="number" name="cost" step="0.01" min="0" inputmode="decimal"></div>
        </div>
        <label class="checkrow" style="margin-top:12px;"><input type="checkbox" name="openingNow" checked> Opening this bag now <span class="mono" style="color:var(--ink-soft);">· resets the freshness clock</span></label>
        <div class="restock-newharvest mono">New harvest or crop year? <button type="button" class="linklike" onclick="closeRestock(); openTeaForm();">Add it as a separate tea →</button></div>
        <div style="display:flex;gap:8px;margin-top:18px;flex-wrap:wrap;"><button type="submit" class="btn btn-primary">Restock</button><button type="button" class="btn" onclick="closeRestock()">Cancel</button></div>
      </form>
    </div>
  </div>`;
}
let _restockSaving=false;
function commitRestock(ev){
  ev.preventDefault(); if(_restockSaving) return;
  const t = teaById(state.restockFor); if(!t) return;
  const f = ev.target;
  const grams = Number(f.grams.value)||0;
  if(!(grams>0)){ showToast('Enter the grams you bought.'); return; }
  const date = f.date.value || dayKey(new Date());
  const cost = f.cost.value ? Number(f.cost.value) : 0;
  const openingNow = f.openingNow.checked;
  _restockSaving = true;
  // Legacy tea with cost but no log yet: seed buy #1 from the existing fields so the log is honest forward.
  if(!(t.purchaseLog&&t.purchaseLog.length) && Number(t.costOriginalGrams)>0){
    t.purchaseLog = [{ grams:Number(t.costOriginalGrams), date:t.purchaseDate||date, cost:Number(t.costTotal)||0, opened:t.openedDate||null }];
  }
  t.purchaseLog = [...(t.purchaseLog||[]), { grams, date, cost, opened: openingNow?date:null }];
  t.amountGrams = (Number(t.amountGrams)||0) + grams;   // single STOCK writer: stockTier reads amountGrams
  if(openingNow) t.openedDate = date;                    // single FRESHNESS writer: freshnessReading reads openedDate
  t.wouldRebuy = true;                                   // you literally rebought it (the control still lets you unset it)
  persistTea(t);
  state.restockFor = null; _restockSaving = false; render();
  showToast(openingNow ? 'Restocked. Fresh clock started.' : 'Restocked. Bag stored, sealed.');
}
// A stockpiled bag is opened when the USER says so (the app can't detect it): open the oldest sealed
// batch and reset the entry's freshness clock to today. Single writers only.
function d_openBatch(teaId){
  const t = teaById(teaId); if(!t) return;
  const log = (t.purchaseLog||[]).slice();
  const i = log.findIndex(e=>!e.opened); if(i<0) return;
  const today = dayKey(new Date());
  log[i] = { ...log[i], opened: today };
  t.purchaseLog = log; t.openedDate = today;
  persistTea(t); render();
  showToast('Opened. Fresh clock started.');
}

function viewTeaDetail(){
  const t = teaById(state.activeTeaId);
  if(!t) return '<div class="empty">Tea not found.</div>';
  const mySessions = state.sessions.filter(s=>s.teaId===t.id).sort((a,b)=>new Date(b.date)-new Date(a.date));
  const _cpg = t.costOriginalGrams ? (t.costTotal/t.costOriginalGrams) : 0;
  const _avgG = mySessions.length ? mySessions.reduce((a,s)=>a+(Number(s.gramsUsed)||0),0)/mySessions.length : 0;
  const costPerSession = (_cpg>0 && _avgG>0) ? _cpg*_avgG : 0;
  // #27 F: the tier is cups, not grams — the honest math lives here (ledger surface), never on the shelf.
  const _cups = cupsLeft(t), _dose = teaAvgDose(t), _f1 = v => String(Math.round(v*10)/10);
  const cupsLine = (_cups!=null && _dose) ? `<div class="mono" style="font-size:12px;color:var(--ink-soft);">≈ ${_f1(_cups)} cup${_f1(_cups)==='1'?'':'s'} at your usual ${_f1(_dose)}g</div>` : '';
  // #03: the diary starts at the first cup — no count, no stars, no average until there is history.
  const histHTML = mySessions.length ? mySessions.map(s=>{
    const v = vesselById(s.vesselId);
    return `<div class="session-hist-row" style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
      <span style="display:flex;align-items:center;gap:8px;">${s.photoUrl?`<img src="${escapeHtml(s.photoUrl)}" alt="" class="session-thumb" loading="lazy">`:''}<span><strong>${fmtDateTime(s.date)}</strong> · ${v?escapeHtml(v.name):'—'} · ${brewCountLabel(s)} ${s.isColdBrew?'· cold brew':''} ${s.rating?'· '+renderStarsStatic(s.rating,false):''}</span></span>
      <button class="btn-ghost" onclick="openSessionEdit('${escapeJsArg(s.id)}')">edit</button>
    </div>`;
  }).join('') : `<div class="empty">The diary for this tea starts with your first cup.
      <div style="margin-top:8px;"><button class="btn-ghost" style="color:var(--jade-deep);text-decoration:underline;padding:0;" onclick="startSessionFor('${escapeJsArg(t.id)}')">Start the first ›</button></div>
    </div>`;

  // Back target honours where we came from — #20 adds 'sessions' (tapping a session's tea) alongside passport.
  const back = state.teaDetailFrom==='passport' ? {v:'passport',l:'passport'}
             : state.teaDetailFrom==='sessions' ? {v:'sessions',l:'sessions'}
             : {v:'teas',l:'teas'};
  // R177 — the tea page re-dressed to the spine: identity → BAND masthead, the blocks → RULE sections
  // (grouped: Character = leaf facts + flavour + description; Brewing = guide + advice, de-carded), one
  // clay SLAB (Start session). Reflection-first order: Character leads, On hand second. Each section
  // renders only WITH content (no empty headers). B2 inserts #reflect-why into secChar (after the
  // character line) and a Freshness section (#reflect-freshness) after Brewing — structure left ready.
  const onHandBody = `<div style="font-size:14px;${isRunningLow(t)?'color:var(--red);font-weight:600;':''}">${Number(t.amountGrams).toFixed(1)}g</div>${cupsLine}${forecastLine(t)}${inventorySparkline(t) || sparklineHintHTML(t)}<div class="restock-row"><button class="btn-ghost" onclick="openRestock('${escapeJsArg(t.id)}')">Restock</button>${unopenedBatch(t)?`<button class="btn-ghost restock-open" onclick="d_openBatch('${escapeJsArg(t.id)}')">Newest bag still sealed — open it?</button>`:''}</div>`;
  const descBody = t.description?`<div style="margin-top:14px;font-size:13.5px;white-space:pre-wrap;">${escapeHtml(t.description)}</div>`:'';
  const secChar = [teaCharacterHTML(t), teaWhyHTML(t), flavorProfileHTML(t), descBody].filter(Boolean).join('');   // B2: #reflect-why after the character line
  const secBrew = [t.brewGuide?savedBrewHTML(t):suggestedBrewHTML(t), teaBrewAdviceHTML(t)].filter(Boolean).join('');
  const secProv = teaProvenanceHTML(t, costPerSession);
  const tdSec = (title, body, id) => body ? `<div class="td-sec"${id?` id="${id}"`:''}><div class="td-sechead rule-head"><span class="eyebrow">${title}</span></div>${body}</div>` : '';
  return `
    <div class="detail-head">
      <button class="detail-back" onclick="goView('${back.v}')">← Back to ${back.l}</button>
      <button class="tea-more" onclick="toggleTeaMenu()" aria-label="More" aria-expanded="${state.teaMenuOpen?'true':'false'}">⋯</button>
    </div>
    ${teaMenuHTML(t)}
    <div class="band td-band">
      ${swatchAttr('td-swatch', liquorFor(t), t.type, true)}
      ${t.image?`<div class="td-thumb" style="background-image:url(${escapeHtml(t.image)});"></div>`:''}
      <div class="td-band-main">
        <div class="td-pills">
          <span class="pill t-${escapeHtml(t.type)}">${escapeHtml(typeLabel(t.type))}</span>
          ${t.isFavorite?`<span class="pill" style="background:var(--jade-pale);color:var(--jade-deep);">${favLeaf(12)} favourite</span>`:''}
          ${t.wouldRebuy?'<span class="pill" style="background:var(--jade-pale);color:var(--jade-deep);">would rebuy</span>':''}
        </div>
        <h2 class="td-title">${escapeHtml(t.name)}</h2>
        ${renderStarsStatic(Number(t.rating)||0,true)}
      </div>
    </div>
    ${tdSec('Character', secChar)}
    ${tdSec('On hand', onHandBody)}
    ${tdSec('Brewing', secBrew)}
    ${tdSec('Freshness', teaFreshnessHTML(t), 'reflect-freshness')}
    ${tdSec('Where this came from', secProv)}
    <div class="td-slab-row">
      <button class="btn-clay" onclick="startSessionFor('${t.id}')">Start session</button>
      <button class="btn-ghost" onclick="openTeaForm(teaById('${t.id}'))">Edit</button>
    </div>
    ${tdSec('Your diary', histHTML)}
  `;
}

// The saved-guide counterpart to suggestedBrewHTML (v3.51): teas WITH a brewGuide render the same
// structured card — temp / rinse / first steeps — parsed from the guide via effectiveGuideSchedule,
// with the raw guide text kept underneath (nothing the user wrote disappears). When the guide is
// temp-only (e.g. "80-90°C") the steeps shown are the leaf-form schedule the timer would actually
// run, and the footnote says so — generated times are never passed off as the user's own. If brew
// advice is off, or nothing parses, fall back to the plain "How to brew" text block (pre-v3.51 look).
function savedBrewHTML(tea){
  const plain = `<div style="margin-top:14px;"><div class="eyebrow">How to brew</div><div style="font-size:13.5px;white-space:pre-wrap;">${escapeHtml(tea.brewGuide)}</div></div>`;
  if(state.settings.brewAdvice===false) return plain;
  const sched = effectiveGuideSchedule(tea, true);
  if(!sched || (sched.tempC==null && !(sched.times&&sched.times.length))) return plain;
  const rows = [];
  if(sched.tempC!=null) rows.push(`<div><div class="eyebrow">Temp</div><div>${cToDisplay(sched.tempC)}${tempUnitLabel()}</div></div>`);
  if(sched.rinseSeconds!=null) rows.push(`<div><div class="eyebrow">Rinse</div><div>${sched.rinseSeconds}s</div></div>`);
  if(sched.times && sched.times.length) rows.push(`<div><div class="eyebrow">First steeps</div><div class="mono">${sched.times.slice(0,6).map(fmtSecShort).join(' / ')}</div></div>`);
  // R180 D2/D3: the always-on "where the times come from" caption moved behind an info mark by the title, plain.
  const note = sched.generated
    ? 'These steep times come from the leaf type. The session timer uses them.'
    : 'Parsed from your brew guide. The session timer uses it.';
  return `
    <div style="margin-top:10px;">
      <div class="eyebrow">Brew guide · saved${infoMark(note,'Where these times come from')}</div>
      <div class="grid grid-3" style="margin-top:8px;">${rows.join('')}</div>
      <div style="font-size:12.5px;white-space:pre-wrap;margin-top:10px;">${escapeHtml(tea.brewGuide)}</div>
      ${goDeeperLinkHTML(tea)}
    </div>`;
}
// R51's contextual entry, drawn ONLY where the catalog covers the tea. For the eight uncovered teas
// there is no row at all — absent, not disabled — the same honesty #03 gives the origin link.
function goDeeperLinkHTML(tea){
  if(typeof refCategoryFor!=='function' || !refCategoryFor(tea)) return '';
  return `<div style="margin-top:10px;"><button class="btn-ghost" style="padding:0;color:var(--jade-deep);text-decoration:underline;font-size:12.5px;" onclick="goDeeperFor('${escapeJsArg(tea.id)}')">Why → Go Deeper</button></div>`;
}

// A "Suggested brew" card for teas with no saved brewGuide — the same schedule the session timer
// would generate (effectiveGuideSchedule's KB/leaf-form path), surfaced as a clearly-marked
// suggestion with a save-as-guide action. Gated on the brew-advice opt-out, like the in-session
// generated schedule. Temp/ratio come from the KB when a style matched; a leaf-form-only fallback
// shows just the steeps. Never shown when a real guide exists (that path renders "How to brew").
function suggestedBrewHTML(tea){
  if(!tea || tea.brewGuide) return '';
  if(state.settings.brewAdvice===false) return '';
  const sched = effectiveGuideSchedule(tea, true);
  if(!sched || !sched.times || !sched.times.length) return '';
  const kb = (typeof kbResolve==='function') ? kbResolve([tea.name,tea.cultivar,tea.origin].filter(Boolean).join(' ')) : null;
  const tempC = sched.tempC!=null ? sched.tempC : (kb && kb.tempC!=null ? kb.tempC : null);
  const ratio = (kb && Number(kb.ratio)>0) ? Number(kb.ratio) : null;
  // Source label: a matched KB style names itself ("dancong style"); else the inferred leaf-form
  // family, flagged "· auto" (same marker leafFormLabel uses when the form wasn't set explicitly).
  const explicit = tea.leafForm && LEAF_PROFILES[tea.leafForm];
  const source = (kb && kb.style)
    ? `${kb.style.replace(/_/g,' ')} style`
    : `${LEAF_PROFILES[sched.form].label} family${explicit?'':' · auto'}`;
  const rows = [];
  if(tempC!=null) rows.push(`<div><div class="eyebrow">Temp</div><div>${cToDisplay(tempC)}${tempUnitLabel()}</div></div>`);
  if(ratio!=null) rows.push(`<div><div class="eyebrow">Leaf</div><div>${ratio} g / 100 ml</div></div>`);
  rows.push(`<div><div class="eyebrow">First steeps</div><div class="mono">${sched.times.slice(0,6).map(fmtSecShort).join(' / ')}</div></div>`);
  // R180 D2/D3: the always-on suggestion caption moved behind an info mark by the title, rewritten plain.
  const suggestNote = `A starting point from ${kb&&kb.style?'the tea knowledge base':'the leaf type'}, not a saved guide. The session timer uses these times until you save your own.`;
  return `
    <div style="margin-top:10px;">
      <div class="eyebrow">Suggested brew · ${escapeHtml(source)}${infoMark(suggestNote,'Where this suggestion comes from')}</div>
      <div class="grid grid-3" style="margin-top:8px;">${rows.join('')}</div>
      <div style="margin-top:10px;display:flex;gap:8px;flex-wrap:wrap;"><button class="btn" onclick="saveSuggestedGuide('${tea.id}')">Save as brew guide</button>${borrowButtonHTML(tea)}</div>
      ${borrowSourceHTML(tea)}${goDeeperLinkHTML(tea)}
    </div>`;
}
// v4 (R176) — the fuller "why this, for this tea" on the tea page: the tea's most recent feedback'd cup →
// its representative character → the context-gated diagnosis (lever + mechanism), experiment-framed. A
// whole-cup reading (infusionRole 'session'), so the opening shape-gate never fires here. Reads the raw
// stored feedback; no learned aggregation (that is Stage 2). Absent when brew-advice is off, when there is
// no feedback yet, or when the last cup was 'good' (nothing to change).
function teaBrewAdviceHTML(tea){
  if(!tea || state.settings.brewAdvice===false || typeof diagnoseFeedback!=='function') return '';
  const has = (typeof sessionHasFeedback==='function') ? sessionHasFeedback : (s=>!!s.feedback || (s.steeps||[]).some(st=>st.feedback));
  const sess = (state.sessions||[]).filter(s=>s.teaId===tea.id && !s.isColdBrew && has(s))
    .sort((a,b)=>new Date(b.date)-new Date(a.date));
  if(!sess.length) return '';
  const s = sess[0];
  const ch = feedbackSignalOf(s);
  if(!ch || ch==='good') return '';
  const ves = vesselById(s.vesselId);
  const style = (typeof brewMethodFor==='function') ? brewMethodFor(s.brewStyle, ves&&ves.capacityMl) : s.brewStyle;
  const st = (s.steeps||[]).find(x=>x.tempC!=null && x.tempC!=='');
  const curTempC = st ? Number(st.tempC) : ((s.schedule&&s.schedule.tempC!=null)?s.schedule.tempC:null);
  const waterOK = !!(String(s.waterType||'').trim() || (s.waterTDS!=='' && s.waterTDS!=null));
  const dg = diagnoseFeedback(ch, { type:tea.type, style, infusionRole:'session', curTempC, waterOK });
  if(!dg) return '';
  const label = (typeof STEEP_FB_LABELS!=='undefined' && STEEP_FB_LABELS[ch]) || ch;
  const core = /^extend/i.test(dg.dir) ? (dg.dir.charAt(0).toUpperCase()+dg.dir.slice(1)) : ('Next time, try '+dg.dir);
  const suggestion = (dg.waterCaveat ? ('Could be your water or stale leaf — but if not, '+core.charAt(0).toLowerCase()+core.slice(1)) : core) + '.';
  return `<div style="margin-top:14px;">
    <div class="eyebrow">Your last cup</div>
    <div style="font-size:13px;margin-top:6px;">Ran <strong>${escapeHtml(label)}</strong>. ${escapeHtml(suggestion)}</div>
    <div style="font-size:12px;color:var(--ink-soft);margin-top:4px;">${escapeHtml(dg.why)}</div>
  </div>`;
}
/* Borrow from Go Deeper (R51, slice B2) — the same gesture as "Save as brew guide" against the
   CATALOG instead of the KB. Both can match one tea and disagree on temp, which is why the line
   below names which rung answered: a user who borrows and then sees a different number has an
   explanation rather than a mystery. Drawn only when matchTeaType covers the tea (13 of 21 today),
   and only from the no-guide card — the guard against overwriting a saved guide is kept, not
   widened (borrowGuideFrom returns early on tea.brewGuide, exactly as saveSuggestedGuide does). */
function borrowButtonHTML(tea){
  if(typeof refCategoryFor!=='function' || !refCategoryFor(tea)) return '';
  return `<button class="btn" onclick="borrowGuideFrom('${escapeJsArg(tea.id)}')">Borrow from Go Deeper</button>`;
}
function borrowSourceHTML(tea){
  if(typeof refCategoryFor!=='function' || !refCategoryFor(tea)) return '';
  return `<div style="font-size:11.5px;color:var(--ink-soft);margin-top:8px;">Borrowing takes the temperature and leaf ratio from the catalog — <b>${escapeHtml(refEntryLabel(tea))}</b> — over the steep times above. A starting point, not a rule.</div>`;
}
/* R51's contextual actions. They live HERE, not in steep-reference.js, because they act on a tea:
   goDeeperFor navigates, borrowGuideFrom writes. The reference module is read-only by contract, and
   section A of fixtures/reference-test.js enforces it — it caught the first draft of borrowGuideFrom
   sitting in the wrong file, one slice after that guard was written. */
function goDeeperFor(teaId){
  const tea = teaById(teaId);
  const cat = (typeof refCategoryFor==='function') ? refCategoryFor(tea) : null;
  if(!cat) return;                                  // never a dead tap: uncovered teas draw no control
  goDeeperCat(cat);
}
/* The navigation half, split out in v4.02 so a passed cup can reach the same entry. A pass is not a
   tea — it has no library row to look up — so it resolves its category from the snapshot name and
   arrives here. One writer for "open the reference at this category", two callers. */
function goDeeperCat(cat){
  if(!cat) return;
  state.refOpen = cat; state.refSearch = '';
  state.teaMenuOpen = false; state.sessionMenuOpen = false;
  setTeaSeg('deeper');                              // setTeaSeg renders
}
/* Borrow from Go Deeper — the same GESTURE as saveSuggestedGuide below, against a different SOURCE:
   the catalog's typical_brew rather than the KB. Three things hold it honest:
     · the catalog carries NO per-step times, so the schedule still comes from generateFormTimes via
       effectiveGuideSchedule — a borrow is temp + ratio over a generated schedule, never invented steps;
     · it writes through scheduleToGuideText, the one parser-safe emitter, so the guide round-trips
       through parseBrewGuide (fixtures/brew-roundtrip-test.js owns that contract);
     · the no-guide guard is KEPT, not relaxed. Letting a borrow replace a guide the user wrote is a
       confirm dialog and a deliberate decision, not a silently widened condition — so this returns
       early on tea.brewGuide exactly as saveSuggestedGuide does.
   Where both the KB and the catalog match one tea they can disagree on temp; the catalog wins here
   because the user asked for the catalog by name, and borrowSourceHTML says which row answered. */
function borrowGuideFrom(teaId){
  const tea = teaById(teaId); if(!tea || tea.brewGuide) return;
  const row = matchTeaType(tea.name); if(!row) return;
  const sched = effectiveGuideSchedule(tea, true);
  if(!sched || !sched.times || !sched.times.length) return;
  const b = row.typical_brew || {};
  const tempC = (b.temp_c && b.temp_c.length) ? b.temp_c[0] : sched.tempC;
  let text = scheduleToGuideText({ ...sched, tempC });
  if(Number(b.g_per_100ml) > 0) text += (text?', ':'') + b.g_per_100ml + 'g/100ml';
  tea.brewGuide = text;
  persistTea(tea);
  showToast('Borrowed from “'+row.display_name+'”');
  render();
}
// Write the current suggestion into the tea's brewGuide (free text), so it becomes the real guide
// the timer + advice read from — e.g. "90°C, 25s / 18s / 30s, 4g/100ml". Uses scheduleToGuideText
// (parser-safe raw-second times, guaranteed round-trip) with the KB temp folded in, then appends the
// KB ratio (parseBrewGuide strips the grams token on re-read, so it stays informational).
function saveSuggestedGuide(teaId){
  const tea = teaById(teaId); if(!tea || tea.brewGuide) return;
  const sched = effectiveGuideSchedule(tea, true);
  if(!sched || !sched.times || !sched.times.length) return;
  const kb = (typeof kbResolve==='function') ? kbResolve([tea.name,tea.cultivar,tea.origin].filter(Boolean).join(' ')) : null;
  const tempC = sched.tempC!=null ? sched.tempC : (kb && kb.tempC!=null ? kb.tempC : null);
  let text = scheduleToGuideText({ ...sched, tempC });
  if(kb && Number(kb.ratio)>0) text += (text?', ':'') + kb.ratio + 'g/100ml';
  tea.brewGuide = text;
  persistTea(tea);
  showToast('Saved brew guide for “'+tea.name+'”');
  render();
}

/* ================= FRIENDS (social) ================= */
