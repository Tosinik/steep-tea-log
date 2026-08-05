// Guards saveSessionEdit + commitSession against re-entrant double-fire. Both adjust
// tea stock as a read-modify-write on amountGrams, so a second invocation before the
// first finishes (e.g. a double-tapped Save, easy on mobile) would subtract gramsUsed
// twice and push a duplicate session. Set on entry, cleared in finally.
let _sessionSaving = false;
function startOfMonth(d){ return new Date(d.getFullYear(), d.getMonth(), 1); }
function calShift(delta){
  const m = state.calMonth || startOfMonth(new Date());
  state.calMonth = new Date(m.getFullYear(), m.getMonth()+delta, 1);
  render();
}
function selectCalDay(key){
  state.calSelDay = (state.calSelDay===key) ? null : key;
  render();
}
function sessionsByDay(){
  const map = {};
  state.sessions.forEach(s=>{ const k=dayKey(s.date); (map[k]=map[k]||[]).push(s); });
  return map;
}
// WS5-style thumb placeholder (no emoji): the tea's photo, else a type-tinted stripe, else a
// white(白)/pu'er(餅) kanji plate — mirrors shelfPhoto (steep-teas.js).
// #20: `tap` adds a stopPropagation onclick → tea detail. Passed only when the tea still exists
// (a deleted tea's row shows the placeholder with no tap target — no dead link).
function sessThumbHTML(tea, tap){
  const attr = tap ? ` role="link" onclick="event.stopPropagation();openTeaDetail('${escapeJsArg(tea.id)}','sessions')"` : '';
  const cur = tap ? 'cursor:pointer;' : '';
  if(tea && tea.image) return `<div class="sess-thumb"${attr} style="background-image:url(${escapeHtml(tea.image)});${cur}"></div>`;
  const type = (tea && tea.type || '').toLowerCase();
  const kanji = type==='white' ? '白' : (type==='puerh' ? '餅' : '');
  if(kanji) return `<div class="sess-thumb shelf-kanji t-${escapeHtml(type)}"${attr}${cur?` style="${cur}"`:''}><span>${kanji}</span></div>`;
  return `<div class="sess-thumb shelf-ph t-${escapeHtml(type||'unknown')}"${attr}${cur?` style="${cur}"`:''}></div>`;
}
function sessionRowHTML(s){
  const tea = teaById(s.teaId);
  const v = vesselById(s.vesselId);
  // History chips are the session's flavour notes (union of steep tags), plus any overall tags
  // not already covered — nothing the user entered is dropped. Empty → the meta reads "· no notes".
  const flav = sessionFlavorTags(s.steeps);
  const extra = (s.tags||[]).filter(t=>!flav.some(f=>f.toLowerCase()===String(t).toLowerCase()));
  const all = flav.concat(extra);
  const shown = all.slice(0,3);
  const overflow = all.length - shown.length;
  const chips = shown.map(t=>`<span class="hist-chip">${escapeHtml(flavorLabel(t))}</span>`).join('') + (overflow>0?`<span class="hist-chip more">+${overflow}</span>`:'');
  // #20: when the tea still exists, its thumb + name are their own tap targets → tea detail
  // (stopPropagation keeps the rest of the row opening the session edit). Deleted tea → plain, no link.
  const teaName = tea
    ? `<strong class="sess-tealink" role="link" onclick="event.stopPropagation();openTeaDetail('${escapeJsArg(tea.id)}','sessions')">${escapeHtml(tea.name)}</strong>`
    : `<strong>Unknown tea</strong>`;
  // v4.00: a row opens the sitting's DETAIL, not the edit form. Reading a record and changing it are
  // different intents, and the list was doing the second by default.
  return `<div class="sess-row" onclick="openSessionDetail('${escapeJsArg(s.id)}')">
    ${sessThumbHTML(tea, !!tea)}
    <div class="sess-main">
      <div class="sess-top">${teaName}${s.rating?renderStarsStatic(s.rating,false):''}</div>
      <div class="sess-sub">${fmtDateTime(s.date)} · ${v?escapeHtml(v.name):'—'} · ${brewCountLabel(s)}${s.isColdBrew?' · cold brew':''}${all.length?'':' · no notes'}</div>
      ${all.length?`<div class="sess-tags">${chips}</div>`:''}
    </div>
    <span class="sess-chev">›</span>
  </div>`;
}
function viewSessions(){
  if(state.sessions.length===0){
    return `<div class="section-title"><h2 style="font-family:var(--font-display);font-size:20px;">Sessions</h2></div>
      <div class="card empty">No sessions yet. Tap <strong>＋ Log session</strong> to record your first brew.</div>`;
  }
  if(!state.calMonth) state.calMonth = startOfMonth(new Date());
  const m = state.calMonth;
  const byDay = sessionsByDay();
  const monthLabel = m.toLocaleDateString(undefined,{month:'long',year:'numeric'});
  const firstDow = m.getDay();
  const daysInMonth = new Date(m.getFullYear(), m.getMonth()+1, 0).getDate();
  const todayKey = dayKey(new Date());
  const dow = ['S','M','T','W','T','F','S'].map(d=>`<div class="cal-dow">${d}</div>`).join('');
  let cells = '';
  for(let i=0;i<firstDow;i++) cells += `<div class="cal-cell blank"></div>`;
  for(let day=1; day<=daysInMonth; day++){
    const key = dayKey(new Date(m.getFullYear(), m.getMonth(), day));
    const list = byDay[key] || [];
    const has = list.length>0;
    cells += `<div class="cal-cell ${has?'has':''} ${state.calSelDay===key?'sel':''} ${key===todayKey?'today':''}" onclick="selectCalDay('${key}')">
      <span class="cal-num">${day}</span>${has?`<span class="cal-dot">${list.length>1?list.length:''}</span>`:''}
    </div>`;
  }
  /* R92 — the tab shipped TWO date surfaces stacked above the list: this month calendar (a filter
     control — selectCalDay narrows the list) and streakCardHTML()'s Brewing-days heatmap (a read-only
     reading). R42 names only the heatmap and #02 redraws away from the stack, so both go behind ONE
     toggle with the list as default. The calendar's day-filter stays reachable, so R61 holds: the
     capability survives, its position changes. */
  const cal = state.sessionsCalOpen ? `<div class="card">
    <div class="cal-head"><button class="btn-ghost" onclick="calShift(-1)">‹</button><strong>${monthLabel}</strong><button class="btn-ghost" onclick="calShift(1)">›</button></div>
    <div class="cal-grid cal-dows">${dow}</div>
    <div class="cal-grid">${cells}</div>
  </div>` : '';

  let listSessions = [...state.sessions].sort((a,b)=>new Date(b.date)-new Date(a.date));
  let listTitle = 'All sessions';
  if(state.calSelDay){
    listSessions = listSessions.filter(s=>dayKey(s.date)===state.calSelDay);
    listTitle = fmtDate(state.calSelDay);
  }
  const rows = listSessions.map(sessionRowHTML).join('');
  const open = !!state.sessionsCalOpen;
  return `
    <div class="lib-head">
      <div class="lib-title"><h2>Sittings</h2>
        <span class="lib-kicker mono">${state.sessions.length} logged${state.calSelDay?' · filtered to one day':''}</span></div>
      <div class="lib-head-actions">
        <button class="lib-chip${open?' active':''}" onclick="toggleSessionsCal()" aria-expanded="${open?'true':'false'}">Brewing days</button>
      </div>
    </div>
    ${cal}
    ${open ? streakCardHTML() : ''}
    <div class="section-title" style="margin-top:20px;"><h2>${listTitle}</h2>
      ${state.calSelDay?`<button class="btn-ghost" onclick="selectCalDay('${state.calSelDay}')">show all</button>`:''}</div>
    <div>${rows || '<div class="card empty">No sittings on this day.</div>'}</div>
  `;
}
// One toggle for both date surfaces (R92). Closing it clears any day filter, so the list can never be
// left silently narrowed by a control that is no longer on screen.
function toggleSessionsCal(){
  state.sessionsCalOpen = !state.sessionsCalOpen;
  if(!state.sessionsCalOpen) state.calSelDay = null;
  render();
}

/* ================= VESSELS ================= */
// #05 rev 1 (R3 slice B). Rich rows — photo tile · name · type · material · capacity · usage — and a
// tap goes STRAIGHT to edit (V2: four fields wouldn't fill a detail page). The header, the ＋ and the
// segment row live in viewTeas(); this renders the list only.
//
// Not built, deliberately: #05's V1 puts this behind the profile ⊙ and rejects a Library segment —
// superseded by R75 (shipped goVessels() has made it the Teas tab's second segment since v3.46, and
// the hub sheet has no Vessels row). 旅 for the Travel cuppa (R63) and 湯呑 for a "Frog Yunomi" (no
// such vessel exists) are not built either.
function vesselUsageCount(id){ return (state.sessions||[]).filter(s=>s.vesselId===id).length; }
function vesselRowHTML(v){
  // Generated, never a literal (R68): "9 sittings" stopped being distinguishing the moment a second
  // vessel reached 9, so the number is read from sessions on every render.
  const n = vesselUsageCount(v.id);
  const meta = [v.type, v.material, v.capacityMl ? v.capacityMl+' ml' : ''].filter(Boolean).join(' · ');
  // Capacity is the one field brew advice reads (leaf-to-water ratio), so its absence gets a quiet
  // prompt rather than a blank — the separator is a text node so the meta line still reads as one.
  const cap = v.capacityMl ? '' : `${meta?' · ':''}<button class="btn-ghost vessel-nocap" onclick="event.stopPropagation();openVesselForm(vesselById('${escapeJsArg(v.id)}'))">add capacity</button>`;
  return `<div class="vessel-row" onclick="openVesselForm(vesselById('${escapeJsArg(v.id)}'))">
    ${vesselPhoto(v,'tile')}
    <div class="vessel-rowmid">
      <div class="shelf-name">${escapeHtml(v.name)}</div>
      <div class="vessel-meta mono">${escapeHtml(meta)}${cap}</div>
    </div>
    <span class="vessel-usage mono">${n ? n+' sitting'+(n===1?'':'s') : ''}</span>
    <span class="shelf-caret">${icon('i-caret-hl',20)}</span>
  </div>`;
}
function viewVessels(){
  if(!state.vessels.length) return `<div class="card empty vessel-empty">
      <div>No vessels yet.</div>
      <div class="vessel-empty-sub">Add the pot or cup you brew in — a photo makes it yours.</div>
    </div>`;
  return `<div class="vessel-list">${state.vessels.map(vesselRowHTML).join('')}</div>`;
}
function openVesselForm(existing){
  state.editingVessel = existing || null;
  state._draftImage = existing ? (existing.image || null) : null;
  state.vesselFormOpen = true;
  render();
}
function closeVesselForm(){ state.vesselFormOpen=false; state.editingVessel=null; state._draftImage=null; render(); }
function vesselFormModal(){
  const v = state.editingVessel || {};
  const opts = VESSEL_TYPES.map(vt=>`<option ${v.type===vt?'selected':''}>${vt}</option>`).join('');
  return `<div class="overlay" onclick="if(event.target===this) closeVesselForm()">
    <div class="modal" style="max-width:440px;">
      <div class="modal-head"><h2>${v.id?'Edit vessel':'Add a vessel'}</h2><button class="close-x" onclick="closeVesselForm()">✕</button></div>
      <form onsubmit="submitVesselForm(event)">
        <div class="field" style="margin-bottom:12px;">
          <label>Photo</label>
          <div class="img-upload" id="imgUploadWrap" style="${state._draftImage?`background-image:url(${state._draftImage})`:''}">
            ${state._draftImage?'':'Tap to upload photo'}
            <input type="file" accept="image/*" class="js-img-input">
          </div>
        </div>
        <div class="field" style="margin-bottom:12px;"><label>Name</label><input type="text" name="name" required placeholder="My gaiwan" value="${escapeHtml(v.name||'')}"></div>
        <div class="field" style="margin-bottom:12px;"><label>Type</label><select name="type">${opts}</select></div>
        <div class="field" style="margin-bottom:12px;"><label>Material</label><input type="text" name="material" placeholder="Porcelain, clay, glass..." value="${escapeHtml(v.material||'')}"></div>
        <div class="field" style="margin-bottom:12px;"><label>Capacity (ml) <span style="color:var(--ink-soft);font-weight:400;">— helps tune brew advice by leaf-to-water ratio</span></label><input type="number" name="capacityMl" placeholder="e.g. 110 for a gaiwan, 200 for a kyusu" value="${v.capacityMl??''}"></div>
        <div style="display:flex;justify-content:flex-end;gap:8px;"><button type="button" class="btn" onclick="closeVesselForm()">Cancel</button><button type="submit" class="btn btn-primary">Save vessel</button></div>
      </form>
      ${v.id ? `<div class="vessel-danger"><button type="button" class="btn-ghost" onclick="armConfirm(this,'Delete this vessel?',()=>deleteVesselFromForm('${escapeJsArg(v.id)}'))">Delete this vessel</button></div>` : ''}
    </div>
  </div>`;
}
let _vesselFormSaving = false;
async function submitVesselForm(e){
  e.preventDefault();
  if(_vesselFormSaving) return;   // guard re-entrant double-submit (async gap before state push)
  _vesselFormSaving = true;
  try {
    const f = e.target;
    const imageUrl = await resolveDraftImage();
    const data = {
      id: state.editingVessel?.id || uid(),
      name: f.name.value.trim(),
      type: f.type.value,
      material: f.material.value.trim(),
      capacityMl: f.capacityMl.value?Number(f.capacityMl.value):null,
      image: imageUrl
    };
    if(state.editingVessel){
      const idx = state.vessels.findIndex(x=>x.id===data.id);
      state.vessels[idx] = data;
    } else {
      state.vessels.push(data);
    }
    persistVessel(data);
    syncAchievements(true);
    closeVesselForm();
  } finally { _vesselFormSaving = false; }
}
function deleteVessel(id){
  state.vessels = state.vessels.filter(v=>v.id!==id);
  dropVessel(id); render();
}
// #05 moved delete off the list row and into the edit form (V2: the row is a tap target now, so a
// destructive button riding it would be one mis-tap from the edit it sits inside). armConfirm stays
// the primitive — the board's "hold to confirm" describes the same two-step intent (R76's sibling
// call): the house has one destructive-confirm control and it is not a native gesture.
function deleteVesselFromForm(id){
  state.vesselFormOpen=false; state.editingVessel=null; state._draftImage=null;
  deleteVessel(id);
}

