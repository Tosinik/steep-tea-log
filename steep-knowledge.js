/* ============================================================================
   Steep tea knowledge base (v1) — keyword → type/leafForm/origin/brew defaults.
   Sources: curated from general tea knowledge + terminology/taxonomy observed on
   German tea retailers (Tee Kontor Kiel facets: cultivars, steaming/shading
   grades, flavor axes). Facts only — no copied text.
   Consumers: inferLeafForm (cultivar/region → form), tea-form autofill
   (name → type/origin/brew baseline), brew advice (per-style baselines),
   future tasting chips (FLAVOR_AXES).
   All temps °C; ratio = grams per 100ml; times = seconds, gongfu-style start.
   ============================================================================ */

// --- Style baselines: the "knowledgeable friend" defaults per tea style. ---
// leafForm keys must match LEAF_PROFILES families in steep-core.js.
// v3.57 (brew-advice v2): styles carry BOTH brewing methods where the ratios genuinely differ.
// `ratio` stays the primary/traditional value (western for greens/whites/yellows/blacks/puerh;
// gongfu for ball_oolong/dancong). The complementary field (`ratioGongfu` or `ratioWestern`) fills
// the other method. Picker: gongfu ? (ratioGongfu ?? ratio) : (ratioWestern ?? ratio). Japanese-green
// western values raised toward vendor + Niklas's kyusu practice (sencha/shincha 1.8, kabusecha 2.0).
const KB_STYLES = {
  // Japanese greens (steamed)
  gyokuro:      { type:'green',  leafForm:'steamed_green', tempC:55, ratio:2.2, ratioGongfu:4.0, first:120, note:'shaded; cool water, high leaf' },
  kabusecha:    { type:'green',  leafForm:'steamed_green', tempC:65, ratio:2.0, ratioGongfu:3.0, first:75 },
  sencha:       { type:'green',  leafForm:'steamed_green', tempC:70, ratio:1.8, ratioGongfu:3.0, first:60 },
  shincha:      { type:'green',  leafForm:'steamed_green', tempC:70, ratio:1.8, ratioGongfu:3.0, first:45, note:'drink fresh — spring harvest fades' },
  fukamushi:    { type:'green',  leafForm:'steamed_green', tempC:70, ratio:1.8, ratioGongfu:3.0, first:40, note:'deep-steamed: fine particles, brews fast' },
  bancha:       { type:'green',  leafForm:'steamed_green', tempC:80, ratio:1.2, ratioGongfu:3.0, first:45 },
  kukicha:      { type:'green',  leafForm:'steamed_green', tempC:75, ratio:1.4, ratioGongfu:3.0, first:50, note:'stem tea (also: karigane, shiraore)' },
  genmaicha:    { type:'green',  leafForm:'steamed_green', tempC:80, ratio:1.3, ratioGongfu:3.0, first:45 },
  houjicha:     { type:'green',  leafForm:'roasted_green', tempC:90, ratio:1.3, ratioGongfu:3.0, first:30, note:'roasted; low caffeine' },
  kamairicha:   { type:'green',  leafForm:'pan_green',     tempC:75, ratio:1.4, ratioGongfu:3.0, first:60, note:'pan-fired Japanese green' },
  tamaryokucha: { type:'green',  leafForm:'steamed_green', tempC:70, ratio:1.4, ratioGongfu:3.0, first:60 },
  matcha:       { type:'green',  leafForm:'powder',        tempC:75, ratio:2.0, first:0,  note:'whisked, not steeped' },
  // Chinese greens (pan-fired)
  longjing:     { type:'green',  leafForm:'pan_green',     tempC:78, ratio:1.2, ratioGongfu:3.0, first:45, note:'aka Dragonwell' },
  biluochun:    { type:'green',  leafForm:'pan_green',     tempC:75, ratio:1.2, ratioGongfu:3.0, first:40 },
  maofeng:      { type:'green',  leafForm:'pan_green',     tempC:75, ratio:1.2, ratioGongfu:3.0, first:45 },
  gunpowder:    { type:'green',  leafForm:'rolled',        tempC:80, ratio:1.1, ratioGongfu:3.0, first:45 },
  jasmine:      { type:'green',  leafForm:'pan_green',     tempC:75, ratio:1.2, ratioGongfu:3.0, first:40 },
  // Whites — ratio western; gongfu ~4.5 (v3.57)
  silver_needle:{ type:'white',  leafForm:'bud',           tempC:80, ratio:1.5, ratioGongfu:4.5, first:90, note:'aka Yin Zhen, Silbernadeln; also classic in glass: 80°C, ~4 min' },
  white_peony:  { type:'white',  leafForm:'open_leaf',     tempC:82, ratio:1.4, ratioGongfu:4.5, first:75, note:'aka Bai Mudan' },
  shou_mei:     { type:'white',  leafForm:'open_leaf',     tempC:85, ratio:1.3, ratioGongfu:4.5, first:75 },
  // Oolongs — ball/dancong `ratio` is GONGFU (+ratioWestern); strip/dark `ratio` is western (+ratioGongfu ~4.5, fixing the old anomaly)
  ball_oolong:  { type:'oolong', leafForm:'rolled',        tempC:95, ratio:3.5, ratioWestern:0.8, first:45, note:'Tie Guan Yin, Ali Shan, Dong Ding, Jin Xuan…' },
  strip_oolong: { type:'oolong', leafForm:'strip',         tempC:95, ratio:1.5, ratioGongfu:4.5, first:30, note:'Wuyi yancha' },
  dancong:      { type:'oolong', leafForm:'strip',         tempC:90, ratio:4.0, ratioWestern:1.0, first:25, note:'Phoenix dancong — unforgiving; cooler (≤85) = sweeter, hotter = stronger. Second steep shorter than first.' },
  dark_oolong:  { type:'oolong', leafForm:'strip',         tempC:95, ratio:1.5, ratioGongfu:4.5, first:35, note:'Oriental Beauty, GABA, heavier oxidation' },
  // Blacks
  black_china:  { type:'black',  leafForm:'strip',         tempC:90, ratio:1.2, ratioGongfu:4.0, first:30, note:'Dian Hong, Keemun, Lapsang, Koucha' },
  black_india:  { type:'black',  leafForm:'open_leaf',     tempC:95, ratio:1.0, ratioGongfu:3.0, first:150, note:'western-style: Assam, Ceylon; 2-3 min' },
  darjeeling_ff:{ type:'black',  leafForm:'open_leaf',     tempC:85, ratio:1.0, ratioGongfu:3.0, first:120, note:'first flush: cooler, shorter' },
  // Yellow — western; gongfu ~3.5
  yellow:       { type:'yellow', leafForm:'bud',           tempC:75, ratio:1.3, ratioGongfu:3.5, first:60, note:'Huang Ya, Junshan Yinzhen' },
  // Pu-erh & dark — ratio western-ish; gongfu ~5.0
  sheng:        { type:'puerh',  leafForm:'compressed',    tempC:90, ratio:1.6, ratioGongfu:5.0, first:20, note:'rinse once; young sheng cooler (85)' },
  shou:         { type:'puerh',  leafForm:'compressed',    tempC:98, ratio:1.6, ratioGongfu:5.0, first:20, note:'rinse 1-2x' },
  heicha:       { type:'puerh',  leafForm:'compressed',    tempC:95, ratio:1.5, ratioGongfu:5.0, first:25, note:'Liu Bao, Fu Zhuan' },
  // Non-camellia (for completeness in matching)
  rooibos:      { type:'herbal', leafForm:'open_leaf',     tempC:98, ratio:1.2, first:300, note:'Rotbusch' },
  herbal:       { type:'herbal', leafForm:'open_leaf',     tempC:98, ratio:1.0, first:300 }
};

