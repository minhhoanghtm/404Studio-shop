# AI Security Model

- Browser input is never trusted for identity, role, confirmation or tool URL.
- Node authenticates the user before selecting Spring orchestration.
- Both internal hops use HMAC-SHA-256 signatures, a 60-second timestamp window and constant-time comparison.
- Spring uses a fixed Node tool allowlist and never receives database credentials, user JWTs, refresh tokens, OTPs or payment secrets.
- Tools are registered per request, not as globally available admin functions.
- The model can prepare a cart action only. Existing Node pending-action HMAC, expiration, ownership and replay protections execute the mutation after shopper confirmation.
- System instructions explicitly treat RAG/tool text as untrusted and forbid secret disclosure, privilege escalation, payment/price/inventory changes and sensitive account changes.
