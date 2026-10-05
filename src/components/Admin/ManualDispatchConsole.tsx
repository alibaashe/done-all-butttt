import React, { useState } from 'react';
import { PhoneIncoming, Send, User, Check, X, Building2 } from 'lucide-react';
import { useRide } from '../../context/RideContext';
import { CITY_LOCATIONS } from '../../data/mockData';

interface ManualDispatchConsoleProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ManualDispatchConsole: React.FC<ManualDispatchConsoleProps> = ({ isOpen, onClose }) => {
  const { drivers, dispatchDriverToRide, setPickupLocation, setDropoffLocation, bookRide } = useRide();
  const [callerName, setCallerName] = useState('Macaamiil Wadaage');
  const [callerPhone, setCallerPhone] = useState('+252 63 6807814');
  const [selectedDriverId, setSelectedDriverId] = useState(drivers[0]?.id || '');
  const [dispatched, setDispatched] = useState(false);

  if (!isOpen) return null;

  const handleManualDispatch = (e: React.FormEvent) => {
    e.preventDefault();
    setPickupLocation(CITY_LOCATIONS[0]);
    setDropoffLocation(CITY_LOCATIONS[1]);
    bookRide('cash');
    setDispatched(true);
    setTimeout(() => {
      setDispatched(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold">
            <PhoneIncoming className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base">Manual Dispatch Console</h3>
            <p className="text-xs text-slate-500">Assign drivers manually for phone-in bookings & corporate VIPs</p>
          </div>
        </div>

        <form onSubmit={handleManualDispatch} className="space-y-3 mb-4">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Rider / Corporate Client Name</label>
            <input
              type="text"
              value={callerName}
              onChange={(e) => setCallerName(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Phone Number</label>
            <input
              type="text"
              value={callerPhone}
              onChange={(e) => setCallerPhone(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Select Driver to Assign</label>
            {drivers.length === 0 ? (
              <div className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-500 italic">
                No drivers registered yet. Drivers will appear as soon as they sign up and get approved.
              </div>
            ) : (
              <select
                value={selectedDriverId}
                onChange={(e) => setSelectedDriverId(e.target.value)}
                className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
              >
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.vehicle?.model || 'Vehicle'} • {(d.status || 'available').toUpperCase()})
                  </option>
                ))}
              </select>
            )}
          </div>

          {dispatched ? (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-500 text-xs font-bold flex items-center justify-center gap-2">
              <Check className="w-4 h-4" />
              Manual Driver Dispatched Successfully!
            </div>
          ) : (
            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition"
            >
              <Send className="w-4 h-4" />
              Dispatch Driver Manually
            </button>
          )}
        </form>
      </div>
    </div>
  );
};
