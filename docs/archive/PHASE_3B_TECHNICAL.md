# Phase 3B: Planning Execution - Technical Deep Dive

## Introduction

This document provides a detailed technical analysis of Phase 3B's execution pipeline, IndexedDB schema, repository implementations, event system, and narration templates. For user-facing documentation, see [PHASE_3B_QUICK_START.md](./PHASE_3B_QUICK_START.md). For complete architectural overview, see [PHASE_3B_COMPLETE.md](./PHASE_3B_COMPLETE.md).

---

## Execution Pipeline Architecture

### Data Flow

```
┌─────────────────────┐
│  PlanningDraft      │ ← Phase 3A output (AI-generated)
│  (Phase 3A)         │
└──────────┬──────────┘
           │
           v
┌─────────────────────┐
│ ExecutionPlanner    │ ← Pure function transformation
│ generatePlan()      │
└──────────┬──────────┘
           │
           v
┌─────────────────────┐
│  ExecutionPlan      │ ← Ordered steps with payloads
│  (steps[])          │
└──────────┬──────────┘
           │
           v
┌─────────────────────┐
│  ExecutionEngine    │ ← Event-driven sequential execution
│  execute(plan)      │
└──────────┬──────────┘
           │
           v
┌─────────────────────┐
│  Repositories       │ ← CRUD operations
│  (create entities)  │
└──────────┬──────────┘
           │
           v
┌─────────────────────┐
│  IndexedDB          │ ← Persistence layer
│  (4 object stores)  │
└──────────┬──────────┘
           │
           v
┌─────────────────────┐
│ Materialized        │ ← Final persisted artifacts
│ Artifacts           │
└─────────────────────┘
```

### Execution Phases

#### Phase 1: Planning (ExecutionPlanner)
**Input**: `PlanningDraft` from Phase 3A
**Output**: `ExecutionPlan` with ordered steps
**Duration**: <10ms (pure function, no I/O)

**Steps**:
1. Extract project name from draft summary
2. Generate UUID for project
3. Create `create-project` step
4. For each phase in draft:
   - Generate UUID for phase
   - Create `create-phase` step
   - Generate 1-3 tasks using keyword heuristics
   - For each task:
     - Generate UUID for task
     - Create `create-task` step
5. Generate HLD document
6. Create `create-document` step for HLD
7. Generate LLD document
8. Create `create-document` step for LLD
9. Calculate total steps and estimated duration
10. Return `ExecutionPlan`

**Determinism**: Same draft → same plan (UUIDs are only variables)

#### Phase 2: Execution (ExecutionEngine)
**Input**: `ExecutionPlan`
**Output**: `Promise<ExecutionProgress>`
**Duration**: ~200ms per step (20-30 steps = 4-6 seconds)

**Algorithm**:
```typescript
async execute(plan: ExecutionPlan): Promise<ExecutionProgress> {
  const progress = initializeProgress(plan);
  this.emit({ type: 'execution-started', progress });

  for (let i = 0; i < plan.steps.length; i++) {
    if (this.abortRequested) {
      throw new Error('Execution aborted');
    }

    const step = plan.steps[i];
    progress.currentStepIndex = i;
    progress.currentStep = step;
    this.emit({ type: 'step-started', progress, step });

    try {
      await this.executeStep(step);
      progress.completedSteps++;
      progress.percentage = (i + 1) / plan.totalSteps * 100;
      this.emit({ type: 'step-completed', progress, step });
      this.emit({ type: 'progress-updated', progress });
    } catch (error) {
      progress.status = 'error';
      progress.error = { message: error.message, stepId: step.id };
      this.emit({ type: 'execution-error', progress, error });
      throw error;
    }
  }

  progress.status = 'completed';
  progress.completedAt = new Date();
  this.emit({ type: 'execution-completed', progress });
  return progress;
}
```

**Guarantees**:
- **Sequential**: Steps execute in order (for loop, not parallel)
- **Atomic**: Each step either completes or fails (no partial state per step)
- **Event-driven**: Every state change emits event
- **Abortable**: Check `abortRequested` flag each iteration

