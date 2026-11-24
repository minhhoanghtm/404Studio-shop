import providerRegistry from "../providers/ProviderRegistry.js";
import { AI_CAPABILITIES, PROVIDER_STATUS } from "../providers/BaseAIProvider.js";
import AdminAiSettings from "../models/adminAiSettings.model.js";
import usageCostTracker from "./usageCostTracker.service.js";

export class AIRouter {
  getImageRoutingPolicy() {
    const numberFromEnv = (name, fallback) => {
      const value = Number(process.env[name]);
      return Number.isFinite(value) && value >= 0 ? value : fallback;
    };
    return {
      mode: String(process.env.AI_IMAGE_ROUTING_MODE || "FREE_FIRST").toUpperCase(),
      allowPaidFallback: String(process.env.AI_IMAGE_ALLOW_PAID_FALLBACK || "false").toLowerCase() === "true",
      // Metered providers with an included allowance are never assumed free:
      // an administrator must deliberately permit their free-tier use.
      allowMeteredFreeTier: String(process.env.AI_IMAGE_ALLOW_METERED_FREE_TIER || "false").toLowerCase() === "true",
      dailyBudgetUsd: numberFromEnv("AI_IMAGE_DAILY_BUDGET_USD", 0),
      monthlyBudgetUsd: numberFromEnv("AI_IMAGE_MONTHLY_BUDGET_USD", 0),
    };
  }

  isImageProviderAllowed(provider, policy) {
    const profile = provider.getImageCostProfile();
    if (profile.kind === "ZERO_COST_LOCAL") return true;
    if (profile.kind === "METERED_UNKNOWN") return policy.allowMeteredFreeTier;
    return policy.allowPaidFallback && policy.monthlyBudgetUsd > 0;
  }

  async getImageCandidates({ requestedProvider = "auto" } = {}) {
    const policy = this.getImageRoutingPolicy();
    const freePriority = ["comfyui", "cloudflare", "pollinations"];
    const paidPriority = ["openai", "gemini", "flux"];
    const requested = requestedProvider === "premium_paid" ? paidPriority : requestedProvider === "auto" ? freePriority : [requestedProvider];
    const priority = requestedProvider === "auto" && policy.allowPaidFallback ? [...freePriority, ...paidPriority] : requested;
    const candidates = [];
    for (const id of priority) {
      const provider = providerRegistry.getProvider(id);
      if (!provider || !provider.hasCapability(AI_CAPABILITIES.IMAGE_GENERATION) || !this.isImageProviderAllowed(provider, policy)) continue;
      const status = await provider.getStatus();
      if (status === PROVIDER_STATUS.CONNECTED || status === PROVIDER_STATUS.CONFIGURED_UNVERIFIED) candidates.push(provider);
    }
    return { policy, candidates };
  }

  /**
   * Determine task category from message content, mode, and attachments
   */
  detectTaskType(message = "", modeOrAttachments = "auto", hasImagesOrAttachments = false) {
    const mode = typeof modeOrAttachments === "string" ? modeOrAttachments : "auto";
    const attachments = Array.isArray(modeOrAttachments) ? modeOrAttachments : hasImagesOrAttachments;
    const hasImages = Array.isArray(attachments) ? attachments.length > 0 : Boolean(attachments);
    if (hasImages) return "vision";
    if (mode && mode !== "auto") {
      if (mode === "analytics") return "analytics";
      if (mode === "marketing") return "marketing";
      if (mode === "creative" || mode === "image_gen") return "image_generation";
      if (mode === "image_edit") return "image_editing";
    }

    const text = message.toLowerCase();
    if (
      text.includes("sửa layer") ||
      text.includes("sửa chữ") ||
      text.includes("chỉnh sửa") ||
      text.includes("đổi nền") ||
      (text.includes("sửa") && !text.includes("tạo"))
    ) {
      return "image_editing";
    }
    if (text.includes("poster") || text.includes("banner") || text.includes("thiết kế") || text.includes("tạo ảnh")) {
      return "image_generation";
    }
    if (text.includes("doanh thu") || text.includes("so sánh") || text.includes("lợi nhuận") || text.includes("tồn kho") || text.includes("bán chậm")) {
      return "analytics";
    }
    if (text.includes("chiến dịch") || text.includes("kế hoạch") || text.includes("copywriting") || text.includes("quảng cáo") || text.includes("bài viết")) {
      return "marketing";
    }
    return "chat";
  }

