/**
 * Phase 3B: Execution Planner
 * 
 * Transforms a PlanningDraft (preview) into an ExecutionPlan (steps to materialize artifacts).
 * This is a PURE FUNCTION - no AI, no side effects, deterministic output.
 * 
 * Strategy:
 * 1. Create project (1 step)
 * 2. Create each phase (N steps)
 * 3. Create tasks for each phase (1-3 tasks per phase)
 * 4. Create HLD document (1 step)
 * 5. Create LLD document (1 step)
 */

import { v4 as uuidv4 } from 'uuid';
import type { PlanningDraft } from '@/lib/planning/types';
import type {
  ExecutionPlan,
  ExecutionStep,
  Project,
  Phase,
  Task,
  Document,
} from './types';

// ============================================================================
// EXECUTION PLANNER
// ============================================================================

export class ExecutionPlanner {
  /**
   * Generate an execution plan from a planning draft
   * 
   * @param draft - The approved planning draft
   * @param conversationId - ID of the source conversation
   * @returns ExecutionPlan with ordered steps
   */
  generatePlan(draft: PlanningDraft, conversationId: string): ExecutionPlan {
    const planId = uuidv4();
    const steps: ExecutionStep[] = [];

    // Generate IDs for entities (used in payloads)
    const projectId = uuidv4();
    const phaseIds = draft.phases.map(() => uuidv4());

    // Step 1: Create Project
    steps.push(this.createProjectStep(projectId, draft, conversationId));

    // Step 2-N: Create Phases
    draft.phases.forEach((phase, index) => {
      steps.push(this.createPhaseStep(phaseIds[index], projectId, phase, index));
    });

    // Step N+1 onwards: Create Tasks for each Phase
    draft.phases.forEach((phase, phaseIndex) => {
      const tasksForPhase = this.generateTasksForPhase(phase);
      tasksForPhase.forEach((taskData, taskIndex) => {
        steps.push(
          this.createTaskStep(
            phaseIds[phaseIndex],
            projectId,
            taskData.title,
            taskData.description,
            taskIndex
          )
        );
      });
    });

    // Step: Create HLD Document
    steps.push(this.createDocumentStep(projectId, 'hld', draft));

    // Step: Create LLD Document
    steps.push(this.createDocumentStep(projectId, 'lld', draft));

    return {
      id: planId,
      conversationId,
      steps,
      totalSteps: steps.length,
      estimatedDuration: this.estimateDuration(steps.length),
      createdAt: Date.now(),
    };
  }

  /**
   * Create project step
   */
  private createProjectStep(
    projectId: string,
    draft: PlanningDraft,
    conversationId: string
  ): ExecutionStep {
    // Extract project name from summary (first 50 chars)
    const projectName = this.extractProjectName(draft.projectSummary);

    const project: Project = {
      id: projectId,
      name: projectName,
      summary: draft.projectSummary,
      goals: draft.goals,
      nonGoals: draft.nonGoals,
      assumptions: draft.assumptions,
      risks: draft.risks,
      status: 'active',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      conversationId,
    };

    return {
      id: uuidv4(),
      type: 'create-project',
      description: `Create project: ${projectName}`,
      voiceNarration: `Creating project ${projectName}`,
      payload: project,
    };
  }

