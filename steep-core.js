// App version — the single source of truth for the user-visible version string (Settings footer +
// the feedback mailto subject). BUMP THIS EVERY DEPLOY alongside CACHE_NAME in service-worker.js.
const APP_VERSION = 'v3.68';

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
// Error log (v3.60) — a quiet localStorage ring buffer for after-the-fact diagnostics.
// It NEVER surfaces proactively; it's only readable under Settings → Data. Device-local like the
// theme (not synced) — errors are per-device and we don't want them in Postgres. A logging path
// must never itself throw, so every access is wrapped.
const ERRLOG_KEY = 'tealog_errorLog', ERRLOG_MAX = 20;
function logError(message, source){
  try{
    const buf = readErrorLog();
    buf.push({ ts: Date.now(), message: String(message==null?'':message).slice(0,300), source: String(source||'').slice(0,140) });
    while(buf.length > ERRLOG_MAX) buf.shift();
    localStorage.setItem(ERRLOG_KEY, JSON.stringify(buf));
  }catch(e){ /* storage full / private mode — diagnostics are best-effort, never fatal */ }
}
function readErrorLog(){ try{ return JSON.parse(localStorage.getItem(ERRLOG_KEY)||'[]')||[]; }catch(e){ return []; } }
function clearErrorLog(){ try{ localStorage.removeItem(ERRLOG_KEY); }catch(e){} }
if(typeof window !== 'undefined' && window.addEventListener){
  window.addEventListener('error', e=>{ logError((e && (e.message || (e.error && e.error.message))) || 'error', ((e && e.filename)||'') + (e && e.lineno ? (':'+e.lineno) : '')); });
  window.addEventListener('unhandledrejection', e=>{ const r = e && e.reason; logError((r && (r.message||r.error)) || String(r), 'unhandledrejection'); });
}

let _saveErrShown = false;
function saveErr(e){
  console.error('[Steep] save failed', e);
  logError((e && e.message) || 'save failed (offline?)', 'saveErr'); // v3.60: the durable home promised in v3.58
  // v3.58: was a blocking alert(); now a long-lived toast (carries data-loss info — "re-save once
  // back online" — so it lingers ~12s, not the default 4.2s).
  if(!_saveErrShown){
    _saveErrShown = true;
    showToast("Couldn't sync that change — you may be offline. It'll need to be re-saved once you're back online.", 12000);
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
  // v3.66: surface as a sticky inline notice on the social view (not a browser alert). These are
  // multi-sentence setup diagnostics, so a toast would be wrong; dismissed via dismissSocialErr().
  if(state && state.social){ state.social.err = msg; render(); }
  else showToast(msg, 12000);
}

/* ---------- state ---------- */
const DEFAULT_TAGS = ["floral","fruity","roasted","vegetal","umami","sweet","astringent","woody","honey","mineral","creamy","smoky","malty","buttery","grassy","stonefruit","citrus"];
const TYPES = [
  {k:'green',label:'Green'},{k:'black',label:'Black'},{k:'oolong',label:'Oolong'},
  {k:'puerh',label:'Pu-erh'},{k:'yellow',label:'Yellow'},{k:'white',label:'White'}
];
// Canonical type ordering for grouped displays (session tea picker + Teas-tab default sort).
const TYPE_ORDER = ['green','white','yellow','oolong','black','puerh','herbal'];
function typeRank(k){ const i = TYPE_ORDER.indexOf(k); return i<0 ? TYPE_ORDER.length : i; }
// Teas grouped by type (TYPE_ORDER), alphabetical within each group. Unknown types sort last.
// Returns [{type,label,teas:[…]}] — the picker renders these as <optgroup>s.
function groupTeasByType(teas){
  const groups = {};
  (teas||[]).forEach(t=>{ (groups[t.type]=groups[t.type]||[]).push(t); });
  return Object.keys(groups)
    .sort((a,b)=> (typeRank(a)-typeRank(b)) || a.localeCompare(b))
    .map(type=>({ type, label: typeLabel(type),
      teas: groups[type].slice().sort((a,b)=>(a.name||'').localeCompare(b.name||'')) }));
}
// Flat version of the same ordering — the Teas-tab default sort.
function sortTeasByTypeThenName(teas){ return groupTeasByType(teas).flatMap(g=>g.teas); }
const VESSEL_TYPES = ['Gaiwan','Kyusu','Yixing teapot','Porcelain teapot','Glass teapot','Mug','Cold brew jar','Other'];
// Top-level views whose selection is remembered across reloads (init restore + saveView).
const PERSISTED_VIEWS = ['dashboard','insights','teas','sessions','friends'];
const DEFAULT_SETTINGS = { tempUnit:'c', soundEnabled:true, showAchievements:true, quietMode:false, lowStockThreshold:15, defaultPackagingTareG:10, brewGuideAutofill:true, brewAdvice:true, showMood:true, ratioAdjust:false };
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
  showErrorLog: false, showDataHealth: false, // Settings → Data diagnostics panels (v3.60)
  pendingImport: null, // parsed backup awaiting the inline replace-all confirm (Settings → Data)
  calMonth: null, calSelDay: null,
  teaSort: 'type', teaFilter: { type:'', vendor:'', lowStock:false }, teaSeg: 'teas',
  recapPeriod: 'week',
  passportSel: null, passportZoom: null, passportSub: null,
  social: { loaded:false, busy:false, profile:null, tab:'feed', following:[], feed:null, search:null, profileEditOpen:false, draft:null, err:null, feedLoadingMore:false },
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
  if(savedView==='tea-detail'){
    const tid = (()=>{ try{ return localStorage.getItem('tealog_activeTea'); }catch(e){ return null; } })();
    const t = tid && state.teas.find(x=>x.id===tid);
    if(t){ state.view='tea-detail'; state.activeTeaId=tid; state.teaDetailFrom='teas'; }
    else state.view='teas';
  } else if(savedView==='vessels'){ state.view='teas'; state.teaSeg='vessels'; } // pre-v3.46 persisted 'vessels' → Teas tab, vessels segment
  else if(savedView && PERSISTED_VIEWS.includes(savedView)) state.view = savedView;
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
}
function persistSettings(){ window.SteepDB.saveSettings(state.settings).catch(saveErr); }
function tempUnitLabel(){ return state.settings.tempUnit==='f' ? '°F' : '°C'; }
function cToDisplay(c){ if(c==null||c==='') return ''; return state.settings.tempUnit==='f' ? Math.round(c*9/5+32) : c; }
function displayToC(v){ if(v===''||v==null) return null; v=Number(v); if(isNaN(v)) return null; return state.settings.tempUnit==='f' ? Math.round((v-32)*5/9) : v; }

