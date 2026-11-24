# Admin AI Provider Audit — 24 November 2026

## Verified configuration and health

| Provider | Configuration source | Chat check | Image check | Conclusion |
|---|---|---|---|---|
| OpenAI | Runtime credential present | `CONNECTED`; live model check succeeded in 759 ms | One live `gpt-image-1-mini` generation returned a newly created asset | Available for chat and image generation |
| Gemini | OpenRouter gateway credential present; no direct Gemini key | `MODEL_NOT_FOUND` | Not tested | Configured gateway model `google/gemini-2.0-flash-001` is retired on OpenRouter |
| Claude | OpenRouter gateway credential present; no direct Anthropic key | `MODEL_NOT_FOUND` | Not applicable for native raster image generation | Configured gateway model `anthropic/claude-3-5-sonnet-20241022` is retired on OpenRouter |
| DeepSeek | OpenRouter gateway credential present; no direct DeepSeek key | `BILLING_REQUIRED` | Not applicable for native raster image generation | Gateway account reported insufficient credits |
| FLUX | No `FLUX_API_KEY` loaded | `NOT_CONFIGURED` | `NOT_CONFIGURED` | No verified direct adapter/key |

No secret values, provider response bodies, or account identifiers are included in this report. Quota remaining is `QUOTA_REMAINING_UNKNOWN`; the providers did not return a safe numeric balance.

## Evidence

- Backend health endpoint: HTTP 200.
- OpenAI live chat used `gpt-4o` (19 input tokens, 10 output tokens) and a real `gpt-image-1-mini` call returned one asset.
- Provider probes were deliberately bounded to one connection check per configured route; the image check used one asset only.

## Required user action

1. Update the Gemini and Claude OpenRouter model IDs to currently available models before enabling those routes.
2. Add OpenRouter credits or a direct `DEEPSEEK_API_KEY` before enabling DeepSeek.
3. Add a supported FLUX endpoint/key and adapter only if FLUX image generation is required.
