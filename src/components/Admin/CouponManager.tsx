import { Plus, Tag, Trash2, CheckCircle2 } from 'lucide-react';
import React, { useState } from 'react';
import { PROMO_CODES } from '../../data/mockData';
import { PromoCode } from '../../types';

export const CouponManager: React.FC = () => {
  const [promos, setPromos] = useState<PromoCode[]>(PROMO_CODES);
  const [code, setCode] = useState('');
  const [discountVal, setDiscountVal] = useState('');
  const [discountType, setDiscountType] = useState<'flat' | 'percent'>('flat');
  const [description, setDescription] = useState('');

  const handleAddCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !discountVal) return;

    const val = parseFloat(discountVal);
    const newPromo: PromoCode = {
      code: code.toUpperCase().trim(),
      description: description || `Special promo code ${code.toUpperCase()}`,
      flatDiscount: discountType === 'flat' ? val : undefined,
      discountPercent: discountType === 'percent' ? val : undefined,
    };

    setPromos([newPromo, ...promos]);
    setCode('');
    setDiscountVal('');
    setDescription('');
  };

  const handleDelete = (codeToDelete: string) => {
    setPromos(promos.filter((p) => p.code !== codeToDelete));
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xl space-y-4">
      <div className="flex items-center space-x-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
          <Tag className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
            Coupons & Promo Codes Campaign Manager
          </h3>
          <p className="text-xs text-slate-500">Create discount vouchers, flat rebates and marketing promo rules</p>
        </div>
      </div>

      {/* Add New Coupon Form */}
      <form onSubmit={handleAddCoupon} className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3 text-xs">
        <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">Create New Voucher</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-slate-500 font-semibold mb-1">Promo Code</label>
            <input
              type="text"
              placeholder="e.g. SUMMER50"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2 text-slate-900 dark:text-white font-mono font-bold uppercase outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1">Discount Value</label>
            <div className="flex space-x-1">
              <input
                type="number"
                placeholder="Value"
                value={discountVal}
                onChange={(e) => setDiscountVal(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2 text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as any)}
                className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2 font-bold text-slate-900 dark:text-white"
              >
                <option value="flat">$ Flat</option>
                <option value="percent">% Off</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-500 font-semibold mb-1">Description</label>
            <input
              type="text"
              placeholder="e.g. $5 Off next 3 rides"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <button
          type="submit"
          className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black px-4 py-2 rounded-xl text-xs flex items-center space-x-1.5 shadow-md transition-all uppercase"
        >
          <Plus className="w-4 h-4" />
          <span>Add Promo Voucher</span>
        </button>
      </form>

      {/* Promos Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase font-bold text-[10px]">
              <th className="py-2.5 px-3">Code</th>
              <th className="py-2.5 px-3">Discount</th>
              <th className="py-2.5 px-3">Description</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
            {promos.map((p) => (
              <tr key={p.code} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="py-3 px-3 font-mono font-black text-emerald-500">{p.code}</td>
                <td className="py-3 px-3 font-extrabold text-slate-900 dark:text-white">
                  {p.flatDiscount ? `$${p.flatDiscount.toFixed(2)} OFF` : `${p.discountPercent}% OFF`}
                </td>
                <td className="py-3 px-3 font-medium text-slate-500">{p.description}</td>
                <td className="py-3 px-3 text-right">
                  <button
                    onClick={() => handleDelete(p.code)}
                    className="text-rose-500 hover:text-rose-600 p-1 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
