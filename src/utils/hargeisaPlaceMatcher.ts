import { LocationNode } from '../types';
import { HARGEISA_PLACES, HargeisaPlace } from '../data/hargeisaPlaces';

/**
 * Deterministic String Hash
 * Converts any arbitrary location name/address string into a stable 32-bit integer.
 */
export function hashString(str: string): number {
  let hash = 5381;
  const clean = str.toLowerCase().trim();
  for (let i = 0; i < clean.length; i++) {
    hash = ((hash << 5) + hash) + clean.charCodeAt(i);
    hash |= 0; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Deterministic Hargeisa Coordinate Generator
 * For custom-typed street names, homes, or addresses without GPS pins:
 * Maps the name to a stable, fixed location within Hargeisa's urban bounds.
 * NEVER uses Math.random() - same name will ALWAYS yield the exact same coordinates.
 */
export function getDeterministicHargeisaCoordinates(name: string): { lat: number; lng: number } {
  const hash = hashString(name);
  // Hargeisa Urban Grid: Lat 9.5400 - 9.5780, Lng 44.0400 - 44.0880
  const latOffset = (hash % 380) * 0.0001;
  const lngOffset = ((hash >> 9) % 480) * 0.0001;

  const lat = Math.round((9.5400 + latOffset) * 100000) / 100000;
  const lng = Math.round((44.0400 + lngOffset) * 100000) / 100000;

  return { lat, lng };
}

/**
 * Normalizes place strings for matching (strips punctuation, common noise words, casing)
 */
function normalizePlaceText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Finds the canonical Hargeisa landmark that matches a given name, search query, or place ID
 */
export function findCanonicalHargeisaPlace(
  nameOrQuery: string,
  placeId?: string
): HargeisaPlace | null {
  if (placeId) {
    const byId = HARGEISA_PLACES.find(
      (p) =>
        p.id === placeId ||
        (placeId.includes('imperial') && (p.name.toLowerCase().includes('imperial') || p.id === 'osm_1138799309')) ||
        (placeId.includes('naxar') && (p.id === 'ina_naxar_street' || p.name.toLowerCase().includes('naxar')))
    );
    if (byId) return byId;
  }

  if (!nameOrQuery || nameOrQuery.trim() === '') return null;

  const clean = normalizePlaceText(nameOrQuery);
  if (!clean) return null;

  // Direct fast-path for key landmark queries
  if (clean.includes('naxar')) {
    const naxar = HARGEISA_PLACES.find((p) => p.id === 'ina_naxar_street' || p.name.toLowerCase().includes('naxar'));
    if (naxar) return naxar;
  }
  if (clean.includes('imperial')) {
    const imperial = HARGEISA_PLACES.find((p) => p.name.toLowerCase().includes('imperial') || p.id === 'osm_1138799309');
    if (imperial) return imperial;
  }
  if (clean.includes('berbera') && (clean.includes('bus') || clean.includes('terminal') || clean.includes('istaan'))) {
    const berbera = HARGEISA_PLACES.find((p) => p.id === 'berbera_bus_terminal');
    if (berbera) return berbera;
  }
  if (clean.includes('airport') || clean.includes('garoonka') || clean.includes('cigaal')) {
    const airport = HARGEISA_PLACES.find((p) => p.id === 'hga_airport' || p.name.toLowerCase().includes('airport'));
    if (airport) return airport;
  }

  // 1. Exact name match
  const exactMatch = HARGEISA_PLACES.find(
    (p) => normalizePlaceText(p.name) === clean || (p.address && normalizePlaceText(p.address) === clean)
  );
  if (exactMatch) return exactMatch;

  // 2. High-confidence prefix or contains match on name
  const nameContains = HARGEISA_PLACES.find((p) => {
    const norm = normalizePlaceText(p.name);
    return norm.includes(clean) || clean.includes(norm);
  });
  if (nameContains) return nameContains;

  // 3. Search terms match
  const termMatch = HARGEISA_PLACES.find((p) =>
    p.searchTerms.some((t) => {
      const normTerm = normalizePlaceText(t);
      return normTerm === clean || (clean.length >= 4 && (normTerm.includes(clean) || clean.includes(normTerm)));
    })
  );
  if (termMatch) return termMatch;

  // 4. District or Subcategory match
  const words = clean.split(' ').filter((w) => w.length >= 3);
  if (words.length > 0) {
    const wordMatch = HARGEISA_PLACES.find((p) => {
      const pText = normalizePlaceText(`${p.name} ${p.address} ${p.searchTerms.join(' ')} ${p.district || ''}`);
      return words.every((w) => pText.includes(w));
    });
    if (wordMatch) return wordMatch;
  }

  return null;
}

/**
 * Resolves any location input into an authoritative, 100% deterministic LocationNode.
 * Guarantees that the SAME PLACE NAME in Hargeisa ALWAYS gets the EXACT SAME COORDINATES
 * across all components, API calls, and renders.
 */
export function resolveHargeisaPlaceCoordinates(
  input: {
    id?: string;
    name?: string;
    address?: string;
    lat?: number;
    lng?: number;
    category?: string;
    zone?: string;
    district?: string;
  } | string
): LocationNode {
  if (typeof input === 'string') {
    const trimmed = input.trim();
    const canonical = findCanonicalHargeisaPlace(trimmed);
    if (canonical) {
      return {
        id: canonical.id,
        name: canonical.name,
        address: canonical.address,
        lat: canonical.lat,
        lng: canonical.lng,
        category: canonical.category,
        zone: canonical.district || 'Hargeisa',
      };
    }

    const { lat, lng } = getDeterministicHargeisaCoordinates(trimmed);
    return {
      id: `loc_${hashString(trimmed).toString(36)}`,
      name: trimmed,
      address: `${trimmed}, Hargeisa, Somaliland`,
      lat,
      lng,
      category: 'Verified Location',
      zone: 'Hargeisa',
    };
  }

  const name = (input.name || input.address || 'Hargeisa Location').trim();
  const canonical = findCanonicalHargeisaPlace(name, input.id);

  if (canonical) {
    return {
      id: canonical.id,
      name: canonical.name,
      address: canonical.address,
      lat: canonical.lat,
      lng: canonical.lng,
      category: canonical.category,
      zone: canonical.district || input.zone || 'Hargeisa',
    };
  }

  // If explicit valid GPS / map coordinates were provided
  if (
    typeof input.lat === 'number' &&
    typeof input.lng === 'number' &&
    input.lat >= 9.35 &&
    input.lat <= 9.75 &&
    input.lng >= 43.85 &&
    input.lng <= 44.25 &&
    !(Math.abs(input.lat - 9.5600) < 0.0001 && Math.abs(input.lng - 44.0650) < 0.0001 && !input.id?.startsWith('pin_'))
  ) {
    return {
      id: input.id || `loc_${hashString(name).toString(36)}`,
      name,
      address: input.address || `${name}, Hargeisa, Somaliland`,
      lat: Math.round(input.lat * 100000) / 100000,
      lng: Math.round(input.lng * 100000) / 100000,
      category: input.category || 'Map Location',
      zone: input.zone || input.district || 'Hargeisa',
    };
  }

  // Custom text fallback -> deterministic stable coordinates
  const { lat, lng } = getDeterministicHargeisaCoordinates(name);
  return {
    id: input.id || `loc_${hashString(name).toString(36)}`,
    name,
    address: input.address || `${name}, Hargeisa, Somaliland`,
    lat,
    lng,
    category: input.category || 'Hargeisa Location',
    zone: input.zone || input.district || 'Hargeisa',
  };
}
