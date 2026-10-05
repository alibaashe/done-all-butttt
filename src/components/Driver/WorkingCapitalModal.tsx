import React, { useState } from 'react';
import { Briefcase, DollarSign, Gem, TrendingUp, X, CheckCircle2, ArrowUpRight } from 'lucide-react';
import { useRide } from '../../context/RideContext';

interface WorkingCapitalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WorkingCapitalModal: React.FC<WorkingCapitalModalProps> = ({ isOpen, onClose }) => {
  const { driverWalletBalanceUsd } = useRide();
  const [cashoutSuccess, setCashoutSuccess] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Working Capital & Quests</h3>
              <p className="text-xs text-slate-500">Daily earnings, incentives & micro-credit line</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {cashoutSuccess ? (
          <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 rounded-2xl text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto animate-bounce" />
            <h4 className="font-extrabold text-sm">Cash Out Requested!</h4>
            <p className="text-xs text-slate-300">
              $150.00 has been initiated to your Zaad / EvcPlus mobile wallet instantly.
            </p>
            <button
              onClick={() => setCashoutSuccess(false)}
              className="mt-2 px-4 py-1.5 bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl"
            >
              Back to Summary
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {/* 3 Metric Cards matching Screenshot 4 */}
            <div className="grid grid-cols-1 gap-2.5">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 font-medium block">Total Today's Earnings</span>
                  <span className="text-xl font-black text-slate-900 dark:text-white font-mono">$150.00</span>
                </div>
                <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  Ready to Cash Out
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 font-medium block">Active Quest Incentives</span>
                  <div className="flex items-center space-x-1 text-emerald-500 font-black text-lg">
                    <span>30</span>
                    <Gem className="w-5 h-5 text-emerald-400 fill-emerald-400" />
                  </div>
                </div>
                <span className="text-[11px] font-bold text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-full border border-purple-500/20">
                  +$12 Bonus at 50 💎
                </span>
              </div>

              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 font-medium block">Credit Wallet Balance</span>
                  <span className="text-lg font-black text-emerald-400 font-mono">
                    ${driverWalletBalanceUsd.toFixed(2)}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {(driverWalletBalanceUsd * 10000).toLocaleString()} SOS
                </span>
              </div>
            </div>

            {/* Instant Daily Cash Out Action */}
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-3.5 rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs font-extrabold text-emerald-900 dark:text-emerald-300">
                <span>Working Capital Micro-Credit</span>
                <span className="bg-emerald-500 text-slate-950 text-[10px] px-2 py-0.5 rounded font-black">
                  $150.00 APPROVED
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Instant fuel & repair liquidity available 24/7 without waiting for end-of-week payout.
              </p>
              <button
                onClick={() => setCashoutSuccess(true)}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition flex items-center justify-center space-x-1"
              >
                <span>Cash Out Daily Now ($150.00)</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
