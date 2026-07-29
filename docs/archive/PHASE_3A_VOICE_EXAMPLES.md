# Phase 3A: Voice Flow Examples

**Last Updated**: 2026-02-06

This document shows example voice interactions demonstrating Phase 3A (Planning Synthesis).

---

## Example 1: React Task Manager (Simple)

### Full Conversation Flow

```
┌─────────────────────────────────────────────────────────────┐
│ Turn 1                                                      │
├─────────────────────────────────────────────────────────────┤
│ User: "I want to build a task manager"                     │
│ CORTEX: "What kind of task manager - web, mobile, or CLI?" │
│                                                             │
│ Readiness: 0% (no context yet)                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Turn 2                                                      │
├─────────────────────────────────────────────────────────────┤
│ User: "A web app"                                           │
│ CORTEX: "What technology are you planning to use?"         │
│                                                             │
│ Readiness: 25% (has project type)                          │
│ ⚠️ Still need: platform or deployment                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Turn 3                                                      │
├─────────────────────────────────────────────────────────────┤
│ User: "React with no backend"                              │
│ CORTEX: "What are the core features you need?"             │
│                                                             │
│ Readiness: 50% (has project type + platform)               │
│ ⚠️ Still need: 2+ features                                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Turn 4                                                      │
├─────────────────────────────────────────────────────────────┤
│ User: "Authentication and task CRUD"                        │
│ CORTEX: "Where will you deploy this?"                      │
│                                                             │
│ Readiness: 75% (has project type + platform + 2 features)  │
│ ✅ Ready to plan!                                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Turn 5                                                      │
├─────────────────────────────────────────────────────────────┤
│ User: "GitHub Pages"                                        │
│ CORTEX: "Got it - a React task manager with auth and task  │
│         management, deployed on GitHub Pages. I have enough │
│         context to create a planning draft. Want me to      │
│         generate it?"                                       │
│                                                             │
│ Readiness: 100% (all criteria met)                         │
│ ✅ Ready to plan!                                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ UI State: Planning Draft Section Appears                   │
├─────────────────────────────────────────────────────────────┤
│ 📄 Planning Draft         [Preview — nothing created yet]  │
│                                                             │
│ CORTEX has gathered enough context to create a planning    │
│ draft. This is a preview - nothing will be created         │
│ automatically.                                              │
│                                                             │
│ [📄 Generate Planning Draft]                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ User Action: Clicks "Generate Planning Draft"              │
├─────────────────────────────────────────────────────────────┤
│ 🔄 Synthesizing planning draft...                          │
│ (2-5 seconds)                                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Result: Draft Generated                                    │
├─────────────────────────────────────────────────────────────┤
│ 📄 Planning Draft         [Preview — nothing created yet]  │
│                                                             │
│ PROJECT SUMMARY                                             │
│ A React-based task management application with             │
│ authentication, deployable as a static site on GitHub      │
│ Pages.                                                      │
│                                                             │
│ GOALS                                                       │
│ • User authentication with session persistence             │
│ • Create, edit, and delete tasks with local storage        │
│ • Responsive design for mobile and desktop                 │
│ • Deploy to GitHub Pages with CI/CD                        │
│                                                             │
│ NON-GOALS (OUT OF SCOPE)                                   │
│ • Backend server or API integration                        │
│ • Real-time collaboration features                         │
│ • Mobile app (native iOS/Android)                          │
│                                                             │
│ ASSUMPTIONS                                                │
│ • Users have modern browsers with localStorage             │
│ • GitHub Pages deployment is acceptable                    │
│ • Client-side authentication is sufficient                 │
│                                                             │
│ RISKS                                                      │
│ • Local storage limitations (5-10MB per domain)            │
│ • No server-side validation or security                    │
│ • Authentication token management complexity               │
│                                                             │
│ PHASES                                                     │
│ ┃ Phase 1: Setup & Foundation                              │
│ ┃ Initialize React with Vite, configure TypeScript,        │
│ ┃ set up routing, and deploy to GitHub Pages.              │
│ ┃                                                           │
│ ┃ Phase 2: Authentication                                  │
│ ┃ Implement user login/logout with JWT tokens, session     │
│ ┃ persistence, and protected routes.                       │
│ ┃                                                           │
│ ┃ Phase 3: Task Management                                 │
│ ┃ Build CRUD operations for tasks using local storage,     │
│ ┃ with search and filter capabilities.                     │
│ ┃                                                           │
│ ┃ Phase 4: UI/UX Polish                                    │
│ ┃ Add responsive design, dark mode, and accessibility      │
│ ┃ features for better user experience.                     │
│ ┃                                                           │
│ ┃ Phase 5: Testing & Quality                               │
│ ┃ Write unit tests with Vitest, add E2E tests with         │
│ ┃ Playwright, and fix bugs.                                │
│ ┃                                                           │
│ ┃ Phase 6: Deployment & Documentation                      │
│ ┃ Set up CI/CD with GitHub Actions, write user docs,       │
│ ┃ and monitor production.                                  │
│                                                             │
│ ──────────────────────────────────────────────────────────  │
│ [Clear Draft]  [Regenerate]                                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ User Reviews Draft                                          │
├─────────────────────────────────────────────────────────────┤
│ User: "This looks good! Can we add a testing phase?"       │
│ CORTEX: "I see Phase 5 already includes testing. Did you   │
│         want something more specific?"                      │
│ User: "Oh I see it now. Looks perfect!"                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Next Steps (Phase 3B - Future)                             │
├─────────────────────────────────────────────────────────────┤
│ User: "Let's create this plan"                             │
│ CORTEX: "I'll create planning artifacts from this draft.   │
│         This will generate tickets, tasks, and docs.        │
│         Confirm?"                                           │
│ User: "Yes"                                                 │
│ → Phase 3B executes the plan                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Example 2: iOS Fitness Tracker (Detailed)

### Full Conversation Flow

```
┌─────────────────────────────────────────────────────────────┐
│ Turn 1                                                      │
├─────────────────────────────────────────────────────────────┤
│ User: "I need something to track my workouts"              │
│ CORTEX: "What kind of app - mobile, web, or wearable?"     │
│                                                             │
│ Readiness: 0%                                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Turn 2                                                      │
├─────────────────────────────────────────────────────────────┤
│ User: "Mobile app for iPhone"                              │
│ CORTEX: "What kind of workouts will you track?"            │
│                                                             │
│ Readiness: 25% (has project type)                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Turn 3                                                      │
├─────────────────────────────────────────────────────────────┤
│ User: "Running and cycling with GPS"                       │
│ CORTEX: "Any other features you need?"                     │
│                                                             │
│ Readiness: 50% (has project type + platform)               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Turn 4                                                      │
├─────────────────────────────────────────────────────────────┤
│ User: "Heart rate monitoring and workout history"          │
│ CORTEX: "Should this integrate with Apple Health?"         │
│                                                             │
│ Readiness: 75% (has project type + platform + 3 features)  │
│ ✅ Ready to plan!                                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Turn 5                                                      │
├─────────────────────────────────────────────────────────────┤
│ User: "Yes, definitely Apple Health"                       │
│ CORTEX: "Perfect. I have a clear picture - an iOS fitness  │
│         tracker with GPS, heart rate, and Apple Health     │
│         integration. Want me to generate a planning draft?" │
│                                                             │
│ Readiness: 100%                                            │
│ ✅ Ready to plan!                                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ User Action: Clicks "Generate Planning Draft"              │
├─────────────────────────────────────────────────────────────┤
│ 🔄 Synthesizing planning draft...                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Result: Draft Generated                                    │
├─────────────────────────────────────────────────────────────┤
│ 📄 Planning Draft         [Preview — nothing created yet]  │
│                                                             │
│ PROJECT SUMMARY                                             │
│ An iOS fitness tracking app with GPS and heart rate        │
│ monitoring, integrated with Apple Health for seamless      │
│ data sync.                                                  │
│                                                             │
│ GOALS                                                       │
│ • Track workouts with GPS and heart rate data              │
│ • Store workout history with Apple Health integration      │
│ • Display real-time stats during workouts                  │
│ • Provide post-workout analytics and insights              │
│                                                             │
│ NON-GOALS (OUT OF SCOPE)                                   │
│ • Social features or sharing workouts                      │
│ • Android version (iOS only for MVP)                       │
│ • Wearable device integration beyond Apple Health          │
│ • Nutrition tracking or meal logging                       │
│                                                             │
│ ASSUMPTIONS                                                │
│ • Users grant location and health permissions              │
│ • Apple Health is available on user devices                │
│ • Users have iPhone 11 or newer (iOS 15+)                  │
│ • Background location tracking is acceptable               │
│                                                             │
│ RISKS                                                      │
│ • Battery drain from GPS and heart rate monitoring         │
│ • User privacy concerns with location data                 │
│ • Apple Health API changes or limitations                  │
│ • App Store review delays or rejections                    │
│                                                             │
│ PHASES                                                     │
│ ┃ Phase 1: Project Setup                                   │
│ ┃ Create Xcode project, configure SwiftUI, set up Apple   │
│ ┃ Health permissions, and test GPS access.                 │
│ ┃                                                           │
│ ┃ Phase 2: Core Tracking                                   │
│ ┃ Implement GPS tracking, heart rate monitoring via        │
│ ┃ HealthKit, and real-time data display.                   │
│ ┃                                                           │
│ ┃ Phase 3: Data Storage                                    │
│ ┃ Save workouts to Apple Health, implement local caching,  │
│ ┃ and handle sync conflicts.                               │
│ ┃                                                           │
│ ┃ Phase 4: UI/UX                                           │
│ ┃ Design workout screens, build post-workout analytics     │
│ ┃ views, and add dark mode support.                        │
│ ┃                                                           │
│ ┃ Phase 5: Testing & Optimization                          │
│ ┃ Test on real devices, optimize battery usage, and fix    │
│ ┃ GPS accuracy issues.                                     │
│ ┃                                                           │
│ ┃ Phase 6: App Store Submission                            │
│ ┃ Prepare screenshots, write app description, submit       │
│ ┃ to App Store, and respond to review feedback.            │
│                                                             │
│ ──────────────────────────────────────────────────────────  │
│ [Clear Draft]  [Regenerate]                                │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ User Wants to Adjust                                        │
├─────────────────────────────────────────────────────────────┤
│ User: "Can we add Apple Watch support?"                    │
│ CORTEX: "Absolutely - I'll update the plan to include      │
│         Apple Watch features. Should I regenerate?"         │
│ User: "Yes please"                                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ User Action: Clicks "Regenerate"                           │
├─────────────────────────────────────────────────────────────┤
│ 🔄 Synthesizing planning draft...                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Result: Updated Draft                                      │
├─────────────────────────────────────────────────────────────┤
│ [New draft with Apple Watch support added to features,     │
│  non-goals updated, and phases adjusted]                   │
│                                                             │
│ User: "Perfect! This is what I needed."                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Example 3: Error Handling (Rate Limit)

