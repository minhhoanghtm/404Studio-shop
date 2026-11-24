# Admin AI Intelligence Fix Report — 24 November 2026

## Root cause

`backend/src/modules/ai/services/adminAiAgent.service.js` routed requests with keyword checks. A message containing `sale` produced a hardcoded `BLACK FRIDAY SALE` poster and fixed discount content; a message with no matching keyword ran `scan_proactive_insights`, producing irrelevant inventory/order output. `adminImageGeneration.service.js` then substituted a coloured/static-style canvas when image generation failed while implying an AI-generated poster.

## Implemented fix

- Admin chat now obtains a **live LLM semantic plan** (structured JSON), then executes only allow-listed read-only business tools selected by that plan.
- Conversation history is supplied to both planning and final response generation and remains scoped to the authenticated `adminId`.
- Marketing/general chat receives a live LLM response instead of an inventory-insight fallback.
- Poster requests receive an LLM-created creative brief; the pipeline no longer contains Black Friday/default discount/date/product fallback content.
- A failed/unconfigured image provider returns `AI_ASSISTED_LAYOUT`, with `generationError` metadata, rather than claiming a generated raster image.
- The provider registry distinguishes `CONFIGURED_UNVERIFIED`, `MODEL_NOT_FOUND`, `BILLING_REQUIRED`, network failures, and actual `CONNECTED` state. Flux no longer returns a fabricated connection latency.
- The workspace no longer auto-creates a Black Friday design or displays a blanket “Dual AI Agent Online” claim.
- The new `SafeMarkdown` React renderer renders headings, emphasis, lists, links, code, blockquotes, and tables without accepting model-supplied HTML.

## Legacy code removal

`processAdminChatLegacy`, `dispatchToolsByIntent`, and the canned response synthesizer have been removed. The active `processAdminChat` is the only admin runtime entrypoint; regression coverage rejects reintroduction of the legacy dispatcher and fixed Black Friday branch.
