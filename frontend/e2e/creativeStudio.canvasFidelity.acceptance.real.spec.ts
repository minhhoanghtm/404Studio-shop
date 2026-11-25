import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { createIsolatedDesign, loginQaAdmin, openDesignInStudio, seededLayer } from './support/creativeStudioQa';

test('export matches canvas reference for layering, rotation, opacity, text and hidden layers', async ({ page }, info) => {
  test.skip(process.env.QA_E2E_ENABLED !== 'true', 'Requires isolated QA.');
  const name = `QA Fidelity ${info.project.name} ${Date.now()}`;
  const layers = [
    seededLayer({ id: 'base', type: 'shape', name: 'Base', x: 100, y: 160, width: 650, height: 520, zIndex: 1, styles: { backgroundColor: '#ed3434' } }),
    seededLayer({ id: 'overlay', type: 'shape', name: 'Overlay', x: 420, y: 340, width: 400, height: 300, rotation: 22, opacity: 0.6, zIndex: 2, styles: { backgroundColor: '#31b8ef' } }),
    seededLayer({ id: 'title', type: 'text', name: 'Title', x: 140, y: 780, width: 800, height: 100, zIndex: 3, content: 'XIN CHÀO VIỆT NAM', styles: { fontFamily: 'Inter', fontSize: 54, fontWeight: '700', color: '#FFFFFF', textAlign: 'center' } }),
    seededLayer({ id: 'subtitle', type: 'text', name: 'Subtitle', x: 140, y: 875, width: 800, height: 70, zIndex: 4, content: 'Bộ sưu tập mới', styles: { fontFamily: 'Playfair Display', fontSize: 38, fontWeight: '400', color: '#FFFFFF', textAlign: 'center' } }),
    seededLayer({ id: 'hidden', type: 'shape', name: 'Hidden', x: 0, y: 0, width: 1080, height: 1350, zIndex: 4, visible: false, styles: { backgroundColor: '#00ff00' } }),
    seededLayer({ id: 'group', type: 'group', name: 'Group', x: 100, y: 160, width: 720, height: 520, zIndex: 2, content: '["base","overlay"]', styles: {} }),
  ];
  await loginQaAdmin(page);
  const imageData = await page.evaluate(() => { const canvas = document.createElement('canvas'); canvas.width = 100; canvas.height = 100; const ctx = canvas.getContext('2d')!; ctx.fillStyle = '#ffb000'; ctx.fillRect(0, 0, 50, 100); ctx.fillStyle = '#00a354'; ctx.fillRect(50, 0, 50, 100); return canvas.toDataURL('image/png'); });
  layers.push(seededLayer({ id: 'crop', type: 'image', name: 'Crop', x: 310, y: 960, width: 360, height: 240, rotation: -12, zIndex: 5, content: imageData, styles: { cropZoom: 1.7, cropX: 25, cropY: 75, objectFit: 'cover' } }));
  layers.push(seededLayer({ id: 'cta', type: 'button', name: 'CTA', x: 350, y: 1220, width: 380, height: 80, zIndex: 6, content: 'KHÁM PHÁ', styles: { fontFamily: 'Inter', fontSize: 30, color: '#FFFFFF', backgroundColor: '#222222', textAlign: 'center', borderRadius: 20 } }));
  await createIsolatedDesign(page, name, layers); await openDesignInStudio(page, name);
  const canvas = page.locator('svg[viewBox="0 0 1080 1350"]');
  await canvas.click({ position: { x: 3, y: 3 } });
  await expect(canvas.locator('[data-selection]')).toHaveCount(0);
  await page.evaluate(() => document.fonts.ready);
  // At small viewports the canvas scroll container clips the SVG; expose the
  // complete existing SVG only while taking the reference screenshot.
  await canvas.evaluate((element) => { const section = element.closest('section'); if (section) { section.style.minHeight = '430px'; section.style.overflow = 'visible'; } });
  const reference = await canvas.screenshot();
  for (const item of [{ name: 'PNG', mime: 'image/png', tolerance: 8 }, { name: 'JPG', mime: 'image/jpeg', tolerance: 10 }, { name: 'WebP', mime: 'image/webp', tolerance: 10 }]) {
    const pending = page.waitForEvent('download'); await page.getByRole('button', { name: item.name, exact: true }).click();
    const output = await readFile((await (await pending).path())!);
    const difference = await page.evaluate(async ({ ref, encoded, mime }) => {
      const load = async (src: string) => { const image = new Image(); image.src = src; await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error('Decode failed')); }); return image; };
      const [reference, exported] = await Promise.all([load(`data:image/png;base64,${ref}`), load(`data:${mime};base64,${encoded}`)]);
      const get = (image: HTMLImageElement) => { const canvas = document.createElement('canvas'); canvas.width = reference.width; canvas.height = reference.height; const ctx = canvas.getContext('2d')!; ctx.drawImage(image, 0, 0, canvas.width, canvas.height); return ctx.getImageData(0, 0, canvas.width, canvas.height).data; };
      const a = get(reference); const b = get(exported); let sum = 0;
      for (let i = 0; i < a.length; i += 4) for (let channel = 0; channel < 3; channel++) sum += Math.abs(a[i + channel] - b[i + channel]);
      return sum / (a.length / 4 * 3);
    }, { ref: reference.toString('base64'), encoded: output.toString('base64'), mime: item.mime });
    expect(difference).toBeLessThanOrEqual(item.tolerance);
  }
  const svgDownload = page.waitForEvent('download'); await page.getByRole('button', { name: 'SVG', exact: true }).click();
  const svg = await readFile((await (await svgDownload).path())!, 'utf8');
  expect(svg).toContain('Bộ sưu tập mới'); expect(svg).toContain('Playfair Display'); expect(svg).toContain('KHÁM PHÁ'); expect(svg).not.toContain('data-selection');
  const jsonDownload = page.waitForEvent('download'); await page.getByRole('button', { name: 'JSON', exact: true }).click();
  const json = JSON.parse(await readFile((await (await jsonDownload).path())!, 'utf8'));
  expect(json.project.layers.find((layer: { id: string }) => layer.id === 'hidden').visible).toBe(false);
  expect(json.project.layers.find((layer: { id: string }) => layer.id === 'subtitle').styles.fontFamily).toBe('Playfair Display');
});

