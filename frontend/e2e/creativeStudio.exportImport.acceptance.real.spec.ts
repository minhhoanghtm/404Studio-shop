import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { createIsolatedDesign, loginQaAdmin, openDesignInStudio, readDesign, saveDesign, seededLayer, type QaLayer } from './support/creativeStudioQa';
import { getQaApiUrl } from './support/qaEnv';

const enabled = process.env.QA_E2E_ENABLED === 'true';

const decodeRaster = async (page: Page, filePath: string, mimeType: string) => {
  const base64 = (await readFile(filePath)).toString('base64');
  return page.evaluate(async ({ base64, mimeType }) => {
    const image = new Image();
    image.src = `data:${mimeType};base64,${base64}`;
    await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error('Raster decode failed.')); });
    const canvas = document.createElement('canvas'); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d'); if (!context) throw new Error('Canvas unavailable.');
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    let minimum = 255; let maximum = 0; let nonTransparent = 0;
    for (let index = 0; index < pixels.length; index += Math.max(4, Math.floor(pixels.length / 240))) {
      minimum = Math.min(minimum, pixels[index], pixels[index + 1], pixels[index + 2]);
      maximum = Math.max(maximum, pixels[index], pixels[index + 1], pixels[index + 2]);
      if (pixels[index + 3] > 0) nonTransparent += 1;
    }
    return { width: image.naturalWidth, height: image.naturalHeight, minimum, maximum, nonTransparent };
  }, { base64, mimeType });
};