#### Phase 3: Persistence (Repositories)
**Input**: Entity object (Project, Phase, Task, Document)
**Output**: Persisted entity with timestamps
**Duration**: ~10-50ms per operation (IndexedDB latency)

**Workflow per step**:
1. Extract entity from `step.payload`
2. Add `createdAt` and `updatedAt` timestamps
3. Call repository `create(entity)`
4. Repository opens IndexedDB transaction
5. Repository writes to appropriate object store
6. Transaction commits
7. IndexedDB returns success
8. Repository resolves Promise
9. ExecutionEngine proceeds to next step

**Error handling**:
- IndexedDB constraint violation → DOMException → caught by engine → execution halts
- Network error (offline) → Error → caught by engine → execution halts
- Quota exceeded → QuotaExceededError → caught by engine → execution halts

---

## IndexedDB Schema

### Database Specification

**Name**: `cortex-planning`
**Version**: `1`
**Library**: `idb` (npm package) - Promise-based wrapper for IndexedDB API

### Schema Definition

```typescript
const dbSchema = {
  name: 'cortex-planning',
  version: 1,
  stores: {
    projects: {
      keyPath: 'id',
      indexes: [
        { name: 'by-status', keyPath: 'status' },
        { name: 'by-createdAt', keyPath: 'createdAt' },
        { name: 'by-conversationId', keyPath: 'conversationId' }
      ]
    },
    phases: {
      keyPath: 'id',
      indexes: [
        { name: 'by-projectId', keyPath: 'projectId' },
        { name: 'by-status', keyPath: 'status' },
        { name: 'by-order', keyPath: 'order' }
      ]
    },
    tasks: {
      keyPath: 'id',
      indexes: [
        { name: 'by-phaseId', keyPath: 'phaseId' },
        { name: 'by-projectId', keyPath: 'projectId' },
        { name: 'by-status', keyPath: 'status' },
        { name: 'by-order', keyPath: 'order' }
      ]
    },
    documents: {
      keyPath: 'id',
      indexes: [
        { name: 'by-projectId', keyPath: 'projectId' },
        { name: 'by-type', keyPath: 'type' }
      ]
    }
  }
};
```

### Index Usage Rationale

#### projects.by-status
**Use case**: Filter active vs. archived projects
**Query**: `getByStatus('active')`
**Cardinality**: Low (3 values: active, completed, archived)
**Performance**: O(n) scan with few results

#### projects.by-createdAt
**Use case**: Sort projects by creation date (newest first)
**Query**: `getAll()` then sort by createdAt
**Cardinality**: High (unique timestamps)
**Performance**: O(n log n) sort

#### projects.by-conversationId
**Use case**: Retrieve all projects from same conversation
**Query**: `getByConversationId(conversationId)`
**Cardinality**: Medium (1-5 projects per conversation)
**Performance**: O(n) with filtered results

#### phases.by-projectId
**Use case**: Retrieve all phases for a project
**Query**: `getByProjectId(projectId)`
**Cardinality**: Medium (5-10 phases per project)
**Performance**: O(n) with filtered results, then sort by order

#### phases.by-order
**Use case**: Ensure phase sequencing
**Query**: Combined with by-projectId filter, then sort
**Cardinality**: Low (0-based integers)
**Performance**: O(n log n) sort

#### tasks.by-phaseId
**Use case**: Retrieve all tasks for a phase
**Query**: `getByPhaseId(phaseId)`
**Cardinality**: Low (1-3 tasks per phase)
**Performance**: O(n) with few results, then sort by order

#### tasks.by-projectId
**Use case**: Retrieve all tasks for a project (cross-phase)
**Query**: `getByProjectId(projectId)`
**Cardinality**: Medium (15-30 tasks per project)
**Performance**: O(n) with filtered results, then sort by order

#### documents.by-type
**Use case**: Retrieve all HLD or LLD documents
**Query**: `getByType('hld')` or `getByType('lld')`
**Cardinality**: Very low (2 values: hld, lld)
**Performance**: O(n) scan with few results

### Storage Capacity

