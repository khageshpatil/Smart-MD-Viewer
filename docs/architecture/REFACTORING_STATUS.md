# Refactoring Status & Next Steps

**Date:** December 2024  
**Status:** Core refactoring complete, minor improvements needed

---

## ✅ Completed

### Files Removed
- ✅ `src/lib/conversationalAI.ts` - Chat/conversation module deleted
- ✅ `src/lib/speech.ts` - TTS module deleted  
- ✅ `src/components/AIConversationDialog.tsx` - Conversation UI deleted

### Files Updated
- ✅ `src/lib/intentParser.ts` - V1 check added, only GENERATE_PROJECT_PLAN available
- ✅ `src/lib/aiActions.ts` - Removed persona, planning-engine prompt
- ✅ `src/pages/Focus.tsx` - Removed conversation state, implemented command pipeline
### Fixed Issues

- ✅ `src/lib/gemini.ts` - Model name fixed to `gemini-1.5-flash-latest`, API URL changed to v1
- ✅ `src/lib/ai/geminiSimpleClient.ts` - Model name updated to `gemini-1.5-flash-latest`, API URL changed to v1

---

## 🔍 Current State Analysis

### What's Working
1. **Voice Pipeline:** Push-to-talk → transcript → intent → AI → preview → confirm → execute
2. **No Chat:** All conversation UI and logic removed
3. **Command-Driven:** Only GENERATE_PROJECT_PLAN implemented, others show "not available"
4. **Preview Modal:** ProjectPlanPreviewModal shows structured data, user confirms before execution

### What Needs Attention

#### 1. Execution Feedback (During Execution)
**Current:** Only shows feedback after all tasks are created  
**Spec Requirement:** Show high-level feedback during execution (e.g., "Creating 12 tasks", "Linking tasks to project")

**Location:** `src/pages/Focus.tsx` → `handleConfirmPlan`

**Fix Needed:**
```typescript
// Add progress feedback during execution
toast({
  title: "Creating tasks...",
  description: `Creating ${generatedPlan.tasks.length} tasks`,
});
// Then show completion after
```

#### 2. AI Prompt Strictness
**Current:** Prompt says "Return ONLY valid JSON, no markdown, no explanations"  
**Could Be Stronger:** Add explicit instruction to not include any prose, questions, or conversational text

**Location:** `src/lib/aiActions.ts` → `generateProjectPlan`

#### 3. Model Name
**Previous:** `gemini-2.5-flash-lite` (invalid)  
**Fixed To:** `gemini-1.5-flash-latest`  
**Status:** ✅ FIXED - Updated in both `src/lib/gemini.ts` and `src/lib/ai/geminiSimpleClient.ts`  
**Additional Fix:** Changed API endpoint from `v1beta` to `v1` for stable API access

**Locations:**
- `src/lib/gemini.ts` line 10
- `src/lib/ai/geminiSimpleClient.ts` line 15

#### 4. Voice UI States
**Current:** VoiceButton shows `idle` and `listening` states  
**Missing:** Explicit `preview` and `executing` states in UI

**Spec Requirement:** Four states must be visible:
- `idle` - Default mic icon
- `listening` - Recording indicator (✅ implemented)
- `preview` - When preview modal is open (⚠️ not explicitly tracked)
- `executing` - During task creation (⚠️ not explicitly tracked)

**Location:** `src/components/VoiceButton.tsx` and `src/pages/Focus.tsx`

---

## 📋 Recommended Next Steps

### Priority 1: Execution Feedback
Add progress feedback during task creation:
- Show "Creating tasks..." toast when execution starts
- Update with progress if possible
- Show completion message

### Priority 2: Voice State Tracking
Make the four states explicit:
- Track `preview` state (when preview modal is open)
- Track `executing` state (during task creation)
- Update VoiceButton to reflect current state (or disable during preview/executing)

### Priority 3: Prompt Hardening
Strengthen AI prompt to be more explicit:
- Add: "Do not include any explanations, questions, or conversational text"
- Add: "Output must be parseable JSON only"
- Consider adding retry logic if JSON parse fails

### Priority 4: Model Name Fix
Fix Gemini model name:
- Change `gemini-2.5-flash-lite` → `gemini-1.5-flash`
- Or document why current model is used if intentional

---

## 🎯 Quick Wins

1. **Add execution feedback** - 5 minutes
   - Wrap task creation loop with progress toast

2. **Strengthen prompt** - 2 minutes
   - Add explicit "no prose" instruction

3. **Track preview/executing states** - 10 minutes
   - Add state variables, update VoiceButton accordingly

---

## ✅ Verification Checklist

- [x] No chat UI components
- [x] No conversation history
- [x] No TTS/text-to-speech
- [x] Only GENERATE_PROJECT_PLAN implemented
- [x] Preview before execution
- [x] User confirmation required
- [ ] Execution feedback during execution (needs improvement)
- [ ] Four explicit UI states (needs tracking)
- [ ] Strict JSON-only prompt (could be stronger)
- [ ] Valid Gemini model name (needs fix)

---

## 🚀 Ready for Testing

The core refactoring is complete. The system now:
- ✅ Listens to commands (no chat)
- ✅ Parses intent
- ✅ Calls AI for structured JSON
- ✅ Shows preview
- ✅ Requires user confirmation
- ✅ Executes locally

**Remaining work is polish and UX improvements, not architectural changes.**

