# CORTEX — AI + Voice Layer Specification

**Version:** 1.0  
**Type:** Correction / Redesign  
**Status:** Spec Only — No Production Code  
**Date:** December 2024

---

## 1. Corrected AI + Voice Philosophy

### Core Principle

**CORTEX does not talk.**

CORTEX listens, understands intent, and executes. AI is a **planning and decomposition engine** that outputs executable structure. It is not an assistant, not a chat partner, not a brainstorming co-pilot.

### AI Role (Locked)

| AI **exists to**        | AI **does not exist to**        |
|------------------------|----------------------------------|
| Analyze context        | Chat                             |
| Produce structured plans | Hold conversations            |
| Assist execution       | Ask follow-up questions          |
| Output JSON only       | Maintain dialogue state          |
| Be invoked explicitly  | Run in the background            |

### Voice Role (Locked)

Voice is a **command interface**: push-to-talk, single command per invocation, short-lived listening, no memory between commands. There is no conversation loop. No text-to-speech. No verbal replies.

### Design Tenets

- **System, not assistant** — Deterministic command → intent → action. No personality, no prose.
- **Focus and calm** — Minimal UI. No chat surface. No persistent AI presence.
- **Static hosting** — All logic client-side. Runs on GitHub Pages. No server, no WebSockets, no streaming.
- **Solo-dev trust** — Predictable. Auditable. No magic. User always confirms before execution.

---

## 2. AI Action Model (No Chat)

### Action Types (Enum-Like)

| Action | When Invoked | Required Context | Structured JSON Output | CORTEX Allowed To |
|--------|--------------|------------------|-------------------------|-------------------|
| **GENERATE_PROJECT_PLAN** | User says "create plan", "generate tasks", "break down project" (or equivalent) | `projectId` | `{ phases: [{ name, tasks: [{ title, description, type }] }], summary?: string }` | Show preview modal; create tasks **only** after user confirms |
| **CREATE_TASKS_FROM_DOCUMENT** | User says "extract tasks", "create tasks from doc" | `documentId` | `{ tasks: [{ title, description, type }] }` | Show preview; create tasks **only** after user confirms |
| **SUMMARIZE_DOCUMENT** | User says "summarize", "summary of doc" | `documentId` | `{ summary: string }` | Show summary in a read-only surface (e.g. modal or inline); **no** mutation |
| **BREAK_TASK_INTO_STEPS** | User says "break down task", "subtasks for this task" | `taskId` | `{ steps: [{ title, description }] }` | Show preview; create subtasks **only** after user confirms |
| **SUGGEST_NEXT_EXECUTION_STEPS** | User says "what next", "suggest next", "what should I do" | `projectId` | `{ suggestions: [{ taskId?, title, reason }] }` | Show list; **no** auto-execution. User picks from list or ignores |

### Action Specification (Per-Action)

Each action MUST specify:

1. **When it is invoked** — Mapped from intent (voice or UI) via `parseCommand` / intent classification.
2. **What context is sent** — `projectId`, `documentId`, or `taskId` as required. No conversation history, no prior messages.
3. **What structured JSON it returns** — Zod-validated schema. No prose, no markdown, no explanations.
4. **What CORTEX is allowed to do with it** — Preview only, or preview + execute-after-confirm. **Never** mutate IndexedDB without explicit user confirmation.

### AI Output Constraints

**AI MUST return:**

- Task plans (phases + tasks)
- Document summaries (single string)
- Step breakdowns (ordered list)
- Next-step suggestions (list with optional `taskId` and `reason`)

**AI MUST NOT return:**

- Prose explanations
- Conversational replies
- Questions to the user
- Filler text ("Sure, I'd be happy to...", "Let me think...")
- Markdown-wrapped JSON

Implementation: `callGeminiJSON` (or equivalent) with strict "Return ONLY valid JSON" in the prompt. Reject or retry on parse failure; never fall back to showing raw text as if it were a reply.

---

## 3. Voice Command Pipeline (Step-by-Step)

Voice is **command-only**. No loop. No conversation.

### Pipeline Steps

1. **User presses and holds** (or taps) **Voice button**  
   - UI: `idle` → `listening`

2. **Speech-to-Text**  
   - Browser Web Speech API (`recognizeSpeech`).  
   - Single utterance. `continuous: false`.  
   - On result: raw transcript string.  
   - On error: transition to `idle`, show error toast (or minimal inline). No retry loop.

