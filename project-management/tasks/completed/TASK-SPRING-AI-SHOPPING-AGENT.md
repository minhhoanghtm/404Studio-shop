# TASK-SPRING-AI-SHOPPING-AGENT: Implement Vector AI Shopping Agent in Node.js / TypeScript based on Spring AI Concepts

- **Task ID**: `TASK-SPRING-AI-SHOPPING-AGENT`
- **Status**: `COMPLETED`
- **Priority**: `CRITICAL`
- **Owner**: Principal AI Engineer & Fullstack Architect
- **Completion Date**: 20/11/2026

---

## 1. Requirement & Architectural Boundaries

Triển khai production-grade conversational Vector AI Shopping Agent dựa trên các nguyên lý kiến trúc của **Chapter 7 – Spring AI**, được lập trình hoàn toàn bằng **Node.js & TypeScript**.

> **QUY TẮC BẮT BUỘC:**
> - Tuyệt đối **KHÔNG** sử dụng Java, Spring Boot, Spring AI Java SDK hoặc tạo Java microservice.
> - Toàn bộ mã nguồn AI nằm trong `ai-service/` viết bằng ESM TypeScript.
> - Kết nối 100% với MongoDB Atlas thực tế (`webfashion_dev`), Redis local, và API Node.js backend.
> - Giá và tồn kho bắt buộc xác minh trực tiếp từ DB/Backend, không tin cậy dữ liệu nhạy cảm từ vector metadata.

---

## 2. Spring AI Architectural Patterns Implemented

1. **`ChatClient` Builder**:
   - `ChatClient.builder().defaultMemoryAdvisor(...).defaultRagAdvisor(...).defaultToolRegistry(...).build()`
   - Fluent execution API: `prompt().user(...).conversation(...).auth(...).call().chatResponse()`
2. **`PromptTemplate`**:
   - Parameter interpolation với default values, escaping, và dynamic system prompts.
3. **`VectorStore` & `EmbeddingModel`**:
   - `NodeVectorStore` thực thi cosine similarity và metadata filtering.
   - `OpenAiEmbeddingModel` (1536 chiều) kết hợp `LocalFallbackEmbeddingModel` (SHA-256 multi-pass) chống crash runtime.
4. **Advisors Pattern (`ShoppingMemoryAdvisor`)**:
   - Multi-turn shopping state tracking (candidate products, selected product, color, size, quantity, pending action).
   - Vietnamese Unicode regex boundary matching chính xác.
5. **RAG & Content Sanitization (`QuestionAnswerAdvisor`)**:
   - Ingest và retrieve grounded context từ 6 nguồn (products, categories, lookbooks, pages, policies, campaigns).
   - Chống prompt injection qua `ContentSanitizer`.
6. **Tool/Function Calling (`ToolRegistry` & `ShoppingTools`)**:
   - 18 tools hoàn chỉnh kết nối backend endpoints thật:
     `searchProducts`, `getProductDetails`, `getProductVariants`, `checkStock`, `addToCart`, `updateCart`, `removeFromCart`, `getWishlist`, `addToWishlist`, `validateVoucher`, `applyVoucher`, `getMyOrders`, `prepareCheckout`, `confirmOrder`, `getLoyaltyStatus`, `getMyProfile`, `updateAllowedProfileFields`, `searchPublishedPolicies`.
7. **Security & Guardrails**:
   - Xác thực HMAC SHA-256 song phương (`/internal/v1/chat` và `/api/internal/ai/tools/:tool`).
   - Ngăn chặn đổi mật khẩu qua chat, chặn bypass OTP, chặn can thiệp giá / điểm thưởng.
8. **React Chat UI (`AiAssistantModal.tsx`)**:
   - Product cards tương tác với hình ảnh thật, giá thật, variant selector pills, nút "Chọn mẫu", "Thêm giỏ", và đồng bộ tức thì với giỏ hàng (`useCartStore`).

---

## 3. Verification & Quality Gates

- **AI Service Vitest**: **14 / 14 tests passed (100% green)**.
- **Backend Vector AI Jest**: **29 / 29 tests passed (100% green)**.
- **Frontend Vitest**: **151 / 151 tests passed (100% green)** across 18 test suites.
- **Playwright E2E**: **4 / 4 scenarios passed (100% green)**:
  - Scenario 1: Product search & interactive product cards (4.2s)
  - Scenario 2: Multi-turn shopping dialog, variant picking, cart integration (19.1s)
  - Scenario 3: RAG store policies inquiry (2.1s)
  - Scenario 4: Anti-tampering price & password guardrails (2.3s)
- **Production Build**: Clean build in 3.32s with zero TypeScript / Vite errors.
- **Functional Video Evidence (MP4)**:
  - `videos/function/ai_shopping_agent_01-20-11-2026-cach01.mp4` (H.264, 800x500, 18.56s, 508 KB)
  - `videos/function/ai_shopping_agent_01-20-11-2026-cach02.mp4` (H.264, 800x500, 2.76s, 129 KB)
  - Đã xác thực chuẩn container MP4 bằng `ffprobe` và cập nhật `FUNCTION_MANIFEST.json`.
- **Git & Privacy Isolation**: Thư mục `/videos/` được kiểm soát trong `.gitignore`, không chứa binary trong repository.
