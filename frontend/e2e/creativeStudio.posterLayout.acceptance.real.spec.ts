import { expect, test } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { getQaApiUrl } from './support/qaEnv';

type Fixture = { id: string; name: string; title: string };
const backend = path.resolve(process.cwd(), '../backend');
function fixtureCommand(mode: string, fixture?: Fixture): Fixture {
  const args = ['--env-file=.env.qa', 'src/scripts/qa-poster-layout-fixture.mjs', mode];
  if (fixture) args.push(JSON.stringify(fixture));
  const output = execFileSync(process.execPath, args, { cwd: backend, env: process.env, encoding: 'utf8', timeout: 30000 });
  const line = output.split(/\r?\n/).findLast((item) => item.startsWith('{'));
  if (!line) throw new Error('QA layout fixture did not return identifiers.');
  return JSON.parse(line);
}

test('opens, edits, saves and exports the provider-unavailable layout', async ({ page, request }) => {
  test.skip(process.env.QA_E2E_ENABLED !== 'true', 'Requires isolated QA.');
  test.setTimeout(120000);
  const fixture = fixtureCommand('create');
  try {
    const login = await request.post(`${getQaApiUrl()}/auth/login`, { data: { email: 'qa.superadmin@atelier.local', passWord: process.env.QA_SEED_PASSWORD } });
    expect(login.ok()).toBeTruthy();
    const session = (await login.json()).data;
    await page.goto('/');
    const cookies = page.getByRole('button', { name: 'Chấp nhận tất cả' });
    if (await cookies.isVisible().catch(() => false)) await cookies.click();
    await page.evaluate((auth) => localStorage.setItem('atelier_patron_auth', JSON.stringify({ state: { token: auth.accessToken, refreshToken: auth.refreshToken, user: auth.user } })), session);
    await page.goto(`/admin/ai-assistant?tab=creative&designId=${encodeURIComponent(fixture.id)}`);
    await expect(page.getByLabel('Tên thiết kế')).toHaveValue(fixture.name);
    await expect(page.locator('svg').getByText(fixture.title)).toBeVisible();
    const offer = page.locator('svg').getByText('ƯU ĐÃI CHỜ XÁC NHẬN', { exact: true });
    await expect(offer).toBeVisible();
    expect(await offer.evaluate((element) => (element as SVGGraphicsElement).getBBox().width)).toBeLessThanOrEqual(1080 * 0.84);
    if (process.env.QA_VIDEO_EVIDENCE === 'true') await page.waitForTimeout(1800);
    await page.getByRole('button', { name: 'Tiêu đề chính', exact: true }).click();
    await page.getByLabel('Nội dung').fill('Tiêu đề QA đã chỉnh sửa');
    if (process.env.QA_VIDEO_EVIDENCE === 'true') { await page.getByLabel('Font chữ').scrollIntoViewIfNeeded(); await page.waitForTimeout(1800); }
    await page.getByLabel('Font chữ').selectOption('Georgia');
    if (process.env.QA_VIDEO_EVIDENCE === 'true') await page.waitForTimeout(1800);
    const saved = page.waitForResponse((response) => response.url().includes('/api/admin/ai/designs') && response.request().method() === 'POST' && response.ok());
    await page.getByRole('button', { name: 'Lưu', exact: true }).click();
    await saved;
    await page.reload();
    await expect(page.locator('svg').getByText('Tiêu đề QA đã chỉnh sửa')).toBeVisible();
    if (process.env.QA_VIDEO_EVIDENCE === 'true') await page.waitForTimeout(1800);
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: 'JSON', exact: true }).click();
    const exported = JSON.parse(await readFile((await (await download).path())!, 'utf8'));
    expect(exported.project._id).toBe(fixture.id);
    expect(exported.project.background.type).toBe('color');
    expect(exported.project.layers.find((layer: { id: string }) => layer.id === 'text-title').content).toBe('Tiêu đề QA đã chỉnh sửa');
    expect(exported.project.layers.find((layer: { id: string }) => layer.id === 'text-title').styles.fontFamily).toBe('Georgia');
    expect(exported.project.layers.some((layer: { id: string }) => layer.id === 'product-showcase')).toBe(false);
  } finally { fixtureCommand('cleanup', fixture); }
});
