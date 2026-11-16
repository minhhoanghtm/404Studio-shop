# BÁO CÁO KỸ THUẬT TIẾP NHẬN VÀ XỬ LÝ YÊU CẦU XÓA DỮ LIỆU CÁ NHÂN (DATA DELETION REQUEST REPORT)

**Dự án**: Nền tảng Thương mại Điện tử Thời trang Cao cấp ATELIER VÉRITÉ  
**Phiên bản hệ thống**: 1.0.0 — Thực thi Quyền của Chủ thể Dữ liệu  
**Ngày lập**: 16/11/2026  
**Căn cứ pháp lý**: Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15 & Luật Kế toán 88/2015/QH13  
**Trạng thái**: IMPLEMENTED & TESTED  

---

## 1. MỤC TIÊU & NGUYÊN TẮC THIẾT KẾ

Chức năng tiếp nhận và xử lý yêu cầu quyền dữ liệu cá nhân (Right to Erasure / Data Portability / Restriction) được thiết kế nhằm đáp ứng trọn vẹn Điều 12 và Điều 13 của **Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15**, đồng thời hài hòa tuyệt đối với nghĩa vụ lưu trữ hồ sơ tài chính theo **Luật Kế toán số 88/2015/QH13**.

### Các nguyên tắc bất khả xâm phạm:
1. **Xác thực danh tính chủ thể (Identity Verification)**: Ngăn chặn triệt để hành vi giả mạo yêu cầu xóa dữ liệu của người khác bằng cơ chế bắt buộc nhập lại mật khẩu tài khoản (Re-authentication) đối với hội viên hoặc xác thực qua email đối với khách vãng lai.
2. **Minh bạch phạm vi xóa (Scope Disclosure)**: Thông báo công khai trước khi gửi về những dữ liệu sẽ bị xóa hoàn toàn và những dữ liệu phải được ẩn danh hóa theo luật kế toán.
3. **Tuyệt đối trung thực về trạng thái xử lý**: Hệ thống **không bao giờ hiển thị thông báo "Đã xóa thành công"** khi thực tế yêu cầu mới chỉ được tiếp nhận hoặc đang trong quá trình xử lý hành chính.

---

## 2. QUY TRÌNH TIẾP NHẬN & PHÂN LOẠI YÊU CẦU

Giao diện tại tuyến đường `/data-privacy/request` cho phép người dùng lựa chọn 4 loại quyền chính:

```
[Chủ thể truy cập /data-privacy/request]
                   │
         [Chọn loại quyền dữ liệu]
                   │
  ┌────────────────┼────────────────┬────────────────┐
  │                │                │                │
[ERASURE]       [EXPORT]        [RESTRICT]       [OBJECT]
(Xóa dữ liệu)   (Trích xuất)    (Hạn chế)        (Phản đối tiếp thị)
  │                │                │                │
  └────────────────┼────────────────┴────────────────┘
                   │
    [Xác thực danh tính bằng Mật khẩu]
                   │
      [Tích chọn cam kết nhận thức]
                   │
    [Gửi yêu cầu tới Backend API]
                   │
 ┌─────────────────┴─────────────────┐
[Thành công]                    [Lỗi xác thực]
 • Trả về mã yêu cầu (REQ-XXXX)  • Báo lỗi mật khẩu
 • Cập nhật trạng thái PENDING   • Không thay đổi dữ liệu
```

---

## 3. TÍCH HỢP VỚI HỆ THỐNG BACKEND THỰC TẾ

Hệ thống kết nối trực tiếp với các dịch vụ bảo vệ dữ liệu sẵn có trên Backend Express.js:

