import React, { useState } from 'react';
import {
  MapPin,
  Navigation,
  Crosshair,
  Search,
  Check,
  AlertCircle,
  Building,
  Plane,
  Hotel,
  ShoppingBag,
  Sparkles,
  X,
  Compass,
  ArrowRight,
} from 'lucide-react';
import { useRide } from '../../context/RideContext';
import { HARGEISA_PLACES, HargeisaPlace, searchHargeisaPlaces } from '../../data/hargeisaPlaces';
import { SomalilandFlag } from '../Common/SomalilandFlag';
import { LocationNode } from '../../types';
import { resolveHargeisaPlaceCoordinates } from '../../utils/hargeisaPlaceMatcher';

interface LocationSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSelected?: (loc: LocationNode) => void;
}

export const LocationSetupModal: React.FC<LocationSetupModalProps> = ({
  isOpen,
  onClose,
  onLocationSelected,
}) => {
  const {
    pickupLocation,
    setPickupLocation,
    detectUserRealLocation,
    isDetectingLocation,
    realUserLocation,
    language,
  } = useRide();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'gps' | 'landmarks'>('gps');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [googlePlaces, setGooglePlaces] = useState<LocationNode[]>([]);
  const [isSearchingGoogle, setIsSearchingGoogle] = useState(false);
  const abortRef = React.useRef<AbortController | null>(null);

  // Live Google autocomplete for LocationSetupModal
  React.useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setGooglePlaces([]);
      setIsSearchingGoogle(false);
      return;
    }

    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    setIsSearchingGoogle(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/places/autocomplete?input=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.predictions) && data.predictions.length > 0) {
            const formatted: LocationNode[] = data.predictions.map((p: any) => {
              const resolved = resolveHargeisaPlaceCoordinates(p);
              return {
                id: p.id || resolved.id,
                name: p.name || resolved.name,
                address: p.address || resolved.address,
                lat: typeof p.lat === 'number' && p.lat >= 9.35 && p.lat <= 9.75 ? p.lat : resolved.lat,
                lng: typeof p.lng === 'number' && p.lng >= 43.85 && p.lng <= 44.25 ? p.lng : resolved.lng,
                category: p.category || resolved.category,
              };
            });
            setGooglePlaces(formatted);
          } else {
            setGooglePlaces([]);
          }
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setGooglePlaces([]);
        }
      } finally {
        setIsSearchingGoogle(false);
      }
    }, 150);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery]);

  if (!isOpen) return null;

  const handleUseGps = async () => {
    setStatusMessage('Searching satellite GPS coordinates in Hargeisa...');
    const detected = await detectUserRealLocation();
    if (detected) {
      setStatusMessage(`📍 Live GPS Locked: ${detected.name}`);
      if (onLocationSelected) {
        onLocationSelected(detected);
      }
      try {
        localStorage.setItem('wadaage_location_setup_done', 'true');
      } catch {}
      setTimeout(() => {
        onClose();
      }, 1000);
    } else {
      setStatusMessage(
        '⚠️ Browser GPS prompt dismissed or timeout. You can select your Hargeisa district below.'
      );
    }
  };

  const handleSelectPlace = (place: HargeisaPlace | LocationNode) => {
    const locNode: LocationNode = {
      id: place.id,
      name: place.name,
      address: place.address,
      lat: place.lat,
      lng: place.lng,
      zone: (place as any).district || (place as any).zone || 'Hargeisa Central',
    };
    setPickupLocation(locNode);
    if (onLocationSelected) {
      onLocationSelected(locNode);
    }
    try {
      localStorage.setItem('wadaage_location_setup_done', 'true');
    } catch {}
    onClose();
  };

  const filteredPlaces = searchHargeisaPlaces(searchQuery);

  // Combined places (Hargeisa local + Google Suggestions)
  const combinedPlaces = React.useMemo(() => {
    const seen = new Set<string>();
    const list: (LocationNode & { isGoogle?: boolean })[] = [];

    for (const r of filteredPlaces.slice(0, 15)) {
      seen.add(r.name.toLowerCase().trim());
      list.push(r);
    }

    for (const g of googlePlaces) {
      const key = g.name.toLowerCase().trim();
      if (!seen.has(key)) {
        seen.add(key);
        list.push({ ...g, isGoogle: true });
      }
    }

    return list;
  }, [filteredPlaces, googlePlaces]);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 w-full sm:max-w-md rounded-t-[32px] sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[85vh] text-slate-100">

        {/* Modal Top Header */}
        <div className="relative p-5 pb-3 border-b border-slate-800/80 bg-gradient-to-b from-slate-800/50 to-transparent">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
                <Navigation className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <h2 className="text-base font-black text-white font-serif tracking-tight">
                    {language === 'so' ? 'Daar Meeshaada (Setup Location)' : 'Setup Your Real Location'}
                  </h2>
                  <span className="bg-emerald-500 text-slate-950 text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                    GPS
                  </span>
                </div>
                <p className="text-xs text-slate-400 flex items-center space-x-1 mt-0.5 font-medium">
                  <SomalilandFlag className="w-3.5 h-2.5 rounded-xs inline" />
                  <span>
                    {language === 'so'
                      ? 'Dooro meesha aad joogto ee Hargeysa'
                      : 'Detect your live pickup location in Hargeisa'}
                  </span>
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              aria-label="Close location setup"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tab Selector */}
          <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 mt-4 space-x-1">
            <button
              onClick={() => setActiveTab('gps')}
              className={`flex-1 py-2 rounded-xl text-xs font-black transition flex items-center justify-center space-x-1.5 ${
                activeTab === 'gps'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>{language === 'so' ? 'Live GPS Hadda' : 'Live GPS Detect'}</span>
            </button>

            <button
              onClick={() => setActiveTab('landmarks')}
              className={`flex-1 py-2 rounded-xl text-xs font-black transition flex items-center justify-center space-x-1.5 ${
                activeTab === 'landmarks'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>{language === 'so' ? 'Dooro Xaafad/Magaalo' : 'Choose Landmark'}</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">

          {activeTab === 'gps' && (
            <div className="space-y-4 py-2">

              {/* Big GPS Action Button */}
              <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl text-center space-y-3 shadow-inner">
                <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
                  <div className="w-14 h-14 rounded-full bg-emerald-500/30 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 shadow-lg">
                    <Crosshair className="w-7 h-7" />
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-black text-white">
                    {language === 'so' ? 'Fur oo Daar GPS-ka Taleefanka' : 'Enable Real GPS Coordinates'}
                  </h3>
                  <p className="text-xs text-slate-400 px-4 leading-relaxed">
                    {language === 'so'
                      ? 'Wadaage waxay isticmaashaa GPS toos ah si darawalku kuugu yimaado meesha saxda ah ee aad taagan tahay.'
                      : 'Allows Wadaage drivers to find your exact live coordinates and pinpoint your pickup spot.'}
                  </p>
                </div>

                <button
                  onClick={handleUseGps}
                  disabled={isDetectingLocation}
                  className="w-full py-3.5 px-4 bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider flex items-center justify-center space-x-2 shadow-lg shadow-emerald-500/20 transition"
                >
                  {isDetectingLocation ? (
                    <>
                      <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>{language === 'so' ? 'Raadinaya GPS...' : 'Acquiring GPS Position...'}</span>
                    </>
                  ) : (
                    <>
                      <Navigation className="w-4 h-4" />
                      <span>{language === 'so' ? 'Isticmaal Meeshayda Hadda (Live GPS)' : 'Use My Current Live GPS'}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Status or Success Notification */}
              {statusMessage && (
                <div className="p-3 bg-slate-800/80 border border-slate-700 rounded-xl text-xs font-semibold text-emerald-400 flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>{statusMessage}</span>
                </div>
              )}

              {/* Currently Selected Location Pill */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      Current Set Location
                    </div>
                    <div className="text-xs font-bold text-white truncate max-w-[220px]">
                      {pickupLocation?.name || 'Hargeisa City Center'}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-black border border-emerald-500/30">
                  Active
                </span>
              </div>
            </div>
          )}

          {activeTab === 'landmarks' && (
            <div className="space-y-3">
              {/* Landmark Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type Hargeisa place name (Airport, Dahabshiil, Jigjiga, Mansoor...)"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-2.5 pl-10 pr-24 text-xs font-medium text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
                />
                {isSearchingGoogle && (
                  <span className="absolute right-3 top-3 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30 animate-pulse">
                    Google...
                  </span>
                )}
              </div>

              {/* Popular Quick Landmark List */}
              <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
                {combinedPlaces.slice(0, 15).map((place) => {
                  const isSelected = pickupLocation.id === place.id;
                  return (
                    <button
                      key={place.id}
                      onClick={() => handleSelectPlace(place)}
                      className={`w-full text-left p-2.5 rounded-xl border transition flex items-center justify-between ${
                        isSelected
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-white'
                          : 'bg-slate-950/60 hover:bg-slate-800 border-slate-800/80 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-emerald-400 shrink-0">
                          {place.category === 'Transit' || place.name.toLowerCase().includes('airport') ? (
                            <Plane className="w-4 h-4" />
                          ) : place.category?.toLowerCase().includes('hotel') ? (
                            <Hotel className="w-4 h-4" />
                          ) : place.category?.toLowerCase().includes('market') || place.category?.toLowerCase().includes('mall') ? (
                            <ShoppingBag className="w-4 h-4" />
                          ) : (
                            <Building className="w-4 h-4" />
                          )}
                        </div>
                        <div className="truncate">
                          <div className="flex items-center space-x-1.5">
                            <span className="text-xs font-bold text-white truncate">{place.name}</span>
                            {place.isGoogle && (
                              <span className="text-[8px] bg-blue-500/20 text-blue-400 font-bold px-1 rounded border border-blue-500/30 shrink-0">
                                Google Live
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate">{place.address}</div>
                        </div>
                      </div>

                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3" />
                        </div>
                      ) : (
                        <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="p-3 bg-slate-950/90 border-t border-slate-800/80 text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition"
          >
            {language === 'so' ? 'Xidho (Done)' : 'Confirm & Continue'}
          </button>
        </div>
      </div>
    </div>
  );
};