3. **Intent classification**  
   - `parseCommand(transcript, actionContext)`.  
   - Input: `transcript`, `ActionContext` (mode, projectId, documentId, taskId).  
   - Output: `ParsedCommand` → `{ action: AIAction | null, confidence, error? }`.  
   - If `action === null`: transition to `idle`, show "Command not recognized" (or similar). **Stop.** No AI call.

4. **AI action selection**  
   - Map `AIAction.type` to one of:  
     `GENERATE_PROJECT_PLAN` | `CREATE_TASKS_FROM_DOCUMENT` | `SUMMARIZE_DOCUMENT` | `BREAK_TASK_INTO_STEPS` | `SUGGEST_NEXT_EXECUTION_STEPS`  
   - If type not implemented or not in V1 scope: transition to `idle`, show "Not available". **Stop.**

5. **Structured AI call**  
   - Build prompt from: action type + `SystemContext` (project, doc, task, existing tasks).  
   - Call `callGeminiJSON<T>(prompt, systemContext)` with schema `T`.  
   - No conversation history. No chat.  
   - UI: `listening` → `preview` (or `executing` if no preview; see 6).

6. **Preview**  
   - UI: `preview`.  
   - Show structured output in a **preview-only** surface (e.g. modal with plan / tasks / summary).  
   - Buttons: **Confirm** (→ execute) | **Cancel** (→ idle).  
   - No prose. No AI “message”. Only the structured data, rendered (e.g. list of tasks, summary text).

7. **User confirmation**  
   - User clicks **Confirm** (or equivalent).  
   - UI: `preview` → `executing`.

8. **Local execution**  
   - CORTEX (not AI) mutates IndexedDB: create tasks, update fields, etc.  
   - Execution is **local only**. No server.  
   - UI: `executing` → `idle` when done.  
   - Feedback: high-level only (see §5).

9. **Idle**  
   - UI: `idle`.  
   - No memory of the command. No conversation state. Next voice command starts from step 1.

### What Does Not Happen

- No AI “reply” in natural language.  
- No text-to-speech.  
- No conversation history.  
- No automatic execution without user confirmation.  
- No background or continuous listening.  
- No retry/loop on “command not recognized” — one attempt per voice invocation.

---

## 4. Voice UI States (Strict — Exactly Four)

### State Machine

```
idle ──(user presses Voice)──► listening
listening ──(transcript + intent)──► preview
listening ──(no intent / error)──► idle
preview ──(user confirms)──► executing
preview ──(user cancels)──► idle
executing ──(done / error)──► idle
```

No fifth state. No “chat”, no “conversation”, no “speaking”.

### State Definitions

| State | Purpose | Visible UI | Exit Condition |
|-------|---------|------------|----------------|
| **idle** | Default. Voice available, no ongoing action. | Voice button: mic icon, no animation. Tooltip: “Voice command (push-to-talk)”. | User activates Voice (press/hold or click). |
| **listening** | Capture single voice command. | Voice button: recording indicator (e.g. pulse/red dot). Optional: “Listening…” or mic-on. No transcript shown yet. | (a) Speech recognized → intent classified → **preview** (or **executing** if no preview). (b) Error or no match → **idle**. (c) User cancels (e.g. release) → **idle**. |
| **preview** | Show AI output; user chooses Confirm or Cancel. | Modal (or inline) with **structured** content only: e.g. task list, phases, summary. Buttons: **Confirm**, **Cancel**. No chat bubbles, no prose from AI. | User **Confirm** → **executing**. User **Cancel** → **idle**. |
| **executing** | CORTEX applies confirmed changes locally. | Non-blocking feedback: e.g. “Creating 12 tasks”, “Linking tasks to project” (see §5). Spinner or similar. No raw API/JSON. | All writes done or error → **idle**. |

### Explicitly Disallowed

- Chat surface (messages, input, history).  
- “Speaking” or TTS state.  
- “Waiting for AI reply” as a distinct state — it is part of `listening` → `preview` (or `executing`).  
- Persistence of transcript or AI output across invocations.

---

## 5. Execution Feedback (Acknowledge, Don’t Narrate)

During **executing**:

- **Do:** Show high-level, user-meaningful steps.  
  - Examples: “Analyzing project context”, “Creating 12 tasks”, “Linking tasks to project”, “Done.”  
- **Do not:** Expose implementation.  
  - No: “Calling Gemini API”, “Parsing response”, “Streaming tokens”, “Validating schema”.

Feedback should be:

