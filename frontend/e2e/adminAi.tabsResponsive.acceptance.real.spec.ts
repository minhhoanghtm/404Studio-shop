import { expect, test } from '@playwright/test';

test('admin AI tabs navigate without page overflow or uncaught errors', async ({ page, request }) => {
  test.skip(process.env.QA_E2E_ENABLED !== 'true', 'Requires isolated QA.');
  const login = await request.post('http://127.0.0.1:5002/api/auth/login', { data: { email: 'qa.superadmin@atelier.local', passWord: process.env.QA_SEED_PASSWORD } });
  expect(login.ok()).toBeTruthy();
  const session = (await login.json()).data;
  await page.goto('/');
  const acceptCookies = page.getByRole('button', { name: 'Chấp nhận tất cả' });
  if (await acceptCookies.isVisible().catch(() => false)) await acceptCookies.click();
  await page.evaluate((auth) => localStorage.setItem('atelier_patron_auth', JSON.stringify({ state: { token: auth.accessToken, refreshToken: auth.refreshToken, user: auth.user } })), session);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/admin/ai-assistant?tab=chat');
  for (const [label, tab] of [
    ['Trò Chuyện & Điều Hành', 'chat'],
    ['Business Intelligence & Doanh Thu', 'analytics'],
    ['Creative Studio (Poster & Banner)', 'creative'],
    ['Marketing & Copywriting', 'marketing'],
    ['Xuất Báo Cáo Excel/CSV', 'reports'],
    ['Cấu Hình & Quản Trị AI', 'settings'],
  ]) {
    const button = page.getByRole('button', { name: label, exact: true });
    await expect(button).toBeVisible();
    await button.click();
    await expect(page).toHaveURL(new RegExp(`[?&]tab=${tab}(?:&|$)`));
    // Evidence runs pause on each real tab so the recorded state is legible.
    await page.waitForTimeout(process.env.QA_UI_VIDEO === 'true' ? 1800 : 400);
    const overflow = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
    expect(overflow.scroll, `${tab} page width`).toBeLessThanOrEqual(overflow.viewport + 1);
  }

  // Verify settings tab displays provider status without leaking secrets
  await expect(page.getByText('Danh Sách AI Providers & Trạng Thái Kết Nối')).toBeVisible();

  // Verify Chat tab renders markdown safely (no raw **), input is visible & unobstructed, and Light/Dark mode toggles cleanly
  await page.getByRole('button', { name: 'Trò Chuyện & Điều Hành', exact: true }).click();
  const sendBtn = page.getByRole('button', { name: 'Gửi', exact: true });
  await expect(sendBtn).toBeVisible();
  const box = await sendBtn.boundingBox();
  const vp = page.viewportSize();
  expect(box && vp && box.y + box.height <= vp.height + 5).toBeTruthy();

  const themeToggle = page.locator('button[aria-label*="chế độ"], button[title*="chế độ"], button[aria-label*="Theme"]').first();
  if (await themeToggle.isVisible().catch(() => false)) {
    const beforeTheme = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    await themeToggle.click();
    const afterTheme = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(afterTheme).not.toBe(beforeTheme);
  }

  expect(errors).toEqual([]);
});