/* ================= SESSION EDITING ================= */
/* R58 (v4.00): editing is a SCREEN now, not a modal overlay. What did NOT change is the pair of
   mechanisms underneath — the deep copy here and the whole-object writeback in saveSessionEdit.
   Those are the only reason the un-surfaced per-steep taste words and strength taps survive an edit
   (R57 documents the gap; 67 field-values ride on it across the current export), and nothing in the
   UI would show their loss. `fixtures/session-edit-test.js` was written against the modal and run
   green BEFORE this move, and stays green and unedited across it. If it ever needs editing to pass,
   that is the finding, not the fix. */
function openSessionEdit(sessionId){
  const s = state.sessions.find(x=>x.id===sessionId);
  if(!s) return;
  state.editingSession = JSON.parse(JSON.stringify(s));   // DEEP — see above; do not "simplify"
  state.editingSession.tags = state.editingSession.tags || [];
  state.sessionEditOpen = true;
  state.view = 'session-edit';
  render();
}
// Back to the sitting it belongs to, not to the list — the edit screen is reached from detail.
function closeSessionEdit(){
  const id = state.editingSession && state.editingSession.id;
  state.sessionEditOpen=false; state.editingSession=null;
  if(id && state.sessions.some(s=>s.id===id)){ state.activeSessionId=id; state.view='session-detail'; }
  else state.view='sessions';
  render();
}
// #20: jump from the edit screen to the tea's page. Clears the draft FIRST so a half-edited session
// can't linger behind another view (it was a modal appended by render() until v4.00; the reason
// survives the move — openTeaDetail sets its own view, and a live editingSession would outlast it).
function es_viewTea(){
  const id = state.editingSession && state.editingSession.teaId;
  state.sessionEditOpen=false; state.editingSession=null;
  if(id) openTeaDetail(id,'sessions'); else render();
}
function es_set(key, val){ state.editingSession[key]=val; }
// B7 (v3.91): explicit method correction on the edit modal — the ONLY way brewStyle changes here
// (saveSessionEdit passes the field through untouched; JC1's no-prefill-on-edit rule stays intact).
function es_setBrewStyle(m){ es_set('brewStyle', m); render(); }
// What a method-less session is currently READ as (capacity inference), for the observational hint.
function esMethodReadLabel(e){ const rd=brewMethodFor(e.brewStyle,(vesselById(e.vesselId)||{}).capacityMl); return (SESSION_METHODS.find(m=>m.k===rd)||{}).label||rd; }
function es_setSteep(i, key, val){
  if(key==='tempC'){ state.editingSession.steeps[i].tempC = displayToC(val); return; }
  state.editingSession.steeps[i][key] = (key==='timeSeconds') ? (val===''?null:Number(val)) : val;
}
function es_adjustInfusions(delta){
  const e = state.editingSession;
  e.infusionCount = Math.max(1, (Number(e.infusionCount)||1) + delta);
  const el = document.getElementById('editInfusionVal');
  if(el) el.textContent = e.infusionCount;
}
function setEditSessionRating(v){
  state.editingSession.rating = v;
  document.getElementById('editRatingWrap').innerHTML = renderStarsInteractive(v,true,'setEditSessionRating');
}
function removeEditSteepClick(btn, i){
  if(state.editingSession.steeps.length<=1){ showToast('A session needs at least one steep — delete the whole session instead.'); return; }
  armConfirm(btn, 'Remove steep '+(i+1)+'?', ()=>removeEditSteep(i));
}
function removeEditSteep(i){
  state.editingSession.steeps.splice(i,1);
  render();
}
function addEditSteep(){
  const st = state.editingSession.steeps;
  const last = st[st.length-1];
  st.push({ id: uid(), order: st.length+1, tempC: last ? last.tempC : null, timeSeconds: null, description: '', tags: [] });
  render();
}
function es_convertToSteeps(){
  const e = state.editingSession;
  const n = Math.max(1, Number(e.infusionCount)||1);
  e.steeps = Array.from({length:n}, (_,i)=>({ id: uid(), order: i+1, tempC: null, timeSeconds: null, description: '', tags: [] }));
  e.infusionCount = null;
  render();
}
function saveSessionEdit(){
  if(_sessionSaving) return;
  _sessionSaving = true;
  try {
    const e = state.editingSession;
    const idx = state.sessions.findIndex(x=>x.id===e.id);
    if(idx<0) return;
    const old = state.sessions[idx];
    const newGrams = e.gramsUsed===''?0:Number(e.gramsUsed)||0;
    const delta = newGrams - (Number(old.gramsUsed)||0);
    if(delta!==0){
      const tea = teaById(e.teaId);
      if(tea){ tea.amountGrams = Math.max(0,(Number(tea.amountGrams)||0)-delta); persistTea(tea); }
    }
    e.gramsUsed = newGrams;
    e.date = e._localDate ? new Date(e._localDate).toISOString() : e.date;
    delete e._localDate;
    const tea = teaById(e.teaId), ves = vesselById(e.vesselId);
    e.teaName = tea?tea.name:(e.teaName||''); e.teaType = tea?tea.type:(e.teaType||''); e.vesselName = ves?ves.name:(e.vesselName||'');
    state.sessions[idx] = e;
    persistSession(e);
    syncAchievements(true);
    closeSessionEdit();
  } finally { _sessionSaving = false; }
}
function deleteSession(){
  if(_sessionSaving) return;
  _sessionSaving = true;
  try {
    const e = state.editingSession;
    const tea = teaById(e.teaId);
    if(tea && Number(e.gramsUsed)>0){ tea.amountGrams = (Number(tea.amountGrams)||0) + Number(e.gramsUsed); persistTea(tea); }
    state.sessions = state.sessions.filter(x=>x.id!==e.id);
    dropSession(e.id);
    closeSessionEdit();
  } finally { _sessionSaving = false; }
}
/* ================= #02b SESSION DETAIL (v4.00) ================= */
function openSessionDetail(id){ state.activeSessionId=id; state.view='session-detail'; state.sessionMenuOpen=false; render(); }
function toggleSessionMenu(){ state.sessionMenuOpen=!state.sessionMenuOpen; render(); }

/* R90 — a record surface shows STORED brew_style only, and the hero is the stricter case: an
   identity line reads as fact rather than as a reading. The 6 Jul Da Hong Pao has brew_style empty
   with a 110 ml gaiwan, so a derived lane would print "gongfu" over a null column. Eight of forty
   sessions render without a method line. That is correct, not a gap — esMethodReadLabel() stays the
   one place a derived reading appears, on the edit surface, visibly beside editable fields. */
function sessionMethodLabel(s){
  if(s.isColdBrew) return 'cold brew';
  if(!s.brewStyle) return '';                        // null → nothing. Never the capacity inference.
  return (SESSION_METHODS.find(m=>m.k===s.brewStyle)||{}).label || s.brewStyle;
}
function sessionSteepRowHTML(st, i){
  const tags = (st.tags||[]).map(t=>`<span class="hist-chip">${escapeHtml(flavorLabel(t))}</span>`).join('');
  // The v3.89 strength tap, read-only here. Distinct from CALIBRATE (which tunes forward).
  const str = st.feedback ? `<span class="steep-strength mono">${escapeHtml(st.feedback)}</span>` : '';
  return `<div class="sd-steep">
    <div class="sd-steep-head"><span class="sd-steep-i mono">${i+1}</span>
      <span class="sd-steep-t mono">${st.timeSeconds!=null?fmtSecShort(st.timeSeconds):'—'}</span>
      ${st.tempC!=null?`<span class="sd-steep-c mono">${cToDisplay(st.tempC)}${tempUnitLabel()}</span>`:''}
      ${str}</div>
    ${st.description?`<div class="sd-steep-note">${escapeHtml(st.description)}</div>`:''}
    ${tags?`<div class="sd-steep-tags">${tags}</div>`:''}
  </div>`;
}
function viewSessionDetail(){
  const s = state.sessions.find(x=>x.id===state.activeSessionId);
  if(!s) return '<div class="empty">Sitting not found.</div>';
  const tea = teaById(s.teaId), ves = vesselById(s.vesselId);
  const method = sessionMethodLabel(s);
  const ident = [tea?typeLabel(tea.type):'', method,
    ves?`<span class="sd-link" onclick="goVessels()">${escapeHtml(ves.name)}</span>`:''].filter(Boolean).join(' · ');
  // Facts render only when stored — honest empties, never a dash (the #03 cascade).
  const facts = [];
  const fact = (k,v)=>{ if(v) facts.push(`<div><div class="eyebrow">${k}</div><div>${v}</div></div>`); };
  fact('Leaf', Number(s.gramsUsed)>0 ? Number(s.gramsUsed)+' g' : '');
  fact('Water', s.waterMl ? s.waterMl+' ml' : (ves&&ves.capacityMl ? ves.capacityMl+' ml <span class="sd-soft">capacity</span>' : ''));
  fact('Water type', escapeHtml(s.waterType||''));
  fact('TDS', s.waterTDS!=null ? s.waterTDS+' ppm' : '');
  const steeps = (s.steeps||[]).slice().sort((a,b)=>(a.order||0)-(b.order||0));
  const total = steeps.reduce((a,x)=>a+(Number(x.timeSeconds)||0),0);
  const temps = [...new Set(steeps.map(x=>x.tempC).filter(v=>v!=null))];
  const steepMeta = steeps.length
    ? [total?'total '+fmtSecShort(total):'', temps.length===1?cToDisplay(temps[0])+tempUnitLabel()+' flat':'',
       s.waterMl?s.waterMl+' ml':(ves&&ves.capacityMl?ves.capacityMl+' ml':'')].filter(Boolean).join(' · ')
    : '';
  const sessTags = (s.tags||[]).map(t=>`<span class="hist-chip">${escapeHtml(flavorLabel(t))}</span>`).join('');
  const quiet = [!s.isShared?'not shared':'', !s.mood?'no mood logged':''].filter(Boolean).join(' · ');
  return `
    <div class="detail-head">
      <button class="detail-back" onclick="goView('sessions')">← Back to sittings</button>
      <button class="tea-more" onclick="toggleSessionMenu()" aria-label="More" aria-expanded="${state.sessionMenuOpen?'true':'false'}">⋯</button>
    </div>
    ${sessionMenuHTML(s)}
    <div class="card">
      <div class="sd-kicker mono">${escapeHtml(fmtDateTime(s.date))}</div>
      <h2 class="sd-title">${tea?`<span class="sd-link" onclick="openTeaDetail('${escapeJsArg(tea.id)}','sessions')">${escapeHtml(tea.name)}</span>`:'Unknown tea'}</h2>
      ${ident?`<div class="sd-ident">${ident}</div>`:''}
      ${s.rating?`<div style="margin-top:8px;">${renderStarsStatic(Number(s.rating),true)}</div>`:''}
      ${facts.length?`<div class="grid grid-2" style="margin-top:14px;">${facts.join('')}</div>`:''}
      ${quiet?`<div class="sd-quiet mono">${quiet}</div>`:''}

      ${steeps.length ? `<div class="section-title" style="margin-top:20px;"><h2 class="sd-h">Steeps · ${steeps.length}</h2>
        ${steepMeta?`<span class="mono sd-soft">${escapeHtml(steepMeta)}</span>`:''}</div>
        <div class="sd-steeps">${steeps.map(sessionSteepRowHTML).join('')}</div>`
      : `<div class="section-title" style="margin-top:20px;"><h2 class="sd-h">Infusions</h2></div>
         <div class="sd-soft">${brewCountLabel(s)} — logged without timed steeps.</div>`}

      ${s.description?`<div style="margin-top:18px;"><div class="eyebrow">Your note</div><div class="sd-note">${escapeHtml(s.description)}</div></div>`:''}
      ${sessTags?`<div style="margin-top:14px;"><div class="eyebrow">Taste words</div><div class="sd-steep-tags">${sessTags}</div></div>`:''}
      ${s.photoUrl?`<div style="margin-top:16px;"><img src="${escapeHtml(s.photoUrl)}" alt="" class="sd-photo" loading="lazy"></div>`:''}

      <div style="display:flex;gap:8px;margin-top:20px;flex-wrap:wrap;">
        <button class="btn btn-primary" onclick="brewAgain('${escapeJsArg(s.id)}')">Brew this again</button>
        <button class="btn" onclick="openSessionEdit('${escapeJsArg(s.id)}')">Edit</button>
      </div>
    </div>`;
}
/* The ⋯ menu, enumerated to what exists. #02b draws "Pass this tea to the circle" as NEW — it needs
   slice F's pass record and its migration, so it is OMITTED rather than drawn disabled: a dead
   control invites a tap and explains nothing (the honest-absence pattern, #03's missing Go Deeper
   row and #37's no-row panel). It returns in F. */
