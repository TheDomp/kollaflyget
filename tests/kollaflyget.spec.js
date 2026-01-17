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
});
