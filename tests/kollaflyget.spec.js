/**
 * @fileoverview Playwright E2E Tests
 * @description End-to-end tests for the Kollaflyget flight information application.
 */

import { test, expect } from '@playwright/test';

test.describe('Kolla flyget UI Tests', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('should search for an airport and display flights and statistics', async ({ page }) => {
        const select = page.locator('select').first();
        await select.selectOption({ label: 'Stockholm Arlanda Airport' });

        // Wait for loading to complete
        await expect(page.locator('.flight-list-container h2')).toContainText(/vid ARN/i, { timeout: 15000 });

        // Statistics should also be visible
        await expect(page.getByRole('heading', { name: /Statistik för ARN/i })).toBeVisible({ timeout: 15000 });
    });

    test('should show statistics filter input when flights are loaded', async ({ page }) => {
        const select = page.locator('select').first();
        await select.selectOption({ label: 'Stockholm Arlanda Airport' });

        // Wait for stats to load
        await expect(page.getByPlaceholder(/Filtrera statistik/i)).toBeVisible({ timeout: 15000 });
    });

    test('should search by country in manual search', async ({ page }) => {
        const searchInput = page.getByPlaceholder(/t.ex. London, Spanien eller SK160/i);
        await searchInput.fill('London');
        await page.getByRole('button', { name: 'Sök flyg' }).click();

        await expect(page.locator('.flight-list-container h2')).toContainText(/Sökresultat för London/i, { timeout: 15000 });
    });

    test('should display flight cards or empty state', async ({ page }) => {
        const select = page.locator('select').first();
        await select.selectOption({ value: 'ARN' });

        // Wait for either flight cards or empty message
        await expect(
            page.locator('.flight-card').first().or(page.getByText('Inga flyg hittades'))
        ).toBeVisible({ timeout: 20000 });
    });

    test('should display security wait time when airport is selected', async ({ page }) => {
        const select = page.locator('select').first();
        await select.selectOption({ value: 'ARN' });

        await expect(page.getByText('Säkerhetskontroll')).toBeVisible({ timeout: 15000 });
    });

    // Favorites test
    test('should star a flight and keep it after reload', async ({ page }) => {
        // Clear local storage and reload to clean state
        await page.evaluate(() => localStorage.clear());
        await page.reload();

        // Must load flights first!
        const select = page.locator('select').first();
        await select.selectOption({ label: 'Stockholm Arlanda Airport' });
        await expect(page.locator('.flight-card').first()).toBeVisible({ timeout: 15000 });

        const flightCard = page.locator('.flight-card').first();
        // Use the robust class selector
        const starBtn = flightCard.locator('.favorite-btn');
        await expect(starBtn).toBeVisible({ timeout: 15000 });

        await starBtn.click();

        // Check if star became active (fill change or class)
        await expect(flightCard.locator('svg[fill*="currentColor"]')).toBeVisible();

        // Reload and check persistence - MUST search again to see the flight
        await page.reload();

        // Re-select to trigger search
        await page.locator('select').first().selectOption({ label: 'Stockholm Arlanda Airport' });
        await expect(page.locator('.flight-card').first()).toBeVisible({ timeout: 15000 });

        await expect(page.locator('.flight-card').first().locator('svg[fill*="currentColor"]')).toBeVisible();
    });



    // Maps verification
    test('should render RouteMap and Google Maps iframe', async ({ page }) => {
        // Must select airport first to see stats
        const select = page.locator('select').first();
        await select.selectOption({ label: 'Stockholm Arlanda Airport' });

        await expect(page.locator('.flight-list-container')).toBeVisible({ timeout: 15000 });

        const visaStatsBtn = page.getByRole('button', { name: /Visa Statistik/i });
        await expect(visaStatsBtn).toBeVisible();
        await visaStatsBtn.click();

        // RouteMap verification
        await expect(page.getByText(/FLYGRUTTER FRÅN/i)).toBeVisible();
        await expect(page.locator('.leaflet-container')).toBeVisible();

        // Google Maps Iframe
        const airportMap = page.locator('iframe[title="Airport Map"]');
        await expect(airportMap).toBeVisible();
    });

    // Error state test
    test('should show empty state for invalid search', async ({ page }) => {
        const searchInput = page.getByPlaceholder(/t.ex. London, Spanien eller SK160/i);
        await searchInput.fill('XYZ123NONEXISTENT');
        await page.getByRole('button', { name: 'Sök flyg' }).click();

        await expect(page.getByText('Inga flyg hittades för valda parametrar.')).toBeVisible({ timeout: 15000 });
    });
});
