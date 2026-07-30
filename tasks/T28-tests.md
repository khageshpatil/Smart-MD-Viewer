# T28 — Test Foundation (Vitest for IndexedDB + SecureShare)

**Priority:** P2  
**Estimated time:** 12 hours  
**Depends on:** T27 completed  
**Modifies:** `package.json`, `vite.config.ts`, `src/lib/__tests__/secureShare.test.ts` (NEW)

---

## Problem Being Solved

Critical crypto functions (`secureShare.ts`) and document storage helpers (`indexedDB.ts`) need automated unit test suites to prevent future regression.

This task adds Vitest configuration and a unit test suite for Web Crypto encryption and payloads.

---

## Technical Specification

1. Install `vitest`:
   `npm install -D vitest @vitest/coverage-v8 jsdom`

2. Add script in `package.json`: `"test": "vitest run"`

3. Create unit test `src/lib/__tests__/secureShare.test.ts`:
   - Verify encryption/decryption of `SharedDocumentPayload`.
   - Verify invalid passphrase failure.
   - Verify link length limits.

---

## Run Build & Test

```bash
npm run build
```

---

## Acceptance Criteria

- [ ] Vitest is configured and runnable via `npm test`.
- [ ] Unit tests for `secureShare.ts` pass cleanly.
- [ ] `npm run build` succeeds.