/* ---------- brew-guide parsing (v3.24) ----------
   Reads a tea's free-text "How to brew" note into a light schedule:
   { tempC, rinseSeconds, times:[secs...] }. Rule-based and forgiving —
   returns null when it can't find anything usable (calm-first: no schedule,
   no fuss). tempC is always Celsius (display via cToDisplay). */
function bg_extractTimes(w){
  const toSec=(numStr,unit)=>{ let n=parseFloat(numStr); if(isNaN(n)) return null;
    if(unit && /^m/.test(unit)) return Math.round(n*60);
    if(unit==="'") return Math.round(n*60);
    return Math.round(n); };
  // m:ss clock tokens (e.g. 1:30)
  const clocks=[]; let cm; const clockRe=/(\d+):(\d{2})/g;
  while(cm=clockRe.exec(w)){ clocks.push(Number(cm[1])*60+Number(cm[2])); }
  let cleaned = w.replace(/\d+:\d{2}/g,' ');
  const U='(?:s|sec|secs|second|seconds|m|min|mins|minute|minutes)?';
  // slash-separated run (the dominant gongfu notation)
  let runTimes=[];
  const slashRun = cleaned.match(new RegExp('\\d+(?:\\.\\d+)?\\s*'+U+'\\s*(?:\\/\\s*\\d+(?:\\.\\d+)?\\s*'+U+'\\s*){1,}'));
  if(slashRun){
    const govMin=/\b(m|min|mins|minute|minutes)\b/.test(slashRun[0]) && !/\b(s|sec|secs|second|seconds)\b/.test(slashRun[0]);
    slashRun[0].split('/').forEach(p=>{ const mm=p.match(/(\d+(?:\.\d+)?)\s*(m|min|mins|minute|minutes|s|sec|secs|second|seconds)?/);
      if(mm){ const v=toSec(mm[1],mm[2]||(govMin?'m':'')); if(v!=null) runTimes.push(v); } });
    cleaned = cleaned.replace(slashRun[0],' ');
  }
  // comma-separated run
  let commaTimes=[];
  if(runTimes.length<2){
    const commaRun = cleaned.match(new RegExp('\\d+(?:\\.\\d+)?\\s*'+U+'\\s*(?:,\\s*\\d+(?:\\.\\d+)?\\s*'+U+'\\s*){1,}'));
    if(commaRun){
      const govMin=/\b(m|min|mins|minute|minutes)\b/.test(commaRun[0]) && !/\b(s|sec|secs|second|seconds)\b/.test(commaRun[0]);
      commaRun[0].split(',').forEach(p=>{ const mm=p.match(/(\d+(?:\.\d+)?)\s*(m|min|mins|minute|minutes|s|sec|secs|second|seconds)?/);
        if(mm){ const v=toSec(mm[1],mm[2]||(govMin?'m':'')); if(v!=null) commaTimes.push(v); } });
      cleaned = cleaned.replace(commaRun[0],' ');
    }
  }
  // explicit unit tokens anywhere (e.g. "4 min", "20s")
  let unitTimes=[]; let um; const unitRe=/(\d+(?:\.\d+)?)\s*(min|mins|minute|minutes|m|sec|secs|seconds|second|s)\b/g;
  while(um=unitRe.exec(cleaned)){ const v=toSec(um[1],um[2]); if(v!=null) unitTimes.push(v); }
  let out=[];
  if(runTimes.length>=2) out=runTimes;
  else if(commaTimes.length>=2) out=commaTimes;
  else out=clocks.concat(unitTimes);
  if(!out.length) out=runTimes.concat(commaTimes,clocks,unitTimes);
  return out;
}
function parseBrewGuide(text){
  if(!text || typeof text!=='string') return null;
  let s=' '+text.toLowerCase().replace(/[\u2013\u2014]/g,'-')+' ';
  // temperature — support a range ("60-75°C" -> midpoint) as well as a single value
  let tempC=null;
  let mtr = s.match(/(\d{2,3})\s*-\s*(\d{2,3})\s*(?:°\s*)?(c|f|°|deg|degrees?)/);
  let mt  = s.match(/(\d{2,3})\s*°?\s*(c|f)\b/) || s.match(/(\d{2,3})\s*(?:°|deg|degree|degrees)/);
  if(mtr){ const v=Math.round((Number(mtr[1])+Number(mtr[2]))/2); tempC = /f/.test(mtr[3]) ? Math.round((v-32)*5/9) : v; }
  else if(mt){ const val=Number(mt[1]); tempC = mt[2]==='f' ? Math.round((val-32)*5/9) : val; }
  else if(/\bboil/.test(s)) tempC=100;
  if(tempC!=null && (tempC<40||tempC>100)) tempC=null;
  // capture an explicit infusion count — used to spread a single time-range across N steeps
  const infM = s.match(/(\d+)\s*(?:infusions?|steeps?|brews?|times?|aufg[uü]sse?)\b/);
  const infCount = infM ? Math.max(1, Math.min(20, parseInt(infM[1],10))) : null;
  // strip temp + non-time numeric tokens so they can't be read as steep times
  let w = s
    .replace(/(\d{2,3})\s*-\s*(\d{2,3})\s*°?\s*[cf]\b/g,' ')   // temp range
    .replace(/(\d{2,3})\s*°?\s*[cf]\b/g,' ')
    .replace(/(\d{2,3})\s*°/g,' ')
    .replace(/\d+(?:\.\d+)?\s*(?:g|grams?|ml|oz|%|ppm)\b/g,' ')
    .replace(/\bx\s*\d+\b/g,' ')
    .replace(/\b(?:x\s*)?\d+\s*(?:infusions?|steeps?|brews?|times?|aufg[uü]sse?)\b/g,' ')
    .replace(/\b(19|20)\d{2}\b/g,' ')
    // "add 5-10s (each / per steep / thereafter)" is a ramp instruction, not a steep time — drop it
    .replace(/\b(?:add|plus|\+)\s*\d+(?:\s*-\s*\d+)?\s*(?:s|sec|secs|second|seconds)\b(?:\s*(?:each|per\s+steep|for\s+each(?:\s+steep)?|every\s+steep|thereafter|after)?)?/g,' ');
  // rinse — extract before time parsing so its seconds aren't read as a steep
  let rinseSeconds=null, rm;
  if(rm=w.match(/(\d+)\s*(?:s|sec|secs)?\s*rinse\b/)) rinseSeconds=Number(rm[1]);
  else if(rm=w.match(/\brinse\s*:?\s*(\d+)\s*(?:s|sec|secs)\b/)) rinseSeconds=Number(rm[1]);
  if(rm) w=w.replace(rm[0],' ');
  w=w.replace(/\brinse\b/g,' ');
  // times: if a single time-range is the only timing info, spread it start→end across the
  // infusion count ("15-30s, 3 infusions" -> 15,23,30). Otherwise collapse ranges to
  // midpoints (so "10-15s / 15-20s" reads as two steeps) and extract as usual.
  const rangeRe=/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*(s|sec|secs|second|seconds|m|min|mins|minute|minutes)\b/g;
  const rngs=[...w.matchAll(rangeRe)];
  let times=null;
  if(rngs.length===1){
    const rest=w.replace(rngs[0][0],' ').replace(/\b\d+\s*(?:st|nd|rd|th)\b/g,' ');
    if((bg_extractTimes(rest)||[]).length===0){
      const toS=(x,u)=>/^m/.test(u)?Math.round(parseFloat(x)*60):Math.round(parseFloat(x));
      const lo=toS(rngs[0][1],rngs[0][3]), hi=toS(rngs[0][2],rngs[0][3]);
      const n=infCount||2; times=[];
      for(let i=0;i<n;i++) times.push(n<=1?lo:Math.round(lo+(hi-lo)*i/(n-1)));
    }
  }
  if(!times){
    const w2=w
      .replace(rangeRe,(m,a,b,u)=>(Math.round(((+a)+(+b))/2*10)/10)+u)   // range -> midpoint
      .replace(/\b\d+\s*(?:st|nd|rd|th)\b/g,' ');                        // ordinals
    times=bg_extractTimes(w2)||[];
  }
  times=times.filter(n=>n>=1&&n<=1800).slice(0,12);
  if(!times.length && tempC==null) return null;
  return { tempC, rinseSeconds, times };
}
/* ---------- leaf-form steep curves (v3.29) ----------
   Leaf morphology, not just tea type, drives how steep times should progress:
   rolled/compressed leaves open over infusions (small early increments, bigger
   later); open/strip leaves are strongest early and must ramp from the start;
   greens flash-dip on the 2nd steep then climb; buds release slowly and steadily.
   Each profile: base = S1 seconds (only used when generating with no listed times);
   mult = per-steep multipliers vs base for the opening steeps (encodes the green
   dip / slow start); growth = how the *gap* expands per steep after that; min/max/def
   bound the extrapolated increment. Explicit guide times always win — these only
   fill a missing schedule and extend past the last listed steep. */
