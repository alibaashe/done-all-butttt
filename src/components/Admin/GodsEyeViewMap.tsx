import React, { useState } from 'react';
import { Eye, MapPin, Radio, ShieldCheck, User, Users, X, Car, Navigation } from 'lucide-react';
import { useRide } from '../../context/RideContext';
import { UnifiedMap } from '../Map/UnifiedMap';

interface GodsEyeViewMapProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GodsEyeViewMap: React.FC<GodsEyeViewMapProps> = ({ isOpen, onClose }) => {
  const { drivers, currentRide } = useRide();
  const [filterStatus, setFilterStatus] = useState<'all' | 'available' | 'busy' | 'offline'>('all');

  if (!isOpen) return null;

  const filteredDrivers = drivers.filter(d => filterStatus === 'all' || d.status === filterStatus);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 text-white rounded-3xl max-w-4xl w-full p-6 shadow-2xl border border-slate-800 relative flex flex-col h-[85vh]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition z-20 bg-slate-900/80"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold border border-emerald-500/20">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-lg">God&apos;s Eye View Operations Radar</h3>
              <p className="text-xs text-slate-400">Live fleet telematics • Real-time GPS driver tracking & trip vectors</p>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold mr-10">
            {(['all', 'available', 'busy', 'offline'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-lg capitalize transition ${
                  filterStatus === st
                    ? 'bg-emerald-500 text-slate-950 font-black'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Real Live Map Container */}
        <div className="flex-1 rounded-2xl relative overflow-hidden border border-slate-800 shadow-inner min-h-[350px]">
          <UnifiedMap height="100%" showSurgeHeatmap={true} />
        </div>

        {/* Footer Fleet Telematics Bar */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
          <div className="flex gap-4">
            <span>Total Drivers: <strong className="text-white">{drivers.length}</strong></span>
            <span>Online/Idle: <strong className="text-emerald-400">{drivers.filter(d => d.status === 'available').length}</strong></span>
            <span>In Active Trip: <strong className="text-amber-400">{drivers.filter(d => d.status === 'busy').length}</strong></span>
          </div>

          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            Live Dispatch Stream Active
          </div>
        </div>
      </div>
    </div>
  );
};
