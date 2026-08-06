/* Origins outline generator — R106's build-time artifact.
 *
 * WHY THIS IS A TOOL AND NOT A FIXTURE. It produces a file the app ships and precaches, so it is
 * build infrastructure. `fixtures/` is ignored-by-default (R79) and holds things that verify; this
 * holds the thing that makes.
 *
 * WHY IT EXISTS AT ALL (R106). Drawing fourteen marks does not justify d3 + topojson-client +
 * world-atlas: 273 KB of d3 alone before the other two, and three CDN fetches that fail offline in a
 * PWA whose offline story is load-bearing. A simplified outline projected once at build time is a
 * static asset with no runtime dependency.
 *
 * WHY CODE GENERATES THE OUTLINE RATHER THAN RECEIVING A TRACED SVG. The outline and the pins must
 * share ONE projection, or every pin lands in the wrong place — silently, and worst at the latitudes
 * this shelf actually uses. This file emits both the paths and the projection that made them, so
 * there is one implementation and it cannot drift.
 *
 * TWO FINDINGS FROM THE FIRST BUILD, PRESERVED BECAUSE BOTH WERE EARNED RATHER THAN ASSUMED:
 *
 *   1. TOLERANCE 1.0 IS WHAT THE ASSERTION PERMITS, not the smallest number that looked acceptable.
 *      At 1.5, 2 and 3 the simplified Kyushu coastline moves past Chiran (31.38/130.44) and the pin
 *      lands IN THE SEA while its coordinate row is perfectly correct. §4 asserts this before the
 *      file is written; the tolerance is whatever that check permits.
 *
 *   2. LABEL POINTS MUST COME FROM SHIPPED GEOMETRY, NOT SOURCE. The first build computed the four
 *      country poles-of-inaccessibility from full-resolution polygons. Taiwan's inscribed radius is
 *      1.65 projected units — SMALLER than the tolerance was — so for a small country a
 *      source-computed label falling outside the drawn shape is the expected case, not an edge one.
 *      That code is deliberately NOT here: direction 2 takes the country tier off the map entirely
 *      and lists it beside, so there are no country marks to place. The finding is kept because it
 *      is the reason the honest rendering is a list — a country mark was never a location, only a
 *      computed point inside a shape, and computing it from the wrong geometry made that plainer.
 *
 * Input:  world-atlas@2.0.2 countries-110m.json (TopoJSON of Natural Earth 110m, public domain).
 *         Not vendored — pass a path, or let the tool fetch it once into the OS temp dir.
 * Output: steep-origins-map.js — the projection + the path data, as a precached script global.
 *
 * Run: node tools/gen-origins-outline.js [path/to/countries-110m.json]
 */
const fs = require('fs'), path = require('path'), os = require('os');
const REPO = path.resolve(__dirname, '..');
const SRC_JSON = process.argv[2] || path.join(os.tmpdir(), 'countries-110m.json');
const OUT = path.join(REPO, 'steep-origins-map.js');

if (!fs.existsSync(SRC_JSON)){
  console.error('Missing source topology: ' + SRC_JSON);
  console.error('Fetch it once (public domain, Natural Earth via world-atlas):');
  console.error('  curl -o "' + SRC_JSON + '" https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json');
  process.exit(2);
}
const topo = JSON.parse(fs.readFileSync(SRC_JSON, 'utf8'));

const TOL = Number(process.env.TOL || 1.0);      // see finding 1 — asserted in §4, not chosen by eye
const MIN_AREA = Number(process.env.MIN_AREA || 10);
const DP = 1;
const U = 1000, LAT_MAX = 83;                    // Mercator diverges at the poles; Antarctica is not tea

/* ---- 1. TopoJSON decode (arcs are delta-encoded and quantised) ---- */
const { scale:[sx, sy], translate:[tx, ty] } = topo.transform;
const arcs = topo.arcs.map(arc => { let x = 0, y = 0;
  return arc.map(([dx, dy]) => { x += dx; y += dy; return [x*sx + tx, y*sy + ty]; }); });
const arcOf = i => i < 0 ? arcs[~i].slice().reverse() : arcs[i];
const ring = idxs => { const out = []; idxs.forEach((i,k)=>{ const a = arcOf(i); out.push(...(k ? a.slice(1) : a)); }); return out; };
const polygonsOf = g => g.type === 'Polygon' ? [g.arcs.map(ring)]
                      : g.type === 'MultiPolygon' ? g.arcs.map(p => p.map(ring)) : [];

/* ---- 2. The projection. Emitted into the asset so app and tool share ONE implementation. ---- */
const merY = lat => { const p = Math.max(-LAT_MAX, Math.min(LAT_MAX, lat)) * Math.PI / 180;
                      return Math.log(Math.tan(Math.PI/4 + p/2)); };
const Y0 = merY(LAT_MAX), Y1 = merY(-LAT_MAX);
const project = (lon, lat) => [ (lon + 180) / 360 * U, (merY(lat) - Y0) / (Y1 - Y0) * U ];

/* ---- 3. Simplify and emit. Douglas–Peucker in PROJECTED units: the question is what survives at
   drawn size, and at ~3.7 px per unit a coastline wiggle below a unit cannot be seen. Raw 110m is
   119 KB of path text — the same order as the bundle R106 rejected on size, which would have turned
   its own argument against the artifact. ---- */
