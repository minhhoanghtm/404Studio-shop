import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { protectedRoute, adminOnly, staffOrAdmin } from "../../middlewares/auth.middleware.js";
import { createAiChatLimiter } from "../../middlewares/rateLimiter.middleware.js";
import {
  adminAiChatController,
  adminAiConfirmActionController,
  getAdminConversationsController,
  getAdminConversationByIdController,
  deleteAdminConversationController,
  getAdminAiInsightsController,
  getAdminDesignsController,
  saveAdminDesignController,
  applyAdminDesignOperationsController,
  getBrandKitController,
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

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, REFERENCES_DIR),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname) || ".png";
      cb(null, `ref_${Date.now()}_${Math.random().toString(36).slice(-6)}${ext}`);
    },
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Chỉ hỗ trợ file hình ảnh (JPEG, PNG, WEBP, GIF)"), false);
    }
  },
});

const adminAiRouter = Router();

// Apply security guard: All admin AI endpoints strictly require valid JWT and Admin/Staff role
adminAiRouter.use(protectedRoute);
adminAiRouter.use(staffOrAdmin);

// 1. AI Copilot Chat & Multi-Tool Execution
adminAiRouter.post("/chat", createAiChatLimiter({ windowMs: 60 * 1000, max: 60 }), adminAiChatController);

// 2. Business Mutation Confirmation Gate (Level 3 Actions)
adminAiRouter.post("/confirm-action", adminAiConfirmActionController);

// 3. Conversation Session Management
adminAiRouter.get("/conversations", getAdminConversationsController);
adminAiRouter.get("/conversations/:id", getAdminConversationByIdController);
adminAiRouter.delete("/conversations/:id", deleteAdminConversationController);

// 4. Proactive Business Insights
adminAiRouter.get("/insights", getAdminAiInsightsController);

// 5. Creative Studio & Poster Project Management
adminAiRouter.get("/designs", getAdminDesignsController);
adminAiRouter.post("/designs", saveAdminDesignController);
adminAiRouter.post("/designs/operations", createAiChatLimiter({ windowMs: 60 * 1000, max: 20 }), applyAdminDesignOperationsController);
adminAiRouter.get("/brand-kit", getBrandKitController);

// 6. Report Export (Excel/CSV)
adminAiRouter.get("/export-report", exportAdminReportController);
adminAiRouter.get("/reports/export", exportAdminReportController);

// 7. Multi-Provider AI Configuration & Health (Admin Only)
adminAiRouter.get("/settings", adminOnly, getAdminAiSettingsController);
adminAiRouter.put("/settings", adminOnly, updateAdminAiSettingsController);
adminAiRouter.post("/settings/test-connection", adminOnly, testAiProviderConnectionController);

// 8. Cost Management & Usage Tracking (Admin Only)
adminAiRouter.get("/usage", adminOnly, getAdminAiUsageController);

// 9. Real AI Image Generation, Reference Upload & Vision Analysis
adminAiRouter.post("/images/generate", generateAdminAiImageController);
adminAiRouter.post("/images/upload", upload.single("image"), uploadAiReferenceController);
adminAiRouter.post("/vision/analyze", analyzeVisionController);

export default adminAiRouter;
