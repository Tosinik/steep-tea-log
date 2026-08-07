// greeting-v4-test.js — v3.70 habit-aware greeting (issues #4 + #5).
// Guards the DECIDED brand rules: zero-session evening line is guilt-free (evening-only, no counts),
// more-than-usual is celebratory (threshold math + signal gate), rediscovery is deterministic and
// honours the ≥REDISCOVERY_WEEKS predicate, and every suggestion keeps its tap-target intact.
// Time-relative + determinism-based, so scenarios are synthetic with a MOCKED clock (per vm-fixture
// conventions); one grounding block renders over the real CSV export.
const fs=require('fs'),path=require('path'),vm=require('vm');
const REPO=path.resolve(__dirname,'..');
const SRC=['steep-knowledge.js','steep-core.js','steep-dashboard.js']
  .map(f=>fs.readFileSync(path.join(REPO,f),'utf8')).join('\n;\n');
const ctx={};ctx.window=ctx;ctx.globalThis=ctx;ctx.console=console;
ctx.document={documentElement:{setAttribute(){},getAttribute(){return'light'}},
  getElementById:()=>null,querySelectorAll:()=>[],
  createElement:()=>({style:{},setAttribute(){},appendChild(){},classList:{add(){}}})};
ctx.localStorage={getItem:()=>null,setItem(){},removeItem(){}};
ctx.matchMedia=()=>({matches:false});ctx.navigator={onLine:true};
ctx.setTimeout=()=>{};ctx.clearTimeout=()=>{};ctx.setInterval=()=>{};ctx.clearInterval=()=>{};
ctx.addEventListener=()=>{};
const RealDate=Date;
vm.createContext(ctx);vm.runInContext(SRC,ctx);
vm.runInContext('state.settings=Object.assign({},DEFAULT_SETTINGS);',ctx);

// ---- clock control: new Date() (no args) and Date.now() report a fixed ms; args parse normally ----
function setNow(ms){
  class Fake extends RealDate { constructor(...a){ if(a.length===0) super(ms); else super(...a); } static now(){ return ms; } }
  ctx.Date = Fake;
}
function clearNow(){ ctx.Date = RealDate; }
const localMs=(y,m,d,h)=> new RealDate(y,m-1,d,h,0,0).getTime();
const isoAt =(y,m,d,h)=> new RealDate(y,m-1,d,h,0,0).toISOString();

// ---- scenario helpers ----
let TID=0;
const tea=(o)=>Object.assign({ id:'t'+(++TID), name:'Tea'+TID, type:'green', rating:0, amountGrams:20, isFavorite:false }, o);
const sess=(teaId,y,m,d,h)=>({ id:'s'+(++TID), teaId, date:isoAt(y,m,d,h), steeps:[] });
function setState(teas, sessions){
  vm.runInContext('state.teas='+JSON.stringify(teas)+'; state.sessions='+JSON.stringify(sessions)+';', ctx);
}
// v4.10: `greetingCardHTML` became `greetingMastheadHTML` when R115 made the greeting the masthead.
// The ENGINE below is untouched — bucket copy, pick scoring, recency, the one-voice-per-day hash —
// so this suite is renamed at its entry point and nothing else. A rename is not a rewrite.
function greet(){ return vm.runInContext('greetingMastheadHTML()', ctx); }
const call=(expr)=>vm.runInContext(expr, ctx);

