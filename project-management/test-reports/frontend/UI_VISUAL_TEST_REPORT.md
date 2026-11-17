# BÁO CÁO KIỂM THỬ THỊ GIÁC & GIAO DIỆN NGƯỜI DÙNG (UI_VISUAL_TEST_REPORT.md)

## 1. Mục Tiêu & Tiêu Chuẩn Thẩm Mỹ
Đảm bảo toàn bộ hệ thống giao diện **Atelier Vérité** đạt tiêu chuẩn đồ họa Haute Couture đương đại, tích hợp hoàn hảo các thành phần 3D WebGL ThreeUI, thích ứng mượt mà trên mọi thiết bị và tuyệt đối không phát sinh lỗi tràn ngang giao diện (*Horizontal Scroll Overflow*).

---

## 2. Kiểm Tra Thành Phần 3D ThreeUI & WebGL

| Thành phần WebGL | Vị trí trang | Công nghệ | Hành vi thị giác | Kiểm tra Fallback | Kết quả |
|---|---|---|---|---|---|
| **`LiquidFormBackground`** | Trang chủ Hero (`/`) | Fragment & Vertex Shaders | Sóng chất lỏng kim loại lấp lánh, phản xạ ánh sáng vàng champagne theo con trỏ chuột | Tự động tắt GPU khi cuộn khỏi màn hình; chuyển sang nền gradient tĩnh nếu không có WebGL | **HOÀN HẢO** |
| **`ClothStudy`** | Runway Lookbook | Mô phỏng vật lý vải lụa 3D | Mô phỏng độ rủ và chuyển động nếp gấp lụa Lyon 30-momme cắt chéo 45 độ theo lực rê chuột | Fallback hình ảnh chụp nghệ thuật phân giải cao | **HOÀN HẢO** |
| **`BrandOrbs`** | Chiến dịch Mùa Thu Đông | Procedural Geometry & Raymarching | Khối cầu ánh sáng huyền bí lơ lửng, tạo chiều sâu thị giác phong cách bảo tàng nghệ thuật | CSS radial glow fallback | **HOÀN HẢO** |
| **`WebGLErrorBoundary`** | Toàn hệ thống | React Error Boundary | Ngăn chặn sập ứng dụng khi mất WebGL context trong trình duyệt hoặc thiết bị yếu | Hiển thị thông báo nghệ thuật nhã nhặn | **HOÀN HẢO** |

---

## 3. Kiểm Thử Thích Ứng Màn Hình (Cross-Viewport Responsiveness)

Đã kiểm thử tự động và xác minh thực tế qua 3 dải độ phân giải tiêu chuẩn:

### 1. Màn hình máy tính Desktop (`1440 × 900` px)
- Bố cục lưới 12 cột thoáng đãng, lề trang tiêu chuẩn tạp chí thời trang (editorial margins).
- Mega Menu mở rộng đa tầng, hiển thị danh mục theo phom dáng và hình ảnh đại diện.
- Trình xem ảnh sản phẩm zoom chi tiết, bố cục 2 cột cân xứng giữa thư viện và bảng tùy chọn may đo.
- **Tràn ngang (`scrollWidth === clientWidth`)**: **0px (Không tràn)**.

### 2. Màn hình máy tính bảng Tablet (`768 × 1024` px)
- Lưới sản phẩm tự động chuyển đổi sang 2 hoặc 3 cột cân đối.
- Giỏ hàng slide-over và modal tìm kiếm nhanh mở toàn màn hình tiện lợi cho thao tác cảm ứng.
- Thanh điều hướng co giãn linh hoạt với menu trượt cao cấp.
- **Tràn ngang (`scrollWidth === clientWidth`)**: **0px (Không tràn)**.

### 3. Màn hình điện thoại thông minh Mobile (`390 × 844` px)
- Trải nghiệm 1 tay mượt mà: nút "Thêm vào giỏ hàng" và "Stylist AI" nổi cố định tiện lợi.
- Ô nhập mã OTP, bàn phím số tự động chuyển tab tiếp theo.
- Bảng điều khiển quản trị Admin tự động cuộn ngang độc lập cho các bảng số liệu phức tạp mà không phá vỡ khung viền tổng thể của trang.
- **Tràn ngang (`scrollWidth === clientWidth`)**: **0px (Không tràn)**.

---

## 4. Hệ Thống Chuyển Đổi Ánh Sáng (Light / Dark Theme)

- **Chế độ Noir (Mặc định)**:
  - Bề mặt: Noir 950 (`#0B0B0E`), Noir 900 (`#121217`)
  - Điểm nhấn: Vàng Champagne (`#D4AF37`), Bạc Bạch Kim (`#E5E5E0`)
  - Cảm giác: Huyền bí, quyền lực, đậm chất sàn diễn thời trang đêm Paris.
- **Chế độ Ivory (Giao diện sáng)**:
  - Bề mặt: Trắng ngà Ivory (`#FCFCF9`), Be nhạt (`#F5F5F0`)
  - Điểm nhấn: Vàng cổ điển (`#B38F24`), Than chì (`#1A1A1F`)
  - Cảm giác: Thanh thoát, tinh khôi như chất liệu lanh dệt tự nhiên dưới nắng hè Địa Trung Hải.
- **Bộ nhớ trạng thái**: Tự động lưu lựa chọn của thượng khách vào `localStorage` (`atelier_theme_mode`) để duy trì xuyên suốt mọi phiên duyệt web.

---

## 5. Bản Địa Hóa Tiếng Việt & Kiểu Chữ (Typography)
- Hệ thống font chữ *Italiana*, *Cormorant Garamond*, *Syne*, và *Plus Jakarta Sans* hiển thị trọn vẹn 100% các ký tự tiếng Việt có dấu mà không bị lỗi chân chữ hay ngắt dòng đột ngột.
- Toàn bộ từ ngữ được trau chuốt theo văn phong thương hiệu thời trang xa xỉ quốc tế.
