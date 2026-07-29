/**
 * CORTEX Conversation Brain
 * 
 * Manages multi-turn conversational context for voice-based project planning.
 * Maintains conversation history, tracks open questions, and infers project context.
 * 
 * This is the "understanding layer" - it helps CORTEX behave like a planning partner
 * that gradually builds knowledge through natural conversation.
 * 
 * Phase 2.5: Now includes planning readiness evaluation.
 */

import { getPlanningReadinessEvaluator, PlanningReadiness } from '@/lib/planning/planningReadinessEvaluator';

// ============================================================================
// TYPES
// ============================================================================

export interface ConversationTurn {
  role: 'user' | 'cortex';
  text: string;
  timestamp: number;
}

export interface InferredContext {
  projectType?: string;      // e.g., "web app", "mobile app", "API service"
  platform?: string;          // e.g., "React", "Node.js", "Python Flask"
  constraints?: string[];     // e.g., ["no backend", "GitHub Pages only"]
  features?: string[];        // e.g., ["authentication", "real-time updates"]
  teamSize?: string;          // e.g., "solo", "small team"
  timeline?: string;          // e.g., "2 weeks", "MVP in 1 month"
}

export interface ConversationState {
  turns: ConversationTurn[];
  openQuestions: string[];
  inferredContext: InferredContext;
  conversationId: string;
  startedAt: number;
}

export type ResponseStrategy = 'ask' | 'acknowledge' | 'clarify' | 'summarize' | 'offer-planning';

// ============================================================================
// CONVERSATION BRAIN
// ============================================================================

export class ConversationBrain {
  private state: ConversationState;
  private readonly MAX_CONTEXT_TURNS = 10; // Last N turns sent to Gemini

  constructor() {
    this.state = this.initializeState();
  }

  // --------------------------------------------------------------------------
  // INITIALIZATION
  // --------------------------------------------------------------------------

  private initializeState(): ConversationState {
    return {
      turns: [],
      openQuestions: [],
      inferredContext: {},
      conversationId: this.generateConversationId(),
      startedAt: Date.now(),
    };
  }

  private generateConversationId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // --------------------------------------------------------------------------
  // TURN MANAGEMENT
  // --------------------------------------------------------------------------

  /**
   * Add a user's spoken input to the conversation
   */
  addUserTurn(text: string): void {
    this.state.turns.push({
      role: 'user',
      text: text.trim(),
      timestamp: Date.now(),
    });

    // Attempt to infer context from user input
    this.updateInferredContext(text);
  }

  /**
   * Add CORTEX's spoken response to the conversation
   */
  addCortexTurn(text: string): void {
    this.state.turns.push({
      role: 'cortex',
      text: text.trim(),
      timestamp: Date.now(),
    });

    // Track new questions asked by CORTEX
    this.extractOpenQuestions(text);
  }

  /**
   * Get the full conversation history
   */
  getTurns(): ConversationTurn[] {
    return [...this.state.turns];
  }

  /**
   * Get the last N turns for context window
   */
  getRecentTurns(count: number = this.MAX_CONTEXT_TURNS): ConversationTurn[] {
    return this.state.turns.slice(-count);
  }

  // --------------------------------------------------------------------------
  // CONTEXT INFERENCE
  // --------------------------------------------------------------------------

