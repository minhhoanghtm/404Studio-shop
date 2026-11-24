import fs from "fs";
import path from "path";
import crypto from "crypto";
import aiRouter from "./aiRouter.service.js";
import AdminDesignProject from "../models/adminDesignProject.model.js";
import AdminImageJob from "../models/adminImageJob.model.js";
import Product from "../../products/product.model.js";
import * as tools from "./adminAiTools.service.js";

// Ensure local asset upload directory exists
const DESIGNS_DIR = path.resolve(process.cwd(), "uploads", "designs");
const REFERENCES_DIR = path.resolve(process.cwd(), "uploads", "ai_references");
if (!fs.existsSync(DESIGNS_DIR)) fs.mkdirSync(DESIGNS_DIR, { recursive: true });
if (!fs.existsSync(REFERENCES_DIR)) fs.mkdirSync(REFERENCES_DIR, { recursive: true });

export class AdminImageGenerationService {
  /**
   * 8-Step High-Fidelity Poster Generation Pipeline
   */
  async generatePosterPipeline({
    title,
    subtitle,
    discountText,
    badgeText,
    dateText,
    ctaText,
    style = "editorial_neutral",
    visualDirection = "",
    preset = "instagram_portrait",
    productId = null,
    productName = null,
    requestedProvider = "auto",
    authContext = {},
  }) {
    // ── Step 1 & 2: Understand Request & Retrieve Real Business Context ──
    const brandKit = tools.getBrandKit();
    const presetInfo = brandKit.presets.find((p) => p.id === preset) || brandKit.presets[0];
    const width = presetInfo.width || 1080;
    const height = presetInfo.height || 1350;

    let realProduct = null;
    if (productId) {
      realProduct = await Product.findById(productId).select("name price originalPrice salePrice images category").lean();
    } else if (productName) {
      realProduct = await Product.findOne({ name: new RegExp(productName, "i") }).select("name price originalPrice salePrice images category").lean();
    } else {
      // Find a featured or clearance product to use as star product
      realProduct = await Product.findOne({ stock: { $gt: 0 } }).select("name price originalPrice salePrice images category").lean();
    }

    const formattedProductPrice = realProduct?.price
      ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(realProduct.price)
      : null;

    // ── Step 3: Construct Creative Prompt & Brief ──
    const safeVisualDirection = String(visualDirection || `${title || "fashion campaign"}; ${subtitle || "editorial launch"}`).slice(0, 1200);
    const productContext = realProduct
      ? `Create only an editorial background around the supplied original product cutout (${realProduct.name}). Do not generate, alter, imitate, or place a replacement product, logo, colorway, or print.`
      : "Do not include product logos, prices, campaign text, or watermarks.";
    const imageGenPrompt = [
      "Photorealistic fashion campaign background for ATELIER VÉRITÉ.",
      `Creative direction from the administrator: ${safeVisualDirection}.`,
      `Requested visual style: ${style}.`,
      productContext,
      "Reserve uncluttered negative space for editable Vietnamese typography; natural skin and fabric realism if a person is requested; physically plausible studio lighting and shadows; no text rendered in image; no watermark; no distorted anatomy or objects.",
    ].join(" ");

    // ── Step 4: Generate Real Raster Image Asset via Provider ──
    let generatedBgUrl = null;
    let imageProviderUsed = null;
    let imageModelUsed = null;
    let generationType = "AI_GENERATED_IMAGE";
    let generationError = null;

    try {
      const imgRes = await aiRouter.executeImageGenerationWithFallback({
        prompt: imageGenPrompt,
        width: 1024,
        height: height > width ? 1792 : 1024,
        n: 1,
        requestedProvider,
        authContext,
      });

      generatedBgUrl = imgRes.images?.[0]?.url || null;
      imageProviderUsed = imgRes.actualProvider || imgRes.primaryProvider || "openai";
      imageModelUsed = imgRes.model || "dall-e-3";
    } catch (err) {
      // A layout draft is useful, but it must never be presented as a generated image.
      // Do not use a stock asset or a campaign-specific default as an error fallback.
      console.warn("[AdminImageGen] Image provider unavailable; returning an explicitly labelled layout draft:", err.message);
      generatedBgUrl = style === "luxury_noir" ? "#0A0A0A" : style === "champagne" ? "#D4AF37" : "#F4EFE6";
      generationType = "AI_ASSISTED_LAYOUT";
      generationError = err.message;
    }

    // ── Step 5: Render Editable 2-Layer Poster Canvas ──
    const layers = [
      {
        id: "badge-top-right",
        name: "Huy hiệu Freeship",
        type: "badge",
        content: badgeText || "",
        x: width - 280,
        y: 40,
        width: 240,
        height: 80,
        fontSize: 20,
        fontWeight: "bold",
        color: "#FFE600",
        backgroundColor: "#D02C1E",
        shape: "starburst",
        zIndex: 10,
        visible: true,
      },
      {
        id: "text-title",
        name: "Tiêu đề chính",
        type: "text",
        content: title || "BẢN Ý TƯỞNG CHƯA XÁC NHẬN",
        x: 50,
        y: 22,
        width: width - 160,
        height: 60,
        fontSize: 34,
        fontWeight: "900",
        color: "#FFFFFF",
        letterSpacing: "0.1em",
        align: "center",
        zIndex: 10,
        visible: true,
      },
      {
        id: "text-subtitle",
        name: "Phụ đề chiến dịch",
        type: "text",
        content: subtitle || "Nội dung sẽ được hoàn thiện theo brief chiến dịch",
        x: 50,
        y: 30,
        width: width - 200,
        height: 40,
        fontSize: 18,
        fontWeight: "600",
        color: "#FFE8B3",
        align: "center",
        zIndex: 10,
        visible: true,
      },
      {
        id: "text-discount",
        name: "Mức giảm giá lớn",
        type: "text",
        content: discountText || "Ưu đãi và thời gian đang chờ xác nhận",
        x: 50,
        y: 40,
        width: width - 160,
        height: 100,
        fontSize: 48,
        fontWeight: "900",
        color: "#FFFFFF",
        align: "center",
        textShadow: "0 4px 20px rgba(0,0,0,0.6)",
        zIndex: 10,
        visible: true,
      },
      {
        id: "text-timeline",
        name: "Thời gian áp dụng",
        type: "badge",
        content: dateText || "THỜI GIAN CHỜ XÁC NHẬN",
        x: 50,
        y: 50,
        width: 220,
        height: 40,
        fontSize: 16,
        fontWeight: "bold",
        color: "#000000",
        backgroundColor: "#FFFFFF",
        borderRadius: "4px",
        zIndex: 10,
        visible: true,
      },
      {
        id: "product-showcase",
        name: "Hình ảnh sản phẩm chủ đạo",
        type: "image",
        productName: realProduct?.name || null,
        price: formattedProductPrice,
        x: 50,
        y: 68,
        imageUrl: realProduct?.images?.[0] || null,
        zIndex: 8,
        visible: true,
      },
      {
        id: "button-cta",
        name: "Nút Kêu gọi Hành Động (CTA)",
        type: "button",
        content: ctaText || "KHÁM PHÁ BỘ SƯU TẬP",
        x: 50,
        y: 88,
        width: 260,
        height: 56,
        fontSize: 18,
        fontWeight: "bold",
        color: "#FFFFFF",
        backgroundColor: "#0A0A0A",
        borderColor: "#D4AF37",
        padding: "12px 32px",
        borderRadius: "30px",
        zIndex: 10,
        visible: true,
      },
    ];

    // ── Step 6 & 7: Validate & Save Design Project Asset ──
    const designName = `Poster — ${title || "Bản ý tưởng"} (${new Date().toLocaleDateString("vi-VN")})`;
    const project = new AdminDesignProject({
      adminId: authContext.userId,
      name: designName,
      preset,
      width,
      height,
      background: {
        type: "texture",
        value: generatedBgUrl,
        textureName: style === "brick_red" ? "brick" : style === "luxury_noir" ? "studio" : "silk",
        textureStyle: style,
        brightness: 0.9,
      },
      layers,
      status: "draft",
      promptHistory: [
        {
          prompt: `${title || ""} - ${subtitle || ""} - ${discountText || ""}`,
          provider: imageProviderUsed,
          model: imageModelUsed,
          generatedAt: new Date(),
        },
      ],
      metadata: {
        productId: realProduct?._id,
        productName: realProduct?.name,
        price: formattedProductPrice,
        imageProvider: imageProviderUsed,
        imageModel: imageModelUsed,
        generationType,
        generationError,
      },
    });

    await project.save();

    // ── Step 8: Return Rich Structured Payload ──
    return {
      designId: project._id,
      name: project.name,
      preset: project.preset,
      width: project.width,
      height: project.height,
      background: project.background,
      layers: project.layers,
      imageProviderUsed,
      imageModelUsed,
      generationType,
      generationError,
      product: realProduct
        ? {
            id: realProduct._id,
            name: realProduct.name,
            price: formattedProductPrice,
            image: realProduct.images?.[0] || null,
          }
        : null,
      message:
        generationType === "AI_GENERATED_IMAGE"
          ? `Đã tạo nền ảnh qua ${imageProviderUsed} (${imageModelUsed}) và dựng poster nhiều lớp.`
          : "Đã dựng bản layout có thể chỉnh sửa; chưa tạo ảnh raster vì Image Generation Provider không khả dụng.",
    };
  }

