/**
 * PHASE Ω: Global System State
 * 
 * Single source of truth for CORTEX's current mode.
 * Mode is NOT inferred — it is explicitly set.
 * Only ONE mode at a time.
 * 
 * PHASE Ω FINAL — DO NOT EXTEND WITHOUT DESIGN REVIEW
 */

import { create } from 'zustand';

// ============================================================================
// TYPES
// ============================================================================

export type CortexMode =
  | 'idle'              // Ready, waiting for user
  | 'conversing'        // Active voice conversation
  | 'ready-to-plan'     // Context gathered, can synthesize
  | 'drafting'          // Synthesizing planning draft (AI active)
  | 'executing'         // Creating artifacts (deterministic)
  | 'reviewing-artifacts' // Viewing created artifacts
  | 'paused';           // System paused by user

interface CortexState {
  mode: CortexMode;
  previousMode: CortexMode | null;
  modeHistory: CortexMode[];
  
  // Actions
  setMode: (nextMode: CortexMode, reason?: string) => void;
  canTransitionTo: (targetMode: CortexMode) => boolean;
  reset: () => void;
}

// ============================================================================
// TRANSITION RULES
// ============================================================================

const VALID_TRANSITIONS: Record<CortexMode, CortexMode[]> = {
  'idle': ['conversing', 'reviewing-artifacts'],
  'conversing': ['idle', 'ready-to-plan', 'paused'],
  'ready-to-plan': ['conversing', 'drafting', 'idle', 'paused'],
  'drafting': ['ready-to-plan', 'executing', 'paused'],
  'executing': ['reviewing-artifacts', 'paused', 'idle'],
  'reviewing-artifacts': ['idle', 'conversing'],
  'paused': ['idle', 'conversing', 'ready-to-plan', 'drafting', 'executing', 'reviewing-artifacts'],
};

// ============================================================================
// STORE
// ============================================================================

export const useCortexState = create<CortexState>((set, get) => ({
  mode: 'idle',
  previousMode: null,
  modeHistory: ['idle'],

  setMode: (nextMode: CortexMode, reason?: string) => {
    const currentMode = get().mode;

    // Guard: No-op if already in target mode
    if (currentMode === nextMode) {
      console.log(`[CORTEX State] Already in mode: ${nextMode}`);
      return;
    }

    // Guard: Validate transition
    if (!get().canTransitionTo(nextMode)) {
      console.error(
        `[CORTEX State] Invalid transition: ${currentMode} → ${nextMode}`,
        reason ? `Reason: ${reason}` : ''
      );
      return;
    }

    // Execute transition
    console.log(
      `[CORTEX State] Transition: ${currentMode} → ${nextMode}`,
      reason ? `(${reason})` : ''
    );

    set((state) => ({
      mode: nextMode,
      previousMode: currentMode,
      modeHistory: [...state.modeHistory, nextMode].slice(-10), // Keep last 10
    }));
  },

  canTransitionTo: (targetMode: CortexMode) => {
    const currentMode = get().mode;
    return VALID_TRANSITIONS[currentMode]?.includes(targetMode) ?? false;
  },

  reset: () => {
    console.log('[CORTEX State] Reset to idle');
    set({
      mode: 'idle',
      previousMode: null,
      modeHistory: ['idle'],
    });
  },
}));

// ============================================================================
// HOOKS
// ============================================================================

export const useCortexMode = () => useCortexState((state) => state.mode);
export const useSetCortexMode = () => useCortexState((state) => state.setMode);
export const useCanTransitionTo = () => useCortexState((state) => state.canTransitionTo);
export const useResetCortexMode = () => useCortexState((state) => state.reset);

// Helper hook that returns all actions (use individual hooks above to avoid re-render issues)
export const useCortexModeActions = () => ({
  setMode: useSetCortexMode(),
  canTransitionTo: useCanTransitionTo(),
  reset: useResetCortexMode(),
});

// ============================================================================
// MODE UTILITIES
// ============================================================================

export function getModeDescription(mode: CortexMode): string {
  switch (mode) {
    case 'idle':
      return 'Ready';
    case 'conversing':
      return 'In Conversation';
    case 'ready-to-plan':
      return 'Ready to Plan';
    case 'drafting':
      return 'Drafting Plan';
    case 'executing':
      return 'Creating Artifacts';
    case 'reviewing-artifacts':
      return 'Reviewing Artifacts';
    case 'paused':
      return 'Paused';
  }
}

export function isModeBlocking(mode: CortexMode): boolean {
  return mode === 'drafting' || mode === 'executing';
}

export function canStartConversation(mode: CortexMode): boolean {
  return mode === 'idle' || mode === 'reviewing-artifacts';
}
