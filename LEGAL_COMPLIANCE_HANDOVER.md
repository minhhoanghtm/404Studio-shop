# BIÊN BẢN BÀN GIAO TUÂN THỦ PHÁP LÝ, BẢO VỆ DỮ LIỆU CÁ NHÂN VÀ COOKIE CONSENT
## DỰ ÁN: ATELIER VÉRITÉ — NỀN TẢNG THỜI TRANG CAO CẤP THREEUI
**Phiên bản hệ thống:** v1.1.0-legal-compliance  
**Ngày bàn giao:** 16/11/2026  
**Chủ trì triển khai:** Senior Fullstack Architect, Creative Director & QA Automation Engineer  

---

## 1. TỔNG QUAN DỰ ÁN & CĂN CỨ PHÁP LÝ ÁP DỤNG

ATELIER VÉRITÉ đã hoàn tất xây dựng và kiểm thử toàn diện phân hệ bảo vệ dữ liệu cá nhân, kiểm soát quyền riêng tư và thực thi chấp thuận cookie (Consent Prior-Blocking) tuân thủ tuyệt đối khung khổ pháp luật hiện hành của Nước Cộng hòa Xã hội Chủ nghĩa Việt Nam:

1. **Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15** (Có hiệu lực thi hành; thay thế toàn bộ Nghị định 13/2023/NĐ-CP).
2. **Nghị định số 356/2025/NĐ-CP** quy định chi tiết thi hành một số điều của Luật Bảo vệ dữ liệu cá nhân.
3. **Luật Bảo vệ quyền lợi người tiêu dùng số 19/2023/QH15** và **Nghị định số 55/2024/NĐ-CP**.
4. **Luật Giao dịch điện tử số 20/2023/QH15** và **Nghị định 52/2013/NĐ-CP** (sửa đổi bởi Nghị định 85/2021/NĐ-CP về Thương mại điện tử).
5. **Luật Kế toán số 88/2015/QH13** quy định về bảo lưu chứng từ giao dịch thương mại từ 05 đến 10 năm.

---

## 2. MA TRẬN PHÂN LOẠI HẠNG MỤC BÀN GIAO (STATUS TAGS)

Các tính năng và tài liệu được phân loại theo 4 trạng thái chuẩn hóa:
- `[IMPLEMENTED]`: Đã lập trình hoàn thiện trong mã nguồn Frontend & kết nối Backend.
- `[TESTED]`: Đã vượt qua kiểm thử tự động (Unit Test Vitest 100% & Playwright E2E).
- `[NEEDS_BUSINESS_INFORMATION]`: Cần Ban Giám đốc cung cấp thông tin pháp nhân thực tế trước khi Go-Live.
- `[NEEDS_LEGAL_REVIEW]`: Cần luật sư nội bộ hoặc bộ phận pháp chế rà soát lần cuối trước khi nộp hồ sơ A05.

