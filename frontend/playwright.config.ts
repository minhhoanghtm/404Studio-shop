import { defineConfig } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { getQaFrontendUrl } from './e2e/support/qaEnv';

if (!process.env.QA_FRONTEND_URL && !process.env.PLAYWRIGHT_BASE_URL) {
  const defaultQaEnv = path.resolve(process.cwd(), '../backend/.env.qa');
  if (fs.existsSync(defaultQaEnv)) {
    process.loadEnvFile(defaultQaEnv);
  }
}

const baseURL = getQaFrontendUrl();

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/support/qaGlobalSetup.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  timeout: 60000,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'off',
    screenshot: 'only-on-failure',
    video: 'on',
  },
  projects: [
    {
      name: 'Desktop Viewport',
      use: {
        browserName: 'chromium',
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: 'Tablet Viewport',
      use: {
        browserName: 'chromium',
        viewport: { width: 768, height: 1024 },
      },
    },
    {
      name: 'Mobile Viewport',
      use: {
        browserName: 'chromium',
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
  ],
});
