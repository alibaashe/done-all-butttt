import React from 'react';
import { AlertOctagon, Coffee, Moon, ShieldAlert, Timer } from 'lucide-react';

interface DriverFatigueModalProps {
  isOpen: boolean;
  hoursOnline: number;
  onTakeBreak: () => void;
  onClose: () => void;
}

export const DriverFatigueModal: React.FC<DriverFatigueModalProps> = ({
  isOpen,
  hoursOnline,
  onTakeBreak,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 text-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-red-500/40 text-center relative overflow-hidden">
        {/* Glow */}
        <div className="absolute -top-16 -right-16 w-32 h-32 bg-red-500/20 rounded-full blur-2xl pointer-events-none" />

        <div className="w-16 h-16 rounded-3xl bg-red-500/20 text-red-500 flex items-center justify-center mx-auto mb-4 border border-red-500/30">
          <AlertOctagon className="w-9 h-9" />
        </div>

        <h3 className="text-xl font-black text-white mb-2">
          Safety Alert: Rest Break Mandatory
        </h3>

        <p className="text-xs text-slate-300 mb-4 leading-relaxed">
          You have been online driving for <span className="text-red-400 font-extrabold">{hoursOnline} hours</span>. To protect your safety and fleet regulations, the system enforces a mandatory <span className="text-emerald-400 font-bold">6-hour rest break</span> after 12 hours.
        </p>

        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 text-left space-y-2 mb-6">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Timer className="w-4 h-4 text-red-400" />
            <span>Driver Fatigue Monitor: <strong className="text-red-400">HIGH RISK</strong></span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Coffee className="w-4 h-4 text-emerald-400" />
            <span>Recommended: Hydrate & Rest before logging back online</span>
          </div>
        </div>

        <button
          onClick={onTakeBreak}
          className="w-full py-3.5 px-4 bg-red-500 hover:bg-red-600 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-500/30 transition"
        >
          <Moon className="w-4 h-4" />
          Go Offline & Take Mandatory Break
        </button>
      </div>
    </div>
  );
};