| Hạng mục | Trạng thái | Mô tả & Đường dẫn tệp / Route |
| :--- | :--- | :--- |
| **Cơ chế Chặn Trước Tracking (Prior Consent Blocking)** | `[IMPLEMENTED]` `[TESTED]` | Không phát sinh bất kỳ cookie `_ga*`, `_fbp`, `_ttp` hay pixel nào trước khi người dùng đồng ý. (`src/shared/consent/ConsentStorage.ts`, `src/shared/tracking/TrackingRegistry.ts`) |
| **Banner Đồng Thuận Song Trọng Lượng (Equal Visual Weight)** | `[IMPLEMENTED]` `[TESTED]` | Hai nút "Chấp nhận tất cả" và "Từ chối tùy chọn" có cùng kích thước, độ tương phản và vị trí bình đẳng. (`src/shared/consent/ConsentBanner.tsx`) |
| **Bảng Cài Đặt Chi Tiết & Tắt Bật Từng Mục (Granular Preferences)** | `[IMPLEMENTED]` `[TESTED]` | Cho phép chọn riêng Phân tích, Cá nhân hóa, Tiếp thị; Khóa bắt buộc nhóm Cần thiết. (`src/shared/consent/ConsentPreferencesModal.tsx`) |
| **Cơ Chế Rút Đồng Thuận 1-Click (Consent Withdrawal)** | `[IMPLEMENTED]` `[TESTED]` | Nút "Cài đặt Cookie" cố định tại Footer & Trung tâm Quyền riêng tư `/data-privacy`, tự động dọn sạch storage. |
| **Trang Chính Sách Bảo Mật (`/privacy-policy`)** | `[IMPLEMENTED]` `[TESTED]` `[NEEDS_BUSINESS_INFORMATION]` | Trình bày 10 mục bắt buộc theo Luật 91/2025/QH15. Cần cập nhật Mã số doanh nghiệp và địa chỉ trụ sở chính. |
| **Trang Điều Khoản Dịch Vụ (`/terms-of-service`)** | `[IMPLEMENTED]` `[TESTED]` | Quy định chặt chẽ đặt hàng, thanh toán, bảo lưu quyền sở hữu trí tuệ, cơ chế giải quyết tranh chấp trọng tài/tòa án. |
| **Trang Chính Sách Cookie Độc Lập (`/cookie-policy`)** | `[IMPLEMENTED]` `[TESTED]` | Tách biệt hoàn toàn khỏi Privacy Policy; bảng phân loại đầy đủ nhà cung cấp, thời hạn, mục đích. |
| **Trang Đổi Trả & Hoàn Tiền (`/returns-refunds`)** | `[IMPLEMENTED]` `[TESTED]` | Tiêu chuẩn đổi trả 07 ngày, quy trình thu hồi lỗi sản xuất miễn phí 100%, bảo hành 30 ngày phụ kiện/da. |
| **Trung Tâm Quyền Dữ Liệu (`/data-privacy`)** | `[IMPLEMENTED]` `[TESTED]` | Cung cấp giao diện trực quan thực thi 5 quyền: Truy cập, Rút thuận, Chỉnh sửa, Hạn chế, và Xóa dữ liệu. |
| **Biểu Mẫu Tiếp Nhận Yêu Cầu DSR (`/data-privacy/request`)** | `[IMPLEMENTED]` `[TESTED]` | Hỗ trợ thành viên và khách vãng lai gửi yêu cầu, cấp mã DSR, cam kết phản hồi 72h và xử lý trong 14 ngày. |
| **Bóc Tách Checkbox Biểu Mẫu (Unbundled Consent)** | `[IMPLEMENTED]` `[TESTED]` | Form Đăng ký, Thanh toán, Liên hệ, Đánh giá, Bản tin Footer không bao giờ tick sẵn (`defaultChecked={false}`). |
| **Bộ Hồ Sơ Tài Liệu Tuân Thủ (09 Báo Cáo)** | `[IMPLEMENTED]` `[NEEDS_LEGAL_REVIEW]` | Toàn bộ 09 tài liệu Markdown ở thư mục gốc workspace sẵn sàng bàn giao cho Hội đồng Quản trị và Pháp chế. |

---

## 3. DANH MỤC TÀI LIỆU KÈM THEO

