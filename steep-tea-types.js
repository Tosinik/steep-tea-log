/* ============ Tea reference layer — Phase A: data + read path (no UI yet) ============
   TEA_TYPES is the 55-row curated tea-type taxonomy, reconciled from TEA-TYPES-SEED.md's 7
   batches (2026-07-15 rulings: gyokuro dedup, the flat DHP/Dan Cong rows superseded by
   two-level parents, covers moved member-only — recorded in the CHANGELOG, pinned in
   fixtures/tea-types-test.js). It is a plain script-global like steep-knowledge.js's KB —
   loaded via <script> and precached by the SW, no fetch. Phase B builds the browsable page,
   Phase C the R3 styling + the confirm-not-auto-write library link. Single-writer: reference
   SUGGESTS, it never writes over logged data.

   Two-level taxonomy: a parent class holds processing facts; light member rows (a cultivar or
   aroma) inherit them at read time — except confidence, which is per-row (see below). */

const TEA_TYPES = [
  {"slug":"gui-fei-oolong","liquor":"amber","parent":null,"display_name":"Gui Fei / Concubine Oolong","aka":["Concubine Oolong","Honey Scent Oolong","蜜香烏龍","貴妃烏龍"],"family":"oolong","region":"Lugu, Nantou, Taiwan","leaf_shape":"ball-rolled","oxidation_low":40,"oxidation_high":50,"roast":"light-medium","signature":"bug-bitten leafhopper honey; rolled/roasted cousin of Oriental Beauty","typical_brew":{"temp_c":[90,95],"g_per_100ml":3.5,"note":"short gongfu ~15-30s or ~90s western"},"confidence":"canonical","covers":["Honey Oolong Gui Fei"]},
  {"slug":"dong-ding-oolong","parent":null,"display_name":"Dong Ding Oolong","aka":["Tung Ting","Frozen Summit","凍頂"],"family":"oolong","region":"Lugu, Nantou, Taiwan (also a style made elsewhere)","leaf_shape":"ball-rolled","oxidation_low":15,"oxidation_high":40,"roast":"variable","signature":"classic Taiwanese roasted oolong; nutty/caramel when roasted","typical_brew":{"temp_c":[95,100],"g_per_100ml":5,"note":"gongfu short steeps"},"confidence":"canonical","covers":[]},
  {"slug":"oriental-beauty","liquor":"copper","parent":null,"display_name":"Oriental Beauty / Dong Fang Mei Ren","aka":["Dongfang Meiren","Bai Hao Oolong","Formosa Oolong","東方美人"],"family":"oolong","region":"Hsinchu / Miaoli, Taiwan","leaf_shape":"strip-twisted","oxidation_low":60,"oxidation_high":80,"roast":"none","signature":"original bug-bitten tea; honey/muscatel; heavily oxidized, unroasted","typical_brew":{"temp_c":[85,90],"g_per_100ml":4,"note":"gentle, short"},"confidence":"canonical","covers":["Oriental Beauty"]},
  {"slug":"alishan-gaoshan","liquor":"gold","parent":null,"display_name":"Alishan High-Mountain Oolong","aka":["Ali Shan gaoshan cha","high-mountain oolong","阿里山高山茶"],"family":"oolong","region":"Chiayi County, Taiwan (~1000-1500m)","leaf_shape":"ball-rolled","oxidation_low":15,"oxidation_high":30,"roast":"none-light","signature":"floral, creamy, sweet, low-astringency high-mountain oolong","typical_brew":{"temp_c":[95,100],"g_per_100ml":5,"note":"gongfu short steeps"},"confidence":"canonical","covers":["Ali Shan Fo Shou Dong Pian"]},
  {"slug":"ruan-zhi-oolong","liquor":"gold-pale","parent":null,"display_name":"Ruan Zhi Oolong (Thai/Taiwanese light)","aka":["Soft Stem","軟枝","TRES #17 (disputed)"],"family":"oolong","region":"N. Thailand (Santikhiri) & Taiwan","leaf_shape":"ball-rolled","oxidation_low":10,"oxidation_high":25,"roast":"none-light","signature":"light, floral, creamy, citrus; Thai high-mountain","typical_brew":{"temp_c":[90,90],"g_per_100ml":1,"note":"2.5g/250ml 3-4min western"},"confidence":"contested","covers":["Ruby Ruanzhi"]},
  {"slug":"sencha","liquor":"jade-pale","parent":null,"display_name":"Sencha","aka":["煎茶"],"family":"green","region":"Japan (Kagoshima, Shizuoka, Yame, Uji)","leaf_shape":"needle-steamed","oxidation_low":0,"oxidation_high":0,"roast":"none","signature":"steamed (not pan-fired) Japanese green; grassy, umami; full sun","typical_brew":{"temp_c":[70,70],"g_per_100ml":3.5,"note":"~1 min; fukamushi extracts faster, shorten"},"confidence":"canonical","covers":["Sencha Megumi No. 1 Hoshino","Sencha Kagoshima Premium"]},
  {"slug":"shincha","liquor":"jade-pale","parent":null,"display_name":"Shincha","aka":["新茶","new tea","ichibancha"],"family":"green","region":"Japan (earliest in the south)","leaf_shape":"needle-steamed","oxidation_low":0,"oxidation_high":0,"roast":"none","signature":"first-flush sencha; sweeter, higher theanine; spring-only","typical_brew":{"temp_c":[60,70],"g_per_100ml":3.5,"note":"slightly cooler than sencha"},"confidence":"canonical","covers":["Shincha Saemidori Kagoshima"]},
  {"slug":"kabusecha","liquor":"jade-pale","parent":null,"display_name":"Kabusecha","aka":["冠茶","かぶせ茶","covered tea","kabuse sencha"],"family":"green","region":"Japan (Mie/Ise, Nara, Kagoshima)","leaf_shape":"needle-steamed","oxidation_low":0,"oxidation_high":0,"roast":"none","signature":"shade-grown ~1-2 weeks; between sencha and gyokuro; sweeter, umami, vivid green","typical_brew":{"temp_c":[70,75],"g_per_100ml":3,"note":"~60s"},"confidence":"canonical","covers":["Kabusecha Kagoshima"]},
  {"slug":"gyokuro","liquor":"jade-pale","parent":null,"display_name":"Gyokuro (shaded green)","aka":["玉露","jade dew"],"family":"green","region":"Japan (Uji/Kyoto, Yame, Kagoshima)","leaf_shape":"needle-steamed","oxidation_low":0,"oxidation_high":0,"roast":"none","signature":"shade-grown 3-4 weeks; intense savory umami, high L-theanine; premium","typical_brew":{"temp_c":[50,60],"g_per_100ml":5,"note":"~90-120s, higher leaf ratio, cool water"},"confidence":"canonical","covers":[]},
  {"slug":"fujian-white","liquor":"gold-pale","parent":null,"display_name":"Fujian White Tea (Bai Cha)","aka":["Bai Cha","白茶","Silver Needle","White Peony","Shou Mei","Gong Mei"],"family":"white","region":"Fujian, China (Fuding, Zhenghe, Jianyang, Songxi)","leaf_shape":"whole-leaf-or-compressed","oxidation_low":0,"oxidation_high":15,"roast":"none","signature":"least-processed: withered + dried only; delicate honey/hay; ages (esp. Shou Mei/Gong Mei cakes)","typical_brew":{"temp_c":[80,90],"g_per_100ml":3,"note":"aged/compressed cakes take 90-95C; gongfu or long western"},"confidence":"canonical","covers":["2021 Fujian White Tea"]},
  {"slug":"ya-bao-yunnan","liquor":"ivory","parent":null,"display_name":"Ya Bao (Yunnan Wild-Bud White)","aka":["芽苞","wild silver buds","white pu-erh","Ye Sheng"],"family":"white","region":"Yunnan, China (Dehong, Baoshan) - wild trees","leaf_shape":"whole-bud","oxidation_low":0,"oxidation_high":10,"roast":"none","signature":"winter/early-spring dormant buds, sun-dried; resin/pine/hops, never bitter; ages","typical_brew":{"temp_c":[90,90],"g_per_100ml":3,"note":"3-4 min, many resteeps; very forgiving"},"confidence":"canonical","covers":["Yunnan Silver Bud Ya Bao"]},
  {"slug":"huang-ya","liquor":"yellow-pale","parent":null,"display_name":"Huang Ya (Yellow-Bud Tea)","aka":["黄芽","yellow bud","Meng Ding Huang Ya","Huo Shan Huang Ya"],"family":"yellow","region":"China (Sichuan / Anhui / Hunan)","leaf_shape":"bud","oxidation_low":0,"oxidation_high":0,"roast":"none","signature":"green processing + men huang (sealed yellowing); mellow, sweet, golden; grassy note removed","typical_brew":{"temp_c":[75,85],"g_per_100ml":3,"note":"1-3 min, gentle like green"},"confidence":"canonical","covers":["Huang Ya Yellow Tips"]},
  {"slug":"wuyi-yancha","liquor":"amber-deep","parent":null,"display_name":"Wuyi Yancha (Rock Oolong)","aka":["yan cha","rock tea","cliff tea","岩茶"],"family":"oolong","region":"Wuyi Mountains, Fujian, China","leaf_shape":"strip-twisted","oxidation_low":40,"oxidation_high":70,"roast":"medium-heavy","signature":"mineral yan yun (rock rhyme); charcoal-roasted; defined by place not cultivar","typical_brew":{"temp_c":[95,100],"g_per_100ml":6,"note":"rinse then flash steeps"},"confidence":"canonical","covers":[]},
  {"slug":"dhp","liquor":"amber-deep","parent":"wuyi-yancha","display_name":"Da Hong Pao","aka":["Big Red Robe","大红袍"],"confidence":"contested","note":"flagship; usually Shui Xian+Rou Gui blend or single-cultivar Qi Dan/Bei Dou","covers":["Dawang Feng Da Hong Pao"]},
  {"slug":"rou-gui","liquor":"amber-deep","parent":"wuyi-yancha","display_name":"Rou Gui","aka":["Yu Gui","Cinnamon","肉桂"],"note":"cinnamon/spicy; most popular Wuyi cultivar now"},
  {"slug":"shui-xian-wuyi","liquor":"amber-deep","parent":"wuyi-yancha","display_name":"Shui Xian","aka":["Shui Hsien","Narcissus","水仙"],"note":"narcissus; nutty, mineral, old-bush cong wei; the workhorse"},
  {"slug":"tie-luo-han","liquor":"amber-deep","parent":"wuyi-yancha","display_name":"Tie Luo Han","aka":["Iron Arhat","Iron Man","铁罗汉"],"note":"herbal, sweet dried-fruit; a Ming Cong"},
  {"slug":"shui-jin-gui","liquor":"amber-deep","parent":"wuyi-yancha","display_name":"Shui Jin Gui","aka":["Golden Water Turtle","水金龟"],"note":"plum-blossom, fruity; a Ming Cong"},
  {"slug":"bei-dou","liquor":"amber-deep","parent":"wuyi-yancha","display_name":"Bei Dou","aka":["North Star","北斗"],"note":"a Da Hong Pao clonal line"},
  {"slug":"qi-lan","liquor":"amber-deep","parent":"wuyi-yancha","display_name":"Qi Lan","aka":["Rare Orchid","奇兰"],"note":"orchid / wet wood / green mango"},
  {"slug":"huang-mei-gui","liquor":"amber-deep","parent":"wuyi-yancha","display_name":"Huang Mei Gui","aka":["Yellow Rose","黄玫瑰"],"note":"modern aromatic cultivar (code 506)"},
  {"slug":"phoenix-dancong","parent":null,"display_name":"Phoenix Dan Cong","aka":["Fenghuang Dan Cong","single bush","凤凰单枞","鳳凰單樅"],"family":"oolong","region":"Phoenix/Wudong Mtn, Chaozhou, Guangdong, China","leaf_shape":"strip-twisted","oxidation_low":50,"oxidation_high":80,"roast":"variable","signature":"single-bush, aroma-named (natural, not added); shan yun","typical_brew":{"temp_c":[95,100],"g_per_100ml":5,"note":"quick flash steeps; bitters if oversteeped"},"confidence":"canonical","covers":[]},
  {"slug":"mi-lan-xiang","parent":"phoenix-dancong","display_name":"Mi Lan Xiang","aka":["Honey Orchid","蜜兰香"],"note":"most planted, most accessible; honey over orchid, longan finish"},
  {"slug":"ya-shi-xiang","parent":"phoenix-dancong","display_name":"Ya Shi Xiang","aka":["Duck Shit Aroma","Yin Hua","Silver Flower","鸭屎香"],"note":"most famous; sits in the Huang Zhi Xiang family; gardenia/honey aroma","covers":["Yashi Xiang Dancong Guangdong"]},
  {"slug":"huang-zhi-xiang","parent":"phoenix-dancong","display_name":"Huang Zhi Xiang","aka":["Yellow Gardenia","黄栀香"],"note":"piercing gardenia; the family Ya Shi Xiang belongs to"},
  {"slug":"zhi-lan-xiang","parent":"phoenix-dancong","display_name":"Zhi Lan Xiang","aka":["Orchid","芝兰香"],"note":"cymbidium orchid; connoisseur's, high-mountain character"},
  {"slug":"xing-ren-xiang","parent":"phoenix-dancong","display_name":"Xing Ren Xiang","aka":["Almond","杏仁香"],"note":"nutty/warm; ages to marzipan"},
  {"slug":"phoenix-shui-xian","parent":"phoenix-dancong","display_name":"Feng Huang Shui Xian","aka":["Shui Xian Dan Cong","凤凰水仙"],"note":"base grade; the ancestor cultivar all Dan Cong descend from — NOT the Wuyi Shui Xian"},
  {"slug":"anxi-tie-guan-yin","parent":null,"display_name":"Anxi Tie Guan Yin","aka":["Ti Kuan Yin","Iron Goddess of Mercy","鐵觀音"],"family":"oolong","region":"Anxi County, Fujian, China","leaf_shape":"ball-rolled","oxidation_low":15,"oxidation_high":50,"roast":"variable","signature":"orchid aromatics; Qing Xiang (jade, unroasted 15-25%) vs Nong Xiang (roasted 30-50%)","typical_brew":{"temp_c":[95,100],"g_per_100ml":5,"note":"gongfu short steeps"},"confidence":"canonical","covers":[]},
  {"slug":"jin-xuan-milky","liquor":"gold","parent":null,"display_name":"Jin Xuan / Milky Oolong","aka":["金萱","Golden Daylily","TTES #12","Milk Oolong"],"family":"oolong","region":"Taiwan (also Fujian)","leaf_shape":"ball-rolled","oxidation_low":15,"oxidation_high":30,"roast":"none-light","signature":"naturally creamy/milky mouthfeel from the Jin Xuan cultivar","typical_brew":{"temp_c":[90,95],"g_per_100ml":5,"note":"gongfu short steeps"},"confidence":"contested","covers":[]},
  {"slug":"matcha","liquor":"jade-pale","parent":null,"display_name":"Matcha","aka":["抹茶","tencha (precursor)"],"family":"green","region":"Japan (Uji, Nishio, Kagoshima)","leaf_shape":"powder","oxidation_low":0,"oxidation_high":0,"roast":"none","signature":"shaded leaf -> tencha (steamed, unrolled, de-veined) -> stone-ground; whisked not steeped","typical_brew":{"temp_c":[70,80],"g_per_100ml":2,"note":"whisk ~2g in ~70ml; not infused"},"confidence":"canonical","covers":[]},
  {"slug":"hojicha","liquor":"copper","parent":null,"display_name":"Hojicha","aka":["焙じ茶","roasted green"],"family":"green","region":"Japan","leaf_shape":"needle-steamed-then-roasted","oxidation_low":0,"oxidation_high":0,"roast":"medium","signature":"roasted bancha/sencha; brown, nutty, low caffeine","typical_brew":{"temp_c":[90,100],"g_per_100ml":3,"note":"hot ok; ~30-60s"},"confidence":"canonical","covers":[]},
  {"slug":"genmaicha","liquor":"jade-pale","parent":null,"display_name":"Genmaicha","aka":["玄米茶","brown rice tea"],"family":"green","region":"Japan","leaf_shape":"needle-steamed + rice","oxidation_low":0,"oxidation_high":0,"roast":"light","signature":"sencha/bancha blended with roasted popped brown rice; toasty, low caffeine","typical_brew":{"temp_c":[80,90],"g_per_100ml":3,"note":"~30-60s"},"confidence":"canonical","covers":[]},
  {"slug":"bancha","liquor":"jade-pale","parent":null,"display_name":"Bancha","aka":["番茶"],"family":"green","region":"Japan","leaf_shape":"needle-steamed","oxidation_low":0,"oxidation_high":0,"roast":"none","signature":"later-flush / mature leaf; coarse, everyday, lower caffeine","typical_brew":{"temp_c":[80,90],"g_per_100ml":3,"note":"~1 min"},"confidence":"canonical","covers":[]},
  {"slug":"kukicha","liquor":"jade-pale","parent":null,"display_name":"Kukicha / Karigane","aka":["茎茶","stem tea","Shiraore"],"family":"green","region":"Japan","leaf_shape":"stems-twigs","oxidation_low":0,"oxidation_high":0,"roast":"none","signature":"stem-and-twig siftings from sencha/gyokuro; light, sweet","typical_brew":{"temp_c":[70,80],"g_per_100ml":4,"note":"~45-60s"},"confidence":"canonical","covers":[]},
  {"slug":"kamairicha","liquor":"jade-pale","parent":null,"display_name":"Kamairicha","aka":["釜炒り茶"],"family":"green","region":"Japan (Kyushu — Miyazaki, Takachiho)","leaf_shape":"pan-fired-curled","oxidation_low":0,"oxidation_high":0,"roast":"none","signature":"PAN-FIRED (dry-heated, not steamed) Japanese green - the exception; curled, less grassy, resembles Chinese method","typical_brew":{"temp_c":[80,90],"g_per_100ml":3,"note":"small Japanese pot"},"confidence":"canonical","covers":[]},
  {"slug":"bai-hao-yin-zhen","liquor":"ivory","parent":"fujian-white","display_name":"Bai Hao Yin Zhen (Silver Needle)","aka":["Silver Needle","白毫银针"],"note":"bud only; lightest, sweetest, most delicate grade","covers":["2021 Fujian White Tea (grade uncertain)"]},
  {"slug":"bai-mu-dan","liquor":"gold-pale","parent":"fujian-white","display_name":"Bai Mu Dan (White Peony)","aka":["White Peony","白牡丹"],"note":"1 bud + 1-2 leaves; fuller than Silver Needle"},
  {"slug":"gong-mei","liquor":"gold-pale","parent":"fujian-white","display_name":"Gong Mei","aka":["Tribute Eyebrow","贡眉"],"note":"1 bud + 2-3 leaves; darker, ages well"},
  {"slug":"shou-mei","liquor":"gold-pale","parent":"fujian-white","display_name":"Shou Mei","aka":["Longevity Eyebrow","寿眉"],"note":"1 bud + 3-4 leaves, few buds; boldest; most-pressed into cakes/balls"},
  {"slug":"yue-guang-bai","liquor":"gold-pale","parent":null,"display_name":"Yue Guang Bai (Moonlight White)","aka":["Moonlight White","月光白"],"family":"white","region":"Yunnan, China","leaf_shape":"whole-leaf (two-tone)","oxidation_low":0,"oxidation_high":15,"roast":"none","signature":"Yunnan large-leaf white; dark/light two-tone leaves; honey/floral; ages","typical_brew":{"temp_c":[85,90],"g_per_100ml":4,"note":"3-4 min or gongfu"},"confidence":"canonical","covers":[]},
  {"slug":"anji-bai-cha","liquor":"straw","parent":null,"display_name":"Anji Bai Cha (Anji 'White' - actually GREEN)","aka":["Anji White","安吉白茶"],"family":"green","region":"Anji, Zhejiang, China","leaf_shape":"flat-pan-fired","oxidation_low":0,"oxidation_high":0,"roast":"none","signature":"GREEN tea from a pale/albino cultivar; 'white' is the leaf colour, NOT the processing","typical_brew":{"temp_c":[80,85],"g_per_100ml":3,"note":"~1-2 min"},"confidence":"canonical","covers":[]},
  {"slug":"baozhong","liquor":"gold-pale","parent":null,"display_name":"Baozhong (Pouchong)","aka":["包種茶","Pouchong","Wenshan Baozhong"],"family":"oolong","region":"Pinglin / Wenshan, N. Taiwan","leaf_shape":"strip-twisted","oxidation_low":10,"oxidation_high":20,"roast":"none-light","signature":"least-oxidised oolong; floral, green-fresh; bridges green tea and oolong","typical_brew":{"temp_c":[90,95],"g_per_100ml":2.5,"note":"gaiwan ~60s; western ~90s"},"confidence":"canonical","covers":[]},
  {"slug":"huang-jin-gui","parent":"anxi-tie-guan-yin","display_name":"Huang Jin Gui","aka":["黄金桂","Golden Osmanthus","Golden Cassia"],"note":"Anxi cultivar cousin to Tie Guan Yin; golden leaf, high osmanthus-floral aroma; ball-rolled, light-medium oxidation"},
  {"slug":"hei-cha","liquor":"sepia","parent":null,"display_name":"Hei Cha (Dark / Post-Fermented Tea)","aka":["dark tea","post-fermented tea","黑茶"],"family":"dark","region":"China (Yunnan, Guangxi, Hunan, Sichuan)","leaf_shape":"varies (loose or compressed)","oxidation_low":0,"oxidation_high":100,"roast":"none","signature":"post-fermented (microbial) tea; pu-erh is the Yunnan member; also Liu Bao, Anhua","typical_brew":{"temp_c":[95,100],"g_per_100ml":5,"note":"rinse then flash steeps"},"confidence":"canonical","covers":[]},
  {"slug":"sheng-puerh","parent":"hei-cha","display_name":"Sheng Pu-erh (Raw)","aka":["生普","raw pu-erh","sheng","raw puer"],"family":"dark","region":"Yunnan, China","leaf_shape":"compressed cake/loose maocha","oxidation_low":0,"oxidation_high":100,"roast":"none","signature":"low kill-green + sun-dried maocha, compressed; ages naturally over years; NOT a green tea","typical_brew":{"temp_c":[90,100],"g_per_100ml":5,"note":"rinse; flash steeps; young sheng bitter if oversteeped"},"confidence":"canonical","covers":[]},
  {"slug":"shou-puerh","liquor":"near-black","parent":"hei-cha","display_name":"Shou Pu-erh (Ripe/Cooked)","aka":["熟普","ripe pu-erh","shou","cooked puer"],"family":"dark","region":"Yunnan, China","leaf_shape":"compressed cake/loose","oxidation_low":0,"oxidation_high":100,"roast":"none","signature":"wo dui (wet-piling ~1973) force-ferments the leaf; dark, earthy, smooth, drinkable young","typical_brew":{"temp_c":[95,100],"g_per_100ml":5,"note":"rinse 1-2x; forgiving; many steeps"},"confidence":"canonical","covers":[]},
  {"slug":"hong-cha","liquor":"mahogany","parent":null,"display_name":"Hong Cha (Black / Red Tea)","aka":["black tea","red tea","红茶"],"family":"black","region":"China + global (India, Sri Lanka, etc.)","leaf_shape":"strip / broken / rolled","oxidation_low":90,"oxidation_high":100,"roast":"none","signature":"fully oxidised, no kill-green; EN 'black' = ZH 'red/hong cha' (NOT hei cha/pu-erh)","typical_brew":{"temp_c":[85,95],"g_per_100ml":3,"note":"gongfu short steeps or western 3-4 min"},"confidence":"canonical","covers":[]},
  {"slug":"dian-hong","liquor":"mahogany","parent":"hong-cha","display_name":"Dian Hong","aka":["Yunnan Gold","Yunnan Black","滇红"],"note":"Yunnan large-leaf Assamica; golden-tip, malty, honey, cocoa; incl. Black Needle & Red Dragon Pearls"},
  {"slug":"keemun","liquor":"mahogany","parent":"hong-cha","display_name":"Keemun (Qimen)","aka":["Qimen","Keemun Congou","祁门红茶"],"note":"Anhui; wine/cocoa/orchid; classic English-Breakfast base"},
  {"slug":"lapsang-souchong","liquor":"mahogany","parent":"hong-cha","display_name":"Lapsang Souchong (Zheng Shan Xiao Zhong)","aka":["Zheng Shan Xiao Zhong","正山小种","souchong"],"note":"Tongmu, Wuyi, Fujian; the ORIGINAL black tea (17th c.); traditionally pine-smoked, now often unsmoked"},
  {"slug":"jin-jun-mei","liquor":"mahogany","parent":"hong-cha","display_name":"Jin Jun Mei","aka":["Golden Eyebrow","金骏眉"],"note":"Tongmu, Fujian; premium all-golden-bud black; modern (2005); honey/fruit; heavily faked"},
  {"slug":"ying-hong","liquor":"mahogany","parent":"hong-cha","display_name":"Ying Hong #9 (Yingde)","aka":["英红九号","Yingde Black"],"note":"Yingde, Guangdong; cultivar Ying Hong #9; bold, cocoa-sweet"},
  {"slug":"lichuan-hong","liquor":"mahogany","parent":"hong-cha","display_name":"Lichuan Hong","aka":["利川红","Lichuan Gongfu"],"note":"Hubei; gongfu-style strip black; smooth, fruity"},
  {"slug":"jin-mu-dan-black","liquor":"mahogany","parent":"hong-cha","display_name":"Jin Mu Dan (Golden Peony)","aka":["金牡丹"],"note":"Fujian cultivar black (Jin Mu Dan cultivar, also used for oolong); floral-sweet"}
];

