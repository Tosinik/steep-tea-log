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
function sessionRowHTML(s){
  const tea = teaById(s.teaId);
  const v = vesselById(s.vesselId);
  const tags = (s.tags||[]).slice(0,4).map(t=>`<span class="tagchip">${t}</span>`).join(' ');
  return `<div class="sess-row" onclick="openSessionEdit('${s.id}')">
    <div class="sess-thumb" style="${tea&&tea.image?`background-image:url(${tea.image})`:''}">${tea&&tea.image?'':'🍵'}</div>
    <div class="sess-main">
      <div class="sess-top"><strong>${tea?tea.name:'Unknown tea'}</strong>${s.rating?renderStarsStatic(s.rating,false):''}</div>
      <div class="sess-sub">${fmtDateTime(s.date)} · ${v?v.name:'—'} · ${brewCountLabel(s)}${s.isColdBrew?' · cold brew':''}</div>
      ${tags?`<div class="sess-tags">${tags}</div>`:''}
    </div>
    <span class="sess-chev">›</span>
  </div>`;
}
function viewSessions(){
  if(state.sessions.length===0){
    return `<div class="section-title"><h2 style="font-family:'Fraunces',serif;font-size:20px;">Sessions</h2></div>
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
    <div class="section-title"><h2 style="font-family:'Fraunces',serif;font-size:20px;">Sessions</h2>
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
      <span class="vessel-thumb" style="${v.image?`background-image:url(${v.image})`:''}">${v.image?'':'🫖'}</span>
      <span class="rname">${v.name} <span style="color:var(--ink-soft);font-weight:400;">— ${v.type}${v.material?', '+v.material:''}</span></span>
      <span class="rval">${v.capacityMl?v.capacityMl+'ml':''}</span>
      <button class="btn-ghost" onclick="openVesselForm(vesselById('${v.id}'))">edit</button>
      <button class="btn-ghost" onclick="deleteVessel('${v.id}')">remove</button>
    </div>
  `).join('') : '<div class="empty">No vessels yet — add your gaiwan, kyusu, or teapot.</div>';
  return `
    <div class="section-title"><h2 style="font-family:'Fraunces',serif;font-size:20px;">My vessels</h2><button class="btn btn-primary" onclick="openVesselForm()">＋ Add vessel</button></div>
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
        <div class="field" style="margin-bottom:12px;"><label>Name</label><input type="text" name="name" required placeholder="My gaiwan" value="${v.name||''}"></div>
        <div class="field" style="margin-bottom:12px;"><label>Type</label><select name="type">${opts}</select></div>
        <div class="field" style="margin-bottom:12px;"><label>Material</label><input type="text" name="material" placeholder="Porcelain, clay, glass..." value="${v.material||''}"></div>
        <div class="field" style="margin-bottom:12px;"><label>Capacity (ml)</label><input type="number" name="capacityMl" placeholder="120" value="${v.capacityMl??''}"></div>
        <div style="display:flex;justify-content:flex-end;gap:8px;"><button type="button" class="btn" onclick="closeVesselForm()">Cancel</button><button type="submit" class="btn btn-primary">Save</button></div>
      </form>
    </div>
  </div>`;
}
async function submitVesselForm(e){
  e.preventDefault();
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
}
function deleteVessel(id){
  if(!confirm('Remove this vessel?')) return;
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
function es_set(key, val){ state.editingSession[key]=val; }
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
function removeEditSteep(i){
  if(state.editingSession.steeps.length<=1){ alert('A session needs at least one steep. Delete the whole session instead if needed.'); return; }
  if(!confirm('Remove steep '+(i+1)+'?')) return;
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
}
function deleteSession(){
  const e = state.editingSession;
  if(!confirm('Delete this session? Its grams will be added back to the tea stock.')) return;
  const tea = teaById(e.teaId);
  if(tea && Number(e.gramsUsed)>0){ tea.amountGrams = (Number(tea.amountGrams)||0) + Number(e.gramsUsed); persistTea(tea); }
  state.sessions = state.sessions.filter(x=>x.id!==e.id);
  dropSession(e.id);
  closeSessionEdit();
}
function sessionEditModal(){
  const e = state.editingSession;
  const steepsHTML = e.steeps.map((st,i)=>`
    <div class="steep-item">
      <div class="steep-head"><span>Steep ${i+1}</span><button class="btn-ghost" onclick="removeEditSteep(${i})">remove</button></div>
      <div class="form-grid" style="margin-top:6px;">
        <div class="field"><label>Temp ${tempUnitLabel()}</label><input type="number" value="${cToDisplay(st.tempC)}" oninput="es_setSteep(${i},'tempC',this.value)"></div>
        <div class="field"><label>Time (sec)</label><input type="number" value="${st.timeSeconds??''}" oninput="es_setSteep(${i},'timeSeconds',this.value)"></div>
        <div class="field span2"><label>Notes</label><textarea oninput="es_setSteep(${i},'description',this.value)">${st.description||''}</textarea></div>
      </div>
    </div>
  `).join('');
  return `<div class="overlay" onclick="if(event.target===this) closeSessionEdit()">
    <div class="modal">
      <div class="modal-head"><h2>Edit session</h2><button class="close-x" onclick="closeSessionEdit()">✕</button></div>
      <div class="form-grid">
        <div class="field"><label>When</label><input type="datetime-local" value="${toLocalDatetimeValue(e.date)}" onchange="es_set('_localDate', this.value)"></div>
        <div class="field"><label>Leaf amount (g)</label><input type="number" step="0.1" value="${e.gramsUsed??''}" oninput="es_set('gramsUsed', this.value)"></div>
        <div class="field span2"><label class="checkrow"><input type="checkbox" ${e.isColdBrew?'checked':''} onchange="es_set('isColdBrew', this.checked)"> Cold brew</label></div>
        <div class="field span2"><label class="checkrow"><input type="checkbox" ${e.isShared?'checked':''} onchange="es_set('isShared', this.checked)"> Shared with followers</label></div>
        <div class="field span2"><label>Overall rating</label><div id="editRatingWrap">${renderStarsInteractive(Number(e.rating)||0,true,'setEditSessionRating')}</div></div>
        <div class="field span2"><label>Overall notes</label><textarea oninput="es_set('description', this.value)">${e.description||''}</textarea></div>
        <div class="field span2">
          <label>Tags</label>
          <div>${e.tags.map(t=>`<span class="tagchip">${t} <button onclick="removeEditTag('${t}')">✕</button></span>`).join(' ')}</div>
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
        <button class="btn btn-danger" onclick="deleteSession()">Delete session</button>
        <div style="display:flex;gap:8px;"><button class="btn" onclick="closeSessionEdit()">Cancel</button><button class="btn btn-primary" onclick="saveSessionEdit()">Save changes</button></div>
      </div>
    </div>
  </div>`;
}

/* ================= SESSION LOGGING ================= */
function quickLogSession(){
  if(state.teas.length===0){ alert('Add a tea first.'); state.view='teas'; render(); return; }
  startSessionFor(null);
}
function startSessionFor(teaId){
  if(state.vessels.length===0){ alert('Add a vessel first (Vessels tab) before logging a session.'); state.view='vessels'; render(); return; }
  state.sessionDraft = {
    teaId: teaId || state.teas[0].id,
    vesselId: state.vessels[0].id,
    sessionDate: toLocalDatetimeValue(new Date()),
    isColdBrew: false,
    waterType: '',
    waterTDS: '',
    gramsUsed: '',
    steeps: [],
    infusionCount: 1,
    stage: 'setup', // setup -> steeping -> finish  (or setup -> quick)
    schedule: null,                                     // effective schedule (set at beginSteeping)
    brewMode: state.settings.brewGuideAutofill!==false ? 'guide' : 'off', // 'off' | 'guide' | 'tuned'
    advice: null,                                       // computeBrewAdvice() cache for this session
    feedback: null,                                     // 'good' | 'strong' | 'weak' (optional)
    curTemp: '', curTime: '',
    curSteepTags: [],
    curSteepDesc: '',
    sessionTags: [],
    sessionRating: 0,
    sessionDesc: '',
    isShared: false,
    timer: {mode:'timer', target:15, elapsed:0, running:false, intervalId:null}
  };
  state._draftImage = null;
  state.view='session';
  render();
}
function cancelSession(){
  if(!confirm('Discard this session log?')) return;
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
    <button class="detail-back" onclick="cancelSession()">✕ Cancel session</button>
    <div class="card">
      <h2 style="margin-top:0;">${d.isColdBrew?'Cold brew':'Quick log'}: ${tea?tea.name:''}</h2>
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
      <div class="field" style="margin-bottom:14px;"><label>Overall notes</label><textarea id="sessDesc" oninput="state.sessionDraft.sessionDesc=this.value">${d.sessionDesc}</textarea></div>
      <div class="field">
        <label>Overall tags</label>
        <div>${d.sessionTags.map(t=>`<span class="tagchip">${t} <button onclick="removeSessionTag('${t}')">✕</button></span>`).join(' ')}</div>
        <div class="tag-input-wrap">
          <input type="text" id="tagInputField" data-target="session" placeholder="Type your own, press Enter...">
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
  const teaOpts = state.teas.map(t=>`<option value="${t.id}" ${d.teaId===t.id?'selected':''}>${t.name}</option>`).join('');
  const vesselOpts = state.vessels.map(v=>`<option value="${v.id}" ${d.vesselId===v.id?'selected':''}>${v.name}</option>`).join('');
  return `
    <button class="detail-back" onclick="cancelSession()">✕ Cancel session</button>
    <div class="card">
      <h2 style="margin-top:0;">Set up your session</h2>
      <div class="form-grid">
        <div class="field span2"><label>Tea</label><select onchange="d_setTea(this.value)">${teaOpts}</select></div>
        <div class="field"><label>Vessel</label><select onchange="d_set('vesselId', this.value)">${vesselOpts}</select></div>
        <div class="field"><label>When</label><input type="datetime-local" value="${d.sessionDate}" onchange="d_set('sessionDate', this.value)"></div>
        <div class="field"><label>Leaf amount (g)</label><input type="number" step="0.1" value="${d.gramsUsed}" oninput="d_set('gramsUsed', this.value)"></div>
        <div class="field"><label>Water type</label><input type="text" value="${d.waterType}" oninput="d_set('waterType', this.value)" placeholder="Filtered, spring, tap..."></div>
        <div class="field"><label>Water TDS (optional)</label><input type="number" value="${d.waterTDS}" oninput="d_set('waterTDS', this.value)" placeholder="ppm"></div>
        <div class="field span2"><label class="checkrow"><input type="checkbox" ${d.isColdBrew?'checked':''} onchange="d_setColdBrew(this.checked)"> Cold brew</label></div>
      </div>
      ${d.isColdBrew ? `
      <button class="btn btn-primary" style="margin-top:16px;" onclick="beginColdBrewLog()">Log cold brew →</button>
      <div class="hint" style="margin-top:8px;">Cold brew is logged as a single long steep — no per-steep timer.</div>
      ` : `
      ${brewGuidePreviewHTML(d)}
      <button class="btn btn-primary" style="margin-top:16px;" onclick="beginSteeping()">Begin steeping →</button>
      <button class="btn" style="margin-top:8px;width:100%;" onclick="beginQuickLog()">Quick log — just infusions & notes</button>
      <div class="hint" style="margin-top:8px;">Quick log skips the per-steep timer — for when you'd rather drink than babysit a form.</div>
      `}
    </div>
  `;
}
function d_set(key, val){
  state.sessionDraft[key] = val;
}
function d_setcur(key, val){
  state.sessionDraft[key] = val;
}
function d_setTea(val){ state.sessionDraft.teaId = val; render(); }   // re-render so the guide preview follows the tea
function d_setBrewMode(mode){ state.sessionDraft.brewMode = mode; render(); }

// Setup preview: the tea's brew guide plus, once there's session feedback, a
// gently tuned "your tuning" option and a memory of how past cups landed.
// A Guide / Tuned / Off selector picks what prefills the steeps. Cold brew and
// teas with nothing to show are skipped (calm-first — no empty cards).
function brewGuidePreviewHTML(d){
  if(d.isColdBrew) return '';
  const tea = teaById(d.teaId);
  const adviceOn = state.settings.brewAdvice!==false;
  const base = effectiveGuideSchedule(tea, adviceOn);
  const adv = adviceOn ? computeBrewAdvice(tea) : (base?{base,tuned:base,hasNudge:false,count:0}:null);
  if(!base && !(adv && adv.hasNudge)) return '';
  // keep brewMode valid for what's available
  if(d.brewMode==='tuned' && !(adv && adv.hasNudge)) d.brewMode = base ? 'guide' : 'off';
  if(d.brewMode==='guide' && !base) d.brewMode = (adv && adv.hasNudge) ? 'tuned' : 'off';

  const opt = (mode,label)=>`<button class="${d.brewMode===mode?'active':''}" onclick="d_setBrewMode('${mode}')">${label}</button>`;
  const seg = `<div class="seg" style="margin-top:10px;">${base?opt('guide','Guide'):''}${(adv&&adv.hasNudge)?opt('tuned','Your tuning'):''}${opt('off','Off')}</div>`;
  const shownSched = d.brewMode==='tuned' ? (adv&&adv.tuned) : base;
  const summary = shownSched ? `<div class="mono" style="font-size:13px;margin-top:2px;">${brewScheduleSummary(shownSched)}</div>` : '';
  const memory = (adv && adv.count) ? `<div style="font-size:11.5px;color:var(--ink-soft);margin-top:8px;">${adviceMemoryText(adv)}${adv.hasNudge?` — suggests ${adviceSuggestionText(adv)}.`:' — landing well; using your guide as-is.'}</div>` : '';
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

// Prefill the current steep's timer + temp from the effective schedule.
// Called at each steep boundary, so it never fights values typed mid-steep.
function applyScheduleToCurrentSteep(d){
  if(!d || !d.schedule) return;
  const i = d.steeps.length;
  const t = scheduleTimeForIndex(d.schedule, i);
  if(t!=null){ d.timer.mode='timer'; d.timer.target=t; d.curTime=String(t); }
  if(d.schedule.tempC!=null){ const disp=cToDisplay(d.schedule.tempC); if(disp!=='') d.curTemp=String(disp); }
}

function beginSteeping(){
  const d = state.sessionDraft;
  const tea = teaById(d.teaId);
  const base = (!d.isColdBrew) ? effectiveGuideSchedule(tea, state.settings.brewAdvice!==false) : null;
  d.advice = (!d.isColdBrew && state.settings.brewAdvice!==false) ? computeBrewAdvice(tea) : null;
  if(d.brewMode==='tuned') d.schedule = (d.advice && d.advice.hasNudge) ? d.advice.tuned : base;
  else if(d.brewMode==='guide') d.schedule = base;
  else d.schedule = null;
  d.stage='steeping';
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
  const sched = d.schedule;
  const cur = d.steeps.length; // index of the steep being brewed now
  const shownCount = Math.max(sched.times.length, cur+1);
  let chips='';
  for(let i=0;i<shownCount;i++){
    const secs = scheduleTimeForIndex(sched, i);
    if(secs==null) break;
    const beyond = i>=sched.times.length;
    const isCur = i===cur;
    chips += `<span style="display:inline-block;padding:2px 8px;border-radius:999px;font-size:11.5px;margin:0 4px 4px 0;`
      + (isCur ? 'background:var(--amber);color:#3a2a12;font-weight:600;' : 'background:transparent;color:var(--ink-soft);border:1px solid var(--line);')
      + `">${beyond?'~':''}${fmtSecShort(secs)}</span>`;
  }
  const meta=[];
  if(sched.tempC!=null) meta.push(cToDisplay(sched.tempC)+tempUnitLabel());
  if(sched.rinseSeconds!=null) meta.push('rinse '+sched.rinseSeconds+'s');
  const label = d.brewMode==='tuned' ? 'Your tuning' : (sched.generated ? 'Suggested' : 'Brew guide');
  return `<div class="card" style="margin-bottom:14px;background:var(--jade-pale);border:1px solid var(--line);padding:12px 14px;">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
      <div class="eyebrow">${label}${meta.length?' · '+meta.join(' · '):''}</div>
      <button class="btn-ghost" style="font-size:11.5px;" onclick="d_setBrewMode('off')">turn off</button>
    </div>
    <div style="margin-top:8px;">${chips}</div>
  </div>`;
}

function sessionSteepingHTML(d){
  const tea = teaById(d.teaId);
  const tm = d.timer;
  const steepsHTML = d.steeps.map((s,i)=>`
    <div class="steep-item">
      <div class="steep-head"><span>Steep ${i+1}</span><span class="mono">${(s.tempC!=null&&s.tempC!=='')?cToDisplay(s.tempC)+tempUnitLabel()+' · ':''}${fmtSec(s.timeSeconds)}</span></div>
      ${s.description?`<div style="margin-top:3px;color:var(--ink-soft);">${s.description}</div>`:''}
      ${s.tags.length?`<div class="steep-tags">${s.tags.map(t=>`<span class="tagchip">${t}</span>`).join(' ')}</div>`:''}
    </div>
  `).join('');

  const modeBtns = `
    <div class="timer-modebtns">
      <button class="${tm.mode==='timer'?'active':''}" onclick="setTimerMode('timer')">Countdown</button>
      <button class="${tm.mode==='stopwatch'?'active':''}" onclick="setTimerMode('stopwatch')">Stopwatch</button>
    </div>`;

  const displaySeconds = tm.mode==='timer' ? Math.max(0, tm.target - tm.elapsed) : tm.elapsed;

  return `
    <button class="detail-back" onclick="cancelSession()">✕ Cancel session</button>
    <div class="card">
      <div class="eyebrow">${tea?tea.name:''} ${d.isColdBrew?'· cold brew':''}</div>
      <h2 style="margin-top:2px;">${dotsRow(d.steeps.length, Math.max(d.steeps.length+1,6))} Steep ${d.steeps.length+1}</h2>

      ${scheduleStripHTML(d)}
      ${d.steeps.length ? `<div style="margin-bottom:14px;">${steepsHTML}</div>` : ''}

      <div class="timer-box">
        ${modeBtns}
        ${tm.mode==='timer' ? `<div style="margin-bottom:8px;"><input type="number" value="${tm.target}" style="width:70px;text-align:center;border-radius:6px;border:none;padding:4px;" oninput="setTimerTarget(this.value)"> sec target</div>` : ''}
        <div class="timer-display">${fmtSec(displaySeconds)}</div>
        <div class="timer-ctrls">
          <button onclick="timerStartPause()">${tm.running?'Pause':'Start'}</button>
          <button onclick="timerReset()">Reset</button>
          <button onclick="useTimerValue()">Use this time</button>
        </div>
        <button class="btn" style="margin-top:10px;width:100%;" onclick="toggleFocusMode()">🧘 Focus mode — just the timer</button>
      </div>

      <div class="form-grid" style="margin-top:14px;">
        <div class="field"><label>Water temp (${tempUnitLabel()})</label><input type="number" id="steepTemp" value="${d.curTemp||''}" oninput="d_setcur('curTemp', this.value)"></div>
        <div class="field"><label>Steep time (seconds)</label><input type="number" id="steepTime" value="${d.curTime||''}" oninput="d_setcur('curTime', this.value)"></div>
        <div class="field span2"><label>Notes for this steep</label><textarea id="steepDesc" oninput="d_setcur('curSteepDesc', this.value)">${d.curSteepDesc||''}</textarea></div>
        <div class="field span2">
          <label>Tasting tags</label>
          <div id="curTagChips">${d.curSteepTags.map(t=>`<span class="tagchip">${t} <button onclick="removeCurTag('${t}')">✕</button></span>`).join(' ')}</div>
          <div class="tag-input-wrap">
            <input type="text" id="tagInputField" data-target="steep" placeholder="Type your own, press Enter...">
            <div id="tagSuggestBox"></div>
          </div>
          ${tagLibraryChipsHTML('steep')}
        </div>
      </div>

      <div style="display:flex;gap:8px;margin-top:16px;flex-wrap:wrap;">
        <button class="btn btn-primary" onclick="saveSteepAndContinue()">Save steep & brew another</button>
        <button class="btn" onclick="finishSteeping()">Finish session</button>
      </div>
    </div>
  `;
}

function toggleFocusMode(){ state.sessionDraft.focusMode=!state.sessionDraft.focusMode; render(); }
function focusProgress(tm){ return tm.mode==='timer' ? (tm.target>0?Math.min(1,tm.elapsed/tm.target):0) : Math.min(1,tm.elapsed/60); }
function sessionFocusHTML(d){
  const tea = teaById(d.teaId);
  const tm = d.timer;
  const bowlH = 102, bowlBottom = 192;
  const prog = focusProgress(tm);
  const fillH = (prog*bowlH).toFixed(1);
  const fillY = (bowlBottom - prog*bowlH).toFixed(1);
  const done = tm.mode==='timer' && tm.target>0 && tm.elapsed>=tm.target;
  const disp = tm.mode==='timer' ? Math.max(0, tm.target-tm.elapsed) : tm.elapsed;
  return `
    <div class="focus-inner">
      <div class="focus-name">${tea?tea.name:'Steeping'}</div>
      <div class="focus-sub">Infusion ${d.steeps.length+1}${d.isColdBrew?' · cold brew':''}</div>
      <svg class="focus-cup" viewBox="0 0 200 230" role="img" aria-label="Steeping cup">
        <defs><clipPath id="focusCupClip"><path d="M52,90 L148,90 L136,175 Q128,192 100,192 Q72,192 64,175 Z"/></clipPath></defs>
        <g class="focus-steam" opacity="0.55">
          <path d="M88,70 q-8,-12 0,-24" fill="none" stroke="var(--ink-soft)" stroke-width="3" stroke-linecap="round"/>
          <path d="M100,66 q8,-12 0,-26" fill="none" stroke="var(--ink-soft)" stroke-width="3" stroke-linecap="round"/>
          <path d="M112,70 q-8,-12 0,-24" fill="none" stroke="var(--ink-soft)" stroke-width="3" stroke-linecap="round"/>
        </g>
        <g clip-path="url(#focusCupClip)">
          <rect id="focusCupFill" x="48" width="104" y="${fillY}" height="${fillH}" fill="var(--amber)"/>
        </g>
        <path d="M52,90 L148,90 L136,175 Q128,192 100,192 Q72,192 64,175 Z" fill="none" stroke="var(--ink)" stroke-width="3.5"/>
        <path d="M148,104 q26,4 20,30 q-6,18 -26,16" fill="none" stroke="var(--ink)" stroke-width="3.5"/>
        <ellipse cx="100" cy="201" rx="60" ry="9" fill="none" stroke="var(--line)" stroke-width="3"/>
      </svg>
      <div class="focus-time" id="focusTime">${fmtSec(disp)}</div>
      <div class="focus-status" id="focusStatus">${done?'ready — pour':(tm.running?'steeping…':'paused')}</div>
      <div class="focus-ctrls">
        <button class="btn btn-primary" id="focusStartBtn" onclick="timerStartPause()">${tm.running?'Pause':'Start'}</button>
        <button class="btn" onclick="timerReset()">Reset</button>
        <button class="btn" onclick="focusLogSteep()">Log this infusion →</button>
      </div>
      <button class="focus-exit" onclick="toggleFocusMode()">exit focus mode</button>
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
function setTimerMode(m){ state.sessionDraft.timer.mode=m; render(); }
function setTimerTarget(v){
  state.sessionDraft.timer.target=Number(v)||0;
  updateTimerDisplayOnly();
}

let _audioCtx = null;
function playTimerDone(){
  try{
    if(state.settings.soundEnabled){
      if(!_audioCtx) _audioCtx = new (window.AudioContext||window.webkitAudioContext)();
      const ctx = _audioCtx;
      if(ctx.state==='suspended') ctx.resume();
      const now = ctx.currentTime;
      [0, 0.22, 0.44].forEach((offset,i)=>{
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = i===2 ? 1046 : 784;
        gain.gain.setValueAtTime(0.0001, now+offset);
        gain.gain.exponentialRampToValueAtTime(0.25, now+offset+0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now+offset+0.18);
        osc.connect(gain); gain.connect(ctx.destination);
        osc.start(now+offset); osc.stop(now+offset+0.2);
      });
      if(navigator.vibrate) navigator.vibrate([150,80,150]);
    }
  }catch(e){ /* audio not available */ }
}

function timerStartPause(){
  const tm = state.sessionDraft.timer;
  if(tm.running){
    clearInterval(tm.intervalId); tm.intervalId=null; tm.running=false;
  } else {
    if(!_audioCtx){ try{ _audioCtx = new (window.AudioContext||window.webkitAudioContext)(); }catch(e){} }
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
  const btn = document.querySelector('.timer-ctrls button');
  if(btn) btn.textContent = tm.running?'Pause':'Start';
  // focus mode: animate the cup + calm readout
  const cup = document.getElementById('focusCupFill');
  if(cup){
    const bowlH=102, bowlBottom=192, prog=focusProgress(tm);
    cup.setAttribute('height',(prog*bowlH).toFixed(1));
    cup.setAttribute('y',(bowlBottom-prog*bowlH).toFixed(1));
  }
  const ft = document.getElementById('focusTime');
  if(ft) ft.textContent = fmtSec(tm.mode==='timer'?Math.max(0,tm.target-tm.elapsed):tm.elapsed);
  const fbtn = document.getElementById('focusStartBtn');
  if(fbtn) fbtn.textContent = tm.running?'Pause':'Start';
  const fstat = document.getElementById('focusStatus');
  if(fstat){ const done = tm.mode==='timer' && tm.target>0 && tm.elapsed>=tm.target; fstat.textContent = done?'ready — pour':(tm.running?'steeping…':'paused'); }
}
function timerReset(){
  const tm = state.sessionDraft.timer;
  clearInterval(tm.intervalId); tm.intervalId=null; tm.running=false; tm.elapsed=0;
  render();
}
function useTimerValue(){
  const tm = state.sessionDraft.timer;
  const val = tm.mode==='timer' ? tm.target : tm.elapsed;
  state.sessionDraft.curTime = val; // persist to state so a re-render doesn't wipe it
  const el = document.getElementById('steepTime');
  if(el) el.value = val;
}

function renderTagSuggest(query, target){
  const box = document.getElementById('tagSuggestBox');
  if(!box) return;
  if(!query){ box.innerHTML=''; return; }
  const matches = state.tagLibrary.filter(t=>t.toLowerCase().includes(query.toLowerCase())).slice(0,6);
  box.innerHTML = matches.length ? `<div class="tag-suggest">${matches.map(m=>`<div onclick="pickTagSuggest('${m}','${target}')">${m}</div>`).join('')}</div>` : '';
}
function pickTagSuggest(tag, target){
  addTag(tag, target);
  const inp = document.getElementById('tagInputField');
  if(inp) inp.value='';
  document.getElementById('tagSuggestBox').innerHTML='';
}
function addTagFromInput(target){
  const inp = document.getElementById('tagInputField');
  const val = inp.value.trim().toLowerCase();
  if(!val) return;
  addTag(val, target);
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
  return `<div class="taglib">${available.map(t=>`<button type="button" class="taglib-chip" onclick="addTag('${t.replace(/'/g,"\\'")}','${target}')">＋ ${t}</button>`).join('')}</div>`;
}
function addTag(tag, target){
  if(!state.tagLibrary.includes(tag)){ state.tagLibrary.push(tag); persistTag(tag); }
  const list = tagListFor(target);
  if(!list.includes(tag)) list.push(tag);
  render();
  setTimeout(()=>{ const inp=document.getElementById('tagInputField'); if(inp) inp.focus(); },0);
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
  if(!time){ alert('Enter a steep time (or use the timer).'); return; }
  d.steeps.push({id:uid(), order:d.steeps.length+1, tempC:displayToC(temp), timeSeconds:Number(time), description:desc.trim(), tags:[...d.curSteepTags]});
  clearTimerInterval();
  d.curSteepTags=[]; d.curSteepDesc=''; d.curTemp=''; d.curTime='';
  d.timer = {mode:d.timer.mode, target:d.timer.target, elapsed:0, running:false, intervalId:null};
  applyScheduleToCurrentSteep(d); // prefill the next steep's timer + temp from the guide
  render();
}
function finishSteeping(){
  const d = state.sessionDraft;
  // Auto-capture an in-progress steep (time filled in) — no browser popup.
  const timeVal = document.getElementById('steepTime')?.value;
  if(timeVal && Number(timeVal)>0){ saveSteepAndContinue(); }
  if(state.sessionDraft.steeps.length===0){ alert('Log at least one steep first.'); return; }
  clearTimerInterval();
  state.sessionDraft.stage='finish';
  render();
}

function sessionFinishHTML(d){
  const tea = teaById(d.teaId);
  return `
    <button class="detail-back" onclick="cancelSession()">✕ Cancel session</button>
    <div class="card">
      <h2 style="margin-top:0;">Wrap up: ${tea?tea.name:''}</h2>
      <div class="eyebrow">${d.steeps.length} steep${d.steeps.length===1?'':'s'} logged</div>
      <div class="field span2" style="margin:14px 0;">
        <label>Photo (optional)</label>
        <div class="img-upload" id="imgUploadWrap" style="${state._draftImage?`background-image:url(${state._draftImage})`:''}">
          ${state._draftImage?'':'Tap to add a photo of this cup'}
          <input type="file" accept="image/*" class="js-img-input">
        </div>
      </div>
      <div class="field" style="margin:14px 0;"><label>Overall rating</label><div id="sessRatingWrap">${renderStarsInteractive(d.sessionRating,true,'setSessionRating')}</div></div>
      ${feedbackRowHTML(d)}
      <div class="field" style="margin-bottom:14px;"><label>Overall notes</label><textarea id="sessDesc" oninput="state.sessionDraft.sessionDesc=this.value">${d.sessionDesc}</textarea></div>
      <div class="field">
        <label>Overall tags</label>
        <div>${d.sessionTags.map(t=>`<span class="tagchip">${t} <button onclick="removeSessionTag('${t}')">✕</button></span>`).join(' ')}</div>
        <div class="tag-input-wrap">
          <input type="text" id="tagInputField" data-target="session" placeholder="Type your own, press Enter...">
          <div id="tagSuggestBox"></div>
        </div>
        ${tagLibraryChipsHTML('session')}
      </div>
      <label class="checkrow" style="margin-top:16px;"><input type="checkbox" ${d.isShared?'checked':''} onchange="state.sessionDraft.isShared=this.checked"> Share this session with followers</label>
      <button class="btn btn-primary" style="margin-top:14px;" onclick="commitSession()">Save session</button>
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
}