function pointToSeg(px, py, [ax, ay], [bx, by]){
  let dx = bx - ax, dy = by - ay;
  if (dx || dy){ const t = ((px-ax)*dx + (py-ay)*dy) / (dx*dx + dy*dy);
    if (t > 1){ ax = bx; ay = by; } else if (t > 0){ ax += dx*t; ay += dy*t; } }
  dx = px - ax; dy = py - ay; return Math.sqrt(dx*dx + dy*dy);
}
function rdp(pts, tol){
  if (pts.length < 3) return pts;
  let maxD = -1, idx = 0;
  const a = pts[0], b = pts[pts.length-1];
  for (let i = 1; i < pts.length-1; i++){ const d = pointToSeg(pts[i][0], pts[i][1], a, b); if (d > maxD){ maxD = d; idx = i; } }
  if (maxD <= tol) return [a, b];
  return rdp(pts.slice(0, idx+1), tol).slice(0, -1).concat(rdp(pts.slice(idx), tol));
}
const q = n => Number(n.toFixed(DP));
function ringArea(pts){ let a = 0;
  for (let i = 0, j = pts.length-1; i < pts.length; j = i++) a += pts[j][0]*pts[i][1] - pts[i][0]*pts[j][1];
  return Math.abs(a/2); }

const NEEDED = ['China','Taiwan','Thailand','Sri Lanka','Japan','India','Indonesia','Vietnam',
                'Nepal','South Korea','Kenya','Malawi'];   // every country ORIGIN_COUNTRY_WORDS knows
const paths = [], drawn = [], per = {};
for (const g of topo.objects.countries.geometries){
  const nm = (g.properties && g.properties.name) || '?';
  for (const poly of polygonsOf(g)) for (const r of poly){
    const pr = r.map(([lo, la]) => project(lo, la));
    if (ringArea(pr) < MIN_AREA) continue;
    const simp = rdp(pr, TOL).map(([x,y]) => [q(x), q(y)]);
    const out = []; let last = null;
    for (const c of simp){ if (last && c[0] === last[0] && c[1] === last[1]) continue; out.push(c); last = c; }
    if (out.length < 4) continue;
    paths.push('M' + out.map(c => c.join(' ')).join('L') + 'Z');
    drawn.push(out); per[nm] = (per[nm]||0) + 1;
  }
}
const missingCountry = NEEDED.filter(n => !per[n]);
if (missingCountry.length){ console.error('DROPPED A NEEDED COUNTRY: ' + missingCountry.join(', ') + ' — lower MIN_AREA'); process.exit(1); }

/* ---- 4. The guard that sets the tolerance (finding 1). A shared projection is necessary and not
   sufficient: simplification moves coastlines, and a coastal town can end up in the sea on the
   simplified shape while its coordinate row is perfectly right. Nothing is written until every
   shipped coordinate lands on drawn land. ---- */
const COORD_ROWS = [
  ['Kagoshima, Japan', 31.60, 130.56], ['Chiran, Kagoshima, Japan', 31.38, 130.44],
  ['Hoshino, Fukoaka, Japan', 33.25, 130.77], ['Fujian, China', 26.07, 119.31],
  ['Yunnan, China', 25.04, 102.72], ['Guangdong, China', 23.12, 113.25],
  ['Zhejiang, China', 30.29, 120.16], ['Nantou, Taiwan', 23.92, 120.68]
];
function insideDrawn(x, y){
  let inside = false;
  for (const r of drawn) for (let i = 0, j = r.length-1; i < r.length; j = i++){
    const [xi, yi] = r[i], [xj, yj] = r[j];
    if ((yi > y) !== (yj > y) && x < (xj-xi)*(y-yi)/(yj-yi) + xi) inside = !inside;
  }
  return inside;
}
const offshore = COORD_ROWS.filter(([, lat, lon]) => { const [x, y] = project(lon, lat); return !insideDrawn(x, y); });
if (offshore.length){
  console.error('TOLERANCE TOO HIGH at TOL=' + TOL + ' — these land in the sea on the drawn shape:');
  offshore.forEach(([n]) => console.error('  ' + n));
  console.error('A pin in the sea is wrong even when its row is right. Lower TOL.');
  process.exit(1);
}

/* ---- 5. Write the asset ---- */
const body = `/* GENERATED by tools/gen-origins-outline.js — do not hand-edit.
   Natural Earth 110m (public domain) via world-atlas@2.0.2, spherical Mercator, normalised to
   0..${U}, Douglas-Peucker tolerance ${TOL}. ${paths.length} rings.
   The projection lives HERE, beside the paths it produced, so the app cannot project a pin with a
   different forward than the coastline was drawn with — the failure that would be invisible except
   as pins landing slightly wrong, worst at the latitudes this shelf uses.
   Regenerate: node tools/gen-origins-outline.js path/to/countries-110m.json */
const ORIGINS_UNITS = ${U};
const ORIGINS_LAT_MAX = ${LAT_MAX};
const ORIGINS_Y0 = ${Y0};
const ORIGINS_Y1 = ${Y1};
// lon/lat -> [x, y] in outline units. Same forward as the generator's, emitted from it.
function originsProject(lon, lat){
  const p = Math.max(-ORIGINS_LAT_MAX, Math.min(ORIGINS_LAT_MAX, lat)) * Math.PI / 180;
  const my = Math.log(Math.tan(Math.PI / 4 + p / 2));
  return [ (lon + 180) / 360 * ORIGINS_UNITS, (my - ORIGINS_Y0) / (ORIGINS_Y1 - ORIGINS_Y0) * ORIGINS_UNITS ];
}
const ORIGINS_OUTLINE = '${paths.join('')}';
`;
fs.writeFileSync(OUT, body);
const kb = (body.length/1024).toFixed(1);
console.log('wrote ' + path.relative(REPO, OUT) + ' — ' + paths.length + ' rings, ' + kb + ' KB, TOL=' + TOL);
console.log('guard: all ' + NEEDED.length + ' nameable countries render; all ' + COORD_ROWS.length + ' coordinate rows land on drawn land');