let passed=0; const fail=(m)=>{ console.error('FAIL: '+m); process.exit(1); };
const ok=(c,m)=>{ if(!c) fail(m); passed++; };
const hasTap=(html)=>/openTeaDetail\(/.test(html);   // a suggested tea is always a tap-target
// WS2 (v3.74) reskinned the greeting card: the body moved from an inline-styled div to .greeting-body.
const sub=(html)=>{ const m=html.match(/class="greeting-body">([\s\S]*?)<\/div>/); return m?m[1]:''; };

// ===== A. Zero-session EVENING line (issue #4) — guilt-free, evening-only, no counts =====
(function(){
  // Morning drinker: 5 sessions across 5 past days, all morning. Enough signal; evening/night inactive.
  const t=tea({}); const hist=[]; for(let d=1;d<=5;d++) hist.push(sess(t.id,2026,7,d,8));
  setState([t], hist);

  setNow(localMs(2026,7,10,20));                       // evening, nothing logged today
  const ev=greet();
  ok(!hasTap(ev), 'A1 evening zero-session shows NO tea suggestion (off branch, not a nudge)');
  ok(!/\d/.test(sub(ev)), 'A2 zero-session line contains no digit (never references counts)');
  ok(!/(no time for|we missed|you haven|streak|in a row|consecutive|without tea)/i.test(sub(ev)),
     'A3 zero-session line is guilt-free (no absence-scolding register)');

  setNow(localMs(2026,7,10,8));                        // SAME day, morning → must NOT be the off line
  const morn=greet();
  ok(hasTap(morn), 'A4 morning of a zero-session day still suggests a tea (evening-only rule)');

  setNow(localMs(2026,7,11,8));                        // next morning → gone by morning
  ok(hasTap(greet()), 'A5 following morning never shows the off line');

  // Evening DRINKER (evening active) must get a normal suggestion, not the day-off line.
  const t2=tea({}); const eh=[]; for(let d=1;d<=5;d++) eh.push(sess(t2.id,2026,7,d,20));
  setState([t2], eh);
  setNow(localMs(2026,7,10,20));
  ok(hasTap(greet()), 'A6 an evening drinker gets a suggestion in the evening (not the off line)');
  clearNow();
  console.log('  A zero-session evening: 6 checks');
})();

// ===== B. More-than-usual day (issue #4) — threshold math + signal gate + celebratory register =====
(function(){
  // typicalPerDay excludes today; needs 5-distinct-day signal.
  ok(call('d_typicalPerDay')!==undefined, 'B0 d_typicalPerDay defined');
  ok(call('d_ordinal(3)')==='third' && call('d_ordinal(11)')==='11th', 'B1 ordinal words then fallback');

  const t=tea({});
  // 5 past days, 1 session each = typical 1.0. Today: 3 evening sessions → bigDay.
  let rows=[]; for(let d=1;d<=5;d++) rows.push(sess(t.id,2026,7,d,8));
  for(let i=0;i<3;i++) rows.push(sess(t.id,2026,7,10,20));
  setState([t], rows);
  ok(Math.abs(call('d_typicalPerDay("2026-07-10")')-1) < 1e-9, 'B2 typical/day excludes today (=1.0)');
  setNow(localMs(2026,7,10,20));
  const big=sub(greet());
  ok(/tea day|earning its keep|approves|looked-after|humming|More tea than usual|many pours/i.test(big),
     'B3 more-than-usual day uses the celebratory ack');
  ok(!/(more energy|need caffeine|another cup|keep going|don.t stop)/i.test(big),
     'B4 celebratory line never nags for more consumption');

  // Threshold false: typical 3/day, today 3 → NOT more than usual.
  let r2=[]; for(let d=1;d<=5;d++){ for(let k=0;k<3;k++) r2.push(sess(t.id,2026,7,d,8)); }
  for(let i=0;i<3;i++) r2.push(sess(t.id,2026,7,10,20));
  setState([t], r2);
  ok(call('d_typicalPerDay("2026-07-10")')===3, 'B5 typical=3.0 baseline');
  setNow(localMs(2026,7,10,20));
  ok(!/tea day|earning its keep|looked-after|humming|many pours/i.test(sub(greet())),
     'B6 today==typical is not celebrated as a big day');

  // Signal gate: only 4 distinct days of history → typical null → no big-day claim even with 5 today.
  let r3=[]; for(let d=1;d<=4;d++) r3.push(sess(t.id,2026,7,d,8));
  for(let i=0;i<5;i++) r3.push(sess(t.id,2026,7,10,20));
  setState([t], r3);
  ok(call('d_typicalPerDay("2026-07-10")')===null, 'B7 <5-day signal → null (no baseline)');
  setNow(localMs(2026,7,10,20));
  ok(!/tea day|earning its keep|looked-after|humming|many pours/i.test(sub(greet())),
     'B8 no big-day line without a 5-day signal');
  clearNow();
  console.log('  B more-than-usual: 9 checks');
})();

// ===== C. Rediscovery (issue #5) — determinism + ≥N-weeks predicate + tap-target =====
(function(){
  setNow(localMs(2026,7,10,14));
  // Predicate unit tests via d_rediscoveryPick (REDISCOVERY_WEEKS ships at 3).
  const tRecent=tea({name:'Recent'}), tOld=tea({name:'Old'}), tNever=tea({name:'Never'});
  // Recent brewed 10d ago; Old brewed 30d ago; Never has no session.
  const rr=[ sess(tRecent.id,2026,6,30,8), sess(tOld.id,2026,6,10,8) ];
  setState([tRecent,tOld,tNever], rr);
  let pick=call('(function(){var p=d_rediscoveryPick("2026-07-10",null,null);return p?{name:teaById(p.t.id).name,weeks:p.weeks}:null;})()');
  ok(pick && pick.name==='Never' && pick.weeks===null, 'C1 never-brewed in-stock tea is the top rediscovery pick (weeks null)');
  // Remove Never → Old (30d ≥ 3wk) wins; Recent (10d) excluded.
  setState([tRecent,tOld], rr);
  pick=call('(function(){var p=d_rediscoveryPick("2026-07-10",null,null);return p?{name:teaById(p.t.id).name,weeks:p.weeks}:null;})()');
  ok(pick && pick.name==='Old' && pick.weeks>=4, 'C2 ≥3-week tea qualifies; recent (10d) excluded');
  // Only a recent tea → no candidate.
  setState([tRecent], [ sess(tRecent.id,2026,6,30,8) ]);
  ok(call('d_rediscoveryPick("2026-07-10",null,null)')===null, 'C3 all-recent shelf → no rediscovery candidate');

  // Determinism of the day-roll seed.
  ok(call('d_hash("2026-07-10|shelf")')===call('d_hash("2026-07-10|shelf")'), 'C4 shelf roll hash is stable');

  // Find dates where the 1-in-4 roll fires / doesn't (so the integration test is deterministic).
  // FROM DAY 8, not day 1, and that is a real precondition rather than test bookkeeping: since R123
  // rediscovery is reached only on a day with NO sittings, and this scenario's history occupies
  // 08-01..06. A firing day inside that window would take the acknowledgement branch, and C6 would
  // have been asserting the fall-through while a different branch answered.
  let firesKey=null, skipsKey=null;
  for(let d=8; d<=31 && (!firesKey||!skipsKey); d++){
    const k='2026-08-'+String(d).padStart(2,'0');
    const r=call('d_hash("'+k+'|shelf") % REDISCOVERY_ODDS');
    if(r===0 && !firesKey) firesKey={d};
    if(r!==0 && !skipsKey) skipsKey={d};
  }
  ok(firesKey && skipsKey, 'C5 found both a firing and a non-firing day for the roll');

  // Integration: firing day, enough signal, no session in current bucket, a never-brewed candidate present.
  const drinker=tea({name:'Habit'}), forgotten=tea({name:'Forgotten'});
  const hist=[]; for(let d=1;d<=6;d++) hist.push(sess(drinker.id,2026,8,d,8));  // morning history, 6 sessions
  setState([drinker,forgotten], hist);
  setNow(localMs(2026,8,firesKey.d,14));   // afternoon, no session today
  const rd=greet();
  ok(/remember|waiting|unopened|waited|never been steeped/i.test(sub(rd)), 'C6 firing day surfaces a rediscovery line');
  ok(hasTap(rd), 'C7 rediscovery keeps the tea tap-target');
  ok(rd===greet(), 'C8 rediscovery output is stable across renders (deterministic)');

  // Non-firing day → normal suggestion, not a rediscovery line.
  setNow(localMs(2026,8,skipsKey.d,14));
  ok(!/remember|unopened|never been steeped/i.test(sub(greet())), 'C9 non-firing day shows a normal suggestion');
  clearNow();
  console.log('  C rediscovery: 9 checks');
})();

// ===== D. Grounding — render over the REAL CSV export at every bucket without error =====
(function(){
  function parseCSV(t){const R=[];let r=[],c='',q=false;for(let i=0;i<t.length;i++){const ch=t[i];
   if(q){if(ch==='"'){if(t[i+1]==='"'){c+='"';i++;}else q=false;}else c+=ch;}
   else if(ch==='"')q=true;else if(ch===','){r.push(c);c='';}
   else if(ch==='\n'){r.push(c);R.push(r);r=[];c='';}else if(ch!=='\r')c+=ch;}
   if(c||r.length){r.push(c);R.push(r);}
   const h=R[0];return R.slice(1).filter(x=>x.length===h.length).map(x=>Object.fromEntries(h.map((k,i)=>[k,x[i]])));}
  const rows=f=>parseCSV(fs.readFileSync(path.join(__dirname,f),'utf8'));
  let teas, sessions;
  try {
    teas = rows('teas_rows.csv').map(t=>({ id:t.id, name:t.name, type:t.type, rating:Number(t.rating)||0,
      amountGrams:t.amount_grams===''?null:Number(t.amount_grams), isFavorite:t.is_favorite==='true'||t.is_favorite==='t' }));
    sessions = rows('sessions_rows.csv').map(s=>({ id:s.id, teaId:s.tea_id, date:s.session_date, steeps:[] }));
  } catch(e){ console.log('  D grounding: SKIPPED (no CSV export present) —', e.code||e.message); return; }
  setState(teas, sessions);
  let n=0;
  for(const [d,h] of [[10,8],[10,14],[10,20],[10,2]]){
    setNow(localMs(2026,7,d,h));
    let html; try { html=greet(); } catch(e){ fail('D real-data render threw at hour '+h+': '+e.message); }
    ok(/<div class="home-masthead"/.test(html) && /<h2/.test(html), 'D render is a well-formed masthead at hour '+h);
    ok(html===greet(), 'D render is deterministic at hour '+h);
    if(hasTap(html)) ok(/openTeaDetail\('[^']+'\)/.test(html), 'D any suggested tea has a real tap-target at hour '+h);
    n++;
  }
  clearNow();
  console.log('  D grounding over real export: '+n+' buckets rendered');
})();

// ===== E. Predicted-vs-actual acknowledgment (v3.67, absorbed from the local greeting-test.js) =====
// Session-aware branch; rediscovery/big-day don't interfere (one session today → not a big day).
const idsIn = html => (html.match(/openTeaDetail\('([^']+)'\)/g)||[]).map(m=>/\('([^']+)'\)/.exec(m)[1]);
(function(){
  const g1={id:'g1',name:'Sencha',type:'green',amountGrams:40,rating:4,isFavorite:false};
  const g2={id:'g2',name:'Gyokuro',type:'green',amountGrams:40,rating:3,isFavorite:false};
  const o1={id:'o1',name:'Dancong',type:'oolong',amountGrams:40,rating:5,isFavorite:true};
  const hist=()=>{ const s=[];
    for(let d=1;d<=4;d++) s.push(sess('g1',2026,6,d,8));   // morning green ×4 → g1 is the morning prediction
    for(let d=1;d<=3;d++) s.push(sess('o1',2026,6,d,14));  // afternoon oolong ×3 → afternoon active
    return s; };
  const ackTaken=/Good choice|a lovely start|in the pot already|as the day called for|Right on cue/;
  const ackSurprise=/didn&rsquo;t see that coming|a nice surprise|not what I&rsquo;d have guessed|off the usual path|and unexpected/;

  // Predicted tea (g1) taken → "good choice" register + forward to the afternoon oolong, never a 2nd green.
  setState([g1,g2,o1], [...hist(), sess('g1',2026,7,8,8)]);  setNow(localMs(2026,7,8,9));
  let s=sub(greet());
  ok(ackTaken.test(s), 'E1 acknowledges the predicted pick (took-predicted register)');
  ok(/this afternoon/.test(s) && idsIn(s).includes('o1'), 'E2 forward-suggests the afternoon oolong');
  ok(!idsIn(s).includes('g2'), 'E3 never suggests a second green same day (variety guard)');

  // Unpredicted tea (g2) logged → warm surprise, names g2, still forwards the oolong (not the green g1).
  setState([g1,g2,o1], [...hist(), sess('g2',2026,7,8,8)]);  setNow(localMs(2026,7,8,9));
  s=sub(greet());
  ok(ackSurprise.test(s), 'E4 warm-surprise register on an unpredicted pick (never scolds)');
  ok(idsIn(s)[0]==='g2', 'E5 names the logged tea in the ack');
  ok(idsIn(s).includes('o1') && !idsIn(s).includes('g1'), 'E6 forward is the oolong, not the predicted green');
  clearNow();
  console.log('  E predicted-vs-actual: 6 checks');
})();

// ===== F. Same-day variety guard + fallback (v3.67, absorbed) =====
(function(){
  const g1={id:'g1',name:'Sencha',type:'green',amountGrams:40,rating:4};
  const g2={id:'g2',name:'Gyokuro',type:'green',amountGrams:40,rating:3};
  const s=[]; for(let d=1;d<=4;d++) s.push(sess('g1',2026,6,d,8));   // morning green
  for(let d=1;d<=3;d++) s.push(sess('g2',2026,6,d,14));             // afternoon green → active, but same type
  s.push(sess('g1',2026,7,8,8));                                    // log a green this morning
  setState([g1,g2], s);  setNow(localMs(2026,7,8,9));
  const out=sub(greet());
  ok(/the kettle can rest|the shelf can rest now|earned its quiet|let it settle|done their part/.test(out),
     'F1 rests when the guard leaves no non-green candidate for later');
  ok(!/this afternoon/.test(out) && idsIn(out).length===1, 'F2 no forward suggestion in the fallback rest branch');
  clearNow();
  console.log('  F variety-guard fallback: 2 checks');
})();

// ===== G. Window-aware redirect determinism (v3.55, absorbed) =====
(function(){
  // Morning-only drinker; "now" is close to history so nothing qualifies for rediscovery (keeps this
  // branch deterministic regardless of the shelf roll).
  const g1={id:'g1',name:'Sencha',type:'green',amountGrams:40,rating:4};
  const s=[]; for(let d=1;d<=6;d++) s.push(sess('g1',2026,7,d,8));  // 6 morning sessions (enough signal)
  setState([g1], s);  setNow(localMs(2026,7,10,14));                // afternoon, inactive, no session today
  const html=greet();
  ok(/tomorrow morning/.test(sub(html)), 'G1 inactive afternoon redirects forward to tomorrow morning');
  ok(hasTap(html), 'G2 redirect keeps the tea tap-target');
  ok(greet()===html, 'G3 redirect is deterministic across renders');

  // <5 sessions → too little signal to redirect; suggest for NOW even in an empty bucket.
  const s2=[ sess('g1',2026,7,1,8), sess('g1',2026,7,2,8) ];
  setState([g1], s2);  setNow(localMs(2026,7,10,14));
  ok(!/waiting for|for tomorrow/.test(greet()), 'G4 <5-session signal keeps now-copy (no forward redirect)');
  clearNow();
  console.log('  G redirect determinism: 4 checks');
})();

// ===== H. #25 recency window — soft penalty, PRIOR days only, habitual still surfaces =====
(function(){
  setNow(localMs(2026,7,15,8));   // morning
  const TK='2026-07-15';
  const pick=(target)=>call('(function(){var p=d_scorePick("'+target+'","'+TK+'",null,null);return p?{id:p.t.id,score:p.score,bucket:p.bucketCount}:null;})()');
  // H1 — equal 1-session history, but b1 brewed YESTERDAY → the not-recent a1 wins.
  const a1={id:'a1',name:'A',type:'green',amountGrams:40}, b1={id:'b1',name:'B',type:'oolong',amountGrams:40};
  setState([a1,b1], [ sess('a1',2026,7,10,8), sess('b1',2026,7,14,8) ]);   // a1 5d ago, b1 yesterday
  ok(pick('morning').id==='a1', 'H1 a tea brewed yesterday is demoted below an equal tea not recently brewed');
  // H2 — a STRONGLY habitual tea brewed yesterday still surfaces over a low-history rival (soft, not exclude).
  const hb={id:'hb',name:'Habit',type:'green',amountGrams:40}, rv={id:'rv',name:'Rival',type:'oolong',amountGrams:40};
  const hs=[]; for(let d=1;d<=4;d++) hs.push(sess('hb',2026,7,d,8)); hs.push(sess('hb',2026,7,14,8)); // 4 far-past + yesterday
  hs.push(sess('rv',2026,7,2,8));                                                                     // rival: 1 far-past
  setState([hb,rv], hs);
  ok(pick('morning').id==='hb', 'H2 a habitual tea still wins despite a brew yesterday (penalty is soft, not an exclude)');
  // H3 — v3.90 widened the window to 3 days: a brew 3 days ago now carries a (reduced) penalty.
  setState([{id:'c3',name:'C',type:'green',amountGrams:40}], [ sess('c3',2026,7,12,8) ]);   // 3 days ago
  const p3=pick('morning');
  ok(p3.id==='c3' && p3.score < p3.bucket, 'H3 a brew 3 days ago now carries a penalty (window widened to 3)');
  // H3b — 4 days ago is OUTSIDE the widened window → no penalty (score == bucketCount).
  setState([{id:'c4',name:'C4',type:'green',amountGrams:40}], [ sess('c4',2026,7,11,8) ]);  // 4 days ago
  const p4=pick('morning');
  ok(p4.id==='c4' && Math.abs(p4.score-p4.bucket)<1e-9, 'H3b a brew 4 days ago carries no recency penalty (outside the window)');
  // H6 — v3.90 the DHP case: a bucket-2 favourite brewed 2 days ago is demoted below a fresh bucket-1
  // favourite rival (rating+favourite cancel, so it turns on the bucket gap vs the two-days-ago penalty).
  const dh={id:'dh',name:'DHPlike',type:'oolong',amountGrams:40,rating:4,isFavorite:true};
  const gf={id:'gf',name:'GuiFeilike',type:'oolong',amountGrams:40,rating:4,isFavorite:true};
  setState([dh,gf], [ sess('dh',2026,7,5,8), sess('dh',2026,7,13,8), sess('gf',2026,7,6,8) ]); // dh: far-past + 2d-ago; gf: 1 far-past
  ok(pick('morning').id==='gf', 'H6 bucket-2 favourite brewed 2 days ago is demoted below a fresh bucket-1 favourite');
  // H7 — guardrail: the SAME bucket-2 favourite with NO recent brew still surfaces over the bucket-1 rival.
  const dg={id:'dg',name:'Habitual',type:'oolong',amountGrams:40,rating:4,isFavorite:true};
  const gr={id:'gr',name:'Rival',type:'oolong',amountGrams:40,rating:4,isFavorite:true};
  setState([dg,gr], [ sess('dg',2026,7,4,8), sess('dg',2026,7,5,8), sess('gr',2026,7,6,8) ]); // dg: 2 far-past, no recent
  ok(pick('morning').id==='dg', 'H7 a habitual (bucket-2) tea with no recent brew still wins (soft, not a hard exclude)');
  // H4 — TODAY's brew is not penalised (keeps the predicted-vs-actual computation stable pre/post-log).
  setState([{id:'td',name:'Today',type:'green',amountGrams:40}], [ sess('td',2026,7,15,7) ]);  // earlier today
  const pt=pick('morning');
  ok(Math.abs(pt.score-pt.bucket)<1e-9, 'H4 a tea brewed earlier TODAY carries no recency penalty (today excluded)');
  // H5 — determinism.
  setState([a1,b1], [ sess('a1',2026,7,10,8), sess('b1',2026,7,14,8) ]);
  ok(JSON.stringify(pick('morning'))===JSON.stringify(pick('morning')), 'H5 same todayKey → same pick (deterministic)');
  clearNow();
  console.log('  H #25 recency window: 8 checks');
})();

// ===== I. #17 "unopened" copy gated on stock evidence =====
(function(){
  ok(call('isTeaUnopened({costOriginalGrams:50,amountGrams:18})')===false, 'I1 opened (18g of 50g bought) → not unopened');
  ok(call('isTeaUnopened({costOriginalGrams:50,amountGrams:50})')===true,  'I2 full stock (50 of 50) → unopened');
  ok(call('isTeaUnopened({costOriginalGrams:0,amountGrams:18})')===true,   'I3 no purchase data → treated as unopened');
  // integration on a firing rediscovery day: opened-but-unsessioned → neglected register, never "unopened".
  let firesKey=null;
  for(let d=8; d<=31 && !firesKey; d++){ const k='2026-09-'+String(d).padStart(2,'0');   // from 8: see C5
    if(call('d_hash("'+k+'|shelf") % REDISCOVERY_ODDS')===0) firesKey={d}; }
  ok(firesKey, 'I4 found a firing rediscovery day');
  const drinker={id:'dr',name:'Habit',type:'green',amountGrams:40};
  const dh=[]; for(let d=1;d<=6;d++) dh.push(sess('dr',2026,9,d,8));
  setState([drinker,{id:'op',name:'Opened',type:'oolong',amountGrams:18,costOriginalGrams:50}], dh);  // opened, never sessioned
  setNow(localMs(2026,9,firesKey.d,14));
  let s=sub(greet());
  ok(/waited|been open|return to/i.test(s) && !/unopened|never been steeped/i.test(s),
     'I5 an opened-but-unsessioned tea gets the neglected register, never "unopened"');
  setState([drinker,{id:'op',name:'Opened',type:'oolong',amountGrams:50,costOriginalGrams:50}], dh);  // same id, full stock
  setNow(localMs(2026,9,firesKey.d,14));
  s=sub(greet());
  ok(/unopened|never been steeped|not brewed the/i.test(s), 'I6 a genuinely-untouched tea still reads "unopened"');
  clearNow();
  console.log('  I #17 unopened-copy gate: 6 checks');
})();

/* ===== J. R123 — sittings today, none in THIS window (v4.16) =====
 *
 * THE CHECK PLANNING ASKED FOR WOULD HAVE PASSED ON v4.15, and that is why this one is written
 * differently. The proposal was "pin that the greeting and the card resolve from the same function
 * and cannot disagree" — but they already DID resolve from the same function (`sessionsToday`), and
 * they disagreed anyway, because the divergence was in what each did with the answer. A check
 * written to the mechanism is green on the broken build. Same family as A3-was-a-proxy and the
 * `sessionsToday(now)` guard that matched its own declaration.
 *
 * So J1 asserts the PROPERTY: on a day with sittings, the masthead makes no present-tense offer to
 * brew. `btn-clay` is the exact structural signal — `card(sub, commitTea)` renders it only for a
 * branch that passes a tea, and only the present-tense branches do (R113/R120: clay IS the
 * committing action for the suggestion on screen). It reddens on v4.15 at five of seven hours.
 */
(function(){
  const at0=passed;   // DERIVED count, not a written one — a hand-typed total is the stale-number trap
  // A morning drinker with real signal, then TWO sittings today — Niklas's shape exactly.
  /* THE SCENARIO IS THE HALF THAT HAD TO BE GOT RIGHT, and the first draft got it wrong: a
     MORNING-ONLY drinker read at 14:00 already got no clay on v4.15, because the v3.55 redirect rule
     suppresses it when the current bucket is inactive ("save it for the morning"). J1 therefore
     passed with the R123 branch disabled — a check that cannot fail, which R105 rules worse than no
     check, found by running the control rather than by reading it. The drinker must be ACTIVE in the
     window being read, which is also Niklas's real pattern: he brews across the day. */
  const t=tea({name:'Morning tea'}), o=tea({name:'Other tea',type:'oolong'}), u=tea({name:'Third tea',type:'white'});
  const hist=[]; for(let d=1;d<=6;d++){ hist.push(sess(t.id,2026,7,d,8)); hist.push(sess(t.id,2026,7,d,14)); hist.push(sess(t.id,2026,7,d,20)); }
  const today=[sess(t.id,2026,7,10,8), sess(o.id,2026,7,10,9)];
  /* THREE teas, not two, and the third is what makes J1 bite. With only the two that were brewed
     today, `d_scorePick` excludes the whole shelf via `brewedToday`, returns null, and v4.15 renders
     `card('')` — an empty body and no clay, so J1 passed for the wrong reason a second time. Worth
     recording as its own small v4.15 defect that R123 also closes: a user who has brewed everything
     on their shelf today got a masthead with a greeting and NO LINE AT ALL. */
  setState([t,o,u], hist.concat(today));

  // Afternoon and evening are both ACTIVE, so on v4.15 each of these hours reaches the fall-through
  // un-redirected and commits clay. 02:00 is left out deliberately: at 2am the day's 8am sittings are
  // same-key but in the FUTURE — a calendar-day quirk R117 already accepted, shared with the card.
  [14,20].forEach(h=>{
    setNow(localMs(2026,7,10,h));
    const html=greet();
    ok(!/btn-clay/.test(html),
       'J1 no present-tense offer to brew at hour '+h+' on a day that already has sittings — the property, not the mechanism (proven to redden with the branch disabled)');
    ok(sub(html).length>0, 'J2 …and the masthead still says something at hour '+h+' — acknowledgement, not silence');
  });

  // COUNTLESS (R119). Read at 23:00: night is the one inactive window, so there is no later active
  // one, the tail is the rest pool, and the whole body is this branch's own copy with no tea name.
  const hist2=hist;
  setNow(localMs(2026,7,10,23));
  const body=sub(greet()).replace(/<[^>]+>/g,'');
  ok(!/\d/.test(body),
     'J3 the branch\'s copy carries NO count — `todaySessions.length` is sittings and R119 rules a cup a steep, so a numbered line here would ship the COUNTED-UNIT item §4 has filed');

  /* THE BRANCH DISCRIMINATOR, and it took two attempts to make it discriminate. Draft one asserted
     "names any tea", which both branches can satisfy — the TAIL names a forward tea on either path.
     What separates them is WHICH tea: the v3.67 branch acknowledges the tea you just drank by name;
     R123's never does. So the probe is the LOGGED tea specifically, and the forward pick cannot
     impersonate it (it is excluded by `brewedToday` and by the same-day variety guard).
     ONE sitting, so bigDay is false and the named ack is the one in play. Same shelf, two hours. */
  const oneToday=[sess(o.id,2026,7,20,8)];
  setState([t,o,u], hist2.concat(oneToday));
  setNow(localMs(2026,7,20,9));                       // 09:00 — the sitting is in THIS window
  ok(/Other tea/.test(sub(greet())),
     'J4 a sitting in the current window still reaches the v3.67 acknowledgement, which names THE TEA JUST DRUNK — the `dayTail` extraction changed no behaviour there');
  setNow(localMs(2026,7,20,14));                      // 14:00 — same sitting, a later window
  const later=greet();
  ok(!/Other tea/.test(sub(later)) && !/btn-clay/.test(later),
     'J4b …and the same sitting read in a later window reaches R123 instead: acknowledged without naming it, and no clay');

  // And a day with NO sittings still reaches the suggestion branches, clay included. The new branch
  // must not swallow the ordinary case.
  setState([t,o,u], hist2);
  setNow(localMs(2026,7,20,14));
  ok(/btn-clay/.test(greet()), 'J5 a day with no sittings still gets a suggestion and its clay — R123 narrows nothing else');

  // ONE tail writer. Duplicating it would recreate one level down the two-readers fault this deploy
  // fixes, so the pool literal must appear exactly once in the source.
  const dashSrc=fs.readFileSync(path.join(REPO,'steep-dashboard.js'),'utf8')
    .replace(/\/\*[\s\S]*?\*\//g,' ').replace(/^\s*\/\/.*$/gm,' ');
  const tails=(dashSrc.match(/That&rsquo;s the day&rsquo;s brewing/g)||[]).length;
  ok(tails===1, 'J6 the forward/rest tail has exactly ONE writer, shared by both acknowledgement branches (got '+tails+')');
  clearNow();
  console.log('  J R123 sittings-today branch: '+(passed-at0)+' checks');
})();

/* ===== K. The rediscovery week count is day-stable (v4.16) =====
 * "4 weeks" at 14:30 and "5 weeks" at 19:30 — one day, one tea, one pick. The branch's own comment
 * promised the choice was stable across the day; the choice was, the NUMBER was not, and the number
 * is part of the one-voice-per-day contract. `d_scorePick` had the right anchor all along.
 */
(function(){
  const at0=passed;
  let fires=null;
  for(let d=8; d<=28 && !fires; d++){ const k='2026-09-'+String(d).padStart(2,'0');   // from 8: see C5
    if(call('d_hash("'+k+'|shelf") % REDISCOVERY_ODDS')===0) fires=d; }
  ok(fires, 'K1 found a firing rediscovery day');
  // A habit tea brewed right up to yesterday (never a candidate), and one neglected long enough to be.
  const hab={id:'hab',name:'Habit',type:'green',amountGrams:40};
  const old={id:'old',name:'Neglected',type:'oolong',amountGrams:30};
  const hist=[]; for(let d=1;d<=6;d++) hist.push({id:'h'+d,teaId:'hab',date:isoAt(2026,9,d,8),steeps:[]});
  /* THE BREW INSTANT IS CHOSEN TO STRADDLE A WEEK BOUNDARY, and it has to be. Set at an arbitrary
     date the wall-clock reading happens to give the same answer at 00:00 and 23:00, so K3 passed on
     the broken build and only K4 caught the revert — a behavioural check riding on a source check is
     not a behavioural check. Exactly 49 days back AT MIDDAY means the 7-week boundary falls inside
     the target day: `Date.now()` reads 6 weeks in the morning and 7 by night, while the calendar
     anchor reads 7 all day. Now the control bites the check that describes the property. */
  hist.push({id:'oldbrew',teaId:'old',date:isoAt(2026,9,fires-49,13),steeps:[]});
  setState([hab,old], hist);
  const weeksAt=(h)=>{ setNow(localMs(2026,9,fires,h)); const m=sub(greet()).replace(/<[^>]+>/g,'').match(/(\d+)\s*weeks/); return m?m[1]:null; };
  const a=weeksAt(0), b=weeksAt(13), c=weeksAt(23);
  ok(a!==null, 'K2 the rediscovery line renders its week count');
  ok(a===b && b===c,
     'K3 the week count is IDENTICAL at 00:00, 13:00 and 23:00 of the same day — the calendar anchor, not the wall clock (got '+a+'/'+b+'/'+c+')');
  // Assert the anchor at source too, comment-stripped — this suite's own explanation names `Date.now()`,
  // and an absence check that reads prose is testing the prose (the fifth-instance lesson).
  const dashSrc=fs.readFileSync(path.join(REPO,'steep-dashboard.js'),'utf8')
    .replace(/\/\*[\s\S]*?\*\//g,' ').replace(/^\s*\/\/.*$/gm,' ');
  const body=(dashSrc.match(/function d_rediscoveryPick\([\s\S]*?\n\}/)||[''])[0];
  ok(/Date\.parse\(todayKey\)/.test(body) && !/Date\.now\(\)/.test(body),
     'K4 d_rediscoveryPick anchors on the calendar day, never the wall clock — the same anchor d_scorePick takes and says why');
  clearNow();
  console.log('  K rediscovery day-stability: '+(passed-at0)+' checks');
})();

console.log('\nALL GREETING-V4 TESTS PASSED  ('+passed+' passed)');
