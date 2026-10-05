import { CategoryServiceConfig, CommuterPass, Driver, DriverApplication, HeatmapHotspot, IntercityTrip, LocationNode, PricingSettings, PromoCode, VehicleCategory, AuthUser } from '../types';
import { HARGEISA_PLACES } from './hargeisaPlaces';

export const INITIAL_REGISTERED_USERS: AuthUser[] = [
  {
    id: 'usr_admin_baashe',
    name: 'Baashe (Super Admin)',
    email: 'baashe2002@gmail.com',
    phone: '+252 63 6807814',
    role: 'admin',
    password: 'password123',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
  },
  {
    id: 'usr_rider_demo_01',
    name: 'Faadumo Jaamac Cali',
    email: 'faadumo@wadaage.com',
    phone: '+252 63 4819202',
    role: 'passenger',
    password: 'password123',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  },
];

export const INITIAL_DRIVER_APPLICATIONS: DriverApplication[] = [];

export const CITY_LOCATIONS: LocationNode[] = HARGEISA_PLACES;

export const INITIAL_DRIVERS: Driver[] = [
  {
    id: 'drv_hga_01',
    name: 'Maxamed Cabdi Faarax',
    phone: '+252 63 4455667',
    password: 'password123',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    gender: 'male',
    rating: 4.95,
    totalTrips: 342,
    status: 'available',
    isVerified: true,
    kycStatus: 'approved',
    currentLocation: { lat: 9.5620, lng: 44.0645 },
    currentHeading: 45,
    vehicle: {
      model: 'Toyota Vitz',
      color: 'Blue',
      licensePlate: 'SL-4921',
      category: 'wadaage_both',
      capacity: 4,
    },
    todayEarnings: 18.50,
    weeklyEarnings: 142.00,
    hoursOnline: 6,
    acceptanceRate: 98,
    service_type: 'Both',
    walletBalanceUsd: 0.00,
  },
  {
    id: 'drv_hga_02',
    name: 'Cabdiraxmaan Cali Nuur',
    phone: '+252 63 4918201',
    password: 'password123',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    gender: 'male',
    rating: 4.88,
    totalTrips: 215,
    status: 'available',
    isVerified: true,
    kycStatus: 'approved',
    currentLocation: { lat: 9.5745, lng: 44.0530 },
    currentHeading: 120,
    vehicle: {
      model: 'Toyota Corolla Fielder',
      color: 'White',
      licensePlate: 'SL-7814',
      category: 'wadaage_taxi',
      capacity: 4,
    },
    todayEarnings: 14.00,
    weeklyEarnings: 110.00,
    hoursOnline: 5,
    acceptanceRate: 96,
    service_type: 'Normal',
    walletBalanceUsd: 0.00,
  },
  {
    id: 'drv_hga_03',
    name: 'Khadar Xasan Jaamac',
    phone: '+252 63 4123456',
    password: 'password123',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    gender: 'male',
    rating: 4.92,
    totalTrips: 189,
    status: 'available',
    isVerified: true,
    kycStatus: 'approved',
    currentLocation: { lat: 9.5515, lng: 44.0725 },
    currentHeading: 270,
    vehicle: {
      model: 'Toyota Probox',
      color: 'Silver',
      licensePlate: 'SL-3392',
      category: 'wadaage_share',
      capacity: 4,
    },
    todayEarnings: 22.00,
    weeklyEarnings: 165.00,
    hoursOnline: 7,
    acceptanceRate: 99,
    service_type: 'Wadaage',
    walletBalanceUsd: 0.00,
  },
  {
    id: 'drv_hga_04',
    name: 'Mustafe Jaamac Cumar',
    phone: '+252 63 4889900',
    password: 'password123',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    gender: 'male',
    rating: 4.90,
    totalTrips: 410,
    status: 'available',
    isVerified: true,
    kycStatus: 'approved',
    currentLocation: { lat: 9.5395, lng: 44.0880 },
    currentHeading: 180,
    vehicle: {
      model: 'Toyota Ractis',
      color: 'Black',
      licensePlate: 'SL-8105',
      category: 'wadaage_both',
      capacity: 4,
    },
    todayEarnings: 25.50,
    weeklyEarnings: 195.00,
    hoursOnline: 8,
    acceptanceRate: 97,
    service_type: 'Both',
    walletBalanceUsd: 0.00,
  },
];

