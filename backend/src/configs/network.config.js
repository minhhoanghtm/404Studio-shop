const LOOPBACK_HOSTS = new Set(["127.0.0.1", "localhost", "::1"]);

const normalizeHost = (host = "") => host.trim().toLowerCase();

export const isLoopbackHost = (host = "") => LOOPBACK_HOSTS.has(normalizeHost(host));

export const parsePort = (rawValue, name, { required = true } = {}) => {
  if (rawValue === undefined || rawValue === null || String(rawValue).trim() === "") {
    if (required) {
      throw new Error(`[NetworkConfig] Missing required port environment variable: ${name}`);
    }
    return null;
  }

  const trimmed = String(rawValue).trim();
  if (!/^\d+$/.test(trimmed)) {
    throw new Error(`[NetworkConfig] Invalid port for ${name}: "${trimmed}" must be an integer between 1 and 65535.`);
  }

  const port = Number(trimmed);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`[NetworkConfig] Port out of range for ${name}: ${port} (expected 1..65535).`);
  }

  return port;
};

export const parseHttpUrl = (rawValue, name, { required = false } = {}) => {
  if (!rawValue || !String(rawValue).trim()) {
    if (required) {
      throw new Error(`[NetworkConfig] Missing required URL environment variable: ${name}`);
    }
    return "";
  }

  let parsed;
  try {
    parsed = new URL(String(rawValue).trim());
  } catch {
    throw new Error(`[NetworkConfig] Invalid URL for ${name}: "${rawValue}".`);
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`[NetworkConfig] Unsupported protocol for ${name}: "${parsed.protocol}" (expected http: or https:).`);
  }

  return parsed.toString().replace(/\/$/, "");
};

export const getBackendListenConfig = (env = process.env) => {
  const hasBackendPort = env.BACKEND_PORT !== undefined && String(env.BACKEND_PORT).trim() !== "";
  const hasPort = env.PORT !== undefined && String(env.PORT).trim() !== "";

  if (!hasBackendPort && !hasPort) {
    throw new Error("[NetworkConfig] Missing required backend port: set BACKEND_PORT or PORT.");
  }

  const backendPort = hasBackendPort ? parsePort(env.BACKEND_PORT, "BACKEND_PORT") : null;
  const legacyPort = hasPort ? parsePort(env.PORT, "PORT") : null;

  if (backendPort !== null && legacyPort !== null && backendPort !== legacyPort) {
    throw new Error(
      `[NetworkConfig] Conflicting backend ports: BACKEND_PORT (${backendPort}) !== PORT (${legacyPort}).`
    );
  }

  const port = backendPort ?? legacyPort;
  const host = (env.BACKEND_HOST || "").trim();
  if (!host) {
    throw new Error("[NetworkConfig] Missing required environment variable: BACKEND_HOST.");
  }

  const explicitUrl = parseHttpUrl(env.BACKEND_URL || env.BASE_URL, "BACKEND_URL");
  const publicUrl = explicitUrl || `http://${host}:${port}`;
  const bindHost = (env.BACKEND_BIND_HOST || "").trim() || undefined;

  return { host, bindHost, port, publicUrl };
};

export const getFrontendConfig = (env = process.env, { required = false } = {}) => {
  const host = (env.FRONTEND_HOST || "").trim();
  const port = parsePort(env.FRONTEND_PORT ?? env.VITE_PORT, "FRONTEND_PORT", { required: false });
  const explicitUrl = parseHttpUrl(env.FRONTEND_URL || env.CLIENT_URL, "FRONTEND_URL");
  const derivedUrl = !explicitUrl && host && port ? `http://${host}:${port}` : "";
  const url = explicitUrl || derivedUrl;

  if (required && !url) {
    throw new Error("[NetworkConfig] Missing frontend URL configuration: set FRONTEND_URL, CLIENT_URL, or FRONTEND_HOST + FRONTEND_PORT.");
  }

  return { host, port, url };
};

