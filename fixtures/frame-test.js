/* frame-test.js — the R5 surface-language spine's FILL-LAW FENCE (F31 → R153).
 *
 * A static CSS-contract scan of styles.css (no vm sandbox — this checks the frame layer, not app
 * logic; the same shape as liquor-test.js §D's CSS fences). It exists to STOP THE NEXT 119 BOXES:
 * every fence below is run once against the real stylesheet (must pass) and once against an in-memory
 * MUTATED copy (a negative control that must FAIL — proving the fence can see red).
 *
 * THE LAW (F31): the frame never carries a fill. On the frame layer every background is --porcelain,
 * --band, or --white; any other fill names a rationed mark (liquor, clay, xanthous, blue). RADIUS law:
 * frame radii are 0 or 2px; a torn (4-value) radius is rationed to the liquor swatch (an SVG path, R145,
 * so it carries NO css radius) and the clay SLAB (.btn-clay) alone — "one slab per screen, one swatch
 * per tea, zero asymmetric radii anywhere else" (board §1d, docs/r5/boards/surface-language-spine.dc.html).
 *
 * Scope (F33 — per-surface, grows a surface at a time): SURFACES registers each re-dressed surface's
 * frame selectors — shelf (slice 1, R153) + shopping (slice 2, R154/R155) + session-detail (slice 3,
 * R156/R157 — the first box-less surface, positive assertion on .sd-photo per the .shelf-thumb precedent)
 * + insights (slice 4, R161/R162 — .ins-door positive, and a ZERO-CLAY assertion only a 0-SLAB surface
 * can make) + home (slice 5, R163+ — warm Home: .home-masthead BAND positive; the Wrapped moment's
 * --wc-jade and the liquor swatches are rationed marks, excluded like liquor/clay) — plus the shared
 * primitives and the slab. NOTE: the R166 whiter-ground change is --porcelain's VALUE; FILL_OK matches the
 * var() REFERENCE, so it is transparent to every check (verified: no false redden). Marks/evidence (.shelf-swatch, .shelf-pill type-tint, .shelf-ph/.shelf-kanji photo tints)
 * are NOT frame — excluded, and the photo-tint fallback is a KNOWN deferred fill-law item (R149), reported
 * below, not asserted. Radii/fills are measured FROM SOURCE, never the board's drawn numbers (R127/R128).
 */
const fs = require('fs'), path = require('path');
const REPO = path.resolve(__dirname, '..');
const CSS = stripComments(fs.readFileSync(path.join(REPO, 'styles.css'), 'utf8'));

