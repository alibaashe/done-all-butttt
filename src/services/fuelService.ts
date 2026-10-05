import {
  VehicleFuelProfile,
  FuelLogEntry,
  DrivingSessionRecord,
  FuelDailyReport,
  FuelWeeklySummary,
  FuelWarning,
} from '../types';
import { db, cleanForFirestore, doc, setDoc, getDoc, collection, query, where, getDocs, orderBy, limit } from './firebase';

const STORAGE_KEYS = {
  VEHICLE: 'wadaage_driver_vehicle_profile',
  ACTIVE_SESSION: 'wadaage_driver_active_session',
  PENDING_LOGS: 'wadaage_driver_pending_fuel_logs',
  PENDING_SESSIONS: 'wadaage_driver_pending_sessions',
  LOCAL_LOGS: 'wadaage_driver_local_fuel_logs',
  DAILY_REPORTS: 'wadaage_driver_daily_reports',
};

// Default Vehicle for Wadaage Driver in Hargeisa
export const DEFAULT_VEHICLE_PROFILE: VehicleFuelProfile = {
  id: 'veh_driver_default',
  driverId: 'driver_default',
  make: 'Toyota',
  model: 'Vitz',
  year: 2018,
  licensePlate: 'SL-4921',
  fuelType: 'petrol',
  tankCapacityLiters: 45,
  averageKmPerLiter: 8.5,
  currentFuelLiters: 32.5,
  fuelPricePerLiterSlsh: 10000,
  updatedAt: new Date().toISOString(),
};

// Common Somaliland Gas Stations in Hargeisa
export const HARGEISA_FUEL_STATIONS = [
  'Hass Petroleum - 26 June',
  'Red Sea Petroleum - Jigjiga Yar',
  'Total Hargeisa - Airport Road',
  'Somali Gas / Petrol - Goljano',
  'Dahabshiil Energy - Bada Cas',
  'Al-Kowthar Fuel - New Hargeisa',
  'Nugaal Petroleum - Shacabka',
  'Golis Energy - Pepsi Road',
];

/**
 * Mathematical calculations for Fuel and Distance
 */
export function calculateFuelUsed(distanceKm: number, kmPerLiter: number): number {
  if (!kmPerLiter || kmPerLiter <= 0) return 0;
  return Number((distanceKm / kmPerLiter).toFixed(2));
}

export function calculateRemainingFuel(currentFuelLiters: number, fuelUsedLiters: number): number {
  return Number(Math.max(0, currentFuelLiters - fuelUsedLiters).toFixed(2));
}

export function calculateRemainingRange(remainingFuelLiters: number, kmPerLiter: number): number {
  if (!kmPerLiter || kmPerLiter <= 0) return 0;
  return Math.round(remainingFuelLiters * kmPerLiter);
}

export function calculateFuelPercentage(remainingFuelLiters: number, tankCapacityLiters: number): number {
  if (!tankCapacityLiters || tankCapacityLiters <= 0) return 0;
  const pct = Math.round((remainingFuelLiters / tankCapacityLiters) * 100);
  return Math.min(100, Math.max(0, pct));
}

export function calculateFuelCostSlsh(fuelUsedLiters: number, pricePerLiterSlsh: number): number {
  return Math.round(fuelUsedLiters * pricePerLiterSlsh);
}

export function calculateCostPerKmSlsh(totalCostSlsh: number, distanceKm: number): number {
  if (!distanceKm || distanceKm <= 0) return 0;
  return Math.round(totalCostSlsh / distanceKm);
}

/**
 * Determine Fuel Warning Level
 * Rules:
 * - Below 25% or remaining range < 60 km: LOW FUEL
 * - Below 15%: VERY LOW FUEL
 * - Range < 30 km: CRITICAL FUEL
 */
