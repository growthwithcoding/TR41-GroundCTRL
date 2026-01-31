import { test, expect } from '@playwright/test';

/**
 * Smoke Test - Basic app health check
 * This should pass if the app loads at all
 */

test.describe('Smoke Test', () => {
  test('should load the application', async ({ page }) => {
    console.log('=== SMOKE TEST: Attempting to load app ===');
    
    // Try to load the page
    try {
      const response = await page.goto('/', { 
        waitUntil: 'domcontentloaded', 
        timeout: 60000 
      });
      console.log('Page response status:', response?.status());
      console.log('Page URL:', page.url());
    } catch (error) {
      console.error('Failed to load page:', error.message);
      throw error;
    }
    
    // Wait longer for React to initialize
    await page.waitForTimeout(5000);
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'test-results/smoke-test.png', fullPage: true });
    
    // Check if ANYTHING rendered
    const body = page.locator('body');
    const hasContent = await body.textContent();
    
    console.log('Page content length:', hasContent?.length || 0);
    console.log('First 200 chars:', hasContent?.substring(0, 200));
    
    // Check for root element
    const root = await page.locator('#root').count();
    console.log('Root element found:', root > 0);
    
    const rootContent = await page.locator('#root').textContent();
    console.log('Root content length:', rootContent?.length || 0);
    
    // Body should have some content
    expect(hasContent).toBeTruthy();
    expect(hasContent.length).toBeGreaterThan(10);
  });

  test('should not have JavaScript errors', async ({ page }) => {
    const errors = [];
    const consoleErrors = [];
    
    page.on('pageerror', error => {
      // Ignore Firebase auth errors in CI (expected without config)
      if (error.message.includes('Firebase') && error.message.includes('auth/invalid-api-key')) {
        console.log('Ignoring expected Firebase config error in CI');
        return;
      }
      errors.push(error.message);
      console.log('PAGE ERROR:', error.message);
    });
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        // Ignore Firebase errors
        if (msg.text().includes('Firebase') && msg.text().includes('auth/invalid-api-key')) {
          return;
        }
        consoleErrors.push(msg.text());
        console.log('CONSOLE ERROR:', msg.text());
      }
    });

    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(2000);

    console.log('Total page errors (excluding Firebase):', errors.length);
    console.log('Total console errors (excluding Firebase):', consoleErrors.length);

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
