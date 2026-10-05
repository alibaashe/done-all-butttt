import { Check, Compass, MapPin, Navigation, Search, X } from 'lucide-react';
import React, { useState } from 'react';

interface DestinationModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeDestination: string | null;
  onSetDestination: (destination: string | null) => void;
}

const POPULAR_DESTINATIONS = [
  'Hargeisa City Center & Suuq',
  'Egal International Airport Gate',
  'Mogadishu Km4 Intersection',
  'Kismayo Port Terminal',
  'Dahabshiil Business Tower',
  'Galkayo Central Station',
  'Borama University Campus'
];

export const DestinationModeModal: React.FC<DestinationModeModalProps> = ({
  isOpen,
  onClose,
  activeDestination,
  onSetDestination,
}) => {
  const [customInput, setCustomInput] = useState('');

  if (!isOpen) return null;

  const handleSelect = (dest: string) => {
    onSetDestination(dest);
    onClose();
  };

  const handleClear = () => {
    onSetDestination(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 text-white rounded-3xl max-w-md w-full border border-slate-800 shadow-2xl overflow-hidden">
        <div className="p-5 bg-gradient-to-r from-blue-950 via-slate-900 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-blue-500/20 border border-blue-500/30 text-blue-400">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">Destination Mode (Home Route)</h3>
              <p className="text-xs text-slate-400">Receive rides only along your path home</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {activeDestination ? (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-emerald-400 block">Active Destination Filter</span>
                <span className="font-extrabold text-sm text-white flex items-center gap-1.5 mt-0.5">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  {activeDestination}
                </span>
              </div>
              <button
                onClick={handleClear}
                className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-300 font-bold text-xs"
              >
                Turn Off
              </button>
            </div>
          ) : (
            <div className="p-3.5 bg-slate-800/60 rounded-2xl border border-slate-800 text-xs text-slate-300">
              💡 Destination Mode filters ride requests so you only receive passengers whose drop-off is along your heading towards home or your next stop. Max 2 uses per shift.
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2">Set Custom Heading:</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  placeholder="Type neighborhood or landmark..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>
              <button
                onClick={() => customInput.trim() && handleSelect(customInput.trim())}
                disabled={!customInput.trim()}
                className="px-4 py-2 bg-blue-500 disabled:opacity-40 hover:bg-blue-400 text-slate-950 font-black rounded-xl text-xs transition"
              >
                Set
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2">Popular End-of-Shift Hubs:</label>
            <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar">
              {POPULAR_DESTINATIONS.map((dest) => (
                <button
                  key={dest}
                  onClick={() => handleSelect(dest)}
                  className={`w-full p-2.5 rounded-xl border text-xs font-bold text-left transition flex items-center justify-between ${
                    activeDestination === dest
                      ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                      : 'bg-slate-950 border-slate-800 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Navigation className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    {dest}
                  </span>
                  {activeDestination === dest && <Check className="w-4 h-4 text-blue-400" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
