import React, { useState } from 'react';
import { Layers, MapPin, Plus, ShieldCheck, Sliders, Trash2, X, Zap } from 'lucide-react';
import { formatCurrency } from '../../utils/geo';

interface GeofenceZoneManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface GeofenceZone {
  id: string;
  name: string;
  type: 'airport' | 'downtown' | 'high_demand' | 'restricted';
  surgeMultiplier: number;
  airportFee: number;
  active: boolean;
  color: string;
}

export const GeofenceZoneManager: React.FC<GeofenceZoneManagerProps> = ({ isOpen, onClose }) => {
  const [zones, setZones] = useState<GeofenceZone[]>([
    {
      id: 'zone_1',
      name: 'International Airport Terminal Zone',
      type: 'airport',
      surgeMultiplier: 1.35,
      airportFee: 4.50,
      active: true,
      color: 'bg-indigo-500',
    },
    {
      id: 'zone_2',
      name: 'Downtown Financial District Core',
      type: 'downtown',
      surgeMultiplier: 1.20,
      airportFee: 0,
      active: true,
      color: 'bg-emerald-500',
    },
    {
      id: 'zone_3',
      name: 'Tech Park Nightlife Hotspot',
      type: 'high_demand',
      surgeMultiplier: 1.50,
      airportFee: 0,
      active: true,
      color: 'bg-amber-500',
    },
  ]);

  const [newZoneName, setNewZoneName] = useState('');
  const [newSurge, setNewSurge] = useState(1.25);

  if (!isOpen) return null;

  const handleAddZone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newZoneName.trim()) return;

    const newZ: GeofenceZone = {
      id: `zone_${Date.now()}`,
      name: newZoneName.trim(),
      type: 'high_demand',
      surgeMultiplier: newSurge,
      airportFee: 0,
      active: true,
      color: 'bg-teal-500',
    };

    setZones([...zones, newZ]);
    setNewZoneName('');
  };

  const toggleZone = (id: string) => {
    setZones(zones.map((z) => (z.id === id ? { ...z, active: !z.active } : z)));
  };

  const deleteZone = (id: string) => {
    setZones(zones.filter((z) => z.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base">Geofencing & Zone Management</h3>
            <p className="text-xs text-slate-500">Draw virtual boundaries for airport fees & localized surge rules</p>
          </div>
        </div>

        {/* Form to add zone */}
        <form onSubmit={handleAddZone} className="space-y-3 mb-5 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">Create Virtual Geofence Polygon</span>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Zone Name (e.g. Festival Arena Zone)"
              value={newZoneName}
              onChange={(e) => setNewZoneName(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-indigo-500"
              required
            />
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Default Zone Surge: <strong>{newSurge}x</strong></span>
              <input
                type="range"
                min={1.0}
                max={3.0}
                step={0.05}
                value={newSurge}
                onChange={(e) => setNewSurge(parseFloat(e.target.value))}
                className="w-1/2 accent-indigo-500"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition"
          >
            <Plus className="w-4 h-4" />
            Add Virtual Geofence
          </button>
        </form>

        {/* Existing Geofence Zones List */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Configured Geofences ({zones.length})</span>
          {zones.map((z) => (
            <div
              key={z.id}
              className="p-3 bg-slate-100 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 flex items-center justify-between text-xs"
            >
              <div className="flex items-center gap-2.5">
                <div className={`w-3 h-3 rounded-full ${z.color}`} />
                <div>
                  <p className="font-extrabold text-slate-900 dark:text-white">{z.name}</p>
                  <p className="text-[10px] text-slate-500">
                    Surge: <strong className="text-emerald-500">{z.surgeMultiplier}x</strong>
                    {z.airportFee > 0 && ` • Airport Surcharge: ${formatCurrency(z.airportFee)}`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleZone(z.id)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase transition ${
                    z.active
                      ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/30'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-400'
                  }`}
                >
                  {z.active ? 'ACTIVE' : 'OFF'}
                </button>
                <button onClick={() => deleteZone(z.id)} className="text-slate-400 hover:text-red-500 p-1">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
