import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  DollarSign,
  Wallet,
  Phone,
  FileText,
  Search,
  Check,
  Edit3,
  Copy,
  PlusCircle,
  MinusCircle,
  ShieldCheck,
  RefreshCw,
  UserCheck,
  User,
  Car,
  Layers,
  Receipt,
  Sliders,
  Calculator,
  ArrowRight,
  RotateCcw,
  Sparkles,
  TrendingUp,
  TrendingDown,
  X,
  ArrowUpDown,
  Filter,
  Eye,
  History,
  Send,
  Zap,
} from 'lucide-react';
import { useRide } from '../../context/RideContext';
import { Driver, DriverWalletTransaction } from '../../types';
import { EXCHANGE_RATE_USD_TO_SLSH } from '../../utils/geo';
import { WadaageLogo } from '../Common/WadaageLogo';

export const WadaageAdminWalletControl: React.FC = () => {
  const {
    driverWalletTransactions,
    verifyAndApproveDriverTopUp,
    rejectDriverPendingTransaction,
    adminDirectCreditDriverWallet,
    adminAdjustDriverWallet,
    adminCreditUserWallet,
    drivers,
    getDriverWalletBalance,
    getUserWalletBalance,
    pricing,
  } = useRide();

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<'drivers' | 'pending' | 'credit' | 'ledger'>('drivers');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'commission' | 'pending' | 'completed' | 'rejected'>('all');

  // Dedicated Driver Wallet Control Modal State
  const [selectedDriverForEdit, setSelectedDriverForEdit] = useState<Driver | null>(null);
  const [editOperation, setEditOperation] = useState<'add' | 'deduct' | 'set'>('add');
  const [inputSlsh, setInputSlsh] = useState<string>('10000');
  const [inputUsd, setInputUsd] = useState<string>('1.00');
  const [customAdminReason, setCustomAdminReason] = useState<string>('Manual Admin Adjustment');
  const [actionToast, setActionToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isSubmittingAdjustment, setIsSubmittingAdjustment] = useState<boolean>(false);

  // Dedicated Driver Usage / History Modal State
  const [selectedDriverForHistory, setSelectedDriverForHistory] = useState<Driver | null>(null);

  // Driver Fleet Search & Filter State
  const [driverSearchQuery, setDriverSearchQuery] = useState<string>('');
  const [driverStatusFilter, setDriverStatusFilter] = useState<'all' | 'eligible' | 'lockout' | 'zero'>('all');

  // Editable real amounts per pending transaction ID
  const [editedAmounts, setEditedAmounts] = useState<{ [txId: string]: number }>({});
  const [adminNotes, setAdminNotes] = useState<{ [txId: string]: string }>({});

  // Direct Admin Credit Form State
  const [targetType, setTargetType] = useState<'driver' | 'passenger'>('driver');
  const [targetDriverId, setTargetDriverId] = useState<string>(drivers[0]?.id || 'drv_01');
  const [targetUserId, setTargetUserId] = useState<string>('usr_admin_baashe');
  const [directAmountSos, setDirectAmountSos] = useState<number>(10000);
  const [directAmountUsd, setDirectAmountUsd] = useState<number>(1.00);
  const [directNote, setDirectNote] = useState<string>('Direct Admin Wallet Credit');
  const [copiedRef, setCopiedRef] = useState<string | null>(null);

  // Rejection modal / note state
  const [rejectingTxId, setRejectingTxId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('Invalid payment receipt or reference code.');

  const [processingTxIds, setProcessingTxIds] = useState<Record<string, boolean>>({});

  // Calculations for KPI Summary
  const pendingTxs = useMemo(
    () => driverWalletTransactions.filter((tx) => tx.status === 'pending_verification'),
    [driverWalletTransactions]
  );
  const completedTxs = useMemo(
    () => driverWalletTransactions.filter((tx) => tx.status === 'completed'),
    [driverWalletTransactions]
  );
  const rejectedTxs = useMemo(
    () => driverWalletTransactions.filter((tx) => tx.status === 'rejected'),
    [driverWalletTransactions]
  );
  const commissionTxs = useMemo(
    () =>
      driverWalletTransactions.filter(
        (tx) =>
          tx.type === 'commission_deduction' ||
          tx.amountSos < 0 ||
          (tx.title || '').toLowerCase().includes('commission')
      ),
    [driverWalletTransactions]
  );

  const totalCommissionDeductedSos = useMemo(
    () => Math.abs(commissionTxs.reduce((sum, t) => sum + (t.amountSos || 0), 0)),
    [commissionTxs]
  );
  const totalCommissionDeductedUsd = useMemo(
    () => Math.abs(commissionTxs.reduce((sum, t) => sum + (t.amountUsd || 0), 0)),
    [commissionTxs]
  );

  const totalFleetBalanceUsd = useMemo(() => {
    return (drivers || []).reduce((sum, d) => {
      if (!d) return sum;
      const b = getDriverWalletBalance(d.id) || (d.phone ? getDriverWalletBalance(d.phone) : 0) || 0;
      return sum + b;
    }, 0);
  }, [drivers, getDriverWalletBalance]);

  // Bi-directional SLSH <-> USD calculator handlers
  const handleSlshInputChange = (valStr: string) => {
    const digitsOnly = valStr.replace(/\D/g, '');
    setInputSlsh(digitsOnly);
    const num = Number(digitsOnly) || 0;
    setInputUsd((num / EXCHANGE_RATE_USD_TO_SLSH).toFixed(2));
  };

  const handleUsdInputChange = (valStr: string) => {
    setInputUsd(valStr);
    const num = parseFloat(valStr) || 0;
    const computedSlsh = Math.round(num * EXCHANGE_RATE_USD_TO_SLSH);
    setInputSlsh(computedSlsh > 0 ? String(computedSlsh) : '');
  };

  const handleSelectPreset = (amountSlsh: number) => {
    setInputSlsh(String(amountSlsh));
    setInputUsd((amountSlsh / EXCHANGE_RATE_USD_TO_SLSH).toFixed(2));
  };

  // Open Driver Wallet Adjustment Modal
  const handleOpenDriverModal = (drv: Driver, initialOp: 'add' | 'deduct' | 'set' = 'add') => {
    setSelectedDriverForEdit(drv);
    setEditOperation(initialOp);
    setActionToast(null);

    const curBal = getDriverWalletBalance(drv.id) || (drv.phone ? getDriverWalletBalance(drv.phone) : 0) || 0;

    if (initialOp === 'set') {
      setInputSlsh('0');
      setInputUsd('0.00');
      setCustomAdminReason('Account Reset ($0.00)');
    } else if (initialOp === 'deduct') {
      const defaultDeductSos = Math.min(Math.round(curBal * 10000), 5000);
      setInputSlsh(String(defaultDeductSos > 0 ? defaultDeductSos : 1000));
      setInputUsd((defaultDeductSos > 0 ? defaultDeductSos / 10000 : 0.10).toFixed(2));
      setCustomAdminReason('Commission / Working Float Deduction');
    } else {
      setInputSlsh('10000');
      setInputUsd('1.00');
      setCustomAdminReason('Prepaid Wallet Top-Up (ZAAD/eDahab)');
    }
  };

  // Execute Driver Balance Adjustment
  const handleExecuteDriverAdjustment = async () => {
    if (!selectedDriverForEdit) return;
    const amtUsd = parseFloat(inputUsd) || 0;
    if (editOperation !== 'set' && amtUsd <= 0) {
      setActionToast({ text: 'Fadlan geli qiimo sax ah (Enter amount > 0)', type: 'error' });
      return;
    }

    setIsSubmittingAdjustment(true);
    setActionToast(null);

    try {
      const res = adminAdjustDriverWallet(
        selectedDriverForEdit.id,
        editOperation,
        amtUsd,
        false,
        customAdminReason.trim() || undefined
      );

      setActionToast({ text: res.message, type: 'success' });
      setTimeout(() => {
        setIsSubmittingAdjustment(false);
        setSelectedDriverForEdit(null);
        setActionToast(null);
      }, 1400);
    } catch (e: any) {
      setIsSubmittingAdjustment(false);
      setActionToast({ text: e?.message || 'Error updating driver wallet', type: 'error' });
    }
  };

  // Quick One-Click Balance Adjustment from Table
  const handleQuickAdjustment = (drv: Driver, op: 'add' | 'set', amountUsd: number, note: string) => {
    try {
      const res = adminAdjustDriverWallet(drv.id, op, amountUsd, false, note);
      setActionToast({ text: res.message, type: 'success' });
      setTimeout(() => setActionToast(null), 3000);
    } catch (e: any) {
      setActionToast({ text: e?.message || 'Action failed', type: 'error' });
      setTimeout(() => setActionToast(null), 3000);
    }
  };

  // Verify and Approve Driver Pending Top-Up
  const handleVerify = (tx: DriverWalletTransaction) => {
    const curStatus = String(tx.status || '').toLowerCase();
    if (processingTxIds[tx.id] || curStatus === 'completed' || curStatus === 'verified') return;

    setProcessingTxIds((p) => ({ ...p, [tx.id]: true }));
    try {
      const realAmountSos = editedAmounts[tx.id] !== undefined ? editedAmounts[tx.id] : tx.amountSos;
      const note = adminNotes[tx.id] || `Verified by Admin. Amount credited: ${realAmountSos.toLocaleString()} SLSH ($${(realAmountSos / 10000).toFixed(2)} USD).`;
      verifyAndApproveDriverTopUp(tx.id, realAmountSos, note);
      setActionToast({
        text: `Top-up for ${tx.driverName || 'driver'} approved and credited successfully!`,
        type: 'success',
      });
      setTimeout(() => setActionToast(null), 3500);
    } catch (e) {
      console.error('Error verifying top-up:', e);
      setActionToast({ text: 'Failed to verify top-up.', type: 'error' });
    } finally {
      setTimeout(() => {
        setProcessingTxIds((p) => ({ ...p, [tx.id]: false }));
      }, 1000);
    }
  };

  // Reject Driver Pending Top-Up
  const handleConfirmReject = (txId: string) => {
    if (processingTxIds[txId]) return;
    setProcessingTxIds((p) => ({ ...p, [txId]: true }));
    try {
      const note = rejectReason.trim() || 'Rejected by Admin. Invalid payment receipt or reference.';
      rejectDriverPendingTransaction(txId, note);
      setRejectingTxId(null);
      setActionToast({ text: 'Transaction rejected successfully. Wallet was not credited.', type: 'success' });
      setTimeout(() => setActionToast(null), 3500);
    } catch (e) {
      console.error('Error rejecting top-up:', e);
      setActionToast({ text: 'Failed to reject top-up.', type: 'error' });
    } finally {
      setTimeout(() => {
        setProcessingTxIds((p) => ({ ...p, [txId]: false }));
      }, 1000);
    }
  };

  // Direct Credit Submission
  const handleDirectCreditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (targetType === 'driver') {
      if (directAmountSos <= 0) return;
      adminDirectCreditDriverWallet(targetDriverId, directAmountSos, directNote);
      setActionToast({
        text: `Successfully credited ${directAmountSos.toLocaleString()} SLSH to driver wallet!`,
        type: 'success',
      });
    } else {
      if (directAmountUsd <= 0) return;
      adminCreditUserWallet(targetUserId, directAmountUsd, directNote);
      setActionToast({
        text: `Successfully credited $${directAmountUsd.toFixed(2)} USD to passenger wallet!`,
        type: 'success',
      });
    }
    setDirectAmountSos(10000);
    setDirectAmountUsd(1.00);
    setDirectNote('Direct Admin Wallet Credit');
    setTimeout(() => setActionToast(null), 3500);
    setActiveTab('ledger');
  };

  const handleCopyRef = (ref: string) => {
    navigator.clipboard.writeText(ref);
    setCopiedRef(ref);
    setTimeout(() => setCopiedRef(null), 2000);
  };

  // Filtered Fleet Drivers with Live Metrics
  const filteredDrivers = useMemo(() => {
    return (drivers || []).filter((drv) => {
      if (!drv) return false;
      const balUsd = getDriverWalletBalance(drv.id) || (drv.phone ? getDriverWalletBalance(drv.phone) : 0);
      const q = (driverSearchQuery || '').toLowerCase().trim();
      const matchesSearch =
        !q ||
        (drv.name || '').toLowerCase().includes(q) ||
        (drv.phone || '').toLowerCase().includes(q) ||
        (drv.vehicle?.licensePlate || '').toLowerCase().includes(q) ||
        (drv.id || '').toLowerCase().includes(q);

      if (driverStatusFilter === 'eligible') {
        return matchesSearch && balUsd >= 0.10;
      }
      if (driverStatusFilter === 'lockout') {
        return matchesSearch && balUsd < 0.10 && balUsd > 0;
      }
      if (driverStatusFilter === 'zero') {
        return matchesSearch && balUsd === 0;
      }
      return matchesSearch;
    });
  }, [drivers, getDriverWalletBalance, driverSearchQuery, driverStatusFilter]);

  // Filtered Ledger Transactions
  const filteredTxs = useMemo(() => {
    return driverWalletTransactions.filter((tx) => {
      const matchesSearch =
        (tx.driverName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tx.driverPhone || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tx.referenceId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tx.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tx.id || '').toLowerCase().includes(searchTerm.toLowerCase());

      if (filterStatus === 'commission') {
        return (
          matchesSearch &&
          (tx.type === 'commission_deduction' || tx.amountSos < 0 || (tx.title || '').toLowerCase().includes('commission'))
        );
      }
      if (filterStatus === 'pending') return matchesSearch && tx.status === 'pending_verification';
      if (filterStatus === 'completed') return matchesSearch && tx.status === 'completed';
      if (filterStatus === 'rejected') return matchesSearch && tx.status === 'rejected';
      return matchesSearch;
    });
  }, [driverWalletTransactions, searchTerm, filterStatus]);

  // Selected Driver Specific Transactions for History Modal
  const selectedDriverTransactions = useMemo(() => {
    if (!selectedDriverForHistory) return [];
    const dId = selectedDriverForHistory.id;
    const dPhone = selectedDriverForHistory.phone ? selectedDriverForHistory.phone.replace(/\D/g, '') : '';

    return driverWalletTransactions.filter((tx) => {
      const txPhone = tx.driverPhone ? tx.driverPhone.replace(/\D/g, '') : '';
      return (
        tx.driverId === dId ||
        (dPhone && txPhone && (txPhone === dPhone || txPhone.endsWith(dPhone) || dPhone.endsWith(txPhone)))
      );
    });
  }, [selectedDriverForHistory, driverWalletTransactions]);

  // Live Math preview for modal
  const previewMath = useMemo(() => {
    if (!selectedDriverForEdit) return null;
    const curBal =
      getDriverWalletBalance(selectedDriverForEdit.id) ||
      (selectedDriverForEdit.phone ? getDriverWalletBalance(selectedDriverForEdit.phone) : 0) ||
      0;
    const amt = parseFloat(inputUsd) || 0;

    let newBal = 0;
    if (editOperation === 'add') {
      newBal = Math.max(0, Math.round((curBal + amt) * 100) / 100);
    } else if (editOperation === 'deduct') {
      newBal = Math.max(0, Math.round((curBal - Math.min(curBal, amt)) * 100) / 100);
    } else {
      newBal = Math.max(0, Math.round(amt * 100) / 100);
    }

    const newSos = Math.round(newBal * EXCHANGE_RATE_USD_TO_SLSH);
    const isEligible = newBal >= (pricing?.driverMinWalletThresholdUsd || 0.10);

    return {
      currentUsd: curBal,
      currentSos: Math.round(curBal * EXCHANGE_RATE_USD_TO_SLSH),
      deltaUsd: amt,
      deltaSos: Math.round(amt * EXCHANGE_RATE_USD_TO_SLSH),
      resultUsd: newBal,
      resultSos: newSos,
      isEligible,
    };
  }, [selectedDriverForEdit, inputUsd, editOperation, getDriverWalletBalance, pricing]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6 shadow-xl space-y-5 text-slate-900 dark:text-white font-sans">
      {/* Toast Alert Feedback */}
      {actionToast && (
        <div
          className={`p-3.5 rounded-2xl flex items-center justify-between text-xs font-bold transition-all shadow-md animate-fade-in ${
            actionToast.type === 'success'
              ? 'bg-emerald-500 text-slate-950 border border-emerald-400'
              : 'bg-rose-500 text-white border border-rose-400'
          }`}
        >
          <div className="flex items-center space-x-2">
            {actionToast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 shrink-0" />
            )}
            <span>{actionToast.text}</span>
          </div>
          <button onClick={() => setActionToast(null)} className="p-1 hover:opacity-75 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. BRANDED HEADER & ACTION BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-emerald-500/20 shrink-0">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <WadaageLogo variant="wordmark" size="xs" appType="admin" />
              <span className="text-[10px] bg-emerald-500 text-slate-950 font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                Driver Wallet Control
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Full control over driver balances, live calculations, float adjustments, trip commission deductions, and pending top-up approvals.
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('drivers')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'drivers'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Driver Fleet & Wallets ({drivers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center space-x-1.5 cursor-pointer relative ${
              activeTab === 'pending'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Pending Top-Ups</span>
            {pendingTxs.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-amber-400 text-slate-950 font-black text-[10px] rounded-full animate-pulse">
                {pendingTxs.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('credit')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'credit'
                ? 'bg-teal-500 text-slate-950 shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Direct Credit</span>
          </button>

          <button
            onClick={() => setActiveTab('ledger')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center space-x-1.5 cursor-pointer ${
              activeTab === 'ledger'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Full Ledger & Usage</span>
          </button>
        </div>
      </div>

      {/* 2. KPI METRICS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
        <div className="p-3.5 bg-emerald-50/80 dark:bg-emerald-950/20 rounded-2xl border border-emerald-200 dark:border-emerald-800/40">
          <span className="text-slate-500 dark:text-emerald-300 block text-[10px] font-bold uppercase">Fleet Drivers</span>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{drivers.length}</span>
          <span className="text-[10px] text-emerald-700 dark:text-emerald-300 block font-semibold mt-0.5">
            Fleet Float: ${totalFleetBalanceUsd.toFixed(2)} USD
          </span>
        </div>

        <div className="p-3.5 bg-indigo-50/80 dark:bg-indigo-950/20 rounded-2xl border border-indigo-200 dark:border-indigo-800/40">
          <span className="text-slate-500 dark:text-indigo-300 block text-[10px] font-bold uppercase">Commission Deducted</span>
          <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
            ${totalCommissionDeductedUsd.toFixed(2)}
          </span>
          <span className="text-[10px] text-indigo-700 dark:text-indigo-300 block font-semibold font-mono mt-0.5">
            {totalCommissionDeductedSos.toLocaleString()} SLSH (Rides)
          </span>
        </div>

        <div className="p-3.5 bg-amber-50/80 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-800/40">
          <span className="text-slate-500 dark:text-amber-300 block text-[10px] font-bold uppercase">Pending Top-Ups</span>
          <span className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">{pendingTxs.length}</span>
          <span className="text-[10px] text-amber-700 dark:text-amber-300 block font-semibold mt-0.5">
            Requires Admin Approval
          </span>
        </div>

        <div className="p-3.5 bg-teal-50/80 dark:bg-teal-950/20 rounded-2xl border border-teal-200 dark:border-teal-800/40">
          <span className="text-slate-500 dark:text-teal-300 block text-[10px] font-bold uppercase">Total Credited</span>
          <span className="text-2xl font-black text-teal-600 dark:text-teal-400 font-mono">
            ${completedTxs.reduce((sum, t) => sum + (t.amountUsd || 0), 0).toFixed(2)}
          </span>
          <span className="text-[10px] text-teal-700 dark:text-teal-300 block font-semibold font-mono mt-0.5">
            {completedTxs.reduce((sum, t) => sum + (t.amountSos || 0), 0).toLocaleString()} SLSH
          </span>
        </div>

        <div className="p-3.5 bg-rose-50/80 dark:bg-rose-950/20 rounded-2xl border border-rose-200 dark:border-rose-800/40">
          <span className="text-slate-500 dark:text-rose-300 block text-[10px] font-bold uppercase">Rejected Receipts</span>
          <span className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono">{rejectedTxs.length}</span>
          <span className="text-[10px] text-rose-700 dark:text-rose-300 block font-semibold mt-0.5">
            Void / Unmatched Ref
          </span>
        </div>
      </div>

      {/* 3. TAB: FLEET DRIVER BALANCES & DIRECT ACTIONS */}
      {activeTab === 'drivers' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search driver by name, phone, plate, or ID..."
                value={driverSearchQuery}
                onChange={(e) => setDriverSearchQuery(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500 shadow-sm"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
              <span className="text-[10px] text-slate-400 uppercase font-black mr-1">Filter:</span>
              {(
                [
                  { id: 'all', label: 'All Drivers' },
                  { id: 'eligible', label: 'Eligible (≥ $0.10)' },
                  { id: 'lockout', label: 'Low Float (< $0.10)' },
                  { id: 'zero', label: 'Zero Float ($0.00)' },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  onClick={() => setDriverStatusFilter(f.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    driverStatusFilter === f.id
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Drivers Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-extrabold uppercase text-[10px]">
                  <th className="py-3 px-3.5">Driver Partner</th>
                  <th className="py-3 px-3.5">Vehicle & Plate</th>
                  <th className="py-3 px-3.5 text-right">Real Balance (USD)</th>
                  <th className="py-3 px-3.5 text-right">Real Balance (SLSH)</th>
                  <th className="py-3 px-3.5 text-center">Float Status</th>
                  <th className="py-3 px-3.5 text-center">Trips</th>
                  <th className="py-3 px-3.5 text-center">Actions & Wallet Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredDrivers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-400">
                      <Wallet className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                      <p className="font-bold">No drivers matching filter found.</p>
                    </td>
                  </tr>
                ) : (
                  filteredDrivers.map((drv) => {
                    const balUsd = getDriverWalletBalance(drv.id) || (drv.phone ? getDriverWalletBalance(drv.phone) : 0);
                    const balSos = Math.round(balUsd * EXCHANGE_RATE_USD_TO_SLSH);
                    const isEligible = balUsd >= (pricing?.driverMinWalletThresholdUsd || 0.10);
                    const isZero = balUsd === 0;

                    return (
                      <tr key={drv.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        {/* Driver Profile */}
                        <td className="py-3 px-3.5">
                          <div className="flex items-center space-x-2.5">
                            <div className="w-9 h-9 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 font-black flex items-center justify-center shrink-0 border border-emerald-300 dark:border-emerald-700 shadow-sm overflow-hidden">
                              {drv.avatar ? (
                                <img src={drv.avatar} alt={drv?.name || 'Driver'} className="w-full h-full object-cover" />
                              ) : (
                                (drv?.name ? String(drv.name).charAt(0) : 'D')
                              )}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 dark:text-white block">{drv.name || 'Driver Partner'}</span>
                              <div className="flex items-center space-x-1.5 text-[10px] text-slate-500 font-mono">
                                <span>{drv.phone || 'N/A'}</span>
                                <span>•</span>
                                <span className="text-slate-400">{drv.id}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Vehicle */}
                        <td className="py-3 px-3.5">
                          <span className="font-mono font-bold text-slate-800 dark:text-slate-200 block">
                            {drv.vehicle?.licensePlate || (drv as any).licensePlate || 'SL-0000'}
                          </span>
                          <span className="text-[10px] text-slate-400 capitalize">
                            {drv.vehicle?.model || 'Toyota'} • {drv.vehicle?.category?.replace('_', ' ') || 'Taxi'}
                          </span>
                        </td>

                        {/* USD Balance */}
                        <td className="py-3 px-3.5 text-right font-mono">
                          <span
                            className={`font-black text-sm block ${
                              isZero
                                ? 'text-slate-400 dark:text-slate-500'
                                : isEligible
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-amber-500'
                            }`}
                          >
                            ${balUsd.toFixed(2)}
                          </span>
                          <span className="text-[10px] text-slate-400">USD</span>
                        </td>

                        {/* SLSH Balance */}
                        <td className="py-3 px-3.5 text-right font-mono">
                          <span className="font-bold text-slate-900 dark:text-white text-xs block">
                            {balSos.toLocaleString()}
                          </span>
                          <span className="text-[10px] text-slate-400">SLSH</span>
                        </td>

                        {/* Status badge */}
                        <td className="py-3 px-3.5 text-center">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                              isZero
                                ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                                : isEligible
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                            }`}
                          >
                            {isZero ? 'Fresh $0.00' : isEligible ? 'Eligible Float' : 'Low Float (<$0.10)'}
                          </span>
                        </td>

                        {/* Trips */}
                        <td className="py-3 px-3.5 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                          {drv.totalTrips || 0}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3.5 text-center">
                          <div className="flex items-center justify-center space-x-1.5">
                            {/* Primary Adjust Button */}
                            <button
                              onClick={() => handleOpenDriverModal(drv, 'add')}
                              className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-[10px] uppercase tracking-wider flex items-center space-x-1 transition shadow-sm cursor-pointer"
                              title="Add, Deduct, or Set exact driver wallet balance"
                            >
                              <Sliders className="w-3 h-3" />
                              <span>Adjust</span>
                            </button>

                            {/* View History Button */}
                            <button
                              onClick={() => setSelectedDriverForHistory(drv)}
                              className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-[10px] flex items-center space-x-1 transition cursor-pointer"
                              title="View driver usage and ledger history"
                            >
                              <History className="w-3 h-3" />
                              <span>Usage</span>
                            </button>

                            {/* Quick +1,000 SLSH (+$0.10) Float */}
                            <button
                              onClick={() =>
                                handleQuickAdjustment(
                                  drv,
                                  'add',
                                  0.10,
                                  'Quick +1,000 SLSH ($0.10) Float Credit from Admin Fleet'
                                )
                              }
                              className="p-1.5 bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 hover:bg-teal-100 rounded-lg text-[10px] font-bold border border-teal-300 dark:border-teal-700/50 cursor-pointer"
                              title="Quick +1,000 SLSH (+$0.10 float for 1 trip)"
                            >
                              +1K
                            </button>

                            {/* Quick Reset to $0.00 */}
                            <button
                              onClick={() =>
                                handleQuickAdjustment(
                                  drv,
                                  'set',
                                  0.00,
                                  'Reset driver balance to $0.00 (Fresh account state)'
                                )
                              }
                              className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-rose-500 rounded-lg text-[10px] font-bold border border-slate-200 dark:border-slate-700 cursor-pointer"
                              title="Quick Reset to $0.00 (Fresh state)"
                            >
                              <RotateCcw className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. TAB: PENDING TOP-UP APPROVALS */}
      {activeTab === 'pending' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="font-extrabold text-sm text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>Pending Driver Top-Up Requests ({pendingTxs.length})</span>
              </h4>
              <p className="text-[11px] text-slate-500">
                Drivers submit top-ups via ZAAD, eDahab, or EVC Plus. Admin must review, verify the payment receipt, and approve to credit the driver wallet.
              </p>
            </div>
            {pendingTxs.length > 0 && (
              <span className="text-[11px] font-bold text-amber-500 bg-amber-500/10 px-3 py-1 rounded-xl self-start sm:self-auto">
                {pendingTxs.length} Top-Up Request(s) Awaiting Review
              </span>
            )}
          </div>

          {pendingTxs.length === 0 ? (
            <div className="p-10 text-center bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-500 text-xs">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <p className="font-extrabold text-slate-800 dark:text-slate-200 text-sm">All Top-Ups Reviewed!</p>
              <p className="text-[11px] text-slate-400 mt-1">No driver top-up requests are pending at this time.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3.5">
              {pendingTxs.map((tx) => {
                const currentEditedSos = editedAmounts[tx.id] !== undefined ? editedAmounts[tx.id] : tx.amountSos;
                const isAmountChanged = currentEditedSos !== (tx.originalRequestedAmountSos || tx.amountSos);
                const editedUsd = (currentEditedSos / 10000).toFixed(2);
                const isProcessing = processingTxIds[tx.id] || false;

                return (
                  <div
                    key={tx.id}
                    className="p-4 bg-amber-50/70 dark:bg-slate-800/80 border-2 border-amber-300 dark:border-amber-500/40 rounded-3xl space-y-3.5 shadow-sm transition hover:shadow-md"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-amber-200 dark:border-slate-700">
                      <div className="flex items-center space-x-3">
                        <div className="w-11 h-11 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-base shadow-sm">
                          {(tx?.driverName ? String(tx.driverName).charAt(0) : 'D')}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                              {tx.driverName || 'Captain / Driver'}
                            </span>
                            <span className="px-2.5 py-0.5 bg-amber-500 text-slate-950 font-black text-[10px] rounded-full uppercase">
                              PENDING APPROVAL
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                            <span>Phone: {tx.driverPhone || 'N/A'}</span>
                            <span>•</span>
                            <span>Provider: <strong className="text-amber-600 dark:text-amber-400 uppercase">{tx.paymentProvider || 'ZAAD'}</strong></span>
                          </div>
                        </div>
                      </div>

                      {/* Reference Code with Copy */}
                      <div className="flex items-center space-x-2">
                        <div className="px-3 py-1.5 bg-white dark:bg-slate-900 rounded-xl border border-amber-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-2">
                          <span>Ref: {tx.referenceId || tx.id}</span>
                          <button
                            onClick={() => handleCopyRef(tx.referenceId || tx.id)}
                            className="text-slate-400 hover:text-emerald-500 cursor-pointer"
                            title="Copy reference code"
                          >
                            {copiedRef === (tx.referenceId || tx.id) ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">{tx.date}</span>
                      </div>
                    </div>

                    {/* SMS / Details Section */}
                    {tx.smsReceiptText && (
                      <div className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-600 dark:text-slate-300">
                        <span className="text-[10px] text-slate-400 uppercase font-black block mb-0.5">SMS Receipt Note:</span>
                        <p className="break-words">{tx.smsReceiptText}</p>
                      </div>
                    )}

                    {/* Amount & Action Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                      <div className="flex items-center space-x-3">
                        <div>
                          <span className="text-[10px] text-slate-400 uppercase font-bold block">Credit Amount (SLSH):</span>
                          <div className="flex items-center space-x-1.5 mt-0.5">
                            <input
                              type="number"
                              value={currentEditedSos}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                setEditedAmounts((prev) => ({ ...prev, [tx.id]: val }));
                              }}
                              step={500}
                              min={1000}
                              className="w-32 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                            />
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                              (${editedUsd} USD)
                            </span>
                          </div>
                        </div>

                        {isAmountChanged && (
                          <span className="text-[10px] font-bold text-amber-600 bg-amber-100 dark:bg-amber-950/60 px-2 py-1 rounded-lg">
                            Modified from {tx.amountSos.toLocaleString()} SLSH
                          </span>
                        )}
                      </div>

                      {/* Approval Actions */}
                      <div className="flex items-center space-x-2">
                        {/* Reject Button */}
                        <button
                          onClick={() => setRejectingTxId(tx.id)}
                          disabled={isProcessing}
                          className="px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-800 rounded-xl text-xs font-bold transition flex items-center space-x-1 cursor-pointer disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>Reject</span>
                        </button>

                        {/* Approve Button */}
                        <button
                          onClick={() => handleVerify(tx)}
                          disabled={isProcessing}
                          className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-md transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {isProcessing ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-4 h-4" />
                          )}
                          <span>Approve & Credit Balance</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 5. TAB: DIRECT CREDIT / DEBIT (FAST FORM) */}
      {activeTab === 'credit' && (
        <form
          onSubmit={handleDirectCreditSubmit}
          className="p-5 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4 max-w-2xl"
        >
          <div>
            <h4 className="font-extrabold text-sm text-teal-600 dark:text-teal-400 uppercase tracking-wider flex items-center space-x-2">
              <PlusCircle className="w-4 h-4" />
              <span>Direct Admin Wallet Credit (Driver / Passenger)</span>
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Directly credit a driver or passenger without going through payment gateways. Updates working balance and creates an audit entry.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Target Account Role:</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTargetType('driver')}
                  className={`py-2 px-3 rounded-xl font-bold transition cursor-pointer flex items-center justify-center space-x-1 ${
                    targetType === 'driver'
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <Car className="w-3.5 h-3.5" />
                  <span>Driver Partner</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTargetType('passenger')}
                  className={`py-2 px-3 rounded-xl font-bold transition cursor-pointer flex items-center justify-center space-x-1 ${
                    targetType === 'passenger'
                      ? 'bg-teal-500 text-slate-950 shadow-sm'
                      : 'bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Passenger</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Select {targetType === 'driver' ? 'Driver Partner' : 'Passenger'}:
              </label>
              {targetType === 'driver' ? (
                <select
                  value={targetDriverId}
                  onChange={(e) => setTargetDriverId(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl py-2 px-3 text-slate-900 dark:text-white font-bold outline-none focus:border-emerald-500 text-xs"
                >
                  {(drivers || []).map((drv) => {
                    if (!drv) return null;
                    const b = getDriverWalletBalance(drv.id) || (drv.phone ? getDriverWalletBalance(drv.phone) : 0);
                    return (
                      <option key={drv.id} value={drv.id}>
                        {drv.name || 'Driver Partner'} ({drv.phone || 'N/A'}) — Balance: ${b.toFixed(2)} ({(b * 10000).toLocaleString()} SLSH)
                      </option>
                    );
                  })}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="Enter passenger phone or user ID"
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl py-2 px-3 text-slate-900 dark:text-white font-bold outline-none focus:border-emerald-500 text-xs"
                />
              )}
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                Credit Amount ({targetType === 'driver' ? 'SLSH' : 'USD'}):
              </label>
              {targetType === 'driver' ? (
                <div className="relative">
                  <input
                    type="number"
                    value={directAmountSos}
                    onChange={(e) => setDirectAmountSos(Number(e.target.value))}
                    step={500}
                    min={1000}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl py-2 pl-3 pr-24 text-slate-900 dark:text-white font-mono font-bold outline-none focus:border-emerald-500 text-xs"
                  />
                  <span className="absolute right-3 top-2 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold font-mono">
                    ${(directAmountSos / 10000).toFixed(2)} USD
                  </span>
                </div>
              ) : (
                <input
                  type="number"
                  value={directAmountUsd}
                  onChange={(e) => setDirectAmountUsd(Number(e.target.value))}
                  step={0.50}
                  min={0.10}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl py-2 px-3 text-slate-900 dark:text-white font-mono font-bold outline-none focus:border-emerald-500 text-xs"
                />
              )}
            </div>

            <div>
              <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Verification Note / Reason:</label>
              <input
                type="text"
                value={directNote}
                onChange={(e) => setDirectNote(e.target.value)}
                placeholder="e.g. Office cash deposit or manual credit"
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl py-2 px-3 text-slate-900 dark:text-white font-semibold outline-none focus:border-emerald-500 text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-md transition cursor-pointer"
            >
              Verify & Credit {targetType === 'driver' ? `${directAmountSos.toLocaleString()} SLSH ($${(directAmountSos / 10000).toFixed(2)})` : `$${directAmountUsd.toFixed(2)} USD`}
            </button>
          </div>
        </form>
      )}

      {/* 6. TAB: FULL TRANSACTION LEDGER & USAGE HISTORY */}
      {activeTab === 'ledger' && (
        <div className="space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-slate-50 dark:bg-slate-800/40 p-3 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search transactions by driver name, phone, or ref code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5 shrink-0">
              {(['all', 'commission', 'pending', 'completed', 'rejected'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setFilterStatus(st)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition cursor-pointer ${
                    filterStatus === st
                      ? st === 'commission'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {st === 'commission' ? 'Commissions (-$0.10)' : st}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-extrabold uppercase text-[10px]">
                  <th className="py-3 px-3.5">Date & Ref ID</th>
                  <th className="py-3 px-3.5">Driver / User</th>
                  <th className="py-3 px-3.5">Provider / Channel</th>
                  <th className="py-3 px-3.5 text-right">Amount (SLSH & USD)</th>
                  <th className="py-3 px-3.5 text-center">Status</th>
                  <th className="py-3 px-3.5">Admin / Ledger Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filteredTxs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400 text-xs">
                      No transaction records found matching filter.
                    </td>
                  </tr>
                ) : (
                  filteredTxs.map((tx) => {
                    const isPending = tx.status === 'pending_verification';
                    const isCompleted = tx.status === 'completed';
                    const isRejected = tx.status === 'rejected';
                    const isDeduction = tx.type === 'commission_deduction' || tx.amountSos < 0 || (tx.title || '').includes('Deducted');

                    return (
                      <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-3.5">
                          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400 block">
                            {tx.referenceId || tx.id}
                          </span>
                          <span className="text-[10px] text-slate-400">{tx.date}</span>
                        </td>

                        <td className="py-3 px-3.5">
                          <span className="font-bold text-slate-900 dark:text-white block">
                            {tx.driverName || 'Captain / Driver'}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">{tx.driverPhone || 'N/A'}</span>
                        </td>

                        <td className="py-3 px-3.5">
                          <span className="uppercase font-bold text-xs text-amber-600 dark:text-amber-400">
                            {tx.paymentProvider || (isDeduction ? 'Ride Deduction' : 'Admin')}
                          </span>
                        </td>

                        <td className="py-3 px-3.5 text-right font-mono">
                          <span
                            className={`font-black block text-sm ${
                              isDeduction
                                ? 'text-rose-500'
                                : tx.amountSos > 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-slate-400'
                            }`}
                          >
                            {isDeduction ? '-' : '+'}
                            {Math.abs(tx.amountSos).toLocaleString()} SLSH
                          </span>
                          <span className="text-[10px] text-slate-400">
                            (${Math.abs(tx.amountUsd).toFixed(2)} USD)
                          </span>
                        </td>

                        <td className="py-3 px-3.5 text-center">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                              isCompleted
                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                                : isPending
                                ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border-amber-500/30'
                                : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border-rose-500/30'
                            }`}
                          >
                            {isCompleted ? 'COMPLETED' : isPending ? 'PENDING' : 'REJECTED'}
                          </span>
                        </td>

                        <td className="py-3 px-3.5 text-xs text-slate-500 dark:text-slate-400 max-w-xs truncate">
                          {tx.adminNote || tx.title}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. MODAL: DEDICATED DRIVER WALLET CONTROLLER & CALCULATOR MODAL           */}
      {/* ========================================================================= */}
      {selectedDriverForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in font-sans">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base flex items-center gap-2">
                    Adjust Driver Wallet
                    <span className="text-[10px] bg-slate-950/80 text-emerald-300 font-mono px-2 py-0.5 rounded-full uppercase">
                      Admin Control
                    </span>
                  </h3>
                  <p className="text-xs text-emerald-100">
                    {selectedDriverForEdit.name} • {selectedDriverForEdit.phone}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDriverForEdit(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
              {/* Driver Current Balance Banner */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-black block">Current Working Balance</span>
                  <div className="flex items-baseline space-x-2 mt-0.5">
                    <span className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                      ${previewMath?.currentUsd.toFixed(2)} USD
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      ({previewMath?.currentSos.toLocaleString()} SLSH)
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Vehicle</span>
                  <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                    {selectedDriverForEdit.vehicle?.licensePlate || 'SL-0000'}
                  </span>
                </div>
              </div>

              {/* 1. Operation Mode Cards (Add / Deduct / Set) */}
              <div>
                <label className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 block mb-2">
                  Select Wallet Action:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {/* Add */}
                  <button
                    type="button"
                    onClick={() => {
                      setEditOperation('add');
                      if (inputSlsh === '0' || inputUsd === '0.00') {
                        setInputSlsh('10000');
                        setInputUsd('1.00');
                      }
                      setCustomAdminReason('Prepaid Float Top-Up');
                    }}
                    className={`p-3 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center justify-center space-y-1 ${
                      editOperation === 'add'
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-sm ring-2 ring-emerald-500/20'
                        : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <PlusCircle className="w-5 h-5 text-emerald-500" />
                    <span className="text-xs font-black uppercase">Add / Increase</span>
                    <span className="text-[9px] text-slate-400">Credit Float</span>
                  </button>

                  {/* Deduct */}
                  <button
                    type="button"
                    onClick={() => {
                      setEditOperation('deduct');
                      setCustomAdminReason('Commission / Float Deduction');
                    }}
                    className={`p-3 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center justify-center space-y-1 ${
                      editOperation === 'deduct'
                        ? 'bg-rose-500/10 border-rose-500 text-rose-600 dark:text-rose-400 shadow-sm ring-2 ring-rose-500/20'
                        : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <MinusCircle className="w-5 h-5 text-rose-500" />
                    <span className="text-xs font-black uppercase">Reduce / Deduct</span>
                    <span className="text-[9px] text-slate-400">Debit Balance</span>
                  </button>

                  {/* Set Exact */}
                  <button
                    type="button"
                    onClick={() => {
                      setEditOperation('set');
                      setInputSlsh('0');
                      setInputUsd('0.00');
                      setCustomAdminReason('Account Reset ($0.00)');
                    }}
                    className={`p-3 rounded-2xl border text-center transition cursor-pointer flex flex-col items-center justify-center space-y-1 ${
                      editOperation === 'set'
                        ? 'bg-indigo-500/10 border-indigo-500 text-indigo-600 dark:text-indigo-400 shadow-sm ring-2 ring-indigo-500/20'
                        : 'bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                    }`}
                  >
                    <RotateCcw className="w-5 h-5 text-indigo-500" />
                    <span className="text-xs font-black uppercase">Set Exact</span>
                    <span className="text-[9px] text-slate-400">Direct Override</span>
                  </button>
                </div>
              </div>

              {/* 2. Bi-directional Input Fields (SLSH & USD) */}
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 block">
                  Adjustment Amount:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {/* SLSH Input */}
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block mb-1">Somaliland Shilling (SLSH):</span>
                    <div className="relative">
                      <input
                        type="text"
                        value={inputSlsh}
                        onChange={(e) => handleSlshInputChange(e.target.value)}
                        placeholder="10000"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl py-2 px-3 text-sm font-mono font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                      />
                      <span className="absolute right-3 top-2.5 text-[10px] text-slate-400 font-bold">SLSH</span>
                    </div>
                  </div>

                  {/* USD Input */}
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block mb-1">US Dollar ($ USD):</span>
                    <div className="relative">
                      <input
                        type="number"
                        step={0.01}
                        value={inputUsd}
                        onChange={(e) => handleUsdInputChange(e.target.value)}
                        placeholder="1.00"
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl py-2 px-3 text-sm font-mono font-bold text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                      />
                      <span className="absolute right-3 top-2.5 text-[10px] text-emerald-500 font-bold font-mono">$ USD</span>
                    </div>
                  </div>
                </div>

                {/* Quick Presets Pills */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => handleSelectPreset(1000)}
                    className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold font-mono cursor-pointer"
                  >
                    +1,000 SLSH ($0.10)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectPreset(5000)}
                    className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold font-mono cursor-pointer"
                  >
                    +5,000 SLSH ($0.50)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectPreset(10000)}
                    className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold font-mono cursor-pointer"
                  >
                    +10,000 SLSH ($1.00)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectPreset(20000)}
                    className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold font-mono cursor-pointer"
                  >
                    +20,000 SLSH ($2.00)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditOperation('set');
                      setInputSlsh('0');
                      setInputUsd('0.00');
                      setCustomAdminReason('Account Reset ($0.00)');
                    }}
                    className="px-2.5 py-1 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 rounded-lg text-[10px] font-bold cursor-pointer"
                  >
                    Reset to $0.00
                  </button>
                </div>
              </div>

              {/* 3. Real-Time Live Calculation Preview Card */}
              {previewMath && (
                <div className="p-3.5 bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-[10px] uppercase font-mono font-bold text-slate-400">
                    <span>Live Math Calculation</span>
                    <span className={previewMath.isEligible ? 'text-emerald-400' : 'text-amber-400'}>
                      {previewMath.isEligible ? 'Eligible Float (Active)' : 'Lockout Float (<$0.10)'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between font-mono text-xs">
                    <div className="text-left">
                      <span className="text-[10px] text-slate-500 block">Current</span>
                      <span className="font-bold text-slate-300">${previewMath.currentUsd.toFixed(2)}</span>
                    </div>

                    <div className="flex items-center space-x-1 text-slate-400 font-black">
                      <span>{editOperation === 'add' ? '+' : editOperation === 'deduct' ? '-' : '='}</span>
                      <span>${previewMath.deltaUsd.toFixed(2)}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block">New Result</span>
                      <span
                        className={`font-black text-base ${
                          previewMath.resultUsd === 0
                            ? 'text-slate-400'
                            : previewMath.isEligible
                            ? 'text-emerald-400'
                            : 'text-amber-400'
                        }`}
                      >
                        ${previewMath.resultUsd.toFixed(2)} USD
                      </span>
                    </div>
                  </div>

                  <div className="text-[10px] font-mono text-slate-400 text-right">
                    New SLSH equivalent: <strong className="text-white">{previewMath.resultSos.toLocaleString()} SLSH</strong>
                  </div>
                </div>
              )}

              {/* 4. Reason / Audit Note */}
              <div>
                <label className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 block mb-1">
                  Admin Audit Reason / Note:
                </label>
                <input
                  type="text"
                  value={customAdminReason}
                  onChange={(e) => setCustomAdminReason(e.target.value)}
                  placeholder="e.g. Office cash deposit, dispute correction, refund"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl py-2 px-3 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-emerald-500"
                />

                {/* Suggestions chips */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  {[
                    'Office Cash Top-Up',
                    'Trip Commission Deduction',
                    'Manual Balance Correction',
                    'Driver Account Reset ($0.00)',
                    'Dispute Settlement',
                  ].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setCustomAdminReason(s)}
                      className="text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:text-emerald-500 px-2 py-0.5 rounded-md cursor-pointer"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setSelectedDriverForEdit(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleExecuteDriverAdjustment}
                disabled={isSubmittingAdjustment}
                className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSubmittingAdjustment ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Applying...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Apply Adjustment Now</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. MODAL: DRIVER USAGE & LEDGER HISTORY MODAL                            */}
      {/* ========================================================================= */}
      {selectedDriverForHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in font-sans">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base flex items-center gap-2">
                    Driver Wallet Usage & Ledger
                    <span className="text-[10px] bg-indigo-500 text-slate-950 font-black px-2 py-0.5 rounded-full uppercase">
                      Audit
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    {selectedDriverForHistory.name} ({selectedDriverForHistory.phone}) • {selectedDriverForHistory.vehicle?.licensePlate || 'SL-0000'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDriverForHistory(null)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto">
              {/* Summary Stats for this Driver */}
              <div className="grid grid-cols-3 gap-2.5 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Current Balance</span>
                  <span className="text-lg font-black font-mono text-emerald-600 dark:text-emerald-400 block">
                    ${(getDriverWalletBalance(selectedDriverForHistory.id) || 0).toFixed(2)}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {Math.round((getDriverWalletBalance(selectedDriverForHistory.id) || 0) * 10000).toLocaleString()} SLSH
                  </span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Top-Ups Credited</span>
                  <span className="text-lg font-black font-mono text-teal-600 dark:text-teal-400 block">
                    $
                    {selectedDriverTransactions
                      .filter((t) => t.status === 'completed' && t.amountSos > 0 && !t.title?.includes('Deducted'))
                      .reduce((sum, t) => sum + (t.amountUsd || 0), 0)
                      .toFixed(2)}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">Completed Top-Ups</span>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Commission Deducted</span>
                  <span className="text-lg font-black font-mono text-indigo-600 dark:text-indigo-400 block">
                    $
                    {Math.abs(
                      selectedDriverTransactions
                        .filter((t) => t.type === 'commission_deduction' || t.amountSos < 0 || t.title?.includes('Deducted'))
                        .reduce((sum, t) => sum + (t.amountUsd || 0), 0)
                    ).toFixed(2)}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">Trip Commission</span>
                </div>
              </div>

              {/* Transactions List */}
              <div className="space-y-2">
                <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                  All Activity & Transaction Records ({selectedDriverTransactions.length})
                </span>

                {selectedDriverTransactions.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs text-slate-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                    <p className="font-bold">No recorded transactions for this driver.</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Fresh account state with zero usage.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-extrabold uppercase text-[10px]">
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Type & Title</th>
                          <th className="py-2.5 px-3 text-right">Amount</th>
                          <th className="py-2.5 px-3 text-center">Status</th>
                          <th className="py-2.5 px-3">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                        {selectedDriverTransactions.map((tx) => {
                          const isDeduct = tx.type === 'commission_deduction' || tx.amountSos < 0 || tx.title?.includes('Deducted');

                          return (
                            <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                              <td className="py-2.5 px-3 text-[10px] font-mono text-slate-400 whitespace-nowrap">
                                {tx.date}
                              </td>

                              <td className="py-2.5 px-3">
                                <span className="font-bold text-slate-900 dark:text-white block text-xs">
                                  {tx.title || 'Transaction'}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  Ref: {tx.referenceId || tx.id}
                                </span>
                              </td>

                              <td className="py-2.5 px-3 text-right font-mono">
                                <span
                                  className={`font-black text-xs block ${
                                    isDeduct ? 'text-rose-500' : 'text-emerald-600 dark:text-emerald-400'
                                  }`}
                                >
                                  {isDeduct ? '-' : '+'}
                                  {Math.abs(tx.amountSos).toLocaleString()} SLSH
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  (${Math.abs(tx.amountUsd).toFixed(2)})
                                </span>
                              </td>

                              <td className="py-2.5 px-3 text-center">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase border ${
                                    tx.status === 'completed'
                                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                                      : tx.status === 'pending_verification'
                                      ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border-amber-500/30'
                                      : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border-rose-500/30'
                                  }`}
                                >
                                  {tx.status === 'completed' ? 'DONE' : tx.status === 'pending_verification' ? 'PENDING' : 'REJECTED'}
                                </span>
                              </td>

                              <td className="py-2.5 px-3 text-[11px] text-slate-500 max-w-xs truncate">
                                {tx.adminNote || 'Processed'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => {
                  const d = selectedDriverForHistory;
                  setSelectedDriverForHistory(null);
                  handleOpenDriverModal(d, 'add');
                }}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition cursor-pointer flex items-center space-x-1.5"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Adjust This Driver's Balance</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedDriverForHistory(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. MODAL: REJECT TRANSACTION CONFIRMATION DIALOG                         */}
      {/* ========================================================================= */}
      {rejectingTxId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in font-sans">
          <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4">
            <div className="flex items-center space-x-3 text-rose-500">
              <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-extrabold text-base text-slate-900 dark:text-white">Reject Top-Up Request</h4>
                <p className="text-xs text-slate-500">The driver's wallet will NOT be credited.</p>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Rejection Reason (Visible to driver):
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white outline-none focus:border-rose-500"
                placeholder="Enter rejection reason..."
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingTxId(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleConfirmReject(rejectingTxId)}
                className="px-5 py-2 bg-rose-500 hover:bg-rose-600 text-white font-black rounded-xl text-xs uppercase tracking-wider transition cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
