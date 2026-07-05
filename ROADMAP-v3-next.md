# Steep — roadmap after v3 (data layer + quick log shipped)

Tiered by value × ease. Effort: S / M / L. "New infra" = needs something beyond
the current client + Supabase (BaaS) setup — usually an Edge Function or packaging.

## Shipped since this roadmap was written
- **Session photos** (Tier 1) — v3.2.
- **Insights card** — v3.12. Cadence, weekend/weekday, time-of-day, month-vs-month on Home.
- **Offline write queue (Option B)** — v3.13. Local-first writes; FIFO replay on reconnect;
  idempotent; photos on offline sessions are deferred (re-add when online). ← the Tier-3 L item.

**Up next:** Steep Wrapped → tiny-fix cleanup pass → vendor-into-Teas + richer persona.

## Tier 1 — Do next (cheap, on-theme, no new infra)
- **Quiet Mode + dashboard reorder** (S) — lead with persona + recent sessions; one
  switch hides all gamification. The calm-first promise from the brief. Pure client.
- **Session photos** (S/M) — Storage exists; attach an image to a session, show in feed.
- **Library search / filter / sort** (S) — findability as the tea list grows. Client-side.
- **First-run onboarding + real empty states** (S) — guide add tea → vessel → first log.
- **Gentle streak grace / freeze** (S) — a grace day so a miss doesn't nuke a streak.
  Serves "celebrate, never guilt."

## Tier 2 — Strong second wave (moderate, within stack)
- **Brew-guide → prefilled steep schedule** (M) — turn each tea's free-text brewGuide into
  suggested temp/time that auto-fills each steep. Biggest ritual QoL win.
- **Per-user profile page** (M) — tap feed author → their shared sessions. RLS supports it.
- **Feed pagination / infinite scroll** (M) — future-proofs social (currently capped 50).
- **Likes / reactions** (M) — lighter than comments; small table + RLS.
- **Tea passport** (M) — regions/origins brewed, list or simple map. Uses existing origin field.
- **Collection achievements + milestones timeline** (S/M) — types/regions/cultivars. Peripheral.
- **Accessibility + polish pass** (M) — focus, contrast, haptics, skeletons.

## Tier 3 — Bigger bets (new infrastructure)
- **Offline write queue (Option B)** (L) — removes "can't save offline". Real correctness work.
- **Comments + light notifications** (L) — comments table + RLS + notifications surface.
- **Push notifications (Web Push / VAPID)** (M/L) — installed PWAs (Android; iOS 16.4+ from
  Home Screen). Needs first Edge Function to send. Pair with gentle brew nudges.
- **Label scanner** (M/L) — parked idea; first Edge Function + vision model. See IDEA note.
- **"Steep Wrapped" seasonal recap** (M) — shareable, on-brand, buildable from existing data.
- **Orphaned-photo cleanup** (M) — scheduled Edge Function or on-delete hook.

## Tier 4 — Later / speculative
Block/report + follow requests, water-profile presets, wishlist/vendor tracking,
deeper stats, importers from other trackers.

---

## Making it a "real app" (APK) — the ladder, cheapest first
1. **Installable PWA** — already have it (Add to Home Screen). No store, no APK file.
2. **TWA via PWABuilder / Bubblewrap → real APK/AAB** (LOW–MED, mostly config). Wraps the
   existing PWA. Needs: valid PWA (have it), assetlinks.json at /.well-known/ on the domain
   (GitHub Pages can serve it), a signing key. PWABuilder web UI generates the package.
   Sideload the APK, or publish to Play Store (Google Play dev account ~$25 one-time +
   identity verification). **Sweet spot for "an APK in hand."**
3. **Capacitor → native shell** (MED–HIGH + maintenance). Native APIs: camera, push, share,
   filesystem. Worth it once committing to the scanner + proper push. Also the path to the
   iOS App Store (Mac + Apple dev ~$99/yr).

**Call:** APK now → PWABuilder/TWA. Graduate to Capacitor when scanner/push justify native.
(Verify store fees/policies at build time — they drift.)

## Suggested order
Offline queue ✓ shipped. Next: **Steep Wrapped** (leans on the recap + insights engines) →
a **tiny-fix cleanup pass** (8-bit "4", cold-brew steeps, streak start) → **vendor-into-Teas**,
**richer persona**, and **shopping list** (extends the forecast/restock work). Treat brew-advice,
the world-map zoom, and meditative-mode focus as the meatier follow-ons. Package an APK with
PWABuilder whenever you want it on your phone; keep push + scanner + cleanup grouped to amortize
the first Edge Function.

---

## Parked ideas (batch 2)
- **Nicer empty dashboard for brand-new users** — first thing a new/invited user sees is a
  bare dashboard. Give it a warm empty state: a short "brew your first cup" prompt, sample
  of what the dashboard becomes, gentle onboarding. (Overlaps Tier-1 onboarding/empty states.)
