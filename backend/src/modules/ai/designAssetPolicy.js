import path from 'node:path';
import { lstat, realpath } from 'node:fs/promises';
import { Product, ProductVariant } from '../products/product.model.js';
import Banner from '../banners/banner.model.js';
import AdminImageJob from './models/adminImageJob.model.js';
import AdminDesignProject from './models/adminDesignProject.model.js';

// Check references against application data or the existing shared upload store.
// No URL is fetched by the server.
export async function validateDesignAssets(payload, { adminId, localOrigin } = {}) {
  const urls = new Set();
  if (payload.background?.type === 'image' && payload.background.value) urls.add(payload.background.value);
  for (const layer of payload.layers || []) if (['image', 'product', 'logo', 'background'].includes(layer.type) && layer.content) urls.add(layer.content);
  const sources = [...urls].filter((url) => !/^data:image\/(png|jpeg|webp|gif);base64,/i.test(url));
  if (!sources.length) return;
  const [products, variants, banners, jobs, designs] = await Promise.all([
    Product.find({ displayProduct: { $in: sources } }).select('displayProduct').lean(),
    ProductVariant.find({ image_url: { $in: sources } }).select('image_url').lean(),
    Banner.find({ isDeleted: { $ne: true }, $or: [{ imageUrl: { $in: sources } }, { mobileImageUrl: { $in: sources } }] }).select('imageUrl mobileImageUrl').lean(),
    AdminImageJob.find({ adminId, status: 'COMPLETED', $or: [{ resultImageUrl: { $in: sources } }, { 'variants.url': { $in: sources } }] }).select('resultImageUrl variants').lean(),
    AdminDesignProject.find({ adminId, thumbnailUrl: { $in: sources } }).select('thumbnailUrl').lean(),
  ]);
  const known = new Set([...products.flatMap((p) => p.displayProduct || []), ...variants.map((v) => v.image_url), ...banners.flatMap((b) => [b.imageUrl, b.mobileImageUrl]), ...jobs.flatMap((j) => [j.resultImageUrl, ...(j.variants || []).map((v) => v.url)]), ...designs.map((d) => d.thumbnailUrl)]);
  const origins = new Set([process.env.PUBLIC_BASE_URL, localOrigin, ...(process.env.DESIGN_ASSET_ORIGINS || '').split(',')].filter(Boolean).map((origin) => { try { return new URL(origin.trim()).origin; } catch { return ''; } }));
  for (const source of sources) {
    let url; try { url = new URL(source); } catch { url = null; }
    if (!url || !['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw invalidAsset();
    if (known.has(source)) continue;
    const match = /^\/uploads\/(ai_references|designs)\/([a-zA-Z0-9_.-]+)$/.exec(url.pathname);
    if (match && !match[2].includes('..') && !url.search && !url.hash && origins.has(url.origin)) {
      try {
        const directory = await realpath(path.resolve(process.cwd(), 'uploads', match[1]));
        const file = path.join(directory, match[2]);
        const info = await lstat(file);
        if (info.isFile() && !info.isSymbolicLink() && path.dirname(await realpath(file)) === directory) continue;
      } catch { /* missing or inaccessible asset */ }
    }
    throw invalidAsset();
  }
}

function invalidAsset() {
  const error = new Error('Nguồn asset không tồn tại hoặc không được phép.');
  error.statusCode = 400; error.status = 'fail'; error.isOperational = true;
  return error;
}
