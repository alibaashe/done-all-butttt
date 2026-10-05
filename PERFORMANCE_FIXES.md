# Wadaage — Search & Order Performance Fixes

**Problem reported:** typing a pickup/destination felt slow, and tapping "Book"
took a while to respond.

Both had real, measurable causes. Four of them were also **logic bugs** that
made search return wrong results.

---

## 1. What was slow, and by how much

| Path | Before | After | Change |
|---|---|---|---|
| Place search (average keystroke) | ~30–117 ms | **2.8 ms** | ~15–40x faster |
| Place search (worst keystroke) | 116 ms | **19 ms** | 6x faster |
| Category tab filter | 15–30 ms | **0.25 ms** | ~80x faster |
| Nearest-landmark lookup (`findLandmarkIdNear`) | 1.89 ms | **0.12 ms** | **15.5x faster** |
| Road-distance estimate (2 lookups) | ~3.8 ms | **~0.24 ms** | ~16x faster |
| Landmark snap (`snapToNearestLandmarkAnchor`) | full 10,650-place scan | grid lookup | ~15x faster |
| One-time index build | — | 18 ms (on idle) | never on a keystroke |

The registry holds **10,650 places** (the source comments claiming 51k are wrong).

---

## 1a. IMPORTANT: which search UI is actually live

While verifying the fix inside the built APK I found that the component I first
optimised is **dead code**:

| Component | Status |
|---|---|
| `src/components/Mobile/MobileAppFrame.tsx` | **never imported** — dead |
| `src/components/Passenger/SmartLocationAutocomplete.tsx` | only imported by `RideBookingCard` |
| `src/components/Passenger/RideBookingCard.tsx` | **never imported** — dead |
| **`src/components/Passenger/MobilePassengerApp.tsx`** | **THIS is the live rider input** (search modal, line ~1213) |

That was confirmed by extracting the JS bundle from the built APK: none of the
`SmartLocationAutocomplete` / `MobileAppFrame` strings are present, while
`MobilePassengerApp`'s strings are.

So the optimisations were applied to the **live** path too:

- `MobilePassengerApp`'s `filteredLocalPlaces` now uses the indexed
  `searchPlacesFast()` (cached haystacks, prefix index, early exit) instead of
  rebuilding a haystack per candidate.
- Its input is now **debounced at 120 ms** (it previously re-filtered 10.6k
  places on every single keystroke — this was the main cause of the sluggish
  pickup/destination typing the user reported).
- It warms the index on idle via `requestIdleCallback`.
- Category tabs match on **word boundaries** (`w.split(/[\s&,]+/)`) so
  "hospital" no longer matches "hospitality".

Both the live path and the dead components now share the same fast primitives,
so nothing regresses whichever one is wired up next.

---

## 2. Root causes

### 2.1 Search re-lowercased every field on every keystroke
`searchHargeisaPlaces()` called `.toLowerCase()` on up to **six fields per place**
and walked all 10,650 places, then `.slice()`d at the end — so it never stopped
early. That is ~64,000 string allocations per keystroke.

**Fix:** one lower-cased "haystack" string per place, built lazily and cached;
early-exit once enough results are collected; and a **prefix index** (first 3
characters of every significant word) so a realistic query inspects a small
bucket instead of the whole registry.

### 2.2 The index build happened inside the first keystroke
Building the cache cost 18 ms. That was being paid on typing, which is the worst
possible moment.

**Fix:** `warmPlaceSearchIndex()` builds it in **8 ms slices across
`requestIdleCallback`**, so the main thread is never blocked and the cache is
ready before the user finishes typing.

### 2.3 Nearest-landmark lookup scanned all 10,650 places — twice per estimate
`findLandmarkIdNear()` did a full-registry haversine loop. `estimateHargeisaRoadDistance()`
calls it **twice**, and a booking performs several distance estimates, so a
"Book" tap burned tens of milliseconds of pure CPU before anything could render.

**Fix:** a **spatial grid index** (`placeSpatialIndex.ts`). Cell size was chosen
from the real data distribution, not guessed:

