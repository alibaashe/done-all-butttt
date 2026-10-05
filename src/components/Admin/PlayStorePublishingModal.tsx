import React, { useState } from 'react';
import {
  Smartphone,
  Car,
  User,
  Shield,
  Download,
  Copy,
  CheckCircle,
  ExternalLink,
  Terminal,
  FileCode,
  Sparkles,
  Layers,
  HelpCircle,
  Check,
  AlertCircle,
  Key,
  Globe,
  Settings,
  X,
  Play
} from 'lucide-react';

interface PlayStorePublishingModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  isEmbedded?: boolean;
}

export const PlayStorePublishingModal: React.FC<PlayStorePublishingModalProps> = ({
  isOpen = true,
  onClose,
  isEmbedded = false,
}) => {
  const [selectedApp, setSelectedApp] = useState<'rider' | 'driver'>('rider');
  const [activeTab, setActiveTab] = useState<'overview' | 'build_guide' | 'ios_guide' | 'manifest_code' | 'store_listing' | 'data_safety'>('overview');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [domainUrl, setDomainUrl] = useState('wadaage.com');

  if (!isEmbedded && !isOpen) return null;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const downloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const cleanDomain = domainUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');

  // Configurations for Rider App
  const riderConfig = {
    packageName: 'com.wadaage.rider',
    appName: 'Wadaage Taxi: Rider & Share',
    shortName: 'Wadaage',
    category: 'Maps & Navigation / Travel & Local',
    version: '1.0.0',
    versionCode: 1,
    startUrl: `https://${cleanDomain || 'wadaage.com'}/?app=rider`,
    iconUrl: '/icon-512.png',
    themeColor: '#10b981',
    accentColor: '#10b981',
    descriptionShort: 'Book instant taxis, share rides, and pay with ZAAD & eDahab in Somaliland.',
    descriptionFull: `Wadaage Taxi is Somaliland's premier digital mobility and ride-pooling platform.

Key Features:
- Instant Taxi Booking in Hargeisa, Berbera, Burao & all Somaliland cities
- WadaageShare: Split fares dynamically and travel affordably
- Seamless Mobile Money: Pay directly with ZAAD (Telesom) and eDahab (Dahabshiil)
- Live GPS Tracking: Watch your driver arrive in real-time
- Upfront Transparent Pricing: See the exact fare before you book
- Safety Toolkit & 24/7 SOS Emergency Response
- Multi-Stop Routes & Scheduled Booking

Download Wadaage today for safe, reliable, and comfortable transportation across Somaliland.`,
    permissions: [
      'android.permission.INTERNET',
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.POST_NOTIFICATIONS',
      'android.permission.CALL_PHONE'
    ],
    bubblewrapCmd: `npx @bubblewrap/cli init --manifest=https://${cleanDomain || 'wadaage.com'}/manifest-rider.json
npx @bubblewrap/cli build`,
    capacitorConfig: `{
  "appId": "com.wadaage.rider",
  "appName": "Wadaage Taxi",
  "webDir": "dist",
  "server": {
    "url": "https://${cleanDomain || 'wadaage.com'}/?app=rider",
    "cleartext": false
  },
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 2000,
      "backgroundColor": "#020617"
    }
  }
}`,
    androidManifest: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.wadaage.rider">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.CALL_PHONE" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="Wadaage Taxi"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
            android:launchMode="singleTask"
            android:theme="@style/AppTheme.NoActionBarLaunch">

            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>

            <!-- Digital Asset Links for Trusted Web Activity -->
            <intent-filter android:autoVerify="true">
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="https" android:host="${cleanDomain || 'wadaage.com'}" android:pathPrefix="/?app=rider" />
            </intent-filter>
        </activity>
    </application>
</manifest>`
  };

  // Configurations for Driver Partner App
  const driverConfig = {
    packageName: 'com.wadaage.driver',
    appName: 'Wadaage Driver Partner',
    shortName: 'WadaageDriver',
    category: 'Auto & Vehicles / Business',
    version: '1.0.0',
    versionCode: 1,
    startUrl: `https://${cleanDomain || 'wadaage.com'}/?app=driver`,
    iconUrl: '/icon-512.png',
    themeColor: '#2563eb',
    accentColor: '#2563eb',
    descriptionShort: 'Drive, accept dispatch trips, track daily earnings & top-up wallet in Somaliland.',
    descriptionFull: `Wadaage Driver Partner is the official app for licensed taxi and rideshare drivers in Somaliland.

Partner with Wadaage and grow your earnings:
- Instant Trip Dispatch: Receive ride requests with pickup distance and fare estimate
- Low Platform Commission: Keep the highest share of your earnings
- Real-Time Working Capital Wallet: Top-up commission prepaid balance via ZAAD & eDahab
- Background GPS Routing: Turn-by-turn navigation directly to passenger pickup and destination
- Destination Mode: Set your home route to get trips in your direction
- Daily, Weekly & Monthly Earnings Dashboard
- In-App SOS & 24/7 Driver Support Center

Join Somaliland's largest driver network today!`,
    permissions: [
      'android.permission.INTERNET',
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.ACCESS_COARSE_LOCATION',
      'android.permission.ACCESS_BACKGROUND_LOCATION',
      'android.permission.FOREGROUND_SERVICE',
      'android.permission.FOREGROUND_SERVICE_LOCATION',
      'android.permission.WAKE_LOCK',
      'android.permission.CAMERA',
      'android.permission.POST_NOTIFICATIONS',
      'android.permission.CALL_PHONE'
    ],
    bubblewrapCmd: `npx @bubblewrap/cli init --manifest=https://${cleanDomain || 'wadaage.com'}/manifest-driver.json
npx @bubblewrap/cli build`,
    capacitorConfig: `{
  "appId": "com.wadaage.driver",
  "appName": "Wadaage Driver",
  "webDir": "dist",
  "server": {
    "url": "https://${cleanDomain || 'wadaage.com'}/?app=driver",
    "cleartext": false
  },
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 2000,
      "backgroundColor": "#020617"
    }
  }
}`,
    androidManifest: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.wadaage.driver">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE_LOCATION" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.CALL_PHONE" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="Wadaage Driver"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode"
            android:launchMode="singleTask"
            android:theme="@style/AppTheme.NoActionBarLaunch">

            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>

            <!-- Digital Asset Links for Trusted Web Activity -->
            <intent-filter android:autoVerify="true">
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="https" android:host="${cleanDomain || 'wadaage.com'}" android:pathPrefix="/?app=driver" />
            </intent-filter>
        </activity>

        <!-- Foreground Service for Continuous Driver GPS Dispatch -->
        <service
            android:name="com.wadaage.driver.LocationService"
            android:enabled="true"
            android:exported="false"
            android:foregroundServiceType="location" />
    </application>
</manifest>`
  };

  const current = selectedApp === 'rider' ? riderConfig : driverConfig;

  const content = (
    <div className="space-y-6 text-slate-100">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 border border-slate-700/80 p-5 rounded-3xl shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/40">
              <Play className="w-5 h-5 fill-current" />
            </span>
            <h2 className="text-lg font-black text-white">Google Play Store Publishing Center</h2>
            <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
              2 Separate Apps
            </span>
          </div>
          <p className="text-xs text-slate-300">
            Export standalone Android packages, Gradle manifests, and submission assets for <b>Wadaage Rider</b> and <b>Wadaage Driver Partner</b>.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <a
            href="https://play.google.com/console"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center space-x-1.5 shadow-lg shadow-emerald-500/20 transition"
          >
            <span>Open Play Console</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* App Selector (Rider vs Driver) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Rider App Tab Button */}
        <button
          type="button"
          onClick={() => setSelectedApp('rider')}
          className={`p-4 rounded-2xl border text-left transition-all flex items-start space-x-3.5 ${
            selectedApp === 'rider'
              ? 'bg-emerald-950/40 border-emerald-500 shadow-lg shadow-emerald-950/50 ring-1 ring-emerald-500/50'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700 opacity-70 hover:opacity-100'
          }`}
        >
          <div className={`p-3 rounded-2xl ${selectedApp === 'rider' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'}`}>
            <User className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-black text-white">1. Wadaage Rider App</h3>
              {selectedApp === 'rider' && (
                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Selected
                </span>
              )}
            </div>
            <div className="text-xs font-mono text-emerald-400">com.wadaage.rider</div>
            <p className="text-[11px] text-slate-400">For Passengers: Booking, WadaageShare pooling, ZAAD/eDahab payments.</p>
          </div>
        </button>

        {/* Driver App Tab Button */}
        <button
          type="button"
          onClick={() => setSelectedApp('driver')}
          className={`p-4 rounded-2xl border text-left transition-all flex items-start space-x-3.5 ${
            selectedApp === 'driver'
              ? 'bg-blue-950/40 border-blue-500 shadow-lg shadow-blue-950/50 ring-1 ring-blue-500/50'
              : 'bg-slate-900 border-slate-800 hover:border-slate-700 opacity-70 hover:opacity-100'
          }`}
        >
          <div className={`p-3 rounded-2xl ${selectedApp === 'driver' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
            <Car className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-black text-white">2. Wadaage Driver Partner</h3>
              {selectedApp === 'driver' && (
                <span className="bg-blue-500/20 text-blue-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  Selected
                </span>
              )}
            </div>
            <div className="text-xs font-mono text-blue-400">com.wadaage.driver</div>
            <p className="text-[11px] text-slate-400">For Drivers: Dispatch acceptance, background GPS, wallet balance, KYC.</p>
          </div>
        </button>
      </div>

      {/* Domain / URL Setting */}
      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2">
          <Globe className="w-4 h-4 text-indigo-400" />
          <span className="font-bold text-slate-300">Live Production Domain (Hostinger):</span>
        </div>
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <input
            type="text"
            value={domainUrl}
            onChange={(e) => setDomainUrl(e.target.value)}
            placeholder="wadaage.com"
            className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs font-mono text-emerald-400 outline-none w-full sm:w-48"
          />
          <span className="text-[11px] text-slate-400 hidden sm:inline">Used in Android manifest URLs</span>
        </div>
      </div>

      {/* Inner Sub-Navigation Tabs */}
      <div className="flex items-center space-x-1.5 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shrink-0 ${
            activeTab === 'overview'
              ? 'bg-slate-800 text-white shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>App Specifications</span>
        </button>

        <button
          onClick={() => setActiveTab('build_guide')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shrink-0 ${
            activeTab === 'build_guide'
              ? 'bg-slate-800 text-white shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span>Android APK & Play Store</span>
        </button>

        <button
          onClick={() => setActiveTab('ios_guide')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shrink-0 ${
            activeTab === 'ios_guide'
              ? 'bg-slate-800 text-white shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <Sparkles className="w-4 h-4 text-sky-400" />
          <span>iOS App Store & IPA</span>
        </button>

        <button
          onClick={() => setActiveTab('manifest_code')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shrink-0 ${
            activeTab === 'manifest_code'
              ? 'bg-slate-800 text-white shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>AndroidManifest.xml</span>
        </button>

        <button
          onClick={() => setActiveTab('store_listing')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shrink-0 ${
            activeTab === 'store_listing'
              ? 'bg-slate-800 text-white shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Store Listing Texts</span>
        </button>

        <button
          onClick={() => setActiveTab('data_safety')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shrink-0 ${
            activeTab === 'data_safety'
              ? 'bg-slate-800 text-white shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Data Safety & Permissions</span>
        </button>
      </div>

      {/* Tab 1: Overview Specifications */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3">
              <h4 className="font-extrabold text-sm text-white flex items-center space-x-2">
                <Settings className="w-4 h-4 text-indigo-400" />
                <span>Google Play Identity & Metadata</span>
              </h4>
              <div className="space-y-2 font-mono">
                <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                  <span className="text-slate-400 font-sans">App Title:</span>
                  <span className="text-white font-bold">{current.appName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                  <span className="text-slate-400 font-sans">Package Name (App ID):</span>
                  <span className="text-emerald-400 font-bold">{current.packageName}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                  <span className="text-slate-400 font-sans">Google Play Category:</span>
                  <span className="text-indigo-300 font-bold">{current.category}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/60 pb-1.5">
                  <span className="text-slate-400 font-sans">Target SDK:</span>
                  <span className="text-white">Android 14 (API 34)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Web Start URL:</span>
                  <span className="text-amber-400 font-bold break-all">{current.startUrl}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3">
              <h4 className="font-extrabold text-sm text-white flex items-center space-x-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span>Required Android Permissions</span>
              </h4>
              <div className="space-y-1.5 font-mono text-[11px]">
                {current.permissions.map((perm) => (
                  <div key={perm} className="flex items-center space-x-2 bg-slate-950 p-2 rounded-xl border border-slate-800/80">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="text-slate-200">{perm}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Digital Asset Links verification helper */}
          <div className="bg-indigo-950/30 border border-indigo-500/30 p-4 rounded-2xl space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 font-bold text-white">
                <Globe className="w-4 h-4 text-indigo-400" />
                <span>Digital Asset Links (<code className="text-emerald-400 font-mono">/.well-known/assetlinks.json</code>)</span>
              </div>
              <span className="bg-indigo-500/20 text-indigo-300 text-[10px] px-2 py-0.5 rounded-full font-bold">
                Auto-Generated
              </span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Google Play requires <code className="text-amber-400">assetlinks.json</code> hosted on your domain so Android opens the app in pure full-screen mode without an address bar. This is already created in <code className="text-emerald-400">public/.well-known/assetlinks.json</code>!
            </p>
          </div>
        </div>
      )}

      {/* Tab 2: Android APK & Play Store Build Guide */}
      {activeTab === 'build_guide' && (
        <div className="space-y-4 text-xs">
          {/* Direct Pre-built APK Downloads */}
          <div className="bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 p-5 rounded-2xl border border-emerald-500/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Download className="w-5 h-5 text-emerald-400" />
                <h4 className="font-extrabold text-sm text-white">Direct Standalone APK Downloads (Ready to Install)</h4>
              </div>
              <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                Instant Sideload
              </span>
            </div>
            <p className="text-slate-300">
              Download the standalone pre-compiled APK directly onto any Android phone or tablet without needing Google Play Store:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <a
                href="/Wadaage-Passenger-App.apk"
                download="Wadaage-Rider-App.apk"
                className="p-3.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black rounded-xl flex items-center justify-between transition shadow-lg shadow-emerald-900/30"
              >
                <div className="flex items-center space-x-2.5">
                  <User className="w-4 h-4 text-slate-950" />
                  <div className="text-left">
                    <div className="text-xs">Download Rider APK</div>
                    <div className="text-[10px] font-normal text-emerald-950/80">com.wadaage.rider</div>
                  </div>
                </div>
                <Download className="w-4 h-4" />
              </a>

              <a
                href="/Wadaage-Driver-App.apk"
                download="Wadaage-Driver-Partner.apk"
                className="p-3.5 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl flex items-center justify-between transition shadow-lg shadow-blue-900/30"
              >
                <div className="flex items-center space-x-2.5">
                  <Car className="w-4 h-4 text-white" />
                  <div className="text-left">
                    <div className="text-xs">Download Driver APK</div>
                    <div className="text-[10px] font-normal text-blue-100">com.wadaage.driver</div>
                  </div>
                </div>
                <Download className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Terminal className="w-5 h-5 text-emerald-400" />
                <h4 className="font-extrabold text-sm text-white">
                  Method 1: Google Bubblewrap TWA CLI (Recommended for Play Store - 2 Minutes)
                </h4>
              </div>
              <button
                onClick={() => copyToClipboard(current.bubblewrapCmd, 'bubblewrap')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold flex items-center space-x-1 transition"
              >
                {copiedKey === 'bubblewrap' ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'bubblewrap' ? 'Copied' : 'Copy Commands'}</span>
              </button>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Google Bubblewrap generates a signed Android App Bundle (<b>.aab</b>) directly from your live web app manifest:
            </p>

            <pre className="bg-slate-950 p-4 rounded-xl font-mono text-emerald-400 overflow-x-auto border border-slate-800 text-[11px]">
              {`# Step 1: Initialize Android Project from live Manifest
npx @bubblewrap/cli init --manifest=https://${cleanDomain || 'wadaage.com'}/manifest-${selectedApp}.json

# Step 2: Build Google Play Store Android App Bundle (.aab)
npx @bubblewrap/cli build

# Output generated in: ./app-release-bundle.aab (Upload directly to Google Play Console)`}
            </pre>
          </div>

          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Layers className="w-5 h-5 text-indigo-400" />
                <h4 className="font-extrabold text-sm text-white">
                  Method 2: Capacitor & Android Studio (Native Wrapper)
                </h4>
              </div>
              <button
                onClick={() =>
                  copyToClipboard(
                    `npm install @capacitor/core @capacitor/cli @capacitor/android\nnpx cap init "${current.appName}" "${current.packageName}" --config capacitor-${selectedApp}.config.json\nnpx cap add android\nnpx cap open android`,
                    'capacitor'
                  )
                }
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold flex items-center space-x-1 transition"
              >
                {copiedKey === 'capacitor' ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'capacitor' ? 'Copied' : 'Copy Commands'}</span>
              </button>
            </div>

            <pre className="bg-slate-950 p-4 rounded-xl font-mono text-indigo-300 overflow-x-auto border border-slate-800 text-[11px]">
              {`# 1. Build web application
npm run build

# 2. Add Android Platform using standalone ${selectedApp} configuration
npx cap add android
npx cap copy

# 3. Open in Android Studio & generate release APK or AAB
npx cap open android
# In Android Studio: Build -> Generate Signed Bundle / APK -> Android App Bundle (.aab)`}
            </pre>
          </div>
        </div>
      )}

      {/* Tab 2.5: iOS App Store & IPA Build Guide */}
      {activeTab === 'ios_guide' && (
        <div className="space-y-4 text-xs">
          <div className="bg-gradient-to-r from-sky-950/40 via-slate-900 to-slate-900 p-5 rounded-2xl border border-sky-500/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <Sparkles className="w-5 h-5 text-sky-400" />
                <h4 className="font-extrabold text-sm text-white">Apple iOS App Store & Xcode Build Guide</h4>
              </div>
              <span className="bg-sky-500/20 text-sky-300 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-sky-500/30">
                iOS 15.0+ Compatible
              </span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Publish <b>{current.appName}</b> to the Apple App Store as a standalone native iOS app using Capacitor and Xcode.
            </p>
          </div>

          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Terminal className="w-5 h-5 text-sky-400" />
                <h4 className="font-extrabold text-sm text-white">
                  Step-by-Step iOS App Build (Xcode & TestFlight)
                </h4>
              </div>
              <button
                onClick={() =>
                  copyToClipboard(
                    `# 1. Install Capacitor iOS\nnpm install @capacitor/ios\n\n# 2. Build web bundle\nnpm run build\n\n# 3. Add iOS platform\nnpx cap add ios\n\n# 4. Sync web assets\nnpx cap sync ios\n\n# 5. Open Xcode project\nnpx cap open ios`,
                    'iosCmd'
                  )
                }
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold flex items-center space-x-1 transition text-sky-400"
              >
                {copiedKey === 'iosCmd' ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'iosCmd' ? 'Copied' : 'Copy Commands'}</span>
              </button>
            </div>

            <pre className="bg-slate-950 p-4 rounded-xl font-mono text-sky-300 overflow-x-auto border border-slate-800 text-[11px] leading-relaxed">
              {`# Step 1: Install iOS dependency
npm install @capacitor/ios

# Step 2: Build the project
npm run build

# Step 3: Initialize standalone iOS project
npx cap add ios
npx cap sync ios

# Step 4: Open in Xcode
npx cap open ios

# Step 5: In Xcode:
# 1. Select your Apple Developer Team under 'Signing & Capabilities'
# 2. Bundle Identifier: ${current.packageName}
# 3. Product -> Archive -> Distribute App -> App Store Connect / TestFlight`}
            </pre>
          </div>

          <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3">
            <h4 className="font-extrabold text-sm text-white flex items-center space-x-2">
              <Shield className="w-4 h-4 text-sky-400" />
              <span>Required iOS Info.plist Privacy Keys</span>
            </h4>
            <p className="text-slate-300 text-[11px]">
              Add these keys to your <code className="text-emerald-400">ios/App/App/Info.plist</code> before submitting to Apple App Store review:
            </p>
            <pre className="bg-slate-950 p-4 rounded-xl font-mono text-slate-300 overflow-x-auto border border-slate-800 text-[11px]">
              {`<key>NSLocationWhenInUseUsageDescription</key>
<string>Wadaage uses your location to match you with nearby drivers and provide accurate pickup ETAs.</string>

<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>${selectedApp === 'driver' ? 'Wadaage Driver needs background location to compute trip fare mileage and deliver ride requests while navigating.' : 'Wadaage uses your location to track your ride in real-time.'}</string>

<key>NSCameraUsageDescription</key>
<string>Wadaage requires camera access for identity verification and driver document uploads.</string>`}
            </pre>
          </div>
        </div>
      )}

      {/* Tab 3: AndroidManifest.xml */}
      {activeTab === 'manifest_code' && (
        <div className="space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-300">
              Android Manifest for <b>{current.appName}</b> ({current.packageName})
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => downloadFile(`AndroidManifest-${selectedApp}.xml`, current.androidManifest)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-bold flex items-center space-x-1 text-white transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download XML</span>
              </button>
              <button
                onClick={() => copyToClipboard(current.androidManifest, 'manifestXml')}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold flex items-center space-x-1 transition"
              >
                {copiedKey === 'manifestXml' ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy</span>
              </button>
            </div>
          </div>

          <pre className="bg-slate-950 p-4 rounded-2xl font-mono text-slate-300 overflow-x-auto border border-slate-800 text-[11px] max-h-96">
            {current.androidManifest}
          </pre>
        </div>
      )}

      {/* Tab 4: Store Listing Texts */}
      {activeTab === 'store_listing' && (
        <div className="space-y-4 text-xs">
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-300">Short Description (Max 80 Characters)</span>
              <button
                onClick={() => copyToClipboard(current.descriptionShort, 'shortDesc')}
                className="text-slate-400 hover:text-emerald-400 text-xs flex items-center space-x-1"
              >
                {copiedKey === 'shortDesc' ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy</span>
              </button>
            </div>
            <div className="p-3 bg-slate-950 rounded-xl text-white font-medium border border-slate-800">
              {current.descriptionShort}
            </div>
          </div>

          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-300">Full Description (Max 4000 Characters)</span>
              <button
                onClick={() => copyToClipboard(current.descriptionFull, 'fullDesc')}
                className="text-slate-400 hover:text-emerald-400 text-xs flex items-center space-x-1"
              >
                {copiedKey === 'fullDesc' ? <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy</span>
              </button>
            </div>
            <pre className="p-3 bg-slate-950 rounded-xl text-slate-300 font-sans whitespace-pre-wrap border border-slate-800 leading-relaxed">
              {current.descriptionFull}
            </pre>
          </div>
        </div>
      )}

      {/* Tab 5: Data Safety & Permissions */}
      {activeTab === 'data_safety' && (
        <div className="space-y-4 text-xs">
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3">
            <h4 className="font-extrabold text-sm text-white flex items-center space-x-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Google Play Data Safety Answers ({current.appName})</span>
            </h4>
            <div className="space-y-2.5">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1">
                <div className="font-bold text-white">1. Location (Approximate & Precise):</div>
                <div className="text-slate-300 text-[11px]">
                  <b>Collected:</b> Yes (App functionality, Ride matching & live GPS dispatch). <b>Shared:</b> Only between rider and driver during active trip. <b>Encrypted:</b> Yes (in transit via HTTPS).
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 space-y-1">
                <div className="font-bold text-white">2. Financial Info (Payment info):</div>
                <div className="text-slate-300 text-[11px]">
                  <b>Collected:</b> Mobile payment phone numbers for ZAAD & eDahab merchant settlement. No credit card numbers stored.
                </div>
              </div>

              {selectedApp === 'driver' && (
                <div className="p-3 bg-blue-950/30 rounded-xl border border-blue-500/30 space-y-1">
                  <div className="font-bold text-blue-300">3. Background Location (Driver Partner Specific):</div>
                  <div className="text-slate-300 text-[11px]">
                    Google requires a short video showing that background GPS is needed to calculate trip mileage and match dispatch jobs when the driver is using navigation maps or screen is locked.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  if (isEmbedded) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden text-white my-auto max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black">
              <Play className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">Google Play Store Publishing Center</h2>
              <p className="text-xs text-slate-400">Separate Package Generation for Wadaage Rider & Driver Apps</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto flex-1">{content}</div>
      </div>
    </div>
  );
};
