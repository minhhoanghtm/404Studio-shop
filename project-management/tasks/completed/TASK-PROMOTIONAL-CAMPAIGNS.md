# TASK: Promotional Campaigns, Sale Popups & Smart Redirects

- **Task ID**: `TASK-PROMOTIONAL-CAMPAIGNS`
- **Status**: `COMPLETED`
- **Priority**: `CRITICAL`
- **Owner**: Senior Fullstack Architect / E-commerce Campaign Engineer
- **Created**: 20/11/2026
- **Completed**: 20/11/2026
- **Target Release**: Production

---

## 1. Objectives & Delivery Summary

1. **Enterprise Admin Campaign Suite**:
   - Implemented `/admin/campaigns` listing with statistics, search, status/type filters, quick status toggles, and deletion modal.
   - Implemented `/admin/campaigns/new` creation page supporting basic information, scheduling (`startAt` < `endAt`), discount rules, image uploading (`uploadApi.uploadImage`), smart destination selector, and live mockup preview modal.
   - Implemented `/admin/campaigns/:id/edit` editing page pre-filling existing campaign and banner details.
   - Implemented `/admin/campaigns/:id` detailed analytics page featuring live performance metrics (`totalRevenue`, `totalItemsSold`, `totalOrders`, `totalQuota`, `totalRemainingQuota`), popup showcase, and campaign products management (`addCampaignProduct`, `updateCampaignProduct`, `removeCampaignProduct`).
2. **Smart Destination Selector & Sanitization**:
   - Supported destination types: Product (`/products/:slug`), Category (`/products?category=:slug`), Collection (`/collections/:slug`), Lookbook (`/lookbooks/:slug`), Voucher (`/vouchers`), Sale Page (`/collections/sale`), and Custom URL.
   - Real-time preview with security validation strictly blocking `javascript:`, `data:`, `file:`, `vbscript:`, and protocol-relative `//` URLs.
3. **Public Promotional Popup**:
   - Centered accessible modal (`role="dialog"`, `aria-modal="true"`) matching Atelier Vérité Haute Couture aesthetic.
   - Dual-media responsiveness for desktop and mobile banners.
   - Real-time countdown timer ticker.
   - Smart CTA navigation and dismissal tracking.
   - Priority handling: highest priority active campaign displays first; strictly 1 popup at a time.
   - Privacy compliance: Cookie Consent banner has absolute priority; promotional popup never overlaps, and non-essential marketing tracking is gated by user consent.
4. **Frequency Cap Control**:
   - Managed display frequencies: `once_per_session` (`sessionStorage`), `once_per_day` (`localStorage`), `once_forever`, and `always`.
   - "Không hiện lại trong hôm nay" checkbox functionality.
5. **Quality Gates Passed**:
   - TypeScript strict (`npx tsc -b`): PASS (0 errors).
   - Oxlint (`npm run lint`): PASS (0 errors).
   - Vitest unit tests (`src/test/campaignSystem.test.ts`): PASS (17/17 tests).
   - Full Vitest suite (`npm run test`): PASS (17 test files, 138 tests).
   - Playwright cross-device E2E (`e2e/campaignPopup.spec.ts`): PASS (15/15 tests across Desktop, Tablet, Mobile).
   - Production bundle build (`npm run build`): PASS (3.58s).
   - Docker Compose configuration (`docker compose -f compose.yaml config --quiet`): PASS.

---

## 2. Test Evidence Links
- [CAMPAIGN_POPUP_UI_TEST.md](file:///d:/Project/404Studio/project-management/test-reports/frontend/CAMPAIGN_POPUP_UI_TEST.md)
- [CAMPAIGN_API_TEST.md](file:///d:/Project/404Studio/project-management/test-reports/integration/CAMPAIGN_API_TEST.md)
- [CAMPAIGN_SECURITY_TEST.md](file:///d:/Project/404Studio/project-management/test-reports/security/CAMPAIGN_SECURITY_TEST.md)
- [CAMPAIGN_BACKEND_GAPS.md](file:///d:/Project/404Studio/docs/api/CAMPAIGN_BACKEND_GAPS.md)
