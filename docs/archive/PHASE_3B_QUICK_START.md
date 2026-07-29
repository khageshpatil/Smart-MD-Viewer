# Phase 3B: Planning Execution - Quick Start Guide

## What is Phase 3B?

Phase 3B transforms your planning draft (created in Phase 3A) into **real artifacts** stored in your browser's database. Unlike Phase 3A which is preview-only, Phase 3B creates persistent projects, phases, tasks, and documents that you can work with.

**Think of it like this**:
- **Phase 3A**: AI brainstorms with you and shows a preview (nothing saved)
- **Phase 3B**: You click "Create This Plan" and CORTEX builds it for real (saved to database)

---

## Quick Start: Creating Your First Project

### Step 1: Have a Conversation
Click **"Start Listening"** and tell CORTEX about your project idea.

**Example conversation**:
```
You: "I want to build a task management app"
CORTEX: "What platform should it run on?"
You: "It should be a web application"
CORTEX: "What features do you need?"
You: "Users should be able to create tasks, mark them complete, and filter by status"
CORTEX: "Got it. Any specific constraints?"
You: "It should be mobile-responsive and use React"
```

**What's happening**: CORTEX is gathering context and building confidence.

---

### Step 2: Watch Planning Readiness
After a few turns, you'll see a **"Ready to plan"** indicator appear.

**Readiness indicator**:
- **Green checkmark** + "Ready to plan (confidence: 85%)" ✅
- This means CORTEX has enough context to create a meaningful plan

**Not ready yet?**
- **Yellow warning** + "Gathering information... (50% complete)"
- CORTEX will tell you what's missing: "Still need: target platform"

---

### Step 3: Generate Planning Draft
Click **"Generate Planning Draft"**

**What happens**:
1. CORTEX uses AI (Gemini) to synthesize your conversation into a structured plan
2. You'll see a loading spinner: "Synthesizing planning draft..."
3. After 3-5 seconds, a preview appears

**Draft preview shows**:
- **Project Summary**: One-sentence description
- **Goals**: What you're trying to achieve
- **Non-Goals**: What's explicitly out of scope
- **Assumptions**: What CORTEX is assuming
- **Risks**: Potential challenges
- **Phases**: Breakdown into stages (e.g., "Setup & Foundation", "Core Development")

---

### Step 4: Review the Draft
**This is your last chance to check before execution!**

**Questions to ask yourself**:
- ✅ Does the summary match my idea?
- ✅ Are the goals correct?
- ✅ Are the non-goals accurate?
- ✅ Do the phases make sense?
- ✅ Is anything missing or wrong?

**If something's wrong**:
- Click **"Regenerate"** to have AI create a new draft
- Or click **"Clear Draft"** and have another conversation with CORTEX

**If it looks good**:
- You're ready for Phase 3B! 🎉

---

### Step 5: Create the Plan (Phase 3B Starts Here!)
Click **"Create This Plan"**

**What happens**:
1. **Execution Console** appears (new section on the page)
2. A **progress bar** animates from 0% to 100%
3. You see the **current step** (e.g., "Creating project Task Management System")
4. An **execution log** shows timestamped entries
5. **Voice narration** tells you milestones: "25% complete", "50% complete", etc.

**Typical execution**:
- **Duration**: 4-6 seconds for a typical plan
- **Steps**: 20-30 steps total
- **Voice updates**: ~4 narrations (start, 25%, 50%, 75%, complete)

---

### Step 6: Watch the Progress
**Execution Console** shows:

**Progress Bar**:
```
Step 12 of 23                    52%
████████████░░░░░░░░░░░░ 52%
```

**Current Step**:
```
🔵 Creating phase 2: Core Development
```

**Execution Log** (scrollable):
```
2:34:15 PM  Creating project Task Management System
2:34:15 PM  Creating phase 1: Setup & Foundation
2:34:16 PM  Adding task: Initial setup and configuration
2:34:16 PM  Creating phase 2: Core Development
2:34:17 PM  Adding task: Core implementation
...
```

**Voice Narration** (you hear):
- "Starting execution. Creating your plan with 23 steps."
- "25% complete."
- "50% complete."
- "75% complete."
- "Planning complete! Created 23 artifacts. Your project is ready."

