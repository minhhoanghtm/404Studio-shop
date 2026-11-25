import { expect, test } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

type Fixture = { code: string; title: string; actionId: string; conversationId: string };
const backend = path.resolve(process.cwd(), '../backend');
const fixtureCommand = (mode: string, fixture?: Fixture): any => {
  const args = ['--env-file=.env.qa', 'src/scripts/qa-admin-action-fixture.mjs', mode];
  if (fixture) args.push(JSON.stringify(fixture));
  const output = execFileSync(process.execPath, args, { cwd: backend, env: process.env, encoding: 'utf8', timeout: 30000 });
  const line = output.split(/\r?\n/).findLast((item) => item.startsWith('{'));
  if (!line) throw new Error('QA fixture did not return its identifiers.');
  return JSON.parse(line);
};

test('confirms or cancels an isolated draft and preserves its state on reload', async ({ page, request }) => {
  test.skip(process.env.QA_E2E_ENABLED !== 'true', 'Requires isolated QA.');
  test.setTimeout(120000);
  const fixtures: Fixture[] = [];
  try {
    fixtures.push(fixtureCommand('create'), fixtureCommand('create'));
    const login = await request.post('http://127.0.0.1:5002/api/auth/login', { data: { email: 'qa.superadmin@atelier.local', passWord: process.env.QA_SEED_PASSWORD } });
    expect(login.ok()).toBeTruthy();
    const session = (await login.json()).data;
    await page.goto('/');
    const cookies = page.getByRole('button', { name: 'Chấp nhận tất cả' });
    if (await cookies.isVisible().catch(() => false)) await cookies.click();
    await page.evaluate((auth) => localStorage.setItem('atelier_patron_auth', JSON.stringify({ state: { token: auth.accessToken, refreshToken: auth.refreshToken, user: auth.user } })), session);
    await page.goto('/admin/ai-assistant?tab=chat');
    await page.getByText(fixtures[0].title, { exact: true }).click();
    if (process.env.QA_VIDEO_EVIDENCE === 'true') await page.waitForTimeout(1800);
    await expect(page.getByText(/Token:/)).toHaveCount(0);
    const confirmResponse = page.waitForResponse((response) => response.url().endsWith('/api/admin/ai/confirm-action'));
    await page.getByRole('button', { name: 'Xác Nhận Áp Dụng' }).click();
    const confirmed = await confirmResponse;
    expect(confirmed.status()).toBe(200);
    expect((await confirmed.json()).data.result.message).toContain('chưa kích hoạt');
    await expect(page.getByText('Đã thực thi thành công hành động nghiệp vụ!')).toBeVisible();
    if (process.env.QA_VIDEO_EVIDENCE === 'true') await page.waitForTimeout(1800);
    await page.reload();
    await page.getByText(fixtures[0].title, { exact: true }).click();
    await expect(page.getByText('Đã thực thi thành công hành động nghiệp vụ!')).toBeVisible();
    await page.getByText(fixtures[1].title, { exact: true }).click();
    if (process.env.QA_VIDEO_EVIDENCE === 'true') await page.waitForTimeout(1800);
    const cancelledResponse = page.waitForResponse((response) => response.url().endsWith('/api/admin/ai/cancel-action'));
    await page.getByRole('button', { name: 'Hủy bỏ', exact: true }).click();
    expect((await cancelledResponse).status()).toBe(200);
    await expect(page.getByText('Đã hủy thao tác.')).toBeVisible();
    if (process.env.QA_VIDEO_EVIDENCE === 'true') await page.waitForTimeout(1800);
    await page.reload();
    await page.getByText(fixtures[1].title, { exact: true }).click();
    await expect(page.getByText('Đã hủy thao tác.')).toBeVisible();
  } finally {
    for (const fixture of fixtures) fixtureCommand('cleanup', fixture);
  }
});

test('confirms an isolated campaign draft and preserves its confirmation on reload', async ({ page, request }) => {
  test.skip(process.env.QA_E2E_ENABLED !== 'true', 'Requires isolated QA.');
  test.setTimeout(120000);
  const fixture: Fixture = fixtureCommand('create-campaign');
  try {
    const login = await request.post('http://127.0.0.1:5002/api/auth/login', { data: { email: 'qa.superadmin@atelier.local', passWord: process.env.QA_SEED_PASSWORD } });
    expect(login.ok()).toBeTruthy();
    const session = (await login.json()).data;
    await page.goto('/');
    const cookies = page.getByRole('button', { name: 'Chấp nhận tất cả' });
    if (await cookies.isVisible().catch(() => false)) await cookies.click();
    await page.evaluate((auth) => localStorage.setItem('atelier_patron_auth', JSON.stringify({ state: { token: auth.accessToken, refreshToken: auth.refreshToken, user: auth.user } })), session);
    await page.goto('/admin/ai-assistant?tab=chat');
    await page.getByText(fixture.title, { exact: true }).click();
    await expect(page.getByText(/bản nháp chiến dịch/i).first()).toBeVisible();
    if (process.env.QA_VIDEO_EVIDENCE === 'true') await page.waitForTimeout(1800);
    const response = page.waitForResponse((item) => item.url().endsWith('/api/admin/ai/confirm-action'));
    await page.getByRole('button', { name: 'Xác Nhận Áp Dụng' }).click();
    const confirmed = await response;
    expect(confirmed.status()).toBe(200);
    expect((await confirmed.json()).data.result.message).toContain('chưa kích hoạt');
    if (process.env.QA_VIDEO_EVIDENCE === 'true') await page.waitForTimeout(1800);
    await page.reload();
    await page.getByText(fixture.title, { exact: true }).click();
    await expect(page.getByText('Đã thực thi thành công hành động nghiệp vụ!')).toBeVisible();
    if (process.env.QA_VIDEO_EVIDENCE === 'true') await page.waitForTimeout(1800);
  } finally { fixtureCommand('cleanup', fixture); }
});

