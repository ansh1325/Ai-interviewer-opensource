'use client';

export class SpeechSynthesisController {
  private isSpeakingState: boolean = false;
  private onStateChangeCallback: ((speaking: boolean) => void) | null = null;
  private preferredVoice: SpeechSynthesisVoice | null = null;
  private rate: number = 1.0;
  private pitch: number = 1.0;
  private isMuted: boolean = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.initVoices();
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = () => this.initVoices();
      }
    }
  }

  private initVoices() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const voices = window.speechSynthesis.getVoices();
    // Prefer natural English voices
    const naturalVoice = voices.find(v => 
      v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha'))
    ) || voices.find(v => v.lang.startsWith('en')) || voices[0];

    if (naturalVoice) {
      this.preferredVoice = naturalVoice;
    }
  }

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
      this.cancel();
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public speak(
    text: string,
    onStart?: () => void,
    onEnd?: () => void,
    onStateChange?: (speaking: boolean) => void
  ) {
    if (this.isMuted || !this.isSupported()) {
      onEnd?.();
      return;
    }

    this.cancel();

    // Remove markdown symbols and code snippets from audio speech so it sounds natural
    const cleanText = text
      .replace(/```[\s\S]*?```/g, 'Code sample provided on screen.')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/[#*_~>]/g, '')
      .replace(/\n+/g, ' ')
      .trim();

    if (!cleanText) {
      onEnd?.();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    if (this.preferredVoice) {
      utterance.voice = this.preferredVoice;
    }
    utterance.rate = this.rate;
    utterance.pitch = this.pitch;

    utterance.onstart = () => {
      this.isSpeakingState = true;
      this.onStateChangeCallback?.(true);
      onStart?.();
      onStateChange?.(true);
    };

    utterance.onend = () => {
      this.isSpeakingState = false;
      this.onStateChangeCallback?.(false);
      onEnd?.();
      onStateChange?.(false);
    };

    utterance.onerror = () => {
      this.isSpeakingState = false;
      this.onStateChangeCallback?.(false);
      onEnd?.();
      onStateChange?.(false);
    };

    window.speechSynthesis.speak(utterance);
  }

  public cancel() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      this.isSpeakingState = false;
      this.onStateChangeCallback?.(false);
    }
  }

  public isSpeaking(): boolean {
    return this.isSpeakingState;
  }
}
