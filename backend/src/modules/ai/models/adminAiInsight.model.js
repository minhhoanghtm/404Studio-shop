import mongoose from "mongoose";

const adminAiInsightSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "revenue_anomaly",
        "low_stock_alert",
        "dead_stock_alert",
        "order_backlog",
        "cancellation_spike",
        "campaign_expiring",
        "voucher_expiring",
        "marketing_opportunity",
      ],
      required: true,
      index: true,
    },
    severity: {
      type: String,
      enum: ["info", "low", "medium", "high", "critical"],
      default: "medium",
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    explanation: {
      type: String,
      required: true,
    },
    dataMetrics: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    recommendedAction: {
      actionType: String,
      label: String,
      suggestedPrompt: String,
      payload: mongoose.Schema.Types.Mixed,
    },
    isDismissed: {
      type: Boolean,
      default: false,
      index: true,
    },
    isResolved: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

adminAiInsightSchema.index({ severity: 1, createdAt: -1 });

const AdminAiInsight = mongoose.model(
  "AdminAiInsight",
  adminAiInsightSchema
);

export default AdminAiInsight;
