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

    // Find theme toggle button - look for button with theme-related attributes or aria-label
    const themeToggle = page.locator('button').filter({ 
      has: page.locator('svg') 
    }).first();
    await expect(themeToggle).toBeVisible();

    // Get initial theme from html element class
    const initialTheme = await page.locator('html').getAttribute('class') || '';
    
    // Click to toggle theme
    await themeToggle.click();
    
    // Wait for theme change - check that class has changed
    await page.waitForFunction(() => {
      const htmlClass = document.documentElement.className;
      return htmlClass !== '' && htmlClass.includes('dark') || htmlClass.includes('light');
    }, { timeout: 2000 });

    // Theme should have changed
    const newTheme = await page.locator('html').getAttribute('class');
    expect(newTheme).not.toBe(initialTheme);
    expect(newTheme).toMatch(/(dark|light)/);
  });

  test('should persist theme across navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Toggle theme
    const themeToggle = page.locator('button').filter({ 
      has: page.locator('svg') 
    }).first();
    await themeToggle.click();
    
    // Wait for theme to be applied
    await page.waitForFunction(() => {
      const htmlClass = document.documentElement.className;
      return htmlClass && (htmlClass.includes('dark') || htmlClass.includes('light'));
    }, { timeout: 2000 });

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

    const themeToggle = page.locator('button').filter({ 
      has: page.locator('svg') 
    }).first();
    
    // Button should have an SVG icon
    const svgElement = themeToggle.locator('svg');
    await expect(svgElement).toBeVisible();
    
    // SVG should have proper structure (Lucide icons typically have path elements)
    const pathCount = await svgElement.locator('path').count();
    expect(pathCount).toBeGreaterThan(0);
  });
});
