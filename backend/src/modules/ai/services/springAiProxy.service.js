import crypto from "crypto";

const enabled = () =>
  process.env.AI_ORCHESTRATOR === "spring" ||
  process.env.AI_ORCHESTRATOR === "ai-service";

/** Calls the private TypeScript AI Service endpoint only after this Node process verified the browser JWT. */
export async function sendToSpringAi(payload, { userId, role }) {
  const baseUrl = String(process.env.SPRING_AI_SERVICE_URL || "http://localhost:8081").replace(/\/$/, "");
  const secret = process.env.AI_SERVICE_SHARED_SECRET || "dev_shared_secret_key_minimum_32_characters_123456";
  if (!enabled()) {
    const error = new Error("AI service orchestration is not enabled");
    error.code = "SPRING_AI_NOT_CONFIGURED";
    throw error;
  }
  const path = "/internal/v1/chat";
  const timestamp = String(Math.floor(Date.now() / 1000));
  const safeRole = role || "guest";
  const material = `${timestamp}.POST.${path}.${userId || "anonymous"}.${safeRole}`;
  const signature = crypto.createHmac("sha256", secret).update(material).digest("hex");
  const timeout = AbortSignal.timeout(Number(process.env.SPRING_AI_TIMEOUT_MS || 30000));
  let response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "X-AI-Service-Timestamp": timestamp,
        "X-AI-Service-Signature": signature,
        "X-AI-End-User-Id": String(userId || "anonymous"),
        "X-AI-End-User-Role": safeRole,
      },
      body: JSON.stringify({
        content: payload.content,
        conversationId: payload.conversationId || null,
        metadata: payload.metadata || {},
        confirmAction: payload.confirmAction,
        cancelAction: payload.cancelAction,
        mode: payload.mode,
      }),
      signal: timeout,
    });
  } catch (err) {
    const error = new Error(`AI service connection failed: ${err.message}`);
    error.code = "SPRING_AI_UNAVAILABLE";
    error.cause = err;
    throw error;
  }
  if (!response.ok) {
    const error = new Error("AI service rejected the request");
    error.code = "SPRING_AI_UNAVAILABLE";
    error.status = response.status;
    throw error;
  }
  return response.json();
}
