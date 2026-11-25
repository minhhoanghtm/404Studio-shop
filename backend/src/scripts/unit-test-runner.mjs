import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "../..");

const result = spawnSync(
  process.execPath,
  [
    "--experimental-vm-modules",
    "./node_modules/jest/bin/jest.js",
    "--runInBand",
    "--testPathIgnorePatterns=(adminAi|multiProviderAi|productExcel|productAdminForm\\.service)\\.test\\.js",
  ],
  {
    cwd: backendRoot,
    stdio: "inherit",
    env: process.env,
  }
);

process.exit(result.status ?? 1);
