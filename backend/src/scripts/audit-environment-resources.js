import { verifyQaSuiteTarget } from "../common/qa/qaIsolationGuard.js";
import Redis from "ioredis";
import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { requireEnv } from "./require-env.js";
import { getRedisConnectionConfig } from "../configs/network.config.js";

await verifyQaSuiteTarget();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function audit() {
  console.log("=== RESOURCE OWNERSHIP & ISOLATION AUDIT ===\n");
  const redisCfg = getRedisConnectionConfig(process.env);
  const targetPort = redisCfg.port;
  const targetHost = redisCfg.host;

  // 1. Primary Redis inspection
  console.log(`1. Inspecting primary Redis (${targetHost}:${targetPort}):`);
  try {
    const rPrimary = new Redis({ host: targetHost, port: targetPort, connectTimeout: 3000 });
    const keysPrimary = await rPrimary.keys("*");
    console.log(`   Total keys on primary Redis: ${keysPrimary.length}`);
    const keyPrefixes = {};
    for (const k of keysPrimary) {
      const p = k.split(":")[0];
      keyPrefixes[p] = (keyPrefixes[p] || 0) + 1;
    }
    console.log("   Key prefixes on primary Redis:", keyPrefixes);
    console.log("   Sample keys on primary Redis:", keysPrimary.slice(0, 10));
    await rPrimary.quit();
  } catch (err) {
    console.log(`   Primary Redis error: ${err.message}`);
  }

  // 2. QA Redis inspection
  const qaRedisPort = Number(process.env.QA_REDIS_PORT || targetPort);
  console.log(`\n2. Inspecting QA Redis (${targetHost}:${qaRedisPort}):`);
  try {
    const rQa = new Redis({ host: targetHost, port: qaRedisPort, connectTimeout: 3000 });
    const ping = await rQa.ping();
    const keysQa = await rQa.keys("*");
    console.log(`   QA Redis ping: ${ping}`);
    console.log(`   Total keys on QA Redis: ${keysQa.length}`);
    const keyPrefixes6381 = {};
    for (const k of keysQa) {
      const p = k.split(":")[0];
      keyPrefixes6381[p] = (keyPrefixes6381[p] || 0) + 1;
    }
    console.log("   Key prefixes on QA Redis:", keyPrefixes6381);
    console.log("   Sample keys on QA Redis:", keysQa.slice(0, 10));
    await rQa.quit();
  } catch (err) {
    console.log(`   QA Redis error: ${err.message}`);
  }

  // 3. Local Dedicated Staging MongoDB 27018 (webfashion-mongo-staging)
  console.log("\n3. Inspecting MongoDB 27018 (webfashion-mongo-staging container):");
  try {
    const localUri = requireEnv("MONGO_CONNECTIONSTRING");
    const connStaging = await mongoose.createConnection(localUri, { serverSelectionTimeoutMS: 3000 }).asPromise();
    console.log(`   Connected to local staging MongoDB: ${connStaging.name}`);
    const collectionsStaging = await connStaging.db.listCollections().toArray();
    console.log(`   Collections in webfashion_staging: ${collectionsStaging.map(c => c.name).join(", ") || "(none yet)"}`);
    await connStaging.close();
  } catch (err) {
    console.log(`   MongoDB 27018 error: ${err.message}`);
  }

  // 4. MongoDB Atlas (Default .env connection)
  console.log("\n4. Inspecting MongoDB Atlas (from .env):");
  try {
    const atlasUri = process.env.MONGO_CONNECTIONSTRING;
    const connAtlas = await mongoose.createConnection(atlasUri, { serverSelectionTimeoutMS: 5000 }).asPromise();
    console.log(`   Connected to Atlas Database: '${connAtlas.name}'`);
    const collectionsAtlas = await connAtlas.db.listCollections().toArray();
    console.log(`   Total collections in '${connAtlas.name}': ${collectionsAtlas.length}`);
    console.log(`   Collection names: ${collectionsAtlas.map(c => c.name).sort().join(", ")}`);
    
    // Check if there are foreign collections
    const webfashionCollections = [
      "users", "products", "orders", "categories", "carts", "coupons", "userevents", 
      "userinterestprofiles", "experiments", "experimentexposures", "chatmessages", 
      "conversations", "banners", "lookbooks", "pages", "reviews", "vouchers", 
      "websitesettings", "vector_embeddings"
    ];
    const foreignCollections = collectionsAtlas.filter(c => !webfashionCollections.includes(c.name));
    console.log(`   Collections potentially outside standard webfashion schema: ${foreignCollections.map(c => c.name).join(", ") || "(none)"}`);
    await connAtlas.close();
  } catch (err) {
    console.log(`   MongoDB Atlas error: ${err.message}`);
  }

  console.log("\n=== AUDIT COMPLETED ===");
  process.exit(0);
}

audit();
