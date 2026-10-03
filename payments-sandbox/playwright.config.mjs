import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './browser-tests', fullyParallel: true, workers: 2,
  reporter: 'list', timeout: 30000,
  use: { trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'], viewport: { width: 360, height: 800 } } },
  ],
});
