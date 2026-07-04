/* ---------- theme ---------- */
(function applyStoredTheme(){
  const saved = localStorage.getItem('tealog_theme');
  const theme = saved || (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
  document.documentElement.setAttribute('data-theme', theme);
})();
function toggleTheme(){
  const cur = document.documentElement.getAttribute('data-theme');
  const next = cur==='dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('tealog_theme', next);
  const btn = document.getElementById('themeToggleBtn');
  if(btn) btn.textContent = next==='dark' ? '☀️' : '🌙';
}

/* ---------- storage helpers (v2: Supabase-backed via steep-data.js) ---------- */
async function loadKey(key, fallback){
  return window.SteepDB.loadKey(key, fallback);
}
async function saveKey(key, val){
  return window.SteepDB.saveKey(key, val);
}
let _saveErrShown = false;
function saveErr(e){
  console.error('[Steep] save failed', e);
  if(!_saveErrShown){
    _saveErrShown = true;
    alert("Couldn't sync that change — you may be offline. It'll need to be re-saved once you're back online.");
    setTimeout(()=>{ _saveErrShown = false; }, 4000);
  }
}

/* ---------- state ---------- */
const DEFAULT_TAGS = ["floral","fruity","roasted","vegetal","umami","sweet","astringent","woody","honey","mineral","creamy","smoky","malty","buttery","grassy","stonefruit","citrus"];
const TYPES = [
  {k:'green',label:'Green'},{k:'black',label:'Black'},{k:'oolong',label:'Oolong'},
  {k:'puerh',label:'Pu-erh'},{k:'yellow',label:'Yellow'},{k:'white',label:'White'}
];
const VESSEL_TYPES = ['Gaiwan','Kyusu','Yixing teapot','Porcelain teapot','Glass teapot','Mug','Cold brew jar','Other'];
const DEFAULT_SETTINGS = { tempUnit:'c', soundEnabled:true, showAchievements:true, monoFont:'pixel' };

let state = {
  teas: [], vessels: [], sessions: [], tagLibrary: [...DEFAULT_TAGS],
  view: 'dashboard',
  activeTeaId: null,
  teaFormOpen: false, editingTea: null,
  vesselFormOpen: false, editingVessel: null,
  sessionEditOpen: false, editingSession: null,
  sessionDraft: null, // {teaId, vesselId, isColdBrew, waterType, waterTDS, gramsUsed, steeps:[], currentSteep:{}, timer:{...}}
  settings: {...DEFAULT_SETTINGS},
  settingsOpen: false,
  calMonth: null, calSelDay: null,
  social: { loaded:false, busy:false, profile:null, tab:'feed', following:[], feed:null, search:null, profileEditOpen:false, draft:null },
  loaded:false
};

function uid(){ return window.SteepDB.newId(); }

async function init(){
  const [teas, vessels, sessions, tagLibrary, settings] = await Promise.all([
    loadKey('teas', []), loadKey('vessels', []), loadKey('sessions', []), loadKey('tagLibrary', [...DEFAULT_TAGS]),
    window.SteepDB.loadSettings(DEFAULT_SETTINGS)
  ]);
  state.teas = teas; state.vessels = vessels; state.sessions = sessions; state.tagLibrary = tagLibrary;
  state.settings = {...DEFAULT_SETTINGS, ...settings};
  applySettings();
  const savedView = (()=>{ try{ return localStorage.getItem('tealog_view'); }catch(e){ return null; } })();
  if(savedView && ['dashboard','teas','sessions','vessels','friends'].includes(savedView)) state.view = savedView;
  state.loaded = true;
  render();
  if(state.view==='friends') loadSocial();
  syncAchievements(false); // reconcile seen list on load, no celebration
}

/* ---------- settings ---------- */
function applySettings(){
  document.documentElement.setAttribute('data-mono', state.settings.monoFont==='clean' ? 'clean' : 'pixel');
}
function persistSettings(){ window.SteepDB.saveSettings(state.settings).catch(saveErr); }
function tempUnitLabel(){ return state.settings.tempUnit==='f' ? '°F' : '°C'; }
function cToDisplay(c){ if(c==null||c==='') return ''; return state.settings.tempUnit==='f' ? Math.round(c*9/5+32) : c; }
function displayToC(v){ if(v===''||v==null) return null; v=Number(v); if(isNaN(v)) return null; return state.settings.tempUnit==='f' ? Math.round((v-32)*5/9) : v; }

function persistTeas(){ saveKey('teas', state.teas).catch(saveErr); }
function persistVessels(){ saveKey('vessels', state.vessels).catch(saveErr); }
function persistSessions(){ saveKey('sessions', state.sessions).catch(saveErr); }
function persistTags(){ saveKey('tagLibrary', state.tagLibrary).catch(saveErr); }

/* ---------- helpers ---------- */
function fmtStars(v){ return v.toFixed(1).replace('.0',''); }
function typeLabel(k){ const t = TYPES.find(x=>x.k===k); return t?t.label:k; }
function teaById(id){ return state.teas.find(t=>t.id===id); }
function vesselById(id){ return state.vessels.find(v=>v.id===id); }
function fmtSec(s){ s=Math.round(s); const m=Math.floor(s/60); const sec=s%60; return String(m).padStart(2,'0')+':'+String(sec).padStart(2,'0'); }
function fmtDate(iso){ const d=new Date(iso); return d.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}); }
function fmtDateTime(iso){ const d=new Date(iso); return d.toLocaleDateString(undefined,{month:'short',day:'numeric'})+' '+d.toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'}); }
function toLocalDatetimeValue(date){
  const d = date instanceof Date ? date : new Date(date);
  const pad = n=>String(n).padStart(2,'0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function dayKey(iso){ return new Date(iso).toISOString().slice(0,10); }

function renderStarsStatic(value, big){
  let out = '<span class="stars'+(big?' starL':'')+'">';
  for(let i=0;i<5;i++){
    const remain = value - i;
    let fill = remain>=1 ? 'full' : remain>=0.5 ? 'half' : 'empty';
    out += starSVG(fill);
  }
  out += '</span>';
  return out;
}
function starSVG(fill){
  const gold = '#C17A3E';
  if(fill==='full') return `<span class="star"><svg viewBox="0 0 24 24"><path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.7 7-6.3-3.9-6.3 3.9 1.7-7-5.4-4.7 7.1-.6z" fill="${gold}"/></svg></span>`;
  if(fill==='empty') return `<span class="star"><svg viewBox="0 0 24 24"><path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.7 7-6.3-3.9-6.3 3.9 1.7-7-5.4-4.7 7.1-.6z" fill="none" stroke="#D8CFB9" stroke-width="1.5"/></svg></span>`;
  return `<span class="star"><svg viewBox="0 0 24 24"><defs><linearGradient id="hg${Math.random().toString(36).slice(2,8)}" x1="0" x2="1"><stop offset="50%" stop-color="${gold}"/><stop offset="50%" stop-color="transparent"/></linearGradient></defs>
    <path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.7 7-6.3-3.9-6.3 3.9 1.7-7-5.4-4.7 7.1-.6z" fill="none" stroke="#D8CFB9" stroke-width="1.5"/>
    <clipPath id="cp${Math.random().toString(36).slice(2,8)}"><rect x="0" y="0" width="12" height="24"/></clipPath>
    <path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.7 7-6.3-3.9-6.3 3.9 1.7-7-5.4-4.7 7.1-.6z" fill="${gold}" clip-path="inset(0 50% 0 0)"/>
    </svg></span>`;
}
function renderStarsInteractive(value, big, action){
  let out = '<span class="stars'+(big?' starL':'')+'" data-star-value="'+value+'">';
  for(let i=0;i<5;i++){
    const remain = value - i;
    let fill = remain>=1 ? 'full' : remain>=0.5 ? 'half' : 'empty';
    out += `<span class="star">${starSVG(fill)}
      <span class="half-hit" onclick="${action}(${i+0.5})"></span>
      <span class="full-hit" onclick="${action}(${i+1})"></span>
    </span>`;
  }
  out += '</span>';
  return out;
}

function dotsRow(n, max){
  max = max || Math.max(n,6);
  let out = '<span class="dots">';
  for(let i=0;i<max;i++){ out += `<span class="d ${i<n?'on':''}"></span>`; }
  out += '</span>';
  return out;
}

/* ---------- image compression ---------- */
async function resolveDraftImage(){
  const img = state._draftImage;
  if(!img) return null;
  if(!img.startsWith('data:')) return img; // already a stored URL — leave as-is
  try { return await window.SteepDB.uploadImage(img); }
  catch(e){ console.warn('[Steep] photo upload failed, keeping inline copy', e); return img; } // offline fallback
}
function handleImageFile(file, cb){
  const reader = new FileReader();
  reader.onload = function(e){
    const img = new Image();
    img.onload = function(){
      const maxW = 420;
      const scale = Math.min(1, maxW/img.width);
      const canvas = document.createElement('canvas');
      canvas.width = img.width*scale; canvas.height = img.height*scale;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img,0,0,canvas.width,canvas.height);
      cb(canvas.toDataURL('image/jpeg', 0.65));
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

/* ---------- render root ---------- */
function render(){
  const app = document.getElementById('app');
  if(!state.loaded){ app.innerHTML = '<div class="empty">Loading your tea log…</div>'; return; }
  let body = '';
  if(state.view==='dashboard') body = viewDashboard();
  else if(state.view==='teas') body = viewTeas();
  else if(state.view==='tea-detail') body = viewTeaDetail();
  else if(state.view==='vessels') body = viewVessels();
  else if(state.view==='sessions') body = viewSessions();
  else if(state.view==='friends') body = viewFriends();
  else if(state.view==='session') body = viewSessionFlow();

  app.innerHTML = `
    <div class="topbar"><div class="topbar-inner">
      <div class="brand"><div class="brand-mark"></div><h1>Steep</h1></div>
      <div class="tabs">
        <button class="tab ${state.view==='dashboard'?'active':''}" onclick="goView('dashboard')">Dashboard</button>
        <button class="tab ${state.view==='teas'||state.view==='tea-detail'?'active':''}" onclick="goView('teas')">Teas</button>
        <button class="tab ${state.view==='sessions'?'active':''}" onclick="goView('sessions')">Sessions</button>
        <button class="tab ${state.view==='vessels'?'active':''}" onclick="goView('vessels')">Vessels</button>
        <button class="tab ${state.view==='friends'?'active':''}" onclick="goFriends()">Friends</button>
      </div>
      <div style="display:flex;gap:8px;align-items:center;">
        <button class="btn" onclick="openSettings()" style="padding:9px 12px;" title="Settings">⚙</button>
        <button class="btn" id="themeToggleBtn" onclick="toggleTheme()" style="padding:9px 12px;" title="Toggle dark mode"></button>
        <button class="btn-log" onclick="quickLogSession()">＋ Log session</button>
      </div>
    </div></div>
    <div style="padding-top:18px;">${body}</div>
    ${state.teaFormOpen ? teaFormModal() : ''}
    ${state.vesselFormOpen ? vesselFormModal() : ''}
    ${state.sessionEditOpen ? sessionEditModal() : ''}
    ${state.settingsOpen ? settingsModal() : ''}
  `;
  bindDynamic();
  const themeBtn = document.getElementById('themeToggleBtn');
  if(themeBtn) themeBtn.textContent = document.documentElement.getAttribute('data-theme')==='dark' ? '☀️' : '🌙';
}

function goView(v){ state.view=v; state.activeTeaId=null; saveView(v); render(); }
function saveView(v){ try{ if(['dashboard','teas','sessions','vessels','friends'].includes(v)) localStorage.setItem('tealog_view', v); }catch(e){} }

function bindDynamic(){
  // image upload
  document.querySelectorAll('.js-img-input').forEach(inp=>{
    inp.onchange = (e)=>{
      const f = e.target.files[0]; if(!f) return;
      handleImageFile(f, (dataUrl)=>{
        state._draftImage = dataUrl;
        const wrap = document.getElementById('imgUploadWrap');
        if(wrap) wrap.style.backgroundImage = `url(${dataUrl})`;
      });
    };
  });
  const tagInput = document.getElementById('tagInputField');
  if(tagInput){
    tagInput.oninput = ()=> renderTagSuggest(tagInput.value, tagInput.dataset.target);
    tagInput.onkeydown = (e)=>{ if(e.key==='Enter'){ e.preventDefault(); addTagFromInput(tagInput.dataset.target); } };
  }
}

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
  for(const t of state.teas){
    if(t.image && t.image.startsWith('data:')){
      try{ t.image = await window.SteepDB.uploadImage(t.image); ok++; }catch(e){ fail++; }
    }
  }
  for(const v of state.vessels){
    if(v.image && v.image.startsWith('data:')){
      try{ v.image = await window.SteepDB.uploadImage(v.image); ok++; }catch(e){ fail++; }
    }
  }
  persistTeas(); persistVessels(); render();
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
        <div><div class="set-label">Show achievements</div><div class="set-sub">Display the badge grid on the dashboard</div></div>
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
function computeStats(){
  const sessions = state.sessions;
  const totalSessions = sessions.length;
  const totalSteeps = sessions.reduce((a,s)=>a+(s.steeps?.length||0),0);
  const totalGrams = sessions.reduce((a,s)=>a+(Number(s.gramsUsed)||0),0);
  const totalLiters = sessions.reduce((a,s)=>{
    const v = vesselById(s.vesselId);
    const cap = v ? Number(v.capacityMl)||0 : 0;
    return a + (cap*(s.steeps?.length||0))/1000;
  },0);
  const days = new Set(sessions.map(s=>dayKey(s.date)));
  const uniqueTeas = new Set(sessions.map(s=>s.teaId)).size;

  // type breakdown by session count
  const typeCounts = {};
  TYPES.forEach(t=>typeCounts[t.k]={count:0, teas:{}});
  sessions.forEach(s=>{
    const tea = teaById(s.teaId); if(!tea) return;
    if(!typeCounts[tea.type]) typeCounts[tea.type]={count:0,teas:{}};
    typeCounts[tea.type].count++;
    typeCounts[tea.type].teas[tea.name] = (typeCounts[tea.type].teas[tea.name]||0)+1;
  });

  // most brewed teas
  const brewCounts = {};
  sessions.forEach(s=>{ brewCounts[s.teaId]=(brewCounts[s.teaId]||0)+1; });
  const mostBrewed = Object.entries(brewCounts).map(([id,c])=>({tea:teaById(id),count:c})).filter(x=>x.tea).sort((a,b)=>b.count-a.count).slice(0,5);

  // top rated (teas with a rating>0)
  const topRated = [...state.teas].filter(t=>t.rating>0).sort((a,b)=>b.rating-a.rating).slice(0,5);

  const favorites = state.teas.filter(t=>t.isFavorite);

  const lowStock = state.teas.filter(t=>Number(t.amountGrams)<10);

  const totalSpent = state.teas.reduce((a,t)=>a+(Number(t.costTotal)||0),0);
  const gramsBought = state.teas.reduce((a,t)=>a+(Number(t.costOriginalGrams)||0),0);
  const avgCostPerGram = gramsBought>0 ? totalSpent/gramsBought : 0;

  // streak
  const daySet = days;
  let streak = 0;
  let cur = new Date();
  while(true){
    const key = cur.toISOString().slice(0,10);
    if(daySet.has(key)){ streak++; cur.setDate(cur.getDate()-1); } else break;
  }

  const coldBrewCount = sessions.filter(s=>s.isColdBrew).length;
  const nightSessionCount = sessions.filter(s=>{ const h=new Date(s.date).getHours(); return h>=22||h<5; }).length;
  const typesUsedCount = Object.values(typeCounts).filter(t=>t.count>0).length;
  const vesselsUsedCount = new Set(sessions.map(s=>s.vesselId)).size;
  const fiveStarSessions = sessions.filter(s=>Number(s.rating)===5).length;

  // time of day distribution (2h buckets)
  const hourBuckets = new Array(12).fill(0);
  sessions.forEach(s=>{ hourBuckets[Math.floor(new Date(s.date).getHours()/2)]++; });
  let peakBucket = -1, peakVal = 0;
  hourBuckets.forEach((v,i)=>{ if(v>peakVal){ peakVal=v; peakBucket=i; } });

  return {totalSessions, totalSteeps, totalGrams, totalLiters, days, uniqueTeas, typeCounts, mostBrewed, topRated, favorites, lowStock, totalSpent, avgCostPerGram, streak, coldBrewCount, nightSessionCount, typesUsedCount, vesselsUsedCount, fiveStarSessions, hourBuckets, peakBucket};
}

function computePersona(s){
  const sorted = Object.entries(s.typeCounts).filter(([k,v])=>v.count>0).sort((a,b)=>b[1].count-a[1].count);
  let title;
  if(sorted.length===0) title = 'New Explorer';
  else if(sorted.length===1) title = typeLabel(sorted[0][0])+' Devotee';
  else title = typeLabel(sorted[0][0])+' & '+typeLabel(sorted[1][0])+' Explorer';

  let subtitle = '';
  if(s.totalSessions===0){ subtitle = 'your story starts with one steep'; }
  else if(s.coldBrewCount>0 && s.coldBrewCount/s.totalSessions>=0.25){ subtitle = 'cold-brew curious'; }
  else if(s.nightSessionCount>0 && s.nightSessionCount/s.totalSessions>=0.3){ subtitle = 'brews after dark'; }
  else if(s.streak>=14){ subtitle = 'never misses a steep'; }
  else if(s.favorites.length>=3){ subtitle = 'fiercely loyal to a few favorites'; }
  else if(s.typesUsedCount>=5){ subtitle = 'chasing every leaf'; }
  else if(s.totalSessions>=10){ subtitle = 'settling into a rhythm'; }
  else{ subtitle = 'still finding their rhythm'; }

  return {title, subtitle};
}

function brewingClockHTML(s){
  if(s.totalSessions===0) return '';
  const max = Math.max(1, ...s.hourBuckets);
  const labels = ['0','2','4','6','8','10','12','14','16','18','20','22'];
  const bars = s.hourBuckets.map((v,i)=>{
    const h = Math.round(v/max*100);
    const isPeak = i===s.peakBucket && v>0;
    return `<div class="clock-col">
      <div class="clock-bar-track"><div class="clock-bar" style="height:${h}%;background:${isPeak?'var(--amber)':'var(--jade)'};"></div></div>
      <div class="clock-lbl">${labels[i]}</div>
    </div>`;
  }).join('');
  const peakLabel = s.peakBucket>=0 ? `${s.peakBucket*2}:00–${s.peakBucket*2+2}:00` : '—';
  return `<div class="section card">
    <div class="section-title"><h2>When you brew</h2><span class="mono" style="font-size:12px;color:var(--amber);">peak ${peakLabel}</span></div>
    <div class="clock-chart">${bars}</div>
  </div>`;
}

/* ================= ACHIEVEMENTS (tiered) ================= */
// Each achievement is a family with escalating tiers. metric(s) returns the
// current value; the level is how many thresholds have been passed.
const ACHIEVEMENTS = [
  {id:'first_steep',    title:'First Steep',     tiers:[1],              metric:s=>s.totalSessions,                              label:n=>`Log your first session`},
  {id:'sessions',       title:'Steeper',         tiers:[10,50,100,500], metric:s=>s.totalSessions,                              label:n=>`Log ${n} sessions`},
  {id:'century',        title:'Century Club',    tiers:[100,250,500,1000], metric:s=>s.totalSteeps,                             label:n=>`Log ${n} infusions`},
  {id:'liter_club',     title:'Liter Club', unit:'L', tiers:[5,25,50,100], metric:s=>s.totalLiters,                             label:n=>`Brew ${n} liters total`},
  {id:'leaf_muncher',   title:'Leaf Muncher', unit:'g', tiers:[100,500,1000,2500], metric:s=>s.totalGrams,                      label:n=>`Brew ${n}g of leaf total`},
  {id:'collector',      title:'Collector',       tiers:[20,50,100,200], metric:s=>state.teas.length,                           label:n=>`Keep ${n} teas in your library`},
  {id:'deep_dive',      title:'Deep Dive',       tiers:[10,25,50,100],  metric:s=>s.mostBrewed.length?s.mostBrewed[0].count:0, label:n=>`Brew one tea ${n} times`},
  {id:'streak',         title:'Steady Steeper', unit:'d', tiers:[7,30,100,365], metric:s=>s.streak,                            label:n=>`Reach a ${n}-day streak`},
  {id:'explorer',       title:'Explorer',        tiers:[3,5,6],         metric:s=>s.typesUsedCount,                            label:n=>`Brew ${n} different tea types`},
  {id:'vessel_variety', title:'Vessel Variety',  tiers:[3,5,8],         metric:s=>s.vesselsUsedCount,                          label:n=>`Brew with ${n} different vessels`},
  {id:'perfect_cup',    title:'Perfect Cup',     tiers:[1,10,25,50],    metric:s=>s.fiveStarSessions,                          label:n=>`Rate ${n} session${n>1?'s':''} 5 stars`},
  {id:'cold_brewer',    title:'Cold Brewer',     tiers:[1,10,25,50],    metric:s=>s.coldBrewCount,                             label:n=>`Log ${n} cold brew${n>1?'s':''}`},
  {id:'night_owl',      title:'Night Owl',       tiers:[1,10,25,50],    metric:s=>s.nightSessionCount,                         label:n=>`Log ${n} session${n>1?'s':''} after 10pm`},
  {id:'big_spender',    title:'Big Spender', unit:'$', tiers:[50,200,500,1000], metric:s=>s.totalSpent,                        label:n=>`Spend ${n} on tea`},
  {id:'type_master',    title:'Type Master',     tiers:[1,3,6],         metric:s=>Object.values(s.typeCounts).filter(t=>t.count>=10).length, label:n=>`Brew ${n} type${n>1?'s':''} 10+ times each`},
];
function computeAchievements(s){
  return ACHIEVEMENTS.map(a=>{
    const value = a.metric(s);
    const level = a.tiers.filter(t=>value>=t).length;
    const maxed = level===a.tiers.length;
    return {...a, value, level, maxed, unlocked:level>0, tierCount:a.tiers.length,
      unlockedTier: level>0?a.tiers[level-1]:null, nextTier: maxed?null:a.tiers[level]};
  });
}
function fmtMetric(a,v){ return a.unit==='L' ? (Math.round(v*10)/10) : Math.round(v); }
function aUnit(a){ return a.unit==='L' ? ' L' : (a.unit||''); }
function badgeHTML(a){
  const denom = a.maxed ? a.unlockedTier : (a.nextTier ?? a.tiers[0]);
  const pct = a.maxed ? 100 : Math.min(100, Math.round(a.value/denom*100));
  const tierPip = a.tierCount>1 ? `<span class="badge-tier">Lv ${a.level}/${a.tierCount}</span>` : '';
  const desc = a.maxed ? (a.tierCount>1?`Maxed — ${a.label(a.unlockedTier)}`:'Earned') : (a.unlocked ? `Next: ${a.label(a.nextTier)}` : a.label(a.tiers[0]));
  const u = aUnit(a);
  const progNum = a.maxed ? (a.tierCount>1 ? `${denom}${u} ✓` : 'Complete') : `${fmtMetric(a,a.value)}${u} / ${denom}${u}`;
  return `<div class="badge ${a.unlocked?'unlocked':'locked'} ${a.maxed?'maxed':''}" data-akey="${a.id}#${a.level}">
    <div class="badge-icon">${a.maxed?'★':a.unlocked?'✓':'—'}</div>
    <div class="badge-title">${a.title}${tierPip}</div>
    <div class="badge-desc">${desc}</div>
    <div class="badge-prog"><div class="badge-prog-fill" style="width:${pct}%"></div></div>
    <div class="badge-prog-num">${progNum}</div>
  </div>`;
}
function achievementsHTML(s){
  const list = computeAchievements(s);
  const started = list.filter(a=>a.unlocked).length;
  const totalTiers = list.reduce((n,a)=>n+a.tierCount,0);
  const earnedTiers = list.reduce((n,a)=>n+a.level,0);
  const collapsed = !!state.settings.achievementsCollapsed;
  const head = `<div class="section-title"><h2>Achievements</h2>
    <span style="display:flex;align-items:center;gap:12px;">
      <span class="mono" style="font-size:12px;color:var(--amber);">${earnedTiers}/${totalTiers} tiers</span>
      <button class="btn-ghost" style="text-decoration:none;font-size:15px;padding:0;" onclick="toggleAchievementsCollapsed()" title="${collapsed?'Expand':'Minimize'}">${collapsed?'▸':'▾'}</button>
    </span></div>`;
  if(collapsed){
    return `<div class="section card">${head}
      <div style="font-size:12.5px;color:var(--ink-soft);">${started} of ${list.length} achievements started · tap ▸ to expand</div>
    </div>`;
  }
  return `<div class="section card">${head}<div class="badge-grid">${list.map(badgeHTML).join('')}</div></div>`;
}
function toggleAchievementsCollapsed(){
  state.settings.achievementsCollapsed = !state.settings.achievementsCollapsed;
  persistSettings(); render();
}

/* ---- newly-unlocked detection + celebration ---- */
function syncAchievements(animate){
  const list = computeAchievements(computeStats());
  const keys = list.filter(a=>a.level>0).map(a=>`${a.id}#${a.level}`);
  let seen = state.settings.seenAchievements;
  if(!Array.isArray(seen)){ // first ever run: record silently, never a burst of old unlocks
    state.settings.seenAchievements = keys; persistSettings(); return;
  }
  const seenSet = new Set(seen);
  const fresh = list.filter(a=>a.level>0 && !seenSet.has(`${a.id}#${a.level}`));
  if(fresh.length){
    state.settings.seenAchievements = Array.from(new Set([...seen, ...keys])); // accumulate, so drops don't re-fire
    persistSettings();
    if(animate) celebrateAchievements(fresh);
  }
}
function celebrateAchievements(list){
  const names = list.map(a=>a.tierCount>1?`${a.title} (Lv ${a.level})`:a.title);
  showToast('🎉 Unlocked: '+names.join(' · '));
  confettiBurst();
}
function showToast(msg){
  let host = document.getElementById('toastHost');
  if(!host){ host=document.createElement('div'); host.id='toastHost'; document.body.appendChild(host); }
  const t=document.createElement('div'); t.className='toast'; t.textContent=msg;
  host.appendChild(t);
  requestAnimationFrame(()=>t.classList.add('show'));
  setTimeout(()=>{ t.classList.remove('show'); setTimeout(()=>t.remove(),320); }, 4200);
}
function confettiBurst(){
  const host=document.createElement('div'); host.className='confetti';
  const colors=['#C17A3E','#3F5E42','#8B5E4A','#C6A825','#5B9440'];
  for(let i=0;i<30;i++){
    const p=document.createElement('i');
    p.style.left=Math.random()*100+'%';
    p.style.background=colors[i%colors.length];
    p.style.animationDelay=(Math.random()*0.25).toFixed(2)+'s';
    p.style.setProperty('--rot',(Math.random()*360|0)+'deg');
    host.appendChild(p);
  }
  document.body.appendChild(host);
  setTimeout(()=>host.remove(),2000);
}


function heatmapHTML(days){
  // 13 weeks x 7 days
  const weeks = 13;
  const today = new Date(); today.setHours(0,0,0,0);
  const start = new Date(today); start.setDate(start.getDate()-(weeks*7-1));
  // align start to Sunday
  start.setDate(start.getDate()-start.getDay());
  let cols = '';
  for(let w=0; w<weeks; w++){
    let col = '<div class="heat-week">';
    for(let d=0; d<7; d++){
      const cellDate = new Date(start); cellDate.setDate(start.getDate()+w*7+d);
      const key = cellDate.toISOString().slice(0,10);
      const has = days.has(key);
      const future = cellDate>today;
      col += `<div class="heat-cell" style="background:${future?'transparent':has?'var(--heat-fill)':'var(--heat-empty)'}" title="${key}"></div>`;
    }
    col += '</div>';
    cols += col;
  }
  return `<div class="heatmap">${cols}</div>`;
}

function viewDashboard(){
  if(state.teas.length===0 && state.sessions.length===0){
    return `<div class="card empty">No tea logged yet. Head to <strong>Teas</strong> to add your first tea, then log a session to see stats here.</div>${backupSectionHTML()}`;
  }
  const s = computeStats();
  const persona = computePersona(s);
  const maxTypeCount = Math.max(1, ...Object.values(s.typeCounts).map(t=>t.count));

  const typeBars = TYPES.map(t=>{
    const info = s.typeCounts[t.k];
    if(!info || info.count===0) return '';
    const pct = Math.round(info.count/maxTypeCount*100);
    const topTeas = Object.entries(info.teas).sort((a,b)=>b[1]-a[1]).slice(0,2).map(([n,c])=>`${n} (${c}x)`).join(', ');
    return `<div class="typebar-row">
      <div class="typebar-head"><strong>${t.label}</strong><span class="mono" style="font-size:12px;color:var(--ink-soft)">${info.count}x</span></div>
      <div class="typebar-track"><div class="typebar-fill dot-${t.k}" style="width:${pct}%;background:var(--jade)"></div></div>
      ${topTeas?`<div class="typebar-sub">top: ${topTeas}</div>`:''}
    </div>`;
  }).join('');

  const favHTML = s.favorites.length ? `<div class="grid grid-3">${s.favorites.slice(0,6).map(t=>teaCardHTML(t)).join('')}</div>` : '<div class="empty">No favorites marked yet.</div>';

  const mostBrewedHTML = s.mostBrewed.length ? s.mostBrewed.map((x,i)=>`
    <div class="rank-row"><span class="rank-num">${i+1}.</span><span class="rname">${x.tea.name}</span>${dotsRow(x.count,x.count)}<span class="rval">${x.count}x</span></div>
  `).join('') : '<div class="empty">Log a session to see your most brewed teas.</div>';

  const topRatedHTML = s.topRated.length ? s.topRated.map((t,i)=>`
    <div class="rank-row"><span class="rank-num">${i+1}.</span><span class="rname">${t.name}</span><span class="rval">${fmtStars(t.rating)}/5</span></div>
  `).join('') : '<div class="empty">Rate a tea to see it here.</div>';

  const lowStockHTML = s.lowStock.length ? s.lowStock.map(t=>`
    <div class="rank-row"><span class="rname">${t.name}</span><span class="rval" style="color:var(--red)">${Number(t.amountGrams).toFixed(1)}g left</span></div>
  `).join('') : '<div class="empty">All stocked up.</div>';

  return `
    <div class="persona"><div class="eyebrow">Your tea persona</div><h2>${persona.title}</h2><div class="persona-sub">${persona.subtitle}</div></div>

    ${state.settings.showAchievements ? achievementsHTML(s) : ''}

    <div class="section grid grid-3">
      <div class="stat"><div class="num">${s.totalSessions}</div><div class="lbl">Sessions</div></div>
      <div class="stat"><div class="num">${s.totalSteeps}</div><div class="lbl">Infusions</div></div>
      <div class="stat"><div class="num">${s.days.size}</div><div class="lbl">Days logged</div></div>
      <div class="stat"><div class="num">${s.totalGrams.toFixed(1)}</div><div class="lbl">Grams brewed</div></div>
      <div class="stat"><div class="num">${s.totalLiters.toFixed(1)}</div><div class="lbl">Liters (est.)</div></div>
      <div class="stat"><div class="num">${s.uniqueTeas}</div><div class="lbl">Teas brewed</div></div>
    </div>

    <div class="section card">
      <div class="section-title"><h2>Drinking streak</h2><span class="mono" style="font-size:13px;color:var(--amber);font-weight:600;">${s.streak} day${s.streak===1?'':'s'} current</span></div>
      ${heatmapHTML(s.days)}
    </div>

    ${brewingClockHTML(s)}

    <div class="section card">
      <div class="section-title"><h2>What you brewed</h2></div>
      ${typeBars || '<div class="empty">No sessions yet.</div>'}
    </div>

    <div class="section grid grid-2">
      <div class="card">
        <div class="section-title"><h2>Most brewed</h2></div>
        ${mostBrewedHTML}
      </div>
      <div class="card">
        <div class="section-title"><h2>Top rated</h2></div>
        ${topRatedHTML}
      </div>
    </div>

    <div class="section">
      <div class="section-title"><h2>Favorites</h2></div>
      ${favHTML}
    </div>

    <div class="section card">
      <div class="section-title"><h2>Cost overview</h2></div>
      <div class="grid grid-3">
        <div class="stat"><div class="num">${s.totalSpent.toFixed(0)}</div><div class="lbl">Total spent</div></div>
        <div class="stat"><div class="num">${s.avgCostPerGram.toFixed(2)}</div><div class="lbl">Avg / gram</div></div>
        <div class="stat"><div class="num">${s.lowStock.length}</div><div class="lbl">Low stock</div></div>
      </div>
      ${s.lowStock.length ? `<div style="margin-top:12px;">${lowStockHTML}</div>` : ''}
    </div>

    ${backupSectionHTML()}
  `;
}

/* ================= TEAS ================= */
function teaCardHTML(t){
  const bg = t.image ? `background-image:url(${t.image})` : '';
  const sessionsForTea = state.sessions.filter(s=>s.teaId===t.id).length;
  return `<div class="tea-card" onclick="openTeaDetail('${t.id}')">
    <div class="tea-thumb" style="${bg}">${t.isFavorite?'<span class="fav">♥</span>':''}</div>
    <div class="tea-body">
      <span class="pill t-${t.type}">${typeLabel(t.type)}</span>
      <div class="name">${t.name}</div>
      ${renderStarsStatic(Number(t.rating)||0,false)}
      <div class="tea-meta">${Number(t.amountGrams)<10?'<span class="stock-low">'+Number(t.amountGrams).toFixed(1)+'g left</span>':Number(t.amountGrams).toFixed(1)+'g on hand'} · ${sessionsForTea} session${sessionsForTea===1?'':'s'}</div>
    </div>
  </div>`;
}

function viewTeas(){
  const cards = state.teas.length ? `<div class="grid grid-3">${state.teas.map(teaCardHTML).join('')}</div>` : '<div class="card empty">No teas yet — add your first one.</div>';
  return `
    <div class="section-title"><h2 style="font-family:'Fraunces',serif;font-size:20px;">My teas</h2><button class="btn btn-primary" onclick="openTeaForm()">＋ Add tea</button></div>
    ${cards}
  `;
}

function openTeaForm(existing){
  state.editingTea = existing || null;
  state._draftImage = existing ? existing.image : null;
  state.teaFormOpen = true;
  render();
}
function closeTeaForm(){ state.teaFormOpen=false; state.editingTea=null; state._draftImage=null; render(); }

function teaFormModal(){
  const t = state.editingTea || {};
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
          <div class="field"><label>Amount on hand (g)</label><input type="number" step="0.1" name="amountGrams" value="${t.amountGrams??''}"></div>
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
          <div class="field span2"><label>Shop / website</label><input type="text" name="source" value="${t.source||''}" placeholder="URL or shop name"></div>
          <div class="field"><label>Price paid</label><input type="number" step="0.01" name="costTotal" value="${t.costTotal??''}" placeholder="12.50"></div>
          <div class="field"><label>Grams bought (for that price)</label><input type="number" step="0.1" name="costOriginalGrams" value="${t.costOriginalGrams??''}" placeholder="50"></div>
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
async function submitTeaForm(e){
  e.preventDefault();
  const f = e.target;
  const imageUrl = await resolveDraftImage();
  const data = {
    id: state.editingTea?.id || uid(),
    name: f.name.value.trim(),
    type: f.type.value,
    amountGrams: f.amountGrams.value?Number(f.amountGrams.value):0,
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
    image: imageUrl,
    dateAdded: state.editingTea?.dateAdded || new Date().toISOString()
  };
  if(state.editingTea){
    const idx = state.teas.findIndex(t=>t.id===data.id);
    state.teas[idx] = data;
  } else {
    state.teas.push(data);
  }
  persistTeas();
  state.teaFormOpen = false; state.editingTea = null; state._draftImage = null;
  syncAchievements(true);
  render();
}
function deleteTea(id){
  if(!confirm('Delete this tea? Session history stays but will show as an unknown tea.')) return;
  state.teas = state.teas.filter(t=>t.id!==id);
  persistTeas();
  state.teaFormOpen=false; state.editingTea=null; state.view='teas'; state.activeTeaId=null;
  render();
}

function openTeaDetail(id){ state.activeTeaId=id; state.view='tea-detail'; render(); }

function viewTeaDetail(){
  const t = teaById(state.activeTeaId);
  if(!t) return '<div class="empty">Tea not found.</div>';
  const mySessions = state.sessions.filter(s=>s.teaId===t.id).sort((a,b)=>new Date(b.date)-new Date(a.date));
  const histHTML = mySessions.length ? mySessions.map(s=>{
    const v = vesselById(s.vesselId);
    return `<div class="session-hist-row" style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
      <span><strong>${fmtDateTime(s.date)}</strong> · ${v?v.name:'—'} · ${s.steeps.length} steep${s.steeps.length===1?'':'s'} ${s.isColdBrew?'· cold brew':''} ${s.rating?'· '+renderStarsStatic(s.rating,false):''}</span>
      <button class="btn-ghost" onclick="openSessionEdit('${s.id}')">edit</button>
    </div>`;
  }).join('') : '<div class="empty">No sessions logged for this tea yet.</div>';

  return `
    <button class="detail-back" onclick="goView('teas')">← Back to teas</button>
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
          <div style="font-size:14px;${Number(t.amountGrams)<10?'color:var(--red);font-weight:600;':''}">${Number(t.amountGrams).toFixed(1)}g</div>
        </div>
      </div>

      <div class="grid grid-2" style="margin-top:16px;">
        <div><div class="eyebrow">Origin</div><div>${t.origin||'—'}</div></div>
        <div><div class="eyebrow">Cultivar</div><div>${t.cultivar||'—'}</div></div>
        <div><div class="eyebrow">Harvest</div><div>${[t.harvestSeason,t.harvestYear].filter(Boolean).join(' ')||'—'}</div></div>
        <div><div class="eyebrow">Purchase</div><div>${t.purchaseType==='repeat'?'Repeat buy':'First time'}</div></div>
        <div><div class="eyebrow">Source</div><div>${t.source||'—'}</div></div>
        <div><div class="eyebrow">Cost / gram</div><div>${t.costOriginalGrams?'$'+(t.costTotal/t.costOriginalGrams).toFixed(2):'—'}</div></div>
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
function goFriends(){ state.view='friends'; state.activeTeaId=null; saveView('friends'); state.social.loaded=false; render(); loadSocial(); }
async function loadSocial(){
  const so=state.social; if(so.busy) return; so.busy=true;
  try{
    so.profile = await window.SteepDB.getMyProfile();
    if(so.profile){
      const feed = await window.SteepDB.getFeed();
      so.feed = feed;
      so.following = feed.following || [];
    }
  }catch(e){ console.warn('[Steep] social load failed', e); }
  so.busy=false; so.loaded=true; render();
}
function setSocialTab(t){ state.social.tab=t; if(t==='feed'){ refreshFeed(); } else render(); }
async function refreshFeed(){
  try{ const f=await window.SteepDB.getFeed(); state.social.feed=f; state.social.following=f.following||[]; }catch(e){}
  render();
}
function avatarHTML(p, size){
  size=size||40;
  const url=p&&p.avatarUrl;
  const letter=((p&&(p.displayName||p.username))||'?').slice(0,1).toUpperCase();
  return `<span class="avatar" style="width:${size}px;height:${size}px;font-size:${Math.round(size/2.6)}px;${url?`background-image:url(${url})`:''}">${url?'':letter}</span>`;
}
function editProfile(){ state.social.profileEditOpen=true; state._draftImage=state.social.profile?.avatarUrl||null; render(); }
function setProfileDraft(k, v){
  if(!state.social.draft) state.social.draft = {...(state.social.profile||{})};
  state.social.draft[k] = v;
}
function cancelProfileEdit(){ state.social.profileEditOpen=false; state._draftImage=null; state.social.draft=null; render(); }
async function submitProfile(e){
  e.preventDefault();
  const f=e.target;
  const msg=document.getElementById('profileMsg');
  const btn=f.querySelector('button[type=submit]');
  const username=(f.username.value||'').trim().toLowerCase();
  if(!/^[a-z0-9_]{3,20}$/.test(username)){
    if(msg) msg.textContent='Username must be 3–20 characters: lowercase letters, numbers, or underscore.';
    return;
  }
  if(btn){ btn.disabled=true; btn.textContent='Saving…'; }
  if(msg){ msg.classList.remove('ok'); msg.textContent='Saving…'; }
  try{
    const avatarUrl = await resolveDraftImage();
    await window.SteepDB.saveProfile({ username, displayName:f.displayName.value.trim(), avatarUrl, bio:f.bio.value.trim() });
    state.social.profile = await window.SteepDB.getMyProfile(); // read back to confirm it really saved
    if(state.social.profile){
      state.social.draft=null; state.social.profileEditOpen=false; state._draftImage=null;
      showToast('✓ Profile saved as @'+state.social.profile.username);
      try{ const fd=await window.SteepDB.getFeed(); state.social.feed=fd; state.social.following=fd.following||[]; }catch(_){}
      render();
    } else {
      if(btn){ btn.disabled=false; btn.textContent='Create profile'; }
      if(msg) msg.textContent='Saved, but could not reload it — please refresh the page.';
    }
  }catch(err){
    const m=((err&&err.message)||String(err)).toLowerCase();
    if(btn){ btn.disabled=false; btn.textContent=state.social.profile?'Save':'Create profile'; }
    if(msg){
      if(m.includes('duplicate')||err.code==='23505') msg.textContent='That username is taken — try another.';
      else if(m.includes('does not exist')||m.includes('relation')||m.includes('schema cache')) msg.textContent='Profiles table not found — run v3_0-social.sql in the Supabase SQL Editor, then try again.';
      else msg.textContent='Could not save: '+((err&&err.message)||err);
    }
  }
}
function profileSetupHTML(){
  const p=state.social.draft || state.social.profile || {};
  const editing=!!state.social.profile;
  return `
    <div class="section-title"><h2 style="font-family:'Fraunces',serif;font-size:20px;">${editing?'Edit profile':'Create your profile'}</h2></div>
    <div class="card">
      <p style="font-size:12.5px;color:var(--ink-soft);margin-top:0;">Your username lets friends find you. Only your name and avatar are public — your tea log stays private unless you share individual sessions.</p>
      <form onsubmit="submitProfile(event)">
        <div class="field" style="margin-bottom:12px;">
          <label>Avatar</label>
          <div class="img-upload" id="imgUploadWrap" style="width:90px;height:90px;border-radius:50%;${state._draftImage?`background-image:url(${state._draftImage})`:''}">
            ${state._draftImage?'':'Photo'}<input type="file" accept="image/*" class="js-img-input">
          </div>
        </div>
        <div class="field" style="margin-bottom:12px;"><label>Username</label><input type="text" name="username" required value="${p.username||''}" oninput="setProfileDraft('username',this.value)" placeholder="teafiend"></div>
        <div class="field" style="margin-bottom:12px;"><label>Display name</label><input type="text" name="displayName" value="${p.displayName||''}" oninput="setProfileDraft('displayName',this.value)" placeholder="Optional"></div>
        <div class="field" style="margin-bottom:12px;"><label>Bio</label><textarea name="bio" oninput="setProfileDraft('bio',this.value)" placeholder="Optional">${p.bio||''}</textarea></div>
        <div id="profileMsg" class="auth-msg" style="text-align:left;"></div>
        <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:10px;">
          ${editing?`<button type="button" class="btn" onclick="cancelProfileEdit()">Cancel</button>`:''}
          <button type="submit" class="btn btn-primary">${editing?'Save':'Create profile'}</button>
        </div>
      </form>
    </div>`;
}
function viewFriends(){
  const so=state.social;
  if(!so.loaded) return '<div class="card empty">Loading friends…</div>';
  if(!so.profile || so.profileEditOpen) return profileSetupHTML();
  const me=so.profile;
  const tabs=`<div class="tabs" style="margin-bottom:16px;">
    ${['feed','find','following'].map(t=>`<button class="tab ${so.tab===t?'active':''}" onclick="setSocialTab('${t}')">${t[0].toUpperCase()+t.slice(1)}</button>`).join('')}
  </div>`;
  let body='';
  if(so.tab==='feed') body=feedHTML();
  else if(so.tab==='find') body=findHTML();
  else body=followingHTML();
  return `
    <div class="section-title"><h2 style="font-family:'Fraunces',serif;font-size:20px;">Friends</h2>
      <button class="btn-ghost" onclick="editProfile()">edit profile</button></div>
    <div class="card" style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
      ${avatarHTML(me,48)}
      <div><div style="font-weight:600;">${me.displayName||me.username}</div>
      <div style="font-size:12px;color:var(--ink-soft);">@${me.username} · following ${so.following.length}</div></div>
    </div>
    ${tabs}${body}`;
}
function feedHTML(){
  const so=state.social;
  if(!so.following.length) return `<div class="card empty">You're not following anyone yet. Use <strong>Find</strong> to search by username.</div>`;
  const feed=so.feed;
  if(!feed || !feed.sessions.length) return `<div class="card empty">No shared sessions yet from the people you follow.</div>`;
  return feed.sessions.map(s=>feedRowHTML(s, feed.profiles[s.userId])).join('');
}
function feedRowHTML(s, prof){
  const tags=(s.tags||[]).slice(0,5).map(t=>`<span class="tagchip">${t}</span>`).join(' ');
  const typePill = s.teaType?`<span class="pill t-${s.teaType}">${typeLabel(s.teaType)}</span>`:'';
  const meta=[s.vesselName, s.steeps.length?`${s.steeps.length} steep${s.steeps.length===1?'':'s'}`:'', s.isColdBrew?'cold brew':''].filter(Boolean).join(' · ');
  const steepChips = s.steeps.length?`<div class="steep-tags" style="margin-top:8px;">${s.steeps.map((st,i)=>`<span class="tagchip">${i+1}: ${cToDisplay(st.tempC)!==''?cToDisplay(st.tempC)+tempUnitLabel()+' ':''}${fmtSec(st.timeSeconds)}</span>`).join(' ')}</div>`:'';
  return `<div class="card" style="margin-bottom:10px;">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
      ${avatarHTML(prof,36)}
      <div style="flex:1;min-width:0;"><div style="font-weight:600;font-size:13.5px;">${prof?(prof.displayName||prof.username):'Someone'}</div>
      <div style="font-size:11px;color:var(--ink-soft);">@${prof?prof.username:'?'} · ${fmtDateTime(s.date)}</div></div>
    </div>
    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">${typePill}<strong>${s.teaName||'a tea'}</strong>${s.rating?renderStarsStatic(s.rating,false):''}</div>
    ${meta?`<div style="font-size:12px;color:var(--ink-soft);margin-top:4px;">${meta}</div>`:''}
    ${s.description?`<div style="font-size:13px;margin-top:6px;white-space:pre-wrap;">${s.description}</div>`:''}
    ${steepChips}
    ${tags?`<div class="sess-tags" style="margin-top:6px;">${tags}</div>`:''}
  </div>`;
}
function findHTML(){
  const results=state.social.search;
  const rows = results===null ? '<div class="empty" style="padding:12px 0;">Search for a friend by their username.</div>'
    : (results.length? results.map(userRowHTML).join('') : '<div class="empty" style="padding:12px 0;">No users found.</div>');
  return `<div class="card">
    <div style="display:flex;gap:8px;">
      <input type="text" id="userSearch" placeholder="username…" style="flex:1;border:1px solid var(--line);border-radius:8px;padding:9px 10px;font-size:13.5px;background:var(--porcelain);color:var(--ink);" onkeydown="if(event.key==='Enter'){event.preventDefault();doSearch();}">
      <button class="btn btn-primary" onclick="doSearch()">Search</button>
    </div>
    <div style="margin-top:8px;">${rows}</div>
  </div>`;
}
function userRowHTML(p){
  const following=state.social.following.includes(p.id);
  return `<div class="user-row">
    ${avatarHTML(p,40)}
    <div style="flex:1;min-width:0;"><div style="font-weight:600;">${p.displayName||p.username}</div>
    <div style="font-size:12px;color:var(--ink-soft);">@${p.username}</div></div>
    ${following?`<button class="btn" onclick="doUnfollow('${p.id}')">Following</button>`:`<button class="btn btn-primary" onclick="doFollow('${p.id}')">Follow</button>`}
  </div>`;
}
function followingHTML(){
  const so=state.social;
  if(!so.following.length) return '<div class="card empty">Not following anyone yet.</div>';
  const profs=(so.feed&&so.feed.profiles)||{};
  return `<div class="card">${so.following.map(id=>{
    const p=profs[id];
    return `<div class="user-row">
      ${avatarHTML(p,40)}
      <div style="flex:1;min-width:0;"><div style="font-weight:600;">${p?(p.displayName||p.username):'…'}</div>
      <div style="font-size:12px;color:var(--ink-soft);">${p?('@'+p.username):id.slice(0,8)}</div></div>
      <button class="btn" onclick="doUnfollow('${id}')">Unfollow</button>
    </div>`;
  }).join('')}</div>`;
}
async function doSearch(){
  const inp=document.getElementById('userSearch'); const q=inp?inp.value:'';
  try{ state.social.search = await window.SteepDB.searchProfiles(q); }catch(e){ state.social.search=[]; }
  render();
  setTimeout(()=>{ const i=document.getElementById('userSearch'); if(i){ i.value=q; i.focus(); } },0);
}
async function doFollow(id){ try{ await window.SteepDB.follow(id); if(!state.social.following.includes(id)) state.social.following.push(id); await refreshFeed(); }catch(e){ saveErr(e); } }
async function doUnfollow(id){ try{ await window.SteepDB.unfollow(id); state.social.following=state.social.following.filter(x=>x!==id); await refreshFeed(); }catch(e){ saveErr(e); } }

/* ================= SESSIONS (list + calendar) ================= */
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
      <div class="sess-sub">${fmtDateTime(s.date)} · ${v?v.name:'—'} · ${s.steeps.length} steep${s.steeps.length===1?'':'s'}${s.isColdBrew?' · cold brew':''}</div>
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
  persistVessels();
  syncAchievements(true);
  closeVesselForm();
}
function deleteVessel(id){
  if(!confirm('Remove this vessel?')) return;
  state.vessels = state.vessels.filter(v=>v.id!==id);
  persistVessels(); render();
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
function saveSessionEdit(){
  const e = state.editingSession;
  const idx = state.sessions.findIndex(x=>x.id===e.id);
  if(idx<0) return;
  const old = state.sessions[idx];
  const newGrams = e.gramsUsed===''?0:Number(e.gramsUsed)||0;
  const delta = newGrams - (Number(old.gramsUsed)||0);
  if(delta!==0){
    const tea = teaById(e.teaId);
    if(tea){ tea.amountGrams = Math.max(0,(Number(tea.amountGrams)||0)-delta); persistTeas(); }
  }
  e.gramsUsed = newGrams;
  e.date = e._localDate ? new Date(e._localDate).toISOString() : e.date;
  delete e._localDate;
  const tea = teaById(e.teaId), ves = vesselById(e.vesselId);
  e.teaName = tea?tea.name:(e.teaName||''); e.teaType = tea?tea.type:(e.teaType||''); e.vesselName = ves?ves.name:(e.vesselName||'');
  state.sessions[idx] = e;
  persistSessions();
  syncAchievements(true);
  closeSessionEdit();
}
function deleteSession(){
  const e = state.editingSession;
  if(!confirm('Delete this session? Its grams will be added back to the tea stock.')) return;
  const tea = teaById(e.teaId);
  if(tea && Number(e.gramsUsed)>0){ tea.amountGrams = (Number(tea.amountGrams)||0) + Number(e.gramsUsed); persistTeas(); }
  state.sessions = state.sessions.filter(x=>x.id!==e.id);
  persistSessions();
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
      <div class="eyebrow" style="margin:16px 0 8px;">Steeps</div>
      ${steepsHTML}
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
    stage: 'setup', // setup -> steeping -> finish
    curSteepTags: [],
    curSteepDesc: '',
    sessionTags: [],
    sessionRating: 0,
    sessionDesc: '',
    isShared: false,
    timer: {mode:'timer', target:15, elapsed:0, running:false, intervalId:null}
  };
  state.view='session';
  render();
}
function cancelSession(){
  if(!confirm('Discard this session log?')) return;
  clearTimerInterval();
  state.sessionDraft=null; state.view='teas'; render();
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
}

function sessionSetupHTML(d){
  const teaOpts = state.teas.map(t=>`<option value="${t.id}" ${d.teaId===t.id?'selected':''}>${t.name}</option>`).join('');
  const vesselOpts = state.vessels.map(v=>`<option value="${v.id}" ${d.vesselId===v.id?'selected':''}>${v.name}</option>`).join('');
  return `
    <button class="detail-back" onclick="cancelSession()">✕ Cancel session</button>
    <div class="card">
      <h2 style="margin-top:0;">Set up your session</h2>
      <div class="form-grid">
        <div class="field span2"><label>Tea</label><select onchange="d_set('teaId', this.value)">${teaOpts}</select></div>
        <div class="field"><label>Vessel</label><select onchange="d_set('vesselId', this.value)">${vesselOpts}</select></div>
        <div class="field"><label>When</label><input type="datetime-local" value="${d.sessionDate}" onchange="d_set('sessionDate', this.value)"></div>
        <div class="field"><label>Leaf amount (g)</label><input type="number" step="0.1" value="${d.gramsUsed}" oninput="d_set('gramsUsed', this.value)"></div>
        <div class="field"><label>Water type</label><input type="text" value="${d.waterType}" oninput="d_set('waterType', this.value)" placeholder="Filtered, spring, tap..."></div>
        <div class="field"><label>Water TDS (optional)</label><input type="number" value="${d.waterTDS}" oninput="d_set('waterTDS', this.value)" placeholder="ppm"></div>
        <div class="field span2"><label class="checkrow"><input type="checkbox" ${d.isColdBrew?'checked':''} onchange="d_set('isColdBrew', this.checked)"> Cold brew</label></div>
      </div>
      <button class="btn btn-primary" style="margin-top:16px;" onclick="beginSteeping()">Begin steeping →</button>
    </div>
  `;
}
function d_set(key, val){
  state.sessionDraft[key] = val;
}
function d_setcur(key, val){
  state.sessionDraft[key] = val;
}
function beginSteeping(){
  state.sessionDraft.stage='steeping';
  render();
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
}
function timerReset(){
  const tm = state.sessionDraft.timer;
  clearInterval(tm.intervalId); tm.intervalId=null; tm.running=false; tm.elapsed=0;
  render();
}
function useTimerValue(){
  const tm = state.sessionDraft.timer;
  const val = tm.mode==='timer' ? tm.target : tm.elapsed;
  document.getElementById('steepTime').value = val;
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
  if(!state.tagLibrary.includes(tag)){ state.tagLibrary.push(tag); persistTags(); }
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
  render();
}
function finishSteeping(){
  const d = state.sessionDraft;
  // if there's an in-progress steep with a time filled, prompt to save it
  const timeVal = document.getElementById('steepTime')?.value;
  if(timeVal && Number(timeVal)>0){
    if(confirm('Save the current steep before finishing?')){
      saveSteepAndContinue();
    }
  }
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
      <div class="field" style="margin:14px 0;"><label>Overall rating</label><div id="sessRatingWrap">${renderStarsInteractive(d.sessionRating,true,'setSessionRating')}</div></div>
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
function commitSession(){
  const d = state.sessionDraft;
  const descEl = document.getElementById('sessDesc');
  if(descEl) d.sessionDesc = descEl.value.trim();
  const tea = teaById(d.teaId);
  const ves = vesselById(d.vesselId);
  const session = {
    id: uid(), teaId: d.teaId, vesselId: d.vesselId,
    date: d.sessionDate ? new Date(d.sessionDate).toISOString() : new Date().toISOString(),
    isColdBrew: d.isColdBrew, waterType: d.waterType, waterTDS: d.waterTDS?Number(d.waterTDS):null,
    gramsUsed: d.gramsUsed?Number(d.gramsUsed):0,
    steeps: d.steeps, rating: d.sessionRating, description: d.sessionDesc, tags: d.sessionTags,
    isShared: !!d.isShared,
    teaName: tea?tea.name:'', teaType: tea?tea.type:'', vesselName: ves?ves.name:''
  };
  state.sessions.push(session);
  if(tea && session.gramsUsed){
    tea.amountGrams = Math.max(0, (Number(tea.amountGrams)||0) - session.gramsUsed);
    persistTeas();
  }
  persistSessions();
  state.sessionDraft=null;
  state.activeTeaId = d.teaId;
  state.view='tea-detail';
  syncAchievements(true);
  render();
}

/* ---------- boot ---------- */
window.SteepDB.boot(init);

if('serviceWorker' in navigator){
  window.addEventListener('load', ()=>{
    navigator.serviceWorker.register('service-worker.js').catch(e=>console.log('SW registration failed', e));
  });
}