function sessionMenuHTML(s){
  if(!state.sessionMenuOpen) return '';
  return `<div class="hub-scrim" onclick="toggleSessionMenu()"></div>
    <div class="hub-sheet" role="dialog" aria-label="Sitting options">
      <div class="hub-grab"></div>
      <button class="hub-row" onclick="copySessionToNew('${escapeJsArg(s.id)}')">${icon('i-plus-hl',20)}<span>Copy to a new entry</span></button>
      <button class="hub-row" style="color:var(--red);" onclick="armConfirm(this,'Delete this sitting? Its grams go back to the tea stock.',()=>deleteSessionById('${escapeJsArg(s.id)}'))">${icon('i-settings-hl',20)}<span>Delete sitting</span></button>
    </div>`;
}
/* R40 + R91 — brew-again carries the vessel ALWAYS and the method ONLY when the source row actually
   stored one. Carrying a derived method forward would let the capacity heuristic become a stored
   record on the next save: R64's laundering, arriving through a door nobody was watching. A
   brew-again from a null session starts null, and the four-lane control shows nothing until the user
   picks. */
function brewAgain(sessionId){
  const s = state.sessions.find(x=>x.id===sessionId); if(!s) return;
  state.sessionMenuOpen=false;
  startSessionFor(s.teaId, { vesselId:s.vesselId || null, brewStyle:s.brewStyle || null });
}
// Copy-to-new-entry: the same sitting as a starting point, never a silent duplicate — it opens the
// setup draft prefilled, so nothing is written until the user commits it themselves.
function copySessionToNew(sessionId){
  const s = state.sessions.find(x=>x.id===sessionId); if(!s) return;
  state.sessionMenuOpen=false;
  startSessionFor(s.teaId, { vesselId:s.vesselId || null, brewStyle:s.brewStyle || null,
    gramsUsed:s.gramsUsed || '', waterMl:s.waterMl || '' });
}
function deleteSessionById(id){
  const s = state.sessions.find(x=>x.id===id); if(!s) return;
  const tea = teaById(s.teaId);
  if(tea && Number(s.gramsUsed)>0){ tea.amountGrams = (Number(tea.amountGrams)||0) + Number(s.gramsUsed); persistTea(tea); }
  state.sessions = state.sessions.filter(x=>x.id!==id);
  dropSession(id);
  state.sessionMenuOpen=false; state.activeSessionId=null; state.view='sessions'; render();
}

/* R58 (v4.00) — the edit surface moved from a modal overlay to its own screen. Only the SHELL
   changed: the overlay/modal wrapper became a back button and a card, and the ✕ became Cancel. The
   body, every setter and both copy mechanisms are untouched, which is what lets
   fixtures/session-edit-test.js stay green and unedited across the move. #02b rev 2's dedicated edit
   screen is what satisfied "somewhere less intrusive" and closed #28. */
function viewSessionEdit(){
  const e = state.editingSession;
  if(!e) return '<div class="empty">No session being edited.</div>';
  const steepsHTML = e.steeps.map((st,i)=>`
    <div class="steep-item">
      <div class="steep-head"><span>Steep ${i+1}</span><button class="btn-ghost" onclick="removeEditSteepClick(this,${i})">remove</button></div>
      <div class="form-grid" style="margin-top:6px;">
        <div class="field"><label>Temp ${tempUnitLabel()}</label><input type="number" value="${cToDisplay(st.tempC)}" oninput="es_setSteep(${i},'tempC',this.value)"></div>
        <div class="field"><label>Time (sec)</label><input type="number" value="${st.timeSeconds??''}" oninput="es_setSteep(${i},'timeSeconds',this.value)"></div>
        <div class="field span2"><label>Notes</label><textarea oninput="es_setSteep(${i},'description',this.value)">${escapeHtml(st.description||'')}</textarea></div>
      </div>
    </div>
  `).join('');
  return `
    <button class="detail-back" onclick="closeSessionEdit()">← Back to the sitting</button>
    <div class="card">
      <div class="modal-head"><h2 style="margin:0;">Edit sitting</h2>
        <div style="display:flex;align-items:center;gap:12px;">
          ${teaById(e.teaId)?`<button class="btn-ghost sess-viewtea" onclick="es_viewTea()">view tea →</button>`:''}
        </div></div>
      <div class="form-grid">
        <div class="field span2"><label>When</label><input type="datetime-local" value="${toLocalDatetimeValue(e.date)}" onchange="es_set('_localDate', this.value)"></div>
        <div class="field"><label>Leaf amount (g)</label><input type="number" step="0.1" value="${e.gramsUsed??''}" oninput="es_set('gramsUsed', this.value)"></div>
        <div class="field"><label>Water (ml)</label><input type="number" value="${e.waterMl??''}" oninput="es_set('waterMl', this.value)" placeholder="${(vesselById(e.vesselId)||{}).capacityMl||'vessel capacity'}"></div>
        <div class="field span2"><label>Vessel</label><select onchange="es_set('vesselId', this.value)">${
          (state.vessels.some(v=>v.id===e.vesselId) ? '' : `<option value="${escapeHtml(e.vesselId||'')}" selected>${escapeHtml(e.vesselName||'(unknown vessel)')}</option>`)
          + state.vessels.map(v=>`<option value="${escapeHtml(v.id)}" ${e.vesselId===v.id?'selected':''}>${escapeHtml(v.name)}${v.capacityMl?` · ${v.capacityMl}ml`:''}</option>`).join('')
        }</select></div>
        <div class="field span2"><label>Method</label>
          ${methodLanesHTML({ brewStyle:e.brewStyle, isColdBrew:e.isColdBrew,
            capacityMl:(vesselById(e.vesselId)||{}).capacityMl, resolve:false,
            onMethod:'es_pickMethodLane', onCold:'es_pickColdLane()', small:true })}
          ${(!e.isColdBrew && !e.brewStyle) ? `<div style="font-size:11px;color:var(--ink-soft);margin-top:5px;">no method recorded — currently read as ${escapeHtml(esMethodReadLabel(e))} from the vessel</div>` : ''}
        </div>
        <div class="field span2"><label class="checkrow"><input type="checkbox" ${e.isShared?'checked':''} onchange="es_set('isShared', this.checked)"> Shared with followers</label></div>
        <div class="field span2"><label>Overall rating</label><div id="editRatingWrap">${renderStarsInteractive(Number(e.rating)||0,true,'setEditSessionRating')}</div></div>
        ${(state.settings.showMood || e.mood!=null) ? `<div class="field span2"><label>Mood</label><div id="editMoodWrap">${moodChipsHTML(e.mood||null,'setEditSessionMood')}</div></div>` : ''}
        <div class="field span2"><label>Overall notes</label><textarea oninput="es_set('description', this.value)">${escapeHtml(e.description||'')}</textarea></div>
        <div class="field span2">
          <label>Tags</label>
          <div>${e.tags.map(t=>`<span class="tagchip">${escapeHtml(t)} <button onclick="removeEditTag('${escapeJsArg(t)}')">✕</button></span>`).join(' ')}</div>
          ${tagLibraryChipsHTML('edit')}
        </div>
      </div>
      ${e.steeps.length ? `<div class="eyebrow" style="margin:16px 0 8px;">Steeps</div>${steepsHTML}
      <button class="btn" style="margin-top:8px;" onclick="addEditSteep()">＋ Add steep</button>` : `
      <div class="eyebrow" style="margin:16px 0 8px;">Infusions</div>
      <div class="infusion-stepper">
        <button type="button" aria-label="one fewer infusion" onclick="es_adjustInfusions(-1)">−</button>
        <span id="editInfusionVal">${Number(e.infusionCount)||1}</span>
        <button type="button" aria-label="one more infusion" onclick="es_adjustInfusions(1)">＋</button>
      </div>
      <button class="btn" style="margin-top:10px;" onclick="es_convertToSteeps()">Switch to detailed steeps</button>`}
      <div style="display:flex;justify-content:space-between;margin-top:16px;">
        <button class="btn btn-danger" onclick="armConfirm(this,'Delete this sitting? Its grams go back to the tea stock.',()=>deleteSession())">Delete this sitting</button>
        <div style="display:flex;gap:8px;"><button class="btn" onclick="closeSessionEdit()">Cancel</button><button class="btn btn-primary" onclick="saveSessionEdit()">Save changes</button></div>
      </div>
    </div>`;
}

/* ================= SESSION LOGGING ================= */
// v3.83 (#23 audit F4): the WS6 bottom bar renders Log during the session flow, so a mis-tap used to
// overwrite the draft silently (finish-screen rating/notes gone, mid-steep interval orphaned). Past
// setup there is always something to lose; in setup only a form edited away from its fresh defaults is.
function draftFingerprint(d){
  return [d.teaId,d.vesselId,d.sessionDate,d.isColdBrew,d.waterType,d.waterTDS,d.gramsUsed,d.brewStyle,d.waterMl,d.mood].join('|');
}
function sessionDraftDirty(d){
  if(!d) return false;
  if(d.stage!=='setup') return true;                     // steeping/finish/quick carry logged work
  return !!d._pristine && draftFingerprint(d)!==d._pristine;
}
function quickLogSession(btn){
  if(state.teas.length===0){ showToast('Add a tea first.'); state.view='teas'; render(); return; }
  if(sessionDraftDirty(state.sessionDraft)){
    if(btn){ armConfirm(btn, 'Discard the session in progress?', ()=>startSessionFor(null)); return; }
    state.view='session'; render(); return;              // no button to arm → never silently discard; return to the draft
  }
  startSessionFor(null);
}
/* `pre` is R40's brew-again / copy-to-new carry (v4.00), and R91 governs what may travel: the vessel
   ALWAYS, the method ONLY when the source row actually stored one. `pre.brewStyle` is passed as null
   from a null session, so a derived lane can never become a stored record on the next save — that is
   R64's laundering one step removed, and this is the door it would have come through. */
function startSessionFor(teaId, pre){
  if(state.vessels.length===0){ showToast('Add a vessel first — Teas → Vessels.'); goVessels(); return; }
  clearTimerInterval();   // v3.83: never orphan a running tick when the draft is replaced
  const carriedVessel = (pre && pre.vesselId && vesselById(pre.vesselId)) ? pre.vesselId : state.vessels[0].id;
  state.sessionDraft = {
    teaId: teaId || (state.teas.find(t=>!isTeaFinished(t)) || state.teas[0]).id,  // default to an in-stock tea
    vesselId: carriedVessel,
    sessionDate: toLocalDatetimeValue(new Date()),
    whenPick: 'now',                                    // #12's WHEN chips; derived from sessionDate, not a second source of truth
    isColdBrew: false,
    waterType: '',
    waterTDS: '',
    gramsUsed: (pre && pre.gramsUsed) || '',
    // A carried method wins over the vessel-type prefill because it is a RECORD; when the source row
    // held none, the prefill applies as usual — carrying `null` must not mean "no method at all".
    brewStyle: (pre && pre.brewStyle) || methodPrefillFor(carriedVessel),   // v3.91: vessel-type default (B4); null → capacity infer
    waterMl: (pre && pre.waterMl) || '',                // v3.57 optional per-session override; blank = vessel capacity
    steeps: [],
    infusionCount: 1,
    stage: 'setup', // setup -> steeping -> finish  (or setup -> quick)
    schedule: null,                                     // effective schedule (set at beginSteeping)
    timeShift: 0,                                        // v3.30 in-session carry: seconds offset applied to upcoming steeps
    brewMode: state.settings.brewGuideAutofill!==false ? 'guide' : 'off', // 'off' | 'guide' | 'tuned'
    advice: null,                                       // computeBrewAdvice() cache for this session
    feedback: null,                                     // 'good' | 'strong' | 'weak' (optional)
    mood: null,                                          // v3.31 optional pre-brew energy/mood
    curTemp: '', curTime: '',
    curSteepTags: [],
    flavorMore: false,      // WS4 capture: reveal the other two flavour families in place
    flavorFreeOpen: false,  // WS4 capture: the "your own word" free-text door
    curSteepDesc: '',
    sessionTags: [],
    sessionRating: 0,
    sessionDesc: '',
    isShared: false,
    timer: {mode:'timer', target:15, elapsed:0, running:false, intervalId:null}
  };
  state.sessionDraft._pristine = draftFingerprint(state.sessionDraft);  // dirty = any user edit vs this snapshot
  state._draftImage = null;
  state.view='session';
  render();
}
function cancelSession(){
  clearTimerInterval();
  state.sessionDraft=null; state._draftImage=null; state.view='teas'; render();
}
function clearTimerInterval(){
  const tm = state.sessionDraft?.timer;
  if(tm?.intervalId){ clearInterval(tm.intervalId); tm.intervalId=null; }
}

function viewSessionFlow(){
  const d = state.sessionDraft;
  if(!d) return '<div class="empty">No active session.</div>';
  if(d.stage==='setup') return sessionSetupHTML(d);
  if(d.stage==='steeping') return sessionSteepingHTML(d);
  if(d.stage==='finish') return sessionFinishHTML(d);
  if(d.stage==='quick') return sessionQuickHTML(d);
}
function beginQuickLog(){
  const d = state.sessionDraft;
  if(!d.infusionCount || d.infusionCount<1) d.infusionCount = 1;
  d.steeps = []; // quick log carries no timed steeps
  d.stage = 'quick';
  render();
}
function adjustInfusions(delta){
  const d = state.sessionDraft;
  d.infusionCount = Math.max(1, (Number(d.infusionCount)||1) + delta);
  const el = document.getElementById('infusionCountVal');
  if(el) el.textContent = d.infusionCount;
}
/* #12's WHEN field (slice C). The date field is ONE field with two placements, driven by posture:
   folded away on setup (a live cup is "now", right almost always, interesting only when wrong — and
   it already ships inside More details) and promoted here, because a retrospective cup's date is the
   one thing that genuinely needs saying. The chips are relative because that is how the memory
   arrives — "this morning", not "2026-08-05T09:20". Selected chip is JADE: kachi-iro is reserved for
   the Focus ring and appears on exactly one surface (§0.5 contract 4). */
