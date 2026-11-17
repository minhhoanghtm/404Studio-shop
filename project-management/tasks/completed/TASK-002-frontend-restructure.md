# Task ID: TASK-002
# Title: Monorepo Restructuring — Move Frontend Application into `frontend/`
# Status: COMPLETED
# Priority: HIGH

## Objective
Reorganize workspace into a clean decoupled Frontend/Backend repository structure. Move all Frontend files, directories, dependencies, and configuration into `frontend/` without altering business logic or breaking CI/CD.

## Scope
- Create `frontend/` at repository root.
- Move: `src/`, `public/`, `index.html`, `package.json`, `package-lock.json`, `vite.config.ts`, `tsconfig*.json`, `.oxlintrc.json`, `postcss.config.js`, `tailwind.config.js`, `Dockerfile`, `nginx.conf`, `.dockerignore`, `.env.example`, `playwright.config.ts`, `e2e/`.
- Retain at root: `backend/`, `.github/`, `docs/`, `project-management/`, `.gitignore`, `compose*.yaml`, `docker-compose.yml`, `README.md`, `PROJECT_HANDOVER.md`.
- Update Docker Compose contexts to `./frontend`.
- Update GitHub Actions workflows (`.github/workflows/ci.yml`, `release.yml`) with `working-directory: ./frontend` and `cache-dependency-path: frontend/package-lock.json`.

## Acceptance Criteria
1. Frontend isolated in `frontend/` directory: **PASS**
2. No lingering Frontend source code scattered at root: **PASS**
3. Zero missing or broken imports: **PASS**
4. TypeScript compilation (`npx tsc -b` inside `frontend/`): **PASS**
5. Vitest unit tests (55/55 passed inside `frontend/`): **PASS**
6. Frontend production build (`npm run build`): **PASS**
7. Docker Compose configuration validates cleanly: **PASS**
8. GitHub Actions workflow paths updated: **PASS**

## Files Changed
- Created `frontend/` and moved all Frontend application code & config.
- Updated `compose.yaml`: `build.context: ./frontend`.
- Updated `.github/workflows/ci.yml`: added `working-directory: ./frontend`, updated cache and artifact paths.
- Updated `.github/workflows/release.yml`: updated Docker build context.

## Tests Executed
- `npm --prefix frontend run build`: Built production bundle in 3.64s.
- `npm --prefix frontend test`: 10/10 test files passed (55/55 tests).
- `docker compose -f compose.yaml config`: Validated.