  _wrapProvider(provider) {
    if (!provider) return null;
    provider.providerId = provider.id;
    provider.provider = provider;
    provider.model = provider.defaultModel;
    return provider;
  }

  /**
   * Select primary provider based on admin choice, settings, and detected task type
   */
  async resolveProvider({ requestedProvider = "auto", taskType = "chat", requiredCapability = AI_CAPABILITIES.CHAT }) {
    const settings = await AdminAiSettings.getSettings();

    // 1. Explicit provider requested by admin
    if (requestedProvider && requestedProvider !== "auto") {
      const explicit = providerRegistry.getProvider(requestedProvider);
      if (explicit) {
        // If provider has required capability, use it
        if (explicit.hasCapability(requiredCapability)) {
          return this._wrapProvider(explicit);
        }
        // Special case: Claude requested for image generation -> Claude will brief + delegate
        if (explicit.id === "claude" && requiredCapability === AI_CAPABILITIES.IMAGE_GENERATION) {
          return this._wrapProvider(explicit);
        }
      }
    }

    // 2. Task-based Auto Routing
    let targetId = settings.defaultProvider;
    if (taskType === "analytics" && settings.analyticsDefaultProvider !== "auto") {
      targetId = settings.analyticsDefaultProvider;
    } else if (taskType === "marketing" && settings.marketingDefaultProvider !== "auto") {
      targetId = settings.marketingDefaultProvider;
    } else if ((taskType === "image_generation" || taskType === "image_editing") && settings.imageDefaultProvider !== "auto") {
      targetId = settings.imageDefaultProvider;
    }

    if (targetId && targetId !== "auto") {
      const provider = providerRegistry.getProvider(targetId);
      if (provider && provider.hasCapability(requiredCapability)) {
        return this._wrapProvider(provider);
      }
    }

    // 3. Fallback priority list for the required capability
    // OpenAI is the currently verified provider. Auto mode must not spend a
    // request on gateway models known to be unavailable or out of credit.
    const priority =
      requiredCapability === AI_CAPABILITIES.IMAGE_GENERATION
        ? ["openai", "gemini", "flux"]
        : ["openai", "gemini", "claude", "deepseek"];

    for (const pid of priority) {
      const p = providerRegistry.getProvider(pid);
      if (p && p.hasCapability(requiredCapability)) {
        const status = await p.getStatus();
        if (status === PROVIDER_STATUS.CONNECTED || status === PROVIDER_STATUS.CONFIGURED_UNVERIFIED) {
          return this._wrapProvider(p);
        }
      }
    }

    // Default to OpenAI or Gemini
    const fallback = providerRegistry.getProvider("openai") || providerRegistry.getProvider("gemini");
    return this._wrapProvider(fallback);
  }

