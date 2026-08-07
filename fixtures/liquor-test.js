/* PERMANENT validation — the liquor swatch data model (committed; every deploy).
 *
 * WHY THIS SUITE EXISTS AT ALL, and it is not "because there is new data". Contract 1 is the only
 * one of the five visual contracts that was unbuilt WITHOUT causing damage, and R116 found the
 * reason: its absence was written down in two files and asserted in two suites, so no lane ever
 * reasoned from a swatch that wasn't there. The other four were believed built and two rulings were
 * made against phantom state. This suite is that pattern applied deliberately — it asserts what the
 * model does AND pins what it deliberately does not do yet.
 *
 * THE MOST IMPORTANT CHECK HERE IS §B, and it is a check that something stays ABSENT. Eleven catalog
 * rows carry no liquor on purpose: ten resolve to `roast: variable` and sheng pu-erh varies by age
 * more than any of them. Under R55's precedent — suppress rather than assert a value that varies —
 * that is the correct answer, not a gap. Without this, a later pass "completes" the table and asserts
 * a colour for a style that genuinely varies.
 *
 * Run: node fixtures/liquor-test.js   (exit non-zero on any failure)
 * Run fixtures/export-gate-test.js FIRST.
 */
const fs=require('fs'), path=require('path'), vm=require('vm');
const repo=path.join(__dirname,'..');
const FILES=['steep-knowledge.js','steep-tea-types.js','steep-core.js'];
const SRC=FILES.map(f=>fs.readFileSync(path.join(repo,f),'utf8')).join('\n;\n');
const ctx={};ctx.window=ctx;ctx.globalThis=ctx;ctx.console=console;
ctx.document={documentElement:{setAttribute(){},getAttribute(){return'light'}},
  getElementById:()=>null,querySelectorAll:()=>[],querySelector:()=>null,addEventListener(){},
  createElement:()=>({style:{},setAttribute(){},appendChild(){},classList:{add(){},remove(){}}})};
ctx.localStorage={getItem:()=>null,setItem(){},removeItem(){}};
ctx.matchMedia=()=>({matches:false});ctx.navigator={onLine:true};
ctx.setTimeout=()=>{};ctx.clearTimeout=()=>{};ctx.setInterval=()=>{};ctx.clearInterval=()=>{};
ctx.addEventListener=()=>{};ctx.SteepDB={newId:()=>'x',getUser:()=>({id:'u'})};
vm.createContext(ctx);vm.runInContext(SRC,ctx);
const G=e=>vm.runInContext(e,ctx);

