import { ArrowDownRight, ArrowUpRight, Calendar, CreditCard, DollarSign, Download, Filter, Search, X } from 'lucide-react';
import React, { useState } from 'react';
import { formatCurrency } from '../../utils/geo';
import { useRide } from '../../context/RideContext';

interface TransactionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TransactionHistoryModal: React.FC<TransactionHistoryModalProps> = ({ isOpen, onClose }) => {
  const { driverWalletTransactions, transactions: passengerTransactions } = useRide();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  if (!isOpen) return null;

  // Unify real live transactions
  const allTransactions = [
    ...driverWalletTransactions.map((dtx) => ({
      id: dtx.id,
      timestamp: dtx.date,
      user: dtx.driverName || 'Captain / Driver',
      role: 'Driver' as const,
      type: dtx.type === 'commission_deduction' ? 'Commission Deduction' : (dtx.type as string) === 'driver_payout' ? 'Driver Payout' : 'Wallet Top-Up',
      gateway: dtx.paymentProvider === 'zaad' ? 'ZAAD Service' : dtx.paymentProvider === 'edahab' ? 'eDahab' : dtx.paymentProvider === 'evc' ? 'EVC Plus' : 'System Wallet',
      amount: Math.abs(dtx.amountUsd),
      status: dtx.status === 'completed' ? 'Completed' : dtx.status === 'pending_verification' ? 'Processing' : 'Refunded',
    })),
    ...passengerTransactions.map((ptx) => ({
      id: ptx.id,
      timestamp: ptx.date,
      user: 'Passenger',
      role: 'Passenger' as const,
      type: ptx.type === 'ride_payment' ? 'Ride Fare' : 'Wallet Top-Up',
      gateway: 'System Wallet',
      amount: Math.abs(ptx.amount),
      status: ptx.status === 'completed' ? 'Completed' : 'Processing',
    }))
  ];

  const filtered = allTransactions.filter((tx) => {
    const matchesSearch = tx.user.toLowerCase().includes(searchTerm.toLowerCase()) || tx.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'all' || tx.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const totalVolume = filtered.reduce((acc, tx) => acc + tx.amount, 0);
  const netCommission = driverWalletTransactions
    .filter((t) => t.type === 'commission_deduction' && t.status === 'completed')
    .reduce((acc, t) => acc + Math.abs(t.amountUsd), 0);

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold">View Transaction History & Financial Ledger</h3>
              <p className="text-xs text-slate-400">Real-time payment logs, rider charges, payouts & platform commissions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search TX ID or User..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-800 border border-slate-700 pl-9 pr-3 py-1.5 rounded-xl text-white outline-none focus:border-emerald-500"
              />
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-xl text-white outline-none focus:border-emerald-500"
            >
              <option value="all">All Transaction Types</option>
              <option value="Ride Fare">Ride Fare</option>
              <option value="Wallet Top-Up">Wallet Top-Up</option>
              <option value="Driver Payout">Driver Payout</option>
              <option value="Commission Deduction">Commission Deduction</option>
            </select>
          </div>

          <button
            onClick={() => alert('Exporting full transaction CSV report...')}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700 font-bold rounded-xl flex items-center space-x-1.5 transition"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Transactions Table */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase font-bold text-[10px]">
                <th className="py-2.5 px-3">Tx ID & Date</th>
                <th className="py-2.5 px-3">User & Role</th>
                <th className="py-2.5 px-3">Transaction Type</th>
                <th className="py-2.5 px-3">Gateway</th>
                <th className="py-2.5 px-3 text-right">Amount</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filtered.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3 px-3">
                    <p className="font-mono font-bold text-emerald-400">{tx.id}</p>
                    <p className="text-[10px] text-slate-500">{tx.timestamp}</p>
                  </td>
                  <td className="py-3 px-3">
                    <p className="font-bold text-white">{tx.user}</p>
                    <p className="text-[10px] text-slate-400">{tx.role}</p>
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-semibold text-slate-200">{tx.type}</span>
                  </td>
                  <td className="py-3 px-3 text-slate-400">{tx.gateway}</td>
                  <td className="py-3 px-3 text-right font-extrabold text-white">
                    {formatCurrency(tx.amount)}
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Summary */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
          <span>Showing {filtered.length} logged transactions</span>
          <div className="flex items-center space-x-4">
            <span>Total Volume: <b className="text-white">{formatCurrency(totalVolume)}</b></span>
            <span>Net Platform Revenue: <b className="text-emerald-400">{formatCurrency(netCommission)}</b></span>
          </div>
        </div>
      </div>
    </div>
  );
};
