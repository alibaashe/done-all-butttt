import {
  AlertTriangle, Car, ChevronUp, Coffee, Compass, FileText, Flame,
  History, Layers, Lock, MapPin, MoreHorizontal, MoreVertical, Navigation, PhoneCall,
  Power, Shield, Star, Trophy, User, Users, Wallet, Wrench, Zap, Package,
  MessageSquare, Briefcase, CheckCircle2, ChevronRight, X
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useRide } from '../../context/RideContext';
import { formatCurrency } from '../../utils/geo';
import { DriverEarningsView } from './DriverEarningsView';
import { DriverActivityView } from './DriverActivityView';
import { DriverAccountView } from './DriverAccountView';
import { DriverSupportTickets } from './DriverSupportTickets';
import { DriverFatigueModal } from './DriverFatigueModal';
import { DriverCommissionWalletModal } from './DriverCommissionWalletModal';
import { DestinationModeModal } from './DestinationModeModal';
import { DriverHotspotsModal } from './DriverHotspotsModal';
import { VehicleHealthModal } from './VehicleHealthModal';
import { DriverQuotasQuestModal } from './DriverQuotasQuestModal';
import { DriverEmergencySosModal } from './DriverEmergencySosModal';
import { SafetyCentreDrawer } from './SafetyCentreDrawer';
import { ServiceTypesModal } from './ServiceTypesModal';
import { WorkingCapitalModal } from './WorkingCapitalModal';
import { DriverRegistrationModal } from './DriverRegistrationModal';
import { AppInfoWalletModal } from '../Common/AppInfoWalletModal';
import { RideOrderDetailsModal } from './RideOrderDetailsModal';
import { WadaageDriverDashboard } from './WadaageDriverDashboard';
import { EXCHANGE_RATE_USD_TO_SLSH } from '../../utils/geo';
import { UnifiedMap } from '../Map/UnifiedMap';
import { sounds } from '../../utils/audio';
import { notificationService } from '../../services/notificationService';

