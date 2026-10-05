import React, { useState } from 'react';
import {
  AlertTriangle, CheckCircle2, DollarSign, Info, Phone,
  ShieldCheck, Smartphone, User, Users, Wallet, X, Car, Award, Zap, RefreshCw, CreditCard, Copy, FileText, Check
} from 'lucide-react';
import { useRide } from '../../context/RideContext';
import { formatCurrency } from '../../utils/geo';

interface AppInfoWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AppInfoWalletModal: React.FC<AppInfoWalletModalProps> = ({ isOpen, onClose }) => {
  const {
    driverWalletBalanceUsd,
    topUpDriverWallet,
    driverModeOnline,
    toggleDriverOnline,
    drivers,
    pricing,
    role,
    language,
    t,
    currentUser,
  } = useRide();

  const [topUpAmount, setTopUpAmount] = useState<number>(1000);
  const [provider, setProvider] = useState<'zaad' | 'edahab' | 'premier'>('zaad');
  const [phoneNumber, setPhoneNumber] = useState<string>('0634112233');
  const [referenceId, setReferenceId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedUSSD, setCopiedUSSD] = useState(false);

  if (!isOpen) return null;

  const currentDriver = drivers.find((d) => d.phone === currentUser?.phone || d.id === currentUser?.id) || drivers[0] || {
    id: currentUser?.id || 'drv_live',
    name: currentUser?.name || 'Driver Partner',
    phone: currentUser?.phone || '+252 63 6807814',
    avatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    rating: 5.0,
    totalTrips: 0,
    vehicle: { model: 'Toyota Vitz', licensePlate: 'SL-39201', color: 'White' },
  };
  const minThresholdUsd = pricing.driverMinWalletThresholdUsd || 0.10;
  const minThresholdSos = Math.round(minThresholdUsd * 10000); // 1,000 SOS
  const currentDriverBalanceSos = Math.round(driverWalletBalanceUsd * 10000);
  const isBelowMin = currentDriverBalanceSos < minThresholdSos;

  const ussdCode = provider === 'zaad'
    ? `*880*0636807814*${topUpAmount}#`
    : provider === 'edahab'
    ? `*770*0656807814*${topUpAmount}#`
    : '';

  const handleCopyUSSD = () => {
    if (!ussdCode) return;
    navigator.clipboard.writeText(ussdCode);
    setCopiedUSSD(true);
    setTimeout(() => setCopiedUSSD(false), 2500);
  };

