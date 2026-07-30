# T09 — FOUC Guard (Inline Theme Script)

**Priority:** P0  
**Estimated time:** 30 minutes  
**Depends on:** T08 must be complete (we're editing index.html)  
**Modifies:** `index.html` only (add inline script to head)

---

## Problem Being Solved

FOUC = Flash Of Unstyled Content (or Flash of wrong theme).

When SmartMD loads, the page briefly appears in LIGHT mode even if the user previously
selected DARK mode. This is because next-themes reads localStorage AFTER the JS bundle
loads, which takes 1-3 seconds. For that time, the page flashes the wrong theme.

mdview.io solves this with a tiny inline script in the HTML head that reads localStorage
before any CSS is applied. This makes theme application instant — zero flash.

---

## Current index.html state (after T08)

The head section now has meta tags but NO inline theme script.

---

## Change Required

Open `index.html`. 

Find the closing `</head>` tag.

BEFORE that closing tag, add this inline script:

```html
    <!-- FOUC guard: apply persisted theme class before any CSS loads -->
    <!-- This prevents the flash from light→dark on initial load -->
    <script>
      (function() {
        try {
          var theme = localStorage.getItem('theme');
          if (theme === 'dark') {
            document.documentElement.classList.add('dark');
          } else if (theme === 'light') {
            document.documentElement.classList.remove('dark');
          }
          // If no preference saved, leave as-is (default light from CSS)
        } catch(e) {
          // localStorage not available — silently ignore
        }
      })();
    </script>
  </head>
```

### Why this works

SmartMD uses `next-themes` with `attribute="class"` — it applies the theme by adding/removing
the `dark` class on the `<html>` element. The FOUC guard reads `localStorage.getItem('theme')`
(which is where next-themes stores the preference) and applies the class inline before CSS loads.

This means by the time CSS resolves, the correct theme class is already present — no flash.

### Why localStorage key is 'theme'

Check `src/App.tsx` to confirm:
```
<ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
```

next-themes uses the key `theme` by default when `storageKey` prop is not specified.
If you find `storageKey="something-else"` in App.tsx, use that key instead.

---

## Run Build

```
npm run build
```

---

## Update MASTER.md

1. Change T09 status from [ ] to [x]
2. Update "Last completed task" to "T09"

---

## Acceptance Criteria

- [ ] Set dark mode in the app, refresh the page — no light flash before dark loads
- [ ] Set light mode, refresh — loads immediately in light mode
- [ ] First visit (no localStorage) — loads in light mode (the default)
- [ ] Script is inside the `<head>` tag before `</head>`
- [ ] Script uses an IIFE (immediately invoked function expression) to avoid global pollution
- [ ] npm run build passes

---

## DO NOT TOUCH

- Any file in `src/`
- `vite.config.ts`
- `tailwind.config.ts`
- `package.json`