// Processing facts a member borrows from its parent when it doesn't state its own. NOTE the
// deliberate omissions: `confidence` is PER-ROW, never inherited (a member can be more
// contested than its parent — Da Hong Pao is 'contested' under a 'canonical' Wuyi Yancha),
// and slug/display_name/aka/note/covers are always the row's own.
const TT_INHERIT = ['family','region','leaf_shape','oxidation_low','oxidation_high','roast','signature','typical_brew'];

function ttBySlug(slug){ return TEA_TYPES.find(function(t){ return t.slug===slug; }) || null; }

// Resolve a row for display: merge inherited parent fields, then force confidence to the
// row's OWN value (default 'canonical' when absent) so parent confidence can never leak in.
function resolveTeaType(slug){
  var row = ttBySlug(slug); if(!row) return null;
  var out = Object.assign({}, row);
  var parent = row.parent ? ttBySlug(row.parent) : null;
  if(parent) TT_INHERIT.forEach(function(f){ if(out[f]===undefined && parent[f]!==undefined) out[f]=parent[f]; });
  out.confidence = row.confidence || 'canonical';   // per-row, never inherited
  out.parentType = parent || null;                  // for the Phase-B "part of {parent}" line
  return out;
}

// Name-fold for matching: lowercase, ß→ss, drop combining diacritics, collapse whitespace —
// same broadening-only discipline as teaSearchNorm (steep-teas.js). CJK passes through, so the
// traditional/simplified aliases in the data (鳳凰單樅 vs 凤凰单枞) both match their own script.
function ttNormName(s){ return String(s||'').toLowerCase().replace(/ß/g,'ss')
  .normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim(); }

