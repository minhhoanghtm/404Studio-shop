# Admin AI Real Provider Test Report — 24 November 2026

Status: **PARTIAL_PASS**. Live OpenAI provider capabilities were verified; other advertised routes are accurately blocked/configuration-limited.

| Test | Expected | Actual | Result |
|---|---|---|---|
| Backend runtime health | API available | `/api/health` returned HTTP 200 | PASS |
| OpenAI connection | Real provider authentication | `CONNECTED`, 759 ms | PASS |
| OpenAI chat | Provider, not canned response | `gpt-4o` returned a live response; 19 input / 10 output tokens | PASS |
| OpenAI image | New generated asset | `gpt-image-1-mini` returned one asset | PASS |
| Gemini gateway | Supported configured model | HTTP 404 / normalized `MODEL_NOT_FOUND` | BLOCKED |
| Claude gateway | Supported configured model | HTTP 404 / normalized `MODEL_NOT_FOUND` | BLOCKED |
| DeepSeek gateway | Credits/access | HTTP 402 / normalized `BILLING_REQUIRED` | BLOCKED |
| FLUX | Key and verified adapter | `NOT_CONFIGURED` | BLOCKED |
| Frontend production build | Type-check and bundle | Passed | PASS |
| Browser E2E | Exercise Admin Copilot in browser | Computer-use session was stopped by the browser URL-policy enforcement before interaction | BLOCKED |

The test did not create or modify production business data, save provider keys, commit code, or change billing. Browser video capture was not possible because UI automation was blocked before the local site could be controlled.
