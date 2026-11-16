# BÁO CÁO THẨM ĐỊNH & THIẾT KẾ KIẾN TRÚC DOCKER (DOCKER VALIDATION REPORT)
## DỰ ÁN: ATELIER VÉRITÉ — THREEUI FASHION E-COMMERCE
**Thời điểm thực hiện:** 16/11/2026 23:56 (ICT)  
**Tiêu chuẩn áp dụng:** Docker & OCI Best Practices, CIS Docker Benchmark, Non-Root Principles  

---

### 1. TỔNG QUAN KIẾN TRÚC CONTAINER ORCHESTRATION

Hệ thống được thiết kế theo mô hình Monorepo Containerized hoàn chỉnh gồm 5 dịch vụ cốt lõi:

```
                  ┌──────────────────────────────────────────────┐
                  │          NGINX FRONTEND (Port 8080)          │
                  │   - SPA Fallback try_files                   │
                  │   - Gzip & Cache-Control Headers             │
                  │   - Proxy /api/* -> Backend:5000             │
                  └──────────────────────┬───────────────────────┘
                                         │ (internal http)
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │            BACKEND API (Port 5000)           │
                  │   - Node 22 LTS Alpine + dumb-init           │
                  │   - Non-root user 'node'                     │
                  │   - Healthcheck: /api/health/liveness        │
                  └───────────┬──────────────────────┬───────────┘
                              │                      │
             ┌────────────────▼─────────┐  ┌─────────▼─────────────────┐
             │    MONGODB (Port 27017)  │  │    REDIS 7 (Port 26379)   │
             │   - Volume: mongo-data   │  │   - Volume: redis-data    │
             │   - Health: mongosh ping │  │   - Health: redis-cli ping│
             └──────────────────────────┘  └─────────▲─────────────────┘
                                                     │
                                           ┌─────────┴─────────────────┐
                                           │   WORKER (BullMQ Queue)   │
                                           │  - Node 22 LTS + dumb-init│
                                           │  - Email, AI, Vector Sync │
                                           └───────────────────────────┘
```

---

### 2. CHI TIẾT BẢO MẬT & TỐI ƯU HÓA CỦA CÁC DOCKERFILE

#### 2.1. Frontend Dockerfile (`Dockerfile`)
- **Multi-Stage Build:**
  - `Stage 1 (builder)`: Dùng `node:22-alpine`, tận dụng cache layer `package*.json`, biên dịch TypeScript & Vite `npm run build`.
  - `Stage 2 (runner)`: Dùng `nginx:1.27-alpine` siêu nhẹ (~25MB), loại bỏ toàn bộ `node_modules` và source code build tools khỏi image cuối.
- **Security Headers Nginx:**
  - `X-Frame-Options: SAMEORIGIN` (Chống Clickjacking).
  - `X-Content-Type-Options: nosniff` (Chống MIME confusion attack).
  - `Referrer-Policy: strict-origin-when-cross-origin`.
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`.
- **Healthcheck:** Endpoint `/healthz` trả về HTTP 200 nhanh gọn, probe qua `wget --spider`.

#### 2.2. Backend Dockerfile (`backend/Dockerfile`)
- **Multi-Stage Build:**
  - `Stage 1 (deps)`: `npm ci --omit=dev` chỉ cài đặt production dependencies.
  - `Stage 2 (runner)`: `node:22-alpine` tích hợp `dumb-init` xử lý tín hiệu POSIX `SIGTERM`/`SIGINT` cho graceful shutdown.
- **Quyền hạn Non-Root:** Chạy dưới user `node:node`, thư mục `/app/uploads` được cấp quyền hạn chế.
- **Native Healthcheck:** Chạy probe HTTP liveness qua lệnh native fetch Node.js không cần cài thêm package phụ.

#### 2.3. Background Worker Dockerfile (`backend/Dockerfile.worker`)
- Tách riêng tiến trình worker độc lập chạy BullMQ consumers (gửi email, xử lý hàng đợi, đồng bộ vector AI), tránh gây nghẽn event loop của Express API chính.

---

### 3. HỆ THỐNG COMPOSE CONFIGURATION

| Tệp Compose | Mục đích | Điểm nhấn kỹ thuật |
| :--- | :--- | :--- |
| `compose.yaml` | Cấu hình chuẩn duy nhất | Định nghĩa 5 services, network bridge cô lập `atelier-network`, dependencies `condition: service_healthy`. Tránh xung đột port máy host (Redis dùng `26379:6379`). |
| `docker-compose.yml` | Tương thích ngược | Import include `compose.yaml`. |
| `compose.dev.yaml` | Môi trường phát triển | Bind mount `./backend/src` để hot reload không cần build lại image. |
| `compose.prod.yaml` | Môi trường Production | Bổ sung giới hạn tài nguyên CPU/RAM (`limits`, `reservations`), cấu hình `restart_policy`, và giới hạn dung lượng file log (`max-size: 10m/20m`). |

---

### 4. KẾT QUẢ THẨM ĐỊNH LỆNH THỰC TẾ

```powershell
# Thẩm định cú pháp compose
docker compose -f compose.yaml config --quiet (Exit Code: 0 - HỢP LỆ)
docker compose -f compose.yaml -f compose.dev.yaml config --quiet (Exit Code: 0 - HỢP LỆ)
docker compose -f compose.yaml -f compose.prod.yaml config --quiet (Exit Code: 0 - HỢP LỆ)
```

- [x] Không copy `.env` vào bất kỳ Docker image nào (`.dockerignore` bảo vệ).
- [x] Không copy `node_modules` từ máy host vào image build.
- [x] Các services đều có healthcheck giám sát trạng thái liveness.
- [x] Không làm mất dữ liệu volumes hoặc ảnh hưởng các container độc lập khác đang chạy trên máy.
- [x] Cổng kiểm tra Docker Architecture: **PASS**.
