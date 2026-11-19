# User Tracking & Behavioral Analytics — System Architecture & Admin Operations

## 1. Overview
The **User Tracking Analytics System** (`/admin/tracking`) delivers business intelligence, customer engagement insights, sequential cohort funnel analysis, and real-time store telemetry for Atelier Vérité administrators. Built with strict privacy boundaries adhering to Decree 13/2023/NĐ-CP and Law 91/2025/QH15, all metrics reflect 100% genuine backend data without synthetic KPIs, random number generation, or client-side fabrication.

---

## 2. Navigation & Submodules

| Subroute | Component | Analytical Focus | Data Source |
|---|---|---|---|
| `/admin/tracking` | `AdminTrackingPage` | Executive Overview KPI summary, 30-day activity trend, event distribution, top product engagement | `GET /api/events/analytics/overview` |
| `/admin/tracking/users` | `AdminTrackingUsersPage` | Cohort conversion funnel (View → Cart → Checkout → Purchase), dwell time distribution, traffic origins | `GET /api/events/analytics/funnel`, `GET /api/events/analytics/activity` |
| `/admin/tracking/events` | `AdminTrackingEventsPage` | Real-time presence inspection, live active sessions, timeline event tracing, event frequency breakdown | `GET /api/events/presence/live`, `GET /api/events/presence/session/:id`, `GET /api/events/analytics/overview` |
| `/admin/tracking/products` | `AdminTrackingProductsPage` | Catalog performance rankings, search query trends, view/click popularity metrics | `GET /api/events/analytics/overview` |
| `/admin/tracking/consent` | `AdminTrackingConsentPage` | Privacy compliance ledger, DSR request queue, consent management telemetry | `GET /api/privacy/dsr`, `GET /api/privacy/policy-metadata` |

---

## 3. Real Backend Metrics vs. Architecture Status

### A. Executive Overview (`AdminTrackingPage`)
- **Total Tracked Events**: Aggregated count of genuine interaction records stored in MongoDB `user_events` collection (exceeding 2,760 verified events).
- **Unique Tracked Users**: Deduplicated distinct `user_id` and anonymous pseudo-identifiers.
- **Unique Active Sessions**: Distinct active session tokens recorded in backend telemetry.
- **Catalog Conversion Rate**: Real computation derived from sequential checkout and purchase actions.
- **Top Search Queries**: Genuine queries recorded from storefront search inputs.

### B. Conversion Funnel & User Cohorts (`AdminTrackingUsersPage`)
- **Sequential Stages**:
  1. **Xem sản phẩm (Product View)**
  2. **Thêm giỏ hàng (Add to Cart)**
  3. **Bắt đầu thanh toán (Initiate Checkout)**
  4. **Hoàn tất mua sắm (Purchase)**
- **Drop-off Analysis**: Accurate stage-by-stage drop-off percentages computed strictly from sequential backend funnel queries.
- **Traffic Origins**: Referrer distribution capturing direct traffic, organic search, and external campaigns.

### C. Live Presence & Session Tracing (`AdminTrackingEventsPage`)
- **Live Active Users**: Querying Redis 7.0 session store (`GET /api/events/presence/live`).
- **Interactive Session Timeline**: Administrators can query genuine session event journeys by clicking on a session token or inputting an authorized session ID (`GET /api/events/presence/session/:sessionId`).
- **Status Markers**:
  - `WORKING`: Live presence, session timeline tracing, aggregate event volume.
  - `BLOCKED_BY_BACKEND`: Freeform arbitrary pagination across raw event logs (`/api/events/admin/events`) is not implemented in the current backend route collection. The UI clearly documents this architectural boundary with standard status badges.

### D. Product Analytics (`AdminTrackingProductsPage`)
- **Top Interacted Products**: Product IDs ranking highest in views, clicks, and cart actions.
- **Search Query Velocity**: Frequencies of user searches for apparel, accessories, and seasonal collections.

### E. Consent & Privacy Compliance (`AdminTrackingConsentPage`)
- **Consent Metadata**: Active canonical privacy version, effective date, and compliance hash.
- **Data Subject Rights (DSR)**: Pending export and deletion requests queued under GDPR and Vietnamese privacy regulations.

---

## 4. Privacy & Data Minimization Guardrails
In strict adherence to Vietnamese Law 91/2025/QH15 and Decree 13/2023/NĐ-CP:
1. **Zero Secret Ingestion**: Admin analytics dashboards never request, store, or render passwords, OTP secrets, JWT tokens, credit card CVVs, or bank verification keys.
2. **Pseudonymization**: User identities are tracked using non-reversible anonymous hashes until explicit authenticated consent is established.
3. **No Unsanctioned Cross-User Snooping**: Admin tools only retrieve aggregate cohort trends or explicitly requested session debug traces authenticated under RBAC role permissions.
4. **Consent-Gated Telemetry**: Non-essential analytical telemetry is dropped client-side if the user has opted out via the Cookie Consent Banner.