---

### Step 7: Execution Complete! 🎉
**Completion Summary** appears:
```
✅ Planning Complete!

Project: Task Management System
Created 23 artifacts
```

**What was created**:
- **1 Project** with your summary, goals, non-goals, assumptions, risks
- **5 Phases** (e.g., Setup, Core Development, Testing, Deployment, Documentation)
- **15 Tasks** (3 tasks per phase, generated based on phase intent)
- **2 Documents**:
  - **HLD** (High-Level Design) - architectural overview
  - **LLD** (Low-Level Design) - detailed phase and task breakdown

**Where are these artifacts?**
- Stored in **IndexedDB** (your browser's local database)
- Survive page refreshes and browser restarts
- Only you can see them (no server upload)

---

## Understanding the Execution Console

### Progress Bar
Shows how far through the execution you are.

**Colors**:
- **Blue**: Executing normally ⚙️
- **Green**: Completed successfully ✅
- **Red**: Failed ❌

### Current Step
Shows what CORTEX is doing **right now**.

**Examples**:
- "Creating project React Task Manager"
- "Creating phase 1: Setup & Foundation"
- "Adding task: Core implementation"
- "Creating High-Level Design document"

### Execution Log
Timestamped history of all steps.

**Colors**:
- **Gray**: Info (normal steps)
- **Green**: Success (milestones)
- **Red**: Error (failures)

**Example log**:
```
2:34:15 PM  Creating project Task Management System
2:34:15 PM  Creating phase 1: Setup & Foundation
2:34:16 PM  ✅ 25% complete
2:34:17 PM  Creating phase 3: Testing & Quality
2:34:18 PM  ✅ 50% complete
...
```

---

## Handling Errors

### If Execution Fails
**You'll see**:
```
❌ Execution Failed
Database connection error
```

**What to do**:
1. Read the error message carefully
2. Click **"Clear"** to reset the execution console
3. If needed, click **"Regenerate"** to create a new draft
4. Try **"Create This Plan"** again

**Common errors**:
- "No planning draft to execute" → Generate a draft first
- "Database connection error" → Close other tabs using IndexedDB
- "Invalid draft format" → Regenerate the draft

---

## Aborting Execution

### Mid-Execution Abort
**If you change your mind mid-execution**:
1. Click **"Abort Execution"** (red button)
2. Execution stops immediately
3. You see: "Execution aborted by user"

**What happens to partial artifacts?**
- Any artifacts created **before** abort remain in the database
- Execution stops cleanly, no corruption
- You can clear the console and try again

**When to abort**:
- You noticed an error in the draft mid-execution
- You want to make changes before completing
- Browser is freezing (rare, but possible)

---

## Clearing the Console

### After Completion or Error
Click **"Clear"** to:
- Hide the execution console
- Clear the execution log
- Reset progress to 0%

**Note**: This **does NOT delete** your created artifacts! They remain in IndexedDB.

**Future phases** will let you view, edit, and export artifacts.

---

## Voice Narration

### What You'll Hear
CORTEX narrates execution progress to keep you informed without overwhelming you.

**Narration strategy**: **Milestone-based**
- You DON'T hear every step (would be 20+ narrations)
- You DO hear key milestones (start, 25%, 50%, 75%, complete)

**Example narration sequence**:
1. "Starting execution. Creating your plan with 23 steps."
2. *[CORTEX works silently for 6 steps]*
3. "25% complete."
4. *[CORTEX works silently for 6 steps]*
5. "50% complete."
6. *[CORTEX works silently for 6 steps]*
7. "75% complete."
8. *[CORTEX works silently for remaining steps]*
9. "Planning complete! Created 23 artifacts. Your project is ready."

**Why not every step?**
- **Too many**: 23 narrations would take 30+ seconds
- **Too noisy**: You'd lose track of progress
- **Battery drain**: Constant TTS uses CPU

**Execution log** still shows every step if you want details!

---

## Viewing Your Artifacts

### Browser DevTools
**To see your created artifacts**:
1. Open browser DevTools (F12)
2. Go to **Application** tab
3. Expand **IndexedDB** in left sidebar
4. Expand **cortex-planning**
5. Click each object store: projects, phases, tasks, documents

**You'll see**:
```
projects (1)
  ├─ [UUID] Task Management System
phases (5)
  ├─ [UUID] Setup & Foundation
  ├─ [UUID] Core Development
  ├─ [UUID] Testing & Quality
  ├─ [UUID] Deployment
  └─ [UUID] Documentation
tasks (15)
  ├─ [UUID] Initial setup and configuration
  ├─ [UUID] Core implementation
  └─ ...
documents (2)
  ├─ [UUID] High-Level Design
  └─ [UUID] Low-Level Design
```

**Click any entry** to see full JSON data.

---

## What Gets Created?

### Project
**1 project** with:
- **Name**: Extracted from summary (e.g., "Task Management System")
- **Summary**: Your project description
- **Goals**: What you're achieving
- **Non-Goals**: What's out of scope
- **Assumptions**: What CORTEX assumed
- **Risks**: Potential challenges
- **Status**: 'active' (you can update later)
- **Conversation ID**: Links to the conversation that created it

### Phases
**5-7 phases** (typical), each with:
- **Title**: Phase name (e.g., "Setup & Foundation")
- **Intent**: What this phase achieves
- **Order**: Sequence number (0, 1, 2, ...)
- **Status**: 'pending' (you can update as you work)
- **Project ID**: Links to parent project

**Example phases**:
1. Setup & Foundation
2. Core Development
3. Testing & Quality
4. Deployment
5. Documentation

### Tasks
**1-3 tasks per phase** (15-20 tasks total), each with:
- **Title**: Task name (e.g., "Initial setup and configuration")
- **Description**: What to do (e.g., "Set up project structure and dependencies")
- **Phase ID**: Links to parent phase
- **Project ID**: Links to parent project
- **Order**: Sequence within phase (0, 1, 2)
- **Status**: 'pending'

**How tasks are generated**:
- CORTEX looks for keywords in phase intent
- "setup" → "Initial setup and configuration"
- "implement" → "Core implementation"
- "test" → "Testing and validation"
- "deploy" → "Deployment and release"
- "document" → "Documentation"
- No keyword match → "Complete [phase title]"

**Example tasks for "Core Development" phase**:
1. Core implementation
2. Testing and validation

### Documents
**2 documents**:

**1. High-Level Design (HLD)**:
- Project summary
- Goals and non-goals
- Assumptions and risks
- Phase overview
- 300-500 words

**2. Low-Level Design (LLD)**:
- Detailed phase breakdown
- Task lists per phase
- Technical considerations
- 500-800 words

**Format**: Markdown (`.md`)

**Future**: Export these as actual `.md` files (Phase 3E)

---

## FAQ

### Q: How long does execution take?
**A**: 4-6 seconds for a typical plan (20-30 steps). Longer plans may take 10+ seconds.

### Q: Can I refresh the page during execution?
**A**: **Not recommended**. Execution stops if you refresh, but artifacts created so far remain. You'd need to restart execution, which would attempt to create duplicates (causing errors).

### Q: What if I close the browser?
**A**: Execution stops. Created artifacts remain in IndexedDB and will be there when you reopen.

### Q: Can I edit artifacts after creation?
**A**: Not yet! Phase 3C (Artifact Viewer) will let you view them, and Phase 3D (Artifact Editor) will let you edit.

### Q: Can I export artifacts to files?
**A**: Not yet! Phase 3E (Export) will let you export to JSON, Markdown, or project files.

### Q: Does execution use AI?
**A**: **NO**. Phase 3B is 100% deterministic. AI is only used in Phase 3A for draft synthesis.

### Q: Are artifacts private?
**A**: **YES**. Everything is stored locally in your browser's IndexedDB. Nothing is uploaded to servers.

### Q: How much storage do artifacts use?
**A**: Negligible. A typical project is ~50KB. You can store hundreds of projects.

### Q: Can I delete artifacts?
**A**: Not from the UI yet. You can clear the entire database:
1. Open DevTools → Application → IndexedDB
2. Right-click "cortex-planning" → Delete database
3. Refresh page

**Warning**: This deletes ALL projects!

### Q: What if I get an error?
**A**: Click "Clear" and try again. Check the error message for clues. If it persists, clear the database and restart.

### Q: Can I create multiple projects?
**A**: Absolutely! Each planning draft → execution creates a new project. All projects coexist in IndexedDB.

### Q: How do I know execution is deterministic?
**A**: Same planning draft → same execution plan → same artifacts. Try creating the same draft twice (you'll get identical artifacts with different UUIDs).

---

## Tips & Best Practices

### Conversation Tips
- **Be specific**: "web app" vs. "mobile app" vs. "desktop app"
- **Mention constraints**: "must use React", "no databases", "under 2 weeks"
- **Clarify scope**: "only basic features", "MVP only", "no authentication"

### Draft Review Tips
- **Check goals**: Are they achievable?
- **Check non-goals**: Are you okay with these being out of scope?
- **Check phases**: Do they flow logically?
- **Check assumptions**: Are they valid?

### Execution Tips
- **Don't refresh** during execution (you'll lose progress)
- **Watch the log** for detailed step-by-step progress
- **Listen to voice** for high-level milestones
- **Abort if needed** - you can always try again

### Post-Execution Tips
- **Clear console** to declutter UI
- **Keep conversation open** - you might want to create another project
- **Start new conversation** for a completely different project

---

## Troubleshooting

### "No planning draft to execute"
**Cause**: You clicked "Create This Plan" without generating a draft.

**Fix**:
1. Make sure planning readiness is green ("Ready to plan")
2. Click "Generate Planning Draft"
3. Wait for synthesis to complete
4. Then click "Create This Plan"

---

### "Execution failed: Database connection error"
**Cause**: Another tab or window has IndexedDB locked.

**Fix**:
1. Close all other CORTEX tabs
2. Close any DevTools with IndexedDB open
3. Try again

---

### "Execution failed: Invalid draft format"
**Cause**: Planning draft is corrupted or malformed.

**Fix**:
1. Click "Clear Draft"
2. Click "Generate Planning Draft" again
3. Try execution again

---

### Execution is very slow (10+ seconds)
**Cause**: Large planning draft (50+ steps) or browser is busy.

**Possible fixes**:
- Close other tabs to free up CPU
- Simplify your project (fewer phases)
- Wait patiently - it will complete

---

### Voice narration not working
**Cause**: Browser speech synthesis not available or blocked.

**Check**:
1. Is your browser up to date?
2. Do you have volume on?
3. Did you grant microphone permissions? (required for TTS in some browsers)

**Fallback**: You can still see progress in the execution log (no sound needed).

---

### Artifacts not showing in DevTools
**Cause**: Database not initialized or wrong database name.

**Check**:
1. DevTools → Application → IndexedDB
2. Look for database named **"cortex-planning"** (not "cortex" or "planning")
3. Refresh DevTools if needed

---

## Next Steps

**After creating your first project**:
- Wait for **Phase 3C (Artifact Viewer)** to view artifacts in a beautiful UI
- Wait for **Phase 3D (Artifact Editor)** to edit phases and tasks
- Wait for **Phase 3E (Export)** to export to Markdown or JSON
- Wait for **Phase 4 (Code Generation)** to generate actual code files

**For now**:
- Create more projects through conversation + execution
- Explore artifacts in DevTools
- Experiment with different project ideas

---

## Summary

**Phase 3B: Planning Execution** turns your AI-generated planning draft into real, persistent artifacts stored in your browser. The process is deterministic, narratable, and user-controlled, with real-time progress updates and voice feedback.

**Key takeaways**:
- ✅ "Create This Plan" button triggers execution
- ✅ Progress bar shows 0-100% completion
- ✅ Voice narrates milestones (25%, 50%, 75%)
- ✅ Execution log shows all steps
- ✅ Artifacts saved to IndexedDB (persist across sessions)
- ✅ You can abort mid-execution
- ✅ 100% deterministic (no AI in Phase 3B)

**Ready to create your first project? Start a conversation with CORTEX!** 🚀
