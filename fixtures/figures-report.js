// Figures reporter — regenerates the R3 hand-off §1 SNAPSHOT block from fixtures/.
//
// Why it exists (R67): §1 filed two kinds of figure under one heading. Invariants (five stock
// tiers, four lanes over three stored values, untagged-is-not-a-lane, the null-brew_style count)
// are authoritative and carry no stamp. Snapshots — counts, grams, litres, percentages,
// distributions — move every time a cup is brewed, and hand-copying them is how §1 came to hold
// numbers that lost to the export it claimed to outrank. Snapshots are GENERATED, never
// transcribed. Run this, check the output against the CSVs, paste.
//
// It calls the SHIPPED engine in a vm sandbox rather than recomputing anything: gridStats() for
// totals and litres, computeStats() for the type mix and clock buckets, isRunningLow()/stockTier()
// for the low set, distinctVendors() for vendors. A parallel calculation here would be a second
// writer, and two writers is the bug class this round keeps finding.
//
// Report-only: no assertions, no exit code contract. `export-gate-test.js` is the gate; this is the
// paste source. Run the gate first — a report over a stale set is worse than no report.

process.env.TZ = 'Europe/Berlin';   // Niklas's local zone. Clock buckets MUST render local: raw
                                    // hours peak 07 UTC and 09 local, and this round has already
                                    // had to explain that inversion twice. Pinned, not inherited —
                                    // a reporter run in another zone would silently re-invert it.

const fs = require('fs'), path = require('path'), vm = require('vm');
const REPO = path.resolve(__dirname, '..');

const SRC = ['steep-knowledge.js','steep-tea-types.js','steep-core.js','steep-dashboard.js','steep-teas.js']
  .map(f => fs.readFileSync(path.join(REPO, f), 'utf8')).join('\n;\n');
const ctx = {}; ctx.window = ctx; ctx.globalThis = ctx; ctx.console = console;
ctx.document = { documentElement:{ setAttribute(){}, getAttribute(){ return 'light'; } },
  getElementById: () => null, querySelectorAll: () => [],
  createElement: () => ({ style:{}, setAttribute(){}, appendChild(){}, classList:{ add(){} } }) };
ctx.localStorage = { getItem: () => null, setItem(){}, removeItem(){} };
ctx.matchMedia = () => ({ matches:false }); ctx.navigator = { onLine:true };
ctx.setTimeout = () => {}; ctx.clearTimeout = () => {};
ctx.setInterval = () => {}; ctx.clearInterval = () => {}; ctx.addEventListener = () => {};
vm.createContext(ctx); vm.runInContext(SRC, ctx);

function parseCSV(t){ t = t.replace(/^﻿/, '');
  const R = []; let r = [], c = '', q = false;
  for (let i = 0; i < t.length; i++){ const ch = t[i];
    if (q){ if (ch === '"'){ if (t[i+1] === '"'){ c += '"'; i++; } else q = false; } else c += ch; }
    else if (ch === '"') q = true;
    else if (ch === ','){ r.push(c); c = ''; }
    else if (ch === '\n'){ r.push(c); R.push(r); r = []; c = ''; }
    else if (ch !== '\r') c += ch; }
  if (c || r.length){ r.push(c); R.push(r); }
  const h = (R[0] || []).map(s => s.trim());
  return R.slice(1).filter(x => x.length === h.length)
          .map(x => Object.fromEntries(h.map((k, i) => [k, x[i]])));
}
const has = f => fs.existsSync(path.join(__dirname, f));
const rows = f => parseCSV(fs.readFileSync(path.join(__dirname, f), 'utf8'));
const bool = v => v === 'true' || v === 't' || v === 'TRUE';
const num  = v => (v === '' || v == null) ? null : Number(v);

