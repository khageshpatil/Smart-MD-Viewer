# PHASE 3A QUICK START: Using Planning Synthesis

**Last Updated**: 2026-02-06

---

## What is Phase 3A?

Phase 3A adds **Planning Synthesis** - the ability to generate structured planning drafts from your conversation with CORTEX.

**Key Point**: This is a **PREVIEW** - nothing is created automatically. You get to review the draft before deciding to proceed.

---

## How to Use Planning Synthesis

### Step 1: Have a Conversation (Phase 2)

Talk to CORTEX about your project idea by clicking "Start Listening".

```
Example conversation:
You: "I want to build something"
CORTEX: "What kind of project are you thinking about?"
You: "A web app"
CORTEX: "What problem will this solve?"
You: "Task management"
CORTEX: "What technology platform?"
You: "React, no backend, GitHub Pages"
```

### Step 2: Wait for Readiness (Phase 2.5)

CORTEX will evaluate if it has enough context to plan. You'll see a readiness indicator:

**Not Ready (< 75%):**
```
⚠️ Gathering information... (50% complete)
   Still need: What technology platform will you use?
```

**Ready (>= 75%):**
```
✅ Ready to plan (confidence: 100%)
```

### Step 3: Generate Planning Draft (Phase 3A)

Once ready, you'll see a "Generate Planning Draft" button. Click it to synthesize a draft.

```
┌─────────────────────────────────────────────────────┐
│ 📄 Planning Draft         [Preview — nothing...]  │
├─────────────────────────────────────────────────────┤
│ CORTEX has gathered enough context to create a     │
│ planning draft. This is a preview - nothing will   │
│ be created automatically.                          │
│                                                     │
│ [📄 Generate Planning Draft]                       │
└─────────────────────────────────────────────────────┘
```

### Step 4: Review the Draft

CORTEX will synthesize a structured plan and display it:

```
┌─────────────────────────────────────────────────────┐
│ 📄 Planning Draft         [Preview — nothing...]  │
├─────────────────────────────────────────────────────┤
│ PROJECT SUMMARY                                     │
│ React task manager with auth for GitHub Pages      │
│                                                     │
│ GOALS                                              │
│ • User authentication with session persistence     │
│ • Create, edit, and delete tasks                   │
│ • Responsive design for mobile and desktop         │
│                                                     │
│ NON-GOALS (OUT OF SCOPE)                           │
│ • Backend server (static site only)                │
│ • Real-time collaboration features                 │
│                                                     │
│ ASSUMPTIONS                                        │
│ • Users have modern browsers with localStorage     │
│ • GitHub Pages deployment is acceptable            │
│                                                     │
│ RISKS                                              │
│ • Local storage limitations (5-10MB per domain)    │
│ • No server-side validation or security            │
│                                                     │
│ PHASES                                             │
│ ┃ Phase 1: Setup & Foundation                      │
│ ┃ Initialize React, configure GitHub Pages         │
│ ┃                                                   │
│ ┃ Phase 2: Authentication                          │
│ ┃ Implement login with JWT tokens                  │
│ ┃                                                   │
│ ┃ Phase 3: Task Management                         │
│ ┃ CRUD operations for tasks with local storage     │
│                                                     │
│ ────────────────────────────────────────────────── │
│ [Clear Draft]  [Regenerate]                        │
└─────────────────────────────────────────────────────┘
```

### Step 5: Review and Adjust

The draft is a **preview** - nothing has been created yet. You can:

- **Clear Draft**: Remove the draft and start over
- **Regenerate**: Ask CORTEX to synthesize a new draft
- **Adjust**: Continue the conversation to refine context, then regenerate

---

## Understanding the Planning Draft

### Project Summary
A 1-2 sentence overview of your project.

```
Example:
"A React-based task management application with authentication, 
deployable as a static site on GitHub Pages."
```

### Goals
What success looks like for this project.

```
Example:
• User authentication with session persistence
• Create, edit, and delete tasks with local storage
• Responsive design for mobile and desktop
```

