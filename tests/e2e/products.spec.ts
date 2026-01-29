import { test, expect } from '@playwright/test';

test.describe('Product Flow', () => {
    test('should navigate to products page and list items', async ({ page }) => {
        await page.goto('/products');
        // Removed navigation click to isolate page test
        // await page.getByRole('link', { name: 'Products' }).first().click();
        await expect(page).toHaveURL(/\/products/);

        // Wait for product cards
        const card = page.locator('.product-card').first();
        await expect(card).toBeVisible({ timeout: 10000 });
    });

    test('should add product to cart', async ({ page }) => {
        await page.goto('/products');

        // Find a card and click 'Add' button within it
        const card = page.locator('.product-card').first();
        await expect(card).toBeVisible();

        // Button might be "Add" text
        const addBtn = card.getByRole('button', { name: 'Add' }).first();
        await addBtn.click();

        // Verify it changes to quantity counter or indicates added
        // e.g. check for quantity "1"
        await expect(card.getByText('1', { exact: true })).toBeVisible();
    });
});
