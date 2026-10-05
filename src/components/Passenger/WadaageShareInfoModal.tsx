import React, { useState } from 'react';
import {
  Users,
  ShieldCheck,
  Clock,
  Briefcase,
  Layers,
  Sparkles,
  X,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  HelpCircle,
  Car,
  Receipt,
  MapPin,
  HelpCircle as QuestionIcon
} from 'lucide-react';

interface WadaageShareInfoModalProps {
  onClose: () => void;
}

export const WadaageShareInfoModal: React.FC<WadaageShareInfoModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'how_it_works' | 'rules' | 'tolls_luggage' | 'architecture'>('how_it_works');

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden text-slate-900 dark:text-white my-auto animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 p-5 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-black shadow-inner">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-extrabold text-white">Wadaage Share (Gaadhi Wadaag)</h3>
                <span className="bg-white/20 text-white text-[10px] font-black px-2 py-0.5 rounded-full border border-white/30 uppercase">
                  Hasta 30% Dhimis
                </span>
              </div>
              <p className="text-xs text-emerald-100">Smart Taxi-Sharing & Carpooling Guidelines • Habka Wadaagga</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-slate-100 dark:bg-slate-950/80 p-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('how_it_works')}
            className={`flex-1 py-2 px-2.5 rounded-xl font-extrabold text-[11px] sm:text-xs flex items-center justify-center space-x-1.5 transition-all shrink-0 ${
              activeTab === 'how_it_works'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>How It Works</span>
          </button>

          <button
            onClick={() => setActiveTab('rules')}
            className={`flex-1 py-2 px-2.5 rounded-xl font-extrabold text-[11px] sm:text-xs flex items-center justify-center space-x-1.5 transition-all shrink-0 ${
              activeTab === 'rules'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Rider Rules</span>
          </button>

          <button
            onClick={() => setActiveTab('tolls_luggage')}
            className={`flex-1 py-2 px-2.5 rounded-xl font-extrabold text-[11px] sm:text-xs flex items-center justify-center space-x-1.5 transition-all shrink-0 ${
              activeTab === 'tolls_luggage'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            <span>Tolls & Luggage</span>
          </button>

          <button
            onClick={() => setActiveTab('architecture')}
            className={`flex-1 py-2 px-2.5 rounded-xl font-extrabold text-[11px] sm:text-xs flex items-center justify-center space-x-1.5 transition-all shrink-0 ${
              activeTab === 'architecture'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Backend Matrix</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-5 space-y-4 max-h-[65vh] overflow-y-auto">

          {/* TAB 1: HOW IT WORKS */}
          {activeTab === 'how_it_works' && (
            <div className="space-y-4">
              <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-2xl flex items-start space-x-3">
                <Receipt className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">Fixed Upfront Fare Guarantee (Qiimaha Go'an)</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                    The discounted price shown when booking is <b>100% locked in</b>. Even if Wadaage Share is unable to pair you with a co-rider during your route, you still enjoy a solo private ride at the discounted rate!
                  </p>
                </div>
              </div>

              {/* 5-Step Process */}
              <div className="space-y-3">
                <h4 className="font-black text-xs text-slate-400 uppercase tracking-wider">Step-by-Step Journey Flow</h4>

                <div className="grid grid-cols-1 gap-2.5">
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 flex items-start space-x-3">
                    <div className="w-7 h-7 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center shrink-0">
                      1
                    </div>
                    <div className="text-xs space-y-0.5">
                      <h5 className="font-extrabold text-slate-900 dark:text-white">Select Wadaage Share Option</h5>
                      <p className="text-slate-600 dark:text-slate-300">
                        Enter pickup & dropoff points and tap <b>Wadaage Share</b> in vehicle options to get up to 30% savings.
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 flex items-start space-x-3">
                    <div className="w-7 h-7 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center shrink-0">
                      2
                    </div>
                    <div className="text-xs space-y-0.5">
                      <h5 className="font-extrabold text-slate-900 dark:text-white">Smart Route Matchmaking</h5>
                      <p className="text-slate-600 dark:text-slate-300">
                        Our algorithm scans for passengers traveling along a similar route, calculating optimal sequencing to keep detours to an absolute minimum.
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 flex items-start space-x-3">
                    <div className="w-7 h-7 rounded-xl bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center shrink-0">
                      3
                    </div>
                    <div className="text-xs space-y-0.5">
                      <h5 className="font-extrabold text-slate-900 dark:text-white">3-Minute Pickup Window Rule</h5>
                      <p className="text-slate-600 dark:text-slate-300">
                        Drivers wait a maximum of <b>3 minutes</b> at your pickup point. Arriving late risks ride cancellation to protect co-passenger schedules.
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/80 flex items-start space-x-3">
                    <div className="w-7 h-7 rounded-xl bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center shrink-0">
                      4
                    </div>
                    <div className="text-xs space-y-0.5">
                      <h5 className="font-extrabold text-slate-900 dark:text-white">Strict Maximum of Two Stops</h5>
                      <p className="text-slate-600 dark:text-slate-300">
                        To prevent endless detours, a Wadaage Share vehicle carries at most <b>2 separate passenger bookings</b>. You will never experience more than 2 pickups/dropoffs.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ESSENTIAL RIDER RULES */}
          {activeTab === 'rules' && (
            <div className="space-y-3">
              <div className="bg-slate-950 text-white p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center space-x-2 text-emerald-400 font-extrabold text-xs">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Important Rider Guidelines (Xeerarka Rakaabka)</span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex items-start space-x-2.5">
                    <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-white">Same Destination Rule (1.0 KM Maximum):</span>
                      <p className="text-slate-300 text-[11px] mt-0.5">
                        Co-passengers sharing a Wadaage Share ride heading to the same area are matched strictly within a <b>1.0 km maximum destination radius</b> to minimize detour time.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2.5">
                    <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-white">Location Sharing Condition (0.5 KM / On The Way):</span>
                      <p className="text-slate-300 text-[11px] mt-0.5">
                        Live location tracking links for Wadaage Share can only be shared when the driver is <b>on the way</b> or within <b>0.5 km (500 meters)</b> of the passenger pickup location.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2.5">
                    <Users className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-white">Maximum 1 Friend Allowed Per Booking:</span>
                      <p className="text-slate-300 text-[11px] mt-0.5">
                        Each Wadaage Share booking allows you to bring a maximum of <b>1 extra friend</b> (total 2 seats). Both passengers MUST share the exact same pickup and drop-off points.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2.5">
                    <Layers className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-white">Dynamic Routing Order Sequence:</span>
                      <p className="text-slate-300 text-[11px] mt-0.5">
                        Pickup and drop-off order is dictated purely by <b>geographic route geometry</b>, not by who booked first. The second matched passenger may be dropped off before you if it creates the shortest path.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2.5">
                    <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-white">Strict 3-Minute Waiting Timer:</span>
                      <p className="text-slate-300 text-[11px] mt-0.5">
                        Be at the pickup curb when driver arrives! To respect co-riders, drivers cannot wait longer than 3 minutes before marking a no-show.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between">
                <span className="font-bold text-slate-700 dark:text-slate-300">Need more seats or traveling in a group?</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">Book Normal Taxi or VIP Taxi</span>
              </div>
            </div>
          )}

          {/* TAB 3: TOLLS & LUGGAGE */}
          {activeTab === 'tolls_luggage' && (
            <div className="space-y-4">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs">
                  <Receipt className="w-4 h-4" />
                  <span>50 / 50 Automatic Toll Splitting</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  If your journey passes through toll plazas or expressway fees while both separate passenger parties are inside the vehicle, the app automatically <b>splits the toll fee 50/50</b> between both rider accounts.
                </p>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl space-y-2">
                <div className="flex items-center space-x-2 text-amber-500 font-extrabold text-xs">
                  <Briefcase className="w-4 h-4" />
                  <span>Luggage & Bag Constraints</span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300">
                  Because trunk space must be shared between two separate passenger bookings, each rider is allowed <b>maximum 1 small hand-carry bag</b> or handbag per seat.
                </p>
                <div className="bg-amber-500/20 p-2.5 rounded-xl text-[11px] text-amber-200 font-medium">
                  ⚠️ Carrying heavy suitcases, large airport boxes, or bulky items? Please book a standard private <b>Normal Taxi</b> or <b>VIP Taxi</b> instead.
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: BACKEND ARCHITECTURE & FLOW MATRIX */}
          {activeTab === 'architecture' && (
            <div className="space-y-4">
              {/* Section 1: Core Algorithmic Logic */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs space-y-3">
                <div className="flex items-center space-x-2 text-emerald-400 font-extrabold">
                  <Sparkles className="w-4 h-4" />
                  <span>1. Core Algorithmic Matching Engine</span>
                </div>

                <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-2 font-mono text-[11px] text-slate-300">
                  <div className="flex items-center justify-between text-emerald-400 font-bold border-b border-slate-800 pb-1.5">
                    <span>[User A Request] ➔ [Scan Radius] ➔ [Heading Delta &lt; 30°] ➔ [Detour &lt; 12m]</span>
                  </div>
                  <p className="text-slate-400 leading-relaxed text-[10px]">
                    • <b>Direction Vectors:</b> Calculates 3D bearing heading. Rejects riders heading opposite directions even if 500m away.<br />
                    • <b>Detour Threshold:</b> Enforces max 10-15 minute cumulative delay ceiling.<br />
                    • <b>Permutation Routing:</b> Evaluates 4 sequences in real-time (Pick A ➔ Pick B ➔ Drop A ➔ Drop B; Pick A ➔ Pick B ➔ Drop B ➔ Drop A; etc).
                  </p>
                </div>
              </div>

              {/* Section 2: Database & Geo Architecture */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs space-y-2">
                <div className="flex items-center space-x-2 text-teal-400 font-extrabold">
                  <MapPin className="w-4 h-4" />
                  <span>2. Database & Live Geo Tracking</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 space-y-1">
                    <span className="font-bold text-white block">Redis GEO / PostGIS</span>
                    <span className="text-[10px] text-slate-400 block">Sub-millisecond spatial radius queries & active coordinate indexing.</span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 space-y-1">
                    <span className="font-bold text-white block">OSRM / GraphHopper</span>
                    <span className="text-[10px] text-slate-400 block">Open-source matrix routing engine bypassing heavy API cost limits.</span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 space-y-1">
                    <span className="font-bold text-white block">WebSockets (Socket.io)</span>
                    <span className="text-[10px] text-slate-400 block">Simultaneous bidirectional driver tracking streams for both riders.</span>
                  </div>
                </div>
              </div>

              {/* Section 3: Commercial Engine & Seat Inventory */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs space-y-2">
                <div className="flex items-center space-x-2 text-amber-400 font-extrabold">
                  <Clock className="w-4 h-4" />
                  <span>3. Seat Inventory & Matching Buffer Window</span>
                </div>
                <div className="space-y-1.5 text-[11px] text-slate-300">
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex justify-between items-center">
                    <span>🪑 <b>Seat Inventory Control:</b> Select 1 or 2 seats upfront. Locks vehicle capacity to prevent overcrowding.</span>
                    <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded">Enforced</span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex justify-between items-center">
                    <span>⏱️ <b>60-90s Matching Window Queue:</b> Holds request to aggregate matching pool before dispatch.</span>
                    <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded">60s Buffer</span>
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 flex justify-between items-center">
                    <span>🛡️ <b>Fallback Mechanism:</b> Dispatches solo vehicle at discounted Wadaage rate if timer expires without match.</span>
                    <span className="bg-indigo-500/20 text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded">Guaranteed</span>
                  </div>
                </div>
              </div>

              {/* Section 4: Technical Flow Matrix Table */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs space-y-2.5">
                <div className="flex items-center space-x-2 text-emerald-400 font-extrabold">
                  <Receipt className="w-4 h-4" />
                  <span>4. Technical Flow Matrix</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase text-[9px]">
                        <th className="py-2 px-2">Stage</th>
                        <th className="py-2 px-2">Driver App</th>
                        <th className="py-2 px-2">Passenger A App</th>
                        <th className="py-2 px-2">Passenger B App</th>
                        <th className="py-2 px-2">Backend State</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300 text-[10px]">
                      <tr>
                        <td className="py-2 px-2 font-bold text-amber-400">1. Search</td>
                        <td className="py-2 px-2">Waiting for ping</td>
                        <td className="py-2 px-2">Shows "Finding match..."</td>
                        <td className="py-2 px-2">Shows "Finding match..."</td>
                        <td className="py-2 px-2 text-emerald-400">Running radius query</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-2 font-bold text-emerald-400">2. Match</td>
                        <td className="py-2 px-2">Accepts combined trip</td>
                        <td className="py-2 px-2">Shows "Driver coming (with Passenger B)"</td>
                        <td className="py-2 px-2">Shows "Driver coming (after Passenger A)"</td>
                        <td className="py-2 px-2 text-emerald-400">Locks vehicle inventory</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-2 font-bold text-indigo-400">3. Transit</td>
                        <td className="py-2 px-2">Follows waypoint map</td>
                        <td className="py-2 px-2">Sees live ETA updates</td>
                        <td className="py-2 px-2">Sees driver's detour route</td>
                        <td className="py-2 px-2 text-indigo-400">Disables route changes</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-100 dark:bg-slate-950 p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-xs text-slate-500">
            <Users className="w-4 h-4 text-emerald-500" />
            <span>Wadaage Share • Max 2 Bookings • Fixed Upfront Fare</span>
          </div>

          <button
            onClick={onClose}
            className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black px-5 py-2.5 rounded-xl text-xs shadow-md transition-all"
          >
            Got It!
          </button>
        </div>
      </div>
    </div>
  );
};