### Non-Goals (Out of Scope)
What's explicitly NOT included in this project.

```
Example:
• Backend server or API integration
• Real-time collaboration features
• Mobile app (native iOS/Android)
```

### Assumptions
What CORTEX is assuming is true for this project.

```
Example:
• Users have modern browsers with localStorage support
• GitHub Pages deployment is acceptable for hosting
• Client-side authentication (e.g., Auth0) is sufficient
```

### Risks
Potential blockers or challenges to be aware of.

```
Example:
• Local storage limitations (5-10MB per domain)
• No server-side validation or security
• Authentication token management complexity
```

### Phases
Logical breakdown of work into sequential phases.

```
Example:
┃ Phase 1: Setup & Foundation
┃ Initialize React project with Vite, configure TypeScript,
┃ set up routing, and deploy to GitHub Pages.
┃
┃ Phase 2: Authentication
┃ Implement user login/logout with JWT tokens, session
┃ persistence, and protected routes.
```

---

## Tips for Better Drafts

### 1. Provide Clear Context
The more specific you are, the better the draft:

```
❌ Vague:
"I want an app"

✅ Specific:
"I want a React web app for task management with authentication,
deployed on GitHub Pages without a backend"
```

### 2. Mention Constraints
Explicitly state limitations:

```
✅ Good:
"No backend - I want a static site"
"I'm deploying to GitHub Pages"
"I need offline support"
"Budget is limited - prefer free services"
```

### 3. Clarify Features
List 2-3 core features:

```
✅ Good:
"I need authentication, task CRUD, and search"
"GPS tracking, heart rate monitoring, and workout history"
"Product catalog, shopping cart, and checkout"
```

### 4. Set Timeline (Optional)
If you have a deadline:

```
✅ Good:
"I need an MVP in 2 weeks"
"This is a long-term project, no rush"
"I have 3 months to launch"
```

---

## Common Scenarios

### Scenario 1: Draft Looks Good
```
User: [Reviews draft]
User: "This looks great, let's proceed"

→ Phase 3B (future): Execute the plan
```

### Scenario 2: Draft Needs Adjustments
```
User: [Reviews draft]
User: "I also need dark mode and i18n support"

CORTEX: "Got it, adding dark mode and internationalization.
Want me to regenerate the draft?"

User: "Yes"
→ Click "Regenerate" button
```

### Scenario 3: Draft is Off-Track
```
User: [Reviews draft]
User: "This isn't what I meant - I need a mobile app, not web"

CORTEX: "Sorry for the confusion. Let me clarify..."
→ Continue conversation, then regenerate
```

### Scenario 4: Not Ready Yet
```
User: [Clicks "Generate Planning Draft" too early]

CORTEX: "I need more information before planning.
What technology platform are you planning to use?"

→ Continue conversation to reach 75% readiness
```

---

## Troubleshooting

### Problem: "Generate Planning Draft" button doesn't appear

**Cause**: Planning readiness < 75%

**Solution**: Continue the conversation to provide more context. Check the readiness indicator to see what's missing.

```
Example:
⚠️ Gathering information... (50% complete)
   Still need: What technology platform will you use?
```

---

### Problem: "Rate limit exceeded" error

**Cause**: You've exceeded the API rate limits (10/min, 100/hr, 500/day)

**Solution**: Wait a few minutes before trying again. Check the error message for the exact wait time.

---

### Problem: Draft doesn't match expectations

**Cause**: Conversation context was unclear or incomplete

**Solution**: 
1. Continue the conversation to clarify
2. Be more specific about requirements
3. Click "Regenerate" to synthesize a new draft

---

### Problem: "Failed to parse planning draft" error

**Cause**: Gemini API returned invalid JSON (rare)

**Solution**: Click "Regenerate" to try again. If it persists, clear draft and start a new conversation.

---

### Problem: Planning draft section disappeared

**Cause**: Conversation was reset or draft was cleared

**Solution**: Normal behavior. Generate a new draft when ready.

---

## FAQ

