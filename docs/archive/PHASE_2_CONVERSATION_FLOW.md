# Phase 2: Conversation Flow Diagrams

## High-Level Conversation Flow

```mermaid
sequenceDiagram
    participant User
    participant VoiceUI as Focus UI
    participant Machine as State Machine
    participant Brain as ConversationBrain
    participant Gemini as Gemini API
    participant Store as Zustand Store

    User->>VoiceUI: Click "Start Listening"
    VoiceUI->>Machine: START_LISTENING
    Machine->>Machine: state = listening
    Machine->>VoiceUI: Update UI (Listening...)
    
    User->>Machine: Speaks: "I want to build a web app"
    Machine->>Machine: TRANSCRIPT_READY
    Machine->>Store: Update transcript
    Store->>Brain: addUserTurn("I want to build a web app")
    Brain->>Brain: Infer context (projectType = "web app")
    Store->>VoiceUI: Update conversation history
    
    Machine->>Machine: state = thinking
    Machine->>Gemini: chat(transcript) via GeminiClient
    Gemini->>Brain: decideResponseStrategy()
    Brain-->>Gemini: strategy = 'ask'
    Gemini->>Brain: buildPromptWithContext('ask')
    Brain-->>Gemini: Full prompt with history + context
    
    Gemini->>Gemini: Generate response
    Gemini-->>Machine: "What problem will this solve?"
    
    Machine->>Store: Update aiResponse
    Store->>Brain: addCortexTurn("What problem...")
    Store->>VoiceUI: Update conversation history
    
    Machine->>Machine: state = speaking
    Machine->>VoiceUI: Speak response
    Machine->>Machine: state = idle
    
    VoiceUI->>User: Display conversation history
```

## ConversationBrain Internal Flow

```mermaid
graph TD
    A[User Turn Added] --> B{Turn Count?}
    B -->|< 4 turns| C[Strategy: ASK]
    B -->|4-7 turns| D{Has Context?}
    B -->|8+ turns| E{Turn % 4 == 0?}
    
    D -->|No| F[Strategy: CLARIFY]
    D -->|Yes| G[Strategy: ACKNOWLEDGE]
    
    E -->|Yes| H[Strategy: SUMMARIZE]
    E -->|No| G
    
    C --> I[Build System Prompt]
    F --> I
    G --> I
    H --> I
    
    I --> J[Add Inferred Context]
    J --> K[Add Recent History<br/>Last 10 turns]
    K --> L[Format for Gemini]
    L --> M[Send to API]
    
    M --> N[Response Received]
    N --> O[CORTEX Turn Added]
    O --> P[Extract Questions]
    O --> Q[Update Context]
```

## State Machine Integration (Phase 0 + Phase 2)

```mermaid
stateDiagram-v2
    [*] --> Idle
    
    Idle --> Listening: START_LISTENING
    Listening --> Thinking: TRANSCRIPT_READY<br/>(+ addUserTurn)
    Thinking --> Speaking: AI_RESPONSE_READY<br/>(+ addCortexTurn)
    Speaking --> Idle: SPEECH_COMPLETE
    
    Listening --> Interrupted: USER_INTERRUPT
    Thinking --> Interrupted: USER_INTERRUPT
    Speaking --> Interrupted: USER_INTERRUPT
    Interrupted --> Idle: Auto-transition
    
    Listening --> Error: ERROR
    Thinking --> Error: ERROR
    Speaking --> Error: ERROR
    Error --> Idle: RESET
    
    note right of Thinking
        Phase 2 Enhancement:
        - ConversationBrain builds
          context-aware prompt
        - Includes history + strategy
    end note
    
    note right of Speaking
        Phase 2 Enhancement:
        - Tracks CORTEX turn
        - Updates UI with history
    end note
```

## Context Inference Pipeline

```mermaid
graph LR
    A[User Input:<br/>"React web app<br/>with auth"] --> B[ConversationBrain]
    
    B --> C[Project Type<br/>Detector]
    B --> D[Platform<br/>Detector]
    B --> E[Feature<br/>Detector]
    B --> F[Constraint<br/>Detector]
    
    C --> G{Keywords Match?}
    G -->|"web app"| H[projectType = "web app"]
    
    D --> I{Keywords Match?}
    I -->|"react"| J[platform = "React"]
    
    E --> K{Keywords Match?}
    K -->|"auth"| L[features += "authentication"]
    
    F --> M{Keywords Match?}
    M -->|No matches| N[No constraints]
    
    H --> O[InferredContext]
    J --> O
    L --> O
    N --> O
    
    O --> P[Display Context Tags]
    O --> Q[Include in Gemini Prompt]
```

## UI Component Hierarchy

