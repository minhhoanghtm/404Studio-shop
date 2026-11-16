# ATELIER VÉRITÉ — Contemporary Haute Couture & Architectural Ready-to-Wear

> **An independent, greenfield luxury fashion e-commerce web platform built with React 19, TypeScript, Vite, Tailwind CSS, Motion, Zustand, and ThreeUI WebGL components.**

---

## ✦ Brand Concept & Visual Identity

**Atelier Vérité** (*Paris • Milan • Tokyo*) operates at the intersection of architectural discipline and organic human grace. Every piece is drafted by hand on Parisian dress forms, cut on the true 45-degree mathematical bias, and tailored in strictly limited numbered editions using centenary European mills in Biella, Lyon, and Florence.

### Design System Highlights:
- **Editorial Aesthetic:** High-contrast Noir (`#0B0B0E`) and Ivory (`#FCFCF9`) surfaces with Champagne Gold (`#D4AF37`) accents and brushed Platinum tones.
- **Typography:** Dual serif/grotesk hierarchy featuring *Italiana*, *Cormorant Garamond*, *Syne*, and *Plus Jakarta Sans*.
- **Interactive ThreeUI Integration:** Procedural liquid metallic fluid mesh hero, computational bias-cut silk cloth physics simulation, and floating brand orbs.
- **Responsive Primitives:** Seamless layouts engineered and verified across Desktop (1440px+), Tablet (768px - 1024px), and Mobile (390px) viewports with zero horizontal overflow.
- **Adaptive Lighting:** Full Light and Dark theme engine with persistent state.

---

## ✦ Technology Architecture

