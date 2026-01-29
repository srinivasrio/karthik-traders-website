import { test, expect } from '@playwright/test';

test.describe('Checkout Flow', () => {
    test('should verify checkout flow via bulk orders', async ({ page }) => {
        // 1. Add product from grid
        await page.goto('/products');
        const firstCard = page.locator('.product-card').first();
        await expect(firstCard).toBeVisible();

        // Find 'Add' button within the card and click it.
        // We avoid clicking the card itself as it navigates to PDP.
        const addBtn = firstCard.getByRole('button', { name: 'Add' }).first();
        await addBtn.click();

        // 2. Go to Cart
        await page.goto('/cart');

        // 3. Verify item in cart and proceed
        await expect(page.getByText('My Cart')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Proceed to Buy' })).toBeVisible();
        await page.getByRole('button', { name: 'Proceed to Buy' }).click();

        // 4. Verify navigation to Bulk Orders (Checkout)
        await expect(page).toHaveURL(/\/bulk-orders/);

        // 5. Verify Bulk Order Form
        // Looking for main heading or key form fields
        await expect(page.getByRole('heading', { name: /checkout/i })).toBeVisible();
    });
});
