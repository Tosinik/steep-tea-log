# SlowCup R3 — Surface Inventory (S1) + Edit-layout (S2)
2026-07-18 · From Design, to Niklas + planning lane. Answers the two structural blockers in
the Bundle 2 reconciliation before any new screens are built. Mirror of the board file
`SlowCup R3 - Surface Inventory.dc.html`.

**Status key**
- `DESIGNED` — built + locked
- `UNDESIGNED` — needs building
- `DEFERRED` — intentionally later
- `CONCEPT` — idea agreed, no screens yet
- `n/a` — deliberately doesn't exist

---

## The five tab slots

| Slot | Status | Note |
|---|---|---|
| Home | `DESIGNED` | Bundle 1 · WS2 |
| Library | `DESIGNED` | Bundle 1 · WS5 |
| ＋ (raised centre) | `UNDESIGNED` | launches session **setup** — the flow itself is unbuilt |
| Sessions | `UNDESIGNED` | **the tab nobody designed** — daily-use, past sittings |
| Insights | `DESIGNED` | Bundle 2 |

Profile ⊙ sits top-right, off the bar (Settings · Social · Shopping). Two red slots:
**Sessions** and the **＋ setup flow** (incl. the tea & vessel pickers, issue #14).

---

## Entities × surfaces

`n/a` is a deliberate answer, not a gap.

### 茶 Teas — the collection
| Surface | Status | Detail |
|---|---|---|
| List → **Library** | `DESIGNED` | Bundle 1 · WS5 — photo-shelf rows, one status line, per-origin script, favourites |
| **Tea detail** | `UNDESIGNED` ★ next | brew guide · "≈ 4.6 cups at your usual 5g" · stock · enlarged swatch · Go Deeper |
| **Add / edit tea** | `UNDESIGNED` | cultivar (carries the v3.90 hint) · swatch-picker entry · vendor · type · stock |
| **Tea picker** | `UNDESIGNED` | issue #14 — setup popup "still reads pre-R2"; owed since day one |

### 器 Vessels — kyūsu · gaiwan · houhin
| Surface | Status | Detail |
|---|---|---|
| **Vessel library** | `UNDESIGNED` | name · type · material · capacity · image. Teaware line-art already traced (sprites ready) |
| **Vessel detail** | `UNDESIGNED` | one vessel + its teas, capacity, pairings. Light — **confirm it earns a page** |
| **Add / edit vessel** | `UNDESIGNED` | mirrors add-tea; image slot, capacity in ml, material, type |
| **Vessel picker** | `UNDESIGNED` | #14 family — setup step two |

### 席 Sessions — a sitting
| Surface | Status | Detail |
|---|---|---|
| List → **Sessions** | `UNDESIGNED` ★ next | tab-bar slot — past sittings, calendar or list |
| **Session detail** | `UNDESIGNED` | one past sitting: its steeps, water temps, calibration, taste, vessel |
| **Session setup** | `UNDESIGNED` | the ＋ flow: pick tea → vessel → method, then steep. Live steep + Focus already `DESIGNED` ✓ |
| Picker | `n/a` | a session is created, not picked — its pickers are the tea + vessel pickers |

### 煎 Steeps — infusions within a session
| Surface | Status | Detail |
|---|---|---|
| List | `n/a` | steeps list under their session, not a standalone surface |
| **Steep record** | `DEFERRED` | one infusion's time/temp/taste — shown inside session detail, no own page |
| **Log a cup** | `DESIGNED` | Bundle 1 · WS1 — after-the-fact entry ✓ · live capture ✓. **+ matcha steep-less variant (#12)** still owed |
| Picker | `n/a` | — |

---

## Reflective + utility surfaces
Not entity CRUD — the rooms you visit. Most are designed and awaiting reconciliation refinements.

| Surface | Status | Refinement owed |
|---|---|---|
| Home | `DESIGNED` | edit-layout (S2) |
| Insights | `DESIGNED` | period selector · restore daily/weekly/monthly, cost, when-you-brew (I1–3) |
| Origins map | `DESIGNED` | neutral pin · global scope · tap-to-navigate (O1–2) |
| Settings | `DESIGNED` | **⚠ privacy copy is false (S3)** · restore items · icon semantics (S4–6) |
| Shopping list | `DESIGNED` | running-low vs wishlist model + clear-acquired (Sh1) |
| Social | `CONCEPT` | build screens — passed→wishlist, kindred type-match, tea-together pull (So1–4) |
| Flavour profile | `DESIGNED` | Round 2 · WS4 — R3 restyle TBD; capture now folded into the steep's TASTE |
| Wrapped | `DEFERRED` | Round 1 — not re-rendered for R3; the "Seasonal wrapped" card's destination |

---

## System · first-run · identity
In the R3 brief since day one; easy to forget precisely because they aren't daily screens.

| Surface | Status | Note |
|---|---|---|
| First-run / onboarding | `UNDESIGNED` | in scope from day one; nothing built |
| Empty states | `UNDESIGNED` | a few shown in mocks; needs one honest pass per surface |
| App icon | `DESIGNED` | own file — gaiwan mark, round 2 (#10) |
| Splash | `UNDESIGNED` | part of #10; derives from the icon, not yet drawn |
| Theme-color / meta | `DEFERRED` | a Code concern; token already exists |
| Landing page | `DESIGNED` | slowcup.app — Round 1 WS4, self-contained |

---

## S2 · Edit-layout survives — the card system is rearrangeable by design

**Confirmed: edit-layout is preserved.** The fixed mocks were a drawing convenience, never a
decision to remove it — same class of near-miss as the "＋", and it isn't going the same way.
Every dashboard card declares a **default owner surface** and whether it's an **anchor** (stays
put) or **movable** (drag between Home & Insights).

| Card | Default | Edit-layout |
|---|---|---|
| Greeting masthead | Home | Anchor — fixed |
| This week · summary | Home | ↔ movable |
| Quick actions · steep / log | Home | Anchor — fixed |
| Earlier today · recents | Home | ↔ movable |
| This week, mostly · **restored** | Home | ↔ → Insights |
| Seasonal wrapped · **restored** | Insights | ↔ → Home |
| Origins · nested | Insights | ↔ movable |
| Cost overview · **restored** | Insights | ↔ movable |
| When you brew · **restored** | Insights | ↔ movable |
| Period stats | Insights | Anchor — with selector |

**The rule.** Anchors carry a surface's identity (the greeting, the primary actions, the period
selector) — they don't move. Movable cards are glances and summaries — reorder within a surface,
or move between Home and Insights. A card can live in either place; only its *default* is fixed.

**Resolves I3.** Both lost cards return: *Seasonal wrapped* defaults to Insights (it's reflection),
*"This week, mostly"* defaults to Home (it's a glance).

---

## Build order — daily-use screens first

| # | What | Why |
|---|---|---|
| 01 | Sessions + Session detail | tab slot · daily-use |
| 02 | Tea detail | daily-use · Go Deeper |
| 03 | Session setup + tea / vessel pickers | closes issue #14 |
| 04 | Vessel library + add / edit | the whole entity |
| 05 | Add / edit tea | cultivar · swatch picker |
| 06 | ⚠ Settings copy + restorations | privacy — can't ship |
| 07 | Shopping · Insights · Origins · Social | per-surface refinements |
| 08 | First-run · empty states · splash | system + identity |
| 09 | Bundle 1 + 2 → Code hand-off | together, with the pins |

**Gate (unchanged):** Bundle 1 + Bundle 2 hand to Code *together*, once both lock — carrying the
pins: swatch 3-tier model · per-origin script · five contracts · per-steep tempC · ensō brush
animation · and now the Origins map data-path. Nothing goes to Code piecemeal.

---

## Two things needed before I build

1. **Ratify or adjust the inventory** — especially the entity-model calls: does **Vessel detail**
   earn its own page, and is the **matcha steep-less variant (#12)** in scope now or deferred?
2. **S3 privacy copy** — proposed replacement for the false "lives on your device", for you to
   check against actual Supabase behaviour:
   > *"Your diary, your account. Stored privately with encryption at rest, never sold, never mined
   > for ads. Export or delete everything, anytime."*

**Still open from Bundle 2:** dark theme for the four utility surfaces — now, or at final reconciliation?
