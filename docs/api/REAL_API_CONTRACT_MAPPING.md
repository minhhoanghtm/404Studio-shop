# Real API contract mapping

Source of truth: `backend/src/routes/index.js` and the module route files, audited 17/11/2026. Base prefix is `/api`.

| Frontend Page | Feature | Backend endpoint | Status | Notes |
|---|---|---|---|---|
| Home | Recommendations | `GET /api/recommendations` | VERIFIED | Optional bearer authentication. |
| Products | List/search/detail | `GET /api/products`, `/search`, `/:slug` | VERIFIED | Source routes verified. |
| Cart | Cart operations | `GET /api/cart`, `POST/PUT/DELETE /api/cart_items` | VERIFIED | Bearer user; `GET cart_items/:cartId` only. |
| Checkout | Order/payment | `POST /api/order`, `POST /api/payments/{momo,vnpay}/create/:orderId` | VERIFIED | Order supports optional user; payments require user. |
| AI Chat | AI service | `/api/ai/*`, `/api/chat/ai/send` | VERIFIED | Exact UI payload must be tested live. |
| Auth | Login/refresh/logout | `POST /api/auth/login`, `/refreshToken`, `/signOut` | VERIFIED | Refresh cookie contract is source-verified. |
| Privacy | Consent/data requests | `/api/privacy/consent`, `/data-export`, `/data-requests` | VERIFIED | Data requests require bearer user. |
| Admin | Orders/users/vouchers | `/api/order/admin/*`, `/api/user/admin/users`, `/api/vouchers/admin` | VERIFIED | Admin only. |

The following previously published frontend client paths were not confirmed and were corrected where a direct route exists: `/auth/refresh`, `/auth/logout`, `/user/profile`, `/vouchers/my`, `/vouchers/save`, `/vouchers/apply`, and `/reviews/product/:id`.
