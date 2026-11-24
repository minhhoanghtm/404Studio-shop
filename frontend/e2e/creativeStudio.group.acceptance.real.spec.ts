import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { createIsolatedDesign, loginQaAdmin, openDesignInStudio, readDesign, saveDesign, seededLayer, type QaLayer } from './support/creativeStudioQa';

const enabled = process.env.QA_E2E_ENABLED === 'true';

const memberIds = ['qa-group-text', 'qa-group-image', 'qa-group-shape'];

const groupMembers = (layer: QaLayer) => JSON.parse(layer.content) as string[];

test.describe('Creative Studio — focused multi-select and group acceptance', () => {
  test.skip(!enabled, 'Set QA_E2E_ENABLED=true only after isolated QA services and fixtures are ready.');

  test('keeps group references, transforms, and member state correct', async ({ page }, testInfo) => {
    const runName = `QA Group ${testInfo.project.name} ${Date.now()}`;
    const initialLayers: QaLayer[] = [
      seededLayer({ id: memberIds[0], type: 'text', name: 'QA Group Text', x: 120, y: 140, width: 260, height: 100, zIndex: 1, content: 'NHÓM QA' }),
      seededLayer({ id: memberIds[1], type: 'image', name: 'QA Group Image', x: 430, y: 330, width: 220, height: 180, zIndex: 2, visible: false, content: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL6LwAAAABJRU5ErkJggg==' }),
      seededLayer({ id: memberIds[2], type: 'shape', name: 'QA Group Shape', x: 740, y: 220, width: 180, height: 150, zIndex: 3, styles: { backgroundColor: '#D4AF37', borderRadius: 8 } }),
    ];

    await loginQaAdmin(page);
    const design = await createIsolatedDesign(page, runName, initialLayers);
    await openDesignInStudio(page, runName);

    const textCheckbox = page.getByLabel('Chọn layer QA Group Text');
    const imageCheckbox = page.getByLabel('Chọn layer QA Group Image');
    const shapeCheckbox = page.getByLabel('Chọn layer QA Group Shape');
    await textCheckbox.check();
    await imageCheckbox.check();
    await shapeCheckbox.check();
    await expect(page.getByLabel('Multi-selection controls')).toBeVisible();

    // Deselect and reselect through the Layer Manager before grouping.
    await textCheckbox.uncheck();
    await expect(textCheckbox).not.toBeChecked();
    await textCheckbox.check();
    await page.getByRole('button', { name: 'Group', exact: true }).click();

    const groupCheckbox = page.getByLabel('Chọn layer Nhóm (3)');
    await expect(groupCheckbox).toBeChecked();
    const groupHitbox = page.locator('rect[data-group-hitbox="true"]');
    const beforeMove = await groupHitbox.boundingBox();
    if (!beforeMove) throw new Error('Group hitbox is not rendered.');
    await page.mouse.move(beforeMove.x + beforeMove.width / 2, beforeMove.y + beforeMove.height / 2);
    await page.mouse.down();
    await page.mouse.move(beforeMove.x + beforeMove.width / 2 + 32, beforeMove.y + beforeMove.height / 2 + 22, { steps: 5 });
    await page.mouse.up();

    const afterMove = await saveDesign(page, design._id);
    const persistedGroup = afterMove.layers.find((layer) => layer.type === 'group');
    expect(persistedGroup).toBeTruthy();
    expect(new Set(groupMembers(persistedGroup!)).size).toBe(3);
    expect(groupMembers(persistedGroup!).sort()).toEqual([...memberIds].sort());
    const movedMembers = memberIds.map((id) => afterMove.layers.find((layer) => layer.id === id)!);
    const deltaX = movedMembers.map((layer, index) => layer.x - initialLayers[index].x);
    const deltaY = movedMembers.map((layer, index) => layer.y - initialLayers[index].y);
    expect(Math.abs(deltaX[0])).toBeGreaterThan(1);
    expect(Math.abs(deltaY[0])).toBeGreaterThan(1);
    expect(new Set(deltaX).size).toBe(1);
    expect(new Set(deltaY).size).toBe(1);

    const rotateHandle = page.locator('circle[data-handle="rotate"]');
    const rotateBox = await rotateHandle.boundingBox();
    if (!rotateBox) throw new Error('Group rotation handle is not rendered.');
    await page.mouse.move(rotateBox.x + rotateBox.width / 2, rotateBox.y + rotateBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(rotateBox.x + rotateBox.width / 2 + 70, rotateBox.y + rotateBox.height / 2 + 25, { steps: 6 });
    await page.mouse.up();
    const secondRotateBox = await rotateHandle.boundingBox();
    if (!secondRotateBox) throw new Error('Group rotation handle vanished after first rotation.');
    await page.mouse.move(secondRotateBox.x + secondRotateBox.width / 2, secondRotateBox.y + secondRotateBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(secondRotateBox.x + secondRotateBox.width / 2 - 45, secondRotateBox.y + secondRotateBox.height / 2 + 45, { steps: 5 });
    await page.mouse.up();

    await page.getByLabel('opacity layer').fill('0.5');
    const groupRow = groupCheckbox.locator('xpath=..');
    await groupRow.getByTitle('Ẩn lớp').click();
    await expect(groupHitbox).toHaveCount(0);
    await groupRow.getByTitle('Hiện lớp').click();
    await groupRow.getByTitle('Khóa lớp').click();
    await expect(page.locator('circle[data-handle="rotate"]')).toHaveCount(0);
    await groupRow.getByTitle('Mở khóa').click();

    await page.getByRole('button', { name: 'Nhân bản', exact: true }).click();
    const afterDuplicate = await saveDesign(page, design._id);
    const groups = afterDuplicate.layers.filter((layer) => layer.type === 'group');
    expect(groups).toHaveLength(2);
    const allIds = afterDuplicate.layers.map((layer) => layer.id);
    expect(new Set(allIds).size).toBe(allIds.length);
    const [originalGroup, copiedGroup] = groups;
    expect(groupMembers(copiedGroup).every((id) => !groupMembers(originalGroup).includes(id))).toBeTruthy();
    expect(groupMembers(copiedGroup).every((id) => afterDuplicate.layers.some((layer) => layer.id === id))).toBeTruthy();
    expect(originalGroup.opacity).toBe(0.5);
    expect(afterDuplicate.layers.find((layer) => layer.id === memberIds[1])?.visible).toBe(false);
    expect(Math.abs(originalGroup.rotation)).toBeGreaterThan(1);
    expect(groupMembers(originalGroup).every((id) => Math.abs(afterDuplicate.layers.find((layer) => layer.id === id)?.rotation || 0) > 1)).toBeTruthy();

    await page.getByRole('button', { name: 'Ungroup', exact: true }).click();
    await page.locator('button[title="Undo (Ctrl+Z)"]').click();
    await page.locator('button[title="Redo (Ctrl+Shift+Z)"]').click();
    const afterUngroup = await saveDesign(page, design._id);
    expect(afterUngroup.layers.filter((layer) => layer.type === 'group')).toHaveLength(1);

    const svgDownload = page.waitForEvent('download');
    await page.getByRole('button', { name: 'SVG', exact: true }).click();
    const svg = await svgDownload;
    const svgPath = await svg.path();
    expect(svgPath).toBeTruthy();
    const svgContents = await readFile(svgPath!, 'utf8');
    expect(svgContents).not.toContain('data-selection');
    expect(svgContents).toContain('NHÓM QA');

    const jsonDownload = page.waitForEvent('download');
    await page.getByRole('button', { name: 'JSON', exact: true }).click();
    const json = await jsonDownload;
    const jsonPath = await json.path();
    expect(jsonPath).toBeTruthy();
    const exportPayload = JSON.parse(await readFile(jsonPath!, 'utf8'));
    const exportedIds = new Set(exportPayload.project.layers.map((layer: QaLayer) => layer.id));
    exportPayload.project.layers.filter((layer: QaLayer) => layer.type === 'group').forEach((layer: QaLayer) => {
      expect(groupMembers(layer).every((memberId) => exportedIds.has(memberId))).toBeTruthy();
    });

    const reloaded = await readDesign(page, design._id);
    expect(reloaded.layers.filter((layer) => layer.type === 'group')).toHaveLength(1);
  });
});