const LEAF_PROFILES = {
  // v3.42 retune (knowledge/brew-guides.md batch 2): oolong/bud/compressed families now encode the
  // opening dip (2nd steep shorter than 1st) that vendors + Niklas's logs confirm across oolongs, and
  // bases are moved to the moderate/gaiwan school so a matched style's KB `first` lands in range.
  rolled:     { label:'Rolled / balled',   base:45, mult:[1,0.6,0.6,0.75,0.95,1.2], growth:1.12, minInc:3, maxInc:30, defInc:5 },
  open:       { label:'Strip / open leaf', base:40, mult:[1,0.7,0.9,1.15,1.45,1.9], growth:1.15, minInc:4, maxInc:18, defInc:6 },
  bud:        { label:'Bud / needle',      base:55, mult:[1,0.8,1.0,1.25,1.6],      growth:1.15, minInc:5, maxInc:45, defInc:8 },
  green_cn:   { label:'Green — pan-fired',  base:12, mult:[1,0.65,1.1,1.6,2.2], growth:1.30, minInc:3, maxInc:45, defInc:6 },
  green_jp:   { label:'Green — steamed',    base:10, mult:[1,0.6,1.05,1.7],     growth:1.35, minInc:3, maxInc:45, defInc:6 },
  compressed: { label:'Compressed / cake',  base:22, mult:[1,0.9,1.0,1.2,1.5,1.9],   growth:1.18, minInc:3, maxInc:40, defInc:5 }
};
const LEAF_FORM_KEYS = Object.keys(LEAF_PROFILES);
// Bridge steep-knowledge.js's leafForm vocabulary → the six LEAF_PROFILES families here.
// (The KB uses finer names — steamed/pan/roasted green, strip vs open — that collapse onto
// our curve families.) Any KB leafForm not listed falls through to the name/type heuristics.
const KB_LEAFFORM_TO_PROFILE = {
  steamed_green:'green_jp', roasted_green:'green_cn', pan_green:'green_cn', powder:'green_jp',
  rolled:'rolled', bud:'bud', open_leaf:'open', strip:'open', compressed:'compressed'
};

