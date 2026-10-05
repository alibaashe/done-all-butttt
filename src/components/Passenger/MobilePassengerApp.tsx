import React, { useState } from 'react';
import {
  ArrowRightLeft,
  Car,
  Clock,
  Globe,
  LogOut,
  MapPin,
  Menu,
  Radio,
  Shield,
  Tag,
  Users,
  X,
  History,
  CheckCircle,
  Navigation,
  FileText,
  Search,
  ChevronRight,
  ChevronDown,
  Building,
  Plane,
  CreditCard,
  User,
  Gift,
  Crosshair,
  Zap,
  Sparkles,
  Phone,
  Check,
  ShieldCheck,
  Heart,
  Bell,
  Plus,
  Minus,
  Briefcase,
  Home,
  GraduationCap,
  Calendar,
  Receipt,
  RotateCcw,
  Wallet,
} from 'lucide-react';
import { WadaageRiderHeroHeader } from './WadaageRiderHeroHeader';
import { useRide } from '../../context/RideContext';
import { UnifiedMap } from '../Map/UnifiedMap';
import { LocationPermissionPrompt } from '../Common/LocationPermissionPrompt';
import { ActiveRideCard } from './ActiveRideCard';
import { PromosModal } from './PromosModal';
import { TripHistoryModal } from './TripHistoryModal';
import { SafetyCenterModal } from './SafetyCenterModal';
import { UssdOfflineBookingModal } from './UssdOfflineBookingModal';
import { FareSplitModal } from './FareSplitModal';
import { CommuteSubscriptionModal } from './CommuteSubscriptionModal';
import { LocationSetupModal } from '../Location/LocationSetupModal';
import { WadaageSearchOverlay } from './WadaageSearchOverlay';
import { VehicleIllustration } from '../Common/VehicleIllustration';
import { SomalilandFlag } from '../Common/SomalilandFlag';
import { WadaageLogo } from '../Common/WadaageLogo';
import { WadaageShareBrandLogo } from '../Common/WadaageShareBrandLogo';
import { WadaageCarCardGraphic } from '../Common/WadaageCarCardGraphic';
import { HARGEISA_PLACES, HargeisaPlace } from '../../data/hargeisaPlaces';
import { searchPlacesFast, warmPlaceSearchIndex } from '../../utils/placeSearchIndex';
import { calculateDistanceKm, calculateDurationMins, computeFare, formatCurrency, EXCHANGE_RATE_USD_TO_SLSH } from '../../utils/geo';
import { LocationNode, VehicleCategory } from '../../types';
import { getApiUrl } from '../../services/apiConfig';
import { resolveHargeisaPlaceCoordinates } from '../../utils/hargeisaPlaceMatcher';

