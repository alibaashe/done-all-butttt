import { Activity, Car, CreditCard, Database, DollarSign, Eye, Globe, Layers, MapPin, Megaphone, MessageCircle, PhoneIncoming, Play, Radio, RefreshCw, Server, Shield, ShieldAlert, ShieldCheck, Sliders, Tag, TrendingUp, UserCheck, Users, Wallet, Zap } from 'lucide-react';
import React, { useState } from 'react';
import { useRide } from '../../context/RideContext';
import { formatCurrency } from '../../utils/geo';
import { getApiUrl } from '../../services/apiConfig';
import { UnifiedMap } from '../Map/UnifiedMap';
import { BroadcastManager } from './BroadcastManager';
import { CouponManager } from './CouponManager';
import { DriverApprovalTable } from './DriverApprovalTable';
import { DriverTopUpControlTable } from './DriverTopUpControlTable';
import { PaymentGatewaysConfig } from './PaymentGatewaysConfig';
import { PricingSurgeControl } from './PricingSurgeControl';
import { RolePermissionManager } from './RolePermissionManager';
import { UserManagementTable } from './UserManagementTable';
import { GodsEyeViewMap } from './GodsEyeViewMap';
import { GeofenceZoneManager } from './GeofenceZoneManager';
import { FraudDetectionPanel } from './FraudDetectionPanel';
import { MarketingEngineModal } from './MarketingEngineModal';
import { ManualDispatchConsole } from './ManualDispatchConsole';
import { DriverKYCModal } from './DriverKYCModal';
import { TransactionHistoryModal } from './TransactionHistoryModal';
import { FiveManagersControlPanel } from './FiveManagersControlPanel';
import { FlowMatchingControlCenter } from './FlowMatchingControlCenter';
import { HostingerDeployManager } from './HostingerDeployManager';
import { HostingerDatabaseStudio } from './HostingerDatabaseStudio';
import { PlayStorePublishingModal } from './PlayStorePublishingModal';
import { WhatsAppOtpControlPanel } from './WhatsAppOtpControlPanel';
import { SecurityEncryptionCenter } from './SecurityEncryptionCenter';
import { WebsiteCmsManager } from './WebsiteCmsManager';

