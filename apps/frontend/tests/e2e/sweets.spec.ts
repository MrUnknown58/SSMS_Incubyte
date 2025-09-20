import { test, expect } from '@playwright/test';

test.describe('Sweet CRUD', () => {
  test('admin can create a sweet', async ({ page }) => {
    await page.goto('/admin');
    await page.getByRole('button', { name: /add sweet/i }).click();
    await page.getByLabel('Name').fill('Test Sweet');
    await page.getByLabel('Category').fill('Candy');
    await page.getByLabel('Price').fill('10');
    await page.getByLabel('Quantity').fill('100');
    await page.getByRole('button', { name: /save/i }).click();
    await expect(page.getByText('Test Sweet')).toBeVisible();
  });

  test('should list and search sweets', async ({ page }) => {
    await page.goto('/dashboard');
    await page.getByLabel('Search').fill('Test Sweet');
    await expect(page.getByText('Test Sweet')).toBeVisible();
  });
});
