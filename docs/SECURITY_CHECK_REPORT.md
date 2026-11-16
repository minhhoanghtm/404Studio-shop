# BÁO CÁO KIỂM TRA BẢO MẬT & QUYỀN RIÊNG TƯ (SECURITY & PRIVACY CHECK REPORT)
## DỰ ÁN: ATELIER VÉRITÉ — THREEUI FASHION E-COMMERCE
**Thời điểm thực hiện:** 17/11/2026 00:07 (ICT)  
**Tiêu chuẩn kiểm tra:** Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15, Nghị định 356/2025/NĐ-CP, OWASP Top 10 Web Application Security, CIS Docker Benchmark  

---

### 1. KIỂM SOÁT THỰC THI QUYỀN RIÊNG TƯ & COOKIE CONSENT

| Tiêu chí kiểm tra | Trạng thái | Minh chứng kỹ thuật |
| :--- | :--- | :--- |
| **Chặn trước tracking không thiết yếu (Prior Consent Blocking)** | **PASS** | Trạng thái ban đầu luôn là `UNKNOWN` với chỉ `necessary: true`. Toàn bộ `gtag`, `fbq`, `ttq`, `criteo` bị drop cứng trong [TrackingRegistry.ts](file:///d:/Project/404Studio/src/shared/tracking/TrackingRegistry.ts). |
| **Không tải SDK phân tích/tiếp thị khi người dùng Từ Chối** | **PASS** | Đã thẩm tra qua Playwright `Test B: Reject All Optional` (24/24 test passed). |
| **Bình đẳng thị giác trên Cookie Banner** | **PASS** | Hai nút "Chấp nhận tất cả" và "Từ chối tùy chọn" có cùng kích thước và độ ưu tiên thị giác, không sử dụng Dark Patterns. |
| **Tách biệt hoàn toàn Cookie Policy và Privacy Policy** | **PASS** | Tuyến đường `/cookie-policy` độc lập với bảng phân loại kỹ thuật chi tiết. |
| **Bóc tách Checkbox biểu mẫu (Unbundled Consent)** | **PASS** | Tất cả form Đăng ký, Thanh toán, Liên hệ, Đánh giá, Bản tin Footer không bao giờ tick sẵn (`defaultChecked={false}`). |
| **Thông báo mục đích trước khi thu thập (Prior Notice)** | **PASS** | Biểu mẫu `/data-privacy/request` hiển thị thẻ cảnh báo mục đích và phạm vi xử lý dữ liệu trước khi người dùng gửi yêu cầu. |

---

### 2. KIỂM SOÁT AN TOÀN MÃ NGUỒN & CLIENT BUNDLE

- **Kiểm tra Token & PII trong Client Bundle (`dist/`):**
  - Quét tự động bằng regex: Không có bất kỳ token JWT thật, API key OpenRouter thật, hay chuỗi kết nối MongoDB Atlas nào bị rò rỉ vào mã nguồn phía browser.
- **Kiểm tra Secrets trong Docker Images:**
  - File `.dockerignore` tại root và `backend/.dockerignore` đã loại bỏ triệt để file `.env`, `*.key`, `*.pem`, `credentials.json`.
- **Kiểm tra CI/CD Pipeline Artifacts:**
  - Không upload bất kỳ file môi trường hoặc dữ liệu khách hàng nào lên GitHub Actions Artifacts.

---

### 3. KẾT LUẬN ĐÁNH GIÁ AN TOÀN

Hệ thống đạt chuẩn an toàn thông tin theo yêu cầu của Phase 8. Cổng kiểm tra bảo mật và quyền riêng tư: **PASS**.
