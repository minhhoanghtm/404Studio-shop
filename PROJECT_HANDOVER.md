# PROJECT HANDOVER: ATELIER VÉRITÉ (HIGH FASHION E-COMMERCE WITH THREEUI & BACKEND INTEGRATION)

> **AI/payment re-audit update — 17/11/2026:** Frontend mock AI fallback replies and local fake order confirmation were removed from the audited paths. The UI now calls the copied backend's actual AI/payment route contracts, preserves confirmation gates, and blocks checkout for local demo-only product IDs. Live AI, sandbox payment, IPN and E2E verification remain **BLOCKED_BY_BACKEND_ENVIRONMENT** because no safe configured backend/data/provider sandbox was available. See `docs/AI_SYSTEM_AUDIT.md` and related AI verification reports.

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
| **Backend Checksum** | 100% identical SHA-256 byte-for-byte checksums for all source code files | **PASS** | Verified across all 496 files with 0 hash mismatches. See [BACKEND_MIGRATION_REPORT.md](file:///d:/Project/404Studio/BACKEND_MIGRATION_REPORT.md). |
| **Backend Unchanged** | Zero changes to backend business logic, controllers, routes, models, schemas, or middlewares | **PASS** | Backend logic preserved with zero modifications. |
| **Backend Startup Config** | Clean environment variable templates and container orchestration | **PASS** | `backend/.env.example` created with sanitized variables; root `docker-compose.yml` configured for Mongo 7, Redis 7, and Node backend. |
| **API Discovery** | Comprehensive cataloging of all 36+ backend REST endpoints and socket events | **PASS** | Fully documented in [BACKEND_AUDIT.md](file:///d:/Project/404Studio/BACKEND_AUDIT.md) and [API_FRONTEND_MAPPING.md](file:///d:/Project/404Studio/API_FRONTEND_MAPPING.md). |
| **Screen Coverage** | Complete implementation of all missing customer and administrative screens | **PASS** | All missing screens designed and built: OTP verification, password reset, order lookup, payment result, vouchers, my coupons, lookbooks, reviews, stylist AI assistant, and full Admin portal. See [FRONTEND_SCREEN_COVERAGE.md](file:///d:/Project/404Studio/FRONTEND_SCREEN_COVERAGE.md). |
| **API Integration** | Centralized API client with JWT bearer auth, auto-token refresh, error interceptor, and mock fallback | **PASS** | Implemented in `src/shared/api/client.ts` and `src/shared/api/index.ts`. Proxy configured in `vite.config.ts`. |
| **Vietnamese UI** | 100% Vietnamese localized UI with full diacritics, VND currency formatting, and `dd/MM/yyyy` dates | **PASS** | Verified across all 38+ customer and admin views. |
| **English Code** | 100% English naming for files, directories, components, functions, hooks, and types | **PASS** | Verified across entire codebase under `src/pages/` and `src/shared/`. |
| **Responsive UI** | Zero horizontal overflow across mobile, tablet, and desktop viewports | **PASS** | Verified via Playwright automated responsive suites. See [UI_VISUAL_TEST_REPORT.md](file:///d:/Project/404Studio/UI_VISUAL_TEST_REPORT.md). |
| **ThreeUI & WebGL** | Immersive 3D shaders, WebGL error boundaries, reduced-motion fallbacks, and resource disposal | **PASS** | `LiquidFormBackground`, `ClothStudy`, `BrandOrbs`, and `WebGLErrorBoundary` functioning smoothly. |
| **E2E Testing** | Multi-viewport automated end-to-end tests passing without failures | **PASS** | **36/36 tests passed** in Playwright across Desktop, Tablet, and Mobile viewports. See [INTEGRATION_TEST_REPORT.md](file:///d:/Project/404Studio/INTEGRATION_TEST_REPORT.md). |
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
- `express`: `^4.21.0`
- `mongoose`: `^8.7.0` (MongoDB 7.0+)
- `redis` / `ioredis`: `^5.4.1` (Redis 7.0+)
- `bullmq`: `^5.14.0` (Background jobs & queue workers)
- `socket.io`: `^4.8.0` (Real-time admin/customer communication)
- `jsonwebtoken`: `^9.0.2` (Dual Access + Refresh token flow)
- `bcryptjs`: `^2.4.3`
- `multer` & `cloudinary`: Media and asset management
- `node-cron`: Scheduled maintenance tasks

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
├── e2e/
│   └── storefront.spec.ts             # 36 cross-device Playwright E2E scenarios
├── public/
│   ├── assets/                        # ThreeUI runtime shaders & HTML bundles
│   └── brand-icon.svg                 # Atelier emblem
├── src/
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
│   ├── test/                          # Vitest unit & integration test suites
│   ├── App.tsx                        # English route configuration & lazy-loading code splitting
│   ├── index.css                      # Tailwind custom luxury typography & themes
│   └── main.tsx                       # Root React 19 entry point
├── BACKEND_AUDIT.md                   # Full backend audit document
├── BACKEND_MIGRATION_REPORT.md        # Migration report & SHA-256 verification log
├── BACKEND_ISSUES.md                  # Backend issues & environment considerations
├── API_FRONTEND_MAPPING.md            # Endpoint-to-screen matrix (36+ endpoints)
├── FRONTEND_SCREEN_COVERAGE.md        # Screen coverage audit & verification
├── INTEGRATION_TEST_REPORT.md         # Comprehensive test report (Vitest + Playwright)
├── UI_VISUAL_TEST_REPORT.md           # Visual & responsive test report
├── package.json                       # Scripts for both frontend & backend orchestration
├── playwright.config.ts               # Playwright cross-device test configuration
├── tailwind.config.js                 # Luxury color palette & typography tokens
├── tsconfig.json                      # Strict mode TypeScript configuration
└── vite.config.ts                     # Vite 8 config with proxy forwarding to :5000
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

### Frontend Commands (Workspace Root)
```bash
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
npm run backend:install

# Start backend in development mode (with nodemon)
npm run backend:dev

# Start local infrastructure with Docker Compose (MongoDB 7 + Redis 7 + Backend)
docker compose up -d

# Seed database with sample fashion collections
npm run backend:seed
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
- [HOME_RECOMMENDATION_AUDIT.md](file:///d:/Project/404Studio/HOME_RECOMMENDATION_AUDIT.md): Comprehensive audit of backend routes, event taxonomy, guest identification, and consent constraints.
- [HOME_RECOMMENDATION_DESIGN.md](file:///d:/Project/404Studio/HOME_RECOMMENDATION_DESIGN.md): Detailed architectural design, signal scoring mathematics, and UI/UX states.
- [RECOMMENDATION_API_MAPPING.md](file:///d:/Project/404Studio/RECOMMENDATION_API_MAPPING.md): Exact request/response payloads, headers, query parameters, and fallback mappings.
- [HOME_RECOMMENDATION_TEST_REPORT.md](file:///d:/Project/404Studio/HOME_RECOMMENDATION_TEST_REPORT.md): Complete test matrix, Vitest unit verification (55/55 passed), and Playwright cross-device E2E validation.

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