/* ---------- leaf-to-water ratio (brew advice v2, v3.57) ----------
   The missing 3rd advice axis: how much leaf for how much water. Scales the whole prefilled
   schedule (curve shape preserved) by a heavier/lighter pour vs a per-method baseline. STRICT
   OPT-IN (state.settings.ratioAdjust); when off, none of this is reached. All ratios g per 100ml.
   Tunables live here next to LEAF_PROFILES: */
const RATIO_K = 0.6;                 // time = 1/ratioFactor^k — how hard leaf amount bends the times
const RATIO_TIME_MIN = 0.6;         // caps ±40% so a wild ratio can't produce a nonsense schedule
const RATIO_TIME_MAX = 1.4;
const GONGFU_VESSEL_MAX_ML = 150;   // vessels at/under this default to gongfu, else western
const METHOD_MISMATCH_MAX = 2.5;    // if the factor still exceeds this after method-aware resolution,
                                    // don't scale (a visibly-skipped adjustment beats a wrong one)
// Last-resort per-LEAF_PROFILES-family baseline ratios, method-split (g/100ml). Only used when
// neither the guide nor the KB resolves a baseline. Deliberately coarse — the KB is the real source.
const LEAF_RATIO_DEFAULT = {
  green_jp:   { western:1.8, gongfu:3.0 },
  green_cn:   { western:1.4, gongfu:3.0 },
  rolled:     { western:0.8, gongfu:3.5 },
  open:       { western:1.3, gongfu:4.0 },
  bud:        { western:1.5, gongfu:4.5 },
  compressed: { western:1.6, gongfu:5.0 }
};
// Method for a session: explicit brewStyle wins; else infer from the vessel's capacity.
function brewMethodFor(brewStyle, capacityMl){
  if(brewStyle==='gongfu'||brewStyle==='western') return brewStyle;
  const cap = Number(capacityMl);
  return (cap>0 && cap<=GONGFU_VESSEL_MAX_ML) ? 'gongfu' : 'western';
}
// Grams+ml stated in a brew guide → g/100ml (method-agnostic; the guide is the guide). Needs BOTH
// a grams token and an ml token ("5g auf 200ml", "6 g / 100 ml", "3-4g, 90s" → null: no ml).
function bg_extractRatio(text){
  if(!text || typeof text!=='string') return null;
  const s = ' '+text.toLowerCase().replace(/[–—]/g,'-')+' ';
  const gm = s.match(/(\d+(?:\.\d+)?)(?:\s*-\s*(\d+(?:\.\d+)?))?\s*g(?:rams?)?\b/);
  const mm = s.match(/(\d+(?:\.\d+)?)\s*ml\b/);
  if(!gm || !mm) return null;
  const grams = gm[2] ? (parseFloat(gm[1])+parseFloat(gm[2]))/2 : parseFloat(gm[1]);
  const ml = parseFloat(mm[1]);
  if(!(grams>0) || !(ml>0)) return null;
  return grams/(ml/100);
}
// Baseline ratio for a tea under a method: (a) guide-stated grams+ml → (b) KB ratio for the method
// → (c) per-leaf-form default for the method. Returns {ratio, source} or null.
function baselineRatioFor(tea, method){
  const g = bg_extractRatio(tea && tea.brewGuide);
  if(g>0) return { ratio:g, source:'guide' };
  if(typeof kbResolve==='function'){
    const kb = kbResolve([tea&&tea.name, tea&&tea.cultivar, tea&&tea.origin].filter(Boolean).join(' '));
    if(kb){
      const r = method==='gongfu' ? (Number(kb.ratioGongfu)||Number(kb.ratio)) : (Number(kb.ratioWestern)||Number(kb.ratio));
      if(r>0) return { ratio:r, source:'kb' };
    }
  }
  const d = LEAF_RATIO_DEFAULT[effectiveLeafForm(tea)];
  if(d) return { ratio: method==='gongfu'?d.gongfu:d.western, source:'leaf' };
  return null;
}
// The per-session ratio verdict. ctx = {gramsUsed, waterMl, brewStyle, capacityMl}. Returns null when
// opt-in is off or there isn't enough to compute (calm-first: no grams / no water → silent no-op).
// When it CAN compute but the factor is implausibly large even after method-aware resolution, returns
// applied:false with a reason so the UI can say it's holding off rather than scale confidently-wrong.
function computeSessionRatio(tea, ctx){
  if(state.settings.ratioAdjust!==true) return null;
  if(!tea || !ctx || ctx.isColdBrew) return null;
  const grams = Number(ctx.gramsUsed);
  const ml = (ctx.waterMl!=null && ctx.waterMl!=='') ? Number(ctx.waterMl) : Number(ctx.capacityMl);
  if(!(grams>0) || !(ml>0)) return null;
  const method = brewMethodFor(ctx.brewStyle, ctx.capacityMl);
  const bl = baselineRatioFor(tea, method);
  if(!bl || !(bl.ratio>0)) return null;
  const actualRatio = grams/(ml/100);
  const ratioFactor = actualRatio/bl.ratio;
  const overMismatch = ratioFactor>METHOD_MISMATCH_MAX || ratioFactor<1/METHOD_MISMATCH_MAX;
  const timeFactor = Math.max(RATIO_TIME_MIN, Math.min(RATIO_TIME_MAX, 1/Math.pow(ratioFactor, RATIO_K)));
  return {
    method, actualRatio, baselineRatio:bl.ratio, baselineSource:bl.source,
    ratioFactor, timeFactor, applied: !overMismatch, mismatch: overMismatch
  };
}
// Scale a schedule's steep times by the ratio timeFactor (temp + rinse untouched — temp stays owned
// by the feedback axis). Returns a new schedule object; never mutates the input.
function ratioScaleSchedule(sched, timeFactor){
  if(!sched || !(timeFactor>0) || timeFactor===1) return sched;
  return { ...sched, times: (sched.times||[]).map(t=>Math.max(3, Math.round(t*timeFactor))) };
}
// "Heavier pour than the baseline (2.1 vs 1.4 g/100ml) — times shortened ≈19%."
function ratioMemoryText(r){
  if(!r) return '';
  const g=x=>(Math.round(x*100)/100).toString();
  const cmp = r.ratioFactor>=1 ? 'Heavier' : 'Lighter';
  const nums = `(${g(r.actualRatio)} vs ${g(r.baselineRatio)} g/100ml)`;
  if(r.mismatch) return `${cmp} pour than the baseline ${nums} — too far off to adjust confidently, so times are left as-is.`;
  const pct = Math.round(Math.abs(1-r.timeFactor)*100);
  if(pct<1) return `Pour matches the baseline ${nums} — times unchanged.`;
  const dir = r.timeFactor<1 ? 'shortened' : 'lengthened';
  return `${cmp} pour than the baseline ${nums} — times ${dir} ≈${pct}%.`;
}
function niceSec(s){ s=Math.round(s); if(s>=60) s=Math.round(s/5)*5; return Math.max(3,Math.min(1800,s)); }

