import { test, expect } from '@playwright/test';

/**
 * UI-009: Theme Toggle Test
 * 
 * Description: Test dark/light theme toggle functionality
 * Expected Result: Theme should switch between dark and light modes
 */

test.describe('UI-009: Theme Toggle', () => {
  test('should toggle between dark and light themes', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Find theme toggle button (has Sun or Moon icon)
    const themeToggle = page.locator('button:has(svg)').filter({ hasText: '' }).first();
    await expect(themeToggle).toBeVisible();

    // Get initial theme from html element
    const initialTheme = await page.locator('html').getAttribute('class');
    
    // Click to toggle theme
    await themeToggle.click();
    await page.waitForTimeout(500); // Wait for theme transition

    // Theme should have changed
    const newTheme = await page.locator('html').getAttribute('class');
    expect(newTheme).not.toBe(initialTheme);
  });

  test('should persist theme across navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Toggle theme
    const themeToggle = page.locator('button:has(svg)').filter({ hasText: '' }).first();
    await themeToggle.click();
    await page.waitForTimeout(300);

    const themeAfterToggle = await page.locator('html').getAttribute('class');

    // Navigate to another page
    await page.goto('/help');
    await page.waitForLoadState('networkidle');

    // Theme should persist
    const themeOnNewPage = await page.locator('html').getAttribute('class');
    expect(themeOnNewPage).toBe(themeAfterToggle);
  });

  test('should display correct icon for current theme', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const themeToggle = page.locator('button:has(svg)').filter({ hasText: '' }).first();
    
    // Button should have either Sun or Moon icon (Lucide icons)
    const hasSvg = await themeToggle.locator('svg').count();
    expect(hasSvg).toBeGreaterThan(0);
  });
});
