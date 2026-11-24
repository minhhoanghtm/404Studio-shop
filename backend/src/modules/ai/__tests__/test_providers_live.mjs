import dotenv from "dotenv";
dotenv.config();
import mongoose from "mongoose";
import providerRegistry from "../providers/ProviderRegistry.js";
import usageCostTracker from "../services/usageCostTracker.service.js";
import aiRouter from "../services/aiRouter.service.js";

async function testRegistry() {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/atelier_verite");
  console.log("--- 1. Testing Provider Registry ---");
  const statuses = await providerRegistry.getProvidersStatus();
  console.log("Registered providers count:", statuses.length);
  statuses.forEach((s) => {
    console.log(`- [${s.id.toUpperCase()}] ${s.name} -> Status: ${s.status} (Capabilities: ${s.capabilities.length})`);
  });

  console.log("\n--- 2. Testing Provider Health / Ping ---");
  const pingOpenai = await providerRegistry.testProvider("openai");
  console.log("OpenAI Ping:", pingOpenai.success, pingOpenai.status, pingOpenai.latencyMs + "ms");

  const pingGemini = await providerRegistry.testProvider("gemini");
  console.log("Gemini Ping:", pingGemini.success, pingGemini.status, pingGemini.latencyMs + "ms");

  const pingClaude = await providerRegistry.testProvider("claude");
  console.log("Claude Ping:", pingClaude.success, pingClaude.status, pingClaude.latencyMs + "ms");

  const pingDeepSeek = await providerRegistry.testProvider("deepseek");
  console.log("DeepSeek Ping:", pingDeepSeek.success, pingDeepSeek.status, pingDeepSeek.latencyMs + "ms");

  console.log("\n--- 3. Testing Usage & Cost Tracker ---");
  const summary = await usageCostTracker.getUsageSummary();
  console.log("Usage spend:", summary.monthSpendUsd, "$ | Monthly budget:", summary.monthlyBudgetUsd, "$");

  await mongoose.disconnect();
}

testRegistry().catch((err) => {
  console.error("Test error:", err);
  process.exit(1);
});
