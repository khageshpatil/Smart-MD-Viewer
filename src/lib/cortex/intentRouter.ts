/**
 * PHASE Ω: Intent Router (Minimal Grammar)
 * 
 * Support a small, closed set of intents.
 * Simple keyword matching. NO AI parsing. NO fuzzy logic.
 * If intent is unclear → ask one clarification question.
 * 
 * PHASE Ω FINAL — DO NOT EXTEND WITHOUT DESIGN REVIEW
 */

import type { CortexMode } from '@/store/useCortexState';

// ============================================================================
// TYPES
// ============================================================================

export type CortexIntent =
  | 'start-new'        // Start new conversation/project
  | 'resume-last'      // Continue last project
  | 'review-existing'  // View existing artifacts
  | 'continue'         // Continue current activity
  | 'abort'            // Stop current execution
  | 'pause'            // Pause system
  | 'reset'            // Reset to idle
  | 'unclear';         // Could not determine intent

export interface IntentMatch {
  intent: CortexIntent;
  confidence: 'high' | 'low';
  transcript: string;
}

// ============================================================================
// KEYWORD PATTERNS
// ============================================================================

const INTENT_PATTERNS: Record<CortexIntent, string[]> = {
  'start-new': [
    'start', 'new', 'begin', 'create', 'make', 'build',
    'let\'s', 'i want', 'i need', 'help me'
  ],
  'resume-last': [
    'resume', 'continue last', 'go back', 'previous',
    'last project', 'what was i', 'where was i'
  ],
  'review-existing': [
    'review', 'show', 'list', 'what exists', 'what do i have',
    'my projects', 'see', 'view', 'display'
  ],
  'continue': [
    'continue', 'keep going', 'proceed', 'next', 'go on'
  ],
  'abort': [
    'abort', 'stop', 'cancel', 'quit', 'end', 'nevermind'
  ],
  'pause': [
    'pause', 'wait', 'hold', 'hold on'
  ],
  'reset': [
    'reset', 'restart', 'start over', 'clear'
  ],
  'unclear': [], // Fallback, no patterns
};

// ============================================================================
// INTENT DETECTION
// ============================================================================

export function detectIntent(transcript: string): IntentMatch {
  const normalized = transcript.toLowerCase().trim();

  // Check each intent pattern
  for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
    if (intent === 'unclear') continue;

    for (const pattern of patterns) {
      if (normalized.includes(pattern)) {
        return {
          intent: intent as CortexIntent,
          confidence: 'high',
          transcript,
        };
      }
    }
  }

  // No match found
  return {
    intent: 'unclear',
    confidence: 'low',
    transcript,
  };
}

// ============================================================================
// MODE TRANSITION MAPPING
// ============================================================================

export interface IntentAction {
  targetMode: CortexMode | null;  // null = no mode change
  requiresConfirmation: boolean;
  voiceResponse: string;
}

export function getIntentAction(
  intent: CortexIntent,
  currentMode: CortexMode
): IntentAction {
  switch (intent) {
    case 'start-new':
      return {
        targetMode: 'conversing',
        requiresConfirmation: false,
        voiceResponse: 'Starting new conversation. Tell me about your project.',
      };

    case 'resume-last':
      return {
        targetMode: 'reviewing-artifacts',
        requiresConfirmation: false,
        voiceResponse: 'Loading your last project.',
      };

    case 'review-existing':
      return {
        targetMode: 'reviewing-artifacts',
        requiresConfirmation: false,
        voiceResponse: 'Showing your existing projects.',
      };

    case 'continue':
      if (currentMode === 'paused') {
        return {
          targetMode: null, // Will restore previous mode
          requiresConfirmation: false,
          voiceResponse: 'Continuing.',
        };
      }
      return {
        targetMode: null,
        requiresConfirmation: false,
        voiceResponse: 'Already in progress.',
      };

    case 'abort':
      return {
        targetMode: 'idle',
        requiresConfirmation: currentMode === 'executing',
        voiceResponse: currentMode === 'executing'
          ? 'Are you sure you want to abort execution?'
          : 'Stopping.',
      };

    case 'pause':
      return {
        targetMode: 'paused',
        requiresConfirmation: false,
        voiceResponse: 'Paused. Say "continue" when ready.',
      };

    case 'reset':
      return {
        targetMode: 'idle',
        requiresConfirmation: true,
        voiceResponse: 'This will reset everything. Are you sure?',
      };

    case 'unclear':
      return {
        targetMode: null,
        requiresConfirmation: false,
        voiceResponse: 'I didn\'t understand. Can you rephrase that?',
      };
  }
}

// ============================================================================
// CLARIFICATION QUESTIONS
// ============================================================================

export function getClarificationQuestion(intent: CortexIntent): string | null {
  switch (intent) {
    case 'resume-last':
      return 'Do you want to continue your last project, or start a new one?';
    case 'review-existing':
      return 'Would you like to see all projects, or just the active ones?';
    case 'unclear':
      return 'I didn\'t catch that. Do you want to start a new project, or review existing ones?';
    default:
      return null;
  }
}

// ============================================================================
// INTENT ROUTER
// ============================================================================

class IntentRouterImpl {
  /**
   * Route intent to action
   */
  route(transcript: string, currentMode: CortexMode): IntentAction {
    const match = detectIntent(transcript);
    const action = getIntentAction(match.intent, currentMode);

    console.log(
      `[Intent Router] "${transcript}" → ${match.intent} (${match.confidence})`,
      `→ mode: ${action.targetMode || 'no change'}`
    );

    return action;
  }

  /**
   * Check if intent is valid for current mode
   */
  isIntentValidForMode(intent: CortexIntent, mode: CortexMode): boolean {
    // start-new: valid from idle, reviewing-artifacts
    if (intent === 'start-new') {
      return mode === 'idle' || mode === 'reviewing-artifacts';
    }

    // resume-last, review-existing: valid from idle
    if (intent === 'resume-last' || intent === 'review-existing') {
      return mode === 'idle';
    }

    // continue: valid from paused
    if (intent === 'continue') {
      return mode === 'paused';
    }

    // abort: valid from conversing, drafting, executing
    if (intent === 'abort') {
      return mode === 'conversing' || mode === 'drafting' || mode === 'executing';
    }

    // pause: valid from conversing, ready-to-plan, drafting, executing
    if (intent === 'pause') {
      return mode === 'conversing' || mode === 'ready-to-plan' || mode === 'drafting' || mode === 'executing';
    }

    // reset: always valid
    if (intent === 'reset') {
      return true;
    }

    // unclear: always needs clarification
    return intent === 'unclear';
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

let intentRouterInstance: IntentRouterImpl | null = null;

export function getIntentRouter(): IntentRouterImpl {
  if (!intentRouterInstance) {
    intentRouterInstance = new IntentRouterImpl();
  }
  return intentRouterInstance;
}
