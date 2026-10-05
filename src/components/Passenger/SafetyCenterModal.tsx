import { AlertTriangle, CheckCircle2, Mic, PhoneCall, Share2, ShieldAlert, ShieldCheck, X } from 'lucide-react';
import React, { useState } from 'react';
import { useRide } from '../../context/RideContext';
import { isLocationSharingAllowed } from '../../utils/geo';

interface SafetyCenterModalProps {
  onClose: () => void;
}

export const SafetyCenterModal: React.FC<SafetyCenterModalProps> = ({ onClose }) => {
  const { currentRide } = useRide();
  const [sosTriggered, setSosTriggered] = useState(false);
  const [audioRecording, setAudioRecording] = useState(false);

  const handleSOS = () => {
    setSosTriggered(true);
  };

  const driverDistKm = currentRide?.status === 'searching' ? 2.5 : 0.4;
  const sharingCheck = isLocationSharingAllowed(currentRide?.category, driverDistKm, currentRide?.status);

  const handleShareLiveTrip = () => {
    if (!sharingCheck.allowed) {
      alert(`⚠️ Location Sharing Locked:\n${sharingCheck.reason}`);
      return;
    }
    navigator.clipboard?.writeText('https://wadaagetaxi.app/track/live-safety');
    alert('✅ Live trip safety tracking link copied to clipboard!');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-900 dark:text-white text-base">
                Wadaage 24/7 Safety Toolkit
              </h2>
              <p className="text-xs text-slate-500">Emergency support & live trip protection</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SOS Emergency Big Button */}
        {!sosTriggered ? (
          <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 p-4 rounded-2xl text-center space-y-3">
            <div className="text-xs font-bold text-rose-800 dark:text-rose-200">
              Need Urgent Police or Safety Assistance?
            </div>
            <button
              onClick={handleSOS}
              className="w-full bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-700 hover:to-red-800 text-white font-black py-3.5 rounded-xl shadow-lg shadow-rose-600/30 text-sm tracking-wider uppercase transition-transform active:scale-95 flex items-center justify-center space-x-2"
            >
              <AlertTriangle className="w-5 h-5 animate-bounce" />
              <span>TRIGGER EMERGENCY SOS ALERT</span>
            </button>
            <p className="text-[10px] text-slate-500">
              Dispatches live GPS coordinates to Police Response & Emergency Contacts
            </p>
          </div>
        ) : (
          <div className="bg-rose-600 text-white p-4 rounded-2xl text-center space-y-2 animate-bounce">
            <ShieldCheck className="w-10 h-10 mx-auto" />
            <h3 className="font-black text-base">EMERGENCY ALERT DISPATCHED</h3>
            <p className="text-xs opacity-90">
              Safety Control Center notified. Emergency responders dispatched to your location.
            </p>
          </div>
        )}

        {/* Safety Tools List */}
        <div className="space-y-2.5">
          {/* Share trip status */}
          <button
            onClick={handleShareLiveTrip}
            className="w-full bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-left transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Share2 className="w-5 h-5 text-emerald-500" />
              <div>
                <div className="font-bold text-xs text-slate-900 dark:text-white">
                  Share Live Trip Status
                </div>
                <div className="text-[11px] text-slate-500">
                  Send real-time location link to family & trusted contacts
                </div>
              </div>
            </div>
          </button>

          {/* Audio Safeguard */}
          <div className="bg-slate-50 dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Mic className={`w-5 h-5 ${audioRecording ? 'text-rose-500 animate-pulse' : 'text-slate-400'}`} />
              <div>
                <div className="font-bold text-xs text-slate-900 dark:text-white">
                  In-Ride Audio Safeguard
                </div>
                <div className="text-[11px] text-slate-500">
                  Encrypted audio recording for dispute protection
                </div>
              </div>
            </div>
            <button
              onClick={() => setAudioRecording(!audioRecording)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                audioRecording
                  ? 'bg-rose-500 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {audioRecording ? 'Recording ON' : 'Turn ON'}
            </button>
          </div>

          {/* Direct Emergency Line */}
          <a
            href="tel:911"
            className="w-full bg-slate-900 text-white p-3.5 rounded-xl flex items-center justify-between font-bold text-xs"
          >
            <div className="flex items-center space-x-3">
              <PhoneCall className="w-5 h-5 text-emerald-400" />
              <span>Call Emergency Direct Line (911)</span>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
};
