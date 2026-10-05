import React, { useState, useEffect } from 'react';
import { Phone, PhoneCall, PhoneOff, Mic, MicOff, Volume2, VolumeX, Shield, Radio } from 'lucide-react';
import { VoiceCallSession } from '../../types';
import { voiceCallService } from '../../services/voiceCallService';

interface InAppVoiceCallModalProps {
  session: VoiceCallSession | null;
  currentUserId: string;
  onClose: () => void;
}

export const InAppVoiceCallModal: React.FC<InAppVoiceCallModalProps> = ({
  session,
  currentUserId,
  onClose,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);

  const isIncoming = session?.status === 'calling' && session.receiverId === currentUserId;
  const isOutgoing = session?.status === 'calling' && session.callerId === currentUserId;
  const isConnected = session?.status === 'connected';

  // Call duration timer
  useEffect(() => {
    let interval: any = null;
    if (isConnected) {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isConnected]);

  // Handle auto-close on end
  useEffect(() => {
    if (session?.status === 'ended' || session?.status === 'rejected' || session?.status === 'busy') {
      const timeout = setTimeout(() => {
        onClose();
      }, 1200);
      return () => clearTimeout(timeout);
    }
  }, [session?.status, onClose]);

  if (!session) return null;

  const otherPersonName =
    session.callerId === currentUserId ? session.receiverName : session.callerName;
  const otherPersonRole =
    session.callerId === currentUserId
      ? session.receiverRole === 'driver'
        ? 'Captain / Darawal'
        : 'Rider / Rakaab'
      : session.callerRole === 'driver'
      ? 'Captain / Darawal'
      : 'Rider / Rakaab';

  const formatSeconds = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    voiceCallService.setMute(next);
  };

  const handleAnswer = async () => {
    await voiceCallService.answerCall(session, currentUserId);
  };

  const handleDecline = async () => {
    await voiceCallService.rejectCall(session.rideId, 'rejected');
    onClose();
  };

  const handleEndCall = async () => {
    await voiceCallService.endCall(session.rideId);
    onClose();
  };

  return (
    <div
      id="in_app_voice_call_overlay"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl text-white flex flex-col items-center p-6 sm:p-8 relative">
        {/* Encrypted channel badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-[11px] font-semibold text-emerald-400 mb-6">
          <Shield className="w-3.5 h-3.5" />
          <span>Wadaage Secure Voice (Order #{session.rideId.slice(-6)})</span>
        </div>

        {/* Animated Avatar Circle */}
        <div className="relative mb-6">
          {(isOutgoing || isIncoming) && (
            <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping scale-150" />
          )}
          {isConnected && (
            <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-pulse scale-125" />
          )}
          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 flex items-center justify-center text-white text-3xl font-extrabold shadow-lg relative z-10 border-4 border-slate-900">
            {(otherPersonName || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="absolute bottom-0 right-0 z-20 w-8 h-8 rounded-full bg-emerald-500 border-2 border-slate-900 flex items-center justify-center">
            <Radio className="w-4 h-4 text-white animate-pulse" />
          </div>
        </div>

        {/* Person Name & Role */}
        <h3 className="text-xl font-bold text-slate-100 text-center">{otherPersonName}</h3>
        <p className="text-xs text-slate-400 mt-0.5">{otherPersonRole}</p>

        {/* Call Status Text / Timer */}
        <div className="mt-4 mb-8">
          {isOutgoing && (
            <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold animate-pulse">
              <PhoneCall className="w-4 h-4" />
              <span>Ringing... / Waa la garaacayaa</span>
            </div>
          )}
          {isIncoming && (
            <div className="flex items-center gap-2 text-amber-400 text-sm font-semibold animate-bounce">
              <PhoneCall className="w-4 h-4" />
              <span>Incoming In-App Voice Call...</span>
            </div>
          )}
          {isConnected && (
            <div className="text-emerald-400 font-mono text-lg font-bold tracking-wider">
              {formatSeconds(callDuration)}
            </div>
          )}
          {session.status === 'ended' && (
            <div className="text-rose-400 text-sm font-semibold">Call Ended / Wicitaankii wuu dhamaaday</div>
          )}
          {session.status === 'rejected' && (
            <div className="text-amber-400 text-sm font-semibold">Call Declined</div>
          )}
        </div>

        {/* Controls Layout */}
        {isIncoming ? (
          <div className="flex items-center justify-center gap-8 w-full">
            {/* Decline Button */}
            <button
              id="btn_decline_voice_call"
              onClick={handleDecline}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-lg transition-transform group-hover:scale-105 active:scale-95">
                <PhoneOff className="w-7 h-7" />
              </div>
              <span className="text-xs font-semibold text-slate-300">Diid (Decline)</span>
            </button>

            {/* Accept Button */}
            <button
              id="btn_accept_voice_call"
              onClick={handleAnswer}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-lg transition-transform group-hover:scale-105 active:scale-95 animate-pulse">
                <Phone className="w-7 h-7" />
              </div>
              <span className="text-xs font-semibold text-slate-300">Qabo (Accept)</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-5 w-full">
            {/* Mute Toggle */}
            <button
              id="btn_toggle_voice_mute"
              onClick={handleToggleMute}
              disabled={!isConnected}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                isMuted
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
              } disabled:opacity-40`}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* End Call Button */}
            <button
              id="btn_end_voice_call"
              onClick={handleEndCall}
              className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95"
            >
              <PhoneOff className="w-7 h-7" />
            </button>

            {/* Speaker Toggle */}
            <button
              id="btn_toggle_voice_speaker"
              onClick={() => setIsSpeakerOn(!isSpeakerOn)}
              disabled={!isConnected}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
                isSpeakerOn
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
              } disabled:opacity-40`}
            >
              {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