function stripComments(s){ return s.replace(/\/\*[\s\S]*?\*\//g, ''); }
function escRe(s){ return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
// Body of an EXACT selector rule (`sel{...}`) — anchored so `.band` never matches `.lib-band`,
// `.shelf-card` never matches `.shelf-card:hover`. Returns the declaration text, or null.
function bodyOf(css, sel){ const m = css.match(new RegExp(escRe(sel) + '\\s*\\{([^{}]*)\\}')); return m ? m[1] : null; }
function decl(body, prop){ if(body==null) return null; const m = body.match(new RegExp('(?:^|;)\\s*' + escRe(prop) + '\\s*:\\s*([^;]+)')); return m ? m[1].trim() : null; }
function bg(css, sel){ const b = bodyOf(css, sel); if(b==null) return null; return decl(b, 'background-color') || decl(b, 'background'); }
function radius(css, sel){ const b = bodyOf(css, sel); return b==null ? null : decl(b, 'border-radius'); }
function isTorn(r){ return r!=null && r.trim().split(/\s+/).length === 4; }   // 4-value = a torn corner set

// FRAME selectors (containers/structure) — not the marks that ride on them — kept in a PER-SURFACE
// registry (F33: the rollout is per-surface, so the fence names which surface each selector proves). A
// surface is not fenced until its selectors are in here AND a negative control below bites on one of them.
const SURFACES = {
  shelf:         ['.shelf-card', '.shelf-row', '.shelf-row-mid', '.shelf-caret', '.shelf-thumb', '.lib-band'],
  shopping:      ['.shop-band', '.shop-add', '.shop-sec', '.shop-row'],       // R154/R155 — slice 2
  sessionDetail: ['.sd-band', '.sd-sec', '.sd-steep', '.sd-photo'],           // R156/R157 — slice 3
  insights:      ['.ins-band', '.ins-sec', '.ins-sechead', '.ins-door'],      // R161/R162 — slice 4
  home:          ['.home-masthead', '.home-sechead', '.lead-door', '.today-row'],  // R163+ — slice 5 (warm Home)
};
const FRAME = [...Object.values(SURFACES).flat(), '.band'];           // '.band' is the shared primitive
const FILL_OK = ['var(--porcelain)', 'var(--band)', 'var(--white)'];   // the only fills a frame may carry
const RAD_OK  = ['0', '2px'];                                          // the only frame radii

let passed = 0, failed = 0;
function ok(name){ passed++; console.log('  ✓ ' + name); }
function bad(name, detail){ failed++; console.log('  ✗ ' + name + (detail ? '  — ' + detail : '')); }
// A CHECKER returns {ok:bool, msg}. Run it on the real CSS (expect ok) AND, in §F, on a mutated
// CSS (expect !ok). Counts derive from passed/failed, never hand-written.
function expectPass(name, res){ res.ok ? ok(name) : bad(name, res.msg); }
function expectFail(name, res){ res.ok ? bad(name, 'control did NOT bite (fence is blind here)') : ok(name); }

/* ---------- the checkers (each callable on any css string, for negative controls) ---------- */
function chkBandToken(css){
  if(!/--band\s*:\s*var\(\s*--porcelain-dim\s*\)/.test(css)) return {ok:false, msg:'--band must alias var(--porcelain-dim) (no new hex, R128)'};
  if(/--band\s*:\s*#/.test(css)) return {ok:false, msg:'--band is defined as a raw hex — that duplicates --porcelain-dim'};
  return {ok:true};
}
function chkPrimitive(css, sel, want){   // want: {bg, radius, mustHave:[], mustNot:[]}
  const b = bodyOf(css, sel);
  if(b==null) return {ok:false, msg:sel + ' is not defined'};
  if('bg' in want){ const g = decl(b,'background-color')||decl(b,'background'); if((g||null)!==want.bg) return {ok:false, msg:sel+' background is '+g+', want '+want.bg}; }
  if('radius' in want){ const r = decl(b,'border-radius'); if((r||null)!==want.radius) return {ok:false, msg:sel+' border-radius is '+r+', want '+want.radius}; }
  for(const p of (want.mustHave||[])) if(!(new RegExp(escRe(p)).test(b))) return {ok:false, msg:sel+' is missing "'+p+'"'};
  for(const p of (want.mustNot||[])) if(new RegExp(escRe(p)).test(b)) return {ok:false, msg:sel+' must not contain "'+p+'"'};
  return {ok:true};
}
function chkFrameFill(css){
  for(const sel of FRAME){ const g = bg(css, sel); if(g!=null && !FILL_OK.includes(g)) return {ok:false, msg:sel+' carries a non-frame fill: '+g}; }
  return {ok:true};
}
function chkFrameRadius(css){
  for(const sel of FRAME){ const r = radius(css, sel); if(r!=null && !RAD_OK.includes(r)) return {ok:false, msg:sel+' radius is '+r+', not 0/2px'}; }
  // the liquor swatch is an SVG path (R145): it must carry NO css border-radius.
  if(radius(css, '.shelf-swatch')!=null) return {ok:false, msg:'.shelf-swatch has a css radius (it is an SVG path, R145)'};
  return {ok:true};
}
function chkSlabTorn(css){ const r = radius(css, '.btn-clay'); return isTorn(r) ? {ok:true} : {ok:false, msg:'.btn-clay (the slab) must carry the one torn radius; got '+r}; }
function chkRationing(css){   // board §1d: exactly one torn radius among {all frames ∪ slab}, and it is the slab
  const torn = [...FRAME, '.btn-clay'].filter(sel => isTorn(radius(css, sel)));
  if(torn.length !== 1) return {ok:false, msg:'torn radii across frames: ['+torn.join(', ')+'] — want exactly one'};
  if(torn[0] !== '.btn-clay') return {ok:false, msg:'the one torn radius is on '+torn[0]+', not the slab'};
  return {ok:true};
}
// R162 — the zero-clay assertion. Insights has 0 SLAB (a retrospective commits to nothing), so no
// var(--clay) may appear on ANY of its frame selectors — an assertion only a slab-less surface can make.
function chkNoClay(css, selectors){
  for(const sel of selectors){ const b = bodyOf(css, sel); if(b!=null && /var\(--clay\)/.test(b)) return {ok:false, msg:sel+' carries var(--clay) on a surface that has no SLAB'}; }
  return {ok:true};
}

/* ---------- A · the token (F32/R128) ---------- */
console.log('\nA · --band token');
expectPass('--band aliases --porcelain-dim (no new hex)', chkBandToken(CSS));

/* ---------- B · primitive law (F31/F33) ---------- */
console.log('\nB · the four container primitives');
expectPass('.rule  — no fill, radius 0', chkPrimitive(CSS, '.rule', {radius:'0', mustHave:['border-bottom:1px solid var(--line)'], mustNot:['background']}));
expectPass('.rule-head — 2px ink rule, radius 0', chkPrimitive(CSS, '.rule-head', {radius:'0', mustHave:['border-bottom:2px solid var(--ink)']}));
expectPass('.band  — --band fill, radius 0, no side border', chkPrimitive(CSS, '.band', {bg:'var(--band)', radius:'0', mustHave:['border-top:1px solid var(--line)','border-bottom:1px solid var(--line)'], mustNot:['border-left','border-right']}));
expectPass('.box   — --white fill, radius 2px, no shadow', chkPrimitive(CSS, '.box', {bg:'var(--white)', radius:'2px', mustHave:['border:1px solid var(--line)'], mustNot:['box-shadow']}));
expectPass('.btn-clay (SLAB) — --clay fill, no border, torn radius', chkPrimitive(CSS, '.btn-clay', {bg:'var(--clay)', mustHave:['border:none']}));
expectPass('the SLAB carries the one permitted torn radius', chkSlabTorn(CSS));
expectPass('.ins-door (BOX) — --white, radius 2px', chkPrimitive(CSS, '.ins-door', {bg:'var(--white)', radius:'2px', mustHave:['border:1px solid var(--line)']}));  // R162 positive: the box-less surface's positive subject
expectPass('.home-masthead (BAND) — --band, radius 0', chkPrimitive(CSS, '.home-masthead', {bg:'var(--band)', radius:'0'}));  // R163 positive: Home's masthead band

/* ---------- C · fill-law across every fenced surface (F31 core) ---------- */
console.log('\nC · fill-law — every frame selector carries only --porcelain/--band/--white');
expectPass('no frame selector carries a rationed fill', chkFrameFill(CSS));

/* ---------- D · radius-law across every fenced surface ---------- */
console.log('\nD · radius-law — every frame selector is 0/2px, swatch is an SVG path');
expectPass('every frame radius is 0 or 2px', chkFrameRadius(CSS));

/* ---------- E · the rationing lock (board §1d) ---------- */
console.log('\nE · rationing — exactly one torn radius across all frames, and it is the slab');
expectPass('one torn radius among {all frames ∪ slab}, = .btn-clay', chkRationing(CSS));
expectPass('insights carries NO clay (0 SLAB — a retrospective commits to nothing)', chkNoClay(CSS, SURFACES.insights));  // R162

/* ---------- F · negative controls — the fence MUST see red, on EVERY surface it claims to fence ----------
   A surface added to SURFACES that no control touches is fenced in name only: the checkers null-skip a
   selector that carries no fill/radius, so absence of red proves nothing. Each surface therefore ships a
   control that bites on one of ITS OWN selectors. */
console.log('\nF · negative controls (each must bite)');
// shelf
expectFail('shelf: a rationed fill on .shelf-row reddens fill-law',
  chkFrameFill(CSS.replace('.shelf-row{', '.shelf-row{background:var(--jade);')));
expectFail('shelf: a 14px radius on .shelf-card reddens radius-law',
  chkFrameRadius(CSS.replace(/(\.shelf-card\{[^}]*?border-radius:)2px/, '$114px')));
expectFail('shelf: a torn radius on .shelf-card reddens rationing',
  chkRationing(CSS.replace(/(\.shelf-card\{[^}]*?border-radius:)2px/, '$19px 4px 8px 5px')));
// shopping (R155) — proves the fence SEES the new surface, not just names it
expectFail('shopping: a rationed fill on .shop-row reddens fill-law',
  chkFrameFill(CSS.replace('.shop-row{', '.shop-row{background:var(--jade);')));
expectFail('shopping: a torn radius on .shop-add reddens radius-law',
  chkFrameRadius(CSS.replace(/(\.shop-add\{[^}]*?border-radius:)2px/, '$19px 4px 8px 5px')));
expectFail('shopping: a torn radius on .shop-add reddens rationing',
  chkRationing(CSS.replace(/(\.shop-add\{[^}]*?border-radius:)2px/, '$19px 4px 8px 5px')));
// session-detail (R157) — the first box-less surface; the positive subject is .sd-photo (2px), the
// .shelf-thumb precedent, so a torn radius on it must redden both radius-law and rationing.
expectFail('session-detail: a rationed fill on .sd-sec reddens fill-law',
  chkFrameFill(CSS.replace('.sd-sec{', '.sd-sec{background:var(--jade);')));
expectFail('session-detail: a torn radius on .sd-photo reddens radius-law',
  chkFrameRadius(CSS.replace(/(\.sd-photo\{[^}]*?border-radius:)2px/, '$19px 4px 8px 5px')));
expectFail('session-detail: a torn radius on .sd-photo reddens rationing',
  chkRationing(CSS.replace(/(\.sd-photo\{[^}]*?border-radius:)2px/, '$19px 4px 8px 5px')));
// insights (R162) — 3 controls on its own selectors + the zero-clay control (a claim only this 0-SLAB surface makes)
expectFail('insights: a rationed fill on .ins-sec reddens fill-law',
  chkFrameFill(CSS.replace('.ins-sec{', '.ins-sec{background:var(--jade-pale);')));
expectFail('insights: a 15px radius on .ins-band reddens radius-law',
  chkFrameRadius(CSS.replace(/(\.ins-band\{[^}]*?border-radius:)0/, '$115px')));
expectFail('insights: a torn radius on .ins-door reddens rationing',
  chkRationing(CSS.replace(/(\.ins-door\{[^}]*?border-radius:)2px/, '$19px 4px 8px 5px')));
expectFail('insights: clay on .ins-sec reddens the zero-clay assertion',
  chkNoClay(CSS.replace('.ins-sec{', '.ins-sec{background:var(--clay);'), SURFACES.insights));
// home (R163+) — warm Home; the whiter-ground token change is transparent (FILL_OK is reference-based)
expectFail('home: a rationed fill on .lead-door reddens fill-law',
  chkFrameFill(CSS.replace('.lead-door{', '.lead-door{background:var(--jade);')));
expectFail('home: a torn radius on .home-masthead reddens radius-law',
  chkFrameRadius(CSS.replace(/(\.home-masthead\{[^}]*?border-radius:)0/, '$114px 5px 12px 6px')));
expectFail('home: a torn radius on .home-masthead reddens rationing',
  chkRationing(CSS.replace(/(\.home-masthead\{[^}]*?border-radius:)0/, '$19px 4px 8px 5px')));
// shared primitives + the slab
expectFail('.band losing its --band fill reddens the primitive',
  chkPrimitive(CSS.replace(/(\.band\{[^}]*?background:)var\(--band\)/, '$1var(--jade)'), '.band', {bg:'var(--band)'}));
expectFail('--band as a raw hex reddens the token check',
  chkBandToken(CSS.replace('--band:var(--porcelain-dim)', '--band:#EDE7D6')));
expectFail('a flattened slab (2px, not torn) reddens the slab check',
  chkSlabTorn(CSS.replace(/(\.btn-clay\{[^}]*?border-radius:)15px 5px 13px 5px/, '$12px')));

/* ---------- deferred, reported not asserted (R149) ---------- */
console.log('\n⚡ DEFERRED (R149) — the photo-less .shelf-ph / .shelf-kanji tint is a fill on a non-rationed');
console.log('   element; the fill-law is built to catch it, but it is resolved in the rollout, not this slice.');
console.log('⚡ EXCLUDED MARKS (R170) — the warmth pass paints MARKS, not frame: the colour-clock bars (.clock-bar,');
console.log('   liquor / --heat-empty), the Teas-brewed .ins-strip, the .ins-note-swatch and the .ins-typebar are');
console.log('   liquor/type data riding on paper — excluded from SURFACES like the shelf swatch. No frame selector');
console.log('   changed, so F31 is untouched and nothing above re-reddens.');

/* ---------- verdict ---------- */
console.log('');
if(failed){ console.log('FRAME TESTS FAILED — ' + failed + ' failed, ' + passed + ' passed'); process.exit(1); }
console.log('ALL FRAME TESTS PASSED (' + passed + ' passed)');
