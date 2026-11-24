import { defineConfig } from '@playwright/test';

const baseURL = process.env.QA_FRONTEND_URL || 'http://127.0.0.1:5173';
const useExistingQaServer = process.env.QA_E2E_ENABLED === 'true';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  timeout: 60000,
  workers: useExistingQaServer ? 1 : 2,
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
  webServer: useExistingQaServer ? undefined : {
    command: 'npm run dev',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: true,
    timeout: 60000,
  },
});
