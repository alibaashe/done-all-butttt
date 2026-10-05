import { AlertTriangle, Award, Car, CheckCircle2, Coffee, FileText, Globe, KeyRound, Lock, PhoneCall, ShieldCheck, Star, Users, Volume2, Wrench } from 'lucide-react';
import React, { useState } from 'react';
import { useRide } from '../../context/RideContext';

interface DriverAccountViewProps {
  onOpenSupportModal?: () => void;
  onOpenFatigueModal?: () => void;
  onOpenVehicleModal?: () => void;
  onOpenSosModal?: () => void;
}

export const DriverAccountView: React.FC<DriverAccountViewProps> = ({
  onOpenSupportModal,
  onOpenFatigueModal,
  onOpenVehicleModal,
  onOpenSosModal,
}) => {
  const { drivers, soundEnabled, setSoundEnabled, currentUser } = useRide();
  const driver = drivers.find((d) => d.phone === currentUser?.phone || d.id === currentUser?.id) || drivers[0] || {
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
    kycStatus: 'approved',
    isVerified: true,
    vehicle: {
      model: 'Toyota Vitz',
      licensePlate: 'SL-39201',
      color: 'Silver',
      category: 'wadaage_taxi' as const,
      capacity: 4,
    },
  };

  const [language, setLanguage] = useState<'somali' | 'english' | 'arabic'>('english');

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Profile Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-3 sm:space-y-0 sm:space-x-4 text-center sm:text-left">
          <img
            src={driver.avatar}
            alt={driver.name}
            className="w-20 h-20 rounded-full object-cover border-4 border-emerald-500 shadow-xl"
          />
          <div className="flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h2 className="text-xl font-black text-white">{driver.name}</h2>
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1 uppercase">
                <ShieldCheck className="w-3.5 h-3.5" /> VERIFIED CAPTAIN
              </span>
            </div>

            <p className="text-xs text-slate-400 mt-1">
              Phone: <b className="text-slate-200">{driver.phone || '+252 63 6807814'}</b> • Joined: <b className="text-slate-200">Jan 2025</b>
            </p>

            <div className="flex items-center justify-center sm:justify-start space-x-4 mt-3 text-xs">
              <div className="flex items-center space-x-1 text-amber-400 font-extrabold bg-amber-400/10 px-2.5 py-1 rounded-xl border border-amber-400/20">
                <Star className="w-4 h-4 fill-amber-400" />
                <span>{driver.rating} Rating</span>
              </div>
              <div className="text-emerald-400 font-extrabold bg-emerald-500/10 px-2.5 py-1 rounded-xl border border-emerald-500/20">
                <span>{driver.totalTrips} Completed Trips</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle Registration & Health Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-md space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-emerald-500">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Assigned Vehicle Profile</h3>
              <p className="text-xs text-slate-400">Approved for Wadaage Taxi & Wadaage Share</p>
            </div>
          </div>

          <button
            onClick={onOpenVehicleModal}
            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold text-emerald-500 transition"
          >
            Diagnostics
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Vehicle Model</span>
            <span className="font-extrabold text-slate-900 dark:text-white text-sm">{driver.vehicle.model}</span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">License Plate</span>
            <span className="font-extrabold text-emerald-500 font-mono text-sm">{driver.vehicle.licensePlate}</span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 col-span-2 sm:col-span-1">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Color & Type</span>
            <span className="font-extrabold text-slate-900 dark:text-white text-sm">{driver.vehicle.color} Sedan</span>
          </div>
        </div>
      </div>

      {/* KYC & Verified Documents */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-md space-y-3">
        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          KYC Captain Verification & Documents
        </h3>

        <div className="space-y-2 text-xs">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <div>
                <div className="font-extrabold text-slate-900 dark:text-white">National ID Card (Somalia/Somaliland)</div>
                <div className="text-[10px] text-slate-400">Doc ID: #NID-8849201</div>
              </div>
            </div>
            <span className="bg-emerald-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded uppercase">Verified</span>
          </div>

          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <div>
                <div className="font-extrabold text-slate-900 dark:text-white">Commercial Driver License</div>
                <div className="text-[10px] text-slate-400">Class B • Valid through Dec 2028</div>
              </div>
            </div>
            <span className="bg-emerald-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded uppercase">Verified</span>
          </div>

          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <div>
                <div className="font-extrabold text-slate-900 dark:text-white">Police Clearance Certificate</div>
                <div className="text-[10px] text-slate-400">Issued by Hargeisa CID HQ</div>
              </div>
            </div>
            <span className="bg-emerald-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded uppercase">Verified</span>
          </div>
        </div>
      </div>

      {/* Quick Quick Control Triggers */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={onOpenSupportModal}
          className="p-4 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-800 text-left transition space-y-1"
        >
          <FileText className="w-5 h-5 text-amber-500" />
          <div className="font-extrabold text-xs text-slate-900 dark:text-white">Support & Claims</div>
          <div className="text-[10px] text-slate-400">Report missing fare or rider issues</div>
        </button>

        <button
          onClick={onOpenFatigueModal}
          className="p-4 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-800 text-left transition space-y-1"
        >
          <Coffee className="w-5 h-5 text-red-400" />
          <div className="font-extrabold text-xs text-slate-900 dark:text-white">Fatigue Monitor</div>
          <div className="text-[10px] text-slate-400">Shift timer & break reminders</div>
        </button>
      </div>

      {/* App Preferences */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-md space-y-3 text-xs">
        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">Preferences & Sound Alerts</h3>

        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-emerald-500" /> Dispatch Ping Sound Effects
          </span>
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-3 py-1 rounded-xl font-bold transition ${
              soundEnabled ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
            }`}
          >
            {soundEnabled ? 'ENABLED' : 'MUTED'}
          </button>
        </div>

        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-400" /> Interface Language
          </span>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as any)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
          >
            <option value="english">English</option>
            <option value="somali">Soomaali</option>
            <option value="arabic">العربية</option>
          </select>
        </div>
      </div>
    </div>
  );
};
