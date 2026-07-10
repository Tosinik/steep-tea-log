/* PERMANENT validation — WS2 Insights "reflective room" (v3.65). Committed (data-free): it builds a
 * synthetic state and exercises the pure section builders. No CSV needed.
 *
 * Invariants guarded:
 *  - THE BRAND GUARDRAIL: the hero + the four viz observations are OBSERVATIONS, NOT KPIs — they must
 *    never contain an up/down arrow (↑ ↓ →), a percentage, or a "vs" comparison. (The Wrapped teaser's
 *    → is decorative navigation and is checked separately.) If a future edit grows an arrow/%/target on
 *    an observation, this fails loudly — the exact drift the design forbids.
 *  - Graceful degradation: each section returns '' when its data is missing (renderDashboard skips empties).
 *  - Structure: hero states top type + time-of-day; type bar segments sum ~100% with a legend; steep
 *    shape reads as ascending with a ledger caption; the two notes carry the leaf + hanko.
 *
 * Run: node fixtures/insights-room-test.js   (exit non-zero on any failure)
 */
const fs=require('fs'), path=require('path'), vm=require('vm');
const repo=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(repo,'steep-insights.js'),'utf8');

const ctx={}; ctx.window=ctx; ctx.globalThis=ctx; ctx.console=console;
ctx.TYPES=[{k:'green',label:'Green'},{k:'black',label:'Black'},{k:'oolong',label:'Oolong'},{k:'puerh',label:'Pu-erh'},{k:'yellow',label:'Yellow'},{k:'white',label:'White'}];
ctx.escapeHtml=s=>String(s==null?'':s);
ctx.typeLabel=k=>({green:'Green',oolong:'Oolong',black:'Black',white:'White',puerh:'Pu-erh',yellow:'Yellow'}[k]||k);
ctx.steepCountOf=s=>(s&&s.steeps&&s.steeps.length)?s.steeps.length:(Number(s&&s.infusionCount)||0);
ctx.renderStarsStatic=()=>'<span class="stars">★</span>';
ctx.fmtSecShort=sec=>{ sec=Math.round(sec); if(sec<60) return sec+'s'; const m=Math.floor(sec/60),r=sec%60; return r?`${m}m${r}s`:`${m}m`; };
ctx.dayKey=d=>{ const x=new Date(d); return x.getFullYear()+'-'+x.getMonth()+'-'+x.getDate(); };
const TEAS={ 'g':{name:'Shincha Saemidori',type:'green'}, 'o':{name:'Honey Oolong',type:'oolong'}, 'b':{name:'Ruby Ruanzhi',type:'black'}, 'w':{name:'Silver Needle',type:'white'} };
ctx.teaById=id=>TEAS[id]||null;
ctx.vesselById=()=>({name:'Gaiwan'});
vm.createContext(ctx);

// Build ~24 morning sessions across the last 8 weeks: green-heavy, ascending steep times.
function buildState(){
  const now=Date.now(), DAY=86400000, sessions=[];
  const teaCycle=['g','g','g','g','g','g','g','g','g','g','o','o','o','o','o','o','b','b','b','w','w','w','g','g'];
  for(let i=0;i<24;i++){
    const week=Math.floor(i/3), k=i%3;
    const d=new Date(now-(week*7+k*2)*DAY); d.setHours(8,0,0,0);   // 8am → morning
    sessions.push({ id:'s'+i, teaId:teaCycle[i], date:d.toISOString(), vesselId:'v1', rating:(i%5)+1,
      steeps:[{timeSeconds:35},{timeSeconds:45},{timeSeconds:58}] });
  }
  return { sessions, teas:Object.entries(TEAS).map(([id,t])=>({id,...t})) };
}
ctx.state=buildState();

