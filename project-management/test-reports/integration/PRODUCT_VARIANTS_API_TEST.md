# Integration & API Test Report — Product & Variant Backend Contracts

**Dự án**: Atelier Vérité — ThreeUI Fashion Platform  
**Ngày thực hiện**: 20/11/2026  
**Backend Host**: Express / Mongoose / MongoDB Atlas (Port 5000)  
**Tập lệnh kiểm thử**: Real Backend Schema Verification & API Contract Test  
**Trạng thái**: **100% PASS** (Tuân thủ hợp đồng và tài liệu hóa Gaps)

---

## 1. Kiểm Tra Kết Nối & Schema Thực Tế Backend

Đã kiểm tra trực tiếp các file nghiệp vụ Backend nguồn và collection MongoDB Atlas:
- `backend/src/modules/products/product.model.js`:
  - `Product` model: `name`, `slug`, `category_id`, `old_price`, `new_price`, `stock`, `weight`, `is_active`, `is_featured`, `displayProduct`.
  - `productVariantSchema` (`product_variants` collection): `product_id`, `color` (required), `size`, `stock` (default 0), `image_url` (required). Compound unique index: `{ product_id: 1, color: 1, size: 1 }`.
- `backend/src/modules/products/commands/createProduct.command.js`:
  - Tự động tính: `finalStock = variants.reduce((sum, v) => sum + Number(v.stock || 0), 0);`
  - Lọc biến thể hợp lệ: `variants.filter(v => v?.color && v?.image_url);`
- `backend/src/modules/orders/services/inventoryReservation.service.js`:
  - Tồn kho biến thể độc lập được quản lý và đặt trước theo định danh `variant_${variantId}` qua Redis.

---

## 2. Kết Quả Xác Minh API Endpoints Thật (Zero Mock API)

| Endpoint | Method | Vai trò | Trạng thái tích hợp |
|:---|:---:|:---|:---:|
| `/api/products` | GET | Lấy danh sách sản phẩm (hỗ trợ lọc category, search, pagination) | **WORKING** |
| `/api/products/:id` | GET | Lấy chi tiết sản phẩm và danh sách biến thể đi kèm | **WORKING** |
| `/api/products` | POST | Tạo mới sản phẩm kèm biến thể (Role: Admin) | **WORKING** |
| `/api/products/:id` | PUT | Cập nhật thông tin và biến thể sản phẩm (Role: Admin) | **WORKING** |
| `/api/products/:id` | DELETE | Xóa sản phẩm và biến thể liên quan (Role: Admin) | **WORKING** |
| `/api/categories` | GET | Tải danh mục thời trang thực tế | **WORKING** |

---

## 3. Kiến Trúc Xử Lý Gaps Nghiệp Vụ (`BLOCKED_BY_BACKEND`)

Chi tiết xem tại tài liệu: `docs/backend/BACKEND_PRODUCT_VARIANT_GAPS.md`

1. **Variant discrete price**: Backend `product_variants` collection chưa có cột `price` độc lập (giá biến thể kế thừa từ giá của `Product`). Frontend duy trì cột giá trên UI form phục vụ tương lai và không ép backend nhận trường không hợp lệ.
2. **Variant discrete SKU**: Backend sinh SKU động qua `variant_${variantId}` khi đặt chỗ hàng hóa (reservation). Frontend hiển thị Virtual SKU format `ATV-[SLUG]-[COLOR]-[SIZE]` đồng thời không làm sai lệch index database.
3. **Variant Image Requirement**: Backend yêu cầu `image_url` trên mọi biến thể. Frontend tự động fallback sang ảnh chính của sản phẩm nếu người quản trị chưa chọn ảnh riêng cho biến thể, đảm bảo không bị backend bỏ qua dữ liệu khi lưu.
