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
/* §F renders three real slots, so the sandbox loads the modules that own them — `swatchAttr` lives
   in steep-teas.js and `socialTileHTML` in steep-social.js. A source-only check would have proved
   the call sites exist and nothing about what they emit. */
const FILES=['steep-knowledge.js','steep-tea-types.js','steep-core.js','steep-settings.js',
  'steep-dashboard.js','steep-insights.js','steep-teas.js','steep-reference.js',
  'steep-shopping.js','steep-passport.js','steep-social.js','steep-sessions.js'];
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
/* WHAT A3 CANNOT SEE, stated because an invariant's blind spot is not obvious from reading it: the
   ramp is TWO ARMS, ascending to `ivory` then descending, so adjacent-pair separation says nothing
   about two stops at opposite ends. `jade-pale` and `gold` sit 1.5 luminance apart and are told
   apart by 37° of hue alone; `straw` and `gold-pale` are 4.5 apart in dark at 7° of hue, which is
   the case that does not obviously resolve. No live collision on this shelf — `straw` holds only
   anji-bai-cha, which matches nothing Niklas owns. Recorded as an open question in the spec with the
   full pairwise table; a luminance-only non-adjacent check would be the wrong instrument, and
   choosing the right one is a decision nobody has made. */
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
/* PRESENCE checks read the RAW source; ABSENCE checks read the stripped one. strip() treats the
   accept=image-slash-star on the photo input as a block-comment OPEN and eats forward to the next
   comment-close, so the liquorRowHTML(t) call site is absent from the stripped text and a presence
   check against it silently fails. Eating a region can only ever make an ABSENCE check pass, never
   fail, so those stay on stripped. Same "check reads the wrong representation" family the register
   keeps booking. */
const teasSrc0=fs.readFileSync(path.join(repo,'steep-teas.js'),'utf8');   // raw — presence
const teasFenceSrc=strip(teasSrc0);                                        // stripped — absence
/* D1 CHANGED IN v4.19 — the PICKER now exists (slice 3, R39), so the v4.14 "no picker" fence is
   crossed. Rewritten to the fence that still stands, the way D1/D3 were before it: the picker is the
   tea-FORM control ONLY. Board 03's PRIMARY path is tea detail, which renders no swatch to hang an
   in-place picker on (F6); this slice ships the boarded SECONDARY path (#06's form). And there is NO
   long-press (deviation 3): no machinery exists, it is not keyboard-reachable, and the surfaces it
   would live on draw nothing to press. */
