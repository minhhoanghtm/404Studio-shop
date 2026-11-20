# Spring AI API Test Report

Date: 20 November 2026

## Executed

- `node --check backend/src/modules/ai/internalAi.route.js` — PASS.
- `node --check backend/src/modules/ai/services/springAiProxy.service.js` — PASS.
- `node --check backend/src/modules/ai/ai.controller.js` — PASS.
- `docker build -t atelier-spring-ai-check ./ai-service` — PASS after compilation against Spring AI 1.1.2 and Java 17.
- `docker compose config --quiet` — PASS (the `ai` profile is opt-in and normal Compose startup does not require an AI secret).

## Pending

Live signed Node-to-Spring and Spring-to-Node calls require `AI_SERVICE_SHARED_SECRET`, a real model key, MongoDB/Redis and an authorized shopper account. No mocked runtime substitute was used; result is `BLOCKED_BY_BACKEND_ENVIRONMENT`.
