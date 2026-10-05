import React, { useState, useEffect } from 'react';
import {
  Power,
  Shield,
  Wallet,
  TrendingUp,
  Clock,
  Car,
  Star,
  Award,
  Zap,
  Navigation,
  Layers,
  MoreVertical,
  Radio,
  ChevronRight,
  Flame,
  CheckCircle2,
  X,
  PhoneCall,
  MessageSquare,
  AlertTriangle,
  Compass,
  ArrowRightLeft,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useRide } from '../../context/RideContext';
import { UnifiedMap } from '../Map/UnifiedMap';
import { formatCurrency, EXCHANGE_RATE_USD_TO_SLSH } from '../../utils/geo';
import { DriverCommissionWalletModal } from './DriverCommissionWalletModal';
import { DriverEmergencySosModal } from './DriverEmergencySosModal';
import { DriverHotspotsModal } from './DriverHotspotsModal';
import { ServiceTypesModal } from './ServiceTypesModal';
import { DestinationModeModal } from './DestinationModeModal';
import { WorkingCapitalModal } from './WorkingCapitalModal';
import { SafetyCentreDrawer } from './SafetyCentreDrawer';
import { AppInfoWalletModal } from '../Common/AppInfoWalletModal';
import { sounds } from '../../utils/audio';
import { notificationService } from '../../services/notificationService';

export interface WadaageDriverDashboardProps {
  onOpenActivity?: () => void;
  onOpenWallet?: () => void;
  onOpenAccount?: () => void;
}

