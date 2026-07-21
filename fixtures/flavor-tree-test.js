/* PERMANENT validation — R31 nested flavour tree resolver (committed; runs every deploy).
 *
 * R31 adds RECOGNITION (membership via EN-variant/DE alias, diacritic-tolerant) and ROLL-UP DATA
 * (term → sub-family → family) — resolver only. Scope-fenced: no capture-family or bar/radar render
 * changes. Source dataset: docs/r3/planning/DATA-flavour-tree.md (Gascoyne wheel, 12 families).
 *
 * Built against the MECHANISM, not a frozen tag list: the 2026-07-19 tag_library (15 tags) is a
 * regression anchor, but growth is tested separately (a new covered word resolves; a novel word stays
 * bare) so the suite survives post-export additions like `spinach`/`milky` (observed live 2026-07-20).
 *
 * Run: node fixtures/flavor-tree-test.js   (exit non-zero on any failure)
 */
const fs=require('fs'), path=require('path'), vm=require('vm');
const repo=path.resolve(__dirname,'..');
const src=fs.readFileSync(path.join(repo,'steep-knowledge.js'),'utf8'); // self-contained (loads first, no deps)
const ctx={}; ctx.window=ctx; ctx.globalThis=ctx; ctx.console=console;
vm.createContext(ctx); vm.runInContext(src, ctx);
const R=ctx.flavorResolve, V=ctx.isFlavorVocab, N=ctx.flavorNorm, L=ctx.flavorLabel;

let passed=0, failures=0;
const ok=(c,m)=>{ if(c)passed++; else{failures++;console.log('  FAIL: '+m);} };
const fam=w=>{ const r=R(w); return r?r.family:'BARE'; };
const sub=w=>{ const r=R(w); return r?(r.subFamily||null):undefined; };
// consts aren't ctx props — pull them out of the sandbox
const TREE = JSON.parse(vm.runInContext('JSON.stringify(FLAVOR_TREE)', ctx));
const FAM_DE = JSON.parse(vm.runInContext('JSON.stringify(FLAVOR_FAMILY_DE)', ctx));
const SUB_DE = JSON.parse(vm.runInContext('JSON.stringify(FLAVOR_SUBFAMILY_DE)', ctx));
const CHIPS = JSON.parse(vm.runInContext('JSON.stringify(Object.keys(KB_FLAVOR_CHIPS))', ctx));

// ---- A. Tree integrity ----
const FAMS=Object.keys(FAM_DE), SUBS=Object.keys(SUB_DE);
ok(FAMS.length===12, 'A1 twelve families with DE labels (got '+FAMS.length+')');
ok(SUBS.length===13, 'A2 thirteen sub-families with DE labels (got '+SUBS.length+')');
ok(TREE.every(n=>FAMS.includes(n.f)), 'A3 every node names a valid family');
ok(TREE.every(n=>!n.s || SUBS.includes(n.s)), 'A4 every node sub-family is valid (or null)');
// every term + alias round-trips to its own node's term
let rtFail=[];
TREE.forEach(n=>[n.t].concat(n.a||[]).forEach(k=>{ const r=R(k); if(!r || r.term!==n.t) rtFail.push(k); }));
ok(rtFail.length===0, 'A5 every term + alias resolves to its own node ('+rtFail.slice(0,5).join(',')+')');
// no normalized key maps to two DIFFERENT families (collision-free index)
const idx={}; TREE.forEach(n=>[n.t].concat(n.a||[]).forEach(k=>{ const nk=N(k); (idx[nk]=idx[nk]||new Set()).add(n.f); }));
const coll=Object.entries(idx).filter(([k,s])=>s.size>1);
ok(coll.length===0, 'A6 no normalized key spans two families ('+coll.map(([k])=>k).join(',')+')');
console.log('  A tree integrity: '+TREE.length+' nodes, 6 checks');

// ---- B. Membership: tree ⊂ vocabulary; chips still vocabulary (families-⊂-vocab extended to nodes) ----
ok(TREE.every(n=>V(n.t)), 'B1 every tree term is flavour vocabulary');
ok(TREE.every(n=>(n.a||[]).every(a=>V(a))), 'B2 every alias is flavour vocabulary');
ok(CHIPS.every(k=>V(k)), 'B3 every KB_FLAVOR_CHIPS key is still vocabulary (regression)');
ok(['umami','sweetness','sweet','astringent','crisp'].every(V), 'B4 parked non-aroma chips stay vocabulary (§3)');
console.log('  B membership: 4 checks');