// The matcher: a library tea NAME → its most specific type, by EXACT (folded) match against
// curated `covers` — never token inference (the whole point of the seed's disambiguation
// audit: "black"/"bai"/"Rou Gui" in a name are traps, not class fingerprints). `covers` is
// member-only for the two-level cases, so a match resolves to the member, not its parent.
// Returns a resolved row, or null when nothing is confidently covered (unclassified — Phase C
// queues those; never a guess).
function matchTeaType(name){
  var q = ttNormName(name); if(!q) return null;
  var hits = TEA_TYPES.filter(function(t){ return (t.covers||[]).some(function(c){ return ttNormName(c)===q; }); });
  if(!hits.length) return null;
  hits.sort(function(a,b){ return (b.parent?1:0)-(a.parent?1:0); });   // prefer a member if two ever tie
  return resolveTeaType(hits[0].slug);
}

/* THE LIQUOR CASCADE (contract 1, v4.14) — tier 1 → tier 2, resolved at READ TIME AND NEVER STORED.
   Returns a palette key, or null when neither tier answers. Null is tier 3's cue: the render site
   falls back to the shipped type tint, which is an honest answer and not a failure state — 9 of
   Niklas's 21 teas land there, one deliberately null in the catalog and eight matching no row at all.

   WHY THIS NEVER WRITES, and it is the trap R97 already caught once with `catalog_slug`: resolving
   at read time means authoring a catalog liquor LATER upgrades every tea that matches it, including
   teas already on the shelf. A stored resolution would freeze each tea at the catalog's answer on
   the day it was first drawn, and every later improvement would reach only teas nobody had looked at.

   CLEARING IS THEREFORE FREE. `teas.liquor = null` returns the tea to tier 2 by construction, not to
   tier 3 and not to a stale copy of tier 2 — because tier 2 was never copied anywhere.

   An UNKNOWN key degrades rather than breaks: `LIQUOR_KEYS` is the palette's membership set, so a
   value from a future ramp, a typo, or a hand-edited row falls through to the catalog answer instead
   of rendering `var(--liquor-nonsense)` as nothing. That is why the column stores a key and not a hex. */
