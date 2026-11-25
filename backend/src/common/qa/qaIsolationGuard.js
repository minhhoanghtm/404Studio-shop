import { isLoopbackHost, parsePort } from "../../configs/network.config.js";

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
  if (!isLoopbackHost(parsed.hostname)) {
    throw new Error("QA isolation guard refused non-loopback target host.");
  }
  if (expectedPort && parsed.port !== String(expectedPort)) {
    throw new Error("QA isolation guard refused mismatched or non-QA port.");
  }
  if (expectedPath && parsed.pathname !== expectedPath) {
    throw new Error("QA isolation guard refused non-QA path/database.");
  }
  return parsed;
}

function assertQaDatabaseName(name, label) {
  const clean = (name || "").trim();
  if (!clean || !/(?:^|_)qa(?:_rs)?$/i.test(clean)) {
    throw new Error(`QA isolation guard refused non-QA ${label}: "${clean || "(empty)"}".`);
  }
  return clean;
}

function parseRedisTarget() {
  const expectedPort = parsePort(process.env.REDIS_PORT, "REDIS_PORT", { required: true });

  if (process.env.REDIS_URL && process.env.REDIS_URL.trim()) {
    let parsed;
    try {
      parsed = new URL(process.env.REDIS_URL.trim());
    } catch {
      throw new Error("QA isolation guard refused malformed Redis URL.");
    }
    if (
      parsed.protocol !== "redis:" ||
      !isLoopbackHost(parsed.hostname) ||
      parsed.port !== String(expectedPort)
    ) {
      throw new Error("QA isolation guard refused mismatched or non-QA Redis target.");
    }
    return { hostname: parsed.hostname, port: parsed.port };
  }

  const host = (process.env.REDIS_HOST || "").trim();
  const port = (process.env.REDIS_PORT || "").trim();
  if (!host || !port || !isLoopbackHost(host) || port !== String(expectedPort)) {
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

  const expectedBackendPort = parsePort(process.env.BACKEND_PORT ?? process.env.PORT, "BACKEND_PORT", {
    required: true,
  });

  const api = parseLoopbackUrl(process.env.QA_API_URL || "", {
    expectedProtocols: ["http:"],
    expectedPort: String(expectedBackendPort),
    expectedPath: "/api",
  });

  let frontend = null;
  if (process.env.QA_FRONTEND_URL && process.env.QA_FRONTEND_URL.trim()) {
    const expectedFrontendPort = process.env.FRONTEND_PORT ?? process.env.VITE_PORT;
    frontend = parseLoopbackUrl(process.env.QA_FRONTEND_URL, {
      expectedProtocols: ["http:"],
      expectedPort: expectedFrontendPort
        ? String(parsePort(expectedFrontendPort, "FRONTEND_PORT", { required: true }))
        : undefined,
    });
  }

  const expectedPrimaryDb = assertQaDatabaseName(process.env.MONGO_DATABASE, "MONGO_DATABASE");
  const expectedPrimaryPort = parsePort(process.env.MONGO_PORT, "MONGO_PORT", { required: true });

  const rawMongo =
    process.env.LOCAL_DEV_MONGO_URI ||
    process.env.MONGO_CONNECTIONSTRING ||
    process.env.MONGO_URI ||
    "";

  let mongoUri;
  let expectedDatabase = expectedPrimaryDb;
  let expectedDatabasePort = expectedPrimaryPort;

  const rawRsMongo = (process.env.QA_RS_MONGO_URI || process.env.MONGO_RS_CONNECTIONSTRING || "").trim();
  if (allowReplicaSet && rawRsMongo) {
    const expectedRsDb = assertQaDatabaseName(process.env.MONGO_RS_DATABASE, "MONGO_RS_DATABASE");
    const expectedRsPort = parsePort(process.env.MONGO_RS_PORT, "MONGO_RS_PORT", { required: true });
    mongoUri = parseLoopbackUrl(rawRsMongo, {
      expectedProtocols: ["mongodb:"],
      expectedPort: String(expectedRsPort),
      expectedPath: `/${expectedRsDb}`,
    });
    expectedDatabase = expectedRsDb;
    expectedDatabasePort = expectedRsPort;
  } else {
    mongoUri = parseLoopbackUrl(rawMongo, {
      expectedProtocols: ["mongodb:"],
      expectedPort: String(expectedPrimaryPort),
      expectedPath: `/${expectedPrimaryDb}`,
    });
  }

  const redis = parseRedisTarget();

  return {
    api,
    frontend,
    mongoUri,
    redis,
    expectedDatabase,
    expectedDatabasePort,
    expectedPrimaryDb,
    expectedPrimaryPort,
  };
}

export function assertConnectedQaDatabase(mongooseInstance, { allowReplicaSet = false } = {}) {
  const conn = mongooseInstance?.connection;
  if (!conn || conn.readyState !== 1) {
    throw new Error("QA database verification failed: connection not ready.");
  }
  if (!isLoopbackHost(conn.host)) {
    throw new Error("QA database verification failed: non-loopback host.");
  }
  const primaryDb = assertQaDatabaseName(process.env.MONGO_DATABASE, "MONGO_DATABASE");
  const primaryPort = parsePort(process.env.MONGO_PORT, "MONGO_PORT", { required: true });
  const validPrimary = conn.name === primaryDb && conn.port === primaryPort;

  let validRs = false;
  if (allowReplicaSet) {
    const rsDb = assertQaDatabaseName(process.env.MONGO_RS_DATABASE, "MONGO_RS_DATABASE");
    const rsPort = parsePort(process.env.MONGO_RS_PORT, "MONGO_RS_PORT", { required: true });
    validRs = conn.name === rsDb && conn.port === rsPort;
  }

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
      context.database !== validated.expectedPrimaryDb ||
      !isLoopbackHost(context.databaseHost) ||
      Number(context.databasePort) !== validated.expectedPrimaryPort ||
      context.connected !== true ||
      !context.redisQa ||
      (context.redisPort !== undefined && Number(context.redisPort) !== Number(validated.redis.port))
    ) {
      throw new Error("QA suite runtime verification failed.");
    }
  }

  return validated.mongoUri.toString();
}

export const assertQaScriptPreflight = verifyQaSuiteTarget;
