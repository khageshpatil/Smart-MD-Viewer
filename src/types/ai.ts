/**
 * AI Action Types and Interfaces
 * Defines the structure for AI commands and actions
 */

export type AIActionType =
  | "CLARIFY_PROJECT" // Collaborative: Ask questions, brainstorm, generate description
  | "GENERATE_HLD" // Collaborative: High-level design
  | "GENERATE_LLD" // Collaborative: Low-level design
  | "GENERATE_PROJECT_PLAN" // Structured: Task breakdown
  | "SUGGEST_NEXT_STEPS"
  | "CREATE_TASKS_FROM_DOCUMENT"
  | "SUMMARIZE_DOCUMENT"
  | "BRAINSTORM"; // Collaborative: General discussion

export interface ActionContext {
  projectId?: string | null;
  documentId?: string | null;
  taskId?: string | null;
  mode?: "focus" | "projects" | "documents" | "tasks";
}

export interface AIAction {
  type: AIActionType;
  context: ActionContext;
  params: Record<string, unknown>;
}

export interface ParsedCommand {
  action: AIAction | null;
  confidence: number;
  error?: string;
}

/**
 * System context for AI operations
 */
export interface SystemContext {
  currentProject?: {
    id: string;
    name: string;
    description: string;
  } | null;
  currentDocument?: {
    id: string;
    title: string;
    content: string;
  } | null;
  existingTasks?: Array<{
    id: string;
    title: string;
    status: string;
    type: string;
  }>;
  existingDocuments?: Array<{
    id: string;
    title: string;
    content: string;
    projectId: string | null;
  }>;
  mode: "focus" | "projects" | "documents" | "tasks";
}

/**
 * Collaborative AI conversation message
 */
export interface AIMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

/**
 * Collaborative AI session state
 */
export interface AIConversationState {
  messages: AIMessage[];
  currentPhase: "clarifying" | "synthesizing" | "complete";
  synthesizedOutput?: string;
}



