import { ArrowUpRight, Banknote, Calendar, CheckCircle2, DollarSign, Flame, Lock, TrendingUp, Wallet } from 'lucide-react';
import React, { useState } from 'react';
import { useRide } from '../../context/RideContext';
import { formatCurrency } from '../../utils/geo';
import { DriverCommissionWalletModal } from './DriverCommissionWalletModal';

export const DriverEarningsView: React.FC = () => {
  const { drivers, driverWalletBalanceUsd, driverWalletTransactions, pricing, currentUser } = useRide();
  const driver = drivers.find((d) => d.phone === currentUser?.phone || d.id === currentUser?.id) || drivers[0] || {
    id: currentUser?.id || 'drv_live',
    name: currentUser?.name || 'Driver Partner',
    phone: currentUser?.phone || '',
    avatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    rating: 5.0,
    totalTrips: 0,
    todayEarnings: 0,
    weeklyEarnings: 0,
    hoursOnline: 0,
    acceptanceRate: 100,
  };
  const [cashoutSuccess, setCashoutSuccess] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);

  const currentSos = Math.round(driverWalletBalanceUsd * 10000);
  const minThresholdSos = Math.round((pricing.driverMinWalletThresholdUsd || 0.10) * 10000); // 1,000 SOS
  const feeSos = Math.round((pricing.driverCommissionFeeUsd || 0.10) * 10000); // 1,000 SOS
  const isBelowMin = currentSos < minThresholdSos;

  const handleCashout = () => {
    setCashoutSuccess(true);
    setTimeout(() => setCashoutSuccess(false), 2500);
  };

  return (
    <div className="space-y-4">
      {/* Driver Prepaid Commission Wallet Highlight Card */}
      <div className={`p-5 rounded-2xl border shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
        isBelowMin
          ? 'bg-rose-950/80 border-rose-500/60 text-white'
          : 'bg-emerald-950/70 border-emerald-500/50 text-white'
      }`}>
        <div className="flex items-center space-x-3.5">
          <div className={`p-3 rounded-2xl ${isBelowMin ? 'bg-rose-500 text-white animate-pulse' : 'bg-emerald-500 text-slate-950 font-black'}`}>
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-xs text-slate-300 uppercase tracking-wider">
                Driver Prepaid Commission Wallet
              </span>
              <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${
                isBelowMin ? 'bg-rose-500 text-white' : 'bg-emerald-400 text-slate-950'
              }`}>
                {isBelowMin ? 'BLOCKED (< 1,000 SOS)' : 'ACTIVE / ONLINE ALLOWED'}
              </span>
            </div>
            <div className="text-2xl font-black text-white font-mono mt-1">
              {currentSos.toLocaleString()} SOS <span className="text-sm font-bold text-emerald-400">(${driverWalletBalanceUsd.toFixed(2)} USD)</span>
            </div>
            <p className="text-[11px] text-slate-300/80 mt-0.5">
              Trip Platform Fee: <b>1,000 SOS ($0.10)</b> per trip • Active Threshold: <b>1,000 SOS ($0.10)</b> • Top up: ZAAD <b>0636807814</b> / eDahab <b>0656807814</b>
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowWalletModal(true)}
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs shadow-lg flex items-center space-x-1.5 transition shrink-0 uppercase tracking-wider"
        >
          <Wallet className="w-4 h-4" />
          <span>DEPOSIT TO WALLET</span>
        </button>
      </div>

      {/* Earnings Overview Card */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl p-6 border border-slate-700 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">
              Weekly Gross Driver Revenue
            </span>
            <div className="text-3xl font-black text-emerald-400 tracking-tight mt-1">
              {formatCurrency(driver.weeklyEarnings)}
            </div>
          </div>
          <button
            onClick={handleCashout}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs shadow-lg flex items-center space-x-1.5 transition-transform active:scale-95"
          >
            <Banknote className="w-4 h-4" />
            <span>ZAAD / eDAHAB CASHOUT</span>
          </button>
        </div>

        {cashoutSuccess && (
          <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-bold flex items-center justify-center space-x-2 animate-bounce">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{formatCurrency(driver.weeklyEarnings)} transferred via ZAAD Services!</span>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3 pt-2 border-t border-slate-700/80 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Today's Net</span>
            <span className="font-bold text-white text-sm">{formatCurrency(driver.todayEarnings)}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Trips Done</span>
            <span className="font-bold text-white text-sm">{driver.totalTrips} rides</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase">Trip Charge Fee</span>
            <span className="font-bold text-emerald-400 text-sm">1,000 SOS / Trip</span>
          </div>
        </div>
      </div>

      {/* Wallet Deductions & Topup Audit Trail */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
            <Wallet className="w-4 h-4 text-emerald-500" />
            <span>Commission Wallet Statement</span>
          </h3>
          <span className="text-xs text-slate-400">{driverWalletTransactions.length} Transactions</span>
        </div>

        <div className="space-y-2">
          {driverWalletTransactions.map((tx) => (
            <div
              key={tx.id}
              className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
            >
              <div>
                <div className="font-bold text-slate-900 dark:text-white">{tx.title}</div>
                <div className="text-[10px] text-slate-400">{tx.date}</div>
              </div>
              <div className="text-right">
                <div className={`font-black font-mono text-sm ${tx.amountUsd > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                  {tx.amountUsd > 0 ? '+' : ''}{tx.amountSos.toLocaleString()} SOS
                </div>
                <div className="text-[10px] text-slate-400">
                  ({tx.amountUsd > 0 ? '+' : ''}${Math.abs(tx.amountUsd).toFixed(2)})
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      <DriverCommissionWalletModal isOpen={showWalletModal} onClose={() => setShowWalletModal(false)} />
    </div>
  );
};
