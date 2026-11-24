# AI concierge root-cause analysis

## 21 November 2026 — product query routing

### Symptom

The Vietnamese product request `áo thể thao` could receive the unrelated generic concierge greeting rather than product results.

### Evidence

- `ai-service/src/client/ChatClient.ts` recognized searches mainly when they began with verbs such as `tìm`, `search`, `gợi ý`, or `xem`.
- A bare product noun such as `áo thể thao` therefore skipped the `searchProducts` tool and reached the general LLM branch.
- When the provider was unavailable, that branch returned a fixed greeting which proposed unrelated categories.
- The search-result adapter only accepted direct arrays or `results`; it did not accept standard `data.results` or `data` envelopes, so some otherwise-valid adapter responses could be treated as empty.
- Successful product-search turns were persisted as `ADD_TO_CART`, which blurred browsing and mutation state.

### Repair

- Added deterministic product-query detection for Vietnamese and English apparel terms.
- Clears prior candidate selection when a new product request arrives, giving the latest request priority.
- Always invokes `searchProducts` for detected product queries.
- Accepts direct, `results`, `data.results`, and `data` result shapes and preserves numeric product prices.
- Returns a truthful no-results or temporary-retrieval response rather than an unrelated greeting.
- Persists browse results as `SEARCH_PRODUCTS` and returns `PRODUCT_SEARCH` in the response envelope.
- Replaced provider-outage greetings with an explicit availability message.

### Scope and remaining validation

The local test suite proves routing, topic-switching, result parsing, and empty-search behavior. Live catalogue/vector accuracy, authenticated mutations, payment flows, and browser/video evidence remain blocked until a safe backend, database, and provider environment is supplied.

## 21 November 2026 — checkout and chat-card hotfix

### Root causes

- No checkout-intent branch existed in the TypeScript orchestrator. Checkout phrases containing a product noun were instead classified as product search or cart-add actions.
- `get_my_cart` returned a display-only cart item, omitting the product and variant identifiers required to prepare a verified checkout reservation.
- Chat cards invented default colour/size choices when variants could not be retrieved, and treated missing prices as a generic request to contact support.
- Assistant text was rendered as plain text, exposing markdown emphasis markers; image errors had no accessible fallback.

### Repair

- Checkout phrases now retrieve the authenticated cart first, match the requested item, and call `prepareCheckout` with server-owned product and variant IDs. No search or cart-add call is made in this path.
- The cart tool now includes authoritative product/variant IDs, numeric price, formatted price and image metadata for downstream orchestration.
- The confirmation path preserves every pending checkout line item and reservation identifier rather than reducing checkout to its first item.
- Product cards no longer invent variant choices, distinguish a missing price as `Chưa có giá bán`, disable direct cart action for that state, safely render emphasis, and show an accessible image fallback on errors.

`Real` remains a raw stored variant colour label if it is returned by the product database. The schema permits arbitrary non-empty colour names; without a concrete affected product record, it cannot be classified as corruption or replaced safely.

### Live catalog evidence — 21 November 2026

Read-only local API inspection established that the label is stored data, not an AI fallback: product `Áo thể thao` (`6a3d6429363cacf6a8f2dd50`) is active with price `150000` VND and stock `44`; its two variants are `Real / L / 30` and `Real / S / 14`. The product-detail API, variant API, and vector metadata agree. Its media paths are third-party URLs. No data correction was made because the intended customer-facing color is not represented in the stored data.
