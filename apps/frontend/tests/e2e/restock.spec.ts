import { test, expect } from '@playwright/test';

test.describe('Restock Flow', () => {
  test('admin can restock a sweet', async ({ page }) => {
    await page.goto('/admin');
    await page.getByText('Test Sweet').click();
    await page.getByLabel('Restock Quantity').fill('50');
    await page.getByRole('button', { name: /restock/i }).click();
    await expect(page.getByText(/restocked/i)).toBeVisible();
  });
});
