import { Bell, Car, CreditCard, Download, Gift, Globe, Layers, LogOut, MoreVertical, Play, Receipt, Shield, ShieldAlert, Smartphone, User, Volume2, VolumeX } from 'lucide-react';
import React, { useState } from 'react';
import { useRide } from '../context/RideContext';
import { UserRole } from '../types';
import { formatCurrency } from '../utils/geo';
import { ApkDownloadModal } from './Mobile/ApkDownloadModal';
import { MobilePlatformModal } from './Mobile/MobilePlatformModal';
import { AnnouncementsModal } from './Notifications/AnnouncementsModal';
import { PromosModal } from './Passenger/PromosModal';
import { SafetyCenterModal } from './Passenger/SafetyCenterModal';
import { TripHistoryModal } from './Passenger/TripHistoryModal';
import { WalletModal } from './Passenger/WalletModal';
import { DriverCommissionWalletModal } from './Driver/DriverCommissionWalletModal';
import { AppInfoWalletModal } from './Common/AppInfoWalletModal';
import { PlayStorePublishingModal } from './Admin/PlayStorePublishingModal';
import { SomalilandFlag } from './Common/SomalilandFlag';
import { WadaageLogo } from './Common/WadaageLogo';

export interface HeaderProps {
  onBackToWebsite?: () => void;
  onNavigate?: (view: 'website' | 'rider' | 'driver' | 'admin') => void;
}