export const INITIAL_COMMUTER_PASSES: CommuterPass[] = [
  {
    id: 'pass_uni_01',
    name: 'University Student Pass',
    somaliName: 'Pass-ka Ardayda Jaamacadaha',
    corridor: 'Hargeisa University / Gollis / Edna Adan Corridor',
    totalTrips: 20,
    validityDays: 30,
    priceUsd: 14.00,
    priceSos: 119000,
    savingsPercent: 45,
    description: '20 shared rides between Jigjiga-Yar, Mansoor, and University campuses. Auto-matches student pooling.',
    badge: '🎓 Best For Students',
  },
  {
    id: 'pass_airport_02',
    name: 'Airport Express Pass',
    somaliName: 'Pass-ka Degdegga ah ee Madaarka',
    corridor: 'Egal International Airport ⇄ Downtown Corridor',
    totalTrips: 10,
    validityDays: 45,
    priceUsd: 22.00,
    priceSos: 187000,
    savingsPercent: 40,
    description: '10 shared or express rides connecting Egal Airport to Mansoor, Ambassador, and City Center.',
    badge: '✈️ Frequent Flyer',
  },
  {
    id: 'pass_worker_03',
    name: 'Downtown Worker Daily Pass',
    somaliName: 'Pass-ka Shaqaalaha Suuqa & Ganacsiga',
    corridor: 'Jigjiga-Yar / New Hargeisa ⇄ Suuqa Hoose / Dahabshiil',
    totalTrips: 30,
    validityDays: 30,
    priceUsd: 18.00,
    priceSos: 153000,
    savingsPercent: 50,
    description: '30 morning and evening commuter rides. Zero surge pricing guarantee during rush hours.',
    badge: '💼 Daily Commuter',
  },
  {
    id: 'pass_all_04',
    name: 'All-Hargeisa Unlimited Flex Pass',
    somaliName: 'Pass-ka Guud ee Caasimadda',
    corridor: 'Any Destination within Greater Hargeisa City Limits',
    totalTrips: 40,
    validityDays: 30,
    priceUsd: 32.00,
    priceSos: 272000,
    savingsPercent: 55,
    description: '40 rides across all zones with priority driver matching and instant SheCab / Wadaage Pink access.',
    badge: '⭐ Premium Flex',
  },
];

export const INITIAL_INTERCITY_TRIPS: IntercityTrip[] = [];

export const HARGEISA_DEMAND_HOTSPOTS: HeatmapHotspot[] = [];

export const VEHICLE_CATEGORY_DETAILS: Record<VehicleCategory, { name: string; icon: string; etaMins: number; capacityStr: string; desc: string }> = {
  wadaage_both: {
    name: 'Both (Taxi & Share)',
    icon: 'Layers',
    etaMins: 3,
    capacityStr: '1-4 seats',
    desc: 'Accepts both Normal Private Taxi and Wadaage Share carpool rides',
  },
  wadaage_share: {
    name: 'Wadaage Share',
    icon: 'Users',
    etaMins: 4,
    capacityStr: '1-2 seats',
    desc: 'Share ride with co-passengers on same route (Save up to 50%)',
  },
  wadaage_taxi: {
    name: 'Normal Taxi',
    icon: 'Car',
    etaMins: 3,
    capacityStr: '4 seats',
    desc: 'Standard city taxi & private sedan at upfront fixed fare',
  },
  wadaage_car: {
    name: 'Private Car',
    icon: 'Car',
    etaMins: 3,
    capacityStr: '4 seats',
    desc: 'Dedicated private car service across the city',
  },
  wadaage_stay: {
    name: 'Intercity Travel',
    icon: 'Home',
    etaMins: 15,
    capacityStr: '4-7 seats',
    desc: 'Intercity travel & stayover packages (Hargeisa ↔ Berbera Coast, Burco, Hourly Rental)',
  },
};

