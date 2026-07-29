/**
 * Phase 3A: Planning Synthesizer
 * 
 * Transforms conversation context into a structured planning draft.
 * This is THINKING, not DOING - no side effects, no persistence, no execution.
 * 
 * Pure function approach: Input (context + history) → Output (PlanningDraft)
 */

import type { ConversationState, InferredContext } from '@/lib/conversation/conversationBrain';
import type { 
  PlanningDraft, 
  PlanningSynthesisResult, 
  PlanningSynthesisOptions,
  PlanningPhase
} from './types';
import { getRateLimiter, RateLimitError } from '@/lib/ai/rateLimiter';
import { getUsageTracker } from '@/lib/ai/usageTracker';

// ============================================================================
// PLANNING SYNTHESIZER
// ============================================================================

export class PlanningSynthesizer {
  private apiKey: string;
  private model: string = 'gemini-2.5-flash-lite';
  private rateLimiter = getRateLimiter();
  private usageTracker = getUsageTracker();

  constructor() {
    // Use same API key configuration as GeminiSimpleClient
    const userKey = localStorage.getItem('cortex_gemini_api_key');
    this.apiKey = userKey || import.meta.env.VITE_GEMINI_API_KEY || '';
  }

  /**
   * Synthesize a planning draft from conversation context
   * 
   * @param conversationState - Full conversation state from ConversationBrain
   * @param options - Synthesis options
   * @returns Planning draft or error
   */
  async synthesizePlan(
    conversationState: ConversationState,
    options: PlanningSynthesisOptions = {}
  ): Promise<PlanningSynthesisResult> {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'Gemini API key not configured. Please set it in Settings.',
      };
    }

    // Check rate limits
    try {
      await this.rateLimiter.checkLimit('generateContent');
    } catch (error) {
      if (error instanceof RateLimitError) {
        return {
          success: false,
          error: `Rate limit exceeded. ${error.message}`,
        };
      }
      throw error;
    }

    // Build synthesis prompt
    const prompt = this.buildSynthesisPrompt(conversationState, options);

    try {
      const apiUrl = `https://generativelanguage.googleapis.com/v1/models/${this.model}:generateContent`;
      
      const response = await fetch(`${apiUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3, // Lower temperature for structured output
            maxOutputTokens: 2048, // Larger for planning draft
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `Gemini API error (${response.status}): ${errorText}`,
        };
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      if (!rawText) {
        return {
          success: false,
          error: 'No response from Gemini API',
        };
      }

      // Parse the JSON response
      const draft = this.parseGeminiResponse(rawText);

      if (!draft) {
        return {
          success: false,
          error: 'Failed to parse planning draft from Gemini response',
        };
      }

      // Track usage
      const tokensPrompt = data.usageMetadata?.promptTokenCount || this.estimateTokens(prompt);
      const tokensCompletion = data.usageMetadata?.candidatesTokenCount || this.estimateTokens(rawText);

      await this.usageTracker.trackRequest({
        conversationId: conversationState.conversationId,
        endpoint: 'generateContent',
        tokensPrompt,
        tokensCompletion,
        model: this.model,
      });

      return {
        success: true,
        draft,
        tokensUsed: tokensPrompt + tokensCompletion,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error during synthesis',
      };
    }
  }

  /**
   * Build the synthesis prompt for Gemini
   */
  private buildSynthesisPrompt(
    conversationState: ConversationState,
    options: PlanningSynthesisOptions
  ): string {
    const { inferredContext, turns } = conversationState;
    const maxPhases = options.maxPhases || 6;
    const includeRisks = options.includeRisks !== false;
    const includeAssumptions = options.includeAssumptions !== false;

    // Format conversation history
    const conversationHistory = turns
      .slice(-10) // Last 10 turns
      .map((turn) => `${turn.role === 'user' ? 'User' : 'CORTEX'}: ${turn.text}`)
      .join('\n');

    // Format inferred context
    const contextSummary = this.formatInferredContext(inferredContext);

    return `You are CORTEX, an AI planning assistant. You have just finished a conversation with a developer who wants help planning their project.

Your task: Generate a structured planning DRAFT (a preview, not execution).

CONVERSATION CONTEXT:
${contextSummary}

RECENT CONVERSATION:
${conversationHistory}

YOUR TASK:
Generate a JSON object representing a planning draft. This is a PREVIEW - nothing will be created automatically.

Output ONLY valid JSON in this exact structure:
{
  "projectSummary": "1-2 sentence overview",
  "goals": ["goal 1", "goal 2", "goal 3"],
  "nonGoals": ["explicit scope boundary 1", "boundary 2"],
  ${includeAssumptions ? '"assumptions": ["assumption 1", "assumption 2"],' : ''}
  ${includeRisks ? '"risks": ["risk 1", "risk 2"],' : ''}
  "phases": [
    {
      "id": "phase-1",
      "title": "Phase 1 Title",
      "intent": "Why this phase exists and what it achieves"
    }
  ]
}

RULES:
- Max ${maxPhases} phases
- Each phase should be a logical unit of work
- Phases should build on each other sequentially
- Goals = what success looks like
- Non-goals = what's explicitly out of scope
${includeAssumptions ? '- Assumptions = what we\'re assuming is true' : ''}
${includeRisks ? '- Risks = potential blockers or challenges' : ''}
- Use the inferred context and conversation to inform the plan
- Be specific and actionable

OUTPUT ONLY THE JSON - NO MARKDOWN, NO EXPLANATIONS, JUST JSON.`;
  }

  /**
   * Format inferred context for the prompt
   */
  private formatInferredContext(context: InferredContext): string {
    const parts: string[] = [];

    if (context.projectType) {
      parts.push(`Project Type: ${context.projectType}`);
    }
    if (context.platform) {
      parts.push(`Platform: ${context.platform}`);
    }
    if (context.features && context.features.length > 0) {
      parts.push(`Features: ${context.features.join(', ')}`);
    }
    if (context.constraints && context.constraints.length > 0) {
      parts.push(`Constraints: ${context.constraints.join(', ')}`);
    }
    if (context.teamSize) {
      parts.push(`Team Size: ${context.teamSize}`);
    }
    if (context.timeline) {
      parts.push(`Timeline: ${context.timeline}`);
    }

    return parts.length > 0 ? parts.join('\n') : 'No specific context available';
  }

  /**
   * Parse Gemini's JSON response into a PlanningDraft
   */
  private parseGeminiResponse(rawText: string): PlanningDraft | null {
    try {
      // Remove markdown code blocks if present
      let jsonText = rawText.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }

      const parsed = JSON.parse(jsonText);

      // Validate structure
      if (!parsed.projectSummary || !Array.isArray(parsed.goals) || !Array.isArray(parsed.phases)) {
        console.error('Invalid planning draft structure:', parsed);
        return null;
      }

      // Ensure all required fields exist
      return {
        projectSummary: parsed.projectSummary,
        goals: parsed.goals,
        nonGoals: parsed.nonGoals || [],
        assumptions: parsed.assumptions || [],
        risks: parsed.risks || [],
        phases: parsed.phases.map((phase: any, index: number) => ({
          id: phase.id || `phase-${index + 1}`,
          title: phase.title || `Phase ${index + 1}`,
          intent: phase.intent || 'No description provided',
        })),
      };
    } catch (error) {
      console.error('Failed to parse Gemini response as JSON:', error);
      console.error('Raw text:', rawText);
      return null;
    }
  }

  /**
   * Estimate token count (fallback)
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }
}

// ============================================================================
// SINGLETON
// ============================================================================

let synthesizer: PlanningSynthesizer | null = null;

export function getPlanningSynthesizer(): PlanningSynthesizer {
  if (!synthesizer) {
    synthesizer = new PlanningSynthesizer();
  }
  return synthesizer;
}
