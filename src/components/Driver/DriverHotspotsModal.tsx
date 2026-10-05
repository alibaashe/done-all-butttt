import { ArrowUpRight, Award, Calendar, CheckCircle2, Clock, Flame, MapPin, Navigation, Radar, Sparkles, TrendingUp, Users, Wallet, X } from 'lucide-react';
import React, { useState } from 'react';
import { formatCurrency, EXCHANGE_RATE_USD_TO_SLSH } from '../../utils/geo';
import { useRide } from '../../context/RideContext';

interface DriverHotspotsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HIGH_DEMAND_ZONES = [
  { id: 'z1', name: 'Suuqa Barta Market', surge: 2.2, waitTime: '< 1 min', ridersWaiting: 38, distance: '1.2 km away', bountyUsd: 2.50 },
  { id: 'z2', name: 'Egal International Airport', surge: 1.8, waitTime: '2 mins', ridersWaiting: 24, distance: '3.5 km away', bountyUsd: 3.00 },
  { id: 'z3', name: 'Dahabshiil Commercial Center', surge: 1.5, waitTime: '3 mins', ridersWaiting: 19, distance: '2.1 km away', bountyUsd: 1.50 },
  { id: 'z4', name: 'Mansoor Hotel Precinct', surge: 1.4, waitTime: '2 mins', ridersWaiting: 14, distance: '4.0 km away', bountyUsd: 1.50 },
  { id: 'z5', name: 'University of Hargeisa Corridor', surge: 1.6, waitTime: '2 mins', ridersWaiting: 31, distance: '2.8 km away', bountyUsd: 2.00 },
];

const PREDICTIVE_PEAK_WINDOWS = [
  { time: '07:00 - 09:30', name: 'Morning Work & School Rush', expectedSurge: '1.5x - 2.0x', topCorridor: 'Jigjiga Yar ↔ Central Market' },
  { time: '12:30 - 14:00', name: 'Lunch & Friday Prayer Movement', expectedSurge: '1.3x - 1.7x', topCorridor: 'Downtown ↔ Ali Matan Mosque' },
  { time: '16:30 - 19:30', name: 'Evening Commute & Market Rush', expectedSurge: '1.8x - 2.3x', topCorridor: 'Suuqa Barta ↔ 26 June & Airport Rd' },
  { time: '20:30 - 23:00', name: 'Night Dining & Airport Inbound', expectedSurge: '1.4x - 1.8x', topCorridor: 'Mansoor Hotel ↔ Egal Airport' },
];