export const MobilePassengerApp: React.FC = () => {
  const {
    pickupLocation,
    setPickupLocation,
    dropoffLocation,
    setDropoffLocation,
    selectedCategory,
    setSelectedCategory,
    pricing,
    bookRide,
    cancelRide,
    currentRide,
    isDetectingLocation,
    detectUserRealLocation,
    language,
    setLanguage,
    t,
    currentUser,
    logout,
    roadDistanceKm,
    roadDurationMins,
    roadRouteSummary,
    isCalculatingRoadRoute,
    allPlatformRides,
  } = useRide();

  // Navigation Tabs: 'dalbo' (Home) | 'safarradayda' (My Rides) | 'wallet' (Wallet) | 'akoonka' (Account) | 'favorites'
  type TabType = 'dalbo' | 'safarradayda' | 'wallet' | 'akoonka' | 'favorites';
  const [activeTab, setActiveTab] = useState<TabType>('dalbo');
  const [selectedCapacity, setSelectedCapacity] = useState<number>(1);
  const [capacityDropdownOpen, setCapacityDropdownOpen] = useState<boolean>(false);

  // Modals & Drawers
  const [showLocationSearchModal, setShowLocationSearchModal] = useState<'pickup' | 'dropoff' | null>(null);
  const [showSuperAppSearch, setShowSuperAppSearch] = useState(false);
  const [showPromosModal, setShowPromosModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [showUssdModal, setShowUssdModal] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [showCommuteModal, setShowCommuteModal] = useState(false);
  const [showMenuDrawer, setShowMenuDrawer] = useState(false);
  const [showLocationSetupModal, setShowLocationSetupModal] = useState(false);
  const [showCityModal, setShowCityModal] = useState(false);
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);

  // Favorite Saved Places for 1-click booking
  const [favoritePlaces] = useState([
    { id: 'fav-1', name: 'Guriga (Home)', address: 'Ina Naxar Street, Hargeisa', lat: 9.5605, lng: 44.0750 },
    { id: 'fav-2', name: 'Shaqada (Work / Office)', address: 'Dahabshiil Business Center, Downtown', lat: 9.5615, lng: 44.0660 },
    { id: 'fav-3', name: 'Egal International Airport (HGA)', address: 'Airport Road, South Hargeisa', lat: 9.5181, lng: 44.0888 },
    { id: 'fav-4', name: 'Berbera Bus Terminal (Istaanka Berbera)', address: 'East Highway, 26 June District, Hargeisa', lat: 9.5680, lng: 44.0850 },
    { id: 'fav-5', name: 'Maan-soor Hotel', address: 'Jigjiga Yar District, Hargeisa', lat: 9.5755, lng: 44.0722 },
    { id: 'fav-6', name: 'Jaamacadda Hargeysa', address: 'University Road, Hargeisa', lat: 9.5512, lng: 44.0585 },
  ]);

  // Options & Inputs
  const [paymentMethod, setPaymentMethod] = useState<'cash'>('cash');
  const [profileType, setProfileType] = useState<'Personal' | 'Business'>('Personal');
  const [driverNote, setDriverNote] = useState('');
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [showPromoInputModal, setShowPromoInputModal] = useState(false);
  const [orderTiming, setOrderTiming] = useState<'now' | 'advance'>('now');
  const [advanceMinutes, setAdvanceMinutes] = useState<number>(30);
  const [isBooking, setIsBooking] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const distanceKm = roadDistanceKm || calculateDistanceKm(
    pickupLocation.lat,
    pickupLocation.lng,
    dropoffLocation.lat,
    dropoffLocation.lng
  );
  const durationMins = roadDurationMins || calculateDurationMins(distanceKm);
  const currentFare = computeFare(selectedCategory, distanceKm, durationMins, pricing);

  // Real fares formatted for Somaliland Shillings (9,000 SLSH 1st km + 4,000 SLSH/km for Share; 12,000 SLSH 1st km + 7,000 SLSH/km for Taxi)
  const wadaageFare = computeFare('wadaage_share', distanceKm, durationMins, pricing);
  const taxiFare = computeFare('wadaage_taxi', distanceKm, durationMins, pricing);

  const formatSlshAmount = (usdFare: number) => {
    const rawSlsh = Math.round(usdFare * EXCHANGE_RATE_USD_TO_SLSH);
    return `${rawSlsh.toLocaleString()} SLSH`;
  };

  const wadaageFareFormatted = `${formatSlshAmount(wadaageFare.finalFare)}`;
  const taxiFareFormatted = `${formatSlshAmount(taxiFare.finalFare)}`;

  // Vehicle Option Data
  const vehicleOptions = [
    {
      id: 'wadaage_share' as VehicleCategory,
      illustration: 'wadaage' as const,
      name: 'Wadaage',
      subtitle: '"Safar wadaag, nolol wadaag."',
      description: t.wadaageShareDesc,
      capacity: '1–4 kursi',
      badge: 'SHARE',
      baseFare: wadaageFare,
      etaMins: 10,
    },
    {
      id: 'wadaage_taxi' as VehicleCategory,
      illustration: 'taxi' as const,
      name: 'Normal Taxi',
      subtitle: '"Gaari kuu gaar ah"',
      description: t.wadaageTaxiDesc,
      capacity: '4',
      baseFare: computeFare('wadaage_taxi', distanceKm, durationMins, pricing),
      etaMins: 4,
    },
  ];

  const [modalGoogleResults, setModalGoogleResults] = useState<LocationNode[]>([]);
  const [isSearchingModalGoogle, setIsSearchingModalGoogle] = useState(false);
  const [modalCategory, setModalCategory] = useState<string>('All');
  const modalAbortRef = React.useRef<AbortController | null>(null);

  // Live Google Maps suggestions for location search modal
  React.useEffect(() => {
    const trimmed = searchFilter.trim();
    if (!trimmed) {
      setModalGoogleResults([]);
      setIsSearchingModalGoogle(false);
      return;
    }

    if (modalAbortRef.current) {
      modalAbortRef.current.abort();
    }
    const controller = new AbortController();
    modalAbortRef.current = controller;

    setIsSearchingModalGoogle(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(getApiUrl(`/api/places/autocomplete?input=${encodeURIComponent(trimmed)}`), {
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.predictions) && data.predictions.length > 0) {
            const formatted: LocationNode[] = data.predictions.map((p: any) =>
              resolveHargeisaPlaceCoordinates({
                id: p.id,
                name: p.name || p.address?.split(',')[0] || trimmed,
                address: p.address || `${trimmed}, Hargeisa, Somaliland`,
                lat: typeof p.lat === 'number' ? p.lat : undefined,
                lng: typeof p.lng === 'number' ? p.lng : undefined,
                category: p.category || 'Google Map Location',
              })
            );
            setModalGoogleResults(formatted);
          } else {
            setModalGoogleResults([]);
          }
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setModalGoogleResults([]);
        }
      } finally {
        setIsSearchingModalGoogle(false);
      }
    }, 150);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchFilter]);

  const handleSelectSearchedPlace = (place: LocationNode | HargeisaPlace | string) => {
    const locNode = resolveHargeisaPlaceCoordinates(place as any);
    if (showLocationSearchModal === 'pickup') {
      setPickupLocation(locNode);
    } else {
      setDropoffLocation(locNode);
    }
    setShowLocationSearchModal(null);
    setSearchFilter('');
    setModalGoogleResults([]);
  };

  // Debounced copy of the search text: filtering ~10.6k places on every raw
  // keystroke is what made this input feel slow.
  const [debouncedSearchFilter, setDebouncedSearchFilter] = React.useState(searchFilter);
  React.useEffect(() => {
    if (!searchFilter) {
      setDebouncedSearchFilter('');
      return;
    }
    const t = setTimeout(() => setDebouncedSearchFilter(searchFilter), 120);
    return () => clearTimeout(t);
  }, [searchFilter]);

  // Warm the search index while idle so the first keystroke is already fast.
  React.useEffect(() => {
    let cancelled = false;
    const warm = () => {
      if (!cancelled) warmPlaceSearchIndex();
    };
    try {
      const ric = (window as any).requestIdleCallback;
      if (typeof ric === 'function') {
        const h = ric(warm, { timeout: 2000 });
        return () => {
          cancelled = true;
          const cic = (window as any).cancelIdleCallback;
          if (typeof cic === 'function') cic(h);
        };
      }
    } catch (_e) {}
    const t = setTimeout(warm, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, []);

  const filteredLocalPlaces = React.useMemo(() => {
    const categoryMap: Record<string, string[]> = {
      'Universities': ['education', 'university', 'jaamac'],
      'Hospitals': ['hospital', 'clinic', 'health', 'cusbitaal', 'dhakhtar'],
      'Schools': ['school', 'dugsi', 'academy'],
      'Roads': ['road', 'street', 'highway', 'wadad', 'jid'],
      'Fuel': ['gas station', 'fuel', 'shidaal', 'kaalin', 'petrol'],
      'Mosques': ['mosque', 'masjid', 'masaajid', 'salaat'],
      'Malls': ['supermarket', 'mall', 'market', 'suuq', 'grocery'],
      'Government': ['government', 'ministry', 'wasaarad', 'dowladd', 'palace', 'court'],
      'NGOs': ['ngo', 'un ', 'unicef', 'undp', 'who', 'humanitarian', 'hayad'],
      'Restaurants': ['restaurant', 'cafe', 'dining', 'cunto', 'maqaayad', 'grill', 'coffee'],
      'Hotels': ['hotel', 'hospitality', 'huteel', 'suites', 'resort'],
    };

    const q = debouncedSearchFilter.trim();

    // Category + text via the indexed search (cached haystacks, early exit).
    if (modalCategory === 'All') {
      if (!q) return HARGEISA_PLACES.slice(0, 30);
      return searchPlacesFast(q, { limit: 60 });
    }

    // Category tabs use their own keyword groups, so filter from the index results
    // for that category and then apply the text query.
    const targetKeywords = categoryMap[modalCategory] || [];
    const candidates = targetKeywords.length
      ? HARGEISA_PLACES.filter((p) => {
          const hay = `${p.category || ''} ${p.subCategory || ''} ${p.somaliCategory || ''} ${p.generalCategory || ''}`.toLowerCase();
          return targetKeywords.some((kw) => hay.split(/[\s&,]+/).some((w) => w.startsWith(kw)));
        })
      : [];

    if (!q) return candidates.slice(0, 60);

    // searchPlacesFast already applies cached-haystack + word-boundary matching;
    // reuse it by asking for the category slice then intersecting.
    const allowed = new Set(candidates.map((p) => p.id));
    return searchPlacesFast(q, { limit: 200 })
      .filter((p) => allowed.has(p.id))
      .slice(0, 60);
  }, [debouncedSearchFilter, modalCategory]);

  const combinedModalPlaces = React.useMemo(() => {
    const seen = new Set<string>();
    const list: (LocationNode & {
      isGoogle?: boolean;
      isDatabase?: boolean;
      subCategory?: string;
      district?: string;
      somaliCategory?: string;
    })[] = [];

    for (const r of filteredLocalPlaces) {
      seen.add(r.name.toLowerCase().trim());
      list.push({ ...r, isDatabase: true });
    }

    for (const g of modalGoogleResults) {
      const key = g.name.toLowerCase().trim();
      if (!seen.has(key)) {
        seen.add(key);
        list.push({ ...g, isGoogle: true });
      }
    }

    return list;
  }, [filteredLocalPlaces, modalGoogleResults]);

  const handleBookSelected = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (isBooking) return;
    setIsBooking(true);
    const scheduledTime = orderTiming === 'advance'
      ? new Date(Date.now() + advanceMinutes * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : undefined;
    bookRide('cash', undefined, undefined, undefined, scheduledTime);
    setTimeout(() => {
      setIsBooking(false);
    }, 1500);
  };

  const handleCancelSearch = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (isCancelling) return;
    setIsCancelling(true);
    cancelRide();
    setTimeout(() => {
      setIsCancelling(false);
    }, 800);
  };

  return (
    <div className="relative w-full h-full min-h-full flex flex-col bg-slate-100 text-slate-800 overflow-hidden font-sans select-none">
      {/* 0. GPS Live Location Permission Prompt */}
      <LocationPermissionPrompt />

      {/* 1. TOP APP HERO BAR - Matching exact screenshot design */}
      <WadaageRiderHeroHeader
        onOpenMenu={() => setShowMenuDrawer(true)}
        onOpenNotifications={() => setShowNotificationsModal(true)}
      />

      {/* MAIN TAB CONTENT AREA */}
      <div className="flex-1 w-full h-full overflow-hidden relative flex flex-col">
        {/* TAB 1: DALBO (MAP & VEHICLE SELECTION) */}
        {activeTab === 'dalbo' && (
          <div className="w-full h-full flex-1 flex flex-col overflow-hidden relative">
            {/* FLOATING COMPACT ROUTE INPUT CARD OVER MAP (High Visibility Pick-Up & Drop-Off) */}
            {!currentRide && (
              <div className="absolute top-2 inset-x-2.5 z-20 bg-white/95 backdrop-blur-md rounded-xl border border-slate-200/90 shadow-lg p-2 select-none">
                {/* Pickup Row */}
                <div
                  onClick={() => setShowLocationSearchModal('pickup')}
                  className="flex items-center justify-between cursor-pointer hover:bg-emerald-50/50 -mx-1 px-1.5 py-1 rounded-lg transition group"
                >
                  <div className="flex items-center space-x-2 min-w-0 flex-1">
                    {/* Glowing Emerald Pickup Indicator */}
                    <div className="relative shrink-0 flex items-center justify-center">
                      <span className="w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-emerald-200 flex items-center justify-center">
                        <span className="w-1 h-1 rounded-full bg-white" />
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-1">
                        <span className="text-[8.5px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-1 py-0.5 rounded leading-none">
                          PICK UP
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 truncate">
                          {language === 'so' ? 'Halka lagaa qaadayo' : 'Current Location'}
                        </span>
                      </div>
                      <div className="text-[11.5px] font-extrabold text-slate-900 truncate leading-tight mt-0.5">
                        {pickupLocation?.name || 'Ina Naxar Street, Hargeisa'}
                      </div>
                    </div>
                  </div>

                  {/* Blue Pill: Goobtaada (Use Current GPS) */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      detectUserRealLocation();
                    }}
                    disabled={isDetectingLocation}
                    className="shrink-0 ml-1.5 px-2 py-0.5 rounded-full bg-blue-50 hover:bg-blue-100 text-[#0066F5] border border-blue-200/80 text-[11px] font-bold flex items-center space-x-1 shadow-2xs active:scale-95 transition cursor-pointer"
                    title="Isticmaal GPS-ka tooska ah"
                  >
                    <Navigation className={`w-2.5 h-2.5 text-[#0066F5] ${isDetectingLocation ? 'animate-spin' : ''}`} />
                    <span>Goobtaada</span>
                  </button>
                </div>

                {/* Connecting Dotted Route Separator */}
                <div className="flex items-center pl-3 py-0.5">
                  <div className="flex flex-col items-center space-y-0.5">
                    <span className="w-1 h-1 rounded-full bg-emerald-400" />
                    <span className="w-1 h-1 rounded-full bg-rose-400" />
                  </div>
                </div>

                {/* Dropoff Row */}
                <div
                  onClick={() => setShowLocationSearchModal('dropoff')}
                  className="flex items-center justify-between cursor-pointer hover:bg-rose-50/50 -mx-1 px-1.5 py-1 rounded-lg transition group"
                >
                  <div className="flex items-center space-x-2 min-w-0 flex-1">
                    {/* Glowing Red Dropoff Pin Indicator */}
                    <div className="relative shrink-0 flex items-center justify-center">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center space-x-1">
                        <span className="text-[8.5px] font-black uppercase tracking-wider text-rose-800 bg-rose-100 px-1 py-0.5 rounded leading-none">
                          DROP OFF
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 truncate">
                          {language === 'so' ? 'Halka aad tageyso' : 'Destination'}
                        </span>
                      </div>
                      <div className="text-[11.5px] font-extrabold text-slate-900 truncate leading-tight mt-0.5">
                        {dropoffLocation?.name || 'Berbera Bus Terminal (Istaanka Berbera)'}
                      </div>
                    </div>
                  </div>

                  {/* Beddel (Change) button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowLocationSearchModal('dropoff');
                    }}
                    className="shrink-0 ml-1.5 px-2 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center space-x-1 transition active:scale-90 cursor-pointer border border-slate-200"
                    title="Beddel meesha"
                  >
                    <span>Beddel</span>
                    <X className="w-2.5 h-2.5 text-slate-400" />
                  </button>
                </div>
              </div>
            )}

            {/* FULL BLEED MAP AREA - Maximum screen space */}
            <div className="relative flex-1 w-full h-full overflow-hidden">
              <UnifiedMap height="100%" />

              {/* Floating GPS Button on right - positioned neatly */}
              <div className="absolute top-28 right-2.5 z-20 flex flex-col space-y-2 select-none">
                <button
                  type="button"
                  onClick={() => detectUserRealLocation()}
                  disabled={isDetectingLocation}
                  className="w-9 h-9 rounded-full bg-white/95 backdrop-blur-sm border border-slate-200 shadow-md flex items-center justify-center text-[#0066F5] hover:bg-white active:scale-95 transition cursor-pointer"
                  title="Goobteyda GPS"
                >
                  <Crosshair className={`w-4 h-4 ${isDetectingLocation ? 'animate-spin text-amber-500' : ''}`} />
                </button>
              </div>

              {/* ACTIVE RIDE CARD OVERLAY - Floating docked at bottom of full-bleed map */}
              {currentRide && (
                <div className="absolute bottom-3 inset-x-3 z-30 max-w-md mx-auto pointer-events-auto">
                  <ActiveRideCard onOpenSafetyModal={() => setShowSafetyModal(true)} />
                </div>
              )}
            </div>

            {/* BOTTOM VEHICLE SELECTION SHEET - Compact design for maximum map area */}
            {!currentRide && (
              <div className="absolute bottom-0 inset-x-0 z-20 bg-white rounded-t-2xl shadow-2xl border-t border-slate-200/80 px-3 pt-2 pb-3 select-none">
                {/* Drag handle */}
                <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mb-2" />

                {/* 2 Side-by-side compact vehicle cards */}
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {/* Card 1: Wadaage */}
                  <div
                    onClick={() => setSelectedCategory('wadaage_share')}
                    className={`relative rounded-xl p-2 flex flex-col justify-between transition cursor-pointer ${
                      selectedCategory === 'wadaage_share'
                        ? 'border-2 border-emerald-500 bg-white shadow-sm ring-2 ring-emerald-500/20'
                        : 'border border-slate-200 bg-white hover:border-slate-300 shadow-2xs'
                    }`}
                  >
                    {/* Top right checkmark badge */}
                    <div className="absolute top-2 right-2">
                      {selectedCategory === 'wadaage_share' ? (
                        <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-300 bg-white" />
                      )}
                    </div>

                    {/* Vector / Photo Car graphic */}
                    <div className="w-full h-10 flex items-center justify-center overflow-hidden">
                      <img
                        src="/images/car_wadaage_share.jpg"
                        alt="Wadaage Share"
                        className="w-full h-full object-contain drop-shadow-xs"
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = 'none';
                        }}
                      />
                      <WadaageCarCardGraphic type="wadaage" className="w-24 h-10 object-contain drop-shadow-xs hidden only:block" />
                    </div>

                    {/* Title & Slogan */}
                    <div className="mt-0.5">
                      <div className="font-black text-slate-900 text-xs tracking-tight">Wadaage</div>
                      <div className="text-[9.5px] text-slate-400 font-medium leading-tight truncate">
                        Safar wadaag, nolol wadaag
                      </div>
                    </div>

                    {/* Price */}
                    <div className="mt-1 text-sm font-black text-slate-900 tracking-tight">
                      {wadaageFareFormatted}
                    </div>

                    {/* Meta & Seats Selector */}
                    <div className="mt-1 flex items-center justify-between text-[9px] text-slate-500 font-bold border-t border-slate-100 pt-1 relative">
                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setCapacityDropdownOpen(!capacityDropdownOpen);
                          }}
                          className="flex items-center space-x-1 hover:text-emerald-700 bg-slate-50 hover:bg-slate-100 px-1 py-0.5 rounded border border-slate-200 transition cursor-pointer"
                        >
                          <Users className="w-2.5 h-2.5 text-slate-400" />
                          <span>{selectedCapacity} kursi</span>
                          <ChevronDown className="w-2 h-2 ml-0.5 text-slate-400" />
                        </button>

                        {capacityDropdownOpen && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute bottom-full left-0 mb-1 z-30 bg-white border border-slate-200 rounded-xl shadow-xl p-1 flex space-x-1 animate-fadeIn"
                          >
                            {[1, 2, 3, 4].map((num) => (
                              <button
                                key={num}
                                type="button"
                                onClick={() => {
                                  setSelectedCapacity(num);
                                  setCapacityDropdownOpen(false);
                                }}
                                className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center transition cursor-pointer ${
                                  selectedCapacity === num
                                    ? 'bg-[#008751] text-white shadow-xs'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                }`}
                              >
                                {num}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <span className="flex items-center space-x-0.5">
                        <Clock className="w-2.5 h-2.5 text-slate-400" />
                        <span>~10 daq</span>
                      </span>
                    </div>
                  </div>

                  {/* Card 2: Normal Taxi */}
                  <div
                    onClick={() => setSelectedCategory('wadaage_taxi')}
                    className={`relative rounded-xl p-2 flex flex-col justify-between transition cursor-pointer ${
                      selectedCategory === 'wadaage_taxi'
                        ? 'border-2 border-emerald-500 bg-white shadow-sm ring-2 ring-emerald-500/20'
                        : 'border border-slate-200 bg-white hover:border-slate-300 shadow-2xs'
                    }`}
                  >
                    {/* Top right indicator */}
                    <div className="absolute top-2 right-2">
                      {selectedCategory === 'wadaage_taxi' ? (
                        <div className="w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-300 bg-white" />
                      )}
                    </div>

                    {/* Vector / Photo Car graphic */}
                    <div className="w-full h-10 flex items-center justify-center overflow-hidden">
                      <img
                        src="/images/car_taaksi_gaara.jpg"
                        alt="Normal Taxi"
                        className="w-full h-full object-contain drop-shadow-xs"
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = 'none';
                        }}
                      />
                      <WadaageCarCardGraphic type="taxi" className="w-24 h-10 object-contain drop-shadow-xs hidden only:block" />
                    </div>

                    {/* Title & Slogan */}
                    <div className="mt-0.5">
                      <div className="font-black text-slate-900 text-xs tracking-tight">Normal Taxi</div>
                      <div className="text-[9.5px] text-slate-400 font-medium leading-tight truncate">
                        Gaari kuu gaar ah
                      </div>
                    </div>

                    {/* Price */}
                    <div className="mt-1 text-sm font-black text-slate-900 tracking-tight">
                      {taxiFareFormatted}
                    </div>

                    {/* Meta */}
                    <div className="mt-1 flex items-center justify-between text-[9px] text-slate-500 font-bold border-t border-slate-100 pt-1">
                      <span className="flex items-center space-x-0.5">
                        <Users className="w-2.5 h-2.5 text-slate-400" />
                        <span>1–4 kursi</span>
                      </span>
                      <span className="flex items-center space-x-0.5">
                        <Clock className="w-2.5 h-2.5 text-slate-400" />
                        <span>~10 daq</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Big Green CTA Button: Dalbo Hada → */}
                <button
                  type="button"
                  disabled={isBooking}
                  onClick={handleBookSelected}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#008751] via-emerald-600 to-[#006038] hover:opacity-95 active:scale-[0.98] text-white font-black text-base tracking-wide shadow-xl shadow-emerald-600/30 flex items-center justify-center space-x-3 transition cursor-pointer touch-manipulation select-none border border-emerald-400/30"
                >
                  {isBooking ? (
                    <span className="flex items-center space-x-2">
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{language === 'so' ? 'Waa la dalbayaa...' : 'Booking...'}</span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-2">
                      <span className="text-lg">🚗</span>
                      <span>
                        {orderTiming === 'advance'
                          ? (language === 'so'
                              ? `Xaqiiji Dalabka Hore (${new Date(Date.now() + advanceMinutes * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`
                              : `Confirm Advance Order (${new Date(Date.now() + advanceMinutes * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`)
                          : (language === 'so'
                              ? `DALBO HADDA (BOOK RIDE)`
                              : `DALBO HADDA (BOOK RIDE)`)}
                      </span>
                      <span className="text-lg">➔</span>
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SAFARRADAYDA (TRIP HISTORY & ACTIVITY) */}
        {activeTab === 'safarradayda' && (
          <div className="w-full h-full flex-1 overflow-y-auto bg-slate-50 p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-black text-slate-900">
                  {language === 'so' ? 'Safarradii Hore' : 'Trip History'}
                </h2>
                <p className="text-xs text-slate-500">
                  {language === 'so' ? 'Daawo safarrada aad ku martay Hargeysa' : 'Past rides and digital receipts'}
                </p>
              </div>
              <button
                onClick={() => setShowHistoryModal(true)}
                className="text-xs font-bold text-[#008751] bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200"
              >
                {language === 'so' ? 'Dhammaan' : 'All Receipts'}
              </button>
            </div>

            {/* Current Active Trip Banner if available */}
            {currentRide && (
              <div
                onClick={() => setActiveTab('dalbo')}
                className="bg-emerald-600 text-white rounded-2xl p-4 shadow-lg flex items-center justify-between cursor-pointer active:scale-98 transition"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Car className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold uppercase tracking-wider text-emerald-200">
                      {language === 'so' ? 'Safar Hadda Socda' : 'Active Live Trip'}
                    </div>
                    <div className="font-bold text-sm truncate max-w-[200px]">{currentRide.dropoff?.name || 'Dropoff Destination'}</div>
                  </div>
                </div>
                <span className="text-xs font-black bg-white text-emerald-800 px-3 py-1 rounded-full">
                  {language === 'so' ? 'Daawo' : 'View'}
                </span>
              </div>
            )}

            {/* List of Real Recorded Rides */}
            <div className="space-y-3">
              {(allPlatformRides && allPlatformRides.length > 0 ? allPlatformRides : [
                {
                  id: 'WDG-9481',
                  categoryName: 'Wadaage Share',
                  driverName: 'Maxamed Cumar',
                  driverVehicleModel: 'Toyota Vitz (SL-2044)',
                  pickup: { name: 'Maan-soor Hotel & Conference Center', address: 'Jigjiga Yar Road, Hargeisa' },
                  dropoff: { name: 'Egal International Airport (HGA)', address: 'Airport Road, Hargeisa' },
                  totalFare: 3.50,
                  status: 'completed',
                  completedAt: '2026-09-24T08:48:00Z',
                },
                {
                  id: 'WDG-8824',
                  categoryName: 'Wadaage Share',
                  driverName: 'Mustafe Cabdi',
                  driverVehicleModel: 'Toyota Passo (SL-8821)',
                  pickup: { name: 'University of Hargeisa Campus', address: 'Shaab, Hargeisa' },
                  dropoff: { name: 'Waheen Central Market', address: 'Downtown Waheen, Hargeisa' },
                  totalFare: 1.80,
                  status: 'completed',
                  completedAt: '2026-09-24T10:24:00Z',
                },
                {
                  id: 'WDG-7105',
                  categoryName: 'Normal Taxi',
                  driverName: 'Cali Xasan',
                  driverVehicleModel: 'Toyota Corolla (SL-1029)',
                  pickup: { name: 'Edna Adan University Hospital', address: 'Ahmed Dhagax, Hargeisa' },
                  dropoff: { name: 'Deero Mall Complex', address: 'Jigjiga Yar, Hargeisa' },
                  totalFare: 3.00,
                  status: 'completed',
                  completedAt: '2026-09-24T11:59:00Z',
                },
              ]).map((trip: any, idx: number) => {
                let dateDisplay = 'Maanta';
                try {
                  if (trip.completedAt) {
                    dateDisplay = new Date(trip.completedAt).toLocaleDateString('so-SO', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    });
                  } else if (trip.createdAt) {
                    dateDisplay = new Date(trip.createdAt).toLocaleDateString('so-SO', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    });
                  }
                } catch {}

                const fareUsd = trip.totalFare || 2.50;
                const fareSlsh = Math.round(fareUsd * 8500);

                return (
                  <div
                    key={trip.id || idx}
                    className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3 hover:border-slate-300 transition"
                  >
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-8 h-8 rounded-full bg-emerald-50 text-[#008751] flex items-center justify-center font-black text-xs">
                          ✓
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-900">
                            {trip.driverVehicleModel || trip.categoryName || 'Wadaage Mobility'}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {trip.id} • {dateDisplay}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {trip.status === 'completed' ? (language === 'so' ? 'Dhammaystiran' : 'Completed') : trip.status}
                      </span>
                    </div>

                    <div className="text-xs space-y-1.5">
                      <div className="flex items-start text-slate-600">
                        <span className="w-2 h-2 rounded-full bg-blue-500 mr-2 shrink-0 mt-1" />
                        <span className="line-clamp-1">{trip.pickup?.name || trip.pickup?.address || 'Pickup'}</span>
                      </div>
                      <div className="flex items-start text-slate-900 font-medium">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2 shrink-0 mt-1" />
                        <span className="line-clamp-1">{trip.dropoff?.name || trip.dropoff?.address || 'Dropoff'}</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-500 text-[11px]">Darawal: </span>
                        <b className="text-slate-800">{trip.driverName || 'Maxamed Cumar'}</b>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-[#008751]">{fareSlsh.toLocaleString()} SLSH</span>
                        <span className="text-[10px] text-slate-400 ml-1">(${fareUsd.toFixed(2)})</span>
                      </div>
                    </div>

                    {/* Action Buttons: Receipt & Re-book */}
                    <div className="pt-2 border-t border-dashed border-slate-100 flex items-center justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => setShowHistoryModal(true)}
                        className="px-2.5 py-1 text-[11px] font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center space-x-1 transition"
                      >
                        <Receipt className="w-3.5 h-3.5 text-slate-500" />
                        <span>{language === 'so' ? 'Risidh' : 'Receipt'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (trip.pickup) setPickupLocation(trip.pickup);
                          if (trip.dropoff) setDropoffLocation(trip.dropoff);
                          setActiveTab('dalbo');
                        }}
                        className="px-3 py-1 text-[11px] font-black text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center space-x-1 transition"
                      >
                        <RotateCcw className="w-3 h-3 text-emerald-600" />
                        <span>{language === 'so' ? 'Mar kale Dalbo' : 'Re-book'}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: FAVORITES (GOOBAHA LA DOORBIDAY) */}
        {activeTab === 'favorites' && (
          <div className="w-full h-full flex-1 overflow-y-auto bg-slate-50 p-4 space-y-4">
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center space-x-2">
                <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                <span>{language === 'so' ? 'Goobaha La Doorbiday' : 'Favorite Places'}</span>
              </h2>
              <p className="text-xs text-slate-500">
                {language === 'so' ? 'Hal taabasho ku dalbo meelaha aad sida joogtada ah u tagto' : '1-tap quick booking to your regular spots in Hargeisa'}
              </p>
            </div>

            {/* Quick action grid */}
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { id: 'fav_home', label: 'Hoyga (Home)', icon: 'home', name: 'Ina Naxar Street, Hargeisa', address: 'Ina Naxar', lat: 9.5605, lng: 44.0750 },
                { id: 'fav_work', label: 'Shaqada (Work)', icon: 'briefcase', name: 'Dahabshiil Business Center', address: '26 June', lat: 9.5615, lng: 44.0660 },
                { id: 'fav_uni', label: 'Jaamacadda', icon: 'graduation-cap', name: 'University of Hargeisa', address: 'Maxamuud Haybe', lat: 9.5512, lng: 44.0585 },
                { id: 'fav_airport', label: 'Madaarka Hargeysa', icon: 'plane', name: 'Egal International Airport', address: 'Airport Rd', lat: 9.5181, lng: 44.0888 },
              ].map((fav) => (
                <div
                  key={fav.id}
                  onClick={() => {
                    setDropoffLocation({
                      id: fav.id,
                      name: fav.name,
                      address: fav.address,
                      lat: fav.lat,
                      lng: fav.lng,
                    });
                    setActiveTab('dalbo');
                  }}
                  className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs hover:border-emerald-500 hover:shadow-md cursor-pointer transition flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#008751] flex items-center justify-center font-bold text-sm">
                      {fav.icon === 'home' ? '🏠' : fav.icon === 'briefcase' ? '💼' : fav.icon === 'graduation-cap' ? '🎓' : '✈️'}
                    </div>
                    <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      Tag Hada →
                    </span>
                  </div>
                  <div>
                    <div className="font-extrabold text-xs text-slate-900">{fav.label}</div>
                    <div className="text-[11px] text-slate-500 truncate font-medium">{fav.name}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Custom Location adder banner */}
            <div
              onClick={() => {
                setShowLocationSearchModal('dropoff');
              }}
              className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-emerald-100 transition"
            >
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-xs text-slate-900">
                    {language === 'so' ? 'Ku dar Goob Cusub' : 'Add New Favorite Location'}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {language === 'so' ? 'Dooro goob kale oo Hargeysa ku taal' : 'Save any landmark in Hargeisa'}
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-emerald-700" />
            </div>
          </div>
        )}

        {/* TAB: WALLET (JEEBKA & LACAG-BIXINTA) */}
        {activeTab === 'wallet' && (
          <div className="w-full h-full flex-1 overflow-y-auto bg-slate-50 p-4 space-y-4">
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center space-x-2">
                <Wallet className="w-5 h-5 text-[#008751]" />
                <span>{language === 'so' ? 'Jeebka & Lacag-bixinta' : 'Wallet & Payments'}</span>
              </h2>
              <p className="text-xs text-slate-500">
                {language === 'so' ? 'Bixi lacagta caddaanka ah (SLSH) ama ku bixi Zaad/eDahab toos ah' : 'Cash payments (SLSH) and local mobile money services'}
              </p>
            </div>

            {/* Cash Payment Mode Card */}
            <div className="bg-gradient-to-br from-emerald-600 to-teal-800 rounded-2xl p-4 text-white shadow-md relative overflow-hidden">
              <div className="relative z-10 space-y-2">
                <div className="inline-flex items-center space-x-1.5 bg-white/20 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                  <span>💵 Cadaan / Cash</span>
                </div>
                <div className="text-2xl font-black">100% Lacag Cadaan ah</div>
                <p className="text-xs text-emerald-100 leading-relaxed">
                  Safarkaaga waxaad ku bixinaysaa lacag cadaan ah (Shilin Soomaaliland ama Dollar) marka uu darwalku ku geeyo goobtaada.
                </p>
              </div>
            </div>

            {/* Mobile Money Quick Dialers */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                {language === 'so' ? 'Lacag-bixinta Mobile Money' : 'Mobile Money Direct Transfer'}
              </h3>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-2.5">
                  <div className="font-black text-[#008751] text-sm">ZAAD</div>
                  <div className="text-[11px] font-bold text-slate-600 mt-0.5">*880#</div>
                  <div className="text-[9px] text-slate-400 mt-1">Telesom</div>
                </div>
                <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-2.5">
                  <div className="font-black text-blue-700 text-sm">eDahab</div>
                  <div className="text-[11px] font-bold text-slate-600 mt-0.5">*111#</div>
                  <div className="text-[9px] text-slate-400 mt-1">Somtel</div>
                </div>
                <div className="bg-amber-50/70 border border-amber-100 rounded-xl p-2.5">
                  <div className="font-black text-amber-700 text-sm">Sahal</div>
                  <div className="text-[11px] font-bold text-slate-600 mt-0.5">*712#</div>
                  <div className="text-[9px] text-slate-400 mt-1">Golis</div>
                </div>
              </div>
            </div>

            {/* Promo & Discounts */}
            <div
              onClick={() => setShowPromosModal(true)}
              className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex items-center justify-between cursor-pointer hover:border-emerald-300 transition"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#008751] flex items-center justify-center">
                  <Tag className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-extrabold text-xs text-slate-900">Koodhadhka Qiimo-dhimista (Promos)</div>
                  <div className="text-[11px] text-slate-500">Geli koodh si aad u hesho qiimo dhimis safarka ah</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>

            {/* Past Payment Receipts */}
            <div
              onClick={() => setShowHistoryModal(true)}
              className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs flex items-center justify-between cursor-pointer hover:border-emerald-300 transition"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-extrabold text-xs text-slate-900">Rasiidhada Safarrada (Receipts)</div>
                  <div className="text-[11px] text-slate-500">Dhammaan rasiidhadaha safarradii aad hore u gashay</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </div>
          </div>
        )}

        {/* TAB 4: AKOONKA (ACCOUNT & PROFILE) */}
        {activeTab === 'akoonka' && (
          <div className="w-full h-full flex-1 overflow-y-auto bg-slate-50 p-4 space-y-4">
            {/* Profile Card */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex items-center space-x-4">
              <div className="w-14 h-14 rounded-full bg-[#008751] text-white flex items-center justify-center font-black text-xl shadow-md">
                {currentUser?.name?.charAt(0) || 'R'}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-black text-base text-slate-900 truncate">
                  {currentUser?.name || 'Wadaage Passenger'}
                </h3>
                <p className="text-xs text-slate-500 font-mono">{currentUser?.phone || ''}</p>
                <div className="flex items-center space-x-1 text-emerald-600 font-bold text-xs mt-1">
                  <span>⭐ 5.0 Rakaab Qiimo Sare leh</span>
                </div>
              </div>
            </div>

            {/* Emergency SOS Button */}
            <button
              onClick={() => setShowSafetyModal(true)}
              className="w-full p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-left hover:bg-rose-100 transition shadow-xs"
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-extrabold text-xs text-rose-900">
                    {language === 'so' ? 'Xarunta Gurmadka Degdegga ah (SOS 999)' : 'Emergency Safety & SOS (999)'}
                  </div>
                  <div className="text-[11px] text-rose-600">
                    {language === 'so' ? 'Boliska Somaliland & Wadaage Dispatch' : 'Somaliland Police & Wadaage Command'}
                  </div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-rose-400" />
            </button>

            {/* Account Menu Items */}
            <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 shadow-sm text-xs font-bold text-slate-800">
              <button
                onClick={() => setShowPromosModal(true)}
                className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 transition"
              >
                <div className="flex items-center space-x-3">
                  <Tag className="w-4 h-4 text-[#008751]" />
                  <span>{t.promoTitle}</span>
                </div>
                <span className="text-[10px] bg-emerald-100 text-[#008751] px-2 py-0.5 rounded-full font-black">50% OFF</span>
              </button>

              <button
                onClick={() => setShowUssdModal(true)}
                className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 transition"
              >
                <div className="flex items-center space-x-3">
                  <Radio className="w-4 h-4 text-teal-600" />
                  <span>{language === 'so' ? 'Dalbashada Offline USSD (*990#)' : 'Offline USSD Booking (*990#)'}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => setShowCommuteModal(true)}
                className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 transition"
              >
                <div className="flex items-center space-x-3">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>{language === 'so' ? 'Baasaska Shaqada & Jaamacadda' : 'Commuter & Student Passes'}</span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => setLanguage(language === 'so' ? 'en' : 'so')}
                className="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 transition"
              >
                <div className="flex items-center space-x-3">
                  <Globe className="w-4 h-4 text-indigo-600" />
                  <span>{language === 'so' ? 'Luqadda (Soomaali / English)' : 'Language'}</span>
                </div>
                <span className="text-[11px] text-slate-500 font-bold flex items-center space-x-1">
                  {language === 'so' ? (
                    <>
                      <SomalilandFlag className="w-3.5 h-2.5 rounded-xs" />
                      <span>Soomaali</span>
                    </>
                  ) : (
                    <span>English 🇬🇧</span>
                  )}
                </span>
              </button>
            </div>

            {/* Logout Button */}
            <button
              onClick={logout}
              className="w-full py-3.5 px-4 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 font-bold rounded-2xl text-xs flex items-center justify-center space-x-2 transition"
            >
              <LogOut className="w-4 h-4" />
              <span>{t.logout}</span>
            </button>
          </div>
        )}
      </div>

      {/* NATIVE MOBILE BOTTOM TAB BAR (Matching screenshot 4 tabs exactly) */}
      <nav className="relative z-40 bg-white border-t border-slate-200/90 px-3 py-2 flex items-center justify-around shadow-lg shrink-0 select-none">
        {/* Tab 1: Home */}
        <button
          type="button"
          onClick={() => setActiveTab('dalbo')}
          className={`flex-1 min-h-[48px] py-1 px-2 flex flex-col items-center justify-center space-y-1 rounded-2xl transition-all duration-200 active:scale-95 cursor-pointer ${
            activeTab === 'dalbo'
              ? 'text-[#008751] font-extrabold'
              : 'text-slate-400 hover:text-slate-600 font-medium'
          }`}
        >
          <div className="relative">
            <Home className={`w-5 h-5 ${activeTab === 'dalbo' ? 'text-[#008751] stroke-[2.5px]' : 'text-slate-400 stroke-2'}`} />
            {currentRide && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            )}
          </div>
          <span className={`text-[11px] tracking-tight ${activeTab === 'dalbo' ? 'text-[#008751] font-black' : 'text-slate-400'}`}>
            Home
          </span>
        </button>

        {/* Tab 2: My Rides */}
        <button
          type="button"
          onClick={() => setActiveTab('safarradayda')}
          className={`flex-1 min-h-[48px] py-1 px-2 flex flex-col items-center justify-center space-y-1 rounded-2xl transition-all duration-200 active:scale-95 cursor-pointer ${
            activeTab === 'safarradayda'
              ? 'text-[#008751] font-extrabold'
              : 'text-slate-400 hover:text-slate-600 font-medium'
          }`}
        >
          <Clock className={`w-5 h-5 ${activeTab === 'safarradayda' ? 'text-[#008751] stroke-[2.5px]' : 'text-slate-400 stroke-2'}`} />
          <span className={`text-[11px] tracking-tight ${activeTab === 'safarradayda' ? 'text-[#008751] font-black' : 'text-slate-400'}`}>
            My Rides
          </span>
        </button>

        {/* Tab 3: Wallet */}
        <button
          type="button"
          onClick={() => setActiveTab('wallet')}
          className={`flex-1 min-h-[48px] py-1 px-2 flex flex-col items-center justify-center space-y-1 rounded-2xl transition-all duration-200 active:scale-95 cursor-pointer ${
            activeTab === 'wallet'
              ? 'text-[#008751] font-extrabold'
              : 'text-slate-400 hover:text-slate-600 font-medium'
          }`}
        >
          <Wallet className={`w-5 h-5 ${activeTab === 'wallet' ? 'text-[#008751] stroke-[2.5px]' : 'text-slate-400 stroke-2'}`} />
          <span className={`text-[11px] tracking-tight ${activeTab === 'wallet' ? 'text-[#008751] font-black' : 'text-slate-400'}`}>
            Wallet
          </span>
        </button>

        {/* Tab 4: Account */}
        <button
          type="button"
          onClick={() => setActiveTab('akoonka')}
          className={`flex-1 min-h-[48px] py-1 px-2 flex flex-col items-center justify-center space-y-1 rounded-2xl transition-all duration-200 active:scale-95 cursor-pointer ${
            activeTab === 'akoonka'
              ? 'text-[#008751] font-extrabold'
              : 'text-slate-400 hover:text-slate-600 font-medium'
          }`}
        >
          <User className={`w-5 h-5 ${activeTab === 'akoonka' ? 'text-[#008751] stroke-[2.5px]' : 'text-slate-400 stroke-2'}`} />
          <span className={`text-[11px] tracking-tight ${activeTab === 'akoonka' ? 'text-[#008751] font-black' : 'text-slate-400'}`}>
            Account
          </span>
        </button>
      </nav>

      {/* 7. LOCATION SEARCH & LANDMARK MODAL */}
      {showLocationSearchModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-xs p-3 animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden mt-4 flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="bg-[#008751] text-white p-3.5 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MapPin className="w-5 h-5" />
                <h3 className="font-bold text-sm">
                  {showLocationSearchModal === 'pickup' ? t.selectPickup : t.selectDropoff}
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowLocationSearchModal(null);
                  setSearchFilter('');
                }}
                className="p-1 text-white hover:opacity-80"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input & Live Feedback */}
            <div className="p-3 border-b border-slate-200 bg-slate-50 space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  placeholder={language === 'so' ? 'Qor magaca meel Hargeysa ah (tusaale: Mansoor, Airport, Dahabshiil...)' : 'Type place name in Hargeisa...'}
                  className="w-full bg-white border border-slate-300 rounded-xl py-2.5 pl-9 pr-20 text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#008751] focus:ring-1 focus:ring-[#008751] shadow-xs"
                  autoFocus
                />
                {isSearchingModalGoogle && (
                  <div className="absolute right-2.5 top-2.5 flex items-center gap-1 text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 animate-pulse">
                    <Globe className="w-2.5 h-2.5 animate-spin" />
                    <span>Google...</span>
                  </div>
                )}
                {!isSearchingModalGoogle && searchFilter && (
                  <button
                    onClick={() => {
                      setSearchFilter('');
                      setModalGoogleResults([]);
                    }}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Category Filter Tabs */}
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1.5 no-scrollbar text-[10px]">
                {[
                  { id: 'All', so: '⭐ Dhammaan', en: '⭐ All' },
                  { id: 'Universities', so: '🎓 Jaamacado', en: '🎓 Universities' },
                  { id: 'Hospitals', so: '🏥 Cusbitaallo', en: '🏥 Hospitals' },
                  { id: 'Schools', so: '📚 Dugsiyo', en: '📚 Schools' },
                  { id: 'Roads', so: '🛣️ Waddooyin', en: '🛣️ Roads' },
                  { id: 'Fuel', so: '⛽ Kaalmo Shidaal', en: '⛽ Fuel Stations' },
                  { id: 'Mosques', so: '🕌 Masaajidda', en: '🕌 Mosques' },
                  { id: 'Malls', so: '🛍️ Suuqyo & Malls', en: '🛍️ Supermarkets' },
                  { id: 'Government', so: "🏛️ Hay'adaha Dowladda", en: '🏛️ Government' },
                  { id: 'NGOs', so: "🏢 Hay'adaha UN/NGO", en: '🏢 NGOs' },
                  { id: 'Restaurants', so: '🍽️ Maqaayado & Cafes', en: '🍽️ Dining' },
                  { id: 'Hotels', so: '🏨 Huteello', en: '🏨 Hotels' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setModalCategory(cat.id)}
                    className={`px-2.5 py-1 rounded-lg font-bold whitespace-nowrap transition ${
                      modalCategory === cat.id
                        ? 'bg-[#008751] text-white shadow-xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {language === 'so' ? cat.so : cat.en}
                  </button>
                ))}
              </div>

              {/* GPS Quick Action */}
              {showLocationSearchModal === 'pickup' && (
                <button
                  type="button"
                  onClick={async () => {
                    await detectUserRealLocation();
                    setShowLocationSearchModal(null);
                  }}
                  className="w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[#008751] text-xs font-bold rounded-xl flex items-center justify-center space-x-2 transition"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>{language === 'so' ? 'Isticmaal GPS-ka Tooska ah ee Telefoonka' : 'Use My Current Live GPS in Hargeisa'}</span>
                </button>
              )}
            </div>

            {/* Landmark List */}
            <div className="p-2 overflow-y-auto flex-1 divide-y divide-slate-100">
              {/* Custom input pin button */}
              {searchFilter.trim().length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    handleSelectSearchedPlace(resolveHargeisaPlaceCoordinates(searchFilter.trim()));
                  }}
                  className="w-full text-left p-2.5 hover:bg-emerald-50 rounded-xl flex items-center justify-between transition mb-1 bg-emerald-50/40 border border-emerald-200/60"
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-[#008751] flex items-center justify-center font-bold text-xs shrink-0">
                      📍
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-extrabold text-[#008751] truncate">
                        &quot;{searchFilter}&quot;
                      </div>
                      <div className="text-[10px] text-slate-500 truncate">
                        {language === 'so' ? 'U dhig meel ahaan Hargeysa' : 'Set as custom coordinate in Hargeisa'}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-[#008751] bg-emerald-100 px-2 py-0.5 rounded-md shrink-0">
                    {language === 'so' ? 'Dooro' : 'Select'} →
                  </span>
                </button>
              )}

              {combinedModalPlaces.map((place) => (
                <button
                  key={place.id}
                  onClick={() => handleSelectSearchedPlace(place)}
                  className="w-full text-left p-2.5 hover:bg-slate-50 rounded-xl flex items-center justify-between transition group"
                >
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 shrink-0 group-hover:scale-105 transition">
                      {place.category === 'Transit' || place.name.toLowerCase().includes('airport') || (place as any).subCategory === 'aerodrome' ? (
                        <Plane className="w-4 h-4 text-blue-600" />
                      ) : place.category?.toLowerCase().includes('hotel') ? (
                        <Building className="w-4 h-4 text-amber-600" />
                      ) : place.category?.toLowerCase().includes('hospital') || place.name.toLowerCase().includes('hospital') || place.name.toLowerCase().includes('isbitaal') ? (
                        <span className="text-sm">🏥</span>
                      ) : place.category?.toLowerCase().includes('education') || place.name.toLowerCase().includes('university') || place.name.toLowerCase().includes('jaamacadda') ? (
                        <span className="text-sm">🎓</span>
                      ) : place.category?.toLowerCase().includes('school') || place.name.toLowerCase().includes('dugsiga') ? (
                        <span className="text-sm">📚</span>
                      ) : place.category?.toLowerCase().includes('mosque') || place.name.toLowerCase().includes('masjid') || place.name.toLowerCase().includes('casaan') ? (
                        <span className="text-sm">🕌</span>
                      ) : place.category?.toLowerCase().includes('gas station') || place.category?.toLowerCase().includes('fuel') || place.name.toLowerCase().includes('kaalinta') ? (
                        <span className="text-sm">⛽</span>
                      ) : place.category?.toLowerCase().includes('government') || place.name.toLowerCase().includes('wasaaradda') || place.name.toLowerCase().includes('madaxtooyada') ? (
                        <span className="text-sm">🏛️</span>
                      ) : place.category?.toLowerCase().includes('restaurant') || place.category?.toLowerCase().includes('cafe') || place.name.toLowerCase().includes('maqaayad') ? (
                        <span className="text-sm">🍽️</span>
                      ) : place.category?.toLowerCase().includes('market') || place.category?.toLowerCase().includes('mall') || place.category?.toLowerCase().includes('supermarket') ? (
                        <span className="text-sm">🛍️</span>
                      ) : (
                        <MapPin className="w-4 h-4 text-[#008751]" />
                      )}
                    </div>
                    <div className="truncate">
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-bold text-slate-900 truncate group-hover:text-[#008751] transition">{place.name}</span>
                        {place.isDatabase && (
                          <span className="text-[8px] font-black bg-emerald-100 text-[#008751] px-1.5 py-0.2 rounded shrink-0 flex items-center gap-0.5">
                            <span className="w-1 h-1 rounded-full bg-[#008751]"></span>
                            <span>DB</span>
                          </span>
                        )}
                        {place.isGoogle && (
                          <span className="text-[8px] font-black bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded shrink-0">
                            Google
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate flex items-center gap-1">
                        {place.district && <span className="font-semibold text-slate-700">{place.district} • </span>}
                        <span>{place.address}</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#008751] transition shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 8. NOTES TO DRIVER MODAL */}
      {showNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-slate-900">{t.noteToDriver}</h3>
              <button onClick={() => setShowNoteModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <textarea
              value={driverNote}
              onChange={(e) => setDriverNote(e.target.value)}
              placeholder={t.enterNote}
              rows={3}
              className="w-full border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#008751]"
            />
            <button
              onClick={() => setShowNoteModal(false)}
              className="w-full py-2.5 bg-[#008751] hover:bg-[#007345] text-white font-bold rounded-xl text-xs transition"
            >
              {t.saveNote}
            </button>
          </div>
        </div>
      )}

      {/* 9. PROMO CODE INPUT MODAL */}
      {showPromoInputModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-slate-900">{t.promoTitle}</h3>
              <button onClick={() => setShowPromoInputModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            <input
              type="text"
              value={promoCodeInput}
              onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
              placeholder={t.enterPromo}
              className="w-full border border-slate-300 rounded-xl p-2.5 text-xs font-bold text-slate-800 uppercase focus:outline-none focus:border-[#008751]"
            />
            <button
              onClick={() => setShowPromoInputModal(false)}
              className="w-full py-2.5 bg-[#008751] hover:bg-[#007345] text-white font-bold rounded-xl text-xs transition"
            >
              {t.apply}
            </button>
          </div>
        </div>
      )}

      {/* 10. PAYMENT METHOD NOTICE MODAL (CASH ONLY) */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 animate-fadeIn">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-sm shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <span className="text-xl">💵</span>
                <h3 className="font-bold text-sm text-slate-900">
                  {language === 'so' ? 'Habka Lacag-Bixinta: Naqad (Cash)' : 'Payment Method: Cash Only'}
                </h3>
              </div>
              <button onClick={() => setShowPaymentModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cash Only Highlight */}
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2">
              <div className="flex items-center space-x-2 text-[#008751] font-black text-xs uppercase tracking-wider">
                <CheckCircle className="w-4 h-4 text-[#008751]" />
                <span>{language === 'so' ? 'Lacag Caddaan ah (Naqad)' : '100% Cash On Drop-off'}</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {language === 'so'
                  ? 'Dhammaan safarrada Wadaage waxaa si toos ah loogu bixiyaa lacag caddaan ah darawalka (Shilin Somaliland SLSH ama USD) marka aad gaadho meesha aad u socoto.'
                  : 'All Wadaage trips in Somaliland are paid directly in cash to your captain (Somaliland Shillings SLSH or USD) upon arrival.'}
              </p>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1.5">
              <div className="flex justify-between font-medium">
                <span>{language === 'so' ? 'Qiimaha Shilin Somaliland:' : 'Somaliland Shillings (SLSH):'}</span>
                <span className="font-bold text-slate-900">1 USD = 11,250 SLSH</span>
              </div>
              <div className="flex justify-between font-medium">
                <span>{language === 'so' ? 'Lacagta la aqbalo:' : 'Accepted Currencies:'}</span>
                <span className="font-bold text-emerald-700">SLSH / USD Cash</span>
              </div>
            </div>

            <button
              onClick={() => setShowPaymentModal(false)}
              className="w-full py-3 bg-[#008751] hover:bg-[#007345] text-white font-bold rounded-xl text-xs transition"
            >
              {language === 'so' ? 'Waan Fahmay (OK)' : 'Understood (OK)'}
            </button>
          </div>
        </div>
      )}

      {/* 11. SIDE MENU DRAWER */}
      {showMenuDrawer && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setShowMenuDrawer(false)}
          />
          <div className="relative w-72 max-w-[80vw] bg-white text-slate-800 h-full shadow-2xl p-5 flex flex-col justify-between z-10 animate-slideRight">
            <div className="space-y-4">
              {/* Brand Top Header in Drawer */}
              <div className="bg-[#030d1a] -mx-5 -mt-5 p-4 flex items-center justify-between border-b border-slate-800 shadow-md">
                <div className="flex items-center space-x-2.5">
                  <WadaageLogo variant="icon" size="sm" />
                  <WadaageLogo variant="wordmark" size="xs" />
                </div>
                <button
                  onClick={() => setShowMenuDrawer(false)}
                  className="p-1.5 rounded-full text-slate-400 hover:text-white bg-white/10 hover:bg-white/20 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Profile Card */}
              <div className="flex items-center space-x-3 border-b border-slate-100 pb-3">
                <div className="w-11 h-11 rounded-full bg-[#008751] flex items-center justify-center font-black text-white shadow-md">
                  {currentUser?.name?.charAt(0) || 'W'}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">{currentUser?.name || 'Wadaage Rider'}</h3>
                  <p className="text-xs text-slate-500 font-mono">{currentUser?.phone || ''}</p>
                </div>
              </div>

              {/* Language Switch Row */}
              <div className="p-3 bg-emerald-50 rounded-xl flex items-center justify-between border border-emerald-100">
                <span className="text-xs font-bold text-[#008751]">{t.switchLanguage}</span>
                <button
                  onClick={() => setLanguage(language === 'so' ? 'en' : 'so')}
                  className="px-2.5 py-1 bg-white text-[#008751] text-xs font-black rounded-lg shadow-xs border border-emerald-200 flex items-center space-x-1"
                >
                  {language === 'so' ? (
                    <>
                      <SomalilandFlag className="w-3.5 h-2.5 rounded-xs" />
                      <span>Soomaali</span>
                    </>
                  ) : (
                    <span>English 🇬🇧</span>
                  )}
                </button>
              </div>

              {/* Navigation Links */}
              <div className="space-y-1 text-sm font-semibold">
                <button
                  onClick={() => {
                    setShowMenuDrawer(false);
                    setShowPromosModal(true);
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-100 text-slate-700 transition"
                >
                  <div className="flex items-center space-x-2.5">
                    <Tag className="w-4 h-4 text-[#008751]" />
                    <span>{t.promoTitle}</span>
                  </div>
                  <span className="text-[9px] bg-emerald-100 text-[#008751] font-black px-1.5 py-0.5 rounded">50% OFF</span>
                </button>

                <button
                  onClick={() => {
                    setShowMenuDrawer(false);
                    setShowHistoryModal(true);
                  }}
                  className="w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl hover:bg-slate-100 text-slate-700 transition"
                >
                  <History className="w-4 h-4 text-blue-600" />
                  <span>{t.history}</span>
                </button>

                <button
                  onClick={() => {
                    setShowMenuDrawer(false);
                    setShowSafetyModal(true);
                  }}
                  className="w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl hover:bg-slate-100 text-slate-700 transition"
                >
                  <Shield className="w-4 h-4 text-rose-500" />
                  <span>{t.emergencySOS}</span>
                </button>

                <button
                  onClick={() => {
                    setShowMenuDrawer(false);
                    setShowUssdModal(true);
                  }}
                  className="w-full flex items-center space-x-2.5 px-3 py-2.5 rounded-xl hover:bg-slate-100 text-slate-700 transition"
                >
                  <Radio className="w-4 h-4 text-teal-600" />
                  <span>Offline USSD (*990#)</span>
                </button>
              </div>
            </div>

            {/* Sign Out Button */}
            <div className="pt-4 border-t border-slate-200">
              <button
                onClick={logout}
                className="w-full flex items-center justify-center space-x-2 py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl text-xs font-bold transition"
              >
                <LogOut className="w-4 h-4" />
                <span>{t.logout}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 12. MODAL WINDOWS */}
      <WadaageSearchOverlay
        isOpen={showSuperAppSearch}
        onClose={() => setShowSuperAppSearch(false)}
        onSelectDestination={(loc) => {
          setDropoffLocation(loc);
          setShowSuperAppSearch(false);
        }}
        onOpenMapPicker={() => setShowLocationSetupModal(true)}
        currentPickup={pickupLocation}
      />
      {showLocationSetupModal && (
        <LocationSetupModal
          isOpen={showLocationSetupModal}
          onClose={() => setShowLocationSetupModal(false)}
        />
      )}
      {showPromosModal && <PromosModal onClose={() => setShowPromosModal(false)} />}
      {showHistoryModal && <TripHistoryModal onClose={() => setShowHistoryModal(false)} />}
      {showSafetyModal && <SafetyCenterModal onClose={() => setShowSafetyModal(false)} />}
      <UssdOfflineBookingModal isOpen={showUssdModal} onClose={() => setShowUssdModal(false)} />
      <FareSplitModal isOpen={showSplitModal} onClose={() => setShowSplitModal(false)} />
      <CommuteSubscriptionModal isOpen={showCommuteModal} onClose={() => setShowCommuteModal(false)} />
    </div>
  );
};
