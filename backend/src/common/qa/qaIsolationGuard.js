const ALLOWED_LOOPBACK_HOSTS = new Set(["127.0.0.1", "localhost"]);

function parseLoopbackUrl(raw, { expectedProtocols, expectedPort, expectedPath }) {
  if (!raw || typeof raw !== "string" || !raw.trim()) {
    throw new Error("QA isolation guard refused missing target configuration.");
  }
  let parsed;
  try {
    parsed = new URL(raw.trim());
  } catch {
    throw new Error("QA isolation guard refused malformed target URL.");
  }
  if (parsed.username || parsed.password || parsed.hash) {
    throw new Error("QA isolation guard refused URL with embedded credentials or hash.");
  }
  if (expectedProtocols && !expectedProtocols.includes(parsed.protocol)) {
    throw new Error("QA isolation guard refused disallowed protocol.");
  }
  if (!ALLOWED_LOOPBACK_HOSTS.has(parsed.hostname)) {
    throw new Error("QA isolation guard refused non-loopback target host.");
  }
  if (expectedPort && parsed.port !== expectedPort) {
    throw new Error("QA isolation guard refused non-QA port.");
  }
  if (expectedPath && parsed.pathname !== expectedPath) {
    throw new Error("QA isolation guard refused non-QA path/database.");
  }
  return parsed;
}

function parseRedisTarget() {
  if (process.env.REDIS_URL && process.env.REDIS_URL.trim()) {
    let parsed;
    try {
      parsed = new URL(process.env.REDIS_URL.trim());
    } catch {
      throw new Error("QA isolation guard refused malformed Redis URL.");
    }
    if (
      parsed.protocol !== "redis:" ||
      !ALLOWED_LOOPBACK_HOSTS.has(parsed.hostname) ||
      parsed.port !== "6381"
    ) {
      throw new Error("QA isolation guard refused non-QA Redis target.");
    }
    return { hostname: parsed.hostname, port: parsed.port };
  }

  const host = (process.env.REDIS_HOST || "").trim();
  const port = (process.env.REDIS_PORT || "").trim();
  if (!host || !port || !ALLOWED_LOOPBACK_HOSTS.has(host) || port !== "6381") {
    throw new Error("QA isolation guard refused missing or non-QA Redis target.");
  }
  return { hostname: host, port };
}

export function validateQaTargetConfig({ liveProviders = false, allowReplicaSet = false } = {}) {
  if (process.env.APP_ENV !== "qa") {
    throw new Error("QA suite guard refused target: APP_ENV must be 'qa'.");
  }
  if (process.env.QA_E2E_ENABLED !== "true") {
    throw new Error("QA suite guard refused target: QA_E2E_ENABLED must be 'true'.");
  }
  if (!process.env.QA_SEED_PASSWORD || process.env.QA_SEED_PASSWORD.trim().length < 12) {
    throw new Error("QA suite guard refused target: missing valid QA_SEED_PASSWORD.");
  }
  if (liveProviders && process.env.QA_ALLOW_LIVE_PROVIDER_TESTS !== "true") {
    throw new Error("Live provider tests require explicit budget authorization.");
  }

  const api = parseLoopbackUrl(process.env.QA_API_URL || "", {
    expectedProtocols: ["http:"],
    expectedPort: "5002",
    expectedPath: "/api",
  });

  const rawMongo =
    process.env.LOCAL_DEV_MONGO_URI ||
    process.env.MONGO_CONNECTIONSTRING ||
    process.env.MONGO_URI ||
    "";

  let mongoUri;
  if (allowReplicaSet && process.env.QA_RS_MONGO_URI) {
    mongoUri = parseLoopbackUrl(process.env.QA_RS_MONGO_URI, {
      expectedProtocols: ["mongodb:"],
      expectedPort: "27019",
      expectedPath: "/atelier_verite_qa_rs",
    });
  } else {
    mongoUri = parseLoopbackUrl(rawMongo, {
      expectedProtocols: ["mongodb:"],
      expectedPort: "27018",
      expectedPath: "/atelier_verite_qa",
    });
  }

  const redis = parseRedisTarget();

  return {
    api,
    mongoUri,
    redis,
  };
}

export function assertConnectedQaDatabase(mongooseInstance, { allowReplicaSet = false } = {}) {
  const conn = mongooseInstance?.connection;
  if (!conn || conn.readyState !== 1) {
    throw new Error("QA database verification failed: connection not ready.");
  }
  if (!ALLOWED_LOOPBACK_HOSTS.has(conn.host)) {
    throw new Error("QA database verification failed: non-loopback host.");
  }
  const validPrimary = conn.name === "atelier_verite_qa" && conn.port === 27018;
  const validRs = allowReplicaSet && conn.name === "atelier_verite_qa_rs" && conn.port === 27019;
  if (!validPrimary && !validRs) {
    throw new Error("QA database verification failed: unexpected database name or port.");
  }
}

export async function verifyQaSuiteTarget({
  liveProviders = false,
  allowReplicaSet = false,
  verifyRuntime = true,
} = {}) {
  let validated;
  try {
    validated = validateQaTargetConfig({ liveProviders, allowReplicaSet });
  } catch (err) {
    if (/budget authorization/i.test(err.message)) {
      throw err;
    }
    throw new Error(`QA suite guard refused target (${err.message})`);
  }

  if (verifyRuntime) {
    const login = await fetch(`${validated.api.origin}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "qa.superadmin@atelier.local",
        passWord: process.env.QA_SEED_PASSWORD,
      }),
      signal: AbortSignal.timeout(10000),
    });
    if (!login.ok) {
      throw new Error("QA suite authentication failed.");
    }
    const token = (await login.json())?.data?.accessToken;
    if (!token) {
      throw new Error("QA suite authentication failed: missing access token.");
    }

    const response = await fetch(`${validated.api.origin}/api/admin/ai/qa-context`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(10000),
    });
    const context = (await response.json())?.data;
    if (
      !response.ok ||
      context?.environment !== "qa" ||
      context.database !== "atelier_verite_qa" ||
      !ALLOWED_LOOPBACK_HOSTS.has(context.databaseHost) ||
      context.databasePort !== 27018 ||
      context.connected !== true ||
      !context.redisQa
    ) {
      throw new Error("QA suite runtime verification failed.");
    }
  }

  return validated.mongoUri.toString();
}

export const assertQaScriptPreflight = verifyQaSuiteTarget;