var LIQUOR_KEYS = ['jade-pale','straw','ivory','yellow-pale','gold-pale','gold','amber',
                   'amber-deep','copper','mahogany','sepia','near-black'];
function isLiquorKey(k){ return LIQUOR_KEYS.indexOf(k) !== -1; }
function liquorFor(tea){
  if(!tea) return null;
  if(isLiquorKey(tea.liquor)) return tea.liquor;                 // tier 1 — the user's own correction
  var m = (typeof matchTeaType === 'function') ? matchTeaType(tea.name || '') : null;
  return (m && isLiquorKey(m.liquor)) ? m.liquor : null;         // tier 2, else null → tier 3
}

// Browse index: every parent/standalone as a category with its members grouped under it.
// Browsability is INDEPENDENT of `covers` — a parent whose covers were moved to its members
// (Wuyi Yancha, Phoenix Dan Cong) is still a first-class browse destination.
function browseTeaTypes(){
  return TEA_TYPES.filter(function(t){ return !t.parent; }).map(function(p){
    return { type: resolveTeaType(p.slug),
      members: TEA_TYPES.filter(function(m){ return m.parent===p.slug; }).map(function(m){ return resolveTeaType(m.slug); }) };
  });
}

// Soft cultivar check (v3.90) — catch a Cultivar-field value that is really a tea NAME / STYLE / PLACE,
// not a cultivar (the "Gui Fei" / "Da Hong Pao" confusion). HIGH-PRECISION, low-recall BY DESIGN: the
// catalog is not an exhaustive cultivar list, so a hint that fired on a real-but-uncatalogued cultivar
// would train the user to ignore it. It therefore hints ONLY when the folded value exactly matches a
// name we can CONFIDENTLY call a non-cultivar — a top-level style/place/name row, MINUS an explicit
// exceptions set of standalone rows that ARE a cultivar (Jin Xuan, Ruan Zhi) or double as one (Tie Guan
// Yin) — PLUS the one member row that is a tea name (Da Hong Pao). Every cultivar member (Rou Gui, the
// Dan Cong aromas, …) and anything unknown stay silent. SUGGEST-NEVER-BLOCK: read-only, returns the
// matched display_name or null; the form saves the typed value unchanged regardless.
const TT_CULTIVAR_EXCEPTIONS = ['jin-xuan-milky','ruan-zhi-oolong','anxi-tie-guan-yin']; // standalone rows that ARE / double as a cultivar
function ttIsNonCultivar(row){
  if(!row) return false;
  if(row.slug==='dhp') return true;                              // the one member that is a tea name, not a cultivar
  return row.parent==null && !!row.family && TT_CULTIVAR_EXCEPTIONS.indexOf(row.slug)<0;
}
// Folded name variants for a row: the display_name, its parenthetical-stripped form, each "/"-separated
// half (so "Gui Fei / Concubine Oolong" yields "gui fei"), and every aka. Exact-fold match only.
function ttNameVariants(row){
  var out=[], dn=row.display_name||'';
  var base=dn.replace(/\s*\([^)]*\)\s*/g,' ').trim();            // drop a trailing "(...)" qualifier
  [dn].concat(base.split('/')).forEach(function(s){ if(s&&s.trim()) out.push(ttNormName(s)); });
  (row.aka||[]).forEach(function(a){ out.push(ttNormName(a)); });
  return out;
}
function cultivarNameHint(value){
  var q=ttNormName(value); if(!q) return null;
  for(var i=0;i<TEA_TYPES.length;i++){
    if(ttIsNonCultivar(TEA_TYPES[i]) && ttNameVariants(TEA_TYPES[i]).indexOf(q)>=0) return TEA_TYPES[i].display_name;
  }
  return null;
}