// ---- C. 15/15 resolution — the 2026-07-19 tag_library export (dataset §4) ----
const EXPORT15=['honey','fresh','roasted','grassy','vegetal','sweet','floral',
  'toasty','apricot','pear','date','dried fruit','fig','cocoa','spices'];
ok(EXPORT15.every(V), 'C1 all 15 real tags count as vocabulary (bare: '+EXPORT15.filter(t=>!V(t))+')');
const EXPECT={ toasty:'Empyreumatic', apricot:'Fruity', pear:'Fruity', date:'Fruity',
  'dried fruit':'Fruity', fig:'Fruity', cocoa:'Confectionery', spices:'Spiced' };
ok(Object.entries(EXPECT).every(([t,f])=>fam(t)===f), 'C2 the 8 recovered tags roll up to the dataset families');
ok(sub('apricot')==='Fresh fruits' && sub('date')==='Dried & candied' && sub('cocoa')===null,
  'C3 sub-family roll-up is correct (apricot=Fresh fruits, date=Dried & candied, cocoa=family-level)');
console.log('  C 15/15 resolution: 3 checks');

// ---- D. Umlaut round-trip + ä/ae equivalence + display-as-written ----
ok(N('Gewürze')==='gewuerze' && N('Café')==='cafe', 'D1 flavorNorm folds umlauts + strips diacritics');
ok(fam('gewürze')==='Spiced' && fam('gewuerze')==='Spiced', 'D2 ü and ue resolve to the same node (Gewürze)');
ok(fam('geräuchert')==='Empyreumatic' && fam('geraeuchert')==='Empyreumatic', 'D3 ä/ae equivalence (geräuchert)');
ok(L('gewürze')==='gewürze', 'D4 stored word displays as written — umlaut untouched, never rewritten to "spice"');
ok(L('aprikose')==='aprikose', 'D5 a German note is never rewritten to its English canonical');
console.log('  D umlaut + display-as-written: 5 checks');

// ---- E. DE-alias hit for at least one term per family ----
const DE_PER_FAMILY={ Vegetal:'Spinat', Marine:'Algen', Floral:'Jasmin', Fruity:'Aprikose',
  Woody:'Eiche', Earthy:'Erde', Empyreumatic:'geräuchert', Animal:'Leder', Mineral:'Feuerstein',
  Confectionery:'Kakao', Spiced:'Zimt', Milky:'Milch' };
const deMiss=Object.entries(DE_PER_FAMILY).filter(([f,w])=>fam(w)!==f);
ok(deMiss.length===0, 'E1 a DE alias resolves for all 12 families ('+deMiss.map(([f])=>f)+')');
console.log('  E DE alias per family: 1 check (12 families)');

// ---- F. Honest floor — novel words stay bare; the flagged milky gap ----
ok(R('smells like rain')===null && !V('smells like rain'), 'F1 a novel phrase stays bare');
ok(R('qwertyuiop')===null, 'F2 a nonsense word stays bare (no false family credit)');
ok(fam('spinach')==='Vegetal', 'F3 growth: a post-export covered word (spinach) resolves');
// "milky" (live tag) is now a seeded Milky family-level term — reconciling the dataset's §1 (family
// listed) vs §2 (adjective omitted, unlike floral/fruity/marine). Honest floor is still covered by F1/F2.
ok(fam('milky')==='Milky', 'F4 "milky" resolves to the Milky family (seeded family-level term)');
console.log('  F honest floor + growth: 4 checks');

// ---- G. Roll-up shape + word-form collapse ----
ok(['roast','roasted','roasting'].every(w=>R(w).term==='roast'), 'G1 roast/roasted/roasting collapse to one node');
ok(R('spice').term==='spice' && R('spices').term==='spice', 'G2 spice/spices collapse to one node');
ok(R('fig').term==='dried fig' && R('dried fig').term==='dried fig', 'G3 fig/dried fig collapse to one node');
const shape=R('apricot');
ok(shape && shape.term==='apricot' && shape.subFamily==='Fresh fruits' && shape.family==='Fruity',
  'G4 flavorResolve returns the full {term, subFamily, family} roll-up');
console.log('  G roll-up shape: 4 checks');

if(failures){ console.log('\n'+failures+' FLAVOR-TREE TEST(S) FAILED'); process.exit(1); }
console.log('\nALL FLAVOR-TREE TESTS PASSED  ('+passed+' passed)');
