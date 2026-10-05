import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { CITY_LOCATIONS, INITIAL_PRICING, INITIAL_DRIVERS, INITIAL_DRIVER_APPLICATIONS, PROMO_CODES, VEHICLE_CATEGORY_DETAILS, INITIAL_COMMUTER_PASSES, INITIAL_INTERCITY_TRIPS, HARGEISA_DEMAND_HOTSPOTS } from '../data/mockData';
import { Language, translations } from '../data/translations';
import {
  AuthUser,
  ChatMessage,
  Driver,
  DriverApplication,
  DriverApplicationStatus,
  LocationNode,
  PricingSettings,
  PromoCode,
  RideRequest,
  RideStatus,
  SharedCoPassenger,
  UserRole,
  VehicleCategory,
  WalletTransaction,
  DriverWalletTransaction,
  CommuterPass,
  UserCommuterPass,
  IntercityTrip,
  IntercityBooking,
  HeatmapHotspot,
  BeaconColor,
  WaypointSequenceItem,
  VoiceCallSession,
  DriverGpsStatus,
} from '../types';
import { sounds } from '../utils/audio';
import { voiceCallService } from '../services/voiceCallService';
import {
  calculateBearing,
  calculateDistanceKm,
  calculateDurationMins,
  calculateHeadingDelta,
  calculateVectorOverlap,
  computeFare,
  computeRoadBasedFare,
  estimateHargeisaRoadDistance,
  evaluateWadaageShareMatch,
  validateWadaageMatch,
  ValidateWadaageMatchResult,
  fetchRealHargeisaRoadRoute,
  HargeisaRoadRoute,
  EXCHANGE_RATE_USD_TO_SLSH,
  getOptimalSequence,
  getRandomBeaconColor,
  snapToNearestLandmarkAnchor,
  calculateHaversineDistanceKm,
} from '../utils/geo';
import { secureStorage, sanitizeInput, signPayload, safeJsonParse } from '../utils/security';
import {
  testFirebaseConnection,
  saveRideToFirestore,
  acceptRideAtomically,
  declineRideAtomically,
  subscribeToLiveRides,
  saveDriverToFirestore,
  subscribeToDrivers,
  saveSettingsToFirestore,
  subscribeToSettings,
  saveTransactionToFirestore,
  subscribeToTransactions,
  saveUserToFirestore,
  updateUserInFirestore,
  updateDriverInFirestore,
  updateDriverApplicationInFirestore,
  subscribeToUsers,
  saveDriverApplicationToFirestore,
  deleteApplicationFromFirestore,
  subscribeToDriverApplications,
  saveChatMessageToFirestore,
  subscribeToRideMessages,
} from '../services/firebase';
import {
  syncUserToHostinger,
  syncDriverToHostinger,
  syncRideToHostinger,
} from '../services/hostingerDbService';
import { getApiUrl } from '../services/apiConfig';
import { notificationService } from '../services/notificationService';

// Status Rank Hierarchy to prevent delayed server snapshots/polling from reverting active ride state transitions
const RIDE_STATUS_RANK: Record<string, number> = {
  idle: 0,
  searching: 1,
  accepted: 2,
  driver_arrived: 3,
  in_progress: 4,
  completed: 5,
  cancelled: 5,
};

// Cross-tab broadcast channel for instantaneous zero-latency syncing between Rider and Driver tabs
const rideBroadcastChannel =
  typeof window !== 'undefined' && 'BroadcastChannel' in window
    ? new BroadcastChannel('wadaage_ride_realtime_events')
    : null;

function broadcastRideEvent(type: string, payload: any) {
  try {
    if (rideBroadcastChannel) {
      rideBroadcastChannel.postMessage({ type, payload, timestamp: Date.now() });
    }
    // Also save to localStorage to trigger storage events across separate windows / webviews
    localStorage.setItem(
      'wadaage_last_broadcast_event',
      JSON.stringify({ type, payload, timestamp: Date.now() })
    );

    // Relay immediately to backend server for cross-device / APK sync
    if (payload && (payload.id || payload.pickup)) {
      fetch(getApiUrl('/api/rides/sync'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          broadcastType: type,
          serverUpdatedAt: Date.now(),
        }),
      }).catch(() => {});
    }
  } catch (e) {
    console.error(e);
  }
}

interface RideContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations['en'];
  isAuthenticated: boolean;
  currentUser: AuthUser | null;
  login: (user: AuthUser) => void;
  logout: () => void;
  role: UserRole;
  setRole: (role: UserRole) => void;
  drivers: Driver[];
  currentRide: RideRequest | null;
  pricing: PricingSettings;
  walletBalance: number;
  transactions: WalletTransaction[];
  chatMessages: ChatMessage[];
  unreadChatCount: number;
  markChatAsRead: () => void;
  appliedPromo: PromoCode | null;
  promoError: string | null;
  driverModeOnline: boolean;
  incomingDriverRequest: RideRequest | null;
  selectedCategory: VehicleCategory;
  setSelectedCategory: (cat: VehicleCategory) => void;
  pickupLocation: LocationNode;
  setPickupLocation: (loc: LocationNode) => void;
  realUserLocation: LocationNode | null;
  isDetectingLocation: boolean;
  detectUserRealLocation: () => Promise<LocationNode | null>;
  dropoffLocation: LocationNode;
  setDropoffLocation: (loc: LocationNode) => void;
  multiStops: LocationNode[];
  setMultiStops: React.Dispatch<React.SetStateAction<LocationNode[]>>;
  // Hargeisa Real Road Network Metrics
  roadRoute: HargeisaRoadRoute | null;
  roadDistanceKm: number;
  roadDurationMins: number;
  roadRouteSummary: string;
  isCalculatingRoadRoute: boolean;
  seatsBooked: number;
  setSeatsBooked: (seats: number) => void;
  poolingType: 'express_pool' | 'door_to_door';
  setPoolingType: (type: 'express_pool' | 'door_to_door') => void;
  genderPreference: 'any' | 'female_only';
  setGenderPreference: (pref: 'any' | 'female_only') => void;
  waitAndSaveTier: 'express' | 'wait_and_save';
  setWaitAndSaveTier: (tier: 'express' | 'wait_and_save') => void;
  isSubscriptionCommute: boolean;
  setIsSubscriptionCommute: (sub: boolean) => void;
  // Commuter Pass Subscriptions
  userPasses: UserCommuterPass[];
  purchaseCommuterPass: (pass: CommuterPass, paymentMethod: 'zaad' | 'edahab' | 'wallet') => { success: boolean; pass?: UserCommuterPass; message: string };
  activePassForCorridor: UserCommuterPass | null;
  // Inter-City Travel & Stay
  intercityTrips: IntercityTrip[];
  intercityBookings: IntercityBooking[];
  bookIntercitySeat: (
    tripId: string,
    seatsCount: number,
    passengerName: string,
    passengerPhone: string,
    paymentMethod: 'zaad' | 'edahab' | 'cash'
  ) => { success: boolean; booking?: IntercityBooking; message: string };
  // Heatmap Hotspots & Driver Incentive Bonusing
  heatmapHotspots: HeatmapHotspot[];
  claimDriverCorridorBonus: (hotspotId: string) => { success: boolean; bonusUsd: number; message: string };
  splitFareWith: { name: string; email: string; paid: boolean; shareAmount: number }[];
  setSplitFareWith: React.Dispatch<React.SetStateAction<{ name: string; email: string; paid: boolean; shareAmount: number }[]>>;
  addSplitFriend: (name: string, email: string) => void;
  rideOptions: {
    quietRide: boolean;
    acHigh: boolean;
    extraLuggage: boolean;
    petFriendly: boolean;
  };
  setRideOptions: React.Dispatch<React.SetStateAction<{
    quietRide: boolean;
    acHigh: boolean;
    extraLuggage: boolean;
    petFriendly: boolean;
  }>>;
  // Driver Prepaid Commission Wallet
  driverWallets: Record<string, number>;
  driverWalletBalanceUsd: number;
  driverWalletTransactions: DriverWalletTransaction[];
  getDriverWalletBalance: (driverId: string) => number;
  getUserWalletBalance: (userId: string) => number;
  adminCreditDriverWallet: (driverId: string, amountUsdOrSos: number, isSos?: boolean, note?: string) => void;
  adminAdjustDriverWallet: (
    driverId: string,
    operation: 'add' | 'deduct' | 'set',
    amountUsdOrSos: number,
    isSos?: boolean,
    note?: string
  ) => { success: boolean; newBalanceUsd: number; newBalanceSos: number; message: string };
  adminCreditUserWallet: (userId: string, amountUsd: number, note?: string) => void;
  topUpUserWallet: (userId: string, amountUsd: number, note?: string) => void;
  topUpDriverWallet: (
    amountUsd: number,
    paymentProvider: 'zaad' | 'evc' | 'edahab' | 'card',
    phone?: string,
    referenceId?: string,
    smsText?: string,
    targetDriverId?: string
  ) => { success: boolean; message: string; txId?: string; newBalanceUsd?: number; newBalanceSos?: number };
  verifyPaymentReceipt: (
    referenceId: string,
    amountSos: number,
    paymentProvider: 'zaad' | 'evc' | 'edahab' | 'card',
    phone: string,
    smsReceiptText?: string
  ) => { success: boolean; message: string; tx?: DriverWalletTransaction };
  approveDriverPendingTransaction: (txId: string) => void;
  verifyAndApproveDriverTopUp: (txId: string, realAmountSos: number, adminNote?: string) => void;
  rejectDriverPendingTransaction: (txId: string, adminNote?: string) => void;
  adminDirectCreditDriverWallet: (driverId: string, amountSos: number, note?: string) => void;
  lowBalanceLockoutAlert: boolean;
  dismissLowBalanceAlert: () => void;
  selfOrderAlertMsg: string | null;
  dismissSelfOrderAlert: () => void;
  // Dynamic Flow & Stacking Actions
  autoAcceptOnRouteShares: boolean;
  toggleAutoAcceptShares: () => void;
  dispatchBatchPoolRideNow: () => void;
  stackPassengerToActiveRide: (passengerData?: Partial<RideRequest>) => void;
  // Actions
  bookRide: (
    paymentMethod: 'wallet' | 'card' | 'cash',
    bookingForSomeoneElse?: { name: string; phone: string },
    isBookByBid?: boolean,
    targetBidPriceUsd?: number,
    scheduledTime?: string
  ) => void;
  acceptBid: (bidId: string) => void;
  cancelRide: () => void;
  acceptRideByDriver: (driverId?: string) => Promise<{ success: boolean; conflict?: boolean; ride?: RideRequest; message?: string } | void> | void;
  orderSecondRiderForWadaageShare: () => void;
  declineRideByDriver: (decliningDriverId?: string) => Promise<void> | void;
  transferRideToAnotherDriver: (targetDriverId?: string) => { success: boolean; message: string; nextDriverName?: string };
  advanceDriverRideState: () => void;
  advanceIndividualRiderAction?: (target: 'RIDER_A' | 'RIDER_B', action: 'arrived' | 'pickup' | 'dropoff') => void;
  toggleDropoffPriority?: () => void;
  cancelIndividualRider?: (target: 'RIDER_A' | 'RIDER_B', reason?: string) => void;
  setCurrentRide: (ride: RideRequest | null) => void;
  rateAndTipRide: (rating: number, tip: number) => void;
  topUpWallet: (amount: number) => void;
  applyPromoCode: (codeStr: string) => boolean;
  removePromoCode: () => void;
  sendMessage: (text: string) => void;
  updatePricing: (newPricing: Partial<PricingSettings>) => void;
  approveDriver: (driverId: string) => void;
  toggleDriverOnline: (online: boolean) => boolean;
  resetRideState: () => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  dispatchDriverToRide: (rideId: string, driverId: string) => void;
  getDriverCoordinates: () => { lat: number; lng: number };
  getDispatchRadiusKm: (category?: string) => number;
  isOrderWithinDriverDispatchRadius: (ride: { pickup?: { lat: number; lng: number }; category?: string } | null | undefined) => { isWithinRadius: boolean; distanceKm: number; allowedRadiusKm: number };
  validateWadaageMatch: (currentTrip: any, newRequest: any, driverLoc?: { lat: number; lng: number }, options?: any) => ValidateWadaageMatchResult;
  createStreetHailRide?: (passengerData: { name?: string; phone?: string; destinationAddress?: string; fareUsd?: number; distanceKm?: number; isLiveTaximeter?: boolean; paymentMethod?: 'cash' | 'wallet' }) => void;
  updateTaximeterTraveledKm?: (
    addedOrState:
      | number
      | {
          totalKm?: number;
          addedKm?: number;
          fareUsd?: number;
          fareSlsh?: number;
          elapsedSeconds?: number;
          broadcast?: boolean;
        }
  ) => void;
  // Live Standing-Pickup Taximeter (real GPS odometer shared by driver & rider)
  meterKm: number;
  meterSeconds: number;
  meterFareUsd: number;
  meterFareSlsh: number;
  isMeterRunning: boolean;
  meterFirstKmSlsh: number;
  meterExtraKmSlsh: number;
  // Normal Taxi In-Trip Waiting Meter (500 SLSH / minute)
  toggleWaitingTime: (rideId?: string) => void;
  updateWaitingTime: (seconds: number, rideId?: string) => void;
  resetWaitingTime: (rideId?: string) => void;
  // User & Driver Direct Registration (with WhatsApp OTP)
  registerRider: (userData: { name: string; phone: string; email?: string; password?: string }) => AuthUser;
  updateUserPassword: (userIdOrPhone: string, newPassword: string) => Promise<boolean>;
  registerDriver: (driverData: { name: string; phone: string; password?: string; vehicleCategory: VehicleCategory; vehicleModel?: string; licensePlate?: string; vehicleColor?: string; autoApprove?: boolean }) => { driver: Driver; user: AuthUser; application: DriverApplication };
  // Driver Onboarding & Admin Verification
  driverApplications: DriverApplication[];
  submitDriverApplication: (appData: Omit<DriverApplication, 'id' | 'status' | 'submittedAt'>) => DriverApplication;
  updateDriverApplicationStatus: (appId: string, status: DriverApplicationStatus, adminNote?: string) => void;
  deleteDriverApplication: (appId: string) => void;
  // In-App WebRTC Encrypted Voice Call
  activeCallSession: VoiceCallSession | null;
  initiateVoiceCall: () => Promise<void>;
  answerVoiceCall: () => Promise<void>;
  endVoiceCall: () => Promise<void>;
  rejectVoiceCall: () => Promise<void>;
  isCallModalOpen: boolean;
  setIsCallModalOpen: (open: boolean) => void;
  // Live Telematics & System Integration
  allPlatformRides: RideRequest[];
  driverGpsStatus: DriverGpsStatus;
  recalibrateDriverGps: () => Promise<boolean>;
  toggleDriverLiveGps: (enable?: boolean) => void;
  updateDriverLiveCoordinates: (
    lat: number,
    lng: number,
    accuracy?: number,
    heading?: number,
    speed?: number,
    isHardware?: boolean
  ) => void;
}

const getInitialActiveRole = (): UserRole => {
  try {
    // 1. Native APK builds are locked to their own app
    const nativeContainer =
      typeof (window as any).Capacitor !== 'undefined' ||
      (window as any).isNativeApp === true ||
      window.location.protocol === 'file:' ||
      window.location.origin.includes('capacitor://') ||
      navigator.userAgent.includes('WadaageRider') ||
      navigator.userAgent.includes('WadaageDriver');

    const envMode = (import.meta as any).env?.VITE_APP_MODE || (import.meta as any).env?.MODE;
    if (envMode === 'rider' || envMode === 'passenger') return 'passenger';
    if (envMode === 'driver') return 'driver';
    if (envMode === 'admin') return 'admin';

    if (nativeContainer) {
      if (navigator.userAgent.includes('WadaageDriver')) return 'driver';
      if (navigator.userAgent.includes('WadaageRider')) return 'passenger';
      const storedNativeRole = localStorage.getItem('wadaage_app_view');
      if (storedNativeRole === 'driver') return 'driver';
      if (storedNativeRole === 'admin') return 'admin';
      return 'passenger';
    }

    // 2. WEB ROUTING: / = website, /rider, /driver, /admin — path always wins
    const params = new URLSearchParams(window.location.search);
    const appParam = params.get('app')?.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    const pathname = window.location.pathname.toLowerCase();
    const hostname = window.location.hostname.toLowerCase();

    if (appParam === 'admin' || hostname.startsWith('admin.') || /^\/admin(\/|$)/.test(pathname) || hash.includes('admin')) {
      return 'admin';
    }
    if (appParam === 'driver' || hostname.startsWith('driver.') || /^\/driver(\/|$)/.test(pathname) || hash.includes('driver')) {
      return 'driver';
    }
    if (appParam === 'rider' || appParam === 'passenger' || hostname.startsWith('rider.') || /^\/(rider|passenger)(\/|$)/.test(pathname) || hash.includes('rider')) {
      return 'passenger';
    }

    // The public welcome website (and any other path) uses the default passenger role.
    // App.tsx renders the website itself for '/', so no role switch is needed here.
    if (pathname === '/' || pathname === '' || appParam === 'website' || appParam === 'home' || hash.includes('website')) {
      return 'passenger';
    }

    const storedView = localStorage.getItem('wadaage_app_view');
    if (storedView === 'driver') return 'driver';
    if (storedView === 'admin') return 'admin';
    if (storedView === 'rider') return 'passenger';

    const storedRole = localStorage.getItem('wadaage_role') as UserRole | null;
    if (storedRole && (storedRole === 'driver' || storedRole === 'admin' || storedRole === 'passenger')) {
      return storedRole;
    }
  } catch {}
  return 'passenger';
};

const getStoredUserForRole = (targetRole: UserRole): AuthUser | null => {
  try {
    const roleKey = `wadaage_auth_${targetRole}`;
    const savedRole = secureStorage.getItem<AuthUser>(roleKey);
    if (savedRole && savedRole.role === targetRole) return savedRole;

    const savedGlobal = secureStorage.getItem<AuthUser>('wadaage_auth_user');
    if (savedGlobal && savedGlobal.role === targetRole) return savedGlobal;
  } catch {}

  // Require explicit login/registration first
  return null;
};

const RideContext = createContext<RideContextType | undefined>(undefined);

