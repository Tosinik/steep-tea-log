# smoke.md — the on-device checklist

Some behaviour cannot be reached by any `fixtures/*-test.js` suite, because a Node `vm` sandbox has
no browser to exercise: the DOM **History API** (`pushState`/`popstate`, the back gesture), the
**Screen Wake Lock API**, the service-worker update flow, real **touch gestures**, and actual
storage **eviction**. A green suite proves nothing about any of these.

**A slice that ships one of those surfaces ships an entry here and a phone check by Niklas** — *pre-push*
only where a local server can drive the surface; anything that exists only on the served PWA (SW lifecycle,
deep-link scroll, install/update) is **post-deploy on the live app, fix-forward**, and **never holds a green
build unpushed** (the rule is in `CLAUDE.md`, "Non-automatable surfaces"). This file is the record: what to
do on the device, and what a pass looks like. Run the entries for whatever the deploy touched — nothing below
is covered by the suites.

The verifier and `/slowcup-deploy` gate the *automatable* half; this is the half a person has to
look at. It is the same division R122 drew for design (look to find, read to measure), applied to
runtime behaviour: a check certifies what it can reach, and names what it cannot.

---

## v4.17 · #35 draft survival + #34 back gesture  *(confirmed on device before push)*

1. **Close-and-reopen mid-sitting.** Start a session, log a steep, background the app (home / app
   switcher), wait, reopen → the sitting is **still there, on the session screen**, not dumped to
   Home. *(Niklas confirmed on v4.17 live.)*
2. **Photo-drop notice.** If a photo was added mid-session before backgrounding, restore shows once:
   *"Picked up your [tea] sitting — its photo wasn't kept."* It states the fact and asks nothing. If
   on the device it reads as an instruction to re-add, the fence drops the line (R139).
3. **Swipe-back on a detail screen** (tea detail, a session detail) → steps back **one screen**, does
   **not** exit SlowCup.
4. **Swipe-back from a running steep** → leaves to the Teas tab; the draft is safe (reopen shows it).
   Back must **never** resurrect or drop into a live steep. *(Niklas confirmed on v4.17 live.)*

---

## v4.18 · #33 wake-lock + #30-B pause-on-hide  *(the lock follows the timer's running state)*

The Screen Wake Lock API and the lock/timer interaction have no `vm` reach — the suite pins the
source facts (acquire tied to `running`, release on stop, re-acquire guarded on running) but only a
phone shows the screen actually staying lit and the lock following the timer. Three checks:

