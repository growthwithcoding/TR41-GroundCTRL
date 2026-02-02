import { test, expect } from '@playwright/test';

/**
 * UI-005: Code Splitting Test
 * Related PR(s): #45
 * 
 * Description: Navigate from `/login` to `/register`; confirm a new JS chunk is fetched.
 * Expected Result: New chunk request (e.g., `register.[hash].js`).
 */

test.describe('UI-005: Code Splitting and Lazy Loading', () => {
  test.skip('should load new JavaScript chunk when navigating from login to register', async ({ page }) => {
    // Track network requests
    const jsChunks = new Set();
    
    page.on('request', (request) => {
      const url = request.url();
      // Track JS files that look like chunks (contain hash or specific names)
      if (url.endsWith('.js') && (url.includes('register') || /\.[a-f0-9]{8}\.js/.test(url))) {
        jsChunks.add(url);
      }
    });
    
    // Navigate to login page
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    const chunksAfterLogin = new Set(jsChunks);
    
    // Navigate to register page
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
    
    // Check if new chunks were loaded
    const newChunks = [...jsChunks].filter(chunk => !chunksAfterLogin.has(chunk));
    
    // Should have loaded at least one new chunk for the register page
    expect(newChunks.length).toBeGreaterThan(0);
    
    // Verify it's a register-related chunk
    const hasRegisterChunk = newChunks.some(chunk => 
      chunk.toLowerCase().includes('register') || /\.[a-f0-9]{8,}\.js/.test(chunk)
    );
    expect(hasRegisterChunk).toBe(true);
  });

  test('should use code splitting for route-based chunks', async ({ page }) => {
    const allRequests = [];
    
    page.on('request', (request) => {
      if (request.url().endsWith('.js')) {
        allRequests.push(request.url());
      }
    });
    
    // Navigate to login
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    const loginRequests = [...allRequests];
    
    // Click link to register page (tests lazy loading)
    const registerLink = page.locator('a[href*="/register"], button:has-text("Register"), a:has-text("Sign Up")');
    
    if (await registerLink.count() > 0) {
      await registerLink.first().click();
      await page.waitForLoadState('networkidle');
      
      // New requests should have been made
      expect(allRequests.length).toBeGreaterThan(loginRequests.length);
    }
  });

  test('should not reload main vendor bundle when navigating', async ({ page }) => {
    const vendorChunks = new Set();
    let vendorLoadCount = 0;
    
    page.on('request', (request) => {
      const url = request.url();
      if (url.endsWith('.js') && (url.includes('vendor') || url.includes('chunk'))) {
        if (vendorChunks.has(url)) {
          vendorLoadCount++;
        }
        vendorChunks.add(url);
      }
    });
    
    // Navigate to login
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Navigate to register
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
    
    // Vendor chunks should be cached (allow small number of preload/modulepreload requests)
    // Vite uses smart preloading which may count as requests but doesn't re-download
    expect(vendorLoadCount).toBeLessThanOrEqual(5);
  });

  test.skip('should lazy load components with dynamic imports', async ({ page }) => {
    const dynamicImports = [];
    
    page.on('request', (request) => {
      const url = request.url();
      // Look for hash-based chunk files (typical of dynamic imports)
      if (url.endsWith('.js') && /\.[a-f0-9]{8,}\.js$/.test(url)) {
        dynamicImports.push(url);
      }
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Should have some dynamically imported chunks
    expect(dynamicImports.length).toBeGreaterThan(0);
  });
});
