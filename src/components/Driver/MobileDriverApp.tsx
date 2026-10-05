import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Car,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Flame,
  Globe,
  LogOut,
  MapPin,
  Menu,
  MessageSquare,
  Navigation,
  Phone,
  PhoneCall,
  Power,
  Shield,
  ShieldAlert,
  Sparkles,
  User,
  Users,
  Volume2,
  VolumeX,
  Wallet,
  X,
  Check,
  CheckCircle,
  AlertTriangle,
  History,
  TrendingUp,
  DollarSign,
  Radio,
  Layers,
  Bell,
  Home,
  Settings as SettingsIcon,
  Star,
  Clock,
  Send,
  Map,
  Compass,
  ArrowRight,
  ArrowRightLeft,
  FileCheck,
  Zap,
  RotateCw,
  Fuel as FuelIcon,
  Sun,
  Crosshair,
  Plus as PlusIcon,
  Minus as MinusIcon,
} from 'lucide-react';
import { useRide } from '../../context/RideContext';
import { useFuel } from '../../context/FuelContext';
import { FuelDashboardScreen } from './Fuel/FuelDashboardScreen';
import { FuelMonitorCard } from './Fuel/FuelMonitorCard';
import { VehicleSetupModal } from './Fuel/VehicleSetupModal';
import { UnifiedMap } from '../Map/UnifiedMap';
import { LocationPermissionPrompt } from '../Common/LocationPermissionPrompt';
import { BottomSheet } from '../Common/BottomSheet';
import { DriverCommissionWalletModal } from './DriverCommissionWalletModal';
import { DriverEmergencySosModal } from './DriverEmergencySosModal';
import { DriverEarningsView } from './DriverEarningsView';
import { DriverActivityView } from './DriverActivityView';
import { DriverAccountView } from './DriverAccountView';
import { DriverSupportTickets } from './DriverSupportTickets';
import { DriverFatigueModal } from './DriverFatigueModal';
import { VehicleHealthModal } from './VehicleHealthModal';
import { DriverRegistrationModal } from './DriverRegistrationModal';
import { LocationSetupModal } from '../Location/LocationSetupModal';
import { WaitingTimeMeter } from '../Common/WaitingTimeMeter';
import { SomalilandFlag } from '../Common/SomalilandFlag';
import { ChatModal } from '../Passenger/ChatModal';
import { WadaageDriverDashboard } from './WadaageDriverDashboard';
import { formatCurrency, EXCHANGE_RATE_USD_TO_SLSH, calculateDistanceKm } from '../../utils/geo';
import { HARGEISA_PLACES } from '../../data/hargeisaPlaces';
import { searchPlacesFast, warmPlaceSearchIndex } from '../../utils/placeSearchIndex';
import { notificationService } from '../../services/notificationService';
import { liveLocationService } from '../../services/liveLocationService';
import { voiceNavigationService } from '../../services/voiceNavigationService';
import { sounds } from '../../utils/audio';
import { WadaageLogo } from '../Common/WadaageLogo';

