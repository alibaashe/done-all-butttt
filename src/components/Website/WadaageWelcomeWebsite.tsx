import React, { useState, useEffect } from 'react';
import {
  Download,
  Smartphone,
  Car,
  Shield,
  Globe,
  MessageSquare,
  ArrowRight,
  CheckCircle2,
  MapPin,
  Phone,
  Users,
  CreditCard,
  Sparkles,
  Navigation,
  Clock,
  Star,
  Zap,
  Check,
  ChevronRight,
  ExternalLink,
  Activity,
  Layers,
  ShieldCheck,
  Building,
  DollarSign,
  Compass,
  ArrowRightLeft,
} from 'lucide-react';
import { SomalilandFlag } from '../Common/SomalilandFlag';
import { WadaageLogo } from '../Common/WadaageLogo';
import {
  WebsiteCmsConfig,
  DEFAULT_WEBSITE_CMS_CONFIG,
} from '../../types/websiteCms';
import { HARGEISA_PLACES } from '../../data/hargeisaPlaces';

interface WadaageWelcomeWebsiteProps {
  onNavigate: (target: 'rider' | 'driver' | 'admin' | 'website') => void;
  language: 'so' | 'en';
  setLanguage: (lang: 'so' | 'en') => void;
}

export const WadaageWelcomeWebsite: React.FC<WadaageWelcomeWebsiteProps> = ({
  onNavigate,
  language,
  setLanguage,
}) => {
  const [cmsConfig, setCmsConfig] = useState<WebsiteCmsConfig>(() => {
    try {
      const saved = localStorage.getItem('wadaage_website_cms_config');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_WEBSITE_CMS_CONFIG;
  });

  // Live Fare Estimator State
  const [selectedPickup, setSelectedPickup] = useState(HARGEISA_PLACES[0]?.name || 'Hargeisa Egal International Airport');
  const [selectedDropoff, setSelectedDropoff] = useState(HARGEISA_PLACES[1]?.name || 'Dahabshiil Business Center');
  const [estimateDistanceKm, setEstimateDistanceKm] = useState(4.2);

  // Sync CMS config dynamically & listen for real-time admin edits
  useEffect(() => {
    const handleCmsUpdate = (e: any) => {
      if (e.data && e.data.type === 'CMS_CONFIG_UPDATED' && e.data.payload) {
        setCmsConfig(e.data.payload);
      }
    };

    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const ch = new BroadcastChannel('wadaage_events_channel');
        ch.onmessage = handleCmsUpdate;
        return () => ch.close();
      } catch {}
    }
  }, []);

  const shareFareUsd = (estimateDistanceKm * 0.40).toFixed(2);
  const shareFareSlsh = Math.round(Number(shareFareUsd) * 8500);
  const taxiFareUsd = (estimateDistanceKm * 0.80).toFixed(2);
  const taxiFareSlsh = Math.round(Number(taxiFareUsd) * 8500);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-emerald-500 selection:text-slate-950">
      {/* 1. TOP NOTICE & ANNOUNCEMENT STRIP (Dynamic from CMS) */}
      {cmsConfig.announcement.enabled && (
        <div
          className={`bg-gradient-to-r ${cmsConfig.announcement.bgGradient || 'from-emerald-700 via-teal-800 to-slate-900'} text-white py-2 px-4 text-xs font-semibold border-b border-emerald-500/30`}
        >
          <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
            <div className="flex items-center space-x-2 truncate">
              <SomalilandFlag className="w-4 h-2.5 rounded-2xs shrink-0" />
              <span className="font-bold truncate">
                {language === 'so'
                  ? cmsConfig.announcement.messageSo
                  : cmsConfig.announcement.messageEn}
              </span>
            </div>

            <div className="flex items-center space-x-4 shrink-0">
              <a
                href={`https://wa.me/${cmsConfig.contact.whatsappNumber.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="hidden sm:flex items-center space-x-1.5 text-emerald-300 hover:text-white font-bold transition"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>WhatsApp: {cmsConfig.contact.whatsappNumber}</span>
              </a>

              <button
                type="button"
                onClick={() => setLanguage(language === 'en' ? 'so' : 'en')}
                className="bg-slate-900/60 hover:bg-slate-900 px-2.5 py-1 rounded-lg text-[11px] font-bold text-white flex items-center space-x-1.5 transition border border-emerald-500/40 cursor-pointer"
              >
                <Globe className="w-3 h-3 text-emerald-300" />
                <span>{language === 'en' ? 'SOMALI' : 'ENGLISH'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. MAIN NAVBAR */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 shadow-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          {/* Logo & Slogan */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onNavigate('website')}>
            <WadaageLogo variant="badge" size="sm" />
            <div>
              <div className="flex items-center space-x-1">
                <span className="text-2xl font-black text-white tracking-tight">
                  Wadaage
                </span>
                <span className="text-2xl font-black text-emerald-400">.com</span>
              </div>
              <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">
                Somaliland Smart Mobility
              </p>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="hidden md:flex items-center space-x-7 text-xs font-bold text-slate-300">
            <a href="#services" className="hover:text-emerald-400 transition">
              {language === 'so' ? 'Adeegyada' : 'Services'}
            </a>
            <a href="#calculator" className="hover:text-emerald-400 transition">
              {language === 'so' ? 'Qiyaas Qiimaha' : 'Fare Calculator'}
            </a>
            <a href="#drivers" className="hover:text-emerald-400 transition">
              {language === 'so' ? 'Darawallada' : 'Drive With Us'}
            </a>
            <a href="#safety" className="hover:text-emerald-400 transition">
              {language === 'so' ? 'Amniga' : 'Safety'}
            </a>
            <a href="#download" className="hover:text-emerald-400 transition">
              {language === 'so' ? 'Download App' : 'Download'}
            </a>
          </nav>

          {/* Direct Ride Booking & App Launchers */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              type="button"
              onClick={() => onNavigate('driver')}
              className="hidden sm:flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-black border border-slate-700 transition cursor-pointer"
            >
              <Car className="w-3.5 h-3.5 text-amber-400" />
              <span>{language === 'so' ? 'Darawal' : 'Driver App'}</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('rider')}
              className="bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 active:scale-95 text-slate-950 px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black shadow-lg shadow-emerald-500/25 transition flex items-center space-x-2 cursor-pointer"
            >
              <Car className="w-4 h-4 text-slate-950" />
              <span>{language === 'so' ? 'Dalbo Wadaage' : 'Book a Ride'}</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('admin')}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition cursor-pointer"
              title="Admin Panel"
            >
              <Shield className="w-4 h-4 text-blue-400" />
            </button>
          </div>
        </div>
      </header>

      {/* 3. HERO SECTION (Dynamic from CMS) */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 py-12 sm:py-20 border-b border-slate-800/80">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:20px_20px]" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3.5 py-1.5 rounded-full text-xs font-bold shadow-xs">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  {language === 'so'
                    ? cmsConfig.hero.badgeTextSo
                    : cmsConfig.hero.badgeTextEn}
                </span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
                {language === 'so' ? (
                  <>
                    Safarkaaga Hargeysa, Si Fudud &{' '}
                    <span className="text-emerald-400">Qiimo Jaban</span>
                  </>
                ) : (
                  <>
                    Your Commute in Hargeisa, Fast &{' '}
                    <span className="text-emerald-400">Affordable</span>
                  </>
                )}
              </h1>

              <p className="text-sm sm:text-base text-slate-300 font-normal leading-relaxed max-w-xl mx-auto lg:mx-0">
                {language === 'so'
                  ? cmsConfig.hero.subtitleSo
                  : cmsConfig.hero.subtitleEn}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                <button
                  type="button"
                  onClick={() => onNavigate('rider')}
                  className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-8 py-4 rounded-2xl font-black text-sm flex items-center justify-center space-x-2.5 shadow-xl shadow-emerald-500/20 transition active:scale-95 cursor-pointer"
                >
                  <Car className="w-5 h-5 text-slate-950" />
                  <span>
                    {language === 'so'
                      ? cmsConfig.hero.ctaButtonTextSo
                      : cmsConfig.hero.ctaButtonTextEn}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => onNavigate('driver')}
                  className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white border-2 border-slate-700 hover:border-emerald-500/50 px-7 py-4 rounded-2xl font-black text-sm flex items-center justify-center space-x-2 transition active:scale-95 shadow-md cursor-pointer"
                >
                  <span>
                    {language === 'so'
                      ? cmsConfig.hero.secondaryButtonTextSo
                      : cmsConfig.hero.secondaryButtonTextEn}
                  </span>
                </button>
              </div>

              {/* Trust Metrics Grid */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-800 max-w-lg mx-auto lg:mx-0 text-left">
                <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
                  <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">1.0 KM</div>
                  <div className="text-[11px] text-slate-400 font-bold">
                    {language === 'so' ? 'Imaanshaha Darawalka' : 'Average Arrival'}
                  </div>
                </div>
                <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
                  <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">100%</div>
                  <div className="text-[11px] text-slate-400 font-bold">
                    {language === 'so' ? 'ZAAD & eDahab' : 'Instant Pay'}
                  </div>
                </div>
                <div className="bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
                  <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">1,000 SOS</div>
                  <div className="text-[11px] text-slate-400 font-bold">
                    {language === 'so' ? 'Komishan Go’an' : 'Fixed Commission'}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Visual: Mobile Showcase Mockup */}
            {cmsConfig.hero.showLiveMockup && (
              <div className="lg:col-span-5 flex justify-center">
                <div className="relative w-full max-w-[310px] bg-slate-900 rounded-[44px] p-3 shadow-2xl border-4 border-slate-800 ring-2 ring-emerald-500/20">
                  {/* Speaker Ear Notch */}
                  <div className="absolute top-5 left-1/2 -translate-x-1/2 w-24 h-4 bg-slate-950 rounded-full z-20 flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-800 mr-2" />
                    <div className="w-6 h-1 bg-slate-700 rounded-full" />
                  </div>

                  {/* Smartphone Screen Inside */}
                  <div className="w-full bg-slate-950 rounded-[34px] overflow-hidden pt-7 pb-3 text-white text-xs space-y-2.5">
                    {/* Top Status */}
                    <div className="px-3.5 py-1.5 border-b border-slate-800 flex items-center justify-between">
                      <div className="flex items-center space-x-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        <span className="font-extrabold text-[11px] text-white">Wadaage Live Dispatch</span>
                      </div>
                      <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800">
                        GPS Active
                      </span>
                    </div>

                    {/* Simulated Map */}
                    <div className="h-36 bg-slate-900 relative rounded-2xl mx-2.5 overflow-hidden flex items-center justify-center border border-slate-800">
                      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:12px_12px]" />
                      <div className="relative flex flex-col items-center">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center animate-pulse">
                          <Car className="w-5 h-5" />
                        </div>
                        <span className="text-[10px] font-black text-emerald-400 mt-1">
                          Toyota Vitz • White (SL-4921)
                        </span>
                      </div>
                    </div>

                    {/* Bottom Card Mockup */}
                    <div className="bg-slate-900 p-3 rounded-2xl mx-2.5 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-extrabold text-xs">Jigjiga Yar ➔ Egal Airport</div>
                          <div className="text-[10px] text-slate-400">Wadaage Share • Save 30%</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-black text-emerald-400 font-mono">15,000 SLSH</div>
                          <div className="text-[9px] text-slate-400">$1.76 USD</div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onNavigate('rider')}
                        className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition"
                      >
                        Guji si aad u dalbato &rarr;
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. INTERACTIVE LIVE FARE & DISTANCE CALCULATOR */}
      <section id="calculator" className="py-14 bg-slate-900 border-b border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center space-y-2 mb-8">
            <div className="inline-flex items-center space-x-1.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 px-3 py-1 rounded-full text-xs font-bold">
              <DollarSign className="w-3.5 h-3.5" />
              <span>{language === 'so' ? 'Xisaabiye Toos ah' : 'Live Fare Estimator'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {language === 'so'
                ? 'Qiyaas Qiimaha Safarkaaga Hargeysa'
                : 'Estimate Your Trip Fare Across Hargeisa'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
              {language === 'so'
                ? 'Dooro meesha aad ka baxayso iyo meesha aad u socoto si aad u ogaato qiimaha rasmiga ah.'
                : 'Select your pickup and dropoff points to calculate transparent fares in USD & Somaliland Shillings.'}
            </p>
          </div>

          <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 shadow-2xl grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Left Selectors */}
            <div className="md:col-span-7 space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold block flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{language === 'so' ? 'Meesha aad joogto (Pickup Point):' : 'Pickup Location:'}</span>
                </label>
                <select
                  value={selectedPickup}
                  onChange={(e) => setSelectedPickup(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold focus:outline-none focus:border-emerald-500"
                >
                  {HARGEISA_PLACES.slice(0, 35).map((loc) => (
                    <option key={loc.id} value={loc.name}>
                      {loc.name} {loc.district ? `(${loc.district})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-slate-300 font-bold block flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" />
                  <span>{language === 'so' ? 'Halka aad u socoto (Dropoff Destination):' : 'Dropoff Destination:'}</span>
                </label>
                <select
                  value={selectedDropoff}
                  onChange={(e) => setSelectedDropoff(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white font-bold focus:outline-none focus:border-emerald-500"
                >
                  {HARGEISA_PLACES.slice(0, 35).map((loc) => (
                    <option key={loc.id} value={loc.name}>
                      {loc.name} {loc.district ? `(${loc.district})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-slate-300 font-bold">
                  <span>Masaafada (Distance Slider):</span>
                  <span className="font-mono text-emerald-400 font-black">{estimateDistanceKm} KM</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="0.5"
                  value={estimateDistanceKm}
                  onChange={(e) => setEstimateDistanceKm(parseFloat(e.target.value) || 1)}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Right Rate Cards */}
            <div className="md:col-span-5 space-y-3">
              {/* Wadaage Share */}
              <div className="bg-slate-900 p-4 rounded-2xl border-2 border-emerald-500/50 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-white flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-emerald-400" />
                    <span>Wadaage Share (30% Off)</span>
                  </span>
                  <span className="bg-emerald-500 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                    Saved 30%
                  </span>
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-black text-emerald-400 font-mono">
                    {shareFareSlsh.toLocaleString()} SLSH
                  </span>
                  <span className="text-xs text-slate-400 font-bold">(${shareFareUsd} USD)</span>
                </div>
              </div>

              {/* Normal Taxi */}
              <div className="bg-slate-900 p-4 rounded-2xl border border-slate-700 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-white flex items-center gap-1.5">
                    <Car className="w-4 h-4 text-blue-400" />
                    <span>Taxi Gaar Ah (Private)</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Toos ah</span>
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-2xl font-black text-blue-400 font-mono">
                    {taxiFareSlsh.toLocaleString()} SLSH
                  </span>
                  <span className="text-xs text-slate-400 font-bold">(${taxiFareUsd} USD)</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigate('rider')}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition active:scale-95 shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Dalbo Hadda (Book This Route)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 5. SERVICES & PRICING SHOWCASE */}
      <section id="services" className="py-16 bg-slate-950 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center space-y-2 mb-12">
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              {language === 'so' ? 'Adeegyada Wadaage ee Somaliland' : 'Wadaage Mobility Services'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
              {language === 'so'
                ? 'Xulashooyin kala duwan oo ku habboon safarkaaga maalinlaha ah ama safarrada gobollada.'
                : 'Flexible transport options designed for your daily commute and regional travel.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {cmsConfig.services.filter(s => s.enabled).map((service) => (
              <div
                key={service.id}
                className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-3xl p-6 space-y-4 shadow-xl transition-all duration-200 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-base font-black text-white">
                      {language === 'so' ? service.titleSo : service.titleEn}
                    </span>
                    {service.badgeSo && (
                      <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase border border-emerald-500/30">
                        {language === 'so' ? service.badgeSo : service.badgeEn}
                      </span>
                    )}
                  </div>

                  <div className="text-xl font-black text-emerald-400 font-mono">
                    {language === 'so' ? service.priceTagSo : service.priceTagEn}
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    {language === 'so' ? service.descriptionSo : service.descriptionEn}
                  </p>

                  <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
                    {service.features.map((f, i) => (
                      <div key={i} className="flex items-center space-x-2 text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="button"
                    onClick={() => onNavigate('rider')}
                    className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-white font-black text-xs uppercase tracking-wider transition active:scale-95 border border-slate-700 cursor-pointer"
                  >
                    {language === 'so' ? 'Dooro Adeeggan' : 'Select Service'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. FEATURES & SAFETY HIGHLIGHTS */}
      <section id="safety" className="py-16 bg-slate-900 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center space-y-2 mb-12">
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              {language === 'so' ? 'Maxaad U Dooranaysaa Wadaage?' : 'Why Ride With Wadaage?'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
              {language === 'so'
                ? 'Tiknoolajiyad casri ah oo loo habeeyay gaadiidka Hargeysa iyo Somaliland.'
                : 'Cutting-edge mobility technology tailored for Somaliland roads and communities.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {cmsConfig.features.filter(f => f.enabled).map((feature) => (
              <div
                key={feature.id}
                className="bg-slate-950 p-5 rounded-3xl border border-slate-800 space-y-3 hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-black border border-emerald-500/20">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  {feature.highlightTag && (
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                      {feature.highlightTag}
                    </span>
                  )}
                </div>

                <h3 className="font-extrabold text-sm text-white">
                  {language === 'so' ? feature.titleSo : feature.titleEn}
                </h3>

                <p className="text-xs text-slate-400 leading-relaxed">
                  {language === 'so' ? feature.descriptionSo : feature.descriptionEn}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. DRIVER PARTNER VALUE PROPOSITION */}
      <section id="drivers" className="py-16 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="bg-slate-900 border-2 border-amber-500/40 rounded-3xl p-6 sm:p-10 shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-8 space-y-4">
                <div className="inline-flex items-center space-x-2 bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full text-xs font-black border border-amber-500/30">
                  <Car className="w-3.5 h-3.5" />
                  <span>{language === 'so' ? 'Wadaage Driver Partner' : 'Drive & Earn with Wadaage'}</span>
                </div>

                <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                  {language === 'so'
                    ? 'Gaadhigaaga Ku Samee Dakhli Sare Maalin Kasta!'
                    : 'Turn Your Car Into Daily Income in Hargeisa!'}
                </h2>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {language === 'so'
                    ? 'Wadaage waxa uu bixiyaa komishanka ugu jaban Somaliland (kaliya 1,000 SLSH oo go’an safarkiiba). Dakhligaagu toos ayuu kuugu soo dhacayaa ZAAD/eDahab.'
                    : 'Wadaage charges the lowest flat fee in Somaliland (fixed 1,000 SLSH per completed trip). Direct instant mobile payouts to ZAAD and eDahab.'}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs">
                  <div className="flex items-center space-x-2 text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>1,000 SLSH Flat Fee</span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Instant Daily Cash</span>
                  </div>
                  <div className="flex items-center space-x-2 text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Zero Registration Fee</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-4 flex flex-col items-center justify-center space-y-3">
                <button
                  type="button"
                  onClick={() => onNavigate('driver')}
                  className="w-full py-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-sm uppercase tracking-wider rounded-2xl shadow-xl shadow-amber-400/20 transition active:scale-95 cursor-pointer"
                >
                  {language === 'so' ? 'Isku Diiwaangeli Darawal' : 'Register as Driver'}
                </button>
                <span className="text-[11px] text-slate-400 text-center">
                  Ansixin degdeg ah 24 saac gudahood
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. CUSTOMER TESTIMONIALS */}
      <section className="py-16 bg-slate-950 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center space-y-2 mb-12">
            <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
              {language === 'so' ? 'Maxay Macaamiishu Ka Yidhaahdeen?' : 'What Our Riders Say'}
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
              {language === 'so'
                ? 'Kumanaan qof oo ku safra Wadaage maalin kasta guud ahaan Somaliland.'
                : 'Thousands of daily riders trust Wadaage for their commute.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {cmsConfig.testimonials.map((t) => (
              <div
                key={t.id}
                className="bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-3"
              >
                <div className="flex items-center space-x-1 text-amber-400">
                  {[...Array(t.rating || 5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400" />
                  ))}
                </div>

                <p className="text-xs text-slate-300 leading-relaxed italic">
                  "{language === 'so' ? t.commentSo : t.commentEn}"
                </p>

                <div className="flex items-center space-x-3 pt-2 border-t border-slate-800">
                  <img
                    src={t.avatarUrl}
                    alt={t.authorName}
                    className="w-10 h-10 rounded-full object-cover border border-emerald-500"
                  />
                  <div>
                    <h4 className="font-bold text-xs text-white">{t.authorName}</h4>
                    <span className="text-[10px] text-slate-400">{t.roleOrLocation}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. DOWNLOAD APP SECTION */}
      <section id="download" className="py-16 bg-slate-900 border-b border-slate-800 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
          <div className="w-14 h-14 rounded-3xl bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center font-black border border-emerald-500/30">
            <Smartphone className="w-7 h-7" />
          </div>

          <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            {language === 'so'
              ? 'Ku Isticmaal Wadaage Mobilkaaga (PWA & Android)'
              : 'Get Wadaage on Your Smartphone'}
          </h2>

          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto">
            {language === 'so'
              ? 'Wadaage waxaad toos ugu isticmaali kartaa web browser-kaaga ama waxaad ku rakiban kartaa sida App oo kale.'
              : 'Use Wadaage directly in your browser or install it directly to your home screen for instant 1-tap bookings.'}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
            <button
              type="button"
              onClick={() => onNavigate('rider')}
              className="w-full sm:w-auto px-6 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl text-xs uppercase tracking-wider transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer shadow-lg"
            >
              <Smartphone className="w-4 h-4" />
              <span>{language === 'so' ? 'Fur Rider Web App' : 'Launch Rider App'}</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigate('driver')}
              className="w-full sm:w-auto px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-black rounded-2xl text-xs uppercase tracking-wider transition active:scale-95 border border-slate-700 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Car className="w-4 h-4 text-amber-400" />
              <span>{language === 'so' ? 'Fur Driver App' : 'Launch Driver App'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* 10. COMPREHENSIVE FOOTER */}
      <footer className="bg-slate-950 text-slate-400 text-xs py-12 border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <span className="text-xl font-black text-white">Wadaage</span>
              <span className="text-xl font-black text-emerald-400">.com</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Adeegga gaadiidka ee koowaad ee Somaliland. Wadaage Share, Taxi gaar ah, iyo Safarrada gobollada.
            </p>
            <div className="flex items-center space-x-2 pt-1">
              <SomalilandFlag className="w-5 h-3 rounded-xs" />
              <span className="text-[11px] font-bold text-slate-300">Hargeisa, Somaliland</span>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-extrabold text-white text-xs uppercase tracking-wider">Adeegyada</h4>
            <ul className="space-y-1.5 text-[11px]">
              <li><button onClick={() => onNavigate('rider')} className="hover:text-emerald-400 transition">Wadaage Share (30% Off)</button></li>
              <li><button onClick={() => onNavigate('rider')} className="hover:text-emerald-400 transition">Normal Taxi Gaar ah</button></li>
              <li><button onClick={() => onNavigate('rider')} className="hover:text-emerald-400 transition">Safarada Madaarka (Airport)</button></li>
              <li><button onClick={() => onNavigate('rider')} className="hover:text-emerald-400 transition">Safarrada Gobollada (Intercity)</button></li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-extrabold text-white text-xs uppercase tracking-wider">Xiriirka</h4>
            <ul className="space-y-1.5 text-[11px]">
              <li>Tel: <b className="text-slate-300">{cmsConfig.contact.phonePrimary}</b></li>
              <li>WhatsApp: <b className="text-emerald-400">{cmsConfig.contact.whatsappNumber}</b></li>
              <li>Email: <b className="text-slate-300">{cmsConfig.contact.supportEmail}</b></li>
              <li>{cmsConfig.contact.officeAddress}</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-extrabold text-white text-xs uppercase tracking-wider">Maamulka</h4>
            <ul className="space-y-1.5 text-[11px]">
              <li><button onClick={() => onNavigate('admin')} className="hover:text-emerald-400 transition">Admin Dashboard</button></li>
              <li><button onClick={() => onNavigate('driver')} className="hover:text-emerald-400 transition">Driver Portal</button></li>
              <li><button onClick={() => onNavigate('rider')} className="hover:text-emerald-400 transition">Passenger App</button></li>
            </ul>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-slate-500">
          <span>&copy; {new Date().getFullYear()} Wadaage.com — Dhammaan xuquuqda way dhowran tahay.</span>
          <span>Designed for Somaliland Smart Mobility.</span>
        </div>
      </footer>
    </div>
  );
};
