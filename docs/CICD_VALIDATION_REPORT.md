# BÁO CÁO THIẾT KẾ & THẨM ĐỊNH PIPELINE CI/CD (GITHUB ACTIONS)
## DỰ ÁN: ATELIER VÉRITÉ — THREEUI FASHION E-COMMERCE
**Thời điểm thực hiện:** 16/11/2026 23:58 (ICT)  
**Tiêu chuẩn áp dụng:** GitHub Actions Hardening, Principle of Least Privilege, OIDC & SLSA Level 2  

---

### 1. KIẾN TRÚC TỔNG THỂ CI/CD WORKFLOWS

Hệ thống CI/CD được phân tách thành 2 luồng công việc rõ ràng trong thư mục `.github/workflows/`:

1. **`ci.yml` (Continuous Integration & Quality Gates):**
   - Kích hoạt tự động khi có `push` hoặc `pull_request` tới các nhánh `main`, `master`, `develop`.
   - Có thể kích hoạt thủ công qua `workflow_dispatch`.
   - Quản lý Concurrency (`cancel-in-progress: true`) giúp tiết kiệm tài nguyên runner GitHub khi có commit mới đẩy lên liên tục.
2. **`release.yml` (Production / Staging Release Pipeline):**
   - Chỉ kích hoạt khi gắn tag phiên bản (`v*`) hoặc kích hoạt thủ công có kiểm soát (`workflow_dispatch`).
   - Yêu cầu xác nhận môi trường đích (`staging` hoặc `production`).

---

### 2. MA TRẬN CÁC JOBS KIỂM SOÁT CHẤT LƯỢNG TRONG CI

| Tên Job | Phụ thuộc (`needs`) | Các bước thực thi chính | Mục đích kiểm soát chất lượng |
| :--- | :--- | :--- | :--- |
| **`security`** | *(Độc lập)* | Gitleaks scan, Node 22 setup, `npm audit --audit-level=high` | Quét triệt để secrets và lỗ hổng dependency trước khi chạy code |
| **`frontend`** | *(Độc lập)* | Oxlint, TypeScript strict mode (`tsc -b`), Vitest (`npm run test`), Vite build, Quét secret bundle | Bảo đảm Frontend compile sạch, không lỗi kiểu, vượt qua 24 unit tests |
| **`backend`** | *(Độc lập)* | Cài đặt dependencies, ESLint kiểm tra tĩnh mã nguồn Express | Bảo đảm Backend tuân thủ chuẩn coding standards |
| **`docker`** | `[frontend, backend]` | Docker Buildx, validate syntax `compose.yaml` (dev & prod), build dry-run images | Bảo đảm Docker images build thành công, compose hợp lệ |
| **`e2e`** | `[frontend]` | Cài Chromium headless, chạy Playwright Legal & Privacy Suite | Thẩm định luồng người dùng thực tế và cơ chế chặn cookie consent |

---

### 3. THIẾT KẾ AN TOÀN & BẢO MẬT CI/CD (SECURITY HARDENING)

- **Nguyên tắc Quyền tối thiểu (Least Privilege):**
  - Mặc định toàn bộ workflow đặt `permissions: contents: read`.
  - Không cấp quyền `write` hay `admin` bừa bãi cho `GITHUB_TOKEN`.
- **Chống rò rỉ Secrets trong CI:**
  - Không bao giờ in (echo) biến môi trường hay secret ra console log.
  - Job `frontend` tích hợp bước kiểm tra tự động: nếu phát hiện bất kỳ chuỗi nhạy cảm nào lọt vào thư mục `dist/`, job sẽ lập tức dừng lại với mã lỗi `exit 1`.
  - Không upload tệp `.env` hoặc private keys vào GitHub Artifacts.
- **Cách ly môi trường:**
  - Sử dụng Docker container độc lập cho các bước build và test tích hợp.
