import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["user", "assistant", "system"],
      required: true,
    },
    content: {
      type: String,
      default: "",
    },
    toolCalls: [
      {
        id: String,
        name: String,
        args: mongoose.Schema.Types.Mixed,
        result: mongoose.Schema.Types.Mixed,
        status: {
          type: String,
          enum: ["success", "failed", "pending_confirmation", "blocked"],
          default: "success",
        },
      },
    ],
    cardType: {
      type: String,
      enum: [
        "none",
        "kpi_metrics",
        "chart_line",
        "chart_bar",
        "chart_area",
        "chart_donut",
        "chart_funnel",
        "data_table",
        "product_list",
        "order_list",
        "poster_preview",
        "banner_preview",
        "campaign_plan",
        "confirmation_required",
        "action_result",
        "report_summary",
        "insights_list",
      ],
      default: "none",
    },
    cardData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    actionProposal: {
      type: new mongoose.Schema(
        {
          actionId: String,
          actionType: String,
          actionLevel: { type: Number, default: 3 },
          title: String,
          summary: String,
          payload: mongoose.Schema.Types.Mixed,
          confirmationToken: String,
          expiresAt: Date,
          status: {
            type: String,
            enum: ["pending", "confirmed", "cancelled", "expired"],
            default: "pending",
          },
        },
        { _id: false }
      ),
      default: null,
    },
  },
  { timestamps: true }
);

const adminAiConversationSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      default: "Phiên làm việc mới",
      trim: true,
    },
    mode: {
      type: String,
      enum: [
        "auto",
        "analytics",
        "marketing",
        "creative",
        "inventory",
        "product",
        "orders",
        "reports",
      ],
      default: "auto",
      index: true,
    },
    context: {
      route: { type: String, default: "/admin" },
      selectedEntityId: { type: String, default: null },
      entityType: { type: String, default: null },
      filters: { type: mongoose.Schema.Types.Mixed, default: {} },
    },
    messages: [messageSchema],
    isPinned: {
      type: Boolean,
      default: false,
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

adminAiConversationSchema.index({ adminId: 1, updatedAt: -1 });

const AdminAiConversation = mongoose.model(
  "AdminAiConversation",
  adminAiConversationSchema
);

export default AdminAiConversation;
