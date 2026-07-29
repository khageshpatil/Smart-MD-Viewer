/**
 * Text-to-Speech utilities
 * Handles speaking text using Web Speech API
 */

let currentUtterance: SpeechSynthesisUtterance | null = null;

/**
 * Check if speech synthesis is available
 */
export function isSpeechSynthesisAvailable(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

/**
 * Speak text using Web Speech API
 */
export function speakText(text: string, options?: {
  rate?: number;
  pitch?: number;
  volume?: number;
  voice?: SpeechSynthesisVoice;
}): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!isSpeechSynthesisAvailable()) {
      reject(new Error("Speech synthesis is not available in this browser"));
      return;
    }

    // Stop any current speech
    stopSpeaking();

    const utterance = new SpeechSynthesisUtterance(text);
    currentUtterance = utterance;

    // Set options
    utterance.rate = options?.rate ?? 1.0;
    utterance.pitch = options?.pitch ?? 1.0;
    utterance.volume = options?.volume ?? 1.0;
    
    if (options?.voice) {
      utterance.voice = options.voice;
    }

    utterance.onend = () => {
      currentUtterance = null;
      resolve();
    };

    utterance.onerror = (event) => {
      currentUtterance = null;
      reject(new Error(`Speech synthesis error: ${event.error}`));
    };

    window.speechSynthesis.speak(utterance);
  });
}

/**
 * Stop current speech
 */
export function stopSpeaking(): void {
  if (isSpeechSynthesisAvailable()) {
    window.speechSynthesis.cancel();
    currentUtterance = null;
  }
}

/**
 * Check if currently speaking
 */
export function isSpeaking(): boolean {
  return isSpeechSynthesisAvailable() && window.speechSynthesis.speaking;
}

/**
 * Get available voices
 */
export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (!isSpeechSynthesisAvailable()) {
    return [];
  }
  return window.speechSynthesis.getVoices();
}

/**
 * Wait for voices to load
 */
export function waitForVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (!isSpeechSynthesisAvailable()) {
      resolve([]);
      return;
    }

    const voices = getAvailableVoices();
    if (voices.length > 0) {
      resolve(voices);
      return;
    }

    // Wait for voices to load
    const checkVoices = () => {
      const loadedVoices = getAvailableVoices();
      if (loadedVoices.length > 0) {
        resolve(loadedVoices);
      } else {
        setTimeout(checkVoices, 100);
      }
    };

    window.speechSynthesis.onvoiceschanged = () => {
      resolve(getAvailableVoices());
    };

    checkVoices();
  });
}

