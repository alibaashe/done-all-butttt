import { CreditCard, Key, Lock, CheckCircle2, Save, Smartphone, Wallet, DollarSign } from 'lucide-react';
import React, { useState } from 'react';

export const PaymentGatewaysConfig: React.FC = () => {
  const [zaadMerchant, setZaadMerchant] = useState('ZAAD_MERCHANT_88192');
  const [zaadApiKey, setZaadApiKey] = useState('zaad_live_sk_991823774812');
  const [edahabMerchant, setEdahabMerchant] = useState('EDAHAB_MCH_44019');
  const [edahabApiKey, setEdahabApiKey] = useState('edahab_live_sk_88291029381');
  const [premierAccount, setPremierAccount] = useState('PRM-901827364-SL');
  const [cashEnabled, setCashEnabled] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xl space-y-4">
      <div className="flex items-center space-x-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
          <CreditCard className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
            Local Somaliland Payment Gateways & Mobile Money Config
          </h3>
          <p className="text-xs text-slate-500">Manage Zaad Service, eDahab, Premier Wallet & Physical Cash settings</p>
        </div>
      </div>

      {savedSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-xl flex items-center space-x-2 text-emerald-500 text-xs font-bold">
          <CheckCircle2 className="w-4 h-4" />
          <span>Payment Gateway credentials & merchant keys successfully updated!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-4 text-xs">
        {/* Zaad Service */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Smartphone className="w-4 h-4 text-emerald-500" />
              <span className="font-bold text-slate-900 dark:text-white text-sm">Zaad Service (Telesom Mobile Money)</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-500">
                PRIMARY (ACTIVE)
              </span>
            </div>
            <Lock className="w-4 h-4 text-slate-400" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-500 font-semibold mb-1">Zaad Merchant Number / ID</label>
              <input
                type="text"
                value={zaadMerchant}
                onChange={(e) => setZaadMerchant(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-mono text-slate-900 dark:text-white outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-500 font-semibold mb-1">API Integration Secret Key</label>
              <input
                type="password"
                value={zaadApiKey}
                onChange={(e) => setZaadApiKey(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-mono text-slate-900 dark:text-white outline-none"
              />
            </div>
          </div>
        </div>

        {/* eDahab */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Smartphone className="w-4 h-4 text-amber-500" />
              <span className="font-bold text-slate-900 dark:text-white text-sm">eDahab (Somtel Mobile Money)</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-500">
                ACTIVE
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-500 font-semibold mb-1">eDahab Merchant Code</label>
              <input
                type="text"
                value={edahabMerchant}
                onChange={(e) => setEdahabMerchant(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-mono text-slate-900 dark:text-white outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-500 font-semibold mb-1">API Key</label>
              <input
                type="password"
                value={edahabApiKey}
                onChange={(e) => setEdahabApiKey(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-mono text-slate-900 dark:text-white outline-none"
              />
            </div>
          </div>
        </div>

        {/* Premier Wallet */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Wallet className="w-4 h-4 text-purple-500" />
              <span className="font-bold text-slate-900 dark:text-white text-sm">Premier Wallet (Premier Bank Somaliland)</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-500">
                ACTIVE
              </span>
            </div>
          </div>
          <div>
            <label className="block text-slate-500 font-semibold mb-1">Premier Bank Corporate Account</label>
            <input
              type="text"
              value={premierAccount}
              onChange={(e) => setPremierAccount(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 font-mono text-slate-900 dark:text-white outline-none"
            />
          </div>
        </div>

        {/* Cash Payments */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <DollarSign className="w-5 h-5 text-emerald-500" />
            <div>
              <p className="font-bold text-slate-900 dark:text-white text-xs">Direct Cash Payment to Driver (USD / SLSH)</p>
              <p className="text-[11px] text-slate-500">Allows passengers to pay physical currency upon ride completion</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setCashEnabled(!cashEnabled)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              cashEnabled ? 'bg-emerald-500 text-slate-950' : 'bg-slate-300 dark:bg-slate-700 text-slate-600'
            }`}
          >
            {cashEnabled ? 'ENABLED' : 'DISABLED'}
          </button>
        </div>

        <button
          type="submit"
          className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black px-5 py-3 rounded-xl text-xs flex items-center space-x-2 shadow-lg transition-all uppercase tracking-wider"
        >
          <Save className="w-4 h-4" />
          <span>Save Gateway Configurations</span>
        </button>
      </form>
    </div>
  );
};
