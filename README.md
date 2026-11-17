# ATELIER VÉRITÉ — Contemporary Haute Couture & Architectural Ready-to-Wear

> **An independent, greenfield luxury fashion e-commerce web platform built with React 19, TypeScript, Vite, Tailwind CSS, Motion, Zustand, and ThreeUI WebGL components.**
> **Architected with a Page-Based feature layout, English source code, and a 100% Vietnamese localized user interface.**

---

## ✦ Brand Concept & Visual Identity

**Atelier Vérité** (*Paris • Milan • Tokyo*) operates at the intersection of architectural discipline and organic human grace. Every piece is drafted by hand on Parisian dress forms, cut on the true 45-degree mathematical bias, and tailored in strictly limited numbered editions using centenary European mills in Biella, Lyon, and Florence.

### Design System Highlights:
- **Editorial Aesthetic:** High-contrast Noir (`#0B0B0E`) and Ivory (`#FCFCF9`) surfaces with Champagne Gold (`#D4AF37`) accents and brushed Platinum tones.
- **Typography:** Dual serif/grotesk hierarchy featuring *Italiana*, *Cormorant Garamond*, *Syne*, and *Plus Jakarta Sans*.
- **Interactive ThreeUI Integration:** Procedural liquid metallic fluid mesh hero, computational bias-cut silk cloth physics simulation, and floating brand orbs.
- **Localization:** 100% Vietnamese interface (`vi-VN`), VND currency (`formatCurrency` e.g. `58.500.000 ₫`), and `dd/MM/yyyy` dates.
- **Responsive Primitives:** Engineered and verified across Desktop (1440px+), Tablet (768px - 1024px), and Mobile (390px) viewports with zero horizontal overflow.
- **Adaptive Lighting:** Full Light and Dark theme engine with persistent state.

---

## ✦ Technology Architecture

