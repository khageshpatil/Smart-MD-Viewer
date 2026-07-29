# Phase 3B: Planning Execution - Complete Documentation

## Overview

**Phase 3B: Planning Execution** represents the final stage of CORTEX's planning capabilities. This phase transforms planning drafts (created in Phase 3A) into real, persisted artifacts stored in IndexedDB. Execution is fully **deterministic** and **narratable by voice**, with a focus on user visibility and control.

**Previous Phase**: Phase 3A (Planning Synthesis) - AI-powered preview-only draft generation  
**This Phase**: Phase 3B (Planning Execution) - Deterministic artifact materialization

---

## Core Principles

### 1. Deterministic Execution
- **NO AI** in Phase 3B - Gemini is used only in Phase 3A for synthesis
- Same planning draft → same execution plan → same artifacts (reproducible)
- Keyword-based heuristics for task generation (no LLM calls)
- Template-based document generation (HLD/LLD)

### 2. Persistent Storage
- All artifacts stored in IndexedDB (not in-memory)
- Survives page refreshes and browser sessions
- Repository pattern for clean CRUD operations
- Database: `cortex-planning` with 4 object stores

### 3. Voice Narration
- Every execution step has deterministic voice narration
- Milestone-based updates (25%, 50%, 75%) to avoid verbosity
- Narrator uses template strings (NO AI for narration)
- User hears progress without overwhelming detail

### 4. Step-Based Execution
- Execution broken into discrete, trackable steps
- Event-driven progress updates
- Error handling: stop on first error, rollback possible
- User can abort mid-execution

### 5. User Consent Required
- Nothing created until user clicks "Create This Plan"
- Preview draft in Phase 3A before execution
- Execution console shows real-time progress
- User can abort at any time

---

## Architecture

### Execution Pipeline

```
PlanningDraft (Phase 3A)
    ↓
ExecutionPlanner (deterministic transformation)
    ↓
ExecutionPlan (ordered steps with payloads)
    ↓
ExecutionEngine (sequential step execution)
    ↓
Repositories (IndexedDB persistence)
    ↓
Materialized Artifacts (Project, Phases, Tasks, Documents)
```

### Key Components

#### **1. ExecutionPlanner** (`/src/lib/execution/executionPlanner.ts`)
- **Pure function**: `PlanningDraft → ExecutionPlan`
- Generates ordered execution steps:
  1. Create project (1 step)
  2. Create phases (N steps, one per phase)
  3. Create tasks (1-3 tasks per phase, keyword heuristics)
  4. Create HLD document (1 step)
  5. Create LLD document (1 step)
- **Task Generation Heuristics**:
  - Checks phase.intent for keywords → suggests tasks
  - Keywords: "setup", "implement", "test", "deploy", "document"
  - Limits to 3 tasks per phase
  - Fallback: generic "Complete [phase.title]"
- **Document Generation**:
  - `generateHLD()`: Markdown with summary, goals, non-goals, assumptions, risks, phases
  - `generateLLD()`: Markdown with phase breakdown, task lists, technical considerations
- **Deterministic**: Same draft → same plan every time

#### **2. ExecutionEngine** (`/src/lib/execution/executionEngine.ts`)
- **Event-driven execution**: `execute(plan) → Promise<ExecutionProgress>`
- Sequential step execution (for loop, not parallel)
- Emits events: `execution-started`, `step-started`, `step-completed`, `execution-completed`, `execution-error`, `progress-updated`
- **Event Handlers**: Subscribe with `engine.on(handler)`, unsubscribe with returned function
- **Step Routing**: `executeStep(step)` routes to appropriate create method
- **Error Handling**: Stops on first error, emits error event, throws exception
- **Abort**: `abort()` sets flag to stop execution mid-loop
- **Progress Tracking**: Updates `ExecutionProgress` with currentStepIndex, percentage, status

