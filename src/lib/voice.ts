/**
 * Voice Capture and Speech-to-Text
 * Handles browser voice APIs for push-to-talk functionality
 */

export interface VoiceRecognitionResult {
  text: string;
  confidence: number;
}

export interface VoiceRecognitionError {
  error: string;
  message: string;
}

/**
 * Check if speech recognition is available in the browser
 */
export function isSpeechRecognitionAvailable(): boolean {
  return (
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
  );
}

/**
 * Get the SpeechRecognition constructor (with vendor prefix fallback)
 */
function getSpeechRecognition(): typeof SpeechRecognition | typeof webkitSpeechRecognition | null {
  if (typeof window === "undefined") return null;

  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

  return SpeechRecognition || null;
}

/**
 * Create a new speech recognition instance
 */
export function createSpeechRecognition(): SpeechRecognition | null {
  const SpeechRecognitionClass = getSpeechRecognition();
  if (!SpeechRecognitionClass) return null;

  const recognition = new SpeechRecognitionClass();
  recognition.continuous = false; // Single utterance
  recognition.interimResults = false; // Only final results
  recognition.lang = "en-US"; // Default to English

  return recognition;
}

/**
 * Start voice recognition and return transcribed text
 * Returns a promise that resolves with the transcribed text or rejects with an error
 */
export function recognizeSpeech(): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!isSpeechRecognitionAvailable()) {
      reject(new Error("Speech recognition is not available in this browser"));
      return;
    }

    const recognition = createSpeechRecognition();
    if (!recognition) {
      reject(new Error("Failed to create speech recognition instance"));
      return;
    }

    let finalTranscript = "";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[event.results.length - 1];
      if (result.isFinal) {
        finalTranscript = result[0].transcript.trim();
      }
    };

    recognition.onend = () => {
      if (finalTranscript) {
        resolve(finalTranscript);
      } else {
        reject(new Error("No speech detected"));
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      let errorMessage = "Speech recognition error";
      
      switch (event.error) {
        case "no-speech":
          errorMessage = "No speech detected. Please try again.";
          break;
        case "audio-capture":
          errorMessage = "Microphone not found or not accessible.";
          break;
        case "not-allowed":
          errorMessage = "Microphone permission denied.";
          break;
        case "network":
          errorMessage = "Network error occurred.";
          break;
        case "aborted":
          errorMessage = "Speech recognition aborted.";
          break;
        default:
          errorMessage = `Speech recognition error: ${event.error}`;
      }

      reject(new Error(errorMessage));
    };

    recognition.onstart = () => {
      // Recognition started successfully
    };

    try {
      recognition.start();
    } catch (error) {
      reject(
        error instanceof Error
          ? error
          : new Error("Failed to start speech recognition")
      );
    }
  });
}

/**
 * Request microphone permission
 * Returns true if permission is granted or already available
 */
export async function requestMicrophonePermission(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    // Stop the stream immediately - we just needed permission
    stream.getTracks().forEach((track) => track.stop());
    return true;
  } catch (error) {
    console.error("Microphone permission denied:", error);
    return false;
  }
}



