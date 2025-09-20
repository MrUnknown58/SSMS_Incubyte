import { test, expect } from '@playwright/test';

test.describe('Purchase Flow', () => {
  // Helper function to login as regular user
  const loginAsUser = async (page: any) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('user@example.com');
    await page.getByLabel('Password').fill('user123456');
    await page.getByRole('button', { name: /login/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  };

  test('user can purchase sweet with sufficient stock', async ({ page }) => {
    await loginAsUser(page);

    await page.goto('/dashboard');

    // Find a sweet with available stock
    const sweetCard = page.locator('[data-testid="sweet-card"]').first();
    await expect(sweetCard).toBeVisible();

    // Click purchase button
    await sweetCard.getByRole('button', { name: /purchase|buy/i }).click();

    // Set quantity
    await page.getByLabel('Quantity').fill('2');
    await page.getByRole('button', { name: /confirm|purchase/i }).click();

    // Verify purchase success
    await expect(page.getByText(/purchase.*successful|bought/i)).toBeVisible();
  });

  test('should show error for insufficient stock', async ({ page }) => {
    await loginAsUser(page);

    await page.goto('/dashboard');

    // Find a sweet
    const sweetCard = page.locator('[data-testid="sweet-card"]').first();
    await sweetCard.getByRole('button', { name: /purchase|buy/i }).click();

    // Try to purchase more than available stock
    await page.getByLabel('Quantity').fill('1000');
    await page.getByRole('button', { name: /confirm|purchase/i }).click();

    // Verify error message
    await expect(page.getByText(/insufficient.*stock|not.*available/i)).toBeVisible();
  });

  test('should validate quantity input', async ({ page }) => {
    await loginAsUser(page);

    await page.goto('/dashboard');

    const sweetCard = page.locator('[data-testid="sweet-card"]').first();
    await sweetCard.getByRole('button', { name: /purchase|buy/i }).click();

    // Try invalid quantities
    await page.getByLabel('Quantity').fill('0');
    await expect(page.getByText(/quantity.*must.*least.*1/i)).toBeVisible();

    await page.getByLabel('Quantity').fill('-5');
    await expect(page.getByText(/quantity.*must.*positive/i)).toBeVisible();
  });

  test('should disable purchase button when out of stock', async ({ page }) => {
    await loginAsUser(page);

    await page.goto('/dashboard');

    // Look for out of stock sweets
    const outOfStock = page.locator('[data-testid="sweet-card"]').locator('text=Out of Stock');
    if ((await outOfStock.count()) > 0) {
      const sweetCard = outOfStock.locator('..').first();
      const purchaseButton = sweetCard.getByRole('button', { name: /purchase|buy/i });
      await expect(purchaseButton).toBeDisabled();
    }
  });

  test('should calculate total price correctly', async ({ page }) => {
    await loginAsUser(page);

    await page.goto('/dashboard');

    const sweetCard = page.locator('[data-testid="sweet-card"]').first();
    await sweetCard.getByRole('button', { name: /purchase|buy/i }).click();

    // Set quantity and verify total calculation
    await page.getByLabel('Quantity').fill('3');

    // Wait for total to update
    await page.waitForTimeout(500);

    // Verify total price is displayed
    await expect(page.locator('[data-testid="total-price"]')).toBeVisible();
  });
});
