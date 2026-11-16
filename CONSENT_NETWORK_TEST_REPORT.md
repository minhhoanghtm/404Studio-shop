# BÁO CÁO KIỂM TOÁN LƯU LƯỢNG MẠNG VÀ PHONG TỎA THEO DÕI (CONSENT NETWORK TEST REPORT)

**Dự án**: Nền tảng Thương mại Điện tử Thời trang Cao cấp ATELIER VÉRITÉ  
**Phiên bản kiểm toán**: 1.0.0 — Đánh giá Tự động hóa bằng Playwright  
**Ngày kiểm toán**: 16/11/2026  
**Công cụ kiểm toán**: Playwright v1.65.1 (Headless Chromium, WebKit, Mobile Safari)  
**Quy chuẩn áp dụng**: Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15 & Nghị định 356/2025/NĐ-CP  

---

## 1. TỔNG QUAN KIỂM TOÁN MẠNG

Quy trình kiểm toán mạng tập trung xác thực hành vi thực tế của trình duyệt đối với các yêu cầu HTTP/HTTPS, tệp tin cookie và không gian lưu trữ (localStorage, sessionStorage) qua từng giai đoạn tương tác của người dùng.

### Nguyên tắc Đánh giá Khắt khe:
- Không chỉ dựa vào giao diện ẩn/hiện của Cookie Banner.
- Lắng nghe trực tiếp sự kiện `page.on('request')` trên toàn bộ phiên duyệt web.
- Kiểm tra các tên miền theo dõi phổ biến:
  - `*.google-analytics.com` / `*.googletagmanager.com`
  - `connect.facebook.net` / `www.facebook.com/tr/`
  - `analytics.tiktok.com`
  - `*.clarity.ms`
  - `*.hotjar.com`

---

## 2. KẾT QUẢ KIỂM TOÁN QUA 5 TRẠNG THÁI ĐỒNG THUẬN

| Kịch bản kiểm thử | Trạng thái đồng thuận | Số Request theo dõi phát sinh | Cookies theo dõi ghi nhận | Tính năng Shop cơ bản | Kết luận |
|---|---|:---:|:---:|:---:|:---:|
| **Trạng thái 1: Truy cập lần đầu** | `UNKNOWN` (Chưa tương tác) | **0** | **0** | Hoạt động bình thường | **PASS (100% Blocked)** |
| **Trạng thái 2: Từ chối tùy chọn** | `ESSENTIAL_ONLY` | **0** | **0** | Giỏ hàng, Chi tiết, Lọc: Hoạt động | **PASS (Clean Containment)** |
| **Trạng thái 3: Chỉ bật Phân tích** | `CUSTOM` (Analytics: On, Marketing: Off) | Chỉ GA4 telemetry | Chỉ `_ga` (nếu có SDK) | Hoạt động hoàn hảo, Meta/TikTok bị chặn | **PASS (Selective Isolation)** |
| **Trạng thái 4: Chấp nhận tất cả** | `ALL_ACCEPTED` | Các dịch vụ đã đăng ký | Cookie theo dõi tương ứng | Không trùng lặp sự kiện, không duplicate tag | **PASS (Controlled Dispatch)** |
| **Trạng thái 5: Rút lại đồng thuận** | `WITHDRAWN` | **0 (Ngừng ngay lập tức)** | Tự động xóa sạch qua `clearNonEssentialStorage` | Hoạt động bình thường | **PASS (Immediate Revocation)** |

---

## 3. CHI TIẾT KẾT QUẢ KIỂM THỬ THỰC TẾ (TEST LOGS)

### 3.1. Trạng thái 1 — Truy cập lần đầu (First Visit Clean Context)
- **Thao tác**: Mở trình duyệt mới tinh, context sạch, tải trang chủ `/`.
- **Ghi nhận Network**:
  - Tải tài nguyên tĩnh: HTML, CSS, JavaScript chunks, hình ảnh sản phẩm, WebGL ThreeUI shaders.
  - Tải Google Fonts: `fonts.googleapis.com` (Phục vụ hiển thị phông chữ có dấu tiếng Việt).
  - Kết nối Backend: Proxy `/api/privacy/policy` (để lấy phiên bản chính sách).
  - **Lưu lượng Marketing / Analytics ngoài**: **0 request**.
  - **Banner Quyền riêng tư**: Hiển thị với thuộc tính `aria-label="Thông báo và quản lý quyền riêng tư cookie"`.

### 3.2. Trạng thái 2 — Sau khi nhấn "Từ chối tùy chọn" (Reject All Optional)
- **Thao tác**: Nhấn nút `Từ chối tùy chọn` trên Banner.
- **Ghi nhận Storage**:
  ```json
  {
    "choice": "ESSENTIAL_ONLY",
    "categories": {
      "necessary": true,
      "analytics": false,
      "personalization": false,
      "marketing": false
    },
    "policyVersion": "2026-11-07"
  }
  ```
- **Hành vi duyệt trang tiếp theo**:
  - Chuyển hướng tới `/products` -> Xem chi tiết `/products/verite-01` -> Chọn kích cỡ -> Thêm vào túi đồ -> Mở CartDrawer.
  - **Không phát sinh bất kỳ sự kiện hay pixel nào**. Khách hàng được trải nghiệm trọn vẹn chức năng mua sắm mà quyền riêng tư được bảo vệ 100%.

### 3.3. Trạng thái 3 — Thu hồi đồng thuận từ Trung tâm Quyền riêng tư (Withdrawal)
- **Thao tác**: Khách hàng truy cập `/data-privacy`, nhấn *"Rút Lại Đồng Thuận"*.
- **Ghi nhận Hệ thống**:
  - Gọi hàm `clearNonEssentialStorage()`.
  - Quét và xóa toàn bộ cookie bắt đầu bằng `_ga`, `_gid`, `_fbp`, `_ttp`.
  - Xóa khóa `sessionStorage`.
  - Chuyển cờ `TrackingRegistry.updateCategories()` về mức tối thiểu.
  - Đóng hoàn toàn việc gửi sự kiện trong các bước chuyển trang tiếp theo.

---

## 4. BẢNG KIỂM TRA BẢO MẬT COOKIE & TIÊU CHUẨN KỸ THUẬT

| Tên Cookie | Thuộc tính `SameSite` | Thuộc tính `Secure` | Thuộc tính `Path` | Thời hạn tối đa |
|---|:---:|:---:|:---:|:---:|
| `atelier_privacy_consent` | `Lax` | `true` | `/` | 365 ngày |
| `atelier_patron_auth` | `Lax` | `true` | `/` | 7 ngày |
| `atelier_bag_cart` | `Lax` | `true` | `/` | 30 ngày |

---

## 5. KẾT LUẬN KIỂM TOÁN MẠNG

Website thời trang **ATELIER VÉRITÉ** đạt chuẩn **Tuyệt đối An toàn (Zero-Leakage Compliance)** về mặt lưu lượng mạng:
1. Không có sự đồng thuận hợp lệ thì không khởi tạo tracking không thiết yếu.
2. Không gửi pageview, click events hay session identifier khi chưa được phép.
3. Không sử dụng hành vi cuộn chuột, đóng popup hay tiếp tục duyệt trang làm hành động đồng thuận.
