import logger from "../common/logger.js";

/**
 * Validates critical environment variables upon server startup.
 * Enforces fail-fast behavior in production if mandatory secrets are missing.
 */
export const validateEnvironment = () => {
  const isProduction = process.env.NODE_ENV === "production";
  const requiredInProduction = [
    { key: "MONGO_CONNECTIONSTRING", altKeys: ["MONGO_URI", "MONGODB_URI"] },
    { key: "ACCESS_TOKEN_SECRET" },
    { key: "REFRESH_TOKEN_SECRET" },
  ];

  const missing = [];

  for (const item of requiredInProduction) {
    const val =
      process.env[item.key] ||
      (item.altKeys ? item.altKeys.map((k) => process.env[k]).find(Boolean) : undefined);
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

  // Enforce strict QA/Production separation & warn about weak secrets in production
  if (isProduction) {
    if (process.env.APP_ENV === "qa") {
      throw new Error("Production startup aborted: APP_ENV='qa' is forbidden when NODE_ENV='production'.");
    }
    const mongoTarget = process.env.MONGO_CONNECTIONSTRING || process.env.MONGO_URI || process.env.MONGODB_URI || "";
    const redisTarget = process.env.REDIS_URL || `${process.env.REDIS_HOST || ""}:${process.env.REDIS_PORT || ""}`;
    if (/atelier_verite_qa|27018|27019/.test(mongoTarget)) {
      throw new Error("Production startup aborted: QA MongoDB target is forbidden in production.");
    }
    if (/:6381(\b|\/|$)/.test(redisTarget)) {
      throw new Error("Production startup aborted: QA Redis port 6381 is forbidden in production.");
    }
    const secretsToCheck = ["ACCESS_TOKEN_SECRET", "REFRESH_TOKEN_SECRET"];
    for (const secretKey of secretsToCheck) {
      const val = process.env[secretKey] || "";
      if (val.length < 32) {
        logger.warn(`⚠️ [Security] ${secretKey} is shorter than 32 characters. Consider using a 64-byte hex string in production.`);
      }
    }
  }

  return true;
};
