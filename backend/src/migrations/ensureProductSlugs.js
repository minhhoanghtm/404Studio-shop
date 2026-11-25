import { verifyQaSuiteTarget } from "../common/qa/qaIsolationGuard.js";
import mongoose from "mongoose";
import Product from "../modules/products/product.model.js";
import { slugifyProductName } from "../modules/products/productAdminForm.service.js";

await verifyQaSuiteTarget();

const connect = async () => {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is required");
  await mongoose.connect(process.env.MONGO_URI);
};

const uniqueSlug = async (name, used) => {
  const base = slugifyProductName(name);
  let suffix = 1;
  while (used.has(suffix === 1 ? base : `${base.slice(0, 80 - String(suffix).length - 1)}-${suffix}`)) suffix += 1;
  const slug = suffix === 1 ? base : `${base.slice(0, 80 - String(suffix).length - 1)}-${suffix}`;
  used.add(slug);
  return slug;
};

const run = async () => {
  await connect();
  const products = await Product.find().sort({ createdAt: 1, _id: 1 });
  const used = new Set();
  let changed = 0;
  for (const product of products) {
    const slug = String(product.slug || "").trim();
    if (slug && !used.has(slug)) {
      used.add(slug);
      continue;
    }
    product.slug = await uniqueSlug(product.name, used);
    await product.save();
    changed += 1;
  }
  await Product.collection.createIndex({ slug: 1 }, { unique: true, name: "slug_1" });
  console.log(`Product slug migration complete: ${changed} record(s) updated.`);
  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exitCode = 1;
});
