// Export gate — run this BEFORE any other suite, and before any R3 ship.
//
// Why it exists: on 2026-07-26 a fresh export was added to fixtures/ without the old files being
// removed. Browser downloads land suffixed ("sessions_rows (3).csv"), so every committed suite kept
// reading the STALE unsuffixed paths and kept reporting green. Worse, the stale set was
// mixed-vintage — 28 sessions beside a 3-row vessels file that 5 of those sessions referenced rows
// missing from — a state the database never held. Counts alone would not have caught that; the
// referential checks below are the part that does.
//
// Design note: these are FLOORS, not equalities. Niklas keeps brewing, so an exact session count
// would fail on correct data within the week. The floors are the 2026-07-19 authority export (the
// figures the R3 package was verified against); anything at or above them is a real export, and the
// stale set fails every one. Actual counts are printed, never assumed — read the numbers, don't
// trust the PASS.
//
// Unlike the other committed suites, a MISSING csv is a FAILURE here, not a skip. This suite's whole
// job is to prove the export is present and current; skipping would defeat it.

const fs = require('fs'), path = require('path');

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) { pass++; console.log('  PASS  ' + msg); }
                            else { fail++; console.log('  FAIL  ' + msg); } };

function parseCSV(t){ t = t.replace(/^﻿/, '');
  const R = []; let r = [], c = '', q = false;
  for (let i = 0; i < t.length; i++){ const ch = t[i];
    if (q){ if (ch === '"'){ if (t[i+1] === '"'){ c += '"'; i++; } else q = false; } else c += ch; }
    else if (ch === '"') q = true;
    else if (ch === ','){ r.push(c); c = ''; }
    else if (ch === '\n'){ r.push(c); R.push(r); r = []; c = ''; }
    else if (ch !== '\r') c += ch; }
  if (c || r.length){ r.push(c); R.push(r); }
  const h = R[0] || [];
  return R.slice(1).filter(x => x.length === h.length)
          .map(x => Object.fromEntries(h.map((k, i) => [k.trim(), x[i]])));
}

function load(name){
  const p = path.join(__dirname, name);
  if (!fs.existsSync(p)) return null;
  return parseCSV(fs.readFileSync(p, 'utf8'));
}

const T = ['A', 'B', 'C', 'D'];   // section labels, so failures are quotable

console.log('\nEXPORT GATE\n');

// ---- A · every table the R3 package needs is present and loads -------------------------------
console.log(T[0] + ' · tables present and parsing');
const need = ['sessions_rows.csv','steeps_rows.csv','teas_rows.csv','vessels_rows.csv',
              'wishlist_rows.csv','user_settings_rows.csv'];
const data = {};
for (const f of need){
  const rows = load(f);
  data[f] = rows;
  ok(rows !== null && rows.length > 0,
     `${f} loads with rows — got ${rows === null ? 'FILE MISSING' : rows.length}`);
}
// A stray suffixed duplicate beside the live set is the exact bug this suite was written for.
const strays = fs.readdirSync(__dirname)
  .filter(f => /_rows.*\.csv$/i.test(f) && /\(\d+\)/.test(f));
ok(strays.length === 0,
   `no suffixed duplicate CSVs beside the live set — found ${strays.length}${strays.length ? ': ' + strays.join(', ') : ''}`);

if (Object.values(data).some(v => v === null)){
  console.log('\n  Cannot continue: a required table is missing. Re-export and re-run.\n');
  process.exit(1);
}

const S = data['sessions_rows.csv'], ST = data['steeps_rows.csv'],
      TE = data['teas_rows.csv'],    V  = data['vessels_rows.csv'],
      W  = data['wishlist_rows.csv'], US = data['user_settings_rows.csv'];

// Owner derived from session ownership, never hardcoded (R69). Needed before the floors: a raw row
// count is the WRONG thing to floor. This gate's first version floored teas at 22 — the unscoped
// count — so scoping the export would have failed the gate on correct data. That is F5 inside the
// tool written to catch F5, caught by running the audit rather than reasoning about it.
const owners = [...new Set(S.map(s => s.user_id).filter(Boolean))];
const OWNER = owners.length ? owners[0] : null;
const owned = R => R.filter(r => !('user_id' in r) || !OWNER || r.user_id === OWNER);
const myTeas = owned(TE), myV = owned(V), myW = owned(W);

