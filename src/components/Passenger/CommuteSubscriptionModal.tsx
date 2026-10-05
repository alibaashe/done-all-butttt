import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  Repeat,
  Trash2,
  Check,
  X,
  ShieldCheck,
  Tag,
  QrCode,
  Sparkles,
  Ticket,
  Wallet,
  CheckCircle2,
} from 'lucide-react';
import { useRide } from '../../context/RideContext';
import { CITY_LOCATIONS, INITIAL_COMMUTER_PASSES } from '../../data/mockData';
import { CommuterPass, LocationNode, UserCommuterPass } from '../../types';

interface CommuteSubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CommuteSubscriptionModal: React.FC<CommuteSubscriptionModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    multiStops,
    setMultiStops,
    isSubscriptionCommute,
    setIsSubscriptionCommute,
    userPasses,
    purchaseCommuterPass,
  } = useRide();

  const [selectedDays, setSelectedDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const [pickupTime, setPickupTime] = useState('08:30');
  const [activeTab, setActiveTab] = useState<'passes' | 'my_active_passes' | 'stops' | 'subscription'>('passes');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [selectedPaymentForPass, setSelectedPaymentForPass] = useState<'zaad' | 'edahab' | 'wallet'>('zaad');
  const [purchasingPass, setPurchasingPass] = useState<CommuterPass | null>(null);
  const [activeQrModalPass, setActiveQrModalPass] = useState<UserCommuterPass | null>(null);

  if (!isOpen) return null;

  const daysList = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const toggleDay = (day: string) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  const addIntermediateStop = (loc: LocationNode) => {
    if (multiStops.length >= 3) return; // Limit up to 3 stops
    if (multiStops.some((s) => s.id === loc.id)) return;
    setMultiStops([...multiStops, loc]);
  };

  const removeStop = (id: string) => {
    setMultiStops(multiStops.filter((s) => s.id !== id));
  };

  const handleSaveSubscription = () => {
    setIsSubscriptionCommute(true);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1500);
  };

  const handleExecutePurchase = (pass: CommuterPass) => {
    const res = purchaseCommuterPass(pass, selectedPaymentForPass);
    if (res.success && res.pass) {
      setPurchasingPass(null);
      setActiveQrModalPass(res.pass);
      setActiveTab('my_active_passes');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 relative overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-teal-600 to-emerald-600 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base tracking-tight">Wadaage Pass & Commuter Hub</h3>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Save up to 55%
                </span>
              </div>
              <p className="text-xs text-white/80">
                Pre-paid bundle passes, recurring automated taxis, & multi-stop routes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle Navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 px-4 pt-3 overflow-x-auto gap-1">
          <button
            onClick={() => setActiveTab('passes')}
            className={`pb-3 px-3 font-bold text-xs border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'passes'
                ? 'border-teal-500 text-teal-600 dark:text-teal-400 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            Buy Commuter Pass
          </button>
          <button
            onClick={() => setActiveTab('my_active_passes')}
            className={`pb-3 px-3 font-bold text-xs border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'my_active_passes'
                ? 'border-teal-500 text-teal-600 dark:text-teal-400 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            My Active Passes ({userPasses.filter((p) => p.status === 'active' && p.remainingTrips > 0).length})
          </button>
          <button
            onClick={() => setActiveTab('stops')}
            className={`pb-3 px-3 font-bold text-xs border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'stops'
                ? 'border-teal-500 text-teal-600 dark:text-teal-400 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Repeat className="w-3.5 h-3.5" />
            Multi-Stop ({multiStops.length}/3)
          </button>
          <button
            onClick={() => setActiveTab('subscription')}
            className={`pb-3 px-3 font-bold text-xs border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'subscription'
                ? 'border-teal-500 text-teal-600 dark:text-teal-400 font-extrabold'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Daily Dispatch Schedule
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* TAB 1: PASSES STORE */}
          {activeTab === 'passes' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/40 rounded-2xl flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-teal-500 flex-shrink-0" />
                <p className="text-xs text-teal-900 dark:text-teal-300">
                  <span className="font-bold">Zero Surge & Instant Savings:</span> Pre-pay for 10, 20, 30, or 40 rides at locked wholesale rates. Tap once to book without payment friction.
                </p>
              </div>

              {/* Passes List */}
              <div className="space-y-3">
                {INITIAL_COMMUTER_PASSES.map((pass) => {
                  const isOwned = userPasses.some((up) => up.passId === pass.id && up.remainingTrips > 0);
                  return (
                    <div
                      key={pass.id}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 hover:border-teal-500/50 transition relative overflow-hidden"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                              {pass.badge}
                            </span>
                            <span className="text-[10px] text-slate-500 font-semibold">
                              Valid {pass.validityDays} Days
                            </span>
                          </div>
                          <h4 className="font-extrabold text-sm text-slate-900 dark:text-white mt-1">
                            {pass.name}
                          </h4>
                          <p className="text-xs font-medium text-teal-600 dark:text-teal-400 mt-0.5">
                            {pass.corridor}
                          </p>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                            {pass.description}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0 ml-3">
                          <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                            ${pass.priceUsd.toFixed(2)}
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            {pass.priceSos.toLocaleString()} SLSH
                          </span>
                          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                            Save {pass.savingsPercent}%
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {pass.totalTrips} Total Pre-Paid Trips ({Math.round((pass.priceUsd / pass.totalTrips) * 100) / 100}$ / trip)
                        </span>

                        {isOwned ? (
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Pass Active
                          </span>
                        ) : (
                          <button
                            onClick={() => setPurchasingPass(pass)}
                            className="px-3.5 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-slate-950 font-black text-xs transition shadow-sm"
                          >
                            Subscribe Now
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Purchase Modal Overlay */}
              {purchasingPass && (
                <div className="p-4 bg-slate-900 text-white rounded-2xl border border-teal-500/50 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="font-black text-sm text-teal-300">
                      Confirm Subscription: {purchasingPass.name}
                    </h4>
                    <button
                      onClick={() => setPurchasingPass(null)}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-300">
                    Total: <span className="font-bold text-emerald-400">${purchasingPass.priceUsd.toFixed(2)} ({purchasingPass.priceSos.toLocaleString()} SLSH)</span> for {purchasingPass.totalTrips} trips.
                  </p>

                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">
                      Choose Instant Mobile Payment
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'zaad', name: 'ZAAD Telesom' },
                        { id: 'edahab', name: 'eDahab Somtel' },
                        { id: 'wallet', name: 'Wadaage Wallet' },
                      ].map((m) => (
                        <button
                          key={m.id}
                          onClick={() => setSelectedPaymentForPass(m.id as any)}
                          className={`p-2 rounded-xl text-xs font-bold border text-center transition ${
                            selectedPaymentForPass === m.id
                              ? 'border-teal-400 bg-teal-500/20 text-teal-300'
                              : 'border-slate-700 text-slate-400 hover:border-slate-600'
                          }`}
                        >
                          {m.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => handleExecutePurchase(purchasingPass)}
                    className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-xl text-xs transition"
                  >
                    Confirm & Activate Commuter Pass
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: MY ACTIVE PASSES */}
          {activeTab === 'my_active_passes' && (
            <div className="space-y-4">
              {userPasses.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  <Ticket className="w-10 h-10 mx-auto text-slate-500 mb-2 opacity-50" />
                  No active commuter passes yet. Browse available packages in the store.
                </div>
              ) : (
                userPasses.map((p) => {
                  const percentage = Math.round((p.remainingTrips / p.totalTrips) * 100);
                  return (
                    <div
                      key={p.id}
                      className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 text-white border border-slate-800 shadow-lg space-y-3"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-mono text-teal-400 uppercase tracking-widest block">
                            ACTIVE COMMUTER PASS
                          </span>
                          <h4 className="font-black text-base text-white">{p.passName}</h4>
                          <p className="text-xs text-slate-400 mt-0.5">{p.corridor}</p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-xs border border-emerald-500/30">
                          {p.remainingTrips} Trips Left
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div>
                        <div className="flex justify-between text-[11px] font-medium text-slate-400 mb-1">
                          <span>Usage: {p.totalTrips - p.remainingTrips} of {p.totalTrips} used</span>
                          <span>{percentage}% remaining</span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800">
                        <span className="text-slate-400 text-[11px]">Expires on {p.expiresAt}</span>
                        <button
                          onClick={() => setActiveQrModalPass(p)}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-teal-300 font-bold text-xs flex items-center gap-1.5"
                        >
                          <QrCode className="w-3.5 h-3.5" /> Show Digital QR Pass
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 3: MULTI-STOPS */}
          {activeTab === 'stops' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">
                Add intermediate dropoffs along your ride route (e.g. drop off family, pick up parcels, errands).
              </p>

              {/* Current Added Stops */}
              <div className="space-y-2">
                {multiStops.length === 0 ? (
                  <div className="p-4 border border-dashed border-slate-300 dark:border-slate-800 rounded-xl text-center text-xs text-slate-400">
                    No extra stops added yet. Choose a landmark below to add a waypoint.
                  </div>
                ) : (
                  multiStops.map((stop, idx) => (
                    <div
                      key={stop.id}
                      className="flex items-center justify-between p-3 bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/40 rounded-xl text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-teal-500 text-slate-950 font-black flex items-center justify-center text-[10px]">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="font-bold">{stop.name}</p>
                          <p className="text-[10px] text-slate-500">{stop.address}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeStop(stop.id)}
                        className="text-slate-400 hover:text-red-500 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Add Available Stops */}
              {multiStops.length < 3 && (
                <div className="pt-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                    Available Landmarks
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {CITY_LOCATIONS.slice(2, 8).map((loc) => {
                      const added = multiStops.some((s) => s.id === loc.id);
                      return (
                        <button
                          key={loc.id}
                          disabled={added}
                          onClick={() => addIntermediateStop(loc)}
                          className={`p-2 rounded-xl text-left border text-xs flex items-center justify-between transition ${
                            added
                              ? 'bg-slate-100 dark:bg-slate-800 border-transparent text-slate-400 cursor-not-allowed'
                              : 'border-slate-200 dark:border-slate-800 hover:border-teal-500 text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          <span className="truncate pr-1">{loc.name}</span>
                          <Plus className="w-3.5 h-3.5 text-teal-500 flex-shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: RECURRING SUBSCRIPTION SCHEDULE */}
          {activeTab === 'subscription' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">
                Automate your daily commute shared taxi. Same driver, same time, guaranteed seats & zero surge pricing.
              </p>

              {/* Select Days */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-2 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-teal-500" />
                  Select Recurring Commute Days
                </label>
                <div className="flex gap-1.5 justify-between">
                  {daysList.map((day) => {
                    const active = selectedDays.includes(day);
                    return (
                      <button
                        key={day}
                        onClick={() => toggleDay(day)}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition ${
                          active
                            ? 'bg-teal-500 text-slate-950 font-black shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Picker */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-teal-500" />
                  Daily Pickup Schedule
                </label>
                <input
                  type="time"
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm font-bold focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="p-3 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/40 rounded-xl text-xs text-teal-800 dark:text-teal-300 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 flex-shrink-0 text-teal-500" />
                <span>Includes auto-dispatch guarantee & VIP shared seat priority for commute subscribers.</span>
              </div>

              <button
                onClick={handleSaveSubscription}
                className="w-full py-3 bg-teal-500 hover:bg-teal-600 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-teal-500/20 transition"
              >
                {savedSuccess ? (
                  <>
                    <Check className="w-4 h-4 text-slate-950" />
                    Commute Preferences Saved!
                  </>
                ) : (
                  'Save Route & Schedule'
                )}
              </button>
            </div>
          )}
        </div>

        {/* QR Code Modal Overlay */}
        {activeQrModalPass && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in zoom-in-95 duration-200">
            <div className="bg-slate-900 text-white rounded-3xl max-w-sm w-full p-6 border border-slate-800 text-center relative shadow-2xl">
              <button
                onClick={() => setActiveQrModalPass(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center mx-auto mb-3">
                <QrCode className="w-6 h-6" />
              </div>

              <h4 className="font-extrabold text-base">{activeQrModalPass.passName}</h4>
              <p className="text-xs text-teal-400 font-semibold mt-0.5">{activeQrModalPass.corridor}</p>

              <div className="my-5 p-4 bg-white rounded-2xl inline-block mx-auto">
                <QrCode className="w-36 h-36 text-slate-950" />
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>Pass Code:</span>
                  <span className="font-mono text-white font-bold">{activeQrModalPass.qrCode}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Trips Available:</span>
                  <span className="font-bold text-emerald-400">{activeQrModalPass.remainingTrips} Trips</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Valid Until:</span>
                  <span className="font-bold text-white">{activeQrModalPass.expiresAt}</span>
                </div>
              </div>

              <button
                onClick={() => setActiveQrModalPass(null)}
                className="w-full mt-4 py-2.5 bg-teal-500 hover:bg-teal-600 text-slate-950 font-black rounded-xl text-xs transition"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
