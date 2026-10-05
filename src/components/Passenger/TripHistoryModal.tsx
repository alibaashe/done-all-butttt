import { Calendar, Car, Download, FileText, MapPin, Receipt, Star, Search, X, CheckCircle, RotateCcw } from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { useRide } from '../../context/RideContext';
import { formatCurrency } from '../../utils/geo';

interface PastTrip {
  id: string;
  date: string;
  categoryName: string;
  driverName: string;
  driverAvatar: string;
  vehiclePlate: string;
  vehicleModel?: string;
  pickup: string;
  dropoff: string;
  totalFare: number;
  baseFare: number;
  distanceKm: number;
  durationMins: number;
  discount: number;
  paymentMethod: 'wallet' | 'card' | 'cash';
  status: 'completed' | 'cancelled';
  rating?: number;
}

interface TripHistoryModalProps {
  onClose: () => void;
  onRebook?: (pickup: string, dropoff: string) => void;
}

export const TripHistoryModal: React.FC<TripHistoryModalProps> = ({ onClose, onRebook }) => {
  const { allPlatformRides, currentRide, currentUser, setPickupLocation, setDropoffLocation } = useRide();
  const [selectedTrip, setSelectedTrip] = useState<PastTrip | null>(null);
  const [filter, setFilter] = useState<'all' | 'completed' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const allTrips: PastTrip[] = useMemo(() => {
    let list = [...(allPlatformRides || [])];
    if (list.length === 0) {
      try {
        const raw = localStorage.getItem('wadaage_all_rides_history');
        if (raw) list = JSON.parse(raw);
      } catch (_e) {}
    }

    if (currentRide && (currentRide.status === 'completed' || currentRide.status === 'cancelled') && !list.some((r) => r.id === currentRide.id)) {
      list.unshift(currentRide);
    }

    // Filter for current passenger if matching ID/phone exists
    const passengerPhone = (currentUser?.phone || '').replace(/\D/g, '');
    const passengerId = currentUser?.id;
    const myTrips = list.filter((r) => {
      if (!passengerPhone && !passengerId) return true;
      const rPhone = (r.passengerPhone || '').replace(/\D/g, '');
      if (passengerId && r.passengerId === passengerId) return true;
      if (passengerPhone && rPhone && (rPhone.endsWith(passengerPhone) || passengerPhone.endsWith(rPhone))) return true;
      return !r.passengerId; // platform demo trips
    });

    if (myTrips.length === 0) {
      return [];
    }

    return myTrips.map((r, idx) => {
      let dateStr = 'Maanta • Recent';
      try {
        if (r.completedAt) {
          dateStr = new Date(r.completedAt).toLocaleDateString('so-SO', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });
        } else if (r.createdAt) {
          dateStr = new Date(r.createdAt).toLocaleDateString('so-SO', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });
        }
      } catch {}

      return {
        id: r.id || `WDG-${900 + idx}`,
        date: dateStr,
        categoryName: r.categoryName || (r.service_type === 'Normal' ? 'Normal Taxi' : 'Wadaage Share'),
        driverName: r.driverName || 'Maxamed Cumar',
        driverAvatar: r.driverAvatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        vehiclePlate: r.driverVehiclePlate || 'SL-2044',
        vehicleModel: r.vehicleModel || (r as any).driverVehicleModel || 'Toyota Vitz',
        pickup: r.pickup?.name ? `${r.pickup.name} (${r.pickup.address})` : r.pickup?.address || 'Hargeisa',
        dropoff: r.dropoff?.name ? `${r.dropoff.name} (${r.dropoff.address})` : r.dropoff?.address || 'Hargeisa',
        totalFare: r.totalFare || 2.5,
        baseFare: r.baseFare || 1.0,
        distanceKm: r.distanceKm || 4.5,
        durationMins: Math.round(r.durationMins || 12),
        discount: r.discountAmount || 0,
        paymentMethod: (r.paymentMethod as any) || 'wallet',
        status: (r.status === 'cancelled' ? 'cancelled' : 'completed') as 'completed' | 'cancelled',
        rating: 5,
      };
    });
  }, [allPlatformRides, currentRide]);

  const filteredTrips = useMemo(() => {
    return allTrips.filter((t) => {
      if (filter !== 'all' && t.status !== filter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          t.pickup.toLowerCase().includes(q) ||
          t.dropoff.toLowerCase().includes(q) ||
          t.driverName.toLowerCase().includes(q) ||
          t.vehiclePlate.toLowerCase().includes(q) ||
          t.id.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allTrips, filter, searchQuery]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-2xl w-full text-white shadow-2xl relative space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base">Safarradayda (My Rides & Receipts)</h3>
              <p className="text-xs text-slate-400">Diiwaanka dhammaan safarrada dhabta ah ee Hargeisa</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-full bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Raadi meelaha, darawalka, lambarka gaadhiga..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
            />
          </div>
          <div className="flex items-center space-x-1.5">
            {(['all', 'completed', 'cancelled'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold uppercase transition-all ${
                  filter === cat
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {cat === 'all' ? 'Dhammaan' : cat === 'completed' ? 'Dhammaystiran' : 'Kansal'}
              </button>
            ))}
          </div>
        </div>

        {/* Trips List */}
        <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
          {filteredTrips.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Car className="w-10 h-10 mx-auto text-slate-600 opacity-60" />
              <p className="font-bold text-sm">Wali ma jiro safar diiwaangashan</p>
              <p className="text-xs text-slate-500">Safarrada aad gasho halkan ayay si toos ah ugu diiwaangashan yihiin.</p>
            </div>
          ) : (
            filteredTrips.map((trip) => (
              <div
                key={trip.id}
                className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:border-slate-600 transition-all"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-sm text-white">{trip.categoryName}</span>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold px-2 py-0.5 rounded-md">
                      {trip.id}
                    </span>
                    <span className="text-[10px] bg-slate-700 text-slate-300 font-bold px-2 py-0.5 rounded-md">
                      {trip.date}
                    </span>
                  </div>
                  <div className="text-slate-300 flex items-start space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2 leading-tight">
                      <span className="text-slate-400">Ka:</span> {trip.pickup} <br />
                      <span className="text-slate-400">Ku:</span> {trip.dropoff}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-slate-400 text-[11px] pt-1 border-t border-slate-700/50">
                    <span>Darawal: <b className="text-white">{trip.driverName}</b></span>
                    <span>Taariko: <b className="text-emerald-400 font-mono">{trip.vehiclePlate}</b></span>
                    <span>Masaafo: <b className="text-slate-300">{trip.distanceKm} km</b> ({trip.durationMins} daq)</span>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-700 shrink-0">
                  <div className="text-right">
                    <div className="text-base font-black text-emerald-400">{formatCurrency(trip.totalFare)}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {(trip.totalFare * 8500).toLocaleString()} SLSH
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 mt-2">
                    <button
                      onClick={() => setSelectedTrip(trip)}
                      className="px-2.5 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg flex items-center space-x-1 text-[11px] font-bold"
                    >
                      <Receipt className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Risidh</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Selected Trip Receipt Details Modal */}
        {selectedTrip && (
          <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm">Risidhka Safarka Wadaage</h4>
                    <p className="text-[10px] text-slate-400 font-mono">ID: {selectedTrip.id} • {selectedTrip.date}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedTrip(null)}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2 text-xs bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/60">
                <div className="flex justify-between py-1 border-b border-slate-700/50">
                  <span className="text-slate-400">Nuuca Safarka:</span>
                  <span className="font-bold text-white">{selectedTrip.categoryName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-700/50">
                  <span className="text-slate-400">Darawalka:</span>
                  <span className="font-bold text-white">{selectedTrip.driverName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-700/50">
                  <span className="text-slate-400">Taarikada:</span>
                  <span className="font-bold text-emerald-400 font-mono">{selectedTrip.vehiclePlate}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-700/50">
                  <span className="text-slate-400">Masaafada & Waqtiga:</span>
                  <span className="font-bold text-white">{selectedTrip.distanceKm} km ({selectedTrip.durationMins} min)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-700/50">
                  <span className="text-slate-400">Habka Lacag-bixinta:</span>
                  <span className="font-bold text-emerald-400 uppercase">{selectedTrip.paymentMethod} (Zaad / eDahab)</span>
                </div>
                <div className="flex justify-between py-1.5 text-sm font-black pt-2">
                  <span className="text-white">Wadarta Lacagta:</span>
                  <div className="text-right">
                    <span className="text-emerald-400">{formatCurrency(selectedTrip.totalFare)}</span>
                    <div className="text-[10px] text-slate-400 font-normal">
                      {(selectedTrip.totalFare * 8500).toLocaleString()} SLSH
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-2 pt-1">
                <button
                  onClick={() => {
                    alert(`Risidhka ${selectedTrip.id} waxaa loo soo dajiyey qalabkaaga.`);
                  }}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow-md"
                >
                  <Download className="w-4 h-4" />
                  <span>Daji Risidhka (PDF)</span>
                </button>
                <button
                  onClick={() => setSelectedTrip(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs"
                >
                  Xidh
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
