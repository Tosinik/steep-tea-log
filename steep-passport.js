/* ============================================================================
   Tea Passport — curated dot-map of the regions you've brewed from.
   Overview = country pins (sized by teas owned). Tapping a country with mapped
   sub-regions (China / Japan) zooms the same grid in and reveals sub-region pins
   (Kagoshima, Guangdong, Yunnan…). No GeoJSON — the map is hand-placed on a
   60x24 equirectangular grid: col = (lon+180)/6, row = (78-lat)/6.
   ============================================================================ */

// Land as [colStart,colEnd] segments per row on a 60x24 equirectangular grid.
// Gaps carve out islands: Japan sits east of the mainland, plus Taiwan,
// Philippines, Indonesia, Sri Lanka, UK.
const PASSPORT_LAND = {
  0:[[10,18],[22,26],[38,59]],
  1:[[8,20],[22,27],[31,59]],
  2:[[5,20],[23,26],[30,59]],
  3:[[4,21],[31,59]],
  4:[[6,21],[29,29],[31,59]],
  5:[[7,21],[29,29],[31,55],[54,54]],
  6:[[8,19],[30,51],[53,54]],
  7:[[9,18],[30,51],[53,54]],
  8:[[10,18],[29,50],[53,53]],
  9:[[11,16],[29,50],[51,51],[52,52]],
  10:[[12,15],[28,49],[52,52]],
  11:[[14,17],[27,49],[52,52]],
  12:[[18,20],[27,42],[44,44],[46,50]],
  13:[[19,24],[28,40],[46,47],[49,50],[52,53]],
  14:[[19,25],[30,40],[47,48],[50,51],[53,54]],
  15:[[20,26],[31,39],[48,49],[53,56]],
  16:[[21,26],[32,39],[41,41],[50,57]],
  17:[[21,26],[33,38],[41,42],[49,57]],
  18:[[21,25],[34,37],[49,57]],
  19:[[21,24],[51,56]],
  20:[[21,23],[58,59]],
  21:[[21,22]],
  22:[[21,21]],
  23:[]
};

// Tea countries with a map cell + matching keywords (country + common regions).
const PASSPORT_GEO = [
  { country:'China',       col:50, row:8,  aliases:['china','chinese','fujian','yunnan','anhui','zhejiang','guangdong','guandong','wuyi','wuyishan','anxi','yiwu','menghai','lincang','jingmai','bulang','fuding','zhenghe','hangzhou','huangshan','puer','pu-er',"pu'er",'puerh','sheng','shou','longjing','dragonwell','keemun','qimen','dian hong','dianhong','lapsang','zhengshan','tie guan yin','tieguanyin','rou gui','shui xian','shuixian','dan cong','dancong','yashi xiang','ya bao','mi lan','phoenix','feng huang','chaozhou','bai mudan','white peony','silver needle','yin zhen','shou mei','gong mei','jasmine','mo li','gaoshan black','fo shou','bi luo chun','biluochun','mao feng','maofeng','mao jian','gua pian','liu bao','liubao','hei cha','fu zhuan','gunpowder','huang ya','huangya','huoshan','huo shan'] },
  { country:'Japan',       col:53, row:7,  aliases:['japan','japanese','uji','kyoto','kagoshima','shizuoka','yame','nara','miyazaki','fukuoka','fukoaka','hoshino','wazuka','sencha','gyokuro','matcha','hojicha','houjicha','bancha','genmaicha','kabuse','kabusecha','fukamushi','tencha','kukicha','saemidori','shincha','tamaryokucha','asamushi'] },
  { country:'Taiwan',      col:51, row:9,  aliases:['taiwan','taiwanese','formosa','alishan','ali shan','nantou','lishan','li shan','dong ding','dongding','shan lin xi','baozhong','pouchong','wenshan','muzha','meishan','oriental beauty','bai hao','ruby 18','red jade','hong yu','sun moon lake','high mountain','gaoshan oolong','jin xuan','jinxuan','si ji chun','four seasons','dong pian'] },
  { country:'India',       col:45, row:8,  aliases:['india','indian','darjeeling','assam','nilgiri','sikkim','munnar','first flush','second flush'] },
  { country:'Nepal',       col:44, row:8,  aliases:['nepal','nepali','ilam','himalayan'] },
  { country:'Sri Lanka',   col:44, row:12, aliases:['sri lanka','ceylon','nuwara eliya','dimbula','uva','kandy'] },
  { country:'South Korea', col:51, row:7,  aliases:['korea','korean','jeju','hadong','boseong','sejak','woojeon','ujeon'] },
  { country:'Vietnam',     col:48, row:10, aliases:['vietnam','vietnamese','ha giang','moc chau','snow shan','ta xua'] },
  { country:'Thailand',    col:46, row:10, aliases:['thailand','thai','doi mae salong','chiang rai','chiang mai','ruan zhi','ruanzhi'] },
  { country:'Myanmar',     col:46, row:9,  aliases:['myanmar','burma','burmese'] },
  { country:'Indonesia',   col:48, row:14, aliases:['indonesia','indonesian','java','sumatra','bandung'] },
  { country:'Kenya',       col:36, row:13, aliases:['kenya','kenyan','nandi','kericho','purple'] },
  { country:'Malawi',      col:36, row:15, aliases:['malawi','satemwa'] },
  { country:'Rwanda',      col:35, row:13, aliases:['rwanda','rwandan'] },
  { country:'Turkey',      col:36, row:6,  aliases:['turkey','turkish','türkiye','rize'] },
  { country:'Georgia',     col:37, row:6,  aliases:['georgia','georgian'] },
  { country:'England',     col:30, row:4,  aliases:['england','english','cornwall','tregothnan'] }
];