export function evaluateFuelWarning(
  remainingLiters: number,
  tankCapacityLiters: number,
  remainingRangeKm: number
): FuelWarning {
  const percentage = calculateFuelPercentage(remainingLiters, tankCapacityLiters);

  if (remainingRangeKm <= 30 || percentage <= 10) {
    return {
      level: 'critical',
      title: 'CRITICAL FUEL LEVEL (Shidaal Aad U Yar!)',
      message: `Critical fuel! Estimated range is only ${remainingRangeKm} km (${remainingLiters.toFixed(1)} L). Refuel immediately in Hargeisa.`,
      estimatedRemainingLiters: remainingLiters,
      estimatedRangeKm: remainingRangeKm,
    };
  }

  if (percentage <= 15) {
    return {
      level: 'very_low',
      title: 'VERY LOW FUEL (Shidaal Hooseeya)',
      message: `You have ${remainingLiters.toFixed(1)} L remaining. Please refuel soon. Estimated range: ${remainingRangeKm} km.`,
      estimatedRemainingLiters: remainingLiters,
      estimatedRangeKm: remainingRangeKm,
    };
  }

  if (percentage <= 25 || remainingRangeKm <= 60) {
    return {
      level: 'low',
      title: 'LOW FUEL WARNING (Digniin Shidaal)',
      message: `You have approximately ${remainingLiters.toFixed(1)} liters remaining. Estimated range: ${remainingRangeKm} km.`,
      estimatedRemainingLiters: remainingLiters,
      estimatedRangeKm: remainingRangeKm,
    };
  }

  return {
    level: 'normal',
    title: 'Fuel Level Good',
    message: `Sufficient fuel for driving. Range: ${remainingRangeKm} km.`,
    estimatedRemainingLiters: remainingLiters,
    estimatedRangeKm: remainingRangeKm,
  };
}

/**
 * Haversine formula to compute great-circle distance in kilometers
 */
export function haversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * GPS Noise & Jitter Filter
 * Ignores small location flutter (< 15 meters) or unrealistic jumps (> 150 km/h)
 */
export function isValidGpsStep(
  lastLat: number,
  lastLng: number,
  lastTimeMs: number,
  newLat: number,
  newLng: number,
  newTimeMs: number,
  accuracyMeters: number = 20
): { valid: boolean; distanceKm: number; speedKmh: number } {
  // If GPS accuracy is worse than 50 meters, discard point as noisy jitter
  if (accuracyMeters > 50) {
    return { valid: false, distanceKm: 0, speedKmh: 0 };
  }

  const distanceKm = haversineDistanceKm(lastLat, lastLng, newLat, newLng);
  const timeDeltaHours = Math.max(0.0001, (newTimeMs - lastTimeMs) / (1000 * 3600));
  const speedKmh = distanceKm / timeDeltaHours;

  // Stationary noise threshold: less than 15 meters (0.015 km)
  if (distanceKm < 0.015) {
    return { valid: false, distanceKm: 0, speedKmh: 0 };
  }

  // Teleportation / GPS bounce threshold: faster than 150 km/h in city of Hargeisa
  if (speedKmh > 150) {
    return { valid: false, distanceKm: 0, speedKmh: 0 };
  }

  return { valid: true, distanceKm, speedKmh };
}

// ----------------------------------------------------
// Vehicle Profile Persistence (Local & Firestore)
// ----------------------------------------------------

export function getLocalVehicleProfile(driverId?: string): VehicleFuelProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.VEHICLE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (!driverId || parsed.driverId === driverId || parsed.driverId === 'driver_default') {
        return {
          ...parsed,
          tankCapacityLiters: Number(parsed.tankCapacityLiters) || 45,
          averageKmPerLiter: Number(parsed.averageKmPerLiter) || 8.5,
          currentFuelLiters: Number(parsed.currentFuelLiters) || 32.5,
          fuelPricePerLiterSlsh: Number(parsed.fuelPricePerLiterSlsh) || 10000,
        };
      }
    }
  } catch (e) {
    console.warn('Error reading vehicle profile from local storage', e);
  }

  return {
    ...DEFAULT_VEHICLE_PROFILE,
    driverId: driverId || 'driver_default',
  };
}

