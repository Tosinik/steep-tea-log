/* PERMANENT validation — #37 Origins, direction 2 (committed; every deploy).
 *
 * WHY ITS OWN SUITE. Origins is the one surface in this round whose design decisions are NUMBERS:
 * a frame proportion, a merge threshold in pixels, a tier split. Every one of them was ruled after
 * measurement rather than chosen, and a number ruled after measurement is exactly the kind that
 * drifts silently when something upstream changes — a pin radius, a coordinate row, one more tea.
 *
 * The frame is asserted as the ruled PROPERTY — marks occupy 83% of the card — not as a padding
 * value. Padding is a consequence; the span is the decision. A fixed pad would silently change the
 * scale, and therefore what "14 px" means, the moment the shelf's spread changed.
 *
 * The threshold's safety is the gap between the pair that MUST merge (Kagoshima↔Chiran, 3.3 px) and
 * the pair that must NOT (Hoshino↔Kagoshima, 23.0 px). 14 sits between them with room on both
 * sides. That distance is the whole argument, so it is asserted, not the threshold alone.
 *
 * Run: node fixtures/origins-test.js   (exit non-zero on any failure)
 * Run fixtures/export-gate-test.js FIRST.
 */
const fs=require('fs'), path=require('path'), vm=require('vm');
const repo=path.join(__dirname,'..');
const FILES=['steep-origins-map.js','steep-knowledge.js','steep-tea-types.js','steep-core.js',
  'steep-settings.js','steep-dashboard.js','steep-insights.js','steep-teas.js','steep-reference.js',
  'steep-shopping.js','steep-passport.js','steep-social.js','steep-sessions.js'];
const SRC=FILES.map(f=>fs.readFileSync(path.join(repo,f),'utf8')).join('\n;\n');
const ctx={};ctx.window=ctx;ctx.globalThis=ctx;ctx.console=console;
ctx.document={documentElement:{setAttribute(){},getAttribute(){return'light'}},
  getElementById:()=>null,querySelectorAll:()=>[],querySelector:()=>null,addEventListener(){},
  createElement:()=>({style:{},setAttribute(){},appendChild(){},classList:{add(){},remove(){}}})};
ctx.localStorage={getItem:()=>null,setItem(){},removeItem(){}};
ctx.matchMedia=()=>({matches:false});ctx.navigator={onLine:true};
ctx.setTimeout=()=>{};ctx.clearTimeout=()=>{};ctx.setInterval=()=>{};ctx.clearInterval=()=>{};
ctx.addEventListener=()=>{};
ctx.SteepDB={newId:()=>'x',getUser:()=>({id:'u'})};
vm.createContext(ctx);vm.runInContext(SRC,ctx);
const G=e=>vm.runInContext(e,ctx);
G('state.settings=Object.assign({},DEFAULT_SETTINGS);');

let passed=0, failures=0;
const ok=(c,m)=>{ if(c){passed++;} else {failures++; console.log('  FAIL: '+m);} };
function parseCSV(t){const R=[];let r=[],c='',q=false;for(let i=0;i<t.length;i++){const ch=t[i];
 if(q){if(ch==='"'){if(t[i+1]==='"'){c+='"';i++;}else q=false;}else c+=ch;}
 else if(ch==='"')q=true;else if(ch===','){r.push(c);c='';}
 else if(ch==='\n'){r.push(c);R.push(r);r=[];c='';}else if(ch!=='\r')c+=ch;}
 if(c||r.length){r.push(c);R.push(r);}
 const h=(R[0]||[]).map(x=>x.trim());
 return R.slice(1).filter(x=>x.length===h.length).map(x=>Object.fromEntries(h.map((k,i)=>[k,x[i]])));}
const rows=f=>parseCSV(fs.readFileSync(path.join(__dirname,f),'utf8'));

console.log('ORIGINS — #37 direction 2');
const OWNER=rows('sessions_rows.csv')[0].user_id;                  // R69: derived, never hardcoded
const TEAS=rows('teas_rows.csv').filter(t=>t.user_id===OWNER)
  .map(t=>({id:t.id,name:t.name,type:t.type,origin:t.origin||''}));
G('state.teas='+JSON.stringify(TEAS)+';');
const CARD=350;

