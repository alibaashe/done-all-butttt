import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  Map,
  Home,
  Briefcase,
  Clock,
  MapPin,
  X,
  ChevronRight,
  Sparkles,
  Plane,
  Building,
  GraduationCap,
  ShoppingBag,
  Hotel,
  Activity,
  ArrowRight,
  Utensils,
  Landmark,
  Navigation,
  ShoppingCart,
  Fuel,
  Moon,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LocationNode } from '../../types';
import { HARGEISA_PLACES, HargeisaPlace, searchHargeisaPlaces } from '../../data/hargeisaPlaces';
import { resolveHargeisaPlaceCoordinates } from '../../utils/hargeisaPlaceMatcher';
import { getApiUrl } from '../../services/apiConfig';

export interface WadaageSearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDestination: (location: LocationNode) => void;
  onOpenMapPicker?: () => void;
  currentPickup?: LocationNode;
}

export interface RecentPlaceItem {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  type: 'home' | 'work' | 'recent' | 'transit';
  icon: 'Home' | 'Briefcase' | 'Clock' | 'Plane';
  badge: string;
  distanceKm?: number;
}

const DEFAULT_RECENT_PLACES: RecentPlaceItem[] = [
  {
    id: 'recent_home',
    name: 'Home (Jigjiga Yar)',
    address: 'Jigjiga Yar Commercial Strip, Ibrahim Koodbuur District, Hargeisa',
    lat: 9.5720,
    lng: 44.0750,
    type: 'home',
    icon: 'Home',
    badge: 'Home',
    distanceKm: 2.1,
  },
  {
    id: 'recent_work',
    name: 'Maan-soor Hotel & Conference Center',
    address: 'Jigjiga Yar Road, Ibrahim Koodbuur District, Hargeisa',
    lat: 9.5755,
    lng: 44.0722,
    type: 'work',
    icon: 'Briefcase',
    badge: 'Work',
    distanceKm: 3.4,
  },
  {
    id: 'recent_airport',
    name: 'Egal International Airport (HGA)',
    address: 'Airport Road, Ahmed Dhagax District, Hargeisa',
    lat: 9.5181,
    lng: 44.0888,
    type: 'transit',
    icon: 'Clock',
    badge: 'Recent',
    distanceKm: 6.8,
  },
];

