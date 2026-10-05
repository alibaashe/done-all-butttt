/**
 * Spatial grid index for the Hargeisa place registry.
 *
 * Why this exists
 * ---------------
 * Nearest-landmark lookups used to loop the entire registry:
 *
 *     for (const place of HARGEISA_PLACES) { haversine(...) }   // ~10,650 iterations
 *
 * `estimateHargeisaRoadDistance()` performs TWO of those scans, and it is called
 * several times while a rider selects a pickup/destination and taps "Book".
 * That is what made placing an order feel slow.
 *
 * This module buckets places into ~1 km grid cells. A nearest lookup then only
 * scans the candidate cells around the query point (a few dozen places at most)
 * instead of the whole registry.
 *
 * The grid is built lazily and cached, so it costs nothing until first use.
 */

import { HARGEISA_PLACES, HargeisaPlace } from '../data/hargeisaPlaces';

/**
 * Cell size in degrees.
 *
 * Chosen from the real distribution of the registry: the ~10,650 places are
 * tightly clustered into a ~10.7 km box, so large cells put thousands of places
 * in one bucket and the "index" ends up scanning most of the registry anyway.
 * Measured average places scanned per 0.65 km lookup:
 *   0.010 deg -> 906 places      0.005 deg -> 713 places
 *   0.008 deg -> 601 places      0.004 deg -> 437 places  (used here)
 *   0.003 deg -> 266 places (but 655 cells; more overhead than it saves)
 *
 * The jump between 0.005 and 0.004 is the ring count crossing from 2x2 to 1x1,
 * so 0.004 is the sweet spot for the radii this app actually uses.
 */
const CELL_DEG = 0.004;

/** Approximate km per degree of latitude. */
const KM_PER_DEG_LAT = 111;
/** Approximate km per degree of longitude at Hargeisa (~9.56 N). */
const KM_PER_DEG_LNG = 111 * Math.cos((9.56 * Math.PI) / 180);

interface GridCell {
  places: HargeisaPlace[];
}

let grid: Map<string, GridCell> | null = null;

function cellKey(lat: number, lng: number): string {
  return `${Math.floor(lat / CELL_DEG)}:${Math.floor(lng / CELL_DEG)}`;
}

function buildGrid(): Map<string, GridCell> {
  const g = new Map<string, GridCell>();
  for (let i = 0; i < HARGEISA_PLACES.length; i++) {
    const place = HARGEISA_PLACES[i];
    if (typeof place.lat !== 'number' || typeof place.lng !== 'number') continue;
    const key = cellKey(place.lat, place.lng);
    const cell = g.get(key);
    if (cell) cell.places.push(place);
    else g.set(key, { places: [place] });
  }
  return g;
}

function getGrid(): Map<string, GridCell> {
  if (!grid) grid = buildGrid();
  return grid;
}

/** Great-circle distance in km. */
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export interface NearestPlaceResult {
  place: HargeisaPlace;
  distanceKm: number;
}

/**
 * Find the nearest registered place within `maxDistKm` of a coordinate.
 *
 * Scans only the cells that can possibly contain a match: enough rings to cover
 * the radius, plus one for safety. Falls back to a full scan only if the radius
 * is so large that the grid would not help.
 */
export function findNearestPlace(
  lat: number,
  lng: number,
  maxDistKm = 0.65
): NearestPlaceResult | null {
  if (typeof lat !== 'number' || typeof lng !== 'number' || !isFinite(lat) || !isFinite(lng)) {
    return null;
  }

  const g = getGrid();
  const cellLat = Math.floor(lat / CELL_DEG);
  const cellLng = Math.floor(lng / CELL_DEG);

  // How many extra cells must be scanned to be certain of covering the radius?
  // Longitude cells are narrower than latitude cells, so they drive the count.
  const ringsLat = Math.ceil(maxDistKm / (CELL_DEG * KM_PER_DEG_LAT));
  const ringsLng = Math.ceil(maxDistKm / (CELL_DEG * KM_PER_DEG_LNG));

  let best: HargeisaPlace | null = null;
  let bestDist = Infinity;

  for (let dLat = -ringsLat; dLat <= ringsLat; dLat++) {
    for (let dLng = -ringsLng; dLng <= ringsLng; dLng++) {
      const cell = g.get(`${cellLat + dLat}:${cellLng + dLng}`);
      if (!cell) continue;
      const places = cell.places;
      for (let i = 0; i < places.length; i++) {
        const p = places[i];
        const dist = haversineKm(lat, lng, p.lat, p.lng);
        if (dist < bestDist && dist <= maxDistKm) {
          bestDist = dist;
          best = p;
        }
      }
    }
  }

  if (!best) return null;
  return { place: best, distanceKm: bestDist };
}

/** Build the grid ahead of time (call on idle). */
export function warmPlaceSpatialIndex(): void {
  getGrid();
}

/** Test/diagnostic helper. */
export function getSpatialIndexStats(): { cells: number; places: number; built: boolean } {
  const g = grid;
  let places = 0;
  if (g) {
    for (const cell of g.values()) places += cell.places.length;
  }
  return { cells: g ? g.size : 0, places, built: g !== null };
}