export const getCorsConfig = (env = process.env) => {
  const rawEntries = [];
  if (env.CORS_ORIGINS && String(env.CORS_ORIGINS).trim()) {
    rawEntries.push(...String(env.CORS_ORIGINS).split(","));
  }
  for (const key of ["FRONTEND_URL", "CLIENT_URL", "QA_FRONTEND_URL"]) {
    if (env[key] && String(env[key]).trim()) {
      rawEntries.push(env[key]);
    }
  }

  const origins = [];
  const seen = new Set();
  for (const item of rawEntries) {
    const trimmed = String(item || "").trim();
    if (!trimmed) continue;
    let origin;
    try {
      const parsed = new URL(trimmed);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        throw new Error("Invalid protocol");
      }
      origin = parsed.origin;
    } catch {
      throw new Error(`[NetworkConfig] Invalid CORS origin entry: "${trimmed}".`);
    }
    if (!seen.has(origin)) {
      seen.add(origin);
      origins.push(origin);
    }
  }

  return origins;
};

export const getRedisConnectionConfig = (env = process.env) => {
  const url = (env.REDIS_URL || "").trim();
  const host = (env.REDIS_HOST || "").trim();
  const port = parsePort(env.REDIS_PORT, "REDIS_PORT", { required: !url });
  const password = env.REDIS_PASSWORD ? String(env.REDIS_PASSWORD) : undefined;

  if (url) {
    let parsed;
    try {
      parsed = new URL(url);
    } catch {
      throw new Error("[NetworkConfig] Invalid REDIS_URL.");
    }
    if (parsed.protocol !== "redis:" && parsed.protocol !== "rediss:") {
      throw new Error(`[NetworkConfig] Unsupported REDIS_URL protocol: "${parsed.protocol}".`);
    }
    const urlPort = parsed.port ? parsePort(parsed.port, "REDIS_URL port") : null;
    if (urlPort !== null && port !== null && urlPort !== port) {
      throw new Error(`[NetworkConfig] Conflicting Redis ports: REDIS_URL port (${urlPort}) !== REDIS_PORT (${port}).`);
    }
    return {
      url,
      host: parsed.hostname || host,
      port: urlPort ?? port,
      password,
    };
  }

  if (!host) {
    throw new Error("[NetworkConfig] Missing required Redis configuration: set REDIS_URL or REDIS_HOST + REDIS_PORT.");
  }

  return {
    url: "",
    host,
    port,
    password,
  };
};

