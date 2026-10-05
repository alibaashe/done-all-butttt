import { Activity, AlertTriangle, Award, Bike, Car, CheckCircle2, ShieldCheck, DollarSign, Eye, Filter, Layers, Lock, Megaphone, Navigation, Percent, PhoneIncoming, Radio, RefreshCw, Save, Shield, ShieldAlert, Sliders, Sparkles, Tag, TrendingUp, UserCheck, Users, Wallet, Zap } from 'lucide-react';
import React, { useState } from 'react';
import { useRide } from '../../context/RideContext';
import { DEFAULT_CATEGORY_CONFIGS } from '../../data/mockData';
import { CategoryServiceConfig } from '../../types';
import { formatCurrency } from '../../utils/geo';

interface FiveManagersControlPanelProps {
  onOpenModal?: (modalName: string) => void;
  onSelectTab?: (tabName: string) => void;
}

export const FiveManagersControlPanel: React.FC<FiveManagersControlPanelProps> = ({
  onOpenModal,
  onSelectTab,
}) => {
  const { drivers, currentRide, pricing, updatePricing, dispatchDriverToRide } = useRide();
  const [selectedManager, setSelectedManager] = useState<
    'fleet' | 'dispatch' | 'kyc' | 'finance' | 'growth'
  >('fleet');

  const [categoryConfigs, setCategoryConfigs] = useState<Record<string, CategoryServiceConfig>>(
    pricing.categoryConfigs || DEFAULT_CATEGORY_CONFIGS
  );

  const [savedAlert, setSavedAlert] = useState<string | null>(null);

  const activeOnlineDrivers = drivers.filter((d) => d.status !== 'offline');
  const pendingKycDrivers = drivers.filter((d) => !d.isVerified || d.kycStatus === 'pending');
  const busyDriversCount = drivers.filter((d) => d.status === 'busy').length;

  const triggerSaveAlert = (msg: string) => {
    setSavedAlert(msg);
    setTimeout(() => setSavedAlert(null), 3000);
  };

  const handleUpdateCategory = (catKey: string, updates: Partial<CategoryServiceConfig>) => {
    const updated = {
      ...categoryConfigs,
      [catKey]: {
        ...categoryConfigs[catKey],
        ...updates,
      },
    };
    setCategoryConfigs(updated);
    updatePricing({ ...pricing, categoryConfigs: updated });
    triggerSaveAlert(`Updated ${categoryConfigs[catKey]?.name || catKey} configuration!`);
  };

  const managersList = [
    {
      id: 'fleet' as const,
      title: '1. Fleet & Services Manager',
      somaliTitle: 'Maamulaha Gaadiidka & Adeegyada',
      subtitle: 'Manage Wadaage Share & Normal Taxi',
      icon: Car,
      badge: '5 Categories',
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      color: 'emerald',
    },
    {
      id: 'dispatch' as const,
      title: '2. Dispatch & Live Operations',
      somaliTitle: 'Maamulaha Gurmadka & Khariidadda',
      subtitle: 'Live Radar, God Eye Map, Driver Assign & SOS',
      icon: Radio,
      badge: `${activeOnlineDrivers.length} Online Drivers`,
      badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      color: 'blue',
    },
    {
      id: 'kyc' as const,
      title: '3. Driver KYC & Approvals',
      somaliTitle: 'Diiwaangalinta & Ansixinta Darawalada',
      subtitle: 'Document verification, background checks & ratings',
      icon: UserCheck,
      badge: `${pendingKycDrivers.length} Pending`,
      badgeColor: pendingKycDrivers.length > 0 ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      color: 'amber',
    },
    {
      id: 'finance' as const,
      title: '4. Finance, Surge & Wallet',
      somaliTitle: 'Maamulaha Lacagaha & Shandada EVC/Sahal',
      subtitle: 'EVC/Sahal/Zaad, platform revenue & prepaid wallets',
      icon: Wallet,
      badge: `$1,420.50 GMV Today`,
      badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      color: 'purple',
    },
    {
      id: 'growth' as const,
      title: '5. Growth, Marketing & Access',
      somaliTitle: 'Maamulaha Xayeysiinta & Ogolaanshaha',
      subtitle: 'Push broadcasts, promo coupons & staff role permissions',
      icon: Megaphone,
      badge: 'Promo Active',
      badgeColor: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
      color: 'teal',
    },
  ];

  return (
    <div className="bg-slate-950 text-white rounded-3xl border border-slate-800 p-5 shadow-2xl space-y-6">
      {/* 5 Managers Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2.5">
            <span className="p-2 bg-emerald-500 text-slate-950 rounded-xl font-black text-sm flex items-center justify-center">
              <Sliders className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-black text-white tracking-tight">
              5-Manager Wadaage Command Center
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Complete executive oversight: Control all 5 transport services, live dispatch radar, driver KYC approvals, mobile money wallets & growth marketing.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {onOpenModal && (
            <button
              onClick={() => onOpenModal('GodsEye')}
              className="px-3.5 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-bold transition flex items-center space-x-1.5"
            >
              <Eye className="w-4 h-4" />
              <span>Full Screen God&apos;s Eye</span>
            </button>
          )}
          {onOpenModal && (
            <button
              onClick={() => onOpenModal('Fraud')}
              className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 rounded-xl text-xs font-bold transition flex items-center space-x-1.5"
            >
              <ShieldAlert className="w-4 h-4" />
              <span>AI Security Monitor</span>
            </button>
          )}
        </div>
      </div>

      {savedAlert && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl text-xs font-bold flex items-center justify-center space-x-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{savedAlert}</span>
        </div>
      )}

      {/* 5 Managers Selection Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {managersList.map((mgr) => {
          const IconComponent = mgr.icon;
          const isSelected = selectedManager === mgr.id;

          return (
            <button
              key={mgr.id}
              onClick={() => setSelectedManager(mgr.id)}
              className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between space-y-3 relative overflow-hidden ${
                isSelected
                  ? 'bg-slate-900 border-emerald-500 shadow-xl ring-2 ring-emerald-500/30'
                  : 'bg-slate-900/60 border-slate-800 hover:bg-slate-900 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`p-2 rounded-xl font-bold ${
                    isSelected ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  <IconComponent className="w-5 h-5" />
                </span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${mgr.badgeColor}`}>
                  {mgr.badge}
                </span>
              </div>

              <div>
                <h3 className="font-extrabold text-xs text-white leading-snug">{mgr.title}</h3>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">{mgr.somaliTitle}</p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-bold">
                <span className={isSelected ? 'text-emerald-400' : 'text-slate-500'}>
                  {isSelected ? 'Active Controls Below' : 'Click to Manage'}
                </span>
                <span className="text-slate-500">→</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* MANAGER DETAIL PANELS */}

      {/* MANAGER 1: Fleet & Services Manager */}
      {selectedManager === 'fleet' && (
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-5 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-black text-emerald-400 flex items-center gap-2">
                <Car className="w-5 h-5 text-emerald-400" />
                <span>1. Fleet & Services Control (All 5 Wadaage Categories)</span>
              </h3>
              <p className="text-xs text-slate-400">
              Configure rates, status modes (Active/Surge/Suspended), and capacity for Gaadhi Wadaag and Private Sedan Taxi.
              </p>
            </div>
            {onSelectTab && (
              <button
                onClick={() => onSelectTab('pricing')}
                className="text-xs text-emerald-400 hover:underline font-bold self-start sm:self-auto"
              >
                Open Full Matrix Editor →
              </button>
            )}
          </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { id: 'wadaage_share', name: 'Wadaage Share', somali: 'Gaadhi Wadaag', icon: Users, color: 'border-emerald-500/40' },
              { id: 'wadaage_taxi', name: 'Normal Taxi', somali: 'Taaksi Caadi ah', icon: Car, color: 'border-blue-500/40' },
            ].map((cat) => {
              const config = categoryConfigs[cat.id] || DEFAULT_CATEGORY_CONFIGS[cat.id];
              const IconComp = cat.icon;
              const isEnabled = config?.enabled !== false;

              return (
                <div
                  key={cat.id}
                  className={`bg-slate-950 p-3.5 rounded-xl border ${cat.color} space-y-3 flex flex-col justify-between`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5">
                      <IconComp className="w-4 h-4 text-emerald-400" />
                      <span className="font-extrabold text-xs text-white">{cat.name}</span>
                    </div>
                    <button
                      onClick={() =>
                        handleUpdateCategory(cat.id, { enabled: !isEnabled })
                      }
                      className={`text-[9px] font-black px-2 py-0.5 rounded-full border transition ${
                        isEnabled
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                          : 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                      }`}
                    >
                      {isEnabled ? 'ONLINE' : 'OFFLINE'}
                    </button>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Base Fare:</span>
                      <span className="font-mono font-bold text-emerald-400">${config.baseFareUsd.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Per KM:</span>
                      <span className="font-mono font-bold text-white">${config.perKmRateUsd.toFixed(2)} ({Math.round(config.perKmRateUsd * 11250).toLocaleString()} SLSH/km)</span>
                    </div>

                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Capacity:</span>
                      <span className="font-mono font-bold text-slate-300">{config.maxPassengers} Seats</span>
                    </div>

                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Commission:</span>
                      <span className="font-mono font-bold text-emerald-400">{config.driverCommissionPercent}%</span>
                    </div>
                  </div>

                  {/* Mode Selector */}
                  <div className="pt-2 border-t border-slate-800">
                    <label className="text-[10px] text-slate-400 font-bold block mb-1">Status Mode:</label>
                    <select
                      value={config.statusMode || 'active'}
                      onChange={(e) =>
                        handleUpdateCategory(cat.id, {
                          statusMode: e.target.value as any,
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-700 text-[11px] font-bold text-white rounded-lg p-1 outline-none"
                    >
                      <option value="active">Active Standard</option>
                      <option value="surge_only">Peak/Surge Only</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MANAGER 2: Dispatch & Live Operations Manager */}
      {selectedManager === 'dispatch' && (
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-5 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-black text-blue-400 flex items-center gap-2">
                <Radio className="w-5 h-5 text-blue-400" />
                <span>2. Dispatch & Live Operations Radar</span>
              </h3>
              <p className="text-xs text-slate-400">
                Monitor real-time passenger requests, active drivers, emergency SOS signals, and execute manual driver dispatches.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {onOpenModal && (
                <button
                  onClick={() => onOpenModal('Geofence')}
                  className="px-3 py-1.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-xl text-xs font-bold hover:bg-indigo-500/30 transition"
                >
                  Geofence Zones
                </button>
              )}
              {onOpenModal && (
                <button
                  onClick={() => onOpenModal('ManualDispatch')}
                  className="px-3 py-1.5 bg-blue-500 text-slate-950 rounded-xl text-xs font-bold hover:bg-blue-400 transition"
                >
                  Call Center Dispatcher
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Active Ride Session Status */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <span className="text-[10px] font-black uppercase text-blue-400 tracking-wider block">
                Active Booking Dispatch
              </span>
              {currentRide ? (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-white">Ride #{currentRide.id}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      {(currentRide.status || 'active').toUpperCase()}
                    </span>
                  </div>
                  <p className="text-slate-300">
                    Passenger: <b>{currentRide.passengerName}</b> ({currentRide.passengerPhone})
                  </p>
                  <p className="text-slate-400 text-[11px]">
                    Route: {currentRide.pickup?.name || 'Pickup'} → {currentRide.dropoff?.name || 'Dropoff'}
                  </p>
                  <div className="text-emerald-400 font-mono font-bold">
                    Fare: ${currentRide.totalFare.toFixed(2)} ({currentRide.categoryName})
                  </div>

                  {currentRide.status === 'searching' && (
                    <div className="pt-2 border-t border-slate-800 space-y-1.5">
                      <label className="text-[10px] text-slate-400 font-bold block">
                        Manual Override Driver Assignment:
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {drivers.slice(0, 4).map((drv) => (
                          <button
                            key={drv.id}
                            onClick={() => dispatchDriverToRide(currentRide.id, drv.id)}
                            className="px-2 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-[10px] rounded-lg transition"
                          >
                            Assign {drv.name.split(' ')[0]}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 text-slate-500 space-y-1">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500/40 mx-auto" />
                  <p className="text-xs font-bold text-slate-400">All Booking Demands Dispatched</p>
                  <p className="text-[10px]">No pending rides waiting in queue.</p>
                </div>
              )}
            </div>

            {/* City Fleet Status Breakdown */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider block">
                Driver Radar Status
              </span>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center p-2 bg-slate-900 rounded-lg border border-slate-800">
                  <span className="text-slate-300 font-bold">Online & Active:</span>
                  <span className="font-mono font-black text-emerald-400">{activeOnlineDrivers.length} Drivers</span>
                </div>

                <div className="flex justify-between items-center p-2 bg-slate-900 rounded-lg border border-slate-800">
                  <span className="text-slate-300 font-bold">Currently On Trip (Busy):</span>
                  <span className="font-mono font-black text-blue-400">{busyDriversCount} Drivers</span>
                </div>

                <div className="flex justify-between items-center p-2 bg-slate-900 rounded-lg border border-slate-800">
                  <span className="text-slate-300 font-bold">Offline / Resting:</span>
                  <span className="font-mono font-black text-slate-400">
                    {drivers.length - activeOnlineDrivers.length} Drivers
                  </span>
                </div>
              </div>
            </div>

            {/* Emergency SOS & Safety Lock */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <span className="text-[10px] font-black uppercase text-rose-400 tracking-wider block">
                Safety & Emergency SOS Monitor
              </span>

              <div className="bg-rose-500/10 border border-rose-500/30 p-3 rounded-xl space-y-1.5 text-xs">
                <div className="flex items-center space-x-2 text-rose-400 font-bold">
                  <ShieldAlert className="w-4 h-4" />
                  <span>0 Emergency Distresses Active</span>
                </div>
                <p className="text-[10px] text-slate-300">
                  Police & emergency dispatcher hotline ready. Audio & location logs continuously audited.
                </p>
              </div>

              <button
                onClick={() => triggerSaveAlert('Emergency SOS safety protocol broadcast sent to city dispatch!')}
                className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-2 rounded-xl text-xs transition uppercase"
              >
                Trigger City Safety Alert
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MANAGER 3: Driver KYC & Approvals Manager */}
      {selectedManager === 'kyc' && (
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-5 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-black text-amber-400 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-amber-400" />
                <span>3. Driver Operations & KYC Verification Manager</span>
              </h3>
              <p className="text-xs text-slate-400">
                Audit driver licenses, vehicle photos, background checks, and maintain prepaid wallet eligibility rules.
              </p>
            </div>
            {onOpenModal && (
              <button
                onClick={() => onOpenModal('DriverKYC')}
                className="px-3.5 py-1.5 bg-amber-500 text-slate-950 rounded-xl text-xs font-bold hover:bg-amber-400 transition"
              >
                Open Full KYC Modal
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Driver Queue Table */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider block">
                Recent Driver Registration Applications
              </span>

              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {drivers.length === 0 ? (
                  <div className="text-center py-6 text-slate-500 text-xs">
                    <UserCheck className="w-8 h-8 mx-auto mb-1 text-slate-600" />
                    <p className="font-bold text-slate-400">No Driver Applications in Queue</p>
                    <p className="text-[10px]">Drivers will appear here when they register from the mobile app.</p>
                  </div>
                ) : (
                  drivers.map((drv) => (
                    <div
                      key={drv.id}
                      className="flex items-center justify-between p-2.5 bg-slate-900 rounded-xl border border-slate-800 text-xs"
                    >
                      <div className="flex items-center space-x-2.5">
                        <img
                          src={drv.avatar}
                          alt={drv.name}
                          className="w-8 h-8 rounded-full object-cover border border-slate-700"
                        />
                        <div>
                          <h4 className="font-bold text-white">{drv.name}</h4>
                          <p className="text-[10px] text-slate-400">
                            {drv.vehicle.model} ({drv.vehicle.licensePlate})
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span
                          className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                            drv.isVerified
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                          }`}
                        >
                          {drv.isVerified ? 'VERIFIED' : 'PENDING'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Prepaid Wallet & Lockout Threshold Rule Controls */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
              <span className="text-[10px] font-black uppercase text-emerald-400 tracking-wider block">
                Prepaid Wallet & Automatic Lockout Rules
              </span>

              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-300">Min Required Wallet Balance:</span>
                  <span className="font-mono font-bold text-emerald-400">$0.20 (2,000 SOS)</span>
                </div>
                <p className="text-[10px] text-slate-400">
                  If a driver&apos;s prepaid wallet falls below $0.20, their dispatch availability is automatically locked until topped up via EVC/Sahal.
                </p>
              </div>

              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-slate-300">Flat Trip Commission Fee:</span>
                  <span className="font-mono font-bold text-amber-400">$0.10 (1,000 SOS)</span>
                </div>
                <p className="text-[10px] text-slate-400">
                  Automatically deducted from driver&apos;s prepaid wallet after every successful trip completion.
                </p>
              </div>

              <button
                onClick={() => triggerSaveAlert('Driver KYC & Wallet threshold policies updated!')}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black py-2 rounded-xl text-xs transition uppercase"
              >
                Enforce Mandatory KYC & Wallet Rules
              </button>

              {onSelectTab && (
                <button
                  onClick={() => onSelectTab('whatsapp')}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 border border-emerald-500/40 text-emerald-400 font-bold rounded-xl transition text-xs flex items-center justify-center space-x-1.5"
                >
                  <span>Open WhatsApp OTP Gateway Control →</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MANAGER 4: Finance, Surge & Wallet Manager */}
      {selectedManager === 'finance' && (
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-5 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-black text-purple-400 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-purple-400" />
                <span>4. Financials, Mobile Gateways & Revenue Control</span>
              </h3>
              <p className="text-xs text-slate-400">
                Track total GMV volume, platform net profit commissions, mobile payment gateway integrations (EVC Plus / Sahal / Zaad / eDahab), and driver payouts.
              </p>
            </div>
            {onOpenModal && (
              <button
                onClick={() => onOpenModal('TransactionHistory')}
                className="px-3.5 py-1.5 bg-purple-500 text-white rounded-xl text-xs font-bold hover:bg-purple-400 transition"
              >
                View Ledger Transactions
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Gross Ride Revenue</span>
              <div className="text-xl font-black text-emerald-400">$1,420.50</div>
              <span className="text-[10px] text-emerald-500 font-semibold">+18.4% today</span>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Platform Take Net Profit</span>
              <div className="text-xl font-black text-purple-400">
                {formatCurrency(1420.50 * (pricing.platformCommissionPercent / 100))}
              </div>
              <span className="text-[10px] text-slate-400">{pricing.platformCommissionPercent}% Take Rate</span>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">EVC Plus / Sahal Auto Gateway</span>
              <div className="text-xl font-black text-blue-400">CONNECTED</div>
              <span className="text-[10px] text-emerald-400">Hormuud & Telesom Live</span>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Driver Prepaid Wallets</span>
              <div className="text-xl font-black text-amber-400">$840.00 Total</div>
              <span className="text-[10px] text-slate-400">Avg $12.50 / Driver</span>
            </div>
          </div>
        </div>
      )}

      {/* MANAGER 5: Growth, Marketing & Access Manager */}
      {selectedManager === 'growth' && (
        <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-5 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-black text-teal-400 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-teal-400" />
                <span>5. Growth, Marketing Engine & Staff Role Access</span>
              </h3>
              <p className="text-xs text-slate-400">
                Send push notification broadcasts, issue discount coupon codes, and manage staff access role permissions.
              </p>
            </div>
            {onSelectTab && (
              <button
                onClick={() => onSelectTab('broadcast')}
                className="text-xs text-teal-400 hover:underline font-bold self-start sm:self-auto"
              >
                Broadcast Manager →
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Quick Push Notification Broadcast */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <span className="text-[10px] font-black uppercase text-teal-400 tracking-wider block">
                Send Mass Push Broadcast Alert
              </span>

              <div className="space-y-2 text-xs">
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Target Audience:</label>
                  <select className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2 font-bold outline-none">
                    <option value="all">All Passengers & Drivers</option>
                    <option value="passengers">Passengers Only</option>
                    <option value="drivers">Active Drivers Only</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 font-bold block mb-1">Message Banner:</label>
                  <input
                    type="text"
                    defaultValue="🎉 20% OFF your next Wadaage Share ride with code WADAAGE20!"
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-2 text-xs font-semibold outline-none"
                  />
                </div>

                <button
                  onClick={() => triggerSaveAlert('Push notification broadcast sent to all app instances!')}
                  className="w-full bg-teal-500 hover:bg-teal-600 text-slate-950 font-black py-2 rounded-xl text-xs transition uppercase"
                >
                  Broadcast Push Notification Now
                </button>
              </div>
            </div>

            {/* Staff Role Permissions Overview */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs">
              <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider block">
                Staff Control & RBAC Permissions
              </span>

              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-slate-900 rounded-lg border border-slate-800">
                  <span className="font-bold text-white">Super Admin (Founder)</span>
                  <span className="text-emerald-400 font-mono text-[10px] font-bold">FULL ACCESS</span>
                </div>

                <div className="flex justify-between items-center p-2 bg-slate-900 rounded-lg border border-slate-800">
                  <span className="font-bold text-white">City Dispatch Operator</span>
                  <span className="text-blue-400 font-mono text-[10px] font-bold">DISPATCH & MAP ONLY</span>
                </div>

                <div className="flex justify-between items-center p-2 bg-slate-900 rounded-lg border border-slate-800">
                  <span className="font-bold text-white">Finance Accountant</span>
                  <span className="text-purple-400 font-mono text-[10px] font-bold">WALLETS & LEDGER ONLY</span>
                </div>
              </div>

              {onSelectTab && (
                <button
                  onClick={() => onSelectTab('roles')}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 rounded-xl text-xs transition"
                >
                  Manage Staff Roles & Add Employees
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
