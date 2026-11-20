# Architectural Audit & Backend API Alignment: Promotional Campaigns & Popups

## 1. Executive Summary
This document analyzes the API capabilities and schema contracts of the backend campaign and banner modules (`backend/src/modules/campaigns/` and `backend/src/modules/banners/`) for the implementation of promotional campaigns, sale popups, and smart redirects.

---

## 2. API Contract Overview

### 2.1 Campaign Endpoints
- `GET /api/campaigns` & `GET /api/campaigns/active`: Returns active campaigns and current server time.
- `GET /api/campaigns/:slug`: Returns detailed campaign info, participating products, and pagination.
- `GET /api/admin/campaigns`: Admin listing with query filters (`page`, `limit`, `search`, `status`, `type`).
- `GET /api/admin/campaigns/:id`: Admin detailed view with populated `bannerId`, campaign products, and live aggregated sales metrics (`totalItemsSold`, `totalRevenue`, `totalOrders`, `totalQuota`, `totalRemainingQuota`).
- `POST /api/admin/campaigns`: Creates a new campaign.
- `PUT /api/admin/campaigns/:id`: Updates an existing campaign.
- `DELETE /api/admin/campaigns/:id`: Soft-deletes a campaign (`isDeleted: true`).
- `POST /api/admin/campaigns/:id/products`: Adds a product/variant with `sale_price`, `quota`, and `per_user_limit`.
- `PUT /api/admin/campaigns/:id/products/:productId`: Updates quota or promotional pricing.
- `DELETE /api/admin/campaigns/:id/products/:productId`: Removes a product from the campaign.

### 2.2 Banner Endpoints
- `GET /api/banners/active`: Public endpoint returning active promotional banners with `position`, `imageUrl`, `mobileImageUrl`, `targetType`, `targetId`, `linkUrl`, and `buttonText`.
- `POST /api/banners/:id/click`: Public telemetry endpoint tracking clicks.
- `POST /api/admin/banners`: Admin endpoint to create banners (supports `position: "popup"`, `targetType: "product" | "category" | "lookbook" | "external"`).

---

## 3. Schema & Validation Analysis

### 3.1 Backend Strict Validator Constraints
In `backend/src/modules/campaigns/campaign.validator.js`:
- `createCampaignSchema` is `.strict()` and accepts:
  - `name`: string (required)
  - `slug`: string (regex lowercase hyphenated, required)
  - `type`: `"flash_sale"` | `"seasonal"` (required)
  - `status`: `"draft"` | `"scheduled"` | `"active"` | `"ended"` (default: `"draft"`)
  - `startAt`: ISO date string (required)
  - `endAt`: ISO date string (required, must be after `startAt`)
  - `priority`: integer (default: 0)
  - `bannerId`: ObjectId string (optional, references `Banner`)
  - `pageId`: ObjectId string (optional, references `Page`)
  - `discountRule`: `{ scope, categoryIds, discountType, discountValue, maxDiscountAmount }` (optional, required if `type === "seasonal"`)

### 3.2 Gaps & Mapping Architecture
| Requested Feature / Field | Backend Implementation / Mapping | Status |
|---|---|---|
| Popup Banner media (desktop & mobile) | Stored via referenced `Banner` (`bannerId`) with fields `imageUrl`, `mobileImageUrl`, `position: "popup"` | Supported via `Banner` integration |
| Destination Type & ID (`product`, `category`, `lookbook`, `external`) | Stored in referenced `Banner` (`targetType`, `targetId`, `linkUrl`) | Supported via `Banner` integration |
| Direct `description` field on `POST /admin/campaigns` | Model has `description`, but Zod validator excludes it with `.strict()` | `BLOCKED_BY_BACKEND` (Saved to `Banner.subtitle` or client metadata) |
| Direct `show_popup`, `display_frequency` on Campaign | Stored via `Banner.position = "popup"` and client frequency state engine (`sessionStorage`/`localStorage`) | Handled client-side + Banner position |
| Campaign Types (`lookbook`, `voucher`, `brand`) | Mapped to `flash_sale` or `seasonal` campaign with target destination set to Lookbook/Voucher/Collection | Supported via Destination Resolver |

---

## 4. Security & Sanitization
All smart redirects and URLs generated through destination resolution must pass strict validation:
- Forbidden schemes: `javascript:`, `data:`, `file:`, `vbscript:`, protocol-relative `//`.
- Safe internal routes: `/products/:slug`, `/products?category=:slug`, `/lookbooks/:slug`, `/vouchers`, `/collections/:slug`.
- Safe external URLs: Validated against `http:` / `https:` protocols only.
