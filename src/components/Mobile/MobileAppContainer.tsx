import React, { useState, useEffect } from 'react';
import { Wifi, Battery, Smartphone, Shield, Car, User, Sparkles, Navigation } from 'lucide-react';
import { useRide } from '../../context/RideContext';
import { UserRole } from '../../types';

interface MobileAppContainerProps {
  children: React.ReactNode;
  appName?: string;
  appType?: 'rider' | 'driver' | 'admin' | 'auth';
  onBackToWebsite?: () => void;
  onNavigate?: (view: 'website' | 'rider' | 'driver' | 'admin') => void;
}

export const MobileAppContainer: React.FC<MobileAppContainerProps> = ({
  children,
  appName = 'Wadaage Mobility',
  appType = 'rider',
  onBackToWebsite,
  onNavigate,
}) => {
  const { role } = useRide();
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="w-full min-h-[100dvh] bg-slate-950 text-slate-100 flex flex-col justify-center items-center relative overflow-x-hidden selection:bg-blue-600 selection:text-white font-sans">
      {/* Main Viewport Container */}
      <main className="w-full h-[100dvh] sm:h-auto sm:py-2 flex items-center justify-center overflow-hidden">
        {/* Smartphone Device Frame on Desktop / 100% Full View on Mobile */}
        <div className="w-full sm:max-w-[420px] h-[100dvh] sm:h-[870px] sm:max-h-[calc(100vh-60px)] bg-slate-950 sm:rounded-[48px] sm:border-[8px] sm:border-slate-800/90 sm:shadow-2xl sm:shadow-black/90 flex flex-col relative overflow-hidden transition-all duration-300 ring-1 ring-slate-700/50">

          {/* Native Smartphone Status Bar */}
          <div className="w-full bg-slate-950/95 text-slate-200 px-6 py-2 flex items-center justify-between text-xs font-semibold z-50 shrink-0 select-none border-b border-slate-900">
            {/* Clock Time */}
            <span className="font-bold tracking-tight text-white font-mono text-[13px]">
              {currentTime || '09:41'}
            </span>

            {/* Top Speaker / Dynamic Island Notch Pill */}
            <div className="flex items-center space-x-1.5 px-3 py-0.5 bg-slate-900/90 rounded-full border border-slate-800/80 shadow-inner">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold text-slate-300 tracking-wider">
                {appType === 'driver' ? 'DRIVER APK' : appType === 'admin' ? 'ADMIN' : 'WADAAGE 4G'}
              </span>
            </div>

            {/* Status Icons: 5G Signal, WiFi, Battery */}
            <div className="flex items-center space-x-2 text-slate-300">
              <div className="flex items-end space-x-0.5 h-3">
                <span className="w-0.5 h-1.5 bg-white rounded-xs" />
                <span className="w-0.5 h-2 bg-white rounded-xs" />
                <span className="w-0.5 h-2.5 bg-white rounded-xs" />
                <span className="w-0.5 h-3 bg-white rounded-xs" />
              </div>
              <Wifi className="w-3.5 h-3.5 text-slate-200" />
              <div className="flex items-center space-x-0.5">
                <span className="text-[10px] font-mono text-emerald-400 font-bold">100%</span>
                <Battery className="w-4 h-4 text-emerald-400 fill-emerald-400" />
              </div>
            </div>
          </div>

          {/* Real Native Application Screen Content */}
          <div className="w-full h-full flex-1 flex flex-col overflow-hidden relative bg-slate-900">
            {children}
          </div>

          {/* Bottom Native Gesture Navigation Bar (Home Indicator) */}
          <div className="w-full py-1 bg-slate-950 flex justify-center items-center shrink-0 border-t border-slate-900">
            <span className="w-32 h-1 bg-slate-600 rounded-full hover:bg-slate-400 transition cursor-pointer" />
          </div>
        </div>
      </main>
    </div>
  );
};