**Typical project storage**:
- 1 Project: ~2KB (summary + goals + non-goals + assumptions + risks)
- 5 Phases: ~0.5KB (title + intent)
- 15 Tasks: ~1.5KB (title + description)
- 2 Documents: ~10KB (markdown content)
- **Total**: ~14KB per project

**IndexedDB quota** (browser-dependent):
- Chrome/Edge: 60% of available disk space (multi-GB)
- Firefox: 2GB default, can request more
- Safari: 1GB default

**Practical limit**: Hundreds of projects before quota concerns

---

## Repository Pattern Implementation

### Design Rationale

**Why repositories?**
1. **Separation of concerns**: Business logic (engine) doesn't know about IndexedDB API
2. **Testability**: Mock repositories for unit tests
3. **Flexibility**: Swap IndexedDB for another backend (localStorage, server) without changing engine
4. **Type safety**: Repository methods enforce entity types

### Interface Design

```typescript
interface ProjectRepository {
  create(project: Omit<Project, 'createdAt' | 'updatedAt'>): Promise<Project>;
  getById(id: string): Promise<Project | null>;
  getAll(): Promise<Project[]>;
  update(project: Project): Promise<void>;
  delete(id: string): Promise<void>;
  getByConversationId(conversationId: string): Promise<Project[]>;
  getByStatus(status: 'active' | 'completed' | 'archived'): Promise<Project[]>;
}
```

**Key decisions**:
- **`create` omits timestamps**: Repository adds them (ensures consistency)
- **`getById` returns `null`**: Explicit missing entity handling (vs. throwing error)
- **`update` returns `void`**: No need to return updated entity (caller has it)
- **`delete` is idempotent**: Deleting non-existent ID succeeds (no error)

### Singleton Pattern

**Why singletons?**
- **One database connection**: Avoid opening multiple connections
- **Shared transaction context**: Repositories can participate in multi-entity transactions (future)
- **Memory efficiency**: One instance per repository type

**Implementation**:
```typescript
let projectRepositoryInstance: ProjectRepository | null = null;

export function getProjectRepository(): ProjectRepository {
  if (!projectRepositoryInstance) {
    projectRepositoryInstance = new ProjectRepositoryImpl();
  }
  return projectRepositoryInstance;
}
```

**Reset for testing**:
```typescript
export function resetRepositories() {
  projectRepositoryInstance = null;
  // ... reset other repositories
}
```

### Transaction Handling

**Current**: Each method uses auto-commit transaction
```typescript
async create(project) {
  const db = await getDatabase();
  const tx = db.transaction('projects', 'readwrite');
  await tx.store.add(projectWithTimestamps);
  await tx.done; // Auto-commits
}
```

**Future**: Batch transactions for performance
```typescript
async createMultiple(projects) {
  const db = await getDatabase();
  const tx = db.transaction('projects', 'readwrite');
  for (const project of projects) {
    await tx.store.add(project);
  }
  await tx.done; // Single commit
}
```

---

## Event-Driven Execution

### Event Types

```typescript
type ExecutionEventType =
  | 'execution-started'
  | 'step-started'
  | 'step-completed'
  | 'execution-completed'
  | 'execution-error'
  | 'progress-updated';

interface ExecutionEvent {
  type: ExecutionEventType;
  progress: ExecutionProgress;
  step?: ExecutionStep;
  error?: Error;
  log?: ExecutionLogEntry;
}
```

### Event Emission

**Publisher**: `ExecutionEngine`
**Subscribers**: Zustand store, UI components, voice narrator

**Emission timing**:
1. **execution-started**: Immediately after `execute()` called
2. **step-started**: Before `executeStep()` called
3. **step-completed**: After `executeStep()` resolves successfully
4. **progress-updated**: After step-completed (percentage updated)
5. **execution-completed**: After all steps succeed
6. **execution-error**: After step-started fails

**Event order guarantee**:
```
execution-started
  → step-started (step 1)
  → step-completed (step 1)
  → progress-updated
  → step-started (step 2)
  → step-completed (step 2)
  → progress-updated
  → ...
  → execution-completed
```

**Error flow**:
```
execution-started
  → step-started (step 1)
  → step-completed (step 1)
  → step-started (step 2)
  → execution-error (step 2 failed)
  [execution halts, no further events]
```

