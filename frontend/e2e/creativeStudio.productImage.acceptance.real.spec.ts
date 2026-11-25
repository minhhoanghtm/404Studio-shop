import { expect, test } from '@playwright/test';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile } from 'node:fs/promises';
import { createIsolatedDesign, loginQaAdmin, openDesignInStudio, saveDesign } from './support/creativeStudioQa';

test('product-level image persists and appears in raster, SVG and JSON exports', async ({ page }, info) => {
  test.skip(process.env.QA_E2E_ENABLED !== 'true', 'Requires isolated QA.');
  test.setTimeout(120_000);
  const runId = String(Date.now());
  await loginQaAdmin(page);
  const sourceName = `QA Product Image Source ${info.project.name} ${runId}`;
  const source = await createIsolatedDesign(page, sourceName, []);
  await openDesignInStudio(page, sourceName);
  const png = await page.evaluate(() => { const canvas = document.createElement('canvas'); canvas.width = 80; canvas.height = 80; const ctx = canvas.getContext('2d')!; ctx.fillStyle = '#ef1428'; ctx.fillRect(0, 0, 80, 80); return canvas.toDataURL('image/png').split(',')[1]; });
  await page.getByLabel('Chọn ảnh để tải lên').setInputFiles({ name: 'qa-product-level.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') });
  await expect(page.getByRole('button', { name: 'qa-product-level.png' }).first()).toBeVisible();
  const uploaded = await saveDesign(page, source._id);
  const imageUrl = uploaded.layers.find((layer) => layer.name === 'qa-product-level.png')!.content;
  await promisify(execFile)('node', ['--env-file=.env.qa', 'src/scripts/create-isolated-qa-catalog-fixture.js', runId, imageUrl], { cwd: '../backend', timeout: 15000 });
  const name = sourceName;
  const design = source;
  await page.getByTitle('Xóa', { exact: true }).click();
  await expect(page.getByRole('button', { name: 'qa-product-level.png' })).toHaveCount(0);
  const panel = page.locator('aside').filter({ has: page.getByLabel('Tìm sản phẩm') });
  await panel.getByLabel('Tìm sản phẩm').fill(`QA Product Image ${runId}`);
  await panel.getByRole('button', { name: 'Tải Product Assets' }).click();
  await panel.getByRole('button', { name: `Thêm QA Product Image ${runId}` }).click();
  const saved = await saveDesign(page, design._id);
  expect(saved.layers.some((layer) => layer.type === 'product' && layer.content === imageUrl)).toBe(true);
  await page.reload();
  await expect(page.getByLabel('Tên thiết kế')).toHaveValue(name);
  for (const item of [{ button: 'PNG', mime: 'image/png', ext: 'png' }, { button: 'JPG', mime: 'image/jpeg', ext: 'jpg' }, { button: 'WebP', mime: 'image/webp', ext: 'webp' }]) {
    const pending = page.waitForEvent('download'); await page.getByRole('button', { name: item.button, exact: true }).click();
    const bytes = await readFile((await (await pending).path())!);
    const pixel = await page.evaluate(async ({ encoded, mime }) => { const image = new Image(); image.src = `data:${mime};base64,${encoded}`; await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error('Invalid raster')); }); const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height; const ctx = canvas.getContext('2d')!; ctx.drawImage(image, 0, 0); return Array.from(ctx.getImageData(540, 610, 1, 1).data); }, { encoded: bytes.toString('base64'), mime: item.mime });
    for (const [index, expected] of [239, 20, 40, 255].entries()) expect(Math.abs(pixel[index] - expected)).toBeLessThanOrEqual(item.ext === 'png' ? 0 : 5);
  }
  for (const extension of ['SVG', 'JSON']) {
    const pending = page.waitForEvent('download'); await page.getByRole('button', { name: extension, exact: true }).click();
    const contents = await readFile((await (await pending).path())!, 'utf8');
    expect(contents).toContain(imageUrl.replaceAll('&', extension === 'SVG' ? '&amp;' : '&'));
  }
});