  /**
   * Update inferred context based on user input (simple heuristics)
   */
  private updateInferredContext(userInput: string): void {
    const lower = userInput.toLowerCase();

    // Detect project type
    if (!this.state.inferredContext.projectType) {
      if (lower.includes('web app') || lower.includes('website')) {
        this.state.inferredContext.projectType = 'web app';
      } else if (lower.includes('mobile') || lower.includes('ios') || lower.includes('android')) {
        this.state.inferredContext.projectType = 'mobile app';
      } else if (lower.includes('api') || lower.includes('backend') || lower.includes('service')) {
        this.state.inferredContext.projectType = 'API service';
      } else if (lower.includes('dashboard') || lower.includes('admin')) {
        this.state.inferredContext.projectType = 'dashboard';
      }
    }

    // Detect platform
    if (!this.state.inferredContext.platform) {
      if (lower.includes('react')) {
        this.state.inferredContext.platform = 'React';
      } else if (lower.includes('vue')) {
        this.state.inferredContext.platform = 'Vue';
      } else if (lower.includes('node') || lower.includes('express')) {
        this.state.inferredContext.platform = 'Node.js';
      } else if (lower.includes('python') || lower.includes('flask') || lower.includes('django')) {
        this.state.inferredContext.platform = 'Python';
      } else if (lower.includes('next')) {
        this.state.inferredContext.platform = 'Next.js';
      }
    }

    // Detect constraints
    if (!this.state.inferredContext.constraints) {
      this.state.inferredContext.constraints = [];
    }

    if (lower.includes('no backend') || lower.includes('static') || lower.includes('github pages')) {
      if (!this.state.inferredContext.constraints.includes('no backend')) {
        this.state.inferredContext.constraints.push('no backend');
      }
    }

    if (lower.includes('mobile first') || lower.includes('responsive')) {
      if (!this.state.inferredContext.constraints.includes('mobile-first')) {
        this.state.inferredContext.constraints.push('mobile-first');
      }
    }

    // Detect features
    if (!this.state.inferredContext.features) {
      this.state.inferredContext.features = [];
    }

    const featureKeywords = [
      'auth', 'authentication', 'login', 'real-time', 'payment', 
      'search', 'notification', 'chat', 'upload', 'analytics'
    ];

    featureKeywords.forEach((keyword) => {
      if (lower.includes(keyword) && !this.state.inferredContext.features?.includes(keyword)) {
        this.state.inferredContext.features?.push(keyword);
      }
    });
  }

  /**
   * Extract questions from CORTEX's response to track unresolved items
   */
  private extractOpenQuestions(cortexResponse: string): void {
    // Simple heuristic: if response ends with '?', it's a question
    const sentences = cortexResponse.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
    
    sentences.forEach((sentence) => {
      if (cortexResponse.includes(sentence + '?')) {
        this.state.openQuestions.push(sentence);
      }
    });

    // Keep only last 3 open questions
    if (this.state.openQuestions.length > 3) {
      this.state.openQuestions = this.state.openQuestions.slice(-3);
    }
  }

  /**
   * Get current inferred context
   */
  getInferredContext(): InferredContext {
    return { ...this.state.inferredContext };
  }

  /**
   * Get open questions
   */
  getOpenQuestions(): string[] {
    return [...this.state.openQuestions];
  }

  // --------------------------------------------------------------------------
  // PLANNING READINESS (Phase 2.5)
  // --------------------------------------------------------------------------

  /**
   * Evaluate if enough context exists to offer planning
   */
  evaluatePlanningReadiness(): PlanningReadiness {
    const evaluator = getPlanningReadinessEvaluator();
    return evaluator.evaluateReadiness(
      this.state.inferredContext,
      this.state.turns.length
    );
  }

  // --------------------------------------------------------------------------
  // RESPONSE STRATEGY
  // --------------------------------------------------------------------------

  /**
   * Decide how CORTEX should respond based on conversation state
   * Phase 2.5: Now checks planning readiness
   */
  decideResponseStrategy(): ResponseStrategy {
    const turnCount = this.state.turns.length;
    const hasContext = Object.keys(this.state.inferredContext).length > 0;

    // Phase 2.5: Check planning readiness (but only after 4+ turns)
    if (turnCount >= 4) {
      const readiness = this.evaluatePlanningReadiness();
      if (readiness.ready) {
        return 'offer-planning';
      }
    }

    // Early conversation: Ask questions
    if (turnCount < 4) {
      return 'ask';
    }

    // Mid conversation: Clarify ambiguities
    if (turnCount < 8 && !hasContext) {
      return 'clarify';
    }

    // Later conversation: Acknowledge and maybe summarize
    if (turnCount >= 8 && hasContext) {
      // Every 4th turn, summarize understanding
      if (turnCount % 4 === 0) {
        return 'summarize';
      }
      return 'acknowledge';
    }

    // Default: Ask questions
    return 'ask';
  }

  // --------------------------------------------------------------------------
  // GEMINI PROMPT BUILDING
  // --------------------------------------------------------------------------

