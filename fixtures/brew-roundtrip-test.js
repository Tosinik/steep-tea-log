/* PERMANENT validation — brew-guide emitter round-trip (committed; not gitignored like the
 * data-driven fixtures, since it needs no private CSV — it generates from LEAF_PROFILES / KB_STYLES).
 *
 * Invariant: for every schedule the app can generate, scheduleToGuideText(sched) -> parseBrewGuide()
 * must reproduce the IDENTICAL times. This catches the whole "emitter writes a token the parser can't
 * read back" bug class forever — most notably fmtSecShort's compound "1m15s" (which parseBrewGuide
 * reads as 60s, dropping the 15s). If someone changes scheduleToGuideText and breaks the round-trip,
 * this fails loudly.
 *
 * Run: node fixtures/brew-roundtrip-test.js   (exit non-zero on any failure)
 */
const fs=require('fs'), path=require('path'), vm=require('vm');
const repo=path.join(__dirname,'..');
const src=['steep-knowledge.js','steep-core.js'].map(f=>fs.readFileSync(path.join(repo,f),'utf8')).join('\n;\n');
const ctx={}; ctx.window=ctx; ctx.globalThis=ctx; ctx.console=console;
ctx.document={documentElement:{setAttribute(){},getAttribute(){return 'light';}},getElementById(){return null;},querySelectorAll(){return[];},createElement(){return{style:{},setAttribute(){},appendChild(){},classList:{add(){}}};}};
ctx.localStorage={getItem(){return null;},setItem(){},removeItem(){}}; ctx.matchMedia=()=>({matches:false}); ctx.navigator={onLine:true};
ctx.setTimeout=()=>{};ctx.clearTimeout=()=>{};ctx.setInterval=()=>{};ctx.clearInterval=()=>{};ctx.addEventListener=()=>{};

const testCode=`
  let failures=0,passes=0;
  const check=(n,c)=>{ if(c)passes++; else{failures++;console.log('  FAIL: '+n);} };
  const eq=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((x,i)=>x===b[i]);

  // Core assertion: a schedule's TIMES survive schedule -> text -> parse unchanged.
  function checkTimes(label, times, tempC){
    const want = times.map(t=>Math.round(t));
    const sched = { tempC: (tempC==null?null:tempC), rinseSeconds:null, times: want.slice(), form:'open' };
    const text = scheduleToGuideText(sched);
    const parsed = parseBrewGuide(text);
    const got = parsed ? parsed.times : null;
    const ok = eq(got, want);
    check(label+' ['+want.join('/')+(tempC!=null?' @'+tempC+'C':'')+'] -> "'+text+'" -> '+(got?got.join('/'):'null'), ok);
  }

  // 1) Adversarial — the exact bug class: values >=60s with sub-minute remainders, plus mixed runs.
  [[75],[90],[61],[119],[125],[181],[600],[65,130],[40,28,36,46,58,75,95,120]]
    .forEach((t,i)=>checkTimes('adversarial#'+(i+1), t));
  checkTimes('adversarial+temp', [40,28,75,120], 90);

  // 2) Every LEAF_PROFILES family, across a spread of steep counts (extrapolation crosses 60s+).
  LEAF_FORM_KEYS.forEach(form=>{
    [1,2,3,6,8,12].forEach(n=>{
      checkTimes('family '+form+' n='+n, generateFormTimes(form, n));
    });
  });

  // 3) Every KB style — generated off its canonical first-steep base, with its own temp folded in.
  Object.keys(KB_STYLES).forEach(key=>{
    const st = KB_STYLES[key];
    const form = KB_LEAFFORM_TO_PROFILE[st.leafForm] || 'open';
    const base = Number(st.first)>0 ? Number(st.first) : null;
    checkTimes('KB '+key+' ('+form+')', generateFormTimes(form, 6, base), st.tempC);
  });

  // 4) The real saved-suggestion format appends a KB ratio ("4g/100ml") — it must strip cleanly.
  (function(){
    const times=[25,18,23,29,36,48];
    const text = scheduleToGuideText({tempC:90,rinseSeconds:null,times})+', 4g/100ml';
    const p = parseBrewGuide(text);
    check('ratio-appended guide keeps times + temp, strips grams', p && eq(p.times, times) && p.tempC===90);
  })();

  // 5) Regression guards documenting WHY (so a revert to fmtSecShort fails here, not silently in prod).
  check('fmtSecShort(75) is the compound trap "1m15s"', fmtSecShort(75)==='1m15s');
  check('emitter uses no compound minute token for a 75s steep',
    !/\\dm\\d/.test(scheduleToGuideText({tempC:null,rinseSeconds:null,times:[75]})));

  console.log('\\n'+(failures===0?'ALL BREW-ROUNDTRIP TESTS PASSED':failures+' FAILED')+'  ('+passes+' passed)');
  if(failures) throw new Error('brew-roundtrip test failed');
`;
vm.createContext(ctx);
vm.runInContext(src+'\n'+testCode, ctx, {filename:'brew-roundtrip-bundle.js'});