// --- Keyword → style. Longest-match-wins (same rule as passport matching). ---
// German terms included throughout; keys lowercase.
const KB_KEYWORDS = {
  // Japanese
  'gyokuro':'gyokuro','kabusecha':'kabusecha','kabuse':'kabusecha','sencha':'sencha',
  'shincha':'shincha','fukamushi':'fukamushi','asamushi':'sencha','chumushi':'sencha',
  'tsuyomushi':'fukamushi','bancha':'bancha','kukicha':'kukicha','karigane':'kukicha',
  'shiraore':'kukicha','genmaicha':'genmaicha','houjicha':'houjicha','hojicha':'houjicha',
  'kamairicha':'kamairicha','tamaryokucha':'tamaryokucha','matcha':'matcha','tencha':'gyokuro',
  'aracha':'sencha','mizudashi':'sencha','mizucha':'sencha','koucha':'black_china','wakoucha':'black_china',
  // Chinese green
  'long jing':'longjing','longjing':'longjing','dragonwell':'longjing','lung ching':'longjing',
  'bi luo chun':'biluochun','biluochun':'biluochun','mao feng':'maofeng','maofeng':'maofeng',
  'mao jian':'maofeng','gua pian':'maofeng','anji':'longjing','gunpowder':'gunpowder',
  'jasmin':'jasmine','jasmine':'jasmine','mo li':'jasmine','huang ya':'yellow','huangya':'yellow','yellow tips':'yellow','junshan':'yellow','gelber tee':'yellow',
  // White
  'silver needle':'silver_needle','yin zhen':'silver_needle','silbernadel':'silver_needle',
  'silver bud':'silver_needle','silver tips':'silver_needle','ya bao':'silver_needle',
  'white peony':'white_peony','bai mudan':'white_peony','bai mu dan':'white_peony',
  'pai mu tan':'white_peony','shou mei':'shou_mei','gong mei':'shou_mei',
  'weisser tee':'white_peony','weißer tee':'white_peony','white tea':'white_peony',
  // Oolong — rolled/ball style
  'tie guan yin':'ball_oolong','tieguanyin':'ball_oolong','iron goddess':'ball_oolong',
  'ali shan':'ball_oolong','alishan':'ball_oolong','dong ding':'ball_oolong','dongding':'ball_oolong',
  'li shan':'ball_oolong','lishan':'ball_oolong','shan lin xi':'ball_oolong','jin xuan':'ball_oolong',
  'jinxuan':'ball_oolong','si ji chun':'ball_oolong','four seasons':'ball_oolong',
  'gaoshan':'ball_oolong','high mountain':'ball_oolong','milk oolong':'ball_oolong',
  // Oolong — strip style
  'da hong pao':'strip_oolong','rou gui':'strip_oolong','shui xian':'strip_oolong',
  'shuixian':'strip_oolong','wuyi':'strip_oolong','yancha':'strip_oolong',
  // Phoenix/Feng Huang dancong — its own style (distinct baseline; see knowledge/brew-guides.md).
  'dan cong':'dancong','dancong':'dancong','phoenix':'dancong','feng huang':'dancong',
  'mi lan xiang':'dancong','ya shi xiang':'dancong','yashi xiang':'dancong','huang zhi xiang':'dancong',
  'baozhong':'strip_oolong','pouchong':'strip_oolong',
  'oriental beauty':'dark_oolong','bai hao':'dark_oolong','dong fang mei ren':'dark_oolong',
  'gaba':'dark_oolong','ruby 18':'black_china','red jade':'black_china','hong yu':'black_china',
  // Black
  'assam':'black_india','ceylon':'black_india','nilgiri':'black_india','nepal':'black_india',
  'darjeeling':'darjeeling_ff','first flush':'darjeeling_ff','flugtee':'darjeeling_ff',
  'second flush':'black_india','keemun':'black_china','qimen':'black_china',
  'dian hong':'black_china','dianhong':'black_china','yunnan gold':'black_china',
  'lapsang':'black_china','zhengshan':'black_china','golden monkey':'black_china',
  'earl grey':'black_india','english breakfast':'black_india','ostfriesen':'black_india',
  'hongcha':'black_china','schwarztee':'black_india','schwarzer tee':'black_india',
  // Pu-erh & dark
  'sheng':'sheng','raw puerh':'sheng','gushu':'sheng','shou':'shou','shu puerh':'shou',
  'ripe puerh':'shou','pu erh':'sheng','pu-erh':'sheng',"pu'er":'sheng','puerh':'sheng',
  'liu bao':'heicha','liubao':'heicha','fu zhuan':'heicha','hei cha':'heicha','heicha':'heicha',
  // Non-camellia
  'rooibos':'rooibos','rotbusch':'rooibos','honeybush':'rooibos',
  'kräuter':'herbal','kraeuter':'herbal','mate':'herbal','lapacho':'herbal','früchte':'herbal'
};

