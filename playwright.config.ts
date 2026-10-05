import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e', testMatch: ['auth-v2.spec.ts', 'finance.spec.ts', 'budgets.spec.ts', 'goals.spec.ts', 'recurrences.spec.ts', 'net-worth.spec.ts'], fullyParallel: false, workers: 1, retries: 0,
  reporter: 'list', use: { baseURL: 'http://localhost:3103', trace: 'off', screenshot: 'only-on-failure' },
  projects: [{ name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 960 } } }, { name: 'mobile', use: { ...devices['iPhone 13'], defaultBrowserType: 'chromium' } }],
  webServer: { command: 'node node_modules/vite/bin/vite.js --host localhost --port 3103 --strictPort', url: 'http://localhost:3103', reuseExistingServer: !process.env.CI, env: {
    VITE_SUPABASE_URL: 'https://identity.example.test', VITE_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test_fixture_only', VITE_API_BASE_URL: 'http://localhost:3001',
  } },
});