  /**
   * Execute chat completion with automatic fallback on failure
   */
  async executeChatWithFallback({ messages, tools = [], requestedProvider = "auto", mode = "auto", authContext = {} }) {
    const taskType = this.detectTaskType(messages[messages.length - 1]?.content || "", mode);
    let primary = await this.resolveProvider({ requestedProvider, taskType, requiredCapability: AI_CAPABILITIES.CHAT });

    const settings = await AdminAiSettings.getSettings();
    const startTime = Date.now();

    try {
      const result = await primary.chat({ messages, tools });
      const latencyMs = Date.now() - startTime;

      await usageCostTracker.recordUsage({
        adminId: authContext.userId,
        provider: primary.id,
        model: result.model,
        taskType,
        inputTokens: result.usage?.inputTokens || 0,
        outputTokens: result.usage?.outputTokens || 0,
        latencyMs,
        status: "success",
      });

      return {
        ...result,
        primaryProvider: primary.id,
        fallbackUsed: false,
        latencyMs,
      };
    } catch (err) {
      console.warn(`[AIRouter] Provider ${primary.id} thất bại (${err.message}). Đang kiểm tra fallback...`);

      if (!settings.fallbackEnabled) {
        throw err;
      }

      // Find alternative provider
      const fallbackCandidates = ["gemini", "openai", "claude", "deepseek"].filter((id) => id !== primary.id);
      for (const altId of fallbackCandidates) {
        const altProvider = providerRegistry.getProvider(altId);
        if (altProvider && (await altProvider.getStatus()) !== PROVIDER_STATUS.NOT_CONFIGURED) {
          try {
            console.log(`[AIRouter] Đang fallback sang provider: ${altProvider.id}...`);
            const fallbackResult = await altProvider.chat({ messages, tools });
            const latencyMs = Date.now() - startTime;

            await usageCostTracker.recordUsage({
              adminId: authContext.userId,
              provider: altProvider.id,
              model: fallbackResult.model,
              taskType,
              inputTokens: fallbackResult.usage?.inputTokens || 0,
              outputTokens: fallbackResult.usage?.outputTokens || 0,
              latencyMs,
              status: "fallback",
              errorReason: err.message,
            });

            return {
              ...fallbackResult,
              primaryProvider: primary.id,
              actualProvider: altProvider.id,
              fallbackUsed: true,
              fallbackReason: err.message,
              latencyMs,
            };
          } catch (altErr) {
            console.warn(`[AIRouter] Fallback provider ${altId} cũng thất bại: ${altErr.message}`);
          }
        }
      }

      throw err;
    }
  }

  /**
   * Execute Image Generation with Quota and Budget Enforcement
   */
  async executeImageGenerationWithFallback({ prompt, width = 1024, height = 1024, n = 1, requestedProvider = "auto", authContext = {} }) {
    const { policy, candidates } = await this.getImageCandidates({ requestedProvider });
    if (!candidates.length) {
      const error = new Error("NO_ELIGIBLE_FREE_IMAGE_PROVIDER: No configured zero-cost provider is available. Paid and unverified-metered providers remain blocked by policy.");
      error.code = "NO_ELIGIBLE_FREE_IMAGE_PROVIDER";
      throw error;
    }

    const settings = await AdminAiSettings.getSettings();
    const startTime = Date.now();
    let lastError = null;
    for (let index = 0; index < candidates.length; index += 1) {
      const provider = candidates[index];
      const profile = provider.getImageCostProfile();
      const estimatedCost = profile.estimatedCostUsd === null ? 0 : profile.estimatedCostUsd * n;
      try {
        await usageCostTracker.checkBudgetAndQuotaLimits({
          isImage: true,
          estimatedCost,
          budgetLimitUsd: policy.monthlyBudgetUsd,
          dailyBudgetUsd: policy.dailyBudgetUsd,
        });
        const result = await provider.generateImage({ prompt, width, height, n });
        const latencyMs = Date.now() - startTime;
        const costStatus = result.costUsd === null ? "UNKNOWN" : result.costUsd === 0 ? "ZERO" : "KNOWN";
        await usageCostTracker.recordUsage({
          adminId: authContext.userId,
          provider: provider.id,
          model: result.model,
          taskType: "image_generation",
          imageCount: result.images?.length || 1,
          costUsd: result.costUsd,
          costStatus,
          latencyMs,
          status: index ? "fallback" : "success",
          errorReason: index ? lastError?.message || null : null,
        });
        return { ...result, primaryProvider: candidates[0].id, actualProvider: provider.id, fallbackUsed: index > 0, latencyMs, routingMode: policy.mode };
      } catch (error) {
        lastError = error;
        console.warn(`[AIRouter] Free-first image provider ${provider.id} failed: ${error.message}`);
        if (!settings.fallbackEnabled) break;
      }
    }
    throw lastError || new Error("NO_IMAGE_PROVIDER_AVAILABLE");
  }
}

const aiRouter = new AIRouter();
export default aiRouter;