```
┌─────────────────────────────────────────────────────────────┐
│ User Action: Clicks "Generate Planning Draft"              │
├─────────────────────────────────────────────────────────────┤
│ 🔄 Synthesizing planning draft...                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Result: Rate Limit Error                                   │
├─────────────────────────────────────────────────────────────┤
│ 📄 Planning Draft         [Preview — nothing created yet]  │
│                                                             │
│ ⚠️ Synthesis Error                                         │
│ Rate limit exceeded. You've made 10 requests in the last   │
│ minute. Please wait 45 seconds before trying again.        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ User Waits and Retries                                      │
├─────────────────────────────────────────────────────────────┤
│ [User waits 45 seconds]                                     │
│ User: "Try again"                                           │
│ [Clicks "Regenerate"]                                       │
│ → Draft synthesizes successfully                            │
└─────────────────────────────────────────────────────────────┘
```

---

## Example 4: Not Ready Yet (Premature Synthesis)

```
┌─────────────────────────────────────────────────────────────┐
│ Early in Conversation                                       │
├─────────────────────────────────────────────────────────────┤
│ User: "I want to build a web app"                          │
│ CORTEX: "What features do you need?"                        │
│                                                             │
│ Readiness: 25%                                             │
│ ⚠️ Not ready to plan yet                                   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ User Tries to Synthesize Too Early                         │
├─────────────────────────────────────────────────────────────┤
│ [Planning Draft section is not visible because             │
│  readiness < 75%]                                           │
│                                                             │
│ User must continue conversation to reach 75% readiness     │
│ before "Generate Planning Draft" button appears.           │
└─────────────────────────────────────────────────────────────┘
```

