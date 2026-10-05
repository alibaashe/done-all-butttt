import React, { useEffect, useState } from 'react';
import {
  Car,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Compass,
  MapPin,
  MessageSquare,
  Navigation,
  PhoneCall,
  Receipt,
  RotateCw,
  Share2,
  Shield,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  X,
  Zap,
  AlertTriangle,
  Radar,
} from 'lucide-react';
import { useRide } from '../../context/RideContext';
import { EXCHANGE_RATE_USD_TO_SLSH } from '../../utils/geo';
import { resolveVehicleColor } from '../../utils/vehicleColors';
import { RealisticCarGraphic } from '../Common/RealisticCarGraphic';
import { WaitingTimeMeter } from '../Common/WaitingTimeMeter';
import { CallDriverModal } from './CallDriverModal';
import { ChatModal } from './ChatModal';
import { ShareTripModal } from './ShareTripModal';
import { ColorBeaconModal } from '../Common/ColorBeaconModal';

interface ActiveRideCardProps {
  onOpenSafetyModal: () => void;
}

export const ActiveRideCard: React.FC<ActiveRideCardProps> = ({ onOpenSafetyModal }) => {
  const {
    currentRide,
    cancelRide,
    drivers,
    unreadChatCount,
    language,
    t,
    isMeterRunning,
    meterKm,
    meterSeconds,
    meterFareUsd,
    meterFareSlsh,
  } = useRide();

  const [showChat, setShowChat] = useState(false);
  const [showCall, setShowCall] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showFareBreakdown, setShowFareBreakdown] = useState(false);
  const [showBeaconModal, setShowBeaconModal] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [cancelReason, setCancelReason] = useState('Changed plans');

  // 3-Minute Pickup Countdown Timer
  const [waitSeconds, setWaitSeconds] = useState(180);

  // Local 1-second tick so the rider's taximeter clock stays smooth between driver broadcasts
  const [riderMeterSeconds, setRiderMeterSeconds] = useState(0);
  const liveMeterStartedAtMs = Number(currentRide?.liveMeterStartedAt || 0);
  useEffect(() => {
    if (!currentRide?.isLiveTaximeter || currentRide.status !== 'in_progress') return;
    const computeSeconds = () =>
      Math.max(0, Math.floor((Date.now() - Number(currentRide.liveMeterStartedAt || Date.now())) / 1000));
    setRiderMeterSeconds(computeSeconds());
    const ticker = setInterval(() => setRiderMeterSeconds(computeSeconds()), 1000);
    return () => clearInterval(ticker);
  }, [currentRide?.id, currentRide?.isLiveTaximeter, currentRide?.status, currentRide?.liveMeterStartedAt]);

  useEffect(() => {
    if (currentRide?.status === 'driver_arrived') {
      const interval = setInterval(() => {
        setWaitSeconds((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setWaitSeconds(180);
    }
  }, [currentRide?.status]);

  if (!currentRide) return null;

  const totalFare = Number(currentRide.totalFare) || 2.50;
  const totalSos = Math.round(totalFare * EXCHANGE_RATE_USD_TO_SLSH);
  const pickupName = currentRide.pickup?.name || 'Pickup Point';
  const dropoffName = currentRide.dropoff?.name || 'Destination';
  const isShare = currentRide.category === 'wadaage_share' || currentRide.isShared;

  // LIVE TAXIMETER READOUTS (Standing pickup / metered on-road taxi)
  // Rider sees exactly the same numbers as the driver: KM driven + running fare from the 12,000 SLSH flag drop
  const isLiveMeterRide = currentRide.isLiveTaximeter === true && currentRide.status === 'in_progress';
  const liveMeterKm = Math.max(0, Number(currentRide.liveTraveledKm ?? meterKm ?? 0));
  // Prefer the shared trip start timestamp so the clock keeps ticking between driver broadcasts
  const liveMeterSeconds = liveMeterStartedAtMs > 0
    ? riderMeterSeconds
    : (currentRide.liveMeterSeconds !== undefined ? Number(currentRide.liveMeterSeconds) : meterSeconds);
  // The driver app is actively reporting the meter once it has published a trip start / distance
  const isDriverMeterReporting = isMeterRunning || liveMeterStartedAtMs > 0;
  const liveMeterFareUsd = Number(currentRide.dropoffFareUsd ?? (isLiveMeterRide ? meterFareUsd : totalFare));
  const liveMeterFareSlsh = Number(
    currentRide.dropoffFareSlsh ?? (isLiveMeterRide ? meterFareSlsh : totalSos)
  );

  // 1. SEARCHING DISPATCH STATE (Modern floating card above map)
  if (currentRide.status === 'searching') {
    return (
      <div className="w-full bg-white/98 dark:bg-slate-900/98 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800/90 rounded-3xl shadow-2xl overflow-hidden p-4 space-y-3.5 select-none animate-in fade-in slide-in-from-bottom-3 duration-300">
        <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-1" />

        {/* Searching Header with Pulsing Radar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="relative flex items-center justify-center">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping absolute" />
              <span className="w-3 h-3 rounded-full bg-emerald-600 relative" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 dark:text-white text-sm">
                {language === 'so' ? 'Raadinta Darawalka Kuugu Dhow...' : 'Searching for Nearby Drivers...'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                {language === 'so' ? 'Waxa laguu dirayaa darawallada Hargeysa' : 'Connecting to closest captain in Hargeisa'}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {totalSos.toLocaleString()} SLSH
            </span>
            <span className="text-[10px] text-slate-400 block font-bold">
              (${totalFare.toFixed(2)})
            </span>
          </div>
        </div>

        {/* Dynamic Route Chips */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 text-xs space-y-1.5">
          <div className="flex items-center space-x-2 truncate">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-slate-500 text-[10px] font-bold shrink-0">{language === 'so' ? 'Ka:' : 'From:'}</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{pickupName}</span>
          </div>
          <div className="flex items-center space-x-2 truncate">
            <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
            <span className="text-slate-500 text-[10px] font-bold shrink-0">{language === 'so' ? 'Ku:' : 'To:'}</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{dropoffName}</span>
          </div>
        </div>

        {/* Linear Animated Dispatch Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600 h-full rounded-full animate-pulse w-3/4" />
        </div>

        {/* Cancel Button */}
        <button
          type="button"
          onClick={() => setShowCancelModal(true)}
          className="w-full py-2.5 bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold rounded-xl text-xs transition active:scale-95 cursor-pointer touch-manipulation flex items-center justify-center space-x-1 border border-slate-200/60 dark:border-slate-700"
        >
          <X className="w-3.5 h-3.5" />
          <span>{language === 'so' ? 'Baaji Raadinta (Cancel)' : 'Cancel Search'}</span>
        </button>

        {showCancelModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-3">
              <h4 className="font-black text-sm text-slate-900 dark:text-white">
                {language === 'so' ? 'Ma rabtaa inaad baajiso raadinta?' : 'Cancel driver search?'}
              </h4>
              <p className="text-xs text-slate-500">
                {language === 'so' ? 'Dalabkaaga waa la joojinayaa.' : 'Your ride request will be stopped.'}
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs"
                >
                  {language === 'so' ? 'Sii Sug' : 'Keep Waiting'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    cancelRide();
                    setShowCancelModal(false);
                  }}
                  className="py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs"
                >
                  {language === 'so' ? 'Haa, Baaji' : 'Confirm Cancel'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 2. ACCEPTED / DRIVER ARRIVED / IN_PROGRESS STATE
  const matchedDriver = currentRide.assignedDriverId
    ? drivers.find((d) => d.id === currentRide.assignedDriverId)
    : null;

  const driverVehicle = (matchedDriver as any)?.vehicle || {};
  const driverName =
    (currentRide as any).driver_name ||
    currentRide.driverName ||
    matchedDriver?.name ||
    'Wadaage Captain';
  const driverPhone =
    (currentRide as any).driver_phone ||
    currentRide.driverPhone ||
    matchedDriver?.phone ||
    '';
  const driverAvatar =
    (currentRide as any).driver_avatar ||
    currentRide.driverAvatar ||
    matchedDriver?.avatar ||
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80';
  const driverRating = matchedDriver?.rating || 4.9;

  const vehicleModel =
    (currentRide as any).vehicle_model ||
    currentRide.vehicleModel ||
    driverVehicle.model ||
    'Toyota Vitz';
  const vehiclePlate =
    (currentRide as any).license_plate ||
    currentRide.licensePlate ||
    driverVehicle.licensePlate ||
    'SL-4921';
  const vehicleColor =
    driverVehicle.color ||
    (matchedDriver as any)?.vehicle_color ||
    'White';

  const colorDef = resolveVehicleColor(vehicleColor);
  const waitMins = Math.floor(waitSeconds / 60);
  const waitSecs = waitSeconds % 60;

  // Status title & color accents
  const getStatusBadge = () => {
    switch (currentRide.status) {
      case 'accepted':
        return {
          title: language === 'so' ? 'Darawalku wuu soo socdaa (~3 daq)' : 'Captain is on the way (~3 mins)',
          bg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-800 dark:text-emerald-200',
          dot: 'bg-emerald-500 animate-ping',
        };
      case 'driver_arrived':
        return {
          title: language === 'so' ? 'Darawalku wuxuu joogaa goobta!' : 'Captain arrived at pickup point!',
          bg: 'bg-blue-500/15 border-blue-500/30 text-blue-800 dark:text-blue-200',
          dot: 'bg-blue-500 animate-bounce',
        };
      case 'in_progress':
        return {
          title: language === 'so' ? `Safarku wuu socdaa • ${dropoffName}` : `En route to ${dropoffName}`,
          bg: 'bg-emerald-600/15 border-emerald-500/30 text-emerald-900 dark:text-emerald-100',
          dot: 'bg-emerald-600 animate-pulse',
        };
      default:
        return {
          title: language === 'so' ? 'Safarka Wuu Socdaa' : 'Ride Active',
          bg: 'bg-slate-500/15 border-slate-500/30 text-slate-700 dark:text-slate-300',
          dot: 'bg-slate-500',
        };
    }
  };

  const statusBadge = getStatusBadge();

  return (
    <>
      {/* Sleek Mobile Bottom Sheet Container */}
      <div className="w-full bg-white/98 dark:bg-slate-900/98 backdrop-blur-xl border border-slate-200/90 dark:border-slate-800/90 rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 select-none">
        {/* Grab bar & Status Row */}
        <div className="px-4 pt-3 pb-2 border-b border-slate-100 dark:border-slate-800/80">
          <div className="w-10 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-2.5 cursor-pointer" onClick={() => setIsMinimized(!isMinimized)} />
          
          <div className="flex items-center justify-between gap-2">
            {/* Status Pill */}
            <div className={`flex items-center space-x-2 px-2.5 py-1 rounded-full border text-xs font-black min-w-0 ${statusBadge.bg}`}>
              <span className={`w-2 h-2 rounded-full shrink-0 ${statusBadge.dot}`} />
              <span className="truncate">{statusBadge.title}</span>
            </div>

            {/* Boarding Safety PIN Badge & Minimize Toggle */}
            <div className="flex items-center space-x-1.5 shrink-0">
              <div className="flex items-center space-x-1 bg-slate-900 dark:bg-slate-800 text-emerald-400 font-mono font-black text-xs px-2 py-1 rounded-xl border border-slate-700 shadow-xs" title="Share PIN with Captain">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-sans">PIN</span>
                <span>{currentRide.otpCode || '4912'}</span>
              </div>

              <button
                type="button"
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition"
                title={isMinimized ? 'Expand' : 'Collapse'}
              >
                {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* DRIVER & REAL VEHICLE CARD */}
        <div className="p-3.5 space-y-3">
          <div className="flex items-center justify-between gap-3 bg-gradient-to-br from-slate-50 to-emerald-50/30 dark:from-slate-800/60 dark:to-slate-800/90 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs">
            {/* Driver Avatar & Info */}
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="relative shrink-0">
                <img
                  src={driverAvatar}
                  alt={driverName}
                  className="w-12 h-12 rounded-full object-cover border-2 border-emerald-500 shadow-sm"
                />
                <span className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-950 font-black text-[9px] px-1 py-0.2 rounded-full border border-white dark:border-slate-900 shadow-xs flex items-center">
                  ★ {driverRating}
                </span>
              </div>

              <div className="min-w-0">
                <div className="flex items-center space-x-1.5">
                  <h4 className="font-black text-sm text-slate-900 dark:text-white truncate">
                    {driverName}
                  </h4>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                </div>

                <div className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300 font-semibold mt-0.5">
                  <span
                    className="w-2.5 h-2.5 rounded-full inline-block border border-black/20 shrink-0 shadow-2xs"
                    style={{ backgroundColor: colorDef.hex }}
                  />
                  <span className="font-bold text-slate-800 dark:text-slate-200 truncate">{vehicleModel}</span>
                  <span className="text-slate-400">•</span>
                  <span className="text-amber-600 dark:text-amber-400 font-bold">{colorDef.somaliName.split(' ')[0]}</span>
                </div>

                <div className="mt-1">
                  <span className="inline-block bg-slate-950 text-emerald-400 font-mono font-black text-[11px] px-2 py-0.5 rounded-md tracking-wider border border-slate-800 shadow-xs">
                    {vehiclePlate}
                  </span>
                </div>
              </div>
            </div>

            {/* Real Vehicle Graphic with Exact Registered Color */}
            <div className="shrink-0 flex flex-col items-end">
              <RealisticCarGraphic
                color={vehicleColor}
                model={vehicleModel}
                className="w-20 h-11"
              />
              <span className="text-[10px] font-mono font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                ${totalFare.toFixed(2)} USD
              </span>
            </div>
          </div>

          {/* 4 TOUCH-FRIENDLY CIRCULAR QUICK ACTION BUTTONS */}
          <div className="grid grid-cols-4 gap-2 text-center text-xs select-none">
            {/* 1. Phone Call */}
            <button
              type="button"
              onClick={() => {
                if (driverPhone) {
                  window.location.href = `tel:${driverPhone}`;
                } else {
                  setShowCall(true);
                }
              }}
              className="flex flex-col items-center justify-center p-2 rounded-2xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 border border-emerald-200/80 dark:border-emerald-800/80 active:scale-95 transition cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md mb-1">
                <PhoneCall className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-200">
                {language === 'so' ? 'Wac' : 'Call'}
              </span>
            </button>

            {/* 2. In-App Chat */}
            <button
              type="button"
              onClick={() => setShowChat(true)}
              className="relative flex flex-col items-center justify-center p-2 rounded-2xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/60 border border-blue-200/80 dark:border-blue-800/80 active:scale-95 transition cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-md mb-1">
                <MessageSquare className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-blue-800 dark:text-blue-200">
                {language === 'so' ? 'Fariin' : 'Chat'}
              </span>
              {unreadChatCount > 0 && (
                <span className="absolute top-1.5 right-2 w-4 h-4 bg-rose-500 text-white rounded-full text-[9px] font-black flex items-center justify-center animate-ping">
                  {unreadChatCount}
                </span>
              )}
            </button>

            {/* 3. Color Beacon (Identify in crowds) */}
            <button
              type="button"
              onClick={() => setShowBeaconModal(true)}
              className="flex flex-col items-center justify-center p-2 rounded-2xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/60 border border-amber-200/80 dark:border-amber-800/80 active:scale-95 transition cursor-pointer"
            >
              <div
                className="w-8 h-8 rounded-full text-slate-950 flex items-center justify-center shadow-md mb-1 font-black"
                style={{ backgroundColor: currentRide.beaconColor?.hex || '#F59E0B' }}
              >
                <Zap className="w-4 h-4 fill-current" />
              </div>
              <span className="text-[10px] font-bold text-amber-800 dark:text-amber-200">
                {language === 'so' ? 'Iftiin' : 'Beacon'}
              </span>
            </button>

            {/* 4. Safety & Share */}
            <button
              type="button"
              onClick={() => setShowShareModal(true)}
              className="flex flex-col items-center justify-center p-2 rounded-2xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/60 border border-purple-200/80 dark:border-purple-800/80 active:scale-95 transition cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-md mb-1">
                <Share2 className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-bold text-purple-800 dark:text-purple-200">
                {language === 'so' ? 'La Wadaag' : 'Share'}
              </span>
            </button>
          </div>

          {/* LIVE STANDING-PICKUP TAXIMETER (Rider view, mirrors the driver's digital meter) */}
          {isLiveMeterRide && (
            <div className="bg-slate-900 border-2 border-emerald-500/60 rounded-2xl p-3 text-white space-y-2.5 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                  </span>
                  <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400">
                    📟 {language === 'so' ? 'Mitirka Safarka Waa Socdaa' : 'Live Taximeter Running'}
                  </span>
                </div>
                <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full border border-slate-700">
                  ⏱️ {Math.floor(liveMeterSeconds / 60)}m {liveMeterSeconds % 60}s
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-slate-950/80 p-2.5 rounded-xl border border-slate-800">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    {language === 'so' ? 'Masaafada La Socday' : 'Distance Travelled'}
                  </span>
                  <span className="text-base font-black text-white font-mono">
                    {liveMeterKm.toFixed(2)} KM
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    {language === 'so' ? 'Qiimaha Hadda' : 'Live Fare'}
                  </span>
                  <span className="text-base font-black text-emerald-400 font-mono">
                    {liveMeterFareSlsh.toLocaleString()} SLSH
                  </span>
                  <span className="text-[10px] text-slate-400 block font-bold">
                    (${liveMeterFareUsd.toFixed(2)} USD)
                  </span>
                </div>
              </div>

              <div className="text-[9.5px] text-slate-400 flex items-center justify-between pt-0.5">
                <span>{language === 'so' ? 'KM 1aad: 12,000 SLSH ($1.20)' : '1st KM: 12,000 SLSH ($1.20)'}</span>
                <span>{language === 'so' ? 'KM dheeraad: +7,000 SLSH' : 'Extra KM: +7,000 SLSH/km'}</span>
              </div>

              <div className={`text-[9.5px] font-bold rounded-lg px-2 py-1 border ${
                isDriverMeterReporting
                  ? 'text-emerald-300 bg-emerald-950/50 border-emerald-500/30'
                  : 'text-amber-300 bg-amber-950/40 border-amber-500/30'
              }`}>
                {isDriverMeterReporting
                  ? (liveMeterKm <= 1.0
                      ? (language === 'so'
                          ? '✅ Mitirka wuu shaqeynayaa • KM 1aad waa lagu keenay 12,000 SLSH'
                          : '✅ Meter running • 1st KM included in the 12,000 SLSH flag drop')
                      : (language === 'so'
                          ? `✅ KM kasta oo dheeraad ah +7,000 SLSH • ${liveMeterKm.toFixed(2)} KM`
                          : `✅ Each extra KM adds 7,000 SLSH • ${liveMeterKm.toFixed(2)} KM driven`))
                  : (language === 'so'
                      ? '⏳ Sugaya GPS-ka darawalka...'
                      : '⏳ Waiting for driver GPS...')}
              </div>
            </div>
          )}

          {/* NORMAL TAXI WAITING TIME METER (When active or accrued) */}
          {((currentRide.waitingSeconds || 0) > 0 || currentRide.isWaitingActive) && (
            <WaitingTimeMeter isDriverView={false} />
          )}

          {/* 3-MINUTE PICKUP COUNTDOWN (When driver arrived) */}
          {currentRide.status === 'driver_arrived' && (
            <div className="bg-amber-500/15 border border-amber-500/30 p-2.5 rounded-2xl flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2 text-amber-900 dark:text-amber-200">
                <Clock className="w-4 h-4 text-amber-500 animate-spin shrink-0" />
                <span className="font-bold text-[11px]">
                  {language === 'so' ? 'Darawalku wuu ku sugayaa:' : 'Captain is waiting at gate:'}
                </span>
              </div>
              <span className="bg-slate-950 text-amber-400 font-mono font-black text-xs px-2.5 py-0.5 rounded-lg border border-amber-500/40">
                {waitMins}:{waitSecs < 10 ? `0${waitSecs}` : waitSecs}
              </span>
            </div>
          )}

          {/* EXPANDED SECTION (Route, Fare Breakdown, Cancel) */}
          {!isMinimized && (
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800 animate-in fade-in duration-200">
              {/* Route Card */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 text-xs space-y-2">
                <div className="flex items-start space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Kaqabasho (Pickup)</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100 truncate block">{pickupName}</span>
                  </div>
                </div>

                <div className="border-l-2 border-dashed border-slate-300 dark:border-slate-600 ml-1 h-3.5 my-0.5" />

                <div className="flex items-start space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500 mt-1 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Kadhigid (Dropoff)</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100 truncate block">{dropoffName}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  <span>Masaafada: <b>{currentRide.distanceKm || 2.4} km</b></span>
                  <span>Qiyaasta: <b>~{currentRide.durationMins || 10} daq</b></span>
                </div>
              </div>

              {/* Fare Summary & Accordion Breakdown */}
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                      <Receipt className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Wadarta Qiimaha (Total Fare)</span>
                      <div className="flex items-baseline space-x-1.5">
                        <span className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono">
                          {totalSos.toLocaleString()} SLSH
                        </span>
                        <span className="text-xs text-slate-500 font-semibold">
                          (${totalFare.toFixed(2)})
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowFareBreakdown(!showFareBreakdown)}
                    className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-700 px-2.5 py-1 rounded-xl border border-emerald-300 dark:border-emerald-600 flex items-center space-x-1"
                  >
                    <span>{showFareBreakdown ? 'Qari' : 'Faahfaahin'}</span>
                    {showFareBreakdown ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>
                </div>

                {/* Itemized Fare Table */}
                {showFareBreakdown && (() => {
                  const ratePerKm = isShare ? 0.40 : 0.80;
                  const dropoffFareUsd = currentRide.dropoffFareUsd !== undefined
                    ? currentRide.dropoffFareUsd
                    : Number((Number(currentRide.baseFare || 1.20) + (Number(currentRide.distanceKm || 1) * ratePerKm) - Number(currentRide.discountAmount || 0)).toFixed(2));
                  const dropoffFareSlsh = currentRide.dropoffFareSlsh !== undefined
                    ? currentRide.dropoffFareSlsh
                    : Math.round(dropoffFareUsd * EXCHANGE_RATE_USD_TO_SLSH);

                  const waitingSecs = Number(currentRide.waitingSeconds || 0);
                  const waitingMinutes = currentRide.waitingMinutes || (waitingSecs > 0 ? Math.ceil(waitingSecs / 60) : 0);
                  const waitingFeeSlsh = currentRide.waitingFeeSlsh !== undefined ? currentRide.waitingFeeSlsh : waitingMinutes * 500;
                  const waitingFeeUsd = currentRide.waitingFeeUsd !== undefined ? Number(currentRide.waitingFeeUsd) : Number((waitingFeeSlsh / EXCHANGE_RATE_USD_TO_SLSH).toFixed(2));

                  return (
                    <div className="pt-2 border-t border-dashed border-slate-300 dark:border-slate-700 space-y-1.5 text-[11px]">
                      {/* 1. Dropoff Trip Price */}
                      <div className="flex justify-between text-slate-700 dark:text-slate-300 font-medium">
                        <span className="flex items-center gap-1">
                          <span>🚗</span>
                          <span>Qiimaha Safarka (Dropoff Trip Fare):</span>
                        </span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {dropoffFareSlsh.toLocaleString()} SLSH (${dropoffFareUsd.toFixed(2)})
                        </span>
                      </div>

                      {/* 2. Waiting Time Fee */}
                      <div className="flex justify-between font-medium">
                        <span className={`flex items-center gap-1 ${waitingMinutes > 0 ? 'text-amber-600 dark:text-amber-400 font-semibold' : 'text-slate-500'}`}>
                          <span>⏱️</span>
                          <span>Sugitaanka ({waitingMinutes} daq @ 500 SLSH):</span>
                        </span>
                        <span className={`font-mono font-bold ${waitingMinutes > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500'}`}>
                          +{waitingFeeSlsh.toLocaleString()} SLSH (+${waitingFeeUsd.toFixed(2)})
                        </span>
                      </div>

                      {/* 3. Final Total Sum */}
                      <div className="flex justify-between font-black text-emerald-600 dark:text-emerald-400 pt-1 border-t border-slate-200 dark:border-slate-700">
                        <span>Wadarta Guud ee Lacagta:</span>
                        <span className="font-mono text-xs">{totalSos.toLocaleString()} SLSH (${totalFare.toFixed(2)})</span>
                      </div>

                      <div className="flex justify-between text-slate-500 dark:text-slate-400 pt-0.5 text-[10px]">
                        <span>Habka Lacag-bixinta:</span>
                        <span className="uppercase font-bold text-emerald-600 dark:text-emerald-400">{currentRide.paymentMethod || 'cash'}</span>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Cancel Button (Only if not yet in_progress) */}
              {currentRide.status !== 'in_progress' && (
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => setShowCancelModal(true)}
                    className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:underline py-1 px-3"
                  >
                    {language === 'so' ? 'Baaji Dalabka Safarka' : 'Cancel Ride Request'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-sm w-full p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h3 className="font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <span>{language === 'so' ? 'Ma Hubtaa inaad Baajinayso?' : 'Cancel Trip Request?'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="p-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <label className="font-bold text-slate-700 dark:text-slate-300 block">
                {language === 'so' ? 'Dooro sababta baajinta:' : 'Please select reason for cancellation:'}
              </label>
              {[
                'Darawalku wuu soo daahay (Taking too long)',
                'Qorshahaygii ayaa isbeddelay (Changed my mind)',
                'Ciwaan khaldan ayaan geliyay (Wrong address)',
                'Darawalku ma dhaqaaqayo (Driver not moving)',
              ].map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setCancelReason(reason)}
                  className={`w-full text-left p-2.5 rounded-xl border font-semibold transition ${
                    cancelReason === reason
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-700 dark:text-rose-300'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-xs"
              >
                {language === 'so' ? 'Sii Wad Safarka' : 'Keep Trip'}
              </button>
              <button
                type="button"
                onClick={() => {
                  cancelRide();
                  setShowCancelModal(false);
                }}
                className="py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs uppercase"
              >
                {language === 'so' ? 'Haa, Baaji' : 'Confirm Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals: Chat, Call, Share, Beacon */}
      {showChat && <ChatModal onClose={() => setShowChat(false)} />}
      {showCall && <CallDriverModal onClose={() => setShowCall(false)} />}
      {showShareModal && <ShareTripModal onClose={() => setShowShareModal(false)} />}
      {showBeaconModal && currentRide.beaconColor && (
        <ColorBeaconModal
          isOpen={showBeaconModal}
          beaconColor={currentRide.beaconColor}
          passengerName={currentRide.passengerName}
          onClose={() => setShowBeaconModal(false)}
        />
      )}
    </>
  );
};
