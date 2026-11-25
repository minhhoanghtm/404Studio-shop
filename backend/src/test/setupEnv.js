// Test-only values. They are deliberately not production credentials.
// Modules validate these at import time, so they must be installed before tests load.
process.env.NODE_ENV = "test";
process.env.APP_ENV ??= "test";
process.env.BACKEND_HOST ??= "127.0.0.1";
process.env.BACKEND_PORT ??= "5000";
process.env.PORT ??= process.env.BACKEND_PORT;
process.env.BACKEND_URL ??= `http://${process.env.BACKEND_HOST}:${process.env.BACKEND_PORT}`;
process.env.FRONTEND_HOST ??= "127.0.0.1";
process.env.FRONTEND_PORT ??= "5173";
process.env.FRONTEND_URL ??= `http://${process.env.FRONTEND_HOST}:${process.env.FRONTEND_PORT}`;
process.env.CLIENT_URL ??= process.env.FRONTEND_URL;
process.env.CORS_ORIGINS ??= `${process.env.FRONTEND_URL},http://localhost:${process.env.FRONTEND_PORT}`;
process.env.REDIS_HOST ??= "127.0.0.1";
process.env.REDIS_PORT ??= "6379";
process.env.MONGO_HOST ??= "127.0.0.1";
process.env.MONGO_PORT ??= "27017";
process.env.MONGO_DATABASE ??= "atelier_verite_unit_test";
process.env.OTP_SECRET ??= "test-otp-secret-at-least-thirty-two-characters";
process.env.ACTION_SECRET ??= "test-action-secret-at-least-thirty-two-chars";
process.env.ACCESS_TOKEN_SECRET ??= "test-access-token-secret-at-least-32-chars";
process.env.REFRESH_TOKEN_SECRET ??= "test-refresh-token-secret-at-least-32-chars";
process.env.DISABLE_RATE_LIMIT_FOR_TESTS = "true";
