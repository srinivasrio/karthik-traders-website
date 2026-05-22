import { test, expect } from '@playwright/test';

test('debug admin products page console', async ({ page }) => {
    page.on('console', msg => {
        console.log(`BROWSER CONSOLE [${msg.type()}]: ${msg.text()}`);
    });

    page.on('pageerror', err => {
        console.error(`BROWSER ERROR: ${err.message}`);
    });

    console.log('Navigating to admin products page...');
    await page.goto('http://localhost:3005/admin/products');
    
    // Wait to let page load and execute queries
    await page.waitForTimeout(5000);

    // Count rows in the table
    const rowCount = await page.locator('table tbody tr').count();
    console.log(`Number of product rows rendered in table: ${rowCount}`);

    // Take screenshot
    const screenshotPath = '/Users/srinivaskumar/.gemini/antigravity-ide/brain/172e9933-2b48-401e-a19a-921ae973c263/admin-products.png';
    await page.screenshot({ path: screenshotPath });
    console.log(`Screenshot saved to: ${screenshotPath}`);
});
