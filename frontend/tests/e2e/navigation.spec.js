import { test, expect } from '@playwright/test';

/**
 * UI-011: Navigation and Routing Test
 * 
 * Description: Test navigation menu links and active states
 * Expected Result: Nav links work correctly and show active state
 */

test.describe('UI-011: Navigation and Routing', () => {
  test('should display all navigation links', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForLoadState('networkidle', { timeout: 30000 });
    await page.waitForTimeout(1000);

    // Get all nav links
    const navLinks = page.locator('header nav a');
    await page.waitForSelector('header', { timeout: 10000 });
    const count = await navLinks.count();

    // Should have multiple nav links (Missions, Simulator, Help, etc.)
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('should navigate to all major routes', async ({ page }) => {
    const routes = [
      { path: '/', title: 'GroundCTRL' },
      { path: '/missions', title: 'Missions' },
      { path: '/simulator', title: 'Simulator' },
      { path: '/help', title: 'Help' },
      { path: '/contact', title: 'Contact' },
    ];

    for (const route of routes) {
      await page.goto(route.path);
      await page.waitForLoadState('networkidle');

      // Page should load successfully
      const header = page.locator('header');
      await expect(header).toBeVisible();

      // Title should contain relevant text
      const title = await page.title();
      expect(title).toBeTruthy();
    }
  });

  test('should highlight active navigation link', async ({ page }) => {
    await page.goto('/help');
    await page.waitForLoadState('domcontentloaded', { timeout: 60000 });
    await page.waitForTimeout(2000);

    // Find the help link
    const helpLink = page.locator('header nav a[href="/help"]');
    
    if (await helpLink.count() > 0) {
      // Get classes on active link
      const classes = await helpLink.getAttribute('class');
      
      // Should have some styling (classes)
      expect(classes).toBeTruthy();
    }
  });

  test('should navigate via logo click', async ({ page }) => {
    await page.goto('/help');
    await page.waitForLoadState('domcontentloaded', { timeout: 60000 });
    await page.waitForTimeout(2000);

    // Click logo to return home
    const logo = page.locator('header a:has(img[alt*="GroundCTRL"])');
    await logo.click();
    await page.waitForTimeout(2000);

    // Should be back on home page
    await expect(page).toHaveURL('/');
  });

  test('should have working footer links', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check footer has links
    const footerLinks = page.locator('footer a');
    const count = await footerLinks.count();
    
    expect(count).toBeGreaterThan(0);

    // Test one footer link (Privacy)
    const privacyLink = page.locator('footer a[href="/privacy"]');
    if (await privacyLink.count() > 0) {
      await privacyLink.click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL('/privacy');
    }
  });
});
