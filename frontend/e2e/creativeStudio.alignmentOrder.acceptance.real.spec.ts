import { expect, test } from '@playwright/test';
import { createIsolatedDesign, loginQaAdmin, openDesignInStudio, saveDesign, seededLayer, type QaLayer } from './support/creativeStudioQa';

const enabled = process.env.QA_E2E_ENABLED === 'true';
const tolerance = 2;

const bounds = (layer: QaLayer) => {
  const radians = layer.rotation * Math.PI / 180; const centerX = layer.x + layer.width / 2; const centerY = layer.y + layer.height / 2;
  const points = [[layer.x, layer.y], [layer.x + layer.width, layer.y], [layer.x + layer.width, layer.y + layer.height], [layer.x, layer.y + layer.height]].map(([x, y]) => ({ x: centerX + (x - centerX) * Math.cos(radians) - (y - centerY) * Math.sin(radians), y: centerY + (x - centerX) * Math.sin(radians) + (y - centerY) * Math.cos(radians) }));
  const left = Math.min(...points.map((point) => point.x)); const right = Math.max(...points.map((point) => point.x)); const top = Math.min(...points.map((point) => point.y)); const bottom = Math.max(...points.map((point) => point.y));
  return { left, right, top, bottom, centerX: (left + right) / 2, centerY: (top + bottom) / 2, width: right - left, height: bottom - top };
};

const expectSame = (values: number[]) => values.forEach((value) => expect(Math.abs(value - values[0])).toBeLessThanOrEqual(tolerance));