- Short, present-tense.  
- Shown in toast, or a small status line near the Voice/preview area.  
- Disappear when transitioning to `idle`.

---

## 6. What AI Can and Cannot Change

### AI May

- **Propose** tasks (titles, descriptions, types, phases).  
- **Propose** document summaries (read-only).  
- **Propose** step breakdowns (subtasks).  
- **Propose** next-step suggestions.

All of these are **suggestions**. CORTEX presents them in a preview. The user **confirms** before any write.

### AI May Not

- Mutate IndexedDB directly.  
- Overwrite documents silently.  
- Delete anything.  
- Run any action without explicit user confirmation.  
- Be invoked automatically in the background.

### Rule

**AI suggests. CORTEX executes.**

Execution = CORTEX (app logic) performing IndexedDB (and/or in-memory) writes after user has confirmed in the **preview** step.

---

## 7. V1 AI Feature: One Only

### Chosen: **GENERATE_PROJECT_PLAN** (Project → Phase-Based Task Plan)

**Definition:**  
Given a selected project (name, description) and existing tasks, AI returns a **phase-based task plan**: a list of phases, each with a list of tasks `{ title, description, type }`. CORTEX shows this in a **preview** modal. On **Confirm**, CORTEX creates those tasks in IndexedDB under the project. On **Cancel**, nothing is written.

### Why This First

- **Highest leverage:** Transforms an empty or vague project into an actionable task list in one command.  
- **Clear scope:** One action type, one JSON schema, one preview UX, one execution path.  
- **Fits command model:** Single voice command (“create a plan for this project”) → intent → one AI call → one preview → one confirm.  
- **No conversation:** No back-and-forth; plan is the only “output”.  
- **Static hosting:** One HTTP request to Gemini; response parsed and rendered. No streaming, no server.

### Why Others Are Postponed

| Action | Why Postponed |
|--------|----------------|
| **CREATE_TASKS_FROM_DOCUMENT** | Requires document context and different schema; adds a second preview/execution path. Do after V1 is stable. |
| **SUMMARIZE_DOCUMENT** | Simpler (no write), but lower impact on “planning engine” narrative. Easy to add later. |
| **BREAK_TASK_INTO_STEPS** | Needs subtask or relation model; may require data model discussion. Defer. |
| **SUGGEST_NEXT_EXECUTION_STEPS** | Needs prioritization logic and possibly more context; better after task model is mature. |

### V1 Scope (In)

- **GENERATE_PROJECT_PLAN** only.  
- Voice: push-to-talk → transcript → `parseCommand` → `GENERATE_PROJECT_PLAN` (if matched) → `callGeminiJSON` → preview modal → Confirm/Cancel → CORTEX creates tasks.  
- UI states: `idle` → `listening` → `preview` → `executing` → `idle`.  
- Execution feedback: high-level only.  
- `callGeminiJSON` with strict JSON; Zod for `ProjectPlan` (or equivalent).  
- `gemini.ts`: no `callGemini` for prose; only `callGeminiJSON` for this action. (Or restrict `callGemini` to non-AI use if it remains.)

### V1 Out of Scope (Explicit)

- **Chat UI** — No conversation, no messages, no chat component.  
- **Conversation history** — No `ChatMessage[]`, no `ConversationContext`.  
- **Text-to-speech** — No `speakText`, no `speech.ts` for TTS, no “AI speaks”.  
- **AIConversationDialog** — Remove. Not replaced by another chat.  
- **conversationalAI.ts** — Remove. No `generateConversationalResponse`, no `mightBeCommand`.  
- **CREATE_TASKS_FROM_DOCUMENT, SUMMARIZE_DOCUMENT, BREAK_TASK_INTO_STEPS, SUGGEST_NEXT_EXECUTION_STEPS** — Not implemented in V1. Intent parser may recognize them and return “Not available” or similar.  
- **AI auto-runs** — No automatic plan generation.  
- **Background listening** — Push-to-talk only.  
- **Server-side logic** — All client-side.  
- **Modification of core data models** — Tasks, projects, documents: schema unchanged for V1.

---

## 8. Removed / Rejected Ideas (From Previous Design)

### Removed Components / Modules

