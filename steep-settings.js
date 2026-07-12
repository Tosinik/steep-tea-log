function backupSectionHTML(){
  const email = window.SteepDB.getUser()?.email || '';
  return `<div class="set-row" style="flex-direction:column;align-items:stretch;gap:12px;">
    <div>
      <div class="set-label">Data &amp; account</div>
      <div class="set-sub">Signed in as <strong>${escapeHtml(email)}</strong>. Your log syncs across devices; export a JSON backup anytime.</div>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
      <button class="btn btn-primary" onclick="exportData()">Export backup (.json)</button>
      <button class="btn" onclick="triggerImport()">Import backup</button>
      <button class="btn" onclick="migratePhotosToStorage(this)">Move photos to cloud</button>
      <button class="btn" onclick="window.SteepDB.signOut()">Sign out</button>
      <input type="file" id="importFileInput" accept="application/json" style="display:none" onchange="handleImportFile(event)">
    </div>
    ${importConfirmHTML()}
  </div>`;
}
// v3.58: the parsed backup waits in state.pendingImport and is confirmed via this inline row (with
// both counts) — NOT a toast. Replacing all data is the app's most destructive action; keep the friction.
function importConfirmHTML(){
  const pi = state.pendingImport; if(!pi) return '';
  return `<div class="set-row" style="flex-direction:column;align-items:stretch;gap:10px;border:1px solid var(--red);border-radius:10px;padding:12px;">
    <div style="font-size:13px;color:var(--ink);">Replace your current data
      (<strong>${state.teas.length} teas / ${state.sessions.length} sessions</strong>) with the backup
      (<strong>${(pi.teas||[]).length} teas / ${(pi.sessions||[]).length} sessions</strong>)? This can&rsquo;t be undone.</div>
    <div style="display:flex;gap:8px;">
      <button class="btn" style="color:var(--red);font-weight:600;" onclick="confirmImport()">Replace all data</button>
      <button class="btn" onclick="cancelImport()">Cancel</button>
    </div>
  </div>`;
}
/* ---- v3.60: diagnostics under Settings → Data — an error log, an on-demand data-health
   report, and a feedback mailto. All read-only; none surfaces proactively (calm-first). ---- */