export const RideProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isBookingRideRef = useRef<boolean>(false);
  const isActionPendingRef = useRef<boolean>(false);
  const cancelledRideIdsRef = useRef<Set<string>>(
    (() => {
      try {
        const saved = localStorage.getItem('wadaage_cancelled_ride_ids');
        return new Set<string>(saved ? JSON.parse(saved) : []);
      } catch {
        return new Set<string>();
      }
    })()
  );
  const dismissedRideIdsRef = useRef<Set<string>>(
    (() => {
      try {
        const saved = localStorage.getItem('wadaage_dismissed_ride_ids');
        return new Set<string>(saved ? JSON.parse(saved) : []);
      } catch {
        return new Set<string>();
      }
    })()
  );

  const markRideAsDismissed = useCallback((rideId: string) => {
    if (!rideId) return;
    dismissedRideIdsRef.current.add(rideId);
    try {
      localStorage.setItem('wadaage_dismissed_ride_ids', JSON.stringify(Array.from(dismissedRideIdsRef.current).slice(-200)));
    } catch {}
  }, []);

  const markRideAsCancelled = useCallback((rideId: string) => {
    if (!rideId) return;
    cancelledRideIdsRef.current.add(rideId);
    try {
      localStorage.setItem('wadaage_cancelled_ride_ids', JSON.stringify(Array.from(cancelledRideIdsRef.current).slice(-200)));
    } catch {}
  }, []);

  const chargedRideIdsRef = useRef<Set<string>>(
    (() => {
      try {
        const saved = localStorage.getItem('wadaage_charged_ride_ids');
        return new Set<string>(saved ? JSON.parse(saved) : []);
      } catch {
        return new Set<string>();
      }
    })()
  );
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      return (localStorage.getItem('wadaage_language') as Language) || 'so';
    } catch {
      return 'so';
    }
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('wadaage_language', lang);
    } catch {}
  }, []);

  const t = translations[language] || translations.so;

  const [role, setRoleState] = useState<UserRole>(getInitialActiveRole);

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    return getStoredUserForRole(getInitialActiveRole());
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return !!getStoredUserForRole(getInitialActiveRole());
  });

  const setRole = useCallback((newRole: UserRole) => {
    setRoleState((prevRole) => {
      if (prevRole === newRole) return prevRole;
      const existingUser = getStoredUserForRole(newRole);
      if (existingUser) {
        setCurrentUser(existingUser);
        setIsAuthenticated(true);
      } else {
        // Must prompt for login screen if no authenticated user for this role
        setCurrentUser(null);
        setIsAuthenticated(false);
      }
      return newRole;
    });
  }, []);

  const login = (user: AuthUser) => {
    // Invalidate stale balance caches on login so new/switching driver fetches fresh server balance
    try {
      localStorage.removeItem('wadaage_driver_wallet_balance');
    } catch (e) {
      console.error(e);
    }
    setCurrentUser(user);
    setIsAuthenticated(true);
    setRoleState(user.role);
    try {
      secureStorage.setItem('wadaage_auth_user', user);
      secureStorage.setItem(`wadaage_auth_${user.role}`, user);
      saveUserToFirestore(user);
      syncUserToHostinger(user);
      // Also register in registered users list
      const registeredUsers: AuthUser[] = secureStorage.getItem<AuthUser[]>('wadaage_registered_users') || [];
      if (!registeredUsers.some((u) => u.id === user.id || u.phone === user.phone)) {
        registeredUsers.push(user);
        secureStorage.setItem('wadaage_registered_users', registeredUsers);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const logout = () => {
    try {
      secureStorage.removeItem('wadaage_auth_user');
      secureStorage.removeItem(`wadaage_auth_${role}`);
      // Completely invalidate local balance caches on logout so next driver never inherits stale balance display
      localStorage.removeItem('wadaage_driver_wallet_balance');
      localStorage.removeItem('wadaage_driver_wallets_map');
      localStorage.removeItem('wadaage_driver_wallet_transactions');
    } catch (e) {
      console.error(e);
    }
    setDriverWallets({});
    setDriverWalletTransactions([]);
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  // Drivers and Driver Applications initialized with verified records by default
  const [drivers, setDrivers] = useState<Driver[]>(() => {
    try {
      const saved = localStorage.getItem('wadaage_registered_drivers');
      if (saved) {
        const parsed = safeJsonParse(saved, null);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_DRIVERS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('wadaage_registered_drivers', JSON.stringify(drivers));
    } catch (e) {
      console.error(e);
    }
  }, [drivers]);

  const [driverApplications, setDriverApplications] = useState<DriverApplication[]>(() => {
    try {
      const saved = localStorage.getItem('wadaage_driver_applications');
      if (saved) {
        const parsed = safeJsonParse(saved, null);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_DRIVER_APPLICATIONS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('wadaage_driver_applications', JSON.stringify(driverApplications));
    } catch (e) {
      console.error(e);
    }
  }, [driverApplications]);
  const [pricing, setPricing] = useState<PricingSettings>(() => {
    try {
      const saved = localStorage.getItem('wadaage_pricing_settings');
      if (saved) {
        const parsed = safeJsonParse(saved, null);
        if (parsed && typeof parsed === 'object') {
          return { ...INITIAL_PRICING, ...parsed };
        }
      }
    } catch (e) {
      console.error(e);
    }
    return INITIAL_PRICING;
  });
  // Multi-User Wallet Management Map (Isolated per Passenger ID)
  const [userWallets, setUserWallets] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('wadaage_user_wallets_map');
      if (saved) {
        const parsed = safeJsonParse(saved, null);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return {
      'usr_admin_baashe': 500.00,
    };
  });

  const getUserWalletBalance = useCallback((userId: string): number => {
    if (!userId) return 0;
    if (userWallets[userId] !== undefined) {
      return Number(userWallets[userId]) || 0;
    }
    const cleanLookup = String(userId).replace(/\D/g, '');
    for (const [key, val] of Object.entries(userWallets)) {
      if (key === userId) return Number(val) || 0;
      if (cleanLookup && key.replace(/\D/g, '') === cleanLookup) return Number(val) || 0;
    }
    return 0;
  }, [userWallets]);

  // Current active user's wallet balance
  const activeUserId = currentUser?.id || 'passenger_default';
  const walletBalance = getUserWalletBalance(activeUserId);

  const [transactions, setTransactions] = useState<WalletTransaction[]>(() => {
    try {
      const saved = localStorage.getItem('wadaage_user_wallet_transactions');
      if (saved) return safeJsonParse(saved, []);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('wadaage_user_wallets_map', JSON.stringify(userWallets));
      localStorage.setItem('wadaage_user_wallet_transactions', JSON.stringify(transactions));
    } catch (e) {
      console.error(e);
    }
  }, [userWallets, transactions]);

  // All Platform Rides (Recorded and stored permanently across Rider, Driver, and Admin)
  const [allPlatformRides, setAllPlatformRides] = useState<RideRequest[]>(() => {
    try {
      const stored = localStorage.getItem('wadaage_all_rides_history');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_e) {}
    return [];
  });

  useEffect(() => {
    if (allPlatformRides.length > 0) {
      try {
        localStorage.setItem('wadaage_all_rides_history', JSON.stringify(allPlatformRides.slice(0, 150)));
      } catch (_e) {}
    }
  }, [allPlatformRides]);

  // Driver Real-Time Hardware GPS Telematics State
  const [driverGpsStatus, setDriverGpsStatus] = useState<DriverGpsStatus>({
    active: false,
    lat: 9.5600,
    lng: 44.0650,
    accuracy: 5,
    heading: 0,
    speed: 0,
    lastUpdated: Date.now(),
    isRealHardwareGps: false,
    permissionState: 'prompt',
    source: 'network',
  });
  const [driverLiveGpsEnabled, setDriverLiveGpsEnabled] = useState<boolean>(true);
  const [driverModeOnline, setDriverModeOnline] = useState<boolean>(true);

  const defaultPickup: LocationNode = CITY_LOCATIONS.find((p) => p.name.toLowerCase().includes('ina naxar') || p.id.includes('naxar')) || {
    id: 'ina_naxar_street',
    name: 'Ina Naxar street',
    address: 'Ina Naxar Street, Road 1 & Road 2 Corridor, 26 June District, Hargeisa',
    lat: 9.5605,
    lng: 44.0750,
  };
  const defaultDropoff: LocationNode = CITY_LOCATIONS.find((p) => p.name.toLowerCase().includes('berbera') || p.id.includes('berbera')) || {
    id: 'berbera_bus_terminal',
    name: 'Berbera Bus Terminal (Istaanka Berbera)',
    address: 'East Highway, 26 June District, Hargeisa',
    lat: 9.5680,
    lng: 44.0850,
  };

  const [pickupLocation, setPickupLocation] = useState<LocationNode>(defaultPickup);
  const [realUserLocation, setRealUserLocation] = useState<LocationNode | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState<boolean>(false);
  const [dropoffLocation, setDropoffLocation] = useState<LocationNode>(defaultDropoff);

  const detectUserRealLocation = useCallback(async (): Promise<LocationNode | null> => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      return null;
    }
    setIsDetectingLocation(true);
    return new Promise<LocationNode | null>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = Number(pos.coords.latitude.toFixed(6));
          const lng = Number(pos.coords.longitude.toFixed(6));
          let locName = '📍 My Current Location (GPS)';
          let address = `Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;

          // Real human-readable reverse geocoding via server proxy
          try {
            const res = await fetch(`/api/geocode/reverse?lat=${lat}&lng=${lng}`);
            if (res.ok) {
              const data = await res.json();
              if (data && data.display_name) {
                const parts = data.display_name.split(',');
                locName = parts[0] ? parts[0].trim() : 'Current Location';
                address = data.display_name;
              }
            }
          } catch (e) {
            // Keep coordinates fallback
          }

          const userLoc: LocationNode = {
            id: 'user_real_location',
            name: locName,
            address: address,
            lat,
            lng,
            zone: 'Current Location',
          };
          setRealUserLocation(userLoc);
          setPickupLocation(userLoc);
          setIsDetectingLocation(false);
          resolve(userLoc);
        },
        (err) => {
          if (!err.message?.toLowerCase().includes('permissions policy')) {
            console.warn('Geolocation lookup issue or permission dismissed:', err.message);
          }
          setIsDetectingLocation(false);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 30000,
        }
      );
    });
  }, []);

  // Automatically request and set personal real GPS location as first pickup on app mount
  useEffect(() => {
    detectUserRealLocation();
  }, [detectUserRealLocation]);

  // Update Driver Live Coordinates with Telematics broadcast
  const updateDriverLiveCoordinates = useCallback((
    lat: number,
    lng: number,
    accuracy = 5,
    heading = 0,
    speed = 0,
    isHardware = true
  ) => {
    const latFixed = Number(lat.toFixed(6));
    const lngFixed = Number(lng.toFixed(6));

    // Feed the live taximeter odometer with every real hardware fix (driver only)
    if (roleRef.current === 'driver' && isHardware) {
      try { accumulateMeterFromGpsRef.current(latFixed, lngFixed); } catch {}
    }

    setDriverGpsStatus({
      active: true,
      lat: latFixed,
      lng: lngFixed,
      accuracy: Math.round(accuracy),
      heading: Math.round(heading),
      speed: Math.round(speed),
      lastUpdated: Date.now(),
      isRealHardwareGps: isHardware,
      permissionState: 'granted',
      source: isHardware ? 'gps' : 'simulated',
    });

    setRealUserLocation((prev) => ({
      id: 'user_real_location',
      name: prev?.name || '📍 My Live GPS Location',
      address: `${latFixed.toFixed(4)}° N, ${lngFixed.toFixed(4)}° E`,
      lat: latFixed,
      lng: lngFixed,
      zone: 'Current Location',
    }));

    const driverId = currentUser?.id || 'live_driver';
    const driverName = currentUser?.name || 'Driver Partner';
    const driverPhone = currentUser?.phone || '';

    // 1. Synchronize Driver array state
    const curWalletBal = getDriverWalletBalance(driverId) || (driverPhone ? getDriverWalletBalance(driverPhone) : undefined);

    setDrivers((prev) => {
      const idx = prev.findIndex((d) => d.id === driverId || (driverPhone && d.phone === driverPhone));
      if (idx >= 0) {
        const updated = [...prev];
        const effectiveBal = curWalletBal !== undefined ? curWalletBal : updated[idx].walletBalanceUsd;
        updated[idx] = {
          ...updated[idx],
          currentLocation: { lat: latFixed, lng: lngFixed },
          status: driverModeOnline ? 'available' : 'offline',
          walletBalanceUsd: effectiveBal,
          wallet_balance_usd: effectiveBal,
        };
        try {
          saveDriverToFirestore(updated[idx]);
          syncDriverToHostinger(updated[idx]);
        } catch {}
        return updated;
      } else {
        const initialBal = curWalletBal !== undefined ? curWalletBal : 0;
        const newDriver: Driver = {
          id: driverId,
          name: driverName,
          phone: driverPhone,
          avatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          gender: 'male',
          rating: 5.0,
          totalTrips: 0,
          status: driverModeOnline ? 'available' : 'offline',
          isVerified: true,
          kycStatus: 'approved',
          currentLocation: { lat: latFixed, lng: lngFixed },
          vehicle: {
            model: 'Toyota Vitz',
            color: 'White',
            licensePlate: 'SL-8842',
            category: 'wadaage_taxi',
            capacity: 4,
          },
          todayEarnings: 0,
          weeklyEarnings: 0,
          hoursOnline: 1,
          acceptanceRate: 100,
          service_type: 'Both',
          walletBalanceUsd: initialBal,
          wallet_balance_usd: initialBal,
        };
        try {
          saveDriverToFirestore(newDriver);
          syncDriverToHostinger(newDriver);
        } catch {}
        return [newDriver, ...prev];
      }
    });

    // 2. Telematics POST to server
    try {
      fetch(getApiUrl('/api/drivers/location'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: driverId,
          name: driverName,
          phone: driverPhone,
          lat: latFixed,
          lng: lngFixed,
          heading: Math.round(heading),
          speed: Math.round(speed),
          accuracy: Math.round(accuracy),
          status: driverModeOnline ? 'available' : 'offline',
          category: 'wadaage_taxi',
        }),
      }).catch(() => {});
    } catch {}

    // 3. Broadcast to all open tabs and windows
    try {
      broadcastRideEvent('DRIVER_LOCATION_UPDATE', {
        driver: {
          id: driverId,
          name: driverName,
          phone: driverPhone,
          lat: latFixed,
          lng: lngFixed,
          heading: Math.round(heading),
          speed: Math.round(speed),
          status: driverModeOnline ? 'available' : 'offline',
        },
      });
    } catch {}
  }, [currentUser, driverModeOnline]);

  // Recalibrate Driver GPS immediately via Geolocation getCurrentPosition
  const recalibrateDriverGps = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      updateDriverLiveCoordinates(9.5600, 44.0650, 10, 0, 0, false);
      return false;
    }
    return new Promise<boolean>((resolve) => {
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
          resolve(true);
        },
        (err) => {
          console.warn('Driver GPS recalibrate fallback:', err.message);
          updateDriverLiveCoordinates(
            9.5600,
            44.0650,
            15,
            0,
            0,
            false
          );
          resolve(false);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    });
  }, [updateDriverLiveCoordinates]);

  // Toggle Driver Live Real Location Tracking
  const toggleDriverLiveGps = useCallback((enable?: boolean) => {
    setDriverLiveGpsEnabled((prev) => {
      const next = enable !== undefined ? enable : !prev;
      if (next) {
        recalibrateDriverGps();
      }
      return next;
    });
  }, [recalibrateDriverGps]);

  // Continuous Real-Time GPS Tracking for Drivers (Hardware Watch + Active Heartbeat)
  useEffect(() => {
    const isDriverActive = role === 'driver' || driverModeOnline;
    if (!isDriverActive || !driverLiveGpsEnabled) return;

    let watchId: number | null = null;
    let heartbeatTimer: NodeJS.Timeout | null = null;

    if (typeof window !== 'undefined' && navigator.geolocation) {
      try {
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
            if (!err.message?.toLowerCase().includes('permissions policy')) {
              console.warn('Continuous driver GPS watch message:', err.message);
            }
          },
          {
            enableHighAccuracy: true,
            maximumAge: 3000,
            timeout: 10000,
          }
        );
      } catch (e) {
        console.warn('Failed to start continuous driver GPS watch:', e);
      }
    }

    // Telemetry Heartbeat: maintains stationary hardware GPS status without random drift
    heartbeatTimer = setInterval(() => {
      setDriverGpsStatus((current) => {
        return current;
      });
    }, 5000);

    return () => {
      if (watchId !== null && typeof window !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchId);
      }
      if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
      }
    };
  }, [role, driverModeOnline, driverLiveGpsEnabled, updateDriverLiveCoordinates]);

  // Helper: Resolve current driver's real-time GPS location
  const getDriverCoordinates = useCallback((): { lat: number; lng: number } => {
    if (driverGpsStatus && driverGpsStatus.active && typeof driverGpsStatus.lat === 'number' && typeof driverGpsStatus.lng === 'number') {
      return { lat: driverGpsStatus.lat, lng: driverGpsStatus.lng };
    }
    if (realUserLocation && typeof realUserLocation.lat === 'number' && typeof realUserLocation.lng === 'number') {
      return { lat: realUserLocation.lat, lng: realUserLocation.lng };
    }
    const currentDriverObj = drivers.find((d) => d.id === currentUser?.id || d.phone === currentUser?.phone);
    if (currentDriverObj?.currentLocation && typeof currentDriverObj.currentLocation.lat === 'number' && typeof currentDriverObj.currentLocation.lng === 'number') {
      return currentDriverObj.currentLocation;
    }
    // Fallback: central Hargeisa
    return { lat: 9.5600, lng: 44.0600 };
  }, [driverGpsStatus, realUserLocation, drivers, currentUser]);

  // Helper: Retrieve admin-configured Driver Dispatch Search Radius in KM (per category or global)
  const getDispatchRadiusKm = useCallback((category?: string): number => {
    if (category && pricing?.categoryConfigs?.[category]?.dispatchRadiusKm !== undefined) {
      return Number(pricing.categoryConfigs[category].dispatchRadiusKm);
    }
    if (pricing?.dispatchRadiusKm !== undefined) {
      return Number(pricing.dispatchRadiusKm);
    }
    return 1.0; // Strict 1.0 KM limit default
  }, [pricing]);

  // Helper: Check if an incoming order is within the driver's GPS dispatch search radius
  const isOrderWithinDriverDispatchRadius = useCallback((
    ride: { pickup?: { lat: number; lng: number }; category?: string; currentOfferedDriverId?: string } | null | undefined
  ): { isWithinRadius: boolean; distanceKm: number; allowedRadiusKm: number } => {
    const configuredRadius = getDispatchRadiusKm(ride?.category);
    // Dynamic city threshold: allow city-wide dispatch radius (15.0 km) so active drivers across Hargeisa receive trips
    const allowedRadiusKm = Math.max(configuredRadius || 1.0, 15.0);
    if (!ride || !ride.pickup || typeof ride.pickup.lat !== 'number' || typeof ride.pickup.lng !== 'number') {
      return { isWithinRadius: true, distanceKm: 0.3, allowedRadiusKm };
    }
    const driverCoords = getDriverCoordinates();
    const distKm = calculateDistanceKm(driverCoords.lat, driverCoords.lng, ride.pickup.lat, ride.pickup.lng);
    const roundedDist = Math.round(distKm * 10) / 10;

    const isExplicitlyTargeted = !!(
      ride.currentOfferedDriverId &&
      currentUser &&
      (ride.currentOfferedDriverId === currentUser.id ||
        ride.currentOfferedDriverId === `drv_${currentUser.id}` ||
        ride.currentOfferedDriverId === currentUser.phone)
    );

    return {
      isWithinRadius: isExplicitlyTargeted || roundedDist <= allowedRadiusKm,
      distanceKm: roundedDist,
      allowedRadiusKm,
    };
  }, [getDriverCoordinates, getDispatchRadiusKm, currentUser]);

  // Sequential Proximity Candidate Resolver: Identifies the single nearest online driver via Haversine formula
  const getNearestDriverCandidate = useCallback((
    ride: { pickup?: { lat: number; lng: number }; category?: string; service_type?: string; isShared?: boolean } | null | undefined,
    availableDrivers: Driver[],
    declinedDriverIds: string[] = []
  ): { driver: Driver; distanceKm: number } | null => {
    if (!ride || !ride.pickup || typeof ride.pickup.lat !== 'number' || typeof ride.pickup.lng !== 'number') {
      return null;
    }

    const pickupLat = ride.pickup.lat;
    const pickupLng = ride.pickup.lng;

    // Filter available candidates
    const eligible = availableDrivers.filter((drv) => {
      // 1. Must be online, not occupied with another non-share trip, AND have prepaid wallet balance >= 0.10 USD (1,000 SLSH)
      const minThresholdUsd = pricing?.driverMinWalletThresholdUsd || 0.10;
      const drvBal = drv.walletBalanceUsd !== undefined ? Number(drv.walletBalanceUsd) : (getDriverWalletBalance ? getDriverWalletBalance(drv.id) : 0);
      if (drv.status === 'busy' || drv.status === 'offline' || drvBal < minThresholdUsd) return false;

      // 2. Must not have declined this order
      if (declinedDriverIds.includes(drv.id) || (drv.phone && declinedDriverIds.includes(drv.phone))) {
        return false;
      }

      // 3. Service type / vehicle category compatibility
      const driverVehicleCat = drv.vehicle?.category;
      const isDualOrUniversal =
        !driverVehicleCat ||
        driverVehicleCat === 'wadaage_both' ||
        drv.service_type === 'Both' ||
        !drv.service_type;
      const driverServiceType =
        drv.service_type ||
        (driverVehicleCat === 'wadaage_share' ? 'Wadaage' : isDualOrUniversal ? 'Both' : 'Normal');

      const isOrderWadaage = ride.service_type === 'Wadaage' || ride.category === 'wadaage_share' || ride.isShared;
      const isOrderNormal =
        ride.service_type === 'Normal' ||
        ride.category === 'wadaage_taxi' ||
        ride.category === 'wadaage_car' ||
        (!ride.isShared && ride.category !== 'wadaage_share');

      if (driverServiceType === 'Wadaage' && !isOrderWadaage) return false;
      if (driverServiceType === 'Normal' && !isOrderNormal && !isDualOrUniversal) return false;

      // 4. Must have valid GPS location
      if (!drv.currentLocation || typeof drv.currentLocation.lat !== 'number' || typeof drv.currentLocation.lng !== 'number') {
        return false;
      }

      return true;
    });

    if (eligible.length === 0) return null;

    // Calculate exact Haversine distance
    const scored = eligible.map((drv) => {
      const dist = calculateHaversineDistanceKm(pickupLat, pickupLng, drv.currentLocation.lat, drv.currentLocation.lng);
      return { driver: drv, distanceKm: dist };
    });

    // Sort strictly ascending by distance, prioritizing currently active human driver if distance is reasonable
    scored.sort((a, b) => {
      const aIsActiveHuman = currentUser?.role === 'driver' && (a.driver.id === currentUser.id || (currentUser.phone && a.driver.phone === currentUser.phone));
      const bIsActiveHuman = currentUser?.role === 'driver' && (b.driver.id === currentUser.id || (currentUser.phone && b.driver.phone === currentUser.phone));
      if (aIsActiveHuman && !bIsActiveHuman) return -1;
      if (!aIsActiveHuman && bIsActiveHuman) return 1;
      return a.distanceKm - b.distanceKm;
    });

    return scored[0];
  }, [currentUser]);

  const [multiStops, setMultiStops] = useState<LocationNode[]>([]);

  // Real Road Routing state for exact Hargeisa road km & duration
  const [roadRoute, setRoadRoute] = useState<HargeisaRoadRoute | null>(null);
  const [roadDistanceKm, setRoadDistanceKm] = useState<number>(() => {
    const init = estimateHargeisaRoadDistance(CITY_LOCATIONS[0].lat, CITY_LOCATIONS[0].lng, CITY_LOCATIONS[1].lat, CITY_LOCATIONS[1].lng);
    return init.distanceKm;
  });
  const [roadDurationMins, setRoadDurationMins] = useState<number>(() => {
    const init = estimateHargeisaRoadDistance(CITY_LOCATIONS[0].lat, CITY_LOCATIONS[0].lng, CITY_LOCATIONS[1].lat, CITY_LOCATIONS[1].lng);
    return init.durationMins;
  });
  const [roadRouteSummary, setRoadRouteSummary] = useState<string>(() => {
    const init = estimateHargeisaRoadDistance(CITY_LOCATIONS[0].lat, CITY_LOCATIONS[0].lng, CITY_LOCATIONS[1].lat, CITY_LOCATIONS[1].lng);
    return init.summary;
  });
  const [isCalculatingRoadRoute, setIsCalculatingRoadRoute] = useState<boolean>(false);

  // Reactively calculate real Hargeisa road route whenever pickup, dropoff, or multiStops change
  useEffect(() => {
    if (!pickupLocation || !dropoffLocation) return;

    // 1. Instant calculation from Hargeisa topological road matrix (0ms latency)
    const instantEst = estimateHargeisaRoadDistance(
      pickupLocation.lat,
      pickupLocation.lng,
      dropoffLocation.lat,
      dropoffLocation.lng
    );
    let initialKm = instantEst.distanceKm;
    if (multiStops.length > 0) {
      let curLat = pickupLocation.lat;
      let curLng = pickupLocation.lng;
      let total = 0;
      for (const stop of multiStops) {
        total += estimateHargeisaRoadDistance(curLat, curLng, stop.lat, stop.lng).distanceKm;
        curLat = stop.lat;
        curLng = stop.lng;
      }
      total += estimateHargeisaRoadDistance(curLat, curLng, dropoffLocation.lat, dropoffLocation.lng).distanceKm;
      initialKm = Math.round(total * 10) / 10;
    }

    setRoadDistanceKm(initialKm);
    setRoadDurationMins(calculateDurationMins(initialKm));
    setRoadRouteSummary(instantEst.summary);
    // Instant upfront display - no blocking skeleton wait
    setIsCalculatingRoadRoute(false);

    // 2. Asynchronously refine with high-precision OSRM / OpenStreetMap Hargeisa road grid in background
    let isCancelled = false;

    fetchRealHargeisaRoadRoute(
      { lat: pickupLocation.lat, lng: pickupLocation.lng },
      { lat: dropoffLocation.lat, lng: dropoffLocation.lng },
      multiStops.map((s) => ({ lat: s.lat, lng: s.lng }))
    )
      .then((route) => {
        if (!isCancelled && route) {
          setRoadRoute(route);
          setRoadDistanceKm(route.distanceKm);
          setRoadDurationMins(route.durationMins);
          setRoadRouteSummary(route.routeSummary);
        }
      })
      .catch(() => {});

    return () => {
      isCancelled = true;
    };
  }, [pickupLocation.lat, pickupLocation.lng, dropoffLocation.lat, dropoffLocation.lng, multiStops]);

  const [selectedCategory, setSelectedCategory] = useState<VehicleCategory>('wadaage_share');
  const [seatsBooked, setSeatsBooked] = useState<number>(1);
  const [poolingType, setPoolingType] = useState<'express_pool' | 'door_to_door'>('door_to_door');
  const [genderPreference, setGenderPreference] = useState<'any' | 'female_only'>('any');
  const [waitAndSaveTier, setWaitAndSaveTier] = useState<'express' | 'wait_and_save'>('express');
  const [isSubscriptionCommute, setIsSubscriptionCommute] = useState<boolean>(false);
  const [splitFareWith, setSplitFareWith] = useState<{ name: string; email: string; paid: boolean; shareAmount: number }[]>([]);

  // Driver Auto-Accept On-Route Shares Toggle (For In-Trip Stacking)
  const [autoAcceptOnRouteShares, setAutoAcceptOnRouteShares] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('wadaage_driver_auto_accept_shares');
      return saved !== null ? safeJsonParse(saved, true) : true;
    } catch {
      return true;
    }
  });

  const toggleAutoAcceptShares = () => {
    setAutoAcceptOnRouteShares((prev) => {
      const next = !prev;
      localStorage.setItem('wadaage_driver_auto_accept_shares', JSON.stringify(next));
      return next;
    });
  };

  // Commuter Passes State
  const [userPasses, setUserPasses] = useState<UserCommuterPass[]>(() => {
    try {
      const saved = localStorage.getItem('wadaage_user_commuter_passes');
      if (saved) {
        return safeJsonParse(saved, []);
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('wadaage_user_commuter_passes', JSON.stringify(userPasses));
    } catch (e) {
      console.error(e);
    }
  }, [userPasses]);

  // Intercity Trips & Bookings
  const [intercityTrips, setIntercityTrips] = useState<IntercityTrip[]>(() => {
    try {
      const saved = localStorage.getItem('wadaage_intercity_trips');
      if (saved) return safeJsonParse(saved, INITIAL_INTERCITY_TRIPS);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_INTERCITY_TRIPS;
  });

  const [intercityBookings, setIntercityBookings] = useState<IntercityBooking[]>(() => {
    try {
      const saved = localStorage.getItem('wadaage_intercity_bookings');
      if (saved) return safeJsonParse(saved, []);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('wadaage_intercity_bookings', JSON.stringify(intercityBookings));
      localStorage.setItem('wadaage_intercity_trips', JSON.stringify(intercityTrips));
    } catch (e) {
      console.error(e);
    }
  }, [intercityBookings, intercityTrips]);

  // Heatmap Hotspots
  const [heatmapHotspots] = useState<HeatmapHotspot[]>(HARGEISA_DEMAND_HOTSPOTS);

  // Active pass for current corridor
  const activePassForCorridor = userPasses.find(
    (p) => p.status === 'active' && p.remainingTrips > 0
  ) || null;

  // Purchase Commuter Pass
  const purchaseCommuterPass = (
    pass: CommuterPass,
    paymentMethod: 'zaad' | 'edahab' | 'wallet'
  ): { success: boolean; pass?: UserCommuterPass; message: string } => {
    const expires = new Date();
    expires.setDate(expires.getDate() + pass.validityDays);

    const newUserPass: UserCommuterPass = {
      id: `upass_${Date.now()}`,
      passId: pass.id,
      userId: currentUser?.id || '',
      passName: pass.name,
      corridor: pass.corridor,
      totalTrips: pass.totalTrips,
      remainingTrips: pass.totalTrips,
      purchasedAt: new Date().toISOString().substring(0, 10),
      expiresAt: expires.toISOString().substring(0, 10),
      status: 'active',
      qrCode: `WADAAGE-PASS-${pass.id.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`,
    };

    setUserPasses((prev) => [newUserPass, ...prev]);

    // Record wallet transaction
    const newTx: WalletTransaction = {
      id: `tx_pass_${Date.now()}`,
      type: 'ride_payment',
      amount: -pass.priceUsd,
      title: `Subscribed: ${pass.name} (${pass.totalTrips} Trips)`,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'completed',
    };
    setTransactions((prev) => [newTx, ...prev]);

    sounds.playAcceptedChime();
    return {
      success: true,
      pass: newUserPass,
      message: `Successfully activated ${pass.name}! You have ${pass.totalTrips} pre-paid trips.`,
    };
  };

  // Book Intercity Seat
  const bookIntercitySeat = (
    tripId: string,
    seatsCount: number,
    passengerName: string,
    passengerPhone: string,
    paymentMethod: 'zaad' | 'edahab' | 'cash'
  ): { success: boolean; booking?: IntercityBooking; message: string } => {
    const trip = intercityTrips.find((t) => t.id === tripId);
    if (!trip) return { success: false, message: 'Trip not found' };
    if (trip.availableSeats < seatsCount) {
      return { success: false, message: 'Not enough available seats on this coach.' };
    }

    const totalUsd = trip.pricePerSeatUsd * seatsCount;
    const totalSos = trip.pricePerSeatSos * seatsCount;

    const assignedSeats = Array.from({ length: seatsCount }, (_, i) => `S${trip.totalSeats - trip.availableSeats + i + 1}`);

    const newBooking: IntercityBooking = {
      id: `ic_bk_${Date.now()}`,
      tripId: trip.id,
      userId: currentUser?.id || '',
      passengerName: passengerName.trim(),
      passengerPhone: passengerPhone.trim(),
      originCity: trip.originCity,
      destinationCity: trip.destinationCity,
      departureTime: trip.departureTime,
      departureDate: trip.departureDate,
      seatsBooked: seatsCount,
      seatNumbers: assignedSeats,
      totalPaidUsd: totalUsd,
      totalPaidSos: totalSos,
      paymentMethod,
      ticketQrCode: `WADAAGE-TICKET-${trip.originCity.toUpperCase()}-${trip.destinationCity.toUpperCase()}-${Math.floor(10000 + Math.random() * 90000)}`,
      bookedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'confirmed',
    };

    setIntercityTrips((prev) =>
      prev.map((t) => (t.id === tripId ? { ...t, availableSeats: t.availableSeats - seatsCount } : t))
    );
    setIntercityBookings((prev) => [newBooking, ...prev]);

    sounds.playAcceptedChime();
    return {
      success: true,
      booking: newBooking,
      message: `Seat confirmed! Ticket generated for ${passengerName} (${seatsCount} seat${seatsCount > 1 ? 's' : ''}).`,
    };
  };

  // Claim Driver Corridor Bonus
  const claimDriverCorridorBonus = (hotspotId: string): { success: boolean; bonusUsd: number; message: string } => {
    const spot = heatmapHotspots.find((h) => h.id === hotspotId);
    if (!spot) return { success: false, bonusUsd: 0, message: 'Hotspot zone not found' };

    const bonus = spot.corridorBonusUsd;
    const targetDriverId = currentUser?.id || 'live_driver';
    setDriverWallets((prev) => {
      const cur = prev[targetDriverId] !== undefined ? prev[targetDriverId] : (getDriverWalletBalance(targetDriverId) || 0);
      const nextBal = Math.round((cur + bonus) * 100) / 100;
      const updated = { ...prev, [targetDriverId]: nextBal };
      try { localStorage.setItem('wadaage_driver_wallets_map', JSON.stringify(updated)); } catch (_e) {}
      return updated;
    });

    const newDriverTx: DriverWalletTransaction = {
      id: `dtx_bonus_${Date.now()}`,
      driverId: currentUser?.id || '',
      driverName: currentUser?.name || 'Driver Partner',
      driverPhone: currentUser?.phone || '',
      type: 'topup',
      amountUsd: bonus,
      amountSos: spot.corridorBonusSos,
      title: `⚡ High Demand Bonus Claimed: ${spot.name} (+${spot.corridorBonusSos.toLocaleString()} SLSH)`,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'completed',
      paymentProvider: 'card',
    };

    setDriverWalletTransactions((prev) => [newDriverTx, ...prev]);
    sounds.playAcceptedChime();

    return {
      success: true,
      bonusUsd: bonus,
      message: `Bonus credited! +$${bonus.toFixed(2)} (${spot.corridorBonusSos.toLocaleString()} SLSH) added to your driver wallet.`,
    };
  };

  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(true);

  const addSplitFriend = (name: string, email: string) => {
    if (!name.trim() || !email.trim()) return;
    setSplitFareWith((prev) => [
      ...prev,
      { name: name.trim(), email: email.trim(), paid: true, shareAmount: 0 },
    ]);
  };

  const [rideOptions, setRideOptions] = useState({
    quietRide: false,
    acHigh: true,
    extraLuggage: false,
    petFriendly: false,
  });

  const [currentRide, setCurrentRide] = useState<RideRequest | null>(() => {
    try {
      const saved = localStorage.getItem('wadaage_current_ride');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && ['searching', 'accepted', 'driver_arrived', 'in_progress'].includes(parsed.status)) {
          return parsed;
        }
      }
    } catch {}
    return null;
  });
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [unreadChatCount, setUnreadChatCount] = useState<number>(0);
  const markChatAsRead = useCallback(() => setUnreadChatCount(0), []);
  const [incomingDriverRequest, setIncomingDriverRequest] = useState<RideRequest | null>(null);

  // ====================================================
  // LIVE STANDING-PICKUP TAXIMETER (DIGITAL METER ENGINE)
  // Real GPS odometer + live fare shared by driver and rider.
  // Flag drop: 1st KM = 12,000 SLSH ($1.20) • Each extra KM = +7,000 SLSH ($0.70)
  // ====================================================
  const METER_FIRST_KM_SLSH = 12000; // Flag drop / base fare covering the 1st kilometer
  const METER_EXTRA_KM_SLSH = 7000;  // Charged for every KM after the 1st one
  const METER_MIN_GPS_STEP_KM = 0.015; // Ignore GPS jitter smaller than ~15 metres

  const [meterKm, setMeterKm] = useState<number>(0);
  const [meterSeconds, setMeterSeconds] = useState<number>(0);
  const [isMeterRunning, setIsMeterRunning] = useState<boolean>(false);

  const meterKmRef = useRef<number>(0);
  const meterRunningRef = useRef<boolean>(false); // true once the driver starts the live-taximeter trip
  const meterLastFixRef = useRef<{ lat: number; lng: number } | null>(null);
  const meterRideIdRef = useRef<string | null>(null);
  const meterStartedAtRef = useRef<number>(0);
  const lastMeterSyncRef = useRef<number>(0);

  // Stable bridges so the (stable) GPS callback and effects always reach the newest odometer logic
  const currentRideRef = useRef<RideRequest | null>(null);
  const roleRef = useRef<UserRole>(role);
  const accumulateMeterFromGpsRef = useRef<(lat: number, lng: number) => void>(() => {});

  // Always keep the newest ride object available to stable callbacks (avoids stale closures)
  useEffect(() => {
    currentRideRef.current = currentRide || null;
  }, [currentRide]);
  useEffect(() => {
    roleRef.current = role;
  }, [role]);

  // Pure fare maths for the standard Hargeisa metered taxi
  // 1st KM = 12,000 SLSH ($1.20) flag drop • every extra KM = +7,000 SLSH ($0.70)
  const computeMeterFare = useCallback((km: number) => {
    const safeKm = Math.max(0, Number(km) || 0);
    const extraKm = Math.max(0, safeKm - 1);
    const fareSlsh = Math.round(METER_FIRST_KM_SLSH + extraKm * METER_EXTRA_KM_SLSH);
    const fareUsd = Math.round((fareSlsh / EXCHANGE_RATE_USD_TO_SLSH) * 100) / 100;
    return { fareUsd, fareSlsh, extraKm };
  }, []);

  // Elapsed trip seconds — derived from the shared trip start timestamp so every device agrees
  const meterElapsedSeconds = useCallback((): number => {
    const ride = currentRideRef.current;
    const startedAtMs = Number(ride?.liveMeterStartedAt || meterStartedAtRef.current || 0);
    if (!startedAtMs) return 0;
    return Math.max(0, Math.floor((Date.now() - startedAtMs) / 1000));
  }, []);

  // Push the live meter snapshot to Firestore + Hostinger so the rider app shows identical numbers
  const syncMeterSnapshot = useCallback((ride: RideRequest) => {
    if (!ride) return;
    try { saveRideToFirestore(ride); } catch {}
    try { syncRideToHostinger(ride); } catch {}
    try { broadcastRideEvent('RIDE_STATUS_UPDATED', ride); } catch {}
  }, []);

  // Build an updated ride object carrying the live meter values
  const buildMeterRide = useCallback((km: number, seconds: number): RideRequest | null => {
    const ride = currentRideRef.current;
    if (!ride) return null;
    const { fareUsd, fareSlsh } = computeMeterFare(km);
    const waitingFeeUsd = Number(ride.waitingFeeUsd || 0);
    return {
      ...ride,
      isLiveTaximeter: true,
      liveTraveledKm: km,
      distanceKm: km,
      liveMeterSeconds: seconds,
      liveMeterStartedAt: Number(ride.liveMeterStartedAt || meterStartedAtRef.current || Date.now()),
      dropoffFareUsd: fareUsd,
      dropoffFareSlsh: fareSlsh,
      totalFare: Math.round((fareUsd + waitingFeeUsd) * 100) / 100,
      updatedAt: new Date().toISOString(),
    } as RideRequest;
  }, [computeMeterFare]);

  // Feed every real hardware GPS fix into the taximeter odometer (haversine segment distances)
  const accumulateMeterFromGps = useCallback((lat: number, lng: number) => {
    if (!meterRunningRef.current) {
      meterLastFixRef.current = { lat, lng };
      return;
    }
    const last = meterLastFixRef.current;
    meterLastFixRef.current = { lat, lng };
    if (!last) return;

    const segmentKm = calculateHaversineDistanceKm(last.lat, last.lng, lat, lng);
    // Skip GPS noise / standing still
    if (!Number.isFinite(segmentKm) || segmentKm < METER_MIN_GPS_STEP_KM) return;
    // Reject absurd single jumps (GPS tower handover / bad accuracy fix)
    if (segmentKm > 3) return;
    // After the screen was locked the gap can be large; accept it up to a sane driving distance,
    // otherwise treat it as a GPS glitch and re-anchor without charging
    if (segmentKm > 1.5) {
      console.warn('[Taximeter] Large GPS gap detected, re-anchoring odometer:', segmentKm.toFixed(2), 'KM');
      return;
    }

    const nextKm = Math.round((meterKmRef.current + segmentKm) * 1000) / 1000;
    meterKmRef.current = nextKm;
    setMeterKm(nextKm);

    const seconds = meterElapsedSeconds();
    const updatedRide = buildMeterRide(nextKm, seconds);
    if (updatedRide && updatedRide.id === meterRideIdRef.current) {
      setCurrentRide((prev) => (prev && prev.id === updatedRide.id ? updatedRide : prev));
      const now = Date.now();
      // Throttle network writes to ~1 per second; local state above stays perfectly smooth
      if (now - lastMeterSyncRef.current >= 1000) {
        lastMeterSyncRef.current = now;
        syncMeterSnapshot(updatedRide);
      }
    }
  }, [buildMeterRide, syncMeterSnapshot, meterElapsedSeconds]);

  // Driver device arms the meter for a live-taximeter trip (rider devices only read it)
  useEffect(() => {
    const isLiveTaxiTrip =
      roleRef.current === 'driver' &&
      !!currentRide &&
      currentRide.isLiveTaximeter === true &&
      currentRide.status === 'in_progress';

    if (!isLiveTaxiTrip) {
      if (meterRunningRef.current) {
        meterRunningRef.current = false;
        setIsMeterRunning(false);
      }
      return;
    }

    if (meterRideIdRef.current !== currentRide!.id) {
      // (Re)arm the meter. This also runs after an app reload mid-trip, in which case the
      // ride already carries the travelled KM and the original trip-start timestamp and we
      // must continue from them instead of restarting the clock at zero.
      const isResume = Number(currentRide!.liveMeterStartedAt || 0) > 0;
      meterRideIdRef.current = currentRide!.id;
      meterKmRef.current = Math.max(0, Number(currentRide!.liveTraveledKm || 0));
      setMeterKm(meterKmRef.current);
      meterStartedAtRef.current = isResume
        ? Number(currentRide!.liveMeterStartedAt)
        : Date.now();
      setMeterSeconds(meterElapsedSeconds());
      meterRunningRef.current = true;
      setIsMeterRunning(true);
      const start = currentRide!.startCoordinates ||
        (driverGpsStatus.active ? { lat: driverGpsStatus.lat, lng: driverGpsStatus.lng } : null);
      if (start) meterLastFixRef.current = { lat: start.lat, lng: start.lng };
      lastMeterSyncRef.current = 0;

      const initialRide = buildMeterRide(meterKmRef.current, isResume ? meterElapsedSeconds() : 0);
      if (initialRide) {
        setCurrentRide((prev) => (prev && prev.id === initialRide.id ? initialRide : prev));
        syncMeterSnapshot(initialRide);
      }
    }
  }, [currentRide?.id, currentRide?.status, currentRide?.isLiveTaximeter, buildMeterRide, syncMeterSnapshot, meterElapsedSeconds, driverGpsStatus.active]);

  // 1-second trip clock: ticks the timer and re-broadcasts so the rider sees the live fare move
  useEffect(() => {
    if (!isMeterRunning) return;
    const ticker = setInterval(() => {
      const ride = currentRideRef.current;
      if (!ride || ride.id !== meterRideIdRef.current || ride.status !== 'in_progress') return;
      const seconds = meterElapsedSeconds();
      setMeterSeconds(seconds);
      const liveRide = buildMeterRide(meterKmRef.current, seconds);
      if (liveRide) {
        setCurrentRide((prev) => (prev && prev.id === liveRide.id ? liveRide : prev));
        const now = Date.now();
        // Heartbeat the shared meter to the rider app (skip while the phone is backgrounded)
        const appVisible = typeof document === 'undefined' || document.visibilityState !== 'hidden';
        if (appVisible && now - lastMeterSyncRef.current >= 2000) {
          lastMeterSyncRef.current = now;
          syncMeterSnapshot(liveRide);
        }
      }
    }, 1000);
    return () => clearInterval(ticker);
  }, [isMeterRunning, buildMeterRide, syncMeterSnapshot, meterElapsedSeconds]);

  // Live fare readouts derived from the meter odometer
  const meterFareUsd = useMemo(() => computeMeterFare(meterKm).fareUsd, [computeMeterFare, meterKm]);
  const meterFareSlsh = useMemo(() => computeMeterFare(meterKm).fareSlsh, [computeMeterFare, meterKm]);

  // Keep the stable bridge pointing at the newest odometer implementation
  useEffect(() => {
    accumulateMeterFromGpsRef.current = accumulateMeterFromGps;
  }, [accumulateMeterFromGps]);

  // Sync currentRide to localStorage for session persistence across refreshes and app closes
  useEffect(() => {
    try {
      if (currentRide && ['searching', 'accepted', 'driver_arrived', 'in_progress'].includes(currentRide.status)) {
        localStorage.setItem('wadaage_current_ride', JSON.stringify(currentRide));
      } else if (currentRide?.status === 'completed' || currentRide?.status === 'cancelled') {
        localStorage.removeItem('wadaage_current_ride');
      }
    } catch {}
  }, [currentRide]);

  // Check backend for active trip on launch to ensure session is never lost
  useEffect(() => {
    const checkActiveTripOnLaunch = async () => {
      try {
        const user = currentUser || secureStorage.getItem<AuthUser>('wadaage_auth_passenger') || secureStorage.getItem<AuthUser>('wadaage_auth_user');
        const userId = user?.id || '';
        const phone = user?.phone || '';

        const queryParams = new URLSearchParams();
        if (userId) queryParams.set('userId', userId);
        if (phone) queryParams.set('phone', phone);
        queryParams.set('role', role);

        const res = await fetch(`/api/rides/active-trip?${queryParams.toString()}`);
        if (!res.ok) return;

        const data = await res.json();
        if (data && data.hasActiveTrip && data.trip) {
          const tripStatus = data.trip.status;
          if (['searching', 'accepted', 'driver_arrived', 'in_progress'].includes(tripStatus)) {
            console.log('[Active Trip Recovery] Successfully restored active trip from backend:', data.trip);
            setCurrentRide(data.trip);
            try {
              localStorage.setItem('wadaage_current_ride', JSON.stringify(data.trip));
            } catch {}
          } else {
            localStorage.removeItem('wadaage_current_ride');
          }
        }
      } catch (err) {
        console.warn('[Active Trip Recovery] Launch check error:', err);
      }
    };

    checkActiveTripOnLaunch();
  }, [currentUser?.id, currentUser?.phone, role]);

  // 60-Second Wadaage Share Batching Pool Engine
  useEffect(() => {
    if (currentRide && currentRide.status === 'searching' && currentRide.isInBatchingPool) {
      const timer = setInterval(() => {
        setCurrentRide((prev) => {
          if (!prev || !prev.isInBatchingPool) return prev;
          const remaining = prev.batchingCountdownSeconds ? prev.batchingCountdownSeconds - 1 : 0;
          if (remaining <= 0) {
            // Batching countdown window complete -> match & dispatch best co-passenger
            sounds.playAcceptedChime();
            const updated: RideRequest = {
              ...prev,
              isInBatchingPool: false,
              batchingCountdownSeconds: 0,
            };
            saveRideToFirestore(updated);
            syncRideToHostinger(updated);
            broadcastRideEvent('RIDE_STATUS_UPDATED', updated);
            return updated;
          }
          return {
            ...prev,
            batchingCountdownSeconds: remaining,
          };
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [currentRide?.status, currentRide?.isInBatchingPool]);

  // 30-Second Sequential Proximity Dispatch Engine (Single Nearest Driver Exclusive Offer)
  useEffect(() => {
    if (!currentRide || currentRide.status !== 'searching' || currentRide.isInBatchingPool) {
      return;
    }

    const timer = setInterval(() => {
      setCurrentRide((prev) => {
        if (!prev || prev.status !== 'searching' || prev.isInBatchingPool) {
          return prev;
        }

        const now = Date.now();
        const expiresAt = prev.offerExpiresAt || 0;
        const remaining = Math.max(0, Math.ceil((expiresAt - now) / 1000));

        // If offer expired or no driver candidate currently targeted
        if (remaining <= 0 || !prev.currentOfferedDriverId) {
          const currentDeclined = prev.declinedDriverIds || [];
          const updatedDeclined = prev.currentOfferedDriverId
            ? Array.from(new Set([...currentDeclined, prev.currentOfferedDriverId]))
            : currentDeclined;

          const nextCandidate = getNearestDriverCandidate(prev, drivers, updatedDeclined);

          if (nextCandidate) {
            const nextRide: RideRequest = {
              ...prev,
              currentOfferedDriverId: nextCandidate.driver.id,
              offerExpiresAt: Date.now() + 15000, // 15-Second Rule
              offerTimeoutSeconds: 15,
              driverDistanceKm: nextCandidate.distanceKm,
              declinedDriverIds: updatedDeclined,
            };
            sounds.playIncomingPing();
            saveRideToFirestore(nextRide);
            syncRideToHostinger(nextRide);
            broadcastRideEvent('RIDE_REQUESTED', nextRide);
            return nextRide;
          } else {
            // Reset declined candidates cycle after brief grace period if order is still searching
            if (updatedDeclined.length > 0) {
              return {
                ...prev,
                currentOfferedDriverId: undefined,
                offerExpiresAt: Date.now() + 6000,
                offerTimeoutSeconds: 6,
                declinedDriverIds: [],
              };
            }
          }
        }

        return {
          ...prev,
          offerTimeoutSeconds: remaining,
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentRide?.status, currentRide?.isInBatchingPool, drivers, getNearestDriverCandidate]);

  // Driver Prepaid Wallet State (Individual Isolated Wallet per Driver ID)
  const [driverWallets, setDriverWallets] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('wadaage_driver_wallets_map');
      if (saved) {
        const parsed = safeJsonParse(saved, null);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    // Default initial driver balances
    return {};
  });

  const [driverWalletTransactions, setDriverWalletTransactions] = useState<DriverWalletTransaction[]>(() => {
    try {
      const saved = localStorage.getItem('wadaage_driver_wallet_transactions');
      if (saved) return safeJsonParse(saved, []);
    } catch (e) {
      console.error(e);
    }
    return [];
  });

  const getDriverWalletBalance = useCallback((identifier: string): number => {
    if (!identifier) return 0;

    const cleanInput = String(identifier).replace(/\D/g, '');

    // 1. Gather all candidate alias keys related to this driver
    const candidateKeys = new Set<string>();
    candidateKeys.add(identifier);
    if (cleanInput) candidateKeys.add(cleanInput);

    // Search in drivers array for matching driver
    const matchedDrv = drivers.find((d) => {
      const dClean = d.phone ? String(d.phone).replace(/\D/g, '') : '';
      return (
        d.id === identifier ||
        d.phone === identifier ||
        (cleanInput && (d.id === identifier || dClean === cleanInput || (dClean && cleanInput && (dClean.endsWith(cleanInput) || cleanInput.endsWith(dClean)))))
      );
    });

    if (matchedDrv) {
      if (matchedDrv.id) candidateKeys.add(matchedDrv.id);
      if (matchedDrv.phone) candidateKeys.add(matchedDrv.phone);
      const dClean = matchedDrv.phone ? String(matchedDrv.phone).replace(/\D/g, '') : '';
      if (dClean) candidateKeys.add(dClean);
    }

    // Search in currentUser if driver
    if (currentUser && currentUser.role === 'driver') {
      const cClean = currentUser.phone ? String(currentUser.phone).replace(/\D/g, '') : '';
      const cMatches =
        currentUser.id === identifier ||
        currentUser.phone === identifier ||
        (cleanInput && cClean && (cClean.endsWith(cleanInput) || cleanInput.endsWith(cClean)));

      if (cMatches) {
        if (currentUser.id) candidateKeys.add(currentUser.id);
        if (currentUser.phone) candidateKeys.add(currentUser.phone);
        if (cClean) candidateKeys.add(cClean);
      }
    }

    // Search all keys in driverWallets map for phone matches
    if (cleanInput) {
      for (const k of Object.keys(driverWallets)) {
        const kClean = k.replace(/\D/g, '');
        if (kClean && (kClean === cleanInput || kClean.endsWith(cleanInput) || cleanInput.endsWith(kClean))) {
          candidateKeys.add(k);
        }
      }
    }

    // 2. Calculate authoritative net balance from driverWalletTransactions ledger if available
    let ledgerSumUsd = 0;
    let hasLedgerTransactions = false;

    if (driverWalletTransactions && driverWalletTransactions.length > 0) {
      driverWalletTransactions.forEach((tx) => {
        const isCompleted = tx.status === 'completed';
        if (!isCompleted) return;

        const isMatch =
          (tx.driverId && candidateKeys.has(tx.driverId)) ||
          (tx.driverPhone && candidateKeys.has(tx.driverPhone)) ||
          (tx.driverPhone && cleanInput && tx.driverPhone.replace(/\D/g, '').endsWith(cleanInput));

        if (isMatch) {
          hasLedgerTransactions = true;
          ledgerSumUsd += Number(tx.amountUsd || 0);
        }
      });
    }

    // 3. Evaluate map and driver record balances
    let mapBal: number | null = null;
    for (const key of candidateKeys) {
      if (driverWallets[key] !== undefined) {
        const val = Number(driverWallets[key]);
        if (!isNaN(val)) {
          mapBal = val;
          break; // First direct alias hit in the driverWallets map is authoritative
        }
      }
    }

    if (mapBal === null && matchedDrv) {
      const drvBalUsd = matchedDrv.walletBalanceUsd !== undefined
        ? Number(matchedDrv.walletBalanceUsd)
        : (matchedDrv as any).wallet_balance_usd !== undefined
        ? Number((matchedDrv as any).wallet_balance_usd)
        : undefined;

      if (drvBalUsd !== undefined && !isNaN(drvBalUsd)) {
        mapBal = drvBalUsd;
      }
    }

    if (mapBal === null && currentUser && currentUser.role === 'driver') {
      const userBalUsd = currentUser.walletBalanceUsd !== undefined
        ? Number(currentUser.walletBalanceUsd)
        : (currentUser as any).wallet_balance_usd !== undefined
        ? Number((currentUser as any).wallet_balance_usd)
        : undefined;

      if (userBalUsd !== undefined && !isNaN(userBalUsd)) {
        mapBal = userBalUsd;
      }
    }

    if (mapBal !== null) {
      return Math.max(0, Math.round(mapBal * 100) / 100);
    }

    if (hasLedgerTransactions) {
      return Math.max(0, Math.round(ledgerSumUsd * 100) / 100);
    }

    // Default: strictly 0.00 if unrecorded or drained
    return 0.00;
  }, [driverWallets, drivers, currentUser, driverWalletTransactions]);

  // Current active driver balance
  const activeDriverId = currentUser?.role === 'driver' ? (currentUser.id || currentUser.phone || '') : '';
  const driverWalletBalanceUsd = currentUser?.role === 'driver'
    ? ((activeDriverId ? getDriverWalletBalance(activeDriverId) : 0) ||
       (currentUser.phone ? getDriverWalletBalance(currentUser.phone) : 0) ||
       (currentUser.walletBalanceUsd !== undefined ? Number(currentUser.walletBalanceUsd) : 0) ||
       0)
    : 0;

  const [lowBalanceLockoutAlert, setLowBalanceLockoutAlert] = useState<boolean>(false);
  const [selfOrderAlertMsg, setSelfOrderAlertMsg] = useState<string | null>(null);

  const dismissSelfOrderAlert = () => setSelfOrderAlertMsg(null);

  useEffect(() => {
    try {
      localStorage.setItem('wadaage_driver_wallets_map', JSON.stringify(driverWallets));
      localStorage.setItem('wadaage_driver_wallet_balance', JSON.stringify(driverWalletBalanceUsd));
      localStorage.setItem('wadaage_driver_wallet_transactions', JSON.stringify(driverWalletTransactions));
    } catch (e) {
      console.error(e);
    }
  }, [driverWallets, driverWalletBalanceUsd, driverWalletTransactions]);

  // Active Balance & Online Status Guard:
  // When balance is 0 or less, driver CANNOT receive any orders and MUST GO OFFLINE immediately!
  // Only after top up (balance > 0) can they go online and receive orders.
  useEffect(() => {
    if (role === 'driver') {
      const activeDrvId = currentUser?.id || 'live_driver';
      const activeDrvPhone = currentUser?.phone || '';
      const curBal = getDriverWalletBalance(activeDrvId) || (activeDrvPhone ? getDriverWalletBalance(activeDrvPhone) : 0);
      const minThreshold = pricing?.driverMinWalletThresholdUsd || 0.10;

      if (curBal <= 0 || curBal < minThreshold) {
        if (driverModeOnline) {
          console.warn(`[Driver Balance Guard] Driver balance is $${curBal.toFixed(2)} (0 SLSH or below threshold). Forcing driver OFFLINE.`);
          setDriverModeOnline(false);
          setLowBalanceLockoutAlert(true);
          setIncomingDriverRequest(null);
          notificationService.stopEmergencyOrderRingtone();

          setDrivers((prev) =>
            prev.map((d) => (d.id === activeDrvId || (activeDrvPhone && d.phone === activeDrvPhone) ? { ...d, status: 'offline' } : d))
          );

          try {
            fetch(getApiUrl('/api/drivers/location'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: activeDrvId,
                name: currentUser?.name || 'Driver Partner',
                phone: activeDrvPhone,
                lat: driverGpsStatus?.lat || 9.5600,
                lng: driverGpsStatus?.lng || 44.0650,
                status: 'offline',
              }),
            }).catch(() => {});
          } catch (_e) {}
        }
      }
    }
  }, [driverWallets, driverWalletBalanceUsd, role, currentUser, pricing, driverModeOnline, getDriverWalletBalance, driverGpsStatus]);

  // Offline status guard: When driver is offline, CANNOT receive any incoming orders!
  useEffect(() => {
    if (!driverModeOnline) {
      if (incomingDriverRequest) {
        setIncomingDriverRequest(null);
        notificationService.stopEmergencyOrderRingtone();
      }
    }
  }, [driverModeOnline, incomingDriverRequest]);

  // Initial Firestore connection test & real-time listeners across all apps
  useEffect(() => {
    testFirebaseConnection();

    // 1. Subscribe to real-time pricing & system settings
    const unsubSettings = subscribeToSettings((remotePricing) => {
      if (remotePricing && (remotePricing.baseFareTaxi !== undefined || remotePricing.perKmRate !== undefined)) {
        setPricing((prev) => ({ ...prev, ...remotePricing }));
      }
    });

    // Initial fetch from backend Hostinger database drivers
    try {
      fetch(getApiUrl('/api/db/drivers'))
        .then((res) => res.json())
        .then((data) => {
          if (data && data.success && Array.isArray(data.data) && data.data.length > 0) {
            const dbDrivers: Driver[] = data.data.map((dbD: any) => {
              const realBalUsd = Number(dbD.walletBalanceUsd ?? dbD.wallet_balance_usd ?? 0);
              return {
                id: dbD.id,
                name: dbD.name,
                phone: dbD.phone,
                avatar: dbD.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
                gender: dbD.gender || 'male',
                rating: Number(dbD.rating || 5.0),
                totalTrips: Number(dbD.total_trips || 0),
                status: dbD.status || (dbD.is_online ? 'available' : 'offline'),
                isVerified: Boolean(dbD.is_verified),
                kycStatus: dbD.kyc_status || 'approved',
                documentsVerified: {
                  driverLicense: true,
                  vehicleInsurance: true,
                  backgroundCheck: true,
                },
                currentLocation: {
                  lat: Number(dbD.current_lat || 9.5600),
                  lng: Number(dbD.current_lng || 44.0650),
                },
                vehicle: {
                  model: dbD.car_model || 'Toyota Vitz',
                  licensePlate: dbD.car_plate || 'SL-101',
                  color: dbD.car_color || 'White',
                  category: dbD.vehicle_category || 'wadaage_taxi',
                  capacity: 4,
                  photoUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=300',
                },
                todayEarnings: Number(dbD.today_earnings || 0),
                weeklyEarnings: Number(dbD.weekly_earnings || 0),
                hoursOnline: Number(dbD.hours_online || 0),
                acceptanceRate: Number(dbD.acceptance_rate || 100),
                walletBalanceUsd: realBalUsd,
              };
            });

            // Synchronize driverWallets with verified database balances
            setDriverWallets((prev) => {
              const updated = { ...prev };
              let changed = false;
              dbDrivers.forEach((d) => {
                if (d.id && d.walletBalanceUsd !== undefined) {
                  if (updated[d.id] === undefined) {
                    updated[d.id] = d.walletBalanceUsd;
                    changed = true;
                  }
                }
                if (d.phone && d.walletBalanceUsd !== undefined) {
                  if (updated[d.phone] === undefined) {
                    updated[d.phone] = d.walletBalanceUsd;
                    changed = true;
                  }
                }
              });
              if (changed) {
                try { localStorage.setItem('wadaage_driver_wallets_map', JSON.stringify(updated)); } catch (_e) {}
              }
              return changed ? updated : prev;
            });

            setDrivers((prev) => {
              const map = new Map<string, Driver>();
              prev.forEach((d) => map.set(d.id, d));
              dbDrivers.forEach((d) => {
                if (!map.has(d.id)) {
                  map.set(d.id, d);
                } else {
                  const existing = map.get(d.id)!;
                  const bal = d.walletBalanceUsd !== undefined ? d.walletBalanceUsd : existing.walletBalanceUsd;
                  map.set(d.id, { ...existing, ...d, walletBalanceUsd: bal });
                }
              });
              return Array.from(map.values());
            });
          }
        })
        .catch(() => {});
    } catch (_e) {}

    // 2. Subscribe to real-time drivers
    const unsubDrivers = subscribeToDrivers((remoteDrivers) => {
      if (remoteDrivers && remoteDrivers.length > 0) {
        setDrivers((prev) => {
          let hasChanged = false;
          const merged = [...prev];
          remoteDrivers.forEach((rd) => {
            const idx = merged.findIndex((d) => d.id === rd.id || d.phone === rd.phone);
            if (idx >= 0) {
              const cur = merged[idx];
              const latDiff = Math.abs((cur.currentLocation?.lat || 0) - (rd.currentLocation?.lat || 0));
              const lngDiff = Math.abs((cur.currentLocation?.lng || 0) - (rd.currentLocation?.lng || 0));
              const safeBal = rd.walletBalanceUsd !== undefined ? Number(rd.walletBalanceUsd) : cur.walletBalanceUsd;
              if (
                cur.status !== rd.status ||
                cur.name !== rd.name ||
                cur.rating !== rd.rating ||
                cur.walletBalanceUsd !== safeBal ||
                latDiff > 0.00001 ||
                lngDiff > 0.00001
              ) {
                merged[idx] = { ...cur, ...rd, walletBalanceUsd: safeBal };
                hasChanged = true;
              }
            } else {
              merged.push(rd);
              hasChanged = true;
            }
          });
          return hasChanged ? merged : prev;
        });

        // Also update driverWallets only for newly discovered drivers not yet in local map
        remoteDrivers.forEach((rd) => {
          if (rd.walletBalanceUsd !== undefined) {
            const safeB = Number(rd.walletBalanceUsd);
            setDriverWallets((prev) => {
              if (rd.id && prev[rd.id] !== undefined) return prev;
              if (rd.phone && prev[rd.phone] !== undefined) return prev;
              const next = { ...prev };
              if (rd.id) next[rd.id] = safeB;
              if (rd.phone) next[rd.phone] = safeB;
              try { localStorage.setItem('wadaage_driver_wallets_map', JSON.stringify(next)); } catch (_e) {}
              return next;
            });
          }
        });
      }
    });

    // 3. Subscribe to real-time live rides from Cloud Firestore & Node Relay
    const unsubRides = subscribeToLiveRides((remoteRides) => {
      if (remoteRides && remoteRides.length > 0) {
        // Sort descending by most recent activity timestamp
        const sortedRides = [...remoteRides].sort((a, b) => {
          const tA = Number(a.serverUpdatedAt || (a.updatedAt ? new Date(a.updatedAt).getTime() : 0) || (a.createdAt ? new Date(a.createdAt).getTime() : 0) || (a.requestedAt ? new Date(a.requestedAt).getTime() : 0) || 0);
          const tB = Number(b.serverUpdatedAt || (b.updatedAt ? new Date(b.updatedAt).getTime() : 0) || (b.createdAt ? new Date(b.createdAt).getTime() : 0) || (b.requestedAt ? new Date(b.requestedAt).getTime() : 0) || 0);
          return tB - tA;
        });

        // Maintain global synchronized platform rides for Admin Dashboard and live fleet telematics
        setAllPlatformRides(sortedRides);

        // Merge the live taximeter telemetry (KM travelled, running fare, trip clock) into the active ride.
        // Returns the same object when nothing meaningful changed to avoid needless re-renders.
        const mergeLiveMeterFields = (prevRide: RideRequest, incoming: RideRequest): RideRequest => {
          const prevKm = Number(prevRide.liveTraveledKm ?? 0);
          const nextKm = Number(incoming.liveTraveledKm ?? prevKm);
          const prevFare = Number(prevRide.totalFare ?? 0);
          const nextFare = Number(incoming.totalFare ?? prevFare);

          // Apply the incoming ride, but never let a stale poll rewind the meter or the running fare
          const merged: RideRequest = { ...prevRide, ...incoming };
          merged.liveTraveledKm = Number.isFinite(nextKm) && nextKm >= prevKm ? nextKm : prevKm;
          merged.totalFare = Number.isFinite(nextFare) && nextFare >= prevFare ? nextFare : prevFare;

          const kmChanged = Math.abs((merged.liveTraveledKm ?? 0) - prevKm) >= 0.005;
          const fareChanged = Math.abs(Number(merged.totalFare ?? 0) - prevFare) >= 0.01;
          const timeChanged = Number(merged.liveMeterSeconds ?? 0) !== Number(prevRide.liveMeterSeconds ?? 0);
          const statusChanged = merged.status !== prevRide.status;
          const driverChanged = merged.assignedDriverId !== prevRide.assignedDriverId;

          if (!kmChanged && !fareChanged && !timeChanged && !statusChanged && !driverChanged) {
            return prevRide;
          }
          return merged;
        };

        // Driver side: never let a stale server poll rewind the digital meter mid-trip
        const mergeDriverLiveRide = (prevRide: RideRequest, incoming: RideRequest): RideRequest => {
          const merged = { ...incoming };
          if (incoming.isLiveTaximeter === true || prevRide.isLiveTaximeter === true) {
            merged.liveTraveledKm = Math.max(Number(prevRide.liveTraveledKm ?? 0), Number(incoming.liveTraveledKm ?? 0));
            merged.distanceKm = merged.liveTraveledKm;
            merged.totalFare = Math.max(Number(prevRide.totalFare ?? 0), Number(incoming.totalFare ?? 0));
            merged.liveMeterSeconds = Math.max(Number(prevRide.liveMeterSeconds ?? 0), Number(incoming.liveMeterSeconds ?? 0));
            merged.liveMeterStartedAt = Number(prevRide.liveMeterStartedAt || incoming.liveMeterStartedAt || 0) || undefined;
          }
          return merged;
        };

        // Helper to check ownership of ride for current logged-in passenger
        const isMyPassengerRide = (r: RideRequest) => {
          if (currentUser?.id && r.passengerId === currentUser.id) return true;
          if (currentUser?.phone && r.passengerPhone === currentUser.phone) return true;
          if (currentRide && currentRide.id === r.id) return true;
          return false;
        };

        // Helper to check ownership of ride for current logged-in driver
        const isMyDriverRide = (r: RideRequest) => {
          if (!r) return false;
          if (currentRide && currentRide.id === r.id) return true;
          const savedCurrentRide = (() => {
            try {
              const s = localStorage.getItem('wadaage_current_ride');
              return s ? JSON.parse(s) : null;
            } catch {
              return null;
            }
          })();
          if (savedCurrentRide && savedCurrentRide.id === r.id) return true;

          if (currentUser) {
            const cId = currentUser.id;
            const dId = r.assignedDriverId;
            if (dId && (dId === cId || dId === `drv_${cId}` || cId === `drv_${dId}`)) return true;
            if (currentUser.phone && r.driverPhone && currentUser.phone === r.driverPhone) return true;
          }
          if (r.assignedDriverId && (r.assignedDriverId === 'drv_01' || r.assignedDriverId === 'live_driver')) return true;
          return false;
        };

        if (role === 'passenger') {
          // Passenger ONLY sees their own ride
          const myActiveRide = sortedRides.find(
            (r) =>
              isMyPassengerRide(r) &&
              !cancelledRideIdsRef.current.has(r.id) &&
              !dismissedRideIdsRef.current.has(r.id) &&
              (r.status === 'searching' ||
                r.status === 'accepted' ||
                r.status === 'driver_arrived' ||
                r.status === 'in_progress')
          );

          if (myActiveRide) {
            setCurrentRide((current) => {
              if (!current || current.id !== myActiveRide.id) {
                return myActiveRide;
              }
              const statusChanged = myActiveRide.status !== current.status;
              const driverChanged = myActiveRide.assignedDriverId !== current.assignedDriverId;
              if (statusChanged || driverChanged) {
                // High-priority notifications with sound for rider
                if (current?.status === 'searching' && myActiveRide.status === 'accepted') {
                  sounds.playAcceptedChime();
                  notificationService.notifyRiderDriverAccepted({
                    driverName: myActiveRide.driver_name || myActiveRide.driverName || 'Wadaage Driver',
                    vehicleModel: myActiveRide.vehicle_model || myActiveRide.vehicleModel || 'Toyota Vitz',
                    licensePlate: myActiveRide.license_plate || myActiveRide.licensePlate || 'SL-24810',
                  });
                } else if (current?.status === 'accepted' && myActiveRide.status === 'driver_arrived') {
                  sounds.playIncomingPing();
                  notificationService.notifyRiderDriverArrived({
                    driverName: myActiveRide.driver_name || myActiveRide.driverName || 'Wadaage Driver',
                  });
                }
              }
              // Keep the rider's live taximeter (KM travelled + running fare) in lockstep with the driver
              return mergeLiveMeterFields(current, myActiveRide);
            });
          } else if (currentRide && !cancelledRideIdsRef.current.has(currentRide.id) && !dismissedRideIdsRef.current.has(currentRide.id)) {
            const updatedMatching = sortedRides.find((r) => r.id === currentRide.id);
            if (updatedMatching) {
              if (updatedMatching.status !== currentRide.status) {
                if (currentRide.status === 'searching' && updatedMatching.status === 'accepted') {
                  sounds.playAcceptedChime();
                  notificationService.notifyRiderDriverAccepted({
                    driverName: updatedMatching.driver_name || updatedMatching.driverName || 'Wadaage Driver',
                    vehicleModel: updatedMatching.vehicle_model || updatedMatching.vehicleModel || 'Toyota Vitz',
                    licensePlate: updatedMatching.license_plate || updatedMatching.licensePlate || 'SL-24810',
                  });
                } else if (currentRide.status === 'accepted' && updatedMatching.status === 'driver_arrived') {
                  sounds.playIncomingPing();
                  notificationService.notifyRiderDriverArrived({
                    driverName: updatedMatching.driver_name || updatedMatching.driverName || 'Wadaage Driver',
                  });
                }
              }
              setCurrentRide((current) => (current ? mergeLiveMeterFields(current, updatedMatching) : updatedMatching));
            }
          }
          setIncomingDriverRequest(null);
        } else if (role === 'driver') {
          // Driver sees incoming searching rides OR their currently assigned active ride
          const myAssignedRide = sortedRides.find(
            (r) =>
              isMyDriverRide(r) &&
              !cancelledRideIdsRef.current.has(r.id) &&
              !dismissedRideIdsRef.current.has(r.id) &&
              (r.status === 'accepted' ||
                r.status === 'driver_arrived' ||
                r.status === 'in_progress')
          );

          if (myAssignedRide) {
            setCurrentRide((current) => {
              if (!current || current.id !== myAssignedRide.id) {
                return myAssignedRide;
              }
              const currentRank = RIDE_STATUS_RANK[current.status] || 0;
              const incomingRank = RIDE_STATUS_RANK[myAssignedRide.status] || 0;
              if (incomingRank >= currentRank) {
                return mergeDriverLiveRide(current, myAssignedRide);
              }
              return current;
            });
            try {
              localStorage.setItem('wadaage_current_ride', JSON.stringify(myAssignedRide));
            } catch {}

            // If driver has an active private normal taxi ride, NEVER accept or search for co-riders
            if (myAssignedRide.category !== 'wadaage_share' || !myAssignedRide.isShared) {
              setIncomingDriverRequest(null);
            } else if (myAssignedRide.category === 'wadaage_share' && !myAssignedRide.coPassenger && !myAssignedRide.stackedRide) {
              // If driver has 1 rider in Wadaage Share, check if any unassigned searching ride matches
              const matchingCoRider = sortedRides.find((r) => {
                if (r.status !== 'searching' || r.category !== 'wadaage_share' || r.id === myAssignedRide.id) return false;
                const isDrivingEnRoute = myAssignedRide.status === 'in_progress';
                const initialRadiusLimit = pricing?.maxPickupRadiusKm ?? 1.0;
                const enRouteRadiusLimit = 1.5;
                const match = evaluateWadaageShareMatch(
                  myAssignedRide,
                  r,
                  getDriverCoordinates(),
                  {
                    isDriverEnRouteWithOneRider: isDrivingEnRoute,
                    maxPickupRadiusKm: initialRadiusLimit,
                    maxEnRoutePickupRadiusKm: enRouteRadiusLimit,
                    maxHeadingDivergenceDegrees: pricing?.maxHeadingDivergenceDegrees ?? 45,
                    maxDestinationRadiusKm: pricing?.maxDestinationRadiusKm ?? 2.0,
                    maxDetourMins: pricing?.maxDetourMinutes ?? (pricing?.categoryConfigs?.wadaage_share?.rules?.maxDetourMins ?? 10),
                  }
                );
                return match.isMatch;
              });

              if (matchingCoRider) {
                setIncomingDriverRequest((prev) => (prev?.id !== matchingCoRider.id ? matchingCoRider : prev));
              } else {
                setIncomingDriverRequest(null);
              }
            } else {
              setIncomingDriverRequest(null);
            }
          } else {
            // Driver is idle: check if driver is ONLINE and has wallet balance >= 0.10 USD (1,000 SLSH)
            const activeDrvId = currentUser?.id || 'live_driver';
            const activeDrvPhone = currentUser?.phone || '';
            const curDrvBal = getDriverWalletBalance(activeDrvId) || (activeDrvPhone ? getDriverWalletBalance(activeDrvPhone) : 0);
            const minThresholdUsd = pricing?.driverMinWalletThresholdUsd || 0.10;
            const isEligibleOnlineDriver = Boolean(driverModeOnline && (curDrvBal >= minThresholdUsd) && curDrvBal > 0);

            if (!isEligibleOnlineDriver || !driverModeOnline) {
              setIncomingDriverRequest(null);
            } else {
            // Check for available unassigned searching rides WITHIN ADMIN DISPATCH SEARCH RADIUS
            const availableSearchingRide = sortedRides.find((r) => {
              if (r.status !== 'searching') return false;
              if (r.assignedDriverId && r.assignedDriverId !== currentUser?.id && r.assignedDriverId !== `drv_${currentUser?.id}`) {
                return false;
              }
              // Check if driver has previously declined this order
              if (currentUser?.id && r.declinedDriverIds && r.declinedDriverIds.includes(currentUser.id)) {
                return false;
              }

              // Sequential Proximity Exclusive Offer Privacy Rule:
              if (r.currentOfferedDriverId) {
                const isTargeted =
                  r.currentOfferedDriverId === currentUser?.id ||
                  r.currentOfferedDriverId === `drv_${currentUser?.id}` ||
                  (currentUser?.phone && r.currentOfferedDriverId === currentUser.phone) ||
                  (role === 'driver' && driverModeOnline);
                if (!isTargeted) return false;
              } else {
                const candidate = getNearestDriverCandidate(r, drivers, r.declinedDriverIds || []);
                const isTargeted =
                  candidate?.driver.id === currentUser?.id ||
                  candidate?.driver.id === `drv_${currentUser?.id}` ||
                  (currentUser?.phone && candidate?.driver.phone === currentUser.phone) ||
                  (role === 'driver' && driverModeOnline && !currentRide);
                if (!isTargeted) return false;
              }

              // Service Type Compatibility:
              // Normal drivers take Normal orders; Wadaage drivers take Wadaage Share orders; Dual drivers take both
              const myDriverObj = drivers.find((d) => d.id === currentUser?.id || (currentUser?.phone && d.phone === currentUser.phone));
              const driverVehicleCat = myDriverObj?.vehicle?.category;
              const isDualOrUniversal = !driverVehicleCat || driverVehicleCat === 'wadaage_both' || myDriverObj?.service_type === 'Both' || !myDriverObj?.service_type;
              const driverServiceType = myDriverObj?.service_type || (driverVehicleCat === 'wadaage_share' ? 'Wadaage' : (isDualOrUniversal ? 'Both' : 'Normal'));

              const isOrderWadaage = r.service_type === 'Wadaage' || r.category === 'wadaage_share' || r.isShared;
              const isOrderNormal = r.service_type === 'Normal' || r.category === 'wadaage_taxi' || r.category === 'wadaage_car' || (!r.isShared && r.category !== 'wadaage_share');

              if (driverServiceType === 'Wadaage' && !isOrderWadaage) return false;
              if (driverServiceType === 'Normal' && !isOrderNormal && !isDualOrUniversal) return false;

              // STRICT ADMIN DISPATCH RADIUS FILTER FROM DRIVER GPS
              const radiusCheck = isOrderWithinDriverDispatchRadius(r);
              return radiusCheck.isWithinRadius;
            });

            if (availableSearchingRide) {
              setIncomingDriverRequest((prev) => {
                if (!prev || prev.id !== availableSearchingRide.id) {
                  sounds.playIncomingPing();
                  return availableSearchingRide;
                }
                return prev;
              });
            } else {
              setIncomingDriverRequest(null);
            }
            }
          }
        } else if (role === 'admin') {
          // Admin Console: keep active ride visible for dispatch management
          setCurrentRide((current) => {
            if (current) {
              const updated = sortedRides.find((r) => r.id === current.id);
              if (updated) return updated;
            }
            const active = sortedRides.find((r) => r.status === 'searching' || r.status === 'accepted' || r.status === 'driver_arrived' || r.status === 'in_progress');
            return active || sortedRides[0] || null;
          });
        }
      }
    });

    // 4. Cross-tab & Multi-window realtime communication (0ms latency between Rider & Driver tabs)
    const handleBroadcastEvent = (data: { type: string; payload: any }) => {
      if (!data || !data.type) return;
      const { type, payload } = data;

      const isMyPassengerRide = (r: any) => {
        if (!r) return false;
        if (currentUser?.id && r.passengerId === currentUser.id) return true;
        if (currentUser?.phone && r.passengerPhone === currentUser.phone) return true;
        if (currentRide && currentRide.id === r.id) return true;
        return false;
      };

      const isMyDriverRide = (r: any) => {
        if (!r) return false;
        if (currentUser?.id && (r.assignedDriverId === currentUser.id || r.assignedDriverId === `drv_${currentUser.id}`)) return true;
        if (currentUser?.phone && r.driverPhone === currentUser.phone) return true;
        return false;
      };

      if (type === 'RIDE_REQUESTED') {
        if (role === 'driver') {
          const activeDrvId = currentUser?.id || 'live_driver';
          const activeDrvPhone = currentUser?.phone || '';
          const curDrvBal = getDriverWalletBalance(activeDrvId) || (activeDrvPhone ? getDriverWalletBalance(activeDrvPhone) : 0);
          const minThresholdUsd = pricing?.driverMinWalletThresholdUsd || 0.10;
          const isEligibleOnlineDriver = Boolean(driverModeOnline && (curDrvBal >= minThresholdUsd) && curDrvBal > 0);

          if (!isEligibleOnlineDriver || !driverModeOnline) {
            setIncomingDriverRequest(null);
            return;
          }

          // Check if driver is already on an active trip
          const hasActiveTrip = currentRide && (currentRide.status === 'accepted' || currentRide.status === 'driver_arrived' || currentRide.status === 'in_progress');

          if (hasActiveTrip) {
            // Strict Category Separation: Standard / Normal Taxi orders are private 1-person rides and NEVER accept or search for co-riders
            if (currentRide.category !== 'wadaage_share' || !currentRide.isShared) {
              return; // Ignore completely - driver is on an exclusive private taxi trip
            }

            // Only evaluate for shared on-route matches if currently in a shared ride and driver only has 1 rider
            const isIncomingShared = payload.isShared || payload.category === 'wadaage_share' || payload.service_type === 'Wadaage';
            if (currentRide.category === 'wadaage_share' && isIncomingShared && !currentRide.coPassenger && !currentRide.stackedRide && payload.pickup && payload.dropoff) {
              const isDrivingEnRoute = currentRide.status === 'in_progress';
              const initialRadiusLimit = pricing?.maxPickupRadiusKm ?? 1.0;
              const enRouteRadiusLimit = 1.5;
              const matchResult = evaluateWadaageShareMatch(
                currentRide,
                payload,
                getDriverCoordinates(),
                {
                  isDriverEnRouteWithOneRider: isDrivingEnRoute,
                  maxPickupRadiusKm: initialRadiusLimit,
                  maxEnRoutePickupRadiusKm: enRouteRadiusLimit,
                  maxHeadingDivergenceDegrees: pricing?.maxHeadingDivergenceDegrees ?? 45,
                  maxDestinationRadiusKm: pricing?.maxDestinationRadiusKm ?? 2.0,
                  maxDetourMins: pricing?.maxDetourMinutes ?? (pricing?.categoryConfigs?.wadaage_share?.rules?.maxDetourMins ?? 10),
                }
              );

              if (matchResult.isMatch) {
                sounds.playIncomingPing();
                setIncomingDriverRequest(payload);
                if (autoAcceptOnRouteShares) {
                  stackPassengerToActiveRide(payload);
                }
              }
            }
          } else {
            // Check if driver has previously declined this order
            if (currentUser?.id && payload?.declinedDriverIds && payload.declinedDriverIds.includes(currentUser.id)) {
              setIncomingDriverRequest((prev) => (prev?.id === payload?.id ? null : prev));
              return;
            }

            // Sequential Proximity Exclusive Offer Privacy Rule:
            if (payload?.currentOfferedDriverId) {
              const isTargeted =
                payload.currentOfferedDriverId === currentUser?.id ||
                payload.currentOfferedDriverId === `drv_${currentUser?.id}` ||
                (currentUser?.phone && payload.currentOfferedDriverId === currentUser.phone);
              if (!isTargeted) {
                // Another driver is currently offered this exclusively
                setIncomingDriverRequest((prev) => (prev?.id === payload?.id ? null : prev));
                return;
              }
            } else {
              const candidate = getNearestDriverCandidate(payload, drivers, payload?.declinedDriverIds || []);
              const isTargeted =
                candidate?.driver.id === currentUser?.id ||
                candidate?.driver.id === `drv_${currentUser?.id}` ||
                (currentUser?.phone && candidate?.driver.phone === currentUser.phone) ||
                (role === 'driver' && driverModeOnline && !currentRide);
              if (!isTargeted) {
                setIncomingDriverRequest((prev) => (prev?.id === payload?.id ? null : prev));
                return;
              }
            }

            // Service Type Compatibility:
            const myDriverObj = drivers.find((d) => d.id === currentUser?.id || (currentUser?.phone && d.phone === currentUser.phone));
            const driverVehicleCat = myDriverObj?.vehicle?.category;
            const isDualOrUniversal = !driverVehicleCat || driverVehicleCat === 'wadaage_both' || myDriverObj?.service_type === 'Both' || !myDriverObj?.service_type;
            const driverServiceType = myDriverObj?.service_type || (driverVehicleCat === 'wadaage_share' ? 'Wadaage' : (isDualOrUniversal ? 'Both' : 'Normal'));

            const isOrderWadaage = payload.service_type === 'Wadaage' || payload.category === 'wadaage_share' || payload.isShared;
            const isOrderNormal = payload.service_type === 'Normal' || payload.category === 'wadaage_taxi' || payload.category === 'wadaage_car' || (!payload.isShared && payload.category !== 'wadaage_share');

            if (driverServiceType === 'Wadaage' && !isOrderWadaage) return;
            if (driverServiceType === 'Normal' && !isOrderNormal && !isDualOrUniversal) return;

            // Idle driver receives incoming dispatch ping ONLY if within admin configured dispatch radius
            const radiusCheck = isOrderWithinDriverDispatchRadius(payload);
            if (radiusCheck.isWithinRadius) {
              setIncomingDriverRequest((prev) => {
                if (!prev || prev.id !== payload.id) {
                  sounds.playIncomingPing();
                  return payload;
                }
                return prev;
              });
            } else {
              console.log(`[Dispatch Filter] Order ${payload.id} ignored: pickup is ${radiusCheck.distanceKm} km away from driver GPS, exceeding admin limit of ${radiusCheck.allowedRadiusKm} km.`);
            }
          }
        } else if (role === 'passenger') {
          // Only update if it belongs to this passenger
          if (isMyPassengerRide(payload)) {
            setCurrentRide(payload);
          }
        } else if (role === 'admin') {
          setCurrentRide((curr) => (!curr || curr.id === payload.id ? payload : curr));
        }

        // Global platform rides update
        if (payload?.id) {
          setAllPlatformRides((prev) => {
            const idx = prev.findIndex((r) => r.id === payload.id);
            if (idx >= 0) {
              const updated = [...prev];
              updated[idx] = { ...updated[idx], ...payload };
              return updated;
            }
            return [payload, ...prev];
          });
        }
      } else if (type === 'RIDE_ACCEPTED') {
        if (payload?.id) {
          setAllPlatformRides((prev) => prev.map((r) => (r.id === payload.id ? { ...r, ...payload } : r)));
        }
        if (role === 'passenger') {
          if (isMyPassengerRide(payload)) {
            setCurrentRide((prev) => ({
              ...(prev || {}),
              ...payload,
              status: 'accepted',
            }));
            sounds.playAcceptedChime();
            notificationService.notifyRiderDriverAccepted({
              driverName: payload.driver_name || payload.driverName || 'Wadaage Driver',
              vehicleModel: payload.vehicle_model || payload.vehicleModel || 'Toyota Vitz',
              licensePlate: payload.license_plate || payload.licensePlate || 'SL-24810',
            });
          }
        } else if (role === 'driver') {
          const isThisDriver =
            isMyDriverRide(payload) ||
            (currentRide?.id === payload.id) ||
            (incomingDriverRequest?.id === payload.id);

          if (isThisDriver) {
            setCurrentRide((prev) => ({
              ...(prev || {}),
              ...payload,
              status: 'accepted',
            }));
            setIncomingDriverRequest(null);
            sounds.playAcceptedChime();
          } else {
            // Another driver accepted this ride
            setIncomingDriverRequest((prev) => (prev?.id === payload.id ? null : prev));
          }
        } else if (role === 'admin') {
          setCurrentRide((curr) => (curr?.id === payload.id ? { ...curr, ...payload } : curr));
        }
      } else if (type === 'RIDE_STATUS_UPDATED') {
        if (payload?.id) {
          setAllPlatformRides((prev) => prev.map((r) => (r.id === payload.id ? { ...r, ...payload } : r)));
        }
        const updateRideWithRank = (current: RideRequest | null) => {
          if (!current || current.id !== payload.id) return payload;
          const currentRank = RIDE_STATUS_RANK[current.status] || 0;
          const incomingRank = RIDE_STATUS_RANK[payload.status] || 0;
          if (incomingRank >= currentRank) return payload;
          return current;
        };

        if (role === 'passenger' && isMyPassengerRide(payload)) {
          if (cancelledRideIdsRef.current.has(payload.id) || dismissedRideIdsRef.current.has(payload.id)) {
            return;
          }
          setCurrentRide(updateRideWithRank);
          if (payload.status === 'driver_arrived') {
            sounds.playIncomingPing();
            notificationService.notifyRiderDriverArrived({
              driverName: payload.driver_name || payload.driverName || 'Wadaage Driver',
            });
          } else if (payload.status === 'in_progress') {
            sounds.playAcceptedChime();
          } else if (payload.status === 'completed') {
            sounds.playCompletedSound();
          }
        } else if (role === 'driver' && (isMyDriverRide(payload) || currentRide?.id === payload.id)) {
          if (payload.status === 'completed') {
            markRideAsDismissed(payload.id);
            try { localStorage.removeItem('wadaage_current_ride'); } catch {}
            sounds.playCompletedSound();
            setTimeout(() => {
              setCurrentRide((prev) => (prev && prev.id === payload.id ? null : prev));
            }, 1200);
          } else {
            setCurrentRide(updateRideWithRank);
          }
        } else if (role === 'admin') {
          setCurrentRide((curr) => (curr?.id === payload.id ? payload : curr));
        }
      } else if (type === 'RIDE_CANCELLED') {
        if (payload?.id) {
          markRideAsCancelled(payload.id);
          setAllPlatformRides((prev) => prev.map((r) => (r.id === payload.id ? { ...r, ...payload, status: 'cancelled' } : r)));
        }
        if (currentRide?.id === payload?.id) {
          setCurrentRide(null);
          try {
            localStorage.removeItem('wadaage_current_ride');
          } catch {}
        }
        setIncomingDriverRequest((prev) => (prev?.id === payload?.id ? null : prev));
      } else if (type === 'RIDE_RATING_SUBMITTED') {
        const rId = payload?.rideId || payload?.id;
        if (rId) {
          markRideAsDismissed(rId);
        }
        if (currentRide?.id === rId) {
          setCurrentRide(null);
          try {
            localStorage.removeItem('wadaage_current_ride');
          } catch {}
        }
      } else if (type === 'CHAT_MESSAGE') {
        if (payload && payload.message) {
          const incomingMsg: ChatMessage = payload.message;
          setChatMessages((prev) => {
            if (prev.some((m) => m.id === incomingMsg.id)) return prev;
            return [...prev, incomingMsg];
          });
          const myRole = role === 'driver' ? 'driver' : 'passenger';
          if (incomingMsg.sender !== myRole) {
            sounds.playMessageSound();
            setUnreadChatCount((count) => count + 1);
          }
        }
      } else if (type === 'DRIVER_LOCATION' || type === 'DRIVER_LOCATION_UPDATE') {
        const driverData = payload?.driver || payload;
        if (driverData && (driverData.id || driverData.phone)) {
          setDrivers((prev) => {
            const idx = prev.findIndex((d) => d.id === driverData.id || (driverData.phone && d.phone === driverData.phone));
            if (idx >= 0) {
              const updated = [...prev];
              updated[idx] = {
                ...updated[idx],
                currentLocation: {
                  lat: Number(driverData.lat ?? driverData.currentLocation?.lat ?? updated[idx].currentLocation.lat),
                  lng: Number(driverData.lng ?? driverData.currentLocation?.lng ?? updated[idx].currentLocation.lng),
                },
                status: driverData.status || updated[idx].status,
              };
              return updated;
            } else {
              const newDrv: Driver = {
                id: driverData.id || `driver_${Date.now()}`,
                name: driverData.name || 'Driver Partner',
                phone: driverData.phone || '',
                avatar: driverData.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                gender: 'male',
                rating: 5.0,
                totalTrips: 0,
                status: driverData.status || 'available',
                isVerified: true,
                kycStatus: 'approved',
                currentLocation: {
                  lat: Number(driverData.lat ?? driverData.currentLocation?.lat ?? 9.5600),
                  lng: Number(driverData.lng ?? driverData.currentLocation?.lng ?? 44.0650),
                },
                vehicle: driverData.vehicle || {
                  model: 'Toyota Vitz',
                  color: 'White',
                  licensePlate: 'SL-8842',
                  category: 'wadaage_taxi',
                  capacity: 4,
                },
                todayEarnings: 0,
                weeklyEarnings: 0,
                hoursOnline: 1,
                acceptanceRate: 100,
                service_type: 'Both',
              };
              return [newDrv, ...prev];
            }
          });
        }
      } else if (type === 'DRIVER_APPLICATION_SUBMITTED') {
        const app = payload?.application || payload;
        if (app && app.id) {
          setDriverApplications((prev) => {
            const exists = prev.some((a) => a.id === app.id);
            if (exists) {
              return prev.map((a) => (a.id === app.id ? { ...a, ...app } : a));
            }
            return [app, ...prev];
          });
        }
      } else if (type === 'DRIVER_APPLICATION_UPDATED') {
        const app = payload?.application || payload;
        if (app && app.id) {
          setDriverApplications((prev) =>
            prev.map((a) => (a.id === app.id ? { ...a, ...app } : a))
          );
          const mappedKycStatus = (app.status === 'on_hold' || app.status === 'hold')
            ? 'on_hold'
            : app.status === 'approved'
            ? 'approved'
            : app.status === 'rejected'
            ? 'rejected'
            : 'pending';

          setDrivers((prev) =>
            prev.map((d) =>
              d.phone === app.phone || d.name === app.fullName
                ? {
                    ...d,
                    isVerified: app.status === 'approved',
                    kycStatus: mappedKycStatus,
                  }
                : d
            )
          );
        }
      } else if (type === 'DRIVER_REGISTERED') {
        const driver = payload?.driver || payload;
        if (driver && driver.id) {
          setDrivers((prev) => {
            const exists = prev.some((d) => d.id === driver.id || (driver.phone && d.phone === driver.phone));
            if (exists) {
              return prev.map((d) => (d.id === driver.id || (driver.phone && d.phone === driver.phone) ? { ...d, ...driver } : d));
            }
            return [driver, ...prev];
          });
        }
      } else if (type === 'DRIVER_WALLET_UPDATED') {
        const { driverId, driverPhone, amountUsd, tx, newBalanceUsd } = payload || {};
        const targetId = driverId || driverPhone || tx?.driverId || tx?.driverPhone;
        const txStatus = String(tx?.status || '').toLowerCase();
        const isTxCompleted = !tx || txStatus === 'completed' || txStatus === 'verified';
        if (targetId && isTxCompleted) {
          if (newBalanceUsd !== undefined) {
            applyDriverBalanceUpdate(driverId || tx?.driverId || targetId, driverPhone || tx?.driverPhone, Number(newBalanceUsd), true);
          } else if (amountUsd) {
            applyDriverBalanceUpdate(driverId || tx?.driverId || targetId, driverPhone || tx?.driverPhone, Number(amountUsd), false);
          }
        }

        if (tx) {
          setDriverWalletTransactions((prev) => {
            const idx = prev.findIndex((t) => t.id === tx.id);
            if (idx >= 0) {
              const updated = [...prev];
              updated[idx] = tx;
              return updated;
            }
            return [tx, ...prev];
          });
        }
      } else if (type === 'DRIVER_TOPUP_REQUESTED') {
        const { tx } = payload || {};
        if (tx) {
          setDriverWalletTransactions((prev) => {
            if (prev.some((t) => t.id === tx.id)) return prev;
            return [tx, ...prev];
          });
        }
      }
    };

    if (rideBroadcastChannel) {
      rideBroadcastChannel.onmessage = (event) => {
        handleBroadcastEvent(event.data);
      };
    }

    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === 'wadaage_last_broadcast_event' && e.newValue) {
        try {
          const parsed = safeJsonParse(e.newValue, null);
          if (parsed) handleBroadcastEvent(parsed);
        } catch (_err) {
          // ignore
        }
      }
    };
    window.addEventListener('storage', handleStorageEvent);

    // 5. Subscribe to driver transactions
    const unsubTxs = subscribeToTransactions((remoteTxs) => {
      if (remoteTxs && remoteTxs.length > 0) {
        setDriverWalletTransactions((prev) => {
          const map = new Map<string, DriverWalletTransaction>();
          remoteTxs.forEach((t) => map.set(t.id, t));
          prev.forEach((t) => {
            if (!map.has(t.id)) {
              map.set(t.id, t);
            } else {
              const remote = map.get(t.id)!;
              // Prevent old pending status from overriding local completed or rejected status!
              if ((t.status === 'completed' || t.status === 'rejected') && remote.status === 'pending_verification') {
                map.set(t.id, t);
              }
            }
          });
          return Array.from(map.values());
        });
      }
    });

    // 6. Subscribe to driver applications (Admin Onboarding)
    const unsubApplications = subscribeToDriverApplications((remoteApps) => {
      if (remoteApps && remoteApps.length > 0) {
        setDriverApplications((prev) => {
          const map = new Map<string, DriverApplication>();
          remoteApps.forEach((a) => map.set(a.id, a));
          prev.forEach((a) => {
            if (!map.has(a.id)) map.set(a.id, a);
          });
          return Array.from(map.values());
        });
      }
    });

    // 7. Real-time Users & Password Synchronization across all devices, terminals & APKs
    const unsubUsers = subscribeToUsers((remoteUsers) => {
      if (remoteUsers && remoteUsers.length > 0) {
        const storedUsers = secureStorage.getItem<AuthUser[]>('wadaage_registered_users', []) || [];
        const merged = [...storedUsers];
        remoteUsers.forEach((ru) => {
          const ruDigits = String(ru.phone || '').replace(/\D/g, '');
          const idx = merged.findIndex((u) => u.id === ru.id || (ruDigits && u.phone && u.phone.replace(/\D/g, '') === ruDigits));
          if (idx >= 0) {
            merged[idx] = { ...merged[idx], ...ru };
          } else {
            merged.push(ru);
          }
        });
        secureStorage.setItem('wadaage_registered_users', merged);
        try {
          localStorage.setItem('wadaage_registered_users', JSON.stringify(merged));
        } catch (_e) {}

        // Keep User Management records up to date with real-time passwords
        try {
          const raw = localStorage.getItem('wadaage_user_management_records');
          const records = safeJsonParse(raw, []);
          remoteUsers.forEach((ru) => {
            const ruDigits = String(ru.phone || '').replace(/\D/g, '');
            const rIdx = records.findIndex((r: any) => r.id === ru.id || (ruDigits && String(r.phone || '').replace(/\D/g, '') === ruDigits));
            if (rIdx >= 0) {
              records[rIdx] = {
                ...records[rIdx],
                name: ru.name || records[rIdx].name,
                password: ru.password || records[rIdx].password,
                role: ru.role === 'admin' ? 'Admin' : ru.role === 'driver' ? 'Driver' : 'Passenger',
              };
            } else {
              records.push({
                id: ru.id,
                name: ru.name,
                phone: ru.phone,
                email: ru.email,
                role: ru.role === 'admin' ? 'Admin' : ru.role === 'driver' ? 'Driver' : 'Passenger',
                password: ru.password,
                status: 'Active',
                rating: 5.0,
                trips: 0,
                registeredAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
              });
            }
          });
          localStorage.setItem('wadaage_user_management_records', JSON.stringify(records));
        } catch (_e) {}
      }
    });

    return () => {
      unsubSettings();
      unsubDrivers();
      unsubRides();
      unsubTxs();
      unsubApplications();
      unsubUsers();
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, []);

  // Real-time Firestore & Server Chat Synchronization for Active Ride
  useEffect(() => {
    if (!currentRide?.id) {
      setChatMessages([]);
      setUnreadChatCount(0);
      return;
    }

    const unsubChat = subscribeToRideMessages(currentRide.id, (remoteMsgs) => {
      if (remoteMsgs && remoteMsgs.length > 0) {
        setChatMessages((prev) => {
          const map = new Map<string, ChatMessage>();
          prev.forEach((m) => map.set(m.id, m));
          remoteMsgs.forEach((m) => map.set(m.id, m));
          const merged = Array.from(map.values()).sort((a, b) => {
            const tA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const tB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return tA - tB;
          });
          return merged;
        });
      }
    });

    return () => {
      unsubChat();
    };
  }, [currentRide?.id]);

  const topUpDriverWallet = (
    amountInput: number,
    paymentProvider: 'zaad' | 'evc' | 'edahab' | 'card',
    phone?: string,
    referenceId?: string,
    smsText?: string,
    targetDriverId?: string
  ) => {
    const amountUsd = amountInput < 100 ? amountInput : amountInput / 10000;
    const amountSos = amountInput >= 100 ? amountInput : Math.round(amountInput * 10000);

    const refCode = referenceId?.trim() || `REF-${Math.floor(10000000 + Math.random() * 90000000)}`;

    // Check for duplicate reference usage
    const isDuplicate = driverWalletTransactions.some(
      (tx) => tx.referenceId && tx.referenceId.toLowerCase() === refCode.toLowerCase() && tx.status !== 'rejected'
    );

    if (isDuplicate) {
      return {
        success: false,
        message: `Transaction Reference "${refCode}" has already been submitted! Cannot reuse payment receipts.`,
      };
    }

    const providerAccount =
      paymentProvider === 'zaad'
        ? 'ZAAD (0636807814)'
        : paymentProvider === 'edahab'
        ? 'eDahab (0656807814)'
        : paymentProvider === 'evc'
        ? 'EVC Plus (*770#)'
        : 'Debit/Credit Card';

    const targetDriver = targetDriverId
      ? drivers.find((d) => d.id === targetDriverId || d.phone === targetDriverId)
      : null;

    const actualDriverId = targetDriver?.id || targetDriverId || (currentUser?.role === 'driver' ? currentUser.id : 'drv_01');
    const actualDriverName = targetDriver?.name || (currentUser?.role === 'driver' ? currentUser.name : 'Driver Partner');
    const actualDriverPhone = phone || targetDriver?.phone || currentUser?.phone || '';

    // Top-ups require Admin verification and approval before crediting balance
    const currentBalUsd = getDriverWalletBalance(actualDriverId) || 0;
    const initialStatus: 'pending_verification' = 'pending_verification';

    const newTx: DriverWalletTransaction = {
      id: `dtx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      driverId: actualDriverId,
      driverName: actualDriverName,
      driverPhone: actualDriverPhone,
      type: 'topup',
      amountUsd,
      amountSos,
      originalRequestedAmountSos: amountSos,
      originalRequestedAmountUsd: amountUsd,
      newBalanceUsd: currentBalUsd,
      title: `Top-Up Request via ${providerAccount} (+${amountSos.toLocaleString()} SLSH) - Pending Admin Approval`,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: initialStatus,
      paymentProvider,
      referenceId: refCode,
      verificationMethod: 'manual_ref',
      smsReceiptText:
        smsText ||
        `Top-up request of ${amountSos.toLocaleString()} SLSH via ${providerAccount}. Ref: ${refCode}. Awaiting Admin Verification.`,
    };

    setDriverWalletTransactions((prev) => {
      const updated = [newTx, ...prev];
      try { localStorage.setItem('wadaage_driver_wallet_transactions', JSON.stringify(updated)); } catch (_e) {}
      return updated;
    });
    saveTransactionToFirestore(newTx);

    // Sync POST to server database endpoint
    fetch(getApiUrl('/api/db/wallet-transactions'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newTx,
        alreadyCreditedOnFrontend: false,
        newBalanceUsd: currentBalUsd,
      }),
    }).catch(() => {});

    broadcastRideEvent('DRIVER_TOPUP_REQUESTED', {
      driverId: actualDriverId,
      driverPhone: actualDriverPhone,
      amountUsd,
      amountSos,
      tx: newTx,
    });

    return {
      success: true,
      message: `Top-Up request of ${amountSos.toLocaleString()} SLSH ($${amountUsd.toFixed(2)}) submitted successfully! Awaiting Admin verification and approval.`,
      txId: newTx.id,
      newBalanceUsd: currentBalUsd,
      newBalanceSos: Math.round(currentBalUsd * 10000),
    };
  };

  const verifyPaymentReceipt = (
    referenceId: string,
    amountSos: number,
    paymentProvider: 'zaad' | 'evc' | 'edahab' | 'card',
    phone: string,
    smsReceiptText?: string
  ) => {
    return topUpDriverWallet(amountSos, paymentProvider, phone, referenceId, smsReceiptText);
  };

  const approveDriverPendingTransaction = (txId: string) => {
    verifyAndApproveDriverTopUp(txId, 0);
  };

  // Helper to mutate driver balance across ALL key aliases, drivers state array, currentUser, and localStorage
  const applyDriverBalanceUpdate = (
    targetDriverId: string,
    targetDriverPhone: string | undefined,
    incomingUsdAmount: number,
    isAbsoluteBalance: boolean = false
  ): number => {
    const targetPhone = targetDriverPhone || '';
    const cleanPhone = targetPhone ? targetPhone.replace(/\D/g, '') : (targetDriverId ? targetDriverId.replace(/\D/g, '') : '');

    // Locate target driver in drivers list
    const foundDriver = drivers.find(
      (d) =>
        d.id === targetDriverId ||
        (targetPhone && d.phone === targetPhone) ||
        (cleanPhone && d.phone && String(d.phone).replace(/\D/g, '').endsWith(cleanPhone))
    );

    const actualId = foundDriver?.id || targetDriverId;
    const actualPhone = foundDriver?.phone || targetPhone;

    // Get current balance with fallback to driver record
    const retrievedBal = getDriverWalletBalance(actualId);
    const retrievedPhoneBal = actualPhone ? getDriverWalletBalance(actualPhone) : undefined;
    const effectiveRetrievedBal = retrievedBal !== undefined ? retrievedBal : retrievedPhoneBal;

    const fallbackBal = foundDriver
      ? Number(foundDriver.walletBalanceUsd ?? (foundDriver as any).wallet_balance_usd ?? 0.00)
      : (currentUser?.role === 'driver' ? Number(currentUser.walletBalanceUsd ?? 0.00) : 0.00);

    const currentBalUsd = (effectiveRetrievedBal !== undefined && !isNaN(effectiveRetrievedBal))
      ? effectiveRetrievedBal
      : (!isNaN(fallbackBal) ? fallbackBal : 0.00);

    const newBalUsd = isAbsoluteBalance
      ? Math.max(0, Math.round(incomingUsdAmount * 100) / 100)
      : Math.max(0, Math.round((currentBalUsd + incomingUsdAmount) * 100) / 100);

    // 1. Mutate driverWallets map across ALL key aliases simultaneously
    setDriverWallets((prev) => {
      const updated = { ...prev };
      const allAliases = new Set<string>();
      if (actualId) allAliases.add(actualId);
      if (targetDriverId) allAliases.add(targetDriverId);
      if (actualPhone) allAliases.add(actualPhone);
      if (targetPhone) allAliases.add(targetPhone);
      if (cleanPhone) {
        allAliases.add(cleanPhone);
        allAliases.add(`+252 ${cleanPhone}`);
        allAliases.add(`+252${cleanPhone}`);
      }
      if (foundDriver) {
        if (foundDriver.id) allAliases.add(foundDriver.id);
        if (foundDriver.phone) {
          allAliases.add(foundDriver.phone);
          const fClean = String(foundDriver.phone).replace(/\D/g, '');
          if (fClean) allAliases.add(fClean);
        }
      }
      if (currentUser && currentUser.role === 'driver') {
        const cClean = currentUser.phone ? currentUser.phone.replace(/\D/g, '') : '';
        const isCurrentDriver =
          currentUser.id === actualId ||
          currentUser.id === targetDriverId ||
          (actualPhone && currentUser.phone === actualPhone) ||
          (targetPhone && currentUser.phone === targetPhone) ||
          (cleanPhone && cClean && (cClean === cleanPhone || cClean.endsWith(cleanPhone) || cleanPhone.endsWith(cClean)));
        if (isCurrentDriver) {
          if (currentUser.id) allAliases.add(currentUser.id);
          if (currentUser.phone) allAliases.add(currentUser.phone);
        }
      }

      // Synchronize any pre-existing keys in the map that match cleanPhone or ID
      for (const k of Object.keys(prev)) {
        const kClean = k.replace(/\D/g, '');
        if (
          (cleanPhone && kClean && (kClean === cleanPhone || kClean.endsWith(cleanPhone) || cleanPhone.endsWith(kClean))) ||
          k === actualId ||
          k === targetDriverId
        ) {
          allAliases.add(k);
        }
      }

      for (const a of allAliases) {
        updated[a] = newBalUsd;
      }

      try {
        localStorage.setItem('wadaage_driver_wallets_map', JSON.stringify(updated));
        localStorage.setItem('wadaage_v2_wallets', JSON.stringify(updated));
        localStorage.setItem('wadaage_driver_wallet_balance', JSON.stringify(newBalUsd));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });

    // 2. Mutate drivers array and persist to storage
    const minThresholdUsd = pricing?.driverMinWalletThresholdUsd || 0.10;
    let targetDriverObjForSync: Driver | null = null;

    setDrivers((prev) => {
      const updatedDrivers = prev.map((d) => {
        const dClean = d.phone ? d.phone.replace(/\D/g, '') : '';
        const matches =
          d.id === actualId ||
          d.id === targetDriverId ||
          (actualPhone && d.phone === actualPhone) ||
          (targetPhone && d.phone === targetPhone) ||
          (cleanPhone && dClean && (dClean === cleanPhone || dClean.endsWith(cleanPhone) || cleanPhone.endsWith(dClean)));

        if (matches) {
          const isEligible = newBalUsd >= minThresholdUsd && newBalUsd > 0;
          const updatedD: Driver = {
            ...d,
            walletBalanceUsd: newBalUsd,
            wallet_balance_usd: newBalUsd,
            status: isEligible ? (d.status === 'offline' ? 'offline' : 'available') : 'offline',
          };
          targetDriverObjForSync = updatedD;
          return updatedD;
        }
        return d;
      });

      try {
        localStorage.setItem('wadaage_registered_drivers', JSON.stringify(updatedDrivers));
      } catch (_e) {}

      return updatedDrivers;
    });

    // Explicitly sync updated driver to Firestore and Hostinger DB
    if (targetDriverObjForSync) {
      saveDriverToFirestore(targetDriverObjForSync);
      syncDriverToHostinger(targetDriverObjForSync);
    } else {
      const fallbackDriver: Driver = {
        id: actualId,
        name: currentUser?.name || 'Driver Partner',
        phone: actualPhone,
        avatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        gender: 'male',
        rating: 5.0,
        totalTrips: 0,
        status: newBalUsd >= minThresholdUsd ? 'available' : 'offline',
        isVerified: true,
        kycStatus: 'approved',
        currentLocation: { lat: 9.5600, lng: 44.0650 },
        vehicle: { model: 'Toyota Vitz', licensePlate: 'SL-101', color: 'White', category: 'wadaage_taxi', capacity: 4 },
        todayEarnings: 0,
        weeklyEarnings: 0,
        hoursOnline: 1,
        acceptanceRate: 100,
        service_type: 'Both',
        walletBalanceUsd: newBalUsd,
        wallet_balance_usd: newBalUsd,
      };
      saveDriverToFirestore(fallbackDriver);
      syncDriverToHostinger(fallbackDriver);
    }

    // 3. Mutate currentUser if matching and persist to secureStorage & localStorage
    if (currentUser && currentUser.role === 'driver') {
      const cClean = currentUser.phone ? currentUser.phone.replace(/\D/g, '') : '';
      const isCurrentDriver =
        currentUser.id === actualId ||
        currentUser.id === targetDriverId ||
        (actualPhone && currentUser.phone === actualPhone) ||
        (targetPhone && currentUser.phone === targetPhone) ||
        (cleanPhone && cClean && (cClean === cleanPhone || cClean.endsWith(cleanPhone) || cleanPhone.endsWith(cClean)));

      if (isCurrentDriver) {
        const updatedUser: AuthUser = {
          ...currentUser,
          walletBalanceUsd: newBalUsd,
          wallet_balance_usd: newBalUsd,
        };

        setCurrentUser(updatedUser);

        try {
          secureStorage.setItem('wadaage_auth_user', updatedUser);
          secureStorage.setItem('wadaage_auth_driver', updatedUser);
          localStorage.setItem('wadaage_auth_user', JSON.stringify(updatedUser));
          localStorage.setItem('wadaage_auth_driver', JSON.stringify(updatedUser));
        } catch (_e) {}

        if (newBalUsd >= minThresholdUsd && newBalUsd > 0) {
          setLowBalanceLockoutAlert(false);
          sounds.playAcceptedChime();
        } else {
          setLowBalanceLockoutAlert(true);
          setDriverModeOnline(false);
          setIncomingDriverRequest(null);
          notificationService.stopEmergencyOrderRingtone();
        }
      }
    }

    return newBalUsd;
  };

  // Admin verifies and controls real amount received for driver top-up (strictly isolates to the targeted driver only)
  const verifyAndApproveDriverTopUp = (txId: string, realAmountSosInput?: number, adminNote?: string) => {
    setDriverWalletTransactions((prev) =>
      prev.map((tx) => {
        if (tx.id === txId) {
          // Atomic Lock Guard: Prevent double-execution if transaction is already completed or verified
          const curStatus = String(tx.status || '').toLowerCase();
          if (curStatus === 'completed' || curStatus === 'verified') {
            return tx;
          }

          const finalSos = realAmountSosInput && realAmountSosInput > 0 ? realAmountSosInput : tx.amountSos;
          const finalUsd = Math.round((finalSos / 10000) * 100) / 100;
          const targetDriverId = tx.driverId || 'drv_01';

          // Apply balance update across all key aliases
          const calculatedNewBalUsd = applyDriverBalanceUpdate(targetDriverId, tx.driverPhone, finalUsd, false);

          const approvedTx: DriverWalletTransaction = {
            ...tx,
            amountSos: finalSos,
            amountUsd: finalUsd,
            status: 'completed',
            verifiedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
            verificationMethod: 'admin_confirmation',
            adminNote: adminNote || `Verified by Admin. Real amount credited: ${finalSos.toLocaleString()} SLSH ($${finalUsd.toFixed(2)} USD) to driver ${tx.driverName || targetDriverId}.`,
          };
          saveTransactionToFirestore(approvedTx);
          fetch(getApiUrl('/api/db/wallet-transactions'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              ...approvedTx,
              alreadyCreditedOnFrontend: true,
              newBalanceUsd: calculatedNewBalUsd,
            }),
          }).catch(() => {});
          broadcastRideEvent('DRIVER_WALLET_UPDATED', {
            driverId: targetDriverId,
            driverPhone: tx.driverPhone,
            amountUsd: finalUsd,
            amountSos: finalSos,
            newBalanceUsd: calculatedNewBalUsd,
            tx: approvedTx,
          });
          return approvedTx;
        }
        return tx;
      })
    );
  };

  const rejectDriverPendingTransaction = (txId: string, adminNote?: string) => {
    setDriverWalletTransactions((prev) => {
      const updatedList = prev.map((tx) => {
        if (tx.id === txId) {
          const rejectedTx: DriverWalletTransaction = {
            ...tx,
            status: 'rejected',
            adminNote: adminNote || 'Rejected by Admin. Invalid transaction reference or payment not received.',
          };
          saveTransactionToFirestore(rejectedTx);
          fetch(getApiUrl('/api/db/wallet-transactions'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(rejectedTx),
          }).catch(() => {});
          return rejectedTx;
        }
        return tx;
      });
      try { localStorage.setItem('wadaage_driver_wallet_transactions', JSON.stringify(updatedList)); } catch (_e) {}
      return updatedList;
    });
  };

  // Admin directly credits a specific driver's wallet (by ID or phone)
  const adminCreditDriverWallet = (
    driverId: string,
    amountUsdOrSos: number,
    isSos: boolean = false,
    note?: string
  ) => {
    const amountUsd = isSos ? Math.round((amountUsdOrSos / 10000) * 100) / 100 : Math.round(amountUsdOrSos * 100) / 100;
    const amountSos = isSos ? Math.round(amountUsdOrSos) : Math.round(amountUsdOrSos * 10000);

    const cleanInput = driverId ? String(driverId).replace(/\D/g, '') : '';
    const foundDriver = drivers.find((d) =>
      d.id === driverId ||
      d.phone === driverId ||
      (d.name && d.name.toLowerCase().includes(driverId.toLowerCase())) ||
      (cleanInput && d.phone && String(d.phone).replace(/\D/g, '').endsWith(cleanInput))
    ) || {
      id: driverId,
      name: 'Driver Partner',
      phone: driverId,
      walletBalanceUsd: 0,
    };

    const targetId = foundDriver.id || driverId;
    const targetPhone = foundDriver.phone || driverId;
    const targetName = foundDriver.name || 'Driver Partner';

    // Apply balance update across all key aliases
    const calculatedNewBalanceUsd = applyDriverBalanceUpdate(targetId, targetPhone, amountUsd, false);

    // 3. Create completed ledger transaction
    const newTx: DriverWalletTransaction = {
      id: `dtx_admin_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      driverId: targetId,
      driverName: targetName,
      driverPhone: targetPhone,
      type: 'topup',
      amountUsd,
      amountSos,
      originalRequestedAmountSos: amountSos,
      originalRequestedAmountUsd: amountUsd,
      title: `Admin Direct Credit (${note || 'Manual Credit'})`,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'completed',
      verificationMethod: 'admin_confirmation',
      verifiedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      adminNote: note || `Directly credited ${amountSos.toLocaleString()} SLSH ($${amountUsd.toFixed(2)}) by Dispatch Admin`,
    };

    setDriverWalletTransactions((prev) => {
      if (prev.some((t) => t.id === newTx.id)) return prev;
      return [newTx, ...prev];
    });
    saveTransactionToFirestore(newTx);

    // Post to backend database endpoint with explicit newBalanceUsd & alreadyCreditedOnFrontend flag
    fetch(getApiUrl('/api/db/wallet-transactions'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newTx,
        user_id: targetId,
        driverId: targetId,
        driverPhone: targetPhone,
        driverName: targetName,
        transaction_type: 'topup',
        amount_usd: amountUsd,
        amountUsd,
        amountSos,
        alreadyCreditedOnFrontend: true,
        newBalanceUsd: calculatedNewBalanceUsd,
      }),
    }).catch(() => {});

    // Broadcast update with absolute newBalanceUsd so remote listeners do not apply double addition
    broadcastRideEvent('DRIVER_WALLET_UPDATED', {
      driverId: targetId,
      driverPhone: targetPhone,
      amountUsd,
      amountSos,
      newBalanceUsd: calculatedNewBalanceUsd,
      tx: newTx,
    });

    const isThisDriver = currentUser && (driverId === currentUser.id || (targetPhone && currentUser.phone === targetPhone));
    if (isThisDriver) {
      setDriverModeOnline(true);
      setLowBalanceLockoutAlert(false);
      sounds.playAcceptedChime();
    }
  };

  // Comprehensive Admin Driver Wallet Adjuster: Add, Deduct, or Set exact balance with smooth calculations
  const adminAdjustDriverWallet = (
    driverId: string,
    operation: 'add' | 'deduct' | 'set',
    amountUsdOrSos: number,
    isSos: boolean = false,
    note?: string
  ): { success: boolean; newBalanceUsd: number; newBalanceSos: number; message: string } => {
    const rawUsd = isSos ? Math.round((amountUsdOrSos / 10000) * 100) / 100 : Math.round(amountUsdOrSos * 100) / 100;
    const rawSos = isSos ? Math.round(amountUsdOrSos) : Math.round(amountUsdOrSos * 10000);

    const cleanInput = driverId ? String(driverId).replace(/\D/g, '') : '';
    const foundDriver = drivers.find((d) =>
      d.id === driverId ||
      d.phone === driverId ||
      (d.name && d.name.toLowerCase().includes(driverId.toLowerCase())) ||
      (cleanInput && d.phone && String(d.phone).replace(/\D/g, '').endsWith(cleanInput))
    ) || {
      id: driverId,
      name: 'Driver Partner',
      phone: driverId,
      walletBalanceUsd: 0,
    };

    const targetId = foundDriver.id || driverId;
    const targetPhone = foundDriver.phone || driverId;
    const targetName = foundDriver.name || 'Driver Partner';

    const currentBal = getDriverWalletBalance(targetId) || (targetPhone ? getDriverWalletBalance(targetPhone) : 0) || 0;

    let deltaUsd = 0;
    let isAbsolute = false;
    let displayAction = '';

    if (operation === 'add') {
      deltaUsd = Math.max(0, rawUsd);
      isAbsolute = false;
      displayAction = `Added +$${deltaUsd.toFixed(2)} (+${Math.round(deltaUsd * 10000).toLocaleString()} SLSH)`;
    } else if (operation === 'deduct') {
      deltaUsd = -Math.min(currentBal, Math.max(0, rawUsd));
      isAbsolute = false;
      displayAction = `Deducted -$${Math.abs(deltaUsd).toFixed(2)} (-${Math.round(Math.abs(deltaUsd) * 10000).toLocaleString()} SLSH)`;
    } else {
      // 'set' exact balance directly
      deltaUsd = Math.max(0, rawUsd);
      isAbsolute = true;
      displayAction = `Set balance directly to $${deltaUsd.toFixed(2)} (${Math.round(deltaUsd * 10000).toLocaleString()} SLSH)`;
    }

    const calculatedNewBalanceUsd = applyDriverBalanceUpdate(targetId, targetPhone, deltaUsd, isAbsolute);
    const calculatedNewBalanceSos = Math.round(calculatedNewBalanceUsd * 10000);

    // Create completed audit transaction log
    const newTx: DriverWalletTransaction = {
      id: `dtx_ctrl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      driverId: targetId,
      driverName: targetName,
      driverPhone: targetPhone,
      type: operation === 'deduct' ? 'commission_deduction' : 'topup',
      amountUsd: Math.abs(isAbsolute ? calculatedNewBalanceUsd - currentBal : deltaUsd),
      amountSos: Math.abs(isAbsolute ? (calculatedNewBalanceUsd - currentBal) * 10000 : deltaUsd * 10000),
      originalRequestedAmountSos: rawSos,
      originalRequestedAmountUsd: rawUsd,
      newBalanceUsd: calculatedNewBalanceUsd,
      title: `Admin Wallet Control: ${displayAction}`,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'completed',
      verificationMethod: 'admin_confirmation',
      verifiedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      adminNote: note || `Admin ${operation.toUpperCase()} adjustment: ${displayAction}. New balance: $${calculatedNewBalanceUsd.toFixed(2)} (${calculatedNewBalanceSos.toLocaleString()} SLSH)`,
    };

    setDriverWalletTransactions((prev) => [newTx, ...prev.filter(t => t.id !== newTx.id)]);
    saveTransactionToFirestore(newTx);

    fetch(getApiUrl('/api/db/wallet-transactions'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newTx,
        user_id: targetId,
        driverId: targetId,
        driverPhone: targetPhone,
        driverName: targetName,
        transaction_type: operation === 'deduct' ? 'commission' : 'topup',
        alreadyCreditedOnFrontend: true,
        newBalanceUsd: calculatedNewBalanceUsd,
      }),
    }).catch(() => {});

    broadcastRideEvent('DRIVER_WALLET_UPDATED', {
      driverId: targetId,
      driverPhone: targetPhone,
      amountUsd: deltaUsd,
      amountSos: Math.round(deltaUsd * 10000),
      newBalanceUsd: calculatedNewBalanceUsd,
      tx: newTx,
    });

    const isThisDriver = currentUser && (driverId === currentUser.id || (targetPhone && currentUser.phone === targetPhone));
    if (isThisDriver) {
      if (calculatedNewBalanceUsd >= 0.10) {
        setDriverModeOnline(true);
        setLowBalanceLockoutAlert(false);
      }
      sounds.playAcceptedChime();
    }

    return {
      success: true,
      newBalanceUsd: calculatedNewBalanceUsd,
      newBalanceSos: calculatedNewBalanceSos,
      message: `Driver ${targetName} wallet updated: ${displayAction}. Balance: $${calculatedNewBalanceUsd.toFixed(2)} (${calculatedNewBalanceSos.toLocaleString()} SLSH).`,
    };
  };

  // Legacy adminDirectCreditDriverWallet adapter calling adminCreditDriverWallet with SOS
  const adminDirectCreditDriverWallet = (driverId: string, amountSos: number, note?: string) => {
    adminCreditDriverWallet(driverId, amountSos, true, note);
  };

  // Admin directly credits a specific passenger/user wallet (by ID or phone)
  const adminCreditUserWallet = (userId: string, amountUsd: number, note?: string) => {
    const safeAmount = Math.max(0.01, Math.round(amountUsd * 100) / 100);
    setUserWallets((prev) => {
      const currentBal = prev[userId] !== undefined ? prev[userId] : (getUserWalletBalance(userId) || 0);
      const newBal = Math.max(0, Math.round((currentBal + safeAmount) * 100) / 100);
      const updated = { ...prev, [userId]: newBal };
      try {
        localStorage.setItem('wadaage_user_wallets_map', JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });

    const newTx: WalletTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type: 'topup',
      amount: safeAmount,
      title: note || 'Admin Wallet Credit',
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'completed',
    };

    setTransactions((prev) => [newTx, ...prev]);

    fetch(getApiUrl('/api/db/wallet-transactions'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...newTx,
        user_id: userId,
        userId: userId,
        transaction_type: 'topup',
        amount_usd: safeAmount,
        amountUsd: safeAmount,
      }),
    }).catch(() => {});

    // Also update custom user management record if stored
    try {
      const stored = localStorage.getItem('wadaage_user_management_records');
      if (stored) {
        const records = safeJsonParse(stored, []);
        const updated = records.map((r: any) => {
          if (r.id === userId || r.phone === userId) {
            return {
              ...r,
              walletBalanceUsd: Math.round(((r.walletBalanceUsd || 0) + safeAmount) * 100) / 100,
            };
          }
          return r;
        });
        localStorage.setItem('wadaage_user_management_records', JSON.stringify(updated));
      }
    } catch (_e) {}
  };

  const topUpUserWallet = (userId: string, amountUsd: number, note?: string) => {
    adminCreditUserWallet(userId, amountUsd, note);
  };

  const dismissLowBalanceAlert = () => setLowBalanceLockoutAlert(false);

  const setSoundEnabled = (enabled: boolean) => {
    setSoundEnabledState(enabled);
    sounds.setEnabled(enabled);
  };

  // Handle Promo Codes
  const applyPromoCode = (codeStr: string): boolean => {
    const code = codeStr.trim().toUpperCase();
    const found = PROMO_CODES.find((p) => p.code === code);
    if (!found) {
      setPromoError('Invalid promo code');
      return false;
    }
    setAppliedPromo(found);
    setPromoError(null);
    return true;
  };

  const removePromoCode = () => {
    setAppliedPromo(null);
    setPromoError(null);
  };

  // Top Up Wallet for active user
  const topUpWallet = (amount: number) => {
    const currentUid = currentUser?.id || 'passenger_default';
    adminCreditUserWallet(currentUid, amount, 'Instant Wallet Top-Up');
  };

  // Book Ride
  const bookRide = (
    paymentMethodParam?: 'wallet' | 'card' | 'cash',
    bookingForSomeoneElse?: { name: string; phone: string },
    isBookByBid?: boolean,
    targetBidPriceUsd?: number,
    scheduledTime?: string
  ) => {
    // Self-Order Barrier: Prevent passenger from booking/accepting a self-order if logged in as driver
    const currentPassId = currentUser?.id || 'passenger_default';
    const currentPassPhone = currentUser?.phone || '';
    const currentPassName = currentUser?.name || '';
    const activeDriverId = currentUser?.role === 'driver' ? (currentUser.id || currentUser.phone || 'drv_01') : '';
    const activeDriverPhone = currentUser?.role === 'driver' ? (currentUser.phone || '') : '';
    const activeDriverName = currentUser?.role === 'driver' ? (currentUser.name || '') : '';

    const cleanPPhone = currentPassPhone ? currentPassPhone.replace(/\D/g, '') : '';
    const cleanDPhone = activeDriverPhone ? activeDriverPhone.replace(/\D/g, '') : '';

    if (
      !bookingForSomeoneElse &&
      ((currentPassId && activeDriverId && currentPassId === activeDriverId) ||
       (cleanPPhone && cleanDPhone && cleanPPhone.length >= 6 && (cleanPPhone === cleanDPhone || cleanPPhone.endsWith(cleanDPhone) || cleanDPhone.endsWith(cleanPPhone))))
    ) {
      console.warn('Action Denied: You cannot book or accept a ride request from your own account.');
      setSelfOrderAlertMsg('Action Denied: You cannot book or accept a ride request from your own account.');
      isBookingRideRef.current = false;
      return;
    }

    // Debounce & Idempotency Lock: Prevent rapid double-clicks from creating duplicate orders
    if (isBookingRideRef.current) {
      console.warn('Booking already in progress. Ignoring duplicate click.');
      return;
    }
    isBookingRideRef.current = true;
    setTimeout(() => {
      isBookingRideRef.current = false;
    }, 2000);

    // If rider already has an active searching ride, cancel the previous one first to prevent duplicate ghost rides
    if (currentRide) {
      if (currentRide.status === 'searching') {
        console.log(`[Auto-Clean] Cancelling previous searching ride ${currentRide.id} before booking new order.`);
        const cancelledPrevious: RideRequest = {
          ...currentRide,
          status: 'cancelled',
          cancellationReason: 'Superseded by new ride request',
        };
        saveRideToFirestore(cancelledPrevious);
        syncRideToHostinger(cancelledPrevious);
        broadcastRideEvent('RIDE_CANCELLED', cancelledPrevious);
      } else if (['accepted', 'driver_arrived', 'in_progress'].includes(currentRide.status)) {
        console.warn('Cannot book another ride while an active trip is already in progress.');
        isBookingRideRef.current = false;
        return;
      }
    }

    const paymentMethod = paymentMethodParam || 'cash';
    let totalDist = roadDistanceKm || calculateDistanceKm(
      pickupLocation.lat,
      pickupLocation.lng,
      dropoffLocation.lat,
      dropoffLocation.lng
    );

    // If multi-stops exist and road distance wasn't pre-computed, accumulate distance
    if (multiStops.length > 0 && !roadRoute) {
      let currentLat = pickupLocation.lat;
      let currentLng = pickupLocation.lng;
      let accum = 0;
      multiStops.forEach((stop) => {
        accum += calculateDistanceKm(currentLat, currentLng, stop.lat, stop.lng);
        currentLat = stop.lat;
        currentLng = stop.lng;
      });
      accum += calculateDistanceKm(currentLat, currentLng, dropoffLocation.lat, dropoffLocation.lng);
      totalDist = Math.round(accum * 10) / 10;
    }

    const mins = roadDurationMins || calculateDurationMins(totalDist);
    const fareDetails = computeFare(selectedCategory, totalDist, mins, pricing, seatsBooked, poolingType, waitAndSaveTier);

    let discount = 0;
    if (appliedPromo) {
      if (appliedPromo.flatDiscount) discount = appliedPromo.flatDiscount;
      if (appliedPromo.discountPercent) discount = (fareDetails.finalFare * appliedPromo.discountPercent) / 100;
    }

    let calculatedFare = Math.max(0.30, fareDetails.finalFare - discount);
    let passIdUsed: string | undefined = undefined;

    // Check if user is using an active commuter pass for this ride
    if (isSubscriptionCommute && activePassForCorridor && activePassForCorridor.remainingTrips > 0) {
      passIdUsed = activePassForCorridor.id;
      calculatedFare = 0.00; // Covered by commuter pass
      setUserPasses((prev) =>
        prev.map((p) =>
          p.id === activePassForCorridor.id
            ? {
                ...p,
                remainingTrips: p.remainingTrips - 1,
                status: p.remainingTrips - 1 <= 0 ? 'exhausted' : 'active',
              }
            : p
        )
      );
    }

    const finalFare = calculatedFare;

    // Calculate split fare amounts if friends added
    const splitCount = splitFareWith.length + 1; // self + friends
    const myShare = finalFare / splitCount;
    const updatedSplits = splitFareWith.map((f) => ({
      ...f,
      shareAmount: Math.round((finalFare / splitCount) * 100) / 100,
    }));

    // Shared rides start with coPassenger unset until a real matching co-rider orders
    const coPass: SharedCoPassenger | undefined = undefined;

    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

    // Mock driver bids for Book by Bid mode (filtered for gender preference if active)
    const availableDriversForBids = genderPreference === 'female_only'
      ? drivers.filter((d) => d.gender === 'female')
      : drivers;

    const generatedBids = isBookByBid
      ? (availableDriversForBids.length > 0 ? availableDriversForBids : drivers).slice(0, 3).map((d, idx) => ({
          id: `bid_${idx + 1}`,
          driverId: d.id,
          driverName: d.name,
          driverRating: d.rating,
          driverAvatar: d.avatar,
          vehicleModel: `${d.vehicle.model} (${d.vehicle.licensePlate})`,
          priceUsd: Math.round((targetBidPriceUsd || (finalFare > 0 ? finalFare * (0.9 + idx * 0.1) : 0.80)) * 100) / 100,
          priceSos: Math.round(((targetBidPriceUsd || (finalFare > 0 ? finalFare * (0.9 + idx * 0.1) : 0.80))) * EXCHANGE_RATE_USD_TO_SLSH),
          includesToll: true,
        }))
      : undefined;

    const isWadaageShare = selectedCategory === 'wadaage_share';
    // Only batch if explicitly chosen as wait_and_save; standard orders dispatch immediately
    const shouldBatch = isWadaageShare && waitAndSaveTier === 'wait_and_save';
    const assignedBeacon = getRandomBeaconColor(pickupLocation.name + (currentUser?.name || ''));
    const tripBearing = calculateBearing(pickupLocation, dropoffLocation);
    const snapped = snapToNearestLandmarkAnchor(pickupLocation.lat, pickupLocation.lng);
    const effectivePickup = snapped ? snapped.landmark : pickupLocation;

    const passengerNameText = bookingForSomeoneElse?.name
      ? bookingForSomeoneElse.name
      : currentUser?.name
      ? currentUser.name
      : (language === 'so' ? 'Rakaab Wadaage' : 'Wadaage Passenger');

    const passengerPhoneText = bookingForSomeoneElse?.phone
      ? bookingForSomeoneElse.phone
      : currentUser?.phone || '';

    const newRide: RideRequest = {
      id: `ride_${Date.now()}`,
      passengerId: currentUser?.id || `user_${Date.now()}`,
      passengerName: passengerNameText,
      passengerPhone: passengerPhoneText,
      passengerAvatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      pickup: effectivePickup,
      dropoff: dropoffLocation,
      multiStops: multiStops.length > 0 ? [...multiStops] : undefined,
      category: selectedCategory,
      service_type: isWadaageShare ? 'Wadaage' : 'Normal',
      categoryName: VEHICLE_CATEGORY_DETAILS[selectedCategory]?.name || 'Wadaage Ride',
      baseFare: fareDetails.baseFare,
      distanceKm: totalDist,
      durationMins: mins,
      roadSummary: roadRouteSummary,
      isRealRoadCalculated: true,
      surgeMultiplier: fareDetails.surgeMultiplier,
      discountAmount: Math.round((fareDetails.sharedDiscountAmount + discount) * 100) / 100,
      totalFare: Math.round((splitFareWith.length > 0 ? myShare : finalFare) * 100) / 100,
      paymentMethod,
      promoCode: appliedPromo?.code,
      isShared: isWadaageShare,
      seatsBooked,
      poolingType,
      waitAndSaveTier,
      genderPreference,
      splitFareWith: updatedSplits,
      isSubscriptionCommute,
      activePassUsedId: passIdUsed,
      coPassenger: coPass,
      beaconColor: assignedBeacon,
      headingDegrees: tripBearing,
      isInBatchingPool: shouldBatch,
      batchingCountdownSeconds: shouldBatch ? 60 : 0,
      batchingExpiresAt: shouldBatch ? Date.now() + 60000 : undefined,
      status: 'searching',
      requestedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      options: { ...rideOptions },
      otpCode: generatedOtp,
      isScheduled: !!scheduledTime,
      scheduledTime,
      bookingForSomeoneElse,
      isBookByBid,
      targetBidPriceUsd,
      bids: generatedBids,
    };

    // Sequential Proximity Dispatching: resolve single nearest driver candidate via Haversine formula
    const initialCandidate = getNearestDriverCandidate(newRide, drivers, []);
    if (initialCandidate) {
      newRide.currentOfferedDriverId = initialCandidate.driver.id;
      newRide.offerExpiresAt = Date.now() + 15000; // 15-Second Rule for fast dispatch
      newRide.offerTimeoutSeconds = 15;
      newRide.driverDistanceKm = initialCandidate.distanceKm;
      newRide.declinedDriverIds = [];
    }

    setCurrentRide(newRide);
    setChatMessages([]);

    if (role === 'driver') {
      const isTargetedCandidate = initialCandidate && (
        initialCandidate.driver.id === currentUser?.id ||
        initialCandidate.driver.id === `drv_${currentUser?.id}` ||
        initialCandidate.driver.phone === currentUser?.phone
      );

      if (isTargetedCandidate) {
        sounds.playIncomingPing();
        setIncomingDriverRequest(newRide);
      } else {
        setIncomingDriverRequest(null);
      }
    } else {
      sounds.playIncomingPing();
      setIncomingDriverRequest(null);
    }

    // Record and store permanently in allPlatformRides for both rider and driver sides
    setAllPlatformRides((prev) => {
      const filtered = prev.filter((r) => r.id !== newRide.id);
      const next = [newRide, ...filtered];
      try { localStorage.setItem('wadaage_all_rides_history', JSON.stringify(next.slice(0, 150))); } catch (_e) {}
      return next;
    });

    // Save to Firestore and broadcast instantly across all open tabs / driver devices
    saveRideToFirestore(newRide);
    syncRideToHostinger(newRide);
    broadcastRideEvent('RIDE_REQUESTED', newRide);
  };

  // Create Manual Street Hail Ride (Standing Pickup & Live Taximeter on the Road by Driver)
  const createStreetHailRide = (passengerData: {
    name?: string;
    phone?: string;
    destinationAddress?: string;
    fareUsd?: number;
    distanceKm?: number;
    isLiveTaximeter?: boolean;
    paymentMethod?: 'cash' | 'wallet';
  }) => {
    const activeDriverId = currentUser?.role === 'driver' ? (currentUser.id || currentUser.phone || 'drv_01') : 'drv_01';
    const activeDriverPhone = currentUser?.role === 'driver' ? (currentUser.phone || '') : '';
    const activeDriverName = currentUser?.role === 'driver' ? (currentUser.name || 'Captain') : 'Captain';

    const driverLoc = getDriverCoordinates();
    const pickupNode: LocationNode = {
      id: `hail_pick_${Date.now()}`,
      name: 'Standing Roadside Pickup',
      address: `Roadside Pickup @ ${driverLoc.lat.toFixed(4)}, ${driverLoc.lng.toFixed(4)}, Hargeisa`,
      lat: driverLoc.lat,
      lng: driverLoc.lng,
      zone: 'Hargeisa',
    };

    const isLiveMeter = passengerData.isLiveTaximeter ?? (!passengerData.destinationAddress || passengerData.destinationAddress.trim() === '');
    const destAddress = passengerData.destinationAddress?.trim() || 'Open Taximeter Destination (On Road)';
    const dropoffNode: LocationNode = {
      id: `hail_drop_${Date.now()}`,
      name: destAddress,
      address: `${destAddress}, Hargeisa`,
      lat: driverLoc.lat + 0.020,
      lng: driverLoc.lng + 0.020,
      zone: 'Hargeisa',
    };

    const distKm = passengerData.distanceKm && passengerData.distanceKm > 0
      ? passengerData.distanceKm
      : (isLiveMeter ? 0.0 : 3.0);

    // Normal taxi fare formula: 1st KM = $1.20 (12,000 SLSH), each subsequent KM = $0.70 (7,000 SLSH)
    const initialFare = passengerData.fareUsd && passengerData.fareUsd > 0
      ? passengerData.fareUsd
      : (isLiveMeter ? 1.20 : (1.20 + Math.max(0, distKm - 1) * 0.70));

    const streetHailRide: RideRequest = {
      id: `hail_ride_${Date.now()}`,
      passengerId: `p_hail_${Date.now()}`,
      passengerName: passengerData.name?.trim() || 'Standing Roadside Passenger',
      passengerPhone: passengerData.phone?.trim() || '+252630000000',
      passengerAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      pickup: pickupNode,
      dropoff: dropoffNode,
      category: 'wadaage_taxi',
      service_type: 'Normal',
      categoryName: 'Normal Taxi (Standing Pickup)',
      baseFare: 1.20,
      distanceKm: distKm,
      liveTraveledKm: isLiveMeter ? 0.0 : distKm,
      liveMeterSeconds: isLiveMeter ? 0 : undefined,
      liveMeterStartedAt: isLiveMeter ? Date.now() : undefined,
      isLiveTaximeter: isLiveMeter,
      startCoordinates: { lat: driverLoc.lat, lng: driverLoc.lng },
      dropoffFareUsd: isLiveMeter ? 1.20 : initialFare,
      dropoffFareSlsh: isLiveMeter ? METER_FIRST_KM_SLSH : Math.round(initialFare * EXCHANGE_RATE_USD_TO_SLSH),
      durationMins: 1,
      surgeMultiplier: 1.0,
      discountAmount: 0,
      isShared: false,
      totalFare: initialFare,
      paymentMethod: passengerData.paymentMethod || 'cash',
      status: 'in_progress',
      assignedDriverId: activeDriverId,
      driverPhone: activeDriverPhone,
      driverName: activeDriverName,
      requestedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      startedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      otpCode: '1234',
    };

    const curDrvBal = getDriverWalletBalance(activeDriverId) || (activeDriverPhone ? getDriverWalletBalance(activeDriverPhone) : 0);
    const minThreshUsd = pricing.driverMinWalletThresholdUsd || 0.10;

    if (curDrvBal <= 0 || curDrvBal < minThreshUsd) {
      setLowBalanceLockoutAlert(true);
      return;
    }

    // Arm the live taximeter immediately: 0.00 KM travelled, 12,000 SLSH ($1.20) flag drop on the clock
    if (isLiveMeter) {
      const startedAt = Number(streetHailRide.liveMeterStartedAt || Date.now());
      meterRideIdRef.current = streetHailRide.id;
      meterKmRef.current = 0;
      meterStartedAtRef.current = startedAt;
      meterLastFixRef.current = { lat: driverLoc.lat, lng: driverLoc.lng };
      lastMeterSyncRef.current = Date.now();
      meterRunningRef.current = true;
      setMeterKm(0);
      setMeterSeconds(0);
      setIsMeterRunning(true);
    }

    sounds.playAcceptedChime();
    setCurrentRide(streetHailRide);
    handleRideStartCommissionDeduction(streetHailRide);

    setAllPlatformRides((prev) => [streetHailRide, ...prev.filter((r) => r.id !== streetHailRide.id)]);
    saveRideToFirestore(streetHailRide);
    syncRideToHostinger(streetHailRide);
    broadcastRideEvent('RIDE_ACCEPTED', streetHailRide);
  };

  // Live taximeter distance accumulator for in-progress standing/taximeter rides.
  // Accepts either a raw KM increment or a full authoritative meter snapshot from the driver device.
  const updateTaximeterTraveledKm = (
    addedOrState:
      | number
      | {
          totalKm?: number;
          addedKm?: number;
          fareUsd?: number;
          fareSlsh?: number;
          elapsedSeconds?: number;
          broadcast?: boolean;
        }
  ) => {
    if (!currentRide || currentRide.status !== 'in_progress') return;

    let newTraveled: number;
    let elapsedSeconds: number;
    if (typeof addedOrState === 'number') {
      newTraveled = Math.round(((currentRide.liveTraveledKm || currentRide.distanceKm || 0) + addedOrState) * 1000) / 1000;
      elapsedSeconds = Number(currentRide.liveMeterSeconds || meterSeconds || 0);
    } else {
      newTraveled = typeof addedOrState.totalKm === 'number'
        ? Math.max(0, Math.round(addedOrState.totalKm * 1000) / 1000)
        : Math.round(((currentRide.liveTraveledKm || currentRide.distanceKm || 0) + (addedOrState.addedKm || 0)) * 1000) / 1000;
      elapsedSeconds = typeof addedOrState.elapsedSeconds === 'number'
        ? Math.max(0, Math.floor(addedOrState.elapsedSeconds))
        : Number(currentRide.liveMeterSeconds || meterSeconds || 0);
    }

    // Authoritative fare: 1st KM = 12,000 SLSH ($1.20), each extra KM = +7,000 SLSH ($0.70)
    const computed = computeMeterFare(newTraveled);
    const dropoffFareUsd = typeof addedOrState === 'object' && addedOrState.fareUsd !== undefined
      ? Number(addedOrState.fareUsd)
      : computed.fareUsd;
    const dropoffFareSlsh = typeof addedOrState === 'object' && addedOrState.fareSlsh !== undefined
      ? Number(addedOrState.fareSlsh)
      : computed.fareSlsh;
    const waitingFeeUsd = Number(currentRide.waitingFeeUsd || 0);
    const updatedFare = Math.round((dropoffFareUsd + waitingFeeUsd) * 100) / 100;

    // Keep the shared meter refs in sync so both apps read identical values
    meterKmRef.current = newTraveled;
    setMeterKm(newTraveled);
    setMeterSeconds(elapsedSeconds);

    const updated: RideRequest = {
      ...currentRide,
      liveTraveledKm: newTraveled,
      distanceKm: newTraveled,
      liveMeterSeconds: elapsedSeconds,
      liveMeterStartedAt: Number(currentRide.liveMeterStartedAt || meterStartedAtRef.current || Date.now()),
      dropoffFareUsd,
      dropoffFareSlsh,
      totalFare: updatedFare,
      updatedAt: new Date().toISOString(),
    };
    setCurrentRide(updated);
    saveRideToFirestore(updated);
    if (typeof addedOrState === 'object' && addedOrState.broadcast === false) return;
    broadcastRideEvent('RIDE_STATUS_UPDATED', updated);
  };

  // Normal Taxi In-Trip Waiting Meter (500 SLSH per minute)
  const toggleWaitingTime = (rideId?: string) => {
    const targetRide = currentRide || (rideId ? allPlatformRides.find(r => r.id === rideId) : null);
    if (!targetRide) return;

    const nextIsActive = !targetRide.isWaitingActive;
    const currentSeconds = targetRide.waitingSeconds || 0;
    const waitingMinutes = currentSeconds > 0 ? Math.ceil(currentSeconds / 60) : (nextIsActive ? 1 : 0);
    const waitingFeeSlsh = waitingMinutes * 500;
    const waitingFeeUsd = Number((waitingFeeSlsh / EXCHANGE_RATE_USD_TO_SLSH).toFixed(2));

    // Calculate separated dropoff ride price
    const isShare = targetRide.category === 'wadaage_share' || targetRide.isShared;
    const ratePerKm = isShare ? 0.40 : 0.80;
    const dropoffFareUsd = targetRide.dropoffFareUsd !== undefined
      ? targetRide.dropoffFareUsd
      : Number((Number(targetRide.baseFare || 1.20) + (Number(targetRide.distanceKm || 1) * ratePerKm) - Number(targetRide.discountAmount || 0)).toFixed(2));
    const dropoffFareSlsh = Math.round(dropoffFareUsd * EXCHANGE_RATE_USD_TO_SLSH);

    const totalFare = Number((dropoffFareUsd + waitingFeeUsd).toFixed(2));

    const updated: RideRequest = {
      ...targetRide,
      isWaitingActive: nextIsActive,
      waitingStartedAt: nextIsActive ? Date.now() : targetRide.waitingStartedAt,
      waitingSeconds: currentSeconds,
      waitingMinutes,
      waitingFeeSlsh,
      waitingFeeUsd,
      dropoffFareUsd,
      dropoffFareSlsh,
      totalFare,
    };

    if (nextIsActive) {
      sounds.playAcceptedChime();
    }

    setCurrentRide(updated);
    saveRideToFirestore(updated);
    syncRideToHostinger(updated);
    broadcastRideEvent('RIDE_STATUS_UPDATED', updated);
  };

  const updateWaitingTime = (seconds: number, rideId?: string) => {
    const targetRide = currentRide || (rideId ? allPlatformRides.find(r => r.id === rideId) : null);
    if (!targetRide) return;

    const safeSeconds = Math.max(0, seconds);
    const waitingMinutes = safeSeconds > 0 ? Math.ceil(safeSeconds / 60) : 0;
    const waitingFeeSlsh = waitingMinutes * 500;
    const waitingFeeUsd = Number((waitingFeeSlsh / EXCHANGE_RATE_USD_TO_SLSH).toFixed(2));

    const isShare = targetRide.category === 'wadaage_share' || targetRide.isShared;
    const ratePerKm = isShare ? 0.40 : 0.80;
    const dropoffFareUsd = targetRide.dropoffFareUsd !== undefined
      ? targetRide.dropoffFareUsd
      : Number((Number(targetRide.baseFare || 1.20) + (Number(targetRide.distanceKm || 1) * ratePerKm) - Number(targetRide.discountAmount || 0)).toFixed(2));
    const dropoffFareSlsh = Math.round(dropoffFareUsd * EXCHANGE_RATE_USD_TO_SLSH);

    const newTotalFare = Number((dropoffFareUsd + waitingFeeUsd).toFixed(2));

    const updated: RideRequest = {
      ...targetRide,
      waitingSeconds: safeSeconds,
      waitingMinutes,
      waitingFeeSlsh,
      waitingFeeUsd,
      dropoffFareUsd,
      dropoffFareSlsh,
      totalFare: newTotalFare,
    };

    setCurrentRide(updated);
    saveRideToFirestore(updated);
    syncRideToHostinger(updated);
    broadcastRideEvent('RIDE_STATUS_UPDATED', updated);
  };

  const resetWaitingTime = (rideId?: string) => {
    const targetRide = currentRide || (rideId ? allPlatformRides.find(r => r.id === rideId) : null);
    if (!targetRide) return;

    const isShare = targetRide.category === 'wadaage_share' || targetRide.isShared;
    const ratePerKm = isShare ? 0.40 : 0.80;
    const dropoffFareUsd = targetRide.dropoffFareUsd !== undefined
      ? targetRide.dropoffFareUsd
      : Number((Number(targetRide.baseFare || 1.20) + (Number(targetRide.distanceKm || 1) * ratePerKm) - Number(targetRide.discountAmount || 0)).toFixed(2));
    const dropoffFareSlsh = Math.round(dropoffFareUsd * EXCHANGE_RATE_USD_TO_SLSH);

    const updated: RideRequest = {
      ...targetRide,
      isWaitingActive: false,
      waitingSeconds: 0,
      waitingMinutes: 0,
      waitingFeeSlsh: 0,
      waitingFeeUsd: 0,
      dropoffFareUsd,
      dropoffFareSlsh,
      totalFare: dropoffFareUsd,
    };

    setCurrentRide(updated);
    saveRideToFirestore(updated);
    syncRideToHostinger(updated);
    broadcastRideEvent('RIDE_STATUS_UPDATED', updated);
  };

  // Active Waiting Time Real-Time 1-Second Ticker for Normal Taxi (500 SLSH/min)
  useEffect(() => {
    if (!currentRide?.isWaitingActive || currentRide?.status === 'completed' || currentRide?.status === 'cancelled') {
      return;
    }

    const interval = setInterval(() => {
      setCurrentRide((prev) => {
        if (!prev || !prev.isWaitingActive) return prev;
        const nextSeconds = (prev.waitingSeconds || 0) + 1;
        const waitingMinutes = Math.ceil(nextSeconds / 60);
        const waitingFeeSlsh = waitingMinutes * 500;
        const waitingFeeUsd = Number((waitingFeeSlsh / EXCHANGE_RATE_USD_TO_SLSH).toFixed(2));

        const isShare = prev.category === 'wadaage_share' || prev.isShared;
        const ratePerKm = isShare ? 0.40 : 0.80;
        const dropoffFareUsd = prev.dropoffFareUsd !== undefined
          ? prev.dropoffFareUsd
          : Number((Number(prev.baseFare || 1.20) + (Number(prev.distanceKm || 1) * ratePerKm) - Number(prev.discountAmount || 0)).toFixed(2));
        const dropoffFareSlsh = Math.round(dropoffFareUsd * EXCHANGE_RATE_USD_TO_SLSH);

        const newTotalFare = Number((dropoffFareUsd + waitingFeeUsd).toFixed(2));

        return {
          ...prev,
          waitingSeconds: nextSeconds,
          waitingMinutes,
          waitingFeeSlsh,
          waitingFeeUsd,
          dropoffFareUsd,
          dropoffFareSlsh,
          totalFare: newTotalFare,
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentRide?.isWaitingActive, currentRide?.status]);

  // Dispatch Batch Pool Ride Immediately (Bypass 60s window)
  const dispatchBatchPoolRideNow = () => {
    if (currentRide && currentRide.isInBatchingPool) {
      const updated: RideRequest = {
        ...currentRide,
        isInBatchingPool: false,
        batchingCountdownSeconds: 0,
      };
      setCurrentRide(updated);
      sounds.playAcceptedChime();
      saveRideToFirestore(updated);
      syncRideToHostinger(updated);
      broadcastRideEvent('RIDE_STATUS_UPDATED', updated);
    }
  };

  // Dynamically Stack In-Trip Passenger onto Active Route Line (GrabShare Stacking Engine)
  const stackPassengerToActiveRide = (passengerData?: Partial<RideRequest>) => {
    if (!currentRide) return;

    // Strict Category Guard: Normal Taxi orders are private and CANNOT be stacked
    const isWadaageCurrent = currentRide.category === 'wadaage_share' || currentRide.service_type === 'Wadaage' || currentRide.isShared;
    if (!isWadaageCurrent) {
      console.warn('Cannot stack onto a private normal taxi order.');
      return;
    }

    // Single co-rider capacity guard: If driver already has 2 riders, do not stack more
    if (currentRide.coPassenger || currentRide.stackedRide) {
      console.warn('Wadaage Share maximum capacity (2 passengers) already reached.');
      return;
    }

    const realData = passengerData || incomingDriverRequest;
    if (!realData || !realData.pickup || !realData.dropoff || !realData.passengerName) {
      console.warn('stackPassengerToActiveRide requires a real passenger ride order');
      return;
    }

    // Strict Same-Rider Prevention Guard
    const p1Id = currentRide.passengerId;
    const p1Phone = currentRide.passengerPhone?.replace(/\D/g, '');
    const p2Id = realData.passengerId || realData.id;
    const p2Phone = realData.passengerPhone?.replace(/\D/g, '');

    if ((p1Id && p2Id && p1Id === p2Id) || (p1Phone && p2Phone && p1Phone === p2Phone)) {
      console.warn('[Same Rider Rejected] Passenger cannot be matched as co-rider on their own trip.');
      setIncomingDriverRequest(null);
      return;
    }

    // Ensure incoming rider is also Wadaage Share
    const isWadaageIncoming = realData.category === 'wadaage_share' || realData.service_type === 'Wadaage' || realData.isShared || !realData.category;
    if (!isWadaageIncoming) {
      console.warn('Cannot stack a non-share order into Wadaage Share.');
      return;
    }

    const stackedPassengerName = realData.passengerName;
    const stackedPassengerPhone = realData.passengerPhone || '+252 63 0000000';
    const stackedPassengerId = realData.passengerId || realData.id || `copass_${Date.now()}`;
    const stackedAvatar = realData.passengerAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80';

    const stackedPickup: LocationNode = realData.pickup;
    const stackedDropoff: LocationNode = realData.dropoff;

    const existingWaypoints: WaypointSequenceItem[] = currentRide.optimalWaypointsSequence && currentRide.optimalWaypointsSequence.length > 0
      ? currentRide.optimalWaypointsSequence
      : [
          {
            id: `wp_pick_${currentRide.id}`,
            type: 'PICKUP',
            passengerId: currentRide.passengerId,
            passengerName: currentRide.passengerName,
            passengerPhone: currentRide.passengerPhone,
            location: currentRide.pickup,
            status: currentRide.status === 'in_progress' ? 'completed' : 'pending',
            etaMins: 2,
            beaconColor: currentRide.beaconColor,
          },
          {
            id: `wp_drop_${currentRide.id}`,
            type: 'DROPOFF',
            passengerId: currentRide.passengerId,
            passengerName: currentRide.passengerName,
            passengerPhone: currentRide.passengerPhone,
            location: currentRide.dropoff,
            status: 'pending',
            etaMins: currentRide.durationMins || 12,
            beaconColor: currentRide.beaconColor,
          },
        ];

    const newBeacon = realData.beaconColor || getRandomBeaconColor(stackedPassengerName);
    const driverCoord = { lat: currentRide.pickup.lat + 0.002, lng: currentRide.pickup.lng + 0.001 };

    const { optimalWaypoints } = getOptimalSequence(
      driverCoord,
      existingWaypoints,
      {
        id: stackedPassengerId,
        name: stackedPassengerName,
        phone: stackedPassengerPhone,
        pickup: stackedPickup,
        dropoff: stackedDropoff,
        beaconColor: newBeacon,
      },
      10
    );

    const stackedFare = realData.totalFare || Math.round((currentRide.totalFare * 0.85) * 100) / 100;
    const coPassengerObj: SharedCoPassenger = {
      id: stackedPassengerId,
      name: stackedPassengerName,
      avatar: stackedAvatar,
      pickupLocation: stackedPickup,
      dropoffLocation: stackedDropoff,
      fare: stackedFare,
      status: 'matched',
      seatsBooked: realData.seatsBooked || 1,
    };

    const updated: RideRequest = {
      ...currentRide,
      isShared: true,
      stackedRide: true,
      stackedProfitUsd: 1.50,
      stackedProfitSos: 16875,
      coPassenger: coPassengerObj,
      optimalWaypointsSequence: optimalWaypoints,
    };

    setCurrentRide(updated);
    setIncomingDriverRequest(null);
    sounds.playAcceptedChime();

    // If this was triggered from an actual second ride request object, update Rider B's ride in database!
    if (realData.id) {
      const assignedDriverObj = drivers.find((d) => d.id === currentRide.assignedDriverId) || drivers[0];
      const riderBRide: RideRequest = {
        ...(realData as RideRequest),
        status: 'accepted',
        isShared: true,
        assignedDriverId: currentRide.assignedDriverId || assignedDriverObj.id,
        driverName: currentRide.driverName || assignedDriverObj.name,
        driverPhone: currentRide.driverPhone || assignedDriverObj.phone,
        driverAvatar: currentRide.driverAvatar || assignedDriverObj.avatar,
        vehicleModel: currentRide.vehicleModel || assignedDriverObj.vehicle.model,
        licensePlate: currentRide.licensePlate || assignedDriverObj.vehicle.licensePlate,
        coPassenger: {
          id: currentRide.passengerId,
          name: currentRide.passengerName,
          avatar: currentRide.passengerAvatar,
          pickupLocation: currentRide.pickup,
          dropoffLocation: currentRide.dropoff,
          fare: currentRide.totalFare,
          status: 'matched',
          seatsBooked: currentRide.seatsBooked || 1,
        },
      };
      saveRideToFirestore(riderBRide);
      syncRideToHostinger(riderBRide);
      broadcastRideEvent('RIDE_ACCEPTED', riderBRide);
    }

    // Voice announcement for Driver
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        const utterance = new SpeechSynthesisUtterance(
          `New passenger ${stackedPassengerName} matched along your route. Plus one dollar fifty bonus profit.`
        );
        utterance.rate = 1.05;
        window.speechSynthesis.speak(utterance);
      } catch {}
    }

    saveRideToFirestore(updated);
    syncRideToHostinger(updated);
    broadcastRideEvent('RIDE_STATUS_UPDATED', updated);
  };

  // Accept a driver's bid in Book by Bid mode
  const acceptBid = (bidId: string) => {
    if (!currentRide || !currentRide.bids) return;
    const bid = currentRide.bids.find((b) => b.id === bidId);
    if (!bid) return;

    sounds.playAcceptedChime();
    const updatedRide: RideRequest = {
      ...currentRide,
      status: 'accepted',
      assignedDriverId: bid.driverId,
      driverName: bid.driverName,
      driverAvatar: bid.driverAvatar,
      vehicleModel: bid.vehicleModel,
      totalFare: bid.priceUsd,
      selectedBidId: bidId,
    };

    setCurrentRide(updatedRide);
    setIncomingDriverRequest(null);

    saveRideToFirestore(updatedRide);
    syncRideToHostinger(updatedRide);
    broadcastRideEvent('RIDE_ACCEPTED', updatedRide);
  };

  // Place a real Rider B order for Wadaage Share testing / real matching
  const orderSecondRiderForWadaageShare = () => {
    const riderBId = `rider_b_${Date.now()}`;
    const pickupB: LocationNode = {
      id: 'hga_dahabshiil_b',
      name: 'Dahabshiil Bank HQ, 26 June',
      address: '26 June District, Independence Ave, Hargeisa',
      lat: 9.5615,
      lng: 44.0670,
      zone: '26 June',
    };
    const dropoffB: LocationNode = {
      id: 'hga_airport_b',
      name: 'Egal International Airport Terminal',
      address: 'Airport Road, Hargeisa',
      lat: 9.5180,
      lng: 44.0890,
      zone: 'Airport',
    };

    const distB = calculateDistanceKm(pickupB.lat, pickupB.lng, dropoffB.lat, dropoffB.lng);
    const minsB = calculateDurationMins(distB);
    const fareB = computeFare('wadaage_share', distB, minsB, pricing);
    const beaconB = getRandomBeaconColor('Faadumo Jaamac');

    const riderBRide: RideRequest = {
      id: `ride_share_b_${Date.now()}`,
      passengerId: riderBId,
      passengerName: 'Faadumo Jaamac Cali',
      passengerPhone: '+252 63 4819202',
      passengerAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      pickup: pickupB,
      dropoff: dropoffB,
      category: 'wadaage_share',
      categoryName: 'Wadaage Share',
      baseFare: fareB.baseFare,
      distanceKm: distB,
      durationMins: minsB,
      surgeMultiplier: 1.0,
      discountAmount: fareB.sharedDiscountAmount,
      totalFare: fareB.finalFare,
      paymentMethod: 'card',
      isShared: true,
      seatsBooked: 1,
      poolingType: 'door_to_door',
      waitAndSaveTier: 'express',
      genderPreference: 'any',
      beaconColor: beaconB,
      headingDegrees: calculateBearing(pickupB, dropoffB),
      status: 'searching',
      requestedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      otpCode: Math.floor(100000 + Math.random() * 900000).toString(),
    };

    sounds.playIncomingPing();
    setIncomingDriverRequest(riderBRide);
    saveRideToFirestore(riderBRide);
    syncRideToHostinger(riderBRide);
    broadcastRideEvent('RIDE_REQUESTED', riderBRide);

    // If driver already on active ride and it is a Wadaage Share trip with capacity, stack Rider B
    if (
      currentRide &&
      currentRide.category === 'wadaage_share' &&
      !currentRide.coPassenger &&
      !currentRide.stackedRide &&
      (currentRide.status === 'accepted' || currentRide.status === 'driver_arrived' || currentRide.status === 'in_progress')
    ) {
      stackPassengerToActiveRide(riderBRide);
    }
  };

  // Cancel Ride - Instant clean reset with idempotency guard
  const cancelRide = () => {
    if (currentRide) {
      const rideId = currentRide.id;
      markRideAsCancelled(rideId);
      const cancelledRide: RideRequest = {
        ...currentRide,
        status: 'cancelled',
        cancellationReason: 'Cancelled by passenger',
      };

      // Reset state immediately so rider returns to home view instantly
      setCurrentRide(null);
      setIncomingDriverRequest(null);
      try {
        localStorage.removeItem('wadaage_current_ride');
      } catch (_e) {}

      setAllPlatformRides((prev) => {
        const filtered = prev.filter((r) => r.id !== cancelledRide.id);
        const next = [cancelledRide, ...filtered];
        try { localStorage.setItem('wadaage_all_rides_history', JSON.stringify(next.slice(0, 150))); } catch (_e) {}
        return next;
      });

      saveRideToFirestore(cancelledRide);
      syncRideToHostinger(cancelledRide);
      broadcastRideEvent('RIDE_CANCELLED', cancelledRide);
    }
  };

  // Register a Real Rider (with WhatsApp phone verification and password)
  const registerRider = (userData: { name: string; phone: string; email?: string; password?: string }): AuthUser => {
    const cleanDigits = userData.phone.replace(/\D/g, '');
    const regUsers = secureStorage.getItem<AuthUser[]>('wadaage_registered_users', []) || [];
    const existing = regUsers.find((u) => u.role === 'passenger' && u.phone && u.phone.replace(/\D/g, '') === cleanDigits);

    const riderPassword = userData.password?.trim() || existing?.password || '';

    const newUser: AuthUser = existing
      ? {
          ...existing,
          name: userData.name.trim() || existing.name,
          password: riderPassword || existing.password,
        }
      : {
          id: `usr_${Date.now()}`,
          name: userData.name.trim(),
          email: userData.email || `${cleanDigits}@wadaage.com`,
          phone: userData.phone,
          password: riderPassword,
          role: 'passenger',
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        };

    // Purge previous session ride states and start completely fresh
    setCurrentRide(null);
    setIncomingDriverRequest(null);
    try {
      localStorage.removeItem('wadaage_current_ride');
      localStorage.removeItem('wadaage_user_commuter_passes');
      localStorage.removeItem('wadaage_intercity_bookings');
    } catch {}

    // Initialize fresh 0 balance for new rider
    setUserWallets((prev) => ({
      ...prev,
      [newUser.id]: prev[newUser.id] !== undefined ? prev[newUser.id] : 0.00,
    }));

    login(newUser);

    // Save directly to Backend Database & Firestore sync
    try {
      saveUserToFirestore(newUser);
      syncUserToHostinger(newUser);
      fetch(getApiUrl('/api/db/users'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser),
      }).catch(() => {});
      broadcastRideEvent('USER_REGISTERED', newUser);
    } catch (_e) {}

    // Sync to user management records & registered users storage
    try {
      const recordsStr = localStorage.getItem('wadaage_user_management_records');
      const records = safeJsonParse(recordsStr, []);
      const recIdx = records.findIndex((r: any) => r.phone === userData.phone || r.id === newUser.id);
      if (recIdx >= 0) {
        records[recIdx] = { ...records[recIdx], name: newUser.name, password: riderPassword };
      } else {
        records.unshift({
          id: newUser.id,
          name: newUser.name,
          role: 'Passenger',
          email: newUser.email,
          phone: newUser.phone,
          password: riderPassword,
          rating: 5.0,
          trips: 0,
          status: 'Active',
          registeredAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        });
      }
      localStorage.setItem('wadaage_user_management_records', JSON.stringify(records));

      const existingRegIdx = regUsers.findIndex((u: any) => u.role === 'passenger' && (u.phone === newUser.phone || u.id === newUser.id));
      if (existingRegIdx >= 0) {
        regUsers[existingRegIdx] = newUser;
      } else {
        regUsers.unshift(newUser);
      }
      localStorage.setItem('wadaage_registered_users', JSON.stringify(regUsers));
      secureStorage.setItem('wadaage_registered_users', regUsers);
    } catch (e) {
      console.error(e);
    }

    return newUser;
  };

  // Dedicated function to update user password smoothly from Admin or Settings
  const updateUserPassword = async (userIdOrPhone: string, newPassword: string): Promise<boolean> => {
    const cleanPass = newPassword.trim();
    if (!cleanPass) return false;
    const cleanDigits = userIdOrPhone.replace(/\D/g, '');

    try {
      // 1. Update wadaage_registered_users
      const regUsers = secureStorage.getItem<AuthUser[]>('wadaage_registered_users', []) || [];
      let updatedUser: AuthUser | null = null;
      const updatedRegUsers = regUsers.map((u) => {
        const uDigits = u.phone ? u.phone.replace(/\D/g, '') : '';
        if (u.id === userIdOrPhone || (cleanDigits && uDigits.endsWith(cleanDigits))) {
          const mod = { ...u, password: cleanPass };
          updatedUser = mod;
          return mod;
        }
        return u;
      });
      secureStorage.setItem('wadaage_registered_users', updatedRegUsers);
      localStorage.setItem('wadaage_registered_users', JSON.stringify(updatedRegUsers));

      // 2. Update custom drivers
      const customDrivers = secureStorage.getItem<Driver[]>('wadaage_custom_drivers', []) || [];
      const updatedDrivers = customDrivers.map((d) => {
        const dDigits = d.phone ? d.phone.replace(/\D/g, '') : '';
        if (d.id === userIdOrPhone || (cleanDigits && dDigits.endsWith(cleanDigits))) {
          return { ...d, password: cleanPass };
        }
        return d;
      });
      secureStorage.setItem('wadaage_custom_drivers', updatedDrivers);
      localStorage.setItem('wadaage_custom_drivers', JSON.stringify(updatedDrivers));

      // 3. Update state drivers & registered drivers storage
      setDrivers((prev) => {
        const next = prev.map((d) => {
          const dDigits = d.phone ? d.phone.replace(/\D/g, '') : '';
          if (d.id === userIdOrPhone || (cleanDigits && dDigits.endsWith(cleanDigits))) {
            return { ...d, password: cleanPass };
          }
          return d;
        });
        try {
          localStorage.setItem('wadaage_registered_drivers', JSON.stringify(next));
        } catch (_e) {}
        return next;
      });

      // 4. Update driver applications
      setDriverApplications((prev) =>
        prev.map((a) => {
          const aDigits = a.phone ? a.phone.replace(/\D/g, '') : '';
          if (a.id === userIdOrPhone || (cleanDigits && aDigits.endsWith(cleanDigits))) {
            return { ...a, password: cleanPass };
          }
          return a;
        })
      );

      // 5. Update user management records
      const recordsStr = localStorage.getItem('wadaage_user_management_records');
      const records = safeJsonParse(recordsStr, []);
      const updatedRecords = records.map((r: any) => {
        const rDigits = r.phone ? String(r.phone).replace(/\D/g, '') : '';
        if (r.id === userIdOrPhone || (cleanDigits && rDigits.endsWith(cleanDigits))) {
          return { ...r, password: cleanPass };
        }
        return r;
      });
      localStorage.setItem('wadaage_user_management_records', JSON.stringify(updatedRecords));

      // 6. Backend API sync
      fetch(getApiUrl(`/api/admin/users/${encodeURIComponent(userIdOrPhone)}/password`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: cleanPass }),
      }).catch(() => {});

      // 7. Firestore sync across Users, Drivers, and Driver Applications collections
      if (updatedUser) {
        updateUserInFirestore({ id: (updatedUser as AuthUser).id, password: cleanPass }).catch(() => {});
      } else {
        updateUserInFirestore({ id: userIdOrPhone, password: cleanPass }).catch(() => {});
      }
      updateDriverInFirestore(userIdOrPhone, { password: cleanPass }).catch(() => {});
      updateDriverApplicationInFirestore(userIdOrPhone, { password: cleanPass } as any).catch(() => {});

      // 8. Real-time Multi-terminal Broadcast
      broadcastRideEvent('PASSWORD_UPDATED', { id: userIdOrPhone, password: cleanPass });

      return true;
    } catch (_e) {
      return false;
    }
  };

  // Register a Real Driver (saved with pending verification for Admin review)
  const registerDriver = (driverData: {
    name: string;
    phone: string;
    password?: string;
    vehicleCategory: VehicleCategory;
    vehicleModel?: string;
    licensePlate?: string;
    vehicleColor?: string;
    autoApprove?: boolean;
  }): { driver: Driver; user: AuthUser; application: DriverApplication } => {
    const cleanPhone = driverData.phone.replace(/\D/g, '');
    const isAutoApproved = driverData.autoApprove !== undefined ? !!driverData.autoApprove : false;
    const generateUniquePassword = () => {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
      let res = 'Wad#';
      for (let i = 0; i < 6; i++) {
        res += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return res + Math.floor(10 + Math.random() * 90);
    };
    const driverPassword = driverData.password?.trim() || generateUniquePassword();

    const newDriverUser: AuthUser = {
      id: `drv_${Date.now()}`,
      name: driverData.name.trim(),
      email: `${cleanPhone}@wadaage.com`,
      phone: driverData.phone,
      password: driverPassword,
      role: 'driver',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
      walletBalanceUsd: 0.00,
      wallet_balance_usd: 0.00,
    };

    // Clean state for newly registered driver
    setCurrentRide(null);
    setIncomingDriverRequest(null);
    try {
      localStorage.removeItem('wadaage_current_ride');
      localStorage.removeItem('wadaage_driver_trip_history');
    } catch {}

    // Initialize fresh $0.00 wallet balance for new driver across all key aliases
    setDriverWallets((prev) => {
      const updated = {
        ...prev,
        [newDriverUser.id]: 0.00,
        [newDriverUser.phone]: 0.00,
        [cleanPhone]: 0.00,
        [`+252 ${cleanPhone}`]: 0.00,
        [`+252${cleanPhone}`]: 0.00,
      };
      try {
        localStorage.setItem('wadaage_driver_wallets_map', JSON.stringify(updated));
      } catch (_e) {}
      return updated;
    });

    const newDriver: Driver = {
      id: newDriverUser.id,
      name: driverData.name.trim(),
      phone: driverData.phone,
      password: driverPassword,
      avatar: newDriverUser.avatar,
      gender: 'male',
      rating: 5.0,
      totalTrips: 0,
      status: isAutoApproved ? 'available' : 'offline',
      isVerified: isAutoApproved,
      kycStatus: isAutoApproved ? 'approved' : 'pending',
      walletBalanceUsd: 0.00,
      wallet_balance_usd: 0.00,
      documentsVerified: {
        driverLicense: isAutoApproved,
        vehicleInsurance: isAutoApproved,
        backgroundCheck: isAutoApproved,
      },
      currentLocation: {
        lat: 9.560 + (Math.random() - 0.5) * 0.015,
        lng: 44.065 + (Math.random() - 0.5) * 0.015,
      },
      vehicle: {
        model: driverData.vehicleModel || 'Toyota Vitz',
        licensePlate: driverData.licensePlate || `SL-${Math.floor(10000 + Math.random() * 90000)}`,
        color: driverData.vehicleColor || 'White',
        category: driverData.vehicleCategory || 'wadaage_taxi',
        capacity: 4,
        photoUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=300&auto=format&fit=crop&q=80',
      },
      todayEarnings: 0,
      weeklyEarnings: 0,
      hoursOnline: 0,
      acceptanceRate: 100,
    };

    // Add driver to drivers state
    setDrivers((prev) => {
      const filtered = prev.filter((d) => d.phone !== driverData.phone && d.id !== newDriver.id);
      return [newDriver, ...filtered];
    });

    // Create matching application entry for Admin Review
    const newApp: DriverApplication = {
      id: `app_${Date.now()}`,
      fullName: driverData.name.trim(),
      phone: driverData.phone,
      password: driverPassword,
      address: 'Hargeisa, Somaliland',
      somalilandIdNumber: `SL-ID-${Math.floor(100000 + Math.random() * 900000)}`,
      somalilandIdPhoto: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
      somalilandLicenseNumber: `SL-DL-${Math.floor(10000 + Math.random() * 90000)}`,
      somalilandLicensePhoto: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=80',
      driverPhoto: newDriverUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      guarantor: {
        fullName: 'Responsible Guarantor',
        phone: driverData.phone,
        relationship: 'Guarantor / Dammaanad-qaade',
        address: 'Hargeisa, Somaliland',
      },
      vehicle: {
        category: driverData.vehicleCategory || 'wadaage_taxi',
        model: driverData.vehicleModel || 'Toyota Vitz',
        color: driverData.vehicleColor || 'White',
        licensePlate: driverData.licensePlate || `SL-${Math.floor(10000 + Math.random() * 90000)}`,
        photoUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=300&auto=format&fit=crop&q=80',
      },
      status: isAutoApproved ? 'approved' : 'pending',
      submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      reviewedAt: isAutoApproved ? new Date().toISOString().replace('T', ' ').substring(0, 16) : undefined,
      adminNote: isAutoApproved ? 'Instant Approved' : 'Submitted via Driver Registration Form - Pending Admin Review',
    };

    setDriverApplications((prev) => [newApp, ...prev.filter((a) => a.phone !== driverData.phone)]);

    // Save driver and user to Database, Firestore & Hostinger in background
    try {
      saveUserToFirestore(newDriverUser);
      syncUserToHostinger(newDriverUser);
      saveDriverToFirestore(newDriver);
      syncDriverToHostinger(newDriver);
      saveDriverApplicationToFirestore(newApp);

      fetch(getApiUrl('/api/db/users'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDriverUser),
      }).catch(() => {});

      fetch(getApiUrl('/api/db/drivers'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDriver),
      }).catch(() => {});

      broadcastRideEvent('USER_REGISTERED', newDriverUser);
      broadcastRideEvent('DRIVER_REGISTERED', newDriver);
      broadcastRideEvent('DRIVER_APPLICATION_SUBMITTED', newApp);
    } catch (_e) {}

    // Sync to user management records
    try {
      const recordsStr = localStorage.getItem('wadaage_user_management_records');
      const records = safeJsonParse(recordsStr, []);
      if (!records.some((r: any) => r.phone === driverData.phone || r.id === newDriver.id)) {
        records.unshift({
          id: newDriver.id,
          name: newDriver.name,
          role: 'Driver',
          email: newDriverUser.email,
          phone: newDriver.phone,
          rating: 5.0,
          trips: 0,
          status: isAutoApproved ? 'Active' : 'Pending',
          registeredAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        });
        localStorage.setItem('wadaage_user_management_records', JSON.stringify(records));
      }

      const regUsers = secureStorage.getItem<AuthUser[]>('wadaage_registered_users', []) || [];
      if (!regUsers.some((u: any) => u.phone === newDriverUser.phone || u.id === newDriverUser.id)) {
        regUsers.unshift(newDriverUser);
        localStorage.setItem('wadaage_registered_users', JSON.stringify(regUsers));
        secureStorage.setItem('wadaage_registered_users', regUsers);
      }
    } catch (e) {
      console.error(e);
    }

    if (isAutoApproved) {
      setDriverWallets((prev) => {
        const cur = prev[newDriver.id] !== undefined ? prev[newDriver.id] : 0;
        const nextBal = cur < 0.50 ? 0.50 : cur;
        const updated = { ...prev, [newDriver.id]: nextBal };
        try { localStorage.setItem('wadaage_driver_wallets_map', JSON.stringify(updated)); } catch (_e) {}
        return updated;
      });
      login(newDriverUser);
    }

    return { driver: newDriver, user: newDriverUser, application: newApp };
  };

  // Driver Accept Ride (Atomic Double-Lock with Server Mutex & Firestore Transaction)
  const acceptRideByDriver = async (driverId?: string) => {
    if (isActionPendingRef.current) {
      console.log('[RideContext] Ride action pending, ignoring duplicate accept call.');
      return { success: true, ride: currentRide || undefined };
    }
    isActionPendingRef.current = true;
    try {
      return await performAcceptRideByDriver(driverId);
    } finally {
      setTimeout(() => {
        isActionPendingRef.current = false;
      }, 400);
    }
  };

  const performAcceptRideByDriver = async (driverId?: string) => {
    notificationService.stopEmergencyOrderRingtone();
    const idToAssign = driverId || (currentUser?.role === 'driver' && currentUser?.id ? currentUser.id : (drivers.length > 0 ? drivers[0].id : (currentUser?.id || 'live_driver')));
    const drvPhone = currentUser?.phone || '';
    const curBal = getDriverWalletBalance(idToAssign) || (drvPhone ? getDriverWalletBalance(drvPhone) : 0);
    const minThreshold = pricing?.driverMinWalletThresholdUsd || 0.10;

    if (!driverModeOnline || curBal <= 0 || curBal < minThreshold) {
      setLowBalanceLockoutAlert(true);
      setIncomingDriverRequest(null);
      notificationService.stopEmergencyOrderRingtone();
      return {
        success: false,
        message: 'Ma aqbali kartid dalab inta aad offline tahay ama haraagaagu yahay 0. Fadlan ku shubo haraaga si aad online u gasho.',
      };
    }

    // If driver already on active ride and accepting incoming co-rider (Passenger B)
    if (
      currentRide &&
      incomingDriverRequest &&
      currentRide.id !== incomingDriverRequest.id &&
      (currentRide.status === 'accepted' || currentRide.status === 'driver_arrived' || currentRide.status === 'in_progress')
    ) {
      const isCurrentRideShare = currentRide.category === 'wadaage_share' || currentRide.service_type === 'Wadaage' || currentRide.isShared;
      const isIncomingShare = incomingDriverRequest.category === 'wadaage_share' || incomingDriverRequest.service_type === 'Wadaage' || incomingDriverRequest.isShared;

      if (isCurrentRideShare && isIncomingShare) {
        stackPassengerToActiveRide(incomingDriverRequest);
        setIncomingDriverRequest(null);
        return { success: true, message: 'Second passenger accepted and matched on route!' };
      } else {
        console.warn('Standard Taxi orders are private 1-person rides and cannot accept co-riders.');
        setIncomingDriverRequest(null);
        return { success: false, message: 'Private taxi orders cannot accept co-riders.' };
      }
    }

    // Only skip if currentRide is ALREADY accepted and has the exact same ID
    if (currentRide && incomingDriverRequest && currentRide.id === incomingDriverRequest.id) {
      if (['accepted', 'driver_arrived', 'in_progress'].includes(currentRide.status)) {
        setIncomingDriverRequest(null);
        return { success: true, ride: currentRide };
      }
    }

    if (incomingDriverRequest || currentRide) {
      const active = incomingDriverRequest || currentRide;
      if (!active) return;

      const driverObj =
        (currentUser?.role === 'driver' && currentUser
          ? {
              id: currentUser.id,
              name: currentUser.name || 'Wadaage Captain',
              phone: currentUser.phone || '',
              avatar: currentUser.avatar,
              vehicle: (currentUser as any)?.vehicle || { model: 'Toyota Vitz', licensePlate: 'SL-24810', color: 'White' },
            }
          : null) ||
        drivers.find((d) => d.id === idToAssign || (currentUser?.phone && d.phone === currentUser.phone)) ||
        drivers[0];

      // Self-Order Notice: In testing or preview mode, allow same account assignment
      const passId = active.passengerId || (active as any).passenger_id;
      const passPhone = active.passengerPhone || (active as any).passenger_phone;
      const drvId = driverObj?.id || idToAssign || currentUser?.id;
      const drvPhone = driverObj?.phone || currentUser?.phone;

      const cleanPassPhone = passPhone ? String(passPhone).replace(/\D/g, '') : '';
      const cleanDrvPhone = drvPhone ? String(drvPhone).replace(/\D/g, '') : '';

      if (
        (passId && drvId && passId === drvId) ||
        (cleanPassPhone && cleanDrvPhone && cleanPassPhone.length >= 6 && (cleanPassPhone === cleanDrvPhone || cleanPassPhone.endsWith(cleanDrvPhone) || cleanDrvPhone.endsWith(cleanPassPhone)))
      ) {
        console.log('[RideContext] Self-test / same account booking accepted.');
      }

      // Strict Prepaid Balance Rule: Check if driver has sufficient real prepaid balance
      const currentDrvBal = getDriverWalletBalance(drvId) || (drvPhone ? getDriverWalletBalance(drvPhone) : 0);
      const minThreshUsd = pricing.driverMinWalletThresholdUsd || 0.10;

      if (currentDrvBal <= 0 || currentDrvBal < minThreshUsd) {
        setLowBalanceLockoutAlert(true);
        setIncomingDriverRequest(null);
        notificationService.stopEmergencyOrderRingtone();
        return {
          success: false,
          message: 'HARAAGU WAA 0.00 SLSH: Ma aqbali kartid dalabka ilaa aad ku shubato haraagaaga. (Insufficient prepaid driver balance).',
        };
      }

      const resolvedDriverName = driverObj?.name || (currentUser?.role === 'driver' ? currentUser.name : 'Wadaage Captain');
      const resolvedDriverPhone = driverObj?.phone || (currentUser?.role === 'driver' ? currentUser.phone : '');
      const resolvedPlate = driverObj?.vehicle?.licensePlate || (currentUser as any)?.vehicle?.licensePlate || 'SL-24810';
      const resolvedPassengerName = active.passengerName || 'Passenger';
      const resolvedPassengerPhone = active.passengerPhone || '';

      const initialWaypoints: WaypointSequenceItem[] = active.optimalWaypointsSequence && active.optimalWaypointsSequence.length > 0
        ? active.optimalWaypointsSequence
        : [
            {
              id: `wp_pick_${active.id}`,
              type: 'PICKUP',
              passengerId: active.passengerId || 'p1',
              passengerName: resolvedPassengerName,
              passengerPhone: resolvedPassengerPhone,
              location: active.pickup || { id: 'loc_pickup', name: 'Hargeisa Pickup', address: 'Hargeisa', lat: 9.56, lng: 44.06 },
              status: 'pending',
              etaMins: 2,
              beaconColor: active.beaconColor,
            },
            {
              id: `wp_drop_${active.id}`,
              type: 'DROPOFF',
              passengerId: active.passengerId || 'p1',
              passengerName: resolvedPassengerName,
              passengerPhone: resolvedPassengerPhone,
              location: active.dropoff || { id: 'loc_dropoff', name: 'Hargeisa Dropoff', address: 'Hargeisa', lat: 9.57, lng: 44.07 },
              status: 'pending',
              etaMins: active.durationMins || 10,
              beaconColor: active.beaconColor,
            },
          ];

      const updated: RideRequest = {
        ...active,
        status: 'accepted',
        passengerName: resolvedPassengerName,
        passengerPhone: resolvedPassengerPhone,
        totalFare: Number(active.totalFare) || 2.5,
        assignedDriverId: driverObj?.id || idToAssign,
        driverName: resolvedDriverName,
        driver_name: resolvedDriverName,
        driverPhone: resolvedDriverPhone,
        driver_phone: resolvedDriverPhone,
        driverAvatar: driverObj?.avatar,
        vehicleModel: driverObj?.vehicle?.model || 'Toyota Vitz',
        vehicle_model: driverObj?.vehicle?.model || 'Toyota Vitz',
        licensePlate: resolvedPlate,
        license_plate: resolvedPlate,
        optimalWaypointsSequence: initialWaypoints,
      };

      setCurrentRide(updated);
      setIncomingDriverRequest(null);
      sounds.playAcceptedChime();

      // Mark driver as busy
      setDrivers((prev) =>
        prev.map((d) => (d.id === idToAssign ? { ...d, status: 'busy' } : d))
      );

      // Execute Atomic Double-Locking (Firestore runTransaction + Server Mutex)
      try {
        const atomicResult = await acceptRideAtomically(active.id, {
          driverId: driverObj?.id || idToAssign,
          driverName: driverObj?.name || 'Wadaage Captain',
          driverPhone: driverObj?.phone || '+252 63 6807814',
          driverAvatar: driverObj?.avatar,
          vehicleModel: driverObj?.vehicle?.model || 'Toyota Vitz',
          licensePlate: driverObj?.vehicle?.licensePlate || 'SL-24810',
          optimalWaypointsSequence: initialWaypoints,
          ride: updated,
        });

        if (atomicResult && atomicResult.conflict) {
          // Another driver won the race
          console.warn('Conflict detected:', atomicResult.message);
          setDrivers((prev) =>
            prev.map((d) => (d.id === idToAssign ? { ...d, status: 'available' } : d))
          );
          setIncomingDriverRequest(null);
          setCurrentRide(atomicResult.ride || null);
          return atomicResult;
        }

        const finalRide: RideRequest = {
          ...updated,
          ...(atomicResult?.ride || {}),
          status: 'accepted',
          assignedDriverId: driverObj?.id || idToAssign,
          driverName: driverObj?.name || updated.driverName || 'Wadaage Captain',
          driverPhone: driverObj?.phone || updated.driverPhone || '+252 63 6807814',
          driverAvatar: driverObj?.avatar || updated.driverAvatar,
          vehicleModel: driverObj?.vehicle?.model || updated.vehicleModel || 'Toyota Vitz',
          licensePlate: driverObj?.vehicle?.licensePlate || updated.licensePlate || 'SL-24810',
          optimalWaypointsSequence: initialWaypoints,
        };
        setCurrentRide(finalRide);
        setIncomingDriverRequest(null);
        syncRideToHostinger(finalRide);
        broadcastRideEvent('RIDE_ACCEPTED', finalRide);
        return { success: true, ride: finalRide };
      } catch (atomicErr: any) {
        console.warn('Atomic accept error or conflict:', atomicErr);
        if (atomicErr?.conflict || atomicErr?.message?.includes('already') || atomicErr?.message?.includes('ALREADY_ACCEPTED')) {
          setDrivers((prev) =>
            prev.map((d) => (d.id === idToAssign ? { ...d, status: 'available' } : d))
          );
          setIncomingDriverRequest(null);
          return {
            success: false,
            conflict: true,
            message: 'Codsigan waxa durba qaatay darawal kale (This trip was already accepted by another driver).',
          };
        }
        // Fallback only if transient network hiccup
        setCurrentRide(updated);
        setIncomingDriverRequest(null);
        saveRideToFirestore(updated);
        syncRideToHostinger(updated);
        broadcastRideEvent('RIDE_ACCEPTED', updated);
        return { success: true, ride: updated };
      }
    }
  };

  // Driver Decline Ride (Sequential Proximity Dispatching: immediately advance to next nearest driver)
  const declineRideByDriver = async (decliningDriverId?: string) => {
    notificationService.stopEmergencyOrderRingtone();
    const targetRide = incomingDriverRequest || currentRide;
    const driverId = decliningDriverId || currentUser?.id || (targetRide?.currentOfferedDriverId || '');

    if (targetRide) {
      const currentDeclined = targetRide.declinedDriverIds || [];
      const updatedDeclined = driverId ? Array.from(new Set([...currentDeclined, driverId])) : currentDeclined;

      const nextCandidate = getNearestDriverCandidate(targetRide, drivers, updatedDeclined);

      const reassigned: RideRequest = {
        ...targetRide,
        currentOfferedDriverId: nextCandidate?.driver?.id || undefined,
        offerExpiresAt: nextCandidate ? Date.now() + 30000 : undefined, // 30-Second Rule
        offerTimeoutSeconds: nextCandidate ? 30 : 0,
        driverDistanceKm: nextCandidate?.distanceKm,
        declinedDriverIds: updatedDeclined,
        status: 'searching',
      };

      setCurrentRide(reassigned);
      setIncomingDriverRequest(null);

      // Atomic decline registration on server and Firestore
      if (driverId) {
        declineRideAtomically(targetRide.id, driverId).catch(() => {});
      }

      saveRideToFirestore(reassigned);
      syncRideToHostinger(reassigned);
      broadcastRideEvent('RIDE_REQUESTED', reassigned);
    } else {
      setIncomingDriverRequest(null);
    }
  };

  // Driver Transfer Ride to Another Online Driver
  const transferRideToAnotherDriver = (targetDriverId?: string) => {
    notificationService.stopEmergencyOrderRingtone();
    const requestToTransfer = incomingDriverRequest || currentRide;
    if (!requestToTransfer) {
      return { success: false, message: 'No active order to transfer.' };
    }

    const currentAssignedId = requestToTransfer.assignedDriverId || currentUser?.id || '';
    const minThresholdUsd = pricing?.driverMinWalletThresholdUsd || 0.10;
    const eligibleTransferDrivers = drivers.filter((d) => {
      const bal = getDriverWalletBalance(d.id) || (d.phone ? getDriverWalletBalance(d.phone) : 0);
      return d.id !== currentAssignedId && d.status !== 'offline' && bal >= minThresholdUsd;
    });

    const targetDriver = targetDriverId
      ? eligibleTransferDrivers.find((d) => d.id === targetDriverId)
      : eligibleTransferDrivers[0];

    if (!targetDriver) {
      return { success: false, message: 'No eligible online drivers with sufficient wallet float (>1,000 SLSH) available to transfer.' };
    }

    const nextDriverName = targetDriver ? targetDriver.name : 'Captain';
    const nextDriverVehicle = targetDriver ? targetDriver.vehicle.model : 'Wadaage Vehicle';

    const transferredRide: RideRequest = {
      ...requestToTransfer,
      assignedDriverId: targetDriver ? targetDriver.id : 'driver_2',
      status: 'searching',
    };

    setCurrentRide(transferredRide);
    setIncomingDriverRequest(transferredRide);
    sounds.playIncomingPing();

    // Persist to Cloud Firestore, Hostinger and Broadcast across all tabs
    saveRideToFirestore(transferredRide);
    syncRideToHostinger(transferredRide);
    broadcastRideEvent('RIDE_REQUESTED', transferredRide);

    return {
      success: true,
      message: `Order successfully transferred to Driver ${nextDriverName} (${nextDriverVehicle})! Nearby driver notified.`,
      nextDriverName,
    };
  };

  // No-op for ride start - Commission is now deducted strictly upon rider drop-off
  const handleRideStartCommissionDeduction = (_rideObj: RideRequest) => {
    // Commission deduction moved to handleTripCommissionAndEarnings (rider drop-off / completion)
  };

  // Complete trip earnings logic & deduct 1,000 SLSH platform commission upon rider drop-off
  const handleTripCommissionAndEarnings = async (completedRideObj: RideRequest) => {
    if (!completedRideObj || !completedRideObj.id) return;

    // Deduplication Guard: Ensure platform commission & earnings are processed EXACTLY ONCE per ride
    if (chargedRideIdsRef.current.has(completedRideObj.id)) {
      console.log(`[Commission Guard] Ride ${completedRideObj.id} commission already charged. Skipping duplicate deduction.`);
      return;
    }
    chargedRideIdsRef.current.add(completedRideObj.id);
    try {
      const list = Array.from(chargedRideIdsRef.current);
      localStorage.setItem('wadaage_charged_ride_ids', JSON.stringify(list));
    } catch (_e) {}

    const totalCollectedFare =
      completedRideObj.totalFare +
      (completedRideObj.stackedProfitUsd || (completedRideObj.coPassenger ? completedRideObj.coPassenger.fare : 0));

    const targetPassengerId = completedRideObj.passengerId || currentUser?.id || 'passenger_default';
    const targetDriverId = completedRideObj.assignedDriverId || currentUser?.id || 'drv_01';
    const targetDriverPhone = completedRideObj.driverPhone || (currentUser?.role === 'driver' ? currentUser.phone : '');

    // Deduct from specific passenger wallet if wallet payment
    if (completedRideObj.paymentMethod === 'wallet') {
      setUserWallets((prev) => {
        const cur = prev[targetPassengerId] !== undefined ? prev[targetPassengerId] : (getUserWalletBalance(targetPassengerId) || 0);
        const updated = { ...prev, [targetPassengerId]: Math.max(0, Math.round((cur - completedRideObj.totalFare) * 100) / 100) };
        try { localStorage.setItem('wadaage_user_wallets_map', JSON.stringify(updated)); } catch (_e) {}
        return updated;
      });
    }

    // Deduct 1,000 SLSH ($0.10 USD) platform commission fee upon EVERY completed ride (Wadaage Share AND Normal Taxi)
    const commissionSos = 1000;
    const commissionUsd = 0.10;

    // 1. Immediate optimistic reactive state mutation across all key aliases (ID, phone, cleanPhone, drivers array, currentUser, localStorage)
    const deductedNewBalUsd = applyDriverBalanceUpdate(targetDriverId, targetDriverPhone, -commissionUsd, false);

    const commTx: DriverWalletTransaction = {
      id: `dtx_dropoff_${Date.now()}`,
      driverId: targetDriverId,
      driverPhone: targetDriverPhone,
      driverName: completedRideObj.driverName || 'Captain',
      type: 'commission_deduction',
      amountUsd: -commissionUsd,
      amountSos: -commissionSos,
      newBalanceUsd: deductedNewBalUsd,
      title: `Ride Drop-Off Commission Deducted (-1,000 SLSH) (Ride #${completedRideObj.id.slice(-6)})`,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'completed',
      rideId: completedRideObj.id,
      referenceId: `COMM-${completedRideObj.id.slice(-6)}`,
    };

    setDriverWalletTransactions((prev) => [commTx, ...prev]);
    saveTransactionToFirestore(commTx);

    // 2. Execute server ledger finish endpoint to commit transaction to MySQL/memory store
    try {
      const res = await fetch(getApiUrl(`/api/rides/${completedRideObj.id}/finish`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          driverId: targetDriverId,
          driverPhone: targetDriverPhone,
          finalFare: totalCollectedFare,
          newBalanceUsd: deductedNewBalUsd,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data && data.success && data.newBalanceUsd !== undefined) {
          const serverBal = Number(data.newBalanceUsd);
          applyDriverBalanceUpdate(targetDriverId, targetDriverPhone, serverBal, true);
        }
      }
    } catch (err) {
      console.warn('[Trip Completion] Server ledger finish call background sync:', err);
    }

    const minThresholdUsd = pricing.driverMinWalletThresholdUsd || 0.10;
    const latestDriverBal = deductedNewBalUsd;

    // Add collected fare to driver earnings across matching drivers
    setDrivers((prev) =>
      prev.map((d) => {
        const dClean = d.phone ? d.phone.replace(/\D/g, '') : '';
        const targetClean = targetDriverPhone ? targetDriverPhone.replace(/\D/g, '') : '';
        const isMatch =
          d.id === targetDriverId ||
          (targetDriverPhone && d.phone === targetDriverPhone) ||
          (targetClean && dClean && (dClean === targetClean || dClean.endsWith(targetClean) || targetClean.endsWith(dClean))) ||
          (currentUser?.id && d.id === currentUser.id) ||
          (currentUser?.phone && d.phone === currentUser.phone);

        if (isMatch) {
          return {
            ...d,
            walletBalanceUsd: latestDriverBal,
            wallet_balance_usd: latestDriverBal,
            todayEarnings: Math.round(((d.todayEarnings || 0) + totalCollectedFare) * 100) / 100,
            weeklyEarnings: Math.round(((d.weeklyEarnings || 0) + totalCollectedFare) * 100) / 100,
            totalTrips: (d.totalTrips || 0) + 1,
            status: latestDriverBal < minThresholdUsd ? 'offline' : d.status,
          };
        }
        return d;
      })
    );

    // Also update currentUser if active driver
    if (currentUser && currentUser.role === 'driver') {
      setCurrentUser((prevUser) =>
        prevUser
          ? {
              ...prevUser,
              walletBalanceUsd: latestDriverBal,
              wallet_balance_usd: latestDriverBal,
            }
          : null
      );
    }

    const targetDrv = drivers.find((d) => d.id === targetDriverId || d.phone === targetDriverPhone);
    broadcastRideEvent('DRIVER_WALLET_UPDATED', {
      driverId: targetDriverId,
      driverPhone: targetDriverPhone || targetDrv?.phone,
      amountUsd: -commissionUsd,
      amountSos: -commissionSos,
      newBalanceUsd: latestDriverBal,
      tx: commTx,
    });

    if (latestDriverBal < minThresholdUsd) {
      setDriverModeOnline(false);
      setLowBalanceLockoutAlert(true);
      sounds.playIncomingPing();
    }
  };

  // Dedicated Individual Rider State Controls (Supports 2-Rider Shared Control Panel)
  const advanceIndividualRiderAction = (
    targetOrAction: 'RIDER_A' | 'RIDER_B' | 'pickup_a' | 'dropoff_a' | 'pickup_b' | 'dropoff_b',
    actionParam?: 'arrived' | 'pickup' | 'dropoff'
  ) => {
    if (!currentRide) return;
    if (isActionPendingRef.current) {
      console.log('[RideContext] Rider action currently in progress, ignoring duplicate trigger.');
      return;
    }
    isActionPendingRef.current = true;
    try {
      performAdvanceIndividualRiderAction(targetOrAction, actionParam);
    } finally {
      setTimeout(() => {
        isActionPendingRef.current = false;
      }, 500);
    }
  };

  const performAdvanceIndividualRiderAction = (
    targetOrAction: 'RIDER_A' | 'RIDER_B' | 'pickup_a' | 'dropoff_a' | 'pickup_b' | 'dropoff_b',
    actionParam?: 'arrived' | 'pickup' | 'dropoff'
  ) => {
    if (!currentRide) return;

    let target: 'RIDER_A' | 'RIDER_B' = 'RIDER_A';
    let action: 'arrived' | 'pickup' | 'dropoff' = 'pickup';

    if (targetOrAction === 'pickup_a') {
      target = 'RIDER_A';
      action = 'pickup';
    } else if (targetOrAction === 'dropoff_a') {
      target = 'RIDER_A';
      action = 'dropoff';
    } else if (targetOrAction === 'pickup_b') {
      target = 'RIDER_B';
      action = 'pickup';
    } else if (targetOrAction === 'dropoff_b') {
      target = 'RIDER_B';
      action = 'dropoff';
    } else {
      target = targetOrAction;
      action = actionParam || 'pickup';
    }

    let updatedRide: RideRequest = { ...currentRide };
    let waypoints = currentRide.optimalWaypointsSequence ? [...currentRide.optimalWaypointsSequence] : [];

    if (target === 'RIDER_A') {
      if (action === 'arrived') {
        sounds.playIncomingPing();
        updatedRide.status = 'driver_arrived';
      } else if (action === 'pickup') {
        sounds.playAcceptedChime();
        if (updatedRide.status !== 'in_progress') {
          handleRideStartCommissionDeduction(updatedRide);
        }
        updatedRide.status = 'in_progress';
        if (!updatedRide.startedAt) {
          updatedRide.startedAt = new Date().toLocaleTimeString();
        }
        waypoints = waypoints.map((w) =>
          w.type === 'PICKUP' && (w.passengerId === currentRide.passengerId || w.passengerName === currentRide.passengerName)
            ? { ...w, status: 'completed' as const }
            : w
        );
      } else if (action === 'dropoff') {
        sounds.playIncomingPing();
        waypoints = waypoints.map((w) =>
          w.type === 'DROPOFF' && (w.passengerId === currentRide.passengerId || w.passengerName === currentRide.passengerName)
            ? { ...w, status: 'completed' as const }
            : w
        );

        // Broadcast Rider A's specific completion to Firestore/Relay so Rider A's app instance opens receipt & rating modal
        const riderACompletion: RideRequest = {
          ...currentRide,
          status: 'completed',
          completedAt: new Date().toLocaleTimeString(),
        };
        saveRideToFirestore(riderACompletion);
        syncRideToHostinger(riderACompletion);
        broadcastRideEvent('RIDE_STATUS_UPDATED', riderACompletion);

        const isRiderBDone = !currentRide.coPassenger || currentRide.coPassenger.status === 'dropped_off';
        if (isRiderBDone) {
          updatedRide.status = 'completed';
          updatedRide.completedAt = new Date().toLocaleTimeString();
          markRideAsDismissed(updatedRide.id);
          sounds.playCompletedSound();
          handleTripCommissionAndEarnings(updatedRide);
          setTimeout(() => {
            setCurrentRide((prev) => (prev && prev.id === updatedRide.id && prev.status === 'completed' ? null : prev));
            try { localStorage.removeItem('wadaage_current_ride'); } catch (_e) {}
          }, 1500);
        }
      }
    } else if (target === 'RIDER_B') {
      if (!currentRide.coPassenger) return;

      if (action === 'arrived') {
        sounds.playIncomingPing();
        updatedRide.coPassenger = {
          ...currentRide.coPassenger,
          status: 'picking_up',
        };
      } else if (action === 'pickup') {
        sounds.playAcceptedChime();
        updatedRide.coPassenger = {
          ...currentRide.coPassenger,
          status: 'picked_up',
        };
        waypoints = waypoints.map((w) =>
          w.type === 'PICKUP' && (w.passengerId === currentRide.coPassenger?.id || w.passengerName === currentRide.coPassenger?.name)
            ? { ...w, status: 'completed' as const }
            : w
        );
      } else if (action === 'dropoff') {
        sounds.playIncomingPing();
        updatedRide.coPassenger = {
          ...currentRide.coPassenger,
          status: 'dropped_off',
        };
        waypoints = waypoints.map((w) =>
          w.type === 'DROPOFF' && (w.passengerId === currentRide.coPassenger?.id || w.passengerName === currentRide.coPassenger?.name)
            ? { ...w, status: 'completed' as const }
            : w
        );

        // Sync co-passenger completion to Firestore
        if (currentRide.coPassenger) {
          const coRiderCompletion: RideRequest = {
            id: currentRide.coPassenger.id || `co_${Date.now()}`,
            passengerId: currentRide.coPassenger.id || `co_${Date.now()}`,
            passengerName: currentRide.coPassenger.name || 'Co-Passenger',
            passengerPhone: '+252 63 4819202',
            passengerAvatar: currentRide.coPassenger.avatar,
            pickup: currentRide.coPassenger.pickupLocation || { id: 'co_pick', name: 'Pickup', address: 'Hargeisa', lat: 9.56, lng: 44.06 },
            dropoff: currentRide.coPassenger.dropoffLocation || { id: 'co_drop', name: 'Dropoff', address: 'Hargeisa', lat: 9.57, lng: 44.07 },
            category: 'wadaage_share',
            categoryName: 'Wadaage Share',
            baseFare: 0.50,
            distanceKm: 3.2,
            durationMins: 8,
            surgeMultiplier: 1.0,
            discountAmount: 0.50,
            totalFare: currentRide.coPassenger.fare || 1.5,
            paymentMethod: 'card',
            isShared: true,
            seatsBooked: currentRide.coPassenger.seatsBooked || 1,
            status: 'completed',
            requestedAt: new Date().toLocaleTimeString(),
            assignedDriverId: currentRide.assignedDriverId,
            driverName: currentRide.driverName,
            driverPhone: currentRide.driverPhone,
            completedAt: new Date().toLocaleTimeString(),
          };
          saveRideToFirestore(coRiderCompletion);
          syncRideToHostinger(coRiderCompletion);
          broadcastRideEvent('RIDE_STATUS_UPDATED', coRiderCompletion);
        }

        // Check if Rider A is also dropped off
        const dropoffWpA = waypoints.find(
          (w) => w.type === 'DROPOFF' && (w.passengerId === currentRide.passengerId || w.passengerName === currentRide.passengerName)
        );
        const isRiderADone = dropoffWpA ? dropoffWpA.status === 'completed' : false;

        if (isRiderADone) {
          updatedRide.status = 'completed';
          updatedRide.completedAt = new Date().toLocaleTimeString();
          markRideAsDismissed(updatedRide.id);
          sounds.playCompletedSound();
          handleTripCommissionAndEarnings(updatedRide);
          setTimeout(() => {
            setCurrentRide((prev) => (prev && prev.id === updatedRide.id && prev.status === 'completed' ? null : prev));
            try { localStorage.removeItem('wadaage_current_ride'); } catch (_e) {}
          }, 1500);
        }
      }
    }

    if (waypoints.length > 0) {
      updatedRide.optimalWaypointsSequence = waypoints;
    }

    setCurrentRide(updatedRide);
    saveRideToFirestore(updatedRide);
    syncRideToHostinger(updatedRide);
    broadcastRideEvent('RIDE_STATUS_UPDATED', updatedRide);
  };

  // Toggle Dropoff Order priority between Rider A and Rider B
  const toggleDropoffPriority = () => {
    if (!currentRide || !currentRide.optimalWaypointsSequence || currentRide.optimalWaypointsSequence.length < 2) return;
    const waypoints = [...currentRide.optimalWaypointsSequence];
    const dropAIdx = waypoints.findIndex((w) => w.type === 'DROPOFF' && (w.passengerId === currentRide.passengerId || w.passengerName === currentRide.passengerName));
    const dropBIdx = waypoints.findIndex((w) => w.type === 'DROPOFF' && (w.passengerId === currentRide.coPassenger?.id || w.passengerName === currentRide.coPassenger?.name));

    if (dropAIdx !== -1 && dropBIdx !== -1) {
      const temp = waypoints[dropAIdx];
      waypoints[dropAIdx] = waypoints[dropBIdx];
      waypoints[dropBIdx] = temp;

      const updated = {
        ...currentRide,
        optimalWaypointsSequence: waypoints,
      };
      setCurrentRide(updated);
      saveRideToFirestore(updated);
      syncRideToHostinger(updated);
      broadcastRideEvent('RIDE_STATUS_UPDATED', updated);
    }
  };

  // Cancel or Remove Individual Rider B
  const cancelIndividualRider = (target: 'A' | 'B' | 'RIDER_A' | 'RIDER_B', _reason?: string) => {
    if (!currentRide) return;
    const normalizedTarget: 'RIDER_A' | 'RIDER_B' = target === 'A' || target === 'RIDER_A' ? 'RIDER_A' : 'RIDER_B';
    if (normalizedTarget === 'RIDER_B' && currentRide.coPassenger) {
      const waypoints = (currentRide.optimalWaypointsSequence || []).filter(
        (w) => w.passengerId !== currentRide.coPassenger?.id && w.passengerName !== currentRide.coPassenger?.name
      );
      const updated: RideRequest = {
        ...currentRide,
        coPassenger: undefined,
        stackedRide: false,
        stackedProfitUsd: 0,
        stackedProfitSos: 0,
        optimalWaypointsSequence: waypoints.length > 0 ? waypoints : undefined,
      };
      setCurrentRide(updated);
      saveRideToFirestore(updated);
      syncRideToHostinger(updated);
      broadcastRideEvent('RIDE_STATUS_UPDATED', updated);
    } else if (target === 'RIDER_A') {
      cancelRide();
    }
  };

  // Advance Ride Lifecycle: accepted -> driver_arrived -> in_progress -> completed (Supports Multi-Passenger Waypoint Sequencing)
  const advanceDriverRideState = () => {
    if (!currentRide) return;
    if (isActionPendingRef.current) {
      console.log('[RideContext] Driver state transition currently in progress, ignoring duplicate trigger.');
      return;
    }
    isActionPendingRef.current = true;
    try {
      performAdvanceDriverRideState();
    } finally {
      setTimeout(() => {
        isActionPendingRef.current = false;
      }, 200);
    }
  };

  const performAdvanceDriverRideState = () => {
    if (!currentRide) return;

    // 1. Step 1: accepted -> driver_arrived ("📍 WAAN GAADHAY • I HAVE ARRIVED")
    if (currentRide.status === 'accepted') {
      sounds.playButtonClick();
      const updatedWaypoints = currentRide.optimalWaypointsSequence
        ? currentRide.optimalWaypointsSequence.map((w, idx) =>
            (idx === 0 || w.type === 'PICKUP') ? { ...w, status: 'arrived' as any } : w
          )
        : undefined;

      const arrivedRide: RideRequest = {
        ...currentRide,
        status: 'driver_arrived',
        arrivedAt: new Date().toLocaleTimeString(),
        optimalWaypointsSequence: updatedWaypoints || currentRide.optimalWaypointsSequence,
      };
      setCurrentRide(arrivedRide);
      saveRideToFirestore(arrivedRide);
      syncRideToHostinger(arrivedRide);
      broadcastRideEvent('RIDE_STATUS_UPDATED', arrivedRide);
      return;
    }

    // 2. Step 2: driver_arrived -> in_progress ("🚗 BILOW SAFARKA • START TRIP")
    if (currentRide.status === 'driver_arrived') {
      sounds.playButtonClick();
      handleRideStartCommissionDeduction(currentRide);

      const updatedWaypoints = currentRide.optimalWaypointsSequence
        ? currentRide.optimalWaypointsSequence.map((w) =>
            w.type === 'PICKUP' ? { ...w, status: 'completed' as const } : w
          )
        : undefined;

      const inProgressRide: RideRequest = {
        ...currentRide,
        status: 'in_progress',
        startedAt: currentRide.startedAt || new Date().toLocaleTimeString(),
        optimalWaypointsSequence: updatedWaypoints || currentRide.optimalWaypointsSequence,
      };
      setCurrentRide(inProgressRide);
      saveRideToFirestore(inProgressRide);
      syncRideToHostinger(inProgressRide);
      broadcastRideEvent('RIDE_STATUS_UPDATED', inProgressRide);
      return;
    }

    // 3. Step 3: in_progress -> completed ("✅ DHAMMEE SAFARKA • FINISH TRIP")
    if (currentRide.status === 'in_progress') {
      // Check if intermediate stacked co-passenger waypoint exists
      const waypoints = currentRide.optimalWaypointsSequence;
      if (waypoints && waypoints.length > 2 && currentRide.coPassenger) {
        const nextPendingIndex = waypoints.findIndex((w) => w.status === 'pending');
        if (nextPendingIndex !== -1) {
          const activeWp = waypoints[nextPendingIndex];
          const updatedWaypoints = waypoints.map((w, idx) =>
            idx === nextPendingIndex ? { ...w, status: 'completed' as const } : w
          );
          const hasMorePending = updatedWaypoints.some((w) => w.status === 'pending');
          if (hasMorePending) {
            sounds.playIncomingPing();
            const updated: RideRequest = {
              ...currentRide,
              status: 'in_progress',
              optimalWaypointsSequence: updatedWaypoints,
            };
            setCurrentRide(updated);
            saveRideToFirestore(updated);
            syncRideToHostinger(updated);
            broadcastRideEvent('RIDE_STATUS_UPDATED', updated);
            return;
          }
        }
      }

      // Finish trip, trigger commission & earnings, deduct time/fares
      sounds.playCompletedSound();
      handleTripCommissionAndEarnings(currentRide);

      const updatedWaypoints = currentRide.optimalWaypointsSequence
        ? currentRide.optimalWaypointsSequence.map((w) => ({ ...w, status: 'completed' as const }))
        : undefined;

      const completedRide: RideRequest = {
        ...currentRide,
        status: 'completed',
        completedAt: new Date().toLocaleTimeString(),
        optimalWaypointsSequence: updatedWaypoints || currentRide.optimalWaypointsSequence,
      };
      markRideAsDismissed(completedRide.id);
      setCurrentRide(completedRide);
      setAllPlatformRides((prev) => {
        const filtered = prev.filter((r) => r.id !== completedRide.id);
        const next = [completedRide, ...filtered];
        try { localStorage.setItem('wadaage_all_rides_history', JSON.stringify(next.slice(0, 150))); } catch (_e) {}
        return next;
      });
      saveRideToFirestore(completedRide);
      syncRideToHostinger(completedRide);
      broadcastRideEvent('RIDE_STATUS_UPDATED', completedRide);

      // Auto-clear completed ride for driver after broadcast so UI returns cleanly to idle/dispatch mode
      setTimeout(() => {
        setCurrentRide((prev) => (prev && prev.id === completedRide.id && prev.status === 'completed' ? null : prev));
        try { localStorage.removeItem('wadaage_current_ride'); } catch (_e) {}
      }, 1500);
      return;
    }

    // Fallback: complete ride
    sounds.playCompletedSound();
    handleTripCommissionAndEarnings(currentRide);
    const completedRide: RideRequest = {
      ...currentRide,
      status: 'completed',
      completedAt: new Date().toLocaleTimeString(),
    };
    markRideAsDismissed(completedRide.id);
    setCurrentRide(completedRide);
    setAllPlatformRides((prev) => {
      const filtered = prev.filter((r) => r.id !== completedRide.id);
      const next = [completedRide, ...filtered];
      try { localStorage.setItem('wadaage_all_rides_history', JSON.stringify(next.slice(0, 150))); } catch (_e) {}
      return next;
    });
    saveRideToFirestore(completedRide);
    syncRideToHostinger(completedRide);
    broadcastRideEvent('RIDE_STATUS_UPDATED', completedRide);

    setTimeout(() => {
      setCurrentRide((prev) => (prev && prev.id === completedRide.id && prev.status === 'completed' ? null : prev));
      try { localStorage.removeItem('wadaage_current_ride'); } catch (_e) {}
    }, 1500);
  };

  // Rate and Tip
  const rateAndTipRide = (rating: number, tip: number) => {
    if (currentRide) {
      const rideId = currentRide.id;
      markRideAsDismissed(rideId);
      if (tip > 0) {
        const targetPassengerId = currentRide.passengerId || currentUser?.id || 'passenger_default';
        setUserWallets((prev) => {
          const cur = prev[targetPassengerId] !== undefined ? prev[targetPassengerId] : (getUserWalletBalance(targetPassengerId) || 0);
          const nextBal = Math.max(0, Math.round((cur - tip) * 100) / 100);
          const updated = { ...prev, [targetPassengerId]: nextBal };
          try { localStorage.setItem('wadaage_user_wallets_map', JSON.stringify(updated)); } catch (_e) {}
          return updated;
        });

        setTransactions((prev) => [
          {
            id: `tx_tip_${Date.now()}`,
            type: 'ride_payment',
            amount: -tip,
            title: `Driver Tip - ${currentRide.assignedDriverId ? (drivers.find((d) => d.id === currentRide.assignedDriverId)?.name || 'Captain') : 'Captain'}`,
            date: new Date().toISOString().replace('T', ' ').substring(0, 16),
            status: 'completed',
          },
          ...prev,
        ]);
      }
      resetRideState();
      broadcastRideEvent('RIDE_RATING_SUBMITTED', { rideId, rating, tip });
    }
  };

  // In-app messaging with real-time Cloud Firestore & server synchronization
  const sendMessage = (text: string) => {
    if (!currentRide || !text.trim()) return;

    const mySenderRole: 'driver' | 'passenger' = role === 'driver' ? 'driver' : 'passenger';
    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      rideId: currentRide.id,
      sender: mySenderRole,
      senderId: currentUser?.id || (mySenderRole === 'driver' ? 'driver_active' : 'passenger_active'),
      senderName: currentUser?.name || (mySenderRole === 'driver' ? (currentRide.driverName || 'Driver') : (currentRide.passengerName || 'Passenger')),
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date().toISOString(),
      read: false,
    };

    // 1. Optimistic local update
    setChatMessages((prev) => {
      if (prev.some((m) => m.id === newMsg.id)) return prev;
      return [...prev, newMsg];
    });

    // 2. Play feedback sound
    sounds.playMessageSound();

    // 3. Persist to Firestore and Server relay
    saveChatMessageToFirestore(currentRide.id, newMsg);

    // 4. Zero-latency cross-tab & multi-device broadcast
    broadcastRideEvent('CHAT_MESSAGE', { rideId: currentRide.id, message: newMsg });
  };

  // Update Admin Pricing
  const updatePricing = (newPricing: Partial<PricingSettings>) => {
    setPricing((prev) => {
      const updated = { ...prev, ...newPricing };
      try {
        localStorage.setItem('wadaage_pricing_settings', JSON.stringify(updated));
        saveSettingsToFirestore(updated, currentUser?.email || 'admin@wadaage.app');
        // Persist to REST server DB and broadcast live updates
        fetch('/api/db/pricing-configs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updated),
        }).catch((err) => console.warn('Pricing REST sync failed:', err));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
  };

  // Admin Driver Approval
  const approveDriver = (driverId: string) => {
    setDrivers((prev) =>
      prev.map((d) =>
        d.id === driverId
          ? {
              ...d,
              isVerified: true,
              documentsVerified: {
                driverLicense: true,
                vehicleInsurance: true,
                backgroundCheck: true,
              },
            }
          : d
      )
    );
  };

  // Toggle Driver Online State with Threshold Rule
  const toggleDriverOnline = useCallback((online?: boolean | any): boolean => {
    const minThreshold = pricing.driverMinWalletThresholdUsd || 0.10;
    const isGoingOnline = typeof online === 'boolean' ? online : !driverModeOnline;

    const activeDrvId = currentUser?.id || 'live_driver';
    const activeDrvPhone = currentUser?.phone || '';
    const curDrvBal = getDriverWalletBalance(activeDrvId) || (activeDrvPhone ? getDriverWalletBalance(activeDrvPhone) : 0);

    if (isGoingOnline && (curDrvBal <= 0 || curDrvBal < minThreshold)) {
      setDriverModeOnline(false);
      setLowBalanceLockoutAlert(true);
      setIncomingDriverRequest(null);
      notificationService.stopEmergencyOrderRingtone();
      return false; // Blocked going online due to balance <= 0 or below minimum threshold
    }

    setDriverModeOnline(isGoingOnline);
    setDrivers((prev) =>
      prev.map((d) => (d.id === activeDrvId || (activeDrvPhone && d.phone === activeDrvPhone) ? { ...d, status: isGoingOnline ? 'available' : 'offline' } : d))
    );

    // Persist online/offline status to server
    try {
      fetch(getApiUrl('/api/drivers/location'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeDrvId,
          name: currentUser?.name || 'Driver Partner',
          phone: activeDrvPhone,
          lat: driverGpsStatus.lat || 9.5600,
          lng: driverGpsStatus.lng || 44.0650,
          status: isGoingOnline ? 'available' : 'offline',
        }),
      }).catch(() => {});
    } catch (_e) {}

    if (isGoingOnline) {
      setLowBalanceLockoutAlert(false);
      sounds.playAcceptedChime();
    } else {
      setIncomingDriverRequest(null);
      notificationService.stopEmergencyOrderRingtone();
    }
    return true;
  }, [pricing.driverMinWalletThresholdUsd, driverModeOnline, currentUser?.id, currentUser?.phone, currentUser?.name, getDriverWalletBalance, driverGpsStatus.lat, driverGpsStatus.lng]);

  // Manual Dispatch by Admin
  const dispatchDriverToRide = (rideId: string, driverId: string) => {
    if (currentRide && currentRide.id === rideId) {
      acceptRideByDriver(driverId);
    }
  };

  // Driver Application Onboarding & Admin Verification
  const submitDriverApplication = (appData: Omit<DriverApplication, 'id' | 'status' | 'submittedAt'>) => {
    const newApp: DriverApplication = {
      ...appData,
      id: `app_${Date.now()}`,
      status: 'pending',
      submittedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };

    setDriverApplications((prev) => [newApp, ...prev.filter((a) => a.phone !== newApp.phone)]);

    // 1. Real-time Cloud Firestore & Server Relay
    saveDriverApplicationToFirestore(newApp);

    // 2. Multi-tab & cross-device zero-latency broadcast
    broadcastRideEvent('DRIVER_APPLICATION_SUBMITTED', newApp);

    // 3. Post to backend server endpoint
    try {
      fetch(getApiUrl('/api/driver-applications'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newApp),
      }).catch(() => {});
    } catch (_e) {}

    return newApp;
  };

  const updateDriverApplicationStatus = (appId: string, status: DriverApplicationStatus, adminNote?: string) => {
    let updatedAppObj: DriverApplication | null = null;
    let newlyCreatedDriver: Driver | null = null;

    setDriverApplications((prev) =>
      prev.map((app) => {
        if (app.id === appId) {
          const updated: DriverApplication = {
            ...app,
            status,
            adminNote: adminNote || app.adminNote,
            reviewedAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
          };
          updatedAppObj = updated;

          if (status === 'approved') {
            setDrivers((drvs) => {
              const exists = drvs.some((d) => d.phone === app.phone || d.name === app.fullName);
              if (!exists) {
                const newDriver: Driver = {
                  id: `driver_${Date.now()}`,
                  name: app.fullName,
                  phone: app.phone,
                  avatar: app.driverPhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
                  gender: 'male',
                  rating: 5.0,
                  totalTrips: 0,
                  status: 'available',
                  isVerified: true,
                  kycStatus: 'approved',
                  address: app.address,
                  somalilandIdNumber: app.somalilandIdNumber,
                  somalilandIdPhoto: app.somalilandIdPhoto,
                  somalilandLicenseNumber: app.somalilandLicenseNumber,
                  somalilandLicensePhoto: app.somalilandLicensePhoto,
                  guarantor: app.guarantor,
                  documentsVerified: {
                    driverLicense: true,
                    vehicleInsurance: true,
                    backgroundCheck: true,
                  },
                  currentLocation: { lat: 9.5645, lng: 44.0680 },
                  vehicle: {
                    model: app.vehicle.model,
                    color: app.vehicle.color,
                    licensePlate: app.vehicle.licensePlate,
                    category: app.vehicle.category,
                    capacity: 4,
                    photoUrl: app.vehicle.photoUrl || 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&auto=format&fit=crop&q=80',
                  },
                  todayEarnings: 0,
                  weeklyEarnings: 0,
                  hoursOnline: 0,
                  acceptanceRate: 100,
                  walletBalanceUsd: 0.00,
                  wallet_balance_usd: 0.00,
                };
                newlyCreatedDriver = newDriver;

                // Fresh $0.00 balance for newly approved driver across all key aliases
                const cleanAppPhone = String(app.phone).replace(/\D/g, '');
                setDriverWallets((prev) => {
                  const updated = {
                    ...prev,
                    [newDriver.id]: 0.00,
                    [app.phone]: 0.00,
                    [cleanAppPhone]: 0.00,
                    [`+252 ${cleanAppPhone}`]: 0.00,
                    [`+252${cleanAppPhone}`]: 0.00,
                  };
                  try { localStorage.setItem('wadaage_driver_wallets_map', JSON.stringify(updated)); } catch (_e) {}
                  return updated;
                });

                saveDriverToFirestore(newDriver);
                syncDriverToHostinger(newDriver);
                broadcastRideEvent('DRIVER_REGISTERED', newDriver);

                return [newDriver, ...drvs];
              } else {
                const updatedList = drvs.map((d) => {
                  if (d.phone === app.phone || d.name === app.fullName) {
                    const verifiedD = { ...d, isVerified: true, kycStatus: 'approved' as const };
                    saveDriverToFirestore(verifiedD);
                    syncDriverToHostinger(verifiedD);
                    return verifiedD;
                  }
                  return d;
                });
                return updatedList;
              }
            });
          } else {
            // Update existing driver record for non-approved status (e.g. hold or rejected)
            const mappedKycStatus: 'approved' | 'pending' | 'rejected' | 'on_hold' =
              status === 'on_hold' || status === 'hold'
                ? 'on_hold'
                : status === 'rejected'
                ? 'rejected'
                : 'pending';

            setDrivers((drvs) =>
              drvs.map((d) => {
                if (d.phone === app.phone || d.name === app.fullName) {
                  const updatedD: Driver = {
                    ...d,
                    isVerified: false,
                    kycStatus: mappedKycStatus,
                  };
                  saveDriverToFirestore(updatedD);
                  syncDriverToHostinger(updatedD);
                  return updatedD;
                }
                return d;
              })
            );
          }
          return updated;
        }
        return app;
      })
    );

    if (updatedAppObj) {
      saveDriverApplicationToFirestore(updatedAppObj);
      broadcastRideEvent('DRIVER_APPLICATION_UPDATED', updatedAppObj);

      try {
        fetch(getApiUrl(`/api/driver-applications/${appId}/status`), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status, adminNote }),
        }).catch(() => {});
      } catch (_e) {}
    }
  };

  const deleteDriverApplication = (appId: string) => {
    setDriverApplications((prev) => prev.filter((app) => app.id !== appId));
    deleteApplicationFromFirestore(appId);
    try {
      fetch(getApiUrl(`/api/driver-applications/${appId}`), {
        method: 'DELETE',
      }).catch(() => {});
    } catch (_e) {}
  };

  const resetRideState = () => {
    if (currentRide?.id) {
      dismissedRideIdsRef.current.add(currentRide.id);
    }
    setCurrentRide(null);
    setIncomingDriverRequest(null);
    try {
      localStorage.removeItem('wadaage_current_ride');
    } catch (_e) {}
  };

  // WebRTC In-App Voice Calling
  const [activeCallSession, setActiveCallSession] = useState<VoiceCallSession | null>(null);
  const [isCallModalOpen, setIsCallModalOpen] = useState<boolean>(false);

  // Subscribe to live call sessions for the current ride
  useEffect(() => {
    if (!currentRide?.id) {
      setActiveCallSession(null);
      return;
    }

    const unsubscribe = voiceCallService.subscribeToCallSession(currentRide.id, (session) => {
      setActiveCallSession(session);
      if (session && (session.status === 'calling' || session.status === 'connected')) {
        setIsCallModalOpen(true);
      }
    });

    return () => unsubscribe();
  }, [currentRide?.id]);

  const initiateVoiceCall = async () => {
    if (!currentRide?.id || !currentUser) return;
    const isPassenger = role === 'passenger';
    const caller = {
      id: currentUser.id || (isPassenger ? 'passenger_user' : 'driver_user'),
      name: currentUser.name || (isPassenger ? 'Passenger' : 'Driver Captain'),
      role: (isPassenger ? 'passenger' : 'driver') as 'passenger' | 'driver',
    };
    const receiver = {
      id: isPassenger ? (currentRide.assignedDriverId || 'driver_user') : (currentRide.passengerId || 'passenger_user'),
      name: isPassenger ? (currentRide.driverName || 'Driver Captain') : (currentRide.passengerName || 'Passenger'),
      role: (isPassenger ? 'driver' : 'passenger') as 'passenger' | 'driver',
    };

    const session = await voiceCallService.startCall(currentRide.id, caller, receiver);
    setActiveCallSession(session);
    setIsCallModalOpen(true);
  };

  const answerVoiceCall = async () => {
    if (activeCallSession && currentUser) {
      await voiceCallService.answerCall(activeCallSession, currentUser.id);
    }
  };

  const endVoiceCall = async () => {
    if (activeCallSession?.rideId) {
      await voiceCallService.endCall(activeCallSession.rideId);
    }
    setActiveCallSession(null);
    setIsCallModalOpen(false);
  };

  const rejectVoiceCall = async () => {
    if (activeCallSession?.rideId) {
      await voiceCallService.rejectCall(activeCallSession.rideId);
    }
    setActiveCallSession(null);
    setIsCallModalOpen(false);
  };

  return (
    <RideContext.Provider
      value={{
        language,
        setLanguage,
        t,
        isAuthenticated,
        currentUser,
        login,
        logout,
        role,
        setRole,
        drivers,
        currentRide,
        pricing,
        walletBalance,
        transactions,
        chatMessages,
        unreadChatCount,
        markChatAsRead,
        appliedPromo,
        promoError,
        driverModeOnline,
        incomingDriverRequest,
        selectedCategory,
        setSelectedCategory,
        pickupLocation,
        setPickupLocation,
        realUserLocation,
        isDetectingLocation,
        detectUserRealLocation,
        dropoffLocation,
        setDropoffLocation,
        multiStops,
        setMultiStops,
        roadRoute,
        roadDistanceKm,
        roadDurationMins,
        roadRouteSummary,
        isCalculatingRoadRoute,
        seatsBooked,
        setSeatsBooked,
        poolingType,
        setPoolingType,
        genderPreference,
        setGenderPreference,
        waitAndSaveTier,
        setWaitAndSaveTier,
        isSubscriptionCommute,
        setIsSubscriptionCommute,
        userPasses,
        purchaseCommuterPass,
        activePassForCorridor,
        intercityTrips,
        intercityBookings,
        allPlatformRides,
        driverGpsStatus,
        recalibrateDriverGps,
        toggleDriverLiveGps,
        bookIntercitySeat,
        heatmapHotspots,
        claimDriverCorridorBonus,
        splitFareWith,
        setSplitFareWith,
        addSplitFriend,
        rideOptions,
        setRideOptions,
        driverWallets,
        driverWalletBalanceUsd,
        driverWalletTransactions,
        getDriverWalletBalance,
        getUserWalletBalance,
        adminCreditDriverWallet,
        adminAdjustDriverWallet,
        adminCreditUserWallet,
        topUpUserWallet,
        topUpDriverWallet,
        verifyPaymentReceipt,
        approveDriverPendingTransaction,
        verifyAndApproveDriverTopUp,
        rejectDriverPendingTransaction,
        adminDirectCreditDriverWallet,
        lowBalanceLockoutAlert,
        dismissLowBalanceAlert,
        selfOrderAlertMsg,
        dismissSelfOrderAlert,
        autoAcceptOnRouteShares,
        toggleAutoAcceptShares,
        dispatchBatchPoolRideNow,
        stackPassengerToActiveRide,
        bookRide,
        createStreetHailRide,
        updateTaximeterTraveledKm,
        meterKm,
        meterSeconds,
        meterFareUsd,
        meterFareSlsh,
        isMeterRunning,
        meterFirstKmSlsh: METER_FIRST_KM_SLSH,
        meterExtraKmSlsh: METER_EXTRA_KM_SLSH,
        toggleWaitingTime,
        updateWaitingTime,
        resetWaitingTime,
        acceptBid,
        cancelRide,
        acceptRideByDriver,
        orderSecondRiderForWadaageShare,
        declineRideByDriver,
        transferRideToAnotherDriver,
        advanceDriverRideState,
        advanceIndividualRiderAction,
        toggleDropoffPriority,
        cancelIndividualRider,
        setCurrentRide,
        rateAndTipRide,
        topUpWallet,
        applyPromoCode,
        removePromoCode,
        sendMessage,
        updatePricing,
        approveDriver,
        toggleDriverOnline,
        resetRideState,
        soundEnabled,
        setSoundEnabled,
        dispatchDriverToRide,
        getDriverCoordinates,
        getDispatchRadiusKm,
        isOrderWithinDriverDispatchRadius,
        validateWadaageMatch,
        registerRider,
        updateUserPassword,
        registerDriver,
        driverApplications,
        submitDriverApplication,
        updateDriverApplicationStatus,
        deleteDriverApplication,
        activeCallSession,
        initiateVoiceCall,
        answerVoiceCall,
        endVoiceCall,
        rejectVoiceCall,
        isCallModalOpen,
        setIsCallModalOpen,
        updateDriverLiveCoordinates,
      }}
    >
      {children}
    </RideContext.Provider>
  );
};

export const useRide = () => {
  const ctx = useContext(RideContext);
  if (!ctx) throw new Error('useRide must be used within RideProvider');
  return ctx;
};
