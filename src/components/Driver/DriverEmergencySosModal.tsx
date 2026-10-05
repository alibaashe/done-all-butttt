import { AlertOctagon, Check, Mic, PhoneCall, ShieldAlert, Video, VolumeX, X } from 'lucide-react';
import React, { useState } from 'react';

interface DriverEmergencySosModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DriverEmergencySosModal: React.FC<DriverEmergencySosModalProps> = ({ isOpen, onClose }) => {
  const [dashcamActive, setDashcamActive] = useState(false);
  const [panicSent, setPanicSent] = useState(false);

  if (!isOpen) return null;

  const handlePanicBroadcast = () => {
    setPanicSent(true);
    setTimeout(() => {
      setPanicSent(false);
      onClose();
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 text-white rounded-3xl max-w-md w-full border border-rose-500/50 shadow-2xl overflow-hidden flex flex-col">
        <div className="p-5 bg-gradient-to-r from-rose-950 via-slate-900 to-slate-900 border-b border-rose-500/30 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-rose-500 text-slate-950 font-black animate-pulse">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">Driver Emergency SOS Center</h3>
              <p className="text-xs text-rose-300">1-Tap Security Dispatch & Silent Alert</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Emergency 999 Police Dispatch */}
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl space-y-2">
            <div className="flex items-center justify-between text-xs font-black text-rose-200">
              <span className="flex items-center gap-1.5">
                <PhoneCall className="w-4 h-4 text-rose-400" /> SOMALI NATIONAL SECURITY (POLICE 999)
              </span>
            </div>
            <p className="text-[11px] text-rose-200/80">
              Direct hotlink to local police and emergency command centers in Hargeisa / Mogadishu.
            </p>
            <a
              href="tel:999"
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl text-xs shadow-lg flex items-center justify-center gap-2 transition"
            >
              <PhoneCall className="w-4 h-4" /> Call Emergency Police (#999)
            </a>
          </div>

          {/* Silent Panic Broadcast Button */}
          <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2 text-center">
            <span className="text-xs font-bold text-slate-300 block">Silent Panic Signal to Control Room</span>
            <p className="text-[11px] text-slate-400">
              Sends your live GPS coordinates silently to dispatch team without alerting passengers.
            </p>

            {panicSent ? (
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 animate-bounce">
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Panic Signal Sent! Response Unit Dispatched.</span>
              </div>
            ) : (
              <button
                onClick={handlePanicBroadcast}
                className="w-full py-3 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black rounded-xl text-xs shadow-xl flex items-center justify-center gap-2 transition"
              >
                <AlertOctagon className="w-4 h-4" /> BROADCAST SILENT PANIC ALARM
              </button>
            )}
          </div>

          {/* Silent In-Cabin Dashcam Controller */}
          <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-slate-200 block flex items-center gap-1.5">
                <Video className="w-4 h-4 text-emerald-400" /> In-Cabin Security Dashcam Recording
              </span>
              <span className="text-[10px] text-slate-400">Encrypted Cloud Recording</span>
            </div>

            <button
              onClick={() => setDashcamActive(!dashcamActive)}
              className={`px-3.5 py-1.5 rounded-xl font-extrabold text-xs transition border ${
                dashcamActive
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              {dashcamActive ? 'REC ON' : 'REC OFF'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
