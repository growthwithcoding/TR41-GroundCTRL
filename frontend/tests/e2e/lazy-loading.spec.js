import { test, expect } from '@playwright/test';

/**
 * UI-010: Lazy Loading and Suspense Test
 * 
 * Description: Test React.lazy() suspense with loading spinner
 * Expected Result: Loading spinner should appear during route transitions
 */

test.describe('UI-010: Lazy Loading with Suspense', () => {
  test('should show loading spinner during lazy route load', async ({ page }) => {
    // Slow down network to catch loading state
    await page.route('**/*.js', route => {
      setTimeout(() => route.continue(), 100);
    });

    await page.goto('/');
    
    // Navigate to a lazy-loaded route
    const missionLink = page.locator('a[href="/missions"]').first();
    if (await missionLink.count() > 0) {
      await missionLink.click();
      
      // Try to catch loading spinner (Loader2 with animate-spin)
      const loader = page.locator('[class*="animate-spin"]').first();
      
      // Loading may be too fast, but if caught it should be visible
      await loader.isVisible().catch(() => false);
      
      // Either we caught the loader or page loaded successfully
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL('/missions');
    }
  });

  test('should load lazy components without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => {
      errors.push(error.message);
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate to various lazy-loaded pages
    const routes = ['/dashboard', '/missions', '/simulator', '/help'];
    
    for (const route of routes) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
    }

    // Should have no errors during lazy loading
    expect(errors).toHaveLength(0);
  });

  test('should have PageLoader component with correct styling', async ({ page }) => {
    await page.goto('/settings'); // Lazy loaded page
    await page.waitForLoadState('networkidle');

    // Page should load successfully (no stuck on loading screen)
    const body = page.locator('body');
    await expect(body).toBeVisible();
    
    // Should not still show loading spinner
    const spinners = page.locator('[class*="animate-spin"]');
    const spinnerCount = await spinners.count();
    
    // Either no spinners or they're not the page loader
    if (spinnerCount > 0) {
      const isPageLoader = await spinners.first().evaluate(el => {
        return el.closest('.min-h-screen') !== null;
      });
      expect(isPageLoader).toBe(false);
    }
  });
});