test('confirms an isolated promotion draft and preserves its confirmation on reload', async ({ page, request }) => {
  test.skip(process.env.QA_E2E_ENABLED !== 'true', 'Requires isolated QA.');
  test.setTimeout(120000);
  const fixture: Fixture = fixtureCommand('create-promotion');
  try {
    const login = await request.post('http://127.0.0.1:5002/api/auth/login', { data: { email: 'qa.superadmin@atelier.local', passWord: process.env.QA_SEED_PASSWORD } });
    expect(login.ok()).toBeTruthy();
    const session = (await login.json()).data;
    await page.goto('/');
    const cookies = page.getByRole('button', { name: 'Chấp nhận tất cả' });
    if (await cookies.isVisible().catch(() => false)) await cookies.click();
    await page.evaluate((auth) => localStorage.setItem('atelier_patron_auth', JSON.stringify({ state: { token: auth.accessToken, refreshToken: auth.refreshToken, user: auth.user } })), session);
    await page.goto('/admin/ai-assistant?tab=chat');
    await page.getByText(fixture.title, { exact: true }).click();
    await expect(page.getByText(/ưu đãi nháp/i).first()).toBeVisible();
    if (process.env.QA_VIDEO_EVIDENCE === 'true') await page.waitForTimeout(1800);
    const response = page.waitForResponse((item) => item.url().endsWith('/api/admin/ai/confirm-action'));
    await page.getByRole('button', { name: 'Xác Nhận Áp Dụng' }).click();
    const confirmed = await response;
    expect(confirmed.status()).toBe(200);
    expect((await confirmed.json()).data.result.message).toContain('chưa kích hoạt');
    if (process.env.QA_VIDEO_EVIDENCE === 'true') await page.waitForTimeout(1800);
    await page.reload();
    await page.getByText(fixture.title, { exact: true }).click();
    await expect(page.getByText('Đã thực thi thành công hành động nghiệp vụ!')).toBeVisible();
    if (process.env.QA_VIDEO_EVIDENCE === 'true') await page.waitForTimeout(1800);
  } finally { fixtureCommand('cleanup', fixture); }
});

test('confirms an isolated product description update and banner draft and preserves state on reload', async ({ page, request }) => {
  test.skip(process.env.QA_E2E_ENABLED !== 'true', 'Requires isolated QA.');
  test.setTimeout(120000);
  const descFixture: Fixture = fixtureCommand('create-description');
  const bannerFixture: Fixture = fixtureCommand('create-banner');
  try {
    const login = await request.post('http://127.0.0.1:5002/api/auth/login', { data: { email: 'qa.superadmin@atelier.local', passWord: process.env.QA_SEED_PASSWORD } });
    expect(login.ok()).toBeTruthy();
    const session = (await login.json()).data;
    await page.goto('/');
    const cookies = page.getByRole('button', { name: 'Chấp nhận tất cả' });
    if (await cookies.isVisible().catch(() => false)) await cookies.click();
    await page.evaluate((auth) => localStorage.setItem('atelier_patron_auth', JSON.stringify({ state: { token: auth.accessToken, refreshToken: auth.refreshToken, user: auth.user } })), session);
    await page.goto('/admin/ai-assistant?tab=chat');

    await page.getByText(descFixture.title, { exact: true }).click();
    const descConfirm = page.waitForResponse((item) => item.url().endsWith('/api/admin/ai/confirm-action'));
    await page.getByRole('button', { name: 'Xác Nhận Áp Dụng' }).click();
    expect((await descConfirm).status()).toBe(200);
    await expect(page.getByText('Đã thực thi thành công hành động nghiệp vụ!')).toBeVisible();
    await page.reload();
    await page.getByText(descFixture.title, { exact: true }).click();
    await expect(page.getByText('Đã thực thi thành công hành động nghiệp vụ!')).toBeVisible();

    await page.getByText(bannerFixture.title, { exact: true }).click();
    const bannerConfirm = page.waitForResponse((item) => item.url().endsWith('/api/admin/ai/confirm-action'));
    await page.getByRole('button', { name: 'Xác Nhận Áp Dụng' }).click();
    const bannerRes = await bannerConfirm;
    expect(bannerRes.status()).toBe(200);
    expect((await bannerRes.json()).data.result.message).toContain('chưa xuất bản');
    await expect(page.getByText('Đã thực thi thành công hành động nghiệp vụ!')).toBeVisible();
  } finally {
    fixtureCommand('cleanup', descFixture);
    fixtureCommand('cleanup', bannerFixture);
  }
});
