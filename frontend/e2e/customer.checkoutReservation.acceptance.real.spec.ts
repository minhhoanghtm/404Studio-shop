import { expect, test } from '@playwright/test';
import { customerCartFixture, type CustomerCartFixture } from './support/customerCartFixture';

test('checkout quotes and orders the reserved variant while preserving another cart variant', async ({ page, request }) => {
  test.skip(process.env.QA_E2E_ENABLED !== 'true', 'Requires isolated QA.');
  test.setTimeout(90000); page.setDefaultTimeout(15000);
  let fixture: CustomerCartFixture | undefined;
  try {
    fixture = customerCartFixture('create');
    const login = await request.post('http://127.0.0.1:5002/api/auth/login', { data: { email: 'qa.customer.b@atelier.local', passWord: process.env.QA_SEED_PASSWORD } });
    expect(login.ok()).toBeTruthy(); const session = (await login.json()).data; const headers = { Authorization: `Bearer ${session.accessToken}` };
    for (const [variantId, quantity] of [[fixture.variantId, 2], [fixture.variant2Id, 1]] as const) {
      const added = await request.post('http://127.0.0.1:5002/api/cart_items', { headers, data: { product_id: fixture.productId, variant_id: variantId, quantity } });
      expect(added.status()).toBe(200);
    }
    const reserved = await request.post('http://127.0.0.1:5002/api/checkout/reservations', { headers, data: { items: [{ productId: fixture.productId, variantId: fixture.variantId, quantity: 2 }] } });
    expect(reserved.status()).toBe(201); fixture.reservationId = (await reserved.json()).data.reservationId;
    await page.goto('/');
    const cookies = page.getByRole('button', { name: 'Chấp nhận tất cả' });
    if (await cookies.isVisible().catch(() => false)) await cookies.click();
    await page.evaluate((auth) => localStorage.setItem('atelier_patron_auth', JSON.stringify({ state: { token: auth.accessToken, refreshToken: auth.refreshToken, user: auth.user } })), session);
    await page.addLocatorHandler(page.getByTestId('promotional-popup'), async () => { await page.getByTestId('popup-close').click(); });
    let orderPosts = 0; page.on('request', (outgoing) => { if (outgoing.method() === 'POST' && outgoing.url().endsWith('/api/order')) orderPosts += 1; });
    const quoteResponse = page.waitForResponse((response) => response.url().endsWith('/api/order/quote'));
    await page.goto(`/checkout?reservationId=${encodeURIComponent(fixture.reservationId!)}`);
    const quote = await quoteResponse; expect(quote.status()).toBe(200); const values = (await quote.json()).data;
    expect(values.subtotal).toBe(200000); expect(values.shipping).toBe(30000); expect(values.tax).toBe(0); expect(values.total).toBe(230000);
    expect(values.items).toHaveLength(1); expect(values.items[0].variant_id).toBe(fixture.variantId); expect(values.items[0].quantity).toBe(2);
    await expect(page.getByText(fixture.name, { exact: true })).toBeVisible();
    await expect(page.getByText(/Size M × 2/)).toBeVisible();
    expect(orderPosts).toBe(0);
    await page.locator('input[name="firstName"]').fill('QA'); await page.locator('input[name="lastName"]').fill('Fixture');
    await page.locator('input[name="email"]').fill('qa.customer.b@atelier.local'); await page.locator('input[name="phone"]').fill('0900000000');
    await page.locator('input[name="addressLine1"]').fill('QA test address'); await page.locator('input[name="city"]').fill('QA');
    await page.locator('input[name="state"]').fill('QA'); await page.locator('input[name="postalCode"]').fill('700000');
    await page.getByRole('checkbox').nth(0).check(); await page.getByRole('checkbox').nth(1).check();
    const orderResponse = page.waitForResponse((response) => response.request().method() === 'POST' && response.url().endsWith('/api/order'));
    await page.getByRole('button', { name: 'Xác nhận & Hoàn tất đơn hàng' }).click();
    const placed = await orderResponse; expect(placed.status()).toBe(200); const order = (await placed.json()).order;
    expect(order.reservation_id).toBe(fixture.reservationId); expect(order.shipping_fee).toBe(30000); expect(order.total_price).toBe(230000);
    const orderItems = await request.get(`http://127.0.0.1:5002/api/order_items/${order._id}`, { headers }); expect(orderItems.status()).toBe(200);
    const purchased = (await orderItems.json()).data; expect(purchased).toHaveLength(1); expect(String(purchased[0].variant_id?._id || purchased[0].variant_id)).toBe(fixture.variantId); expect(purchased[0].quantity).toBe(2);
    const cart = (await (await request.get('http://127.0.0.1:5002/api/cart', { headers })).json()).data;
    const remaining = (await (await request.get(`http://127.0.0.1:5002/api/cart_items/${cart._id}`, { headers })).json()).data;
    expect(remaining.some((item: any) => String(item.variant_id?._id || item.variant_id) === fixture!.variantId)).toBeFalsy();
    expect(remaining.some((item: any) => String(item.variant_id?._id || item.variant_id) === fixture!.variant2Id)).toBeTruthy();
  } finally { if (fixture) customerCartFixture('cleanup', fixture); }
});