/* ---- A · the frame ---- */
const marks=G('originsRegionMarks()');
const html=G('viewOrigins()');
const vb=(html.match(/viewBox="([^"]+)"/)||[])[1].split(' ').map(Number);
const scale=CARD/vb[2];
const xs=marks.map(m=>m.x);
const spanPct=(Math.max.apply(null,xs)-Math.min.apply(null,xs))*scale/CARD;
ok(Math.abs(spanPct-0.83)<0.01, 'A1 marks occupy 83% of the card — the ruled frame (got '+Math.round(spanPct*100)+'%)');
ok(Math.abs(scale-3.74)<0.05, 'A2 …which puts the scale at 3.74 px/unit (got '+scale.toFixed(2)+')');
ok(!/const pad = 26/.test(fs.readFileSync(path.join(repo,'steep-passport.js'),'utf8')),
   'A3 the frame is derived from the ruled span, not a hardcoded padding');
/* Rule 2's second half, unimplemented until v4.08: the box is EXPANDED to the card's aspect. Drawn
   as the marks' own bbox the card came out 350x193, ending a few px past the easternmost pin —
   which is what read as the map cutting Japan off. */
ok(Math.abs(vb[2]/vb[3] - G('ORIGINS_ASPECT')) < 0.002,
   'A4 the frame is expanded to the card\'s aspect, not left at whatever the marks\' bbox gave (got '+(vb[2]/vb[3]).toFixed(3)+')');
const ys=marks.map(m=>m.y);
ok(Math.min.apply(null,ys) > vb[1] && Math.max.apply(null,ys) < vb[1]+vb[3] &&
   Math.min.apply(null,xs) > vb[0] && Math.max.apply(null,xs) < vb[0]+vb[2],
   'A5 …and expanding never crops — every mark still sits inside the frame');
console.log('  A frame: 5 checks · card 350x'+(vb[3]*scale).toFixed(0)+' px');

/* ---- B · the merge, and why 14 is safe rather than tuned ---- */
const px=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)*scale;
let tight=Infinity;
for(let i=0;i<marks.length;i++) for(let j=i+1;j<marks.length;j++) tight=Math.min(tight,px(marks[i],marks[j]));
ok(Math.abs(tight-3.3)<0.3, 'B1 Kagoshima and Chiran sit 3.3 px apart — the pair that MUST merge (got '+tight.toFixed(1)+')');
const merged=G('originsMerge(originsRegionMarks(), '+(vb[2]/CARD)+')');
let after=Infinity;
for(let i=0;i<merged.length;i++) for(let j=i+1;j<merged.length;j++) after=Math.min(after,px(merged[i],merged[j]));
ok(Math.abs(after-23.0)<0.4, 'B2 the tightest gap AFTER merging is 23.0 px — the pair that must NOT (got '+after.toFixed(1)+')');
ok(tight<14 && after>14,
   'B3 …so 14 px sits between them with room on both sides: that gap is what makes the threshold SAFE rather than tuned');
const lead=merged.filter(m=>m.members.length>1)[0];
ok(lead && lead.label==='Kagoshima' && lead.members.length===2,
   'B4 the merged mark leads with MOST TEAS (Kagoshima 3 over Chiran 1), not with whichever came first');
ok(/Kagoshima \+1/.test(html), 'B5 …and draws as "Kagoshima +1", exactly as the re-exported board renders it');
// The tie-break only shows itself on a tie, which this shelf does not have — so it is asserted directly.
const tie=G('originsMerge('+JSON.stringify([
  {label:'South',lat:10,lon:100,n:2,x:100,y:100,teas:[]},
  {label:'North',lat:20,lon:100,n:2,x:100.5,y:100,teas:[]}])+', 1)');
ok(tie.length===1 && tie[0].label==='North',
   'B6 on a TIE the northernmost leads — synthetic, because this shelf has no tie and the rule would otherwise be untested');
console.log('  B merge: 6 checks');

/* ---- C · the tier split, and R28's cost made concrete ---- */
const countries=G('originsCountryRows()');
const countryTeas=countries.reduce((s,r)=>s+r.teas.length,0);
ok(countryTeas===10, 'C1 ten teas live in the country tier — a first-class half of the screen, not a footnote (got '+countryTeas+')');
ok(/Known by country/.test(html), 'C2 …and it is drawn as a list');
const listPart=html.split('Known by country')[1]||'';
ok(!/org-pin/.test(listPart),
   'C3 no country is drawn as a pin — R28 defines a country mark as a computed point inside a shape, so listing it is the honest rendering');
ok(countries.some(r=>r.teas.some(t=>/Da Hong Pao/.test(t.name))),
   'C4 Dawang Feng Da Hong Pao is still listed, not pinned — its Wuyi Mountains coordinate row is owed, so an accepted offer cannot place it yet');
