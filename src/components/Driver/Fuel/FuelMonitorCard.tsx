import React from 'react';
import { Fuel, ChevronRight, AlertTriangle, Gauge, TrendingUp, DollarSign } from 'lucide-react';
import { useFuel } from '../../../context/FuelContext';

interface FuelMonitorCardProps {
  onOpenDashboard: () => void;
  variant?: 'compact' | 'expanded';
  onAddRefill?: () => void;
}

export const FuelMonitorCard: React.FC<FuelMonitorCardProps> = ({
  onOpenDashboard,
  variant = 'compact',
  onAddRefill,
}) => {
  const {
    currentFuelLiters,
    fuelPercentage,
    remainingRangeKm,
    todayDrivingKm,
    todayFuelUsedLiters,
    todayFuelCostSlsh,
    fuelWarning,
  } = useFuel();

  const isLowOrCritical = fuelWarning.level === 'critical' || fuelWarning.level === 'very_low' || fuelWarning.level === 'low';

  // Compact floating card matching the reference design in user image
  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={onOpenDashboard}
        className={`bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border px-3.5 py-2.5 flex items-center space-x-3 text-left transition-all active:scale-95 group select-none ${
          isLowOrCritical ? 'border-amber-400 ring-2 ring-amber-400/30' : 'border-slate-200 hover:border-emerald-300'
        }`}
      >
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 shadow-xs transition ${
            fuelWarning.level === 'critical'
              ? 'bg-rose-500 text-white animate-pulse'
              : fuelWarning.level === 'very_low' || fuelWarning.level === 'low'
              ? 'bg-amber-500 text-white'
              : 'bg-emerald-500 text-white group-hover:bg-emerald-600'
          }`}
        >
          <Fuel className="w-5 h-5" />
        </div>

        <div className="min-w-0 pr-1">
          <div className="flex items-center space-x-1.5">
            <span className="text-sm font-black text-slate-900 font-mono tracking-tight">
              {fuelPercentage}%
            </span>
            <span className="text-[10px] text-slate-500 font-bold">
              ({currentFuelLiters}L)
            </span>
          </div>
          <div className="flex items-center space-x-1 text-[11px] font-bold text-slate-600 group-hover:text-emerald-700">
            <span>Fuel Level</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </button>
    );
  }

  // Expanded card displaying full metrics
  return (
    <div
      className={`bg-white rounded-3xl shadow-xl border p-4 space-y-3 transition-all ${
        isLowOrCritical ? 'border-amber-400 ring-2 ring-amber-400/20' : 'border-slate-200'
      }`}
    >
      {/* Warning banner */}
      {isLowOrCritical && (
        <div
          className={`p-2.5 rounded-2xl flex items-center space-x-2 text-xs font-bold ${
            fuelWarning.level === 'critical'
              ? 'bg-rose-100 text-rose-800 border border-rose-200'
              : 'bg-amber-100 text-amber-900 border border-amber-200'
          }`}
        >
          <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
          <span className="truncate">{fuelWarning.message}</span>
        </div>
      )}

      {/* Main Stats Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-white shadow-sm ${
              fuelWarning.level === 'critical'
                ? 'bg-rose-500'
                : fuelWarning.level === 'very_low' || fuelWarning.level === 'low'
                ? 'bg-amber-500'
                : 'bg-emerald-600'
            }`}
          >
            <Fuel className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h3 className="font-black text-slate-900 text-base font-mono">
                {fuelPercentage}%
              </h3>
              <span className="text-xs text-slate-500 font-semibold">
                • {currentFuelLiters} L remaining
              </span>
            </div>
            <p className="text-xs font-bold text-emerald-700">
              Est. Range: ~{remainingRangeKm} km
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenDashboard}
          className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center space-x-1 transition"
        >
          <span>Details</span>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* Fuel Progress Bar */}
      <div className="space-y-1">
        <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
          <div
            className={`h-full transition-all duration-500 ${
              fuelWarning.level === 'critical'
                ? 'bg-rose-500'
                : fuelWarning.level === 'very_low' || fuelWarning.level === 'low'
                ? 'bg-amber-500'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${fuelPercentage}%` }}
          />
        </div>
      </div>

      {/* 3 Quick Driver Metrics */}
      <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-100">
        <div className="bg-slate-50 rounded-2xl p-2 text-center border border-slate-100">
          <div className="flex items-center justify-center space-x-1 text-[10px] text-slate-500 font-bold uppercase">
            <Gauge className="w-3 h-3 text-blue-500" />
            <span>Today</span>
          </div>
          <p className="text-xs font-black text-slate-900 font-mono mt-0.5">
            {todayDrivingKm} km
          </p>
        </div>

        <div className="bg-slate-50 rounded-2xl p-2 text-center border border-slate-100">
          <div className="flex items-center justify-center space-x-1 text-[10px] text-slate-500 font-bold uppercase">
            <TrendingUp className="w-3 h-3 text-amber-500" />
            <span>Used</span>
          </div>
          <p className="text-xs font-black text-slate-900 font-mono mt-0.5">
            {todayFuelUsedLiters} L
          </p>
        </div>

        <div className="bg-slate-50 rounded-2xl p-2 text-center border border-slate-100">
          <div className="flex items-center justify-center space-x-1 text-[10px] text-slate-500 font-bold uppercase">
            <DollarSign className="w-3 h-3 text-emerald-600" />
            <span>Cost</span>
          </div>
          <p className="text-xs font-black text-emerald-800 font-mono mt-0.5 truncate">
            {todayFuelCostSlsh.toLocaleString()} <span className="text-[9px]">SLSH</span>
          </p>
        </div>
      </div>

      {onAddRefill && (
        <button
          type="button"
          onClick={onAddRefill}
          className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition active:scale-95"
        >
          <Fuel className="w-3.5 h-3.5 text-emerald-600" />
          <span>+ Add Fuel Refill (Shidaal Ku Shub)</span>
        </button>
      )}
    </div>
  );
};
