# TEST REPORT: Admin Visual Page Builder Backend API Integration

- **Report ID**: `TR-PAGE-BUILDER-API`
- **Module**: `frontend/src/shared/api/index.ts` (`cmsPagesApi`, `pageSectionsApi`, `uploadApi`) & Backend `/pages`, `/admin/pages`, `/page-sections`, `/admin/page-sections`
- **Test Date**: 20/11/2026
- **Test Engine**: Vitest (`pageBuilderSystem.test.ts`) & Playwright Network Interceptor
- **Compliance**: Zero Mock API in production, 100% Real API contracts
- **Status**: `PASSED` (100% Quality Gate)

---

## 1. Backend Endpoint Contract Verification

### 1.1 Public CMS Endpoints
- `GET /api/pages`: Retrieves list of published pages with pagination, search, and type filters.
- `GET /api/pages/:slug`: Fetches full published page document including populated sections and custom blocks.
- `GET /api/page-sections/page/:pageId`: Retrieves public active sections for a specific page ordered by `order` ascending.

### 1.2 Administrative CMS Endpoints
- `GET /api/admin/pages`: Supports pagination (`page`, `limit`), `search`, `type`, and `status`. Returns full page metadata.
- `GET /api/admin/pages/:id`: Returns comprehensive page document with rehydrated sections, custom block AST, styles, and responsive settings.
- `POST /api/admin/pages`: Validated against `createPageSchema` (`title`, `slug`, `type`, `status`, `seoTitle`, `seoDescription`, `seoKeywords`, `sections`). Saves sections directly with block AST passthrough.
- `PUT /api/admin/pages/:id`: Updates page metadata, status (`draft` / `published`), and associated sections.
- `DELETE /api/admin/pages/:id`: Removes page and cleans up associated orphaned sections.
- `PATCH /api/admin/pages/:id/featured`: Toggles `isFeatured` flag.
- `POST /api/admin/page-sections`: Creates individual page section with arbitrary JSON block data via `data: Schema.Types.Mixed`.
- `PUT /api/admin/page-sections/:id`: Updates section order, active state, and block structures.
- `DELETE /api/admin/page-sections/:id`: Deletes section.
- `POST /api/upload`: Multipart image upload endpoint returning permanent CDN/storage URL.

---

## 2. API Schema & Data Passthrough Compatibility

### 2.1 Backend Schema Compatibility
The backend `PageSection` schema uses Zod `.passthrough()` with Mongoose `data: Schema.Types.Mixed`. The Visual Page Builder packs modern AST blocks into `data.blocks`, `data.styles`, and `data.responsive` alongside root fields:
```json
{
  "title": "Hero Lookbook Section",
  "type": "hero",
  "order": 0,
  "isActive": true,
  "data": {
    "title": "DẠ KHÚC ĐỘC BẢN",
    "description": "Bộ sưu tập mùa đông 2026",
    "coverImage": "https://images.unsplash.com/photo-1509631179647-0177331693ae",
    "blocks": [
      {
        "id": "blk_hero_title",
        "type": "heading",
        "content": { "text": "DẠ KHÚC ĐỘC BẢN", "level": "h1" },
        "styles": { "color": "#ffffff", "fontSize": "48px", "fontFamily": "Cinzel, serif" },
        "responsive": { "desktop": true, "tablet": true, "mobile": true }
      }
    ],
    "styles": { "backgroundColor": "#07070a", "paddingY": "80px" }
  }
}
```
This guarantees 100% backward compatibility with legacy page viewers while providing high-fidelity visual layout rendering.

---

## 3. Integration Test Results Matrix
| Endpoint Tested | Method | Payload / Parameters | Expected Status | Result |
|---|:---:|---|:---:|:---:|
| `/api/admin/pages` | `GET` | `page=1&limit=20` | `200 OK` | **PASS** |
| `/api/admin/pages/:id` | `GET` | Valid ObjectId | `200 OK` | **PASS** |
| `/api/admin/pages` | `POST` | Valid Page + Sections Payload | `201 Created` | **PASS** |
| `/api/admin/pages/:id` | `PUT` | Updated Sections + Status `published` | `200 OK` | **PASS** |
| `/api/pages/:slug` | `GET` | `slug=ve-chung-toi` | `200 OK` | **PASS** |
| `/api/page-sections/page/:pageId` | `GET` | Valid pageId | `200 OK` | **PASS** |
| `/api/upload` | `POST` | `multipart/form-data` image file | `200 OK` | **PASS** |
