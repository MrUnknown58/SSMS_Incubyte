import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should register new user successfully', async ({ page }) => {
    await page.goto('/register');

    // Fill registration form
    await page.getByLabel('Name').fill('Test User');
    await page.getByLabel('Email').fill(`testuser+${Date.now()}@example.com`);
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: /register/i }).click();

    // Should redirect to login or dashboard
    await expect(page).toHaveURL(/\/(login|dashboard)/);
  });

  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/login');

    // Use test admin credentials
    await page.getByLabel('Email').fill('admin@example.com');
    await page.getByLabel('Password').fill('admin123456'); // 8+ chars required
    await page.getByRole('button', { name: /login/i }).click();

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByText(/dashboard|sweet/i)).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('Email').fill('wrong@example.com');
    await page.getByLabel('Password').fill('wrongpassword');
    await page.getByRole('button', { name: /login/i }).click();

    // Should show error message
    await expect(page.getByText(/invalid|error|unauthorized/i)).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByLabel('Email').fill('admin@example.com');
    await page.getByLabel('Password').fill('admin123456');
    await page.getByRole('button', { name: /login/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    // Logout
    await page.getByRole('button', { name: /logout|sign out/i }).click();

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('complete user journey: login → create → purchase → restock', async ({ page }) => {
    // 1. Login as admin
    await page.goto('/login');
    await page.getByLabel('Email').fill('admin@example.com');
    await page.getByLabel('Password').fill('admin123456');
    await page.getByRole('button', { name: /login/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    // 2. Create a new sweet
    await page.getByRole('button', { name: /admin|manage/i }).click();
    await page.getByRole('button', { name: /add.*sweet|create/i }).click();

    const uniqueName = `E2E Test Sweet ${Date.now()}`;
    await page.getByLabel('Name').fill(uniqueName);
    await page.getByLabel('Category').fill('E2E Test');
    await page.getByLabel('Price').fill('4.99');
    await page.getByLabel('Quantity').fill('20');
    if (await page.getByLabel('Description').isVisible()) {
      await page.getByLabel('Description').fill('E2E test sweet');
    }

    await page.getByRole('button', { name: /save|create/i }).click();
    await expect(page.getByText(uniqueName)).toBeVisible();

    // 3. Navigate to user dashboard and purchase
    await page.goto('/dashboard');

    // Find the created sweet and purchase it
    const sweetCard = page.locator(`text=${uniqueName}`).locator('..').first();
    await sweetCard.getByRole('button', { name: /purchase|buy/i }).click();

    await page.getByLabel('Quantity').fill('3');
    await page.getByRole('button', { name: /confirm|purchase/i }).click();

    // Verify purchase success
    await expect(page.getByText(/purchase.*successful|bought/i)).toBeVisible();

    // 4. Return to admin and restock
    await page.getByRole('button', { name: /admin|manage/i }).click();

    // Find the sweet and restock it
    const adminSweetCard = page.locator(`text=${uniqueName}`).locator('..').first();
    await adminSweetCard.getByRole('button', { name: /restock/i }).click();

    await page.getByLabel('Quantity').fill('30');
    await page.getByRole('button', { name: /confirm|restock/i }).click();

    // Verify restock success
    await expect(page.getByText(/restock.*successful|restocked/i)).toBeVisible();

    // 5. Verify stock levels updated
    await page.goto('/dashboard');
    const finalStock = page
      .locator(`text=${uniqueName}`)
      .locator('..')
      .locator('[data-testid="stock-quantity"]');
    await expect(finalStock).toContainText(/47/); // 20 - 3 + 30 = 47
  });
});
