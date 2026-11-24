# Free-first AI Image Provider Integration Report — 24 November 2026

## Result

`PARTIAL_PASS — implementation and regression checks pass; no real free image has been generated in Admin AI Copilot yet.`

The project cannot claim SUCCESS under the requested completion rule because Cloudflare and Pollinations credentials are absent and no valid local ComfyUI workflow is configured. No paid image request, credit purchase, account creation, or key rotation was performed.

## Implemented routing

`Local ComfyUI → Cloudflare Workers AI → Pollinations → paid provider only when explicitly permitted`

- `AI_IMAGE_ROUTING_MODE=FREE_FIRST` is the default policy.
- `AI_IMAGE_ALLOW_PAID_FALLBACK=false` and zero daily/monthly image budgets block OpenAI/Gemini/FLUX paid routes.
- A meter-priced provider is not assumed free merely because an account may have an included allocation. `AI_IMAGE_ALLOW_METERED_FREE_TIER=true` is an explicit opt-in, and its unknown cost is logged as `UNKNOWN`, never as `$0`.
- No configured eligible provider yields a clear `NO_ELIGIBLE_FREE_IMAGE_PROVIDER` error; Creative Studio returns an editable `AI_ASSISTED_LAYOUT`, not a fake raster asset.
- Legacy `FluxProvider` no longer calls OpenAI and labels its output as FLUX.

## Provider evidence

| Provider | Adapter | Model / endpoint verified from current docs | Runtime status | Cost / quota handling | Commercial readiness |
|---|---|---|---|---|---|
| Cloudflare Workers AI | Implemented | `@cf/black-forest-labs/flux-1-schnell`; `POST /accounts/{account}/ai/run/{model}` | `NOT_CONFIGURED` | Cloudflare publishes Neuron/tile and step pricing, but account balance/allocation is not exposed here; treated `METERED_UNKNOWN` | Verify account plan and model license before use |
| Pollinations | Implemented | `POST https://gen.pollinations.ai/v1/images/generations`; live model IDs are discoverable | `NOT_CONFIGURED` | Key is required; dynamic catalog/pricing and account balance are not assumed free | `COMMERCIAL_TERMS_UNVERIFIED` — obtain confirmation before production advertising |
| Local ComfyUI | Implemented | Local `/system_stats`, `/prompt`, `/history`, `/view`; admin workflow path required | `LOCAL_PROVIDER_UNAVAILABLE` | `ZERO_COST_LOCAL`; no model or dependency is downloaded | License depends on the administrator's chosen model/workflow |
| OpenAI | Preserved but policy-gated | Existing GPT Image adapter | Not selected in free-first zero-budget mode | `METERED_KNOWN`, blocked unless paid fallback and positive budget are explicitly enabled | Existing provider, no key changed |

Cloudflare’s official model documentation confirms FLUX.1 Schnell accepts a prompt and up to eight steps and returns base64 image data; its pricing is metered, not a promise of unlimited free images. [Cloudflare model docs](https://developers.cloudflare.com/workers-ai/models/flux-1-schnell/) and [pricing](https://developers.cloudflare.com/workers-ai/platform/pricing/) support this implementation. Pollinations’ current official documentation specifies the API key, OpenAI-compatible image endpoint, and public live catalog; the retired `image.pollinations.ai` endpoint is not used. [Pollinations API docs](https://gen.pollinations.ai/docs)

## Creative and product safeguards

- The live planner now accepts a model-authored `creativeBrief.visualDirection`; image prompts include that direction, campaign title/subtitle, and requested style rather than one static prompt.
- When a real product is selected, the provider receives a background-only instruction and the original product image remains a separate editable layer. It does not claim to preserve a product by regenerating it.
- Campaign text, prices, vouchers, CTA, and Vietnamese copy remain editable canvas layers; image providers are asked for no embedded text.

## Local resource assessment

`nvidia-smi` reports GeForce GTX 1650 with 4096 MiB VRAM; D: has 22.5 GB free. No ComfyUI server or workflow was supplied. The application therefore did not download FLUX/SDXL weights or CUDA dependencies, and leaves Local AI unavailable. This hardware/storage profile should be checked against the selected model’s exact requirements before local installation.

## Verification performed

- Backend syntax and focused ESLint: PASS.
- Jest regression suites: 3 suites / 5 tests PASS.
- Frontend TypeScript/Vite production build: PASS.
- Provider status probe: Cloudflare `NOT_CONFIGURED`, Pollinations `NOT_CONFIGURED`, ComfyUI `LOCAL_PROVIDER_UNAVAILABLE`.
- Admin browser E2E, Asset Library save/export, and image quality benchmark: BLOCKED because there is no configured free provider plus no approved authenticated admin test session.

## Files changed

- `backend/src/modules/ai/providers/{CloudflareWorkersAIProvider,PollinationsProvider,ComfyUIProvider}.js`
- `backend/src/modules/ai/providers/{BaseAIProvider,ProviderRegistry,FluxProvider,OpenAIProvider}.js`
- `backend/src/modules/ai/services/{aiRouter,usageCostTracker,adminImageGeneration,adminAiAgent}.js`
- `backend/src/modules/ai/models/{adminAiSettings,adminAiUsageLog}.model.js`
- `backend/.env.example`
- `frontend/src/pages/Admin/AdminAiWorkspacePage.tsx`
- `backend/src/modules/ai/providers/__tests__/freeFirstImageProviders.test.js`

## Required next action

Choose one safe path, then provide an isolated admin test session:

1. Configure local ComfyUI plus a licensed workflow/model (recommended for no API billing); or
2. Add Cloudflare account ID/token or Pollinations API key, verify account quota/terms, and explicitly opt into their metered free tier if acceptable.

Only then can a real prompt-to-image, editable-poster, Asset Library, PNG/JPG/WebP export, and browser/video test be run.
