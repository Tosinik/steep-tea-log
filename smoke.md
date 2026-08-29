# smoke.md — the on-device checklist

Some behaviour cannot be reached by any `fixtures/*-test.js` suite, because a Node `vm` sandbox has
no browser to exercise: the DOM **History API** (`pushState`/`popstate`, the back gesture), the
**Screen Wake Lock API**, the service-worker update flow, real **touch gestures**, and actual
storage **eviction**. A green suite proves nothing about any of these.

**A slice that ships one of those surfaces ships an entry here and a phone check before push**
(the rule is in `CLAUDE.md`, "Non-automatable surfaces"). This file is the record: what to do on the
device, and what a pass looks like. Run the entries for whatever the deploy touched — nothing below
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