// --- Cultivar → {country, typical style}. Fixes inferLeafForm misses. ---
// Japanese green cultivars per retailer facet lists; Chinese/Taiwanese per standard refs.
const KB_CULTIVARS = {
  // Japan (→ steamed green unless stated)
  'yabukita':'sencha','saemidori':'kabusecha','sae midori':'kabusecha','yutaka midori':'sencha',
  'yutakamidori':'sencha','okumidori':'sencha','oku midori':'sencha','asanoka':'sencha',
  'asatsuyu':'sencha','gokou':'gyokuro','goko':'gyokuro','koshun':'sencha','saeakari':'sencha',
  'saki midori':'sencha','sakimidori':'sencha','kanaya midori':'sencha','kirari 31':'sencha',
  'kirari31':'sencha','tsuyuhikari':'sencha','yamakai':'sencha','yume kaori':'sencha',
  'yumesuraga':'sencha','marishi':'sencha','komakage':'gyokuro','kuritawase':'sencha',
  'minami sayaka':'sencha','okuyutaka':'sencha','haruto 34':'sencha','sayama kaori':'sencha',
  'shizu 7132':'sencha','benifuuki':'black_china','zairai':'sencha',
  // China / Taiwan
  'long jing #43':'longjing','anji baicha':'longjing','qi yun':'maofeng',
  'jin xuan':'ball_oolong','qing xin':'ball_oolong','ruan zhi':'ball_oolong','ruanzhi':'ball_oolong',
  'si ji chun':'ball_oolong','shui xian':'strip_oolong','rou gui':'strip_oolong'
};

