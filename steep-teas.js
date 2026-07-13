/* ============ WS5 shelf status line (the core rule) ============
   ONE status line, same slot + weight on every card — only the words + tone change, by type.
   tone ∈ { low(clay·sorts top) · few(ink-soft·no sort, #18) · freshness(ink-soft) · plenty(jade) ·
   ages(jade) }. Computed from type + amount + a harvest-grounded freshness window (reuses lowStockG
   + freshnessYear/Season) — never free text. #18 made quantity session-aware: cups left = on-hand ÷
   this tea's average logged dose; the gram floor only decides when a tea has no brewing history. Design note (2026-07-11): the mock renders oolong as "plenty", not "ages", so
   the ages bucket is white + pu'er only here (the README prose grouped oolong in — resolved toward
   the mock + the app's existing freshnessClass, which never calls oolong 'ages'). Flagged at pause. */
const FRESH_WINDOW_MONTHS = 12;   // a delicate green stays "best within" ~a year of harvest
const FRESH_NEAR_WEEKS = 26;      // only show a countdown once ≤ ~6 months of that window remain
function statusCategory(tea){
  const type = (tea.type||'').toLowerCase();
  if(type==='white' || type==='puerh') return 'ages';       // age is a feature — no clock
  if(type==='green' || type==='yellow') return 'delicate';  // time-to-drink leaf
  return 'neutral';                                          // oolong, black, herbal, unknown
}
function fmtStockG(g){ g = Number(g)||0; return (Math.round(g)===g ? String(g) : g.toFixed(1)) + 'g'; }
// Weeks left in a delicate tea's freshness window, or null when it can't be grounded in a real harvest.
function freshnessWeeksLeft(tea){
  const y = freshnessYear(tea); if(!y) return null;
  const seasonMonth = { spring:3, summer:6, autumn:9, fall:9, winter:0 };
  const s = String(tea.harvestSeason||'').trim().toLowerCase();
  const bestBy = new Date(y, (s in seasonMonth) ? seasonMonth[s] : 5, 1); // no season → mid-year anchor
  bestBy.setMonth(bestBy.getMonth() + FRESH_WINDOW_MONTHS);
  return Math.round((bestBy - Date.now()) / (7*86400000));
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
  if(amt<=0) return 'out';
  const cups = cupsLeft(tea);
  if(cups!=null) return cups<2 ? 'low' : (cups<5 ? 'few' : 'plenty');
  return amt<lowStockG() ? 'low' : 'plenty';
}
function statusLine(tea){
  const amt = Number(tea.amountGrams)||0;
  const g = fmtStockG(amt);
  const tier = stockTier(tea);
  if(tier==='low') return { text:`${g} · running low`, tone:'low' };
  // quantity wins while remarkable: 'few' outranks ages + the freshness countdown — an
  // "ages well" or "best within N wks" on a nearly-empty tin hides the #18 lie.
  if(tier==='few') return { text:`${g} · a few cups left`, tone:'few' };
  const cat = statusCategory(tea);
  if(cat==='ages'){
    const phrase = (tea.type||'').toLowerCase()==='puerh' ? 'ages gracefully' : 'ages well';
    return { text:`${g} · ${phrase}`, tone:'ages' };
  }
  if(cat==='delicate'){
    const wk = freshnessWeeksLeft(tea);
    if(wk!=null && wk<=FRESH_NEAR_WEEKS)
      return wk>=1 ? { text:`${g} · best within ${wk} wk${wk===1?'':'s'}`, tone:'freshness' }
                   : { text:`${g} · best enjoyed soon`, tone:'freshness' };
    return { text:`${g} · fresh, plenty`, tone:'plenty' };
  }
  return { text:`${g} · plenty`, tone:'plenty' };
}
const STATUS_TONE_COLOR = { low:'var(--clay)', few:'var(--ink-soft)', freshness:'var(--ink-soft)', plenty:'var(--jade)', ages:'var(--jade)' };
// running-low teas float to the top of the shelf in any density/filter (WS5 rule) — but only
// under the DEFAULT 'type' sort since v3.84 (#23 F1): an explicit sort keeps the engine's order.
// THE low predicate — every surface ("Low" chip, header count, cost card, restock pulls)
// derives from it so no two surfaces can disagree (#13 bug class). 'few' gets NO sort effect.
function isRunningLow(tea){ return stockTier(tea)==='low'; }
// Home "Running low" card membership (v3.82, #18 correction): LOW only — a 'few' tea beside a
// ~months forecast puts the cups clock and the days clock under one headline; few's home is the
// shelf status line. Favourites & rebuys scope unchanged.
function restockCandidate(tea){ return !!(tea.isFavorite||tea.wouldRebuy) && stockTier(tea)==='low'; }
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
      ${fin ? '<span class="shelf-status" style="color:var(--ink-soft)">finished</span>' : statusLineHTML(t)}
      ${rebuy}
    </div>
  </div>`;
}
// Row (density = rows) — thumbnail + name + [type pill · status] + caret.
function shelfRowHTML(t){
  const fin = isTeaFinished(t);
  return `<div class="shelf-row${fin?' tea-finished':''}" onclick="openTeaDetail('${escapeJsArg(t.id)}')">
    ${shelfPhoto(t,'thumb')}
    <div class="shelf-row-mid">
      <div class="shelf-name">${escapeHtml(t.name)}</div>
      <div class="shelf-row-meta">${shelfPill(t)}${fin ? '<span class="shelf-status" style="color:var(--ink-soft)">finished</span>' : statusLineHTML(t)}</div>
    </div>
    <span class="shelf-caret">${icon('i-caret-hl',20)}</span>
  </div>`;
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
function viewTeas(){
  // Teas + Vessels live under one tab (v3.46) — a segmented control switches between them
  // (following the v3.18 vendor-manager precedent of folding a surface into Teas).
  const seg = (state.teaSeg==='vessels') ? 'vessels' : 'teas';
  const segControl = `<div style="display:flex;gap:8px;margin-bottom:14px;">
    <button class="lib-chip ${seg==='teas'?'active':''}" onclick="setTeaSeg('teas')">Teas</button>
    <button class="lib-chip ${seg==='vessels'?'active':''}" onclick="setTeaSeg('vessels')">Vessels</button>
  </div>`;
  if(seg==='vessels') return `${segControl}${viewVessels()}`;   // viewVessels lives in steep-sessions.js
  const F = state.teaFilter;
  const vendors = distinctVendors();
  const density = teaDensity();
  // running-low count for the header line (WS5; tier-aware since #18).
  const lowCount = state.teas.filter(t=>isRunningLow(t)).length;
  // Filter chips: All · <types you own, in canonical order> · Low · Favs. Cleaner than the old
  // sort/vendor dropdowns (those are dropped from the shelf; vendor rename stays under "Edit vendors").
  const typesPresent = [...new Set(state.teas.map(t=>(t.type||'').toLowerCase()).filter(Boolean))].sort((a,b)=>typeRank(a)-typeRank(b));
  const noFilter = !F.type && !F.lowStock && !F.favorite;
  const chips = state.teas.length ? `
    <div class="chip-row">
      <button class="lib-chip ${noFilter?'active':''}" onclick="clearTeaFilters()">All</button>
      ${typesPresent.map(ty=>`<button class="lib-chip ${F.type===ty?'active':''}" onclick="toggleTypeFilter('${ty}')">${escapeHtml(typeLabel(ty))}</button>`).join('')}
      <button class="lib-chip ${F.lowStock?'active':''}" onclick="toggleLowStockFilter()">Low</button>
      <button class="lib-chip ${F.favorite?'active':''}" onclick="toggleFavoriteFilter()">${favLeaf(13)} Favs</button>
      ${vendors.length ? `<button class="lib-chip ${state.vendorsOpen?'active':''}" onclick="toggleVendors()">${state.vendorsOpen?'✕ Vendors':'Edit vendors'}</button>` : ''}
    </div>` : '';
  const densityToggle = state.teas.length ? `<div class="density-toggle" role="group" aria-label="Density">
      <button class="density-seg ${density==='rows'?'active':''}" onclick="setTeaDensity('rows')" aria-label="List view">${icon('i-rows-hl',16)}</button>
      <button class="density-seg ${density==='grid'?'active':''}" onclick="setTeaDensity('grid')" aria-label="Grid view">${icon('i-grid-hl',16)}</button>
    </div>` : '';
  // v3.84 (#23 F1): the 7 engine sorts return as one compact styled select on the count row —
  // outside #teaShelf, so search keystrokes never touch it; `selected` re-derives from state.teaSort
  // on every render, so a mid-session render() can't snap the label back to Type while the order
  // stays sorted. Session-scoped on purpose (resets on reload); persistence is an R3 question.
  const SORT_OPTS = [['type','Type'],['newest','Recently added'],['oldest','Oldest first'],['name','Name A–Z'],['stock-high','Most stock'],['stock-low','Least stock'],['rating','Highest rated']];
  const sortSelect = state.teas.length ? `<div class="lib-sort">
      <select onchange="setTeaSort(this.value)" aria-label="Sort teas">${SORT_OPTS.map(([k,l])=>`<option value="${k}" ${state.teaSort===k?'selected':''}>${l}</option>`).join('')}</select>
      <span class="lib-sort-caret">${icon('i-caret-hl',14)}</span>
    </div>` : '';
  // #19 quiet hairline search — sits below the chips (chips stay the primary WS5 control). The ✕ is
  // always in the DOM, hidden when empty, so onTeaSearchInput can toggle it without a full re-render.
  const searchRow = state.teas.length ? `
    <div class="lib-search">
      <input id="teaSearchInput" type="text" placeholder="Search teas…" value="${escapeHtml(state.teaSearch)}" oninput="onTeaSearchInput(this.value)" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Search teas">
      <button id="teaSearchX" class="lib-search-x" onclick="clearTeaSearch()" aria-label="Clear search" style="${state.teaSearch?'':'display:none;'}">✕</button>
    </div>` : '';
  return `
    ${segControl}
    <div class="lib-head">
      <h2 style="font-family:var(--font-display);font-size:24px;margin:0;">My teas</h2>
      <div class="lib-head-actions">${densityToggle}
        <button class="btn-add" onclick="openTeaForm()">${icon('i-plus-hl',14)} Add</button>
      </div>
    </div>
    <div class="lib-countrow">
      <div class="mono lib-count">${state.teas.length} tea${state.teas.length===1?'':'s'} · ${state.teas.filter(t=>Number(t.amountGrams)>0).length} in stock${lowCount?` · <span style="color:var(--clay);">${lowCount} running low</span>`:''}</div>
      ${sortSelect}
    </div>
    ${chips}
    ${searchRow}
    ${state.vendorsOpen && vendors.length ? vendorManagerHTML() : ''}
    <div id="teaShelf">${teaShelfHTML()}</div>
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
function setTeaSeg(seg){ state.teaSeg = (seg==='vessels') ? 'vessels' : 'teas'; state.view='teas'; render(); }
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
}
function dismissKbSuggest(){
  _kbSuggestDismissed = true; _kbSuggest = null;
  const box = document.getElementById('teaKbSuggest'); if(box) box.innerHTML='';
}
function closeTeaForm(){ state.teaFormOpen=false; state.editingTea=null; state.teaPrefill=null; state._draftImage=null; render(); }

