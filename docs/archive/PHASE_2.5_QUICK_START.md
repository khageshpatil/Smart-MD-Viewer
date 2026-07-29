# Phase 2.5 Quick Start Guide

## What Is Phase 2.5?

Phase 2.5 adds a **planning readiness gate** - CORTEX now evaluates when it has enough context to offer planning services, and **asks for your consent** before proceeding.

### Key Difference from Phase 2

**Phase 2 (Conversation Only):**
```
You: "I want a web app"
CORTEX: "What features?" 
You: "Authentication"
CORTEX: "What platform?"
[Conversation continues forever...]
```

**Phase 2.5 (Conversation + Readiness Gate):**
```
You: "I want a web app"
CORTEX: "What features?"
You: "Authentication and dashboard"
CORTEX: "What platform?"
You: "React, static hosting"
CORTEX: "Got it - React web app with auth and dashboard, static hosting. 
         Want me to break this into phases and tasks?" ← OFFERS PLANNING
```

---

## Core Concept

CORTEX evaluates **4 readiness criteria** and calculates a **confidence score**:

```
┌─────────────────────────────────┐
│   Readiness Criteria             │
├─────────────────────────────────┤
│ ✓ Project Type      = 0.25      │
│ ✓ Platform/Deploy   = 0.25      │
│ ✓ Features (2+)     = 0.25      │
│ ✓ Constraints       = 0.25      │
├─────────────────────────────────┤
│ Total Score         = 1.00      │
│ Threshold           = 0.75      │
│ Status: ✅ READY                │
└─────────────────────────────────┘
```

**Rule:** Need at least **75% confidence** before offering planning.

---

## Using Phase 2.5

### 1. Start Conversation

Same as Phase 2:
1. Open `/focus`
2. Click "Start Listening"
3. Describe your project idea
4. Answer CORTEX's questions

### 2. Watch Readiness Indicator

New UI element shows progress:

**Not Ready (< 75%):**
```
⚠️ Gathering information... (50% complete)
   Still need: What technology platform will you use?
```

**Ready (>= 75%):**
```
✅ Ready to plan (confidence: 100%)
```

### 3. Respond to Planning Offer

When ready, CORTEX will ask:
```
"I think I understand enough about [summary]. 
 Want me to break this into phases and tasks?"
```

Your options:
- **"Yes"** → Proceed to Phase 3 (planning)
- **"No, tell me more..."** → Continue conversation
- **"Not yet, I also need..."** → Add requirements

---

## Readiness Criteria Explained

### 1. Project Type (0.25 points)

**What it is:** The fundamental type of project.

**Keywords:**
- "web app" or "website"
- "mobile app" or "iOS" or "Android"
- "API service" or "backend"
- "dashboard" or "admin panel"

**Example:**
```
You: "I want to build a web app"
✅ Project Type = "web app" → +0.25 points
```

---

### 2. Platform or Deployment (0.25 points)

**What it is:** The technology stack OR deployment constraints.

**Keywords:**
- **Platform:** "React", "Vue", "Node.js", "Python", "Flask"
- **Deployment:** "no backend", "static", "GitHub Pages", "serverless"

**Example:**
```
You: "Using React"
✅ Platform = "React" → +0.25 points

OR

You: "Static hosting on GitHub Pages"
✅ Deployment = "no backend" → +0.25 points
```

---

### 3. Features (0.25 points)

**What it is:** Core functionality the project needs.

**Requirements:**
- At least **2 features** mentioned, OR
- At least **1 feature** + 4+ conversation turns

**Keywords:**
- "authentication", "auth", "login"
- "real-time", "payment", "search"
- "notification", "chat", "upload"

**Example:**
```
You: "I need authentication and a dashboard"
✅ Features = ["authentication", "dashboard"] → +0.25 points

OR

You: "Just authentication for now" (turn 5)
✅ Features = ["authentication"] + 5 turns → +0.25 points
```

---

### 4. Constraint Clarity (0.25 points)

**What it is:** Technical limitations or requirements.

**Granted if:**
- Explicit constraints mentioned ("no backend", "mobile-first")
- OR Platform + Features both defined (implicit constraints)

