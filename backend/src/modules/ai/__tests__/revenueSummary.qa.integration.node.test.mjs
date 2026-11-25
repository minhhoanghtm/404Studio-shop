import { test } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import ExcelJS from 'exceljs';

test('QA revenue aggregation reconciles final totals and discounts against isolated orders', async () => {
  let api; let uri; let redis;
  try { api = new URL(process.env.QA_API_URL || ''); uri = new URL(process.env.LOCAL_DEV_MONGO_URI || process.env.MONGO_CONNECTIONSTRING || ''); redis = process.env.REDIS_URL ? new URL(process.env.REDIS_URL) : { hostname: process.env.REDIS_HOST || '', port: process.env.REDIS_PORT || '' }; } catch { throw new Error('QA guard refused missing configuration.'); }
  if (process.env.APP_ENV !== 'qa' || process.env.QA_E2E_ENABLED !== 'true' || api.protocol !== 'http:' || !['127.0.0.1', 'localhost'].includes(api.hostname) || api.port !== '5002' || api.pathname !== '/api' || !['127.0.0.1', 'localhost'].includes(uri.hostname) || uri.port !== '27018' || uri.pathname !== '/atelier_verite_qa' || !['127.0.0.1', 'localhost'].includes(redis.hostname) || redis.port !== '6381' || !process.env.QA_SEED_PASSWORD) throw new Error('QA guard refused target.');
  const login = await fetch(`${api.origin}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'qa.superadmin@atelier.local', passWord: process.env.QA_SEED_PASSWORD }) });
  if (!login.ok) throw new Error('QA login failed.');
  const token = (await login.json()).data.accessToken;
  const response = await fetch(`${api.origin}/api/admin/ai/qa-context`, { headers: { Authorization: `Bearer ${token}` } });
  const context = (await response.json()).data;
  if (!response.ok || context?.environment !== 'qa' || context.database !== 'atelier_verite_qa' || context.databasePort !== 27018 || !context.redisQa) throw new Error('QA runtime verification failed.');
  const [{ Order, OrderItem }, { default: User }, { Product }, { getRevenueSummary, getCustomerStatistics, getTopSellingProducts, getSlowMovingProducts, parsePeriodDates }] = await Promise.all([import('../../orders/order.model.js'), import('../../users/user.model.js'), import('../../products/product.model.js'), import('../services/adminAiTools.service.js')]);
  const { getKPIs } = await import('../../orders/queries/order.query.js');
  const [{ default: Campaign }, { default: campaignService }] = await Promise.all([import('../../campaigns/campaign.model.js'), import('../../campaigns/campaign.service.js')]);
  await mongoose.connect(uri.toString());
  const ids = [];
  const intervalIds = [];
  let customerFixture; let restrictedManager; let slowProduct; let campaignFixture;
  try {
    if (mongoose.connection.name !== 'atelier_verite_qa' || mongoose.connection.port !== 27018) throw new Error('QA database verification failed.');
    customerFixture = await User.create({ fullName: 'QA analytics customer', email: `qa-analytics-${Date.now()}@atelier.invalid`, passWord: 'unused-qa-fixture', role: 'customer' });
    const expectedCustomers = await User.countDocuments({ role: { $in: ['user', 'customer'] } });
    assert.equal((await getCustomerStatistics()).totalRegisteredUsers, expectedCustomers);
    const start = new Date(Date.UTC(1980, 0, 1) + Math.floor(Math.random() * 20) * 86400000);
    const end = new Date(start.getTime() + 10000);
    const day = new Date(start.getTime() + 7 * 3600000).toISOString().slice(0, 10);
    const dayRange = parsePeriodDates('custom', day, day);
    if (await Order.exists({ createdAt: { $gte: dayRange.startDate, $lte: dayRange.endDate } })) throw new Error('Chosen QA interval is not isolated.');
    const address = { full_name: 'QA fixture', phone: '0900000000', city: 'QA', district: 'QA', ward: 'QA', address_detail: 'QA' };
    const dashboardBefore = await getKPIs();
    const sourceProduct = await Product.findOne({ slug: /^qa-product-image-/ }).lean();
    if (!sourceProduct) throw new Error('QA catalog fixture missing.');
    slowProduct = await Product.create({ name: 'QA slow analytics product', slug: `qa-slow-${Date.now()}`, category_id: sourceProduct.category_id, displayProduct: sourceProduct.displayProduct, old_price: 100000, new_price: 90000, stock: 1000000, is_active: true });
    const pendingOrder = await Order.create({ total_price: 90000, status: 'pending', payment_status: 'pending', shipping_address: address, is_guest: true, guest_email: 'qa-fixture@atelier.local' });
    ids.push(pendingOrder._id);
    await OrderItem.create({ order_id: pendingOrder._id, product_id: slowProduct._id, product_name: 'QA isolated analytics product', quantity: 5, price: 90000 });
    const slow = await getSlowMovingProducts({ daysThreshold: 30, limit: 10 });
    assert.equal(slow.products.find((product) => product.id === String(slowProduct._id))?.soldRecent, 0);
    const recognizedOrder = await Order.create({ total_price: 90000, status: 'delivered', payment_method: 'cod', payment_status: 'pending', shipping_address: address, is_guest: true, guest_email: 'qa-fixture@atelier.local' });
    ids.push(recognizedOrder._id);
    await OrderItem.create({ order_id: recognizedOrder._id, product_id: String(slowProduct._id), product_name: 'QA isolated analytics product', quantity: 1, price: 90000 });
    assert.equal((await getSlowMovingProducts({ daysThreshold: 30, limit: 10 })).products.find((product) => product.id === String(slowProduct._id))?.soldRecent, 1);
    for (const fixture of [
      { total_price: 110000, original_price: 100000, discount_amount: 20000, status: 'delivered', payment_status: 'paid' },
      { total_price: 50000, original_price: 50000, discount_amount: 0, status: 'pending', payment_status: 'pending' },
      { total_price: 900000, original_price: 900000, discount_amount: 0, status: 'cancelled', payment_status: 'paid' },
      { total_price: 70000, original_price: 70000, discount_amount: 0, status: 'delivered', payment_method: 'cod', payment_status: 'pending' },
      { total_price: 40000, original_price: 40000, discount_amount: 0, status: 'delivered', payment_method: 'vnpay', payment_status: 'pending' },
      { total_price: 60000, original_price: 60000, discount_amount: 0, status: 'delivered', payment_method: 'cod', payment_status: 'refunded' },
    ]) {
      const order = await Order.create({ ...fixture, shipping_address: address, is_guest: true, guest_email: 'qa-fixture@atelier.local', createdAt: new Date(start.getTime() + 5000) });
      ids.push(order._id);
      intervalIds.push(order._id);
    }
    const productId = new mongoose.Types.ObjectId();
    campaignFixture = await Campaign.create({ name: 'QA analytics campaign', slug: `qa-analytics-campaign-${Date.now()}`, type: 'flash_sale', status: 'draft', startAt: start, endAt: end });
    for (const [index, quantity] of [2, 50, 100, 3, 50, 200].entries()) await OrderItem.create({ order_id: intervalIds[index], product_id: index === 0 ? String(productId) : productId, product_name: 'QA isolated analytics product', campaign_id: campaignFixture._id, quantity, price: 1000 });
    const top = await getTopSellingProducts({ startDate: start.toISOString(), endDate: end.toISOString() });
    const topProduct = top.products.find((product) => product.productId === String(productId));
    assert.equal(topProduct?.totalSold, 5);
    assert.equal(topProduct?.totalRevenue, 5000);
    const campaignStats = await campaignService.getCampaignPerformance({ startDate: start, endDate: end });
    const campaign = campaignStats.campaigns.find((item) => item.id === String(campaignFixture._id));
    assert.equal(campaign?.units, 5); assert.equal(campaign?.itemRevenue, 5000); assert.equal(campaign?.orders, 2);
    const campaignDetail = await campaignService.getAdminCampaignDetail(String(campaignFixture._id));
    assert.equal(campaignDetail.stats.totalItemsSold, 5); assert.equal(campaignDetail.stats.totalRevenue, 5000); assert.equal(campaignDetail.stats.totalOrders, 2);
    const detailResponse = await fetch(`${api.origin}/api/admin/campaigns/${campaignFixture._id}`, { headers: { Authorization: `Bearer ${token}` } });
    assert.equal(detailResponse.status, 200);
    assert.equal((await detailResponse.json()).data.stats.totalItemsSold, 5);
    const dashboardAfter = await getKPIs();
    assert.equal(dashboardAfter.totalRevenue - dashboardBefore.totalRevenue, 270000);
    assert.equal(dashboardAfter.totalSoldProducts - dashboardBefore.totalSoldProducts, 6);
    const customerStart = new Date(start.getTime() + 2 * 86400000);
    const customerEnd = new Date(customerStart.getTime() + 10000);
    if (await Order.exists({ createdAt: { $gte: customerStart, $lte: customerEnd } })) throw new Error('Chosen customer interval is not isolated.');
    const admin = await User.findOne({ email: 'qa.superadmin@atelier.local' }).lean();
    for (const userId of [customerFixture._id, admin._id]) {
      const order = await Order.create({ user_id: userId, total_price: 1000, status: 'pending', payment_status: 'pending', shipping_address: address, guest_email: 'qa-fixture@atelier.local', createdAt: new Date(customerStart.getTime() + 5000) });
      ids.push(order._id);
    }
    const customerStats = await getCustomerStatistics({ startDate: customerStart.toISOString(), endDate: customerEnd.toISOString() });
    assert.equal(customerStats.activeBuyingCustomers, 1);
    const customerQuery = new URLSearchParams({ period: 'custom', startDate: customerStart.toISOString(), endDate: customerEnd.toISOString() });
    const customerResponse = await fetch(`${api.origin}/api/admin/ai/analytics?${customerQuery}`, { headers: { Authorization: `Bearer ${token}` } });
    assert.equal(customerResponse.status, 200);
    assert.equal((await customerResponse.json()).data.customers.activeBuyingCustomers, 1);
    const actual = await getRevenueSummary({ startDate: start.toISOString(), endDate: end.toISOString() });
    assert.equal(actual.totalOrders, 6);
    assert.equal(actual.paidOrders, 1);
    assert.equal(actual.deliveredOrders, 4);
    assert.equal(actual.cancelledOrders, 1);
    assert.equal(actual.refundedOrders, 1);
    assert.equal(actual.recognizedOrders, 2);
    assert.equal(actual.totalRevenue, 180000);
    assert.equal(actual.paidRevenue, 110000);
    assert.equal(actual.totalDiscounts, 20000);
    assert.equal(actual.netRevenue, 180000);
    assert.equal(actual.averageOrderValue, 90000);
    const wholeDay = await getRevenueSummary({ startDate: day, endDate: day });
    assert.equal(wholeDay.totalRevenue, 180000);
    assert.equal(wholeDay.totalOrders, 6);
    const query = new URLSearchParams({ period: 'custom', startDate: day, endDate: day });
    const endpoint = `${api.origin}/api/admin/ai/analytics?${query}`;
    const live = await fetch(endpoint, { headers: { Authorization: `Bearer ${token}` } });
    assert.equal(live.status, 200);
    const data = (await live.json()).data;
    assert.equal(data.summary.totalRevenue, 180000);
    assert.equal(data.summary.netRevenue, 180000);
    assert.equal(data.summary.totalDiscounts, 20000);
    assert.equal(data.summary.paidRevenue, 110000);
    assert.equal(data.summary.totalOrders, 6);
    assert.equal(data.summary.refundedOrders, 1);
    assert.equal(data.customers.totalRegisteredUsers, expectedCustomers);
    assert.equal(data.inventory.totalActiveProducts, await Product.countDocuments({ is_active: true }));
    assert.equal(data.inventory.lowStockCount, await Product.countDocuments({ is_active: true, stock: { $gt: 0, $lte: 5 } }));
    assert.ok(data.lowStock.products.every((item) => item.stock > 0 && item.stock <= 5));
    assert.equal(data.topProducts.products.find((product) => product.productId === String(productId))?.totalSold, 5);
    assert.equal(data.campaignPerformance.campaigns.find((item) => item.id === String(campaignFixture._id))?.units, 5);
    assert.equal(data.slowProducts.products.find((product) => product.id === String(slowProduct._id))?.soldRecent, 1);
    assert.equal(data.trend.dataPoints.reduce((sum, point) => sum + point.revenue, 0), 180000);
    assert.equal((await fetch(endpoint)).status, 401);
    restrictedManager = await User.create({ fullName: 'QA analytics restricted manager', email: `qa-analytics-manager-${Date.now()}@atelier.invalid`, passWord: await bcrypt.hash(process.env.QA_SEED_PASSWORD, 10), role: 'manager', permissionOverrides: { deny: ['dashboard:view', 'report:view'] } });
    const managerLogin = await fetch(`${api.origin}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: restrictedManager.email, passWord: process.env.QA_SEED_PASSWORD }) });
    assert.equal(managerLogin.status, 200);
    const managerToken = (await managerLogin.json()).data.accessToken;
    assert.equal((await fetch(endpoint, { headers: { Authorization: `Bearer ${managerToken}` } })).status, 403);
    for (const reportPath of ['/api/admin/ai/export-report', '/api/admin/ai/reports/export']) assert.equal((await fetch(`${api.origin}${reportPath}`, { headers: { Authorization: `Bearer ${managerToken}` } })).status, 403);
    const invalid = await fetch(`${api.origin}/api/admin/ai/analytics?period=custom&startDate=invalid&endDate=${day}`, { headers: { Authorization: `Bearer ${token}` } });
    assert.equal(invalid.status, 400);
    const exported = await fetch(`${api.origin}/api/admin/ai/export-report?period=this_month`, { headers: { Authorization: `Bearer ${token}` } });
    assert.equal(exported.status, 200);
    const workbook = new ExcelJS.Workbook(); await workbook.xlsx.load(Buffer.from(await exported.arrayBuffer()));
    const rows = workbook.worksheets[0].getSheetValues().filter(Boolean);
    const net = rows.find((row) => row[1] === 'Doanh thu thuần');
    assert.match(net[3], /không trừ lại/);
  } finally {
    if (customerFixture) await User.deleteOne({ _id: customerFixture._id, email: customerFixture.email });
    if (restrictedManager) await User.deleteOne({ _id: restrictedManager._id, email: restrictedManager.email });
    if (slowProduct) await Product.deleteOne({ _id: slowProduct._id, slug: slowProduct.slug });
    if (campaignFixture) await Campaign.deleteOne({ _id: campaignFixture._id, slug: campaignFixture.slug });
    if (ids.length) { await OrderItem.deleteMany({ order_id: { $in: ids }, product_name: 'QA isolated analytics product' }); await Order.deleteMany({ _id: { $in: ids }, guest_email: 'qa-fixture@atelier.local' }); }
    await mongoose.disconnect();
  }
});
