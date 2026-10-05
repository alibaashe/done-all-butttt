import React, { useState } from 'react';
import { X, Sliders, Check, AlertCircle, RefreshCw } from 'lucide-react';
import { useFuel } from '../../../context/FuelContext';

interface FuelCorrectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FuelCorrectionModal: React.FC<FuelCorrectionModalProps> = ({ isOpen, onClose }) => {
  const { vehicle, currentFuelLiters, correctFuelLevel } = useFuel();

  const [actualFuelLiters, setActualFuelLiters] = useState<number>(currentFuelLiters);
  const [reason, setReason] = useState<string>('Dashboard fuel gauge calibration');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const val = Number(actualFuelLiters);
    if (val < 0 || val > vehicle.tankCapacityLiters) {
      setErrorMessage(`Fuel level must be between 0 and ${vehicle.tankCapacityLiters} liters.`);
      return;
    }

    setIsSubmitting(true);
    try {
      await correctFuelLevel(val, reason.trim() || 'Manual adjustment');
      setSuccessMessage(`Fuel level successfully calibrated to ${val} L!`);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch {
      setErrorMessage('Failed to update fuel level. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white text-slate-900 border border-slate-200 rounded-3xl p-5 w-full max-w-md max-h-[92vh] overflow-y-auto shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base">Update Fuel Level (Sax Shidaalka)</h3>
              <p className="text-xs text-slate-500">Calibrate app estimate with your dashboard gauge</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Notices */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center space-x-2 text-xs text-rose-800 font-bold">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center space-x-2 text-xs text-emerald-800 font-bold">
            <Check className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Comparison card */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-center">
            <span className="text-[10px] text-slate-500 font-bold uppercase block">Current App Estimate</span>
            <span className="text-base font-black text-slate-700 font-mono mt-1 block">
              {currentFuelLiters} L
            </span>
            <span className="text-[10px] text-slate-400">Calculated from GPS</span>
          </div>

          <div className="bg-blue-50 p-3 rounded-2xl border border-blue-200 text-center">
            <span className="text-[10px] text-blue-700 font-bold uppercase block">Your Gauge Reading</span>
            <span className="text-base font-black text-blue-950 font-mono mt-1 block">
              {actualFuelLiters} L
            </span>
            <span className="text-[10px] text-blue-600 font-semibold">New Calibration</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
          {/* Slider and Number Input */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-slate-800 font-black block">
                Actual Remaining Fuel (Liters)
              </label>
              <span className="text-xs font-black text-blue-700 font-mono">
                {actualFuelLiters} / {vehicle.tankCapacityLiters} L
              </span>
            </div>

            <input
              type="range"
              min="0"
              max={vehicle.tankCapacityLiters}
              step="0.5"
              value={actualFuelLiters}
              onChange={(e) => setActualFuelLiters(Number(e.target.value))}
              className="w-full accent-blue-600 cursor-pointer"
            />

            <div className="relative">
              <input
                type="number"
                step="0.5"
                min="0"
                max={vehicle.tankCapacityLiters}
                value={actualFuelLiters}
                onChange={(e) => setActualFuelLiters(Number(e.target.value))}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-base font-black font-mono text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                required
              />
              <span className="absolute right-3 top-3.5 text-slate-400 font-bold text-xs">Liters</span>
            </div>
          </div>

          {/* Preset buttons */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Quarter', val: Math.round(vehicle.tankCapacityLiters * 0.25) },
              { label: 'Half', val: Math.round(vehicle.tankCapacityLiters * 0.5) },
              { label: '3/4 Tank', val: Math.round(vehicle.tankCapacityLiters * 0.75) },
              { label: 'Full Tank', val: vehicle.tankCapacityLiters },
            ].map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => setActualFuelLiters(p.val)}
                className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 rounded-xl text-[11px] font-bold border border-slate-200 text-center transition"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Reason */}
          <div className="space-y-1">
            <label className="text-slate-700 font-bold block">Reason for Calibration (Optional)</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Dashboard needle at 1/2 mark"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <p className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            ℹ️ Updating this value immediately recalibrates your remaining range and fuel warnings. Your past driving session history remains safely preserved.
          </p>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-black rounded-xl text-xs flex items-center justify-center space-x-2 shadow-md transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isSubmitting ? 'animate-spin' : ''}`} />
              <span>{isSubmitting ? 'Updating Calibration...' : 'UPDATE FUEL LEVEL (Xaqiiji Qiyaasta)'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
