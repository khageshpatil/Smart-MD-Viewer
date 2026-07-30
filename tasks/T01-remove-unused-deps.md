# T01 — Remove Unused Dependencies + Dead shadcn Primitives

**Priority:** P0  
**Estimated time:** 2 hours  
**Depends on:** Nothing (do this first)  
**Must complete before:** T02 (bundle split)

---

## Context (read this before touching anything)

SmartMD has 69 npm dependencies but uses only ~20 of them in the viewer.
Unused deps add 200-400 kB gzip to the bundle.
The shadcn/ui folder has 49 component files but only ~12 are used by the viewer.

This task removes the confirmed-unused packages and component files.

---

## Step 1 — Remove unused npm packages from package.json

Open package.json. Remove ONLY these packages from the dependencies section:

**Remove these (confirmed unused in viewer — verified by grep):**
- echarts — charts library, not used in viewer (only Tickets page has no charts)
- date-fns — date utilities, not used anywhere except calendar
- eact-day-picker — calendar component, not used
- embla-carousel-react — carousel, not used
- aul — drawer component, not used  
- cmdk — command palette, not used
- input-otp — OTP input, not used
- @hookform/resolvers — form resolvers, not used
- eact-hook-form — forms, not used

**IMPORTANT — Do NOT remove these (they ARE used):**
- zod — keep, used in useGitHub.ts for response validation
- dnd-kit — keep, may be used in ticket drag-drop (check before removing)
- All @radix-ui/* packages — used by shadcn components
- eact-markdown, emark-gfm — core rendering
- mermaid — core diagram rendering
- eact-syntax-highlighter — code highlighting
- lucide-react — icons
- 
ext-themes — theme system
- eact-router-dom — routing
- eact-resizable-panels — used in MermaidSandbox
- jszip — workspace export
- sonner — toast notifications
- @tanstack/react-query — used in App.tsx (keep even if minimally used)

**Command to run after editing package.json:**
`
npm install
`

---

## Step 2 — Remove unused shadcn UI component files

Delete ONLY these files from src/components/ui/:

`
src/components/ui/calendar.tsx       — uses react-day-picker (being removed)
src/components/ui/carousel.tsx       — uses embla-carousel (being removed)
src/components/ui/chart.tsx          — uses recharts (being removed)
src/components/ui/input-otp.tsx      — uses input-otp (being removed)
src/components/ui/drawer.tsx         — uses vaul (being removed)
`

**Do NOT delete these (they ARE imported somewhere):**
- accordion, alert, alert-dialog, aspect-ratio, avatar, badge, breadcrumb
- button, card, checkbox, collapsible, command, context-menu, dialog
- dropdown-menu, form, hover-card, input, label, menubar, navigation-menu
- pagination, popover, progress, radio-group, resizable, scroll-area
- select, separator, sheet, sidebar, skeleton, slider, sonner, switch
- table, tabs, textarea, toast, toaster, toggle, toggle-group, tooltip
- use-toast.ts

**How to delete (PowerShell):**
`powershell
Remove-Item "src\components\ui\calendar.tsx"
Remove-Item "src\components\ui\carousel.tsx"
Remove-Item "src\components\ui\chart.tsx"
Remove-Item "src\components\ui\input-otp.tsx"
Remove-Item "src\components\ui\drawer.tsx"
`

---

## Step 3 — Delete the unused starter CSS file

`powershell
Remove-Item "src\App.css"
`

Then open src/App.tsx and remove the import if it exists:
`	sx
// DELETE this line if it exists:
import "./App.css";
`

---

## Step 4 — Verify no broken imports

Run the build:
`
npm run build
`

If you get import errors, it means a file you deleted IS imported somewhere.
DO NOT delete that file — add it back and remove it from the deletion list.

Common false positives:
- drawer.tsx might be imported in sheet.tsx — check and keep if so
- chart.tsx might be re-exported somewhere

Fix any import errors by restoring the file and removing it from the deletion list above.

---

## Step 5 — Update MASTER.md

After successful build:
1. Change T01 status from [ ] to [x]
2. Update "Bundle size" in Current State Snapshot with new numbers from build output
3. Update "Last completed task" to "T01"

---

## Acceptance Criteria

- [ ] 
pm run build completes without errors
- [ ] No TypeScript errors (
pm run lint passes)
- [ ] The 5 deleted component files no longer exist
- [ ] src/App.css no longer exists
- [ ] Bundle size is smaller than 1,918 kB (verify in build output)
- [ ] The viewer still renders Markdown correctly (open dev server and test)
- [ ] The Tickets page still loads (navigate to /tickets)

---

## DO NOT TOUCH

- src/lib/secureShare.ts — do not touch for any reason
- src/lib/indexedDB.ts — do not touch (T07 task)
- src/pages/Index.tsx — do not touch (T03, T04, T06 tasks)
- src/index.css — do not touch (T05, T10 tasks)
- index.html — do not touch (T08, T09 tasks)
- ite.config.ts — do not touch (T02 task)
- 	ailwind.config.ts — do not touch
