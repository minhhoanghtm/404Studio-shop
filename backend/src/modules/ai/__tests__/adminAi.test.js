import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import mongoose from "mongoose";
import * as tools from "../services/adminAiTools.service.js";
import adminAiAgentService, {
  generateAdminActionToken,
  verifyAdminActionToken,
} from "../services/adminAiAgent.service.js";

describe("Admin AI Copilot Test Suite", () => {
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

  describe("1. Confirmation Token & Security Guard", () => {
    it("should generate and verify valid confirmation token for Level 3 mutations", () => {
      const actionId = "ACT_TEST_123";
      const adminId = new mongoose.Types.ObjectId().toString();
      const payload = { code: "TEST50", discountValue: 50 };
      const expiresAt = new Date(Date.now() + 600000); // 10 mins

      const token = generateAdminActionToken({ actionId, adminId, payload, expiresAt });
      expect(typeof token).toBe("string");
      expect(token.length).toBe(64); // SHA-256 hex length

      const isValid = verifyAdminActionToken({ actionId, adminId, payload, expiresAt, token });
      expect(isValid).toBe(true);

      // Tampered payload must fail
      const isTamperedValid = verifyAdminActionToken({
        actionId,
        adminId,
        payload: { code: "TEST50", discountValue: 99 }, // tampered!
        expiresAt,
        token,
      });
      expect(isTamperedValid).toBe(false);

      // Expired token must fail
      const isExpiredValid = verifyAdminActionToken({
        actionId,
        adminId,
        payload,
        expiresAt: new Date(Date.now() - 1000),
        token,
      });
      expect(isExpiredValid).toBe(false);
    });

    it("should block non-admin users from calling admin tools", async () => {
      const customerContext = {
        userId: new mongoose.Types.ObjectId().toString(),
        role: "user", // Customer!
        email: "customer@gmail.com",
      };

      await expect(
        adminAiAgentService.executeTool("get_revenue_summary", {}, customerContext)
      ).rejects.toThrow("Từ chối truy cập");
    });

    it("should strictly block Level 4 restricted actions even for admins", async () => {
      const adminContext = {
        userId: new mongoose.Types.ObjectId().toString(),
        role: "admin",
        email: "admin@atelier.local",
      };

      await expect(
        adminAiAgentService.executeTool("delete_audit_log", {}, adminContext)
      ).rejects.toThrow("Thao tác bị từ chối");
    });
  });

  describe("2. Business Intelligence & Analytics Tools", () => {
    it("should calculate revenue summary without crashing on empty or populated data", async () => {
      const summary = await tools.getRevenueSummary({ period: "this_month" });
      expect(summary).toBeDefined();
      expect(typeof summary.totalRevenue).toBe("number");
      expect(typeof summary.totalOrders).toBe("number");
      expect(typeof summary.averageOrderValue).toBe("number");
      expect(typeof summary.formattedRevenue).toBe("string");
    });

    it("should compare revenue between two periods", async () => {
      const comparison = await tools.compareRevenue({
        currentPeriod: "this_month",
        previousPeriod: "last_month",
      });
      expect(comparison).toBeDefined();
      expect(comparison.current).toBeDefined();
      expect(comparison.previous).toBeDefined();
      expect(typeof comparison.comparison.revenueGrowthRate).toBe("number");
    });

    it("should get profit summary with gross margin percentage", async () => {
      const profit = await tools.getProfitSummary({ period: "this_month" });
      expect(profit).toBeDefined();
      expect(typeof profit.estimatedGrossProfit).toBe("number");
      expect(typeof profit.grossMarginPercentage).toBe("number");
    });
  });

  describe("3. Marketing & Creative Studio Tools", () => {
    it("should return Brand Kit with 404Studio palette and typography", () => {
      const brandKit = tools.getBrandKit();
      expect(brandKit.brandName).toContain("404Studio");
      expect(brandKit.palette.champagneGold).toBe("#D4AF37");
      expect(brandKit.presets.length).toBeGreaterThanOrEqual(5);
    });

    it("should generate a complete layered poster canvas spec", async () => {
      const poster = await tools.generatePoster({
        title: "BLACK FRIDAY SALE",
        subtitle: "SẴN SÀNG BỨT PHÁ",
        discountText: "GIẢM ĐẾN 50% + VOUCHER 20%",
        style: "brick_red",
        preset: "instagram_portrait",
      });

      expect(poster.width).toBe(1080);
      expect(poster.height).toBe(1350);
      expect(poster.background.type).toBe("texture");
      expect(poster.background.textureName).toBe("brick");
      expect(poster.layers.length).toBeGreaterThanOrEqual(6);

      // Verify essential layers
      const titleLayer = poster.layers.find((l) => l.id === "text-title");
      expect(titleLayer).toBeDefined();
      expect(titleLayer.content).toBe("BLACK FRIDAY SALE");

      const badgeLayer = poster.layers.find((l) => l.id === "badge-top-right");
      expect(badgeLayer).toBeDefined();
      expect(badgeLayer.content).toBe("FREESHIP 0Đ");

      const ctaLayer = poster.layers.find((l) => l.id === "button-cta");
      expect(ctaLayer).toBeDefined();
      expect(ctaLayer.content).toBe("MUA NGAY ▶");
    });

    it("should edit design layers via editDesign", async () => {
      const modified = await tools.editDesign({
        changes: {
          title: "XẢ KHO ĐÓN TẾT",
          ctaText: "MUA NGAY HÔM NAY",
        },
      });

      const titleLayer = modified.layers.find((l) => l.id === "text-title");
      expect(titleLayer.content).toBe("XẢ KHO ĐÓN TẾT");

      const ctaLayer = modified.layers.find((l) => l.id === "button-cta");
      expect(ctaLayer.content).toBe("MUA NGAY HÔM NAY");
    });
  });

  describe("4. Proactive Insights Scanner", () => {
    it("should scan system and return structured insights", async () => {
      const scan = await tools.scanProactiveInsights();
      expect(scan).toBeDefined();
      expect(Array.isArray(scan.insights)).toBe(true);
      expect(typeof scan.totalInsights).toBe("number");
    });
  });
});
