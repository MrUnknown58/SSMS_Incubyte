import { test, expect } from '@playwright/test';

test.describe('Restock Operations (Admin Only)', () => {
  // Helper function to login as admin
  const loginAsAdmin = async (page: any) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('admin@example.com');
    await page.getByLabel('Password').fill('admin123456');
    await page.getByRole('button', { name: /login/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  };

  test('admin can restock a sweet', async ({ page }) => {
    await loginAsAdmin(page);

    // Navigate to admin panel
    await page.getByRole('button', { name: /admin|manage/i }).click();

    // Find restock button for first sweet
    await page
      .getByRole('button', { name: /restock/i })
      .first()
      .click();

    // Set restock quantity
    await page.getByLabel('Quantity').fill('50');
    await page.getByRole('button', { name: /confirm|restock/i }).click();

    // Verify restock success
    await expect(page.getByText(/restock.*successful|restocked/i)).toBeVisible();
  });

  test('should validate restock quantity', async ({ page }) => {
    await loginAsAdmin(page);

    await page.getByRole('button', { name: /admin|manage/i }).click();
    await page
      .getByRole('button', { name: /restock/i })
      .first()
      .click();

    // Try invalid quantities
    await page.getByLabel('Quantity').fill('0');
    await expect(page.getByText(/quantity.*must.*least.*1/i)).toBeVisible();

    await page.getByLabel('Quantity').fill('-10');
    await expect(page.getByText(/quantity.*must.*positive/i)).toBeVisible();
  });

  test('should update stock quantity after restock', async ({ page }) => {
    await loginAsAdmin(page);

    await page.getByRole('button', { name: /admin|manage/i }).click();

    // Get current stock
    const stockElement = page.locator('[data-testid="stock-quantity"]').first();
    const currentStock = await stockElement.textContent();

    // Restock
    await page
      .getByRole('button', { name: /restock/i })
      .first()
      .click();
    await page.getByLabel('Quantity').fill('25');
    await page.getByRole('button', { name: /confirm|restock/i }).click();

    // Wait for update
    await page.waitForTimeout(1000);

    // Verify stock increased
    const newStock = await stockElement.textContent();
    expect(parseInt(newStock || '0')).toBeGreaterThan(parseInt(currentStock || '0'));
  });

  test('should handle large restock quantities', async ({ page }) => {
    await loginAsAdmin(page);

    await page.getByRole('button', { name: /admin|manage/i }).click();
    await page
      .getByRole('button', { name: /restock/i })
      .first()
      .click();

    // Large quantity
    await page.getByLabel('Quantity').fill('1000');
    await page.getByRole('button', { name: /confirm|restock/i }).click();

    // Should handle successfully
    await expect(page.getByText(/restock.*successful|restocked/i)).toBeVisible();
  });

  test('non-admin user cannot access restock', async ({ page }) => {
    // Login as regular user
    await page.goto('/login');
    await page.getByLabel('Email').fill('user@example.com');
    await page.getByLabel('Password').fill('user123456');
    await page.getByRole('button', { name: /login/i }).click();

    await page.goto('/dashboard');

    // Restock buttons should not be visible for regular users
    const restockButtons = page.getByRole('button', { name: /restock/i });
    await expect(restockButtons).toHaveCount(0);
  });
});
