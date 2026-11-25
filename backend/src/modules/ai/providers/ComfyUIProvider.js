import fs from "fs/promises";
import BaseAIProvider, { AI_CAPABILITIES, PROVIDER_STATUS, classifyProviderFailure } from "./BaseAIProvider.js";
import { parseHttpUrl } from "../../../configs/network.config.js";

const normalizeBaseUrl = (value) => parseHttpUrl(value, "COMFYUI_BASE_URL", { required: false });

/** Local-only ComfyUI adapter. It requires an admin-provided workflow and never downloads a model. */
export class ComfyUIProvider extends BaseAIProvider {
  constructor() {
    super({
      id: "comfyui",
      name: "Local ComfyUI",
      defaultModel: "local-workflow",
      capabilities: [AI_CAPABILITIES.IMAGE_GENERATION],
    });
  }

  get enabled() { return String(process.env.COMFYUI_ENABLED).toLowerCase() === "true"; }
  get baseUrl() { return normalizeBaseUrl(process.env.COMFYUI_BASE_URL); }
  get workflowPath() { return process.env.COMFYUI_WORKFLOW_PATH || ""; }

  getImageCostProfile() { return { kind: "ZERO_COST_LOCAL", estimatedCostUsd: 0 }; }

  async getStatus() {
    if (!this.enabled || !this.workflowPath || !this.baseUrl) return PROVIDER_STATUS.LOCAL_PROVIDER_UNAVAILABLE;
    try {
      await fs.access(this.workflowPath);
      return PROVIDER_STATUS.CONFIGURED_UNVERIFIED;
    } catch {
      return PROVIDER_STATUS.LOCAL_PROVIDER_UNAVAILABLE;
    }
  }

  async testConnection() {
    if ((await this.getStatus()) === PROVIDER_STATUS.LOCAL_PROVIDER_UNAVAILABLE) {
      return { success: false, status: PROVIDER_STATUS.LOCAL_PROVIDER_UNAVAILABLE, message: "Bật COMFYUI_ENABLED và đặt COMFYUI_WORKFLOW_PATH tới workflow ComfyUI hợp lệ." };
    }
    try {
      const response = await fetch(`${this.baseUrl}/system_stats`, { signal: AbortSignal.timeout(5_000) });
      if (!response.ok) throw new Error(`ComfyUI HTTP ${response.status}`);
      return { success: true, status: PROVIDER_STATUS.CONNECTED, message: "ComfyUI local đang phản hồi." };
    } catch (error) {
      return { success: false, status: PROVIDER_STATUS.LOCAL_PROVIDER_UNAVAILABLE, message: classifyProviderFailure(error).message };
    }
  }

  async generateImage({ prompt }) {
    if ((await this.getStatus()) === PROVIDER_STATUS.LOCAL_PROVIDER_UNAVAILABLE) throw new Error("LOCAL_PROVIDER_UNAVAILABLE");
    const workflow = JSON.parse(await fs.readFile(this.workflowPath, "utf8"));
    let promptApplied = false;
    for (const node of Object.values(workflow)) {
      if (node?.class_type === "CLIPTextEncode" && typeof node.inputs?.text === "string" && !promptApplied) {
        node.inputs.text = prompt;
        promptApplied = true;
      }
    }
    if (!promptApplied) throw new Error("COMFYUI_WORKFLOW_HAS_NO_PROMPT_NODE");
    try {
      const queued = await fetch(`${this.baseUrl}/prompt`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: workflow }), signal: AbortSignal.timeout(15_000) });
      if (!queued.ok) throw new Error(`ComfyUI HTTP ${queued.status}`);
      const { prompt_id: promptId } = await queued.json();
      if (!promptId) throw new Error("ComfyUI returned no prompt id");
      const image = await this.waitForImage(promptId);
      return { provider: this.id, model: this.defaultModel, images: [image], costUsd: 0, costStatus: "LOCAL" };
    } catch (error) {
      const normalized = classifyProviderFailure(error);
      throw new Error(`COMFYUI_${normalized.status}: ${normalized.message}`);
    }
  }

  async waitForImage(promptId) {
    const deadline = Date.now() + 120_000;
    while (Date.now() < deadline) {
      const response = await fetch(`${this.baseUrl}/history/${encodeURIComponent(promptId)}`, { signal: AbortSignal.timeout(10_000) });
      if (response.ok) {
        const history = await response.json();
        const outputs = Object.values(history?.[promptId]?.outputs || {});
        const image = outputs.flatMap((output) => output?.images || [])[0];
        if (image?.filename) {
          const query = new URLSearchParams({ filename: image.filename, subfolder: image.subfolder || "", type: image.type || "output" });
          return { url: `${this.baseUrl}/view?${query.toString()}`, revisedPrompt: null };
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 1_000));
    }
    throw new Error("COMFYUI_TIMEOUT");
  }
}

export default ComfyUIProvider;
