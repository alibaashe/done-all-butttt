import React, { useState, useEffect } from 'react';
import { MapPin, Navigation, ShieldCheck, AlertCircle, CheckCircle2, Crosshair, Compass } from 'lucide-react';
import { useRide } from '../../context/RideContext';
import { SomalilandFlag } from './SomalilandFlag';

interface LocationPermissionPromptProps {
  onLocationResolved?: (coords: { lat: number; lng: number; name: string; address: string }) => void;
  updatePickupLocation?: boolean;
}

export const LocationPermissionPrompt: React.FC<LocationPermissionPromptProps> = ({
  onLocationResolved,
  updatePickupLocation = true,
}) => {
  const { setPickupLocation, language } = useRide();
  const [showPrompt, setShowPrompt] = useState<boolean>(false);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'unsupported'>('prompt');
  const [statusMessage, setStatusMessage] = useState<string>('');

  useEffect(() => {
    // Check if user already granted or dismissed in localStorage (asks only ONCE)
    const hasGrantedLocally = localStorage.getItem('wadaage_gps_permission_granted') === 'true';
    const hasSeenPrompt = localStorage.getItem('wadaage_gps_prompt_shown') === 'true';

    if (hasGrantedLocally) {
      setPermissionState('granted');
      fetchLiveGPSLocation(true);
      return;
    }

    if ('geolocation' in navigator) {
      if ('permissions' in navigator) {
        navigator.permissions
          .query({ name: 'geolocation' as PermissionName })
          .then((res) => {
            if (res.state === 'granted') {
              setPermissionState('granted');
              localStorage.setItem('wadaage_gps_permission_granted', 'true');
              localStorage.setItem('wadaage_gps_prompt_shown', 'true');
              fetchLiveGPSLocation(true);
            } else if (res.state === 'prompt') {
              setPermissionState('prompt');
              if (!hasSeenPrompt) {
                setShowPrompt(true);
              } else {
                fetchLiveGPSLocation(true);
              }
            } else if (res.state === 'denied') {
              setPermissionState('denied');
            }
          })
          .catch(() => {
            if (!hasSeenPrompt) setShowPrompt(true);
            else fetchLiveGPSLocation(true);
          });
      } else {
        if (!hasSeenPrompt) setShowPrompt(true);
        else fetchLiveGPSLocation(true);
      }
    } else {
      setPermissionState('unsupported');
    }
  }, []);

  const fetchLiveGPSLocation = (silent: boolean = false) => {
    if (!('geolocation' in navigator)) {
      if (!silent) {
        setStatusMessage(
          language === 'so'
            ? 'Aaladdaadu ma taageerto GPS'
            : 'Geolocation is not supported on this device'
        );
      }
      return;
    }

    setIsLocating(true);
    if (!silent) {
      setStatusMessage(
        language === 'so'
          ? 'Waxaa la raadinayaa goobtaada dhabta ah ee GPS...'
          : 'Detecting your high-precision GPS coordinates...'
      );
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        setPermissionState('granted');
        setShowPrompt(false);
        localStorage.setItem('wadaage_gps_permission_granted', 'true');
        localStorage.setItem('wadaage_gps_prompt_shown', 'true');

        const { latitude, longitude, accuracy } = position.coords;

        // Approximate reverse geocode to Somaliland/Hargeisa location
        const resolvedName =
          accuracy < 50
            ? language === 'so'
              ? 'Goobtaada Dhabta ah (GPS High Precision)'
              : 'Your Current Location (High Precision GPS)'
            : language === 'so'
            ? 'Goobtaada Dhow (GPS Point)'
            : 'Your Current Location (GPS)';

        const resolvedAddress = `${latitude.toFixed(5)}° N, ${longitude.toFixed(5)}° E (±${Math.round(accuracy)}m)`;

        const customLoc = {
          id: `gps_live_${Date.now()}`,
          name: resolvedName,
          address: resolvedAddress,
          lat: latitude,
          lng: longitude,
        };

        if (updatePickupLocation) {
          setTimeout(() => {
            setPickupLocation(customLoc);
          }, 0);
        }

        if (onLocationResolved) {
          setTimeout(() => {
            onLocationResolved(customLoc);
          }, 0);
        }
      },
      (error) => {
        setIsLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          setPermissionState('denied');
          setStatusMessage(
            language === 'so'
              ? 'Ogolaanshaha goobta waa la diiday. Fadlan ka fur Settings-ka browserkaaga ama phone-kaaga.'
              : 'Location permission was denied. Please allow location in your browser or phone settings.'
          );
        } else {
          setStatusMessage(
            language === 'so'
              ? 'Waqti dheer ayaa ku baxay raadinta GPS. Waxaa la isticmaalayaa xarunta Hargeysa.'
              : 'GPS acquisition timed out. Defaulting to Hargeisa City Center.'
          );
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      }
    );
  };

  const handleAllowClick = () => {
    fetchLiveGPSLocation(false);
  };

  const handleSkipClick = () => {
    setShowPrompt(false);
    sessionStorage.setItem('wadaage_gps_prompt_shown', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-[#03232e] border-2 border-[#00E575]/40 rounded-3xl p-5 text-white shadow-2xl shadow-[#00E575]/20 space-y-4">
        {/* Header Icon */}
        <div className="flex items-center justify-between">
          <div className="w-12 h-12 rounded-2xl bg-[#021820] border border-[#00E575]/50 flex items-center justify-center text-[#00E575] shadow-lg shadow-[#00E575]/20">
            <Crosshair className="w-6 h-6 animate-pulse" />
          </div>
          <div className="flex items-center space-x-1.5 bg-[#021820] px-3 py-1 rounded-full border border-slate-700/60 text-xs text-slate-300">
            <SomalilandFlag className="w-4 h-2.5 rounded-xs" />
            <span className="font-bold">Hargeisa GPS</span>
          </div>
        </div>

        {/* Title & Description */}
        <div className="space-y-1.5">
          <h3 className="text-lg font-black text-white tracking-tight">
            {language === 'so' ? 'U Ogolow Wadaage Goobtaada (GPS)' : 'Enable Live GPS Location'}
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            {language === 'so'
              ? 'Wadaage waxay u baahan tahay goobtaada dhabta ah ee GPS si darawaladu kuugu yimaadaan si sax ah oo degdeg ah meel kasta oo aad kaga sugan tahay Somaliland.'
              : 'Wadaage requires your real-time phone GPS location to find nearby available drivers, set accurate pickup coordinates, and navigate directly to you.'}
          </p>
        </div>

        {/* Status Alert if error */}
        {statusMessage && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-start space-x-2 text-xs text-amber-200">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Feature List */}
        <div className="space-y-2 bg-[#021820] p-3 rounded-2xl border border-[#00E575]/20 text-xs">
          <div className="flex items-center space-x-2 text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-[#00E575] shrink-0" />
            <span>{language === 'so' ? 'Raadinta darawalka kuugu dhow' : 'Instant nearby driver matching'}</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-[#00E575] shrink-0" />
            <span>{language === 'so' ? 'Qiimaha safarka oo sax ah (SLSH & USD)' : 'Precise fare calculation in SLSH & USD'}</span>
          </div>
          <div className="flex items-center space-x-2 text-slate-300">
            <ShieldCheck className="w-4 h-4 text-[#00E575] shrink-0" />
            <span>{language === 'so' ? 'Ilaalin iyo xog sir ah 100%' : '100% encrypted & private positioning'}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={handleAllowClick}
            disabled={isLocating}
            className="w-full py-3.5 bg-[#00E575] hover:bg-[#00c966] active:scale-[0.98] text-slate-950 font-black rounded-2xl text-sm flex items-center justify-center space-x-2 shadow-lg shadow-[#00E575]/25 transition disabled:opacity-70"
          >
            {isLocating ? (
              <>
                <Navigation className="w-4 h-4 animate-spin text-slate-950" />
                <span>{language === 'so' ? 'Goobtaada ayaa la xaqiijinayaa...' : 'Locating your phone...'}</span>
              </>
            ) : (
              <>
                <MapPin className="w-4 h-4 text-slate-950" />
                <span>{language === 'so' ? 'Fur Goobtaada (Allow GPS)' : 'Allow Accurate Location (GPS)'}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleSkipClick}
            className="w-full py-2.5 bg-transparent hover:bg-slate-800/40 text-slate-400 hover:text-white font-bold rounded-2xl text-xs transition text-center"
          >
            {language === 'so' ? 'Isticmaal Xarunta Hargeysa (Default)' : 'Use Hargeisa City Center (Default)'}
          </button>
        </div>
      </div>
    </div>
  );
};
