import { expect, test } from '@playwright/test';
import { createIsolatedDesign, loginQaAdmin, openDesignInStudio } from './support/creativeStudioQa';

test('opens only the requested owned project and refuses an unknown project', async ({ page }, info) => {
  test.skip(process.env.QA_E2E_ENABLED !== 'true', 'Requires isolated QA.');
  await loginQaAdmin(page);
  const runId = Date.now();
  const first = `QA Isolation First ${info.project.name} ${runId}`;
  const second = `QA Isolation Second ${info.project.name} ${runId}`;
  await createIsolatedDesign(page, first, []);
  await createIsolatedDesign(page, second, []);
  await openDesignInStudio(page, first);
  await expect(page.getByLabel('Tên thiết kế')).toHaveValue(first);
  await openDesignInStudio(page, second);
  await expect(page.getByLabel('Tên thiết kế')).toHaveValue(second);
  await page.goto('/admin/ai-assistant?tab=creative&designId=000000000000000000000000');
  await expect(page.getByLabel('Tên thiết kế')).toHaveCount(0);
});
