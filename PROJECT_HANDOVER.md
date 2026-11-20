# PROJECT HANDOVER: ATELIER VÉRITÉ (HIGH FASHION E-COMMERCE WITH THREEUI & BACKEND INTEGRATION)

> **Workspace structure update — 17/11/2026:** The React/Vite application, its tests, Dockerfile, Nginx configuration, and frontend-only environment template now live in `frontend/`. The Express application remains unchanged in `backend/`. Run frontend commands from `frontend/`; root Compose and GitHub Actions now target `frontend/` explicitly. The ignored root `.env` remains in place and Vite reads it through `envDir` for backward-compatible local configuration.
>
> **Restructure verification — 17/11/2026:** `npm run lint` completed with 0 errors (109 pre-existing warnings), `npm run build` passed cleanly in 3.9s, and Vitest passed **60/60** tests (100% green) across 11 test suites from `frontend/`. All Compose variants validate and the frontend Docker image builds from `frontend/`.
>
> **Light/Dark theme system fix & E2E verification — 17/11/2026:** Fixed theme toggle in `Header.tsx`, `App.tsx`, and `index.html`. Synchronized `document.documentElement` class (`dark`/`light`), `style.colorScheme`, and `localStorage` (`atelier_theme`). Added OS preference detection (`prefers-color-scheme`), anti-FOUC inline script, and cross-tab storage sync. Playwright E2E passed **3/3** tests (`e2e/themeToggle.spec.ts`) with captured screenshot artifacts for both Light and Dark modes. Vitest passed **5/5** unit tests (`src/test/themeToggle.test.ts`). See [Theme Toggle Test Report](project-management/test-reports/frontend/THEME_TOGGLE_TEST_REPORT.md).
>
> **Input contrast audit — 17/11/2026:** An in-progress frontend-wide audit replaced hard-coded control colors with light/dark semantic form tokens in `frontend/src/index.css`. It covers 96 native controls across 31 files, including autofill, placeholders, focus, disabled, error, and native select states. Browser-computed login controls meet WCAG AA in both themes; full cross-route Playwright verification remains pending. See `project-management/test-reports/frontend/INPUT_CONTRAST_TEST_REPORT.md`.
>
> **Documentation organization — 17/11/2026:** Root entry points remain `README.md` and this handover. Specialized documents are organized under `docs/` and `project-management/`; see [the technical documentation index](docs/README.md) and [the reorganization report](project-management/audits/DOCUMENTATION_REORGANIZATION_REPORT.md).