export const WadaageSearchOverlay: React.FC<WadaageSearchOverlayProps> = ({
  isOpen,
  onClose,
  onSelectDestination,
  onOpenMapPicker,
  currentPickup,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [googleResults, setGoogleResults] = useState<LocationNode[]>([]);
  const [isSearchingGoogle, setIsSearchingGoogle] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Focus search input when overlay opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 250);
      return () => clearTimeout(timer);
    } else {
      setSearchQuery('');
      setGoogleResults([]);
    }
  }, [isOpen]);

  // Live Place suggestions via API + local fallback
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      setGoogleResults([]);
      setIsSearchingGoogle(false);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsSearchingGoogle(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          getApiUrl(`/api/places/autocomplete?input=${encodeURIComponent(trimmed)}`),
          { signal: controller.signal }
        );
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.predictions) && data.predictions.length > 0) {
            const formatted: LocationNode[] = data.predictions.map((p: any) =>
              resolveHargeisaPlaceCoordinates({
                id: p.id,
                name: p.name || p.address?.split(',')[0] || trimmed,
                address: p.address || `${trimmed}, Hargeisa, Somaliland`,
                lat: typeof p.lat === 'number' ? p.lat : undefined,
                lng: typeof p.lng === 'number' ? p.lng : undefined,
                category: p.category || 'Google Map Location',
              })
            );
            setGoogleResults(formatted);
          } else {
            setGoogleResults([]);
          }
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setGoogleResults([]);
        }
      } finally {
        setIsSearchingGoogle(false);
      }
    }, 120);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery]);

  // Filter local Hargeisa database
  const filteredHargeisaPlaces = useMemo(() => {
    return searchHargeisaPlaces(
      searchQuery,
      selectedCategory !== 'All' ? selectedCategory : undefined
    ).slice(0, 40);
  }, [searchQuery, selectedCategory]);

  const handleSelectPlace = (place: LocationNode) => {
    onSelectDestination(place);
    onClose();
  };

  const categories = [
    { id: 'All', label: 'Dhammaan (All)', icon: Sparkles },
    { id: 'Hospital', label: 'Cusbitaallada (Hospitals)', icon: Activity },
    { id: 'Education', label: 'Dugsiyada & Jaamacadaha (Schools)', icon: GraduationCap },
    { id: 'Mosque', label: 'Masaajidda (Mosques)', icon: Moon },
    { id: 'Market', label: 'Suuqyada & Xarumaha (Markets)', icon: ShoppingBag },
    { id: 'Fuel', label: 'Kaalmaha Shidaalka (Fuel)', icon: Fuel },
    { id: 'Transit', label: 'Gadiidka & Istaannada (Transit)', icon: Plane },
    { id: 'Hotel', label: 'Huteellada (Hotels)', icon: Hotel },
    { id: 'Bank', label: 'Bangiyada & Xawaaladaha (Banks)', icon: Landmark },
    { id: 'Government', label: 'Hay\'adaha Dowladda (Civic)', icon: Building },
    { id: 'District', label: 'Xaafadaha (Districts)', icon: Home },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end pointer-events-auto">
          {/* Glassmorphic Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/50 backdrop-blur-sm"
          />

          {/* Super App Bottom Sheet Container */}
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300, mass: 0.9 }}
            className="relative w-full max-w-lg mx-auto bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl border-t border-slate-200/80 dark:border-slate-800 max-h-[90vh] flex flex-col overflow-hidden pb-safe"
          >
            {/* Top Drag Handle */}
            <div className="w-full pt-3 pb-1 flex justify-center cursor-pointer" onClick={onClose}>
              <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full hover:bg-slate-400 transition" />
            </div>

            {/* Header Title & Close Button */}
            <div className="px-5 py-2 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-black tracking-wider uppercase text-emerald-600 dark:text-emerald-400">
                  Wadaage Super App
                </span>
                <h2 className="text-xl font-black text-slate-900 dark:text-white font-sans">
                  Where to?
                </h2>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition"
                aria-label="Close search"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Main 'Where to?' Search Bar */}
            <div className="px-5 py-2">
              <div className="relative flex items-center bg-gray-100 dark:bg-slate-800/90 rounded-2xl p-1.5 border border-slate-200/80 dark:border-slate-700/80 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:bg-white dark:focus-within:bg-slate-900 transition-all shadow-inner">
                {/* Search Icon */}
                <div className="pl-3 pr-2 text-slate-400 dark:text-slate-500">
                  <Search className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>

                {/* Input */}
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Where to? (e.g. Airport, Jigjiga Yar, Mansoor)"
                  className="w-full bg-transparent text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 font-semibold text-sm focus:outline-none py-2 font-sans"
                />

                {/* Clear Input Button */}
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setGoogleResults([]);
                      inputRef.current?.focus();
                    }}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                {/* Map Picker Icon Button */}
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenMapPicker) {
                      onOpenMapPicker();
                    }
                    onClose();
                  }}
                  className="ml-1 px-3 py-2 bg-emerald-500/10 dark:bg-emerald-500/20 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-xl font-bold text-xs flex items-center space-x-1.5 transition active:scale-95 border border-emerald-500/20 shrink-0"
                  title="Choose location on map"
                >
                  <Map className="w-4 h-4" />
                  <span className="hidden sm:inline">Set on Map</span>
                </button>
              </div>
            </div>

            {/* Quick Category Chips */}
            <div className="px-5 py-2 flex items-center space-x-2 overflow-x-auto no-scrollbar shrink-0">
              {categories.map((cat) => {
                const IconComponent = cat.icon;
                const isSelected = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center space-x-1.5 transition whitespace-nowrap shrink-0 ${
                      isSelected
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    <IconComponent className="w-3.5 h-3.5" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Scrollable Content: Recent Places & Search Results */}
            <div className="flex-1 overflow-y-auto px-5 py-2 space-y-4">
              {/* If User Is Typing: Show Dynamic Results */}
              {searchQuery.trim().length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    <span>Search Results</span>
                    {isSearchingGoogle && (
                      <span className="flex items-center space-x-1 text-emerald-600 dark:text-emerald-400 font-medium">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        <span>Searching...</span>
                      </span>
                    )}
                  </div>

                  {/* Google Predictions */}
                  {googleResults.map((place, idx) => (
                    <button
                      key={`google_${place.id || idx}`}
                      onClick={() => handleSelectPlace(place)}
                      className="w-full text-left p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between transition group active:scale-[0.99]"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-sm text-slate-900 dark:text-white truncate font-sans">
                            {place.name}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate font-sans">
                            {place.address}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 shrink-0 ml-2" />
                    </button>
                  ))}

                  {/* Filtered Local Matches */}
                  {filteredHargeisaPlaces.map((place) => (
                    <button
                      key={`local_${place.id}`}
                      onClick={() => handleSelectPlace(place)}
                      className="w-full text-left p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/70 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between transition group active:scale-[0.99]"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                          <Building className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <h4 className="font-extrabold text-sm text-slate-900 dark:text-white truncate font-sans">
                              {place.name}
                            </h4>
                            {place.subCategory && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                {place.subCategory}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate font-sans">
                            {place.address}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 shrink-0 ml-2" />
                    </button>
                  ))}

                  {googleResults.length === 0 && filteredHargeisaPlaces.length === 0 && !isSearchingGoogle && (
                    <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
                      <MapPin className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        No matching locations found in Hargeisa
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Try selecting on map or search for landmarks like "Mansoor", "Airport", or "Downtown"
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                /* Default View: 3 Recent Places List */
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                      Recent & Saved Places
                    </span>
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                      Hargeisa, Somaliland
                    </span>
                  </div>

                  {/* 3 High-Contrast Recent Places Cards */}
                  <div className="space-y-2.5">
                    {DEFAULT_RECENT_PLACES.map((item) => {
                      const Icon =
                        item.icon === 'Home'
                          ? Home
                          : item.icon === 'Briefcase'
                          ? Briefcase
                          : Clock;

                      const iconBg =
                        item.type === 'home'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                          : item.type === 'work'
                          ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400';

                      return (
                        <button
                          key={item.id}
                          onClick={() =>
                            handleSelectPlace({
                              id: item.id,
                              name: item.name,
                              address: item.address,
                              lat: item.lat,
                              lng: item.lng,
                            })
                          }
                          className="w-full text-left p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between transition-all group active:scale-[0.99] shadow-xs"
                        >
                          <div className="flex items-center space-x-3.5 min-w-0">
                            {/* Icon Container */}
                            <div
                              className={`w-11 h-11 rounded-2xl ${iconBg} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform shadow-xs`}
                            >
                              <Icon className="w-5 h-5 stroke-[2.2]" />
                            </div>

                            {/* Typography Details (High-Contrast Inter / Roboto style) */}
                            <div className="min-w-0">
                              <div className="flex items-center space-x-2">
                                <h4 className="font-extrabold text-sm text-slate-900 dark:text-white truncate font-sans tracking-tight">
                                  {item.name}
                                </h4>
                                <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                  {item.badge}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 dark:text-slate-400 truncate font-sans font-medium mt-0.5">
                                {item.address}
                              </p>
                            </div>
                          </div>

                          {/* Right Arrow / Distance */}
                          <div className="flex items-center space-x-2 shrink-0 ml-2">
                            {item.distanceKm && (
                              <span className="text-xs font-mono font-bold text-slate-400">
                                {item.distanceKm} km
                              </span>
                            )}
                            <div className="w-7 h-7 rounded-full bg-white dark:bg-slate-700 flex items-center justify-center text-slate-400 group-hover:text-emerald-500 shadow-xs transition">
                              <ChevronRight className="w-4 h-4" />
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Popular Hubs in Somaliland */}
                  <div className="pt-2">
                    <span className="text-xs font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">
                      Popular Hubs in Hargeisa
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {HARGEISA_PLACES.filter((p) => p.popular)
                        .slice(0, 4)
                        .map((hub) => (
                          <button
                            key={hub.id}
                            onClick={() => handleSelectPlace(hub)}
                            className="p-3 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-left hover:border-emerald-500 dark:hover:border-emerald-500 transition group active:scale-95 shadow-xs"
                          >
                            <div className="flex items-center space-x-2 mb-1">
                              <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                              <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {hub.name}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                              {hub.district || 'Hargeisa'}
                            </span>
                          </button>
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Current Pickup Location Context */}
            {currentPickup && (
              <div className="px-5 py-3 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-400 truncate">
                  <div className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                  <span className="font-semibold truncate">
                    Pickup: <strong className="text-slate-900 dark:text-white">{currentPickup.name}</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenMapPicker) onOpenMapPicker();
                    onClose();
                  }}
                  className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline shrink-0 ml-2"
                >
                  Change
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
