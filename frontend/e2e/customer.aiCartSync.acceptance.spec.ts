import { expect, test } from '@playwright/test';
import { customerCartFixture, type CustomerCartFixture } from './support/customerCartFixture';
import { getQaApiUrl } from './support/qaEnv';

test('AI cart previews and completed results do not create duplicate cart writes', async ({ page, request }) => {
  test.skip(process.env.QA_E2E_ENABLED !== 'true', 'Requires isolated QA.');
  test.setTimeout(60000);
  let fixture: CustomerCartFixture | undefined;
  try {
    fixture = customerCartFixture('create');
    const login = await request.post(`${getQaApiUrl()}/auth/login`, { data: { email: 'qa.customer.b@atelier.local', passWord: process.env.QA_SEED_PASSWORD } });
    expect(login.ok()).toBeTruthy(); const session = (await login.json()).data;
    await page.goto('/');
    const cookies = page.getByRole('button', { name: 'Chấp nhận tất cả' });
    if (await cookies.isVisible().catch(() => false)) await cookies.click();
    await page.evaluate((auth) => localStorage.setItem('atelier_patron_auth', JSON.stringify({ state: { token: auth.accessToken, refreshToken: auth.refreshToken, user: auth.user } })), session);
    await page.reload();
    await page.addLocatorHandler(page.getByTestId('promotional-popup'), async () => { await page.getByTestId('popup-close').click(); });
    let cartWrites = 0; let calls = 0;
    page.on('request', (outgoing) => { if (outgoing.method() === 'POST' && outgoing.url().endsWith('/api/cart_items')) cartWrites += 1; });
    await page.route('**/api/ai/chat', async (route) => {
      calls += 1;
      const status = calls === 1 ? 'PENDING_CONFIRMATION' : 'EXECUTED';
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { message: `QA ${status}`, actionResult: { success: true, status, actionType: 'add_to_cart', items: [{ product_id: fixture!.productId, variant_id: fixture!.variantId, name: fixture!.name, quantity: 1 }] } } }) });
    });
    await page.getByRole('button', { name: 'Mở Trợ lý Stylist AI' }).click();
    const input = page.getByTestId('ai-chat-input');
    await input.fill('Xem sản phẩm'); await page.getByTestId('ai-chat-send-btn').click();
    await expect(page.getByText('QA PENDING_CONFIRMATION')).toBeVisible();
    await input.fill('Xem tiếp'); await page.getByTestId('ai-chat-send-btn').click();
    await expect(page.getByText('QA EXECUTED')).toBeVisible();
    await page.waitForTimeout(500);
    expect(cartWrites).toBe(0);
  } finally { if (fixture) customerCartFixture('cleanup', fixture); }
});
