# Spring AI Architecture

The new `ai-service` is an orchestration boundary, not a replacement commerce backend.

```text
Browser -> Node JWT/RBAC gateway -> Spring AI ChatClient -> allowlisted @Tool adapter -> Node business services -> MongoDB/Redis
```

- Node signs end-user identity only after existing JWT, token allow-list and RBAC verification.
- Spring validates the signature and passes identity through thread-local tool context; model arguments never supply user IDs or roles.
- Spring signs tool requests back to Node. Node validates the signature, enforces an allowlist, then invokes the existing `AiToolRegistry` with `confirmed: false`.
- Spring chat memory is keyed by a Node-verified shopper ID plus sanitized conversation ID, so two users cannot share a memory namespace.
- Consequential actions remain behind the existing Node pending-action and confirmation workflow.

Spring AI 1.1.2 is pinned through its BOM with Spring Boot 3.5.0 and Java 17. The implementation uses `ChatClient`, `@Tool`, `VectorStore`, Actuator and Prometheus metrics. Spring AI documentation was reviewed before choosing these APIs; a later upgrade must follow its published 2.x migration notes rather than mixing APIs.