### Subscription Management

**Register handler**:
```typescript
const engine = getExecutionEngine();
const unsubscribe = engine.on((event) => {
  console.log('Event:', event.type, event.progress.percentage);
});
```

**Unsubscribe**:
```typescript
unsubscribe(); // Removes handler from event listener array
```

**Multiple subscribers**:
```typescript
const sub1 = engine.on(handler1); // UI updates
const sub2 = engine.on(handler2); // Voice narration
const sub3 = engine.on(handler3); // Logging

// All three handlers called for each event
```

**Unsubscribe pattern** (Zustand store):
```typescript
executePlan: async () => {
  const engine = getExecutionEngine();
  const unsub = engine.on((event) => { /* handle */ });
  
  try {
    await engine.execute(plan);
  } finally {
    unsub(); // Always cleanup, even on error
  }
}
```

---

## Keyword Heuristics Deep Dive

### Algorithm

```typescript
function generateTasksForPhase(phase: PlanningPhase): Task[] {
  const intent = phase.intent.toLowerCase();
  const tasks: Task[] = [];

  // Keyword → task mapping
  const heuristics = [
    {
      keywords: ['setup', 'initialize', 'configure'],
      task: {
        title: 'Initial setup and configuration',
        description: 'Set up project structure and configure development environment'
      }
    },
    {
      keywords: ['implement', 'build', 'create', 'develop'],
      task: {
        title: 'Core implementation',
        description: 'Implement main features and core functionality'
      }
    },
    {
      keywords: ['test', 'quality', 'validation', 'qa'],
      task: {
        title: 'Testing and validation',
        description: 'Write tests and validate functionality'
      }
    },
    {
      keywords: ['deploy', 'release', 'launch'],
      task: {
        title: 'Deployment and release',
        description: 'Deploy to production and release'
      }
    },
    {
      keywords: ['document', 'documentation', 'docs'],
      task: {
        title: 'Documentation',
        description: 'Write documentation and guides'
      }
    }
  ];

  // Check each heuristic
  for (const heuristic of heuristics) {
    if (heuristic.keywords.some(kw => intent.includes(kw))) {
      tasks.push(heuristic.task);
    }
  }

  // Limit to 3 tasks per phase
  if (tasks.length > 3) {
    tasks.splice(3);
  }

  // Fallback: no keywords matched
  if (tasks.length === 0) {
    tasks.push({
      title: `Complete ${phase.title}`,
      description: phase.intent
    });
  }

  return tasks;
}
```

### Keyword Selection Rationale

#### "setup", "initialize", "configure"
**Rationale**: Most projects have initial setup phase
**Example phases**: "Setup & Foundation", "Project Initialization", "Configuration"
**Generated task**: "Initial setup and configuration"

#### "implement", "build", "create", "develop"
**Rationale**: Core development is always present
**Example phases**: "Core Development", "Implementation", "Build Features"
**Generated task**: "Core implementation"

#### "test", "quality", "validation", "qa"
**Rationale**: Testing is standard practice
**Example phases**: "Testing & Quality", "Validation", "QA"
**Generated task**: "Testing and validation"

#### "deploy", "release", "launch"
**Rationale**: Most projects need deployment
**Example phases**: "Deployment", "Release", "Production Launch"
**Generated task**: "Deployment and release"

#### "document", "documentation", "docs"
**Rationale**: Documentation phase often explicit
**Example phases**: "Documentation", "Write Docs", "Developer Guides"
**Generated task**: "Documentation"

### Edge Cases

#### Multiple keywords in same phase
**Example**: "Setup and Test Environment"
**Intent**: "initialize project and configure testing framework"
**Keywords matched**: "initialize" (setup), "configure" (setup), "testing" (test)
**Tasks generated**:
1. "Initial setup and configuration"
2. "Testing and validation"

**Why no duplicate?** Each heuristic checked once; multiple matches = multiple tasks

#### No keywords matched
**Example**: "Optimization & Performance"
**Intent**: "improve performance and optimize algorithms"
**Keywords matched**: None
**Tasks generated**:
1. "Complete Optimization & Performance"

