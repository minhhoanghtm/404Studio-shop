import { describe, expect, test } from "@jest/globals";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const dirname = path.dirname(fileURLToPath(import.meta.url));
const agentSource = fs.readFileSync(path.resolve(dirname, "../services/adminAiAgent.service.js"), "utf8");
const activeOrchestrationSource = agentSource.slice(agentSource.indexOf("async processAdminChat("));

describe("Admin AI live-orchestration guard", () => {
  test("does not retain the legacy keyword dispatcher or canned Black Friday response", () => {
    expect(agentSource).not.toContain("processAdminChatLegacy");
    expect(agentSource).not.toContain("dispatchToolsByIntent");
    expect(agentSource).not.toContain('title: isBlackFriday ? "BLACK FRIDAY SALE"');
    expect(activeOrchestrationSource).not.toContain("scan_proactive_insights");
  });
});
