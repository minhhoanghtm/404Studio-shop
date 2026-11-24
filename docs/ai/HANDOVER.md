# AI Concierge hotfix handover — 21 November 2026

## Completed

- Repaired bare product query routing and cart-first checkout draft routing.
- Preserved all checkout items and reservation identity during confirmation.
- Repaired chat-card markdown emphasis, missing-price, broken-image and unverified-variant behavior.
- Current frontend build passes; frontend Vitest reports 159 tests; desktop vector-AI Playwright reports 4 passed scenarios.

## Evidence

- Backend health: MongoDB and Redis connected; AI service health: UP.
- Vector search returned current catalog results for `áo thể thao` using keyword fallback while embeddings were offline.
- Validated H.264 MP4 evidence:
  - `frontend/videos/AI/AI01-21-11-2026/AI01-product-search.mp4`
  - `frontend/videos/AI/AI01-21-11-2026/AI02-cart-variant-selection.mp4`
  - `frontend/videos/AI/AI01-21-11-2026/AI03-policy-rag.mp4`
  - `frontend/videos/AI/AI01-21-11-2026/AI04-security-guardrails.mp4`

## Important data finding

The local `Áo thể thao` product (`6a3d6429363cacf6a8f2dd50`) has two persisted variants with color `Real` (sizes L and S). Do not replace it until the catalog owner supplies the intended color.

## Remaining blockers

- No confirmed disposable customer accounts or isolated cart/order fixtures.
- No configured payment sandbox/mock ownership confirmation.
- Authenticated checkout/order/profile, cross-user, expired-session, replay, and tampered-confirmation tests remain blocked. Mobile/tablet evidence remains unrun.

No commits, pushes, destructive data operations, production orders, or payments were performed.