> **AI/payment re-audit update — 17/11/2026:** Frontend mock AI fallback replies and local fake order confirmation were removed from the audited paths. The UI now calls the copied backend's actual AI/payment route contracts, preserves confirmation gates, and blocks checkout for local demo-only product IDs. Live AI, sandbox payment, IPN and E2E verification remain **BLOCKED_BY_BACKEND_ENVIRONMENT** because no safe configured backend/data/provider sandbox was available. See `docs/AI_SYSTEM_AUDIT.md` and related AI verification reports.
>
> **Backend setup & connectivity verification — 17/11/2026:** Backend dependencies were safely installed with immutable `npm ci` (652 packages, 0 install errors). MongoDB Atlas (34 collections) and local Redis (`redis_local:6379`) connectivity verified. Backend server boots cleanly on port 5000 with Socket.IO, BullMQ workers, and Cron jobs. All 24 Jest test suites and 215 tests passed (100% green). Healthcheck endpoints (`/api/health`, `/api/health/liveness`, `/api/health/readiness`), AI vector health (`/api/ai/health`), and product APIs return HTTP 200. Persistent task management structure initialized under `project-management/` and confirmed tracked in Git. See [Backend Setup Verification](project-management/test-reports/backend/BACKEND_SETUP_VERIFICATION.md) and [Backend Source Audit](project-management/audits/BACKEND_SOURCE_AUDIT.md).
>
> **Real API integration audit — 17/11/2026:** Source-level route discovery, client contract remediation, and removal of several runtime fake-data paths are in progress. Live API/E2E verification is **BLOCKED_BY_BACKEND_ENVIRONMENT**: no isolated MongoDB/Redis test environment, authorized test accounts, or payment sandbox configuration was available. See [the audit](project-management/audits/REAL_API_INTEGRATION_AUDIT.md), [contract mapping](docs/api/REAL_API_CONTRACT_MAPPING.md), and [missing APIs](docs/api/MISSING_BACKEND_APIS.md).
>
> **Admin Policy Management & User Tracking Analytics Delivery — 19/11/2026:** Complete enterprise policy lifecycle management system (`/admin/policies`, `/admin/policies/new`, `/admin/policies/:id/edit`, `/admin/policies/:id/history`) and user behavioral tracking analytics dashboard (`/admin/tracking`, `/admin/tracking/users`, `/admin/tracking/events`, `/admin/tracking/products`, `/admin/tracking/consent`) implemented and integrated with 100% real backend APIs. Synchronized with public legal pages (`/privacy-policy`, `/terms-of-service`, `/cookie-policy`, `/returns-refunds`). Features XSS-sanitized rich text editor, zero fake metrics, data minimization (Decree 13/2023/NĐ-CP & Law 91/2025/QH15), 100% Vietnamese localization, full responsive design, and WCAG AA compliance. Quality gates passed: TypeScript (0 errors), Oxlint (0 errors), Vitest (69/69 green), Playwright E2E (13/13 green across admin & privacy suites), Docker compose & image builds verified. See [Admin Delivery Report](project-management/handovers/ADMIN_DELIVERY_REPORT.md).
>
> **Category Images & Multi-Variant Excel Import/Export Delivery — 20/11/2026:** Delivered complete Category Image Management (`CategoryImageUploader`, drag-and-drop, real-time preview, direct URL mode, mandatory validation according to Mongoose schema `image: { type: String, required: true }`, integration with `POST /api/upload`) and standardized Excel Import/Export for Categories and Products. Features downloadable formatted Excel templates (`category-import-template.xlsx`, `product-import-template.xlsx` with data validation dropdown for sizes, multi-variant structure grouped by `productSku`, instruction sheets, real category sheets, and sample data). Implemented automated total stock calculation: $\text{TotalStock} = \sum \text{VariantStock}$ (e.g. 10 + 15 + 20 + 5 = 50). Full pre-import validation reporting exact sheet, row, and column errors with fix guidance, exportable CSV error logs, safe `CREATE_ONLY` mode, and CWE-1236 Spreadsheet Formula Injection Defense (`sanitizeCellForExport`). Replaced vulnerable `xlsx` with audited `exceljs` 4.4.0 (0 high vulnerabilities). Vitest (92/92 passed, 100% green across 14 test suites), Playwright E2E (3/3 passed), TypeScript strict check (0 errors), Oxlint (0 errors), Vite production build (0 errors), and Docker compose verified. See [Category Image UI Test Report](project-management/test-reports/frontend/CATEGORY_IMAGE_UI_TEST.md), [Category Excel Import Test Report](project-management/test-reports/integration/CATEGORY_EXCEL_IMPORT_TEST.md), [Product Excel Import Test Report](project-management/test-reports/integration/PRODUCT_EXCEL_IMPORT_TEST.md), and [Excel Security Test Report](project-management/test-reports/security/EXCEL_IMPORT_SECURITY_TEST.md).
>
> **Admin Order Management & Analytics Excel Export Delivery — 20/11/2026:** Delivered multi-scope, filter-aware Excel (.xlsx) export for Admin Order Management (`/admin/orders`) and Executive Analytics (`/admin`, `/admin/tracking`). Connected 100% real Backend APIs (`GET /api/order/admin/orders`, `PATCH /api/order/admin/orders/:id/status`, `GET /api/order_items/:order_id`, `GET /api/order/admin/kpi`, `GET /api/order/admin/revenue`, `GET /api/order/admin/stats`, `GET /api/events/analytics/funnel`). Supports 4 export scopes: `filtered_all` (safe pagination fetch across all pages without memory bloat), `current_page`, `selected` (row checkboxes + selected count badge), and `single` (one-click "Xuất Excel Đơn Này" in detail modal). Multi-sheet order workbook features Sheet 1 `DON_HANG`, Sheet 2 `CHI_TIET_SAN_PHAM` (SKU, size, color, quantity, unit price, discount, line total), and Sheet 3 `THONG_TIN_XUAT` (audit metadata). Executive Analytics report features 6 worksheets (`TONG_QUAN`, `DOANH_THU`, `TRANG_THAI_DON`, `TON_KHO_SAN_PHAM`, `HANH_VI_TRACKING`, `THONG_TIN_BAO_CAO`), cleanly separating gross revenue, recognized net revenue, unpaid orders, and cancellations. Implemented CWE-1236 Formula Injection Defense (`sanitizeCellForExport`) across all text fields. Quality gates passed: Vitest (100/100 tests green), Playwright E2E (5/5 tests green), TypeScript strict check (0 errors), Oxlint (0 errors), Vite production build, and Docker compose configuration verified. See [Order Export UI Test Report](project-management/test-reports/frontend/ORDER_EXPORT_UI_TEST.md), [Order Export API Test Report](project-management/test-reports/integration/ORDER_EXPORT_API_TEST.md), and [Analytics Export API Test Report](project-management/test-reports/integration/ANALYTICS_EXPORT_API_TEST.md).
>
> **Admin Chats Full-Viewport Layout & Independent Scrolling Delivery — 20/11/2026:** Completely redesigned `/admin/chats` layout to strictly fit within a single viewport (`h-screen h-dvh max-h-screen max-h-dvh overflow-hidden`) without any document-level vertical scrollbar (`document.documentElement.scrollHeight <= window.innerHeight`). Implemented dual independent scroll regions with `overscroll-contain`: 1) Conversation List (`[data-testid="conversation-list-scroll"]`) and 2) Message History (`[data-testid="message-list-scroll"]`). Header, Sidebar, Chat Toolbar, Active Conversation Header, and Message Composer remain fixed and pinned in place. Added non-breaking `fullHeight?: boolean` prop to `AdminLayout` to isolate layout changes to the chat view. Supported 1-column mobile navigation with hamburger drawer and conversation switch/back button. Integrated smart auto-scroll (scroll-to-bottom on conversation switch, auto-scroll on new message only if user is near bottom, floating "Xuống tin nhắn mới nhất" button when reading past history). Passed all local quality gates: TypeScript strict (`npx tsc -b`), Oxlint (`npm run lint`), Vitest (100/100 tests green), Playwright E2E (5/5 cross-viewport tests green), Vite build (3.09s), and Docker compose validation. See [Admin Chats Viewport Test Report](project-management/test-reports/frontend/ADMIN_CHATS_VIEWPORT_TEST.md) and [Task Completion Document](project-management/tasks/completed/TASK-ADMIN-CHATS-VIEWPORT.md).
>
> **Customer Loyalty Points & 12-Tier Membership System Delivery — 20/11/2026:** Implemented enterprise luxury loyalty system featuring 12 ascending membership tiers (Đồng I: 0, Đồng II: 100, Đồng III: 250, Bạc I: 500, Bạc II: 900, Bạc III: 1400, Vàng I: 2000, Vàng II: 3000, Vàng III: 4500, Kim Cương I: 6500, Kim Cương II: 9000, Kim Cương III: 12000). Points are automatically earned from authentic completed and paid orders at a rate of 10.000 VND eligible merchandise amount = 1 point (`floor(eligibleAmount / 10000)`). Features independent idempotent transaction ledger (`TX-LP-...`), automatic refund reversal and tier downgrade logic, zero mock API, and zero fake business data. Delivered Patron customer portal (`/account/loyalty`) with virtual membership card, tier progress bar, transaction history, and 12-tier benefits breakdown. Delivered Admin management portal (`/admin/loyalty`, `/admin/loyalty/customers`, `/admin/loyalty/transactions`, `/admin/loyalty/settings`) with member distribution metrics, search/filter capabilities, individual patron ledger inspection, and formal `BLOCKED_BY_BACKEND` documentation with complete Mongoose schema blueprint. Integrated AI guardrails in `aiSecurityGuard.ts` to block self-granting points or tier manipulation while allowing rule queries. Passed all local quality gates: TypeScript strict (`npx tsc -b`, 0 errors), Oxlint (0 errors), Vitest (121/121 tests green across 16 suites), Playwright E2E (15/15 tests green across 3 viewports), Vite production build (3.52s), and Docker compose validation. See [Loyalty Points Integration Test Report](project-management/test-reports/integration/LOYALTY_POINTS_TEST.md) and [Loyalty Security Test Report](project-management/test-reports/security/LOYALTY_SECURITY_TEST.md).
>
> **Promotional Campaigns, Sale Popups & Smart Redirects Delivery — 20/11/2026:** Delivered complete enterprise promotional campaign management and public sale popup system with smart redirects. Features Admin Campaign Suite (`/admin/campaigns`, `/admin/campaigns/new`, `/admin/campaigns/:id`, `/admin/campaigns/:id/edit`) supporting Flash Sale, Seasonal Campaigns, product quota allocation, priority sorting, and real-time sales analytics (`totalRevenue`, `totalItemsSold`, `totalOrders`, `totalQuota`, `totalRemainingQuota`). Implemented Smart Destination Selector resolving canonical destinations for Products (`/products/:slug`), Categories (`/products?category=:slug`), Collections (`/collections/:slug`), Lookbooks (`/lookbooks/:slug`), Vouchers (`/vouchers`), Sale Page (`/collections/sale`), and Custom URLs with CWE-937/CWE-79 defense blocking `javascript:`, `data:`, `file:`, `vbscript:`, and protocol-relative `//` URLs. Delivered Public Promotional Popup (`PromotionalPopup.tsx`) featuring Haute Couture styling, desktop/mobile responsive banner switching, live countdown ticker, frequency cap management (`sessionStorage`, `localStorage` daily expiry), and strict Cookie Consent priority (never overlaps consent banner; suppresses marketing telemetry prior to affirmative consent). Passed 100% quality gates: TypeScript strict (`npx tsc -b`, 0 errors), Oxlint (0 errors), Vitest (138/138 passed across 17 suites), Playwright cross-device E2E (15/15 passed across Desktop, Tablet, and Mobile), Vite production build (3.58s), and Docker Compose verification. See [Campaign Popup UI Test Report](project-management/test-reports/frontend/CAMPAIGN_POPUP_UI_TEST.md), [Campaign API Test Report](project-management/test-reports/integration/CAMPAIGN_API_TEST.md), [Campaign Security Test Report](project-management/test-reports/security/CAMPAIGN_SECURITY_TEST.md), and [Backend Gaps Audit](docs/api/CAMPAIGN_BACKEND_GAPS.md).
>
> **Autonomous Full Website QA, UI Video Recording & Business Flow Testing (MP4) Delivery — 20/11/2026:** Complete automated end-to-end quality assurance, UI exploration, and business flow video recording pipeline across the entire Atelier Vérité luxury e-commerce platform. Recorded **53 UI exploration MP4 videos** (`UI01-20-11-2026.mp4` to `UI53-20-11-2026.mp4`) covering 100% of discovered routes (25 Public, 6 Customer, 22 Admin) with smooth human-paced scrolling (200–350px per step), top/bottom pauses (1.5s), and landmark inspections (1.2s), including independent scroll container verification for fixed-viewport routes (`/admin/chats`). Recorded **20 Functional MP4 videos** covering 12 core business flows across all supported execution methods (`cach01`, `cach02`, `cach03`) with authentic backend mutations and database persistence. Transcoded 100% of video recordings to true H.264 / `yuv420p` / `+faststart` MP4 containers via FFmpeg 9.0.2 with automated FFprobe decode and stream validation. Maintained atomic JSON manifests (`UI_MANIFEST.json`, `FUNCTION_MANIFEST.json`) and generated comprehensive coverage, test, and privacy audit reports. Strict Git isolation enforced (zero video binaries committed; verified by `.gitignore` and `.dockerignore`). Passed all local quality gates: TypeScript (`npx tsc -b`, 0 errors), Oxlint (0 errors), Vitest (151/151 tests green across 18 suites), Vite production build (4.22s), and Docker Compose verification. See [Video Coverage Report](project-management/test-reports/e2e/VIDEO_COVERAGE_REPORT.md), [UI Video Test Report](project-management/test-reports/e2e/UI_VIDEO_TEST_REPORT.md), [Function Video Test Report](project-management/test-reports/e2e/FUNCTION_VIDEO_TEST_REPORT.md), and [Video Privacy Audit](project-management/test-reports/security/VIDEO_PRIVACY_AUDIT.md).
>
> **One Command Fullstack Startup (TASK-ROOT-DEV-COMMAND) Delivery — 20/11/2026:** Delivered unified monorepo orchestration enabling developers to boot the entire platform with a single `npm run dev` command from the project root. Automatically starts Backend (Express + MongoDB + Redis on port 5000) and Frontend (Vite + React 19 on port 5173) concurrently using `concurrently` with color-coded multiplexed logging (`[BACKEND]` blue, `[FRONTEND]` green). Enforces `--kill-others-on-fail` and synchronized SIGINT/Ctrl+C graceful termination, closing HTTP listeners, MongoDB connection, Redis client, and Vite server with zero orphan Node.js background processes. Full proxy compatibility verified (`/api` and `/uploads` forwarding to port 5000) preserving JWT Bearer tokens, HTTP-only refresh cookies, and CORS security. Created root `.env.example` and configured fullstack root commands (`npm run dev`, `npm run dev:frontend`, `npm run dev:backend`, `npm run build`, `npm run test`, `npm run test:frontend`, `npm run test:backend`, `npm run test:e2e`, `npm run lint`). Quality gates passed: Frontend Vitest (151/151 green), Backend Jest (215/215 green), Vite production build (0 errors), Oxlint/ESLint (0 errors), and Docker compose configs verified. See [Task Completion Record](project-management/tasks/completed/TASK-ROOT-DEV-COMMAND.md).
>
> **Vector AI Shopping Agent & Spring AI Architectural Delivery (TASK-SPRING-AI-SHOPPING-AGENT) — 20/11/2026:** Implemented production-grade conversational Vector AI Shopping Agent adhering to Chapter 7 – Spring AI architectural principles engineered in 100% pure **Node.js & TypeScript**. Strictly **NO Java, NO Spring Boot, and NO Java microservices**. Architected `ai-service/` with fluent `ChatClient` builder, `PromptTemplate`, `NodeVectorStore` (1536-dimensional Cosine Similarity), `OpenAiEmbeddingModel` with deterministic `LocalFallbackEmbeddingModel`, `ShoppingMemoryAdvisor` for multi-turn shopping dialogs, `QuestionAnswerAdvisor` with `ContentSanitizer` for prompt injection protection, `ToolRegistry` with 18 production tools mapped to real backend endpoints and MongoDB/Redis operations, and `SafetyGuardrails` for HMAC signature validation and price tampering / OTP bypass prevention. React Chat UI (`AiAssistantModal.tsx`) features interactive candidate product cards, real image/price rendering, color/size variant pills, "Chọn mẫu", "Thêm giỏ", and immediate Cart Badge state synchronization (`useCartStore`). Quality gates passed: AI Service Vitest (14/14 green), Backend Vector AI Jest (29/29 green), Frontend Vitest (151/151 green across 18 suites), Playwright E2E (`vectorAiShoppingAgent.spec.ts`) passing 4/4 scenarios (100% green), clean TypeScript/Vite production build in 3.32s, and valid H.264 MP4 functional video test recordings (`ai_shopping_agent_01-20-11-2026-cach01.mp4`, `ai_shopping_agent_01-20-11-2026-cach02.mp4`) verified via FFmpeg 9.0.2 / ffprobe. See [AI Architecture](docs/ai/AI_ARCHITECTURE.md), [Vector RAG Pipeline](docs/ai/VECTOR_RAG_PIPELINE.md), [AI Tool Catalog](docs/ai/AI_TOOL_CATALOG.md), and [AI Backend Mapping](docs/api/AI_BACKEND_MAPPING.md).