// snake_case → camelCase, mirroring steep-data.js's *FromDb mappers (checked, not assumed).
const teaFromRow = r => ({ id:r.id, name:r.name||'', type:r.type||'', origin:r.origin||'',
  source:r.source||'', amountGrams:Number(r.amount_grams)||0, rating:Number(r.rating)||0,
  isFavorite:bool(r.is_favorite), costTotal:Number(r.cost_total)||0,
  costOriginalGrams:Number(r.cost_original_grams)||0, brewGuide:r.brew_guide||'',
  purchaseType:r.purchase_type||'', purchaseDate:r.purchase_date||'', dateAdded:r.date_added||r.created_at,
  harvestYear:r.harvest_year||'', harvestSeason:r.harvest_season||'', cultivar:r.cultivar||'' });
const vesFromRow = r => ({ id:r.id, name:r.name||'', type:r.type||'',
  capacityMl:num(r.capacity_ml), image:r.image_data||null });
const sesFromRow = r => ({ id:r.id, teaId:r.tea_id, vesselId:r.vessel_id, date:r.session_date,
  isColdBrew:bool(r.is_cold_brew), gramsUsed:Number(r.grams_used)||0, rating:Number(r.rating)||0,
  isShared:bool(r.is_shared), mood:r.mood||null, waterMl:num(r.water_ml),
  brewStyle:r.brew_style||null, teaName:r.tea_name||'', teaType:r.tea_type||'',
  infusionCount:num(r.infusion_count), steeps:[] });

// The export is NOT user-scoped — teas_rows.csv carries another account's row, and user_settings
// carries every beta user. The app scopes by user_id on purpose (the v3.21 hotfix: a social RLS
// policy lets followers read others' shared sessions, and an unfiltered load leaks them into
// personal stats). A reporter that skipped this would inherit the same bug: the foreign tea row is
// vendorless, so it silently turned "one tea with no vendor" into two.
// Owner is DERIVED from who owns the sessions, never hardcoded.
const rawTeas = rows('teas_rows.csv'), rawSes = rows('sessions_rows.csv');
const OWNER = Object.entries(rawSes.reduce((a, r) => (a[r.user_id] = (a[r.user_id]||0)+1, a), {}))
                    .sort((a, b) => b[1] - a[1])[0][0];
const mine = R => R.filter(r => !('user_id' in r) || r.user_id === OWNER);
const foreignTeas = rawTeas.length - mine(rawTeas).length;
const foreignSes  = rawSes.length  - mine(rawSes).length;

const teas = mine(rawTeas).map(teaFromRow);
const vessels = mine(rows('vessels_rows.csv')).map(vesFromRow);
const sessions = mine(rawSes).map(sesFromRow);
const wishlist = has('wishlist_rows.csv') ? mine(rows('wishlist_rows.csv')) : null;
const settings = has('user_settings_rows.csv') ? rows('user_settings_rows.csv') : null;  // all users, on purpose
const allSteepIds = new Set(sessions.map(s => s.id));
const steeps = rows('steeps_rows.csv').filter(x => allSteepIds.has(x.session_id));  // no user_id column

// Attach steeps to their sessions — steepCountOf reads session.steeps, and an unattached set
// would silently report totalSteeps 0 and litres 0 while every other figure looked right.
const byId = Object.fromEntries(sessions.map(s => [s.id, s]));
let orphan = 0;
steeps.forEach(x => { const s = byId[x.session_id]; if (!s) { orphan++; return; }
  s.steeps.push({ timeSeconds:num(x.time_seconds), tempC:num(x.temp_c),
                  description:x.description||'', tags:x.tags||[], feedback:x.feedback||null }); });