function teaFormModal(){
  const t = state.editingTea || state.teaPrefill || {};
  const typeOpts = TYPES.map(ty=>`<option value="${ty.k}" ${t.type===ty.k?'selected':''}>${ty.label}</option>`).join('');
  return `<div class="overlay" onclick="if(event.target===this) teaFormBackdrop()">
    <div class="modal">
      <div class="modal-head"><h2>${t.id?'Edit tea':'Add a tea'}</h2><button class="close-x" onclick="teaFormCloseGuard(this)">✕</button></div>
      <form id="teaForm" onsubmit="submitTeaForm(event)" oninput="_teaFormTouched=true">
        <!-- WS1: photo · name · type up front (the minimum to save); everything else folds behind
             "Specifics". The fold is a DOM toggle, NOT a re-render — submitTeaForm reads the fields on
             submit, so they must stay in the DOM (display:none inputs still submit their values). -->
        <div class="img-upload dropzone${state._draftImage?' has-img':''}" id="imgUploadWrap" style="${state._draftImage?`background-image:url(${state._draftImage})`:''}">
          ${state._draftImage?'':`${icon('i-camera-hl',26)}<span>Tap to add a photo</span>`}
          <input type="file" accept="image/*" class="js-img-input">
        </div>
        <div class="field" style="margin-top:14px;"><label>Name</label><input type="text" name="name" required value="${escapeHtml(t.name||'')}" oninput="teaFormNameSuggest()" placeholder="e.g. Sencha Kagoshima"><div id="teaKbSuggest"></div></div>
        <div class="field" style="margin-top:12px;"><label>Tea type</label><select name="type">${typeOpts}</select></div>
        <div class="fold-row" onclick="toggleSpecifics(this)" role="button" aria-expanded="false" style="margin-top:14px;">
          <span class="fold-label">Specifics <span class="fold-sub">· amount, harvest, origin…</span></span>
          <span class="fold-caret">${icon('i-caret-hl',22)}</span>
        </div>
        <div class="form-grid specifics-body" id="teaSpecifics" style="display:none;">
          <div class="field span2"><label>Amount on hand (g)</label><input type="number" step="0.1" name="amountGrams" value="${t.amountGrams??''}">
            <label class="checkrow" style="margin-top:6px;font-size:12px;"><input type="checkbox" name="inclPackaging" onchange="var r=document.getElementById('tareRow'); if(r) r.style.display=this.checked?'flex':'none';"> Weighed with packaging</label>
            <div id="tareRow" style="display:none;align-items:center;gap:8px;margin-top:6px;"><span style="font-size:12px;color:var(--ink-soft);">subtract</span><input type="number" step="0.1" name="packagingTare" value="${state.settings.defaultPackagingTareG??10}" style="width:64px;"><span style="font-size:12px;color:var(--ink-soft);">g packaging</span></div>
          </div>
          <div class="field"><label>Your rating</label><div id="teaRatingWrap">${renderStarsInteractive(Number(t.rating)||0,true,'setTeaFormRating')}</div><input type="hidden" name="rating" id="teaRatingInput" value="${t.rating||0}"></div>
          <div class="field"><label>Harvest year</label><input type="text" name="harvestYear" value="${escapeHtml(t.harvestYear||'')}" placeholder="2025"></div>
          <div class="field"><label>Harvest season</label><select name="harvestSeason">
            <option value="" ${!t.harvestSeason?'selected':''}>—</option>
            <option ${t.harvestSeason==='Spring'?'selected':''}>Spring</option>
            <option ${t.harvestSeason==='Summer'?'selected':''}>Summer</option>
            <option ${t.harvestSeason==='Autumn'?'selected':''}>Autumn</option>
            <option ${t.harvestSeason==='Winter'?'selected':''}>Winter</option>
          </select></div>
          <div class="field"><label>Origin</label><input type="text" name="origin" value="${escapeHtml(t.origin||'')}" placeholder="Fujian, China"></div>
          <div class="field"><label>Cultivar</label><input type="text" name="cultivar" value="${escapeHtml(t.cultivar||'')}" placeholder="Qi Dan"></div>
          <div class="field span2"><label>Shop / vendor</label><input type="text" name="source" list="vendorList" value="${escapeHtml(t.source||'')}" placeholder="Pick a shop you've used, or type a new one"><datalist id="vendorList">${distinctVendors().map(v=>`<option value="${escapeHtml(v)}"></option>`).join('')}</datalist></div>
          <div class="field"><label>Price paid</label><input type="number" step="0.01" name="costTotal" value="${t.costTotal??''}" placeholder="12.50"></div>
          <div class="field"><label>Grams bought (for that price)</label><input type="number" step="0.1" name="costOriginalGrams" value="${t.costOriginalGrams??''}" placeholder="50"></div>
          <div class="field span2"><label>Purchase date <span style="color:var(--ink-soft);font-weight:400;">— for spend tracking; leave blank if you already had it</span></label>
            <div style="display:flex;gap:6px;align-items:center;">
              <input type="date" name="purchaseDate" value="${escapeHtml(t.purchaseDate||'')}" style="flex:1;">
              <button type="button" class="lib-chip" onclick="setPurchaseToday(this)">Today</button>
            </div>
          </div>
          <div class="field span2"><label>Leaf form <span style="color:var(--ink-soft);font-weight:400;">— shapes suggested steep times when there's no guide, and how they ramp past the last listed steep</span></label>
            <select name="leafForm">
              <option value="" ${!t.leafForm?'selected':''}>Auto — infer from type &amp; name</option>
              ${LEAF_FORM_KEYS.map(k=>`<option value="${k}" ${t.leafForm===k?'selected':''}>${LEAF_PROFILES[k].label}</option>`).join('')}
            </select>
            ${!t.leafForm?`<div style="font-size:11px;color:var(--ink-soft);margin-top:4px;">Currently reads as <b>${LEAF_PROFILES[effectiveLeafForm(t)].label}</b>.</div>`:''}
          </div>
          <div class="field span2"><label>How to brew</label><textarea name="brewGuide" placeholder="95°C, 5s rinse, 15s / 20s / 30s...">${escapeHtml(t.brewGuide||'')}</textarea></div>
          <div class="field span2"><label>Description</label><textarea name="description" placeholder="Tasting notes, character, story...">${escapeHtml(t.description||'')}</textarea></div>
          <div class="field span2" style="flex-direction:row;gap:18px;flex-wrap:wrap;">
            <label class="checkrow"><input type="checkbox" name="isFavorite" ${t.isFavorite?'checked':''}> Favorite</label>
            <label class="checkrow"><input type="checkbox" name="wouldRebuy" ${t.wouldRebuy?'checked':''}> Would rebuy</label>
            <label class="checkrow"><input type="checkbox" name="isRepeat" ${t.purchaseType==='repeat'?'checked':''}> Repeat buy (unchecked = first time)</label>
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
    purchaseType: f.isRepeat.checked?'repeat':'first',
    purchaseDate: f.purchaseDate.value || null,
    leafForm: f.leafForm.value || null,
    image: imageUrl,
    dateAdded: state.editingTea?.dateAdded || new Date().toISOString()
  };
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

function openTeaDetail(id, from){ state.activeTeaId=id; state.teaDetailFrom = from||'teas'; state.view='tea-detail'; state.flavorView='bars'; // WS4: bars is the default view on every visit — the toggle is deliberately NOT persisted (radar must never become sticky)
  try{ localStorage.setItem('tealog_view','tea-detail'); localStorage.setItem('tealog_activeTea', id); }catch(e){}
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
function freshnessClass(tea){
  const type = (tea.type||'').toLowerCase();
  const name = ((tea.name||'')+' '+(tea.cultivar||'')).toLowerCase();
  if(type==='green' || /shincha|sencha|gyokuro|matcha|first[\s-]?flush|long ?jing|dragon ?well/.test(name)) return 'young';
  if(type==='white' || type==='puerh' || /sheng|raw pu|hei ?cha|liu ?bao|shou ?mei|aged/.test(name)) return 'ages';
  return null;
}
function freshnessStyleWord(tea){
  const name = (tea.name||'').toLowerCase();
  if(/shincha/.test(name)) return 'shincha';
  if(/sencha/.test(name)) return 'sencha';
  if(/gyokuro/.test(name)) return 'gyokuro';
  if(/matcha/.test(name)) return 'matcha';
  if(/first[\s-]?flush/.test(name)) return 'a first flush';
  if(/long ?jing|dragon ?well/.test(name)) return 'longjing';
  return (typeLabel(tea.type)||'green').toLowerCase()+' tea';
}
function freshnessCueHTML(tea){
  const cls = freshnessClass(tea); if(!cls) return '';
  const year = freshnessYear(tea); if(!year) return '';           // age needs a real year
  const season = freshnessSeason(tea);
  const when = (season ? season+' ' : '') + year + ' harvest';
  const line = cls==='young'
    ? `${when} — ${freshnessStyleWord(tea)} is at its best young.`
    : `${when} — this style deepens with age.`;
  return `<div style="margin-top:10px;font-size:12.5px;color:var(--ink-soft);font-style:italic;">${line}</div>`;
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

function distinctVocab(session){ // distinct vocabulary terms in a session's steeps
  const set=[];
  (session.steeps||[]).forEach(st=>(st.tags||[]).forEach(t=>{ t=String(t).toLowerCase(); if(isFlavorVocab(t) && !set.includes(t)) set.push(t); }));
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
    if(pos.filter(i=>i===0).length>=Math.ceil(pos.length/2) && avg<0.6) return `${capWord(flavorLabel(t))} peaks at steep 1, softens after`;
  }
  const top=p.terms[0], pos=p.positions[top]||[];
  return pos.length>=2 ? `${capWord(flavorLabel(top))} runs steady across the steeps` : '';
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

function viewTeaDetail(){
  const t = teaById(state.activeTeaId);
  if(!t) return '<div class="empty">Tea not found.</div>';
  const mySessions = state.sessions.filter(s=>s.teaId===t.id).sort((a,b)=>new Date(b.date)-new Date(a.date));
  const _cpg = t.costOriginalGrams ? (t.costTotal/t.costOriginalGrams) : 0;
  const _avgG = mySessions.length ? mySessions.reduce((a,s)=>a+(Number(s.gramsUsed)||0),0)/mySessions.length : 0;
  const costPerSession = (_cpg>0 && _avgG>0) ? _cpg*_avgG : 0;
  const histHTML = mySessions.length ? mySessions.map(s=>{
    const v = vesselById(s.vesselId);
    return `<div class="session-hist-row" style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
      <span style="display:flex;align-items:center;gap:8px;">${s.photoUrl?`<img src="${escapeHtml(s.photoUrl)}" alt="" class="session-thumb" loading="lazy">`:''}<span><strong>${fmtDateTime(s.date)}</strong> · ${v?escapeHtml(v.name):'—'} · ${brewCountLabel(s)} ${s.isColdBrew?'· cold brew':''} ${s.rating?'· '+renderStarsStatic(s.rating,false):''}</span></span>
      <button class="btn-ghost" onclick="openSessionEdit('${escapeJsArg(s.id)}')">edit</button>
    </div>`;
  }).join('') : '<div class="empty">No sessions logged for this tea yet.</div>';

  // Back target honours where we came from — #20 adds 'sessions' (tapping a session's tea) alongside passport.
  const back = state.teaDetailFrom==='passport' ? {v:'passport',l:'passport'}
             : state.teaDetailFrom==='sessions' ? {v:'sessions',l:'sessions'}
             : {v:'teas',l:'teas'};
  return `
    <button class="detail-back" onclick="goView('${back.v}')">← Back to ${back.l}</button>
    <div class="card">
      <div style="display:flex;gap:16px;flex-wrap:wrap;">
        <div style="width:140px;height:140px;border-radius:12px;background:${t.image?`url(${escapeHtml(t.image)}) center/cover`:'var(--jade-pale)'};flex:0 0 auto;"></div>
        <div style="flex:1;min-width:200px;">
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
            <span class="pill t-${escapeHtml(t.type)}">${escapeHtml(typeLabel(t.type))}</span>
            ${t.isFavorite?`<span class="pill" style="background:var(--jade-pale);color:var(--jade-deep);">${favLeaf(12)} favourite</span>`:''}
            ${t.wouldRebuy?'<span class="pill" style="background:var(--jade-pale);color:var(--jade-deep);">would rebuy</span>':''}
          </div>
          <h2 style="margin:8px 0 4px;">${escapeHtml(t.name)}</h2>
          ${renderStarsStatic(Number(t.rating)||0,true)}
          <div class="eyebrow" style="margin-top:8px;">On hand</div>
          <div style="font-size:14px;${isRunningLow(t)?'color:var(--red);font-weight:600;':''}">${Number(t.amountGrams).toFixed(1)}g</div>
          ${forecastLine(t)}
          ${inventorySparkline(t) || sparklineHintHTML(t)}
        </div>
      </div>

      <div class="grid grid-2" style="margin-top:16px;">
        <div><div class="eyebrow">Origin</div><div>${escapeHtml(t.origin||'—')}</div></div>
        <div><div class="eyebrow">Cultivar</div><div>${escapeHtml(t.cultivar||'—')}</div></div>
        <div><div class="eyebrow">Harvest</div><div>${escapeHtml([t.harvestSeason,t.harvestYear].filter(Boolean).join(' ')||'—')}</div>${freshnessCueHTML(t)}</div>
        <div><div class="eyebrow">Purchase</div><div>${t.purchaseType==='repeat'?'Repeat buy':'First time'}${t.purchaseDate?` · ${fmtDate(t.purchaseDate)}`:''}</div></div>
        <div><div class="eyebrow">Source</div><div>${escapeHtml(t.source||'—')}</div></div>
        <div><div class="eyebrow">Cost / gram</div><div>${t.costOriginalGrams?'$'+(t.costTotal/t.costOriginalGrams).toFixed(2):'—'}</div></div>
        <div><div class="eyebrow">Cost / session</div><div>${costPerSession>0?'$'+costPerSession.toFixed(2):'—'}</div></div>
      </div>
      ${t.brewGuide?savedBrewHTML(t):suggestedBrewHTML(t)}
      ${flavorProfileHTML(t)}
      ${t.description?`<div style="margin-top:14px;"><div class="eyebrow">Description</div><div style="font-size:13.5px;white-space:pre-wrap;">${escapeHtml(t.description)}</div></div>`:''}

      <div style="display:flex;gap:8px;margin-top:18px;flex-wrap:wrap;">
        <button class="btn btn-primary" onclick="startSessionFor('${t.id}')">Start session</button>
        <button class="btn" onclick="openTeaForm(teaById('${t.id}'))">Edit</button>
      </div>

      <div class="session-hist">
        <div class="eyebrow" style="margin-bottom:6px;">Session history</div>
        ${histHTML}
      </div>
    </div>
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
  const note = sched.generated
    ? 'Steep times come from the leaf type — your guide sets the rest. The session timer uses this schedule.'
    : 'Parsed from your brew guide — the session timer uses this schedule.';
  return `
    <div class="card" style="margin-top:14px;background:var(--jade-pale);border:1px solid var(--line);">
      <div class="eyebrow">Brew guide · saved</div>
      <div class="grid grid-3" style="margin-top:8px;">${rows.join('')}</div>
      <div style="font-size:12.5px;white-space:pre-wrap;margin-top:10px;">${escapeHtml(tea.brewGuide)}</div>
      <div style="font-size:11.5px;color:var(--ink-soft);margin-top:8px;">${note}</div>
    </div>`;
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
  return `
    <div class="card" style="margin-top:14px;background:var(--jade-pale);border:1px solid var(--line);">
      <div class="eyebrow">Suggested brew · ${escapeHtml(source)}</div>
      <div class="grid grid-3" style="margin-top:8px;">${rows.join('')}</div>
      <div style="font-size:11.5px;color:var(--ink-soft);margin-top:10px;">A starting point from ${kb&&kb.style?'the tea knowledge base':'the leaf type'} — not a saved guide. The session timer uses these times until you save your own.</div>
      <div style="margin-top:10px;"><button class="btn" onclick="saveSuggestedGuide('${tea.id}')">Save as brew guide</button></div>
    </div>`;
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