### 3.1. Yêu cầu xóa dữ liệu (`type: 'ERASURE'`)
- **API Endpoint**: `POST /api/privacy/data-requests`
- **Tầng dịch vụ Backend**: `dataSubject.service.js` -> hàm `erase(userId, currentPassword, reason)`
- **Cơ chế xử lý tại Backend**:
  1. Xác thực mật khẩu: `bcrypt.compare(currentPassword, user.passWord)`
  2. Xử lý nghĩa vụ kế toán: Cập nhật toàn bộ các bản ghi `Order` của khách hàng thành:
     ```json
     {
       "shipping_address.full_name": "[ĐÃ ẨN DANH]",
       "shipping_address.phone": "000000000",
       "shipping_address.city": "[ĐÃ ẨN DANH]",
       "shipping_address.district": "[ĐÃ ẨN DANH]",
       "shipping_address.ward": "[ĐÃ ẨN DANH]",
       "shipping_address.address_detail": "[ĐÃ ẨN DANH]",
       "personal_data_anonymized_at": "ISODate"
     }
     ```
  3. Xóa vĩnh viễn toàn bộ bản ghi lịch sử sự kiện theo dõi: `UserEvent.deleteMany({ user_id: user._id })`.
  4. Xóa vĩnh viễn các bản ghi đồng thuận cũ: `UserConsent.deleteMany({ subject_id: String(user._id) })`.
  5. Đổi trạng thái tài khoản: `user.status = 'deleted'`, ẩn danh hóa họ tên (`[ĐÃ ẨN DANH]`), xóa email, số điện thoại, địa chỉ và sinh mật khẩu ngẫu nhiên để vô hiệu hóa đăng nhập.
  6. Thu hồi toàn bộ phiên đăng nhập trên Redis: `authService.signOutAll(user._id)`.
  7. Ghi nhận nhật ký yêu cầu vào cơ sở dữ liệu `DataSubjectRequest` với mã trạng thái `completed` hoặc `pending`.

### 3.2. Yêu cầu trích xuất dữ liệu (`type: 'EXPORT'`)
- **API Endpoint**: `POST /api/privacy/data-export`
- **Tầng dịch vụ Backend**: `dataSubject.service.js` -> hàm `exportData(userId, currentPassword)`
- **Kết quả trả về**:
  - Giao diện tự động sinh tệp tin `atelier_data_export_[timestamp].json` tải trực tiếp về thiết bị của người dùng, bao gồm:
    - Hồ sơ tài khoản (đã loại trừ hash mật khẩu).
    - Lịch sử các đơn hàng đã đặt và sản phẩm chi tiết.
    - Lịch sử các sự kiện kỹ thuật đã ghi nhận.
    - Danh sách các quyết định đồng thuận quyền riêng tư.

### 3.3. Yêu cầu hạn chế xử lý (`type: 'RESTRICT'`)
- Đánh dấu cờ `user.processing_restricted_at = new Date()`, chuyển trạng thái `consent_status = 'denied'` và đặt lựa chọn thành `WITHDRAWN`.
- Vô hiệu hóa toàn bộ việc đưa dữ liệu vào thuật toán đề xuất thời trang hoặc phân tích hành vi.

---

## 4. QUẢN LÝ YÊU CẦU CHO KHÁCH HÀNG VÃNG LAI (GUEST FLOW)

Trường hợp khách hàng chưa tạo tài khoản hoặc đặt hàng ở chế độ vãng lai:
- Khách hàng điền địa chỉ email và số điện thoại đã sử dụng khi đặt hàng.
- Hệ thống tạo mã yêu cầu định danh duy nhất (ví dụ: `GST-A7B8C9`).
- Giao diện hiển thị rõ ràng thông báo:
  > *"Yêu cầu của quý khách đã được tiếp nhận. Đội ngũ DPO sẽ gửi email xác thực quyền sở hữu danh tính tới hộp thư của quý khách trong vòng 24 giờ làm việc."*
- Giúp khách hàng an tâm, không gây hiểu nhầm rằng dữ liệu đã bị xóa tức thì khi chưa qua bước xác minh danh tính.

---

## 5. BẢNG THEO DÕI TRẠNG THÁI YÊU CẦU TRÊN TRUNG TÂM QUYỀN RIÊNG TƯ

Khi khách hàng đăng nhập vào `/data-privacy`, hệ thống tự động gọi API `GET /api/privacy/data-requests` để kết xuất bảng nhật ký minh bạch:
- Mã định danh yêu cầu (`#REQ-ID`).
- Loại quyền đã yêu cầu (`ERASURE`, `EXPORT`, `RESTRICT`).
- Thời gian gửi yêu cầu (`requested_at`).
- Trạng thái tiến độ thực tế:
  - **Đang xử lý (Pending)**: Hiển thị nhãn vàng kèm biểu tượng đồng hồ đếm.
  - **Đã hoàn tất (Completed)**: Hiển thị nhãn xanh kèm thông báo hoàn tất.
  - **Từ chối (Rejected)**: Hiển thị nhãn đỏ nếu phát hiện thông tin giả mạo.
