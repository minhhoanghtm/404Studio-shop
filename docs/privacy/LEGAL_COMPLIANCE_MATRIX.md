# MA TRẬN TUÂN THỦ PHÁP LÝ & BẢO VỆ DỮ LIỆU CÁ NHÂN (LEGAL COMPLIANCE MATRIX)

**Dự án**: Nền tảng Thương mại Điện tử Thời trang Cao cấp ATELIER VÉRITÉ  
**Phiên bản tài liệu**: 1.0.0 — Bản đối chiếu chính thức  
**Ngày lập**: 16/11/2026  
**Trạng thái pháp lý áp dụng**: Đang có hiệu lực thi hành tại Nước Cộng hòa Xã hội Chủ nghĩa Việt Nam  

---

## 1. CĂN CỨ PHÁP LÝ HIỆN HÀNH

Hệ thống tuân thủ pháp lý và quản trị dữ liệu của **ATELIER VÉRITÉ** được thiết kế, rà soát và thực thi trực tiếp dựa trên các văn bản quy phạm pháp luật hiện hành sau đây:

1. **Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15** (Quốc hội khóa XV thông qua).
2. **Nghị định số 356/2025/NĐ-CP** quy định chi tiết thi hành một số điều của Luật Bảo vệ dữ liệu cá nhân.
3. **Luật Bảo vệ quyền lợi người tiêu dùng số 19/2023/QH15** (Có hiệu lực từ ngày 01/07/2024).
4. **Nghị định số 55/2024/NĐ-CP** quy định chi tiết một số điều của Luật Bảo vệ quyền lợi người tiêu dùng.
5. **Luật Giao dịch điện tử số 20/2023/QH15** (Có hiệu lực từ ngày 01/07/2024).
6. **Nghị định số 52/2013/NĐ-CP** về thương mại điện tử và **Nghị định số 85/2021/NĐ-CP** sửa đổi, bổ sung một số điều của Nghị định số 52/2013/NĐ-CP.
7. **Luật Kế toán số 88/2015/QH13** và các văn bản thuế liên quan đến nghĩa vụ lưu trữ chứng từ thanh toán/hóa đơn tài chính từ 5 đến 10 năm.

> [!IMPORTANT]
> **Lưu ý Pháp lý Bắt buộc về Nghị định 13/2023/NĐ-CP:**  
> Hệ thống tuân thủ của ATELIER VÉRITÉ **không sử dụng Nghị định số 13/2023/NĐ-CP làm căn cứ đang có hiệu lực**. Toàn bộ quy chuẩn về phân loại dữ liệu, cơ chế đồng thuận (consent), quyền của chủ thể dữ liệu (data subject rights), và trách nhiệm của Bên Kiểm soát / Bên Xử lý dữ liệu được chuyển dịch và áp dụng trực tiếp theo **Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15** và **Nghị định số 356/2025/NĐ-CP**.

---

## 2. MA TRẬN ĐỐI CHIẾU NGHĨA VỤ PHÁP LÝ & GIẢI PHÁP THỰC THI HỆ THỐNG