export const Header: React.FC<HeaderProps> = ({ onBackToWebsite, onNavigate }) => {
  const { role, setRole, walletBalance, driverWalletBalanceUsd, soundEnabled, setSoundEnabled, currentUser, logout, language, setLanguage, t } = useRide();
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showDriverCommissionModal, setShowDriverCommissionModal] = useState(false);
  const [showSafetyModal, setShowSafetyModal] = useState(false);
  const [showAnnouncements, setShowAnnouncements] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showPromos, setShowPromos] = useState(false);
  const [showApkModal, setShowApkModal] = useState(false);
  const [showPlatformModal, setShowPlatformModal] = useState(false);
  const [showAppInfoModal, setShowAppInfoModal] = useState(false);
  const [showPlayStoreModal, setShowPlayStoreModal] = useState(false);

  const roles: { id: UserRole; label: string; icon: string; badge?: string }[] = [
    { id: 'passenger', label: t.passengerApp, icon: 'User', badge: 'Ride' },
    { id: 'driver', label: t.driverApp, icon: 'Car', badge: 'Earn' },
    { id: 'admin', label: t.adminWebsite, icon: 'Shield', badge: 'Admin' },
  ];

  return (
    <>
      <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white px-4 py-2.5 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-2.5">
            {onBackToWebsite && (
              <button
                onClick={onBackToWebsite}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1 transition border border-slate-700 mr-1"
                title="Return to www.wadaage.com"
              >
                <span>← Wadaage.com</span>
              </button>
            )}
            <WadaageLogo variant="icon" size="sm" appType={role === 'driver' ? 'driver' : 'rider'} className="shrink-0 drop-shadow-md" />
            <WadaageLogo variant="wordmark" size="sm" appType={role === 'driver' ? 'driver' : 'rider'} className="shrink-0 drop-shadow-md" />
            <div>
              <div className="flex items-center space-x-2">
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wide shadow-sm ${
                  role === 'driver'
                    ? 'bg-blue-500 text-white'
                    : role === 'admin'
                    ? 'bg-amber-400 text-slate-950'
                    : 'bg-emerald-500 text-slate-950'
                }`}>
                  {role === 'driver' ? 'Partner APK' : role === 'admin' ? 'Fleet Control' : 'Wadaage Share'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                {role === 'driver'
                  ? (language === 'so' ? 'Barnaamijka Darawalka Wadaage' : 'Driver Partner Application')
                  : role === 'admin'
                  ? (language === 'so' ? 'Qaybta Maamulka Guud' : 'Super Admin Management Portal')
                  : (language === 'so' ? 'Taxi-ga iyo Gaadhi Wadaaga Somaliland' : 'Taxi & Carpool Passenger App')}
              </p>
            </div>
          </div>

          {/* Dedicated Active App Role Badge - Strict Role Display */}
          <div className="flex items-center">
            {role === 'passenger' && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-xl flex items-center space-x-1.5 text-emerald-400 text-xs font-black">
                <User className="w-3.5 h-3.5 text-emerald-400" />
                <span>Rider App</span>
              </div>
            )}
            {role === 'driver' && (
              <div className="bg-blue-500/10 border border-blue-500/30 px-3 py-1 rounded-xl flex items-center space-x-1.5 text-blue-400 text-xs font-black">
                <Car className="w-3.5 h-3.5 text-blue-400" />
                <span>Driver Partner App</span>
              </div>
            )}
            {role === 'admin' && (
              <div className="bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-xl flex items-center space-x-1.5 text-amber-400 text-xs font-black">
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span>Super Admin Portal</span>
              </div>
            )}
          </div>

          {/* Action Tools & Language Toggle */}
          <div className="flex items-center space-x-2">
            {/* Bilingual Somali / English Toggle Button */}
            <button
              onClick={() => setLanguage(language === 'en' ? 'so' : 'en')}
              className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-2.5 py-1.5 rounded-xl text-xs font-black flex items-center space-x-1.5 hover:bg-emerald-500/30 transition-all shadow-sm"
              title="Switch Language (English / Somali)"
            >
              {language === 'en' ? (
                <>
                  <SomalilandFlag className="w-4 h-2.5 rounded-xs" />
                  <span>SOMALI</span>
                </>
              ) : (
                <>
                  <span>🇬🇧</span>
                  <span>ENGLISH</span>
                </>
              )}
            </button>

            {/* Announcements Bell */}
            <button
              onClick={() => setShowAnnouncements(true)}
              className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition-all relative"
              title="In-App Announcements"
            >
              <Bell className="w-4 h-4 text-amber-400" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full" />
            </button>

            {/* Trip History & e-Invoices */}
            <button
              onClick={() => setShowHistory(true)}
              className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition-all hidden md:flex items-center space-x-1 text-xs font-bold"
              title="Trip History & e-Invoices"
            >
              <Receipt className="w-4 h-4 text-blue-400" />
              <span>History</span>
            </button>

            {/* Promos & Rewards */}
            <button
              onClick={() => setShowPromos(true)}
              className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition-all hidden lg:flex items-center space-x-1 text-xs font-bold"
              title="Promotions & Vouchers"
            >
              <Gift className="w-4 h-4 text-emerald-400" />
              <span>Promos</span>
            </button>

            {/* Mobile App & APK Download Button */}
            <button
              onClick={() => setShowPlatformModal(true)}
              className="p-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-all flex items-center space-x-1 text-xs font-extrabold"
              title="Android & iOS App Support"
            >
              <Smartphone className="w-4 h-4 text-emerald-400 animate-bounce" />
              <span className="hidden sm:inline">Android & iOS</span>
            </button>

            {/* Google Play Store Publishing Button */}
            <button
              onClick={() => setShowPlayStoreModal(true)}
              className="p-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 transition-all flex items-center space-x-1 text-xs font-black shadow-sm"
              title="Open Google Play Store Separate Apps Publishing Center"
            >
              <Play className="w-3.5 h-3.5 text-emerald-400 fill-current" />
              <span className="hidden xl:inline">Play Store</span>
            </button>

            {/* Wallet Quick Balance Button - Only for Driver & Admin (Not for Rider) */}
            {role !== 'passenger' && (
              <button
                onClick={() => {
                  if (role === 'driver') {
                    setShowDriverCommissionModal(true);
                  } else {
                    setShowWalletModal(true);
                  }
                }}
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 px-2.5 py-1.5 rounded-xl text-xs flex items-center space-x-1.5 text-slate-200 transition-all active:scale-95"
                title={role === 'driver' ? 'Open Driver Commission Wallet' : 'Open Wallet & Top-Up'}
              >
                <div className="w-5 h-5 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <CreditCard className="w-3.5 h-3.5" />
                </div>
                <div className="text-left hidden sm:block">
                  <div className="font-bold text-emerald-400 leading-tight">
                    {formatCurrency(role === 'driver' ? driverWalletBalanceUsd : walletBalance)}
                  </div>
                </div>
              </button>
            )}

            {/* Sound Effects Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 transition-all"
              title={soundEnabled ? 'Mute ride sound alerts' : 'Enable ride sound alerts'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>

            {/* Safety SOS Quick Button */}
            <button
              onClick={() => setShowSafetyModal(true)}
              className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 p-2 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1"
              title="Emergency SOS & Trip Safety Center"
            >
              <ShieldAlert className="w-4 h-4 text-rose-500 animate-pulse" />
              <span className="hidden md:inline font-bold">SOS</span>
            </button>

            {/* Current User Profile & Logout Button */}
            <div className="flex items-center space-x-2 pl-1 border-l border-slate-800">
              {currentUser?.avatar ? (
                <img
                  src={currentUser.avatar}
                  alt={currentUser?.name || 'User'}
                  className="w-8 h-8 rounded-full border border-emerald-500/50 object-cover hidden sm:block"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-emerald-400 hidden sm:flex">
                  {currentUser?.name ? currentUser.name.charAt(0) : 'G'}
                </div>
              )}

              {/* 3 Dots App & Wallet Info Menu Button */}
              <button
                onClick={() => setShowAppInfoModal(true)}
                className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 p-2 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1"
                title="App & Driver Activation Wallet Info (3 Dots)"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              <button
                onClick={logout}
                className="bg-slate-800 hover:bg-rose-500/20 hover:text-rose-400 text-slate-400 border border-slate-700 p-2 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1"
                title="Log Out of Wadaage Account"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden xl:inline font-bold">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Modals */}
      {showDriverCommissionModal && (
        <DriverCommissionWalletModal
          isOpen={showDriverCommissionModal}
          onClose={() => setShowDriverCommissionModal(false)}
        />
      )}
      {showWalletModal && <WalletModal onClose={() => setShowWalletModal(false)} />}
      {showSafetyModal && <SafetyCenterModal onClose={() => setShowSafetyModal(false)} />}
      {showAnnouncements && <AnnouncementsModal onClose={() => setShowAnnouncements(false)} />}
      {showHistory && <TripHistoryModal onClose={() => setShowHistory(false)} />}
      {showPromos && <PromosModal onClose={() => setShowPromos(false)} />}
      {showApkModal && <ApkDownloadModal onClose={() => setShowApkModal(false)} />}
      {showPlatformModal && <MobilePlatformModal isOpen={showPlatformModal} onClose={() => setShowPlatformModal(false)} />}
      {showAppInfoModal && <AppInfoWalletModal isOpen={showAppInfoModal} onClose={() => setShowAppInfoModal(false)} />}
      {showPlayStoreModal && (
        <PlayStorePublishingModal
          isOpen={showPlayStoreModal}
          onClose={() => setShowPlayStoreModal(false)}
        />
      )}
    </>
  );
};
