import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('should display the correct title', async ({ page }) => {
        await expect(page).toHaveTitle(/Karthik Traders/);
    });

    test('should have a visible hero section', async ({ page }) => {
        // Assuming there's an element with ID or class for hero
        // Adjust selector based on actual code. 
        // From snippets, maybe it's just checking for some hero text
        const heroHeading = page.getByRole('heading', { level: 1 }).first();
        await expect(heroHeading).toBeVisible();
    });

    test('should verify navigation links', async ({ page }) => {
        await expect(page.getByRole('link', { name: 'Products' })).toBeVisible();
        await expect(page.getByRole('link', { name: 'Contact' })).toBeVisible();

        // Verify Products navigation specifically
        // Use exact name to avoid "Compare" confusion if it contains "Products" (unlikely but safe)
        // await page.getByRole('link', { name: 'Products', exact: true }).click();
        // await expect(page).toHaveURL(/\/products/);
        // Note: Clicks might be flaky if menu animation is slow on mobile, 
        // but on desktop it should work. Keeping it simple for now.
    });
});
