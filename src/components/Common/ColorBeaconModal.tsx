import { AnimatePresence, motion } from 'motion/react';
import React, { useState } from 'react';
import { BeaconColor } from '../../types';
import { Sparkles, Sun, Volume2, X, Zap } from 'lucide-react';

interface ColorBeaconModalProps {
  isOpen: boolean;
  onClose: () => void;
  beaconColor?: BeaconColor;
  passengerName?: string;
  driverName?: string;
  vehicleModel?: string;
  licensePlate?: string;
}

export const ColorBeaconModal: React.FC<ColorBeaconModalProps> = ({
  isOpen,
  onClose,
  beaconColor = {
    id: 'cyan',
    name: 'Neon Cyan',
    somaliName: 'Buluug Dhalaalaya',
    hex: '#06B6D4',
    textHex: '#0891B2',
    bgClass: 'bg-cyan-500',
    badgeClass: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40',
    accentClass: 'text-cyan-400',
  },
  passengerName = 'Passenger',
  driverName = 'Your Captain',
  vehicleModel = 'Toyota Vitz',
  licensePlate = 'SL-24810',
}) => {
  const [isStrobeActive, setIsStrobeActive] = useState(false);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-between p-6 select-none"
        style={{
          backgroundColor: beaconColor.hex,
        }}
      >
        {/* Animated Radial Light Beam Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none flex items-center justify-center">
          <motion.div
            animate={{
              scale: isStrobeActive ? [1, 1.4, 0.9, 1.5, 1] : [1, 1.25, 1],
              opacity: isStrobeActive ? [0.3, 0.7, 0.2, 0.8, 0.3] : [0.25, 0.5, 0.25],
            }}
            transition={{
              repeat: Infinity,
              duration: isStrobeActive ? 0.6 : 2.0,
              ease: 'easeInOut',
            }}
            className="w-[120vw] h-[120vw] max-w-[800px] max-h-[800px] rounded-full bg-white blur-2xl"
          />
          <motion.div
            animate={{
              scale: [0.8, 1.6, 0.8],
              opacity: [0.4, 0.1, 0.4],
            }}
            transition={{
              repeat: Infinity,
              duration: 3.0,
              ease: 'linear',
            }}
            className="w-[90vw] h-[90vw] max-w-[600px] max-h-[600px] rounded-full border-4 border-white/60"
          />
        </div>

        {/* Top Floating Control Bar */}
        <div className="w-full max-w-md flex items-center justify-between relative z-10 pt-2">
          <div className="bg-slate-950/40 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/30 text-white flex items-center gap-2 text-xs font-black">
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
            <span className="tracking-wider uppercase">BEACON ACTIVE • LAST 50M</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsStrobeActive(!isStrobeActive)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 backdrop-blur-md border ${
                isStrobeActive
                  ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-lg'
                  : 'bg-slate-950/40 text-white border-white/30 hover:bg-slate-950/60'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{isStrobeActive ? '⚡ Strobe ON' : 'Strobe'}</span>
            </button>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-slate-950/50 hover:bg-slate-950/80 text-white flex items-center justify-center border border-white/30 transition shadow-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Central Attention Banner */}
        <div className="relative z-10 flex flex-col items-center text-center my-auto space-y-4 max-w-sm">
          <motion.div
            animate={{
              y: [0, -8, 0],
            }}
            transition={{
              repeat: Infinity,
              duration: 1.5,
              ease: 'easeInOut',
            }}
            className="w-20 h-20 rounded-3xl bg-slate-950/40 backdrop-blur-md border-2 border-white/60 flex items-center justify-center shadow-2xl"
          >
            <Sparkles className="w-10 h-10 text-white" />
          </motion.div>

          <div className="space-y-1.5">
            <span className="text-white/90 text-sm font-black uppercase tracking-widest block drop-shadow-md">
              KOR U TAAG TALEEFANKA
            </span>
            <h1 className="text-white text-3xl sm:text-4xl font-black tracking-tight drop-shadow-lg uppercase leading-tight">
              HOLD PHONE UP
            </h1>
          </div>

          <div className="bg-slate-950/75 backdrop-blur-md rounded-2xl p-4 border border-white/30 shadow-2xl text-left space-y-2 w-full">
            <div className="flex items-center justify-between pb-2 border-b border-white/10">
              <span className="text-xs text-white/70 font-semibold">Assigned Beacon Color</span>
              <span className="text-xs font-black text-amber-300 uppercase tracking-wide">
                {beaconColor.name} ({beaconColor.somaliName})
              </span>
            </div>

            <p className="text-white text-xs font-medium leading-relaxed">
              Captain <span className="font-bold text-white underline">{driverName}</span> is approaching in{' '}
              <span className="font-bold text-white">{vehicleModel}</span> (Plate:{' '}
              <span className="font-mono font-black text-amber-300">{licensePlate}</span>). They are looking for someone holding up this glowing {beaconColor.name} screen.
            </p>
          </div>
        </div>

        {/* Bottom Exit Action Button */}
        <div className="w-full max-w-md relative z-10 pb-4">
          <button
            onClick={onClose}
            className="w-full py-4 rounded-2xl bg-slate-950/80 hover:bg-slate-950 text-white font-black text-sm tracking-wide border-2 border-white/40 shadow-2xl transition active:scale-95 flex items-center justify-center gap-2"
          >
            <span>DISMISS COLOR BEACON (FOUND DRIVER)</span>
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
