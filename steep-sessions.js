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
  return `<div class="sess-row" onclick="openSessionEdit('${escapeJsArg(s.id)}')">
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
  const cal = `<div class="card">
    <div class="cal-head"><button class="btn-ghost" onclick="calShift(-1)">‹</button><strong>${monthLabel}</strong><button class="btn-ghost" onclick="calShift(1)">›</button></div>
    <div class="cal-grid cal-dows">${dow}</div>
    <div class="cal-grid">${cells}</div>
  </div>`;

  let listSessions = [...state.sessions].sort((a,b)=>new Date(b.date)-new Date(a.date));
  let listTitle = 'All sessions';
  if(state.calSelDay){
    listSessions = listSessions.filter(s=>dayKey(s.date)===state.calSelDay);
    listTitle = fmtDate(state.calSelDay);
  }
  const rows = listSessions.map(sessionRowHTML).join('');
  return `
    <div class="section-title"><h2 style="font-family:var(--font-display);font-size:20px;">Sessions</h2>
      <span class="mono" style="font-size:12px;color:var(--ink-soft);">${state.sessions.length} total</span></div>
    ${cal}
    ${streakCardHTML()}
    <div class="section-title" style="margin-top:20px;"><h2>${listTitle}</h2>
      ${state.calSelDay?`<button class="btn-ghost" onclick="selectCalDay('${state.calSelDay}')">show all</button>`:''}</div>
    <div>${rows || '<div class="card empty">No sessions on this day.</div>'}</div>
  `;
}

/* ================= VESSELS ================= */
function viewVessels(){
  const rows = state.vessels.length ? state.vessels.map(v=>`
    <div class="rank-row">
      <span class="vessel-thumb${v.image?'':' is-ph'}" style="${v.image?`background-image:url(${escapeHtml(v.image)})`:''}"></span>
      <span class="rname">${escapeHtml(v.name)} <span style="color:var(--ink-soft);font-weight:400;">— ${escapeHtml(v.type)}${v.material?', '+escapeHtml(v.material):''}</span></span>
      <span class="rval">${v.capacityMl?v.capacityMl+'ml':`<button class="btn-ghost" onclick="openVesselForm(vesselById('${escapeJsArg(v.id)}'))" style="color:var(--ink-soft);font-size:11px;text-decoration:underline;padding:0;">· ml?</button>`}</span>
      <button class="btn-ghost" onclick="openVesselForm(vesselById('${escapeJsArg(v.id)}'))">edit</button>
      <button class="btn-ghost" onclick="armConfirm(this,'Remove this vessel?',()=>deleteVessel('${escapeJsArg(v.id)}'))">remove</button>
    </div>
  `).join('') : '<div class="empty">No vessels yet — add your gaiwan, kyusu, or teapot.</div>';
  return `
    <div class="section-title"><h2 style="font-family:var(--font-display);font-size:20px;">My vessels</h2><button class="btn btn-primary" onclick="openVesselForm()">＋ Add vessel</button></div>
    <div class="card">${rows}</div>
  `;
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
        <div style="display:flex;justify-content:flex-end;gap:8px;"><button type="button" class="btn" onclick="closeVesselForm()">Cancel</button><button type="submit" class="btn btn-primary">Save</button></div>
      </form>
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

/* ================= SESSION EDITING ================= */
function openSessionEdit(sessionId){
  const s = state.sessions.find(x=>x.id===sessionId);
  if(!s) return;
  state.editingSession = JSON.parse(JSON.stringify(s));
  state.editingSession.tags = state.editingSession.tags || [];
  state.sessionEditOpen = true;
  render();
}
function closeSessionEdit(){ state.sessionEditOpen=false; state.editingSession=null; render(); }
// #20: jump from the open session-edit modal to the tea's page. Closes the modal FIRST (it's appended
// in render() regardless of view, so leaving it open would linger over tea-detail), then one render.
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
function sessionEditModal(){
  const e = state.editingSession;
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
  return `<div class="overlay" onclick="if(event.target===this) closeSessionEdit()">
    <div class="modal">
      <div class="modal-head"><h2>Edit session</h2>
        <div style="display:flex;align-items:center;gap:12px;">
          ${teaById(e.teaId)?`<button class="btn-ghost sess-viewtea" onclick="es_viewTea()">view tea →</button>`:''}
          <button class="close-x" onclick="closeSessionEdit()">✕</button>
        </div></div>
      <div class="form-grid">
        <div class="field span2"><label>When</label><input type="datetime-local" value="${toLocalDatetimeValue(e.date)}" onchange="es_set('_localDate', this.value)"></div>
        <div class="field"><label>Leaf amount (g)</label><input type="number" step="0.1" value="${e.gramsUsed??''}" oninput="es_set('gramsUsed', this.value)"></div>
        <div class="field"><label>Water (ml)</label><input type="number" value="${e.waterMl??''}" oninput="es_set('waterMl', this.value)" placeholder="${(vesselById(e.vesselId)||{}).capacityMl||'vessel capacity'}"></div>
        <div class="field span2"><label>Vessel</label><select onchange="es_set('vesselId', this.value)">${
          (state.vessels.some(v=>v.id===e.vesselId) ? '' : `<option value="${escapeHtml(e.vesselId||'')}" selected>${escapeHtml(e.vesselName||'(unknown vessel)')}</option>`)
          + state.vessels.map(v=>`<option value="${escapeHtml(v.id)}" ${e.vesselId===v.id?'selected':''}>${escapeHtml(v.name)}${v.capacityMl?` · ${v.capacityMl}ml`:''}</option>`).join('')
        }</select></div>
        ${!e.isColdBrew ? `<div class="field span2"><label>Method</label>
          <div class="seg seg-sm">${SESSION_METHODS.map(m=>`<button type="button" class="${e.brewStyle===m.k?'active':''}" onclick="es_setBrewStyle('${m.k}')">${escapeHtml(m.label)}</button>`).join('')}</div>
          ${!e.brewStyle ? `<div style="font-size:11px;color:var(--ink-soft);margin-top:5px;">no method recorded — currently read as ${escapeHtml(esMethodReadLabel(e))} from the vessel</div>` : ''}
        </div>` : ''}
        <div class="field span2"><label class="checkrow"><input type="checkbox" ${e.isColdBrew?'checked':''} onchange="es_set('isColdBrew', this.checked)"> Cold brew</label></div>
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
        <button class="btn btn-danger" onclick="armConfirm(this,'Delete this session? Its grams go back to the tea stock.',()=>deleteSession())">Delete session</button>
        <div style="display:flex;gap:8px;"><button class="btn" onclick="closeSessionEdit()">Cancel</button><button class="btn btn-primary" onclick="saveSessionEdit()">Save changes</button></div>
      </div>
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
function startSessionFor(teaId){
  if(state.vessels.length===0){ showToast('Add a vessel first — Teas → Vessels.'); goVessels(); return; }
  clearTimerInterval();   // v3.83: never orphan a running tick when the draft is replaced
  state.sessionDraft = {
    teaId: teaId || (state.teas.find(t=>!isTeaFinished(t)) || state.teas[0]).id,  // default to an in-stock tea
    vesselId: state.vessels[0].id,
    sessionDate: toLocalDatetimeValue(new Date()),
    isColdBrew: false,
    waterType: '',
    waterTDS: '',
    gramsUsed: '',
    brewStyle: methodPrefillFor(state.vessels[0].id),   // v3.91: vessel-type default (B4); null → capacity infer
    waterMl: '',                                        // v3.57 optional per-session override; blank = vessel capacity
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
function sessionQuickHTML(d){
  const tea = teaById(d.teaId);
  return `
    <button class="detail-back" onclick="armConfirm(this,'Discard this session log?',()=>cancelSession())">✕ Cancel session</button>
    <div class="card">
      <h2 style="margin-top:0;">${d.isColdBrew?'Cold brew':'Quick log'}: ${tea?escapeHtml(tea.name):''}</h2>
      <div class="eyebrow">${d.isColdBrew?'A single long steep — just how it went.':'No timed steeps — just how it went.'}</div>
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
      <button class="btn btn-primary" style="margin-top:14px;" onclick="commitSession()">Save session</button>
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
  // explicit brewStyle, which the vessel-type prefill (d_setVessel) sets. No layout change.
  const cap = (selVes||{}).capacityMl || null;
  const curMethod = brewMethodFor(d.brewStyle, cap);
  const methodBtns = SESSION_METHODS.map(m=>`<button type="button" class="${curMethod===m.k?'active':''}" onclick="d_setBrewStyle('${m.k}')">${escapeHtml(m.label)}</button>`).join('');
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
      ${!d.isColdBrew ? `<div class="trio-row trio-method-row">
        <div class="trio-eyebrow">Method</div>
        <div class="seg seg-sm">${methodBtns}</div>
      </div>` : ''}
    </div>
    ${!d.isColdBrew ? brewGuidePreviewHTML(d) : ''}
    ${state.settings.showMood ? `<div class="mood-card">
      <div class="mood-title">How are you arriving?</div>
      <div class="mood-sub">optional — quietly helps spot patterns later</div>
      ${moodChipsHTML(d.mood, 'd_setMood')}
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
      <div class="field span2"><label class="checkrow"><input type="checkbox" ${d.isColdBrew?'checked':''} onchange="d_setColdBrew(this.checked)"> Cold brew</label></div>
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
function d_toggleMoreDetails(){ const d=state.sessionDraft; if(d){ d.showMoreDetails=!d.showMoreDetails; render(); } }
function d_set(key, val){
  state.sessionDraft[key] = val;
}
function d_setcur(key, val){
  state.sessionDraft[key] = val;
}
function d_setTea(val){ state.sessionDraft.teaId = val; render(); }   // re-render so the guide preview follows the tea
function d_showFinishedTeas(){ state.sessionDraft.showFinishedTeas = true; render(); }   // reveal finished teas in the picker (they stay loggable)
// v3.57 ratio setup: a quiet gongfu|western switch (prefilled from vessel capacity) + an optional
// water-volume override. Only rendered when ratio adjustment is on. brewStyle stays null until the
// user flips it, so changing the vessel re-infers the default until then.
function ratioSetupHTML(d){
  const ves = vesselById(d.vesselId);
  const cap = ves && ves.capacityMl ? Number(ves.capacityMl) : null;
  const method = brewMethodFor(d.brewStyle, cap);
  const mBtn = (m,l)=>`<button type="button" class="${method===m?'active':''}" onclick="d_setBrewStyle('${m}')">${l}</button>`;
  return `<div class="field span2"><label>Brewing method <span style="color:var(--ink-soft);font-weight:400;">— sets the leaf-to-water baseline${d.brewStyle?'':' (from vessel)'}</span></label>
      <div class="seg">${mBtn('gongfu','Gongfu')}${mBtn('western','Western')}</div></div>
    <div class="field"><label>Water (ml, optional)</label><input type="number" value="${d.waterMl}" oninput="d_set('waterMl', this.value)" placeholder="${cap?cap:'vessel capacity'}"></div>`;
}
function d_setBrewStyle(m){ const d=state.sessionDraft; d.brewStyle = m; d.brewStyleLocked = true; render(); } // explicit tap wins over the vessel-type prefill
// Vessel-type → method default (B4, v3.91): the capacity heuristic misclassifies both Japanese vessels
// (a 210ml kyusu reads western, a 73ml shiboridashi gongfu), so selecting a vessel sets brewStyle
// EXPLICITLY from its type. A default, not a lock — an explicit method tap (brewStyleLocked) always
// wins; unmapped types leave it null and fall through to the capacity heuristic as before.
const VESSEL_METHOD_PREFILL = { 'Gaiwan':'gongfu', 'Kyusu':'senchado', 'Shiboridashi':'senchado' };
function methodPrefillFor(vesselId){ const v=vesselById(vesselId); return (v && VESSEL_METHOD_PREFILL[v.type]) || null; }
function d_setVessel(val){ const d=state.sessionDraft; if(!d) return; d.vesselId = val; if(!d.brewStyleLocked) d.brewStyle = methodPrefillFor(val); render(); }

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
  return `<div class="card" style="margin-top:14px;background:var(--jade-pale);border:1px solid var(--line);">
    <div class="eyebrow">${d.brewMode==='tuned'?'Your tuning':(generatedNow?'Suggested \u00b7 '+LEAF_PROFILES[base.form].label:'From your brew guide')}</div>
    ${summary}
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
// Nudge the *next* steep from how the last pour tasted (ephemeral to this session).
function d_nudgeNextSteep(kind){
  const d = state.sessionDraft; if(!d || !d.schedule) return;
  const STEP=5, clamp=x=>Math.max(-45, Math.min(45, x));
  if(kind==='weak') d.timeShift = clamp((d.timeShift||0)+STEP);        // under-extracted → longer
  else if(kind==='strong') d.timeShift = clamp((d.timeShift||0)-STEP); // over-extracted → shorter
  // 'ok' leaves the current carry as-is
  applyScheduleToCurrentSteep(d);
  render();
}
function brewNudgeRowHTML(d){
  if(!d.schedule || !d.steeps.length || d.scheduleHidden) return '';
  const shift = d.timeShift||0;
  const chip=(k,l)=>`<button type="button" class="lib-chip" onclick="d_nudgeNextSteep('${k}')">${l}</button>`;
  const note = shift ? `<span style="font-size:11px;color:var(--ink-soft);">next steep ${shift>0?'+':''}${shift}s vs guide</span>` : '';
  return `<div style="margin:-4px 0 14px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
    <span style="font-size:11.5px;color:var(--ink-soft);">How was that pour?</span>
    ${chip('weak','Weak → longer')}${chip('ok','Just right')}${chip('strong','Strong → shorter')}
    ${note}
  </div>`;
}

// Per-steep strength tap (v3.89, gongfu only) — recorded ON the completed steep card, a separate
// axis from the ephemeral nudge above. Observational copy ("a touch weak"), never imperative.
// quiet-until-reached-for: faint when unrated, a faint marker once set, chips only while expanded
// (one steep open at a time — a fully-tapped session reads as faint markers, never open chip-rows).
// Writes ONLY steep.feedback (never timeShift — strict non-interaction); persists in-draft via
// d.steeps → steepToDb at commit. Tea-First: never required, finish never flags an un-rated steep.
const STEEP_FB_LABELS = { weak:'a touch weak', good:'good', strong:'a touch strong' };
function steepFeedbackHTML(d, i){
  const fb = (d.steeps[i]||{}).feedback || null;
  if(d.steepFbOpen===i){
    const chip=v=>`<button type="button" class="lib-chip ${fb===v?'active':''}" onclick="setSteepFeedback(${i},'${v}')">${STEEP_FB_LABELS[v]}</button>`;
    return `<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px;">${chip('weak')}${chip('good')}${chip('strong')}</div>`;
  }
  return `<button type="button" onclick="d_toggleSteepFb(${i})" style="margin-top:6px;background:none;border:none;padding:0;font-size:11px;color:var(--ink-soft);${fb?'':'opacity:.6;'}cursor:pointer;">${fb?'· '+STEEP_FB_LABELS[fb]:'strength?'}</button>`;
}
function d_toggleSteepFb(i){
  const d = state.sessionDraft; if(!d) return;
  d.steepFbOpen = (d.steepFbOpen===i) ? null : i; // one open at a time; re-tap the marker to change/clear
  render();
}
function setSteepFeedback(i, v){
  const d = state.sessionDraft; if(!d || !d.steeps[i]) return;
  d.steeps[i].feedback = (d.steeps[i].feedback===v) ? null : v; // toggle off on second tap → clear (mirrors setSessionFeedback)
  d.steepFbOpen = null; // collapse to the quiet marker after a pick
  render();
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
  // Per-steep feedback rides the same opt-in switch as the session verdict (feedbackRowHTML) and shows
  // for gongfu OR senchadō (v3.91) — both multi-infusion; the method gate is the main quietness
  // mechanism (spec §3). Resolved through brewMethodFor (same as the setup segment and what commitSession
  // snapshots), so the segment and the cards always agree. Cold brew carries no timed steeps → no cards.
  const ves = vesselById(d.vesselId);
  const showSteepFb = state.settings.brewAdvice!==false && !d.isColdBrew && ['gongfu','senchado'].includes(brewMethodFor(d.brewStyle, ves&&ves.capacityMl));
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

