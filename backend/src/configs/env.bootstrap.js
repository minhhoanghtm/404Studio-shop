import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendEnvPath = path.resolve(__dirname, "../../.env");
const rootEnvPath = path.resolve(__dirname, "../../../.env");

if (process.env.NODE_ENV !== "test" && process.env.APP_ENV !== "ci") {
  // Precedence: explicit process.env > backend/.env > root .env
  if (fs.existsSync(backendEnvPath)) {
    dotenv.config({ path: backendEnvPath, quiet: true });
  }
  if (fs.existsSync(rootEnvPath)) {
    dotenv.config({ path: rootEnvPath, quiet: true });
  }
}