function dataToolsHTML(){
  return `<div class="set-row" style="flex-direction:column;align-items:stretch;gap:0;">
    ${errorLogHTML()}
    ${dataHealthHTML()}
    <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding-top:12px;">
      <div><div class="set-label">Send feedback</div><div class="set-sub">Opens an email to the SlowCup mailbox. Notice anything off above? You can copy it in.</div></div>
      <a class="btn" href="mailto:slowcupapp@gmail.com?subject=${encodeURIComponent('SlowCup '+APP_VERSION+' feedback')}">Email</a>
    </div>
  </div>`;
}
// Diagnostics log viewer. Timestamps + message + source; a clear button. Empty is the happy path.
function errorLogHTML(){
  const log = readErrorLog();
  const head = `<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;">
      <div><div class="set-label">Diagnostics log</div><div class="set-sub">${log.length?`${log.length} recent error${log.length===1?'':'s'} logged on this device`:'No errors logged on this device'}</div></div>
      <div style="display:flex;gap:8px;">
        ${log.length?`<button class="btn" onclick="toggleErrorLog()">${state.showErrorLog?'Hide':'View'}</button>`:''}
        ${log.length?`<button class="btn" style="color:var(--red);" onclick="clearErrorLogUI(this)">Clear</button>`:''}
      </div>
    </div>`;
  if(!state.showErrorLog || !log.length) return head;
  const rows = log.slice().reverse().map(e=>`<div style="padding:8px 0;border-top:1px solid var(--line);">
      <div class="mono" style="font-size:11px;color:var(--ink-soft);">${escapeHtml(new Date(e.ts).toLocaleString())}${e.source?' · '+escapeHtml(e.source):''}</div>
      <div style="font-size:12.5px;color:var(--ink);word-break:break-word;">${escapeHtml(e.message)}</div>
    </div>`).join('');
  return head + `<div style="margin-top:8px;max-height:230px;overflow:auto;">${rows}</div>`;
}
function toggleErrorLog(){ state.showErrorLog = !state.showErrorLog; render(); }
function clearErrorLogUI(btn){ armConfirm(btn, 'Clear the diagnostics log?', ()=>{ clearErrorLog(); state.showErrorLog=false; render(); }); }
// On-demand data-integrity scan over `state`. Read-only — reports counts + details, never repairs.
// NOTE: DB-orphaned steeps aren't observable client-side (the sessions load drops steeps whose
// parent session is gone), so the steep check surfaces the client-visible analog: sessions that
// recorded no steeps and no infusion count.
function dataHealthReport(){
  const teas = state.teas||[], vessels = state.vessels||[], sessions = state.sessions||[];
  const teaIds = new Set(teas.map(t=>t.id)), vesIds = new Set(vessels.map(v=>v.id));
  const label = s => escapeHtml((s.teaName||'—') + ' · ' + (s.date? new Date(s.date).toLocaleDateString() : '?'));
  const orphanTea = sessions.filter(s=>s.teaId && !teaIds.has(s.teaId));
  const orphanVes = sessions.filter(s=>s.vesselId && !vesIds.has(s.vesselId));
  const negStock  = teas.filter(t=>Number(t.amountGrams) < 0);
  const emptySess = sessions.filter(s=>(!s.steeps||!s.steeps.length) && !(Number(s.infusionCount)>0) && !s.isColdBrew);
  const dupes = []; const byTea = {};
  sessions.forEach(s=>{ if(!s.teaId||!s.date) return; (byTea[s.teaId]=byTea[s.teaId]||[]).push(s); });
  Object.keys(byTea).forEach(k=>{ const arr = byTea[k].slice().sort((a,b)=>new Date(a.date)-new Date(b.date));
    for(let i=1;i<arr.length;i++){ if(Math.abs(new Date(arr[i].date)-new Date(arr[i-1].date)) <= 10*60*1000) dupes.push([arr[i-1],arr[i]]); } });
  return [
    { key:'orphanTea', label:'Sessions with a deleted tea', items: orphanTea.map(label) },
    { key:'orphanVes', label:'Sessions with a deleted vessel', items: orphanVes.map(label) },
    { key:'negStock',  label:'Teas with negative stock', items: negStock.map(t=>escapeHtml(t.name+' ('+Number(t.amountGrams)+'g)')) },
    { key:'emptySess', label:'Sessions with no steeps recorded', items: emptySess.map(label) },
    { key:'dupes',     label:'Possible duplicate sessions (same tea within 10 min)', items: dupes.map(p=>label(p[0])) },
  ];
}
function dataHealthHTML(){
  const head = `<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding-top:12px;">
      <div><div class="set-label">Data health</div><div class="set-sub">A quick read-only integrity check of your log. Nothing is changed.</div></div>
      <button class="btn" onclick="toggleDataHealth()">${state.showDataHealth?'Hide':'Check'}</button>
    </div>`;
  if(!state.showDataHealth) return head;
  const rep = dataHealthReport();
  const total = rep.reduce((n,r)=>n+r.items.length,0);
  if(total===0) return head + `<div class="set-sub" style="padding:8px 0;">Everything checks out — no issues found.</div>`;
  const rows = rep.filter(r=>r.items.length).map(r=>`<div style="padding:8px 0;border-top:1px solid var(--line);">
      <div style="font-size:12.5px;color:var(--ink);"><strong>${r.items.length}</strong> · ${escapeHtml(r.label)}</div>
      <div class="set-sub" style="margin-top:3px;">${r.items.slice(0,8).join('<br>')}${r.items.length>8?`<br>…and ${r.items.length-8} more`:''}</div>
    </div>`).join('');
  return head + `<div style="margin-top:4px;">${rows}</div>`;
}
function toggleDataHealth(){ state.showDataHealth = !state.showDataHealth; render(); }

