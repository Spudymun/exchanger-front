import { test, expect } from '@playwright/test';

test.describe('Admin Panel', () => {
    test('should display admin dashboard with correct content', async ({ page }) => {
        await page.goto('http://localhost:3002/');

        // Check page title
        await expect(page).toHaveTitle(/Admin Panel - Exchanger/);

        // Check main heading
        await expect(page.locator('h1')).toContainText('Панель администратора');

        // Check for admin-specific elements
        await expect(page.locator('main')).toBeVisible();
        await expect(page.locator('[role="banner"]')).toBeVisible();
    });

    test('should display statistics cards', async ({ page }) => {
        await page.goto('http://localhost:3002/');

        // Check for statistics section
        await expect(page.locator('section[aria-label="Статистика"]')).toBeVisible();

        // Check for specific stat cards
        await expect(page.locator('text=Пользователи')).toBeVisible();
        await expect(page.locator('text=Транзакции')).toBeVisible();
        await expect(page.locator('text=Доходы')).toBeVisible();
    });

    test('should have theme toggle functionality', async ({ page }) => {
        await page.goto('http://localhost:3002/');

        // Check for theme toggle button
        const themeToggle = page.locator('button[aria-label="Переключить тему"]');
        await expect(themeToggle).toBeVisible();

        // Click theme toggle and check for dropdown
        await themeToggle.click();
        await expect(page.locator('text=Светлая')).toBeVisible();
        await expect(page.locator('text=Темная')).toBeVisible();
        await expect(page.locator('text=Система')).toBeVisible();
    });

    test('should display data table with users', async ({ page }) => {
        await page.goto('http://localhost:3002/');

        // Check for data table
        await expect(page.locator('table')).toBeVisible();
        await expect(page.locator('th:has-text("Имя")')).toBeVisible();
        await expect(page.locator('th:has-text("Email")')).toBeVisible();
        await expect(page.locator('th:has-text("Роль")')).toBeVisible();

        // Check for sample data
        await expect(page.locator('td:has-text("John Doe")')).toBeVisible();
    });

    test('should be accessible with ARIA attributes', async ({ page }) => {
        await page.goto('http://localhost:3002/');

        // Check for proper landmarks
        await expect(page.locator('main')).toBeVisible();
        await expect(page.locator('[role="banner"]')).toBeVisible();

        // Check for proper headings
        const h1 = await page.locator('h1').count();
        expect(h1).toBe(1);

        // Check for aria-labels
        await expect(page.locator('[aria-label="Статистика"]')).toBeVisible();
        await expect(page.locator('[aria-label="Переключить тему"]')).toBeVisible();
    });
});
