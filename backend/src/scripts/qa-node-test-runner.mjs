import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { verifyQaSuiteTarget } from "../common/qa/qaIsolationGuard.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "../..");

await verifyQaSuiteTarget();

function collectNodeTests(dir, results = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectNodeTests(full, results);
    } else if (entry.isFile() && entry.name.endsWith(".node.test.mjs")) {
      results.push(path.relative(backendRoot, full));
    }
  }
  return results;
}

const allTests = collectNodeTests(path.join(backendRoot, "src")).sort();
if (allTests.length === 0) {
  throw new Error("No QA node test files found.");
}

const result = spawnSync(
  process.execPath,
  ["--test", "--test-concurrency=1", "--test-force-exit", ...allTests],
  {
    cwd: backendRoot,
    stdio: "inherit",
    env: process.env,
  }
);

process.exit(result.status ?? 1);
