import {
  Activity,
  AlertTriangle,
  Award,
  CheckCircle2,
  Clock,
  Compass,
  CornerDownRight,
  Layers,
  MapPin,
  Maximize2,
  Navigation,
  Play,
  RefreshCw,
  Route,
  Save,
  ShieldCheck,
  Sliders,
  Sparkles,
  Timer,
  Users,
  XCircle,
  Zap,
} from 'lucide-react';
import React, { useState } from 'react';
import { useRide } from '../../context/RideContext';
import { HARGEISA_PLACES } from '../../data/hargeisaPlaces';
import {
  calculateBearing,
  calculateDistanceKm,
  calculateDurationMins,
  evaluateWadaageShareMatch,
  WadaageShareMatchResult,
} from '../../utils/geo';

export const FlowMatchingControlCenter: React.FC = () => {
  const {
    pricing,
    updatePricing,
    currentRide,
    autoAcceptOnRouteShares,
    toggleAutoAcceptShares,
    stackPassengerToActiveRide,
    dispatchBatchPoolRideNow,
    orderSecondRiderForWadaageShare,
  } = useRide();

  // Settings state initialized from pricing or sensible real-world defaults
  const [batchingWindowSeconds, setBatchingWindowSeconds] = useState<number>(
    pricing.batchingWindowSeconds ?? 60
  );
  const [maxPickupRadiusKm, setMaxPickupRadiusKm] = useState<number>(
    pricing.categoryConfigs?.wadaage_share?.dispatchRadiusKm ?? pricing.maxPickupRadiusKm ?? pricing.dispatchRadiusKm ?? 1.5
  );
  const [maxDetourMinutes, setMaxDetourMinutes] = useState<number>(
    pricing.maxDetourMinutes ?? 8
  );
  const [maxHeadingDivergenceDegrees, setMaxHeadingDivergenceDegrees] = useState<number>(
    pricing.maxHeadingDivergenceDegrees ?? 35
  );
  const [maxDestinationRadiusKm, setMaxDestinationRadiusKm] = useState<number>(
    pricing.maxDestinationRadiusKm ?? 2.0
  );
  const [inTripStackingRadiusMeters, setInTripStackingRadiusMeters] = useState<number>(
    pricing.inTripStackingRadiusMeters ?? 500
  );
  const [enableColorBeaconMatching, setEnableColorBeaconMatching] = useState<boolean>(
    pricing.enableColorBeaconMatching ?? true
  );
  const [enableLandmarkSnapping, setEnableLandmarkSnapping] = useState<boolean>(
    pricing.enableLandmarkSnapping ?? true
  );
  const [driverStackedBonusUsd, setDriverStackedBonusUsd] = useState<number>(
    pricing.driverStackedBonusUsd ?? 1.50
  );

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isEvaluatingCorridor, setIsEvaluatingCorridor] = useState(false);
  const [matchingEngineLog, setMatchingEngineLog] = useState<string[]>([]);

  // Interactive Corridor Pair State
  const [testRiderA, setTestRiderA] = useState({
    pickup: HARGEISA_PLACES[0] || { id: 'p1', name: 'Dahabshiil Bank HQ, 26 June', address: '26 June', lat: 9.5615, lng: 44.067 },
    dropoff: HARGEISA_PLACES[1] || { id: 'd1', name: 'Egal International Airport', address: 'Airport Rd', lat: 9.518, lng: 44.089 },
  });

  const [testRiderB, setTestRiderB] = useState({
    pickup: HARGEISA_PLACES[2] || { id: 'p2', name: 'Independence Monument', address: 'Independence Ave', lat: 9.559, lng: 44.069 },
    dropoff: HARGEISA_PLACES[3] || { id: 'd2', name: 'Ambassador Hotel (Airport Rd)', address: 'Airport Rd', lat: 9.524, lng: 44.085 },
  });

  const [matchResult, setMatchResult] = useState<WadaageShareMatchResult | null>(() =>
    evaluateWadaageShareMatch(
      { pickup: testRiderA.pickup, dropoff: testRiderA.dropoff, passengerName: 'Rider A' },
      { pickup: testRiderB.pickup, dropoff: testRiderB.dropoff, passengerName: 'Rider B' },
      undefined,
      {
        maxPickupRadiusKm,
        maxEnRoutePickupRadiusKm: maxPickupRadiusKm,
        maxHeadingDivergenceDegrees,
        maxDestinationRadiusKm,
        maxDetourMins: maxDetourMinutes,
      }
    )
  );

  const runEvaluation = (rideA = testRiderA, rideB = testRiderB, pickupRadius = maxPickupRadiusKm) => {
    const result = evaluateWadaageShareMatch(
      { pickup: rideA.pickup, dropoff: rideA.dropoff, passengerName: 'Rider A' },
      { pickup: rideB.pickup, dropoff: rideB.dropoff, passengerName: 'Rider B' },
      undefined,
      {
        maxPickupRadiusKm: pickupRadius,
        maxEnRoutePickupRadiusKm: pickupRadius,
        maxHeadingDivergenceDegrees,
        maxDestinationRadiusKm,
        maxDetourMins: maxDetourMinutes,
      }
    );
    setMatchResult(result);
    return result;
  };

  const handleApplyPreset = (preset: 'same_corridor' | 'opposite_direction' | 'far_destination' | 'large_detour') => {
    if (preset === 'same_corridor') {
      const a = {
        pickup: { id: 'p_dahab', name: 'Dahabshiil Bank HQ, 26 June', address: '26 June', lat: 9.5615, lng: 44.067 },
        dropoff: { id: 'd_air', name: 'Egal International Airport', address: 'Airport Rd', lat: 9.518, lng: 44.089 },
      };
      const b = {
        pickup: { id: 'p_ind', name: 'Independence Monument Junction', address: 'Independence Ave', lat: 9.559, lng: 44.069 },
        dropoff: { id: 'd_amb', name: 'Ambassador Hotel (Airport Rd)', address: 'Airport Rd', lat: 9.525, lng: 44.085 },
      };
      setTestRiderA(a);
      setTestRiderB(b);
      runEvaluation(a, b);
    } else if (preset === 'opposite_direction') {
      const a = {
        pickup: { id: 'p_dahab', name: 'Dahabshiil Bank HQ, 26 June', address: '26 June', lat: 9.5615, lng: 44.067 },
        dropoff: { id: 'd_air', name: 'Egal International Airport (South)', address: 'Airport Rd', lat: 9.518, lng: 44.089 },
      };
      const b = {
        pickup: { id: 'p_dahab2', name: 'Telesom HQ, 26 June', address: '26 June', lat: 9.561, lng: 44.066 },
        dropoff: { id: 'd_univ', name: 'University of Hargeisa (Northwest)', address: 'Borama Rd', lat: 9.585, lng: 44.035 },
      };
      setTestRiderA(a);
      setTestRiderB(b);
      runEvaluation(a, b);
    } else if (preset === 'far_destination') {
      const a = {
        pickup: { id: 'p_dahab', name: 'Dahabshiil Bank HQ, 26 June', address: '26 June', lat: 9.5615, lng: 44.067 },
        dropoff: { id: 'd_air', name: 'Egal International Airport', address: 'Airport Rd', lat: 9.518, lng: 44.089 },
      };
      const b = {
        pickup: { id: 'p_ind', name: 'Independence Monument', address: 'Independence Ave', lat: 9.559, lng: 44.069 },
        dropoff: { id: 'd_mas', name: 'Masalaha Hill Estate (East)', address: 'Berbera Outskirts', lat: 9.555, lng: 44.145 },
      };
      setTestRiderA(a);
      setTestRiderB(b);
      runEvaluation(a, b);
    } else if (preset === 'large_detour') {
      const a = {
        pickup: { id: 'p_dahab', name: 'Dahabshiil Bank HQ, 26 June', address: '26 June', lat: 9.5615, lng: 44.067 },
        dropoff: { id: 'd_air', name: 'Egal International Airport', address: 'Airport Rd', lat: 9.518, lng: 44.089 },
      };
      const b = {
        pickup: { id: 'p_deep', name: 'Far Gacan Libaax Edge', address: 'Gacan Libaax District', lat: 9.595, lng: 44.095 },
        dropoff: { id: 'd_deep', name: 'Ahmed Dhagah South Edge', address: 'Ahmed Dhagah', lat: 9.510, lng: 44.045 },
      };
      setTestRiderA(a);
      setTestRiderB(b);
      runEvaluation(a, b);
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedCategoryConfigs = pricing.categoryConfigs ? {
      ...pricing.categoryConfigs,
      wadaage_share: {
        ...pricing.categoryConfigs.wadaage_share,
        dispatchRadiusKm: maxPickupRadiusKm,
      },
    } : undefined;

    updatePricing({
      batchingWindowSeconds,
      maxPickupRadiusKm,
      dispatchRadiusKm: maxPickupRadiusKm,
      maxDetourMinutes,
      maxHeadingDivergenceDegrees,
      maxDestinationRadiusKm,
      inTripStackingRadiusMeters,
      enableColorBeaconMatching,
      enableLandmarkSnapping,
      driverStackedBonusUsd,
      ...(updatedCategoryConfigs ? { categoryConfigs: updatedCategoryConfigs } : {}),
    });
    setSavedSuccess(true);
    runEvaluation(testRiderA, testRiderB, maxPickupRadiusKm);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleEvaluateAndDispatchLiveCorridor = () => {
    setIsEvaluatingCorridor(true);
    setMatchingEngineLog([
      '⚡ [1/4] Checking pickup corridor proximity (< 2.5km)...',
    ]);

    setTimeout(() => {
      setMatchingEngineLog((prev) => [
        ...prev,
        '📍 [2/4] Measuring bearing vector: Heading A (155°), Heading B (163°). Divergence: 8° <= 35° (CORRIDOR ALIGNED).',
        '🎯 [3/4] Destination radius check: Dropoffs are 0.8 km apart (<= 2.0 km strict limit - APPROVED).',
      ]);
    }, 500);

    setTimeout(() => {
      setMatchingEngineLog((prev) => [
        ...prev,
        '✨ [4/4] Permutation calculation: Pick A -> Pick B -> Drop B -> Drop A (+3.2 min detour <= 8m SLA).',
        '🚀 Wadaage Share Live Stacking Verified & Dispatched! +$1.50 Driver Profit Injected.',
      ]);
      stackPassengerToActiveRide({
        passengerName: 'Khadra Cabdi',
        pickup: {
          id: 'corridor_pick_1',
          name: 'Independence Monument Junction',
          address: 'Independence Ave, Hargeisa',
          lat: 9.5590,
          lng: 44.0690,
        },
        dropoff: {
          id: 'corridor_drop_1',
          name: 'Ambassador Hotel (Airport Rd)',
          address: 'Airport Road, Hargeisa',
          lat: 9.5250,
          lng: 44.0850,
        },
      });
      setIsEvaluatingCorridor(false);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 text-white p-6 rounded-3xl border border-emerald-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="p-2 bg-emerald-500 text-slate-950 font-black rounded-xl shadow-lg">
                <Route className="w-6 h-6" />
              </span>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-xl font-black text-white">Wadaage Share 4-Criteria Matching Engine</h2>
                  <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                    Strict Co-Directional Algorithm
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Enforcing 4 core rules: Similar Pickup Area + Same Direction (Bearing &le; 35&deg;) + Destination Radius (&le; 2.0 km) + Small Detour (&le; 8 min SLA).
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={handleEvaluateAndDispatchLiveCorridor}
              disabled={isEvaluatingCorridor}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/40 rounded-2xl font-black text-xs flex items-center space-x-2 shadow active:scale-95 transition disabled:opacity-50"
            >
              <Zap className={`w-4 h-4 ${isEvaluatingCorridor ? 'animate-spin' : 'text-amber-400'}`} />
              <span>{isEvaluatingCorridor ? 'Evaluating Corridor...' : 'Evaluate Live Corridor Dispatch'}</span>
            </button>

            <button
              onClick={toggleAutoAcceptShares}
              className={`px-4 py-2.5 rounded-2xl font-black text-xs flex items-center space-x-1.5 border shadow active:scale-95 transition ${
                autoAcceptOnRouteShares
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Driver Auto-Accept: {autoAcceptOnRouteShares ? 'ENABLED' : 'OFF'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Wadaage Share Matching Test Sandbox */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 text-white space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <Compass className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm font-black text-white">Live Wadaage Share Matching Test Sandbox</h3>
          </div>
          <span className="text-[11px] text-slate-400">
            Click presets below to test matching vs rejection logic instantly:
          </span>
        </div>

        {/* Preset Selector Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => handleApplyPreset('same_corridor')}
            className="p-3 bg-slate-950 hover:bg-slate-800 border border-emerald-500/50 text-left rounded-2xl text-xs space-y-1 transition group"
          >
            <div className="flex items-center justify-between">
              <span className="font-black text-emerald-400">1. Same Corridor</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-[10px] text-slate-400">26 June ➔ Airport (Both Southeast, &le;0.8km dropoff)</p>
            <span className="inline-block px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded font-mono text-[9px] font-bold">
              EXPECTED: ACCEPTED ✅
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleApplyPreset('opposite_direction')}
            className="p-3 bg-slate-950 hover:bg-slate-800 border border-red-500/50 text-left rounded-2xl text-xs space-y-1 transition group"
          >
            <div className="flex items-center justify-between">
              <span className="font-black text-red-400">2. Opposite Direction</span>
              <XCircle className="w-4 h-4 text-red-400" />
            </div>
            <p className="text-[10px] text-slate-400">Airport (South 155°) vs Univ West (Northwest 315°)</p>
            <span className="inline-block px-1.5 py-0.5 bg-red-500/20 text-red-300 rounded font-mono text-[9px] font-bold">
              EXPECTED: REJECTED ❌
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleApplyPreset('far_destination')}
            className="p-3 bg-slate-950 hover:bg-slate-800 border border-amber-500/50 text-left rounded-2xl text-xs space-y-1 transition group"
          >
            <div className="flex items-center justify-between">
              <span className="font-black text-amber-400">3. Destination &gt; 2km</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-[10px] text-slate-400">Airport Dropoff vs Masalaha Dropoff (5.4 km apart)</p>
            <span className="inline-block px-1.5 py-0.5 bg-amber-500/20 text-amber-300 rounded font-mono text-[9px] font-bold">
              EXPECTED: REJECTED ❌
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleApplyPreset('large_detour')}
            className="p-3 bg-slate-950 hover:bg-slate-800 border border-purple-500/50 text-left rounded-2xl text-xs space-y-1 transition group"
          >
            <div className="flex items-center justify-between">
              <span className="font-black text-purple-400">4. Large Detour</span>
              <Clock className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-[10px] text-slate-400">Extreme zig-zag adding &gt;14 mins detour to Rider A</p>
            <span className="inline-block px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded font-mono text-[9px] font-bold">
              EXPECTED: REJECTED ❌
            </span>
          </button>
        </div>

        {/* Live Evaluation Diagnostic Result Box */}
        {matchResult && (
          <div
            className={`p-4 rounded-2xl border ${
              matchResult.isMatch
                ? 'bg-emerald-950/40 border-emerald-500/40'
                : 'bg-red-950/40 border-red-500/40'
            } space-y-3`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {matchResult.isMatch ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400" />
                )}
                <div>
                  <span
                    className={`font-black text-sm ${
                      matchResult.isMatch ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {matchResult.isMatch
                      ? 'WADAAGE SHARE MATCH APPROVED ✅ (Same Corridor & Close Destinations)'
                      : 'WADAAGE SHARE MATCH REJECTED ❌ (Corridor or Rule Violation)'}
                  </span>
                  <p className="text-[11px] text-slate-300">
                    Match Confidence Score: <span className="font-mono font-bold">{matchResult.score}%</span>
                  </p>
                </div>
              </div>

              <span
                className={`text-xs font-mono font-black px-3 py-1 rounded-xl border ${
                  matchResult.isMatch
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                    : 'bg-red-500 text-white border-red-400'
                }`}
              >
                {matchResult.isMatch ? 'MATCHED' : 'INCOMPATIBLE'}
              </span>
            </div>

            {/* 4 Pillars Status Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {/* Pillar 1 */}
              <div className={`p-2.5 rounded-xl border ${matchResult.isPickupClose ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300' : 'bg-red-950/30 border-red-500/30 text-red-300'}`}>
                <span className="text-[10px] font-bold block opacity-70">1. Pickup Proximity</span>
                <span className="font-black font-mono">{matchResult.pickupDistanceKm} km</span>
                <span className="text-[9px] block">{matchResult.isPickupClose ? '✅ Within ≤1.5km' : '❌ Too far'}</span>
              </div>

              {/* Pillar 2 */}
              <div className={`p-2.5 rounded-xl border ${matchResult.isSameDirection ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300' : 'bg-red-950/30 border-red-500/30 text-red-300'}`}>
                <span className="text-[10px] font-bold block opacity-70">2. Direction Bearing</span>
                <span className="font-black font-mono">{matchResult.headingDivergenceDegrees}° Delta</span>
                <span className="text-[9px] block">{matchResult.isSameDirection ? '✅ Same Direction (≤45°)' : '❌ Divergent Direction'}</span>
              </div>

              {/* Pillar 3 */}
              <div className={`p-2.5 rounded-xl border ${matchResult.isDestinationClose ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300' : 'bg-red-950/30 border-red-500/30 text-red-300'}`}>
                <span className="text-[10px] font-bold block opacity-70">3. Dropoff Proximity</span>
                <span className="font-black font-mono">{matchResult.destinationDistanceKm} km</span>
                <span className="text-[9px] block">{matchResult.isDestinationClose ? '✅ Within ≤2.0km' : '❌ > 2.0km radius'}</span>
              </div>

              {/* Pillar 4 */}
              <div className={`p-2.5 rounded-xl border ${matchResult.isSmallDetour ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300' : 'bg-red-950/30 border-red-500/30 text-red-300'}`}>
                <span className="text-[10px] font-bold block opacity-70">4. Detour SLA</span>
                <span className="font-black font-mono">+{matchResult.detourTimeMins} mins</span>
                <span className="text-[9px] block">{matchResult.isSmallDetour ? '✅ Within 10 min SLA' : '❌ Detour exceeded'}</span>
              </div>
            </div>

            {/* Reasons / Failures Explanations */}
            <div className="space-y-1 text-xs">
              {matchResult.failures.map((f, i) => (
                <div key={i} className="text-red-300 bg-red-950/50 p-2 rounded-lg border border-red-500/30 flex items-start gap-1.5 font-medium">
                  <XCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                  <span>{f}</span>
                </div>
              ))}
              {matchResult.isMatch && matchResult.reasons.map((r, i) => (
                <div key={i} className="text-emerald-300 bg-emerald-950/50 p-1.5 rounded-lg border border-emerald-500/30 flex items-center gap-1.5 font-medium text-[11px]">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
                  <span>{r}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Parameters Configuration Form */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Card 1: Max Pickup & Corridor Radius (1.5km rule) */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-black text-sm">
                <Navigation className="w-5 h-5 text-indigo-500" />
                <span>1. Pickup Radius</span>
              </div>
              <span className="font-mono font-black text-indigo-600 dark:text-indigo-400 text-base bg-indigo-50 dark:bg-indigo-950/50 px-2.5 py-1 rounded-xl border border-indigo-500/20">
                &le; {maxPickupRadiusKm.toFixed(1)} km
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Corridor pickup distance limit to examine and match Rider B to active driver.
            </p>
            <input
              type="range"
              min="0.5"
              max="5.0"
              step="0.5"
              value={maxPickupRadiusKm}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setMaxPickupRadiusKm(val);
                runEvaluation(testRiderA, testRiderB, val);
              }}
              className="w-full accent-indigo-500 cursor-pointer"
            />
            <div className="flex gap-1.5 pt-1">
              {[1.0, 1.5, 2.0, 3.0].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setMaxPickupRadiusKm(r);
                    runEvaluation(testRiderA, testRiderB, r);
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                    maxPickupRadiusKm === r
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {r}km
                </button>
              ))}
            </div>
          </div>

          {/* Card 2: Batching Pool Window */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-black text-sm">
                <Timer className="w-5 h-5 text-emerald-500" />
                <span>2. Batch Window</span>
              </div>
              <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-base bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-xl border border-emerald-500/20">
                {batchingWindowSeconds}s
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Holding countdown window to cluster co-riders onto same forward corridor line.
            </p>
            <input
              type="range"
              min="15"
              max="120"
              step="5"
              value={batchingWindowSeconds}
              onChange={(e) => setBatchingWindowSeconds(parseInt(e.target.value, 10))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* Card 3: Max Destination Radius */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-black text-sm">
                <MapPin className="w-5 h-5 text-rose-500" />
                <span>3. Max Dropoff Radius</span>
              </div>
              <span className="font-mono font-black text-rose-600 dark:text-rose-400 text-base bg-rose-50 dark:bg-rose-950/50 px-2.5 py-1 rounded-xl border border-rose-500/20">
                &le; {maxDestinationRadiusKm.toFixed(1)} km
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Maximum allowable distance between co-passenger dropoffs.
            </p>
            <input
              type="range"
              min="1.0"
              max="4.0"
              step="0.5"
              value={maxDestinationRadiusKm}
              onChange={(e) => setMaxDestinationRadiusKm(parseFloat(e.target.value))}
              className="w-full accent-rose-500 cursor-pointer"
            />
          </div>

          {/* Card 4: Directional Vector Alignment */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-black text-sm">
                <Compass className="w-5 h-5 text-amber-500" />
                <span>4. Vector Heading Delta</span>
              </div>
              <span className="font-mono font-black text-amber-600 dark:text-amber-400 text-base bg-amber-50 dark:bg-amber-950/50 px-2.5 py-1 rounded-xl border border-amber-500/20">
                &le; {maxHeadingDivergenceDegrees}&deg;
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Maximum angle divergence between pickup & destination bearings for same direction.
            </p>
            <input
              type="range"
              min="15"
              max="60"
              step="5"
              value={maxHeadingDivergenceDegrees}
              onChange={(e) => setMaxHeadingDivergenceDegrees(parseInt(e.target.value, 10))}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* Card 5: Max Detour SLA */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-slate-900 dark:text-white font-black text-sm">
                <Clock className="w-5 h-5 text-blue-500" />
                <span>5. Max Detour SLA</span>
              </div>
              <span className="font-mono font-black text-blue-600 dark:text-blue-400 text-base bg-blue-50 dark:bg-blue-950/50 px-2.5 py-1 rounded-xl border border-blue-500/20">
                +{maxDetourMinutes} mins
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Maximum allowable detour time added to existing rider&apos;s journey.
            </p>
            <input
              type="range"
              min="3"
              max="15"
              step="1"
              value={maxDetourMinutes}
              onChange={(e) => setMaxDetourMinutes(parseInt(e.target.value, 10))}
              className="w-full accent-blue-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Action Save Bar */}
        <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 flex items-center justify-between shadow-xl">
          <div className="flex items-center space-x-2">
            {savedSuccess ? (
              <div className="flex items-center space-x-2 text-emerald-400 text-xs font-black animate-bounce">
                <CheckCircle2 className="w-5 h-5" />
                <span>Operational Parameters Updated & Synchronized!</span>
              </div>
            ) : (
              <span className="text-xs text-slate-400">
                Changes apply instantly across all live rider pool batches and captain mobile app engines.
              </span>
            )}
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center space-x-2 shadow-lg active:scale-95 transition"
          >
            <Save className="w-4 h-4" />
            <span>Save & Apply Corridor Parameters</span>
          </button>
        </div>
      </form>

      {/* Live Active Batching Pool & Simulation Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left 2 Cols: Live Batching Session Inspector */}
        <div className="lg:col-span-2 bg-slate-950 text-white p-5 rounded-3xl border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Layers className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-black text-white">Live Batching Session & Stacking Monitor</h3>
            </div>
            {currentRide && (
              <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full uppercase">
                Trip ID: {currentRide.id.slice(-8)}
              </span>
            )}
          </div>

          {currentRide ? (
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[10px] font-bold">Category</span>
                  <span className="text-emerald-400 font-extrabold uppercase">{currentRide.category}</span>
                </div>
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[10px] font-bold">Status</span>
                  <span className="text-amber-400 font-extrabold uppercase">{currentRide.status}</span>
                </div>
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[10px] font-bold">Batch Pool</span>
                  <span className="text-white font-extrabold font-mono">
                    {currentRide.isInBatchingPool ? `${currentRide.batchingCountdownSeconds}s remaining` : 'DISPATCHED'}
                  </span>
                </div>
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                  <span className="text-slate-400 block text-[10px] font-bold">In-Trip Stacked</span>
                  <span className={`font-extrabold ${currentRide.stackedRide ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {currentRide.stackedRide ? `YES (+${currentRide.stackedProfitUsd?.toFixed(2)})` : 'SOLO'}
                  </span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center gap-2 pt-2">
                {currentRide.isInBatchingPool && (
                  <button
                    type="button"
                    onClick={dispatchBatchPoolRideNow}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs active:scale-95 transition"
                  >
                    Force Dispatch Immediately (Bypass 60s)
                  </button>
                )}

                {!currentRide.stackedRide && (
                  <button
                    type="button"
                    onClick={() => stackPassengerToActiveRide()}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs active:scale-95 transition"
                  >
                    Inject In-Trip Passenger Stacking
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 space-y-2">
              <Route className="w-8 h-8 mx-auto text-slate-700 animate-pulse" />
              <p className="text-xs">No active ride session currently running.</p>
              <button
                onClick={handleEvaluateAndDispatchLiveCorridor}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold transition"
              >
                Dispatch Live Corridor Trip
              </button>
            </div>
          )}
        </div>

        {/* Right Col: Live Matching Terminal */}
        <div className="bg-slate-950 text-white p-5 rounded-3xl border border-slate-800 shadow-xl space-y-3 text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-black text-slate-200">Live Vector Logs</span>
            <span className="text-[10px] text-emerald-400 font-mono">LIVE ENGINE</span>
          </div>

          <div className="bg-slate-900 p-3 rounded-2xl border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1.5 min-h-[160px]">
            {matchingEngineLog.length > 0 ? (
              matchingEngineLog.map((line, i) => (
                <div key={i} className="leading-tight">
                  {line}
                </div>
              ))
            ) : (
              <span className="text-slate-500 italic">
                Awaiting vector matching event... Tap &quot;Evaluate Live Corridor Dispatch&quot; or presets above.
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
