/* ============ Go Deeper — the browsable reference (R51, R3 slice B) ============
   The Teas tab's SECOND MODE: your shelf ↔ the reference. Reads steep-tea-types.js (Phase A,
   v3.87) and writes nothing, ever — the reference SUGGESTS. Every fact rendered here comes from
   resolveTeaType(); where the catalog has no value the line is omitted, never filled (the
   three-tier cascade: user value → catalog default → show nothing).

   Coverage is honest, not flattering. matchTeaType is exact-fold `covers`-only by design, so on
   the current shelf 12 of 21 teas match and 11 of 27 categories carry the "on your shelf" mark —
   the other 16 render dimmed. Concealing that would misrepresent what the catalog knows AND
   remove the pressure to extend it (the same posture as #37's honest before/after). */

// Catalog families → the shipped .t-* tint classes. 'dark' has no tea-type of its own; puerh is
// its shelf equivalent, which is why the map exists rather than a bare family string.
const REF_FAMILY_TINT = { oolong:'oolong', green:'green', white:'white', yellow:'yellow', black:'black', dark:'puerh' };
function refFamilyClass(f){ return REF_FAMILY_TINT[String(f||'').toLowerCase()] || 'unknown'; }

// First CJK alias, for the row's script column. Display only — never a comparison key (v3.88).
function refScript(row){
  const aka = (row && row.aka) || [];
  for(let i=0;i<aka.length;i++){ if(/[㐀-鿿぀-ヿ]/.test(aka[i])) return aka[i]; }
  return '';
}

// slug → the names of YOUR teas the catalog covers. Built through the shipped matcher, so it can
// never drift from what the rest of the app calls a match.
function refOwnedBySlug(){
  const out = {};
  (state.teas||[]).forEach(t=>{
    const m = matchTeaType(t.name);
    if(!m) return;
    (out[m.slug] = out[m.slug] || []).push(t.name);
  });
  return out;
}
// A category counts as owned when the parent OR any member is covered by a tea on the shelf.
function refOwnedNames(cat, owned){
  let names = (owned[cat.type.slug]||[]).slice();
  cat.members.forEach(m=>{ names = names.concat(owned[m.slug]||[]); });
  return names;
}

// Search folds through ttNormName (the catalog's own normaliser), across name, aka, family and
// region — so "wuyi", "武夷", "oolong" and "Fujian" all reach the same row.
function refMatches(cat, q){
  if(!q) return true;
  const hay = [];
  const add = r => { hay.push(r.display_name, r.family, r.region); (r.aka||[]).forEach(a=>hay.push(a)); };
  add(cat.type); cat.members.forEach(add);
  const nq = ttNormName(q);
  return hay.some(h=>ttNormName(h).indexOf(nq) >= 0);
}

function refMetaLine(cat){
  const t = cat.type;
  const bits = [t.family, t.roast, cat.members.length ? cat.members.length + ' entries' : t.leaf_shape];
  return bits.filter(Boolean).join(' · ');
}

// The resolved facts, each omitted when the catalog has nothing. Never a guess, never a zero.
//
// `inherited` is the parent's already-rendered fact set: TT_INHERIT means a member row resolves to
// its parent's region/leaf/oxidation/roast/brew verbatim, so drawing them again repeated the same
// eight lines nine times under Wuyi Yancha. A member shows only what it ADDS — which is also the
// honest thing, since what it adds is the only reason it is a separate row. Confidence is exempt:
// it is per-row by design (steep-tea-types.js:86), so the hedge always renders.
function refFactsHTML(t, inherited){
  const rows = [];
  const same = (k,v) => inherited && inherited[k] === v;
  const fact = (label, val, key) => {
    if(!val || (key && same(key,val))) return;
    rows.push(`<div class="ref-fact"><span class="ref-fact-k mono">${escapeHtml(label)}</span><span class="ref-fact-v">${escapeHtml(val)}</span></div>`);
  };
  fact('region', t.region, 'region');
  fact('leaf', t.leaf_shape, 'leaf');
  if(t.oxidation_low != null && t.oxidation_high != null) fact('oxidation', t.oxidation_low + '–' + t.oxidation_high + '%', 'oxidation');
  fact('roast', t.roast, 'roast');
  const b = t.typical_brew;
  if(b){
    // °C/°F follows the user's setting — the catalog stores Celsius, cToDisplay is the one converter.
    const temp = (b.temp_c && b.temp_c.length===2) ? cToDisplay(b.temp_c[0]) + '–' + cToDisplay(b.temp_c[1]) + tempUnitLabel() : '';
    const ratio = b.g_per_100ml ? b.g_per_100ml + ' g / 100 ml' : '';
    fact('typical', [temp, ratio].filter(Boolean).join(' · '), 'typical');
    fact('', b.note, 'note');
  }
  const hedge = typeConfidenceHedge(t);
  const sig = (t.signature && !same('signature', t.signature)) ? `<div class="ref-sig">${escapeHtml(t.signature)}</div>` : '';
  const hed = hedge ? `<div class="ref-hedge">${escapeHtml(hedge)}</div>` : '';
  return `${sig}${rows.join('')}${hed}`;
}
// The parent's fact values, keyed exactly as refFactsHTML keys them, so a member can skip a repeat.
function refFactKeys(t){
  const b = t.typical_brew || {};
  const temp = (b.temp_c && b.temp_c.length===2) ? cToDisplay(b.temp_c[0]) + '–' + cToDisplay(b.temp_c[1]) + tempUnitLabel() : '';
  const ratio = b.g_per_100ml ? b.g_per_100ml + ' g / 100 ml' : '';
  return { region:t.region, leaf:t.leaf_shape,
    oxidation:(t.oxidation_low!=null && t.oxidation_high!=null) ? t.oxidation_low+'–'+t.oxidation_high+'%' : undefined,
    roast:t.roast, typical:[temp,ratio].filter(Boolean).join(' · '), note:b.note, signature:t.signature };
}

