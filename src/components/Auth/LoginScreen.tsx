import {
  ArrowRight,
  Car,
  Lock,
  Mail,
  Phone,
  Shield,
  User,
  Eye,
  EyeOff,
  KeyRound,
  Send,
  CheckCircle2,
  ChevronRight,
  Sparkles,
  Zap,
  Globe,
  ArrowLeft,
  CheckCircle,
  FileCheck,
  Clock,
  AlertCircle,
  Users,
  Star,
  Bike,
  ExternalLink,
} from 'lucide-react';
import React, { useState } from 'react';
import { useRide } from '../../context/RideContext';
import { AuthUser, UserRole, VehicleCategory, DriverApplication } from '../../types';
import { DriverRegistrationModal } from '../Driver/DriverRegistrationModal';
import { sendWhatsAppOtp, verifyWhatsAppOtp, displayFormattedPhone } from '../../services/whatsappOtpService';
import { WadaageLogo } from '../Common/WadaageLogo';
import { SomalilandFlag } from '../Common/SomalilandFlag';
import { INITIAL_REGISTERED_USERS, INITIAL_DRIVERS, INITIAL_DRIVER_APPLICATIONS } from '../../data/mockData';
import { secureStorage, safeJsonParse, isPhoneMatch, normalizeSomalilandPhone } from '../../utils/security';
import { verifyCredentialsOnline } from '../../services/firebase';

// Helper to keep local device storage updated with verified credentials
const syncUserToLocalCache = (user: any, verifiedPassword?: string) => {
  try {
    const raw = localStorage.getItem('wadaage_user_management_records');
    const records = safeJsonParse(raw, []);
    const cleanDigits = String(user.phone || '').replace(/\D/g, '');
    const idx = records.findIndex((r: any) => r.id === user.id || (cleanDigits && String(r.phone || '').replace(/\D/g, '').endsWith(cleanDigits)));
    const pwd = verifiedPassword || user.password;
    if (idx >= 0) {
      records[idx] = { ...records[idx], ...user, password: pwd };
    } else {
      records.unshift({
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role === 'admin' ? 'Admin' : user.role === 'driver' ? 'Driver' : 'Passenger',
        password: pwd,
        status: 'Active',
        rating: user.rating || 5.0,
        trips: user.totalTrips || 0,
        registeredAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      });
    }
    localStorage.setItem('wadaage_user_management_records', JSON.stringify(records));

    const rawUsers = localStorage.getItem('wadaage_registered_users');
    const regUsers = safeJsonParse(rawUsers, []);
    const uIdx = regUsers.findIndex((u: any) => u.id === user.id || (cleanDigits && String(u.phone || '').replace(/\D/g, '').endsWith(cleanDigits)));
    if (uIdx >= 0) {
      regUsers[uIdx] = { ...regUsers[uIdx], ...user, password: pwd };
    } else {
      regUsers.unshift({ ...user, password: pwd });
    }
    localStorage.setItem('wadaage_registered_users', JSON.stringify(regUsers));
    secureStorage.setItem('wadaage_registered_users', regUsers);
  } catch (_e) {}
};

const syncDriverToLocalCache = (driver: any, verifiedPassword?: string) => {
  try {
    const pwd = verifiedPassword || driver.password;
    const cleanDigits = String(driver.phone || '').replace(/\D/g, '');

    const raw = localStorage.getItem('wadaage_user_management_records');
    const records = safeJsonParse(raw, []);
    const idx = records.findIndex((r: any) => r.id === driver.id || (cleanDigits && String(r.phone || '').replace(/\D/g, '').endsWith(cleanDigits)));
    if (idx >= 0) {
      records[idx] = { ...records[idx], ...driver, password: pwd, role: 'Driver' };
    } else {
      records.unshift({
        id: driver.id,
        name: driver.name,
        phone: driver.phone,
        role: 'Driver',
        password: pwd,
        status: 'Active',
        rating: driver.rating || 5.0,
        trips: driver.totalTrips || 0,
        registeredAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      });
    }
    localStorage.setItem('wadaage_user_management_records', JSON.stringify(records));

    const rawDrivers = localStorage.getItem('wadaage_registered_drivers');
    const regDrivers = safeJsonParse(rawDrivers, []);
    const dIdx = regDrivers.findIndex((d: any) => d.id === driver.id || (cleanDigits && String(d.phone || '').replace(/\D/g, '').endsWith(cleanDigits)));
    if (dIdx >= 0) {
      regDrivers[dIdx] = { ...regDrivers[dIdx], ...driver, password: pwd };
    } else {
      regDrivers.unshift({ ...driver, password: pwd });
    }
    localStorage.setItem('wadaage_registered_drivers', JSON.stringify(regDrivers));

    const customDrivers = secureStorage.getItem<any[]>('wadaage_custom_drivers', []) || [];
    const cIdx = customDrivers.findIndex((d: any) => d.id === driver.id || (cleanDigits && String(d.phone || '').replace(/\D/g, '').endsWith(cleanDigits)));
    if (cIdx >= 0) {
      customDrivers[cIdx] = { ...customDrivers[cIdx], ...driver, password: pwd };
    } else {
      customDrivers.unshift({ ...driver, password: pwd });
    }
    secureStorage.setItem('wadaage_custom_drivers', customDrivers);
  } catch (_e) {}
};

