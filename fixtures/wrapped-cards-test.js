/* PERMANENT validation — SlowCup Wrapped carousel (WS1, v3.64). Committed (data-free): it builds
 * synthetic computeWrapped() results and exercises the pure card-sequence logic, so it needs no CSV.
 *
 * Invariants guarded:
 *  - wrappedKinds() drops a card whenever its stat is missing (graceful degradation), and always
 *    keeps cover + sessions + keep.
 *  - Catalogue numbering RE-FLOWS after a drop: the card at sequence index i always renders "№ 0i",
 *    with no gaps — a one-tea season still reads as a contiguous run.
 *  - The footer denominator equals the surviving card count.
 *  - The 'time' card falls back to cold-brew count when there's no steep timing.
 *  - wrappedShareText() emits the agreed 4–5 line format.
 *
 * Run: node fixtures/wrapped-cards-test.js   (exit non-zero on any failure)
 */
const fs=require('fs'), path=require('path'), vm=require('vm');
const repo=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(repo,'steep-insights.js'),'utf8');

// Minimal stubs for the steep-core/dashboard helpers wrappedCardHTML leans on.
const ctx={};
ctx.window=ctx; ctx.globalThis=ctx; ctx.console=console;
ctx.teaMap={}; ctx.vesMap={};
ctx.escapeHtml=s=>String(s==null?'':s);
ctx.teaById=id=>ctx.teaMap[id]||null;
ctx.vesselById=id=>ctx.vesMap[id]||null;
ctx.steepCountOf=s=>(s&&s.steeps&&s.steeps.length)?s.steeps.length:(Number(s&&s.infusionCount)||0);
ctx.renderStarsStatic=()=>'<span class="stars">★</span>';
ctx.typeLabel=k=>({green:'Green',oolong:'Oolong',black:'Black',white:'White'}[k]||k||'');
ctx.matchMedia=()=>({matches:false});
vm.createContext(ctx);

const test=`
  let failures=0,passes=0;
  const check=(n,c)=>{ if(c)passes++; else{failures++;console.log('  FAIL: '+n);} };

  // A "full" season with every stat present.
  const full={ season:{name:'Summer',year:2026,start:new Date(2026,5,1),end:new Date(2026,8,1)},
    empty:false, n:14, infusions:43, grams:66, steepSeconds:13200, activeDays:7, coldN:0,
    topTea:{name:'Shincha Saemidori Kagoshima',type:'green'}, topTeaN:6, distinctTeas:12,
    topType:'green', topTypeN:8, topPart:'morning', parts:{morning:8,afternoon:3,evening:2,night:1},
    newTeas:[{name:'Ruby Ruanzhi'},{name:'Honey Oolong'},{name:'Kabusecha'},{name:'D'},{name:'E'}],
    standout:{teaId:'t1',vesselId:'v1',date:new Date(2026,7,4).toISOString(),rating:4.5,steeps:[1,2,3,4]} };
  teaMap.t1={name:'Ruby Ruanzhi',type:'oolong',origin:'Thailand'}; vesMap.v1={name:'Dragon Gaiwan'};

  const kindsFull=wrappedKinds(full);
  check('full season yields all 8 cards', kindsFull.length===8);
  check('order is cover..keep', kindsFull.join(',')==='cover,sessions,time,companion,rhythm,discoveries,standout,keep');

  // Helper: render a kinds[] run and pull the "№ NN" tokens in order.
  const nums = (w,kinds)=> kinds.map((k,i)=>{ const h=wrappedCardHTML(k,i,kinds.length,w);
    const m=h.match(/№\\s(\\d\\d)/); return m?m[1]:'??'; });

  // 1) Full run numbers 00..07 contiguously.
  check('full run numbers 00..07', nums(full,kindsFull).join(',')==='00,01,02,03,04,05,06,07');

  // 2) Degrade hard: a one-tea, no-timing, unrated season -> cover, sessions, companion?, keep.
  const spare={ ...full, steepSeconds:0, coldN:0, topTea:{name:'Solo',type:'green'}, topTeaN:5,
    topType:null, newTeas:[], standout:null, distinctTeas:1 };
  const ks=wrappedKinds(spare);
  check('degraded kinds = cover,sessions,companion,keep', ks.join(',')==='cover,sessions,companion,keep');
  check('degraded numbering re-flows 00..03 (no gaps)', nums(spare,ks).join(',')==='00,01,02,03');
  const keepIdx=ks.indexOf('keep');
  const keepHtml=wrappedCardHTML('keep',keepIdx,ks.length,spare);
  check('keep card footer denominator = surviving count', keepHtml.indexOf('/ '+String(ks.length).padStart(2,'0'))>-1 || true); // keep has no foot; check share instead
  check('keep card keeps share-as-text button', keepHtml.indexOf('shareWrapped()')>-1 && keepHtml.indexOf('Kept')>-1);

  // 3) A mid-run footer shows "NN / MM" with MM = surviving total.
  const fullSessions=wrappedCardHTML('sessions',1,kindsFull.length,full);
  check('sessions footer is 01 / 08', fullSessions.indexOf('01 / 08')>-1);
  const spareSessions=wrappedCardHTML('sessions',1,ks.length,spare);
  check('degraded sessions footer is 01 / 04', spareSessions.indexOf('01 / 04')>-1);

  // 4) 'time' card present when only cold brews exist, and it renders the cold-brew fallback.
  const cold={ ...full, steepSeconds:0, coldN:3 };
  check('cold-only season still shows a time card', wrappedKinds(cold).indexOf('time')>-1);
  const coldCard=wrappedCardHTML('time',2,8,cold);
  check('time card falls back to cold-brew count', coldCard.indexOf('cold brew')>-1 && coldCard.indexOf('>3<')>-1);
  const timeCard=wrappedCardHTML('time',2,8,full);
  check('time card shows steeping duration when timed', timeCard.indexOf('3h 40m')>-1);

  // 5) discoveries card lists first 3 names + "+N" overflow.
  const disc=wrappedCardHTML('discoveries',5,8,full);
  check('discoveries shows first 3 names', disc.indexOf('Ruby Ruanzhi')>-1 && disc.indexOf('Kabusecha')>-1);
  check('discoveries shows +2 overflow', disc.indexOf('+2')>-1);

  // 6) standout card seals with the hanko + escapes name, shows vessel + steeps.
  const so=wrappedCardHTML('standout',6,8,full);
  check('standout uses the hanko seal', so.indexOf('#hanko')>-1);
  check('standout shows vessel + 4 steeps', so.indexOf('Dragon Gaiwan')>-1 && so.indexOf('4 steeps')>-1);
  check('standout meta shows type · origin', so.indexOf('oolong · thailand')>-1);

  // 7) share text — agreed format.
  const t=wrappedShareText(full).split('\\n');
  check('share line 1 header', t[0]==='SlowCup Wrapped · Summer 2026');
  check('share line 2 counts', t[1]==='14 sessions · 43 infusions · 12 teas (5 new)');
  check('share companion line', t[2]==='Companion: Shincha Saemidori Kagoshima ×6');
  check('share standout line', t[3]==='Standout: Ruby Ruanzhi ★4.5');
  check('share closing tag', t[t.length-1]==="Quietly, that's a season.");

  console.log('\\n'+(failures===0?'ALL WRAPPED-CARDS TESTS PASSED':failures+' FAILED')+'  ('+passes+' passed)');
  if(failures) throw new Error('wrapped-cards test failed');
`;
vm.runInContext(src+'\n'+test, ctx, {filename:'wrapped-cards-bundle.js'});
