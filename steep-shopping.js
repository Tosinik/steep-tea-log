/* ================= SHOPPING LIST =================
   A calm "to buy" list. Two feeders: manual entries, and auto-suggested
   restocks pulled from the shelf (low/out teas not already on the list).
   Wishlist items live in their own `wishlist` table (see v3_3-wishlist.sql)
   and flow through the offline write queue like everything else. */

function persistWish(w){ window.SteepDB.putWishItem(w).catch(saveErr); }

function computeRestockSuggestions(){
  const low = (typeof lowStockG==='function') ? lowStockG() : 5;
  const onList = new Set((state.wishlist||[]).map(w=>(w.name||'').trim().toLowerCase()));
  return (state.teas||[])
    .filter(t=>Number(t.amountGrams) < low && !onList.has((t.name||'').trim().toLowerCase()))
    .sort((a,b)=>{
      const ao=Number(a.amountGrams)<=0?0:1, bo=Number(b.amountGrams)<=0?0:1;
      if(ao!==bo) return ao-bo;               // out of stock first
      const af=a.isFavorite?0:1, bf=b.isFavorite?0:1;
      if(af!==bf) return af-bf;               // then favourites
      return (a.name||'').localeCompare(b.name||'');
    });
}

function viewShopping(){
  const rowStyle = 'display:flex;align-items:center;gap:10px;padding:9px 0;border-top:1px solid var(--line);';
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

  const suggBlock = suggestions.length ? `<div class="card" style="margin-bottom:14px;">
    <div class="eyebrow">Running low</div>
    <div style="font-size:12px;color:var(--ink-soft);margin:4px 0 6px;">From your shelf — tap to add to the list.</div>
    ${suggestions.slice(0,8).map(t=>{
      const out = Number(t.amountGrams)<=0;
      return `<div style="${rowStyle}">
        <div style="flex:1;min-width:0;">
          <div style="font-weight:600;">${escapeHtml(t.name)}${t.isFavorite?' '+favLeaf(12):''}</div>
          <div style="font-size:11px;color:var(--ink-soft);">${out?'out of stock':`${Number(t.amountGrams)}g left`}${t.source?` · ${escapeHtml(t.source)}`:''}</div>
        </div>
        <button class="lib-chip" onclick="addWishFromTea('${t.id}')">Add</button>
      </div>`;
    }).join('')}
  </div>` : '';

  const listBlock = items.length ? `<div class="card">
    <div class="eyebrow">Your list</div>
    <div style="margin-top:2px;">
    ${items.map(w=>`<div style="${rowStyle}">
      <input type="checkbox" ${w.done?'checked':''} onchange="toggleWishDone('${w.id}')" aria-label="Mark bought">
      <div style="flex:1;min-width:0;">
        <div style="font-weight:600;${w.done?'text-decoration:line-through;opacity:.55;':''}">${escapeHtml(w.name)}</div>
        ${(w.vendor||w.note)?`<div style="font-size:11px;color:var(--ink-soft);">${[w.vendor,w.note].filter(Boolean).map(escapeHtml).join(' · ')}</div>`:''}
      </div>
      ${w.done?`<button class="lib-chip" onclick="teaFromWishItem('${w.id}')">Add as tea</button>`:''}
      <button class="icon-btn" style="font-size:14px;" onclick="removeWish('${w.id}')" title="Remove" aria-label="Remove">✕</button>
    </div>`).join('')}
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
function addWishFromTea(teaId){
  const t = teaById(teaId); if(!t) return;
  const w = { id:uid(), name:t.name, vendor:t.source||'', type:t.type||'', note:'', done:false, createdAt:new Date().toISOString() };
  state.wishlist = state.wishlist||[]; state.wishlist.push(w);
  persistWish(w); showToast(`Added "${t.name}" to your list`); render();
}
function teaFromWishItem(id){
  const w = (state.wishlist||[]).find(x=>x.id===id); if(!w) return;
  state.teaPrefill = { name:w.name, source:w.vendor||'', type:w.type||'', purchaseDate: dayKey(new Date()) };
  openTeaForm(); // editingTea stays null → create path, pre-filled from teaPrefill
}
