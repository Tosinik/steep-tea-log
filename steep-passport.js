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
function passportGeo(country){ return PASSPORT_GEO.find(g=>g.country===country); }
function passportSubGeo(country, name){ return (PASSPORT_SUB[country]||[]).find(s=>s.name===name); }

// A country pin tap: select it, and if it's zoomable, dive into its sub-map.
function passportSelect(country){
  const same = state.passportSel===country && !state.passportSub;
  if(same){ state.passportSel=null; state.passportZoom=null; state.passportSub=null; }
  else { state.passportSel=country; state.passportSub=null; state.passportZoom = PASSPORT_ZOOMABLE[country] ? country : null; }
  render();
}
function passportZoomOut(){ state.passportZoom=null; state.passportSub=null; render(); }
function passportSubSelect(country, name){
  state.passportSel=country;
  state.passportSub = state.passportSub===name ? null : name;
  render();
}

function viewPassport(){
  const byCountry = {}, bySub = {}, unmapped = [];
  state.teas.forEach(t=>{
    const c = passportCountryFor(t);
    if(!c){ unmapped.push(t); return; }
    (byCountry[c]=byCountry[c]||[]).push(t);
    const s = passportSubFor(c, t);
    bySub[c] = bySub[c] || { _none:[] };
    if(s){ (bySub[c][s]=bySub[c][s]||[]).push(t); } else { bySub[c]._none.push(t); }
  });
  const owned = Object.keys(byCountry);
  const totalMapped = owned.reduce((n,c)=>n+byCountry[c].length,0);
  if(state.passportSel && !byCountry[state.passportSel]){ state.passportSel=null; state.passportZoom=null; state.passportSub=null; }
  if(state.passportZoom && !byCountry[state.passportZoom]) state.passportZoom=null;

  const cell=9, pad=6;
  const cx = c => pad+c*cell+cell/2, cy = r => pad+r*cell+cell/2;
  // Gentle pin sizing (sqrt) so counts read as a soft ramp without big blobs that
  // hide the land underneath. Labels sit just below each pin so the region is legible.
  const rFor = n => (2.5 + Math.sqrt(Math.max(1,n))*0.95);
  const label = (txt, c, r, off, size) => `<text x="${cx(c)}" y="${cy(r)+off}" text-anchor="middle" font-size="${size||4.4}" font-family="var(--font-mono),monospace" fill="var(--ink-soft)" style="pointer-events:none;">${txt}</text>`;

  // ---- viewBox: overview crop, or a zoomed window around the selected country ----
  let vbX, vbY, vbW, vbH, zoom = state.passportZoom;
  if(zoom && PASSPORT_SUB[zoom]){
    const g = passportGeo(zoom);
    const cols=[g.col], rows=[g.row];
    PASSPORT_SUB[zoom].forEach(s=>{ if((bySub[zoom]&&bySub[zoom][s.name])){ cols.push(s.col); rows.push(s.row); } });
    const P=3.4;                     // more breathing room = you can see coastline/context
    let c0=Math.min(...cols)-P, c1=Math.max(...cols)+P, r0=Math.min(...rows)-P, r1=Math.max(...rows)+P;
    const minW=11, minH=8;           // floor the window so a tight cluster still shows the country
    if(c1-c0<minW){ const m=(minW-(c1-c0))/2; c0-=m; c1+=m; }
    if(r1-r0<minH){ const m=(minH-(r1-r0))/2; r0-=m; r1+=m; }
    vbX=pad+c0*cell; vbY=pad+r0*cell; vbW=(c1-c0+1)*cell; vbH=(r1-r0+1)*cell;
  } else {
    // Crop to the tea-growing hemisphere — the Americas aren't used, and cropping
    // zooms everything up so it reads well on mobile.
    const colMin=28, colMax=59, rowMin=2, rowMax=20;
    vbX=pad+colMin*cell; vbY=pad+rowMin*cell; vbW=(colMax-colMin+1)*cell; vbH=(rowMax-rowMin+1)*cell;
  }

  // ---- land dots (only those inside the current window) ----
  let svg = `<svg viewBox="${vbX} ${vbY} ${vbW} ${vbH}" role="img" aria-label="Map of your tea regions" style="width:100%;height:auto;display:block;">`;
  const inWin = (c,r)=> cx(c)>=vbX-cell && cx(c)<=vbX+vbW+cell && cy(r)>=vbY-cell && cy(r)<=vbY+vbH+cell;
  for(const r in PASSPORT_LAND){ PASSPORT_LAND[r].forEach(seg=>{ for(let c=seg[0];c<=seg[1];c++){ if(inWin(c,+r)) svg += `<circle cx="${cx(c)}" cy="${cy(+r)}" r="2.4" fill="var(--heat-empty)"/>`; } }); }

  if(zoom && PASSPORT_SUB[zoom]){
    // ---- zoomed sub-map: sub-region pins for the selected country ----
    const g = passportGeo(zoom);
    const noneCount = (bySub[zoom] && bySub[zoom]._none) ? bySub[zoom]._none.length : 0;
    // faint marker for country-level (region-unspecified) teas
    if(noneCount){
      const nr=rFor(noneCount).toFixed(1);
      svg += `<circle cx="${cx(g.col)}" cy="${cy(g.row)}" r="${nr}" fill="var(--heat-empty)" stroke="var(--line)" stroke-width="1.1" style="cursor:pointer;" onclick="passportSubSelect('${escapeJsArg(zoom)}',null)"><title>${zoom} · region unspecified · ${noneCount}</title></circle>`;
      svg += label(`? ${noneCount}`, g.col, g.row, +nr+4.6, 4.2);
    }
    PASSPORT_SUB[zoom].forEach(s=>{
      const list = bySub[zoom] && bySub[zoom][s.name]; if(!list) return;
      const n=list.length, rad=rFor(n).toFixed(1);
      const on = state.passportSub===s.name;
      const fill = on?'var(--jade)':'var(--clay)', stroke = on?'var(--amber)':'var(--white)', sw = on?2:1.2;
      svg += `<circle cx="${cx(s.col)}" cy="${cy(s.row)}" r="${rad}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" style="cursor:pointer;" onclick="passportSubSelect('${escapeJsArg(zoom)}','${escapeJsArg(s.name)}')"><title>${s.name} · ${n} tea${n===1?'':'s'}</title></circle>`;
      svg += label(`${s.name} ${n}`, s.col, s.row, +rad+4.6, 4.2);
    });
  } else {
    // ---- overview: country pins ----
    owned.forEach(country=>{
      const g = passportGeo(country); if(!g) return;
      const n = byCountry[country].length, rad=rFor(n).toFixed(1);
      const sel = state.passportSel===country;
      const fill = sel?'var(--jade)':'var(--clay)', stroke = sel?'var(--amber)':'var(--white)', sw = sel?2:1.2;
      const zoomable = PASSPORT_ZOOMABLE[country];
      svg += `<circle cx="${cx(g.col)}" cy="${cy(g.row)}" r="${rad}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" style="cursor:pointer;" onclick="passportSelect('${escapeJsArg(country)}')"><title>${country} · ${n} tea${n===1?'':'s'}${zoomable?' · tap to zoom':''}</title></circle>`;
      if(zoomable){ svg += `<circle cx="${cx(g.col)}" cy="${cy(g.row)}" r="${(+rad+2.2).toFixed(1)}" fill="none" stroke="var(--amber)" stroke-width="0.7" stroke-dasharray="1.6 1.8" opacity="0.5" style="pointer-events:none;"/>`; }
      svg += label(`${country} ${n}`, g.col, g.row, +rad+6, 6.2);
    });
  }
  svg += `</svg>`;

  // ---- detail panel ----
  const chipCss = 'display:inline-block;background:var(--porcelain-dim);border:1px solid var(--line);border-radius:6px;padding:6px 11px;margin:0 6px 6px 0;cursor:pointer;font-size:12px;color:var(--jade-deep);';
  let panel;
  if(zoom && PASSPORT_SUB[zoom]){
    const sd = bySub[zoom] || { _none:[] };
    const named = PASSPORT_SUB[zoom].filter(s=>sd[s.name]).map(s=>s.name);
    const title = state.passportSub ? `${state.passportSub}, ${zoom}` : zoom;
    const list = state.passportSub ? (sd[state.passportSub]||[]) : byCountry[zoom];
    const subChipCss = 'display:inline-flex;align-items:center;gap:6px;font-size:12px;color:var(--ink-soft);background:var(--white);border:1px solid var(--line);border-radius:999px;padding:6px 12px;margin:0 7px 7px 0;cursor:pointer;';
    const subChips = named.map(nm=>`<span style="${subChipCss}${state.passportSub===nm?'border-color:var(--jade);background:var(--porcelain-dim);color:var(--jade-deep);':''}" onclick="passportSubSelect('${escapeJsArg(zoom)}','${escapeJsArg(nm)}')">${nm} <b style="color:var(--clay);">${sd[nm].length}</b></span>`).join('')
      + (sd._none && sd._none.length ? `<span style="${subChipCss}${state.passportSub===null?'':''}" onclick="passportSubSelect('${escapeJsArg(zoom)}',null)">Region unspecified <b style="color:var(--clay);">${sd._none.length}</b></span>` : '');
    panel = `<div style="font-family:'Fraunces',serif;font-weight:600;font-size:17px;color:var(--ink);">${title}</div>
      <div style="font-size:11.5px;color:var(--ink-soft);margin:1px 0 11px;">${list.length} tea${list.length===1?'':'s'} · tap a tea to open</div>
      ${named.length?`<div style="display:flex;flex-wrap:wrap;margin-bottom:10px;">${subChips}</div>`:''}
      <div style="display:flex;flex-wrap:wrap;">${list.map(t=>`<span style="${chipCss}" onclick="openTeaDetail('${escapeJsArg(t.id)}','passport')">${escapeHtml(t.name)}</span>`).join('')}</div>`;
  } else if(state.passportSel && byCountry[state.passportSel]){
    const list = byCountry[state.passportSel];
    const zoomable = PASSPORT_ZOOMABLE[state.passportSel];
    panel = `<div style="font-family:'Fraunces',serif;font-weight:600;font-size:17px;color:var(--ink);">${state.passportSel}</div>
      <div style="font-size:11.5px;color:var(--ink-soft);margin:1px 0 11px;">${list.length} tea${list.length===1?'':'s'}${zoomable?' · tap the pin to zoom into sub-regions':' · tap to open'}</div>
      <div style="display:flex;flex-wrap:wrap;">${list.map(t=>`<span style="${chipCss}" onclick="openTeaDetail('${escapeJsArg(t.id)}','passport')">${escapeHtml(t.name)}</span>`).join('')}</div>`;
  } else {
    panel = `<div style="color:var(--ink-soft);font-size:13px;line-height:1.5;">Tap a pin — or a region below — to see the teas you've brewed from there. China and Japan zoom into sub-regions. Tap a tea to open it.</div>`;
  }

  // ---- region chips (overview only, sorted by count) ----
  const rchipCss = 'display:inline-flex;align-items:center;gap:6px;font-size:12px;color:var(--ink-soft);background:var(--white);border:1px solid var(--line);border-radius:999px;padding:6px 12px;margin:0 7px 7px 0;cursor:pointer;';
  const chips = zoom ? '' : owned.sort((a,b)=>byCountry[b].length-byCountry[a].length)
    .map(c=>`<span style="${rchipCss}${state.passportSel===c?'border-color:var(--jade);background:var(--porcelain-dim);color:var(--jade-deep);':''}" onclick="passportSelect('${escapeJsArg(c)}')">${c} <b style="color:var(--clay);">${byCountry[c].length}</b>${PASSPORT_ZOOMABLE[c]?' <span style="color:var(--amber);">⊕</span>':''}</span>`).join('');

  const unmappedNote = (!zoom && unmapped.length)
    ? `<div style="font-size:11.5px;color:var(--ink-soft);margin-top:14px;line-height:1.5;">${unmapped.length} tea${unmapped.length===1?'':'s'} not yet placed${unmapped.length<=6?': '+unmapped.map(t=>escapeHtml(t.name)).join(', '):''}. Add a country to the origin field to map ${unmapped.length===1?'it':'them'}.</div>`
    : '';

  const zoomBar = zoom
    ? `<div style="display:flex;align-items:center;gap:10px;margin:2px 0 10px;">
         <button class="btn btn-ghost" style="padding:4px 0;" onclick="passportZoomOut()">← Zoom out</button>
         <span style="font-size:12px;color:var(--ink-soft);">Zoomed into <b style="color:var(--jade-deep);">${zoom}</b></span>
       </div>` : '';

  return `
    <button class="detail-back" onclick="goView('dashboard')">← Back to home</button>
    <div class="section-title" style="margin-top:6px;">
      <h2 style="font-family:'Fraunces',serif;font-size:20px;">Tea passport</h2>
      <span class="mono" style="font-size:12px;color:var(--amber);">${owned.length} region${owned.length===1?'':'s'} · ${totalMapped} tea${totalMapped===1?'':'s'}</span>
    </div>
    ${owned.length===0 && unmapped.length===0
      ? `<div class="card empty">Add teas with an origin (e.g. "Fujian, China") and they'll appear on the map.</div>`
      : `${zoomBar}<div class="card" style="padding:12px;">${svg}</div>
    <div class="card" style="margin-top:14px;min-height:60px;">${panel}</div>
    ${chips?`<div style="display:flex;flex-wrap:wrap;margin-top:14px;">${chips}</div>`:''}
    ${unmappedNote}`}
  `;
}
