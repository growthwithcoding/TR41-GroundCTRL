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
        waitUntil: 'networkidle', 
        timeout: 60000 
      });
      console.log('Page response status:', response?.status());
      console.log('Page URL:', page.url());
    } catch (error) {
      console.error('Failed to load page:', error.message);
      throw error;
    }
    
    // Wait for React to initialize by checking for content
    await page.waitForFunction(() => {
      const body = document.body;
      return body && body.textContent && body.textContent.length > 10;
    }, { timeout: 10000 });
    
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
      // Ignore network connection errors
      if (error.message.includes('ERR_CONNECTION_REFUSED')) return;
      if (error.message.includes('Failed to load resource')) return;
      if (error.message.includes('Failed to fetch')) return;
      if (error.message.includes('Could not connect to localhost')) return;
      if (error.message.includes('due to access control checks')) return;
      if (error.message.includes('localhost:3001')) return;
      if (error.message.includes('/api/v1/help/')) return;
      
      // Ignore CSS MIME type errors
      if (error.message.includes('MIME type') && error.message.includes('text/css')) return;
      if (error.message.includes('non CSS MIME types are not allowed')) return;
      if (error.message.includes('stylesheet') && error.message.includes('was not loaded')) return;
      
      // Ignore API rate limiting and capacity errors
      if (error.message.includes('Too Many Requests')) return;
      if (error.message.includes('429')) return;
      if (error.message.includes('Ground station capacity exceeded')) return;
      if (error.message.includes('rate limit')) return;
      
      errors.push(error.message);
      console.log('PAGE ERROR:', error.message);
    });
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        // Ignore Firebase errors
        if (msg.text().includes('Firebase') && msg.text().includes('auth/invalid-api-key')) {
          return;
        }
        // Ignore network connection errors
        if (msg.text().includes('ERR_CONNECTION_REFUSED')) return;
        if (msg.text().includes('Failed to load resource')) return;
        if (msg.text().includes('Failed to fetch')) return;
        if (msg.text().includes('Could not connect to localhost')) return;
        if (msg.text().includes('due to access control checks')) return;
        if (msg.text().includes('localhost:3001')) return;
        if (msg.text().includes('/api/v1/help/')) return;
        
        // Ignore CSS MIME type errors
        if (msg.text().includes('MIME type') && msg.text().includes('text/css')) return;
        if (msg.text().includes('non CSS MIME types are not allowed')) return;
        if (msg.text().includes('stylesheet') && msg.text().includes('was not loaded')) return;
        
        // Ignore API rate limiting and capacity errors
        if (msg.text().includes('Too Many Requests')) return;
        if (msg.text().includes('429')) return;
        if (msg.text().includes('Ground station capacity exceeded')) return;
        if (msg.text().includes('rate limit')) return;
        
        consoleErrors.push(msg.text());
        console.log('CONSOLE ERROR:', msg.text());
      }
    });

    await page.goto('/', { waitUntil: 'networkidle', timeout: 60000 });
    
    // Wait for page to stabilize
    await page.waitForLoadState('networkidle');

    console.log('Total page errors (excluding Firebase):', errors.length);
    console.log('Total console errors (excluding Firebase):', consoleErrors.length);

    // Log first few errors if any
    if (errors.length > 0) {
      console.log('First error:', errors[0]);
    }

    expect(errors).toHaveLength(0);
  });

  test('should have React root element', async ({ page }) => {
    await page.goto('/', { waitUntil: 'networkidle', timeout: 30000 });
    
    // Wait for React to render
    await page.waitForFunction(() => {
      return document.querySelector('#root, #app, [data-reactroot]');
    }, { timeout: 10000 });
    
    // Check for React root (usually #root or #app)
    const root = page.locator('#root, #app, [data-reactroot]');
    const count = await root.count();
    
    console.log('React root elements found:', count);
    
    expect(count).toBeGreaterThan(0);
  });
});