```mermaid
graph TD
    A[Focus.tsx] --> B[Voice State Display]
    A --> C[Conversation History Panel]
    A --> D[Controls]
    
    B --> B1[State Indicator]
    B --> B2[Current Transcript]
    B --> B3[Current AI Response]
    B --> B4[Error Alert]
    
    C --> C1[Turn List]
    C --> C2[Inferred Context Tags]
    
    C1 --> C1A[User Message Bubble]
    C1 --> C1B[CORTEX Message Bubble]
    
    C2 --> C2A[Project Type Tag]
    C2 --> C2B[Platform Tag]
    C2 --> C2C[Constraint Tags]
    C2 --> C2D[Feature Tags]
    
    D --> D1[Start Listening Button]
    D --> D2[Interrupt Button]
    D --> D3[Reset Button]
    D --> D4[New Conversation Button]
```

## Data Flow: Voice Loop → Conversation State

```mermaid
flowchart TB
    subgraph Voice Loop Phase 0
        A[User Speaks] --> B[Speech Recognition]
        B --> C[Transcript Ready]
        C --> D[State = Thinking]
        D --> E[Call Gemini API]
        E --> F[AI Response Ready]
        F --> G[State = Speaking]
        G --> H[Speak Response]
        H --> I[State = Idle]
    end
    
    subgraph Conversation Brain Phase 2
        J[Add User Turn]
        K[Infer Context]
        L[Decide Strategy]
        M[Build Prompt]
        N[Add CORTEX Turn]
        O[Extract Questions]
    end
    
    subgraph UI Updates
        P[Conversation History]
        Q[Context Tags]
        R[Turn Count]
    end
    
    C --> J
    J --> K
    D --> L
    L --> M
    M --> E
    F --> N
    N --> O
    
    J --> P
    K --> Q
    N --> P
    N --> R
    
    style A fill:#e1f5ff
    style J fill:#d4edda
    style P fill:#fff3cd
```

## Response Strategy Decision Tree

```mermaid
graph TD
    A[New Turn Received] --> B{Turn Count < 4?}
    B -->|Yes| C[ASK Strategy<br/>Exploratory questions]
    B -->|No| D{Turn Count < 8?}
    
    D -->|Yes| E{Has Context?}
    D -->|No| F{Turn % 4 == 0?}
    
    E -->|No| G[CLARIFY Strategy<br/>Resolve ambiguities]
    E -->|Yes| H[ACKNOWLEDGE Strategy<br/>Accept and pivot]
    
    F -->|Yes| I[SUMMARIZE Strategy<br/>Recap understanding]
    F -->|No| H
    
    C --> J[Gemini Prompt:<br/>"Ask about core aspects"]
    G --> K[Gemini Prompt:<br/>"Clarify unclear details"]
    H --> L[Gemini Prompt:<br/>"Acknowledge and continue"]
    I --> M[Gemini Prompt:<br/>"Summarize understanding"]
    
    style C fill:#ffeb3b
    style G fill:#ff9800
    style H fill:#4caf50
    style I fill:#2196f3
```

---

## Example Flow Visualization

**Scenario: User wants to build a React web app**

```
Turn 1:
User: "I want to build a web app"
  → ConversationBrain.addUserTurn()
  → Infer: projectType = "web app"
  → Strategy: ASK (turn 1)
  → Prompt includes: "Ask about core aspects"
CORTEX: "What problem will this solve?"

Turn 2:
User: "Task management for developers"
  → ConversationBrain.addUserTurn()
  → Infer: features += "task management"
  → Strategy: ASK (turn 2)
CORTEX: "Will this be personal or for teams?"

Turn 3:
User: "Personal tool using React"
  → ConversationBrain.addUserTurn()
  → Infer: platform = "React", teamSize = "solo"
  → Strategy: ASK (turn 3)
CORTEX: "Are you planning to use a backend?"

Turn 4:
User: "No backend, just GitHub Pages"
  → ConversationBrain.addUserTurn()
  → Infer: constraints = ["no backend"]
  → Strategy: SUMMARIZE (turn 4, turn % 4 == 0)
CORTEX: "Got it - a React task manager for personal use, static hosting on GitHub Pages. What features matter most?"

Turn 5:
User: "Simple task lists and deadlines"
  → ConversationBrain.addUserTurn()
  → Infer: features += ["task lists", "deadlines"]
  → Strategy: ACKNOWLEDGE (turn 5)
CORTEX: "Makes sense. Do you need notifications for upcoming deadlines?"
```

**Context After Turn 5:**
```json
{
  "projectType": "web app",
  "platform": "React",
  "constraints": ["no backend"],
  "features": ["task management", "task lists", "deadlines"],
  "teamSize": "solo"
}
```

---

These diagrams visualize the complete Phase 2 architecture and conversation flow!
