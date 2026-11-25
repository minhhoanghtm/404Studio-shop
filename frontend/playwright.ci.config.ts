import { defineConfig } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { parseRequiredPort } from './e2e/support/qaEnv';

if (!process.env.PLAYWRIGHT_CI_PORT) {
  const ciEnv = path.resolve(process.cwd(), '../.env.ci');
  if (fs.existsSync(ciEnv)) {
    process.loadEnvFile(ciEnv);
  }
}

const host = (process.env.PLAYWRIGHT_CI_HOST || process.env.PLAYWRIGHT_HOST || process.env.FRONTEND_HOST || '').trim();
if (!host) {
  throw new Error('PLAYWRIGHT_CI_HOST (or PLAYWRIGHT_HOST / FRONTEND_HOST) is required in ENV.');
}
const port = parseRequiredPort(process.env.PLAYWRIGHT_CI_PORT || process.env.PLAYWRIGHT_PORT, 'PLAYWRIGHT_CI_PORT');
const baseURL = (process.env.PLAYWRIGHT_BASE_URL || `http://${host}:${port}`).trim().replace(/\/$/, '');

export default defineConfig({
  testDir: './e2e',
  testMatch: /privacyCompliance\.spec\.ts/,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  timeout: 60000,
  workers: 2,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'off',
    screenshot: 'only-on-failure',
    video: 'off',
  },
  projects: [
    {
      name: 'Desktop Viewport',
      use: {
        browserName: 'chromium',
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
  webServer: {
    command: `npm run dev -- --host ${host} --port ${port}`,
    env: {
      ...process.env,
      VITE_HOST: host,
      VITE_PORT: String(port),
    },
    url: baseURL,
    reuseExistingServer: false,
    timeout: 60000,
  },
});