// Curated sub-regions, placed by real lat/lon on the same grid (fractional cells).
// Only China & Japan are "zoomable" (big enough to spread out); other countries'
// sub-regions still surface as panel chips. Aliases are matched within the parent
// country only, so "guangdong"/"kagoshima" never leak across borders.
const PASSPORT_SUB = {
  China: [
    { name:'Yunnan',    col:46.9, row:8.9,  aliases:['yunnan','puer','pu-er',"pu'er",'puerh','menghai','lincang','jingmai','bulang','yiwu','dian hong','dianhong','feng qing'] },
    { name:'Guangdong', col:48.9, row:9.1,  aliases:['guangdong','guandong','chaozhou','phoenix','feng huang','dan cong','dancong','yashi xiang','mi lan','fo shou'] },
    { name:'Fujian',    col:49.7, row:8.7,  aliases:['fujian','wuyi','wuyishan','anxi','fuding','zhenghe','rou gui','shui xian','shuixian','tie guan yin','tieguanyin','lapsang','zhengshan','bai mudan','white peony','silver needle','yin zhen','shou mei','gong mei','jasmine','mo li'] },
    { name:'Zhejiang',  col:50.0, row:8.1,  aliases:['zhejiang','hangzhou','longjing','dragonwell','bi luo chun','biluochun'] },
    { name:'Anhui',     col:49.6, row:7.8,  aliases:['anhui','huangshan','huang shan','keemun','qimen','mao feng','maofeng','gua pian','huoshan','huo shan','huang ya','huangya'] },
    { name:'Guangxi',   col:48.1, row:9.0,  aliases:['guangxi','liu bao','liubao','wuzhou'] }
  ],
  Japan: [
    // Kyushu prefectures sit almost on top of each other in reality; spread a little
    // (this map is curated, not survey-accurate) so the pins + labels stay legible.
    { name:'Kagoshima', col:51.3, row:8.4,  aliases:['kagoshima','chiran','ei'] },
    { name:'Fukuoka',   col:51.6, row:7.0,  aliases:['fukuoka','fukoaka','yame','hoshino','hoshinomura'] },
    { name:'Miyazaki',  col:52.1, row:8.1,  aliases:['miyazaki'] },
    { name:'Shizuoka',  col:53.5, row:6.9,  aliases:['shizuoka','makinohara','kawane'] },
    { name:'Uji',       col:52.8, row:7.4,  aliases:['uji','kyoto','wazuka'] },
    { name:'Nara',      col:53.1, row:7.7,  aliases:['nara','yamato'] }
  ],
  Taiwan: [
    { name:'Alishan',   col:50.1, row:9.05, aliases:['alishan','ali shan'] },
    { name:'Nantou',    col:50.15,row:9.0,  aliases:['nantou','dong ding','dongding','shan lin xi'] },
    { name:'Lishan',    col:50.2, row:8.95, aliases:['lishan','li shan','dayuling'] }
  ]
};
const PASSPORT_ZOOMABLE = { China:true, Japan:true };

