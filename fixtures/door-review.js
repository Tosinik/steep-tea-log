/* local-only: extract the door's markup from steep-data.js and render it with the app's real CSS,
   one file per theme (the dark tokens live on html[data-theme="dark"], so a wrapper div won't do).
   The anchor throws on a miss — a review page built from a silently-empty match would show a blank
   screen and read as "the door is broken" rather than "the extractor is". */
const fs = require('fs'), path = require('path');
const repo = path.resolve(__dirname, '..');
const data = fs.readFileSync(path.join(repo, 'steep-data.js'), 'utf8');
const css  = fs.readFileSync(path.join(repo, 'styles.css'), 'utf8');
const idx  = fs.readFileSync(path.join(repo, 'index.html'), 'utf8');

const sprite = idx.slice(idx.indexOf('<svg'), idx.indexOf('</defs></svg>') + 13);
if (!/id="enso"/.test(sprite)) throw new Error('sprite slice lost the ensō symbol');

const m = data.match(/app\.innerHTML = `(<div class="door">[\s\S]*?)`;/);
if (!m) throw new Error('door markup not found — the anchor in steep-data.js changed');

const door = m[1]
  .replace(/\$\{ver\}/g, 'v4.09')
  .replace(/\$\{ensoMark\((\d+)\)\}/g, (s, px) =>
    '<div class="door-enso"><svg viewBox="0 0 120 120" width="' + px + '" height="' + px + '"><use href="#enso"/></svg></div>');
if (/\$\{/.test(door)) throw new Error('unresolved template hole left in the extracted door');

['light', 'dark'].forEach(theme => {
  const page = '<!DOCTYPE html><html data-theme="' + theme + '"><head><meta charset="utf-8">'
    + '<style>' + css + '\nbody{margin:0;background:var(--porcelain);}</style></head>'
    + '<body>' + sprite + door + '</body></html>';
  fs.writeFileSync(path.join(repo, 'fixtures', 'door-review-' + theme + '.html'), page);
});
/* The board is only valid at ONE height, so review it at four. Each frame is an IFRAME, not a
   fixed-height div: `100dvh` resolves against a real viewport, and an iframe has one while a div
   does not — a div would have silently reviewed the same layout four times. */
const HEIGHTS = [667, 812, 932, 1280];
fs.writeFileSync(path.join(repo, 'fixtures', 'door-heights.html'),
  '<!DOCTYPE html><html><head><meta charset="utf-8"><style>'
  + 'body{margin:0;padding:16px;background:#8d8d8d;font:12px ui-monospace,monospace;'
  + 'display:flex;gap:16px;align-items:flex-start;}'
  + 'figure{margin:0;color:#fff;}iframe{width:390px;border:1px solid #555;background:#fff;display:block;}'
  + '</style></head><body>'
  + HEIGHTS.map(h => '<figure><figcaption>390 &times; ' + h + '</figcaption>'
      + '<iframe src="door-review-light.html" height="' + h + '" scrolling="no"></iframe></figure>').join('')
  + '</body></html>');
console.log('wrote fixtures/door-review-{light,dark}.html + door-heights.html (' + HEIGHTS.join(', ') + ')');