export function saveLocalVehicleProfile(profile: VehicleFuelProfile): void {
  try {
    localStorage.setItem(STORAGE_KEYS.VEHICLE, JSON.stringify(profile));
  } catch (e) {
    console.warn('Error saving vehicle profile locally', e);
  }
}

export async function loadVehicleProfile(driverId: string): Promise<VehicleFuelProfile> {
  const local = getLocalVehicleProfile(driverId);
  try {
    const docRef = doc(db, 'vehicles', `veh_${driverId}`);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const cloudData = snap.data() as VehicleFuelProfile;
      const merged = { ...local, ...cloudData };
      saveLocalVehicleProfile(merged);
      return merged;
    }
  } catch (err) {
    console.warn('Firestore vehicle fetch (offline mode):', err);
  }
  return local;
}

export async function saveVehicleProfile(profile: VehicleFuelProfile): Promise<void> {
  const cleanProfile: VehicleFuelProfile = {
    ...profile,
    tankCapacityLiters: Math.max(1, Math.min(200, Number(profile.tankCapacityLiters) || 45)),
    averageKmPerLiter: Math.max(1, Math.min(30, Number(profile.averageKmPerLiter) || 8.5)),
    currentFuelLiters: Math.max(0, Math.min(profile.tankCapacityLiters, Number(profile.currentFuelLiters) || 0)),
    fuelPricePerLiterSlsh: Math.max(100, Number(profile.fuelPricePerLiterSlsh) || 10000),
    updatedAt: new Date().toISOString(),
  };

  saveLocalVehicleProfile(cleanProfile);

  try {
    const docRef = doc(db, 'vehicles', `veh_${cleanProfile.driverId}`);
    await setDoc(docRef, cleanForFirestore(cleanProfile), { merge: true });
  } catch (err) {
    console.warn('Firestore vehicle write (offline fallback):', err);
  }

  // Also sync with server REST if available
  try {
    await fetch('/api/driver/fuel-vehicle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cleanProfile),
    });
  } catch {
    // Non-blocking
  }
}

// ----------------------------------------------------
// Refill & Fuel Correction Management
// ----------------------------------------------------

export function getLocalFuelLogs(driverId?: string): FuelLogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LOCAL_LOGS);
    if (raw) {
      const logs = JSON.parse(raw) as FuelLogEntry[];
      return driverId ? logs.filter((l) => l.driverId === driverId || l.driverId === 'driver_default') : logs;
    }
  } catch (e) {
    console.warn('Error reading local fuel logs', e);
  }
  return [];
}

export function saveLocalFuelLog(entry: FuelLogEntry): void {
  try {
    const existing = getLocalFuelLogs();
    const updated = [entry, ...existing.filter((l) => l.id !== entry.id)].slice(0, 50);
    localStorage.setItem(STORAGE_KEYS.LOCAL_LOGS, JSON.stringify(updated));
  } catch (e) {
    console.warn('Error saving local fuel log', e);
  }
}

