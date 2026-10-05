import React, { useState, useEffect } from 'react';
import {
  MessageCircle,
  Server,
  Key,
  Shield,
  Send,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  UserCheck,
  Copy,
  Check,
  Phone,
  Sliders,
  Settings,
  Terminal,
  FileCode,
  Zap,
  Globe,
  Radio,
  Lock
} from 'lucide-react';
import { displayFormattedPhone } from '../../services/whatsappOtpService';

export const WhatsAppOtpControlPanel: React.FC = () => {
  const [subTab, setSubTab] = useState<'providers' | 'rules' | 'queue' | 'tester'>('providers');
  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  // Config State
  const [config, setConfig] = useState({
    provider: 'meta_cloud',
    adminNumber: '252636807814',
    senderName: 'Wadaage Mobility Somaliland',
    metaPhoneNumberId: '',
    metaApiToken: '',
    ultraInstanceId: '',
    ultraToken: '',
    twilioSid: '',
    twilioAuthToken: '',
    twilioFrom: 'whatsapp:+14155238886',
    customWebhookUrl: '',
    customApiKey: '',
    expiryMinutes: 10,
    enableMasterBypass: true,
    masterBypassCode: '123456',
    messageTemplate: '🚗 *WADAAGE MOBILITY SOMALILAND*\n\nKoodkaaga xaqiijinta WhatsApp (OTP) waa:\n👉 *{{code}}*\n\nHa la wadaagin qofna koodkan. Koodkani wuxuu dhacayaa {{expiry}} daqiiqo gudahood.\n\n_Wadaage - Gadiidka Casriga ah ee Somaliland (Hargeisa)_',
  });

  // Queue & Logs State
  const [activeOtps, setActiveOtps] = useState<any[]>([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);

  // Tester State
  const [testPhone, setTestPhone] = useState('252636807814');
  const [testCustomMessage, setTestCustomMessage] = useState('');
  const [testRole, setTestRole] = useState<'rider' | 'driver'>('rider');
  const [testResponse, setTestResponse] = useState<any | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  // Fetch live config & queue
  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [cfgRes, logsRes] = await Promise.all([
        fetch('/api/whatsapp/config'),
        fetch('/api/whatsapp/logs')
      ]);

      if (cfgRes.ok) {
        const cData = await cfgRes.json();
        if (cData.config) setConfig(cData.config);
      }

      if (logsRes.ok) {
        const lData = await logsRes.json();
        if (lData.activeOtps) setActiveOtps(lData.activeOtps);
        if (lData.recentLogs) setRecentLogs(lData.recentLogs);
      }
    } catch (_err) {
      // Fallback state
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleSaveConfig = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/whatsapp/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Failed to save WhatsApp config:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForceVerify = async (phone: string) => {
    try {
      const res = await fetch('/api/whatsapp/force-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      });
      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.error('Error force verifying:', err);
    }
  };

  const handleSendTestOtp = async () => {
    setIsTesting(true);
    setTestResponse(null);
    try {
      const res = await fetch('/api/whatsapp/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: testPhone,
          userRole: testRole,
          userName: 'Admin Test Dispatch',
        }),
      });
      const data = await res.json();
      setTestResponse({
        type: 'send-otp',
        success: res.ok,
        data,
      });
      fetchData();
    } catch (err: any) {
      setTestResponse({
        type: 'send-otp',
        success: false,
        data: { error: err?.message || 'Network error' },
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSendCustomTestMessage = async () => {
    setIsTesting(true);
    setTestResponse(null);
    try {
      const res = await fetch('/api/whatsapp/test-send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: testPhone,
          message: testCustomMessage || undefined,
        }),
      });
      const data = await res.json();
      setTestResponse({
        type: 'custom-message',
        success: res.ok,
        data,
      });
      fetchData();
    } catch (err: any) {
      setTestResponse({
        type: 'custom-message',
        success: false,
        data: { error: err?.message || 'Network error' },
      });
    } finally {
      setIsTesting(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2500);
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl p-5 shadow-xl text-slate-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shadow-lg shadow-emerald-500/20 shrink-0">
              <MessageCircle className="w-6 h-6 text-emerald-400 fill-emerald-400/20" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h1 className="text-lg font-black text-white">WhatsApp OTP & Gateway API Control</h1>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />
                  GATEWAY ONLINE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage Meta Cloud API, UltraMsg, Twilio, WhatsApp OTP verification templates & real-time dispatch logs for Somaliland (+252).
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 self-end md:self-auto">
            <button
              onClick={fetchData}
              disabled={isLoading}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-bold rounded-xl flex items-center space-x-1.5 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={handleSaveConfig}
              disabled={isLoading}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black rounded-xl flex items-center space-x-1.5 transition shadow-lg shadow-emerald-500/20"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{saveSuccess ? 'Saved Successfully!' : 'Save All Settings'}</span>
            </button>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-800 text-xs">
          <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Active Provider</span>
            <div className="font-extrabold text-emerald-400 text-sm mt-0.5 capitalize">
              {config.provider.replace('_', ' ')}
            </div>
            <span className="text-[10px] text-slate-500">Live API Endpoint</span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Active Pending OTPs</span>
            <div className="font-extrabold text-white text-sm mt-0.5">
              {activeOtps.length} in verification
            </div>
            <span className="text-[10px] text-emerald-400">10-Min Expiry</span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Admin Hotline</span>
            <div className="font-extrabold text-amber-400 text-sm mt-0.5 font-mono">
              +{config.adminNumber}
            </div>
            <span className="text-[10px] text-slate-500">Hargeisa, Somaliland</span>
          </div>

          <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Master Bypass PIN</span>
            <div className="font-extrabold text-blue-400 text-sm mt-0.5 font-mono">
              {config.enableMasterBypass ? config.masterBypassCode : 'Disabled'}
            </div>
            <span className="text-[10px] text-slate-500">Emergency Override</span>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center space-x-2 shadow-sm overflow-x-auto no-scrollbar">
        <button
          onClick={() => setSubTab('providers')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 shrink-0 ${
            subTab === 'providers'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Server className="w-3.5 h-3.5" />
          <span>Gateway Providers & API Keys</span>
        </button>

        <button
          onClick={() => setSubTab('rules')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 shrink-0 ${
            subTab === 'rules'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>OTP Rules & Somali Templates</span>
        </button>

        <button
          onClick={() => setSubTab('queue')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 shrink-0 relative ${
            subTab === 'queue'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Live OTP Queue & Logs</span>
          {activeOtps.length > 0 && (
            <span className="ml-1 px-1.5 py-0.2 bg-emerald-400 text-slate-950 font-black text-[10px] rounded-full">
              {activeOtps.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setSubTab('tester')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 shrink-0 ${
            subTab === 'tester'
              ? 'bg-emerald-500 text-slate-950 shadow-md'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>Live Dispatch Tester & API Docs</span>
        </button>
      </div>

      {/* SUB-TAB 1: PROVIDERS & CREDENTIALS */}
      {subTab === 'providers' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 text-xs">
          {/* Provider Selection */}
          <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3">
            <h3 className="font-extrabold text-white text-sm flex items-center space-x-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span>Select Active WhatsApp Engine</span>
            </h3>
            <p className="text-slate-400 text-xs">
              Choose which gateway backend should dispatch OTP messages to Zaad (+252 63) and eDahab (+252 65) users.
            </p>

            <div className="space-y-2 pt-2">
              {[
                { id: 'meta_cloud', name: 'Meta WhatsApp Cloud API', desc: 'Official Meta Graph API v19.0 (High volume & verified)', tag: 'Recommended' },
                { id: 'ultramsg', name: 'UltraMsg WhatsApp Gateway', desc: 'Instant QR code based API (No Meta Business verification needed)', tag: 'Fast Setup' },
                { id: 'twilio', name: 'Twilio WhatsApp API', desc: 'Enterprise carrier-grade delivery with global failover', tag: 'Enterprise' },
                { id: 'custom_webhook', name: 'Custom VPS Webhook', desc: 'Direct HTTP POST to Hostinger/Baileys/WPPConnect Node.js server', tag: 'Self-Hosted' },
              ].map((p) => (
                <div
                  key={p.id}
                  onClick={() => setConfig({ ...config, provider: p.id })}
                  className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                    config.provider === p.id
                      ? 'bg-emerald-500/10 border-emerald-500/50 shadow-md'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-black text-white">{p.name}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                      {p.tag}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Provider Credentials Form */}
          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
            <h3 className="font-extrabold text-white text-sm flex items-center space-x-2">
              <Key className="w-4 h-4 text-emerald-400" />
              <span>Provider API Credentials & Configuration</span>
            </h3>

            {/* Meta Cloud API Fields */}
            {config.provider === 'meta_cloud' && (
              <div className="space-y-3 p-4 bg-slate-950 rounded-2xl border border-emerald-500/20">
                <div className="flex items-center space-x-2 text-emerald-400 font-bold">
                  <Globe className="w-4 h-4" />
                  <span>Meta WhatsApp Cloud API (Graph API)</span>
                </div>
                <div>
                  <label className="text-slate-400 font-bold block mb-1">WhatsApp Phone Number ID</label>
                  <input
                    type="text"
                    value={config.metaPhoneNumberId}
                    onChange={(e) => setConfig({ ...config, metaPhoneNumberId: e.target.value })}
                    placeholder="e.g. 10482910481928"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-emerald-500"
                  />
                  <span className="text-[10px] text-slate-500">Found in Meta Developer Portal &gt; WhatsApp &gt; API Setup</span>
                </div>
                <div>
                  <label className="text-slate-400 font-bold block mb-1">System User Permanent Access Token</label>
                  <input
                    type="password"
                    value={config.metaApiToken}
                    onChange={(e) => setConfig({ ...config, metaApiToken: e.target.value })}
                    placeholder="EAAB..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            )}

            {/* UltraMsg Fields */}
            {config.provider === 'ultramsg' && (
              <div className="space-y-3 p-4 bg-slate-950 rounded-2xl border border-emerald-500/20">
                <div className="flex items-center space-x-2 text-emerald-400 font-bold">
                  <Radio className="w-4 h-4" />
                  <span>UltraMsg WhatsApp Instance</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 font-bold block mb-1">Instance ID</label>
                    <input
                      type="text"
                      value={config.ultraInstanceId}
                      onChange={(e) => setConfig({ ...config, ultraInstanceId: e.target.value })}
                      placeholder="e.g. instance82910"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 font-bold block mb-1">UltraMsg Token</label>
                    <input
                      type="password"
                      value={config.ultraToken}
                      onChange={(e) => setConfig({ ...config, ultraToken: e.target.value })}
                      placeholder="token_xxxxxx"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Twilio Fields */}
            {config.provider === 'twilio' && (
              <div className="space-y-3 p-4 bg-slate-950 rounded-2xl border border-emerald-500/20">
                <div className="flex items-center space-x-2 text-emerald-400 font-bold">
                  <Shield className="w-4 h-4" />
                  <span>Twilio WhatsApp Credentials</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-400 font-bold block mb-1">Account SID</label>
                    <input
                      type="text"
                      value={config.twilioSid}
                      onChange={(e) => setConfig({ ...config, twilioSid: e.target.value })}
                      placeholder="ACxxxxxxxx..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 font-bold block mb-1">Auth Token</label>
                    <input
                      type="password"
                      value={config.twilioAuthToken}
                      onChange={(e) => setConfig({ ...config, twilioAuthToken: e.target.value })}
                      placeholder="Auth token..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Sender WhatsApp Number</label>
                  <input
                    type="text"
                    value={config.twilioFrom}
                    onChange={(e) => setConfig({ ...config, twilioFrom: e.target.value })}
                    placeholder="whatsapp:+14155238886"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            )}

            {/* Custom Webhook Fields */}
            {config.provider === 'custom_webhook' && (
              <div className="space-y-3 p-4 bg-slate-950 rounded-2xl border border-emerald-500/20">
                <div className="flex items-center space-x-2 text-emerald-400 font-bold">
                  <Server className="w-4 h-4" />
                  <span>Custom HTTP Post Webhook / VPS Gateway</span>
                </div>
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Webhook URL</label>
                  <input
                    type="text"
                    value={config.customWebhookUrl}
                    onChange={(e) => setConfig({ ...config, customWebhookUrl: e.target.value })}
                    placeholder="https://api.yourdomain.com/whatsapp-send"
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-bold block mb-1">Optional Bearer Secret / API Key</label>
                  <input
                    type="password"
                    value={config.customApiKey}
                    onChange={(e) => setConfig({ ...config, customApiKey: e.target.value })}
                    placeholder="Secret token..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            )}

            {/* Common Gateway Identity Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-slate-400 font-bold block mb-1">Brand Sender Name</label>
                <input
                  type="text"
                  value={config.senderName}
                  onChange={(e) => setConfig({ ...config, senderName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="text-slate-400 font-bold block mb-1">Support Hotline (+252)</label>
                <input
                  type="text"
                  value={config.adminNumber}
                  onChange={(e) => setConfig({ ...config, adminNumber: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: RULES & SOMALI MESSAGE TEMPLATES */}
      {subTab === 'rules' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 text-xs">
          {/* Security & Expiry Rules */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
            <h3 className="font-extrabold text-white text-sm flex items-center space-x-2">
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>OTP Security & Bypass Settings</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-slate-400 font-bold block mb-1">OTP Code Expiration (Minutes)</label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={config.expiryMinutes}
                  onChange={(e) => setConfig({ ...config, expiryMinutes: parseInt(e.target.value) || 10 })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono outline-none focus:border-emerald-500"
                />
                <span className="text-[10px] text-slate-500">Default: 10 minutes recommended for Somaliland mobile networks.</span>
              </div>

              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white block">Emergency Master Bypass Code</span>
                    <span className="text-[10px] text-slate-400">Allows customer care & testing to verify without waiting for SMS/WhatsApp.</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.enableMasterBypass}
                    onChange={(e) => setConfig({ ...config, enableMasterBypass: e.target.checked })}
                    className="w-4 h-4 accent-emerald-500 cursor-pointer"
                  />
                </div>

                {config.enableMasterBypass && (
                  <div className="pt-2">
                    <label className="text-slate-400 font-bold block mb-1">Custom Bypass PIN</label>
                    <input
                      type="text"
                      value={config.masterBypassCode}
                      onChange={(e) => setConfig({ ...config, masterBypassCode: e.target.value })}
                      placeholder="123456"
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-blue-400 font-mono font-bold outline-none focus:border-emerald-500"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Template Editor */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
            <h3 className="font-extrabold text-white text-sm flex items-center space-x-2">
              <FileCode className="w-4 h-4 text-emerald-400" />
              <span>Somali & English WhatsApp Message Template</span>
            </h3>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-400 font-bold">Dynamic Variables:</label>
                <div className="space-x-1 font-mono text-[10px] text-emerald-400">
                  <span className="bg-slate-800 px-1 py-0.5 rounded">{`{{code}}`}</span>
                  <span className="bg-slate-800 px-1 py-0.5 rounded">{`{{expiry}}`}</span>
                  <span className="bg-slate-800 px-1 py-0.5 rounded">{`{{name}}`}</span>
                  <span className="bg-slate-800 px-1 py-0.5 rounded">{`{{role}}`}</span>
                </div>
              </div>
              <textarea
                rows={6}
                value={config.messageTemplate}
                onChange={(e) => setConfig({ ...config, messageTemplate: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-3 text-white font-mono text-xs outline-none focus:border-emerald-500"
              />
            </div>

            {/* Live Message Preview */}
            <div className="bg-[#0b141a] p-4 rounded-2xl border border-emerald-500/30 space-y-2">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold text-[11px]">
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp Live Render Preview:</span>
              </div>
              <div className="bg-[#005c4b] text-white p-3 rounded-xl rounded-tl-none max-w-sm text-[11px] leading-relaxed shadow">
                {config.messageTemplate
                  .replace(/{{code}}/g, '684920')
                  .replace(/{{expiry}}/g, config.expiryMinutes.toString())
                  .replace(/{{name}}/g, 'Ahmed Ali')
                  .replace(/{{role}}/g, 'Rakaab')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: LIVE QUEUE & DISPATCH LOGS */}
      {subTab === 'queue' && (
        <div className="space-y-5 text-xs">
          {/* Active Pending Verifications */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-white text-sm flex items-center space-x-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>Active Unverified OTP Requests ({activeOtps.length})</span>
              </h3>
              <span className="text-[10px] text-slate-400">Auto-expires in real-time</span>
            </div>

            {activeOtps.length === 0 ? (
              <div className="p-8 text-center bg-slate-950 rounded-2xl border border-slate-800 text-slate-500">
                No active pending verification codes at this moment.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 font-bold text-[11px]">
                      <th className="p-3">User & Phone</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Active OTP Code</th>
                      <th className="p-3">Time Remaining</th>
                      <th className="p-3 text-right">Quick Admin Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-medium">
                    {activeOtps.map((otp, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40 transition">
                        <td className="p-3">
                          <span className="font-bold text-white block">{otp.userName || 'Wadaage User'}</span>
                          <span className="font-mono text-emerald-400 text-[11px]">
                            {displayFormattedPhone(otp.phone)}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            otp.userRole === 'driver' ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
                          }`}>
                            {otp.userRole}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="px-2.5 py-1 bg-slate-950 text-white font-mono font-black text-xs rounded-lg border border-slate-700">
                            {otp.code}
                          </span>
                        </td>
                        <td className="p-3 text-slate-300 font-mono">
                          {Math.floor(otp.expiresInSeconds / 60)}m {otp.expiresInSeconds % 60}s
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => handleForceVerify(otp.phone)}
                            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] rounded-lg transition shadow"
                          >
                            Force Verify
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Historical Logs */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3">
            <h3 className="font-extrabold text-white text-sm flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>Recent WhatsApp Transmission History</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-bold text-[11px]">
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Recipient</th>
                    <th className="p-3">Gateway Provider</th>
                    <th className="p-3">Code</th>
                    <th className="p-3">Delivery Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {recentLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition">
                      <td className="p-3 text-slate-400 font-mono text-[11px]">{log.timestamp}</td>
                      <td className="p-3">
                        <span className="font-mono text-white font-bold">{displayFormattedPhone(log.phone)}</span>
                        <span className="text-[10px] text-slate-400 block uppercase">{log.userRole}</span>
                      </td>
                      <td className="p-3 text-slate-300">{log.provider}</td>
                      <td className="p-3 font-mono text-white font-bold">{log.code}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          log.status === 'VERIFIED'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 4: TESTER & DEVELOPER API DOCS */}
      {subTab === 'tester' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 text-xs">
          {/* Live Phone Dispatch Tester */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
            <h3 className="font-extrabold text-white text-sm flex items-center space-x-2">
              <Send className="w-4 h-4 text-emerald-400" />
              <span>Interactive Real-Time WhatsApp Tester</span>
            </h3>
            <p className="text-slate-400 text-xs">
              Test sending real OTP messages or custom dispatches directly to any Somaliland WhatsApp mobile number.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-slate-400 font-bold block mb-1">Target Somaliland Phone Number</label>
                <input
                  type="text"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="e.g. 252636807814"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Test User Role</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setTestRole('rider')}
                    className={`py-2 rounded-xl font-bold transition ${
                      testRole === 'rider' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-950 text-slate-400 border border-slate-800'
                    }`}
                  >
                    Rider OTP
                  </button>
                  <button
                    type="button"
                    onClick={() => setTestRole('driver')}
                    className={`py-2 rounded-xl font-bold transition ${
                      testRole === 'driver' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-950 text-slate-400 border border-slate-800'
                    }`}
                  >
                    Driver OTP
                  </button>
                </div>
              </div>

              <div>
                <label className="text-slate-400 font-bold block mb-1">Optional Custom Text Message</label>
                <textarea
                  rows={2}
                  value={testCustomMessage}
                  onChange={(e) => setTestCustomMessage(e.target.value)}
                  placeholder="Leave empty to send default OTP code..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  disabled={isTesting}
                  onClick={handleSendTestOtp}
                  className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl transition shadow flex items-center justify-center space-x-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isTesting ? 'Sending...' : 'Dispatch Live OTP'}</span>
                </button>
                <button
                  type="button"
                  disabled={isTesting}
                  onClick={handleSendCustomTestMessage}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition border border-slate-700"
                >
                  Custom Message
                </button>
              </div>

              {testResponse && (
                <div className={`p-4 rounded-2xl border font-mono text-[11px] ${
                  testResponse.success ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300' : 'bg-red-950/30 border-red-500/40 text-red-300'
                }`}>
                  <div className="font-bold flex items-center space-x-1.5 mb-1">
                    {testResponse.success ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                    <span>Gateway Result Response</span>
                  </div>
                  <pre className="overflow-x-auto text-[10px]">
                    {JSON.stringify(testResponse.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>

          {/* Hostinger & Backend Integration Code */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
            <h3 className="font-extrabold text-white text-sm flex items-center space-x-2">
              <FileCode className="w-4 h-4 text-emerald-400" />
              <span>Hostinger cPanel / PHP / Node.js API Code</span>
            </h3>
            <p className="text-slate-400 text-xs">
              Copy and paste these snippets to call the Wadaage WhatsApp OTP engine from any external server or website.
            </p>

            <div className="space-y-3">
              {/* cURL */}
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-slate-400 font-bold">
                  <span>cURL Endpoint</span>
                  <button
                    onClick={() => copyToClipboard(`curl -X POST https://yourdomain.com/api/whatsapp/send-otp -H "Content-Type: application/json" -d '{"phone":"252636807814","userRole":"rider"}'`, 'curl')}
                    className="text-[10px] text-emerald-400 flex items-center space-x-1 hover:underline"
                  >
                    {copiedSnippet === 'curl' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedSnippet === 'curl' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="font-mono text-[10px] text-slate-300 overflow-x-auto p-2 bg-slate-900 rounded-lg">
{`curl -X POST https://yourdomain.com/api/whatsapp/send-otp \\
  -H "Content-Type: application/json" \\
  -d '{"phone":"252636807814","userRole":"rider"}'`}
                </pre>
              </div>

              {/* PHP for Hostinger cPanel */}
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-slate-400 font-bold">
                  <span>PHP (Hostinger Web Server)</span>
                  <button
                    onClick={() => copyToClipboard(`<?php
$data = ['phone' => '252636807814', 'userRole' => 'driver'];
$ch = curl_init('https://yourdomain.com/api/whatsapp/send-otp');
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type:application/json']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$result = curl_exec($ch);
curl_close($ch);
?>`, 'php')}
                    className="text-[10px] text-emerald-400 flex items-center space-x-1 hover:underline"
                  >
                    {copiedSnippet === 'php' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedSnippet === 'php' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="font-mono text-[10px] text-slate-300 overflow-x-auto p-2 bg-slate-900 rounded-lg">
{`<?php
$data = ['phone' => '252636807814', 'userRole' => 'driver'];
$ch = curl_init('https://yourdomain.com/api/whatsapp/send-otp');
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type:application/json']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$result = curl_exec($ch);
?>`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
