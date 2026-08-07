/* local-only: render the Origins map from shipped output, before and after the v4.08 fix.
 *
 * PROMOTED FROM A SCRATCHPAD, 2026-08-07, and that is the point of tracking it. This harness drew
 * the map for the whole H2 slice while living in a session temp directory — it was never a file in
 * the repo, so it could not be reviewed, and it would have died with the session that wrote it.
 * The map shipped numerically verified and visually unseen twice; this is the thing that finally
 * showed it. The BEFORE pane reads `steep-passport.js` at `af6cc74` (the last commit before the
 * fix), so it stays a live comparison rather than a screenshot: the labels running off the card at
 * "H" and "K" are reproducible, not remembered.
 *
 * Run: node fixtures/origins-review.js  → fixtures/origins-review.html
 */
const fs=require('fs'),path=require('path'),vm=require('vm');
// Never an absolute path: this file was written in a scratchpad with one hardcoded, which would
// have made it useless in any other clone the moment it was tracked.
const repo=path.resolve(__dirname,'..');
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
ctx.addEventListener=()=>{};ctx.SteepDB={newId:()=>'x',getUser:()=>({id:'u'})};
vm.createContext(ctx);vm.runInContext(SRC,ctx);
const G=e=>vm.runInContext(e,ctx);
G('state.settings=Object.assign({},DEFAULT_SETTINGS);');
function parseCSV(t){const R=[];let r=[],c='',q=false;for(let i=0;i<t.length;i++){const ch=t[i];
 if(q){if(ch==='"'){if(t[i+1]==='"'){c+='"';i++;}else q=false;}else c+=ch;}
 else if(ch==='"')q=true;else if(ch===','){r.push(c);c='';}
 else if(ch==='\n'){r.push(c);R.push(r);r=[];c='';}else if(ch!=='\r')c+=ch;}
 if(c||r.length){r.push(c);R.push(r);}
 const h=(R[0]||[]).map(x=>x.trim());
 return R.slice(1).filter(x=>x.length===h.length).map(x=>Object.fromEntries(h.map((k,i)=>[k,x[i]])));}
const rows=f=>parseCSV(fs.readFileSync(path.join(repo,'fixtures',f),'utf8'));
const OWNER=rows('sessions_rows.csv')[0].user_id;
const TEAS=rows('teas_rows.csv').filter(t=>t.user_id===OWNER).map(t=>({id:t.id,name:t.name,type:t.type,origin:t.origin||''}));
G('state.teas='+JSON.stringify(TEAS)+';');
const NOW=G('viewOrigins()');
// v4.07's renderer, re-created from the shipped git blob, for a side-by-side
const { execSync }=require('child_process');
const OLD=execSync('git -C "'+repo+'" show af6cc74:steep-passport.js',{maxBuffer:1e8}).toString();
const ctx2={};Object.assign(ctx2,{});for(const k of Object.keys(ctx)) ctx2[k]=ctx[k];
const SRC2=FILES.map(f=>f==='steep-passport.js'?OLD:fs.readFileSync(path.join(repo,f),'utf8')).join('\n;\n');
const c2={};c2.window=c2;c2.globalThis=c2;c2.console=console;c2.document=ctx.document;
c2.localStorage=ctx.localStorage;c2.matchMedia=ctx.matchMedia;c2.navigator=ctx.navigator;
c2.setTimeout=()=>{};c2.clearTimeout=()=>{};c2.setInterval=()=>{};c2.clearInterval=()=>{};
c2.addEventListener=()=>{};c2.SteepDB=ctx.SteepDB;
vm.createContext(c2);vm.runInContext(SRC2,c2);
vm.runInContext('state.settings=Object.assign({},DEFAULT_SETTINGS);state.teas='+JSON.stringify(TEAS)+';',c2);
const BEFORE=vm.runInContext('viewOrigins()',c2);
const css=fs.readFileSync(path.join(repo,'styles.css'),'utf8');
const page=`<!DOCTYPE html><html data-theme="light"><head><meta charset="utf-8"><style>${css}
body{background:var(--porcelain);margin:0;padding:20px;font-family:var(--font-body);}
.cols{display:flex;gap:28px;align-items:flex-start;}
.col{width:390px;background:var(--porcelain);padding:0 20px;}
.hd{font:600 12px var(--font-mono);letter-spacing:.08em;color:#8A2B1C;margin:0 0 8px;}
</style></head><body><div class="cols">
<div class="col"><p class="hd">v4.07 — AS SHIPPED</p>${BEFORE}</div>
<div class="col"><p class="hd">v4.08 — THIS DEPLOY</p>${NOW}</div>
</div></body></html>`;
fs.writeFileSync(path.join(repo,'fixtures','origins-review.html'), page);
console.log('wrote origins-review.html');
