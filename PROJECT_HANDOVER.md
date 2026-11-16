# PROJECT HANDOVER: ATELIER VÉRITÉ (HIGH FASHION E-COMMERCE WITH THREEUI & BACKEND INTEGRATION)

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

