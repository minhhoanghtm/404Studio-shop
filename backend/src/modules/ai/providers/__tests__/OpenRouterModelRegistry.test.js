import { describe, expect, jest, test } from "@jest/globals";
import { OpenRouterModelRegistry } from "../OpenRouterModelRegistry.js";

describe("OpenRouterModelRegistry", () => {
  test("normalizes capabilities and serves a cached catalog", async () => {
    const fetchImpl = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [{
          id: "google/example",
          name: "Example",
          context_length: 1000,
          architecture: { input_modalities: ["text"], output_modalities: ["text"] },
          supported_parameters: ["tools", "structured_outputs"],
          pricing: { prompt: "0", completion: "0" },
        }],
      }),
    });
    const registry = new OpenRouterModelRegistry({ fetchImpl, ttlMs: 60_000 });
    expect(await registry.find("google")).toEqual([expect.objectContaining({ id: "google/example", supportsTools: true, supportsStructuredOutput: true })]);
    await registry.find("google");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});
