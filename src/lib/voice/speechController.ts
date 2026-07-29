/**
 * Speech Controller
 * Unified speech I/O control for Voice Spine (Phase 0)
 * Wraps browser Speech Recognition and Speech Synthesis APIs
 */

export class SpeechController {
  private recognition: SpeechRecognition | null = null;
  private synthesis: SpeechSynthesis;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isListening = false;
  private isSpeaking = false;

  constructor() {
    this.synthesis = window.speechSynthesis;
  }

  /**
   * Start listening for user speech
   * Returns the transcript when recognition completes
   */
  async startListening(): Promise<string> {
    if (this.isListening) {
      throw new Error('Already listening');
    }

    // Request microphone permission
    const hasPermission = await this.requestMicrophonePermission();
    if (!hasPermission) {
      throw new Error('Microphone permission denied');
    }

    return new Promise((resolve, reject) => {
      const SpeechRecognitionClass = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (!SpeechRecognitionClass) {
        reject(new Error('Speech recognition not supported in this browser'));
        return;
      }

      this.recognition = new SpeechRecognitionClass();
      this.recognition.lang = 'en-US';
      this.recognition.continuous = false; // Stop after one phrase
      this.recognition.interimResults = false;

      this.recognition.onstart = () => {
        this.isListening = true;
      };

      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        this.isListening = false;
        resolve(transcript);
      };

      this.recognition.onerror = (event) => {
        this.isListening = false;
        reject(new Error(`Speech recognition error: ${event.error}`));
      };

      this.recognition.onend = () => {
        this.isListening = false;
      };

      this.recognition.start();
    });
  }

  /**
   * Stop listening (cancel recognition)
   */
  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.recognition = null;
      this.isListening = false;
    }
  }

  /**
   * Speak text using speech synthesis
   */
  async speak(text: string): Promise<void> {
    if (this.isSpeaking) {
      // Stop previous speech first
      this.stopSpeaking();
    }

    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      this.currentUtterance = utterance;

      utterance.onstart = () => {
        this.isSpeaking = true;
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        this.currentUtterance = null;
        resolve();
      };

      utterance.onerror = (event) => {
        this.isSpeaking = false;
        this.currentUtterance = null;
        reject(new Error(`Speech synthesis error: ${event.error}`));
      };

      // Configure voice settings
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      this.synthesis.speak(utterance);
    });
  }

  /**
   * Stop speaking immediately
   */
  stopSpeaking(): void {
    if (this.synthesis.speaking) {
      this.synthesis.cancel(); // Immediate stop
      this.currentUtterance = null;
      this.isSpeaking = false;
    }
  }

  /**
   * Interrupt everything - stops both listening and speaking
   */
  interrupt(): void {
    this.stopListening();
    this.stopSpeaking();
  }

  /**
   * Check if speech recognition is available
   */
  isAvailable(): boolean {
    return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  }

  /**
   * Request microphone permission
   */
  private async requestMicrophonePermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop()); // Release immediately
      return true;
    } catch (error) {
      return false;
    }
  }
}
