/**
 * Gemini Simple Client
 * Enhanced with rate limiting, usage tracking (Phase 1)
 * and conversation context (Phase 2)
 * Returns only spokenText for voice responses
 */

import { getRateLimiter, RateLimitError } from './rateLimiter';
import { getUsageTracker, UsageTracker } from './usageTracker';
import { ConversationBrain } from '@/lib/conversation/conversationBrain';

export class GeminiSimpleClient {
  private apiKey: string;
  private apiUrl: string;
  private model: string = 'gemini-2.5-flash-lite';
  private rateLimiter = getRateLimiter();
  private usageTracker = getUsageTracker();
  private conversationBrain: ConversationBrain | null = null;

  constructor(conversationBrain?: ConversationBrain) {
    // Priority: User-configured API key > Environment variable
    const userKey = localStorage.getItem('cortex_gemini_api_key');
    this.apiKey = userKey || import.meta.env.VITE_GEMINI_API_KEY || '';
    this.apiUrl = `https://generativelanguage.googleapis.com/v1/models/${this.model}:generateContent`;
    
    // Phase 2: Optional conversation context
    if (conversationBrain) {
      this.conversationBrain = conversationBrain;
    }
  }

  /**
   * Set conversation brain (for Phase 2 context-aware prompts)
   */
  setConversationBrain(conversationBrain: ConversationBrain): void {
    this.conversationBrain = conversationBrain;
  }

  /**
   * Check if API key is configured
   */
  isConfigured(): boolean {
    return this.apiKey.length > 0;
  }

  /**
   * Send a message to Gemini and get a spoken response
   * @param message - User's message (will be enhanced with conversation context if available)
   * @param signal - Optional AbortSignal for cancellation
   * @param conversationId - Optional conversation ID for usage tracking
   */
  async chat(
    message: string,
    signal?: AbortSignal,
    conversationId: string = 'default'
  ): Promise<{ spokenText: string }> {
    if (!this.isConfigured()) {
      throw new Error('Gemini API key not configured. Please set VITE_GEMINI_API_KEY in your .env file or configure in Settings.');
    }

    // Check rate limits before making request
    try {
      await this.rateLimiter.checkLimit('generateContent');
    } catch (error) {
      if (error instanceof RateLimitError) {
        // Re-throw with user-friendly message
        throw new Error(
          `Rate limit exceeded. ${error.message}\nPlease wait before trying again.`
        );
      }
      throw error;
    }

    // Phase 2: Build conversation-aware prompt if ConversationBrain is available
    let fullPrompt = message;
    if (this.conversationBrain) {
      const strategy = this.conversationBrain.decideResponseStrategy();
      fullPrompt = this.conversationBrain.buildPromptWithContext(strategy);
    }

    try {
      const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal, // Support cancellation
        body: JSON.stringify({
          contents: [{ parts: [{ text: fullPrompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 200, // Short responses for spoken output
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      const spokenText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response from AI';

      // Track usage
      const tokensPrompt = data.usageMetadata?.promptTokenCount || this.estimateTokens(fullPrompt);
      const tokensCompletion = data.usageMetadata?.candidatesTokenCount || this.estimateTokens(spokenText);

      await this.usageTracker.trackRequest({
        conversationId,
        endpoint: 'generateContent',
        tokensPrompt,
        tokensCompletion,
        model: this.model,
      });

      return { spokenText };
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw error; // Re-throw abort errors as-is
        }
        throw new Error(`Failed to call Gemini API: ${error.message}`);
      }
      throw new Error('Unknown error calling Gemini API');
    }
  }

  /**
   * Rough estimation of token count (fallback if API doesn't return counts)
   * 1 token ≈ 4 characters for English
   */
  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Update API key (useful for user configuration)
   */
  setApiKey(apiKey: string): void {
    this.apiKey = apiKey;
    localStorage.setItem('cortex_gemini_api_key', apiKey);
  }

  /**
   * Get usage statistics
   */
  async getUsageStats() {
    return await this.usageTracker.getUsageReport();
  }

  /**
   * Get rate limit statistics
   */
  getRateLimitStats() {
    return this.rateLimiter.getUsageStats();
  }
}
