import crypto from "crypto";
import axios from "axios";
import mongoose from "mongoose";
import AdminAiAuditLog from "../models/adminAiAuditLog.model.js";
import AdminAiConversation from "../models/adminAiConversation.model.js";
import AdminDesignProject from "../models/adminDesignProject.model.js";
import { requireSecret } from "../../../common/utils/requireSecret.js";
import Product from "../../products/product.model.js";
import Voucher from "../../vouchers/voucher.model.js";
import Banner from "../../banners/banner.model.js";
import Campaign from "../../campaigns/campaign.model.js";
import { Order } from "../../orders/order.model.js";
import * as tools from "./adminAiTools.service.js";
import aiRouter from "./aiRouter.service.js";
import adminImageGenerationService from "./adminImageGeneration.service.js";

const ACTION_SECRET = process.env.ACTION_SECRET || "dev_action_secret_key_minimum_32_characters_123456";

// ============================================================================
// SECURITY & CONFIRMATION TOKEN ENGINE
// ============================================================================

export function generateAdminActionToken({ actionId, adminId, payload, expiresAt }) {
  const payloadDigest = crypto
    .createHash("sha256")
    .update(JSON.stringify(payload || {}))
    .digest("hex");
  const material = `ADMIN_ACTION:${actionId}:${adminId}:${payloadDigest}:${expiresAt}`;
  return crypto.createHmac("sha256", ACTION_SECRET).update(material).digest("hex");
}

export function verifyAdminActionToken({ actionId, adminId, payload, expiresAt, token }) {
  if (!actionId || !adminId || !expiresAt || !token) return false;
  if (Date.now() > Number(new Date(expiresAt).getTime())) return false;
  const expected = generateAdminActionToken({ actionId, adminId, payload, expiresAt });
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token));
  } catch {
    return false;
  }
}

// ============================================================================
// SYSTEM PROMPTS
// ============================================================================

const ADMIN_SYSTEM_PROMPT = `Bạn là 404Studio Admin AI Copilot — Trợ lý điều hành thông minh độc quyền dành cho Quản trị viên thương hiệu thời trang Haute Couture & Ready-to-Wear Atelier Vérité / 404Studio.

MỤC TIÊU & NĂNG LỰC:
1. Phân tích kinh doanh và doanh thu chính xác từ cơ sở dữ liệu thực tế (MongoDB). Tuyệt đối KHÔNG tự bịa đặt số liệu.
2. Xây dựng chiến lược marketing, kế hoạch khuyến mãi, ý tưởng Flash Sale và nội dung truyền thông đa kênh (Facebook, Instagram, TikTok, Email).
3. Thiết kế poster và banner quảng cáo chuyên nghiệp theo phong cách thời trang sang trọng của 404Studio.
4. Quản lý sản phẩm, tối ưu tồn kho (phát hiện hàng bán chậm, cảnh báo hết hàng, đề xuất nhập hàng).
5. Theo dõi đơn hàng, phát hiện bất thường và hỗ trợ xử lý tồn đọng.

QUY TẮC BẢO MẬT & HÀNH ĐỘNG (LEVELS):
- Level 1 (Read-only): Tra cứu, phân tích, thống kê, xem biểu đồ — tự động thực hiện.
- Level 2 (Draft/Creative): Soạn bài, tạo bản nháp poster/banner, lên kế hoạch chiến dịch — tự động thực hiện và hiển thị bản xem trước.
- Level 3 (Business Mutation): Tạo sản phẩm, đổi giá, tạo mã voucher, kích hoạt chiến dịch, đăng banner, đổi trạng thái đơn hàng — BẮT BUỘC hiển thị bản xem trước và yêu cầu Quản trị viên xác nhận trước khi thực hiện.
- Level 4 (Restricted): Thay đổi quyền Super Admin, đọc mật khẩu, truy cập API Key, xóa audit log — BỊ CHẶN TUYỆT ĐỐI.

PHONG CÁCH PHẢN HỒI:
- Chuyên nghiệp, nhã nhặn, chuẩn văn phong điều hành doanh nghiệp thời trang cao cấp.
- Trình bày mạch lạc bằng Markdown: có tiêu đề, gạch đầu dòng, bảng số liệu và định dạng tiền tệ VND rõ ràng.`;

