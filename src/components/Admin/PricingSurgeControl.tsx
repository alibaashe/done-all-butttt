import { Award, Bike, Car, Check, DollarSign, Layers, Lock, Navigation, Percent, Power, Save, ShieldAlert, Sliders, Sparkles, Users, Zap } from 'lucide-react';
import React, { useState } from 'react';
import { useRide } from '../../context/RideContext';
import { DEFAULT_CATEGORY_CONFIGS } from '../../data/mockData';
import { CategoryServiceConfig } from '../../types';
import { EXCHANGE_RATE_USD_TO_SLSH } from '../../utils/geo';

export const PricingSurgeControl: React.FC = () => {
  const { pricing, updatePricing } = useRide();
  const [formData, setFormData] = useState({
    ...pricing,
    categoryConfigs: pricing.categoryConfigs || DEFAULT_CATEGORY_CONFIGS,
  });
  const [activeTab, setActiveTab] = useState<'wadaage_share' | 'wadaage_taxi'>('wadaage_share');
  const [savedMessage, setSavedMessage] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updatePricing(formData);
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2500);
  };

  const updateCategoryConfig = (
    catKey: string,
    field: keyof CategoryServiceConfig,
    value: any
  ) => {
    const current = formData.categoryConfigs?.[catKey];
    if (!current) return;

    setFormData({
      ...formData,
      categoryConfigs: {
        ...formData.categoryConfigs,
        [catKey]: {
          ...current,
          [field]: value,
        },
      },
    });
  };

  const updateCategoryRule = (
    catKey: string,
    ruleKey: string,
    value: any
  ) => {
    const current = formData.categoryConfigs?.[catKey];
    if (!current) return;

    setFormData({
      ...formData,
      categoryConfigs: {
        ...formData.categoryConfigs,
        [catKey]: {
          ...current,
          rules: {
            ...current.rules,
            [ruleKey]: value,
          },
        },
      },
    });
  };

  const activeCategory = formData.categoryConfigs?.[activeTab] || DEFAULT_CATEGORY_CONFIGS[activeTab];

  const categoryTabList = [
    {
      id: 'wadaage_share' as const,
      name: 'Wadaage Share',
      somaliName: 'Gaadhi Wadaag',
      icon: Users,
      badgeColor: 'bg-emerald-500 text-slate-950',
    },
    {
      id: 'wadaage_taxi' as const,
      name: 'Normal Taxi',
      somaliName: 'Taaksi Caadi ah',
      icon: Car,
      badgeColor: 'bg-blue-500 text-white',
    },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xl space-y-5">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
              Services & Fleet Control Center
            </h3>
            <p className="text-xs text-slate-500">
              Configure rates, rules, commission & dispatch behavior for all 5 Wadaage service categories
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* City-Wide Global Surge Slider */}
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-4 rounded-2xl border border-amber-500/20 space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-amber-900 dark:text-amber-200 flex items-center space-x-1.5 uppercase tracking-wider">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>City-Wide Base Surge Multiplier</span>
            </label>
            <span className="font-mono font-black text-amber-600 dark:text-amber-400 text-lg">
              {formData.currentSurgeMultiplier.toFixed(2)}x
            </span>
          </div>
          <input
            type="range"
            min="1.0"
            max="3.0"
            step="0.05"
            value={formData.currentSurgeMultiplier}
            onChange={(e) =>
              setFormData({ ...formData, currentSurgeMultiplier: parseFloat(e.target.value) })
            }
            className="w-full accent-amber-500 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-amber-700 dark:text-amber-300 font-medium">
            <span>1.0x (Standard Fare)</span>
            <span>1.5x (Moderate Rush)</span>
            <span>2.5x (Heavy Rain / Event Peak)</span>
            <span>3.0x (Max Emergency Surge)</span>
          </div>
        </div>

        {/* Category Tabs Bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-500" />
              Select Service Category to Manage:
            </span>
            <span className="text-[11px] text-slate-500">5 Services Active</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {categoryTabList.map((tab) => {
              const IconComp = tab.icon;
              const isSelected = activeTab === tab.id;
              const config = formData.categoryConfigs?.[tab.id];
              const isEnabled = config?.enabled !== false;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`p-3 rounded-2xl text-left border transition-all flex flex-col justify-between space-y-2 relative overflow-hidden ${
                    isSelected
                      ? 'bg-slate-900 text-white border-emerald-500 shadow-lg ring-2 ring-emerald-500/20'
                      : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700/80 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`p-1.5 rounded-xl ${tab.badgeColor} font-black`}>
                      <IconComp className="w-4 h-4" />
                    </span>
                    <span
                      className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                        isEnabled
                          ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {isEnabled ? 'ACTIVE' : 'OFFLINE'}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-black text-xs">{tab.name}</h4>
                    <p className="text-[10px] text-slate-400 truncate">{tab.somaliName}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Service Detail Control Panel */}
        {activeCategory && (
          <div className="bg-slate-950 text-white p-4 rounded-2xl border border-slate-800 space-y-4">
            {/* Header & Status Toggle */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="text-base font-black text-white">{activeCategory.name}</h4>
                  <span className="text-xs text-slate-400 font-medium">({activeCategory.somaliName})</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure real-time fare structure, driver commission, surge overrides & dispatch rules.
                </p>
              </div>

              {/* Service Status Mode Switch */}
              <div className="flex items-center space-x-1.5 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => updateCategoryConfig(activeTab, 'statusMode', 'active')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    activeCategory.statusMode === 'active'
                      ? 'bg-emerald-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Active
                </button>
                <button
                  type="button"
                  onClick={() => updateCategoryConfig(activeTab, 'statusMode', 'surge_only')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    activeCategory.statusMode === 'surge_only'
                      ? 'bg-amber-500 text-slate-950 shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Peak/Surge Only
                </button>
                <button
                  type="button"
                  onClick={() => updateCategoryConfig(activeTab, 'statusMode', 'suspended')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    activeCategory.statusMode === 'suspended'
                      ? 'bg-rose-500 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Suspended
                </button>
              </div>
            </div>

            {/* Financials & Rates Grid */}
            <div className="space-y-2">
              <span className="text-[11px] font-black uppercase text-emerald-400 tracking-wider block">
                1. Fare Rates & Financial Parameters
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                  <label className="text-slate-400 font-bold block">Base Fare ($ USD)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                    <input
                      type="number"
                      step="0.25"
                      value={activeCategory.baseFareUsd}
                      onChange={(e) =>
                        updateCategoryConfig(activeTab, 'baseFareUsd', parseFloat(e.target.value) || 0)
                      }
                      className="w-full bg-slate-800 border border-slate-700 pl-7 pr-2 py-1.5 rounded-lg font-mono font-bold text-emerald-400 outline-none"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500">
                    ≈ {Math.round(activeCategory.baseFareUsd * EXCHANGE_RATE_USD_TO_SLSH).toLocaleString()} SLSH
                  </span>
                </div>

                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-400 font-bold block">Per-KM Rate ($ USD)</label>
                    <span className="text-[10px] text-emerald-400 font-bold font-mono">
                      ≈ {Math.round(activeCategory.perKmRateUsd * EXCHANGE_RATE_USD_TO_SLSH).toLocaleString()} SLSH/km
                    </span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={activeCategory.perKmRateUsd}
                      onChange={(e) =>
                        updateCategoryConfig(activeTab, 'perKmRateUsd', parseFloat(e.target.value) || 0)
                      }
                      className="w-full bg-slate-800 border border-slate-700 pl-7 pr-2 py-1.5 rounded-lg font-mono font-bold text-white outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => updateCategoryConfig(activeTab, 'perKmRateUsd', 0.40)}
                      className="text-[9px] font-extrabold bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 px-1.5 py-0.5 rounded border border-emerald-500/30 transition"
                    >
                      $0.40 (4,000 SLSH Share)
                    </button>
                    <button
                      type="button"
                      onClick={() => updateCategoryConfig(activeTab, 'perKmRateUsd', 0.70)}
                      className="text-[9px] font-extrabold bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 px-1.5 py-0.5 rounded border border-yellow-500/30 transition"
                    >
                      $0.70 (7,000 SLSH Taxi)
                    </button>
                  </div>
                </div>

                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                  <label className="text-slate-400 font-bold block">Per-Minute Rate ($ USD)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                    <input
                      type="number"
                      step="0.05"
                      value={activeCategory.perMinuteRateUsd}
                      onChange={(e) =>
                        updateCategoryConfig(activeTab, 'perMinuteRateUsd', parseFloat(e.target.value) || 0)
                      }
                      className="w-full bg-slate-800 border border-slate-700 pl-7 pr-2 py-1.5 rounded-lg font-mono font-bold text-white outline-none"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500">Traffic duration charge</span>
                </div>

                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                  <label className="text-slate-400 font-bold block">Minimum Fare ($ USD)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                    <input
                      type="number"
                      step="0.25"
                      value={activeCategory.minFareUsd}
                      onChange={(e) =>
                        updateCategoryConfig(activeTab, 'minFareUsd', parseFloat(e.target.value) || 0)
                      }
                      className="w-full bg-slate-800 border border-slate-700 pl-7 pr-2 py-1.5 rounded-lg font-mono font-bold text-amber-400 outline-none"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500">Floor price per trip</span>
                </div>

                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                  <label className="text-slate-400 font-bold block">Category Surge Override</label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.05"
                      value={activeCategory.categorySurgeMultiplier}
                      onChange={(e) =>
                        updateCategoryConfig(
                          activeTab,
                          'categorySurgeMultiplier',
                          parseFloat(e.target.value) || 1.0
                        )
                      }
                      className="w-full bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg font-mono font-bold text-amber-300 outline-none"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500">Category relative surge</span>
                </div>

                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                  <label className="text-slate-400 font-bold block">Driver Commission (%)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">%</span>
                    <input
                      type="number"
                      step="1"
                      value={activeCategory.driverCommissionPercent}
                      onChange={(e) =>
                        updateCategoryConfig(
                          activeTab,
                          'driverCommissionPercent',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-full bg-slate-800 border border-slate-700 pl-7 pr-2 py-1.5 rounded-lg font-mono font-bold text-emerald-400 outline-none"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500">Platform take-rate</span>
                </div>

                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                  <label className="text-slate-400 font-bold block">Cancellation Fee ($ USD)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                    <input
                      type="number"
                      step="0.25"
                      value={activeCategory.cancellationFeeUsd}
                      onChange={(e) =>
                        updateCategoryConfig(
                          activeTab,
                          'cancellationFeeUsd',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-full bg-slate-800 border border-slate-700 pl-7 pr-2 py-1.5 rounded-lg font-mono font-bold text-rose-400 outline-none"
                    />
                  </div>
                  <span className="text-[10px] text-slate-500">Late cancellation penalty</span>
                </div>

                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                  <label className="text-slate-400 font-bold block">Max Vehicle Capacity</label>
                  <input
                    type="number"
                    step="1"
                    value={activeCategory.maxPassengers}
                    onChange={(e) =>
                      updateCategoryConfig(activeTab, 'maxPassengers', parseInt(e.target.value, 10) || 1)
                    }
                    className="w-full bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg font-mono font-bold text-white outline-none"
                  />
                  <span className="text-[10px] text-slate-500">Max passengers/seats</span>
                </div>
              </div>
            </div>

            {/* Dispatch & Search Settings */}
            <div className="space-y-2">
              <span className="text-[11px] font-black uppercase text-blue-400 tracking-wider block">
                2. Fleet Dispatch & Matching Radius
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-slate-200 font-bold block">Driver Dispatch Search Radius</label>
                      <span className="text-[10px] text-blue-400 font-medium">
                        Strict GPS Distance Limit
                      </span>
                    </div>
                    <span className="text-blue-400 font-mono font-black text-sm bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800">
                      {activeCategory.dispatchRadiusKm} KM
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="20"
                    step="0.5"
                    value={activeCategory.dispatchRadiusKm}
                    onChange={(e) =>
                      updateCategoryConfig(activeTab, 'dispatchRadiusKm', parseFloat(e.target.value) || 1.0)
                    }
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {[1.0, 2.0, 3.0, 5.0, 10.0].map((radius) => (
                      <button
                        key={radius}
                        type="button"
                        onClick={() => updateCategoryConfig(activeTab, 'dispatchRadiusKm', radius)}
                        className={`text-[10px] font-bold px-2 py-1 rounded-lg border transition ${
                          activeCategory.dispatchRadiusKm === radius
                            ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                            : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        {radius === 1.0 ? '🎯 1.0 KM (Strict)' : `${radius} KM`}
                      </button>
                    ))}
                  </div>
                  <div className="p-2 rounded-lg bg-blue-950/40 border border-blue-900/50 text-[10px] text-blue-200 flex items-start gap-1.5">
                    <span>🛡️</span>
                    <span>
                      Drivers further than <b>{activeCategory.dispatchRadiusKm} KM</b> from pickup GPS will strictly <b>NOT receive</b> any order alerts.
                    </span>
                  </div>
                </div>

                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-300 font-bold">Max Pickup Waiting Grace Time</label>
                    <span className="text-amber-400 font-mono font-bold">
                      {activeCategory.maxWaitTimeMins} Minutes
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="15"
                    step="1"
                    value={activeCategory.maxWaitTimeMins}
                    onChange={(e) =>
                      updateCategoryConfig(activeTab, 'maxWaitTimeMins', parseInt(e.target.value, 10) || 3)
                    }
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <p className="text-[10px] text-slate-400">
                    Driver waiting time before no-show cancellation fee applies.
                  </p>
                </div>
              </div>
            </div>

            {/* Advanced Algorithm Rules (Category Tailored) */}
            <div className="space-y-2">
              <span className="text-[11px] font-black uppercase text-amber-400 tracking-wider block">
                3. Advanced Operational & Service Rules
              </span>

              {/* Wadaage Share Custom Rules */}
              {activeTab === 'wadaage_share' && (
                <div className="bg-emerald-950/40 p-3.5 rounded-xl border border-emerald-500/30 space-y-3">
                  <h5 className="font-extrabold text-xs text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-4 h-4" />
                    Wadaage Share (Gaadhi Wadaag) Carpool Rules
                  </h5>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="text-slate-300 font-bold block mb-1">Max Seats Per Booking</label>
                      <select
                        value={activeCategory.rules.maxSeatsPerBooking || 2}
                        onChange={(e) =>
                          updateCategoryRule('wadaage_share', 'maxSeatsPerBooking', parseInt(e.target.value, 10))
                        }
                        className="w-full bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-lg text-white font-bold outline-none"
                      >
                        <option value={1}>1 Seat Only</option>
                        <option value={2}>Max 2 Seats (Rider + 1 Friend)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-slate-300 font-bold block mb-1">Max Detour SLA Limit</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={activeCategory.rules.maxDetourMins || 10}
                          onChange={(e) =>
                            updateCategoryRule('wadaage_share', 'maxDetourMins', parseInt(e.target.value, 10))
                          }
                          className="w-full bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-lg text-white font-bold outline-none"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">mins</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-slate-300 font-bold block mb-1">Co-Rider Toll Split %</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={activeCategory.rules.coPassengerTollSplitPercent || 50}
                          onChange={(e) =>
                            updateCategoryRule('wadaage_share', 'coPassengerTollSplitPercent', parseInt(e.target.value, 10))
                          }
                          className="w-full bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-lg text-white font-bold outline-none"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">%</span>
                      </div>
                    </div>
                  </div>

                  {/* Flow Matching & Dynamic Stacking Controls */}
                  <div className="pt-3 border-t border-emerald-500/20 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <label className="text-emerald-300 font-bold block mb-1">
                        Batching Pool Window (Sec)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={pricing.batchingWindowSeconds ?? 60}
                          onChange={(e) =>
                            updatePricing({ batchingWindowSeconds: parseInt(e.target.value, 10) || 60 })
                          }
                          className="w-full bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-lg text-white font-bold outline-none"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">sec</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">Pre-dispatch holding time to match 2 riders.</p>
                    </div>

                    <div>
                      <label className="text-emerald-300 font-bold block mb-1">
                        Max Heading Divergence
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={pricing.maxHeadingDivergenceDegrees ?? 45}
                          onChange={(e) =>
                            updatePricing({ maxHeadingDivergenceDegrees: parseInt(e.target.value, 10) || 45 })
                          }
                          className="w-full bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-lg text-white font-bold outline-none"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">deg (&le;45&deg;)</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">Corridor vector bearing alignment limit.</p>
                    </div>

                    <div>
                      <label className="text-emerald-300 font-bold block mb-1">
                        In-Trip Stacking Bonus ($)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.25"
                          value={pricing.driverStackedBonusUsd ?? 1.50}
                          onChange={(e) =>
                            updatePricing({ driverStackedBonusUsd: parseFloat(e.target.value) || 1.50 })
                          }
                          className="w-full bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-lg text-emerald-400 font-bold outline-none"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">USD</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">Driver incentive per stacked co-rider.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Wadaage Taxi Custom Rules */}
              {activeTab === 'wadaage_taxi' && (
                <div className="bg-yellow-950/40 p-3.5 rounded-xl border border-yellow-500/30 space-y-3">
                  <h5 className="font-extrabold text-xs text-yellow-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Navigation className="w-4 h-4" />
                    Wadaage Metered Taxi Regulations
                  </h5>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="flex items-center space-x-2 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      <input
                        type="checkbox"
                        id="taximeterModeCheck"
                        checked={activeCategory.rules.taximeterMode !== false}
                        onChange={(e) =>
                          updateCategoryRule('wadaage_taxi', 'taximeterMode', e.target.checked)
                        }
                        className="w-4 h-4 accent-yellow-500 rounded cursor-pointer"
                      />
                      <label htmlFor="taximeterModeCheck" className="text-slate-200 font-bold cursor-pointer">
                        Digital Taximeter Live Fare Calculation Enabled
                      </label>
                    </div>

                    <div className="flex items-center space-x-2 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      <input
                        type="checkbox"
                        id="permitCheck"
                        checked={!!activeCategory.rules.permitRequired}
                        onChange={(e) =>
                          updateCategoryRule('wadaage_taxi', 'permitRequired', e.target.checked)
                        }
                        className="w-4 h-4 accent-yellow-500 rounded cursor-pointer"
                      />
                      <label htmlFor="permitCheck" className="text-slate-200 font-bold cursor-pointer">
                        Require Municipal City Council Taxi Permit Verification
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Wadaage Normal Car Custom Rules */}
              {(activeTab as string) === 'wadaage_car' && (
                <div className="bg-blue-950/40 p-3.5 rounded-xl border border-blue-500/30 space-y-3">
                  <h5 className="font-extrabold text-xs text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Car className="w-4 h-4" />
                    Wadaage Normal Private Sedan Controls
                  </h5>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="flex items-center space-x-2 bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                      <input
                        type="checkbox"
                        id="autoAssignCheck"
                        checked={activeCategory.rules.autoAssignNearest !== false}
                        onChange={(e) =>
                          updateCategoryRule('wadaage_car', 'autoAssignNearest', e.target.checked)
                        }
                        className="w-4 h-4 accent-blue-500 rounded cursor-pointer"
                      />
                      <label htmlFor="autoAssignCheck" className="text-slate-200 font-bold cursor-pointer">
                        Auto-Assign Nearest Driver Instantly
                      </label>
                    </div>

                    <div>
                      <label className="text-slate-300 font-bold block mb-1">Cancellation Grace Period</label>
                      <div className="relative">
                        <input
                          type="number"
                          value={activeCategory.rules.graceCancellationMins || 3}
                          onChange={(e) =>
                            updateCategoryRule('wadaage_car', 'graceCancellationMins', parseInt(e.target.value, 10))
                          }
                          className="w-full bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-lg text-white font-bold outline-none"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">mins</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Driver Prepaid Wallet Commission Rules Section */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-white space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded bg-emerald-500 text-slate-950 font-black text-[10px] uppercase">
                PREPAID COMMISSION ENGINE
              </span>
              <h4 className="font-extrabold text-xs text-white uppercase tracking-wider">
                Driver Wallet Rules & Low-Balance Lockout Thresholds
              </h4>
            </div>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              Active Across All Categories
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
              <label className="font-bold text-slate-300 block">
                Flat Fee Per Completed Trip ($ / SOS)
              </label>
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                  <input
                    type="number"
                    step="0.05"
                    value={formData.driverCommissionFeeUsd || 0.10}
                    onChange={(e) => setFormData({ ...formData, driverCommissionFeeUsd: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-800 border border-slate-700 pl-7 pr-3 py-1.5 rounded-lg text-emerald-400 font-mono font-bold outline-none"
                  />
                </div>
                <span className="text-slate-400 text-[10px]">
                  = {((formData.driverCommissionFeeUsd || 0.10) * 10000).toLocaleString()} SOS
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                System automatically deducts this flat fee from driver prepaid wallet after trip completion.
              </p>
            </div>

            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
              <label className="font-bold text-slate-300 block">
                Minimum Wallet Balance Threshold ($ / SOS)
              </label>
              <div className="flex items-center space-x-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">$</span>
                  <input
                    type="number"
                    step="0.05"
                    value={formData.driverMinWalletThresholdUsd || 0.20}
                    onChange={(e) => setFormData({ ...formData, driverMinWalletThresholdUsd: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-800 border border-slate-700 pl-7 pr-3 py-1.5 rounded-lg text-amber-400 font-mono font-bold outline-none"
                  />
                </div>
                <span className="text-slate-400 text-[10px]">
                  = {((formData.driverMinWalletThresholdUsd || 0.20) * 10000).toLocaleString()} SOS
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                If driver balance drops below this minimum, driver status is locked to Blocked/Offline.
              </p>
            </div>
          </div>
        </div>

        {savedMessage && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 animate-bounce">
            <Check className="w-4 h-4" />
            <span>Service category pricing matrix and operational rules updated across network!</span>
          </div>
        )}

        <button
          type="submit"
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black py-3.5 rounded-xl text-xs uppercase tracking-wider shadow-lg flex items-center justify-center space-x-2"
        >
          <Save className="w-4 h-4" />
          <span>APPLY NEW SERVICE & PRICING CONFIGURATION</span>
        </button>
      </form>
    </div>
  );
};
