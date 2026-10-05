import React from 'react';
import { Clock, Play, Pause, RotateCcw, AlertCircle } from 'lucide-react';
import { useRide } from '../../context/RideContext';

interface WaitingTimeMeterProps {
  isDriverView?: boolean;
  className?: string;
}

export const WaitingTimeMeter: React.FC<WaitingTimeMeterProps> = ({
  isDriverView = false,
  className = '',
}) => {
  const { currentRide, toggleWaitingTime, resetWaitingTime } = useRide();

  if (!currentRide || (currentRide.status !== 'in_progress' && currentRide.status !== 'driver_arrived' && currentRide.status !== 'accepted')) {
    return null;
  }

  // Normal Taxi or private rides
  const isNormalTaxi = currentRide.category === 'wadaage_taxi' || currentRide.service_type === 'Normal' || !currentRide.isShared;

  const seconds = currentRide.waitingSeconds || 0;
  const isActive = !!currentRide.isWaitingActive;
  const minutes = seconds > 0 ? Math.ceil(seconds / 60) : (isActive ? 1 : 0);
  const feeSlsh = (currentRide.waitingFeeSlsh !== undefined ? currentRide.waitingFeeSlsh : minutes * 500) || 0;
  const feeUsd = currentRide.waitingFeeUsd || Number((feeSlsh / 8500).toFixed(2));

  // Format mm:ss
  const displayMins = Math.floor(seconds / 60);
  const displaySecs = seconds % 60;
  const timeFormatted = `${String(displayMins).padStart(2, '0')}:${String(displaySecs).padStart(2, '0')}`;

  if (!isNormalTaxi && !isActive && seconds === 0) {
    return null;
  }

  return (
    <div
      className={`rounded-2xl border p-3 transition-all duration-200 ${
        isActive
          ? 'bg-amber-500/15 border-amber-500/40 ring-1 ring-amber-500/30'
          : seconds > 0
          ? 'bg-slate-900/90 border-slate-700/80 text-white'
          : 'bg-slate-900/60 border-slate-800 text-slate-300'
      } ${className}`}
    >
      <div className="flex items-center justify-between gap-2">
        {/* Left: Timer info & status */}
        <div className="flex items-center space-x-2.5 min-w-0">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center font-black shrink-0 transition-transform ${
              isActive
                ? 'bg-amber-400 text-slate-950 animate-pulse shadow-md shadow-amber-400/30 scale-105'
                : 'bg-slate-800 text-amber-400 border border-slate-700'
            }`}
          >
            <Clock className={`w-4 h-4 ${isActive ? 'animate-spin' : ''}`} />
          </div>

          <div className="min-w-0">
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-black text-slate-900 dark:text-white truncate">
                {isActive ? 'Sugitaanka Wuu Socdaa' : seconds > 0 ? 'Sugitaankii Waa La Hakiyay' : 'Wakhtiga Sugitaanka (Waiting)'}
              </span>
              <span className="bg-amber-400/20 text-amber-600 dark:text-amber-400 text-[9px] font-extrabold px-1.5 py-0.2 rounded uppercase border border-amber-500/30 whitespace-nowrap">
                500 SLSH / Daqiiqo
              </span>
            </div>

            <div className="flex items-center space-x-2 text-[11px] mt-0.5">
              <span className="font-mono font-black text-amber-600 dark:text-amber-400 text-xs">
                ⏱️ {timeFormatted}
              </span>
              <span className="text-slate-400">•</span>
              <span className="font-bold text-slate-700 dark:text-slate-200">
                {minutes} {minutes === 1 ? 'daqiiqo' : 'daqiiqadood'} = <b className="text-emerald-600 dark:text-emerald-400 font-mono">+{feeSlsh.toLocaleString()} SLSH</b> (${feeUsd.toFixed(2)})
              </span>
            </div>
          </div>
        </div>

        {/* Right: Driver Action Control Button */}
        {isDriverView && (
          <div className="flex items-center space-x-1.5 shrink-0">
            <button
              type="button"
              onClick={() => toggleWaitingTime()}
              className={`px-3 py-2 rounded-xl text-xs font-black flex items-center space-x-1.5 shadow-md active:scale-95 transition cursor-pointer ${
                isActive
                  ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/30'
                  : 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-amber-400/20'
              }`}
            >
              {isActive ? (
                <>
                  <Pause className="w-3.5 h-3.5 fill-current" />
                  <span>Jooji</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{seconds > 0 ? 'Sii Wad' : 'Biloow'}</span>
                </>
              )}
            </button>

            {seconds > 0 && !isActive && (
              <button
                type="button"
                onClick={() => resetWaitingTime()}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 active:scale-90 transition cursor-pointer"
                title="Tir (Reset)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Helper text for passenger or driver */}
      {isActive && (
        <div className="mt-2 pt-2 border-t border-amber-500/20 flex items-center justify-between text-[10px] text-amber-700 dark:text-amber-300 font-medium">
          <span className="flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-amber-500 shrink-0" />
            <span>Xisaabinta tooska ah: Daqiiqad kasta oo la sugo waxaa lagu darayaa 500 SLSH.</span>
          </span>
        </div>
      )}
    </div>
  );
};