  const handleTopUp = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    setTimeout(() => {
      const result = topUpDriverWallet(
        topUpAmount,
        provider === 'premier' ? 'card' : provider,
        phoneNumber,
        referenceId
      );
      setIsProcessing(false);
      if (result.success) {
        setSuccessMessage(result.message);
        setReferenceId('');
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        setErrorMessage(result.message);
      }
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 text-white rounded-3xl max-w-md w-full border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold">
              <Wallet className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white flex items-center gap-1.5 font-serif">
                Wadaage App & Driver Wallet Info
              </h3>
              <p className="text-[11px] text-slate-400">
                {language === 'so' ? 'Hogaanka Akoonka & Zaad-ka Darawalka' : 'Fleet Activation Wallet & System Status'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 space-y-4 overflow-y-auto custom-scrollbar text-xs">

          {/* Driver Profile & Online Activation Banner */}
          <div className="p-3.5 bg-slate-800/80 border border-slate-700/80 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <img
                  src={currentDriver.avatar}
                  alt={currentDriver.name}
                  className="w-10 h-10 rounded-full object-cover border-2 border-emerald-500"
                />
                <div>
                  <h4 className="font-extrabold text-sm text-white">{currentDriver.name}</h4>
                  <p className="text-[10px] text-slate-400">
                    {currentDriver.vehicle.model} • <span className="font-mono text-emerald-400">{currentDriver.vehicle.licensePlate}</span>
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-black text-amber-400 flex items-center justify-end gap-1">
                  ★ {currentDriver.rating}
                </span>
                <span className="text-[9px] text-slate-400 uppercase font-bold">Verified Driver</span>
              </div>
            </div>

            {/* Online Status Toggle inside 3-dots */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-700/60">
              <span className="text-slate-300 font-bold">
                {language === 'so' ? 'Xaalada Darawalka:' : 'Driver Trip Status:'}
              </span>
              <button
                onClick={() => toggleDriverOnline(!driverModeOnline)}
                disabled={isBelowMin}
                className={`px-3 py-1.5 rounded-xl font-black text-[11px] transition flex items-center space-x-1.5 ${
                  driverModeOnline
                    ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/30'
                    : isBelowMin
                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    : 'bg-rose-500 text-white'
                }`}
              >
                <span>{driverModeOnline ? '● ONLINE (ACTIVATED)' : '○ OFFLINE'}</span>
              </button>
            </div>
          </div>

          {/* TRIP ACTIVATION DRIVER WALLET CARD */}
          <div className={`p-4 rounded-2xl border ${
            isBelowMin
              ? 'bg-rose-950/40 border-rose-500/50 text-rose-200'
              : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-100'
          }`}>
            <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <span>Driver Activation Wallet</span>
              {isBelowMin ? (
                <span className="bg-rose-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> LOW BALANCE
                </span>
              ) : (
                <span className="bg-emerald-500 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> ACTIVE FOR TRIPS
                </span>
              )}
            </div>

            <div className="flex items-baseline justify-between mt-2">
              <div>
                <span className="text-2xl font-black text-white font-mono">
                  {currentDriverBalanceSos.toLocaleString()} SLSH
                </span>
                <span className="text-xs font-bold text-emerald-400 ml-1.5">
                  (${driverWalletBalanceUsd.toFixed(2)} USD)
                </span>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Min. active balance needed: <span className="text-amber-300 font-bold">1,000 SLSH ($0.10)</span>
                </p>
              </div>
              <span className="text-[10px] bg-slate-800 border border-slate-700 px-2 py-1 rounded-lg text-emerald-400 font-mono font-bold">
                1,000 SLSH ($0.10) / Trip Charge
              </span>
            </div>

            {/* Driver Welcome Promo Banner */}
            <div className="mt-2.5 p-2.5 bg-gradient-to-r from-emerald-900/50 via-teal-900/40 to-slate-900 border border-emerald-500/40 rounded-xl flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 text-slate-950 font-black flex items-center justify-center shrink-0 text-base">
                🎁
              </div>
              <div className="text-[11px] leading-tight">
                <span className="font-extrabold text-emerald-300 block">
                  Driver Welcome Gift Active!
                </span>
                <span className="text-slate-300">
                  <b>+5,000 SLSH</b> Welcome Top-Up credited • <b>0 SLSH Fee</b> on your first 5 completed trips!
                </span>
              </div>
            </div>

            {isBelowMin && (
              <p className="text-[10px] text-rose-300 mt-2 font-semibold">
                ⚠️ Wallet balance is below 1,000 SLSH ($0.10). Send money to ZAAD <b>0636807814</b> or eDahab <b>0656807814</b> to activate your online trip status.
              </p>
            )}
          </div>

          {/* FAST WALLET TOP-UP FORM (ZAAD / eDahab) */}
          <div className="p-3.5 bg-slate-800/60 border border-slate-700 rounded-2xl space-y-3">
            <h4 className="font-extrabold text-xs text-white flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                {language === 'so' ? 'Ku Shub Boorsada Zaad / eDahab' : 'Deposit Driver Prepaid Balance'}
              </span>
            </h4>

            {/* Merchant Account Numbers Banner */}
            <div className="p-2.5 bg-slate-900 rounded-xl border border-emerald-500/30 text-[11px] space-y-1">
              <div className="flex items-center justify-between font-mono font-black">
                <span className="text-emerald-400">ZAAD: 0636807814</span>
                <span className="text-yellow-400">eDahab: 0656807814</span>
              </div>
            </div>

            {/* Dynamic USSD Code Banner */}
            {ussdCode && (
              <div className="p-3 bg-slate-900 border border-emerald-500/40 rounded-xl space-y-2 font-mono">
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-sans font-bold">
                  <span>USSD String for {topUpAmount.toLocaleString()} SLSH:</span>
                  {copiedUSSD && <span className="text-emerald-400 font-bold">Copied!</span>}
                </div>
                <div className="text-lg font-black text-emerald-400 tracking-wider flex items-center justify-between">
                  <span>{ussdCode}</span>
                  <button
                    type="button"
                    onClick={handleCopyUSSD}
                    className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-sans font-bold flex items-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-1.5 font-sans pt-1">
                  <a
                    href={`tel:${encodeURIComponent(ussdCode)}`}
                    className="py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-lg text-xs flex items-center justify-center gap-1 shadow-md uppercase"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Dial {ussdCode}</span>
                  </a>
                  <button
                    type="button"
                    onClick={handleCopyUSSD}
                    className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-lg text-xs flex items-center justify-center gap-1 border border-slate-700"
                  >
                    <Copy className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copy Code</span>
                  </button>
                </div>
              </div>
            )}

            {errorMessage && (
              <div className="p-2 bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[11px] rounded-xl font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {successMessage && (
              <div className="p-2 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[11px] rounded-xl font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleTopUp} className="space-y-2.5">
              {/* Payment provider selector */}
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setProvider('zaad')}
                  className={`p-2 rounded-xl border text-[11px] font-extrabold flex flex-col items-center gap-0.5 transition ${
                    provider === 'zaad'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <span>ZAAD</span>
                  <span className="text-[10px] font-mono text-emerald-400">0636807814</span>
                </button>
                <button
                  type="button"
                  onClick={() => setProvider('edahab')}
                  className={`p-2 rounded-xl border text-[11px] font-extrabold flex flex-col items-center gap-0.5 transition ${
                    provider === 'edahab'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                      : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <span>eDahab</span>
                  <span className="text-[10px] font-mono text-yellow-400">0656807814</span>
                </button>
              </div>

              {/* Amount buttons */}
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { sos: 1000, label: '1,000 SLSH' },
                  { sos: 5000, label: '5,000 SLSH' },
                  { sos: 10000, label: '10k SLSH' },
                  { sos: 50000, label: '50k SLSH' },
                ].map((item) => (
                  <button
                    key={item.sos}
                    type="button"
                    onClick={() => setTopUpAmount(item.sos)}
                    className={`py-1.5 rounded-xl font-mono text-[11px] font-bold border transition ${
                      topUpAmount === item.sos
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-black'
                        : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Phone number & Reference ID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">
                    Mobile Number:
                  </label>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="063 XXXXXXX"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 font-bold block mb-1">
                    Transaction Ref ID / SMS Code:
                  </label>
                  <input
                    type="text"
                    value={referenceId}
                    onChange={(e) => setReferenceId(e.target.value)}
                    placeholder="Ref ID (e.g. 9812401)"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition uppercase tracking-wider"
              >
                {isProcessing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verify {topUpAmount.toLocaleString()} SLSH & Activate</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* TRIP ORDERS & SERVICE TYPES GUIDE */}
          <div className="p-3 bg-slate-800/40 border border-slate-700/60 rounded-2xl space-y-2">
            <h4 className="font-extrabold text-xs text-white flex items-center gap-1.5">
              <Info className="w-4 h-4 text-emerald-400" />
              {language === 'so' ? 'Qeexida Dalbadyada Wadaage' : 'Wadaage Trip Order Categories'}
            </h4>

            <div className="space-y-1.5 text-[11px]">
              <div className="p-2 bg-slate-900 rounded-xl flex items-center justify-between border border-indigo-500/30">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-indigo-400" />
                  <div>
                    <span className="font-bold text-white block">Wadaage Share (Gaadhi Wadaag Engine)</span>
                    <span className="text-[10px] text-slate-400">Vector matching (&lt;30°) • 1.0km dest radius • 0.5km share lock</span>
                  </div>
                </div>
                <span className="bg-indigo-600 text-white font-black text-[9px] px-2 py-0.5 rounded">
                  Carpool
                </span>
              </div>

              <div className="p-2 bg-slate-900 rounded-xl flex items-center justify-between border border-emerald-500/30">
                <div className="flex items-center space-x-2">
                  <Car className="w-4 h-4 text-emerald-400" />
                  <div>
                    <span className="font-bold text-white block">Wadaage Normal Taxi</span>
                    <span className="text-[10px] text-slate-400">Standard private city ride</span>
                  </div>
                </div>
                <span className="bg-emerald-500 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded">
                  Taxi
                </span>
              </div>

              <div className="p-2 bg-slate-900 rounded-xl flex items-center justify-between border border-amber-500/30">
                <div className="flex items-center space-x-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  <div>
                    <span className="font-bold text-white block">Wadaage VIP</span>
                    <span className="text-[10px] text-slate-400">Executive sedan & luxury SUV</span>
                  </div>
                </div>
                <span className="bg-amber-500 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded">
                  VIP
                </span>
              </div>

              <div className="p-2 bg-slate-900 rounded-xl flex items-center justify-between border border-purple-500/30">
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-purple-400" />
                  <div>
                    <span className="font-bold text-white block">Wadaage Moto / Bajaj</span>
                    <span className="text-[10px] text-slate-400">Fast 2/3 wheeler bajaj ride</span>
                  </div>
                </div>
                <span className="bg-purple-600 text-white font-black text-[9px] px-2 py-0.5 rounded">
                  Moto
                </span>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-center text-[10px] text-slate-400 space-y-1">
            <p className="flex items-center justify-center gap-1 font-bold text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" /> Wadaage Somaliland Transport Platform
            </p>
            <p>Support Hotline: *999# or +252 63 4443322</p>
          </div>
        </div>
      </div>
    </div>
  );
};
