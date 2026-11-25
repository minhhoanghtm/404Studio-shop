import { expect, test } from '@playwright/test';
import { createIsolatedDesign, loginQaAdmin, openDesignInStudio, readDesign, seededLayer } from './support/creativeStudioQa';
import { getQaApiUrl, getQaBackendOrigin } from './support/qaEnv';

test('rejects unsafe background image imports and direct writes without changing the design', async ({ page }, testInfo) => {
  test.skip(process.env.QA_E2E_ENABLED !== 'true', 'Requires the isolated QA stack.');
  const name = `QA Import Security ${testInfo.project.name} ${Date.now()}`;
  await loginQaAdmin(page);
  const original = await createIsolatedDesign(page, name, [seededLayer({ id: 'safe', type: 'text', name: 'Safe title', content: 'SAFE' })]);
  await openDesignInStudio(page, name);
  const unsafeLayer = { ...seededLayer({ id: 'bad-background', type: 'image', name: 'Unsafe background', content: 'javascript:alert(1)' }), type: 'background' };
  const candidate = { schemaVersion: 2, project: { ...original, width: 1080, height: 1350, preset: 'instagram_portrait', layers: [unsafeLayer] } };
  await page.getByLabel('Chọn JSON để nhập').setInputFiles({ name: 'unsafe.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(candidate)) });
  await expect(page.getByRole('alert')).toContainText('không an toàn');
  await expect(page.getByLabel('Tên thiết kế')).toHaveValue(name);
  for (const invalid of [
    { ...candidate, schemaVersion: 999 },
    { ...candidate, project: { ...candidate.project, schemaVersion: 999, layers: [] } },
    { ...candidate, project: { ...candidate.project, layers: [{ ...candidate.project.layers[0], type: 'text', content: 'safe', styles: { cropZoom: 9 } }] } },
    { ...candidate, project: { ...candidate.project, layers: [{ ...candidate.project.layers[0], type: 'text', content: '<script>alert(1)</script>', styles: {} }] } },
    { ...candidate, project: { ...candidate.project, layers: [{ ...candidate.project.layers[0], type: 'text', content: 'safe', styles: { fontSize: -1 } }] } },
  ]) {
    await page.getByLabel('Chọn JSON để nhập').setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(invalid)) });
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Áp dụng JSON', exact: true })).toHaveCount(0);
    await expect(page.getByLabel('Tên thiết kế')).toHaveValue(name);
  }
  const validation = page.waitForResponse((response) => response.url().endsWith('/api/admin/ai/designs/validate') && response.request().method() === 'POST');
  const unknownAsset = { ...candidate, project: { ...candidate.project, layers: [{ ...candidate.project.layers[0], type: 'image', content: 'https://untrusted.invalid/image.png' }] } };
  await page.getByLabel('Chọn JSON để nhập').setInputFiles({ name: 'untrusted.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(unknownAsset)) });
  expect((await validation).status()).toBe(400);
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Áp dụng JSON', exact: true })).toHaveCount(0);
  await expect(page.getByLabel('Tên thiết kế')).toHaveValue(name);
  const qaApiUrl = getQaApiUrl();
  const backendOrigin = getQaBackendOrigin();
  const backendPort = new URL(backendOrigin).port;
  const status = await page.evaluate(async ({ body, qaApiUrl }) => {
    const raw = localStorage.getItem('atelier_patron_auth');
    const token = raw ? (JSON.parse(raw)?.state?.token || JSON.parse(raw)?.state?.accessToken) : null;
    const response = await fetch(`${qaApiUrl}/admin/ai/designs`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
    return response.status;
  }, { body: candidate.project, qaApiUrl });
  expect(status).toBe(400);
  for (const badUrl of ['https://untrusted.invalid/image.png', 'https://user:password@example.com/image.png', 'file:///etc/passwd', 'javascript:alert(1)', `${backendOrigin}/uploads/ai_references/%2e%2e/secret.png`, `${backendOrigin}/uploads/ai_references/qa-nonexistent.png`, `http://127.0.0.1.evil.invalid:${backendPort}/uploads/ai_references/qa-nonexistent.png`]) {
    const rejected = await page.evaluate(async ({ project, badUrl, qaApiUrl }) => {
      const raw = localStorage.getItem('atelier_patron_auth');
      const token = raw ? (JSON.parse(raw)?.state?.token || JSON.parse(raw)?.state?.accessToken) : null;
      const body = { ...project, background: { type: 'image', value: badUrl }, layers: [] };
      return (await fetch(`${qaApiUrl}/admin/ai/designs`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body) })).status;
    }, { project: candidate.project, badUrl, qaApiUrl });
    expect(rejected).toBe(400);
  }
  const cropStatus = await page.evaluate(async ({ project, qaApiUrl }) => {
    const raw = localStorage.getItem('atelier_patron_auth'); const token = raw ? (JSON.parse(raw)?.state?.token || JSON.parse(raw)?.state?.accessToken) : null;
    const body = { ...project, layers: [{ ...project.layers[0], type: 'text', content: 'safe', styles: { cropZoom: 9 } }] };
    return (await fetch(`${qaApiUrl}/admin/ai/designs`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body) })).status;
  }, { project: candidate.project, qaApiUrl });
  expect(cropStatus).toBe(400);
  expect((await readDesign(page, original._id)).layers.map((item) => item.id)).toEqual(['safe']);
});
