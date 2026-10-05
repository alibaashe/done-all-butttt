import React, { useState } from 'react';
import {
  ArrowRightLeft,
  Bike,
  Briefcase,
  Bus,
  Car,
  CarFront,
  Check,
  ChevronDown,
  Clock,
  Compass,
  HeartHandshake,
  Info,
  MapPin,
  Mic,
  Navigation,
  PhoneCall,
  Receipt,
  Repeat,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Tag,
  Ticket,
  Truck,
  UserCheck,
  Users,
  Volume2,
  Wallet,
} from 'lucide-react';
import { CITY_LOCATIONS, VEHICLE_CATEGORY_DETAILS } from '../../data/mockData';
import { useRide } from '../../context/RideContext';
import { LocationNode, VehicleCategory } from '../../types';
import { calculateDistanceKm, calculateDurationMins, computeFare, formatCurrency } from '../../utils/geo';
import { VoiceBookingModal } from './VoiceBookingModal';
import { UssdOfflineBookingModal } from './UssdOfflineBookingModal';
import { FareSplitModal } from './FareSplitModal';
import { CommuteSubscriptionModal } from './CommuteSubscriptionModal';
import { WadaageShareInfoModal } from './WadaageShareInfoModal';
import { IntercityBookingModal } from './IntercityBookingModal';
import { SmartLocationAutocomplete } from './SmartLocationAutocomplete';

interface RideBookingCardProps {
  onSelectMapPin: (mode: 'pickup' | 'dropoff') => void;
  selectableMode: 'pickup' | 'dropoff' | null;
}

