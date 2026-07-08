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
// Top-level views whose selection is remembered across reloads (init restore + saveView).
const PERSISTED_VIEWS = ['dashboard','teas','sessions','vessels','friends'];
const DEFAULT_SETTINGS = { tempUnit:'c', soundEnabled:true, showAchievements:true, quietMode:false, lowStockThreshold:15, defaultPackagingTareG:10, monoFont:'pixel', brewGuideAutofill:true, brewAdvice:true, showMood:true };
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
  passportSel: null, passportZoom: null, passportSub: null,
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
  if(savedView==='tea-detail'){
    const tid = (()=>{ try{ return localStorage.getItem('tealog_activeTea'); }catch(e){ return null; } })();
    const t = tid && state.teas.find(x=>x.id===tid);
    if(t){ state.view='tea-detail'; state.activeTeaId=tid; state.teaDetailFrom='teas'; }
    else state.view='teas';
  } else if(savedView && PERSISTED_VIEWS.includes(savedView)) state.view = savedView;
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
  rolled:     { label:'Rolled / balled',   base:15, mult:[1,1,1.2,1.5,1.9],    growth:1.15, minInc:3, maxInc:30, defInc:5 },
  open:       { label:'Strip / open leaf', base:12, mult:[1,1.35,1.75,2.2],    growth:1.15, minInc:4, maxInc:18, defInc:6 },
  bud:        { label:'Bud / needle',      base:35, mult:[1,1.15,1.35,1.6,1.9],growth:1.15, minInc:5, maxInc:45, defInc:8 },
  green_cn:   { label:'Green — pan-fired',  base:12, mult:[1,0.65,1.1,1.6,2.2], growth:1.30, minInc:3, maxInc:45, defInc:6 },
  green_jp:   { label:'Green — steamed',    base:10, mult:[1,0.6,1.05,1.7],     growth:1.35, minInc:3, maxInc:45, defInc:6 },
  compressed: { label:'Compressed / cake',  base:15, mult:[1,1,1.15,1.4,1.8],   growth:1.18, minInc:3, maxInc:40, defInc:5 }
};
const LEAF_FORM_KEYS = Object.keys(LEAF_PROFILES);
// Bridge steep-knowledge.js's leafForm vocabulary → the six LEAF_PROFILES families here.
// (The KB uses finer names — steamed/pan/roasted green, strip vs open — that collapse onto
// our curve families.) Any KB leafForm not listed falls through to the name/type heuristics.
const KB_LEAFFORM_TO_PROFILE = {
  steamed_green:'green_jp', roasted_green:'green_cn', pan_green:'green_cn', powder:'green_jp',
  rolled:'rolled', bud:'bud', open_leaf:'open', strip:'open', compressed:'compressed'
};
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
// Generate the opening steep times for a form (seconds), when no guide lists them.
function generateFormTimes(form, n){
  const p = LEAF_PROFILES[form] || LEAF_PROFILES.open; n = n || 6;
  const out=[];
  for(let i=0;i<n;i++){
    const m = i<p.mult.length ? p.mult[i]
      : p.mult[p.mult.length-1]*Math.pow(p.growth, i-(p.mult.length-1));
    out.push(niceSec(p.base*m));
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
    return {
      tempC: parsed ? parsed.tempC : null,
      rinseSeconds: parsed ? parsed.rinseSeconds : null,
      times: generateFormTimes(form, 6),
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
function computeBrewAdvice(tea){
  if(!tea) return null;
  const base = effectiveGuideSchedule(tea, state.settings.brewAdvice!==false);
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
// Normalise a schedule back into brew-guide text: "92\u00b0C, 5s rinse, 13s / 17s / 26s".
function scheduleToGuideText(sched){
  if(!sched) return '';
  const parts=[];
  if(sched.tempC!=null) parts.push(cToDisplay(sched.tempC)+tempUnitLabel());
  if(sched.rinseSeconds!=null) parts.push(sched.rinseSeconds+'s rinse');
  if(sched.times && sched.times.length) parts.push(sched.times.map(t=>fmtSecShort(t)).join(' / '));
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
  else if(state.view==='spend') body = viewSpend();
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

function goView(v){ state.view=v; state.activeTeaId=null; state.dashEdit=false; if(v!=='passport'){ state.passportSel=null; state.passportZoom=null; state.passportSub=null; } saveView(v); render(); }
function saveView(v){ try{ if(PERSISTED_VIEWS.includes(v)){ localStorage.setItem('tealog_view', v); localStorage.removeItem('tealog_activeTea'); } }catch(e){} }

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

