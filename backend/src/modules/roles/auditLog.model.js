import mongoose from "mongoose";

const rbacAuditLogSchema = new mongoose.Schema(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    actorEmail: {
      type: String,
      trim: true,
      required: true,
    },
    actorRole: {
      type: String,
      trim: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
    },
    targetId: {
      type: String,
      index: true,
    },
    targetType: {
      type: String,
      enum: ["role", "user", "permission", "system"],
      default: "user",
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    ipAddress: {
      type: String,
      trim: true,
      default: "unknown",
    },
    userAgent: {
      type: String,
      trim: true,
      default: "unknown",
    },
  },
  {
    timestamps: true,
  }
);

// Auto-expire audit logs after 365 days
rbacAuditLogSchema.index({ createdAt: -1 });
rbacAuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 });

const RbacAuditLog = mongoose.models.RbacAuditLog || mongoose.model("RbacAuditLog", rbacAuditLogSchema);
export default RbacAuditLog;
