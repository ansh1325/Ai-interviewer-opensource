'use client';

// Declare types for Web Speech API
interface IWindow extends Window {
  webkitSpeechRecognition?: any;
  SpeechRecognition?: any;
}

export class SpeechRecognitionController {
  private recognition: any = null;
  private isListening: boolean = false;
  private onTranscriptCallback: ((transcript: string, isFinal: boolean) => void) | null = null;
  private onErrorCallback: ((error: string) => void) | null = null;
  private onStateChangeCallback: ((isListening: boolean) => void) | null = null;
  private accumulatedFinalTranscript: string = '';

  constructor() {
    if (typeof window === 'undefined') return;

    const win = window as unknown as IWindow;
    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (SpeechRecognitionClass) {
      try {
        this.recognition = new SpeechRecognitionClass();
        this.recognition.continuous = true;
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';

        this.recognition.onresult = (event: any) => {
          let interimTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              this.accumulatedFinalTranscript += (this.accumulatedFinalTranscript ? ' ' : '') + transcript.trim();
            } else {
              interimTranscript += transcript;
            }
          }

          const combined = (this.accumulatedFinalTranscript + (interimTranscript ? ' ' + interimTranscript : '')).trim();
          if (this.onTranscriptCallback) {
            this.onTranscriptCallback(combined, !interimTranscript);
          }
        };

        this.recognition.onerror = (event: any) => {
          console.warn('[SpeechRecognition] Error:', event.error);
          if (event.error === 'no-speech') return; // Expected when candidate is thinking
          if (this.onErrorCallback) {
            this.onErrorCallback(event.error);
          }
        };

        this.recognition.onend = () => {
          // If still marked as listening, auto-restart (handles browser timeouts during pauses)
          if (this.isListening) {
            try {
              this.recognition.start();
            } catch {
              this.isListening = false;
              this.onStateChangeCallback?.(false);
            }
          } else {
            this.onStateChangeCallback?.(false);
          }
        };
      } catch (err) {
        console.warn('[SpeechRecognition] Initialization failed:', err);
      }
    }
  }

  public isSupported(): boolean {
    return !!this.recognition;
  }

  public start(
    initialText: string = '',
    onTranscript: (transcript: string, isFinal: boolean) => void,
    onStateChange: (isListening: boolean) => void,
    onError?: (error: string) => void
  ) {
    if (!this.recognition) {
      onError?.('Speech recognition is not supported in this browser. Please use Google Chrome, Edge, or text input.');
      return;
    }

    this.accumulatedFinalTranscript = initialText;
    this.onTranscriptCallback = onTranscript;
    this.onStateChangeCallback = onStateChange;
    this.onErrorCallback = onError || null;
    this.isListening = true;

    try {
      this.recognition.start();
      this.onStateChangeCallback(true);
    } catch {
      // If already started, ignore error
      this.onStateChangeCallback(true);
    }
  }

  public stop() {
    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        // Ignored
      }
    }
    this.onStateChangeCallback?.(false);
  }

  public reset(newText: string = '') {
    this.accumulatedFinalTranscript = newText;
  }
}
