# AI Tool Catalog — Atelier Vérité Vector Shopping Agent

The Vector AI Shopping Agent features a comprehensive catalog of **18 production tools**, implemented in TypeScript (`ai-service/src/tools/ShoppingTools.ts`) and backed by real Node.js backend controllers and MongoDB/Redis operations (`backend/src/modules/ai/services/aiAgent.service.js`).

> **Zero Mock Guarantee:**
> Every tool connects to a live backend endpoint and database collection. No fake tool responses or mocked business logic are used at runtime.

---

## 1. Tool Catalog Reference

| # | Tool Name | Spring AI Concept | Method / Endpoint | Auth Level | Description |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **1** | `searchProducts` | `FunctionCallback` | `GET /api/products` | Public / Guest | Semantic vector search & keyword matching for garments |
| **2** | `getProductDetails` | `FunctionCallback` | `GET /api/products/:id` | Public / Guest | Live price, images, description, and available inventory |
| **3** | `getProductVariants` | `FunctionCallback` | `GET /api/product_variants` | Public / Guest | Available colors, sizes, and stock per SKU |
| **4** | `checkStock` | `FunctionCallback` | `GET /api/inventory/check` | Public / Guest | Real-time stock verification against Redis reservation |
| **5** | `addToCart` | `FunctionCallback` | `POST /api/cart_items` | Authenticated Shopper | Gated confirmation addition of variant to shopper's cart |
| **6** | `updateCart` | `FunctionCallback` | `PUT /api/cart_items/:id` | Authenticated Shopper | Adjust item quantities in cart with inventory check |
| **7** | `removeFromCart` | `FunctionCallback` | `DELETE /api/cart_items/:id`| Authenticated Shopper | Remove selected item from shopper's cart |
| **8** | `getWishlist` | `FunctionCallback` | `GET /api/favorites` | Authenticated Shopper | Retrieve list of saved favorite luxury items |
| **9** | `addToWishlist` | `FunctionCallback` | `POST /api/favorites` | Authenticated Shopper | Save product to customer wishlist |
| **10** | `validateVoucher` | `FunctionCallback` | `POST /api/vouchers/validate`| Authenticated Shopper | Verify discount percentage, conditions, and expiry |
| **11** | `applyVoucher` | `FunctionCallback` | `POST /api/cart/apply-voucher`| Authenticated Shopper | Bind valid coupon code to active shopping cart |
| **12** | `getMyOrders` | `FunctionCallback` | `GET /api/order/my-orders` | Authenticated Shopper | Query purchase history, tracking number, and status |
| **13** | `prepareCheckout` | `FunctionCallback` | `POST /api/checkout/reserve` | Authenticated Shopper | Reserve inventory in Redis (5-minute TTL) for checkout |
| **14** | `confirmOrder` | `FunctionCallback` | `POST /api/order/create` | Authenticated Shopper | Create actual order after explicit customer confirmation |
| **15** | `getLoyaltyStatus` | `FunctionCallback` | `GET /api/user/loyalty` | Authenticated Shopper | Patron loyalty points, membership tier (12 tiers), perks |
| **16** | `getMyProfile` | `FunctionCallback` | `GET /api/user/profile` | Authenticated Shopper | View account contact details, name, and address |
| **17** | `updateAllowedProfileFields` | `FunctionCallback` | `PUT /api/user/profile` | Authenticated Shopper | Safely update name, phone, or address (password blocked) |
| **18** | `searchPublishedPolicies` | `FunctionCallback` | `GET /api/pages` & RAG | Public / Guest | Inquire about returns (7-day policy), warranty, shipping |

---

## 2. Tool Execution Security & Allowlist

1. **HMAC Validation**: Requests to `/api/internal/ai/tools/:tool` require a cryptographic SHA-256 HMAC signature using the shared secret.
2. **Tool Allowlist**: Only tools in `ALLOWED_TOOLS` (`internalAi.route.js`) are permitted to execute.
3. **Identity from Server**: The user ID is retrieved directly from the verified session / JWT token via `X-AI-End-User-Id`. The LLM cannot spoof or specify arbitrary user IDs.
4. **Execution Limits**: Rate limiting and maximum tool execution bounds (default: 5 tool executions per turn) prevent infinite looping.