| Layer | Technology | Details |
|---|---|---|
| **Framework** | [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) | Strict mode, modular functional components |
| **Bundler** | [Vite 8](https://vite.dev/) | Sub-second HMR, optimized route code-splitting |
| **Styling** | [Tailwind CSS 3.4](https://tailwindcss.com/) + PostCSS | Custom luxury tokens, glassmorphism utilities |
| **Routing** | [React Router 7](https://reactrouter.com/) | 28+ distinct routes, lazy loading, scroll restoration |
| **State Management** | [Zustand 5](https://github.com/pmndrs/zustand) | Persisted cart, wishlist, theme, auth & toast stores |
| **WebGL & 3D** | [ThreeUI Community](https://threeui.com) + [Three.js](https://threejs.org/) | Shaders, cloth physics, liquid mesh, graceful fallbacks |
| **Motion** | [Motion](https://motion.dev/) | Micro-interactions, staggered entrances, accessible motion |
| **Testing** | [Vitest](https://vitest.dev/) + [Playwright](https://playwright.dev/) | 13 unit tests + 24 cross-viewport E2E tests |

---

## ✦ ThreeUI & WebGL Integration

Selected components from Meng To's **ThreeUI Community** (`@designcodeio/threeui`):

1. **`LiquidFormBackground` (Homepage Hero Banner):**
   - High-performance WebGL vertex and fragment shaders rendering real-time metallic fluid mesh.
   - Interactive pointer tracking adjusting wave vorticity and light dispersion.
   - Built-in `IntersectionObserver` that pauses GPU execution when out of viewport.
   - Fallback: Atmospheric radial gold-champagne gradient for devices without WebGL or with `prefers-reduced-motion: reduce`.

2. **`ClothStudy` / `TextPathStudies` (Interactive Runway Lookbook):**
   - 3D cloth physics simulation illustrating the drape and fluidity of 30-momme organic Lyon silk charmeuse.
   - Real-time cursor deformation mimicking physical fabric touch.

3. **`BrandOrbs` (Editorial Campaign Banner):**
   - Floating 3D geometries and ambient light rays highlighting the Autumn/Winter 2026 monograph.

4. **`WebGLErrorBoundary` & Resource Management:**
   - Error boundary protecting against WebGL context loss or iframe issues.
   - Safe shader buffer and program deallocation upon component unmount.

---

## ✦ Complete Storefront Routes

### Public Storefront:
- `/` — Complete 14-section homepage experience (ThreeUI Hero, New Season Intro, New Arrivals, Shop by Category, Runway Feature, Editorial Campaign, Trending Products, Interactive Lookbook with Cloth Physics, Brand Philosophy, Journal Stories, Newsletter, Footer).
- `/shop` — Complete archival catalog with category tabs, subcategory filters, sorting, and in-stock toggle.
- `/shop/women` — Women's ready-to-wear, sculpted outerwear, and column gowns.
- `/shop/men` — Men's deconstructed tailoring, cashmere knitwear, and shearling.
- `/shop/accessories` — Full-grain box calfskin bags with carved oak handles, boots, and vermeil jewelry.
- `/collections` — Runway archives and seasonal volume monographs.
- `/collections/:slug` — Dedicated collection lookbook mosaic and piece acquisition.
- `/products/:slug` — Product detail with multi-image gallery, color swatches, size inventory, stock alerts, accordions, and related companions.
- `/search` — Live catalogue search with category filtering and recent history.
- `/wishlist` — Curated wishlist with 1-click "Move All to Bag" and removal.
- `/cart` — Dedicated shopping bag ledger, coupon simulator (`VANGUARD15`, `LUXE20`), and shipping calculator.
- `/checkout` — Multi-step simulated checkout with address validation, courier tiers, and payment simulation.
- `/order-success` — Order confirmation with tracking timeline and cedar box packaging guarantee.
- `/about` — Atelier history, mathematical bias cut manifesto, and European mill provenance.
- `/journal` — Editorial magazine and monograph essays.
- `/journal/:slug` — Individual longform study with quotes, drop caps, and author notes.
- `/contact` — Private salon reservations (Paris Place Vendôme & Tokyo Ginza).
- `/faq` — Categorized interactive accordion questions.
- `/size-guide` — Interactive centimeter / inches size conversion chart.
- `/shipping` — White-glove worldwide dispatch policies and schedules.
- `/returns` — 30-day trial and lifetime restoration guarantee.
- `/404` — High-fashion archival void page.

### Patron Portal:
- `/login` — Simulated patron sign in with prefilled credentials.
- `/register` — New patron portfolio creation.
- `/account` — Patron overview with Haute Circle tier status and quick links.
- `/account/orders` — Historical order ledger with tracking numbers.
- `/account/orders/:id` — Detailed individual acquisition receipt with print layout.
- `/account/addresses` — Saved residence manager with primary toggles.
- `/account/settings` — Identity preferences and runway invitation settings.

---

## ✦ Installation & Local Development

### Prerequisites:
- **Node.js** >= 18.0.0
- **npm** >= 9.0.0

### Setup:
```bash
# Clone or navigate to the repository
cd 404Studio

# Install all dependencies (clean peer dependency resolution)
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
  - White-glove complimentary shipping threshold calculations ($500+).
  - Coupon code validation (`VANGUARD15` 15% discount, threshold checks, invalid code handling).
  - Wishlist toggle, check existence, and state persistence.
  - Catalog product integrity (prices, categories, images, valid hex colors, variants).
  - Reusable component mounting and rendering.

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
  - Theme toggling between dark and light modes.
  - Shop catalog filtering by category, subcategory, and sorting.
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
- **Time:** `~2.8s`
- **Output:** Clean `dist/` bundle with per-route code splitting and compressed assets.
- **Static Hosting:** Deployable directly to Vercel, Netlify, Cloudflare Pages, AWS S3/CloudFront, or any modern static host. Configure rewrite rule to route all paths to `/index.html`.

---

## ✦ Courtesy Promo Codes for Testing

- `VANGUARD15` — 15% Atelier Welcome Courtesy (No minimum).
- `LUXE20` — 20% Haute Circle Exclusive ($1,000 minimum spend).
- `WELCOME10` — 10% First Order Privilège.

---

## ✦ License & Attributions

- ThreeUI Community components licensed under the [MIT License](https://github.com/MengTo/threeui/blob/main/LICENSE) by Meng To.
- Editorial photography curated from Unsplash under open license for commercial presentation mockups.
- Built as an independent greenfield e-commerce frontend architecture.
