/* ============================================================================
   Tea Passport — world dot-map of the regions you've brewed from.
   Country-level for now (sub-regions/cultivars later). Dots sized by teas owned.
   ============================================================================ */

// Land as [colStart,colEnd] segments per row on a 60x24 equirectangular grid
// (col = (lon+180)/6, row = (78-lat)/6). Gaps carve out islands: Japan sits east
// of the mainland, plus Taiwan, Philippines, Indonesia, Sri Lanka, UK.
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
  { country:'China',       col:50, row:8,  aliases:['china','chinese','fujian','yunnan','anhui','zhejiang','guangdong','guandong','wuyi','anxi','yiwu','puer','pu-er',"pu'er",'puerh','sheng','shou','longjing','dragonwell','keemun','dian hong','dianhong','lapsang','tie guan yin','tieguanyin','rou gui','shui xian','dan cong','dancong','yashi xiang','ya bao','phoenix','chaozhou','bai mudan','silver needle','shou mei','gong mei','jasmine','gaoshan black','fo shou'] },
  { country:'Japan',       col:53, row:7,  aliases:['japan','japanese','uji','kyoto','kagoshima','shizuoka','yame','nara','sencha','gyokuro','matcha','hojicha','houjicha','bancha','genmaicha','kabuse','kabusecha','saemidori','shincha','tamaryokucha'] },
  { country:'Taiwan',      col:51, row:9,  aliases:['taiwan','taiwanese','formosa','alishan','ali shan','nantou','lishan','li shan','dong ding','dongding','shan lin xi','oriental beauty','ruby 18','sun moon lake','high mountain','gaoshan oolong','dong pian'] },
  { country:'India',       col:45, row:8,  aliases:['india','indian','darjeeling','assam','nilgiri','sikkim','munnar','first flush','second flush'] },
  { country:'Nepal',       col:44, row:8,  aliases:['nepal','nepali','ilam','himalayan'] },
  { country:'Sri Lanka',   col:44, row:12, aliases:['sri lanka','ceylon','nuwara eliya','dimbula','uva','kandy'] },
  { country:'South Korea', col:51, row:7,  aliases:['korea','korean','jeju','hadong','boseong','sejak','woojeon','ujeon'] },
  { country:'Vietnam',     col:48, row:10, aliases:['vietnam','vietnamese','ha giang','moc chau','snow shan','ta xua'] },
  { country:'Thailand',    col:46, row:10, aliases:['thailand','thai','doi mae salong','chiang rai','chiang mai'] },
  { country:'Myanmar',     col:46, row:9,  aliases:['myanmar','burma','burmese'] },
  { country:'Indonesia',   col:48, row:14, aliases:['indonesia','indonesian','java','sumatra','bandung'] },
  { country:'Kenya',       col:36, row:13, aliases:['kenya','kenyan','nandi','kericho','purple'] },
  { country:'Malawi',      col:36, row:15, aliases:['malawi','satemwa'] },
  { country:'Rwanda',      col:35, row:13, aliases:['rwanda','rwandan'] },
  { country:'Turkey',      col:36, row:6,  aliases:['turkey','turkish','türkiye','rize'] },
  { country:'Georgia',     col:37, row:6,  aliases:['georgia','georgian'] },
  { country:'England',     col:30, row:4,  aliases:['england','english','cornwall','tregothnan'] }
];

function passportCountryFor(tea){
  // Search the origin field AND the tea name — regions/cultivars in the name
  // ("Yunnan Silver Bud", "... Dancong") are strong signals.
  const hay = ((tea.origin||'') + ' ' + (tea.name||'')).toLowerCase();
  if(!hay.trim()) return null;
  for(const g of PASSPORT_GEO){ if(g.aliases.some(a=>hay.includes(a))) return g.country; }
  return null;
}
function passportGeo(country){ return PASSPORT_GEO.find(g=>g.country===country); }
function passportSelect(country){ state.passportSel = (state.passportSel===country ? null : country); render(); }

