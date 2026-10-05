import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRightLeft,
  Battery,
  Bike,
  Car,
  Clock,
  Compass,
  CreditCard,
  Gift,
  MapPin,
  Menu,
  MoreVertical,
  MessageSquare,
  Navigation,
  PhoneCall,
  Power,
  Search,
  ShieldAlert,
  Signal,
  Star,
  User,
  Users,
  Volume2,
  Wallet,
  Wifi,
  X,
  Edit3,
  Tag,
  FileText,
} from 'lucide-react';
import { useRide } from '../../context/RideContext';
import { UnifiedMap } from '../Map/UnifiedMap';
import { calculateDistanceKm, calculateDurationMins, computeFare, formatCurrency, EXCHANGE_RATE_USD_TO_SLSH } from '../../utils/geo';
import { CITY_LOCATIONS } from '../../data/mockData';
import { UserRole } from '../../types';
import { AppInfoWalletModal } from '../Common/AppInfoWalletModal';
import { SmartLocationAutocomplete } from '../Passenger/SmartLocationAutocomplete';
import { WadaageLogo } from '../Common/WadaageLogo';
import { sounds } from '../../utils/audio';
import { notificationService } from '../../services/notificationService';

interface MobileAppFrameProps {
  onOpenSafetyModal: () => void;
  forcedRole?: UserRole;
  titleLabel?: string;
}

