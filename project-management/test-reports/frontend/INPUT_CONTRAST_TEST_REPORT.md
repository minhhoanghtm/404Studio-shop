# Input Contrast & Form Readability Test Report

**Task:** TASK-INPUT-CONTRAST
**Status:** IN_PROGRESS — core implementation and non-browser gates passed; cross-route Playwright execution pending.
**Date:** 17/11/2026

## Scope audited

- 96 native `input`, `textarea`, and `select` occurrences in 31 frontend source files.
- Auth, OTP, checkout/address, cart coupon, search, contact, account security, AI chat, privacy request, reviews, newsletter, and admin forms.
- Checkbox/radio controls are covered with an accessible theme-aware accent color; hidden and non-textual input types are excluded from text-contrast overrides.

## Root cause and remediation

Fixed `bg-noir-*` and `text-white` control utilities that bypassed the global light-theme tokens. `frontend/src/index.css` now supplies semantic background, foreground, placeholder, border, focus, disabled, and error tokens for dark and light themes. The shared rule overrides page-local color utilities without changing form state, validation, events, APIs, or backend behavior.

Additional coverage includes visible focus rings, selection/caret colors, disabled states, native select options, checkbox/radio accent color, and Chrome/Edge WebKit autofill foreground/background normalization.

## Browser computed-style evidence

Measured with local Chromium against the running frontend at `/login`:

| Theme | Value foreground | Input background | Placeholder foreground | Result |
|---|---|---|---|---|
| Dark | `rgb(242, 242, 244)` | `rgb(18, 18, 23)` | `rgb(181, 181, 192)` | PASS — normal and placeholder text exceed WCAG AA 4.5:1 |
| Light | `rgb(18, 18, 21)` | `rgb(255, 255, 255)` | `rgb(98, 98, 111)` | PASS — normal and placeholder text exceed WCAG AA 4.5:1 |

Focused input verification produced a `rgb(125, 97, 20)` focus border and a 3px focus ring. Disabled controls resolve to `rgb(239, 236, 228)` with `rgb(98, 98, 111)` text and `not-allowed` cursor.

## Validation results

| Check | Result | Notes |
|---|---|---|
| Source inventory | PASS | 96 controls are covered by the shared semantic selector. |
| Oxlint | PASS with existing warnings | No new lint errors. |
| TypeScript + Vite build | PASS | Production build completed. |
| Vitest | PASS | 55/55 tests passed. |
| Full Playwright route suite | PENDING | Requires a stable dedicated local test-server session; do not treat as passed. |
| Docker rebuild | PASS | `atelier-verite/frontend:input-contrast-test` built successfully. |
| Full accessibility audit | PENDING | Deferred until full browser suite can run against the corrected styles. |

## Outstanding verification

Run the full Playwright matrix on an isolated port, then validate autofill, focus, disabled/readonly/error states, keyboard navigation, and screenshots across desktop/mobile before moving the task to `completed/`.