---

## Example 5: Draft Regeneration

```
┌─────────────────────────────────────────────────────────────┐
│ User Reviews Initial Draft                                 │
├─────────────────────────────────────────────────────────────┤
│ User: "I like it, but the phases are too detailed.         │
│       Can you make them more high-level?"                  │
│ CORTEX: "Sure, I'll simplify the phases to be more         │
│         strategic. Want me to regenerate?"                  │
│ User: "Yes"                                                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ User Action: Clicks "Regenerate"                           │
├─────────────────────────────────────────────────────────────┤
│ 🔄 Synthesizing planning draft...                          │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Result: Simplified Draft                                   │
├─────────────────────────────────────────────────────────────┤
│ PHASES (Simplified)                                        │
│ ┃ Phase 1: Foundation                                      │
│ ┃ Set up project, configure tools, establish architecture  │
│ ┃                                                           │
│ ┃ Phase 2: Core Features                                   │
│ ┃ Build authentication and task management                 │
│ ┃                                                           │
│ ┃ Phase 3: Polish & Launch                                 │
│ ┃ Testing, UI refinement, deployment, and docs             │
│                                                             │
│ User: "Much better! This is what I was looking for."       │
└─────────────────────────────────────────────────────────────┘
```

---

## Summary of Voice Behavior

### Phase 2.5 → Phase 3A Transition
```
When readiness reaches 75%:
CORTEX: "I have enough context to create a planning draft. 
         This will be a preview - nothing created automatically. 
         Want to see it?"

User: "Yes" → Draft section appears with button
User: "Not yet" → Continue conversation
```

### During Draft Review
```
CORTEX: "Here's a preview of your plan. Review the goals, 
         phases, and risks. Want to adjust anything?"

User options:
• "Looks good" → Ready for Phase 3B (future)
• "Add feature X" → Update context, regenerate
• "Simplify phases" → Update approach, regenerate
• "Start over" → Clear draft, new conversation
```

### Error Recovery
```
If synthesis fails:
CORTEX: "I couldn't generate the draft - [error reason]. 
         Want to try again?"

User: "Yes" → Retry synthesis
User: "No, let's keep talking" → Continue conversation
```

---

*For more details, see [PHASE_3A_COMPLETE.md](PHASE_3A_COMPLETE.md) and [PHASE_3A_QUICK_START.md](PHASE_3A_QUICK_START.md)*
