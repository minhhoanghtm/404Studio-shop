import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { createIsolatedDesign, loginQaAdmin, openDesignInStudio } from './support/creativeStudioQa';
import { getQaBackendOrigin } from './support/qaEnv';

test('raster exports contain the actual uploaded image', async ({ page }, testInfo) => {
  test.skip(process.env.QA_E2E_ENABLED !== 'true', 'Requires isolated QA.');
  const name = `QA Uploaded Raster ${testInfo.project.name} ${Date.now()}`;
  await loginQaAdmin(page);
  await createIsolatedDesign(page, name, []);
  await openDesignInStudio(page, name);
  const image = await page.evaluate(() => {
    const canvas = document.createElement('canvas'); canvas.width = 80; canvas.height = 80;
    const context = canvas.getContext('2d')!; context.fillStyle = '#ef1428'; context.fillRect(0, 0, 80, 80);
    return canvas.toDataURL('image/png').split(',')[1];
  });
  await page.getByLabel('Chọn ảnh để tải lên').setInputFiles({ name: 'qa-red-raster.png', mimeType: 'image/png', buffer: Buffer.from(image, 'base64') });
  await expect(page.getByRole('button', { name: 'qa-red-raster.png' }).first()).toBeVisible();
  for (const format of [{ button: 'PNG', mime: 'image/png', ext: 'png' }, { button: 'JPG', mime: 'image/jpeg', ext: 'jpg' }, { button: 'WebP', mime: 'image/webp', ext: 'webp' }]) {
    const downloading = page.waitForEvent('download', { timeout: 20_000 });
    await page.getByRole('button', { name: format.button, exact: true }).click();
    const download = await downloading;
    const exportedPath = testInfo.outputPath(`uploaded-raster.${format.ext}`);
    await download.saveAs(exportedPath);
    const bytes = await readFile(exportedPath);
    const pixel = await page.evaluate(async ({ base64, mime }) => {
    const img = new Image(); img.src = `data:${mime};base64,${base64}`;
    await new Promise<void>((resolve, reject) => { img.onload = () => resolve(); img.onerror = () => reject(new Error('Cannot decode PNG')); });
    const canvas = document.createElement('canvas'); canvas.width = img.width; canvas.height = img.height;
    const context = canvas.getContext('2d')!; context.drawImage(img, 0, 0);
    return Array.from(context.getImageData(540, 570, 1, 1).data);
    }, { base64: bytes.toString('base64'), mime: format.mime });
    for (const [index, expected] of [239, 20, 40, 255].entries()) expect(Math.abs(pixel[index] - expected)).toBeLessThanOrEqual(format.ext === 'png' ? 0 : 5);
  }
  await page.route('**/uploads/ai_references/**', (route) => route.fulfill({ status: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'image/png' }, body: '<html>not an image</html>' }));
  await page.getByRole('button', { name: 'PNG', exact: true }).click();
  await expect(page.getByText('Không thể xuất vì một ảnh không khả dụng hoặc không cho phép CORS. Hãy kiểm tra asset và thử lại.')).toBeVisible();
  await page.unroute('**/uploads/ai_references/**');
  let redirectRequested = false;
  const backendOrigin = getQaBackendOrigin();
  await page.route('**/uploads/ai_references/**', (route) => { redirectRequested = true; return route.fulfill({ status: 302, headers: { 'Access-Control-Allow-Origin': '*', Location: `${backendOrigin}/redirect-target-must-not-load` } }); });
  let followed = false;
  await page.route('**/redirect-target-must-not-load', (route) => { followed = true; return route.abort(); });
  await page.getByRole('button', { name: 'PNG', exact: true }).click();
  await expect.poll(() => redirectRequested).toBe(true);
  await expect(page.getByText('Không thể xuất vì một ảnh không khả dụng hoặc không cho phép CORS. Hãy kiểm tra asset và thử lại.')).toBeVisible();
  expect(followed).toBe(false);
});
