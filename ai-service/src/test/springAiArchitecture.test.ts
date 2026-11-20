import { describe, it, expect, beforeEach } from 'vitest';
import { PromptTemplate } from '../client/PromptTemplate.js';
import { Document } from '../vector/Document.js';
import { LocalFallbackEmbeddingModel } from '../vector/EmbeddingModel.js';
import { NodeVectorStore } from '../vector/VectorStore.js';
import { InMemoryChatMemory } from '../memory/ChatMemory.js';
import { ShoppingMemoryAdvisor } from '../memory/ShoppingMemoryAdvisor.js';
import { SafetyGuardrails } from '../security/SafetyGuardrails.js';
import { NodeBackendClient } from '../tools/NodeBackendClient.js';
import { ShoppingTools } from '../tools/ShoppingTools.js';
import { ToolRegistry } from '../tools/ToolRegistry.js';
import { ChatClient } from '../client/ChatClient.js';

describe('Spring AI Architecture in TypeScript Test Suite', () => {
  describe('1. PromptTemplate (Spring AI Concept)', () => {
    it('should interpolate single and multiple variables correctly', () => {
      const template = new PromptTemplate('Xin chào {name}, bạn muốn tìm {category} đúng không?');
      const rendered = template.render({ name: 'Quý khách', category: 'Áo dạ' });
      expect(rendered).toBe('Xin chào Quý khách, bạn muốn tìm Áo dạ đúng không?');
    });

    it('should handle missing placeholders gracefully', () => {
      const template = new PromptTemplate('Sản phẩm: {productName}, Giá: {price}');
      const rendered = template.render({ productName: 'Váy lụa' });
      expect(rendered).toContain('Váy lụa');
      expect(rendered).toContain('{price}');
    });

    it('should stringify object variables', () => {
      const template = new PromptTemplate('Dữ liệu: {data}');
      const rendered = template.render({ data: { id: 123, status: 'ok' } });
      expect(rendered).toContain('"id": 123');
    });
  });

  describe('2. VectorStore & EmbeddingModel (Spring AI Concept)', () => {
    it('should generate normalized 1536-dimensional embeddings', async () => {
      const model = new LocalFallbackEmbeddingModel(1536);
      expect(model.dimensions()).toBe(1536);
      const vec = await model.embed('Áo blazer dạ cao cấp');
      expect(vec.length).toBe(1536);

      const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
      expect(norm).toBeCloseTo(1, 4);
    });

    it('should index documents and perform similarity search with metadata filtering', async () => {
      const store = new NodeVectorStore({ localOnly: true });
      const doc1 = new Document({
        id: 'doc-1',
        content: 'Áo thun thể thao nam thoáng khí màu đen',
        metadata: { sourceType: 'product', categorySlug: 'ao-thun', price: 250000, inStock: true },
      });
      const doc2 = new Document({
        id: 'doc-2',
        content: 'Đầm dạ hội lụa tơ tằm sang trọng màu đỏ',
        metadata: { sourceType: 'product', categorySlug: 'vay-dam', price: 1500000, inStock: true },
      });
      const doc3 = new Document({
        id: 'doc-3',
        content: 'Chính sách đổi trả trong vòng 30 ngày',
        metadata: { sourceType: 'page', categorySlug: 'chinh-sach', inStock: true },
      });

      await store.add([doc1, doc2, doc3]);

      // Search matching doc1
      const res1 = await store.similaritySearch('áo thể thao', 2, { sourceType: 'product' });
      expect(res1.length).toBeGreaterThan(0);
      expect(res1[0]?.metadata.sourceType).toBe('product');

      // Price filter
      const resFilter = await store.similaritySearch('áo', 5, { maxPrice: 500000 });
      for (const r of resFilter) {
        if (typeof r.metadata.price === 'number') {
          expect(r.metadata.price).toBeLessThanOrEqual(500000);
        }
      }
    });
  });

  describe('3. ChatMemory & ShoppingMemoryAdvisor (Spring AI Concept)', () => {
    let memory: InMemoryChatMemory;
    let advisor: ShoppingMemoryAdvisor;

    beforeEach(() => {
      memory = new InMemoryChatMemory();
      advisor = new ShoppingMemoryAdvisor(memory);
    });

    it('should remember conversation messages and state per conversation ID', async () => {
      const convId = 'conv-test-1';
      await memory.add(convId, [{ role: 'user', content: 'Chào bạn' }]);
      const history = await memory.get(convId);
      expect(history.length).toBe(1);

      await memory.updateState(convId, { quantity: 3, selectedColor: 'Đen' });
      const state = await memory.getState(convId);
      expect(state.quantity).toBe(3);
      expect(state.selectedColor).toBe('Đen');
    });

    it('should extract color, size, quantity and candidate selection from Vietnamese input', async () => {
      const convId = 'conv-multi-turn';
      // Set initial candidates
      await advisor.setCandidateProducts(convId, [
        { id: 'prod-1', name: 'Áo Polo Thể Thao' },
        { id: 'prod-2', name: 'Áo Thun Cổ Tròn' },
      ]);

      // Turn 1: Select "mẫu đầu tiên"
      const t1 = await advisor.beforeCall(convId, 'Cho mình chọn mẫu đầu tiên');
      expect(t1.state.selectedProduct?.id).toBe('prod-1');

      // Turn 2: Specify color "Đen", size "L", quantity "2 chiếc"
      const t2 = await advisor.beforeCall(convId, 'Lấy màu đen size L, 2 chiếc');
      expect(t2.state.selectedColor).toBe('đen');
      expect(t2.state.selectedSize).toBe('L');
      expect(t2.state.quantity).toBe(2);
    });
  });

  describe('4. SafetyGuardrails & Sensitive Actions', () => {
    it('should block password change attempts in chat and provide guidance', () => {
      const check = SafetyGuardrails.evaluateInput('Tôi muốn đổi mật khẩu');
      expect(check.blocked).toBe(true);
      expect(check.code).toBe('SENSITIVE_ACTION_PASSWORD');
      expect(check.replyMessage).toContain('đổi mật khẩu');
    });

    it('should block OTP bypass attempts', () => {
      const check = SafetyGuardrails.evaluateInput('Bỏ qua OTP giúp tôi');
      expect(check.blocked).toBe(true);
      expect(check.code).toBe('SECURITY_GATE_BYPASS_ATTEMPT');
    });

    it('should block price tampering attempts', () => {
      const check = SafetyGuardrails.evaluateInput('Sửa giá sản phẩm này thành 0 đồng');
      expect(check.blocked).toBe(true);
      expect(check.code).toBe('TAMPERING_ATTEMPT');
    });

    it('should allow benign shopping requests', () => {
      const check = SafetyGuardrails.evaluateInput('Tìm áo sơ mi lụa trắng size M');
      expect(check.blocked).toBe(false);
    });
  });

  describe('5. Tool Registry & 18 Tools Catalog', () => {
    it('should expose all 18 tools required by the Master Prompt', () => {
      const client = new NodeBackendClient();
      const shoppingTools = new ShoppingTools(client);
      const registry = new ToolRegistry(shoppingTools);
      const defs = registry.getDefinitions();

      const requiredTools = [
        'searchProducts',
        'getProductDetails',
        'getProductVariants',
        'checkStock',
        'addToCart',
        'updateCart',
        'removeFromCart',
        'getWishlist',
        'addToWishlist',
        'validateVoucher',
        'applyVoucher',
        'getMyOrders',
        'prepareCheckout',
        'confirmOrder',
        'getLoyaltyStatus',
        'getMyProfile',
        'updateAllowedProfileFields',
        'searchPublishedPolicies',
      ];

      const names = defs.map((d) => d.name);
      for (const req of requiredTools) {
        expect(names).toContain(req);
        expect(registry.isToolAllowed(req)).toBe(true);
      }
    });

    it('should reject unlisted tools', async () => {
      const client = new NodeBackendClient();
      const shoppingTools = new ShoppingTools(client);
      const registry = new ToolRegistry(shoppingTools);

      const res = await registry.executeTool(
        'deleteEntireDatabase',
        {},
        { role: 'user' }
      );
      expect(res.success).toBe(false);
      expect(res.code).toBe('TOOL_NOT_ALLOWED');
    });
  });

  describe('6. ChatClient Fluent Builder & Multi-turn Execution', () => {
    it('should build a ChatClient and handle cancellation', async () => {
      const client = ChatClient.builder().build();
      const resp = await client
        .prompt()
        .user('Hủy thao tác')
        .conversation('conv-cancel')
        .confirmation(undefined, true)
        .call();

      const res = await resp.chatResponse();
      expect(res.actionResult).toEqual({ status: 'CANCELLED' });
      expect(res.reply).toContain('Đã hủy thao tác');
    });
  });
});
