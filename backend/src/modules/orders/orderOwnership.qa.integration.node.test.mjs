import { test } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { verifyQaSuiteTarget, assertConnectedQaDatabase } from '../../common/qa/qaIsolationGuard.js';

test('order item API prevents anonymous writes and cross-customer reads', async () => {
  const mongoUri = await verifyQaSuiteTarget();
  const api = new URL(process.env.QA_API_URL);
  const login = async (email) => { const res = await fetch(`${api.origin}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, passWord: process.env.QA_SEED_PASSWORD }) }); if (!res.ok) throw new Error('QA login failed.'); return (await res.json()).data.accessToken; };
  const admin = await login('qa.superadmin@atelier.local');
  const customerA = await login('qa.customer.a@atelier.local'); const customerB = await login('qa.customer.b@atelier.local');
  const userB = jwt.verify(customerB, process.env.ACCESS_TOKEN_SECRET).userId;
  const [{ Order, OrderItem }, { Product }] = await Promise.all([import('./order.model.js'), import('../products/product.model.js')]);
  await mongoose.connect(mongoUri);
  let order; let item;
  try {
    assertConnectedQaDatabase(mongoose);
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