export const DEFAULT_CATEGORY_CONFIGS: Record<string, CategoryServiceConfig> = {
  wadaage_share: {
    id: 'wadaage_share',
    name: 'Wadaage Share',
    somaliName: 'Gaadhi Wadaag',
    iconName: 'Users',
    enabled: true,
    statusMode: 'active',
    baseFareUsd: 0.90, // $0.90 USD (9,000 SLSH) first startup / first km
    perKmRateUsd: 0.40, // $0.40 USD (4,000 SLSH) per KM after first km
    perMinuteRateUsd: 0.00,
    minFareUsd: 0.90, // $0.90 USD (9,000 SLSH)
    categorySurgeMultiplier: 1.00,
    driverCommissionPercent: 15,
    cancellationFeeUsd: 0.00, // 0 SLSH - Free Cancellation on both sides
    maxPassengers: 2,
    maxWaitTimeMins: 3,
    dispatchRadiusKm: 1.0, // Strict 1.0 KM Dispatch Radius
    rules: {
      maxSeatsPerBooking: 2,
      maxDetourMins: 10,
      coPassengerTollSplitPercent: 50,
    },
  },
  wadaage_car: {
    id: 'wadaage_car',
    name: 'Wadaage Normal Car',
    somaliName: 'Gaadhi Gaar ah (Private Sedan)',
    iconName: 'Car',
    enabled: true,
    statusMode: 'active',
    baseFareUsd: 1.20, // $1.20 USD (12,000 SLSH) first km
    perKmRateUsd: 0.70, // $0.70 USD (7,000 SLSH) per KM after first km
    perMinuteRateUsd: 0.00,
    minFareUsd: 1.20, // $1.20 USD (12,000 SLSH)
    categorySurgeMultiplier: 1.00,
    driverCommissionPercent: 18,
    cancellationFeeUsd: 0.00, // 0 SLSH - Free Cancellation on both sides
    maxPassengers: 4,
    maxWaitTimeMins: 5,
    dispatchRadiusKm: 1.0, // Strict 1.0 KM Dispatch Radius
    rules: {
      autoAssignNearest: true,
      graceCancellationMins: 3,
    },
  },
  wadaage_taxi: {
    id: 'wadaage_taxi',
    name: 'Normal Taxi',
    somaliName: 'Taaksi Caadi ah / Private Sedan',
    iconName: 'Taxi',
    enabled: true,
    statusMode: 'active',
    baseFareUsd: 1.20, // $1.20 USD (12,000 SLSH) first km
    perKmRateUsd: 0.70, // $0.70 USD (7,000 SLSH) per KM after first km
    perMinuteRateUsd: 0.00,
    minFareUsd: 1.20, // $1.20 USD (12,000 SLSH)
    categorySurgeMultiplier: 1.00,
    driverCommissionPercent: 18,
    cancellationFeeUsd: 0.00, // 0 SLSH - Free Cancellation on both sides
    maxPassengers: 4,
    maxWaitTimeMins: 5,
    dispatchRadiusKm: 1.0, // Strict 1.0 KM Dispatch Radius
    rules: {
      taximeterMode: true,
      permitRequired: false,
    },
  },
  wadaage_stay: {
    id: 'wadaage_stay',
    name: 'Wadaage Stay & Intercity',
    somaliName: 'Wadaage Stay & Safarka Gobollada',
    iconName: 'Home',
    enabled: true,
    statusMode: 'active',
    baseFareUsd: 15.00, // 150,000 SLSH
    perKmRateUsd: 0.80, // 8,000 SLSH
    perMinuteRateUsd: 0.20,
    minFareUsd: 20.00, // 200,000 SLSH
    categorySurgeMultiplier: 1.00,
    driverCommissionPercent: 10,
    cancellationFeeUsd: 0.00,
    maxPassengers: 6,
    maxWaitTimeMins: 15,
    dispatchRadiusKm: 50,
    rules: {
      autoAssignNearest: true,
      graceCancellationMins: 10,
    },
  },
};

export const INITIAL_PRICING: PricingSettings = {
  baseFareTaxi: 1.20,
  baseFareEconomy: 1.20,
  baseFareShared: 0.90,
  baseFareXL: 2.50,
  baseFareBike: 0.50,
  perKmRate: 0.70, // $0.70 USD (7,000 SLSH) per KM default
  perMinuteRate: 0.00,
  sharedDiscountPercent: 0,
  currentSurgeMultiplier: 1.00,
  platformCommissionPercent: 18,
  driverCommissionFeeUsd: 0.10, // 1,000 Somaliland Shillings (SLSH) / $0.10 USD per trip commission charge
  driverMinWalletThresholdUsd: 0.10, // 1,000 Somaliland Shillings (SLSH) minimum driver balance required to accept orders
  maxDetourMinutes: 10,
  expressPoolDiscountPercent: 15,
  weatherSurgeMultiplier: 1.0,
  eventSurgeMultiplier: 1.0,
  dispatchRadiusKm: 1.0, // Strict 1.0 KM Dispatch Radius
  maxPickupRadiusKm: 1.0, // Max pickup distance 1.0 KM
  categoryConfigs: DEFAULT_CATEGORY_CONFIGS,
  batchingWindowSeconds: 60,
  maxHeadingDivergenceDegrees: 45,
  inTripStackingRadiusMeters: 500,
  enableColorBeaconMatching: true,
  enableLandmarkSnapping: true,
  driverStackedBonusUsd: 1.50,
};

export const PROMO_CODES: PromoCode[] = [
  {
    code: 'WADAAGE5',
    flatDiscount: 5.00,
    description: '$5 OFF your first Wadaage taxi or ride',
    minFare: 10,
  },
  {
    code: 'SHARE30',
    discountPercent: 30,
    description: 'Extra 30% OFF Wadaage Share rides',
    minFare: 8,
  },
  {
    code: 'AIRPORT10',
    flatDiscount: 10.00,
    description: '$10 OFF any trip to/from Airport',
    minFare: 25,
  },
];
