import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { createIsolatedDesign, loginQaAdmin, loginQaUser, openDesignInStudio, readDesign, saveDesign } from './support/creativeStudioQa';

test('enforces design ownership and customer denial while uploaded image URLs are shared', async ({ page, browser }, testInfo) => {
  test.skip(process.env.QA_E2E_ENABLED !== 'true', 'Requires isolated QA.');
  test.setTimeout(120_000);
  const sourceName = `QA Asset Policy A ${testInfo.project.name} ${Date.now()}`;
  await loginQaAdmin(page);
  const source = await createIsolatedDesign(page, sourceName, []);
  await openDesignInStudio(page, sourceName);
  const png = await page.evaluate(() => { const canvas = document.createElement('canvas'); canvas.width = 16; canvas.height = 16; const c = canvas.getContext('2d')!; c.fillStyle = '#dd2200'; c.fillRect(0, 0, 16, 16); return canvas.toDataURL('image/png').split(',')[1]; });
  await page.getByLabel('Chọn ảnh để tải lên').setInputFiles({ name: 'qa-shared-policy.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') });
  await expect(page.getByRole('button', { name: 'qa-shared-policy.png' }).first()).toBeVisible();
  const saved = await saveDesign(page, source._id);
  const upload = saved.layers.find((layer) => layer.name === 'qa-shared-policy.png')!;
  expect(upload.content).toContain('/uploads/ai_references/');
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'JSON', exact: true }).click();
  const exported = JSON.parse(await readFile((await (await downloading).path())!, 'utf8'));

  const otherContext = await browser.newContext({ baseURL: 'http://127.0.0.1:5174' });
  try {
    const other = await otherContext.newPage();
    await loginQaUser(other, 'qa.admin@atelier.local');
    const crossOwnerOperation = await other.evaluate(async (designId) => {
      const raw = localStorage.getItem('atelier_patron_auth'); const token = raw ? (JSON.parse(raw)?.state?.token || JSON.parse(raw)?.state?.accessToken) : null;
      return (await fetch('http://127.0.0.1:5002/api/admin/ai/designs/operations', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ designId, request: 'QA edit' }) })).status;
    }, source._id);
    expect(crossOwnerOperation).toBe(404);
    const publicAsset = await other.request.get(upload.content);
    expect(publicAsset.status()).toBe(200);
    const targetName = `${sourceName} B target`;
    const target = await createIsolatedDesign(other, targetName, []);
    await openDesignInStudio(other, targetName);
    await other.getByLabel('Chọn JSON để nhập').setInputFiles({ name: 'shared.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(exported)) });
    await other.getByRole('button', { name: 'Áp dụng JSON', exact: true }).click();
    const imported = await saveDesign(other, target._id);
    expect(imported.layers.some((layer) => layer.content === upload.content)).toBeTruthy();
    expect(imported._id).not.toBe(source._id);
  } finally { await otherContext.close(); }

  const customerContext = await browser.newContext({ baseURL: 'http://127.0.0.1:5174' });
  try {
    const customer = await customerContext.newPage();
    await loginQaUser(customer, 'qa.customer.a@atelier.local');
    const denied = await customer.evaluate(async (body) => {
      const raw = localStorage.getItem('atelier_patron_auth'); const token = raw ? (JSON.parse(raw)?.state?.token || JSON.parse(raw)?.state?.accessToken) : null;
      const response = await fetch('http://127.0.0.1:5002/api/admin/ai/designs', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
      return response.status;
    }, exported.project);
    expect(denied).toBe(403);
    const operationDenied = await customer.evaluate(async (designId) => {
      const raw = localStorage.getItem('atelier_patron_auth'); const token = raw ? (JSON.parse(raw)?.state?.token || JSON.parse(raw)?.state?.accessToken) : null;
      return (await fetch('http://127.0.0.1:5002/api/admin/ai/designs/operations', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ designId, request: 'QA edit' }) })).status;
    }, source._id);
    expect(operationDenied).toBe(403);
  } finally { await customerContext.close(); }
  expect((await readDesign(page, source._id)).layers.some((layer) => layer.content === upload.content)).toBeTruthy();
});
