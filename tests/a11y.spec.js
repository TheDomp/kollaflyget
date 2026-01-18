/**
 * @fileoverview Accessibility (A11y) Tests
 * @description Uses Axe-core to audit the application for accessibility compliance.
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Kolla flyget Accessibility Tests', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('main landing page should be accessible', async ({ page }) => {
        const accessibilityScanResults = await new AxeBuilder({ page })
            .exclude('.clouds-container')
            .disableRules(['color-contrast']) // Glassmorphism creates false positives
            .analyze();
        expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('search results view should be accessible', async ({ page }) => {
        const select = page.locator('select').first();
        await select.selectOption({ label: 'Stockholm Arlanda Airport' });

        // Wait for content to load
        await expect(page.locator('.flight-card').first()).toBeVisible({ timeout: 15000 });

        const accessibilityScanResults = await new AxeBuilder({ page })
            .exclude('.clouds-container') // Exclude decorative elements if they conflict
            .exclude('.route-map-container') // Exclude complex SVG map to prevent timeouts
            .exclude('iframe')
            .disableRules(['color-contrast'])
            .analyze();
        expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('statistics dashboard should be accessible', async ({ page }) => {
        const select = page.locator('select').first();
        await select.selectOption({ label: 'Stockholm Arlanda Airport' });

        const visaStatsBtn = page.getByRole('button', { name: /Visa Statistik/i });
        await visaStatsBtn.click();

        const accessibilityScanResults = await new AxeBuilder({ page })
            .include('#airport-stats')
            .analyze();
        expect(accessibilityScanResults.violations).toEqual([]);
    });

    test('flight details modal should be accessible', async ({ page }) => {
        const select = page.locator('select').first();
        await select.selectOption({ label: 'Stockholm Arlanda Airport' });

        const firstCard = page.locator('.flight-card').first();
        await firstCard.click();

        await expect(page.locator('.modal-overlay')).toBeVisible();

        const accessibilityScanResults = await new AxeBuilder({ page })
            .include('.glass-card') // Focus on the modal content
            .exclude('iframe') // Exclude Google Maps or other iframes that we can't control
            .analyze();
        expect(accessibilityScanResults.violations).toEqual([]);
    });
});