function refEntryHTML(t, owned, inherited){
  const names = owned[t.slug] || [];
  const mark = names.length ? `<div class="ref-own">on your shelf — ${escapeHtml(names.join(' · '))}</div>` : '';
  return `<div class="ref-entry${inherited?' is-member':''}">
    <div class="ref-entry-head"><span class="ref-entry-name">${escapeHtml(t.display_name)}</span>${refScript(t)?`<span class="ref-script">${escapeHtml(refScript(t))}</span>`:''}</div>
    ${refFactsHTML(t, inherited)}
    ${mark}
  </div>`;
}

function refRowHTML(cat, owned){
  const t = cat.type;
  const names = refOwnedNames(cat, owned);
  const open = state.refOpen === t.slug;
  const script = refScript(t);
  return `<div class="ref-row${names.length?'':' is-unowned'}${open?' is-open':''}">
    <div class="ref-rowhead" onclick="toggleRefEntry('${escapeJsArg(t.slug)}')">
      <span class="ref-swatch t-${escapeHtml(refFamilyClass(t.family))}"></span>
      <div class="ref-rowmid">
        <div class="ref-rowname"><span class="shelf-name">${escapeHtml(t.display_name)}</span>${script?`<span class="ref-script">${escapeHtml(script)}</span>`:''}</div>
        <span class="ref-meta mono">${escapeHtml(refMetaLine(cat))}</span>
      </div>
      <span class="ref-own-tag mono">${names.length ? 'on your shelf' : ''}</span>
    </div>
    ${open ? `<div class="ref-body">
      ${refEntryHTML(t, owned, null)}
      ${cat.members.map(m=>refEntryHTML(m, owned, refFactKeys(t))).join('')}
    </div>` : ''}
  </div>`;
}

// The mode body. The header, mode switch and search live in viewTeas(); this renders the list so
// onRefSearchInput can swap ONLY this node on a keystroke (the #19 pattern — a full render() would
// drop focus from the input).
function refListHTML(){
  const owned = refOwnedBySlug();
  const q = state.refSearch || '';
  const cats = browseTeaTypes().filter(c=>refMatches(c, q));
  if(!cats.length) return `<div class="card empty">Nothing in the reference matches that.</div>`;
  return `<div class="ref-list">${cats.map(c=>refRowHTML(c, owned)).join('')}</div>`;
}
function onRefSearchInput(val){
  state.refSearch = val;
  const list = document.getElementById('refList'); if(list) list.innerHTML = refListHTML();
  const x = document.getElementById('refSearchX'); if(x) x.style.display = val ? '' : 'none';
}
function clearRefSearch(){ state.refSearch=''; render(); }
function toggleRefEntry(slug){ state.refOpen = (state.refOpen===slug) ? null : slug; render(); }

/* ---- R51's contextual half (slice B2): reaching the reference from a tea ----
   matchTeaType resolves to the most specific row, which for a two-level entry is the MEMBER (Da Hong
   Pao → `dhp`). browseTeaTypes() keys on top-level categories only, so a deep link that passed the
   member slug straight to state.refOpen would open nothing — silently, since a closed row looks
   exactly like a row nobody tapped. Walk to the parent. */
function refCategoryFor(tea){
  const m = tea && matchTeaType(tea.name);
  if(!m) return null;                                  // uncovered — the caller draws nothing at all
  return m.parent || m.slug;
}
function refEntryLabel(tea){
  const m = tea && matchTeaType(tea.name);
  return m ? m.display_name : '';
}
/* Both of the above are pure READS, which is why they live here. The two actions they feed —
   goDeeperFor (navigation) and borrowGuideFrom (which writes a tea's brewGuide) — deliberately do
   NOT: they are in steep-teas.js beside saveSuggestedGuide, their shipped twin. Section A of
   fixtures/reference-test.js caught the first draft with borrowGuideFrom in this file, which is the
   guard working on the first slice after it was written: the reference suggests, it never writes. */
