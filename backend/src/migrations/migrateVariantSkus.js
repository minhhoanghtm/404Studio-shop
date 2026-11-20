import "dotenv/config";
import mongoose from "mongoose";
import { Product, ProductVariant } from "../modules/products/product.model.js";
import { OrderItem } from "../modules/orders/order.model.js";
import { buildVariantSku, normalizeVariantColorKey } from "../modules/products/productAdminForm.service.js";

const dryRun = process.argv.includes("--dry-run");
const nextSku = async (base, excludeId) => {
  let number = 1;
  for (;;) {
    const sku = number === 1 ? base : `${base}-${number}`;
    const exists = await ProductVariant.exists({ sku, _id: { $ne: excludeId } });
    if (!exists) return sku;
    number += 1;
  }
};

const run = async () => {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is required");
  await mongoose.connect(process.env.MONGO_URI);
  const variants = await ProductVariant.find().populate("product_id");
  const changes = [];
  for (const variant of variants) {
    const product = variant.product_id;
    if (!product) continue;
    const expectedBase = buildVariantSku(product, variant.color, variant.size);
    const valid = variant.sku && variant.sku.startsWith(expectedBase) && variant.sku.includes(`-${String(variant.size).toUpperCase()}`);
    if (valid) continue;
    const usedInOrder = await OrderItem.exists({ variant_id: variant._id });
    if (usedInOrder) {
      await ProductVariant.updateOne({ _id: variant._id }, { $set: { sku_migration_required: true } });
      continue;
    }
    changes.push({ id: String(variant._id), from: variant.sku || null, to: await nextSku(expectedBase, variant._id) });
  }
  if (dryRun) {
    console.table(changes);
  } else if (changes.length) {
    const backup = `product_variants_backup_${new Date().toISOString().replace(/[^0-9]/g, "").slice(0, 14)}`;
    await ProductVariant.db.collection("product_variants").aggregate([{ $match: { _id: { $in: changes.map((change) => new mongoose.Types.ObjectId(change.id)) } } }, { $out: backup }]).toArray();
    for (const change of changes) {
      await ProductVariant.updateOne({ _id: change.id }, { $set: { sku: change.to, color_key: normalizeVariantColorKey((await ProductVariant.findById(change.id)).color) } });
    }
    console.log(`Updated ${changes.length} variant SKU(s); backup collection: ${backup}`);
  }
  await mongoose.disconnect();
};

run().catch(async (error) => { console.error(error); await mongoose.disconnect(); process.exitCode = 1; });
