import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './tests',
    timeout: 60000,
    expect: {
        timeout: 5000,
    },
    fullyParallel: true,
    reporter: 'html',
    use: {
        baseURL: 'http://localhost:5173',
        trace: 'on-first-retry',
        video: 'retain-on-failure',
        screenshot: 'only-on-failure',
        // Add a test id attribute for easier selectors
        testIdAttribute: 'data-testid',
    },
    webServer: {
        command: 'npm run dev',
        port: 5173,
        timeout: 120 * 1000,
        reuseExistingServer: !process.env.CI,
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
        {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] },
        },
        {
            name: 'webkit',
            use: { ...devices['Desktop Safari'] },
        },
    ],
});
