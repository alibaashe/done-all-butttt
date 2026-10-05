import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import {
  VehicleFuelProfile,
  FuelLogEntry,
  DrivingSessionRecord,
  FuelDailyReport,
  FuelWeeklySummary,
  FuelWarning,
} from '../types';
import {
  DEFAULT_VEHICLE_PROFILE,
  getLocalVehicleProfile,
  loadVehicleProfile,
  saveVehicleProfile as persistVehicleProfile,
  addFuelRefill,
  correctFuelLevelManually,
  getLocalFuelLogs,
  getActiveDrivingSession,
  startDrivingSession,
  updateDrivingSessionDistance,
  finishDrivingSession,
  getDailyReport,
  getWeeklyFuelSummary,
  evaluateFuelWarning,
  calculateRemainingRange,
  calculateFuelPercentage,
  isValidGpsStep,
} from '../services/fuelService';
import { useRide } from './RideContext';

interface FuelContextType {
  vehicle: VehicleFuelProfile;
  setVehicle: (v: VehicleFuelProfile) => void;
  updateVehicleProfile: (v: VehicleFuelProfile) => Promise<void>;
  activeSession: DrivingSessionRecord | null;
  fuelLogs: FuelLogEntry[];
  dailyReport: FuelDailyReport;
  weeklySummary: FuelWeeklySummary | null;
  currentFuelLiters: number;
  fuelPercentage: number;
  remainingRangeKm: number;
  todayDrivingKm: number;
  todayFuelUsedLiters: number;
  todayFuelCostSlsh: number;
  fuelEfficiencyKmPerLiter: number;
  costPerKmSlsh: number;
  fuelWarning: FuelWarning;
  isTrackingActive: boolean;
  trackingMethod: 'ESTIMATED' | 'OBD';
  obdConnected: boolean;
  addRefill: (data: {
    litersAdded: number;
    pricePerLiterSlsh: number;
    odometerKm?: number;
    fuelStation?: string;
    notes?: string;
  }) => Promise<void>;
  correctFuelLevel: (newLiters: number, reason?: string) => Promise<void>;
  processGpsCoordinate: (lat: number, lng: number, accuracy?: number, speed?: number) => void;
  startSession: (location?: { lat: number; lng: number }) => void;
  stopSession: (location?: { lat: number; lng: number }) => Promise<void>;
  refreshReports: () => Promise<void>;
}

const FuelContext = createContext<FuelContextType | undefined>(undefined);

