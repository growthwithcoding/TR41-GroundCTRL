import { test, expect } from '@playwright/test';

/**
 * UI-012: 404 Not Found Test
 * 
 * Description: Test 404 page for invalid routes
 * Expected Result: Should display NotFound page for invalid URLs
 */

test.describe('UI-012: 404 Not Found Page', () => {
  test('should show 404 page for invalid route', async ({ page }) => {
    console.log('Testing 404 page for /this-page-does-not-exist');

    await page.goto('/this-page-does-not-exist');
    await page.waitForLoadState('networkidle');
    
    // Wait for React to render 404 content
    await page.waitForFunction(() => {
      const body = document.body;
      return body && body.textContent && body.textContent.length > 0;
    }, { timeout: 10000 });

    // Debug: Log current URL and page content
    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);

    const body = page.locator('body');
    const isBodyVisible = await body.isVisible();
    console.log('Body visible:', isBodyVisible);

    // Get all text content
    const pageText = await page.textContent('body');
    console.log('Page text length:', pageText?.length);
    console.log('Page text preview:', pageText?.substring(0, 200));

    // Page should load (not blank)
    await expect(body).toBeVisible();

    // Should still have header and footer
    const header = page.locator('header');
    const footer = page.locator('footer');

    const headerVisible = await header.isVisible().catch(() => false);
    const footerVisible = await footer.isVisible().catch(() => false);

    console.log('Header visible:', headerVisible);
    console.log('Footer visible:', footerVisible);

    // Look for 404 indicators (common text patterns)
    const has404Indicator =
      pageText.includes('404') ||
      pageText.toLowerCase().includes('not found') ||
      pageText.toLowerCase().includes('page not found') ||
      pageText.toLowerCase().includes("doesn't exist");

    console.log('Has 404 indicator:', has404Indicator);

    if (!has404Indicator) {
      console.log('404 text not found. Looking for h1 with 404...');
      const h1Text = await page.locator('h1').textContent().catch(() => '');
      console.log('H1 text:', h1Text);

      const h2Text = await page.locator('h2').textContent().catch(() => '');
      console.log('H2 text:', h2Text);
    }

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
    console.log('Testing deeply nested invalid route: /some/deeply/nested/invalid/path');

    await page.goto('/some/deeply/nested/invalid/path');
    await page.waitForLoadState('networkidle');
    
    // Wait for React to render 404 content
    await page.waitForFunction(() => {
      const body = document.body;
      return body && body.textContent && body.textContent.length > 0;
    }, { timeout: 10000 });

    const currentUrl = page.url();
    console.log('Current URL:', currentUrl);

    // Should still show 404 page
    const header = page.locator('header');
    const headerVisible = await header.isVisible().catch(() => false);
    console.log('Header visible:', headerVisible);

    const pageText = await page.textContent('body');
    console.log('Page text length:', pageText?.length);
    console.log('Page text preview:', pageText?.substring(0, 200));

    const has404 = pageText.includes('404') || pageText.toLowerCase().includes('not found');
    console.log('Has 404 text:', has404);

    if (!has404) {
      console.log('404 text not found. Checking specific elements...');
      const h1Text = await page.locator('h1').textContent().catch(() => '');
      console.log('H1 text:', h1Text);
    }

    expect(has404).toBe(true);
  });

  test('should not throw JavaScript errors on 404', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => {
      errors.push(error.message);
    });

    await page.goto('/nonexistent-page');
    await page.waitForLoadState('networkidle');

    // Filter out expected network errors (backend API not running in E2E environment)
    // Different browsers report these failures differently:
    // - Chromium: "ERR_CONNECTION_REFUSED", "Failed to load resource"
    // - WebKit/Safari: "Could not connect to localhost", "due to access control checks"
    const actualJsErrors = errors.filter(error => {
      // Ignore network connection errors
      if (error.includes('ERR_CONNECTION_REFUSED')) return false;
      if (error.includes('Failed to load resource')) return false;
      if (error.includes('Failed to fetch')) return false;
      if (error.includes('Could not connect to localhost')) return false;
      if (error.includes('due to access control checks')) return false;
      if (error.includes('localhost:3001')) return false;
      if (error.includes('/api/v1/help/')) return false;
      return true;
    });

    // Should have no actual JavaScript errors
    expect(actualJsErrors).toHaveLength(0);
  });
});
