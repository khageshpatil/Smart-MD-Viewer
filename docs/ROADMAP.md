# Smart MD Viewer Roadmap

## Critical

- [x] **MDV-01 — Safe document lifecycle**
  - **Description:** Define folder deletion semantics; validate and atomically import workspace data; handle IndexedDB availability/failures; flush/cancel autosaves safely.
  - **Acceptance:** No document is orphaned or silently lost; malformed imports do not modify storage; visible recovery errors are shown; navigation never writes stale content.
  - **Difficulty:** Medium. **Files:** `indexedDB.ts`, `Index.tsx`, `DocumentSidebar.tsx`.
  - **Risks/dependencies:** Preserve existing DB version/data; requires fixtures and migration tests.
  - **Tests:** CRUD, delete-folder variants, malformed/partial ZIP, transaction abort, unmount during save, quota/unavailable DB simulation.
  - **Impact:** High trust and reliability; no SEO impact; removes data-loss risk.

- [x] **MDV-02 — Reader-first local Markdown opening**
  - **Description:** Add `.md` picker, drag/drop, and paste entry points that open a rendered reader by default; retain explicit edit and save-to-workspace paths.
  - **Acceptance:** A local file never leaves the browser, renders immediately, shows source filename/title, and can be saved without overwriting existing documents accidentally.
  - **Difficulty:** Medium. **Files:** workspace page/components and document persistence service.
  - **Risks/dependencies:** Large-file limits and encoding errors require user-facing fallback; preserve current workspace navigation.
  - **Tests:** UTF-8 file, empty/large file, drag/drop, paste, cancel, import/save collision, keyboard/touch flows.
  - **Impact:** Highest user/competitive value; improves SEO messaging; must not block first render.

- [x] **MDV-03 — Split and lazy-load heavy features**
  - **Description:** Route/component split tickets, Mermaid sandbox, Mermaid rendering, and Prism code highlighting; establish a compressed initial-JS budget below 250 kB as a first target.
  - **Acceptance:** Reader shell is interactive without ticket/sandbox code; diagrams/highlighting load only when required; CI reports budget regressions.
  - **Difficulty:** Medium. **Files:** `App.tsx`, workspace renderer, Vite config, CI.
  - **Risks/dependencies:** Loading/error boundaries and asynchronous Mermaid initialization need robust states.
  - **Tests:** Build analyzer/budget, route navigation, diagram load failure, code block lazy render.
  - **Impact:** High perceived speed and Core Web Vitals; no feature regression.

## High

- [ ] **MDV-04 — Long-document reader controls**
  - **Description:** Add heading-derived TOC with stable anchors, focus mode, font-size, line-width, reading-progress, and print styles.
  - **Acceptance:** Keyboard-accessible outline follows headings, focus mode hides distractions, settings persist locally, and wide content remains readable on mobile/print.
  - **Difficulty:** Medium. **Files:** new reader components, workspace page, global styles.
  - **Risks/dependencies:** Stable slug collision policy; must not mutate Markdown content.
  - **Tests:** duplicate headings, deep levels, large docs, mobile, print preview, keyboard/reader announcements.
  - **Impact:** Major parity gap; strong usability and SEO/engagement benefit; low runtime overhead.

- [ ] **MDV-05 — Rendering security and resiliency**
  - **Description:** Establish a Markdown/HTML/Mermaid trust boundary, strict Mermaid configuration, diagram error isolation, and safer export serialization.
  - **Acceptance:** Invalid/malicious diagram input cannot alter surrounding UI; one rendering failure leaves reader usable; export content is safely escaped or generated from a typed renderer.
  - **Difficulty:** Medium. **Files:** `MermaidDiagram.tsx`, renderer/export modules, `secureShare.ts` tests.
  - **Risks/dependencies:** Mermaid configuration compatibility with existing diagrams.
  - **Tests:** malformed/hostile Markdown, invalid diagrams, external links, sharing envelope limits, export snapshots.
  - **Impact:** High security confidence; low visual impact; preserves performance.

