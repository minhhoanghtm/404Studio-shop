import mongoose from "mongoose";

const designLayerSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    type: {
      type: String,
      enum: ["text", "image", "background", "shape", "icon", "logo", "badge", "button", "group", "product", "gradient", "qr"],
      required: true,
    },
    name: { type: String, default: "Lớp thiết kế" },
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    width: { type: Number, default: 200 },
    height: { type: Number, default: 100 },
    rotation: { type: Number, default: 0 },
    opacity: { type: Number, default: 1, min: 0, max: 1 },
    zIndex: { type: Number, default: 1 },
    visible: { type: Boolean, default: true },
    locked: { type: Boolean, default: false },
    content: { type: String, default: "" }, // text content or image URL
    styles: {
      fontFamily: { type: String, default: "Playfair Display" },
      fontSize: { type: Number, default: 24 },
      fontWeight: { type: String, default: "normal" },
      fontStyle: { type: String, default: "normal" },
      color: { type: String, default: "#FFFFFF" },
      backgroundColor: { type: String, default: "transparent" },
      borderColor: { type: String, default: "transparent" },
      borderWidth: { type: Number, default: 0 },
      borderRadius: { type: Number, default: 0 },
      textAlign: { type: String, default: "center" },
      letterSpacing: { type: Number, default: 1 },
      lineHeight: { type: Number, default: 1.2 },
      textTransform: { type: String, default: "uppercase" },
      padding: { type: Number, default: 8 },
      shadowColor: { type: String, default: "rgba(0,0,0,0.5)" },
      shadowBlur: { type: Number, default: 0 },
      shadowOffsetX: { type: Number, default: 0 },
      shadowOffsetY: { type: Number, default: 0 },
      objectFit: { type: String, default: "contain" },
      cropX: { type: Number, default: 50, min: 0, max: 100 },
      cropY: { type: Number, default: 50, min: 0, max: 100 },
      cropZoom: { type: Number, default: 1, min: 1, max: 3 },
      flipX: { type: Boolean, default: false },
      flipY: { type: Boolean, default: false },
      brightness: { type: Number, default: 100 },
      contrast: { type: Number, default: 100 },
      saturation: { type: Number, default: 100 },
    },
  },
  { _id: false }
);

const adminDesignProjectSchema = new mongoose.Schema(
  {
    schemaVersion: { type: Number, default: 2 },
    editability: { type: String, enum: ["FULLY_EDITABLE", "PARTIALLY_EDITABLE", "FLATTENED_IMAGE", "RECONSTRUCTED_DESIGN"], default: "FULLY_EDITABLE" },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      default: "Dự Án Thiết Kế Mới",
    },
    preset: {
      type: String,
      enum: [
        "instagram_post",
        "instagram_portrait",
        "facebook_post",
        "story_reel",
        "website_hero",
        "website_promotion",
        "mobile_banner",
        "poster_a4",
        "custom",
      ],
      default: "instagram_portrait",
      index: true,
    },
    width: { type: Number, default: 1080 },
    height: { type: Number, default: 1350 },
    background: {
      type: {
        type: String,
        enum: ["color", "gradient", "image", "texture"],
        default: "color",
      },
      value: { type: String, default: "#1A1A1A" },
      secondaryValue: { type: String, default: "#0A0A0A" },
      textureName: { type: String, default: "brick" }, // brick, silk, studio, paper
    },
    layers: [designLayerSchema],
    thumbnailUrl: { type: String, default: "" },
    status: {
      type: String,
      enum: ["draft", "ready", "published", "archived"],
      default: "draft",
      index: true,
    },
    linkedCampaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      default: null,
    },
    linkedBannerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Banner",
      default: null,
    },
    tags: [String],
    promptHistory: [
      {
        prompt: String,
        timestamp: { type: Date, default: Date.now },
        appliedChanges: mongoose.Schema.Types.Mixed,
      },
    ],
    versionHistory: [{
      version: Number,
      savedAt: { type: Date, default: Date.now },
      name: String,
      canvas: mongoose.Schema.Types.Mixed,
      layers: mongoose.Schema.Types.Mixed,
      background: mongoose.Schema.Types.Mixed,
    }],
    metadata: mongoose.Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

adminDesignProjectSchema.index({ adminId: 1, updatedAt: -1 });

const AdminDesignProject = mongoose.model(
  "AdminDesignProject",
  adminDesignProjectSchema
);

export default AdminDesignProject;
