/**
 * VoiceButton Component
 * Push-to-talk button for voice commands
 */

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { useVoice } from "@/hooks/useVoice";
import { useGlobalHotkey } from "@/hooks/useGlobalHotkey";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface VoiceButtonProps {
  onTranscript?: (text: string) => void;
  onError?: (error: string) => void;
  className?: string;
  disabled?: boolean;
}

export const VoiceButton = ({
  onTranscript,
  onError,
  className,
  disabled = false,
}: VoiceButtonProps) => {
  const {
    isRecording,
    isAvailable,
    transcript,
    error,
    startRecording,
    stopRecording,
    clearTranscript,
  } = useVoice();

  // Trigger voice on hotkey
  useGlobalHotkey({
    onTrigger: () => {
      if (isRecording) {
        stopRecording();
      } else {
        startRecording();
      }
    },
    enabled: isAvailable,
  });

  // Handle transcript updates
  useEffect(() => {
    if (transcript && onTranscript) {
      onTranscript(transcript);
      clearTranscript();
    }
  }, [transcript, onTranscript, clearTranscript]);

  // Handle errors
  useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  if (!isAvailable) {
    return null; // Don't show button if voice is not available
  }

  const handleClick = () => {
    if (disabled) return;
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Determine button state
  const isDisabled = !isAvailable || disabled;
  const buttonText = disabled 
    ? "Processing..." 
    : isRecording 
    ? "Listening..." 
    : "Voice";
  
  const buttonIcon = disabled ? (
    <Loader2 className="w-4 h-4 animate-spin mr-2" />
  ) : isRecording ? (
    <Loader2 className="w-4 h-4 animate-spin mr-2" />
  ) : (
    <Mic className="w-4 h-4 mr-2" />
  );

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClick}
            className={`relative ${className || ""} ${isRecording ? "animate-pulse" : ""}`}
            disabled={isDisabled}
            title={disabled ? "Processing..." : isRecording ? "Stop recording (Ctrl+Space)" : "Start voice command (Ctrl+Space)"}
          >
            {buttonIcon}
            <span className="hidden sm:inline">{buttonText}</span>
            {isRecording && !disabled && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {disabled 
              ? "Processing command..." 
              : isRecording 
              ? "Click to stop (Ctrl+Space)" 
              : "Click to start voice command (Ctrl+Space)"}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};



