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
function setTheme(t){
  document.documentElement.setAttribute('data-theme', t);
  localStorage.setItem('tealog_theme', t);
  const btn = document.getElementById('themeToggleBtn');
  if(btn) btn.textContent = t==='dark' ? '☀️' : '🌙';
  render();
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
// Social actions surface the actual cause instead of the generic offline message,
// so a permissions/setup problem is distinguishable from being truly offline.
function socialErr(e, action){
  console.error('[Steep] '+action+' failed', e);
  const m = ((e&&e.message)||String(e)).toLowerCase();
  const code = e&&e.code;
  let msg;
  if(code==='42P01' || m.includes('schema cache') || (m.includes('does not exist')) || (m.includes('relation')&&m.includes('follow')))
    msg = "Social tables aren't set up yet — run v3_0-social.sql in the Supabase SQL Editor, then try again.";
  else if(m.includes('row-level security') || m.includes('violates') || m.includes('policy'))
    msg = "That action was blocked by database permissions. Re-run v3_0-social.sql to (re)create the follows policies, then try again.";
  else if(m.includes('failed to fetch') || m.includes('networkerror') || m.includes('network request failed'))
    msg = "Couldn't reach the server — you may be offline. Try again once you're back online.";
  else
    msg = "Could not "+action+": "+((e&&e.message)||e);
  alert(msg);
}

/* ---------- state ---------- */
const DEFAULT_TAGS = ["floral","fruity","roasted","vegetal","umami","sweet","astringent","woody","honey","mineral","creamy","smoky","malty","buttery","grassy","stonefruit","citrus"];
const TYPES = [
  {k:'green',label:'Green'},{k:'black',label:'Black'},{k:'oolong',label:'Oolong'},
  {k:'puerh',label:'Pu-erh'},{k:'yellow',label:'Yellow'},{k:'white',label:'White'}
];
const VESSEL_TYPES = ['Gaiwan','Kyusu','Yixing teapot','Porcelain teapot','Glass teapot','Mug','Cold brew jar','Other'];
const DEFAULT_SETTINGS = { tempUnit:'c', soundEnabled:true, showAchievements:true, quietMode:false, lowStockThreshold:15, defaultPackagingTareG:10, monoFont:'pixel' };
function lowStockG(){ const v = Number(state.settings.lowStockThreshold); return (v>0 && v<10000) ? v : 15; }

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
  teaSort: 'newest', teaFilter: { type:'', vendor:'', lowStock:false },
  recapPeriod: 'week',
  passportSel: null,
  social: { loaded:false, busy:false, profile:null, tab:'feed', following:[], feed:null, search:null, profileEditOpen:false, draft:null },
  loaded:false
};

function uid(){ return window.SteepDB.newId(); }

async function init(){
  const [teas, vessels, sessions, tagLibrary, wishlist, settings] = await Promise.all([
    loadKey('teas', []), loadKey('vessels', []), loadKey('sessions', []), loadKey('tagLibrary', [...DEFAULT_TAGS]),
    loadKey('wishlist', []),
    window.SteepDB.loadSettings(DEFAULT_SETTINGS)
  ]);
  state.teas = teas; state.vessels = vessels; state.sessions = sessions; state.tagLibrary = tagLibrary; state.wishlist = wishlist;
  state.settings = {...DEFAULT_SETTINGS, ...settings};
  applySettings();
  const savedView = (()=>{ try{ return localStorage.getItem('tealog_view'); }catch(e){ return null; } })();
  if(savedView && ['dashboard','teas','sessions','vessels','friends'].includes(savedView)) state.view = savedView;
  state.loaded = true;
  render();
  if(state.view==='friends') loadSocial();
  syncAchievements(false); // reconcile seen list on load, no celebration
  installResumeSync();
}

