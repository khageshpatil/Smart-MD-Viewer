/**
 * React hook for voice state management
 * Handles voice capture, transcription, and state
 */

import { useState, useCallback, useRef } from "react";
import {
  recognizeSpeech,
  isSpeechRecognitionAvailable,
  requestMicrophonePermission,
} from "@/lib/voice";

export interface UseVoiceReturn {
  isRecording: boolean;
  isAvailable: boolean;
  transcript: string | null;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => void;
  clearTranscript: () => void;
}

export const useVoice = (): UseVoiceReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recognitionAbortController = useRef<AbortController | null>(null);

  const isAvailable = isSpeechRecognitionAvailable();

  const startRecording = useCallback(async () => {
    if (!isAvailable) {
      setError("Speech recognition is not available in this browser");
      return;
    }

    // Request microphone permission
    const hasPermission = await requestMicrophonePermission();
    if (!hasPermission) {
      setError("Microphone permission denied. Please allow microphone access.");
      return;
    }

    setIsRecording(true);
    setError(null);
    setTranscript(null);

    // Create abort controller for cancellation
    const abortController = new AbortController();
    recognitionAbortController.current = abortController;

    try {
      const text = await recognizeSpeech();
      
      // Check if operation was aborted
      if (abortController.signal.aborted) {
        return;
      }

      setTranscript(text);
    } catch (err) {
      if (abortController.signal.aborted) {
        return;
      }

      const errorMessage =
        err instanceof Error ? err.message : "Failed to recognize speech";
      setError(errorMessage);
    } finally {
      if (!abortController.signal.aborted) {
        setIsRecording(false);
      }
    }
  }, [isAvailable]);

  const stopRecording = useCallback(() => {
    if (recognitionAbortController.current) {
      recognitionAbortController.current.abort();
      recognitionAbortController.current = null;
    }
    setIsRecording(false);
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscript(null);
    setError(null);
  }, []);

  return {
    isRecording,
    isAvailable,
    transcript,
    error,
    startRecording,
    stopRecording,
    clearTranscript,
  };
};



