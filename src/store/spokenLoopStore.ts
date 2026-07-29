/**
 * Spoken Loop Store - PHASE Ω INTEGRATED
 * Zustand store for Phase 0 Voice Spine + Phase 2 Conversation Brain + Phase 2.5 Planning Readiness
 * Bridges state machine to React components
 * 
 * PHASE Ω: Now syncs with useCortexState for global mode management
 */

import { create } from 'zustand';
import { SpokenLoopState } from '@/lib/voice/types';
import { SpokenLoopMachine } from '@/lib/voice/spokenLoopMachine';
import { SpeechController } from '@/lib/voice/speechController';
import { GeminiSimpleClient } from '@/lib/ai/geminiSimpleClient';
import { ConversationBrain, ConversationTurn, InferredContext } from '@/lib/conversation/conversationBrain';
import { PlanningReadiness } from '@/lib/planning/planningReadinessEvaluator';
import { PlanningDraft } from '@/lib/planning/types';
import { getPlanningSynthesizer } from '@/lib/planning/planningSynthesizer';
import { ExecutionProgress, ExecutionLogEntry, Project } from '@/lib/execution/types';
import { getExecutionPlanner } from '@/lib/execution/executionPlanner';
import { getExecutionEngine } from '@/lib/execution/executionEngine';
import { getExecutionNarrator } from '@/lib/execution/executionNarrator';
import { initDatabase } from '@/lib/execution/db';
import { getProjectRepository } from '@/lib/execution/repositories';
import { useCortexState } from './useCortexState';

// ============================================================================
// PHASE Ω: MODE SYNC HELPER
// ============================================================================

/**
 * Syncs internal state to global CortexMode
 * Called after any state change that should update mode
 */
function syncCortexMode(store: any) {
  const { setMode } = useCortexState.getState();
  
  // Determine mode based on current state
  if (store.executionProgress?.status === 'executing') {
    setMode('executing', 'Execution in progress');
  } else if (store.planningDraftStatus === 'synthesizing') {
    setMode('drafting', 'Synthesizing draft');
  } else if (store.planningReadiness?.ready && store.planningDraft) {
    setMode('ready-to-plan', 'Draft ready');
  } else if (store.isActive) {
    setMode('conversing', 'Voice active');
  } else if (store.executionProgress?.status === 'completed' || store.createdProject) {
    setMode('reviewing-artifacts', 'Viewing results');
  } else {
    setMode('idle', 'Ready');
  }
}

interface SpokenLoopStore {
  // Phase 0: Voice State
  state: SpokenLoopState;
  transcript: string | null;
  aiResponse: string | null;
  error: string | null;
  isActive: boolean;

  // Phase 2: Conversation State
  conversationTurns: ConversationTurn[];
  inferredContext: InferredContext;
  openQuestions: string[];
  conversationMetadata: {
    conversationId: string;
    turnCount: number;
    hasContext: boolean;
  } | null;

  // Phase 2.5: Planning Readiness
  planningReadiness: PlanningReadiness | null;

  // Phase 3A: Planning Draft (Preview-Only)
  planningDraft: PlanningDraft | null;
  planningDraftStatus: 'idle' | 'synthesizing' | 'ready' | 'error';
  planningDraftError: string | null;

  // Phase 3B: Planning Execution
  executionProgress: ExecutionProgress | null;
  executionLog: ExecutionLogEntry[];
  createdProject: Project | null;

  // Phase 0: Voice Actions
  startListening: () => void;
  interrupt: () => void;
  reset: () => void;

  // Phase 2: Conversation Actions
  getConversationHistory: () => ConversationTurn[];
  resetConversation: () => void;

  // Phase 3A: Planning Actions
  synthesizePlanningDraft: () => Promise<void>;
  clearPlanningDraft: () => void;

  // Phase 3B: Execution Actions
  executePlan: () => Promise<void>;
  abortExecution: () => void;
  clearExecution: () => void;
}

// Create singleton instances
const speechController = new SpeechController();
const conversationBrain = new ConversationBrain();
const geminiClient = new GeminiSimpleClient(conversationBrain); // Phase 2: Pass conversation brain
const machine = new SpokenLoopMachine(speechController, geminiClient);

