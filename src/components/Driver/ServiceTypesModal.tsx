import React, { useState } from 'react';
import { Car, Package, Users, Zap, Award, Check, X } from 'lucide-react';

interface ServiceTypesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ServiceTypesModal: React.FC<ServiceTypesModalProps> = ({ isOpen, onClose }) => {
  const [services, setServices] = useState([
    { id: 'wadaage_share', name: 'Wadaage Share', desc: 'Multi-passenger shared routes', icon: Users, active: true, multiplier: '1.25x Earnings' },
    { id: 'wadaage_taxi', name: 'Normal Taxi', desc: 'Standard 4-seater private rides', icon: Car, active: true, multiplier: '1.0x' },
  ]);

  if (!isOpen) return null;

  const toggleService = (id: string) => {
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, active: !s.active } : s))
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Service Types Selection</h3>
            <p className="text-xs text-slate-500">Toggle job streams to earn across multiple services</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2.5 max-h-[60vh] overflow-y-auto">
          {services.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.id}
                onClick={() => toggleService(s.id)}
                className={`p-3.5 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                  s.active
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-slate-900 dark:text-white'
                    : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-400'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2.5 rounded-xl ${s.active ? 'bg-emerald-500 text-slate-950' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold flex items-center gap-2">
                      <span>{s.name}</span>
                      <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.2 rounded">
                        {s.multiplier}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">{s.desc}</div>
                  </div>
                </div>

                <div className={`w-6 h-6 rounded-lg flex items-center justify-center border transition ${
                  s.active ? 'bg-emerald-500 border-emerald-500 text-slate-950' : 'border-slate-300 dark:border-slate-600'
                }`}>
                  {s.active && <Check className="w-4 h-4 stroke-[3]" />}
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider transition shadow-lg"
        >
          Save Active Services
        </button>
      </div>
    </div>
  );
};