// Re-pull data from Supabase when the app regains focus, so the installed PWA
// syncs changes made elsewhere without a manual reload. Guarded so it never
// clobbers unsaved input (open form/modal or an in-progress session), and
// throttled so the double visibilitychange/focus events don't double-fetch.
let _resumeSyncInstalled = false;
let _lastResumeSync = Date.now();
function installResumeSync(){
  if(_resumeSyncInstalled) return;
  _resumeSyncInstalled = true;
  const onResume = ()=>{
    if(document.visibilityState !== 'visible') return;
    if(Date.now() - _lastResumeSync < 8000) return; // throttle
    _lastResumeSync = Date.now();
    refreshData();
  };
  document.addEventListener('visibilitychange', onResume);
  window.addEventListener('focus', onResume);
}
async function refreshData(){
  if(!state.loaded) return;
  // never refetch over unsaved work
  if(state.sessionDraft || state.teaFormOpen || state.vesselFormOpen || state.sessionEditOpen || state.social.profileEditOpen) return;
  try{
    const [teas, vessels, sessions, tagLibrary, wishlist] = await Promise.all([
      loadKey('teas', state.teas), loadKey('vessels', state.vessels),
      loadKey('sessions', state.sessions), loadKey('tagLibrary', state.tagLibrary),
      loadKey('wishlist', state.wishlist||[])
    ]);
    state.teas = teas; state.vessels = vessels; state.sessions = sessions; state.tagLibrary = tagLibrary; state.wishlist = wishlist;
    render();
    if(state.view==='friends') loadSocial();
    syncAchievements(false);
  }catch(e){ /* offline or transient — keep what we have */ }
}

/* ---------- settings ---------- */
function applySettings(){
  document.documentElement.setAttribute('data-mono', state.settings.monoFont==='clean' ? 'clean' : 'pixel');
}
function persistSettings(){ window.SteepDB.saveSettings(state.settings).catch(saveErr); }
function tempUnitLabel(){ return state.settings.tempUnit==='f' ? '°F' : '°C'; }
function cToDisplay(c){ if(c==null||c==='') return ''; return state.settings.tempUnit==='f' ? Math.round(c*9/5+32) : c; }
function displayToC(v){ if(v===''||v==null) return null; v=Number(v); if(isNaN(v)) return null; return state.settings.tempUnit==='f' ? Math.round((v-32)*5/9) : v; }

// Bulk (blob) writes — used ONLY where a full replace is the actual intent (import).
function persistTeas(){ saveKey('teas', state.teas).catch(saveErr); }
function persistVessels(){ saveKey('vessels', state.vessels).catch(saveErr); }
function persistSessions(){ saveKey('sessions', state.sessions).catch(saveErr); }
function persistTags(){ saveKey('tagLibrary', state.tagLibrary).catch(saveErr); }

// Per-row writes (v3) — the default for every normal mutation.
function persistTea(t){ window.SteepDB.putTea(t).catch(saveErr); }
function dropTea(id){ window.SteepDB.removeTea(id).catch(saveErr); }
function persistVessel(v){ window.SteepDB.putVessel(v).catch(saveErr); }
function dropVessel(id){ window.SteepDB.removeVessel(id).catch(saveErr); }
function persistSession(s){ window.SteepDB.putSession(s).catch(saveErr); }
function dropSession(id){ window.SteepDB.removeSession(id).catch(saveErr); }
function persistTag(tag){ window.SteepDB.addTag(tag).catch(saveErr); }

