import mongoose from 'mongoose';
import { Product } from '../modules/products/product.model.js';
import Category from '../modules/categories/category.model.js';
import { stat } from 'node:fs/promises';
import path from 'node:path';

const [runId, imageUrl] = process.argv.slice(2);
const uri = process.env.LOCAL_DEV_MONGO_URI || process.env.MONGO_CONNECTIONSTRING || '';
let target; let image; let api; let redis;
try { target = new URL(uri); image = new URL(imageUrl); api = new URL(process.env.QA_API_URL || ''); redis = process.env.REDIS_URL ? new URL(process.env.REDIS_URL) : { hostname: process.env.REDIS_HOST, port: process.env.REDIS_PORT }; } catch { throw new Error('QA fixture refused invalid target.'); }
if (process.env.APP_ENV !== 'qa' || process.env.QA_E2E_ENABLED !== 'true' || !process.env.QA_SEED_PASSWORD || !['127.0.0.1', 'localhost'].includes(target.hostname) || target.port !== '27018' || target.pathname !== '/atelier_verite_qa' || api.protocol !== 'http:' || api.username || api.password || api.search || api.hash || !['127.0.0.1', 'localhost'].includes(api.hostname) || api.port !== '5002' || api.pathname !== '/api' || !['127.0.0.1', 'localhost'].includes(redis.hostname) || redis.port !== '6381' || !/^\d{13}$/.test(runId) || image.protocol !== 'http:' || image.username || image.password || !['127.0.0.1', 'localhost'].includes(image.hostname) || image.port !== '5002' || !/^\/uploads\/ai_references\/ref_[a-zA-Z0-9_.-]+$/.test(image.pathname) || image.pathname.includes('..') || image.search || image.hash) throw new Error('QA fixture refused unsafe target.');
const login = await fetch(`${api.origin}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'qa.superadmin@atelier.local', passWord: process.env.QA_SEED_PASSWORD }), signal: AbortSignal.timeout(10000) });
if (!login.ok) throw new Error('QA fixture authentication failed.');
const token = (await login.json()).data.accessToken;
const verification = await fetch(`${api.origin}/api/admin/ai/qa-context`, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(10000) });
if (!verification.ok) throw new Error('QA fixture runtime verification failed.');
const context = (await verification.json()).data;
if (context?.environment !== 'qa' || context.database !== 'atelier_verite_qa' || !['127.0.0.1', 'localhost'].includes(context.databaseHost) || context.databasePort !== 27018 || !context.connected || !context.redisQa) throw new Error('QA fixture refused backend isolation state.');
const file = path.join(process.cwd(), 'uploads', 'ai_references', path.basename(image.pathname));
if (!(await stat(file)).isFile()) throw new Error('QA fixture image is missing.');
await mongoose.connect(uri);
try {
  if (mongoose.connection.name !== 'atelier_verite_qa' || mongoose.connection.port !== 27018 || !['127.0.0.1', 'localhost'].includes(mongoose.connection.host)) throw new Error('QA database verification failed.');
  const category = await Category.findOne({ slug: 'qa-tailoring' }).lean();
  if (!category) throw new Error('QA category is missing.');
  const slug = `qa-product-image-${runId}`;
  const product = await Product.findOneAndUpdate({ slug }, { $setOnInsert: { name: `QA Product Image ${runId}`, slug, category_id: category._id, displayProduct: [imageUrl], old_price: 120000, new_price: 100000, is_active: true } }, { upsert: true, new: true, setDefaultsOnInsert: true }).lean();
  console.log(JSON.stringify({ name: product.name, id: String(product._id) }));
} finally { await mongoose.disconnect(); }
