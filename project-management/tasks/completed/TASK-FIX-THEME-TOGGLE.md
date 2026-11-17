# Task ID: TASK-FIX-THEME-TOGGLE
# Title: Fix Light/Dark Mode Toggle & Full UI Theme System Synchronization
# Status: COMPLETED
# Priority: HIGH
# Completed At: 17/11/2026

## 1. Objective
Audit and repair the light/dark theme toggle system in `frontend/`. Ensure that toggling between Light and Dark mode changes the visual theme across the entire application, persists in localStorage, reflects system preference when unselected, applies the `dark` class to `document.documentElement`, supports WCAG AA accessibility, avoids flash of incorrect theme, and maintains seamless ThreeUI shader compatibility.

## 2. Root Cause Analysis
1. **Hardcoded CSS Classes**: `RootLayout` in `App.tsx` and `<body>` in `index.html` used hardcoded `bg-noir-950 text-white` and `bg-[#0b0b0e] text-[#f2f2f4]`, bypassing Tailwind's `dark:` modifier rules.
2. **Missing Light Tokens**: Header, Footer, AnnouncementBar, ProductCard, and Recommendation sections lacked responsive dark/light utility classes.
3. **Stale Dev Server**: Stale Vite dev server on port 5173 was intercepting browser test sessions.

## 3. Implementation Details
- **`useThemeStore.ts`**:
  - Implemented `applyThemeToDOM` to update `document.documentElement.classList` (`dark` / `light`) and `style.colorScheme`.
  - Added cross-tab synchronization with `window.addEventListener('storage')`.
  - Added OS preference change listener with `window.matchMedia('(prefers-color-scheme: dark)')`.
- **`index.html`**:
  - Injected synchronous inline anti-FOUC script in `<head>` to prevent flash of wrong theme.
  - Added dynamic body classes (`bg-ivory-50 text-noir-900 dark:bg-[#0b0b0e] dark:text-[#f2f2f4]`).
- **`App.tsx`**:
  - Refactored `RootLayout` and `PageLoadingFallback` to dynamic background and text color tokens.
- **`Header.tsx`**:
  - Added accessible `aria-label`, `title`, and `aria-pressed` in Vietnamese.
  - Refactored brand logo, search pill, navigation links, and theme toggle button for both light and dark backgrounds.
- **`Footer.tsx` & `AnnouncementBar.tsx`**:
  - Replaced hardcoded dark background and border utilities with responsive dark/light classes.
- **`ProductCard.tsx` & `HomeRecommendationSection.tsx`**:
  - Styled cards, prices, titles, badges, and quick-add modals for high contrast in light mode and noir luxury in dark mode.
- **`ThreeClothStudy.tsx`**:
  - Updated shader backdrop container to adapt gracefully without WebGL context reload.

## 4. Verification & Testing
- **Unit Tests (Vitest)**: 5/5 passing in `frontend/src/test/themeToggle.test.ts`. Total frontend suite: 60/60 passing.
- **E2E Tests (Playwright)**: 3/3 passing in `frontend/e2e/themeToggle.spec.ts` on Desktop Viewport.
- **Accessibility**: Meets WCAG 2.1 AA contrast requirements (> 14:1 on main background).
- **Screenshots**:
  - `project-management/test-reports/frontend/screenshots/theme-light-mode.png`
  - `project-management/test-reports/frontend/screenshots/theme-dark-mode.png`
- **Full Report**: [THEME_TOGGLE_TEST_REPORT.md](file:///d:/Project/404Studio/project-management/test-reports/frontend/THEME_TOGGLE_TEST_REPORT.md)
