/* tea-polish-test.js — R180 (v4.39): wave-1 #2.5 tea-page + calm-copy polish + material suggester.
 * Arm A (vm): infoMark output + escaping; distinctMaterials logic; the material suggester round-trip.
 * Arm B (source scan): the info-popover component wiring a vm can't drive (dismiss / viewport-flip /
 *   reduced-motion), the i-info-hl sprite, the tea-page always-on captions moved behind infoMark, the D3
 *   rewrites present with NO em-dash (U+2014) in the named notes and hints, the material vendor-treatment.
 * The popover ACTUALLY opening and positioning on a phone is the on-device gate (smoke.md §v4.39) — a vm
 * has no layout and no keyboard, so a green here is necessary, not sufficient. D1 rhythm is fence-covered
 * (frame-test stays 46) and read on device.
 */
const fs=require('fs'),path=require('path'),vm=require('vm');
const REPO=path.resolve(__dirname,'..');
const SRC=['steep-knowledge.js','steep-core.js','steep-teas.js']
  .map(f=>fs.readFileSync(path.join(REPO,f),'utf8')).join('\n;\n');
const ctx={};ctx.window=ctx;ctx.globalThis=ctx;ctx.console=console;
const fakeEls={};
ctx.document={documentElement:{setAttribute(){},getAttribute(){return'light'}},
  getElementById:id=>fakeEls[id]||null,querySelector:()=>null,querySelectorAll:()=>[],
  createElement:()=>({style:{},setAttribute(){},appendChild(){},classList:{add(){}}})};
ctx.localStorage={getItem:()=>null,setItem(){},removeItem(){}};
ctx.matchMedia=()=>({matches:false});ctx.navigator={onLine:true};
ctx.setTimeout=()=>{};ctx.clearTimeout=()=>{};ctx.setInterval=()=>{};ctx.clearInterval=()=>{};
ctx.addEventListener=()=>{};ctx.visualViewport=null;
vm.createContext(ctx);vm.runInContext(SRC,ctx);
vm.runInContext('state.settings=Object.assign({},DEFAULT_SETTINGS);',ctx);

let passed=0,failures=0;
function ok(c,name){ if(c){passed++;console.log('  ✓ '+name);} else {failures++;console.log('  ✗ '+name);} }
const run=s=>vm.runInContext(s,ctx);
const EMD='—';
function lineWith(src,needle){ const i=src.indexOf(needle); if(i<0) return null; const s=src.lastIndexOf('\n',i)+1; let e=src.indexOf('\n',i); if(e<0)e=src.length; return src.slice(s,e); }

/* ---------- A · infoMark output + escaping (vm) ---------- */
console.log('\nA · infoMark (the D2 declaration surface)');
const im=run('infoMark("This photo is the label.","About the photo")');
ok(/class="info-wrap"/.test(im)&&/class="info-mark"/.test(im),'A1 renders the .info-wrap / .info-mark affordance');
ok(/aria-label="About the photo"/.test(im)&&/aria-expanded="false"/.test(im),'A2 a real button with aria-label + aria-expanded');
ok(/data-info="This photo is the label\."/.test(im)&&/onclick="toggleInfoPop\(this\)"/.test(im),'A3 text rides data-info; tap calls toggleInfoPop');
ok(/href="#i-info-hl"/.test(im),'A4 the mark is the SVG sprite glyph, not a literal character');
const imX=run('infoMark("x <i> & y","lab <b>")');
ok(imX.indexOf('<i>')<0&&imX.indexOf('&lt;i&gt;')>=0&&imX.indexOf('&amp;')>=0,'A5 explainer text HTML-escaped in data-info (no injection)');
ok(imX.indexOf('aria-label="lab &lt;b&gt;"')>=0,'A6 the aria-label is escaped too');

