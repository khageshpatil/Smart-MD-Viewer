# Phase 2 Quick Start Guide

## What Is Phase 2?

Phase 2 transforms CORTEX from a simple voice loop into a **conversational planning partner** that remembers what you say and asks intelligent follow-up questions.

### Key Difference

**Phase 0 (Voice Spine):**
```
You: "I want to build a web app"
AI: "Sure, how can I help?"
[Conversation ends]
```

**Phase 2 (Conversational Brain):**
```
You: "I want to build a web app"
AI: "What problem will this solve for your users?"
You: "Task management for developers"
AI: "Interesting! Will this be personal or for teams?"
You: "Personal, just for me"
AI: "Got it. Should we add authentication?"
[Conversation continues naturally...]
```

---

## Core Concept

CORTEX now maintains **conversation memory** and **inferred context** across multiple voice turns.

```
┌──────────────────────────────────────┐
│      Conversation Memory             │
│  • User turns                        │
│  • CORTEX turns                      │
│  • Inferred context                  │
│  • Open questions                    │
└──────────────────────────────────────┘
         ↓
┌──────────────────────────────────────┐
│    Context-Aware Responses           │
│  • Remembers previous turns          │
│  • Asks relevant follow-ups          │
│  • Builds understanding gradually    │
└──────────────────────────────────────┘
```

---

## Using Phase 2

### 1. Start a Conversation

1. Open CORTEX at `/focus`
2. Click **"Start Listening"**
3. Speak your initial idea: *"I want to build a mobile app"*
4. CORTEX will ask a follow-up question
5. Continue the conversation naturally

### 2. Watch Context Build

As you speak, CORTEX infers context and displays it as **color-coded tags**:

- 🟣 **Purple**: Project type (web app, mobile app, API)
- 🔵 **Blue**: Platform (React, Node.js, Python)
- 🟠 **Orange**: Constraints (no backend, GitHub Pages)
- 🟢 **Green**: Features (authentication, real-time, search)

### 3. Review Conversation History

The conversation log shows:
- **Left (blue)**: Your messages
- **Right (green)**: CORTEX's responses
- **Turn count**: Track conversation length
- **Scrollable**: Review earlier turns

### 4. Reset When Needed

Click **"New Conversation"** to:
- Clear conversation history
- Reset inferred context
- Start fresh brainstorming
- (Voice loop remains active)

---

## Response Strategies

CORTEX uses different strategies based on conversation progress:

| Strategy | When | Example |
|----------|------|---------|
| **ASK** | Early (turns 1-3) | *"What platform are you using?"* |
| **CLARIFY** | Mid, unclear info | *"Did you mean social login or email?"* |
| **ACKNOWLEDGE** | After new info | *"I see, a React dashboard."* |
| **SUMMARIZE** | Every 4th turn | *"Let me check - React app, no backend, GitHub Pages. What's next?"* |

---

## Example Session

```
Turn 1:
👤 You: "I want to build a web app"
💬 CORTEX: "What problem will this solve for users?"

Turn 2:
👤 You: "Expense tracking for freelancers"
💬 CORTEX: "Nice! Will they need to share data or keep it private?"

Turn 3:
👤 You: "Private, just personal tracking"
💬 CORTEX: "Got it. Are you planning a backend or static hosting?"

Turn 4:
👤 You: "Static, using GitHub Pages"
💬 CORTEX: "Let me check - expense tracker for freelancers, private data, static hosting on GitHub Pages. What features matter most?"

Context Tags: [web app] [GitHub Pages] [no backend] [expense tracking]
```

---

## What's Under the Hood

### ConversationBrain

The brain behind Phase 2:

```typescript
// Add turns
conversationBrain.addUserTurn("I want to build a web app");
conversationBrain.addCortexTurn("What problem does it solve?");

// Get context
const context = conversationBrain.getInferredContext();
// Returns: { projectType: "web app", platform: "React", ... }

// Decide strategy
const strategy = conversationBrain.decideResponseStrategy();
// Returns: 'ask' | 'clarify' | 'acknowledge' | 'summarize'

// Build prompt
const prompt = conversationBrain.buildPromptWithContext(strategy);
// Includes: system instructions + history + context
```

### Integration with Voice Loop

```
Phase 0 (Voice Spine)          Phase 2 (Conversation Brain)
─────────────────────         ───────────────────────────────
1. User speaks                1. Add user turn to brain
2. Transcript captured        2. Infer context from speech
3. Call Gemini API            3. Decide response strategy
4. Get AI response            4. Build context-aware prompt
5. Speak response             5. Add CORTEX turn to brain
6. Return to idle             6. Update UI with history
```

---

## Troubleshooting

### Conversation Not Showing

**Symptom**: No conversation history displayed  
**Solution**: Make sure you've completed at least 1 voice loop (speak → AI responds)

### Context Tags Not Updating

