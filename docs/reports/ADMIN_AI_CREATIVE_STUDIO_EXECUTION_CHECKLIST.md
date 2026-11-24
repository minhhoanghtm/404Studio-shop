# Admin AI & Creative Studio execution checklist

| Task | Status | Evidence |
| --- | --- | --- |
| 01 Product Asset Picker | TESTED_PASS | Real category filter, preview, variant/color, multiple selection, batch image/name/promotion-price layers, save/reload; Playwright 3/3 (31.8s). Brand/collection are NOT_APPLICABLE: absent from Product schema/API. |
| 02 Asset Library | TESTED_PASS | Authenticated admin Asset Library: API-backed banner/design thumbnails, search/filter/preview, independent image layer, replacement, protected-source behavior, save/reload and SVG/JSON export. Playwright Desktop/Tablet/Mobile passed. Brand Kit has no logo/image; upload/AI asset catalog APIs do not exist and show honest availability messaging. |
| 03 Upload & Crop | TESTED_PASS | Existing protected `/api/admin/ai/images/upload` reused; multipart boundary fixed, QA-host URL returned, JPEG/PNG/WebP/GIF/10MB validation, non-destructive crop metadata persists. Real-auth Playwright Desktop/Tablet/Mobile passed. |
| 04 Resize & Rotation Handles | TESTED_PASS | SVG resize and rotate handles, minimum dimensions, layer lock enforcement and persistent geometry. Desktop/Tablet pointer-drag E2E; Mobile resize pointer-drag plus rotation persistence via inspector at 25% canvas zoom. |
| 05 Multi-select, Group & Alignment | TESTED_PASS | Real-auth isolated acceptance now passes Desktop (2.5m), Tablet (2.5m) and Mobile (2.4m): manager select/deselect; group move/two handle rotations; opacity/visibility/lock; independent duplicate; ungroup + undo/redo; save/reload; SVG/JSON references; rotation-aware left/center/right/top/middle/bottom/distribute H/V/canvas center; hidden/locked protection; group/member alignment and block reordering. Evidence: `frontend/test-results/creative-group-{desktop,tablet,mobile}-20261124/` and `creative-alignment-order-{desktop-pass2,tablet,mobile}-20261125/`. |
| 06 Version History & Restore | TESTED_PASS | Real-auth V1/V2 acceptance passed Desktop/Tablet/Mobile (one test each, 1.6m): metadata refresh before reload, non-mutating preview, V1/V2 restore/save/reload. Focused Desktop queue/security acceptance additionally passed: latest queued document wins a delayed real request, a failed connection preserves local work and retries, and a second QA admin receives 404/cannot list or mutate the first admin's project. Evidence: `creative-version-{desktop-retry,tablet,mobile}-20261124/`, `creative-save-security-desktop-retry-20261125/`. |
| 07 Raster Export & JSON Import | IN_PROGRESS | Focused Desktop real-auth acceptance passed (1 test, 1.5m): PNG/JPG/WebP download signatures plus browser decode/dimensions/nonblank pixels, SVG editor-chrome exclusion, confirmed JSON export → second isolated design import → save/reload, invalid JSON rejection, and backend duplicate-ID tamper rejection `400`. Evidence: `frontend/test-results/creative-export-import-desktop-final-20261125/`. Tablet/Mobile regression and source-asset ownership policy proof remain. |
| 08 Business Analytics | NOT_STARTED | |
| 09 Admin Action Tools | NOT_STARTED | |
| 10 Customer AI Regression | NOT_STARTED | |
| 11 Security Extended Regression | NOT_STARTED | |
| 12 Free Image Generation | BLOCKED_EXTERNAL | Free providers are not configured; paid fallback is disabled |
| 13 Live LLM | BLOCKED_EXTERNAL | No approved additional live-chat budget |
| 14 UI/UX review | NOT_STARTED | |
| 15 Video evidence | NOT_STARTED | |
| 16 Final quality gates | NOT_STARTED | |
