# R3 #02 Sessions + Session detail — reconciliation
2026-07-18 · From Niklas + planning lane, to Design. Reviewed against the live repo (v3.90).

**Verdict: a big improvement on what ships today** — grouping by day reads as a diary rather
than a database, per-origin script carries through cleanly (大紅袍 / 玉露 / 煎茶 / 鐵觀音 /
玄米茶), "no clay on a list" is a correct contract read, dark was clearly rebuilt rather than
inherited, and carrying CALIBRATE vs TASTE into the read-back is the v3.90 fix paying off a
second time. The notes below are completeness and connection, not direction.

---

## STRUCTURAL — the connection map (do this before more screens)

**A session is a hub, not a leaf — and none of its links are drawn.** This is the third time
this class of gap has surfaced: nav completeness, then the surface inventory, now
connections. The inventory answered *what surfaces exist*; it never asked *what links to
what*. That's the missing artifact.

**Ask: produce a connection map** alongside the inventory — for each surface, what it links
**to** and what links **into** it. Otherwise every new screen arrives correct in isolation
and orphaned in practice, and we keep finding it one screen at a time.

Session's own connections, as a worked example:

**Out of a session:**
- → **Tea detail** (open the tea from the session) — currently missing, and it's the most
  obvious one
- → **Vessel** (once vessel screens exist)
- → **Edit session** (exists in the app today — see below)
- → **Delete session** (exists — `removeSession` / `dropSession`)
- → **New session** ("Brew this again")
- → **Social** — share this sitting, or pass this tea to someone in the circle
  (`is_shared` is a real stored field)
- → **Reference database** ("Go Deeper"), via the tea

**Into a session:**
- ← Home's "Earlier today" recents rows
- ← A tea's detail page, listing that tea's own sessions
- ← Insights — drilling from a stat into the sittings behind it

---

## DATA — what a session actually stores (answering Design's question)

Checked against `sql/schema.sql` and the real exports. Design's working list was: tea ·
vessel · method · date/time · N steeps (index, duration, °C, optional note) · rating ·
tasting notes/chips · calibration outcome. **Here is the true shape.**

### On `sessions`
`tea_id` · `vessel_id` · `session_date` · **`is_cold_brew`** · **`water_type`** ·
**`water_tds`** · **`grams_used`** · `rating` · `description` (session-level note) · `tags` ·
**`is_shared`** · `infusion_count` · **`photo_url`** · `feedback` (`good`/`strong`/`weak`) ·
**`mood`** · **`water_ml`** (v3.85) · **`brew_style`** (v3.85) · plus denormalised
`tea_name` / `tea_type` / `vessel_name`.

### On `steeps`
`steep_order` · `temp_c` · `time_seconds` · **`description`** (per-steep note) ·
**`tags`** (per-steep) · **`feedback`** (v3.89 per-steep strength tap).

### Design's two guesses
- **Cost — not on the session.** It lives on the tea (`cost_total` / `cost_original_grams`);
  per-session cost is *derived*, not stored.
- **Location — not stored at all.** Consistent with the Origins reasoning: where you *drink*
  isn't the interesting axis.

---

## SESSION DETAIL — the gaps

### D1. The steep pills drop three stored fields (biggest gap)
The pills show time + °C only. Each steep also carries **a note (`description`)**, **tags**,
and **the v3.89 per-steep feedback tap**. That last one matters most: v3.89 shipped a control
specifically so you can record how each individual infusion tasted — and it's the data
filling the phase-2 gate — but reading a session back, **you can't see what you tapped**.
CALIBRATE shows the *timer* outcome, which is a different thing.
Per-steep notes are not hypothetical: the app already has an editor for them
(`es_setSteep(i,'description',…)`, steep-sessions.js:283).
**Fix:** the pills (or an expanded steep row) must surface per-steep note, tags, and the
strength tap.

### D2. The flavour vocabulary is shown as static — it isn't
The TASTE chips are drawn as a fixed set. In the app, flavour words live in **`tagLibrary`**:
a persisted vocabulary that starts from defaults and **grows as you add custom words** (the
thing the v3.85 blur-commit fix protects). It's your own accumulating lexicon.
**Fix:** show it as what it is — the words you've earned, distinguishable from the ones you
haven't used yet. Niklas: *"the flavour notes that develop the more you brew — not visible
here."*

### D3. No photo — `photo_url` is a real field
Sessions carry photos (the v3.2 feature). The detail screen has a large empty region below
CALIBRATE that's the obvious home. A diary of sittings that drops the photographs loses the
most evocative thing it holds.

### D4. No edit, no delete — both exist in the app today
There's a session-edit modal (Water(ml) was added to it in v3.85; it edits per-steep fields
via `es_setSteep`) and `removeSession` / `dropSession`. Neither appears on Session detail.
Read a sitting back, spot a wrong gram weight, and there's no way to fix it. **Same
regression class as the missing "＋" and the Library filters.**
**Also: design the edit-session screen itself** — Niklas wants to see it, and it isn't in
the surface inventory as its own entry. Add it.

### D5. Missing session-level fields
Not all need equal prominence, but decide consciously rather than by omission:
**grams_used** and **water_ml** (the leaf/water ratio — arguably belongs beside the steeps),
**water_type / water_tds**, **mood**, **is_shared**, and the session-level `description` as
distinct from per-steep notes.

### D6. Three variants unhandled
- **Cold brew** (`is_cold_brew`) — no multi-steep arc; there's one in the real data.
- **Steepless / matcha** (#12, just ruled in scope) — *zero* steeps; the STEEPS block needs a
  no-steeps state.
- **Empty state** — a Sessions tab with nothing in it yet.

### D7. "Brew this again" is an invented feature — keep it, but name it
SES3 describes re-starting a session with the same **tea · vessel · method**. The app has
`startSessionFor(teaId)` — **same tea only**; it carries neither vessel nor method forward.
So this is new capability. It's a *good* idea and worth building — it just needs flagging as
new rather than assumed, and it becomes a small Code slice at hand-off.

### D8. Copy query
The Sencha Fukamushi row shows *"no note"* where other rows show stars. If that's standing in
for a missing **rating**, the word is wrong — no rating and no note are different absences.

---

## SESSIONS LIST — smaller notes

- **Calendar view:** correctly deferred in SES1 (*"a calendar view can come later"*).
  Confirmed fine — but record it as **deferred**, not dropped. Note the distinction: "This
  year ▾" is a *period filter*; a calendar is a *view* (a month grid showing which days you
  brewed). Different features.
- **Brewing-days display:** not wanted. No action.
- The right-hand column mixing "this morning / 8:12 / 11 Jul" reads naturally — keep.

---

## Sequencing
The **connection map** comes first — it changes what every subsequent screen has to carry.
Then D1–D8 on Session detail, plus the edit-session screen. Then #03 Tea detail (which is
itself a major connection target: it should list the tea's own sessions, and reach Go Deeper).
Bundle 1 + Bundle 2 + these build screens still hand to Code **together**, once all lock.
