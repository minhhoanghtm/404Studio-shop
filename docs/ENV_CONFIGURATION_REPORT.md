# BÁO CÁO CẤU HÌNH BIẾN MÔI TRƯỜNG (ENVIRONMENT CONFIGURATION)
## DỰ ÁN: ATELIER VÉRITÉ — THREEUI FASHION E-COMMERCE
**Thời điểm thực hiện:** 16/11/2026 23:53 (ICT)  
**Tiêu chuẩn áp dụng:** 12-Factor App & OWASP Security Configuration Management  

---

### 1. TỔNG QUAN PHÂN TẦNG BIẾN MÔI TRƯỜNG

Hệ thống được chuẩn hóa theo mô hình phân tách rõ ràng giữa Frontend (Browser Runtime) và Backend (Node.js Server Runtime):

1. **Frontend (`VITE_*`):**
   - Chỉ chứa các tham số công khai không nhạy cảm được phép đóng gói vào client bundle.
   - Tuyệt đối không chứa database credentials, token secrets hoặc private keys.
2. **Backend (`backend/`):**
   - Chứa thông tin cấu hình dịch vụ, database, redis, payment gateways và secret keys.
   - Được nạp qua `dotenv` tại thời điểm khởi động server (`backend/src/server.js`).
3. **Container Orchestration (`Docker / Compose`):**
   - Nạp các biến động qua `compose.yaml` hoặc GitHub Secrets trong CI/CD.

---

### 2. BẢNG CHI TIẾT DANH MỤC BIẾN MÔI TRƯỜNG

| Tên biến | Phạm vi | Bắt buộc | Mục đích sử dụng | Giá trị mặc định / Mẫu dev an toàn |
| :--- | :--- | :--- | :--- | :--- |
| `VITE_API_URL` | Frontend | Không | Địa chỉ gốc cho REST API client | `/api` |
| `VITE_GOOGLE_CLIENT_ID` | Frontend | Không | Google Web OAuth Client ID | `your-id.apps.googleusercontent.com` |
| `VITE_APP_ENV` | Frontend | Không | Định danh môi trường chạy app | `development` |
| `PORT` | Backend | Không | Cổng dịch vụ Express | `5000` |
| `NODE_ENV` | Backend | Có | Chế độ runtime Node.js | `development` / `production` |
| `MONGO_CONNECTIONSTRING` | Backend | **Có** | Kết nối CSDL MongoDB | `mongodb://127.0.0.1:27017/webfashion_dev` |
| `REDIS_URL` | Backend | **Có** | Kết nối Redis cache & queue | `redis://127.0.0.1:6379` |
| `ACCESS_TOKEN_SECRET` | Backend | **Có** | Ký JWT Access Token (>= 32 chars) | `dev_insecure_access_token_secret...` |
| `REFRESH_TOKEN_SECRET` | Backend | **Có** | Ký JWT Refresh Token (>= 32 chars) | `dev_insecure_refresh_token_secret...` |
| `ACTION_SECRET` | Backend | **Có** | Ký link xác thực email/action | `dev_insecure_action_secret...` |
| `OTP_SECRET` | Backend | **Có** | Mã hóa OTP xác thực | `dev_insecure_otp_secret...` |
| `EMAIL_USER` | Backend | Tùy chọn | Tài khoản gửi thư điện tử SMTP | `dev_test_mailer@example.com` |
| `EMAIL_PASS` | Backend | Tùy chọn | Mật khẩu ứng dụng SMTP | `your_dummy_app_password` |
| `OPENROUTER_API_KEY` | Backend | Tùy chọn | API Key trợ lý tư vấn AI | `sk-or-v1-dummy_openrouter_dev_api_key...` |
| `GHN_TOKEN` | Backend | Tùy chọn | Token đối tác vận chuyển GHN | `your_ghn_sandbox_token` |
| `MOMO_PARTNER_CODE` | Backend | Tùy chọn | Mã đối tác MoMo Sandbox | `MOMO` |
| `VNP_TMNCODE` | Backend | Tùy chọn | Mã website VNPay Sandbox | `your_vnpay_dev_tmncode` |

---

### 3. KIỂM THỬ XÁC MINH BẢO MẬT BIẾN MÔI TRƯỜNG

- [x] Không sao chép chuỗi kết nối MongoDB Atlas thật vào `.env.example`.
- [x] Không ghi API key OpenRouter hoặc Gmail App Password thật vào `.env.example`.
- [x] Không đưa secret production vào comments hay tài liệu hướng dẫn.
- [x] Tệp `.env` cục bộ đã được chặn tuyệt đối bởi `.gitignore` tại root và không nằm trong staged index.
- [x] Tất cả biến `VITE_*` không chứa bất kỳ secret nào.