test('multi-variant reservation checkout creates one order with all reserved variants', async ({ page, request }) => {
  test.skip(process.env.QA_E2E_ENABLED !== 'true', 'Requires isolated QA.');
  test.setTimeout(90000); page.setDefaultTimeout(15000);
  let fixture: CustomerCartFixture | undefined;
  try {
    fixture = customerCartFixture('create');
    const login = await request.post('http://127.0.0.1:5002/api/auth/login', { data: { email: 'qa.customer.b@atelier.local', passWord: process.env.QA_SEED_PASSWORD } });
    expect(login.ok()).toBeTruthy(); const session = (await login.json()).data; const headers = { Authorization: `Bearer ${session.accessToken}` };
    for (const [variantId, quantity] of [[fixture.variantId, 1], [fixture.variant2Id, 2]] as const) {
      const added = await request.post('http://127.0.0.1:5002/api/cart_items', { headers, data: { product_id: fixture.productId, variant_id: variantId, quantity } });
      expect(added.status()).toBe(200);
    }
    const reserved = await request.post('http://127.0.0.1:5002/api/checkout/reservations', {
      headers,
      data: { items: [{ productId: fixture.productId, variantId: fixture.variantId, quantity: 1 }, { productId: fixture.productId, variantId: fixture.variant2Id, quantity: 2 }] },
    });
    expect(reserved.status()).toBe(201);
    fixture.reservationId = (await reserved.json()).data.reservationId;
    await page.goto('/');
    const cookies = page.getByRole('button', { name: 'Chấp nhận tất cả' });
    if (await cookies.isVisible().catch(() => false)) await cookies.click();
    await page.evaluate((auth) => localStorage.setItem('atelier_patron_auth', JSON.stringify({ state: { token: auth.accessToken, refreshToken: auth.refreshToken, user: auth.user } })), session);
    await page.addLocatorHandler(page.getByTestId('promotional-popup'), async () => { await page.getByTestId('popup-close').click(); });
    await page.goto(`/checkout?reservationId=${encodeURIComponent(fixture.reservationId!)}`);
    await expect(page.getByText(/Size M × 1/)).toBeVisible();
    await expect(page.getByText(/Size L × 2/)).toBeVisible();
    await page.locator('input[name="firstName"]').fill('QA'); await page.locator('input[name="lastName"]').fill('Multi');
    await page.locator('input[name="email"]').fill('qa.customer.b@atelier.local'); await page.locator('input[name="phone"]').fill('0900000000');
    await page.locator('input[name="addressLine1"]').fill('QA multi address'); await page.locator('input[name="city"]').fill('QA');
    await page.locator('input[name="state"]').fill('QA'); await page.locator('input[name="postalCode"]').fill('700000');
    await page.getByRole('checkbox').nth(0).check(); await page.getByRole('checkbox').nth(1).check();
    const orderResponse = page.waitForResponse((response) => response.request().method() === 'POST' && response.url().endsWith('/api/order'));
    await page.getByRole('button', { name: 'Xác nhận & Hoàn tất đơn hàng' }).click();
    const placed = await orderResponse; expect(placed.status()).toBe(200);
    const order = (await placed.json()).order;
    const orderItems = await request.get(`http://127.0.0.1:5002/api/order_items/${order._id}`, { headers });
    expect(orderItems.status()).toBe(200);
    const purchased = (await orderItems.json()).data;
    expect(purchased).toHaveLength(2);
  } finally { if (fixture) customerCartFixture('cleanup', fixture); }
});
