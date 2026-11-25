import mongoose from "mongoose";

const adminAiAuditLogSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    adminEmail: {
      type: String,
      trim: true,
      default: "system",
    },
    adminRole: {
      type: String,
      default: "admin",
    },
    toolName: {
      type: String,
      required: true,
      index: true,
    },
    actionLevel: {
      type: Number,
      enum: [1, 2, 3, 4],
      default: 1,
      index: true,
    },
    inputParams: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    outputSummary: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: [
        "success",
        "failed",
        "pending_confirmation",
        "confirmed",
        "cancelled",
        "blocked_security",
      ],
      default: "success",
      index: true,
    },
    actionId: {
      type: String,
      default: null,
      index: true,
    },
    expiresAt: { type: Date, default: null },
    securityReason: {
      type: String,
      default: null,
    },
    ipAddress: {
      type: String,
      default: "unknown",
    },
    userAgent: {
      type: String,
      default: "unknown",
    },
  },
  {
    timestamps: true,
  }
);

adminAiAuditLogSchema.index({ createdAt: -1 });

const AdminAiAuditLog = mongoose.model(
  "AdminAiAuditLog",
  adminAiAuditLogSchema
);

export default AdminAiAuditLog;