test('image background remains visible in canvas and raster exports', async ({ page }, info) => {
  test.skip(process.env.QA_E2E_ENABLED !== 'true', 'Requires isolated QA.');
  await loginQaAdmin(page);
  const imageData = await page.evaluate(() => { const canvas = document.createElement('canvas'); canvas.width = 40; canvas.height = 40; const ctx = canvas.getContext('2d')!; ctx.fillStyle = '#1aa4df'; ctx.fillRect(0, 0, 40, 40); return canvas.toDataURL('image/png'); });
  const name = `QA Background Fidelity ${info.project.name} ${Date.now()}`;
  await createIsolatedDesign(page, name, [], { type: 'image', value: imageData });
  await openDesignInStudio(page, name);
  const canvas = page.locator('svg[viewBox="0 0 1080 1350"]');
  await canvas.evaluate((element) => { const section = element.closest('section'); if (section) { section.style.minHeight = '430px'; section.style.overflow = 'visible'; } });
  const reference = await canvas.screenshot();
  const pending = page.waitForEvent('download'); await page.getByRole('button', { name: 'PNG', exact: true }).click();
  const output = await readFile((await (await pending).path())!);
  const pixels = await page.evaluate(async ({ ref, result }) => {
    const sample = async (base64: string) => { const image = new Image(); image.src = `data:image/png;base64,${base64}`; await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error('Decode failed')); }); const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height; const ctx = canvas.getContext('2d')!; ctx.drawImage(image, 0, 0); return Array.from(ctx.getImageData(Math.floor(image.width / 2), Math.floor(image.height / 2), 1, 1).data); };
    return [await sample(ref), await sample(result)];
  }, { ref: reference.toString('base64'), result: output.toString('base64') });
  expect(pixels[0]).toEqual([26, 164, 223, 255]);
  expect(pixels[1]).toEqual(pixels[0]);
});
