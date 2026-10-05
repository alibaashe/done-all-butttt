export type UserRole = 'passenger' | 'driver' | 'admin';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  avatar?: string;
  status?: string;
  walletBalanceUsd?: number;
  wallet_balance_usd?: number;
  password?: string;
}

export type VehicleCategory =
  | 'wadaage_share'
  | 'wadaage_taxi'
  | 'wadaage_both'
  | 'wadaage_car'
  | 'wadaage_stay';

export interface LocationNode {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  category?: string;
  zone?: string;
}

export interface BeaconColor {
  id: string;
  name: string;
  somaliName: string;
  hex: string;
  textHex: string;
  bgClass: string;
  badgeClass: string;
  accentClass: string;
}

export interface WaypointSequenceItem {
  id: string;
  type: 'PICKUP' | 'DROPOFF';
  passengerId: string;
  passengerName: string;
  passengerPhone?: string;
  location: LocationNode;
  status: 'pending' | 'completed';
  etaMins: number;
  profitBonusUsd?: number;
  beaconColor?: BeaconColor;
}

export interface VehicleInfo {
  model: string;
  color: string;
  licensePlate: string;
  category: VehicleCategory;
  capacity: number;
  photoUrl?: string;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  gender?: 'male' | 'female';
  rating: number;
  totalTrips: number;
  status: 'available' | 'busy' | 'offline';
  isVerified: boolean;
  password?: string;
  autoAcceptOnRouteShares?: boolean;
  currentHeading?: number;
  documentsVerified?: {
    driverLicense: boolean;
    vehicleInsurance: boolean;
    backgroundCheck: boolean;
  };
  currentLocation: {
    lat: number;
    lng: number;
  };
  vehicle: VehicleInfo;
  todayEarnings: number;
  weeklyEarnings: number;
  walletBalanceUsd?: number;
  wallet_balance_usd?: number;
  service_type?: 'Normal' | 'Wadaage' | 'Both';
  hoursOnline: number;
  acceptanceRate: number;
  kycStatus?: 'approved' | 'pending' | 'rejected' | 'on_hold';
  address?: string;
  somalilandIdNumber?: string;
  somalilandIdPhoto?: string;
  somalilandLicenseNumber?: string;
  somalilandLicensePhoto?: string;
  guarantor?: {
    fullName?: string;
    name?: string;
    phone: string;
    relationship: string;
    address?: string;
  };
  documentsExpiry?: {
    licenseExpiry: string;
    insuranceExpiry: string;
  };
}

export interface GuarantorInfo {
  fullName: string;
  phone: string;
  relationship: string;
  address: string;
}

export type DriverApplicationStatus = 'pending' | 'approved' | 'rejected' | 'on_hold' | 'hold';

export interface DriverApplication {
  id: string;
  fullName: string;
  phone: string;
  address: string;
  somalilandIdNumber?: string;
  somalilandIdPhoto?: string;
  somalilandLicenseNumber?: string;
  somalilandLicensePhoto?: string;
  driverPhoto?: string;
  password?: string;
  guarantor: {
    fullName?: string;
    name?: string;
    phone: string;
    relationship: string;
    address?: string;
  };
  vehicle: {
    category: VehicleCategory;
    model: string;
    color: string;
    licensePlate: string;
    photoUrl?: string;
  };
  status: DriverApplicationStatus;
  adminNote?: string;
  submittedAt: string;
  reviewedAt?: string;
}

export interface SharedCoPassenger {
  id: string;
  name: string;
  phone?: string;
  avatar: string;
  pickupLocation: LocationNode;
  dropoffLocation: LocationNode;
  fare: number;
  status: 'matched' | 'picking_up' | 'picked_up' | 'dropped_off';
  seatsBooked?: number;
  beaconColor?: BeaconColor;
}

