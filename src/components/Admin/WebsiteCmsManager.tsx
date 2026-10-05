import React, { useState, useEffect } from 'react';
import {
  Globe,
  Layout,
  Save,
  RotateCcw,
  Sparkles,
  Megaphone,
  CheckCircle2,
  Plus,
  Trash2,
  Edit2,
  Eye,
  Smartphone,
  Phone,
  MessageSquare,
  Shield,
  Car,
  Users,
  Search,
  ExternalLink,
  Layers,
  ArrowRight,
} from 'lucide-react';
import {
  WebsiteCmsConfig,
  DEFAULT_WEBSITE_CMS_CONFIG,
  WebsiteFeatureItem,
  WebsiteServiceCard,
  WebsiteTestimonial,
} from '../../types/websiteCms';
import { SomalilandFlag } from '../Common/SomalilandFlag';

interface WebsiteCmsManagerProps {
  onPreviewWebsite?: () => void;
}

export const WebsiteCmsManager: React.FC<WebsiteCmsManagerProps> = ({ onPreviewWebsite }) => {
  const [activeSubTab, setActiveSubTab] = useState<
    'hero' | 'announcement' | 'features' | 'services' | 'testimonials' | 'contact' | 'seo'
  >('hero');

  const [cmsConfig, setCmsConfig] = useState<WebsiteCmsConfig>(() => {
    try {
      const saved = localStorage.getItem('wadaage_website_cms_config');
      if (saved) return JSON.parse(saved);
    } catch {}
    return DEFAULT_WEBSITE_CMS_CONFIG;
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  // Load from API / Firestore on mount
  useEffect(() => {
    const loadCms = async () => {
      try {
        const res = await fetch('/api/website/cms-config');
        if (res.ok) {
          const data = await res.json();
          if (data && data.hero) {
            setCmsConfig(data);
            try {
              localStorage.setItem('wadaage_website_cms_config', JSON.stringify(data));
            } catch {}
          }
        }
      } catch {}
    };
    loadCms();
  }, []);

  const handleSaveAll = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    const updatedConfig: WebsiteCmsConfig = {
      ...cmsConfig,
      lastUpdated: new Date().toISOString(),
      updatedBy: 'Admin Panel',
    };

    try {
      // 1. LocalStorage
      localStorage.setItem('wadaage_website_cms_config', JSON.stringify(updatedConfig));

      // 2. Server API
      await fetch('/api/website/cms-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedConfig),
      }).catch(() => {});

      // 3. Broadcast to all open tabs
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        try {
          const ch = new BroadcastChannel('wadaage_events_channel');
          ch.postMessage({ type: 'CMS_CONFIG_UPDATED', payload: updatedConfig });
          ch.close();
        } catch {}
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      alert('Error saving CMS configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToDefaults = () => {
    if (confirm('Ma hubtaa inaad dib ugu celiso xogta website-ka sidii hore (Default Settings)?')) {
      setCmsConfig(DEFAULT_WEBSITE_CMS_CONFIG);
      localStorage.setItem('wadaage_website_cms_config', JSON.stringify(DEFAULT_WEBSITE_CMS_CONFIG));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 text-white space-y-6 shadow-2xl">
      {/* Top Header & Action Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-emerald-500 text-white flex items-center justify-center font-black shadow-lg">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-black text-white">
                  Website CMS & Landing Page Manager
                </h2>
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                  wadaage.com
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Maamul oo wax ka beddel qoraallada, sawirrada, adeegyada, iyo xayeysiisyada website-ka hore.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          {onPreviewWebsite && (
            <button
              type="button"
              onClick={onPreviewWebsite}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center space-x-1.5 transition border border-slate-700 active:scale-95 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
              <span>Arag Website-ka</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleResetToDefaults}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs font-bold transition border border-slate-700 cursor-pointer"
            title="Reset to Defaults"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            disabled={isSaving}
            onClick={handleSaveAll}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-black flex items-center space-x-2 shadow-lg shadow-emerald-600/30 transition active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {saveSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                <span>Waa La Kaydiyay!</span>
              </>
            ) : isSaving ? (
              <span>Kaydinayaa...</span>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Kaydi Dhammaan (Save Live)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Sub-Tabs Navigation */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 border-b border-slate-800 text-xs scrollbar-thin">
        {[
          { id: 'hero', label: '1. Hero & Qaybta Sare', icon: Sparkles },
          { id: 'announcement', label: '2. Xayeysiiska Sare', icon: Megaphone },
          { id: 'features', label: '3. Astaamaha (Features)', icon: Layout },
          { id: 'services', label: '4. Adeegyada & Qiimaha', icon: Car },
          { id: 'testimonials', label: '5. Ra’yiga Macaamiisha', icon: Users },
          { id: 'contact', label: '6. Xiriirka & Socials', icon: Phone },
          { id: 'seo', label: '7. SEO & Meta Tags', icon: Search },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-3 py-2 rounded-xl font-bold whitespace-nowrap flex items-center space-x-1.5 transition cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'bg-slate-800/80 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: HERO SECTION */}
      {activeSubTab === 'hero' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-800 space-y-4 text-xs">
            <h3 className="font-extrabold text-sm text-blue-400 flex items-center space-x-2">
              <Sparkles className="w-4 h-4" />
              <span>Cinwaannada Qaybta Sare (Hero Headlines & Subtitles)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Somali Headline */}
              <div className="space-y-1.5">
                <label className="block text-slate-300 font-bold">
                  Cinwaanka Weyn (Headline - Somali):
                </label>
                <input
                  type="text"
                  value={cmsConfig.hero.headlineSo}
                  onChange={(e) =>
                    setCmsConfig({
                      ...cmsConfig,
                      hero: { ...cmsConfig.hero, headlineSo: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* English Headline */}
              <div className="space-y-1.5">
                <label className="block text-slate-300 font-bold">
                  Cinwaanka Weyn (Headline - English):
                </label>
                <input
                  type="text"
                  value={cmsConfig.hero.headlineEn}
                  onChange={(e) =>
                    setCmsConfig({
                      ...cmsConfig,
                      hero: { ...cmsConfig.hero, headlineEn: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Somali Subtitle */}
              <div className="space-y-1.5">
                <label className="block text-slate-300 font-bold">
                  Sharaxaadda Kooban (Subtitle - Somali):
                </label>
                <textarea
                  rows={3}
                  value={cmsConfig.hero.subtitleSo}
                  onChange={(e) =>
                    setCmsConfig({
                      ...cmsConfig,
                      hero: { ...cmsConfig.hero, subtitleSo: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              {/* English Subtitle */}
              <div className="space-y-1.5">
                <label className="block text-slate-300 font-bold">
                  Sharaxaadda Kooban (Subtitle - English):
                </label>
                <textarea
                  rows={3}
                  value={cmsConfig.hero.subtitleEn}
                  onChange={(e) =>
                    setCmsConfig({
                      ...cmsConfig,
                      hero: { ...cmsConfig.hero, subtitleEn: e.target.value },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>
            </div>

            {/* Badges & Button Labels */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-700/80">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400">Badge Text (Somali):</label>
                <input
                  type="text"
                  value={cmsConfig.hero.badgeTextSo}
                  onChange={(e) =>
                    setCmsConfig({
                      ...cmsConfig,
                      hero: { ...cmsConfig.hero, badgeTextSo: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400">Badge Text (English):</label>
                <input
                  type="text"
                  value={cmsConfig.hero.badgeTextEn}
                  onChange={(e) =>
                    setCmsConfig({
                      ...cmsConfig,
                      hero: { ...cmsConfig.hero, badgeTextEn: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400">Batoonka 1-aad (CTA):</label>
                <input
                  type="text"
                  value={cmsConfig.hero.ctaButtonTextSo}
                  onChange={(e) =>
                    setCmsConfig({
                      ...cmsConfig,
                      hero: { ...cmsConfig.hero, ctaButtonTextSo: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400">Batoonka 2-aad (Drive):</label>
                <input
                  type="text"
                  value={cmsConfig.hero.secondaryButtonTextSo}
                  onChange={(e) =>
                    setCmsConfig({
                      ...cmsConfig,
                      hero: { ...cmsConfig.hero, secondaryButtonTextSo: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                />
              </div>
            </div>

            {/* Toggle Smartphone Mockup */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-700/80">
              <div className="flex items-center space-x-2">
                <Smartphone className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-300 font-bold text-xs">
                  Muuji Smartphone Mockup-ka Tooska ah ee Qaybta Sare
                </span>
              </div>
              <input
                type="checkbox"
                checked={cmsConfig.hero.showLiveMockup}
                onChange={(e) =>
                  setCmsConfig({
                    ...cmsConfig,
                    hero: { ...cmsConfig.hero, showLiveMockup: e.target.checked },
                  })
                }
                className="w-5 h-5 accent-emerald-500 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ANNOUNCEMENT BANNER */}
      {activeSubTab === 'announcement' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-800 space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-emerald-400 flex items-center space-x-2">
                <Megaphone className="w-4 h-4" />
                <span>Xayeysiiska Sare (Top Promotional Announcement Bar)</span>
              </h3>
              <label className="flex items-center space-x-2 cursor-pointer">
                <span className="text-slate-300 font-bold">Daar Xayeysiiska:</span>
                <input
                  type="checkbox"
                  checked={cmsConfig.announcement.enabled}
                  onChange={(e) =>
                    setCmsConfig({
                      ...cmsConfig,
                      announcement: {
                        ...cmsConfig.announcement,
                        enabled: e.target.checked,
                      },
                    })
                  }
                  className="w-5 h-5 accent-emerald-500 cursor-pointer"
                />
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-slate-300 font-bold">Fariinta (Somali):</label>
                <input
                  type="text"
                  value={cmsConfig.announcement.messageSo}
                  onChange={(e) =>
                    setCmsConfig({
                      ...cmsConfig,
                      announcement: {
                        ...cmsConfig.announcement,
                        messageSo: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-slate-300 font-bold">Fariinta (English):</label>
                <input
                  type="text"
                  value={cmsConfig.announcement.messageEn}
                  onChange={(e) =>
                    setCmsConfig({
                      ...cmsConfig,
                      announcement: {
                        ...cmsConfig.announcement,
                        messageEn: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs"
                />
              </div>
            </div>

            {/* Live Preview Box of Announcement */}
            {cmsConfig.announcement.enabled && (
              <div className="pt-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase block mb-1">
                  Muuqaalka Tooska ah (Live Preview):
                </span>
                <div
                  className={`p-2.5 rounded-xl text-center font-bold text-xs bg-gradient-to-r ${cmsConfig.announcement.bgGradient} text-white shadow-md flex items-center justify-center space-x-2`}
                >
                  <SomalilandFlag className="w-4 h-2.5 rounded-2xs" />
                  <span>{cmsConfig.announcement.messageSo}</span>
                  <span className="underline font-mono text-emerald-300 cursor-pointer ml-2">
                    {cmsConfig.announcement.linkTextSo} &rarr;
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: FEATURES */}
      {activeSubTab === 'features' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-bold">
              Guud ahaan {cmsConfig.features.length} Astaamood ayaa jira.
            </span>
            <button
              type="button"
              onClick={() => {
                const newF: WebsiteFeatureItem = {
                  id: `f_${Date.now()}`,
                  titleSo: 'Astaanta Cusub',
                  titleEn: 'New Feature',
                  descriptionSo: 'Sharaxaadda astaantan cusub ee Wadaage.',
                  descriptionEn: 'Description of this new Wadaage feature.',
                  icon: 'Zap',
                  highlightTag: 'New',
                  enabled: true,
                };
                setCmsConfig({
                  ...cmsConfig,
                  features: [newF, ...cmsConfig.features],
                });
              }}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ku dar Astaan</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {cmsConfig.features.map((f, idx) => (
              <div
                key={f.id || idx}
                className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700 space-y-2.5 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-400 font-black flex items-center justify-center text-xs">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={f.titleSo}
                      onChange={(e) => {
                        const copy = [...cmsConfig.features];
                        copy[idx].titleSo = e.target.value;
                        setCmsConfig({ ...cmsConfig, features: copy });
                      }}
                      className="px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={f.enabled}
                      onChange={(e) => {
                        const copy = [...cmsConfig.features];
                        copy[idx].enabled = e.target.checked;
                        setCmsConfig({ ...cmsConfig, features: copy });
                      }}
                      className="w-4 h-4 accent-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const copy = cmsConfig.features.filter((_, i) => i !== idx);
                        setCmsConfig({ ...cmsConfig, features: copy });
                      }}
                      className="p-1 rounded-lg text-rose-400 hover:bg-rose-950/40"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <textarea
                    rows={2}
                    value={f.descriptionSo}
                    onChange={(e) => {
                      const copy = [...cmsConfig.features];
                      copy[idx].descriptionSo = e.target.value;
                      setCmsConfig({ ...cmsConfig, features: copy });
                    }}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs resize-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: SERVICES & PRICING */}
      {activeSubTab === 'services' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {cmsConfig.services.map((s, idx) => (
              <div
                key={s.id || idx}
                className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700 space-y-3 text-xs"
              >
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    value={s.titleSo}
                    onChange={(e) => {
                      const copy = [...cmsConfig.services];
                      copy[idx].titleSo = e.target.value;
                      setCmsConfig({ ...cmsConfig, services: copy });
                    }}
                    className="px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-white font-black text-sm w-full mr-2"
                  />
                  <input
                    type="checkbox"
                    checked={s.enabled}
                    onChange={(e) => {
                      const copy = [...cmsConfig.services];
                      copy[idx].enabled = e.target.checked;
                      setCmsConfig({ ...cmsConfig, services: copy });
                    }}
                    className="w-4 h-4 accent-emerald-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold">Qiimaha (Price Tag):</label>
                  <input
                    type="text"
                    value={s.priceTagSo}
                    onChange={(e) => {
                      const copy = [...cmsConfig.services];
                      copy[idx].priceTagSo = e.target.value;
                      setCmsConfig({ ...cmsConfig, services: copy });
                    }}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-emerald-400 font-mono font-black"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold">Sharaxaadda:</label>
                  <textarea
                    rows={2}
                    value={s.descriptionSo}
                    onChange={(e) => {
                      const copy = [...cmsConfig.services];
                      copy[idx].descriptionSo = e.target.value;
                      setCmsConfig({ ...cmsConfig, services: copy });
                    }}
                    className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs resize-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: TESTIMONIALS */}
      {activeSubTab === 'testimonials' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-bold">
              {cmsConfig.testimonials.length} Ra’yiyo Macaamiil ayaa la muujinayaa.
            </span>
            <button
              type="button"
              onClick={() => {
                const newT: WebsiteTestimonial = {
                  id: `t_${Date.now()}`,
                  authorName: 'Macaamil Cusub',
                  roleOrLocation: 'Hargeisa',
                  avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
                  rating: 5,
                  commentSo: 'Adeeg aad u wanaagsan oo lagu kalsoonaan karo!',
                  commentEn: 'Excellent and highly dependable service in Hargeisa!',
                  verified: true,
                };
                setCmsConfig({
                  ...cmsConfig,
                  testimonials: [newT, ...cmsConfig.testimonials],
                });
              }}
              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black flex items-center space-x-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ku dar Ra’yi</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {cmsConfig.testimonials.map((t, idx) => (
              <div
                key={t.id || idx}
                className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700 space-y-2.5 text-xs"
              >
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    value={t.authorName}
                    onChange={(e) => {
                      const copy = [...cmsConfig.testimonials];
                      copy[idx].authorName = e.target.value;
                      setCmsConfig({ ...cmsConfig, testimonials: copy });
                    }}
                    className="px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-white font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const copy = cmsConfig.testimonials.filter((_, i) => i !== idx);
                      setCmsConfig({ ...cmsConfig, testimonials: copy });
                    }}
                    className="p-1 rounded-lg text-rose-400 hover:bg-rose-950/40"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <input
                  type="text"
                  value={t.roleOrLocation}
                  onChange={(e) => {
                    const copy = [...cmsConfig.testimonials];
                    copy[idx].roleOrLocation = e.target.value;
                    setCmsConfig({ ...cmsConfig, testimonials: copy });
                  }}
                  className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-slate-300 text-[11px]"
                />

                <textarea
                  rows={3}
                  value={t.commentSo}
                  onChange={(e) => {
                    const copy = [...cmsConfig.testimonials];
                    copy[idx].commentSo = e.target.value;
                    setCmsConfig({ ...cmsConfig, testimonials: copy });
                  }}
                  className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-xs resize-none"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: CONTACT & SOCIALS */}
      {activeSubTab === 'contact' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-800 space-y-4 text-xs">
            <h3 className="font-extrabold text-sm text-blue-400 flex items-center space-x-2">
              <Phone className="w-4 h-4" />
              <span>Macluumaadka Xiriirka & Xafiisyada (Contact Info & Socials)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Telefoonka 1-aad (Primary Phone):</label>
                <input
                  type="text"
                  value={cmsConfig.contact.phonePrimary}
                  onChange={(e) =>
                    setCmsConfig({
                      ...cmsConfig,
                      contact: { ...cmsConfig.contact, phonePrimary: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">WhatsApp Support:</label>
                <input
                  type="text"
                  value={cmsConfig.contact.whatsappNumber}
                  onChange={(e) =>
                    setCmsConfig({
                      ...cmsConfig,
                      contact: { ...cmsConfig.contact, whatsappNumber: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-emerald-400 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Email-ka Taageerada:</label>
                <input
                  type="text"
                  value={cmsConfig.contact.supportEmail}
                  onChange={(e) =>
                    setCmsConfig({
                      ...cmsConfig,
                      contact: { ...cmsConfig.contact, supportEmail: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="text-slate-300 font-bold">Ciwaanka Xafiiska (Office Address):</label>
                <input
                  type="text"
                  value={cmsConfig.contact.officeAddress}
                  onChange={(e) =>
                    setCmsConfig({
                      ...cmsConfig,
                      contact: { ...cmsConfig.contact, officeAddress: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Magaalada & Dalka:</label>
                <input
                  type="text"
                  value={cmsConfig.contact.city}
                  onChange={(e) =>
                    setCmsConfig({
                      ...cmsConfig,
                      contact: { ...cmsConfig.contact, city: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: SEO & META TAGS */}
      {activeSubTab === 'seo' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-800 space-y-4 text-xs">
            <h3 className="font-extrabold text-sm text-purple-400 flex items-center space-x-2">
              <Search className="w-4 h-4" />
              <span>SEO & Google Search Engine Optimization</span>
            </h3>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Meta Title (Cinwaanka Google):</label>
                <input
                  type="text"
                  value={cmsConfig.seo.metaTitle}
                  onChange={(e) =>
                    setCmsConfig({
                      ...cmsConfig,
                      seo: { ...cmsConfig.seo, metaTitle: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Meta Description (Sharaxaadda Google):</label>
                <textarea
                  rows={3}
                  value={cmsConfig.seo.metaDescription}
                  onChange={(e) =>
                    setCmsConfig({
                      ...cmsConfig,
                      seo: { ...cmsConfig.seo, metaDescription: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white resize-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-bold">Keywords (Erayada Raadinta):</label>
                <input
                  type="text"
                  value={cmsConfig.seo.metaKeywords}
                  onChange={(e) =>
                    setCmsConfig({
                      ...cmsConfig,
                      seo: { ...cmsConfig.seo, metaKeywords: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-xs"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
