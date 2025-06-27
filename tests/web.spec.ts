import { test, expect } from '@playwright/test';

test.describe('Web Application', () => {
    test('should display homepage with correct title and content', async ({ page }) => {
        await page.goto('http://localhost:3000/');

        // Check page title
        await expect(page).toHaveTitle(/Web - Exchanger/);

        // Check main heading
        await expect(page.locator('h1')).toContainText('Добро пожаловать в Exchanger');

        // Check navigation or key elements
        await expect(page.locator('main')).toBeVisible();
    });

    test('should be accessible', async ({ page }) => {
        await page.goto('http://localhost:3000/');

        // Check for proper heading hierarchy
        const h1 = await page.locator('h1').count();
        expect(h1).toBeGreaterThan(0);

        // Check for alt attributes on images
        const images = page.locator('img');
        const imageCount = await images.count();

        for (let i = 0; i < imageCount; i++) {
            const img = images.nth(i);
            const alt = await img.getAttribute('alt');
            expect(alt).not.toBeNull();
        }
    });

    test('should handle 404 page', async ({ page }) => {
        await page.goto('http://localhost:3000/non-existent-page');

        // Should show 404 page
        await expect(page.locator('text=404')).toBeVisible();
        await expect(page.locator('text=Страница не найдена')).toBeVisible();

        // Should have link back to home
        await expect(page.locator('a[href="/"]')).toBeVisible();
    });
});