export type RideStatus =
  | 'idle'
  | 'searching'
  | 'accepted'
  | 'driver_arrived'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface RideRequest {
  id: string;
  passengerId: string;
  passengerName: string;
  passengerPhone: string;
  passengerAvatar: string;
  pickup: LocationNode;
  dropoff: LocationNode;
  multiStops?: LocationNode[];
  category: VehicleCategory;
  categoryName: string;
  baseFare: number;
  distanceKm: number;
  durationMins: number;
  roadSummary?: string;
  isRealRoadCalculated?: boolean;
  surgeMultiplier: number;
  discountAmount: number;
  totalFare: number;
  paymentMethod: 'wallet' | 'card' | 'cash';
  promoCode?: string;
  isShared: boolean;
  seatsBooked?: number; // 1, 2, or 3 seats
  poolingType?: 'express_pool' | 'door_to_door';
  waitAndSaveTier?: 'express' | 'wait_and_save';
  genderPreference?: 'any' | 'female_only';
  splitFareWith?: { name: string; email: string; paid: boolean; shareAmount: number }[];
  isSubscriptionCommute?: boolean;
  activePassUsedId?: string;
  service_type?: 'Normal' | 'Wadaage';
  declinedDriverIds?: string[];
  currentOfferedDriverId?: string;
  offerExpiresAt?: number;
  offerTimeoutSeconds?: number;
  coPassenger?: SharedCoPassenger;
  isInBatchingPool?: boolean;
  batchingCountdownSeconds?: number;
  batchingExpiresAt?: number;
  beaconColor?: BeaconColor;
  headingDegrees?: number;
  driverDistanceKm?: number;
  stackedRide?: boolean;
  stackedProfitUsd?: number;
  stackedProfitSos?: number;
  optimalWaypointsSequence?: WaypointSequenceItem[];
  status: RideStatus;
  assignedDriverId?: string;
  driverName?: string;
  driver_name?: string;
  driverPhone?: string;
  driver_phone?: string;
  driverAvatar?: string;
  vehicleModel?: string;
  vehicle_model?: string;
  licensePlate?: string;
  license_plate?: string;
  requestedAt: string;
  arrivedAt?: string;
  startedAt?: string;
  completedAt?: string;
  cancellationReason?: string;
  driverVehiclePlate?: string;
  fare?: number;
  createdAt?: string;
  updatedAt?: string;
  serverUpdatedAt?: number;
  broadcastType?: string;
  driverRating?: number;
  tipAmount?: number;
  otpCode?: string;
  isScheduled?: boolean;
  scheduledTime?: string;
  bookingForSomeoneElse?: { name: string; phone: string };
  isBookByBid?: boolean;
  targetBidPriceUsd?: number;
  selectedBidId?: string;
  isLiveTaximeter?: boolean;
  liveTraveledKm?: number;
  liveMeterSeconds?: number;
  liveMeterStartedAt?: number;
  startCoordinates?: { lat: number; lng: number };
  dropoffFareUsd?: number;
  dropoffFareSlsh?: number;
  waitingSeconds?: number;
  waitingMinutes?: number;
  waitingFeeSlsh?: number;
  waitingFeeUsd?: number;
  isWaitingActive?: boolean;
  waitingStartedAt?: number;
  bids?: {
    id: string;
    driverId: string;
    driverName: string;
    driverRating: number;
    driverAvatar: string;
    vehicleModel: string;
    priceUsd: number;
    priceSos: number;
    includesToll: boolean;
  }[];
  options?: {
    quietRide: boolean;
    acHigh: boolean;
    extraLuggage: boolean;
    petFriendly: boolean;
  };
}

export interface ChatMessage {
  id: string;
  rideId: string;
  sender: 'passenger' | 'driver';
  senderId?: string;
  senderName?: string;
  text: string;
  timestamp: string;
  createdAt?: string;
  read?: boolean;
}

export interface WalletTransaction {
  id: string;
  type: 'topup' | 'ride_payment' | 'driver_payout' | 'promo_credit';
  amount: number;
  title: string;
  date: string;
  status: 'completed' | 'pending';
}

export interface DriverWalletTransaction {
  id: string;
  driverId: string;
  driverName?: string;
  driverPhone?: string;
  type: 'topup' | 'commission_deduction' | 'bonus';
  amountUsd: number;
  amountSos: number;
  originalRequestedAmountSos?: number;
  originalRequestedAmountUsd?: number;
  title: string;
  date: string;
  status: 'completed' | 'pending_verification' | 'failed' | 'rejected';
  paymentProvider?: 'zaad' | 'evc' | 'edahab' | 'card';
  referenceId?: string;
  smsReceiptText?: string;
  verifiedAt?: string;
  verificationMethod?: 'auto_ussd_gateway' | 'admin_confirmation' | 'manual_ref' | 'instant_gateway';
  rideId?: string;
  adminNote?: string;
  newBalanceUsd?: number;
}

export type AdminPermissionKey =
  | 'manageDispatch'
  | 'managePricing'
  | 'approveDrivers'
  | 'verifyTopUps'
  | 'manageUsers'
  | 'managePromos'
  | 'manageGateways'
  | 'manageRoles'
  | 'viewFinancials';

export type AdminRoleType =
  | 'Super Admin'
  | 'Fleet Dispatcher'
  | 'Finance Admin'
  | 'KYC Verification Specialist'
  | 'Customer Support';

export interface AdminPermissions {
  manageDispatch: boolean;
  managePricing: boolean;
  approveDrivers: boolean;
  verifyTopUps: boolean;
  manageUsers: boolean;
  managePromos: boolean;
  manageGateways: boolean;
  manageRoles: boolean;
  viewFinancials: boolean;
}

