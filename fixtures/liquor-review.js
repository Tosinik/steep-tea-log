/* local-only: render the liquor ramp and the real shelf's resolution, for a human to look at.
 *
 * WHY NOT A SHELF RENDER. Nothing renders a liquor yet — the cascade and the migration are the next
 * slice, so the shelf still draws its type tint and would look identical to yesterday. Rendering it
 * would show a human nothing and imply everything. What this slice actually produced is a colour
 * JUDGEMENT, so that is what gets drawn: the ramp at Bundle 1's geometry, and every one of
 * Niklas's 21 teas under the stop it resolves to.
 *
 * The two groupings §9 flags for a human check are the point of the second panel — `gold-pale`
 * holding a Fujian white beside a Thai Ruby Ruanzhi, a yellow tea and a Yunnan silver bud, and
 * `copper` arriving at Oriental Beauty from the opposite direction to hojicha. Those are plausible
 * on paper and were assigned by a lane that has not drunk them.
 */
const fs=require('fs'), path=require('path'), vm=require('vm');
const repo=path.resolve(__dirname,'..');
const SRC=['steep-knowledge.js','steep-tea-types.js','steep-core.js','steep-settings.js',
  'steep-dashboard.js','steep-insights.js','steep-teas.js','steep-reference.js',
  'steep-shopping.js','steep-passport.js','steep-social.js','steep-sessions.js']
  .map(f=>fs.readFileSync(path.join(repo,f),'utf8')).join('\n;\n');
const ctx={};ctx.window=ctx;ctx.globalThis=ctx;ctx.console={log(){},warn(){},error(){}};
ctx.document={documentElement:{setAttribute(){},getAttribute:()=>'light'},getElementById:()=>null,
  querySelectorAll:()=>[],querySelector:()=>null,addEventListener(){},
  createElement:()=>({style:{},setAttribute(){},appendChild(){},classList:{add(){},remove(){}}})};
ctx.localStorage={getItem:()=>null,setItem(){},removeItem(){}};
ctx.matchMedia=()=>({matches:false});ctx.navigator={onLine:true};
ctx.setTimeout=()=>{};ctx.clearTimeout=()=>{};ctx.setInterval=()=>{};ctx.clearInterval=()=>{};
ctx.addEventListener=()=>{};ctx.SteepDB={newId:()=>'x',getUser:()=>({id:'u'})};
vm.createContext(ctx);vm.runInContext(SRC,ctx);
const G=e=>vm.runInContext(e,ctx);

function parseCSV(t){const R=[];let r=[],c='',q=false;for(let i=0;i<t.length;i++){const ch=t[i];
 if(q){if(ch==='"'){if(t[i+1]==='"'){c+='"';i++;}else q=false;}else c+=ch;}
 else if(ch==='"')q=true;else if(ch===','){r.push(c);c='';}
 else if(ch==='\n'){r.push(c);R.push(r);r=[];c='';}else if(ch!=='\r')c+=ch;}
 if(c||r.length){r.push(c);R.push(r);}
 const h=(R[0]||[]).map(x=>x.trim());
 return R.slice(1).filter(x=>x.length===h.length).map(x=>Object.fromEntries(h.map((k,i)=>[k,x[i]])));}
const rows=f=>parseCSV(fs.readFileSync(path.join(repo,'fixtures',f),'utf8'));
const OWNER=rows('sessions_rows.csv')[0].user_id;
const TEAS=rows('teas_rows.csv').filter(t=>t.user_id===OWNER);

const RAMP=['jade-pale','straw','ivory','yellow-pale','gold-pale','gold','amber','amber-deep','copper','mahogany','sepia','near-black'];
/* The heading's number is DERIVED, and the page self-checks it below. It read "ten stops" while
   drawing twelve for two versions: A5 added ivory and yellow-pale and the caption did not follow.
   That is the ninth instance of a stale count this round and the only one in a HUMAN-FACING
   artifact — the one place a wrong number is believed, because no suite reads a generated page.
   Nothing committed can assert it either: this harness is untracked by design (fixtures/* is
   ignored), so the check has to live in the thing that makes the claim. */
