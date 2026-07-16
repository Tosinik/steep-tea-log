# Tea-types reference — seed batch 1 (oolong · green · white · yellow)

**Scope:** the oolong, green, white and yellow classes needed to cover the current library, plus two
not-yet-owned siblings (Dong Ding, Gyokuro) that anchor their families. **Black and pu-erh are still open**
— author them when such a tea enters the library.
**Method:** every row was corroborated this session across ≥2 independent, non-single-vendor sources.
Cultivar/harvest specifics that could not be pinned this session are marked **⚠︎ confirm** and must not be
shipped as fact without a check.
**Confidence:** `canonical` = stable, safe to display · `contested` = real disagreement in sources, show
with a hedge.

**Field legend** (matches the `tea_types` sketch in TEA-REFERENCE-BRIEF.md): `family` maps to the existing
`type` enum · `leaf_shape` ∈ {ball-rolled, strip-twisted, needle-steamed, …} · `oxidation` low–high % ·
`roast` ∈ {none, light, medium, heavy, variable} · `typical_brew` is a *reference fallback*, never
overrides a user's own guide.

The single most important encoded distinction (from the naming-inference work): **leaf_shape is reliable;
roast/oxidation is a maker's choice — hedge it.**

---

## OOLONG

### 1. Gui Fei / Concubine oolong  → covers **Honey Oolong Gui Fei**
- **aka:** Concubine Oolong, Honey Scent Oolong (蜜香烏龍), 貴妃烏龍
- **region:** Lugu, Nantou, Taiwan (now also made elsewhere)
- **leaf_shape:** ball-rolled · **oxidation:** 40–50% · **roast:** light–medium
- **signature:** bug-bitten (leafhopper) honey aroma; the ball-rolled, often-roasted cousin of Oriental Beauty
- **typical_brew:** 90–95 °C, ~3–4 g/100 ml, short gongfu (~15–30 s) or ~90 s western
- **confidence:** canonical
- **notes:** needs a bug-bitten (pesticide-free) garden; cultivar usually Jin Xuan or Qing Xin. Name is
  poetic (Yang Guifei) → encodes nothing mechanical. The "invented after the 1999 earthquake" story is
  folklore (one source says the idea predated the quake) — don't state as fact.

### 2. Dong Ding oolong  → sibling reference (not yet in library; the shop's example)
- **aka:** Tung Ting, Frozen Summit, 凍頂
- **region:** Lugu, Nantou, Taiwan — **a place that became a style** (now made outside the namesake mountain)
- **leaf_shape:** ball-rolled (half-ball) · **oxidation:** ~15–40% · **roast:** **variable**
- **signature:** classic Taiwanese roasted oolong; nutty/caramel when roasted
- **typical_brew:** 95–100 °C, gongfu short steeps
- **confidence:** canonical *(roast/oxidation contested by style)*
- **notes:** the cautionary case — **shape is reliable, roast is NOT.** Traditional Dong Ding was unroasted;
  medium charcoal roast became standard via merchants + the Lugu competition; "new style" skips most roast.
  Cultivar classically Qing Xin. Include this row because Gui Fei and several Taiwanese oolongs reference it.