- **World map tea passport (interactive)** — zoomable world/region map; click a region to see
  the teas you've brewed from there. The visual, richer version of the Tier-2 "tea passport".
  Effort M/L (map lib + region→tea mapping from the origin field).
- **"How did this tea make you feel" + sleep effect** — optional post-session check-in (mood/
  energy), and flag teas drunk late in the day to correlate with sleep. On-theme (ritual +
  self-knowledge), calm, opt-in. Effort M. Pairs well with the caffeine/night-owl data.

---

## Backlog additions (batch 3)
- **Cultivar map/passport** — like the origin world map but by cultivar. After sub-regions land.
- **High-altitude / old-tree achievement or visual** — celebrate gaoshan and ancient-tree teas (needs an altitude/age field on teas). Idea.
- **Meditative / focus mode during a session** — distraction-free screen; optional 8-bit animation (person drinking tea, tea garden, stream). Mechanic is doable now; character art should be human-made. 
- **Alternative timer animation** — cup filling/emptying as the steep runs. Very doable, on-theme.
- **Predictive consumption analysis** — per-tea burn rate from session history → "runs out in ~N days", drinking cadence, favourite-times insights. Feeds low-stock reminders.
- **Favourites low-stock reminder** — Home section surfacing favourited teas that are low/near-low.
- **Weight-with-packaging entry** — when adding a tea, option to enter weight incl. packaging with an adjustable tare (~10g default) so you needn't decant to weigh.
- **Partial vessel fill** — reflect not-filling to capacity (e.g. cold-brew flask 750ml filled to 600ml). Decision: per-vessel default fill vs per-session override.
- **XP / levels on achievements** — XP scales with rarity + time-to-earn; points from daily use, adding teas, logging. Gated by "show achievements" / quiet mode.
- **Rewards for levels/points** — 8-bit "tea corner" room you design; shop for kyusu, yixing, furniture, streams, ponds, CN/JP decor. Long-term.
- **Colour scheme shifting with tea consumption** — long-term ambient theming.
- **Vendor manager** — edit/rename/merge vendors (currently vendor is free text on teas; renaming is global find-replace).
- **German language option (i18n)** — full UI translation; sizeable string-extraction effort, needs its own pass.
- **8-bit gaiwan logo** — pixel version of user's dragon gaiwan. Placeholder until human-made art; keep logo a single swappable asset.

---

## Backlog additions (batch 4)
- **Shopping list** — a dedicated "to buy" list. Two feeders: (1) manual wishlist entries
  (name + optional vendor/notes, no full tea record needed), (2) auto-suggested restocks from
  the forecast engine (favourited/low/near-out teas). Check items off; checking a wishlist item
  can offer "add as tea". Calm, on-theme (extends the existing restock/forecast work rather than
  a new gamified surface). Effort M, no new infra. Overlaps Tier-4 "wishlist/vendor tracking"
  and the batch-3 "favourites low-stock reminder" — unify them here.
- **Brew-advice from session feedback** — after a session, gentle tuning suggestions: too
  bitter/strong → shorter steep, less leaf, cooler water; not strong enough → the opposite;
  "liked it? keep your params / something off? try it differently / just experiment — here's
  what you did last time, change one thing." Start rule-based from a structured "how was it?"
  pick (bitter / weak / balanced) rather than parsing free text; a model pass over the written
  description can come later. Pairs with Tier-2 "brew-guide → prefilled steep schedule". Effort M.
- **World map heat-shading + region zoom** — the passport map, shaded in deepening reds by how
  much you brew from each region, with zoom into sub-regions of China/Japan. Refines the batch-2
  "World map tea passport (interactive)"; the sub-region zoom is the new, heavier ask (needs a
  zoomable map lib + sub-region → origin matching). Effort M/L.
- **Meditative mode: gong-fu cup + stay-in-focus** — swap the cup art for a small gong-fu cup,
  and keep focus mode active for the whole session without exiting between steeps. Refines the
  batch-3 "meditative / focus mode" + "alternative timer animation" entries. Character/cup art
  stays human-made for public release. Effort M (flow/state work; art blocked on human art).
- **Richer tea persona** — more distinct persona variations driven by drinking habits (types,
  times, cadence, strength, cold vs hot), so it feels more personal. Effort S/M, pure client.
- **Vendor manager → Teas tab** — move vendor management out of Settings (wrong home as the list
  grows) into the Teas tab as an "edit vendors" control next to "+ add tea". Refines the batch-3
  "vendor manager" entry with a placement decision. Effort S/M.

### Small fixes (fold into one cleanup pass)
- **8-bit "4" vs "9"** — the pixel glyph for 4 can read as a 9; redraw it.
- **Differentiate hot vs cold brew in sessions** — cold-brew sessions shouldn't ask for/keep
  timed steeps; branch the session flow on isColdBrew. (There's already an isColdBrew flag.)
- **Streak grid starts at first session** — begin the heatmap/streak at the first-ever logged
  session, not account/epoch start, so there isn't a long empty run of weeks up front.