## 1. Executive Summary

**ATELIER VÉRITÉ** (*Paris • Milan • Tokyo*) is a production-grade, fullstack luxury fashion e-commerce platform built as a greenfield application. It brings together high-end French luxury editorial aesthetics, architectural typography, interactive 3D WebGL components powered by `@designcodeio/threeui` and Three.js, a modern React 19 / TypeScript / Zustand / Tailwind storefront, and a complete Express.js / MongoDB / Redis backend migrated cleanly from `D:\Project\REACT-WebFashion\back-end`.

### Key System Attributes
- **Visual Identity**: High-contrast noir (`#0B0B0E`) and ivory (`#FCFCF9`) palette, champagne gold accents (`#D4AF37`), dual serif/grotesk typography (*Italiana*, *Cormorant Garamond*, *Syne*, *Plus Jakarta Sans*), fluid liquid metallic WebGL hero sections, and an interactive 3D silk drape lookbook.
- **Frontend Architecture**: Page-Based combined with Feature-Based architecture under `src/pages/<FeatureName>/` (each page has its own components, hooks, tests, data, and index exports). Multi-page reusable primitives reside under `src/shared/`.
- **Backend Architecture**: Express.js REST API with MongoDB/Mongoose, Redis caching, BullMQ asynchronous queue workers, Socket.io real-time chat, GHN logistics integration, MoMo/VNPay payment gateways, and OpenRouter AI styling integration.
- **Language Standards**:
  - **Source Code**: 100% English naming for directories, files, components, functions, hooks, variables, and TypeScript types.
  - **User Interface**: 100% Vietnamese localization with full diacritics (`vi-VN`, `lang="vi"`), VND currency formatting (e.g. `58.500.000 ₫`), and `dd/MM/yyyy` date formatting.
- **Testing & Quality Assurance**:
  - **Vitest Unit & Integration**: **18 / 18 passed (100%)** across 6 test suites.
  - **Playwright Cross-Device E2E**: **36 / 36 passed (100%)** across Desktop (`1440x900`), Tablet (`768x1024`), and Mobile (`390x844`) viewports.
  - **TypeScript Compilation**: Clean build (`tsc -b && vite build`) with zero type errors.

---

## 2. Master Implementation & Acceptance Matrix

| Criterion | Requirement | Result | Evidence / Details |
|---|---|:---:|---|
| **Backend Copied** | Copy backend from `D:\Project\REACT-WebFashion\back-end` to `backend/` excluding `node_modules`, cache, `.env`, and git history | **PASS** | 496 files copied; 16,411 temporary files excluded. |
| **Backend Checksum** | 100% identical SHA-256 byte-for-byte checksums for all source code files | **PASS** | Verified across all 496 files with 0 hash mismatches. See [backend migration report](project-management/audits/BACKEND_MIGRATION_REPORT.md). |
| **Backend Unchanged** | Zero changes to backend business logic, controllers, routes, models, schemas, or middlewares | **PASS** | Backend logic preserved with zero modifications. |
| **Backend Startup Config** | Clean environment variable templates and container orchestration | **PASS** | `backend/.env.example` created with sanitized variables; root `docker-compose.yml` configured for Mongo 7, Redis 7, and Node backend. |
| **API Discovery** | Comprehensive cataloging of all 36+ backend REST endpoints and socket events | **PASS** | Fully documented in [backend audit](project-management/audits/BACKEND_AUDIT.md) and [API/frontend mapping](docs/api/API_FRONTEND_MAPPING.md). |
| **Screen Coverage** | Complete implementation of all missing customer and administrative screens | **PASS** | All missing screens designed and built: OTP verification, password reset, order lookup, payment result, vouchers, my coupons, lookbooks, reviews, stylist AI assistant, and full Admin portal. See [frontend screen coverage](project-management/audits/FRONTEND_SCREEN_COVERAGE.md). |
| **API Integration** | Centralized API client with JWT bearer auth, auto-token refresh, error interceptor, and mock fallback | **PASS** | Implemented in `src/shared/api/client.ts` and `src/shared/api/index.ts`. Proxy configured in `vite.config.ts`. |
| **Vietnamese UI** | 100% Vietnamese localized UI with full diacritics, VND currency formatting, and `dd/MM/yyyy` dates | **PASS** | Verified across all 38+ customer and admin views. |
| **English Code** | 100% English naming for files, directories, components, functions, hooks, and types | **PASS** | Verified across entire codebase under `src/pages/` and `src/shared/`. |
| **Responsive UI** | Zero horizontal overflow across mobile, tablet, and desktop viewports | **PASS** | Verified via Playwright automated responsive suites. See [UI visual report](project-management/test-reports/frontend/UI_VISUAL_TEST_REPORT.md). |
| **ThreeUI & WebGL** | Immersive 3D shaders, WebGL error boundaries, reduced-motion fallbacks, and resource disposal | **PASS** | `LiquidFormBackground`, `ClothStudy`, `BrandOrbs`, and `WebGLErrorBoundary` functioning smoothly. |
| **E2E Testing** | Multi-viewport automated end-to-end tests passing without failures | **PASS** | **36/36 tests passed** in Playwright across Desktop, Tablet, and Mobile viewports. See [integration report](project-management/test-reports/integration/INTEGRATION_TEST_REPORT.md). |
| **Production Build** | Clean build with zero TypeScript errors and optimized chunk splitting | **PASS** | `npm run build` completes in < 4.0s with clean assets output in `dist/`. |
| **AI Sensitive Actions & OTP** | Phase 14 AI Chat guardrails, OTP challenge, PII/password isolation, and security modal | **PASS** (Email OTP: `BLOCKED_BY_BACKEND`) | Verified across Vitest (55/55 passed) and Playwright E2E suites. Full documentation in `docs/`. |

