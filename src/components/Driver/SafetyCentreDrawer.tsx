import React, { useState } from 'react';
import { Shield, Settings, Mic, MapPin, AlertTriangle, X, Check, PhoneCall } from 'lucide-react';

interface SafetyCentreDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onTriggerSos: () => void;
}

export const SafetyCentreDrawer: React.FC<SafetyCentreDrawerProps> = ({
  isOpen,
  onClose,
  onTriggerSos,
}) => {
  const [audioProtectEnabled, setAudioProtectEnabled] = useState(true);
  const [shareLocationEnabled, setShareLocationEnabled] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-200"
      >
        {/* Top Handle bar for mobile drag feeling */}
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto my-3 sm:hidden" />

        <div className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Safety Centre</h3>
                <p className="text-xs text-slate-500">24/7 Live Monitoring & Protection</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {toastMessage && (
            <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold text-center animate-in fade-in">
              {toastMessage}
            </div>
          )}

          <div className="space-y-2">
            {/* Safety Settings option */}
            <button
              onClick={() => showToast('Safety settings updated and active.')}
              className="w-full p-3.5 bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700/80 flex items-center justify-between text-left transition"
            >
              <div className="flex items-center space-x-3">
                <Settings className="w-5 h-5 text-slate-700 dark:text-slate-300" />
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Safety Settings</div>
                  <div className="text-[11px] text-slate-500">Configure emergency contacts & PIN verification</div>
                </div>
              </div>
              <span className="text-xs font-bold text-slate-400">&gt;</span>
            </button>

            {/* AudioProtect Toggle */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Mic className={`w-5 h-5 ${audioProtectEnabled ? 'text-emerald-500 animate-pulse' : 'text-slate-400'}`} />
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>AudioProtect</span>
                    {audioProtectEnabled && (
                      <span className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black px-1.5 py-0.2 rounded">
                        REC ACTIVE
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500">Encrypted audio recording during active trips</div>
                </div>
              </div>
              <button
                onClick={() => {
                  setAudioProtectEnabled(!audioProtectEnabled);
                  showToast(audioProtectEnabled ? 'AudioProtect paused' : 'AudioProtect enabled for trip safety');
                }}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                  audioProtectEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                    audioProtectEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Share Live Location */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <MapPin className="w-5 h-5 text-blue-500" />
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Share Live Location</div>
                  <div className="text-[11px] text-slate-500">
                    Your location can be seen by family until you go offline.
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  setShareLocationEnabled(!shareLocationEnabled);
                  showToast(shareLocationEnabled ? 'Live location sharing stopped' : 'Live tracking link shared with emergency contacts');
                }}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                  shareLocationEnabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                    shareLocationEnabled ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Red Alert - Emergency SOS */}
            <button
              onClick={() => {
                onClose();
                onTriggerSos();
              }}
              className="w-full p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-2xl flex items-center justify-between text-left transition group"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-rose-500 text-white group-hover:scale-110 transition-transform">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                    I need Emergency SOS / Police
                  </div>
                  <div className="text-[11px] text-rose-700 dark:text-rose-300">
                    Instant dispatch hotline #999 & live location alert
                  </div>
                </div>
              </div>
              <PhoneCall className="w-5 h-5 text-rose-500 animate-bounce" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
