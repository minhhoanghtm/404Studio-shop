import { describe, expect, it } from "@jest/globals";
import CloudflareWorkersAIProvider from "../CloudflareWorkersAIProvider.js";
import PollinationsProvider from "../PollinationsProvider.js";
import ComfyUIProvider from "../ComfyUIProvider.js";
import { PROVIDER_STATUS } from "../BaseAIProvider.js";
import { AIRouter } from "../../services/aiRouter.service.js";

describe("free-first image providers", () => {
  it("does not mark missing local, Cloudflare, or Pollinations configuration as connected", async () => {
    const original = { ...process.env };
    delete process.env.CLOUDFLARE_ACCOUNT_ID;
    delete process.env.CLOUDFLARE_API_TOKEN;
    delete process.env.POLLINATIONS_API_KEY;
    process.env.COMFYUI_ENABLED = "false";
    expect(await new CloudflareWorkersAIProvider().getStatus()).toBe(PROVIDER_STATUS.NOT_CONFIGURED);
    expect(await new PollinationsProvider().getStatus()).toBe(PROVIDER_STATUS.NOT_CONFIGURED);
    expect(await new ComfyUIProvider().getStatus()).toBe(PROVIDER_STATUS.LOCAL_PROVIDER_UNAVAILABLE);
    process.env = original;
  });

  it("blocks paid and unknown-metered providers by default while allowing a local zero-cost provider", () => {
    const router = new AIRouter();
    const policy = router.getImageRoutingPolicy();
    expect(policy.allowPaidFallback).toBe(false);
    expect(policy.monthlyBudgetUsd).toBe(0);
    expect(router.isImageProviderAllowed({ getImageCostProfile: () => ({ kind: "ZERO_COST_LOCAL", estimatedCostUsd: 0 }) }, policy)).toBe(true);
    expect(router.isImageProviderAllowed({ getImageCostProfile: () => ({ kind: "METERED_KNOWN", estimatedCostUsd: 0.02 }) }, policy)).toBe(false);
    expect(router.isImageProviderAllowed({ getImageCostProfile: () => ({ kind: "METERED_UNKNOWN", estimatedCostUsd: null }) }, policy)).toBe(false);
  });

  it("decodes documented image payloads without pretending a provider is free", async () => {
    const originalFetch = global.fetch;
    const originalKey = process.env.POLLINATIONS_API_KEY;
    process.env.POLLINATIONS_API_KEY = "test-key";
    global.fetch = async () => new Response(JSON.stringify({ data: [{ b64_json: "ZmFrZQ==" }] }), { status: 200 });
    const result = await new PollinationsProvider().generateImage({ prompt: "studio fashion", width: 1024, height: 1024 });
    expect(result.images[0].url).toBe("data:image/png;base64,ZmFrZQ==");
    expect(result.costUsd).toBeNull();
    global.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.POLLINATIONS_API_KEY;
    else process.env.POLLINATIONS_API_KEY = originalKey;
  });
});
