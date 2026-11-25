import { expect, test } from '@playwright/test';
import { customerCartFixture, type CustomerCartFixture } from './support/customerCartFixture';
import { getQaApiUrl } from './support/qaEnv';

test('authenticated wishlist persists and stays isolated between customers and guest', async ({ page, request }) => {
  test.skip(process.env.QA_E2E_ENABLED !== 'true', 'Requires isolated QA.');
  test.setTimeout(120000);
  let fixture: CustomerCartFixture | undefined;
  try {
    const apiUrl = getQaApiUrl();
    fixture = customerCartFixture('create');
    const login = async (email: string) => {
      const response = await request.post(`${apiUrl}/auth/login`, { data: { email, passWord: process.env.QA_SEED_PASSWORD } });
      expect(response.ok()).toBeTruthy(); return (await response.json()).data;
    };
    const userB = await login('qa.customer.b@atelier.local');
    const userA = await login('qa.customer.a@atelier.local');
    const fetchFavorites = async (token: string) => {
      const response = await request.get(`${apiUrl}/favorites`, { headers: { Authorization: `Bearer ${token}` } });
      expect(response.status()).toBe(200); return (await response.json()).data;
    };
    await page.goto('/');
    const cookies = page.getByRole('button', { name: 'Từ chối tùy chọn' });
    if (await cookies.isVisible().catch(() => false)) await cookies.click();
    await page.evaluate((id) => localStorage.setItem('atelier_wishlist', JSON.stringify([{ id, name: 'QA guest wishlist', variants: [] }])), fixture.productId);
    await page.evaluate((auth) => localStorage.setItem('atelier_patron_auth', JSON.stringify({ state: { token: auth.accessToken, refreshToken: auth.refreshToken, user: auth.user } })), userB);
    await page.addLocatorHandler(page.getByTestId('promotional-popup'), async () => { await page.getByTestId('popup-close').click(); });
    const initial = page.waitForResponse((response) => response.url().endsWith('/api/favorites') && response.request().method() === 'GET');
    await page.goto(`/products/${fixture.slug}`); await initial;
    await expect(page.getByRole('button', { name: 'Lưu vào yêu thích' })).toBeVisible();
    if (process.env.QA_VIDEO_EVIDENCE !== 'true') {
    await page.route('**/api/favorites', async (route) => {
      if (route.request().method() === 'POST') await route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({ success: false, message: 'QA simulated failure' }) });
      else await route.continue();
    });
    await page.getByRole('button', { name: 'Lưu vào yêu thích' }).click();
    await expect(page.getByText('Không thể cập nhật danh sách yêu thích. Vui lòng thử lại.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Lưu vào yêu thích' })).toBeVisible();
    expect((await fetchFavorites(userB.accessToken)).some((item: any) => item.product_id?._id === fixture!.productId)).toBe(false);
    await page.unroute('**/api/favorites');
    }
    await page.getByRole('button', { name: 'Lưu vào yêu thích' }).click();
    await expect(page.getByRole('button', { name: 'Bỏ khỏi yêu thích' })).toBeVisible();
    if (process.env.QA_VIDEO_EVIDENCE === 'true') await page.waitForTimeout(1800);
    await expect.poll(async () => (await fetchFavorites(userB.accessToken)).some((item: any) => item.product_id?._id === fixture!.productId)).toBeTruthy();
    const saved = (await fetchFavorites(userB.accessToken)).find((item: any) => item.product_id?._id === fixture!.productId);
    expect(saved.product_id.variants.map((variant: any) => variant.size).sort()).toEqual(['L', 'M']);
    await page.goto('/wishlist'); await expect(page.getByText(fixture.name).first()).toBeVisible();
    if (process.env.QA_VIDEO_EVIDENCE === 'true') await page.waitForTimeout(1800);
    await page.reload(); await expect(page.getByText(fixture.name).first()).toBeVisible();
    await page.goto(`/products/${fixture.slug}`);
    await page.reload(); await expect(page.getByRole('button', { name: 'Bỏ khỏi yêu thích' })).toBeVisible();
    await page.evaluate((auth) => localStorage.setItem('atelier_patron_auth', JSON.stringify({ state: { token: auth.accessToken, refreshToken: auth.refreshToken, user: auth.user } })), userA);
    const otherLoaded = page.waitForResponse((response) => response.url().endsWith('/api/favorites') && response.request().method() === 'GET');
    await page.reload(); await otherLoaded;
    await expect(page.getByRole('button', { name: 'Lưu vào yêu thích' })).toBeVisible();
    if (process.env.QA_VIDEO_EVIDENCE === 'true') await page.waitForTimeout(1800);
    expect((await fetchFavorites(userA.accessToken)).some((item: any) => item.product_id?._id === fixture!.productId)).toBe(false);
    await page.evaluate((auth) => localStorage.setItem('atelier_patron_auth', JSON.stringify({ state: { token: auth.accessToken, refreshToken: auth.refreshToken, user: auth.user } })), userB);
    const ownerLoaded = page.waitForResponse((response) => response.url().endsWith('/api/favorites') && response.request().method() === 'GET');
    await page.reload(); await ownerLoaded;
    await expect(page.getByRole('button', { name: 'Bỏ khỏi yêu thích' })).toBeVisible();
    await page.getByRole('button', { name: 'Bỏ khỏi yêu thích' }).click();
    await expect(page.getByRole('button', { name: 'Lưu vào yêu thích' })).toBeVisible();
    if (process.env.QA_VIDEO_EVIDENCE === 'true') await page.waitForTimeout(1800);
    await expect.poll(async () => (await fetchFavorites(userB.accessToken)).some((item: any) => item.product_id?._id === fixture!.productId)).toBeFalsy();
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('atelier_wishlist') || '[]')[0]?.name)).toBe('QA guest wishlist');
    await page.evaluate(() => localStorage.removeItem('atelier_patron_auth'));
    await page.reload();
    await expect(page.getByRole('button', { name: 'Bỏ khỏi yêu thích' })).toBeVisible();
  } finally { if (fixture) customerCartFixture('cleanup', fixture); }
});
