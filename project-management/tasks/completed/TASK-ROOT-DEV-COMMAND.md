# TASK-ROOT-DEV-COMMAND: One Command to Start Frontend & Backend from Project Root

**Status**: `COMPLETED`  
**Priority**: `CRITICAL`  
**Assignee**: Senior Fullstack Engineer, Node.js Developer & DevOps Specialist  
**Creation Date**: 20/11/2026  
**Completed Date**: 20/11/2026  

---

## 1. Description & Business Goal
Provide a unified developer experience where running `npm run dev` at the project root automatically boots both Backend (Express/MongoDB/Redis on port 5000) and Frontend (Vite/React 19 on port 5173), multiplexing logs in a single terminal with distinct prefixes and colors (`[BACKEND]`, `[FRONTEND]`). Ensure zero port conflicts, maintain cookie and JWT authentication across the Vite proxy, provide clean Ctrl+C graceful shutdown without leaving orphan Node.js background processes, and supply auxiliary scripts for individual services, full builds, and full test suites without altering backend business logic or violating CI/CD constraints.

---

## 2. Acceptance Criteria & Implementation Checklist

- [x] **Phase 1: Project & Architecture Audit**:
  - Verified package manager: `npm` v11.6.2, `node` v24.13.0.
  - Inspected `frontend/package.json`: Vite 8, React 19, TypeScript strict, Vitest, Oxlint.
  - Inspected `backend/package.json`: Express 4, Nodemon, Jest, ESLint, Mongoose, Redis.
  - Inspected database & ports: Backend 5000, Frontend 5173, MongoDB Atlas, Redis 6379.
  - Inspected Vite proxy: `/api` and `/uploads` to `http://localhost:5000`.
- [x] **Phase 2: Root Package Configuration**:
  - Configured root `package.json` with `"private": true`.
  - Added `concurrently` ^9.2.1 to root `devDependencies`.
  - Created root `.env.example` documenting unified environment variables.
  - Implemented root scripts:
    - `"dev"`: `concurrently --kill-others-on-fail --names BACKEND,FRONTEND --prefix-colors blue,green "npm run dev:backend" "npm run dev:frontend"`
    - `"dev:backend"`: `npm --prefix backend run dev`
    - `"dev:frontend"`: `npm --prefix frontend run dev`
    - `"build"`: `npm run build:frontend`
    - `"build:frontend"`: `npm --prefix frontend run build`
    - `"test"`: `npm run test:frontend && npm run test:backend`
    - `"test:frontend"`: `npm --prefix frontend run test`
    - `"test:backend"`: `npm --prefix backend run test`
    - `"test:e2e"`: `npm --prefix frontend run test:e2e`
    - `"lint"`: `npm run lint:frontend && npm run lint:backend`
    - `"lint:frontend"`: `npm --prefix frontend run lint`
    - `"lint:backend"`: `npm --prefix backend run lint`
- [x] **Phase 3 & 4: Connection & Proxy Verification**:
  - Verified Backend readiness probe: `GET /api/health` returns status `OK` with MongoDB and Redis connected.
  - Verified Frontend HTML served at `http://localhost:5173/` (HTTP 200).
  - Verified Vite reverse-proxy at `http://localhost:5173/api/health` returns 200 OK.
  - Verified Products API at `http://localhost:5173/api/products` retrieves 20 products from MongoDB Atlas.
  - Verified Categories API at `http://localhost:5173/api/categories` retrieves 16 categories.
  - Confirmed Bearer auth, refresh tokens, and cookie handling are preserved across proxy.
- [x] **Phase 5: Process Lifecycle & Signal Management**:
  - Verified Ctrl+C / SIGINT signal propagation stops both processes cleanly.
  - Verified ports 5000 and 5173 transition to `TimeWait` and close completely.
  - Confirmed zero orphan `node.exe` or `nodemon` processes remain running.
  - Verified repeated execution stability (stopped and restarted twice with 100% clean boot).
- [x] **Phase 7: Comprehensive Integration Testing**:
  - `npm run dev`: Successfully booted both services in single terminal.
  - `npm run build`: Production bundle compiled in 3.84s (0 errors).
  - `npm run test:frontend`: 18 test files, 151 unit tests passed (100% green).
  - `npm run test:backend`: 24 test files, 215 tests passed (100% green).
  - `npm run lint`: Frontend Oxlint (0 errors) + Backend ESLint (0 errors) passed.
  - `docker compose config`: All compose variants validated cleanly.
- [x] **Phase 8: Documentation & Handover**:
  - Updated `README.md` with unified quickstart and available root commands table.
  - Updated `PROJECT_HANDOVER.md` with Section 16.
  - Updated `project-management/TASK_INDEX.md` marking task `COMPLETED`.