#### **3. ExecutionNarrator** (`/src/lib/execution/executionNarrator.ts`)
- **Deterministic text templates** (NO AI)
- Template methods for each event type:
  - `narrateStart()`: "Starting execution. Creating your plan with N steps."
  - `narrateStepStart()`: Uses step.voiceNarration or step.description
  - `narrateStepComplete()`: Only milestones (25%, 50%, 75%) to avoid verbosity
  - `narrateComplete()`: "Planning complete! Created N artifacts. Your project is ready."
  - `narrateError()`: "Execution failed: [error]. Please try again."
- **Milestone Philosophy**: User hears progress without per-step spam
- **Singleton**: One narrator instance across application

#### **4. IndexedDB Storage** (`/src/lib/execution/db.ts`)
- Database: `cortex-planning`, version 1
- **Object Stores**:
  - `projects`: Projects with keyPath='id'
  - `phases`: Phases with keyPath='id'
  - `tasks`: Tasks with keyPath='id'
  - `documents`: Documents (HLD/LLD) with keyPath='id'
- **Indexes** for efficient queries:
  - projects: by-status, by-createdAt, by-conversationId
  - phases: by-projectId, by-status, by-order
  - tasks: by-phaseId, by-projectId, by-status, by-order
  - documents: by-projectId, by-type
- **API**: `initDatabase()`, `getDatabase()`, `closeDatabase()`, `clearDatabase()`

#### **5. Repositories** (`/src/lib/execution/repositories.ts`)
- **CRUD operations** for all entity types
- **ProjectRepository**: create, getById, getAll, update, delete, getByConversationId, getByStatus
- **PhaseRepository**: create, getById, getByProjectId (sorted by order), update, delete
- **TaskRepository**: create, getById, getByPhaseId (sorted), getByProjectId (sorted), update, delete
- **DocumentRepository**: create, getById, getByProjectId, update, delete, getByType
- **Singleton pattern**: Each repository instantiated once, retrieved via `get*Repository()`

---

## Domain Model

### Entity Types

#### **Project**
```typescript
{
  id: string;              // UUID v4
  name: string;            // Extracted from summary (first sentence or 50 chars)
  summary: string;         // Project summary from draft
  goals: string[];         // Project goals
  nonGoals: string[];      // Out-of-scope items
  assumptions: string[];   // Planning assumptions
  risks: string[];         // Identified risks
  status: 'active' | 'completed' | 'archived';
  createdAt: Date;
  updatedAt: Date;
  conversationId: string;  // Links to conversation that created it
}
```

#### **Phase**
```typescript
{
  id: string;              // UUID v4
  projectId: string;       // Foreign key to project
  title: string;           // Phase title
  intent: string;          // What this phase achieves
  order: number;           // Sequence (0-based)
  status: 'pending' | 'in-progress' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}
```

#### **Task**
```typescript
{
  id: string;              // UUID v4
  phaseId: string;         // Foreign key to phase
  projectId: string;       // Foreign key to project (denormalized for queries)
  title: string;           // Task title
  description: string;     // Task description
  order: number;           // Sequence within phase (0-based)
  status: 'pending' | 'in-progress' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}
```

#### **Document**
```typescript
{
  id: string;              // UUID v4
  projectId: string;       // Foreign key to project
  type: 'hld' | 'lld';     // High-Level Design or Low-Level Design
  title: string;           // Document title
  content: string;         // Markdown content
  createdAt: Date;
  updatedAt: Date;
}
```

### Execution Types

#### **ExecutionStep**
```typescript
{
  id: string;              // UUID for step
  type: 'create-project' | 'create-phase' | 'create-task' | 'create-document';
  description: string;     // Human-readable description
  voiceNarration: string;  // What to say when executing this step
  payload: Project | Phase | Task | Document; // Entity to create
}
```

#### **ExecutionPlan**
```typescript
{
  id: string;              // UUID for plan
  conversationId: string;  // Links to conversation
  steps: ExecutionStep[];  // Ordered steps
  totalSteps: number;      // steps.length
  estimatedDuration: number; // stepCount * 0.2 seconds
  createdAt: Date;
}
```