**Symptom**: Inferred context tags not appearing  
**Solution**: Use explicit keywords:
- Project type: "web app", "mobile app", "API service"
- Platform: "React", "Node.js", "Python"
- Constraints: "no backend", "static", "GitHub Pages"
- Features: "authentication", "real-time", "search"

### CORTEX Doesn't Remember Earlier Turns

**Symptom**: Questions unrelated to previous answers  
**Solution**: Check that conversation brain is initialized (should happen automatically). Try resetting conversation and starting fresh.

### Too Many Context Tags

**Symptom**: Context section cluttered with tags  
**Solution**: Click "New Conversation" to reset. ConversationBrain currently doesn't remove inferred context (by design).

---

## Best Practices

### 1. Be Specific

❌ **Vague**: "I need an app"  
✅ **Specific**: "I need a React web app for tracking expenses"

### 2. One Topic at a Time

❌ **Multiple topics**: "I want authentication, real-time updates, and payment integration"  
✅ **Focused**: "I need user authentication first"

### 3. Answer CORTEX's Questions

CORTEX asks follow-ups to build understanding. Answering them helps it learn about your project.

### 4. Use Keywords for Context

To help context inference, use these keywords:
- **Project type**: "web app", "mobile app", "dashboard", "API"
- **Platform**: "React", "Vue", "Node", "Python", "Flask"
- **Constraints**: "no backend", "static", "serverless"
- **Features**: "auth", "payment", "search", "real-time"

### 5. Summarize Periodically

Every 4th turn, CORTEX will summarize its understanding. Correct any misunderstandings:

```
CORTEX: "So you want a React app with real-time updates?"
You: "Actually, not real-time - just regular updates are fine"
```

---

## Testing Tips

### Quick Test (5 minutes)

1. Click "Start Listening"
2. Say: "I want to build a mobile app"
3. Answer follow-up questions naturally
4. Complete 5 turns
5. Check conversation history displays correctly
6. Verify context tags appear

### Full Test (15 minutes)

1. Start conversation about a web app
2. Mention React and authentication
3. Continue for 8 turns
4. Verify CORTEX summarizes at turn 4 and 8
5. Check all context tags displayed
6. Click "New Conversation"
7. Start fresh topic
8. Verify history cleared

---

## API Details

### Conversation State (Zustand Store)

```typescript
const {
  // Phase 2: Conversation state
  conversationTurns,        // Array<{ role, text, timestamp }>
  inferredContext,          // { projectType, platform, constraints, features }
  openQuestions,            // string[]
  conversationMetadata,     // { conversationId, turnCount, hasContext }
  
  // Phase 2: Actions
  getConversationHistory,   // () => ConversationTurn[]
  resetConversation,        // () => void
} = useSpokenLoopStore();
```

### ConversationBrain Methods

```typescript
// Turn management
addUserTurn(text: string): void
addCortexTurn(text: string): void
getTurns(): ConversationTurn[]
getRecentTurns(count?: number): ConversationTurn[]

// Context
getInferredContext(): InferredContext
getOpenQuestions(): string[]

// Strategy
decideResponseStrategy(): 'ask' | 'acknowledge' | 'clarify' | 'summarize'

// Prompts
buildSystemPrompt(strategy): string
buildPromptWithContext(strategy): string

// Reset
reset(): void
exportState(): ConversationState
getMetadata(): { conversationId, turnCount, startedAt, duration, hasContext }
```

---

## What's Next?

### Phase 2 ✅ (Current)
- Multi-turn conversations
- Context inference
- Intelligent follow-ups
- Visual conversation history

### Phase 3 (Coming Next)
- Transform conversation → structured plan
- Generate tickets and tasks
- HLD/LLD creation
- Persistence (IndexedDB)
- Planning dashboard

---

## FAQ

**Q: How many turns can a conversation have?**  
A: Unlimited! But only the last 10 turns are sent to Gemini (to save costs).

**Q: Is conversation history saved?**  
A: Not yet. Phase 2 keeps conversation in memory only. Persistence comes in Phase 3.

**Q: Can I edit conversation history?**  
A: Not in Phase 2. You can reset and start fresh with "New Conversation".

**Q: What happens if I interrupt?**  
A: Interrupt stops the current voice loop but preserves conversation history.

**Q: Can I use text instead of voice?**  
A: Phase 2 is voice-only. Text input may come in a future phase.

**Q: How accurate is context inference?**  
A: Basic keyword matching (80-90% for common terms). More advanced NLP planned for Phase 3+.

---

## Need Help?

- 📖 Full docs: `PHASE_2_COMPLETE.md`
- 📊 Flow diagrams: `PHASE_2_CONVERSATION_FLOW.md`
- 🧪 Testing checklist: See "Testing Checklist" section in `PHASE_2_COMPLETE.md`

---

**You're ready to have natural planning conversations with CORTEX! 🎉**
