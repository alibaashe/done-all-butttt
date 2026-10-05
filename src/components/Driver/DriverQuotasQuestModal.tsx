import { Award, CheckCircle2, DollarSign, Flame, Gift, ShieldCheck, Sparkles, Trophy, X } from 'lucide-react';
import React from 'react';

interface DriverQuotasQuestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DriverQuotasQuestModal: React.FC<DriverQuotasQuestModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 text-white rounded-3xl max-w-md w-full border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-5 bg-gradient-to-r from-purple-950 via-slate-900 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-purple-500/20 border border-purple-500/30 text-purple-400">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">Daily Driver Quests & Incentives</h3>
              <p className="text-xs text-slate-400">Complete trip quotas to earn instant bonus cash</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar">
          {/* Active Quest Progress */}
          <div className="p-4 bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-500/40 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs font-black text-purple-200">
              <span className="flex items-center gap-1.5">
                <Gift className="w-4 h-4 text-purple-400" /> DAILY QUEST: 8 TRIPS TARGET
              </span>
              <span className="text-emerald-400 font-mono font-black">+$5.00 BONUS</span>
            </div>

            <p className="text-[11px] text-purple-200/80">
              Complete 8 rides today in Hargeisa to unlock a <b>$5.00 (50,000 SOS)</b> cash bonus credited straight to your commission wallet!
            </p>

            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-[10px] font-bold text-slate-300">
                <span>Progress: 4 / 8 Trips Done</span>
                <span>50% Completed</span>
              </div>
              <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                <div className="bg-purple-500 h-full rounded-full w-1/2"></div>
              </div>
            </div>
          </div>

          {/* Peak Hour Consecutive Streak */}
          <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-200">
              <span className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-amber-400" /> Peak Hour 3-Trip Streak
              </span>
              <span className="text-amber-400 font-mono font-black">+$2.00 EXTRA</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Accept 3 consecutive rides without declining between 17:00 - 19:00 PM.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <div className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Ride 1 Completed
              </div>
              <div className="px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Ride 2 Completed
              </div>
              <div className="px-3 py-1 rounded-lg bg-slate-900 text-slate-500 border border-slate-800 text-[10px] font-black">
                Ride 3 Next
              </div>
            </div>
          </div>

          {/* Performance Rating Badges */}
          <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
            <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 block">
              Driver Quality Rating Shield
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Acceptance Rate</span>
                <span className="text-emerald-400 font-black text-sm font-mono">98% (High)</span>
              </div>
              <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-[10px] block">Cancellation Rate</span>
                <span className="text-emerald-400 font-black text-sm font-mono">1.1% (Low)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
