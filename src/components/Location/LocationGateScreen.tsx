import {
  MapPin,
  Navigation,
  Crosshair,
  Compass,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ShieldCheck,
  Building,
  Sparkles,
  ArrowRight,
  Radio,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useRide } from '../../context/RideContext';
import { SomalilandFlag } from '../Common/SomalilandFlag';
import { HARGEISA_PLACES, HargeisaPlace } from '../../data/hargeisaPlaces';
import { LocationNode } from '../../types';

interface LocationGateScreenProps {
  onLocationConfirmed: () => void;
}

export const LocationGateScreen: React.FC<LocationGateScreenProps> = ({ onLocationConfirmed }) => {
  const { role, detectUserRealLocation, setPickupLocation, realUserLocation, isDetectingLocation } = useRide();
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'checking' | 'confirmed' | 'denied'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmedCoords, setConfirmedCoords] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [showManualDistrictSelect, setShowManualDistrictSelect] = useState(false);

  const appTitle = role === 'driver' ? 'Wadaage Driver Partner' : 'Wadaage Rider App';

  // Automatically check GPS on mount
  useEffect(() => {
    handleCheckGps();
  }, []);

  const handleCheckGps = async () => {
    setGpsStatus('checking');
    setErrorMessage(null);

    try {
      const detected = await detectUserRealLocation();
      if (detected) {
        setConfirmedCoords({
          lat: detected.lat,
          lng: detected.lng,
          name: detected.name,
        });
        setGpsStatus('confirmed');
        try {
          localStorage.setItem(`wadaage_location_confirmed_${role}`, 'true');
        } catch {}
        // Short delay for user to see the success confirmation before proceeding
        setTimeout(() => {
          onLocationConfirmed();
        }, 1200);
      } else {
        setGpsStatus('denied');
        setErrorMessage('Location-ka taleefankaagu ma shidna ama ogolaansho ma jiro. Fadlan taleefanka ka shid GPS-ka (Location) kaddibna taabo "Shid & Xaqiiji Location-ka".');
      }
    } catch (err: any) {
      setGpsStatus('denied');
      setErrorMessage(err?.message || 'Khalad ayaa ka dhacay baadhitaanka GPS-ka.');
    }
  };

  const handleSelectDistrict = (place: HargeisaPlace) => {
    const locNode: LocationNode = {
      id: place.id,
      name: place.name,
      address: place.address,
      lat: place.lat,
      lng: place.lng,
      zone: place.district || 'Hargeisa Central',
    };
    setPickupLocation(locNode);
    setConfirmedCoords({
      lat: place.lat,
      lng: place.lng,
      name: `${place.name} (${place.district})`,
    });
    setGpsStatus('confirmed');
    try {
      localStorage.setItem(`wadaage_location_confirmed_${role}`, 'true');
    } catch {}
    setTimeout(() => {
      onLocationConfirmed();
    }, 800);
  };

  return (
    <div className="w-full h-full min-h-full overflow-y-auto bg-gradient-to-b from-[#021f28] via-[#05323e] to-[#01171f] text-white flex flex-col justify-between relative px-4 py-6 font-sans no-scrollbar">
      {/* Decorative Neon Glowing Orbs */}
      <div className="absolute top-[-30px] left-1/2 -translate-x-1/2 w-72 h-72 bg-[#00E575]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 right-[-30px] w-60 h-60 bg-[#094757]/40 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="text-center space-y-2 pt-2 z-10">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-[#00E575]/10 border border-[#00E575]/30 text-xs font-black text-[#00E575]">
          <SomalilandFlag className="w-4 h-3 rounded-xs" />
          <span>{appTitle}</span>
        </div>
        <h1 className="text-xl font-black text-white">Xaqiijinta Location-ka (GPS)</h1>
        <p className="text-xs text-slate-300 max-w-xs mx-auto">
          Wadaage wuxuu u baahan yahay in Location-ka taleefankaagu shidnaado si gaadhiga laguugu keeno ama rakaabka aad ugu tagto.
        </p>
      </div>

      {/* Main Visual Radar & Status Card */}
      <div className="my-auto py-4 z-10 space-y-4">
        {/* Radar Animation Box */}
        <div className="relative w-36 h-36 mx-auto flex items-center justify-center">
          {/* Animated concentric rings */}
          <div className={`absolute inset-0 rounded-full border border-[#00E575]/30 ${gpsStatus === 'checking' ? 'animate-ping' : ''}`} />
          <div className="absolute inset-2 rounded-full border border-[#00E575]/40" />
          <div className="absolute inset-6 rounded-full border-2 border-dashed border-[#00E575]/50 animate-spin" style={{ animationDuration: '15s' }} />

          {/* Center Glowing Hub */}
          <div className={`w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 ${
            gpsStatus === 'confirmed'
              ? 'bg-[#00E575] text-slate-950 shadow-[#00E575]/50 scale-110'
              : gpsStatus === 'denied'
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-rose-500/30'
              : 'bg-[#021c25] border-2 border-[#00E575] text-[#00E575] shadow-[#00E575]/30'
          }`}>
            {gpsStatus === 'confirmed' ? (
              <CheckCircle2 className="w-10 h-10 animate-bounce" />
            ) : gpsStatus === 'checking' ? (
              <Radio className="w-9 h-9 animate-pulse" />
            ) : gpsStatus === 'denied' ? (
              <AlertTriangle className="w-9 h-9" />
            ) : (
              <Crosshair className="w-9 h-9" />
            )}
          </div>
        </div>

        {/* Live GPS State Card */}
        <div className="bg-[#042029]/85 border border-[#0e4858]/90 rounded-3xl p-4.5 shadow-2xl backdrop-blur-xl space-y-3 max-w-sm mx-auto">
          {gpsStatus === 'confirmed' && confirmedCoords && (
            <div className="p-3.5 bg-[#00E575]/15 border border-[#00E575]/40 rounded-2xl flex items-start space-x-3 text-left">
              <CheckCircle2 className="w-5 h-5 text-[#00E575] shrink-0 mt-0.5" />
              <div className="space-y-0.5 flex-1 min-w-0">
                <div className="text-xs font-black text-[#00E575]">GPS-ka Waa La Xaqiijiyey! (Location Confirmed)</div>
                <div className="text-xs text-white font-medium truncate">{confirmedCoords.name}</div>
                <div className="text-[10px] text-slate-400 font-mono">
                  Lat: {confirmedCoords.lat.toFixed(5)}, Lng: {confirmedCoords.lng.toFixed(5)}
                </div>
              </div>
            </div>
          )}

          {gpsStatus === 'denied' && (
            <div className="p-3.5 bg-rose-500/15 border border-rose-500/40 rounded-2xl flex items-start space-x-3 text-left">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="space-y-1 flex-1">
                <div className="text-xs font-black text-rose-300">Location-ku Ma Shidna (GPS Turned Off)</div>
                <div className="text-xs text-rose-200/90 leading-relaxed">
                  {errorMessage || 'Fadlan shid GPS-ka taleefankaaga ama ogolow location permission.'}
                </div>
              </div>
            </div>
          )}

          {gpsStatus === 'checking' && (
            <div className="p-3.5 bg-[#00E575]/10 border border-[#00E575]/30 rounded-2xl flex items-center space-x-3 text-left">
              <RefreshCw className="w-5 h-5 text-[#00E575] animate-spin shrink-0" />
              <div className="text-xs text-slate-200">
                Baadhaya satellite-ka GPS-ka taleefankaaga Hargeisa...
              </div>
            </div>
          )}

          {gpsStatus === 'idle' && (
            <div className="p-3 bg-slate-800/60 border border-slate-700/60 rounded-2xl text-xs text-slate-300 text-left flex items-center space-x-2.5">
              <Radio className="w-4 h-4 text-[#00E575] shrink-0" />
              <span>Guji badhanka hoose si aad u xaqiijiso GPS-ka taleefankaaga.</span>
            </div>
          )}

          {/* Primary Action Button */}
          <button
            type="button"
            onClick={handleCheckGps}
            disabled={gpsStatus === 'checking'}
            className="w-full py-3.5 px-4 bg-[#00E575] hover:bg-[#00c966] text-slate-950 font-black text-sm rounded-2xl transition-all shadow-lg shadow-[#00E575]/30 flex items-center justify-center space-x-2 active:scale-95 disabled:opacity-50"
          >
            {gpsStatus === 'checking' ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Xaqiijinaya GPS-ka...</span>
              </>
            ) : (
              <>
                <Navigation className="w-4 h-4" />
                <span>Shid & Xaqiiji Location-ka (Turn On GPS)</span>
              </>
            )}
          </button>

          {/* Manual District Selection Fallback */}
          <button
            type="button"
            onClick={() => setShowManualDistrictSelect(!showManualDistrictSelect)}
            className="w-full text-xs text-slate-400 hover:text-white transition-colors py-1 underline flex items-center justify-center space-x-1"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>
              {showManualDistrictSelect
                ? 'Qari Liiska Xaafadaha (Hide Districts)'
                : 'Ama ka dooro Degmooyinka Hargeisa (Select District)'}
            </span>
          </button>

          {/* District list drop-down */}
          {showManualDistrictSelect && (
            <div className="pt-2 border-t border-slate-800/80 space-y-1.5 max-h-44 overflow-y-auto pr-1">
              <div className="text-[11px] font-bold text-[#00E575] text-left">
                Dooro Xaafaddaada / Goobtaada Hargeisa:
              </div>
              {HARGEISA_PLACES.filter((p) => p.category === 'District & Neighborhood' || p.category.includes('District') || p.category.includes('Xaafad')).map((place) => (
                <button
                  key={place.id}
                  type="button"
                  onClick={() => handleSelectDistrict(place)}
                  className="w-full p-2 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800 flex items-center justify-between text-left transition-colors"
                >
                  <div className="truncate pr-2">
                    <div className="text-xs font-bold text-white truncate">{place.name}</div>
                    <div className="text-[10px] text-slate-400 truncate">{place.address}</div>
                  </div>
                  <div className="text-[10px] font-black text-[#00E575] shrink-0 bg-[#00E575]/10 px-2 py-0.5 rounded-lg">
                    Xaqiiji
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center text-[10px] text-slate-400 z-10 pt-2 flex items-center justify-center space-x-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-[#00E575]" />
        <span>Xogtaada Location-ka waxaa lagu xafidaa si sir ah (Cloud Firestore & GPS Geofence)</span>
      </div>
    </div>
  );
};
