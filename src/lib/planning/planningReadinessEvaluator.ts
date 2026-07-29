/**
 * Planning Readiness Evaluator
 * 
 * Evaluates whether CORTEX has gathered enough context from conversation
 * to offer planning services. Does NOT generate plans - only evaluates readiness.
 * 
 * This is the gate between Phase 2 (Conversation) and Phase 3 (Planning).
 */

import { InferredContext } from '@/lib/conversation/conversationBrain';

// ============================================================================
// TYPES
// ============================================================================

export interface PlanningReadiness {
  ready: boolean;
  confidenceScore: number; // 0.0 - 1.0
  missingInfo: string[];
  readySummary?: string; // User-friendly summary when ready
}

export interface ReadinessCriteria {
  hasProjectType: boolean;
  hasPlatformOrDeployment: boolean;
  hasFeatures: boolean;
  hasConstraintClarity: boolean;
}

// ============================================================================
// PLANNING READINESS EVALUATOR
// ============================================================================

export class PlanningReadinessEvaluator {
  private readonly READINESS_THRESHOLD = 0.75; // 75% confidence required
  private readonly CATEGORY_WEIGHT = 0.25; // Each category worth 25%

  /**
   * Evaluate if conversation has enough context to offer planning
   */
  evaluateReadiness(
    inferredContext: InferredContext,
    turnCount: number
  ): PlanningReadiness {
    const criteria = this.evaluateCriteria(inferredContext, turnCount);
    const confidenceScore = this.calculateConfidence(criteria);
    const missingInfo = this.identifyMissingInfo(criteria, inferredContext);
    const ready = confidenceScore >= this.READINESS_THRESHOLD;

    return {
      ready,
      confidenceScore,
      missingInfo,
      readySummary: ready ? this.buildReadySummary(inferredContext) : undefined,
    };
  }

  /**
   * Evaluate each readiness criterion
   */
  private evaluateCriteria(
    context: InferredContext,
    turnCount: number
  ): ReadinessCriteria {
    return {
      // Criterion 1: Project Type
      hasProjectType: this.hasProjectType(context),

      // Criterion 2: Platform OR Deployment Constraint
      hasPlatformOrDeployment: this.hasPlatformOrDeployment(context),

      // Criterion 3: Features (at least 2) OR clear goal
      hasFeatures: this.hasAdequateFeatures(context, turnCount),

      // Criterion 4: Constraint Clarity (explicit or implicit)
      hasConstraintClarity: this.hasConstraintClarity(context),
    };
  }

  /**
   * Calculate confidence score based on criteria
   */
  private calculateConfidence(criteria: ReadinessCriteria): number {
    let score = 0;

    if (criteria.hasProjectType) score += this.CATEGORY_WEIGHT;
    if (criteria.hasPlatformOrDeployment) score += this.CATEGORY_WEIGHT;
    if (criteria.hasFeatures) score += this.CATEGORY_WEIGHT;
    if (criteria.hasConstraintClarity) score += this.CATEGORY_WEIGHT;

    return Math.min(score, 1.0); // Cap at 1.0
  }

  /**
   * Identify missing information
   */
  private identifyMissingInfo(
    criteria: ReadinessCriteria,
    context: InferredContext
  ): string[] {
    const missing: string[] = [];

    if (!criteria.hasProjectType) {
      missing.push('What type of project is this? (web app, mobile app, API service, etc.)');
    }

    if (!criteria.hasPlatformOrDeployment) {
      if (!context.platform) {
        missing.push('What technology platform will you use? (React, Node.js, Python, etc.)');
      }
      if (!context.constraints || context.constraints.length === 0) {
        missing.push('Any deployment constraints? (e.g., no backend, serverless, cloud provider)');
      }
    }

    if (!criteria.hasFeatures) {
      missing.push('What are 2-3 core features this project needs?');
    }

    if (!criteria.hasConstraintClarity) {
      missing.push('Any technical constraints or limitations I should know about?');
    }

    return missing;
  }

  // --------------------------------------------------------------------------
  // CRITERION CHECKERS
  // --------------------------------------------------------------------------

  /**
   * Check if project type is defined
   */
  private hasProjectType(context: InferredContext): boolean {
    return Boolean(context.projectType && context.projectType.length > 0);
  }

