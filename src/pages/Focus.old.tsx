/**
 * PHASE 0 + PHASE 2 + PHASE 2.5 + PHASE 3A + PHASE 3B: Voice Spine + Conversational Brain + Planning Readiness + Planning Synthesis + Planning Execution
 * Voice loop with multi-turn conversation history, planning readiness gate, planning draft preview, and execution console
 */

import { Mic, Square, AlertCircle, MessageCircle, User, CheckCircle, FileText, Loader2, Play, XCircle, CheckCircle2 } from 'lucide-react';
import { useSpokenLoopStore } from '@/store/spokenLoopStore';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const Focus = () => {
  // ══════════════════════════════════════════════════════════
  // Phase 0: Voice State
  // ══════════════════════════════════════════════════════════
  const { state, transcript, aiResponse, error, isActive, startListening, interrupt, reset } =
    useSpokenLoopStore();

  // ══════════════════════════════════════════════════════════
  // Phase 2: Conversation State
  // ══════════════════════════════════════════════════════════
  const { conversationTurns, inferredContext, conversationMetadata, resetConversation } =
    useSpokenLoopStore();

  // ══════════════════════════════════════════════════════════
  // Phase 2.5: Planning Readiness
  // ══════════════════════════════════════════════════════════
  const { planningReadiness } = useSpokenLoopStore();

  // ══════════════════════════════════════════════════════════
  // Phase 3A: Planning Draft (Preview-Only)
  // ══════════════════════════════════════════════════════════
  const { planningDraft, planningDraftStatus, planningDraftError, synthesizePlanningDraft, clearPlanningDraft } =
    useSpokenLoopStore();

  // ══════════════════════════════════════════════════════════
  // Phase 3B: Planning Execution
  // ══════════════════════════════════════════════════════════
  const { executionProgress, executionLog, createdProject, executePlan, abortExecution, clearExecution } =
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
  // PHASE 0 + 2: UI - Voice loop + Conversation History
  // ══════════════════════════════════════════════════════════
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8">
      <div className="max-w-4xl w-full space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold">CORTEX</h1>
          <p className="text-muted-foreground">Phase 3B: Conversational Planning Partner with Execution</p>
        </div>

        {/* Conversation History (Phase 2) */}
        {conversationTurns.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Conversation History
              </h3>
              {conversationMetadata && (
                <span className="text-sm text-muted-foreground">
                  {conversationMetadata.turnCount} turns
                </span>
              )}
            </div>

            {/* Scrollable conversation log */}
            <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
              {conversationTurns.map((turn, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${
                    turn.role === 'user' ? 'justify-start' : 'justify-end'
                  }`}
                >
                  <div
                    className={`flex gap-2 max-w-[80%] ${
                      turn.role === 'user' ? 'flex-row' : 'flex-row-reverse'
                    }`}
                  >
                    {/* Avatar */}
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        turn.role === 'user'
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-green-100 text-green-600'
                      }`}
                    >
                      {turn.role === 'user' ? (
                        <User className="w-4 h-4" />
                      ) : (
                        <MessageCircle className="w-4 h-4" />
                      )}
                    </div>

                    {/* Message bubble */}
                    <div
                      className={`rounded-lg p-3 ${
                        turn.role === 'user'
                          ? 'bg-blue-50 text-blue-900'
                          : 'bg-green-50 text-green-900'
                      }`}
                    >
                      <p className="text-sm">{turn.text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Inferred Context (Phase 2) */}
            {Object.keys(inferredContext).length > 0 && (
              <div className="border-t pt-4 space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">
                  What CORTEX understands:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {inferredContext.projectType && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                      {inferredContext.projectType}
                    </span>
                  )}
                  {inferredContext.platform && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      {inferredContext.platform}
                    </span>
                  )}
                  {inferredContext.constraints?.map((constraint, idx) => (
                    <span
                      key={idx}
                      className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded"
                    >
                      {constraint}
                    </span>
                  ))}
                  {inferredContext.features?.map((feature, idx) => (
                    <span
                      key={idx}
                      className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Planning Readiness Indicator (Phase 2.5) */}
            {planningReadiness && (
              <div className="border-t pt-4 space-y-2">
                {planningReadiness.ready ? (
                  <div className="flex items-center gap-2 text-sm text-green-700">
                    <CheckCircle className="w-4 h-4" />
                    <span className="font-medium">
                      Ready to plan (confidence: {Math.round(planningReadiness.confidenceScore * 100)}%)
                    </span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-amber-700">
                      <AlertCircle className="w-4 h-4" />
                      <span className="font-medium">
                        Gathering information... ({Math.round(planningReadiness.confidenceScore * 100)}% complete)
                      </span>
                    </div>
                    {planningReadiness.missingInfo.length > 0 && (
                      <p className="text-xs text-muted-foreground pl-6">
                        Still need: {planningReadiness.missingInfo[0]}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Planning Draft Preview (Phase 3A) */}
        {(planningReadiness?.ready || planningDraft || planningDraftStatus !== 'idle') && (
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Planning Draft
              </h3>
              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-medium">
                Preview — nothing created yet
              </span>
            </div>

            {/* Synthesis Status */}
            {planningDraftStatus === 'synthesizing' && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Synthesizing planning draft...</span>
              </div>
            )}

            {/* Error State */}
            {planningDraftStatus === 'error' && planningDraftError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Synthesis Error</AlertTitle>
                <AlertDescription>{planningDraftError}</AlertDescription>
              </Alert>
            )}

            {/* Draft Content */}
            {planningDraft && planningDraftStatus === 'ready' && (
              <div className="space-y-4">
                {/* Project Summary */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase">Project Summary</h4>
                  <p className="text-base">{planningDraft.projectSummary}</p>
                </div>

                {/* Goals */}
                {planningDraft.goals.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase">Goals</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {planningDraft.goals.map((goal, idx) => (
                        <li key={idx} className="text-sm">{goal}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Non-Goals */}
                {planningDraft.nonGoals.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase">Non-Goals (Out of Scope)</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {planningDraft.nonGoals.map((nonGoal, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground">{nonGoal}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Assumptions */}
                {planningDraft.assumptions.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase">Assumptions</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {planningDraft.assumptions.map((assumption, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground italic">{assumption}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Risks */}
                {planningDraft.risks.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase">Risks</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {planningDraft.risks.map((risk, idx) => (
                        <li key={idx} className="text-sm text-amber-700">{risk}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Phases */}
                {planningDraft.phases.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase">Phases</h4>
                    <div className="space-y-3">
                      {planningDraft.phases.map((phase, idx) => (
                        <div key={phase.id} className="border-l-4 border-blue-500 pl-4 py-2">
                          <h5 className="font-semibold text-sm">{phase.title}</h5>
                          <p className="text-sm text-muted-foreground">{phase.intent}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={clearPlanningDraft}
                    disabled={executionProgress?.status === 'executing'}
                  >
                    Clear Draft
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={synthesizePlanningDraft}
                    disabled={executionProgress?.status === 'executing'}
                  >
                    Regenerate
                  </Button>
                  <Button
                    size="sm"
                    onClick={executePlan}
                    disabled={executionProgress?.status === 'executing'}
                    className="gap-2 ml-auto"
                  >
                    <Play className="w-4 h-4" />
                    Create This Plan
                  </Button>
                </div>
              </div>
            )}

            {/* Generate Button (when ready but no draft yet) */}
            {planningReadiness?.ready && !planningDraft && planningDraftStatus === 'idle' && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  CORTEX has gathered enough context to create a planning draft. This is a preview - nothing will be created automatically.
                </p>
                <Button
                  onClick={synthesizePlanningDraft}
                  className="gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Generate Planning Draft
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Execution Console (Phase 3B) */}
        {(executionProgress || createdProject) && (
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Play className="w-5 h-5" />
                Execution Console
              </h3>
              {executionProgress && (
                <span className={`text-xs px-2 py-1 rounded font-medium ${
                  executionProgress.status === 'executing'
                    ? 'bg-blue-100 text-blue-700'
                    : executionProgress.status === 'completed'
                    ? 'bg-green-100 text-green-700'
                    : executionProgress.status === 'error'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {executionProgress.status === 'executing'
                    ? 'Executing...'
                    : executionProgress.status === 'completed'
                    ? 'Completed'
                    : executionProgress.status === 'error'
                    ? 'Failed'
                    : 'Idle'
                  }
                </span>
              )}
            </div>

            {/* Progress Bar */}
            {executionProgress && executionProgress.status !== 'idle' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Step {executionProgress.currentStepIndex + 1} of {executionProgress.totalSteps}
                  </span>
                  <span className="font-medium">
                    {Math.round(executionProgress.percentage)}%
                  </span>
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
            {executionProgress?.currentStep && executionProgress.status === 'executing' && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{executionProgress.currentStep.description}</span>
              </div>
            )}

            {/* Error Display */}
            {executionProgress?.error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Execution Failed</AlertTitle>
                <AlertDescription>{executionProgress.error.message}</AlertDescription>
              </Alert>
            )}

            {/* Execution Log */}
            {executionLog.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase">Execution Log</h4>
                <div className="max-h-64 overflow-y-auto space-y-1 bg-muted/30 rounded p-3">
                  {executionLog.map((entry, idx) => (
                    <div
                      key={idx}
                      className={`text-xs font-mono flex gap-2 ${
                        entry.level === 'error'
                          ? 'text-red-600'
                          : entry.level === 'success'
                          ? 'text-green-600'
                          : 'text-muted-foreground'
                      }`}
                    >
                      <span className="text-muted-foreground">
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </span>
                      <span>{entry.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Completion Summary */}
            {executionProgress?.status === 'completed' && createdProject && (
              <div className="space-y-3 border-t pt-4">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-semibold">Planning Complete!</span>
                </div>
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">Project:</span> {createdProject.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Created {executionProgress.completedSteps} artifacts
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t">
              {executionProgress?.status === 'executing' && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={abortExecution}
                  className="gap-2"
                >
                  <Square className="w-4 h-4" />
                  Abort Execution
                </Button>
              )}
              {(executionProgress?.status === 'completed' || executionProgress?.status === 'error') && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={clearExecution}
                >
                  Clear
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Voice State Display (Phase 0) */}
        <div className="bg-card border border-border rounded-lg p-8 space-y-6">
          {/* State Indicator */}
          <div className="flex items-center justify-center gap-3">
            <StateIcon className={`w-6 h-6 ${stateColor}`} />
            <span className={`text-2xl font-semibold ${stateColor}`}>{stateLabel}</span>
          </div>

          {/* Current Transcript (Phase 0) */}
          {transcript && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-muted-foreground">You said:</h3>
              <p className="text-lg bg-muted/50 rounded p-4">{transcript}</p>
            </div>
          )}

          {/* Current AI Response (Phase 0) */}
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

            {conversationTurns.length > 0 && !isActive && (
              <Button
                size="lg"
                variant="outline"
                onClick={resetConversation}
                className="gap-2"
              >
                New Conversation
              </Button>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="text-center text-sm text-muted-foreground space-y-2">
          <p>Click "Start Listening" to begin a voice conversation.</p>
          <p>CORTEX will ask questions to understand your project idea.</p>
          <p>When ready (75%+ confidence), you can generate a planning draft preview.</p>
          <p>Review the draft and click "Create This Plan" to execute (creates artifacts in IndexedDB).</p>
          <p>Execution progress is narrated by voice. You can abort at any time.</p>
        </div>
      </div>
    </div>
  );
};

export default Focus;
