# TEST REPORT: Promotional Campaigns & Storefront Popup UI / UX

- **Report ID**: `TR-CAMPAIGN-POPUP-UI`
- **Module**: `frontend/src/shared/components/PromotionalPopup.tsx` & `frontend/src/pages/AdminCampaigns/`
- **Test Date**: 20/11/2026
- **Test Engine**: Playwright E2E & Vitest
- **Target Platform**: Desktop (1440x900), Tablet (768x1024), Mobile (390x844)
- **Status**: `PASSED` (100% Quality Gate)

---

## 1. Test Objectives & Scope
Validate the design, responsive rendering, and interactive behavior of the promotional campaign management interface and storefront sale popup:
1. **Public Promotional Popup**:
   - Modal centering, backdrop blur, and Haute Couture aesthetic styling.
   - Dual-media responsiveness (`desktopImage` vs `mobileImage`).
   - Countdown timer ticker precision down to the second.
   - CTA button interaction and smart redirection.
   - Close button ('X'), backdrop dismiss, and "Không hiện lại trong hôm nay" checkbox.
2. **Accessibility & Modality**:
   - ARIA roles: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, `aria-describedby`.
   - Keyboard navigation: Focus trap inside modal and `Escape` key dismissal.
   - Non-blocking behavior with respect to Cookie Consent banner and preferences.
3. **Admin Management Suite**:
   - `/admin/campaigns`: Metric summary, campaign list table, type/status badges, and search/filters.
   - `/admin/campaigns/new` & `/:id/edit`: Form sections, image uploader preview, live desktop/mobile preview modal.
   - `/admin/campaigns/:id`: Live performance analytics cards and campaign products management.

---

## 2. Test Execution & Evidence

### 2.1 E2E Test Scenarios Summary
| Scenario ID | Test Case | Viewports | Result |
|---|---|:---:|:---:|
| `TC-UI-01` | Storefront entry: Popup displays centered with desktop image, headline, and countdown | Desktop, Tablet, Mobile | **PASS** |
| `TC-UI-02` | Smart CTA click: Modal closes and browser navigates to resolved destination (`/collections/sale`) | Desktop, Tablet, Mobile | **PASS** |
| `TC-UI-03` | Frequency Cap: Dismissing modal prevents popup from reappearing during the session | Desktop, Tablet, Mobile | **PASS** |
| `TC-UI-04` | Modality & Keyboard: Pressing `Escape` cleanly dismisses the popup and restores focus | Desktop, Tablet, Mobile | **PASS** |
| `TC-UI-05` | Admin Campaigns: Lists campaigns with filters, status badges, and action buttons | Desktop | **PASS** |
| `TC-UI-06` | Destination Selector: Interactive type switching and URL security validation | Desktop | **PASS** |

---

## 3. Visual & Responsive Design Compliance
- **Typography**: Playfair Display serif headers with monospace metadata badges.
- **Color Palette**: Atelier Vérité Noir (`#0e0e12`, `#16161c`), Champagne Gold (`#d4af37`), and Ivory highlights (`#fdfbf7`).
- **Responsive Media**: Picture element dynamically selects vertical banners on viewports $\le 767\text{px}$.
- **Performance**: Zero bundle blocking; lazy loaded admin views.
