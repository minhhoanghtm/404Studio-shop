import mongoose from 'mongoose';
import { Product } from '../modules/products/product.model.js';
import Category from '../modules/categories/category.model.js';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { verifyQaSuiteTarget, assertConnectedQaDatabase } from '../common/qa/qaIsolationGuard.js';
import { isLoopbackHost } from '../configs/network.config.js';

const [runId, imageUrl] = process.argv.slice(2);
const uri = await verifyQaSuiteTarget();
const api = new URL(process.env.QA_API_URL);
let image;
try { image = new URL(imageUrl); } catch { throw new Error('QA fixture refused invalid image URL.'); }
if (!/^\d{13}$/.test(runId) || image.protocol !== 'http:' || image.username || image.password || !isLoopbackHost(image.hostname) || image.port !== api.port || !/^\/uploads\/ai_references\/ref_[a-zA-Z0-9_.-]+$/.test(image.pathname) || image.pathname.includes('..') || image.search || image.hash) {
  throw new Error('QA fixture refused unsafe target.');
}
const file = path.join(process.cwd(), 'uploads', 'ai_references', path.basename(image.pathname));
if (!(await stat(file)).isFile()) throw new Error('QA fixture image is missing.');
await mongoose.connect(uri);
try {
  assertConnectedQaDatabase(mongoose);
  const category = await Category.findOne({ slug: 'qa-tailoring' }).lean();
  if (!category) throw new Error('QA category is missing.');
  const slug = `qa-product-image-${runId}`;
  const product = await Product.findOneAndUpdate({ slug }, { $setOnInsert: { name: `QA Product Image ${runId}`, slug, category_id: category._id, displayProduct: [imageUrl], old_price: 120000, new_price: 100000, is_active: true } }, { upsert: true, new: true, setDefaultsOnInsert: true }).lean();
  console.log(JSON.stringify({ name: product.name, id: String(product._id) }));
} finally { await mongoose.disconnect(); }