/* ---------- helpers ---------- */
function fmtStars(v){ return v.toFixed(1).replace('.0',''); }
function typeLabel(k){ const t = TYPES.find(x=>x.k===k); return t?t.label:k; }
function teaById(id){ return state.teas.find(t=>t.id===id); }
function vesselById(id){ return state.vessels.find(v=>v.id===id); }
function fmtSec(s){ s=Math.round(s); const m=Math.floor(s/60); const sec=s%60; return String(m).padStart(2,'0')+':'+String(sec).padStart(2,'0'); }
// A session's infusion count: real steeps if it has them, else the quick-log count.
function steepCountOf(s){ return (s.steeps && s.steeps.length) ? s.steeps.length : (Number(s.infusionCount)||0); }
function brewCountLabel(s){
  if(s.steeps && s.steeps.length){ const n=s.steeps.length; return `${n} steep${n===1?'':'s'}`; }
  const n=Number(s.infusionCount)||0; return n?`${n} infusion${n===1?'':'s'}`:'';
}
function fmtDate(iso){ const d=new Date(iso); return d.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}); }
function fmtDateTime(iso){ const d=new Date(iso); return d.toLocaleDateString(undefined,{month:'short',day:'numeric'})+' '+d.toLocaleTimeString(undefined,{hour:'2-digit',minute:'2-digit'}); }
function toLocalDatetimeValue(date){
  const d = date instanceof Date ? date : new Date(date);
  const pad = n=>String(n).padStart(2,'0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function dayKey(iso){ const d=new Date(iso); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }

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
// Steep logo — 8-bit gaiwan (placeholder for human-made art later; swap this one
// function and every logo across the app updates). Based on the dragon gaiwan.
function steepLogoSVG(px){
  px = px || 30;
  const grid = [
    "................",
    ".......kk.......",
    ".......kk.......",
    "....llllllll....",
    "...llllllllll...",
    "..llllllllllll..",
    ".rrrrrrrrrrrrrr.",
    "..bbbbbbbbbbbb..",
    "..bbbdbbbbdbbb..",
    "..bbbbbbbbbbbb..",
    "...bbbbbbbbbb...",
    "....bbbbbbbb....",
    "......ffff......",
    "................",
    "................",
    "................"
  ];
  const col = { k:'#C9B48A', l:'#E7D9B8', r:'#CBB07A', b:'#EDE2C6', d:'#6E5637', f:'#C9B48A' };
  let rects='';
  for(let r=0;r<grid.length;r++){ for(let c=0;c<grid[r].length;c++){ const ch=grid[r][c]; if(col[ch]) rects+=`<rect x="${c}" y="${r}" width="1" height="1" fill="${col[ch]}"/>`; } }
  return `<svg width="${px}" height="${px}" viewBox="0 0 16 16" shape-rendering="crispEdges" style="display:block;" role="img" aria-label="Steep">${rects}</svg>`;
}
function render(){
  const app = document.getElementById('app');
  if(!state.loaded){ app.innerHTML = '<div class="empty">Loading your tea log…</div>'; return; }
  // Meditative focus mode — a calm, distraction-free steeping screen (no topbar).
  const fd = state.sessionDraft;
  if(fd && fd.stage==='steeping' && fd.focusMode){
    app.innerHTML = `<div class="focus-screen">${sessionFocusHTML(fd)}</div>`;
    bindDynamic();
    return;
  }
  let body = '';
  if(state.view==='dashboard') body = viewDashboard();
  else if(state.view==='teas') body = viewTeas();
  else if(state.view==='tea-detail') body = viewTeaDetail();
  else if(state.view==='vessels') body = viewVessels();
  else if(state.view==='sessions') body = viewSessions();
  else if(state.view==='friends') body = viewFriends();
  else if(state.view==='achievements') body = viewAchievements();
  else if(state.view==='passport') body = viewPassport();
  else if(state.view==='wrapped') body = viewWrapped();
  else if(state.view==='shopping') body = viewShopping();
  else if(state.view==='session') body = viewSessionFlow();

  const inSession = state.view==='session';
  app.innerHTML = `
    <div class="topbar"><div class="topbar-inner">
      <div class="topbar-brandrow">
        <div class="brand">${steepLogoSVG(30)}<h1>Steep</h1></div>
        <div class="topbar-actions">
          <button class="icon-btn ${state.view==='shopping'?'active':''}" onclick="goView('shopping')" title="Shopping list" aria-label="Shopping list">🛒</button>
          <button class="icon-btn ${state.view==='passport'?'active':''}" onclick="goView('passport')" title="Tea passport" aria-label="Tea passport">🌍</button>
          ${state.settings.showAchievements ? `<button class="icon-btn ${state.view==='achievements'?'active':''}" onclick="goView('achievements')" title="Achievements" aria-label="Achievements">🏆</button>` : ''}
          <button class="icon-btn" onclick="openSettings()" title="Settings" aria-label="Settings">⚙</button>
          <button class="icon-btn" id="themeToggleBtn" onclick="toggleTheme()" title="Toggle dark mode" aria-label="Toggle dark mode"></button>
        </div>
      </div>
      <div class="tabs">
        <button class="tab ${state.view==='dashboard'?'active':''}" onclick="goView('dashboard')">Home</button>
        <button class="tab ${state.view==='teas'||state.view==='tea-detail'?'active':''}" onclick="goView('teas')">Teas</button>
        <button class="tab ${state.view==='sessions'?'active':''}" onclick="goView('sessions')">Sessions</button>
        <button class="tab ${state.view==='vessels'?'active':''}" onclick="goView('vessels')">Vessels</button>
        <button class="tab ${state.view==='friends'?'active':''}" onclick="goFriends()">Friends</button>
      </div>
      ${inSession ? '' : `<button class="btn-log btn-log-wide" onclick="quickLogSession()">＋ Log session</button>`}
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

