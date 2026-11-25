import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { validateQaTargetConfig } from "../common/qa/qaIsolationGuard.js";
import { getMongoConnectionConfig } from "./network.config.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config();

export const connectDB = async () => {
  try {
    console.log("Attempting to connect to MongoDB...");
    if (process.env.APP_ENV === "qa") {
      validateQaTargetConfig({ verifyRuntime: false });
    }
    const { uri: connectionString } = getMongoConnectionConfig(process.env, { required: true });
    const conn = await mongoose.connect(connectionString, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });
    console.log("✅ Kết nối MongoDB thành công");

    return conn;
  } catch (error) {
    console.error("❌ Lỗi khi kết nối MongoDB:", error.message);
    const rawConn =
      process.env.LOCAL_DEV_MONGO_URI ||
      process.env.MONGO_CONNECTIONSTRING ||
      process.env.MONGO_URI ||
      "";
    const maskedConn = rawConn ? rawConn.replace(/\/\/[^@]+@/, "//***:***@").substring(0, 64) : "(unset)";
    console.error("Connection String:", maskedConn);
    process.exit(1);
  }
};