export const DriverDashboard: React.FC = () => {
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
    dismissLowBalanceAlert,
    pricing,
    chatMessages,
    sendMessage,
    currentUser,
    isOrderWithinDriverDispatchRadius,
  } = useRide();

  const [requestTimer, setRequestTimer] = useState(60);
  const [activeTab, setActiveTab] = useState<'rides' | 'activity' | 'wallet' | 'account'>('rides');

  // Modals & Drawers state matching Screenshots
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showFatigueModal, setShowFatigueModal] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showDestinationModal, setShowDestinationModal] = useState(false);
  const [showHotspotsModal, setShowHotspotsModal] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showQuotasModal, setShowQuotasModal] = useState(false);
  const [showSosModal, setShowSosModal] = useState(false);

  // Wadaage specific Modals & Features
  const [showSafetyDrawer, setShowSafetyDrawer] = useState(false);
  const [showServiceTypesModal, setShowServiceTypesModal] = useState(false);
  const [showWorkingCapitalModal, setShowWorkingCapitalModal] = useState(false);
  const [showOrderDetailsModal, setShowOrderDetailsModal] = useState(false);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [showEarningsOverlay, setShowEarningsOverlay] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [showAppInfoModal, setShowAppInfoModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferNotification, setTransferNotification] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');

  // Toggles (Auto Accept is strictly OFF by default to ensure driver manually chooses Accept, Transfer, or Decline)
  const [autoAcceptEnabled, setAutoAcceptEnabled] = useState(false);
  const [mapStyleSatellite, setMapStyleSatellite] = useState(false);
  const [destinationFilter, setDestinationFilter] = useState<string | null>(null);

  const currentSos = Math.round(driverWalletBalanceUsd * 10000);
  const minThresholdUsd = pricing.driverMinWalletThresholdUsd || 0.20;
  const isBelowMin = driverWalletBalanceUsd < minThresholdUsd;
  const currentDriver = drivers.find((d) => d.phone === currentUser?.phone || d.id === currentUser?.id) || drivers[0] || {
    id: currentUser?.id || 'drv_live',
    name: currentUser?.name || 'Driver Partner',
    phone: currentUser?.phone || '+252 63 6807814',
    avatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    rating: 5.0,
    totalTrips: 0,
    todayEarnings: 0,
    weeklyEarnings: 0,
    hoursOnline: 0,
    acceptanceRate: 100,
    vehicle: { model: 'Toyota Vitz', licensePlate: 'SL-39201', color: 'White', category: 'wadaage_taxi', capacity: 4, photoUrl: '' },
    documentsVerified: { driverLicense: true, vehicleInsurance: true, backgroundCheck: true },
    currentLocation: { lat: 9.560, lng: 44.065 },
    status: 'available',
    isVerified: true,
  };

  const getOrderBadge = (category: string) => {
    if (category === 'wadaage_share') {
      return {
        label: '👥 WADAAGE SHARE (CARPOOL)',
        bg: 'bg-indigo-600 text-white',
        border: 'border-indigo-400',
        note: 'Carpool order - 1-2 passengers along route',
      };
    }
    return {
      label: '🚕 WADAAGE TAXI',
      bg: 'bg-emerald-500 text-slate-950 font-black',
      border: 'border-emerald-400',
      note: 'Standard private taxi ride',
    };
  };

  // Optional Auto-Accept effect only when explicitly toggled ON by driver
  useEffect(() => {
    if (incomingDriverRequest && driverModeOnline && autoAcceptEnabled) {
      const timer = setTimeout(() => {
        acceptRideByDriver(currentDriver.id);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [incomingDriverRequest, driverModeOnline, autoAcceptEnabled, acceptRideByDriver, currentDriver.id]);

  // Request timer countdown: Exactly 60 Seconds (1 Full Minute) to choose Accept, Transfer, or Decline
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

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Driver Sub-Navigation Bar */}
      <div className="bg-slate-900 text-white rounded-2xl p-3 border border-slate-800 shadow-xl flex items-center justify-between gap-2 overflow-x-auto">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('rides')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center space-x-1.5 ${
              activeTab === 'rides' ? 'bg-emerald-500 text-slate-950 shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Car className="w-4 h-4" />
            <span>Driver Map View</span>
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center space-x-1.5 ${
              activeTab === 'activity' ? 'bg-emerald-500 text-slate-950 shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Trip History</span>
          </button>
          <button
            onClick={() => setActiveTab('wallet')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center space-x-1.5 ${
              activeTab === 'wallet' ? 'bg-emerald-500 text-slate-950 shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>Earnings & Wallet</span>
          </button>
          <button
            onClick={() => setActiveTab('account')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center space-x-1.5 ${
              activeTab === 'account' ? 'bg-emerald-500 text-slate-950 shadow-lg' : 'text-slate-400 hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile & KYC</span>
          </button>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => setShowRegistrationModal(true)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center space-x-1"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Sign Up / KYC</span>
          </button>
        </div>
      </div>

      {activeTab === 'activity' && <DriverActivityView />}
      {activeTab === 'wallet' && <DriverEarningsView />}
      {activeTab === 'account' && (
        <DriverAccountView
          onOpenSupportModal={() => setShowSupportModal(true)}
          onOpenFatigueModal={() => setShowFatigueModal(true)}
          onOpenVehicleModal={() => setShowVehicleModal(true)}
          onOpenSosModal={() => setShowSosModal(true)}
        />
      )}

      {activeTab === 'rides' && (
        <div className="space-y-4">
          {/* Main Map Stage Frame (Wadaage Real Live Map View) */}
          <div className="relative w-full h-[520px] rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl bg-slate-900 flex flex-col justify-between p-4">

            {/* Real Live Interactive Map */}
            <div className="absolute inset-0 z-0">
              <UnifiedMap height="100%" />
            </div>

            {/* Top Bar Floating Controls (Screenshot 1 & 4) */}
            <div className="relative z-10 flex items-center justify-between">
              {/* Left Earnings Pill Button */}
              <button
                onClick={() => setShowEarningsOverlay(!showEarningsOverlay)}
                className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md text-slate-900 dark:text-white px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700 shadow-xl flex items-center space-x-2 text-xs font-black hover:scale-105 transition"
              >
                <div className="flex flex-col items-start">
                  <div className="flex items-center space-x-1">
                    <span className="w-2 h-0.5 bg-slate-800 dark:bg-slate-200" />
                    <span className="w-3 h-0.5 bg-slate-800 dark:bg-slate-200" />
                    <span className="text-[11px] font-extrabold ml-1">Earnings</span>
                  </div>
                </div>
              </button>

              {/* Right Profile & 3-Dots Info Menu Buttons */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowAppInfoModal(true)}
                  className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 p-2.5 rounded-full backdrop-blur-md shadow-xl hover:scale-105 transition flex items-center justify-center"
                  title="App & Driver Activation Wallet Info (3 Dots)"
                >
                  <MoreVertical className="w-5 h-5 text-emerald-400" />
                </button>

                <button
                  onClick={() => setShowRegistrationModal(true)}
                  className="relative bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-1 rounded-full border border-slate-200 dark:border-slate-700 shadow-xl hover:scale-105 transition flex items-center"
                >
                  <img
                    src={currentDriver.avatar}
                    alt={currentDriver.name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-emerald-500"
                  />
                  <span className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-950 font-black text-[10px] px-1.5 py-0.2 rounded-full border border-white flex items-center">
                    ★ {currentDriver.rating}
                  </span>
                </button>
              </div>
            </div>

            {/* Earnings Popup Overlay Card (Screenshots 4 & 5) */}
            {showEarningsOverlay && (
              <div className="absolute top-16 left-4 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-700 p-4 rounded-2xl shadow-2xl w-64 space-y-2.5 animate-in fade-in zoom-in duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200">Today's Summary</span>
                  <button onClick={() => setShowEarningsOverlay(false)} className="text-slate-400 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl flex items-center justify-between">
                    <span className="text-slate-500 font-semibold">Today's Earnings</span>
                    <span className="font-mono font-black text-slate-900 dark:text-white text-sm">{(currentDriver.todayEarnings || 150000).toLocaleString()} SOS</span>
                  </div>

                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl flex items-center justify-between">
                    <span className="text-slate-500 font-semibold">Trip Charges Fee</span>
                    <span className="font-mono font-black text-emerald-500 flex items-center">
                      1,000 SOS ($0.10) / Trip
                    </span>
                  </div>

                  <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl flex items-center justify-between">
                    <span className="text-slate-500 font-semibold">Prepaid Driver Wallet</span>
                    <span className="font-mono font-black text-emerald-400">
                      {Math.round(driverWalletBalanceUsd * 10000).toLocaleString()} SOS (${driverWalletBalanceUsd.toFixed(2)})
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowEarningsOverlay(false);
                    setShowWalletModal(true);
                  }}
                  className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-[11px] uppercase"
                >
                  Prepay Wallet (ZAAD 0636807814 / eDahab 0656807814)
                </button>
              </div>
            )}

            {/* Central Prominent "Power / Go Online" Button (Screenshots 1, 4 & 5) */}
            <div className="relative z-10 flex flex-col items-center my-auto">
              <button
                onClick={() => {
                  const success = toggleDriverOnline(!driverModeOnline);
                  if (!success) {
                    setShowWalletModal(true);
                  }
                }}
                className={`px-8 py-3.5 rounded-full font-black text-sm tracking-wider uppercase transition-all shadow-2xl border-2 flex items-center space-x-2.5 hover:scale-105 active:scale-95 ${
                  driverModeOnline
                    ? 'bg-slate-950 text-emerald-400 border-emerald-500 shadow-emerald-500/30'
                    : 'bg-slate-950 text-white border-slate-700 shadow-slate-900/80'
                }`}
              >
                <Power className={`w-5 h-5 ${driverModeOnline ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
                <span>{driverModeOnline ? 'YOU\'RE ONLINE' : 'GO ONLINE'}</span>
              </button>
            </div>

            {/* Map Action Floating Buttons (Layer & Safety Shield) */}
            <div className="relative z-10 flex items-center justify-between pointer-events-none">
              <div className="pointer-events-auto">
                <button
                  onClick={() => setShowSafetyDrawer(true)}
                  className="w-12 h-12 rounded-full bg-white dark:bg-slate-900/90 text-emerald-500 border border-slate-200 dark:border-slate-700 shadow-2xl flex items-center justify-center hover:scale-110 transition"
                  title="Open Safety Centre"
                >
                  <Shield className="w-6 h-6 stroke-[2.5]" />
                </button>
              </div>

              <div className="pointer-events-auto">
                <button
                  onClick={() => setMapStyleSatellite(!mapStyleSatellite)}
                  className="w-10 h-10 rounded-full bg-white dark:bg-slate-900/90 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-xl flex items-center justify-center hover:scale-105 transition"
                  title="Toggle Map Layers"
                >
                  <Layers className="w-5 h-5" />
                </button>
              </div>
            </div>

          </div>

          {/* Wadaage Bottom Sheet Driver Control Panel */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xl space-y-4">

            {/* Online / Offline Status Dot */}
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center space-x-2 text-xs font-bold">
                <span className={`w-3 h-3 rounded-full ${driverModeOnline ? 'bg-emerald-500 animate-ping' : 'bg-rose-500'}`} />
                <span className="text-slate-900 dark:text-white font-extrabold text-sm">
                  {driverModeOnline ? "You're online." : "You're offline."}
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">
                {driverModeOnline ? 'Ready to accept jobs' : 'Tap "GO ONLINE" to receive rides'}
              </span>
            </div>

            {/* 5 Circular Action Icons Row (Matching Screenshot 1) */}
            <div className="grid grid-cols-5 gap-2 text-center py-2 border-y border-slate-100 dark:border-slate-800">

              {/* 1. Auto Accept Toggle */}
              <button
                onClick={() => setAutoAcceptEnabled(!autoAcceptEnabled)}
                className="flex flex-col items-center group space-y-1.5 focus:outline-none"
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition ${
                  autoAcceptEnabled
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                }`}>
                  <Zap className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block truncate w-full">
                  Auto Accept
                </span>
                <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-full uppercase ${
                  autoAcceptEnabled ? 'bg-emerald-500/20 text-emerald-500' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                }`}>
                  {autoAcceptEnabled ? 'ON' : 'OFF'}
                </span>
              </button>

              {/* 2. Service Types */}
              <button
                onClick={() => setShowServiceTypesModal(true)}
                className="flex flex-col items-center group space-y-1.5 focus:outline-none"
              >
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white group-hover:bg-slate-200 dark:group-hover:bg-slate-700 flex items-center justify-center transition">
                  <Car className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block truncate w-full">
                  Service types
                </span>
                <span className="text-[9px] font-bold text-slate-400">4 Active</span>
              </button>

              {/* 3. Working Capital */}
              <button
                onClick={() => setShowWorkingCapitalModal(true)}
                className="flex flex-col items-center group space-y-1.5 focus:outline-none"
              >
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white group-hover:bg-slate-200 dark:group-hover:bg-slate-700 flex items-center justify-center transition">
                  <Briefcase className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block truncate w-full">
                  Working Capital
                </span>
                <span className="text-[9px] font-bold text-emerald-500">$150 Line</span>
              </button>

              {/* 4. My Destination */}
              <button
                onClick={() => setShowDestinationModal(true)}
                className="flex flex-col items-center group space-y-1.5 focus:outline-none"
              >
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition ${
                  destinationFilter
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white group-hover:bg-slate-200 dark:group-hover:bg-slate-700'
                }`}>
                  <Compass className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block truncate w-full">
                  My Destination
                </span>
                <span className="text-[9px] font-bold text-slate-400 truncate w-full px-1">
                  {destinationFilter ? 'Active' : 'Set Route'}
                </span>
              </button>

              {/* 5. More Actions */}
              <button
                onClick={() => setShowHotspotsModal(true)}
                className="flex flex-col items-center group space-y-1.5 focus:outline-none"
              >
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white group-hover:bg-slate-200 dark:group-hover:bg-slate-700 flex items-center justify-center transition">
                  <MoreHorizontal className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block truncate w-full">
                  More
                </span>
                <span className="text-[9px] font-bold text-amber-500">2.2x Heatmap</span>
              </button>
            </div>

            {/* Reminder Alert Box (Exact match to Screenshots 1 & 4) */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
              isBelowMin
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-900 text-rose-900 dark:text-rose-200'
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200'
            }`}>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-xs text-slate-900 dark:text-white">Reminder</span>
                    <span className="bg-rose-600 text-white text-[10px] font-black px-2 py-0.2 rounded uppercase">
                      URGENT
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-medium mt-0.5">
                    Credit Wallet is <b className="text-emerald-600 dark:text-emerald-400 font-mono">${driverWalletBalanceUsd.toFixed(2)}</b> (<b>{currentSos.toLocaleString()} SOS</b>). Top up to keep receiving jobs.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowWalletModal(true)}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shrink-0 transition shadow-md"
              >
                Top Up
              </button>
            </div>

          </div>

          {/* Active Job / Dispatch Screen (Screenshot 3) */}
          {currentRide && ['accepted', 'driver_arrived', 'in_progress'].includes(currentRide.status) && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-200">

              {/* Header Stop indicator */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center">
                    2
                  </span>
                  <span className="text-xs text-slate-500 font-extrabold uppercase">Stops</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                    1 • Pick up passenger
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowSafetyDrawer(true)}
                    className="p-2 rounded-full bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-slate-950 transition"
                    title="Safety Centre"
                  >
                    <Shield className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Ride info box */}
              <div className="space-y-2">
                {/* Category Order Badge */}
                {(() => {
                  const badge = getOrderBadge(currentRide.category);
                  return (
                    <div className={`p-3 rounded-2xl border ${badge.border} ${badge.bg} flex items-center justify-between shadow-md`}>
                      <div>
                        <span className="font-black text-xs uppercase tracking-wider block">{badge.label}</span>
                        <span className="text-[10px] opacity-90 font-medium block">{badge.note}</span>
                      </div>
                      <span className="text-[10px] font-mono font-black bg-black/20 px-2.5 py-1 rounded-lg uppercase">
                        {currentRide.categoryName || badge.label}
                      </span>
                    </div>
                  );
                })()}

                {/* Prominent Driver Fare Display Box with Per-KM Rate & SLSH Breakdown */}
                <div className="bg-emerald-950/40 border border-emerald-500/30 p-3.5 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">Customer Trip Fare</span>
                      <div className="text-xl font-black text-white font-mono flex items-baseline space-x-1.5">
                        <span className="text-emerald-400">${currentRide.totalFare.toFixed(2)} USD</span>
                        <span className="text-xs text-slate-300">
                          ({Math.round(currentRide.totalFare * EXCHANGE_RATE_USD_TO_SLSH).toLocaleString()} SLSH)
                        </span>
                      </div>
                    </div>
                    <span className="bg-emerald-500 text-slate-950 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase shadow">
                      {currentRide.paymentMethod}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-emerald-800/60 text-[11px] text-emerald-300/90">
                    <span>
                      Tariff Rate: <b>{currentRide.category === 'wadaage_share' || currentRide.isShared ? '$0.40 / 4,500 SLSH' : '$0.80 / 9,000 SLSH'} per km</b>
                    </span>
                    <span>
                      Distance: <b>{currentRide.distanceKm} km</b>
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                    {currentRide.pickup?.name || 'Pickup Location'}
                  </h3>
                  <span className="text-xs text-slate-400 font-medium">
                    ➔ {currentRide.dropoff?.name || 'Dropoff Destination'}
                  </span>
                </div>

                <p className="text-xs text-slate-500 font-medium">
                  {currentRide.pickup?.address || 'Central Street, Hargeisa'}
                </p>
              </div>

              {/* Action Bar (4 Buttons: Details, Chat, Call, More) */}
              <div className="grid grid-cols-4 gap-2 text-center py-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={() => setShowOrderDetailsModal(true)}
                  className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-2xl flex flex-col items-center justify-center space-y-1 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                >
                  <Package className="w-5 h-5 text-emerald-500" />
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Order Details</span>
                </button>

                <button
                  onClick={() => setShowChatModal(true)}
                  className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-2xl flex flex-col items-center justify-center space-y-1 hover:bg-slate-100 dark:hover:bg-slate-700 transition relative"
                >
                  <MessageSquare className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">Chat with Rider</span>
                  {chatMessages.length > 0 && (
                    <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  )}
                </button>

                <a
                  href={`tel:${currentRide.passengerPhone}`}
                  className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-2xl flex flex-col items-center justify-center space-y-1 hover:bg-slate-100 dark:hover:bg-slate-700 transition text-slate-700 dark:text-slate-300"
                >
                  <PhoneCall className="w-5 h-5 text-emerald-500" />
                  <span className="text-[10px] font-bold">Call Rider</span>
                </a>

                <button
                  onClick={() => setShowHotspotsModal(true)}
                  className="p-2.5 bg-slate-50 dark:bg-slate-800 rounded-2xl flex flex-col items-center justify-center space-y-1 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                >
                  <MoreHorizontal className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                  <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">More Actions</span>
                </button>
              </div>

              {/* Status Action Slider Button */}
              <div className="pt-2">
                {currentRide.status === 'accepted' && (
                  <button
                    onClick={() => {
                      sounds.playButtonClick();
                      advanceDriverRideState();
                    }}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-4 rounded-full text-sm uppercase tracking-wider transition shadow-xl"
                  >
                    ARRIVED
                  </button>
                )}
                {currentRide.status === 'driver_arrived' && (
                  <button
                    onClick={() => {
                      sounds.playButtonClick();
                      advanceDriverRideState();
                    }}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-4 rounded-full text-sm uppercase tracking-wider transition shadow-xl"
                  >
                    START TRIP (VERIFIED)
                  </button>
                )}
                {currentRide.status === 'in_progress' && (
                  <button
                    onClick={() => {
                      sounds.playButtonClick();
                      advanceDriverRideState();
                    }}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 text-slate-950 font-black py-4 rounded-full text-sm uppercase tracking-wider transition shadow-xl"
                  >
                    COMPLETE TRIP & COLLECT {formatCurrency(currentRide.totalFare)}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Incoming Dispatch Notification Card with 1-Minute (60-Second) Manual Acceptance Window */}
          {incomingDriverRequest && driverModeOnline && !autoAcceptEnabled && (
            <div className="bg-slate-900 text-white rounded-3xl p-5 border-2 border-emerald-500 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="bg-emerald-500 text-slate-950 text-[10px] font-black px-2.5 py-1 rounded uppercase tracking-wider">
                    NEW DISPATCH REQUEST
                  </span>
                  <span className="text-[11px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60 font-bold">
                    ⏱️ 1 Min Window
                  </span>
                </div>
                <div className={`px-3 py-1.5 rounded-full border-2 flex items-center justify-center font-mono font-black text-sm shadow-lg ${
                  requestTimer <= 15
                    ? 'bg-rose-950/90 border-rose-500 text-rose-400 animate-pulse'
                    : requestTimer <= 30
                    ? 'bg-amber-950/80 border-amber-500 text-amber-400'
                    : 'bg-slate-800 border-emerald-500 text-emerald-400'
                }`}>
                  {requestTimer >= 60 ? '1:00' : `0:${requestTimer < 10 ? '0' : ''}${requestTimer}`} ({requestTimer}s)
                </div>
              </div>

              {/* Order Category Type Badge */}
              {(() => {
                const badge = getOrderBadge(incomingDriverRequest.category);
                return (
                  <div className="space-y-1.5">
                    <div className={`p-3 rounded-xl border ${badge.border} ${badge.bg} flex items-center justify-between`}>
                      <div>
                        <span className="font-black text-xs uppercase tracking-wide block">{badge.label}</span>
                        <span className="text-[10px] opacity-90 font-medium block">{badge.note}</span>
                      </div>
                      {incomingDriverRequest.waitAndSaveTier === 'wait_and_save' && (
                        <span className="text-[10px] font-mono font-black bg-amber-400 text-slate-950 px-2 py-0.5 rounded-lg uppercase">
                          ⏳ Wait & Save Tier
                        </span>
                      )}
                    </div>

                    {/* Wadaage Pink Special Badge */}
                    {incomingDriverRequest.genderPreference === 'female_only' && (
                      <div className="p-2.5 rounded-xl bg-pink-500/20 border border-pink-500/40 text-pink-300 text-xs font-black flex items-center gap-2">
                        <span className="text-base">🌸</span>
                        <div>
                          <span>WADAAGE PINK (SHECAB) ORDER</span>
                          <span className="text-[10px] text-pink-200 block font-normal">
                            Passenger requested verified female driver / co-passengers.
                          </span>
                        </div>
                      </div>
                    )}

                    {/* GPS Dispatch Radius Match Badge */}
                    {(() => {
                      const check = isOrderWithinDriverDispatchRadius(incomingDriverRequest);
                      return (
                        <div className="p-2 rounded-xl bg-blue-950/60 border border-blue-800/80 text-blue-300 text-xs font-semibold flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <span>🎯</span>
                            <span>Pickup GPS Distance: <b>{check.distanceKm} KM</b> from your location</span>
                          </span>
                          <span className="bg-blue-600/30 text-blue-300 text-[10px] font-black px-2 py-0.5 rounded border border-blue-500/40 font-mono">
                            Radius ≤ {check.allowedRadiusKm} KM
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                );
              })()}

              <div className="bg-slate-800/90 p-3 rounded-2xl border border-slate-700/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Customer Fare</span>
                    <div className="text-xl font-black text-emerald-400 font-mono flex items-baseline space-x-1.5">
                      <span>${incomingDriverRequest.totalFare.toFixed(2)} USD</span>
                      <span className="text-xs text-slate-300 font-normal">
                        ({Math.round(incomingDriverRequest.totalFare * EXCHANGE_RATE_USD_TO_SLSH).toLocaleString()} SLSH)
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Rate Applied</span>
                    <span className="text-xs font-bold text-amber-300">
                      {incomingDriverRequest.category === 'wadaage_share' ? '$0.40 / 4,500 SLSH/km' : '$0.80 / 9,000 SLSH/km'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-700/60 text-xs text-slate-300 font-bold">
                  <span>Distance: {incomingDriverRequest.distanceKm} km</span>
                  <span>Duration: ~{incomingDriverRequest.durationMins} mins</span>
                </div>
              </div>

              <div className="bg-slate-800/80 p-3 rounded-xl text-xs space-y-1 border border-slate-700/60">
                <div className="text-emerald-400 font-bold flex items-center space-x-1.5">
                  <span>📍</span>
                  <span>Pickup: {incomingDriverRequest.pickup?.name || 'Pickup Location'}</span>
                </div>
                <div className="text-rose-400 font-bold flex items-center space-x-1.5">
                  <span>🎯</span>
                  <span>Dropoff: {incomingDriverRequest.dropoff?.name || 'Dropoff Destination'}</span>
                </div>
              </div>

              <div className="text-center text-[11px] text-slate-400 bg-slate-800/40 py-1 rounded-lg border border-slate-700/40">
                <span>Please choose within 1 minute: <b>Accept</b>, <b>Transfer</b>, or <b>Decline</b></span>
              </div>

              {/* 3 Driver Actions: DECLINE, TRANSFER TO ANOTHER DRIVER, ACCEPT (60s Window) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                {/* 1. DECLINE */}
                <button
                  onClick={() => {
                    notificationService.stopEmergencyOrderRingtone();
                    sounds.playButtonClick();
                    declineRideByDriver();
                  }}
                  className="bg-slate-800 hover:bg-rose-950/40 text-slate-300 hover:text-rose-400 font-extrabold py-3.5 px-3 rounded-2xl text-xs uppercase transition border border-slate-700 hover:border-rose-800/60 flex items-center justify-center space-x-1"
                >
                  <span>✕</span>
                  <span>DECLINE</span>
                </button>

                {/* 2. TRANSFER TO ANOTHER DRIVER */}
                <button
                  onClick={() => setShowTransferModal(true)}
                  className="bg-indigo-600/90 hover:bg-indigo-500 text-white font-extrabold py-3.5 px-3 rounded-2xl text-xs uppercase tracking-wide transition border border-indigo-400/50 shadow-lg flex items-center justify-center space-x-1.5 active:scale-98"
                  title="Forward order to another online driver"
                >
                  <span className="text-sm">🔄</span>
                  <span>TRANSFER</span>
                </button>

                {/* 3. ACCEPT (WITH 60s COUNTDOWN INDICATOR) */}
                <button
                  onClick={() => {
                    notificationService.stopEmergencyOrderRingtone();
                    sounds.playButtonClick();
                    acceptRideByDriver(currentDriver.id);
                  }}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3.5 px-3 rounded-2xl text-xs uppercase tracking-wider transition shadow-xl flex items-center justify-center space-x-2 active:scale-98"
                >
                  <span>ACCEPT</span>
                  <span className="bg-slate-950/20 text-slate-950 font-mono text-[10px] px-2 py-0.5 rounded-full font-extrabold">
                    {requestTimer}s
                  </span>
                </button>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Driver Chat Modal */}
      {showChatModal && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Chat with Rider</h3>
              <button onClick={() => setShowChatModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="h-48 overflow-y-auto space-y-2 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-xs">
              {chatMessages.length === 0 ? (
                <div className="text-center text-slate-400 py-8">No messages yet. Send a message to rider!</div>
              ) : (
                chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-2.5 rounded-xl max-w-[80%] ${
                      msg.sender === 'driver'
                        ? 'bg-emerald-500 text-slate-950 font-bold ml-auto'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-medium'
                    }`}
                  >
                    <div>{msg.text}</div>
                    <div className="text-[9px] opacity-70 text-right mt-0.5">{msg.timestamp}</div>
                  </div>
                ))
              )}
            </div>

            <div className="flex space-x-2">
              <input
                type="text"
                placeholder="Type a message (e.g., I have arrived!)..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && chatInput.trim()) {
                    sendMessage(chatInput.trim());
                    setChatInput('');
                  }
                }}
                className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs outline-none focus:border-emerald-500"
              />
              <button
                onClick={() => {
                  if (chatInput.trim()) {
                    sendMessage(chatInput.trim());
                    setChatInput('');
                  }
                }}
                className="px-4 py-2 bg-emerald-500 text-slate-950 font-black text-xs rounded-xl"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Render All Submodals & Drawers */}
      <SafetyCentreDrawer
        isOpen={showSafetyDrawer}
        onClose={() => setShowSafetyDrawer(false)}
        onTriggerSos={() => setShowSosModal(true)}
      />
      <ServiceTypesModal
        isOpen={showServiceTypesModal}
        onClose={() => setShowServiceTypesModal(false)}
      />
      <WorkingCapitalModal
        isOpen={showWorkingCapitalModal}
        onClose={() => setShowWorkingCapitalModal(false)}
      />
      <RideOrderDetailsModal
        isOpen={showOrderDetailsModal}
        onClose={() => setShowOrderDetailsModal(false)}
      />
      <DriverRegistrationModal
        isOpen={showRegistrationModal}
        onClose={() => setShowRegistrationModal(false)}
      />
      <DriverSupportTickets isOpen={showSupportModal} onClose={() => setShowSupportModal(false)} />
      <DriverFatigueModal
        isOpen={showFatigueModal}
        hoursOnline={currentDriver.hoursOnline}
        onTakeBreak={() => {
          toggleDriverOnline(false);
          setShowFatigueModal(false);
        }}
        onClose={() => setShowFatigueModal(false)}
      />
      <DriverCommissionWalletModal
        isOpen={showWalletModal}
        onClose={() => {
          setShowWalletModal(false);
          dismissLowBalanceAlert();
        }}
      />
      <DestinationModeModal
        isOpen={showDestinationModal}
        onClose={() => setShowDestinationModal(false)}
        activeDestination={destinationFilter}
        onSetDestination={setDestinationFilter}
      />
      <DriverHotspotsModal
        isOpen={showHotspotsModal}
        onClose={() => setShowHotspotsModal(false)}
      />
      <VehicleHealthModal
        isOpen={showVehicleModal}
        onClose={() => setShowVehicleModal(false)}
      />
      <DriverQuotasQuestModal
        isOpen={showQuotasModal}
        onClose={() => setShowQuotasModal(false)}
      />
      <DriverEmergencySosModal
        isOpen={showSosModal}
        onClose={() => setShowSosModal(false)}
      />
      <AppInfoWalletModal
        isOpen={showAppInfoModal}
        onClose={() => setShowAppInfoModal(false)}
      />

      {/* Transfer Order to Another Driver Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
                  🔄
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Transfer Order to Another Driver</h3>
                  <p className="text-[11px] text-slate-400">Forward this trip dispatch to nearby online drivers</p>
                </div>
              </div>
              <button onClick={() => setShowTransferModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {transferNotification ? (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto animate-bounce" />
                <p className="text-xs font-bold text-emerald-800 dark:text-emerald-200">{transferNotification}</p>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                  Select a nearby online driver to receive this order, or auto-assign to the next available driver in queue:
                </p>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {drivers
                    .filter((d) => d.id !== currentDriver.id)
                    .map((d) => (
                      <div
                        key={d.id}
                        className="p-3 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between transition"
                      >
                        <div className="flex items-center space-x-3">
                          <img
                            src={d.avatar}
                            alt={d.name}
                            className="w-10 h-10 rounded-full object-cover border border-emerald-500"
                          />
                          <div>
                            <div className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center space-x-1">
                              <span>{d.name}</span>
                              <span className="text-[10px] text-amber-400 font-bold">★ {d.rating}</span>
                            </div>
                            <div className="text-[11px] text-slate-500 font-medium">
                              {d.vehicle.model} • <span className="text-emerald-500 font-bold">{d.status}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            const res = transferRideToAnotherDriver(d.id);
                            setTransferNotification(res.message);
                            setTimeout(() => {
                              setShowTransferModal(false);
                              setTransferNotification(null);
                            }, 2200);
                          }}
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider transition shadow-md"
                        >
                          Transfer
                        </button>
                      </div>
                    ))}
                </div>

                <button
                  onClick={() => {
                    const res = transferRideToAnotherDriver();
                    setTransferNotification(res.message);
                    setTimeout(() => {
                      setShowTransferModal(false);
                      setTransferNotification(null);
                    }, 2200);
                  }}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 text-white font-black rounded-2xl text-xs uppercase tracking-wider shadow-xl transition"
                >
                  ⚡ Auto-Transfer to Nearest Driver
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
