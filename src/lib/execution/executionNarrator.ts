/**
 * Phase 3B: Execution Narrator
 * 
 * Converts execution steps and events into short, voice-friendly sentences.
 * Used by SpeechController to narrate execution progress.
 * 
 * NO AI - just deterministic text templates.
 */

import type { ExecutionEvent, ExecutionEventType } from './executionEngine';
import type { ExecutionStep } from './types';

// ============================================================================
// EXECUTION NARRATOR
// ============================================================================

export class ExecutionNarrator {
  /**
   * Get voice narration for an execution event
   * 
   * @param event - The execution event
   * @returns Short sentence for voice output
   */
  narrate(event: ExecutionEvent): string {
    switch (event.type) {
      case 'execution-started':
        return this.narrateStart(event);
      case 'step-started':
        return this.narrateStepStart(event);
      case 'step-completed':
        return this.narrateStepComplete(event);
      case 'execution-completed':
        return this.narrateComplete(event);
      case 'execution-error':
        return this.narrateError(event);
      case 'progress-updated':
        return this.narrateProgress(event);
      default:
        return 'Processing...';
    }
  }

  /**
   * Narrate execution start
   */
  private narrateStart(event: ExecutionEvent): string {
    const { totalSteps } = event.progress;
    return `Starting execution. Creating your plan with ${totalSteps} steps.`;
  }

  /**
   * Narrate step start
   */
  private narrateStepStart(event: ExecutionEvent): string {
    const { currentStep } = event.progress;
    if (!currentStep) {
      return 'Processing next step...';
    }

    // Use the step's voiceNarration if available
    if (currentStep.voiceNarration) {
      return currentStep.voiceNarration;
    }

    // Fallback to description
    return currentStep.description;
  }

  /**
   * Narrate step completion
   */
  private narrateStepComplete(event: ExecutionEvent): string {
    const { currentStep, percentage } = event.progress;
    
    // Only narrate milestones (every 25%)
    if (percentage % 25 === 0 && percentage > 0 && percentage < 100) {
      return `${percentage}% complete.`;
    }

    // Don't narrate every single step completion (too verbose)
    return '';
  }

  /**
   * Narrate execution completion
   */
  private narrateComplete(event: ExecutionEvent): string {
    const { completedSteps } = event.progress;
    return `Planning complete! Created ${completedSteps} artifacts. Your project is ready.`;
  }

  /**
   * Narrate execution error
   */
  private narrateError(event: ExecutionEvent): string {
    const { error } = event.progress;
    return `Execution failed: ${error}. Please try again.`;
  }

  /**
   * Narrate progress update
   */
  private narrateProgress(event: ExecutionEvent): string {
    const { percentage } = event.progress;
    return `${percentage}% complete.`;
  }

  /**
   * Get summary narration (for UI display)
   */
  getSummary(event: ExecutionEvent): string {
    const { completedSteps, totalSteps, percentage, status } = event.progress;

    if (status === 'executing') {
      return `Executing step ${completedSteps + 1} of ${totalSteps} (${percentage}%)`;
    } else if (status === 'completed') {
      return `Execution completed: ${completedSteps}/${totalSteps} steps`;
    } else if (status === 'error') {
      return `Execution failed at step ${completedSteps + 1}/${totalSteps}`;
    } else {
      return `Ready to execute ${totalSteps} steps`;
    }
  }

  /**
   * Get narration for a specific step (without event context)
   */
  narrateStep(step: ExecutionStep, index: number, total: number): string {
    if (step.voiceNarration) {
      return step.voiceNarration;
    }

    // Fallback: simple narration
    return `Step ${index + 1} of ${total}: ${step.description}`;
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

let narrator: ExecutionNarrator | null = null;

export function getExecutionNarrator(): ExecutionNarrator {
  if (!narrator) {
    narrator = new ExecutionNarrator();
  }
  return narrator;
}
