# BÁO CÁO KỸ THUẬT TRIỂN KHAI HỆ THỐNG QUẢN TRỊ ĐỒNG THUẬN (CONSENT IMPLEMENTATION REPORT)

**Dự án**: Nền tảng Thương mại Điện tử Thời trang Cao cấp ATELIER VÉRITÉ  
**Phiên bản hệ thống**: 1.0.0 — Kiến trúc Bảo vệ Dữ liệu Cá nhân  
**Ngày lập**: 16/11/2026  
**Căn cứ pháp lý**: Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15 & Nghị định 356/2025/NĐ-CP  
**Trạng thái**: IMPLEMENTED & TESTED  

---

## 1. TỔNG QUAN KIẾN TRÚC QUẢN TRỊ ĐỒNG THUẬN

Hệ thống Quản trị Đồng thuận (Consent Management System) trên **ATELIER VÉRITÉ** được thiết kế từ đầu với nguyên tắc cốt lõi: **Không có sự đồng thuận hợp lệ thì không khởi tạo bất kỳ công nghệ theo dõi không thiết yếu nào (Prior Consent Blocking)**.

### Sơ đồ luồng xử lý đồng thuận (Consent Flowchart):

```
                        [Khách hàng truy cập lần đầu]
                                     │
                    [Kiểm tra Consent trong Storage]
                                     │
                 ┌───────────────────┴───────────────────┐
            [Chưa có / Hết hạn]                     [Đã có Consent hợp lệ]
                 │                                       │
      [MẶC ĐỊNH PHONG TỎA]                    [Tải danh mục được cấp phép]
   • Analytics: Disabled                   • Necessary: Active
   • Marketing: Disabled                   • Analytics: Căn cứ cấu hình
   • Personalization: Disabled             • Marketing: Căn cứ cấu hình
                 │                                       │
         [Hiển thị Banner]                  [Vận hành website bình thường]
                 │
       ┌─────────┼─────────┐
       │         │         │
  [Chấp nhận] [Từ chối] [Tùy chỉnh]
       │         │         │
       └─────────┼─────────┘
                 │
      [Cập nhật TrackingRegistry]
                 │
     [Xóa cookie nếu bị từ chối]
                 │
    [Đồng bộ Backend & localStorage]
```

---

## 2. CHI TIẾT CÁC MODULE KỸ THUẬT TRIỂN KHAI

Hệ thống được tổ chức hoàn chỉnh theo cấu trúc module độc lập trong `src/shared/consent/` và `src/shared/tracking/`:

### 2.1. `src/shared/consent/ConsentStorage.ts`
- **Mục đích**: Lưu trữ bền vững, quản lý phiên bản chính sách và dọn dẹp cookie.
- **Khóa lưu trữ**:
  - `atelier_privacy_consent`: Bản ghi JSON lưu trạng thái lựa chọn (`choice`), trạng thái từng danh mục (`categories`), phiên bản chính sách (`policyVersion`) và dấu thời gian ISO (`timestamp`).
  - `atelier_anon_id`: Mã định danh UUID v4 ẩn danh duy nhất cho thiết bị.
  - `atelier_anon_token`: Chuỗi token bảo mật chống giả mạo khi khách ẩn danh muốn xóa dữ liệu.
- **Kiểm soát phiên bản (Version Validation)**:
  - So khớp nghiêm ngặt với `CANONICAL_POLICY_VERSION = '2026-11-07'`.
  - Nếu bản ghi trong máy khách có phiên bản cũ (ví dụ chính sách cũ trước khi ban hành Luật 91/2025/QH15), hàm `loadConsentRecord()` lập tức trả về `null`, tự động kích hoạt lại Banner để khách hàng tái đồng thuận theo quy chuẩn mới.
- **Cơ chế dọn dẹp Cookie (`clearNonEssentialStorage`)**:
  - Quét và xóa toàn bộ cookie bắt đầu bằng các tiền tố: `_ga`, `_gid`, `_gat`, `_fbp`, `_fbc`, `_ttp`, `_clck`, `_clsk`.
  - Xóa sạch dữ liệu tracking trong `sessionStorage`.

### 2.2. `src/shared/tracking/TrackingRegistry.ts`
- **Mục đích**: Cơ quan kiểm soát trung tâm toàn bộ công cụ theo dõi bên thứ nhất và bên thứ ba.
- **Cơ chế Sandbox Stubs**:
  - Thiết lập các hàm `window.gtag` và `window.fbq` an toàn. Nếu nhóm tương ứng chưa được cấp phép, các lời gọi hàm sẽ bị hủy bỏ (Hard Drop) ngay lập tức tại tầng client mà không phát sinh bất kỳ HTTP Request nào ra bên ngoài.
- **Hàm `trackPageView(path)`**:
  - Kiểm tra trạng thái `this.activeCategories.analytics`.
  - Chỉ gửi sự kiện `page_view` khi và chỉ khi khách hàng đã bật nhóm Phân tích.

