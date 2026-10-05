import React, { useState } from 'react';
import {
  Fuel,
  Gauge,
  TrendingUp,
  DollarSign,
  AlertTriangle,
  Plus,
  Sliders,
  Settings,
  Calendar,
  Clock,
  Car,
  ChevronLeft,
  Info,
  Radio,
  BarChart3,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useFuel } from '../../../context/FuelContext';
import { FuelRefillModal } from './FuelRefillModal';
import { FuelCorrectionModal } from './FuelCorrectionModal';
import { VehicleSetupModal } from './VehicleSetupModal';

interface FuelDashboardScreenProps {
  onBack?: () => void;
  isStandaloneScreen?: boolean;
}

export const FuelDashboardScreen: React.FC<FuelDashboardScreenProps> = ({
  onBack,
  isStandaloneScreen = false,
}) => {
  const {
    vehicle,
    currentFuelLiters,
    fuelPercentage,
    remainingRangeKm,
    todayDrivingKm,
    todayFuelUsedLiters,
    todayFuelCostSlsh,
    fuelEfficiencyKmPerLiter,
    costPerKmSlsh,
    fuelWarning,
    dailyReport,
    weeklySummary,
    fuelLogs,
    isTrackingActive,
    trackingMethod,
    obdConnected,
  } = useFuel();

  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'daily' | 'weekly' | 'history'>('overview');
  const [showRefillModal, setShowRefillModal] = useState<boolean>(false);
  const [showCorrectionModal, setShowCorrectionModal] = useState<boolean>(false);
  const [showVehicleModal, setShowVehicleModal] = useState<boolean>(false);

  const isLowOrCritical = fuelWarning.level === 'critical' || fuelWarning.level === 'very_low' || fuelWarning.level === 'low';

  return (
    <div className="min-h-full bg-slate-100 flex flex-col pb-24 select-none">
      {/* 1. TOP HEADER */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 px-4 py-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="p-2 -ml-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <div>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-[#008751] text-white flex items-center justify-center font-bold shadow-xs">
                  <Fuel className="w-4 h-4" />
                </div>
                <div>
                  <h1 className="font-black text-slate-900 text-base leading-tight">
                    Wadaage Fuel & Distance
                  </h1>
                  <p className="text-[11px] text-slate-500 font-bold">
                    {vehicle.make} {vehicle.model} • {vehicle.licensePlate} • Hargeisa
                  </p>
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowVehicleModal(true)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center space-x-1 text-xs font-bold"
            title="Vehicle Settings"
          >
            <Settings className="w-4 h-4 text-slate-600" />
            <span className="hidden sm:inline">Settings</span>
          </button>
        </div>

        {/* Sub-Navigation Tabs */}
        <div className="flex space-x-1 mt-3 bg-slate-100 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveSubTab('overview')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition text-center ${
              activeSubTab === 'overview'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Overview
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('daily')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition text-center ${
              activeSubTab === 'daily'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Daily
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('weekly')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition text-center ${
              activeSubTab === 'weekly'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Weekly
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('history')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition text-center ${
              activeSubTab === 'history'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Refuels ({fuelLogs.length})
          </button>
        </div>
      </header>

      {/* 2. BODY CONTENT */}
      <div className="p-4 space-y-4 max-w-2xl mx-auto w-full">
        {/* Fuel Warning Banner */}
        {isLowOrCritical && (
          <div
            className={`p-3.5 rounded-3xl border shadow-sm space-y-1.5 animate-in fade-in ${
              fuelWarning.level === 'critical'
                ? 'bg-rose-50 border-rose-200 text-rose-950'
                : 'bg-amber-50 border-amber-200 text-amber-950'
            }`}
          >
            <div className="flex items-center space-x-2">
              <AlertTriangle
                className={`w-5 h-5 shrink-0 ${
                  fuelWarning.level === 'critical' ? 'text-rose-600 animate-pulse' : 'text-amber-600'
                }`}
              />
              <h4 className="font-black text-xs uppercase tracking-wide">
                {fuelWarning.title}
              </h4>
            </div>
            <p className="text-xs font-semibold pl-7 leading-relaxed">
              {fuelWarning.message}
            </p>
            <div className="pl-7 pt-1">
              <button
                type="button"
                onClick={() => setShowRefillModal(true)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold inline-flex items-center space-x-1 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Refuel Now in Hargeisa</span>
              </button>
            </div>
          </div>
        )}

        {/* OVERVIEW SUB-TAB */}
        {activeSubTab === 'overview' && (
          <div className="space-y-4">
            {/* Main Tank Gauge Card */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">
                    Current Fuel Level
                  </span>
                  <div className="flex items-baseline space-x-2 mt-1">
                    <span className="text-3xl font-black text-slate-900 font-mono">
                      {currentFuelLiters} <span className="text-sm text-slate-500">L</span>
                    </span>
                    <span
                      className={`text-sm font-black px-2.5 py-0.5 rounded-full font-mono ${
                        fuelWarning.level === 'critical'
                          ? 'bg-rose-100 text-rose-700'
                          : fuelWarning.level === 'very_low' || fuelWarning.level === 'low'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {fuelPercentage}%
                    </span>
                  </div>
                </div>

                {/* Remaining Range Badge */}
                <div className="text-right bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-2xl">
                  <span className="text-[10px] text-emerald-800 font-bold uppercase tracking-wider block">
                    Estimated Range
                  </span>
                  <span className="text-lg font-black text-emerald-900 font-mono">
                    ~{remainingRangeKm} <span className="text-xs font-sans">km</span>
                  </span>
                </div>
              </div>

              {/* Progress Bar with markers */}
              <div className="space-y-1.5">
                <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200 relative">
                  <div
                    className={`h-full transition-all duration-500 ${
                      fuelWarning.level === 'critical'
                        ? 'bg-rose-500'
                        : fuelWarning.level === 'very_low' || fuelWarning.level === 'low'
                        ? 'bg-amber-500'
                        : 'bg-[#008751]'
                    }`}
                    style={{ width: `${fuelPercentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-bold text-slate-400 font-mono">
                  <span>0L (E)</span>
                  <span>{Math.round(vehicle.tankCapacityLiters * 0.25)}L (1/4)</span>
                  <span>{Math.round(vehicle.tankCapacityLiters * 0.5)}L (1/2)</span>
                  <span>{Math.round(vehicle.tankCapacityLiters * 0.75)}L (3/4)</span>
                  <span>{vehicle.tankCapacityLiters}L (F)</span>
                </div>
              </div>

              {/* 3 Action Buttons */}
              <div className="grid grid-cols-3 gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRefillModal(true)}
                  className="py-2.5 px-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-black flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-1.5 shadow-xs transition active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Add Fuel</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowCorrectionModal(true)}
                  className="py-2.5 px-2 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-black flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-1.5 shadow-xs transition active:scale-95"
                >
                  <Sliders className="w-4 h-4" />
                  <span>Update Level</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowVehicleModal(true)}
                  className="py-2.5 px-2 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-1.5 shadow-xs transition active:scale-95"
                >
                  <Settings className="w-4 h-4" />
                  <span>Setup Vehicle</span>
                </button>
              </div>
            </div>

            {/* 8 Core Driver Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-2xs">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                  Today's Driving
                </span>
                <p className="text-base font-black text-slate-900 font-mono mt-0.5">
                  {todayDrivingKm} <span className="text-xs font-sans text-slate-500">km</span>
                </p>
                <span className="text-[10px] text-slate-400">GPS verified</span>
              </div>

              <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-2xs">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                  Fuel Used Today
                </span>
                <p className="text-base font-black text-amber-600 font-mono mt-0.5">
                  {todayFuelUsedLiters} <span className="text-xs font-sans text-slate-500">L</span>
                </p>
                <span className="text-[10px] text-slate-400">At {fuelEfficiencyKmPerLiter} km/L</span>
              </div>

              <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-2xs">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                  Fuel Cost Today
                </span>
                <p className="text-base font-black text-emerald-700 font-mono mt-0.5 truncate">
                  {todayFuelCostSlsh.toLocaleString()}{' '}
                  <span className="text-[10px] font-sans font-bold">SLSH</span>
                </p>
                <span className="text-[10px] text-slate-400 font-mono">
                  {(todayFuelCostSlsh / 10000).toFixed(2)} USD
                </span>
              </div>

              <div className="bg-white rounded-2xl p-3 border border-slate-200 shadow-2xs">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">
                  Cost Per KM
                </span>
                <p className="text-base font-black text-blue-700 font-mono mt-0.5">
                  {costPerKmSlsh.toLocaleString()}{' '}
                  <span className="text-[10px] font-sans font-bold">SLSH</span>
                </p>
                <span className="text-[10px] text-slate-400">Driver profitability</span>
              </div>
            </div>

            {/* OBD-II & Telematics Architecture Status */}
            <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                    <Radio className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-xs">
                      Calculation Architecture & Telematics
                    </h4>
                    <p className="text-[10px] text-slate-500">
                      GPS Distance Tracking & OBD-II Hardware Interface
                    </p>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800">
                  {trackingMethod}
                </span>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">OBD-II Device Status:</span>
                  <span className="font-bold text-slate-700">
                    {obdConnected ? 'Connected (CAN Bus)' : 'Not Connected (Using GPS Engine)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Live GPS Session:</span>
                  <span className="font-bold text-emerald-700">
                    {isTrackingActive ? '🟢 Active Tracking (Online)' : '⚪ Standby (Offline)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Noise & Jitter Filter:</span>
                  <span className="font-bold text-slate-700">Active (Haversine &lt; 50m filter)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DAILY REPORT SUB-TAB */}
        {activeSubTab === 'daily' && (
          <div className="space-y-4">
            <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-black text-slate-900 text-sm">
                    Today's Report ({dailyReport.date})
                  </h3>
                </div>
                <span className="text-xs text-slate-500 font-bold">
                  {dailyReport.sessionCount} Sessions Recorded
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600 font-semibold">Total Distance Driven</span>
                  <span className="font-black text-slate-900 font-mono">{todayDrivingKm} km</span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600 font-semibold">Estimated Fuel Consumed</span>
                  <span className="font-black text-amber-600 font-mono">{todayFuelUsedLiters} Liters</span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600 font-semibold">Fuel Added / Refilled</span>
                  <span className="font-black text-emerald-600 font-mono">{dailyReport.fuelAddedLiters} Liters</span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600 font-semibold">Estimated Fuel Expense</span>
                  <span className="font-black text-slate-900 font-mono">
                    {todayFuelCostSlsh.toLocaleString()} SLSH
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600 font-semibold">Average Fuel Efficiency</span>
                  <span className="font-black text-slate-900 font-mono">
                    {dailyReport.averageEfficiencyKmPerLiter} KM / L
                  </span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-600 font-semibold">Fuel Cost per KM</span>
                  <span className="font-black text-blue-700 font-mono">{costPerKmSlsh} SLSH / km</span>
                </div>

                <div className="flex justify-between py-1.5">
                  <span className="text-slate-600 font-semibold">Total Driving Time</span>
                  <span className="font-black text-slate-900 font-mono">
                    {Math.floor(dailyReport.drivingTimeMinutes / 60)}h {dailyReport.drivingTimeMinutes % 60}m
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* WEEKLY REPORT SUB-TAB */}
        {activeSubTab === 'weekly' && (
          <div className="space-y-4">
            {weeklySummary && (
              <>
                {/* 7-Day Overview Card */}
                <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="w-5 h-5 text-blue-600" />
                      <h3 className="font-black text-slate-900 text-sm">Past 7 Days Summary</h3>
                    </div>
                    <span className="text-xs text-slate-500 font-bold">Hargeisa, Somaliland</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Distance</span>
                      <span className="text-sm font-black text-slate-900 font-mono">
                        {weeklySummary.totalDistanceKm} km
                      </span>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Fuel</span>
                      <span className="text-sm font-black text-amber-600 font-mono">
                        {weeklySummary.totalFuelUsedLiters} L
                      </span>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block">Total Cost</span>
                      <span className="text-sm font-black text-emerald-800 font-mono truncate">
                        {weeklySummary.totalFuelCostSlsh.toLocaleString()} SLSH
                      </span>
                    </div>
                  </div>

                  {/* Day-by-Day Interactive Visual Breakdown */}
                  <div className="space-y-2 pt-2">
                    <h4 className="font-extrabold text-slate-800 text-xs">Daily Driving & Fuel Consumption</h4>
                    <div className="space-y-2">
                      {weeklySummary.days.map((day) => {
                        const maxDist = Math.max(1, ...weeklySummary.days.map((d) => d.distanceKm));
                        const pct = Math.round((day.distanceKm / maxDist) * 100);

                        return (
                          <div key={day.date} className="p-2.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-black text-slate-800">
                                {day.dayName} <span className="text-[11px] text-slate-400 font-normal">({day.date})</span>
                              </span>
                              <div className="flex items-center space-x-3 font-mono">
                                <span className="font-bold text-slate-900">{day.distanceKm} km</span>
                                <span className="text-amber-600 font-bold">{day.fuelUsedLiters} L</span>
                                <span className="text-emerald-700 font-bold">{day.fuelCostSlsh.toLocaleString()} SLSH</span>
                              </div>
                            </div>
                            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                              <div
                                className="bg-[#008751] h-full rounded-full transition-all"
                                style={{ width: `${Math.max(5, pct)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* REFUELS & CALIBRATION HISTORY SUB-TAB */}
        {activeSubTab === 'history' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-slate-900 text-sm">Refueling & Calibration Log</h3>
              <button
                type="button"
                onClick={() => setShowRefillModal(true)}
                className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Refill</span>
              </button>
            </div>

            {fuelLogs.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 space-y-2">
                <Fuel className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="font-bold text-slate-700 text-xs">No fuel logs recorded yet</p>
                <p className="text-[11px] text-slate-400">
                  Tap "+ Add Refill" when you fuel up in Hargeisa to track costs and history.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {fuelLogs.map((log) => (
                  <div
                    key={log.id}
                    className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
                            log.type === 'refill'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {log.type === 'refill' ? 'Refuel' : 'Manual Calibration'}
                        </span>
                        <span className="text-xs font-bold text-slate-900">
                          {log.type === 'refill' ? `+${log.litersAdded} Liters` : `${log.newFuelLiters} L Set`}
                        </span>
                      </div>

                      {log.totalCostSlsh ? (
                        <span className="text-xs font-black text-emerald-800 font-mono">
                          {log.totalCostSlsh.toLocaleString()} SLSH
                        </span>
                      ) : null}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>{log.fuelStation || 'Hargeisa Station'}</span>
                      <span className="font-mono">
                        {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {log.notes && (
                      <p className="text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100">
                        "{log.notes}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODALS */}
      {showRefillModal && (
        <FuelRefillModal
          isOpen={showRefillModal}
          onClose={() => setShowRefillModal(false)}
        />
      )}

      {showCorrectionModal && (
        <FuelCorrectionModal
          isOpen={showCorrectionModal}
          onClose={() => setShowCorrectionModal(false)}
        />
      )}

      {showVehicleModal && (
        <VehicleSetupModal
          isOpen={showVehicleModal}
          onClose={() => setShowVehicleModal(false)}
        />
      )}
    </div>
  );
};