export const FuelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, driverModeOnline, driverGpsStatus } = useRide();
  const driverId = currentUser?.id || 'driver_default';

  const [vehicle, setVehicleState] = useState<VehicleFuelProfile>(() => getLocalVehicleProfile(driverId));
  const [activeSession, setActiveSession] = useState<DrivingSessionRecord | null>(() => getActiveDrivingSession());
  const [fuelLogs, setFuelLogs] = useState<FuelLogEntry[]>(() => getLocalFuelLogs(driverId));
  const [dailyReport, setDailyReport] = useState<FuelDailyReport>({
    id: `report_${driverId}`,
    driverId,
    date: new Date().toISOString().split('T')[0],
    distanceKm: 0,
    estimatedFuelUsedLiters: 0,
    fuelAddedLiters: 0,
    estimatedFuelCostSlsh: 0,
    averageEfficiencyKmPerLiter: 8.5,
    costPerKmSlsh: 1176,
    drivingTimeMinutes: 0,
    sessionCount: 0,
    updatedAt: new Date().toISOString(),
  });
  const [weeklySummary, setWeeklySummary] = useState<FuelWeeklySummary | null>(null);
  const [obdConnected] = useState<boolean>(false); // Prepared for future OBD-II hardware

  const lastGpsPointRef = useRef<{ lat: number; lng: number; timeMs: number } | null>(null);

  // Load driver profile and initial reports
  const refreshReports = useCallback(async () => {
    try {
      const rep = await getDailyReport(driverId);
      setDailyReport(rep);
      const weekly = await getWeeklyFuelSummary(driverId, vehicle);
      setWeeklySummary(weekly);
      setFuelLogs(getLocalFuelLogs(driverId));
    } catch (err) {
      console.warn('Error refreshing fuel reports', err);
    }
  }, [driverId, vehicle]);

  useEffect(() => {
    let isMounted = true;
    loadVehicleProfile(driverId).then((loaded) => {
      if (isMounted) {
        setVehicleState(loaded);
        getDailyReport(driverId).then((rep) => {
          if (isMounted) setDailyReport(rep);
        });
        getWeeklyFuelSummary(driverId, loaded).then((w) => {
          if (isMounted) setWeeklySummary(w);
        });
      }
    });
    return () => {
      isMounted = false;
    };
  }, [driverId]);

  const processGpsCoordinate = useCallback(
    (lat: number, lng: number, accuracy: number = 15, speed: number = 0) => {
      if (!activeSession) return;
      const now = Date.now();

      if (!lastGpsPointRef.current) {
        lastGpsPointRef.current = { lat, lng, timeMs: now };
        return;
      }

      const check = isValidGpsStep(
        lastGpsPointRef.current.lat,
        lastGpsPointRef.current.lng,
        lastGpsPointRef.current.timeMs,
        lat,
        lng,
        now,
        accuracy
      );

      if (check.valid && check.distanceKm > 0) {
        const { updatedSession, updatedVehicle } = updateDrivingSessionDistance(
          activeSession,
          check.distanceKm,
          check.speedKmh || speed,
          vehicle,
          { lat, lng }
        );
        setActiveSession(updatedSession);
        setVehicleState(updatedVehicle);
        lastGpsPointRef.current = { lat, lng, timeMs: now };
      }
    },
    [activeSession, vehicle]
  );

  // Manage Driving Session based on Online / Offline state
  useEffect(() => {
    if (driverModeOnline && !activeSession) {
      const loc =
        driverGpsStatus && driverGpsStatus.lat && driverGpsStatus.lng
          ? { lat: driverGpsStatus.lat, lng: driverGpsStatus.lng }
          : { lat: 9.5600, lng: 44.0650 };
      const sess = startDrivingSession(driverId, vehicle, loc);
      setActiveSession(sess);
      lastGpsPointRef.current = { lat: loc.lat, lng: loc.lng, timeMs: Date.now() };
    } else if (!driverModeOnline && activeSession) {
      const loc =
        driverGpsStatus && driverGpsStatus.lat && driverGpsStatus.lng
          ? { lat: driverGpsStatus.lat, lng: driverGpsStatus.lng }
          : undefined;
      finishDrivingSession(activeSession, vehicle, loc).then(({ updatedVehicle }) => {
        setActiveSession(null);
        setVehicleState(updatedVehicle);
        refreshReports();
      });
    }
  }, [driverModeOnline]);

  // Feed driver GPS changes into noise-filtered distance accumulator
  useEffect(() => {
    if (!driverModeOnline || !activeSession || !driverGpsStatus || !driverGpsStatus.lat) return;
    processGpsCoordinate(
      driverGpsStatus.lat,
      driverGpsStatus.lng,
      driverGpsStatus.accuracy,
      driverGpsStatus.speed
    );
  }, [
    driverGpsStatus?.lat,
    driverGpsStatus?.lng,
    driverGpsStatus?.lastUpdated,
    driverModeOnline,
    activeSession,
    processGpsCoordinate,
  ]);

  const updateVehicleProfile = async (newProfile: VehicleFuelProfile) => {
    setVehicleState(newProfile);
    await persistVehicleProfile(newProfile);
    refreshReports();
  };

  const addRefill = async (data: {
    litersAdded: number;
    pricePerLiterSlsh: number;
    odometerKm?: number;
    fuelStation?: string;
    notes?: string;
  }) => {
    const { updatedVehicle, log } = await addFuelRefill(driverId, vehicle, data);
    setVehicleState(updatedVehicle);
    setFuelLogs((prev) => [log, ...prev]);
    refreshReports();
  };

  const correctFuelLevel = async (newLiters: number, reason?: string) => {
    const { updatedVehicle, log } = await correctFuelLevelManually(driverId, vehicle, newLiters, reason);
    setVehicleState(updatedVehicle);
    setFuelLogs((prev) => [log, ...prev]);
    refreshReports();
  };

  const startSession = (location?: { lat: number; lng: number }) => {
    const loc =
      location ||
      (driverGpsStatus && driverGpsStatus.lat && driverGpsStatus.lng
        ? { lat: driverGpsStatus.lat, lng: driverGpsStatus.lng }
        : { lat: 9.5600, lng: 44.0650 });
    const sess = startDrivingSession(driverId, vehicle, loc);
    setActiveSession(sess);
    lastGpsPointRef.current = { lat: loc.lat, lng: loc.lng, timeMs: Date.now() };
  };

  const stopSession = async (location?: { lat: number; lng: number }) => {
    if (!activeSession) return;
    const { updatedVehicle } = await finishDrivingSession(activeSession, vehicle, location);
    setActiveSession(null);
    setVehicleState(updatedVehicle);
    lastGpsPointRef.current = null;
    refreshReports();
  };

  // Derived Real-Time Stats
  const currentFuelLiters = Number(vehicle.currentFuelLiters.toFixed(1));
  const fuelPercentage = calculateFuelPercentage(currentFuelLiters, vehicle.tankCapacityLiters);
  const remainingRangeKm = calculateRemainingRange(currentFuelLiters, vehicle.averageKmPerLiter);

  const todaySessionDistance = activeSession?.distanceKm || 0;
  const todayDrivingKm = Number((dailyReport.distanceKm + todaySessionDistance).toFixed(1));

  const todaySessionFuel = activeSession?.fuelUsedLiters || 0;
  const todayFuelUsedLiters = Number((dailyReport.estimatedFuelUsedLiters + todaySessionFuel).toFixed(2));

  const todaySessionCost = activeSession?.estimatedFuelCostSlsh || 0;
  const todayFuelCostSlsh = dailyReport.estimatedFuelCostSlsh + todaySessionCost;

  const fuelEfficiencyKmPerLiter = vehicle.averageKmPerLiter || 8.5;
  const costPerKmSlsh = todayDrivingKm > 0 ? Math.round(todayFuelCostSlsh / todayDrivingKm) : Math.round(vehicle.fuelPricePerLiterSlsh / fuelEfficiencyKmPerLiter);

  const fuelWarning = evaluateFuelWarning(currentFuelLiters, vehicle.tankCapacityLiters, remainingRangeKm);

  return (
    <FuelContext.Provider
      value={{
        vehicle,
        setVehicle: setVehicleState,
        updateVehicleProfile,
        activeSession,
        fuelLogs,
        dailyReport,
        weeklySummary,
        currentFuelLiters,
        fuelPercentage,
        remainingRangeKm,
        todayDrivingKm,
        todayFuelUsedLiters,
        todayFuelCostSlsh,
        fuelEfficiencyKmPerLiter,
        costPerKmSlsh,
        fuelWarning,
        isTrackingActive: driverModeOnline,
        trackingMethod: obdConnected ? 'OBD' : 'ESTIMATED',
        obdConnected,
        addRefill,
        correctFuelLevel,
        processGpsCoordinate,
        startSession,
        stopSession,
        refreshReports,
      }}
    >
      {children}
    </FuelContext.Provider>
  );
};

export const useFuel = () => {
  const context = useContext(FuelContext);
  if (!context) {
    throw new Error('useFuel must be used within a FuelProvider');
  }
  return context;
};
