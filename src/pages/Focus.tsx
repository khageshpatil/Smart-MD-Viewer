/**
 * PHASE Ω: CORTEX Execution Console
 * 
 * System console, not a page.
 * Reflects current mode truthfully.
 * Shows: Mode, Current project (if any), Execution state, Artifacts count.
 * 
 * NO clutter. NO history dump. NO editing.
 * UI reacts to mode. Logic drives UI.
 * 
 * PHASE Ω FINAL — DO NOT EXTEND WITHOUT DESIGN REVIEW
 */

import { Mic, Square, Loader2, Play, XCircle, CheckCircle2, Pause, FileText } from 'lucide-react';
import { useSpokenLoopStore } from '@/store/spokenLoopStore';
import { useCortexMode, getModeDescription, useSetCortexMode } from '@/store/useCortexState';
import { useArtifactSummary } from '@/lib/cortex/artifactIndex';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useEffect } from 'react';

const Focus = () => {
  // ══════════════════════════════════════════════════════════
  // PHASE Ω: Core State
  // ══════════════════════════════════════════════════════════
  const mode = useCortexMode();
  const setMode = useSetCortexMode(); // Stable action reference
  const { summary: artifactSummary, loading: loadingArtifacts, refresh: refreshArtifacts } = useArtifactSummary();

  // ══════════════════════════════════════════════════════════
  // Voice & Execution State
  // ══════════════════════════════════════════════════════════
  const {
    state: voiceState,
    transcript,
    error: voiceError,
    isActive,
    startListening,
    interrupt,
    reset,
  } = useSpokenLoopStore();

  const {
    planningDraft,
    planningDraftStatus,
    synthesizePlanningDraft,
    executionProgress,
    executionLog,
    createdProject,
    executePlan,
    abortExecution,
    clearExecution,
  } = useSpokenLoopStore();

  // ══════════════════════════════════════════════════════════
  // PHASE Ω: MODE SYNC
  // Sync CortexMode with store state
  // Note: setMode is stable and omitted from deps to prevent infinite loop
  // ══════════════════════════════════════════════════════════
  useEffect(() => {
    // Determine mode based on current state
    if (executionProgress?.status === 'executing') {
      setMode('executing', 'Execution in progress');
    } else if (planningDraftStatus === 'synthesizing') {
      setMode('drafting', 'Synthesizing draft');
    } else if (planningDraft && planningDraftStatus === 'ready') {
      setMode('ready-to-plan', 'Draft ready');
    } else if (isActive) {
      setMode('conversing', 'Voice active');
    } else if (executionProgress?.status === 'completed' || createdProject) {
      setMode('reviewing-artifacts', 'Viewing results');
    } else {
      setMode('idle', 'Ready');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, planningDraftStatus, planningDraft, executionProgress, createdProject]);

  // ══════════════════════════════════════════════════════════
  // MODE INDICATORS
  // ══════════════════════════════════════════════════════════
  const getModeColor = () => {
    switch (mode) {
      case 'idle': return 'text-gray-600';
      case 'conversing': return 'text-blue-600';
      case 'ready-to-plan': return 'text-green-600';
      case 'drafting': return 'text-purple-600';
      case 'executing': return 'text-orange-600';
      case 'reviewing-artifacts': return 'text-cyan-600';
      case 'paused': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getModeIcon = () => {
    switch (mode) {
      case 'idle': return Mic;
      case 'conversing': return Mic;
      case 'ready-to-plan': return FileText;
      case 'drafting': return Loader2;
      case 'executing': return Play;
      case 'reviewing-artifacts': return CheckCircle2;
      case 'paused': return Pause;
      default: return Mic;
    }
  };

  const ModeIcon = getModeIcon();

  // ══════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8">
      <div className="max-w-4xl w-full space-y-8">
        
        {/* ═══════════════════════════════════════════════════ */}
        {/* SYSTEM HEADER */}
        {/* ═══════════════════════════════════════════════════ */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">CORTEX</h1>
          <div className="flex items-center justify-center gap-2">
            <ModeIcon className={`w-5 h-5 ${getModeColor()} ${mode === 'drafting' || mode === 'executing' ? 'animate-spin' : ''}`} />
            <span className={`text-lg font-medium ${getModeColor()}`}>
              {getModeDescription(mode)}
            </span>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════ */}
        {/* ARTIFACT SUMMARY */}
        {/* ═══════════════════════════════════════════════════ */}
        {!loadingArtifacts && artifactSummary && (
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {artifactSummary.projectCount === 0
                  ? 'No projects yet'
                  : artifactSummary.projectCount === 1
                  ? '1 project'
                  : `${artifactSummary.projectCount} projects`}
              </span>
              {artifactSummary.lastActiveProject && (
                <span className="text-sm font-medium">
                  Last: {artifactSummary.lastActiveProject.name}
                </span>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════ */}
        {/* CURRENT TRANSCRIPT (when conversing) */}
        {/* ═══════════════════════════════════════════════════ */}
        {mode === 'conversing' && transcript && (
          <div className="bg-card border border-border rounded-lg p-6 space-y-2">
            <h3 className="text-sm font-medium text-muted-foreground">You said:</h3>
            <p className="text-lg">{transcript}</p>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════ */}
        {/* PLANNING DRAFT (when ready) */}
        {/* ═══════════════════════════════════════════════════ */}
        {(mode === 'ready-to-plan' || mode === 'drafting') && planningDraft && (
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Planning Draft</h3>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium">
                Preview
              </span>
            </div>

            <div className="space-y-2">
              <p className="text-base">{planningDraft.projectSummary}</p>
            </div>

            {planningDraft.phases.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase">Phases</h4>
                <div className="space-y-2">
                  {planningDraft.phases.map((phase, idx) => (
                    <div key={phase.id} className="border-l-4 border-blue-500 pl-4 py-1">
                      <span className="font-medium text-sm">{phase.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2 border-t">
              <Button
                size="sm"
                onClick={executePlan}
                disabled={planningDraftStatus !== 'ready'}
                className="gap-2"
              >
                <Play className="w-4 h-4" />
                Create This Plan
              </Button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════ */}
        {/* EXECUTION CONSOLE (when executing) */}
        {/* ═══════════════════════════════════════════════════ */}
        {mode === 'executing' && executionProgress && (
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Execution</h3>
              <span className={`text-xs px-2 py-1 rounded font-medium ${
                executionProgress.status === 'executing'
                  ? 'bg-blue-100 text-blue-700'
                  : executionProgress.status === 'completed'
                  ? 'bg-green-100 text-green-700'
                  : executionProgress.status === 'error'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-gray-100 text-gray-700'
              }`}>
                {executionProgress.status === 'executing' ? 'Executing...' : executionProgress.status}
              </span>
            </div>

            {/* Progress Bar */}
            {executionProgress.status !== 'idle' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Step {executionProgress.currentStepIndex + 1} of {executionProgress.totalSteps}
                  </span>
                  <span className="font-medium">{Math.round(executionProgress.percentage)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      executionProgress.status === 'completed'
                        ? 'bg-green-600'
                        : executionProgress.status === 'error'
                        ? 'bg-red-600'
                        : 'bg-blue-600'
                    }`}
                    style={{ width: `${executionProgress.percentage}%` }}
                  />
                </div>
              </div>
            )}

            {/* Current Step */}
            {executionProgress.currentStep && executionProgress.status === 'executing' && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{executionProgress.currentStep.description}</span>
              </div>
            )}

            {/* Error */}
            {executionProgress.error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Execution Failed</AlertTitle>
                <AlertDescription>{executionProgress.error.message}</AlertDescription>
              </Alert>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t">
              {executionProgress.status === 'executing' && (
                <Button size="sm" variant="destructive" onClick={abortExecution} className="gap-2">
                  <Square className="w-4 h-4" />
                  Abort
                </Button>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════ */}
        {/* COMPLETION SUMMARY */}
        {/* ═══════════════════════════════════════════════════ */}
        {executionProgress?.status === 'completed' && createdProject && (
          <div className="bg-card border border-border rounded-lg p-6 space-y-3">
            <div className="flex items-center gap-2 text-green-700">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-semibold">Planning Complete</span>
            </div>
            <div className="space-y-2">
              <p className="text-sm">
                <span className="font-medium">Project:</span> {createdProject.name}
              </p>
              <p className="text-sm text-muted-foreground">
                Created {executionProgress.completedSteps} artifacts
              </p>
            </div>
            <div className="flex gap-2 pt-2 border-t">
              <Button size="sm" variant="outline" onClick={() => {
                clearExecution();
                refreshArtifacts();
              }}>
                Clear
              </Button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════ */}
        {/* VOICE CONTROLS */}
        {/* ═══════════════════════════════════════════════════ */}
        <div className="bg-card border border-border rounded-lg p-8 space-y-6">
          {/* Error Display */}
          {voiceError && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{voiceError}</AlertDescription>
            </Alert>
          )}

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            {!isActive && mode === 'idle' ? (
              <Button size="lg" onClick={startListening} className="gap-2">
                <Mic className="w-5 h-5" />
                Start Listening
              </Button>
            ) : isActive ? (
              <Button size="lg" variant="destructive" onClick={interrupt} className="gap-2">
                <Square className="w-5 h-5" />
                Interrupt
              </Button>
            ) : null}

            {voiceError && (
              <Button size="lg" variant="outline" onClick={reset}>
                Reset
              </Button>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════ */}
        {/* SYSTEM STATUS */}
        {/* ═══════════════════════════════════════════════════ */}
        <div className="text-center text-sm text-muted-foreground">
          <p>Voice-first planning layer · Always listening</p>
          {mode === 'idle' && <p className="mt-1">Say "start" or "begin" to create a new project</p>}
        </div>

      </div>
    </div>
  );
};

export default Focus;