// ---- B · floors the stale set cannot clear ---------------------------------------------------
// Floors = the 2026-07-19 authority export. Growth is expected and fine; shrinkage means staleness.
// Floors are on OWNED rows, so they hold whether or not the export happens to carry other accounts.
console.log('\n' + T[1] + ' · not-the-stale-set floors (2026-07-19 authority values, owned rows)');
ok(S.length      >= 31,  `sessions  >= 31 — loaded ${S.length}`);
ok(ST.length     >= 103, `steeps    >= 103 — loaded ${ST.length}`);
ok(myTeas.length >= 21,  `own teas  >= 21 — loaded ${myTeas.length} of ${TE.length} raw rows`);
ok(myV.length    >= 5,   `vessels   >= 5  — loaded ${myV.length}`);
ok(myW.length    >= 1,   `wishlist  >= 1  — loaded ${myW.length}`);
ok(US.length     >= 1,   `user_settings   — loaded ${US.length} (all users, on purpose)`);

const styles = {};
S.forEach(s => { const k = (s.brew_style || '').trim() || '(null)'; styles[k] = (styles[k] || 0) + 1; });
ok('senchado' in styles,
   `brew_style contains 'senchado' (absent from every pre-v3.91 export) — ${JSON.stringify(styles)}`);

// ---- C · referential integrity: the mixed-vintage catcher ------------------------------------
// This is the check that would have caught the 2026-07-26 state. Counts passed; these did not.
console.log('\n' + T[2] + ' · cross-table coherence (all tables from ONE export)');
const vids = new Set(V.map(v => v.id)), sids = new Set(S.map(s => s.id));
const dangV = S.filter(s => s.vessel_id && !vids.has(s.vessel_id));
const dangS = ST.filter(x => x.session_id && !sids.has(x.session_id));
ok(dangV.length === 0,
   `every session's vessel_id resolves in vessels_rows — ${dangV.length} dangling`);
ok(dangS.length === 0,
   `every steep's session_id resolves in sessions_rows — ${dangS.length} dangling`);

const tids = new Set(TE.map(t => t.id));
const dangT = S.filter(s => s.tea_id && !tids.has(s.tea_id));
ok(dangT.length === 0,
   `every session's tea_id resolves in teas_rows — ${dangT.length} dangling`);

// The export is NOT user-scoped: teas_rows carries another account's row, user_settings carries
// every beta user. That is fine and expected — but anything reading these files must scope, the way
// the app does (v3.21). The failure mode is silent: the foreign tea row is vendorless, so an
// unscoped read reports "two teas with no vendor" where the truth is one. Sessions must stay
// single-owner, because every derived figure assumes it.
ok(owners.length === 1,
   `all sessions belong to ONE user_id — found ${owners.length}${owners.length > 1 ? ' (' + owners.map(o => o.slice(0,8)).join(', ') + '): every derived figure would be contaminated' : ''}`);
// R69: the foreign count is PRINTED, not asserted — a foreign row is legitimate in an unscoped
// export. What must not happen is a consumer reading it silently, so it stays visible every run.
const foreignT = TE.length - myTeas.length;
console.log(`  note  owner ${OWNER ? OWNER.slice(0,8) : '?'} · teas ${TE.length} raw / ${myTeas.length} owned ` +
            `(${foreignT} foreign) · consumers MUST scope by user_id (R69)`);
if (foreignT) console.log(`  note  foreign tea name(s): ${TE.filter(t => !myTeas.includes(t)).map(t => JSON.stringify(t.name)).join(', ')}` +
            ` — do NOT exclude these by name: tea-types-test.js does, and a rename would break it`);

// ---- D · facts the R3 rulings rest on --------------------------------------------------------
// R63's scope note was flagged uncheckable when the local vessels file had 3 rows. Pinned here so
// it stays checked rather than re-derived from memory.
console.log('\n' + T[3] + ' · R63 vessel facts');
const noImg = V.filter(v => !(v.image_data && v.image_data.trim()));
ok(noImg.length === 0,
   `every vessel carries image_data (R63: the kanji rung is invisible on current data) — ${noImg.length} without`);
const travel = V.find(v => /travel/i.test(v.name || ''));
ok(travel && travel.type === 'Porcelain teapot',
   `Travel cuppa is typed 'Porcelain teapot' (R63: 旅 was keyed off a name, not a type) — got ${travel ? JSON.stringify(travel.type) : 'row not found'}`);

// ---- what actually loaded --------------------------------------------------------------------
const days = new Set(S.map(s => (s.session_date || '').slice(0, 10)).filter(Boolean));
const sorted = [...days].sort();
console.log('\nLOADED (report, not assertion — compare against the package before citing figures):');
console.log(`  sessions ${S.length} · steeps ${ST.length} · teas ${TE.length} · vessels ${V.length} · wishlist ${W.length}`);
console.log(`  distinct days ${days.size} · range ${sorted[0]} .. ${sorted[sorted.length - 1]}`);
console.log(`  brew_style ${JSON.stringify(styles)} · is_cold_brew ${S.filter(s => ['true','t','TRUE'].includes(s.is_cold_brew)).length}`);
console.log(`  totalGrams ${S.reduce((a, s) => a + (Number(s.grams_used) || 0), 0).toFixed(1)} g`);

console.log(`\n${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