let passed=0, failures=0;
const ok=(c,m)=>{ if(c){passed++;} else {failures++; console.log('  FAIL: '+m);} };
// Comment-stripped for every absence check — the rule that took two deploys and six instances to
// generalise. An absence check must never read prose, not the code's and not its own.
const strip=s=>s.replace(/\/\*[\s\S]*?\*\//g,' ');
const cssSrc=strip(fs.readFileSync(path.join(repo,'styles.css'),'utf8'));
/* Twelve stops since A5. `ivory` and `yellow-pale` are inserted at the PALE end — above `gold-pale`
   in lightness, below it in the ramp's reading order — so the brown arm gains two members and the
   green arm (jade-pale, straw) is unchanged. */
const RAMP=['jade-pale','straw','ivory','yellow-pale','gold-pale','gold','amber','amber-deep','copper','mahogany','sepia','near-black'];
/* TWO SEPARATION FLOORS, and they are the whole of what this ramp has to guarantee.
   `SEP_MIN` — every adjacent pair, in EVERY theme. Taken from the light column's own spacing, whose
   tightest gap is 9.2 (yellow-pale ↔ gold-pale); 9 is that floor, not a number chosen to pass.
   `GROUND_MIN` — every stop against the card it sits on. This one is a COLLAPSE detector and says
   so: it catches a swatch becoming invisible against its surface, and it does not prove any pair is
   comfortable. The tightest real value is `ivory` at 19.2 from `--white` in the light theme, and
   nobody has looked at it rendered — flagged rather than certified. */
const SEP_MIN=9;
const GROUND_MIN=18;
const NULLS=['dong-ding-oolong','phoenix-dancong','mi-lan-xiang','ya-shi-xiang','huang-zhi-xiang',
  'zhi-lan-xiang','xing-ren-xiang','phoenix-shui-xian','anxi-tie-guan-yin','huang-jin-gui','sheng-puerh'];

console.log('LIQUOR SWATCH — the data model (SPEC-liquor-swatch-model.md)');
const rows=G('TEA_TYPES');

/* ---- A · the ramp is ten stops, in both themes, keys not hexes ---- */
const light=cssSrc.slice(cssSrc.indexOf(':root{'), cssSrc.indexOf('html[data-theme="dark"]{'));
const dark=cssSrc.slice(cssSrc.indexOf('html[data-theme="dark"]{'));
const hexOf=(blk,k)=>(blk.match(new RegExp('--liquor-'+k+':(#[0-9A-Fa-f]{6})'))||[])[1];
ok(RAMP.every(k=>hexOf(light,k)), 'A1 all ten stops are declared in the light theme');
ok(RAMP.every(k=>hexOf(dark,k)), 'A2 …and all ten in the dark theme, so no stop falls back to a light hex on a dark ground');
/* Lifted, NOT inverted — the rule the whole ramp turns on. A swatch is the colour of tea in a cup,
   so an inverted ramp renders pu-erh pale, and a pale pu-erh identifies a different tea. */
const lum=h=>{const n=parseInt(h.slice(1),16);return 0.2126*((n>>16)&255)+0.7152*((n>>8)&255)+0.0722*(n&255);};
/* A3 ASSERTS THE PROPERTY, NOT THE PROXY, and the difference was found the hard way.
   The rule was written as "every dark stop is lifted", reasoned from the dark end: a pale pu-erh
   identifies a different tea. Then A5's two stops moved DOWN in dark while `gold-pale` was lifted UP
   — each defensible alone — and closed the gap between them to 1.9 luminance, one fifth of their
   light spacing. On a dark card Niklas's Huang Ya and his Fujian White would have been the same
   swatch: the exact collision A5 was written to remove, reintroduced by the theme, while a
   named-exemption check reported green.
   What lifting was protecting is that ADJACENT STOPS STAY TELLABLE APART IN EVERY THEME. That is
   assertable directly, so it is. A stop that does not lift now passes as long as it stays separated;
   one that lifts too far reddens for the right reason; and there is no exemption list to maintain. */
[['light',light],['dark',dark]].forEach(([name,blk])=>{
  const tight=[];
  for(let i=1;i<RAMP.length;i++){
    const d=Math.abs(lum(hexOf(blk,RAMP[i]))-lum(hexOf(blk,RAMP[i-1])));
    if(d<SEP_MIN) tight.push(RAMP[i-1]+'↔'+RAMP[i]+' '+d.toFixed(1));
  }
  ok(!tight.length, 'A3 every adjacent pair stays ≥'+SEP_MIN+' luminance apart in '+name
     +' — two swatches a human cannot tell apart are one swatch ('+(tight.join(', ')||'all clear')+')');
});
/* The other half of "can a human tell these apart": separation from the SURFACE, not the neighbour.
   Same class of failure, and it was equally unasserted — found by measuring `ivory` against the card
   it will sit on once the cascade lands, rather than by discovering it then. */
[['light',light,'#FFFEFB'],['dark',dark,'#1C1A14']].forEach(([name,blk,card])=>{
  const faint=RAMP.filter(k=>Math.abs(lum(hexOf(blk,k))-lum(card))<GROUND_MIN);
  ok(!faint.length, 'A3b every stop stays ≥'+GROUND_MIN+' from the card it sits on in '+name
     +' — a swatch that vanishes into its surface identifies nothing ('+(faint.join(', ')||'all clear')+')');
});
/* Asserted on the BROWN ARM only, and deliberately so: §2 gives the ramp a green arm (jade-pale,
   straw) beside the brown one, so a monotonicity check over all ten fails for the right reason.
   Testing the wrong property would have made this check either wrong or vacuous. */
const BROWN=RAMP.slice(2);
[['light',light],['dark',dark]].forEach(([n,blk])=>{
  const l=BROWN.map(k=>lum(hexOf(blk,k)));
  ok(l.every((v,i)=>i===0||v<l[i-1]), 'A4 the brown arm darkens strictly in '+n+' — the ramp\'s ORDER survives the theme');
});
ok(!/--liquor-[a-z-]+:\s*var\(/.test(cssSrc), 'A5 each stop is its own value, not an alias of another token');
console.log('  A the ramp: 6 checks');

/* ---- B · the eleven deliberate nulls. THE ASSERTION THIS SLICE EXISTS FOR ---- */
ok(rows.length===55, 'B1 the catalog is 55 rows (got '+rows.length+')');
NULLS.forEach(s=>ok(rows.some(r=>r.slug===s),
  'B2 every null-list slug resolves to a real row — `'+s+'`'));
/* The spec wrote `dong-ding`; the row is `dong-ding-oolong`. Left as written, the assignment would
   have no-opped and this list would have been guarding a slug that does not exist — a check that
   cannot fail. B2 is the general fix for that whole class. */
const nulled=rows.filter(r=>r.liquor===undefined).map(r=>r.slug).sort();
ok(nulled.length===11 && NULLS.slice().sort().every((s,i)=>nulled[i]===s),
   'B3 exactly the eleven deliberate rows carry NO liquor — never guess a colour for a style that varies (got '+nulled.length+': '+nulled.join(', ')+')');
/* Resolved, not raw (spec A3): seven Dancong members and huang-jin-gui carry no own `roast` and
   inherit it through TT_INHERIT. On raw rows only three read `roast: variable`; on resolved rows
   ten do. An assertion against raw rows would pass for the wrong reason. */
const variable=rows.filter(r=>G('resolveTeaType("'+r.slug+'")').roast==='variable').map(r=>r.slug);
ok(variable.length===10, 'B4 ten rows resolve to `roast: variable` — asserted on RESOLVED rows, since eight of them inherit `roast` (got '+variable.length+')');
ok(variable.every(s=>NULLS.includes(s)),
   'B5 …and every one of them is null: rule 2 says the style genuinely varies by maker, so it gets no colour');
ok(rows.find(r=>r.slug==='sheng-puerh').liquor===undefined && rows.find(r=>r.slug==='shou-puerh').liquor==='near-black',
   'B6 sheng and shou pu-erh differ — the most visually different pair in the catalog, and `family: dark` must be per-slug because oxidation 0-100 is a null signal');
console.log('  B the deliberate nulls: '+(4+NULLS.length)+' checks');

/* ---- C · the 44 assignments, and the ramp fully occupied ---- */
const assigned=rows.filter(r=>r.liquor!==undefined);
ok(assigned.length===44, 'C1 forty-four rows carry a liquor (got '+assigned.length+')');
const bad=assigned.filter(r=>!RAMP.includes(r.liquor));
ok(!bad.length, 'C2 every assigned value is a ramp KEY, never a hex — so the ramp can be retuned without rewriting user data ('+(bad.map(r=>r.slug+'='+r.liquor).join(', ')||'all valid')+')');
const occupied=RAMP.filter(k=>assigned.some(r=>r.liquor===k));
ok(occupied.length===RAMP.length,
   'C3 every stop on the ramp is occupied — there is no headroom stop (A1: `amber` holds gui-fei-oolong; A5 added two more, both occupied). A future gap is a deliberate ramp EXTENSION, never an empty slot waiting (got '+occupied.length+' of '+RAMP.length+')');
ok(rows.find(r=>r.slug==='gui-fei-oolong').liquor==='amber',
   'C4 gui-fei-oolong is `amber` — the row §8 omitted, on Niklas\'s shelf, ruled from the anchor rather than left to preserve a headroom claim');
ok(rows.find(r=>r.slug==='hojicha').liquor==='copper',
   'C5 hojicha is `copper`, not jade — a roasted green pours reddish-brown, and the family override fires before roast can correct it');
ok(rows.find(r=>r.slug==='lapsang-souchong').liquor==='mahogany',
   'C6 lapsang-souchong needs no smoke exception — the catalog distinguishes modern unsmoked Zheng Shan Xiao Zhong, so mahogany with keemun is right');
/* A5's two per-slug exceptions. Both exist because the fact that separates them is NOT A FIELD:
   bud-only vs buds-and-leaf is recorded nowhere (all seven whites read ox 0-15 with one inherited
   signature), and men huang is a process step the catalog does not carry — which is why huang-ya
   reads ox 0-0, roast:none, numerically identical to an unroasted green. Third instance of the
   pattern after hojicha's roast and pu-erh's family. */
ok(['ya-bao-yunnan','bai-hao-yin-zhen'].every(s=>rows.find(r=>r.slug===s).liquor==='ivory'),
   'C7 the two bud-only whites are `ivory` — a per-slug exception, because buds-vs-buds-and-leaf is not a catalog field');
ok(rows.find(r=>r.slug==='huang-ya').liquor==='yellow-pale',
   'C8 the catalog\'s one yellow row is `yellow-pale` — men huang is not a field either');
ok(lum(hexOf(light,'yellow-pale'))>lum(hexOf(light,'gold-pale')),
   'C9 yellow-pale sits ABOVE gold-pale, which is OBSERVATION AGAINST THE RULE: men huang predicted deeper, Niklas tasted paler, and the taste wins — do not "correct" this back to the reasoning');
ok(rows.find(r=>r.slug==='ruan-zhi-oolong').liquor==='gold-pale',
   'C10 A6: Ruby Ruanzhi has NOT moved. A tea that disagrees with its style is tier 1; a style that disagrees with itself is a catalog defect — and darkening the row would make every pale Ruan Zhi wrong to fix one jar');
console.log('  C the assignments: 10 checks');

/* ---- D · the fence: what this slice deliberately does NOT do (R116's pattern) ---- */
const dataSrc=fs.readFileSync(path.join(repo,'steep-data.js'),'utf8');
ok(!/liquor/.test(dataSrc),
   'D1 no `teas.liquor` column yet — the migration and the read-time cascade are the NEXT slice, so every tea resolves at tier 2 or tier 3');
ok(G('TT_INHERIT').indexOf('liquor')===-1,
   'D2 `liquor` is NOT inherited: §8 authors every member explicitly, so inheritance is unused today and its only future effect is a new member silently inheriting a colour nobody authored (R121)');
ok(!/var\(--liquor-/.test(strip(fs.readFileSync(path.join(repo,'steep-teas.js'),'utf8'))+strip(fs.readFileSync(path.join(repo,'steep-dashboard.js'),'utf8'))),
   'D3 nothing RENDERS a liquor yet — the shelf still draws the type tint, which is tier 3 and an honest answer, not a gap');
const spec=fs.readFileSync(path.join(repo,'docs/r4/planning/SPEC-liquor-swatch-model.md'),'utf8');
ok(/These hex values are a first pass by a lane that has not drunk these teas/.test(spec),
   'D4 the spec still says the hexes are unverified by anyone who has tasted these teas — two groupings want a human check');
ok(/derived, not locked/.test(spec), 'D5 …and that the small 15x20 geometry is derived, not locked (R121)');
console.log('  D the fence: 5 checks');

console.log('');
if(failures){ console.log('FAILED: '+failures+' of '+(passed+failures)); process.exit(1); }
console.log('ALL LIQUOR TESTS PASSED ('+passed+' passed)');