export interface StaffRole {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: AdminRoleType;
  status: 'Active' | 'Suspended';
  permissions: AdminPermissions;
  createdAt: string;
}

export interface PromoCode {
  code: string;
  discountPercent?: number;
  flatDiscount?: number;
  description: string;
  minFare?: number;
}

export interface CategoryServiceRules {
  // Wadaage Share
  maxSeatsPerBooking?: number;
  maxDetourMins?: number;
  coPassengerTollSplitPercent?: number;
  // Wadaage VIP
  minDriverRating?: number;
  minVehicleYear?: number;
  complimentaryAmenities?: boolean;
  // Wadaage Taxi
  taximeterMode?: boolean;
  permitRequired?: boolean;
  // Wadaage Moto
  helmetMandatory?: boolean;
  maxParcelWeightKg?: number;
  rainSafetyLockout?: boolean;
  // Wadaage Normal
  autoAssignNearest?: boolean;
  graceCancellationMins?: number;
}

export interface CategoryServiceConfig {
  id: VehicleCategory;
  name: string;
  somaliName: string;
  iconName: string;
  enabled: boolean;
  statusMode: 'active' | 'surge_only' | 'suspended';
  baseFareUsd: number;
  perKmRateUsd: number;
  perMinuteRateUsd: number;
  minFareUsd: number;
  categorySurgeMultiplier: number;
  driverCommissionPercent: number;
  cancellationFeeUsd: number;
  maxPassengers: number;
  maxWaitTimeMins: number;
  dispatchRadiusKm: number;
  rules: CategoryServiceRules;
}

export interface CommuterPass {
  id: string;
  name: string;
  somaliName: string;
  corridor: string;
  totalTrips: number;
  validityDays: number;
  priceUsd: number;
  priceSos: number;
  savingsPercent: number;
  description: string;
  badge?: string;
}

export interface UserCommuterPass {
  id: string;
  passId: string;
  userId?: string;
  name?: string;
  passName?: string;
  somaliName?: string;
  totalTrips: number;
  remainingTrips: number;
  purchasedAt?: string;
  purchaseDate?: string;
  expiresAt?: string;
  expiryDate?: string;
  status: 'active' | 'exhausted' | 'expired';
  corridor: string;
  qrCode?: string;
}

export interface IntercityTrip {
  id: string;
  originCity: string;
  destinationCity: string;
  departureTime: string;
  departureDate: string;
  pricePerSeatUsd: number;
  pricePerSeatSos: number;
  totalSeats: number;
  availableSeats: number;
  driverName: string;
  driverPhone: string;
  driverRating: number;
  driverAvatar: string;
  vehicleModel: string;
  licensePlate: string;
  pickupStation: string;
  dropoffStation: string;
  estimatedDuration: string;
  status: 'scheduled' | 'boarding' | 'in_transit' | 'completed';
  features: string[];
}

export interface IntercityBooking {
  id: string;
  tripId: string;
  userId?: string;
  passengerName: string;
  passengerPhone: string;
  seatsBooked: number;
  totalPaidUsd?: number;
  totalPriceUsd?: number;
  totalPaidSos?: number;
  paymentMethod: string;
  bookedAt?: string;
  bookingDate?: string;
  originCity: string;
  destinationCity: string;
  departureTime: string;
  departureDate?: string;
  pickupStation?: string;
  status: 'confirmed' | 'cancelled';
  seatNumbers: string[];
  ticketQrCode?: string;
}

export interface HeatmapHotspot {
  id: string;
  name: string;
  somaliName: string;
  lat: number;
  lng: number;
  radius: number;
  demandLevel: 'high' | 'surge' | 'extreme';
  multiplier: number;
  waitingRidersCount: number;
  corridorBonusUsd: number;
  corridorBonusSos: number;
  bestTimeToArrive: string;
  description: string;
}

export interface PricingSettings {
  baseFareTaxi: number;
  baseFareEconomy: number;
  baseFareShared: number;
  baseFareXL: number;
  baseFareBike: number;
  perKmRate: number;
  perMinuteRate: number;
  sharedDiscountPercent: number;
  currentSurgeMultiplier: number;
  platformCommissionPercent: number;
  driverCommissionFeeUsd: number; // Flat fee deduction per trip (default $0.10 / 1000 SLSH)
  driverMinWalletThresholdUsd: number; // Min wallet balance required to be online (default $0.20 / 2000 SLSH)
  maxDetourMinutes: number; // Max detour allowed for shared taxi matching
  expressPoolDiscountPercent: number;
  weatherSurgeMultiplier: number;
  eventSurgeMultiplier: number;
  dispatchRadiusKm?: number; // Global driver dispatch search radius limit in km (default 1.0 km)
  maxPickupRadiusKm?: number; // Max pickup distance in km (default 1.0 km)
  maxDestinationRadiusKm?: number; // Max destination divergence in km
  categoryConfigs?: Record<string, CategoryServiceConfig>;
  // Dynamic Flow & Stacking Engine Settings
  batchingWindowSeconds?: number;
  maxHeadingDivergenceDegrees?: number;
  inTripStackingRadiusMeters?: number;
  enableColorBeaconMatching?: boolean;
  enableLandmarkSnapping?: boolean;
  driverStackedBonusUsd?: number;
}