- [ ] **MDV-06 — Modern Markdown extensions**
  - **Description:** Add opt-in frontmatter display, KaTeX math, responsive table wrappers, and callout conventions using a minimal renderer extension set.
  - **Acceptance:** Extensions render predictably, degrade to source when unsupported, and do not load math code unless documents use math.
  - **Difficulty:** Medium. **Files:** Markdown renderer and CSS.
  - **Risks/dependencies:** Bundle weight and math CSS; sanitize all extension output.
  - **Tests:** inline/block equations, malformed math, frontmatter variants, wide/mobile tables, no-JS-style fallback.
  - **Impact:** Closes major competitor gaps and aids technical users; lazy loading protects performance.

- [ ] **MDV-07 — Accessible document navigation**
  - **Description:** Replace clickable sidebar rows/badges with semantic buttons/tree patterns, complete labels for icon controls, and add documented global shortcuts.
  - **Acceptance:** Full workspace navigation works with keyboard/screen reader; focus is visible/restored; touch users can reach every context action.
  - **Difficulty:** Medium. **Files:** `DocumentSidebar.tsx`, toolbar/dialog components.
  - **Risks/dependencies:** Radix menu/dialog behavior and nested tree focus model.
  - **Tests:** keyboard-only flows, Axe checks, screen-reader smoke tests, touch viewport checks.
  - **Impact:** High inclusivity; negligible performance cost.

## Medium

- [ ] **MDV-08 — PWA and offline readiness**
  - **Description:** Add manifest, app icons, service-worker app shell, update prompt, and storage availability/recovery UX.
  - **Acceptance:** Installed app opens offline after first visit; updates are explicit; user data remains separate from cache lifecycle.
  - **Difficulty:** Medium. **Files:** Vite/PWA config, `public/`, app shell.
  - **Risks/dependencies:** Service-worker cache invalidation and GitHub Pages base path.
  - **Tests:** offline reload, update activation, installability audit, storage quota paths.
  - **Impact:** Strong offline claim; moderate launch value; small cached asset cost.

- [ ] **MDV-09 — Test foundation and CI gates**
  - **Description:** Add unit tests for storage/sharing and browser tests for reader flows; report coverage and bundle budgets in CI.
  - **Acceptance:** Critical document/share workflows have regression coverage and CI blocks lint errors, test failures, production build failures, and budget breaches.
  - **Difficulty:** Medium. **Files:** test configuration, CI workflow, targeted source tests.
  - **Risks/dependencies:** Browser testing needs deterministic IndexedDB/file fixtures.
  - **Tests:** The test suite itself plus CI matrix on supported browsers.
  - **Impact:** Enables safe iteration; no direct UX/SEO cost.

- [ ] **MDV-10 — Metadata and public documentation**
  - **Description:** Correct project identity/metadata, canonical/OG assets, sitemap strategy, and privacy/local-first documentation.
  - **Acceptance:** Social previews are complete, deployment URLs are configurable, and claims match actual offline/security behavior.
  - **Difficulty:** Low. **Files:** `index.html`, `public/`, deployment docs.
  - **Risks/dependencies:** Requires final public hostname and image asset decisions.
  - **Tests:** HTML/meta validation and deployed preview checks.
  - **Impact:** Medium discovery and credibility; no runtime cost.

## Nice to Have

- [ ] **MDV-11 — Document-scale performance instrumentation**: profile parse/render time and add adaptive deferred preview/virtualization only when benchmarks show a need.
- [ ] **MDV-12 — Workspace portability**: preserve nested folder paths, sanitize filenames, export ticket data separately, and offer explicit merge/replace import choices.
- [ ] **MDV-13 — Ticket subsystem isolation**: retain behavior while lazy-loading its route and documenting PAT security; do not add new ticket features.
- [ ] **MDV-14 — Dependency and CSS cleanup**: remove verified-unused starter CSS, duplicate toast/query tooling, and unused UI/dependencies only after test coverage and bundle comparison.

## Release Gates

- [ ] All Critical and High items complete with no IndexedDB migration/data-loss regression.
- [ ] Initial reader shell meets bundle budget and passes Lighthouse performance/accessibility on desktop and mobile.
- [ ] Chromium, Firefox, and Safari smoke suite passes; feature fallbacks are documented.
- [ ] Offline app-shell, encrypted-share, local-file, malformed-import, and print workflows pass automated coverage.
- [ ] Ticket/GitHub route remains reachable and regression-tested, without affecting initial reader load.
