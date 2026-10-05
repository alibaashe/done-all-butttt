import React, { useEffect, useState, useCallback } from 'react';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { Header } from './components/Header';
import { MobilePassengerApp } from './components/Passenger/MobilePassengerApp';
import { MobileDriverApp } from './components/Driver/MobileDriverApp';
import { MobileAppContainer } from './components/Mobile/MobileAppContainer';
import { RideCompletionModal } from './components/Passenger/RideCompletionModal';
import { WadaageWelcomeWebsite } from './components/Website/WadaageWelcomeWebsite';
import { LoginScreen } from './components/Auth/LoginScreen';
import { InAppVoiceCallModal } from './components/Call/InAppVoiceCallModal';
import { StartupSplashScreen } from './components/Common/StartupSplashScreen';
import { RideProvider, useRide } from './context/RideContext';
import { FuelProvider } from './context/FuelContext';
import { Smartphone, Car, Shield, Globe } from 'lucide-react';

export type AppView = 'website' | 'rider' | 'driver' | 'admin';

const MainAppContent: React.FC = () => {
  const {
    role,
    setRole,
    currentUser,
    currentRide,
    language,
    setLanguage,
    driverModeOnline,
    activeCallSession,
    isCallModalOpen,
    setIsCallModalOpen,
    selfOrderAlertMsg,
    dismissSelfOrderAlert,
  } = useRide();

  // Helper to parse current URL route/view - Standalone APK & PWA priority
  const getInitialView = (): AppView => {
    try {
      // 1. Native APK builds (Capacitor) are locked to their own app via VITE_APP_MODE
      const nativeContainer =
        typeof (window as any).Capacitor !== 'undefined' ||
        (window as any).isNativeApp === true ||
        window.location.protocol === 'file:' ||
        window.location.origin.includes('capacitor://') ||
        navigator.userAgent.includes('WadaageRider') ||
        navigator.userAgent.includes('WadaageDriver');

      const envMode = (import.meta as any).env?.VITE_APP_MODE || (import.meta as any).env?.MODE;
      if (envMode === 'rider' || envMode === 'passenger') return 'rider';
      if (envMode === 'driver') return 'driver';
      if (envMode === 'admin') return 'admin';
      if (envMode === 'website') return 'website';

      // 2. Native container without an explicit mode: detect from user agent / stored role
      if (nativeContainer) {
        if (navigator.userAgent.includes('WadaageDriver')) return 'driver';
        if (navigator.userAgent.includes('WadaageRider')) return 'rider';
        const storedNativeView = localStorage.getItem('wadaage_app_view') as AppView | null;
        if (storedNativeView === 'driver' || storedNativeView === 'admin') return storedNativeView;
        return 'rider';
      }

      // 3. WEB ROUTING (https://www.wadaage.com)
      //    /        -> public welcome website
      //    /rider   -> passenger web app
      //    /driver  -> driver partner web app
      //    /admin   -> fleet operations dashboard
      const params = new URLSearchParams(window.location.search);
      const appParam = params.get('app')?.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      const pathname = window.location.pathname.toLowerCase();
      const hostname = window.location.hostname.toLowerCase();

      // URL path takes priority over any previously stored view, so sharing a link
      // always lands the visitor on the intended app.
      if (appParam === 'admin' || hostname.startsWith('admin.') || /^\/admin(\/|$)/.test(pathname) || hash.includes('admin')) return 'admin';
      if (appParam === 'driver' || hostname.startsWith('driver.') || /^\/driver(\/|$)/.test(pathname) || hash.includes('driver')) return 'driver';
      if (appParam === 'rider' || appParam === 'passenger' || hostname.startsWith('rider.') || /^\/(rider|passenger)(\/|$)/.test(pathname) || hash.includes('rider')) return 'rider';
      if (appParam === 'website' || appParam === 'home' || hash.includes('website')) return 'website';

      // The site root is ALWAYS the welcome website
      if (pathname === '/' || pathname === '') return 'website';

      // 4. Active Trip Check: If rider has an active trip in progress, always redirect to rider view so session is not lost
      try {
        const savedRide = localStorage.getItem('wadaage_current_ride');
        if (savedRide) {
          const parsed = JSON.parse(savedRide);
          if (parsed && ['searching', 'accepted', 'driver_arrived', 'in_progress'].includes(parsed.status)) {
            return 'rider';
          }
        }
      } catch {}

      const storedView = localStorage.getItem('wadaage_app_view') as AppView | null;
      const storedRole = localStorage.getItem('wadaage_role');

      if (storedView === 'driver' || storedRole === 'driver') return 'driver';
      if (storedView === 'rider' || storedRole === 'passenger') return 'rider';
      if (storedView === 'admin' || storedRole === 'admin') return 'admin';

      // Any other path on the public site shows the welcome website
      return 'website';
    } catch {
      return 'website';
    }
  };

  const [currentView, setCurrentView] = useState<AppView>(getInitialView);
  const [showAppSelectorDrawer, setShowAppSelectorDrawer] = useState(false);
  const [riderSplashFinished, setRiderSplashFinished] = useState(false);
  const [driverSplashFinished, setDriverSplashFinished] = useState(false);

  // Active Trip Persistence: On app launch, check backend for active trip and redirect to Rider view if found
  useEffect(() => {
    const checkBackendActiveTrip = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const explicitApp = params.get('app');
        if (explicitApp === 'driver' || explicitApp === 'admin') return;

        let authPassenger: any = null;
        try {
          const p = localStorage.getItem('wadaage_auth_passenger');
          if (p) authPassenger = JSON.parse(p);
          if (!authPassenger) {
            const u = localStorage.getItem('wadaage_auth_user');
            if (u) authPassenger = JSON.parse(u);
          }
        } catch {}

        const userId = authPassenger?.id || '';
        const phone = authPassenger?.phone || '';
        if (!userId && !phone) return;

        const res = await fetch(`/api/rides/active-trip?userId=${encodeURIComponent(userId)}&phone=${encodeURIComponent(phone)}&role=passenger`);
        if (!res.ok) return;

        const data = await res.json();
        if (data?.hasActiveTrip && data?.trip) {
          console.log('[App.tsx] Active trip found on backend, redirecting to Rider Ride in Progress view:', data.trip);
          setCurrentView('rider');
          setRole('passenger');
          setRiderSplashFinished(true);
          try {
            localStorage.setItem('wadaage_app_view', 'rider');
            localStorage.setItem('wadaage_current_ride', JSON.stringify(data.trip));
          } catch {}
        }
      } catch (err) {
        console.warn('[App.tsx] Active trip check failed:', err);
      }
    };

    checkBackendActiveTrip();
  }, [setRole]);

  // Dynamic manifest linker for standalone installation
  useEffect(() => {
    try {
      const manifestLink = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
      if (manifestLink) {
        // On the public website keep the generic Wadaage manifest so installing the PWA
        // from "/" does not silently create a rider-only shortcut.
        if (currentView === 'driver') {
          manifestLink.href = '/manifest-driver.json';
        } else if (currentView === 'rider') {
          manifestLink.href = '/manifest-rider.json';
        } else {
          manifestLink.href = '/manifest.json';
        }
      }
    } catch {}
  }, [currentView]);

  // Navigate function to switch standalone links cleanly
  const navigateTo = useCallback((target: AppView) => {
    setCurrentView(target);
    setShowAppSelectorDrawer(false);
    try {
      // Only remember the app choice for in-app areas. Visiting "/" must always show
      // the welcome website, so the root path deliberately does not consult storage.
      if (target === 'website') {
        localStorage.removeItem('wadaage_app_view');
      } else {
        localStorage.setItem('wadaage_app_view', target);
      }
    } catch {}

    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('app');
      url.searchParams.delete('mode');
      url.hash = '';
      // Clean path routing: /  /rider  /driver  /admin
      url.pathname = target === 'website' ? '/' : `/${target}`;
      window.history.pushState({}, '', url.toString());
    } catch {}

    // Sync underlying role state for rider, driver, admin
    if (target === 'rider' && role !== 'passenger') {
      setRole('passenger');
    } else if (target === 'driver' && role !== 'driver') {
      setRole('driver');
    } else if (target === 'admin' && role !== 'admin') {
      setRole('admin');
    }
  }, [role, setRole]);

  // Listen to browser Back/Forward (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const parsedView = getInitialView();
      setCurrentView(parsedView);
      if (parsedView === 'rider') setRole('passenger');
      else if (parsedView === 'driver') setRole('driver');
      else if (parsedView === 'admin') setRole('admin');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [setRole]);

  // Sync role whenever currentView changes
  useEffect(() => {
    if (currentView === 'rider' && role !== 'passenger') {
      setRole('passenger');
    } else if (currentView === 'driver' && role !== 'driver') {
      setRole('driver');
    } else if (currentView === 'admin' && role !== 'admin') {
      setRole('admin');
    }
  }, [currentView, role, setRole]);

  // 1. WELCOME WEBSITE (www.wadaage.com)
  if (currentView === 'website') {
    return (
      <div className="min-h-screen bg-slate-950">
        <WadaageWelcomeWebsite
          onNavigate={navigateTo}
          language={language}
          setLanguage={setLanguage}
        />
        {isCallModalOpen && activeCallSession && (
          <InAppVoiceCallModal
            session={activeCallSession}
            currentUserId={currentUser?.id || ''}
            onClose={() => setIsCallModalOpen(false)}
          />
        )}
        {selfOrderAlertMsg && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in font-sans">
            <div className="bg-slate-900 border border-rose-500/50 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                <Shield className="w-6 h-6 text-rose-400" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Action Denied</h3>
                <p className="text-xs font-semibold text-rose-300 mt-2">{selfOrderAlertMsg}</p>
              </div>
              <button
                onClick={dismissSelfOrderAlert}
                className="w-full py-3 bg-rose-500 hover:bg-rose-400 text-white font-black rounded-xl text-xs uppercase tracking-wider transition cursor-pointer"
              >
                Understood
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 2. STANDALONE RIDER MOBILE APP (Startup Splash -> Login First Enforcement)
  if (currentView === 'rider' || role === 'passenger') {
    if (!riderSplashFinished) {
      return (
        <StartupSplashScreen
          appType="rider"
          onFinish={() => setRiderSplashFinished(true)}
        />
      );
    }
    const isRiderLoggedIn = currentUser && currentUser.role === 'passenger';
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <div className="flex-1 flex items-center justify-center p-0 sm:p-4">
          <MobileAppContainer
            appName="Wadaage Rider"
            appType="rider"
            onBackToWebsite={() => navigateTo('website')}
            onNavigate={navigateTo}
          >
            {isRiderLoggedIn ? (
              <>
                <MobilePassengerApp />
                {currentRide?.status === 'completed' && <RideCompletionModal />}
              </>
            ) : (
              <LoginScreen />
            )}
          </MobileAppContainer>
        </div>
        {isCallModalOpen && activeCallSession && (
          <InAppVoiceCallModal
            session={activeCallSession}
            currentUserId={currentUser?.id || ''}
            onClose={() => setIsCallModalOpen(false)}
          />
        )}
        {selfOrderAlertMsg && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in font-sans">
            <div className="bg-slate-900 border border-rose-500/50 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                <Shield className="w-6 h-6 text-rose-400" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Action Denied</h3>
                <p className="text-xs font-semibold text-rose-300 mt-2">{selfOrderAlertMsg}</p>
              </div>
              <button
                onClick={dismissSelfOrderAlert}
                className="w-full py-3 bg-rose-500 hover:bg-rose-400 text-white font-black rounded-xl text-xs uppercase tracking-wider transition cursor-pointer"
              >
                Understood
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 3. STANDALONE DRIVER PARTNER MOBILE APP (Startup Splash -> Login First Enforcement)
  if (currentView === 'driver' || role === 'driver') {
    if (!driverSplashFinished) {
      return (
        <StartupSplashScreen
          appType="driver"
          onFinish={() => setDriverSplashFinished(true)}
        />
      );
    }
    const isDriverLoggedIn = currentUser && currentUser.role === 'driver';
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col">
        <div className="flex-1 flex items-center justify-center p-0 sm:p-4">
          <MobileAppContainer
            appName="Wadaage Driver Partner"
            appType="driver"
            onBackToWebsite={() => navigateTo('website')}
            onNavigate={navigateTo}
          >
            {isDriverLoggedIn ? (
              <MobileDriverApp />
            ) : (
              <LoginScreen />
            )}
          </MobileAppContainer>
        </div>
        {isCallModalOpen && activeCallSession && (
          <InAppVoiceCallModal
            session={activeCallSession}
            currentUserId={currentUser?.id || ''}
            onClose={() => setIsCallModalOpen(false)}
          />
        )}
        {selfOrderAlertMsg && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in font-sans">
            <div className="bg-slate-900 border border-rose-500/50 rounded-3xl p-6 max-w-sm w-full text-center space-y-4 shadow-2xl">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
                <Shield className="w-6 h-6 text-rose-400" />
              </div>
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">Action Denied</h3>
                <p className="text-xs font-semibold text-rose-300 mt-2">{selfOrderAlertMsg}</p>
              </div>
              <button
                onClick={dismissSelfOrderAlert}
                className="w-full py-3 bg-rose-500 hover:bg-rose-400 text-white font-black rounded-xl text-xs uppercase tracking-wider transition cursor-pointer"
              >
                Understood
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 4. SUPER ADMIN SITE (Fleet Operations Center - Dedicated Login First Enforcement)
  const isAdminLoggedIn = currentUser && currentUser.role === 'admin';

  if (!isAdminLoggedIn) {
    return (
      <div className="min-h-screen bg-[#021812] text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#002418] border border-[#00E575]/30 rounded-3xl p-6 shadow-2xl">
          <LoginScreen />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased selection:bg-amber-500 selection:text-slate-950">
      <Header onBackToWebsite={() => navigateTo('website')} onNavigate={navigateTo} />
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6">
        <AdminDashboard />
      </main>
      <footer className="bg-slate-900/80 border-t border-slate-800/80 py-4 px-4 text-center text-xs text-slate-500 mt-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="font-semibold text-slate-300">Wadaage Fleet Control Center</span>
          </div>
          <div>Real-time Dispatch Management & Somaliland Mobility Hub (www.wadaage.com)</div>
        </div>
      </footer>
      {isCallModalOpen && activeCallSession && (
        <InAppVoiceCallModal
          session={activeCallSession}
          currentUserId={currentUser?.id || ''}
          onClose={() => setIsCallModalOpen(false)}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <RideProvider>
      <FuelProvider>
        <MainAppContent />
      </FuelProvider>
    </RideProvider>
  );
}
