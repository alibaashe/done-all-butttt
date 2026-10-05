import React, { useState } from 'react';
import { AlertTriangle, ShieldAlert, ShieldCheck, UserX, X, Zap } from 'lucide-react';

interface FraudDetectionPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FraudAlert {
  id: string;
  driverName: string;
  type: 'ghost_ride' | 'gps_spoofing' | 'fake_passenger_collusion';
  severity: 'high' | 'critical' | 'medium';
  time: string;
  details: string;
  status: 'flagged' | 'investigating' | 'suspended';
}

export const FraudDetectionPanel: React.FC<FraudDetectionPanelProps> = ({ isOpen, onClose }) => {
  const [alerts, setAlerts] = useState<FraudAlert[]>([
    {
      id: 'FRD-102',
      driverName: 'Samir Patel',
      type: 'ghost_ride',
      severity: 'critical',
      time: '12 mins ago',
      details: 'Vehicle stationary at same spot for 25 mins while trip meter running.',
      status: 'flagged',
    },
    {
      id: 'FRD-105',
      driverName: 'David K. Chen',
      type: 'gps_spoofing',
      severity: 'high',
      time: '1 hour ago',
      details: 'Unusual GPS speed jump (>180 km/h) detected between checkpoints.',
      status: 'investigating',
    },
  ]);

  if (!isOpen) return null;

  const handleAction = (id: string, newStatus: 'investigating' | 'suspended') => {
    setAlerts(alerts.map((a) => (a.id === id ? { ...a, status: newStatus } : a)));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-red-500/30 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center font-bold border border-red-500/20">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base">AI Fraud & GPS Spoofing Detection</h3>
            <p className="text-xs text-slate-500">Real-time telematics flagging fake rides & collusions</p>
          </div>
        </div>

        {/* Alerts List */}
        <div className="space-y-3 mb-4">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Live Suspicious System Flags ({alerts.length})</span>

          {alerts.map((a) => (
            <div
              key={a.id}
              className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 rounded-2xl text-xs space-y-2"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  <span className="font-black text-slate-900 dark:text-white">{a.driverName}</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-red-500/20 text-red-500 border border-red-500/30">
                  {a.type.replace('_', ' ')}
                </span>
              </div>

              <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">{a.details}</p>

              <div className="flex items-center justify-between pt-2 border-t border-red-200 dark:border-red-900/40">
                <span className="text-[10px] text-slate-400">{a.time} • Status: <strong className="uppercase">{a.status}</strong></span>

                {a.status !== 'suspended' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAction(a.id, 'investigating')}
                      className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-[10px]"
                    >
                      Audit Log
                    </button>
                    <button
                      onClick={() => handleAction(a.id, 'suspended')}
                      className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-[10px] flex items-center gap-1"
                    >
                      <UserX className="w-3 h-3" />
                      Suspend Driver
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-500 text-xs flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 flex-shrink-0" />
          <span>Telematics active: 0 false positives detected in last 24h.</span>
        </div>
      </div>
    </div>
  );
};