| Cell size | Grid cells | Avg places scanned per 0.65 km lookup |
|---|---|---|
| 0.030° (~3.3 km) | 13 | 9,126 (useless — the city is only ~10.7 km wide) |
| 0.010° | 72 | 906 |
| 0.008° | 114 | 601 |
| **0.004° (chosen)** | **385** | **437** |
| 0.003° | 655 | 266 (more cells than it saves) |

Proven **identical results**: 16,000 random lookups across four radii, plus
every 37th landmark queried against itself — **0 mismatches**.

### 2.4 `snapToNearestLandmarkAnchor` used road distance for a straight-line job
It ran `calculateDistanceKm()` — the *road-network* estimator, itself doing grid
lookups and landmark scans — against all 10,650 places, just to find the closest.
It also added its own landmark loop on top.

**Fix:** the grid finds the nearest place by great-circle distance (same answer),
in a few dozen checks instead of ten thousand.

---

## 3. Four logic bugs found along the way

These were not performance issues — the filters were returning **wrong data**.

### 3.1 "Hospitals & Healthcare" returned every hotel
The filter compared the tab label to the category name with `includes()`, and:

```
'hotels & hospitality'.includes('hospital')  ->  true
```

So the hospital tab returned **1,707 results — 1,281 hospitals plus 426 hotels**,
identical to the Hotels tab.

**Fix:** match on exact `subCategory` values via an explicit map. Now
hospitals = 1,281, hotels = 426.

### 3.2 "Schools & Universities" returned nothing
The data uses `school` / `university` sub-categories and the category names
"Schools & Academies" / "Universities & Colleges". The word **"education" appears
nowhere in the dataset**, and the old short-id path matched on `pCat.includes('education')`.

**Fix:** explicit aliases. Now returns **1,702** places.

### 3.3 Searching "hospital" returned hotels
`searchTerms` contains the word `"hospitality"`, and `"hospitality".includes("hospital")`
is true — so a hospital search listed hotels.

**Fix:** `wordStartsWith()` matching (`src/utils/placeSearch.ts`) — the match must
begin and end on a word boundary. `"hospital"` no longer matches `"hospitality"`,
while prefix typing still works (`"man"` → `"Mansoor"`).

### 3.4 A typo'd separator silently broke all text matching
The haystack fields were joined with `\u0001`. My `isWordChar()` treats code
points > 127 as word characters (deliberate, for Somali/Arabic script), so the
separator **glued all fields into one giant word** and almost nothing matched.
Caught by the test suite, fixed by joining with a plain space.

---

## 4. Also improved

- **No more blank dropdown.** Before typing, the field now shows up to 12
  "Popular places in Hargeisa" chips instead of an empty panel (which previously
  displayed 10,650 undifferentiated results).
- **Honest counter.** The header showed "10650 places available" (a static
  total). It now shows the real suggestion count.
- **Debounce (120 ms)** on local filtering so a fast typist doesn't re-filter
  between keystrokes.
- Driver app's destination search uses the same indexed path (`limit: 5`).

---

## 5. Regression tests

Run all suites:

```bash
npm test              # routes + search + spatial
npm run test:routes   # 22 URL-routing cases
npm run test:search   # category correctness + keystroke speed
npm run test:spatial  # grid equivalence + speed
```

`test:search` and `test:spatial` load the **real source modules** (compiled with
the local `tsc`) rather than copies, so they cannot drift from the app.

`test:spatial` is the important one: it asserts the grid is *equivalent* to the
old full scan, so a future index change cannot silently start returning
different landmarks.

---

## 6. Known remaining item

**"Mansoor" returns no results — the data does not contain it.**

The registry has 10,650 places but no district names matching Mansoor/Maansoor,
even though the app's own copy refers to "Mansoor Hotel & Conference Grounds"
(which *is* in the data as a hotel). Searches for major neighbourhoods that are
missing from the dataset will therefore come up empty.

This is a **data gap, not a code bug** — no index can find a name that isn't
there. If you want those neighbourhoods searchable, they need to be added to
`src/data/hargeisaPlaces.ts`, or the Google Places autocomplete fallback (already
wired up and queried in parallel) will cover them when the device is online.

Given the four other defects found in this area, it is worth checking the
registry against a real Hargeisa district list before launch.
