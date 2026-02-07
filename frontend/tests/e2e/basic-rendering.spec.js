import { test, expect } from '@playwright/test';

/**
 * UI-001: Basic App Rendering Test
 * Related PR(s): #3, #45
 * 
 * Description: Load the app; verify Navbar, Footer, Home page render without JS errors.
 * Expected Result: All three components visible; console-free.
 */

test.describe('UI-001: Basic App Rendering', () => {
  test('should load app with Navbar, Footer, and Home page without console errors', async ({ page }) => {
    // Track console errors
    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Navigate to home page
    await page.goto('/', { waitUntil: 'networkidle', timeout: 30000 });
    
    // Check that Header (AppHeader) is visible
    const header = page.locator('header');
    await expect(header).toBeVisible({ timeout: 10000 });

    // Check that Footer is visible
    const footer = page.locator('footer');
    await expect(footer).toBeVisible({ timeout: 10000 });

    // Check that page has content
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Filter out expected network errors (backend API not running in E2E environment)
    // We only care about actual JavaScript runtime errors, not network failures
    // Different browsers report these failures differently:
    // - Chromium: "ERR_CONNECTION_REFUSED", "Failed to load resource"
    // - WebKit/Safari: "Could not connect to localhost", "due to access control checks"
    const actualJsErrors = consoleErrors.filter(error => {
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

    // Verify no actual JavaScript errors occurred
    expect(actualJsErrors).toHaveLength(0);
  });

  test('should have no JavaScript errors on initial load', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('/');
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

    expect(actualJsErrors).toHaveLength(0);
  });

  test('should load all critical page elements', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify page title is set
    const title = await page.title();
    expect(title).toBeTruthy();
    expect(title).toContain('GroundCTRL');

    // Verify header with navigation links
    const navLinks = page.locator('header nav a');
    await expect(navLinks.first()).toBeVisible();
    
    // Verify theme toggle button exists
    const themeToggle = page.locator('button:has(svg)');
    await expect(themeToggle.first()).toBeVisible();
  });
});