/* ============ Freshness windows (v3.98, slice B3) ============
   SPEC-freshness-model.md §3/§4. A freshness reading needs TWO independent groundings — the clock
   (when the tea started ageing) and the window (how long this kind of tea holds). This is the
   window half, and it lives here because it is catalog data, editable, not engine constants.

   ⚠ SEEDS, NOT SETTLED FACT. Published guidance disagrees by up to ~2x, which is exactly why these
   are data rather than hard-coded numbers. Never render one as authoritative — the UI shows "~5 wks",
   never "35 days". Days are the storage unit only.

   `ageing: true` means elapsed time reads as HISTORY ("3 yrs rested"), never a countdown and never
   an urgency tone. White and dark default on; oolong defaults OFF and widens with roast, which is a
   property of the individual tea rather than the family — one Oolong row spanning the range, not a
   roasted/unroasted split.

   R86: `ageing` is CATALOG data in R3. The spec contradicts itself — §4 calls it "flippable per tea"
   while §5 lists only opened_date and catalog data as the model's inputs — and a per-tea override is
   a second migration column for a feature with no board and no ruling. Recorded as an open product
   call, not built. */
const TT_FRESHNESS = {
  // by catalog family (rung 2)
  green:  { sealed_days: 365, opened_days:  75, ageing:false },
  yellow: { sealed_days: 365, opened_days:  60, ageing:false },
  oolong: { sealed_days: 730, opened_days: 240, ageing:false },
  black:  { sealed_days: 900, opened_days: 270, ageing:false },
  white:  { sealed_days: null, opened_days: null, ageing:true },
  dark:   { sealed_days: null, opened_days: null, ageing:true }
};
// Per-slug overrides (rung 1) — only where the slug genuinely differs from its family. Japanese
// green and matcha are the splits §3 names as the reason to key on slug at all: they sit ~2x apart
// from Chinese green and cannot be expressed at family level.
const TT_FRESHNESS_SLUG = {
  'sencha':   { sealed_days: 270, opened_days: 45 },
  'shincha':  { sealed_days: 180, opened_days: 30 },
  'gyokuro':  { sealed_days: 270, opened_days: 45 },
  'kabusecha':{ sealed_days: 270, opened_days: 45 },
  'matcha':   { sealed_days: 365, opened_days: 25 }
};
/* R85 — the third rung, and the ONE place the two vocabularies meet.
   `teas.type` uses `puerh`; `TEA_TYPES.family` uses `dark`. Two names for one thing (§7.2), latent
   until now: freshness windows are the first consumer that needs to cross between them, because the
   shelf's only pu-erh has no catalog row at all, so `dark`'s ageing default could never reach the
   one tea on the shelf that actually ages. WHEN THE VOCABULARIES ARE UNIFIED, THIS CONSTANT IS THE
   ONE PLACE TO CHANGE. Do not inline the mapping anywhere else. */
