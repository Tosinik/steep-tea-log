/* vendor-keyboard-test.js — R179 (v4.38): the vendor inline suggester + the systemic keyboard-reveal
 * wiring. Two arms, because half of this bug lives where a vm can't reach:
 *   A. LOGIC (vm sandbox) — the suggester VALUE ROUND-TRIP: distinctVendors() feeds renderVendorSuggest,
 *      which renders the shared .tag-suggest popover (mousedown+preventDefault, HTML/JS-escaped, capped
 *      at 6), and pickFieldSuggest writes the chosen value back into the input and clears the box.
 *   B. WIRING (source scan) — the parts a vm CANNOT exercise (no keyboard, no visualViewport, no layout):
 *      both native <datalist>s are gone, the vendor input still carries name="source" (the save contract
 *      submitTeaForm reads), and the keyboard-reveal mechanism is present, feature-detected, installed
 *      once, occlusion-gated, and honours reduced-motion.
 * The keyboard ACTUALLY clearing the field on a phone is the on-device gate (smoke.md §v4.38) — a vm has
 * no soft keyboard and no visual viewport, so a green here is necessary, not sufficient.
 */
const fs=require('fs'),path=require('path'),vm=require('vm');
const REPO=path.resolve(__dirname,'..');
const SRC=['steep-knowledge.js','steep-core.js','steep-teas.js']
  .map(f=>fs.readFileSync(path.join(REPO,f),'utf8')).join('\n;\n');
