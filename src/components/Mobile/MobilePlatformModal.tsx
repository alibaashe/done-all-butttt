import React, { useState } from 'react';
import { Smartphone, Check, Sparkles, Download, Layers, ShieldCheck, Apple } from 'lucide-react';

interface MobilePlatformModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobilePlatformModal: React.FC<MobilePlatformModalProps> = ({ isOpen, onClose }) => {
  const [platform, setPlatform] = useState<'ios' | 'android'>('android');
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const currentUrl = window.location.href;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(currentUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-5 animate-scale-up">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">Wadaage Mobile Support (Android & iOS)</h3>
              <p className="text-xs text-slate-400">PWA Cross-Platform App & Native Responsive Execution</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white font-bold text-sm">
            ✕
          </button>
        </div>

        {/* Platform Selector Tabs */}
        <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
          <button
            onClick={() => setPlatform('android')}
            className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition ${
              platform === 'android'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Android (APK / PWA)</span>
          </button>

          <button
            onClick={() => setPlatform('ios')}
            className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition ${
              platform === 'ios'
                ? 'bg-emerald-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Apple className="w-4 h-4" />
            <span>iOS (Apple Safari)</span>
          </button>
        </div>

        {/* Platform Specific Guides */}
        {platform === 'android' ? (
          <div className="p-4 bg-slate-800/60 rounded-2xl border border-slate-700/80 space-y-3 text-xs">
            <div className="flex items-center space-x-2 text-emerald-400 font-extrabold text-sm">
              <Sparkles className="w-4 h-4" />
              <span>Android Mobile Device Experience</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Wadaage is built with responsive mobile viewport controls, native touch gestures, high-precision mobile location GPS, and mobile PWA manifest support.
            </p>

            <div className="space-y-2 pt-1 font-medium text-slate-300">
              <div className="flex items-start space-x-2">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">1</div>
                <span>Open this application link in <b>Google Chrome</b> on your Android phone.</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">2</div>
                <span>Tap the <b>3 dots menu (⋮)</b> in Chrome and select <b>"Install App"</b> or <b>"Add to Home Screen"</b>.</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">3</div>
                <span>Wadaage will run full-screen without browser address bars on Android.</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-slate-800/60 rounded-2xl border border-slate-700/80 space-y-3 text-xs">
            <div className="flex items-center space-x-2 text-emerald-400 font-extrabold text-sm">
              <Apple className="w-4 h-4" />
              <span>iOS Apple iPhone / iPad Experience</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Fully optimized for iOS Safari webkit, retina touch targets, Apple notch safety area margins, and standalone app display.
            </p>

            <div className="space-y-2 pt-1 font-medium text-slate-300">
              <div className="flex items-start space-x-2">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">1</div>
                <span>Open this link in <b>Safari</b> on your iPhone or iPad.</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">2</div>
                <span>Tap the <b>Share Button (square with arrow up)</b> at the bottom.</span>
              </div>
              <div className="flex items-start space-x-2">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">3</div>
                <span>Scroll down and tap <b>"Add to Home Screen"</b> to launch as an iOS App.</span>
              </div>
            </div>
          </div>
        )}

        {/* Share App Link Action */}
        <div className="pt-2 flex items-center justify-between border-t border-slate-800 text-xs">
          <span className="text-slate-400 font-medium">Scan or Open App Link on Mobile:</span>
          <button
            onClick={handleCopyLink}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl uppercase shadow-lg flex items-center space-x-1.5 transition"
          >
            {copiedLink ? <Check className="w-4 h-4 text-slate-950" /> : <Download className="w-4 h-4" />}
            <span>{copiedLink ? 'Link Copied!' : 'Copy Mobile App Link'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