#### **ExecutionProgress**
```typescript
{
  planId: string;
  currentStepIndex: number;  // Current step being executed
  completedSteps: number;    // Steps completed so far
  totalSteps: number;
  percentage: number;        // 0-100
  currentStep: ExecutionStep | null;
  status: 'idle' | 'executing' | 'completed' | 'error';
  startedAt: Date | null;
  completedAt: Date | null;
  error: { message: string; stepId: string; } | null;
}
```

#### **ExecutionLogEntry**
```typescript
{
  timestamp: Date;
  stepId: string;
  message: string;
  level: 'info' | 'success' | 'error';
}
```

---

## User Flow

### 1. Conversation Phase (Phase 0 + 2 + 2.5)
- User starts voice conversation with CORTEX
- CORTEX asks clarifying questions
- Planning readiness gate activates at 75% confidence
- User sees "Ready to plan" indicator

### 2. Draft Preview Phase (Phase 3A)
- User clicks "Generate Planning Draft"
- Gemini synthesizes planning draft (AI-powered)
- User sees preview: summary, goals, non-goals, assumptions, risks, phases
- **Nothing created yet** - this is preview-only

### 3. Execution Phase (Phase 3B)
- User reviews draft and clicks "Create This Plan"
- ExecutionPlanner generates deterministic execution plan
- ExecutionEngine executes steps sequentially
- **Real-time updates**:
  - Progress bar (0-100%)
  - Current step indicator
  - Execution log (timestamped entries)
  - Voice narration (milestones only)
- User can abort mid-execution with "Abort" button
- On completion: "Planning Complete! Created N artifacts."

### 4. Post-Execution
- User sees completion summary with project name and artifact count
- Artifacts persisted in IndexedDB (survive page refresh)
- User can clear execution console or start new conversation
- Future phases can retrieve and display artifacts

---

## Keyword Heuristics for Task Generation

**Goal**: Generate 1-3 meaningful tasks per phase without AI

**Method**: Check `phase.intent.toLowerCase()` for keywords

### Keyword → Task Mapping

| Keywords | Generated Task |
|----------|----------------|
| "setup", "initialize", "configure" | "Initial setup and configuration" |
| "implement", "build", "create", "develop" | "Core implementation" |
| "test", "quality", "validation", "qa" | "Testing and validation" |
| "deploy", "release", "launch" | "Deployment and release" |
| "document", "documentation", "docs" | "Documentation" |
| *No match* | "Complete [phase.title]" (fallback) |

**Multiple Keywords**: Creates multiple tasks (up to 3)

**Example**:
```
Phase: "Setup & Foundation"
Intent: "Initialize project structure and configure development environment"
Keywords matched: "initialize" (setup), "configure" (setup)
Generated Tasks:
  1. "Initial setup and configuration"
```

**Example 2**:
```
Phase: "Core Development"
Intent: "Implement main features, build core logic, and test functionality"
Keywords matched: "implement" (build), "build" (build), "test" (test)
Generated Tasks:
  1. "Core implementation"
  2. "Testing and validation"
```

---

## Voice Narration Strategy

### Milestone-Based Updates

**Problem**: Narrating every step is overwhelming (20+ steps)

**Solution**: Only narrate milestones (25%, 50%, 75%)

**Implementation**:
```typescript
narrateStepComplete(event) {
  if (event.progress.percentage % 25 === 0) {
    return `${Math.round(event.progress.percentage)}% complete.`;
  }
  return ''; // Silent for non-milestone steps
}
```

### Narration Examples

**Start**: "Starting execution. Creating your plan with 23 steps."

**Step Start**:
- "Creating project React Task Manager"
- "Creating phase 1: Setup & Foundation"
- "Adding task: Initial setup and configuration"
- "Creating High-Level Design document"

**Milestones**:
- "25% complete."
- "50% complete."
- "75% complete."

**Completion**: "Planning complete! Created 23 artifacts. Your project is ready."