// --- Region → country (feeds passport + origin autofill). German included. ---
const KB_REGIONS = {
  'kagoshima':'Japan','kirishima':'Japan','yakushima':'Japan','miyazaki':'Japan','kumamoto':'Japan',
  'fukuoka':'Japan','yame':'Japan','hoshino':'Japan','uji':'Japan','kyoto':'Japan','shizuoka':'Japan',
  'mie':'Japan','nara':'Japan','sayama':'Japan','tenryu':'Japan',
  'yunnan':'China','fujian':'China','fuding':'China','zhenghe':'China','wuyi':'China','anxi':'China',
  'guangdong':'China','chaozhou':'China','zhejiang':'China','hangzhou':'China','anhui':'China',
  'huangshan':'China','guangxi':'China','menghai':'China','lincang':'China','yiwu':'China',
  'jingmai':'China','bulang':'China','laobanzhang':'China',
  'alishan':'Taiwan','ali shan':'Taiwan','nantou':'Taiwan','lishan':'Taiwan','li shan':'Taiwan',
  'shan lin xi':'Taiwan','muzha':'Taiwan','wenshan':'Taiwan','sun moon lake':'Taiwan','formosa':'Taiwan',
  'darjeeling':'India','assam':'India','nilgiri':'India','sikkim':'India',
  'ilam':'Nepal','himalaya':'Nepal','nuwara eliya':'Sri Lanka','uva':'Sri Lanka','dimbula':'Sri Lanka',
  'jeju':'South Korea','hadong':'South Korea','boseong':'South Korea',
  'doi mae salong':'Thailand','chiang rai':'Thailand','chiang mai':'Thailand',
  'ha giang':'Vietnam','moc chau':'Vietnam','java':'Indonesia','sumatra':'Indonesia'
};

// --- Flavor axes (0-5), once intended for a tasting-chips feature. ---
// DEAD as of R30 — declared "a separate analytic list" and referenced by nothing (see CLAUDE.md
// cleanup backlog). Kept, not deleted: the planning lane may promote its last four (tannin ·
// bitterness · oxidation · complexity are structural dimensions, not taste notes — the two-layer
// question, ledger §4). Do not wire it in as a fourth vocabulary without that decision.
const KB_FLAVOR_AXES = ['umami','sweetness','floral','fruity','nutty','roast','spice','tannin','bitterness','oxidation','complexity'];
const KB_FLAVOR_CHIPS = { // flavour vocabulary (isFlavorVocab membership), EN/DE
  umami:'Umami', sweetness:'Süße', floral:'Blumig', fruity:'Fruchtig', nutty:'Nussig',
  roast:'Röstig', spice:'Würzig', grassy:'Grasig', vegetal:'Vegetabil', marine:'Marin',
  creamy:'Cremig', honey:'Honig', malty:'Malzig', smoky:'Rauchig', mineral:'Mineralisch',
  fresh:'Frisch', crisp:'Spritzig', earthy:'Erdig', woody:'Holzig', stonefruit:'Steinobst',
  // R30: five words seeded to every tag_library (DEFAULT_TAGS) that failed isFlavorVocab — the app
  // suggested them, then silently dropped them from "What you taste". Now vocabulary so past + future
  // entries count. Seed-only: intentionally NOT added to a capture family — roasted/sweet/buttery/citrus
  // would sit next to roast/sweetness/creamy/fruity as confusing near-dupes (astringent is novel).
  // The nested/alias vocabulary that folds the dupes is R31 (deferred to the planning lane).
  roasted:'Geröstet', sweet:'Süß', astringent:'Adstringierend', buttery:'Butterig', citrus:'Zitrus'
};