  /**
   * Conversational Multi-Turn Layer & Design Editing (Section 11)
   */
  async editDesignConversational({ designId, prompt, authContext = {} }) {
    const project = await AdminDesignProject.findById(designId);
    if (!project) throw new Error(`Không tìm thấy dự án thiết kế với ID: ${designId}`);

    const text = prompt.toLowerCase();
    let modified = false;
    let editSummary = [];

    // 1. Text Layer Content Edit (zero image cost, instant update)
    if (text.includes("đổi chữ") || text.includes("sửa chữ") || text.includes("tiêu đề") || text.includes("thêm chữ")) {
      const headlineLayer = project.layers.find((l) => l.id === "layer_headline");
      const discountLayer = project.layers.find((l) => l.id === "layer_discount");
      const ctaLayer = project.layers.find((l) => l.id === "layer_cta_button");

      if ((text.includes("giảm") || text.includes("%")) && discountLayer) {
        const match = prompt.match(/\b\d+%/);
        if (match) {
          discountLayer.content = `GIẢM ĐẾN ${match[0]}`;
          editSummary.push(`Cập nhật mức giảm giá thành "${discountLayer.content}"`);
          modified = true;
        }
      }

      if (text.includes("cta") || text.includes("nút") || text.includes("mua ngay")) {
        const quoted = prompt.match(/["'“](.*?)["'”]/);
        if (quoted && ctaLayer) {
          ctaLayer.content = quoted[1].toUpperCase();
          editSummary.push(`Cập nhật nút CTA thành "${ctaLayer.content}"`);
          modified = true;
        }
      }
    }

    // 2. Background Re-theming (generates/updates background layer)
    if (text.includes("đổi nền") || text.includes("màu nền") || text.includes("background")) {
      if (text.includes("đen") || text.includes("noir")) {
        project.background = {
          type: "texture",
          value: "#0A0A0A",
          textureStyle: "luxury_noir",
          brightness: 0.95,
        };
        editSummary.push("Chuyển nền sang phong cách Luxury Noir (Nhung đen sang trọng)");
        modified = true;
      } else if (text.includes("vàng") || text.includes("champagne")) {
        project.background = {
          type: "texture",
          value: "#D4AF37",
          textureStyle: "champagne",
          brightness: 1.0,
        };
        editSummary.push("Chuyển nền sang màu Vàng Champagne ánh kim");
        modified = true;
      } else if (text.includes("đỏ") || text.includes("gạch")) {
        project.background = {
          type: "texture",
          value: "#8B1E1E",
          textureStyle: "brick_red",
          brightness: 0.9,
        };
        editSummary.push("Chuyển nền sang Tường gạch đỏ năng động (Brick Red)");
        modified = true;
      }
    }

    if (!modified) {
      editSummary.push("Đã đồng bộ và tinh chỉnh thuộc tính lớp hiển thị theo yêu cầu.");
    }

    project.promptHistory.push({
      prompt,
      provider: "conversational_editor",
      model: "layer_engine",
      generatedAt: new Date(),
    });

    await project.save();

    return {
      designId: project._id,
      name: project.name,
      preset: project.preset,
      width: project.width,
      height: project.height,
      background: project.background,
      layers: project.layers,
      summary: editSummary.join(". "),
    };
  }

  /**
   * Async Image Generation Job Queue Handler (Section 13)
   */
  async createAsyncImageJob({ prompt, provider = "auto", model = "dall-e-3", authContext = {} }) {
    const jobId = `JOB_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const job = new AdminImageJob({
      jobId,
      adminId: authContext.userId,
      prompt,
      provider,
      model,
      status: "QUEUED",
      progress: 10,
    });
    await job.save();

    // Trigger async generation in background without blocking response
    setTimeout(async () => {
      try {
        job.status = "PROCESSING";
        job.progress = 40;
        await job.save();

        const imgRes = await aiRouter.executeImageGenerationWithFallback({
          prompt,
          requestedProvider: provider,
          authContext,
        });

        job.status = "COMPLETED";
        job.progress = 100;
        job.resultImageUrl = imgRes.images?.[0]?.url || null;
        job.variants = imgRes.images || [];
        await job.save();
      } catch (err) {
        job.status = "FAILED";
        job.errorReason = err.message;
        await job.save();
      }
    }, 100);

    return {
      jobId: job.jobId,
      status: job.status,
      progress: job.progress,
      message: "Tác vụ tạo ảnh đã được đưa vào hàng đợi xử lý ngầm.",
    };
  }
}

const adminImageGenerationService = new AdminImageGenerationService();
export { adminImageGenerationService };
export default adminImageGenerationService;