**Error**: "Execution failed: Database connection error. Please try again."

---

## Error Handling

### Stop-on-First-Error

**Strategy**: Halt execution on first error, don't attempt partial completion

**Rationale**: Partial state is confusing; better to fail fast and let user retry

**Implementation**:
```typescript
try {
  await executeStep(step);
} catch (error) {
  progress.status = 'error';
  progress.error = { message: error.message, stepId: step.id };
  emit({ type: 'execution-error', progress, error });
  throw error; // Re-throw to stop execution
}
```

### User Actions on Error

1. Review error message in execution console
2. Fix underlying issue (if applicable)
3. Clear execution console
4. Regenerate planning draft (if needed)
5. Retry "Create This Plan"

---

## Testing Checklist

### Phase 3B Functionality

- [ ] **Planning Readiness**
  - [ ] Reach 75%+ confidence through conversation
  - [ ] "Generate Planning Draft" button appears
  - [ ] Planning readiness indicator shows "Ready to plan"

- [ ] **Draft Preview**
  - [ ] Click "Generate Planning Draft"
  - [ ] Draft synthesized successfully
  - [ ] Draft displays: summary, goals, non-goals, assumptions, risks, phases
  - [ ] "Create This Plan" button appears

- [ ] **Execution**
  - [ ] Click "Create This Plan"
  - [ ] Execution console appears
  - [ ] Progress bar animates 0→100%
  - [ ] Current step indicator updates
  - [ ] Execution log shows timestamped entries
  - [ ] Voice narration for milestones (25%, 50%, 75%)
  - [ ] Completion summary shows project name and artifact count

- [ ] **Persistence**
  - [ ] Open browser DevTools → Application → IndexedDB
  - [ ] Verify database "cortex-planning" exists
  - [ ] Check object stores: projects, phases, tasks, documents
  - [ ] Verify data matches planning draft
  - [ ] Refresh page → IndexedDB data persists

- [ ] **Abort**
  - [ ] Start execution
  - [ ] Click "Abort Execution" mid-execution
  - [ ] Execution stops immediately
  - [ ] Error displayed: "Execution aborted by user"

- [ ] **Error Handling**
  - [ ] Simulate error (e.g., corrupt draft data)
  - [ ] Execution stops on first error
  - [ ] Error message displayed in console
  - [ ] No partial artifacts created

- [ ] **Clear Execution**
  - [ ] Complete or abort execution
  - [ ] Click "Clear" button
  - [ ] Execution console disappears
  - [ ] Execution log cleared
  - [ ] Progress reset to null

---

## Phase Boundaries

### What Belongs in Phase 3B

✅ **IN SCOPE**:
- Deterministic execution of planning drafts
- IndexedDB persistence of artifacts
- CRUD repositories
- Voice narration templates
- Step-based progress tracking
- Error handling
- User consent (button click)