const test=`
  let failures=0,passes=0;
  const check=(n,c)=>{ if(c)passes++; else{failures++;console.log('  FAIL: '+n);} };
  // Check only VISIBLE text — strip tags so CSS units (height:100%) in style attributes don't count.
  const noKPI=(label,html)=>{ const text=html.replace(/<[^>]*>/g,' ');
    check(label+' has no arrow', !/[\\u2191\\u2193\\u2192]/.test(text));
    check(label+' has no percentage', text.indexOf('%')<0);
    check(label+' has no "vs"', !/\\bvs\\b/.test(text)); };

  // synthetic computeStats slice for typemix + notes
  const s={ typeCounts:{ green:{count:12}, oolong:{count:6}, black:{count:3}, white:{count:3}, puerh:{count:0}, yellow:{count:0} },
    mostBrewed:[{tea:{name:'Shincha Saemidori'},count:6}], topRated:[{name:'Ruby Ruanzhi',rating:4.5}] };

  const hero=insHeroHTML(), reading=insReadingHTML(), typemix=insTypeMixHTML(s), shape=insSteepShapeHTML(), notes=insNotesHTML(s), teaser=insWrappedTeaserHTML();

  // 1) THE GUARDRAIL — observations, not KPIs.
  noKPI('hero', hero); noKPI('reading', reading); noKPI('type mix', typemix); noKPI('steep shape', shape);

  // 2) Hero — top type (green) + time of day (mornings), honest eyebrow.
  check('hero names the top type', hero.indexOf('Green,')>-1);
  check('hero names the time of day', hero.indexOf('mornings')>-1);
  check('hero eyebrow present', /This week, mostly|Lately, mostly|Mostly/.test(hero));
  check('hero draws the mini rhythm bars', (hero.match(/class="ins-bar"/g)||[]).length===12);

  // 3) Reading — an approved observation sentence + a sparkline, NO arrow (covered above).
  check('reading renders (enough weeks)', reading.indexOf('ins-spark')>-1);
  check('reading obs is a sentence', /last month|week by week/.test(reading));

  // 4) Type mix — 'leads' observation, 4 segments, legend, widths ~100%.
  check('type mix says leads', typemix.indexOf('leads')>-1);
  check('type mix has 4 segments', (typemix.match(/ins-typebar[\\s\\S]*?<\\/div>/)[0].match(/<span/g)||[]).length===4);
  check('type mix has a legend', typemix.indexOf('ins-legend')>-1);
  (function(){ const seg=[...typemix.matchAll(/width:([\\d.]+)%/g)].map(m=>parseFloat(m[1])); const sum=seg.reduce((a,b)=>a+b,0); check('type widths sum ~100 ('+sum.toFixed(1)+')', Math.abs(sum-100)<0.6); })();

  // 5) Steep shape — ascending observation + ledger caption of times.
  check('steep shape ascending obs', shape.indexOf('stretch')>-1);
  check('steep shape caption has times', /35s · 45s · 58s/.test(shape));
  check('steep shape is amber', shape.indexOf('var(--amber)')>-1);

  // 6) Two quiet notes — leaf (most reached-for) + hanko (highest note).
  check('note: most reached-for', notes.indexOf('Most reached-for')>-1 && notes.indexOf('#fav-leaf')>-1 && notes.indexOf('×6')>-1);
  check('note: highest note sealed with hanko', notes.indexOf('Highest note')>-1 && notes.indexOf('#hanko')>-1);

  // 7) Teaser — deep-jade strip into Wrapped (its → is decorative nav, allowed).
  check('teaser links to wrapped', teaser.indexOf("goView('wrapped')")>-1 && teaser.indexOf('wrapped')>-1);

  // 8) Graceful degradation — a bare state drops the data-hungry sections.
  const bareTypes={ typeCounts:{green:{count:1},oolong:{count:0},black:{count:0},white:{count:0},puerh:{count:0},yellow:{count:0}}, mostBrewed:[], topRated:[] };
  check('type mix drops with <2 types', insTypeMixHTML(bareTypes)==='');
  check('notes drop with nothing to note', insNotesHTML(bareTypes)==='');
  state.sessions=[{id:'x',teaId:'g',date:new Date().toISOString(),vesselId:'v1',rating:0,steeps:[]}];
  check('reading drops with one week of data', insReadingHTML()==='');
  check('steep shape drops with no timed steeps', insSteepShapeHTML()==='');
  check('hero still shows with one session', insHeroHTML().indexOf('Green')>-1);

  console.log('\\n'+(failures===0?'ALL INSIGHTS-ROOM TESTS PASSED':failures+' FAILED')+'  ('+passes+' passed)');
  if(failures) throw new Error('insights-room test failed');
`;
vm.runInContext(src+'\n'+test, ctx, {filename:'insights-room-bundle.js'});
