import { expect, test } from '@playwright/test';
import { createIsolatedDesign, loginQaAdmin, openDesignInStudio, readDesign, saveDesign, seededLayer, type QaLayer } from './support/creativeStudioQa';

const enabled = process.env.QA_E2E_ENABLED === 'true';

test.describe('Creative Studio — focused Version History acceptance', () => {
  test.skip(!enabled, 'Set QA_E2E_ENABLED=true only after isolated QA services and fixtures are ready.');

  test('previews and restores V1 and V2 without replacing the current document', async ({ page }, testInfo) => {
    const baselineName = `QA Version Baseline ${testInfo.project.name} ${Date.now()}`;
    const v1Name = `${baselineName} V1`;
    const v2Name = `${baselineName} V2`;
    const layers: QaLayer[] = [seededLayer({ id: 'qa-version-text', type: 'text', name: 'QA Version Text', x: 160, y: 280, width: 680, height: 120, content: 'NỘI DUNG BASELINE' })];

    await loginQaAdmin(page);
    const design = await createIsolatedDesign(page, baselineName, layers);
    await openDesignInStudio(page, baselineName);

    await page.getByLabel('Tên thiết kế').fill(v1Name);
    await page.getByLabel('Nội dung').fill('NỘI DUNG V1');
    const v1 = await saveDesign(page, design._id);
    expect(v1.name).toBe(v1Name);
    expect(v1.layers.find((layer) => layer.id === 'qa-version-text')?.content).toBe('NỘI DUNG V1');

    await page.getByLabel('Tên thiết kế').fill(v2Name);
    await page.getByLabel('Nội dung').fill('NỘI DUNG V2');
    await page.getByLabel('Màu nền').fill('#1A365D');
    const v2 = await saveDesign(page, design._id);
    expect(v2.name).toBe(v2Name);
    expect(v2.background.value).toBe('#1A365D');
    expect(v2.versionHistory?.some((version) => version.name === v1Name)).toBeTruthy();
    const v1Version = Math.max(...(v2.versionHistory || []).filter((version) => version.name === v1Name).map((version) => version.version));

    await expect(page.getByText('Version History', { exact: false })).toBeVisible();
    await page.getByLabel(`Preview V${v1Version} ${v1Name}`).click();
    await expect(page.getByRole('status')).toContainText(v1Name);
    await expect(page.getByLabel('Tên thiết kế')).toHaveValue(v2Name);
    await expect(page.getByLabel('Nội dung')).toHaveValue('NỘI DUNG V2');
    const persistedDuringPreview = await readDesign(page, design._id);
    expect(persistedDuringPreview.name).toBe(v2Name);

    await page.getByLabel(`Khôi phục V${v1Version} ${v1Name}`).click();
    await expect(page.getByLabel('Tên thiết kế')).toHaveValue(v1Name);
    await expect(page.getByLabel('Nội dung')).toHaveValue('NỘI DUNG V1');
    const restoredV1 = await saveDesign(page, design._id);
    expect(restoredV1.name).toBe(v1Name);
    expect(restoredV1.versionHistory?.some((version) => version.name === v2Name)).toBeTruthy();
    const v2Version = Math.max(...(restoredV1.versionHistory || []).filter((version) => version.name === v2Name).map((version) => version.version));

    await page.reload();
    await expect(page.getByLabel('Tên thiết kế')).toHaveValue(v1Name);
    await expect(page.getByLabel('Nội dung')).toHaveValue('NỘI DUNG V1');
    await page.getByLabel(`Khôi phục V${v2Version} ${v2Name}`).click();
    await expect(page.getByLabel('Tên thiết kế')).toHaveValue(v2Name);
    await expect(page.getByLabel('Nội dung')).toHaveValue('NỘI DUNG V2');
    const restoredV2 = await saveDesign(page, design._id);
    expect(restoredV2.name).toBe(v2Name);
    expect(restoredV2.background.value).toBe('#1A365D');

    await page.reload();
    await expect(page.getByLabel('Tên thiết kế')).toHaveValue(v2Name);
    await expect(page.getByLabel('Nội dung')).toHaveValue('NỘI DUNG V2');
  });
});
