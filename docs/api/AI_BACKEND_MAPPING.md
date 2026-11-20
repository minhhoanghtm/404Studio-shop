# AI / Backend REST API Mapping Reference

## 1. Public API Contracts (Frontend <-> Backend Gateway)

| Endpoint | Method | Auth | Description |
| :--- | :---: | :---: | :--- |
| `/api/ai/chat` | `POST` | Optional JWT | Main conversational AI chat interface. Accepts `content`, `conversationId`, `confirmAction`, `cancelAction`. |
| `/api/ai/search` | `POST` / `GET` | Optional JWT | Semantic vector search endpoint for garments, categories, and published policies. |
| `/api/ai/health` | `GET` | Optional JWT | Health and readiness check returning vector index counts, memory status, and provider health. |
| `/api/ai/embeddings/sync` | `POST` | Admin Only | Full or incremental vector embedding synchronization across products, pages, and campaigns. |

---

## 2. Private Inter-Service Contracts (Backend Gateway <-> AI Service)

All internal requests are signed with SHA-256 HMAC and reject unsigned or stale calls (> 60s timestamp drift).

### A. Node.js Backend Gateway -> TypeScript AI Service (:8081)

- **Endpoint**: `POST /internal/v1/chat`
- **Request Headers**:
  - `X-AI-Service-Timestamp`: Epoch timestamp in seconds.
  - `X-AI-Service-Signature`: `HMAC-SHA256(secret, "${timestamp}.POST./internal/v1/chat.${userId}.${role}")`
  - `X-AI-End-User-Id`: Authenticated user ID (or `"anonymous"`).
  - `X-AI-End-User-Role`: User role (`user`, `admin`, `guest`).
- **Body**:
  ```json
  {
    "content": "Thêm áo thể thao vào giỏ hàng giúp tôi",
    "conversationId": "conv_1732107412_a9f1",
    "metadata": {},
    "confirmAction": null,
    "cancelAction": null
  }
  ```

### B. TypeScript AI Service (:8081) -> Node.js Backend Gateway (:5000)

- **Endpoint**: `POST /api/internal/ai/tools/:tool`
- **Request Headers**:
  - `X-AI-Service-Timestamp`: Epoch timestamp in seconds.
  - `X-AI-Service-Signature`: `HMAC-SHA256(secret, "${timestamp}.POST./api/internal/ai/tools/${tool}.${bodySha256}")`
  - `X-AI-End-User-Id`: Forwarded user ID from context.
  - `X-AI-End-User-Role`: Forwarded user role from context.
- **Body**:
  ```json
  {
    "arguments": {
      "product_id": "6a3d6429363cacf6a8f2dd50",
      "color": "đen",
      "size": "L",
      "quantity": 1
    }
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "status": "SUCCESS",
    "data": {
      "cartId": "669000000000000000000001",
      "addedItems": [{ "product_id": "...", "quantity": 1 }]
    }
  }
  ```
