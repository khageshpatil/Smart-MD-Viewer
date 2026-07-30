# T23 — Privacy-First Marketing Copy on Landing

**Priority:** P2  
**Estimated time:** 3 hours  
**Depends on:** P1 completed  
**Modifies:** `src/components/LandingHero.tsx`

---

## Problem Being Solved

Users are hesitant to open sensitive, proprietary Markdown documents (API keys, internal architecture notes, financial documents) in web applications because almost all web viewers send documents to a backend server.
`mdview.io` sends files to a remote server.

SmartMD is 100% local-first and client-side only.

This task enhances `LandingHero.tsx` with clear, high-trust privacy badges and guarantees ("100% Private", "No Server Uploads", "Client-Side Encryption").

---

## Technical Specification

Add a privacy feature grid below the hero CTA in `src/components/LandingHero.tsx`:
- "🔒 Zero Server Uploads: Files are parsed and rendered 100% in your browser."
- "⚡ Instant Performance: Local IndexedDB workspace storage for sub-millisecond document switching."
- "🔑 Web Crypto Encryption: AES-GCM encrypted link and file sharing."

---

## Run Build

```bash
npm run build
```

---

## Acceptance Criteria

- [ ] Privacy guarantee cards render clearly on the landing page hero.
- [ ] `npm run build` succeeds.
