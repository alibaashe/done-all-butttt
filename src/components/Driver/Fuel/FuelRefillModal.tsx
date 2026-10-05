import React, { useState } from 'react';
import { X, Fuel, Plus, Check, AlertCircle, MapPin } from 'lucide-react';
import { useFuel } from '../../../context/FuelContext';
import { HARGEISA_FUEL_STATIONS } from '../../../services/fuelService';

interface FuelRefillModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FuelRefillModal: React.FC<FuelRefillModalProps> = ({ isOpen, onClose }) => {
  const { vehicle, addRefill, currentFuelLiters } = useFuel();

  const [litersAdded, setLitersAdded] = useState<number>(15);
  const [pricePerLiterSlsh, setPricePerLiterSlsh] = useState<number>(vehicle.fuelPricePerLiterSlsh || 10000);
  const [fuelStation, setFuelStation] = useState<string>(HARGEISA_FUEL_STATIONS[0]);
  const [odometerKm, setOdometerKm] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const totalCostSlsh = Math.round((Number(litersAdded) || 0) * (Number(pricePerLiterSlsh) || 0));
  const newEstimatedFuel = Math.min(vehicle.tankCapacityLiters, Number((currentFuelLiters + (Number(litersAdded) || 0)).toFixed(1)));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const liters = Number(litersAdded);
    if (!liters || liters <= 0) {
      setErrorMessage('Please enter a valid amount of fuel in liters.');
      return;
    }

    if (liters > 150) {
      setErrorMessage('Fuel refill amount seems unusually high. Max 150 liters.');
      return;
    }

    setIsSubmitting(true);
    try {
      await addRefill({
        litersAdded: liters,
        pricePerLiterSlsh: Number(pricePerLiterSlsh) || 10000,
        fuelStation: fuelStation.trim() || 'Hargeisa Station',
        odometerKm: odometerKm ? Number(odometerKm) : undefined,
        notes: notes.trim() || undefined,
      });

      setSuccessMessage(`Successfully logged ${liters} L refill! Total: ${totalCostSlsh.toLocaleString()} SLSH`);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setErrorMessage('Failed to log fuel refill. Please try again.');
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
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Fuel className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base">Add Fuel Refill (Shidaal Ku Shub)</h3>
              <p className="text-xs text-slate-500">Record fuel purchase in Somaliland Shillings (SLSH)</p>
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

        {/* Current Vehicle Context */}
        <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200 flex items-center justify-between text-xs">
          <div>
            <span className="font-black text-slate-900 block">{vehicle.make} {vehicle.model}</span>
            <span className="text-[11px] text-slate-500">Tank: {vehicle.tankCapacityLiters}L • Rate: {vehicle.averageKmPerLiter} km/L</span>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-slate-500 block">Current Tank</span>
            <span className="font-black text-emerald-700 font-mono">{currentFuelLiters} L</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs font-semibold">
          {/* Liters Added */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-slate-800 font-black block">Liters Added (Tirada Litirada)</label>
              <div className="flex space-x-1">
                {[5, 10, 15, 20].map((quick) => (
                  <button
                    key={quick}
                    type="button"
                    onClick={() => setLitersAdded(quick)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                      litersAdded === quick
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    +{quick}L
                  </button>
                ))}
              </div>
            </div>
            <div className="relative">
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="150"
                value={litersAdded}
                onChange={(e) => setLitersAdded(Number(e.target.value))}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-base font-black font-mono text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                required
              />
              <span className="absolute right-3 top-3.5 text-slate-500 font-bold text-xs">Liters</span>
            </div>
            <p className="text-[10px] text-slate-400">
              New fuel level will be approximately: <strong className="text-slate-700">{newEstimatedFuel} Liters</strong>
            </p>
          </div>

          {/* Price Per Liter */}
          <div className="space-y-1">
            <label className="text-slate-800 font-black block">Price Per Liter (SLSH)</label>
            <div className="relative">
              <input
                type="number"
                step="500"
                min="1000"
                value={pricePerLiterSlsh}
                onChange={(e) => setPricePerLiterSlsh(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black font-mono text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                required
              />
              <span className="absolute right-3 top-2.5 text-slate-400 font-bold text-xs">SLSH / L</span>
            </div>
          </div>

          {/* Automatic Total Cost Display */}
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
            <span className="font-bold text-emerald-900">Total Fuel Cost (Isku-gaynta):</span>
            <span className="text-base font-black text-emerald-800 font-mono">
              {totalCostSlsh.toLocaleString()} <span className="text-xs">SLSH</span>
            </span>
          </div>

          {/* Fuel Station Selector / Input */}
          <div className="space-y-1">
            <label className="text-slate-800 font-black block flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>Fuel Station (Kaalinta Shidaalka) - Optional</span>
            </label>
            <select
              value={fuelStation}
              onChange={(e) => setFuelStation(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            >
              {HARGEISA_FUEL_STATIONS.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
              <option value="Other Station">Other Fuel Station in Hargeisa</option>
            </select>
          </div>

          {/* Odometer (Optional) */}
          <div className="space-y-1">
            <label className="text-slate-700 font-bold block">Current Odometer Reading (KM) - Optional</label>
            <input
              type="number"
              placeholder="e.g. 142850"
              value={odometerKm}
              onChange={(e) => setOdometerKm(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          {/* Notes (Optional) */}
          <div className="space-y-1">
            <label className="text-slate-700 font-bold block">Notes / Faallo - Optional</label>
            <input
              type="text"
              placeholder="e.g. Full tank for weekend shift"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-600 focus:outline-none"
            />
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black rounded-xl text-xs flex items-center justify-center space-x-2 shadow-md transition disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving Refuel...' : 'SAVE REFUEL (Xaqiiji Shidaalka)'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
