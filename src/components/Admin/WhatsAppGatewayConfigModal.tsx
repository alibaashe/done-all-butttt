import React, { useState, useEffect } from 'react';
import { X, MessageCircle, Send, CheckCircle2, ShieldCheck, RefreshCw, Key, Phone, Server } from 'lucide-react';
import { ADMIN_WHATSAPP_NUMBER, sendWhatsAppOtp, displayFormattedPhone } from '../../services/whatsappOtpService';

interface WhatsAppGatewayConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WhatsAppGatewayConfigModal: React.FC<WhatsAppGatewayConfigModalProps> = ({ isOpen, onClose }) => {
  const [testPhone, setTestPhone] = useState('00252636807814');
  const [testRole, setTestRole] = useState<'rider' | 'driver'>('rider');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Stats
  const [gatewayStats, setGatewayStats] = useState<{
    activeOtpsCount: number;
    adminNumber: string;
    senderName: string;
    status: string;
  }>({
    activeOtpsCount: 0,
    adminNumber: '00252636807814',
    senderName: 'Wadaage App Gateway',
    status: 'ONLINE',
  });

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/whatsapp/stats');
      if (res.ok) {
        const data = await res.json();
        setGatewayStats(data);
      }
    } catch (_e) {
      // client fallback
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStats();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestSend = async () => {
    setIsLoading(true);
    setTestResult(null);

    const result = await sendWhatsAppOtp(testPhone, testRole, 'Admin Gateway Tester');
    setIsLoading(false);

    if (result.success) {
      setTestResult(`✅ OTP Code (${result.otpCode}) dispatched to ${result.phoneFormatted} via WhatsApp Gateway!`);
      fetchStats();
    } else {
      setTestResult(`❌ Error: ${result.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl text-slate-100 flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900/80 via-slate-900 to-slate-900 p-5 border-b border-emerald-500/20 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-emerald-400 fill-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white flex items-center space-x-2">
                <span>WhatsApp OTP Gateway Setup</span>
                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/30 font-mono">
                  LIVE
                </span>
              </h2>
              <p className="text-xs text-slate-400">Rider & Driver Verification Service Engine</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">

          {/* Status & Metrics Bar */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-slate-400 font-bold">
                <span>Gateway Status</span>
                <Server className="w-3.5 h-3.5 text-emerald-400" />
              </div>
              <div className="text-sm font-black text-emerald-400 flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>{gatewayStats.status}</span>
              </div>
              <p className="text-[10px] text-slate-500">Express + Vite Server Online</p>
            </div>

            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-slate-400 font-bold">
                <span>Admin Line</span>
                <Phone className="w-3.5 h-3.5 text-amber-400" />
              </div>
              <div className="text-xs font-black text-amber-400 font-mono">
                +{ADMIN_WHATSAPP_NUMBER}
              </div>
              <p className="text-[10px] text-slate-500">Wadaage App (+252 63 6807814)</p>
            </div>
          </div>

          {/* Test Live WhatsApp OTP Dispatch Section */}
          <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-emerald-400 text-xs flex items-center space-x-1.5">
                <Send className="w-4 h-4" />
                <span>Test Live WhatsApp OTP Dispatch</span>
              </span>
              <button
                type="button"
                onClick={fetchStats}
                className="text-[10px] text-slate-400 hover:text-emerald-400 flex items-center space-x-1"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh</span>
              </button>
            </div>

            <div className="space-y-2">
              <div>
                <label className="text-[11px] text-slate-400 font-bold block mb-1">
                  Test Somaliland Phone Number
                </label>
                <input
                  type="text"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="e.g. 00252636807814"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 font-mono font-bold text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center space-x-3">
                <label className="text-[11px] text-slate-400 font-bold">Target Role:</label>
                <label className="flex items-center space-x-1 text-slate-300 font-bold cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    checked={testRole === 'rider'}
                    onChange={() => setTestRole('rider')}
                    className="accent-emerald-500"
                  />
                  <span>Rider</span>
                </label>
                <label className="flex items-center space-x-1 text-slate-300 font-bold cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    checked={testRole === 'driver'}
                    onChange={() => setTestRole('driver')}
                    className="accent-emerald-500"
                  />
                  <span>Driver</span>
                </label>
              </div>

              <button
                type="button"
                onClick={handleTestSend}
                disabled={isLoading}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black py-2.5 rounded-xl shadow transition flex items-center justify-center space-x-2"
              >
                {isLoading ? (
                  <span className="animate-spin w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full" />
                ) : (
                  <>
                    <MessageCircle className="w-4 h-4 fill-slate-950" />
                    <span>Send Test WhatsApp OTP to {displayFormattedPhone(testPhone)}</span>
                  </>
                )}
              </button>

              {testResult && (
                <div className="p-2.5 bg-slate-950 rounded-xl border border-emerald-500/30 text-[11px] font-bold text-emerald-300 leading-snug">
                  {testResult}
                </div>
              )}
            </div>
          </div>

          {/* Config Settings Info */}
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
            <span className="font-extrabold text-slate-300 text-xs flex items-center space-x-1.5">
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>Production WhatsApp Business API Credentials</span>
            </span>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              When deploying to production with Meta WhatsApp Business Cloud API or UltraMsg, set these environment variables in your deployment dashboard:
            </p>
            <div className="bg-slate-900 p-2.5 rounded-xl font-mono text-[10px] text-emerald-400 space-y-1">
              <div>WHATSAPP_ADMIN_NUMBER=252636807814</div>
              <div>WHATSAPP_API_TOKEN=EAAG...</div>
              <div>WHATSAPP_PHONE_NUMBER_ID=1092837...</div>
            </div>
          </div>

          {/* Features Checkbox List */}
          <div className="space-y-1.5 text-[11px] text-slate-400">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Standardizes 0025263 (ZAAD) & 0025265 (eDahab) phone formats</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Auto 60-second anti-spam resend timer</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Deep-link direct dispatch to WhatsApp line +252 63 6807814</span>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition"
          >
            Close Gateway Panel
          </button>
        </div>

      </div>
    </div>
  );
};
