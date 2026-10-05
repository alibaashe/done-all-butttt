import React, { useState } from 'react';
import { AlertCircle, Camera, Check, FileText, Send, X, ShieldAlert } from 'lucide-react';

interface DriverSupportTicketsProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Ticket {
  id: string;
  category: string;
  description: string;
  date: string;
  status: 'open' | 'investigating' | 'resolved';
}

export const DriverSupportTickets: React.FC<DriverSupportTicketsProps> = ({ isOpen, onClose }) => {
  const [category, setCategory] = useState('aggressive_passenger');
  const [description, setDescription] = useState('');
  const [photoUploaded, setPhotoUploaded] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const [tickets, setTickets] = useState<Ticket[]>([
    {
      id: 'TCK-8812',
      category: 'Incorrect Pickup Spot',
      description: 'Passenger pinned wrong side of expressway, had to make 3km U-turn.',
      date: '2026-08-04 14:10',
      status: 'resolved',
    },
    {
      id: 'TCK-8901',
      category: 'Aggressive Passenger',
      description: 'Co-passenger in WadaageShare refused to wear seatbelt and yelled.',
      date: '2026-08-05 10:25',
      status: 'investigating',
    },
  ]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    const newTicket: Ticket = {
      id: `TCK-${Math.floor(1000 + Math.random() * 9000)}`,
      category: category === 'aggressive_passenger' ? 'Aggressive Passenger' : category === 'fare_dispute' ? 'Fare Dispute' : 'GPS Location Issue',
      description: description.trim(),
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'open',
    };

    setTickets([newTicket, ...tickets]);
    setDescription('');
    setPhotoUploaded(false);
    setSubmittedSuccess(true);
    setTimeout(() => setSubmittedSuccess(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base">In-App Support Ticket System</h3>
            <p className="text-xs text-slate-500">Report passenger issues or route disputes with evidence</p>
          </div>
        </div>

        {/* File Ticket Form */}
        <form onSubmit={handleSubmit} className="space-y-3 mb-6 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Issue Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
            >
              <option value="aggressive_passenger">Aggressive / Difficult Passenger</option>
              <option value="fare_dispute">Fare / Toll Dispute</option>
              <option value="location_wrong">Incorrect Pickup Pin / Road Block</option>
              <option value="vehicle_damage">Vehicle Mess / Property Damage</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Description & Details</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain what happened during the ride..."
              rows={3}
              className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs focus:outline-none focus:border-amber-500"
              required
            />
          </div>

          {/* Attach photo evidence */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => setPhotoUploaded(!photoUploaded)}
              className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition ${
                photoUploaded
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
              }`}
            >
              <Camera className="w-4 h-4" />
              {photoUploaded ? 'Photo Attached' : 'Attach Photo Evidence'}
            </button>

            <button
              type="submit"
              className="py-2 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition"
            >
              <Send className="w-3.5 h-3.5" />
              Submit Ticket
            </button>
          </div>

          {submittedSuccess && (
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-500 text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4" />
              Ticket Filed! Operations team investigating.
            </div>
          )}
        </form>

        {/* Existing Tickets */}
        <div>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">My Ticket History</span>
          <div className="space-y-2">
            {tickets.map((t) => (
              <div key={t.id} className="p-3 bg-slate-100 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/50 text-xs">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-extrabold text-slate-900 dark:text-white">{t.category} ({t.id})</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      t.status === 'resolved'
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : t.status === 'investigating'
                        ? 'bg-amber-500/10 text-amber-500'
                        : 'bg-indigo-500/10 text-indigo-500'
                    }`}
                  >
                    {t.status}
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-300 mb-1">{t.description}</p>
                <p className="text-[10px] text-slate-400">{t.date}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
