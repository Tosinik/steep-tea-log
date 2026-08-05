/* PERMANENT validation — tea-lifecycle finished/unknown boundary (v3.40; committed and repaired
 * v3.97). Exercises the real isAmountTracked / isTeaFinished against the real fixtures plus
 * synthetic edge cases. The invariant: amountGrams=0 is "finished" ONLY when tracked (amount>0 ever
 * via cost/sessions), else it's an untracked in-stock tea — unknown != empty.
 *
 * v3.97 repair, the R69/R79 family again:
 *   1. It asserted "no real tea is finished". Two now are — Shincha Saemidori Kagoshima and Nantou
 *      Qingxin Gui Fei, both drained to 0 g with cost_original_grams 50. That is the predicate
 *      WORKING, not breaking; the assertion was a snapshot of a shelf where nothing had run out yet.
 *      What is asserted now is the PREDICATE IDENTITY across every owned row:
 *      isTeaFinished(t) === (isAmountTracked(t) && amountGrams <= 0).
 *   2. It was UNSCOPED and reached for the foreign row BY NAME ('Test') — the exact objection R69
 *      raised. Scoped by user_id now, derived from who owns the sessions.
 *
 * Read-only.
 */
const fs=require('fs'), path=require('path'), vm=require('vm');
function parseCSV(t){const rows=[];let row=[],f='',q=false;
  for(let i=0;i<t.length;i++){const c=t[i];
    if(q){if(c==='"'&&t[i+1]==='"'){f+='"';i++;}else if(c==='"')q=false;else f+=c;}
    else if(c==='"')q=true;else if(c===','){row.push(f);f='';}
    else if(c==='\n'||c==='\r'){if(f!==''||row.length){row.push(f);rows.push(row);row=[];f='';}if(c==='\r'&&t[i+1]==='\n')i++;}
    else f+=c;}
  if(f!==''||row.length){row.push(f);rows.push(row);}
  const h=rows.shift();return rows.map(r=>Object.fromEntries(h.map((x,i)=>[x,r[i]])));}

const repo=path.join(__dirname,'..');
const src=['steep-knowledge.js','steep-core.js'].map(f=>fs.readFileSync(path.join(repo,f),'utf8')).join('\n;\n');
const ctx={}; ctx.window=ctx; ctx.globalThis=ctx; ctx.console=console;
ctx.document={documentElement:{setAttribute(){},getAttribute(){return 'light';}},getElementById(){return null;},querySelectorAll(){return[];},createElement(){return{style:{},setAttribute(){},appendChild(){},classList:{add(){}}};}};
ctx.localStorage={getItem(){return null;},setItem(){},removeItem(){}}; ctx.matchMedia=()=>({matches:false}); ctx.navigator={onLine:true};
ctx.setTimeout=()=>{};ctx.clearTimeout=()=>{};ctx.setInterval=()=>{};ctx.clearInterval=()=>{};ctx.addEventListener=()=>{};

const rawSessions=parseCSV(fs.readFileSync(path.join(repo,'fixtures','sessions_rows.csv'),'utf8'));
const OWNER=(rawSessions[0]||{}).user_id || null;   // sessions are single-owner; the gate asserts it
const teas=parseCSV(fs.readFileSync(path.join(repo,'fixtures','teas_rows.csv'),'utf8'))
  .filter(r=>!OWNER || r.user_id===OWNER)           // R69 — scope, never exclude by name
  .map(r=>({ id:r.id, name:r.name, type:r.type,
    amountGrams:Number(r.amount_grams)||0, costOriginalGrams:Number(r.cost_original_grams)||0 }));
const sessions=rawSessions.map(r=>({ teaId:r.tea_id, gramsUsed:Number(r.grams_used)||0 }));

const testCode=`
  let failures=0,passes=0; const check=(n,c)=>{ if(c)passes++; else{failures++;console.log('  FAIL: '+n);} };
  state.sessions=${JSON.stringify(sessions)};
  state.teas=${JSON.stringify(teas)};

  // Real fixtures: report every zero-stock row, then assert the PREDICATE, not a shelf snapshot.
  console.log('Real fixtures ('+state.teas.length+' owner-scoped teas):');
  const finReal=[];
  state.teas.forEach(t=>{ const fin=isTeaFinished(t), trk=isAmountTracked(t);
    if(t.amountGrams<=0) console.log('  '+(fin?'FINISHED':(trk?'tracked-0?':'in-stock (untracked)'))+'  '+t.name+'  (amount='+t.amountGrams+', cog='+t.costOriginalGrams+')');
    if(fin) finReal.push(t.name); });
  const mismatched=state.teas.filter(t=>isTeaFinished(t)!==(isAmountTracked(t)&&Number(t.amountGrams)<=0));
  check('isTeaFinished === (isAmountTracked && amount<=0) on every real row'+
    (mismatched.length?' — offenders: '+mismatched.map(t=>t.name).join(', '):''), mismatched.length===0);
  // Tracked-and-drained is the state the predicate exists to name; report it, never pin the count.
  console.log('  finished: '+(finReal.join(', ')||'none'));
  // The other half of the boundary: a zero-stock row with no evidence must NOT read as finished.
  const zeroUntracked=state.teas.filter(t=>Number(t.amountGrams)<=0 && !isAmountTracked(t));
  check('zero-stock rows with no evidence stay unknown, never empty ('+zeroUntracked.length+' such)',
    zeroUntracked.every(t=>!isTeaFinished(t)));

  // Synthetic edge cases on the boundary.
  const A={id:'A',name:'Drained (bought 50g)',type:'green',amountGrams:0,costOriginalGrams:50};
  const B={id:'B',name:'Drained via sessions',type:'green',amountGrams:0,costOriginalGrams:0};
  const C={id:'C',name:'Never tracked',type:'green',amountGrams:0,costOriginalGrams:0};
  const D={id:'D',name:'In stock',type:'green',amountGrams:5,costOriginalGrams:0};
  state.teas=[A,B,C,D];
  state.sessions=[{teaId:'B',gramsUsed:6}];   // only B has a grams-drawing session
  console.log('\\nSynthetic boundary:');
  check('A finished (0g + recorded purchase qty)', isTeaFinished(A)===true);
  check('B finished (0g + a gramsUsed session)',   isTeaFinished(B)===true);
  check('C NOT finished (0g, no cost, no gramsUsed = untracked)', isTeaFinished(C)===false);
  check('C not tracked', isAmountTracked(C)===false);
  check('D not finished (in stock)', isTeaFinished(D)===false);

  // Stats integrity: finished teas stay in state.teas (nothing filters them out).
  check('finished teas remain in state.teas (counted everywhere)', state.teas.includes(A)&&state.teas.includes(B));

  console.log('\\n'+(failures===0?'ALL LIFECYCLE TESTS PASSED':failures+' FAILED')+'  ('+passes+' passed)');
  if(failures) throw new Error('lifecycle test failed');
`;
vm.createContext(ctx);
vm.runInContext(src+'\n'+testCode, ctx, {filename:'lifecycle-bundle.js'});
