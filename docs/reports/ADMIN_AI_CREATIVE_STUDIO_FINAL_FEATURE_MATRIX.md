# Admin AI & Creative Studio final feature matrix

Updated: 2026-11-25 (Asia/Bangkok)

| Task | Status before | Status after | Files / evidence | Remaining issue |
| --- | --- | --- | --- | --- |
| 01 Product Asset Picker | NOT_STARTED | TESTED_PASS | `CreativeStudioEditor.tsx`, QA catalog/categories APIs, preview, variant/color, category filter, multi-select/batch image-name-price layers, Playwright Desktop/Tablet/Mobile 3/3 (31.8s) | Brand/collection filters are NOT_APPLICABLE: Product schema/API has no corresponding relations. |
| 02 Asset Library | NOT_STARTED | TESTED_PASS | `CreativeStudioEditor.tsx`, `seed-qa-fixtures.js`, real-auth Playwright Desktop/Tablet/Mobile | Banner + Design Project thumbnail sources are integrated only through admin-protected APIs. Brand Kit has palette/typography only; uploaded and AI-generated image catalogs are absent, so the UI states this rather than inventing assets. |
| 03 Upload & Crop | NOT_STARTED | TESTED_PASS | `adminAiApi.ts`, `adminAi.controller.js`, `adminDesignProject.model.js`, `CreativeStudioEditor.tsx`, real-auth Playwright D/T/M | Uploaded files are stored by existing protected admin upload route. Crop is non-destructive layer metadata; no source asset rewrite. |
| 04 Resize & Rotation Handles | NOT_STARTED | TESTED_PASS | `CreativeStudioEditor.tsx`, real-auth Playwright D/T/M, production build | Desktop/Tablet exercised pointer handles. Mobile canvas remains usable at 25% zoom; inspector rotation persistence was used after resize-pointer coverage. |
| 05 Multi-select / Group / Alignment | NOT_STARTED | TESTED_PASS | `CreativeStudioEditor.tsx`, `creativeStudio.group.acceptance.real.spec.ts`, `creativeStudio.alignmentOrder.acceptance.real.spec.ts`, real-auth D/T/M artifacts, production build | Group graph/transform/persistence/export and the independent rotation-aware alignment/distribution/group-order matrix all passed on isolated projects across D/T/M. |
| 06 Version History / Restore | NOT_STARTED | TESTED_PASS | `CreativeStudioEditor.tsx`, `adminAi.controller.js`, `creativeStudio.versionHistory.acceptance.real.spec.ts`, `creativeStudio.saveSecurity.acceptance.real.spec.ts`, real-auth artifacts | V1/V2 preview/restore verified D/T/M; delayed-save latest-state queue, failed-save retry preservation, and cross-admin owner isolation are verified with isolated QA projects. |
| 07 Export / Import | SVG/JSON PASS, raster unverified | IN_PROGRESS | `CreativeStudioEditor.tsx`, `designPayload.validator.js`, focused Desktop real-auth export/import E2E | PNG/JPG/WebP signature, decode, dimensions, nonblank pixels; confirmed JSON round-trip and invalid/tampered rejection are verified Desktop. Tablet/Mobile and asset ownership policy proof remain. |
| 08 Business Analytics | NOT_STARTED | NOT_RUN | — | Requires deterministic reconciliation suite |
| 09 Admin Actions | NOT_STARTED | NOT_RUN | — | Requires confirmation-flow integration coverage |
| 10 Customer Regression | NOT_STARTED | NOT_RUN | — | Requires cart/checkout QA E2E |
| 11 Security Extended | PARTIAL | PARTIAL | Prior RBAC/invalid-token checks | Revocation/expiry/cross-owner coverage remains |
| 12 Free Image | BLOCKED_EXTERNAL | BLOCKED_EXTERNAL | Paid fallback is disabled; no free provider credential/local ComfyUI | Provider configuration required |
| 13 Live LLM | BLOCKED_EXTERNAL | BLOCKED_EXTERNAL | No additional cost-authorized live request | Budget/provider authorization required |
| 14 UI/UX Review | NOT_STARTED | NOT_RUN | — | Depends on remaining editor panels |
| 15 Video Evidence | NOT_STARTED | NOT_RUN | — | MP4 evidence not produced |
| 16 Quality Gates | IN_PROGRESS | PARTIAL | Production build pass; Product Picker E2E 3/3 | Remaining tasks must add their own tests |

## TASK 01 evidence

The picker queries `/api/products/catalog` through the shared `productsApi`, not a hardcoded product list. The API schema is `{ data: { products } }`; the implementation maps that response explicitly. Selecting the QA Silk Blazer creates separate product-image, name, and price layers. The acceptance suite signs in through the UI, searches the QA product, adds it, saves via the authenticated API, reloads, and asserts the product text remains on the SVG canvas.

No credentials, tokens, or paid AI providers were used in this task.
