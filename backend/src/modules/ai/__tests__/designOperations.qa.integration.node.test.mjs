import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import request from 'supertest';
import sharp from 'sharp';

test('authenticated QA operations are atomic and enforce asset policy without a live provider', async () => {
  let api; let uri; let redis;
  try { api = new URL(process.env.QA_API_URL || ''); uri = new URL(process.env.LOCAL_DEV_MONGO_URI || process.env.MONGO_CONNECTIONSTRING || ''); redis = process.env.REDIS_URL ? new URL(process.env.REDIS_URL) : { hostname: process.env.REDIS_HOST || '', port: process.env.REDIS_PORT || '' }; } catch { throw new Error('QA integration guard refused missing or invalid configuration.'); }
  if (process.env.APP_ENV !== 'qa' || process.env.QA_E2E_ENABLED !== 'true' || api.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(api.hostname) || api.port !== '5002' || api.pathname !== '/api' || !['127.0.0.1', 'localhost'].includes(uri.hostname) || uri.port !== '27018' || uri.pathname !== '/atelier_verite_qa' || !['127.0.0.1', 'localhost'].includes(redis.hostname) || redis.port !== '6381' || !process.env.QA_SEED_PASSWORD) throw new Error('QA integration guard refused target.');
  const login = await fetch(`${api.origin}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'qa.superadmin@atelier.local', passWord: process.env.QA_SEED_PASSWORD }) });
  if (!login.ok) throw new Error('QA authentication failed.');
  const token = (await login.json()).data.accessToken;
  const context = await fetch(`${api.origin}/api/admin/ai/qa-context`, { headers: { Authorization: `Bearer ${token}` } });
  const qa = (await context.json()).data;
  if (!context.ok || qa?.environment !== 'qa' || qa.database !== 'atelier_verite_qa' || qa.databasePort !== 27018 || !qa.redisQa) throw new Error('QA runtime verification failed.');
  const [{ default: app }, { default: aiRouter }, { default: AdminDesignProject }, { ProductVariant }, { default: Banner }, { closeRedisConnection }] = await Promise.all([
    import('../../../app.js'), import('../services/aiRouter.service.js'), import('../models/adminDesignProject.model.js'), import('../../products/product.model.js'), import('../../banners/banner.model.js'), import('../../../configs/redis.js'),
  ]);
  await mongoose.connect(uri.toString());
  if (mongoose.connection.name !== 'atelier_verite_qa' || mongoose.connection.port !== 27018) throw new Error('QA database verification failed.');
  const layer = (id, locked = false) => ({ id, type: 'text', name: id, x: 20, y: 20, width: 200, height: 80, rotation: 0, opacity: 1, zIndex: 1, visible: true, locked, content: 'Original', styles: {} });
  const created = await fetch(`${api.origin}/api/admin/ai/designs`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ name: `QA Deterministic Operations ${Date.now()}`, preset: 'instagram_portrait', width: 1080, height: 1350, background: { type: 'color', value: '#ffffff' }, layers: [layer('open'), layer('locked', true)] }) });
  if (!created.ok) throw new Error(`QA design creation failed (${created.status}).`);
  const designId = (await created.json()).data._id;
  const variant = await ProductVariant.findOne({ sku: 'QA-SILK-BLAZER-IVORY-S' }).lean();
  const banner = await Banner.findOne({ title: 'QA Winter Asset Banner' }).lean();
  if (!variant?.image_url || !banner?.imageUrl) throw new Error('QA catalog fixtures missing.');
  const form = new FormData();
  const validPng = await sharp({ create: { width: 8, height: 8, channels: 3, background: '#dd2200' } }).png().toBuffer();
  form.append('image', new Blob([validPng], { type: 'image/png' }), 'qa-operation.png');
  const upload = await fetch(`${api.origin}/api/admin/ai/images/upload`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form });
  if (!upload.ok) throw new Error(`QA upload failed (${upload.status}).`);
  const uploadUrl = (await upload.json()).data.url;
  const originalPublicBase = process.env.PUBLIC_BASE_URL;
  process.env.PUBLIC_BASE_URL = api.origin;
  let plan = [];
  const provider = mock.method(aiRouter, 'executeChatWithFallback', async () => ({ message: JSON.stringify({ operations: plan }) }));
  const invoke = () => request(app).post('/api/admin/ai/designs/operations').set('Authorization', `Bearer ${token}`).send({ designId, request: 'QA deterministic edit' });
  try {
    plan = [{ operation: 'ADD_LAYER', layer: { type: 'image', content: variant.image_url, name: 'Product' } }];
    let response = await invoke(); assert.equal(response.status, 200); const imageId = response.body.data.design.layers.find((item) => item.name === 'Product').id;
    plan = [{ operation: 'UPDATE_LAYER', layerId: imageId, changes: { content: banner.imageUrl, rotation: 20, opacity: 0.5, styles: { cropZoom: 1.5, cropX: 25, cropY: 75 } } }, { operation: 'UPDATE_LAYER', layerId: 'open', changes: { content: 'Xin chào' } }];
    response = await invoke(); assert.equal(response.status, 200); assert.equal(response.body.data.design.layers.find((item) => item.id === imageId).content, banner.imageUrl); assert.equal(response.body.data.design.layers.find((item) => item.id === imageId).styles.cropZoom, 1.5);
    plan = [{ operation: 'UPDATE_LAYER', layerId: imageId, changes: { content: uploadUrl } }, { operation: 'CHANGE_BACKGROUND', background: { type: 'color', value: '#112233' } }];
    response = await invoke(); assert.equal(response.status, 200); assert.equal(response.body.data.design.layers.find((item) => item.id === imageId).content, uploadUrl); assert.equal(response.body.data.design.background.value, '#112233');
    plan = [{ operation: 'ADD_LAYER', layer: { type: 'text', name: 'QA heading', content: 'Tiếng Việt', x: 44, y: 55, width: 300, height: 90, styles: { fontFamily: 'Arial', fontSize: 36, color: '#123456' } } }, { operation: 'CHANGE_BACKGROUND', background: { type: 'image', value: uploadUrl } }];
    response = await invoke(); assert.equal(response.status, 200);
    const heading = response.body.data.design.layers.find((item) => item.name === 'QA heading');
    assert.equal(heading.content, 'Tiếng Việt'); assert.equal(heading.styles.color, '#123456'); assert.equal(heading.x, 44); assert.equal(response.body.data.design.background.value, uploadUrl);
    plan = [{ operation: 'DUPLICATE_LAYER', layerId: imageId }];
    response = await invoke(); assert.equal(response.status, 200);
    const duplicate = response.body.data.design.layers.find((item) => item.name === 'Product (bản sao)');
    assert.ok(duplicate?.id); assert.notEqual(duplicate.id, imageId); assert.equal(duplicate.content, uploadUrl);
    plan = [{ operation: 'REORDER_LAYER', layerId: duplicate.id, toIndex: 0 }];
    response = await invoke(); assert.equal(response.status, 200); assert.equal(response.body.data.design.layers[0].id, duplicate.id);
    plan = [{ operation: 'REMOVE_LAYER', layerId: duplicate.id }];
    response = await invoke(); assert.equal(response.status, 200); assert.equal(response.body.data.design.layers.some((item) => item.id === duplicate.id), false);
    const before = await AdminDesignProject.findById(designId).lean();
    plan = [{ operation: 'UPDATE_LAYER', layerId: imageId, changes: { content: 'https://untrusted.invalid/image.png' } }];
    response = await invoke(); assert.equal(response.status, 400);
    plan = [{ operation: 'CHANGE_BACKGROUND', background: { type: 'image', value: 'https://untrusted.invalid/background.png' } }];
    response = await invoke(); assert.equal(response.status, 400);
    plan = [{ operation: 'UPDATE_LAYER', layerId: 'open', changes: { content: '<script>alert(1)</script>' } }];
    response = await invoke(); assert.equal(response.status, 400);
    plan = [{ operation: 'UPDATE_LAYER', layerId: imageId, changes: { styles: { cropZoom: 8 } } }];
    response = await invoke(); assert.equal(response.status, 422);
    plan = [{ operation: 'UPDATE_LAYER', layerId: imageId, changes: { width: -10 } }];
    response = await invoke(); assert.equal(response.status, 422);
    plan = [{ operation: 'DELETE_ALL', layerId: imageId }];
    response = await invoke(); assert.equal(response.status, 422);
    plan = [{ operation: 'UPDATE_LAYER', layerId: 'open', changes: { content: 'should not persist' } }, { operation: 'REORDER_LAYER', layerId: 'locked', toIndex: 1 }];
    response = await invoke(); assert.equal(response.status, 422);
    const after = await AdminDesignProject.findById(designId).lean();
    assert.deepEqual(after.layers, before.layers); assert.equal(after.versionHistory.length, before.versionHistory.length);
  } finally { provider.mock.restore(); if (originalPublicBase === undefined) delete process.env.PUBLIC_BASE_URL; else process.env.PUBLIC_BASE_URL = originalPublicBase; await mongoose.disconnect(); await closeRedisConnection(); }
});
