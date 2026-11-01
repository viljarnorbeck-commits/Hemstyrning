import { defineConfig } from '@playwright/test';
export default defineConfig({
  globalSetup:'./tests/setup.ts',
  expect:{timeout:15000},
  testDir: './tests', timeout: 120000, workers: 1,
  use: { baseURL: process.env.HEM_E2E_BASE_URL ?? 'http://localhost:5173', viewport: { width: 1440, height: 960 }, headless: true, launchOptions: { args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--no-sandbox'] } },
  reporter: 'list',
});
