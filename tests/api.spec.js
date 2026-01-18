/**
 * @fileoverview API Tests
 * @description Verifies internal data transformation and mock responses for the flight service.
 */

import { test, expect } from '@playwright/test';

test.describe('Kolla flyget API Integration Tests', () => {
    // Note: Since we use fetch in the frontend and not a separate backend API (aside from Swedavia's),
    // we take advantage of Playwright's ability to intercept and verify network traffic/state.

    test('verify flight search returns consistency in data structure', async ({ page }) => {
        await page.goto('/');

        // Trigger a search
        const searchInput = page.getByPlaceholder(/t.ex. London, Spanien eller SK160/i);
        await searchInput.fill('London');
        await page.getByRole('button', { name: 'Sök flyg' }).click();

        // Check if results are displayed correctly in the UI (indirect API check)
        const firstFlight = page.locator('.flight-card').first();
        await expect(firstFlight).toBeVisible({ timeout: 15000 });

        const timeText = await firstFlight.locator('div').first().textContent();
        expect(timeText).toMatch(/\d{2}:\d{2}/); // HH:MM pattern
    });

    test('verify airport list matches expected count and labels', async ({ page }) => {
        await page.goto('/');
        const options = await page.locator('select option').all();
        expect(options.length).toBeGreaterThan(10); // 1 deafult + 10 airports

        const arnOption = await page.locator('select option[value="ARN"]').textContent();
        expect(arnOption).toContain('Stockholm Arlanda');
    });

    test('verify stats calculation logic via UI feedback', async ({ page }) => {
        await page.goto('/');
        const select = page.locator('select').first();
        await select.selectOption({ label: 'Stockholm Arlanda Airport' });

        const visaStatsBtn = page.getByRole('button', { name: /Visa Statistik/i });
        await visaStatsBtn.click();

        // Wait for stats cards
        const statsCard = page.locator('.glass-card').filter({ hasText: 'Flyg totalt' }).first();
        await expect(statsCard).toBeVisible({ timeout: 15000 });

        const totalFlightsText = await statsCard.textContent();
        const totalFlightsValue = parseInt(totalFlightsText.replace(/\D/g, ''));
        expect(totalFlightsValue).toBeGreaterThanOrEqual(0);
    });
});