const ctx={};ctx.window=ctx;ctx.globalThis=ctx;ctx.console=console;
const fakeEls={};
ctx.document={documentElement:{setAttribute(){},getAttribute(){return'light'}},
  getElementById:id=>fakeEls[id]||null,querySelectorAll:()=>[],
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

/* ---------- A · the suggester logic (vm) ---------- */
console.log('\nA · vendor suggester — value round-trip');
// Synthetic shelf: this is pure string mechanism over state.teas, so real CSV grounding adds nothing —
// distinctVendors() is a trim/unique/sort, exercised here with a case-clean set + a trim-dedup + blanks.
run("state.teas=[{source:'Paper & Tea'},{source:'  Paper & Tea  '},{source:'Hojo'},{source:'Yunomi'},{source:''},{source:null},{source:'Chado'},{source:'Ippodo'},{source:'Marukyu'},{source:'Postcard Teas'}];");
const vendors=run('distinctVendors()');
ok(JSON.stringify(vendors)===JSON.stringify(['Chado','Hojo','Ippodo','Marukyu','Paper & Tea','Postcard Teas','Yunomi']),
  'A1 distinctVendors: trimmed, blanks/null dropped, deduped, sorted');

fakeEls['teaVendorSuggest']={innerHTML:''};
run("renderVendorSuggest('pa','teaVendorInput','teaVendorSuggest')");
const html=fakeEls['teaVendorSuggest'].innerHTML;
ok(/class="tag-suggest"/.test(html),'A2 renders the shared .tag-suggest popover (no forked class)');
ok(/onmousedown="event\.preventDefault\(\);pickFieldSuggest\(/.test(html)&&html.indexOf('onclick=')<0,
  'A3 picks bind mousedown+preventDefault, never onclick (#29 blur-safe)');
ok(html.indexOf('Paper &amp; Tea')>=0,'A4 the visible label is HTML-escaped');
ok((html.match(/onmousedown=/g)||[]).length===1,'A5 substring filter keeps only the matching vendor');

fakeEls['teaVendorSuggest']={innerHTML:''};
run("state.teas=['aa1','aa2','aa3','aa4','aa5','aa6','aa7','aa8'].map(s=>({source:s}))");
run("renderVendorSuggest('aa','teaVendorInput','teaVendorSuggest')");
ok((fakeEls['teaVendorSuggest'].innerHTML.match(/onmousedown=/g)||[]).length===6,'A6 caps at 6 suggestions');

run("renderVendorSuggest('','teaVendorInput','teaVendorSuggest')");
ok(fakeEls['teaVendorSuggest'].innerHTML==='','A7 empty query clears the box');
run("renderVendorSuggest('zzz','teaVendorInput','teaVendorSuggest')");
ok(fakeEls['teaVendorSuggest'].innerHTML==='','A8 no matches → empty box (no stray popover)');

fakeEls['teaVendorInput']={value:''};
fakeEls['teaVendorSuggest']={innerHTML:'stale'};
run("pickFieldSuggest('Paper & Tea','teaVendorInput','teaVendorSuggest')");
ok(fakeEls['teaVendorInput'].value==='Paper & Tea','A9 pick writes the chosen value into the input (round-trip)');
ok(fakeEls['teaVendorSuggest'].innerHTML==='','A10 pick clears the suggestion box');

fakeEls['teaVendorSuggest']={innerHTML:''};
run("state.teas=[{source:\"O'Brien <b>&\"}]");
run("renderVendorSuggest('brien','teaVendorInput','teaVendorSuggest')");
const esc=fakeEls['teaVendorSuggest'].innerHTML;
ok(esc.indexOf('<b>')<0 && esc.indexOf('&lt;b&gt;')>=0,'A11 markup in a vendor name is HTML-escaped (no injection)');
ok(esc.indexOf('\\&#39;')>=0,'A12 the pick arg is JS-escaped (escapeJsArg: quote → \\\' → \\&#39;)');

/* ---------- B · wiring present (source scan — the vm can't drive a keyboard) ---------- */
console.log('\nB · wiring present (source scan)');
const teasSrc=fs.readFileSync(path.join(REPO,'steep-teas.js'),'utf8');
const shopSrc=fs.readFileSync(path.join(REPO,'steep-shopping.js'),'utf8');
const coreSrc=fs.readFileSync(path.join(REPO,'steep-core.js'),'utf8');
const sessSrc=fs.readFileSync(path.join(REPO,'steep-sessions.js'),'utf8');

// the FUNCTIONAL markers only the native binding produced (the word "datalist" also survives in the
// R179 comments explaining the retirement, so match the input list= binding + the element-with-id).
ok(!/list="vendorList"/.test(teasSrc)&&!/<datalist id=/.test(teasSrc)&&!/list="wishVendorList"/.test(shopSrc)&&!/<datalist id=/.test(shopSrc),
  'B1 both native <datalist>s retired (tea form + wishlist)');
ok(/name="source"/.test(teasSrc)&&/renderVendorSuggest\(this\.value,'teaVendorInput','teaVendorSuggest'\)/.test(teasSrc),
  'B2 vendor input keeps name="source" (save contract) AND is wired to the suggester');
ok(/id="teaVendorSuggest"/.test(teasSrc),'B3 the tea-form suggestion box is present');
ok(/id="wishVendor"/.test(shopSrc)&&/renderVendorSuggest\(this\.value,'wishVendor','wishVendorSuggest'\)/.test(shopSrc)&&/id="wishVendorSuggest"/.test(shopSrc),
  'B4 the wishlist vendor is wired to the suggester with its own box');
ok(/function renderFieldSuggest\(/.test(coreSrc)&&/renderFieldSuggest\('tagSuggestBox'/.test(sessSrc),
  'B5 renderTagSuggest delegates to the shared renderFieldSuggest (single writer)');

ok(/function installKeyboardReveal\(/.test(coreSrc),'B6 installKeyboardReveal is defined');
ok(/if\(_kbdRevealInstalled\)\s*return;/.test(coreSrc),'B7 install-once guard (mirrors installResumeSync)');
ok(/\n\s*installKeyboardReveal\(\);/.test(coreSrc),'B8 …and it is called from init()');
ok(/window\.visualViewport/.test(coreSrc)&&/if\(!vv\)\s*return;/.test(coreSrc),'B9 visualViewport feature-detected (no-op without it)');
ok(/vv\.addEventListener\('resize'/.test(coreSrc)&&/'focusin'/.test(coreSrc)&&!/vv\.addEventListener\('scroll'/.test(coreSrc),
  'B10 listens to visualViewport resize + a delegated focusin — and NOT scroll (never fights a user scroll)');
ok(/prefers-reduced-motion/.test(coreSrc),'B11 reduced-motion honoured (instant scroll under it)');
ok(/scrollIntoView/.test(coreSrc)&&/r\.bottom > bottom/.test(coreSrc),'B12 scrolls only when the field is occluded (no jank on visible fields)');

if(failures){ console.log('\n'+failures+' VENDOR-KEYBOARD TEST(S) FAILED'); process.exit(1); }
console.log('\nALL VENDOR-KEYBOARD TESTS PASSED  ('+passed+' passed)');
