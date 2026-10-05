import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Building2,
  Bus,
  Check,
  ChevronDown,
  Coffee,
  Compass,
  Fuel,
  GraduationCap,
  HeartPulse,
  Hotel,
  Landmark,
  MapPin,
  Moon,
  Navigation,
  Plane,
  Search,
  ShoppingBag,
  Sparkles,
  Store,
  Utensils,
  Wrench,
  X,
  Globe,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { HARGEISA_PLACES, HargeisaPlace } from '../../data/hargeisaPlaces';
import {
  searchPlacesFast,
  warmPlaceSearchIndex,
  getPopularPlaces,
  getTotalPlaceCount,
} from '../../utils/placeSearchIndex';
import { LocationNode } from '../../types';
import { getApiUrl } from '../../services/apiConfig';
import { resolveHargeisaPlaceCoordinates } from '../../utils/hargeisaPlaceMatcher';

interface SmartLocationAutocompleteProps {
  id?: string;
  label: string;
  placeholder?: string;
  pointType: 'pickup' | 'dropoff';
  selectedLocation: LocationNode;
  onSelectLocation: (location: LocationNode) => void;
  onOpenMapPin?: () => void;
  isMapPinning?: boolean;
  showGpsButton?: boolean;
  onGpsClick?: () => void;
  isGpsLocating?: boolean;
}

const CATEGORY_TABS = [
  'All',
  'Hospitals & Healthcare',
  'Schools & Universities',
  'Mosques (Masaajidda)',
  'Markets & Malls',
  'Fuel Stations (Kaalmaha)',
  'Transport & Terminals',
  'Hotels & Hospitality',
  'Banks & Financial',
  'Government & Civic',
  'Xaafadaha (Districts)',
];

