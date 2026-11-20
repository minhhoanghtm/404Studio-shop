# TEST REPORT: Promotional Campaigns Backend API Integration

- **Report ID**: `TR-CAMPAIGN-API-INTEGRATION`
- **Module**: `frontend/src/shared/api/index.ts` (`campaignsApi`, `bannersApi`) & Backend `/campaigns`, `/banners`
- **Test Date**: 20/11/2026
- **Test Engine**: Vitest & Playwright Network Interceptor
- **Compliance**: Zero Mock API in production, 100% Real API contracts
- **Status**: `PASSED`

---

## 1. API Contract Verification

### 1.1 Public Campaign Endpoints
- `GET /api/campaigns/active`: Returns `{ serverTime: string, campaigns: Campaign[] }`.
  - Verified active campaigns sorting by priority descending.
  - Verified calculated remaining seconds and promotional products bundle.
- `GET /api/campaigns/:slug`: Returns detailed campaign information, associated products, and pagination.

### 1.2 Administrative Campaign Endpoints
- `GET /api/admin/campaigns`: Supports query filters `page`, `limit`, `search`, `status`, `type`.
- `GET /api/admin/campaigns/:id`: Returns campaign metadata, populated `bannerId`, campaign products, and live order sales aggregation (`totalRevenue`, `totalItemsSold`, `totalOrders`, `totalQuota`, `totalRemainingQuota`).
- `POST /api/admin/campaigns`: Strictly validated against `createCampaignSchema` (`name`, `slug`, `type`, `status`, `startAt`, `endAt`, `priority`, `bannerId`, `discountRule`).
- `PUT /api/admin/campaigns/:id`: Updates campaign parameters.
- `DELETE /api/admin/campaigns/:id`: Soft-deletes campaign (`isDeleted: true`) preserving order history.
- `POST /api/admin/campaigns/:id/products`: Adds a product to Flash Sale with `sale_price < original_price`, `quota`, and `per_user_limit`.
- `PUT /api/admin/campaigns/:id/products/:productId`: Updates promotional quota and price.
- `DELETE /api/admin/campaigns/:id/products/:productId`: Removes a product from campaign.

### 1.3 Banner Integration Endpoints
- `GET /api/banners/active`: Retrieves active popup banners with `position: 'popup'`.
- `POST /api/banners/:id/click`: Records telemetry click event.
- `POST /api/admin/banners`: Admin banner creation linking to target destination.

---

## 2. API Contract Test Results
| Endpoint Tested | Method | Parameters / Body | Status Code | Result |
|---|:---:|---|:---:|:---:|
| `/api/campaigns/active` | `GET` | None | `200 OK` | **PASS** |
| `/api/admin/campaigns` | `GET` | `page=1&limit=10` | `200 OK` | **PASS** |
| `/api/admin/campaigns/:id` | `GET` | Valid ObjectId | `200 OK` | **PASS** |
| `/api/admin/campaigns` | `POST` | Valid campaign payload | `201 Created` | **PASS** |
| `/api/banners/active` | `GET` | None | `200 OK` | **PASS** |
| `/api/banners/:id/click` | `POST` | Valid banner ID | `200 OK` | **PASS** |
| `/api/upload` | `POST` | Multipart image file | `200 OK` | **PASS** |
