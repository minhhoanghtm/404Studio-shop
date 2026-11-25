import mongoose from "mongoose";
import { Order, OrderItem } from "../../orders/order.model.js";
import Product, { ProductVariant } from "../../products/product.model.js";
import Category from "../../categories/category.model.js";
import User from "../../users/user.model.js";
import Campaign from "../../campaigns/campaign.model.js";
import Banner from "../../banners/banner.model.js";
import Voucher from "../../vouchers/voucher.model.js";
import AdminDesignProject from "../models/adminDesignProject.model.js";
import AdminAiInsight from "../models/adminAiInsight.model.js";
import crypto from "crypto";
import moment from "moment";

// ============================================================================
// DATE RANGE PARSER
// ============================================================================

export function parsePeriodDates(period = "this_month", customStart, customEnd) {
  if (customStart !== undefined || customEnd !== undefined) {
    const parseBoundary = (value, endOfDay) => {
      if (typeof value !== "string") return moment.invalid();
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        const date = moment(value, "YYYY-MM-DD", true);
        return date.isValid() ? moment.parseZone(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}+07:00`, moment.ISO_8601, true) : moment.invalid();
      }
      return moment.parseZone(value, moment.ISO_8601, true);
    };
    const start = parseBoundary(customStart, false);
    const end = parseBoundary(customEnd, true);
    if (!start.isValid() || !end.isValid() || start.isAfter(end)) {
      const error = new Error("Khoảng ngày không hợp lệ."); error.statusCode = 400; error.status = "fail"; error.isOperational = true; throw error;
    }
    return { startDate: start.toDate(), endDate: end.toDate(), periodLabel: `Từ ${start.clone().utcOffset(420).format("DD/MM/YYYY")} đến ${end.clone().utcOffset(420).format("DD/MM/YYYY")}` };
  }
  const now = moment().utcOffset(420);
  let start; let end = now.clone(); let periodLabel;
  switch (period) {
    case "today": start = now.clone().startOf("day"); end = now.clone().endOf("day"); periodLabel = "Hôm nay"; break;
    case "yesterday": start = now.clone().subtract(1, "day").startOf("day"); end = start.clone().endOf("day"); periodLabel = "Hôm qua"; break;
    case "this_week": start = now.clone().startOf("isoWeek"); periodLabel = "Tuần này"; break;
    case "last_week": start = now.clone().subtract(1, "week").startOf("isoWeek"); end = start.clone().endOf("isoWeek"); periodLabel = "Tuần trước"; break;
    case "last_month": start = now.clone().subtract(1, "month").startOf("month"); end = start.clone().endOf("month"); periodLabel = "Tháng trước"; break;
    case "this_quarter": start = now.clone().startOf("quarter"); periodLabel = "Quý này"; break;
    case "this_year": start = now.clone().startOf("year"); periodLabel = "Năm nay"; break;
    default: start = now.clone().startOf("month"); periodLabel = "Tháng này";
  }
  return { startDate: start.toDate(), endDate: end.toDate(), periodLabel };
}

// ============================================================================
// 1. BUSINESS INTELLIGENCE & ANALYTICS TOOLS
// ============================================================================

export async function getRevenueSummary({ period = "this_month", startDate, endDate } = {}) {
  const { startDate: start, endDate: end, periodLabel } = parsePeriodDates(period, startDate, endDate);

  const matchQuery = {
    createdAt: { $gte: start, $lte: end },
  };
  // Match the order dashboard's recognized-revenue rule: delivered and paid,
  // or delivered COD. Keep all orders in the count, including cancellations.
  const recognized = { $and: [{ $eq: ["$status", "delivered"] }, { $ne: ["$payment_status", "refunded"] }, { $or: [{ $eq: ["$payment_method", "cod"] }, { $eq: ["$payment_status", "paid"] }] }] };
  const paidActive = { $and: [{ $eq: ["$payment_status", "paid"] }, { $ne: ["$status", "cancelled"] }] };

  const [aggResult] = await Order.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: { $cond: [recognized, "$total_price", 0] } },
        paidRevenue: {
          $sum: {
            $cond: [paidActive, "$total_price", 0],
          },
        },
        totalOrders: { $sum: 1 },
        paidOrders: {
          $sum: { $cond: [paidActive, 1, 0] },
        },
        deliveredOrders: { $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] } },
        cancelledOrders: { $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] } },
        refundedOrders: { $sum: { $cond: [{ $eq: ["$payment_status", "refunded"] }, 1, 0] } },
        recognizedOrders: { $sum: { $cond: [recognized, 1, 0] } },
        totalDiscounts: { $sum: { $cond: [recognized, { $ifNull: ["$discount_amount", 0] }, 0] } },
      },
    },
  ]);

  const totalOrders = aggResult?.totalOrders || 0;
  const totalRevenue = aggResult?.totalRevenue || 0;
  const paidRevenue = aggResult?.paidRevenue || 0;
  const recognizedOrders = aggResult?.recognizedOrders || 0;
  const aov = recognizedOrders ? Math.round(totalRevenue / recognizedOrders) : 0;
  // Order.total_price already includes shipping and subtracts discounts at checkout.
  const netRevenue = totalRevenue;

  return {
    period: periodLabel,
    startDate: start.toISOString(),
    endDate: end.toISOString(),
    totalRevenue,
    paidRevenue,
    totalOrders,
    paidOrders: aggResult?.paidOrders || 0,
    deliveredOrders: aggResult?.deliveredOrders || 0,
    cancelledOrders: aggResult?.cancelledOrders || 0,
    refundedOrders: aggResult?.refundedOrders || 0,
    recognizedOrders,
    averageOrderValue: aov,
    totalDiscounts: aggResult?.totalDiscounts || 0,
    netRevenue,
    formattedRevenue: new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(totalRevenue),
    formattedAov: new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(aov),
  };
}

export async function compareRevenue({ currentPeriod = "this_month", previousPeriod = "last_month" } = {}) {
  const current = await getRevenueSummary({ period: currentPeriod });
  const previous = await getRevenueSummary({ period: previousPeriod });

  const revenueDiff = current.totalRevenue - previous.totalRevenue;
  const revenueGrowthRate = previous.totalRevenue > 0
    ? Number(((revenueDiff / previous.totalRevenue) * 100).toFixed(2))
    : current.totalRevenue > 0 ? 100 : 0;

  const ordersDiff = current.totalOrders - previous.totalOrders;
  const ordersGrowthRate = previous.totalOrders > 0
    ? Number(((ordersDiff / previous.totalOrders) * 100).toFixed(2))
    : current.totalOrders > 0 ? 100 : 0;

  return {
    current: {
      period: current.period,
      revenue: current.totalRevenue,
      formattedRevenue: current.formattedRevenue,
      orders: current.totalOrders,
      aov: current.averageOrderValue,
    },
    previous: {
      period: previous.period,
      revenue: previous.totalRevenue,
      formattedRevenue: previous.formattedRevenue,
      orders: previous.totalOrders,
      aov: previous.averageOrderValue,
    },
    comparison: {
      revenueDiff,
      revenueGrowthRate,
      isPositive: revenueDiff >= 0,
      ordersDiff,
      ordersGrowthRate,
    },
  };
}

export async function getRevenueTrend({ period = "this_month", interval = "day", startDate, endDate } = {}) {
  const { startDate: start, endDate: end, periodLabel } = parsePeriodDates(period, startDate, endDate);

  let dateFormat = "%Y-%m-%d";
  if (interval === "month") dateFormat = "%Y-%m";

  const timeline = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: start, $lte: end },
        status: "delivered",
        payment_status: { $ne: "refunded" },
        $or: [{ payment_method: "cod" }, { payment_status: "paid" }],
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: dateFormat, date: "$createdAt", timezone: "+07:00" } },
        revenue: { $sum: "$total_price" },
        orders: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const points = timeline.map((t) => ({
    date: t._id,
    revenue: t.revenue,
    orders: t.orders,
  }));

  return {
    period: periodLabel,
    interval,
    dataPoints: points,
    totalPoints: points.length,
  };
}

export async function getSalesStatistics({ period = "this_month", groupBy = "payment_method" } = {}) {
  const { startDate: start, endDate: end, periodLabel } = parsePeriodDates(period);

  let groupField = "$payment_method";
  if (groupBy === "status") groupField = "$status";

  const breakdown = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: start, $lte: end },
      },
    },
    {
      $group: {
        _id: groupField,
        totalRevenue: { $sum: "$total_price" },
        count: { $sum: 1 },
      },
    },
    { $sort: { totalRevenue: -1 } },
  ]);

  return {
    period: periodLabel,
    groupBy,
    breakdown: breakdown.map((b) => ({
      key: b._id || "unknown",
      totalRevenue: b.totalRevenue,
      formattedRevenue: new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(b.totalRevenue),
      orderCount: b.count,
    })),
  };
}

export async function getTopSellingProducts({ limit = 5, period = "this_month", startDate, endDate } = {}) {
  const { startDate: start, endDate: end, periodLabel } = parsePeriodDates(period, startDate, endDate);
  const boundedLimit = Math.min(20, Math.max(1, Math.floor(Number(limit) || 5)));

  const topItems = await Order.aggregate([
    {
      $match: {
        createdAt: { $gte: start, $lte: end },
        status: "delivered",
        payment_status: { $ne: "refunded" },
        $or: [{ payment_method: "cod" }, { payment_status: "paid" }],
      },
    },
    { $lookup: { from: "order_items", localField: "_id", foreignField: "order_id", as: "item" } },
    { $unwind: "$item" },
    {
      $group: {
        _id: { $convert: { input: "$item.product_id", to: "string", onError: "", onNull: "" } },
        productName: { $first: "$item.product_name" },
        productImage: { $first: "$item.product_image" },
        totalSold: { $sum: "$item.quantity" },
        totalRevenue: { $sum: { $multiply: ["$item.price", "$item.quantity"] } },
      },
    },
    { $sort: { totalSold: -1, totalRevenue: -1, _id: 1 } },
    { $limit: boundedLimit },
  ]);

  return {
    period: periodLabel,
    products: topItems.map((p, idx) => ({
      rank: idx + 1,
      productId: String(p._id),
      name: p.productName || "Sản phẩm",
      image: p.productImage || "",
      totalSold: p.totalSold,
      totalRevenue: p.totalRevenue,
      formattedRevenue: new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(p.totalRevenue),
    })),
  };
}

export async function getSlowMovingProducts({ daysThreshold = 30, limit = 10 } = {}) {
  const days = Math.min(366, Math.max(1, Math.floor(Number(daysThreshold) || 30)));
  const boundedLimit = Math.min(20, Math.max(1, Math.floor(Number(limit) || 10)));
  const cutoff = new Date(Date.now() - days * 86400 * 1000);
  const candidates = await Product.aggregate([
    { $match: { is_active: true, stock: { $gt: 0 } } },
    { $sort: { stock: -1, _id: 1 } },
    { $addFields: { productLookupIds: ["$_id", { $toString: "$_id" }] } },
    { $lookup: { from: "order_items", localField: "productLookupIds", foreignField: "product_id", pipeline: [
      { $lookup: { from: "orders", localField: "order_id", foreignField: "_id", as: "order" } },
      { $unwind: "$order" },
      { $match: { "order.createdAt": { $gte: cutoff }, "order.status": "delivered", "order.payment_status": { $ne: "refunded" }, $or: [{ "order.payment_method": "cod" }, { "order.payment_status": "paid" }] } },
      { $group: { _id: null, count: { $sum: "$quantity" } } },
    ], as: "recentSales" } },
    { $addFields: { recentSold: { $ifNull: [{ $arrayElemAt: ["$recentSales.count", 0] }, 0] } } },
    { $match: { recentSold: { $lte: 1 } } },
    { $limit: boundedLimit },
    { $project: { name: 1, slug: 1, new_price: 1, stock: 1, sold: 1, category_id: 1, displayProduct: 1, recentSold: 1 } },
  ]);
  await Product.populate(candidates, { path: "category_id", select: "name slug" });
  const slowMoving = candidates
    .map((p) => {
      const soldRecent = p.recentSold || 0;
      return {
        id: String(p._id),
        name: p.name,
        slug: p.slug,
        price: p.new_price,
        formattedPrice: new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(p.new_price),
        stock: p.stock,
        soldRecent,
        category: p.category_id?.name || "Chưa phân loại",
        image: p.displayProduct?.[0] || "",
        clearancePriority: p.stock > 10 && soldRecent === 0 ? "high" : "medium",
      };
    })
    ;

  return {
    daysThreshold: days,
    totalIdentified: slowMoving.length,
    products: slowMoving,
  };
}

export async function getCustomerStatistics({ period = "this_month", startDate, endDate } = {}) {
  const { startDate: start, endDate: end, periodLabel } = parsePeriodDates(period, startDate, endDate);

  const [totalUsers, newUsersInPeriod, activeCustomers] = await Promise.all([
    User.countDocuments({ role: { $in: ["user", "customer"] } }),
    User.countDocuments({ role: { $in: ["user", "customer"] }, createdAt: { $gte: start, $lte: end } }),
    Order.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end }, user_id: { $ne: null }, status: { $ne: "cancelled" } } },
      { $group: { _id: "$user_id" } },
      { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
      { $unwind: "$user" },
      { $match: { "user.role": { $in: ["user", "customer"] } } },
      { $count: "count" },
    ]),
  ]);

  return {
    period: periodLabel,
    totalRegisteredUsers: totalUsers,
    newUsersInPeriod,
    activeBuyingCustomers: activeCustomers[0]?.count || 0,
    activeCustomerSharePercentage: totalUsers > 0 ? Number((((activeCustomers[0]?.count || 0) / totalUsers) * 100).toFixed(1)) : 0,
  };
}

export async function getProfitSummary({ period = "this_month" } = {}) {
  const summary = await getRevenueSummary({ period });
  // In fashion ready-to-wear, benchmark estimated gross margin is ~55-65%
  const estimatedCostRatio = 0.42;
  const estimatedCOGS = Math.round(summary.totalRevenue * estimatedCostRatio);
  const estimatedGrossProfit = Math.max(0, summary.netRevenue - estimatedCOGS);
  const grossMarginPercentage = summary.totalRevenue > 0
    ? Number(((estimatedGrossProfit / summary.totalRevenue) * 100).toFixed(1))
    : 0;

  return {
    period: summary.period,
    grossRevenue: summary.totalRevenue,
    discountsGiven: summary.totalDiscounts,
    netRevenue: summary.netRevenue,
    estimatedCostOfGoods: estimatedCOGS,
    estimatedGrossProfit,
    grossMarginPercentage,
    formattedGrossProfit: new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(estimatedGrossProfit),
  };
}

// ============================================================================
// 2. MARKETING & CAMPAIGN TOOLS
// ============================================================================

export async function analyzeMarketingOpportunity() {
  const [slowProducts, lowStock, totalOrders] = await Promise.all([
    getSlowMovingProducts({ daysThreshold: 30, limit: 5 }),
    Product.countDocuments({ is_active: true, stock: { $lte: 5 } }),
    Order.countDocuments(),
  ]);

  const upcomingHolidays = [
    { name: "Black Friday Sale", season: "Winter", recommendedDiscount: "30% - 50%" },
    { name: "Mùa Lễ Hội & Giáng Sinh", season: "Holiday", recommendedDiscount: "20% - 40%" },
    { name: "Tết Nguyên Đán Haute Couture", season: "New Year", recommendedDiscount: "15% - 30%" },
    { name: "Flash Sale Xả Tồn Kho", season: "Anytime", recommendedDiscount: "40% - 60%" },
  ];

  return {
    slowMovingCandidates: slowProducts.products,
    lowStockItemCount: lowStock,
    totalHistoricalOrders: totalOrders,
    suggestedCampaignThemes: upcomingHolidays,
    recommendation: slowProducts.products.length > 0
      ? `Phát hiện ${slowProducts.products.length} sản phẩm tồn kho chậm bán. Đề xuất tổ chức chiến dịch Flash Sale hoặc Combo giảm 30%-50% để giải phóng tồn kho.`
      : "Danh mục sản phẩm tiêu thụ đều đặn. Đề xuất chiến dịch ra mắt Bộ sưu tập mới hoặc tri ân khách hàng thân thiết.",
  };
}

export async function generateCampaignPlan({
  name,
  theme = "Flash Sale",
  targetAudience = "Khách hàng thời trang công sở & giới trẻ",
  discountPercentage = 30,
  targetCategory,
  budget = 10000000,
} = {}) {
  const campaignName = name || `${theme} 404Studio - Giảm Đến ${discountPercentage}%`;
  const startDate = new Date();
  const endDate = new Date(Date.now() + 7 * 86400 * 1000); // 7 days

  return {
    name: campaignName,
    theme,
    targetAudience,
    dates: {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      durationDays: 7,
    },
    discountRules: {
      type: "percentage",
      value: Number(discountPercentage),
      scope: targetCategory ? "category" : "all",
      targetCategory: targetCategory || "Toàn bộ danh mục thời trang",
    },
    budget: {
      estimatedMarketingSpend: Number(budget),
      formattedBudget: new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(Number(budget)),
    },
    keyMessaging: `Bứt phá phong cách cùng 404Studio — Ưu đãi độc quyền ${discountPercentage}% duy nhất tuần này.`,
    communicationChannels: [
      "Website Hero Banner & Pop-up Poster",
      "Facebook & Instagram Ads",
      "TikTok Video Lookbook",
      "Email Marketing cho hội viên VIP",
    ],
    kpiTargets: {
      targetRevenue: Number(budget) * 5,
      targetOrders: Math.round((Number(budget) * 5) / 650000),
      expectedROI: "5x",
    },
  };
}

export async function generateMarketingContent({
  type = "facebook_post",
  topic = "Giảm giá Black Friday",
  style = "Luxury",
  language = "vi",
  targetProducts = [],
} = {}) {
  const productMention = targetProducts.length > 0
    ? `Các thiết kế tâm điểm: ${targetProducts.join(", ")}.`
    : "Các tuyệt tác thời trang Atelier Vérité.";

  let headline = "";
  let body = "";
  let cta = "MUA NGAY TẠI ATELIER VÉRITÉ";

  if (style === "Streetwear" || style === "Gen Z") {
    headline = `🔥 ${topic.toUpperCase()} — SẴN SÀNG BỨT PHÁ PHONG CÁCH!`;
    body = `Đừng bỏ lỡ đợt drop lớn nhất mùa này từ 404Studio. Thiết kế chuẩn form, chất liệu cao cấp và phối màu cực chiến.\n\n${productMention}\n\n⚡ Giảm sâu tới 50% + Freeship 0Đ duy nhất hôm nay!`;
    cta = "CHỐT ĐƠN NGAY ▶";
  } else if (style === "Minimalist" || style === "Editorial") {
    headline = `THE QUIET STATEMENT — ${topic.toUpperCase()}`;
    body = `Sự giao thoa hoàn hảo giữa cấu trúc đương đại và tinh thần may đo tối giản. Mỗi đường cắt đều tôn vinh dáng vẻ thanh lịch của bạn.\n\n${productMention}\n\nĐặc quyền ưu đãi giới hạn dành riêng cho quý khách.`;
    cta = "KHÁM PHÁ BỘ SƯU TẬP";
  } else {
    // Luxury / Premium (Default)
    headline = `ATELIER VÉRITÉ — ${topic.toUpperCase()}`;
    body = `Tuyên ngôn phong cách đẳng cấp Haute Couture. Khám phá sự kết hợp tinh tế giữa nghệ thuật dệt may thủ công và xu hướng thời trang quốc tế.\n\n${productMention}\n\nƯu đãi độc quyền giảm đến 50% cùng Voucher quà tặng giới hạn.`;
    cta = "TRẢI NGHIỆM ĐẶC QUYỀN NGAY";
  }

  return {
    type,
    style,
    language,
    headline,
    body,
    callToAction: cta,
    seoTags: ["#404Studio", "#AtelierVerite", "#HauteCouture", "#FashionSale", "#VietnameseFashion"],
  };
}

// ============================================================================
// 3. CREATIVE STUDIO & POSTER DESIGN TOOLS
// ============================================================================

export function getBrandKit() {
  return {
    brandName: "404Studio / Atelier Vérité",
    tagline: "Haute Couture & Contemporary Ready-to-Wear",
    palette: {
      noir: "#0A0A0A",
      charcoal: "#1A1A1A",
      blanc: "#FAFAFA",
      champagneGold: "#D4AF37",
      deepRed: "#8B1E1E",
      brickRed: "#781F1F",
      accent: "#9E7B15",
    },
    typography: {
      display: "Playfair Display, serif",
      body: "Inter, sans-serif",
      mono: "JetBrains Mono, monospace",
    },
    presets: [
      { id: "instagram_portrait", name: "Instagram Portrait", width: 1080, height: 1350 },
      { id: "instagram_post", name: "Instagram Square Post", width: 1080, height: 1080 },
      { id: "facebook_post", name: "Facebook Post", width: 1200, height: 630 },
      { id: "story_reel", name: "Story / Reel Cover", width: 1080, height: 1920 },
      { id: "website_hero", name: "Website Hero Banner", width: 1920, height: 720 },
      { id: "website_promotion", name: "Website Promotion Banner", width: 1920, height: 600 },
      { id: "mobile_banner", name: "Mobile Popup Poster", width: 1080, height: 1350 },
    ],
  };
}

export async function generatePoster({
  title = "BLACK FRIDAY SALE",
  subtitle = "SẴN SÀNG BỨT PHÁ",
  badgeText = "FREESHIP 0Đ",
  discountText = "GIẢM ĐẾN 50% + VOUCHER 20%",
  dateText = "DUY NHẤT HÔM NAY",
  style = "brick_red",
  preset = "instagram_portrait",
  targetProducts = [],
} = {}) {
  const brandKit = getBrandKit();
  const selectedPreset = brandKit.presets.find((p) => p.id === preset) || brandKit.presets[0];
  const { width, height } = selectedPreset;

  // Background style
  let background = {
    type: "texture",
    value: "#731C1C",
    secondaryValue: "#4A0E0E",
    textureName: "brick",
  };

  if (style === "luxury_noir") {
    background = { type: "color", value: "#0A0A0A", secondaryValue: "#1A1A1A", textureName: "studio" };
  } else if (style === "champagne") {
    background = { type: "gradient", value: "#1A1713", secondaryValue: "#3A2F1D", textureName: "silk" };
  }

  // Construct structured layer elements (Layered Canvas architecture)
  const layers = [
    // Layer 1: Top Badge (e.g. FREESHIP 0Đ)
    {
      id: "badge-top-right",
      type: "badge",
      name: "Badge Freeship",
      x: width - 280,
      y: 40,
      width: 240,
      height: 80,
      rotation: 0,
      opacity: 1,
      zIndex: 10,
      visible: true,
      locked: false,
      content: badgeText,
      styles: {
        fontSize: 22,
        fontWeight: "bold",
        color: "#FFE500",
        backgroundColor: "#E53935",
        borderRadius: 8,
        borderWidth: 2,
        borderColor: "#FFFFFF",
        textAlign: "center",
      },
    },
    // Layer 2: Main Title
    {
      id: "text-title",
      type: "text",
      name: "Tiêu đề chính",
      x: 60,
      y: 160,
      width: width - 120,
      height: 70,
      rotation: 0,
      opacity: 1,
      zIndex: 5,
      visible: true,
      locked: false,
      content: title,
      styles: {
        fontFamily: "Playfair Display",
        fontSize: 48,
        fontWeight: "bold",
        color: "#FFFFFF",
        textAlign: "center",
        letterSpacing: 2,
        textTransform: "uppercase",
      },
    },
    // Layer 3: Subtitle
    {
      id: "text-subtitle",
      type: "text",
      name: "Phụ đề chiến dịch",
      x: 80,
      y: 235,
      width: width - 160,
      height: 40,
      rotation: 0,
      opacity: 0.9,
      zIndex: 5,
      visible: true,
      locked: false,
      content: subtitle,
      styles: {
        fontFamily: "Inter",
        fontSize: 22,
        fontWeight: "600",
        color: "#F3F4F6",
        textAlign: "center",
        letterSpacing: 3,
        textTransform: "uppercase",
      },
    },
    // Layer 4: Big Discount Metric
    {
      id: "text-discount",
      type: "text",
      name: "Mức giảm giá lớn",
      x: 60,
      y: 310,
      width: width - 120,
      height: 110,
      rotation: 0,
      opacity: 1,
      zIndex: 6,
      visible: true,
      locked: false,
      content: discountText,
      styles: {
        fontFamily: "Playfair Display",
        fontSize: 64,
        fontWeight: "900",
        color: "#FFFFFF",
        textAlign: "center",
        letterSpacing: 1,
      },
    },
    // Layer 5: Date pill
    {
      id: "badge-date",
      type: "badge",
      name: "Thời gian áp dụng",
      x: (width - 280) / 2,
      y: 440,
      width: 280,
      height: 48,
      rotation: 0,
      opacity: 1,
      zIndex: 6,
      visible: true,
      locked: false,
      content: dateText,
      styles: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#0A0A0A",
        backgroundColor: "#FFFFFF",
        borderRadius: 4,
        textAlign: "center",
      },
    },
    // Layer 6: Main Hero Product Image
    {
      id: "image-hero-product",
      type: "image",
      name: "Hình ảnh sản phẩm chủ đạo",
      x: (width - 600) / 2,
      y: 520,
      width: 600,
      height: 580,
      rotation: 0,
      opacity: 1,
      zIndex: 4,
      visible: true,
      locked: false,
      content: targetProducts[0]?.image || "/assets/promotions/black-friday-poster.jpg",
      styles: {
        borderRadius: 16,
      },
    },
    // Layer 7: CTA Pill Button
    {
      id: "button-cta",
      type: "button",
      name: "Nút Mua Ngay",
      x: (width - 320) / 2,
      y: height - 120,
      width: 320,
      height: 64,
      rotation: 0,
      opacity: 1,
      zIndex: 10,
      visible: true,
      locked: false,
      content: "MUA NGAY ▶",
      styles: {
        fontFamily: "Inter",
        fontSize: 20,
        fontWeight: "bold",
        color: "#FFFFFF",
        backgroundColor: "#0A0A0A",
        borderRadius: 32,
        borderColor: "rgba(255,255,255,0.3)",
        borderWidth: 1,
        textAlign: "center",
        letterSpacing: 2,
      },
    },
  ];

  return {
    name: `Poster — ${title}`,
    preset: selectedPreset.id,
    width,
    height,
    background,
    layers,
    previewUrl: "/assets/promotions/black-friday-poster.jpg",
  };
}

export async function editDesign({ designId, modificationPrompt, changes = {} }) {
  let project = null;
  if (designId && mongoose.isValidObjectId(designId)) {
    project = await AdminDesignProject.findById(designId);
  }

  // If no persisted project, create an in-memory modification
  const baseDesign = project ? project.toObject() : await generatePoster();

  // Apply layer adjustments
  if (changes.title) {
    const titleLayer = baseDesign.layers.find((l) => l.id === "text-title");
    if (titleLayer) titleLayer.content = changes.title;
  }
  if (changes.subtitle) {
    const subLayer = baseDesign.layers.find((l) => l.id === "text-subtitle");
    if (subLayer) subLayer.content = changes.subtitle;
  }
  if (changes.backgroundColor) {
    baseDesign.background.value = changes.backgroundColor;
    baseDesign.background.type = "color";
  }
  if (changes.ctaText) {
    const ctaLayer = baseDesign.layers.find((l) => l.id === "button-cta");
    if (ctaLayer) ctaLayer.content = changes.ctaText;
  }

  // Record prompt history
  if (project) {
    project.layers = baseDesign.layers;
    project.background = baseDesign.background;
    project.promptHistory.push({
      prompt: modificationPrompt || "Chỉnh sửa thiết kế",
      appliedChanges: changes,
    });
    await project.save();
    return project;
  }

  return baseDesign;
}

export async function saveDesignDraft({ adminId, name, preset, width, height, background, layers }) {
  const project = new AdminDesignProject({
    adminId,
    name: name || "Bản nháp poster quảng cáo",
    preset: preset || "instagram_portrait",
    width: width || 1080,
    height: height || 1350,
    background: background || { type: "color", value: "#1A1A1A" },
    layers: layers || [],
    status: "draft",
  });
  await project.save();
  return project;
}

// ============================================================================
// 4. INVENTORY MANAGEMENT TOOLS
// ============================================================================

export async function getInventorySummary() {
  const [totalProducts, outOfStockCount, lowStockCount, totalStockAgg] = await Promise.all([
    Product.countDocuments({ is_active: true }),
    Product.countDocuments({ is_active: true, stock: { $lte: 0 } }),
    Product.countDocuments({ is_active: true, stock: { $gt: 0, $lte: 5 } }),
    Product.aggregate([
      { $match: { is_active: true } },
      { $group: { _id: null, totalUnits: { $sum: "$stock" } } },
    ]),
  ]);

  const totalStock = totalStockAgg?.[0]?.totalUnits || 0;

  return {
    totalActiveProducts: totalProducts,
    totalStockUnits: totalStock,
    outOfStockCount,
    lowStockCount,
    healthStatus: outOfStockCount > 5 ? "Cảnh báo hết hàng cục bộ" : "Tồn kho an toàn",
  };
}

export async function getLowStockProducts({ threshold = 5 } = {}) {
  const items = await Product.find({
    is_active: true,
    stock: { $gt: 0, $lte: Number(threshold) },
  })
    .select("name slug stock new_price sold displayProduct category_id")
    .populate("category_id", "name")
    .sort({ stock: 1 })
    .limit(20)
    .lean();

  return {
    threshold: Number(threshold),
    count: items.length,
    products: items.map((p) => ({
      id: String(p._id),
      name: p.name,
      slug: p.slug,
      stock: p.stock,
      price: p.new_price,
      formattedPrice: new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(p.new_price),
      totalSold: p.sold,
      category: p.category_id?.name || "Chưa phân loại",
      urgency: p.stock <= 2 ? "Rất cao" : "Cần bổ sung",
    })),
  };
}

export async function getOutOfStockProducts() {
  const items = await Product.find({ is_active: true, stock: { $lte: 0 } })
    .select("name slug stock new_price sold category_id")
    .populate("category_id", "name")
    .sort({ sold: -1 })
    .limit(20)
    .lean();

  return {
    count: items.length,
    products: items.map((p) => ({
      id: String(p._id),
      name: p.name,
      slug: p.slug,
      price: p.new_price,
      totalSold: p.sold,
      category: p.category_id?.name || "Chưa phân loại",
    })),
  };
}

// ============================================================================
// 5. PRODUCT & ORDER MANAGEMENT TOOLS
// ============================================================================

export async function searchAdminProducts({ keyword, category, inStock, limit = 10 } = {}) {
  const query = {};
  if (keyword) {
    query.$or = [
      { name: { $regex: keyword, $options: "i" } },
      { slug: { $regex: keyword, $options: "i" } },
    ];
  }
  if (category) {
    const cat = await Category.findOne({
      $or: [{ slug: category }, { name: { $regex: category, $options: "i" } }],
    });
    if (cat) query.category_id = cat._id;
  }
  if (inStock === true) query.stock = { $gt: 0 };
  if (inStock === false) query.stock = { $lte: 0 };

  const products = await Product.find(query)
    .select("name slug new_price old_price stock sold is_active displayProduct category_id")
    .populate("category_id", "name slug")
    .limit(Number(limit) || 10)
    .lean();

  return {
    totalFound: products.length,
    products: products.map((p) => ({
      id: String(p._id),
      name: p.name,
      slug: p.slug,
      price: p.new_price,
      formattedPrice: new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(p.new_price),
      oldPrice: p.old_price,
      stock: p.stock,
      sold: p.sold,
      isActive: p.is_active,
      category: p.category_id?.name || "Chưa phân loại",
      image: p.displayProduct?.[0] || "",
    })),
  };
}

export async function getAdminOrderStatistics({ period = "this_month" } = {}) {
  const { startDate: start, endDate: end, periodLabel } = parsePeriodDates(period);

  const [statusStats, delayedOrders] = await Promise.all([
    Order.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end } } },
      { $group: { _id: "$status", count: { $sum: 1 }, revenue: { $sum: "$total_price" } } },
    ]),
    Order.countDocuments({
      status: "pending",
      createdAt: { $lte: new Date(Date.now() - 48 * 3600 * 1000) },
    }),
  ]);

  const statsMap = {};
  statusStats.forEach((s) => {
    statsMap[s._id] = { count: s.count, revenue: s.revenue };
  });

  return {
    period: periodLabel,
    byStatus: {
      pending: statsMap.pending?.count || 0,
      confirmed: statsMap.confirmed?.count || 0,
      shipping: statsMap.shipping?.count || 0,
      delivered: statsMap.delivered?.count || 0,
      cancelled: statsMap.cancelled?.count || 0,
    },
    delayedOrdersOver48h: delayedOrders,
    cancellationRatePercentage:
      (statsMap.cancelled?.count || 0) + (statsMap.delivered?.count || 0) > 0
        ? Number(
            (
              ((statsMap.cancelled?.count || 0) /
                ((statsMap.cancelled?.count || 0) + (statsMap.delivered?.count || 0))) *
              100
            ).toFixed(1)
          )
        : 0,
  };
}

// ============================================================================
// 6. PROACTIVE BUSINESS INSIGHTS SCANNER
// ============================================================================

export async function scanProactiveInsights() {
  const insights = [];

  // Check 1: Low stock on items with sales
  const lowStock = await Product.find({ is_active: true, stock: { $gt: 0, $lte: 3 }, sold: { $gt: 5 } })
    .select("name stock sold")
    .limit(3)
    .lean();

  if (lowStock.length > 0) {
    insights.push({
      type: "low_stock_alert",
      severity: "high",
      title: "Cảnh báo sắp hết hàng các mẫu bán chạy",
      explanation: `Có ${lowStock.length} sản phẩm bán chạy đang có lượng tồn kho dưới 3 sản phẩm: ${lowStock.map((p) => `${p.name} (còn ${p.stock})`).join(", ")}.`,
      dataMetrics: { count: lowStock.length, products: lowStock },
      recommendedAction: {
        actionType: "restock_suggestion",
        label: "Lập kế hoạch nhập thêm hàng",
        suggestedPrompt: "Đề xuất số lượng nhập hàng an toàn cho các sản phẩm sắp hết hàng này",
      },
    });
  }

  // Check 2: Slow-moving inventory
  const slowItems = await getSlowMovingProducts({ daysThreshold: 30, limit: 3 });
  if (slowItems.products.length > 0) {
    insights.push({
      type: "dead_stock_alert",
      severity: "medium",
      title: "Cơ hội giải phóng tồn kho chậm bán",
      explanation: `Phát hiện ${slowItems.products.length} sản phẩm còn tồn kho nhưng chưa có lượt mua trong 30 ngày qua.`,
      dataMetrics: { slowItems: slowItems.products },
      recommendedAction: {
        actionType: "create_campaign",
        label: "Tạo Flash Sale giải phóng tồn",
        suggestedPrompt: "Lập chiến dịch Flash Sale giảm 40% cho các sản phẩm bán chậm này",
      },
    });
  }

  // Check 3: Pending orders stuck > 48h
  const stuckOrders = await Order.countDocuments({
    status: "pending",
    createdAt: { $lte: new Date(Date.now() - 48 * 3600 * 1000) },
  });

  if (stuckOrders > 0) {
    insights.push({
      type: "order_backlog",
      severity: "high",
      title: "Đơn hàng chờ xử lý quá 48 giờ",
      explanation: `Hiện có ${stuckOrders} đơn hàng đang ở trạng thái Chờ xử lý quá 48 giờ chưa được xác nhận hoặc gửi đi.`,
      dataMetrics: { stuckOrdersCount: stuckOrders },
      recommendedAction: {
        actionType: "view_pending_orders",
        label: "Xem và xử lý đơn hàng tồn đọng",
        suggestedPrompt: "Liệt kê danh sách các đơn hàng chờ xử lý quá hạn",
      },
    });
  }

  return {
    scannedAt: new Date().toISOString(),
    totalInsights: insights.length,
    insights,
  };
}
