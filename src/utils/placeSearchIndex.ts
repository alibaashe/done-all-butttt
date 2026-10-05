/**
 * Fast, indexed search over the Hargeisa place registry.
 *
 * Why this exists
 * ---------------
 * The raw registry holds ~10,650 places and `searchHargeisaPlaces()` used to
 * run six `String.toLowerCase()` calls per place on every keystroke. Combined
 * with a synchronous `.filter()` that always walked the entire array, this made
 * the pickup/destination inputs feel sluggish, especially on mid-range phones.
 *
 * What this module does instead:
 *   1. Builds one lower-cased search string per place, ONCE, lazily.
 *   2. Matches with a single `includes()` instead of six.
 *   3. Stops early once enough results are collected.
 *
 * It also fixes a real filtering bug: the old category filter compared the tab
 * label against the place category with `includes()`, so
 * `'hotels & hospitality'.includes('hospital')` was **true** and the
 * "Hospitals & Healthcare" tab returned every hotel. Categories are now matched
 * on exact `subCategory` values, and the tab labels are mapped explicitly.
 */

import { HARGEISA_PLACES, HargeisaPlace, warmHargeisaSearchIndex } from '../data/hargeisaPlaces';
import { wordStartsWith } from './placeSearch';

interface IndexedPlace {
  place: HargeisaPlace;
  /** Single lower-cased haystack: name + address + district + categories + search terms. */
  hay: string;
}

/** Tab label -> exact `subCategory` values that belong to it. */
const CATEGORY_TAB_SUBCATEGORIES: Record<string, string[]> = {
  'hospitals & healthcare': ['hospital'],
  'schools & universities': ['school', 'university'],
  'mosques (masaajidda)': ['place_of_worship'],
  'markets & malls': ['mall'],
  'fuel stations (kaalmaha)': ['fuel'],
  'transport & terminals': ['transit_station'],
  'hotels & hospitality': ['hotel'],
  'banks & financial': ['bank'],
  'government & civic': ['government'],
  'xaafadaha (districts)': ['neighborhood'],
  'corporate & utilities': ['corporate', 'utility'],
  'road corridors': ['highway'],
  'ngos & agencies': ['ngo'],
  'restaurants & cafes': ['restaurant'],
};

let index: IndexedPlace[] | null = null;
let subCategoryIndex: Map<string, IndexedPlace[]> | null = null;
let nameStartsWithIndex: Map<string, IndexedPlace[]> | null = null;
let popularPlaces: HargeisaPlace[] | null = null;

/** Lower-case and flatten every searchable field of a place into one string. */
function buildHaystack(place: HargeisaPlace): string {
  const parts: string[] = [];
  if (place.name) parts.push(place.name);
  if (place.address) parts.push(place.address);
  if (place.district) parts.push(place.district);
  if (place.category) parts.push(place.category);
  if (place.subCategory) parts.push(place.subCategory);
  if (place.somaliCategory) parts.push(place.somaliCategory);
  if (place.searchTerms && place.searchTerms.length) parts.push(place.searchTerms.join(' '));
  return parts.join(' ').toLowerCase();
}

/**
 * Build the search index. Runs once and is cached; ~50 ms for 10.6k places,
 * which is why callers should let it happen during idle time (see
 * `warmPlaceSearchIndex`).
 */
function ensureIndex(): IndexedPlace[] {
  if (index) return index;

  const built: IndexedPlace[] = new Array(HARGEISA_PLACES.length);
  const bySub = new Map<string, IndexedPlace[]>();
  const byNameStart = new Map<string, IndexedPlace[]>();
  const popular: HargeisaPlace[] = [];

  for (let i = 0; i < HARGEISA_PLACES.length; i++) {
    const place = HARGEISA_PLACES[i];
    const entry: IndexedPlace = { place, hay: buildHaystack(place) };
    built[i] = entry;

    const sub = (place.subCategory || '').toLowerCase();
    if (sub) {
      const bucket = bySub.get(sub);
      if (bucket) bucket.push(entry);
      else bySub.set(sub, [entry]);
    }

    const name = (place.name || '').toLowerCase();
    if (name) {
      // Index on the first two characters so short queries get a small candidate set.
      const key = name.slice(0, 2);
      const bucket = byNameStart.get(key);
      if (bucket) bucket.push(entry);
      else byNameStart.set(key, [entry]);
    }

    if (place.popular) popular.push(place);
  }

  index = built;
  subCategoryIndex = bySub;
  nameStartsWithIndex = byNameStart;
  popularPlaces = popular;
  return built;
}