### 2.3. `src/shared/consent/useConsentStore.ts`
- **Mục đích**: Zustand store quản lý trạng thái phản ứng thời gian thực (Reactive State).
- **Hành động (Actions)**:
  - `initializeConsent()`: Nạp từ storage khi ứng dụng khởi động.
  - `acceptAll()`: Thiết lập toàn bộ danh mục thành `true`, lưu storage, đóng banner, đồng bộ API.
  - `rejectOptional()`: Thiết lập `analytics = false`, `personalization = false`, `marketing = false`; dọn sạch cookie tùy chọn, đóng banner, đồng bộ API.
  - `saveCustomPreferences(categories)`: Lưu lựa chọn phân tách từng nhóm cụ thể.
  - `withdrawConsent(category)`: Cho phép người dùng rút lại quyền bất kỳ lúc nào từ Footer hoặc Trung tâm quyền riêng tư.
  - `syncWithBackend(record)`: Gọi API `PUT /api/privacy/consent` với headers `X-Anonymous-ID` để cập nhật cơ sở dữ liệu Backend.

### 2.4. `src/shared/consent/ConsentBanner.tsx`
- **Mục đích**: Giao diện thông báo quyền riêng tư nổi ở chân trang.
- **Tiêu chuẩn giao diện**:
  - Thiết kế cao cấp đồng bộ với Atelier Vérité (nền tối mờ, viền vàng champagne, phông chữ có chân Cormorant Garamond).
  - Trọng số thị giác cân bằng: Cả hai nút **"Chấp nhận tất cả"** và **"Từ chối tùy chọn"** đều được bố trí rõ ràng, dễ bấm, không sử dụng Dark Patterns (không làm mờ hay giấu nút từ chối).
  - Có nút **"Tùy chỉnh"** mở bảng cấu hình chuyên sâu và liên kết tới trang **Chính sách Cookie**.

### 2.5. `src/shared/consent/ConsentPreferencesModal.tsx`
- **Mục đích**: Bảng điều khiển chi tiết cho phép bật/tắt độc lập từng nhóm cookie:
  - **Nhóm 1: Cookie Thiết yếu**: Luôn bật, khóa trạng thái (`disabled`), biểu tượng ổ khóa bảo mật.
  - **Nhóm 2: Cookie Phân tích (GA4, Telemetry)**: Công tắc chuyển đổi toggle switch.
  - **Nhóm 3: Cookie Cá nhân hóa (Stylist AI, Theme)**: Công tắc chuyển đổi toggle switch.
  - **Nhóm 4: Cookie Tiếp thị & Quảng cáo (Meta, TikTok)**: Công tắc chuyển đổi toggle switch.
- Mỗi nhóm đều có thông tin đơn vị cung cấp, mục đích xử lý và thời hạn lưu trữ cụ thể.

### 2.6. `src/shared/consent/ConsentProvider.tsx`
- **Mục đích**: Bao bọc toàn bộ ứng dụng React, đồng bộ trạng thái đồng thuận đa tab thông qua sự kiện `window.addEventListener('storage', ...)`.

---

## 3. RÀ SOÁT VÀ CHUẨN HÓA CÁC CHECKBOX TRÊN TOÀN BỘ FORM

Toàn bộ các biểu mẫu thu thập dữ liệu trên website đã được rà soát và chuẩn hóa:

| Biểu mẫu | Vị trí tệp | Thông báo mục đích trước thu thập | Checkbox Điều khoản | Checkbox Quyền riêng tư | Checkbox Tiếp thị (Tùy chọn) | Mặc định bỏ chọn |
|---|---|:---:|:---:|:---:|:---:|:---:|
| **Đăng ký tài khoản** | `src/pages/Auth/RegisterPage.tsx` | Có (Khung thông báo nổi bật) | Có (`*`) | Có (`*`) | Có (Tùy chọn) | **100% Unchecked** |
| **Thanh toán đơn hàng** | `src/pages/Checkout/components/CheckoutSummary.tsx` | Có (Thông báo GHN & Cổng MoMo/VNPAY) | Có (`*`) | Có (`*`) | Có (Tùy chọn) | **100% Unchecked** |
| **Đặt lịch hẹn Salon** | `src/pages/Contact/ContactPage.tsx` | Có (Thông báo Concierge Desk) | — | Có (`*`) | Có (Tùy chọn) | **100% Unchecked** |
| **Gửi đánh giá tác phẩm**| `src/pages/Reviews/CreateReviewPage.tsx` | Có (Thông báo quyền riêng tư bài đăng) | — | Có (`*`) | Có (Tùy chọn) | **100% Unchecked** |
| **Đăng ký nhận bản tin** | `src/shared/components/Footer.tsx` | Có (Mục đích Runway Show & Lookbook) | — | — | Có (Bắt buộc riêng cho newsletter) | **100% Unchecked** |
| **Yêu cầu quyền dữ liệu**| `src/pages/DataPrivacyRequest/DataPrivacyRequestPage.tsx` | Có (Thông báo xử lý DPO theo Luật 91/2025) | — | Có (`*`) | — | **100% Unchecked** |

---

## 4. KẾT LUẬN & ĐÁNH GIÁ CHẤT LƯỢNG

Hệ thống quản trị đồng thuận đã hoàn thành và đáp ứng 100% các tiêu chuẩn nghiêm ngặt nhất của **Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15** và **Nghị định 356/2025/NĐ-CP**. Mọi hành vi thu thập đều minh bạch, tự nguyện, không gộp mục đích và hoàn toàn trao quyền kiểm soát lại cho khách hàng.
