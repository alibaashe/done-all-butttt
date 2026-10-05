import React from 'react';
import { Check, ShieldCheck, UserCheck, X, FileCheck, FileX, AlertCircle } from 'lucide-react';
import { useRide } from '../../context/RideContext';

interface DriverKYCModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DriverKYCModal: React.FC<DriverKYCModalProps> = ({ isOpen, onClose }) => {
  const { drivers, approveDriver } = useRide();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative max-h-[85vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
            <FileCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base">Driver KYC & Vehicle Inspection Verification</h3>
            <p className="text-xs text-slate-500">Audit government background checks, licenses & vehicle registration</p>
          </div>
        </div>

        <div className="space-y-3">
          {drivers.length === 0 ? (
            <div className="text-center py-8 px-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800">
              <ShieldCheck className="w-10 h-10 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
              <p className="font-extrabold text-sm text-slate-800 dark:text-slate-200">No Active Drivers Registered</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Ready for live drivers. When drivers submit their application and upload their Somaliland ID and Driver&apos;s License, you can review and approve them here.
              </p>
            </div>
          ) : (
            drivers.map((driver) => (
              <div
                key={driver.id}
                className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/50 text-xs flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={driver.avatar}
                    alt={driver.name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-emerald-500"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 dark:text-white">{driver.name}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                          driver.isVerified
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : 'bg-amber-500/10 text-amber-500'
                        }`}
                      >
                        {driver.isVerified ? 'VERIFIED' : 'KYC PENDING'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">{driver.vehicle.model} ({driver.vehicle.licensePlate})</p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                      <span>License: {driver.documentsVerified.driverLicense ? '✅ Verified' : '❌ Pending'}</span>
                      <span>Insurance: {driver.documentsVerified.vehicleInsurance ? '✅ Active' : '⚠️ Due'}</span>
                    </div>
                  </div>
                </div>

                {!driver.isVerified ? (
                  <button
                    onClick={() => approveDriver(driver.id)}
                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1 shadow-sm transition"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Approve KYC
                  </button>
                ) : (
                  <div className="text-emerald-500 font-bold flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4" />
                    Approved
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
