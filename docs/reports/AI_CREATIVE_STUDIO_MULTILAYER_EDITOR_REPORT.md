# AI Creative Studio Multi-layer Editor Report — 24 November 2026

## Result

`PARTIAL_PASS` — a persisted, SVG-based multi-layer editor is implemented and production-build verified. Authenticated browser E2E and real AI operation execution remain blocked by the lack of an isolated admin session.

## Root cause: nearly black poster preview

The former Creative Studio preview was not a renderer for `AdminDesignProject`:

- It imposed a `bg-neutral-900` container.
- It displayed a background image only when the value was a non-hex URL, ignoring normal color and gradient backgrounds.
- It rendered only the layer with ID `text-title`; remaining layers, visibility, opacity, z-index, coordinates and styles were ignored.
- The export action downloaded a static Black Friday asset rather than the active design.

The replacement renders the Design Project directly in SVG. It places a canvas background rectangle/gradient before sorted layers, respects each layer's visibility, opacity, geometry and z-index, and serializes that same SVG for export. Selection boxes are stripped from the export copy. A failed cross-origin asset now produces an explicit export error instead of a blank/black exported image.

## Delivered architecture

- Expanded existing `AdminDesignProject`; no duplicate project schema was introduced.
  - `schemaVersion`, `editability`, provider `metadata`, and bounded `versionHistory` added.
  - Layer schema supports text, image, background, shape, icon, logo, badge, button, group, product and gradient types plus image/display properties.
  - Existing records without layers are returned as `FLATTENED_IMAGE`, never falsely labelled fully editable.
- New native SVG renderer uses the same layer data for on-screen preview and PNG/JPG/WebP export. No Fabric/Konva dependency was added because the existing needs are two-dimensional, data-driven, and covered without a second graphics engine.
- Workspace includes design name/dimensions, zoom/fit, save/autosave, undo/redo, layer selection, drag/snap-to-center movement, keyboard movement, add/duplicate/delete, ordering, visibility, lock, background color/gradient controls, layer inspector, image URL/asset field, and text/geometry/style edits.
- New `POST /api/admin/ai/designs/operations` asks the existing live LLM for JSON-only operations, validates against an allow-list, and applies only safe data changes. It cannot execute code, HTML or arbitrary styles. Pure text/style/layer operations do not invoke image generation.
- New save snapshots preserve up to 30 prior versions. The data is captured now; a dedicated visual restore/history browser is deferred.

## Security and product fidelity

- AI operation context includes only the current design summary, selected layer, and request.
- Allowed operations: `ADD_LAYER`, `UPDATE_LAYER`, `REMOVE_LAYER`, `REORDER_LAYER`, `DUPLICATE_LAYER`, `CHANGE_BACKGROUND`.
- Locked layers cannot be changed or removed by operations.
- Product data remains an independent image/text layer; editing a poster never mutates product records.
- Flattened files remain backgrounds; the application makes no claim to reconstruct every bitmap layer or remove embedded text without an available image-editing provider.

## Verification

| Check | Result |
|---|---|
| Design operation allow-list regression | PASS — 2 tests |
| Existing image/provider and legacy-dispatch regression | PASS — 4 tests |
| Combined Jest run | PASS — 3 suites, 6 tests |
| Backend syntax and focused ESLint | PASS |
| Frontend TypeScript + Vite production build | PASS |
| Authenticated Admin browser flow, save/reload/export visual comparison | BLOCKED — no isolated admin JWT/Redis session was supplied |
| Real LLM design-operation request | NOT_RUN — not executed without the authenticated session |

## Remaining scope

- Product/Asset Library picker, file upload/crop UI, grouping/multi-select, alignment/distribution, version restore UI, SVG/PDF/JSON export controls, and visual browser/video evidence remain future work.
- The API and data model are prepared for editable projects, but no fake E2E completion is claimed.

## Files

- `frontend/src/pages/Admin/components/CreativeStudioEditor.tsx`
- `frontend/src/pages/Admin/AdminAiWorkspacePage.tsx`
- `frontend/src/shared/api/adminAiApi.ts`
- `frontend/src/admin-theme.css`
- `backend/src/modules/ai/services/designOperations.service.js`
- `backend/src/modules/ai/services/__tests__/designOperations.test.js`
- `backend/src/modules/ai/{adminAi.controller,adminAi.route}.js`
- `backend/src/modules/ai/models/adminDesignProject.model.js`