export const getMongoConnectionConfig = (env = process.env, { required = true } = {}) => {
  const explicitUri = (
    env.LOCAL_DEV_MONGO_URI ||
    env.MONGO_CONNECTIONSTRING ||
    env.MONGO_URI ||
    env.MONGODB_URI ||
    ""
  ).trim();

  const host = (env.MONGO_HOST || "").trim();
  const port = parsePort(env.MONGO_PORT, "MONGO_PORT", { required: false });
  const database = (env.MONGO_DATABASE || "").trim();

  if (explicitUri) {
    let parsed = null;
    try {
      parsed = new URL(explicitUri);
    } catch {
      throw new Error("[NetworkConfig] Invalid MongoDB connection string.");
    }
    if (parsed.protocol !== "mongodb:" && parsed.protocol !== "mongodb+srv:") {
      throw new Error(`[NetworkConfig] Unsupported MongoDB protocol: "${parsed.protocol}".`);
    }
    const parsedPort = parsed.port ? parsePort(parsed.port, "MONGO_CONNECTIONSTRING port") : null;
    return {
      uri: explicitUri,
      host: parsed.hostname || host,
      port: parsedPort ?? port,
      database: parsed.pathname?.replace(/^\//, "") || database,
    };
  }

  if (host && port && database) {
    return {
      uri: `mongodb://${host}:${port}/${database}`,
      host,
      port,
      database,
    };
  }

  if (required) {
    throw new Error(
      "[NetworkConfig] Missing MongoDB configuration: set MONGO_CONNECTIONSTRING (or LOCAL_DEV_MONGO_URI) or MONGO_HOST + MONGO_PORT + MONGO_DATABASE."
    );
  }

  return { uri: "", host, port, database };
};

export const getAiServiceConfig = (env = process.env) => {
  const springAiUrl = parseHttpUrl(env.SPRING_AI_SERVICE_URL, "SPRING_AI_SERVICE_URL", { required: false });
  const comfyUiBaseUrl = parseHttpUrl(env.COMFYUI_BASE_URL, "COMFYUI_BASE_URL", { required: false });
  return { springAiUrl, comfyUiBaseUrl };
};

export const assertNoPortConflicts = (env = process.env) => {
  const endpoints = [];
  const addEndpoint = (serviceName, host, port) => {
    const cleanHost = normalizeHost(host);
    if (!cleanHost || !port) return;
    const canonicalHost = isLoopbackHost(cleanHost) ? "loopback" : cleanHost;
    endpoints.push({ serviceName, canonicalHost, port });
  };

  const backend = getBackendListenConfig(env);
  addEndpoint("backend", backend.host, backend.port);

  const frontend = getFrontendConfig(env, { required: false });
  addEndpoint("frontend", frontend.host, frontend.port);

  const mongoHost = (env.MONGO_HOST || "").trim();
  const mongoPort = parsePort(env.MONGO_PORT, "MONGO_PORT", { required: false });
  addEndpoint("mongo", mongoHost, mongoPort);

  const mongoRsHost = (env.MONGO_RS_HOST || "").trim();
  const mongoRsPort = parsePort(env.MONGO_RS_PORT, "MONGO_RS_PORT", { required: false });
  if (mongoRsHost && mongoRsPort && (normalizeHost(mongoRsHost) !== normalizeHost(mongoHost) || mongoRsPort !== mongoPort)) {
    addEndpoint("mongo_rs", mongoRsHost, mongoRsPort);
  }

  if (env.REDIS_HOST || env.REDIS_PORT || env.REDIS_URL) {
    const redis = getRedisConnectionConfig(env);
    addEndpoint("redis", redis.host, redis.port);
  }

  if (env.SPRING_AI_SERVICE_URL) {
    const parsedAi = new URL(parseHttpUrl(env.SPRING_AI_SERVICE_URL, "SPRING_AI_SERVICE_URL"));
    if (parsedAi.port) {
      addEndpoint("ai_service", parsedAi.hostname, parsePort(parsedAi.port, "SPRING_AI_SERVICE_URL port"));
    }
  }

  const seen = new Map();
  for (const ep of endpoints) {
    const key = `${ep.canonicalHost}:${ep.port}`;
    const existing = seen.get(key);
    if (existing && existing !== ep.serviceName) {
      throw new Error(
        `[NetworkConfig] Port conflict on ${ep.canonicalHost}:${ep.port} between "${existing}" and "${ep.serviceName}".`
      );
    }
    seen.set(key, ep.serviceName);
  }
};

export const validateNetworkEnvironment = (env = process.env) => {
  const backend = getBackendListenConfig(env);
  const corsOrigins = getCorsConfig(env);
  const redis = getRedisConnectionConfig(env);
  const mongo = getMongoConnectionConfig(env, { required: env.NODE_ENV === "production" });
  const ai = getAiServiceConfig(env);
  assertNoPortConflicts(env);

  if (env.NODE_ENV === "production") {
    if (env.APP_ENV === "qa" || env.QA_E2E_ENABLED === "true") {
      throw new Error("Production startup aborted: QA mode flags are forbidden when NODE_ENV='production'.");
    }

    const dbName = mongo.database || env.MONGO_DATABASE || "";
    if (/(?:^|_)qa(?:_|$)|atelier_verite_qa/i.test(dbName) || /atelier_verite_qa/i.test(mongo.uri)) {
      throw new Error("Production startup aborted: QA MongoDB target is forbidden in production.");
    }

    if (env.QA_API_URL) {
      const qaApi = new URL(parseHttpUrl(env.QA_API_URL, "QA_API_URL"));
      if (isLoopbackHost(backend.host) && String(backend.port) === qaApi.port) {
        throw new Error("Production startup aborted: backend port matches QA_API_URL port.");
      }
    }
  }

  return {
    backend,
    corsOrigins,
    redis,
    mongo,
    ai,
  };
};
