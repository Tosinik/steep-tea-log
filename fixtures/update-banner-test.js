/* update-banner-test.js — the R158 single-writer + wiring guard for the update-note-display contract.
 *
 * A static SOURCE scan (no vm — this pins the wiring around a service-worker-lifecycle surface the vm
 * cannot exercise; the BEHAVIOUR is the two-deploy on-device smoke in smoke.md). Same shape as
 * landing-test/frame-test: assert the source facts a green suite CAN reach, and let the phone certify
 * the rest. What it locks (#36, R158):
 *   - the note lives in ONE file (steep-version.js), defining BOTH self.APP_VERSION + self.WHATS_NEW;
 *   - service-worker.js REFERENCES it (importScripts) and never DUPLICATES it (no note literal, no
 *     WHATS_NEW assignment) — the single-writer drift-guard;
 *   - the SW answers GET_WHATS_NEW with self.WHATS_NEW + self.APP_VERSION (the waiting worker hands the
 *     banner the INCOMING version's note);
 *   - showUpdateBanner asks for the messaged note and keeps the page-local constant as fallback;
 *   - the register block tracks reg.installing (the no-banner gap);
 *   - steep-core.js no longer defines the two consts (they moved), and index.html loads steep-version.js
 *     before steep-data.js (the earliest reader).
 */
const fs = require('fs'), path = require('path');
const REPO = path.resolve(__dirname, '..');
const read = f => fs.readFileSync(path.join(REPO, f), 'utf8');
const stripBlock = s => s.replace(/\/\*[\s\S]*?\*\//g, ' ');   // block comments only (│ URLs keep their //)

const VERSION = read('steep-version.js');
const SW      = read('service-worker.js');
const SW_CODE = stripBlock(SW);
const BOOT    = read('steep-boot.js');
const CORE    = read('steep-core.js');
const INDEX   = read('index.html');

let passed = 0, failed = 0;
const ok  = (c, m) => { if (c) { passed++; console.log('  ✓ ' + m); } else { failed++; console.log('  ✗ ' + m); } };

console.log('\nA · steep-version.js is the single source');
const mVer  = VERSION.match(/self\.APP_VERSION\s*=\s*['"]([^'"]+)['"]/);
const mNote = VERSION.match(/self\.WHATS_NEW\s*=\s*"([^"]*)"/);
ok(!!mVer,  'steep-version.js defines self.APP_VERSION');
ok(!!mNote, 'steep-version.js defines self.WHATS_NEW');
const NOTE = mNote ? mNote[1] : '__no_note__';

console.log('\nB · the SW references the note, never duplicates it (single-writer)');
ok(/importScripts\(\s*['"]\.\/steep-version\.js['"]\s*\)/.test(SW), "service-worker.js importScripts('./steep-version.js')");
ok(/\.\/steep-version\.js/.test(SW.split('FILES_TO_CACHE')[1] || ''), '…and steep-version.js is in FILES_TO_CACHE (so importScripts finds it)');
ok(!/WHATS_NEW\s*=\s*['"]/.test(SW_CODE), 'the SW never ASSIGNS a WHATS_NEW string literal');   // = only; the ternary read `WHATS_NEW : ''` is not an assignment
ok(NOTE.length > 8 && SW_CODE.indexOf(NOTE) === -1, 'the note VALUE does not appear anywhere in the SW (no duplicated copy)');

console.log('\nC · the SW answers GET_WHATS_NEW with its OWN note+version');
ok(/d\.type\s*===\s*'GET_WHATS_NEW'/.test(SW_CODE), 'service-worker.js handles GET_WHATS_NEW');
const pay = SW_CODE.match(/type:\s*'WHATS_NEW'[\s\S]{0,300}/);   // anchor on the reply payload, not a comment mention
ok(!!pay && /self\.WHATS_NEW/.test(pay[0]),  '…replies with self.WHATS_NEW (the incoming note)');
ok(!!pay && /self\.APP_VERSION/.test(pay[0]), '…and self.APP_VERSION (so the smoke can match the deploy)');

console.log('\nD · the banner asks the incoming worker, and falls back to the local constant');
ok(/GET_WHATS_NEW/.test(BOOT), 'showUpdateBanner requests GET_WHATS_NEW from the worker');
ok(/typeof WHATS_NEW==='string'/.test(BOOT) || /WHATS_NEW\b/.test(BOOT), '…and reads the page-local WHATS_NEW as the fallback');
ok(/updateNote/.test(BOOT), '…rendered into an id=updateNote sub-line it can swap');

console.log('\nE · the no-banner gap is closed (installing + waiting + updatefound)');
ok(/watchWorker\(\s*reg\.installing\s*\)/.test(BOOT), 'the register block tracks reg.installing (the missed mid-install case)');
ok(/reg\.waiting\s*&&\s*navigator\.serviceWorker\.controller/.test(BOOT), '…still handles reg.waiting (waiting-before-load)');
ok(/updatefound/.test(BOOT), '…and updatefound (found-later)');

console.log('\nF · the move is clean (one source, ordered before its readers)');
ok(!/\bconst\s+APP_VERSION\s*=/.test(CORE) && !/\bconst\s+WHATS_NEW\s*=/.test(CORE), 'steep-core.js no longer defines the two consts (moved, not duplicated)');
const iVer = INDEX.indexOf('steep-version.js'), iData = INDEX.indexOf('steep-data.js');
ok(iVer !== -1 && iData !== -1 && iVer < iData, 'index.html loads steep-version.js before steep-data.js (the earliest reader)');

console.log('');
if (failed) { console.log('UPDATE-BANNER TESTS FAILED — ' + failed + ' failed, ' + passed + ' passed'); process.exit(1); }
console.log('ALL UPDATE-BANNER TESTS PASSED (' + passed + ' passed)');