export const LoginScreen: React.FC = () => {
  const {
    login,
    registerRider,
    registerDriver,
    drivers,
    driverApplications,
    role,
    language,
    setLanguage,
    t,
  } = useRide();

  // Selected role is locked directly to the active standalone application
  const selectedRole: UserRole = role || 'passenger';
  const [isRegisterMode, setIsRegisterMode] = useState(true);
  const [showDriverKycModal, setShowDriverKycModal] = useState(false);

  // Form states for Phone + Data
  const [phoneNumber, setPhoneNumber] = useState('');
  const [adminEmailOrPhone, setAdminEmailOrPhone] = useState('baashe2002@gmail.com');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Driver specific registration states: can choose Wadaage Share, Normal Taxi, or Both
  const [driverServiceChoice, setDriverServiceChoice] = useState<'wadaage_both' | 'wadaage_taxi' | 'wadaage_share'>('wadaage_both');
  const [vehicleCategory, setVehicleCategory] = useState<VehicleCategory>('wadaage_both');
  const [vehicleModel, setVehicleModel] = useState('Toyota Vitz');
  const [licensePlate, setLicensePlate] = useState('SL-38910');
  const [vehicleColor, setVehicleColor] = useState('White');

  // Loading and feedback states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // WhatsApp OTP Verification Step States
  const [showOtpStep, setShowOtpStep] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [otpTimer, setOtpTimer] = useState(120); // 2-minute countdown clock
  const [pendingRegistrationData, setPendingRegistrationData] = useState<any>(null);

  // 2-minute countdown ticker clock effect
  React.useEffect(() => {
    let interval: any = null;
    if (showOtpStep && otpTimer > 0) {
      interval = setInterval(() => setOtpTimer((prev) => prev - 1), 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [showOtpStep, otpTimer]);

  // Handle OTP Verification Submit
  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!otpInput.trim() || otpInput.trim().length < 4) {
      setFormError(language === 'so' ? 'Fadlan geli koodka xaqiijinta (OTP)' : 'Please enter the verification OTP code');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await verifyWhatsAppOtp(
        pendingRegistrationData?.cleanPhone || phoneNumber,
        otpInput.trim(),
        pendingRegistrationData,
        pendingRegistrationData?.role || selectedRole
      );

      setIsSubmitting(false);

      if (res.success) {
        setShowOtpStep(false);

        if (pendingRegistrationData?.role === 'driver') {
          registerDriver({
            name: pendingRegistrationData.fullName,
            phone: pendingRegistrationData.phone,
            password: pendingRegistrationData.password,
            vehicleCategory: pendingRegistrationData.vehicleCategory,
            vehicleModel: pendingRegistrationData.vehicleModel,
            licensePlate: pendingRegistrationData.licensePlate,
            vehicleColor: pendingRegistrationData.vehicleColor,
            autoApprove: false,
          });

          // DO NOT auto-enter system for drivers! Must wait until admin verifies and accepts documents!
          const driverPhoneSubmitted = pendingRegistrationData?.phone || getFullPhone();
          setShowOtpStep(false);
          setIsSubmitting(false);
          setPendingRegistrationData(null);
          setOtpInput('');
          setSuccessModalData({
            title: language === 'so' ? 'Codsiga Darawalka Waa La Gudbiyay' : 'Driver Registration Submitted!',
            message:
              language === 'so'
                ? 'Xaqiijinta WhatsApp-ka waa guul! Codsigaaga iyo dukumentiyadaada waxa loo gudbiyay Maamulka Wadaage Admin. Nidaamka ma gali kartid ilaa maamuluhu ka hubiyo oo ka ansixiyo dukumentiyadaada (Somaliland ID & Driver License). Marka laguu aqbalo (accepted), tab-ka "Gal Akoonka" ayaad ka gali doontaa.'
                : 'WhatsApp verification successful! Your registration and documents have been submitted to Wadaage Admin. You cannot access the driver platform until an administrator reviews and accepts your documents. Once approved by Admin, you can sign in directly from the Sign In tab.',
            status: 'pending',
            phone: driverPhoneSubmitted,
          });
        } else {
          // Rider registration: immediately gain system access once OTP is verified!
          const newRider = registerRider({
            name: pendingRegistrationData?.fullName || fullName,
            phone: pendingRegistrationData?.phone || getFullPhone(),
            password: pendingRegistrationData?.password || password,
          });

          setShowOtpStep(false);
          setPendingRegistrationData(null);
          setIsSubmitting(false);
          login(newRider);
          return;
        }
      } else {
        setFormError(res.message || (language === 'so' ? 'Koodka OTP ma saxna' : 'Invalid OTP code'));
      }
    } catch (_e) {
      setIsSubmitting(false);
      setFormError('Network error during OTP verification. Please try again.');
    }
  };

  const [successModalData, setSuccessModalData] = useState<{
    title: string;
    message: string;
    status: 'pending' | 'approved';
    phone: string;
  } | null>(null);

  // Sanitizes phone input and handles +252 prefix with 63/65 continuation
  const handlePhoneInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    // Strip leading +252 or 00252 if pasted
    val = val.replace(/^\+?252|^00252/, '');
    // If user types leading 0 (e.g. 063 or 065), strip it so it starts with 63 or 65
    if (val.startsWith('0')) {
      val = val.substring(1);
    }
    // Only allow digits up to 9 numbers (e.g. 63XXXXXXX or 65XXXXXXX)
    const cleanDigits = val.replace(/\D/g, '').substring(0, 9);
    setPhoneNumber(cleanDigits);
    if (formError) setFormError(null);
  };

  // Format full normalized international phone
  const getCleanPhoneDigits = () => {
    let clean = phoneNumber.replace(/\D/g, '');
    if (clean.startsWith('00252')) clean = clean.substring(5);
    else if (clean.startsWith('252')) clean = clean.substring(3);
    else if (clean.startsWith('0')) clean = clean.substring(1);
    return clean;
  };

  const getFullPhone = () => {
    const clean = getCleanPhoneDigits();
    if (clean.length >= 2) {
      return `+252 ${clean.substring(0, 2)} ${clean.substring(2)}`;
    }
    return `+252 ${clean}`;
  };

  const toggleLanguage = () => {
    setLanguage(language === 'so' ? 'en' : 'so');
  };

  // Helper to lookup registered rider using strict Somaliland phone matching
  const findRegisteredRider = (inputPhone: string) => {
    const cleanTarget = normalizeSomalilandPhone(inputPhone);
    if (!cleanTarget || cleanTarget.length < 7) return null;

    try {
      const deletedIds = (() => {
        try {
          const raw = localStorage.getItem('wadaage_deleted_user_ids');
          return raw ? new Set(JSON.parse(raw)) : new Set();
        } catch {
          return new Set();
        }
      })();

      const registeredUsers: AuthUser[] = secureStorage.getItem<AuthUser[]>('wadaage_registered_users', []) || [];
      const localRegUsers: AuthUser[] = (() => {
        try {
          const raw = localStorage.getItem('wadaage_registered_users');
          return raw ? JSON.parse(raw) : [];
        } catch {
          return [];
        }
      })();
      const adminUsers: AuthUser[] = (() => {
        try {
          const raw = localStorage.getItem('wadaage_user_management_records');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              return parsed
                .filter((p: any) => p.role === 'Passenger' || p.role === 'passenger')
                .map((p: any) => ({
                  id: p.id,
                  name: p.name,
                  email: p.email,
                  phone: p.phone,
                  password: p.password,
                  role: 'passenger' as const,
                }));
            }
          }
        } catch {
          return [];
        }
        return [];
      })();

      const allRiders = [...adminUsers, ...localRegUsers, ...registeredUsers, ...INITIAL_REGISTERED_USERS];

      return allRiders.find((u) => {
        if (!u || !u.phone) return false;
        // Strict role check: must be a passenger / rider (never match driver or admin records)
        const isRiderRole = u.role === 'passenger' || (!u.role && !('vehicle' in u) && !('vehicleCategory' in u));
        if (!isRiderRole) return false;
        if (deletedIds.has(u.id) || (u.phone && deletedIds.has(u.phone))) return false;
        return isPhoneMatch(u.phone, cleanTarget);
      }) || null;
    } catch {
      return null;
    }
  };

  // Helper to lookup driver in drivers list and applications using strict Somaliland phone matching
  const findDriverRecord = (inputPhone: string) => {
    const cleanTarget = normalizeSomalilandPhone(inputPhone);
    if (!cleanTarget || cleanTarget.length < 7) {
      return { driver: null, application: null };
    }

    try {
      const deletedIds = (() => {
        try {
          const raw = localStorage.getItem('wadaage_deleted_user_ids');
          return raw ? new Set(JSON.parse(raw)) : new Set();
        } catch {
          return new Set();
        }
      })();

      const adminDrivers: any[] = (() => {
        try {
          const raw = localStorage.getItem('wadaage_user_management_records');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              return parsed
                .filter((p: any) => p.role === 'Driver' || p.role === 'driver')
                .map((p: any) => ({
                  id: p.id,
                  name: p.name,
                  phone: p.phone,
                  password: p.password,
                  isVerified: p.status === 'Active' || p.status === 'active',
                  kycStatus: p.status === 'Active' || p.status === 'active' ? 'approved' : 'pending',
                  status: p.status === 'Active' || p.status === 'active' ? 'available' : 'pending',
                  vehicle: {
                    model: 'Toyota Vitz',
                    licensePlate: 'SL-2026',
                    category: 'wadaage_both',
                  },
                }));
            }
          }
        } catch {
          return [];
        }
        return [];
      })();

      const allDrivers = [...adminDrivers, ...drivers, ...INITIAL_DRIVERS];
      const allApps = [...driverApplications, ...INITIAL_DRIVER_APPLICATIONS];

      const dRecord = allDrivers.find((d) => {
        if (!d || !d.phone) return false;
        if (deletedIds.has(d.id) || (d.phone && deletedIds.has(d.phone))) return false;
        return isPhoneMatch(d.phone, cleanTarget);
      }) || null;

      const appRecord = allApps.find((a) => {
        if (!a || !a.phone) return false;
        if (deletedIds.has(a.id) || (a.phone && deletedIds.has(a.phone))) return false;
        return isPhoneMatch(a.phone, cleanTarget);
      }) || null;

      return { driver: dRecord, application: appRecord };
    } catch {
      return { driver: null, application: null };
    }
  };

  // Handle Form Submit
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Super Admin Direct Login
    if (selectedRole === 'admin') {
      handleAdminLogin();
      return;
    }

    const cleanPhone = getCleanPhoneDigits();
    if (!cleanPhone || cleanPhone.length < 7) {
      setFormError(
        language === 'so'
          ? 'Fadlan geli lambar taleefan oo sax ah (Ku bilow 63 ama 65, tusaale: 63 7123456)'
          : 'Please enter a valid phone number (Start with 63 or 65, e.g. 63 7123456)'
      );
      return;
    }

    if (!cleanPhone.startsWith('63') && !cleanPhone.startsWith('65')) {
      if (cleanPhone.length === 7) {
        setFormError(
          language === 'so'
            ? `Fadlan lambarka ku bilow 63 ama 65 (tusaale: 63${cleanPhone} ama 65${cleanPhone})`
            : `Please prepend 63 or 65 to your 7-digit number (e.g. 63${cleanPhone} or 65${cleanPhone})`
        );
        return;
      }
      setFormError(
        language === 'so'
          ? 'Lambarka taleefanku waa inuu ku bilaabmaa 63 (Telesom) ama 65 (Somtel)'
          : 'Phone number must start with 63 (Telesom) or 65 (Somtel)'
      );
      return;
    }

    const formattedPhone = getFullPhone();
    const cleanFullPhone = `252${cleanPhone}`;

    setIsSubmitting(true);

    try {
      if (selectedRole === 'passenger') {
        // ==================== RIDER FLOW ====================
        if (isRegisterMode) {
          // --- Register New Rider via WhatsApp OTP ---
          if (!fullName.trim()) {
            setIsSubmitting(false);
            setFormError(language === 'so' ? 'Fadlan qor magacaaga buuxa' : 'Please enter your full name');
            return;
          }

          if (!password || password.trim().length < 4) {
            setIsSubmitting(false);
            setFormError(language === 'so' ? 'Fadlan samey eray sir ah oo sugan (uguyaraan 4 xaraf)' : 'Please enter a secure password (at least 4 characters)');
            return;
          }

          // Duplicate phone number validation
          const existingRider = findRegisteredRider(cleanPhone);
          if (existingRider) {
            setIsSubmitting(false);
            setFormError(language === 'so'
              ? 'Lambarkani hore ayuu u diiwaangashanaa. Fadlan gal akoonkaaga (Please login instead).'
              : 'This phone number is already registered. Please login instead.');
            return;
          }

          setPendingRegistrationData({
            role: 'passenger',
            fullName: fullName.trim(),
            phone: formattedPhone,
            cleanPhone,
            password: password.trim(),
          });

          // Dispatch WhatsApp OTP
          const sendRes = await sendWhatsAppOtp(cleanPhone, 'rider', fullName.trim());
          setIsSubmitting(false);

          if (sendRes.success) {
            setShowOtpStep(true);
            setOtpTimer(120);
            setOtpInput('');
          } else {
            setFormError(sendRes.message || 'WhatsApp OTP delivery failed. Please try again.');
          }
          return;
        } else {
          // --- Sign In Existing Rider ---
          let existing = findRegisteredRider(cleanFullPhone) || findRegisteredRider(cleanPhone);

          // If not found locally or password mismatch with local cache, verify real-time online
          if (!existing || (existing.password && password && existing.password.trim() !== password.trim())) {
            const onlineCheck = await verifyCredentialsOnline(cleanPhone, 'passenger', password.trim());
            if (onlineCheck.success && onlineCheck.user) {
              existing = onlineCheck.user;
              syncUserToLocalCache(onlineCheck.user, password.trim());
            } else if (onlineCheck.foundUser && onlineCheck.error === 'WRONG_PASSWORD') {
              setIsSubmitting(false);
              setFormError(
                language === 'so'
                  ? 'Erayga sirta ah (Password) ma saxna. Fadlan dib u hubi ama la xidhiidh maamulka.'
                  : 'Invalid password. Please check your password or contact Wadaage Admin.'
              );
              return;
            }
          }

          if (!existing) {
            setIsSubmitting(false);
            setFormError(
              language === 'so'
                ? 'Lambar lagama helin xisaabaadka rakaabka ee diiwaangashan. Fadlan tab-ka sare ka dooro "Is-diiwaangeli" si aad akoon cusub u samaysato.'
                : 'Phone number not found in registered riders. Please click "Is-diiwaangeli (New Rider)" above to create an account.'
            );
            return;
          }

          // Verify rider password if one is set or required
          if (existing.password) {
            if (!password) {
              setIsSubmitting(false);
              setFormError(language === 'so' ? 'Fadlan geli erayga sirta ah ee akoonkaaga (Password)' : 'Please enter your password');
              return;
            }
            if (password.trim() !== existing.password.trim()) {
              setIsSubmitting(false);
              setFormError(
                language === 'so'
                  ? 'Erayga sirta ah (Password) ma saxna. Fadlan dib u hubi ama la xidhiidh maamulka.'
                  : 'Invalid password. Please check your password or contact Wadaage Admin.'
              );
              return;
            }
          }

          const riderUser: AuthUser = {
            id: existing.id,
            name: existing.name,
            phone: existing.phone || formattedPhone,
            email: existing.email || `${cleanPhone}@wadaage.com`,
            role: 'passenger',
            password: existing.password || password.trim() || undefined,
            avatar: existing.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          };
          setIsSubmitting(false);
          login(riderUser);
        }
      } else if (selectedRole === 'driver') {
        // ==================== DRIVER FLOW ====================
        if (isRegisterMode) {
          // --- Register New Driver via WhatsApp OTP ---
          if (!fullName.trim()) {
            setIsSubmitting(false);
            setFormError(language === 'so' ? 'Fadlan qor magaca darawalka' : 'Please enter driver full name');
            return;
          }

          if (!password || password.trim().length < 4) {
            setIsSubmitting(false);
            setFormError(language === 'so' ? 'Fadlan geli erayga sirta ah ee darawalka (uguyaraan 4 xaraf)' : 'Please enter a driver password (at least 4 characters)');
            return;
          }

          // Duplicate driver phone check: only block if this driver is already APPROVED by Admin
          const { driver: existingDriver, application: existingApp } = findDriverRecord(cleanPhone);
          const isAlreadyApproved = existingDriver?.isVerified === true && existingDriver?.kycStatus === 'approved';
          if (isAlreadyApproved) {
            setIsSubmitting(false);
            setFormError(language === 'so'
              ? 'Lambarkani waa darawal hore loo ansixiyay. Fadlan tab-ka sare ka dooro "Gal Akoonka (Sign In)" si aad u gasho.'
              : 'This phone number is already registered and approved. Please switch to the "Sign In" tab to log in.');
            return;
          }

          const effectiveCategory: VehicleCategory = driverServiceChoice;

          setPendingRegistrationData({
            role: 'driver',
            fullName: fullName.trim(),
            phone: formattedPhone,
            cleanPhone,
            password: password.trim(),
            vehicleCategory: effectiveCategory,
            vehicleModel: vehicleModel.trim() || 'Toyota Vitz',
            licensePlate: licensePlate.trim() || `SL-${Math.floor(10000 + Math.random() * 90000)}`,
            vehicleColor: vehicleColor.trim() || 'White',
          });

          // Dispatch WhatsApp OTP
          const sendRes = await sendWhatsAppOtp(cleanPhone, 'driver', fullName.trim());
          setIsSubmitting(false);

          if (sendRes.success) {
            setShowOtpStep(true);
            setOtpTimer(120);
            setOtpInput('');
          } else {
            setFormError(sendRes.message || 'WhatsApp OTP delivery failed. Please try again.');
          }
          return;
        } else {
          // --- Sign In Existing Driver ---
          if (!password) {
            setIsSubmitting(false);
            setFormError(language === 'so' ? 'Fadlan geli erayga sirta ah ee darawalka (Password)' : 'Please enter driver password');
            return;
          }

          let { driver: existingDriver, application: existingApp } = findDriverRecord(cleanFullPhone);
          let storedPassword = existingDriver?.password || existingApp?.password;

          // If driver not found locally, or storedPassword missing or does not match entered password:
          // Check online immediately against Firestore and server API!
          if (!existingDriver && !existingApp || !storedPassword || password.trim() !== storedPassword.trim()) {
            const onlineCheck = await verifyCredentialsOnline(cleanPhone, 'driver', password.trim());
            if (onlineCheck.success && onlineCheck.user) {
              const verifiedUser = onlineCheck.user;
              syncDriverToLocalCache(verifiedUser, password.trim());
              const isOnlineApproved = Boolean(
                (verifiedUser.isVerified === true || verifiedUser.is_verified === true) &&
                (verifiedUser.kycStatus === 'approved' || verifiedUser.kyc_status === 'approved')
              );
              existingDriver = {
                id: verifiedUser.id,
                name: verifiedUser.name,
                phone: verifiedUser.phone,
                password: password.trim(),
                isVerified: isOnlineApproved,
                kycStatus: isOnlineApproved ? 'approved' : 'pending',
                rating: verifiedUser.rating || 5.0,
                totalTrips: verifiedUser.totalTrips || 0,
                status: isOnlineApproved ? 'available' : 'offline',
                avatar: verifiedUser.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
                vehicle: verifiedUser.vehicle || {
                  model: 'Toyota Vitz',
                  licensePlate: 'SL-2026',
                  category: 'wadaage_both',
                  color: 'White',
                  capacity: 4,
                },
                currentLocation: { lat: 9.5600, lng: 44.0650 },
                todayEarnings: 0,
                weeklyEarnings: 0,
              };
              storedPassword = password.trim();
            } else if (onlineCheck.foundUser && onlineCheck.error === 'WRONG_PASSWORD') {
              setIsSubmitting(false);
              setFormError(
                language === 'so'
                  ? 'Erayga sirta ah (Password) ma saxna. Fadlan hubi erayga sirta ah ama la xidhiidh maamulka admin-ka.'
                  : 'Invalid driver password. Please check your password or contact Wadaage Admin.'
              );
              return;
            }
          }

          if (!existingDriver && !existingApp) {
            setIsSubmitting(false);
            setFormError(
              language === 'so'
                ? 'Lambar lagama helin xisaabaadka darawallada. Fadlan tab-ka sare ka dooro "Is-diiwaangeli" si aad xogtaada darawalka u gudbiso.'
                : 'Phone number not found in registered drivers. Please switch to "Is-diiwaangeli (New Driver)" above to register.'
            );
            return;
          }

          if (!storedPassword || password.trim() !== storedPassword.trim()) {
            setIsSubmitting(false);
            setFormError(
              language === 'so'
                ? 'Erayga sirta ah (Password) ma saxna. Fadlan hubi erayga sirta ah ama la xidhiidh maamulka admin-ka.'
                : 'Invalid driver password. Please check your password or contact Wadaage Admin.'
            );
            return;
          }

          const isApproved =
            (existingDriver?.isVerified === true && existingDriver?.kycStatus === 'approved') ||
            (existingApp?.status === 'approved');

          if (existingApp?.status === 'rejected') {
            setIsSubmitting(false);
            setFormError(
              language === 'so'
                ? 'Xisaabtaada darawalnimo waa la diiday (Registration Denied). Fadlan la xidhiidh maamulka Wadaage (+252 63 6807814).'
                : 'Your driver registration was denied by Admin. Please contact Wadaage Support (+252 63 6807814).'
            );
            return;
          }

          if (!isApproved) {
            setIsSubmitting(false);
            setFormError(
              language === 'so'
                ? 'Akoonkaaga darawalku wali wuxuu ku jiraa dib-u-eegis (Pending Admin Verification). Fadlan sug inta maamuluhu ka hubinayo dukumentiyadaada oo ka ansixinayo.'
                : 'Your driver account is pending verification by Wadaage Admin. Please wait for document review and approval before accessing the driver platform.'
            );
            return;
          }

          // Approved Driver Login
          const driverBal = existingDriver?.walletBalanceUsd !== undefined ? Number(existingDriver.walletBalanceUsd) : 0.00;
          const driverUser: AuthUser = {
            id: existingDriver?.id || existingApp?.id || `drv_${Date.now()}`,
            name: existingDriver?.name || existingApp?.fullName || 'Wadaage Captain',
            email: `${cleanPhone}@wadaage.com`,
            phone: formattedPhone,
            role: 'driver',
            avatar: existingDriver?.avatar || existingApp?.driverPhoto || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
            walletBalanceUsd: driverBal,
            wallet_balance_usd: driverBal,
          };

          setIsSubmitting(false);
          login(driverUser);
        }
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setFormError(err?.message || (language === 'so' ? 'Khalad ayaa dhacay. Fadlan isku day markale.' : 'An error occurred. Please try again.'));
    }
  };

  // Super Admin Direct Login
  const handleAdminLogin = () => {
    const cleanInput = adminEmailOrPhone.trim().toLowerCase();
    if (!cleanInput) {
      setFormError('Fadlan geli emailka ama taleefanka Super Admin');
      return;
    }
    if (!password) {
      setFormError('Fadlan geli erayga sirta ah ee Super Admin (Password)');
      return;
    }

    const isSuperAdminEmail =
      cleanInput === 'baashe2002@gmail.com' || cleanInput === 'baashe2002' || cleanInput === 'admin@wadaage.com';
    const isSuperAdminPhone =
      cleanInput === '0636807814' || cleanInput === '6807814' || cleanInput === '+252636807814' || cleanInput === '00252636807814';

    const isAuthorized = (isSuperAdminEmail || isSuperAdminPhone) && password === 'WadaagBankkkk@123';
    const isStaff =
      (cleanInput.includes('cabdillaahi') || cleanInput.includes('admin') || cleanInput.includes('wadaage')) &&
      (password === 'WadaagBankkkk@123' || password === 'Wadaage2026!');

    if (!isAuthorized && !isStaff) {
      setFormError('Erayga sirta ah ama emailka ma saxna. Hubi Super Admin credentials.');
      return;
    }

    const adminUser: AuthUser = {
      id: 'super_admin_baashe',
      name: isAuthorized ? 'Baashe (Super Admin)' : 'Staff Administrator',
      email: cleanInput.includes('@') ? cleanInput : 'baashe2002@gmail.com',
      phone: '+252 63 6807814',
      role: 'admin',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    };
    login(adminUser);
  };

  return (
    <div className="w-full h-full min-h-full overflow-y-auto bg-[#021812] text-white flex flex-col justify-between p-4 sm:p-5 relative overflow-x-hidden font-sans no-scrollbar select-none">

      {/* Background Decorative Emerald Cyber Glow Orbs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-[#00E575]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-[#008751]/15 rounded-full blur-3xl pointer-events-none" />

      {/* 1. TOP HEADER & PILL BADGE */}
      <div className="w-full max-w-sm mx-auto z-20 pt-1">

        {/* Top Status Row: App Role Tag Badge + Language Switcher */}
        <div className="flex items-center justify-between pb-3">
          {/* Role Pill Badge */}
          <div className="flex items-center space-x-1.5 bg-[#002418] border border-[#00E575]/40 px-3 py-1 rounded-full text-[11px] font-black tracking-wider text-[#00E575] shadow-[0_0_12px_rgba(0,229,117,0.25)]">
            {selectedRole === 'passenger' ? (
              <>
                <User className="w-3.5 h-3.5" />
                <span>WADAAGE RIDER APP</span>
              </>
            ) : selectedRole === 'driver' ? (
              <>
                <Car className="w-3.5 h-3.5" />
                <span>WADAAGE CAPTAIN PARTNER</span>
              </>
            ) : (
              <>
                <Shield className="w-3.5 h-3.5" />
                <span>WADAAGE SUPER ADMIN</span>
              </>
            )}
          </div>

          {/* Bilingual Toggle */}
          <button
            onClick={toggleLanguage}
            className="flex items-center space-x-1.5 bg-black/40 hover:bg-black/60 active:scale-95 transition backdrop-blur-md px-3 py-1 rounded-full border border-white/15 text-xs font-bold text-white shadow-sm"
          >
            {language === 'so' ? (
              <div className="flex items-center space-x-1">
                <SomalilandFlag className="w-4 h-2.5 rounded-xs" />
                <span>Soomaali</span>
              </div>
            ) : (
              <span>English 🇬🇧</span>
            )}
          </button>
        </div>

        {/* Brand Header Display with Full Wadaage Badge Logo */}
        <div className="text-center space-y-3 my-3 flex flex-col items-center">
          <WadaageLogo
            variant="badge"
            size="xl"
            showTagline={true}
            appType={selectedRole === 'driver' ? 'driver' : 'rider'}
            className="mx-auto"
          />

          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {selectedRole === 'passenger'
              ? 'Wadaage Taxi & Shared Rides'
              : selectedRole === 'driver'
              ? 'Wadaage Captain Partner'
              : 'Wadaage Admin Gateway'}
          </h1>
          <p className="text-xs text-emerald-400 font-medium">
            {selectedRole === 'passenger'
              ? 'Somaliland Fast & Safe City Mobility • Hargeisa Fleet'
              : selectedRole === 'driver'
              ? 'Accept Live Requests & Earn with Low Commission'
              : 'Central Operations, Dispatch & Financial Control'}
          </p>
        </div>

        {/* 2. SEGMENTED TAB SWITCHER: [Is-diiwaangeli (New)] vs [Gal (Sign In)] */}
        {selectedRole !== 'admin' && (
          <div className="bg-[#002418] p-1 rounded-full border border-[#00E575]/25 flex items-center mt-4 mb-3 shadow-inner">
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(true);
                setFormError(null);
              }}
              className={`flex-1 py-2.5 rounded-full text-xs font-black transition-all flex items-center justify-center space-x-1 ${
                isRegisterMode
                  ? 'bg-[#00E575] text-slate-950 shadow-[0_0_15px_rgba(0,229,117,0.4)]'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              <span>{selectedRole === 'driver' ? 'Is-diiwaangeli (New Driver)' : 'Is-diiwaangeli (New Rider)'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(false);
                setFormError(null);
              }}
              className={`flex-1 py-2.5 rounded-full text-xs font-black transition-all flex items-center justify-center space-x-1 ${
                !isRegisterMode
                  ? 'bg-[#00E575] text-slate-950 shadow-[0_0_15px_rgba(0,229,117,0.4)]'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              <span>Gal (Sign In)</span>
            </button>
          </div>
        )}
      </div>

      {/* 3. MAIN FORM CONTAINER */}
      <div className="w-full max-w-sm mx-auto flex-1 flex flex-col justify-start z-10 py-1">

        {/* Error Alert Box */}
        {formError && (
          <div className="mb-3 p-3 bg-rose-500/20 border border-rose-500/50 rounded-2xl text-xs text-rose-200 font-medium flex items-start space-x-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}

        {showOtpStep ? (
          /* ================= WHATSAPP OTP VERIFICATION SCREEN ================= */
          <div className="space-y-4 bg-[#002418] p-5 rounded-3xl border-2 border-[#00E575]/40 shadow-2xl animate-in fade-in">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-[#00E575]/20 border border-[#00E575]/40 text-[#00E575] flex items-center justify-center mx-auto shadow-[0_0_15px_rgba(0,229,117,0.3)]">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-white">Xaqiijinta WhatsApp-ka (WhatsApp OTP)</h3>
              <p className="text-xs text-emerald-200">
                Koodka xaqiijinta 6-god ah waxaa loo diray WhatsApp lambarkaaga{' '}
                <span className="font-mono font-bold text-[#00E575]">
                  {pendingRegistrationData?.phone || getFullPhone()}
                </span>
              </p>
            </div>

            <form onSubmit={handleVerifyOtpSubmit} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-extrabold text-emerald-300 uppercase tracking-wider">
                    GELI KOODKA OTP (6-DIGIT CODE)
                  </label>
                  <div className="flex items-center space-x-1 text-xs font-mono font-bold text-amber-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {Math.floor(otpTimer / 60)}:{(otpTimer % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                </div>

                <input
                  type="text"
                  maxLength={6}
                  value={otpInput}
                  onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••••"
                  className="w-full bg-black/60 border-2 border-[#00E575]/50 rounded-2xl px-4 py-3 text-center text-2xl font-mono font-black tracking-[0.5em] text-[#00E575] focus:outline-none focus:border-[#00E575] focus:ring-2 focus:ring-[#00E575]/30 shadow-inner"
                  autoFocus
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !otpInput.trim()}
                className="w-full bg-[#00E575] hover:bg-[#00c966] active:scale-[0.98] text-slate-950 font-black py-3.5 rounded-2xl text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(0,229,117,0.4)] transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>✓ XAQUIIJI KOODKA (VERIFY & SUBMIT)</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowOtpStep(false);
                    setOtpInput('');
                  }}
                  aria-label="Bedel Lambarka (Change Number)"
                  className="text-xs font-bold text-white/60 hover:text-white transition flex items-center space-x-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Bedel Lambarka</span>
                </button>

                <button
                  type="button"
                  disabled={otpTimer > 0 || isSubmitting}
                  onClick={async () => {
                    setIsSubmitting(true);
                    const cleanP = pendingRegistrationData?.cleanPhone || getCleanPhoneDigits();
                    const res = await sendWhatsAppOtp(cleanP, pendingRegistrationData?.role || 'rider', pendingRegistrationData?.fullName);
                    setIsSubmitting(false);
                    if (res.success) {
                      setOtpTimer(120);
                      setFormError(null);
                    } else {
                      setFormError(res.message || 'Resend failed');
                    }
                  }}
                  className="text-xs font-bold text-[#00E575] hover:underline disabled:opacity-40 transition"
                >
                  {otpTimer > 0 ? `Dib u dir (${otpTimer}s)` : '🔄 Dib u dir Koodka (Resend OTP)'}
                </button>
              </div>
            </form>
          </div>
        ) : (
        <form onSubmit={handleAuthSubmit} className="space-y-3">

          {/* ================= ADMIN AUTHENTICATION ================= */}
          {selectedRole === 'admin' ? (
            <div className="space-y-3 bg-[#002418]/80 p-4 rounded-2xl border border-[#00E575]/20">
              <div>
                <label className="text-[11px] font-bold text-emerald-300 block mb-1">
                  Email ama Taleefanka Super Admin
                </label>
                <input
                  type="text"
                  value={adminEmailOrPhone}
                  onChange={(e) => setAdminEmailOrPhone(e.target.value)}
                  placeholder="baashe2002@gmail.com"
                  className="w-full bg-black/40 border border-white/20 rounded-xl px-3.5 py-3 text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#00E575]"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-emerald-300 block mb-1">
                  Erayga Sirta ah (Password)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-black/40 border border-white/20 rounded-xl px-3.5 py-3 text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#00E575] pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* ================= DRIVER & RIDER REGISTRATION / LOGIN ================= */}

              {/* Full Name Input (Only on Register Mode) */}
              {isRegisterMode && (
                <div>
                  <label className="text-[11px] font-bold text-white/90 flex items-center space-x-1.5 mb-1">
                    <User className="w-3.5 h-3.5 text-[#00E575]" />
                    <span>{selectedRole === 'driver' ? 'Magaca Darawalka (Driver Full Name)' : 'Magacaaga Buuxa (Full Name)'}</span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={selectedRole === 'driver' ? 'Tusaale: Cabdillaahi Xasan Cali' : 'Tusaale: Maxamed Cali Cabdi'}
                    className="w-full bg-[#002418] border border-[#00E575]/30 rounded-2xl px-4 py-3 text-sm font-medium text-white placeholder-white/40 focus:outline-none focus:border-[#00E575] focus:ring-1 focus:ring-[#00E575]"
                  />
                </div>
              )}

              {/* Password Input for Driver & Passenger */}
              {(selectedRole === 'driver' || selectedRole === 'passenger') && (
                <div>
                  <label className="text-[11px] font-bold text-white/90 flex items-center space-x-1.5 mb-1">
                    <Lock className="w-3.5 h-3.5 text-[#00E575]" />
                    <span>
                      {selectedRole === 'driver'
                        ? (isRegisterMode ? 'Samey Erayga Sirta ah (Driver Password)' : 'Erayga Sirta ah (Driver Password)')
                        : (isRegisterMode ? 'Samey Erayga Sirta ah (Rider Password)' : 'Erayga Sirta ah (Rider Password)')}
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={isRegisterMode ? 'Uguyaraan 4 xaraf (Min 4 chars)' : '••••••••'}
                      className="w-full bg-[#002418] border border-[#00E575]/30 rounded-2xl px-4 py-3 text-sm font-medium text-white placeholder-white/40 focus:outline-none focus:border-[#00E575] pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Driver Specific Fields: Vehicle Fleet Type + Model & License Plate */}
              {selectedRole === 'driver' && isRegisterMode && (
                <div className="space-y-2.5 pt-0.5">
                  {/* Driver Service Registration Option (Normal Taxi, Wadaage Share, or Both) */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">
                        NOOCA ADEEGA DARAWALKA (DRIVER SERVICE)
                      </label>
                      <span className="text-[10px] text-white/60">Dooro mid ama labadaba</span>
                    </div>

                    <div className="space-y-2">
                      {/* Option 1: BOTH (Recommended) */}
                      <button
                        type="button"
                        onClick={() => {
                          setDriverServiceChoice('wadaage_both');
                          setVehicleCategory('wadaage_both');
                        }}
                        className={`w-full p-2.5 rounded-2xl border text-left transition relative flex items-center justify-between ${
                          driverServiceChoice === 'wadaage_both'
                            ? 'bg-[#003824] border-[#00E575] text-white shadow-[0_0_15px_rgba(0,229,117,0.3)]'
                            : 'bg-[#002418]/70 border-white/15 text-white/80 hover:border-white/30'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <div className={`p-2 rounded-xl text-xs font-black ${
                            driverServiceChoice === 'wadaage_both' ? 'bg-[#00E575] text-slate-950' : 'bg-white/10 text-[#00E575]'
                          }`}>
                            ✨ 🚖+👥
                          </div>
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <span className="text-xs font-extrabold">Labada Adeegba (Both: Normal Taxi & Wadaage Share)</span>
                              <span className="bg-[#00E575]/20 text-[#00E575] text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md border border-[#00E575]/40">
                                MAX EARNINGS
                              </span>
                            </div>
                            <p className="text-[10px] text-emerald-300/80">Qaado safarrada gaarka ah (Taxi) iyo rakaabka wadaaga (Share)</p>
                          </div>
                        </div>
                        {driverServiceChoice === 'wadaage_both' ? (
                          <div className="w-5 h-5 rounded-full bg-[#00E575] text-slate-950 flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-white/30 shrink-0" />
                        )}
                      </button>

                      {/* Option 2 & 3: Single Choice (Normal Taxi vs Wadaage Share) */}
                      <div className="grid grid-cols-2 gap-2">
                        {/* Normal Taxi Only */}
                        <button
                          type="button"
                          onClick={() => {
                            setDriverServiceChoice('wadaage_taxi');
                            setVehicleCategory('wadaage_taxi');
                          }}
                          className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                            driverServiceChoice === 'wadaage_taxi'
                              ? 'bg-[#003824] border-[#00E575] text-[#00E575] shadow-[0_0_12px_rgba(0,229,117,0.25)]'
                              : 'bg-[#002418]/60 border-white/10 text-white/80 hover:border-white/30'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-white">🚖 Normal Taxi</span>
                            {driverServiceChoice === 'wadaage_taxi' && <CheckCircle2 className="w-3.5 h-3.5 text-[#00E575]" />}
                          </div>
                          <p className="text-[9px] text-white/60">Keliya Taxi Gaar ah (Private rides only)</p>
                        </button>

                        {/* Wadaage Share Only */}
                        <button
                          type="button"
                          onClick={() => {
                            setDriverServiceChoice('wadaage_share');
                            setVehicleCategory('wadaage_share');
                          }}
                          className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                            driverServiceChoice === 'wadaage_share'
                              ? 'bg-[#003824] border-[#00E575] text-[#00E575] shadow-[0_0_12px_rgba(0,229,117,0.25)]'
                              : 'bg-[#002418]/60 border-white/10 text-white/80 hover:border-white/30'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-white">👥 Wadaage Share</span>
                            {driverServiceChoice === 'wadaage_share' && <CheckCircle2 className="w-3.5 h-3.5 text-[#00E575]" />}
                          </div>
                          <p className="text-[9px] text-white/60">Keliya Gaadhi Wadaag (Carpool only)</p>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* 2-Column: Model + Plate */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-white/80 block mb-1">
                        Model-ka Gaadhiga
                      </label>
                      <input
                        type="text"
                        value={vehicleModel}
                        onChange={(e) => setVehicleModel(e.target.value)}
                        placeholder="Toyota Vitz"
                        className="w-full bg-[#002418] border border-[#00E575]/30 rounded-xl px-3 py-2 text-xs font-semibold text-white placeholder-white/40 focus:outline-none focus:border-[#00E575]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-white/80 block mb-1">
                        Taargada (Plate)
                      </label>
                      <input
                        type="text"
                        value={licensePlate}
                        onChange={(e) => setLicensePlate(e.target.value)}
                        placeholder="SL-38910"
                        className="w-full bg-[#002418] border border-[#00E575]/30 rounded-xl px-3 py-2 text-xs font-semibold text-white placeholder-white/40 focus:outline-none focus:border-[#00E575]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Phone Number Input starting with fixed +252 prefix and continuing with 63 or 65 */}
              <div>
                <label className="text-[11px] font-bold text-white/90 flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-1.5">
                    <Phone className="w-3.5 h-3.5 text-[#00E575]" />
                    <span>Lambarka Taleefanka (Mobile Number)</span>
                  </div>
                  <span className="text-[10px] text-emerald-400 font-mono">+252 63 / 65</span>
                </label>

                <div className="flex items-center space-x-2">
                  {/* Fixed Country Code Badge */}
                  <div className="bg-[#002418] border border-[#00E575]/40 rounded-2xl px-3.5 py-3 text-xs sm:text-sm font-black text-[#00E575] flex items-center space-x-1.5 shrink-0 shadow-[0_0_10px_rgba(0,229,117,0.15)]">
                    <SomalilandFlag className="w-4 h-2.5 rounded-xs shrink-0" />
                    <span className="font-mono tracking-wider">+252</span>
                  </div>

                  {/* Phone Input continuing with 63 or 65 */}
                  <div className="flex-1 relative">
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={handlePhoneInputChange}
                      placeholder="63 4918201 ama 65..."
                      className="w-full bg-[#002418] border border-[#00E575]/30 rounded-2xl px-4 py-3 text-sm font-bold text-white placeholder-white/40 focus:outline-none focus:border-[#00E575] focus:ring-1 focus:ring-[#00E575] font-mono tracking-wider"
                    />
                  </div>
                </div>

                {/* Sub-label showing guidance */}
                <div className="flex items-center justify-between text-[10px] mt-1.5 px-1 font-medium">
                  <span className="text-white/60">
                    {language === 'so'
                      ? 'Ku bilow 63 ama 65'
                      : 'Continue with 63 or 65'}
                  </span>
                  {phoneNumber.startsWith('63') && (
                    <span className="text-[#00E575] font-bold flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3 inline" /> <span>63 (Telesom)</span>
                    </span>
                  )}
                  {phoneNumber.startsWith('65') && (
                    <span className="text-cyan-400 font-bold flex items-center space-x-1">
                      <CheckCircle2 className="w-3 h-3 inline" /> <span>65 (Somtel)</span>
                    </span>
                  )}
                  {!phoneNumber.startsWith('63') && !phoneNumber.startsWith('65') && (
                    <span className="text-amber-400/90 font-mono text-[9px]">
                      Tusaale: 63 6807814 ama 65 4918201
                    </span>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Primary Action Button (Glowing Neon Emerald Pill) */}
          <div className="pt-2 space-y-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#00E575] hover:bg-[#00c966] active:scale-[0.98] text-slate-950 font-black py-4 rounded-full text-xs sm:text-sm tracking-wide shadow-[0_0_20px_rgba(0,229,117,0.4)] transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>
                    {selectedRole === 'admin'
                      ? 'SIGN IN AS SUPER ADMIN'
                      : selectedRole === 'driver'
                      ? (isRegisterMode ? '✓ IS-DIIWAANGELI DARAWALKA (+5,000 SLSH BONUS) >' : 'GAL AKOONKA DARAWALKA >')
                      : (isRegisterMode ? '✓ IS-DIIWAANGELI OO BILOW RIDE >' : 'GAL AKOONKA RAKAABKA >')}
                  </span>
                </>
              )}
            </button>

            {/* Secondary KYC Form Button for Driver */}
            {selectedRole === 'driver' && isRegisterMode && (
              <button
                type="button"
                onClick={() => setShowDriverKycModal(true)}
                className="w-full bg-transparent border border-amber-400/60 hover:bg-amber-400/10 active:scale-[0.98] text-amber-300 font-bold py-2.5 rounded-full text-xs transition flex items-center justify-center space-x-1.5"
              >
                <FileCheck className="w-3.5 h-3.5 text-amber-400" />
                <span>Foomka Buuxa ee Aqoonsiga & Ruqsadda (Full KYC Form) ↗</span>
              </button>
            )}
          </div>
        </form>
        )}
      </div>

      {/* 4. FOOTER & SUPPORT GATEWAY */}
      <div className="w-full max-w-sm mx-auto text-center z-20 pt-4 pb-2 border-t border-white/10 space-y-1">
        <p className="text-[11px] font-bold text-white/70">
          Wadaage Support Gateway: <span className="text-[#00E575] font-mono">+252 63 6807814</span>
        </p>
        <p className="text-[9px] text-white/40">
          Hargeisa, Somaliland • Telematics & Real-Time Verification Gateway
        </p>
      </div>

      {/* SUCCESS / PENDING STATUS MODAL */}
      {successModalData && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[#002418] border-2 border-[#00E575] rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-[#00E575]/20 text-[#00E575] flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(0,229,117,0.3)]">
              <Clock className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-xl font-black text-white">{successModalData.title}</h3>
              <span className="inline-block bg-amber-500/20 text-amber-400 border border-amber-500/40 text-[10px] font-black uppercase px-3 py-0.5 rounded-full">
                Status: Pending Admin Review (Dib-u-eegis)
              </span>
              <p className="text-xs text-white/80 pt-2 leading-relaxed">
                {successModalData.message}
              </p>
            </div>

            <div className="bg-black/30 p-3 rounded-2xl text-left text-xs space-y-1 border border-white/10">
              <div className="text-white/60 text-[10px] uppercase font-bold">Taleefanka Diiwaangashan:</div>
              <div className="font-mono font-bold text-[#00E575]">{successModalData.phone}</div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setSuccessModalData(null);
                  setIsRegisterMode(false);
                }}
                className="w-full bg-[#00E575] text-slate-950 font-black py-3 rounded-full text-xs shadow-lg"
              >
                GAAFY / WAAN FAHMAY (UNDERSTOOD)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Driver Full KYC Modal */}
      {showDriverKycModal && (
        <DriverRegistrationModal
          isOpen={showDriverKycModal}
          onClose={() => setShowDriverKycModal(false)}
        />
      )}
    </div>
  );
};
