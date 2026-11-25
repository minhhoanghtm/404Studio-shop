import logger from "../common/logger.js";
import { validateNetworkEnvironment } from "./network.config.js";

/**
 * Validates critical environment variables upon server startup.
 * Enforces fail-fast behavior for network/port configuration and production secrets.
 */
export const validateEnvironment = (env = process.env) => {
  const isProduction = env.NODE_ENV === "production";
  const requiredInProduction = [
    { key: "MONGO_CONNECTIONSTRING", altKeys: ["MONGO_URI", "MONGODB_URI"] },
    { key: "ACCESS_TOKEN_SECRET" },
    { key: "REFRESH_TOKEN_SECRET" },
  ];

  const missing = [];

  for (const item of requiredInProduction) {
    const val =
      env[item.key] ||
      (item.altKeys ? item.altKeys.map((k) => env[k]).find(Boolean) : undefined);
    if (!val) {
      missing.push(item.key);
    }
  }

  if (missing.length > 0) {
    const errorMsg = `❌ [Config] Missing required environment variables: ${missing.join(", ")}`;
    if (isProduction) {
      logger.error(errorMsg);
      console.error(errorMsg);
      throw new Error(`Production startup aborted. ${errorMsg}`);
    } else {
      logger.warn(`⚠️ [Config] Missing non-production environment variables: ${missing.join(", ")}`);
    }
  }

  // Enforce network, port, CORS, Mongo, and Redis ENV integrity across all environments
  validateNetworkEnvironment(env);

  // Enforce strict QA/Production separation & warn about weak secrets in production
  if (isProduction) {
    const secretsToCheck = ["ACCESS_TOKEN_SECRET", "REFRESH_TOKEN_SECRET"];
    for (const secretKey of secretsToCheck) {
      const val = env[secretKey] || "";
      if (val.length < 32) {
        logger.warn(`⚠️ [Security] ${secretKey} is shorter than 32 characters. Consider using a 64-byte hex string in production.`);
      }
    }
  }

  return true;
};