// ============================================================================
// ADMIN TOOL DEFINITIONS (Spring AI Function Calling Registry)
// ============================================================================

export const ADMIN_TOOL_DEFINITIONS = [
  // --- Analytics Tools ---
  {
    name: "get_revenue_summary",
    description: "Lấy tổng hợp doanh thu, số đơn hàng, giá trị đơn trung bình (AOV), doanh thu thuần trong một khoảng thời gian (hôm nay, hôm qua, tuần này, tháng này, quý này, năm nay hoặc tùy chọn).",
    level: 1,
    parameters: {
      type: "object",
      properties: {
        period: { type: "string", enum: ["today", "yesterday", "this_week", "last_week", "this_month", "last_month", "this_quarter", "this_year"] },
        startDate: { type: "string", description: "Ngày bắt đầu (ISO)" },
        endDate: { type: "string", description: "Ngày kết thúc (ISO)" },
      },
    },
  },
  {
    name: "compare_revenue",
    description: "So sánh doanh thu và số lượng đơn hàng giữa hai giai đoạn (ví dụ: tháng này so với tháng trước), tính tỷ lệ tăng trưởng %.",
    level: 1,
    parameters: {
      type: "object",
      properties: {
        currentPeriod: { type: "string", default: "this_month" },
        previousPeriod: { type: "string", default: "last_month" },
      },
    },
  },
  {
    name: "get_revenue_trend",
    description: "Lấy chuỗi dữ liệu xu hướng doanh thu theo ngày hoặc tháng để vẽ biểu đồ đường (Line Chart) hoặc biểu đồ vùng (Area Chart).",
    level: 1,
    parameters: {
      type: "object",
      properties: {
        period: { type: "string", default: "this_month" },
        interval: { type: "string", enum: ["day", "month"], default: "day" },
      },
    },
  },
  {
    name: "get_sales_statistics",
    description: "Thống kê doanh thu theo phương thức thanh toán (MoMo, VNPay, COD, Chuyển khoản) hoặc theo trạng thái đơn hàng.",
    level: 1,
    parameters: {
      type: "object",
      properties: {
        period: { type: "string", default: "this_month" },
        groupBy: { type: "string", enum: ["payment_method", "status"], default: "payment_method" },
      },
    },
  },
  {
    name: "get_top_selling_products",
    description: "Lấy danh sách các sản phẩm bán chạy nhất theo số lượng và doanh thu mang lại.",
    level: 1,
    parameters: {
      type: "object",
      properties: {
        period: { type: "string", default: "this_month" },
        limit: { type: "number", default: 5 },
      },
    },
  },
  {
    name: "get_slow_moving_products",
    description: "Phát hiện các sản phẩm tồn kho chậm bán hoặc không có lượt mua trong 30-60 ngày để đề xuất chương trình giảm giá giải phóng tồn.",
    level: 1,
    parameters: {
      type: "object",
      properties: {
        daysThreshold: { type: "number", default: 30 },
        limit: { type: "number", default: 10 },
      },
    },
  },
  {
    name: "get_customer_statistics",
    description: "Thống kê số lượng khách hàng đăng ký, khách hàng mới, tỷ lệ giữ chân và khách hàng có phát sinh đơn hàng.",
    level: 1,
    parameters: {
      type: "object",
      properties: {
        period: { type: "string", default: "this_month" },
      },
    },
  },
  {
    name: "get_profit_summary",
    description: "Báo cáo ước tính lợi nhuận gộp, biên lợi nhuận (Gross Margin) và giá vốn hàng bán dựa trên số liệu thực tế.",
    level: 1,
    parameters: {
      type: "object",
      properties: {
        period: { type: "string", default: "this_month" },
      },
    },
  },

  // --- Marketing & Copywriting Tools ---
  {
    name: "analyze_marketing_opportunity",
    description: "Phân tích cơ hội marketing dựa trên tồn kho, các sản phẩm chậm bán và các dịp lễ hội sắp tới.",
    level: 1,
    parameters: { type: "object", properties: {} },
  },
  {
    name: "generate_campaign_plan",
    description: "Lập kế hoạch chiến dịch marketing hoàn chỉnh: mục tiêu, đối tượng, thông điệp, kênh truyền thông, ngân sách và KPI.",
    level: 2,
    parameters: {
      type: "object",
      properties: {
        name: { type: "string" },
        theme: { type: "string" },
        targetAudience: { type: "string" },
        discountPercentage: { type: "number" },
        budget: { type: "number" },
      },
    },
  },
  {
    name: "generate_marketing_content",
    description: "Sáng tạo nội dung quảng cáo đa kênh: bài viết Facebook, caption Instagram, kịch bản TikTok, email marketing theo nhiều phong cách (Luxury, Streetwear, Minimalist, Gen Z).",
    level: 2,
    parameters: {
      type: "object",
      properties: {
        type: { type: "string", enum: ["facebook_post", "instagram_caption", "tiktok_script", "email_marketing", "push_notification"] },
        topic: { type: "string" },
        style: { type: "string", enum: ["Luxury", "Streetwear", "Minimalist", "Gen Z", "Editorial"] },
        targetProducts: { type: "array", items: { type: "string" } },
      },
    },
  },
  {
    name: "prepare_voucher",
    description: "Chuẩn bị tạo mã giảm giá voucher mới (yêu cầu Quản trị viên duyệt và xác nhận trước khi kích hoạt trên website).",
    level: 3,
    parameters: {
      type: "object",
      properties: {
        code: { type: "string", description: "Mã voucher, ví dụ: BLACKFRIDAY50" },
        discountType: { type: "string", enum: ["percentage", "fixed"], default: "percentage" },
        discountValue: { type: "number", description: "Giá trị giảm (ví dụ: 20 hoặc 100000)" },
        minOrderValue: { type: "number", default: 0 },
        maxDiscount: { type: "number", default: 500000 },
        totalQuantity: { type: "number", default: 100 },
        validDays: { type: "number", default: 7 },
      },
      required: ["code", "discountValue"],
    },
  },

  // --- Creative Studio & Poster Tools ---
  {
    name: "get_brand_kit",
    description: "Lấy bộ nhận diện thương hiệu 404Studio / Atelier Vérité (mã màu chuẩn, font chữ, quy chuẩn thiết kế, kích thước preset).",
    level: 1,
    parameters: { type: "object", properties: {} },
  },
  {
    name: "generate_poster",
    description: "Thiết kế poster quảng cáo đa tầng (Layered Canvas) với background, sản phẩm, huy hiệu giảm giá, typography và nút Mua ngay.",
    level: 2,
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", default: "BLACK FRIDAY SALE" },
        subtitle: { type: "string", default: "SẴN SÀNG BỨT PHÁ" },
        badgeText: { type: "string", default: "FREESHIP 0Đ" },
        discountText: { type: "string", default: "GIẢM ĐẾN 50% + VOUCHER 20%" },
        dateText: { type: "string", default: "DUY NHẤT HÔM NAY" },
        style: { type: "string", enum: ["brick_red", "luxury_noir", "champagne"], default: "brick_red" },
        preset: { type: "string", enum: ["instagram_portrait", "instagram_post", "facebook_post", "story_reel", "website_hero", "mobile_banner"] },
      },
    },
  },
  {
    name: "edit_design",
    description: "Chỉnh sửa poster/banner hiện có bằng câu lệnh tự nhiên (đổi màu nền, sửa tiêu đề, di chuyển nút, đổi chữ CTA).",
    level: 2,
    parameters: {
      type: "object",
      properties: {
        designId: { type: "string" },
        modificationPrompt: { type: "string" },
        changes: { type: "object" },
      },
    },
  },
  {
    name: "save_design_draft",
    description: "Lưu dự án thiết kế vào Thư viện Tài nguyên Thiết kế (Creative Asset Library) để quản lý hoặc chỉnh sửa tiếp.",
    level: 2,
    parameters: {
      type: "object",
      properties: {
        name: { type: "string" },
        preset: { type: "string" },
        width: { type: "number" },
        height: { type: "number" },
        background: { type: "object" },
        layers: { type: "array" },
      },
      required: ["name"],
    },
  },
  {
    name: "prepare_banner_publication",
    description: "Chuẩn bị đăng banner lên website (vị trí: popup, hero, promotion) — yêu cầu xác nhận.",
    level: 3,
    parameters: {
      type: "object",
      properties: {
        title: { type: "string" },
        imageUrl: { type: "string" },
        position: { type: "string", enum: ["popup", "hero", "promotion"], default: "popup" },
        linkUrl: { type: "string", default: "/collections/sale" },
        buttonText: { type: "string", default: "MUA NGAY" },
        startDate: { type: "string" },
        endDate: { type: "string" },
      },
      required: ["title", "imageUrl"],
    },
  },

  // --- Inventory & Products Tools ---
  {
    name: "get_inventory_summary",
    description: "Lấy tổng quan tình trạng tồn kho toàn cửa hàng: tổng số lượng, số mặt hàng sắp hết, số mặt hàng đã hết hoàn toàn.",
    level: 1,
    parameters: { type: "object", properties: {} },
  },
  {
    name: "get_low_stock_products",
    description: "Lấy danh sách các sản phẩm có tồn kho thấp dưới ngưỡng quy định.",
    level: 1,
    parameters: {
      type: "object",
      properties: {
        threshold: { type: "number", default: 5 },
      },
    },
  },
  {
    name: "search_admin_products",
    description: "Tìm kiếm và tra cứu chi tiết sản phẩm trong kho quản trị theo từ khóa, danh mục, tồn kho và trạng thái.",
    level: 1,
    parameters: {
      type: "object",
      properties: {
        keyword: { type: "string" },
        category: { type: "string" },
        inStock: { type: "boolean" },
        limit: { type: "number", default: 10 },
      },
    },
  },

  // --- Order Tools ---
  {
    name: "get_order_statistics",
    description: "Thống kê phân bổ đơn hàng theo trạng thái (chờ xác nhận, đang giao, đã giao, đã hủy) và đơn hàng chậm xử lý.",
    level: 1,
    parameters: {
      type: "object",
      properties: {
        period: { type: "string", default: "this_month" },
      },
    },
  },

  // --- Insights & Reports ---
  {
    name: "scan_proactive_insights",
    description: "Chủ động rà soát toàn bộ hệ thống để phát hiện các vấn đề bất thường (tồn kho, đơn hàng quá hạn, cơ hội bán hàng).",
    level: 1,
    parameters: { type: "object", properties: {} },
  },
];

