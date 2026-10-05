import { ArrowDownRight, ArrowUpRight, CheckCircle2, CreditCard, DollarSign, Plus, Wallet, X } from 'lucide-react';
import React, { useState } from 'react';
import { useRide } from '../../context/RideContext';
import { formatCurrency } from '../../utils/geo';

interface WalletModalProps {
  onClose: () => void;
}

export const WalletModal: React.FC<WalletModalProps> = ({ onClose }) => {
  const { walletBalance, topUpWallet, transactions } = useRide();
  const [topUpAmount, setTopUpAmount] = useState(25);
  const [customAmount, setCustomAmount] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const handleTopUp = () => {
    const amt = customAmount ? parseFloat(customAmount) || 0 : topUpAmount;
    if (amt > 0) {
      topUpWallet(amt);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-900 dark:text-white text-base">Passenger Trip & Cash Summary</h2>
              <p className="text-xs text-slate-500">Somaliland Shilling (SLSH) Cash Payment System</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cash Policy Notice Card */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-5 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <span className="text-xs text-emerald-100 uppercase font-bold tracking-wider">
                Passenger Payment Mode
              </span>
              <div className="text-2xl font-black tracking-tight mt-1">
                💵 100% Lacag Cash (SLSH)
              </div>
              <p className="text-xs text-emerald-100/90 mt-1">
                All rides are paid directly in cash (Somaliland Shillings) to the driver upon trip completion. No digital wallet needed for passengers.
              </p>
            </div>
          </div>
        </div>

        {/* Top-Up Selector */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
            Select Top-Up Method (Local Somaliland)
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              className="p-2 bg-emerald-500/10 border border-emerald-500/40 rounded-xl text-[11px] font-bold text-emerald-600 dark:text-emerald-400 text-center"
            >
              Zaad Service (*880#)
            </button>
            <button
              type="button"
              className="p-2 bg-amber-500/10 border border-amber-500/40 rounded-xl text-[11px] font-bold text-amber-600 dark:text-amber-400 text-center"
            >
              eDahab (*770#)
            </button>
            <button
              type="button"
              className="p-2 bg-purple-500/10 border border-purple-500/40 rounded-xl text-[11px] font-bold text-purple-600 dark:text-purple-400 text-center"
            >
              Premier Wallet
            </button>
          </div>

          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block pt-1">
            Select Top-Up Amount
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[10, 25, 50, 100].map((amt) => (
              <button
                key={amt}
                onClick={() => {
                  setTopUpAmount(amt);
                  setCustomAmount('');
                }}
                className={`py-2.5 rounded-xl font-black text-xs border transition-all ${
                  topUpAmount === amt && !customAmount
                    ? 'bg-emerald-500 text-slate-950 border-emerald-500 shadow-md'
                    : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                }`}
              >
                +${amt}
              </button>
            ))}
          </div>

          {/* Custom amount input */}
          <div className="pt-1 flex items-center space-x-2">
            <div className="relative flex-1">
              <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                placeholder="Or enter custom amount"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 pl-8 pr-3 py-2 text-xs rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <button
              onClick={handleTopUp}
              className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-extrabold px-4 py-2 rounded-xl text-xs shadow-md flex items-center space-x-1"
            >
              <Plus className="w-4 h-4" />
              <span>Top-Up Now</span>
            </button>
          </div>

          {showSuccess && (
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 animate-bounce mt-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Wallet topped up successfully!</span>
            </div>
          )}
        </div>

        {/* Recent Transactions List */}
        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Transaction History
          </h3>
          <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 flex items-center justify-between text-xs"
              >
                <div className="flex items-center space-x-2.5">
                  <div
                    className={`p-2 rounded-lg ${
                      tx.amount > 0
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : 'bg-rose-500/10 text-rose-500'
                    }`}
                  >
                    {tx.amount > 0 ? (
                      <ArrowDownRight className="w-4 h-4" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">{tx.title}</div>
                    <div className="text-[10px] text-slate-400">{tx.date}</div>
                  </div>
                </div>

                <div
                  className={`font-mono font-bold ${
                    tx.amount > 0 ? 'text-emerald-500' : 'text-slate-900 dark:text-white'
                  }`}
                >
                  {tx.amount > 0 ? '+' : ''}
                  {formatCurrency(tx.amount)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
