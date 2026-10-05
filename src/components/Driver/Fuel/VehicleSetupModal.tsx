import React, { useState } from 'react';
import { X, Car, Fuel, Check, AlertCircle, Save } from 'lucide-react';
import { useFuel } from '../../../context/FuelContext';
import { VehicleFuelProfile, FuelType } from '../../../types';

interface VehicleSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const COMMON_MAKES = ['Toyota', 'Nissan', 'Honda', 'Hyundai', 'Suzuki', 'Mazda', 'Mitsubishi', 'Kia'];
const COMMON_MODELS: Record<string, string[]> = {
  Toyota: ['Vitz', 'Probox', 'Corolla', 'Belta', 'Passo', 'Noah', 'Premio', 'Ractis', 'Fielder', 'Hilux'],
  Nissan: ['Note', 'Tiida', 'Sunny', 'AD Van', 'March', 'X-Trail'],
  Honda: ['Fit', 'Insight', 'Civic', 'CR-V'],
  Hyundai: ['Elantra', 'Accent', 'Tucson'],
  Suzuki: ['Swift', 'Alto', 'Every'],
};

export const VehicleSetupModal: React.FC<VehicleSetupModalProps> = ({ isOpen, onClose }) => {
  const { vehicle, updateVehicleProfile } = useFuel();

  const [make, setMake] = useState<string>(vehicle.make || 'Toyota');
  const [model, setModel] = useState<string>(vehicle.model || 'Vitz');
  const [year, setYear] = useState<number>(vehicle.year || 2018);
  const [licensePlate, setLicensePlate] = useState<string>(vehicle.licensePlate || 'SL-4921');
  const [fuelType, setFuelType] = useState<FuelType>(vehicle.fuelType || 'petrol');
  const [tankCapacityLiters, setTankCapacityLiters] = useState<number>(vehicle.tankCapacityLiters || 45);
  const [averageKmPerLiter, setAverageKmPerLiter] = useState<number>(vehicle.averageKmPerLiter || 8.5);
  const [currentFuelLiters, setCurrentFuelLiters] = useState<number>(vehicle.currentFuelLiters || 32);
  const [fuelPricePerLiterSlsh, setFuelPricePerLiterSlsh] = useState<number>(vehicle.fuelPricePerLiterSlsh || 10000);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Strict validation
    if (tankCapacityLiters < 1 || tankCapacityLiters > 200) {
      setErrorMessage('Tank capacity must be between 1 and 200 liters.');
      return;
    }
    if (averageKmPerLiter < 1 || averageKmPerLiter > 30) {
      setErrorMessage('Fuel efficiency must be realistic between 1 and 30 km per liter.');
      return;
    }
    if (currentFuelLiters < 0 || currentFuelLiters > tankCapacityLiters) {
      setErrorMessage(`Current fuel cannot exceed tank capacity (${tankCapacityLiters} L).`);
      return;
    }
    if (fuelPricePerLiterSlsh <= 0) {
      setErrorMessage('Fuel price per liter must be greater than 0 SLSH.');
      return;
    }

    setIsSubmitting(true);
    try {
      const updated: VehicleFuelProfile = {
        ...vehicle,
        make: make.trim() || 'Toyota',
        model: model.trim() || 'Vitz',
        year: Number(year) || 2018,
        licensePlate: licensePlate.trim() || 'SL-0000',
        fuelType,
        tankCapacityLiters: Number(tankCapacityLiters),
        averageKmPerLiter: Number(averageKmPerLiter),
        currentFuelLiters: Number(currentFuelLiters),
        fuelPricePerLiterSlsh: Number(fuelPricePerLiterSlsh),
        updatedAt: new Date().toISOString(),
      };

      await updateVehicleProfile(updated);
      setSuccessMessage('Vehicle and fuel configuration updated successfully!');
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setErrorMessage('Failed to save vehicle profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 sm:p-4 animate-in fade-in">
      <div className="bg-white text-slate-900 border border-slate-200 rounded-3xl p-5 w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#008751]/10 text-[#008751] flex items-center justify-center font-bold">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base">Vehicle & Fuel Settings</h3>
              <p className="text-xs text-slate-500">Configure vehicle specs for accurate Hargeisa fuel tracking</p>
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

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
          {/* Vehicle Make & Model */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-700 font-bold block">Vehicle Make (Shirkadda)</label>
              <select
                value={make}
                onChange={(e) => {
                  setMake(e.target.value);
                  if (COMMON_MODELS[e.target.value]) {
                    setModel(COMMON_MODELS[e.target.value][0]);
                  }
                }}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#008751] focus:outline-none"
              >
                {COMMON_MAKES.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-slate-700 font-bold block">Vehicle Model (Nooca)</label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. Vitz, Probox"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#008751] focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Year & License Plate */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-slate-700 font-bold block">Year of Manufacture</label>
              <input
                type="number"
                min="1995"
                max="2030"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#008751] focus:outline-none"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-slate-700 font-bold block">License Plate (Taargo)</label>
              <input
                type="text"
                value={licensePlate}
                onChange={(e) => setLicensePlate(e.target.value)}
                placeholder="e.g. SL-4921"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 uppercase focus:ring-2 focus:ring-[#008751] focus:outline-none"
                required
              />
            </div>
          </div>

          {/* Fuel Type */}
          <div className="space-y-1.5">
            <label className="text-slate-700 font-bold block">Fuel Type (Nooca Shidaalka)</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFuelType('petrol')}
                className={`py-2.5 px-3 rounded-xl border font-bold flex items-center justify-center space-x-2 transition ${
                  fuelType === 'petrol'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-1 ring-emerald-500'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <Fuel className="w-4 h-4 text-emerald-600" />
                <span>Petrol (Bansiin)</span>
              </button>

              <button
                type="button"
                onClick={() => setFuelType('diesel')}
                className={`py-2.5 px-3 rounded-xl border font-bold flex items-center justify-center space-x-2 transition ${
                  fuelType === 'diesel'
                    ? 'bg-blue-50 border-blue-500 text-blue-900 ring-1 ring-blue-500'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                <Fuel className="w-4 h-4 text-blue-600" />
                <span>Diesel (Naafto)</span>
              </button>
            </div>
          </div>

          {/* Tank Capacity & Consumption */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-slate-700 font-bold block">Tank Capacity</label>
                <span className="text-[11px] text-slate-500 font-mono">{tankCapacityLiters} Liters</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min="10"
                  max="200"
                  value={tankCapacityLiters}
                  onChange={(e) => setTankCapacityLiters(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#008751] focus:outline-none"
                  required
                />
                <span className="absolute right-3 top-2.5 text-slate-400 font-bold text-xs">Liters</span>
              </div>
              <p className="text-[10px] text-slate-400">Typical: Vitz ~42L, Probox ~50L</p>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-slate-700 font-bold block">Avg Efficiency</label>
                <span className="text-[11px] text-slate-500 font-mono">{averageKmPerLiter} KM/L</span>
              </div>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="2"
                  max="30"
                  value={averageKmPerLiter}
                  onChange={(e) => setAverageKmPerLiter(Number(e.target.value))}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-[#008751] focus:outline-none"
                  required
                />
                <span className="absolute right-3 top-2.5 text-slate-400 font-bold text-xs">KM / L</span>
              </div>
              <p className="text-[10px] text-slate-400">Hargeisa city avg: 7.5 - 10 km/L</p>
            </div>
          </div>

          {/* Current Fuel Level Slider / Input */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-slate-800 font-black block">Current Fuel Level (Shidaalka Hadda Ku Jira)</label>
              <span className="text-xs font-black text-emerald-700 font-mono">
                {currentFuelLiters} L ({Math.round((currentFuelLiters / tankCapacityLiters) * 100)}%)
              </span>
            </div>
            <input
              type="range"
              min="0"
              max={tankCapacityLiters}
              step="0.5"
              value={currentFuelLiters}
              onChange={(e) => setCurrentFuelLiters(Number(e.target.value))}
              className="w-full accent-[#008751] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-bold">
              <span>0 L (Empty)</span>
              <span>{Math.round(tankCapacityLiters / 2)} L (Half)</span>
              <span>{tankCapacityLiters} L (Full)</span>
            </div>
          </div>

          {/* Fuel Price in Somaliland Shillings (SLSH) */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-slate-700 font-bold block">
                Fuel Price Per Liter (Qiimaha Halkii Litir ee SLSH)
              </label>
              <span className="text-[11px] text-emerald-700 font-bold">Somaliland Shillings</span>
            </div>
            <div className="relative">
              <input
                type="number"
                step="500"
                min="1000"
                max="50000"
                value={fuelPricePerLiterSlsh}
                onChange={(e) => setFuelPricePerLiterSlsh(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black font-mono text-slate-900 focus:ring-2 focus:ring-[#008751] focus:outline-none"
                required
              />
              <span className="absolute right-3 top-2.5 text-slate-500 font-bold text-xs">SLSH / Liter</span>
            </div>
            <p className="text-[10px] text-slate-500">
              Current Hargeisa average: ~9,500 – 10,500 SLSH ($1.00 - $1.15 per liter)
            </p>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-[#008751] hover:bg-[#007043] active:scale-95 text-white font-black rounded-xl text-xs flex items-center justify-center space-x-2 shadow-md transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving Configuration...' : 'Save Vehicle Configuration'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