**Example:**
```
You: "No backend, just static files"
✅ Constraints = ["no backend"] → +0.25 points

OR

Context: React + auth + dashboard (implicit constraints)
✅ Constraint Clarity → +0.25 points
```

---

## Example Scenarios

### Scenario 1: Fast Path to Readiness (4 turns)

```
Turn 1:
You: "I want to build a mobile app"
Score: 25% (project type)
CORTEX: "What platform - iOS, Android, or both?"

Turn 2:
You: "iOS only"
Score: 50% (project type + platform)
CORTEX: "What core features will it have?"

Turn 3:
You: "GPS tracking and heart rate monitoring"
Score: 75% (project type + platform + features)
CORTEX: "Any constraints like offline mode or Apple Health integration?"

Turn 4:
You: "Yes, Apple Health integration"
Score: 100% (all criteria met)
CORTEX: "Got it - iOS fitness app with GPS, heart rate, and Apple Health. Want me to plan this?"
```

**Readiness:** ✅ After 4 turns, all criteria met.

---

### Scenario 2: Missing Critical Info

```
Turn 1:
You: "I need authentication"
Score: 0%
CORTEX: "Authentication for what kind of project?"

Turn 2:
You: "A web thing"
Score: 25% (project type)
CORTEX: "What features will this have besides authentication?"

Turn 3:
You: "User profiles"
Score: 50% (project type + features)
CORTEX: "What technology platform are you using?"

Turn 4:
You: "React"
Score: 75% (project type + platform + features)
CORTEX: "React web app with auth and profiles. Want me to break this into tasks?"
```

**Readiness:** ✅ After 4 turns, minimum criteria met (implicit constraints).

---

### Scenario 3: Needs More Info

```
Turn 1:
You: "I want something with React"
Score: 25% (platform)
CORTEX: "What kind of project are you building with React?"

Turn 2:
You: "A dashboard"
Score: 50% (project type + platform)
CORTEX: "What will this dashboard do? What features does it need?"

Turn 3:
You: "Display analytics"
Score: 50% (still need 1 more feature)
CORTEX: "What other features besides analytics? Like user management, filtering, exports?"

Turn 4:
You: "User management and filtering"
Score: 75% (project type + platform + features)
CORTEX: "React analytics dashboard with user management and filtering. Ready to plan?"
```

**Readiness:** ✅ After 4 turns, reached threshold.

---

## Confidence Score Reference

| Score | Status | What It Means | CORTEX Behavior |
|-------|--------|---------------|-----------------|
| 0-24% | 🔴 Very Low | Missing 3-4 criteria | Asks exploratory questions |
| 25-49% | 🟡 Low | Missing 2-3 criteria | Asks focused questions |
| 50-74% | 🟠 Medium | Missing 1-2 criteria | Asks targeted questions about gaps |
| 75-99% | 🟢 Ready | Missing 0-1 criteria | Offers planning with summary |
| 100% | ✅ Complete | All criteria met | Confidently offers planning |

---

## Tips for Faster Readiness

### ✅ Do This:

1. **Mention project type early:**
   - "I want a **web app**..."
   - "Building a **mobile app**..."
   - "Need an **API service**..."

2. **Be specific about tech:**
   - "Using **React**"
   - "**Node.js** backend"
   - "**Static** hosting only"

3. **List multiple features:**
   - "Need **authentication**, **dashboard**, and **notifications**"
   - Better than: "Need auth" (then wait)

4. **Mention constraints upfront:**
   - "**No backend**, just client-side"
   - "Must work **offline**"
   - "**GitHub Pages** only"

### ❌ Avoid This:

1. **Vague descriptions:**
   - ❌ "I want something"
   - ✅ "I want a web app"

2. **One feature at a time:**
   - ❌ "I need auth" → wait → "Also notifications" → wait
   - ✅ "I need auth and notifications"

3. **No platform mentioned:**
   - ❌ "A web app with auth"
   - ✅ "A React web app with auth"

---

## Troubleshooting

### Stuck at 50% Confidence