**Fallback ensures at least one task per phase**

#### Limit to 3 tasks
**Example**: "Full Lifecycle"
**Intent**: "setup, implement, test, deploy, and document the application"
**Keywords matched**: All 5 heuristics
**Tasks generated (before limit)**:
1. "Initial setup and configuration"
2. "Core implementation"
3. "Testing and validation"
4. "Deployment and release"
5. "Documentation"

**Tasks after limit**:
1. "Initial setup and configuration"
2. "Core implementation"
3. "Testing and validation"

**Rationale**: 3 tasks per phase is manageable; 5+ is overwhelming

---

## Document Generation

### High-Level Design (HLD)

**Purpose**: Architectural overview for developers

**Template**:
```markdown
# {{projectName}} - High-Level Design

## Project Summary
{{projectSummary}}

## Goals
{{#each goals}}
- {{this}}
{{/each}}

## Non-Goals (Out of Scope)
{{#each nonGoals}}
- {{this}}
{{/each}}

## Assumptions
{{#each assumptions}}
- {{this}}
{{/each}}

## Risks
{{#each risks}}
- {{this}}
{{/each}}

## Architecture Phases
{{#each phases}}
### Phase {{@index}}: {{title}}
{{intent}}
{{/each}}

---
*Generated by CORTEX Planning System*
```

**Example output** (300-500 words):
```markdown
# Task Management System - High-Level Design

## Project Summary
A web-based task management application for tracking personal and team tasks.

## Goals
- Users can create, update, and delete tasks
- Tasks can be filtered by status (active, completed)
- Mobile-responsive design
- Built with React

## Non-Goals (Out of Scope)
- Multi-user collaboration features
- Real-time synchronization
- Mobile native apps

## Assumptions
- Users have modern browsers (Chrome, Firefox, Safari)
- Internet connection required for deployment
- No offline support in MVP

## Risks
- React learning curve for new developers
- State management complexity as features grow
- Mobile responsiveness testing effort

## Architecture Phases

### Phase 0: Setup & Foundation
Initialize project structure, install React and dependencies, configure development environment.

### Phase 1: Core Development
Implement task CRUD operations, state management with Context API, and basic UI components.

### Phase 2: Filtering & UI Polish
Add filtering by status, improve mobile responsiveness, refine UI/UX.

### Phase 3: Testing & Quality
Write unit tests for components, integration tests for task operations, manual testing on devices.

### Phase 4: Deployment
Deploy to GitHub Pages, configure production build, test in production.

---
*Generated by CORTEX Planning System*
```

### Low-Level Design (LLD)

**Purpose**: Detailed task breakdown for implementation

**Template**:
```markdown
# {{projectName}} - Low-Level Design

## Project Overview
{{projectSummary}}

## Phase Breakdown

{{#each phases}}
### Phase {{@index}}: {{title}}
**Intent**: {{intent}}

**Tasks**:
{{#each tasks}}
- **{{title}}**: {{description}}
{{/each}}

{{/each}}

## Technical Considerations
- Follow best practices for {{tech stack inferred from goals}}
- Ensure code quality with linting and testing
- Document code for maintainability

---
*Generated by CORTEX Planning System*
```

**Example output** (500-800 words):
```markdown
# Task Management System - Low-Level Design

## Project Overview
A web-based task management application for tracking personal and team tasks.

## Phase Breakdown

### Phase 0: Setup & Foundation
**Intent**: Initialize project structure, install React and dependencies, configure development environment.

**Tasks**:
- **Initial setup and configuration**: Set up project structure and configure development environment

### Phase 1: Core Development
**Intent**: Implement task CRUD operations, state management with Context API, and basic UI components.

**Tasks**:
- **Core implementation**: Implement main features and core functionality
- **Testing and validation**: Write tests and validate functionality

### Phase 2: Filtering & UI Polish
**Intent**: Add filtering by status, improve mobile responsiveness, refine UI/UX.

**Tasks**:
- **Core implementation**: Implement main features and core functionality
- **Testing and validation**: Write tests and validate functionality

### Phase 3: Testing & Quality
**Intent**: Write unit tests for components, integration tests for task operations, manual testing on devices.

**Tasks**:
- **Testing and validation**: Write tests and validate functionality

### Phase 4: Deployment
**Intent**: Deploy to GitHub Pages, configure production build, test in production.

**Tasks**:
- **Deployment and release**: Deploy to production and release

## Technical Considerations
- Follow React best practices for component composition and state management
- Use CSS modules or styled-components for styling
- Ensure accessibility compliance (WCAG 2.1)
- Implement responsive design with mobile-first approach
- Write comprehensive tests with Jest and React Testing Library
- Optimize build size with code splitting and lazy loading
- Document components with JSDoc comments
- Use ESLint and Prettier for code quality

---
*Generated by CORTEX Planning System*
```

