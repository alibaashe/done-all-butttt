import React, { useState, useEffect, useRef } from 'react';
import { Send, PhoneCall, ShieldCheck, X, CheckCheck, MessageSquare } from 'lucide-react';
import { useRide } from '../../context/RideContext';

interface ChatModalProps {
  onClose: () => void;
  viewerRole?: 'passenger' | 'driver';
}

export const ChatModal: React.FC<ChatModalProps> = ({ onClose, viewerRole }) => {
  const { chatMessages, sendMessage, currentRide, drivers, currentUser, role, markChatAsRead } = useRide();
  const [inputText, setInputText] = useState('');
  const [selectedRiderTab, setSelectedRiderTab] = useState<'RIDER_A' | 'RIDER_B'>('RIDER_A');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeViewerRole = viewerRole || (role === 'driver' ? 'driver' : 'passenger');

  // Mark unread messages as read upon opening
  useEffect(() => {
    markChatAsRead();
  }, [markChatAsRead]);

  // Auto-scroll to latest message on update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const assignedDriver =
    (currentRide?.assignedDriverId ? drivers.find((d) => d.id === currentRide.assignedDriverId) : null) ||
    drivers[0] || {
      id: 'live_driver',
      name: currentRide?.driverName || 'Wadaage Captain',
      phone: currentRide?.driverPhone || '+252 63 6807814',
      avatar: currentRide?.driverAvatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      rating: 5.0,
      vehicle: {
        model: currentRide?.vehicleModel || 'Toyota Vitz',
        licensePlate: currentRide?.licensePlate || 'SL-24810',
        color: 'White',
      },
    };

  const primaryRiderName = currentRide?.passengerName || 'Passenger';
  const primaryRiderPhone = currentRide?.passengerPhone || '';

  const coRiderName = currentRide?.coPassenger?.name || 'Co-Passenger';
  const coRiderPhone = currentRide?.coPassenger?.phone || '';

  const passengerName = selectedRiderTab === 'RIDER_B' && currentRide?.coPassenger ? coRiderName : primaryRiderName;
  const passengerPhone = selectedRiderTab === 'RIDER_B' && currentRide?.coPassenger ? coRiderPhone : primaryRiderPhone;

  // Role-specific bilingual Somali / English quick replies
  const passengerQuickReplies = [
    '📍 Waan joogaa albaabka (Waiting at main gate)',
    '❄️ AC xooggan noo shid (Please turn on AC)',
    '⏳ Waan soo degayaa 1 min (Coming down shortly)',
    '👀 Waan arkaa gaadhigaaga (I see your vehicle)',
  ];

  const driverQuickReplies = [
    '🚗 Waan soo socdaa, 2 daqiiqo (On my way, 2 mins)',
    '📍 Waan joogaa afaafka (I have arrived at pickup)',
    '💡 Gaadhigu waa Vitz caddaan (White Vitz with hazards)',
    '🚦 Wax yar traffic baa jira (Slight traffic, arriving soon)',
  ];

  const quickReplies = activeViewerRole === 'driver' ? driverQuickReplies : passengerQuickReplies;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
      sendMessage(inputText);
      setInputText('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md w-full h-[560px] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">

        {/* Rider Selection Tabs if Driver has 2 Active Passengers */}
        {activeViewerRole === 'driver' && currentRide?.coPassenger && (
          <div className="bg-slate-950 px-3 py-2 border-b border-slate-800 flex space-x-2 shrink-0">
            <button
              type="button"
              onClick={() => setSelectedRiderTab('RIDER_A')}
              className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-black transition ${
                selectedRiderTab === 'RIDER_A'
                  ? 'bg-emerald-500 text-slate-950 shadow'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              👤 Rider A ({primaryRiderName.split(' ')[0]})
            </button>
            <button
              type="button"
              onClick={() => setSelectedRiderTab('RIDER_B')}
              className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-black transition ${
                selectedRiderTab === 'RIDER_B'
                  ? 'bg-teal-500 text-slate-950 shadow'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              👥 Rider B ({coRiderName.split(' ')[0]})
            </button>
          </div>
        )}

        {/* Chat Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white p-3.5 sm:p-4 flex items-center justify-between border-b border-slate-800 shadow-sm shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="relative shrink-0">
              {activeViewerRole === 'passenger' ? (
                <img
                  src={assignedDriver.avatar}
                  alt={assignedDriver.name}
                  className="w-11 h-11 rounded-full object-cover border-2 border-emerald-500 shadow-sm"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-[#008751] text-white font-black flex items-center justify-center text-lg border-2 border-white/20 shadow-sm">
                  {passengerName.charAt(0) || 'P'}
                </div>
              )}
              <span className="w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-slate-900 absolute bottom-0 right-0 shadow-sm"></span>
            </div>

            <div className="min-w-0">
              <div className="flex items-center space-x-1.5">
                <h3 className="font-extrabold text-sm truncate text-white">
                  {activeViewerRole === 'passenger' ? assignedDriver.name : passengerName}
                </h3>
                <span className="bg-emerald-500/20 text-emerald-400 text-[9px] font-extrabold px-1.5 py-0.5 rounded border border-emerald-500/30">
                  {activeViewerRole === 'passenger' ? 'CAPTAIN' : 'RIDER'}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium truncate flex items-center gap-1 mt-0.5">
                {activeViewerRole === 'passenger' ? (
                  <>
                    <span>{assignedDriver.vehicle.model}</span>
                    <span>•</span>
                    <span className="font-mono font-bold text-emerald-400">{assignedDriver.vehicle.licensePlate}</span>
                  </>
                ) : (
                  <>
                    <span>Dropoff: {currentRide?.dropoff?.name || 'Destination'}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 shrink-0">
            <a
              href={`tel:${activeViewerRole === 'passenger' ? assignedDriver.phone : passengerPhone}`}
              className="p-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 transition border border-emerald-500/30"
              title="Call directly"
            >
              <PhoneCall className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
              title="Close chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Cloud Sync Banner */}
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-100 dark:border-emerald-900/40 px-3.5 py-1.5 flex items-center justify-between text-[10px] text-emerald-800 dark:text-emerald-300 shrink-0 font-medium">
          <div className="flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Cloud Firestore Live Ride Channel Active</span>
          </div>
          <span className="font-mono text-[9px] text-emerald-700 dark:text-emerald-400 font-bold">
            0ms In-App Relay
          </span>
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 p-3.5 sm:p-4 overflow-y-auto space-y-3 bg-slate-50 dark:bg-slate-950/60">
          {chatMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2 text-slate-400">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-emerald-500 flex items-center justify-center shadow-inner">
                <MessageSquare className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                Direct In-Ride Chat
              </p>
              <p className="text-[11px] text-slate-500 max-w-[220px]">
                Coordinate pickup location or arrival status in real time. Choose a quick reply below or type a message.
              </p>
            </div>
          ) : (
            chatMessages.map((msg) => {
              const isMe = msg.sender === activeViewerRole;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[82%] p-3 rounded-2xl text-xs leading-relaxed shadow-sm ${
                      isMe
                        ? 'bg-[#008751] text-white font-medium rounded-tr-none'
                        : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-tl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <div className="flex items-center space-x-1 text-[9px] text-slate-400 mt-1 px-1">
                    <span>{msg.timestamp || 'Just now'}</span>
                    {isMe && <CheckCheck className="w-3 h-3 text-emerald-600" />}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Replies Bar */}
        <div className="px-3 py-2 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex space-x-2 overflow-x-auto no-scrollbar shrink-0">
          {quickReplies.map((reply, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => sendMessage(reply)}
              className="shrink-0 bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 text-slate-700 dark:text-slate-200 hover:text-[#008751] dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-700 text-[10px] font-bold px-3 py-1.5 rounded-full transition-all active:scale-95 whitespace-nowrap"
            >
              {reply}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={handleSend}
          className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center space-x-2 shrink-0"
        >
          <input
            type="text"
            placeholder={
              activeViewerRole === 'driver'
                ? 'Qor fariin aad u direyso rakaabka (Message rider)...'
                : 'Qor fariin aad u direyso darawalka (Message driver)...'
            }
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs rounded-xl px-3.5 py-2.5 focus:ring-2 focus:ring-emerald-500 outline-none"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2.5 bg-[#008751] hover:bg-[#007445] disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition-all active:scale-95"
            title="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
