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
