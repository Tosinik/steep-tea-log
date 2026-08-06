/* ================= SHOPPING LIST =================
   A calm "to buy" list. Two feeders: manual entries, and auto-suggested
   restocks pulled from the shelf (low/out teas not already on the list).
   Wishlist items live in their own `wishlist` table (see v3_3-wishlist.sql)
   and flow through the offline write queue like everything else. */

function persistWish(w){ window.SteepDB.putWishItem(w).catch(saveErr); }

function computeRestockSuggestions(){
  // #18: low is tier-aware (isRunningLow, steep-teas.js); out-of-stock stays in — this list is "low OR out".
  const onList = new Set((state.wishlist||[]).map(w=>(w.name||'').trim().toLowerCase()));
  return (state.teas||[])
    .filter(t=>(Number(t.amountGrams)<=0 || isRunningLow(t)) && !onList.has((t.name||'').trim().toLowerCase()))
    .sort((a,b)=>{
      const ao=Number(a.amountGrams)<=0?0:1, bo=Number(b.amountGrams)<=0?0:1;
      if(ao!==bo) return ao-bo;               // out of stock first
      const af=a.isFavorite?0:1, bf=b.isFavorite?0:1;
      if(af!==bf) return af-bf;               // then favourites
      return (a.name||'').localeCompare(b.name||'');
    });
}

function viewShopping(){
  const items = (state.wishlist||[]).slice().sort((a,b)=>{
    if(!!a.done!==!!b.done) return a.done?1:-1;                 // open first, bought last
    return new Date(a.createdAt||0)-new Date(b.createdAt||0);
  });
  const suggestions = computeRestockSuggestions();

  const addRow = `<div class="card" style="margin-bottom:14px;">
    <div class="field"><label>Add to list</label>
      <input type="text" id="wishName" placeholder="Tea or thing to buy" onkeydown="if(event.key==='Enter'){event.preventDefault();addWishFromInput();}">
    </div>
    <div class="field" style="margin-top:8px;"><label>Shop / vendor (optional)</label>
      <input type="text" id="wishVendor" list="wishVendorList" placeholder="Where from" onkeydown="if(event.key==='Enter'){event.preventDefault();addWishFromInput();}">
      <datalist id="wishVendorList">${(typeof distinctVendors==='function'?distinctVendors():[]).map(v=>`<option value="${escapeHtml(v)}"></option>`).join('')}</datalist>
    </div>
    <button class="btn btn-primary" style="margin-top:12px;width:100%;" onclick="addWishFromInput()">＋ Add</button>
  </div>`;

  /* SH2 — two sources, one screen, and they stay visibly different: running low is DERIVED from the
     shelf through stockTier, the list is its own table. SH5's pair is whatever the threshold says
     today, never a pinned name. Each row now offers both verbs: add it to the list (a want) or
     restock it (a repeat purchase, R11) — plus R12's search. */
  const suggBlock = suggestions.length ? `<div class="card" style="margin-bottom:14px;">
    <div class="eyebrow">Running low</div>
    <div class="shop-sub">From your shelf, by what's left — add it to the list, or log a repeat buy.</div>
    ${suggestions.slice(0,8).map(t=>{
      // statusLine is the single writer for stock words (v3.86 +F); this must not invent its own.
      // statusLine returns a STRUCTURED reading since B3 ({text, tone}), not a string — the shelf's
      // own words come off .text. Interpolating the object printed '[object Object]' on every row.
      const line = (typeof statusLine==='function') ? (statusLine(t).text||'') : '';
      return `<div class="shop-row">
        <div style="flex:1;min-width:0;">
          <div class="shop-name">${escapeHtml(t.name)}${t.isFavorite?' '+favLeaf(12):''}</div>
          <div class="shop-meta">${escapeHtml([line, t.source].filter(Boolean).join(' · '))}</div>
        </div>
        ${shopSearchLink(t.name, t.source)}
        <button class="lib-chip" onclick="restockTea('${escapeJsArg(t.id)}')" title="Log a repeat purchase">Restock</button>
        <button class="lib-chip" onclick="addWishFromTea('${escapeJsArg(t.id)}')">Add</button>
      </div>`;
    }).join('')}
  </div>` : '';

  const listBlock = items.length ? `<div class="card">
    <div class="eyebrow">Your list</div>
    <div style="margin-top:2px;">
    ${items.map(w=>{
      // SH1 — the overlap is the design. A want that names a tea already on the shelf reads as a
      // REBUY, with the shelf's own words for how much is left (statusLine, single writer). SH4:
      // the wishlist stores no cost, so no price is shown — inventing one is the failure this
      // round keeps naming.
      const onShelf = shelfTeaForWish(w);
      const shelfWords = onShelf && typeof statusLine==='function' ? (statusLine(onShelf).text||'') : '';
      const rebuy = onShelf ? `<span class="shop-rebuy">rebuy${shelfWords?' · '+escapeHtml(shelfWords):''}</span>` : '';
      const meta = [w.vendor, w.note].filter(Boolean).map(escapeHtml).join(' · ');
      return `<div class="shop-row">
      <input type="checkbox" ${w.done?'checked':''} onchange="toggleWishDone('${escapeJsArg(w.id)}')" aria-label="Mark bought">
      <div style="flex:1;min-width:0;">
        <div class="shop-name${w.done?' is-done':''}">${escapeHtml(w.name)}</div>
        ${(meta||rebuy)?`<div class="shop-meta">${[meta, rebuy].filter(Boolean).join(' · ')}</div>`:''}
      </div>
      ${shopSearchLink(w.name, w.vendor)}
      ${w.done?`<button class="lib-chip" onclick="teaFromWishItem('${escapeJsArg(w.id)}')">Add as tea</button>`:''}
      <button class="icon-btn" style="font-size:14px;" onclick="removeWish('${escapeJsArg(w.id)}')" title="Remove" aria-label="Remove">✕</button>
    </div>`;}).join('')}
    </div>
  </div>` : `<div class="card empty">Your shopping list is empty. Add something above, or pull from what's running low.</div>`;

  return `
    <div class="section-title"><h2 style="font-family:var(--font-display);font-size:20px;">Shopping list</h2></div>
    ${addRow}
    ${suggBlock}
    ${listBlock}
  `;
}

