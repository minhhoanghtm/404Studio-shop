import { expect, test } from '@playwright/test';
import { createIsolatedDesign, loginQaAdmin, readDesign, seededLayer } from './support/creativeStudioQa';
import { getQaApiUrl } from './support/qaEnv';

test('rejects malformed design updates without modifying the isolated project', async ({ page }, info) => {
  test.skip(process.env.QA_E2E_ENABLED !== 'true', 'Requires isolated QA.');
  const name = `QA Import Matrix ${info.project.name} ${Date.now()}`;
  await loginQaAdmin(page);
  const layer = seededLayer({ id: 'safe', type: 'text', name: 'Safe', content: 'original' });
  const design = await createIsolatedDesign(page, name, [layer]);
  const qaApiUrl = getQaApiUrl();
  const results = await page.evaluate(async ({ designId, name, layer, qaApiUrl }) => {
    const raw = localStorage.getItem('atelier_patron_auth'); const token = raw ? (JSON.parse(raw)?.state?.token || JSON.parse(raw)?.state?.accessToken) : null;
    const base = { _id: designId, name, preset: 'instagram_portrait', width: 1080, height: 1350, background: { type: 'color', value: '#fff' }, layers: [layer] };
    const group = { ...layer, id: 'group', type: 'group', content: '["safe","missing"]' };
    const cases = [
      (({ width, ...rest }) => rest)(base),
      { ...base, schemaVersion: 999 }, { ...base, width: 0 }, { ...base, height: 10001 },
      { ...base, layers: [{ ...layer, id: '' }] }, { ...base, layers: [{ ...layer, type: 'unknown' }] },
      { ...base, layers: [layer, layer] }, { ...base, layers: [layer, group] },
      { ...base, layers: [layer, { ...group, content: '["safe","group"]' }] },
      { ...base, layers: [layer, { ...group, content: '["safe","safe"]' }] },
      { ...base, layers: [layer, { ...layer, id: 'second' }, { ...group, id: 'inner', content: '["safe","second"]' }, { ...group, id: 'outer', content: '["safe","inner"]' }] },
      { ...base, background: { type: 'unknown', value: '#fff' } },
      { ...base, layers: [{ ...layer, width: -1 }] }, { ...base, layers: [{ ...layer, rotation: null }] },
      { ...base, layers: [{ ...layer, opacity: 2 }] }, { ...base, layers: [{ ...layer, styles: { cropZoom: 5 } }] },
      { ...base, layers: Array.from({ length: 201 }, (_, index) => ({ ...layer, id: `layer_${index}` })) },
      { ...base, background: { type: 'image', value: 'https://untrusted.invalid/image.png' } },
      { ...base, layers: [{ ...layer, type: 'image', content: 'data:image/svg+xml;base64,PHN2Zy8+' }] },
      { ...base, layers: [{ ...layer, styles: JSON.parse('{"__proto__":{"polluted":true}}') }] },
      { ...base, layers: [{ ...layer, type: 'image', content: 'data:image/png;base64,PGh0bWw+' }] },
      { ...base, layers: [{ ...layer, content: '<script>alert(1)</script>' }] },
      { ...base, layers: [{ ...layer, styles: { backgroundColor: 'url(https://untrusted.invalid/x)' } }] },
      { ...base, layers: [{ ...layer, styles: { fontSize: -1 } }] },
      { ...base, layers: [{ ...layer, styles: { color: 'not-a-color' } }] },
      { ...base, background: { type: 'color', value: 'not-a-color' } },
      { ...base, background: { type: 'gradient', value: '#fff', secondaryValue: 'not-a-color' } },
      { ...base, layers: [{ ...layer, scale: -1 }] },
      { ...base, layers: [{ ...layer, styles: { scaleX: 0 } }] },
      { ...base, layers: [{ ...layer, arbitraryField: 'silently discarded' }] },
      { ...base, layers: [{ ...layer, styles: { arbitraryStyle: 'silently discarded' } }] },
      { ...base, arbitraryField: 'silently discarded' },
      { ...base, background: { type: 'color', value: '#fff', arbitraryField: 'silently discarded' } },
    ];
    const statuses = [];
    for (const body of cases) {
      const response = await fetch(`${qaApiUrl}/admin/ai/designs`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body) });
      statuses.push(response.status);
    }
    const oversized = await fetch(`${qaApiUrl}/admin/ai/designs`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ ...base, padding: 'x'.repeat(1024 * 1024) }) });
    return { statuses, oversized: oversized.status };
  }, { designId: design._id, name, layer, qaApiUrl });
  expect(results.statuses).toHaveLength(33);
  expect(results.statuses).toEqual(Array(33).fill(400));
  expect(results.oversized).toBe(413);
  const after = await readDesign(page, design._id);
  expect(after.name).toBe(name);
  expect(after.layers).toHaveLength(1);
  expect(after.layers[0].content).toBe('original');
  expect(after.versionHistory?.length || 0).toBe(design.versionHistory?.length || 0);
});
