import React, { useState } from 'react';
import {
  User,
  Phone,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  X,
  Upload,
  Car,
  FileText,
  CreditCard,
  ChevronRight,
  ChevronLeft,
  AlertCircle,
  FileCheck,
  Camera,
  Award,
  Clock,
  UserCheck,
  Lock
} from 'lucide-react';
import { useRide } from '../../context/RideContext';
import { VehicleCategory } from '../../types';
import { SomalilandFlag } from '../Common/SomalilandFlag';
import { isPhoneMatch, normalizeSomalilandPhone } from '../../utils/security';
import { POPULAR_VEHICLE_COLORS, POPULAR_SOMALILAND_CAR_MODELS } from '../../utils/vehicleColors';
import { RealisticCarGraphic } from '../Common/RealisticCarGraphic';

interface DriverRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPhone?: string;
  initialName?: string;
  onSuccess?: (appId: string) => void;
}

export const DriverRegistrationModal: React.FC<DriverRegistrationModalProps> = ({
  isOpen,
  onClose,
  initialPhone,
  initialName,
  onSuccess,
}) => {
  const { submitDriverApplication, login, registerDriver, drivers, driverApplications } = useRide();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    fullName: initialName || '',
    phone: initialPhone || '',
    password: '',
    confirmPassword: '',
    address: '',

    // Guarantor / Responsible Person (Dammaanad-qaade)
    guarantorName: '',
    guarantorPhone: '',
    guarantorRelationship: '',
    guarantorAddress: '',

    // Somaliland ID & Driver License
    somalilandIdNumber: '',
    somalilandLicenseNumber: '',

    // Vehicle Details
    vehicleCategory: 'wadaage_taxi' as VehicleCategory,
    make: '',
    model: '',
    color: '',
    licensePlate: '',

    // Payout Wallet
    walletProvider: 'zaad',
    walletNumber: initialPhone || '',
  });

  // Uploaded document photo URLs / filenames
  const [documents, setDocuments] = useState({
    somalilandIdPhoto: { uploaded: false, fileName: '', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80' },
    somalilandLicensePhoto: { uploaded: false, fileName: '', url: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&auto=format&fit=crop&q=80' },
    driverPhoto: { uploaded: false, fileName: '', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80' },
    vehiclePhoto: { uploaded: false, fileName: '', url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=600&auto=format&fit=crop&q=80' },
  });

  const [submittedAppId, setSubmittedAppId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDocumentUpload = (docKey: keyof typeof documents, file: File | null) => {
    if (file) {
      const objectUrl = URL.createObjectURL(file);
      setDocuments((prev) => ({
        ...prev,
        [docKey]: { uploaded: true, fileName: file.name, url: objectUrl },
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanDigits = normalizeSomalilandPhone(formData.phone);
    if (!cleanDigits || cleanDigits.length < 7) {
      setErrorMessage('Please enter a valid Somaliland phone number (e.g. 63 7123456 or 65 4918201).');
      return;
    }

    const isAlreadyApprovedDriver = drivers.some(d => d.phone && isPhoneMatch(d.phone, cleanDigits) && d.isVerified === true && d.kycStatus === 'approved');

    if (isAlreadyApprovedDriver) {
      setErrorMessage('This phone number is already registered and approved as a Wadaage Driver. Please login instead.');
      return;
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }

    const app = submitDriverApplication({
      fullName: formData.fullName,
      phone: formData.phone,
      password: formData.password || undefined,
      address: formData.address,
      somalilandIdNumber: formData.somalilandIdNumber,
      somalilandIdPhoto: documents.somalilandIdPhoto.url,
      somalilandLicenseNumber: formData.somalilandLicenseNumber,
      somalilandLicensePhoto: documents.somalilandLicensePhoto.url,
      driverPhoto: documents.driverPhoto.url,
      guarantor: {
        fullName: formData.guarantorName,
        phone: formData.guarantorPhone,
        relationship: formData.guarantorRelationship,
        address: formData.guarantorAddress,
      },
      vehicle: {
        category: formData.vehicleCategory,
        model: `${formData.make} ${formData.model}`.trim() || 'Toyota Vitz',
        color: formData.color.trim() || 'White',
        licensePlate: formData.licensePlate.trim() || `SL-${Math.floor(10000 + Math.random() * 90000)}`,
        photoUrl: documents.vehiclePhoto.url,
      },
    });
    setSubmittedAppId(app.id);

    // Also register the driver with pending KYC status so their profile is created for admin review
    registerDriver({
      name: formData.fullName,
      phone: formData.phone,
      password: formData.password || undefined,
      vehicleCategory: formData.vehicleCategory,
      vehicleModel: `${formData.make} ${formData.model}`.trim() || 'Toyota Vitz',
      vehicleColor: formData.color.trim() || 'White',
      licensePlate: formData.licensePlate.trim() || `SL-${Math.floor(10000 + Math.random() * 90000)}`,
      autoApprove: false,
    });

    if (onSuccess) {
      onSuccess(app.id);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 font-sans">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto relative text-slate-900 dark:text-white">

        {/* Top Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg">
                Wadaage Driver Onboarding
              </h3>
              <p className="text-[11px] text-slate-500">Somaliland ID, License & Guarantor Registration</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submittedAppId ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 dark:bg-amber-950/80 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto shadow-inner animate-pulse">
              <Clock className="w-9 h-9" />
            </div>

            <div className="space-y-1.5">
              <h3 className="font-black text-xl">Application Submitted to Admin Control!</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Foomkaaga waa la gudbiyay. Maamulka Wadaage Admin ayaa eegaya aqoonsigaaga Somaliland, ruqsadda, iyo dammaanad-qaadahaaga (Guarantor: <b>{formData.guarantorName}</b>).
              </p>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 p-4 rounded-2xl text-left space-y-2 text-xs">
              <div className="flex items-center justify-between font-bold text-amber-900 dark:text-amber-300">
                <span>Verification Status:</span>
                <span className="bg-amber-500 text-slate-950 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase">
                  PENDING ADMIN VERIFICATION
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Application ID: <span className="font-mono font-bold text-amber-600">{submittedAppId}</span>. Admin can Accept, Hold, or Reject from the Admin Control Panel.
              </p>
            </div>

            <button
              onClick={() => {
                setSubmittedAppId(null);
                onClose();
              }}
              className="w-full py-3.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider transition shadow-lg"
            >
              Close & View Status
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {errorMessage && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
            {/* Step Progress Indicator Bar */}
            <div className="bg-slate-100 dark:bg-slate-800/80 p-2 rounded-2xl border border-slate-200/80 dark:border-slate-700/60">
              <div className="grid grid-cols-4 gap-1 text-center text-[10px] font-extrabold">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className={`py-1.5 rounded-xl transition flex items-center justify-center space-x-1 ${
                    step === 1 ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  <User className="w-3 h-3" />
                  <span className="hidden sm:inline">1. Profile</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className={`py-1.5 rounded-xl transition flex items-center justify-center space-x-1 ${
                    step === 2 ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  <UserCheck className="w-3 h-3" />
                  <span className="hidden sm:inline">2. Guarantor</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className={`py-1.5 rounded-xl transition flex items-center justify-center space-x-1 ${
                    step === 3 ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  <FileText className="w-3 h-3" />
                  <span className="hidden sm:inline">3. ID & License</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className={`py-1.5 rounded-xl transition flex items-center justify-center space-x-1 ${
                    step === 4 ? 'bg-amber-400 text-slate-950 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  <Car className="w-3 h-3" />
                  <span className="hidden sm:inline">4. Vehicle</span>
                </button>
              </div>
            </div>

            {/* STEP 1: Personal Profile & Somaliland Address */}
            {step === 1 && (
              <div className="space-y-3.5 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-sm flex items-center space-x-1.5">
                    <User className="w-4 h-4 text-amber-500" />
                    <span>Driver Personal Information</span>
                  </h4>
                  <span className="text-[10px] text-amber-600 font-bold">Step 1 of 4</span>
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-bold">Magaca Buuxa (Driver Full Name)*</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="e.g. Cabdillaahi Xasan Cali"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white font-semibold outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-600 dark:text-slate-400 font-bold">Taleefanka Darawalka (Somaliland Phone Number)*</label>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                      <SomalilandFlag className="w-3.5 h-2 rounded-xs" />
                      <span>Somaliland (+252 63 / 65)</span>
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                      +252
                    </div>
                    <input
                      type="text"
                      required
                      value={formData.phone.replace(/^(\+252|00252|252|0)/, '')}
                      onChange={(e) => {
                        let val = e.target.value.replace(/^(\+252|00252|252|0)/, '').replace(/\D/g, '').substring(0, 9);
                        setFormData({ ...formData, phone: val ? `+252 ${val.substring(0, 2)} ${val.substring(2)}` : '' });
                      }}
                      placeholder="63 4918201 ama 65..."
                      className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white font-mono font-bold outline-none focus:border-amber-500"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">Ku bilow 63 (Telesom) ama 65 (Somtel)</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1 font-bold">Erayga Sirta Ah (Password)*</label>
                    <input
                      type="password"
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono font-bold outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1 font-bold">Xaqiiji Password*</label>
                    <input
                      type="password"
                      required
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono font-bold outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                  <div>
                    <label className="block text-slate-600 dark:text-slate-400 mb-1 font-bold">Ciwaanka / Xaafada Somaliland (Driver Address)*</label>
                  <input
                    type="text"
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="e.g. Xaafada Jigjiga Yar, Degmada Ibrahim Koodbuur, Hargeysa"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white font-semibold outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-bold">Sawirka Darawalka (Driver Profile Photo Upload)*</label>
                  <label className="p-3 border border-dashed border-amber-400/80 rounded-2xl flex items-center justify-between cursor-pointer bg-amber-50/50 dark:bg-amber-950/20 hover:border-amber-500">
                    <div className="flex items-center space-x-2">
                      <Camera className="w-5 h-5 text-amber-500" />
                      <div>
                        <span className="font-bold block text-slate-900 dark:text-white">{documents.driverPhoto.fileName}</span>
                        <span className="text-[10px] text-slate-500">Upload clear headshot photo of driver</span>
                      </div>
                    </div>
                    <span className="bg-amber-400 text-slate-950 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase">Choose Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleDocumentUpload('driverPhoto', e.target.files?.[0] || null)}
                    />
                  </label>
                </div>

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider transition shadow-lg flex items-center justify-center space-x-1.5 mt-2"
                >
                  <span>Continue to Guarantor Info</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* STEP 2: Responsible Person / Guarantor Info (Dammaanad-qaade) */}
            {step === 2 && (
              <div className="space-y-3.5 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-sm flex items-center space-x-1.5">
                    <UserCheck className="w-4 h-4 text-amber-500" />
                    <span>Dammaanad-qaade (Guarantor / Responsible Person)</span>
                  </h4>
                  <span className="text-[10px] text-amber-600 font-bold">Step 2 of 4</span>
                </div>

                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-2xl text-[11px] text-amber-900 dark:text-amber-300 font-medium">
                  <strong>Standard Security Requirement:</strong> Person who will be legally responsible if anything happens while operating Wadaage rides.
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-bold">Magaca Dammaanad-qaadaha (Guarantor Full Name)*</label>
                  <input
                    type="text"
                    required
                    value={formData.guarantorName}
                    onChange={(e) => setFormData({ ...formData, guarantorName: e.target.value })}
                    placeholder="e.g. Xaaji Ismaaciil Warsame"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white font-semibold outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-600 dark:text-slate-400 font-bold">Taleefanka Dammaanad-qaadaha (Guarantor Phone Number)*</label>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center space-x-1">
                      <SomalilandFlag className="w-3.5 h-2 rounded-xs" />
                      <span>Somaliland</span>
                    </span>
                  </div>
                  <input
                    type="text"
                    required
                    value={formData.guarantorPhone}
                    onChange={(e) => setFormData({ ...formData, guarantorPhone: e.target.value })}
                    placeholder="e.g. 00252634409988"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white font-mono font-bold outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-bold">Xiriirka & Shaqada (Relationship & Occupation)*</label>
                  <input
                    type="text"
                    required
                    value={formData.guarantorRelationship}
                    onChange={(e) => setFormData({ ...formData, guarantorRelationship: e.target.value })}
                    placeholder="e.g. Adeer (Uncle) & Hargeisa Business Owner"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white font-semibold outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-bold">Ciwaanka Dammaanad-qaadaha (Guarantor Address)*</label>
                  <input
                    type="text"
                    required
                    value={formData.guarantorAddress}
                    onChange={(e) => setFormData({ ...formData, guarantorAddress: e.target.value })}
                    placeholder="e.g. Suuqa Barta, 26 June District, Hargeisa"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white font-semibold outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="w-1/3 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-2xl text-xs flex items-center justify-center space-x-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="w-2/3 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider transition shadow-lg flex items-center justify-center space-x-1.5"
                  >
                    <span>Continue to Somaliland ID & License</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Somaliland National ID & Driver's License */}
            {step === 3 && (
              <div className="space-y-3.5 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-sm flex items-center space-x-1.5">
                    <FileText className="w-4 h-4 text-amber-500" />
                    <span>Somaliland National ID & Driver's License</span>
                  </h4>
                  <span className="text-[10px] text-amber-600 font-bold">Step 3 of 4</span>
                </div>

                {/* 1. Somaliland ID Number & Upload */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl space-y-2">
                  <label className="block text-slate-900 dark:text-white font-extrabold">1. Kaadhka Aqoonsiga Somaliland (Somaliland ID)*</label>

                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-500 font-medium">Lambarka Aqoonsiga (ID Number):</span>
                    <input
                      type="text"
                      required
                      value={formData.somalilandIdNumber}
                      onChange={(e) => setFormData({ ...formData, somalilandIdNumber: e.target.value })}
                      placeholder="e.g. SL-ID-884920"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono font-bold outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="pt-1">
                    <span className="text-[11px] text-slate-500 font-medium block mb-1">Sawirka Kaadhka Aqoonsiga (Upload ID Photo):</span>
                    <label className="p-2.5 border border-dashed border-amber-400 rounded-xl flex items-center justify-between cursor-pointer bg-white dark:bg-slate-900">
                      <div className="flex items-center space-x-2 truncate">
                        <Upload className="w-4 h-4 text-amber-500 shrink-0" />
                        <span className="truncate font-semibold text-slate-800 dark:text-slate-200">{documents.somalilandIdPhoto.fileName}</span>
                      </div>
                      <span className="bg-amber-400 text-slate-950 px-2 py-0.5 rounded text-[10px] font-black uppercase shrink-0">Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleDocumentUpload('somalilandIdPhoto', e.target.files?.[0] || null)}
                      />
                    </label>
                  </div>
                </div>

                {/* 2. Somaliland License Number & Upload */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl space-y-2">
                  <label className="block text-slate-900 dark:text-white font-extrabold">2. Ruqsadda Balamaha Gaadhiga (Driver License)*</label>

                  <div className="space-y-1">
                    <span className="text-[11px] text-slate-500 font-medium">Lambarka Ruqsadda (License Number):</span>
                    <input
                      type="text"
                      required
                      value={formData.somalilandLicenseNumber}
                      onChange={(e) => setFormData({ ...formData, somalilandLicenseNumber: e.target.value })}
                      placeholder="e.g. SL-DL-99302"
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono font-bold outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="pt-1">
                    <span className="text-[11px] text-slate-500 font-medium block mb-1">Sawirka Ruqsadda (Upload License Photo):</span>
                    <label className="p-2.5 border border-dashed border-amber-400 rounded-xl flex items-center justify-between cursor-pointer bg-white dark:bg-slate-900">
                      <div className="flex items-center space-x-2 truncate">
                        <Upload className="w-4 h-4 text-amber-500 shrink-0" />
                        <span className="truncate font-semibold text-slate-800 dark:text-slate-200">{documents.somalilandLicensePhoto.fileName}</span>
                      </div>
                      <span className="bg-amber-400 text-slate-950 px-2 py-0.5 rounded text-[10px] font-black uppercase shrink-0">Upload</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleDocumentUpload('somalilandLicensePhoto', e.target.files?.[0] || null)}
                      />
                    </label>
                  </div>
                </div>

                <div className="flex space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="w-1/3 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-2xl text-xs flex items-center justify-center space-x-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(4)}
                    className="w-2/3 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider transition shadow-lg flex items-center justify-center space-x-1.5"
                  >
                    <span>Vehicle & Category Details</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: Vehicle Details & Submission */}
            {step === 4 && (
              <div className="space-y-3.5 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-sm flex items-center space-x-1.5">
                    <Car className="w-4 h-4 text-amber-500" />
                    <span>Vehicle Information & Submission</span>
                  </h4>
                  <span className="text-[10px] text-amber-600 font-bold">Step 4 of 4</span>
                </div>

                {/* Wadaage Service Category */}
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-bold">Wadaage Service Category*</label>
                  <select
                    value={formData.vehicleCategory}
                    onChange={(e) => setFormData({ ...formData, vehicleCategory: e.target.value as VehicleCategory })}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white font-bold outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="wadaage_both">✨ Labada Adeegba (Both: Normal Taxi & Wadaage Share)</option>
                    <option value="wadaage_taxi">🚖 Normal Taxi (Private City Sedan)</option>
                    <option value="wadaage_share">👥 Wadaage Share (Gaadhi Wadaag / Shared Carpool)</option>
                  </select>
                </div>

                {/* Make & Model with Quick Presets */}
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-bold">Model-ka Gaadhiga (Car Model)*</label>
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      required
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      placeholder="e.g. Toyota Vitz, Corolla Fielder, Probox..."
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white font-semibold outline-none focus:border-amber-500"
                    />
                    <div className="flex flex-wrap gap-1.5">
                      {POPULAR_SOMALILAND_CAR_MODELS.slice(0, 6).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setFormData({ ...formData, model: m })}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition ${
                            formData.model.toLowerCase().includes(m.toLowerCase())
                              ? 'bg-amber-400 text-slate-950 border-amber-500 font-black shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Real Car Color Selector (Midabka Gaadhiga) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-slate-600 dark:text-slate-400 font-bold">Midabka Gaadhiga (Real Car Color)*</label>
                    <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 uppercase">
                      Selected: {formData.color || 'White (Cadaan)'}
                    </span>
                  </div>

                  {/* Visual Color Swatches */}
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 mb-2">
                    {POPULAR_VEHICLE_COLORS.slice(0, 8).map((c) => {
                      const isSelected = (formData.color || 'White').toLowerCase().includes(c.id);
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, color: c.name })}
                          className={`flex flex-col items-center p-1.5 rounded-xl border transition ${
                            isSelected
                              ? 'border-amber-500 bg-amber-500/10 ring-2 ring-amber-400 shadow-md'
                              : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-slate-400'
                          }`}
                          title={`${c.name} (${c.somaliName})`}
                        >
                          <span
                            className="w-5 h-5 rounded-full border border-black/20 shadow-xs mb-1"
                            style={{ backgroundColor: c.hex }}
                          />
                          <span className="text-[9px] font-bold text-slate-700 dark:text-slate-200 truncate w-full text-center">
                            {c.somaliName.split(' ')[0]}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="ama qor midab kale (e.g. Blue, White, Silver, Black, Red)..."
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-semibold outline-none focus:border-amber-500 text-xs"
                  />
                </div>

                {/* Live Real Car Visual Graphic Preview */}
                <div className="p-3 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between shadow-inner">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-mono uppercase tracking-wider text-emerald-400 font-bold block">
                      Live Vehicle Visual Preview
                    </span>
                    <h5 className="text-white font-black text-sm">{formData.model || 'Toyota Vitz'}</h5>
                    <p className="text-slate-400 text-[11px] font-semibold flex items-center gap-1.5">
                      <span>Midabka:</span>
                      <span className="text-amber-400 font-bold">{formData.color || 'White (Cadaan)'}</span>
                      <span>•</span>
                      <span className="font-mono text-slate-300">{formData.licensePlate || 'SL-4921'}</span>
                    </p>
                  </div>
                  <RealisticCarGraphic
                    color={formData.color || 'White'}
                    model={formData.model || 'Toyota Vitz'}
                    className="w-24 h-14"
                  />
                </div>

                {/* Plate Number */}
                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-bold">Taargada Gaadhiga (Plate Number)*</label>
                  <input
                    type="text"
                    required
                    value={formData.licensePlate}
                    onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
                    placeholder="e.g. SL-77890-A"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white font-mono font-bold outline-none focus:border-amber-500 uppercase"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 dark:text-slate-400 mb-1 font-bold">Sawirka Gaadhiga (Vehicle Photo Upload)*</label>
                  <label className="p-2.5 border border-dashed border-amber-400 rounded-xl flex items-center justify-between cursor-pointer bg-slate-50 dark:bg-slate-800">
                    <div className="flex items-center space-x-2 truncate">
                      <Camera className="w-4 h-4 text-amber-500 shrink-0" />
                      <span className="truncate font-semibold text-slate-800 dark:text-slate-200">{documents.vehiclePhoto.fileName}</span>
                    </div>
                    <span className="bg-amber-400 text-slate-950 px-2 py-0.5 rounded text-[10px] font-black uppercase shrink-0">Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleDocumentUpload('vehiclePhoto', e.target.files?.[0] || null)}
                    />
                  </label>
                </div>

                {/* Terms Box */}
                <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-2xl text-[11px] text-amber-900 dark:text-amber-300 font-medium space-y-1">
                  <div className="font-bold flex items-center justify-between">
                    <span>Admin Control Verification:</span>
                    <span className="bg-amber-500 text-slate-950 px-2 py-0.5 rounded text-[9px] font-black">REQUIRES APPROVAL</span>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Once submitted, the Admin will verify your Somaliland ID ({formData.somalilandIdNumber}), license ({formData.somalilandLicenseNumber}), and call your Guarantor ({formData.guarantorName}).
                  </p>
                </div>

                <div className="flex space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    className="w-1/3 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-2xl text-xs flex items-center justify-center space-x-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                  <button
                    type="submit"
                    className="w-2/3 py-3 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-600 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider transition shadow-lg flex items-center justify-center space-x-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Submit Application for Admin Approval</span>
                  </button>
                </div>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};
