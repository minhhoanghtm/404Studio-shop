import { expect, test } from '@playwright/test';
import { createIsolatedDesign, loginQaAdmin, loginQaUser, openDesignInStudio, readDesign, seededLayer } from './support/creativeStudioQa';

const enabled = process.env.QA_E2E_ENABLED === 'true';
const qaApiBase = (process.env.QA_API_URL || 'http://127.0.0.1:5002/api').replace(/\/$/, '');

test.describe('Creative Studio — save queue and ownership acceptance', () => {
  test.skip(!enabled, 'Set QA_E2E_ENABLED=true only after isolated QA services and fixtures are ready.');

  test('preserves the newest queued edit, recovers a failed save, and rejects a different admin owner', async ({ page, browser }, testInfo) => {
    test.setTimeout(180_000);
    const name = `QA Save Security ${testInfo.project.name} ${Date.now()}`;
    await loginQaAdmin(page);
    const design = await createIsolatedDesign(page, name, [seededLayer({ id: 'queue-title', type: 'text', name: 'Queue title', content: 'QUEUE', x: 120, y: 160 })]);
    await openDesignInStudio(page, name);

    let delayed = false;
    await page.route('**/api/admin/ai/designs', async (route) => {
      const request = route.request();
      if (!delayed && request.method() === 'POST' && JSON.parse(request.postData() || '{}')._id === design._id) {
        delayed = true;
        await new Promise((resolve) => setTimeout(resolve, 700));
      }
      await route.continue();
    });
    const latestName = `${name} latest`;
    await page.getByLabel('Tên thiết kế').fill(`${name} stale`);
    await page.getByRole('button', { name: 'Lưu', exact: true }).click();
    await page.waitForTimeout(80);
    await page.getByLabel('Tên thiết kế').fill(latestName);
    await page.getByLabel('Màu nền').fill('#2459A8');
    await page.getByRole('button', { name: 'Lưu', exact: true }).click();
    await page.unroute('**/api/admin/ai/designs');
    await expect.poll(async () => (await readDesign(page, design._id)).name, { timeout: 12_000 }).toBe(latestName);
    await expect.poll(async () => (await readDesign(page, design._id)).background.value, { timeout: 12_000 }).toBe('#2459A8');

    let aborted = false;
    await page.route('**/api/admin/ai/designs', async (route) => {
      const request = route.request();
      if (!aborted && request.method() === 'POST' && JSON.parse(request.postData() || '{}')._id === design._id) {
        aborted = true;
        await route.abort('failed');
        return;
      }
      await route.continue();
    });
    const recoveredName = `${latestName} recovered`;
    await page.getByLabel('Tên thiết kế').fill(recoveredName);
    await page.getByRole('button', { name: 'Lưu', exact: true }).click();
    await expect(page.getByText('Không thể lưu thiết kế. Không có thay đổi nào bị xóa; vui lòng thử lại.')).toBeVisible();
    await page.unroute('**/api/admin/ai/designs');
    await page.getByRole('button', { name: 'Lưu', exact: true }).click();
    await expect.poll(async () => (await readDesign(page, design._id)).name, { timeout: 12_000 }).toBe(recoveredName);

    const otherContext = await browser.newContext({ baseURL: 'http://127.0.0.1:5174' });
    try {
      const other = await otherContext.newPage();
      await loginQaUser(other, 'qa.admin@atelier.local');
      const ownerProject = await readDesign(page, design._id);
      const crossOwner = await other.evaluate(async ({ url, project }) => {
        const raw = localStorage.getItem('atelier_patron_auth');
        const token = raw ? (JSON.parse(raw)?.state?.token || JSON.parse(raw)?.state?.accessToken) : null;
        const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ ...project, name: 'FORBIDDEN CROSS OWNER WRITE' }) });
        return { status: response.status, payload: await response.json() };
      }, { url: `${qaApiBase}/admin/ai/designs`, project: ownerProject });
      expect(crossOwner.status).toBe(404);
      const otherDesigns = await other.evaluate(async (url) => {
        const raw = localStorage.getItem('atelier_patron_auth');
        const token = raw ? (JSON.parse(raw)?.state?.token || JSON.parse(raw)?.state?.accessToken) : null;
        const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
        return response.json();
      }, `${qaApiBase}/admin/ai/designs`);
      expect(otherDesigns.data.some((item: { _id: string }) => item._id === design._id)).toBeFalsy();
    } finally {
      await otherContext.close();
    }
    expect((await readDesign(page, design._id)).name).toBe(recoveredName);
  });
});