export async function addFuelRefill(
  driverId: string,
  vehicle: VehicleFuelProfile,
  refill: {
    litersAdded: number;
    pricePerLiterSlsh: number;
    odometerKm?: number;
    fuelStation?: string;
    notes?: string;
  }
): Promise<{ updatedVehicle: VehicleFuelProfile; log: FuelLogEntry }> {
  const previousFuel = vehicle.currentFuelLiters;
  const newFuel = Math.min(vehicle.tankCapacityLiters, Number((previousFuel + refill.litersAdded).toFixed(2)));
  const totalCost = Math.round(refill.litersAdded * refill.pricePerLiterSlsh);

  const logEntry: FuelLogEntry = {
    id: `refill_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    driverId,
    vehicleId: vehicle.id,
    type: 'refill',
    litersAdded: refill.litersAdded,
    fuelPricePerLiterSlsh: refill.pricePerLiterSlsh,
    totalCostSlsh: totalCost,
    previousFuelLiters: previousFuel,
    newFuelLiters: newFuel,
    odometerKm: refill.odometerKm,
    fuelStation: refill.fuelStation || 'Hargeisa Fuel Station',
    notes: refill.notes || '',
    timestamp: new Date().toISOString(),
  };

  saveLocalFuelLog(logEntry);

  const updatedVehicle: VehicleFuelProfile = {
    ...vehicle,
    currentFuelLiters: newFuel,
    fuelPricePerLiterSlsh: refill.pricePerLiterSlsh,
    updatedAt: new Date().toISOString(),
  };

  await saveVehicleProfile(updatedVehicle);

  // Sync log to Firestore
  try {
    const logRef = doc(db, 'fuel_logs', logEntry.id);
    await setDoc(logRef, cleanForFirestore(logEntry));
  } catch (err) {
    console.warn('Firestore fuel log write error (saved locally):', err);
  }

  // Update daily report
  await recordFuelAdditionToDailyReport(driverId, refill.litersAdded);

  return { updatedVehicle, log: logEntry };
}

export async function correctFuelLevelManually(
  driverId: string,
  vehicle: VehicleFuelProfile,
  newFuelLiters: number,
  reason?: string
): Promise<{ updatedVehicle: VehicleFuelProfile; log: FuelLogEntry }> {
  const safeNewFuel = Math.max(0, Math.min(vehicle.tankCapacityLiters, Number(newFuelLiters.toFixed(2))));
  const previousFuel = vehicle.currentFuelLiters;

  const logEntry: FuelLogEntry = {
    id: `correct_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    driverId,
    vehicleId: vehicle.id,
    type: 'manual_correction',
    previousFuelLiters: previousFuel,
    newFuelLiters: safeNewFuel,
    notes: reason || 'Manual calibration by driver',
    timestamp: new Date().toISOString(),
  };

  saveLocalFuelLog(logEntry);

  const updatedVehicle: VehicleFuelProfile = {
    ...vehicle,
    currentFuelLiters: safeNewFuel,
    lastCorrectionAt: new Date().toISOString(),
    lastCorrectionReason: reason || 'Driver calibration',
    updatedAt: new Date().toISOString(),
  };

  await saveVehicleProfile(updatedVehicle);

  try {
    const logRef = doc(db, 'fuel_logs', logEntry.id);
    await setDoc(logRef, cleanForFirestore(logEntry));
  } catch (err) {
    console.warn('Firestore manual fuel log write error (saved locally):', err);
  }

  return { updatedVehicle, log: logEntry };
}

// ----------------------------------------------------
// Driving Sessions & Live GPS Tracking
// ----------------------------------------------------

export function getActiveDrivingSession(): DrivingSessionRecord | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ACTIVE_SESSION);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Error reading active driving session', e);
  }
  return null;
}

export function saveActiveDrivingSession(session: DrivingSessionRecord | null): void {
  try {
    if (!session) {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_SESSION);
    } else {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_SESSION, JSON.stringify(session));
    }
  } catch (e) {
    console.warn('Error saving active driving session', e);
  }
}

