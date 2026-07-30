# T24 — Mermaid Diagram Zoom & Pan in Preview

**Priority:** P2  
**Estimated time:** 6 hours  
**Depends on:** T23 completed  
**Modifies:** `src/components/MermaidDiagram.tsx`

---

## Problem Being Solved

Large Mermaid architecture diagrams, flowcharts, or sequence diagrams get squeezed and unreadable on standard screen widths.
Users need to zoom in and drag/pan around complex Mermaid diagrams.

This task adds an interactive SVG zoom/pan controls wrapper (Zoom In, Zoom Out, Reset, Fullscreen) to rendered Mermaid diagrams.

---

## Technical Specification

In `src/components/MermaidDiagram.tsx`:
1. Add zoom controls bar (`ZoomIn`, `ZoomOut`, `RotateCcw`, `Maximize2`) at top-right of `mermaid-container`.
2. Maintain scale state (`zoomScale`) between 0.5x and 3.0x.
3. Apply `transform: scale(...)` to the SVG container.

---

## Run Build

```bash
npm run build
```

---

## Acceptance Criteria

- [ ] Every rendered Mermaid diagram displays subtle zoom and reset controls.
- [ ] Clicking Zoom In/Out smoothly scales the diagram.
- [ ] `npm run build` succeeds.
