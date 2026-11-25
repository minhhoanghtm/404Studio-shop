import adminAiAgentService from "./services/adminAiAgent.service.js";
import AdminAiConversation from "./models/adminAiConversation.model.js";
import AdminDesignProject from "./models/adminDesignProject.model.js";
import { validateDesignPayload } from "./designPayload.validator.js";
import { validateDesignAssets } from "./designAssetPolicy.js";
import campaignService from "../campaigns/campaign.service.js";
import AdminAiAuditLog from "./models/adminAiAuditLog.model.js";
import AdminAiSettings from "./models/adminAiSettings.model.js";
import providerRegistry from "./providers/ProviderRegistry.js";
import aiRouter from "./services/aiRouter.service.js";
import usageCostTracker from "./services/usageCostTracker.service.js";
import adminImageGenerationService from "./services/adminImageGeneration.service.js";
import { applyDesignOperationsAtomically, designSummary, parseOperations } from "./services/designOperations.service.js";
import * as tools from "./services/adminAiTools.service.js";
import ExcelJS from "exceljs";
import crypto from "crypto";
import path from "path";
import { readFile, rename, unlink } from "node:fs/promises";
import sharp from "sharp";

const ENCRYPTION_SECRET = process.env.ACTION_SECRET || "atelier_verite_ai_default_secret_32_chars";
const CIPHER_KEY = crypto.createHash("sha256").update(ENCRYPTION_SECRET).digest();
const localAssetOrigin = (req) => { const address = req.socket.localAddress?.replace(/^::ffff:/, ''); return address ? `http://${address.includes(':') ? `[${address}]` : address}:${req.socket.localPort}` : undefined; };

function encryptSecret(plainText) {
  if (!plainText || typeof plainText !== "string" || !plainText.trim()) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", CIPHER_KEY, iv);
  let encrypted = cipher.update(plainText.trim(), "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag().toString("hex");
  const lastFour = plainText.trim().slice(-4);
  return { encrypted, iv: iv.toString("hex"), tag, lastFour };
}

export const adminAiChatController = async (req, res, next) => {
  try {
    const { message, conversationId, mode, provider, context, attachments } = req.body;
    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Nội dung câu hỏi không được để trống",
      });
    }

    const authContext = {
      userId: req.user.userId,
      role: req.user.role || "admin",
      email: req.user.email || "admin@atelier.local",
      ipAddress: req.ip || req.headers["x-forwarded-for"] || "127.0.0.1",
      userAgent: req.headers["user-agent"] || "unknown",
    };

    const responseData = await adminAiAgentService.processAdminChat(
      message.trim(),
      { conversationId, mode, provider: provider || "auto", context, attachments },
      authContext
    );

    return res.status(200).json({
      success: true,
      message: "Admin AI Copilot đã xử lý yêu cầu thành công",
      data: responseData,
    });
  } catch (error) {
    next(error);
  }
};

