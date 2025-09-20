import { test, expect } from '@playwright/test';

test.describe('Edge Cases and Error Handling', () => {
  test('should prevent duplicate sweet creation', async ({ page }) => {
    // Login as admin first
    await page.goto('/login');
    await page.getByLabel('Email').fill('admin@example.com');
    await page.getByLabel('Password').fill('admin123456');
    await page.getByRole('button', { name: /login/i }).click();

    await page.getByRole('button', { name: /admin|manage/i }).click();
    await page.getByRole('button', { name: /add.*sweet|create/i }).click();

    // Try to create sweet with existing name
    await page.getByLabel('Name').fill('Chocolate Bar'); // Existing name
    await page.getByLabel('Category').fill('Candy');
    await page.getByLabel('Price').fill('2.99');
    await page.getByLabel('Quantity').fill('10');
    await page.getByRole('button', { name: /save|create/i }).click();

    await expect(page.getByText(/duplicate|already.*exists/i)).toBeVisible();
  });

  test('should block unauthorized access to admin routes', async ({ page }) => {
    // Try to access admin without login
    await page.goto('/admin');

    // Should redirect to login or show unauthorized
    await expect(page).toHaveURL(/\/login/);
  });

  test('should handle network errors gracefully', async ({ page }) => {
    await page.goto('/login');

    // Simulate network failure
    await page.route('**/api/**', (route) => route.abort());

    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: /login/i }).click();

    // Should show network error message
    await expect(
      page.getByText(/network.*error|connection.*failed|something.*wrong/i)
    ).toBeVisible();
  });

  test('should validate form inputs thoroughly', async ({ page }) => {
    await page.goto('/register');

    // Test email validation
    await page.getByLabel('Email').fill('invalid-email');
    await page.getByRole('button', { name: /register/i }).click();
    await expect(page.getByText(/invalid.*email|email.*format/i)).toBeVisible();

    // Test password length
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Password').fill('123'); // Too short
    await page.getByRole('button', { name: /register/i }).click();
    await expect(page.getByText(/password.*8.*characters/i)).toBeVisible();
  });

  test('should handle session expiry', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel('Email').fill('admin@example.com');
    await page.getByLabel('Password').fill('admin123456');
    await page.getByRole('button', { name: /login/i }).click();

    // Simulate expired token by intercepting API calls
    await page.route('**/api/**', (route) => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Unauthorized', message: 'Token expired' }),
      });
    });

    // Try to perform an action that requires authentication
    await page.reload();

    // Should redirect to login or show session expired message
    await expect(page.getByText(/session.*expired|please.*login|unauthorized/i)).toBeVisible();
  });

  test('should handle server errors gracefully', async ({ page }) => {
    await page.goto('/dashboard');

    // Simulate server error
    await page.route('**/api/sweets', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });

    await page.reload();

    // Should show error message instead of crashing
    await expect(page.getByText(/server.*error|something.*wrong|failed.*load/i)).toBeVisible();
  });
});
