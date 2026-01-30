import { test, expect } from '@playwright/test';

/**
 * UI-012: 404 Not Found Test
 * 
 * Description: Test 404 page for invalid routes
 * Expected Result: Should display NotFound page for invalid URLs
 */

test.describe('UI-012: 404 Not Found Page', () => {
  test('should show 404 page for invalid route', async ({ page }) => {
    await page.goto('/this-page-does-not-exist');
    await page.waitForLoadState('networkidle');

    // Page should load (not blank)
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Should still have header and footer
    const header = page.locator('header');
    await expect(header).toBeVisible();

    const footer = page.locator('footer');
    await expect(footer).toBeVisible();

    // Look for 404 indicators (common text patterns)
    const pageText = await page.textContent('body');
    const has404Indicator = 
      pageText.includes('404') ||
      pageText.toLowerCase().includes('not found') ||
      pageText.toLowerCase().includes('page not found') ||
      pageText.toLowerCase().includes("doesn't exist");

    expect(has404Indicator).toBe(true);
  });

  test('should have link back to home from 404', async ({ page }) => {
    await page.goto('/invalid-route-12345');
    await page.waitForLoadState('networkidle');

    // Should have a way to go back (home link)
    const homeLink = page.locator('a[href="/"], a:has-text("Home"), a:has-text("home")');
    const hasHomeLink = await homeLink.count() > 0;
    
    expect(hasHomeLink).toBe(true);
  });

  test('should handle deeply nested invalid routes', async ({ page }) => {
    await page.goto('/some/deeply/nested/invalid/path');
    await page.waitForLoadState('networkidle');

    // Should still show 404 page
    const header = page.locator('header');
    await expect(header).toBeVisible();

    const pageText = await page.textContent('body');
    const has404 = pageText.includes('404') || pageText.toLowerCase().includes('not found');
    expect(has404).toBe(true);
  });

  test('should not throw JavaScript errors on 404', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => {
      errors.push(error.message);
    });

    await page.goto('/nonexistent-page');
    await page.waitForLoadState('networkidle');

    // Should have no JavaScript errors
    expect(errors).toHaveLength(0);
  });
});