function viewPassport(){
  const byCountry = {}; const unmapped = [];
  state.teas.forEach(t=>{ const c = passportCountryFor(t); if(c){ (byCountry[c]=byCountry[c]||[]).push(t); } else unmapped.push(t); });
  const owned = Object.keys(byCountry);
  const totalMapped = owned.reduce((n,c)=>n+byCountry[c].length,0);
  if(state.passportSel && !byCountry[state.passportSel]) state.passportSel = null;

  // ---- dot map ----
  const cell=9, pad=6, W=60, H=24;
  // Crop to the tea-growing hemisphere (Europe/Africa/Asia/Oceania) — the Americas
  // aren't used, and cropping zooms everything up so it reads well on mobile.
  const colMin=28, colMax=59, rowMin=2, rowMax=20;
  const vbX = pad+colMin*cell, vbY = pad+rowMin*cell;
  const vbW = (colMax-colMin+1)*cell, vbH = (rowMax-rowMin+1)*cell;
  const cx = c => pad+c*cell+cell/2, cy = r => pad+r*cell+cell/2;
  let svg = `<svg viewBox="${vbX} ${vbY} ${vbW} ${vbH}" role="img" aria-label="Map of your tea regions" style="width:100%;height:auto;display:block;">`;
  for(const r in PASSPORT_LAND){ if(+r<rowMin||+r>rowMax) continue; PASSPORT_LAND[r].forEach(seg=>{ for(let c=Math.max(seg[0],colMin);c<=Math.min(seg[1],colMax);c++){ svg += `<circle cx="${cx(c)}" cy="${cy(+r)}" r="2.4" fill="var(--heat-empty)"/>`; } }); }
  owned.forEach(country=>{
    const g = passportGeo(country); if(!g) return;
    const n = byCountry[country].length;
    const rad = (4 + n*0.7).toFixed(1);
    const sel = state.passportSel===country;
    const fill = sel ? 'var(--jade)' : 'var(--clay)';
    const stroke = sel ? 'var(--amber)' : 'var(--white)';
    const sw = sel ? 2.2 : 1.4;
    svg += `<circle cx="${cx(g.col)}" cy="${cy(g.row)}" r="${rad}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}" style="cursor:pointer;" onclick="passportSelect('${country.replace(/'/g,"\\'")}')"><title>${country} · ${n} tea${n===1?'':'s'}</title></circle>`;
  });
  svg += `</svg>`;

  // ---- detail panel ----
  const chipCss = 'display:inline-block;background:var(--porcelain-dim);border:1px solid var(--line);border-radius:6px;padding:6px 11px;margin:0 6px 6px 0;cursor:pointer;font-size:12px;color:var(--jade-deep);';
  let panel;
  if(state.passportSel && byCountry[state.passportSel]){
    const list = byCountry[state.passportSel];
    panel = `<div style="font-family:'Fraunces',serif;font-weight:600;font-size:17px;color:var(--ink);">${state.passportSel}</div>
      <div style="font-size:11.5px;color:var(--ink-soft);margin:1px 0 11px;">${list.length} tea${list.length===1?'':'s'} · tap to open</div>
      <div style="display:flex;flex-wrap:wrap;">${list.map(t=>`<span style="${chipCss}" onclick="openTeaDetail('${t.id}','passport')">${t.name}</span>`).join('')}</div>`;
  } else {
    panel = `<div style="color:var(--ink-soft);font-size:13px;line-height:1.5;">Tap a pin — or a region below — to see the teas you've brewed from there. Tap a tea to open it.</div>`;
  }

  // ---- region chips (sorted by count) ----
  const rchipCss = 'display:inline-flex;align-items:center;gap:6px;font-size:12px;color:var(--ink-soft);background:var(--white);border:1px solid var(--line);border-radius:999px;padding:6px 12px;margin:0 7px 7px 0;cursor:pointer;';
  const chips = owned.sort((a,b)=>byCountry[b].length-byCountry[a].length)
    .map(c=>`<span style="${rchipCss}${state.passportSel===c?'border-color:var(--jade);background:var(--porcelain-dim);color:var(--jade-deep);':''}" onclick="passportSelect('${c.replace(/'/g,"\\'")}')">${c} <b style="color:var(--clay);">${byCountry[c].length}</b></span>`).join('');

  const unmappedNote = unmapped.length
    ? `<div style="font-size:11.5px;color:var(--ink-soft);margin-top:14px;line-height:1.5;">${unmapped.length} tea${unmapped.length===1?'':'s'} not yet placed${unmapped.length<=6?': '+unmapped.map(t=>t.name).join(', '):''}. Add a country to the origin field to map ${unmapped.length===1?'it':'them'}.</div>`
    : '';

  return `
    <button class="detail-back" onclick="goView('dashboard')">← Back to home</button>
    <div class="section-title" style="margin-top:6px;">
      <h2 style="font-family:'Fraunces',serif;font-size:20px;">Tea passport</h2>
      <span class="mono" style="font-size:12px;color:var(--amber);">${owned.length} region${owned.length===1?'':'s'} · ${totalMapped} tea${totalMapped===1?'':'s'}</span>
    </div>
    ${owned.length===0 && unmapped.length===0
      ? `<div class="card empty">Add teas with an origin (e.g. "Fujian, China") and they'll appear on the map.</div>`
      : `<div class="card" style="padding:12px;">${svg}</div>
    <div class="card" style="margin-top:14px;min-height:60px;">${panel}</div>
    ${chips?`<div style="display:flex;flex-wrap:wrap;margin-top:14px;">${chips}</div>`:''}
    ${unmappedNote}`}
  `;
}