  /**
   * Create phase step
   */
  private createPhaseStep(
    phaseId: string,
    projectId: string,
    phase: { id: string; title: string; intent: string },
    order: number
  ): ExecutionStep {
    const phaseEntity: Phase = {
      id: phaseId,
      projectId,
      title: phase.title,
      intent: phase.intent,
      order,
      status: 'pending',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    return {
      id: uuidv4(),
      type: 'create-phase',
      description: `Create phase: ${phase.title}`,
      voiceNarration: `Creating phase ${order + 1}: ${phase.title}`,
      payload: phaseEntity,
    };
  }

  /**
   * Create task step
   */
  private createTaskStep(
    phaseId: string,
    projectId: string,
    title: string,
    description: string,
    order: number
  ): ExecutionStep {
    const task: Task = {
      id: uuidv4(),
      phaseId,
      projectId,
      title,
      description,
      order,
      status: 'pending',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    return {
      id: uuidv4(),
      type: 'create-task',
      description: `Create task: ${title}`,
      voiceNarration: `Adding task: ${title}`,
      payload: task,
    };
  }

  /**
   * Create document step
   */
  private createDocumentStep(
    projectId: string,
    type: 'hld' | 'lld',
    draft: PlanningDraft
  ): ExecutionStep {
    const title = type === 'hld' ? 'High-Level Design' : 'Low-Level Design';
    const content = this.generateDocumentContent(type, draft);

    const document: Document = {
      id: uuidv4(),
      projectId,
      type,
      title,
      content,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    return {
      id: uuidv4(),
      type: 'create-document',
      description: `Create ${title} document`,
      voiceNarration: `Generating ${title}`,
      payload: document,
    };
  }

  /**
   * Generate tasks for a phase based on its intent
   * Deterministic task generation (no AI)
   */
  private generateTasksForPhase(phase: { title: string; intent: string }): Array<{ title: string; description: string }> {
    // Simple heuristic-based task generation
    // In a real system, this could be more sophisticated
    
    const keywords = phase.intent.toLowerCase();

    // Common task patterns based on keywords
    const tasks: Array<{ title: string; description: string }> = [];

    if (keywords.includes('setup') || keywords.includes('initialize') || keywords.includes('configure')) {
      tasks.push({
        title: 'Initial setup and configuration',
        description: `${phase.intent} - Focus on core setup steps.`,
      });
    }

    if (keywords.includes('implement') || keywords.includes('build') || keywords.includes('create')) {
      tasks.push({
        title: 'Core implementation',
        description: `${phase.intent} - Build main functionality.`,
      });
    }

    if (keywords.includes('test') || keywords.includes('quality') || keywords.includes('validation')) {
      tasks.push({
        title: 'Testing and validation',
        description: `${phase.intent} - Ensure quality and correctness.`,
      });
    }

    if (keywords.includes('deploy') || keywords.includes('release') || keywords.includes('launch')) {
      tasks.push({
        title: 'Deployment and release',
        description: `${phase.intent} - Deploy to environment.`,
      });
    }

    if (keywords.includes('document') || keywords.includes('documentation')) {
      tasks.push({
        title: 'Documentation',
        description: `${phase.intent} - Create necessary documentation.`,
      });
    }

    // If no specific keywords matched, create generic tasks
    if (tasks.length === 0) {
      tasks.push({
        title: `Complete ${phase.title}`,
        description: phase.intent,
      });
    }

    // Limit to 3 tasks per phase
    return tasks.slice(0, 3);
  }

  /**
   * Generate document content (markdown)
   */
  private generateDocumentContent(type: 'hld' | 'lld', draft: PlanningDraft): string {
    if (type === 'hld') {
      return this.generateHLD(draft);
    } else {
      return this.generateLLD(draft);
    }
  }

  /**
   * Generate High-Level Design document
   */
  private generateHLD(draft: PlanningDraft): string {
    return `# High-Level Design

## Project Summary

${draft.projectSummary}

## Goals

${draft.goals.map((g) => `- ${g}`).join('\n')}

## Non-Goals (Out of Scope)

${draft.nonGoals.length > 0 ? draft.nonGoals.map((ng) => `- ${ng}`).join('\n') : 'None specified'}

## Assumptions

${draft.assumptions.length > 0 ? draft.assumptions.map((a) => `- ${a}`).join('\n') : 'None specified'}

## Risks

${draft.risks.length > 0 ? draft.risks.map((r) => `- ${r}`).join('\n') : 'None identified'}

## Implementation Phases

${draft.phases.map((p, idx) => `### Phase ${idx + 1}: ${p.title}\n\n${p.intent}`).join('\n\n')}

---

*Generated by CORTEX Planning System*
`;
  }

  /**
   * Generate Low-Level Design document
   */
  private generateLLD(draft: PlanningDraft): string {
    return `# Low-Level Design

## Project Overview

${draft.projectSummary}

## Detailed Phase Breakdown

${draft.phases.map((p, idx) => {
  const tasks = this.generateTasksForPhase(p);
  return `### Phase ${idx + 1}: ${p.title}

**Intent**: ${p.intent}

**Tasks**:
${tasks.map((t, tidx) => `${tidx + 1}. **${t.title}**: ${t.description}`).join('\n')}
`;
}).join('\n\n')}

## Technical Considerations

### Goals
${draft.goals.map((g) => `- ${g}`).join('\n')}

### Constraints
${draft.nonGoals.length > 0 ? draft.nonGoals.map((ng) => `- ${ng}`).join('\n') : 'None specified'}

### Risk Mitigation
${draft.risks.length > 0 ? draft.risks.map((r) => `- **Risk**: ${r}`).join('\n') : 'No risks identified'}

---

*Generated by CORTEX Planning System*
`;
  }

  /**
   * Extract project name from summary
   */
  private extractProjectName(summary: string): string {
    // Take first sentence or first 50 chars
    const firstSentence = summary.split('.')[0];
    const name = firstSentence.length <= 50 ? firstSentence : firstSentence.substring(0, 50);
    return name.trim();
  }

  /**
   * Estimate execution duration (rough heuristic)
   */
  private estimateDuration(stepCount: number): number {
    // 200ms per step (conservative estimate)
    return stepCount * 0.2;
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

let planner: ExecutionPlanner | null = null;

export function getExecutionPlanner(): ExecutionPlanner {
  if (!planner) {
    planner = new ExecutionPlanner();
  }
  return planner;
}