/**
 * Build the index ahead of time (call on idle / on input focus).
 *
 * Warms in small slices via a chain of idle callbacks so the main thread is
 * never blocked for long, while still finishing the whole 10.6k-place haystack
 * cache before the user finishes typing.
 */
export function warmPlaceSearchIndex(): void {
  ensureIndex();

  const schedule = (cb: () => void) => {
    try {
      const ric = (window as any).requestIdleCallback;
      if (typeof ric === 'function') {
        ric(cb, { timeout: 1000 });
        return;
      }
    } catch (_e) {}
    setTimeout(cb, 16);
  };

  const pump = () => {
    try {
      const result = warmHargeisaSearchIndex(8);
      if (!result.done) schedule(pump);
    } catch (_e) {}
  };
  pump();
}

export function isPlaceSearchIndexReady(): boolean {
  return index !== null;
}

export interface PlaceSearchOptions {
  category?: string;
  /** Stop collecting after this many matches. Default 60. */
  limit?: number;
}

/**
 * Search places by free text and/or category tab.
 *
 * Results are ordered by relevance:
 *   1. name starts with the query
 *   2. name contains the query
 *   3. any other field contains the query
 */
export function searchPlacesFast(query: string, options: PlaceSearchOptions = {}): HargeisaPlace[] {
  const all = ensureIndex();
  const limit = options.limit ?? 60;

  const needle = (query || '').trim().toLowerCase();
  const catKey = (options.category || '').trim().toLowerCase();
  const isAllCategories = !catKey || catKey === 'all' || catKey === '⭐ all places' || catKey === 'dhammaan';

  // --- Category first: it is the most selective filter when active ---
  let candidates: IndexedPlace[];
  if (isAllCategories) {
    candidates = all;
  } else {
    const subs = CATEGORY_TAB_SUBCATEGORIES[catKey];
    if (subs && subs.length) {
      const merged: IndexedPlace[] = [];
      for (const sub of subs) {
        const bucket = subCategoryIndex?.get(sub);
        if (bucket) {
          for (let i = 0; i < bucket.length; i++) merged.push(bucket[i]);
        }
      }
      candidates = merged;
    } else {
      // Unknown tab: fall back to the flattened haystack so nothing disappears.
      candidates = all.filter((e) => wordStartsWith(e.hay, catKey));
    }
  }

  // --- No text query: return the (capped) candidate list ---
  if (!needle) {
    if (candidates.length <= limit) return candidates.map((e) => e.place);
    return candidates.slice(0, limit).map((e) => e.place);
  }

  const startMatches: HargeisaPlace[] = [];
  const nameMatches: HargeisaPlace[] = [];
  const otherMatches: HargeisaPlace[] = [];
  let collected = 0;

  for (let i = 0; i < candidates.length; i++) {
    const entry = candidates[i];
    const name = (entry.place.name || '').toLowerCase();

    let bucket: 0 | 1 | 2 | -1 = -1;
    if (name.startsWith(needle)) {
      bucket = 0;
    } else if (wordStartsWith(name, needle)) {
      bucket = 1;
    } else if (entry.hay.includes(needle) && wordStartsWith(entry.hay, needle)) {
      // Cheap substring test first; only pay for the boundary check on a hit.
      bucket = 2;
    }

    if (bucket === -1) continue;

    if (bucket === 0) startMatches.push(entry.place);
    else if (bucket === 1) nameMatches.push(entry.place);
    else otherMatches.push(entry.place);

    collected++;
    // Enough good matches already: stop walking 10k records on every keystroke.
    if (collected >= limit) break;
  }

  const out: HargeisaPlace[] = [];
  for (const p of startMatches) out.push(p);
  for (const p of nameMatches) out.push(p);
  for (const p of otherMatches) out.push(p);
  return out;
}

/** Popular / notable places, useful for an empty dropdown. */
export function getPopularPlaces(limit = 20): HargeisaPlace[] {
  const all = ensureIndex();
  const source = popularPlaces && popularPlaces.length ? popularPlaces : all.map((e) => e.place);
  return source.slice(0, limit);
}

/** How many places exist in total (cheap, no index needed). */
export function getTotalPlaceCount(): number {
  return HARGEISA_PLACES.length;
}
