# Spring AI Shopping Agent Implementation Audit

Date: 20 November 2026

## Evidence reviewed

- `PROJECT_HANDOVER.md`, `project-management/TASK_INDEX.md`, root Compose files, frontend chat UI, Node AI routes, validators, RAG service, vector index service, JWT middleware and the existing AI agent tool registry.
- The Node implementation already has a Mongo-backed vector embedding model, semantic search, RAG, an OpenAI/OpenRouter/Gemini provider path, bounded tool loop, pending-action HMAC tokens, per-user conversation persistence, rate limits and AI health metrics.

## Findings

| Area | Current state | Decision |
| --- | --- | --- |
| Database | MongoDB + Redis | Do not replace it for AI. |
| Existing vector retrieval | Node Mongo cosine / optional Atlas | Retain as the source of commerce candidates while a managed Spring-compatible store is selected. |
| Authentication/RBAC | Node JWT with Redis token allow-list and database role lookup | Node remains the trust boundary. |
| Chat UI | `AiAssistantModal` calls `POST /api/ai/chat` and already handles pending confirmations | Preserve the public API; Node can opt into Spring orchestration. |
| AI action safety | Existing pending action, expiry and HMAC checks for cart/checkout | Spring tools can only prepare actions; Node remains final authority. |

## Implemented integration

`React -> Node /api/ai/chat -> (signed) Spring /internal/v1/chat -> ChatClient + @Tool -> (signed) Node /api/internal/ai/tools/:tool -> existing Node service`.

The browser never sees an internal credential and Spring has no database credentials. Identity headers are accepted only after HMAC verification with a 60-second replay window.

## Blockers

`BLOCKED_BY_BACKEND_ENVIRONMENT`: no isolated database/Redis environment, authorized test credentials, real model key, or payment sandbox credentials were supplied. Consequently no live mutation, payment, E2E or video result is reported as passing.