1. **Screen stays awake while a steep runs.** Start a steep, don't touch the phone → the screen does
   **not** dim/lock while the timer counts. Pause the timer → the screen may dim as normal (the lock
   is released; the phone's own timeout takes over).
2. **Background and return while RUNNING** → the timer paused itself on the way out (holds where you
   left it, no drift), and on return the lock comes back **when you resume**, not before.
3. **Background and return while PAUSED** → the lock does **not** re-acquire on return; the screen is
   not held awake to show a frozen clock. It re-acquires only when you tap resume.

---

## v4.20 · #shelf swatch — F29 the dashed plate on a dimmed screen  *(the visual half R144 can't automate)*

The suite asserts the SVG `<path>` is present with `stroke:var(--line)` / `stroke-dasharray:13 6` — but a
vm has no renderer, so two things only a phone shows: whether a **CSS variable resolves on an SVG stroke**
(the `style="…stroke:var(--line)…"` form is used precisely because presentation-attribute vars don't
always resolve), and whether the **~1.3:1 plate edge** reads at all in the worst case. One check:

1. **DARK mode, screen dimmed to LOW brightness** — open the library in ROWS density. A tier-3 **dashed
   plate** reads as a **different object** from a filled swatch on an adjacent row: the interrupted
   outline vs. the continuous block is legible, not a faint scratch. The trailing photo thumb (small
   square) reads as a separate thing from the leading swatch (tin shape), not a second swatch.
   - **Note, not a fail:** the tightest pair — a filled **near-black** beside a plate — may be absent
     from the live shelf (board F21: Fei Bing is tier 3, so near-black never appears). If it's not there,
     that's an observation; the plate-vs-fill legibility still holds on the pairs that are present
     (12 filled / 9 plates on the current shelf).

---

## v4.25 · #36 update-banner note comes from the INCOMING version  *(confirm on the NEXT deploy)*

The service-worker update flow has no `vm` reach — `fixtures/update-banner-test.js` pins the source facts
(single source in `steep-version.js`, the SW references-not-duplicates the note, the `GET_WHATS_NEW`
reply, the banner asks the waiting worker and falls back to the local constant, `reg.installing` tracked)
— but only a device shows the banner across a real version transition. **This fix is confirmed on the
deploy AFTER v4.25**, not v4.25 itself: the v4.24→v4.25 update still runs the OLD (v4.24) boot, which
reads the note locally. v4.25's boot is the first that reads the *incoming* note, so the first correctly
displayed note is the NEXT deploy's. This is the standing check to run then (v4.26, v4.27, …):

1. **On v4.25 (or later), deploy the next version** with a DISTINCT `WHATS_NEW` in `steep-version.js`.
   Open the app (or wait for the hourly check) so the update installs and the **Refresh** banner appears.
2. **The banner's second line = the INCOMING version's `WHATS_NEW`** — the note committed in the *new*
   deploy's `steep-version.js`, NOT the one you're leaving. That leaving-version note was the bug.
3. **Cross-check it came from the new SW, not a stale copy** (console — more than a phone glance):
   `navigator.serviceWorker.getRegistration().then(r=>{const c=new MessageChannel();c.port1.onmessage=e=>console.log(e.data);r.waiting.postMessage({type:'GET_WHATS_NEW'},[c.port2]);});`
   → the logged `{note, version}` must equal the INCOMING deploy's `steep-version.js` (version = the new
   `APP_VERSION`; note = the new `WHATS_NEW`). Matching the **version** is what proves the note came from
   the incoming worker, which is the actual defect (#36).
4. **No-banner gap** (harder to stage): if an update was mid-install when you opened the app, the banner
   still appears *this* load, not a version later. Note it if "Refresh" ever arrives a version late again.

---

## v4.27 · R159 the warm Home combined slice  *(confirm on device)*

The lead-insight engine is vm-covered (`fixtures/insight-engine-test.js`), but the render, the
localStorage cooldown, and the app-wide ground change have no vm reach. On device:

1. **Does the lead insight read as a DOOR?** On Home, the insight line under the greeting shows a jade
   chevron + "why, on Insights"; tapping it opens Insights (a real destination — the specific deep page
   is a later slice). Press washes the register edge-to-edge (no card lift, no shadow).
2. **Does the warmth land?** Earlier-today rows lead with a bold 30px liquor swatch; Running low shows a
   14px swatch; the door carries the named tea's swatch. Colour is data — an insight naming no tea has
   no swatch, and the sentence takes the full width.
3. **Does the whiter ground work on the OTHER FOUR surfaces?** *(highest-attention)* `--porcelain` went
   `#F6F2E9 → #FAF8F3` **app-wide** — check the shelf, Shopping, session-detail and Insights still read
   on the new paper (pale liquor swatches should separate *better*, not worse). Dark mode untouched.
4. **Does the lead stick within a day and rotate across days?** Stable all day; across days it rotates
   (a shown type isn't repeated for ~7 days). Cooldown is device-local: devtools
   `localStorage.getItem('tealog_insightlog')` shows `{type→dayKey}`; clear it to reset. Cross-device
   repetition is the accepted cost (not synced).
5. **The two ways in** are both visible and independent: the **58px** jade **Log FAB** (always), and
   **Start steeping** (clay) only when a tea is proposed.
6. **Wrapped moment:** in the first ~5 days of a month, "Your {month}" appears under the greeting and
   opens Wrapped; after, it's gone with no remnant (the archive stays on Insights, R103).

---

## v4.31 · Brew-advice v4 Stage 1 — the diagnosis engine (dormant) + the net-sign retire  *(confirm on device, post-deploy)*

The diagnosis engine is **dormant** (vm-covered by `fixtures/brew-advice-v4-test.js`; no capture writes the
new enum yet — that's Slice 2). The only user-visible change this slice is the **retire** of the old net-sign
auto-tuning, which degrades gracefully. On the live app:

1. **The setup preview reads right without the "Your tuning" segment.** Open a session for a tea you've given
   feedback on before: the brew-guide preview shows **Guide / Off** (no "Your tuning" option), the schedule is
   your guide (ratio-scaled if applicable), and the memory line still shows the counts (e.g. "Logged 5× · 3
   just right · 2 a bit strong") — with **no** "suggests cooler/shorter" and **no** "landing well" claim.
   Nothing about starting or running a steep breaks.
2. **Per-steep taps still record** (the old 3-tap, gongfu/senchadō only) — the tap still nudges the next
   steep's timer and still saves; it just no longer auto-tunes the saved guide. (The richer 5-tap capture +
   the advice itself arrive in Slice 2.)

---

## v4.30 · R5 reflection Slice A — the deep pages + the deep-link scroll  *(confirm on device)*

The reflection **logic** is vm-covered (`fixtures/reflection-test.js` — the route map, the aggregations,
the view render); the **deep-link scroll** (`scrollIntoView` on `#reflect-<focus>`) and real **taps** have no
`vm` reach (no DOM, no `requestAnimationFrame`). Only a phone shows the door landing *on* the section. On
device:

1. **The Home lead-insight door lands on the right section, scrolled to it.** When the lead insight is a
   mapped type, tapping it opens the deep page **already scrolled to the section that explains it** — not the
   top of the page to hunt from. palate-lean / highest-rated → **Your palate**; morning-truth / temperatures
   → **Your ritual** (the "When you brew" clock, or Temperatures). *(An unmapped lead — freshness,
   haven't-reached-for — still opens Insights; that's the graceful fallback until Slice B, not a bug.)*
2. **The Insights sections are doors.** On Insights, the **type-mix** bar and the **colour clock** each show a
   jade chevron; tapping type-mix opens **Your palate**, tapping the clock opens **Your ritual** scrolled to
   the clock. The press washes the section edge-to-edge (no card lift). In **edit layout** mode the taps are
   inert (you can reorder the cards without navigating away).
3. **The two views read as spine surfaces.** **Your ritual** = a BAND masthead + the expanded colour clock
   (+ what you drink when) · vessels · temperatures · rhythm. **Your palate** = families-you-reach-for bars
   (with per-type average ★) + rated-highest. No card lift, no stray colour — the type bars are the only
   colour; a section with no data is simply absent (never a guessed figure).
4. **Back returns to Insights, not a dead-end or a loop.** From either deep page, the OS back gesture (and
   the "← Back to Insights" button) returns to the Insights tab — once, cleanly. Tapping a tea inside Your
   palate opens its detail; back from there behaves normally. Reloading while on a deep page lands you back on
   a tab (the deep pages don't persist), never on a blank deep page.

---

## v4.29 · R5 warmth pass — the swatch follow-on (shelf / shopping / session-detail)  *(confirm on device)*

The swatch SITES are vm-covered (`liquor-test` F2, `frame-test`); whether the marks READ and the one layout
change holds is the phone look — same visual half R144 named for the shelf swatch (v4.20). On device:

1. **Shelf swatch at 30×40.** Open the library — the identity swatch/plate reads **larger** than before, and
   the tier-3 **dashed plate** still reads as a different object from a filled swatch (the v4.20 check, now
   at the bigger size). No clipping, no aspect distortion (the shape is the same, just scaled).
2. **Session-detail band — the new row layout.** Open a session's page: the band is now **swatch | text**,
   a **44×58** colour plate to the left of the date/name/ident stack, vertically centred. A **long tea
   name** wraps in its column without pushing the swatch or breaking the band. **Unknown-tea** session → no
   swatch, text alone (no empty gap). The plate is the session's tea's colour.
3. **Shopping swatches.** On Shopping: every **Running low** row leads with a 14px colour swatch; on **Your
   list**, a row leads with one **only when it's a rebuy** (the want is already on the shelf) — a plain want
   has **no** swatch. Colour is data: no invented colour on a want with no tea.

---

## v4.28 · R5 warmth pass — Insights (the colour clock)  *(confirm on device)*

The colour-clock logic is vm-covered (`fixtures/insight-warmth-test.js`); whether it READS is the phone
look. On Insights:

1. **Does the colour clock read as information?** "When you brew" — each 2-hour bar takes the liquor of
   the tea you most drank in that slot (a green morning reads pale, a shou evening near-black). Do the 12
   bars read as "what you drank when," or as noise?
2. **Does `--heat-empty` read as "no data"?** An empty / tied / no-liquor slot takes recessed paper
   (`#E4DCC5`) — it should read as absence, not be mistaken for a pale liquor.
3. **Does the peak read?** The peak column's signal is now a **2px ink rule** beneath it (not an amber
   fill), beside the mono "peak 08–10" label — does it read in greyscale?
4. **Does the "Teas brewed" strip read as your palette, or decoration?** *(Keep/remove call — if it reads
   decorative rather than as your collection's colours, it's a one-line removal.)*
5. **Do the note swatches land?** Most reached-for / Highest note now lead with a 30px liquor swatch
   (leaf/hanko icons retired) — one mark per row.
