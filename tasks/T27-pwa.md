# T27 — PWA Manifest & Offline Support

**Priority:** P2  
**Estimated time:** 8 hours  
**Depends on:** T26 completed  
**Modifies:** `public/manifest.json`, `index.html`

---

## Problem Being Solved

Users want to install SmartMD as a desktop or mobile PWA application that opens instantly offline without an internet connection.

This task adds a web application manifest (`public/manifest.json`) and service worker configuration.

---

## Technical Specification

Create `public/manifest.json`:
```json
{
  "name": "Smart MD Viewer",
  "short_name": "SmartMD",
  "description": "Private, local-first Markdown viewer",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#1a2234",
  "theme_color": "#3b82f6",
  "icons": [
    {
      "src": "/favicon.svg",
      "sizes": "any",
      "type": "image/svg+xml"
    }
  ]
}
```

Link in `index.html`: `<link rel="manifest" href="/manifest.json" />`.

---

## Run Build

```bash
npm run build
```

---

## Acceptance Criteria

- [ ] PWA manifest is valid and linked in `index.html`.
- [ ] App is installable as a native desktop/mobile standalone app.
- [ ] `npm run build` succeeds.