### Q: Is the planning draft saved anywhere?
**A**: No, Phase 3A drafts are in-memory only. They're cleared when you reset the conversation. Phase 3B (future) will add persistence.

---

### Q: Can I edit the draft directly?
**A**: Not in Phase 3A. You can regenerate or continue the conversation to refine context. Direct editing will come in Phase 3B.

---

### Q: What happens if I click "Clear Draft"?
**A**: The planning draft is removed from view, and you return to idle state. You can generate a new draft anytime.

---

### Q: How long does synthesis take?
**A**: Typically 2-5 seconds. You'll see a "Synthesizing planning draft..." spinner during this time.

---

### Q: Can CORTEX create the plan automatically?
**A**: No. Phase 3A is **preview-only**. CORTEX will never create artifacts without your explicit approval (Phase 3B will handle execution).

---

### Q: What if I don't like the phases?
**A**: Continue the conversation to adjust context, then click "Regenerate". The new draft will reflect the updated context.

Example:
```
User: "I want fewer phases - combine setup and auth"
CORTEX: "Got it, I'll consolidate those phases. Want me to regenerate?"
User: "Yes"
→ Click "Regenerate"
```

---

### Q: Can I have multiple drafts at once?
**A**: No, Phase 3A supports one draft at a time. Clear the current draft to generate a new one, or regenerate to replace it.

---

### Q: What's the difference between Phase 3A and Phase 3B?
**A**: 
- **Phase 3A** (current): Generates planning drafts (preview-only)
- **Phase 3B** (future): Executes plans (creates tickets, tasks, documentation)

---

## What's Next?

### Phase 3B: Planning Execution (Coming Soon)

Phase 3B will add:
- **Execution**: Transform drafts → actual artifacts
- **Tickets**: Generate Jira/GitHub issues from phases
- **Tasks**: Break down phases into actionable tasks
- **Documentation**: Create HLD/LLD from draft
- **Persistence**: Save plans to IndexedDB
- **Dashboard**: View and manage planning artifacts

**Current Phase 3A**: Preview-only, no execution  
**Future Phase 3B**: Full planning execution with user consent

---

## Voice Behavior

### When Draft is Ready
```
CORTEX: "I think I understand enough about your React task manager.
I can generate a planning draft for you to review. Want me to create it?"

User: "Yes, show me the draft"
→ Draft synthesized and displayed
```

### When Reviewing Draft
```
CORTEX: "Here's a preview of your plan. It includes 6 phases covering
setup, authentication, task management, and deployment. Want to adjust
anything, or should I keep it as-is?"

User: "Looks good, but add testing"
CORTEX: "Got it, I'll add a testing phase. Want me to regenerate?"
```

### When Draft Needs Changes
```
User: "This draft is missing error handling"
CORTEX: "Good catch. Let me note that - you need robust error handling
throughout the app. Should I include that in the phases?"
User: "Yes, and logging too"
→ Click "Regenerate" after updating context
```

---

## Best Practices

### 1. Reach 75%+ Readiness Before Synthesis
Wait for the green checkmark (✅) before generating a draft. This ensures CORTEX has enough context.

### 2. Review Every Section
Don't just skim - check goals, non-goals, assumptions, and risks carefully. These define the project boundaries.

### 3. Use Regenerate Freely
Synthesis is fast and uses minimal API quota. Regenerate as many times as needed to get the right draft.

### 4. Clarify Before Executing (Phase 3B)
Once Phase 3B is available, make sure the draft is perfect before executing. Execution creates real artifacts.

---

## Summary

Phase 3A gives you:
- ✅ **AI-powered planning synthesis** from conversation context
- ✅ **Structured drafts** with goals, phases, risks, assumptions
- ✅ **Preview-only** - nothing created automatically
- ✅ **Regeneration** - iterate until satisfied
- ✅ **Clear boundaries** - Phase 3A = preview, Phase 3B = execution

**Remember**: Phase 3A is THINKING, not DOING. You're in control.

---

*For technical details, see [PHASE_3A_COMPLETE.md](PHASE_3A_COMPLETE.md)*