// The real low-stock threshold, read from the OWNER's settings row — never DEFAULT_SETTINGS, and
// never "whichever row isn't 15". §0.2: read the setting.
let threshold = null, thresholdSrc = 'DEFAULT (15) — the owner has no user_settings row';
if (settings){
  const own = settings.find(r => r.user_id === OWNER);
  const m = own && /"lowStockThreshold"\s*:\s*(\d+)/.exec(own.settings || '');
  if (m){ threshold = Number(m[1]); thresholdSrc = `user_settings_rows.csv, owner ${OWNER.slice(0,8)} (${settings.length} rows in table, ${settings.length-1} other users ignored)`; }
}
// `let state` lives in the vm's lexical scope, not on the sandbox object, so it can only be
// reached from inside the context — the same reason every committed suite seeds it this way.
ctx.__fx = { teas, vessels, sessions, threshold };
vm.runInContext(`state.settings=Object.assign({},DEFAULT_SETTINGS);
  if(__fx.threshold!=null) state.settings.lowStockThreshold=__fx.threshold;
  state.teas=__fx.teas; state.vessels=__fx.vessels; state.sessions=__fx.sessions;`, ctx);

const st = ctx.computeStats();

// ---- source stamp -----------------------------------------------------------------------------
const mt = f => has(f) ? fs.statSync(path.join(__dirname, f)).mtime.toISOString().slice(0, 10) : '—';
const dates = sessions.map(s => (s.date || '').slice(0, 10)).filter(Boolean).sort();
console.log('R3 §1 SNAPSHOT — GENERATED, DO NOT HAND-EDIT');
console.log('='.repeat(78));
console.log(`source        fixtures/*.csv, files dated ${mt('sessions_rows.csv')}`);
console.log(`scoped to     user_id ${OWNER} (derived from who owns the sessions)`);
console.log(`rows read     teas ${teas.length} · sessions ${sessions.length} · steeps ${steeps.length} · vessels ${vessels.length}` +
            ` · wishlist ${wishlist ? wishlist.length : 'ABSENT'} · user_settings ${settings ? settings.length : 'ABSENT'} (all users)`);
console.log(`excluded      ${foreignTeas} tea row(s) and ${foreignSes} session row(s) belonging to other accounts` +
            ` — the export is not user-scoped; the app scopes on purpose (v3.21)`);
console.log(`session dates ${dates[0]} .. ${dates[dates.length - 1]}`);
console.log(`timezone      ${process.env.TZ} (pinned — clock buckets are LOCAL, not UTC)`);
console.log(`low threshold ${threshold != null ? threshold + ' g' : '15 g'} — ${thresholdSrc}`);
if (orphan) console.log(`WARNING       ${orphan} steeps had no matching session — run export-gate-test.js`);
console.log('='.repeat(78));

const live = teas;   // 21 live + the deleted Test row are both present in the export
console.log(`\nShape: ${live.length} tea rows · ${sessions.length} sessions · ${steeps.length} steeps · ` +
            `${vessels.length} vessels · ${st.days.size} distinct days · dates ${dates[0]} to ${dates[dates.length-1]}.`);
// Litres has an UNDECLARED FALLBACK that §1's "x steeps" hides. gridStats multiplies by
// steepCountOf(s) (steep-core.js:728), which is "real steeps if it has them, else infusionCount" —
// the quick-log count. One session (Chiran Sencha Okumidori, 3 infusions, 73 ml, zero steep rows)
// contributes 0.219 L through that branch. Counting steep ROWS alone gives 15.29 L, not 15.51.
// Both are defensible; only one is what the app renders. State the formula in full.
const fb = sessions.filter(s => !(s.steeps && s.steeps.length) && Number(s.infusionCount) > 0);
const fbSteeps = fb.reduce((a, s) => a + Number(s.infusionCount), 0);
console.log(`\nTotals: totalGrams ${st.totalGrams.toFixed(1)} g · ${st.totalLiters.toFixed(2)} L`);
console.log(`  formula: sum over sessions of (water_ml, else vessel capacity) x steepCountOf(session),`);
console.log(`  where steepCountOf = real steep rows if any, ELSE the quick-log infusion_count.`);
console.log(`  ${fb.length} session(s) used the infusion_count fallback (${fbSteeps} inferred infusions):` +
            ` ${fb.length ? fb.map(s => `${s.teaName||'(untitled)'} x${s.infusionCount}`).join(', ') : '—'}.`);
