# Admin API Mapping & Capability Matrix

## 1. Overview
This document catalogs all endpoints engaged by the Admin Policy Management and Tracking Analytics systems in Atelier Vérité. It outlines HTTP methods, backend route handlers, data schemas, access controls, and architecture status markers (`WORKING`, `PARTIAL`, `BLOCKED_BY_BACKEND`).

---

## 2. Policy Management Endpoints

| HTTP Method | Route | Backend Handler | RBAC Role | Status | Description |
|---|---|---|---|---|---|
| `GET` | `/api/admin/pages` | `page.controller.getAllPagesAdmin` | `admin`, `superadmin` | **WORKING** | Retrieves paginated legal pages and policies with title, slug, status, and timestamps. |
| `GET` | `/api/admin/pages/:id` | `page.controller.getPageByIdAdmin` | `admin`, `superadmin` | **WORKING** | Fetches single policy details by MongoDB ObjectId for editing. |
| `POST` | `/api/admin/pages` | `page.controller.createPageAdmin` | `admin`, `superadmin` | **WORKING** | Creates a new legal policy with title, content, slug, and status (`draft`/`published`). |
| `PUT` | `/api/admin/pages/:id` | `page.controller.updatePageAdmin` | `admin`, `superadmin` | **WORKING** | Updates policy attributes, rich text content, and publication status. |
| `PATCH` | `/api/admin/pages/:id/status` | `page.controller.updateStatusAdmin` | `admin`, `superadmin` | **WORKING** | Quick-toggles policy lifecycle status (`draft` ↔ `published` ↔ `archived`). |
| `DELETE` | `/api/admin/pages/:id` | `page.controller.deletePageAdmin` | `superadmin` | **WORKING** | Deletes an un-published or archived policy document. |
| `GET` | `/api/pages/:slug` | `page.controller.getPageBySlugPublic` | Public | **WORKING** | Public API used by storefront legal pages to fetch canonical active policies. |
| `POST` | `/api/admin/pages/:id/review` | N/A | `reviewer`, `legal` | **BLOCKED_BY_BACKEND** | Formal approval workflow endpoint (`PENDING_REVIEW` → `APPROVED`). Badge rendered in UI. |
| `GET` | `/api/admin/pages/:id/versions`| N/A | `admin`, `superadmin` | **BLOCKED_BY_BACKEND** | Discrete immutable version diff table. Historical log rendered via audit trail metadata. |

---

## 3. Tracking & Telemetry Analytics Endpoints

| HTTP Method | Route | Backend Handler | RBAC Role | Status | Description |
|---|---|---|---|---|---|
| `GET` | `/api/events/analytics/overview` | `tracking.controller.getOverviewAnalytics` | `admin`, `superadmin` | **WORKING** | Delivers total event count, unique users/sessions, top searches, top products, and hourly distributions. |
| `GET` | `/api/events/analytics/funnel` | `tracking.controller.getFunnelAnalytics` | `admin`, `superadmin` | **WORKING** | Computes sequential 4-stage conversion funnel (`view` → `cart` → `checkout` → `purchase`) with drop-off rates. |
| `GET` | `/api/events/analytics/activity` | `tracking.controller.getActivityAnalytics` | `admin`, `superadmin` | **WORKING** | Calculates dwell time metrics, traffic source breakdown, and top endpoint engagement. |
| `GET` | `/api/events/presence/live` | `tracking.controller.getLivePresence` | `admin`, `superadmin` | **WORKING** | Real-time active user sessions count and live session tokens sourced from Redis 7.0 cache. |
| `GET` | `/api/events/presence/session/:id` | `tracking.controller.getSessionTimeline` | `admin`, `superadmin` | **WORKING** | Chronological event stream for a specific session token for security/UX troubleshooting. |
| `GET` | `/api/privacy/policy-metadata` | `privacy.controller.getPolicyMetadata` | Public / Admin | **WORKING** | Canonical privacy policy version, effective date, and compliance hash. |
| `GET` | `/api/privacy/dsr` | `privacy.controller.getDsrRequests` | `admin`, `privacy_officer` | **WORKING** | Data Subject Rights requests queue (export/deletion requests under Decree 13/2023). |
| `GET` | `/api/events/admin/events` | N/A | `admin` | **BLOCKED_BY_BACKEND** | Arbitrary paginated raw event log dump. Sourced via aggregate overview and live sessions. |
| `GET` | `/api/privacy/admin/consent-stats` | N/A | `admin` | **BLOCKED_BY_BACKEND** | Global consent opt-in percentage statistics. Replaced by DSR ledger and policy metadata inspection. |

---

## 4. Error Handling & Resilience
- **Network Outage / Gateway Fallback**: All API calls are wrapped in defensive `try/catch` constructs with type-safe `ApiResponse<T>` handling.
- **Graceful UI Degradation**: If backend returns 404 or 500 on missing enterprise endpoints, pages display graceful Vietnamese notices rather than crashing or throwing unhandled React exceptions.