**Symptom:** Score won't increase past 50%  
**Cause:** Missing features criteria  
**Solution:** Mention at least 2 features:
```
You: "I also need user profiles and search"
✅ Score increases to 75%
```

---

### CORTEX Keeps Asking Questions

**Symptom:** No planning offer after many turns  
**Cause:** Confidence < 75%  
**Solution:** Check readiness indicator - it shows what's missing:
```
⚠️ Still need: What technology platform will you use?
```
Answer that specific question.

---

### Planning Not Offered

**Symptom:** Score at 75%+ but no planning offer  
**Cause:** Need at least 4 conversation turns  
**Solution:** Continue conversation for 1-2 more turns, CORTEX will then offer planning.

---

### Want to Skip Planning

**Symptom:** CORTEX offers planning but you're not ready  
**Response Options:**
- "No, tell me more about [topic]"
- "Not yet, I also need [feature]"
- "Let me think about it"

CORTEX will continue conversation without forcing planning.

---

## API Reference

### Planning Readiness State (Zustand Store)

```typescript
const { planningReadiness } = useSpokenLoopStore();

planningReadiness: {
  ready: boolean;           // True if confidence >= 75%
  confidenceScore: number;  // 0.0 - 1.0
  missingInfo: string[];    // Array of missing criteria
  readySummary?: string;    // Summary when ready
}
```

### Example Usage

```typescript
// Check if ready
if (planningReadiness?.ready) {
  console.log('Ready to plan!');
  console.log('Summary:', planningReadiness.readySummary);
}

// Show progress
console.log(`${Math.round(planningReadiness.confidenceScore * 100)}% complete`);

// Show what's missing
if (planningReadiness.missingInfo.length > 0) {
  console.log('Need:', planningReadiness.missingInfo[0]);
}
```

---

## What Phase 2.5 Does NOT Do

❌ Generate planning artifacts  
❌ Create tasks or tickets  
❌ Build HLD/LLD documents  
❌ Persist data to IndexedDB  
❌ Force planning execution  

**Phase 2.5 only:**
✅ Evaluates readiness  
✅ Offers planning (with consent)  
✅ Shows progress  
✅ Asks targeted questions  

---

## What's Next?

### After Planning Consent

When you confirm "yes" to CORTEX's planning offer:

**Phase 3 (Coming Soon):**
- Transform conversation → structured plan
- Generate tickets, tasks, milestones
- Create HLD/LLD documentation
- Persist to IndexedDB
- Display planning dashboard

**For now:** Phase 2.5 ends at the offer. Phase 3 execution is next!

---

## FAQ

**Q: How many turns before CORTEX offers planning?**  
A: Minimum 4 turns required, but only if confidence >= 75%.

**Q: Can I force planning earlier?**  
A: No, CORTEX needs 75% confidence to ensure quality planning.

**Q: What if I say "no" to planning offer?**  
A: CORTEX continues conversation. You can ask for planning later by saying "I'm ready to plan now".

**Q: Does readiness persist across sessions?**  
A: No. Phase 2.5 is in-memory only. Persistence comes in Phase 3.

**Q: Can I see the missing criteria?**  
A: Yes! The readiness indicator shows:
```
Still need: [first missing criterion]
```

**Q: What if context changes mid-conversation?**  
A: Readiness re-evaluates after each turn. Score can go up or down.

---

## Testing Checklist

Quick test (5 minutes):

1. [ ] Start conversation: "I want a web app"
2. [ ] Readiness indicator shows 25%
3. [ ] Say: "Using React with auth and dashboard"
4. [ ] Readiness increases to 75%+
5. [ ] Continue conversation
6. [ ] After turn 4+, CORTEX offers planning
7. [ ] Response: "Yes" (Phase 3 not implemented yet)

---

## Need Help?

- 📖 Full docs: `PHASE_2.5_COMPLETE.md`
- 🧪 Testing guide: See "Testing Checklist" section above
- 🎯 Readiness rules: See "Readiness Criteria Explained" section

---

**You're ready to use CORTEX's planning readiness gate! 🎯**