// Infer a leaf form from the tea's name (cultivar/region/leaf words win, since
// vendor type labels are unreliable), then fall back to the type default.
function inferLeafForm(tea){
  // Knowledge base first: it resolves cultivar/region/style names the old name-only
  // heuristics miss (Japanese cultivars → steamed green, silver-bud whites → bud, etc.).
  // Consults name + cultivar + origin, then maps the KB's leafForm onto a curve family.
  if(typeof kbResolve==='function'){
    const kb = kbResolve([tea&&tea.name, tea&&tea.cultivar, tea&&tea.origin].filter(Boolean).join(' '));
    const mapped = kb && KB_LEAFFORM_TO_PROFILE[kb.leafForm];
    if(mapped) return mapped;
  }
  const n = ((tea&&tea.name)||'').toLowerCase();
  const has = (...ks)=>ks.some(k=>n.includes(k));
  if(has('gyokuro','sencha','kabuse','kabusecha','tamaryokucha','fukamushi','matcha','japan')) return 'green_jp';
  if(has('silver needle','yinzhen','yin zhen','baihao yinzhen','bai hao yin','junshan','jun shan')) return 'bud';
  if(has('dan cong','dancong','yancha','wuyi','wu yi','rou gui','rougui','shui xian','shuixian',
         'da hong pao','dahongpao','shui jin gui','tie luo han','bai ji guan','rock oolong','cliff','qi lan','qilan')) return 'open';
  if(has('cake','bing','tuo','brick','compressed','pressed')) return 'compressed';
  switch(tea&&tea.type){
    case 'green':  return 'green_cn';
    case 'white':  return 'open';                                   // bai mu dan / pai mu tan (needle & cake caught above)
    case 'oolong': return 'rolled';                                 // Dan Cong / yancha caught above
    case 'puerh':  return has('loose','shou','ripe','maocha') ? 'open' : 'compressed';
    case 'black':  return 'open';
    case 'yellow': return has('needle','bud') ? 'bud' : 'green_cn';
    default:       return 'open';
  }
}
// The form actually used: an explicit field wins; blank = inferred.
function effectiveLeafForm(tea){
  const f = tea && tea.leafForm;
  return (f && LEAF_PROFILES[f]) ? f : inferLeafForm(tea);
}
function leafFormLabel(tea){
  const key = effectiveLeafForm(tea);
  const explicit = tea && tea.leafForm && LEAF_PROFILES[tea.leafForm];
  return LEAF_PROFILES[key].label + (explicit ? '' : ' · auto');
}
// Generate the opening steep times for a form (seconds), when no guide lists them. baseOverride
// (v3.42) lets a matched KB style supply its canonical first-steep length in place of the family
// base, so e.g. dancong opens at 25s and Tie Guan Yin at 45s while sharing the family's dip/growth.
function generateFormTimes(form, n, baseOverride){
  const p = LEAF_PROFILES[form] || LEAF_PROFILES.open; n = n || 6;
  const base = (Number(baseOverride) > 0) ? Number(baseOverride) : p.base;
  const out=[];
  for(let i=0;i<n;i++){
    const m = i<p.mult.length ? p.mult[i]
      : p.mult[p.mult.length-1]*Math.pow(p.growth, i-(p.mult.length-1));
    out.push(niceSec(base*m));
  }
  return out;
}

// Suggested time (seconds) for steep index i. Within the listed steeps, returns
// them verbatim; past them, extends using the leaf form's expanding gap so open
// leaves ramp harder than rolled ones (and long gongfu sessions keep a hint).
function scheduleTimeForIndex(sched, i){
  if(!sched || !sched.times || !sched.times.length) return null;
  const t=sched.times;
  if(i < t.length) return t[i];
  const p = LEAF_PROFILES[sched.form] || null;
  const growth = p?p.growth:1.0, minInc = p?p.minInc:5, maxInc = p?p.maxInc:30, defInc = p?p.defInc:10;
  let gap = t.length>=2 ? (t[t.length-1]-t[t.length-2]) : defInc;
  if(!(gap>0)) gap = defInc;
  let cur = t[t.length-1];
  for(let k=0, steps=i-(t.length-1); k<steps; k++){
    gap = Math.max(minInc, Math.min(maxInc, gap*growth));
    cur += gap;
  }
  return niceSec(Math.min(1800, cur));
}