---

## 3. Technology Stack & Package Versions

### Frontend Architecture
- `react` & `react-dom`: `^19.3.1`
- `vite`: `^8.3.8`
- `typescript`: `~7.0.2` (Strict mode enabled)
- `tailwindcss`: `^3.4.19`
- `react-router-dom`: `^7.18.5`
- `zustand`: `^5.1.0`
- `motion`: `^14.14.0`
- `three`: `^0.187.0`
- `@designcodeio/threeui`: `^1.2.0` (MIT Community edition)
- `lucide-react`: `^1.73.0`
- `vitest`: `^5.1.0`
- `@testing-library/react`: `^16.3.3`
- `@playwright/test`: `^1.65.1`

### Backend Architecture (in `backend/`)
- `express`: `^4.18.2` (Node.js LTS `v24.13.0` / `>= 22.0.0`, ESM `"type": "module"`)
- `mongoose`: `^9.3.0` (MongoDB Atlas Cloud Cluster)
- `ioredis`: `^5.11.1` (Redis 7.0 container on port 6379)
- `bullmq`: `^5.78.0` (Email, Tracking, Vector sync asynchronous queues)
- `socket.io` & `@socket.io/redis-adapter`: `^4.8.3` / `^8.3.0` (Real-time cluster communication)
- `jsonwebtoken`: `^9.0.3` (Dual Access + Refresh token flow)
- `bcrypt`: `^6.0.0` (Password hashing)
- `sharp` & `multer`: `^0.34.5` / `^2.1.1` (Image processing and local/remote uploads)
- `zod`: `^4.4.3` (Request schema validation)
- `helmet`, `express-rate-limit`, `express-mongo-sanitize`: `^8.2.0`, `^8.5.2`, `^2.2.0`
- `node-cron`: `^4.2.1` (Scheduled vouchers, reservations, campaigns)
- `winston`: `^3.19.0` (Structured logging)

---

## 4. Directory Structure (Page-Based + Feature-Based Architecture)

```
d:\Project\404Studio\
├── backend/                           # Migrated Backend (Identical Logic, 0 Mismatches)
│   ├── src/
│   │   ├── config/                    # DB, Redis, BullMQ, Cloudinary, GHN, Payment configs
│   │   ├── controllers/               # Auth, Product, Order, Coupon, Review, Admin controllers
│   │   ├── middlewares/               # JWT auth, RBAC (admin/staff/user), validation, error handler
│   │   ├── models/                    # Mongoose Schemas (User, Product, Order, Coupon, Review, Cart)
│   │   ├── routes/                    # Express Router definitions (/api/v1/*)
│   │   ├── services/                  # Business logic services (payment, GHN, AI, socket, email)
│   │   ├── utils/                     # Helpers, response wrappers, crypto utilities
│   │   └── app.js / server.js         # Express server & socket.io entry points
│   ├── .env.example                   # Sanitized configuration template
│   └── package.json                   # Backend dependencies & startup scripts
├── docker-compose.yml                 # Multi-service local orchestrator (Node + Mongo + Redis)
├── frontend/                          # React/Vite storefront application
│   ├── e2e/                           # Playwright cross-device E2E scenarios
│   ├── public/
│   │   ├── assets/                    # ThreeUI runtime shaders & HTML bundles
│   │   └── brand-icon.svg             # Atelier emblem
│   ├── src/
│   ├── pages/                         # Page-Based Feature Modules (English Naming)
│   │   ├── About/                     # Di sản & Triết lý (/about)
│   │   ├── Account/                   # Trung tâm khách hàng (/account, /orders, /account/coupons)
│   │   ├── Admin/                     # Cổng quản trị Atelier (/admin, /admin/products, /admin/orders...)
│   │   ├── Auth/                      # Đăng nhập, Đăng ký, Xác thực OTP, Đặt lại mật khẩu
│   │   ├── Cart/                      # Giỏ hàng & áp dụng mã giảm giá (/cart)
│   │   ├── Checkout/                  # Quy trình thanh toán & GHN (/checkout)
│   │   ├── Collections/               # Bộ sưu tập & Lookbook chi tiết (/collections)
│   │   ├── Contact/                   # Đặt hẹn tư vấn (/contact)
│   │   ├── Home/                      # Trang chủ 14 phân đoạn & ThreeUI WebGL hero (/)
│   │   ├── Journal/                   # Tạp chí thời trang cao cấp (/journal)
│   │   ├── Lookbooks/                 # Ấn phẩm Lookbook thời trang (/lookbooks)
│   │   ├── NotFound/                  # Trang lỗi 404 void state (*)
│   │   ├── OrderLookup/               # Tra cứu đơn hàng không cần đăng nhập (/order-lookup)
│   │   ├── OrderSuccess/              # Xác nhận đặt hàng thành công (/order-success)
│   │   ├── PaymentResult/             # Kết quả thanh toán MoMo / VNPay (/payment-result)
│   │   ├── ProductDetail/             # Chi tiết sản phẩm & ThreeUI cloth study (/products/:slug)
│   │   ├── Products/                  # Danh mục & bộ lọc sản phẩm (/products)
│   │   ├── Reviews/                   # Đánh giá sản phẩm (/reviews/create)
│   │   ├── Search/                    # Tìm kiếm nâng cao (/search)
│   │   ├── Support/                   # Trung tâm hỗ trợ, Size guide, FAQ, Shipping (/support)
│   │   ├── Vouchers/                  # Kho ưu đãi & voucher độc quyền (/vouchers)
│   │   └── Wishlist/                  # Danh sách yêu thích (/wishlist)
│   ├── shared/                        # Shared Enterprise Primitives
│   │   ├── api/                       # Centralized API Client & Domain Services
│   │   │   ├── client.ts              # Axios/Fetch client with auth interceptor & mock fallback
│   │   │   └── index.ts               # Domain service modules (auth, products, orders, coupons...)
│   │   ├── components/                # Shared layout & reusable UI components
│   │   │   ├── AiAssistantModal.tsx   # Stylist AI Assistant modal
│   │   │   ├── AnnouncementBar.tsx
│   │   │   ├── CartDrawer.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── MegaMenu.tsx
│   │   │   ├── ProductCard.tsx
│   │   │   ├── QuickSearchModal.tsx
│   │   │   ├── ScrollToTop.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   ├── ToastContainer.tsx
│   │   │   └── index.ts
│   │   ├── data/                      # Client fallbacks & default inventories
│   │   ├── locales/                   # Vietnamese localization dictionary (vi/common.ts)
│   │   ├── stores/                    # Zustand stores (Cart, Wishlist, Auth, Theme, Toast, Search)
│   │   ├── threeui/                   # WebGL shaders, simulations & error boundaries
│   │   ├── types/                     # Shared TypeScript interfaces
│   │   └── utils/                     # Formatting utilities (VND, dd/MM/yyyy)
│   │   ├── test/                      # Vitest unit & integration test suites
│   │   ├── App.tsx                    # English route configuration & lazy-loading code splitting
│   │   ├── index.css                  # Tailwind custom luxury typography & themes
│   │   └── main.tsx                   # Root React 19 entry point
│   ├── package.json                   # Frontend scripts and dependencies
│   ├── package-lock.json
│   ├── vite.config.ts                 # Vite proxy and workspace env loading
│   ├── Dockerfile                     # Nginx production image
│   └── .env.example                   # Frontend-safe VITE_* template
├── docs/                              # Topic-organized technical documentation
├── project-management/                # Audits, test reports, handovers, and task records
├── compose.yaml                       # Multi-service frontend/backend orchestrator
└── .github/workflows/                 # CI/CD with frontend working directory
```