console.log('  C tier split: 4 checks · '+countries.map(r=>r.country+' '+r.teas.length).join(' · '));

/* ---- D · the projection is shared, which is the reason Code generates the outline ---- */
const asset=fs.readFileSync(path.join(repo,'steep-origins-map.js'),'utf8');
ok(/GENERATED by tools\/gen-origins-outline\.js/.test(asset), 'D1 the asset declares its generator — it is not hand-edited');
ok(/function originsProject/.test(asset),
   'D2 the projection ships INSIDE the asset, beside the paths it produced — one implementation, so a pin cannot be projected differently from the coastline');
const p1=G('originsProject(130.56, 31.60)');
ok(Math.abs(p1[0]-862.7)<0.2 && Math.abs(p1[1]-395.9)<0.2,
   'D3 Kagoshima projects where the generator put it (got '+p1.map(v=>v.toFixed(1)).join(', ')+')');
ok(!/d3|topojson|world-atlas/.test(fs.readFileSync(path.join(repo,'index.html'),'utf8')),
   'D4 R106: no runtime map dependency reached index.html');
console.log('  D projection: 4 checks');

/* ---- E · the removals this slice made (R45/R66) ---- */
const coreSrc=fs.readFileSync(path.join(repo,'steep-core.js'),'utf8');
ok(!/viewPassport/.test(coreSrc), 'E1 R66: the passport view is gone from the router');
ok(!/'passport','i-world-hl'/.test(coreSrc), 'E2 R45: the Passport row is gone from the hub — R3\'s only shipped-control removal');
const passSrc=fs.readFileSync(path.join(repo,'steep-passport.js'),'utf8');
['PASSPORT_GEO','PASSPORT_SUB','PASSPORT_LAND','passportCountryFor'].forEach(n=>
  ok(new RegExp(n).test(passSrc), 'E3 R66 keeps '+n+' — the tables are mined by Origins, not deleted with the view'));
ok(/passportCountryFor/.test(passSrc.split('ORIGINS (#37)')[1]||''),
   'E4 …and Origins actually uses them, so "kept" is not a euphemism for orphaned');
console.log('  E removals: 6 checks');

/* ---- F · the drawn marks: px is px, and a label ENDS somewhere ----
 *
 * WHY THIS SECTION EXISTS. Every check above verified geometry — where marks are, which ones merge,
 * how wide the frame is — and all of them stayed green while two of the seven marks rendered as a
 * single letter each. None of them asked where a label ends. Niklas found it by opening the map on
 * a phone. This section is that question, asked of the shipped markup.
 *
 * ITS LIMITATION, stated: the extents are computed with the renderer's own advance-width constant,
 * so this proves PLACEMENT, never that 0.62 em is the right number for the shipped face. A green
 * §F means "given how wide the renderer thinks these labels are, it puts them on the card".
 */
const CARDH = 350;                                                 // the drawn width, as above
const gs = html.match(/<g>.*?<\/g>/g) || [];
ok(gs.length === merged.length, 'F1 every merged mark draws one pin and one label (got '+gs.length+' of '+merged.length+')');
const drawn = gs.map(g => {
  const c = g.match(/<circle cx="([\d.-]+)" cy="([\d.-]+)" r="([\d.]+)" class="org-pin"/);
  const t = g.match(/<text x="([\d.-]+)" y="([\d.-]+)" font-size="([\d.]+)"( text-anchor="end")?[^>]*>([^<]*)</);
  const wide = t[5].length * G('ORIGINS_LBL_ADV') * Number(t[3]);
  const s = t[4] ? Number(t[1]) - wide : Number(t[1]);
  return { label:t[5], cx:Number(c[1]), r:Number(c[3]), fs:Number(t[3]), end:!!t[4],
           x0px:(s - vb[0]) * scale, x1px:(s + wide - vb[0]) * scale, widePx:wide * scale };
});
const off = drawn.filter(d => d.x0px < 0 || d.x1px > CARDH);
ok(!off.length, 'F2 no label runs off the card — the defect that rendered Hoshino as "H" and Kagoshima as "K" ('
   + (off.map(d=>d.label+' '+d.x0px.toFixed(0)+'→'+d.x1px.toFixed(0)).join(', ') || 'all inside') + ')');
