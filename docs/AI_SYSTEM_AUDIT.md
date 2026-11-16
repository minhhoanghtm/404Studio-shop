# AI System Audit — 17/11/2026

## Evidence reviewed

Read-only inspection covered `backend/src/modules/ai`, `communication/aiChat`, `payments`, `orders`, `inventory`, route registration, and the frontend API/chat/checkout modules. No backend file was changed.

| Area | Status | Evidence / limitation |
|---|---|---|
| AI chat and Vietnamese agent | IMPLEMENTED | `POST /api/ai/chat`; bounded tool loop (`MAX_TOOL_ITERATIONS = 3`), rate limit 30/minute. |
| Vector embedding, index and semantic search | IMPLEMENTED | `embedding.service`, `vectorIndex.service`, `semanticSearch.service`; admin-only `POST /api/ai/embeddings/sync`. |
| RAG grounding | IMPLEMENTED | `rag.service` plus sources returned by AI chat. Live relevance was not measured without an approved data environment. |
| Conversation history / isolation | PARTIAL | Authenticated conversations are persisted and ownership checked; anonymous sessions have no persistent server conversation. |
| Agent tools | IMPLEMENTED | Backend registry exposes product search/detail, cart, checkout, orders and policy functions; see capability matrix. |
| Product/stock/price authority | IMPLEMENTED | Agent and order command resolve product/variant, inventory and server price. |
| Streaming/SSE | MISSING | The audited `/api/ai/chat` response is request/response JSON, not streaming. |
| Fallback provider | PARTIAL | Provider abstraction exists; runtime fallback configuration was not runnable. |
| Payments | IMPLEMENTED, NOT LIVE-VERIFIED | Provider URLs, signed callbacks, amount checks and idempotency are present. Sandbox credentials and a test database are absent. |

## Frontend corrections made

- Removed invented AI stylist replies and product recommendations when the backend is unavailable.
- Uses the actual chat envelope (`content`, `conversationId`, confirmation/cancellation payloads) and renders only server responses.
- Removed mock card/transfer fields. Checkout exposes COD, MoMo and VNPAY only, creates an order through the backend, then redirects only to a backend-returned HTTP(S) hosted URL.
- Blocks checkout from local demonstration cart IDs that are not Mongo ObjectIds instead of fabricating an order.

## Blockers

`BLOCKED_BY_BACKEND_ENVIRONMENT`: no running backend, Mongo/Redis test database, AI provider configuration, sandbox provider credentials, or safe seeded catalog were available. Therefore live semantic accuracy, webhook/IPN, QR and cross-user tests cannot be claimed PASS.