---

## Voice Narration Templates

### Narration Philosophy

**Principle**: **Informative without overwhelming**

**Strategy**: Milestone-based updates (25%, 50%, 75%)

**Rationale**:
- **User attention**: Humans track progress in chunks (25%, 50%, 75%, 100%), not continuous percentages
- **Battery efficiency**: Fewer TTS calls → less CPU usage
- **Comprehension**: 4-5 narrations are memorable; 20+ are noise

### Template Methods

#### narrateStart
```typescript
narrateStart(event: ExecutionEvent): string {
  return `Starting execution. Creating your plan with ${event.progress.totalSteps} steps.`;
}
```

**Example**: "Starting execution. Creating your plan with 23 steps."

#### narrateStepStart
```typescript
narrateStepStart(event: ExecutionEvent): string {
  const step = event.progress.currentStep;
  return step?.voiceNarration || step?.description || '';
}
```

**Examples**:
- "Creating project Task Management System"
- "Creating phase 1: Setup & Foundation"
- "Adding task: Initial setup and configuration"
- "Creating High-Level Design document"

#### narrateStepComplete
```typescript
narrateStepComplete(event: ExecutionEvent): string {
  const progress = event.progress;
  
  // Only narrate milestones
  if (Math.round(progress.percentage) % 25 === 0) {
    return `${Math.round(progress.percentage)}% complete.`;
  }
  
  return ''; // Silent for non-milestones
}
```

**Examples**:
- *[Step 1 completes, 4% done]* → "" (silent)
- *[Step 6 completes, 26% done]* → "25% complete." (rounded to milestone)
- *[Step 12 completes, 52% done]* → "50% complete."
- *[Step 18 completes, 78% done]* → "75% complete."

#### narrateComplete
```typescript
narrateComplete(event: ExecutionEvent): string {
  const count = event.progress.completedSteps;
  return `Planning complete! Created ${count} artifacts. Your project is ready.`;
}
```

**Example**: "Planning complete! Created 23 artifacts. Your project is ready."

#### narrateError
```typescript
narrateError(event: ExecutionEvent): string {
  const errorMsg = event.error?.message || 'Unknown error';
  return `Execution failed: ${errorMsg}. Please try again.`;
}
```

**Example**: "Execution failed: Database connection error. Please try again."

### TTS Voice Selection