export const RideBookingCard: React.FC<RideBookingCardProps> = ({
  onSelectMapPin,
  selectableMode,
}) => {
  const {
    pickupLocation,
    setPickupLocation,
    realUserLocation,
    isDetectingLocation,
    detectUserRealLocation,
    dropoffLocation,
    setDropoffLocation,
    selectedCategory,
    setSelectedCategory,
    pricing,
    walletBalance,
    bookRide,
    appliedPromo,
    promoError,
    applyPromoCode,
    removePromoCode,
    rideOptions,
    setRideOptions,
    multiStops,
    seatsBooked,
    setSeatsBooked,
    poolingType,
    setPoolingType,
    genderPreference,
    setGenderPreference,
    splitFareWith,
    waitAndSaveTier,
    setWaitAndSaveTier,
    userPasses,
    roadDistanceKm,
    roadDurationMins,
    roadRouteSummary,
    isCalculatingRoadRoute,
  } = useRide();

  const [promoInput, setPromoInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'zaad' | 'edahab' | 'premier' | 'cash'>('zaad');
  const [showOptions, setShowOptions] = useState(false);

  // Custom written location text states
  const [isEditingPickup, setIsEditingPickup] = useState(false);
  const [pickupText, setPickupText] = useState('');
  const [isEditingDropoff, setIsEditingDropoff] = useState(false);
  const [dropoffText, setDropoffText] = useState('');

  // Modal visibility states
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showUssdModal, setShowUssdModal] = useState(false);
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [showCommuteModal, setShowCommuteModal] = useState(false);
  const [showShareInfoModal, setShowShareInfoModal] = useState(false);
  const [showFareInfoModal, setShowFareInfoModal] = useState(false);
  const [showIntercityModal, setShowIntercityModal] = useState(false);

  // Who will seat? (Myself / Someone else)
  const [whoWillSeat, setWhoWillSeat] = useState<'myself' | 'someone_else'>('myself');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');

  // Book by Bid toggle
  const [isBookByBid, setIsBookByBid] = useState(false);
  const [targetBidPrice, setTargetBidPrice] = useState<number>(0);

  // Check if passenger has active pass that applies
  const activePass = userPasses.find((p) => p.status === 'active' && p.remainingTrips > 0);

  // Swap pickup & dropoff
  const handleSwap = () => {
    const temp = pickupLocation;
    setPickupLocation(dropoffLocation);
    setDropoffLocation(temp);
  };

  const distanceKm = roadDistanceKm || calculateDistanceKm(
    pickupLocation.lat,
    pickupLocation.lng,
    dropoffLocation.lat,
    dropoffLocation.lng
  );
  const durationMins = roadDurationMins || calculateDurationMins(distanceKm);

  const categories: VehicleCategory[] = ['wadaage_share', 'wadaage_taxi'];

  const getCategoryIcon = (cat: VehicleCategory) => {
    switch (cat) {
      case 'wadaage_share':
        return <Users className="w-5 h-5 text-emerald-500" />;
      case 'wadaage_taxi':
      case 'wadaage_car':
      default:
        return <Car className="w-5 h-5 text-emerald-600" />;
    }
  };

  const currentFareDetails = computeFare(
    selectedCategory,
    distanceKm,
    durationMins,
    pricing,
    seatsBooked,
    poolingType,
    waitAndSaveTier
  );
  let promoDiscount = 0;
  if (appliedPromo) {
    if (appliedPromo.flatDiscount) promoDiscount = appliedPromo.flatDiscount;
    if (appliedPromo.discountPercent) promoDiscount = (currentFareDetails.finalFare * appliedPromo.discountPercent) / 100;
  }
  let estimatedTotal = Math.max(0.40, currentFareDetails.finalFare - promoDiscount);

  if (activePass && selectedCategory === 'wadaage_share') {
    estimatedTotal = 0; // Pre-paid via commuter pass
  } else if (splitFareWith.length > 0) {
    estimatedTotal = Math.round((estimatedTotal / (splitFareWith.length + 1)) * 100) / 100;
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xl flex flex-col space-y-4">
      {/* Header Title & Quick Assistant Buttons */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-extrabold text-slate-900 dark:text-white text-base">Book a Ride</h2>
            <p className="text-xs text-slate-500">Pick up point, vehicle choice & fare quote</p>
          </div>
        </div>

        {/* Voice AI, Intercity & Commute Hub Triggers */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowIntercityModal(true)}
            className="p-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center gap-1 transition"
            title="Inter-City Travel Hub"
          >
            <Bus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Intercity</span>
          </button>
          <button
            onClick={() => setShowCommuteModal(true)}
            className="p-2 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-600 dark:text-teal-400 font-bold text-xs flex items-center gap-1 transition"
            title="Wadaage Passes & Commute Subscription"
          >
            <Ticket className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Passes</span>
          </button>
          <button
            onClick={() => setShowVoiceModal(true)}
            className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center gap-1 transition"
            title="AI Voice Assistant Booking (Af-Soomaali)"
          >
            <Mic className="w-3.5 h-3.5 animate-pulse text-emerald-500" />
            <span className="hidden sm:inline">Voice</span>
          </button>
          <button
            onClick={() => setShowUssdModal(true)}
            className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center gap-1 transition"
            title="Offline USSD / SMS Booking"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">USSD</span>
          </button>
        </div>
      </div>

      {/* Active Pass Notification Banner */}
      {activePass && (
        <div className="p-3 bg-gradient-to-r from-teal-500/10 to-emerald-500/10 border border-teal-500/30 rounded-2xl flex items-center justify-between text-xs animate-in fade-in">
          <div className="flex items-center gap-2 text-teal-700 dark:text-teal-300">
            <Ticket className="w-4 h-4 text-teal-500 flex-shrink-0" />
            <div>
              <span className="font-extrabold">{activePass.passName} Active</span>
              <span className="text-[11px] text-slate-500 block">
                {activePass.remainingTrips} trips left • $0.00 ride cost applied automatically!
              </span>
            </div>
          </div>
          <button
            onClick={() => setShowCommuteModal(true)}
            className="px-2.5 py-1 bg-teal-500 text-slate-950 rounded-lg text-[10px] font-black uppercase hover:bg-teal-400 transition"
          >
            View Pass
          </button>
        </div>
      )}

      {/* Location Selector Inputs */}
      <div className="relative flex flex-col space-y-2.5">
        {/* Connection vertical line */}
        <div className="absolute left-[19px] top-[26px] bottom-[26px] w-0.5 bg-dashed border-l-2 border-emerald-500/40 z-0"></div>

        {/* Pickup Selector (Staying At) */}
        <div className="z-30">
          <SmartLocationAutocomplete
            id="passenger-pickup-search"
            label="Staying At (Pickup Point)"
            placeholder="Search pickup (Hotel, Airport, Bank, Business, Street...)"
            pointType="pickup"
            selectedLocation={pickupLocation}
            onSelectLocation={(loc) => setPickupLocation(loc)}
            onOpenMapPin={() => onSelectMapPin('pickup')}
            isMapPinning={selectableMode === 'pickup'}
            showGpsButton={true}
            onGpsClick={() => detectUserRealLocation()}
            isGpsLocating={isDetectingLocation}
          />
        </div>

        {/* Swap button & Multi-stop status trigger */}
        <div className="flex justify-between items-center px-4 py-1 z-20">
          <button
            type="button"
            onClick={() => setShowCommuteModal(true)}
            className="text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
          >
            <Repeat className="w-3.5 h-3.5" />
            {multiStops.length > 0 ? `${multiStops.length} Extra Stops Added` : '+ Add Multi-Stop / Commute'}
          </button>

          <button
            type="button"
            onClick={handleSwap}
            className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-emerald-500 hover:text-white text-slate-500 border border-slate-200 dark:border-slate-700 transition-all shadow-sm flex items-center gap-1 px-2.5 text-[10px] font-bold"
            title="Swap Pickup and Dropoff"
          >
            <ArrowRightLeft className="w-3 h-3 rotate-90" />
            <span>Swap Points</span>
          </button>
        </div>

        {/* Dropoff Selector (Going To) */}
        <div className="z-20">
          <SmartLocationAutocomplete
            id="passenger-dropoff-search"
            label="Going To (Destination)"
            placeholder="Search destination (Mansoor, Egal Airport, Suuqa Barta, Dahabshiil...)"
            pointType="dropoff"
            selectedLocation={dropoffLocation}
            onSelectLocation={(loc) => setDropoffLocation(loc)}
            onOpenMapPin={() => onSelectMapPin('dropoff')}
            isMapPinning={selectableMode === 'dropoff'}
          />
        </div>

        {/* Quick Destination Presets Row */}
        <div className="pt-2 flex items-center space-x-1.5 overflow-x-auto text-xs no-scrollbar">
          <span className="text-[10px] font-bold text-slate-400 shrink-0 uppercase">Going to:</span>
          {[
            { label: '✈️ Airport', keyword: 'Airport' },
            { label: '🛒 Market', keyword: 'Market' },
            { label: '🏨 Mansoor', keyword: 'Mansoor' },
            { label: '🏢 Dahabshiil', keyword: 'Dahabshiil' },
            { label: '🎓 Uni', keyword: 'University' },
            { label: '🏠 Home', keyword: 'Guriga' },
          ].map((preset) => (
            <button
              key={preset.keyword}
              onClick={() => {
                const found = CITY_LOCATIONS.find((l) =>
                  l.name.toLowerCase().includes(preset.keyword.toLowerCase())
                );
                if (found) setDropoffLocation(found);
              }}
              className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 font-bold text-[11px] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0 transition"
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Map Location Helper Banner */}
        <div className="mt-1 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400">
            <Compass className="w-4 h-4 shrink-0 animate-spin-slow" />
            <span className="text-[11px] font-bold">
              Tap map or drag <b>Pin A / B</b> directly on map to set exact location
            </span>
          </div>
          <button
            onClick={() => onSelectMapPin('dropoff')}
            className="px-2 py-1 bg-emerald-500 text-slate-950 rounded-lg text-[10px] font-extrabold uppercase hover:bg-emerald-400 transition"
          >
            Pick on Map
          </button>
        </div>

        {/* Compact Green KM Distance Badge */}
        <div className="mt-1 flex items-center justify-between bg-slate-900 text-white rounded-xl px-3 py-2 border border-slate-800">
          <div className="flex items-center space-x-2">
            <Navigation className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs font-extrabold text-white">{distanceKm.toFixed(1)} km Road Distance</span>
          </div>
          <span className="bg-emerald-500 text-slate-950 font-black text-xs px-2.5 py-0.5 rounded-full shadow-sm">
            ~{durationMins} mins
          </span>
        </div>
      </div>

      {/* Smart Pooling & Seat Options (If Shared Taxi selected) */}
      {selectedCategory === 'wadaage_share' && (
        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 rounded-2xl space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-900 dark:text-emerald-300">
            <div className="flex items-center space-x-1.5">
              <Users className="w-4 h-4 text-emerald-500" />
              <span>Wadaage Share Matching</span>
            </div>
            <button
              onClick={() => setShowShareInfoModal(true)}
              className="text-[11px] font-extrabold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-lg border border-emerald-500/20"
            >
              <Info className="w-3.5 h-3.5" />
              <span>How Share Works & Rules</span>
            </button>
          </div>

          {/* Multi-Tier Shared Pricing: Wait & Save vs Express */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
              Match Speed & Fare Tier:
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setWaitAndSaveTier('express')}
                className={`p-2.5 rounded-xl border text-left transition ${
                  waitAndSaveTier === 'express'
                    ? 'bg-emerald-500 text-slate-950 border-emerald-600 font-extrabold shadow-sm'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black">⚡ Express Match</span>
                  <span className="text-[10px] font-bold opacity-80">1-3 min</span>
                </div>
                <p className="text-[10px] mt-0.5 opacity-90 leading-tight">
                  Immediate dispatch with lowest waiting time.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setWaitAndSaveTier('wait_and_save')}
                className={`p-2.5 rounded-xl border text-left transition relative ${
                  waitAndSaveTier === 'wait_and_save'
                    ? 'bg-emerald-500 text-slate-950 border-emerald-600 font-extrabold shadow-sm'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span className="absolute -top-2 right-2 bg-amber-500 text-slate-950 text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase shadow">
                  SAVE 60% TOTAL
                </span>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black">⏳ Wait & Save</span>
                  <span className="text-[10px] font-bold text-amber-900 dark:text-amber-300">+5-8 min</span>
                </div>
                <p className="text-[10px] mt-0.5 opacity-90 leading-tight">
                  Flex matching window for extra 20% discount.
                </p>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setPoolingType('door_to_door')}
              className={`p-2 rounded-xl border text-xs text-left font-semibold transition ${
                poolingType === 'door_to_door'
                  ? 'bg-emerald-500 text-slate-950 border-emerald-600 font-extrabold shadow-sm'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              🚪 Door-to-Door Pool
            </button>

            <button
              onClick={() => setPoolingType('express_pool')}
              className={`p-2 rounded-xl border text-xs text-left font-semibold transition ${
                poolingType === 'express_pool'
                  ? 'bg-emerald-500 text-slate-950 border-emerald-600 font-extrabold shadow-sm'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              ⚡ Express Pool (-15% Extra)
            </button>
          </div>

          {/* Wadaage Pink: Gender Matching for Wadaage Share */}
          <div className="p-2.5 bg-pink-500/10 border border-pink-500/30 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-pink-500 text-white flex items-center justify-center font-bold">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="font-extrabold text-xs text-pink-700 dark:text-pink-300 block">
                  Wadaage Pink (SheCab)
                </span>
                <span className="text-[10px] text-slate-500 block">
                  Female-only matched drivers & co-passengers
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setGenderPreference(genderPreference === 'female_only' ? 'any' : 'female_only')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                genderPreference === 'female_only' ? 'bg-pink-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  genderPreference === 'female_only' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Wadaage Share Rider Rules Quick Badges */}
          <div className="bg-white/80 dark:bg-slate-900/80 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 text-[11px] space-y-1.5">
            <div className="flex items-center justify-between text-slate-700 dark:text-slate-200 font-semibold">
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-extrabold">
                <Check className="w-3.5 h-3.5" />
                30% Fixed Upfront Fare & Fallback Guarantee
              </span>
              <span className="text-slate-400">Max 2 Stops</span>
            </div>
            <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
              <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">📍 1.0 km Max Same Place Radius</span>
              <span className="flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400">🛡️ Live Share: Driver 0.5km / En route</span>
              <span className="flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">🧭 &lt;30° Direction Vector Match</span>
              <span className="flex items-center gap-1 font-semibold text-teal-600 dark:text-teal-400">⏱️ 60-90s Matching Window Buffer</span>
              <span className="flex items-center gap-1">⏱️ Driver waits max 3 mins</span>
              <span className="flex items-center gap-1">🧳 1 Small bag / seat limit</span>
            </div>
          </div>

          {/* Flexible Seats Picker (Max 2 seats per booking rule for Wadaage Share) */}
          <div className="flex items-center justify-between text-xs pt-0.5">
            <div>
              <span className="font-bold text-slate-700 dark:text-slate-300 block">Seats Needed:</span>
              <span className="text-[10px] text-slate-400 block">(Max 1 extra friend allowed)</span>
            </div>
            <div className="flex bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
              {[1, 2].map((s) => (
                <button
                  key={s}
                  onClick={() => setSeatsBooked(s)}
                  className={`px-3.5 py-1 rounded-md text-xs font-extrabold transition ${
                    seatsBooked === s
                      ? 'bg-emerald-500 text-slate-950'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {s} {s === 1 ? 'Seat (You)' : 'Seats (+1 Friend)'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Gender-Based Matching Selector */}
      <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
        <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
          <UserCheck className="w-4 h-4 text-purple-500" />
          <span>Driver Preference:</span>
        </div>
        <select
          value={genderPreference}
          onChange={(e) => setGenderPreference(e.target.value as 'any' | 'female_only')}
          className="bg-transparent font-bold text-slate-900 dark:text-white outline-none cursor-pointer text-xs"
        >
          <option value="any" className="dark:bg-slate-900">Any Verified Driver</option>
          <option value="female_only" className="dark:bg-slate-900">Female Driver / SheCab Option 🛡️</option>
        </select>
      </div>

      {/* Ride Category Selector */}
      <div>
        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
          Select Vehicle Type
        </label>
        <div className="grid grid-cols-1 gap-2">
          {categories.map((cat) => {
            const detail = VEHICLE_CATEGORY_DETAILS[cat];
            const isSelected = selectedCategory === cat;
            const fare = computeFare(
              cat,
              distanceKm,
              durationMins,
              pricing,
              seatsBooked,
              poolingType,
              waitAndSaveTier
            ).finalFare;

            return (
              <div
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                  isSelected
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 shadow-md ring-1 ring-emerald-500'
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`p-2.5 rounded-xl ${
                      isSelected
                        ? 'bg-emerald-500 text-white'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {getCategoryIcon(cat)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-xs text-slate-900 dark:text-white">{detail.name}</span>
                      {cat === 'wadaage_share' && (
                        <span className="bg-emerald-500 text-slate-950 text-[9px] font-extrabold px-1.5 py-0.2 rounded uppercase">
                          {waitAndSaveTier === 'wait_and_save' ? 'SAVE 60%' : 'SAVE 50%'}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{detail.desc}</p>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      ETA ~{detail.etaMins} mins • {detail.capacityStr}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {activePass && cat === 'wadaage_share' ? (
                      <span className="text-teal-600 dark:text-teal-400 font-black flex items-center gap-1 justify-end">
                        <Ticket className="w-3.5 h-3.5" /> Pass ($0.00)
                      </span>
                    ) : (
                      formatCurrency(fare)
                    )}
                  </div>
                  {pricing.currentSurgeMultiplier > 1.0 && (
                    <div className="text-[10px] text-amber-500 font-semibold flex items-center justify-end space-x-0.5">
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>{pricing.currentSurgeMultiplier}x Surge</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dynamic Fare Splitting Trigger */}
      <button
        onClick={() => setShowSplitModal(true)}
        className="p-2.5 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/40 rounded-xl text-xs text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-between hover:bg-indigo-100 transition"
      >
        <span className="flex items-center gap-2">
          <Users className="w-4 h-4 text-indigo-500" />
          <span>Dynamic Fare Splitting</span>
        </span>
        <span className="text-[10px] bg-indigo-500 text-white px-2 py-0.5 rounded-full">
          {splitFareWith.length > 0 ? `${splitFareWith.length + 1} People Splitting` : '+ Invite Friends'}
        </span>
      </button>

      {/* Ride Options & Preferences Drawer */}
      <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
        <button
          onClick={() => setShowOptions(!showOptions)}
          className="w-full flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 py-1"
        >
          <span className="flex items-center space-x-1.5">
            <Volume2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Comfort Preferences & Options</span>
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform ${showOptions ? 'rotate-180' : ''}`} />
        </button>

        {showOptions && (
          <div className="mt-2.5 grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rideOptions.quietRide}
                onChange={(e) => setRideOptions({ ...rideOptions, quietRide: e.target.checked })}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-slate-700 dark:text-slate-300">Quiet Ride (No Chat)</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rideOptions.acHigh}
                onChange={(e) => setRideOptions({ ...rideOptions, acHigh: e.target.checked })}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-slate-700 dark:text-slate-300">Strong AirCon</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rideOptions.extraLuggage}
                onChange={(e) => setRideOptions({ ...rideOptions, extraLuggage: e.target.checked })}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-slate-700 dark:text-slate-300">Trunk Luggage Space</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rideOptions.petFriendly}
                onChange={(e) => setRideOptions({ ...rideOptions, petFriendly: e.target.checked })}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-slate-700 dark:text-slate-300">Pet Friendly</span>
            </label>
          </div>
        )}
      </div>

      {/* Promo Code & Payment Method */}
      <div className="border-t border-slate-100 dark:border-slate-800 pt-3 space-y-3">
        {/* Promo Input */}
        <div>
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Enter Promo Code (e.g. SHARE30)"
                value={promoInput}
                onChange={(e) => setPromoInput(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 pl-8 pr-3 py-1.5 text-xs rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none uppercase font-semibold"
              />
            </div>
            {appliedPromo ? (
              <button
                onClick={removePromoCode}
                className="px-3 py-1.5 bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 rounded-xl text-xs font-semibold hover:bg-rose-200"
              >
                Remove
              </button>
            ) : (
              <button
                onClick={() => {
                  if (promoInput) applyPromoCode(promoInput);
                }}
                className="px-3.5 py-1.5 bg-slate-900 dark:bg-slate-800 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition-all"
              >
                Apply
              </button>
            )}
          </div>

          {appliedPromo && (
            <div className="mt-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center space-x-1">
              <Check className="w-3.5 h-3.5" />
              <span>
                Promo applied: <b>{appliedPromo.code}</b> ({appliedPromo.description})
              </span>
            </div>
          )}
          {promoError && <p className="mt-1 text-xs text-rose-500 font-semibold">{promoError}</p>}
        </div>

        {/* Somaliland Mobile App Quick Summary Pills */}
        <div className="grid grid-cols-3 gap-2 text-center py-2 border-t border-slate-100 dark:border-slate-800">
          <div className="bg-emerald-500/10 dark:bg-emerald-950/40 p-2 rounded-xl border border-emerald-500/30">
            <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Lacag / Payment</p>
            <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 capitalize">
              💵 Lacag Cash (SOS)
            </p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/80 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Cel. / Arrival</p>
            <p className="text-xs font-black text-slate-900 dark:text-white">1 - 3 min</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/80 p-2 rounded-xl border border-slate-200 dark:border-slate-700">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Kuraasta / Seats</p>
            <p className="text-xs font-black text-slate-900 dark:text-white">1-4 Qof</p>
          </div>
        </div>

        {/* Who Will Seat? Toggle & Booking Options */}
        <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-500" />
              <span>Who will seat? (Kuraasda cida fadhiyaysa)</span>
            </span>
            <button
              onClick={() => setShowFareInfoModal(true)}
              className="text-[11px] font-extrabold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
            >
              <Info className="w-3.5 h-3.5" />
              <span>Fare Quote Info</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setWhoWillSeat('myself')}
              className={`py-2 px-3 rounded-xl border text-center font-bold transition ${
                whoWillSeat === 'myself'
                  ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-sm'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              👤 Myself
            </button>
            <button
              type="button"
              onClick={() => setWhoWillSeat('someone_else')}
              className={`py-2 px-3 rounded-xl border text-center font-bold transition ${
                whoWillSeat === 'someone_else'
                  ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-sm'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              👥 Someone Else
            </button>
          </div>

          {whoWillSeat === 'someone_else' && (
            <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
              <input
                type="text"
                placeholder="Passenger Name (e.g. Hodan)"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 font-semibold text-slate-900 dark:text-white outline-none focus:border-amber-500"
              />
              <input
                type="text"
                placeholder="Phone (e.g. +252 63 4110022)"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-2 font-semibold text-slate-900 dark:text-white outline-none focus:border-amber-500"
              />
            </div>
          )}

          {/* Book by Bid Option Toggle */}
          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs font-bold">
            <span className="text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-purple-500" />
              <span>Enable Driver Bidding (Dalabka Bidding)</span>
            </span>
            <button
              type="button"
              onClick={() => setIsBookByBid(!isBookByBid)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isBookByBid ? 'bg-purple-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isBookByBid ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {isBookByBid && (
            <div className="p-2.5 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 rounded-xl space-y-1.5 text-xs">
              <div className="flex items-center justify-between font-bold text-purple-900 dark:text-purple-300">
                <span>Offer Your Target Price:</span>
                <span className="font-mono text-purple-600 dark:text-purple-400">
                  ${targetBidPrice || estimatedTotal.toFixed(2)} USD (
                  {Math.round((targetBidPrice || estimatedTotal) * 11250).toLocaleString()} SLSH)
                </span>
              </div>
              <input
                type="range"
                min={Math.max(1.5, Math.round((estimatedTotal * 0.7) * 10) / 10)}
                max={Math.round((estimatedTotal * 1.5) * 10) / 10}
                step={0.5}
                value={targetBidPrice || estimatedTotal}
                onChange={(e) => setTargetBidPrice(parseFloat(e.target.value))}
                className="w-full accent-purple-600 cursor-pointer"
              />
              <p className="text-[10px] text-purple-700 dark:text-purple-300 font-medium">
                Nearby drivers will bid their best price and vehicle choices for you to accept.
              </p>
            </div>
          )}
        </div>

        {/* Payment Method Display (Enforced Cash Only) */}
        <div className="flex items-center justify-between bg-emerald-500/10 dark:bg-emerald-950/30 p-3 rounded-xl border border-emerald-500/30">
          <div className="flex items-center space-x-2 w-full">
            <Wallet className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 shrink-0">Bixinta (Payment):</span>
            <div className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
              💵 Cash on Arrival (Lacag Gacanta - Somaliland Shilling)
            </div>
          </div>
        </div>
      </div>

      {/* Final Action DALBO HADDA / BOOK NOW Button */}
      <div className="pt-2">
        <button
          disabled={isSubmitting}
          onClick={() => {
            if (isSubmitting) return;
            setIsSubmitting(true);
            bookRide(
              'cash',
              whoWillSeat === 'someone_else' ? { name: recipientName, phone: recipientPhone } : undefined,
              isBookByBid,
              targetBidPrice || estimatedTotal
            );
            setTimeout(() => setIsSubmitting(false), 2500);
          }}
          className={`w-full font-black text-base py-4 px-6 rounded-2xl shadow-xl transition-all flex items-center justify-center space-x-3 uppercase tracking-wider ${
            isSubmitting
              ? 'bg-slate-400 cursor-not-allowed text-slate-700 opacity-80'
              : 'bg-gradient-to-r from-emerald-500 via-emerald-600 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white shadow-emerald-500/30 active:scale-[0.98] border border-emerald-400/40'
          }`}
        >
          {isSubmitting ? (
            <span className="flex items-center space-x-2">
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span>DALBANAYAA... (REQUESTING...)</span>
            </span>
          ) : (
            <span className="flex items-center space-x-3">
              <span className="text-xl">🚗</span>
              <span>{isBookByBid ? 'REQUEST DRIVER BIDS NOW' : 'DALBO HADDA (BOOK RIDE NOW)'}</span>
              <span className="text-xl">➔</span>
            </span>
          )}
        </button>
        <p className="text-[10px] text-center text-slate-400 mt-2 flex items-center justify-center space-x-1">
          <Shield className="w-3 h-3 text-emerald-500" />
          <span>Somaliland Fleet Security & Live Driver Tracking</span>
        </p>
      </div>

      {/* Itemized Fare Info Breakdown Modal */}
      {showFareInfoModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Receipt className="w-4 h-4 text-emerald-500" />
                <span>Fare Quote Breakdown</span>
              </h3>
              <button
                onClick={() => setShowFareInfoModal(false)}
                className="p-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Base Fare ({VEHICLE_CATEGORY_DETAILS[selectedCategory]?.name}):</span>
                <span className="font-bold text-slate-900 dark:text-white">${currentFareDetails.baseFare.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Distance ({distanceKm} km):</span>
                <span className="font-bold text-slate-900 dark:text-white">${currentFareDetails.distanceFare.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">Estimated Duration ({durationMins} mins):</span>
                <span className="font-bold text-slate-900 dark:text-white">${currentFareDetails.timeFare.toFixed(2)}</span>
              </div>
              {currentFareDetails.surgeMultiplier > 1.0 && (
                <div className="flex justify-between py-1 text-amber-600 font-bold">
                  <span>Surge Multiplier:</span>
                  <span>{currentFareDetails.surgeMultiplier}x</span>
                </div>
              )}
              {promoDiscount > 0 && (
                <div className="flex justify-between py-1 text-emerald-600 font-bold">
                  <span>Promo Code Discount:</span>
                  <span>-${promoDiscount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-t border-slate-200 dark:border-slate-700 text-sm font-black text-slate-900 dark:text-white">
                <span>Total Quote:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                  ${estimatedTotal.toFixed(2)} USD ({Math.round(estimatedTotal * 11250).toLocaleString()} SLSH)
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-[11px] text-slate-500 space-y-1">
              <p>• Wadaage Share: $0.40 USD / 4,500 SLSH per km.</p>
              <p>• Normal Taxi: $0.80 USD / 9,000 SLSH per km.</p>
              <p>• Exchange Rate Fixed: $0.80 USD = 9,000 Somaliland Shillings (1 USD = 11,250 SLSH).</p>
            </div>

            <button
              onClick={() => setShowFareInfoModal(false)}
              className="w-full py-2.5 bg-emerald-500 text-slate-950 font-black rounded-xl text-xs uppercase"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Render Modals */}
      <VoiceBookingModal isOpen={showVoiceModal} onClose={() => setShowVoiceModal(false)} />
      <UssdOfflineBookingModal isOpen={showUssdModal} onClose={() => setShowUssdModal(false)} />
      <FareSplitModal isOpen={showSplitModal} onClose={() => setShowSplitModal(false)} />
      <CommuteSubscriptionModal isOpen={showCommuteModal} onClose={() => setShowCommuteModal(false)} />
      <IntercityBookingModal isOpen={showIntercityModal} onClose={() => setShowIntercityModal(false)} />
      {showShareInfoModal && <WadaageShareInfoModal onClose={() => setShowShareInfoModal(false)} />}
    </div>
  );
};
