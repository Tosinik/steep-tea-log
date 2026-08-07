/* local-only: render Home's four states against the app's real CSS, for a human to look at.
   Four defects in this project have been found by looking and none by measuring, and Home is the
   first surface opened on every launch.
   States: 4a a furnished Home · 4b the day already logged · 4c day one · 4d one tea, two cups.
   Each is real output against real exported rows — not a mock of one.

   NOTHING HERE IS STITCHED, and that is the point of this version. The first cut called
   `viewDashboard()` alone and framed the result, which meant the preview omitted the topbar, the
   wordmark, the avatar and the bottom nav — exactly the chrome composition is judged against. The
   greeting read as a strange header because the brand row above it was missing, R114's "masthead on
   bare ground" could not be assessed without the ground, and R113's argument — spine clay versus the
   jade raised Log — could not be seen at all, because neither was drawn.
   So this drives the app's own `render()`: `#app` is given a real element to write into, and what
   comes back is the shell the app builds, topbar and nav included. If `render()` ever stops being
   callable this way, print that plainly rather than quietly falling back to the content region —
   a preview that silently narrows is worse than no preview. */
const fs=require('fs'), path=require('path'), vm=require('vm');
const repo=path.resolve(__dirname,'..');
const FILES=['steep-origins-map.js','steep-knowledge.js','steep-tea-types.js','steep-core.js',
  'steep-settings.js','steep-dashboard.js','steep-insights.js','steep-teas.js','steep-reference.js',
  'steep-shopping.js','steep-passport.js','steep-social.js','steep-sessions.js'];
const SRC=FILES.map(f=>fs.readFileSync(path.join(repo,f),'utf8')).join('\n;\n');
function sandbox(){
  const ctx={};ctx.window=ctx;ctx.globalThis=ctx;ctx.console={log(){},warn(){},error(){}};
  // The one stub that matters: `render()` writes the whole shell into #app, so #app must be a real
  // object we can read back. Everything else stays inert.
  const appEl={innerHTML:''};
  ctx.__app=appEl;
  ctx.document={documentElement:{setAttribute(){},getAttribute(){return'light'}},
    getElementById:id=>(id==='app'?appEl:null),querySelectorAll:()=>[],querySelector:()=>null,
    addEventListener(){},
    createElement:()=>({style:{},setAttribute(){},appendChild(){},classList:{add(){},remove(){}}})};
  ctx.localStorage={getItem:()=>null,setItem(){},removeItem(){}};
  ctx.matchMedia=()=>({matches:false});ctx.navigator={onLine:true};
  ctx.setTimeout=()=>{};ctx.clearTimeout=()=>{};ctx.setInterval=()=>{};ctx.clearInterval=()=>{};
  /* The avatar seeded "Y" in the first previews, from `hubIdentity()`'s last-resort fallback: no
     profile and no email leaves it with the literal string "You". That is a harness artifact, not
     the app's behaviour — a signed-in user always has an email. Seeded with the real login so the
     initial is the one the app draws. */
  ctx.addEventListener=()=>{};
  ctx.SteepDB={newId:()=>'x',getUser:()=>({id:'u',email:'niklasstark1@gmail.com'})};
  vm.createContext(ctx);vm.runInContext(SRC,ctx);
  vm.runInContext('state.settings=Object.assign({},DEFAULT_SETTINGS);state.vessels=[{id:"v1",name:"Dragon Gaiwan",capacityMl:110}];',ctx);
  return ctx;
}
function parseCSV(t){const R=[];let r=[],c='',q=false;for(let i=0;i<t.length;i++){const ch=t[i];
 if(q){if(ch==='"'){if(t[i+1]==='"'){c+='"';i++;}else q=false;}else c+=ch;}
 else if(ch==='"')q=true;else if(ch===','){r.push(c);c='';}
 else if(ch==='\n'){r.push(c);R.push(r);r=[];c='';}else if(ch!=='\r')c+=ch;}
 if(c||r.length){r.push(c);R.push(r);}
 const h=(R[0]||[]).map(x=>x.trim());
 return R.slice(1).filter(x=>x.length===h.length).map(x=>Object.fromEntries(h.map((k,i)=>[k,x[i]])));}
const rows=f=>parseCSV(fs.readFileSync(path.join(repo,'fixtures',f),'utf8'));
const OWNER=rows('sessions_rows.csv')[0].user_id;
const TEAS=rows('teas_rows.csv').filter(t=>t.user_id===OWNER).map(t=>({id:t.id,name:t.name,type:t.type,
  origin:t.origin||'',amountGrams:Number(t.amount_grams||0),isFavorite:t.is_favorite==='true'||t.is_favorite==='t'}));
/* Steeps are seeded from the real export, because `brewCountLabel` reads `steeps.length` (or
   `infusionCount`) — without them the diary line rendered a time, a tint, a name and an EMPTY span
   where "3 steeps" belongs. The preview looked plausible and was missing a column. Real rows carry
   steeps; a harness that drops them reviews a session shape the app never stores. */
const STEEPS_BY_SESSION=rows('steeps_rows.csv').filter(s=>s.user_id===OWNER)
  .reduce((m,s)=>{ (m[s.session_id]=m[s.session_id]||[]).push({}); return m; }, {});
const SESSIONS=rows('sessions_rows.csv').filter(s=>s.user_id===OWNER).map(s=>({id:s.id,teaId:s.tea_id,
  vesselId:s.vessel_id,date:s.session_date,teaName:s.tea_name,teaType:s.tea_type,
  steeps:STEEPS_BY_SESSION[s.id]||[]}));