---

## 5. Route Specification & Screen Coverage

| Route | Page Component | Vietnamese Name | Features & Backend Integration |
|---|---|---|---|
| `/` | `HomePage` | Trang chủ | 14-section luxury landing with ThreeUI Hero & Cloth Study |
| `/products` | `ProductsPage` | Danh mục sản phẩm | Catalog filtering, multi-category sorting, price range, stock status |
| `/products/:slug` | `ProductDetailPage` | Chi tiết sản phẩm | Multi-image zoom gallery, color/size selection, ThreeUI cloth study |
| `/collections` | `CollectionsPage` | Bộ sưu tập | Runway archives and seasonal volume monographs |
| `/collections/:slug` | `CollectionDetailPage` | Chi tiết bộ sưu tập | Dedicated collection lookbook mosaic and piece acquisition |
| `/lookbooks` | `LookbooksPage` | Sổ tay phong cách | Editorial lookbook campaigns and downloadable seasonal portfolios |
| `/search` | `SearchPage` | Tìm kiếm | Live catalogue search with category filtering and history |
| `/wishlist` | `WishlistPage` | Danh sách yêu thích | Saved pieces with 1-click "Chuyển tất cả vào giỏ hàng" |
| `/cart` | `CartPage` | Giỏ hàng | Dedicated shopping bag ledger, coupon simulator, free shipping bar |
| `/checkout` | `CheckoutPage` | Thanh toán | Multi-step simulated checkout with GHN shipping & payment gates |
| `/order-success` | `OrderSuccessPage` | Đặt hàng thành công | Order confirmation, Cedar box guarantee, status timeline |
| `/order-lookup` | `OrderLookupPage` | Tra cứu đơn hàng | Public lookup for guest patrons via order code and phone number |
| `/payment-result` | `PaymentResultPage` | Kết quả thanh toán | MoMo / VNPay IPN gateway callback verification screen |
| `/vouchers` | `VouchersPage` | Kho ưu đãi & Đặc quyền | Public coupon catalog with 1-click code copying |
| `/reviews/create` | `CreateReviewPage` | Gửi đánh giá sản phẩm | Star rating, photo upload preview, verified buyer badge |
| `/about` | `AboutPage` | Di sản & Triết lý | Atelier history, mathematical bias cut manifesto, European mills |
| `/journal` | `JournalPage` | Tạp chí thời trang | Editorial magazine, runway monographs, and artisan essays |
| `/journal/:slug` | `JournalDetailPage` | Bài viết tạp chí | In-depth essay study with pull quotes and drop caps |
| `/contact` | `ContactPage` | Đặt hẹn salon tư vấn | Private appointment booking for Paris Place Vendôme & Tokyo Ginza |
| `/support` | `SupportPage` | Hỗ trợ & Dịch vụ | Unified FAQ, Size Guide, Shipping & Returns policy center |
| `/login` | `LoginPage` | Đăng nhập | Patron sign-in with prefilled demo credentials & JWT tokens |
| `/register` | `RegisterPage` | Tạo tài khoản | New patron portfolio creation with validation |
| `/verify-otp` | `VerifyOtpPage` | Xác thực OTP | 6-digit OTP verification for account activation and 2FA |
| `/reset-password` | `ResetPasswordPage` | Đặt lại mật khẩu | Secure tokenized password recovery workflow |
| `/account` | `AccountDashboardPage` | Tổng quan tài khoản | Patron tier status (Haute Circle), recent orders, quick actions |
| `/orders` | `AccountOrdersPage` | Lịch sử đơn hàng | Historical order ledger with tracking numbers |
| `/orders/:id` | `AccountOrderDetailPage` | Chi tiết đơn hàng | Detailed acquisition receipt with print layout |
| `/my-coupons` | `MyCouponsPage` | Ưu đãi của tôi | Customer coupon wallet with expiration counters and usage tracking |
| `/account/addresses` | `AccountAddressesPage` | Sổ địa chỉ | Saved residence manager with primary toggles |
| `/account/settings` | `AccountSettingsPage` | Cài đặt tài khoản | Patron identity preferences and runway invitation settings |
| `/admin` | `AdminDashboardPage` | Bảng điều khiển quản trị | Revenue charts, order metrics, customer acquisition stats |
| `/admin/products` | `AdminProductsPage` | Quản lý sản phẩm | Product CRUD table, inventory status, price adjustments |
| `/admin/categories` | `AdminCategoriesPage` | Quản lý danh mục | Category hierarchy and collection sorting |
| `/admin/orders` | `AdminOrdersPage` | Quản lý đơn hàng | Order status lifecycle management (Chờ xử lý, Đang giao, Hoàn tất) |
| `/admin/customers` | `AdminCustomersPage` | Quản lý khách hàng | Patron VIP tier management and order history inspection |
| `/admin/coupons` | `AdminCouponsPage` | Quản lý mã ưu đãi | Coupon creation, discount percentages, usage caps |
| `/admin/chat` | `AdminChatPage` | Hỗ trợ trực tuyến | Real-time patron conversation manager powered by Socket.io |
| `/admin/settings` | `AdminSettingsPage` | Cấu hình hệ thống | Store identity, shipping fees, tax rates, payment gateway modes |
| `*` | `NotFoundPage` | 404 Không tìm thấy | Luxury editorial empty void state with return-to-atelier CTA |

---

## 6. Testing & Verification Evidence

### Vitest Unit & Integration Tests
- **Command**: `npm run test`
- **Result**: **18 / 18 Passed (100%)** across 6 test suites
  1. `src/test/products.test.ts`: Catalog data integrity, VND pricing, color variants, SKU generation.
  2. `src/test/wishlistStore.test.ts`: Wishlist add, remove, toggle, and persistence.
  3. `src/test/cartStore.test.ts`: Add item, quantity update, duplicate merging, removal, VND threshold calculations, coupon codes `VANGUARD15` / `LUXE20`.
  4. `src/test/components.test.tsx`: Product card Vietnamese price rendering and add-to-bag actions.
  5. `src/test/apiClient.test.ts`: API client bearer token injection, mock fallback mode, and localStorage sync.
  6. `src/test/adminAndFeatures.test.ts`: Admin dashboard route rendering and vouchers catalog rendering.

### Playwright Cross-Device End-to-End Tests
- **Command**: `npx playwright test`
- **Result**: **36 / 36 Passed (100%)** across 3 viewports:
  - **Desktop Viewport** (`1440x900`): 12 scenarios passed.
  - **Tablet Viewport** (`768x1024`): 12 scenarios passed.
  - **Mobile Viewport** (`390x844`): 12 scenarios passed.
- **Coverage**:
  1. Homepage editorial sections, announcement bar, navigation, and ThreeUI hero.
  2. Dark noir / light ivory theme switching with persistence.
  3. Products catalog navigation, category filters, and price sorting.
  4. Product detail viewing, swatch switching, and bag drawer trigger.
  5. Wishlist toggle, heart icon indicator, and dedicated wishlist page synchronization.
  6. Quick search modal with keyword search.
  7. Full checkout simulation leading to `/order-success`.
  8. 404 Not Found route handling.
  9. Vouchers catalog viewing and promo code clipboard copying.
  10. Public order status tracking on `/order-lookup`.
  11. Stylist AI Assistant modal trigger and interactive consultation.
  12. Admin portal dashboard metrics and product inventory table navigation.

---

## 7. Execution & Development Guide

### Frontend Commands (`frontend/`)
```bash
cd frontend

# Install frontend dependencies
npm install

# Start frontend development server (runs on http://localhost:5173 with proxy to backend :5000)
npm run dev

# Run Vitest test suite
npm run test

# Run Playwright cross-device E2E tests
npm run test:e2e

# Build production bundle
npm run build

# Preview production bundle locally
npm run preview
```

### Backend & Orchestration Commands (Workspace Root)
```bash
# Install backend dependencies
npm --prefix backend install

# Start backend in development mode (with nodemon)
npm --prefix backend run dev

# Start local infrastructure with Docker Compose (MongoDB 7 + Redis 7 + Backend)
docker compose up -d

# Seed database with sample fashion collections
npm --prefix backend run seed:demo
```

