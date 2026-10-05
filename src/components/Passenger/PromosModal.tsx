import { Check, Copy, Gift, Sparkles, Tag, X } from 'lucide-react';
import React, { useState } from 'react';
import { useRide } from '../../context/RideContext';
import { PROMO_CODES } from '../../data/mockData';

interface PromosModalProps {
  onClose: () => void;
}

export const PromosModal: React.FC<PromosModalProps> = ({ onClose }) => {
  const { applyPromoCode, appliedPromo } = useRide();
  const [customInput, setCustomInput] = useState('');
  const [copiedReferral, setCopiedReferral] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const handleApply = (codeStr: string) => {
    const success = applyPromoCode(codeStr);
    if (success) {
      setMsg(`Code '${codeStr}' successfully applied!`);
      setTimeout(() => {
        onClose();
      }, 1200);
    } else {
      setMsg(`Failed to apply code '${codeStr}'. Check code rules.`);
    }
  };

  const handleCopyRef = () => {
    navigator.clipboard.writeText('ALEX50');
    setCopiedReferral(true);
    setTimeout(() => setCopiedReferral(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full text-white shadow-2xl relative space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold">
              <Gift className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base">Promotions & Discounts</h3>
              <p className="text-xs text-slate-400">Apply coupon codes & earn invite rewards</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-full bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Custom Code Input */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Enter Promo Code</label>
          <div className="flex space-x-2">
            <input
              type="text"
              placeholder="e.g. WADAAGE10"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value.toUpperCase())}
              className="bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2.5 text-xs text-white uppercase font-mono font-bold w-full outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button
              onClick={() => handleApply(customInput)}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2.5 rounded-2xl text-xs shrink-0 shadow-md transition-all"
            >
              Apply
            </button>
          </div>
          {msg && <p className="text-xs text-emerald-400 font-bold">{msg}</p>}
        </div>

        {/* Active Promos List */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Available Vouchers</h4>
          {PROMO_CODES.map((promo) => {
            const isCurrent = appliedPromo?.code === promo.code;
            return (
              <div
                key={promo.code}
                className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs transition-all ${
                  isCurrent
                    ? 'bg-amber-500/20 border-amber-500 text-white'
                    : 'bg-slate-800/80 border-slate-700/80 text-slate-300'
                }`}
              >
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <Tag className="w-3.5 h-3.5 text-amber-400" />
                    <span className="font-mono font-black text-amber-400 text-sm">{promo.code}</span>
                  </div>
                  <p className="text-slate-300 font-medium">{promo.description}</p>
                  {promo.minFare && <p className="text-[10px] text-slate-400">Min. ride fare: ${promo.minFare}</p>}
                </div>

                <button
                  onClick={() => handleApply(promo.code)}
                  disabled={isCurrent}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs shrink-0 transition-all ${
                    isCurrent
                      ? 'bg-amber-500 text-slate-950 cursor-default'
                      : 'bg-slate-700 hover:bg-slate-600 text-white'
                  }`}
                >
                  {isCurrent ? 'Applied' : 'Use Code'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Invite Friends Referral Card */}
        <div className="bg-gradient-to-r from-emerald-950/60 to-slate-900 border border-emerald-800/60 p-4 rounded-2xl flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-1 text-emerald-400 font-bold text-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Referral Rewards</span>
            </div>
            <p className="text-xs text-slate-300 mt-1">
              Share code <b className="font-mono text-emerald-400">ALEX50</b> with friends & get $10 credit when they complete their first ride.
            </p>
          </div>
          <button
            onClick={handleCopyRef}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold px-3 py-2 rounded-xl text-xs shrink-0 transition-all flex items-center space-x-1"
          >
            {copiedReferral ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copiedReferral ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
