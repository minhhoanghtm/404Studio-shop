import { test } from "node:test";
import assert from "node:assert/strict";
import {
  assertNoPortConflicts,
  getBackendListenConfig,
  getCorsConfig,
  getFrontendConfig,
  getMongoConnectionConfig,
  getRedisConnectionConfig,
  parsePort,
  validateNetworkEnvironment,
} from "../network.config.js";
import { validateEnvironment } from "../validateEnv.js";

const buildValidEnv = (overrides = {}) => ({
  NODE_ENV: "development",
  APP_ENV: "local",
  BACKEND_HOST: "127.0.0.1",
  BACKEND_PORT: "15002",
  PORT: "15002",
  FRONTEND_HOST: "127.0.0.1",
  FRONTEND_PORT: "15174",
  FRONTEND_URL: "http://127.0.0.1:15174",
  CLIENT_URL: "http://127.0.0.1:15174",
  CORS_ORIGINS: "http://127.0.0.1:15174,http://localhost:15174",
  REDIS_HOST: "127.0.0.1",
  REDIS_PORT: "16381",
  MONGO_HOST: "127.0.0.1",
  MONGO_PORT: "17018",
  MONGO_DATABASE: "atelier_verite_alt_qa",
  MONGO_CONNECTIONSTRING: "mongodb://127.0.0.1:17018/atelier_verite_alt_qa",
  ...overrides,
});

test("parsePort enforces required integer range 1..65535", () => {
  assert.equal(parsePort("15002", "BACKEND_PORT"), 15002);
  assert.equal(parsePort(undefined, "OPTIONAL_PORT", { required: false }), null);
  assert.throws(() => parsePort("", "BACKEND_PORT"), /Missing required port/);
  assert.throws(() => parsePort("abc", "BACKEND_PORT"), /Invalid port/);
  assert.throws(() => parsePort("0", "BACKEND_PORT"), /Port out of range/);
  assert.throws(() => parsePort("70000", "BACKEND_PORT"), /Port out of range/);
});

test("getBackendListenConfig fails fast on missing or conflicting BACKEND_PORT vs PORT", () => {
  assert.throws(() => getBackendListenConfig({ BACKEND_HOST: "127.0.0.1" }), /Missing required backend port/);
  assert.throws(
    () => getBackendListenConfig({ BACKEND_HOST: "127.0.0.1", BACKEND_PORT: "15001", PORT: "15002" }),
    /Conflicting backend ports/
  );
  assert.throws(
    () => getBackendListenConfig({ BACKEND_PORT: "15002" }),
    /Missing required environment variable: BACKEND_HOST/
  );

  const cfg = getBackendListenConfig(buildValidEnv());
  assert.equal(cfg.port, 15002);
  assert.equal(cfg.publicUrl, "http://127.0.0.1:15002");
});

test("getRedisConnectionConfig requires explicit REDIS_URL or REDIS_HOST+REDIS_PORT and rejects mismatch", () => {
  assert.throws(() => getRedisConnectionConfig({}), /Missing required port|Missing required Redis/);
  assert.throws(
    () => getRedisConnectionConfig({ REDIS_URL: "http://127.0.0.1:16381" }),
    /Unsupported REDIS_URL protocol/
  );
  assert.throws(
    () => getRedisConnectionConfig({ REDIS_URL: "redis://127.0.0.1:16381", REDIS_PORT: "16382" }),
    /Conflicting Redis ports/
  );

  const redis = getRedisConnectionConfig(buildValidEnv());
  assert.equal(redis.host, "127.0.0.1");
  assert.equal(redis.port, 16381);
});

test("getCorsConfig and getMongoConnectionConfig resolve cleanly from ENV without defaults", () => {
  const origins = getCorsConfig(buildValidEnv());
  assert.deepEqual(origins, ["http://127.0.0.1:15174", "http://localhost:15174"]);
  assert.throws(() => getCorsConfig({ CORS_ORIGINS: "not-a-url" }), /Invalid CORS origin/);

  assert.throws(() => getMongoConnectionConfig({}, { required: true }), /Missing MongoDB configuration/);
  const mongo = getMongoConnectionConfig(buildValidEnv());
  assert.equal(mongo.database, "atelier_verite_alt_qa");
  assert.equal(mongo.port, 17018);

  const frontend = getFrontendConfig(buildValidEnv(), { required: true });
  assert.equal(frontend.url, "http://127.0.0.1:15174");
});

test("assertNoPortConflicts rejects duplicate service ports on loopback/same host", () => {
  assert.throws(
    () => assertNoPortConflicts(buildValidEnv({ FRONTEND_PORT: "15002" })),
    /Port conflict/
  );
  assert.throws(
    () => assertNoPortConflicts(buildValidEnv({ REDIS_PORT: "15002" })),
    /Port conflict/
  );
});

test("validateNetworkEnvironment and validateEnvironment enforce production/QA isolation and alternate ports", () => {
  const validAlt = validateNetworkEnvironment(buildValidEnv());
  assert.equal(validAlt.backend.port, 15002);

  // Production blocks QA mode & QA databases
  assert.throws(
    () =>
      validateEnvironment(
        buildValidEnv({
          NODE_ENV: "production",
          APP_ENV: "qa",
          ACCESS_TOKEN_SECRET: "a".repeat(32),
          REFRESH_TOKEN_SECRET: "b".repeat(32),
        })
      ),
    /QA mode flags are forbidden/
  );

  assert.throws(
    () =>
      validateEnvironment(
        buildValidEnv({
          NODE_ENV: "production",
          APP_ENV: "production",
          MONGO_DATABASE: "atelier_verite_qa",
          MONGO_CONNECTIONSTRING: "mongodb://127.0.0.1:17018/atelier_verite_qa",
          ACCESS_TOKEN_SECRET: "a".repeat(32),
          REFRESH_TOKEN_SECRET: "b".repeat(32),
        })
      ),
    /QA MongoDB target is forbidden in production/
  );

  assert.equal(
    validateEnvironment(
      buildValidEnv({
        NODE_ENV: "production",
        APP_ENV: "production",
        MONGO_DATABASE: "atelier_verite_prod",
        MONGO_CONNECTIONSTRING: "mongodb://mongo:27017/atelier_verite_prod?replicaSet=rs0",
        ACCESS_TOKEN_SECRET: "a".repeat(32),
        REFRESH_TOKEN_SECRET: "b".repeat(32),
      })
    ),
    true
  );
});
