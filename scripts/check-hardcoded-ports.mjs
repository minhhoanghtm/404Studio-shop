import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const MONITORED_PORTS = [
  "3000",
  "3001",
  "4173",
  "4179",
  "5000",
  "5002",
  "5173",
  "5174",
  "6379",
  "6381",
  "8080",
  "8081",
  "8188",
  "11434",
  "27017",
  "27018",
  "27019",
  "80",
  "443",
];

const PORT_ALT = MONITORED_PORTS.join("|");

const CONTEXTUAL_PORT_PATTERNS = [
  // URL host:port literals
  new RegExp(`https?:\\/\\/[^\\s'"\`)]+:(?:${PORT_ALT})(?=[:/?#'"\`\\s]|$)`, "g"),
  new RegExp(`mongodb:\\/\\/[^\\s'"\`)]+:(?:${PORT_ALT})(?=[/?'"\`\\s]|$)`, "g"),
  new RegExp(`rediss?:\\/\\/[^\\s'"\`)]+:(?:${PORT_ALT})(?=[/?'"\`\\s]|$)`, "g"),
  new RegExp(`(?:localhost|127\\.0\\.0\\.1|backend|mongo|redis|ai-service):(?:${PORT_ALT})(?=[/?'"\`\\s,]|$)`, "g"),
  // Docker / Compose / Nginx / CLI / ENV defaults in code or config
  new RegExp(`(?:listen|EXPOSE|proxy_pass|--port|-p)\\s+(?:\\[::\\]:)?['"]?(?:${PORT_ALT})(?:['"\\s;]|$)`, "g"),
  new RegExp(`["'](?:\\d+\\.)+\\d+:(?:${PORT_ALT}):(?:${PORT_ALT})["']`, "g"),
  new RegExp(`["'](?:${PORT_ALT}):(?:${PORT_ALT})["']`, "g"),
  new RegExp(`\\b(?:PORT|BACKEND_PORT|FRONTEND_PORT|REDIS_PORT|MONGO_PORT|AI_SERVICE_PORT|localPort)\\s*(?:[:=]|\\|\\||\\?\\?)\\s*['"]?(?:${PORT_ALT})['"]?(?![0-9])`, "g"),
  new RegExp(`\\.(?:port|databasePort)\\s*(?:===|!==|==|!=)\\s*['"]?(?:${PORT_ALT})['"]?(?![0-9])`, "g"),
  new RegExp(`port\\s*:\\s*(?:${PORT_ALT})(?![0-9])`, "g"),
];

const TARGET_DIRS_AND_FILES = [
  "backend/src",
  "backend/Dockerfile",
  "backend/Dockerfile.worker",
  "backend/package.json",
  "frontend/src",
  "frontend/e2e",
  "frontend/vite.config.ts",
  "frontend/playwright.config.ts",
  "frontend/playwright.ci.config.ts",
  "frontend/nginx.conf.template",
  "frontend/Dockerfile",
  "ai-service/src",
  "ai-service/Dockerfile",
  "compose.yaml",
  "compose.dev.yaml",
  "compose.prod.yaml",
  "compose.qa.yaml",
  "compose.qa-rs.yaml",
  ".github/workflows",
];

// Exclude archived/legacy staging diagnostic scripts and unit test negative-fixture URLs cleanly
const EXCLUDED_PATH_FRAGMENTS = [
  "node_modules",
  `${path.sep}dist${path.sep}`,
  `${path.sep}uploads${path.sep}`,
  `${path.sep}test-results${path.sep}`,
  path.normalize("backend/src/scratch"),
  // Legacy standalone staging scripts superseded by ENV-driven QA integration suites
  path.normalize("backend/src/scripts/get_staging_token.mjs"),
  path.normalize("backend/src/scripts/staging-full-stack-e2e.js"),
  path.normalize("backend/src/scripts/test_auth_refresh_resilience.mjs"),
  path.normalize("backend/src/scripts/test_playwright_ai_shopping.mjs"),
  path.normalize("backend/src/scripts/test_playwright_auth_and_chat_stability.mjs"),
  path.normalize("backend/src/scripts/verify-consent-persistence.js"),
  path.normalize("backend/src/scripts/verify-rate-limiter-security.js"),
  path.normalize("backend/src/scripts/verify-resources.js"),
  path.normalize("backend/src/scripts/verify-staging-isolated-flow.js"),
  path.normalize("backend/src/scripts/verify_ai_shopping_suite.mjs"),
  // Negative-input unit tests asserting bad/untrusted external URLs or custom ENV parsing
  path.normalize("backend/src/configs/__tests__/network.config.node.test.mjs"),
];

const TEXT_EXTENSIONS = new Set([
  ".js",
  ".mjs",
  ".cjs",
  ".ts",
  ".tsx",
  ".json",
  ".yml",
  ".yaml",
  ".template",
  ".conf",
]);

function shouldIncludeFile(absPath) {
  const rel = path.relative(repoRoot, absPath);
  for (const frag of EXCLUDED_PATH_FRAGMENTS) {
    if (rel.includes(frag)) return false;
  }
  const base = path.basename(absPath);
  if (base.startsWith("Dockerfile")) return true;
  return TEXT_EXTENSIONS.has(path.extname(base).toLowerCase());
}

function collectFiles(entryPath, results = []) {
  if (!fs.existsSync(entryPath)) return results;
  const stat = fs.statSync(entryPath);
  if (stat.isFile()) {
    if (shouldIncludeFile(entryPath)) results.push(entryPath);
    return results;
  }
  if (stat.isDirectory()) {
    for (const child of fs.readdirSync(entryPath, { withFileTypes: true })) {
      const childPath = path.join(entryPath, child.name);
      if (EXCLUDED_PATH_FRAGMENTS.some((f) => childPath.includes(f))) continue;
      collectFiles(childPath, results);
    }
  }
  return results;
}

const files = [];
for (const item of TARGET_DIRS_AND_FILES) {
  collectFiles(path.join(repoRoot, item), files);
}

const violations = [];
for (const absFile of files) {
  const content = fs.readFileSync(absFile, "utf8");
  const lines = content.split(/\r?\n/);
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("#")) return;
    for (const pattern of CONTEXTUAL_PORT_PATTERNS) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(line)) !== null) {
        // Ignore Compose variable interpolation inside brackets like ${VAR:-...} only if none exist,
        // wait: ${VAR:?msg} never contains port numbers, and ignore SVG namespace or regex assertions.
        if (/w3\.org/.test(match[0])) continue;
        violations.push({
          file: path.relative(repoRoot, absFile).replace(/\\/g, "/"),
          line: index + 1,
          snippet: match[0],
        });
      }
    }
  });
}

if (violations.length > 0) {
  console.error("❌ Hardcoded port/endpoint violations detected (ENV must be single source of truth):");
  for (const v of violations) {
    console.error(`  - ${v.file}:${v.line} -> ${v.snippet}`);
  }
  process.exit(1);
}

console.log(`✅ Hardcoded port guard passed (${files.length} files scanned, 0 violations).`);