export const adminAiConfirmActionController = async (req, res, next) => {
  try {
    const { actionId, confirmationToken, payload, actionType } = req.body;
    if (!actionId || !confirmationToken || !actionType) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin xác nhận hành động quản trị",
      });
    }

    const authContext = {
      userId: req.user.userId,
      role: req.user.role || "admin",
      email: req.user.email || "admin@atelier.local",
      ipAddress: req.ip || req.headers["x-forwarded-for"] || "127.0.0.1",
      userAgent: req.headers["user-agent"] || "unknown",
    };

    const result = await adminAiAgentService.executeConfirmedAction(
      { actionId, confirmationToken, payload, actionType },
      authContext
    );

    return res.status(200).json({
      success: true,
      message: "Đã thực thi thành công hành động nghiệp vụ được xác nhận",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const adminAiCancelActionController = async (req, res, next) => {
  try {
    const cancelled = await adminAiAgentService.cancelConfirmedAction(req.body?.actionId, { userId: req.user.userId, role: req.user.role });
    return cancelled ? res.status(200).json({ success: true, data: { status: "cancelled" } }) : res.status(404).json({ success: false, message: "Không tìm thấy xác nhận đang chờ." });
  } catch (error) { next(error); }
};

export const getAdminConversationsController = async (req, res, next) => {
  try {
    const adminId = req.user.userId;
    const conversations = await AdminAiConversation.find({
      adminId,
      isArchived: false,
    })
      .select("title mode context updatedAt isPinned")
      .sort({ isPinned: -1, updatedAt: -1 })
      .limit(30)
      .lean();

    return res.status(200).json({
      success: true,
      data: conversations,
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminConversationByIdController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const adminId = req.user.userId;

    const conv = await AdminAiConversation.findOne({ _id: id, adminId }).lean();
    if (!conv) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy phiên làm việc",
      });
    }

    return res.status(200).json({
      success: true,
      data: conv,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAdminConversationController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const adminId = req.user.userId;

    await AdminAiConversation.deleteOne({ _id: id, adminId });

    return res.status(200).json({
      success: true,
      message: "Đã xóa phiên làm việc thành công",
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminAiInsightsController = async (req, res, next) => {
  try {
    const insightsData = await tools.scanProactiveInsights();
    return res.status(200).json({
      success: true,
      data: insightsData,
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminDesignsController = async (req, res, next) => {
  try {
    const adminId = req.user.userId;
    const designs = await AdminDesignProject.find({ adminId, status: { $ne: "archived" } })
      .sort({ updatedAt: -1 })
      .limit(50)
      .lean();
    const normalizedDesigns = designs.map((design) => ({
      ...design,
      // Older flattened records have no editable layers. Do not misrepresent
      // them as reconstructed designs merely because they can be displayed.
      editability: design.editability || (design.layers?.length ? "FULLY_EDITABLE" : "FLATTENED_IMAGE"),
      schemaVersion: design.schemaVersion || 1,
    }));

    return res.status(200).json({
      success: true,
      data: normalizedDesigns,
    });
  } catch (error) {
    next(error);
  }
};

export const saveAdminDesignController = async (req, res, next) => {
  try {
    const adminId = req.user.userId;
    if (Buffer.byteLength(JSON.stringify(req.body), 'utf8') > 1024 * 1024) return res.status(413).json({ success: false, message: 'Thiết kế vượt quá giới hạn 1 MB.' });
    if (['name', 'preset', 'width', 'height', 'background', 'layers'].some((field) => req.body?.[field] === undefined)) return res.status(400).json({ success: false, message: 'Thiết kế thiếu trường bắt buộc.' });
    validateDesignPayload(req.body);
    await validateDesignAssets(req.body, { adminId, localOrigin: localAssetOrigin(req) });
    const { _id, name, preset, width, height, background, layers } = req.body;

    let design;
    if (_id) {
      design = await AdminDesignProject.findOne({ _id, adminId });
      if (!design) return res.status(404).json({ success: false, message: "Không tìm thấy bản thiết kế hoặc bạn không có quyền truy cập." });
      design.versionHistory.push({ version: (design.versionHistory?.length || 0) + 1, name: design.name, canvas: { width: design.width, height: design.height }, background: design.background, layers: design.layers });
      if (design.versionHistory.length > 30) design.versionHistory = design.versionHistory.slice(-30);
      if (name) design.name = name;
      if (preset) design.preset = preset;
      if (width) design.width = width;
      if (height) design.height = height;
      if (background) design.background = background;
      if (layers) design.layers = layers;
      await design.save();
    }

    if (!design) {
      design = new AdminDesignProject({
        adminId,
        name: name || "Dự án thiết kế mới",
        preset: preset || "instagram_portrait",
        width: width || 1080,
        height: height || 1350,
        background: background || { type: "color", value: "#1A1A1A" },
        layers: layers || [],
        status: "draft",
      });
      await design.save();
    }

    return res.status(200).json({
      success: true,
      message: "Đã lưu bản thiết kế vào Creative Studio",
      data: design,
    });
  } catch (error) {
    next(error);
  }
};

export const validateAdminDesignController = async (req, res, next) => {
  try {
    if (Buffer.byteLength(JSON.stringify(req.body), 'utf8') > 1024 * 1024) return res.status(413).json({ success: false, message: 'Thiết kế vượt quá giới hạn 1 MB.' });
    if (['name', 'preset', 'width', 'height', 'background', 'layers'].some((field) => req.body?.[field] === undefined)) return res.status(400).json({ success: false, message: 'Thiết kế thiếu trường bắt buộc.' });
    validateDesignPayload(req.body);
    await validateDesignAssets(req.body, { adminId: req.user.userId, localOrigin: localAssetOrigin(req) });
    return res.status(200).json({ success: true, data: { valid: true } });
  } catch (error) { next(error); }
};

export const applyAdminDesignOperationsController = async (req, res, next) => {
  try {
    const { designId, request, selectedLayerId, provider = "auto" } = req.body;
    if (!designId || !request || typeof request !== "string") return res.status(400).json({ success: false, message: "Cần designId và yêu cầu chỉnh sửa." });
    const design = await AdminDesignProject.findOne({ _id: designId, adminId: req.user.userId });
    if (!design) return res.status(404).json({ success: false, message: "Không tìm thấy design project." });
    const context = designSummary(design);
    const prompt = [
      "Return ONLY JSON: {\"operations\":[...]}. You edit a fashion design document.",
      "Allowed operations: ADD_LAYER, UPDATE_LAYER, REMOVE_LAYER, REORDER_LAYER, DUPLICATE_LAYER, CHANGE_BACKGROUND.",
      "Never emit code, HTML, URLs not already in context, or image generation. Use selectedLayerId when the request is ambiguous.",
      `Selected layer: ${selectedLayerId || "none"}`,
      `Design context: ${JSON.stringify(context)}`,
      `Admin request: ${request}`,
    ].join("\n");
    const result = await aiRouter.executeChatWithFallback({ messages: [{ role: "system", content: prompt }, { role: "user", content: request }], requestedProvider: provider, authContext: { userId: req.user.userId } });
    const operations = parseOperations(result.message);
    const resultDocument = applyDesignOperationsAtomically(design, operations);
    if (!resultDocument) return res.status(422).json({ success: false, message: "Không thể áp dụng toàn bộ thay đổi an toàn; thiết kế chưa bị sửa." });
    const { document, applied } = resultDocument;
    validateDesignPayload(document);
    await validateDesignAssets(document, { adminId: req.user.userId, localOrigin: localAssetOrigin(req) });
    design.versionHistory.push({ version: (design.versionHistory?.length || 0) + 1, name: design.name, canvas: { width: design.width, height: design.height }, background: design.background, layers: design.layers });
    design.background = document.background;
    design.layers = document.layers;
    design.promptHistory.push({ prompt: request, appliedChanges: { operations } });
    await design.save();
    return res.status(200).json({ success: true, data: { design, operations, applied, provider: result.actualProvider || result.primaryProvider || provider } });
  } catch (error) {
    next(error);
  }
};

export const getBrandKitController = async (req, res) => {
  return res.status(200).json({
    success: true,
    data: tools.getBrandKit(),
  });
};

export const getAdminBusinessAnalyticsController = async (req, res, next) => {
  try {
    const { period = "this_month", startDate, endDate } = req.query;
    const supported = ["today", "yesterday", "this_week", "last_week", "this_month", "last_month", "this_quarter", "this_year", "custom"];
    if (typeof period !== "string" || !supported.includes(period) || (period === "custom" && (typeof startDate !== "string" || typeof endDate !== "string")) || (period !== "custom" && (startDate !== undefined || endDate !== undefined))) {
      return res.status(400).json({ success: false, message: "Kỳ thống kê không hợp lệ." });
    }
    const range = tools.parsePeriodDates(period, startDate, endDate);
    if (range.endDate.getTime() - range.startDate.getTime() > 366 * 86400000) return res.status(400).json({ success: false, message: "Khoảng thống kê tối đa 366 ngày." });
    const bounds = { period, startDate: range.startDate.toISOString(), endDate: range.endDate.toISOString() };
    const [summary, trend, inventory, lowStock, customers, topProducts, slowProducts, campaignPerformance] = await Promise.all([tools.getRevenueSummary(bounds), tools.getRevenueTrend(bounds), tools.getInventorySummary(), tools.getLowStockProducts(), tools.getCustomerStatistics(bounds), tools.getTopSellingProducts(bounds), tools.getSlowMovingProducts({ daysThreshold: 30, limit: 10 }), campaignService.getCampaignPerformance({ startDate: range.startDate, endDate: range.endDate })]);
    summary.period = range.periodLabel; trend.period = range.periodLabel; customers.period = range.periodLabel;
    return res.status(200).json({ success: true, data: { summary, trend, inventory, lowStock, customers, topProducts, slowProducts, campaignPerformance } });
  } catch (error) { next(error); }
};

export const exportAdminReportController = async (req, res, next) => {
  try {
    const { period = "this_month", type = "revenue" } = req.query;

    const summary = await tools.getRevenueSummary({ period });
    const topProducts = await tools.getTopSellingProducts({ period, limit: 10 });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "404Studio Admin AI Copilot";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet("Báo Cáo Doanh Thu & Bán Hàng");

    sheet.columns = [
      { header: "Chỉ Số / Sản Phẩm", key: "metric", width: 35 },
      { header: "Giá Trị", key: "value", width: 25 },
      { header: "Ghi Chú", key: "note", width: 30 },
    ];

    sheet.addRow({ metric: "Kỳ báo cáo", value: summary.period, note: "Khoảng thời gian thống kê" });
    sheet.addRow({ metric: "Tổng Doanh Thu (VND)", value: summary.totalRevenue, note: "Doanh thu ghi nhận từ đơn đủ điều kiện" });
    sheet.addRow({ metric: "Số lượng đơn hàng", value: summary.totalOrders, note: "Tổng đơn hàng phát sinh" });
    sheet.addRow({ metric: "Giá trị đơn trung bình (AOV)", value: summary.averageOrderValue, note: "VND / đơn" });
    sheet.addRow({ metric: "Tổng giá trị giảm giá", value: summary.totalDiscounts, note: "Khuyến mãi / Voucher" });
    sheet.addRow({ metric: "Doanh thu thuần", value: summary.netRevenue, note: "Giá trị đơn đã trừ ưu đãi; không trừ lại" });

    sheet.addRow({});
    sheet.addRow({ metric: "TOP SẢN PHẨM BÁN CHẠY", value: "", note: "" });

    topProducts.products.forEach((p, idx) => {
      sheet.addRow({
        metric: `${idx + 1}. ${p.name}`,
        value: `${p.totalSold} sản phẩm`,
        note: p.formattedRevenue,
      });
    });

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="404Studio_AI_Report_${period}_${Date.now()}.xlsx"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
};

// ============================================================================
// MULTI-PROVIDER SETTINGS, USAGE & IMAGE GENERATION CONTROLLERS
// ============================================================================

export const getAdminAiSettingsController = async (req, res, next) => {
  try {
    const settings = await AdminAiSettings.getSettings();
    const providers = await providerRegistry.getProvidersStatus();
    const usageSummary = await usageCostTracker.getUsageSummary();

    // Mask API keys for safe UI inspection
    const maskedKeys = {
      gemini: settings.encryptedApiKeys?.gemini?.lastFour ? `••••••••${settings.encryptedApiKeys.gemini.lastFour}` : process.env.GEMINI_API_KEY ? "••••••••(env)" : null,
      openai: settings.encryptedApiKeys?.openai?.lastFour ? `••••••••${settings.encryptedApiKeys.openai.lastFour}` : process.env.OPENAI_API_KEY ? "••••••••(env)" : null,
      claude: settings.encryptedApiKeys?.claude?.lastFour ? `••••••••${settings.encryptedApiKeys.claude.lastFour}` : process.env.ANTHROPIC_API_KEY ? "••••••••(env)" : null,
      deepseek: settings.encryptedApiKeys?.deepseek?.lastFour ? `••••••••${settings.encryptedApiKeys.deepseek.lastFour}` : process.env.DEEPSEEK_API_KEY ? "••••••••(env)" : null,
      flux: settings.encryptedApiKeys?.flux?.lastFour ? `••••••••${settings.encryptedApiKeys.flux.lastFour}` : process.env.FLUX_API_KEY ? "••••••••(env)" : null,
      cloudflare: process.env.CLOUDFLARE_ACCOUNT_ID && process.env.CLOUDFLARE_API_TOKEN ? "••••••••(env)" : null,
      pollinations: process.env.POLLINATIONS_API_KEY ? "••••••••(env)" : null,
    };

    return res.status(200).json({
      success: true,
      data: {
        settings: {
          defaultProvider: settings.defaultProvider,
          imageDefaultProvider: settings.imageDefaultProvider,
          marketingDefaultProvider: settings.marketingDefaultProvider,
          analyticsDefaultProvider: settings.analyticsDefaultProvider,
          fallbackEnabled: settings.fallbackEnabled,
          requestTimeoutMs: settings.requestTimeoutMs,
          imageDailyLimit: settings.imageDailyLimit,
          imageMaxVariants: settings.imageMaxVariants,
          monthlyBudgetUsd: settings.monthlyBudgetUsd,
          modelOverrides: settings.modelOverrides,
          maskedKeys,
        },
        providers,
        usageSummary,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateAdminAiSettingsController = async (req, res, next) => {
  try {
    const {
      defaultProvider,
      imageDefaultProvider,
      marketingDefaultProvider,
      analyticsDefaultProvider,
      fallbackEnabled,
      requestTimeoutMs,
      imageDailyLimit,
      imageMaxVariants,
      monthlyBudgetUsd,
      modelOverrides,
      apiKeys,
    } = req.body;

    const settings = await AdminAiSettings.getSettings();

    if (defaultProvider) settings.defaultProvider = defaultProvider;
    if (imageDefaultProvider) settings.imageDefaultProvider = imageDefaultProvider;
    if (marketingDefaultProvider) settings.marketingDefaultProvider = marketingDefaultProvider;
    if (analyticsDefaultProvider) settings.analyticsDefaultProvider = analyticsDefaultProvider;
    if (typeof fallbackEnabled === "boolean") settings.fallbackEnabled = fallbackEnabled;
    if (requestTimeoutMs) settings.requestTimeoutMs = Number(requestTimeoutMs);
    if (imageDailyLimit) settings.imageDailyLimit = Number(imageDailyLimit);
    if (imageMaxVariants) settings.imageMaxVariants = Number(imageMaxVariants);
    if (monthlyBudgetUsd !== undefined) settings.monthlyBudgetUsd = Number(monthlyBudgetUsd);
    if (modelOverrides) settings.modelOverrides = { ...settings.modelOverrides, ...modelOverrides };

    // Encrypt any submitted API keys (AES-256-GCM)
    if (apiKeys && typeof apiKeys === "object") {
      settings.encryptedApiKeys = settings.encryptedApiKeys || {};
      for (const [provider, keyVal] of Object.entries(apiKeys)) {
        if (keyVal && typeof keyVal === "string" && keyVal.trim() && !keyVal.includes("••••")) {
          settings.encryptedApiKeys[provider] = encryptSecret(keyVal);
        }
      }
    }

    settings.updatedBy = req.user.userId;
    await settings.save();

    return res.status(200).json({
      success: true,
      message: "Cập nhật cấu hình Multi-Provider AI thành công",
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

export const testAiProviderConnectionController = async (req, res, next) => {
  try {
    const { providerId } = req.body;
    if (!providerId) {
      return res.status(400).json({ success: false, message: "Thiếu providerId để kiểm tra" });
    }

    const result = await providerRegistry.testProvider(providerId);
    return res.status(200).json({
      success: result.success,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminAiUsageController = async (req, res, next) => {
  try {
    const summary = await usageCostTracker.getUsageSummary();
    return res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    next(error);
  }
};

export const generateAdminAiImageController = async (req, res, next) => {
  try {
    const { prompt, width = 1024, height = 1024, style = "brick_red", preset = "instagram_portrait", provider = "auto", title, subtitle, discountText } = req.body;
    if (!prompt && !title) {
      return res.status(400).json({ success: false, message: "Yêu cầu tạo hình ảnh cần có nội dung mô tả hoặc tiêu đề" });
    }

    const authContext = {
      userId: req.user.userId,
      role: req.user.role || "admin",
      email: req.user.email || "admin@atelier.local",
    };

    const posterResult = await adminImageGenerationService.generatePosterPipeline({
      title: title || "",
      subtitle: subtitle || "",
      discountText: discountText || "",
      style,
      preset,
      visualDirection: prompt || "",
      requestedProvider: provider,
      authContext,
    });

    return res.status(200).json({
      success: true,
      message: posterResult.generationType === "AI_GENERATED_IMAGE"
        ? "Đã tạo nền ảnh và poster có thể chỉnh sửa."
        : "Đã tạo layout có thể chỉnh sửa; chưa có ảnh AI vì provider không khả dụng.",
      data: posterResult,
    });
  } catch (error) {
    next(error);
  }
};

export const uploadAiReferenceController = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Chưa chọn file hình ảnh tải lên" });
    }
    const expectedFormat = { "image/jpeg": "jpeg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" }[req.file.mimetype];
    try {
      const image = sharp(await readFile(req.file.path), { limitInputPixels: 40000000, failOn: "error" });
      const metadata = await image.metadata();
      if (!expectedFormat || metadata.format !== expectedFormat || !metadata.width || !metadata.height) throw new Error("Invalid image");
      await image.toBuffer();
    } catch {
      await unlink(req.file.path).catch(() => {});
      return res.status(400).json({ success: false, message: "Nội dung ảnh không hợp lệ hoặc vượt giới hạn kích thước." });
    }
    try { await rename(req.file.path, path.resolve(process.cwd(), "uploads", "ai_references", req.file.filename)); }
    catch (error) { await unlink(req.file.path).catch(() => {}); throw error; }
    const configuredPublicBaseUrl = process.env.PUBLIC_BASE_URL?.replace(/\/$/, "");
    const requestBaseUrl = `${req.protocol}://${req.get("host")}`;
    const fileUrl = `${configuredPublicBaseUrl || requestBaseUrl}/uploads/ai_references/${req.file.filename}`;
    return res.status(200).json({
      success: true,
      message: "Tải lên hình ảnh tham chiếu thành công",
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimeType: req.file.mimetype,
        url: fileUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const analyzeVisionController = async (req, res, next) => {
  try {
    const { imageUrls, prompt, provider = "auto" } = req.body;
    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      return res.status(400).json({ success: false, message: "Cần cung cấp ít nhất một đường dẫn hình ảnh để phân tích" });
    }

    const visionProvider = await aiRouter.resolveProvider({
      requestedProvider: provider,
      taskType: "vision",
      requiredCapability: "VISION",
    });

    const analysis = await visionProvider.analyzeVision({
      imageUrls,
      prompt: prompt || "Phân tích bố cục, phong cách, màu sắc chủ đạo và đề xuất định dạng poster quảng cáo phù hợp.",
    });

    return res.status(200).json({
      success: true,
      message: "Đã phân tích hình ảnh thành công",
      data: analysis,
    });
  } catch (error) {
    next(error);
  }
};