export const DriverHotspotsModal: React.FC<DriverHotspotsModalProps> = ({ isOpen, onClose }) => {
  const { topUpDriverWallet } = useRide();
  const [claimedBounties, setClaimedBounties] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'hotspots' | 'predictive' | 'bounties'>('hotspots');
  const [bountyClaimToast, setBountyClaimToast] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleActivateBounty = (zoneId: string, zoneName: string, amount: number) => {
    if (claimedBounties.includes(zoneId)) return;
    setClaimedBounties((prev) => [...prev, zoneId]);
    topUpDriverWallet(amount, 'card');
    setBountyClaimToast(`🎉 Corridor Quest Activated! +$${amount.toFixed(2)} USD added upon completing 2 rides in ${zoneName}.`);
    setTimeout(() => setBountyClaimToast(null), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 text-white rounded-3xl max-w-xl w-full border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-amber-950 via-slate-900 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400">
              <Flame className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                City Demand & Corridor Radar
                <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded-full uppercase">
                  Live AI
                </span>
              </h3>
              <p className="text-xs text-slate-400">AI Heatmaps, Surge Boosts & Corridor Bounty Bonuses</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switchers */}
        <div className="flex border-b border-slate-800 bg-slate-950 px-5 pt-2 gap-2 text-xs font-bold">
          <button
            onClick={() => setActiveTab('hotspots')}
            className={`pb-2.5 px-3 border-b-2 transition ${
              activeTab === 'hotspots'
                ? 'border-amber-500 text-amber-400 font-extrabold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            🔥 Live Surge Zones
          </button>
          <button
            onClick={() => setActiveTab('predictive')}
            className={`pb-2.5 px-3 border-b-2 transition ${
              activeTab === 'predictive'
                ? 'border-amber-500 text-amber-400 font-extrabold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            📈 AI Peak Schedule
          </button>
          <button
            onClick={() => setActiveTab('bounties')}
            className={`pb-2.5 px-3 border-b-2 transition ${
              activeTab === 'bounties'
                ? 'border-amber-500 text-amber-400 font-extrabold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            🎁 Corridor Bounties
          </button>
        </div>

        {bountyClaimToast && (
          <div className="mx-5 mt-4 p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-xs text-emerald-300 font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{bountyClaimToast}</span>
          </div>
        )}

        <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar">
          {activeTab === 'hotspots' && (
            <>
              {/* Active Surge Heatmap Graphic Banner */}
              <div className="p-4 bg-gradient-to-r from-amber-500/20 to-rose-500/20 border border-amber-500/40 rounded-2xl text-xs space-y-2">
                <div className="flex items-center justify-between font-black text-amber-300">
                  <span className="flex items-center gap-1.5">
                    <Radar className="w-4 h-4 text-amber-400 animate-spin" />
                    HIGH SURGE DETECTED IN HARGEISA MARKET
                  </span>
                  <span className="bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full text-[10px] uppercase font-black">
                    2.2x Max Multiplier
                  </span>
                </div>
                <p className="text-[11px] text-amber-200/90">
                  Ride demand is exceeding available drivers by <b>180%</b> in Suuqa Barta. Head towards this zone to get matched with instant trip dispatches.
                </p>
              </div>

              <div className="space-y-2.5">
                <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider">
                  Top Surge Hotspots Near You
                </h4>

                {HIGH_DEMAND_ZONES.map((zone) => (
                  <div
                    key={zone.id}
                    className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 hover:border-slate-700 transition flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-amber-400">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-extrabold text-sm text-white flex items-center gap-2">
                          {zone.name}
                          <span className="text-[10px] bg-rose-500/20 border border-rose-500/40 text-rose-300 font-black px-2 py-0.2 rounded-full">
                            {zone.surge}x Surge
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3 text-slate-500" /> {zone.ridersWaiting} riders waiting
                          </span>
                          <span>• {zone.distance}</span>
                          <span>• Avg wait {zone.waitTime}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        alert(`Navigating to ${zone.name} Surge Hotspot!`);
                        onClose();
                      }}
                      className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1 transition shrink-0"
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      <span>Navigate</span>
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {activeTab === 'predictive' && (
            <div className="space-y-3">
              <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 text-xs text-slate-300">
                <span className="font-bold text-amber-400 block mb-1">📅 Smart Predictive Demand Forecast</span>
                Based on historical ride volumes in Hargeisa, driver supply drops during these hours. Position your vehicle 15 minutes before window starts to guarantee constant back-to-back rides.
              </div>

              <div className="space-y-2">
                {PREDICTIVE_PEAK_WINDOWS.map((win, idx) => (
                  <div key={idx} className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-400" />
                        <span className="font-extrabold text-sm text-white">{win.time}</span>
                        <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full">
                          {win.expectedSurge}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-300">{win.name}</p>
                      <p className="text-[11px] text-slate-500">📍 Hot Corridor: {win.topCorridor}</p>
                    </div>
                    <span className="text-[10px] uppercase font-black px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-400">
                      Scheduled
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'bounties' && (
            <div className="space-y-3">
              <div className="p-3.5 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 rounded-2xl text-xs text-emerald-200">
                <span className="font-bold text-emerald-400 block mb-1">💰 Corridor Driver Bounties</span>
                Activate a high-traffic corridor below. Complete 2 Wadaage Share or Taxi rides starting in this zone within 2 hours to receive the instant cash bonus into your Zaad / e-Dahab driver wallet.
              </div>

              <div className="space-y-2.5">
                {HIGH_DEMAND_ZONES.map((zone) => {
                  const isClaimed = claimedBounties.includes(zone.id);
                  return (
                    <div key={zone.id} className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="font-extrabold text-sm text-white flex items-center gap-2">
                          {zone.name}
                          <span className="text-[10px] bg-emerald-500 text-slate-950 font-black px-2 py-0.5 rounded-full">
                            +${zone.bountyUsd.toFixed(2)} USD BONUS
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Equivalent: {Math.round(zone.bountyUsd * EXCHANGE_RATE_USD_TO_SLSH).toLocaleString()} SLSH • {zone.distance}
                        </p>
                      </div>

                      <button
                        disabled={isClaimed}
                        onClick={() => handleActivateBounty(zone.id, zone.name, zone.bountyUsd)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition ${
                          isClaimed
                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                            : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                        }`}
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>{isClaimed ? 'Active Quest' : 'Claim Quest'}</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
