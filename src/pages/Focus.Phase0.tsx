/**
 * PHASE 0: Voice Spine
 * Minimal voice loop implementation showing state machine in action
 * No planning, no projects, no tasks - just speak → think → respond
 */

import { Mic, Square, AlertCircle } from 'lucide-react';
import { useSpokenLoopStore } from '@/store/spokenLoopStore';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const Focus = () => {
  // ══════════════════════════════════════════════════════════
  // PHASE 0: Single source of truth - Zustand store
  // ══════════════════════════════════════════════════════════
  const { state, transcript, aiResponse, error, isActive, startListening, interrupt, reset } =
    useSpokenLoopStore();

  // ══════════════════════════════════════════════════════════
  // PHASE 0: Get visual state representation
  // ══════════════════════════════════════════════════════════
  const getStateDisplay = () => {
    switch (state.type) {
      case 'idle':
        return { label: 'Ready', color: 'text-gray-600', icon: Mic };
      case 'listening':
        return { label: 'Listening...', color: 'text-red-600', icon: Mic };
      case 'thinking':
        return { label: 'Thinking...', color: 'text-blue-600', icon: AlertCircle };
      case 'speaking':
        return { label: 'Speaking...', color: 'text-green-600', icon: AlertCircle };
      case 'interrupted':
        return { label: 'Interrupted', color: 'text-orange-600', icon: Square };
      case 'error':
        return { label: 'Error', color: 'text-red-600', icon: AlertCircle };
      default:
        return { label: 'Unknown', color: 'text-gray-600', icon: AlertCircle };
    }
  };

  const { label: stateLabel, color: stateColor, icon: StateIcon } = getStateDisplay();

  // ══════════════════════════════════════════════════════════
  // PHASE 0: UI - Minimal voice loop interface
  // ══════════════════════════════════════════════════════════
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8">
      <div className="max-w-2xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">CORTEX</h1>
          <p className="text-muted-foreground">Phase 0: Voice Spine</p>
        </div>

        {/* Voice State Display */}
        <div className="bg-card border border-border rounded-lg p-8 space-y-6">
          {/* State Indicator */}
          <div className="flex items-center justify-center gap-3">
            <StateIcon className={`w-6 h-6 ${stateColor}`} />
            <span className={`text-2xl font-semibold ${stateColor}`}>{stateLabel}</span>
          </div>

          {/* Transcript Display */}
          {transcript && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">You said:</h3>
              <p className="text-lg bg-muted/50 rounded p-4">{transcript}</p>
            </div>
          )}

          {/* AI Response Display */}
          {aiResponse && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">AI Response:</h3>
              <p className="text-lg bg-muted/50 rounded p-4">{aiResponse}</p>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Controls */}
          <div className="flex items-center justify-center gap-4 pt-4">
            {!isActive ? (
              <Button size="lg" onClick={startListening} className="gap-2">
                <Mic className="w-5 h-5" />
                Start Listening
              </Button>
            ) : (
              <Button size="lg" variant="destructive" onClick={interrupt} className="gap-2">
                <Square className="w-5 h-5" />
                Interrupt
              </Button>
            )}

            {error && (
              <Button size="lg" variant="outline" onClick={reset}>
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="text-center text-sm text-muted-foreground space-y-2">
          <p>Click "Start Listening" to begin the voice loop.</p>
          <p>The system will listen → think → speak.</p>
          <p>You can interrupt at any time.</p>
        </div>
      </div>
    </div>
  );
};

export default Focus;
