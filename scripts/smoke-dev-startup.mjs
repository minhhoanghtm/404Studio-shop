import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const getFreePort = () =>
  new Promise((resolve, reject) => {
    const server = net.createServer();
    server.unref();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address();
      if (!addr || typeof addr === "string") {
        server.close(() => reject(new Error("Failed to acquire ephemeral TCP port.")));
        return;
      }
      const { port } = addr;
      server.close((err) => (err ? reject(err) : resolve(port)));
    });
  });

const killProcessTree = (child) => {
  if (!child || child.exitCode !== null || child.pid == null) return Promise.resolve();
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (!settled) {
        settled = true;
        resolve();
      }
    };
    child.once("exit", finish);

    if (process.platform === "win32") {
      try {
        spawnSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore" });
      } catch {
        child.kill("SIGKILL");
      }
    } else {
      try {
        child.kill("SIGTERM");
      } catch {
        finish();
      }
    }

    setTimeout(() => {
      try {
        child.kill("SIGKILL");
      } catch {
        // ignore already-exited child
      }
      finish();
    }, 3000).unref();
  });
};

const SYSTEM_ENV_KEYS = [
  "PATH",
  "Path",
  "PATHEXT",
  "SystemRoot",
  "SYSTEMROOT",
  "COMSPEC",
  "ComSpec",
  "TEMP",
  "TMP",
  "HOME",
  "USERPROFILE",
  "APPDATA",
  "LOCALAPPDATA",
];

const buildCleanChildEnv = (overrides = {}) => {
  const clean = {};
  for (const key of SYSTEM_ENV_KEYS) {
    if (process.env[key] !== undefined) {
      clean[key] = process.env[key];
    }
  }
  for (const [key, value] of Object.entries(overrides)) {
    if (value !== undefined) {
      clean[key] = value;
    }
  }
  return clean;
};

const runExpectFailure = (label, args, envOverrides, expectedPattern, cwd = repoRoot) => {
  const result = spawnSync(process.execPath, args, {
    cwd,
    env: buildCleanChildEnv(envOverrides),
    encoding: "utf8",
    timeout: 20000,
  });

  const combined = `${result.stdout || ""}\n${result.stderr || ""}`;
  assert.notEqual(result.status, 0, `${label}: expected non-zero exit status, got 0.\nOutput:\n${combined}`);
  assert.match(
    combined,
    expectedPattern,
    `${label}: output did not match ${expectedPattern}.\nOutput:\n${combined}`
  );
  console.log(`PASS [negative]: ${label}`);
};