const QUICK_WHEN_CHIPS = [
  { k:'now',       l:'Just now',     at:()=>new Date() },
  { k:'morning',   l:'This morning', at:()=>{ const d=new Date(); d.setHours(9,0,0,0); return d; } },
  { k:'yesterday', l:'Yesterday',    at:()=>{ const d=new Date(); d.setDate(d.getDate()-1); d.setHours(15,0,0,0); return d; } }
];
function d_setWhenChip(k){
  const d = state.sessionDraft; const c = QUICK_WHEN_CHIPS.find(x=>x.k===k); if(!d||!c) return;
  d.sessionDate = toLocalDatetimeValue(c.at());
  d.whenPick = k;
  render();
}
function d_openWhenPicker(){ const d=state.sessionDraft; if(d){ d.whenPick='pick'; render(); } }
// Which chip a date corresponds to, derived from the DATE rather than remembered separately — so a
// date typed in the picker lights the matching chip, and two sources can't disagree about one field.
function quickWhenActive(d){
  if(d.whenPick==='pick') return 'pick';
  const val = d.sessionDate || '';
  for(const c of QUICK_WHEN_CHIPS){ if(toLocalDatetimeValue(c.at()).slice(0,16)===val.slice(0,16)) return c.k; }
  return 'pick';
}
function quickWhenHTML(d){
  const active = quickWhenActive(d);
  const chips = QUICK_WHEN_CHIPS.map(c=>
    `<button type="button" class="when-chip${active===c.k?' active':''}" onclick="d_setWhenChip('${c.k}')">${c.l}</button>`).join('');
  const picked = active==='pick';
  return `<div class="field" style="margin-bottom:16px;">
      <label>When</label>
      <div class="when-chips">${chips}<button type="button" class="when-chip${picked?' active':''}" onclick="d_openWhenPicker()">Pick a date</button></div>
      ${picked ? `<input type="datetime-local" style="margin-top:8px;width:100%;" value="${escapeHtml(d.sessionDate||'')}" onchange="d_set('sessionDate', this.value)">` : ''}
      <div class="when-read mono">${escapeHtml(fmtDateTime(d.sessionDate))}</div>
    </div>`;
}
function sessionQuickHTML(d){
  const tea = teaById(d.teaId);
  /* R88: both pickers, reusing setup's select mechanics rather than inventing a second control — one
     vocabulary across the twins. The tea CARRIES FORWARD from setup (quick log is entered from there
     under R87, where a tea was chosen one tap earlier), so #12's "starts empty" is deliberately not
     built: it would discard a live user choice. The picker changes it; the vessel stays optional and
     never blocks the log (R43). */
  const teaOpts = groupTeasByType(state.teas.filter(t=>!isTeaFinished(t)))
    .map(g=>`<optgroup label="${escapeHtml(g.label)}">${g.teas.map(t=>`<option value="${escapeHtml(t.id)}" ${d.teaId===t.id?'selected':''}>${escapeHtml(t.name)}</option>`).join('')}</optgroup>`).join('');
  const vesselOpts = `<option value="" ${!d.vesselId?'selected':''}>Which vessel? (optional)</option>` +
    state.vessels.map(v=>`<option value="${escapeHtml(v.id)}" ${d.vesselId===v.id?'selected':''}>${escapeHtml(v.name)}</option>`).join('');
  const caret = `<span class="trio-caret">${icon('i-caret-hl',20)}</span>`;
  return `
    <button class="detail-back" onclick="armConfirm(this,'Discard this session log?',()=>cancelSession())">✕ Cancel session</button>
    <div class="card">
      <h2 style="margin-top:0;">${d.isColdBrew?'Cold brew':'Log a cup'}</h2>
      <div class="eyebrow">${d.isColdBrew?'A single long steep — just how it went.':'A cup you already had — jot what you remember.'}</div>
      ${quickWhenHTML(d)}
      <div class="trio-card" style="margin-bottom:16px;">
        <div class="trio-row">
          <div class="trio-eyebrow">Which tea</div>
          <div class="trio-line"><select class="trio-select trio-tea" onchange="d_setTea(this.value)" aria-label="Tea">${teaOpts}</select>${caret}</div>
        </div>
        <div class="trio-row">
          <div class="trio-eyebrow">Vessel <span class="trio-optional">optional</span></div>
          <div class="trio-line"><select class="trio-select" onchange="d_setVessel(this.value)" aria-label="Vessel">${vesselOpts}</select>${caret}</div>
        </div>
      </div>
      ${d.isColdBrew ? `
      <div class="field" style="margin:14px 0;">
        <label>Steep</label>
        <div class="hint">Logged as one long cold steep.</div>
      </div>
      ` : `
      <div class="field" style="margin:14px 0;">
        <label>Infusions</label>
        <div class="infusion-stepper">
          <button type="button" aria-label="one fewer infusion" onclick="adjustInfusions(-1)">−</button>
          <span id="infusionCountVal">${d.infusionCount||1}</span>
          <button type="button" aria-label="one more infusion" onclick="adjustInfusions(1)">＋</button>
        </div>
      </div>
      `}
      <div class="field span2" style="margin:14px 0;">
        <label>Photo (optional)</label>
        <div class="img-upload" id="imgUploadWrap" style="${state._draftImage?`background-image:url(${state._draftImage})`:''}">
          ${state._draftImage?'':'Tap to add a photo of this cup'}
          <input type="file" accept="image/*" class="js-img-input">
        </div>
      </div>
      <div class="field" style="margin-bottom:14px;"><label>Overall rating</label><div id="sessRatingWrap">${renderStarsInteractive(d.sessionRating,true,'setSessionRating')}</div></div>
      ${feedbackRowHTML(d)}
      <div class="field" style="margin-bottom:14px;"><label>Overall notes</label><textarea id="sessDesc" oninput="state.sessionDraft.sessionDesc=this.value">${escapeHtml(d.sessionDesc)}</textarea></div>
      <div class="field">
        <label>Overall tags</label>
        <div>${d.sessionTags.map(t=>`<span class="tagchip">${escapeHtml(t)} <button onclick="removeSessionTag('${escapeJsArg(t)}')">✕</button></span>`).join(' ')}</div>
        <div class="tag-input-wrap">
          <input type="text" id="tagInputField" data-target="session" enterkeyhint="done" placeholder="Type your own, press Enter...">
          <div id="tagSuggestBox"></div>
        </div>
        ${tagLibraryChipsHTML('session')}
      </div>
      <label class="checkrow" style="margin-top:16px;"><input type="checkbox" ${d.isShared?'checked':''} onchange="state.sessionDraft.isShared=this.checked"> Share this session with followers</label>
      ${d.teaId
        ? `<button class="btn btn-primary" style="margin-top:14px;" onclick="commitSession()">Save cup</button>`
        : `<button class="btn btn-primary" style="margin-top:14px;" disabled>Save cup</button>
           <div class="hint" style="margin-top:6px;">Pick a tea first — a cup with no tea isn't a record.</div>`}
    </div>
  `;
}

function sessionSetupHTML(d){
  // Grouped by type (green, white, yellow, oolong, black, puerh, herbal), alpha within — each
  // group an <optgroup> header. Finished teas are hidden by default behind a "show finished" link,
  // but stay loggable (re-weighed tins, a true last session) — revealed as a trailing "Finished"
  // group, and always shown if the current selection is itself finished.
  const active = state.teas.filter(t=>!isTeaFinished(t));
  const finished = state.teas.filter(t=>isTeaFinished(t));
  const showFin = !!d.showFinishedTeas || finished.some(t=>t.id===d.teaId);
  const optHTML = t => `<option value="${escapeHtml(t.id)}" ${d.teaId===t.id?'selected':''}>${escapeHtml(t.name)}</option>`;
  let teaOpts = groupTeasByType(active).map(g=>`<optgroup label="${escapeHtml(g.label)}">${g.teas.map(optHTML).join('')}</optgroup>`).join('');
  if(showFin && finished.length) teaOpts += `<optgroup label="Finished">${sortTeasByTypeThenName(finished).map(optHTML).join('')}</optgroup>`;
  const showFinLink = (finished.length && !showFin)
    ? `<button type="button" onclick="d_showFinishedTeas()" style="margin-top:5px;background:none;border:0;padding:0;color:var(--ink-soft);font-size:11px;text-decoration:underline;cursor:pointer;">show finished (${finished.length})</button>`
    : '';
  const vesselOpts = state.vessels.map(v=>`<option value="${escapeHtml(v.id)}" ${d.vesselId===v.id?'selected':''}>${escapeHtml(v.name)}</option>`).join('');
  // v3.56 capacity precursor: a quiet inline nudge when the chosen vessel has no capacity — taps to
  // its edit form (draft persists behind the overlay). Never a banner, never blocks logging.
  const selVes = vesselById(d.vesselId);
  const capLink = (selVes && !selVes.capacityMl)
    ? `<button type="button" onclick="openVesselForm(vesselById('${escapeJsArg(selVes.id)}'))" style="margin-top:5px;background:none;border:0;padding:0;color:var(--ink-soft);font-size:11px;text-decoration:underline;cursor:pointer;">set capacity — sharpens brew advice</button>`
    : '';
  // WS1: the segment renders the resolved method; senchadō added v3.91 — brewMethodFor returns it for an
  // explicit brewStyle, which the vessel-type prefill (d_setVessel) sets. R72: this is a DRAFT, so
  // resolve:true — the lit lane is what commitSession will store.
  const cap = (selVes||{}).capacityMl || null;
  const methodLanes = methodLanesHTML({ brewStyle:d.brewStyle, isColdBrew:d.isColdBrew, capacityMl:cap,
    resolve:true, onMethod:'d_pickMethodLane', onCold:'d_pickColdLane()', small:true });
  const caret = `<span class="trio-caret">${icon('i-caret-hl',20)}</span>`;
  return `
    <button class="detail-back" onclick="armConfirm(this,'Discard this session log?',()=>cancelSession())">✕ Cancel session</button>
    <h2 style="margin:2px 0 16px;">Set up your session</h2>
    <div class="trio-card">
      <div class="trio-row">
        <div class="trio-eyebrow">Tea</div>
        <div class="trio-line"><select class="trio-select trio-tea" onchange="d_setTea(this.value)" aria-label="Tea">${teaOpts}</select>${caret}</div>
        ${showFinLink}
      </div>
      <div class="trio-row">
        <div class="trio-eyebrow">Vessel</div>
        <div class="trio-line"><select class="trio-select" onchange="d_setVessel(this.value)" aria-label="Vessel">${vesselOpts}</select>${caret}</div>
        ${capLink}
      </div>
      <div class="trio-row trio-method-row">
        <div class="trio-eyebrow">Method</div>
        ${methodLanes}
      </div>
    </div>
    ${!d.isColdBrew ? brewGuidePreviewHTML(d) : ''}
    ${state.settings.showMood ? `<div class="mood-card">
      <div class="mood-title">How are you arriving?</div>
      <div class="mood-sub">optional — quietly helps spot patterns later</div>
      ${moodChipsHTML(d.mood, 'd_setMood')}
      ${moodUptakeHTML()}
    </div>` : ''}
    <div class="fold-row" onclick="d_toggleMoreDetails()" role="button" aria-expanded="${!!d.showMoreDetails}">
      <span class="fold-label">More details <span class="fold-sub">· leaf, water, cold brew</span></span>
      <span class="fold-caret">${icon(d.showMoreDetails?'i-caret-up-hl':'i-caret-hl',22)}</span>
    </div>
    ${d.showMoreDetails ? `<div class="form-grid fold-grid">
      <div class="field"><label>Leaf (g)</label><input type="number" step="0.1" value="${d.gramsUsed}" oninput="d_set('gramsUsed', this.value)"></div>
      <div class="field"><label>Water (ml)</label><input type="number" value="${d.waterMl}" oninput="d_set('waterMl', this.value)" placeholder="${cap||''}"></div>
      <div class="field"><label>Water type</label><input type="text" value="${escapeHtml(d.waterType)}" oninput="d_set('waterType', this.value)" placeholder="filtered, spring…"></div>
      <div class="field"><label>TDS (ppm)</label><input type="number" value="${d.waterTDS}" oninput="d_set('waterTDS', this.value)" placeholder="—"></div>
      <div class="field span2"><label>When</label><input type="datetime-local" value="${d.sessionDate}" onchange="d_set('sessionDate', this.value)"></div>
    </div>` : ''}
    ${d.isColdBrew ? `
      <button class="btn btn-primary begin-btn" onclick="beginColdBrewLog()">Log cold brew →</button>
      <div class="hint" style="margin-top:8px;">Cold brew is logged as a single long steep — no per-steep timer.</div>
    ` : `
      <button class="btn btn-primary begin-btn" onclick="beginSteeping()">Begin steeping</button>
      <button class="btn" style="margin-top:8px;width:100%;" onclick="beginQuickLog()">Quick log — just infusions & notes</button>
    `}
  `;
}
// WS1: the session method segment — senchadō added v3.91 (a data change, no layout rebuild). Gongfu
// beside it (both East-Asian multi-infusion), western last.
const SESSION_METHODS = [{k:'gongfu',label:'Gongfu'},{k:'senchado',label:'Senchadō'},{k:'western',label:'Western'}];
// R50/R64/R72 — the method control is FOUR drawn lanes: the three above plus cold brew as a peer
// lane, replacing the old separate checkbox. Storage is unchanged: the cold lane sets is_cold_brew,
// and commitSession already nulls brewStyle for a cold brew (:1285), so mutual exclusion needs no
// new logic.
//
// `resolve` is the whole point of the flag, and the two surfaces genuinely differ (R72):
//   resolve:true  — a DRAFT (#04 setup). Light the lane commitSession will actually store. The show
//                   IS the store, one moment early, so a resolved lane is a prediction the app then
//                   honours rather than a guess presented as a fact.
//   resolve:false — a RECORD (#02b edit). Show only stored brew_style. A lit lane over a null column
//                   would be the app claiming to know something it doesn't (R64). The derived reading
//                   lives separately in the read-only esMethodReadLabel().
const COLD_LANE_KEY = '__cold';
function methodLanesHTML(cfg){
  const cur = cfg.isColdBrew ? COLD_LANE_KEY
            : (cfg.resolve ? brewMethodFor(cfg.brewStyle, cfg.capacityMl) : (cfg.brewStyle || ''));
  const lanes = SESSION_METHODS.concat([{k:COLD_LANE_KEY, label:'Cold brew'}]);
  return `<div class="seg${cfg.small?' seg-sm':''} seg-lanes">` + lanes.map(m=>{
    const cb = m.k===COLD_LANE_KEY ? cfg.onCold : `${cfg.onMethod}('${m.k}')`;
    return `<button type="button" class="${cur===m.k?'active':''}" onclick="${cb}">${escapeHtml(m.label)}</button>`;
  }).join('') + `</div>`;
}
// Lane pickers: composition only. Every state assignment still happens inside the existing setters
// (d_setColdBrew / d_setBrewStyle / es_set / es_setBrewStyle) — picking a method lane has to leave
// cold-brew mode now that the two are peers, and the double render on that rare transition is
// cheaper than a second writer.
function d_pickMethodLane(m){ const d=state.sessionDraft; if(!d) return; if(d.isColdBrew) d_setColdBrew(false); d_setBrewStyle(m); }
function d_pickColdLane(){ if(state.sessionDraft) d_setColdBrew(true); }
function es_pickMethodLane(m){ const e=state.editingSession; if(!e) return; if(e.isColdBrew) es_set('isColdBrew', false); es_setBrewStyle(m); }
function es_pickColdLane(){ if(!state.editingSession) return; es_set('isColdBrew', true); render(); }
function d_toggleMoreDetails(){ const d=state.sessionDraft; if(d){ d.showMoreDetails=!d.showMoreDetails; render(); } }
function d_set(key, val){
  state.sessionDraft[key] = val;
}
function d_setcur(key, val){
  state.sessionDraft[key] = val;
}
function d_setTea(val){ state.sessionDraft.teaId = val; render(); }   // re-render so the guide preview follows the tea
function d_showFinishedTeas(){ state.sessionDraft.showFinishedTeas = true; render(); }   // reveal finished teas in the picker (they stay loggable)
function d_setBrewStyle(m){ const d=state.sessionDraft; d.brewStyle = m; d.brewStyleLocked = true; render(); } // explicit tap wins over the vessel-type prefill
// Vessel-type → method default (B4, v3.91): the capacity heuristic misclassifies both Japanese vessels
// (a 210ml kyusu reads western, a 73ml shiboridashi gongfu), so selecting a vessel sets brewStyle
// EXPLICITLY from its type. A default, not a lock — an explicit method tap (brewStyleLocked) always
// wins; unmapped types leave it null and fall through to the capacity heuristic as before.
const VESSEL_METHOD_PREFILL = { 'Gaiwan':'gongfu', 'Kyusu':'senchado', 'Shiboridashi':'senchado' };
function methodPrefillFor(vesselId){ const v=vesselById(vesselId); return (v && VESSEL_METHOD_PREFILL[v.type]) || null; }
function d_setVessel(val){ const d=state.sessionDraft; if(!d) return; d.vesselId = val; if(!d.brewStyleLocked) d.brewStyle = methodPrefillFor(val); render(); }

/* #04 draws the mood card with a "48% (15/31)" pill. That literal is a stamped SNAPSHOT (R67/R68) —
   it was 48% of 31 sessions when the board was drawn and it is a different number now. So it is
   COMPUTED from the user's own sessions rather than transcribed, and it is omitted entirely below a
   handful of sessions, when a percentage of almost nothing says less than silence. It is a quiet
   fact about the user's own habit, not a nudge: no target, no comparison, no encouragement. */
const MOOD_UPTAKE_MIN_SESSIONS = 8;
function moodUptakeHTML(){
  const all = (state.sessions||[]).length;
  if(all < MOOD_UPTAKE_MIN_SESSIONS) return '';
  const withMood = state.sessions.filter(s=>s.mood).length;
  if(!withMood) return '';
  return `<div class="mood-uptake mono">noted on ${withMood} of your ${all} sittings</div>`;
}
// v3.31 optional pre-brew mood/energy — captured at setup so it's tied to the session
// (and the time of day), the reading the future sleep/caffeine correlation will lean on.
const MOODS = ['Drained','Low','Steady','Lively','Wired'];
function moodChipsHTML(current, cb){
  // WS1: single-select arrival mood, amber when chosen (the "how are you arriving?" moment).
  return `<div class="mood-chips">` + MOODS.map(m=>{
    const on = current===m;
    return `<button type="button" class="mood-chip${on?' on':''}" onclick="${cb}('${m}')">${m}</button>`;
  }).join('') + `</div>`;
}
function d_setMood(m){ const d=state.sessionDraft; d.mood = (d.mood===m)?null:m; render(); }
function setEditSessionMood(m){ const e=state.editingSession; e.mood = (e.mood===m)?null:m;
  const w=document.getElementById('editMoodWrap'); if(w) w.innerHTML=moodChipsHTML(e.mood||null,'setEditSessionMood'); }
function d_setBrewMode(mode){ state.sessionDraft.brewMode = mode; state.sessionDraft.timeShift = 0; render(); }
// v3.68: reversible in-session hide of the schedule strip — leaves brewMode/schedule/timeShift intact.
function d_hideStrip(){ if(state.sessionDraft){ state.sessionDraft.scheduleHidden = true; render(); } }
function d_showStrip(){ if(state.sessionDraft){ state.sessionDraft.scheduleHidden = false; render(); } }

// Setup preview: the tea's brew guide plus, once there's session feedback, a
// gently tuned "your tuning" option and a memory of how past cups landed.
// A Guide / Tuned / Off selector picks what prefills the steeps. Cold brew and
// teas with nothing to show are skipped (calm-first — no empty cards).
function brewGuidePreviewHTML(d){
  if(d.isColdBrew) return '';
  const tea = teaById(d.teaId);
  const adviceOn = state.settings.brewAdvice!==false;
  const rawBase = effectiveGuideSchedule(tea, adviceOn);
  // v3.57: ratio scales the base BEFORE feedback tuning (base → ratio → feedback → timeShift).
  // Null when opt-in is off or grams/water are missing, so this path is byte-identical when off.
  const ves = vesselById(d.vesselId);
  const ratio = computeSessionRatio(tea, { gramsUsed:d.gramsUsed, waterMl:d.waterMl, brewStyle:d.brewStyle, capacityMl:ves&&ves.capacityMl, isColdBrew:d.isColdBrew });
  const base = (ratio && ratio.applied) ? ratioScaleSchedule(rawBase, ratio.timeFactor) : rawBase;
  const adv = adviceOn ? computeBrewAdvice(tea, base) : (base?{base,tuned:base,hasNudge:false,count:0}:null);
  if(!base && !(adv && adv.hasNudge)) return '';
  // keep brewMode valid for what's available
  if(d.brewMode==='tuned' && !(adv && adv.hasNudge)) d.brewMode = base ? 'guide' : 'off';
  if(d.brewMode==='guide' && !base) d.brewMode = (adv && adv.hasNudge) ? 'tuned' : 'off';

  const opt = (mode,label)=>`<button class="${d.brewMode===mode?'active':''}" onclick="d_setBrewMode('${mode}')">${label}</button>`;
  const seg = `<div class="seg" style="margin-top:10px;">${base?opt('guide','Guide'):''}${(adv&&adv.hasNudge)?opt('tuned','Your tuning'):''}${opt('off','Off')}</div>`;
  const shownSched = d.brewMode==='tuned' ? (adv&&adv.tuned) : base;
  const summary = shownSched ? `<div class="mono" style="font-size:13px;margin-top:2px;">${brewScheduleSummary(shownSched)}</div>` : '';
  const memory = (adv && adv.count) ? `<div style="font-size:11.5px;color:var(--ink-soft);margin-top:8px;">${adviceMemoryText(adv)}${adv.hasNudge?` — suggests ${adviceSuggestionText(adv)}.`:' — landing well; using your guide as-is.'}</div>` : '';
  const ratioMemo = (ratio && d.brewMode!=='off') ? `<div style="font-size:11.5px;color:var(--ink-soft);margin-top:6px;">${ratioMemoryText(ratio)}</div>` : '';
  const saveLink = (d.brewMode==='tuned' && adv && adv.hasNudge)
    ? `<div style="margin-top:8px;"><button class="btn-ghost" style="font-size:11.5px;padding:0;" onclick="saveTuningToGuide('${tea.id}')">Save this tuning as the tea\u2019s brew guide →</button></div>` : '';
  const generatedNow = !!(base && base.generated) && d.brewMode!=='tuned';
  const hint = d.brewMode==='off'
    ? 'Steeps start blank.'
    : (d.brewMode==='tuned' ? 'Prefills each steep from your tuned times \u2014 still fully editable.'
      : (generatedNow ? 'Suggested from the leaf type \u2014 no guide saved yet, so adjust freely as you go.'
        : 'Prefills each steep\u2019s timer and temperature \u2014 adjust as you go.'));
  /* #04 rev 6: the strip names its own derivation \u2014 "not the saved guide" is the whole point, and a
     reader who can't see the chain has to take the numbers on faith. GENERATED, never a static string
     (R68): each stage is listed only when it actually fired, so the line can't claim a ratio scaling
     that didn't happen or omit one that did. `off` shows nothing, because nothing is derived. */
  const chain = [];
  if(d.brewMode!=='off'){
    chain.push(generatedNow ? 'leaf type' : 'your brew guide');
    if(ratio && ratio.applied) chain.push('ratio-scaled');
    if(d.brewMode==='tuned') chain.push('your tuning');
  }
  const derivation = chain.length>1
    ? `<div class="mono sched-derivation">${chain.map(escapeHtml).join(' \u2192 ')}</div>` : '';
  return `<div class="card" style="margin-top:14px;background:var(--jade-pale);border:1px solid var(--line);">
    <div class="eyebrow">${d.brewMode==='tuned'?'Your tuning':(generatedNow?'Suggested \u00b7 '+LEAF_PROFILES[base.form].label:'From your brew guide')}</div>
    ${summary}
    ${derivation}
    ${seg}
    ${memory}
    ${ratioMemo}
    <div style="font-size:11.5px;color:var(--ink-soft);margin-top:8px;">${hint}</div>
    ${saveLink}
  </div>`;
}
// Write a schedule back into the tea's free-text brew guide, and mark "tuned as of
// now" in synced settings so past feedback doesn't keep re-nudging the new baseline.
function saveTuningToGuide(teaId){
  const tea = teaById(teaId); if(!tea) return;
  const adv = computeBrewAdvice(tea); if(!adv || !adv.hasNudge) return;
  tea.brewGuide = scheduleToGuideText(adv.tuned);
  persistTea(tea);
  state.settings.brewTunedAt = { ...(state.settings.brewTunedAt||{}), [teaId]: new Date().toISOString() };
  persistSettings();
  if(state.sessionDraft) state.sessionDraft.brewMode = 'guide';
  showToast('Saved to “'+tea.name+'” brew guide');
  render();
}

// Prefill the current steep's timer + temp from the effective schedule, plus any
// in-session carry (manual edits + last-pour nudges) so an adjustment sticks instead
// of the schedule snapping back to its upward march each steep.
function applyScheduleToCurrentSteep(d){
  if(!d) return;
  // No guide (brewMode 'off'): still seed a sane countdown so target + logged time agree (#13).
  if(!d.schedule){ if(d.timer.mode==='timer' && !(Number(d.curTime)>0)) setSteepTime(d.timer.target||15); return; }
  const i = d.steeps.length;
  d.activeSteep = i; // WS3: the pill for the steep you're about to brew is the active one
  const t = scheduleTimeForIndex(d.schedule, i);
  if(t!=null){ d.timer.mode='timer'; setSteepTime(Math.max(3, Math.round(t + (d.timeShift||0)))); }
  if(d.schedule.tempC!=null){ const disp=cToDisplay(d.schedule.tempC); if(disp!=='') d.curTemp=String(disp); }
}
// WS3: tap a brew-guide pill → time that steep. Sets the ring's target + the "steep N" label; the
// countdown resets so the ring reads that steep's duration. Purely a timer selector — logging still
// happens sequentially via Save steep. Ignores pills at/behind an already-logged steep index only for
// the target math (a tapped index past the schedule falls back to the last known time).
function d_setActiveSteep(i){
  const d = state.sessionDraft; if(!d || !d.schedule) return;
  const t = scheduleTimeForIndex(d.schedule, i); if(t==null) return;
  d.activeSteep = i;
  clearTimerInterval();
  d.timer.mode = 'timer'; d.timer.elapsed = 0; d.timer.running = false; d.timeEditing = false;
  setSteepTime(Math.max(3, Math.round(t + (d.timeShift||0))));
  render();
}
// Per-steep taste is captured (and echoed) only for the multi-infusion methods — the §3 quietness
// gate — resolved through brewMethodFor so it agrees with the setup segment. Also off when brewAdvice is
// (one switch governs the whole loop). Single source for both the nudge's write and the card's echo.
function steepFbActive(d){
  if(!d || d.isColdBrew || state.settings.brewAdvice===false) return false;
  const ves = vesselById(d.vesselId);
  return ['gongfu','senchado'].includes(brewMethodFor(d.brewStyle, ves&&ves.capacityMl));
}
// Nudge the *next* steep from how the last pour tasted, AND record that taste on the pour itself.
// timeShift is the ephemeral in-session carry (unchanged, every method). v3.92: the same tap now also
// writes the persistent steep.feedback (weak→weak · ok→good · strong→strong) so "Just right" stops
// silently dropping the signal the phase-2 gate reads — this is now the *only* writer of that field
// (the per-steep card is a read-only echo). Feedback write is §3-gated (steepFbActive); western still
// only nudges the timer. Last-write-wins, not toggle-clear — timeShift accumulates, so a re-tap can't
// mean "clear" here without the two axes disagreeing.
function d_nudgeNextSteep(kind){
  const d = state.sessionDraft; if(!d || !d.schedule) return;
  const STEP=5, clamp=x=>Math.max(-45, Math.min(45, x));
  if(kind==='weak') d.timeShift = clamp((d.timeShift||0)+STEP);        // under-extracted → longer
  else if(kind==='strong') d.timeShift = clamp((d.timeShift||0)-STEP); // over-extracted → shorter
  // 'ok' leaves the current carry as-is (timeShift behaviour unchanged; the write below is the new part)
  const last = d.steeps.length ? d.steeps[d.steeps.length-1] : null;   // the pour "that" refers to
  if(last && steepFbActive(d)) last.feedback = (kind==='weak') ? 'weak' : (kind==='strong') ? 'strong' : 'good';
  applyScheduleToCurrentSteep(d);
  render();
}
function brewNudgeRowHTML(d){
  if(!d.schedule || !d.steeps.length || d.scheduleHidden) return '';
  const shift = d.timeShift||0;
  const rec = steepFbActive(d) ? (d.steeps[d.steeps.length-1].feedback||null) : null; // recorded verdict for this pour
  const on = { weak:'weak', ok:'good', strong:'strong' };
  const chip=(k,l)=>`<button type="button" class="lib-chip ${rec===on[k]?'active':''}" onclick="d_nudgeNextSteep('${k}')">${l}</button>`;
  /* #10's ✓ SAVED (v4.01). The WRITE has shipped since v3.92 and this is a read of
     steeps[i].feedback — no write change. It is worth drawing precisely because the write has been
     silent for weeks: a verdict registered and a verdict stored looked identical on screen, so the
     app was under-reporting its own reliability. The distinction the board draws is committed-vs-
     ephemeral, which is exactly what the old bare "saved" word failed to carry. */
  const saved = rec ? `<span class="pour-saved mono">✓ saved</span>` : '';
  const note = shift ? `<span style="font-size:11px;color:var(--ink-soft);">next steep ${shift>0?'+':''}${shift}s vs guide</span>` : '';
  return `<div class="pour-row">
    <span class="pour-q">Steep ${d.steeps.length} — how did it pour?</span>
    <span class="pour-chips">${chip('weak','Weak → longer')}${chip('ok','Just right')}${chip('strong','Strong → shorter')}</span>
    ${saved}${note}
  </div>`;
}

// Per-steep verdict has a single writer now — the nudge (d_nudgeNextSteep) records it on the pour you
// just finished (v3.92). This is the quiet READ-ONLY echo on each completed steep card: it was v3.89's
// tappable "strength?" marker, whose write duplicated the nudge's field (the "two controls, one field"
// duplication). Observational copy; renders only once a verdict exists; §3-gated by steepFbActive at the
// call site. Persists in-draft via d.steeps → steepToDb at commit, unchanged.
const STEEP_FB_LABELS = { weak:'a touch weak', good:'good', strong:'a touch strong' };
function steepFeedbackHTML(d, i){
  const fb = (d.steeps[i]||{}).feedback || null;
  if(!fb) return '';
  return `<div style="margin-top:6px;font-size:11px;color:var(--ink-soft);">· ${STEEP_FB_LABELS[fb]}</div>`;
}

function beginSteeping(){
  const d = state.sessionDraft;
  const tea = teaById(d.teaId);
  const rawBase = (!d.isColdBrew) ? effectiveGuideSchedule(tea, state.settings.brewAdvice!==false) : null;
  const ves = vesselById(d.vesselId);
  const ratio = (!d.isColdBrew) ? computeSessionRatio(tea, { gramsUsed:d.gramsUsed, waterMl:d.waterMl, brewStyle:d.brewStyle, capacityMl:ves&&ves.capacityMl, isColdBrew:d.isColdBrew }) : null;
  const base = (ratio && ratio.applied) ? ratioScaleSchedule(rawBase, ratio.timeFactor) : rawBase;
  d.advice = (!d.isColdBrew && state.settings.brewAdvice!==false) ? computeBrewAdvice(tea, base) : null;
  if(d.brewMode==='tuned') d.schedule = (d.advice && d.advice.hasNudge) ? d.advice.tuned : base;
  else if(d.brewMode==='guide') d.schedule = base;
  else d.schedule = null;
  d.timeShift = 0;
  d.scheduleHidden = false;
  d.flavorMore = false; d.flavorFreeOpen = false;
  d.stage='steeping';
  state.navRestored = false; // WS6: the bottom bar recedes for each fresh steep until swiped back up
  applyScheduleToCurrentSteep(d);
  render();
}
function d_setColdBrew(v){ state.sessionDraft.isColdBrew = v; render(); } // re-render so the setup buttons swap
function beginColdBrewLog(){
  const d = state.sessionDraft;
  d.isColdBrew = true; d.infusionCount = 1; d.steeps = []; // one long steep, no timed infusions
  d.stage = 'quick';
  render();
}

// Calm strip during steeping: the guide's temp + steep times as chips, with the
// current step marked and extended steeps flagged "~". A quiet link turns it off.
function scheduleStripHTML(d){
  if(!d.schedule) return '';
  // v3.68: a quiet, reversible hide (not the old "turn off" that silently reset the
  // in-session nudge and left the card on screen). Collapses to a one-line "show" ghost.
  if(d.scheduleHidden) return `<div class="card" style="margin-bottom:14px;background:var(--jade-pale);border:1px solid var(--line);padding:9px 14px;display:flex;align-items:center;justify-content:space-between;gap:8px;">
      <div class="eyebrow" style="opacity:.65;">Brew guide · hidden</div>
      <button class="btn-ghost" style="font-size:11.5px;" onclick="d_showStrip()">show</button>
    </div>`;
  const sched = d.schedule;
  const cur = d.activeSteep!=null ? d.activeSteep : d.steeps.length; // WS3: the selected pill
  const shownCount = Math.max(sched.times.length, d.steeps.length+1);
  // WS3: the brew-guide pills ARE the steep schedule — no separate dot row. Tap a pill to time it.
  let pills='';
  for(let i=0;i<shownCount;i++){
    const secs = scheduleTimeForIndex(sched, i);
    if(secs==null) break;
    const beyond = i>=sched.times.length;
    const isCur = i===cur;
    pills += `<button type="button" class="steep-pill${isCur?' active':''}" onclick="d_setActiveSteep(${i})">
      <span class="sp-idx">${isCur?('steep '+(i+1)):(i+1)}</span>
      <span class="sp-dur">${beyond?'~':''}${fmtSecShort(secs)}</span>
    </button>`;
  }
  const meta=[];
  if(sched.tempC!=null) meta.push(cToDisplay(sched.tempC)+tempUnitLabel());
  if(Number(d.gramsUsed)>0) meta.push(Number(d.gramsUsed)+'g');
  else if(sched.rinseSeconds!=null) meta.push('rinse '+sched.rinseSeconds+'s');
  const label = d.brewMode==='tuned' ? 'Your tuning' : (sched.generated ? 'Suggested' : 'Brew guide');
  return `<div class="bg-card">
    <div class="bg-head">
      <div class="eyebrow" style="color:var(--jade-deep);">${label}${meta.length?' · '+meta.join(' · '):''}</div>
      <button class="btn-ghost bg-hide" onclick="d_hideStrip()">hide</button>
    </div>
    <div class="steep-pills">${pills}</div>
  </div>`;
}

// WS4 capture — inline flavour chips beneath the timer, saved live to the active steep's
// curSteepTags (committed into steeps[].tags on saveSteepAndContinue). Two families by default;
// "more" reveals the other two in place; a quiet door opens a free-text input. Never a modal,
// never required — skipping leaves no gap. Vocab is stored bare (bare + membership scheme).
function flavorCaptureHTML(d){
  const sel = d.curSteepTags || [];
  const shown = d.flavorMore ? KB_FLAVOR_FAMILIES : KB_FLAVOR_FAMILIES.slice(0, FLAVOR_DEFAULT_FAMILIES);
  const families = shown.map(f=>`
    <div class="flav-fam">
      <div class="flav-eyebrow">${escapeHtml(f.label)}</div>
      <div class="flav-chips">${f.terms.map(t=>`<button type="button" class="flav-chip${sel.includes(t)?' on':''}" onclick="toggleFlavor('${escapeJsArg(t)}')">${escapeHtml(flavorLabel(t))}</button>`).join('')}</div>
    </div>`).join('');
  const hidden = KB_FLAVOR_FAMILIES.slice(FLAVOR_DEFAULT_FAMILIES);
  const hiddenCount = hidden.reduce((n,f)=>n+f.terms.length,0);
  const teaser = hidden.map(f=>f.terms[0]).join(', '); // "roast, spice"
  const moreRow = d.flavorMore
    ? `<button type="button" class="flav-more" onclick="d_flavorMore(false)">${icon('i-caret-up-hl',18)}<span>fewer flavours</span></button>`
    : `<button type="button" class="flav-more" onclick="d_flavorMore(true)">${icon('i-caret-hl',18)}<span>${hiddenCount} more flavours · ${escapeHtml(teaser)}</span></button>`;
  // Free-typed words already chosen (not vocabulary) stay visible + removable — nothing hidden.
  const freeSel = sel.filter(t=>!isFlavorVocab(t));
  const freeChips = freeSel.length ? `<div class="flav-freesel">${freeSel.map(t=>`<span class="flav-chip on">${escapeHtml(t)} <button onclick="removeCurTag('${escapeJsArg(t)}')" aria-label="remove ${escapeHtml(t)}">✕</button></span>`).join('')}</div>` : '';
  const freeDoor = d.flavorFreeOpen
    ? `<div class="tag-input-wrap"><input type="text" id="tagInputField" data-target="steep" enterkeyhint="done" placeholder="your own word, press Enter…"><div id="tagSuggestBox"></div></div>`
    : `<button type="button" class="flav-door" onclick="d_flavorFreeOpen()">${icon('i-plus-hl',18)}<span>your own word</span></button>`;
  return `
    <div class="flav-capture">
      <div class="flav-prompt"><span class="flav-q">What are you tasting?</span><span class="flav-opt mono">optional</span></div>
      ${families}
      ${moreRow}
      <div class="flav-free">${freeDoor}${freeChips}</div>
      <div class="flav-reassure mono">saved as you tap — nothing to submit</div>
    </div>`;
}
function toggleFlavor(term){
  const d = state.sessionDraft; if(!d) return;
  term = String(term).toLowerCase();
  const i = d.curSteepTags.indexOf(term);
  if(i>=0) d.curSteepTags.splice(i,1); else d.curSteepTags.push(term);
  render();
}
function d_flavorMore(v){ if(state.sessionDraft){ state.sessionDraft.flavorMore=!!v; render(); } }
function d_flavorFreeOpen(){ if(state.sessionDraft){ state.sessionDraft.flavorFreeOpen=true; render(); setTimeout(()=>{ const el=document.getElementById('tagInputField'); if(el) el.focus(); },0); } }

function sessionSteepingHTML(d){
  const tea = teaById(d.teaId);
  const tm = d.timer;
  // Per-steep verdict echo rides the same §3 gate as the nudge's write (steepFbActive: brewAdvice on,
  // not cold brew, gongfu/senchadō) so the cards and the writer always agree. Cold brew → no cards.
  const showSteepFb = steepFbActive(d);
  const steepsHTML = d.steeps.map((s,i)=>`
    <div class="steep-item">
      <div class="steep-head"><span>Steep ${i+1}</span><span class="mono">${(s.tempC!=null&&s.tempC!=='')?cToDisplay(s.tempC)+tempUnitLabel()+' · ':''}${fmtSec(s.timeSeconds)}</span></div>
      ${s.description?`<div style="margin-top:3px;color:var(--ink-soft);">${escapeHtml(s.description)}</div>`:''}
      ${s.tags.length?`<div class="steep-tags">${s.tags.map(t=>`<span class="tagchip">${escapeHtml(t)}</span>`).join(' ')}</div>`:''}
      ${showSteepFb?steepFeedbackHTML(d,i):''}
    </div>
  `).join('');

  const modeBtns = `
    <div class="timer-modebtns">
      <button class="${tm.mode==='timer'?'active':''}" onclick="setTimerMode('timer')">Countdown</button>
      <button class="${tm.mode==='stopwatch'?'active':''}" onclick="setTimerMode('stopwatch')">Stopwatch</button>
    </div>`;

  const displaySeconds = tm.mode==='timer' ? Math.max(0, tm.target - tm.elapsed) : tm.elapsed;
  const active = (d.activeSteep!=null ? d.activeSteep : d.steeps.length);
  // #13: the countdown length is tap-to-edit here (only while stopped) — it IS the logged steep time.
  let subLabel;
  if(tm.mode!=='timer'){ subLabel = `steep ${active+1}`; }
  else if(d.timeEditing){ subLabel = `of <input type="number" id="timerTargetEdit" class="timer-target-inline" value="${tm.target||''}" oninput="setSteepTime(this.value)" onblur="d_endTimeEdit()" onkeydown="if(event.key==='Enter'){this.blur();}">s · steep ${active+1}`; }
  else if(!tm.running){ subLabel = `of <button type="button" class="timer-target-tap" onclick="d_beginTimeEdit()"><span id="timerTargetLabel">${tm.target}</span>s</button> · steep ${active+1}`; }
  else { subLabel = `of <span id="timerTargetLabel">${tm.target}</span>s · steep ${active+1}`; }
  const soundOn = !!state.settings.soundEnabled;

  return `
    <div class="steep-titlebar">
      <button class="steep-back" onclick="armConfirm(this,'Discard this session log?',()=>cancelSession())" aria-label="Cancel session">${icon('i-chevron-hl',23)}</button>
      <span class="steep-title">${tea?escapeHtml(tea.name):'Steeping'}${d.isColdBrew?' · cold brew':''}</span>
      <button class="steep-mute" onclick="toggleSound()" aria-label="${soundOn?'Sound on':'Sound off'}" title="${soundOn?'Chime on — tap to mute':'Muted — tap for a single gentle chime at 0:00'}">${icon(soundOn?'i-sound-hl':'i-mute-hl',21)}</button>
    </div>

    ${steepContextHTML(d)}
    ${scheduleStripHTML(d)}
    ${brewNudgeRowHTML(d)}

    <div class="timer-box">
      ${modeBtns}
      <div class="timer-ring">
        <div class="timer-enso-wrap">
          <svg class="timer-enso" viewBox="0 0 120 120" aria-hidden="true">
            <path class="enso-track" d="M60 15 a45 45 0 1 0 33 14" fill="none" stroke-width="5.5" stroke-linecap="round" pathLength="100"/>
            <path id="ensoArc" class="enso-arc" d="M60 15 a45 45 0 1 0 33 14" fill="none" stroke-width="6.5" stroke-linecap="round" pathLength="100" stroke-dasharray="100" stroke-dashoffset="${(100*(1-focusProgress(tm))).toFixed(1)}"/>
          </svg>
        </div>
        <div class="timer-center">
          <div class="timer-display">${fmtSec(displaySeconds)}</div>
          <div class="timer-sub">${subLabel}</div>
        </div>
      </div>
      <div class="timer-ctrls">
        <button onclick="timerStartPause()">${tm.running?'Pause':'Start'}</button>
        <button class="soft" onclick="timerReset()">Reset</button>
        ${tm.mode==='stopwatch' ? `<button class="soft wide" onclick="useTimerValue()">Use time</button>` : ''}
      </div>
      <div class="timer-focus" onclick="toggleFocusMode()" role="button">${icon('i-focus-hl',18)}<span>Enter focus mode</span></div>
    </div>

    ${flavorCaptureHTML(d)}

    ${d.steeps.length ? `<div style="margin-top:14px;">${steepsHTML}</div>` : ''}

      <div class="form-grid" style="margin-top:14px;">
        <div class="field"><label>Water temp (${tempUnitLabel()})</label><input type="number" id="steepTemp" value="${d.curTemp||''}" oninput="d_setcur('curTemp', this.value)"></div>
        <div class="field"><label>Steep time (seconds)</label><input type="number" id="steepTime" value="${d.curTime||''}" oninput="setSteepTime(this.value)"></div>
        <div class="field span2"><label>Notes for this steep</label><textarea id="steepDesc" oninput="d_setcur('curSteepDesc', this.value)">${d.curSteepDesc||''}</textarea></div>
      </div>

      <div style="display:flex;gap:8px;margin-top:16px;flex-wrap:wrap;">
        <button class="btn btn-primary" onclick="saveSteepAndContinue()">Save steep & brew another</button>
        <button class="btn" onclick="finishSteeping()">Finish session</button>
      </div>
  `;
}

/* #10's context line under the title: "95°C · guide 25s · Dragon Gaiwan". GENERATED from the draft
   (R68), with each part omitted when it has no value rather than rendered empty — a fixed string
   here would claim a temperature the session doesn't carry. It is a read of what is already on
   screen elsewhere, gathered into one place at the moment the ring is what you're looking at. */
function steepContextHTML(d){
  const parts = [];
  const temp = d.curTemp!=='' && d.curTemp!=null ? d.curTemp : (d.schedule && d.schedule.tempC!=null ? cToDisplay(d.schedule.tempC) : '');
  if(temp!=='' && temp!=null) parts.push(temp + tempUnitLabel());
  const active = (d.activeSteep!=null ? d.activeSteep : d.steeps.length);
  const guide = d.schedule ? scheduleTimeForIndex(d.schedule, active) : null;
  if(guide) parts.push('guide ' + fmtSecShort(guide));
  const ves = vesselById(d.vesselId);
  if(ves) parts.push(ves.name);
  if(!parts.length) return '';
  return `<div class="steep-context mono">${escapeHtml(parts.join(' · '))}</div>`;
}
function toggleFocusMode(){ state.sessionDraft.focusMode=!state.sessionDraft.focusMode; render(); }
function focusProgress(tm){ return tm.mode==='timer' ? (tm.target>0?Math.min(1,tm.elapsed/tm.target):0) : Math.min(1,tm.elapsed/60); }
// WS3: opt-in sound. The steeping mute glyph toggles the synced soundEnabled setting; default OFF.
function toggleSound(){
  state.settings.soundEnabled = !state.settings.soundEnabled;
  if(typeof persistSettings==='function') persistSettings(); else if(window.SteepDB) window.SteepDB.saveSettings(state.settings);
  if(state.settings.soundEnabled){ try{ if(!_audioCtx) _audioCtx=new (window.AudioContext||window.webkitAudioContext)(); _audioCtx.resume&&_audioCtx.resume(); }catch(e){} } // unlock audio on the enabling tap
  render();
}
// WS3: Focus mode is a real breath-led place, not a header-hide. The ring breathes; steeps become a
// mala down the edge; the arc still fills with the steep. Always dark (a meditative night state),
// independent of theme. Tap the ring to pause; swipe up (or tap the hint) to leave.
function sessionFocusHTML(d){
  const tea = teaById(d.teaId);
  const tm = d.timer;
  const active = (d.activeSteep!=null ? d.activeSteep : d.steeps.length);
  const disp = tm.mode==='timer' ? Math.max(0, tm.target-tm.elapsed) : tm.elapsed;
  const n = d.schedule ? Math.max(d.schedule.times.length, active+1) : Math.max(active+1, 4);
  let mala=''; for(let i=0;i<n;i++) mala += `<span class="mala-dot${i===active?' on':''}"></span>`;
  return `
    <div class="focus-glow"></div>
    <div class="focus-mala">${mala}</div>
    <div class="focus-head">${tea?escapeHtml(tea.name):'Steeping'} · steep ${active+1}</div>
    <div class="focus-ringwrap" id="focusRing" onclick="timerStartPause()" role="button" aria-label="Tap to pause or resume">
      <div class="focus-halo"></div>
      <div class="focus-enso-breathe">
        <svg class="focus-enso" viewBox="0 0 120 120" aria-hidden="true">
          <path class="enso-track" d="M60 15 a45 45 0 1 0 33 14" fill="none" stroke-width="5" stroke-linecap="round" pathLength="100"/>
          <path id="focusEnsoArc" class="enso-arc" d="M60 15 a45 45 0 1 0 33 14" fill="none" stroke-width="6" stroke-linecap="round" pathLength="100" stroke-dasharray="100" stroke-dashoffset="${(100*(1-focusProgress(tm))).toFixed(1)}"/>
        </svg>
      </div>
      <div class="focus-center">
        <div class="focus-digit" id="focusTime">${fmtSec(disp)}</div>
        <div class="focus-cue">${tm.running?'breathe out':'paused'}</div>
      </div>
    </div>
    <div class="focus-foot">
      <div class="focus-foot-chip">${icon('i-focus-hl',16)}<span class="mono">focus mode</span></div>
      <div class="focus-foot-hint mono" onclick="toggleFocusMode()">tap to pause · swipe up to leave</div>
    </div>
  `;
}
function focusLogSteep(){
  const d = state.sessionDraft; const tm = d.timer;
  const secs = tm.mode==='timer' ? (tm.elapsed || tm.target) : tm.elapsed;
  if(!secs){ return; }
  clearTimerInterval();
  d.steeps.push({ id:uid(), order:d.steeps.length+1, tempC:(d.curTemp!==''&&d.curTemp!=null)?displayToC(d.curTemp):null, timeSeconds:Number(secs), description:'', tags:[] });
  d.timer = { mode:tm.mode, target:tm.target, elapsed:0, running:false, intervalId:null };
  render();
}
function setTimerMode(m){ state.sessionDraft.timer.mode=m; state.sessionDraft.timeEditing=false; render(); }
// #13 — the countdown length (timer.target) and the logged "Steep time (seconds)" field
// (curTime) are ONE value, written only here so they can never drift. No render(); callers
// that need the field/sub-label redrawn call render() themselves.
function setSteepTime(secs){
  const d=state.sessionDraft; if(!d) return;
  const n=Math.round(Number(secs));
  const v=(isFinite(n)&&n>0)?n:0;
  d.timer.target=v; d.curTime=v?String(v):'';
  updateTimerDisplayOnly();
}
// Inline tap-to-edit on the countdown's "of Ns" (never a popup; only while stopped).
function d_beginTimeEdit(){
  const d=state.sessionDraft; if(!d || d.timer.running) return;
  d.timeEditPrev=d.timer.target; // for the cancelled-edit revert below
  d.timeEditing=true; render();
  setTimeout(()=>{ const el=document.getElementById('timerTargetEdit'); if(el){ el.focus(); el.select&&el.select(); } },0);
}
// Commit the edit; a blank/zero entry is a cancelled edit — revert to the prior target so
// Start never faces a 0-second countdown (calmer than an instant complete + chime).
function d_endTimeEdit(){
  const d=state.sessionDraft; if(!d) return;
  if(!(Number(d.curTime)>0)) setSteepTime(d.timeEditPrev||0);
  d.timeEditing=false; render();
}

let _audioCtx = null;
function playTimerDone(){
  try{
    if(state.settings.soundEnabled){
      if(!_audioCtx) _audioCtx = new (window.AudioContext||window.webkitAudioContext)();
      const ctx = _audioCtx;
      if(ctx.state==='suspended') ctx.resume();
      // WS3: ONE gentle chime, never a buzz you didn't ask for — a single soft sine that fades out.
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.18, now+0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now+1.1);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(now); osc.stop(now+1.2);
    }
  }catch(e){ /* audio not available */ }
}

function timerStartPause(){
  const tm = state.sessionDraft.timer;
  if(tm.running){
    clearInterval(tm.intervalId); tm.intervalId=null; tm.running=false;
  } else {
    if(!_audioCtx){ try{ _audioCtx = new (window.AudioContext||window.webkitAudioContext)(); }catch(e){} }
    state.sessionDraft.timeEditing=false; // starting closes any open target edit
    tm.running=true;
    tm.intervalId = setInterval(()=>{
      tm.elapsed += 1;
      if(tm.mode==='timer' && tm.elapsed>=tm.target){
        clearInterval(tm.intervalId); tm.intervalId=null; tm.running=false;
        playTimerDone();
      }
      updateTimerDisplayOnly();
    },1000);
  }
  render();
}
function updateTimerDisplayOnly(){
  const disp = document.querySelector('.timer-display');
  const tm = state.sessionDraft.timer;
  if(disp) disp.textContent = fmtSec(tm.mode==='timer'?Math.max(0,tm.target-tm.elapsed):tm.elapsed);
  const tl = document.getElementById('timerTargetLabel'); // #13: keep "of Ns" synced with the steep-time field
  if(tl && tm.mode==='timer') tl.textContent = tm.target;
  const arc = document.getElementById('ensoArc'); // WS3: fill the ensō ring as the steep runs
  if(arc) arc.setAttribute('stroke-dashoffset', (100*(1-focusProgress(tm))).toFixed(1));
  const btn = document.querySelector('.timer-ctrls button');
  if(btn) btn.textContent = tm.running?'Pause':'Start';
  // WS3 focus mode: fill the breathing ring's arc + update the dimmed digit + the breath cue.
  const farc = document.getElementById('focusEnsoArc');
  if(farc) farc.setAttribute('stroke-dashoffset', (100*(1-focusProgress(tm))).toFixed(1));
  const ft = document.getElementById('focusTime');
  if(ft) ft.textContent = fmtSec(tm.mode==='timer'?Math.max(0,tm.target-tm.elapsed):tm.elapsed);
  const fcue = document.querySelector('.focus-cue');
  if(fcue) fcue.textContent = tm.running?'breathe out':'paused';
}
function timerReset(){
  const tm = state.sessionDraft.timer;
  clearInterval(tm.intervalId); tm.intervalId=null; tm.running=false; tm.elapsed=0;
  state.sessionDraft.timeEditing=false;
  render();
}
// Stopwatch-only bridge (#13): capture the measured elapsed into the one steep-time value.
function useTimerValue(){
  const tm = state.sessionDraft.timer;
  const val = tm.mode==='timer' ? tm.target : tm.elapsed;
  setSteepTime(val); // one writer keeps target + curTime in lockstep
  const el = document.getElementById('steepTime');
  if(el) el.value = state.sessionDraft.curTime;
}

function renderTagSuggest(query, target){
  const box = document.getElementById('tagSuggestBox');
  if(!box) return;
  if(!query){ box.innerHTML=''; return; }
  const matches = state.tagLibrary.filter(t=>t.toLowerCase().includes(query.toLowerCase())).slice(0,6);
  // #29: mousedown+preventDefault — a suggestion tap must not blur-commit the half-typed word first
  // (blur now commits, so onclick here would double-add "cara" AND "caramel").
  box.innerHTML = matches.length ? `<div class="tag-suggest">${matches.map(m=>`<div onmousedown="event.preventDefault();pickTagSuggest('${escapeJsArg(m)}','${target}')">${escapeHtml(m)}</div>`).join('')}</div>` : '';
}
function pickTagSuggest(tag, target){
  addTag(tag, target);
  const inp = document.getElementById('tagInputField');
  if(inp) inp.value='';
  document.getElementById('tagSuggestBox').innerHTML='';
}
function addTagFromInput(target, refocus){
  const inp = document.getElementById('tagInputField');
  const val = inp.value.trim().toLowerCase();
  if(!val) return;
  addTag(val, target, refocus);
  inp.value='';
  document.getElementById('tagSuggestBox').innerHTML='';
}
function tagListFor(target){
  if(target==='steep') return state.sessionDraft.curSteepTags;
  if(target==='session') return state.sessionDraft.sessionTags;
  if(target==='edit') return state.editingSession.tags;
  return [];
}
function tagLibraryChipsHTML(target){
  const selected = tagListFor(target);
  const available = state.tagLibrary.filter(t=>!selected.includes(t));
  if(!available.length) return '';
  return `<div class="taglib">${available.map(t=>`<button type="button" class="taglib-chip" onclick="addTag('${escapeJsArg(t)}','${target}')">＋ ${escapeHtml(t)}</button>`).join('')}</div>`;
}
function addTag(tag, target, refocus){
  if(!state.tagLibrary.includes(tag)){ state.tagLibrary.push(tag); persistTag(tag); }
  const list = tagListFor(target);
  if(!list.includes(tag)) list.push(tag);
  render();
  // #29: the blur path passes refocus=false — the user is leaving the field; yanking focus back
  // would reopen the keyboard they just dismissed. Every other path keeps the type-another flow.
  if(refocus!==false) setTimeout(()=>{ const inp=document.getElementById('tagInputField'); if(inp) inp.focus(); },0);
}
function removeCurTag(tag){
  const d = state.sessionDraft;
  d.curSteepTags = d.curSteepTags.filter(t=>t!==tag);
  render();
}
function removeSessionTag(tag){
  const d = state.sessionDraft;
  d.sessionTags = d.sessionTags.filter(t=>t!==tag);
  render();
}
function removeEditTag(tag){
  state.editingSession.tags = state.editingSession.tags.filter(t=>t!==tag);
  render();
}

function saveSteepAndContinue(){
  const d = state.sessionDraft;
  const temp = document.getElementById('steepTemp').value;
  const time = document.getElementById('steepTime').value;
  const desc = document.getElementById('steepDesc').value;
  if(!time){ showToast('Enter a steep time, or use the timer.'); return; }
  const idx = d.steeps.length; // index of the steep being committed
  d.steeps.push({id:uid(), order:d.steeps.length+1, tempC:displayToC(temp), timeSeconds:Number(time), description:desc.trim(), tags:[...d.curSteepTags]});
  // If this steep's time differs from what the schedule predicted, carry that gap
  // forward so the next steep continues from where you actually landed — your
  // downward (or upward) adjustment sticks instead of the guide snapping back.
  if(d.schedule){
    const raw = scheduleTimeForIndex(d.schedule, idx);
    if(raw!=null) d.timeShift = Math.max(-45, Math.min(45, Number(time)-raw));
  }
  clearTimerInterval();
  d.curSteepTags=[]; d.flavorMore=false; d.flavorFreeOpen=false; d.curSteepDesc=''; d.curTemp=''; d.curTime=''; d.timeEditing=false;
  d.timer = {mode:d.timer.mode, target:d.timer.target, elapsed:0, running:false, intervalId:null};
  applyScheduleToCurrentSteep(d); // prefill the next steep's timer + temp from the guide
  render();
}
function finishSteeping(){
  const d = state.sessionDraft;
  // Auto-capture an in-progress steep (time filled in) — no browser popup.
  const timeVal = document.getElementById('steepTime')?.value;
  if(timeVal && Number(timeVal)>0){ saveSteepAndContinue(); }
  if(state.sessionDraft.steeps.length===0){ showToast('Log at least one steep first.'); return; }
  clearTimerInterval();
  state.sessionDraft.completedAt = new Date().toISOString(); // frozen "Session complete · HH:MM"
  state.sessionDraft.stage='finish';
  render();
}
// Union of a session's per-steep flavour tags, first-seen order (vocabulary + free words alike).
function sessionFlavorTags(steeps){
  const seen=[], out=[];
  (steeps||[]).forEach(s=>(s.tags||[]).forEach(t=>{ const k=String(t).toLowerCase(); if(!seen.includes(k)){ seen.push(k); out.push(t); } }));
  return out;
}
// The session read-back: which vocabulary note led early vs opened up in a later steep. An
// observation of what happened across the steeps, never a verdict/score of the cup.
function sessionFlavorStory(steeps){
  const rows=(steeps||[]).map(s=>(s.tags||[]).filter(isFlavorVocab).map(t=>String(t).toLowerCase()));
  const n=rows.length; if(n<2) return '';
  const first=rows[0]||[];
  const early=first[0];
  let late=null, lateStep=null;
  for(let i=1;i<n && !late;i++){ for(const t of rows[i]){ if(!first.includes(t)){ late=t; lateStep=i+1; break; } } }
  const clauses=[];
  if(early) clauses.push(`${capWord(flavorLabel(early))} led early`);
  if(late)  clauses.push(`${flavorLabel(late)} opened up by steep ${lateStep}`);
  return clauses.length ? clauses.join('; ')+'.' : '';
}
function hhmm(iso){ const d=iso?new Date(iso):new Date(); return d.toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'}); }

function sessionFinishHTML(d){
  const tea = teaById(d.teaId);
  const ves = vesselById(d.vesselId);
  const method = (!d.isColdBrew) ? brewMethodFor(d.brewStyle, ves&&ves.capacityMl) : null;
  const temps = d.steeps.map(s=>s.tempC).filter(v=>v!=null && v!=='');
  const metaBits = [`${d.steeps.length} steep${d.steeps.length===1?'':'s'}`];
  if(temps.length) metaBits.push(cToDisplay(temps[0])+tempUnitLabel());
  if(method) metaBits.push(method);
  if(ves) metaBits.push(ves.name);
  const tasted = sessionFlavorTags(d.steeps);
  const story = sessionFlavorStory(d.steeps);
  const breakdown = d.steeps.map((s,i)=>{ const st=(s.tags||[]); return st.length?`<div class="readback-step"><span class="rb-idx mono">steep ${i+1}</span><span class="rb-chips">${st.map(t=>`<span class="rb-chip">${escapeHtml(flavorLabel(t))}</span>`).join('')}</span></div>`:''; }).join('');
  return `
    <button class="detail-back" onclick="armConfirm(this,'Discard this session log?',()=>cancelSession())">✕ Cancel session</button>
    <div class="card">
      <div class="sess-story">
        <div class="eyebrow">Session complete · ${escapeHtml(hhmm(d.completedAt))}</div>
        <h2 class="story-name">${tea?escapeHtml(tea.name):''}</h2>
        <div class="story-meta mono">${metaBits.map(escapeHtml).join(' · ')}</div>
        ${tasted.length?`<div class="story-tasted"><div class="eyebrow">You tasted</div><div class="flav-chips">${tasted.map(t=>`<span class="flav-chip on static">${escapeHtml(flavorLabel(t))}</span>`).join('')}</div></div>`:''}
        ${tasted.length?`<div class="readback-card">${story?`<div class="readback-obs">${escapeHtml(story)}</div>`:''}<div class="readback-steps">${breakdown}</div></div>`:''}
        ${d.mood?`<div class="story-mood">Arrived <strong>${escapeHtml(String(d.mood).toLowerCase())}</strong>.</div>`:''}
      </div>
      <div class="field span2" style="margin:14px 0;">
        <label>Photo (optional)</label>
        <div class="img-upload" id="imgUploadWrap" style="${state._draftImage?`background-image:url(${escapeHtml(state._draftImage)})`:''}">
          ${state._draftImage?'':'Tap to add a photo of this cup'}
          <input type="file" accept="image/*" class="js-img-input">
        </div>
      </div>
      <div class="field" style="margin:14px 0;"><label>Overall rating</label><div id="sessRatingWrap">${renderStarsInteractive(d.sessionRating,true,'setSessionRating')}</div></div>
      ${feedbackRowHTML(d)}
      <div class="field" style="margin-bottom:14px;"><label>Overall notes</label><textarea id="sessDesc" oninput="state.sessionDraft.sessionDesc=this.value">${escapeHtml(d.sessionDesc)}</textarea></div>
      <div class="field">
        <label>Overall tags</label>
        <div>${d.sessionTags.map(t=>`<span class="tagchip">${escapeHtml(t)} <button onclick="removeSessionTag('${escapeJsArg(t)}')">✕</button></span>`).join(' ')}</div>
        <div class="tag-input-wrap">
          <input type="text" id="tagInputField" data-target="session" enterkeyhint="done" placeholder="Type your own, press Enter...">
          <div id="tagSuggestBox"></div>
        </div>
        ${tagLibraryChipsHTML('session')}
      </div>
      <label class="checkrow" style="margin-top:16px;"><input type="checkbox" ${d.isShared?'checked':''} onchange="state.sessionDraft.isShared=this.checked"> Share this session with followers</label>
      <button class="btn btn-primary" style="margin-top:14px;" onclick="commitSession()">Save to journal</button>
    </div>
  `;
}
function setSessionRating(v){
  state.sessionDraft.sessionRating=v;
  document.getElementById('sessRatingWrap').innerHTML = renderStarsInteractive(v,true,'setSessionRating');
}
// Optional one-tap feedback that tunes future brews for this tea. Tap again to clear.
function feedbackRowHTML(d){
  if(state.settings.brewAdvice===false) return '';
  const opt=(v,label)=>`<button type="button" class="lib-chip ${d.feedback===v?'active':''}" onclick="setSessionFeedback('${v}')">${label}</button>`;
  return `<div class="field" style="margin-bottom:14px;">
    <label>How was this cup? <span style="color:var(--ink-soft);font-weight:400;">— optional, tunes next time</span></label>
    <div style="display:flex;gap:8px;flex-wrap:wrap;">
      ${opt('good','Just right')}${opt('strong','A bit strong')}${opt('weak','A bit weak')}
    </div>
  </div>`;
}
function setSessionFeedback(v){
  const d = state.sessionDraft;
  d.feedback = (d.feedback===v) ? null : v; // toggle off on second tap
  render();
}
async function commitSession(){
  if(_sessionSaving) return;
  _sessionSaving = true;
  try {
    const d = state.sessionDraft;
    const descEl = document.getElementById('sessDesc');
    if(descEl) d.sessionDesc = descEl.value.trim();
    const hadInlinePhoto = !!(state._draftImage && String(state._draftImage).startsWith('data:'));
    const photoUrl = await resolveDraftImage();
    // If the upload couldn't reach Storage (offline), resolveDraftImage returns the
    // inline data: URL. Save the session now without the photo — it can be re-added
    // by editing the session once back online.
    const photoDeferred = hadInlinePhoto && photoUrl && String(photoUrl).startsWith('data:');
    const tea = teaById(d.teaId);
    const ves = vesselById(d.vesselId);
    const session = {
      id: uid(), teaId: d.teaId, vesselId: d.vesselId,
      date: d.sessionDate ? new Date(d.sessionDate).toISOString() : new Date().toISOString(),
      isColdBrew: d.isColdBrew, waterType: d.waterType, waterTDS: d.waterTDS?Number(d.waterTDS):null,
      gramsUsed: d.gramsUsed?Number(d.gramsUsed):0,
      steeps: d.steeps, rating: d.sessionRating, description: d.sessionDesc, tags: d.sessionTags,
      isShared: !!d.isShared, photoUrl: photoDeferred ? null : (photoUrl || null),
      infusionCount: d.steeps.length ? null : Math.max(1, Number(d.infusionCount)||1),
      feedback: d.feedback || null,
      mood: d.mood || null,
      // v3.85 (#24): both un-gated from ratioAdjust. The water field is always visible since WS1, so
      // the v3.57 gate silently discarded what the user typed; brewStyle snapshots the method actually
      // used (explicit pick or vessel inference) for phase-2 learned defaults — its un-gate is its own
      // 2026-07-13 ruling, not a drive-by. Cold brew keeps brewStyle null (no gongfu/western semantics).
      waterMl: d.waterMl ? Number(d.waterMl) : null,
      brewStyle: (!d.isColdBrew) ? brewMethodFor(d.brewStyle, ves&&ves.capacityMl) : null,
      teaName: tea?tea.name:'', teaType: tea?tea.type:'', vesselName: ves?ves.name:''
    };
    state.sessions.push(session);
    if(tea && session.gramsUsed){
      tea.amountGrams = Math.max(0, (Number(tea.amountGrams)||0) - session.gramsUsed);
      persistTea(tea);
    }
    persistSession(session);
    state.sessionDraft=null;
    state._draftImage=null;
    state.activeTeaId = d.teaId;
    state.view='tea-detail';
    syncAchievements(true);
    render();
    if(photoDeferred && typeof showToast === 'function'){
      showToast('Session saved. Your photo needs a connection — add it later by editing the session.');
    }
  } finally { _sessionSaving = false; }
}

