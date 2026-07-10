---
name: vm-fixture
description: Build or extend a SlowCup Node vm sandbox test against the real CSV fixtures. Use whenever validating app logic (greeting, ratio, insights, forecasts, parsers) outside the browser.
---

# /vm-fixture — the canonical sandbox harness

SlowCup's logic is validated in a Node `vm` sandbox against Niklas's REAL exported data
(`fixtures/*.csv`), never against invented examples alone. This skill is the harness so it
stops being rebuilt from scratch. Conventions first, template second.

## Conventions
- **Real data first**: assertions are grounded in `fixtures/{teas,sessions,steeps,vessels}_rows.csv`.
  Synthetic rows are for negative controls and edge cases only — inject them explicitly and
  say so in the test output.
- **Committed vs local**: invariant guards (brew-roundtrip, insights-room, wrapped-cards) are
  committed and run every deploy. Feature-specific suites stay local/gitignored unless they
  guard a brand rule or a cross-module invariant — then commit them.
- Test names state the behavior, output ends with `ALL <NAME> TESTS PASSED (n passed)` and a
  non-zero exit on failure, matching the existing suites.
- Deterministic features (greeting picks, copy pools) are tested with fixed `todayKey`/mocked
  hours — never the wall clock.

## Harness template
```js
const fs=require('fs'),path=require('path'),vm=require('vm');
const REPO=path.resolve(__dirname,'..');
// Load order matters — shared global scope, knowledge before core before features:
const SRC=['steep-knowledge.js','steep-core.js', /* feature files under test */]
  .map(f=>fs.readFileSync(path.join(REPO,f),'utf8')).join('\n;\n');
const ctx={};ctx.window=ctx;ctx.globalThis=ctx;ctx.console=console;
ctx.document={documentElement:{setAttribute(){},getAttribute(){return'light'}},
  getElementById:()=>null,querySelectorAll:()=>[],
  createElement:()=>({style:{},setAttribute(){},appendChild(){},classList:{add(){}}})};
ctx.localStorage={getItem:()=>null,setItem(){},removeItem(){}};
ctx.matchMedia=()=>({matches:false});ctx.navigator={onLine:true};
ctx.setTimeout=()=>{};ctx.clearTimeout=()=>{};ctx.setInterval=()=>{};ctx.clearInterval=()=>{};
ctx.addEventListener=()=>{};
vm.createContext(ctx);vm.runInContext(SRC,ctx);
vm.runInContext('state.settings=Object.assign({},DEFAULT_SETTINGS);',ctx);
// Quote-aware CSV parser (fixture files contain quoted commas/newlines):
function parseCSV(t){const R=[];let r=[],c='',q=false;for(let i=0;i<t.length;i++){const ch=t[i];
 if(q){if(ch==='"'){if(t[i+1]==='"'){c+='"';i++;}else q=false;}else c+=ch;}
 else if(ch==='"')q=true;else if(ch===','){r.push(c);c='';}
 else if(ch==='\n'){r.push(c);R.push(r);r=[];c='';}else if(ch!=='\r')c+=ch;}
 if(c||r.length){r.push(c);R.push(r);}
 const h=R[0];return R.slice(1).filter(x=>x.length===h.length)
   .map(x=>Object.fromEntries(h.map((k,i)=>[k,x[i]])));}
const rows=f=>parseCSV(fs.readFileSync(path.join(__dirname,f),'utf8'));
// rows('teas_rows.csv') etc. Map snake_case columns to the app's camelCase fields the same
// way steep-data.js mappers do — check the mapper before assuming a field name.
```

## Gotchas learned the hard way
- Mock `state.settings` per scenario (`ratioAdjust`, `brewAdvice` etc.) — defaults changed
  across versions; never assume.
- Time-of-day logic uses LOCAL hours; session_date in CSVs is UTC — convert deliberately.
- Cold-brew rows (`is_cold_brew` 'true'/'t') are excluded from most brew logic — test both
  that they're excluded where they should be and counted where they should be (greeting).
- `d_copyPick`/`d_hash` determinism: same inputs must give same outputs across repeated
  calls in ONE test run — assert it, don't trust it.