const waitForHttpOk = async (url, timeoutMs = 20000, label = url, proc = null) => {
  const deadline = Date.now() + timeoutMs;
  let lastError = null;
  while (Date.now() < deadline) {
    if (proc && proc.child.exitCode !== null) {
      throw new Error(
        `${label} exited early with code ${proc.child.exitCode}.\nLogs:\n${proc.getLogs()}`
      );
    }
    try {
      const res = await fetch(url);
      if (res.status >= 200 && res.status < 300) {
        return res;
      }
      lastError = new Error(`HTTP ${res.status} from ${url}`);
    } catch (err) {
      lastError = err;
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  const logTail = proc ? `\nLogs:\n${proc.getLogs()}` : "";
  throw new Error(
    `Timed out waiting for ${label} (${url}): ${lastError?.message || "no response"}${logTail}`
  );
};

const startService = (label, args, envOverrides, cwd = repoRoot) => {
  let logs = "";
  const child = spawn(process.execPath, args, {
    cwd,
    env: buildCleanChildEnv(envOverrides),
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout?.on("data", (chunk) => {
    logs += chunk.toString();
  });
  child.stderr?.on("data", (chunk) => {
    logs += chunk.toString();
  });

  return {
    child,
    getLogs: () => logs,
  };
};

async function main() {
  const tsxCli = path.join(repoRoot, "ai-service", "node_modules", "tsx", "dist", "cli.mjs");
  const viteCli = path.join(repoRoot, "frontend", "node_modules", "vite", "bin", "vite.js");
  assert.ok(fs.existsSync(tsxCli), `Missing tsx CLI at ${tsxCli}`);
  assert.ok(fs.existsSync(viteCli), `Missing vite CLI at ${viteCli}`);

  const aiPort = await getFreePort();
  const backendPort = await getFreePort();
  const frontendPort = await getFreePort();
  const frontendPreviewPort = await getFreePort();

  const sharedSecret = "smoke_test_ai_shared_secret_minimum_32_characters_ok";
  const dummyTokenSecret = "smoke_test_jwt_secret_minimum_32_characters_123456";

  // 1. Negative fail-fast checks (ESM order, missing ENV, trailing /api, QA guard)
  runExpectFailure(
    "AI Service rejects missing NODE_BACKEND_BASE_URL before route startup",
    [tsxCli, "ai-service/src/index.ts"],
    {
      NODE_ENV: "development",
      AI_SERVICE_HOST: "127.0.0.1",
      AI_SERVICE_PORT: String(aiPort),
      NODE_BACKEND_BASE_URL: "",
      AI_SERVICE_SHARED_SECRET: sharedSecret,
    },
    /Missing.*NODE_BACKEND_BASE_URL/
  );

  runExpectFailure(
    "AI Service rejects trailing /api suffix in NODE_BACKEND_BASE_URL",
    [tsxCli, "ai-service/src/index.ts"],
    {
      NODE_ENV: "development",
      AI_SERVICE_HOST: "127.0.0.1",
      AI_SERVICE_PORT: String(aiPort),
      NODE_BACKEND_BASE_URL: `http://127.0.0.1:${backendPort}/api`,
      AI_SERVICE_SHARED_SECRET: sharedSecret,
    },
    /without a trailing \/api suffix/
  );

  runExpectFailure(
    "Backend validateEnvironment rejects missing BACKEND_PORT and PORT",
    [
      "--input-type=module",
      "-e",
      "import { validateEnvironment } from './backend/src/configs/validateEnv.js'; validateEnvironment();",
    ],
    {
      NODE_ENV: "test",
      APP_ENV: "ci",
      BACKEND_HOST: "127.0.0.1",
      BACKEND_PORT: "",
      PORT: "",
      REDIS_HOST: "127.0.0.1",
      REDIS_PORT: "16379",
      ACCESS_TOKEN_SECRET: dummyTokenSecret,
      REFRESH_TOKEN_SECRET: dummyTokenSecret,
    },
    /Missing required backend port/
  );

  runExpectFailure(
    "Backend QA Isolation Guard rejects QA flags in production",
    [
      "--input-type=module",
      "-e",
      "import { validateEnvironment } from './backend/src/configs/validateEnv.js'; validateEnvironment();",
    ],
    {
      NODE_ENV: "production",
      APP_ENV: "qa",
      BACKEND_HOST: "127.0.0.1",
      BACKEND_PORT: String(backendPort),
      PORT: String(backendPort),
      REDIS_HOST: "127.0.0.1",
      REDIS_PORT: "16379",
      MONGO_CONNECTIONSTRING: `mongodb://127.0.0.1:${backendPort + 1}/atelier_verite_prod`,
      ACCESS_TOKEN_SECRET: dummyTokenSecret,
      REFRESH_TOKEN_SECRET: dummyTokenSecret,
    },
    /QA mode flags are forbidden/
  );

  // 2. Backend ESM bootstrap + app graph check from repo root (wrong-CWD regression test)
  const backendEsmCheck = spawnSync(
    process.execPath,
    [
      "--input-type=module",
      "-e",
      [
        "import './backend/src/configs/env.bootstrap.js';",
        "import { validateEnvironment } from './backend/src/configs/validateEnv.js';",
        "import './backend/src/app.js';",
        "validateEnvironment();",
        "console.log('BACKEND_ESM_BOOT_OK');",
      ].join(" "),
    ],
    {
      cwd: repoRoot,
      env: buildCleanChildEnv({
        NODE_ENV: "test",
        APP_ENV: "ci",
        BACKEND_HOST: "127.0.0.1",
        BACKEND_PORT: String(backendPort),
        PORT: String(backendPort),
        FRONTEND_HOST: "127.0.0.1",
        FRONTEND_PORT: String(frontendPort),
        FRONTEND_URL: `http://127.0.0.1:${frontendPort}`,
        CORS_ORIGINS: `http://127.0.0.1:${frontendPort}`,
        REDIS_HOST: "127.0.0.1",
        REDIS_PORT: "16379",
        MONGO_CONNECTIONSTRING: `mongodb://127.0.0.1:${backendPort + 1}/atelier_verite_smoke`,
        ACCESS_TOKEN_SECRET: dummyTokenSecret,
        REFRESH_TOKEN_SECRET: dummyTokenSecret,
        ACTION_SECRET: dummyTokenSecret,
        OTP_SECRET: dummyTokenSecret,
      }),
      encoding: "utf8",
      timeout: 20000,
    }
  );
  assert.equal(
    backendEsmCheck.status,
    0,
    `Backend ESM graph boot failed:\n${backendEsmCheck.stdout}\n${backendEsmCheck.stderr}`
  );
  assert.match(backendEsmCheck.stdout, /BACKEND_ESM_BOOT_OK/);
  console.log("PASS [esm]: Backend ESM bootstrap & app module graph loaded cleanly from repo root");

  // 3. Live AI Service + Vite Dev Server startup smoke (and optional live Backend when SMOKE_WITH_BACKEND=true)
  const children = [];
  try {
    const withLiveBackend = process.env.SMOKE_WITH_BACKEND === "true";
    const backendPublicUrl = `http://127.0.0.1:${backendPort}`;

    if (withLiveBackend) {
      const backendProc = startService("backend", ["backend/src/server.js"], {
        NODE_ENV: "development",
        APP_ENV: "ci",
        BACKEND_HOST: "127.0.0.1",
        BACKEND_PORT: String(backendPort),
        PORT: String(backendPort),
        BACKEND_URL: backendPublicUrl,
        BASE_URL: backendPublicUrl,
        FRONTEND_HOST: "127.0.0.1",
        FRONTEND_PORT: String(frontendPort),
        FRONTEND_URL: `http://127.0.0.1:${frontendPort}`,
        CLIENT_URL: `http://127.0.0.1:${frontendPort}`,
        CORS_ORIGINS: `http://127.0.0.1:${frontendPort}`,
        MONGO_HOST: process.env.MONGO_HOST || "127.0.0.1",
        MONGO_PORT: process.env.MONGO_PORT,
        MONGO_DATABASE: process.env.MONGO_DATABASE,
        MONGO_CONNECTIONSTRING: process.env.MONGO_CONNECTIONSTRING,
        REDIS_HOST: process.env.REDIS_HOST || "127.0.0.1",
        REDIS_PORT: process.env.REDIS_PORT,
        REDIS_URL: process.env.REDIS_URL,
        SPRING_AI_SERVICE_URL: `http://127.0.0.1:${aiPort}`,
        AI_SERVICE_SHARED_SECRET: sharedSecret,
        ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET || dummyTokenSecret,
        REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET || dummyTokenSecret,
        ACTION_SECRET: process.env.ACTION_SECRET || dummyTokenSecret,
        OTP_SECRET: process.env.OTP_SECRET || dummyTokenSecret,
      });
      children.push(backendProc.child);
      await waitForHttpOk(`${backendPublicUrl}/api/health`, 30000, "Backend /api/health", backendProc);
      console.log(`PASS [live]: Backend started on ${backendPublicUrl}`);
    }

    const aiProc = startService("ai-service", [tsxCli, "ai-service/src/index.ts"], {
      NODE_ENV: "development",
      AI_SERVICE_HOST: "127.0.0.1",
      AI_SERVICE_PORT: String(aiPort),
      PORT: String(aiPort),
      NODE_BACKEND_BASE_URL: backendPublicUrl,
      AI_SERVICE_SHARED_SECRET: sharedSecret,
    });
    children.push(aiProc.child);

    const aiHealthRes = await waitForHttpOk(
      `http://127.0.0.1:${aiPort}/health`,
      20000,
      "AI Service /health",
      aiProc
    );
    const aiHealthBody = await aiHealthRes.json();
    assert.equal(aiHealthBody.status, "UP", `Unexpected AI health status: ${JSON.stringify(aiHealthBody)}`);
    await waitForHttpOk(
      `http://127.0.0.1:${aiPort}/health/readiness`,
      10000,
      "AI Service /health/readiness",
      aiProc
    );
    console.log(`PASS [live]: AI Service started cleanly on http://127.0.0.1:${aiPort}`);

    const viteProc = startService(
      "frontend",
      [viteCli, "--host", "127.0.0.1", "--port", String(frontendPort)],
      {
        NODE_ENV: "development",
        VITE_HOST: "127.0.0.1",
        VITE_PORT: String(frontendPort),
        VITE_PREVIEW_PORT: String(frontendPreviewPort),
        VITE_STRICT_PORT: "true",
        VITE_BACKEND_URL: backendPublicUrl,
        VITE_WS_URL: backendPublicUrl,
        VITE_API_URL: "/api",
        VITE_API_BASE_URL: "/api",
        BACKEND_URL: backendPublicUrl,
      },
      path.join(repoRoot, "frontend")
    );
    children.push(viteProc.child);

    await waitForHttpOk(`http://127.0.0.1:${frontendPort}/`, 25000, "Frontend Vite /", viteProc);
    console.log(`PASS [live]: Frontend Vite dev server started cleanly on http://127.0.0.1:${frontendPort}`);

    if (withLiveBackend) {
      const proxyRes = await waitForHttpOk(
        `http://127.0.0.1:${frontendPort}/api/health`,
        15000,
        "Vite -> Backend /api/health proxy",
        viteProc
      );
      assert.equal(proxyRes.status, 200);
      console.log("PASS [live]: Vite proxy -> Backend /api/health HTTP 200");
    }
  } finally {
    await Promise.all(children.map((child) => killProcessTree(child)));
  }
}

main().catch((err) => {
  console.error("FAIL [smoke-dev-startup]:", err);
  process.exit(1);
});
