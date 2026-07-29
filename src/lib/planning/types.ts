/**
 * Phase 3A: Planning Types
 * 
 * Type definitions for planning synthesis and preview.
 * These types represent planning DRAFTS - not executed artifacts.
 */

/**
 * A planning phase representing a logical group of work
 */
export interface PlanningPhase {
  id: string;
  title: string;
  intent: string; // Why this phase exists
}

/**
 * A structured planning draft generated from conversation context
 * 
 * This is a PREVIEW - nothing has been created yet.
 * User can review, revise, or approve for execution.
 */
export interface PlanningDraft {
  projectSummary: string;      // 1-2 sentence overview
  goals: string[];             // What success looks like
  nonGoals: string[];          // Explicit scope boundaries
  assumptions: string[];       // What we're assuming is true
  risks: string[];             // Potential blockers or challenges
  phases: PlanningPhase[];     // Logical breakdown of work
}

/**
 * Result of planning synthesis attempt
 */
export interface PlanningSynthesisResult {
  success: boolean;
  draft?: PlanningDraft;
  error?: string;
  tokensUsed?: number;
}

/**
 * Options for planning synthesis
 */
export interface PlanningSynthesisOptions {
  maxPhases?: number;          // Max number of phases (default: 6)
  includeRisks?: boolean;      // Include risk analysis (default: true)
  includeAssumptions?: boolean; // Include assumptions (default: true)
}
