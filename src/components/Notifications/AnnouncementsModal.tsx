import { Bell, AlertTriangle, Sparkles, Shield, Info, Check, X } from 'lucide-react';
import React, { useState } from 'react';

export interface Announcement {
  id: string;
  title: string;
  message: string;
  category: 'promo' | 'traffic' | 'system' | 'safety';
  target: 'all' | 'passenger' | 'driver';
  timestamp: string;
  isRead: boolean;
}

const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann_1',
    title: '⚡ Weekend Airport Discount Activated',
    message: 'Enjoy $10 OFF on all rides to Terminal 3 this weekend with code AIRPORT10!',
    category: 'promo',
    target: 'passenger',
    timestamp: '10 mins ago',
    isRead: false,
  },
  {
    id: 'ann_2',
    title: '🌧️ Heavy Rain Warning - Surge Advisory',
    message: 'High demand detected downtown. Drivers earn +1.5x surge fares; riders are advised to book early.',
    category: 'traffic',
    target: 'all',
    timestamp: '1 hour ago',
    isRead: false,
  },
  {
    id: 'ann_3',
    title: '🛡️ Safety Verification Update',
    message: 'WadaageTaxi now includes instant 24/7 audio protection and direct emergency SOS sharing.',
    category: 'safety',
    target: 'all',
    timestamp: 'Yesterday',
    isRead: true,
  },
];

interface AnnouncementsModalProps {
  onClose: () => void;
}

export const AnnouncementsModal: React.FC<AnnouncementsModalProps> = ({ onClose }) => {
  const [items, setItems] = useState<Announcement[]>(INITIAL_ANNOUNCEMENTS);

  const markAllRead = () => {
    setItems((prev) => prev.map((a) => ({ ...a, isRead: true })));
  };

  const getCategoryIcon = (category: Announcement['category']) => {
    switch (category) {
      case 'promo':
        return <Sparkles className="w-4 h-4 text-amber-400" />;
      case 'traffic':
        return <AlertTriangle className="w-4 h-4 text-orange-400" />;
      case 'safety':
        return <Shield className="w-4 h-4 text-emerald-400" />;
      default:
        return <Info className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full text-white shadow-2xl relative space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base">In-App Announcements</h3>
              <p className="text-xs text-slate-400">System alerts, promos & operational updates</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={markAllRead}
              className="text-[11px] font-bold text-emerald-400 hover:underline flex items-center space-x-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Mark all read</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-1 rounded-full bg-slate-800/80"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Announcements List */}
        <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
          {items.map((ann) => (
            <div
              key={ann.id}
              className={`p-4 rounded-2xl border transition-all ${
                ann.isRead
                  ? 'bg-slate-800/40 border-slate-800 text-slate-300'
                  : 'bg-slate-800/90 border-emerald-500/40 text-white shadow-md'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex items-center space-x-2">
                  <span className="p-1 rounded-lg bg-slate-900 border border-slate-700">
                    {getCategoryIcon(ann.category)}
                  </span>
                  <h4 className="font-bold text-sm leading-tight text-white">{ann.title}</h4>
                </div>
                <span className="text-[10px] text-slate-400 shrink-0 font-medium">{ann.timestamp}</span>
              </div>
              <p className="text-xs text-slate-300 pl-8 leading-relaxed">{ann.message}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-2 text-center text-[11px] text-slate-500 border-t border-slate-800">
          WadaageTaxi Fleet Operations Broadcast Network • Automated Dispatch Alerts
        </div>
      </div>
    </div>
  );
};
