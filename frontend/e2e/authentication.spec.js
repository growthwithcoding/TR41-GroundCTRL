import { test, expect } from '@playwright/test';

test.describe('Authentication E2E Tests', () => {
  const testEmail = `test-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  const testCallSign = `TEST-${Date.now()}`;

  test.describe('User Registration', () => {
    test('should register a new user successfully', async ({ page }) => {
      await page.goto('/register');
      
      // Fill registration form
      await page.fill('input[type="email"]', testEmail);
      await page.fill('input[type="password"]', testPassword);
      
      // Fill callSign if field exists
      const callSignInput = page.locator('input[name="callSign"]');
      if (await callSignInput.isVisible()) {
        await callSignInput.fill(testCallSign);
      }
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Wait for navigation after registration
      await page.waitForURL('**/dashboard', { timeout: 10000 }).catch(() => {
        // If dashboard redirect fails, check for home page
        return page.waitForURL('**/', { timeout: 5000 });
      });
      
      // Verify user is logged in (check for user avatar or profile indicator)
      const userIndicator = page.locator('[data-testid="user-avatar"]').or(
        page.locator('img[alt*="avatar"]')
      );
      await expect(userIndicator).toBeVisible();
    });

    test('should show error for invalid email format', async ({ page }) => {
      await page.goto('/register');
      
      await page.fill('input[type="email"]', 'invalid-email');
      await page.fill('input[type="password"]', testPassword);
      await page.click('button[type="submit"]');
      
      // Check for validation error
      const errorMessage = page.locator('text=/invalid.*email|email.*invalid/i');
      await expect(errorMessage).toBeVisible();
    });

    test('should show error for weak password', async ({ page }) => {
      await page.goto('/register');
      
      await page.fill('input[type="email"]', testEmail);
      await page.fill('input[type="password"]', 'weak');
      await page.click('button[type="submit"]');
      
      // Check for password validation error
      const errorMessage = page.locator('text=/password.*weak|password.*short|password.*must/i');
      await expect(errorMessage).toBeVisible();
    });

    test('should prevent registration with existing email', async ({ page }) => {
      const existingEmail = `existing-${Date.now()}@example.com`;
      
      // First registration
      await page.goto('/register');
      await page.fill('input[type="email"]', existingEmail);
      await page.fill('input[type="password"]', testPassword);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
      
      // Logout if needed
      const logoutButton = page.locator('text=/logout|sign out/i');
      if (await logoutButton.isVisible()) {
        await logoutButton.click();
        await page.waitForTimeout(1000);
      }
      
      // Try to register again with same email
      await page.goto('/register');
      await page.fill('input[type="email"]', existingEmail);
      await page.fill('input[type="password"]', testPassword);
      await page.click('button[type="submit"]');
      
      // Check for duplicate email error
      const errorMessage = page.locator('text=/already.*exists|email.*taken|already.*registered/i');
      await expect(errorMessage).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('User Login', () => {
    test.beforeAll(async ({ browser }) => {
      // Create a test user for login tests
      const page = await browser.newPage();
      await page.goto('/register');
      
      const uniqueEmail = `login-test-${Date.now()}@example.com`;
      await page.fill('input[type="email"]', uniqueEmail);
      await page.fill('input[type="password"]', testPassword);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
      
      await page.close();
    });

    test('should login with valid credentials', async ({ page }) => {
      await page.goto('/login');
      
      // Create fresh credentials for this test
      const loginEmail = `login-${Date.now()}@example.com`;
      
      // First register
      await page.goto('/register');
      await page.fill('input[type="email"]', loginEmail);
      await page.fill('input[type="password"]', testPassword);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
      
      // Logout
      const logoutButton = page.locator('text=/logout|sign out/i');
      if (await logoutButton.isVisible()) {
        await logoutButton.click();
        await page.waitForTimeout(1000);
      }
      
      // Now login
      await page.goto('/login');
      await page.fill('input[type="email"]', loginEmail);
      await page.fill('input[type="password"]', testPassword);
      await page.click('button[type="submit"]');
      
      // Verify successful login
      await page.waitForURL(/dashboard|home/, { timeout: 10000 });
      
      const userIndicator = page.locator('[data-testid="user-avatar"]').or(
        page.locator('img[alt*="avatar"]')
      );
      await expect(userIndicator).toBeVisible();
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/login');
      
      await page.fill('input[type="email"]', 'nonexistent@example.com');
      await page.fill('input[type="password"]', 'wrongpassword');
      await page.click('button[type="submit"]');
      
      // In production, should show generic error
      const errorMessage = page.locator('text=/invalid.*credentials|login.*failed|incorrect/i');
      await expect(errorMessage).toBeVisible();
      
      // Should NOT reveal specific details in production
      const detailedError = page.locator('text=/user.*not.*found|wrong.*password/i');
      await expect(detailedError).not.toBeVisible();
    });

    test('should handle empty form submission', async ({ page }) => {
      await page.goto('/login');
      
      await page.click('button[type="submit"]');
      
      // Check for validation errors
      const emailError = page.locator('text=/email.*required/i');
      const passwordError = page.locator('text=/password.*required/i');
      
      await expect(emailError.or(passwordError)).toBeVisible();
    });
  });

  test.describe('Protected Routes', () => {
    test('should redirect to login when accessing protected route', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Should redirect to login
      await expect(page).toHaveURL(/.*login/, { timeout: 5000 });
    });

    test('should access protected route after login', async ({ page }) => {
      // Login first
      const loginEmail = `protected-${Date.now()}@example.com`;
      
      await page.goto('/register');
      await page.fill('input[type="email"]', loginEmail);
      await page.fill('input[type="password"]', testPassword);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
      
      // Try accessing protected route
      await page.goto('/dashboard');
      
      // Should successfully access dashboard
      await expect(page).toHaveURL(/.*dashboard/);
    });
  });

  test.describe('Logout', () => {
    test('should logout successfully', async ({ page }) => {
      // Login first
      const logoutEmail = `logout-${Date.now()}@example.com`;
      
      await page.goto('/register');
      await page.fill('input[type="email"]', logoutEmail);
      await page.fill('input[type="password"]', testPassword);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
      
      // Click logout
      const logoutButton = page.locator('text=/logout|sign out/i');
      await logoutButton.click();
      
      // Should redirect to home or login page
      await page.waitForURL(/home|login|\/$/, { timeout: 5000 });
      
      // User avatar should no longer be visible
      const userIndicator = page.locator('[data-testid="user-avatar"]').or(
        page.locator('img[alt*="avatar"]')
      );
      await expect(userIndicator).not.toBeVisible();
    });
  });

  test.describe('Session Persistence', () => {
    test('should persist login across page reloads', async ({ page }) => {
      // Login
      const persistEmail = `persist-${Date.now()}@example.com`;
      
      await page.goto('/register');
      await page.fill('input[type="email"]', persistEmail);
      await page.fill('input[type="password"]', testPassword);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
      
      // Reload page
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // User should still be logged in
      const userIndicator = page.locator('[data-testid="user-avatar"]').or(
        page.locator('img[alt*="avatar"]')
      );
      await expect(userIndicator).toBeVisible();
    });
  });
});