export const MobileAppFrame: React.FC<MobileAppFrameProps> = ({ onOpenSafetyModal, forcedRole, titleLabel }) => {
  const {
    role: contextRole,
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
    bookRide,
    cancelRide,
    currentRide,
    driverModeOnline,
    toggleDriverOnline,
    incomingDriverRequest,
    acceptRideByDriver,
    declineRideByDriver,
    advanceDriverRideState,
    t,
  } = useRide();

  const role = forcedRole || contextRole;

  const [paymentMethod] = useState<'cash'>('cash');
  const [mapPinMode, setMapPinMode] = useState<'pickup' | 'dropoff' | null>(null);

  // Custom address writing states
  const [isCustomPickup, setIsCustomPickup] = useState(false);
  const [customPickupText, setCustomPickupText] = useState('');
  const [isCustomDropoff, setIsCustomDropoff] = useState(false);
  const [customDropoffText, setCustomDropoffText] = useState('');

  // Driver notes & profile state
  const [driverNote, setDriverNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [profileType, setProfileType] = useState<'Personal' | 'Business'>('Personal');
  const [showInfoModal, setShowInfoModal] = useState(false);

  const distanceKm = calculateDistanceKm(
    pickupLocation.lat,
    pickupLocation.lng,
    dropoffLocation.lat,
    dropoffLocation.lng
  );
  const durationMins = calculateDurationMins(distanceKm);
  const currentFare = computeFare(selectedCategory, distanceKm, durationMins, pricing);

  // Swap pickup & dropoff
  const handleSwapLocations = () => {
    const temp = pickupLocation;
    setPickupLocation(dropoffLocation);
    setDropoffLocation(temp);
  };

  const handleApplyCustomPickup = () => {
    if (customPickupText.trim()) {
      setPickupLocation({
        id: 'custom_pickup_' + Date.now(),
        name: customPickupText,
        address: customPickupText,
        lat: pickupLocation.lat + 0.001,
        lng: pickupLocation.lng + 0.001,
        category: 'custom',
      });
      setIsCustomPickup(false);
    }
  };

  const handleApplyCustomDropoff = () => {
    if (customDropoffText.trim()) {
      setDropoffLocation({
        id: 'custom_dropoff_' + Date.now(),
        name: customDropoffText,
        address: customDropoffText,
        lat: dropoffLocation.lat + 0.005,
        lng: dropoffLocation.lng + 0.005,
        category: 'custom',
      });
      setIsCustomDropoff(false);
    }
  };

  return (
    <div className="flex justify-center items-center py-2 sm:py-6 bg-slate-950/60 min-h-[700px]">
      {/* Smartphone Device Body Outer Shell */}
      <div className="relative w-full max-w-[390px] h-[800px] bg-slate-900 rounded-[48px] p-3 shadow-2xl border-[10px] border-slate-800 ring-1 ring-slate-700/50 flex flex-col overflow-hidden selection:bg-emerald-500">

        {/* Dynamic Notch & Status Bar */}
        <div className="absolute top-0 left-0 right-0 z-40 bg-[#00B14F] pt-2.5 pb-2 px-4 flex justify-between items-center text-white text-xs font-semibold">
          {/* Clock or Title Badge */}
          {titleLabel ? (
            <span className="bg-slate-950 text-emerald-400 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wide shadow">
              {titleLabel}
            </span>
          ) : (
            <span className="font-bold text-[13px] tracking-tight">12:30</span>
          )}

          {/* Center Camera Punchhole Notch */}
          <div className="w-20 h-4 bg-slate-950 rounded-full border border-slate-800 flex items-center justify-center">
            <div className="w-2.5 h-2.5 bg-slate-900 rounded-full border border-slate-800"></div>
          </div>

          {/* Indicators */}
          <div className="flex items-center space-x-1.5 text-white">
            <Signal className="w-3.5 h-3.5" />
            <Wifi className="w-3.5 h-3.5" />
            <Battery className="w-4 h-4 fill-white" />
          </div>
        </div>

        {/* Wadaage Brand Header */}
        <div className="relative z-30 bg-[#06172e] text-white pt-8 pb-2.5 px-3 flex items-center justify-between shadow-md border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowInfoModal(true)}
              className="p-1.5 rounded-xl hover:bg-white/10 bg-white/5 border border-white/10 transition flex items-center space-x-1"
              title="App & Driver Wallet Info (3 Dots Menu)"
            >
              <Menu className="w-4 h-4 text-white" />
            </button>
            <WadaageLogo variant="icon" size="xs" />
            <WadaageLogo variant="wordmark" size="xs" />
          </div>

          <div className="flex items-center space-x-2">
            {role !== 'passenger' && (
              <button
                onClick={() => setShowInfoModal(true)}
                className="bg-emerald-700/60 border border-emerald-400/40 text-white text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1 hover:bg-emerald-600 transition"
              >
                <Wallet className="w-3.5 h-3.5 text-amber-300" />
                <span>Wallet Info</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile View Container - Live Map Background */}
        <div className="relative flex-1 rounded-b-[36px] overflow-hidden bg-slate-950 flex flex-col">

          {/* Map Layer (Full Bleed - Google Maps Live) */}
          <div className="absolute inset-0 z-0">
            <UnifiedMap height="100%" showSurgeHeatmap={role === 'driver'} selectableMode={mapPinMode} />
          </div>

          {/* PASSENGER MOBILE VIEW OVERLAYS */}
          {role === 'passenger' && (
            <div className="relative z-10 flex-1 flex flex-col justify-between p-2.5 pointer-events-none">

              {/* Top Floating Location Search Card */}
              <div className="pointer-events-auto bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-2.5 space-y-2">
                {/* Pick-up Smart Autocomplete */}
                <div className="relative z-30">
                  <SmartLocationAutocomplete
                    id="mobile-pickup-search"
                    label="PICK-UP (POINT A)"
                    placeholder="Search pickup place, hotel, bank..."
                    pointType="pickup"
                    selectedLocation={pickupLocation}
                    onSelectLocation={(loc) => setPickupLocation(loc)}
                    onOpenMapPin={() => setMapPinMode((prev) => (prev === 'pickup' ? null : 'pickup'))}
                    isMapPinning={mapPinMode === 'pickup'}
                    showGpsButton={true}
                    onGpsClick={() => detectUserRealLocation()}
                    isGpsLocating={isDetectingLocation}
                  />
                </div>

                {/* Swap Row */}
                <div className="flex items-center justify-between px-1.5 z-20">
                  <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider">Hargeisa Route</span>
                  <button
                    type="button"
                    onClick={handleSwapLocations}
                    className="flex items-center gap-1 text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md hover:bg-emerald-500 hover:text-white transition"
                    title="Swap Pick-up (A) & Drop-off (B)"
                  >
                    <ArrowRightLeft className="w-2.5 h-2.5 rotate-90" />
                    <span>Swap A/B</span>
                  </button>
                </div>

                {/* Drop-off Smart Autocomplete */}
                <div className="relative z-20">
                  <SmartLocationAutocomplete
                    id="mobile-dropoff-search"
                    label="DROP-OFF (POINT B)"
                    placeholder="Search destination, airport, market..."
                    pointType="dropoff"
                    selectedLocation={dropoffLocation}
                    onSelectLocation={(loc) => setDropoffLocation(loc)}
                    onOpenMapPin={() => setMapPinMode((prev) => (prev === 'dropoff' ? null : 'dropoff'))}
                    isMapPinning={mapPinMode === 'dropoff'}
                  />
                </div>

                {/* Sub-Option Grid: Row 1 (Personal | Cash | Now), Row 2 (Promo | Notes) */}
                <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-slate-800 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 text-[11px] font-extrabold">
                  <div className="p-2 flex items-center justify-center">
                    <select
                      value={profileType}
                      onChange={(e) => setProfileType(e.target.value as any)}
                      className="bg-transparent text-slate-700 dark:text-slate-300 font-bold outline-none cursor-pointer"
                    >
                      <option value="Personal">👤 Personal</option>
                      <option value="Business">🏢 Business</option>
                    </select>
                  </div>

                  <div className="p-2 flex items-center justify-center text-slate-800 dark:text-slate-200 font-bold">
                    <span className="flex items-center gap-1">
                      💵 Cash Only (SLSH / USD)
                    </span>
                  </div>

                  <div className="p-2 flex items-center justify-center text-slate-700 dark:text-slate-300">
                    <span className="flex items-center gap-1 cursor-pointer">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Now</span>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 divide-x divide-slate-100 dark:divide-slate-800 bg-slate-50/60 dark:bg-slate-900/60 text-[11px] font-extrabold">
                  <div className="p-2 flex items-center justify-center text-slate-700 dark:text-slate-300">
                    <button onClick={() => setShowInfoModal(true)} className="flex items-center gap-1 font-bold">
                      <Tag className="w-3.5 h-3.5 text-slate-400" />
                      <span>Promo</span>
                    </button>
                  </div>

                  <div className="p-2 flex items-center justify-center text-slate-700 dark:text-slate-300">
                    <button onClick={() => setShowNoteInput(!showNoteInput)} className="flex items-center gap-1 font-bold">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      <span>{driverNote ? 'Note Added' : 'Notes to driver'}</span>
                    </button>
                  </div>
                </div>

                {/* Map Pin Selection Active Mode Banner */}
                {mapPinMode === 'pickup' && (
                  <div className="bg-blue-600 text-white p-2 text-center text-[10px] font-black animate-pulse flex items-center justify-center gap-1">
                    <span>🔵 Tap anywhere on Hargeisa map to set Pickup (Point A) / Qabso Barta Sooquadashada</span>
                  </div>
                )}
                {mapPinMode === 'dropoff' && (
                  <div className="bg-emerald-600 text-white p-2 text-center text-[10px] font-black animate-pulse flex items-center justify-center gap-1">
                    <span>🟢 Tap anywhere on Hargeisa map to set Dropoff (Point B) / Qabso Barta Ugu Dambaysa</span>
                  </div>
                )}

                {/* Driver Note Expandable Field */}
                {showNoteInput && (
                  <div className="p-2 bg-slate-100 dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
                    <input
                      type="text"
                      placeholder="Notes to driver / Qoraal darawalka (e.g. Wait near Jigjiga Yar gate)"
                      value={driverNote}
                      onChange={(e) => setDriverNote(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-bold px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 outline-none"
                    />
                  </div>
                )}
              </div>

              {/* FLOATING GREEN 'BOOK' CIRCLE CTA BUTTON ON MAP */}
              {!currentRide && (
                <div className="pointer-events-auto flex justify-end pr-2 my-2">
                  <button
                    onClick={() => bookRide('cash')}
                    className="w-16 h-16 rounded-full bg-[#00B14F] hover:bg-emerald-600 text-white font-black text-xs shadow-2xl ring-4 ring-emerald-500/30 flex flex-col items-center justify-center space-y-0.5 active:scale-95 transition-all uppercase"
                  >
                    <span>BOOK</span>
                    <span className="text-[9px] font-mono opacity-90">{formatCurrency(currentFare.finalFare)}</span>
                  </button>
                </div>
              )}

              {/* SEARCHING REQUEST OVERLAY ("Processing Request / Raadinta Darawalka") */}
              {currentRide && currentRide.status === 'searching' && (
                <div className="pointer-events-auto bg-[#00B14F] text-white rounded-3xl p-5 shadow-2xl flex flex-col items-center justify-between text-center space-y-4 animate-fadeIn">
                  <div className="relative flex items-center justify-center my-2">
                    <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center animate-ping absolute"></div>
                    <div className="w-16 h-16 rounded-full bg-white text-[#00B14F] flex items-center justify-center shadow-xl z-10">
                      <MapPin className="w-8 h-8 animate-bounce" />
                    </div>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-lg text-white">Processing Request (Hadda Waa La Raadinayaa)</h3>
                    <p className="text-xs text-white/90">Searching for nearest driver match...</p>
                  </div>

                  {/* Route & Fare Breakdown Card */}
                  <div className="bg-white text-slate-900 rounded-2xl p-3 w-full text-left space-y-2 text-xs shadow">
                    <div className="space-y-1 border-b border-slate-100 pb-2">
                      <p className="text-[10px] text-blue-600 font-black uppercase">PICKUP (SOO QAADIS):</p>
                      <p className="font-bold text-slate-800 truncate">{currentRide.pickup?.name || 'Pickup Location'}</p>
                      <p className="text-[10px] text-emerald-600 font-black uppercase pt-1">DROPOFF (DHIGID):</p>
                      <p className="font-bold text-slate-800 truncate">{currentRide.dropoff?.name || 'Dropoff Destination'}</p>
                    </div>

                    <div className="flex items-center justify-between font-black text-sm pt-1">
                      <span>Fare / Qiimaha: <span className="text-[#00B14F] font-mono">{formatCurrency(Number(currentRide.totalFare) || 0)}</span></span>
                      <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-[#00B14F] px-2 py-0.5 rounded font-extrabold">💵 {(currentRide.paymentMethod || 'cash').toUpperCase()}</span>
                    </div>

                    <div className="text-[10px] text-slate-500 flex justify-between border-t border-slate-100 pt-1">
                      <span>Rate: <b>{currentRide.category === 'wadaage_share' ? '9,000 SLSH ($0.90) 1st km, then 4,000 SLSH ($0.40)/km' : '12,000 SLSH ($1.20) 1st km, then 7,000 SLSH ($0.70)/km'}</b></span>
                      <span>Distance: <b>{currentRide.distanceKm} km</b></span>
                    </div>
                  </div>

                  <button
                    onClick={cancelRide}
                    className="w-full bg-white/20 hover:bg-white/30 text-white font-extrabold text-xs py-2.5 rounded-xl border border-white/40 uppercase tracking-wider"
                  >
                    CANCEL RIDE / BAX (5s)
                  </button>
                </div>
              )}

              {/* Bottom Sheet Controls / Vehicle Category Selection Bar */}
              {!currentRide ? (
                <div className="pointer-events-auto bg-white dark:bg-slate-900 rounded-3xl p-3 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-2">

                  {/* Category Selection Carousel */}
                  <div className="flex justify-between items-center px-1 overflow-x-auto no-scrollbar gap-2">

                    {/* Wadaage Share Option */}
                    <button
                      onClick={() => setSelectedCategory('wadaage_share')}
                      className={`flex flex-col items-center space-y-1 p-1.5 rounded-2xl transition-all shrink-0 ${
                        selectedCategory === 'wadaage_share'
                          ? 'bg-emerald-500/15 border-2 border-[#00B14F]'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      <div className="relative">
                        <span className="absolute -top-2 -right-2 bg-emerald-600 text-white text-[8px] font-black px-1 rounded-full uppercase">
                          Save 50%
                        </span>
                        <div className="w-11 h-11 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-[#00B14F] flex items-center justify-center font-bold">
                          <Users className="w-6 h-6" />
                        </div>
                      </div>
                      <span className="text-[10px] font-extrabold text-slate-900 dark:text-white">
                        Wadaage Share
                      </span>
                      <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-mono font-black">
                        {formatCurrency(currentFare.finalFare)}
                      </span>
                    </button>

                    {/* Normal Taxi Option */}
                    <button
                      onClick={() => setSelectedCategory('wadaage_taxi')}
                      className={`flex flex-col items-center space-y-1 p-1.5 rounded-2xl transition-all shrink-0 ${
                        selectedCategory === 'wadaage_taxi' || selectedCategory === 'wadaage_car'
                          ? 'bg-emerald-500/15 border-2 border-[#008751]'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold">
                        <Car className="w-6 h-6 text-emerald-600" />
                      </div>
                      <span className="text-[10px] font-bold text-slate-900 dark:text-white">
                        Normal Taxi
                      </span>
                      <span className="text-[9px] text-slate-500 font-mono">
                        {formatCurrency(currentFare.finalFare * 1.3)}
                      </span>
                    </button>
                  </div>

                  {/* Savings Comparison Banner for Wadaage Share */}
                  {selectedCategory === 'wadaage_share' && (
                    <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-2 rounded-xl text-[10px] space-y-1 text-emerald-900 dark:text-emerald-200 font-medium">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-[#00B14F]">
                          Fare: {formatCurrency(currentFare.finalFare)} ({formatCurrency(currentFare.finalFare * 1.6)} on Wadaage Taxi)
                        </span>
                        <span className="bg-emerald-600 text-white font-black text-[9px] px-1.5 py-0.5 rounded-full">
                          Save 50%
                        </span>
                      </div>
                      <p className="text-[9.5px] text-slate-600 dark:text-slate-400">
                        Shared ride. You can only bring one more friend. / Perjumlahan wadag ah. Hal saaxiib oo kaliya ayaa kugu raaci kara.
                      </p>
                    </div>
                  )}
                </div>
              ) : currentRide.status !== 'searching' && (
                /* Active Driver Matched Card (Driver on the way) */
                <div className="pointer-events-auto bg-white dark:bg-slate-900 rounded-3xl p-3.5 shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white space-y-3">

                  {/* Top Promo Referral Banner */}
                  <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-2 rounded-xl text-xs flex items-center justify-between text-amber-900 dark:text-amber-200 font-bold">
                    <span className="flex items-center space-x-1.5">
                      <Gift className="w-4 h-4 text-amber-500 shrink-0" />
                      <span>Free Ride: Refer your friend and get $2.00 Off</span>
                    </span>
                    <button className="text-[10px] bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full uppercase font-black">
                      Invite
                    </button>
                  </div>

                  {/* ETA & Status Indicator */}
                  <div className="text-center space-y-1">
                    <h3 className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                      5 mins
                    </h3>
                    <p className="text-xs font-black text-slate-800 dark:text-slate-100">
                      Driver is on the way to pick up
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium">
                      We are looking for another rider / Waxaa la raadinayaa raaciye labaad
                    </p>
                    <p className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 pt-1">
                      {currentRide.licensePlate || 'SL 1971 UZQ'} • {currentRide.vehicleModel || 'TOYOTA PROBOX'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 pt-2">
                    <div className="flex items-center space-x-3">
                      <img
                        src={currentRide.driverAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                        alt={currentRide.driverName || 'Edward Thomas'}
                        className="w-11 h-11 rounded-full object-cover border-2 border-[#00B14F]"
                      />
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <h4 className="font-black text-xs text-slate-900 dark:text-white">
                            {currentRide.driverName || 'Edward Thomas'}
                          </h4>
                          <span className="flex items-center text-[10px] text-amber-500 font-black">
                            <Star className="w-3 h-3 fill-amber-400 mr-0.5" /> 4.9
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Direct Contact Buttons */}
                    <div className="flex items-center space-x-1.5">
                      <a
                        href="tel:+252630000000"
                        className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-full hover:bg-emerald-500 hover:text-white transition"
                        title="Call Driver"
                      >
                        <PhoneCall className="w-4 h-4" />
                      </a>
                      <button
                        onClick={onOpenSafetyModal}
                        className="p-2 bg-[#00B14F] text-white rounded-full hover:bg-emerald-600 transition"
                        title="Wadaage Chat"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Route Summary & Price Breakdown */}
                  <div className="text-[11px] space-y-1.5 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-emerald-500/20">
                    <div className="flex items-center justify-between font-black text-xs text-emerald-600 dark:text-emerald-400">
                      <span>Total Fare: ${(Number(currentRide.totalFare) || 0).toFixed(2)} USD</span>
                      <span className="text-[10px] text-slate-500">({Math.round((Number(currentRide.totalFare) || 0) * EXCHANGE_RATE_USD_TO_SLSH).toLocaleString()} SLSH)</span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500 border-t border-slate-200 dark:border-slate-700/60 pt-1">
                      <span>Rate: {currentRide.category === 'wadaage_share' ? '$0.40 / 4,500 SLSH/km' : '$0.80 / 9,000 SLSH/km'}</span>
                      <span>{currentRide.distanceKm || 0} km • {(currentRide.paymentMethod || 'cash').toUpperCase()}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-300 pt-0.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
                      <span className="truncate"><b>PICKUP:</b> {currentRide.pickup?.name || 'Pickup Location'}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-300">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                      <span className="truncate"><b>DROPOFF:</b> {currentRide.dropoff?.name || 'Dropoff Destination'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* DRIVER MOBILE VIEW OVERLAYS */}
          {role === 'driver' && (
            <div className="relative z-10 flex-1 flex flex-col justify-between p-3 pointer-events-none">

              {/* Driver Mobile Header Bar */}
              <div className="pointer-events-auto bg-slate-900/95 backdrop-blur-md rounded-2xl p-3 shadow-2xl border border-slate-800 flex items-center justify-between text-white">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
                  <div>
                    <h3 className="font-black text-xs">Jama Hassan (Driver)</h3>
                    <p className="text-[10px] text-slate-400">Wadaage Partner Fleet</p>
                  </div>
                </div>

                <button
                  onClick={() => toggleDriverOnline(!driverModeOnline)}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center space-x-1 transition-all ${
                    driverModeOnline
                      ? 'bg-[#00B14F] text-white'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{driverModeOnline ? 'ONLINE' : 'OFFLINE'}</span>
                </button>
              </div>

              {/* Driver Incoming Request or Active Ride Dispatch Sheet */}
              <div className="pointer-events-auto bg-slate-900/95 backdrop-blur-md rounded-3xl p-4 shadow-2xl border border-slate-800 text-white space-y-3">
                {incomingDriverRequest ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded uppercase animate-bounce">
                        New Trip Request
                      </span>
                      <span className="text-xs font-mono text-emerald-400 font-bold">15s Timer</span>
                    </div>

                    {/* Order Category Badge */}
                    <div className="p-2 bg-emerald-500 text-slate-950 rounded-xl font-black text-xs uppercase flex justify-between items-center">
                      <span>{incomingDriverRequest.category === 'wadaage_share' ? '👥 WADAAGE SHARE' : '🚕 WADAAGE TAXI'}</span>
                      <span className="text-[9px] bg-slate-950 text-white px-1.5 py-0.5 rounded">Order</span>
                    </div>

                    <div className="space-y-1 text-xs">
                      <p className="text-slate-300"><b>Pickup:</b> {incomingDriverRequest.pickup?.name || 'Pickup Location'}</p>
                      <p className="text-slate-300"><b>Dropoff:</b> {incomingDriverRequest.dropoff?.name || 'Dropoff Destination'}</p>
                      <p className="text-emerald-400 font-black text-sm pt-1">
                        Fare: {formatCurrency(incomingDriverRequest.totalFare)}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => {
                          notificationService.stopEmergencyOrderRingtone();
                          sounds.playButtonClick();
                          declineRideByDriver();
                        }}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 rounded-xl text-xs"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => {
                          notificationService.stopEmergencyOrderRingtone();
                          sounds.playButtonClick();
                          acceptRideByDriver();
                        }}
                        className="bg-[#00B14F] hover:bg-emerald-600 text-white font-extrabold py-2 rounded-xl text-xs"
                      >
                        Accept Trip
                      </button>
                    </div>
                  </div>
                ) : currentRide ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="bg-[#00B14F] text-white text-[10px] font-black px-2 py-0.5 rounded uppercase">
                        Status: {(currentRide.status || 'accepted').replace('_', ' ')}
                      </span>
                      <span className="bg-slate-800 text-emerald-400 text-[10px] font-extrabold px-2 py-0.5 rounded uppercase">
                        {currentRide.category === 'wadaage_share' ? '👥 Share' : '🚕 Taxi'}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                      <div className="flex justify-between items-center text-slate-300">
                        <span><b>Passenger:</b> {currentRide.passengerName || 'Wadaage Passenger'}</span>
                        <span className="text-[10px] text-amber-400 font-semibold">{currentRide.category === 'wadaage_share' ? '$0.40/km' : '$0.80/km'}</span>
                      </div>
                      <p className="text-slate-300 truncate"><b>Destination:</b> {currentRide.dropoff?.name || 'Dropoff Destination'}</p>
                      <div className="flex justify-between items-baseline pt-1 border-t border-slate-700 font-mono">
                        <span className="text-emerald-400 font-black text-sm">${(Number(currentRide.totalFare) || 0).toFixed(2)} USD</span>
                        <span className="text-slate-400 text-[10px]">({Math.round((Number(currentRide.totalFare) || 0) * EXCHANGE_RATE_USD_TO_SLSH).toLocaleString()} SLSH)</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        sounds.playButtonClick();
                        advanceDriverRideState();
                      }}
                      className="w-full bg-[#00B14F] hover:bg-emerald-600 text-white font-black py-3 rounded-xl text-xs uppercase"
                    >
                      Advance Trip Workflow
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-2 text-xs text-slate-400 space-y-1">
                    <p className="font-bold text-slate-200">
                      {driverModeOnline ? '🟢 Online - Waiting for requests...' : '🔴 Offline'}
                    </p>
                    <p className="text-[10px]">Stay near high demand surge areas for quick bookings.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <AppInfoWalletModal isOpen={showInfoModal} onClose={() => setShowInfoModal(false)} />
    </div>
  );
};
