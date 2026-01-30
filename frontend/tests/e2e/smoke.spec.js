import { test, expect } from '@playwright/test';

/**
 * Smoke Test - Basic app health check
 * This should pass if the app loads at all
 */

test.describe('Smoke Test', () => {
  test('should load the application', async ({ page }) => {
    // Just try to load the page
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    
    // Wait a bit
    await page.waitForTimeout(2000);
    
    // Check if ANYTHING rendered
    const body = page.locator('body');
    const hasContent = await body.textContent();
    
    console.log('Page content length:', hasContent?.length || 0);
    console.log('Page URL:', page.url());
    
    // Body should have some content
    expect(hasContent).toBeTruthy();
    expect(hasContent.length).toBeGreaterThan(0);
  });

  test('should not have JavaScript errors', async ({ page }) => {
    const errors = [];
    const consoleErrors = [];
    
    page.on('pageerror', error => {
      errors.push(error.message);
      console.log('PAGE ERROR:', error.message);
    });
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.log('CONSOLE ERROR:', msg.text());
      }
    });

    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    console.log('Total page errors:', errors.length);
    console.log('Total console errors:', consoleErrors.length);

    // Log first few errors if any
    if (errors.length > 0) {
      console.log('First error:', errors[0]);
    }

    expect(errors).toHaveLength(0);
  });

  test('should have React root element', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    // Check for React root (usually #root or #app)
    const root = page.locator('#root, #app, [data-reactroot]');
    const count = await root.count();
    
    console.log('React root elements found:', count);
    
    expect(count).toBeGreaterThan(0);
  });
});
