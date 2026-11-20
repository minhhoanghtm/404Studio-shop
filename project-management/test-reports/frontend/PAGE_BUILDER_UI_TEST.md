# TEST REPORT: Admin Visual Page Builder & Dynamic CMS UI / UX

- **Report ID**: `TR-PAGE-BUILDER-UI`
- **Module**: `frontend/src/pages/AdminPageBuilder/` & `frontend/src/shared/cms/`
- **Test Date**: 20/11/2026
- **Test Engine**: Playwright E2E (`e2e/pageBuilder.spec.ts`) & Vitest (`pageBuilderSystem.test.ts`)
- **Target Platform**: Desktop (1440x900), Tablet (768x1024), Mobile (390x844)
- **Status**: `PASSED` (100% Quality Gate — 21/21 E2E tests, 13/13 unit/integration tests)

---

## 1. Test Objectives & Scope
Validate the design, responsive ergonomics, AST block editing, live preview, and storefront rendering of the Admin Visual Page Builder:
1. **Admin Page Builder Hub (`/admin/page-builder`)**:
   - Page listings table with status badges (`Đã Xuất Bản`, `Bản Nháp`), slug display, and template type tags.
   - Filter tabs: All, Lookbook, About Us, Policies, Landing, Custom.
   - Real-time search query filtering and pagination.
   - Featured page toggle switch and delete confirmation modal.
2. **Visual Editor Workspace (`/admin/page-builder/new` & `/:id/edit`)**:
   - Header top bar with title editing, status pill, device switcher (`Desktop`, `Tablet`, `Mobile`), Light/Dark preview toggle, undo/redo buttons, template gallery modal, draft saving, and legal publishing guardrail.
   - Left Sidebar: Tabbed interface for "Thêm Khối" (Block Library categorized into Typography, Media, Layout, Fashion, Legal, Marketing) and "Cấu Trúc Trang" (Page Structure tree with drag reorder, clone, delete, and section management).
   - Live Canvas: Responsive container switching frame widths (`w-full` for Desktop, `w-[768px]` for Tablet, `w-[390px]` for Mobile) with smooth transitions, interactive block selection outline, inline action toolbar, and live editing.
   - Right Inspector: Contextual properties panel adapting to the selected block with tabs for Content, Typography, Colors (with WCAG AA Contrast Ratio indicator), Spacing, and Responsive Visibility toggles (Desktop/Tablet/Mobile).
   - Small-viewport Drawer Ergonomics: Slide-out panel drawers with backdrop and explicit close buttons ensuring canvas access on tablet and mobile viewports.
3. **Storefront Dynamic Rendering**:
   - Pure React `BlockRenderer` mapping AST blocks into responsive, styled Haute Couture UI components.
   - Automatic fallback to statutory disclosures for legal policy routes when no custom blocks exist.

---

## 2. Test Execution & Evidence

### 2.1 Cross-Device E2E Test Scenarios Summary
| Scenario ID | Test Case | Desktop (1440x900) | Tablet (768x1024) | Mobile (390x844) | Status |
|---|---|:---:|:---:|:---:|:---:|
| `TC-PB-01` | Scenario 1: Admin navigates to Visual Page Builder list page, views metrics, searches pages, filters by type | **PASS** (5.1s) | **PASS** (2.3s) | **PASS** (1.9s) | **PASS** |
| `TC-PB-02` | Scenario 2: Visual Editor loads and applies pre-configured template (Lookbook Runway, About Us, Legal Policy) | **PASS** (6.1s) | **PASS** (2.9s) | **PASS** (2.3s) | **PASS** |
| `TC-PB-03` | Scenario 3: Selecting a block opens Inspector panel, allows updating text/typography, updates live preview immediately | **PASS** (2.6s) | **PASS** (2.3s) | **PASS** (1.9s) | **PASS** |
| `TC-PB-04` | Scenario 4: Adding new block from Block Library appends to active section and focuses in inspector | **PASS** (2.5s) | **PASS** (2.4s) | **PASS** (2.1s) | **PASS** |
| `TC-PB-05` | Scenario 5: Multi-device responsive switcher changes viewport frame dimensions (`Desktop` -> `Tablet` -> `Mobile`) | **PASS** (2.7s) | **PASS** (2.1s) | **PASS** (1.8s) | **PASS** |
| `TC-PB-06` | Scenario 6: Legal Validation guardrail prevents publishing statutory policy with missing clauses and highlights remediation guide | **PASS** (2.7s) | **PASS** (2.4s) | **PASS** (2.1s) | **PASS** |
| `TC-PB-07` | Scenario 7: Storefront About page renders dynamic sections and blocks when published | **PASS** (1.9s) | **PASS** (1.7s) | **PASS** (1.6s) | **PASS** |

**Total E2E Execution**: 21 passed (34.7s)

---

## 3. UI/UX & Responsive Compliance
- **Aesthetic Direction**: Atelier Vérité Noir (`#07070a`, `#0e0e14`), Metallic Gold highlights (`#d4af37`), neutral borders (`white/10`).
- **Typography Engine**: Font family selector (Cinzel Serif, Cormorant Garamond, Inter Sans, Playfair Display, Space Mono), font sizes, weights, text alignments, letter spacing, line height.
- **Color Contrast Assurance**: Built-in WCAG AA checker calculates foreground/background luminance contrast ratio with real-time pass/fail badges ($\ge 4.5:1$ for normal text, $\ge 3.0:1$ for large text).
- **Mobile/Tablet Drawer Ergonomics**: Left panel and right inspector slide out cleanly without pushing the preview frame out of the viewport. Explicit close buttons (`aria-label="Đóng bảng khối"` and `aria-label="Đóng bảng thuộc tính"`) ensure flawless touch and keyboard navigation.
