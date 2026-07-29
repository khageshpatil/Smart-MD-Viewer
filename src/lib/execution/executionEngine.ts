/**
 * Phase 3B: Execution Engine
 * 
 * Executes an ExecutionPlan step-by-step, materializing artifacts into IndexedDB.
 * This is DETERMINISTIC - no AI, no randomness.
 * 
 * Features:
 * - Sequential step execution
 * - Progress events
 * - Error handling (stop on first error)
 * - IndexedDB persistence
 */

import type {
  ExecutionPlan,
  ExecutionStep,
  ExecutionProgress,
  ExecutionLogEntry,
  Project,
  Phase,
  Task,
  Document,
} from './types';
import {
  getProjectRepository,
  getPhaseRepository,
  getTaskRepository,
  getDocumentRepository,
} from './repositories';

// ============================================================================
// EXECUTION ENGINE
// ============================================================================

export type ExecutionEventType =
  | 'execution-started'
  | 'step-started'
  | 'step-completed'
  | 'execution-completed'
  | 'execution-error'
  | 'progress-updated';

export interface ExecutionEvent {
  type: ExecutionEventType;
  progress: ExecutionProgress;
  log?: ExecutionLogEntry;
}

export type ExecutionEventHandler = (event: ExecutionEvent) => void;

export class ExecutionEngine {
  private eventHandlers: ExecutionEventHandler[] = [];
  private currentExecution: ExecutionProgress | null = null;
  private abortRequested: boolean = false;

  /**
   * Subscribe to execution events
   */
  on(handler: ExecutionEventHandler): () => void {
    this.eventHandlers.push(handler);
    // Return unsubscribe function
    return () => {
      const index = this.eventHandlers.indexOf(handler);
      if (index !== -1) {
        this.eventHandlers.splice(index, 1);
      }
    };
  }

  /**
   * Emit an event
   */
  private emit(event: ExecutionEvent): void {
    this.eventHandlers.forEach((handler) => {
      try {
        handler(event);
      } catch (error) {
        console.error('Error in execution event handler:', error);
      }
    });
  }

  /**
   * Execute the plan
   * 
   * @param plan - The execution plan to execute
   * @returns Final execution progress
   */
  async execute(plan: ExecutionPlan): Promise<ExecutionProgress> {
    this.abortRequested = false;

    // Initialize progress
    const progress: ExecutionProgress = {
      planId: plan.id,
      currentStepIndex: -1,
      completedSteps: 0,
      totalSteps: plan.totalSteps,
      percentage: 0,
      status: 'executing',
      startedAt: Date.now(),
    };

    this.currentExecution = progress;

    // Emit start event
    this.emit({
      type: 'execution-started',
      progress: { ...progress },
      log: {
        timestamp: Date.now(),
        stepId: 'init',
        message: 'Starting execution...',
        level: 'info',
      },
    });

    try {
      // Execute each step sequentially
      for (let i = 0; i < plan.steps.length; i++) {
        if (this.abortRequested) {
          throw new Error('Execution aborted by user');
        }

        const step = plan.steps[i];

        // Update progress - step started
        progress.currentStepIndex = i;
        progress.currentStep = step;
        progress.percentage = Math.round((i / plan.totalSteps) * 100);

        this.emit({
          type: 'step-started',
          progress: { ...progress },
          log: {
            timestamp: Date.now(),
            stepId: step.id,
            message: step.description,
            level: 'info',
          },
        });

        // Execute the step
        await this.executeStep(step);

        // Update progress - step completed
        progress.completedSteps = i + 1;
        progress.percentage = Math.round(((i + 1) / plan.totalSteps) * 100);

        this.emit({
          type: 'step-completed',
          progress: { ...progress },
          log: {
            timestamp: Date.now(),
            stepId: step.id,
            message: `Completed: ${step.description}`,
            level: 'success',
          },
        });
      }

      // Execution completed successfully
      progress.status = 'completed';
      progress.completedAt = Date.now();
      progress.percentage = 100;

      this.emit({
        type: 'execution-completed',
        progress: { ...progress },
        log: {
          timestamp: Date.now(),
          stepId: 'complete',
          message: `Execution completed: ${plan.totalSteps} steps executed`,
          level: 'success',
        },
      });

      this.currentExecution = null;
      return progress;
    } catch (error) {
      // Execution failed
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      progress.status = 'error';
      progress.error = {
        message: errorMessage,
        stepId: progress.currentStep?.id || 'unknown',
      };
      progress.completedAt = Date.now();

      this.emit({
        type: 'execution-error',
        progress: { ...progress },
        log: {
          timestamp: Date.now(),
          stepId: progress.currentStep?.id || 'unknown',
          message: `Execution failed: ${errorMessage}`,
          level: 'error',
        },
      });

      this.currentExecution = null;
      throw error;
    }
  }

  /**
   * Execute a single step
   */
  private async executeStep(step: ExecutionStep): Promise<void> {
    switch (step.type) {
      case 'create-project':
        await this.createProject(step.payload as Project);
        break;
      case 'create-phase':
        await this.createPhase(step.payload as Phase);
        break;
      case 'create-task':
        await this.createTask(step.payload as Task);
        break;
      case 'create-document':
        await this.createDocument(step.payload as Document);
        break;
      default:
        throw new Error(`Unknown step type: ${(step as any).type}`);
    }
  }

  /**
   * Create project in IndexedDB
   */
  private async createProject(project: Project): Promise<void> {
    const repo = getProjectRepository();
    await repo.create(project);
  }

  /**
   * Create phase in IndexedDB
   */
  private async createPhase(phase: Phase): Promise<void> {
    const repo = getPhaseRepository();
    await repo.create(phase);
  }

  /**
   * Create task in IndexedDB
   */
  private async createTask(task: Task): Promise<void> {
    const repo = getTaskRepository();
    await repo.create(task);
  }

  /**
   * Create document in IndexedDB
   */
  private async createDocument(document: Document): Promise<void> {
    const repo = getDocumentRepository();
    await repo.create(document);
  }

  /**
   * Abort the current execution
   */
  abort(): void {
    if (this.currentExecution && this.currentExecution.status === 'executing') {
      this.abortRequested = true;
    }
  }

  /**
   * Get current execution progress
   */
  getCurrentProgress(): ExecutionProgress | null {
    return this.currentExecution ? { ...this.currentExecution } : null;
  }

  /**
   * Check if execution is in progress
   */
  isExecuting(): boolean {
    return this.currentExecution !== null && this.currentExecution.status === 'executing';
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

let engine: ExecutionEngine | null = null;

export function getExecutionEngine(): ExecutionEngine {
  if (!engine) {
    engine = new ExecutionEngine();
  }
  return engine;
}
