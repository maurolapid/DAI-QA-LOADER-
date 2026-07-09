import { defineConfig } from '@playwright/test';

export default defineConfig({
  timeout: 120000,
  use: {
    headless: false,
    viewport: null,
    launchOptions: {
      args: ['--start-maximized']
    }
  }
});