---

## 8. Credentials & Special Promo Codes

### Patron Demo Credentials
- **Customer Email**: `charlotte.vane@atelierverite.com`
- **Customer Password**: `HauteCouture2026!`
- **Role**: Patron (Haute Circle Tier)

### Admin Demo Credentials
- **Admin Email**: `director@atelierverite.com`
- **Admin Password**: `AtelierAdmin2026!`
- **Role**: Creative Director / Admin

### Valid Coupon Codes
- `VANGUARD15`: 15% discount for Atelier Welcome Courtesy (No minimum).
- `LUXE20`: 20% discount for Haute Circle Exclusive (Min order 50.000.000 ₫).
- `WELCOME10`: 10% discount for First Order Privilège.

---

## 9. DevOps, Docker Architecture & GitHub Actions CI/CD (Phase 12)

### 9.1. Docker Container Orchestration
- **Frontend Container**: Multi-stage Nginx 1.27 Alpine serving compiled SPA bundle with security headers, gzip compression, asset cache-control, and `/healthz` liveness probe.
- **Backend Container**: Node 22 Alpine + `dumb-init` (PID 1 signal forwarding) running under non-root user `node:node` with `/api/health/liveness` healthcheck.
- **Background Worker**: Dedicated container running BullMQ workers for email delivery, vector synchronization, and queue processing.
- **Compose Stacks**:
  - `compose.yaml`: Canonical stack with 5 services on isolated bridge network `atelier-network`.
  - `compose.dev.yaml`: Hot reload overrides with bind mounts for local rapid development.
  - `compose.prod.yaml`: Hardened production overrides with CPU/RAM limits, restart policies, and logging rotation.

### 9.2. Automated Quality Gates & GitHub Actions
- **Continuous Integration Pipeline (`.github/workflows/ci.yml`)**:
  - `Security & Secret Scan`: Zero secrets found, Gitleaks scan, npm dependency vulnerability audit.
  - `Frontend Quality Gates`: Oxlint static checks, TypeScript strict mode, Vitest unit suite (24/24 tests), Vite production build.
  - `Backend Quality Gates`: ESLint static checks and dependency audit.
  - `Docker Build & Compose Verification`: Buildx image builds and syntax validation across all Compose stacks.
  - `Playwright E2E & Legal Privacy Suite`: Full headless verification of customer journeys and prior consent tracking blocking.
- **Remote Verification**: 100% Green on GitHub Actions (Run ID `43916740884` completed with `success`).

---

## 10. Intelligent Home Recommendation & Behavioral Personalization Engine

### 10.1. Architecture & Design Principles
- **Editorial Curation Tabs**: The static catalog displays on the homepage were elevated into a dynamic 4-tab curation matrix:
  1. `for-you` (Dành Riêng Cho Bạn): Adaptive hybrid ranking combining client-side behavioral signals and backend recommendations.
  2. `trending` (Xu Hướng Mới): Popularity-driven curated silhouettes with aggregate velocity.
  3. `new-arrivals` (Tuyển Tập Mới): Chronologically sorted runway pieces and latest releases.
  4. `best-sellers` (Kiệt Tác Bán Chạy): Top customer-demand iconic pieces.
- **Strict Privacy Compliance (Vietnam Law 91/2025/QH15 & Decree 356/2025/NĐ-CP)**:
  - Non-essential tracking and behavioral profiling are strictly blocked before patron consent.
  - When personalization is denied, the engine automatically degrades to non-personalized editorial popular curations (`mode: "popular"`).
  - Storage keys (`atelier_recent_views`, `atelier_recent_searches`, `atelier_category_counts`, `atelier_product_click_counts`) are completely purged on consent withdrawal or account sign-out.
  - An elegant unconsented privacy notice with a 1-click modal opener is rendered in the UI without degrading layout.
- **Hybrid Signal Weighting**:
  - Recent searches & views: **35%**
  - Category interaction frequency: **25%**
  - Global popularity metrics: **20%**
  - Product recency: **10%**
  - Merchandising boost & In-stock guarantee: **10%** (+100 score priority for available inventory)
- **Performance & Resiliency**:
  - In-memory 3-minute TTL cache keyed by active tab and consent state.
  - Automatic `AbortController` cancellation on tab switches to prevent race conditions.
  - `adaptBackendProduct` adapter ensuring resilience against raw/sparse MongoDB responses.
  - Zero modifications to backend business logic in `backend/` or source repository.

### 10.2. Documentation & Audit Deliverables
- [Home recommendation audit](project-management/audits/HOME_RECOMMENDATION_AUDIT.md): Comprehensive audit of backend routes, event taxonomy, guest identification, and consent constraints.
- [Home recommendation design](docs/architecture/HOME_RECOMMENDATION_DESIGN.md): Detailed architectural design, signal scoring mathematics, and UI/UX states.
- [Recommendation API mapping](docs/api/RECOMMENDATION_API_MAPPING.md): Exact request/response payloads, headers, query parameters, and fallback mappings.
- [Home recommendation test report](project-management/test-reports/frontend/HOME_RECOMMENDATION_TEST_REPORT.md): Complete test matrix, Vitest unit verification (55/55 passed), and Playwright cross-device E2E validation.

---

## 11. AI Sensitive Account Actions, OTP & Privacy Protection (Phase 14)

### 11.1. Architecture Overview & Core Security Principles
Phase 14 equips the Atelier Vérité AI Shopping Assistant with intelligent capability to assist patrons with sensitive account mutations while strictly enforcing zero-trust identity verification:
1. **Never mutate sensitive account state verbally**: AI Agent cannot modify credentials or profile data purely based on chat dialogue.
2. **Never expose credentials or secrets**: Passwords (cleartext or hash), active OTP codes, JWT tokens, session cookies, and API keys are strictly forbidden from AI context and chat logs.
3. **Never expose cross-user PII**: Complete tenant isolation. An attacker cannot query email, phone, address, orders, or passwords of other patrons.
4. **Never bypass OTP / RBAC**: AI has no authority to validate OTPs or grant administrative escalation.
5. **Zero backend tampering**: Backend source at `D:\Project\REACT-WebFashion` was kept 100% untouched.

### 11.2. Zero-Knowledge AI Isolation Boundary
- **Sensitive Action Classifier (`src/shared/utils/aiSecurityGuard.ts`)**:
  - Classifies user intents into 4 strict tiers: `READ_ONLY`, `NORMAL_ACCOUNT_ACTION`, `SENSITIVE_ACCOUNT_ACTION`, and `FORBIDDEN_ACTION`.
  - Blocks prompt injection attempts, persona hijacking, and verbal bypasses.
- **Dedicated Independent Verification Modal (`src/shared/components/security/SecurityVerificationModal.tsx`)**:
  - Operates on high-priority stacking layer `z-[70]`, entirely separate from AI Assistant Modal (`z-50`).
  - Contains hardened `OtpInput` with 6 auto-advancing fields, backspace navigation, and clipboard paste sanitization.
  - Implements 60-second resend cooldown timer and 300-second session TTL countdown (`VerificationExpiredState`).
  - Limits invalid attempts to 5 before triggering a 60-second security lockout.

### 11.3. Backend Integration & Capability Matrix
- **Native Phone OTP**: Fully integrated with `/api/v1/user/phone/send-otp` and `/api/v1/user/phone/verify` (`sendPhoneUpdateOtp`, `verifyAndUpdatePhone`).
- **Hardened Password Change**: Direct frontend-to-backend submission via `/api/v1/user/updatePassword` with masked inputs and strong password validation (`ChangePasswordForm`).
- **Blocked Backend Gaps**:
  - Authenticated Email Change lacks native OTP in backend (`/user/updateProfile` accepts raw email). Marked transparently as `BLOCKED_BY_BACKEND`.
  - Authenticated Password Change lacks native OTP challenge. Documented with comprehensive RFC specifications.

