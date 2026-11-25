import { test } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

test('order item API prevents anonymous writes and cross-customer reads', async () => {
  let api; let uri; let redis;
  try { api = new URL(process.env.QA_API_URL || ''); uri = new URL(process.env.LOCAL_DEV_MONGO_URI || process.env.MONGO_CONNECTIONSTRING || ''); redis = process.env.REDIS_URL ? new URL(process.env.REDIS_URL) : { hostname: process.env.REDIS_HOST || '', port: process.env.REDIS_PORT || '' }; } catch { throw new Error('QA guard refused configuration.'); }
  if (process.env.APP_ENV !== 'qa' || process.env.QA_E2E_ENABLED !== 'true' || api.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(api.hostname) || api.port !== '5002' || api.pathname !== '/api' || !['127.0.0.1', 'localhost'].includes(uri.hostname) || uri.port !== '27018' || uri.pathname !== '/atelier_verite_qa' || !['127.0.0.1', 'localhost'].includes(redis.hostname) || redis.port !== '6381' || !process.env.QA_SEED_PASSWORD) throw new Error('QA guard refused target.');
  const login = async (email) => { const res = await fetch(`${api.origin}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, passWord: process.env.QA_SEED_PASSWORD }) }); if (!res.ok) throw new Error('QA login failed.'); return (await res.json()).data.accessToken; };
  const admin = await login('qa.superadmin@atelier.local');
  const contextResponse = await fetch(`${api.origin}/api/admin/ai/qa-context`, { headers: { Authorization: `Bearer ${admin}` } });
  const context = (await contextResponse.json()).data;
  if (!contextResponse.ok || context?.environment !== 'qa' || context.database !== 'atelier_verite_qa' || context.databasePort !== 27018 || !context.redisQa) throw new Error('QA runtime verification failed.');
  const customerA = await login('qa.customer.a@atelier.local'); const customerB = await login('qa.customer.b@atelier.local');
  const userB = jwt.verify(customerB, process.env.ACCESS_TOKEN_SECRET).userId;
  const [{ Order, OrderItem }, { Product }] = await Promise.all([import('./order.model.js'), import('../products/product.model.js')]);
  await mongoose.connect(uri.toString());
  let order; let item;
  try {
    if (mongoose.connection.name !== 'atelier_verite_qa' || mongoose.connection.port !== 27018) throw new Error('QA database verification failed.');
    const product = await Product.findOne({ slug: /^qa-product-image-/ }).lean();
    if (!product) throw new Error('QA catalog fixture is required.');
    order = await Order.create({ user_id: userB, total_price: 100000, status: 'pending', payment_status: 'pending', shipping_address: { full_name: 'QA fixture', phone: '0900000000', city: 'QA', district: 'QA', ward: 'QA', address_detail: 'QA' } });
    item = await OrderItem.create({ order_id: order._id, product_id: product._id, quantity: 1, price: 100000 });
    const call = (path, token, method = 'GET', data) => fetch(`${api.origin}/api${path}`, { method, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(data ? { 'Content-Type': 'application/json' } : {}) }, ...(data ? { body: JSON.stringify(data) } : {}) });
    assert.equal((await call(`/order_items/${order._id}`, customerA)).status, 404);
    assert.equal((await call(`/order_items/${order._id}`, customerB)).status, 200);
    assert.equal((await call(`/order_items/${order._id}`, admin)).status, 200);
    assert.equal((await call('/order_items', null, 'POST', { order_id: String(order._id), product_id: String(product._id), quantity: 1, price: 1 })).status, 401);
    assert.equal((await call(`/order_items/${item._id}`, null, 'PUT', { price: 1 })).status, 401);
    assert.equal((await call(`/order_items/${item._id}`, null, 'DELETE')).status, 401);
    assert.equal((await call(`/order_items/${item._id}`, customerA, 'PUT', { price: 1 })).status, 403);
    assert.equal((await call(`/order_items/${item._id}`, customerB, 'DELETE')).status, 403);
    assert.equal((await call(`/order/${order._id}`, customerB, 'PUT', { status: 'delivered' })).status, 403);
    assert.equal((await call(`/order/${order._id}`, customerB, 'PUT', { status: 'shipping' })).status, 403);
    assert.equal((await call(`/order/${order._id}`, customerA, 'PUT', { status: 'delivered' })).status, 403);
    const untouched = await OrderItem.findById(item._id).lean();
    assert.equal(untouched.price, 100000); assert.equal(untouched.quantity, 1);
    const untouchedOrder = await Order.findById(order._id).lean();
    assert.equal(untouchedOrder.status, 'pending'); assert.equal(untouchedOrder.payment_status, 'pending');
  } finally {
    if (item) await OrderItem.deleteOne({ _id: item._id, order_id: order._id });
    if (order) await Order.deleteOne({ _id: order._id, user_id: userB, payment_status: 'pending' });
    await mongoose.disconnect();
  }
});