**Current**: Browser default voice (user's system preference)

**Future**: Allow user to select voice from `speechSynthesis.getVoices()`

**Recommended voices**:
- **English (US)**: Samantha, Alex (macOS); Microsoft Zira (Windows); Google US English (Chrome)
- **English (UK)**: Daniel (macOS); Microsoft Hazel (Windows); Google UK English (Chrome)

**Voice parameters**:
- **Rate**: 1.0 (normal speed, not too fast)
- **Pitch**: 1.0 (neutral, not too high or low)
- **Volume**: 1.0 (max, user controls system volume)

---

## Performance Optimization

### Current Performance

**Execution speed**:
- **Pure planning** (ExecutionPlanner): <10ms
- **Persistence per step**: ~10-50ms (IndexedDB latency)
- **Total execution**: ~200ms × steps = 4-6 seconds for 20-30 steps

**Voice narration**:
- **TTS latency**: ~200-500ms per narration
- **Milestone-only**: 4-5 narrations = <2 seconds total

**UI updates**:
- **Progress bar**: 60fps smooth animation (CSS transition)
- **Execution log**: Instant append (React virtual scrolling not needed for <100 entries)

### Potential Optimizations

#### 1. Parallel Task Creation
**Current**: Tasks created sequentially within each phase
**Optimization**: Batch all tasks for a phase into one transaction

**Before**:
```typescript
for (const task of tasksForPhase) {
  await createTask(task); // 3 separate transactions
}
```

**After**:
```typescript
await createTasksBatch(tasksForPhase); // 1 transaction
```

**Impact**: Reduce 3 × 50ms = 150ms → 50ms per phase

#### 2. Multi-Entity Transactions
**Current**: Each step is separate transaction
**Optimization**: Group steps by entity type

**Before**:
```typescript
await createProject(project);     // TX 1
await createPhase(phase1);        // TX 2
await createPhase(phase2);        // TX 3
```

**After**:
```typescript
await createEntitiesBatch({
  projects: [project],
  phases: [phase1, phase2]
}); // TX 1
```

**Impact**: Reduce TX overhead (20ms × N transactions → 20ms total)

#### 3. IndexedDB Bulk Operations
**Library**: Use `idb` batch APIs (`putAll`, `addAll`)

**Current**:
```typescript
for (const entity of entities) {
  await store.add(entity);
}
```

**Optimized**:
```typescript
await store.addAll(entities);
```

**Impact**: Marginal (IndexedDB still commits per operation), but cleaner code

#### 4. Voice Narration Prefetch
**Current**: TTS synthesized on-demand
**Optimization**: Pre-synthesize all narrations before execution

**Before**:
```typescript
// During execution
speechController.speak(narration);
// [200-500ms delay while synthesizing]
```

**After**:
```typescript
// Before execution
const audioBuffers = await preloadNarrations([
  "Starting execution...",
  "25% complete.",
  "50% complete.",
  ...
]);

// During execution
playAudioBuffer(audioBuffers[milestone]);
// [<50ms playback latency]
```

**Impact**: Reduce voice latency from 200-500ms to <50ms

---

## Testing Strategies

### Unit Testing

#### ExecutionPlanner
```typescript
describe('ExecutionPlanner', () => {
  it('generates project step from draft', () => {
    const draft = mockPlanningDraft();
    const plan = generatePlan(draft, 'conv-123');
    
    expect(plan.steps[0].type).toBe('create-project');
    expect(plan.steps[0].payload.name).toBe('Mock Project');
  });

  it('generates tasks using keyword heuristics', () => {
    const phase = { title: 'Setup', intent: 'initialize and configure' };
    const tasks = generateTasksForPhase(phase);
    
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe('Initial setup and configuration');
  });

  it('limits tasks to 3 per phase', () => {
    const phase = { title: 'All', intent: 'setup implement test deploy document' };
    const tasks = generateTasksForPhase(phase);
    
    expect(tasks).toHaveLength(3);
  });
});
```

#### ExecutionEngine
```typescript
describe('ExecutionEngine', () => {
  it('executes steps sequentially', async () => {
    const plan = mockExecutionPlan(3 steps);
    const engine = new ExecutionEngine();
    
    const events: ExecutionEvent[] = [];
    engine.on(e => events.push(e));
    
    await engine.execute(plan);
    
    expect(events).toHaveLength(9); // started, 3×(step-start, step-complete, progress), completed
  });

  it('stops on first error', async () => {
    const plan = mockExecutionPlan(3 steps);
    const engine = new ExecutionEngine();
    
    // Mock repository to fail on step 2
    mockRepositoryToFailOnStep(2);
    
    await expect(engine.execute(plan)).rejects.toThrow();
    
    const progress = engine.getCurrentProgress();
    expect(progress.completedSteps).toBe(1); // Only step 1 completed
  });

  it('aborts execution mid-execution', async () => {
    const plan = mockExecutionPlan(10 steps);
    const engine = new ExecutionEngine();
    
    engine.on((e) => {
      if (e.type === 'step-completed' && e.progress.completedSteps === 3) {
        engine.abort();
      }
    });
    
    await expect(engine.execute(plan)).rejects.toThrow('aborted');
    
    const progress = engine.getCurrentProgress();
    expect(progress.completedSteps).toBe(3);
  });
});
```

#### Repositories
```typescript
describe('ProjectRepository', () => {
  beforeEach(async () => {
    await clearDatabase();
  });

  it('creates project with timestamps', async () => {
    const repo = getProjectRepository();
    const project = await repo.create(mockProject());
    
    expect(project.createdAt).toBeInstanceOf(Date);
    expect(project.updatedAt).toBeInstanceOf(Date);
  });

  it('retrieves project by ID', async () => {
    const repo = getProjectRepository();
    const created = await repo.create(mockProject());
    
    const retrieved = await repo.getById(created.id);
    expect(retrieved).toEqual(created);
  });

  it('returns null for non-existent ID', async () => {
    const repo = getProjectRepository();
    const retrieved = await repo.getById('non-existent');
    
    expect(retrieved).toBeNull();
  });

  it('filters by conversation ID', async () => {
    const repo = getProjectRepository();
    await repo.create({ ...mockProject(), conversationId: 'conv-1' });
    await repo.create({ ...mockProject(), conversationId: 'conv-1' });
    await repo.create({ ...mockProject(), conversationId: 'conv-2' });
    
    const projects = await repo.getByConversationId('conv-1');
    expect(projects).toHaveLength(2);
  });
});
```

### Integration Testing

#### End-to-End Execution Flow
```typescript
describe('Phase 3B Integration', () => {
  it('creates all artifacts from planning draft', async () => {
    const draft = mockPlanningDraft(5 phases);
    const planner = getExecutionPlanner();
    const engine = getExecutionEngine();
    
    const plan = planner.generatePlan(draft, 'conv-123');
    await engine.execute(plan);
    
    // Verify persistence
    const projectRepo = getProjectRepository();
    const projects = await projectRepo.getByConversationId('conv-123');
    expect(projects).toHaveLength(1);
    
    const phaseRepo = getPhaseRepository();
    const phases = await phaseRepo.getByProjectId(projects[0].id);
    expect(phases).toHaveLength(5);
    
    const taskRepo = getTaskRepository();
    const tasks = await taskRepo.getByProjectId(projects[0].id);
    expect(tasks.length).toBeGreaterThanOrEqual(5); // At least 1 task per phase
    
    const docRepo = getDocumentRepository();
    const docs = await docRepo.getByProjectId(projects[0].id);
    expect(docs).toHaveLength(2); // HLD + LLD
  });
});
```

### Browser Testing

#### IndexedDB Compatibility
Test across:
- **Chrome/Edge**: 60+ (Blink engine)
- **Firefox**: 50+ (Gecko engine)
- **Safari**: 11+ (WebKit engine)

**Known issues**:
- Safari private mode: IndexedDB disabled → graceful fallback needed
- Firefox: Quota prompts → handle QuotaExceededError

#### Voice Synthesis Compatibility
Test across:
- **Windows**: Microsoft voices (Zira, David)
- **macOS**: Apple voices (Samantha, Alex)
- **Linux**: eSpeak voices (variable quality)
- **Mobile**: iOS (Siri voices), Android (Google TTS)

**Known issues**:
- Android Chrome: TTS rate bug (rate > 1.5 causes clipping)
- Safari iOS: Voice list not populated until user interaction

---

## Summary

Phase 3B's execution pipeline is built on deterministic algorithms, persistent storage, and event-driven progress tracking. The system prioritizes transparency, user control, and performance, with clear error handling and voice narration strategies.

**Key technical achievements**:
- ✅ Deterministic keyword heuristics (no AI in Phase 3B)
- ✅ Event-driven execution with flexible subscription
- ✅ IndexedDB schema with optimized indexes
- ✅ Repository pattern for clean CRUD separation
- ✅ Milestone-based voice narration (user-friendly)
- ✅ Sequential execution with stop-on-first-error
- ✅ Template-based document generation (HLD/LLD)

**Future optimizations**:
- Parallel task creation
- Multi-entity transactions
- Voice narration prefetch
- Resume-from-error capability
