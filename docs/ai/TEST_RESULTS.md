# AI repair test results

## 21 November 2026

| Check | Status | Evidence |
| --- | --- | --- |
| Bare `áo thể thao` routes to product search | PASS | Unit regression verifies `searchProducts` receives the exact latest query and that a real result/price is rendered. |
| Latest product topic replaces prior result set | PASS | Unit regression searches `áo blazer`, then `áo thể thao`, and verifies the second tool call uses `áo thể thao`. |
| Empty search does not use unrelated greeting | PASS | Unit regression verifies an empty result produces a no-results message and excludes the prior hardcoded category response. |
| AI service test suite | PASS | `npm test`: 1 file, 19 tests passed. |
| AI service production compile | PASS | `npm run build`: TypeScript completed successfully. |
| Backend vector/agent regression | PASS | `npm test -- --runTestsByPath src/modules/ai/__tests__/vector_ai.test.js`: 29 tests passed. The emitted provider/database warnings are expected fault-simulation paths in that mocked suite. |
| Checkout intent routing | PASS | New AI-service regressions verify `thanh toán áo thể thao` calls `getMyCart` then `prepareCheckout`, and never calls product search or cart add. |
| Missing cart product handling | PASS | New AI-service regression verifies no checkout draft is created if the requested product is absent from the cart. |
| Frontend production build | PASS | `npm run build` completed successfully in the current worktree. |
| Live semantic/vector retrieval | BLOCKED | Requires a running backend, seeded catalogue, vector index, and provider configuration. |
| Authenticated cart/checkout/order/profile flows | BLOCKED | Requires isolated authenticated fixtures and a safe backend/database environment. |
| Browser AI E2E, desktop | PASS | `vectorAiShoppingAgent.spec.ts`: 4 scenarios passed against the running local frontend/backend/AI service. |
| MP4 evidence | PASS | Four Playwright recordings were converted to validated H.264 MP4 files under `frontend/videos/AI/AI01-21-11-2026/`. |

No production data, checkout, payment, or order was created during verification.

## Local-stack validation — 21 November 2026

The local backend health endpoint reported MongoDB and Redis connected; the AI service reported UP. `/api/ai/search?query=áo thể thao` returned five real catalog results through keyword fallback while the embedding provider was offline. Authenticated cart/order/profile and cross-user/replay checks remain blocked because no proven disposable customer fixture or payment mock was supplied; no stateful operation was attempted.
