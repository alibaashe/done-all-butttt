/**
 * Wadaage Driver - native live location bridge.
 *
 * Android freezes a backgrounded WebView, which stops `navigator.geolocation`
 * from delivering fixes and pauses the digital taximeter the moment the driver
 * locks the screen. This module talks to the native `LiveLocation` plugin
 * (LiveLocationService.java), which:
 *
 *   1. Keeps a real GPS stream running while the phone is locked / backgrounded.
 *   2. Keeps the app process alive so the incoming-order ringtone can still play.
 *   3. Forwards every fix back here as a "location" event.
 *
 * Everything degrades safely: on the web, on iOS, or if the native plugin is
 * missing, `isAvailable()` returns false and the app keeps using the WebView
 * geolocation it already had.
 */

import { registerPlugin, Capacitor } from '@capacitor/core';

export interface NativeLocationFix {
  latitude: number;
  longitude: number;
  accuracy: number;
  speed: number;
  bearing: number;
  time: number;
  source?: string;
}

interface LiveLocationPluginApi {
  checkPermissions(): Promise<{
    location?: string;
    backgroundLocation?: string;
    notifications?: string;
  }>;
  requestLocationPermission(): Promise<{ location?: string }>;
  requestBackgroundPermission(): Promise<{ backgroundLocation?: string; reason?: string }>;
  requestNotificationPermission(): Promise<{ notifications?: string }>;
  start(options: {
    intervalMs?: number;
    distanceFilterM?: number;
    title?: string;
    text?: string;
  }): Promise<{ running: boolean }>;
  stop(): Promise<{ running: boolean }>;
  isRunning(): Promise<{ running: boolean }>;
  vibrate(options?: { pattern?: number[] }): Promise<void>;
  cancelVibration(): Promise<void>;
  addListener(
    eventName: 'location',
    listenerFunc: (fix: NativeLocationFix) => void
  ): Promise<{ remove: () => Promise<void> }>;
}

const LiveLocation = registerPlugin<LiveLocationPluginApi>('LiveLocation');

type FixHandler = (fix: NativeLocationFix) => void;

class LiveLocationService {
  private listenerHandle: { remove: () => Promise<void> } | null = null;
  private handlers = new Set<FixHandler>();
  private running = false;
  private hasBackground = false;

  /** True only inside the native Android driver app where the plugin is registered. */
  public isAvailable(): boolean {
    try {
      if (!Capacitor.isNativePlatform()) return false;
      return Capacitor.getPlatform() === 'android';
    } catch {
      return false;
    }
  }

  /** Subscribe to native fixes. Returns an unsubscribe function. */
  public onFix(handler: FixHandler): () => void {
    this.handlers.add(handler);
    this.ensureBridgeListener();
    return () => {
      this.handlers.delete(handler);
    };
  }

  private ensureBridgeListener() {
    if (this.listenerHandle || !this.isAvailable()) return;
    try {
      LiveLocation.addListener('location', (fix) => {
        if (!fix || typeof fix.latitude !== 'number' || typeof fix.longitude !== 'number') return;
        this.handlers.forEach((handler) => {
          try {
            handler(fix);
          } catch (_e) {}
        });
      })
        .then((handle) => {
          this.listenerHandle = handle;
        })
        .catch(() => {
          this.listenerHandle = null;
        });
    } catch (_e) {
      this.listenerHandle = null;
    }
  }

  public async getPermissionState() {
    if (!this.isAvailable()) {
      return { location: 'unavailable', backgroundLocation: 'unavailable', notifications: 'unavailable' };
    }
    try {
      return await LiveLocation.checkPermissions();
    } catch {
      return { location: 'prompt', backgroundLocation: 'prompt', notifications: 'prompt' };
    }
  }

  /**
   * Full first-run permission flow, in the order Android demands:
   *   1. Foreground location ("while using the app")
   *   2. Notifications (Android 13+) so the ongoing trip notice can appear
   *   3. Background location ("allow all the time") - only after step 1
   */
  public async requestAllPermissions(): Promise<{
    location: string;
    backgroundLocation: string;
    notifications: string;
  }> {
    const result = { location: 'prompt', backgroundLocation: 'prompt', notifications: 'prompt' };
    if (!this.isAvailable()) return result;

    try {
      const loc = await LiveLocation.requestLocationPermission();
      result.location = loc?.location || 'prompt';
    } catch (_e) {}

    try {
      const note = await LiveLocation.requestNotificationPermission();
      result.notifications = note?.notifications || 'prompt';
    } catch (_e) {}

    // Background location is a separate, second dialog on Android 11+.
    if (result.location === 'granted') {
      try {
        const bg = await LiveLocation.requestBackgroundPermission();
        result.backgroundLocation = bg?.backgroundLocation || 'prompt';
      } catch (_e) {}
    }

    this.hasBackground = result.backgroundLocation === 'granted';
    return result;
  }

  /**
   * Start the foreground service so GPS survives screen lock.
   * Safe to call repeatedly; a second call is a no-op while already running.
   */
  public async start(options?: {
    intervalMs?: number;
    distanceFilterM?: number;
    title?: string;
    text?: string;
  }): Promise<boolean> {
    if (!this.isAvailable()) return false;
    this.ensureBridgeListener();

    if (this.running) {
      try {
        const state = await LiveLocation.isRunning();
        if (state?.running) return true;
      } catch (_e) {}
    }

    try {
      const res = await LiveLocation.start({
        intervalMs: options?.intervalMs ?? 5000,
        distanceFilterM: options?.distanceFilterM ?? 10,
        title: options?.title ?? 'Wadaage Driver',
        text: options?.text ?? 'Taximeter is running — your trip is being recorded',
      });
      this.running = !!res?.running;
      return this.running;
    } catch (e) {
      console.warn('[LiveLocation] start failed:', e);
      this.running = false;
      return false;
    }
  }

  public async stop(): Promise<void> {
    if (!this.isAvailable()) return;
    try {
      await LiveLocation.stop();
    } catch (_e) {}
    this.running = false;
  }

  public async isRunning(): Promise<boolean> {
    if (!this.isAvailable()) return false;
    try {
      const res = await LiveLocation.isRunning();
      this.running = !!res?.running;
      return this.running;
    } catch {
      return false;
    }
  }

  /** True when the driver granted "allow all the time" during this session. */
  public hasBackgroundPermission(): boolean {
    return this.hasBackground;
  }

  /**
   * Native vibration. WebView `navigator.vibrate()` is unreliable and does
   * nothing once the screen is locked - exactly when a driver needs to feel a
   * new order. Returns false when the native path was unavailable so the caller
   * can fall back to the web API.
   */
  public async vibrate(pattern: number[] = [0, 800, 200, 800, 200, 1000, 200, 1000]): Promise<boolean> {
    if (!this.isAvailable()) return false;
    try {
      await LiveLocation.vibrate({ pattern });
      return true;
    } catch {
      return false;
    }
  }

  public async cancelVibration(): Promise<void> {
    if (!this.isAvailable()) return;
    try {
      await LiveLocation.cancelVibration();
    } catch (_e) {}
  }
}

export const liveLocationService = new LiveLocationService();
