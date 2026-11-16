# AI Tool Capability Matrix

The model may only call the server-defined tool registry; the browser does not build endpoint URLs from model output.

| Capability | Backend evidence | Risk | Frontend status |
|---|---|---|---|
| Product search/detail, stock, recommendations, best sellers | AI registry + product/inventory modules | READ_ONLY | Server mediated |
| Cart add / update / remove / view | AI registry and cart service | LOW_RISK_WRITE | Confirmation required for add-to-cart agent action |
| Checkout reservation / cancellation | AI registry + inventory reservation | CONFIRMATION_REQUIRED | Server mediated |
| Order history/detail | AI registry + ownership checks | READ_ONLY | Server mediated |
| Create payment session | payment routes require authenticated customer | CONFIRMATION_REQUIRED | Final checkout click only |
| Return / refund / order cancellation | No confirmed public agent action in audited frontend | RESTRICTED | Not exposed as a fabricated action |
| Secrets, passwords, OTP, arbitrary URL/API access | Not a tool | RESTRICTED | Explicit chat warning/refusal |

Every mutating action must retain server authentication, authorization, ownership validation, schema validation, timeout/error handling and idempotency. The frontend does not treat natural-language text as authorization.