const NUM={10:'ten',11:'eleven',12:'twelve',13:'thirteen',14:'fourteen'};
const WHAT={'jade-pale':'Japanese green','straw':'Chinese green',
  'ivory':'bud-only whites — A5, tasted (Ya Bao) + inferred (Silver Needle)',
  'yellow-pale':'yellow tea — A5, men huang; placed BY TASTE, against the rule',
  'gold-pale':'white · light oolong','gold':'light gaoshan','amber':'bug-bitten honey oolong',
  'amber-deep':'Wuyi yancha','copper':'high-oxidation · roasted green','mahogany':'hong cha',
  'sepia':'hei cha','near-black':'shou pu-erh'};

const css=fs.readFileSync(path.join(repo,'styles.css'),'utf8');
if(!/--liquor-near-black:/.test(css)) throw new Error('ramp tokens not in styles.css — a review page built from a missing ramp would render ten empty boxes and read as a design failure');

// Resolve every shelf tea through the SHIPPED matcher, never a copy of its rule.
const resolved=TEAS.map(t=>{
  const m=G('matchTeaType('+JSON.stringify(t.name)+')');
  const liquor=m?G('resolveTeaType('+JSON.stringify(m.slug)+')').liquor:undefined;
  return {name:t.name, type:t.type, slug:m?m.slug:null, liquor};
});
const byStop={}; resolved.forEach(r=>{ if(r.liquor) (byStop[r.liquor]=byStop[r.liquor]||[]).push(r); });
const tier3=resolved.filter(r=>!r.liquor);
const distinct=Object.keys(byStop).length;

const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const sw=(k,px)=>'<span class="lq" style="background:var(--liquor-'+k+');'
  + (px==='sm'?'width:15px;height:20px;border-radius:6px 3px 5px 3px;':'width:24px;height:32px;border-radius:9px 4px 8px 5px;')+'"></span>';

const rampPanel = RAMP.map(k=>{
  const n=(byStop[k]||[]).length;
  return '<div class="row">'+sw(k)+'<div class="col"><b>'+k+'</b><span class="mut">'+WHAT[k]+'</span></div>'
    + '<span class="n">'+(n?n+' on shelf':'—')+'</span></div>';
}).join('');

const shelfPanel = RAMP.filter(k=>byStop[k]).map(k=>
  '<div class="grp"><div class="ghead">'+sw(k,'sm')+'<b>'+k+'</b><span class="mut">'+(byStop[k].length)+'</span></div>'
  + byStop[k].map(r=>'<div class="tea">'+esc(r.name)+' <span class="mut">'+esc(r.slug)+'</span></div>').join('')
  + '</div>').join('')
  + '<div class="grp t3"><div class="ghead"><b>tier 3 — the type tint</b><span class="mut">'+tier3.length+'</span></div>'
  + tier3.map(r=>'<div class="tea">'+esc(r.name)+' <span class="mut">'+(r.slug?esc(r.slug)+' · deliberately null':'no catalog match')+'</span></div>').join('')
  + '</div>';

/* v4.15: the three slots RENDERED, from their own shipped functions. Until now this page drew the
   ramp and a resolution table — correct while nothing painted a swatch. Now something does, so the
   page shows the real markup: a Go Deeper row, a passed-tea tile, and a diary line. */
