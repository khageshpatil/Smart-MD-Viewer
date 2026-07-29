# CORTEX — Corrected AI Architecture

**Version:** 2.0  
**Type:** Complete Redesign  
**Date:** December 2024

---

## Core Problems with Current Implementation

1. **No Collaboration** - AI doesn't ask questions or clarify before generating tasks
2. **No Foundation** - Jumps straight to tasks without understanding project properly
3. **No Handling of Missing Info** - Creates tasks even when project has no description
4. **Too Restrictive** - Only accepts specific commands, no flexibility
5. **Wrong Flow** - Should be: **Project Clarity → HLD → LLD → Tasks**

---

## New Architecture: Collaborative Planning Flow

### Phase 1: Project Clarity & Analysis
**When:** Project has no description OR user wants to refine/clarify project  
**AI Behavior:** 
- Asks clarifying questions about project goals, scope, constraints
- Brainstorms with user to understand the project better
- Generates a comprehensive project description/vision

**Output:** Enhanced project description (saved to project)

### Phase 2: High-Level Design (HLD)
**When:** Project has clear description  
**AI Behavior:**
- Analyzes project description
- Proposes architecture, components, modules
- Discusses trade-offs and decisions
- Creates HLD document

**Output:** HLD document (saved as document in project)

### Phase 3: Low-Level Design (LLD)
**When:** HLD exists  
**AI Behavior:**
- Breaks down HLD into detailed technical specifications
- Defines APIs, data structures, algorithms
- Creates LLD document

**Output:** LLD document (saved as document in project)

### Phase 4: Task Breakdown
**When:** LLD exists (or HLD if no LLD)  
**AI Behavior:**
- Creates actionable tasks from design documents
- Organizes into phases
- Links tasks to relevant documents

**Output:** Structured task plan (phases + tasks)

---

## AI Interaction Model

### Two Modes:

1. **Collaborative Mode** (for Clarity, HLD, LLD)
   - AI asks questions
   - User responds
   - Multi-turn conversation
   - AI synthesizes and proposes
   - User confirms/refines
   - Final output saved

2. **Structured Mode** (for Task Generation)
   - AI analyzes existing documents
   - Generates structured JSON (phases + tasks)
   - User previews and confirms
   - Tasks created

---

## New AI Actions

| Action | Mode | When | Output |
|--------|------|------|--------|
| **CLARIFY_PROJECT** | Collaborative | No description or user wants to refine | Enhanced project description |
| **GENERATE_HLD** | Collaborative | Project has description | HLD document |
| **GENERATE_LLD** | Collaborative | HLD exists | LLD document |
| **GENERATE_TASKS** | Structured | Design docs exist | Task plan (JSON) |
| **BRAINSTORM** | Collaborative | User wants to discuss anything | Conversation output |

---

## Voice Commands (Flexible)

- "Let's clarify this project"
- "Help me understand this project better"
- "Create a high-level design"
- "Generate the architecture"
- "Create low-level design"
- "Break down into tasks"
- "Generate a plan"
- "Let's brainstorm about..."
- Natural language variations

---

## UI Flow

### Collaborative Mode UI:
```
User: "Let's clarify this project"
  → AI Dialog opens
  → AI: "What is the main goal of this project?"
  → User types response
  → AI: "What are the key features?"
  → User responds
  → ... (multi-turn)
  → AI: "Based on our discussion, here's the project description: [preview]"
  → User confirms → Saved to project
```

### Structured Mode UI:
```
User: "Generate tasks"
  → AI analyzes project + HLD + LLD
  → Preview modal shows task breakdown
  → User confirms → Tasks created
```

---

## Implementation Plan

1. **Add Collaborative AI Dialog Component**
   - Multi-turn conversation
   - Shows AI questions and user responses
   - Final synthesis preview
   - Save confirmation

2. **Add Project Analysis Functions**
   - `clarifyProject()` - Collaborative clarification
   - `generateHLD()` - High-level design
   - `generateLLD()` - Low-level design
   - `generateTasks()` - Task breakdown (enhanced)

3. **Update Intent Parser**
   - Recognize flexible commands
   - Route to appropriate action

4. **Update Voice Pipeline**
   - Support collaborative mode
   - Handle multi-turn conversations

5. **Add Document Types**
   - HLD document type
   - LLD document type
   - Link documents to projects

---

## Key Changes from Old Spec

| Old | New |
|-----|-----|
| No AI conversation | Collaborative brainstorming for clarity |
| Jump straight to tasks | Proper flow: Clarity → HLD → LLD → Tasks |
| Only structured JSON | Both collaborative (conversation) and structured (JSON) |
| Strict commands only | Flexible natural language |
| No handling of missing info | AI asks questions to fill gaps |

---

## Next Steps

1. Create collaborative AI dialog component
2. Implement project clarification flow
3. Implement HLD/LLD generation
4. Enhance task generation to use design docs
5. Update voice commands to be flexible
6. Test full flow: Empty project → Clarify → HLD → LLD → Tasks

