import { test, expect } from '@playwright/test';

test.describe('Edge Cases', () => {
  test('should prevent duplicate sweet creation', async ({ page }) => {
    await page.goto('/admin');
    await page.getByRole('button', { name: /add sweet/i }).click();
    await page.getByLabel('Name').fill('Test Sweet');
    await page.getByLabel('Category').fill('Candy');
    await page.getByLabel('Price').fill('10');
    await page.getByLabel('Quantity').fill('100');
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page.getByText(/duplicate/i)).toBeVisible();
  });

  test('should block unauthorized access to admin routes', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.getByText(/unauthorized/i)).toBeVisible();
  });
});
