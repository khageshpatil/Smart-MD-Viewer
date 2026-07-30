# T29 — Share Dialog UX Redesign (Tabs for Create vs Import)

**Priority:** P2  
**Estimated time:** 3 hours  
**Depends on:** T28 completed  
**Modifies:** `src/components/ShareDialog.tsx`

---

## Problem Being Solved

The `ShareDialog` component currently stacks "Create secure share" and "Import secure share" in a single vertical scrolling list, which looks cluttered.

This task redesigns `ShareDialog.tsx` using Shadcn `<Tabs>` (`Create Share` tab vs `Import Share` tab) for a cleaner, high-end tabbed UI.

---

## Technical Specification

In `src/components/ShareDialog.tsx`:
1. Use `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` from `@/components/ui/tabs`.
2. Tab 1: "Export & Share" (Create link, download `.smdshare`).
3. Tab 2: "Import Share" (Upload `.smdshare`, enter passphrase, decrypt & save).

---

## Run Build

```bash
npm run build
```

---

## Acceptance Criteria

- [ ] `ShareDialog` uses tabbed navigation ("Export & Share" vs "Import Share").
- [ ] Interface is clean, compact, and accessible.
- [ ] `npm run build` succeeds.