/* The FULL shell, from the app's own render(): topbar + brand + avatar, the content region, and the
   bottom nav with the raised Log. `state.loaded` gates render()'s loading branch. */
function render(teas, sessions){
  const ctx=sandbox();
  vm.runInContext('state.loaded=true;state.view="dashboard";state.teas='+JSON.stringify(teas)
    +';state.sessions='+JSON.stringify(sessions)+';render();',ctx);
  const out=ctx.__app.innerHTML;
  if(!out || !out.trim()) throw new Error('render() wrote nothing — a blank review page would read as a broken Home rather than a broken renderer');
  // Assert the SHELL is there, not just the body. This is the check whose absence made the first
  // preview misleading: it looked fine, and was missing everything the ruling is judged against.
  ['topbar','SlowCup','avatar-btn','bottomnav','bn-log-circle'].forEach(m=>{
    if(!out.includes(m)) throw new Error('shell is incomplete — "'+m+'" missing; the preview would omit the chrome composition is judged against');
  });
  return out;
}
// 4b: the day already logged, so the greeting rests and carries no clay. Stamp two of today's own
// sessions onto real rows rather than inventing any.
const today=new Date(); today.setHours(9,0,0,0);
const logged=SESSIONS.slice(0,2).map((s,i)=>Object.assign({},s,{date:new Date(today.getTime()+i*3600e3).toISOString()})).concat(SESSIONS);
const STATES=[
  ['4a · a furnished Home', TEAS, SESSIONS],
  // Was "4b · the day already logged". With R117 built, this IS the board's 5a: two sittings today,
  // so Earlier today leads the stack. Relabelled rather than duplicated.
  ['5a · two sittings today', TEAS, logged],
  ['4c · day one', [], []],
  // 4d is "one tea, TWO CUPS" — a shelf of one that has been brewed, not an unused one. Seeded with
  // zero sessions first time round, which quietly reviewed a different state than the board drew.
  ['4d · thin — one tea, two cups', TEAS.slice(0,1).map(t=>Object.assign({},t,{isFavorite:false})),
    SESSIONS.slice(0,2).map((s,i)=>Object.assign({},s,{teaId:TEAS[0].id, teaName:TEAS[0].name,
      date:new Date(today.getTime()-(i+1)*86400e3).toISOString()}))],
];
const css=fs.readFileSync(path.join(repo,'styles.css'),'utf8');
const idx=fs.readFileSync(path.join(repo,'index.html'),'utf8');
const sprite=idx.slice(idx.indexOf('<svg'), idx.indexOf('</defs></svg>')+13);
/* Report the clay count PER STATE, from the markup, before any stylesheet is glued on. The first
   run of this slice reported "3 clay buttons across 4 states" from a grep over the finished page —
   which contains the inlined `.btn-clay{...}` rule and a comment naming it. The real answer was 1,
   and the difference was a shipped defect. Count the thing that renders, not the file it lives in. */
const RENDERED=STATES.map(([label,teas,sessions])=>[label, render(teas,sessions)]);
const COUNTS=RENDERED.map(([label,html])=>label+' → clay='+(html.match(/class="btn-clay"/g)||[]).length);

/* EACH STATE IS ITS OWN DOCUMENT, LOADED IN AN IFRAME, and that is not presentation fussiness:
   `.bottomnav` is `position:fixed` and `.topbar` is `position:sticky`. Inside a scrolling div they
   resolve against the BROWSER viewport, so four navs would stack at the bottom of the window and
   the sticky headers would never stick — the preview would misrepresent the two pieces of chrome
   this slice is being judged on. An iframe has its own viewport, so both behave as they do on a
   phone. Same reason the door review used iframes for its four heights. */
['light','dark'].forEach(theme=>{
  const files=RENDERED.map(([label,html],i)=>{
    const slug='home-'+theme+'-'+i+'.html';
    fs.writeFileSync(path.join(repo,'fixtures',slug),
      '<!DOCTYPE html><html data-theme="'+theme+'"><head><meta charset="utf-8"><style>'+css
      + '\nhtml,body{height:100%;}body{margin:0;overflow-y:auto;}</style></head><body>'
      + sprite + '<div id="app">' + html + '</div></body></html>');
    return [label, slug];
  });
  fs.writeFileSync(path.join(repo,'fixtures','home-review-'+theme+'.html'),
    '<!DOCTYPE html><html><head><meta charset="utf-8"><style>'
    + 'body{margin:0;padding:16px;background:#8d8d8d;display:flex;gap:16px;align-items:flex-start;overflow-x:auto;}'
    + 'figure{margin:0;color:#fff;font:12px ui-monospace,monospace;}'
    + 'iframe{width:390px;height:844px;border:1px solid #555;border-radius:24px;display:block;margin-top:6px;background:#fff;}'
    + '</style></head><body>'
    + files.map(([label,slug])=>'<figure><figcaption>'+label+'</figcaption>'
        + '<iframe src="'+slug+'"></iframe></figure>').join('')
    + '</body></html>');
});
console.log('wrote fixtures/home-review-{light,dark}.html + 8 state files');
COUNTS.forEach(c=>console.log('  '+c));
const shell=RENDERED[0][1];
console.log('  shell present: topbar='+/class="topbar"/.test(shell)+' wordmark='+/<h1>SlowCup<\/h1>/.test(shell)
  +' avatar='+/avatar-btn/.test(shell)+' nav='+/class="bottomnav"/.test(shell)+' raisedLog='+/bn-log-circle/.test(shell));
