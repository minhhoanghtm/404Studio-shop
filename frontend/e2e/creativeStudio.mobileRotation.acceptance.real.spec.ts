import { expect, test } from '@playwright/test';
import { createIsolatedDesign, loginQaAdmin, openDesignInStudio, saveDesign, seededLayer } from './support/creativeStudioQa';

test('rotates a layer directly with the mobile touch handle and persists it', async ({ page }, info) => {
  test.skip(process.env.QA_E2E_ENABLED !== 'true', 'Requires isolated QA.');
  test.skip(info.project.name !== 'Mobile Viewport', 'This acceptance specifically exercises mobile touch.');
  const name = `QA Mobile Rotation ${info.project.name} ${Date.now()}`;
  await loginQaAdmin(page);
  const design = await createIsolatedDesign(page, name, [seededLayer({ id: 'touch-shape', type: 'shape', name: 'Touch shape', x: 340, y: 500, width: 300, height: 260, rotation: 0 })]);
  await openDesignInStudio(page, name);
  const handle = page.locator('circle[data-handle="rotate"]');
  await handle.scrollIntoViewIfNeeded();
  const box = await handle.boundingBox(); expect(box).toBeTruthy();
  const x = box!.x + box!.width / 2; const y = box!.y + box!.height / 2;
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + 35, y: y + 10 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await cdp.detach();
  const saved = await saveDesign(page, design._id);
  expect(Math.abs(saved.layers.find((layer) => layer.id === 'touch-shape')!.rotation)).toBeGreaterThan(5);
  await page.reload();
  await expect(page.getByLabel('rotation layer')).not.toHaveValue('0');
});