export function startDrivingSession(
  driverId: string,
  vehicle: VehicleFuelProfile,
  location: { lat: number; lng: number }
): DrivingSessionRecord {
  const newSession: DrivingSessionRecord = {
    id: `session_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    driverId,
    vehicleId: vehicle.id,
    startTime: new Date().toISOString(),
    startLatitude: location.lat,
    startLongitude: location.lng,
    distanceKm: 0,
    durationMinutes: 0,
    fuelUsedLiters: 0,
    fuelEfficiencyKmPerLiter: vehicle.averageKmPerLiter,
    estimatedFuelCostSlsh: 0,
    averageSpeedKmh: 0,
    maxSpeedKmh: 0,
    fuelLevelStart: vehicle.currentFuelLiters,
    fuelLevelEnd: vehicle.currentFuelLiters,
    fuelCalculationMethod: 'ESTIMATED',
    status: 'active',
    synced: false,
  };

  saveActiveDrivingSession(newSession);
  return newSession;
}

export function updateDrivingSessionDistance(
  session: DrivingSessionRecord,
  addedDistanceKm: number,
  currentSpeedKmh: number,
  vehicle: VehicleFuelProfile,
  currentLocation?: { lat: number; lng: number }
): { updatedSession: DrivingSessionRecord; updatedVehicle: VehicleFuelProfile } {
  const newDistance = Number((session.distanceKm + addedDistanceKm).toFixed(2));
  const startTimeMs = new Date(session.startTime).getTime();
  const durationMinutes = Math.max(1, Math.round((Date.now() - startTimeMs) / 60000));

  const fuelUsed = calculateFuelUsed(newDistance, vehicle.averageKmPerLiter);
  const estimatedCost = calculateFuelCostSlsh(fuelUsed, vehicle.fuelPricePerLiterSlsh);

  const maxSpeed = Math.max(session.maxSpeedKmh, Math.round(currentSpeedKmh));
  const avgSpeed = Math.round((newDistance / (durationMinutes / 60)) || 0);

  const newFuelLevel = Math.max(0, Number((session.fuelLevelStart - fuelUsed).toFixed(2)));

  const updatedSession: DrivingSessionRecord = {
    ...session,
    distanceKm: newDistance,
    durationMinutes,
    fuelUsedLiters: fuelUsed,
    estimatedFuelCostSlsh: estimatedCost,
    maxSpeedKmh: Math.min(140, maxSpeed),
    averageSpeedKmh: Math.min(120, avgSpeed),
    fuelLevelEnd: newFuelLevel,
    endLatitude: currentLocation?.lat ?? session.endLatitude,
    endLongitude: currentLocation?.lng ?? session.endLongitude,
  };

  saveActiveDrivingSession(updatedSession);

  // Update vehicle profile current fuel
  const updatedVehicle: VehicleFuelProfile = {
    ...vehicle,
    currentFuelLiters: newFuelLevel,
    updatedAt: new Date().toISOString(),
  };
  saveLocalVehicleProfile(updatedVehicle);

  return { updatedSession, updatedVehicle };
}

export async function finishDrivingSession(
  session: DrivingSessionRecord,
  vehicle: VehicleFuelProfile,
  endLocation?: { lat: number; lng: number }
): Promise<{ finishedSession: DrivingSessionRecord; updatedVehicle: VehicleFuelProfile }> {
  const completedSession: DrivingSessionRecord = {
    ...session,
    endTime: new Date().toISOString(),
    status: 'completed',
    endLatitude: endLocation?.lat ?? session.endLatitude,
    endLongitude: endLocation?.lng ?? session.endLongitude,
    synced: true,
  };

  saveActiveDrivingSession(null);

  // Save to daily report
  await addSessionToDailyReport(session.driverId, completedSession, vehicle);

  // Save to Firestore
  try {
    const docRef = doc(db, 'driving_sessions', completedSession.id);
    await setDoc(docRef, cleanForFirestore(completedSession));
  } catch (err) {
    console.warn('Firestore session write error (saved locally):', err);
  }

  // Update vehicle in Firestore
  await saveVehicleProfile(vehicle);

  return { finishedSession: completedSession, updatedVehicle: vehicle };
}

// ----------------------------------------------------
// Daily & Weekly Fuel Aggregations
// ----------------------------------------------------

export function getTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function getDailyReport(driverId: string, dateStr?: string): Promise<FuelDailyReport> {
  const targetDate = dateStr || getTodayDateString();
  const reportId = `report_${driverId}_${targetDate}`;

  // Try local storage first
  try {
    const raw = localStorage.getItem(`${STORAGE_KEYS.DAILY_REPORTS}_${targetDate}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.driverId === driverId || parsed.driverId === 'driver_default') {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading local daily report', e);
  }

  // Try Firestore
  try {
    const docRef = doc(db, 'fuel_daily_reports', reportId);
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const report = snap.data() as FuelDailyReport;
      localStorage.setItem(`${STORAGE_KEYS.DAILY_REPORTS}_${targetDate}`, JSON.stringify(report));
      return report;
    }
  } catch {
    // Offline mode
  }

  // Generate blank report for today
  const defaultReport: FuelDailyReport = {
    id: reportId,
    driverId,
    date: targetDate,
    distanceKm: 0,
    estimatedFuelUsedLiters: 0,
    fuelAddedLiters: 0,
    estimatedFuelCostSlsh: 0,
    averageEfficiencyKmPerLiter: 8.5,
    costPerKmSlsh: 1176,
    drivingTimeMinutes: 0,
    sessionCount: 0,
    updatedAt: new Date().toISOString(),
  };

  localStorage.setItem(`${STORAGE_KEYS.DAILY_REPORTS}_${targetDate}`, JSON.stringify(defaultReport));
  return defaultReport;
}