// The schedule that should prefill a session: an explicit guide's times win; if a
// guide has no times (or none at all), fall back to a leaf-form-generated set when
// allowed (advice on). Always stamps the resolved `form` so extrapolation is aware.
function effectiveGuideSchedule(tea, allowGenerate){
  if(!tea) return null;
  const form = effectiveLeafForm(tea);
  const parsed = parseBrewGuide(tea.brewGuide);
  if(parsed && parsed.times && parsed.times.length) return { ...parsed, form, generated:false };
  if(allowGenerate){
    // A matched KB style contributes its canonical first-steep length as the generation base.
    const kb = (typeof kbResolve==='function') ? kbResolve([tea.name,tea.cultivar,tea.origin].filter(Boolean).join(' ')) : null;
    const kbFirst = (kb && Number(kb.first) > 0) ? Number(kb.first) : null;
    return {
      tempC: parsed ? parsed.tempC : null,
      rinseSeconds: parsed ? parsed.rinseSeconds : null,
      times: generateFormTimes(form, 6, kbFirst),
      form, generated:true
    };
  }
  return parsed ? { ...parsed, form, generated:false } : null; // temp-only guide, or nothing
}
// One-line human summary, e.g. "95°C · rinse 5s · 15 / 20 / 30 / 45s".
function brewScheduleSummary(sched){
  if(!sched) return '';
  const parts=[];
  if(sched.tempC!=null) parts.push(cToDisplay(sched.tempC)+tempUnitLabel());
  if(sched.rinseSeconds!=null) parts.push('rinse '+sched.rinseSeconds+'s');
  if(sched.times && sched.times.length){
    const shown = sched.times.slice(0,6).map(fmtSecShort);
    parts.push(shown.join(' / ')+(sched.times.length>6?' …':''));
  }
  return parts.join(' · ');
}
// Compact time label: "45s", "2m", "1m30s".
function fmtSecShort(s){ s=Math.round(s); if(s<60) return s+'s'; const m=Math.floor(s/60), sec=s%60; return sec? m+'m'+sec+'s' : m+'m'; }

/* ---------- brew advice (v3.25) ----------
   Turns a tea's past sessions into a gentle, opt-in tuning of its brew guide.
   Signal per session: explicit "how was it?" pick (feedback: good|strong|weak),
   else inferred from tasting tags. Aggregated into a small temp/time nudge from
   the parsed guide baseline. Sessions stay loose — this only surfaces when asked. */