export const WadaageDriverDashboard: React.FC<WadaageDriverDashboardProps> = ({
  onOpenActivity,
  onOpenWallet,
  onOpenAccount,
}) => {
  const {
    driverModeOnline,
    toggleDriverOnline,
    incomingDriverRequest,
    acceptRideByDriver,
    declineRideByDriver,
    transferRideToAnotherDriver,
    currentRide,
    advanceDriverRideState,
    drivers,
    driverWalletBalanceUsd,
    pricing,
    currentUser,
  } = useRide();

  // Modals & Sheets
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showSosModal, setShowSosModal] = useState(false);
  const [showHotspotsModal, setShowHotspotsModal] = useState(false);
  const [showServiceTypesModal, setShowServiceTypesModal] = useState(false);
  const [showDestinationModal, setShowDestinationModal] = useState(false);
  const [showWorkingCapitalModal, setShowWorkingCapitalModal] = useState(false);
  const [showSafetyDrawer, setShowSafetyDrawer] = useState(false);
  const [showAppInfoModal, setShowAppInfoModal] = useState(false);
  const [showEarningsBreakdown, setShowEarningsBreakdown] = useState(false);

  // Dynamic Driver Data
  const currentDriver = drivers.find(
    (d) => d.phone === currentUser?.phone || d.id === currentUser?.id || d.name === currentUser?.name
  ) || drivers[0] || {
    id: currentUser?.id || 'drv_wadaage',
    name: currentUser?.name || 'Ahmed Nuur',
    phone: currentUser?.phone || '+252 63 6807814',
    avatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    rating: 4.95,
    totalTrips: 14,
    todayEarnings: 48.50,
    hoursOnline: 5.8,
    acceptanceRate: 98,
    vehicle: { model: 'Toyota Vitz', licensePlate: 'SL-39201', color: 'Silver', category: 'wadaage_taxi', capacity: 4 },
  };

  const todayEarningsUsd = currentDriver.todayEarnings || 48.50;
  const todayEarningsSos = Math.round(todayEarningsUsd * EXCHANGE_RATE_USD_TO_SLSH);
  const tripsCount = currentDriver.totalTrips || 14;
  const hoursOnlineCount = currentDriver.hoursOnline || 5.8;
  const driverPoints = Math.round(tripsCount * 30 + (currentDriver.rating || 5) * 10); // e.g. 470 Points

  const [requestTimer, setRequestTimer] = useState(60);

  useEffect(() => {
    if (!incomingDriverRequest) {
      setRequestTimer(60);
      return;
    }
    setRequestTimer(60);
    const interval = setInterval(() => {
      setRequestTimer((prev) => {
        if (prev <= 1) {
          declineRideByDriver();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [incomingDriverRequest, declineRideByDriver]);

  const handleToggle = () => {
    const success = toggleDriverOnline(!driverModeOnline);
    if (!success) {
      setShowWalletModal(true);
    }
  };

  return (
    <div className="relative w-full h-[760px] sm:h-[820px] rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 flex flex-col justify-between select-none font-sans">
      {/* 1. IMMERSIVE MAP BACKGROUND */}
      <div className="absolute inset-0 z-0">
        <UnifiedMap height="100%" showSurgeHeatmap={true} />
        {/* Subtle dark vignette overlay for optimal floating card contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/40 via-transparent to-slate-950/60 pointer-events-none" />
      </div>

      {/* 2. FLOATING TOP BAR: Driver Today's Earnings & Profile */}
      <div className="relative z-20 p-4 sm:p-5 w-full">
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-2xl flex items-center justify-between gap-4"
        >
          {/* Earnings Display */}
          <div
            onClick={() => setShowEarningsBreakdown(!showEarningsBreakdown)}
            className="cursor-pointer group flex-1"
          >
            <div className="flex items-center space-x-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Today's Earnings
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-black bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                +18% Today
              </span>
            </div>

            {/* Large Bold Today's Earnings */}
            <div className="flex items-baseline space-x-2 mt-0.5">
              <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white font-sans tracking-tight">
                ${todayEarningsUsd.toFixed(2)}
              </span>
              <span className="text-xs sm:text-sm font-bold text-slate-500 dark:text-slate-400 font-mono">
                / {todayEarningsSos.toLocaleString()} SOS
              </span>
            </div>
          </div>

          {/* Right Header Actions: SOS Safety & Driver Profile */}
          <div className="flex items-center space-x-2.5 shrink-0">
            {/* Safety SOS Quick Button */}
            <button
              onClick={() => setShowSafetyDrawer(true)}
              className="w-10 h-10 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 flex items-center justify-center transition active:scale-95 shadow-xs"
              title="Safety SOS"
            >
              <Shield className="w-5 h-5 stroke-[2.2]" />
            </button>

            {/* Wallet Quick Balance Pill */}
            <button
              onClick={() => setShowWalletModal(true)}
              className="hidden sm:flex items-center space-x-1.5 px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-2xl border border-emerald-500/20 text-xs font-black transition active:scale-95 shadow-xs"
              title="Prepaid Commission Wallet"
            >
              <Wallet className="w-4 h-4" />
              <span>${driverWalletBalanceUsd.toFixed(2)}</span>
            </button>

            {/* Driver Avatar + Rating Star */}
            <div
              onClick={() => {
                if (onOpenAccount) onOpenAccount();
                else setShowAppInfoModal(true);
              }}
              className="relative cursor-pointer group active:scale-95 transition"
            >
              <img
                src={currentDriver.avatar}
                alt={currentDriver.name}
                className="w-11 h-11 rounded-2xl object-cover border-2 border-emerald-500 shadow-md group-hover:border-emerald-400 transition"
              />
              <span className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-950 font-black text-[10px] px-1.5 py-0.2 rounded-full border border-white dark:border-slate-900 shadow-xs flex items-center">
                ★ {currentDriver.rating || 4.9}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Dropdown Earnings Breakdown Popover */}
        <AnimatePresence>
          {showEarningsBreakdown && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-2 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xl space-y-2 text-xs"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <span className="font-extrabold text-slate-800 dark:text-slate-200">
                  Fare Settlement Breakdown
                </span>
                <button
                  onClick={() => setShowEarningsBreakdown(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Gross Passenger Fares:</span>
                <span className="font-bold text-slate-900 dark:text-white font-mono">
                  ${(todayEarningsUsd * 1.05).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Platform Commission (Fixed 1,000 SOS/trip):</span>
                <span className="font-bold text-rose-500 font-mono">
                  -${(tripsCount * 0.10).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between font-extrabold text-emerald-600 dark:text-emerald-400 pt-1 border-t border-slate-100 dark:border-slate-800">
                <span>Net Take-Home Pay:</span>
                <span className="font-mono text-sm">${todayEarningsUsd.toFixed(2)}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 3. CENTER STATUS TOGGLE: "GO ONLINE" / "GO OFFLINE" with Glowing Green Effect */}
      <div className="relative z-20 flex flex-col items-center justify-center my-auto px-4 pointer-events-none">
        <div className="pointer-events-auto flex flex-col items-center">
          {/* Animated Sonar Radar Rings when Online */}
          <div className="relative flex items-center justify-center">
            {driverModeOnline && (
              <>
                <div className="absolute w-44 h-44 rounded-full bg-emerald-500/20 animate-ping pointer-events-none" />
                <div className="absolute w-36 h-36 rounded-full bg-emerald-500/30 animate-pulse pointer-events-none" />
              </>
            )}

            {/* High-Quality Toggle Button */}
            <motion.button
              whileTap={{ scale: 0.94 }}
              whileHover={{ scale: 1.04 }}
              onClick={handleToggle}
              className={`relative px-8 py-4 rounded-full font-black text-sm tracking-widest uppercase transition-all shadow-2xl flex items-center space-x-3 cursor-pointer ${
                driverModeOnline
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/50 ring-4 ring-emerald-500/30'
                  : 'bg-slate-900/90 dark:bg-slate-900/90 text-slate-300 border border-slate-700/80 shadow-slate-950/80 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Power
                className={`w-6 h-6 stroke-[2.5] ${
                  driverModeOnline ? 'text-slate-950 animate-pulse' : 'text-slate-400'
                }`}
              />
              <span className="font-sans">
                {driverModeOnline ? "YOU'RE ONLINE" : 'GO ONLINE'}
              </span>
            </motion.button>
          </div>

          {/* Status Subtitle Pill */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-3 px-3.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-800 text-white text-xs font-bold flex items-center space-x-2 shadow-lg"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                driverModeOnline ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'
              }`}
            />
            <span className="text-slate-300">
              {driverModeOnline
                ? 'Radar active • Receiving orders in Hargeisa'
                : 'Offline • Tap button to start earning'}
            </span>
          </motion.div>
        </div>
      </div>

      {/* 4. INCOMING TRIP DISPATCH ALERT CARD (If any ride is dispatched) */}
      <AnimatePresence>
        {incomingDriverRequest && (!currentRide || currentRide.status === 'searching' || currentRide.status === 'idle') && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="relative z-30 mx-4 sm:mx-5 mb-3 bg-white dark:bg-slate-900 border-2 border-emerald-500 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-1 rounded-full bg-emerald-500 text-slate-950 font-black text-xs uppercase">
                  ⚡ New Trip Request
                </span>
                <span className="text-xs font-mono font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800 animate-pulse">
                  {requestTimer}s left
                </span>
              </div>
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                ${(incomingDriverRequest.totalFare || 2.50).toFixed(2)}
              </span>
            </div>

            {/* Passenger & Route details */}
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
                <span className="truncate">From: {incomingDriverRequest.pickup?.name || 'Pickup Location'}</span>
              </div>
              <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0" />
                <span className="truncate">To: {incomingDriverRequest.dropoff?.name || 'Dropoff Destination'}</span>
              </div>
            </div>

            {/* Action Buttons: Accept / Transfer / Decline */}
            <div className={`grid ${(!currentRide || currentRide.status === 'searching' || currentRide.status === 'idle') ? 'grid-cols-3' : 'grid-cols-2'} gap-2 pt-1`}>
              <button
                onClick={() => {
                  notificationService.stopEmergencyOrderRingtone();
                  sounds.playButtonClick();
                  declineRideByDriver();
                }}
                className="py-2.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 font-black rounded-xl text-xs transition active:scale-95"
              >
                Decline
              </button>
              {(!currentRide || currentRide.status === 'searching' || currentRide.status === 'idle') && (
                <button
                  onClick={() => transferRideToAnotherDriver()}
                  className="py-2.5 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-700 dark:text-amber-400 font-black rounded-xl text-xs transition active:scale-95 flex items-center justify-center space-x-1"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                  <span>Transfer</span>
                </button>
              )}
              <button
                onClick={() => {
                  notificationService.stopEmergencyOrderRingtone();
                  sounds.playButtonClick();
                  acceptRideByDriver(currentDriver.id);
                }}
                className="py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-emerald-500/30 transition active:scale-95"
              >
                Accept Trip
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. FLOATING BOTTOM CARD: 3-COLUMN "EARNINGS SUMMARY" CARD */}
      <div className="relative z-20 p-4 sm:p-5 w-full">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-4"
        >
          {/* Header Row of Summary Card */}
          <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Shift Performance & Activity
            </span>
            <button
              onClick={() => {
                if (onOpenActivity) onOpenActivity();
                else setShowHotspotsModal(true);
              }}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center space-x-1"
            >
              <span>View Details</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 3-COLUMN HIGH-CONTRAST GRID: Trips | Hours Online | Points */}
          <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-slate-800 text-center py-1">
            {/* Column 1: Trips */}
            <div className="px-2">
              <div className="flex items-center justify-center space-x-1 text-slate-400 dark:text-slate-500 mb-1">
                <Car className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-[11px] font-extrabold uppercase tracking-wider">
                  Trips
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-sans">
                {tripsCount}
              </div>
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                Completed
              </span>
            </div>

            {/* Column 2: Hours Online */}
            <div className="px-2">
              <div className="flex items-center justify-center space-x-1 text-slate-400 dark:text-slate-500 mb-1">
                <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-[11px] font-extrabold uppercase tracking-wider">
                  Hours Online
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-sans">
                {hoursOnlineCount}
              </div>
              <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">
                Active Time
              </span>
            </div>

            {/* Column 3: Points / Karma */}
            <div className="px-2">
              <div className="flex items-center justify-center space-x-1 text-slate-400 dark:text-slate-500 mb-1">
                <Award className="w-4 h-4 text-amber-500" />
                <span className="text-[11px] font-extrabold uppercase tracking-wider">
                  Points
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white font-sans">
                {driverPoints}
              </div>
              <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                Tier Gold
              </span>
            </div>
          </div>

          {/* Quick Action Shortcuts */}
          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
            <button
              onClick={() => setShowHotspotsModal(true)}
              className="p-2 rounded-2xl bg-slate-50 dark:bg-slate-800/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-300 flex flex-col items-center space-y-1 transition active:scale-95"
            >
              <Flame className="w-4 h-4 text-amber-500" />
              <span className="text-[10px] font-bold">Hotspots</span>
            </button>

            <button
              onClick={() => setShowServiceTypesModal(true)}
              className="p-2 rounded-2xl bg-slate-50 dark:bg-slate-800/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-300 flex flex-col items-center space-y-1 transition active:scale-95"
            >
              <Car className="w-4 h-4 text-emerald-500" />
              <span className="text-[10px] font-bold">Services</span>
            </button>

            <button
              onClick={() => setShowDestinationModal(true)}
              className="p-2 rounded-2xl bg-slate-50 dark:bg-slate-800/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-300 flex flex-col items-center space-y-1 transition active:scale-95"
            >
              <Compass className="w-4 h-4 text-blue-500" />
              <span className="text-[10px] font-bold">Destination</span>
            </button>

            <button
              onClick={() => setShowWorkingCapitalModal(true)}
              className="p-2 rounded-2xl bg-slate-50 dark:bg-slate-800/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-700 dark:text-slate-300 flex flex-col items-center space-y-1 transition active:scale-95"
            >
              <Zap className="w-4 h-4 text-purple-500" />
              <span className="text-[10px] font-bold">Capital</span>
            </button>
          </div>
        </motion.div>
      </div>

      {/* 6. MODALS & DRAWERS */}
      <DriverCommissionWalletModal
        isOpen={showWalletModal}
        onClose={() => setShowWalletModal(false)}
      />
      <DriverEmergencySosModal
        isOpen={showSosModal}
        onClose={() => setShowSosModal(false)}
      />
      <DriverHotspotsModal
        isOpen={showHotspotsModal}
        onClose={() => setShowHotspotsModal(false)}
      />
      <ServiceTypesModal
        isOpen={showServiceTypesModal}
        onClose={() => setShowServiceTypesModal(false)}
      />
      <DestinationModeModal
        isOpen={showDestinationModal}
        onClose={() => setShowDestinationModal(false)}
        activeDestination={null}
        onSetDestination={() => {}}
      />
      <WorkingCapitalModal
        isOpen={showWorkingCapitalModal}
        onClose={() => setShowWorkingCapitalModal(false)}
      />
      <SafetyCentreDrawer
        isOpen={showSafetyDrawer}
        onClose={() => setShowSafetyDrawer(false)}
        onTriggerSos={() => setShowSosModal(true)}
      />
      <AppInfoWalletModal
        isOpen={showAppInfoModal}
        onClose={() => setShowAppInfoModal(false)}
      />
    </div>
  );
};