export const AdminDashboard: React.FC = () => {
  const { drivers, currentRide, pricing, dispatchDriverToRide, driverWalletTransactions } = useRide();
  const [activeTab, setActiveTab] = useState<
    'dispatch' | 'flow_matching' | 'pricing' | 'approval' | 'topup' | 'users' | 'broadcast' | 'coupons' | 'roles' | 'payments' | 'whatsapp' | 'security' | 'hostinger' | 'database' | 'playstore' | 'website_cms'
  >('dispatch');
  const [showSurgeHeatmap, setShowSurgeHeatmap] = useState(true);

  const pendingTopUpCount = driverWalletTransactions.filter((tx) => tx.status === 'pending_verification').length;

  // Modals for sophisticated features
  const [showGodsEyeModal, setShowGodsEyeModal] = useState(false);
  const [showGeofenceModal, setShowGeofenceModal] = useState(false);
  const [showFraudModal, setShowFraudModal] = useState(false);
  const [showMarketingModal, setShowMarketingModal] = useState(false);
  const [showManualDispatchModal, setShowManualDispatchModal] = useState(false);
  const [showKycModal, setShowKycModal] = useState(false);
  const [showTxModal, setShowTxModal] = useState(false);
  const [isPurgingDuplicates, setIsPurgingDuplicates] = useState(false);
  const [duplicateResult, setDuplicateResult] = useState<string | null>(null);

  const handleScanAndPurgeDuplicates = async () => {
    setIsPurgingDuplicates(true);
    setDuplicateResult(null);
    try {
      const res = await fetch(getApiUrl('/api/rides/cleanup-duplicates'), { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setDuplicateResult(
          data.cleanedCount > 0
            ? `Successfully scanned and removed ${data.cleanedCount} duplicate/ghost order(s). Remaining active: ${data.remainingSearchingCount}.`
            : `All clean! No duplicate orders found in live system. System concurrency verified.`
        );
      } else {
        setDuplicateResult('Server responded with error while scanning duplicate orders.');
      }
    } catch (err: any) {
      setDuplicateResult(`Error running deduplication: ${err?.message || 'Network error'}`);
    } finally {
      setIsPurgingDuplicates(false);
    }
  };

  const activeOnlineCount = drivers.filter((d) => d.status !== 'offline').length;
  const busyCount = drivers.filter((d) => d.status === 'busy').length;
  const platformRevenue = 1420.50 * (pricing.platformCommissionPercent / 100);

  const handleOpenModalFromName = (name: string) => {
    if (name === 'GodsEye') setShowGodsEyeModal(true);
    else if (name === 'Geofence') setShowGeofenceModal(true);
    else if (name === 'Fraud') setShowFraudModal(true);
    else if (name === 'Marketing') setShowMarketingModal(true);
    else if (name === 'ManualDispatch') setShowManualDispatchModal(true);
    else if (name === 'DriverKYC') setShowKycModal(true);
    else if (name === 'TransactionHistory') setShowTxModal(true);
  };

  return (
    <div className="space-y-5">
      {/* 5-Manager Executive Command Station */}
      <FiveManagersControlPanel
        onOpenModal={handleOpenModalFromName}
        onSelectTab={(tab) => setActiveTab(tab as any)}
      />

      {/* Top Admin KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-bold uppercase tracking-wider text-[10px]">Total GMV Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-black text-emerald-400">$1,420.50</div>
          <span className="text-[10px] text-emerald-500 font-semibold">+18.4% today</span>
        </div>

        <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-bold uppercase tracking-wider text-[10px]">Platform Net Profit</span>
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-black text-white">{formatCurrency(platformRevenue)}</div>
          <span className="text-[10px] text-slate-400">{pricing.platformCommissionPercent}% Commission</span>
        </div>

        <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-bold uppercase tracking-wider text-[10px]">Active Fleet Drivers</span>
            <Car className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl font-black text-blue-400">
            {activeOnlineCount} Online <span className="text-xs font-normal text-slate-400">({busyCount} busy)</span>
          </div>
          <span className="text-[10px] text-emerald-400 font-semibold">100% Verified</span>
        </div>

        <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 shadow-md">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1">
            <span className="font-bold uppercase tracking-wider text-[10px]">City Surge Rate</span>
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-black text-amber-400">
            {pricing.currentSurgeMultiplier.toFixed(2)}x
          </div>
          <span className="text-[10px] text-amber-500 font-semibold">High Demand Downtown</span>
        </div>
      </div>

      {/* Quick Launchpad Action Bar for Advanced Admin Modules */}
      <div className="grid grid-cols-2 sm:grid-cols-7 gap-2 bg-slate-950 p-2 rounded-2xl border border-slate-800 text-xs font-bold text-white">
        <button
          onClick={() => setShowGodsEyeModal(true)}
          className="p-2 bg-slate-900 hover:bg-slate-800 border border-emerald-500/30 rounded-xl flex items-center justify-center gap-1.5 text-emerald-400 transition"
        >
          <Eye className="w-4 h-4" />
          <span>God&apos;s Eye</span>
        </button>

        <button
          onClick={() => setShowGeofenceModal(true)}
          className="p-2 bg-slate-900 hover:bg-slate-800 border border-indigo-500/30 rounded-xl flex items-center justify-center gap-1.5 text-indigo-400 transition"
        >
          <Layers className="w-4 h-4" />
          <span>Geofences</span>
        </button>

        <button
          onClick={() => setShowFraudModal(true)}
          className="p-2 bg-slate-900 hover:bg-slate-800 border border-red-500/30 rounded-xl flex items-center justify-center gap-1.5 text-red-400 transition"
        >
          <ShieldAlert className="w-4 h-4" />
          <span>AI Fraud</span>
        </button>

        <button
          onClick={() => setShowMarketingModal(true)}
          className="p-2 bg-slate-900 hover:bg-slate-800 border border-purple-500/30 rounded-xl flex items-center justify-center gap-1.5 text-purple-400 transition"
        >
          <Megaphone className="w-4 h-4" />
          <span>Push Ads</span>
        </button>

        <button
          onClick={() => setShowManualDispatchModal(true)}
          className="p-2 bg-slate-900 hover:bg-slate-800 border border-blue-500/30 rounded-xl flex items-center justify-center gap-1.5 text-blue-400 transition"
        >
          <PhoneIncoming className="w-4 h-4" />
          <span>Dispatch</span>
        </button>

        <button
          onClick={() => setShowKycModal(true)}
          className="p-2 bg-slate-900 hover:bg-slate-800 border border-teal-500/30 rounded-xl flex items-center justify-center gap-1.5 text-teal-400 transition"
        >
          <UserCheck className="w-4 h-4" />
          <span>Driver KYC</span>
        </button>

        <button
          onClick={() => setShowTxModal(true)}
          className="p-2 bg-slate-900 hover:bg-slate-800 border border-amber-500/30 rounded-xl flex items-center justify-center gap-1.5 text-amber-400 transition"
        >
          <CreditCard className="w-4 h-4" />
          <span>TX Logs</span>
        </button>
      </div>

      {/* Admin Tab Bar */}
      <div className="bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center space-x-2 shadow-sm overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('dispatch')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 ${
            activeTab === 'dispatch'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Radio className="w-4 h-4" />
          <span>Dispatch Radar</span>
        </button>

        <button
          onClick={() => setActiveTab('flow_matching')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 ${
            activeTab === 'flow_matching'
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-black shadow-md ring-2 ring-emerald-400/40'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Zap className="w-4 h-4 text-emerald-400 fill-current" />
          <span>Wadaage Share & Stacking</span>
          <span className="bg-emerald-500/20 text-emerald-400 text-[9px] px-1.5 py-0.2 rounded-full font-black uppercase">
            Core
          </span>
        </button>

        <button
          onClick={() => setActiveTab('pricing')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 ${
            activeTab === 'pricing'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Pricing & Surge</span>
        </button>

        <button
          onClick={() => setActiveTab('broadcast')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 ${
            activeTab === 'broadcast'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>Broadcasts</span>
        </button>

        <button
          onClick={() => setActiveTab('coupons')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 ${
            activeTab === 'coupons'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Coupons & Promos</span>
        </button>

        <button
          onClick={() => setActiveTab('approval')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 ${
            activeTab === 'approval'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Driver Approvals</span>
        </button>

        <button
          onClick={() => setActiveTab('topup')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 relative ${
            activeTab === 'topup'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>Driver Wallets & Top-Ups</span>
          {pendingTopUpCount > 0 && (
            <span className="ml-1 px-1.5 py-0.2 bg-amber-500 text-slate-950 font-black text-[10px] rounded-full animate-pulse">
              {pendingTopUpCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 ${
            activeTab === 'users'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Directory</span>
        </button>

        <button
          onClick={() => setActiveTab('roles')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 ${
            activeTab === 'roles'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Staff Roles</span>
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 ${
            activeTab === 'payments'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Payment Gateways</span>
        </button>

        <button
          onClick={() => setActiveTab('whatsapp')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 ${
            activeTab === 'whatsapp'
              ? 'bg-emerald-500 text-slate-950 shadow-md font-black ring-2 ring-emerald-400/40'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <MessageCircle className="w-4 h-4 text-emerald-400" />
          <span>WhatsApp OTP Control</span>
          <span className="bg-emerald-500/20 text-emerald-300 text-[9px] px-1.5 py-0.2 rounded-full font-black uppercase">
            API Live
          </span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 ${
            activeTab === 'security'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md font-black ring-2 ring-indigo-400/40'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-indigo-400" />
          <span>Security & AES-256</span>
          <span className="bg-indigo-500/20 text-indigo-300 text-[9px] px-1.5 py-0.2 rounded-full font-black uppercase">
            Grade A+
          </span>
        </button>

        <button
          onClick={() => setActiveTab('hostinger')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 ${
            activeTab === 'hostinger'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Server className="w-4 h-4 text-indigo-400" />
          <span>Hostinger Deploy</span>
          <span className="bg-indigo-500/20 text-indigo-300 text-[9px] px-1.5 py-0.2 rounded-full font-black uppercase">
            Hosting
          </span>
        </button>

        <button
          onClick={() => setActiveTab('database')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 ${
            activeTab === 'database'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md font-black ring-2 ring-emerald-400/40'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Database className="w-4 h-4 text-emerald-400" />
          <span>Firebase Cloud Database</span>
          <span className="bg-emerald-500/20 text-emerald-300 text-[9px] px-1.5 py-0.2 rounded-full font-black uppercase">
            Live
          </span>
        </button>

        <button
          onClick={() => setActiveTab('playstore')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 ${
            activeTab === 'playstore'
              ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Play className="w-4 h-4 text-emerald-400 fill-current" />
          <span>Play Store (Rider & Driver)</span>
          <span className="bg-emerald-500/20 text-emerald-300 text-[9px] px-1.5 py-0.2 rounded-full font-black uppercase">
            2 Apps
          </span>
        </button>

        <button
          onClick={() => setActiveTab('website_cms')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shrink-0 ${
            activeTab === 'website_cms'
              ? 'bg-gradient-to-r from-blue-600 to-emerald-600 text-white shadow-md font-black ring-2 ring-emerald-400/40'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Globe className="w-4 h-4 text-emerald-400" />
          <span>Website CMS (wadaage.com)</span>
          <span className="bg-emerald-500/20 text-emerald-300 text-[9px] px-1.5 py-0.2 rounded-full font-black uppercase">
            Live Landing
          </span>
        </button>
      </div>

      {/* Tab Panels */}
      {activeTab === 'dispatch' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                Real-Time City Fleet Map & Dispatch Radar
              </h3>
              <p className="text-xs text-slate-500">
                Monitoring active driver movements, pickup pins, and surge heatmap
              </p>
            </div>
            <button
              onClick={() => setShowSurgeHeatmap(!showSurgeHeatmap)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                showSurgeHeatmap
                  ? 'bg-amber-500 text-slate-950 border-amber-500'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-300 text-slate-600'
              }`}
            >
              Surge Heatmap: {showSurgeHeatmap ? 'ON' : 'OFF'}
            </button>
          </div>

          <div className="h-[420px] rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-800">
            <UnifiedMap showSurgeHeatmap={showSurgeHeatmap} height="100%" />
          </div>

          {/* Active Dispatch Requests & Manual Override */}
          {currentRide && (
            <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase text-emerald-400">
                  Active Ride Session #{currentRide.id}
                </span>
                <span className="text-xs font-bold bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                  Status: {(currentRide.status || 'active').toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Passenger: <b>{currentRide.passengerName}</b> • Route: {currentRide.pickup?.name || 'Pickup'} → {currentRide.dropoff?.name || 'Dropoff'} ({currentRide.distanceKm} km)
              </p>

              {/* Manual Override dispatch selector */}
              {currentRide.status === 'searching' && (
                <div className="bg-slate-800 p-3 rounded-xl flex items-center justify-between gap-2 text-xs">
                  <span className="font-bold">Manual Driver Override:</span>
                  <div className="flex items-center space-x-2">
                    {drivers.slice(0, 3).map((drv) => (
                      <button
                        key={drv.id}
                        onClick={() => dispatchDriverToRide(currentRide.id, drv.id)}
                        className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg transition-all"
                      >
                        Assign {drv.name.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Order Integrity & Duplicate Purge Controller */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-500" />
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                    Fleet Concurrency & Duplicate Order Guardian
                  </h4>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Protects drivers and passengers against duplicate bookings, phantom ghost trips, and race condition conflicts.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleScanAndPurgeDuplicates}
                  disabled={isPurgingDuplicates}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all shadow-md flex items-center space-x-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isPurgingDuplicates ? 'animate-spin' : ''}`} />
                  <span>{isPurgingDuplicates ? 'Scanning & Cleaning...' : 'Scan & Clean Duplicate Orders'}</span>
                </button>
              </div>
            </div>

            {duplicateResult && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
                <span>{duplicateResult}</span>
                <button onClick={() => setDuplicateResult(null)} className="font-bold underline text-[11px]">Dismiss</button>
              </div>
            )}

            {/* Hybrid Database Architecture Status Badge */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold text-xs mb-1">
                  <Database className="w-4 h-4 text-sky-500" />
                  <span>Hostinger MySQL (Core Business Data)</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Users, Drivers, KYC Applications, Wallet Balances, Financial Audits, Promos, Platform Settings, Archived Completed Trips.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
                <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-bold text-xs mb-1">
                  <Zap className="w-4 h-4 text-amber-500" />
                  <span>Firebase & High-Speed Ingress (Real-Time Operations)</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  High-frequency GPS Telemetry, Radar Driver Locations, Active Ride Mutex Locks, Instant SSE Push Events.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'flow_matching' && <FlowMatchingControlCenter />}
      {activeTab === 'pricing' && <PricingSurgeControl />}
      {activeTab === 'broadcast' && <BroadcastManager />}
      {activeTab === 'coupons' && <CouponManager />}
      {activeTab === 'approval' && <DriverApprovalTable />}
      {activeTab === 'topup' && <DriverTopUpControlTable />}
      {activeTab === 'users' && <UserManagementTable />}
      {activeTab === 'roles' && <RolePermissionManager />}
      {activeTab === 'payments' && <PaymentGatewaysConfig />}
      {activeTab === 'whatsapp' && <WhatsAppOtpControlPanel />}
      {activeTab === 'security' && <SecurityEncryptionCenter />}
      {activeTab === 'hostinger' && <HostingerDeployManager />}
      {activeTab === 'database' && <HostingerDatabaseStudio />}
      {activeTab === 'playstore' && <PlayStorePublishingModal isEmbedded />}
      {activeTab === 'website_cms' && <WebsiteCmsManager onPreviewWebsite={() => window.open('/?app=website', '_blank')} />}

      {/* Render Admin Modals */}
      <GodsEyeViewMap isOpen={showGodsEyeModal} onClose={() => setShowGodsEyeModal(false)} />
      <GeofenceZoneManager isOpen={showGeofenceModal} onClose={() => setShowGeofenceModal(false)} />
      <FraudDetectionPanel isOpen={showFraudModal} onClose={() => setShowFraudModal(false)} />
      <MarketingEngineModal isOpen={showMarketingModal} onClose={() => setShowMarketingModal(false)} />
      <ManualDispatchConsole isOpen={showManualDispatchModal} onClose={() => setShowManualDispatchModal(false)} />
      <DriverKYCModal isOpen={showKycModal} onClose={() => setShowKycModal(false)} />
      <TransactionHistoryModal isOpen={showTxModal} onClose={() => setShowTxModal(false)} />
    </div>
  );
};
