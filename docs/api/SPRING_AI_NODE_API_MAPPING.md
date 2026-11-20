# Spring AI / Node API Mapping

## Public compatibility

`POST /api/ai/chat` remains the frontend contract. Set `AI_ORCHESTRATOR=spring` only with `SPRING_AI_SERVICE_URL` and a 32+ byte `AI_SERVICE_SHARED_SECRET`; otherwise the existing Node implementation remains active.

## Internal contracts

| Direction | Endpoint | Authentication |
| --- | --- | --- |
| Node -> Spring | `POST /internal/v1/chat` | `X-AI-Service-*` HMAC plus server-derived end-user headers |
| Spring -> Node | `POST /api/internal/ai/tools/:tool` | HMAC over timestamp, method, path and SHA-256 body digest |

Internal endpoints are not for browser clients. Signatures expire after 60 seconds and missing/malformed service configuration fails closed.