function passportMatchText(text){
  text = (text||'').toLowerCase();
  if(!text.trim()) return null;
  // Longest matching alias wins, so a specific region ("ali shan", "dong pian")
  // beats a generic one that also appears ("fo shou").
  let best=null, bestLen=0;
  for(const g of PASSPORT_GEO){ for(const a of g.aliases){ if(a.length>bestLen && text.includes(a)){ best=g.country; bestLen=a.length; } } }
  return best;
}
function passportCountryFor(tea){
  // Trust the origin field first; fall back to the name.
  return passportMatchText(tea.origin) || passportMatchText(tea.name);
}
// Resolve a tea's sub-region within its country (origin first, then name), or null.
function passportSubFor(country, tea){
  const subs = PASSPORT_SUB[country]; if(!subs) return null;
  const text = ((tea.origin||'') + ' ' + (tea.name||'')).toLowerCase();
  if(!text.trim()) return null;
  let best=null, bestLen=0;
  for(const s of subs){ for(const a of s.aliases){ if(a.length>bestLen && text.includes(a)){ best=s.name; bestLen=a.length; } } }
  return best;
}
/* Origins tier (v4.03) — the honesty ladder Origins is built on: a stored origin either names a
   PLACE inside a country ("Lugu, Nantou, Taiwan") or only the country ("China"). R28 hangs two
   different geometries off this distinction — verified point vs labelled polygon — so it needs one
   writer, in the app, where the card and the future map both read it.
   It is written here rather than invented: `fixtures/figures-report.js` had been carrying this rule
   as a private regex, which made the tool that reports the split a second definition of it. The
   reporter now calls this function in its vm sandbox, the way it already calls the rest of the
   engine, so the split it prints cannot drift from the split the app draws.
   R16 — "Ceylon" is a country synonym, so "Ceylon, Sri Lanka" is country tier despite the comma. */
const ORIGIN_COUNTRY_WORDS = /^(china|taiwan|thailand|japan|india|sri lanka|ceylon|korea|vietnam|nepal|kenya|malawi|indonesia)$/i;
function originTier(tea){
  const o = ((tea && tea.origin) || '').trim();
  if(!o) return null;                                  // no origin at all — not a tier, an absence
  const parts = o.split(',').map(x=>x.trim()).filter(Boolean);
  return parts.every(p=>ORIGIN_COUNTRY_WORDS.test(p)) ? 'country' : 'region';
}
/* R55 — the catalog may OFFER a more specific origin, under three conditions and no others. This is
   the only new affordance on that screen (R56 builds no suggestion list; the field stays free text).
   The region is read from `resolveTeaType(slug).region` through the shipped matcher, never from a
   board literal, because `region` inherits from the parent row (TT_INHERIT).
     (a) it must name ONE place — no slash-pairs, no "&", no parenthetical lists;
     (b) it must sit INSIDE the country already stored, or it is a CONFLICT, not an offer: no
         default, no one-tap accept, nothing drawn;
     (c) parentheticals are stripped ("Chiayi County, Taiwan (~1000-1500m)" → "Chiayi County, Taiwan").
   Returns the offerable string, or null. A tea already at region tier is never offered anything —
   the point is climbing a tier, not second-guessing what the user wrote. */
function originOffer(tea){
  if(typeof matchTeaType!=='function' || !tea) return null;
  if(originTier(tea)!=='country') return null;
  const m = matchTeaType(tea.name || '');
  if(!m || !m.region) return null;
  const region = String(m.region).replace(/\([^)]*\)/g,' ').replace(/\s+/g,' ')
                                 .replace(/\s*,\s*/g,', ').replace(/(^[,\s]+|[,\s]+$)/g,'').trim();
  if(!region) return null;
  if(/[\/&]|\bor\b/i.test(region)) return null;                 // (a) a list or a pair, not one place
  const parts = region.split(',').map(s=>s.trim()).filter(Boolean);
  if(parts.length < 2) return null;                             // no more specific than the country
  // (b) same country as what is stored — resolved through the passport's own alias table, so R16's
  // synonyms (Ceylon → Sri Lanka) are honoured rather than re-implemented.
  const storedCountry = passportMatchText(tea.origin || '');
  const offerCountry  = passportMatchText(region);
  if(!storedCountry || !offerCountry || storedCountry !== offerCountry) return null;
  return region;
}
function passportGeo(country){ return PASSPORT_GEO.find(g=>g.country===country); }
function passportSubGeo(country, name){ return (PASSPORT_SUB[country]||[]).find(s=>s.name===name); }

