import { test, expect } from '@playwright/test';

/**
 * UI-404-001: 404 Error Page Test
 * Related PR(s): Error handling implementation
 *
 * Description: Test 404 error page displays correctly
 * Expected Result: Invalid routes show proper 404 page
 */

test.describe('UI-404-001: 404 Error Page', () => {
  test('should display 404 page for invalid routes', async ({ page }) => {
    // Navigate to a non-existent route
    await page.goto('/non-existent-page', { waitUntil: 'networkidle' });

    // Wait a bit for the page to load
    await page.waitForTimeout(1000);

    // Check for 404 content - be more specific
    const notFoundElements = [
      page.locator('h1').filter({ hasText: '404' }),
      page.locator('h2').filter({ hasText: /Page Not Found/i }),
      page.locator('text=/404/'),
      page.locator('text=/Page Not Found/i'),
      page.locator('[data-testid*="404"], [data-testid*="not-found"]'),
      page.locator('.not-found, .error-404')
    ];

    let notFoundFound = false;
    for (const element of notFoundElements) {
      try {
        const isVisible = await element.isVisible({ timeout: 3000 });
        if (isVisible) {
          notFoundFound = true;
          break;
        }
      } catch {}
    }

    expect(notFoundFound).toBe(true);
  });

  test('should have navigation back to home', async ({ page }) => {
    await page.goto('/invalid-route-that-does-not-exist', { waitUntil: 'networkidle' });

    // Look for navigation elements
    const navElements = [
      page.locator('a').filter({ hasText: /home|back|dashboard/i }),
      page.locator('button').filter({ hasText: /home|back|dashboard/i }),
      page.locator('[data-testid*="home"], [data-testid*="back"]'),
      page.locator('a[href="/"], a[href="/dashboard"]')
    ];

    let navigationFound = false;
    for (const element of navElements) {
      try {
        await expect(element).toBeVisible({ timeout: 3000 });
        navigationFound = true;
        break;
      } catch {}
    }

    expect(navigationFound).toBe(true);
  });

  test('should maintain consistent layout', async ({ page }) => {
    await page.goto('/this-page-definitely-does-not-exist', { waitUntil: 'networkidle' });

    // Check that the page has proper 404 content (minimal layout for 404 pages)
    const h1Element = page.locator('h1').filter({ hasText: '404' });
    const h2Element = page.locator('h2').filter({ hasText: /Page Not Found/i });

    await expect(h1Element).toBeVisible();
    await expect(h2Element).toBeVisible();

    // Check that the page has a proper title
    const title = await page.title();
    expect(title).toContain('404');
    expect(title).toContain('Not Found');
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/another-non-existent-route', { waitUntil: 'networkidle' });

    // Check that 404 content fits mobile screen
    const body = page.locator('body');
    const boundingBox = await body.boundingBox();

    expect(boundingBox.width).toBeLessThanOrEqual(375);
  });

  test('should handle multiple invalid routes', async ({ page }) => {
    const invalidRoutes = [
      '/completely-made-up-route',
      '/this/does/not/exist',
      '/invalid/path/with/many/segments',
      '/api/endpoint/that/is/not/real'
    ];

    for (const route of invalidRoutes) {
      await page.goto(route, { waitUntil: 'networkidle' });

      // Should show 404 content for each invalid route
      const notFoundContent = page.locator('h1, h2, p').filter({ hasText: /404|not.*found/i });
      await expect(notFoundContent.first()).toBeVisible({ timeout: 3000 });
    }
  });
});