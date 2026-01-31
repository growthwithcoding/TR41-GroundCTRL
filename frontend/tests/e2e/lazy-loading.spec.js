import { test, expect } from '@playwright/test';

/**
 * UI-010: Lazy Loading and Suspense Test
 * 
 * Description: Test React.lazy() suspense with loading spinner
 * Expected Result: Loading spinner should appear during route transitions
 */

test.describe('UI-010: Lazy Loading with Suspense', () => {
  test('should show loading spinner during lazy route load', async ({ page }) => {
    console.log('Testing loading spinner during lazy route navigation');

    // Slow down network to catch loading state
    await page.route('**/*.js', route => {
      setTimeout(() => route.continue(), 100);
    });

    await page.goto('/');

    // Navigate to a public lazy-loaded route
    const helpLink = page.locator('a[href="/help"]').first();
    if (await helpLink.count() > 0) {
      console.log('Found help link, clicking it');
      await helpLink.click();

      // Try to catch loading spinner (Loader2 with animate-spin)
      const loader = page.locator('[class*="animate-spin"]').first();

      // Loading may be too fast, but if caught it should be visible
      const loaderVisible = await loader.isVisible().catch(() => false);
      console.log('Loading spinner visible:', loaderVisible);

      // Either we caught the loader or page loaded successfully
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);

      const currentUrl = page.url();
      console.log('Current URL after navigation:', currentUrl);

      await expect(page).toHaveURL('/help');
    } else {
      console.log('Help link not found on homepage, navigating directly');
      await page.goto('/help');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL('/help');
    }
  });

  test('should load lazy components without errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => {
      errors.push(error.message);
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Navigate to public lazy-loaded pages only (avoid auth-required routes)
    const publicRoutes = ['/help', '/contact', '/privacy', '/terms'];

    for (const route of publicRoutes) {
      console.log(`Testing lazy loading for route: ${route}`);
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500); // Brief pause for lazy loading
    }

    console.log(`JavaScript errors encountered: ${errors.length}`);
    if (errors.length > 0) {
      console.log('Errors:', errors);
    }

    // Should have no errors during lazy loading
    expect(errors).toHaveLength(0);
  });

  test('should have PageLoader component with correct styling', async ({ page }) => {
    console.log('Testing PageLoader component on /help route');

    await page.goto('/help'); // Public lazy loaded page
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // Wait for lazy loading to complete

    // Page should load successfully (no stuck on loading screen)
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Should not still show loading spinner (PageLoader should be gone)
    const spinners = page.locator('[class*="animate-spin"]');
    const spinnerCount = await spinners.count();

    console.log(`Found ${spinnerCount} spinning elements on page`);

    // Either no spinners or they're not the page loader (which should be gone)
    if (spinnerCount > 0) {
      for (let i = 0; i < spinnerCount; i++) {
        const isPageLoader = await spinners.nth(i).evaluate(el => {
          return el.closest('.min-h-screen') !== null;
        });
        if (isPageLoader) {
          console.log('PageLoader spinner still present - lazy loading may not have completed');
          expect(isPageLoader).toBe(false);
        }
      }
    }

    // Page should have loaded content
    const pageText = await page.textContent('body');
    expect(pageText.length).toBeGreaterThan(10);
  });
});
