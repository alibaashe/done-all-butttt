import React, { useState } from 'react';
import {
  Compass,
  X,
  MapPin,
  Clock,
  Users,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Luggage,
  Sparkles,
  ArrowRight,
  Phone,
  QrCode,
  AlertCircle
} from 'lucide-react';
import { useRide } from '../../context/RideContext';
import { IntercityTrip } from '../../types';
import { formatCurrency } from '../../utils/geo';

interface IntercityBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IntercityBookingModal: React.FC<IntercityBookingModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { intercityTrips, intercityBookings, bookIntercitySeat, currentUser } = useRide();
  const [selectedCityFilter, setSelectedCityFilter] = useState<'All' | 'Berbera' | 'Borama' | 'Burco'>('All');
  const [selectedTrip, setSelectedTrip] = useState<IntercityTrip | null>(null);
  const [seatCount, setSeatCount] = useState<number>(1);
  const [passengerName, setPassengerName] = useState(currentUser?.name || '');
  const [passengerPhone, setPassengerPhone] = useState(currentUser?.phone || '');
  const [paymentMethod, setPaymentMethod] = useState<'zaad' | 'edahab' | 'cash'>('zaad');
  const [bookingSuccessTicket, setBookingSuccessTicket] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'browse' | 'my_tickets'>('browse');

  if (!isOpen) return null;

  const filteredTrips = intercityTrips.filter((trip) => {
    if (selectedCityFilter === 'All') return true;
    return trip.destinationCity === selectedCityFilter;
  });

  const handleConfirmBooking = () => {
    if (!selectedTrip) return;
    if (!passengerName.trim() || !passengerPhone.trim()) {
      alert('Please provide passenger name and contact phone number.');
      return;
    }

    const res = bookIntercitySeat(
      selectedTrip.id,
      seatCount,
      passengerName,
      passengerPhone,
      paymentMethod
    );

    if (res.success && res.booking) {
      setBookingSuccessTicket(res.booking);
      setSelectedTrip(null);
    } else {
      alert(res.message || 'Failed to complete intercity booking.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 relative overflow-hidden">
        {/* Top Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white font-bold">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base tracking-tight">Inter-City Wadaage Express</h3>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                  Safarka Gobollada
                </span>
              </div>
              <p className="text-xs text-white/80">
                Guaranteed AC Shuttles: Hargeisa ⇄ Berbera, Borama & Burco
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

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 px-5 pt-3">
          <button
            onClick={() => {
              setActiveTab('browse');
              setBookingSuccessTicket(null);
            }}
            className={`pb-3 px-4 font-bold text-xs border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'browse'
                ? 'border-teal-500 text-teal-600 dark:text-teal-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            Available Inter-City Shuttles
          </button>
          <button
            onClick={() => setActiveTab('my_tickets')}
            className={`pb-3 px-4 font-bold text-xs border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'my_tickets'
                ? 'border-teal-500 text-teal-600 dark:text-teal-400'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            My Boarding Passes ({intercityBookings.length})
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {bookingSuccessTicket ? (
            /* Ticket Confirmation View */
            <div className="space-y-4 animate-in zoom-in-95 duration-200">
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl text-center">
                <div className="w-12 h-12 bg-emerald-500 text-slate-950 rounded-full flex items-center justify-center mx-auto mb-2 font-black">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <h4 className="font-extrabold text-base text-emerald-900 dark:text-emerald-300">
                  Intercity Seat Confirmed!
                </h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                  Your electronic e-ticket and QR code are ready for departure at the terminal.
                </p>
              </div>

              {/* Digital Boarding Pass */}
              <div className="bg-slate-900 text-white rounded-3xl p-5 border border-slate-800 shadow-xl relative overflow-hidden">
                <div className="flex justify-between items-start border-b border-slate-800 pb-4 mb-4">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-teal-400">
                      WADAAGE INTERCITY TICKET
                    </span>
                    <h4 className="text-lg font-black text-white flex items-center gap-2 mt-0.5">
                      {bookingSuccessTicket.originCity} <ArrowRight className="w-4 h-4 text-teal-400" /> {bookingSuccessTicket.destinationCity}
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono text-slate-400 block">Seat Assigned</span>
                    <span className="text-base font-black text-emerald-400">
                      {bookingSuccessTicket.seatNumbers?.join(', ') || 'A1'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs mb-4">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Passenger</span>
                    <p className="font-bold">{bookingSuccessTicket.passengerName}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Departure</span>
                    <p className="font-bold text-teal-300">
                      {bookingSuccessTicket.departureTime} ({bookingSuccessTicket.departureDate})
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Total Paid</span>
                    <p className="font-bold text-emerald-400">
                      ${bookingSuccessTicket.totalPaidUsd.toFixed(2)} ({bookingSuccessTicket.totalPaidSos.toLocaleString()} SLSH)
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 block">TICKET QR CODE</span>
                    <p className="font-mono text-xs text-slate-200">{bookingSuccessTicket.ticketQrCode}</p>
                  </div>
                  <div className="w-12 h-12 bg-white rounded-xl p-1.5 flex items-center justify-center">
                    <QrCode className="w-9 h-9 text-slate-950" />
                  </div>
                </div>
              </div>

              <button
                onClick={() => setBookingSuccessTicket(null)}
                className="w-full py-3 bg-teal-500 hover:bg-teal-600 text-slate-950 font-black rounded-xl text-xs transition"
              >
                Browse More Intercity Routes
              </button>
            </div>
          ) : activeTab === 'my_tickets' ? (
            /* My Tickets List */
            <div className="space-y-3">
              {intercityBookings.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  <Luggage className="w-10 h-10 mx-auto text-slate-500 mb-2 opacity-50" />
                  No intercity tickets booked yet. Choose a shuttle from the route list.
                </div>
              ) : (
                intercityBookings.map((b) => (
                  <div
                    key={b.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-600 dark:text-teal-400 font-black text-xs">
                          {b.originCity} ⇄ {b.destinationCity}
                        </span>
                        <span className="text-xs text-slate-500">{b.departureDate} at {b.departureTime}</span>
                      </div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
                        Passenger: {b.passengerName} ({b.seatsBooked} Seat{b.seatsBooked > 1 ? 's' : ''})
                      </p>
                      <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                        Code: {b.ticketQrCode}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                          ${b.totalPaidUsd.toFixed(2)}
                        </p>
                        <span className="text-[10px] text-slate-500">Paid via {b.paymentMethod.toUpperCase()}</span>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-1 flex items-center justify-center">
                        <QrCode className="w-7 h-7 text-slate-700 dark:text-slate-300" />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : selectedTrip ? (
            /* Booking Checkout Form */
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-200">
              <button
                onClick={() => setSelectedTrip(null)}
                className="text-xs text-teal-600 dark:text-teal-400 font-bold hover:underline flex items-center gap-1"
              >
                ← Back to Shuttles List
              </button>

              <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800/40">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
                      {selectedTrip.originCity} → {selectedTrip.destinationCity}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                      Departure: <span className="font-bold text-teal-600 dark:text-teal-400">{selectedTrip.departureTime} ({selectedTrip.departureDate})</span> • {selectedTrip.estimatedDuration}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                      ${selectedTrip.pricePerSeatUsd.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-500 block">per seat</span>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-teal-200/60 dark:border-teal-800/40 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Pickup Station</span>
                    <p className="font-medium">{selectedTrip.pickupStation}</p>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Dropoff Station</span>
                    <p className="font-medium">{selectedTrip.dropoffStation}</p>
                  </div>
                </div>
              </div>

              {/* Seat Selection */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Number of Seats (Max {selectedTrip.availableSeats} available)
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].slice(0, selectedTrip.availableSeats).map((count) => (
                    <button
                      key={count}
                      onClick={() => setSeatCount(count)}
                      className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition border ${
                        seatCount === count
                          ? 'bg-teal-500 text-slate-950 border-teal-500 font-black shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-transparent hover:border-slate-300'
                      }`}
                    >
                      {count} {count === 1 ? 'Seat' : 'Seats'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Passenger Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Passenger Full Name
                  </label>
                  <input
                    type="text"
                    value={passengerName}
                    onChange={(e) => setPassengerName(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-teal-500"
                    placeholder="e.g. Alex Morgan"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Contact Phone (ZAAD / EVC)
                  </label>
                  <input
                    type="text"
                    value={passengerPhone}
                    onChange={(e) => setPassengerPhone(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-teal-500"
                    placeholder="e.g. +252 63 6807814"
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Payment Method
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'zaad', name: 'ZAAD Telesom' },
                    { id: 'edahab', name: 'eDahab Somtel' },
                    { id: 'cash', name: 'Pay at Terminal' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setPaymentMethod(m.id as any)}
                      className={`p-2 rounded-xl text-xs font-bold border text-center transition ${
                        paymentMethod === m.id
                          ? 'border-teal-500 bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 font-black'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                      }`}
                    >
                      {m.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Total & Action */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-bold">
                    Total Fare ({seatCount} seat{seatCount > 1 ? 's' : ''})
                  </span>
                  <p className="text-base font-black text-emerald-600 dark:text-emerald-400">
                    ${(selectedTrip.pricePerSeatUsd * seatCount).toFixed(2)}{' '}
                    <span className="text-xs font-medium text-slate-500">
                      ({(selectedTrip.pricePerSeatSos * seatCount).toLocaleString()} SLSH)
                    </span>
                  </p>
                </div>
                <button
                  onClick={handleConfirmBooking}
                  className="px-6 py-3 bg-teal-500 hover:bg-teal-600 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-teal-500/20 transition flex items-center gap-2"
                >
                  Confirm & Issue Boarding Ticket
                </button>
              </div>
            </div>
          ) : (
            /* Trips Browse View */
            <div className="space-y-4">
              {/* Filter Pills */}
              <div className="flex gap-2">
                {(['All', 'Berbera', 'Borama', 'Burco'] as const).map((city) => (
                  <button
                    key={city}
                    onClick={() => setSelectedCityFilter(city)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${
                      selectedCityFilter === city
                        ? 'bg-teal-500 text-slate-950 font-black shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {city === 'All' ? 'All Corridors' : `To ${city}`}
                  </button>
                ))}
              </div>

              {/* Trips Cards */}
              <div className="space-y-3">
                {filteredTrips.map((trip) => (
                  <div
                    key={trip.id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 hover:border-teal-500/50 transition relative overflow-hidden"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2.5 py-0.5 rounded-md bg-teal-500/10 text-teal-600 dark:text-teal-400 font-extrabold text-xs">
                            {trip.originCity} ➔ {trip.destinationCity}
                          </span>
                          <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                            <Clock className="w-3 h-3 text-teal-500" />
                            {trip.departureTime} ({trip.departureDate})
                          </span>
                        </div>
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                          {trip.vehicleModel} • {trip.licensePlate}
                        </h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {trip.pickupStation} ➔ {trip.dropoffStation}
                        </p>

                        {/* Features Tags */}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {trip.features.map((f, i) => (
                            <span
                              key={i}
                              className="text-[10px] px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
                            >
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="sm:text-right flex sm:flex-col justify-between items-center sm:items-end pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200 dark:border-slate-700">
                        <div>
                          <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                            ${trip.pricePerSeatUsd.toFixed(2)}
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            {trip.pricePerSeatSos.toLocaleString()} SLSH / seat
                          </span>
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold">
                            {trip.availableSeats} seat{trip.availableSeats > 1 ? 's' : ''} left
                          </span>
                          <button
                            onClick={() => {
                              setSelectedTrip(trip);
                              setSeatCount(1);
                            }}
                            className="px-3.5 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-slate-950 font-black text-xs transition shadow-sm"
                          >
                            Book Seat
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
