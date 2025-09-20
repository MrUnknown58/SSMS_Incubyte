import { test, expect } from '@playwright/test';

test.describe('Purchase Flow', () => {
  test('user can purchase a sweet', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByText('Test Sweet').click();
    await page.getByLabel('Quantity').fill('2');
    await page.getByRole('button', { name: /purchase/i }).click();
    await expect(page.getByText(/success/i)).toBeVisible();
  });

  test('should show error for insufficient stock', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByText('Test Sweet').click();
    await page.getByLabel('Quantity').fill('9999');
    await page.getByRole('button', { name: /purchase/i }).click();
    await expect(page.getByText(/insufficient/i)).toBeVisible();
  });
});
