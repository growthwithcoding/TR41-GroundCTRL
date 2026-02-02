import { test, expect } from '@playwright/test';

// Debug test for Firefox and WebKit rendering issues

test.describe('DEBUG: Cross-browser root element and errors', () => {
  test('should render root and log errors', async ({ page, browserName }) => {
    await page.goto('/');
    // Take a screenshot for visual inspection
    await page.screenshot({ path: `debug-${browserName}.png`, fullPage: true });
    // Log the HTML content for inspection
    const content = await page.content();
    console.log('HTML content:', content.slice(0, 1000)); // Print first 1000 chars
    // Check for root element
    const root = await page.locator('#root, #app, [data-reactroot]');
    const count = await root.count();
    console.log('Root element count:', count);
    expect(count).toBeGreaterThan(0);
  });

  test('should log all console and page errors', async ({ page }) => {
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
    await page.goto('/');
    await page.waitForTimeout(2000);
    console.log('Total page errors:', errors.length);
    console.log('Total console errors:', consoleErrors.length);
    if (errors.length > 0) console.log('First error:', errors[0]);
    if (consoleErrors.length > 0) console.log('First console error:', consoleErrors[0]);
    // Always pass so we get logs
    expect(true).toBe(true);
  });
});