| Item | Description | Reason |
|------|-------------|--------|
| **AIConversationDialog** | Modal for multi-turn conversation with AI; message history; TTS. | Chat UI. Violates “CORTEX does not talk” and “no conversation”. |
| **conversationalAI.ts** | `generateConversationalResponse`, `ChatMessage`, `ConversationContext`, `mightBeCommand`. | Entire module is assistant-style. No prose, no history. |
| **speech.ts** (TTS part) | `speakText`, `stopSpeaking`, `isSpeaking`, `waitForVoices`. | CORTEX does not talk. No TTS. |
| **ChatMessage, ConversationContext** | Types for chat. | No chat. |
| **`callGemini` for prose** | Free-form text response from AI. | AI returns structured JSON only for actions. (Keep only if needed for non-command, non-AI use; otherwise restrict to `callGeminiJSON`.) |

### Removed Behaviors

| Behavior | Description | Reason |
|----------|-------------|--------|
| **AI as brainstorming partner** | AI asks questions, discusses, suggests “shall I proceed?”. | No conversation. No follow-up questions. |
| **Brainstorm-before-execute flow** | Multi-turn discussion before any action. | Single command → single AI call → preview → confirm. No loop. |
| **AI persona / personality** | “Friendly”, “collaborative”, “curious” in prompts. | AI is a planning engine. No persona. |
| **Text-to-speech of AI “replies”** | Speaking AI output to user. | CORTEX does not talk. |
| **Voice opening a “conversation”** | Voice command opens a dialog for back-and-forth. | Voice triggers one command → intent → AI → preview. No conversation. |
| **“Execute Action” from AI suggestion** | Button shown when AI says “ready to proceed” etc. | Execution only from explicit user **Confirm** in preview. No AI-driven “suggest execution” as a UX. |
| **Fallback to “conversation” on unrecognized command** | If intent fails, open conversation. | On no match: go to `idle`, show “Command not recognized”. No AI, no chat. |
| **`onCommandDetected` in a chat** | Hybrid: chat + command detection. | No chat. |

### Removed or Narrowed Types / Config

| Item | Change | Reason |
|------|--------|--------|
| **SystemContext** | Keep for passing project/doc/task into AI. | Still needed for context. |
| **SystemContext** in conversational prompts | Remove. | No conversation. |
| **`ParsedCommand.error`** | Keep. | Used when context missing or no match; show in UI, then `idle`. |
| **`mightBeCommand`** | Remove. | No hybrid chat/command. |
| **`generateConversationalResponse`** | Remove. | No prose. |
| **`speechEnabled` / `isSpeaking` in UI** | Remove. | No TTS. |
| **`pendingAction`, `pendingActionType`, `conversationOpen`, `conversationMessage`** | Remove. | No conversation dialog. Replace with: `previewOpen`, `previewPayload`, `executingAction` (or equivalent) for the single preview→confirm→execute flow. |

### Rejected Patterns (Do Not Reintroduce)

- Chat panels, message lists, or any “conversation” surface.  
- Storing or displaying AI prose as an “assistant message”.  
- Text-to-speech for AI.  
- Background or continuous voice listening.  
- Auto-running AI (e.g. on load, on project switch).  
- Server-side or streaming AI.  
- Any execution without an explicit user Confirm in the preview step.

---

## 9. Final Self-Check

| Question | Answer |
|----------|--------|
| Is this still a **system**, not an **assistant**? | Yes. Command → intent → structured output → preview → user confirm → local execution. No persona, no chat. |
| Does this preserve **focus and calm**? | Yes. Four UI states, no chat, no TTS, minimal feedback. |
| Could this run **entirely on GitHub Pages**? | Yes. Client-side only: Web Speech API, fetch to Gemini, IndexedDB. No server, no WebSockets. |
| Would a **solo dev trust this**? | Yes. Predictable pipeline, explicit confirm, no silent writes, no magic. |

---

## 10. Summary

- **AI:** Planning engine. Structured JSON only. No chat, no prose, no questions.  
- **Voice:** Push-to-talk command interface. Single command → intent → (optional) AI → preview → confirm → execute. No conversation, no TTS.  
- **UI:** Four states — `idle` | `listening` | `preview` | `executing`. No fifth state, no chat.  
- **V1:** `GENERATE_PROJECT_PLAN` only. Preview modal → Confirm/Cancel → CORTEX creates tasks.  
- **Removed:** AIConversationDialog, conversationalAI, TTS (speech.ts for speak), chat types, brainstorm flow, AI persona, and all “conversation” or “assistant” behavior.

---

**Next step:** Implement per this spec (remove conversational/assistant pieces, add strict pipeline and preview-only UX for `GENERATE_PROJECT_PLAN`).

