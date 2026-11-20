# ATELIER VÉRITÉ — CMS & VISUAL PAGE BUILDER ARCHITECTURE AUDIT

**Date**: 20/11/2026  
**Auditor**: Principal Fullstack Architect & Headless CMS Specialist  
**Workspace**: `d:\Project\404Studio`  
**Compliance**: Vietnam Law 91/2025/QH15 & Decree 356/2025/NĐ-CP  

---

## 1. Executive Summary

This audit assesses the current state of the Content Management System (CMS), Page Sections data models, backend endpoints, and frontend presentation layers within Atelier Vérité. The goal is to establish the technical foundation for an enterprise-grade **Visual Page Builder & Dynamic Content Management System** that enables non-technical administrators to design, preview, and publish responsive brand and legal pages without writing code.

---

## 2. Backend CMS Architecture

### 2.1 Database Models
The system currently leverages two core Mongoose collections:

1. **`pages` (`backend/src/modules/pages/page.model.js`)**:
   - `title`: String (required, trimmed)
   - `slug`: String (required, unique, indexed)
   - `type`: Enum (`about`, `policy`, `faq`, `guide`, `lookbook`, `landing`, `blog`)
   - `status`: Enum (`draft`, `published`, `archived`)
   - `seoTitle`, `seoDescription`, `seoKeywords`: String
   - `displayOrder`: Number (default: 0)
   - `publishedAt`: Date
   - `viewCount`: Number (default: 0)
   - `isFeatured`: Boolean (default: false)
   - `thumbnailUrl`, `bannerUrl`: String
   - `relatedProducts`: Array of ObjectId references to `Product`

2. **`page_sections` (`backend/src/modules/pageSections/pageSection.model.js`)**:
   - `pageId`: ObjectId reference to `pages` (required, indexed)
   - `type`: Enum (`hero`, `story`, `gallery`, `quote`, `image_text`, `products`, `banner`, `cta`)
   - `order`: Number (default: 0)
   - `isActive`: Boolean (default: true)
   - `data`: Mongoose `Schema.Types.Mixed` (unconstrained structured JSON)

### 2.2 Validation Layer
- `page.validator.js` and `pageSection.validator.js` use Zod discriminated unions with `.passthrough()`.
- Because `.passthrough()` is applied to both the top-level section schema and section data schemas, the `data` field can safely carry rich visual builder properties:
  - Typography configuration (font family, size, weight, alignment)
  - Color palettes (text, background, accent)
  - Spacing tokens (padding, margin, gap)
  - Nested block components (headings, paragraphs, buttons, grids)
  - Responsive visibility flags (`hideOnMobile`, `hideOnDesktop`)

### 2.3 Endpoints Matrix
| Method | Endpoint | Access | Purpose |
|---|---|---|---|
| `GET` | `/api/pages` | Public | List published pages (filter by type/search) |
| `GET` | `/api/pages/:slug` | Public | Get full page document with populated sections |
| `PATCH` | `/api/pages/:slug/view` | Public | Atomic Redis-deduplicated page view counter |
| `GET` | `/api/admin/pages` | Admin | List all pages with pagination and filter |
| `GET` | `/api/admin/pages/:id/detail` | Admin | Full page detail with metadata and sections |
| `GET` | `/api/admin/pages/:id` | Admin | Page metadata and populated sections |
| `POST` | `/api/admin/pages` | Admin | Atomic creation of Page + nested PageSections |
| `PUT` | `/api/admin/pages/:id` | Admin | Atomic update of Page + nested PageSections |
| `DELETE` | `/api/admin/pages/:id` | Admin | Atomic deletion of Page + associated PageSections |
| `PUT` | `/api/admin/pages/:id/feature` | Admin | Toggle featured state |
| `GET` | `/api/admin/page-sections/:pageId` | Admin | List sections for page |
| `POST`/`PUT` | `/api/admin/page-sections/:pageId/replace` | Admin | Bulk replace sections for page |
| `PUT` | `/api/admin/page-sections/:pageId/reorder` | Admin | Reorder section sortOrder |

---

## 3. Visual Page Builder Design Strategy

### 3.1 Data Compatibility
To maintain 100% backward compatibility with existing backend schemas and validator rules:
1. Each Visual Page Section is mapped to a valid `PageSection.type` (`hero`, `story`, `gallery`, `quote`, `image_text`, `products`, `banner`, `cta`).
2. Inside `PageSection.data`, the Visual Builder persists:
   - Primary type fields (e.g. `data.title`, `data.coverImage`, `data.content`) for legacy rendering fallback.
   - `data.blocks`: An array of fine-grained `BlockItem` objects.
   - `data.styles`: Visual styling tokens (typography, colors, padding, alignment).
   - `data.responsive`: Breakpoint-specific overrides.

### 3.2 Block Library Taxonomy
The builder organizes 28+ modular blocks across 6 categories:
1. **Content**: Heading, Paragraph, Rich Text, Quote, List, Table, Accordion / FAQ, Divider.
2. **Media**: Single Image, Image Gallery, Video Embed (sanitized allowlist), Full Banner, Image with Text.
3. **Layout**: Container, Section, Two Columns (50/50, 60/40, 70/30), Three Columns, Grid (2x2, 3x3), Spacer.
4. **Commerce**: Product Grid, Featured Product Spotlight, Category Grid, Collection Showcase, Lookbook Gallery, Voucher CTA, Campaign CTA.
5. **Interactive**: CTA Button, Multi-Tab Panel, Timeline, Countdown Timer.
6. **Legal & Compliance**: Table of Contents, Legal Policy Article, Cookie Information Table, Consent Preference Trigger, Data Privacy Request Trigger, Returns & Refunds Steps, Effective Date & Version Badge.

### 3.3 Security & Guardrails
- **CWE-79 / XSS Defense**: Pure React AST rendering with zero `dangerouslySetInnerHTML` for arbitrary script execution.
- **Protocol Allowlist**: Links and embeds only permit `http:`, `https:`, and `mailto:` protocols; `javascript:`, `data:`, and `vbscript:` are strictly blocked.
- **Legal Protection Engine**: Mandatory legal disclosures (user rights under Vietnam Law 91/2025/QH15, data controller identity, cookie categories, third-party tracking disclosure, data deletion request links, effective date, policy version) are strictly validated before publishing legal policy pages.
