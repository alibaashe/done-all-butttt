import { Megaphone, Send, Users, Sparkles, CheckCircle2 } from 'lucide-react';
import React, { useState } from 'react';

export const BroadcastManager: React.FC = () => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState<'all' | 'passenger' | 'driver'>('all');
  const [urgency, setUrgency] = useState<'info' | 'promo' | 'warning'>('info');
  const [sentSuccess, setSentSuccess] = useState(false);

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !message) return;

    setSentSuccess(true);
    setTimeout(() => {
      setTitle('');
      setMessage('');
      setSentSuccess(false);
    }, 2500);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xl space-y-4">
      <div className="flex items-center space-x-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
          <Megaphone className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
            System Broadcast & Fleet Push Announcements
          </h3>
          <p className="text-xs text-slate-500">Send real-time banners & push notifications to riders and drivers</p>
        </div>
      </div>

      {sentSuccess && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-xl flex items-center space-x-2 text-emerald-500 text-xs font-bold">
          <CheckCircle2 className="w-4 h-4" />
          <span>Announcement broadcasted successfully to active devices!</span>
        </div>
      )}

      <form onSubmit={handleBroadcast} className="space-y-4 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Target Audience</label>
            <select
              value={target}
              onChange={(e) => setTarget(e.target.value as any)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Users (Passengers & Drivers)</option>
              <option value="passenger">Passengers Only</option>
              <option value="driver">Active Driver Fleet Only</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Announcement Type</label>
            <select
              value={urgency}
              onChange={(e) => setUrgency(e.target.value as any)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-semibold outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="info">General Info / System News</option>
              <option value="promo">Promotional / Campaign Discount</option>
              <option value="warning">Traffic / Weather Safety Warning</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Headline Title</label>
          <input
            type="text"
            placeholder="e.g. ⚡ Heavy Demand Surge Alert in Financial District"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Broadcast Message Body</label>
          <textarea
            rows={3}
            placeholder="Type your message details..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-medium outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <button
          type="submit"
          className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black px-5 py-3 rounded-xl text-xs flex items-center space-x-2 shadow-lg transition-all uppercase tracking-wider"
        >
          <Send className="w-4 h-4" />
          <span>Dispatch Instant Push Broadcast</span>
        </button>
      </form>
    </div>
  );
};