console.log(`  Steep ROWS alone (no fallback) would give ${(st.totalLiters - fb.reduce((a,s)=>{const v=vessels.find(x=>x.id===s.vesselId);const ml=Number(s.waterMl)>0?Number(s.waterMl):(v?Number(v.capacityMl)||0:0);return a+(ml*Number(s.infusionCount))/1000;},0)).toFixed(2)} L —` +
            ` the app renders the fallback figure, so §1 must too.`);

// ---- method split: FIVE slots, and it is not the lane set (R64) --------------------------------
const styles = {}; sessions.forEach(s => { const k = (s.brewStyle || '').trim() || 'untagged'; styles[k] = (styles[k] || 0) + 1; });
const cold = sessions.filter(s => s.isColdBrew).length;
const coldUntagged = sessions.filter(s => s.isColdBrew && !(s.brewStyle || '').trim()).length;
const nullCount = styles.untagged || 0;
const display = nullCount - coldUntagged;
console.log(`\nMethod split (axis: senchado · gongfu · untagged · western · cold brew) = ` +
            `${styles.senchado||0} · ${styles.gongfu||0} · ${display} · ${styles.western||0} · ${cold} = ${sessions.length}`);
console.log(`  null brew_style ${nullCount}; display untagged ${display} (the cold-brew lane claims ${coldUntagged}).`);
console.log(`  Both are correct — never show them in one row.`);
console.log(`  NOT the control's lane set: the control is FOUR lanes, gongfu-first, and untagged is`);
console.log(`  not a lane (R64). Rendering this quintuple into the lanes puts senchado's count under Gongfu.`);

// ---- type mix BY SESSION (engine: resolves via teaById, not the session snapshot) --------------
const mix = Object.entries(st.typeCounts).filter(([, v]) => v.count > 0).sort((a, b) => b[1].count - a[1].count);
console.log(`\nType mix BY SESSION: ${mix.map(([k, v]) => `${k} ${v.count}`).join(' · ')}. ` +
            `Do not reconcile to the ${live.length}-row shelf — the subject is sessions.`);

// ---- clock, local ------------------------------------------------------------------------------
const lbl = i => `${String(i*2).padStart(2,'0')}-${String(i*2+2).padStart(2,'0')}`;
const nonEmpty = st.hourBuckets.map((v, i) => ({ i, v })).filter(x => x.v > 0);
const ranked = [...nonEmpty].sort((a, b) => b.v - a.v);
const top = ranked[0].v, tied = ranked.filter(x => x.v === top);
console.log(`\nClock (LOCAL ${process.env.TZ}, 2h buckets): ${nonEmpty.map(x => `${lbl(x.i)} ${x.v}`).join(' · ')}`);
console.log(tied.length > 1
  ? `  PEAK IS TIED across ${tied.map(x => lbl(x.i)).join(' and ')} at ${top} each — any copy naming a single peak is false (R68).`
  : `  peak ${lbl(ranked[0].i)} (${top}), second ${ranked[1] ? lbl(ranked[1].i) + ' (' + ranked[1].v + ')' : '—'}`);
const latest = nonEmpty[nonEmpty.length - 1];
console.log(`  latest bucket with any session: ${lbl(latest.i)} (${latest.v}) — check any "nothing after ..." prose against this (R68).`);

// ---- engagement ---------------------------------------------------------------------------------
const mood = sessions.filter(s => s.mood && String(s.mood).trim()).length;
const shared = sessions.filter(s => s.isShared);
// One decimal, trailing .0 stripped: 21/40 is 52.5%, not 53%. #04's pill draws this number, and
// rounding it to a whole percent both loses the half and stops it reconciling with 21/40.
const pct = n => (Math.round((n / sessions.length) * 1000) / 10).toString();
console.log(`\nEngagement: mood ${mood}/${sessions.length} (${pct(mood)}%) · shared ${shared.length}/${sessions.length} (${pct(shared.length)}%)` +
            `, dates ${[...new Set(shared.map(s => (s.date||'').slice(5,10)))].sort().join(' · ')}.`);

