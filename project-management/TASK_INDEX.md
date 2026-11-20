# ATELIER VÉRITÉ — TASK & EXECUTION INDEX
**Architecture**: Monorepo with separated `frontend/` & `backend/`
**Compliance**: Vietnam Law 91/2025/QH15 & Decree 356/2025/NĐ-CP
**Last Updated**: 20/11/2026

---

## 1. Task Ledger

| Task ID | Title | Status | Priority | Owner | Output / Evidence |
|---|---|:---:|:---:|---|---|
| **TASK-001** | Backend Setup, Dependency Repair & Persistent Task Management | `COMPLETED` | CRITICAL | Senior Backend Engineer / DevOps | [TASK-001-backend-setup.md](file:///d:/Project/404Studio/project-management/tasks/completed/TASK-001-backend-setup.md) |
| **TASK-002** | Monorepo Restructuring: Move Frontend Application into `frontend/` | `COMPLETED` | HIGH | Senior Fullstack Architect | [TASK-002-frontend-restructure.md](file:///d:/Project/404Studio/project-management/tasks/completed/TASK-002-frontend-restructure.md) |
| **TASK-FIX-THEME-TOGGLE** | Fix Light/Dark Mode Toggle & Full UI Theme System Synchronization | `COMPLETED` | HIGH | Senior React/TypeScript & UI/UX Engineer | [TASK-FIX-THEME-TOGGLE.md](file:///d:/Project/404Studio/project-management/tasks/completed/TASK-FIX-THEME-TOGGLE.md) |
| **TASK-INPUT-CONTRAST** | Global Input Contrast, Readability & Form UI Audit | `IN_PROGRESS` | HIGH | Senior Frontend / Accessibility Engineer | [TASK-INPUT-CONTRAST.md](file:///d:/Project/404Studio/project-management/tasks/in-progress/TASK-INPUT-CONTRAST.md) |
| **TASK-REAL-API-INTEGRATION** | Real API Integration, Client Contracts & Mock Cleanup | `IN_PROGRESS` | HIGH | Senior Fullstack / API Integration Specialist | [TASK-REAL-API-INTEGRATION.md](file:///d:/Project/404Studio/project-management/tasks/in-progress/TASK-REAL-API-INTEGRATION.md) |
| **TASK-ADMIN-POLICY-MANAGEMENT** | Enterprise Policy Lifecycle Management System & Public Sync | `COMPLETED` | CRITICAL | Principal Fullstack / Senior React & Privacy Engineer | [TASK-ADMIN-POLICY-MANAGEMENT.md](file:///d:/Project/404Studio/project-management/tasks/completed/TASK-ADMIN-POLICY-MANAGEMENT.md) |
| **TASK-ADMIN-TRACKING-ANALYTICS** | Enterprise User Tracking & Behavioral Analytics Dashboard | `COMPLETED` | CRITICAL | Senior Fullstack / Data Analytics & Security Specialist | [TASK-ADMIN-TRACKING-ANALYTICS.md](file:///d:/Project/404Studio/project-management/tasks/completed/TASK-ADMIN-TRACKING-ANALYTICS.md) |
| **TASK-PRODUCT-VARIANTS** | Rename Artwork to Product Management & Multi-Variant Inventory | `COMPLETED` | CRITICAL | Senior Fullstack / E-commerce Architect & Inventory Specialist | [TASK-PRODUCT-VARIANTS.md](file:///d:/Project/404Studio/project-management/tasks/completed/TASK-PRODUCT-VARIANTS.md) |
| **TASK-CATEGORY-IMAGE-MANAGEMENT** | Category Images, Upload & Cross-Platform Display | `COMPLETED` | CRITICAL | Senior Fullstack Engineer & UI/UX Specialist | [TASK-CATEGORY-IMAGE-MANAGEMENT.md](file:///d:/Project/404Studio/project-management/tasks/completed/TASK-CATEGORY-IMAGE-MANAGEMENT.md) |
| **TASK-CATEGORY-EXCEL-IMPORT-EXPORT** | Category Excel Template, Import & Export with Validation | `COMPLETED` | CRITICAL | Data Import/Export Engineer & Backend Integration Specialist | [TASK-CATEGORY-EXCEL-IMPORT-EXPORT.md](file:///d:/Project/404Studio/project-management/tasks/completed/TASK-CATEGORY-EXCEL-IMPORT-EXPORT.md) |
| **TASK-PRODUCT-EXCEL-IMPORT-EXPORT** | Product & Multi-Variant Excel Import, Export & Template | `COMPLETED` | CRITICAL | Senior Fullstack Engineer & E-commerce Architect | [TASK-PRODUCT-EXCEL-IMPORT-EXPORT.md](file:///d:/Project/404Studio/project-management/tasks/completed/TASK-PRODUCT-EXCEL-IMPORT-EXPORT.md) |
| **TASK-DOCS-ORGANIZATION** | Audit, Classify & Organize Root Documentation | `COMPLETED` | HIGH | Documentation Engineer / Repository Maintainer | [TASK-DOCS-ORGANIZATION.md](file:///d:/Project/404Studio/project-management/tasks/completed/TASK-DOCS-ORGANIZATION.md) |
| **TASK-ADMIN-ORDER-EXCEL-EXPORT** | Admin Order Management & Multi-Scope Excel Export | `COMPLETED` | CRITICAL | Senior Fullstack Engineer & E-commerce Data Engineer | [TASK-ADMIN-ORDER-EXCEL-EXPORT.md](file:///d:/Project/404Studio/project-management/tasks/completed/TASK-ADMIN-ORDER-EXCEL-EXPORT.md) |
| **TASK-ADMIN-ANALYTICS-EXCEL-EXPORT** | Enterprise Business, Inventory & Tracking Excel Export | `COMPLETED` | CRITICAL | E-commerce Data Engineer & Analytics Specialist | [TASK-ADMIN-ANALYTICS-EXCEL-EXPORT.md](file:///d:/Project/404Studio/project-management/tasks/completed/TASK-ADMIN-ANALYTICS-EXCEL-EXPORT.md) |
| **TASK-ADMIN-CHATS-VIEWPORT** | Fix Admin Chats Full-Viewport Layout & Independent Scrolling | `COMPLETED` | HIGH | Senior React/TypeScript & CSS Layout Specialist | [TASK-ADMIN-CHATS-VIEWPORT.md](file:///d:/Project/404Studio/project-management/tasks/completed/TASK-ADMIN-CHATS-VIEWPORT.md) |
| **TASK-CUSTOMER-LOYALTY** | Customer Loyalty Points & 12-Tier Membership System | `COMPLETED` | CRITICAL | Senior Fullstack / Loyalty Architect & Security Specialist | [TASK-CUSTOMER-LOYALTY.md](file:///d:/Project/404Studio/project-management/tasks/completed/TASK-CUSTOMER-LOYALTY.md) |
| **TASK-PROMOTIONAL-CAMPAIGNS** | Promotional Campaigns, Sale Popups & Smart Redirects | `COMPLETED` | CRITICAL | Senior Fullstack / Campaign & MarTech Specialist | [TASK-PROMOTIONAL-CAMPAIGNS.md](file:///d:/Project/404Studio/project-management/tasks/completed/TASK-PROMOTIONAL-CAMPAIGNS.md) |
| **TASK-VISUAL-PAGE-BUILDER** | Admin Visual Page Builder & Dynamic Content Management | `COMPLETED` | CRITICAL | Principal Fullstack / Headless CMS Specialist | [TASK-VISUAL-PAGE-BUILDER.md](file:///d:/Project/404Studio/project-management/tasks/completed/TASK-VISUAL-PAGE-BUILDER.md) |
| **TASK-FULL-WEBSITE-VIDEO-QA** | Autonomous Full Website QA, UI Video Recording & Business Flow Testing (MP4) | `COMPLETED` | CRITICAL | Principal QA Automation Architect & CI/CD Specialist | [TASK-FULL-WEBSITE-VIDEO-QA.md](file:///d:/Project/404Studio/project-management/tasks/completed/TASK-FULL-WEBSITE-VIDEO-QA.md) |

---

## 2. Directory Structure

```text
project-management/
├── tasks/
│   ├── pending/       # Tasks queued for future sprints
│   ├── in-progress/   # Currently active tasks
│   ├── completed/     # Fully implemented, tested, and verified tasks
│   └── blocked/       # Tasks waiting on external dependencies or credentials
├── test-reports/
│   ├── backend/       # Backend unit, integration, and healthcheck reports
│   ├── frontend/      # Frontend component, vitest, and theme test reports
│   ├── integration/   # Frontend-to-Backend API contract verification reports
│   ├── e2e/           # Playwright cross-device end-to-end test reports
│   └── security/      # Gitleaks, secrets, and auth security audit reports
├── audits/            # Architecture, source code, and migration audits
├── handovers/         # Release notes and project handover reports
└── TASK_INDEX.md      # Master task ledger and status matrix
```

---

## 3. Status Definitions
- `PENDING`: Awaiting start condition.
- `IN_PROGRESS`: Actively under design, implementation, or testing.
- `COMPLETED`: 100% acceptance criteria satisfied with test evidence.
- `BLOCKED`: Work halted due to missing credentials, upstream APIs, or external dependencies.
