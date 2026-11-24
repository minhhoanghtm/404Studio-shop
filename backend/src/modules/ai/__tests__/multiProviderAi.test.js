import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import mongoose from "mongoose";
import providerRegistry from "../providers/ProviderRegistry.js";
import aiRouter from "../services/aiRouter.service.js";
import usageCostTracker from "../services/usageCostTracker.service.js";
import adminImageGenerationService from "../services/adminImageGeneration.service.js";
import { AdminAiSettings } from "../models/adminAiSettings.model.js";
import { AdminAiUsageLog } from "../models/adminAiUsageLog.model.js";
import adminAiAgentService from "../services/adminAiAgent.service.js";
import * as tools from "../services/adminAiTools.service.js";

describe("Multi-Provider AI & Image Generation Test Suite", () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/shop");
    }
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  describe("1. Multi-Provider Registry & Capabilities", () => {
    it("should initialize core and free-first image providers in registry", () => {
      const providers = providerRegistry.getAllProviders();
      expect(providers).toHaveProperty("openai");
      expect(providers).toHaveProperty("gemini");
      expect(providers).toHaveProperty("claude");
      expect(providers).toHaveProperty("deepseek");
      expect(providers).toHaveProperty("flux");
      expect(providers).toHaveProperty("cloudflare");
      expect(providers).toHaveProperty("pollinations");
      expect(providers).toHaveProperty("comfyui");
    });

    it("should report correct capabilities for each provider", () => {
      const openAiCaps = providerRegistry.getProvider("openai").capabilities;
      expect(openAiCaps).toContain("CHAT");
      expect(openAiCaps).toContain("VISION");
      expect(openAiCaps).toContain("IMAGE_GENERATION");

      const claudeCaps = providerRegistry.getProvider("claude").capabilities;
      expect(claudeCaps).toContain("CHAT");
      expect(claudeCaps).toContain("REASONING");
      expect(claudeCaps).toContain("VISION");
      expect(claudeCaps).not.toContain("IMAGE_GENERATION"); // Claude delegates image generation to tool

      const fluxCaps = providerRegistry.getProvider("flux").capabilities;
      expect(fluxCaps).toContain("IMAGE_GENERATION");
    });

    it("should return NOT_CONFIGURED for providers without direct keys, never fake PASS", async () => {
      const statusList = await providerRegistry.getProvidersStatus();
      expect(Array.isArray(statusList)).toBe(true);
      expect(statusList.length).toBeGreaterThanOrEqual(8);

      const openAiStatus = statusList.find((p) => p.id === "openai");
      expect(openAiStatus).toBeDefined();
      expect(["CONNECTED", "RATE_LIMITED", "INVALID_KEY"]).toContain(openAiStatus.status);

      const fluxStatus = statusList.find((p) => p.id === "flux");
      expect(fluxStatus).toBeDefined();
      if (!process.env.FLUX_API_KEY) {
        expect(fluxStatus.status).toBe("NOT_CONFIGURED");
      }
    });
  });

  describe("2. Smart AI Routing & Task Classification", () => {
    it("should detect task intent correctly from messages", () => {
      expect(aiRouter.detectTaskType("Phân tích doanh thu tháng này")).toBe("analytics");
      expect(aiRouter.detectTaskType("Lên kế hoạch marketing tuần tới")).toBe("marketing");
      expect(aiRouter.detectTaskType("Tạo poster khuyến mãi Black Friday")).toBe("image_generation");
      expect(aiRouter.detectTaskType("Sửa layer tiêu đề của poster")).toBe("image_editing");
      expect(aiRouter.detectTaskType("Xem ảnh này có sản phẩm gì", [{ type: "image" }])).toBe("vision");
    });

    it("should resolve provider for auto mode with valid fallback", async () => {
      const resolved = await aiRouter.resolveProvider({
        requestedProvider: "auto",
        taskType: "analytics",
      });

      expect(resolved).toBeDefined();
      expect(typeof resolved.providerId).toBe("string");
      expect(resolved.provider).toBeDefined();
      expect(resolved.model).toBeDefined();
    });

    it("should resolve explicit provider when requested and available", async () => {
      const resolved = await aiRouter.resolveProvider({
        requestedProvider: "openai",
        taskType: "chat",
      });

      expect(resolved.providerId).toBe("openai");
      expect(resolved.provider).toBe(providerRegistry.getProvider("openai"));
    });
  });

  describe("3. Cost Tracking, Quotas & Budget Guard", () => {
    it("should estimate cost correctly for chat and image operations", () => {
      const chatCost = usageCostTracker.estimateCost({
        provider: "openai",
        model: "gpt-4o",
        promptTokens: 1000,
        completionTokens: 500,
      });
      expect(chatCost).toBeGreaterThan(0);
      expect(chatCost).toBeCloseTo((1000 / 1000000) * 2.5 + (500 / 1000000) * 10, 5);

      const imageCost = usageCostTracker.estimateCost({
        provider: "openai",
        model: "gpt-image-1-mini",
        imageCount: 1,
      });
      expect(imageCost).toBe(0.02);
    });

    it("should enforce daily image limits and monthly budget limits", async () => {
      const checkLimit = await usageCostTracker.checkLimit({
        adminId: new mongoose.Types.ObjectId().toString(),
        type: "image",
        estimatedCostUsd: 0.02,
      });

      expect(checkLimit).toHaveProperty("allowed");
      expect(typeof checkLimit.allowed).toBe("boolean");
      expect(checkLimit).toHaveProperty("dailyLimit");
      expect(checkLimit).toHaveProperty("monthlyBudget");
    });
  });

  describe("4. Conversational Poster Generation & Layer Editing", () => {
    it("should generate a complete multi-layer poster specification via pipeline", async () => {
      const posterSpec = await adminImageGenerationService.generatePosterPipeline({
        title: "MID-SEASON CLEARANCE",
        subtitle: "BỘ SƯU TẬP XUÂN HÈ",
        discountText: "GIẢM 40%",
        style: "brick_red",
        preset: "instagram_portrait",
        authContext: { userId: new mongoose.Types.ObjectId() },
      });

      expect(posterSpec.width).toBe(1080);
      expect(posterSpec.height).toBe(1350);
      expect(posterSpec.layers.length).toBeGreaterThanOrEqual(7);

      const layerIds = posterSpec.layers.map((l) => l.id);
      expect(layerIds).toContain("badge-top-right");
      expect(layerIds).toContain("text-title");
      expect(layerIds).toContain("text-subtitle");
      expect(layerIds).toContain("text-discount");
      expect(layerIds).toContain("button-cta");
    }, 20000);

    it("should edit design layers via tools.editDesign without losing design context", async () => {
      const modified = await tools.editDesign({
        changes: {
          title: "SIÊU SALE 12.12",
          ctaText: "MUA NGAY HÔM NAY",
        },
      });

      const titleLayer = modified.layers.find((l) => l.id === "text-title");
      expect(titleLayer.content).toBe("SIÊU SALE 12.12");

      const ctaLayer = modified.layers.find((l) => l.id === "button-cta");
      expect(ctaLayer.content).toBe("MUA NGAY HÔM NAY");
    });
  });

  describe("5. Customer AI Isolation & Security Guard", () => {
    it("should prevent non-admin/customer users from accessing admin AI tools", async () => {
      const customerUser = {
        userId: new mongoose.Types.ObjectId().toString(),
        role: "user",
        email: "shopper@gmail.com",
      };

      await expect(
        adminAiAgentService.executeTool("get_revenue_summary", {}, customerUser)
      ).rejects.toThrow("Từ chối truy cập");
    });
  });
});