export type CallStatus = 'idle' | 'calling' | 'incoming' | 'connected' | 'ended' | 'rejected' | 'busy';

export interface VoiceCallSession {
  id: string;
  rideId: string;
  callerId: string;
  callerName: string;
  callerRole: 'passenger' | 'driver';
  receiverId: string;
  receiverName: string;
  receiverRole: 'passenger' | 'driver';
  status: CallStatus;
  startedAt?: number;
  connectedAt?: number;
  endedAt?: number;
  durationSeconds?: number;
  channelName: string; // rideId used as channel
}

export interface VoiceCallSignal {
  id: string;
  rideId: string;
  senderId: string;
  type: 'offer' | 'answer' | 'candidate' | 'hangup' | 'reject';
  sdp?: any;
  candidate?: any;
  timestamp: number;
}

export interface DriverGpsStatus {
  active: boolean;
  lat: number;
  lng: number;
  accuracy: number;
  heading: number;
  speed: number;
  lastUpdated: number;
  isRealHardwareGps: boolean;
  permissionState: 'granted' | 'prompt' | 'denied';
  source: 'gps' | 'network' | 'simulated';
}

// ----------------------------------------------------
// WADAAGE DRIVER FUEL & DISTANCE MANAGEMENT TYPES
// ----------------------------------------------------

export type FuelType = 'petrol' | 'diesel';
export type FuelCalculationMethod = 'ESTIMATED' | 'OBD';

export interface VehicleFuelProfile {
  id: string;
  driverId: string;
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  fuelType: FuelType;
  tankCapacityLiters: number; // 1 - 200 L
  averageKmPerLiter: number; // 1 - 30 km/L
  currentFuelLiters: number; // 0 - tankCapacityLiters
  fuelPricePerLiterSlsh: number; // SLSH per liter
  lastCorrectionAt?: string;
  lastCorrectionReason?: string;
  updatedAt: string;
}

export interface FuelLogEntry {
  id: string;
  driverId: string;
  vehicleId: string;
  type: 'refill' | 'manual_correction';
  litersAdded?: number;
  fuelPricePerLiterSlsh?: number;
  totalCostSlsh?: number;
  previousFuelLiters: number;
  newFuelLiters: number;
  odometerKm?: number;
  fuelStation?: string;
  notes?: string;
  timestamp: string;
}

export interface DrivingSessionRecord {
  id: string;
  driverId: string;
  vehicleId: string;
  startTime: string;
  endTime?: string;
  startLatitude: number;
  startLongitude: number;
  endLatitude?: number;
  endLongitude?: number;
  distanceKm: number;
  durationMinutes: number;
  fuelUsedLiters: number;
  fuelEfficiencyKmPerLiter: number;
  estimatedFuelCostSlsh: number;
  averageSpeedKmh: number;
  maxSpeedKmh: number;
  fuelLevelStart: number;
  fuelLevelEnd: number;
  fuelCalculationMethod: FuelCalculationMethod;
  status: 'active' | 'completed';
  synced: boolean;
}

export interface FuelDailyReport {
  id: string;
  driverId: string;
  date: string; // YYYY-MM-DD
  distanceKm: number;
  estimatedFuelUsedLiters: number;
  fuelAddedLiters: number;
  estimatedFuelCostSlsh: number;
  averageEfficiencyKmPerLiter: number;
  costPerKmSlsh: number;
  drivingTimeMinutes: number;
  sessionCount: number;
  updatedAt: string;
}

export interface FuelWeeklySummary {
  totalDistanceKm: number;
  totalFuelUsedLiters: number;
  totalFuelCostSlsh: number;
  averageEfficiencyKmPerLiter: number;
  averageCostPerKmSlsh: number;
  days: {
    date: string;
    dayName: string;
    distanceKm: number;
    fuelUsedLiters: number;
    fuelCostSlsh: number;
  }[];
}

export interface FuelWarning {
  level: 'normal' | 'low' | 'very_low' | 'critical';
  title: string;
  message: string;
  estimatedRemainingLiters: number;
  estimatedRangeKm: number;
}