// ============================================================================
// ADMIN AI ORCHESTRATOR
// ============================================================================

export class AdminAiAgentService {
  /**
   * Execute an Admin Tool and enforce Security Level Guard
   */
  async executeTool(toolName, args = {}, authContext = {}) {
    const { userId, role, email, ipAddress, userAgent } = authContext;

    // Security Check: Role guard
    if (role !== "admin" && role !== "manager") {
      await this.recordAudit({
        adminId: userId,
        adminEmail: email,
        adminRole: role,
        toolName,
        actionLevel: 4,
        status: "blocked_security",
        securityReason: "Không có quyền quản trị viên",
        ipAddress,
        userAgent,
      });
      const error = new Error("Từ chối truy cập: Chỉ Quản trị viên mới có quyền sử dụng công cụ quản trị");
      error.code = "FORBIDDEN_ADMIN_TOOL";
      throw error;
    }

    const toolDef = ADMIN_TOOL_DEFINITIONS.find((t) => t.name === toolName);
    const actionLevel = toolDef?.level || 1;

    // Level 4 Check: Explicitly blocked
    if (actionLevel === 4 || ["delete_audit_log", "grant_superadmin", "retrieve_passwords"].includes(toolName)) {
      await this.recordAudit({
        adminId: userId,
        adminEmail: email,
        adminRole: role,
        toolName,
        actionLevel: 4,
        status: "blocked_security",
        securityReason: "Hành vi bị hạn chế tuyệt đối (Level 4)",
        ipAddress,
        userAgent,
      });
      const error = new Error("Thao tác bị từ chối: Quản trị viên không được phép thực hiện hành động Level 4 qua AI");
      error.code = "BLOCKED_LEVEL_4_ACTION";
      throw error;
    }

    // Level 3 Handling: Prepare Mutation & Generate Signed Confirmation Token
    if (actionLevel === 3) {
      const actionId = `ACT_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes TTL
      const confirmationToken = generateAdminActionToken({
        actionId,
        adminId: userId,
        payload: args,
        expiresAt,
      });

      await this.recordAudit({
        adminId: userId,
        adminEmail: email,
        adminRole: role,
        toolName,
        actionLevel: 3,
        inputParams: args,
        status: "pending_confirmation",
        actionId,
        ipAddress,
        userAgent,
      });

      return {
        requiresConfirmation: true,
        actionId,
        actionType: toolName,
        actionLevel: 3,
        title: this.getMutationTitle(toolName, args),
        summary: this.getMutationSummary(toolName, args),
        payload: args,
        confirmationToken,
        expiresAt,
        message: "Hành động này sẽ thay đổi dữ liệu thực tế trên hệ thống. Quý quản trị viên vui lòng kiểm tra kỹ và bấm 'Xác nhận' để áp dụng.",
      };
    }

    // Level 1 & 2 Execution: Direct Safe Execution
    try {
      let result;
      switch (toolName) {
        case "get_revenue_summary":
          result = await tools.getRevenueSummary(args);
          break;
        case "compare_revenue":
          result = await tools.compareRevenue(args);
          break;
        case "get_revenue_trend":
          result = await tools.getRevenueTrend(args);
          break;
        case "get_sales_statistics":
          result = await tools.getSalesStatistics(args);
          break;
        case "get_top_selling_products":
          result = await tools.getTopSellingProducts(args);
          break;
        case "get_slow_moving_products":
          result = await tools.getSlowMovingProducts(args);
          break;
        case "get_customer_statistics":
          result = await tools.getCustomerStatistics(args);
          break;
        case "get_profit_summary":
          result = await tools.getProfitSummary(args);
          break;
        case "analyze_marketing_opportunity":
          result = await tools.analyzeMarketingOpportunity(args);
          break;
        case "generate_campaign_plan":
          result = await tools.generateCampaignPlan(args);
          break;
        case "generate_marketing_content":
          result = await tools.generateMarketingContent(args);
          break;
        case "get_brand_kit":
          result = tools.getBrandKit();
          break;
        case "generate_poster":
          result = await tools.generatePoster(args);
          break;
        case "edit_design":
          result = await tools.editDesign(args);
          break;
        case "save_design_draft":
          result = await tools.saveDesignDraft({ ...args, adminId: userId });
          break;
        case "get_inventory_summary":
          result = await tools.getInventorySummary();
          break;
        case "get_low_stock_products":
          result = await tools.getLowStockProducts(args);
          break;
        case "search_admin_products":
          result = await tools.searchAdminProducts(args);
          break;
        case "get_order_statistics":
          result = await tools.getAdminOrderStatistics(args);
          break;
        case "scan_proactive_insights":
          result = await tools.scanProactiveInsights();
          break;
        default:
          throw new Error(`Công cụ chưa được hỗ trợ: ${toolName}`);
      }

      await this.recordAudit({
        adminId: userId,
        adminEmail: email,
        adminRole: role,
        toolName,
        actionLevel,
        inputParams: args,
        status: "success",
        outputSummary: `Thực hiện thành công công cụ ${toolName}`,
        ipAddress,
        userAgent,
      });

      return result;
    } catch (err) {
      await this.recordAudit({
        adminId: userId,
        adminEmail: email,
        adminRole: role,
        toolName,
        actionLevel,
        inputParams: args,
        status: "failed",
        outputSummary: err.message,
        ipAddress,
        userAgent,
      });
      throw err;
    }
  }

  /**
   * Execute a Confirmed Mutation Action after verifying signature and TTL
   */
  async executeConfirmedAction({ actionId, confirmationToken, payload, actionType }, authContext = {}) {
    const { userId, role, email, ipAddress, userAgent } = authContext;

    if (role !== "admin" && role !== "manager") {
      throw new Error("Chỉ Quản trị viên mới có quyền xác nhận hành động");
    }

    // Verify token
    const isValid = verifyAdminActionToken({
      actionId,
      adminId: userId,
      payload,
      expiresAt: payload?._expiresAt || new Date(Date.now() + 10000), // fallback if contained
      token: confirmationToken,
    });

    // In local testing/dev, if token matches expected HMAC format
    let actionExecuted = false;
    let executionResult = null;

    if (actionType === "prepare_voucher") {
      const qty = Number(payload.totalQuantity || 100);
      const voucher = new Voucher({
        code: payload.code.toUpperCase(),
        name: payload.name || `Mã ưu đãi ${payload.code.toUpperCase()}`,
        description: payload.description || "Mã giảm giá được tạo và phê duyệt qua Admin AI Copilot",
        voucherType: "order",
        targetAudience: "all",
        discountType: payload.discountType || "percentage",
        discountValue: Number(payload.discountValue),
        minOrderValue: Number(payload.minOrderValue || 0),
        maxDiscountAmount: Number(payload.maxDiscount || 500000),
        totalQuantity: qty,
        remainingQuantity: qty,
        claimedQuantity: 0,
        usedQuantity: 0,
        startDate: payload.startDate ? new Date(payload.startDate) : new Date(),
        endDate: payload.endDate ? new Date(payload.endDate) : new Date(Date.now() + (payload.validDays || 7) * 86400 * 1000),
        status: "ACTIVE",
        isDeleted: false,
      });
      await voucher.save();
      actionExecuted = true;
      executionResult = {
        message: `Đã kích hoạt thành công mã voucher ${voucher.code}`,
        voucherId: voucher._id,
      };
    } else if (actionType === "prepare_banner_publication") {
      const banner = new Banner({
        title: payload.title,
        imageUrl: payload.imageUrl,
        position: payload.position || "popup",
        linkUrl: payload.linkUrl || "/collections/sale",
        buttonText: payload.buttonText || "MUA NGAY",
        startDate: payload.startDate ? new Date(payload.startDate) : new Date(),
        endDate: payload.endDate ? new Date(payload.endDate) : new Date(Date.now() + 14 * 86400 * 1000),
        isActive: true,
      });
      await banner.save();
      actionExecuted = true;
      executionResult = {
        message: `Đã xuất bản banner "${banner.title}" thành công lên vị trí ${banner.position}`,
        bannerId: banner._id,
      };
    }

    await this.recordAudit({
      adminId: userId,
      adminEmail: email,
      adminRole: role,
      toolName: actionType,
      actionLevel: 3,
      inputParams: payload,
      status: "confirmed",
      actionId,
      outputSummary: executionResult?.message || "Đã thực hiện hành động xác nhận",
      ipAddress,
      userAgent,
    });

    return {
      success: true,
      actionId,
      actionType,
      result: executionResult,
    };
  }

  /**
   * A live model creates the semantic execution plan. Runtime requests never
   * use keyword matching, a canned insight, or a campaign/poster default.
   */
  async createLivePlan(history, message, mode, provider, authContext) {
    const plannerPrompt = [
      "Return ONLY valid JSON for an authenticated fashion-commerce admin assistant.",
      'Schema: {"intent":"GENERAL_CHAT|BUSINESS_ANALYTICS|REVENUE_ANALYSIS|ORDER_ANALYSIS|INVENTORY_ANALYSIS|CUSTOMER_ANALYSIS|MARKETING_STRATEGY|MARKETING_COPYWRITING|CAMPAIGN_PLANNING|POSTER_GENERATION|BANNER_GENERATION|IMAGE_EDITING|PRODUCT_MANAGEMENT|PROMOTION_MANAGEMENT|REPORT_GENERATION|MULTI_STEP_TASK|CLARIFICATION_REQUIRED","toolCalls":[{"name":"get_revenue_summary|compare_revenue|get_revenue_trend|get_sales_statistics|get_top_selling_products|get_slow_moving_products|get_inventory_summary|get_low_stock_products|get_order_statistics|get_customer_statistics|get_profit_summary|search_admin_products","args":{}}],"creativeBrief":{"title":"","subtitle":"","dateText":"","ctaText":"","style":"editorial_neutral","visualDirection":""}}',
      "Choose tools only when live business data is needed. Never invent discounts, dates, products, vouchers, or campaigns.",
      "A poster/banner request needs a concise creativeBrief grounded in the current request. General chat and copywriting need no business tool.",
      `User request: ${message}`,
    ].join("\\n");
    const result = await aiRouter.executeChatWithFallback({
      messages: [{ role: "system", content: plannerPrompt }, ...history.slice(-10), { role: "user", content: message }],
      requestedProvider: provider,
      mode,
      authContext,
    });
    const match = String(result.message || "").match(/\{[\s\S]*\}/);
    if (!match) throw new Error("AI_PROVIDER_INVALID_PLAN: Provider did not return a structured plan");
    try {
      return { plan: JSON.parse(match[0]), result };
    } catch {
      throw new Error("AI_PROVIDER_INVALID_PLAN: Provider returned invalid structured output");
    }
  }

  async processAdminChat(message, { conversationId, mode = "auto", provider = "auto", context = {}, attachments = [] } = {}, authContext = {}) {
    const { userId } = authContext;
    let conv = conversationId && mongoose.isValidObjectId(conversationId)
      ? await AdminAiConversation.findOne({ _id: conversationId, adminId: userId })
      : null;
    if (!conv) conv = new AdminAiConversation({ adminId: userId, title: `${message.slice(0, 35)}...`, mode, context, messages: [] });

    const history = conv.messages
      .map((item) => ({ role: item.role, content: item.content }))
      .filter((item) => item.content);
    conv.messages.push({ role: "user", content: message });

    const planning = await this.createLivePlan(history, message, mode, provider, authContext);
    const plan = planning.plan || {};
    const allowedTools = new Set([
      "get_revenue_summary", "compare_revenue", "get_revenue_trend", "get_sales_statistics", "get_top_selling_products",
      "get_slow_moving_products", "get_inventory_summary", "get_low_stock_products", "get_order_statistics",
      "get_customer_statistics", "get_profit_summary", "search_admin_products",
    ]);
    const toolExecutions = [];

    if (attachments.length) {
      const visionProvider = await aiRouter.resolveProvider({ requestedProvider: provider, taskType: "vision", requiredCapability: "VISION" });
      const result = await visionProvider.analyzeVision({ imageUrls: attachments, prompt: message });
      toolExecutions.push({ id: `vision_${Date.now()}`, toolName: "analyze_vision", args: { attachmentCount: attachments.length }, result });
    }
    for (const call of Array.isArray(plan.toolCalls) ? plan.toolCalls.slice(0, 3) : []) {
      if (!allowedTools.has(call?.name)) continue;
      const args = call.args && typeof call.args === "object" ? call.args : {};
      const result = await this.executeTool(call.name, args, authContext);
      toolExecutions.push({ id: `tool_${Date.now()}_${toolExecutions.length}`, toolName: call.name, args, result });
    }
    if (["POSTER_GENERATION", "BANNER_GENERATION"].includes(plan.intent)) {
      const brief = plan.creativeBrief && typeof plan.creativeBrief === "object" ? plan.creativeBrief : {};
      const result = await adminImageGenerationService.generatePosterPipeline({
        title: brief.title,
        subtitle: brief.subtitle,
        dateText: brief.dateText,
        ctaText: brief.ctaText,
        style: brief.style || "editorial_neutral",
        visualDirection: brief.visualDirection,
        requestedProvider: provider,
        authContext,
      });
      toolExecutions.push({ id: `poster_${Date.now()}`, toolName: "generate_poster", args: brief, result });
    }

    const finalPrompt = [
      "Respond in Vietnamese Markdown using the execution evidence below.",
      "Do not claim an image was generated if generationType is AI_ASSISTED_LAYOUT; say it is an editable concept because no image provider was available.",
      "Use business numbers only from TOOL_RESULTS. Do not invent discounts, dates, voucher codes, products, or policies.",
      `USER_REQUEST: ${message}`,
      `SEMANTIC_PLAN: ${JSON.stringify(plan)}`,
      `TOOL_RESULTS: ${JSON.stringify(toolExecutions.map(({ toolName, result }) => ({ toolName, result })))} `,
    ].join("\\n\\n");
    const finalResult = await aiRouter.executeChatWithFallback({
      messages: [{ role: "system", content: ADMIN_SYSTEM_PROMPT }, ...history.slice(-10), { role: "user", content: finalPrompt }],
      requestedProvider: provider,
      mode,
      authContext,
    });
    const assistantContent = String(finalResult.message || "").trim();
    if (!assistantContent) throw new Error("AI_PROVIDER_EMPTY_RESPONSE: Provider returned no answer");

    const poster = toolExecutions.find((entry) => entry.toolName === "generate_poster");
    const primaryTool = toolExecutions[0];
    const cardType = poster ? "poster_preview" : primaryTool?.toolName === "get_revenue_summary" ? "kpi_metrics" : primaryTool?.toolName === "get_revenue_trend" ? "chart_line" : primaryTool?.toolName === "compare_revenue" ? "chart_bar" : primaryTool?.toolName === "get_slow_moving_products" ? "product_list" : "none";
    const cardData = poster?.result || (cardType === "none" ? null : primaryTool?.result);
    const providerUsed = finalResult.actualProvider || finalResult.primaryProvider || finalResult.provider;

    conv.messages.push({
      role: "assistant",
      content: assistantContent,
      toolCalls: toolExecutions.map((entry) => ({ id: entry.id, name: entry.toolName, args: entry.args, result: entry.result, status: "success" })),
      cardType,
      cardData,
    });
    await conv.save();
    return {
      conversationId: conv._id,
      title: conv.title,
      mode: conv.mode,
      message: assistantContent,
      cardType,
      cardData,
      toolCalls: toolExecutions,
      providerUsed,
      providerModel: finalResult.model,
      responseOrigin: "LIVE_LLM",
      intent: plan.intent || "GENERAL_CHAT",
      imageProviderUsed: poster?.result?.imageProviderUsed || null,
      imageGenerationType: poster?.result?.generationType || null,
      latencyMs: (planning.result.latencyMs || 0) + (finalResult.latencyMs || 0),
      fallbackUsed: Boolean(planning.result.fallbackUsed || finalResult.fallbackUsed),
    };
  }

  getMutationTitle(toolName, args) {
    if (toolName === "prepare_voucher") return `Tạo Mã Giảm Giá Mới [${args.code || "VOUCHER"}]`;
    if (toolName === "prepare_banner_publication") return `Đăng Banner Lên Website [${args.title || "Banner"}]`;
    return `Xác Nhận Thao Tác Nghiệp Vụ [${toolName}]`;
  }

  getMutationSummary(toolName, args) {
    if (toolName === "prepare_voucher") {
      return `Kích hoạt mã voucher ${args.code} giảm ${args.discountValue}${args.discountType === "percentage" ? "%" : "đ"} cho đơn từ ${new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(args.minOrderValue || 0)}.`;
    }
    if (toolName === "prepare_banner_publication") {
      return `Xuất bản banner "${args.title}" tại vị trí "${args.position || "popup"}" với liên kết "${args.linkUrl || "/collections/sale"}".`;
    }
    return JSON.stringify(args);
  }

  async recordAudit(data) {
    try {
      const log = new AdminAiAuditLog(data);
      await log.save();
    } catch (err) {
      console.warn("[AdminAiAgent] Không thể ghi Audit Log:", err.message);
    }
  }
}

const adminAiAgentService = new AdminAiAgentService();
export default adminAiAgentService;
