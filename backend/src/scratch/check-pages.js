import { verifyQaSuiteTarget } from "../common/qa/qaIsolationGuard.js";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Page from "../modules/pages/page.model.js";

await verifyQaSuiteTarget();


const run = async () => {
  try {
    const mongoUri = process.env.MONGO_CONNECTIONSTRING;
    await mongoose.connect(mongoUri);
    const pages = await Page.find({}).select("title slug type status").lean();
    console.log("Pages in DB:", JSON.stringify(pages, null, 2));
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await mongoose.disconnect();
  }
};

run();
