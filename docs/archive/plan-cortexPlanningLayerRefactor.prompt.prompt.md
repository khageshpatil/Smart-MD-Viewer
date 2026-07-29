# CORTEX Planning Layer: Complete Architecture Refactor

## Executive Summary

CORTEX aims to be a **voice-enabled planning assistant** for developers—a conversational AI that helps brainstorm ideas, discuss requirements, and intelligently generate project plans and tickets. However, the current implementation has **critical architectural gaps** that prevent it from fulfilling this vision effectively.

This plan addresses the fundamental issues and proposes a clean, production-ready architecture focused on CORTEX's core mission: **being the planning brain of a dev ecosystem**.

---

## 🎯 Vision Clarity

### What CORTEX Should Be
- **Conversational Planning Partner**: Discuss ideas naturally via voice/text
- **Intelligent Brainstorming Assistant**: Ask clarifying questions, explore possibilities
- **Smart Ticket Generator**: Convert conversations into structured project plans
- **Context-Aware AI**: Remember conversation history, project context, design decisions
- **Voice-First Experience**: Seamless speech recognition + synthesis with smart interruption handling

### What's Currently Broken
1. **No Conversation State Machine** → AI responses feel disjointed
2. **Poor Voice Flow** → No interruption handling, no voice feedback states
3. **Fragmented AI Logic** → 5+ different AI modules with overlapping responsibilities
4. **Missing Context Continuity** → Each AI call loses previous conversation context
5. **No Structured Planning Pipeline** → Ideas → Requirements → HLD → LLD → Tickets flow is broken
6. **Security Critical** → API keys exposed in frontend
7. **No Error Recovery** → Voice/AI failures crash the experience

---

## 🚨 Critical Issues Analysis

### Important Note: Client-Side Architecture Constraints

**Deployment Context:**
- ✅ GitHub Pages hosting (static site)
- ✅ No backend server available
- ✅ IndexedDB for local storage
- ⚠️ API keys in environment variables (exposed in client bundle)
- ⚠️ Cannot implement true server-side security

**Security Approach:**
Since we're client-side only, we'll focus on:
1. **User Education** - Clear warnings about API key management
2. **Personal Use** - Design for individual use, not public deployment
3. **Key Rotation** - Easy key rotation when compromised
4. **Rate Limiting** - Client-side rate limiting to prevent abuse
5. **Cost Monitoring** - Usage tracking to detect anomalies

### 1. **Broken Conversation Flow Architecture**

**Current State:**
- `voiceConversation.ts` - Manages conversation state
- `naturalAI.ts` - Processes natural language
- `collaborativeAI.ts` - Handles multi-turn conversations
- `intentParser.ts` - Parses commands
- `aiActions.ts` - Executes actions

**Problem:** These 5 modules have **overlapping responsibilities** and don't work together cohesively. There's no single source of truth for conversation state.

**Example Bug in Focus.tsx (lines 38-159):**
```typescript
const [conversationMessages, setConversationMessages] = useState<AIMessage[]>([]);
const [voiceConversationActive, setVoiceConversationActive] = useState(false);
const [pendingAction, setPendingAction] = useState<...>(null);
```
- Conversation state scattered across component
- No persistence of conversation history
- AI loses context between sessions
- No conversation recovery after errors

**Impact:**
- AI can't maintain context across multiple exchanges
- Brainstorming feels fragmented, not conversational
- Clarification questions don't build on previous answers
- Users must repeat information

---

### 2. **Voice Interaction UX is Fundamentally Broken**

**Current Issues:**

**a) No Voice Interruption Handling**
- User can't interrupt AI mid-speech
- No "stop talking" button that feels responsive
- `speech.ts` doesn't coordinate with `voice.ts`

**b) No Voice Feedback States**
```typescript
// Focus.tsx only has basic states:
const [voiceState, setVoiceState] = useState<"idle" | "listening" | "preview" | "executing">("idle");
```
Missing critical states:
- "processing" (AI is thinking)
- "speaking" (AI is responding)
- "waiting-for-confirmation" (user needs to approve action)
- "interrupted" (user stopped AI)

**c) No Audio Queue Management**
- Multiple speech requests can overlap
- No cancellation when new input arrives
- Browser speech synthesis queue not managed

**d) Poor Microphone Handling**
- No visual feedback when mic is active
- No noise cancellation or level indicators
- Permission errors not gracefully handled

---

### 3. **Planning Pipeline is Non-Existent**

**What Should Happen:**
```
User Idea/Voice Input
  ↓
Brainstorm & Clarify (multi-turn conversation)
  ↓
Synthesize Project Description
  ↓
Generate High-Level Design (HLD)
  ↓
Create Low-Level Design (LLD)
  ↓
Generate Structured Tickets/Tasks
  ↓
User Review & Approve
  ↓
Execute & Create Tickets
```

**What Actually Happens:**
- Functions exist but aren't orchestrated
- No pipeline state management
- User can trigger steps out of order
- No validation of prerequisites (e.g., can generate LLD without HLD)
- No checkpoint system to resume interrupted planning

**Example from collaborativeAI.ts:**
```typescript
export async function generateHLD(...) {
  if (!project.description || project.description.trim().length === 0) {
    throw new Error("Project must have a description before generating HLD...");
  }
  // But nothing enforces this flow in UI
}
```

---

### 4. **AI Context Management is Primitive**

