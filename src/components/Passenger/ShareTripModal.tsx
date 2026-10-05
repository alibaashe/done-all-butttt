import { AlertTriangle, Check, Copy, ExternalLink, QrCode, Share2, ShieldCheck, X } from 'lucide-react';
import React, { useState } from 'react';
import { useRide } from '../../context/RideContext';
import { isLocationSharingAllowed } from '../../utils/geo';

interface ShareTripModalProps {
  onClose: () => void;
}

export const ShareTripModal: React.FC<ShareTripModalProps> = ({ onClose }) => {
  const { currentRide, drivers } = useRide();
  const [copied, setCopied] = useState(false);

  if (!currentRide) return null;

  const rawDriver = (currentRide.assignedDriverId ? drivers.find((d) => d.id === currentRide.assignedDriverId) : null) || drivers[0];
  const assignedDriver = {
    id: rawDriver?.id || 'live_driver',
    name: rawDriver?.name || 'Wadaage Driver Captain',
    phone: rawDriver?.phone || '+252 63 6807814',
    avatar: rawDriver?.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    rating: rawDriver?.rating || 5.0,
    vehicle: {
      model: rawDriver?.vehicle?.model || 'Toyota Vitz',
      licensePlate: rawDriver?.vehicle?.licensePlate || 'SL-24810',
      color: rawDriver?.vehicle?.color || 'White',
    },
  };
  const driverDistKm = currentRide.status === 'searching' ? 2.5 : 0.4; // 0.4 km when assigned, 2.5 km when searching
  const locationSharingCheck = isLocationSharingAllowed(currentRide.category, driverDistKm, currentRide.status);

  const shareableUrl = `https://wadaagetaxi.app/track/${currentRide.id}?pin=9281`;
  const summaryText = `🚗 Live Ride Track: ${currentRide.passengerName || 'Passenger'}'s trip with ${assignedDriver.name} (${assignedDriver.vehicle.model}, Plate: ${assignedDriver.vehicle.licensePlate}). Route: ${currentRide.pickup?.name || 'Pickup'} ➔ ${currentRide.dropoff?.name || 'Dropoff'}. Track live: ${shareableUrl}`;

  const handleCopyLink = () => {
    if (!locationSharingCheck.allowed) return;
    navigator.clipboard.writeText(shareableUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (!locationSharingCheck.allowed) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `WadaageTaxi Live Ride Status #${currentRide.id}`,
          text: summaryText,
          url: shareableUrl,
        });
      } catch (err) {
        console.log('Share error or cancelled', err);
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full text-white shadow-2xl relative space-y-5">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800/80 p-2 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-extrabold shadow-inner">
            <Share2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white">Share Live Trip Status</h3>
            <p className="text-xs text-slate-400">Allow family or friends to track your journey in real-time</p>
          </div>
        </div>

        {/* Wadaage Share Proximity / On-the-way Location Sharing Banner */}
        {!locationSharingCheck.allowed ? (
          <div className="p-3.5 bg-amber-950/40 border border-amber-500/50 rounded-2xl text-xs space-y-2">
            <div className="flex items-center space-x-2 text-amber-300 font-extrabold">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>Location Sharing Locked (0.5 km Rule)</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              {locationSharingCheck.reason}
            </p>
            <div className="p-2 bg-slate-900 rounded-xl text-[10px] text-slate-400 font-mono">
              Driver Status: <span className="text-amber-400 font-bold uppercase">{currentRide.status}</span> • Approx Distance: <span className="text-amber-400 font-bold">{driverDistKm.toFixed(1)} km</span>
            </div>
          </div>
        ) : (
          <div className="p-2.5 bg-emerald-950/40 border border-emerald-500/40 rounded-xl flex items-center space-x-2 text-xs text-emerald-300 font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Driver is on the way / within 0.5 km. Location sharing active!</span>
          </div>
        )}

        {/* Live Trip Preview Card */}
        <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700/80 space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-700/60">
            <div className="flex items-center space-x-3">
              <img
                src={assignedDriver.avatar}
                alt={assignedDriver.name}
                className="w-10 h-10 rounded-full object-cover border-2 border-emerald-500"
              />
              <div>
                <p className="text-xs font-bold text-white">{assignedDriver.name}</p>
                <p className="text-[11px] text-slate-400">
                  {assignedDriver.vehicle.model} • <span className="text-emerald-400 font-mono font-bold">{assignedDriver.vehicle.licensePlate}</span>
                </p>
              </div>
            </div>
            <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase px-2.5 py-1 rounded-full border border-emerald-500/30">
              Live GPS Pin
            </span>
          </div>

          <div className="space-y-1 text-xs">
            <div className="flex items-start space-x-2 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shrink-0" />
              <p className="line-clamp-1"><span className="text-slate-400 font-medium">Pickup:</span> {currentRide.pickup?.name || 'Pickup Location'}</p>
            </div>
            <div className="flex items-start space-x-2 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-rose-500 mt-1 shrink-0" />
              <p className="line-clamp-1"><span className="text-slate-400 font-medium">Dropoff:</span> {currentRide.dropoff?.name || 'Dropoff Destination'}</p>
            </div>
          </div>
        </div>

        {/* Copyable Link Input */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Live Tracking Link</label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              readOnly
              value={locationSharingCheck.allowed ? shareableUrl : 'https://wadaagetaxi.app/track/locked-until-driver-arrives-0.5km'}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 w-full outline-none"
            />
            <button
              onClick={handleCopyLink}
              disabled={!locationSharingCheck.allowed}
              className={`font-bold px-3 py-2 rounded-xl text-xs flex items-center space-x-1 shrink-0 transition-colors ${
                locationSharingCheck.allowed
                  ? 'bg-slate-800 hover:bg-slate-700 text-white'
                  : 'bg-slate-800/40 text-slate-600 cursor-not-allowed'
              }`}
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>

        {/* Quick Action Share Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            onClick={handleNativeShare}
            disabled={!locationSharingCheck.allowed}
            className={`font-black py-3 rounded-2xl text-xs flex items-center justify-center space-x-2 transition-all ${
              locationSharingCheck.allowed
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Share2 className="w-4 h-4" />
            <span>Share via Phone Apps</span>
          </button>

          {locationSharingCheck.allowed ? (
            <a
              href={`https://wa.me/?text=${encodeURIComponent(summaryText)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 font-bold py-3 rounded-2xl text-xs flex items-center justify-center space-x-2 transition-all"
            >
              <ExternalLink className="w-4 h-4" />
              <span>WhatsApp / SMS</span>
            </a>
          ) : (
            <button
              disabled
              className="bg-slate-800 text-slate-600 border border-slate-800 font-bold py-3 rounded-2xl text-xs flex items-center justify-center space-x-2 cursor-not-allowed"
            >
              <ExternalLink className="w-4 h-4" />
              <span>WhatsApp / SMS</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