/* The negative control. With the side-switch removed the invariant above is satisfied by
   construction and F2 could not fail — an absent check is at least visible (R105). This recomputes
   the same extents with every label forced to the right, and asserts that this shelf genuinely
   breaks it. If this ever goes quiet, F2 has stopped proving anything. */
const forced = drawn.filter(d => ((d.cx + G('ORIGINS_LBL_OFF_PX') * (vb[2]/CARDH) - vb[0]) * scale) + d.widePx > CARDH);
ok(forced.length >= 2,
   'F3 …and forcing every label to the right breaks it for '+forced.length+' marks ('+forced.map(d=>d.label).join(', ')
   +'), so F2 is not passing by construction');
ok(drawn.filter(d=>d.end).length === 2 && drawn.filter(d=>d.end).every(d=>/Hoshino|Kagoshima/.test(d.label)),
   'F4 exactly the two easternmost marks flip — the same two the board\'s outer-20% proxy would flip, by a rule that also holds for a long name at 70%');
const pinPx = drawn[0].r * 2 * scale;
ok(Math.abs(pinPx - 8) < 0.1, 'F5 a pin draws at 8 px across — the board\'s `pinPx`, fixed at every render size (got '+pinPx.toFixed(1)+')');
ok(drawn.every(d => Math.abs(d.fs * scale - 13) < 0.1),
   'F6 a label draws at 13 px — the size the 14 px merge threshold is calibrated against (got '+(drawn[0].fs*scale).toFixed(1)+')');
const passTxt = fs.readFileSync(path.join(repo,'steep-passport.js'),'utf8');
ok(!/const r = 4;/.test(passTxt) && /ORIGINS_PIN_PX \/ 2 \* upx/.test(passTxt),
   'F7 the pin size is converted, not written bare — the v4.07 bug was a px number living in unit space');
const cssTxt = fs.readFileSync(path.join(repo,'styles.css'),'utf8');
ok(!/\.org-lbl\{[^}]*font-size/.test(cssTxt),
   'F8 …and no stylesheet font-size on .org-lbl, which would win over the computed attribute and put the label back in unit space');
// Rule 4 — the ring is what a glance reads; "+1" is what a second look reads.
const ringed = (html.match(/class="org-ring"/g)||[]).length;
ok(ringed === merged.filter(m=>m.members.length>1).length && ringed === 1,
   'F9 the merged mark wears a ring, and only the merged mark (got '+ringed+')');
const ringR = Number((html.match(/r="([\d.]+)" stroke-width="[\d.]+" class="org-ring"/)||[])[1]) * scale;
ok(Math.abs(ringR - (8/2 + 3)) < 0.1, 'F10 …at pin radius + 3 px, converted like everything else (got '+ringR.toFixed(1)+' px)');
ok(!/\.org-ring\{[^}]*stroke-width/.test(cssTxt),
   'F11 …and no stylesheet stroke-width on it either — same trap, one line lower');
/* Rule 6's two halves. Neither can be seen on this shelf — seven pins, ten country rows — so both
   are driven synthetically, the way B6 drives the tie-break. The first is the one with teeth: the
   rule says "no map, list only" and assumes a list exists, and a shelf of one pinned tea and no
   country-tier ones has none, so without a fallback the screen renders a heading over nothing. */
const REAL = G('JSON.stringify(state.teas)');
G('state.teas=' + JSON.stringify(TEAS.filter(t => /kagoshima, japan/i.test(t.origin)).slice(0,1)) + ';');
const one = G('viewOrigins()');
ok(G('originsRegionMarks().length') === 1 && !/org-map/.test(one),
   'F12 one region pin draws no map — rule 6, and one pin is not an atlas');
ok(/card empty/.test(one),
   'F13 …and that shelf still says something: no map AND no country list would otherwise be a bare heading over a blank screen');
G('state.teas=' + REAL + ';');
const tightFrame = G('originsFrame([{x:800,y:400},{x:801,y:400.5}])');
ok(Math.abs(tightFrame.w - G('ORIGINS_MIN_SPAN')) < 0.001,
   'F14 two neighbouring pins get the 30-unit floor, not a meaningless close-up (got '+tightFrame.w.toFixed(1)+')');
console.log('  F drawn marks: 14 checks · flipped ' + drawn.filter(d=>d.end).map(d=>d.label).join(' + '));

console.log('');
if(failures){ console.log('FAILED: '+failures+' of '+(passed+failures)); process.exit(1); }
console.log('ALL ORIGINS TESTS PASSED ('+passed+' passed)');
