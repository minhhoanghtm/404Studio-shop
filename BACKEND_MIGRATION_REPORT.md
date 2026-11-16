# BÁO CÁO SAO CHÉP VÀ DI CHUYỂN BACKEND (BACKEND_MIGRATION_REPORT.md)

## 1. Thông Tin Tổng Quan

- **Thời gian thực hiện**: 16/11/2026
- **Đường dẫn nguồn**: `D:\Project\REACT-WebFashion\back-end`
- **Đường dẫn đích**: `d:\Project\404Studio\backend`
- **Kiến trúc sao chép**: 1:1 bảo toàn mã nguồn nguyên trạng, loại trừ các tệp tạm, dependencies và secrets.

---

## 2. Thống Kê Tệp & Kiểm Tra Tính Toàn Vẹn (SHA-256 Checksum)

- **Tổng số tệp mã nguồn đã sao chép**: **496 tệp**
- **Tổng số tệp/thư mục đã loại trừ**: **16.411 mục**
- **Số tệp có mã băm sai lệch (Hash Mismatch)**: **0 tệp (100% Khớp tuyệt đối)**

### Cơ chế kiểm tra tính toàn vẹn:
Mỗi tệp mã nguồn trước khi và sau khi sao chép đều được tính toán mã băm mật mã SHA-256 bằng thuật toán `Get-FileHash -Algorithm SHA256`. 
Kết quả: 100% checksum của các tệp tại `d:\Project\404Studio\backend\` khớp chính xác từng bit với bản gốc tại `D:\Project\REACT-WebFashion\back-end\`.

---

## 3. Danh Mục Các Tệp Được Sao Chép

1. **Toàn bộ thư mục `src/`**:
   - `src/common/`: Logger Winston và hằng số hệ thống.
   - `src/configs/`: Cấu hình MongoDB, Redis, biến môi trường, đối tác vận chuyển GHN.
   - `src/cron/`: Các cron jobs (voucher, order, campaign).
   - `src/middlewares/`: Auth middleware, error middleware, rate limiting, maintenance.
   - `src/modules/`: 22 module nghiệp vụ đầy đủ:
     - `ai/`, `auth/`, `banners/`, `campaigns/`, `carts/`, `categories/`, `communication/`, `favorites/`, `inventory/`, `orders/`, `pages/`, `pageSections/`, `payments/`, `products/`, `recommendations/`, `reviews/`, `shipping/`, `tracking/`, `uploads/`, `users/`, `vouchers/`, `websiteSettings/`.
   - `src/queues/`: BullMQ queues và workers (email, tracking, AI vector sync).
   - `src/routes/`: Root router và toàn bộ route con.
   - `src/sockets/`: Socket.IO realtime server handlers.
   - `src/utils/`: Công cụ xử lý tiện ích.
   - `src/app.js`: Express application setup & middleware stack.
   - `src/server.js`: Server entrypoint & lifecycle management.
   - `src/worker.js`: Tiến trình worker độc lập.
2. **Dữ liệu hạt giống `seed/`**:
   - `seed-demo-catalog.js`, `create-test-users.js`, `pages.js`, `update_vouchers.js`, v.v.
3. **Hình ảnh tĩnh và tải lên `uploads/`**:
   - Lưu trữ các hình ảnh mẫu phục vụ hiển thị sản phẩm và lookbook ban đầu.
4. **Cấu hình & Docker**:
   - `package.json`, `package-lock.json`
   - `Dockerfile`, `Dockerfile.worker`, `.dockerignore`, `.gitignore`
   - `eslint.config.js`, `jest.config.js`
   - `API_TEST.http`, `REACT-WebFashion-API.postman_collection.json`
   - `.env.example` (Mẫu biến môi trường phát triển đã làm sạch bí mật)

---

## 4. Danh Mục Các Tệp Đã Loại Trừ An Toàn (Excluded Files)

Tuân thủ nghiêm ngặt quy tắc an toàn bảo mật dữ liệu:
- `node_modules/`: Không sao chép thư viện đã biên dịch để tránh phình dung lượng và xung đột môi trường.
- `.env`, `.env.staging`, `.env.local`: Không sao chép các tệp chứa thông tin bí mật, khóa API và mật khẩu thật.
- `backups/`: Loại trừ các bản sao lưu database/code cũ.
- `*.log`, `.cache/`, `tmp/`: Loại trừ toàn bộ tệp nhật ký và bộ nhớ đệm tạm thời.

---

## 5. Đánh Giá Tác Động Cấu Trúc Thư Mục (Root vs `frontend/`)

Theo chỉ dẫn của Master Prompt:
*“Nếu Frontend hiện đang nằm trực tiếp ở root, hãy đánh giá trước tác động của việc chuyển sang frontend/. Chỉ tổ chức lại thư mục nếu có thể bảo toàn Git history, import paths, scripts và cấu hình triển khai.”*

### Phân tích đánh giá:
1. **Phương án chuyển Frontend sang `frontend/`**:
   - Khiến hơn 130 tệp Frontend đã commit bị đổi đường dẫn trong Git.
   - Làm gãy các kịch bản thực thi hiện tại: `npm run dev`, `npm run build`, `npm run test`, `npx playwright test`.
   - Cần cấu hình lại toàn bộ workspace monorepo (`package.json` workspaces), Vite alias, Vitest config và Playwright config.
2. **Phương án giữ Frontend tại Root và đặt Backend trong `backend/`**:
   - **Ưu điểm vượt trội**:
     - Bảo toàn 100% Git history của Frontend ThreeUI.
     - Giữ nguyên toàn bộ cấu hình `@/pages/*`, `@/shared/*`, Vitest và Playwright 24 test scenarios.
     - Cấu trúc thư mục sạch sẽ: `backend/` độc lập hoàn toàn, dễ dàng cài đặt `cd backend && npm install`.
     - Dễ dàng thiết lập Vite Proxy chuyển tiếp `/api` và `/uploads` sang `http://localhost:5000` mà không cần chỉnh sửa Backend.
   - **Quyết định**: Áp dụng phương án đặt Backend tại `backend/` và bổ sung các script điều phối tại root `package.json` (`npm run backend:dev`, `npm run backend:start`, `npm run dev:all`), đồng thời tạo `docker-compose.yml` để khởi chạy đồng thời.
