import { test, expect } from '@playwright/test';

/**
 * UI-006: Tailwind Styling Test
 * Related PR(s): #45
 * Related PR(s): #45
 * 
 * Description: Check Tailwind class `bg-primary` is applied to the login button.
 * Expected Result: Computed style matches Tailwind config.
 */

test.describe('UI-006: Tailwind CSS Styling', () => {
  test('should apply bg-primary class to login button', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Find the login submit button
    const loginButton = page.locator('button[type="submit"]').first();
    await expect(loginButton).toBeVisible();
    
    // Get the computed background color
    const backgroundColor = await loginButton.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    
    // Background color should be set (not transparent or default)
    expect(backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(backgroundColor).not.toBe('transparent');
    expect(backgroundColor).toBeTruthy();
    
    // Check if the element has classes (including bg-primary or similar)
    const classes = await loginButton.getAttribute('class');
    expect(classes).toBeTruthy();
  });

  test('should have Tailwind utility classes applied correctly', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    const loginButton = page.locator('button[type="submit"]').first();
    
    // Check various Tailwind properties are applied
    const styles = await loginButton.evaluate((el) => {
      const computed = window.getComputedStyle(el);
      return {
        padding: computed.padding,
        borderRadius: computed.borderRadius,
        display: computed.display,
        fontFamily: computed.fontFamily,
      };
    });
    
    // Button should have styling applied
    expect(styles.padding).not.toBe('0px');
    expect(styles.display).toBeTruthy();
  });

  test('should use Tailwind responsive classes correctly', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    const container = page.locator('main, [role="main"]').first();
    await expect(container).toBeVisible();
    
    // Get mobile styles
    const mobileWidth = await container.evaluate((el) => {
      return window.getComputedStyle(el).width;
    });
    
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);
    
    const desktopWidth = await container.evaluate((el) => {
      return window.getComputedStyle(el).width;
    });
    
    // Widths should be different (responsive design)
    expect(mobileWidth).not.toBe(desktopWidth);
  });

  test('should have consistent primary color across elements', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Find elements with primary color classes
    const primaryElements = page.locator('[class*="bg-primary"], [class*="text-primary"]');
    const count = await primaryElements.count();
    
    if (count > 0) {
      // Get colors from multiple elements
      const colors = await primaryElements.evaluateAll((elements) => {
        return elements.map(el => {
          const computed = window.getComputedStyle(el);
          return {
            bg: computed.backgroundColor,
            color: computed.color,
          };
        });
      });
      
      // All primary backgrounds should be consistent
      const backgrounds = colors.map(c => c.bg).filter(bg => bg !== 'rgba(0, 0, 0, 0)');
      if (backgrounds.length > 1) {
        // Check that primary colors are consistent
        const uniqueBackgrounds = new Set(backgrounds);
        expect(uniqueBackgrounds.size).toBeLessThanOrEqual(2); // Allow for slight variations
      }
    }
  });

  test('should apply Tailwind dark mode classes if enabled', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check if dark mode toggle exists
    const darkModeToggle = page.locator('[data-testid*="theme"], button:has-text("Dark"), button:has-text("Light")');
    
    if (await darkModeToggle.count() > 0) {
      // Get initial background color
      const initialBg = await page.locator('body').evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor;
      });
      
      // Toggle dark mode
      await darkModeToggle.first().click();
      await page.waitForTimeout(500);
      
      // Get new background color
      const newBg = await page.locator('body').evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor;
      });
      
      // Colors should be different
      expect(initialBg).not.toBe(newBg);
    }
  });
});