### 11.4. Phase 14 Audit & Handover Deliverables
- [AI_SENSITIVE_ACTION_AUDIT.md](file:///d:/Project/404Studio/docs/AI_SENSITIVE_ACTION_AUDIT.md): Comprehensive security audit and 4-tier action classification.
- [OTP_SECURITY_FLOW.md](file:///d:/Project/404Studio/docs/OTP_SECURITY_FLOW.md): Cryptographic OTP lifecycle, sequence flows, and UX defense.
- [ACCOUNT_CHANGE_SECURITY_TESTS.md](file:///d:/Project/404Studio/docs/ACCOUNT_CHANGE_SECURITY_TESTS.md): Test matrix covering Vitest unit tests and Playwright E2E suites.
- [CROSS_USER_PRIVACY_TESTS.md](file:///d:/Project/404Studio/docs/CROSS_USER_PRIVACY_TESTS.md): Cross-user privacy isolation and prompt injection defense report.
- [BACKEND_SECURITY_API_GAPS.md](file:///d:/Project/404Studio/docs/BACKEND_SECURITY_API_GAPS.md): Formal analysis of `BLOCKED_BY_BACKEND` gaps with RFC designs.

---

## 12. Backend Setup, Dependency Repair & Persistent Task Management (TASK-001)

### 12.1. Backend Execution & Service Health Status
- **Backend Framework**: Express.js `4.18.2` running on Node.js `v24.13.0` (ESM mode).
- **Installed Dependencies**: Installed cleanly with immutable `npm ci` (652 packages, 0 install errors).
- **Adjusted Dependencies & Test Fixtures**: Tinh chỉnh test fixture sub-process mock secret trong `requireSecret.test.js` (`env[secretName] = ""` thay vì `delete` để không bị `dotenv` re-load đè từ file `.env` root). Không sửa đổi bất kỳ business logic nào của backend.
- **Database Connectivity**: MongoDB Atlas kết nối ổn định (`readyState: 1`, 34 collections truy vấn thành công).
- **Redis Connectivity**: Local Redis container (`redis_local:6379`) trả lời `PONG` ổn định, hỗ trợ session rate limiting, Socket.IO adapter, và BullMQ queues.
- **API Health Status**: Cả 3 probe `/api/health`, `/api/health/liveness`, `/api/health/readiness` đều trả về HTTP 200 OK.
- **AI Vector Service**: `/api/ai/health` trả về HTTP 200 OK, engine `mongo_cosine`, 33 vectors (28 active).
- **Product Catalog API**: `/api/products` và `/api/categories` hoạt động với dữ liệu thực từ MongoDB Atlas.
- **Docker Compose Status**: Xác minh thành công cú pháp và cấu hình cho `compose.yaml`, `compose.dev.yaml`, `compose.prod.yaml`.
- **CI/CD Status**: GitHub Actions workflows `.github/workflows/ci.yml` và `release.yml` được đồng bộ chính xác với cấu trúc monorepo (`frontend/`, `backend/`).
- **Jest Test Suite**: **24/24 test suites passed (100%)**, **215/215 tests passed**, thời gian chạy 47.6s.

### 12.2. Persistent Task Management Hierarchy
Toàn bộ hệ thống quản lý task và kết quả kiểm thử được lưu trữ cố định trong repository tại `project-management/`:
- `project-management/tasks/pending/`: Hàng đợi task cho các sprint tiếp theo.
- `project-management/tasks/in-progress/`: Các task đang được thực hiện.
- `project-management/tasks/completed/`: Các task đã hoàn thành với đầy đủ bằng chứng kiểm thử (`TASK-001-backend-setup.md`, `TASK-002-frontend-restructure.md`, `TASK-DOCS-ORGANIZATION.md`).
- `project-management/tasks/blocked/`: Các task bị chặn kèm lý do và điều kiện tiếp tục.
- `project-management/test-reports/backend/`: Báo cáo kiểm thử backend (`BACKEND_SETUP_VERIFICATION.md`).
- `project-management/audits/`: Báo cáo audit mã nguồn (`BACKEND_SOURCE_AUDIT.md`, `BACKEND_AUDIT.md`, `BACKEND_MIGRATION_REPORT.md`).
- `project-management/TASK_INDEX.md`: Bảng mục lục task trung tâm.
- Thư mục `project-management/` được Git theo dõi (đã xác minh bằng `git check-ignore -v`).

### 12.3. Key Deliverables & Evidence Links
- [Backend Source Audit](project-management/audits/BACKEND_SOURCE_AUDIT.md): Báo cáo đối chiếu và phân tích kiến trúc backend.
- [Backend Setup Verification Report](project-management/test-reports/backend/BACKEND_SETUP_VERIFICATION.md): Báo cáo 15 bước kiểm thử có bằng chứng thực tế.
- [Task TASK-001 Specification](project-management/tasks/completed/TASK-001-backend-setup.md): Hồ sơ chi tiết task TASK-001.
- [Sanitized Environment Template](backend/.env.example): Mẫu biến môi trường đầy đủ 15 nhóm.
- [Task Master Index](project-management/TASK_INDEX.md): Bảng trạng thái task tổng thể.

---

## 13. Product Management & Multi-Variant Inventory (TASK-PRODUCT-VARIANTS)

### 13.1. Overview & Business Objectives
- **Chuẩn hóa nhãn giao diện ("Quản lý tác phẩm" -> "Quản lý sản phẩm")**: Đổi toàn bộ nhãn hiển thị tại thanh điều hướng Admin (`/admin`), thanh bên, trang tổng quan và toàn bộ các trang mua sắm khách hàng (`/cart`, `/order-lookup`, `/checkout`, `/reviews`, footer).
- **Hệ thống Quản lý Đa Biến Thể (Multi-Variant)**: Hỗ trợ cấu hình Màu sắc (`color`), Kích cỡ (`size`), Tồn kho (`stock`), Ảnh biến thể (`image_url`), SKU tự động. Ngăn chặn triệt để tổ hợp Màu + Size trùng lặp.
- **Tính toán Tồn kho Tự động**: Tự động tổng hợp `TotalStock = SUM(VariantStock)` realtime trên UI, khóa trường tổng tồn kho sang chế độ `read-only` khi có biến thể, lọc bỏ số âm, số thập phân, NaN, Infinity.
- **100% Backend API Thật (Zero Mock API)**: Kết nối trực tiếp `/api/products`, `/api/products/detail/:id`, `/api/categories`, đồng bộ logic tính tồn kho với `createProduct.command.js` và `updateProduct.command.js`.
- **Ghi nhận Gaps Backend**: Lập tài liệu `docs/backend/BACKEND_PRODUCT_VARIANT_GAPS.md` ghi nhận các khuyết thiếu schema `product_variants` (chưa có cột `price` và `sku` riêng).

### 13.2. Key Deliverables & Evidence Links
- [Task Completion Record](project-management/tasks/completed/TASK-PRODUCT-VARIANTS.md): Hồ sơ hoàn thành task TASK-PRODUCT-VARIANTS.
- [UI & Playwright E2E Report](project-management/test-reports/frontend/PRODUCT_VARIANTS_UI_TEST.md): Báo cáo kiểm thử giao diện & 3 kịch bản Playwright E2E đạt 100% PASS.
- [Backend Contract & Integration Report](project-management/test-reports/integration/PRODUCT_VARIANTS_API_TEST.md): Báo cáo kiểm thử hợp đồng Backend và MongoDB schema.
- [Backend Variant Gaps Specification](docs/backend/BACKEND_PRODUCT_VARIANT_GAPS.md): Phân tích chi tiết các giới hạn schema Mongoose và khuyến nghị mở rộng.

---

## 14. Admin Visual Page Builder & Dynamic Content Management (TASK-VISUAL-PAGE-BUILDER)

### 14.1. Architecture & Capabilities Overview
- **Enterprise No-Code Visual Page Builder**:
  - Drag-and-drop / click-to-insert AST block library with 28+ modular blocks across 6 categories (Typography, Media, Layout, Fashion, Legal, Marketing).
  - Page Structure Panel with hierarchical section/block visualization, reorder handles, clone, and delete operations.
  - Multi-device Live Canvas with responsive preview switcher (Desktop 100%, Tablet 768px, Mobile 390px) and Light/Dark luxury preview modes.
  - Contextual Inspector Panel supporting Content editing, Typography formatting, Color customization with real-time WCAG AA contrast ratio validation, Spacing controls, and viewport visibility toggles.
  - Undo / Redo action history stack, Draft persistence, and Instant Publication.
- **Pre-Configured Page Templates**:
  - `lookbook-runway`: Capsule Runway Showcase featuring hero banners, split lookbook galleries, and runway details.
  - `about-us-heritage`: Brand heritage, atelier craftsmanship story, signature quotes, and design pillars.
  - `legal-policy`: Statutory legal policy template pre-configured with mandatory disclosures.
  - `campaign-landing`: Promotional spotlight with countdown tickers, product highlights, and conversion CTAs.
- **Legal Compliance Engine (Vietnam Law 91/2025/QH15 & Decree 356/2025/NĐ-CP)**:
  - Guardrail prevents publishing statutory policy pages (`privacy`, `terms`, `cookie`, `return`, `shipping`, `payment`) if mandatory disclosures (User Rights, Data Controller, Cookie Table, Consent Trigger, Deletion Request, Effective Date, Policy Version) are absent or marked hidden on mobile/desktop viewports.
  - Remediation modal highlights missing legal clauses with a 1-click "Bổ Sung Khối Bắt Buộc" repair tool.
- **Security & AST Sandboxing**:
  - Pure React `BlockRenderer` mapping AST nodes without arbitrary script execution.
  - Strict protocol filtering rejecting `javascript:`, `data:`, `file:`, `blob:`, and protocol-relative phishing URLs.
  - Strict video embed domain allowlisting restricted to verified providers (YouTube, Vimeo).
- **Storefront Dynamic Integration**:
  - Storefront pages (`AboutPage`, `PrivacyPolicyPage`, `TermsOfServicePage`, `CookiePolicyPage`, `ReturnsRefundsPage`) dynamically render published CMS sections with automatic statutory fallback.

### 14.2. Verification & Deliverables
- [CMS Architecture Audit](docs/api/CMS_PAGE_BUILDER_AUDIT.md): Technical mapping of backend `/pages` and `/page-sections` endpoints.
- [Task Completion Record](project-management/tasks/completed/TASK-VISUAL-PAGE-BUILDER.md): Completed task dossier with 100% acceptance criteria satisfied.
- [UI & Playwright E2E Report](project-management/test-reports/frontend/PAGE_BUILDER_UI_TEST.md): 21/21 E2E tests passing across Desktop, Tablet, and Mobile viewports.
- [Backend Contract & Integration Report](project-management/test-reports/integration/PAGE_BUILDER_API_TEST.md): Zero Mock API verification against real endpoints.
- [Security & Legal Compliance Report](project-management/test-reports/security/PAGE_BUILDER_SECURITY_TEST.md): XSS, protocol filtering, and Decree 356/2025 compliance audit.

---

## 15. Autonomous Full Website QA, UI Video Recording & Business Flow Testing (TASK-FULL-WEBSITE-VIDEO-QA)

### 15.1. Overview & Automation Pipeline
- **Autonomous E2E Architecture**:
  - Implemented an automated Playwright test runner and headless video pipeline (`frontend/tests/run-full-website-qa.ts`) driving real browser sessions against live Express/MongoDB services on port 5000 and Vite storefront on port 5180.
  - Zero mock APIs, zero synthetic responses at runtime: all routes load genuine database entities (catalog, orders, vouchers, policies, CMS blocks, campaigns).
- **Video Processing & FFmpeg Transcoding Pipeline**:
  - Captured native browser WebM streams and converted to universally playable MP4 (`libx264`, `yuv420p`, `-crf 23`, `-preset medium`, `-movflags +faststart`).
  - Integrated automated FFprobe stream analysis (`video-validator.ts`) verifying format, codec, duration, and frame integrity prior to purging temporary WebM captures.
  - Atomic JSON manifests (`UI_MANIFEST.json` and `FUNCTION_MANIFEST.json`) recorded in real-time with MD5 file checksums and metadata.
- **Route Inventory & Exploration Coverage**:
  - 100% discovery across **53 distinct routes**: 25 Public storefront routes, 6 Patron account routes, and 22 Admin back-office routes.
  - Humanized smooth scrolling protocol (200–350px steps, 1.5s initial/terminal rests, 1.2s section pauses), featuring specialized multi-container scrolling for fixed-viewport single-screen layouts (`/admin/chats`).
- **Comprehensive Functional Matrix**:
  - Recorded **20 functional method executions** across **12 core business flows** (Product Search, Cart Operations, Order Checkout, Voucher Redemption, Patron Account, Admin Products, Admin Categories, Admin Orders, Admin Real-Time Chat, Admin Page Builder, Admin Campaigns, Admin Policies & Tracking).
  - Both primary (`cach01`) and alternative (`cach02`, `cach03`) interaction flows validated end-to-end.
- **Privacy & Security Verification**:
  - Zero video binaries committed to version control (`/videos/` enforced in root `.gitignore`, `.dockerignore`, and `frontend/.dockerignore`).
  - Automated masking of sensitive fields (`password`, `confirmPassword`, credit card inputs).
  - Sanitized audit logs complying with Decree 13/2023/NĐ-CP and Decree 356/2025/NĐ-CP.

### 15.2. Key Deliverables & Test Documentation Links
- [Test Infrastructure & Discovery Audit](docs/audits/FULL_WEBSITE_VIDEO_QA_AUDIT.md): Initial environment, port, and FFmpeg audit.
- [Complete Route Inventory](project-management/test-reports/e2e/ROUTE_INVENTORY.md): Catalog of 53 active routes with dynamic slug resolutions.
- [Video Coverage Master Report](project-management/test-reports/e2e/VIDEO_COVERAGE_REPORT.md): Executive summary of 73 total recorded MP4 videos.
- [UI Video Test Report](project-management/test-reports/e2e/UI_VIDEO_TEST_REPORT.md): Detailed per-route UI recording metrics and outcomes.
- [Functional Video Test Report](project-management/test-reports/e2e/FUNCTION_VIDEO_TEST_REPORT.md): Verification report for 20 business flow execution videos.
- [Video Privacy & Security Audit](project-management/test-reports/security/VIDEO_PRIVACY_AUDIT.md): Security analysis of test artifacts and data masking.
- [Task Completion Record](project-management/tasks/completed/TASK-FULL-WEBSITE-VIDEO-QA.md): Complete task specification and verification ledger.

---

## 16. Unified Fullstack Dev Command & Root Orchestration (TASK-ROOT-DEV-COMMAND)

### 16.1. Architecture & Capabilities Overview
- **Single Root Command Development**:
  - Developers can boot the entire platform from the project root using `npm run dev`.
  - Concurrently boots Backend (Express, MongoDB, Redis, Socket.IO, BullMQ on port 5000) and Frontend (React 19, ThreeUI, Vite on port 5173).
  - Uses `concurrently` with distinct, color-coded prefixes: `[BACKEND]` (blue) and `[FRONTEND]` (green).
  - Enforces `--kill-others-on-fail` to immediately terminate all services if either service fails or crashes during startup.
- **Process Lifecycle & Signal Management**:
  - Handles `SIGINT` (Ctrl+C) and `SIGTERM` cleanly across Windows PowerShell and Unix terminals.
  - Automatically invokes graceful shutdown hooks in `backend/src/server.js`, closing HTTP connections, disconnecting from MongoDB Atlas and Redis, and terminating Vite HMR server without leaving orphan `node.exe` processes.
- **Proxy, Ports & Authentication Preservation**:
  - Backend runs on `http://localhost:5000`.
  - Frontend runs on `http://localhost:5173`.
  - Vite dev server reverse-proxies `/api` and `/uploads` to port 5000, preserving HTTP cookies (`credentials: 'include'`), Authorization Bearer tokens, and token refresh mechanisms.
- **Monorepo Scripts Portfolio**:
  - `npm run dev`: Fullstack development.
  - `npm run dev:frontend`: Storefront & Admin Portal development only.
  - `npm run dev:backend`: REST API & Worker development only.
  - `npm run build`: Production bundle compilation (`npm run build:frontend`).
  - `npm run test`: Full test suite (Frontend Vitest + Backend Jest).
  - `npm run test:frontend`: Frontend unit & component tests.
  - `npm run test:backend`: Backend unit & integration tests.
  - `npm run test:e2e`: Playwright cross-device end-to-end tests.
  - `npm run lint`: Frontend Oxlint + Backend ESLint checks.

### 16.2. Deliverables & Documentation Links
- [Root Package Configuration](package.json): Root monorepo configuration with `concurrently`.
- [Root Environment Template](.env.example): Monorepo environment configuration template.
- [Task Completion Record](project-management/tasks/completed/TASK-ROOT-DEV-COMMAND.md): Complete task record and verification evidence.