  /**
   * Check if platform OR deployment constraint is defined
   */
  private hasPlatformOrDeployment(context: InferredContext): boolean {
    const hasPlatform = Boolean(context.platform && context.platform.length > 0);
    const hasDeploymentConstraint =
      context.constraints &&
      context.constraints.some((c) =>
        ['no backend', 'static', 'serverless', 'github pages', 'cloud'].some((keyword) =>
          c.toLowerCase().includes(keyword)
        )
      );

    return hasPlatform || Boolean(hasDeploymentConstraint);
  }

  /**
   * Check if adequate features are defined
   * Need at least 2 features OR a clear project goal in turn history
   */
  private hasAdequateFeatures(context: InferredContext, turnCount: number): boolean {
    const featureCount = context.features?.length || 0;

    // Need at least 2 features
    if (featureCount >= 2) {
      return true;
    }

    // OR at least 1 feature + reasonable conversation depth (4+ turns)
    if (featureCount >= 1 && turnCount >= 4) {
      return true;
    }

    return false;
  }

  /**
   * Check if constraints are clear (explicit or implicit)
   */
  private hasConstraintClarity(context: InferredContext): boolean {
    // Explicit constraints
    if (context.constraints && context.constraints.length > 0) {
      return true;
    }

    // Implicit constraints from other context
    // E.g., "GitHub Pages" platform implies "no backend" constraint
    if (context.platform?.toLowerCase().includes('github pages')) {
      return true;
    }

    // If no constraints mentioned after 6+ turns, assume "no constraints"
    // (This is implicit clarity)
    // Note: turnCount check happens in caller, so we check for platform/features combo
    const hasPlatformAndFeatures =
      Boolean(context.platform) && (context.features?.length || 0) >= 1;

    return hasPlatformAndFeatures;
  }

  // --------------------------------------------------------------------------
  // SUMMARY GENERATION
  // --------------------------------------------------------------------------

  /**
   * Build a user-friendly summary when ready
   */
  private buildReadySummary(context: InferredContext): string {
    const parts: string[] = [];

    if (context.projectType) {
      parts.push(context.projectType);
    }

    if (context.platform) {
      parts.push(`using ${context.platform}`);
    }

    if (context.features && context.features.length > 0) {
      const featureList = context.features.slice(0, 3).join(', ');
      parts.push(`with ${featureList}`);
    }

    if (context.constraints && context.constraints.length > 0) {
      const constraintList = context.constraints.slice(0, 2).join(', ');
      parts.push(`(${constraintList})`);
    }

    return parts.join(' ');
  }

  /**
   * Get the most important missing piece of info (for focused question)
   */
  getMostImportantMissing(readiness: PlanningReadiness): string | null {
    if (readiness.missingInfo.length === 0) {
      return null;
    }

    // Priority order:
    // 1. Project type (most fundamental)
    // 2. Platform/deployment
    // 3. Features
    // 4. Constraints

    // Find first missing item
    return readiness.missingInfo[0];
  }

  /**
   * Generate voice prompt for asking about missing info
   */
  generateMissingInfoPrompt(missingQuestion: string): string {
    const explanations: Record<string, string> = {
      'project type': 'This helps me understand the overall architecture and best practices to apply.',
      'platform': "Knowing your tech stack helps me suggest compatible tools and patterns.",
      'features': 'Core features drive the planning structure and task breakdown.',
      'constraints': 'Understanding limitations helps me suggest realistic solutions.',
    };

    // Find matching explanation
    let explanation = '';
    for (const [key, value] of Object.entries(explanations)) {
      if (missingQuestion.toLowerCase().includes(key)) {
        explanation = value;
        break;
      }
    }

    if (explanation) {
      return `${missingQuestion} ${explanation}`;
    }

    return missingQuestion;
  }

  /**
   * Generate voice prompt for offering planning
   */
  generatePlanningOfferPrompt(readiness: PlanningReadiness): string {
    const summary = readiness.readySummary || 'your project';

    const templates = [
      `I think I understand enough about ${summary}. Want me to break this into phases and tasks?`,
      `Got a good picture of ${summary}. Should I create a planning roadmap?`,
      `I have what I need to plan ${summary}. Ready for me to structure this into actionable steps?`,
      `${summary} - I can help plan this now. Want me to organize it into milestones?`,
    ];

    // Pick template based on confidence score
    const index = Math.floor((readiness.confidenceScore - 0.75) / 0.25 * templates.length);
    return templates[Math.min(index, templates.length - 1)];
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let instance: PlanningReadinessEvaluator | null = null;

export function getPlanningReadinessEvaluator(): PlanningReadinessEvaluator {
  if (!instance) {
    instance = new PlanningReadinessEvaluator();
  }
  return instance;
}
