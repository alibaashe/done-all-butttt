import { Mic, MicOff, Phone, PhoneCall, PhoneOff, Volume2, VolumeX, Shield, Radio, Smartphone, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useRide } from '../../context/RideContext';

interface CallDriverModalProps {
  onClose: () => void;
}

export const CallDriverModal: React.FC<CallDriverModalProps> = ({ onClose }) => {
  const { currentRide, drivers, initiateVoiceCall } = useRide();
  const [activeCallMode, setActiveCallMode] = useState<'selection' | 'in_app'>('selection');
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(true);
  const [seconds, setSeconds] = useState(0);

  const matchedDriver = currentRide?.assignedDriverId ? drivers.find((d) => d.id === currentRide.assignedDriverId) : null;
  const assignedDriver = matchedDriver || {
    id: 'live_driver',
    name: (currentRide as any)?.driver_name || currentRide?.driverName || 'Wadaage Driver Captain',
    phone: (currentRide as any)?.driver_phone || currentRide?.driverPhone || '',
    avatar: (currentRide as any)?.driver_avatar || currentRide?.driverAvatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    rating: 5.0,
    vehicle: { model: (currentRide as any)?.vehicle_model || 'Toyota Vitz', licensePlate: (currentRide as any)?.license_plate || 'SL-24810', color: 'White' },
  };

  useEffect(() => {
    let timer: any = null;
    if (activeCallMode === 'in_app') {
      timer = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [activeCallMode]);

  const formatTimer = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartInAppCall = () => {
    setActiveCallMode('in_app');
    initiateVoiceCall();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-lg flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-white shadow-2xl flex flex-col items-center text-center space-y-5 relative overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Encrypted VoIP Safety Badge */}
        <div className="flex items-center space-x-1.5 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full text-emerald-400 text-[10px] font-bold">
          <Shield className="w-3.5 h-3.5" />
          <span>Dual Call Options • Cellular & Free In-App</span>
        </div>

        {/* Driver Avatar */}
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping opacity-75" />
          <img
            src={assignedDriver.avatar}
            alt={assignedDriver.name}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-4 border-emerald-500 relative z-10 shadow-xl"
          />
        </div>

        {/* Name & Phone */}
        <div>
          <h3 className="text-xl font-black text-white">{assignedDriver.name}</h3>
          <p className="text-xs text-slate-400 font-medium mt-1">
            {assignedDriver.vehicle.model} • <span className="font-mono text-emerald-400 font-bold">{assignedDriver.vehicle.licensePlate}</span>
          </p>
          <p className="text-xs font-mono text-slate-300 font-bold mt-1">
            📞 {assignedDriver.phone}
          </p>
        </div>

        {activeCallMode === 'selection' ? (
          /* SELECTION MODE: 2 PROMINENT CALL OPTIONS */
          <div className="w-full space-y-3 pt-2">
            {/* Option 1: Direct Cellular Call using Registered Phone Number */}
            <a
              href={`tel:${assignedDriver.phone.replace(/\s+/g, '')}`}
              className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg flex items-center justify-center space-x-2 transition active:scale-95 cursor-pointer block"
            >
              <Smartphone className="w-4 h-4" />
              <span>Normal Phone Call ({assignedDriver.phone})</span>
            </a>

            {/* Option 2: Free In-App Voice Call (VoIP) */}
            <button
              onClick={handleStartInAppCall}
              className="w-full py-3.5 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-400 font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg flex items-center justify-center space-x-2 transition active:scale-95 cursor-pointer"
            >
              <PhoneCall className="w-4 h-4 text-emerald-400" />
              <span>Free In-App Voice Call (Internet)</span>
            </button>
          </div>
        ) : (
          /* ACTIVE IN-APP CALL MODE */
          <div className="w-full space-y-4">
            <div className="text-emerald-400 font-mono font-bold text-sm flex items-center justify-center space-x-2">
              <Radio className="w-4 h-4 animate-pulse" />
              <span>In-App Connected ({formatTimer(seconds)})</span>
            </div>

            {/* Voice Wave Graphic */}
            <div className="flex items-center justify-center space-x-1.5 h-8">
              {[40, 75, 30, 90, 50, 100, 60, 80, 45, 95, 35].map((h, idx) => (
                <div
                  key={idx}
                  className="w-1.5 bg-emerald-500 rounded-full transition-all duration-300"
                  style={{
                    height: `${Math.max(15, (h * (seconds % 3 + 1)) / 3)}%`,
                  }}
                />
              ))}
            </div>

            {/* Call Controls */}
            <div className="flex items-center justify-center space-x-6 pt-2">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`p-3.5 rounded-full border transition-all ${
                  isMuted ? 'bg-rose-500 text-white border-rose-500' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              <button
                onClick={onClose}
                className="p-4 rounded-full bg-rose-600 hover:bg-rose-500 text-white shadow-2xl transition-transform hover:scale-105 active:scale-95"
              >
                <PhoneOff className="w-6 h-6" />
              </button>

              <button
                onClick={() => setIsSpeaker(!isSpeaker)}
                className={`p-3.5 rounded-full border transition-all ${
                  isSpeaker ? 'bg-emerald-500 text-slate-950 border-emerald-500' : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                }`}
              >
                {isSpeaker ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