❌ **OUT OF SCOPE**:
- AI-powered synthesis (that's Phase 3A)
- Artifact visualization UI (future phase)
- Artifact editing (future phase)
- Export to files (future phase)
- Code generation (future phase)

### Handoff to Future Phases

**Phase 3C (Artifact Viewer)**: Read artifacts from IndexedDB, display in UI
**Phase 3D (Artifact Editor)**: Allow editing of phases/tasks/documents
**Phase 3E (Export)**: Export artifacts to JSON, Markdown, or project files
**Phase 4 (Code Generation)**: Generate actual code from planning artifacts

---

## Technical Decisions

### Why Keyword Heuristics?

**Decision**: Use keyword matching for task generation instead of AI

**Rationale**:
- Deterministic: Same input → same output
- Fast: No API calls, instant execution
- Transparent: User can see exactly how tasks are generated
- Sufficient: Most phases have clear intent keywords
- Fallback: Generic task always works

**Trade-off**: Less creative than AI, but phase 3A already provides AI creativity

### Why IndexedDB?

**Decision**: Use IndexedDB instead of localStorage or in-memory

**Rationale**:
- Capacity: IndexedDB can store MBs, localStorage is 5-10MB
- Structured: Supports indexes, queries, transactions
- Async: Non-blocking, doesn't freeze UI
- Standardized: Supported by all modern browsers

**Trade-off**: More complex API, but `idb` library simplifies it

### Why Stop-on-First-Error?

**Decision**: Halt execution on first error instead of continuing

**Rationale**:
- Clarity: User sees exactly what failed
- Consistency: No partial state to debug
- Safety: Prevents cascading errors

**Trade-off**: User must retry entire execution, but plans are typically small

### Why Milestone Narration?

**Decision**: Only narrate 25%, 50%, 75% instead of every step

**Rationale**:
- User experience: Avoids overwhelming user with 20+ narrations
- Battery: Fewer TTS calls, less CPU usage
- Clarity: Milestones are memorable, per-step is noise

**Trade-off**: Less granular feedback, but execution log shows all steps

---

## Performance Considerations

### Execution Speed

- **Average**: ~200ms per step (heuristic estimate)
- **Typical plan**: 20-30 steps = 4-6 seconds total
- **Long plan**: 50 steps = 10 seconds total

### IndexedDB Operations

- **Write**: ~10-50ms per entity (depends on browser)
- **Read by ID**: ~5-20ms
- **Query by index**: ~10-50ms
- **Transaction batching**: Could improve speed (future optimization)

### Voice Narration

- **TTS latency**: ~200-500ms per narration (browser-dependent)
- **Milestone-only**: 3-4 narrations total (start, 25%, 50%, 75%, complete)
- **Total narration time**: <2 seconds

---

## Known Limitations

### Current Constraints

1. **No Rollback**: Errors don't auto-rollback created artifacts (user must clear DB manually)
2. **No Incremental Execution**: Can't resume from failed step (must restart)
3. **No Parallel Execution**: Steps executed sequentially (could parallelize create-task steps)
4. **No Validation**: Doesn't validate draft before execution (assumes Phase 3A produces valid draft)
5. **No Progress Persistence**: If page refreshes mid-execution, progress lost (artifacts created so far remain)

### Future Enhancements

- **Transactional Execution**: Rollback all artifacts on error
- **Resume Capability**: Save progress, resume from last step
- **Parallel Task Creation**: Execute create-task steps in parallel
- **Draft Validation**: Pre-flight check before execution
- **Progress Persistence**: IndexedDB progress tracking for resume

---

## Integration with Existing Phases

### Phase 0 (Voice Spine)
- ExecutionNarrator outputs text → SpeechController speaks it
- Voice narration runs in parallel with execution
- User hears progress without blocking UI

### Phase 2 (Conversational Brain)
- conversationId links planning draft to conversation
- Same conversationId stored in Project entity
- Future: retrieve all projects for a conversation

### Phase 2.5 (Planning Readiness)
- Readiness gate determines when "Generate Planning Draft" appears
- Draft can only be executed if ready
- Ensures sufficient context before planning

### Phase 3A (Planning Synthesis)
- PlanningDraft is input to ExecutionPlanner
- Draft must exist and status must be 'ready'
- Execution validates draft exists before proceeding

---

## Summary

**Phase 3B: Planning Execution** completes the planning workflow by transforming AI-generated drafts into persisted artifacts. The system is deterministic, narratable, and user-controlled, with a focus on transparency and reliability.

**Key Achievements**:
- ✅ Deterministic execution (no AI in Phase 3B)
- ✅ IndexedDB persistence (artifacts survive refresh)
- ✅ Voice narration (milestone-based, non-overwhelming)
- ✅ Step-based progress tracking (real-time updates)
- ✅ User consent required (explicit "Create This Plan" button)
- ✅ Error handling (stop-on-first-error with clear messages)
- ✅ Repository pattern (clean CRUD separation)
- ✅ Event-driven execution (flexible, extensible)

**Next Steps**: Build artifact viewer UI (Phase 3C) to display created projects, phases, tasks, and documents.
