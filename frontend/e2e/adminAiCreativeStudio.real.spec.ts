import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { createIsolatedDesign, openDesignInStudio, seededLayer } from './support/creativeStudioQa';
import { getQaBackendOrigin } from './support/qaEnv';

const enabled = process.env.QA_E2E_ENABLED === 'true';
const password = process.env.QA_SEED_PASSWORD;

test.describe('Admin AI + Creative Studio — authenticated QA', () => {
  test.skip(!enabled, 'Set QA_E2E_ENABLED=true only after isolated QA services and fixtures are ready.');
  test('signs in through the UI and edits a layered project', async ({ page }, testInfo) => {
    test.skip(!password, 'QA_SEED_PASSWORD is required.');
    await page.goto('/login');
    const acceptCookies = page.getByRole('button', { name: 'Chấp nhận tất cả' });
    if (await acceptCookies.isVisible()) await acceptCookies.click();
    await page.getByPlaceholder('patron@domain.com').fill('qa.superadmin@atelier.local');
    await page.getByPlaceholder('Tối thiểu 8 ký tự').fill(password);
    await page.getByRole('button', { name: 'Đăng Nhập', exact: true }).click();
    await expect(page).toHaveURL(/\/(admin|profile|)$/);
    const designName = `QA Legacy Editor ${testInfo.project.name} ${Date.now()}`;
    await createIsolatedDesign(page, designName, [seededLayer({ id: 'qa-caption', type: 'text', name: 'QA Caption', content: 'QA Caption' })]);
    await openDesignInStudio(page, designName);
    await expect(page.getByRole('button', { name: 'Creative Studio (Poster & Banner)' })).toBeVisible();
    await expect(page.getByLabel('Tên thiết kế')).toBeVisible();
    await page.getByRole('button', { name: 'Văn bản', exact: true }).click();
    const content = page.getByLabel('Nội dung');
    await expect(content).toBeVisible();
    const persistedText = `QA e2e layer ${testInfo.project.name}`;
    await content.fill(persistedText);
    const productPanel = page.locator('aside').filter({ has: page.getByLabel('Tìm sản phẩm') });
    await productPanel.getByLabel('Danh mục sản phẩm').focus();
    await productPanel.getByLabel('Danh mục sản phẩm').selectOption({ label: 'QA Tailoring' });
    await productPanel.getByLabel('Tìm sản phẩm').fill('QA');
    await productPanel.getByRole('button', { name: 'Tải Product Assets' }).click();
    await productPanel.getByLabel('Biến thể QA Silk Blazer').selectOption({ label: 'Ivory · S' });
    await productPanel.getByRole('button', { name: 'Thêm QA Silk Blazer' }).click();
    const selectedProducts = productPanel.getByLabel('Chọn sản phẩm');
    await selectedProducts.nth(0).check();
    await selectedProducts.nth(1).check();
    await productPanel.getByRole('button', { name: 'Thêm sản phẩm đã chọn' }).click();
    const assetLibrary = page.locator('aside').filter({ has: page.getByRole('button', { name: 'Tải Asset Library' }) });
    await assetLibrary.getByRole('button', { name: 'Tải Asset Library' }).click();
    await expect(assetLibrary.getByText('QA Winter Asset Banner', { exact: true })).toBeVisible();
    await expect(assetLibrary.locator('img[alt="Xem trước QA Winter Asset Banner"]')).toBeVisible();
    await assetLibrary.getByLabel('Loại asset').selectOption('banner');
    await assetLibrary.getByLabel('Tìm asset').fill('Winter');
    await expect(assetLibrary.getByText('QA Winter Asset Banner', { exact: true })).toBeVisible();
    await assetLibrary.getByRole('button', { name: 'Thêm asset QA Winter Asset Banner' }).click();
    await assetLibrary.getByLabel('Tìm asset').fill('Atelier');
    await expect(assetLibrary.getByText('QA Atelier Asset Banner', { exact: true })).toBeVisible();
    await assetLibrary.getByRole('button', { name: 'Thay thế ảnh bằng QA Atelier Asset Banner' }).click();
    await page.getByLabel('Chọn ảnh để tải lên').setInputFiles({
      name: 'qa-upload.png',
      mimeType: 'image/png',
      buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAEklEQVR4nGO4q8SAFWEXHbQSACB/P8HVXv3XAAAAAElFTkSuQmCC', 'base64'),
    });
    await expect(page.getByRole('button', { name: 'qa-upload.png' }).first()).toBeVisible();
    await page.getByLabel('Phóng to crop').fill('1.5');
    await page.getByLabel('Vị trí crop ngang').fill('25');
    await page.getByLabel('Vị trí crop dọc').fill('75');
    const resizeHandle = page.locator('circle[data-handle="resize"]');
    await resizeHandle.scrollIntoViewIfNeeded();
    const resizeBox = await resizeHandle.boundingBox();
    if (!resizeBox) throw new Error('Resize handle is not rendered.');
    await page.mouse.move(resizeBox.x + resizeBox.width / 2, resizeBox.y + resizeBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(resizeBox.x + resizeBox.width / 2 + 24, resizeBox.y + resizeBox.height / 2 + 18, { steps: 4 });
    await page.mouse.up();
    const rotateHandle = page.locator('circle[data-handle="rotate"]');
    const rotateBox = await rotateHandle.boundingBox();
    if (!rotateBox) throw new Error('Rotation handle is not rendered.');
    await page.mouse.move(rotateBox.x + rotateBox.width / 2, rotateBox.y + rotateBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(rotateBox.x + rotateBox.width / 2 + 80, rotateBox.y + rotateBox.height / 2 + 5, { steps: 6 });
    await page.mouse.up();
    if (testInfo.project.name === 'Mobile Viewport') await page.getByLabel('rotation layer').fill('30');
    await page.getByLabel('Chọn layer QA Caption').check();
    await expect(page.getByLabel('Multi-selection controls')).toBeVisible();
    await page.getByRole('button', { name: 'Group', exact: true }).click();
    const saveResponse = page.waitForResponse((response) =>
      response.url().includes('/api/admin/ai/designs') &&
      response.request().method() === 'POST' &&
      response.ok()
    );
    await page.getByRole('button', { name: 'Lưu' }).click();
    await saveResponse;
    await page.reload();
    await expect(page.locator('svg text').filter({ hasText: persistedText }).first()).toBeVisible();
    await expect(page.locator('svg text').filter({ hasText: 'QA Silk Blazer' }).first()).toBeVisible();
    await expect(page.locator('svg text').filter({ hasText: 'QA Cashmere Coat' }).first()).toBeVisible();
    const svgDownload = page.waitForEvent('download');
    await page.getByRole('button', { name: 'SVG', exact: true }).click();
    const svg = await svgDownload;
    expect(svg.suggestedFilename()).toMatch(/\.svg$/);
    const svgPath = await svg.path();
    expect(svgPath).toBeTruthy();
    const svgContents = await readFile(svgPath!, 'utf8');
    expect(svgContents).toContain('<svg');
    expect(svgContents).not.toContain('data-selection');
    expect(svgContents).toContain('photo-1483985988355-763728e1935b');
    const jsonDownload = page.waitForEvent('download');
    await page.getByRole('button', { name: 'JSON', exact: true }).click();
    const json = await jsonDownload;
    expect(json.suggestedFilename()).toMatch(/\.json$/);
    const jsonPath = await json.path();
    expect(jsonPath).toBeTruthy();
    const jsonContents = JSON.parse(await readFile(jsonPath!, 'utf8'));
    expect(jsonContents.project.layers.some((layer: { content: string }) => layer.content === persistedText)).toBeTruthy();
    expect(jsonContents.project.layers.some((layer: { content: string }) => layer.content.includes('photo-1483985988355-763728e1935b'))).toBeTruthy();
    const uploadedLayer = jsonContents.project.layers.filter((layer: { name: string }) => layer.name === 'qa-upload.png').at(-1);
    const backendHostPort = new URL(getQaBackendOrigin()).host;
    expect(uploadedLayer.content).toContain(`${backendHostPort}/uploads/ai_references/`);
    expect(uploadedLayer.styles.cropZoom).toBe(1.5);
    expect(uploadedLayer.styles.cropX).toBe(25);
    expect(uploadedLayer.styles.cropY).toBe(75);
    expect(uploadedLayer.width).toBeGreaterThan(840);
    expect(uploadedLayer.height).toBeGreaterThan(620);
    expect(Math.abs(uploadedLayer.rotation)).toBeGreaterThan(1);
    const groupedLayer = jsonContents.project.layers.find((layer: { type: string; content: string }) => layer.type === 'group');
    expect(groupedLayer).toBeTruthy();
    expect(JSON.parse(groupedLayer.content)).toHaveLength(2);
  });
});
