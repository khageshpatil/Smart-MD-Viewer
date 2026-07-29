/**
 * PHASE Ω: Voice Orchestrator (Presence, Not Interaction)
 * 
 * Voice is always on.
 * There is NO chat UI, NO text input fallback, NO prompt box.
 * 
 * Voice behavior rules:
 * - Speak only when meaningful
 * - Silence is valid
 * - Tone reflects current CortexMode
 * 
 * NO AI text generation here. Only deterministic templates.
 * 
 * PHASE Ω FINAL — DO NOT EXTEND WITHOUT DESIGN REVIEW
 */

import type { CortexMode } from '@/store/useCortexState';

// ============================================================================
// TYPES
// ============================================================================

export interface VoiceRule {
  canSpeak: boolean;
  tone: 'calm' | 'active' | 'urgent' | 'silent';
  greeting: string | null;
}

// ============================================================================
// MODE → VOICE MAPPING
// ============================================================================

const VOICE_RULES: Record<CortexMode, VoiceRule> = {
  'idle': {
    canSpeak: true,
    tone: 'calm',
    greeting: 'I\'m ready when you are.',
  },
  'conversing': {
    canSpeak: true,
    tone: 'active',
    greeting: null, // Already in conversation
  },
  'ready-to-plan': {
    canSpeak: true,
    tone: 'calm',
    greeting: 'Ready to create a planning draft when you are.',
  },
  'drafting': {
    canSpeak: false, // AI is working, stay silent
    tone: 'silent',
    greeting: null,
  },
  'executing': {
    canSpeak: true, // Only milestone narration
    tone: 'active',
    greeting: null,
  },
  'reviewing-artifacts': {
    canSpeak: true,
    tone: 'calm',
    greeting: 'You\'re reviewing an existing project.',
  },
  'paused': {
    canSpeak: false,
    tone: 'silent',
    greeting: null,
  },
};

// ============================================================================
// VOICE TEMPLATES (DETERMINISTIC)
// ============================================================================

export const VOICE_TEMPLATES = {
  // Greetings
  welcome: 'Welcome to CORTEX.',
  ready: 'I\'m ready when you are.',
  
  // Conversation
  askProjectType: 'What kind of project do you want to build?',
  askPlatform: 'What platform should it run on?',
  askFeatures: 'What features do you need?',
  askConstraints: 'Any specific constraints or requirements?',
  
  // Planning
  readyToSynthesize: 'I have enough context. Ready to create a planning draft?',
  synthesizingDraft: 'Creating your planning draft.',
  draftReady: 'Planning draft ready. Review it when you\'re ready.',
  
  // Execution (milestone-based, from Phase 3B)
  executionStart: (steps: number) => `Starting execution. Creating your plan with ${steps} steps.`,
  milestone25: '25% complete.',
  milestone50: '50% complete.',
  milestone75: '75% complete.',
  executionComplete: (count: number) => `Planning complete! Created ${count} artifacts. Your project is ready.`,
  executionError: (error: string) => `Execution failed: ${error}. Please try again.`,
  
  // Artifacts
  reviewingProject: (name: string) => `You're reviewing project: ${name}.`,
  noArtifacts: 'No projects found. Would you like to start a new one?',
  lastProject: (name: string) => `Your last project was: ${name}.`,
  
  // System
  paused: 'Paused. Say "continue" when ready.',
  resumed: 'Continuing.',
  aborted: 'Stopped.',
  reset: 'System reset.',
  
  // Clarification
  unclear: 'I didn\'t understand. Can you rephrase that?',
  tooSoon: 'Not ready yet. Still gathering context.',
};

// ============================================================================
// VOICE ORCHESTRATOR
// ============================================================================

class CortexVoiceOrchestratorImpl {
  /**
   * Get voice rule for current mode
   */
  getRule(mode: CortexMode): VoiceRule {
    return VOICE_RULES[mode];
  }

  /**
   * Check if speech is allowed in current mode
   */
  canSpeak(mode: CortexMode): boolean {
    return VOICE_RULES[mode].canSpeak;
  }

  /**
   * Get greeting for mode (if any)
   */
  getGreeting(mode: CortexMode): string | null {
    return VOICE_RULES[mode].greeting;
  }

  /**
   * Get tone for mode
   */
  getTone(mode: CortexMode): 'calm' | 'active' | 'urgent' | 'silent' {
    return VOICE_RULES[mode].tone;
  }

  /**
   * Should narrate this event?
   * Used by execution engine to decide if voice output is needed
   */
  shouldNarrate(mode: CortexMode, eventType: string): boolean {
    // Drafting: silent (AI working)
    if (mode === 'drafting') {
      return false;
    }

    // Executing: only milestones
    if (mode === 'executing') {
      return eventType === 'execution-started' ||
             eventType === 'execution-completed' ||
             eventType === 'execution-error' ||
             eventType === 'milestone';
    }

    // Paused: silent
    if (mode === 'paused') {
      return false;
    }

    // Other modes: narrate important events
    return eventType === 'mode-change' ||
           eventType === 'error' ||
           eventType === 'confirmation';
  }

  /**
   * Get voice narration for mode transition
   */
  narrateModeTransition(from: CortexMode, to: CortexMode): string | null {
    // Entering idle
    if (to === 'idle') {
      return VOICE_TEMPLATES.ready;
    }

    // Entering conversing
    if (to === 'conversing' && from === 'idle') {
      return null; // User initiated, no need to confirm
    }

    // Entering ready-to-plan
    if (to === 'ready-to-plan') {
      return VOICE_TEMPLATES.readyToSynthesize;
    }

    // Entering drafting
    if (to === 'drafting') {
      return VOICE_TEMPLATES.synthesizingDraft;
    }

    // Entering executing
    if (to === 'executing') {
      return null; // Execution engine handles narration
    }

    // Entering reviewing
    if (to === 'reviewing-artifacts') {
      return VOICE_RULES['reviewing-artifacts'].greeting;
    }

    // Entering paused
    if (to === 'paused') {
      return VOICE_TEMPLATES.paused;
    }

    return null;
  }

  /**
   * Block speech if not allowed
   */
  validateSpeech(mode: CortexMode, text: string): boolean {
    if (!this.canSpeak(mode)) {
      console.warn(`[Voice Orchestrator] Speech blocked in mode: ${mode}`, text);
      return false;
    }
    return true;
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

let voiceOrchestratorInstance: CortexVoiceOrchestratorImpl | null = null;

export function getCortexVoiceOrchestrator(): CortexVoiceOrchestratorImpl {
  if (!voiceOrchestratorInstance) {
    voiceOrchestratorInstance = new CortexVoiceOrchestratorImpl();
  }
  return voiceOrchestratorInstance;
}
