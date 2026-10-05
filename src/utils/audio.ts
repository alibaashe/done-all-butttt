// Subtle Web Audio API Synthesizer for Ride Sound Effects

class SoundManager {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;
  private lastPlayed: Record<string, number> = {};

  constructor() {
    // AudioContext will be initialized on first user interaction
  }

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  public isEnabled(): boolean {
    return this.soundEnabled;
  }

  // Soft tactile button click sound for smooth UI interaction
  public playButtonClick() {
    if (!this.soundEnabled) return;
    const nowMs = Date.now();
    if (nowMs - (this.lastPlayed['click'] || 0) < 120) return;
    this.lastPlayed['click'] = nowMs;

    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(720, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.04);

      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.045);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch {
      // Audio context suppressed
    }
  }

  // Incoming ride request ping (Two-tone alert)
  public playIncomingPing() {
    if (!this.soundEnabled) return;
    const nowMs = Date.now();
    if (nowMs - (this.lastPlayed['incoming'] || 0) < 800) return;
    this.lastPlayed['incoming'] = nowMs;

    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc1 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, this.ctx.currentTime); // D5
      osc1.frequency.setValueAtTime(880.00, this.ctx.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);

      osc1.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start();
      osc1.stop(this.ctx.currentTime + 0.35);
    } catch {
      // Audio context suppressed
    }
  }

  // Ride accepted chime (Uplifting major triad - debounced to prevent repeating)
  public playAcceptedChime() {
    if (!this.soundEnabled) return;
    const nowMs = Date.now();
    if (nowMs - (this.lastPlayed['accepted'] || 0) < 1400) return;
    this.lastPlayed['accepted'] = nowMs;

    this.initCtx();
    if (!this.ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.08);

        gain.gain.setValueAtTime(0.12, this.ctx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.08 + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(this.ctx.currentTime + idx * 0.08);
        osc.stop(this.ctx.currentTime + idx * 0.08 + 0.3);
      });
    } catch {
      // Ignore
    }
  }

  // Ride arrival or completion victory chime
  public playCompletedSound() {
    if (!this.soundEnabled) return;
    const nowMs = Date.now();
    if (nowMs - (this.lastPlayed['completed'] || 0) < 1400) return;
    this.lastPlayed['completed'] = nowMs;

    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(659.25, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1046.50, this.ctx.currentTime + 0.2);

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.5);
    } catch {
      // Ignore
    }
  }

  // Chat message pop sound for incoming messages
  public playMessageSound() {
    if (!this.soundEnabled) return;
    const nowMs = Date.now();
    if (nowMs - (this.lastPlayed['message'] || 0) < 400) return;
    this.lastPlayed['message'] = nowMs;

    this.initCtx();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch {
      // Ignore
    }
  }

  public stopAll() {
    try {
      if (this.ctx && this.ctx.state === 'running') {
        this.ctx.suspend().catch(() => {});
      }
    } catch (_e) {}
  }
}

export const sounds = new SoundManager();
