import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import mongoose from "mongoose";
import { getRedisConnection } from "../../configs/redis.js";
import { getRedisConnectionConfig, isLoopbackHost } from "../../configs/network.config.js";
import { protectedRoute, adminOnly, staffOrAdmin } from "../../middlewares/auth.middleware.js";
import { authenticate, authorize } from "../../middlewares/rbac.middleware.js";
import { createAiChatLimiter } from "../../middlewares/rateLimiter.middleware.js";
import { AppError } from "../../common/exceptions/AppError.js";
import {
  adminAiChatController,
  adminAiConfirmActionController,
  adminAiCancelActionController,
  getAdminConversationsController,
  getAdminConversationByIdController,
  deleteAdminConversationController,
  getAdminAiInsightsController,
  getAdminDesignsController,
  saveAdminDesignController,
  validateAdminDesignController,
  applyAdminDesignOperationsController,
  getBrandKitController,
  getAdminBusinessAnalyticsController,
  exportAdminReportController,
  getAdminAiSettingsController,
  updateAdminAiSettingsController,
  testAiProviderConnectionController,
  getAdminAiUsageController,
  generateAdminAiImageController,
  uploadAiReferenceController,
  analyzeVisionController,
} from "./adminAi.controller.js";

const REFERENCES_DIR = path.resolve(process.cwd(), "uploads", "ai_references");
if (!fs.existsSync(REFERENCES_DIR)) fs.mkdirSync(REFERENCES_DIR, { recursive: true });
const PENDING_REFERENCES_DIR = path.resolve(process.cwd(), "tmp", "ai-reference-uploads");
if (!fs.existsSync(PENDING_REFERENCES_DIR)) fs.mkdirSync(PENDING_REFERENCES_DIR, { recursive: true });

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, PENDING_REFERENCES_DIR),
    filename: (req, file, cb) => {
      const ext = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif" }[file.mimetype];
      cb(null, `ref_${Date.now()}_${crypto.randomBytes(12).toString("hex")}${ext}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError("Chỉ hỗ trợ file hình ảnh (JPEG, PNG, WEBP, GIF)", 400), false);
    }
  },
});
const receiveReference = (req, res, next) => upload.single("image")(req, res, (error) => {
  if (error instanceof multer.MulterError) return next(new AppError(error.code === "LIMIT_FILE_SIZE" ? "Ảnh vượt quá giới hạn 10 MB." : "Dữ liệu tải lên không hợp lệ.", error.code === "LIMIT_FILE_SIZE" ? 413 : 400));
  return next(error);
});

const adminAiRouter = Router();

// Apply security guard: All admin AI endpoints strictly require valid JWT and Admin/Staff role
adminAiRouter.use(protectedRoute);
adminAiRouter.use(staffOrAdmin);

// Only available in the isolated QA environment; allows test suites to verify
// the running backend's actual database before creating mutable fixtures.
if (process.env.APP_ENV === "qa") {
  adminAiRouter.get("/qa-context", (req, res) => {
    const redis = getRedisConnection();
    const expectedRedis = getRedisConnectionConfig(process.env);
    res.json({
      success: true,
      data: {
        environment: process.env.APP_ENV,
        database: mongoose.connection.name,
        databaseHost: mongoose.connection.host,
        databasePort: mongoose.connection.port,
        redisHost: redis.options.host,
        redisPort: redis.options.port,
        connected: mongoose.connection.readyState === 1,
        redisQa:
          redis.status === "ready" &&
          isLoopbackHost(redis.options.host) &&
          Number(redis.options.port) === Number(expectedRedis.port),
      },
    });
  });
}

// 1. AI Copilot Chat & Multi-Tool Execution
adminAiRouter.post("/chat", createAiChatLimiter({ windowMs: 60 * 1000, max: 60 }), adminAiChatController);

// 2. Business Mutation Confirmation Gate (Level 3 Actions)
adminAiRouter.post("/confirm-action", authenticate, (req, res, next) => {
  if (["prepare_voucher", "prepare_campaign", "prepare_promotion"].includes(req.body?.actionType)) return authorize("coupon:manage")(req, res, next);
  if (req.body?.actionType === "prepare_product_description") return authorize("product:update")(req, res, next);
  if (req.body?.actionType === "prepare_banner_publication") return adminOnly(req, res, next);
  return res.status(403).json({ success: false, message: "Hành động không được phép." });
}, adminAiConfirmActionController);
adminAiRouter.post("/cancel-action", adminAiCancelActionController);

// 3. Conversation Session Management
adminAiRouter.get("/conversations", getAdminConversationsController);
adminAiRouter.get("/conversations/:id", getAdminConversationByIdController);
adminAiRouter.delete("/conversations/:id", deleteAdminConversationController);

// 4. Proactive Business Insights
adminAiRouter.get("/insights", getAdminAiInsightsController);

// 5. Creative Studio & Poster Project Management
adminAiRouter.get("/designs", getAdminDesignsController);
adminAiRouter.post("/designs", saveAdminDesignController);
adminAiRouter.post("/designs/validate", validateAdminDesignController);
adminAiRouter.post("/designs/operations", createAiChatLimiter({ windowMs: 60 * 1000, max: 20 }), applyAdminDesignOperationsController);
adminAiRouter.get("/brand-kit", getBrandKitController);
adminAiRouter.get("/analytics", authenticate, authorize("dashboard:view", "report:view"), getAdminBusinessAnalyticsController);

// 6. Report Export (Excel/CSV)
adminAiRouter.get("/export-report", authenticate, authorize("dashboard:view", "report:view"), exportAdminReportController);
adminAiRouter.get("/reports/export", authenticate, authorize("dashboard:view", "report:view"), exportAdminReportController);

// 7. Multi-Provider AI Configuration & Health (Admin Only)
adminAiRouter.get("/settings", adminOnly, getAdminAiSettingsController);
adminAiRouter.put("/settings", adminOnly, updateAdminAiSettingsController);
adminAiRouter.post("/settings/test-connection", adminOnly, testAiProviderConnectionController);

// 8. Cost Management & Usage Tracking (Admin Only)
adminAiRouter.get("/usage", adminOnly, getAdminAiUsageController);

// 9. Real AI Image Generation, Reference Upload & Vision Analysis
adminAiRouter.post("/images/generate", generateAdminAiImageController);
adminAiRouter.post("/images/upload", receiveReference, uploadAiReferenceController);
adminAiRouter.post("/vision/analyze", analyzeVisionController);

export default adminAiRouter;
