/**
 * Natural Language AI
 * AI understands natural conversation and decides actions internally
 */

import { SystemContext, AIMessage } from "@/types/ai";
import { callGeminiConversation } from "./gemini";

/**
 * Get AI response in natural conversation
 * AI understands user intent and decides what action to take
 */
export async function getNaturalAIResponse(
  conversationHistory: AIMessage[],
  systemContext: SystemContext
): Promise<string> {
  // Build system prompt that makes AI understand it should:
  // 1. Have natural conversation
  // 2. Understand user intent from conversation
  // 3. Decide what action to take internally
  // 4. Ask for confirmation if needed
  // 5. Be conversational and helpful

  const project = systemContext.currentProject;
  const hasDescription = project?.description && project.description.trim().length > 0;
  const hldDoc = systemContext.existingDocuments?.find(d => 
    d.title.toLowerCase().includes("hld") || 
    d.title.toLowerCase().includes("high-level design")
  );
  const lldDoc = systemContext.existingDocuments?.find(d => 
    d.title.toLowerCase().includes("lld") || 
    d.title.toLowerCase().includes("low-level design")
  );

  let systemPrompt = `You are CORTEX, an AI assistant helping with project management. You communicate via voice conversation.

Current Context:
- Project: ${project?.name || "None selected"}
${hasDescription ? `- Project Description: ${project?.description}` : "- Project has no description yet"}
${hldDoc ? "- High-Level Design exists" : "- No High-Level Design yet"}
${lldDoc ? "- Low-Level Design exists" : "- No Low-Level Design yet"}

Your Role:
1. Have natural, conversational dialogue with the user
2. Understand their intent from what they say (don't require specific commands)
3. Ask clarifying questions when needed
4. Decide internally what action to take based on the conversation
5. When you understand what the user wants, you can:
   - Clarify/understand the project (if no description or user wants to refine it)
   - Create High-Level Design (if project has description)
   - Create Low-Level Design (if HLD exists)
   - Generate tasks/plan (if design docs exist or project is clear)
6. Before taking action, ask for confirmation naturally: "Would you like me to [action]?"
7. Be helpful, conversational, and natural - not robotic

Available Actions (you decide when to use them):
- CLARIFY_PROJECT: Ask questions to understand/refine project description
- GENERATE_HLD: Create high-level design document
- GENERATE_LLD: Create low-level design document  
- GENERATE_PROJECT_PLAN: Create task breakdown

Remember: You're having a voice conversation. Be natural, ask questions, understand intent, and decide actions internally.`;

  // If first message, add greeting
  if (conversationHistory.length === 0) {
    const greeting = await callGeminiConversation(
      [{ role: "user" as const, content: systemPrompt + "\n\nStart by greeting the user naturally and asking how you can help." }],
      systemContext
    );
    return greeting;
  }

  // Continue conversation
  const response = await callGeminiConversation(
    conversationHistory.map(m => ({ role: m.role, content: m.content })),
    {
      ...systemContext,
      // Add system instruction via context
      currentProject: systemContext.currentProject ? {
        ...systemContext.currentProject,
        description: systemPrompt + "\n\n" + (systemContext.currentProject.description || ""),
      } : undefined,
    }
  );

  return response;
}

/**
 * Extract action intent from AI response
 * AI may indicate what action it wants to take in natural language
 */
export function extractActionFromResponse(response: string, systemContext: SystemContext): {
  type: string;
  data: any;
  needsConfirmation: boolean;
} | null {
  const lower = response.toLowerCase();

  // Check for confirmation requests
  const needsConfirmation = 
    lower.includes("would you like") ||
    lower.includes("should i") ||
    lower.includes("can i") ||
    lower.includes("shall i") ||
    lower.includes("do you want");

  // Project clarification
  if (lower.includes("clarify") || lower.includes("understand") || lower.includes("describe") || 
      (lower.includes("project") && (lower.includes("what") || lower.includes("tell me")))) {
    return {
      type: "CLARIFY_PROJECT",
      data: {},
      needsConfirmation,
    };
  }

  // Generate HLD
  if (lower.includes("high-level design") || lower.includes("hld") || 
      (lower.includes("architecture") && lower.includes("design"))) {
    return {
      type: "GENERATE_HLD",
      data: {},
      needsConfirmation,
    };
  }

  // Generate LLD
  if (lower.includes("low-level design") || lower.includes("lld") || 
      lower.includes("detailed design")) {
    return {
      type: "GENERATE_LLD",
      data: {},
      needsConfirmation,
    };
  }

  // Generate tasks
  if (lower.includes("task") || lower.includes("plan") || lower.includes("breakdown") ||
      (lower.includes("create") && (lower.includes("task") || lower.includes("plan")))) {
    return {
      type: "GENERATE_PROJECT_PLAN",
      data: {},
      needsConfirmation,
    };
  }

  return null;
}

