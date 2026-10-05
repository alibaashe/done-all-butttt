// Real-time Push, Background & Emergency Ringtone Service for Wadaage Platform (Rider & Driver)

import { liveLocationService } from './liveLocationService';

class NotificationService {
  private swRegistration: ServiceWorkerRegistration | null = null;
  private permission: NotificationPermission = 'default';
  private audioCtx: AudioContext | null = null;
  private ringtoneInterval: any = null;
  private activeOscillators: OscillatorNode[] = [];
  private isRingtonePlaying: boolean = false;
  private orderAlertChannelReady = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.permission = 'Notification' in window ? Notification.permission : 'denied';
      this.initServiceWorker();
      // Create the high-importance "new order" channel as early as possible so a
      // sleeping phone still rings at full volume when a ride request lands.
      this.ensureOrderAlertChannel();
    }
  }

  /**
   * Android 8+ plays a notification's sound based on its CHANNEL importance, not
   * on the notification itself. Create a dedicated MAX-importance channel with
   * the alarm audio stream so incoming orders ring loudly even when the phone is
   * locked and the driver is not looking at the app.
   */
  public ensureOrderAlertChannel() {
    if (this.orderAlertChannelReady) return;
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (!('serviceWorker' in navigator) || !navigator.serviceWorker) return;
    try {
      this.orderAlertChannelReady = true;
      const payload = {
        type: 'ENSURE_ORDER_CHANNEL',
        channel: {
          id: 'wadaage-orders-urgent',
          name: 'New ride orders',
          description: 'Rings loudly when a new ride request arrives',
          importance: 'max',
          sound: 'alarm',
          vibration: [800, 200, 800, 200, 1000, 200, 1000],
          lights: true,
          bypassDnd: true,
        },
      };
      // Post to the service worker if it is already active, otherwise wait for it.
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage(payload);
      }
      navigator.serviceWorker.ready
        .then((reg) => {
          if (reg && reg.active) reg.active.postMessage(payload);
        })
        .catch(() => {});
    } catch (_e) {}
  }

  // Get or initialize AudioContext for audible alert chimes
  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      if (!this.audioCtx) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          this.audioCtx = new AudioContextClass();
        }
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }
      return this.audioCtx;
    } catch {
      return null;
    }
  }

  private wakeLockSentinel: any = null;

  // Request Screen Wake Lock so phone stays awake while driver is online or order arrives
  public async requestWakeLock() {
    if (typeof window === 'undefined' || !('wakeLock' in navigator)) return;
    try {
      if (!this.wakeLockSentinel) {
        this.wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
        this.wakeLockSentinel.addEventListener('release', () => {
          this.wakeLockSentinel = null;
        });
      }
    } catch (_e) {}
  }

  public releaseWakeLock() {
    try {
      if (this.wakeLockSentinel) {
        this.wakeLockSentinel.release().catch(() => {});
        this.wakeLockSentinel = null;
      }
    } catch (_e) {}
  }

  // CLEAR DUAL-TONE CHIME FOR NEW INCOMING ORDER (High-alert alarm chime with screen wake)
  public startEmergencyOrderRingtone() {
    if (this.isRingtonePlaying && this.ringtoneInterval) {
      return;
    }
    this.stopEmergencyOrderRingtone();
    this.isRingtonePlaying = true;
    this.requestWakeLock();
    try {
      const playPulse = () => {
        if (!this.isRingtonePlaying) return;
        const ctx = this.getAudioContext();
        if (!ctx) return;
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
        const now = ctx.currentTime;
        // Clean 3-tone ascending alert chime: F5 (698.46Hz) -> A5 (880Hz) -> C6 (1046.5Hz)
        const notes = [698.46, 880.0, 1046.5];
        notes.forEach((freq, idx) => {
          if (!this.isRingtonePlaying) return;
          try {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.11);

            gain.gain.setValueAtTime(0.001, now + idx * 0.11);
            gain.gain.exponentialRampToValueAtTime(0.35, now + idx * 0.11 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.11 + 0.25);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.onended = () => {
              const pos = this.activeOscillators.indexOf(osc);
              if (pos > -1) this.activeOscillators.splice(pos, 1);
            };

            this.activeOscillators.push(osc);
            osc.start(now + idx * 0.11);
            osc.stop(now + idx * 0.11 + 0.26);
          } catch (_e) {}
        });
      };

      playPulse();
      this.ringtoneInterval = setInterval(() => {
        if (!this.isRingtonePlaying) {
          this.stopEmergencyOrderRingtone();
          return;
        }
        playPulse();
        this.vibrateDevice([400, 150, 400]);
      }, 1600);
    } catch (_e) {}
  }

  // Instantly and completely stop all ringing, vibration, and oscillator audio nodes
  public stopEmergencyOrderRingtone() {
    this.isRingtonePlaying = false;
    if (this.ringtoneInterval) {
      clearInterval(this.ringtoneInterval);
      this.ringtoneInterval = null;
    }
    // Stop all active oscillators immediately
    if (this.activeOscillators && this.activeOscillators.length > 0) {
      this.activeOscillators.forEach((osc) => {
        try {
          osc.stop();
          osc.disconnect();
        } catch (_e) {}
      });
      this.activeOscillators = [];
    }
    // Stop vibration immediately
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(0);
      } catch (_e) {}
    }
  }

  // Custom high-priority sound alert synthesizers (Web Audio API)
  public playDriverAcceptedSound() {
    // Consolidated through SoundManager in utils/audio.ts to prevent duplicate sounds
  }

  public playDriverArrivedSound() {
    // Consolidated through SoundManager in utils/audio.ts to prevent duplicate sounds
  }

  public playMessageSound() {
    // Consolidated through SoundManager in utils/audio.ts to prevent duplicate sounds
  }

  // Register service worker for background & sleeping APK push notifications
  private async initServiceWorker() {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      this.swRegistration = reg;
    } catch (e) {
      console.warn('Service worker registration error:', e);
    }
  }

  // Request notification permissions
  public async requestPermission(): Promise<NotificationPermission> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }

    try {
      const perm = await Notification.requestPermission();
      this.permission = perm;
      return perm;
    } catch (e) {
      console.warn('Error requesting notification permission:', e);
      return 'denied';
    }
  }

  public getPermissionStatus(): NotificationPermission {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'denied';
    return Notification.permission;
  }

  // Trigger loud device vibration
  public vibrateDevice(pattern: number[] = [500, 100, 500, 100, 600]) {
    // Prefer native vibration: navigator.vibrate() is unreliable inside a WebView
    // and does nothing while the screen is locked.
    if (liveLocationService.isAvailable()) {
      liveLocationService
        .vibrate([0, ...pattern])
        .then((handled) => {
          if (handled) return;
          if (typeof window !== 'undefined' && 'vibrate' in navigator) {
            try {
              navigator.vibrate(pattern);
            } catch (_e) {}
          }
        })
        .catch(() => {});
      return;
    }
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (_e) {}
    }
  }

  // Notify passenger when driver accepts the trip request
  public async notifyRiderDriverAccepted(options: {
    driverName: string;
    vehicleModel?: string;
    licensePlate?: string;
    etaMins?: number;
  }) {
    this.playDriverAcceptedSound();
    this.vibrateDevice([300, 100, 300, 100, 500]);

    const title = '🚗 Darawalkii ayaa aqbalay safarkaaga!';
    const body = `${options.driverName} (${options.vehicleModel || 'Toyota Vitz'} • ${options.licensePlate || 'SL-Plate'}) wuxuu kuusoo socdaa goobtaada.${options.etaMins ? ` Qiyaastii ${options.etaMins} daqiiqo.` : ''}`;

    if (typeof window === 'undefined' || !('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      try {
        if (this.swRegistration && this.swRegistration.showNotification) {
          await this.swRegistration.showNotification(title, {
            body,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            vibrate: [300, 100, 300, 100, 500],
            tag: 'wadaage-driver-accepted',
            requireInteraction: true,
            data: { url: '/?app=rider' },
          } as any);
        } else {
          new Notification(title, {
            body,
            icon: '/favicon.ico',
            tag: 'wadaage-driver-accepted',
          } as any);
        }
      } catch (e) {
        console.warn('Failed to display native notification:', e);
      }
    }
  }

  // Notify passenger when driver has arrived
  public async notifyRiderDriverArrived(options: {
    driverName: string;
    licensePlate?: string;
  }) {
    this.playDriverArrivedSound();
    this.vibrateDevice([500, 150, 500, 150, 500]);

    const title = '📍 Darawalkaagu wuu soo gaadhay goobtaada!';
    const body = `${options.driverName} (${options.licensePlate || 'SL-Plate'}) wuxuu joogaa goobtaadii qaadashada. Fadlan u bax gaariga.`;

    if (typeof window === 'undefined' || !('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      try {
        if (this.swRegistration && this.swRegistration.showNotification) {
          await this.swRegistration.showNotification(title, {
            body,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            vibrate: [500, 150, 500, 150, 500],
            tag: 'wadaage-driver-arrived',
            requireInteraction: true,
            data: { url: '/?app=rider' },
          } as any);
        } else {
          new Notification(title, {
            body,
            icon: '/favicon.ico',
            tag: 'wadaage-driver-arrived',
          } as any);
        }
      } catch (e) {
        console.warn('Failed to display native notification:', e);
      }
    }
  }

  // Notify incoming order to driver (with clear chime ringtone & background push for sleeping APK)
  public async notifyIncomingOrder(options: {
    passengerName: string;
    pickupLocation: string;
    dropoffLocation: string;
    fareUsd: number;
    fareSos: number;
    categoryName?: string;
  }) {
    // Start continuous chime ringtone and wake up device screen
    this.startEmergencyOrderRingtone();
    this.vibrateDevice([800, 200, 800, 200, 1000, 200, 1000]);

    const title = '🚨 DALAB CUSUB! EMERGENCY RIDE ORDER';
    const body = `Rakaab: ${options.passengerName}\nKa: ${options.pickupLocation} ➔ Ku: ${options.dropoffLocation}\nQiimaha: $${options.fareUsd.toFixed(2)} (${options.fareSos.toLocaleString()} SLSH)`;

    if (typeof window === 'undefined' || !('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      try {
        const notifOptions: any = {
          body,
          icon: '/darwelllogo.png',
          badge: '/darwelllogo.png',
          image: '/darwelllogo.png',
          vibrate: [800, 200, 800, 200, 1000, 200, 1000],
          tag: 'wadaage-order-urgent-' + Date.now(),
          requireInteraction: true,
          renotify: true,
          silent: false,
          // Android: MAX-importance channel so a locked phone still rings loudly.
          channelId: 'wadaage-orders-urgent',
          data: { url: '/driver' },
          actions: [
            { action: 'open_order', title: '🚖 Fur Dalabka (Open)' },
            { action: 'dismiss', title: 'Xidh (Dismiss)' }
          ]
        };

        if (this.swRegistration && this.swRegistration.showNotification) {
          await this.swRegistration.showNotification(title, notifOptions);
        } else {
          new Notification(title, notifOptions);
        }
      } catch (e) {
        console.warn('Failed to display native notification:', e);
      }
    }
  }

  // Notify incoming chat message for both Rider & Driver
  public async notifyNewChatMessage(senderName: string, messageText: string, targetApp: 'driver' | 'rider' = 'rider') {
    this.playMessageSound();
    this.vibrateDevice([200, 80, 200]);

    const title = `💬 Fariin Cusub: ${senderName}`;
    const body = messageText;

    if (typeof window === 'undefined' || !('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      try {
        if (this.swRegistration && this.swRegistration.showNotification) {
          await this.swRegistration.showNotification(title, {
            body,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            vibrate: [200, 80, 200],
            tag: 'wadaage-chat-' + Date.now(),
            data: { url: `/?app=${targetApp}` },
          } as any);
        } else {
          new Notification(title, {
            body,
            icon: '/favicon.ico',
            tag: 'wadaage-chat-' + Date.now(),
          } as any);
        }
      } catch (e) {
        console.warn('Failed to display message notification:', e);
      }
    }
  }

  // General Driver Notification
  public async notifyDriver(title: string, body: string) {
    this.vibrateDevice([200, 100, 200]);
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      try {
        if (this.swRegistration && this.swRegistration.showNotification) {
          await this.swRegistration.showNotification(title, {
            body,
            icon: '/favicon.ico',
            tag: 'wadaage-notice-' + Date.now(),
            data: { url: '/?app=driver' },
          });
        } else {
          new Notification(title, { body, icon: '/favicon.ico' });
        }
      } catch (_e) {}
    }
  }
}

export const notificationService = new NotificationService();