/* ---------- B · distinctMaterials + material suggester (vm) ---------- */
console.log('\nB · material suggester (D4)');
run("state.vessels=[{material:'Porcelain'},{material:'  Porcelain '},{material:'Yixing clay'},{material:''},{material:null},{material:'Glass'}]");
ok(JSON.stringify(run('distinctMaterials()'))===JSON.stringify(['Glass','Porcelain','Yixing clay']),'B1 distinctMaterials: trimmed, deduped, blanks dropped, sorted');
fakeEls['materialSuggest']={innerHTML:''};
run("renderMaterialSuggest('cla','materialInput','materialSuggest')");
const mh=fakeEls['materialSuggest'].innerHTML;
ok(/class="tag-suggest"/.test(mh)&&/pickFieldSuggest\(/.test(mh)&&mh.indexOf('Yixing clay')>=0,'B2 renderMaterialSuggest reuses the shared popover + the generic pickFieldSuggest');
fakeEls['materialInput']={value:''};
fakeEls['materialSuggest']={innerHTML:'stale'};
run("pickFieldSuggest('Yixing clay','materialInput','materialSuggest')");
ok(fakeEls['materialInput'].value==='Yixing clay'&&fakeEls['materialSuggest'].innerHTML==='','B3 pickFieldSuggest writes the material into the input and clears the box (round-trip)');

/* ---------- C · component + copy wiring (source scan) ---------- */
console.log('\nC · component, sprite, captions, copy (source scan)');
const idx=fs.readFileSync(path.join(REPO,'index.html'),'utf8');
const core=fs.readFileSync(path.join(REPO,'steep-core.js'),'utf8');
const teas=fs.readFileSync(path.join(REPO,'steep-teas.js'),'utf8');
const sess=fs.readFileSync(path.join(REPO,'steep-sessions.js'),'utf8');
const css=fs.readFileSync(path.join(REPO,'styles.css'),'utf8');

// D2 component
ok(/<symbol id="i-info-hl"/.test(idx),'C1 i-info-hl sprite glyph present in index.html');
ok(/function infoMark\(/.test(core)&&/function toggleInfoPop\(/.test(core)&&/function closeInfoPop\(/.test(core),'C2 the component lives in steep-core.js');
ok(/\.textContent\s*=\s*btn\.dataset\.info/.test(core),'C3 popover text set via textContent (safe boundary, no re-injection)');
ok(/'pointerdown'/.test(core)&&/Escape/.test(core)&&/closest\('\.info-wrap'\)/.test(core),'C4 dismiss: outside pointerdown + Escape (four-way with re-tap + render)');
ok(/window\.visualViewport/.test(core)&&/getBoundingClientRect/.test(core)&&/info-pop-above/.test(core)&&/info-pop-right/.test(core),'C5 viewport-safe: measures + flips above/right (the #2 lesson)');
ok(/\.info-pop\b/.test(css)&&/prefers-reduced-motion/.test(css),'C6 .info-pop styled + reduced-motion aware');

// D2 — the tea-page always-on captions moved BEHIND the mark
ok((teas.match(/infoMark\(/g)||[]).length>=3,'C7 infoMark used on the tea page (photo + saved-brew + suggested-brew)');
ok(!/The photo is the label/.test(teas)&&!/Steep times come from the leaf type/.test(teas),'C8 the old always-on captions are deleted, not just hidden');
ok(/infoMark\("This photo is the tea's label/.test(teas),'C9 the photo note is now an infoMark argument (behind the mark)');
ok(/infoMark\(note,/.test(teas)&&/infoMark\(suggestNote,/.test(teas),'C10 both brew notes are infoMark arguments');

// D3 — rewrites present, plain
ok(/This photo is the tea's label, not the tea itself\. It shows where the tea came from\./.test(teas),'C11 photo note rewritten plain');
ok(/These steep times come from the leaf type\. The session timer uses them\./.test(teas),'C12 generated brew note rewritten plain');
ok(/not a saved guide\. The session timer uses these times until you save your own\./.test(teas),'C13 suggested-brew note rewritten plain');
ok(/· for spend tracking\./.test(teas)&&/· when you broke the seal\./.test(teas),'C14 tea-form hints use the middot separator, not an em-dash lead-in');

// D3 — NO em-dash (U+2014) on any of the named rewritten lines
const named=['This photo is the tea','These steep times come from','Parsed from your brew guide','A starting point from','for spend tracking','when you broke the seal','shapes the suggested steep'];
let emdClean=true, emdWhere='';
named.forEach(n=>{ const ln=lineWith(teas,n); if(ln==null){ emdClean=false; emdWhere='(missing: '+n+')'; } else if(ln.indexOf(EMD)>=0){ emdClean=false; emdWhere=n; } });
ok(emdClean,'C15 no em-dash (U+2014) on any named tea-page note/hint line '+emdWhere);

// D4 — material field vendor treatment + the rename
const matLine=lineWith(sess,'id="materialInput"');   // the input line, not the R180 comment that also names the field
ok(matLine!=null&&/name="material"/.test(matLine)&&/autocomplete="off"/.test(matLine)&&/renderMaterialSuggest\(this\.value,'materialInput','materialSuggest'\)/.test(matLine),'C16 material input: name kept, autocomplete off, wired to the suggester');
ok(/id="materialSuggest"/.test(sess),'C17 the material suggestion box is present');
ok(/function pickFieldSuggest\(/.test(teas)&&!/function pickVendorSuggest\(/.test(teas),'C18 pickVendorSuggest renamed to the generic pickFieldSuggest (single writer, two callers)');

if(failures){ console.log('\n'+failures+' TEA-POLISH TEST(S) FAILED'); process.exit(1); }
console.log('\nALL TEA-POLISH TESTS PASSED  ('+passed+' passed)');
