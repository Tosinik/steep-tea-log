function backupSectionHTML(){
  const email = window.SteepDB.getUser()?.email || '';
  return `<div class="section card">
    <div class="section-title"><h2>Data &amp; account</h2></div>
    <p style="font-size:12.5px;color:var(--ink-soft);margin-top:0;">Signed in as <strong>${email}</strong>. Your log syncs to your account across devices. You can still export a JSON backup anytime.</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
      <button class="btn btn-primary" onclick="exportData()">Export backup (.json)</button>
      <button class="btn" onclick="triggerImport()">Import backup</button>
      <button class="btn" onclick="migratePhotosToStorage()">Move photos to cloud</button>
      <button class="btn" onclick="window.SteepDB.signOut()">Sign out</button>
      <input type="file" id="importFileInput" accept="application/json" style="display:none" onchange="handleImportFile(event)">
    </div>
  </div>`;
}
async function migratePhotosToStorage(){
  const count = [...state.teas, ...state.vessels].filter(x=>x.image && x.image.startsWith('data:')).length;
  if(count===0){ alert('No inline photos to move — everything is already in cloud storage.'); return; }
  if(!confirm(`Move ${count} photo${count===1?'':'s'} to cloud storage? This shrinks each row and speeds up loading.`)) return;
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
  alert(`Moved ${ok} photo${ok===1?'':'s'} to storage.${fail?` ${fail} failed — try again when online.`:''}`);
}
function exportData(){
  const payload = {teas:state.teas, vessels:state.vessels, sessions:state.sessions, tagLibrary:state.tagLibrary, exportedAt:new Date().toISOString()};
  const blob = new Blob([JSON.stringify(payload,null,2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href=url; a.download = 'steep-tea-log-backup-'+new Date().toISOString().slice(0,10)+'.json';
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
      if(!data.teas || !data.vessels || !data.sessions){ alert("This file doesn't look like a Steep backup."); return; }
      if(!confirm('Import will replace your current data ('+state.teas.length+' teas, '+state.sessions.length+' sessions) with the backup ('+data.teas.length+' teas, '+data.sessions.length+' sessions). Continue?')) return;
      state.teas = data.teas||[]; state.vessels=data.vessels||[]; state.sessions=data.sessions||[]; state.tagLibrary=data.tagLibrary||[...DEFAULT_TAGS];
      persistTeas(); persistVessels(); persistSessions(); persistTags();
      render();
      syncAchievements(false);
      alert('Import complete.');
    }catch(err){ alert('Could not read that file: '+err.message); }
  };
  reader.readAsText(f);
  e.target.value='';
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
  return `<div class="overlay" onclick="if(event.target===this) closeSettings()">
    <div class="modal" style="max-width:460px;">
      <div class="modal-head"><h2>Settings</h2><button class="close-x" onclick="closeSettings()">✕</button></div>
      <div class="set-row">
        <div><div class="set-label">Temperature unit</div><div class="set-sub">How steep temperatures are shown and entered</div></div>
        ${seg('tempUnit',[{v:'c',label:'°C'},{v:'f',label:'°F'}])}
      </div>
      <div class="set-row">
        <div><div class="set-label">Timer sounds</div><div class="set-sub">Chime and vibration when a countdown finishes</div></div>
        ${toggle('soundEnabled')}
      </div>
      <div class="set-row">
        <div><div class="set-label">Low-stock warning</div><div class="set-sub">Flag a tea as low when it drops below this many grams</div></div>
        <input type="number" min="1" max="500" value="${lowStockG()}" style="width:70px;text-align:right;" onchange="setSetting('lowStockThreshold', Math.max(1,Number(this.value)||15))">
      </div>
      <div class="set-row">
        <div><div class="set-label">Default packaging weight</div><div class="set-sub">Pre-filled tare when you weigh a tea with its packaging</div></div>
        <input type="number" min="0" max="200" step="0.5" value="${state.settings.defaultPackagingTareG??10}" style="width:70px;text-align:right;" onchange="setSetting('defaultPackagingTareG', Math.max(0,Number(this.value)||10))">
      </div>
      <div class="set-row">
        <div><div class="set-label">Quiet mode</div><div class="set-sub">Calm-first: hides achievements and skips unlock confetti. Tea, not a scoreboard.</div></div>
        ${toggle('quietMode')}
      </div>
      <div class="set-row">
        <div><div class="set-label">Show achievements</div><div class="set-sub">Adds a 🏆 button in the header that opens your achievements page</div></div>
        ${toggle('showAchievements')}
      </div>
      <div class="set-row">
        <div><div class="set-label">Display font</div><div class="set-sub">Pixel is the retro look; Clean is a plain monospace</div></div>
        ${seg('monoFont',[{v:'pixel',label:'Pixel'},{v:'clean',label:'Clean'}])}
      </div>
      <p style="font-size:11.5px;color:var(--ink-soft);margin:16px 0 0;">Signed in as ${email}. Settings sync across your devices.</p>
    </div>
  </div>`;
}

/* ================= DASHBOARD ================= */
