# BẢNG ĐỐI CHIẾU API GỢI Ý & THEO DÕI HÀNH VI (RECOMMENDATION API MAPPING)
*Dự án: ATELIER VÉRITÉ — ThreeUI Haute Couture E-Commerce*
*Phiên bản: 1.0.0 (Tháng 11/2026)*

---

## 1. BẢNG ÁNH XẠ ENDPOINT BACKEND VỚI GIAO DIỆN FRONTEND

| Mục đích nghiệp vụ | Endpoint Backend | Method | Query / Payload Params | Frontend Interface / Hook tương ứng | Chiến lược Fallback khi Offline / Lỗi |
| :--- | :--- | :---: | :--- | :--- | :--- |
| **Gợi ý Cá nhân hóa & Phổ biến** | `/api/recommendations` | `GET` | `?limit=12`<br>`?anonymous_id=<UUID>`<br>Header: `X-Anonymous-ID`, `Authorization` | `recommendationsApi.getRecommendations()`<br>`useHomeRecommendations()` | Fallback sang danh sách sản phẩm phổ biến đã lưu hoặc bộ sưu tập `PRODUCTS` cục bộ |
| **Ghi nhận sự kiện hành vi** | `/api/events` | `POST` | Single event hoặc batch `{ events: [...] }` (tối đa 25 sự kiện)<br>Keys: `event_type`, `product_id`, `category_id`, `anonymous_id`, `session_id`, `meta` | `trackingApi.trackEvent()`<br>`useTracking()` | Chặn hoàn toàn nếu chưa có consent `personalization`. Xử lý im lặng, lưu queue cục bộ nếu mất mạng |
| **Lấy lịch sử tìm kiếm** | `/api/search/history` | `GET` | Header: `Authorization: Bearer <token>` | `trackingApi.getSearchHistory()` | Đọc từ `localStorage` (`atelier_recent_searches`) an toàn |
| **Xóa dữ liệu hành vi (GDPR/Luật 91)** | `/api/events/me` | `DELETE` | Header: `Authorization` hoặc `X-Anonymous-ID` + `X-Anonymous-Token` | `trackingApi.clearMyData()` | Xóa sạch `localStorage` và cập nhật state về rỗng |
| **Đồng bộ Consent Quyền riêng tư** | `/api/privacy/consent` | `PUT` | `{ consent: 'granted' \| 'denied', choice, categories, anonymous_id, anonymous_token, policy_version }` | `useConsentStore.getState().syncWithBackend()` | Lưu `atelier_privacy_consent` vào `localStorage` và `document.cookie` |
| **Danh mục sản phẩm lọc / sắp xếp** | `/api/products` | `GET` | `?sort=popular \| newest \| price-asc \| price-desc`<br>`?limit=12&category=...` | `productsApi.getProducts()` | Lọc từ `PRODUCTS` catalog đồng bộ |
| **Kiểm tra khả dụng tồn kho** | `/api/products/:id/availability` | `GET` | Param: `:id` (MongoDB ObjectId hoặc Product ID) | `productsApi.checkAvailability(id)` | Fallback theo biến thể `variants.some(v => v.stock > 0)` |

---

## 2. CHI TIẾT REQUEST & RESPONSE CONTRACT

### 2.1. `GET /api/recommendations`
#### Request
- **Headers**:
  ```http
  Authorization: Bearer <jwt_token> (nếu đã đăng nhập)
  X-Anonymous-ID: c4b4a1b0-7ef8-49d7-86c8-53b0dfbca4e6
  ```
- **Query Parameters**:
  - `limit`: `number` (Mặc định `12`, tối đa `50`)
  - `anonymous_id`: `string` (UUID v4)

#### Response Success (HTTP 200)
```json
{
  "success": true,
  "data": {
    "mode": "personalized", // hoặc "popular", "empty"
    "algorithm": "hybrid_ai_v1", // hoặc "control_popular"
    "products": [
      {
        "_id": "673752e5a7b5c1...",
        "id": "673752e5a7b5c1...",
        "name": "Áo Khoác Dạ Kiến Trúc Len Nguyên Chất",
        "slug": "sculpted-wool-coat",
        "displayProduct": [
          "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6..."
        ],
        "price": 58500000,
        "old_price": 67000000,
        "rating": 5.0,
        "sold": 42,
        "stock": 13,
        "category": "Áo khoác & Măng tô",
        "category_id": "673752e5a7b5c2...",
        "variants": [
          {
            "id": "var-w01-noir",
            "colorName": "Đen Mã Não",
            "colorHex": "#121215",
            "sizes": [
              { "size": "36 FR (S)", "inStock": true, "stockCount": 4 }
            ]
          }
        ]
      }
    ],
    "experiment": {
      "experiment_id": "rec_exp_atelier_2026",
      "variant": "B",
      "request_id": "673752e5a7b5c3..."
    }
  },
  "message": "Lấy danh sách đề xuất sản phẩm thành công"
}
```

---

### 2.2. `POST /api/events`
#### Request
- **Headers**:
  ```http
  Content-Type: application/json
  X-Anonymous-ID: c4b4a1b0-7ef8-49d7-86c8-53b0dfbca4e6
  ```
- **Body**:
  ```json
  {
    "event_type": "product_click",
    "anonymous_id": "c4b4a1b0-7ef8-49d7-86c8-53b0dfbca4e6",
    "session_id": "sess_89f02a31",
    "product_id": "673752e5a7b5c1...",
    "category_id": "673752e5a7b5c2...",
    "source": "frontend_home_recommendation",
    "context": {
      "deviceType": "desktop",
      "pathname": "/"
    },
    "meta": {
      "tab": "for-you",
      "position": 1
    }
  }
  ```

#### Response Success (HTTP 200)
```json
{
  "success": true,
  "data": {
    "processed": 1
  },
  "message": "Ghi nhận sự kiện thành công"
}
```

---

## 3. TIÊU CHUẨN XÁC THỰC & BẢO VỆ DỮ LIỆU
1. **Kiểm tra định dạng**: `anonymous_id` bắt buộc phải là UUID v4 hợp lệ theo Zod schema.
2. **Loại trừ sự kiện Server-only**: Client tuyệt đối không được tự tiện gửi `purchase_completed`, `order_placed`, `order_cancelled` lên `/api/events`.
3. **Phân tách Cache**: Key cache Redis được định danh theo phiên bản người dùng:
   - Guest: `recommendations:a:<anonId>:exp:<expId>:var:<variant>:limit:<limit>`
   - User: `recommendations:u:<userId>:exp:<expId>:var:<variant>:limit:<limit>`
   - Phổ biến: `recommendations:popular:<limit>` (Dùng chung với TTL 10 phút).