export const useSpokenLoopStore = create<SpokenLoopStore>((set, get) => {
  // Subscribe to machine state changes
  machine.subscribe((newState) => {
    const currentStore = get();

    // Phase 0: Update voice state
    set({
      state: newState,
      isActive: newState.type !== 'idle' && newState.type !== 'error',
      // Extract data from state
      transcript: newState.type === 'thinking' ? newState.transcript : currentStore.transcript,
      aiResponse: newState.type === 'speaking' ? newState.response : currentStore.aiResponse,
      error: newState.type === 'error' ? newState.error : null,
    });

    // Phase 2: Update conversation context when state changes
    // Add user turn when we enter 'thinking' state
    if (newState.type === 'thinking' && newState.transcript) {
      conversationBrain.addUserTurn(newState.transcript);
      
      // Phase 2.5: Evaluate planning readiness
      const readiness = conversationBrain.evaluatePlanningReadiness();
      
      // Update store with latest conversation state
      set({
        conversationTurns: conversationBrain.getTurns(),
        inferredContext: conversationBrain.getInferredContext(),
        openQuestions: conversationBrain.getOpenQuestions(),
        conversationMetadata: conversationBrain.getMetadata(),
        planningReadiness: readiness,
      });
    }

    // Add CORTEX turn when we enter 'speaking' state
    if (newState.type === 'speaking' && newState.response) {
      conversationBrain.addCortexTurn(newState.response);
      
      // Phase 2.5: Evaluate planning readiness
      const readiness = conversationBrain.evaluatePlanningReadiness();
      
      // Update store with latest conversation state
      set({
        conversationTurns: conversationBrain.getTurns(),
        inferredContext: conversationBrain.getInferredContext(),
        openQuestions: conversationBrain.getOpenQuestions(),
        conversationMetadata: conversationBrain.getMetadata(),
        planningReadiness: readiness,
      });
    }
  });

  return {
    // Phase 0: Initial voice state
    state: { type: 'idle' },
    transcript: null,
    aiResponse: null,
    error: null,
    isActive: false,

    // Phase 2: Initial conversation state
    conversationTurns: [],
    inferredContext: {},
    openQuestions: [],
    conversationMetadata: null,

    // Phase 2.5: Initial planning readiness
    planningReadiness: null,

    // Phase 3A: Initial planning draft state
    planningDraft: null,
    planningDraftStatus: 'idle',
    planningDraftError: null,

    // Phase 3B: Initial execution state
    executionProgress: null,
    executionLog: [],
    createdProject: null,

    // Phase 0: Voice actions
    startListening: () => {
      machine.handleEvent({ type: 'START_LISTENING' });
    },

    interrupt: () => {
      machine.handleEvent({ type: 'USER_INTERRUPT' });
    },

    reset: () => {
      machine.handleEvent({ type: 'RESET' });
      set({ transcript: null, aiResponse: null, error: null });
    },

    // Phase 2: Conversation actions
    getConversationHistory: () => {
      return conversationBrain.getTurns();
    },

    resetConversation: () => {
      conversationBrain.reset();
      set({
        conversationTurns: [],
        inferredContext: {},
        openQuestions: [],
        conversationMetadata: null,
        planningReadiness: null,
        planningDraft: null,
        planningDraftStatus: 'idle',
        planningDraftError: null,
        transcript: null,
        aiResponse: null,
      });
    },

    // Phase 3A: Planning actions
    synthesizePlanningDraft: async () => {
      const currentState = get();
      
      // Only synthesize if we're ready
      if (!currentState.planningReadiness?.ready) {
        set({
          planningDraftError: 'Not ready to plan yet. Continue conversation to gather more context.',
          planningDraftStatus: 'error',
        });
        return;
      }

      // Set synthesizing status
      set({
        planningDraftStatus: 'synthesizing',
        planningDraftError: null,
      });

      try {
        const synthesizer = getPlanningSynthesizer();
        const conversationState = conversationBrain.exportState();
        
        const result = await synthesizer.synthesizePlan(conversationState);

        if (result.success && result.draft) {
          set({
            planningDraft: result.draft,
            planningDraftStatus: 'ready',
            planningDraftError: null,
          });
        } else {
          set({
            planningDraft: null,
            planningDraftStatus: 'error',
            planningDraftError: result.error || 'Failed to synthesize planning draft',
          });
        }
      } catch (error) {
        set({
          planningDraft: null,
          planningDraftStatus: 'error',
          planningDraftError: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    },

    clearPlanningDraft: () => {
      set({
        planningDraft: null,
        planningDraftStatus: 'idle',
        planningDraftError: null,
      });
    },

    // Phase 3B: Execution actions
    executePlan: async () => {
      const currentState = get();
      
      // Must have an approved draft
      if (!currentState.planningDraft) {
        console.error('No planning draft to execute');
        return;
      }

      // Initialize database
      await initDatabase();

      // Generate execution plan
      const planner = getExecutionPlanner();
      const conversationId = currentState.conversationMetadata?.conversationId || 'unknown';
      const plan = planner.generatePlan(currentState.planningDraft, conversationId);

      // Setup execution engine with event handlers
      const engine = getExecutionEngine();
      const narrator = getExecutionNarrator();
      const speechController = new SpeechController();

      // Clear log
      set({ executionLog: [] });

      // Subscribe to execution events
      const unsubscribe = engine.on((event) => {
        const currentLog = get().executionLog;
        
        // Update progress
        set({ executionProgress: event.progress });

        // Add log entry
        if (event.log) {
          set({ executionLog: [...currentLog, event.log] });
        }

        // Voice narration
        const narration = narrator.narrate(event);
        if (narration) {
          speechController.speak(narration);
        }
      });

      try {
        // Execute the plan
        const finalProgress = await engine.execute(plan);

        // If successful, retrieve the created project
        if (finalProgress.status === 'completed') {
          const projectRepo = getProjectRepository();
          const projects = await projectRepo.getByConversationId(conversationId);
          const latestProject = projects[projects.length - 1] || null;
          set({ createdProject: latestProject });
        }
      } catch (error) {
        console.error('Execution failed:', error);
      } finally {
        unsubscribe();
      }
    },

    abortExecution: () => {
      const engine = getExecutionEngine();
      engine.abort();
    },

    clearExecution: () => {
      set({
        executionProgress: null,
        executionLog: [],
        createdProject: null,
      });
    },
  };
});