/* ============================================================================
   ORIGINS (#37) — direction 2. R66 keeps this file and mines the tables above; the old
   dot-map view goes with this slice, alongside R45's hub row.

   WHY R28's COST IS ACCEPTABLE, and it is not a layout argument. The country tier is OFF
   the map and listed beside it. A country mark was never a location: R28 defines it as a
   computed point inside the country's shape, so "China" on a map is a label pretending to
   be a place. Listing it is the more honest rendering. Ten of twenty-one teas live in that
   tier, so the list is a first-class half of the screen, not a footnote — and taking the
   tier off the map also dissolves the frame problem it caused, where R19's adaptive bbox
   weighted one outlier (Sri Lanka, 103 px from anything else) equally against eleven
   clustered marks and left 44% of the card empty.
   ============================================================================ */

/* The eight verified rows from docs/r3/planning/DATA-region-coordinates.md, keyed on the
   normalised `teas.origin` string — never a catalog slug. That join is exact-name and
   hand-curated, and Origins was deliberately routed around its fragility.
   THREE ROWS ARE STILL OWED (Wuyi Mountains · Lugu · Chiayi), which is why R55's three
   offerable teas stay in the country tier even after an accepted offer. Drawn as such: an
   origin with no row has no pin, and falls to the list. */
const ORIGIN_COORDS = {
  'kagoshima, japan':          { lat:31.60, lon:130.56, label:'Kagoshima' },
  'chiran, kagoshima, japan':  { lat:31.38, lon:130.44, label:'Chiran' },
  'hoshino, fukoaka, japan':   { lat:33.25, lon:130.77, label:'Hoshino' },
  'fujian, china':             { lat:26.07, lon:119.31, label:'Fujian' },
  'yunnan, china':             { lat:25.04, lon:102.72, label:'Yunnan' },
  'guangdong, china':          { lat:23.12, lon:113.25, label:'Guangdong' },
  'zhejiang, china':           { lat:30.29, lon:120.16, label:'Zhejiang' },
  'nantou, taiwan':            { lat:23.92, lon:120.68, label:'Nantou' }
};
const originKey = s => String(s||'').trim().toLowerCase().replace(/\s+/g,' ');
function originCoord(tea){ return ORIGIN_COORDS[originKey(tea && tea.origin)] || null; }

/* Marks closer than this MERGE — below it they are one dot wearing two labels rather than two
   readable marks. 14 px is judged against the tightest remaining gap of 23.0 px
   (Hoshino↔Kagoshima) once Kagoshima and Chiran, 3.3 px apart, have merged. That distance
   between the pair that must merge and the pair that must not is what makes 14 a SAFE
   threshold rather than a tuned one.
   UNCONFIRMED and recorded rather than assumed: whether it should TRACK PIN WIDTH instead of
   being a constant. Pins draw at 8 px, so a fixed 14 quietly stops meaning "these overlap" if
   pin size ever changes. Deriving it from the radius is one line when that is decided. */
const ORIGINS_MERGE_PX = 14;
const ORIGINS_CARD_PX = 350;   // the drawn width the threshold above is calibrated against
/* The frame is expressed as the RULED PROPERTY — marks occupy 83% of the card — rather than as a
   padding number, because the padding is a consequence and the span is the decision. A fixed pad
   would silently change the scale (and therefore what 14 px means) the moment the shelf's spread
   changed. Derived this way, Design's figures reproduce exactly: 3.74 px/unit, 83% span,
   Kagoshima-Chiran 3.3 px, tightest remaining gap 23.0 px. */
const ORIGINS_SPAN = 0.83;
const ORIGINS_MIN_PAD = 6;     // units — so a single-mark shelf still gets a frame rather than a point

/* Merge label: MOST TEAS wins, ties go NORTHERNMOST. The board stated the tie-break; what it
   lacked was per-region counts, which the app has. On this shelf Kagoshima 3 / Chiran 1, so the
   merged mark reads "Kagoshima +1". */