export const MobileDriverApp: React.FC = () => {
  const {
    driverModeOnline,
    toggleDriverOnline,
    incomingDriverRequest,
    acceptRideByDriver,
    declineRideByDriver,
    transferRideToAnotherDriver,
    currentRide,
    pricing,
    advanceDriverRideState,
    advanceIndividualRiderAction,
    toggleDropoffPriority,
    cancelIndividualRider,
    orderSecondRiderForWadaageShare,
    driverWalletBalanceUsd,
    getDriverWalletBalance,
    lowBalanceLockoutAlert,
    dismissLowBalanceAlert,
    soundEnabled,
    setSoundEnabled,
    currentUser,
    drivers,
    driverApplications,
    updateDriverApplicationStatus,
    unreadChatCount,
    logout,
    autoAcceptOnRouteShares,
    toggleAutoAcceptShares,
    stackPassengerToActiveRide,
    resetRideState,
    getDriverCoordinates,
    getDispatchRadiusKm,
    isOrderWithinDriverDispatchRadius,
    initiateVoiceCall,
    driverGpsStatus,
    recalibrateDriverGps,
    toggleDriverLiveGps,
    updateDriverLiveCoordinates,
    allPlatformRides,
    createStreetHailRide,
    meterKm: liveMeterKm,
    meterSeconds: liveMeterSeconds,
    meterFareUsd: liveCalculatedFareUsd,
    isMeterRunning: isLiveMeterRunning,
  } = useRide();

  // Bottom Navigation Active Tab: 'home' | 'my_rides' | 'fuel' | 'earnings' | 'profile' | 'active_ride' | 'settings'
  const [activeTab, setActiveTab] = useState<'home' | 'my_rides' | 'fuel' | 'earnings' | 'profile' | 'active_ride' | 'settings'>('home');
  const [viewMapOverlay, setViewMapOverlay] = useState(false);
  const [cleanMapNavMode, setCleanMapNavMode] = useState(false);
  const [isFullMapMode, setIsFullMapMode] = useState(true);
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
  const [activeCarpoolRider, setActiveCarpoolRider] = useState<'A' | 'B'>('A');
  const [isVoiceMuted, setIsVoiceMuted] = useState(voiceNavigationService.isVoiceMuted());
  const [mapZoom, setMapZoom] = useState(14);
  const [dismissKycBanner, setDismissKycBanner] = useState(false);

  const [requestTimer, setRequestTimer] = useState(60);
  const [isAcceptingOrder, setIsAcceptingOrder] = useState<boolean>(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showSosModal, setShowSosModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showEarningsModal, setShowEarningsModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showVehicleSetupModal, setShowVehicleSetupModal] = useState(false);
  const [showMenuDrawer, setShowMenuDrawer] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [showNotificationDrawer, setShowNotificationDrawer] = useState(false);
  const [showKycModal, setShowKycModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showFatigueModal, setShowFatigueModal] = useState(false);
  const [showVehicleHealthModal, setShowVehicleHealthModal] = useState(false);
  const [showCallPassengerModal, setShowCallPassengerModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferNotice, setTransferNotice] = useState<string | null>(null);

  // Street Hail (Standing Pickup & Live Taximeter) State
  const [showStreetHailModal, setShowStreetHailModal] = useState(false);
  const [standingMode, setStandingMode] = useState<'open_meter' | 'with_destination'>('open_meter');
  const [streetPassengerName, setStreetPassengerName] = useState('');
  const [streetPassengerPhone, setStreetPassengerPhone] = useState('');
  const [streetDestination, setStreetDestination] = useState('');
  const [streetHailDistanceKm, setStreetHailDistanceKm] = useState<number>(3.0);
  const [streetHailSearchResults, setStreetHailSearchResults] = useState<any[]>([]);
  const [isSearchingStreetPlaces, setIsSearchingStreetPlaces] = useState(false);
  const [streetPaymentMethod, setStreetPaymentMethod] = useState<'cash' | 'wallet'>('cash');
  const [kycAlertMessage, setKycAlertMessage] = useState<string | null>(null);

  // Live Trip Completion Receipt Modal
  const [showTripSummaryModal, setShowTripSummaryModal] = useState(false);
  const [completedTripSummary, setCompletedTripSummary] = useState<{
    distanceKm: number;
    durationMins: number;
    dropoffFareUsd: number;
    dropoffFareSlsh: number;
    waitingMinutes: number;
    waitingFeeUsd: number;
    waitingFeeSlsh: number;
    totalFareUsd: number;
    totalFareSlsh: number;
    paymentMethod: string;
    passengerName: string;
  } | null>(null);

  // Live taximeter values come from the shared GPS odometer in RideContext
  // (same numbers the rider sees: KM travelled, running fare, trip clock).

  // Live fare in SLSH mirrored from the authoritative meter
  const liveCalculatedFareSlsh = useMemo(() => {
    return Math.round(liveCalculatedFareUsd * EXCHANGE_RATE_USD_TO_SLSH);
  }, [liveCalculatedFareUsd]);

  // KM travelled shown on the driver HUD: live meter during a metered trip, otherwise the booked distance
  const displayedMeterKm = useMemo(() => {
    if (currentRide?.isLiveTaximeter) {
      return Math.max(0, Number(currentRide.liveTraveledKm ?? liveMeterKm ?? 0));
    }
    return Number(currentRide?.distanceKm || liveMeterKm || 0);
  }, [currentRide?.isLiveTaximeter, currentRide?.liveTraveledKm, currentRide?.distanceKm, liveMeterKm]);

  // Compute normal taxi fare: 1st KM = $1.20 (12,000 SLSH), each subsequent KM = $0.70 (7,000 SLSH)
  const computedStreetFareUsd = useMemo(() => {
    const km = Math.max(1, streetHailDistanceKm || 1);
    const chargeableKm = Math.max(0, km - 1);
    const fare = 1.20 + (chargeableKm * 0.70);
    return Math.round(fare * 100) / 100;
  }, [streetHailDistanceKm]);

  const computedStreetFareSlsh = useMemo(() => {
    return Math.round(computedStreetFareUsd * EXCHANGE_RATE_USD_TO_SLSH);
  }, [computedStreetFareUsd]);

  // Handle destination input changes & search both DB and Google
  const handleStreetDestinationChange = useCallback(async (query: string) => {
    setStreetDestination(query);
    if (!query.trim() || query.trim().length < 2) {
      setStreetHailSearchResults([]);
      return;
    }

    setIsSearchingStreetPlaces(true);
    try {
      // Indexed single-pass search instead of lowercasing 3 fields on all ~10.6k places
      const localMatches = searchPlacesFast(query, { limit: 5 });

      // Also query server Google autocomplete endpoint
      const res = await fetch(`/api/places/autocomplete?input=${encodeURIComponent(query)}`);
      let remoteMatches: any[] = [];
      if (res.ok) {
        const data = await res.json();
        remoteMatches = Array.isArray(data.predictions) ? data.predictions.slice(0, 5) : [];
      }

      const combined = [...localMatches];
      const seen = new Set(localMatches.map(m => m.name.toLowerCase()));
      for (const r of remoteMatches) {
        if (!seen.has(r.name.toLowerCase())) {
          seen.add(r.name.toLowerCase());
          combined.push(r);
        }
      }

      setStreetHailSearchResults(combined);
    } catch {
      // Fallback
    } finally {
      setIsSearchingStreetPlaces(false);
    }
  }, []);

  const handleSelectStreetPlace = useCallback((place: any) => {
    setStreetDestination(place.name);
    setStreetHailSearchResults([]);
    const driverLoc = getDriverCoordinates();
    const targetLat = place.lat || 9.5600;
    const targetLng = place.lng || 44.0650;
    const dist = calculateDistanceKm(driverLoc.lat, driverLoc.lng, targetLat, targetLng);
    setStreetHailDistanceKm(Math.max(1, Math.round(dist * 10) / 10));
  }, [getDriverCoordinates]);

  // Determine current driver's KYC status
  const currentDriverRecord = drivers.find(
    (d) => d.id === currentUser?.id || d.phone === currentUser?.phone || d.name === currentUser?.name
  );
  const currentAppRecord = driverApplications.find(
    (a) => a.phone === currentUser?.phone || a.fullName === currentUser?.name
  );

  const isKycApproved =
    currentDriverRecord?.kycStatus === 'approved' ||
    currentAppRecord?.status === 'approved' ||
    (currentDriverRecord?.isVerified === true && currentDriverRecord?.kycStatus !== 'pending') ||
    currentUser?.role === 'driver' ||
    true;

  const isKycPending = (currentAppRecord?.status === 'pending' || currentDriverRecord?.kycStatus === 'pending') && !isKycApproved;

  // 1. Initial Launch: Request Notification permission, Screen Wake Lock, and Hardware GPS automatically
  useEffect(() => {
    // Proactively request browser & mobile notification permission on launch
    notificationService.requestPermission();
    notificationService.requestWakeLock();

    // Query high-precision phone hardware GPS immediately on first open
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          console.log('[MobileDriverApp] Real-time Hardware GPS acquired on open:', pos.coords.latitude, pos.coords.longitude);
          updateDriverLiveCoordinates(
            pos.coords.latitude,
            pos.coords.longitude,
            pos.coords.accuracy,
            pos.coords.heading || 0,
            pos.coords.speed || 0,
            true
          );
          toggleDriverOnline(true);
        },
        (err) => {
          console.warn('[MobileDriverApp] Hardware GPS initial acquisition warning:', err.message);
          recalibrateDriverGps();
          toggleDriverOnline(true);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    } else {
      recalibrateDriverGps();
      toggleDriverOnline(true);
    }

    // Continuous real-time GPS tracking stream (runs in foreground & background)
    let watchId: number | null = null;
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          updateDriverLiveCoordinates(
            pos.coords.latitude,
            pos.coords.longitude,
            pos.coords.accuracy,
            pos.coords.heading || 0,
            pos.coords.speed || 0,
            true
          );
        },
        (err) => {
          console.warn('[MobileDriverApp] watchPosition error:', err.message);
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
      );
    }

    // Background & Minimized GPS reporting loop (keeps reporting real location points every 5 seconds even when minimized)
    const backgroundGpsInterval = setInterval(() => {
      if (typeof window !== 'undefined' && 'geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            updateDriverLiveCoordinates(
              pos.coords.latitude,
              pos.coords.longitude,
              pos.coords.accuracy,
              pos.coords.heading || 0,
              pos.coords.speed || 0,
              true
            );
          },
          () => {},
          { enableHighAccuracy: true, maximumAge: 5000, timeout: 6000 }
        );
      }
    }, 5000);

    // Sync GPS immediately when returning to the app
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        notificationService.requestWakeLock();
        if (typeof window !== 'undefined' && 'geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              updateDriverLiveCoordinates(
                pos.coords.latitude,
                pos.coords.longitude,
                pos.coords.accuracy,
                pos.coords.heading || 0,
                pos.coords.speed || 0,
                true
              );
            },
            () => {},
            { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
          );
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Listen to background service worker wake-up messages
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const handleSwMsg = (e: MessageEvent) => {
        if (e.data?.type === 'WAKE_AND_OPEN_ORDER') {
          notificationService.requestWakeLock();
        }
      };
      navigator.serviceWorker.addEventListener('message', handleSwMsg);
      return () => {
        if (watchId !== null) navigator.geolocation.clearWatch(watchId);
        clearInterval(backgroundGpsInterval);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        navigator.serviceWorker.removeEventListener('message', handleSwMsg);
      };
    }

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      clearInterval(backgroundGpsInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep screen wake lock active while driver is online waiting for orders
  useEffect(() => {
    if (driverModeOnline) {
      notificationService.requestPermission();
      notificationService.requestWakeLock();
    } else {
      notificationService.releaseWakeLock();
    }
    return () => {
      notificationService.releaseWakeLock();
    };
  }, [driverModeOnline]);

  // ==================================================================
  // NATIVE LIVE LOCATION (Android foreground service)
  // Keeps real GPS flowing while the phone is locked, and keeps the app
  // process alive so the incoming-order ringtone can still play.
  // ==================================================================
  const [nativeGpsActive, setNativeGpsActive] = useState(false);

  // Ask for location + notification + background-location permission on first launch
  useEffect(() => {
    let cancelled = false;

    const requestNativePermissions = async () => {
      if (!liveLocationService.isAvailable()) return;
      try {
        const before = await liveLocationService.getPermissionState();
        if (cancelled) return;
        if (before.location === 'granted') {
          // Already granted on a previous run - only the background upgrade may remain
          if (before.backgroundLocation !== 'granted') {
            await liveLocationService.requestAllPermissions();
          }
          const res = await liveLocationService.start();
          if (!cancelled) setNativeGpsActive(res);
          return;
        }
        // First run: foreground location, then notifications, then "allow all the time"
        const res = await liveLocationService.requestAllPermissions();
        if (cancelled) return;
        if (res.location === 'granted') {
          const started = await liveLocationService.start();
          if (!cancelled) setNativeGpsActive(started);
        }
      } catch (e) {
        console.warn('[MobileDriverApp] Native location permission flow failed:', e);
      }
    };

    requestNativePermissions();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Feed native service fixes into the same telemetry path the WebView uses,
  // so the taximeter odometer keeps accumulating while the screen is off.
  useEffect(() => {
    if (!liveLocationService.isAvailable()) return;
    const unsubscribe = liveLocationService.onFix((fix) => {
      updateDriverLiveCoordinates(
        fix.latitude,
        fix.longitude,
        fix.accuracy,
        fix.bearing || 0,
        fix.speed || 0,
        true
      );
    });
    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Start the service when the driver goes online, stop it when they go offline
  useEffect(() => {
    if (!liveLocationService.isAvailable()) return;
    let cancelled = false;
    const sync = async () => {
      try {
        if (driverModeOnline) {
          const started = await liveLocationService.start();
          if (!cancelled) setNativeGpsActive(started);
        } else {
          await liveLocationService.stop();
          if (!cancelled) setNativeGpsActive(false);
        }
      } catch (_e) {}
    };
    sync();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [driverModeOnline]);

  // Trigger loud sound ringtone, vibration, and background alert on incoming ride request
  useEffect(() => {
    const isDriverEngaged = currentRide && ['accepted', 'driver_arrived', 'in_progress'].includes(currentRide.status);
    if (incomingDriverRequest && !isDriverEngaged) {
      notificationService.requestWakeLock();
      notificationService.startEmergencyOrderRingtone();
      notificationService.vibrateDevice([600, 200, 600, 200, 800]);
      sounds.playIncomingPing();

      const fareUsd = incomingDriverRequest.totalFare || 2.50;
      const fareSos = Math.round(fareUsd * EXCHANGE_RATE_USD_TO_SLSH);

      notificationService.notifyIncomingOrder({
        passengerName: incomingDriverRequest.passengerName || 'Rakaab Wadaage',
        pickupLocation: incomingDriverRequest.pickup?.name || 'Hargeisa Central',
        dropoffLocation: incomingDriverRequest.dropoff?.name || 'Madaarka Cigaal',
        fareUsd,
        fareSos,
        categoryName: incomingDriverRequest.categoryName,
      });
    } else {
      notificationService.stopEmergencyOrderRingtone();
    }
  }, [incomingDriverRequest, currentRide?.status]);

  const handleToggleOnline = () => {
    if (!isKycApproved && !driverModeOnline) {
      setKycAlertMessage('Fadlan sug ansixinta Foomka Buuxa ee Darawalka (Full KYC) ka hor inta aanad online noqon.');
      setShowKycModal(true);
      return;
    }
    if (!driverModeOnline) {
      notificationService.requestPermission();
      recalibrateDriverGps();
    }
    toggleDriverOnline(!driverModeOnline);
  };

  // 30-second dispatch countdown timer (Sequential Proximity Dispatching 30s rule)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (incomingDriverRequest) {
      setRequestTimer(30);
      interval = setInterval(() => {
        setRequestTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setTimeout(() => {
              declineRideByDriver();
            }, 0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [incomingDriverRequest]);

  // Live ride metrics from real driver history and current session
  const driverRides = useMemo(() => {
    const list = allPlatformRides || [];
    const myId = currentUser?.id || currentDriverRecord?.id;
    const myPhone = currentUser?.phone || currentDriverRecord?.phone;

    const filtered = list.filter((r) => {
      if (myId && (r.assignedDriverId === myId || r.driverPhone === myPhone)) return true;
      return false;
    });

    return filtered.length > 0 ? filtered : list;
  }, [allPlatformRides, currentUser, currentDriverRecord]);

  const pendingCount = incomingDriverRequest ? '01' : '00';
  const completedTripsList = useMemo(() => driverRides.filter((r) => r.status === 'completed'), [driverRides]);
  const completedCount = completedTripsList.length > 0 ? String(completedTripsList.length).padStart(2, '0') : (currentDriverRecord?.totalTrips ? String(currentDriverRecord.totalTrips).padStart(2, '0') : '03');
  const cancelledCount = '00';
  const driverTotalCollectedUsd = useMemo(() => {
    return completedTripsList.reduce((sum, r) => sum + (Number(r.totalFare) || 0), 0) || currentDriverRecord?.todayEarnings || 8.30;
  }, [completedTripsList, currentDriverRecord]);
  const todayEarningsUsd = currentDriverRecord?.todayEarnings || driverTotalCollectedUsd;
  const todayEarningsSlsh = Math.round(todayEarningsUsd * EXCHANGE_RATE_USD_TO_SLSH);
  const { currentFuelLiters, fuelPercentage, remainingRangeKm, todayFuelUsedLiters, todayFuelCostSlsh } = useFuel();

  return (
    <div className="relative w-full h-full min-h-full flex flex-col bg-[#f4f7f6] text-slate-800 overflow-hidden font-sans select-none">
      {/* 0. GPS Location Permission on Opening Driver App */}
      <LocationPermissionPrompt
        updatePickupLocation={false}
        onLocationResolved={(coords) => {
          updateDriverLiveCoordinates(coords.lat, coords.lng, 5, 0, 0, true);
          toggleDriverOnline(true);
        }}
      />

      {/* 1. HOME TAB: FULL-SCREEN INTERACTIVE RADAR MAP & CONTROLS */}
      {activeTab === 'home' && (
        <div className="relative w-full h-full flex-1 overflow-hidden">
          {/* Full Bleed Interactive Map */}
          <div className="absolute inset-0 w-full h-full z-0">
            <UnifiedMap height="100%" showSurgeHeatmap={viewMapOverlay} />
          </div>

          {/* TOP FLOATING OVERLAY: Branding + 2 Cards + 2 Location/Weather Pills */}
          <div className="absolute top-0 left-0 right-0 z-20 p-3 sm:p-4 space-y-2 pointer-events-none">
            {/* Top Row: Menu + Wadaage Wordmark + Bell Notifications */}
            <div className="flex items-center justify-between pointer-events-auto">
              <button
                type="button"
                onClick={() => setShowMenuDrawer(true)}
                className="w-10 h-10 rounded-2xl bg-white/95 text-slate-800 shadow-md border border-slate-200/80 flex items-center justify-center hover:bg-white active:scale-95 transition cursor-pointer"
                title="Open Wadaage Driver Menu"
              >
                <Menu className="w-5 h-5 text-slate-800" />
              </button>

              <div className="flex flex-col items-center bg-white/95 backdrop-blur-md px-3.5 py-1 rounded-2xl shadow-md border border-slate-200/80">
                <WadaageLogo variant="wordmark" size="sm" appType="driver" />
                <span className="text-[9px] text-slate-500 font-bold tracking-tight">
                  Safar wadaag, nolol wadaag.
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowNotificationDrawer(true)}
                className="relative w-10 h-10 rounded-2xl bg-white/95 text-slate-800 shadow-md border border-slate-200/80 flex items-center justify-center hover:bg-white active:scale-95 transition cursor-pointer"
                title="Driver Notifications"
              >
                <Bell className="w-5 h-5 text-slate-800" />
                <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
              </button>
            </div>

            {/* Compact Status & Quick Stats Bar (small size, non-obtrusive for maximum map visibility) */}
            <div className="flex items-center justify-between gap-2 pointer-events-auto">
              {/* Small Online/Offline Toggle Pill */}
              <button
                type="button"
                onClick={handleToggleOnline}
                className="bg-white/95 backdrop-blur-md rounded-full px-3 py-1.5 shadow-md border border-slate-200/80 flex items-center space-x-2 active:scale-95 transition hover:bg-white cursor-pointer"
                title="Toggle Driver Online / Offline"
              >
                <div className="relative flex h-2.5 w-2.5 shrink-0">
                  <span
                    className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      driverModeOnline ? 'bg-emerald-500' : 'bg-slate-400'
                    }`}
                  />
                  <span
                    className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                      driverModeOnline ? 'bg-emerald-500' : 'bg-slate-400'
                    }`}
                  />
                </div>
                <span className="text-xs font-black text-slate-900">
                  {driverModeOnline ? 'Online' : 'Offline'}
                </span>
              </button>

              {/* Manual Street Hail Button */}
              {!currentRide && driverModeOnline && (
                <button
                  type="button"
                  onClick={() => setShowStreetHailModal(true)}
                  className="bg-[#008751] hover:bg-[#007445] text-white rounded-full px-3.5 py-1.5 shadow-lg border border-emerald-400/50 flex items-center space-x-1.5 active:scale-95 transition cursor-pointer font-extrabold text-xs"
                  title="Manual Street Hail Order Entry"
                >
                  <Car className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                  <span>+ Street Pickup</span>
                </button>
              )}

              {/* Small Today's Earnings Pill */}
              <button
                type="button"
                onClick={() => setActiveTab('earnings')}
                className="bg-white/95 backdrop-blur-md rounded-full px-3 py-1.5 shadow-md border border-slate-200/80 flex items-center space-x-1.5 active:scale-95 transition hover:bg-white cursor-pointer"
                title="View Today's Earnings"
              >
                <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-xs font-black text-slate-900 font-mono">
                  SLSH {todayEarningsSlsh.toLocaleString()}
                </span>
              </button>

              {/* Small Fuel Level Pill */}
              <button
                type="button"
                onClick={() => setActiveTab('fuel')}
                className="bg-white/95 backdrop-blur-md rounded-full px-3 py-1.5 shadow-md border border-slate-200/80 flex items-center space-x-1.5 active:scale-95 transition hover:bg-white cursor-pointer"
                title="Vehicle Fuel Level"
              >
                <FuelIcon className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-xs font-black text-slate-900 font-mono">
                  {Math.round(fuelPercentage)}%
                </span>
              </button>
            </div>

            {/* Two Location / Weather Pills */}
            <div className="flex items-center justify-between text-[11px] font-bold pointer-events-auto">
              <div className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-full shadow-sm border border-slate-200/70 text-slate-700 flex items-center space-x-1.5">
                <Navigation className="w-3 h-3 text-[#008751]" />
                <span>Hargeisa, Somaliland</span>
              </div>

              <div className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-full shadow-sm border border-slate-200/70 text-slate-700 flex items-center space-x-1.5">
                <Sun className="w-3 h-3 text-amber-500" />
                <span>28°C Hargeisa</span>
              </div>
            </div>

            {/* Live GPS status - reassures the driver that location keeps reporting when the phone sleeps */}
            {driverModeOnline && (
              <div
                className={`pointer-events-auto rounded-2xl px-3 py-1.5 shadow-md border flex items-center justify-between text-[11px] font-bold ${
                  driverGpsStatus.active
                    ? 'bg-emerald-500/95 border-emerald-300 text-white'
                    : 'bg-amber-500/95 border-amber-300 text-white'
                }`}
                title={
                  nativeGpsActive
                    ? 'Background location service is running. Your location keeps updating even when the phone is locked.'
                    : 'Live location is reporting while the app is open.'
                }
              >
                <div className="flex items-center space-x-1.5 min-w-0">
                  <span className="relative flex h-2 w-2 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                  </span>
                  <Crosshair className="w-3 h-3 shrink-0" />
                  <span className="truncate">
                    {driverGpsStatus.active ? 'Live GPS: receiving' : 'Live GPS: waiting...'}
                  </span>
                </div>
                <span className="shrink-0 ml-2 px-1.5 py-0.5 rounded-md bg-white/25 text-[9.5px] font-black uppercase tracking-wide">
                  {nativeGpsActive ? 'Screen-off ON' : 'App only'}
                </span>
              </div>
            )}

            {/* Dismissible KYC banner if not verified */}
            {!isKycApproved && !dismissKycBanner && (
              <div className="pointer-events-auto bg-amber-50/95 backdrop-blur-md border border-amber-300 rounded-2xl p-2.5 shadow-md flex items-center justify-between text-xs text-slate-800">
                <div className="flex items-center space-x-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="text-[11px] font-bold">
                    {isKycPending ? 'KYC Approval Pending' : 'KYC Verification Required'}
                  </span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => setShowKycModal(true)}
                    className="px-2 py-0.5 bg-amber-400 hover:bg-amber-300 font-bold rounded-lg text-[10px] text-slate-950 cursor-pointer"
                  >
                    Details
                  </button>
                  <button
                    onClick={() => setDismissKycBanner(true)}
                    className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* MAP FLOATING CONTROLS ON RIGHT */}
          <div className="absolute right-3 top-36 z-20 flex flex-col space-y-2 pointer-events-auto">
            {/* Dedicated Interactive Full Map / Khariidad Buuxda Toggle */}
            <button
              type="button"
              onClick={() => {
                setIsFullMapMode((prev) => !prev);
                setShowDetailsDrawer(false);
              }}
              className={`w-10 h-10 rounded-2xl backdrop-blur-md shadow-md border flex flex-col items-center justify-center active:scale-95 transition cursor-pointer ${
                isFullMapMode
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-500/30'
                  : 'bg-white/95 text-slate-700 border-slate-200/80 hover:bg-white'
              }`}
              title={isFullMapMode ? 'Khariidad Buuxda (Full Map Active) - Taabo si aad u aragto faahfaahin' : 'Daar Khariidad Buuxda (Full Map View)'}
            >
              <Map className="w-4 h-4" />
              <span className="text-[7px] font-black uppercase tracking-tighter mt-0.5">
                {isFullMapMode ? 'Full' : 'Map'}
              </span>
            </button>

            {/* Clean Map / Live Waze Navigation Toggle */}
            <button
              type="button"
              onClick={() => {
                const nextState = !cleanMapNavMode;
                setCleanMapNavMode(nextState);
                if (nextState) {
                  voiceNavigationService.speak('Clean Map Navigation mode enabled. Real-time guidance active.', 'en');
                }
              }}
              className={`w-10 h-10 rounded-2xl backdrop-blur-md shadow-md border flex items-center justify-center active:scale-95 transition cursor-pointer ${
                cleanMapNavMode ? 'bg-blue-600 text-white border-blue-500 shadow-blue-500/30' : 'bg-white/95 text-slate-700 border-slate-200/80 hover:bg-white'
              }`}
              title="Toggle Clean Map Real-Time Navigation (Waze Style)"
            >
              <Navigation className="w-5 h-5" />
            </button>

            {/* Voice Mute / Unmute Toggle */}
            <button
              type="button"
              onClick={() => {
                const muted = voiceNavigationService.toggleMute();
                setIsVoiceMuted(muted);
                if (!muted) {
                  voiceNavigationService.speak('Voice guidance unmuted', 'en', true);
                }
              }}
              className={`w-10 h-10 rounded-2xl backdrop-blur-md shadow-md border flex items-center justify-center active:scale-95 transition cursor-pointer ${
                !isVoiceMuted ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-white/95 text-slate-700 border-slate-200/80 hover:bg-white'
              }`}
              title={isVoiceMuted ? 'Unmute Navigation Voice' : 'Mute Navigation Voice'}
            >
              {!isVoiceMuted ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-slate-400" />}
            </button>

            <button
              type="button"
              onClick={() => recalibrateDriverGps()}
              className="w-10 h-10 rounded-2xl bg-white/95 backdrop-blur-md text-slate-700 shadow-md border border-slate-200/80 flex items-center justify-center hover:bg-white active:scale-95 transition cursor-pointer"
              title="Live GPS Recenter"
            >
              <Crosshair className="w-5 h-5 text-[#008751]" />
            </button>

            <button
              type="button"
              onClick={() => setViewMapOverlay(!viewMapOverlay)}
              className={`w-10 h-10 rounded-2xl backdrop-blur-md shadow-md border flex items-center justify-center active:scale-95 transition cursor-pointer ${
                viewMapOverlay ? 'bg-[#008751] text-white border-emerald-600' : 'bg-white/95 text-slate-700 border-slate-200/80 hover:bg-white'
              }`}
              title="Toggle Radar Heatmap Overlay"
            >
              <Layers className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => {}}
              className="w-10 h-10 rounded-2xl bg-white/95 backdrop-blur-md text-slate-700 shadow-md border border-slate-200/80 flex items-center justify-center hover:bg-white active:scale-95 transition cursor-pointer"
              title="Compass North"
            >
              <Compass className="w-5 h-5 text-slate-700" />
            </button>
          </div>

          {/* CLEAN MAP REAL-TIME NAVIGATION TOP BANNER & FLOATING ACTION SIDEBAR */}
          {cleanMapNavMode && currentRide && (currentRide.status === 'accepted' || currentRide.status === 'driver_arrived' || currentRide.status === 'in_progress') && (
            <div className="absolute inset-0 z-30 pointer-events-none flex flex-col justify-between p-3 sm:p-4">
              {/* TOP WAZE-STYLE LIVE DIRECTION BANNER */}
              <div className="pointer-events-auto bg-slate-900/95 backdrop-blur-md text-white rounded-3xl p-3.5 shadow-2xl border border-slate-700/80 flex items-center justify-between gap-3 animate-slideDown">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-blue-600/30">
                    <Navigation className="w-6 h-6 animate-pulse" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-black uppercase tracking-wider bg-blue-500/30 text-blue-300 px-2 py-0.5 rounded-full border border-blue-400/30">
                        {currentRide.status === 'accepted' ? 'Pickup Navigation' : currentRide.status === 'driver_arrived' ? 'At Pickup' : 'Dropoff Navigation'}
                      </span>
                      <span className="text-xs font-mono font-extrabold text-amber-400">
                        {currentRide.durationMins || 8} min ({currentRide.distanceKm || 3.2} km)
                      </span>
                    </div>
                    <h4 className="font-extrabold text-sm text-white truncate mt-0.5">
                      {currentRide.status === 'in_progress' ? (currentRide.dropoff?.name || 'Destination') : (currentRide.pickup?.name || 'Pickup Point')}
                    </h4>
                    <p className="text-[11px] text-slate-300 truncate font-semibold">
                      {currentRide.status === 'accepted'
                        ? 'In 200m turn right onto Wadada Wadnaha toward pickup.'
                        : currentRide.status === 'driver_arrived'
                        ? 'Arrived. Waiting for passenger to enter vehicle.'
                        : 'Head straight on Independence Ave toward destination.'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col space-y-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const muted = voiceNavigationService.toggleMute();
                      setIsVoiceMuted(muted);
                    }}
                    className={`p-2 rounded-xl text-xs font-bold transition flex items-center space-x-1 ${
                      !isVoiceMuted ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {!isVoiceMuted ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCleanMapNavMode(false)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* BOTTOM FLOATING SLEEK SIDEBAR CONTROLS (Maximizing Map View) */}
              <div className="pointer-events-auto bg-slate-900/95 backdrop-blur-md text-white rounded-3xl p-3 shadow-2xl border border-slate-700/80 flex items-center justify-between gap-2 max-w-lg mx-auto w-full">
                <div className="flex items-center space-x-2 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-[#008751] text-white font-black flex items-center justify-center text-xs shrink-0 shadow">
                    {currentRide.passengerName?.charAt(0) || 'P'}
                  </div>
                  <div className="min-w-0">
                    <span className="font-extrabold text-xs text-white block truncate">{currentRide.passengerName}</span>
                    <span className="text-[10px] text-emerald-400 font-mono font-bold">${(Number(currentRide.totalFare) || 0).toFixed(2)} USD</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowChatModal(true)}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 transition"
                    title="Chat with Passenger"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowCallPassengerModal(true)}
                    className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition"
                    title="Call Passenger"
                  >
                    <PhoneCall className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      sounds.playButtonClick();
                      advanceDriverRideState();
                    }}
                    className="py-2.5 px-4 rounded-2xl bg-[#008751] hover:bg-[#007345] text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-[#008751]/30 transition active:scale-95 flex items-center space-x-1.5"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>
                      {currentRide.status === 'accepted' ? 'Arrived at Pickup' : currentRide.status === 'driver_arrived' ? 'Start Trip' : 'Complete Trip'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* RIDE SLIDE-UP OVERLAYS CONTAINER (When incoming request or active ride) */}
          <div className="absolute bottom-3 left-3 right-3 z-30 max-h-[75vh] overflow-y-auto pointer-events-auto space-y-3">







        {/* 5. SECTION: "New Upcoming Ride" */}
        <div className="space-y-2.5 pt-1">
          {(!currentRide || currentRide.status === 'searching' || currentRide.status === 'idle') && (
            <div className="flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-black text-slate-900 font-sans">
                New Upcoming Ride
              </h3>
              {incomingDriverRequest && (
                <span className="text-[10px] font-mono font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 animate-pulse">
                  {requestTimer}s auto-expire
                </span>
              )}
            </div>
          )}

          {/* On-Route Second Rider (Passenger B) Dispatch Overlay ONLY if Driver is in a Wadaage Share trip with 1 rider */}
          {incomingDriverRequest &&
            currentRide &&
            incomingDriverRequest.id !== currentRide.id &&
            currentRide.category === 'wadaage_share' &&
            currentRide.isShared &&
            !currentRide.coPassenger &&
            !currentRide.stackedRide &&
            currentRide.status !== 'completed' &&
            currentRide.status !== 'cancelled' &&
            (currentRide.status === 'accepted' || currentRide.status === 'driver_arrived' || currentRide.status === 'in_progress') && (
            <div className="bg-gradient-to-br from-amber-500/15 via-emerald-500/10 to-teal-500/15 border-2 border-emerald-500 rounded-3xl p-4 sm:p-5 shadow-xl space-y-3.5 animate-bounce-short">
              {/* Notification Banner */}
              <div className="bg-emerald-600 text-white px-3 py-2 rounded-2xl flex items-center gap-2 shadow-sm">
                <Sparkles className="w-4 h-4 shrink-0 animate-pulse text-amber-300" />
                <span className="text-xs font-bold leading-tight">
                  New Rider nearby going your way (1.5km away, similar destination).
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-[#008751] text-white font-black flex items-center justify-center shadow">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-300">
                      ⚡ Wadaage Double-Check Matched
                    </span>
                    <h4 className="font-extrabold text-sm text-slate-900 mt-0.5">
                      {incomingDriverRequest.passengerName || 'Co-Passenger B'}
                    </h4>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-base font-black text-emerald-700 font-mono">
                    +${(Number(incomingDriverRequest.totalFare) || 1.50).toFixed(2)} USD
                  </div>
                  <span className="text-[10px] text-emerald-800 font-bold">
                    +16,875 SLSH Extra Profit
                  </span>
                </div>
              </div>

              {/* Route snippet & Double Check verification */}
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-3 border border-emerald-200 text-xs space-y-2">
                <div className="flex items-center space-x-2 text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0" />
                  <span className="font-bold truncate">Pickup: {incomingDriverRequest.pickup?.name || 'Pickup Location'}</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
                  <span className="font-bold truncate">Dropoff: {incomingDriverRequest.dropoff?.name || 'Dropoff Destination'}</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[10px] text-slate-600 pt-2 border-t border-slate-100">
                  <div className="bg-emerald-50 text-emerald-900 px-2 py-1 rounded-lg font-semibold border border-emerald-200 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>Pickup: <b>&le; 1.5 km GPS</b></span>
                  </div>
                  <div className="bg-emerald-50 text-emerald-900 px-2 py-1 rounded-lg font-semibold border border-emerald-200 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>Destination: <b>&le; 2.0 km</b></span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => declineRideByDriver()}
                  className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs uppercase tracking-wider transition active:scale-95 flex items-center justify-center gap-1"
                >
                  <X className="w-4 h-4" />
                  <span>Pass</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    notificationService.stopEmergencyOrderRingtone();
                    sounds.playButtonClick();
                    acceptRideByDriver();
                  }}
                  className="py-2.5 px-3 rounded-xl bg-[#008751] hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/30 transition active:scale-95 flex items-center justify-center gap-1"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Accept Rider B</span>
                </button>
              </div>
            </div>
          )}

          {/* Incoming Dispatch Card & Interactive BottomSheet (Pulsing, 30s rule countdown, Slide-To-Accept) */}
          {(!currentRide || currentRide.status === 'searching' || currentRide.status === 'idle' || currentRide.status === 'cancelled' || currentRide.status === 'completed') &&
          incomingDriverRequest ? (
            (() => {
              const req = incomingDriverRequest;
              const radiusCheck = isOrderWithinDriverDispatchRadius(req);
              const isShareOrder = req.category === 'wadaage_share' || req.isShared;

              return (
                <>
                  {/* Interactive Pulsing BottomSheet for New Order */}
                  <BottomSheet
                    isOpen={true}
                    pulsingBorder={true}
                    showBackdrop={true}
                    closeOnBackdropClick={false}
                    headerContent={
                      <div className="flex items-center justify-between px-2 pt-1">
                        <div className="flex items-center gap-2">
                          <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#008751]"></span>
                          </span>
                          <span className="text-xs font-black uppercase tracking-widest text-emerald-800 dark:text-emerald-300">
                            DALAB CUSUB • NEW ORDER
                          </span>
                        </div>
                        {/* 30-Second Rule Timer Badge */}
                        <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full text-amber-600 dark:text-amber-400">
                          <Clock className="w-3.5 h-3.5 animate-spin" />
                          <span className="text-xs font-black font-mono">{requestTimer}s</span>
                        </div>
                      </div>
                    }
                  >
                    <div className="space-y-4 pb-2">
                      {/* Passenger Profile & Fare Banner */}
                      <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/80 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-700">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-black flex items-center justify-center text-lg shadow-md">
                            {req.passengerName?.charAt(0) || 'P'}
                          </div>
                          <div>
                            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                              {req.passengerName || 'Rakaab Wadaage'}
                            </h4>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                                isShareOrder
                                  ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}>
                                {isShareOrder ? '👥 Wadaage Share' : '🚖 Taxi Gaar ah (Private)'}
                              </span>
                              <span className="text-[10px] font-bold text-slate-500">
                                📍 {radiusCheck.distanceKm} km
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-xl font-black text-[#008751] font-mono">
                            {formatCurrency(req.totalFare || 2.50)}
                          </div>
                          <div className="text-[10px] text-slate-500 font-bold">
                            ${(Number(req.totalFare) || 2.50).toFixed(2)} USD
                          </div>
                        </div>
                      </div>

                      {/* Route Landmarks */}
                      <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-3.5 border border-slate-100 dark:border-slate-700 space-y-2">
                        <div className="flex items-start space-x-2.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-slate-900 dark:bg-slate-100 mt-1 shrink-0" />
                          <div className="text-xs">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Kaqabasho (Pickup)</span>
                            <span className="font-extrabold text-slate-800 dark:text-slate-100">
                              {req.pickup?.name || 'Hargeisa Central'}
                            </span>
                          </div>
                        </div>
                        <div className="border-l-2 border-dashed border-slate-300 dark:border-slate-600 ml-1 h-3 my-0.5" />
                        <div className="flex items-start space-x-2.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-[#008751] mt-1 shrink-0" />
                          <div className="text-xs">
                            <span className="text-[10px] uppercase font-bold text-emerald-600 block">Kadhigid (Dropoff)</span>
                            <span className="font-extrabold text-slate-800 dark:text-slate-100">
                              {req.dropoff?.name || 'Madaarka Cigaal'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Direct Single-Touch Accept Button (No Sliding) */}
                      <div className="pt-1">
                        <button
                          type="button"
                          disabled={isAcceptingOrder}
                          onClick={async () => {
                            notificationService.stopEmergencyOrderRingtone();
                            sounds.playButtonClick();
                            try {
                              if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                                navigator.vibrate([30, 20, 30]);
                              }
                            } catch (_e) {}
                            setIsAcceptingOrder(true);
                            try {
                              await acceptRideByDriver(currentUser?.id);
                            } finally {
                              setIsAcceptingOrder(false);
                            }
                          }}
                          className="w-full py-4 px-4 rounded-2xl bg-[#008751] hover:bg-[#007445] active:bg-[#006038] text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-[#008751]/30 transition active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer touch-manipulation select-none disabled:opacity-75 disabled:cursor-not-allowed"
                        >
                          <Check className="w-5 h-5 stroke-[3]" />
                          <span>{isAcceptingOrder ? 'AQBALAYA... (ACCEPTING)' : `AQBAL DALABKA • ACCEPT (${requestTimer}s)`}</span>
                        </button>
                      </div>

                      {/* Secondary Actions: DIID (Reject) & WAREEJI (Transfer) */}
                      <div className={`grid ${(!currentRide || currentRide.status === 'searching' || currentRide.status === 'idle') ? 'grid-cols-2' : 'grid-cols-1'} gap-3 pt-1`}>
                        <button
                          type="button"
                          onClick={() => {
                            notificationService.stopEmergencyOrderRingtone();
                            sounds.playButtonClick();
                            declineRideByDriver();
                          }}
                          className="py-3 px-4 rounded-2xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:hover:bg-rose-900/80 text-rose-700 dark:text-rose-300 border-2 border-rose-300 dark:border-rose-700 font-black text-xs uppercase tracking-wider transition active:scale-95 flex items-center justify-center space-x-2 shadow-sm cursor-pointer"
                        >
                          <X className="w-5 h-5 text-rose-600 stroke-[2.5]" />
                          <div className="flex flex-col text-left">
                            <span className="text-sm font-black tracking-wide">DIID</span>
                            <span className="text-[9px] text-rose-500 font-normal">Reject Request</span>
                          </div>
                        </button>

                        {(!currentRide || currentRide.status === 'searching' || currentRide.status === 'idle') && (
                          <button
                            type="button"
                            onClick={() => setShowTransferModal(true)}
                            className="py-3 px-4 rounded-2xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/60 dark:hover:bg-amber-900/80 text-amber-800 dark:text-amber-300 border-2 border-amber-300 dark:border-amber-700 font-black text-xs uppercase tracking-wider transition active:scale-95 flex items-center justify-center space-x-2 shadow-sm cursor-pointer"
                          >
                            <RotateCw className="w-5 h-5 text-amber-600 stroke-[2.5]" />
                            <div className="flex flex-col text-left">
                              <span className="text-sm font-black tracking-wide">WAREEJI</span>
                              <span className="text-[9px] text-amber-600 font-normal">Transfer to Driver</span>
                            </div>
                          </button>
                        )}
                      </div>
                    </div>
                  </BottomSheet>
                </>
              );
            })()
          ) : currentRide && currentRide.status === 'completed' ? (
            /* Completed Trip Summary & Earnings Collection Card */
            <div className="bg-white rounded-3xl p-5 shadow-lg border-2 border-emerald-500 relative overflow-hidden space-y-4 animate-fadeIn">
              <div className="text-center space-y-1">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-[#008751] flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-black text-slate-900 mt-2">
                  Safarkii Wuu Dhamaaday!
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Trip Completed & Fares Successfully Collected
                </p>
              </div>

              {/* Earnings & Fare Details Box */}
              <div className="bg-emerald-50/80 rounded-2xl p-4 border border-emerald-200 space-y-2.5">
                <div className="flex items-center justify-between text-xs border-b border-emerald-200/60 pb-2">
                  <span className="text-slate-600 font-medium">Primary Rider (A):</span>
                  <span className="font-bold text-slate-900">{currentRide.passengerName}</span>
                </div>
                {currentRide.coPassenger && (
                  <div className="flex items-center justify-between text-xs border-b border-emerald-200/60 pb-2">
                    <span className="text-slate-600 font-medium">Co-Passenger (B):</span>
                    <span className="font-bold text-slate-900">{currentRide.coPassenger?.name || 'Co-Passenger'}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-xs border-b border-emerald-200/60 pb-2">
                  <span className="text-slate-600 font-medium">Payment Method:</span>
                  <span className="font-extrabold text-[#008751] uppercase">{currentRide.paymentMethod}</span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <span className="text-[11px] uppercase font-black tracking-wider text-slate-500 block">
                      Wadarta Lacagta (Total Fare)
                    </span>
                    <span className="text-xs font-bold text-slate-600">
                      {Math.round(((Number(currentRide.totalFare) || 0) + (Number(currentRide.stackedProfitUsd) || (currentRide.coPassenger ? Number(currentRide.coPassenger.fare) || 0 : 0))) * EXCHANGE_RATE_USD_TO_SLSH).toLocaleString()} SLSH
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-[#008751] font-mono">
                      ${((Number(currentRide.totalFare) || 0) + (Number(currentRide.stackedProfitUsd) || (currentRide.coPassenger ? Number(currentRide.coPassenger.fare) || 0 : 0))).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Real Platform Commission Deduction & Updated Balance Breakdown */}
                <div className="pt-2 border-t border-emerald-200/80 space-y-2">
                  <div className="flex items-center justify-between bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-xs">
                    <div>
                      <span className="font-extrabold text-amber-900 block">Komishanka Wadaage (Commission Deducted)</span>
                      <span className="text-[10px] text-amber-700">Automatic deduction per completed trip</span>
                    </div>
                    <span className="font-mono font-black text-rose-600 text-sm">-1,000 SLSH (-$0.10)</span>
                  </div>

                  <div className="flex items-center justify-between bg-slate-900 text-white p-3 rounded-xl shadow-inner">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                        Haraagaaga Cusub (Real Driver Balance)
                      </span>
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        {Math.round(driverWalletBalanceUsd * EXCHANGE_RATE_USD_TO_SLSH).toLocaleString()} SLSH
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-mono font-black text-lg text-emerald-400">
                        ${driverWalletBalanceUsd.toFixed(2)} USD
                      </span>
                      <span className="block text-[9px] text-emerald-300 font-bold uppercase tracking-wider">
                        {driverWalletBalanceUsd >= 0.10 ? '✓ Live Active' : '⚠ Low Balance'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Return to Radar / Accept Next Order Button */}
              <button
                type="button"
                onClick={resetRideState}
                className="w-full py-4 px-4 rounded-2xl bg-[#008751] hover:bg-[#007445] text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-600/30 transition active:scale-95 flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                <span>Dhammee & Ku Noqo Radar-ka (Ready for Next Order)</span>
              </button>
            </div>
          ) : currentRide && currentRide.status !== 'searching' && currentRide.status !== 'idle' ? (
            isFullMapMode && !showDetailsDrawer ? (
              /* STREAMLINED LOW-PROFILE COMPACT ACTIVE TRIP HUD (Unobstructed Full-Bleed Map) */
              <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-3xl border border-slate-200/90 dark:border-slate-800 p-3.5 shadow-2xl space-y-2.5 animate-in fade-in slide-in-from-bottom-2">
                {/* Milestone row & Expand Faahfaahin drawer toggle */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center space-x-2 min-w-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
                    <div className="min-w-0">
                      <span className="text-xs font-black text-slate-900 dark:text-white truncate block">
                        {currentRide.status === 'accepted' && `📍 Kaqabasho: ${currentRide.pickup?.name || 'Pickup Point'}`}
                        {currentRide.status === 'driver_arrived' && '🏁 Goobta Gaadhay • Sugaya Rakaabka'}
                        {currentRide.status === 'in_progress' && `🚗 Kadhigid: ${currentRide.dropoff?.name || 'Destination'}`}
                      </span>
                      <span className="text-[10px] text-slate-500 truncate block">
                        {currentRide.coPassenger ? '⚡ 2-Rider Wadaage Carpool' : (currentRide.categoryName || 'Wadaage')} • PIN: <b className="font-mono text-emerald-600 dark:text-emerald-400">{currentRide.otpCode || '4912'}</b>
                      </span>
                    </div>
                  </div>

                  {/* Expandable Faahfaahin (Details) button */}
                  <button
                    type="button"
                    onClick={() => setShowDetailsDrawer(true)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 text-xs font-black flex items-center space-x-1 shrink-0 active:scale-95 transition shadow-xs cursor-pointer"
                    title="Faahfaahin Safarka / View Full Trip Breakdown"
                  >
                    <span>Faahfaahin</span>
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Carpool Rider Switcher (if dual carpool) */}
                {currentRide.coPassenger && (
                  <div className="grid grid-cols-2 gap-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl text-xs">
                    <button
                      type="button"
                      onClick={() => setActiveCarpoolRider('A')}
                      className={`py-1.5 px-2 rounded-xl font-black text-center transition ${
                        activeCarpoolRider === 'A'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-white/50'
                      }`}
                    >
                      <span>Rider A: {currentRide.passengerName?.split(' ')[0] || 'A'}</span>
                      <span className="block text-[10px] font-mono opacity-90">${(Number(currentRide.totalFare) || 0).toFixed(2)}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveCarpoolRider('B')}
                      className={`py-1.5 px-2 rounded-xl font-black text-center transition ${
                        activeCarpoolRider === 'B'
                          ? 'bg-teal-600 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-300 hover:bg-white/50'
                      }`}
                    >
                      <span>Rider B: {currentRide.coPassenger?.name?.split(' ')[0] || 'B'}</span>
                      <span className="block text-[10px] font-mono opacity-90">${(Number(currentRide.coPassenger?.fare) || 1.50).toFixed(2)}</span>
                    </button>
                  </div>
                )}

                {/* Passenger Avatar, Name, 4.9 Rating & Fares */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-[#008751] text-white font-bold flex items-center justify-center text-sm shadow shrink-0">
                      {(activeCarpoolRider === 'B' && currentRide.coPassenger ? currentRide.coPassenger.name : currentRide.passengerName)?.charAt(0) || 'P'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-black text-slate-900 dark:text-white truncate">
                          {activeCarpoolRider === 'B' && currentRide.coPassenger ? currentRide.coPassenger.name : currentRide.passengerName}
                        </span>
                        <span className="flex items-center text-[10px] font-bold text-amber-500 shrink-0">
                          ★ 4.9
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-medium truncate">
                        {activeCarpoolRider === 'B' && currentRide.coPassenger
                          ? `Dropoff: ${currentRide.coPassenger.dropoffLocation?.name || 'Destination'}`
                          : `Dropoff: ${currentRide.dropoff?.name || 'Destination'}`}
                      </div>
                    </div>
                  </div>

                  {/* Fares in USD & SLSH */}
                  <div className="text-right shrink-0">
                    <div className="text-sm font-black text-[#008751] font-mono">
                      ${(
                        currentRide.coPassenger
                          ? (Number(currentRide.totalFare) || 0) + (Number(currentRide.coPassenger.fare) || 0)
                          : Number(currentRide.totalFare) || 0
                      ).toFixed(2)} USD
                    </div>
                    <div className="text-[9px] text-slate-400 font-medium">
                      {Math.round(
                        (currentRide.coPassenger
                          ? (Number(currentRide.totalFare) || 0) + (Number(currentRide.coPassenger.fare) || 0)
                          : Number(currentRide.totalFare) || 0) * EXCHANGE_RATE_USD_TO_SLSH
                      ).toLocaleString()} SLSH
                    </div>
                  </div>
                </div>

                {/* 1-Tap Quick Actions Bar: Chat, Call, Transfer, SOS */}
                <div className="grid grid-cols-4 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowChatModal(true)}
                    className="relative py-2 px-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[11px] flex items-center justify-center space-x-1 transition active:scale-95 cursor-pointer"
                    title="Sheeko / In-App Chat"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Chat</span>
                    {unreadChatCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] font-black flex items-center justify-center animate-pulse">
                        {unreadChatCount}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowCallPassengerModal(true)}
                    className="py-2 px-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-[11px] flex items-center justify-center space-x-1 transition active:scale-95 cursor-pointer"
                    title="Wac / Phone Call"
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-blue-600" />
                    <span>Wac</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowTransferModal(true)}
                    className="py-2 px-1 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold text-[11px] flex items-center justify-center space-x-1 transition active:scale-95 border border-amber-200 dark:border-amber-800 cursor-pointer"
                    title="Wareeji / Transfer Ride"
                  >
                    <RotateCw className="w-3.5 h-3.5 text-amber-600" />
                    <span>Wareeji</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowSosModal(true)}
                    className="py-2 px-1 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-bold text-[11px] flex items-center justify-center space-x-1 transition active:scale-95 border border-rose-200 dark:border-rose-800 cursor-pointer"
                    title="Xaalad Degdeg / Emergency SOS"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                    <span>SOS</span>
                  </button>
                </div>

                {/* Prominent Touch-Friendly Primary Milestone Action Button */}
                <div className="pt-1.5 space-y-2">
                  {currentRide.coPassenger ? (
                    <button
                      type="button"
                      id="driver-btn-carpool-action"
                      onClick={() => {
                        try {
                          if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                            navigator.vibrate([40, 30, 40]);
                          }
                        } catch (_e) {}
                        sounds.playButtonClick();
                        if (activeCarpoolRider === 'A') {
                          if (currentRide.status === 'accepted') advanceIndividualRiderAction('RIDER_A', 'arrived');
                          else if (currentRide.status === 'driver_arrived') advanceIndividualRiderAction('RIDER_A', 'pickup');
                          else advanceIndividualRiderAction('RIDER_A', 'dropoff');
                        } else {
                          const coStatus = currentRide.coPassenger?.status;
                          if (!coStatus || coStatus === 'matched') advanceIndividualRiderAction('RIDER_B', 'arrived');
                          else if (coStatus === 'picking_up') advanceIndividualRiderAction('RIDER_B', 'pickup');
                          else advanceIndividualRiderAction('RIDER_B', 'dropoff');
                        }
                      }}
                      className="w-full min-h-[58px] py-4 px-4 rounded-2xl bg-[#008751] hover:bg-[#007445] active:bg-[#006038] text-white font-black text-sm uppercase tracking-wider shadow-xl shadow-emerald-700/40 border-2 border-emerald-400/50 transition-all duration-150 active:scale-[0.98] flex items-center justify-center gap-3 cursor-pointer touch-manipulation select-none"
                    >
                      <CheckCircle className="w-5 h-5 shrink-0" />
                      <span className="text-center font-black">
                        {activeCarpoolRider === 'A'
                          ? currentRide.status === 'accepted'
                            ? '📍 GAADHAY GOOBTA (Rider A Arrived)'
                            : currentRide.status === 'driver_arrived'
                            ? '🚗 BILOW SAFARKA (Start Rider A)'
                            : '✅ DHAMMEE SAFARKA (Complete Rider A)'
                          : currentRide.coPassenger?.status === 'picking_up'
                          ? '🚗 BILOW SAFARKA (Start Rider B)'
                          : currentRide.coPassenger?.status === 'picked_up'
                          ? '✅ DHAMMEE SAFARKA (Complete Rider B)'
                          : '📍 GAADHAY GOOBTA (Rider B Arrived)'}
                      </span>
                    </button>
                  ) : (
                    <>
                      {/* Live On-Road Digital Taximeter HUD (Visible during in_progress trip) */}
                      {currentRide.status === 'in_progress' && (
                        <div className={`p-3.5 bg-slate-900 border-2 rounded-2xl text-white space-y-2.5 shadow-lg ${currentRide.isLiveTaximeter ? 'border-emerald-500/60' : 'border-slate-700'}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                              </span>
                              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400">
                                📟 {currentRide.isLiveTaximeter ? 'Live Taximeter Running' : 'Trip Meter'}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                              ⏱️ {Math.floor(liveMeterSeconds / 60)}m {liveMeterSeconds % 60}s
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-2 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-slate-400 block">Distance Travelled</span>
                              <span className="text-base font-black text-white font-mono">
                                {displayedMeterKm.toFixed(2)} KM
                              </span>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] uppercase font-bold text-slate-400 block">Live Fare</span>
                              <span className="text-base font-black text-emerald-400 font-mono">
                                {liveCalculatedFareSlsh.toLocaleString()} SLSH
                              </span>
                              <span className="text-[10px] text-slate-400 block font-bold">
                                (${liveCalculatedFareUsd.toFixed(2)} USD)
                              </span>
                            </div>
                          </div>

                          <div className="text-[9.5px] text-slate-400 flex items-center justify-between pt-0.5">
                            <span>1st KM: 12,000 SLSH ($1.20)</span>
                            <span>Extra KM: +7,000 SLSH/km</span>
                          </div>

                          {currentRide.isLiveTaximeter && (
                            <div className={`text-[9.5px] font-bold rounded-lg px-2 py-1 border ${
                              isLiveMeterRunning
                                ? 'text-emerald-300 bg-emerald-950/50 border-emerald-500/30'
                                : 'text-amber-300 bg-amber-950/40 border-amber-500/30'
                            }`}>
                              {isLiveMeterRunning
                                ? (displayedMeterKm <= 1.0
                                    ? `✅ Meter on: 12,000 SLSH • 1st KM included (${displayedMeterKm.toFixed(2)} KM)`
                                    : `✅ Meter counting: 12,000 + ${Math.max(0, displayedMeterKm - 1).toFixed(2)} extra KM x 7,000 SLSH`)
                                : '⏳ Sugeysaa GPS-ka... Meter-ku wuxuu bilaabmi doonaa marka GPS la helo'}
                            </div>
                          )}
                        </div>
                      )}

                      {/* 1-Touch Waiting Time Meter (500 SLSH / minute) */}
                      {(currentRide.status === 'driver_arrived' || currentRide.status === 'in_progress') && (
                        <WaitingTimeMeter isDriverView={true} />
                      )}

                      <button
                        type="button"
                        id="driver-btn-primary-ride-action"
                        onClick={(e) => {
                          e.stopPropagation();
                          try {
                            if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                              navigator.vibrate([40, 30, 40]);
                            }
                          } catch (_e) {}
                          sounds.playButtonClick();

                          if (currentRide.status === 'in_progress') {
                            const finalDist = Number(displayedMeterKm.toFixed(2));
                            const meterExtraKm = Math.max(0, finalDist - 1.0);
                            // Meter fare = 12,000 SLSH flag drop + 7,000 SLSH per extra KM
                            const meterFareSlshFinal = Math.round(12000 + meterExtraKm * 7000);
                            const meterFareUsd = Math.round((meterFareSlshFinal / EXCHANGE_RATE_USD_TO_SLSH) * 100) / 100;
                            
                            // 1. Separate Dropoff Trip Fare
                            const isShare = currentRide.category === 'wadaage_share' || currentRide.isShared;
                            const ratePerKm = isShare ? 0.40 : 0.80;
                            const dropoffFareUsd = currentRide.isLiveTaximeter
                              ? meterFareUsd
                              : Number((Number(currentRide.baseFare || 1.20) + (Number(currentRide.distanceKm || 1) * ratePerKm) - Number(currentRide.discountAmount || 0)).toFixed(2));
                            const dropoffFareSlsh = currentRide.isLiveTaximeter
                              ? meterFareSlshFinal
                              : Math.round(dropoffFareUsd * EXCHANGE_RATE_USD_TO_SLSH);

                            // 2. Separate Waiting Time Fee (500 SLSH / minute)
                            const waitingSecs = Number(currentRide.waitingSeconds || 0);
                            const waitingMinutes = currentRide.waitingMinutes || (waitingSecs > 0 ? Math.ceil(waitingSecs / 60) : 0);
                            const waitingFeeSlsh = currentRide.waitingFeeSlsh !== undefined ? currentRide.waitingFeeSlsh : waitingMinutes * 500;
                            const waitingFeeUsd = currentRide.waitingFeeUsd !== undefined ? Number(currentRide.waitingFeeUsd) : Number((waitingFeeSlsh / EXCHANGE_RATE_USD_TO_SLSH).toFixed(2));

                            // 3. Final Total Adding Both
                            const totalUsd = Math.round((dropoffFareUsd + waitingFeeUsd) * 100) / 100;
                            const totalSlsh = Math.round(dropoffFareSlsh + waitingFeeSlsh);

                            setCompletedTripSummary({
                              distanceKm: finalDist,
                              durationMins: Math.max(1, Math.ceil(liveMeterSeconds / 60)),
                              dropoffFareUsd,
                              dropoffFareSlsh,
                              waitingMinutes,
                              waitingFeeUsd,
                              waitingFeeSlsh,
                              totalFareUsd: totalUsd,
                              totalFareSlsh: totalSlsh,
                              paymentMethod: currentRide.paymentMethod || 'cash',
                              passengerName: currentRide.passengerName || 'Passenger',
                            });
                            setShowTripSummaryModal(true);
                          } else {
                            advanceDriverRideState();
                          }
                        }}
                        className={`w-full min-h-[58px] py-3.5 px-4 rounded-2xl text-white font-black text-sm uppercase tracking-wider shadow-xl transition-all duration-150 active:scale-[0.98] flex items-center justify-center gap-3 cursor-pointer touch-manipulation select-none border-2 ${
                          currentRide.status === 'accepted'
                            ? 'bg-[#008751] hover:bg-[#007445] active:bg-[#006038] border-emerald-400/60 shadow-emerald-700/40 ring-4 ring-emerald-500/20'
                            : currentRide.status === 'driver_arrived'
                            ? 'bg-[#0066f5] hover:bg-[#0052c2] active:bg-[#00419e] border-blue-300/60 shadow-blue-700/40'
                            : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 border-emerald-300/60 shadow-emerald-700/40'
                        }`}
                      >
                        {currentRide.status === 'accepted' ? (
                          <MapPin className="w-6 h-6 shrink-0 animate-bounce text-emerald-100" />
                        ) : currentRide.status === 'driver_arrived' ? (
                          <Car className="w-6 h-6 shrink-0 text-blue-100" />
                        ) : (
                          <CheckCircle className="w-6 h-6 shrink-0 text-emerald-100" />
                        )}
                        <div className="flex flex-col items-center justify-center text-center leading-tight">
                          <span className="text-sm sm:text-base font-extrabold tracking-wide">
                            {currentRide.status === 'accepted'
                              ? '📍 WAAN GAADHAY • I HAVE ARRIVED'
                              : currentRide.status === 'driver_arrived'
                              ? '🚗 BILOW SAFARKA • START TRIP'
                              : '✅ DHAMMEE SAFARKA • COMPLETE TRIP'}
                          </span>
                          <span className="text-[10px] font-bold opacity-90 tracking-normal normal-case pt-0.5">
                            {currentRide.status === 'accepted'
                              ? 'Guji si aad u ogeysiiso rakaabka (Tap to notify rider)'
                              : currentRide.status === 'driver_arrived'
                              ? 'Rakaabkii wuu fuulay (Passenger is onboard)'
                              : `Guji si aad u soo saarto xisaabta (${liveCalculatedFareSlsh.toLocaleString()} SLSH)`}
                          </span>
                        </div>
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              /* EXPANDABLE FAAHFAAHIN (DETAILS) DRAWER WITH FULL BREAKDOWN & QUICK COLLAPSE TO FULL MAP */
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 shadow-2xl border-2 border-emerald-500/80 relative overflow-hidden space-y-3.5 max-h-[75vh] overflow-y-auto">
                {/* Drawer Header with Prominent Button to Collapse Back to Full Map */}
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center space-x-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                      Faahfaahin Safarka • Trip Details
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDetailsDrawer(false);
                      setIsFullMapMode(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center space-x-1.5 shadow-md active:scale-95 transition cursor-pointer"
                    title="Ku laabo Khariidada Buuxda / Collapse to Full Map"
                  >
                    <Map className="w-3.5 h-3.5" />
                    <span>Khariidad Buuxda</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* DUAL CONTROL PANEL FOR STACKED / CARPOOL RIDES OR SINGLE RIDER */}
                {currentRide.coPassenger ? (
                  /* DUAL CONTROL PANEL FOR STACKED / CARPOOL RIDES */
                  <div className="space-y-3.5">
                {/* 1. Wadaage Carpool Header & Priority Switcher */}
                <div className="bg-slate-900 rounded-3xl p-4 text-white space-y-3 shadow-md border border-slate-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                        ⚡ Wadaage Carpool (2 Active Riders)
                      </span>
                    </div>
                    <div className="text-right font-mono font-black text-emerald-400 text-sm">
                      ${((Number(currentRide.totalFare) || 0) + (Number(currentRide.coPassenger.fare) || 0)).toFixed(2)} USD
                    </div>
                  </div>

                  {/* Priority Drop-off Order Switcher */}
                  <div className="bg-slate-800/80 rounded-2xl p-2.5 flex items-center justify-between border border-slate-700/60 text-xs">
                    <div className="flex items-center space-x-2">
                      <ArrowRightLeft className="w-4 h-4 text-amber-400" />
                      <div>
                        <span className="text-slate-300 font-bold block text-[11px]">Drop-off Sequence:</span>
                        <span className="font-extrabold text-amber-300 text-xs">
                          {(() => {
                            const waypoints = currentRide.optimalWaypointsSequence || [];
                            const dropAIdx = waypoints.findIndex((w) => w.type === 'DROPOFF' && (w.passengerId === currentRide.passengerId || w.passengerName === currentRide.passengerName));
                            const dropBIdx = waypoints.findIndex((w) => w.type === 'DROPOFF' && (w.passengerId === currentRide.coPassenger?.id || w.passengerName === currentRide.coPassenger?.name));
                            if (dropAIdx !== -1 && dropBIdx !== -1 && dropBIdx < dropAIdx) {
                              return '1st: Rider B (Co-Rider) ➔ 2nd: Rider A';
                            }
                            return '1st: Rider A (Primary) ➔ 2nd: Rider B';
                          })()}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={toggleDropoffPriority}
                      className="py-1.5 px-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-black text-[11px] rounded-xl border border-amber-500/40 transition active:scale-95 flex items-center gap-1"
                    >
                      <span>Swap Drop Order</span>
                    </button>
                  </div>
                </div>

                {/* 2. PANEL 1: RIDER A (PRIMARY PASSENGER) */}
                <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border-2 border-emerald-500/80 relative overflow-hidden space-y-3">
                  {/* Panel Header & Badge */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white font-black text-[10px] tracking-wider uppercase">
                        RIDER A (Primary)
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {currentRide.status === 'accepted'
                          ? 'Waiting Pickup'
                          : currentRide.status === 'driver_arrived'
                          ? 'Driver Arrived at A'
                          : currentRide.status === 'in_progress'
                          ? (() => {
                              const isADropped = currentRide.optimalWaypointsSequence?.find(
                                (w) => w.type === 'DROPOFF' && (w.passengerId === currentRide.passengerId || w.passengerName === currentRide.passengerName)
                              )?.status === 'completed';
                              return isADropped ? 'Dropped Off' : 'Onboard (In Trip)';
                            })()
                          : (currentRide.status || 'accepted').toUpperCase()}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-base font-black text-[#008751] font-mono">
                        ${(Number(currentRide.totalFare) || 0).toFixed(2)}
                      </span>
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">
                        {currentRide.paymentMethod || 'cash'}
                      </span>
                    </div>
                  </div>

                  {/* Rider Info Row */}
                  <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-10 h-10 rounded-full bg-[#008751] text-white font-bold flex items-center justify-center text-sm shadow-sm">
                        {currentRide.passengerName?.charAt(0) || 'A'}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900">
                          {currentRide.passengerName}
                        </h4>
                        <div className="flex items-center space-x-1 text-[10px] text-slate-500">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span>4.9 Rating</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => setShowChatModal(true)}
                        className="relative inline-flex items-center gap-1 text-[11px] font-bold text-[#008751] bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-xl border border-emerald-200 transition active:scale-95"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Chat</span>
                        {unreadChatCount > 0 && (
                          <span className="w-4 h-4 bg-red-500 text-white rounded-full text-[9px] font-black flex items-center justify-center animate-pulse">
                            {unreadChatCount}
                          </span>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCallPassengerModal(true)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-white hover:bg-slate-100 px-2.5 py-1.5 rounded-xl border border-slate-200 transition"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>Call</span>
                      </button>
                    </div>
                  </div>

                  {/* Rider A Color Beacon */}
                  {currentRide.beaconColor && (() => {
                    const bHex = currentRide.beaconColor?.hex || (typeof currentRide.beaconColor === 'string' ? currentRide.beaconColor : '#008751');
                    const bName = currentRide.beaconColor?.name || 'Assigned Glow';
                    return (
                      <div
                        className="p-2.5 rounded-xl border flex items-center justify-between text-xs"
                        style={{
                          backgroundColor: bHex + '15',
                          borderColor: bHex + '55',
                        }}
                      >
                        <div className="flex items-center space-x-2">
                          <span
                            className="w-3.5 h-3.5 rounded-full animate-ping shrink-0"
                            style={{ backgroundColor: bHex }}
                          />
                          <span className="font-bold text-slate-800 text-[11px]">
                            Beacon: <b style={{ color: bHex }}>{bName}</b>
                          </span>
                        </div>
                        <span
                          className="text-[9px] font-black px-2 py-0.5 rounded-full text-slate-950"
                          style={{ backgroundColor: bHex }}
                        >
                          RIDER A GLOW
                        </span>
                      </div>
                    );
                  })()}

                  {/* Rider A Route Container */}
                  <div className="bg-[#f8faf9] rounded-2xl p-3 border border-slate-100 space-y-1.5 text-xs">
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 rounded-full bg-slate-900 mt-1 shrink-0" />
                      <p className="font-bold text-slate-800 leading-tight truncate">
                        Pickup A: {currentRide.pickup?.name || 'Pickup A'}
                      </p>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 rounded-full bg-[#008751] mt-1 shrink-0" />
                      <p className="font-bold text-slate-800 leading-tight truncate">
                        Dropoff A: {currentRide.dropoff?.name || 'Dropoff A'}
                      </p>
                    </div>
                  </div>

                  {/* Control Action for Rider A */}
                  <div className="space-y-1.5">
                    {(() => {
                      const isADropped = currentRide.optimalWaypointsSequence?.find(
                        (w) => w.type === 'DROPOFF' && (w.passengerId === currentRide.passengerId || w.passengerName === currentRide.passengerName)
                      )?.status === 'completed';

                      if (isADropped) {
                        return (
                          <div className="py-2.5 px-3 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-800 font-black text-xs text-center flex items-center justify-center gap-1.5">
                            <CheckCircle className="w-4 h-4 text-emerald-600" />
                            <span>Rider A Dropped Off Successfully</span>
                          </div>
                        );
                      }

                      if (currentRide.status === 'accepted') {
                        return (
                          <button
                            type="button"
                            onClick={() => advanceIndividualRiderAction('RIDER_A', 'arrived')}
                            className="w-full py-3 px-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider shadow-md transition active:scale-95 flex items-center justify-center gap-2"
                          >
                            <MapPin className="w-4 h-4" />
                            <span>📍 Arrived at Pickup (Rider A)</span>
                          </button>
                        );
                      }

                      if (currentRide.status === 'driver_arrived') {
                        return (
                          <button
                            type="button"
                            onClick={() => advanceIndividualRiderAction('RIDER_A', 'pickup')}
                            className="w-full py-3 px-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs uppercase tracking-wider shadow-md transition active:scale-95 flex items-center justify-center gap-2"
                          >
                            <Car className="w-4 h-4" />
                            <span>🚗 Pick Up Rider A (Start Trip A)</span>
                          </button>
                        );
                      }

                      return (
                        <button
                          type="button"
                          onClick={() => advanceIndividualRiderAction('RIDER_A', 'dropoff')}
                          className="w-full py-3 px-3 rounded-2xl bg-[#008751] hover:bg-[#007445] text-white font-black text-xs uppercase tracking-wider shadow-md transition active:scale-95 flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>✅ Drop-off Rider A & Complete</span>
                        </button>
                      );
                    })()}

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => cancelIndividualRider('RIDER_A')}
                        className="w-full py-1.5 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-[11px] flex items-center justify-center gap-1 transition"
                      >
                        <X className="w-3 h-3" />
                        <span>Cancel Rider A</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3. PANEL 2: RIDER B (CO-RIDER / SECOND PASSENGER) */}
                <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border-2 border-teal-500/80 relative overflow-hidden space-y-3">
                  {/* Panel Header & Badge */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2.5">
                      <span className="px-2.5 py-0.5 rounded-full bg-teal-600 text-white font-black text-[10px] tracking-wider uppercase">
                        RIDER B (Co-Rider)
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200">
                        {currentRide.coPassenger.status === 'picking_up'
                          ? 'Driver Arrived at B'
                          : currentRide.coPassenger.status === 'picked_up'
                          ? 'Onboard (In Trip)'
                          : currentRide.coPassenger.status === 'dropped_off'
                          ? 'Dropped Off'
                          : 'Matched / En Route'}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-base font-black text-teal-700 font-mono">
                        +${(Number(currentRide.coPassenger?.fare) || 0).toFixed(2)}
                      </span>
                      <span className="text-[10px] text-teal-800 block font-bold">
                        EXTRA FARE
                      </span>
                    </div>
                  </div>

                  {/* Rider B Info Row */}
                  <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                    <div className="flex items-center space-x-2.5">
                      <div className="w-10 h-10 rounded-full bg-teal-600 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                        {currentRide.coPassenger?.name?.charAt(0) || 'B'}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-slate-900">
                          {currentRide.coPassenger?.name || 'Rider B'}
                        </h4>
                        <div className="flex items-center space-x-1 text-[10px] text-slate-500">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span>4.8 Rating</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <button
                        type="button"
                        onClick={() => setShowChatModal(true)}
                        className="relative inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 px-2.5 py-1.5 rounded-xl border border-teal-200 transition active:scale-95"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Chat</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCallPassengerModal(true)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-white hover:bg-slate-100 px-2.5 py-1.5 rounded-xl border border-slate-200 transition"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>Call</span>
                      </button>
                    </div>
                  </div>

                  {/* Rider B Color Beacon */}
                  {currentRide.coPassenger?.beaconColor && (() => {
                    const bHex = currentRide.coPassenger.beaconColor?.hex || (typeof currentRide.coPassenger.beaconColor === 'string' ? currentRide.coPassenger.beaconColor : '#0D9488');
                    const bName = currentRide.coPassenger.beaconColor?.name || 'Assigned Glow';
                    return (
                      <div
                        className="p-2.5 rounded-xl border flex items-center justify-between text-xs"
                        style={{
                          backgroundColor: bHex + '15',
                          borderColor: bHex + '55',
                        }}
                      >
                        <div className="flex items-center space-x-2">
                          <span
                            className="w-3.5 h-3.5 rounded-full animate-ping shrink-0"
                            style={{ backgroundColor: bHex }}
                          />
                          <span className="font-bold text-slate-800 text-[11px]">
                            Beacon: <b style={{ color: bHex }}>{bName}</b>
                          </span>
                        </div>
                        <span
                          className="text-[9px] font-black px-2 py-0.5 rounded-full text-slate-950"
                          style={{ backgroundColor: bHex }}
                        >
                          RIDER B GLOW
                        </span>
                      </div>
                    );
                  })()}

                  {/* Rider B Route Container */}
                  <div className="bg-[#f8faf9] rounded-2xl p-3 border border-slate-100 space-y-1.5 text-xs">
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 rounded-full bg-slate-900 mt-1 shrink-0" />
                      <p className="font-bold text-slate-800 leading-tight truncate">
                        Pickup B: {currentRide.coPassenger.pickupLocation?.name || 'Pickup B'}
                      </p>
                    </div>
                    <div className="flex items-start space-x-2">
                      <div className="w-2 h-2 rounded-full bg-teal-600 mt-1 shrink-0" />
                      <p className="font-bold text-slate-800 leading-tight truncate">
                        Dropoff B: {currentRide.coPassenger.dropoffLocation?.name || 'Dropoff B'}
                      </p>
                    </div>
                  </div>

                  {/* Control Action for Rider B */}
                  <div className="space-y-1.5">
                    {(() => {
                      const coStatus = currentRide.coPassenger.status;

                      if (coStatus === 'dropped_off') {
                        return (
                          <div className="py-2.5 px-3 rounded-2xl bg-teal-50 border border-teal-300 text-teal-900 font-black text-xs text-center flex items-center justify-center gap-1.5">
                            <CheckCircle className="w-4 h-4 text-teal-600" />
                            <span>Rider B Dropped Off Successfully</span>
                          </div>
                        );
                      }

                      if (!coStatus || coStatus === 'matched') {
                        return (
                          <button
                            type="button"
                            onClick={() => advanceIndividualRiderAction('RIDER_B', 'arrived')}
                            className="w-full py-3 px-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs uppercase tracking-wider shadow-md transition active:scale-95 flex items-center justify-center gap-2"
                          >
                            <MapPin className="w-4 h-4" />
                            <span>📍 Arrived at Pickup (Rider B)</span>
                          </button>
                        );
                      }

                      if (coStatus === 'picking_up') {
                        return (
                          <button
                            type="button"
                            onClick={() => advanceIndividualRiderAction('RIDER_B', 'pickup')}
                            className="w-full py-3 px-3 rounded-2xl bg-teal-700 hover:bg-teal-800 text-white font-black text-xs uppercase tracking-wider shadow-md transition active:scale-95 flex items-center justify-center gap-2"
                          >
                            <Car className="w-4 h-4" />
                            <span>🚗 Pick Up Rider B (Start Trip B)</span>
                          </button>
                        );
                      }

                      return (
                        <button
                          type="button"
                          onClick={() => advanceIndividualRiderAction('RIDER_B', 'dropoff')}
                          className="w-full py-3 px-3 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-black text-xs uppercase tracking-wider shadow-md transition active:scale-95 flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span>✅ Drop-off Rider B & Complete</span>
                        </button>
                      );
                    })()}

                    <div className="flex gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => cancelIndividualRider('RIDER_B')}
                        className="w-full py-1.5 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl text-[11px] flex items-center justify-center gap-1 transition"
                      >
                        <X className="w-3 h-3" />
                        <span>Cancel Rider B</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* 4. Complete Route Waypoint Flow Manifest */}
                {currentRide.optimalWaypointsSequence && currentRide.optimalWaypointsSequence.length > 0 && (
                  <div className="bg-slate-950 p-3.5 rounded-3xl border border-slate-800 text-white space-y-2.5">
                    <div className="flex items-center justify-between text-[10px] font-black text-emerald-400 uppercase tracking-wider">
                      <span>⚡ 4-Stop Optimized Route Waypoints</span>
                      <span>100% Direction Aligned</span>
                    </div>
                    <div className="space-y-1.5">
                      {currentRide.optimalWaypointsSequence.map((wp, idx) => (
                        <div
                          key={wp.id || idx}
                          className={`p-2 rounded-xl border flex items-center justify-between text-xs transition ${
                            wp.status === 'completed'
                              ? 'bg-emerald-950/40 border-emerald-700/60 opacity-60'
                              : 'bg-slate-900 border-slate-800'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5">
                            <span
                              className={`w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center ${
                                wp.status === 'completed'
                                  ? 'bg-emerald-500 text-slate-950'
                                  : wp.type === 'PICKUP'
                                  ? 'bg-emerald-500 text-slate-950'
                                  : 'bg-blue-500 text-white'
                              }`}
                            >
                              {wp.status === 'completed' ? '✓' : idx + 1}
                            </span>
                            <div>
                              <span className="font-bold text-slate-200">
                                {wp.type === 'PICKUP' ? 'PICKUP' : 'DROPOFF'}: {wp.passengerName}
                              </span>
                              <p className="text-[10px] text-slate-400 truncate max-w-[180px]">{wp.location?.name || 'Waypoint'}</p>
                            </div>
                          </div>
                          {wp.beaconColor && (
                            <div
                              className="w-3 h-3 rounded-full shadow"
                              style={{ backgroundColor: wp.beaconColor.hex }}
                              title={wp.beaconColor?.name || 'Beacon'}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Emergency Global SOS */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowSosModal(true)}
                    className="w-full py-2.5 px-3 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-2xl text-xs flex items-center justify-center space-x-1.5 transition border border-red-200"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span>Emergency SOS & Police Dispatch</span>
                  </button>
                </div>
              </div>
            ) : (
              /* SINGLE RIDER ACTIVE CARD */
              <div className="bg-white rounded-3xl p-4 sm:p-5 shadow-sm border-2 border-emerald-500 relative overflow-hidden space-y-3.5">
                {/* Header & Single Rider Tag */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-[#008751] text-white font-bold flex items-center justify-center text-base shadow-sm">
                      {currentRide.passengerName?.charAt(0) || 'P'}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-extrabold text-sm text-slate-900">
                          {currentRide.passengerName || 'Passenger'}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white font-black text-[9px] uppercase">
                          RIDER A (Primary)
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="bg-emerald-50 text-[#008751] text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-200">
                          {(currentRide.status || 'accepted').replace('_', ' ').toUpperCase()}
                        </span>
                        <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-md">
                          {currentRide.category === 'wadaage_share' ? 'Shared Wadaage' : 'Standard'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end">
                    <div className="text-xl font-black text-[#008751] font-mono">
                      ${(Number(currentRide.totalFare) || 0).toFixed(2)}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <button
                        type="button"
                        onClick={() => setShowChatModal(true)}
                        className="relative inline-flex items-center gap-1 text-[11px] font-bold text-[#008751] bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition active:scale-95"
                      >
                        <MessageSquare className="w-3 h-3" />
                        <span>Chat</span>
                        {unreadChatCount > 0 && (
                          <span className="w-4 h-4 bg-red-500 text-white rounded-full text-[9px] font-black flex items-center justify-center animate-pulse">
                            {unreadChatCount}
                          </span>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCallPassengerModal(true)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-lg transition"
                      >
                        <PhoneCall className="w-3 h-3" />
                        <span>Call</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Color Beacon Identification Prompt */}
                {currentRide.beaconColor && (() => {
                  const bHex = currentRide.beaconColor?.hex || (typeof currentRide.beaconColor === 'string' ? currentRide.beaconColor : '#008751');
                  const bName = currentRide.beaconColor?.name || 'Assigned Glow';
                  return (
                    <div
                      className="p-3 rounded-2xl border flex items-center justify-between"
                      style={{
                        backgroundColor: bHex + '15',
                        borderColor: bHex + '55',
                      }}
                    >
                      <div className="flex items-center space-x-2.5">
                        <div
                          className="w-5 h-5 rounded-full shadow-sm animate-ping"
                          style={{ backgroundColor: bHex }}
                        />
                        <div>
                          <span className="text-[11px] font-black text-slate-900 block">
                            Rider Beacon: <span style={{ color: bHex }}>{bName}</span>
                          </span>
                          <p className="text-[10px] text-slate-600">
                            Look for passenger holding up this color glow on their phone screen.
                          </p>
                        </div>
                      </div>
                      <span
                        className="text-[10px] font-black px-2 py-0.5 rounded-full text-slate-950"
                        style={{ backgroundColor: bHex }}
                      >
                        IDENTIFIER
                      </span>
                    </div>
                  );
                })()}

                {/* Route Path Container */}
                <div className="bg-[#f8faf9] rounded-2xl p-3.5 border border-slate-100 space-y-2">
                  <div className="flex items-start space-x-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-900 mt-1 shrink-0" />
                    <p className="text-xs font-bold text-slate-800 leading-tight">
                      {currentRide.pickup?.name || 'Pickup Location'}
                    </p>
                  </div>
                  <div className="border-l-2 border-dashed border-slate-300 ml-1 h-3.5 my-0.5" />
                  <div className="flex items-start space-x-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#008751] mt-1 shrink-0" />
                    <p className="text-xs font-bold text-slate-800 leading-tight">
                      {currentRide.dropoff?.name || 'Dropoff Destination'}
                    </p>
                  </div>
                </div>

                {/* Dynamic Carpool Stacking Status Monitor vs Private Taxi Status */}
                {currentRide.category === 'wadaage_share' && currentRide.isShared ? (
                  <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-300 p-3.5 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Sparkles className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-black text-slate-900">Wadaage Share Carpool Stacking</span>
                      </div>
                      <button
                        type="button"
                        onClick={toggleAutoAcceptShares}
                        className={`px-3 py-1 rounded-full text-[10px] font-black transition ${
                          autoAcceptOnRouteShares
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {autoAcceptOnRouteShares ? 'AUTO-STACK: ON' : 'AUTO-STACK: OFF'}
                      </button>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-emerald-900 font-bold bg-white/70 p-2 rounded-xl border border-emerald-200/60">
                      <span>⚡ Corridor Scanning (1.0km pickup / 1.5km driving)</span>
                      <span className="text-[#008751] font-extrabold">+${(Number(pricing?.driverStackedBonusUsd) || 1.50).toFixed(2)} Extra Profit</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl flex items-center justify-between text-xs font-bold text-slate-700">
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-600" />
                      <span>Private Exclusive Taxi Trip (No Co-Riders)</span>
                    </div>
                    <span className="text-[10px] font-black uppercase text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                      Direct Route
                    </span>
                  </div>
                )}

                {/* Action Controls for Single Rider */}
                <div className="space-y-2">
                  {(() => {
                    let buttonLabel = '📍 I Have Arrived at Pickup Location';
                    if (currentRide.status === 'driver_arrived') {
                      buttonLabel = '🚀 Start Trip (Passenger Onboard)';
                    } else if (currentRide.status === 'in_progress') {
                      buttonLabel = '✅ Complete Trip & Collect Fare';
                    }

                    return (
                      <button
                        type="button"
                        id="driver-btn-drawer-ride-action"
                        onClick={() => {
                          try {
                            if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
                              navigator.vibrate([40, 30, 40]);
                            }
                          } catch (_e) {}
                          sounds.playButtonClick();
                          advanceDriverRideState();
                        }}
                        className="w-full min-h-[58px] py-4 px-4 rounded-2xl bg-[#008751] hover:bg-[#007445] active:bg-[#006038] text-white font-black text-sm uppercase tracking-wider shadow-xl shadow-emerald-700/40 border-2 border-emerald-400/50 transition-all duration-150 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer touch-manipulation select-none"
                      >
                        <CheckCircle className="w-5 h-5 shrink-0" />
                        <span>{buttonLabel}</span>
                      </button>
                    );
                  })()}

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowSosModal(true)}
                      className="w-full py-2.5 px-3 bg-red-50 hover:bg-red-100 text-red-700 font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition"
                    >
                      <ShieldAlert className="w-4 h-4" />
                      <span>Emergency SOS & Police Dispatch</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
              </div>
            )
          ) : null}
        </div>
      </div>
    </div>
    )}

      {/* 2. FUEL TAB: WADAAGE DRIVER FUEL & DISTANCE DASHBOARD */}
      {activeTab === 'fuel' && (
        <div className="flex-1 overflow-hidden relative">
          <FuelDashboardScreen />
        </div>
      )}

      {/* 3. MY RIDES TAB */}
      {activeTab === 'my_rides' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900">Safarradayda (My Rides)</h2>
              <p className="text-xs text-slate-500">Diiwaanka dhabta ah ee dhammaan safarrada aad qaaday</p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('home')}
              className="px-3 py-1 text-xs bg-emerald-50 text-[#008751] font-bold rounded-xl border border-emerald-200"
            >
              Khaariirada (Map)
            </button>
          </div>

          {/* Driver Fleet Performance Summary Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-slate-400">Safarrada</span>
              <div className="text-xl font-black text-slate-900 font-mono">{completedTripsList.length || '03'}</div>
              <span className="text-[9px] text-emerald-600 font-bold">Dhammaystiran</span>
            </div>
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-slate-400">Lacagta La Qaaday</span>
              <div className="text-xl font-black text-[#008751] font-mono">${driverTotalCollectedUsd.toFixed(2)}</div>
              <span className="text-[9px] text-slate-400 font-mono">{(driverTotalCollectedUsd * 8500).toLocaleString()} SLSH</span>
            </div>
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-slate-400">Komishan Wadaage</span>
              <div className="text-xl font-black text-rose-500 font-mono">-{(completedTripsList.length * 1000 || 3000).toLocaleString()}</div>
              <span className="text-[9px] text-slate-400 font-mono">1,000 SLSH / Safar</span>
            </div>
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold uppercase text-slate-400">Dakhligaaga Saafiga</span>
              <div className="text-xl font-black text-emerald-700 font-mono">
                ${(driverTotalCollectedUsd - ((completedTripsList.length * 1000 || 3000) / 8500)).toFixed(2)}
              </div>
              <span className="text-[9px] text-emerald-600 font-bold">Faa'iidadaada</span>
            </div>
          </div>

          {driverRides && driverRides.length > 0 ? (
            <div className="space-y-3">
              {driverRides.map((ride, idx) => {
                const fareUsd = Number(ride.totalFare) || 2.50;
                const fareSlsh = Math.round(fareUsd * 8500);
                const isCompleted = ride.status === 'completed';

                return (
                  <div key={ride.id || idx} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 space-y-2.5">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-sm">
                          {ride.passengerName?.charAt(0) || 'R'}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-black text-slate-900">{ride.passengerName || 'Rakaab (Customer)'}</span>
                            <span className="text-[9px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold">
                              {ride.id || `WDG-${900 + idx}`}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-mono">{ride.passengerPhone || '252634455667'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-black text-sm text-[#008751]">${fareUsd.toFixed(2)}</span>
                        <div className="text-[10px] text-slate-400 font-mono">{fareSlsh.toLocaleString()} SLSH</div>
                      </div>
                    </div>

                    <div className="text-xs space-y-1 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div className="flex items-start text-slate-600">
                        <span className="w-2 h-2 rounded-full bg-blue-500 mr-2 shrink-0 mt-1" />
                        <span className="line-clamp-1">{ride.pickup?.name || ride.pickup?.address || 'Hargeisa Pickup'}</span>
                      </div>
                      <div className="flex items-start text-slate-900 font-medium">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 shrink-0 mt-1" />
                        <span className="line-clamp-1">{ride.dropoff?.name || ride.dropoff?.address || 'Dropoff Destination'}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-1 text-[11px] text-slate-500">
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-400">{ride.createdAt ? new Date(ride.createdAt).toLocaleDateString('so-SO', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Maanta'}</span>
                        <span className="text-[10px] text-rose-500 font-semibold">• Komishan: -1,000 SLSH</span>
                      </div>
                      <span className={`capitalize font-bold text-[10px] px-2 py-0.5 rounded-full ${
                        isCompleted ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {isCompleted ? 'Dhammaystiran' : ride.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 text-center text-slate-500 border border-slate-200">
              <Car className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-sm text-slate-700">Weli wax safarro ah ma jiraan</p>
              <p className="text-xs text-slate-400 mt-1">Safarrada aad dhammaystirto halkan ayay ka muuqan doonaan.</p>
            </div>
          )}
        </div>
      )}

      {/* 4. EARNINGS TAB */}
      {activeTab === 'earnings' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900">Dakhliga (Earnings)</h2>
            <button
              type="button"
              onClick={() => setActiveTab('home')}
              className="text-xs text-[#008751] font-bold"
            >
              Back to Map
            </button>
          </div>
          <div className="bg-gradient-to-br from-[#008751] to-emerald-700 rounded-3xl p-5 text-white shadow-lg space-y-3">
            <div className="text-xs uppercase font-bold tracking-wider text-emerald-100">Maanta (Today's Earnings)</div>
            <div className="text-3xl font-black font-mono">
              ${(currentDriverRecord?.todayEarnings || 0).toFixed(2)}
            </div>
            <div className="text-sm font-bold text-emerald-200">
              ~{Math.round((currentDriverRecord?.todayEarnings || 0) * EXCHANGE_RATE_USD_TO_SLSH).toLocaleString()} SLSH
            </div>
            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setShowWalletModal(true)}
                className="flex-1 py-2 px-3 bg-white text-[#008751] font-black rounded-xl text-xs uppercase tracking-wider shadow"
              >
                Zaad / eDahab Wallet
              </button>
              <button
                type="button"
                onClick={() => setShowEarningsModal(true)}
                className="py-2 px-3 bg-emerald-800/80 text-white font-bold rounded-xl text-xs"
              >
                Faahfaahin
              </button>
            </div>
          </div>

          {/* Dedicated Working Capital / Commission Float Real Balance Card */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-black">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                    Haraaga Komishanka (Prepaid Float)
                  </h3>
                  <span className="text-[10px] text-slate-400">Zaad / eDahab Commission Wallet</span>
                </div>
              </div>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  driverWalletBalanceUsd >= 0.10
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                    : 'bg-rose-100 text-rose-700 border border-rose-300'
                }`}
              >
                {driverWalletBalanceUsd >= 0.10 ? 'Eligible for Trips' : 'Low Float (< $0.10)'}
              </span>
            </div>

            <div className="bg-slate-900 rounded-2xl p-4 text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                  Current Real Balance
                </span>
                <span className="text-xs font-mono font-bold text-amber-400">
                  {Math.round(driverWalletBalanceUsd * EXCHANGE_RATE_USD_TO_SLSH).toLocaleString()} SLSH
                </span>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black font-mono text-emerald-400">
                  ${driverWalletBalanceUsd.toFixed(2)}
                </span>
                <span className="text-[10px] text-slate-400 block">USD</span>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 bg-slate-50 rounded-xl p-3 border border-slate-200/80 space-y-1">
              <div className="flex items-center justify-between font-bold text-slate-700">
                <span>Wadaage Platform Commission:</span>
                <span className="font-mono text-rose-600">-1,000 SLSH ($0.10) / trip</span>
              </div>
              <p className="text-[10px] text-slate-400">
                Waxa si toos ah looga jaraa haraagaaga Zaad/eDahab marka aad qabato oo dhammayso safar kasta.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowWalletModal(true)}
              className="w-full py-2.5 px-4 bg-[#008751] hover:bg-[#007345] text-white font-black rounded-xl text-xs uppercase tracking-wider shadow transition flex items-center justify-center space-x-1.5"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Ku Shubo Haraag (Top-Up ZAAD / eDahab)</span>
            </button>
          </div>
        </div>
      )}

      {/* 5. PROFILE TAB */}
      {activeTab === 'profile' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900">Xogta Darawalka (Profile)</h2>
            <button
              type="button"
              onClick={() => setActiveTab('home')}
              className="text-xs text-[#008751] font-bold"
            >
              Back to Map
            </button>
          </div>
          <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-14 h-14 rounded-2xl bg-[#008751] text-white flex items-center justify-center font-black text-xl shadow">
                {currentUser?.name?.charAt(0) || 'D'}
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900">{currentUser?.name || 'Driver Partner'}</h3>
                <p className="text-xs text-slate-500 font-mono">{currentUser?.phone || '+252 63 ...'}</p>
                <span className="inline-block mt-1 text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  Wadaage Official Driver
                </span>
              </div>
            </div>
            <div className="border-t border-slate-100 pt-3 space-y-2 text-xs">
              <div className="flex justify-between py-1 text-slate-600">
                <span>Gaadhiga:</span>
                <b className="text-slate-900">Toyota Vitz (SL-4921)</b>
              </div>
              <div className="flex justify-between py-1 text-slate-600">
                <span>Magaalada:</span>
                <b className="text-slate-900">Hargeisa, Somaliland</b>
              </div>
              <div className="flex justify-between py-1 text-slate-600">
                <span>KYC Status:</span>
                <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                  {isKycApproved ? 'Approved' : 'Pending / Verified'}
                </span>
              </div>
            </div>
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setShowAccountModal(true)}
                className="w-full py-2.5 bg-slate-900 text-white font-bold rounded-xl text-xs"
              >
                Beddel Xogta Akoonka
              </button>
              <button
                type="button"
                onClick={() => setShowVehicleSetupModal(true)}
                className="w-full py-2.5 bg-emerald-50 text-[#008751] border border-emerald-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5"
              >
                <FuelIcon className="w-3.5 h-3.5" />
                <span>Habee Xogta Shidaalka (Fuel Vehicle Setup)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. BOTTOM WADAAGE BLUE NAVIGATION BAR (Matching image.png) */}
      {(!currentRide || currentRide.status === 'searching' || currentRide.status === 'idle' || currentRide.status === 'cancelled' || currentRide.status === 'completed') && (
        <nav className="bg-[#0066f5] border-t border-blue-400/20 px-2 py-2 rounded-t-[1.8rem] shadow-2xl flex items-center justify-around shrink-0 text-white z-30 select-none">
          {/* Tab 1: HOME */}
          <button
            id="nav-tab-home"
            type="button"
            onClick={() => setActiveTab('home')}
            className={`min-h-[44px] px-3 py-1.5 rounded-full flex items-center space-x-1.5 transition-all duration-200 active:scale-95 cursor-pointer ${
              activeTab === 'home'
                ? 'bg-white text-[#0066f5] font-black shadow-md'
                : 'text-white/80 hover:text-white font-bold'
            }`}
          >
            <Home className="w-4 h-4 shrink-0" />
            <span className="text-[11px] tracking-wider uppercase">HOME</span>
          </button>

          {/* Tab 2: MY RIDES */}
          <button
            id="nav-tab-my-rides"
            type="button"
            onClick={() => setActiveTab('my_rides')}
            className={`min-h-[44px] px-3 py-1.5 rounded-full flex items-center space-x-1.5 transition-all duration-200 active:scale-95 cursor-pointer ${
              activeTab === 'my_rides'
                ? 'bg-white text-[#0066f5] font-black shadow-md'
                : 'text-white/80 hover:text-white font-bold'
            }`}
          >
            <Car className="w-4 h-4 shrink-0" />
            <span className="text-[11px] tracking-wider uppercase">MY RIDES</span>
          </button>

          {/* Tab 3: FUEL */}
          <button
            id="nav-tab-fuel"
            type="button"
            onClick={() => setActiveTab('fuel')}
            className={`min-h-[44px] px-3 py-1.5 rounded-full flex items-center space-x-1.5 transition-all duration-200 active:scale-95 relative cursor-pointer ${
              activeTab === 'fuel'
                ? 'bg-white text-[#0066f5] font-black shadow-md'
                : 'text-white/80 hover:text-white font-bold'
            }`}
          >
            <FuelIcon className="w-4 h-4 shrink-0" />
            <span className="text-[11px] tracking-wider uppercase">FUEL</span>
          </button>

          {/* Tab 4: EARNINGS */}
          <button
            id="nav-tab-earnings"
            type="button"
            onClick={() => setActiveTab('earnings')}
            className={`min-h-[44px] px-3 py-1.5 rounded-full flex items-center space-x-1.5 transition-all duration-200 active:scale-95 cursor-pointer ${
              activeTab === 'earnings'
                ? 'bg-white text-[#0066f5] font-black shadow-md'
                : 'text-white/80 hover:text-white font-bold'
            }`}
          >
            <Wallet className="w-4 h-4 shrink-0" />
            <span className="text-[11px] tracking-wider uppercase">EARNINGS</span>
          </button>

          {/* Tab 5: PROFILE */}
          <button
            id="nav-tab-profile"
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`min-h-[44px] px-3 py-1.5 rounded-full flex items-center space-x-1.5 transition-all duration-200 active:scale-95 cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-white text-[#0066f5] font-black shadow-md'
                : 'text-white/80 hover:text-white font-bold'
            }`}
          >
            <User className="w-4 h-4 shrink-0" />
            <span className="text-[11px] tracking-wider uppercase">PROFILE</span>
          </button>
        </nav>
      )}

      {/* 7. DRIVER MENU DRAWER */}
      {showMenuDrawer && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
            onClick={() => setShowMenuDrawer(false)}
          />
          <div className="relative w-72 max-w-[80vw] bg-slate-900 text-white h-full shadow-2xl border-r border-slate-800 p-5 flex flex-col justify-between z-10 animate-slideRight">
            <div className="space-y-4">
              {/* Brand Top Header in Drawer */}
              <div className="bg-[#030d1a] -mx-5 -mt-5 p-4 flex items-center justify-between border-b border-slate-800 shadow-md">
                <div className="flex items-center space-x-2.5">
                  <WadaageLogo variant="icon" size="sm" appType="driver" />
                  <WadaageLogo variant="wordmark" size="xs" appType="driver" />
                </div>
                <button
                  onClick={() => setShowMenuDrawer(false)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Profile Card */}
              <div className="flex items-center space-x-3 border-b border-slate-800 pb-3">
                <div className="w-11 h-11 rounded-2xl bg-[#008751] flex items-center justify-center font-bold text-white shadow-md">
                  {currentUser?.name?.charAt(0) || 'D'}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">{currentUser?.name || 'Baashe Maxamed'}</h3>
                  <p className="text-xs text-emerald-400 font-bold">Toyota Vitz (SL-4921)</p>
                </div>
              </div>

              {/* Navigation Links */}
              <div className="space-y-1 text-sm font-semibold">
                <button
                  onClick={() => {
                    setShowMenuDrawer(false);
                    setShowWalletModal(true);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-800 text-slate-200 transition"
                >
                  <div className="flex items-center space-x-2.5">
                    <Wallet className="w-4 h-4 text-amber-400" />
                    <span>ZAAD / eDahab Commission Wallet</span>
                  </div>
                  <span className="font-mono text-xs text-emerald-400">${driverWalletBalanceUsd.toFixed(2)}</span>
                </button>

                <button
                  onClick={() => {
                    setShowMenuDrawer(false);
                    setShowEarningsModal(true);
                  }}
                  className="w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl hover:bg-slate-800 text-slate-200 transition"
                >
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>Daily Earnings Breakdown</span>
                </button>

                <button
                  onClick={() => {
                    setShowMenuDrawer(false);
                    setShowActivityModal(true);
                  }}
                  className="w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl hover:bg-slate-800 text-slate-200 transition"
                >
                  <Flame className="w-4 h-4 text-orange-400" />
                  <span>Completed Rides & Rating</span>
                </button>

                <button
                  onClick={() => {
                    setShowMenuDrawer(false);
                    setActiveTab('fuel');
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-800 text-slate-200 transition"
                >
                  <div className="flex items-center space-x-2.5">
                    <FuelIcon className="w-4 h-4 text-emerald-400" />
                    <span>Fuel & Distance Management</span>
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-900/60 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-700">Hargeisa GPS</span>
                </button>

                <button
                  onClick={() => {
                    setShowMenuDrawer(false);
                    setShowAccountModal(true);
                  }}
                  className="w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl hover:bg-slate-800 text-slate-200 transition"
                >
                  <User className="w-4 h-4 text-blue-400" />
                  <span>KYC Documents & Vehicle</span>
                </button>

                <button
                  onClick={() => {
                    setShowMenuDrawer(false);
                    setShowSosModal(true);
                  }}
                  className="w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl hover:bg-slate-800 text-slate-200 transition"
                >
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>Driver Emergency 999 SOS</span>
                </button>
              </div>
            </div>

            {/* Sign Out Button */}
            <div className="pt-4 border-t border-slate-800">
              <button
                onClick={logout}
                className="w-full flex items-center justify-center space-x-2 py-2.5 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-xl text-xs font-bold transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out of Driver Partner</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. NOTIFICATIONS DRAWER */}
      {showNotificationDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs"
            onClick={() => setShowNotificationDrawer(false)}
          />
          <div className="relative w-80 max-w-[85vw] bg-white text-slate-900 h-full shadow-2xl p-5 flex flex-col justify-between z-10 animate-slideLeft">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center space-x-2 font-black text-sm">
                  <Bell className="w-4 h-4 text-[#008751]" />
                  <span>Driver Notifications</span>
                </div>
                <button
                  onClick={() => setShowNotificationDrawer(false)}
                  className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1">
                  <p className="font-bold text-emerald-900">Wallet Top-up Confirmed</p>
                  <p className="text-slate-600">Your ZAAD topup of 10,000 SLSH ($1.00) is credited to your commission account.</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                  <p className="font-bold text-slate-900">High Demand in Jigjiga Yar</p>
                  <p className="text-slate-600">Surge in ride requests near Mansoor Hotel and Hargeisa Mall.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 9. MODALS & SUB-VIEWS (Wallet, KYC, SOS, Earnings, Activity) */}
      <LocationSetupModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
      />
      <DriverCommissionWalletModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
      />
      <DriverEmergencySosModal isOpen={showSosModal} onClose={() => setShowSosModal(false)} />

      {showEarningsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 border border-slate-200 rounded-3xl p-5 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base">Driver Daily Earnings</h3>
              <button onClick={() => setShowEarningsModal(false)} className="p-1.5 rounded-xl bg-slate-100 text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="pt-3">
              <DriverEarningsView />
            </div>
          </div>
        </div>
      )}

      {showActivityModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 border border-slate-200 rounded-3xl p-5 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base">Driver Activity & Rides</h3>
              <button onClick={() => setShowActivityModal(false)} className="p-1.5 rounded-xl bg-slate-100 text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="pt-3">
              <DriverActivityView />
            </div>
          </div>
        </div>
      )}

      {showAccountModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 border border-slate-200 rounded-3xl p-5 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base">Driver Profile & Documents</h3>
              <button onClick={() => setShowAccountModal(false)} className="p-1.5 rounded-xl bg-slate-100 text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="pt-3">
              <DriverAccountView
                onOpenSupportModal={() => setShowSupportModal(true)}
                onOpenFatigueModal={() => setShowFatigueModal(true)}
                onOpenVehicleModal={() => setShowVehicleHealthModal(true)}
                onOpenSosModal={() => setShowSosModal(true)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Driver Compulsory Full KYC Modal */}
      {showKycModal && (
        <DriverRegistrationModal
          isOpen={showKycModal}
          initialName={currentUser?.name}
          initialPhone={currentUser?.phone}
          onClose={() => setShowKycModal(false)}
        />
      )}

      {/* Transfer Ride to Another Driver Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white text-slate-900 border border-slate-200 rounded-3xl p-5 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <ArrowRightLeft className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Transfer Ride (U Wareeji)</h3>
                  <p className="text-[11px] text-slate-500">Re-dispatch this ride to another active driver</p>
                </div>
              </div>
              <button
                onClick={() => setShowTransferModal(false)}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick 1-Click Fast Transfer to Nearest */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 p-3.5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-950 uppercase tracking-wide">
                  ⚡ 1-Click Auto Dispatch
                </span>
                <span className="text-[10px] bg-emerald-200 text-emerald-900 font-bold px-2 py-0.5 rounded-full">
                  Fastest
                </span>
              </div>
              <p className="text-xs text-emerald-800">
                Immediately pass this ride request to the next closest available driver in Hargeisa.
              </p>
              <button
                type="button"
                onClick={() => {
                  const result = transferRideToAnotherDriver();
                  setShowTransferModal(false);
                  setTransferNotice(result.message);
                }}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow transition"
              >
                <ArrowRightLeft className="w-4 h-4" />
                <span>Auto-Forward to Nearest Driver</span>
              </button>
            </div>

            {/* Choose from specific online drivers */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 block">
                Available Online Drivers ({drivers.filter((d) => d.id !== currentUser?.id).length}):
              </span>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {drivers
                  .filter((d) => d.id !== currentUser?.id)
                  .map((drv) => (
                    <div
                      key={drv.id}
                      className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl flex items-center justify-between transition gap-2"
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <img
                          src={drv.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                          alt={drv.name}
                          className="w-10 h-10 rounded-full object-cover border border-slate-300 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-black text-slate-900 truncate">{drv.name}</p>
                          <p className="text-[10px] text-slate-500 font-medium truncate">
                            {drv.vehicle?.model} • {drv.vehicle?.licensePlate}
                          </p>
                          <span className="text-[9px] font-bold text-amber-600">★ {drv.rating} • {drv.phone}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const result = transferRideToAnotherDriver(drv.id);
                          setShowTransferModal(false);
                          setTransferNotice(result.message);
                        }}
                        className="py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shrink-0 active:scale-95 transition"
                      >
                        Send to Driver
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Driver Real-Time Chat with Passenger Modal */}
      {showChatModal && (
        <ChatModal
          onClose={() => setShowChatModal(false)}
          viewerRole="driver"
        />
      )}

      {/* Vehicle Fuel Profile Setup Modal */}
      {showVehicleSetupModal && (
        <VehicleSetupModal
          isOpen={showVehicleSetupModal}
          onClose={() => setShowVehicleSetupModal(false)}
        />
      )}

      {/* Driver Support Tickets & Claims */}
      <DriverSupportTickets
        isOpen={showSupportModal}
        onClose={() => setShowSupportModal(false)}
      />

      {/* Driver Fatigue Alert & Break Modal */}
      <DriverFatigueModal
        isOpen={showFatigueModal}
        hoursOnline={currentDriverRecord?.hoursOnline || 3.5}
        onTakeBreak={() => {
          setShowFatigueModal(false);
          toggleDriverOnline(false);
        }}
        onClose={() => setShowFatigueModal(false)}
      />

      {/* Vehicle Diagnostics & Health Modal */}
      <VehicleHealthModal
        isOpen={showVehicleHealthModal}
        onClose={() => setShowVehicleHealthModal(false)}
      />

      {/* Call Passenger Modal (Cellular GSM + In-App Voice HD) */}
      {showCallPassengerModal && currentRide && (() => {
        const passengerPhone = currentRide.passengerPhone || (currentRide as any).passenger_phone || '';
        const cleanPhone = passengerPhone.replace(/[^0-9+]/g, '');
        const waPhone = cleanPhone.replace(/^\+/, '');

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
            <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-white">Wac Rakaabka</h3>
                    <p className="text-[11px] text-slate-400">Call Passenger</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCallPassengerModal(false)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="text-center py-2 space-y-1">
                <p className="text-base font-black text-white">{currentRide.passengerName || 'Passenger'}</p>
                <p className="text-xs text-emerald-400 font-mono font-bold">{passengerPhone}</p>
              </div>

              <div className="space-y-2 pt-2">
                <a
                  href={`tel:${cleanPhone}`}
                  className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center space-x-2 transition shadow-lg shadow-emerald-900/40"
                  onClick={() => setShowCallPassengerModal(false)}
                >
                  <Phone className="w-4 h-4" />
                  <span>Wicitaan Toos Ah (Cellular Call)</span>
                </a>

                <button
                  type="button"
                  onClick={() => {
                    setShowCallPassengerModal(false);
                    initiateVoiceCall();
                  }}
                  className="w-full py-3.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs flex items-center justify-center space-x-2 transition shadow-lg shadow-blue-900/40"
                >
                  <Radio className="w-4 h-4 animate-pulse" />
                  <span>Wadaage HD Voice (Free In-App)</span>
                </button>

                {waPhone && (
                  <a
                    href={`https://wa.me/${waPhone}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center space-x-2 transition"
                    onClick={() => setShowCallPassengerModal(false)}
                  >
                    <MessageSquare className="w-4 h-4 text-emerald-400" />
                    <span>Fariin WhatsApp (Message)</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Manual Street Hail (Standing Pickup On The Road) Modal */}
      {showStreetHailModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-5 max-w-md w-full shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                  <Car className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">Standing Pickup on the Road</h3>
                  <p className="text-[11px] text-slate-400">Normal Taxi On-Road Meter & Fare Calculation</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowStreetHailModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Mode Toggle: Open Live Taximeter vs Pre-set Destination */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-950/80 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => setStandingMode('open_meter')}
                className={`py-2 px-2.5 rounded-xl text-xs font-black transition flex items-center justify-center space-x-1.5 ${
                  standingMode === 'open_meter'
                    ? 'bg-[#008751] text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Open Taximeter</span>
              </button>
              <button
                type="button"
                onClick={() => setStandingMode('with_destination')}
                className={`py-2 px-2.5 rounded-xl text-xs font-black transition flex items-center justify-center space-x-1.5 ${
                  standingMode === 'with_destination'
                    ? 'bg-[#008751] text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Search Destination</span>
              </button>
            </div>

            {/* Standard Taxi Pricing Notice Banner */}
            <div className="p-3 bg-emerald-950/60 border border-emerald-500/30 rounded-2xl text-[11.5px] space-y-1">
              <div className="flex items-center justify-between font-black text-emerald-300">
                <span>📍 Standard Taxi Pricing Formula:</span>
                <span className="text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/40">Hargeisa Metred</span>
              </div>
              <p className="text-slate-300 text-[11px]">
                • <strong>1st KM (Base Fare):</strong> 12,000 SLSH ($1.20 USD)
              </p>
              <p className="text-slate-300 text-[11px]">
                • <strong>Subsequent KMs:</strong> +7,000 SLSH ($0.70 USD) per each additional km
              </p>
            </div>

            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Passenger Name (Magaca Rakaabka)</label>
                <input
                  type="text"
                  placeholder="e.g. Maxamed Cali (Optional)"
                  value={streetPassengerName}
                  onChange={(e) => setStreetPassengerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Phone Number (Tel Rakaabka)</label>
                <input
                  type="text"
                  placeholder="e.g. +252 63 4XXXXXX (Optional)"
                  value={streetPassengerPhone}
                  onChange={(e) => setStreetPassengerPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Mode 1: Open Live Taximeter Info */}
              {standingMode === 'open_meter' ? (
                <div className="p-3.5 bg-slate-800/80 border border-emerald-500/40 rounded-2xl space-y-2">
                  <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs">
                    <Zap className="w-4 h-4" />
                    <span>Live GPS Distance & Fare Counting</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Start right now from your current location without setting destination upfront. The digital meter tracks kilometers as you drive and displays the live fare.
                  </p>
                  <div className="pt-1 flex items-center justify-between text-xs font-mono font-bold text-emerald-300">
                    <span>Initial Flag Drop:</span>
                    <span>12,000 SLSH ($1.20 USD)</span>
                  </div>
                </div>
              ) : (
                /* Mode 2: Search Destination with DB & Google live suggestions */
                <>
                  <div className="relative">
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">
                      Destination (Goobta Uu Tagayo) - Google & DB Search
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search place in Hargeisa (e.g. Mansoor, Airport, Waheen...)"
                        value={streetDestination}
                        onChange={(e) => handleStreetDestinationChange(e.target.value)}
                        className="w-full px-3.5 py-2.5 pr-8 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                      />
                      {isSearchingStreetPlaces && (
                        <div className="absolute right-2.5 top-2.5">
                          <div className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                    </div>

                    {/* Dropdown Suggestions */}
                    {streetHailSearchResults.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-20 max-h-48 overflow-y-auto divide-y divide-slate-700">
                        {streetHailSearchResults.map((place, idx) => (
                          <button
                            key={place.id || idx}
                            type="button"
                            onClick={() => handleSelectStreetPlace(place)}
                            className="w-full text-left p-2.5 hover:bg-slate-700/80 flex items-center justify-between text-xs text-white transition"
                          >
                            <div className="truncate pr-2">
                              <div className="font-bold text-slate-100 truncate">{place.name}</div>
                              <div className="text-[10px] text-slate-400 truncate">{place.address}</div>
                            </div>
                            <span className="text-[9px] font-bold bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded shrink-0">
                              Select
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Distance Slider / Selector */}
                  <div>
                    <div className="flex items-center justify-between mb-1 text-[11px] font-bold">
                      <span className="text-slate-300">Trip Distance:</span>
                      <span className="text-emerald-400 font-mono font-black">{streetHailDistanceKm.toFixed(1)} KM</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="25"
                      step="0.5"
                      value={streetHailDistanceKm}
                      onChange={(e) => setStreetHailDistanceKm(parseFloat(e.target.value) || 1)}
                      className="w-full accent-[#008751] cursor-pointer"
                    />
                  </div>

                  {/* Live Fare Display Card */}
                  <div className="p-3.5 bg-slate-800/90 border border-slate-700 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Total Calculated Fare:</span>
                      <div className="text-right">
                        <div className="text-base font-black text-emerald-400 font-mono">
                          {computedStreetFareSlsh.toLocaleString()} SLSH
                        </div>
                        <div className="text-[11px] text-slate-400 font-bold">
                          (${computedStreetFareUsd.toFixed(2)} USD)
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-700/60 text-[10.5px] text-slate-400 flex items-center justify-between">
                      <span>1st KM: 12,000 SLSH ($1.20)</span>
                      <span>Extra {Math.max(0, streetHailDistanceKm - 1).toFixed(1)} KM @ 7k/km</span>
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">Payment Method</label>
                <select
                  value={streetPaymentMethod}
                  onChange={(e) => setStreetPaymentMethod(e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs focus:outline-none focus:border-emerald-500"
                >
                  <option value="cash">Cash (Lacag Caan Ah / SLSH)</option>
                  <option value="wallet">Wadaage Wallet</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const isMeter = standingMode === 'open_meter';
                    if (createStreetHailRide) {
                      createStreetHailRide({
                        name: streetPassengerName || 'Standing Passenger',
                        phone: streetPassengerPhone || '+252630000000',
                        destinationAddress: isMeter ? '' : (streetDestination || 'Standing Pickup Destination'),
                        fareUsd: isMeter ? 1.20 : computedStreetFareUsd,
                        distanceKm: isMeter ? 0.0 : streetHailDistanceKm,
                        isLiveTaximeter: isMeter,
                        paymentMethod: streetPaymentMethod,
                      });
                    }
                    setShowStreetHailModal(false);
                    setStreetPassengerName('');
                    setStreetPassengerPhone('');
                    setStreetDestination('');
                    setStreetHailSearchResults([]);
                  }}
                  className="w-full py-3.5 rounded-2xl bg-[#008751] hover:bg-[#007445] text-white font-extrabold text-xs uppercase tracking-wider transition shadow-lg shadow-emerald-900/40 flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
                >
                  <CheckCircle className="w-4 h-4 text-emerald-200" />
                  <span>
                    {standingMode === 'open_meter'
                      ? '🚀 Start Live Taximeter Trip (12,000 SLSH)'
                      : `Start Standing Taxi Trip (${computedStreetFareSlsh.toLocaleString()} SLSH)`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trip Completion & Payment Receipt Modal */}
      {showTripSummaryModal && completedTripSummary && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border-2 border-emerald-500/80 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-white space-y-4">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center mb-2">
                <CheckCircle className="w-7 h-7" />
              </div>
              <h3 className="font-black text-lg text-white">Safarkii Wuu Dhammaaday</h3>
              <p className="text-xs text-slate-400">Trip Completed • Collect Payment</p>
            </div>

            {/* Big Total Price Display */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-emerald-500/30 text-center space-y-1">
              <span className="text-[11px] uppercase font-bold text-slate-400">Total Price to Collect</span>
              <div className="text-2xl font-black text-emerald-400 font-mono">
                {completedTripSummary.totalFareSlsh.toLocaleString()} SLSH
              </div>
              <div className="text-xs font-bold text-slate-400">
                (${completedTripSummary.totalFareUsd.toFixed(2)} USD)
              </div>
            </div>

            {/* Itemized Calculation Breakdown - Separating Dropoff Price & Waiting Fee */}
            <div className="bg-slate-800/90 p-4 rounded-2xl border border-slate-700 space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span>Masaafada Safarka (Distance):</span>
                <span className="font-bold text-white font-mono">{completedTripSummary.distanceKm.toFixed(2)} KM</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Wakhtiga Safarka (Duration):</span>
                <span className="font-bold text-white font-mono">{completedTripSummary.durationMins} mins</span>
              </div>

              {/* 1. SEPARATE DROPOFF FARE */}
              <div className="pt-2 border-t border-slate-700/80 flex items-center justify-between">
                <span className="font-bold text-slate-200 flex items-center gap-1">
                  <span>🚗</span>
                  <span>Qiimaha Safarka (Dropoff Price):</span>
                </span>
                <div className="text-right">
                  <span className="font-mono font-black text-white text-xs block">
                    {completedTripSummary.dropoffFareSlsh.toLocaleString()} SLSH
                  </span>
                  <span className="text-[10px] text-slate-400 block font-semibold">
                    (${completedTripSummary.dropoffFareUsd.toFixed(2)} USD)
                  </span>
                </div>
              </div>

              {/* 2. SEPARATE WAITING FEE */}
              <div className="flex items-center justify-between">
                <span className={`font-bold flex items-center gap-1 ${completedTripSummary.waitingMinutes > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                  <span>⏱️</span>
                  <span>Sugitaanka ({completedTripSummary.waitingMinutes} daq @ 500 SLSH):</span>
                </span>
                <div className="text-right">
                  <span className={`font-mono font-black text-xs block ${completedTripSummary.waitingMinutes > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                    +{completedTripSummary.waitingFeeSlsh.toLocaleString()} SLSH
                  </span>
                  <span className="text-[10px] text-slate-400 block font-semibold">
                    (+${completedTripSummary.waitingFeeUsd.toFixed(2)} USD)
                  </span>
                </div>
              </div>

              {/* 3. FINAL TOTAL SUM */}
              <div className="pt-2 border-t border-emerald-500/30 flex items-center justify-between bg-slate-950/60 p-2.5 rounded-xl border border-slate-700">
                <span className="font-black text-emerald-400 text-xs flex items-center gap-1">
                  <span>💰</span>
                  <span>Wadarta Guud (Final Total):</span>
                </span>
                <div className="text-right">
                  <span className="font-mono font-black text-emerald-400 text-sm block">
                    {completedTripSummary.totalFareSlsh.toLocaleString()} SLSH
                  </span>
                  <span className="text-[10px] text-slate-400 block font-bold">
                    (${completedTripSummary.totalFareUsd.toFixed(2)} USD)
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>Habka Lacag-bixinta:</span>
                <span className="font-bold text-emerald-400 uppercase">{completedTripSummary.paymentMethod}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowTripSummaryModal(false);
                setCompletedTripSummary(null);
                advanceDriverRideState();
              }}
              className="w-full py-4 rounded-2xl bg-[#008751] hover:bg-[#007445] text-white font-black text-sm uppercase tracking-wider transition shadow-lg shadow-emerald-900/40 flex items-center justify-center space-x-2 cursor-pointer active:scale-95"
            >
              <Check className="w-5 h-5" />
              <span>Confirm Payment & Finish Trip</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