export async function recordFuelAdditionToDailyReport(driverId: string, litersAdded: number): Promise<void> {
  const today = getTodayDateString();
  const report = await getDailyReport(driverId, today);
  report.fuelAddedLiters = Number((report.fuelAddedLiters + litersAdded).toFixed(2));
  report.updatedAt = new Date().toISOString();

  localStorage.setItem(`${STORAGE_KEYS.DAILY_REPORTS}_${today}`, JSON.stringify(report));
  try {
    await setDoc(doc(db, 'fuel_daily_reports', report.id), cleanForFirestore(report), { merge: true });
  } catch {
    // Handled
  }
}

export async function addSessionToDailyReport(
  driverId: string,
  session: DrivingSessionRecord,
  vehicle: VehicleFuelProfile
): Promise<FuelDailyReport> {
  const today = getTodayDateString();
  const report = await getDailyReport(driverId, today);

  report.distanceKm = Number((report.distanceKm + session.distanceKm).toFixed(2));
  report.estimatedFuelUsedLiters = Number((report.estimatedFuelUsedLiters + session.fuelUsedLiters).toFixed(2));
  report.estimatedFuelCostSlsh += session.estimatedFuelCostSlsh;
  report.drivingTimeMinutes += session.durationMinutes;
  report.sessionCount += 1;
  report.averageEfficiencyKmPerLiter = vehicle.averageKmPerLiter;
  report.costPerKmSlsh = calculateCostPerKmSlsh(report.estimatedFuelCostSlsh, report.distanceKm);
  report.updatedAt = new Date().toISOString();

  localStorage.setItem(`${STORAGE_KEYS.DAILY_REPORTS}_${today}`, JSON.stringify(report));

  try {
    await setDoc(doc(db, 'fuel_daily_reports', report.id), cleanForFirestore(report), { merge: true });
  } catch {
    // Handled
  }

  return report;
}

export async function getWeeklyFuelSummary(
  driverId: string,
  vehicle: VehicleFuelProfile
): Promise<FuelWeeklySummary> {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const days = [];
  let totalDist = 0;
  let totalFuel = 0;
  let totalCost = 0;

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayName = dayNames[d.getDay()];

    const rep = await getDailyReport(driverId, dateStr);
    totalDist += rep.distanceKm;
    totalFuel += rep.estimatedFuelUsedLiters;
    totalCost += rep.estimatedFuelCostSlsh;

    days.push({
      date: dateStr,
      dayName,
      distanceKm: rep.distanceKm,
      fuelUsedLiters: rep.estimatedFuelUsedLiters,
      fuelCostSlsh: rep.estimatedFuelCostSlsh,
    });
  }

  const avgEfficiency = vehicle.averageKmPerLiter || 8.5;
  const avgCostPerKm = calculateCostPerKmSlsh(totalCost, totalDist);

  return {
    totalDistanceKm: Number(totalDist.toFixed(1)),
    totalFuelUsedLiters: Number(totalFuel.toFixed(1)),
    totalFuelCostSlsh: totalCost,
    averageEfficiencyKmPerLiter: avgEfficiency,
    averageCostPerKmSlsh: avgCostPerKm,
    days,
  };
}
