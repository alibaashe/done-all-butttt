import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, AlertTriangle, ShieldCheck, Users, Car } from 'lucide-react';

interface StartupSplashScreenProps {
  appType: 'rider' | 'driver';
  onFinish: () => void;
}

export const StartupSplashScreen: React.FC<StartupSplashScreenProps> = ({
  appType,
  onFinish,
}) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [progress, setProgress] = useState<number>(10);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);

  const isDriver = appType === 'driver';
  const logoSrc = isDriver ? '/darwelllogo.png' : '/riderlogo.png';
  const appTitle = isDriver ? 'Wadaage Darawell Partner' : 'Wadaage Share';
  const appTagline = isDriver
    ? 'Hargeisa Captain Fleet • Earn On Every Ride'
    : 'Share the ride. Save more.';

  // Monitor online / offline state
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fast startup animation timer when online (snappy instant display)
  useEffect(() => {
    if (!isOnline) return;

    // Check if splash was already shown in this tab session
    const hasSeenSplash = sessionStorage.getItem(`wadaage_splash_${appType}`);
    if (hasSeenSplash) {
      onFinish();
      return;
    }

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          try { sessionStorage.setItem(`wadaage_splash_${appType}`, 'true'); } catch {}
          setTimeout(onFinish, 100);
          return 100;
        }
        return prev + 35;
      });
    }, 60);

    return () => clearInterval(interval);
  }, [isOnline, onFinish, appType]);

  const handleRetry = () => {
    setIsRetrying(true);
    setTimeout(() => {
      const online = navigator.onLine;
      setIsOnline(online);
      setIsRetrying(false);
      if (online) {
        setProgress(30);
      }
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-[#020b18] text-white flex flex-col items-center justify-between p-6 select-none overflow-hidden font-sans">
      {/* Deep atmosphere background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-[360px] h-[360px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar - Branding / Version */}
      <div className="w-full flex justify-between items-center z-10 pt-2 text-xs font-semibold text-slate-400">
        <span className="flex items-center space-x-1.5 text-emerald-400">
          <ShieldCheck className="w-4 h-4" />
          <span className="tracking-wider uppercase text-[11px] font-bold">Wadaage 2026</span>
        </span>
        <span className="px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-[10px] text-slate-300 font-mono">
          {isDriver ? 'DRIVER v2.4' : 'RIDER v2.4'}
        </span>
      </div>

      {/* Center Hero Artwork & Branding */}
      <div className="flex-1 flex flex-col items-center justify-center my-auto z-10 w-full max-w-sm text-center">
        {/* Logo Image Container with circular ambient ring */}
        <div className="relative mb-6 group">
          <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-xl animate-pulse" />
          <div className="relative w-44 h-44 sm:w-52 sm:h-52 rounded-full p-1 bg-gradient-to-tr from-[#00E575] via-[#00B4D8] to-[#0066FF] shadow-[0_0_35px_rgba(0,180,216,0.4)] overflow-hidden flex items-center justify-center">
            <img
              src={logoSrc}
              alt={appTitle}
              className="w-full h-full object-cover rounded-full select-none"
              onError={(e) => {
                // Fallback to local image copy if path varies
                (e.target as HTMLImageElement).src = isDriver ? '/darwelllogo.jpg' : '/riderlogo.jpg';
              }}
            />
          </div>
        </div>

        {/* Tagline text */}
        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mb-1.5 drop-shadow-md">
          {appTitle}
        </h2>
        <p className="text-sm font-medium text-slate-300 mb-8 max-w-[280px]">
          {appTagline}
        </p>

        {/* Dynamic State: Online Loading vs Offline Alert */}
        {isOnline ? (
          <div className="flex flex-col items-center space-y-4 w-full">
            {/* Circular glowing loading ring with center icon */}
            <div className="relative w-16 h-16 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-slate-800" />
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#00E575] border-r-[#00B4D8] animate-spin" />
              <div className="w-10 h-10 rounded-full bg-[#0a1b33] flex items-center justify-center shadow-inner text-[#00E575]">
                {isDriver ? <Car className="w-5 h-5" /> : <Users className="w-5 h-5" />}
              </div>
            </div>

            <div className="text-xs font-bold tracking-widest text-slate-300 uppercase">
              Loading... {progress}%
            </div>

            {/* Segmented multi-step progress bar */}
            <div className="w-48 h-1.5 bg-slate-800/80 rounded-full overflow-hidden p-0.5 flex space-x-1 border border-slate-700/50">
              <div
                className="h-full bg-gradient-to-r from-[#00E575] to-[#00B4D8] rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          /* Offline Alert Container */
          <div className="bg-red-950/40 border border-red-500/40 rounded-2xl p-4 w-full backdrop-blur-md shadow-2xl flex flex-col items-center space-y-3 animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-400">
              <WifiOff className="w-6 h-6 animate-pulse" />
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-black text-red-300 uppercase tracking-wide">
                No Internet Connection
              </h3>
              <p className="text-xs font-medium text-slate-300 leading-relaxed">
                Fadlan internetkaaga xidh si aad u sii wadato.
                <br />
                <span className="text-[11px] text-slate-400">Please connect your Wi-Fi or Mobile Data to continue.</span>
              </p>
            </div>

            <button
              onClick={handleRetry}
              disabled={isRetrying}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-98 font-bold text-xs text-white shadow-lg flex items-center justify-center space-x-2 transition disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
              <span>{isRetrying ? 'Checking connection...' : 'Dib u Tijaabi • Retry Connection'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Bottom Footer Info */}
      <div className="w-full text-center z-10 pb-2">
        <p className="text-[11px] text-slate-500 font-medium">
          Hargeisa, Somaliland • Telesom & Somtel 4G Ready
        </p>
      </div>
    </div>
  );
};
