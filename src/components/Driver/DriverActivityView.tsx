import { Calendar, CheckCircle2, Clock, Filter, MapPin, Navigation, Search, Star, Users, XCircle } from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { useRide } from '../../context/RideContext';
import { formatCurrency } from '../../utils/geo';

export const DriverActivityView: React.FC = () => {
  const { drivers, currentUser, allPlatformRides } = useRide();
  const driver = drivers.find((d) => d.phone === currentUser?.phone || d.id === currentUser?.id) || drivers[0] || {
    id: currentUser?.id || 'drv_live',
    name: currentUser?.name || 'Driver Partner',
    phone: currentUser?.phone || '',
    avatar: currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    rating: 5.0,
    totalTrips: 0,
    todayEarnings: 0,
    weeklyEarnings: 0,
    hoursOnline: 0,
    acceptanceRate: 100,
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'completed' | 'cancelled' | 'shared'>('all');

  const driverPhoneClean = (currentUser?.phone || '').replace(/\D/g, '');
  const driverId = currentUser?.id;

  const realRides = useMemo(() => {
    const list = [...(allPlatformRides || [])];
    const myRides = list.filter((r) => {
      const rDriverPhone = (r.driverPhone || '').replace(/\D/g, '');
      return (
        (driverId && r.assignedDriverId === driverId) ||
        (driverPhoneClean && rDriverPhone && rDriverPhone.endsWith(driverPhoneClean)) ||
        r.status === 'completed' ||
        r.status === 'cancelled'
      );
    });

    if (myRides.length === 0) {
      return fallbackRides;
    }

    return myRides.map((r, idx) => {
      let dateFormatted = 'Maanta • Recent';
      try {
        if (r.completedAt) {
          dateFormatted = new Date(r.completedAt).toLocaleString();
        } else if (r.createdAt) {
          dateFormatted = new Date(r.createdAt).toLocaleString();
        }
      } catch {}

      return {
        id: r.id || `ride_${100 + idx}`,
        passengerName: r.passengerName || 'Rakaab Wadaage',
        passengerPhone: r.passengerPhone || '63 4889922',
        pickup: r.pickup?.name ? `${r.pickup.name} (${r.pickup.address})` : r.pickup?.address || 'Hargeisa Central',
        dropoff: r.dropoff?.name ? `${r.dropoff.name} (${r.dropoff.address})` : r.dropoff?.address || 'Hargeisa Destination',
        date: dateFormatted,
        fare: r.totalFare || 2.50,
        net: Math.max(0, (r.totalFare || 2.50) - 0.10),
        type: r.categoryName || (r.category === 'wadaage_share' ? 'WadaageShare' : 'WadaageTaxi'),
        status: r.status === 'cancelled' ? 'cancelled' : 'completed',
        distanceKm: r.distanceKm || 4.5,
        rating: 5,
        isShared: r.category === 'wadaage_share' || Boolean(r.isShared) || Boolean(r.coPassenger),
        coPassenger: r.coPassenger?.name || (r.coPassenger as any)?.passengerName,
        cancellationReason: r.cancellationReason,
      };
    });
  }, [allPlatformRides, driverId, driverPhoneClean]);

  const fallbackRides = [
    {
      id: 'ride_101',
      passengerName: 'Amina Mohamed',
      passengerPhone: '63 4889922',
      pickup: 'Downtown Hargeisa Market',
      dropoff: 'Egal International Airport Gate 2',
      date: '2026-08-07 14:20',
      fare: 28.50,
      net: 23.37,
      type: 'WadaageTaxi',
      status: 'completed',
      distanceKm: 8.5,
      rating: 5,
      isShared: false,
    },
    {
      id: 'ride_102',
      passengerName: 'Khadar Jama',
      passengerPhone: '63 4110022',
      pickup: 'Dahabshiil Business Tower',
      dropoff: 'University of Hargeisa Main Gate',
      date: '2026-08-07 12:45',
      fare: 14.00,
      net: 11.48,
      type: 'WadaageShare',
      status: 'completed',
      distanceKm: 4.2,
      rating: 5,
      isShared: true,
      coPassenger: 'Guled Ali',
    },
    {
      id: 'ride_103',
      passengerName: 'Hodam Said',
      passengerPhone: '63 4223344',
      pickup: 'Mansoor Hotel Precinct',
      dropoff: 'Oriental Hotel Corner',
      date: '2026-08-07 10:15',
      fare: 9.50,
      net: 7.79,
      type: 'Bajaaj TukTuk',
      status: 'completed',
      distanceKm: 2.8,
      rating: 4,
      isShared: false,
    },
    {
      id: 'ride_104',
      passengerName: 'Farhan Nur',
      passengerPhone: '63 4998877',
      pickup: 'Suuqa Barta Terminal',
      dropoff: 'Central Hospital Entrance',
      date: '2026-08-06 18:00',
      fare: 18.00,
      net: 0,
      type: 'WadaageTaxi',
      status: 'cancelled',
      distanceKm: 5.1,
      rating: 0,
      isShared: false,
      cancellationReason: 'Rider took too long (> 3 mins wait)',
    },
    {
      id: 'ride_105',
      passengerName: 'Sahra Hassan',
      passengerPhone: '63 4556677',
      pickup: 'KM4 Junction',
      dropoff: 'Lido Beach Promenade',
      date: '2026-08-06 15:30',
      fare: 22.00,
      net: 18.04,
      type: 'WadaageShare',
      status: 'completed',
      distanceKm: 6.8,
      rating: 5,
      isShared: true,
    },
  ];

  const filteredRides = realRides.filter((ride) => {
    const matchesSearch =
      ride.passengerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ride.pickup.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ride.dropoff.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (filterType === 'completed') return ride.status === 'completed';
    if (filterType === 'cancelled') return ride.status === 'cancelled';
    if (filterType === 'shared') return ride.isShared;
    return true;
  });

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Activity Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Total Trips Completed</span>
          <span className="text-xl font-black text-slate-900 dark:text-white mt-1 block">
            {driver.totalTrips} rides
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Total Distance</span>
          <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block font-mono">
            284.5 km
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Acceptance Rate</span>
          <span className="text-xl font-black text-emerald-500 mt-1 block font-mono">
            {driver.acceptanceRate}%
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Rating Shield</span>
          <span className="text-xl font-black text-amber-400 mt-1 block flex items-center gap-1 font-mono">
            <Star className="w-5 h-5 fill-amber-400" />
            {driver.rating}
          </span>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search rider name, pickup or dropoff location..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200 dark:border-slate-800 gap-1 overflow-x-auto custom-scrollbar">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
                filterType === 'all'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-white'
              }`}
            >
              All Rides
            </button>
            <button
              onClick={() => setFilterType('completed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
                filterType === 'completed'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-white'
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setFilterType('shared')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
                filterType === 'shared'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-white'
              }`}
            >
              Wadaage Share
            </button>
            <button
              onClick={() => setFilterType('cancelled')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
                filterType === 'cancelled'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-white'
              }`}
            >
              Cancelled
            </button>
          </div>
        </div>
      </div>

      {/* Trip Activity List */}
      <div className="space-y-3">
        {filteredRides.length === 0 ? (
          <div className="p-8 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
            No trip activity matching your filter criteria.
          </div>
        ) : (
          filteredRides.map((ride) => (
            <div
              key={ride.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-md space-y-3 hover:border-emerald-500/50 transition"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center space-x-2">
                  {ride.status === 'completed' ? (
                    <span className="p-1 rounded-full bg-emerald-500/10 text-emerald-500">
                      <CheckCircle2 className="w-4 h-4" />
                    </span>
                  ) : (
                    <span className="p-1 rounded-full bg-rose-500/10 text-rose-500">
                      <XCircle className="w-4 h-4" />
                    </span>
                  )}
                  <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                    {ride.passengerName}
                  </span>
                  {ride.isShared && (
                    <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black px-2 py-0.2 rounded border border-emerald-500/30">
                      WADAAGE SHARE
                    </span>
                  )}
                </div>

                <div className="text-right">
                  {ride.status === 'completed' ? (
                    <span className="font-black text-sm text-emerald-600 dark:text-emerald-400 font-mono">
                      +{formatCurrency(ride.net)}
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-rose-500">Cancelled ($0)</span>
                  )}
                  <span className="text-[10px] text-slate-400 block">{ride.date}</span>
                </div>
              </div>

              {/* Route Details */}
              <div className="space-y-1 text-xs">
                <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-300">
                  <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="font-semibold">{ride.pickup}</span>
                </div>
                <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-300">
                  <Navigation className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                  <span className="font-semibold">{ride.dropoff}</span>
                </div>
              </div>

              {/* Trip Footer Badges */}
              <div className="flex items-center justify-between text-[11px] pt-1 text-slate-500 border-t border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center space-x-3">
                  <span>Category: <b>{ride.type}</b></span>
                  <span>Distance: <b>{ride.distanceKm} km</b></span>
                  {ride.cancellationReason && (
                    <span className="text-rose-400 italic">Reason: {ride.cancellationReason}</span>
                  )}
                </div>

                {ride.rating > 0 && (
                  <div className="flex items-center text-amber-400 font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400 mr-1" />
                    <span>{ride.rating}.0 Rating</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
