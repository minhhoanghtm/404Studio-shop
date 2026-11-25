import "dotenv/config";
import { getBackendListenConfig } from "../configs/network.config.js";

const { publicUrl } = getBackendListenConfig(process.env);
const healthUrl = `${publicUrl}/api/health`;
const deadline = Date.now() + 60_000;

while (Date.now() < deadline) {
  try {
    const res = await fetch(healthUrl, { signal: AbortSignal.timeout(2000) });
    if (res.ok) {
      console.log(`Health check ready: ${healthUrl}`);
      process.exit(0);
    }
  } catch {
    // Keep polling until deadline
  }
  await new Promise((r) => setTimeout(r, 1000));
}

console.error(`Timed out waiting for ${healthUrl}`);
process.exit(1);
