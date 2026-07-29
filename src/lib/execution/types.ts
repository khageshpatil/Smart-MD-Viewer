/**
 * Phase 3B: Execution Domain Types
 * 
 * These types represent materialized planning artifacts that exist in the system.
 * Unlike PlanningDraft (preview), these are persisted in IndexedDB.
 */

// ============================================================================
// PERSISTED ENTITIES
// ============================================================================

/**
 * A project created from a planning draft
 */
export interface Project {
  id: string;                      // UUID
  name: string;                    // Derived from project summary
  summary: string;                 // From PlanningDraft.projectSummary
  goals: string[];                 // From PlanningDraft.goals
  nonGoals: string[];              // From PlanningDraft.nonGoals
  assumptions: string[];           // From PlanningDraft.assumptions
  risks: string[];                 // From PlanningDraft.risks
  status: 'active' | 'completed' | 'archived';
  createdAt: number;               // Timestamp
  updatedAt: number;               // Timestamp
  conversationId: string;          // Link back to conversation
}

/**
 * A phase within a project
 */
export interface Phase {
  id: string;                      // UUID
  projectId: string;               // Parent project
  title: string;                   // From PlanningPhase.title
  intent: string;                  // From PlanningPhase.intent
  order: number;                   // Sequence (0-indexed)
  status: 'pending' | 'in-progress' | 'completed';
  createdAt: number;
  updatedAt: number;
}

/**
 * A task within a phase (auto-generated from phase intent)
 */
export interface Task {
  id: string;                      // UUID
  phaseId: string;                 // Parent phase
  projectId: string;               // Parent project
  title: string;                   // Generated task title
  description: string;             // Task details
  order: number;                   // Sequence within phase
  status: 'pending' | 'in-progress' | 'completed';
  createdAt: number;
  updatedAt: number;
}

/**
 * A document (HLD/LLD) generated for a project
 */
export interface Document {
  id: string;                      // UUID
  projectId: string;               // Parent project
  type: 'hld' | 'lld';            // High-Level or Low-Level Design
  title: string;                   // Document title
  content: string;                 // Markdown content
  createdAt: number;
  updatedAt: number;
}

// ============================================================================
// EXECUTION TYPES
// ============================================================================

/**
 * A single atomic execution step
 */
export interface ExecutionStep {
  id: string;                      // Unique step ID
  type: 'create-project' | 'create-phase' | 'create-task' | 'create-document';
  description: string;             // Human-readable step description
  voiceNarration: string;          // Short sentence for voice output
  payload: any;                    // Data needed for this step
}

/**
 * A complete execution plan
 */
export interface ExecutionPlan {
  id: string;                      // UUID
  conversationId: string;          // Source conversation
  steps: ExecutionStep[];          // Ordered execution steps
  totalSteps: number;              // Total step count
  estimatedDuration: number;       // Estimated seconds (rough)
  createdAt: number;
}

/**
 * Progress status during execution
 */
export interface ExecutionProgress {
  planId: string;
  currentStepIndex: number;        // 0-based
  completedSteps: number;
  totalSteps: number;
  percentage: number;              // 0-100
  currentStep?: ExecutionStep;
  status: 'idle' | 'executing' | 'completed' | 'error';
  error?: { message: string; stepId: string; } | null;
  startedAt?: number;
  completedAt?: number;
}

/**
 * Log entry for execution activity
 */
export interface ExecutionLogEntry {
  timestamp: number;
  stepId: string;
  message: string;
  level: 'info' | 'success' | 'error';
}

// ============================================================================
// REPOSITORY INTERFACES
// ============================================================================

/**
 * Repository interface for projects
 */
export interface ProjectRepository {
  create(project: Project): Promise<void>;
  getById(id: string): Promise<Project | null>;
  getAll(): Promise<Project[]>;
  update(project: Project): Promise<void>;
  delete(id: string): Promise<void>;
  getByConversationId(conversationId: string): Promise<Project[]>;
  getByStatus(status: 'active' | 'completed' | 'archived'): Promise<Project[]>;
}

/**
 * Repository interface for phases
 */
export interface PhaseRepository {
  create(phase: Phase): Promise<void>;
  getById(id: string): Promise<Phase | null>;
  getByProjectId(projectId: string): Promise<Phase[]>;
  update(phase: Phase): Promise<void>;
  delete(id: string): Promise<void>;
}

/**
 * Repository interface for tasks
 */
export interface TaskRepository {
  create(task: Task): Promise<void>;
  getById(id: string): Promise<Task | null>;
  getByPhaseId(phaseId: string): Promise<Task[]>;
  getByProjectId(projectId: string): Promise<Task[]>;
  update(task: Task): Promise<void>;
  delete(id: string): Promise<void>;
}

/**
 * Repository interface for documents
 */
export interface DocumentRepository {
  create(document: Document): Promise<void>;
  getById(id: string): Promise<Document | null>;
  getByProjectId(projectId: string): Promise<Document[]>;
  update(document: Document): Promise<void>;
  delete(id: string): Promise<void>;
}
