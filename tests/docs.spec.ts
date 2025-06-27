import { test, expect } from '@playwright/test';

test.describe('Documentation', () => {
    test('should display docs with correct title', async ({ page }) => {
        await page.goto('http://localhost:3001/');

        // Check page title
        await expect(page).toHaveTitle(/Docs - Exchanger/);

        // Check main content
        await expect(page.locator('main')).toBeVisible();
    });

    test('should be accessible', async ({ page }) => {
        await page.goto('http://localhost:3001/');

        // Check for proper heading hierarchy
        const h1 = await page.locator('h1').count();
        expect(h1).toBeGreaterThan(0);

        // Check main landmark
        await expect(page.locator('main')).toBeVisible();
    });
});