1. **[LEGAL_COMPLIANCE_MATRIX.md](file:///d:/Project/404Studio/LEGAL_COMPLIANCE_MATRIX.md)**: Ma trận đối chiếu chi tiết các điều khoản luật và giải pháp kỹ thuật tương ứng.
2. **[PRIVACY_POLICY_DRAFT.md](file:///d:/Project/404Studio/PRIVACY_POLICY_DRAFT.md)**: Dự thảo chính thức Chính sách Bảo vệ Dữ liệu Cá nhân.
3. **[TERMS_OF_SERVICE_DRAFT.md](file:///d:/Project/404Studio/TERMS_OF_SERVICE_DRAFT.md)**: Dự thảo Điều khoản Dịch vụ và Quy chế Thương mại Điện tử.
4. **[COOKIE_POLICY_DRAFT.md](file:///d:/Project/404Studio/COOKIE_POLICY_DRAFT.md)**: Dự thảo Chính sách Cookie độc lập kèm danh mục theo dõi kỹ thuật.
5. **[RETURNS_REFUNDS_DRAFT.md](file:///d:/Project/404Studio/RETURNS_REFUNDS_DRAFT.md)**: Dự thảo Chính sách Đổi trả và Hoàn tiền tiêu chuẩn 07 ngày.
6. **[THIRD_PARTY_TRACKING_REGISTER.md](file:///d:/Project/404Studio/THIRD_PARTY_TRACKING_REGISTER.md)**: Sổ đăng ký kiểm soát các bên thứ ba (Google, Meta, TikTok, Criteo, Hotjar).
7. **[CONSENT_IMPLEMENTATION_REPORT.md](file:///d:/Project/404Studio/CONSENT_IMPLEMENTATION_REPORT.md)**: Báo cáo kiến trúc kỹ thuật triển khai Consent Engine.
8. **[CONSENT_NETWORK_TEST_REPORT.md](file:///d:/Project/404Studio/CONSENT_NETWORK_TEST_REPORT.md)**: Kết quả thẩm tra mạng lưới, ngăn chặn rò rỉ gói tin theo dõi.
9. **[DATA_DELETION_REQUEST_REPORT.md](file:///d:/Project/404Studio/DATA_DELETION_REQUEST_REPORT.md)**: Quy trình tiếp nhận, xác minh và xử lý yêu cầu xóa dữ liệu kết hợp Luật Kế toán.
10. **[BACKEND_PRIVACY_API_GAPS.md](file:///d:/Project/404Studio/BACKEND_PRIVACY_API_GAPS.md)**: Phân tích các endpoint Backend hiện có và các khuyến nghị vận hành.

---

## 4. QUY TRÌNH VẬN HÀNH DÀNH CHO CÁN BỘ BẢO VỆ DỮ LIỆU (DPO MANUAL)

### Bước 1: Tiếp nhận và định danh (0 – 24 giờ)
- Khi có yêu cầu gửi từ `/data-privacy/request` hoặc email `privacy@atelierverite.vn`, hệ thống tạo phiếu DSR với mã định danh (Ví dụ: `DSR-98214`).
- Nhân viên kiểm tra tính hợp lệ của người yêu cầu:
  - Nếu là tài khoản đăng nhập: Đối soát email và lịch sử đơn hàng.
  - Nếu là khách vãng lai: Yêu cầu cung cấp mã đơn hàng đối chiếu hoặc CCCD/Hộ chiếu để xác thực danh tính.

### Bước 2: Phản hồi sơ bộ (Trong vòng 72 giờ làm việc)
- Gửi email thông báo chính thức tiếp nhận hồ sơ hợp lệ và thông báo thời hạn xử lý tối đa là 14 ngày làm việc.

### Bước 3: Thực thi yêu cầu kỹ thuật (Trong vòng 14 ngày)
- **Nếu yêu cầu trích xuất dữ liệu:** Chạy thao tác gọi `POST /api/privacy/data-export` để kết xuất file JSON có mã hóa nén dữ liệu gửi qua email người dùng.
- **Nếu yêu cầu xóa dữ liệu:**
  1. Hủy kích hoạt tài khoản đăng nhập và mật khẩu.
  2. Xóa địa chỉ giao hàng và danh sách ưa thích.
  3. Áp dụng cơ chế **Ẩn danh hóa (Anonymization)** trên bảng đơn hàng: chuyển họ tên thành `[ĐÃ ẨN DANH]`, xóa số điện thoại, giữ lại giá trị tổng tiền và danh mục mã sản phẩm để bảo đảm sổ sách kế toán thuế theo Luật Kế toán 88/2015/QH13.

### Bước 4: Lưu vết kiểm toán (Audit Trail)
- Lưu thông tin ngày giờ xử lý, người thực hiện vào nhật ký kiểm toán để sẵn sàng phục vụ công tác thanh kiểm tra của Cục An ninh mạng và phòng, chống tội phạm sử dụng công nghệ cao (A05) Bộ Công an.

---

## 5. BẢNG CHECKLIST TRƯỚC KHI DEPLOY PRODUCTION

- [x] Không tải bất kỳ tracker nào khi chưa có sự đồng ý của khách hàng.
- [x] Nút Từ chối và Chấp nhận trên banner có kích thước và độ ưu tiên thị giác ngang nhau.
- [x] Các checkbox điều khoản tại form thanh toán, đăng ký, liên hệ không bao giờ được tick sẵn.
- [x] Toàn bộ 6 trang pháp lý hoạt động ổn định trên cả máy tính, máy tính bảng và di động.
- [x] 100% nội dung giao diện bằng tiếng Việt có dấu chuẩn xác ngữ nghĩa.
- [x] 100% mã nguồn (tên tệp, hàm, biến) tuân thủ tiếng Anh kỹ thuật.
- [x] Backend nguồn `backend/` được giữ nguyên vẹn logic nghiệp vụ.
- [ ] Cập nhật thông tin pháp nhân thực tế (Tên công ty, Mã số thuế, Địa chỉ trụ sở, Giấy phép ĐKKD) vào `PRIVACY_POLICY_DRAFT.md` và `TERMS_OF_SERVICE_DRAFT.md`.
- [ ] Nộp hồ sơ thông báo website thương mại điện tử bán hàng với Bộ Công Thương (online.gov.vn).
- [ ] Nộp hồ sơ đánh giá tác động xử lý dữ liệu cá nhân (DPIA) theo quy định của Nghị định 356/2025/NĐ-CP nếu thuộc diện bắt buộc.
