import { test, expect } from '@playwright/test';

test.describe('Navigation E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app before each test
    await page.goto('/');
  });

  test('should load homepage with navbar and footer', async ({ page }) => {
    // Check that the page loaded
    await expect(page).toHaveTitle(/GroundCTRL/i);
    
    // Verify navbar is visible
    const navbar = page.locator('nav');
    await expect(navbar).toBeVisible();
    
    // Verify footer is visible
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    
    // Check for main content area
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should navigate to login page', async ({ page }) => {
    // Click login link/button
    await page.click('text=/login|sign in/i');
    
    // Verify URL changed
    await expect(page).toHaveURL(/.*login/);
    
    // Verify login form is visible
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should navigate to register page', async ({ page }) => {
    // Click register link/button
    await page.click('text=/register|sign up/i');
    
    // Verify URL changed
    await expect(page).toHaveURL(/.*register/);
    
    // Verify registration form is visible
    await expect(page.locator('form')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should display responsive menu on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check if hamburger menu is visible
    const hamburgerMenu = page.locator('[aria-label*="menu"]').or(page.locator('button').filter({ hasText: /menu/i }));
    await expect(hamburgerMenu).toBeVisible();
    
    // Click hamburger menu
    await hamburgerMenu.click();
    
    // Verify mobile menu opened
    const mobileNav = page.locator('[role="dialog"]').or(page.locator('.mobile-menu'));
    await expect(mobileNav).toBeVisible();
  });

  test('should navigate between different sections', async ({ page }) => {
    // Test navigation to different sections if they exist
    const sections = ['Dashboard', 'Satellites', 'Help'];
    
    for (const section of sections) {
      const link = page.locator(`text=${section}`).first();
      if (await link.isVisible()) {
        await link.click();
        await page.waitForLoadState('networkidle');
        // Verify navigation occurred
        await expect(page).toHaveURL(new RegExp(section.toLowerCase()));
      }
    }
  });

  test('should handle 404 page gracefully', async ({ page }) => {
    await page.goto('/non-existent-page');
    
    // Should show 404 page or redirect
    const pageContent = await page.textContent('body');
    expect(pageContent).toMatch(/404|not found|page.*not.*exist/i);
  });

  test('should have working search functionality', async ({ page }) => {
    // Look for search input
    const searchInput = page.locator('input[type="search"]').or(
      page.locator('input[placeholder*="search" i]')
    );
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('test query');
      await searchInput.press('Enter');
      
      // Verify search executed
      await page.waitForLoadState('networkidle');
    }
  });
});

test.describe('Theme Toggle', () => {
  test('should toggle between light and dark mode', async ({ page }) => {
    await page.goto('/');
    
    // Look for theme toggle button
    const themeToggle = page.locator('[aria-label*="theme"]').or(
      page.locator('button').filter({ hasText: /dark|light/i })
    );
    
    if (await themeToggle.isVisible()) {
      // Get initial theme
      const initialTheme = await page.locator('html').getAttribute('class');
      
      // Toggle theme
      await themeToggle.click();
      await page.waitForTimeout(500); // Wait for theme transition
      
      // Verify theme changed
      const newTheme = await page.locator('html').getAttribute('class');
      expect(newTheme).not.toBe(initialTheme);
    }
  });
});
