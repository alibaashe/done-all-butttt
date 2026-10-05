import React from 'react';
import { X, Receipt, MapPin, Navigation, DollarSign, Wallet, ShieldCheck, Car, Users } from 'lucide-react';
import { useRide } from '../../context/RideContext';
import { formatCurrency, EXCHANGE_RATE_USD_TO_SLSH } from '../../utils/geo';

interface RideOrderDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RideOrderDetailsModal: React.FC<RideOrderDetailsModalProps> = ({ isOpen, onClose }) => {
  const { currentRide, pricing } = useRide();

  if (!isOpen || !currentRide) return null;

  const isShare = currentRide.category === 'wadaage_share' || currentRide.isShared;
  const ratePerKm = isShare ? 0.40 : 0.80;
  const ratePerKmSos = Math.round(ratePerKm * EXCHANGE_RATE_USD_TO_SLSH);
  const totalSos = Math.round(currentRide.totalFare * EXCHANGE_RATE_USD_TO_SLSH);
  const platformFeeUsd = pricing.driverCommissionFeeUsd || 0.089;
  const platformFeeSos = Math.round(platformFeeUsd * EXCHANGE_RATE_USD_TO_SLSH);
  const netEarningsUsd = Math.max(0, currentRide.totalFare - platformFeeUsd);
  const netEarningsSos = Math.round(netEarningsUsd * EXCHANGE_RATE_USD_TO_SLSH);

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Trip Order & Fare Details</h3>
              <p className="text-xs text-slate-500">Rider & Driver Pricing Transparency</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category & Status Pill */}
        <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center space-x-2">
            {isShare ? (
              <span className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
                <Users className="w-4 h-4" />
              </span>
            ) : (
              <span className="p-1.5 bg-yellow-500/20 text-yellow-400 rounded-lg">
                <Car className="w-4 h-4" />
              </span>
            )}
            <div>
              <span className="font-extrabold text-xs text-slate-900 dark:text-white block">
                {currentRide.categoryName || (isShare ? 'Wadaage Share' : 'Wadaage Taxi')}
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                Rate: ${ratePerKm.toFixed(2)} USD / {ratePerKmSos.toLocaleString()} SLSH per km
              </span>
            </div>
          </div>

          <span className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
            {currentRide.status.replace('_', ' ')}
          </span>
        </div>

        {/* Route Details */}
        <div className="space-y-2 text-xs bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-start space-x-2">
            <MapPin className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Pickup Location</span>
              <span className="text-slate-800 dark:text-slate-200 font-semibold">{currentRide.pickup?.name || 'Pickup Location'}</span>
            </div>
          </div>

          <div className="border-l-2 border-dashed border-slate-300 dark:border-slate-700 ml-2 h-3" />

          <div className="flex items-start space-x-2">
            <Navigation className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Dropoff Destination</span>
              <span className="text-slate-800 dark:text-slate-200 font-semibold">{currentRide.dropoff?.name || 'Dropoff Destination'}</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-500">
            <span>Distance: <b className="text-slate-800 dark:text-slate-200">{currentRide.distanceKm} km</b></span>
            <span>Est. Duration: <b className="text-slate-800 dark:text-slate-200">{currentRide.durationMins} mins</b></span>
          </div>
        </div>

        {/* Detailed Price & Earnings Breakdown */}
        <div className="space-y-2 text-xs border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between text-slate-500 pb-1 border-b border-slate-100 dark:border-slate-800">
            <span>Per-KM Tariff Applied:</span>
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
              ${ratePerKm.toFixed(2)} USD ({ratePerKmSos.toLocaleString()} SLSH/km)
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-500">
            <span>Customer Total Fare:</span>
            <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
              ${currentRide.totalFare.toFixed(2)} USD ({totalSos.toLocaleString()} SLSH)
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-500">
            <span>Payment Method:</span>
            <span className="font-bold text-slate-800 dark:text-slate-200 uppercase bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[10px]">
              {currentRide.paymentMethod} (Zaad / eDahab / Cash)
            </span>
          </div>

          <div className="flex items-center justify-between text-rose-500 text-[11px] pt-1">
            <span>Platform Service Charge:</span>
            <span className="font-mono font-bold">
              -${platformFeeUsd.toFixed(2)} USD (-{platformFeeSos.toLocaleString()} SLSH)
            </span>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800 font-black text-sm text-slate-900 dark:text-white">
            <span className="text-emerald-600 dark:text-emerald-400">Driver Net Payout:</span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400">
              ${netEarningsUsd.toFixed(2)} USD ({netEarningsSos.toLocaleString()} SLSH)
            </span>
          </div>
        </div>

        {/* Security / Confirmation Footer */}
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center space-x-2 text-xs text-emerald-800 dark:text-emerald-300">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>Both rider and driver receive the exact identical fare calculation automatically.</span>
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider transition hover:opacity-90 shadow"
        >
          Close Details
        </button>
      </div>
    </div>
  );
};