**Current SystemContext (types/ai.ts):**
```typescript
export interface SystemContext {
  currentProject?: Project;
  currentDocument?: Document;
  existingTasks?: Task[];
  existingDocuments?: Document[];
}
```

**What's Missing:**
- **Conversation history** → AI can't reference previous exchanges
- **Planning stage** → AI doesn't know where user is in planning pipeline
- **Design decisions** → No memory of architectural choices discussed
- **User preferences** → No learning from past interactions
- **Constraints & requirements** → Not tracked across conversations

**Result:** Every AI interaction starts from zero context, making brainstorming ineffective.

---

### 5. **Gemini API Integration Needs Improvement**

**Current Implementation (gemini.ts line 8):**
```typescript
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
```

**Client-Side Reality:**
- ⚠️ API key will be visible in bundle (unavoidable for GitHub Pages)
- ⚠️ Suitable for **personal use only**, not public deployment
- ❌ No client-side rate limiting
- ❌ No cost tracking
- ❌ No request queuing or deduplication

**Reliability Issues:**
- No retry logic with exponential backoff
- No streaming responses (long waits with no feedback)
- No request cancellation support
- No fallback when API is down
- Errors lose original prompt (can't debug)

**Performance Issues:**
- No response caching for repeated questions
- No batching of related requests
- Always uses same temperature (0.7) regardless of task type
- No token usage optimization

---

### 6. **State Management Chaos**

**Focus.tsx has 15+ useState hooks:**
```typescript
const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
const [selectedProject, setSelectedProject] = useState<Project | null>(null);
const [projectTasks, setProjectTasks] = useState<Task[]>([]);
const [selectedTask, setSelectedTask] = useState<Task | null>(null);
const [taskModalOpen, setTaskModalOpen] = useState(false);
const [projectModalOpen, setProjectModalOpen] = useState(false);
const [planPreviewOpen, setPlanPreviewOpen] = useState(false);
const [generatedPlan, setGeneratedPlan] = useState<...>(null);
const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
const [isExecutingPlan, setIsExecutingPlan] = useState(false);
const [voiceState, setVoiceState] = useState<...>("idle");
const [voiceConversationActive, setVoiceConversationActive] = useState(false);
const [conversationMessages, setConversationMessages] = useState<AIMessage[]>([]);
const [pendingAction, setPendingAction] = useState<...>(null);
const [projectDocuments, setProjectDocuments] = useState<...>([]);
// ... more state variables
```

**Problems:**
- State updates trigger cascading useEffect chains
- Race conditions when multiple async operations run
- No single source of truth
- Difficult to debug
- Component grows to 829 lines

---

### 7. **No Planning Session Persistence**

**Critical Gap:**
- User has 20-minute voice brainstorming session
- Browser crashes or user closes tab
- **All conversation lost** → must start over
- No way to resume planning session
- No history of design decisions made

**Missing Features:**
- Session save/restore
- Conversation checkpoints
- Planning stage bookmarks
- Decision history log
- Session export/import

---

## 🏗️ Proposed Clean Architecture

### Architecture Principles

1. **Single Responsibility**: Each module has ONE clear job
2. **State Machines**: Voice and Planning flows as explicit state machines
3. **Context First**: Rich context object passed through entire planning pipeline
4. **Client-Side First**: Pure client-side architecture optimized for GitHub Pages
5. **Persistence**: All planning sessions saved to IndexedDB with version control
6. **Error Recovery**: Graceful fallbacks at every layer
7. **Personal Use Design**: Optimized for individual developers, not multi-tenant

---

## 📐 New System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    USER INTERFACE LAYER                  │
│  ┌─────────────────────────────────────────────────┐   │
│  │         Focus View (Planning Interface)          │   │
│  │  • Voice Button with visual feedback             │   │
│  │  • Conversation display with history             │   │
│  │  • Planning pipeline progress indicator          │   │
│  │  • Action confirmation UI                        │   │
│  │  • API key configuration UI                      │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│              STATE MANAGEMENT LAYER (Zustand)            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Voice      │  │   Planning   │  │  Conversation│ │
│  │   Store      │  │   Store      │  │    Store     │ │
│  │              │  │              │  │              │ │
│  │ • voiceState │  │ • stage      │  │ • messages   │ │
│  │ • isRecording│  │ • progress   │  │ • context    │ │
│  │ • isSpeaking │  │ • checkpoints│  │ • history    │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│               BUSINESS LOGIC LAYER                       │
│  ┌─────────────────────────────────────────────────┐   │
│  │      Voice Orchestrator (State Machine)          │   │
│  │  idle → listening → processing → speaking        │   │
│  │  Handles: interruptions, errors, feedback        │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │    Planning Pipeline Engine (State Machine)      │   │
│  │  brainstorm → describe → hld → lld → tickets     │   │
│  │  Validates prerequisites, manages checkpoints     │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │      Conversation Manager (Context Aware)        │   │
│  │  Maintains rich context, manages AI memory       │   │
│  │  Handles multi-turn conversations                │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                  SERVICE LAYER                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐ │
│  │   Speech     │  │ Gemini API   │  │  Persistence │ │
│  │   Service    │  │   Client     │  │   Service    │ │
│  │              │  │              │  │              │ │
│  │ • recognize  │  │ • chat()     │  │ • sessions   │ │
│  │ • synthesize │  │ • plan()     │  │ • checkpoints│ │
│  │ • interrupt  │  │ • clarify()  │  │ • recovery   │ │
│  │ • queue      │  │ • retry      │  │ • export     │ │
│  └──────────────┘  └──────────────┘  └──────────────┘ │
│                   Client-Side Rate Limiting & Caching    │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│             EXTERNAL SERVICES & STORAGE                  │
│  [Gemini API]  [IndexedDB]  [Browser Speech APIs]       │
│  [GitHub Pages Static Hosting]                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 Core Components Design

### 1. Voice State Machine

```typescript
// lib/voice/voiceStateMachine.ts

type VoiceState = 
  | { type: 'idle' }
  | { type: 'listening'; startTime: number }
  | { type: 'processing'; transcript: string }
  | { type: 'speaking'; text: string; progress: number }
  | { type: 'interrupted'; reason: string }
  | { type: 'error'; error: Error; recoverable: boolean };

type VoiceEvent = 
  | { type: 'START_LISTENING' }
  | { type: 'TRANSCRIPT_RECEIVED'; transcript: string }
  | { type: 'AI_RESPONSE_READY'; response: string }
  | { type: 'SPEECH_COMPLETE' }
  | { type: 'USER_INTERRUPT' }
  | { type: 'ERROR'; error: Error }
  | { type: 'RESET' };

class VoiceStateMachine {
  private state: VoiceState;
  private listeners: Set<(state: VoiceState) => void>;
  private speechSynthesis: SpeechController;
  private speechRecognition: RecognitionController;
  
  transition(event: VoiceEvent): void {
    // State machine logic with validation
    // Handles interruptions gracefully
    // Manages audio queue
    // Provides visual feedback hooks
  }
  
  interrupt(): void {
    // Stop speaking immediately
    // Cancel ongoing recognition
    // Clear audio queue
    // Transition to interrupted state
  }
  
  canTransitionTo(targetState: VoiceState['type']): boolean {
    // Validate state transitions
  }
}
```

**Key Features:**
- ✅ Explicit state transitions with validation
- ✅ Interrupt handling at any point
- ✅ Audio queue management
- ✅ Error recovery with retry logic
- ✅ Observable state for UI feedback

---

### 2. Planning Pipeline State Machine

```typescript
// lib/planning/planningPipeline.ts

type PlanningStage = 
  | 'idle'
  | 'brainstorming'
  | 'synthesizing-description'
  | 'generating-hld'
  | 'generating-lld'
  | 'creating-tasks'
  | 'review'
  | 'executing'
  | 'complete';

interface PlanningContext {
  projectId: string;
  stage: PlanningStage;
  conversationHistory: AIMessage[];
  artifacts: {
    description?: string;
    hld?: string;
    lld?: string;
    tasks?: GeneratedTask[];
  };
  checkpoints: PlanningCheckpoint[];
  metadata: {
    startTime: number;
    lastUpdated: number;
    totalDuration: number;
    aiTokensUsed: number;
  };
}

class PlanningPipeline {
  private context: PlanningContext;
  
  async advanceStage(): Promise<void> {
    // Validate prerequisites for next stage
    // Create checkpoint before advancing
    // Update context with new artifacts
  }
  
  async createCheckpoint(): Promise<PlanningCheckpoint> {
    // Save current state to IndexedDB
    // Include all artifacts and conversation history
    // Return checkpoint ID for recovery
  }
  
  async restoreCheckpoint(checkpointId: string): Promise<void> {
    // Load checkpoint from IndexedDB
    // Restore conversation history
    // Resume from saved stage
  }
  
  canAdvanceToStage(stage: PlanningStage): boolean {
    // Check if prerequisites are met
    // e.g., can't create LLD without HLD
  }
  
  getNextStage(): PlanningStage | null {
    // Determine next stage in pipeline
  }
}
```

**Key Features:**
- ✅ Enforces linear progression through planning stages
- ✅ Validates prerequisites (can't skip steps)
- ✅ Automatic checkpointing for recovery
- ✅ Clear progress indicators for UI
- ✅ Session persistence

---

### 3. Rich Conversation Context

```typescript
// lib/ai/conversationContext.ts

interface EnhancedSystemContext {
  // Basic Context
  project: {
    id: string;
    name: string;
    description?: string;
    createdAt: number;
  };
  
  // Planning State
  planningStage: PlanningStage;
  planningProgress: number; // 0-100
  
  // Conversation Memory
  conversation: {
    messages: AIMessage[];
    summary: string; // AI-generated summary of conversation
    keyDecisions: Decision[]; // Important choices made
    openQuestions: string[]; // Unanswered questions
  };
  
  // Design Artifacts
  artifacts: {
    description?: {
      content: string;
      version: number;
      updatedAt: number;
    };
    hld?: {
      content: string;
      architecture: string; // e.g., "microservices"
      technologies: string[];
      updatedAt: number;
    };
    lld?: {
      content: string;
      modules: string[];
      updatedAt: number;
    };
  };
  
  // Project Knowledge
  documents: Document[];
  existingTasks: Task[];
  
  // User Preferences (learned)
  preferences: {
    techStack: string[];
    architectureStyle: string;
    verbosity: 'concise' | 'detailed';
    confirmBeforeActions: boolean;
  };
  
  // Constraints
  constraints: {
    timeline?: string;
    budget?: string;
    teamSize?: number;
    technicalConstraints: string[];
  };
}

class ConversationContextManager {
  private context: EnhancedSystemContext;
  
  async updateContext(updates: Partial<EnhancedSystemContext>): Promise<void> {
    // Merge updates with existing context
    // Persist to IndexedDB
    // Notify listeners
  }
  
  async summarizeConversation(): Promise<string> {
    // Use AI to summarize conversation history
    // Keep context window manageable
    // Preserve key decisions
  }
  
  async extractDecisions(): Promise<Decision[]> {
    // Parse conversation for important decisions
    // e.g., "We decided to use PostgreSQL"
  }
  
  getContextForAI(): string {
    // Format context for AI prompt
    // Include relevant history and artifacts
    // Optimize token usage
  }
}
```

**Key Features:**
- ✅ Rich context passed to every AI interaction
- ✅ Conversation summarization to manage token limits
- ✅ Decision tracking for consistency
- ✅ Learned preferences over time
- ✅ Persistent across sessions

---

### 4. Enhanced Gemini API Client (Client-Side)

```typescript
// lib/ai/geminiClient.ts

interface GeminiClient {
  // Conversational AI
  chat(params: {
    message: string;
    context: EnhancedSystemContext;
    conversationId: string;
  }): Promise<{
    response: string;
    suggestedActions?: Action[];
    needsConfirmation: boolean;
  }>;
  
  // Planning & Design
  generatePlan(params: {
    context: EnhancedSystemContext;
    preferences: PlanningPreferences;
  }): Promise<{
    tasks: GeneratedTask[];
    phases: Phase[];
    summary: string;
  }>;
  
  clarifyProject(params: {
    context: EnhancedSystemContext;
    userResponse?: string;
  }): Promise<{
    questions: string[];
    synthesizedDescription?: string;
  }>;
  
  generateHLD(params: {
    context: EnhancedSystemContext;
  }): Promise<{
    design: string;
    architecture: ArchitectureDecision[];
    diagrams: MermaidDiagram[];
  }>;  
  
  generateLLD(params: {
    context: EnhancedSystemContext;
    hld: string;
  }): Promise<{
    design: string;
    modules: Module[];
    interfaces: Interface[];
  }>;
}

class GeminiClientImpl implements GeminiClient {
  private apiKey: string;
  private requestQueue: RequestQueue;
  private cache: ResponseCache;
  private rateLimiter: ClientSideRateLimiter;
  private usageTracker: UsageTracker;
  
  constructor() {
    // Load API key from env or user settings
    this.apiKey = this.loadApiKey();
    this.rateLimiter = new ClientSideRateLimiter({
      maxRequestsPerMinute: 10,
      maxRequestsPerHour: 100,
    });
    this.usageTracker = new UsageTracker();
  }
  
  private loadApiKey(): string {
    // Priority: User-configured > Environment variable
    const userKey = localStorage.getItem('gemini_api_key');
    return userKey || import.meta.env.VITE_GEMINI_API_KEY || '';
  }
  
  async chat(params) {
    // Check rate limits
    await this.rateLimiter.checkLimit();
    
    // Queue request to prevent overload
    // Check cache for recent identical requests
    // Call Gemini API directly
    // Handle errors with retry logic
    // Track usage and costs
    // Return structured response
  }
}
```

**Key Features:**
- ✅ Direct Gemini API calls (no backend needed)
- ✅ Client-side rate limiting to prevent abuse
- ✅ Request queuing and deduplication
- ✅ Response caching for repeated queries
- ✅ Automatic retry with exponential backoff
- ✅ Usage tracking and cost monitoring
- ✅ User-configurable API key (override env)
- ✅ Type-safe interfaces

---

### 5. Client-Side Rate Limiting & Cost Tracking

```typescript
// lib/ai/rateLimiter.ts

class ClientSideRateLimiter {
  private requestLog: number[] = [];
  private limits = {
    perMinute: 10,
    perHour: 100,
    perDay: 500,
  };
  
  async checkLimit(): Promise<void> {
    const now = Date.now();
    
    // Clean old requests
    this.requestLog = this.requestLog.filter(time => 
      now - time < 24 * 60 * 60 * 1000 // 24 hours
    );
    
    // Check limits
    const lastMinute = this.requestLog.filter(t => now - t < 60_000).length;
    const lastHour = this.requestLog.filter(t => now - t < 3600_000).length;
    const lastDay = this.requestLog.length;
    
    if (lastMinute >= this.limits.perMinute) {
      throw new RateLimitError('Too many requests per minute. Please wait.');
    }
    if (lastHour >= this.limits.perHour) {
      throw new RateLimitError('Hourly limit reached. Please wait.');
    }
    if (lastDay >= this.limits.perDay) {
      throw new RateLimitError('Daily limit reached. Try again tomorrow.');
    }
    
    // Log this request
    this.requestLog.push(now);
    await this.persistLog();
  }
  
  private async persistLog(): Promise<void> {
    // Save to IndexedDB for persistence across sessions
    await saveToIndexedDB('rateLimitLog', this.requestLog);
  }
}

// lib/ai/usageTracker.ts

class UsageTracker {
  private usage: UsageRecord[] = [];
  
  async trackRequest(params: {
    conversationId: string;
    tokensUsed: number;
    cost: number;
  }): Promise<void> {
    const record: UsageRecord = {
      timestamp: Date.now(),
      ...params,
    };
    
    this.usage.push(record);
    await this.persistUsage();
    
    // Check budget thresholds
    const dailyCost = this.getDailyCost();
    if (dailyCost > 1.00) { // $1/day threshold
      this.notifyHighUsage(dailyCost);
    }
  }
  
  getDailyCost(): number {
    const today = Date.now() - 24 * 60 * 60 * 1000;
    return this.usage
      .filter(u => u.timestamp > today)
      .reduce((sum, u) => sum + u.cost, 0);
  }
  
  getUsageReport(): UsageReport {
    // Generate report for UI display
    return {
      today: this.getDailyCost(),
      thisWeek: this.getWeeklyCost(),
      thisMonth: this.getMonthlyCost(),
      totalRequests: this.usage.length,
      averageCostPerRequest: this.getAverageCost(),
    };
  }
}
```

**Key Features:**
- ✅ Client-side rate limiting (per minute/hour/day)
- ✅ Usage tracking with cost calculation
- ✅ Budget threshold alerts
- ✅ Persistent across browser sessions
- ✅ Usage dashboard for user awareness
- ⚠️ Can be bypassed by clearing browser data (acceptable for personal use)

---

### 6. Zustand State Stores

```typescript
// store/voiceStore.ts

interface VoiceStore {
  state: VoiceState;
  transcript: string | null;
  isRecording: boolean;
  isSpeaking: boolean;
  error: string | null;
  
  startListening: () => Promise<void>;
  stopListening: () => void;
  interrupt: () => void;
  speak: (text: string) => Promise<void>;
  reset: () => void;
}

export const useVoiceStore = create<VoiceStore>((set, get) => ({
  state: { type: 'idle' },
  transcript: null,
  isRecording: false,
  isSpeaking: false,
  error: null,
  
  startListening: async () => {
    const stateMachine = getVoiceStateMachine();
    stateMachine.transition({ type: 'START_LISTENING' });
    // ... implementation
  },
  
  // ... other methods
}));

// store/planningStore.ts

interface PlanningStore {
  context: PlanningContext | null;
  stage: PlanningStage;
  progress: number;
  
  startPlanning: (projectId: string) => Promise<void>;
  advanceStage: () => Promise<void>;
  createCheckpoint: () => Promise<string>;
  restoreCheckpoint: (id: string) => Promise<void>;
  updateArtifact: (type: string, content: string) => Promise<void>;
}

export const usePlanningStore = create<PlanningStore>((set, get) => ({
  // ... implementation
}));

// store/conversationStore.ts

interface ConversationStore {
  messages: AIMessage[];
  context: EnhancedSystemContext | null;
  isProcessing: boolean;
  
  sendMessage: (message: string) => Promise<void>;
  updateContext: (updates: Partial<EnhancedSystemContext>) => void;
  clearConversation: () => void;
  loadSession: (sessionId: string) => Promise<void>;
}

export const useConversationStore = create<ConversationStore>((set, get) => ({
  // ... implementation
}));
```

**Key Features:**
- ✅ Single source of truth for each domain
- ✅ No prop drilling
- ✅ Easy to test in isolation
- ✅ Persistent stores with IndexedDB middleware
- ✅ DevTools support for debugging

---

## 🎨 Improved UI Components

### 1. Enhanced Voice Button

```typescript
// components/VoiceButton.tsx

export const VoiceButton = () => {
  const { state, isRecording, isSpeaking, startListening, interrupt } = useVoiceStore();
  
  const getVisualFeedback = () => {
    switch (state.type) {
      case 'idle': return { icon: Mic, color: 'gray', pulse: false };
      case 'listening': return { icon: MicActive, color: 'red', pulse: true };
      case 'processing': return { icon: Brain, color: 'blue', pulse: true };
      case 'speaking': return { icon: Volume2, color: 'green', pulse: true };
      case 'interrupted': return { icon: MicOff, color: 'orange', pulse: false };
      case 'error': return { icon: AlertCircle, color: 'red', pulse: false };
    }
  };
  
  const { icon: Icon, color, pulse } = getVisualFeedback();
  
  return (
    <div className="voice-button-container">
      <Button
        onClick={isRecording || isSpeaking ? interrupt : startListening}
        className={cn(
          "voice-button",
          pulse && "animate-pulse",
          `bg-${color}-500`
        )}
        aria-label={isRecording ? "Stop listening" : isSpeaking ? "Interrupt AI" : "Start voice input"}
      >
        <Icon className="w-6 h-6" />
      </Button>
      
      {/* Audio Level Indicator */}
      {isRecording && <AudioLevelIndicator />}
      
      {/* Speaking Progress */}
      {isSpeaking && <SpeechProgressBar />}
      
      {/* State Label */}
      <span className="voice-state-label">
        {state.type === 'listening' && 'Listening...'}
        {state.type === 'processing' && 'Thinking...'}
        {state.type === 'speaking' && 'Speaking...'}
      </span>
    </div>
  );
};
```

---

### 2. Planning Pipeline Visualizer

```typescript
// components/PlanningPipelineVisualizer.tsx

const PIPELINE_STAGES = [
  { id: 'brainstorming', label: 'Brainstorm', icon: Lightbulb },
  { id: 'synthesizing-description', label: 'Define', icon: FileText },
  { id: 'generating-hld', label: 'HLD', icon: Network },
  { id: 'generating-lld', label: 'LLD', icon: Code },
  { id: 'creating-tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'review', label: 'Review', icon: Eye },
];

export const PlanningPipelineVisualizer = () => {
  const { stage, progress } = usePlanningStore();
  
  return (
    <div className="planning-pipeline">
      {PIPELINE_STAGES.map((s, index) => {
        const isActive = s.id === stage;
        const isComplete = PIPELINE_STAGES.findIndex(st => st.id === stage) > index;
        
        return (
          <div key={s.id} className={cn(
            "pipeline-stage",
            isActive && "active",
            isComplete && "complete"
          )}>
            <s.icon className="stage-icon" />
            <span className="stage-label">{s.label}</span>
            {isActive && <ProgressBar value={progress} />}
          </div>
        );
      })}
    </div>
  );
};
```

---

### 3. Conversation History Panel

```typescript
// components/ConversationPanel.tsx

export const ConversationPanel = () => {
  const { messages, context } = useConversationStore();
  const { stage } = usePlanningStore();
  
  return (
    <div className="conversation-panel">
      {/* Context Summary */}
      <div className="context-summary">
        <h3>Planning: {context?.project.name}</h3>
        <Badge>{stage}</Badge>
      </div>
      
      {/* Message History */}
      <div className="message-history">
        {messages.map((msg, i) => (
          <div key={i} className={cn(
            "message",
            msg.role === 'user' ? 'user-message' : 'ai-message'
          )}>
            <div className="message-avatar">
              {msg.role === 'user' ? <User /> : <Bot />}
            </div>
            <div className="message-content">
              <ReactMarkdown>{msg.content}</ReactMarkdown>
              {msg.suggestedActions && (
                <ActionButtons actions={msg.suggestedActions} />
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* Key Decisions */}
      {context?.conversation.keyDecisions.length > 0 && (
        <div className="key-decisions">
          <h4>Decisions Made</h4>
          <ul>
            {context.conversation.keyDecisions.map((d, i) => (
              <li key={i}>{d.description}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
```

---

## 📋 Implementation Roadmap

### Phase 1: Client-Side Security & Foundation (Week 1-2)

**Goals:**
- ✅ Implement client-side security best practices
- ✅ Add API key management UI
- ✅ Setup Zustand stores
- ✅ Add rate limiting and cost tracking

**Tasks:**
1. **API Key Management**
   - [ ] Create API key configuration UI in settings
   - [ ] Add secure storage in IndexedDB (encrypted)
   - [ ] Implement key validation flow
   - [ ] Add warning messages about key security
   - [ ] Create key rotation helper
   - [ ] Add environment variable fallback

2. **Client-Side Security Hardening**
   - [ ] Implement DOMPurify for HTML sanitization
   - [ ] Add Zod schemas for all data inputs
   - [ ] Implement client-side rate limiting
   - [ ] Create usage tracking and cost monitoring
   - [ ] Add budget alerts and thresholds
   - [ ] Create usage dashboard UI

3. **State Management Migration**
   - [ ] Create Zustand stores: voice, planning, conversation
   - [ ] Migrate Focus.tsx state to stores
   - [ ] Add IndexedDB persistence middleware
   - [ ] Remove redundant useState hooks
   - [ ] Add state persistence for offline usage

**Deliverables:**
- User-friendly API key configuration
- Client-side rate limiting active
- Usage tracking and cost monitoring
- State management refactored
- All inputs validated with Zod

---

### Phase 2: Voice System Overhaul (Week 3-4)

**Goals:**
- ✅ Implement voice state machine
- ✅ Add interruption handling
- ✅ Improve speech synthesis reliability

**Tasks:**
1. **Voice State Machine**
   - [ ] Create `VoiceStateMachine` class
   - [ ] Define all states and transitions
   - [ ] Implement interrupt handling
   - [ ] Add audio queue management
   - [ ] Create error recovery logic

2. **Speech Services Refactor**
   - [ ] Create `SpeechController` class
   - [ ] Implement speech interruption
   - [ ] Add voice selection & preferences
   - [ ] Create `RecognitionController` class
   - [ ] Add noise cancellation hooks
   - [ ] Implement continuous recognition mode

3. **UI Enhancements**
   - [ ] Redesign VoiceButton with state feedback
   - [ ] Add AudioLevelIndicator component
   - [ ] Add SpeechProgressBar component
   - [ ] Add microphone permission flow
   - [ ] Create voice settings panel

**Deliverables:**
- Smooth voice interaction flow
- User can interrupt AI at any point
- Clear visual feedback for all voice states
- Reliable speech recognition

---

### Phase 3: Planning Pipeline (Week 5-6)

**Goals:**
- ✅ Implement planning state machine
- ✅ Build rich conversation context
- ✅ Add session persistence

**Tasks:**
1. **Planning Pipeline Engine**
   - [ ] Create `PlanningPipeline` class
   - [ ] Define stage progression rules
   - [ ] Implement checkpoint system
   - [ ] Add prerequisite validation
   - [ ] Create recovery mechanism

2. **Conversation Context Manager**
   - [ ] Define `EnhancedSystemContext` schema
   - [ ] Create `ConversationContextManager`
   - [ ] Implement context persistence
   - [ ] Add conversation summarization
   - [ ] Implement decision extraction

3. **Session Management**
   - [ ] Create planning session IndexedDB schema
   - [ ] Implement save/restore functionality
   - [ ] Add session history view
   - [ ] Create checkpoint UI
   - [ ] Add session export/import

**Deliverables:**
- Linear planning pipeline enforced
- Conversation context maintained across sessions
- Users can resume interrupted planning
- All decisions tracked

---

### Phase 4: Enhanced Gemini Integration (Week 7-8)

**Goals:**
- ✅ Optimize Gemini API client
- ✅ Add response caching
- ✅ Improve context management

**Tasks:**
1. **Enhanced Gemini Client**
   - [ ] Create `GeminiClient` class
   - [ ] Implement request queuing
   - [ ] Add response caching layer
   - [ ] Implement retry logic with exponential backoff
   - [ ] Add request deduplication
   - [ ] Optimize prompt construction

2. **Context Optimization**
   - [ ] Implement conversation summarization
   - [ ] Add context window management
   - [ ] Create context compression strategies
   - [ ] Implement token counting
   - [ ] Add context pruning for long conversations

3. **AI Logic Consolidation**
   - [ ] Merge `naturalAI`, `collaborativeAI`, `intentParser`
   - [ ] Create unified AI orchestrator
   - [ ] Simplify prompts with better context
   - [ ] Add prompt templates library
   - [ ] Implement few-shot learning examples

**Deliverables:**
- Fast, reliable AI responses
- Efficient caching reduces API costs
- Consolidated AI logic
- Optimized token usage
- Smart context management

---

### Phase 5: UX Polish & Testing (Week 9-10)

**Goals:**
- ✅ Build new UI components
- ✅ Add comprehensive error handling
- ✅ Implement accessibility features

**Tasks:**
1. **UI Component Development**
   - [ ] Create PlanningPipelineVisualizer
   - [ ] Create ConversationPanel
   - [ ] Create ActionConfirmationDialog
   - [ ] Create PlanningSessionHistory
   - [ ] Add keyboard shortcuts

2. **Error Handling**
   - [ ] Add Error Boundaries
   - [ ] Implement user-friendly error messages
   - [ ] Add retry mechanisms
   - [ ] Create error recovery flows
   - [ ] Add error logging

3. **Accessibility**
   - [ ] Add ARIA labels throughout
   - [ ] Implement keyboard navigation
   - [ ] Add screen reader support
   - [ ] Test with accessibility tools
   - [ ] Add focus management

4. **Testing**
   - [ ] Unit tests for state machines
   - [ ] Integration tests for planning pipeline
   - [ ] E2E tests for voice flows
   - [ ] Performance testing
   - [ ] User acceptance testing

**Deliverables:**
- Polished UI with clear feedback
- Comprehensive error handling
- Accessibility compliant
- Tested and reliable system

---

### Phase 6: Performance & Optimization (Week 11-12)

**Goals:**
- ✅ Optimize rendering performance
- ✅ Reduce bundle size
- ✅ Improve loading times

**Tasks:**
1. **Performance Optimization**
   - [ ] Add React.memo to expensive components
   - [ ] Implement virtualization for long lists
   - [ ] Optimize re-renders with useMemo/useCallback
   - [ ] Lazy load components
   - [ ] Code splitting by route

2. **Bundle Optimization**
   - [ ] Analyze bundle size
   - [ ] Remove unused dependencies
   - [ ] Tree-shake libraries
   - [ ] Use dynamic imports
   - [ ] Optimize images/assets

3. **Caching & Persistence**
   - [ ] Implement service worker for offline
   - [ ] Add response caching strategy
   - [ ] Optimize IndexedDB queries
   - [ ] Add data compression
   - [ ] Implement background sync

**Deliverables:**
- Fast, responsive application
- Optimized bundle size
- Offline-capable
- Efficient data storage

---

## 🧪 Testing Strategy

### Unit Tests
- Voice state machine transitions
- Planning pipeline stage validation
- Conversation context manager
- AI response parsing
- Error recovery logic

### Integration Tests
- Voice → AI → Response flow
- Planning pipeline progression
- Session save/restore
- Backend proxy endpoints
- IndexedDB operations

### E2E Tests
- Complete planning session
- Voice interruption scenarios
- Error recovery flows
- Multi-session continuity
- Cross-browser compatibility

---

## 📊 Success Metrics

### Technical Metrics
- Voice recognition accuracy > 90%
- AI response latency < 3 seconds (p95)
- Speech synthesis interruption < 100ms
- Session recovery success rate > 99%
- Zero API key exposures

### User Experience Metrics
- Planning session completion rate > 80%
- User satisfaction with voice interaction > 4/5
- Average planning session duration < 20 minutes
- Interruption success rate > 95%
- Context continuity satisfaction > 4/5

### Business Metrics
- AI cost per planning session < $0.10
- Daily active users retention > 60%
- Feature adoption rate > 70%
- Bug report rate < 5/week
- User-reported planning quality > 4/5

---

## 🚧 Technical Debt & Future Considerations

### Known Limitations
1. **Single-User Focus**: No multi-user collaboration yet
2. **Cloud Sync**: No cross-device synchronization
3. **Advanced AI**: No fine-tuned models for domain-specific planning
4. **Voice Languages**: English only initially
5. **Mobile Experience**: Desktop-first, mobile needs optimization

### Future Enhancements
1. **Multi-User Collaboration**: Real-time collaborative planning sessions
2. **Cloud Backend**: Optional cloud sync for cross-device access
3. **Advanced Analytics**: Planning pattern analysis and recommendations
4. **Integration Hub**: Connect with Jira, Linear, GitHub Issues
5. **Custom AI Models**: Fine-tune for specific domains (web dev, mobile, ML)
6. **Voice Assistants**: Integrate with Alexa, Google Assistant
7. **Mobile Apps**: Native iOS/Android apps
8. **Template Library**: Pre-built planning templates
9. **Team Planning**: Multi-user planning sessions
10. **Export Options**: Export to project management tools

---

## 🎯 Key Architectural Decisions

### 1. Why Zustand over Redux/Context?
- **Simpler API**: Less boilerplate than Redux
- **Better Performance**: Prevents unnecessary re-renders
- **TypeScript Support**: Excellent type inference
- **Middleware Ecosystem**: Persist, DevTools, Immer built-in
- **Smaller Bundle**: ~1KB vs Redux's ~10KB

### 2. Why Client-Side Architecture vs Backend?
- **Simplicity**: No server setup or maintenance required
- **Privacy**: All data stays local in user's browser
- **Cost**: No hosting costs (GitHub Pages is free)
- **Deployment**: Simple static file deployment
- **Personal Use**: Optimized for individual developers
- **Offline-First**: Works without internet (after initial load)
- **Trade-off**: API key security relies on user configuration

### 3. Why State Machines?
- **Predictability**: All transitions explicit and validated
- **Testability**: Easy to test state logic in isolation
- **Debuggability**: Clear state history and transitions
- **Error Handling**: Explicit error states and recovery paths
- **Documentation**: State diagram serves as documentation

### 4. Why IndexedDB over localStorage?
- **Capacity**: 50MB+ vs 5-10MB
- **Structure**: Store complex objects natively
- **Querying**: Index and search capabilities
- **Asynchronous**: Non-blocking operations
- **Transactions**: ACID compliance for data integrity

---

## 📚 Documentation Requirements

### For Developers
1. **Architecture Guide**: System overview with diagrams
2. **API Reference**: Backend proxy endpoints documentation
3. **State Management Guide**: How to use Zustand stores
4. **Component Library**: UI component usage examples
5. **Testing Guide**: How to run and write tests
6. **Contribution Guidelines**: How to contribute to project

### For Users
1. **Getting Started Guide**: Setup and first planning session
2. **Voice Commands Reference**: Available voice commands
3. **Planning Pipeline Guide**: How planning stages work
4. **Troubleshooting**: Common issues and solutions
5. **FAQ**: Frequently asked questions
6. **Video Tutorials**: Walkthrough videos

---

## 🔐 Security Checklist (Client-Side Constraints)

**⚠️ Important: Client-Side Limitations**
As a GitHub Pages application, true server-side security is not possible. Focus on:
- User education and clear warnings
- Personal use optimization
- Easy key rotation
- Usage monitoring

**Security Measures:**
- [ ] API key configuration UI with security warnings
- [ ] API key stored in IndexedDB (encrypted where possible)
- [ ] Input validation on all user inputs (Zod)
- [ ] HTML sanitization (DOMPurify) on markdown rendering
- [ ] Client-side rate limiting (per minute/hour/day)
- [ ] Usage tracking with cost monitoring
- [ ] Budget alerts when thresholds exceeded
- [ ] Clear documentation about API key security
- [ ] Easy key rotation mechanism
- [ ] Request logging for debugging (local only)
- [ ] No sensitive data logged to console
- [ ] Content Security Policy in HTML
- [ ] Regular dependency updates
- [ ] Clear warning: "For personal use only"
- [ ] Documentation on securing API keys
- [ ] Recommend users create restricted API keys
- [ ] Guide for setting up Gemini API quotas

---

## 🎉 Conclusion

This refactor transforms CORTEX from a **fragmented collection of features** into a **cohesive, production-ready planning assistant** optimized for **personal use on GitHub Pages**. The key improvements:

1. **Voice-First Experience**: State machine ensures smooth, interruptible voice interactions
2. **Guided Planning**: Pipeline enforces logical progression through planning stages
3. **Context Continuity**: Rich context maintained across sessions with persistence
4. **Client-Side Security**: Best practices within GitHub Pages constraints
5. **Cost Control**: Client-side rate limiting and usage monitoring
6. **Reliability**: Comprehensive error handling and recovery mechanisms

**Architecture Note:**
This is a **client-side only** application designed for **personal use**. API keys are configured by users and stored locally. The architecture prioritizes:
- ✅ Simplicity (no backend required)
- ✅ Privacy (all data local)
- ✅ Cost control (rate limiting & monitoring)
- ✅ Easy deployment (GitHub Pages)
- ⚠️ Not suitable for public/multi-user deployment

**Timeline**: 12 weeks for full implementation  
**Team**: 2-3 developers recommended  
**Risk Level**: Medium (architectural changes require careful testing)
**Deployment**: GitHub Pages (static hosting)
**Target Users**: Individual developers for personal use

**Expected Outcomes**:
- ✅ Production-ready personal planning assistant
- ✅ Smooth voice interaction experience
- ✅ Reliable planning pipeline
- ✅ Secure client-side architecture (within constraints)
- ✅ Cost-effective AI usage
- ✅ Happy users who can plan projects conversationally

This is the CORTEX that developers deserve—a true AI planning partner optimized for personal productivity, not just a feature list.