test.describe('Creative Studio — focused raster export and editable JSON import', () => {
  test.skip(!enabled, 'Set QA_E2E_ENABLED=true only after isolated QA services and fixtures are ready.');

  test('exports real raster formats and imports a validated editable round trip', async ({ page }, testInfo) => {
    const originalName = `QA Export Source ${testInfo.project.name} ${Date.now()}`;
    const importTargetName = `${originalName} import target`;
    const layers: QaLayer[] = [
      seededLayer({ id: 'export-text', type: 'text', name: 'QA Export Text', x: 130, y: 160, width: 800, height: 120, zIndex: 1, content: 'XIN CHÀO VIỆT NAM', styles: { fontFamily: 'Inter', fontSize: 54, fontWeight: '700', color: '#FFFFFF', textAlign: 'center' } }),
      seededLayer({ id: 'export-image', type: 'image', name: 'QA Export Image', x: 330, y: 360, width: 260, height: 260, zIndex: 2, content: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL6LwAAAABJRU5ErkJggg==', styles: { cropZoom: 1.4, cropX: 25, cropY: 75, objectFit: 'cover' } }),
      seededLayer({ id: 'export-shape', type: 'shape', name: 'QA Export Shape', x: 650, y: 450, width: 220, height: 180, zIndex: 3, rotation: 18, opacity: 0.65, styles: { backgroundColor: '#D4AF37', borderRadius: 24 } }),
      seededLayer({ id: 'export-hidden', type: 'text', name: 'QA Export Hidden', x: 180, y: 980, width: 600, height: 80, zIndex: 4, visible: false, content: 'KHÔNG ĐƯỢC XUẤT' }),
      seededLayer({ id: 'export-group', type: 'group', name: 'QA Export Group', x: 130, y: 160, width: 740, height: 470, zIndex: 4, content: JSON.stringify(['export-text', 'export-image', 'export-shape']), styles: {} }),
    ];

    await loginQaAdmin(page);
    const source = await createIsolatedDesign(page, originalName, layers);
    await openDesignInStudio(page, originalName);

    const downloads = [
      { button: 'PNG', extension: '.png', mime: 'image/png', signature: (bytes: Buffer) => bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) },
      { button: 'JPG', extension: '.jpg', mime: 'image/jpeg', signature: (bytes: Buffer) => bytes[0] === 0xff && bytes[1] === 0xd8 },
      { button: 'WebP', extension: '.webp', mime: 'image/webp', signature: (bytes: Buffer) => bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP' },
    ];
    for (const expected of downloads) {
      const waiting = page.waitForEvent('download');
      await page.getByRole('button', { name: expected.button, exact: true }).click();
      const download = await waiting; const filePath = await download.path();
      expect(download.suggestedFilename()).toMatch(new RegExp(`${expected.extension.replace('.', '\\.')}$`, 'i'));
      expect(filePath).toBeTruthy();
      const bytes = await readFile(filePath!);
      expect(bytes.length).toBeGreaterThan(500);
      expect(expected.signature(bytes)).toBeTruthy();
      const decoded = await decodeRaster(page, filePath!, expected.mime);
      expect(decoded.width).toBe(1080); expect(decoded.height).toBe(1350);
      expect(decoded.nonTransparent).toBeGreaterThan(0);
      expect(decoded.maximum - decoded.minimum).toBeGreaterThan(15);
    }

    const svgWaiting = page.waitForEvent('download');
    await page.getByRole('button', { name: 'SVG', exact: true }).click();
    const svg = await svgWaiting; const svgPath = await svg.path();
    const svgContents = await readFile(svgPath!, 'utf8');
    expect(svgContents).toContain('XIN CHÀO VIỆT NAM');
    expect(svgContents).not.toContain('KHÔNG ĐƯỢC XUẤT');
    expect(svgContents).not.toContain('data-selection');
    expect(svgContents).not.toContain('data-transform-handles');
    expect(svgContents).not.toContain('data-multi-selection');

    const jsonWaiting = page.waitForEvent('download');
    await page.getByRole('button', { name: 'JSON', exact: true }).click();
    const json = await jsonWaiting; const jsonPath = await json.path();
    const jsonPayload = JSON.parse(await readFile(jsonPath!, 'utf8'));
    expect(jsonPayload.schemaVersion).toBe(2);
    expect(jsonPayload.project.layers.find((layer: QaLayer) => layer.id === 'export-image').styles.cropZoom).toBe(1.4);

    const target = await createIsolatedDesign(page, importTargetName, [seededLayer({ id: 'target-layer', type: 'text', name: 'Target layer', content: 'GIỮ NGUYÊN TRƯỚC KHI XÁC NHẬN' })]);
    await openDesignInStudio(page, importTargetName);
    await page.getByLabel('Chọn JSON để nhập').setInputFiles({ name: 'round-trip.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(jsonPayload)) });
    await expect(page.getByRole('status')).toContainText(originalName);
    await expect(page.getByLabel('Tên thiết kế')).toHaveValue(importTargetName);
    await page.getByRole('button', { name: 'Áp dụng JSON', exact: true }).click();
    await expect(page.getByLabel('Tên thiết kế')).toHaveValue(originalName);
    const imported = await saveDesign(page, target._id);
    expect(imported._id).toBe(target._id);
    const importedGroup = imported.layers.find((layer) => layer.type === 'group');
    expect(importedGroup).toBeTruthy();
    const importedIds = new Set(imported.layers.map((layer) => layer.id));
    expect((JSON.parse(importedGroup!.content) as string[]).every((id) => importedIds.has(id))).toBeTruthy();
    expect(imported.layers.find((layer) => layer.id === 'export-image')?.styles.cropZoom).toBe(1.4);
    await page.reload();
    await expect(page.getByLabel('Tên thiết kế')).toHaveValue(originalName);

    await page.getByRole('button', { name: 'QA Export Text', exact: true }).click();
    await page.getByRole('textbox', { name: 'Nội dung', exact: true }).fill('CHỈNH SỬA SAU IMPORT');
    await page.getByLabel('x layer').fill('175');
    const edited = await saveDesign(page, target._id);
    expect(edited.layers.find((layer) => layer.id === 'export-text')?.content).toBe('CHỈNH SỬA SAU IMPORT');
    await page.reload();
    const secondJsonWaiting = page.waitForEvent('download');
    await page.getByRole('button', { name: 'JSON', exact: true }).click();
    const secondJson = JSON.parse(await readFile((await (await secondJsonWaiting).path())!, 'utf8'));
    expect(secondJson.project.layers.find((layer: QaLayer) => layer.id === 'export-text').content).toBe('CHỈNH SỬA SAU IMPORT');
    expect(secondJson.project.layers.find((layer: QaLayer) => layer.id === 'export-text').x).toBe(175);
    expect(secondJson.project.layers.find((layer: QaLayer) => layer.id === 'export-image').styles.cropZoom).toBe(1.4);
    expect(secondJson.project.layers.find((layer: QaLayer) => layer.id === 'export-shape').rotation).toBe(18);
    expect(secondJson.project.layers.find((layer: QaLayer) => layer.id === 'export-shape').opacity).toBe(0.65);
    expect(secondJson.project.layers.find((layer: QaLayer) => layer.id === 'export-hidden').visible).toBe(false);
    expect(JSON.parse(secondJson.project.layers.find((layer: QaLayer) => layer.type === 'group').content)).toEqual(['export-text', 'export-image', 'export-shape']);

    await page.getByLabel('Chọn JSON để nhập').setInputFiles({ name: 'invalid.json', mimeType: 'application/json', buffer: Buffer.from('{not json}') });
    await expect(page.getByRole('alert')).toContainText('Không thể đọc JSON import');

    const qaApiUrl = getQaApiUrl();
    const serverValidation = await page.evaluate(async ({ designId, name, qaApiUrl }) => {
      const raw = localStorage.getItem('atelier_patron_auth'); const token = raw ? (JSON.parse(raw)?.state?.token || JSON.parse(raw)?.state?.accessToken) : null;
      const duplicate = { id: 'duplicate-id', type: 'text', name: 'duplicate', x: 0, y: 0, width: 100, height: 100, rotation: 0, opacity: 1, zIndex: 1, visible: true, locked: false, content: 'x', styles: {} };
      const response = await fetch(`${qaApiUrl}/admin/ai/designs`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify({ _id: designId, name, preset: 'instagram_portrait', width: 1080, height: 1350, background: { type: 'color', value: '#FFFFFF' }, layers: [duplicate, duplicate] }) });
      return response.status;
    }, { designId: target._id, name: originalName, qaApiUrl });
    expect(serverValidation).toBe(400);
    const reloaded = await readDesign(page, target._id);
    expect(reloaded.layers.some((layer) => layer.id === 'duplicate-id')).toBeFalsy();
    expect(source._id).not.toBe(target._id);
  });
});