ok(/function liquorRowHTML\(/.test(teasSrc0) && /\$\{liquorRowHTML\(t\)\}/.test(teasSrc0),
   'D1 the picker IS built and is the tea-FORM control — liquorRowHTML renders inside teaFormModal, after Type, above the fold (R39, #06 secondary path)');
ok(!/long-?press|onlongpress/i.test(teasFenceSrc),
   'D1b …and long-press is NOT built (deviation 3) — no machinery, not keyboard-reachable, nothing on shelf/detail to press');
ok(G('TT_INHERIT').indexOf('liquor')===-1,
   'D2 `liquor` is NOT inherited: §8 authors every member explicitly, so inheritance is unused today and its only future effect is a new member silently inheriting a colour nobody authored (R121)');
/* D3 FLIPS AT v4.20 (the shelf) — the picker lived in the form, but shelfRowHTML now LEADS with the
   swatch, so the shelf draws one via R124's predicate. The "shelf renders none" fence is CROSSED;
   what it becomes is the assertion that the shelf swatch is an SVG <path> (R145), tier-3 a dashed
   PLATE (R144), never a border style. R126's border STYLE is superseded here by R145: the tier is now
   carried by stroke weight + interruption on one path, not solid-vs-dashed borders. The fence that
   still stands after this: ref-swatch/social-tile do not yet pass the predicate — filed behind a later
   version (after v4.20, not yet sequenced), R125 — so they keep the CSS output (D3e). */
ok(/swatchAttr\('shelf-swatch'/.test(teasSrc0),
   'D3 the shelf row now DRAWS a swatch via the predicate — shelfRowHTML leads with swatchAttr(\'shelf-swatch\', …, true) (R124/R125, board S1)');
{ const plate=G("swatchAttr('shelf-swatch', null, 'green', true)");
  ok(/<path\b/.test(plate) && /stroke-dasharray:13 6/.test(plate) && /stroke-width:1\.5/.test(plate) && /fill:none/.test(plate),
     'D3b tier 3 on a labelled row is a dashed SVG PLATE — <path>, dasharray "13 6", 1.5px, fill none (R144/R145), NOT a CSS border'); }
{ const filled=G("swatchAttr('shelf-swatch', 'amber-deep', 'oolong', true)");
  ok(/<path\b/.test(filled) && /fill:var\(--liquor-amber-deep\)/.test(filled) && /stroke-width:1;/.test(filled) && !/dasharray/.test(filled),
     'D3c a measured swatch is the SAME <path>, filled with the liquor, solid 1px, no dash — one object with its outline broken (R145)'); }
ok(/class="today-tint t-green"/.test(G("swatchAttr('today-tint', null, 'green', false)")),
   'D3d hasLabel FALSE keeps the CSS type tint (today-tint has no label) — the predicate reaches 3/4 sites and this is the one it does not (R125)');
ok(/background:var\(--liquor-amber\)/.test(G("swatchAttr('ref-swatch', 'amber', 'oolong')")),
   'D3e the three filed-behind sites are UNCHANGED — a 3-arg call (no hasLabel) still returns CSS attributes; ref/social/today untouched (R125)');
const spec=fs.readFileSync(path.join(repo,'docs/r4/planning/SPEC-liquor-swatch-model.md'),'utf8');
ok(/These hex values are a first pass by a lane that has not drunk these teas/.test(spec),
   'D4 the spec still says the hexes are unverified by anyone who has tasted these teas — two groupings want a human check');
ok(/derived, not locked/.test(spec), 'D5 …and that the small 15x20 geometry is derived, not locked (R121)');
ok(/function swatchAttr\(base, key, type, hasLabel\)/.test(teasSrc0),
   'D6 swatchAttr\'s signature GAINED R124\'s predicate (base, key, type, hasLabel) and its label branch emits an SVG <path>, not a border (R145) — the A2 fold, landed at the shelf');
console.log('  D the fence: 11 checks');

/* ---- E · the cascade (v4.14) — read time, never stored ---- */
const gf={id:'t1', name:'Honey Oolong Gui Fei', type:'oolong'};          // matches gui-fei-oolong → amber
const dancong={id:'t2', name:'Yashi Xiang Dancong Guangdong', type:'oolong'};  // matches, deliberately null
const nomatch={id:'t3', name:'Pipachá', type:'green'};                   // matches nothing
ok(G('liquorFor')(gf)==='amber', 'E1 tier 2 — a tea matching a catalog row resolves to that row\'s liquor');
ok(G('liquorFor')(Object.assign({},gf,{liquor:'sepia'}))==='sepia',
   'E2 tier 1 — the user\'s own correction wins over the catalog');
ok(G('liquorFor')(dancong)===null && G('liquorFor')(nomatch)===null,
   'E3 tier 3 — a deliberately-null style and an unmatched tea both resolve to NOTHING, which the render site draws as the type tint: an honest answer, not a failure state');
/* E4 IS THE ONE MOST LIKELY TO BE GOT WRONG, and it is why the cascade must never write. Clearing a
   correction has to return the tea to TIER 2 — not to tier 3, and not to a stored copy of tier 2's
   value. A stored copy means a catalog improvement can never again reach a tea whose owner once
   looked at it. Here it is free by construction: tier 2 was never copied anywhere. */
const corrected=Object.assign({},gf,{liquor:'sepia'});
const cleared=Object.assign({},corrected,{liquor:null});
ok(G('liquorFor')(cleared)==='amber',
   'E4 CLEARING returns the tea to tier 2, not to tier 3 and not to a frozen copy — otherwise a catalog improvement could never reach a tea anyone had corrected');
/* Read time, never stored: the resolver must not mutate what it is handed. A cascade that quietly
   wrote its answer back would pass every check above and fail the ruling. */
const probe={id:'t4', name:'Honey Oolong Gui Fei', type:'oolong'};
const before=JSON.stringify(probe); G('liquorFor')(probe);
ok(JSON.stringify(probe)===before, 'E5 resolving writes nothing — the tea object is unchanged after a call (R97\'s reasoning, applied to colour)');
ok(G('liquorFor')(Object.assign({},gf,{liquor:'chartreuse'}))==='amber',
   'E6 an UNKNOWN key degrades to tier 2 rather than rendering a broken colour — which is why the column stores a key and not a hex');
ok(G('liquorFor')(Object.assign({},nomatch,{liquor:'chartreuse'}))===null,
   'E7 …and falls all the way to tier 3 when the catalog has nothing either');
/* The mappers, both directions. Adding a persisted field means updating BOTH or the round trip
   silently drops it — the house rule, and the thing a one-way check would miss. */
const dataSrc2=fs.readFileSync(path.join(repo,'steep-data.js'),'utf8');
ok(/liquor: r\.liquor \|\| null/.test(dataSrc2), 'E8 teaFromDb reads `liquor`');
ok(/liquor: t\.liquor \|\| null/.test(dataSrc2), 'E9 …and teaToDb writes it — both mappers, or the round trip drops it silently');
ok(fs.existsSync(path.join(repo,'sql/v3_12-liquor.sql')),
   'E10 the migration is committed as `v3_12`, continuing the series — the `v3_` prefix is a series number, not the app version (v3_10 was applied at app v4.02)');
console.log('  E the cascade: 10 checks');

/* ---- F · THE SITE SCAN, and it points the OPPOSITE way from the currency scan ----
 *
 * R104's scan caught money fields rendered bare — sites that should have called the helper and did
 * not. This one has to catch the reverse: a colour applied where it does not belong. FOURTEEN places
 * write a `t-<type>` class (twelve before v4.19; the picker added two), and they are five kinds:
 *
 *   4 SWATCH SLOTS      the liquor's home — three CSS (ref/social/today) + the shelf row (v4.20). The
 *                       shelf is an SVG <path>, so it lifts `painted` to FOUR but adds no t- tint: its
 *                       tier-3 is a dashed PLATE, not a class, so `tinted` stays 11 (R145).
 *   3 PHOTO PLACEHOLDERS  40-100px image substitutes; a design question nobody has drawn
 *   4 TYPE LABELS       pills that literally read "Oolong" — liquor-ising one is an ACTIVE REGRESSION
 *   2 CHART SEGMENTS    a categorical bar of types, not of teas
 *   2 PICKER TIER-3     v4.19: the COLOUR-row preview + the default grid cell, tinted ONLY when the
 *                       tea resolves to tier 3 — the honest fallback the picker is choosing among,
 *                       not a swatch slot to liquor-ise (a fixed liquor there would defeat the picker)
 *
 * A mechanical "replace the type tint" would have been wrong at six of twelve, and nothing else in
 * the app would have noticed. So the classification itself is asserted: a new tinted site has to be
 * classified rather than defaulted, and a label that quietly acquires a liquor reddens.
 */
const FILES_SCANNED=['steep-teas.js','steep-sessions.js','steep-social.js','steep-dashboard.js','steep-reference.js','steep-insights.js'];
const SWATCHES=['today-tint','social-tile','ref-swatch','shelf-swatch'];
const LABELS=['shelf-pill','pill t-'];
/* THE WRITER'S OWN BODY IS EXCLUDED BEFORE COUNTING, and that is not bookkeeping. `swatchAttr`
   contains a `t-${...}` fallback and the token `swatchAttr(` in its own declaration, so counting the
   file raw reports ten tints and four call sites — the helper counted as a user of itself. Ninth
   instance of this family, and the second in three slices after `sessionsToday(now)` matched
   `function sessionsToday(now){`. Count the SITES; the definition is not one. */
let tinted=0, painted=0;
FILES_SCANNED.forEach(f=>{
  const src=strip(fs.readFileSync(path.join(repo,f),'utf8'))
    .replace(/function swatchAttr\(base, key, type, hasLabel\)\{[\s\S]*?\n\}/,'');
  tinted += (src.match(/t-\$\{|dot-\$\{/g)||[]).length;
  painted += (src.match(/swatchAttr\(/g)||[]).length;
});
ok(tinted===11, 'F1 ELEVEN type-tint writes remain across the six files — the v4.19 picker added two (its tier-3 fallback: COLOUR-row preview + default cell), on top of the nine that stayed labels/placeholders/chart after three became swatches (got '+tinted+')');
ok(painted===7, 'F2 …and exactly SEVEN swatchAttr call sites paint a liquor now — six through warm Home (R159) plus the Insights note swatch (R170); the colour-clock bars and the Teas-brewed strip paint liquor via var(--liquor-*) directly, not swatchAttr, so they are marks outside this count (got '+painted+')');
/* The regression this scan exists to prevent: a type LABEL taking a liquor. The pill says "Oolong";
   colouring it by what the tea pours is a category error, and it would look deliberate. */
const teasSrc=strip(fs.readFileSync(path.join(repo,'steep-teas.js'),'utf8'));
const socialSrc=strip(fs.readFileSync(path.join(repo,'steep-social.js'),'utf8'));
ok(/shelf-pill t-\$\{/.test(teasSrc) && !/swatchAttr\('shelf-pill/.test(teasSrc),
   'F3 the shelf type PILL keeps its type tint and takes no liquor — a label reading "Oolong" coloured by liquor is a category error');
ok(/class="pill t-\$\{/.test(socialSrc) && /class="pill t-\$\{/.test(teasSrc),
   'F4 …and so do the two other type pills, on Social and Tea detail');
/* F5 SPLITS AT v4.20, RETARGETED v4.21 — the "no shelf swatch" negation is CROSSED (D3/F5b assert
   presence now). Three guards: (a) the photo placeholder tint is not liquor-ised; (b) the photo-trails
   DECISION, pinned on shelfRowHTML's OWN body — v4.21 the identity block moved into teaRowIdentity, so
   the anchor is teaRowIdentity(t) before shelfPhoto; (c) teaRowIdentity is the SINGLE identity writer,
   wrapped by BOTH shelfRowHTML and the tea picker (one writer, two wrappers, R58/#14). */
ok(/shelf-ph t-\$\{/.test(teasSrc),
   'F5a the shelf photo PLACEHOLDER keeps its type tint and takes no liquor — a tint stays a tint');
{ const rowBody=teasSrc.match(/function shelfRowHTML\([\s\S]*?\n\}/)[0];
  const idAt=rowBody.indexOf("teaRowIdentity(t)"), phAt=rowBody.indexOf("shelfPhoto(t,'thumb')");
  ok(idAt!==-1 && phAt!==-1 && idAt<phAt,
     'F5b the row draws the IDENTITY (teaRowIdentity) then the photo TRAILS — reddens if the photo is dropped or the order flips (board S1/S2, F4/TD1)'); }
{ const idBody=teasSrc.match(/function teaRowIdentity\([\s\S]*?\n\}/)[0];
  const pickBody=teasSrc.match(/function pickTeaRow\([\s\S]*?\n\}/)[0];
  ok(/swatchAttr\('shelf-swatch'/.test(idBody) && /teaRowIdentity\(t/.test(pickBody),
     'F5c teaRowIdentity paints the swatch (single writer) AND is wrapped by pickTeaRow too — two wrappers, so the spine re-dresses both (R58/#14)'); }
ok(/dot-\$\{/.test(strip(fs.readFileSync(path.join(repo,'steep-insights.js'),'utf8'))),
   'F6 the type-mix chart still keys on type — it counts categories, not teas, so a per-tea colour would make its legend meaningless');
/* The three slots actually resolve. Rendered, not merely present in source. */
G('state.teas='+JSON.stringify([{id:'x',name:'Honey Oolong Gui Fei',type:'oolong'}])+';');
ok(/background:var\(--liquor-amber\)/.test(G('socialTileHTML("oolong","Honey Oolong Gui Fei")')),
   'F7 the social tile paints the catalog liquor for a passed tea — tier 2 by construction, since a passed tea has no row of yours to correct');
ok(/background:var\(--liquor-/.test(G('swatchAttr("ref-swatch","amber-deep","oolong")'))
   && /class="ref-swatch t-oolong"/.test(G('swatchAttr("ref-swatch",null,"oolong")')),
   'F8 the writer paints when there is a key and falls back to the type tint when there is not — tier 3 lives at the render site, not in the resolver');
ok(/\.today-tint\{[^}]*width:30px/.test(cssSrc) && !/\.today-tint\{[^}]*border:1px solid var\(--line\)/.test(cssSrc),
   'F9 R159: the today fleck becomes a 30px liquor SWATCH and drops the hairline (a bold swatch, not a bullet) — pale-end legibility now rides on the whiter ground + size (a phone-look item, smoke.md); ref/social keep theirs');
console.log('  F the site scan: 11 checks · '+tinted+' tints kept · '+painted+' liquor sites');

/* ---- G · the picker (v4.19, R39) — the WRITE path, and F1's containment guard ----
 *
 * F1 is the central bug of this slice and its guard is the GENERAL form, NOT /liquor/. submitTeaForm
 * rebuilds the tea from scratch; before v4.19 it wrote every mapped field EXCEPT `liquor`, silently,
 * and a string match on "liquor" would have missed the NEXT dropped field. The invariant asserted is:
 * the set of keys submitTeaForm writes ⊇ the set teaFromDb produces. Keys are parsed from source, so
 * this section reads raw and strips BOTH comment kinds first — teaFromDb carries `// v4.14:`-style
 * line comments whose colons would otherwise read as keys (strip() only removes block comments).
 */
const teasRaw=fs.readFileSync(path.join(repo,'steep-teas.js'),'utf8');
const dataRaw=fs.readFileSync(path.join(repo,'steep-data.js'),'utf8');
const noComment=s=>s.replace(/\/\*[\s\S]*?\*\//g,' ').replace(/\/\/[^\n]*/g,' ');
const objKeys=(src,re)=>{ const m=src.match(re); if(!m) return null;
  const body=noComment(m[1]); const keys=new Set(); const kre=/([A-Za-z_]\w*)\s*:/g; let k;
  while((k=kre.exec(body))) keys.add(k[1]); return keys; };
const fromDbKeys=objKeys(dataRaw,/const teaFromDb = r => \(\{([\s\S]*?)\n {2}\}\);/);
const dataKeys  =objKeys(teasRaw,/const data = \{([\s\S]*?)\n {2}\};/);
ok(fromDbKeys && dataKeys, 'G1a both object literals were located and parsed (teaFromDb + submitTeaForm `data`)');
const dropped=fromDbKeys ? [...fromDbKeys].filter(k=>!dataKeys.has(k)) : ['<parse-failed>'];
ok(dropped.length===0,
   'G1 submitTeaForm writes ⊇ teaFromDb produces — no persisted field is silently dropped (F1, the general form; catches the NEXT drop, not just liquor). Missing: ['+dropped.join(', ')+']');
ok(!!(dataKeys && dataKeys.has('liquor')),
   'G2 …and `liquor` specifically is now written — the field that was dropped until this slice');
ok(/liquor: \(f\.liquor && isLiquorKey\(f\.liquor\.value\)\) \? f\.liquor\.value : null/.test(teasRaw),
   'G3 the write is GATED through isLiquorKey — a tampered DOM cannot persist junk; anything else → null → tier 2');
ok(/function liquorGridCells\(/.test(teasRaw) && /<button type="button"[^>]*aria-pressed=/.test(teasRaw) && /aria-label=/.test(teasRaw),
   'G4 the grid is real <button type=button> cells with aria-pressed + aria-label — keyboard-reachable, testable without synthesised pointer events, never an accidental submit');
ok(/inp\.dispatchEvent\(new Event\('input', \{ bubbles:true \}\)\)/.test(teasRaw),
   'G5 selection writes the hidden field and DISPATCHES an input event (WS1 dirty guard) — exactly acceptOriginOffer, so a backdrop tap cannot discard the choice silently');
/* DOM-only: the three interactive functions must never call render() — the form reads fields on
   submit, so a re-render mid-edit wipes unsaved values (toggleSpecifics' constraint). */
const pickerFns=(strip(teasRaw).match(/function (?:liquorSelect|liquorRefresh|toggleLiquorGrid)\([\s\S]*?\n\}/g)||[]).join('\n');
ok(pickerFns && !/\brender\(\)/.test(pickerFns),
   'G6 open/close and selection are DOM-only — liquorSelect/liquorRefresh/toggleLiquorGrid never call render()');
ok(/data-liquor=""[\s\S]*?onclick="liquorSelect\(''\)"/.test(teasRaw),
   "G7 CLEARING is a first-class cell — the default cell writes '' → submitTeaForm maps '' → null → tier 2 by construction (the UI wiring behind E4)");
ok(/liquorFor\(\{ name, type, liquor: correction \}\)/.test(teasRaw) && /F2: resolution follows NAME/.test(teasRaw),
   'G8 F2 — the preview resolves via liquorFor(NAME), not the type control; type only re-tints the tier-3 fallback (build to §4.1, not board #06 rev 4)');
ok(/\.liquor-preview\{[^}]*width:26px;height:34px/.test(cssSrc),
   'G9 preview swatch is 26x34 — the shipped .social-tile/.ref-swatch family (R121)');
ok(/\.liquor-cell\{[^}]*width:22px;height:22px/.test(cssSrc) && !/width:40px;height:50px/.test(cssSrc),
   "G10 grid cells are 22x22 (board #03), and #06 rev 4's 40x50 4:5 aspect is NOT adopted (R121: scale the lock, not a new aspect)");
console.log('  G the picker + F1 guard: 11 checks');

console.log('');
if(failures){ console.log('FAILED: '+failures+' of '+(passed+failures)); process.exit(1); }
console.log('ALL LIQUOR TESTS PASSED ('+passed+' passed)');
