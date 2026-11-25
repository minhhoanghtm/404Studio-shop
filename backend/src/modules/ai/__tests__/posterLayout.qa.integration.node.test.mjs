import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { verifyQaSuiteTarget, assertConnectedQaDatabase } from './qaSuiteGuard.mjs';

test('QA fallback poster is an editable layout and never invents a product', async () => {
  const uri = await verifyQaSuiteTarget();
  const [{ default: service }, { default: router }, { default: Design }, { Product }, { default: User }, { validateDesignPayload }, { closeRedisConnection }] = await Promise.all([
    import('../services/adminImageGeneration.service.js'), import('../services/aiRouter.service.js'), import('../models/adminDesignProject.model.js'), import('../../products/product.model.js'), import('../../users/user.model.js'), import('../designPayload.validator.js'), import('../../../configs/redis.js'),
  ]);
  await mongoose.connect(uri);
  assertConnectedQaDatabase(mongoose);
  const ids = [];
  let emptyProviderResponse = false;
  const provider = mock.method(router, 'executeImageGenerationWithFallback', async () => { if (emptyProviderResponse) return { images: [] }; throw new Error('QA provider unavailable'); });
  try {
    const admin = await User.findOne({ email: 'qa.superadmin@atelier.local' }).lean();
    const product = await Product.findOne({ slug: /^qa-product-image-/, 'displayProduct.0': { $exists: true } }).lean();
    assert.ok(admin && product);
    const layout = await service.generatePosterPipeline({ title: 'Bộ sưu tập QA', authContext: { userId: admin._id } });
    ids.push(layout.designId);
    assert.equal(layout.generationType, 'AI_ASSISTED_LAYOUT');
    assert.equal(layout.product, null); assert.equal(layout.background.type, 'color');
    assert.equal(layout.layers.some((layer) => layer.id === 'product-showcase'), false);
    const title = layout.layers.find((layer) => layer.id === 'text-title');
    const subtitle = layout.layers.find((layer) => layer.id === 'text-subtitle');
    assert.ok(title.y + title.height <= subtitle.y); assert.ok(title.styles.fontSize > 0);
    const stored = await Design.findById(layout.designId).lean();
    validateDesignPayload(stored);
    const withProduct = await service.generatePosterPipeline({ title: 'QA sản phẩm', productId: String(product._id), authContext: { userId: admin._id } });
    ids.push(withProduct.designId);
    assert.equal(withProduct.product.id.toString(), String(product._id));
    assert.equal(withProduct.product.image, product.displayProduct[0]);
    assert.equal(withProduct.layers.find((layer) => layer.id === 'product-showcase').content, product.displayProduct[0]);
    validateDesignPayload(await Design.findById(withProduct.designId).lean());
    emptyProviderResponse = true;
    const emptyImage = await service.generatePosterPipeline({ title: 'QA an toàn', productName: '.*', authContext: { userId: admin._id } });
    ids.push(emptyImage.designId);
    assert.equal(emptyImage.generationType, 'AI_ASSISTED_LAYOUT'); assert.equal(emptyImage.product, null);
  } finally {
    provider.mock.restore();
    if (ids.length) await Design.deleteMany({ _id: { $in: ids }, name: /^Poster — / });
    await mongoose.disconnect(); await closeRedisConnection();
  }
});
