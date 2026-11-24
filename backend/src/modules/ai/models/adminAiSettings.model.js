import mongoose from "mongoose";

const adminAiSettingsSchema = new mongoose.Schema(
  {
    defaultProvider: {
      type: String,
      enum: ["auto", "gemini", "openai", "claude", "deepseek"],
      default: "auto",
    },
    imageDefaultProvider: {
      type: String,
      enum: ["auto", "comfyui", "cloudflare", "pollinations", "openai", "gemini", "flux"],
      default: "auto",
    },
    marketingDefaultProvider: {
      type: String,
      enum: ["auto", "claude", "openai", "gemini"],
      default: "auto",
    },
    analyticsDefaultProvider: {
      type: String,
      enum: ["auto", "openai", "deepseek", "gemini"],
      default: "auto",
    },
    fallbackEnabled: {
      type: Boolean,
      default: true,
    },
    requestTimeoutMs: {
      type: Number,
      default: 60000,
      min: 5000,
      max: 180000,
    },
    imageDailyLimit: {
      type: Number,
      default: 20,
      min: 0,
      max: 200,
    },
    imageMaxVariants: {
      type: Number,
      default: 4,
      min: 1,
      max: 8,
    },
    monthlyBudgetUsd: {
      type: Number,
      default: 10,
      min: 1,
    },
    // Encrypted API keys (AES-256-GCM), never stored in plaintext
    encryptedApiKeys: {
      gemini: { encrypted: String, iv: String, tag: String, lastFour: String },
      openai: { encrypted: String, iv: String, tag: String, lastFour: String },
      claude: { encrypted: String, iv: String, tag: String, lastFour: String },
      deepseek: { encrypted: String, iv: String, tag: String, lastFour: String },
      flux: { encrypted: String, iv: String, tag: String, lastFour: String },
    },
    modelOverrides: {
      geminiChat: { type: String, default: "gemini-2.0-flash-001" },
      geminiImage: { type: String, default: "imagen-3.0-generate-002" },
      openaiChat: { type: String, default: "gpt-4o" },
      openaiImage: { type: String, default: "dall-e-3" },
      claudeChat: { type: String, default: "claude-3-5-sonnet-20241022" },
      deepseekChat: { type: String, default: "deepseek-chat" },
      fluxImage: { type: String, default: "black-forest-labs/flux-1-schnell" },
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure singleton instance per deployment
adminAiSettingsSchema.statics.getSettings = async function () {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

const AdminAiSettings = mongoose.model("AdminAiSettings", adminAiSettingsSchema);
export { AdminAiSettings };
export default AdminAiSettings;
