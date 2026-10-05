import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  DollarSign,
  FileText,
  Lock,
  PhoneCall,
  RefreshCw,
  ShieldCheck,
  Wallet,
  X,
  Zap,
  TrendingUp,
  History,
  CreditCard,
  QrCode
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useRide } from '../../context/RideContext';
import { formatCurrency, EXCHANGE_RATE_USD_TO_SLSH } from '../../utils/geo';
import { WadaageLogo } from '../Common/WadaageLogo';

interface WadaageDriverWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WadaageDriverWalletModal: React.FC<WadaageDriverWalletModalProps> = ({ isOpen, onClose }) => {
  const {
    driverWallets,
    driverWalletBalanceUsd,
    driverWalletTransactions,
    getDriverWalletBalance,
    topUpDriverWallet,
    toggleDriverOnline,
    pricing,
    driverModeOnline,
    drivers,
    currentUser,
  } = useRide();

  const [walletTab, setWalletTab] = useState<'topup' | 'history' | 'earnings'>('topup');
  const [selectedAmount, setSelectedAmount] = useState<number>(1000); // Default 1,000 SOS ($0.10)
  const [provider, setProvider] = useState<'zaad' | 'evc' | 'edahab' | 'card'>('zaad');
  const [phone, setPhone] = useState<string>(currentUser?.phone || '0634112233');
  const [referenceId, setReferenceId] = useState<string>('');
  const [smsText, setSmsText] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedUSSD, setCopiedUSSD] = useState(false);

  // Dedicated reactive balance state variable tracking live driver balance
  const activeDriverId = currentUser?.role === 'driver' ? (currentUser.id || currentUser.phone || '') : '';
  const calculateCurrentBalanceUsd = () => {
    if (currentUser?.role === 'driver') {
      if (getDriverWalletBalance && activeDriverId) {
        const directBal = getDriverWalletBalance(activeDriverId);
        if (directBal !== undefined && !isNaN(directBal)) return directBal;
      }
      if (getDriverWalletBalance && currentUser?.phone) {
        const phoneBal = getDriverWalletBalance(currentUser.phone);
        if (phoneBal !== undefined && !isNaN(phoneBal)) return phoneBal;
      }
      if (currentUser.walletBalanceUsd !== undefined && !isNaN(Number(currentUser.walletBalanceUsd))) {
        return Number(currentUser.walletBalanceUsd);
      }
      return 0.00;
    }
    return driverWalletBalanceUsd !== undefined && !isNaN(driverWalletBalanceUsd) ? driverWalletBalanceUsd : 0.00;
  };

  const [activeBalanceUsd, setActiveBalanceUsd] = useState<number>(calculateCurrentBalanceUsd);

  // Force React useEffect synchronization hook watching real-time driver wallet state changes
  useEffect(() => {
    const freshBal = calculateCurrentBalanceUsd();
    setActiveBalanceUsd(freshBal);
  }, [driverWallets, driverWalletBalanceUsd, driverWalletTransactions, activeDriverId, currentUser, drivers, getDriverWalletBalance]);

  if (!isOpen) return null;

  const currentDriverRecord = drivers.find(
    (d) => d.id === currentUser?.id || d.phone === currentUser?.phone || d.name === currentUser?.name
  ) || drivers[0];

  const minThresholdUsd = pricing.driverMinWalletThresholdUsd || 0.10;
  const minThresholdSos = Math.round(minThresholdUsd * EXCHANGE_RATE_USD_TO_SLSH); // 1,000 SLSH
  const currentSos = Math.round(activeBalanceUsd * EXCHANGE_RATE_USD_TO_SLSH);
  const feeUsd = pricing.driverCommissionFeeUsd || 0.10;
  const feeSos = Math.round(feeUsd * EXCHANGE_RATE_USD_TO_SLSH); // 1,000 SLSH

  const isBelowMin = currentSos < minThresholdSos;

  // Dynamic USSD String Generator
  const ussdCode = provider === 'zaad'
    ? `*880*0636807814*${selectedAmount}#`
    : provider === 'edahab'
    ? `*770*0656807814*${selectedAmount}#`
    : provider === 'evc'
    ? `*770*0613680781*${(selectedAmount / EXCHANGE_RATE_USD_TO_SLSH).toFixed(2)}#`
    : '';

  const handleCopyUSSD = () => {
    if (!ussdCode) return;
    navigator.clipboard.writeText(ussdCode);
    setCopiedUSSD(true);
    setTimeout(() => setCopiedUSSD(false), 2500);
  };

  const handleTopUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing || selectedAmount <= 0) return;

    setIsProcessing(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    setTimeout(() => {
      try {
        const result = topUpDriverWallet(selectedAmount, provider, phone, referenceId, smsText);
        if (result.success) {
          setSuccessMsg(result.message);
          setReferenceId('');
          setSmsText('');
          setTimeout(() => {
            setSuccessMsg(null);
          }, 4000);
        } else {
          setErrorMsg(result.message);
        }
      } catch (err: any) {
        setErrorMsg(err?.message || 'Failed to submit top-up request. Please try again.');
      } finally {
        setIsProcessing(false);
      }
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in font-sans">
      <div className="bg-slate-900 text-white rounded-3xl max-w-lg w-full border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">

        {/* 1. BRANDED HEADER */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <WadaageLogo variant="wordmark" size="xs" appType="driver" />
                <span className="text-[9px] bg-emerald-500 text-slate-950 font-black px-2 py-0.5 rounded-full uppercase">
                  Wadaage Wallet
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Driver Prepaid Balance & Commission Ledger (1,000 SLSH / Trip)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. SUB-NAVIGATION TABS */}
        <div className="grid grid-cols-3 bg-slate-950 p-1.5 border-b border-slate-800 text-xs font-black">
          <button
            onClick={() => setWalletTab('topup')}
            className={`py-2 rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer ${
              walletTab === 'topup'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>TOP-UP WALLET</span>
          </button>

          <button
            onClick={() => setWalletTab('history')}
            className={`py-2 rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer ${
              walletTab === 'history'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>LEDGER LOGS</span>
          </button>

          <button
            onClick={() => setWalletTab('earnings')}
            className={`py-2 rounded-xl transition flex items-center justify-center space-x-1.5 cursor-pointer ${
              walletTab === 'earnings'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>EARNINGS</span>
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto custom-scrollbar">

          {/* 3. CURRENT WALLET BALANCE SUMMARY CARD */}
          <div className={`p-4 rounded-2xl border ${
            isBelowMin
              ? 'bg-rose-950/40 border-rose-500/50 text-rose-200'
              : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-100'
          }`}>
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
              <span>Wadaage Driver Prepaid Balance</span>
              {isBelowMin ? (
                <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> LOW BALANCE (&lt; 1,000 SLSH)
                </span>
              ) : (
                <span className="bg-emerald-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> ACTIVE / ONLINE READY
                </span>
              )}
            </div>

            <div className="flex items-baseline space-x-2 mt-2">
              <span className="text-3xl font-black text-white font-mono">
                {currentSos.toLocaleString()} SLSH
              </span>
              <span className="text-sm font-bold text-emerald-400 font-mono">
                (${activeBalanceUsd.toFixed(2)} USD)
              </span>
            </div>

            {/* Threshold Warning Banner if low balance */}
            {isBelowMin && (
              <div className="mt-3 p-3 bg-rose-500/20 rounded-xl border border-rose-500/30 text-xs text-rose-300 font-medium space-y-1">
                <div className="font-extrabold flex items-center gap-1 text-rose-200">
                  <Lock className="w-4 h-4 text-rose-400" />
                  Account Online Lockout Notice
                </div>
                <p className="text-[11px] text-rose-300/90">
                  Your prepaid balance is below <b>1,000 SLSH ($0.10 USD)</b>. Top up via <b>0636807814</b> (ZAAD) or <b>0656807814</b> (eDahab) to go online!
                </p>
              </div>
            )}
          </div>

          {/* TAB 1: TOP-UP FORM & USSD GATEWAY */}
          {walletTab === 'topup' && (
            <div className="space-y-4">
              {/* Official Merchant Deposit Info & Interactive USSD Generator */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-emerald-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-black tracking-wider text-emerald-400 block">
                    Merchant Payment Gateway Accounts:
                  </span>
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                    Verified Gateway Account
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-900 p-3 rounded-xl border border-emerald-500/30 flex items-center justify-between">
                    <div>
                      <span className="text-emerald-400 font-extrabold block text-xs">📱 Telesom ZAAD</span>
                      <span className="text-white font-mono font-black text-sm">0636807814</span>
                    </div>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded font-bold font-mono">*880#</span>
                  </div>

                  <div className="bg-slate-900 p-3 rounded-xl border border-yellow-500/30 flex items-center justify-between">
                    <div>
                      <span className="text-yellow-400 font-extrabold block text-xs">📱 Somtel eDahab</span>
                      <span className="text-white font-mono font-black text-sm">0656807814</span>
                    </div>
                    <span className="text-[10px] bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded font-bold font-mono">*770#</span>
                  </div>
                </div>

                {/* Dynamic USSD String Box */}
                {provider !== 'card' && ussdCode && (
                  <div className="p-3 bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 rounded-xl border border-emerald-500/50 space-y-2">
                    <div className="text-[10px] uppercase font-extrabold text-slate-400 flex items-center justify-between">
                      <span>USSD Code ({selectedAmount.toLocaleString()} SLSH):</span>
                      {copiedUSSD && (
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <Check className="w-3 h-3" /> Copied!
                        </span>
                      )}
                    </div>

                    <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between font-mono">
                      <span className="text-xl font-black text-emerald-400 tracking-wider">
                        {ussdCode}
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyUSSD}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition text-xs font-bold flex items-center gap-1 cursor-pointer"
                        title="Copy USSD Code"
                      >
                        <Copy className="w-4 h-4" />
                        <span className="hidden sm:inline">Copy</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-0.5">
                      <a
                        href={`tel:${encodeURIComponent(ussdCode)}`}
                        className="py-2 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs transition flex items-center justify-center space-x-1 shadow"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>Dial USSD</span>
                      </a>

                      <button
                        type="button"
                        onClick={handleCopyUSSD}
                        className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center space-x-1 border border-slate-700 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copy Code</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Form */}
              <form onSubmit={handleTopUpSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2">
                    Select Prepaid Amount to Add:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { sos: 1000, usd: 0.10, trips: '1 Trip Fee' },
                      { sos: 5000, usd: 0.50, trips: '5 Trips' },
                      { sos: 10000, usd: 1.00, trips: '10 Trips' },
                      { sos: 50000, usd: 5.00, trips: '50 Trips' },
                    ].map((item) => (
                      <button
                        key={item.sos}
                        type="button"
                        onClick={() => setSelectedAmount(item.sos)}
                        className={`py-2.5 px-2 rounded-xl text-xs font-black transition border text-center cursor-pointer ${
                          selectedAmount === item.sos
                            ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md scale-[1.02]'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                        }`}
                      >
                        <div>{item.sos.toLocaleString()} SLSH</div>
                        <div className="text-[10px] opacity-80">${item.usd.toFixed(2)} ({item.trips})</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Provider Selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-2">
                    Payment Gateway Provider:
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => setProvider('zaad')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center transition cursor-pointer ${
                        provider === 'zaad'
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="font-extrabold text-white text-xs">ZAAD</span>
                      <span className="text-[10px] text-emerald-400 font-mono">0636807814</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setProvider('edahab')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center transition cursor-pointer ${
                        provider === 'edahab'
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="font-extrabold text-white text-xs">eDahab</span>
                      <span className="text-[10px] text-yellow-400 font-mono">0656807814</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setProvider('evc')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center transition cursor-pointer ${
                        provider === 'evc'
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="font-extrabold text-white text-xs">EVC Plus</span>
                      <span className="text-[9px] text-amber-400">*770#</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setProvider('card')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center transition cursor-pointer ${
                        provider === 'card'
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="font-extrabold text-white text-xs">Card</span>
                      <span className="text-[9px] text-blue-400">Mastercard/Visa</span>
                    </button>
                  </div>
                </div>

                {/* Reference / Phone Input */}
                {provider !== 'card' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Driver Mobile Number:
                      </label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="0634112233"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-emerald-500 font-mono"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center justify-between">
                        <span>Transaction Ref / SMS Code:</span>
                        <span className="text-[10px] text-emerald-400">Auto-Verified</span>
                      </label>
                      <input
                        type="text"
                        value={referenceId}
                        onChange={(e) => setReferenceId(e.target.value)}
                        placeholder="e.g. 9812401 or Ref ID"
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>
                  </div>
                )}

                {/* Error Message */}
                {errorMsg && (
                  <div className="p-3 bg-rose-500/20 border border-rose-500/40 text-rose-300 rounded-xl text-xs font-bold flex items-center justify-between">
                    <span>{errorMsg}</span>
                    <button type="button" onClick={() => setErrorMsg(null)} className="text-rose-400 hover:text-white">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Success Message & Immediate Go Online Button */}
                {successMsg && (
                  <div className="p-4 bg-emerald-950/70 border-2 border-emerald-500 text-white rounded-2xl text-xs space-y-3 shadow-xl">
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0 font-black">
                        <Check className="w-5 h-5 stroke-[3]" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-black text-sm text-emerald-300">Ku-Shubashadu Way Guuleysatay! (Top-Up Confirmed)</h4>
                        <p className="text-slate-200 text-xs">{successMsg}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        toggleDriverOnline(true);
                        onClose();
                      }}
                      className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
                    >
                      <Zap className="w-4 h-4 fill-current" />
                      <span>Geli Online Hadda • Go Online to Receive Orders</span>
                    </button>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs shadow-lg transition flex items-center justify-center space-x-2 disabled:opacity-50 uppercase tracking-wider cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Verifying Mobile Gateway & Activating...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Verify {selectedAmount.toLocaleString()} SLSH (${(selectedAmount/10000).toFixed(2)}) & Top Up</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: TRANSACTION & COMMISSION LEDGER LOGS */}
          {walletTab === 'history' && (
            <div className="space-y-3">
              <h4 className="font-extrabold text-xs text-slate-300 uppercase tracking-wider flex items-center justify-between">
                <span>Commission Wallet Statement</span>
                <span className="text-[10px] text-slate-500 font-mono">{driverWalletTransactions.length} Transactions</span>
              </h4>

              <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
                {driverWalletTransactions.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 text-xs bg-slate-950 rounded-2xl border border-slate-800">
                    No wallet transactions recorded yet.
                  </div>
                ) : (
                  driverWalletTransactions.map((tx) => {
                    const isPending = tx.status === 'pending_verification';
                    const isCompleted = tx.status === 'completed';
                    const isRejected = tx.status === 'rejected';

                    return (
                      <div
                        key={tx.id}
                        className={`p-3 rounded-xl border text-xs ${
                          isPending
                            ? 'bg-amber-950/30 border-amber-500/40'
                            : isRejected
                            ? 'bg-rose-950/30 border-rose-500/40'
                            : 'bg-slate-950 border-slate-800'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-0.5">
                            <div className="flex items-center space-x-2">
                              <span className="font-extrabold text-white block">{tx.title}</span>
                              <span
                                className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${
                                  isCompleted
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : isPending
                                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                }`}
                              >
                                {isCompleted ? 'VERIFIED' : isPending ? 'PENDING' : 'REJECTED'}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
                              <span>{tx.date}</span>
                              {tx.referenceId && (
                                <span className="bg-slate-800 text-emerald-400 px-1.5 py-0.5 rounded font-mono">
                                  Ref: {tx.referenceId}
                                </span>
                              )}
                              {tx.adminNote && (
                                <span className="text-amber-300 font-medium">({tx.adminNote})</span>
                              )}
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span
                              className={`font-black font-mono block ${
                                tx.amountUsd >= 0 ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              {tx.amountUsd >= 0 ? '+' : ''}
                              {tx.amountSos.toLocaleString()} SLSH
                            </span>
                            <span className="text-[10px] text-slate-400 block font-mono">
                              (${Math.abs(tx.amountUsd).toFixed(2)})
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 3: EARNINGS BREAKDOWN */}
          {walletTab === 'earnings' && (
            <div className="space-y-3">
              <div className="p-4 bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl border border-slate-700 text-white space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">
                    Today's Driver Revenue
                  </span>
                  <span className="text-xs font-extrabold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800">
                    +18% Today
                  </span>
                </div>

                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-black text-white font-mono">
                    ${(currentDriverRecord?.todayEarnings || 0).toFixed(2)}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    / {Math.round((currentDriverRecord?.todayEarnings || 0) * EXCHANGE_RATE_USD_TO_SLSH).toLocaleString()} SLSH
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-700">
                  <div className="p-2 bg-slate-950 rounded-xl">
                    <span className="text-[10px] text-slate-400 block uppercase">Completed Trips</span>
                    <span className="font-extrabold text-white text-sm">{currentDriverRecord?.totalTrips || 0} Rides</span>
                  </div>
                  <div className="p-2 bg-slate-950 rounded-xl">
                    <span className="text-[10px] text-slate-400 block uppercase">Commission Fee</span>
                    <span className="font-extrabold text-rose-400 text-sm">1,000 SLSH / Trip</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
