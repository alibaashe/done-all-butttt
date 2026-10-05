import React, { useState } from 'react';
import { PhoneCall, Radio, Send, Smartphone, X, Check, ShieldCheck } from 'lucide-react';
import { useRide } from '../../context/RideContext';
import { CITY_LOCATIONS } from '../../data/mockData';

interface UssdOfflineBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UssdOfflineBookingModal: React.FC<UssdOfflineBookingModalProps> = ({ isOpen, onClose }) => {
  const { setPickupLocation, setDropoffLocation, setSelectedCategory, bookRide } = useRide();
  const [ussdStep, setUssdStep] = useState<number>(1);
  const [ussdInput, setUssdInput] = useState<string>('');
  const [ussdLog, setUssdLog] = useState<string[]>([
    "Welcome to WadaageTaxi USSD Offline Booking Service (*990#)",
    "1. Book Shared Taxi (WadaageShare / Gaadhi Wadaag)",
    "2. Book Private Taxi (WadaageTaxi / Taaksi Gaar Ah)",
    "3. Check Active Booking Status (*990*2#)",
    "4. Cancel Active Booking",
  ]);
  const [bookingDetails, setBookingDetails] = useState<{
    pickupId?: string;
    dropoffId?: string;
  }>({});

  if (!isOpen) return null;

  const handleSendInput = () => {
    const trimmed = ussdInput.trim();
    if (!trimmed) return;

    if (ussdStep === 1) {
      if (trimmed === '1' || trimmed === '2') {
        const isShared = trimmed === '1';
        setSelectedCategory(isShared ? 'wadaage_share' : 'wadaage_taxi');
        setUssdLog([
          `Select Pick-up Location:`,
          `1. Downtown Central Square`,
          `2. Tech Park Innovation Hub`,
          `3. Grand Central Railway Station`,
          `4. Financial District Plaza`,
        ]);
        setUssdStep(2);
      } else if (trimmed === '3') {
        setUssdLog([
          `WadaagePay USSD Balance Check:`,
          `Your Balance: $78.50 USD / 863,500 SLSH`,
          `Press 0 to Return to Main Menu`
        ]);
        setUssdStep(99);
      } else {
        setUssdLog(["Invalid choice. Reply 1 for WadaageShare or 2 for WadaageTaxi."]);
      }
    } else if (ussdStep === 2) {
      const idx = parseInt(trimmed, 10);
      if (idx >= 1 && idx <= 4) {
        const pickupLoc = CITY_LOCATIONS[idx - 1];
        setPickupLocation(pickupLoc);
        setBookingDetails((prev) => ({ ...prev, pickupId: pickupLoc.id }));
        setUssdLog([
          `Pickup Set: ${pickupLoc.name}`,
          `Select Drop-off Destination:`,
          `1. International Airport T3`,
          `2. Marina Bay Promenade`,
          `3. University Campus Green`,
          `4. Metro General Medical Center`,
        ]);
        setUssdStep(3);
      }
    } else if (ussdStep === 3) {
      const idx = parseInt(trimmed, 10);
      if (idx >= 1 && idx <= 4) {
        const dropoffLoc = CITY_LOCATIONS[idx + 3] || CITY_LOCATIONS[1];
        setDropoffLocation(dropoffLoc);
        setBookingDetails((prev) => ({ ...prev, dropoffId: dropoffLoc.id }));
        setUssdLog([
          `Confirm Offline USSD Booking:`,
          `Destination: ${dropoffLoc.name}`,
          `Estimated Fare: $14.50 (Pay Cash to Driver on Arrival)`,
          `Reply 1 to Confirm & Send SMS Dispatch`,
          `Reply 0 to Cancel`
        ]);
        setUssdStep(4);
      }
    } else if (ussdStep === 4) {
      if (trimmed === '1') {
        setUssdLog([
          `SUCCESS! Driver Dispatched via Offline Cellular SMS Gateway.`,
          `SMS Ticket ID: #USSD-9982`,
          `Wadaage Captain is en route with verified vehicle & live GPS dispatch.`,
          `ETA: 4 minutes.`
        ]);
        setUssdStep(5);
        bookRide('cash');
      } else {
        setUssdLog(["Booking Cancelled."]);
        setUssdStep(1);
      }
    } else if (ussdStep === 99) {
      setUssdLog([
        "Welcome to WadaageTaxi USSD Offline Booking Service (*990#)",
        "1. Book Shared Taxi (WadaageShare / Gaadhi Wadaag)",
        "2. Book Private Taxi (WadaageTaxi / Taaksi Gaar Ah)",
        "3. Check Active Booking Status (*990*2#)",
      ]);
      setUssdStep(1);
    }
    setUssdInput('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 text-white rounded-3xl max-w-sm w-full p-5 shadow-2xl border border-slate-800 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-white text-base">Offline USSD / SMS Booking</h3>
            <p className="text-[11px] text-slate-400">Zero Internet Required • Cellular Protocol</p>
          </div>
        </div>

        {/* Cellular USSD Terminal Screen */}
        <div className="bg-slate-950 border-2 border-slate-800 rounded-2xl p-4 mb-4 font-mono text-xs text-amber-400 min-h-[220px] flex flex-col justify-between shadow-inner">
          <div className="flex items-center justify-between text-[10px] text-slate-500 pb-2 border-b border-slate-800">
            <span>NETWORK: SOMTEL / TELESOM</span>
            <span>CELLULAR 2G/GSM</span>
          </div>

          <div className="py-2 space-y-1 overflow-y-auto max-h-[160px]">
            {ussdLog.map((line, i) => (
              <p key={i} className="leading-snug">{line}</p>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-500 flex justify-between">
            <span>Dial Code: *990#</span>
            <span className="text-emerald-400 font-bold">Signal Strong</span>
          </div>
        </div>

        {/* Input prompt */}
        {ussdStep !== 5 ? (
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={ussdInput}
              onChange={(e) => setUssdInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendInput()}
              placeholder="Type option number (e.g. 1)..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
            <button
              onClick={handleSendInput}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1 transition"
            >
              Send
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            Close & Track Dispatch
          </button>
        )}

        <div className="text-[10px] text-center text-slate-500 flex items-center justify-center gap-1 mt-3">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          Supports Dhaweeye/Wadaage USSD Gateway Integration
        </div>
      </div>
    </div>
  );
};
