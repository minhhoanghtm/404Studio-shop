import { expect, test } from '@playwright/test';
import { createIsolatedDesign, openDesignInStudio, seededLayer } from './support/creativeStudioQa';
import { getQaApiUrl } from './support/qaEnv';

test('records an authenticated export and reload flow without showing credentials', async ({ page, request }, info) => {
  test.skip(process.env.QA_E2E_ENABLED !== 'true', 'Requires isolated QA.');
  const login = await request.post(`${getQaApiUrl()}/auth/login`, { data: { email: 'qa.superadmin@atelier.local', passWord: process.env.QA_SEED_PASSWORD } });
  expect(login.ok()).toBeTruthy();
  const session = (await login.json()).data;
  await page.goto('/');
  const acceptCookies = page.getByRole('button', { name: 'Chấp nhận tất cả' });
  if (await acceptCookies.isVisible().catch(() => false)) await acceptCookies.click();
  await page.evaluate((auth) => localStorage.setItem('atelier_patron_auth', JSON.stringify({ state: { token: auth.accessToken, refreshToken: auth.refreshToken, user: auth.user } })), session);
  const name = `QA Video Export ${info.project.name} ${Date.now()}`;
  await createIsolatedDesign(page, name, [seededLayer({ id: 'video-title', type: 'text', name: 'Tiêu đề', content: 'ATELIER VÉRITÉ', styles: { color: '#FFFFFF', fontSize: 48, fontFamily: 'Inter' } })]);
  await openDesignInStudio(page, name);
  await page.waitForTimeout(2000);
  for (const format of ['PNG', 'JPG', 'WebP', 'SVG', 'JSON']) {
    const button = page.getByRole('button', { name: format, exact: true });
    await button.hover();
    await page.waitForTimeout(1200);
    const downloaded = page.waitForEvent('download');
    await button.click();
    expect((await downloaded).suggestedFilename()).toBeTruthy();
    await page.waitForTimeout(1500);
  }
  await page.reload();
  await expect(page.getByLabel('Tên thiết kế')).toHaveValue(name);
  await page.waitForTimeout(2000);
});