export const SmartLocationAutocomplete: React.FC<SmartLocationAutocompleteProps> = ({
  id = 'location-search-input',
  label,
  placeholder = 'Type place name or address (e.g. Mansoor, Airport, Dahabshiil...)',
  pointType,
  selectedLocation,
  onSelectLocation,
  onOpenMapPin,
  isMapPinning = false,
  showGpsButton = false,
  onGpsClick,
  isGpsLocating = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(selectedLocation?.name || '');
  const [activeCategory, setActiveCategory] = useState('All');
  const [googleResults, setGoogleResults] = useState<LocationNode[]>([]);
  const [isSearchingGoogle, setIsSearchingGoogle] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  // Debounced copy of the query. Filtering 10k places on every raw keystroke is
  // what made this input feel slow; the list only needs to settle once typing pauses.
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync input value if selectedLocation changes externally
  useEffect(() => {
    if (selectedLocation?.name) {
      setQuery(selectedLocation.name);
    }
  }, [selectedLocation?.name, selectedLocation?.id]);

  // Warm the place index while the browser is idle so the very first keystroke
  // is already fast (building it costs ~50 ms for ~10.6k places).
  useEffect(() => {
    let cancelled = false;
    const warm = () => {
      if (cancelled) return;
      // Warms the shared search index and the data-module prefix/haystack cache.
      // Slices itself across idle callbacks, so it never blocks the UI.
      warmPlaceSearchIndex();
    };
    try {
      const ric = (window as any).requestIdleCallback;
      if (typeof ric === 'function') {
        const handle = ric(warm, { timeout: 2000 });
        return () => {
          cancelled = true;
          const cic = (window as any).cancelIdleCallback;
          if (typeof cic === 'function') cic(handle);
        };
      }
    } catch (_e) {}
    const t = setTimeout(warm, 300);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, []);

  // Debounce the query used for local filtering + category tabs
  useEffect(() => {
    if (!query) {
      setDebouncedQuery('');
      return;
    }
    const t = setTimeout(() => setDebouncedQuery(query), 120);
    return () => clearTimeout(t);
  }, [query]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Indexed local search (single-pass, capped) instead of scanning+lowercasing
  // six fields on all ~10.6k places for every keystroke.
  const localResults = useMemo(() => {
    return searchPlacesFast(debouncedQuery, {
      category: activeCategory !== 'All' ? activeCategory : undefined,
      limit: 40,
    });
  }, [debouncedQuery, activeCategory]);

  // Real-time Google Maps Suggestions on first word typed (even 1-2 characters)
  useEffect(() => {
    const trimmed = query.trim();
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
        const res = await fetch(getApiUrl(`/api/places/autocomplete?input=${encodeURIComponent(trimmed)}`), {
          signal: controller.signal,
        });
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
                category: p.category || (p.types?.[0] ? p.types[0].toUpperCase() : 'Google Map Location'),
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
    }, 180); // Fast 180ms response

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  // Total results combined
  const allResults = useMemo(() => {
    // Deduplicate between local results and google results
    const seen = new Set<string>();
    const list: (LocationNode & { isGoogle?: boolean })[] = [];

    // Local results first
    for (const r of localResults.slice(0, 15)) {
      seen.add(r.name.toLowerCase().trim());
      list.push(r);
    }

    // Google live results
    for (const g of googleResults) {
      const key = g.name.toLowerCase().trim();
      if (!seen.has(key)) {
        seen.add(key);
        list.push({ ...g, isGoogle: true });
      }
    }

    return list;
  }, [localResults, googleResults]);

  // Suggestions shown before the user types anything, so the dropdown is useful
  // immediately instead of listing every place in Hargeisa.
  const suggestedPlaces = useMemo(() => {
    if (debouncedQuery.trim()) return [];
    if (activeCategory !== 'All') return [];
    try {
      return getPopularPlaces(12);
    } catch {
      return [];
    }
  }, [debouncedQuery, activeCategory]);

  const handleSelect = async (place: LocationNode & { isGoogle?: boolean }) => {
    // If it is a google prediction without precise lat/lng
    if (place.id?.startsWith('ChIJ') || place.id?.length > 20) {
      try {
        const dRes = await fetch(`/api/places/details?place_id=${encodeURIComponent(place.id)}`);
        if (dRes.ok) {
          const detail = await dRes.json();
          if (detail.lat && detail.lng) {
            onSelectLocation({
              id: place.id,
              name: detail.name || place.name,
              address: detail.address || place.address,
              lat: detail.lat,
              lng: detail.lng,
              category: detail.category || place.category,
            });
            setQuery(detail.name || place.name);
            setIsOpen(false);
            return;
          }
        }
      } catch {
        // Fallback to place object
      }
    }

    onSelectLocation(place);
    setQuery(place.name);
    setIsOpen(false);
  };

  const handleClear = () => {
    setQuery('');
    setGoogleResults([]);
    inputRef.current?.focus();
    setIsOpen(true);
  };

  const isPickup = pointType === 'pickup';
  const badgeBg = isPickup ? 'bg-emerald-500' : 'bg-rose-500';

  // Helper to render distinct icon per category
  const renderPlaceIcon = (place: HargeisaPlace | LocationNode) => {
    const cat = (place.category || '').toLowerCase();
    const iconName = (place as HargeisaPlace).iconName;

    if (iconName === 'Plane' || cat.includes('airport') || cat.includes('transit') || cat.includes('aviation')) {
      return <Plane className="w-4 h-4 text-sky-500 shrink-0" />;
    }
    if (iconName === 'Bus' || cat.includes('bus') || cat.includes('station')) {
      return <Bus className="w-4 h-4 text-amber-500 shrink-0" />;
    }
    if (iconName === 'Hotel' || cat.includes('hotel') || cat.includes('resort') || cat.includes('lodging')) {
      return <Hotel className="w-4 h-4 text-indigo-500 shrink-0" />;
    }
    if (iconName === 'HeartPulse' || cat.includes('hospital') || cat.includes('health') || cat.includes('clinic')) {
      return <HeartPulse className="w-4 h-4 text-rose-500 shrink-0" />;
    }
    if (iconName === 'Moon' || cat.includes('mosque') || cat.includes('masjid')) {
      return <Moon className="w-4 h-4 text-emerald-600 shrink-0" />;
    }
    if (iconName === 'GraduationCap' || cat.includes('education') || cat.includes('university') || cat.includes('school')) {
      return <GraduationCap className="w-4 h-4 text-blue-500 shrink-0" />;
    }
    if (iconName === 'ShoppingBag' || iconName === 'Store' || cat.includes('market') || cat.includes('mall') || cat.includes('supermarket')) {
      return <ShoppingBag className="w-4 h-4 text-emerald-500 shrink-0" />;
    }
    if (iconName === 'Utensils' || iconName === 'Coffee' || cat.includes('restaurant') || cat.includes('cafe')) {
      return <Utensils className="w-4 h-4 text-orange-500 shrink-0" />;
    }
    if (iconName === 'Landmark' || cat.includes('bank') || cat.includes('financial') || cat.includes('government') || cat.includes('ministry')) {
      return <Landmark className="w-4 h-4 text-purple-500 shrink-0" />;
    }
    if (iconName === 'Fuel' || cat.includes('fuel') || cat.includes('petrol')) {
      return <Fuel className="w-4 h-4 text-amber-600 shrink-0" />;
    }
    if (iconName === 'Wrench' || cat.includes('repair')) {
      return <Wrench className="w-4 h-4 text-slate-500 shrink-0" />;
    }
    if (cat.includes('business') || cat.includes('telecom') || cat.includes('tower')) {
      return <Building2 className="w-4 h-4 text-teal-500 shrink-0" />;
    }
    return <MapPin className={`w-4 h-4 ${isPickup ? 'text-emerald-500' : 'text-rose-500'} shrink-0`} />;
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Label Header */}
      <div className="flex items-center justify-between mb-1">
        <label className={`text-[10px] font-black uppercase tracking-wider ${isPickup ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
          {label}
        </label>

        <div className="flex items-center space-x-1.5">
          {showGpsButton && onGpsClick && (
            <button
              type="button"
              onClick={onGpsClick}
              disabled={isGpsLocating}
              className="text-[9px] font-black px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 flex items-center gap-1 border border-emerald-500/30 transition shadow-xs"
              title="Detect my real live GPS location"
            >
              <Navigation className={`w-2.5 h-2.5 ${isGpsLocating ? 'animate-spin' : ''}`} />
              <span>{isGpsLocating ? 'Locating...' : '📍 My Real GPS'}</span>
            </button>
          )}

          {onOpenMapPin && (
            <button
              type="button"
              onClick={onOpenMapPin}
              className={`text-[9px] font-black px-2 py-0.5 rounded-md flex items-center gap-1 transition ${
                isMapPinning
                  ? isPickup
                    ? 'bg-emerald-600 text-white animate-pulse'
                    : 'bg-rose-600 text-white animate-pulse'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              title="Point directly on Interactive Map"
            >
              <MapPin className="w-2.5 h-2.5" />
              <span>{isMapPinning ? 'Pinning...' : 'Map Pin'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Input Field Container */}
      <div className="relative flex items-center">
        {/* Left Marker Badge */}
        <div className={`absolute left-3 w-5 h-5 rounded-full ${badgeBg} text-white flex items-center justify-center font-extrabold text-[10px] shadow pointer-events-none z-10`}>
          {isPickup ? 'A' : 'B'}
        </div>

        <input
          id={id}
          ref={inputRef}
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setHighlightIndex(-1);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setIsOpen(false);
            if (e.key === 'ArrowDown') {
              e.preventDefault();
              setHighlightIndex((prev) => (prev < allResults.length - 1 ? prev + 1 : 0));
            }
            if (e.key === 'ArrowUp') {
              e.preventDefault();
              setHighlightIndex((prev) => (prev > 0 ? prev - 1 : allResults.length - 1));
            }
            if (e.key === 'Enter') {
              if (highlightIndex >= 0 && highlightIndex < allResults.length) {
                handleSelect(allResults[highlightIndex]);
              } else if (allResults.length > 0) {
                handleSelect(allResults[0]);
              }
            }
          }}
          placeholder={placeholder}
          className={`w-full bg-slate-50 dark:bg-slate-800/90 border ${
            isOpen
              ? isPickup
                ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                : 'border-rose-500 ring-2 ring-rose-500/20'
              : 'border-slate-200 dark:border-slate-700'
          } text-slate-900 dark:text-white text-xs font-bold rounded-xl pl-10 pr-16 py-2.5 focus:outline-none transition shadow-sm`}
        />

        {/* Right Action Icons */}
        <div className="absolute right-2.5 flex items-center space-x-1.5">
          {isSearchingGoogle && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/70 border border-blue-500/30 text-[9px] font-extrabold text-blue-600 dark:text-blue-400 animate-pulse">
              <Globe className="w-2.5 h-2.5 animate-spin" />
              <span>Google...</span>
            </div>
          )}
          {query ? (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <Search className="w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          )}
        </div>
      </div>

      {/* GPS Active Pill Indicator */}
      {selectedLocation?.id === 'user_real_location' && (
        <div className="mt-1 flex items-center justify-between px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">
          <span className="flex items-center gap-1.5 truncate">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span>Live GPS Satellites Locked: {selectedLocation.name}</span>
          </span>
          <span className="font-mono text-[9px] opacity-75">{selectedLocation.lat.toFixed(4)}, {selectedLocation.lng.toFixed(4)}</span>
        </div>
      )}

      {/* AUTOCOMPLETE POPUP DROPDOWN */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 overflow-hidden max-h-[400px] flex flex-col animation-fadeIn">
          {/* Header Bar & Filter Tabs */}
          <div className="p-2.5 bg-slate-50/95 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-700 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="flex items-center gap-1">
                  <span>Google Maps Live Suggestions</span>
                  <span className="text-[9px] font-black px-1.5 py-0.2 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded">
                    Instant
                  </span>
                </span>
              </span>
              <span className="text-[10px] text-slate-400 font-semibold">
                {allResults.length > 0
                  ? `${allResults.length} suggestion${allResults.length === 1 ? '' : 's'}`
                  : `${getTotalPlaceCount().toLocaleString()} places registered`}
              </span>
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center space-x-1 overflow-x-auto pb-0.5 scrollbar-none text-[10px]">
              {CATEGORY_TABS.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-2 py-1 rounded-lg font-bold whitespace-nowrap transition ${
                    activeCategory === cat
                      ? isPickup
                        ? 'bg-emerald-500 text-slate-950 shadow-sm'
                        : 'bg-rose-500 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-slate-400'
                  }`}
                >
                  {cat === 'All' ? '⭐ All Places' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Results List */}
          <div className="overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-1">
            {/* Popular places before the rider types - avoids a blank dropdown */}
            {!debouncedQuery.trim() && suggestedPlaces.length > 0 && (
              <div className="px-1 pb-1">
                <div className="px-2 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>Popular places in Hargeisa</span>
                </div>
                <div className="flex flex-wrap gap-1.5 px-1 pb-1">
                  {suggestedPlaces.map((p) => (
                    <button
                      key={`quick_${p.id}`}
                      type="button"
                      onClick={() => handleSelect(p)}
                      className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:text-emerald-600 transition"
                      title={p.address}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Custom typed exact search button */}
            {query.trim().length > 0 && (
              <button
                type="button"
                onClick={() => {
                  handleSelect(resolveHargeisaPlaceCoordinates(query.trim()));
                }}
                className="w-full text-left p-2.5 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 rounded-xl transition flex items-center justify-between group"
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0">
                    📍
                  </div>
                  <div className="min-w-0">
                    <p className="font-extrabold text-xs text-emerald-600 dark:text-emerald-400 truncate">
                      Search exact: &quot;{query}&quot;
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">
                      Set as destination point in Somaliland
                    </p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40 px-2 py-0.5 rounded-md">
                  Choose
                </span>
              </button>
            )}

            {/* Google Maps & Hargeisa Place Matches */}
            {allResults.map((place, idx) => {
              const isSelected = selectedLocation?.id === place.id;
              const isHighlighted = highlightIndex === idx;

              return (
                <button
                  key={`${place.id}_${idx}`}
                  type="button"
                  onClick={() => handleSelect(place)}
                  className={`w-full text-left p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-xl transition flex items-center justify-between group ${
                    isSelected ? 'bg-emerald-500/10 dark:bg-emerald-950/40 border-l-2 border-emerald-500' : ''
                  } ${isHighlighted ? 'bg-slate-100 dark:bg-slate-800 ring-1 ring-emerald-500/40' : ''}`}
                >
                  <div className="flex items-start space-x-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition">
                      {renderPlaceIcon(place)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center space-x-1.5">
                        <p className="font-extrabold text-xs text-slate-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                          {place.name}
                        </p>
                        {place.isGoogle && (
                          <span className="text-[8px] bg-blue-500/10 text-blue-600 dark:text-blue-400 font-extrabold px-1.5 py-0.2 rounded border border-blue-500/20">
                            Google Map
                          </span>
                        )}
                        {(place as HargeisaPlace).popular && (
                          <span className="text-[8px] bg-amber-500/10 text-amber-500 font-extrabold px-1 rounded">
                            POPULAR
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {place.address}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 text-[9px] text-slate-400 font-medium">
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold">{place.category}</span>
                        {(place as HargeisaPlace).district && <span>• {(place as HargeisaPlace).district}</span>}
                        {place.lat && place.lng && (
                          <span className="font-mono opacity-60">({place.lat.toFixed(3)}, {place.lng.toFixed(3)})</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {isSelected ? (
                    <div className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0 ml-2 shadow-xs">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="text-[10px] font-bold text-slate-400 group-hover:text-emerald-500 transition shrink-0 ml-1">
                      →
                    </div>
                  )}
                </button>
              );
            })}

            {/* Empty state */}
            {allResults.length === 0 && !isSearchingGoogle && (
              <div className="p-6 text-center text-slate-400 text-xs">
                <Building2 className="w-8 h-8 mx-auto mb-2 text-slate-500" />
                <p className="font-bold text-slate-700 dark:text-slate-300">No exact place found for &quot;{query}&quot;</p>
                <p className="text-[10px] mt-1 text-slate-500">
                  You can click &quot;Search exact&quot; above to set it as a custom GPS coordinate anywhere in Hargeisa.
                </p>
              </div>
            )}
          </div>

          {/* Footer Quick Actions */}
          <div className="p-2 bg-slate-50 dark:bg-slate-800/90 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[10px] font-bold text-slate-500">
            <div className="flex items-center gap-1 text-[9px] text-slate-400">
              <Globe className="w-3 h-3 text-blue-500" />
              <span>Google Maps Platform & Somaliland Telematics</span>
            </div>
            {onOpenMapPin && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenMapPin();
                }}
                className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-extrabold"
              >
                <MapPin className="w-3 h-3" />
                <span>Drop Pin on Map</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
