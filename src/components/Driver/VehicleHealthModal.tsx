import { Activity, Car, Check, Gauge, Fuel, Wrench, X } from 'lucide-react';
import React, { useState } from 'react';

interface VehicleHealthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VehicleHealthModal: React.FC<VehicleHealthModalProps> = ({ isOpen, onClose }) => {
  const [fuelLevel, setFuelLevel] = useState(78); // percentage
  const [lastFuelExpense, setLastFuelExpense] = useState(15.00); // USD
  const [todaysKm, setTodaysKm] = useState(84); // Km driven today

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 text-white rounded-3xl max-w-md w-full border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-slate-800 border border-slate-700 text-emerald-400">
              <Car className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">Vehicle Diagnostics & Fuel Log</h3>
              <p className="text-xs text-slate-400">Toyota Probox (License: SL-4820-A)</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar">
          {/* Diagnostic Status Cards */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Distance Today</span>
              <span className="text-xl font-black text-white font-mono">{todaysKm} km</span>
              <span className="text-[10px] text-emerald-400 block mt-0.5">8 completed trips</span>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase block">Oil Health</span>
              <span className="text-xl font-black text-emerald-400 font-mono">82% Good</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Next change in 1,200 km</span>
            </div>
          </div>

          {/* Tire Pressure & Brake Pads */}
          <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-slate-300 flex items-center gap-1.5">
                <Gauge className="w-4 h-4 text-emerald-400" /> Tire Pressure Sensors (PSI)
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-bold px-2 py-0.5 rounded">
                Optimal
              </span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono font-bold">
              <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">FL: 32 PSI</div>
              <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">FR: 32 PSI</div>
              <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">RL: 33 PSI</div>
              <div className="bg-slate-900 p-2 rounded-xl border border-slate-800">RR: 33 PSI</div>
            </div>
          </div>

          {/* Fuel Tank Tracker */}
          <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-slate-300 flex items-center gap-1.5">
                <Fuel className="w-4 h-4 text-amber-400" /> Fuel Level Tracker
              </span>
              <span className="text-xs font-mono font-bold text-amber-400">{fuelLevel}% Full</span>
            </div>

            <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden border border-slate-800">
              <div
                className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full rounded-full transition-all"
                style={{ width: `${fuelLevel}%` }}
              ></div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-400 text-[11px]">Last Fuel Refill:</span>
              <span className="font-bold text-white font-mono">${lastFuelExpense.toFixed(2)} (150,000 SOS)</span>
            </div>
          </div>

          <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-slate-400 shrink-0" />
            <span>Regular vehicle inspections boost your passenger safety rating and earn top driver badges.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