// ---- vessels, running low, wishlist ---------------------------------------------------------------
const use = {}; sessions.forEach(s => { const v = vessels.find(x => x.id === s.vesselId); if (v) use[v.name] = (use[v.name]||0)+1; });
console.log(`\nVessels, real usage: ${Object.entries(use).sort((a,b)=>b[1]-a[1]).map(([n,c])=>`${n} ${c}`).join(' · ')}.`);
const low = teas.filter(t => ctx.isRunningLow(t));
console.log(`\nRunning low (stockTier==='low' at threshold ${threshold != null ? threshold : 15} g): ` +
            (low.length ? low.map(t => `${t.name} ${t.amountGrams} g`).join(' · ') : 'none') + '.');
const tiers = {}; teas.forEach(t => { const k = ctx.stockTier(t); tiers[k] = (tiers[k]||0)+1; });
console.log(`  all five tiers across the shelf: ${Object.entries(tiers).map(([k,v])=>`${k} ${v}`).join(' · ')}.`);
if (wishlist) console.log(`\nWishlist: ${wishlist.length} row(s) — ` +
  wishlist.map(w => `${w.name||'(unnamed)'} · ${w.vendor||'(no vendor)'} · done=${w.done}` +
    (teas.some(t => (t.name||'').toLowerCase() === (w.name||'').toLowerCase())
      ? ` · ALSO ON THE SHELF at ${teas.find(t => (t.name||'').toLowerCase() === (w.name||'').toLowerCase()).amountGrams} g (reads as a rebuy, not a duplicate)` : '')
  // The stamp is READ from the file, never written here: a hardcoded date inside the tool that
  // exists to stop hand-copied figures is the same bug one layer up. It said 2026-07-26 for two
  // exports after that stopped being true.
  ).join(' | ') + `. Export-verified (wishlist_rows.csv dated ${mt('wishlist_rows.csv')}).`);

// ---- vendors --------------------------------------------------------------------------------------
const vend = {}; let noVendor = 0;
teas.forEach(t => { const s = (t.source||'').trim(); if (!s) { noVendor++; return; } vend[s] = (vend[s]||0)+1; });
console.log(`\nVendors (teas.source, ${teas.length} rows): ` +
  Object.entries(vend).sort((a,b)=>b[1]-a[1]||a[0].localeCompare(b[0])).map(([n,c])=>`${n} ${c}`).join(' · ') +
  ` · ${noVendor} tea(s) with no vendor at all.`);
console.log(`  distinctVendors() returns ${ctx.distinctVendors().length} names (the empty source is correctly excluded).`);

// ---- origins ----------------------------------------------------------------------------------------
// Region-tier vs country-only: a bare country string (or a country synonym per R16) is country-tier.
const COUNTRY = /^(china|taiwan|thailand|japan|india|sri lanka|ceylon|korea|vietnam|nepal|kenya|malawi|indonesia)$/i;
let region = 0, country = 0; const countryOnly = [];
teas.forEach(t => { const o = (t.origin||'').trim(); if (!o) return;
  const parts = o.split(',').map(x => x.trim()).filter(Boolean);
  const isCountry = parts.length === 1 ? COUNTRY.test(parts[0])
                  : parts.every(p => COUNTRY.test(p));   // "Ceylon, Sri Lanka" → country tier (R16)
  if (isCountry){ country++; countryOnly.push(`${t.name} (${o})`); } else region++; });
console.log(`\nOrigins: ${region} region-tier · ${country} country-only.`);
countryOnly.forEach(x => console.log(`    country-only: ${x}`));

console.log(`\n${'='.repeat(78)}`);
console.log('INVARIANTS are NOT in this report (R67): five stock tiers · the three-step vessel ladder ·');
console.log('four drawn lanes over three stored values + a boolean · untagged is not a lane · the');
console.log('null-brew_style count keeping R64 sound · the three-tier cascade · type mix counts');
console.log('sessions. Those are authoritative and carry no stamp. Everything above is a SNAPSHOT:');
console.log('stamp it, re-derive at build, never trust a transcription.');