| Layer | Technology | Details |
|---|---|---|
| **Framework** | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) | Strict mode, page-based modular structure |
| **Bundler** | [Vite 8](https://vite.dev/) | Sub-second HMR, optimized route code-splitting |
| **Styling** | [Tailwind CSS 3.4](https://tailwindcss.com/) + PostCSS | Custom luxury tokens, glassmorphism utilities |
| **Routing** | [React Router 7](https://reactrouter.com/) | 28+ distinct routes, lazy loading, scroll restoration |
| **State Management** | [Zustand 5](https://github.com/pmndrs/zustand) | Persisted cart, wishlist, theme, auth & toast stores |
| **WebGL & 3D** | [ThreeUI Community](https://threeui.com) + [Three.js](https://threejs.org/) | Shaders, cloth physics, liquid mesh, graceful fallbacks |
| **Motion** | [Motion](https://motion.dev/) | Micro-interactions, staggered entrances, accessible motion |
| **Testing** | [Vitest](https://vitest.dev/) + [Playwright](https://playwright.dev/) | 13 unit tests + 24 cross-viewport E2E tests |

---

## ✦ Source Code Organization (Page-Based Architecture)

All source code, components, hooks, functions, variables, and types strictly use **English** naming.
Each page or functional group resides in its own isolated module under `frontend/src/pages/<FeatureName>/`:

```
frontend/src/
├── pages/
│   ├── About/             # AboutPage.tsx, index.ts
│   ├── Account/           # AccountDashboardPage, Orders, Addresses, Settings, Layout
│   ├── Auth/              # LoginPage.tsx, RegisterPage.tsx, index.ts
│   ├── Cart/              # CartPage.tsx, CartItemList, CartSummary, CouponBox
│   ├── Checkout/          # CheckoutPage.tsx, ShippingAddressForm, Delivery, Payment
│   ├── Collections/       # CollectionsPage.tsx, CollectionDetailPage.tsx, CollectionCard
│   ├── Contact/           # ContactPage.tsx, index.ts
│   ├── Home/              # HomePage.tsx, Hero, Manifesto, Arrivals, Collections, Lookbook, etc.
│   ├── Journal/           # JournalPage.tsx, JournalDetailPage.tsx, JournalCard
│   ├── NotFound/          # NotFoundPage.tsx, index.ts
│   ├── OrderSuccess/      # OrderSuccessPage.tsx, OrderTimeline
│   ├── ProductDetail/     # ProductDetailPage.tsx, Gallery, AddToCart, Accordion, Sizing
│   ├── Products/          # ProductsPage.tsx, ProductGrid, ProductFilterBar, useProductFilters
│   ├── Search/            # SearchPage.tsx, index.ts
│   ├── Support/           # SupportPage.tsx, FAQ, SizeGuide, Shipping, Returns
│   └── Wishlist/          # WishlistPage.tsx, index.ts
├── shared/
│   ├── components/        # Header, Footer, AnnouncementBar, MegaMenu, CartDrawer, etc.
│   ├── data/              # Curated catalog (products.ts, collections.ts, journal.ts, storeInfo.ts)
│   ├── locales/           # Centralized Vietnamese translations (vi/common.ts)
│   ├── stores/            # Persisted Zustand stores (cart, wishlist, auth, theme, toast)
│   ├── threeui/           # ThreeUI WebGL shaders, cloth simulation, error boundaries
│   ├── types/             # Shared TypeScript models and interfaces
│   └── utils/             # Formatters (VND currency, dd/MM/yyyy date formatting)
├── test/                  # Vitest test suite
├── App.tsx                # English routing & lazy route loading
├── index.css              # Custom font typography & Tailwind directives
└── main.tsx               # Root entry point
```

---

## ✦ ThreeUI & WebGL Integration

Selected components from Meng To's **ThreeUI Community** (`@designcodeio/threeui`):

1. **`LiquidFormBackground` (Homepage Hero Banner):**
   - High-performance WebGL vertex and fragment shaders rendering real-time metallic fluid mesh.
   - Interactive pointer tracking adjusting wave vorticity and light dispersion.
   - Built-in `IntersectionObserver` that pauses GPU execution when out of viewport.
   - Fallback: Atmospheric radial gold-champagne gradient for devices without WebGL or with `prefers-reduced-motion: reduce`.

2. **`ClothStudy` (Interactive Runway Lookbook):**
   - 3D cloth physics simulation illustrating the drape and fluidity of 30-momme organic Lyon silk charmeuse.
   - Real-time cursor deformation mimicking physical fabric touch.

3. **`BrandOrbs` (Editorial Campaign Banner):**
   - Floating 3D geometries and ambient light rays highlighting the Autumn/Winter monograph.

4. **`WebGLErrorBoundary` & Resource Management:**
   - Error boundary protecting against WebGL context loss or iframe issues.
   - Safe shader buffer and program deallocation upon component unmount.

---

## ✦ Storefront Routes (English URLs with Vietnamese UI)

### Public Storefront:
- `/` — Trang chủ: 14-section luxury landing with ThreeUI Hero & Cloth Study.
- `/products` — Danh mục sản phẩm: Complete archival catalog with category filter, sorting, and in-stock toggle.
- `/products/:slug` — Chi tiết sản phẩm: Multi-image zoom gallery, color/size swatches, accordions, and related pieces.
- `/collections` — Bộ sưu tập: Runway archives and seasonal volume monographs.
- `/collections/:slug` — Chi tiết bộ sưu tập: Dedicated collection lookbook mosaic and piece acquisition.
- `/search` — Tìm kiếm: Live catalogue search with category filtering and history.
- `/wishlist` — Danh sách yêu thích: Curated wishlist with 1-click "Chuyển tất cả vào giỏ hàng".
- `/cart` — Giỏ hàng: Dedicated shopping bag ledger, coupon simulator (`VANGUARD15`, `LUXE20`), and free shipping bar.
- `/checkout` — Thanh toán: Multi-step simulated checkout with address validation, courier tiers, and payment simulation.
- `/order-success` — Đặt hàng thành công: Order confirmation with tracking timeline and cedar box packaging guarantee.
- `/about` — Di sản & Triết lý: Atelier history, mathematical bias cut manifesto, and European mill provenance.
- `/journal` — Tạp chí thời trang: Editorial magazine and monograph essays.
- `/journal/:slug` — Chi tiết bài viết: Individual longform study with quotes, drop caps, and author notes.
- `/contact` — Đặt hẹn salon: Private salon reservations (Paris Place Vendôme & Tokyo Ginza).
- `/support` — Hỗ trợ & Dịch vụ: Unified FAQ, Size Guide, Shipping & Returns policy center.
- `/404` — 404 Không tìm thấy: High-fashion archival void page.

### Patron Portal:
- `/login` — Đăng nhập: Simulated patron sign in with prefilled credentials.
- `/register` — Tạo tài khoản: New patron portfolio creation.
- `/account` — Tổng quan tài khoản: Patron overview with Haute Circle tier status and quick links.
- `/orders` — Lịch sử đơn hàng: Historical order ledger with tracking numbers.
- `/orders/:id` — Chi tiết đơn hàng: Detailed individual acquisition receipt with print layout.
- `/account/addresses` — Sổ địa chỉ: Saved residence manager with primary toggles.
- `/account/settings` — Cài đặt tài khoản: Identity preferences and runway invitation settings.

---

## ✦ Installation & Local Development

### Prerequisites:
- **Node.js** >= 18.0.0
- **npm** >= 9.0.0

### Setup:
```bash
# Clone or navigate to the repository
cd 404Studio

# Install frontend dependencies
cd frontend
npm install

# Start Vite development server
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## ✦ Testing & Verification

### Vitest Unit & Integration Tests:
```bash
npm run test
```
- **13/13 Unit Tests Passing:**
  - Cart addition, duplicate merging, quantity steppers, item removal.
  - White-glove complimentary shipping threshold calculations in VND.
  - Coupon code validation (`VANGUARD15` 15% discount, threshold checks, invalid code handling).
  - Wishlist toggle, check existence, and state persistence.
  - Catalog product integrity (VND prices, categories, images, valid hex colors, variants).
  - Reusable component mounting and Vietnamese rendering.

### Playwright Cross-Viewport E2E Tests:
```bash
npm run test:e2e
```
- **24/24 E2E Tests Passing Across Viewports:**
  - **Desktop Viewport (1440x900):** 8 passed.
  - **Tablet Viewport (768x1024):** 8 passed.
  - **Mobile Viewport (390x844):** 8 passed.
- Validates:
  - Homepage announcements and ThreeUI hero loading.
  - Theme toggling between dark noir and light ivory.
  - Shop catalog filtering by category, subcategory, and VND sorting.
  - Product detail variant switching and bag drawer trigger.
  - Wishlist heart toggle and dedicated wishlist page sync.
  - Quick search modal trigger and instant product match retrieval.
  - Full checkout simulation and redirection to order confirmation.
  - Custom 404 page handling.

---

## ✦ Production Build & Deployment

```bash
# Compile TypeScript and build minified production bundle
npm run build

# Preview the production build locally
npm run preview
```

### Production Build Evidence:
- **Exit Code:** `0` (Success)
- **Time:** `~4.09s`
- **Output:** Clean `dist/` bundle with per-route code splitting and compressed assets.
- **Static Hosting:** Deployable directly to Vercel, Netlify, Cloudflare Pages, AWS S3/CloudFront, or any modern static host. Configure rewrite rule to route all paths to `/index.html`.

---

## ✦ Courtesy Promo Codes for Testing

- `VANGUARD15` — Giảm 15% Chào đón Thành viên mới (Không áp dụng mức tối thiểu).
- `LUXE20` — Giảm 20% Đặc quyền Haute Circle (Đơn hàng từ 25.000.000 ₫).
- `WELCOME10` — Giảm 10% Đặc quyền Đơn hàng đầu tiên.

---

## ✦ License & Attributions

- ThreeUI Community components licensed under the [MIT License](https://github.com/MengTo/threeui/blob/main/LICENSE) by Meng To.
- Editorial photography curated from Unsplash under open license for commercial presentation mockups.
- Built as an independent greenfield e-commerce frontend architecture.