  /**
   * Build the system prompt for Gemini based on response strategy
   */
  buildSystemPrompt(strategy: ResponseStrategy): string {
    const basePrompt = `You are CORTEX, a senior software architect brainstorming with a developer.

Your role is to understand their project idea through natural conversation before planning it.

PERSONALITY:
- Conversational and supportive
- Ask one focused question at a time
- Show genuine curiosity
- Remember what was discussed earlier

RESPONSE RULES:
- Keep responses short (1-3 sentences)
- Speak naturally (this will be spoken aloud)
- Prefer questions over solutions at this stage
- Acknowledge user's input before asking follow-ups`;

    const strategyGuidance: Record<ResponseStrategy, string> = {
      ask: '\n\nCURRENT STRATEGY: Ask a clarifying question to understand the project better. Focus on core aspects like purpose, users, or key features.',
      
      acknowledge: '\n\nCURRENT STRATEGY: Acknowledge what the user just said, then ask a follow-up question if needed.',
      
      clarify: '\n\nCURRENT STRATEGY: Something is unclear or ambiguous. Ask a specific question to resolve the ambiguity.',
      
      summarize: '\n\nCURRENT STRATEGY: Briefly summarize your understanding so far (in 2-3 sentences), then ask what to explore next.',
      
      'offer-planning': '\n\nCURRENT STRATEGY: You have enough context to begin planning. Summarize your understanding (1-2 sentences), then ASK FOR CONSENT to create a planning roadmap. Example: "I think I understand enough about [summary]. Want me to break this into phases and tasks?" Do NOT proceed without user confirmation.',
    };

    return basePrompt + strategyGuidance[strategy];
  }

  /**
   * Build the full prompt for Gemini with conversation history
   */
  buildPromptWithContext(strategy: ResponseStrategy): string {
    const systemPrompt = this.buildSystemPrompt(strategy);
    const recentTurns = this.getRecentTurns();

    // Format conversation history
    const history = recentTurns
      .map((turn) => `${turn.role === 'user' ? 'Developer' : 'CORTEX'}: ${turn.text}`)
      .join('\n\n');

    // Add context summary if available
    let contextSummary = '';
    if (Object.keys(this.state.inferredContext).length > 0) {
      contextSummary = '\n\nINFERRED CONTEXT:\n';
      if (this.state.inferredContext.projectType) {
        contextSummary += `- Project Type: ${this.state.inferredContext.projectType}\n`;
      }
      if (this.state.inferredContext.platform) {
        contextSummary += `- Platform: ${this.state.inferredContext.platform}\n`;
      }
      if (this.state.inferredContext.constraints?.length) {
        contextSummary += `- Constraints: ${this.state.inferredContext.constraints.join(', ')}\n`;
      }
      if (this.state.inferredContext.features?.length) {
        contextSummary += `- Features: ${this.state.inferredContext.features.join(', ')}\n`;
      }
    }

    return `${systemPrompt}${contextSummary}\n\n---\n\nCONVERSATION HISTORY:\n${history}\n\n---\n\nRespond as CORTEX (naturally, as if speaking aloud):`;
  }

  // --------------------------------------------------------------------------
  // RESET / EXPORT
  // --------------------------------------------------------------------------

  /**
   * Reset conversation (start fresh)
   */
  reset(): void {
    this.state = this.initializeState();
  }

  /**
   * Get full conversation state (for debugging or export)
   */
  exportState(): ConversationState {
    return JSON.parse(JSON.stringify(this.state));
  }

  /**
   * Get conversation metadata
   */
  getMetadata() {
    return {
      conversationId: this.state.conversationId,
      turnCount: this.state.turns.length,
      startedAt: this.state.startedAt,
      duration: Date.now() - this.state.startedAt,
      hasContext: Object.keys(this.state.inferredContext).length > 0,
    };
  }
}

// ============================================================================
// SINGLETON INSTANCE (optional, can be instantiated per-conversation)
// ============================================================================

let instance: ConversationBrain | null = null;

export function getConversationBrain(): ConversationBrain {
  if (!instance) {
    instance = new ConversationBrain();
  }
  return instance;
}

export function resetConversationBrain(): void {
  instance = null;
}