test.describe('Creative Studio — focused alignment and ordering acceptance', () => {
  test.skip(!enabled, 'Set QA_E2E_ENABLED=true only after isolated QA services and fixtures are ready.');

  test('uses rotated bounds, protects hidden/locked layers, aligns groups, and orders group members', async ({ page }, testInfo) => {
    test.setTimeout(180_000);
    const name = `QA Alignment ${testInfo.project.name} ${Date.now()}`;
    const layers: QaLayer[] = [
      seededLayer({ id: 'group-a', type: 'text', name: 'QA Group A', x: 100, y: 180, width: 180, height: 100, zIndex: 1, content: 'A' }),
      seededLayer({ id: 'group-b', type: 'shape', name: 'QA Group B', x: 360, y: 230, width: 160, height: 120, zIndex: 2, styles: { backgroundColor: '#D4AF37' } }),
      seededLayer({ id: 'align-a', type: 'text', name: 'QA Align A', x: 140, y: 100, width: 160, height: 90, zIndex: 3, content: 'ALIGN A' }),
      seededLayer({ id: 'align-b', type: 'shape', name: 'QA Align B', x: 460, y: 360, width: 220, height: 110, rotation: 28, zIndex: 4, styles: { backgroundColor: '#5C2D91' } }),
      seededLayer({ id: 'align-c', type: 'text', name: 'QA Align C', x: 780, y: 700, width: 140, height: 170, rotation: -18, zIndex: 5, content: 'ALIGN C' }),
      seededLayer({ id: 'align-locked', type: 'shape', name: 'QA Align Locked', x: 900, y: 120, width: 100, height: 100, zIndex: 6, locked: true, styles: { backgroundColor: '#111111' } }),
      seededLayer({ id: 'align-hidden', type: 'text', name: 'QA Align Hidden', x: 40, y: 1100, width: 220, height: 80, zIndex: 7, visible: false, content: 'HIDDEN' }),
    ];
    await loginQaAdmin(page);
    const design = await createIsolatedDesign(page, name, layers);
    await openDesignInStudio(page, name);

    await page.getByLabel('Chọn layer QA Group A').uncheck();
    const selectable = ['QA Align A', 'QA Align B', 'QA Align C', 'QA Align Locked', 'QA Align Hidden'];
    for (const layerName of selectable) await page.getByLabel(`Chọn layer ${layerName}`).check();
    await expect(page.getByLabel('Multi-selection controls')).toBeVisible();
    const before = await saveDesign(page, design._id);
    const lockedBefore = before.layers.find((layer) => layer.id === 'align-locked')!;
    const hiddenBefore = before.layers.find((layer) => layer.id === 'align-hidden')!;

    const verifyAxis = async (button: string, coordinate: 'left' | 'centerX' | 'right' | 'top' | 'centerY' | 'bottom') => {
      await page.getByRole('button', { name: button, exact: true }).click();
      const saved = await saveDesign(page, design._id);
      const active = ['align-a', 'align-b', 'align-c'].map((id) => bounds(saved.layers.find((layer) => layer.id === id)!)[coordinate]);
      expectSame(active);
      expect(saved.layers.find((layer) => layer.id === 'align-locked')?.x).toBe(lockedBefore.x);
      expect(saved.layers.find((layer) => layer.id === 'align-hidden')?.y).toBe(hiddenBefore.y);
    };
    await verifyAxis('Trái', 'left');
    await verifyAxis('Giữa', 'centerX');
    await verifyAxis('Phải', 'right');
    await verifyAxis('Trên', 'top');
    await verifyAxis('Giữa dọc', 'centerY');
    await verifyAxis('Dưới', 'bottom');

    for (let count = 0; count < 6; count += 1) await page.locator('button[title="Undo (Ctrl+Z)"]').click();
    await page.getByRole('button', { name: 'Dàn ngang', exact: true }).click();
    const distributedH = await saveDesign(page, design._id);
    const horizontal = ['align-a', 'align-b', 'align-c'].map((id) => bounds(distributedH.layers.find((layer) => layer.id === id)!)).sort((a, b) => a.left - b.left);
    expect(Math.abs((horizontal[1].left - horizontal[0].right) - (horizontal[2].left - horizontal[1].right))).toBeLessThanOrEqual(tolerance);
    await page.locator('button[title="Undo (Ctrl+Z)"]').click();
    await page.getByRole('button', { name: 'Dàn dọc', exact: true }).click();
    const distributedV = await saveDesign(page, design._id);
    const vertical = ['align-a', 'align-b', 'align-c'].map((id) => bounds(distributedV.layers.find((layer) => layer.id === id)!)).sort((a, b) => a.top - b.top);
    expect(Math.abs((vertical[1].top - vertical[0].bottom) - (vertical[2].top - vertical[1].bottom))).toBeLessThanOrEqual(tolerance);
    await page.getByRole('button', { name: 'Tâm canvas', exact: true }).click();
    const centered = await saveDesign(page, design._id);
    for (const id of ['align-a', 'align-b', 'align-c']) { const box = bounds(centered.layers.find((layer) => layer.id === id)!); expect(Math.abs(box.centerX - 540)).toBeLessThanOrEqual(tolerance); expect(Math.abs(box.centerY - 675)).toBeLessThanOrEqual(tolerance); }

    for (const layerName of selectable) await page.getByLabel(`Chọn layer ${layerName}`).uncheck();
    await page.getByLabel('Chọn layer QA Group A').check();
    await page.getByLabel('Chọn layer QA Group B').check();
    await page.getByRole('button', { name: 'Group', exact: true }).click();
    const groupBox = page.getByLabel('Chọn layer Nhóm (2)');
    await expect(groupBox).toBeChecked();
    const groupedBefore = await saveDesign(page, design._id);
    const groupBefore = groupedBefore.layers.find((layer) => layer.type === 'group')!;
    const membersBefore = ['group-a', 'group-b'].map((id) => groupedBefore.layers.find((layer) => layer.id === id)!);
    await page.getByLabel('Chọn layer QA Align A').check();
    await page.getByRole('button', { name: 'Trái', exact: true }).click();
    const groupedAfter = await saveDesign(page, design._id);
    const groupAfter = groupedAfter.layers.find((layer) => layer.id === groupBefore.id)!;
    expectSame([bounds(groupAfter).left, bounds(groupedAfter.layers.find((layer) => layer.id === 'align-a')!).left]);
    const memberDeltaX = ['group-a', 'group-b'].map((id, index) => groupedAfter.layers.find((layer) => layer.id === id)!.x - membersBefore[index].x);
    expectSame(memberDeltaX);

    await page.getByLabel('Chọn layer QA Align A').uncheck();
    await page.getByRole('button', { name: 'Nhóm (2)', exact: true }).click();
    const childZBefore = ['group-a', 'group-b'].map((id) => groupedAfter.layers.find((layer) => layer.id === id)!.zIndex);
    await page.getByTitle('Lên trên').click();
    const ordered = await saveDesign(page, design._id);
    const childZAfter = ['group-a', 'group-b'].map((id) => ordered.layers.find((layer) => layer.id === id)!.zIndex);
    expect(childZAfter.some((value, index) => value !== childZBefore[index])).toBeTruthy();
  });
});
