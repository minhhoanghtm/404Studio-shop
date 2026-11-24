import AdminAiUsageLog from "../models/adminAiUsageLog.model.js";
import AdminAiSettings from "../models/adminAiSettings.model.js";

// Unit pricing reference per 1,000,000 tokens (USD)
const PRICING_TABLE = {
  "gpt-4o": { input: 2.5, output: 10.0 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
  "gemini-2.0-flash-001": { input: 0.1, output: 0.4 },
  "google/gemini-3.8-flash": { input: 0.825, output: 4.125 },
  "anthropic/claude-haiku-5.5": { input: 0.1, output: 0.5 },
  "deepseek/deepseek-v4.1-flash": { input: 0.14, output: 0.42 },
  "claude-3-5-sonnet-20241022": { input: 3.0, output: 15.0 },
  "anthropic/claude-3.5-sonnet": { input: 3.0, output: 15.0 },
  "deepseek-chat": { input: 0.14, output: 0.28 },
  "deepseek/deepseek-chat": { input: 0.14, output: 0.28 },
};

export class UsageCostTracker {
  /**
   * Calculate estimated USD cost for text token consumption
   */
  calculateTokenCost(model, inputTokens = 0, outputTokens = 0) {
    const rate = PRICING_TABLE[model] || { input: 0.2, output: 0.8 };
    const cost = (inputTokens / 1_000_000) * rate.input + (outputTokens / 1_000_000) * rate.output;
    return parseFloat(cost.toFixed(6));
  }

  estimateCost({ provider, model, promptTokens = 0, completionTokens = 0, imageCount = 0 } = {}) {
    if (imageCount > 0) {
      return parseFloat((imageCount * 0.02).toFixed(4));
    }
    return this.calculateTokenCost(model, promptTokens, completionTokens);
  }

  async checkLimit({ adminId, type = "chat", estimatedCostUsd = 0.02 } = {}) {
    const isImage = type === "image" || type === "image_generation";
    const settings = await AdminAiSettings.getSettings();
    try {
      const res = await this.checkBudgetAndQuotaLimits({ isImage, estimatedCost: estimatedCostUsd });
      return {
        allowed: true,
        dailyLimit: settings.imageDailyLimit,
        monthlyBudget: settings.monthlyBudgetUsd,
        ...res,
      };
    } catch (err) {
      return {
        allowed: false,
        error: err.message,
        code: err.code,
        dailyLimit: settings.imageDailyLimit,
        monthlyBudget: settings.monthlyBudgetUsd,
      };
    }
  }

  /**
   * Check if current operation would exceed daily image quota or monthly budget
   */
  async checkBudgetAndQuotaLimits({ isImage = false, estimatedCost = 0.05, budgetLimitUsd = null, dailyBudgetUsd = null } = {}) {
    const settings = await AdminAiSettings.getSettings();
    const currentSpend = await AdminAiUsageLog.getCurrentMonthSpend();
    const effectiveBudget = budgetLimitUsd === null ? settings.monthlyBudgetUsd : budgetLimitUsd;

    // A zero-cost local workflow remains allowed even when historical paid
    // spend exists. A zero-dollar budget blocks only positive-cost work.
    if (estimatedCost > 0 && currentSpend.totalCostUsd + estimatedCost > effectiveBudget) {
      const err = new Error(
        `Ngân sách AI tháng này đã đạt giới hạn ($${currentSpend.totalCostUsd.toFixed(2)} / $${effectiveBudget}). Vui lòng nâng mức ngân sách trong Cài Đặt AI.`
      );
      err.code = "BUDGET_EXCEEDED";
      throw err;
    }

    // Check daily image limit
    if (isImage) {
      const todayImages = await AdminAiUsageLog.getTodayImageCount();
      if (todayImages >= settings.imageDailyLimit) {
        const err = new Error(
          `Đã đạt giới hạn tạo ảnh hàng ngày (${todayImages}/${settings.imageDailyLimit} ảnh). Quý quản trị viên có thể điều chỉnh hạn mức trong trang Cài Đặt AI.`
        );
        err.code = "DAILY_IMAGE_QUOTA_EXCEEDED";
        throw err;
      }
      if (estimatedCost > 0 && dailyBudgetUsd !== null) {
        const currentDaySpend = await AdminAiUsageLog.getTodaySpend();
        if (currentDaySpend + estimatedCost > dailyBudgetUsd) {
          const err = new Error(`Ngân sách tạo ảnh hôm nay đã đạt giới hạn ($${currentDaySpend.toFixed(2)} / $${dailyBudgetUsd}).`);
          err.code = "DAILY_IMAGE_BUDGET_EXCEEDED";
          throw err;
        }
      }
    }

    return {
      allowed: true,
      currentSpendUsd: currentSpend.totalCostUsd,
      budgetLimitUsd: effectiveBudget,
      isNearBudget: effectiveBudget > 0 && currentSpend.totalCostUsd >= effectiveBudget * 0.8,
    };
  }

  /**
   * Log consumption into database
   */
  async recordUsage({
    adminId,
    provider,
    model,
    taskType = "chat",
    inputTokens = 0,
    outputTokens = 0,
    imageCount = 0,
    costUsd = 0,
    costStatus = "KNOWN",
    latencyMs = 0,
    status = "success",
    errorReason = null,
  }) {
    try {
      const totalCost = costUsd === null ? 0 : (costUsd || this.calculateTokenCost(model, inputTokens, outputTokens));
      const log = new AdminAiUsageLog({
        adminId,
        provider,
        model,
        taskType,
        inputTokens,
        outputTokens,
        imageCount,
        costUsd: totalCost,
        costStatus,
        latencyMs,
        status,
        errorReason,
      });
      await log.save();
      return log;
    } catch (err) {
      console.warn("[UsageCostTracker] Không thể lưu log tiêu thụ:", err.message);
      return null;
    }
  }

  /**
   * Get consolidated usage report
   */
  async getUsageSummary() {
    const settings = await AdminAiSettings.getSettings();
    const monthStats = await AdminAiUsageLog.getCurrentMonthSpend();
    const todayImages = await AdminAiUsageLog.getTodayImageCount();

    // Group spend by provider
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const providerBreakdown = await AdminAiUsageLog.aggregate([
      { $match: { createdAt: { $gte: startOfMonth } } },
      {
        $group: {
          _id: "$provider",
          cost: { $sum: "$costUsd" },
          requests: { $sum: 1 },
          images: { $sum: "$imageCount" },
        },
      },
    ]);

    return {
      monthSpendUsd: parseFloat(monthStats.totalCostUsd.toFixed(4)),
      monthlyBudgetUsd: settings.monthlyBudgetUsd,
      budgetPercent: Math.min(100, Math.round((monthStats.totalCostUsd / (settings.monthlyBudgetUsd || 1)) * 100)),
      totalRequests: monthStats.totalRequests,
      totalTokens: monthStats.totalInputTokens + monthStats.totalOutputTokens,
      todayImages,
      dailyImageLimit: settings.imageDailyLimit,
      providerBreakdown: providerBreakdown.map((p) => ({
        provider: p._id,
        costUsd: parseFloat(p.cost.toFixed(4)),
        requests: p.requests,
        images: p.images,
      })),
    };
  }
}

const usageCostTracker = new UsageCostTracker();
export default usageCostTracker;
