import { doc, setDoc, onSnapshot, collection, addDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';
import { VoiceCallSession, VoiceCallSignal, CallStatus } from '../types';
import { getApiUrl } from './apiConfig';

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

class VoiceCallManager {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteAudioElement: HTMLAudioElement | null = null;
  private activeRideId: string | null = null;
  private unsubscribeSession: (() => void) | null = null;
  private unsubscribeSignals: (() => void) | null = null;
  private currentUserId: string | null = null;

  public onRemoteStreamReady: ((stream: MediaStream) => void) | null = null;
  public onCallStateChange: ((status: CallStatus, session?: VoiceCallSession) => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.remoteAudioElement = new Audio();
      this.remoteAudioElement.autoplay = true;
    }
  }

  public setUserId(userId: string) {
    this.currentUserId = userId;
  }

  // Initialize WebRTC Peer Connection
  private async initPeerConnection(rideId: string) {
    this.cleanupPeerConnection();

    this.peerConnection = new RTCPeerConnection(ICE_SERVERS);
    this.activeRideId = rideId;

    // Get microphone audio stream
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      // Add local audio tracks to peer connection
      this.localStream.getTracks().forEach((track) => {
        if (this.peerConnection && this.localStream) {
          this.peerConnection.addTrack(track, this.localStream);
        }
      });
    } catch (err) {
      console.warn('Microphone permission or hardware access notice:', err);
    }

    // Handle remote audio stream
    this.peerConnection.ontrack = (event) => {
      const [remoteStream] = event.streams;
      if (this.remoteAudioElement) {
        this.remoteAudioElement.srcObject = remoteStream;
        this.remoteAudioElement.play().catch(() => {});
      }
      if (this.onRemoteStreamReady) {
        this.onRemoteStreamReady(remoteStream);
      }
    };

    // Handle ICE Candidates
    this.peerConnection.onicecandidate = async (event) => {
      if (event.candidate && this.currentUserId) {
        await this.sendSignal(rideId, {
          id: `cand_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          rideId,
          senderId: this.currentUserId,
          type: 'candidate',
          candidate: event.candidate.toJSON(),
          timestamp: Date.now(),
        });
      }
    };

    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection?.connectionState;
      if (state === 'connected') {
        if (this.onCallStateChange) this.onCallStateChange('connected');
      } else if (state === 'disconnected' || state === 'failed' || state === 'closed') {
        if (this.onCallStateChange) this.onCallStateChange('ended');
      }
    };
  }

  // Start outgoing call
  public async startCall(
    rideId: string,
    caller: { id: string; name: string; role: 'passenger' | 'driver' },
    receiver: { id: string; name: string; role: 'passenger' | 'driver' }
  ): Promise<VoiceCallSession> {
    this.currentUserId = caller.id;
    await this.initPeerConnection(rideId);

    const session: VoiceCallSession = {
      id: `call_${rideId}_${Date.now()}`,
      rideId,
      callerId: caller.id,
      callerName: caller.name,
      callerRole: caller.role,
      receiverId: receiver.id,
      receiverName: receiver.name,
      receiverRole: receiver.role,
      status: 'calling',
      startedAt: Date.now(),
      channelName: rideId,
    };

    // Save session in Firestore
    try {
      const sessionRef = doc(db, 'rides', rideId, 'calls', 'active_session');
      await setDoc(sessionRef, session, { merge: true });
    } catch (e) {
      console.warn('Firestore call session save notice:', e);
    }

    // Server fallback
    try {
      await fetch(getApiUrl(`/api/rides/${rideId}/call/session`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(session),
      });
    } catch (_e) {}

    // Create SDP Offer
    if (this.peerConnection) {
      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
      });
      await this.peerConnection.setLocalDescription(offer);

      await this.sendSignal(rideId, {
        id: `sig_offer_${Date.now()}`,
        rideId,
        senderId: caller.id,
        type: 'offer',
        sdp: offer,
        timestamp: Date.now(),
      });
    }

    this.listenToSignals(rideId, caller.id);
    return session;
  }

  // Answer incoming call
  public async answerCall(session: VoiceCallSession, receiverId: string): Promise<void> {
    this.currentUserId = receiverId;
    await this.initPeerConnection(session.rideId);

    // Update session to connected
    const updated: VoiceCallSession = {
      ...session,
      status: 'connected',
      connectedAt: Date.now(),
    };

    try {
      const sessionRef = doc(db, 'rides', session.rideId, 'calls', 'active_session');
      await setDoc(sessionRef, updated, { merge: true });
    } catch (e) {
      console.warn('Firestore answer session update notice:', e);
    }

    try {
      await fetch(getApiUrl(`/api/rides/${session.rideId}/call/session`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
    } catch (_e) {}

    this.listenToSignals(session.rideId, receiverId);
  }

  // Reject call
  public async rejectCall(rideId: string, reason: CallStatus = 'rejected'): Promise<void> {
    try {
      const sessionRef = doc(db, 'rides', rideId, 'calls', 'active_session');
      await setDoc(sessionRef, { status: reason, endedAt: Date.now() }, { merge: true });
    } catch (_e) {}

    try {
      await fetch(getApiUrl(`/api/rides/${rideId}/call/session`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: reason, endedAt: Date.now() }),
      });
    } catch (_e) {}

    this.hangup();
  }

  // End active call
  public async endCall(rideId: string): Promise<void> {
    try {
      const sessionRef = doc(db, 'rides', rideId, 'calls', 'active_session');
      await setDoc(sessionRef, { status: 'ended', endedAt: Date.now() }, { merge: true });
    } catch (_e) {}

    try {
      await fetch(getApiUrl(`/api/rides/${rideId}/call/session`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ended', endedAt: Date.now() }),
      });
    } catch (_e) {}

    if (this.currentUserId) {
      await this.sendSignal(rideId, {
        id: `sig_hangup_${Date.now()}`,
        rideId,
        senderId: this.currentUserId,
        type: 'hangup',
        timestamp: Date.now(),
      });
    }

    this.hangup();
  }

  // Toggle Mute
  public setMute(muted: boolean): boolean {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
      return muted;
    }
    return false;
  }

  // Send WebRTC Signal
  private async sendSignal(rideId: string, signal: VoiceCallSignal) {
    try {
      const signalsCol = collection(db, 'rides', rideId, 'call_signals');
      await addDoc(signalsCol, signal);
    } catch (_e) {}

    try {
      await fetch(getApiUrl(`/api/rides/${rideId}/call/signal`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signal),
      });
    } catch (_e) {}
  }

  // Listen to incoming WebRTC signals
  private listenToSignals(rideId: string, myUserId: string) {
    if (this.unsubscribeSignals) this.unsubscribeSignals();

    try {
      const signalsCol = collection(db, 'rides', rideId, 'call_signals');
      this.unsubscribeSignals = onSnapshot(signalsCol, (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === 'added') {
            const signal = change.doc.data() as VoiceCallSignal;
            if (signal.senderId === myUserId) return; // Skip own signals

            if (signal.type === 'offer' && this.peerConnection) {
              await this.peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp));
              const answer = await this.peerConnection.createAnswer();
              await this.peerConnection.setLocalDescription(answer);

              await this.sendSignal(rideId, {
                id: `sig_ans_${Date.now()}`,
                rideId,
                senderId: myUserId,
                type: 'answer',
                sdp: answer,
                timestamp: Date.now(),
              });
            } else if (signal.type === 'answer' && this.peerConnection) {
              if (this.peerConnection.signalingState === 'have-local-offer') {
                await this.peerConnection.setRemoteDescription(new RTCSessionDescription(signal.sdp));
              }
            } else if (signal.type === 'candidate' && this.peerConnection && signal.candidate) {
              try {
                await this.peerConnection.addIceCandidate(new RTCIceCandidate(signal.candidate));
              } catch (e) {
                console.warn('ICE candidate handling notice:', e);
              }
            } else if (signal.type === 'hangup' || signal.type === 'reject') {
              this.hangup();
              if (this.onCallStateChange) {
                this.onCallStateChange('ended');
              }
            }
          }
        });
      });
    } catch (err) {
      console.warn('Voice signals listener notice:', err);
    }
  }

  // Listen to active call session state
  public subscribeToCallSession(
    rideId: string,
    callback: (session: VoiceCallSession | null) => void
  ): () => void {
    try {
      const sessionRef = doc(db, 'rides', rideId, 'calls', 'active_session');
      const unsubscribe = onSnapshot(sessionRef, (docSnap) => {
        if (docSnap.exists()) {
          const session = docSnap.data() as VoiceCallSession;
          callback(session);
        } else {
          callback(null);
        }
      });
      return unsubscribe;
    } catch (err) {
      console.warn('Call session listener fallback:', err);
      return () => {};
    }
  }

  // Teardown
  public hangup() {
    this.cleanupPeerConnection();
    if (this.unsubscribeSignals) {
      this.unsubscribeSignals();
      this.unsubscribeSignals = null;
    }
  }

  private cleanupPeerConnection() {
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
  }
}

export const voiceCallService = new VoiceCallManager();
