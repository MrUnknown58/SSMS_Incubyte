import { test, expect } from '@playwright/test';

test.describe('Sweet CRUD Operations', () => {
  // Helper function to login as admin
  const loginAsAdmin = async (page: any) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('admin@example.com');
    await page.getByLabel('Password').fill('admin123456');
    await page.getByRole('button', { name: /login/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);
  };

  test('admin can create a sweet', async ({ page }) => {
    await loginAsAdmin(page);

    // Navigate to admin panel
    await page.getByRole('button', { name: /admin|manage/i }).click();

    // Create new sweet
    await page.getByRole('button', { name: /add|create.*sweet/i }).click();

    const uniqueName = `Test Sweet ${Date.now()}`;
    await page.getByLabel('Name').fill(uniqueName);
    await page.getByLabel('Category').fill('Test Category');
    await page.getByLabel('Price').fill('2.99');
    await page.getByLabel('Quantity').fill('50');
    await page.getByLabel('Description').fill('Test description');

    await page.getByRole('button', { name: /save|create/i }).click();

    // Verify sweet was created
    await expect(page.getByText(uniqueName)).toBeVisible();
  });

  test('admin can edit a sweet', async ({ page }) => {
    await loginAsAdmin(page);

    // Navigate to admin panel
    await page.getByRole('button', { name: /admin|manage/i }).click();

    // Edit first sweet
    await page.getByRole('button', { name: /edit/i }).first().click();

    await page.getByLabel('Price').fill('3.99');
    await page.getByRole('button', { name: /save|update/i }).click();

    // Verify edit was successful
    await expect(page.getByText(/updated|saved/i)).toBeVisible();
  });

  test('should list and search sweets', async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto('/dashboard');

    // Search for sweets
    await page.getByLabel('Search').fill('chocolate');

    // Wait for search results
    await page.waitForTimeout(1000);

    // Verify search results contain chocolate sweets
    const sweetCards = page.locator('[data-testid="sweet-card"]');
    await expect(sweetCards.first()).toBeVisible();
  });

  test('should filter sweets by price range', async ({ page }) => {
    await loginAsAdmin(page);

    await page.goto('/dashboard');

    // Set price filters
    await page.getByLabel('Min Price').fill('2.00');
    await page.getByLabel('Max Price').fill('5.00');
    await page.getByRole('button', { name: /filter|search/i }).click();

    // Wait for filter results
    await page.waitForTimeout(1000);

    // Verify filtered results
    const sweetCards = page.locator('[data-testid="sweet-card"]');
    await expect(sweetCards.first()).toBeVisible();
  });

  test('admin can delete a sweet', async ({ page }) => {
    await loginAsAdmin(page);

    // Navigate to admin panel
    await page.getByRole('button', { name: /admin|manage/i }).click();

    // Delete sweet (with confirmation)
    await page
      .getByRole('button', { name: /delete/i })
      .first()
      .click();
    await page.getByRole('button', { name: /confirm|yes|delete/i }).click();

    // Verify deletion success
    await expect(page.getByText(/deleted|removed/i)).toBeVisible();
  });
});