G('state.teas='+JSON.stringify(TEAS.map(t=>({id:t.id,name:t.name,type:t.type})))+';state.refOpen=null;state.settings=Object.assign({},DEFAULT_SETTINGS);');
const catRow = k => {
  const cat = G('browseTeaTypes()').find(c=>c.type.liquor===k) || G('browseTeaTypes()').find(c=>!c.type.liquor);
  return cat ? G('refRowHTML('+JSON.stringify(cat)+', [])') : '';
};
const slotPanel =
  '<h2>The three slots, rendered</h2>'
  + '<div class="mut" style="margin-bottom:10px">Go Deeper rows · a passed-tea tile · a diary line. '
  + 'Eleven catalog rows are deliberately null and fall back to the family tint — that is tier 3, not a gap.</div>'
  + '<div class="slots">' + ['amber-deep','ivory','yellow-pale',null].map(k=>catRow(k)).join('') + '</div>'
  + '<div class="ghead" style="margin-top:14px"><b>passed to you</b></div><div class="tiles">'
  + ['Honey Oolong Gui Fei','Yunnan Silver Bud Ya Bao','Huang Ya Yellow Tips','Yashi Xiang Dancong Guangdong']
      .map(n=>{const r=resolved.find(x=>x.name===n)||{};
        return '<span class="tilewrap">'+G('socialTileHTML('+JSON.stringify(r.type||'oolong')+','+JSON.stringify(n)+')')
        +'<span class="mut">'+esc(n.split(' ').slice(0,2).join(' '))+'</span></span>';}).join('')
  + '</div>';

['light','dark'].forEach(theme=>{
  fs.writeFileSync(path.join(repo,'fixtures','liquor-review-'+theme+'.html'),
    '<!DOCTYPE html><html data-theme="'+theme+'"><head><meta charset="utf-8"><style>'+css
    + '\nbody{margin:0;padding:22px;background:var(--porcelain);color:var(--ink);font-family:Inter,sans-serif;display:flex;gap:26px;align-items:flex-start;flex-wrap:wrap;}'
    + '\n.panel{width:420px;}h2{font-family:var(--font-display);font-size:19px;margin:0 0 10px;}'
    + '\n.row{display:flex;align-items:center;gap:12px;padding:7px 0;border-bottom:1px solid var(--line);}'
    + '\n.col{flex:1;display:flex;flex-direction:column;}.mut{color:var(--ink-soft);font-size:11.5px;}'
    + '\n.n{font-family:var(--font-mono);font-size:11px;color:var(--ink-soft);}'
    + '\n.lq{flex:none;display:inline-block;border:1px solid rgba(0,0,0,.10);}'
    + '\n.grp{margin-bottom:14px;}.ghead{display:flex;align-items:center;gap:9px;margin-bottom:4px;}'
    + '\n.tea{font-size:13px;padding:2px 0 2px 26px;}.t3{opacity:.72;}'
    + '</style></head><body>'
    + '<div class="panel"><h2>The ramp — '+NUM[RAMP.length]+' stops, Bundle 1 geometry</h2>'+rampPanel+'</div>'
    + '<div class="panel"><h2>Niklas\'s shelf — '+distinct+' swatches over '+(21-tier3.length)+' teas</h2>'+shelfPanel+'</div>'
    + '<div class="panel">'+slotPanel+'</div>'
    + '</body></html>');
});
/* SELF-CHECK: the page must not claim a number it does not draw. Counts the ramp panel's own
   rendered swatches and compares them with the heading, throwing rather than writing a page that
   misinforms — the anchor-throws-on-miss rule applied to an artifact instead of an edit. */
['light','dark'].forEach(theme=>{
  const page=fs.readFileSync(path.join(repo,'fixtures','liquor-review-'+theme+'.html'),'utf8');
  const claimed=(page.match(/The ramp — (\w+) stops/)||[])[1];
  const drawn=(page.match(/class="lq" style="background:var\(--liquor-[a-z-]+\);width:24px/g)||[]).length;
  if(NUM[RAMP.length]!==claimed || drawn!==RAMP.length)
    throw new Error('review page misstates itself ('+theme+'): heading says "'+claimed+'", draws '+drawn+' of '+RAMP.length);
});
console.log('wrote fixtures/liquor-review-{light,dark}.html');
console.log('  heading/render agree: '+NUM[RAMP.length]+' stops drawn and claimed');
console.log('  distinct swatches: '+distinct+'  ·  tier 2: '+(21-tier3.length)+'  ·  tier 3: '+tier3.length);
console.log('  §9 wants a human on: gold-pale ['+(byStop['gold-pale']||[]).map(r=>r.name).join(' · ')+']');
