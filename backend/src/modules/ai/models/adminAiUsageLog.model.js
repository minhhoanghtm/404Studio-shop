import mongoose from "mongoose";

const adminAiUsageLogSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
      index: true,
    },
    provider: {
      type: String,
      required: true,
      index: true,
    },
    model: {
      type: String,
      required: true,
    },
    taskType: {
      type: String,
      enum: ["chat", "analytics", "marketing", "image_generation", "image_editing", "vision", "tool_calling", "embedding"],
      default: "chat",
      index: true,
    },
    inputTokens: {
      type: Number,
      default: 0,
    },
    outputTokens: {
      type: Number,
      default: 0,
    },
    imageCount: {
      type: Number,
      default: 0,
    },
    costUsd: {
      type: Number,
      default: 0,
    },
    costStatus: {
      type: String,
      enum: ["KNOWN", "ZERO", "UNKNOWN"],
      default: "KNOWN",
    },
    latencyMs: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["success", "failed", "fallback"],
      default: "success",
      index: true,
    },
    errorReason: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

adminAiUsageLogSchema.index({ createdAt: -1 });

// Helper to calculate total spend in the current calendar month
adminAiUsageLogSchema.statics.getCurrentMonthSpend = async function () {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const stats = await this.aggregate([
    { $match: { createdAt: { $gte: startOfMonth }, status: { $ne: "failed" } } },
    {
      $group: {
        _id: null,
        totalCostUsd: { $sum: "$costUsd" },
        totalInputTokens: { $sum: "$inputTokens" },
        totalOutputTokens: { $sum: "$outputTokens" },
        totalImages: { $sum: "$imageCount" },
        totalRequests: { $sum: 1 },
      },
    },
  ]);

  return (
    stats[0] || {
      totalCostUsd: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalImages: 0,
      totalRequests: 0,
    }
  );
};

// Helper to calculate today's image count
adminAiUsageLogSchema.statics.getTodayImageCount = async function () {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const stats = await this.aggregate([
    {
      $match: {
        createdAt: { $gte: startOfDay },
        taskType: { $in: ["image_generation", "image_editing"] },
        status: { $ne: "failed" },
      },
    },
    {
      $group: {
        _id: null,
        count: { $sum: "$imageCount" },
      },
    },
  ]);

  return stats[0]?.count || 0;
};

adminAiUsageLogSchema.statics.getTodaySpend = async function () {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const stats = await this.aggregate([
    { $match: { createdAt: { $gte: startOfDay }, taskType: { $in: ["image_generation", "image_editing"] }, status: { $ne: "failed" } } },
    { $group: { _id: null, totalCostUsd: { $sum: "$costUsd" } } },
  ]);
  return stats[0]?.totalCostUsd || 0;
};

const AdminAiUsageLog = mongoose.model("AdminAiUsageLog", adminAiUsageLogSchema);
export { AdminAiUsageLog };
export default AdminAiUsageLog;