const TT_TYPE_TO_FAMILY = { green:'green', yellow:'yellow', oolong:'oolong', black:'black', white:'white', puerh:'dark' };

/* The cascade: catalog slug -> catalog family -> teas.type (R85). Returns
   { sealed_days, opened_days, ageing, rung } or null when nothing grounds.
   Rung 3 is coarser, not worse — it is what a final rung is for, and it is why authoring a `covers`
   entry UPGRADES a tea from rung 3 to rung 2 rather than switching it on from nothing. */
function ttFreshness(tea){
  if(!tea) return null;
  const row = (typeof matchTeaType==='function') ? matchTeaType(tea.name) : null;
  if(row){
    let fam = TT_FRESHNESS[row.family];
    // R173: oolong "widens with roast, per tea" (the model's design). A medium/heavy-roast oolong is
    // age-friendly (Wuyi yancha + its members, roasted Dong Ding), not a fresh-window tea — flip ageing on
    // from the catalog roast field, so the reading, the Home freshness insight, and statusLine all read it
    // (all consult ttFreshness). Light/floral oolong (none/none-light/variable) stays a fresh-window tea.
    if(fam && row.family==='oolong' && /medium|heavy/.test(String(row.roast||''))){
      fam = Object.assign({}, fam, { ageing:true, sealed_days:null, opened_days:null });
    }
    const slug = TT_FRESHNESS_SLUG[row.slug];
    if(slug && fam) return Object.assign({}, fam, slug, { rung:'slug' });
    if(fam) return Object.assign({}, fam, { rung:'family' });
  }
  const mapped = TT_TYPE_TO_FAMILY[String(tea.type||'').toLowerCase()];
  const byType = mapped && TT_FRESHNESS[mapped];
  return byType ? Object.assign({}, byType, { rung:'type' }) : null;
}

// Content contract (§3): contested/unconfirmed rows must render WITH a hedge, never as flat
// fact. The DECISION lives here (data layer); Phase B places the string visually. Copy is a
// calm placeholder — final wording is Phase-B/Niklas's. Empty string = nothing to hedge.
function typeConfidenceHedge(row){
  var c = (row && row.confidence) || 'canonical';
  if(c==='contested') return 'Sources genuinely disagree here — a starting point, not settled fact.';
  // NB (v3.88): the seed's confidence scheme also names verify/confirm tiers (marked in the seed's
  // prose with the warning-sign glyph, U+26A0), but NO committed row carries them — the old branch
  // that compared against a literal U+26A0 string was dead AND held the only non-ASCII compare key in
  // shipped code (brittle to variation-selector/encoding drift). Removed. If a future seed row ships
  // confidence 'verify'/'confirm', re-add an ASCII branch HERE (keep U+26A0 to display copy, never a
  // comparison) and pin it in the fixture.
  return '';
}
