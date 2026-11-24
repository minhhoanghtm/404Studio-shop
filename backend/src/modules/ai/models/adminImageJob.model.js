import mongoose from "mongoose";

const adminImageJobSchema = new mongoose.Schema(
  {
    jobId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
    prompt: {
      type: String,
      required: true,
    },
    provider: {
      type: String,
      required: true,
    },
    model: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["QUEUED", "PROCESSING", "COMPLETED", "FAILED", "CANCELLED"],
      default: "QUEUED",
      index: true,
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    resultImageUrl: {
      type: String,
      default: null,
    },
    variants: [
      {
        url: String,
        width: Number,
        height: Number,
      },
    ],
    designId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminDesignProject",
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
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

const AdminImageJob = mongoose.model("AdminImageJob", adminImageJobSchema);
export default AdminImageJob;
