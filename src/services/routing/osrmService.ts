import { HargeisaRoadRoute, fetchRealHargeisaRoadRoute, estimateHargeisaRoadDistance } from '../../utils/hargeisaRoadRouter';

export interface RoutePoint {
  lat: number;
  lng: number;
}

export interface RouteMatrixResult {
  durations: number[][]; // Durations in seconds
  distances: number[][]; // Distances in meters
}

const getOsrmBaseUrl = (): string => {
  return (
    (import.meta as any).env?.VITE_OSRM_BASE_URL ||
    (process.env as any).OSRM_BASE_URL ||
    'https://router.project-osrm.org'
  );
};

/**
 * Dedicated OSRM Routing Service Module
 * Provides routing, distance, duration, road snapping, and matrix calculations.
 */
export const osrmService = {
  /**
   * Get driving route between origin, destination, and optional intermediate waypoints
   */
  async getRoute(
    origin: RoutePoint,
    destination: RoutePoint,
    waypoints?: RoutePoint[]
  ): Promise<HargeisaRoadRoute> {
    return fetchRealHargeisaRoadRoute(origin, destination, waypoints);
  },

  /**
   * Get driving distance in KM between origin and destination
   */
  async getDistance(origin: RoutePoint, destination: RoutePoint): Promise<number> {
    const route = await this.getRoute(origin, destination);
    return route.distanceKm;
  },

  /**
   * Get estimated travel duration / ETA in minutes
   */
  async getETA(origin: RoutePoint, destination: RoutePoint): Promise<number> {
    const route = await this.getRoute(origin, destination);
    return route.durationMins;
  },

  /**
   * Snaps a GPS coordinate to the nearest drivable road
   */
  async getNearestRoad(location: RoutePoint): Promise<{ lat: number; lng: number; name?: string }> {
    const baseUrl = getOsrmBaseUrl();
    const url = `${baseUrl}/nearest/v1/driving/${location.lng},${location.lat}`;

    try {
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data && data.waypoints && data.waypoints[0]) {
          const wp = data.waypoints[0];
          return {
            lng: wp.location[0],
            lat: wp.location[1],
            name: wp.name || 'Hargeisa Main Road',
          };
        }
      }
    } catch (_e) {}

    return { lat: location.lat, lng: location.lng, name: 'Hargeisa Road' };
  },

  /**
   * Calculates a distance/time matrix between multiple locations
   */
  async getRouteMatrix(locations: RoutePoint[]): Promise<RouteMatrixResult> {
    if (locations.length === 0) return { durations: [], distances: [] };

    const baseUrl = getOsrmBaseUrl();
    const coordsStr = locations.map((l) => `${l.lng},${l.lat}`).join(';');
    const url = `${baseUrl}/table/v1/driving/${coordsStr}?annotations=distance,duration`;

    try {
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data && data.durations && data.distances) {
          return {
            durations: data.durations,
            distances: data.distances,
          };
        }
      }
    } catch (_e) {}

    // Fallback matrix calculation using estimateHargeisaRoadDistance
    const n = locations.length;
    const durations: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));
    const distances: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i === j) {
          durations[i][j] = 0;
          distances[i][j] = 0;
        } else {
          const est = estimateHargeisaRoadDistance(locations[i].lat, locations[i].lng, locations[j].lat, locations[j].lng);
          durations[i][j] = est.durationMins * 60; // in seconds
          distances[i][j] = est.distanceKm * 1000; // in meters
        }
      }
    }

    return { durations, distances };
  },
};