function addWishFromInput(){
  const nameEl = document.getElementById('wishName'); if(!nameEl) return;
  const name = (nameEl.value||'').trim(); if(!name) return;
  const vendEl = document.getElementById('wishVendor');
  const w = { id:uid(), name, vendor:((vendEl&&vendEl.value)||'').trim(), type:'', note:'', done:false, createdAt:new Date().toISOString() };
  state.wishlist = state.wishlist||[]; state.wishlist.push(w);
  persistWish(w); render();
  setTimeout(()=>{ const n=document.getElementById('wishName'); if(n) n.focus(); },0);
}
function toggleWishDone(id){
  const w = (state.wishlist||[]).find(x=>x.id===id); if(!w) return;
  w.done = !w.done; persistWish(w); render();
}
function removeWish(id){
  state.wishlist = (state.wishlist||[]).filter(x=>x.id!==id);
  window.SteepDB.removeWishItem(id).catch(saveErr); render();
}
// R49's join, as a predicate: normalized-name match against the wishlist. Same fold as :11's onList
// set, so the two can't drift.
function wishHasTeaName(name){
  const q = (name||'').trim().toLowerCase(); if(!q) return false;
  return (state.wishlist||[]).some(w=>(w.name||'').trim().toLowerCase()===q);
}
function addWishFromTea(teaId){
  const t = teaById(teaId); if(!t) return;
  // #03 forbids a duplicate add outright ("already listed → On your list ✓"). Guarded HERE rather
  // than only at the call site, so the invariant survives a caller that forgets to draw the state —
  // rebuyYes is the other one.
  if(wishHasTeaName(t.name)){ showToast(`"${t.name}" is already on your list`); render(); return; }
  const w = { id:uid(), name:t.name, vendor:t.source||'', type:t.type||'', note:'', done:false, createdAt:new Date().toISOString() };
  state.wishlist = state.wishlist||[]; state.wishlist.push(w);
  persistWish(w); showToast(`Added "${t.name}" to your list`); render();
}
function teaFromWishItem(id){
  const w = (state.wishlist||[]).find(x=>x.id===id); if(!w) return;
  state.teaPrefill = { name:w.name, source:w.vendor||'', type:w.type||'', purchaseDate: dayKey(new Date()) };
  openTeaForm(); // editingTea stays null → create path, pre-filled from teaPrefill
}

/* R11 / SH7 — restock is a REPEAT PURCHASE, not a wishlist add. The distinction is the whole point:
   adding to the list says "I want this", restocking says "I bought it again", and the second one
   creates a real tea row. It needs no new mechanism — `state.teaPrefill` already flows into the tea
   form and `purchaseType` has been 'first' | 'repeat' since v3.x with an `isRepeat` checkbox reading
   it, so this is three keys and the shipped create path. Nothing is written until the user commits
   the form, the same contract as copy-to-new-entry and Add-to-shelf. */
function restockTea(teaId){
  const t = teaById(teaId); if(!t) return;
  state.teaPrefill = { name:t.name, source:t.source||'', type:t.type||'',
                       purchaseType:'repeat', purchaseDate: dayKey(new Date()) };
  openTeaForm();
}
/* R12 / SH8 — a vendor web search, and deliberately nothing more. R12's vendor entity and stored URL
   stay deferred, so this stores nothing and knows nothing: it composes a search from the vendor name
   and the tea name the user already typed, and it is a PULL — the user taps it, it opens in a new
   tab, and no request leaves the app until they do. */
function vendorSearchUrl(name, vendor){
  const q = [vendor, name].filter(Boolean).join(' ').trim();
  return 'https://duckduckgo.com/?q=' + encodeURIComponent(q);
}
function shopSearchLink(name, vendor){
  if(!name && !vendor) return '';
  return `<a class="shop-find" href="${escapeHtml(vendorSearchUrl(name, vendor))}" target="_blank" rel="noopener noreferrer" title="Search the web for this">find ›</a>`;
}
// SH1's join, as a reading rather than a flag: the one wishlist row names a tea already on the shelf
// at 0 g, and that overlap IS the design — a rebuy, not a duplicate. R49's normalised-name match.
function shelfTeaForWish(w){
  const q = (w.name||'').trim().toLowerCase(); if(!q) return null;
  return (state.teas||[]).find(t=>(t.name||'').trim().toLowerCase()===q) || null;
}