function originsMerge(marks, unitsPerPx){
  const tol = ORIGINS_MERGE_PX * unitsPerPx;
  const out = [];
  marks.forEach(m => {
    const near = out.find(o => Math.hypot(o.x - m.x, o.y - m.y) <= tol);
    if(!near){ out.push(Object.assign({}, m, { members:[m] })); return; }
    near.members.push(m);
    const lead = near.members.slice().sort((a,b)=> (b.n - a.n) || (b.lat - a.lat))[0];
    near.x = lead.x; near.y = lead.y; near.label = lead.label; near.lat = lead.lat;
    near.n = near.members.reduce((s,x)=>s+x.n, 0);
  });
  return out;
}
// One mark per coordinate-bearing origin string, carrying its tea count.
function originsRegionMarks(){
  const by = {};
  (state.teas||[]).forEach(t => {
    const c = originCoord(t); if(!c) return;
    const k = originKey(t.origin);
    by[k] = by[k] || { label:c.label, lat:c.lat, lon:c.lon, n:0, teas:[] };
    by[k].n++; by[k].teas.push(t);
  });
  return Object.keys(by).map(k => {
    const m = by[k], p = originsProject(m.lon, m.lat);
    return Object.assign({}, m, { x:p[0], y:p[1] });
  });
}
/* The country tier: teas whose origin names only a country (R16 normalises "Ceylon, Sri Lanka"
   in), PLUS any region-tier tea with no coordinate row yet — it knows its place, we simply
   cannot draw it, and pretending otherwise would be the invention this round keeps refusing. */
function originsCountryRows(){
  const by = {};
  (state.teas||[]).forEach(t => {
    if(originCoord(t)) return;
    const c = passportCountryFor(t); if(!c) return;
    (by[c] = by[c] || []).push(t);
  });
  return Object.keys(by).map(country => ({ country, teas:by[country] }))
    .sort((a,b) => b.teas.length - a.teas.length || a.country.localeCompare(b.country));
}
function goOrigins(){ state.view='origins'; state.activeTeaId=null; render(); }

function viewOrigins(){
  const marks = originsRegionMarks();
  const countries = originsCountryRows();
  // R19's zero-tea state (#09's slim addendum): no shelf, no atlas, and no map of nowhere.
  if(!marks.length && !countries.length){
    return `<div class="section-title"><h2 style="font-family:var(--font-display);font-size:20px;">Origins</h2></div>
      <div class="card empty">Your atlas fills in as you add teas — each one's origin puts it on the map.</div>`;
  }
  let mapHTML = '';
  if(marks.length){
    const xs = marks.map(m=>m.x), ys = marks.map(m=>m.y);
    const spanX = Math.max.apply(null, xs) - Math.min.apply(null, xs);
    const pad = Math.max(ORIGINS_MIN_PAD, spanX * (1/ORIGINS_SPAN - 1) / 2);
    const x0 = Math.min.apply(null, xs) - pad, y0 = Math.min.apply(null, ys) - pad;
    const vbW = spanX + pad*2;
    const vbH = Math.max.apply(null, ys) - Math.min.apply(null, ys) + pad*2;
    const merged = originsMerge(marks, vbW / ORIGINS_CARD_PX);
    const total = marks.reduce((s,m)=>s+m.n, 0);
    const r = 4;
    const dots = merged.map(m => {
      const extra = m.members.length > 1 ? ' +' + (m.members.length - 1) : '';
      return `<g><circle cx="${m.x.toFixed(1)}" cy="${m.y.toFixed(1)}" r="${r}" class="org-pin"></circle>`
           + `<text x="${(m.x + r + 2.5).toFixed(1)}" y="${(m.y + r/2).toFixed(1)}" class="org-lbl">${escapeHtml(m.label + extra)}</text></g>`;
    }).join('');
    mapHTML = `<div class="card org-card">
      <svg class="org-map" viewBox="${x0.toFixed(1)} ${y0.toFixed(1)} ${vbW.toFixed(1)} ${vbH.toFixed(1)}" role="img" aria-label="Where your teas grew">
        <path d="${ORIGINS_OUTLINE}" class="org-land" fill-rule="evenodd"></path>${dots}
      </svg>
      <div class="org-cap mono">${merged.length} place${merged.length===1?'':'s'} · ${total} tea${total===1?'':'s'}</div>
    </div>`;
  }
  const listHTML = countries.length ? `<div class="card">
    <div class="eyebrow">Known by country</div>
    <div class="org-sub">These name a country, not a place inside it — so they are listed rather than pinned.</div>
    ${countries.map(c=>`<div class="org-row">
      <div style="flex:1;min-width:0;">
        <div class="org-country">${escapeHtml(c.country)}</div>
        <div class="org-teas">${c.teas.map(t=>`<button class="btn-ghost org-tea" onclick="openTeaDetail('${escapeJsArg(t.id)}','origins')">${escapeHtml(t.name)}</button>`).join('')}</div>
      </div>
      <span class="org-count mono">${c.teas.length}</span>
    </div>`).join('')}
  </div>` : '';
  return `<div class="section-title"><h2 style="font-family:var(--font-display);font-size:20px;">Origins</h2></div>
    ${mapHTML}${listHTML}`;
}
