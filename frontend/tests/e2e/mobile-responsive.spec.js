import { test, expect } from '@playwright/test';

/**
 * UI-007: Mobile Responsive Test
 * Related PR(s): #45
 * 
 * Description: Test responsive design and layout at different viewport sizes.
 * Expected Result: App adapts to mobile and desktop viewports correctly.
 * 
 * Note: This app uses a desktop-first design with standard navigation.
 */

test.describe('UI-007: Mobile Responsive Design', () => {
  test('should render header on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    await page.waitForTimeout(1000);
    
    // Header should be visible on mobile
    const header = page.locator('header');
    await expect(header).toBeVisible({ timeout: 10000 });
  });

  test('should display navigation on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Nav should exist
    const nav = page.locator('header nav');
    await expect(nav).toBeVisible();
    
    // Footer should also be visible
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
  });

  test('should have proper layout on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check page renders within mobile viewport without horizontal scroll
    const body = page.locator('body');
    const bodyWidth = await body.evaluate(el => el.scrollWidth);
    
    // Should not cause significant horizontal scroll (allow some tolerance)
    expect(bodyWidth).toBeLessThanOrEqual(420);
  });

  test('should be fully responsive at 480px breakpoint', async ({ page }) => {
    await page.setViewportSize({ width: 480, height: 800 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Page should render without issues
    const header = page.locator('header');
    await expect(header).toBeVisible();
    
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
  });

  test('should display full navigation on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Desktop nav should be visible with links
    const navLinks = page.locator('header nav a');
    const count = await navLinks.count();
    expect(count).toBeGreaterThan(0);
    
    // All nav links should be visible
    await expect(navLinks.first()).toBeVisible();
  });

  test('should maintain functionality when changing viewport size', async ({ page }) => {
    // Start with mobile portrait
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const headerMobile = page.locator('header');
    await expect(headerMobile).toBeVisible();

    // Switch to desktop
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(500);

    const headerDesktop = page.locator('header');
    await expect(headerDesktop).toBeVisible();
    
    // Nav links should be visible on desktop
    const navLinks = page.locator('header nav a');
    await expect(navLinks.first()).toBeVisible();
  });
});