async function migratePhotosToStorage(btn){
  const count = [...state.teas, ...state.vessels].filter(x=>x.image && x.image.startsWith('data:')).length;
  if(count===0){ showToast('No inline photos to move — everything is already in cloud storage.'); return; }
  armConfirm(btn, `Move ${count} photo${count===1?'':'s'} to cloud storage?`, ()=>doMigratePhotos());
}
async function doMigratePhotos(){
  let ok=0, fail=0;
  const changedTeas=[], changedVessels=[];
  for(const t of state.teas){
    if(t.image && t.image.startsWith('data:')){
      try{ t.image = await window.SteepDB.uploadImage(t.image); changedTeas.push(t); ok++; }catch(e){ fail++; }
    }
  }
  for(const v of state.vessels){
    if(v.image && v.image.startsWith('data:')){
      try{ v.image = await window.SteepDB.uploadImage(v.image); changedVessels.push(v); ok++; }catch(e){ fail++; }
    }
  }
  try{ await window.SteepDB.putTeas(changedTeas); await window.SteepDB.putVessels(changedVessels); }catch(e){ saveErr(e); }
  render();
  showToast(`Moved ${ok} photo${ok===1?'':'s'} to storage.${fail?` ${fail} failed — try again when online.`:''}`);
}
function exportData(){
  const payload = {teas:state.teas, vessels:state.vessels, sessions:state.sessions, tagLibrary:state.tagLibrary, exportedAt:new Date().toISOString()};
  const blob = new Blob([JSON.stringify(payload,null,2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href=url; a.download = 'slowcup-backup-'+new Date().toISOString().slice(0,10)+'.json';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
function triggerImport(){ document.getElementById('importFileInput').click(); }
function handleImportFile(e){
  const f = e.target.files[0]; if(!f) return;
  const reader = new FileReader();
  reader.onload = (ev)=>{
    try{
      const data = JSON.parse(ev.target.result);
      if(!data.teas || !data.vessels || !data.sessions){ showToast("That file doesn't look like a SlowCup backup."); return; }
      // Stash it and render the inline confirm row (with counts) — the replace happens on confirmImport().
      state.pendingImport = data;
      render();
    }catch(err){ showToast('Could not read that file: '+err.message); }
  };
  reader.readAsText(f);
  e.target.value='';
}
function cancelImport(){ state.pendingImport = null; render(); }
function confirmImport(){
  const data = state.pendingImport; if(!data) return;
  state.pendingImport = null;
  state.teas = data.teas||[]; state.vessels=data.vessels||[]; state.sessions=data.sessions||[]; state.tagLibrary=data.tagLibrary||[...DEFAULT_TAGS];
  persistTeas(); persistVessels(); persistSessions(); persistTags();
  render();
  syncAchievements(false);
  showToast('Import complete.');
}

/* ================= SETTINGS ================= */
function openSettings(){ state.settingsOpen = true; render(); }
function closeSettings(){ state.settingsOpen = false; render(); }
function setSetting(key, val){
  state.settings[key] = val;
  applySettings();
  persistSettings();
  render();
}
function seg(key, options){
  return `<div class="seg">${options.map(o=>`<button class="${state.settings[key]===o.v?'active':''}" onclick="setSetting('${key}','${o.v}')">${o.label}</button>`).join('')}</div>`;
}
function toggle(key){
  return `<label class="toggle"><input type="checkbox" ${state.settings[key]?'checked':''} onchange="setSetting('${key}', this.checked)"><span class="track"></span></label>`;
}
function settingsModal(){
  const email = window.SteepDB.getUser()?.email || '';
  const sec = t => `<div class="eyebrow" style="margin:22px 0 4px;">${t}</div>`;
  return `<div class="overlay" onclick="if(event.target===this) closeSettings()">
    <div class="modal" style="max-width:460px;">
      <div class="modal-head"><h2>Settings</h2><button class="close-x" onclick="closeSettings()">✕</button></div>

      ${sec('Brewing')}
      <div class="set-row">
        <div><div class="set-label">Temperature unit</div><div class="set-sub">How steep temperatures are shown and entered</div></div>
        ${seg('tempUnit',[{v:'c',label:'°C'},{v:'f',label:'°F'}])}
      </div>
      <div class="set-row">
        <div><div class="set-label">Timer sounds</div><div class="set-sub">Chime and vibration when a countdown finishes</div></div>
        ${toggle('soundEnabled')}
      </div>

      ${sec('Brew guidance')}
      <div class="set-row">
        <div><div class="set-label">Brew-guide autofill</div><div class="set-sub">Prefill each steep's timer and temperature from a tea's brew guide. You can still turn it off per session.</div></div>
        ${toggle('brewGuideAutofill')}
      </div>
      <div class="set-row">
        <div><div class="set-label">Brew advice</div><div class="set-sub">After a session, an optional "how was it?" that gently tunes future brews for that tea. Sessions stay loose.</div></div>
        ${toggle('brewAdvice')}
      </div>
      <div class="set-row">
        <div><div class="set-label">Ratio adjustment</div><div class="set-sub">When on, the prefilled steep times scale to how much leaf you used for the water volume — a heavier pour shortens them, a lighter one lengthens them. Needs a vessel capacity. Off by default.</div></div>
        ${toggle('ratioAdjust')}
      </div>

      ${sec('Session check-in')}
      <div class="set-row">
        <div><div class="set-label">Mood check-in</div><div class="set-sub">A quiet, optional "how are you feeling?" when you start a session — for spotting patterns over time. Off hides it everywhere.</div></div>
        ${toggle('showMood')}
      </div>

      ${sec('Inventory')}
      <div class="set-row">
        <div><div class="set-label">Low-stock warning</div><div class="set-sub">Flag a tea as low when it drops below this many grams</div></div>
        <input type="number" min="1" max="500" value="${lowStockG()}" style="width:70px;text-align:right;" onchange="setSetting('lowStockThreshold', Math.max(1,Number(this.value)||15))">
      </div>
      <div class="set-row">
        <div><div class="set-label">Default packaging weight</div><div class="set-sub">Pre-filled tare when you weigh a tea with its packaging</div></div>
        <input type="number" min="0" max="200" step="0.5" value="${state.settings.defaultPackagingTareG??10}" style="width:70px;text-align:right;" onchange="setSetting('defaultPackagingTareG', Math.max(0,Number(this.value)||10))">
      </div>

      ${sec('Appearance')}
      <div class="set-row">
        <div><div class="set-label">Theme</div><div class="set-sub">Light or dark — saved on this device</div></div>
        <div class="seg">
          <button class="${document.documentElement.getAttribute('data-theme')==='light'?'active':''}" onclick="setTheme('light')">Light</button>
          <button class="${document.documentElement.getAttribute('data-theme')==='dark'?'active':''}" onclick="setTheme('dark')">Dark</button>
        </div>
      </div>

      ${ACHIEVEMENTS_ENABLED ? `
      ${sec('Calm & achievements')}
      <div class="set-row">
        <div><div class="set-label">Quiet mode</div><div class="set-sub">Calm-first: hides achievements and skips unlock confetti. Tea, not a scoreboard.</div></div>
        ${toggle('quietMode')}
      </div>
      <div class="set-row">
        <div><div class="set-label">Show achievements</div><div class="set-sub">Opens your achievements page from the hub menu</div></div>
        ${toggle('showAchievements')}
      </div>` : ''}

      ${sec('Data')}
      ${backupSectionHTML()}
      ${dataToolsHTML()}
      <p style="font-size:11.5px;color:var(--ink-soft);margin:16px 0 0;">Settings sync across your devices. Manage vendors from the Teas tab.</p>
      <p style="font-size:11px;color:var(--ink-soft);margin:8px 0 0;text-align:center;opacity:.75;">SlowCup ${APP_VERSION}</p>
    </div>
  </div>`;
}

/* ================= DASHBOARD ================= */
