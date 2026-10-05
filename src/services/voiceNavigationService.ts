/**
 * Voice Navigation & Turn-by-Turn Speech Service using Web Speech API (window.speechSynthesis)
 */

class VoiceNavigationService {
  private isMuted: boolean = false;
  private lastSpokenText: string = '';
  private lastSpokenTime: number = 0;

  constructor() {
    // Check localStorage preference
    const saved = localStorage.getItem('wadaage_voice_muted');
    if (saved !== null) {
      this.isMuted = saved === 'true';
    }
  }

  public isVoiceMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    localStorage.setItem('wadaage_voice_muted', String(this.isMuted));
    if (this.isMuted && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    return this.isMuted;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    localStorage.setItem('wadaage_voice_muted', String(muted));
    if (muted && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  public speak(text: string, lang: 'so' | 'en' = 'so', force: boolean = false): void {
    if (this.isMuted) return;
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    // Deduplicate same message spoken within 8 seconds unless forced
    const now = Date.now();
    if (!force && text === this.lastSpokenText && now - this.lastSpokenTime < 8000) {
      return;
    }

    try {
      window.speechSynthesis.cancel(); // Stop current speech
      const utterance = new SpeechSynthesisUtterance(text);

      // Attempt language selection
      utterance.lang = lang === 'so' ? 'so-SO' : 'en-US';
      utterance.rate = 0.95; // Slightly slower for clarity
      utterance.pitch = 1.0;

      this.lastSpokenText = text;
      this.lastSpokenTime = now;

      window.speechSynthesis.speak(utterance);
    } catch (_e) {
      // SpeechSynthesis fallback ignoring errors
    }
  }

  public stop(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

export const voiceNavigationService = new VoiceNavigationService();
