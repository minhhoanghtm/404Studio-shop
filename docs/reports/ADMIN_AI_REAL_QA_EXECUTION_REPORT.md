# Admin AI real QA execution report

Date: 2026-11-24 (Asia/Bangkok)

## Result

`PARTIAL_PASS` — the isolated QA stack was started and used for real authentication, RBAC checks, and browser E2E. The Creative Studio core flow passed across Desktop, Tablet, and Mobile. This is not a FULL_SUCCESS because live LLM/image verification, complete Customer AI regression, full export verification, and MP4 evidence were not completed in this run.

## Isolated QA infrastructure

- Docker Compose: `compose.qa.yaml` only; no existing Compose project or container was stopped or removed.
- MongoDB: `atelier_qa_mongo`, bound to `127.0.0.1:27018`, database `atelier_verite_qa`.
- Redis: `atelier_qa_redis`, bound to `127.0.0.1:6381`, distinct volume and network.
- Backend: `http://127.0.0.1:5002`; readiness returned HTTP 200 with MongoDB and Redis `connected`.
- Frontend: `http://127.0.0.1:5174`; runtime module verification confirmed its API base is `http://127.0.0.1:5002/api`.
- QA configuration is ignored by Git. It has independent secrets, QA-only connection strings, and zero image-generation budgets. No production `.env` was copied.

## Seed execution

`node --env-file=.env.qa src/scripts/seed-qa-fixtures.js` completed against the isolated QA database. The idempotent fixture includes four QA accounts (two admin-role and two customers), one category, product/variant/inventory, cart, delivered order/order item, active campaign, and a layered Admin Design Project. Credentials and tokens are intentionally omitted.

## Authentication and security results

All checks used real QA auth flows; no mock JWT was used.

| Check | Result |
| --- | --- |
| Admin protected design API | `200` |
| Customer access to Admin AI designs | `403` |
| Invalid bearer token | `401` |
| UI sign-in | Passed in browser E2E |

Redis remains connected and auth/RBAC were not disabled. Expired-token and deliberate Redis-whitelist revocation tests were not executed in this run.

## Browser E2E result

Command: `npm run test:e2e:qa`

Result: **3 passed (16.7s)**.

- Desktop Viewport: passed.
- Tablet Viewport: passed.
- Mobile Viewport: passed.

Each test accepted the consent UI, signed in through the real login form, opened `/admin/ai-assistant?tab=creative`, created a text layer, changed its content, waited for the authenticated design-save POST, reloaded, and verified the content remained in the SVG canvas.

## TASK 02 Asset Library — 24 November 2026

`TESTED_PASS` — the Creative Studio now loads only assets exposed through authenticated, admin-protected APIs: banner images and existing Design Project thumbnails. The UI provides source filtering, search, thumbnails, a loading action, partial/full access errors, and truthful empty states.

- Browser E2E across Desktop, Tablet, and Mobile loaded the two isolated QA banners, filtered/searches a banner, previewed it, added it as an independent image layer, and replaced that selected layer with the second banner.
- The saved project was reloaded through the real API. Its SVG and JSON downloads both contained the URL of the replacement banner, proving export used the selected asset rather than a placeholder.
- `/api/banners` remains guarded by `protectedRoute` plus `adminOnly`; `/api/admin/ai/designs` and `/brand-kit` remain inside the Admin AI protected router. No auth/RBAC condition was relaxed.
- Brand Kit was loaded only as its real palette/typography contract. It has no logo/image field. The current upload and AI-image endpoints have no list/catalog route, so they are explicitly identified as unavailable rather than represented by mock assets.

Playwright generated a successful WebM capture for the last mobile run. MP4 evidence was not produced because no `ffmpeg` executable is present in this environment; no external converter was installed.

## Fixes made while executing QA

1. Added root `.env.qa`: Vite uses the workspace root as `envDir`; placing QA variables only under `frontend/` left the client targeting the existing development proxy. Runtime was verified after the fix.
2. Rotated the disposable QA password after it appeared in a local failure artefact, then reseeded QA users. The current value is not included here.
3. Made the real-auth spec serial and idempotent, used exact locators, handled the consent banner, awaited the save request, and asserted persistence after reload.

## Provider and cost status

- Paid image fallbacks remain disabled and daily/monthly image budget is zero.
- No paid image generation was invoked.
- Cloudflare Workers AI, Pollinations, and ComfyUI were not configured/available for a live generation call in this QA run. This does not affect the fixture-based Creative Studio E2E.
- No additional live LLM request was made: no safe budget was established for a non-deterministic provider call.

## Not yet passed / blockers

- Admin general-chat and multi-turn *live* LLM quality: not run; deterministic/unit coverage exists from the prior stabilization work.
- Full business analytics comparison against seeded queries: not run in this execution pass.
- Full manual Creative Studio matrix (asset picker/upload/crop/group/alignment/version-history/restore): these UI capabilities were not present or not verified end-to-end, so are not claimed complete.
- PNG/JPG/WebP/SVG/JSON/PDF export verification: not completed. The E2E confirms canvas persistence, not downloaded-file integrity.
- Customer AI/cart/checkout regression and payment sandbox: not completed.
- Required MP4 evidence: not produced. Playwright video capability is enabled, but no MP4 conversion/evidence set was generated.

## Changed files in this QA run

- `compose.qa.yaml`
- `backend/.env.qa` (ignored)
- `.env.qa` (ignored)
- `frontend/.env.qa` (ignored)
- `backend/src/scripts/seed-qa-fixtures.js`
- `frontend/playwright.config.ts`
- `frontend/e2e/adminAiCreativeStudio.real.spec.ts`
- `frontend/package.json`
- `docs/reports/ADMIN_AI_REAL_QA_EXECUTION_REPORT.md`

No commit, push, merge, reset, or cleanup of unrelated working-tree changes was performed.
