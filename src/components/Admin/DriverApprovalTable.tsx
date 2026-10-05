import React, { useState } from 'react';
import {
  CheckCircle2,
  FileText,
  ShieldCheck,
  UserCheck,
  XCircle,
  Clock,
  Eye,
  Phone,
  MapPin,
  AlertTriangle,
  ExternalLink,
  Car,
  Award,
  Trash2
} from 'lucide-react';
import { useRide } from '../../context/RideContext';
import { DriverApplication } from '../../types';
import { deleteApplicationFromFirestore, saveDriverToFirestore } from '../../services/firebase';
import { KeyRound, Lock } from 'lucide-react';

export const DriverApprovalTable: React.FC = () => {
  const { driverApplications, drivers, updateDriverApplicationStatus, deleteDriverApplication, updateUserPassword } = useRide();
  const [selectedApp, setSelectedApp] = useState<DriverApplication | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingPasswordId, setEditingPasswordId] = useState<string | null>(null);
  const [newDriverPassword, setNewDriverPassword] = useState<string>('');

  const handleUpdateDriverPassword = async (app: DriverApplication) => {
    if (!newDriverPassword || newDriverPassword.trim().length < 4) {
      setActionSuccessMessage('⚠️ Password-ku waa inuu ka koobnaadaa uguyaraan 4 xaraf (Minimum 4 chars)');
      setTimeout(() => setActionSuccessMessage(null), 3000);
      return;
    }

    const trimmedPassword = newDriverPassword.trim();
    app.password = trimmedPassword;
    const matchingDriver = drivers.find((d) => d.phone === app.phone || d.name === app.fullName);
    if (matchingDriver) {
      matchingDriver.password = trimmedPassword;
      saveDriverToFirestore(matchingDriver);
    }

    // Call central updateUserPassword which updates local storage, state, Firestore, and backend API
    await updateUserPassword(app.id, trimmedPassword);
    if (app.phone) {
      await updateUserPassword(app.phone, trimmedPassword);
    }
    if (matchingDriver?.id) {
      await updateUserPassword(matchingDriver.id, trimmedPassword);
    }

    setEditingPasswordId(null);
    setNewDriverPassword('');
    setActionSuccessMessage(`🔑 Erayga sirta ah ee darawalka ${app.fullName} si guul leh ayaa loo beddelay!`);
    setTimeout(() => setActionSuccessMessage(null), 3500);
  };

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let generated = 'Wad#';
    for (let i = 0; i < 6; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    generated += `${Math.floor(10 + Math.random() * 90)}`;
    setNewDriverPassword(generated);
  };

  const handleStatusChange = (appId: string, status: 'approved' | 'hold' | 'rejected', driverName: string, note?: string) => {
    updateDriverApplicationStatus(appId, status, note);
    const label = status === 'approved' ? 'Aqbalay / Approved' : status === 'hold' ? 'Hakinay / Put on Hold' : 'Diiday / Rejected';
    setActionSuccessMessage(`✅ Darawalka ${driverName} si guul ah ayaa loo ${label}`);
    setTimeout(() => setActionSuccessMessage(null), 3500);
  };

  const handleDelete = (appId: string, driverName: string) => {
    deleteDriverApplication(appId);
    setConfirmDeleteId(null);
    setActionSuccessMessage(`🗑️ Codsigii ${driverName} gabi ahaanba waa la tirtiray`);
    setTimeout(() => setActionSuccessMessage(null), 3500);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xl space-y-4 font-sans text-slate-900 dark:text-white">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
              Maamulka Wadayaasha (Driver Onboarding & Verification Control)
            </h3>
            <p className="text-xs text-slate-500">
              Inspect Somaliland ID, Driver's License, Guarantor (Dammaanad-qaade) and Accept, Hold, or Reject
            </p>
          </div>
        </div>
        <span className="bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 font-extrabold text-xs px-3 py-1 rounded-full">
          {driverApplications.filter((a) => a.status === 'pending').length} Pending Review
        </span>
      </div>

      {/* Action Feedback Banner */}
      {actionSuccessMessage && (
        <div className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 px-4 py-2.5 rounded-xl font-bold text-xs flex items-center justify-between animate-fade-in">
          <span>{actionSuccessMessage}</span>
          <button onClick={() => setActionSuccessMessage(null)} className="text-slate-400 hover:text-white text-xs">✕</button>
        </div>
      )}

      {/* Applications List */}
      <div className="space-y-3">
        {driverApplications.length === 0 ? (
          <p className="text-xs text-slate-500 text-center py-6">No driver applications submitted yet.</p>
        ) : (
          driverApplications.map((app) => {
            const isApproved = app.status === 'approved';
            const isHold = app.status === 'on_hold' || (app.status as string) === 'hold';
            const isRejected = app.status === 'rejected';

            return (
              <div
                key={app.id}
                className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3 text-xs"
              >
                {/* Main Summary Bar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <img
                      src={app.driverPhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
                      alt={app.fullName}
                      className="w-12 h-12 rounded-2xl object-cover border-2 border-amber-400 shrink-0"
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-sm text-slate-900 dark:text-white">{app.fullName}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                            isApproved
                              ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                              : isHold
                              ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                              : isRejected
                              ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                              : 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                          }`}
                        >
                          {app.status}
                        </span>
                      </div>
                      <p className="text-slate-500 flex items-center space-x-2 mt-0.5">
                        <span className="font-mono font-bold text-amber-600">{app.phone}</span>
                        <span>•</span>
                        <span>{app.address}</span>
                      </p>
                    </div>
                  </div>

                  {/* Actions & Detail Toggle */}
                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={() => setSelectedApp(selectedApp?.id === app.id ? null : app)}
                      className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-xs flex items-center space-x-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{selectedApp?.id === app.id ? 'Hide Specs' : 'Inspect Details'}</span>
                    </button>

                    <button
                      onClick={() => handleStatusChange(app.id, 'approved', app.fullName)}
                      disabled={isApproved}
                      className={`px-3 py-1.5 rounded-xl font-black text-xs uppercase flex items-center space-x-1 cursor-pointer transition ${
                        isApproved
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 opacity-60 cursor-not-allowed'
                          : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-md active:scale-95'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>ACCEPT</span>
                    </button>

                    <button
                      onClick={() => updateDriverApplicationStatus(app.id, 'on_hold', 'Awaiting guarantor verification call')}
                      disabled={isHold}
                      className={`px-3 py-1.5 rounded-xl font-black text-xs uppercase flex items-center space-x-1 shadow-md cursor-pointer transition ${
                        isHold
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 opacity-60 cursor-not-allowed'
                          : 'bg-amber-500 hover:bg-amber-600 text-slate-950 active:scale-95'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>HOLD</span>
                    </button>

                    <button
                      onClick={() => handleStatusChange(app.id, 'rejected', app.fullName, 'Incomplete documents')}
                      disabled={isRejected}
                      className={`px-3 py-1.5 rounded-xl font-black text-xs uppercase flex items-center space-x-1 shadow-md cursor-pointer transition ${
                        isRejected
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400 opacity-60 cursor-not-allowed'
                          : 'bg-rose-500 hover:bg-rose-600 text-white active:scale-95'
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>REJECT</span>
                    </button>

                    {confirmDeleteId === app.id ? (
                      <div className="flex items-center space-x-1 bg-rose-950/60 p-1 rounded-xl border border-rose-500/40">
                        <button
                          onClick={() => handleDelete(app.id, app.fullName)}
                          className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white font-black text-[10px] rounded-lg"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white font-bold text-[10px] rounded-lg"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(app.id)}
                        title="Permanently Delete Application"
                        className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30 rounded-xl transition cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Details Inspection Drawer */}
                {selectedApp?.id === app.id && (
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-700 grid grid-cols-1 md:grid-cols-3 gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-xl">

                    {/* 1. Guarantor Details */}
                    <div className="p-3 bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl space-y-1.5">
                      <span className="font-extrabold text-amber-900 dark:text-amber-300 flex items-center space-x-1">
                        <UserCheck className="w-4 h-4 text-amber-500" />
                        <span>Dammaanad-qaade (Guarantor)</span>
                      </span>
                      <div className="text-[11px] space-y-1 text-slate-700 dark:text-slate-300">
                        <p><strong>Name:</strong> {app.guarantor.fullName}</p>
                        <p><strong>Phone:</strong> <span className="font-mono font-bold text-amber-600">{app.guarantor.phone}</span></p>
                        <p><strong>Relation:</strong> {app.guarantor.relationship}</p>
                        <p><strong>Address:</strong> {app.guarantor.address}</p>
                      </div>
                    </div>

                    {/* 2. Somaliland ID & License & Password Management */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl space-y-1.5">
                      <span className="font-extrabold text-slate-900 dark:text-white flex items-center space-x-1">
                        <Award className="w-4 h-4 text-amber-500" />
                        <span>Somaliland ID & Password</span>
                      </span>
                      <div className="text-[11px] space-y-1">
                        <p><strong>SL ID No:</strong> <span className="font-mono font-bold">{app.somalilandIdNumber}</span></p>
                        <p><strong>License No:</strong> <span className="font-mono font-bold">{app.somalilandLicenseNumber}</span></p>
                        <p>
                          <strong>Driver Password:</strong>{' '}
                          <span className="font-mono font-bold text-emerald-500">
                            {app.password || 'Set via Admin below'}
                          </span>
                        </p>
                      </div>

                      {/* Set / Reset Password UI */}
                      {editingPasswordId === app.id ? (
                        <div className="pt-2 space-y-1.5">
                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              value={newDriverPassword}
                              onChange={(e) => setNewDriverPassword(e.target.value)}
                              placeholder="New Driver Password..."
                              className="flex-1 bg-white dark:bg-slate-900 border border-amber-400 rounded-lg px-2.5 py-1 text-xs font-mono font-bold text-slate-900 dark:text-white outline-none"
                            />
                            <button
                              type="button"
                              onClick={handleGeneratePassword}
                              className="px-2 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-lg text-[10px] shrink-0"
                              title="Generate Random Password"
                            >
                              Generate
                            </button>
                          </div>
                          <div className="flex space-x-1.5">
                            <button
                              onClick={() => handleUpdateDriverPassword(app)}
                              className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-lg text-[10px]"
                            >
                              Save Password
                            </button>
                            <button
                              onClick={() => setEditingPasswordId(null)}
                              className="px-2.5 py-1 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-lg text-[10px]"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="pt-1 flex flex-wrap gap-1.5">
                          <button
                            onClick={() => {
                              setEditingPasswordId(app.id);
                              setNewDriverPassword(app.password || '');
                            }}
                            className="px-2 py-1 bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold rounded text-[10px] flex items-center space-x-1 border border-indigo-500/30"
                          >
                            <KeyRound className="w-3 h-3" />
                            <span>Set / Reset Password</span>
                          </button>
                          <a
                            href={app.somalilandIdPhoto}
                            target="_blank"
                            rel="noreferrer"
                            className="px-2 py-1 bg-amber-400 text-slate-950 font-bold rounded text-[10px] flex items-center space-x-1"
                          >
                            <span>SL ID</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>

                    {/* 3. Vehicle Specifications */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl space-y-1.5">
                      <span className="font-extrabold text-slate-900 dark:text-white flex items-center space-x-1">
                        <Car className="w-4 h-4 text-emerald-500" />
                        <span>Vehicle Specs</span>
                      </span>
                      <div className="text-[11px] space-y-1">
                        <p><strong>Category:</strong> <span className="uppercase font-bold text-amber-600">{app.vehicle.category}</span></p>
                        <p><strong>Model:</strong> {app.vehicle.model} ({app.vehicle.color})</p>
                        <p><strong>Plate:</strong> <span className="font-mono font-bold">{app.vehicle.licensePlate}</span></p>
                      </div>
                    </div>

                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
