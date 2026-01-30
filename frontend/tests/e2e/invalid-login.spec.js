import { test, expect } from '@playwright/test';

/**
 * UI-003: Invalid Login Test (Production Mode)
 * Related PR(s): #39
 * 
 * Description: Login with invalid credentials (prod mode). Verify generic error (`Invalid credentials`).
 * Expected Result: Error displayed; no hint of email existence.
 */

test.describe('UI-003: Invalid Login (Production Mode)', () => {
  test.use({
    extraHTTPHeaders: {
      'X-Test-Env': 'production',
    },
  });

  test('should show generic error for non-existent email', async ({ page }) => {
    await page.goto('/login');
    
    // Use a definitely non-existent email
    const fakeEmail = `nonexistent-${Date.now()}@example.com`;
    const fakePassword = 'WrongPassword123!';
    
    await page.fill('input[name="email"], input[type="email"]', fakeEmail);
    await page.fill('input[name="password"], input[type="password"]', fakePassword);
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for error message to appear
    await page.waitForTimeout(2000); // Allow time for error to display
    
    // Look for error message
    const errorMessage = page.locator('[role="alert"], .error, [class*="error"], [data-testid*="error"]');
    await expect(errorMessage.first()).toBeVisible();
    
    // Verify generic error message (should not reveal if email exists)
    const errorText = await errorMessage.first().textContent();
    expect(errorText.toLowerCase()).toMatch(/invalid credentials|invalid email or password|login failed/i);
    
    // Should NOT contain hints about email existence
    expect(errorText.toLowerCase()).not.toContain('user not found');
    expect(errorText.toLowerCase()).not.toContain('email does not exist');
    expect(errorText.toLowerCase()).not.toContain('no account');
  });

  test('should show generic error for wrong password on existing email', async ({ page }) => {
    await page.goto('/login');
    
    // Use a potentially existing test email with wrong password
    const testEmail = 'test-user@groundctrl.test';
    const wrongPassword = 'DefinitelyWrongPassword123!';
    
    await page.fill('input[name="email"], input[type="email"]', testEmail);
    await page.fill('input[name="password"], input[type="password"]', wrongPassword);
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    // Error should be generic
    const errorMessage = page.locator('[role="alert"], .error, [class*="error"]');
    
    if (await errorMessage.count() > 0) {
      const errorText = await errorMessage.first().textContent();
      expect(errorText.toLowerCase()).toMatch(/invalid credentials|invalid email or password|login failed/i);
      
      // Should not reveal password is wrong vs email not existing
      expect(errorText.toLowerCase()).not.toContain('wrong password');
      expect(errorText.toLowerCase()).not.toContain('incorrect password');
    }
  });

  test('should not redirect on invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.fill('input[name="email"], input[type="email"]', 'fake@example.com');
    await page.fill('input[name="password"], input[type="password"]', 'WrongPass123!');
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    // Should still be on login page
    const currentUrl = page.url();
    expect(currentUrl).toContain('/login');
  });

  test('should clear password field after failed login attempt', async ({ page }) => {
    await page.goto('/login');
    
    const passwordInput = page.locator('input[name="password"], input[type="password"]');
    
    await page.fill('input[name="email"], input[type="email"]', 'fake@example.com');
    await passwordInput.fill('WrongPass123!');
    
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
    
    // Password should be cleared for security
    const passwordValue = await passwordInput.inputValue();
    expect(passwordValue).toBe('');
  });
});