const BREW_STRONG_TAGS = ['bitter','astringent','harsh','over-steeped','oversteeped','overbrewed','too strong','stewed'];
const BREW_WEAK_TAGS   = ['weak','watery','thin','flat','under-steeped','understeeped','bland','too light'];
function feedbackSignalOf(session){
  if(!session) return null;
  if(session.feedback==='strong'||session.feedback==='weak'||session.feedback==='good') return session.feedback;
  const tags = [].concat(session.tags||[], ...((session.steeps||[]).map(st=>st.tags||[])))
    .map(t=>String(t).toLowerCase().trim());
  if(tags.some(t=>BREW_STRONG_TAGS.includes(t))) return 'strong';
  if(tags.some(t=>BREW_WEAK_TAGS.includes(t))) return 'weak';
  return null;
}
// Sessions counted for advice: this tea, not cold brew, and (if a tuned baseline
// was saved into the guide) only those logged since — so saved tunings don't
// double-count. The "since" marker lives in synced settings, no tea migration.
function adviceSessionsFor(teaId){
  const since = (state.settings.brewTunedAt||{})[teaId];
  const sinceMs = since ? new Date(since).getTime() : 0;
  return (state.sessions||[])
    .filter(s=>s.teaId===teaId && !s.isColdBrew && new Date(s.date).getTime()>=sinceMs)
    .sort((a,b)=>new Date(b.date)-new Date(a.date))
    .slice(0,6);
}
// baseOverride (v3.57): when the caller has already ratio-scaled the base schedule, pass it in so the
// feedback nudge tunes ON TOP of the ratio correction (ordering: base → ratio → feedback → timeShift).
function computeBrewAdvice(tea, baseOverride){
  if(!tea) return null;
  const base = (baseOverride!==undefined) ? baseOverride : effectiveGuideSchedule(tea, state.settings.brewAdvice!==false);
  const sessions = adviceSessionsFor(tea.id);
  let strong=0, weak=0, good=0;
  sessions.forEach(s=>{ const sig=feedbackSignalOf(s); if(sig==='strong')strong++; else if(sig==='weak')weak++; else if(sig==='good')good++; });
  const count = strong+weak+good;
  const net = weak - strong; // + => hotter/longer, - => cooler/shorter
  const tempAdjC = Math.max(-6, Math.min(6, net*2));
  const timeAdjPct = Math.max(-24, Math.min(24, net*8));
  let tuned = base;
  if(base && (tempAdjC||timeAdjPct)){
    tuned = {
      tempC: base.tempC!=null ? Math.max(60, Math.min(100, base.tempC+tempAdjC)) : null,
      rinseSeconds: base.rinseSeconds,
      times: (base.times||[]).map(t=>Math.max(3, Math.round(t*(1+timeAdjPct/100)))),
      form: base.form, generated: base.generated
    };
  }
  if(!base && !count) return null;
  return { base, tuned, tempAdjC, timeAdjPct, net, count, strong, weak, good, hasNudge: !!(base && (tempAdjC||timeAdjPct)) };
}
// "Logged 5× · 3 just right · 2 a bit strong"
function adviceMemoryText(adv){
  if(!adv || !adv.count) return '';
  const bits=[];
  if(adv.good) bits.push(adv.good+' just right');
  if(adv.strong) bits.push(adv.strong+' a bit strong');
  if(adv.weak) bits.push(adv.weak+' a bit weak');
  return `Logged ${adv.count}×${bits.length?' · '+bits.join(' · '):''}`;
}
// Short human suggestion, e.g. "cooler (\u22125\u00b0) and shorter (\u2248\u22124s/steep)".
// Time is shown in seconds off a representative steep — a percent is hard to act on mid-brew.
function adviceSuggestionText(adv){
  if(!adv || !adv.hasNudge) return '';
  const parts=[];
  if(adv.tempAdjC) parts.push((adv.tempAdjC<0?'cooler':'hotter')+' ('+(adv.tempAdjC>0?'+':'')+Math.round(adv.tempAdjC*(state.settings.tempUnit==='f'?9/5:1))+(state.settings.tempUnit==='f'?'\u00b0F':'\u00b0')+')');
  if(adv.timeAdjPct){
    const t0 = (adv.base && adv.base.times && adv.base.times.length) ? adv.base.times[0] : 20;
    const d = Math.round(t0*adv.timeAdjPct/100);
    const secTxt = Math.abs(d)>=1 ? '\u2248'+(d>0?'+':'')+d+'s/steep' : (adv.timeAdjPct>0?'+':'')+adv.timeAdjPct+'%';
    parts.push((adv.timeAdjPct<0?'shorter':'longer')+' ('+secTxt+')');
  }
  return parts.join(' and ');
}
// Normalise a schedule back into brew-guide text: "92\u00b0C, 5s rinse, 13s / 17s / 26s". Times are
// emitted in RAW SECONDS on purpose \u2014 not fmtSecShort's "1m15s", whose compound m+s token
// parseBrewGuide reads back as 60s (the trailing seconds are dropped), so anything >=60s with a
// remainder would silently corrupt on the schedule -> text -> parse round-trip. Raw seconds
// round-trip exactly for every value; fixtures/brew-roundtrip-test.js locks this in for every
// LEAF_PROFILES / KB-generated schedule so no future emitter change can reintroduce the bug.
function scheduleToGuideText(sched){
  if(!sched) return '';
  const parts=[];
  if(sched.tempC!=null) parts.push(cToDisplay(sched.tempC)+tempUnitLabel());
  if(sched.rinseSeconds!=null) parts.push(sched.rinseSeconds+'s rinse');
  if(sched.times && sched.times.length) parts.push(sched.times.map(t=>Math.round(t)+'s').join(' / '));
  return parts.join(', ');
}

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
// The one HTML escaper. Everything user-entered (tea/vessel/session text, profile fields,
// tags, feed content from other users) MUST pass through this before going into an innerHTML
// template — both text content and double-quoted attribute values. Escapes all five of & < > " '
// so it's safe in either context. Replaced the old per-module esc() copies.
function escapeHtml(s){
  return String(s==null?'':s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
// For a value dropped into a single-quoted JS string inside an inline handler, e.g.
// onclick="fn('${escapeJsArg(x)}')". JS-escape first (so a quote/backslash/newline can't
// break out of the string), THEN HTML-escape (the browser HTML-decodes the attribute before
// the JS parses, so the entities round-trip back to safe literals).
function escapeJsArg(s){
  return escapeHtml(String(s==null?'':s).replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/\r?\n/g,'\\n'));
}
function fmtStars(v){ return v.toFixed(1).replace('.0',''); }
function typeLabel(k){ const t = TYPES.find(x=>x.k===k); return t?t.label:k; }
function teaById(id){ return state.teas.find(t=>t.id===id); }
// Tea lifecycle (v3.40). A tea's grams are "tracked" only if there's evidence the user manages
// its quantity: current amount > 0, a recorded purchase quantity, or a session that drew it down.
// Otherwise amountGrams=0 means "never tracked", NOT "empty" (unknown ≠ empty — the DB defaults
// amount_grams to 0, so 0 alone is ambiguous). A tea is FINISHED = tracked AND drained to zero;
// finished teas still count in all stats — only the pickers + Teas-tab default view treat them apart.
function isAmountTracked(tea){
  if(!tea) return false;
  if(Number(tea.amountGrams) > 0) return true;
  if(Number(tea.costOriginalGrams) > 0) return true;
  return (state.sessions||[]).some(s=>s.teaId===tea.id && Number(s.gramsUsed)>0);
}
function isTeaFinished(tea){ return isAmountTracked(tea) && Number(tea.amountGrams) <= 0; }
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
function monthKey(iso){ const d=new Date(iso); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0'); }
function monthLabel(key, withYear){ const [y,m]=key.split('-').map(Number); const d=new Date(y,m-1,1); return d.toLocaleDateString(undefined,{month:'short',...(withYear?{year:'numeric'}:{})}); }

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
  return `<svg width="${px}" height="${px}" viewBox="0 0 16 16" shape-rendering="crispEdges" style="display:block;" role="img" aria-label="SlowCup">${rects}</svg>`;
}
// WS3: hairline icon/accent from the index.html <defs> sprite. Inherits color via currentColor and
// stroke-width via the .hl CSS rule (bumped on dark). Pass the full symbol id (e.g. 'i-settings-hl',
// 'fav-leaf'); optional size (px) and extra class.
function icon(id, px, cls){ const s = px||21; return `<svg class="hl${cls?' '+cls:''}" viewBox="0 0 24 24" width="${s}" height="${s}" aria-hidden="true"><use href="#${id}"/></svg>`; }
// WS3: the tea-leaf favourite mark (jade), replacing ♥/★ everywhere favourites show.
function favLeaf(px){ return icon('fav-leaf', px||16, 'i-fav'); }
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
  else if(state.view==='insights') body = viewInsights();
  else if(state.view==='teas') body = viewTeas();
  else if(state.view==='tea-detail') body = viewTeaDetail();
  else if(state.view==='vessels'){ state.teaSeg='vessels'; state.view='teas'; body = viewTeas(); } // stray/persisted 'vessels' → Teas tab, vessels segment
  else if(state.view==='sessions') body = viewSessions();
  else if(state.view==='friends') body = viewFriends();
  else if(state.view==='achievements') body = viewAchievements();
  else if(state.view==='passport') body = viewPassport();
  else if(state.view==='wrapped') body = viewWrapped();
  else if(state.view==='shopping') body = viewShopping();
  else if(state.view==='spend') body = viewSpend();
  else if(state.view==='session') body = viewSessionFlow();

  const inSession = state.view==='session';
  app.innerHTML = `
    <div class="topbar"><div class="topbar-inner">
      <div class="topbar-brandrow">
        <div class="brand">${steepLogoSVG(30)}<h1>SlowCup</h1></div>
        <div class="topbar-actions">
          <button class="icon-btn ${state.view==='friends'?'active':''}" onclick="goFriends()" title="Friends" aria-label="Friends">${icon('i-friends-hl')}</button>
          <button class="icon-btn ${state.view==='shopping'?'active':''}" onclick="goView('shopping')" title="Shopping list" aria-label="Shopping list">${icon('i-shopping-hl')}</button>
          <button class="icon-btn ${state.view==='passport'?'active':''}" onclick="goView('passport')" title="Tea passport" aria-label="Tea passport">${icon('i-world-hl')}</button>
          ${state.settings.showAchievements ? `<button class="icon-btn ${state.view==='achievements'?'active':''}" onclick="goView('achievements')" title="Achievements" aria-label="Achievements">${icon('i-achievements-hl')}</button>` : ''}
          <button class="icon-btn" onclick="openSettings()" title="Settings" aria-label="Settings">${icon('i-settings-hl')}</button>
        </div>
      </div>
      <div class="tabs">
        <button class="tab ${state.view==='dashboard'?'active':''}" onclick="goView('dashboard')">Home</button>
        <button class="tab ${state.view==='teas'||state.view==='tea-detail'?'active':''}" onclick="goView('teas')">Teas</button>
        <button class="tab ${state.view==='sessions'?'active':''}" onclick="goView('sessions')">Sessions</button>
        <button class="tab ${state.view==='insights'||state.view==='wrapped'?'active':''}" onclick="goView('insights')">Insights</button>
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

function goView(v){
  if(v==='vessels') return goVessels();                 // vessels folded into the Teas tab (v3.46)
  state.view=v; state.activeTeaId=null; state.dashEdit=false;
  if(v==='teas') state.teaSeg='teas';                    // tapping Teas shows the teas segment
  if(v!=='passport'){ state.passportSel=null; state.passportZoom=null; state.passportSub=null; }
  saveView(v); render();
}
// Deep-link target: land on the Teas tab with the Vessels segment active. Anything that used to
// goView('vessels') (or set view='vessels') routes here, so old call sites keep working.
function goVessels(){
  state.teaSeg='vessels'; state.view='teas'; state.activeTeaId=null; state.dashEdit=false;
  saveView('teas'); render();
}
function saveView(v){ try{ if(PERSISTED_VIEWS.includes(v)){ localStorage.setItem('tealog_view', v); localStorage.removeItem('tealog_activeTea'); } }catch(e){} }

// Inline two-step confirm — the calm replacement for blocking confirm() on destructive buttons.
// Hides the clicked button in place and shows "<message>  Yes / Cancel" right after it, without a
// re-render, so unsaved fields nearby survive (the tea form + steeping steep inputs read on submit,
// not per-keystroke). Yes runs onYes() (pass an arrow from the inline handler); Cancel restores the
// button. Any later full render() just redraws the plain button — no stuck state to track. Since the
// action fires directly on Yes, sites with sensitive writes keep their own re-entrancy guard
// (e.g. deleteSession's _sessionSaving) — this never depended on confirm() blocking.
function armConfirm(btn, message, onYes){
  if(!btn || btn._confirmOpen) return;
  btn._confirmOpen = true;
  btn.style.display = 'none';
  const box = document.createElement('span');
  box.className = 'confirm-inline';
  box.style.cssText = 'display:inline-flex;gap:8px;align-items:center;font-size:13px;color:var(--ink-soft);';
  const label = document.createElement('span'); label.textContent = message; box.appendChild(label);
  const yes = document.createElement('button'); yes.type='button'; yes.className='btn-ghost'; yes.textContent='Yes'; yes.style.color='var(--red)'; yes.style.fontWeight='600';
  const no = document.createElement('button'); no.type='button'; no.className='btn-ghost'; no.textContent='Cancel';
  const restore = ()=>{ box.remove(); btn.style.display=''; btn._confirmOpen=false; };
  yes.addEventListener('click', ()=>{ restore(); try{ onYes(); }catch(e){ console.error('[Steep] confirm action failed', e); } });
  no.addEventListener('click', restore);
  box.appendChild(yes); box.appendChild(no);
  btn.insertAdjacentElement('afterend', box);
}

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
  // WS1 (v3.64) — SlowCup Wrapped carousel: sync the active dot to the scroll position.
  const wrapTrack = document.getElementById('wrapTrack');
  if(wrapTrack){
    const dots = [...document.querySelectorAll('.wrap-dot')];
    const upd = ()=>{ const wd = wrapTrack.clientWidth||1; const idx = Math.max(0, Math.min(dots.length-1, Math.round(wrapTrack.scrollLeft/wd))); dots.forEach((d,n)=>d.classList.toggle('active', n===idx)); };
    wrapTrack.onscroll = ()=> window.requestAnimationFrame(upd);
    window.requestAnimationFrame(upd);
  }
}

