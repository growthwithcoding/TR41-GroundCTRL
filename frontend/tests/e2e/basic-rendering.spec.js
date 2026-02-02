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

    // Verify no console errors occurred
    expect(consoleErrors).toHaveLength(0);
  });

  test('should have no JavaScript errors on initial load', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    expect(errors).toHaveLength(0);
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