// --- WS4 flavour capture: 20 curated vocabulary keys grouped into four families. ---
// Presentation only over KB_FLAVOR_CHIPS keys (that object stays the source of truth for the
// vocabulary; KB_FLAVOR_AXES is a separate dead list, R30). The first two families show by default
// under the timer; "more" reveals the other two. umami + grassy are homed in Vegetal & marine.
// Every family term is a chip key, no term twice; since R30 the families are a curated SUBSET of the
// vocabulary (the 5 seed-only orphans are chips but not capture families) — the flavor-ladder fixture
// asserts exactly that.
const KB_FLAVOR_FAMILIES = [
  { key:'vegetal', label:'Vegetal & marine',        terms:['umami','grassy','marine','vegetal','fresh','mineral'] },
  { key:'sweet',   label:'Sweet & floral',          terms:['sweetness','honey','floral','fruity','stonefruit'] },
  { key:'roast',   label:'Roast & nut',             terms:['roast','nutty','malty','woody','smoky'] },
  { key:'spice',   label:'Spice, earth & texture',  terms:['spice','earthy','creamy','crisp'] }
];
const FLAVOR_DEFAULT_FAMILIES = 2; // families shown before "more"

// A tag is flavour *vocabulary* iff it's a KB_FLAVOR_CHIPS key. Free-typed words are stored bare
// in the same tags array but are not vocabulary — so they never inflate the radar-unlock count
// (they still show in "You tasted" / on history cards). This is the "bare + membership" scheme.
function isFlavorVocab(tag){ return Object.prototype.hasOwnProperty.call(KB_FLAVOR_CHIPS, String(tag||'').toLowerCase()); }
function flavorFamilyOf(term){ term=String(term||'').toLowerCase(); return KB_FLAVOR_FAMILIES.find(f=>f.terms.includes(term))||null; }
// Display label for a stored (English-key) flavour tag. Non-vocab free words render as typed.
// KB_FLAVOR_CHIPS carries the German label for a future DE locale toggle; English key by default
// (all five WS4 mocks show the English chips). The stored tag is always the English key.
function flavorLabel(tag){ tag=String(tag||''); const k=tag.toLowerCase(); return isFlavorVocab(k) ? k : tag; }
function capWord(s){ s=String(s||''); return s.charAt(0).toUpperCase()+s.slice(1); }

// --- Resolver: text → best style match (longest alias wins), plus extras. ---
function kbResolve(text){
  text = (text||'').toLowerCase();
  if(!text.trim()) return null;
  // Explicit style names always beat cultivar inference ("Shincha Saemidori"
  // is a shincha, even though Saemidori's typical style is kabuse-shaded).
  let styleKey=null, len=0;
  for(const k in KB_KEYWORDS){ if(k.length>len && text.includes(k)){ styleKey=KB_KEYWORDS[k]; len=k.length; } }
  if(!styleKey){ for(const c in KB_CULTIVARS){ if(c.length>len && text.includes(c)){ styleKey=KB_CULTIVARS[c]; len=c.length; } } }
  if(!styleKey) return null;
  const s = KB_STYLES[styleKey];
  let country=null, rlen=0;
  for(const r in KB_REGIONS){ if(r.length>rlen && text.includes(r)){ country=KB_REGIONS[r]; rlen=r.length; } }
  return { style:styleKey, ...s, country };
}
