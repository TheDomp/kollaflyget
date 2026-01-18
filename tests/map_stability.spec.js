import { test, expect } from '@playwright/test';

test.describe('Airport Map Stability', () => {
    test('should keep map visible when changing date in statistics', async ({ page }) => {
        // 1. Visit the app
        await page.goto('http://localhost:5173');

        // 2. Select an airport (e.g., Arlanda)
        // Wait for the search card title
        await page.getByText('Hitta ditt flyg').waitFor();

        // Select ARN from the dropdown
        // The select is the only select element in the SearchCard initially
        await page.selectOption('select', 'ARN');

        // 3. Wait for FlightList to appear (it should appear after selection)
        // FlightList has className "flight-list-container"
        await page.waitForSelector('.flight-list-container');

        // 4. Ensure Statistics are shown. Statistics show if currentAirport && flights.length > 0.
        // Need to ensure flights are returned. ARN usually has flights.
        // We can also verify that we aren't in error state.
        await expect(page.locator('.flight-list-container')).not.toContainText('Inga flyg hittades');

        // Wait for stats container
        await page.waitForSelector('#airport-stats');

        // Scroll to statistics
        await page.locator('#airport-stats').scrollIntoViewIfNeeded();

        // 5. Check if map is visible initially
        // Map is rendered in a div with some specific content probably.
        // AirportMap uses Leaflet. Leaflet container has class 'leaflet-container'.
        await expect(page.locator('.leaflet-container')).toBeVisible();

        // 6. Change date in statistics
        // The date input is in AirportStatistics -> DateRangeInput
        const startDateInput = page.locator('#airport-stats input[type="date"]').first();

        // Get current value
        const currentDate = await startDateInput.inputValue();

        // Calculate yesterday's date
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        // 7. Setup network interception to delay the response
        // This allows us to reliably check the UI state during "loading"
        await page.route('**/flightinfo/v2/**', async route => {
            await new Promise(f => setTimeout(f, 2000));
            await route.continue();
        });

        // 8. Interact: change date to trigger new data fetch
        await startDateInput.fill(yesterdayStr);

        // 9. CHECK: During the 2 second delay...
        // Verify that the LOADING indicator is present (checking overlay now)
        await expect(page.getByTestId('loading-overlay')).toBeVisible({ timeout: 1000 });

        // Verify that the MAP is ALSO visible
        // If the bug exists (map unmounts when loading=true), this will FAIL.
        // We use isVisible() and then expect(true) to avoid Playwright's auto-retries for toBeVisible()
        // which might pass if the map reappears quickly after a flicker.
        const isMapVisible = await page.locator('.leaflet-container').isVisible();
        expect(isMapVisible).toBe(true);

        // 10. Wait for the loading to complete and new data to appear
        await expect(page.getByTestId('loading-overlay')).not.toBeVisible({ timeout: 5000 });

        // Ensure the map is still visible after loading completes
        await expect(page.locator('.leaflet-container')).toBeVisible();

        // 11. Ensure we are still at the Statistics section (scroll position maintained or restored)
        await expect(page.locator('#airport-stats')).toBeInViewport();
    });
});
