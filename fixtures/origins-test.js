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
console.log('  A frame: 3 checks');

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

console.log('');
if(failures){ console.log('FAILED: '+failures+' of '+(passed+failures)); process.exit(1); }
console.log('ALL ORIGINS TESTS PASSED ('+passed+' passed)');
