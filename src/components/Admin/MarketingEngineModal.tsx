import React, { useState } from 'react';
import { Bell, Check, Megaphone, Send, Sparkles, Users, X } from 'lucide-react';

interface MarketingEngineModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MarketingEngineModal: React.FC<MarketingEngineModalProps> = ({ isOpen, onClose }) => {
  const [targetAudience, setTargetAudience] = useState('inactive_7d');
  const [title, setTitle] = useState('We Miss You! Take 30% OFF Shared Taxis');
  const [message, setMessage] = useState('Book a WadaageShare ride today and save up to 30% on your daily commute!');
  const [sentSuccess, setSentSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSendCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    setSentSuccess(true);
    setTimeout(() => {
      setSentSuccess(false);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base">Automated Marketing Push Engine</h3>
            <p className="text-xs text-slate-500">Send targeted promo campaigns & re-engagement push notifications</p>
          </div>
        </div>

        <form onSubmit={handleSendCampaign} className="space-y-3 mb-4">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Target Audience Segment</label>
            <select
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-purple-500"
            >
              <option value="inactive_7d">Users Inactive for &gt; 7 Days (Re-engagement)</option>
              <option value="shared_frequent">Frequent WadaageShare Riders (Loyalty Promo)</option>
              <option value="airport_commuters">Airport Corridor Commuters ($10 Off)</option>
              <option value="all_passengers">All Registered Passengers (Broadcast)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Push Notification Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-purple-500"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">Push Message Body</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              className="w-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs focus:outline-none focus:border-purple-500"
              required
            />
          </div>

          {sentSuccess ? (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-500 text-xs font-bold flex items-center justify-center gap-2">
              <Check className="w-4 h-4" />
              Broadcast Campaign Sent to 1,420 Users!
            </div>
          ) : (
            <button
              type="submit"
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20 transition"
            >
              <Send className="w-4 h-4" />
              Launch Automated Broadcast Campaign
            </button>
          )}
        </form>
      </div>
    </div>
  );
};