### 3. Da Hong Pao / Wuyi yancha (rock oolong)  → covers **Dawang Feng Da Hong Pao**
- **aka:** Big Red Robe, 大红袍; category = Wuyi yancha / rock tea / cliff tea
- **region:** Wuyi Mountains, **Fujian, China**
- **leaf_shape:** **strip-twisted (NOT ball-rolled)** · **oxidation:** 40–70% · **roast:** medium–heavy charcoal (*tan bei* — **defining for yancha, but the technique is not Wuyi-exclusive**; see Audit)
- **signature:** mineral "yan yun" (rock rhyme); roasted, long finish
- **typical_brew:** 95–100 °C, gongfu 5–8 g/100 ml, rinse then flash steeps
- **confidence:** **contested** — commodity "Da Hong Pao" is usually a Shui Xian + Rou Gui **blend**, not single-cultivar
- **notes:** the clean contrast to Dong Ding — both oolong, opposite shape. "Dawang Feng" (大王峰) = Great King
  Peak, a 530 m peak among Wuyishan's Thirty-Six Peaks (the first reached entering Wuyi Mountain, by Wannian
  Palace across the mouth of the Jiuqu/Nine-Bend Stream; also called Shamao Rock / Tianzhu Peak) — a **terroir
  marker within Wuyishan, not a cultivar** (the same peak token attaches to other rock teas, e.g. "Dawang Feng
  Rou Gui"). Expect a blend unless a single cultivar (Qi Dan / Bei Dou) is named. **Library row origin
  "China" → sharpen to "Wuyi, Fujian".** *(Batch 2 reframes this as a **member** of a new parent class
  "Wuyi Yancha" — see below.)*

### 4. Oriental Beauty / Dong Fang Mei Ren  → covers **Oriental Beauty**
- **aka:** Dongfang Meiren, Bai Hao Oolong, Formosa Oolong, 東方美人
- **region:** Hsinchu / Miaoli, **Taiwan** (canonically Taiwan/Formosa)
- **leaf_shape:** strip/twisted, multi-colour tips (NOT ball-rolled) · **oxidation:** ~60–80% (heaviest oolong) · **roast:** none
- **signature:** the original bug-bitten tea; honey/muscatel; heavily oxidized, unroasted
- **typical_brew:** 85–90 °C (gentler — it's delicate), short steeps
- **confidence:** canonical
- **notes:** cultivar often Qing Xin Da Mao. **✓ DATA FLAG RESOLVED (2026-07-15): the library row's origin
  "China" is correct, not an error. The tea (Bohea Teehandlung "Bai Hao", bohea.de) is sold explicitly as
  "in der Art des Oriental Beauty" — an OB-*style* bug-bitten oolong grown in mainland China, filed under the
  vendor's "Oolong aus China". So: canonical Oriental Beauty is Taiwanese, but a mainland OB-style version
  exists and this is one. Log style and origin SEPARATELY — origin=China (vendor claim, bucket-2), style=OB
  (bug-bitten honey character). "Bai Hao" (白毫, "white tips") here is a style/appearance descriptor, NOT a
  claim to Taiwanese Bai Hao Oolong — the matcher must not auto-resolve "Bai Hao" → canonical Taiwanese OB.
  Sub-region and cultivar unstated on the label → do-not-infer (L).**

### 5. Phoenix Dan Cong — Ya Shi Xiang  → covers **Yashi Xiang Dancong Guandong**
- **aka:** Fenghuang Dan Cong, "single bush", 鳳凰單樅; Ya Shi Xiang = "Duck Shit Aroma"
- **region:** Phoenix / Wudong Mtn, Chaozhou, **Guangdong, China**
- **leaf_shape:** strip-twisted (long) · **oxidation:** ~50–80% · **roast:** **variable** (light "aromatic" → medium; charcoal, sometimes 2–3×)
- **signature:** aroma-named single-bush oolong; "shan yun" (mountain rhyme); Ya Shi Xiang = gardenia/honey
- **typical_brew:** 95–100 °C, gongfu, quick flash steeps (turns bitter if oversteeped)
- **confidence:** canonical
- **notes:** Dan Cong is the class; **Ya Shi Xiang is both a named aroma-type (Huang Zhi Xiang / yellow-
  gardenia group) and a specific bush lineage** — not a clean cultivar. 80+ aroma types exist.
  **Library typo: "Guandong" → Guangdong.** *(Batch 2 reframes this as an aroma **member** of a new parent
  class "Phoenix Dan Cong" — see below.)*

### 6. Alishan high-mountain (gaoshan) oolong  → covers **Ali Shan Fo Shou Dong Pian**
- **aka:** Ali Shan gaoshan cha, high-mountain oolong, 阿里山高山茶
- **region:** Chiayi County, Taiwan (~1000–1500 m)
- **leaf_shape:** ball-rolled (tight pearls) · **oxidation:** ~15–30% (up to ~40) · **roast:** none–light
- **signature:** floral, creamy, sweet, low-astringency high-mountain oolong
- **typical_brew:** 95–100 °C, gongfu short steeps
- **confidence:** canonical
- **notes:** cultivar usually Qing Xin or Jin Xuan; harvested ~twice yearly (spring/winter). Library tea
  names **Fo Shou** (佛手 "Buddha's Hand" cultivar — large-leaf, fruity; ⚠︎ confirm as Alishan material) and
  **Dong Pian** (冬片 "winter sliver," a late off-season pluck; ⚠︎ confirm). **Library row has junk
  harvest_year "-" → null it.**

### 7. Ruan Zhi oolong (Thai / Taiwanese light)  → covers **Ruby Ruanzhi**  ⚠︎ see flag
- **aka:** "Soft Stem" (軟枝); naming contested vs Qing Xin ("Green Heart") and TRES/TTES #17
- **region:** N. Thailand (Doi Mae Salong / Santikhiri) & Taiwan
- **leaf_shape:** ball-rolled · **oxidation:** light (green-oolong range) · **roast:** none–light
- **signature:** light, floral, creamy, citrus; Thai high-mountain oolong
- **typical_brew:** ~90 °C, 2.5 g/250 ml 3–4 min western, or gongfu
- **confidence:** **contested** (cultivar identity genuinely disputed in sources)
- **notes:** **✓ RESOLVED — the physical label says oolong**, so this row applies and the tea is typed
  correctly. Ruan Zhi is a cultivar that makes both oolong and black tea; this one is the light rolled
  oolong. Cultivar naming is the only unsettled part (Ruan Zhi = Qing Xin? or = TRES #17? sources
  disagree — show with a hedge). **Do NOT conflate with Ruby 18 / Hong Yu / TTES #18, a different
  black-tea cultivar** — the "Ruby" in the tea's name is a vendor label, not that cultivar.

---

## GREEN  (library greens are all Japanese steamed greens; add a Chinese green class when one enters the library)

### 8. Sencha  → covers **Sencha Megumi No.1 Hoshino**, **Sencha Kagoshima Premium**
- **aka:** 煎茶
- **region:** Japan (Kagoshima, Shizuoka, Fukuoka/Yame, Uji…)
- **leaf_shape:** needle-steamed · **oxidation:** 0 (steamed to fix) · **roast:** none
- **signature:** **steamed** (not pan-fired) Japanese green; grassy, umami; grown in full sun
- **typical_brew:** ~70 °C, ~1 min, ~3.5 g/100 ml; multiple short infusions
- **confidence:** canonical
- **notes:** steaming vs Chinese pan-firing is the *usual* green divide — **but not absolute: Enshi Yulu is a
  Chinese steamed green** (steaming was in fact the original Tang-era Chinese method; see Audit). **Fukamushi** = deep-steamed
  variant (smaller leaf → extracts faster → shorten time ~50–75%). Distinct from `leafForm` already inferred.

### 9. Shincha  → covers **Shincha Saemidori Kagoshima**
- **aka:** 新茶 "new tea", ichibancha (first flush)
- **region:** Japan (earliest in the south — Kagoshima — moving north)
- **leaf_shape:** needle-steamed · **oxidation:** 0 · **roast:** none
- **signature:** **first-flush sencha** — sweeter, lower catechin/caffeine, higher theanine; spring-only, limited
- **typical_brew:** like sencha, often slightly cooler (~60–70 °C) to protect delicacy
- **confidence:** canonical
- **notes:** **processing = sencha; the difference is *timing* (first flush of the year), not method.** So it
  can either be its own browse entry or a seasonal variant pointing at Sencha. Library cultivar = Saemidori.

### 10. Kabusecha  → covers **Kabusecha Kagoshima**
- **aka:** 冠茶 / かぶせ茶 "covered tea", kabuse sencha
- **region:** Japan (Mie/Ise, Nara, Kagoshima…)
- **leaf_shape:** needle-steamed · **oxidation:** 0 · **roast:** none
- **signature:** **shade-grown ~1–2 weeks** (less than gyokuro's 3–4) → sits between sencha and gyokuro;
  sweeter, more umami, vivid green, less astringent
- **typical_brew:** ~70–75 °C, ~60 s, ~3 g/100 ml
- **confidence:** canonical
- **notes:** **shading (cultivation) is what sets it apart, NOT steaming — kabuse ≠ fukamushi** (you can even
  have fukamushi kabusecha). Library cultivar = Yutakamidori.

### 11. Gyokuro  → sibling reference (not yet in library; anchors the shaded-green ladder)
- **aka:** 玉露 "jade dew"
- **region:** Japan (Uji/Kyoto heritage; also Yame/Fukuoka, Kagoshima)
- **leaf_shape:** needle-steamed · **oxidation:** 0 · **roast:** none
- **signature:** **shade-grown 3–4 weeks** (the tier above kabusecha) → highest L-theanine, intense
  savory/oceanic umami, low astringency; premium
- **typical_brew:** **50–60 °C** (much cooler than sencha), ~90–120 s, higher leaf ratio; specialised
  teaware (houhin/shiboridashi)
- **confidence:** canonical
- **notes:** completes the sunlight→shade ladder — sencha (0) < kabusecha (1–2 wk) < gyokuro (3–4 wk).
  Include so the reference layer can *explain* the family even before you own one.

---

## WHITE

### 12. Fujian white tea (Bai Cha)  → covers **2021 Fujian White Tea** (compressed)
- **aka:** Bai Cha; grades: Bai Hao Yin Zhen (Silver Needle, bud-only), Bai Mu Dan (White Peony, bud+leaf),
  Gong Mei, Shou Mei (mature leaf); 白茶
- **region:** Fujian, China (Fuding, Zhenghe, Jianyang, Songxi) — ~96% of world white tea
- **leaf_shape:** open/whole leaf; **or compressed cake** · **oxidation:** minimal (withering only; not truly 0) · **roast:** none
- **signature:** **least-processed tea — withered + dried, no rolling, no fixing;** delicate, honey/hay;
  ages like pu-erh (esp. Shou Mei/Gong Mei cakes)
- **typical_brew:** delicate grades 80–90 °C; aged/compressed cakes take 90–95 °C, longer or gongfu
- **confidence:** canonical
- **notes:** the library's **compressed** 2021 is almost certainly a Shou Mei / Bai Mu Dan-style **aged
  white cake** (pressed for storage; grade unstated in the name). Grade drives strength: more buds =
  lighter/sweeter, more mature leaf = darker/bolder. Cultivar usually Fuding/Zhenghe Da Bai.

### 13. Ya Bao (Yunnan wild-bud white)  → covers **Yunnan Silver Bud Ya Bao**
- **aka:** 芽苞 "bud case"; "wild silver buds"; sometimes sold as "white pu-erh"; Ye Sheng (wild-tree)
- **region:** Yunnan, China (Dehong, Baoshan) — wild trees (*C. sinensis* var. *dehungensis* / assamica)
- **leaf_shape:** whole dormant buds (torpedo-shaped) · **oxidation:** minimal · **roast:** none
- **signature:** **winter/early-spring dormant buds, simply sun-dried;** resin/pine/hops, sweet, **never
  bitter** even after very long steeps; ages well
- **typical_brew:** ~90 °C, 3–4 min, many resteeps; forgiving (can take boiling water / long/cold brew)
- **confidence:** canonical
- **notes:** genuinely distinct from Fujian Silver Needle — different plant, winter pluck, unusual buds.
  Categorised white because processing = drying only. A good "why is this special?" story tea.

---

## YELLOW

### 14. Huang Ya (yellow-bud tea)  → covers **Huang Ya Yellow Tips**
- **aka:** 黄芽 "yellow bud/sprout"; canonical examples: Meng Ding Huang Ya (Sichuan), Huo Shan Huang Ya
  (Anhui), Junshan Yinzhen (Hunan, bud-only)
- **region:** China (Sichuan / Anhui / Hunan depending on tea)
- **leaf_shape:** bud / open bud · **oxidation:** none (non-enzymatic yellowing, not oxidation) · **roast:** none
- **signature:** **green-tea processing plus the defining *men huang* (闷黄, "sealed yellowing") step** —
  warm damp leaves wrapped to slowly transform; removes the grassy note → mellow, sweet, golden
- **typical_brew:** like a gentle green, ~75–85 °C, 1–3 min
- **confidence:** canonical
- **notes:** **the men huang step is what makes it yellow — and it's often skipped.** Much "yellow tea" on
  the market is really green tea mislabelled (the step is slow/costly). So treat a "yellow" label as a
  *claim* to verify, not a fact (the fact-vs-vendor discipline in action). Rarest of the six families.
  Library origin "China" is unspecific — could sharpen to Sichuan/Anhui if the label says.


## Coverage check
Library oolongs covered: Honey Oolong Gui Fei (1), Dawang Feng Da Hong Pao (3), Oriental Beauty (4),
Yashi Xiang Dancong (5), Ali Shan Fo Shou Dong Pian (6), Ruby Ruanzhi (7, ✓ oolong confirmed by label).
Library greens covered: both Senchas (8), Shincha Saemidori (9), Kabusecha (10).
Library whites covered: 2021 Fujian White compressed (12), Yunnan Silver Bud Ya Bao (13).
Library yellow covered: Huang Ya Yellow Tips (14).
Siblings included (not yet owned): Dong Ding (2), Gyokuro (11) — they anchor families their neighbours
reference. **The full current library (13 real teas) is now covered.** Only black and pu-erh classes
remain unauthored, pending a matching purchase.

## Data-quality flags surfaced (fix independent of the feature)
1. **Oriental Beauty** origin "China" — ✓ resolved: **not an error.** Vendor (Bohea) sells it as an
   OB-*style* mainland-Chinese oolong ("in der Art des Oriental Beauty"). Keep origin=China; log style/origin
   separately; hedge "Bai Hao" as descriptor not canonical name. No change to the row's origin needed.
2. **Ruby Ruanzhi** — ✓ resolved: label confirms **oolong**. No change needed; keep cultivar name hedged.
3. **Da Hong Pao** origin "China" → sharpen to "Wuyi, Fujian".
4. **Ali Shan Fo Shou Dong Pian** `harvest_year = "-"` → null.
5. **"Guandong"** → Guangdong (spelling).

---

## Machine-readable (for Code to adapt into seed inserts)

```json
[
  {"slug":"gui-fei-oolong","display_name":"Gui Fei / Concubine Oolong","aka":["Concubine Oolong","Honey Scent Oolong","蜜香烏龍","貴妃烏龍"],"family":"oolong","region":"Lugu, Nantou, Taiwan","leaf_shape":"ball-rolled","oxidation_low":40,"oxidation_high":50,"roast":"light-medium","signature":"bug-bitten leafhopper honey; rolled/roasted cousin of Oriental Beauty","typical_brew":{"temp_c":[90,95],"g_per_100ml":3.5,"note":"short gongfu ~15-30s or ~90s western"},"confidence":"canonical","covers":["Honey Oolong Gui Fei"]},
  {"slug":"dong-ding-oolong","display_name":"Dong Ding Oolong","aka":["Tung Ting","Frozen Summit","凍頂"],"family":"oolong","region":"Lugu, Nantou, Taiwan (also a style made elsewhere)","leaf_shape":"ball-rolled","oxidation_low":15,"oxidation_high":40,"roast":"variable","signature":"classic Taiwanese roasted oolong; nutty/caramel when roasted","typical_brew":{"temp_c":[95,100],"g_per_100ml":5,"note":"gongfu short steeps"},"confidence":"canonical","covers":[]},
  {"slug":"da-hong-pao-yancha","display_name":"Da Hong Pao (Wuyi Rock Oolong)","aka":["Big Red Robe","大红袍","Wuyi yancha","rock tea"],"family":"oolong","region":"Wuyi Mountains, Fujian, China","leaf_shape":"strip-twisted","oxidation_low":40,"oxidation_high":70,"roast":"medium-heavy","signature":"mineral yan yun (rock rhyme); charcoal-roasted","typical_brew":{"temp_c":[95,100],"g_per_100ml":6,"note":"rinse then flash steeps"},"confidence":"contested","covers":["Dawang Feng Da Hong Pao"]},
  {"slug":"oriental-beauty","display_name":"Oriental Beauty / Dong Fang Mei Ren","aka":["Dongfang Meiren","Bai Hao Oolong","Formosa Oolong","東方美人"],"family":"oolong","region":"Hsinchu / Miaoli, Taiwan","leaf_shape":"strip-twisted","oxidation_low":60,"oxidation_high":80,"roast":"none","signature":"original bug-bitten tea; honey/muscatel; heavily oxidized, unroasted","typical_brew":{"temp_c":[85,90],"g_per_100ml":4,"note":"gentle, short"},"confidence":"canonical","covers":["Oriental Beauty"]},
  {"slug":"phoenix-dancong-yashixiang","display_name":"Phoenix Dan Cong — Ya Shi Xiang","aka":["Fenghuang Dan Cong","Duck Shit Aroma","鳳凰單樅"],"family":"oolong","region":"Wudong Mtn, Chaozhou, Guangdong, China","leaf_shape":"strip-twisted","oxidation_low":50,"oxidation_high":80,"roast":"variable","signature":"aroma-named single-bush oolong; shan yun; gardenia/honey","typical_brew":{"temp_c":[95,100],"g_per_100ml":5,"note":"quick flash steeps; bitters if oversteeped"},"confidence":"canonical","covers":["Yashi Xiang Dancong Guandong"]},
  {"slug":"alishan-gaoshan","display_name":"Alishan High-Mountain Oolong","aka":["Ali Shan gaoshan cha","high-mountain oolong","阿里山高山茶"],"family":"oolong","region":"Chiayi County, Taiwan (~1000-1500m)","leaf_shape":"ball-rolled","oxidation_low":15,"oxidation_high":30,"roast":"none-light","signature":"floral, creamy, sweet, low-astringency high-mountain oolong","typical_brew":{"temp_c":[95,100],"g_per_100ml":5,"note":"gongfu short steeps"},"confidence":"canonical","covers":["Ali Shan Fo Shou Dong Pian"]},
  {"slug":"ruan-zhi-oolong","display_name":"Ruan Zhi Oolong (Thai/Taiwanese light)","aka":["Soft Stem","軟枝","TRES #17 (disputed)"],"family":"oolong","region":"N. Thailand (Santikhiri) & Taiwan","leaf_shape":"ball-rolled","oxidation_low":10,"oxidation_high":25,"roast":"none-light","signature":"light, floral, creamy, citrus; Thai high-mountain","typical_brew":{"temp_c":[90,90],"g_per_100ml":1,"note":"2.5g/250ml 3-4min western"},"confidence":"contested","covers":["Ruby Ruanzhi"]},
  {"slug":"sencha","display_name":"Sencha","aka":["煎茶"],"family":"green","region":"Japan (Kagoshima, Shizuoka, Yame, Uji)","leaf_shape":"needle-steamed","oxidation_low":0,"oxidation_high":0,"roast":"none","signature":"steamed (not pan-fired) Japanese green; grassy, umami; full sun","typical_brew":{"temp_c":[70,70],"g_per_100ml":3.5,"note":"~1 min; fukamushi extracts faster, shorten"},"confidence":"canonical","covers":["Sencha Megumi No. 1 Hoshino","Sencha Kagoshima Premium"]},
  {"slug":"shincha","display_name":"Shincha","aka":["新茶","new tea","ichibancha"],"family":"green","region":"Japan (earliest in the south)","leaf_shape":"needle-steamed","oxidation_low":0,"oxidation_high":0,"roast":"none","signature":"first-flush sencha; sweeter, higher theanine; spring-only","typical_brew":{"temp_c":[60,70],"g_per_100ml":3.5,"note":"slightly cooler than sencha"},"confidence":"canonical","covers":["Shincha Saemidori Kagoshima"]},
  {"slug":"kabusecha","display_name":"Kabusecha","aka":["冠茶","かぶせ茶","covered tea","kabuse sencha"],"family":"green","region":"Japan (Mie/Ise, Nara, Kagoshima)","leaf_shape":"needle-steamed","oxidation_low":0,"oxidation_high":0,"roast":"none","signature":"shade-grown ~1-2 weeks; between sencha and gyokuro; sweeter, umami, vivid green","typical_brew":{"temp_c":[70,75],"g_per_100ml":3,"note":"~60s"},"confidence":"canonical","covers":["Kabusecha Kagoshima"]},
  {"slug":"gyokuro","display_name":"Gyokuro","aka":["玉露","jade dew"],"family":"green","region":"Japan (Uji/Kyoto, Yame, Kagoshima)","leaf_shape":"needle-steamed","oxidation_low":0,"oxidation_high":0,"roast":"none","signature":"shade-grown 3-4 weeks; intense savory umami, high L-theanine; premium","typical_brew":{"temp_c":[50,60],"g_per_100ml":5,"note":"~90-120s, higher leaf ratio, cool water"},"confidence":"canonical","covers":[]},
  {"slug":"fujian-white","display_name":"Fujian White Tea (Bai Cha)","aka":["Bai Cha","白茶","Silver Needle","White Peony","Shou Mei","Gong Mei"],"family":"white","region":"Fujian, China (Fuding, Zhenghe, Jianyang, Songxi)","leaf_shape":"whole-leaf-or-compressed","oxidation_low":0,"oxidation_high":15,"roast":"none","signature":"least-processed: withered + dried only; delicate honey/hay; ages (esp. Shou Mei/Gong Mei cakes)","typical_brew":{"temp_c":[80,90],"g_per_100ml":3,"note":"aged/compressed cakes take 90-95C; gongfu or long western"},"confidence":"canonical","covers":["2021 Fujian White Tea"]},
  {"slug":"ya-bao-yunnan","display_name":"Ya Bao (Yunnan Wild-Bud White)","aka":["芽苞","wild silver buds","white pu-erh","Ye Sheng"],"family":"white","region":"Yunnan, China (Dehong, Baoshan) - wild trees","leaf_shape":"whole-bud","oxidation_low":0,"oxidation_high":10,"roast":"none","signature":"winter/early-spring dormant buds, sun-dried; resin/pine/hops, never bitter; ages","typical_brew":{"temp_c":[90,90],"g_per_100ml":3,"note":"3-4 min, many resteeps; very forgiving"},"confidence":"canonical","covers":["Yunnan Silver Bud Ya Bao"]},
  {"slug":"huang-ya","display_name":"Huang Ya (Yellow-Bud Tea)","aka":["黄芽","yellow bud","Meng Ding Huang Ya","Huo Shan Huang Ya"],"family":"yellow","region":"China (Sichuan / Anhui / Hunan)","leaf_shape":"bud","oxidation_low":0,"oxidation_high":0,"roast":"none","signature":"green processing + men huang (sealed yellowing); mellow, sweet, golden; grassy note removed","typical_brew":{"temp_c":[75,85],"g_per_100ml":3,"note":"1-3 min, gentle like green"},"confidence":"canonical","covers":["Huang Ya Yellow Tips"]}
]
```

**Reminder for Code:** these are *reference fallbacks*, presented as suggestions, never auto-written over a
user's own logged data (single-writer + opt-in per TEA-REFERENCE-BRIEF.md). `⚠︎ confirm` items and the two
`contested` rows should render with a hedge, not as hard fact.

---

# Batch 2 — Chinese oolong (from Teasenz catalog) + the two-level taxonomy

Source: `teasenz.com/loose-leaf-oolong-teas` (17 real teas; ignoring a sampler bundle and a free strainer).
Everything below was corroborated this session across independent sources — the store gave the *names*, the
facts are triangulated.

## The structural finding (the important part)

17 product names collapse into **~4 processing classes**. Da Hong Pao, Rou Gui, Shui Xian, Tie Luo Han,
Shui Jin Gui, Bei Dou, Qi Lan, Huang Mei Gui are **one class** (Wuyi yancha) differing by *cultivar*. Mi Lan
Xiang, Ya Shi Xiang, Huang Zhi Xiang, Xing Ren Xiang, Zhi Lan Xiang, Shui Xian Dan Cong are **one class**
(Phoenix Dan Cong) differing by *aroma*. Authoring 17 flat rows would duplicate the same processing facts
over and over — exactly the single-writer violation we keep avoiding.

**→ Adopt a two-level taxonomy:** a **parent class** (holds the processing facts: shape, oxidation, roast,
brew, region) and optional **members** (a cultivar or aroma: name + aka + a one-line flavour note, plus an
optional roast override). Members *inherit* the parent's processing.

Schema implication: add a nullable self-reference to `tea_types`:
```
tea_types.parent_id  uuid null references tea_types(id)   -- null = a parent class; set = a member
```
A member row stays light: `{slug, display_name, aka, parent, note}` — it borrows shape/oxidation/brew from
its parent unless it sets its own. This is what lets the DB absorb a whole catalog without a row explosion,
and keeps processing facts authored **once**.

**Matcher gotcha this surfaced:** **"Rou Gui" and "Shui Xian" each name two different teas** — a *Wuyi
cultivar* AND a *Dan Cong aroma* (Dan Cong even has a "Rou Gui Xiang", explicitly *not* the Wuyi one). So the
name-matcher must disambiguate by context (does the string also carry "yancha/Wuyi" vs "Dan Cong/Feng
Huang"?), never by token alone. A textbook case of the §2 naming problem.

## Parent classes (processing authored once)

### P1. Wuyi Yancha (rock oolong)  — absorbs batch-1 #3 (Da Hong Pao)
- **region:** Wuyi Mountains, Fujian, China · **leaf_shape:** strip-twisted · **oxidation:** 40–70% ·
  **roast:** medium–heavy charcoal (*tan bei* — shared with Taiwanese roasted oolongs, not Wuyi-only; see Audit; levels: qing xiang light / zhong huo medium / zu huo heavy)
- **signature:** mineral "yan yun" (rock rhyme); defined by *place*, not one cultivar. Quality tiers
  **Zhengyan** (core) > **Banyan** (half-rock) > **Waishan** (outer).
- **typical_brew:** 95–100 °C, gongfu, rinse + flash steeps · **confidence:** canonical
- **Members** (all inherit the above; aroma = flavour note): **Da Hong Pao** (flagship; usually a Shui
  Xian+Rou Gui blend, or single-cultivar Qi Dan/Bei Dou), **Rou Gui** (cinnamon/spicy; most popular now),
  **Shui Xian** (narcissus; nutty, mineral, old-bush "cong wei"; the workhorse), **Tie Luo Han** (herbal,
  sweet dried-fruit), **Shui Jin Gui** (plum-blossom, fruity), **Bai Ji Guan** (corn-silk, light — *not on
  catalog* but canonical), **Ban Tian Yao** (orchid — *not on catalog*), **Bei Dou** (a Da Hong Pao clonal
  line), **Qi Lan** (orchid / wet wood / green mango), **Huang Mei Gui** ("Yellow Rose"; modern aromatic
  cultivar, code 506). *"Four Famous Bushes" (Si Da Ming Cong) lists vary — commonly Tie Luo Han, Bai Ji
  Guan, Shui Jin Gui + (Da Hong Pao or Ban Tian Yao).*

### P2. Phoenix Dan Cong (Fenghuang Dan Cong)  — absorbs batch-1 #5 (Ya Shi Xiang)
- **region:** Phoenix/Wudong Mtn, Chaozhou, Guangdong, China · **leaf_shape:** strip-twisted ·
  **oxidation:** ~50–80% · **roast:** variable (light "aromatic" → medium; sometimes multiple charcoal rounds)
- **signature:** **single-bush**, named by **aroma** (aromas are natural leaf chemistry, *not* added);
  "shan yun" (mountain rhyme). Ten canonical aromas; 100+ cultivars behind them.
- **typical_brew:** 95–100 °C, gongfu, quick flash steeps (bitters if oversteeped) · **confidence:** canonical
- **Members** (aroma types): **Mi Lan Xiang** (Honey Orchid — most planted, most accessible; longan/honey),
  **Ya Shi Xiang** (Duck Shit — most famous; sits in the Huang Zhi Xiang family), **Huang Zhi Xiang** (Yellow
  Gardenia), **Zhi Lan Xiang** (Orchid/cymbidium — connoisseur's), **Yu Lan Xiang** (Magnolia), **Xing Ren
  Xiang** (Almond; ages to marzipan), **Gui Hua Xiang** (Osmanthus), **Jiang Hua Xiang** (Ginger Flower),
  **You Hua Xiang** (Pomelo Blossom), **Rou Gui Xiang** (Cinnamon — *distinct from Wuyi Rou Gui*), **Mo Li
  Xiang** (Jasmine). Base grade: **Feng Huang Shui Xian** (the ancestor cultivar all Dan Cong descend from).
  *Da Wu Ye = a Huang-Zhi-Xiang-family cultivar (the catalog pairs it with Mi Lan Xiang).*

### P3. Anxi Tie Guan Yin  — NEW class
- **aka:** Ti Kuan Yin, Iron Goddess of Mercy, 鐵觀音 · **region:** Anxi County, Fujian, China
- **leaf_shape:** ball-rolled · **cultivar:** Tieguanyin · **two styles:**
  **Qing Xiang** (清香; jade/green, **15–25% ox, unroasted**, orchid aromatics) and
  **Nong Xiang** (濃香; **30–50% ox, charcoal-roasted**, caramel/dried-fruit).
- **typical_brew:** 95–100 °C, gongfu short steeps · **confidence:** canonical
- **notes:** roast/oxidation depends entirely on which style — a clean case of "hedge the roast." Taiwanese
  TGY also exists (usually more roasted); this parent is the Anxi/Chinese one.

### P4. Jin Xuan / Milky Oolong  — NEW class, **caveated**
- **aka:** 金萱, Golden Daylily, TTES #12, "Milk Oolong" · **region:** Taiwan (also Fujian & elsewhere)
- **leaf_shape:** ball-rolled · **oxidation:** light · **roast:** none–light
- **signature:** naturally **creamy/milky** mouthfeel from the Jin Xuan cultivar
- **confidence:** **contested** — but the confusion is *market naming*, not the cultivar. **Jin Xuan (金萱,
  TRES #12, "Golden Lily", Nai Xiang oolong) is a real cultivar whose creaminess is genuinely natural** —
  lactones (δ-decalactone, γ-nonalactone) + a thick viscous mouthfeel from Assamica-parent hybrid vigour.
  Subtle, floral, straw-like, persists across steeps. **The catch:** most "milk oolong" sold (esp. in the
  West) is *artificially flavoured* cheap leaf — tells: candy/condensed-milk aroma before brewing, fades
  after steep 1. The "steamed over milk" story is a **myth**. Label tell: authentic lists only "oolong / Jin
  Xuan"; flavoured lists "…flavouring". → Model as **cultivar = canonical (natural)**; the "milk oolong"
  *label* is the flavouring-risk. A future `flavoured: true` flag handles the sprayed versions.

## Flavoured / blended — outside the taxonomy
- **Ginseng Oolong** (oolong coated with ginseng + licorice powder) and **flavoured Milky Oolong** are
  *flavoured products*, not processing classes. Log as oolong + a "flavoured" tag; don't give them canonical
  class facts. (Good candidate for a future `flavoured: true` flag rather than a fake class.)

## Alias harvest (feed the matcher's `aka`)
Tie Guan Yin = Ti Kuan Yin / Iron Goddess of Mercy · Da Hong Pao = Big Red Robe · Rou Gui = Yu Gui /
Cinnamon Bark · Shui Xian = Shui Hsien / Narcissus / Water Sprite · Tie Luo Han = Iron Arhat / "Iron Man" ·
Shui Jin Gui = Golden Water Turtle · Bei Dou = North Star · Qi Lan = Rare Orchid · Huang Mei Gui = Yellow
Rose · Ya Shi Xiang = Duck Shit Aroma / Yin Hua / "Silver Flower" · Mi Lan Xiang = Honey Orchid · Huang Zhi
Xiang = Yellow Gardenia · Xing Ren Xiang = Almond · Zhi Lan Xiang = Orchid · Feng Huang Dan Cong = Phoenix /
Fenghuang single-bush · wulong = oolong · yan cha = rock tea.

## Gap list / notes
- **Bai Ji Guan, Ban Tian Yao** (Wuyi Ming Cong) — canonical members not on this catalog; author when seen.
- Dan Cong has 100+ cultivars behind 10 canonical aromas — add members as they appear, cheaply, under P2.
- **Not yet covered by any batch:** black tea, pu-erh, plain (non-bug-bitten) Taiwanese gaoshan beyond
  Alishan (Lishan, Shan Lin Xi, Dong Ding already seeded), Baozhong. All await a matching tea.
- One vendor; cultivar/aroma glosses are the store's framing corroborated against independent sources.

## Machine-readable additions (parents + light member rows)

```json
[
  {"slug":"wuyi-yancha","parent":null,"display_name":"Wuyi Yancha (Rock Oolong)","aka":["yan cha","rock tea","cliff tea","岩茶"],"family":"oolong","region":"Wuyi Mountains, Fujian, China","leaf_shape":"strip-twisted","oxidation_low":40,"oxidation_high":70,"roast":"medium-heavy","signature":"mineral yan yun (rock rhyme); charcoal-roasted; defined by place not cultivar","typical_brew":{"temp_c":[95,100],"g_per_100ml":6,"note":"rinse then flash steeps"},"confidence":"canonical","covers":["Dawang Feng Da Hong Pao"]},
  {"slug":"dhp","parent":"wuyi-yancha","display_name":"Da Hong Pao","aka":["Big Red Robe","大红袍"],"note":"flagship; usually Shui Xian+Rou Gui blend or single-cultivar Qi Dan/Bei Dou","covers":["Dawang Feng Da Hong Pao"]},
  {"slug":"rou-gui","parent":"wuyi-yancha","display_name":"Rou Gui","aka":["Yu Gui","Cinnamon","肉桂"],"note":"cinnamon/spicy; most popular Wuyi cultivar now"},
  {"slug":"shui-xian-wuyi","parent":"wuyi-yancha","display_name":"Shui Xian","aka":["Shui Hsien","Narcissus","水仙"],"note":"narcissus; nutty, mineral, old-bush cong wei; the workhorse"},
  {"slug":"tie-luo-han","parent":"wuyi-yancha","display_name":"Tie Luo Han","aka":["Iron Arhat","Iron Man","铁罗汉"],"note":"herbal, sweet dried-fruit; a Ming Cong"},
  {"slug":"shui-jin-gui","parent":"wuyi-yancha","display_name":"Shui Jin Gui","aka":["Golden Water Turtle","水金龟"],"note":"plum-blossom, fruity; a Ming Cong"},
  {"slug":"bei-dou","parent":"wuyi-yancha","display_name":"Bei Dou","aka":["North Star","北斗"],"note":"a Da Hong Pao clonal line"},
  {"slug":"qi-lan","parent":"wuyi-yancha","display_name":"Qi Lan","aka":["Rare Orchid","奇兰"],"note":"orchid / wet wood / green mango"},
  {"slug":"huang-mei-gui","parent":"wuyi-yancha","display_name":"Huang Mei Gui","aka":["Yellow Rose","黄玫瑰"],"note":"modern aromatic cultivar (code 506)"},
  {"slug":"phoenix-dancong","parent":null,"display_name":"Phoenix Dan Cong","aka":["Fenghuang Dan Cong","single bush","凤凰单枞"],"family":"oolong","region":"Phoenix/Wudong Mtn, Chaozhou, Guangdong, China","leaf_shape":"strip-twisted","oxidation_low":50,"oxidation_high":80,"roast":"variable","signature":"single-bush, aroma-named (natural, not added); shan yun","typical_brew":{"temp_c":[95,100],"g_per_100ml":5,"note":"quick flash steeps; bitters if oversteeped"},"confidence":"canonical","covers":["Yashi Xiang Dancong Guandong"]},
  {"slug":"mi-lan-xiang","parent":"phoenix-dancong","display_name":"Mi Lan Xiang","aka":["Honey Orchid","蜜兰香"],"note":"most planted, most accessible; honey over orchid, longan finish"},
  {"slug":"ya-shi-xiang","parent":"phoenix-dancong","display_name":"Ya Shi Xiang","aka":["Duck Shit Aroma","Yin Hua","Silver Flower","鸭屎香"],"note":"most famous; sits in the Huang Zhi Xiang family","covers":["Yashi Xiang Dancong Guandong"]},
  {"slug":"huang-zhi-xiang","parent":"phoenix-dancong","display_name":"Huang Zhi Xiang","aka":["Yellow Gardenia","黄栀香"],"note":"piercing gardenia; the family Ya Shi Xiang belongs to"},
  {"slug":"zhi-lan-xiang","parent":"phoenix-dancong","display_name":"Zhi Lan Xiang","aka":["Orchid","芝兰香"],"note":"cymbidium orchid; connoisseur's, high-mountain character"},
  {"slug":"xing-ren-xiang","parent":"phoenix-dancong","display_name":"Xing Ren Xiang","aka":["Almond","杏仁香"],"note":"nutty/warm; ages to marzipan"},
  {"slug":"phoenix-shui-xian","parent":"phoenix-dancong","display_name":"Feng Huang Shui Xian","aka":["Shui Xian Dan Cong","凤凰水仙"],"note":"base grade; the ancestor cultivar all Dan Cong descend from — NOT the Wuyi Shui Xian"},
  {"slug":"anxi-tie-guan-yin","parent":null,"display_name":"Anxi Tie Guan Yin","aka":["Ti Kuan Yin","Iron Goddess of Mercy","鐵觀音"],"family":"oolong","region":"Anxi County, Fujian, China","leaf_shape":"ball-rolled","oxidation_low":15,"oxidation_high":50,"roast":"variable","signature":"orchid aromatics; Qing Xiang (jade, unroasted 15-25%) vs Nong Xiang (roasted 30-50%)","typical_brew":{"temp_c":[95,100],"g_per_100ml":5,"note":"gongfu short steeps"},"confidence":"canonical","covers":[]},
  {"slug":"jin-xuan-milky","parent":null,"display_name":"Jin Xuan / Milky Oolong","aka":["金萱","Golden Daylily","TTES #12","Milk Oolong"],"family":"oolong","region":"Taiwan (also Fujian)","leaf_shape":"ball-rolled","oxidation_low":15,"oxidation_high":30,"roast":"none-light","signature":"naturally creamy/milky mouthfeel from the Jin Xuan cultivar","typical_brew":{"temp_c":[90,95],"g_per_100ml":5,"note":"gongfu short steeps"},"confidence":"contested","covers":[]}
]
```

**Note for Code:** parent rows carry full processing fields; member rows (`"parent":"<slug>"`) are light and
**inherit** shape/oxidation/roast/brew from the parent unless they add their own. This is the two-level model
in §"structural finding" above.

---

# Batch 3 — Japanese greens + Chinese white (two catalogs)

Sources: `tee-kontor-kiel.de/tee/japantee/` (category tree + processing-axis filters) and
`teasenz.com/loose-leaf-white-teas` (13 teas + a grade explainer). Facts triangulated against this session's
independent sources.

## 3A. Japanese greens — a two-axis model (shading × steaming)

The Kiel catalog's own filters expose how Japanese green is really organised — **two orthogonal processing
axes on top of the base type**, which is a cleaner model than treating each name as its own class:

- **Shading (Beschattung):** Roji (unshaded) → Kabuse (half, ~1–2 wk) → Gyokuro (full, 3–4 wk). *Cultivation.*
- **Steaming depth (Dämpfung):** asamushi (light) → chumushi (medium) → fukamushi (deep). *Processing.*
- Plus **harvest** (first/second flush; shincha = first flush) and **cultivar** (Yabukita, Saemidori,
  Asatsuyu, Okumidori, Yutaka Midori…).

So a tea like "Kabuse Shincha Asanoka, fukamushi" is base **sencha** + shading(kabuse) + steaming(fukamushi)
+ harvest(shincha/1st flush) + cultivar(Asanoka). Recommended model: a **base green type** as the parent,
and shading/steaming/harvest as **attributes** (not new classes). This keeps sencha/shincha/kabusecha/gyokuro
as one shaded-ladder family rather than four disconnected rows, and lets the app explain *why* two senchas
taste different.

**New Japanese classes to author (verified enough to seed):**
- **Matcha** — shaded leaf → **tencha** (shaded, steamed, *unrolled*, de-veined) → stone-ground to powder;
  whisked, not steeped. Whole leaf consumed. (Tencha = the loose precursor.)
- **Hojicha** — **roasted** green (usually bancha/sencha roasted ~180–200 °C); brown, low caffeine, nutty.
- **Genmaicha** — sencha/bancha **blended with roasted/popped brown rice**; toasty, low caffeine.
- **Bancha** — later-flush / more mature leaf; coarser, lower caffeine, everyday.
- **Kukicha / Karigane** — **stem-and-twig** tea (siftings from sencha/gyokuro); light, sweet. (Shiraore = a stem-tea name.)
- **Kamairicha** — ⚠︎ the exception: **pan-fired (not steamed)** Japanese green; curled, less grassy. *(verify depth before shipping)*
- **Tamaryokucha (guricha)** — steamed but **curled/comma-shaped** rather than needle-rolled. *(verify)*
- **Konacha** — powder/fannings from sencha/gyokuro processing (sushi-restaurant tea).
- Also on the tree: **Koucha** (Japanese black / wakoucha) and Japanese **oolong** — out of scope until owned.

**Steaming note that matters for brewing:** fukamushi (deep-steamed) leaf is more broken → extracts faster →
shorten steeps ~50–75% vs asamushi. This is a real per-tea brew adjustment the app could infer from a
"steaming" attribute.

## 3B. Chinese white — the grade ladder (members under one parent)

The white catalog maps cleanly onto batch-1 **Fujian white (#12)** as a **pluck-grade ladder** (parent =
processing; members = grade by how much leaf vs bud):
- **Bai Hao Yin Zhen** (Silver Needle) — bud only
- **Bai Mu Dan** (White Peony) — 1 bud + 1–2 leaves
- **Gong Mei** — 1 bud + 2–3 leaves
- **Shou Mei** — 1 bud + 3–4 leaves, few buds
More leaf → darker, bolder, more full-bodied; buddier → lighter, sweeter, subtler.

**Loose vs cake — a real processing fork (verified from the catalog + prior sources):** loose white =
withered + dried only. **Cake/ball white adds two steps: steaming to soften + compression.** Cakes age
better and give up flavour in later steeps; loose is fresher/flowerier and front-loaded. So "compressed"
isn't just a shape — it's +2 processing steps. (Refines the batch-1 note on the 2021 compressed white.)

**New white class:**
- **Yue Guang Bai (Moonlight White)** — Yunnan large-leaf white (two-tone dark/light leaves); withered/
  dried like white but from pu-erh-country material; honey/floral, ages. Distinct from Fujian white.

## 3C. Naming traps this batch surfaced (gold for the matcher)
- **Anji Bai Cha ("Anji White Tea") is a GREEN tea, not white.** The name is about an *albino/pale cultivar*
  (low chlorophyll), not white-tea processing — it's pan-fired/steamed like green. Textbook "the name lies"
  case: `type` must NOT be inferred from "bai/white" in the string. Flag hard.
- **Jasmine Silver Needle** = *scented* white (jasmine). Flavoured edge case → `flavoured:true`, not a class.
- Ya Bao appears here again ("Wild Purple Yabao, Da Xue Mtn") — already seeded (#13); add Da Xue Shan as an origin alias.

## 3D. Alias harvest
Bai Hao Yin Zhen = Silver Needle · Bai Mu Dan = White Peony · Shou Mei = Longevity Eyebrow · Gong Mei =
Tribute Eyebrow · Yue Guang Bai = Moonlight White · Anji Bai Cha = Anji White (but it's GREEN) · Jin Xuan =
Golden Lily / Nai Xiang / Milk Oolong / TRES #12 · fukamushi = deep-steamed · kabuse = half-shaded ·
tencha = matcha precursor · wakoucha/koucha = Japanese black.

## 3E. Gaps
- Japanese: kamairicha & tamaryokucha need a verification pass before shipping as fact; Japanese black/oolong await ownership.
- Chinese white: "Moon Garden" is a vendor product name (a Fuding white cake) → maps to Fujian white (cake), not its own class.
- Still unauthored families: **black tea, pu-erh** (both are one catalog away).

## Machine-readable additions

```json
[
  {"slug":"matcha","parent":null,"display_name":"Matcha","aka":["抹茶","tencha (precursor)"],"family":"green","region":"Japan (Uji, Nishio, Kagoshima)","leaf_shape":"powder","oxidation_low":0,"oxidation_high":0,"roast":"none","signature":"shaded leaf -> tencha (steamed, unrolled, de-veined) -> stone-ground; whisked not steeped","typical_brew":{"temp_c":[70,80],"g_per_100ml":2,"note":"whisk ~2g in ~70ml; not infused"},"confidence":"canonical","covers":[]},
  {"slug":"hojicha","parent":null,"display_name":"Hojicha","aka":["焙じ茶","roasted green"],"family":"green","region":"Japan","leaf_shape":"needle-steamed-then-roasted","oxidation_low":0,"oxidation_high":0,"roast":"medium","signature":"roasted bancha/sencha; brown, nutty, low caffeine","typical_brew":{"temp_c":[90,100],"g_per_100ml":3,"note":"hot ok; ~30-60s"},"confidence":"canonical","covers":[]},
  {"slug":"genmaicha","parent":null,"display_name":"Genmaicha","aka":["玄米茶","brown rice tea"],"family":"green","region":"Japan","leaf_shape":"needle-steamed + rice","oxidation_low":0,"oxidation_high":0,"roast":"light","signature":"sencha/bancha blended with roasted popped brown rice; toasty, low caffeine","typical_brew":{"temp_c":[80,90],"g_per_100ml":3,"note":"~30-60s"},"confidence":"canonical","covers":[]},
  {"slug":"bancha","parent":null,"display_name":"Bancha","aka":["番茶"],"family":"green","region":"Japan","leaf_shape":"needle-steamed","oxidation_low":0,"oxidation_high":0,"roast":"none","signature":"later-flush / mature leaf; coarse, everyday, lower caffeine","typical_brew":{"temp_c":[80,90],"g_per_100ml":3,"note":"~1 min"},"confidence":"canonical","covers":[]},
  {"slug":"kukicha","parent":null,"display_name":"Kukicha / Karigane","aka":["茎茶","stem tea","Shiraore"],"family":"green","region":"Japan","leaf_shape":"stems-twigs","oxidation_low":0,"oxidation_high":0,"roast":"none","signature":"stem-and-twig siftings from sencha/gyokuro; light, sweet","typical_brew":{"temp_c":[70,80],"g_per_100ml":4,"note":"~45-60s"},"confidence":"canonical","covers":[]},
  {"slug":"kamairicha","parent":null,"display_name":"Kamairicha","aka":["釜炒り茶"],"family":"green","region":"Japan (Kyushu — Miyazaki, Takachiho)","leaf_shape":"pan-fired-curled","oxidation_low":0,"oxidation_high":0,"roast":"none","signature":"PAN-FIRED (dry-heated, not steamed) Japanese green - the exception; curled, less grassy, resembles Chinese method","typical_brew":{"temp_c":[80,90],"g_per_100ml":3,"note":"small Japanese pot"},"confidence":"canonical","covers":[]},
  {"slug":"gyokuro","parent":null,"display_name":"Gyokuro (shaded green)","aka":["玉露"],"family":"green","region":"Japan","leaf_shape":"needle-steamed","oxidation_low":0,"oxidation_high":0,"roast":"none","signature":"already seeded in batch 1; the full-shade end of the sencha ladder","typical_brew":{"temp_c":[50,60],"g_per_100ml":5,"note":"see batch 1"},"confidence":"canonical","covers":[]},
  {"slug":"bai-hao-yin-zhen","parent":"fujian-white","display_name":"Bai Hao Yin Zhen (Silver Needle)","aka":["Silver Needle","白毫银针"],"note":"bud only; lightest, sweetest, most delicate grade","covers":["2021 Fujian White Tea (grade uncertain)"]},
  {"slug":"bai-mu-dan","parent":"fujian-white","display_name":"Bai Mu Dan (White Peony)","aka":["White Peony","白牡丹"],"note":"1 bud + 1-2 leaves; fuller than Silver Needle"},
  {"slug":"gong-mei","parent":"fujian-white","display_name":"Gong Mei","aka":["Tribute Eyebrow","贡眉"],"note":"1 bud + 2-3 leaves; darker, ages well"},
  {"slug":"shou-mei","parent":"fujian-white","display_name":"Shou Mei","aka":["Longevity Eyebrow","寿眉"],"note":"1 bud + 3-4 leaves, few buds; boldest; most-pressed into cakes/balls"},
  {"slug":"yue-guang-bai","parent":null,"display_name":"Yue Guang Bai (Moonlight White)","aka":["Moonlight White","月光白"],"family":"white","region":"Yunnan, China","leaf_shape":"whole-leaf (two-tone)","oxidation_low":0,"oxidation_high":15,"roast":"none","signature":"Yunnan large-leaf white; dark/light two-tone leaves; honey/floral; ages","typical_brew":{"temp_c":[85,90],"g_per_100ml":4,"note":"3-4 min or gongfu"},"confidence":"canonical","covers":[]},
  {"slug":"anji-bai-cha","parent":null,"display_name":"Anji Bai Cha (Anji 'White' - actually GREEN)","aka":["Anji White","安吉白茶"],"family":"green","region":"Anji, Zhejiang, China","leaf_shape":"flat-pan-fired","oxidation_low":0,"oxidation_high":0,"roast":"none","signature":"GREEN tea from a pale/albino cultivar; 'white' is the leaf colour, NOT the processing","typical_brew":{"temp_c":[80,85],"g_per_100ml":3,"note":"~1-2 min"},"confidence":"canonical","covers":[]}
]
```

**Note for Code:** `"confidence":"verify"` (kamairicha) must not ship as fact until checked. Japanese
shading/steaming/harvest are better as **attributes** on a base green type than as separate classes — see 3A.

---

# Batch 4 — Processing-term exclusivity audit

Prompted by the *tan bei* catch: I'd implied several processing terms belong to one class. Re-checking, most
name **techniques that recur across families** — what's class-specific is which step is *emphasised/defining*,
not that the step is *owned*. This is the same lesson as "roast is an attribute, not a class" and the Japanese
"shading × steaming as attributes." **Meta-principle for the matcher: never treat a shared technique-word in a
name as a class fingerprint.**

**The overclaims, corrected:**

1. **Tan bei (炭焙, charcoal roasting) — NOT Wuyi-exclusive.** ✅ corrected inline. It's the general craft of
   charcoal-roasting tea, used heavily for Taiwanese oolong (traditional Dong Ding roasted 5×/60+ hrs over
   longan-wood charcoal; Hong Shui "red water" oolong; roasted Muzha Tie Guan Yin) and for Dan Cong too.
   Taiwan even has its own tan bei lineage (Chiang Kai-shek's 48 roasting masters → "Kuan-Pei"/Official Roast).
   Defining *for yancha*; the technique is shared.

2. **Zuo qing / yao qing (做青/摇青, "making green" / the shaking-bruising stage) — NOT Dan Cong-exclusive.**
   This is the **universal oolong step** — every oolong (Wuyi, Tie Guan Yin, Taiwanese, Dan Cong) is shaken/
   bruised to drive partial oxidation. What's distinctive about Dan Cong is the *intensity/duration* (shaken
   much of the night to build the cultivar aroma), not that it owns the step. My "Dan Cong's hero step is zuo
   qing" should read: **Dan Cong emphasises an oxidation step all oolongs share.**

3. **Steaming to kill-green — NOT uniquely Japanese.** ✅ corrected inline. Enshi Yulu (Hubei) is a Chinese
   steamed green ("Chinese gyokuro"), and steaming was the *original* Tang-dynasty Chinese fixation method;
   China later shifted to pan-firing, Japan kept steaming. So "steamed ⇒ Japanese" is a strong default, not a
   rule. (Kamairicha remains the mirror exception: pan-fired Japanese green.)

4. **Bug-bitten (leafhopper) — NOT exclusive to Oriental Beauty.** The tea family already flags Gui Fei as
   bug-bitten, but the effect (leafhopper bites → the honey/muscatel aromatics) also appears in bug-bitten
   Dong Ding, some Ruby/Hong Yu black teas, and "Concubine" oolongs. Oriental Beauty is the *most famous*
   bug-bitten tea, not the only one. Model **bug-bitten as an attribute** (like roast/shading), not an OB trait.

5. **Qing Xiang / Nong Xiang (清香 / 浓香, "light/clear" vs "heavy/roasted" fragrance) — general oolong style
   terms, not Wuyi-only.** I used them for both Wuyi roast levels *and* Anxi Tie Guan Yin styles — which is
   actually correct, because they're cross-cutting style descriptors (esp. standard for TGY: jade qing xiang
   vs roasted nong xiang). Worth stating explicitly so they're not read as a Wuyi signal.

6. **"Yun" (韻, rhyme/charm) — a general concept; only the *specific* forms are region-locked.** Yan yun (rock
   rhyme) = Wuyi; shan yun (mountain rhyme) = Dan Cong / high-mountain; guanyin yun = Tie Guan Yin. The bare
   idea of "yun" is shared; the qualified term is the fingerprint. (My usage was fine — noting for clarity.)

**What genuinely IS (near-)definitional to one class — keep these as class markers:**
- **Men huang** (闷黄, "sealed yellowing") ⇒ yellow tea. Definitional.
- **Wo dui** (渥堆, wet-piling) ⇒ ripe/shou pu-erh. Definitional (to be authored).
- **Shading ladder** (kabuse/gyokuro) ⇒ Japanese greens. Effectively class-defining (Enshi's "shade" is just
  natural mist, not netting).
- **Ball-rolling in a cloth sack** (布球揉捻) ⇒ southern-Fujian/Taiwanese style (TGY, Dong Ding, gaoshan) —
  strong marker, though "ball-rolled" as a shape is shared.

**Net effect on the model:** promote *tan bei / zuo qing / bug-bitten / qing-nong xiang* from implied class
markers to **cross-cutting attributes** on a tea (roast-method, oxidation-emphasis, bug-bitten flag, roast-style).
Only men huang, wo dui, and the shading ladder stay as near-definitional class fingerprints.

---

# Batch 5 — Oolong deep-read (Kiel oolong page + individual product pages)

Source: `tee-kontor-kiel.de/tee/oolong/` (63 products) + individual product pages read directly (e.g.
`/bio-pinglin-baozhong/`). **Confirms three Batch-4 audit points with real catalog evidence**, adds two
classes/members, and surfaces two harvest/oxidation *attributes*.

## Audit points confirmed by this catalog
- **Tan bei is not Wuyi-only** — the catalog literally sells **"2013 Lala Shan Jin Xuan Tanbei"**: a
  Taiwanese high-mountain oolong charcoal-roasted (Tanbei) by Master Atong Chen. Exactly the correction.
- **Kamairicha = pan-fired Japanese green** — the "Minami Sayaka Oolong Kamairicha" page states kamairicha is
  an *ungedämpfter* (unsteamed), dry-heated green, "resembling Chinese production," now nearly extinct as
  Japan went almost fully steamed. → kamairicha upgraded **verify → canonical**.
- **"Milk oolong" is usually flavoured** — the shop's "Bio Milky Oolong" is a **Tie Guan Yin base sprayed with
  natural caramel + vanilla flavouring** (ingredients literally list it), *not* Jin Xuan. Concrete proof of
  the Batch-2 P4 note: the label tell works.

## Oolong is a *process*, not a region (new cross-cutting fact)
The catalog carries oolong from **Japan** (Shin-Ryu, Mai-Ryu, Karasu, Sakura-No — Baozhong-style, cultivars
Takachiho/Unkai/Yutaka Midori from Takachiho/Kyushu), **Nepal** (Jun Chiyabari), **Thailand** (Ruby, Doi Mae
Salong, Ruan Zhi cultivar), and **Java** (Halimun). So "oolong ⇒ China/Taiwan" is a default, not a rule —
oolong is defined by the partial-oxidation + (usually) rolling process, and it's made globally now. The
matcher should treat region as *inferred-but-overridable*, never assume China/Taiwan from "oolong."

## New class
- **Baozhong (包種茶 / Pouchong)** — the **least-oxidised oolong** (~10–20%), strip-style (not ball-rolled),
  floral, "bridges green-tea freshness and oolong depth." Pinglin (N. Taiwan) is the production centre;
  cultivars Qing Xin / Ruan Zhi. Brew ~95 °C, gaiwan 2–3 g/150 ml, 60 s. A clean low-oxidation anchor at the
  green end of the oolong spectrum (mirror to Oriental Beauty at the black end).

## New member (Anxi group, alongside Tie Guan Yin)
- **Huang Jin Gui (黄金桂, "Golden Osmanthus")** — Anxi/Fujian cultivar, cousin to Tie Guan Yin; golden leaf,
  high floral (osmanthus) aroma; ball-rolled, light–medium oxidation. Add as a member under Anxi TGY's group.

## Two attributes this surfaced (NOT classes — model as attributes)
- **Dong Pian (冬片, "winter sprout")** — a rare *late* pluck after the winter harvest (mild weather triggers
  re-flush); sweeter, softer. It's a **harvest attribute** like shincha/first-flush, applicable to many
  Taiwanese oolongs — not its own type.
- **Hong Oolong / "Black Oolong"** (Wuyi Hong Oolong, Shan Lin Xi Black Oolong, Xian You Honey Black) —
  oolong **oxidised further than usual, toward black**. Confirms oxidation is a *continuum*: Baozhong (10–20%)
  → gaoshan (20–40%) → Dong Ding/TGY (30–50%) → yancha (40–70%) → Dan Cong/OB (50–80%) → hong oolong (→black).
  Model as a high value on the oxidation axis, not a separate class. (Qing Xin 青心 "green heart" is the
  dominant Taiwanese gaoshan cultivar seen across Alishan/Nanhu/Dong Ding; Ruan Zhi = TTES #17, aka Bai Lu.)

## Machine-readable additions
```json
[
  {"slug":"baozhong","parent":null,"display_name":"Baozhong (Pouchong)","aka":["包種茶","Pouchong","Wenshan Baozhong"],"family":"oolong","region":"Pinglin / Wenshan, N. Taiwan","leaf_shape":"strip-twisted","oxidation_low":10,"oxidation_high":20,"roast":"none-light","signature":"least-oxidised oolong; floral, green-fresh; bridges green tea and oolong","typical_brew":{"temp_c":[90,95],"g_per_100ml":2.5,"note":"gaiwan ~60s; western ~90s"},"confidence":"canonical","covers":[]},
  {"slug":"huang-jin-gui","parent":"anxi-tie-guan-yin","display_name":"Huang Jin Gui","aka":["黄金桂","Golden Osmanthus","Golden Cassia"],"note":"Anxi cultivar cousin to Tie Guan Yin; golden leaf, high osmanthus-floral aroma; ball-rolled, light-medium oxidation"}
]
```
**Note for Code:** `dong-pian` and `hong/black-oolong` are **attributes**, deliberately *not* given class rows
— they attach to existing oolong classes (harvest = dong-pian; oxidation pushed high = hong). Same
attribute-not-class treatment as the Batch-4 audit and the Japanese shading/steaming axes.

---

# Batch 6 — Pu-erh / dark tea (hei cha)  [NEW FAMILY]

Sources: `teasenz.com/yunnan-pu-erh-teas` (80 products + explainer) cross-checked against the Kiel pu-erh
category tree (Sheng / Shou / Aged / Loose / Tuocha / factory names). Pu-erh is a **6th tea family** for the
DB — the first post-fermented one.

## Family framing (important)
Pu-erh is **not the top-level family** — the family is **hei cha (黑茶, "dark" / post-fermented tea)**, and
**pu-erh is its Yunnan member**. Other hei cha exist and are *not* pu-erh: Liu Bao (Guangxi), Anhua hei cha
(Hunan), Ya'an/Tibetan border brick (Sichuan). So: `family = dark`, and pu-erh is a region-locked class within
it. (Vendors loosely call all of it "pu-erh," which is the same over-generalisation the matcher must resist —
like "champagne" for sparkling wine.)

## The one real processing fork: Sheng vs Shou
- **Sheng (生, "raw")** — pick → wither → **low-temp sha qing** (kill-green *gentler* than green tea, so
  enzymes survive) → roll → **sun-dry (shai qing 晒青)** → this loose "**mao cha**" → steam + compress. Then it
  **ages slowly over years/decades** by natural post-fermentation. Young sheng is green/floral/bitter/brisk;
  aged sheng turns mellow, honeyed, woody. **Key nuance: sheng is NOT just a green tea** — the low kill-green
  + sun-drying deliberately leave enzymes/microbes alive for aging. That's the whole point.
- **Shou (熟, "ripe"/"cooked")** — mao cha undergoes **wo dui (渥堆, wet-piling)**: ~40–60 days of controlled
  damp heaping that force-ferments the leaf (invented 1973, Kunming/Menghai) → then compressed. Dark, smooth,
  earthy, low bitterness, **drinkable young**. **Wo dui is the definitional step of shou** (from Batch-4 audit).

So the fork is simply: *natural slow aging (sheng)* vs *accelerated wet-pile fermentation (shou)*. Everything
else is an attribute.

## Attributes (NOT classes — model as attributes, like Batch-4/5)
- **Compression format:** cake/bing (饼, standard 357g "qi zi bing", also 200g/100g) · tuocha (沱, bowl/nest —
  Xiaguan's specialty) · brick/zhuan (砖) · dragon ball (7–8g) · mini cake (7g) · loose mao cha. Format affects
  aging/steeping, not category. (Cake = +steam+press over loose, same as the white-tea cake fork.)
- **Terroir / mountain** (sheng appellations, like Wuyi's zhengyan): Yiwu, Bingdao, Bulang, Yibang, Lincang,
  Menghai, Guangbie, Daxueshan… Strong value signal; treat as origin attribute.
- **Material / grade:** gushu (古树, ancient-tree) vs plantation; purple/zi cha (紫茶, purple-leaf varietal —
  the "Velvet Mountain Purple" cake).
- **Age / vintage:** the defining variable for sheng; year matters enormously (aged raw ≫ young raw in price).
- **Factory + recipe number:** Dayi/TAETEA (Menghai Tea Factory), Xiaguan, Haiwan, Tulin. The 4-digit recipe
  code (e.g. 7542, 8501) = [recipe-year][leaf-grade][factory]. A whole naming subsystem for factory cakes.

## Edge case (flavoured/scented, not a class)
- **Xiao Qing Gan (小青柑)** — ripe pu-erh stuffed inside a hollowed green mandarin; the peel flavours the tea.
  Scented product → `flavoured:true` (same treatment as jasmine silver needle / ginseng oolong).

## Naming traps for the matcher
- "Raw"/sheng cakes *look* green and young sheng even tastes greenish — but `family` is **dark**, not green.
  Don't infer green from appearance or from a low vintage.
- Numbers like 7542 / 8501 are **recipe codes**, not years or weights.
- "Pu-erh" in a product name is reliable for Yunnan; but a "dark tea" that says Liu Bao / Anhua is hei cha,
  **not** pu-erh.

## Brew
Near-boiling (95–100 °C), gongfu, **rinse 1–2× first** (especially shou and compressed), then flash steeps;
very many infusions. Shou is forgiving; young sheng bites if oversteeped.

## Gaps
- Liu Bao, Anhua hei cha, Sichuan border brick — the non-pu-erh hei cha siblings; author when one appears.
- Factory recipe-code decoding could be its own small reference table later.

## Machine-readable additions
```json
[
  {"slug":"hei-cha","parent":null,"display_name":"Hei Cha (Dark / Post-Fermented Tea)","aka":["dark tea","post-fermented tea","黑茶"],"family":"dark","region":"China (Yunnan, Guangxi, Hunan, Sichuan)","leaf_shape":"varies (loose or compressed)","oxidation_low":0,"oxidation_high":100,"roast":"none","signature":"post-fermented (microbial) tea; pu-erh is the Yunnan member; also Liu Bao, Anhua","typical_brew":{"temp_c":[95,100],"g_per_100ml":5,"note":"rinse then flash steeps"},"confidence":"canonical","covers":[]},
  {"slug":"sheng-puerh","parent":"hei-cha","display_name":"Sheng Pu-erh (Raw)","aka":["生普","raw pu-erh","sheng","raw puer"],"family":"dark","region":"Yunnan, China","leaf_shape":"compressed cake/loose maocha","oxidation_low":0,"oxidation_high":100,"roast":"none","signature":"low kill-green + sun-dried maocha, compressed; ages naturally over years; NOT a green tea","typical_brew":{"temp_c":[90,100],"g_per_100ml":5,"note":"rinse; flash steeps; young sheng bitter if oversteeped"},"confidence":"canonical","covers":[]},
  {"slug":"shou-puerh","parent":"hei-cha","display_name":"Shou Pu-erh (Ripe/Cooked)","aka":["熟普","ripe pu-erh","shou","cooked puer"],"family":"dark","region":"Yunnan, China","leaf_shape":"compressed cake/loose","oxidation_low":0,"oxidation_high":100,"roast":"none","signature":"wo dui (wet-piling ~1973) force-ferments the leaf; dark, earthy, smooth, drinkable young","typical_brew":{"temp_c":[95,100],"g_per_100ml":5,"note":"rinse 1-2x; forgiving; many steeps"},"confidence":"canonical","covers":[]}
]
```
**Note for Code:** format / terroir / vintage / factory-code / gushu / purple are **attributes** on a sheng or
shou row — deliberately not classes. `family:"dark"` is new (6th family). Hei-cha is the parent; sheng & shou
are the two processing children; non-pu-erh hei cha (Liu Bao etc.) will be future siblings under hei-cha.

---

# Batch 7 — Black tea / hong cha  [NEW FAMILY]

Sources: `teasenz.com/loose-leaf-black-teas` (15 teas + explainer); Kiel black-tea category tree cross-checked
(Darjeeling / Assam / Ceylon / Nepal / China / Taiwan / Japan sub-trees). 7th family for the DB.

## THE naming trap (flag hard — biggest in tea)
**Western "black tea" = Chinese "hong cha" (红茶, "red tea")** — named for the red liquor, fully oxidised.
**Chinese "hei cha" (黑茶, literally "black tea") = the DARK/post-fermented family = pu-erh (Batch 6).**
So the word "black" points to **two different families** depending on language:
- EN "black" → `family:"black"` (hong cha) — Keemun, Dian Hong, Assam…
- ZH 黑 "black" → `family:"dark"` (hei cha) — pu-erh, Liu Bao…
The matcher must map **"black tea" → hong cha (oxidised)**, and only route to the dark family when it sees
hei cha / pu-erh / Liu Bao. This one trap probably causes more misfiling than any other.

## Processing (what defines the family)
Wither → **roll/bruise** → **full oxidation (~100%)** → dry. **No kill-green** (unlike green/oolong/yellow) —
oxidation is allowed to run to completion. That's the whole definition; regional classes differ by cultivar,
terroir, drying, and finish, not by the core steps.

## Chinese black classes (members under hong-cha)
- **Dian Hong (滇红)** — Yunnan, large-leaf Assamica; golden-tip, malty, honey, cocoa. (Incl. "Yunnan Gold",
  "Black Needle", "Red Dragon Pearls" = rolled-pearl format.)
- **Keemun / Qimen (祁门红茶)** — Anhui; wine, cocoa, orchid; the classic English-Breakfast base.
- **Lapsang Souchong / Zheng Shan Xiao Zhong (正山小种)** — Tongmu, Wuyi, Fujian; **the world's original black
  tea** (17th c.). Traditionally **pine-smoked** (smoky), but unsmoked versions are common now.
- **Jin Jun Mei (金骏眉)** — Tongmu, Fujian; **premium all-golden-bud** black, **modern (created 2005)**;
  honey/fruit, no smoke. Heavily faked → treat "Jin Jun Mei" claims with a value hedge.
- **Ying Hong #9 (英红九号, Yingde, Guangdong)** · **Lichuan Hong (利川红, Hubei, gongfu style)** · **Jin Mu Dan
  (金牡丹, "Golden Peony", a cultivar black)** — regional/cultivar members.

## Attributes (NOT classes)
- **Smoked vs unsmoked** — Lapsang can be either (pine-smoke over Tongmu is the traditional finish). Attribute.
- **Drying: shai hong (晒红, sun-dried black)** — a Yunnan style dried like pu-erh mao cha instead of oven-dried;
  **can be compressed into cakes and aged** ("Amber Sunrise" / "Shai Hong" cakes). A drying + compression
  attribute that bridges toward pu-erh — not a separate class.
- **Format:** rolled pearls (Red Dragon Pearls), needles, whole-leaf vs broken/CTC.
- **Gongfu / Congou (工夫红茶)** — a *fine strip-style* finish descriptor (Keemun Congou, Lichuan Gongfu), not a
  distinct tea.
- **Flavoured/scented:** Lychee Black, etc. → `flavoured:true`.

## Siblings not yet authored (the non-Chinese blacks)
Black tea is the one family where China is a minority of world output. The Kiel tree confirms the big siblings:
**Assam, Darjeeling (India), Ceylon (Sri Lanka), Nepal, Kenya**, plus **Japanese wakoucha/koucha** and
Taiwanese blacks (Sun Moon Lake / Ruby 18 = Hong Yu — ties back to the bug-bitten note). Author when one enters
the library. So `family:"black"` is broad; the Chinese members above are just the first slice.

## Brew
Chinese gongfu blacks take **~85–95 °C** (Dian Hong / Jin Jun Mei bitter if too hot), rinse optional, short
steeps, many infusions. Western style: ~1 tsp/cup, 90–95 °C, 3–4 min.

## Machine-readable additions
```json
[
  {"slug":"hong-cha","parent":null,"display_name":"Hong Cha (Black / Red Tea)","aka":["black tea","red tea","红茶"],"family":"black","region":"China + global (India, Sri Lanka, etc.)","leaf_shape":"strip / broken / rolled","oxidation_low":90,"oxidation_high":100,"roast":"none","signature":"fully oxidised, no kill-green; EN 'black' = ZH 'red/hong cha' (NOT hei cha/pu-erh)","typical_brew":{"temp_c":[85,95],"g_per_100ml":3,"note":"gongfu short steeps or western 3-4 min"},"confidence":"canonical","covers":[]},
  {"slug":"dian-hong","parent":"hong-cha","display_name":"Dian Hong","aka":["Yunnan Gold","Yunnan Black","滇红"],"note":"Yunnan large-leaf Assamica; golden-tip, malty, honey, cocoa; incl. Black Needle & Red Dragon Pearls"},
  {"slug":"keemun","parent":"hong-cha","display_name":"Keemun (Qimen)","aka":["Qimen","Keemun Congou","祁门红茶"],"note":"Anhui; wine/cocoa/orchid; classic English-Breakfast base"},
  {"slug":"lapsang-souchong","parent":"hong-cha","display_name":"Lapsang Souchong (Zheng Shan Xiao Zhong)","aka":["Zheng Shan Xiao Zhong","正山小种","souchong"],"note":"Tongmu, Wuyi, Fujian; the ORIGINAL black tea (17th c.); traditionally pine-smoked, now often unsmoked"},
  {"slug":"jin-jun-mei","parent":"hong-cha","display_name":"Jin Jun Mei","aka":["Golden Eyebrow","金骏眉"],"note":"Tongmu, Fujian; premium all-golden-bud black; modern (2005); honey/fruit; heavily faked"},
  {"slug":"ying-hong","parent":"hong-cha","display_name":"Ying Hong #9 (Yingde)","aka":["英红九号","Yingde Black"],"note":"Yingde, Guangdong; cultivar Ying Hong #9; bold, cocoa-sweet"},
  {"slug":"lichuan-hong","parent":"hong-cha","display_name":"Lichuan Hong","aka":["利川红","Lichuan Gongfu"],"note":"Hubei; gongfu-style strip black; smooth, fruity"},
  {"slug":"jin-mu-dan-black","parent":"hong-cha","display_name":"Jin Mu Dan (Golden Peony)","aka":["金牡丹"],"note":"Fujian cultivar black (Jin Mu Dan cultivar, also used for oolong); floral-sweet"}
]
```
**Note for Code:** smoked / shai-hong / pearls / gongfu / flavoured are **attributes** on a hong-cha member, not
classes. `family:"black"` (hong cha) and `family:"dark"` (hei cha, Batch 6) are **different families** — the
EN/ZH "black" collision is the headline matcher rule.

---

# Family scorecard (after Batches 1–7)
Six of the standard seven Camellia sinensis families are now anchored, plus the two-level + attribute model:
**green** (JP shaded/steamed ladder + Chinese Anji-trap), **white** (Fujian grade ladder + Yue Guang Bai),
**oolong** (Wuyi / Dan Cong / Anxi / Baozhong / Taiwanese + global), **yellow** (huang ya, men-huang),
**black/hong cha** (Dian Hong, Keemun, Lapsang, Jin Jun Mei…), **dark/hei cha** (sheng & shou pu-erh).
**Cross-family attributes** established: roast (method × level), oxidation (continuum), shading, steaming depth,
harvest (shincha/dong-pian), bug-bitten, compression/format, smoked, drying (shai), flavoured, terroir, vintage.
**Still open:** non-Chinese blacks (Assam/Darjeeling/Ceylon), non-pu-erh hei cha (Liu Bao/Anhua), more yellow
(Junshan Yinzhen), Baozhong-region greens — all one catalog away.
