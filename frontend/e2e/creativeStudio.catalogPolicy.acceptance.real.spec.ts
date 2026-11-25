import { expect, test } from '@playwright/test';
import { createIsolatedDesign, loginQaAdmin, openDesignInStudio, saveDesign } from './support/creativeStudioQa';

test('accepts real QA product variants and banner images on an isolated design', async ({ page }, info) => {
  test.skip(process.env.QA_E2E_ENABLED !== 'true', 'Requires isolated QA.');
  const name = `QA Catalog Policy ${info.project.name} ${Date.now()}`;
  await loginQaAdmin(page);
  const design = await createIsolatedDesign(page, name, []);
  await openDesignInStudio(page, name);
  const products = page.locator('aside').filter({ has: page.getByLabel('Tìm sản phẩm') });
  await products.getByLabel('Danh mục sản phẩm').focus();
  await products.getByLabel('Danh mục sản phẩm').selectOption({ label: 'QA Tailoring' });
  await products.getByLabel('Tìm sản phẩm').fill('QA');
  await products.getByRole('button', { name: 'Tải Product Assets' }).click();
  await products.getByLabel('Biến thể QA Silk Blazer').selectOption({ label: 'Ivory · S' });
  await products.getByRole('button', { name: 'Thêm QA Silk Blazer' }).click();
  const library = page.locator('aside').filter({ has: page.getByRole('button', { name: 'Tải Asset Library' }) });
  await library.getByRole('button', { name: 'Tải Asset Library' }).click();
  await library.getByRole('button', { name: 'Thêm asset QA Winter Asset Banner' }).click();
  const saved = await saveDesign(page, design._id);
  expect(saved.layers.some((layer) => layer.content.includes('photo-1591047139829'))).toBeTruthy();
  expect(saved.layers.some((layer) => layer.content.includes('photo-1517841905240'))).toBeTruthy();
});