| STT | Điều khoản / Căn cứ pháp lý | Yêu cầu pháp lý cốt lõi | Giải pháp kỹ thuật & Giao diện trên ATELIER VÉRITÉ | Trạng thái thực thi |
|:---:|---|---|---|:---:|
| **1** | **Luật 91/2025/QH15 & NĐ 356/2025/NĐ-CP** — Cơ chế đồng thuận tự nguyện | Sự đồng thuận phải được thể hiện rõ ràng, tự nguyện, trên cơ sở được thông báo đầy đủ. Nghiêm cấm mặc định đồng ý hoặc coi im lặng là đồng ý. | - Triển khai **Consent Manager** chặn toàn bộ tracking không thiết yếu trước khi có tương tác.<br>- Checkbox trong form đăng ký, checkout, liên hệ, newsletter đều **mặc định bỏ chọn (unchecked)**.<br>- Không sử dụng hành vi cuộn chuột hay đóng modal làm hành động đồng thuận. | **IMPLEMENTED** |
| **2** | **Luật 91/2025/QH15 & NĐ 356/2025/NĐ-CP** — Tách biệt mục đích xử lý | Phải phân tách rõ ràng các mục đích xử lý dữ liệu khác nhau. Không được gộp mục đích tiếp thị (marketing) vào điều khoản bắt buộc. | - Tách biệt độc lập: (1) Điều khoản dịch vụ & xử lý thiết yếu cho hợp đồng, (2) Xử lý dữ liệu định danh, (3) Nhận bản tin khuyến mãi/tiếp thị, (4) Cookie phân tích, (5) Cookie tiếp thị quảng cáo. | **IMPLEMENTED** |
| **3** | **Luật 91/2025/QH15** — Quyền của chủ thể dữ liệu | Chủ thể dữ liệu có quyền: Biết, Đồng ý, Truy cập, Chỉnh sửa, Xóa, Rút lại đồng thuận, Hạn chế xử lý, Phản đối xử lý, Khiếu nại. | - Xây dựng **Trung tâm quyền riêng tư (`/data-privacy`)**.<br>- Biểu mẫu thực hiện quyền dữ liệu (`/data-privacy/request`).<br>- Kết nối API Backend: `POST /api/privacy/data-export`, `POST /api/privacy/data-requests`, `DELETE /api/privacy/data`. | **IMPLEMENTED** |
| **4** | **Luật 91/2025/QH15 & Luật Kế toán 88/2015/QH13** — Nghĩa vụ lưu trữ chứng từ tài chính vs. Quyền xóa dữ liệu | Khi chủ thể yêu cầu xóa dữ liệu, các bản ghi giao dịch tài chính/hóa đơn phải được lưu trữ theo luật thuế và kế toán nhưng thông tin định danh cá nhân phải được ẩn danh hóa. | - Cơ chế `DataSubjectService.erase()` trên Backend giữ lại bản ghi Order phục vụ đối soát thuế nhưng thực hiện **ẩn danh hóa toàn bộ trường cá nhân** (`[ĐÃ ẨN DANH]`), xóa lịch sử sự kiện và hủy tài khoản. | **IMPLEMENTED** |
| **5** | **Luật 19/2023/QH15 & NĐ 55/2024/NĐ-CP** — Thông tin minh bạch trước giao dịch | Cung cấp đầy đủ thông tin về đơn vị kiểm soát, phương thức liên hệ, chính sách đổi trả hàng hóa, điều kiện hoàn tiền, bảo hành và chi phí phát sinh trước khi người tiêu dùng đặt hàng. | - Xây dựng trang riêng biệt **Chính sách đổi trả & hoàn tiền (`/returns-refunds`)**.<br>- Công khai quy trình 7 ngày đổi trả, điều kiện nguyên tem mác Haute Couture, phí vận chuyển 0 đồng khi lỗi sản xuất. | **IMPLEMENTED** |
| **6** | **NĐ 52/2013/NĐ-CP & NĐ 85/2021/NĐ-CP** — Điều khoản dịch vụ sàn TMĐT | Công khai quy chế hoạt động, điều khoản dịch vụ, cơ chế giải quyết khiếu nại tranh chấp, quy trình mua sắm và thanh toán. | - Xây dựng trang riêng **Điều khoản sử dụng (`/terms-of-service`)** đầy đủ 12 mục tiêu chuẩn theo pháp luật Việt Nam. | **IMPLEMENTED** |
| **7** | **Luật 91/2025/QH15 & NĐ 356/2025/NĐ-CP** — Quản trị Cookie & Công nghệ theo dõi | Công khai chi tiết các cookie, công nghệ theo dõi bên thứ nhất và bên thứ ba; cơ chế cho phép từ chối hoặc rút lại đồng thuận bất kỳ lúc nào. | - Xây dựng **Chính sách Cookie riêng biệt (`/cookie-policy`)**.<br>- Công cụ **Quản lý tùy chọn Cookie (Cookie Settings)** mở được từ Footer và Privacy Center. | **IMPLEMENTED** |
| **8** | **Luật 91/2025/QH15** — Chặn trước (Prior Consent Enforcement) | Các công nghệ theo dõi không thiết yếu (Google Analytics, Meta Pixel, TikTok Pixel, Heatmap, Session Recording) tuyệt đối không được tải hoặc gửi dữ liệu trước khi có sự đồng thuận hợp lệ. | - Thiết kế **TrackingRegistry** và **ThirdPartyScriptLoader** tự động phong tỏa toàn bộ SDK/thẻ script phân tích & tiếp thị cho tới khi người dùng bấm "Chấp nhận tất cả" hoặc bật danh mục cụ thể. | **IMPLEMENTED** |

