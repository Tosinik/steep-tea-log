function teaCardHTML(t){
  const bg = t.image ? `background-image:url(${t.image})` : '';
  const sessionsForTea = state.sessions.filter(s=>s.teaId===t.id).length;
  return `<div class="tea-card" onclick="openTeaDetail('${t.id}')">
    <div class="tea-thumb" style="${bg}">${t.isFavorite?'<span class="fav">♥</span>':''}</div>
    <div class="tea-body">
      <span class="pill t-${t.type}">${typeLabel(t.type)}</span>
      <div class="name">${t.name}</div>
      ${renderStarsStatic(Number(t.rating)||0,false)}
      <div class="tea-meta">${Number(t.amountGrams)<lowStockG()?'<span class="stock-low">'+Number(t.amountGrams).toFixed(1)+'g left</span>':Number(t.amountGrams).toFixed(1)+'g on hand'} · ${sessionsForTea} session${sessionsForTea===1?'':'s'}</div>
    </div>
  </div>`;
}

function distinctVendors(){
  return [...new Set(state.teas.map(t=>(t.source||'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
}
function vendorManagerHTML(){
  const vendors = distinctVendors();
  const esc = v => v.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
  const rows = vendors.map(v=>{
    const count = state.teas.filter(t=>(t.source||'').trim()===v).length;
    return `<div class="vendor-row">
      <input type="text" value="${esc(v)}" data-old="${esc(v)}" onchange="renameVendorFromInput(this)" onkeydown="if(event.key==='Enter')this.blur()">
      <span class="vendor-count">${count} tea${count===1?'':'s'}</span>
    </div>`;
  }).join('');
  return `<div class="card" style="margin-bottom:14px;">
    <div class="section-title" style="margin-bottom:6px;"><h2 style="font-family:'Fraunces',serif;font-size:17px;">Vendors</h2><button class="lib-chip" onclick="toggleVendors()">Done</button></div>
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
function filteredSortedTeas(){
  const F = state.teaFilter;
  const list = state.teas.filter(t=>{
    if(F.type && t.type!==F.type) return false;
    if(F.vendor && (t.source||'').trim()!==F.vendor) return false;
    if(F.lowStock && !(Number(t.amountGrams)<lowStockG())) return false;
    if(F.favorite && !t.isFavorite) return false;
    return true;
  });
  const time = t => new Date(t.dateAdded||0).getTime();
  const s = state.teaSort;
  if(s==='newest') list.sort((a,b)=>time(b)-time(a));
  else if(s==='oldest') list.sort((a,b)=>time(a)-time(b));
  else if(s==='name') list.sort((a,b)=>(a.name||'').localeCompare(b.name||''));
  else if(s==='stock-high') list.sort((a,b)=>(Number(b.amountGrams)||0)-(Number(a.amountGrams)||0));
  else if(s==='stock-low') list.sort((a,b)=>(Number(a.amountGrams)||0)-(Number(b.amountGrams)||0));
  else if(s==='rating') list.sort((a,b)=>(Number(b.rating)||0)-(Number(a.rating)||0));
  return list;
}
function viewTeas(){
  const F = state.teaFilter;
  const vendors = distinctVendors();
  const list = filteredSortedTeas();
  const cards = list.length
    ? `<div class="grid grid-3">${list.map(teaCardHTML).join('')}</div>`
    : `<div class="card empty">${state.teas.length ? 'No teas match these filters.' : 'No teas yet — add your first one.'}</div>`;
  const esc = v => v.replace(/"/g,'&quot;');
  const typeOpts = `<option value="">All types</option>` + TYPES.map(ty=>`<option value="${ty.k}" ${F.type===ty.k?'selected':''}>${ty.label}</option>`).join('');
  const vendorOpts = `<option value="">All vendors</option>` + vendors.map(v=>`<option value="${esc(v)}" ${F.vendor===v?'selected':''}>${v}</option>`).join('');
  const controls = state.teas.length ? `
    <div class="lib-controls">
      <select class="lib-select" onchange="setTeaSort(this.value)" aria-label="Sort teas">
        <option value="newest" ${state.teaSort==='newest'?'selected':''}>Newest</option>
        <option value="oldest" ${state.teaSort==='oldest'?'selected':''}>Oldest</option>
        <option value="name" ${state.teaSort==='name'?'selected':''}>Name A–Z</option>
        <option value="stock-high" ${state.teaSort==='stock-high'?'selected':''}>Most stock</option>
        <option value="stock-low" ${state.teaSort==='stock-low'?'selected':''}>Least stock</option>
        <option value="rating" ${state.teaSort==='rating'?'selected':''}>Highest rated</option>
      </select>
      <select class="lib-select" onchange="setTeaFilter('type', this.value)" aria-label="Filter by type">${typeOpts}</select>
      ${vendors.length ? `<select class="lib-select" onchange="setTeaFilter('vendor', this.value)" aria-label="Filter by vendor">${vendorOpts}</select>` : ''}
      <button class="lib-chip ${F.lowStock?'active':''}" onclick="toggleLowStockFilter()">Low stock</button>
      <button class="lib-chip ${F.favorite?'active':''}" onclick="toggleFavoriteFilter()">★ Favorites</button>
      ${(F.type||F.vendor||F.lowStock||F.favorite) ? `<button class="lib-chip" onclick="clearTeaFilters()">✕ Clear</button>` : ''}
    </div>` : '';
  return `
    <div class="section-title"><h2 style="font-family:'Fraunces',serif;font-size:20px;">My teas</h2>
      <div style="display:flex;gap:8px;align-items:center;">
        ${vendors.length ? `<button class="lib-chip ${state.vendorsOpen?'active':''}" onclick="toggleVendors()">${state.vendorsOpen?'✕ Vendors':'Edit vendors'}</button>` : ''}
        <button class="btn btn-primary" onclick="openTeaForm()">＋ Add tea</button>
      </div>
    </div>
    ${state.vendorsOpen && vendors.length ? vendorManagerHTML() : ''}
    <div class="mono" style="font-size:12px;color:var(--ink-soft);margin:-6px 0 12px;">${state.teas.length} tea${state.teas.length===1?'':'s'} · ${state.teas.filter(t=>Number(t.amountGrams)>0).length} in stock${state.teas.filter(t=>Number(t.amountGrams)>0 && Number(t.amountGrams)<lowStockG()).length?` · ${state.teas.filter(t=>Number(t.amountGrams)>0 && Number(t.amountGrams)<lowStockG()).length} low`:''}</div>
    ${controls}
    ${cards}
  `;
}
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
  render();
}
function closeTeaForm(){ state.teaFormOpen=false; state.editingTea=null; state.teaPrefill=null; state._draftImage=null; render(); }

function teaFormModal(){
  const t = state.editingTea || state.teaPrefill || {};
  const typeOpts = TYPES.map(ty=>`<option value="${ty.k}" ${t.type===ty.k?'selected':''}>${ty.label}</option>`).join('');
  return `<div class="overlay" onclick="if(event.target===this) closeTeaForm()">
    <div class="modal">
      <div class="modal-head"><h2>${t.id?'Edit tea':'Add a tea'}</h2><button class="close-x" onclick="closeTeaForm()">✕</button></div>
      <form id="teaForm" onsubmit="submitTeaForm(event)">
        <div class="form-grid">
          <div class="field span2">
            <label>Photo</label>
            <div class="img-upload" id="imgUploadWrap" style="${state._draftImage?`background-image:url(${state._draftImage})`:''}">
              ${state._draftImage?'':'Tap to upload photo'}
              <input type="file" accept="image/*" class="js-img-input">
            </div>
          </div>
          <div class="field"><label>Name</label><input type="text" name="name" required value="${t.name||''}"></div>
          <div class="field"><label>Tea type</label><select name="type">${typeOpts}</select></div>
          <div class="field"><label>Amount on hand (g)</label><input type="number" step="0.1" name="amountGrams" value="${t.amountGrams??''}">
            <label class="checkrow" style="margin-top:6px;font-size:12px;"><input type="checkbox" name="inclPackaging" onchange="var r=document.getElementById('tareRow'); if(r) r.style.display=this.checked?'flex':'none';"> Weighed with packaging</label>
            <div id="tareRow" style="display:none;align-items:center;gap:8px;margin-top:6px;"><span style="font-size:12px;color:var(--ink-soft);">subtract</span><input type="number" step="0.1" name="packagingTare" value="${state.settings.defaultPackagingTareG??10}" style="width:64px;"><span style="font-size:12px;color:var(--ink-soft);">g packaging</span></div>
          </div>
          <div class="field"><label>Your rating</label><div id="teaRatingWrap">${renderStarsInteractive(Number(t.rating)||0,true,'setTeaFormRating')}</div><input type="hidden" name="rating" id="teaRatingInput" value="${t.rating||0}"></div>
          <div class="field"><label>Harvest year</label><input type="text" name="harvestYear" value="${t.harvestYear||''}" placeholder="2025"></div>
          <div class="field"><label>Harvest season</label><select name="harvestSeason">
            <option value="" ${!t.harvestSeason?'selected':''}>—</option>
            <option ${t.harvestSeason==='Spring'?'selected':''}>Spring</option>
            <option ${t.harvestSeason==='Summer'?'selected':''}>Summer</option>
            <option ${t.harvestSeason==='Autumn'?'selected':''}>Autumn</option>
            <option ${t.harvestSeason==='Winter'?'selected':''}>Winter</option>
          </select></div>
          <div class="field"><label>Origin</label><input type="text" name="origin" value="${t.origin||''}" placeholder="Fujian, China"></div>
          <div class="field"><label>Cultivar</label><input type="text" name="cultivar" value="${t.cultivar||''}" placeholder="Qi Dan"></div>
          <div class="field span2"><label>Shop / vendor</label><input type="text" name="source" list="vendorList" value="${t.source||''}" placeholder="Pick a shop you've used, or type a new one"><datalist id="vendorList">${distinctVendors().map(v=>`<option value="${v.replace(/"/g,'&quot;')}"></option>`).join('')}</datalist></div>
          <div class="field"><label>Price paid</label><input type="number" step="0.01" name="costTotal" value="${t.costTotal??''}" placeholder="12.50"></div>
          <div class="field"><label>Grams bought (for that price)</label><input type="number" step="0.1" name="costOriginalGrams" value="${t.costOriginalGrams??''}" placeholder="50"></div>
          <div class="field span2"><label>Purchase date <span style="color:var(--ink-soft);font-weight:400;">— for spend tracking; leave blank if you already had it</span></label>
            <div style="display:flex;gap:6px;align-items:center;">
              <input type="date" name="purchaseDate" value="${t.purchaseDate||''}" style="flex:1;">
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
          <div class="field span2"><label>How to brew</label><textarea name="brewGuide" placeholder="95°C, 5s rinse, 15s / 20s / 30s...">${t.brewGuide||''}</textarea></div>
          <div class="field span2"><label>Description</label><textarea name="description" placeholder="Tasting notes, character, story...">${t.description||''}</textarea></div>
          <div class="field span2" style="flex-direction:row;gap:18px;flex-wrap:wrap;">
            <label class="checkrow"><input type="checkbox" name="isFavorite" ${t.isFavorite?'checked':''}> Favorite</label>
            <label class="checkrow"><input type="checkbox" name="wouldRebuy" ${t.wouldRebuy?'checked':''}> Would rebuy</label>
            <label class="checkrow"><input type="checkbox" name="isRepeat" ${t.purchaseType==='repeat'?'checked':''}> Repeat buy (unchecked = first time)</label>
          </div>
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:18px;">
          <div>${t.id?`<button type="button" class="btn-danger btn" onclick="deleteTea('${t.id}')">Delete</button>`:'<span></span>'}</div>
          <div style="display:flex;gap:8px;"><button type="button" class="btn" onclick="closeTeaForm()">Cancel</button><button type="submit" class="btn btn-primary">Save tea</button></div>
        </div>
      </form>
    </div>
  </div>`;
}
function setTeaFormRating(v){
  document.getElementById('teaRatingInput').value = v;
  document.getElementById('teaRatingWrap').innerHTML = renderStarsInteractive(v,true,'setTeaFormRating');
}
function setPurchaseToday(btn){ const f=btn.closest('form'); if(f&&f.purchaseDate) f.purchaseDate.value = dayKey(new Date()); }
async function submitTeaForm(e){
  e.preventDefault();
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
}
function deleteTea(id){
  if(!confirm('Delete this tea? Session history stays but will show as an unknown tea.')) return;
  state.teas = state.teas.filter(t=>t.id!==id);
  dropTea(id);
  state.teaFormOpen=false; state.editingTea=null; state.view='teas'; state.activeTeaId=null;
  render();
}

function openTeaDetail(id, from){ state.activeTeaId=id; state.teaDetailFrom = from||'teas'; state.view='tea-detail'; render(); }

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
      <span style="display:flex;align-items:center;gap:8px;">${s.photoUrl?`<img src="${s.photoUrl}" alt="" class="session-thumb" loading="lazy">`:''}<span><strong>${fmtDateTime(s.date)}</strong> · ${v?v.name:'—'} · ${brewCountLabel(s)} ${s.isColdBrew?'· cold brew':''} ${s.rating?'· '+renderStarsStatic(s.rating,false):''}</span></span>
      <button class="btn-ghost" onclick="openSessionEdit('${s.id}')">edit</button>
    </div>`;
  }).join('') : '<div class="empty">No sessions logged for this tea yet.</div>';

  return `
    <button class="detail-back" onclick="goView('${state.teaDetailFrom==='passport'?'passport':'teas'}')">← Back to ${state.teaDetailFrom==='passport'?'passport':'teas'}</button>
    <div class="card">
      <div style="display:flex;gap:16px;flex-wrap:wrap;">
        <div style="width:140px;height:140px;border-radius:12px;background:${t.image?`url(${t.image}) center/cover`:'var(--jade-pale)'};flex:0 0 auto;"></div>
        <div style="flex:1;min-width:200px;">
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
            <span class="pill t-${t.type}">${typeLabel(t.type)}</span>
            ${t.isFavorite?'<span class="pill" style="background:#F6E3E2;color:#B5504A;">♥ favorite</span>':''}
            ${t.wouldRebuy?'<span class="pill" style="background:#E4EAE0;color:#3F5E42;">would rebuy</span>':''}
          </div>
          <h2 style="margin:8px 0 4px;">${t.name}</h2>
          ${renderStarsStatic(Number(t.rating)||0,true)}
          <div class="eyebrow" style="margin-top:8px;">On hand</div>
          <div style="font-size:14px;${Number(t.amountGrams)<lowStockG()?'color:var(--red);font-weight:600;':''}">${Number(t.amountGrams).toFixed(1)}g</div>
          ${forecastLine(t)}
          ${inventorySparkline(t)}
        </div>
      </div>

      <div class="grid grid-2" style="margin-top:16px;">
        <div><div class="eyebrow">Origin</div><div>${t.origin||'—'}</div></div>
        <div><div class="eyebrow">Cultivar</div><div>${t.cultivar||'—'}</div></div>
        <div><div class="eyebrow">Harvest</div><div>${[t.harvestSeason,t.harvestYear].filter(Boolean).join(' ')||'—'}</div></div>
        <div><div class="eyebrow">Purchase</div><div>${t.purchaseType==='repeat'?'Repeat buy':'First time'}${t.purchaseDate?` · ${fmtDate(t.purchaseDate)}`:''}</div></div>
        <div><div class="eyebrow">Source</div><div>${t.source||'—'}</div></div>
        <div><div class="eyebrow">Cost / gram</div><div>${t.costOriginalGrams?'$'+(t.costTotal/t.costOriginalGrams).toFixed(2):'—'}</div></div>
        <div><div class="eyebrow">Cost / session</div><div>${costPerSession>0?'$'+costPerSession.toFixed(2):'—'}</div></div>
      </div>
      ${t.brewGuide?`<div style="margin-top:14px;"><div class="eyebrow">How to brew</div><div style="font-size:13.5px;white-space:pre-wrap;">${t.brewGuide}</div></div>`:''}
      ${t.description?`<div style="margin-top:14px;"><div class="eyebrow">Description</div><div style="font-size:13.5px;white-space:pre-wrap;">${t.description}</div></div>`:''}

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

/* ================= FRIENDS (social) ================= */
