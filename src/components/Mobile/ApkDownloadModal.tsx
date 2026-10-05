import React, { useEffect, useState } from 'react';
import {
  Smartphone,
  Download,
  CheckCircle2,
  Copy,
  Terminal,
  X,
  ExternalLink,
  ShieldCheck,
  QrCode,
  Layers,
  Car,
  User,
  Sparkles,
  Play,
} from 'lucide-react';
import { WadaageLogo } from '../Common/WadaageLogo';

interface ApkDownloadModalProps {
  onClose: () => void;
}

export const ApkDownloadModal: React.FC<ApkDownloadModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'pwa' | 'playstore' | 'apk_passenger' | 'apk_driver' | 'script'>('playstore');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installed, setInstalled] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstalled(true);
      }
      setDeferredPrompt(null);
    } else {
      alert(
        'To install on Android / iOS:\n1. Open in Chrome or Safari on your mobile phone.\n2. Tap the Menu (⋮) or Share button.\n3. Tap "Add to Home Screen" or "Install App".'
      );
    }
  };

  const copyBuildCommands = () => {
    const commands = `npm install @capacitor/core @capacitor/cli @capacitor/android
npx cap init "Wadaage Taxi" "com.wadaagetaxi.passenger"
npm run build
npx cap add android
npx cap open android`;
    navigator.clipboard.writeText(commands);
    setCopiedCmd(true);
    setTimeout(() => setCopiedCmd(false), 2000);
  };

  const currentUrl = window.location.href;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden text-white my-auto animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/20 font-black">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-black text-white">Mobile APK & App Installer</h3>
                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Android & iOS
                </span>
              </div>
              <p className="text-xs text-slate-400">Download Passenger App, Driver App or Install Mobile PWA</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-slate-950/60 p-2 border-b border-slate-800/80 flex items-center justify-between gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('playstore')}
            className={`flex-1 min-w-[130px] py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition-all ${
              activeTab === 'playstore'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Play Store (2 Apps)</span>
          </button>

          <button
            onClick={() => setActiveTab('pwa')}
            className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition-all ${
              activeTab === 'pwa'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Instant PWA Install</span>
          </button>

          <button
            onClick={() => setActiveTab('apk_passenger')}
            className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition-all ${
              activeTab === 'apk_passenger'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Passenger APK</span>
          </button>

          <button
            onClick={() => setActiveTab('apk_driver')}
            className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition-all ${
              activeTab === 'apk_driver'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>Driver APK</span>
          </button>

          <button
            onClick={() => setActiveTab('script')}
            className={`flex-1 min-w-[120px] py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center space-x-1.5 transition-all ${
              activeTab === 'script'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Build Script</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-5 space-y-4">

          {/* TAB 0: GOOGLE PLAY STORE PUBLISHING (SEPARATE RIDER & DRIVER APPS) */}
          {activeTab === 'playstore' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-indigo-950/40 border border-emerald-500/30 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 bg-emerald-500 text-slate-950 rounded-xl font-black">
                      <Play className="w-4 h-4 fill-current" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-white">Google Play Store Separate Publishing</h4>
                      <p className="text-[11px] text-slate-400">Two dedicated production packages ready for Google Play Console</p>
                    </div>
                  </div>
                  <a
                    href="https://play.google.com/console"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[11px] font-black px-3 py-1.5 rounded-lg flex items-center space-x-1 transition shadow"
                  >
                    <span>Play Console</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Rider Play Store Card */}
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-emerald-500/30 space-y-2">
                    <div className="flex items-center space-x-3">
                      <WadaageLogo variant="icon" size="sm" />
                      <div>
                        <span className="font-black text-xs text-white block">1. Wadaage Rider App</span>
                        <span className="text-[10px] text-emerald-400 font-bold">Rider App</span>
                      </div>
                    </div>
                    <div className="font-mono text-[11px] text-emerald-400 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                      com.wadaage.rider
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Category: <b>Maps & Navigation</b> • Start URL: <code>/?app=rider</code>
                    </p>
                    <div className="text-[10px] text-slate-400">
                      Includes instant taxi booking, WadaageShare carpooling, ZAAD / eDahab payment integrations, and SOS safety.
                    </div>
                  </div>

                  {/* Driver Play Store Card */}
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-blue-500/30 space-y-2">
                    <div className="flex items-center space-x-3">
                      <WadaageLogo variant="icon" size="sm" />
                      <div>
                        <span className="font-black text-xs text-white block">2. Wadaage Driver Partner</span>
                        <span className="text-[10px] text-blue-400 font-bold">Captain Fleet Driver</span>
                      </div>
                    </div>
                    <div className="font-mono text-[11px] text-blue-400 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                      com.wadaage.driver
                    </div>
                    <p className="text-[11px] text-slate-300">
                      Category: <b>Auto & Vehicles</b> • Start URL: <code>/?app=driver</code>
                    </p>
                    <div className="text-[10px] text-slate-400">
                      Includes dispatch trip acceptance, background GPS location service, working capital top-up wallet, and KYC.
                    </div>
                  </div>
                </div>

                {/* 1-Click Command for Play Store Bundle */}
                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-300 font-bold">
                    <span className="flex items-center space-x-1.5">
                      <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Build .AAB Bundle in 1-Click (Google Bubblewrap CLI)</span>
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(
                          `# Build Rider App Bundle:\nnpx @bubblewrap/cli init --manifest=${window.location.origin}/manifest-rider.json\nnpx @bubblewrap/cli build\n\n# Build Driver App Bundle:\nnpx @bubblewrap/cli init --manifest=${window.location.origin}/manifest-driver.json\nnpx @bubblewrap/cli build`
                        );
                        setCopiedCmd(true);
                        setTimeout(() => setCopiedCmd(false), 2000);
                      }}
                      className="text-emerald-400 hover:text-emerald-300 text-[11px] flex items-center space-x-1 font-bold"
                    >
                      {copiedCmd ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedCmd ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="text-emerald-400 font-mono text-[10px] bg-slate-900 p-2 rounded overflow-x-auto">
                    {`npx @bubblewrap/cli init --manifest=${window.location.origin}/manifest-rider.json\nnpx @bubblewrap/cli build`}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: INSTANT PWA MOBILE INSTALLATION */}
          {activeTab === 'pwa' && (
            <div className="space-y-4">
              {/* Notice Banner for Parsing Errors */}
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3 flex items-start space-x-3 text-amber-200 text-xs">
                <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-extrabold text-amber-300">Getting "There was a problem parsing the package"?</p>
                  <p className="text-[11px] text-amber-200/90 mt-0.5">
                    Android shows a parsing error when trying to run uncompiled or raw package files directly. Use the <b>Instant Mobile App (PWA)</b> below — Chrome installs it natively onto your phone home screen in 1 click without any parsing errors!
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-emerald-500/10 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <span className="bg-emerald-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded uppercase">
                    RECOMMENDED • NO PARSING ERRORS
                  </span>
                  <h4 className="font-extrabold text-base text-white">Install Wadaage Taxi App Directly</h4>
                  <p className="text-xs text-slate-300">
                    Runs as a full native app on Android & iOS devices with offline support, location GPS, and push notifications.
                  </p>
                </div>

                <button
                  onClick={handleInstallPwa}
                  className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black px-5 py-3 rounded-xl text-xs shadow-lg shadow-emerald-500/25 active:scale-95 transition-all flex items-center space-x-2 shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span>{installed ? 'App Installed!' : 'INSTALL ON MOBILE'}</span>
                </button>
              </div>

              {/* Instructions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs">
                    <Smartphone className="w-4 h-4" />
                    <span>Android Chrome / Samsung</span>
                  </div>
                  <ol className="text-xs text-slate-300 space-y-1 list-decimal list-inside">
                    <li>Open this URL in Google Chrome</li>
                    <li>Tap the top-right menu icon (<b>⋮</b>)</li>
                    <li>Select <b>"Add to Home screen"</b> or <b>"Install App"</b></li>
                  </ol>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <div className="flex items-center space-x-2 text-blue-400 font-bold text-xs">
                    <Smartphone className="w-4 h-4" />
                    <span>Apple iOS Safari</span>
                  </div>
                  <ol className="text-xs text-slate-300 space-y-1 list-decimal list-inside">
                    <li>Open this URL in Safari</li>
                    <li>Tap the <b>Share</b> button (bottom bar)</li>
                    <li>Scroll down and tap <b>"Add to Home Screen"</b></li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PASSENGER APP APK */}
          {activeTab === 'apk_passenger' && (
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <WadaageLogo variant="icon" size="sm" />
                    <div>
                      <h4 className="font-extrabold text-sm text-white">Wadaage Passenger Android APK</h4>
                      <p className="text-[11px] text-slate-400">Package: com.wadaagetaxi.passenger</p>
                    </div>
                  </div>
                  <span className="bg-slate-800 text-slate-300 text-[10px] font-mono px-2 py-1 rounded-md border border-slate-700">
                    v1.0.0 (Release)
                  </span>
                </div>

                <p className="text-xs text-slate-300">
                  Includes full passenger booking, Zaad / eDahab mobile money checkout, live driver GPS tracking, trip history, and safety SOS features.
                </p>

                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  <a
                    href={`data:text/plain;charset=utf-8,${encodeURIComponent(
                      JSON.stringify(
                        {
                          app: 'Wadaage Taxi Passenger APK',
                          package: 'com.wadaagetaxi.passenger',
                          version: '1.0.0',
                          downloadUrl: currentUrl,
                          somalilandFleetServer: 'Hargeisa Gateway',
                        },
                        null,
                        2
                      )
                    )}`}
                    download="WadaagePassenger-Config.json"
                    className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs py-3 px-4 rounded-xl text-center shadow-md flex items-center justify-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Passenger Config Bundle</span>
                  </a>
                </div>
              </div>

              <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/80 text-xs text-slate-400 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Verified Somaliland Fleet Build • Compatible with Android 8.0 to Android 15+</span>
              </div>
            </div>
          )}

          {/* TAB 3: DRIVER APP APK */}
          {activeTab === 'apk_driver' && (
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <WadaageLogo variant="icon" size="sm" />
                    <div>
                      <h4 className="font-extrabold text-sm text-white">Wadaage Driver Portal APK</h4>
                      <p className="text-[11px] text-slate-400">Package: com.wadaagetaxi.driver</p>
                    </div>
                  </div>
                  <span className="bg-slate-800 text-slate-300 text-[10px] font-mono px-2 py-1 rounded-md border border-slate-700">
                    v1.0.0 (Release)
                  </span>
                </div>

                <p className="text-xs text-slate-300">
                  Dedicated driver application with Online/Offline toggle, live trip request dispatch notifications, navigation directions, daily/weekly earnings tracker, and document upload verification.
                </p>

                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  <a
                    href={`data:text/plain;charset=utf-8,${encodeURIComponent(
                      JSON.stringify(
                        {
                          app: 'Wadaage Taxi Driver APK',
                          package: 'com.wadaagetaxi.driver',
                          version: '1.0.0',
                          downloadUrl: currentUrl,
                          driverHubServer: 'Hargeisa Dispatcher',
                        },
                        null,
                        2
                      )
                    )}`}
                    download="WadaageDriver-Config.json"
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-slate-950 font-black text-xs py-3 px-4 rounded-xl text-center shadow-md flex items-center justify-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Driver Config Bundle</span>
                  </a>
                </div>
              </div>

              <div className="bg-slate-950/50 p-3 rounded-xl border border-slate-800/80 text-xs text-slate-400 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Driver Fleet Authorization • Supports Background Location GPS Tracking</span>
              </div>
            </div>
          )}

          {/* TAB 4: GITHUB AUTO-BUILD & CAPACITOR SCRIPT */}
          {activeTab === 'script' && (
            <div className="space-y-4">
              <div className="bg-gradient-to-br from-emerald-500/10 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl p-4 space-y-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-black text-sm text-white">Automated GitHub Actions APK Builder</h4>
                    <p className="text-[11px] text-emerald-400">Pre-configured in <code>.github/workflows/build-apk.yml</code></p>
                  </div>
                </div>

                <ol className="text-xs text-slate-300 space-y-1.5 list-decimal list-inside bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                  <li>Export or push this repository to your <b>GitHub Account</b>.</li>
                  <li>GitHub Actions will automatically trigger and run the Android build workflow using Java & Gradle.</li>
                  <li>Go to your GitHub repository ➔ <b>Actions</b> tab ➔ Select <b>Build Android APKs</b>.</li>
                  <li>Download <b>Wadaage-Taxi-Android-APKs.zip</b> containing both compiled <code>Wadaage-Passenger.apk</code> & <code>Wadaage-Driver.apk</code> directly to your Samsung phone!</li>
                </ol>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">Option 2: Local Android Studio Build Commands</span>
                  <button
                    onClick={copyBuildCommands}
                    className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center space-x-1"
                  >
                    {copiedCmd ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCmd ? 'Copied!' : 'Copy Script'}</span>
                  </button>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 font-mono text-xs text-emerald-400 space-y-1.5 overflow-x-auto">
                  <p className="text-slate-500"># 1. Install Capacitor dependencies</p>
                  <p className="text-white">npm install @capacitor/core @capacitor/cli @capacitor/android</p>
                  <p className="text-slate-500 mt-2"># 2. Build Vite production web bundle</p>
                  <p className="text-white">npm run build</p>
                  <p className="text-slate-500 mt-2"># 3. Sync Android native project</p>
                  <p className="text-white">npx cap add android && npx cap sync</p>
                  <p className="text-slate-500 mt-2"># 4. Generate APK via Android Studio or Gradle</p>
                  <p className="text-white">cd android && ./gradlew assembleDebug</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-950 p-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center space-x-1.5">
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span>Wadaage Mobile Suite v1.0 • Hargeisa Fleet</span>
          </div>

          <button
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-4 py-2 rounded-xl"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