---

## 3. DANH MỤC CÁC TRANG VÀ ĐƯỜNG DẪN PHÁP LÝ TRIỂN KHAI

| Tuyến đường (Route) | Tên tiếng Việt | Tên Component | Mục đích pháp lý |
|---|---|---|---|
| `/privacy-policy` | Chính sách bảo mật | `PrivacyPolicyPage` | Tuân thủ Luật 91/2025/QH15 & NĐ 356/2025/NĐ-CP về minh bạch xử lý dữ liệu. |
| `/terms-of-service` | Điều khoản sử dụng | `TermsOfServicePage` | Tuân thủ Luật 19/2023/QH15, Luật Giao dịch điện tử 20/2023/QH15, NĐ 52/2013/NĐ-CP. |
| `/cookie-policy` | Chính sách Cookie | `CookiePolicyPage` | Công khai danh mục cookie, mục đích, thời hạn và cách thức thu hồi đồng thuận. |
| `/returns-refunds` | Chính sách đổi trả & Hoàn tiền | `ReturnsRefundsPage` | Tuân thủ Luật 19/2023/QH15 & NĐ 55/2024/NĐ-CP về quyền lợi người tiêu dùng. |
| `/data-privacy` | Trung tâm quyền riêng tư | `DataPrivacyPage` | Giao diện điều khiển quyền dữ liệu: xem, tải dữ liệu, thu hồi consent, lịch sử yêu cầu. |
| `/data-privacy/request` | Biểu mẫu quyền dữ liệu | `DataPrivacyRequestPage` | Biểu mẫu chính thức gửi yêu cầu Xóa, Hạn chế, Phản đối hoặc Trích xuất dữ liệu. |

---

## 4. PHÂN LOẠI TRẠNG THÁI HỆ THỐNG

- **IMPLEMENTED (Đã thực thi)**:
  - Consent Provider, Cookie Banner, Cookie Preferences Modal, Script Isolation Engine.
  - 6 trang pháp lý độc lập, liên kết chặt chẽ qua Header, Footer và Checkout.
  - Các checkbox độc lập không tích sẵn tại các biểu mẫu.
  - Giao diện tra cứu và gửi yêu cầu quyền riêng tư.
- **TESTED (Đã kiểm thử)**:
  - Kiểm thử tự động Vitest cho logic quản lý Consent & Storage.
  - Kiểm thử Playwright E2E cho 8 kịch bản mạng và tương tác người dùng (Tests A-H).
- **NEEDS_BUSINESS_INFORMATION (Cần doanh nghiệp điền thông tin thực tế)**:
  - Thông tin Tên Công ty / Pháp nhân đăng ký chính thức, Mã số thuế doanh nghiệp (hiện đang để placeholder mẫu: `CÔNG TY TNHH ATELIER VÉRITÉ VIỆT NAM`, `MST: 0109999999`).
  - Địa chỉ thực tế của Salon / Trụ sở chính tại Việt Nam.
  - Hotline tổng đài và email tiếp nhận bảo vệ dữ liệu (`dpo@atelierverite.com`).
- **NEEDS_LEGAL_REVIEW (Cần luật sư rà soát nội bộ trước ngày ký)**:
  - Rà soát các trường hợp bất khả kháng và giới hạn trách nhiệm bồi thường trong Điều khoản sử dụng trước khi vận hành thương mại quy mô lớn.
