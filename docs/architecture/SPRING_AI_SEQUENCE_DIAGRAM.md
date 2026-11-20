# Spring AI Request Sequence

```mermaid
sequenceDiagram
  participant U as Shopper browser
  participant N as Node gateway
  participant S as Spring AI
  participant B as Node business adapter
  U->>N: JWT-authenticated POST /api/ai/chat
  N->>N: Verify JWT, Redis allow-list, role
  N->>S: HMAC-signed chat + server-derived identity
  S->>S: Verify signature; ChatClient selects per-call tools
  S->>B: HMAC-signed allowlisted tool request
  B->>B: Verify signature, validate schema/RBAC/business rules
  B-->>S: Real tool result
  S-->>N: Versioned structured response
  N-->>U: Existing API envelope
```
