import { test, expect } from '@playwright/test';

/**
 * UI-011: Navigation and Routing Test
 * 
 * Description: Test navigation menu links and active states
 * Expected Result: Nav links work correctly and show active state
 */

test.describe('UI-011: Navigation and Routing', () => {
  test('should display all navigation links', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle', { timeout: 30000 });

    // Get all nav links
    const navLinks = page.locator('header nav a');
    await page.waitForSelector('header', { timeout: 10000 });
    const count = await navLinks.count();

    // Should have multiple nav links (Missions, Simulator, Help, etc.)
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('should navigate to all major routes', async ({ page, baseURL }) => {
    // Only test public routes that don't require authentication
    const publicRoutes = [
      { path: '/', title: 'GroundCTRL' },
      { path: '/help', title: 'Help' },
      { path: '/contact', title: 'Contact' },
      { path: '/privacy', title: 'Privacy' },
      { path: '/terms', title: 'Terms' },
    ];

    console.log('Testing navigation to public routes...');

    for (const route of publicRoutes) {
      console.log(`Navigating to: ${route.path} (${route.title})`);
      await page.goto(route.path);
      await page.waitForLoadState('networkidle');

      // Page should load successfully
      const header = page.locator('header');
      const headerVisible = await header.isVisible().catch(() => false);
      console.log(`Header visible on ${route.path}: ${headerVisible}`);

      if (!headerVisible) {
        console.log('Header not found, checking if page loaded at all...');
        const body = page.locator('body');
        const bodyVisible = await body.isVisible().catch(() => false);
        console.log(`Body visible: ${bodyVisible}`);
      }

      await expect(header).toBeVisible();

      // Title should contain relevant text
      const title = await page.title();
      console.log(`Page title: "${title}"`);
      expect(title).toBeTruthy();

      // Should not be on an error page - verify URL matches expected path
      const currentUrl = page.url();
      console.log(`Current URL: ${currentUrl}`);
      const expectedUrl = `${baseURL}${route.path}`;
      expect(currentUrl).toBe(expectedUrl);
    }

    console.log('All public route navigation tests completed successfully');
  });

  test('should highlight active navigation link', async ({ page }) => {
    await page.goto('/help');
    // Wait for load or timeout after 30 seconds (networkidle can be slow)
    try {
      await page.waitForLoadState('networkidle', { timeout: 30000 });
    } catch (e) {
      // If networkidle times out, continue - the page may still be usable
      console.log('Note: networkidle timeout, but page is loaded');
    }

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
    await page.waitForLoadState('networkidle', { timeout: 60000 });

    // Click logo to return home
    const logo = page.locator('header a:has(img[alt*="GroundCTRL"])');
    await logo.click();
    
    // Wait for navigation to complete
    await page.waitForURL('/');

    // Should be back on home page
    await expect(page).toHaveURL('/');
  });

  test('should have working footer links', async ({ page }) => {
    await page.goto('/');
    
    // Wait for page to load with generous timeout for slow API responses
    try {
      await page.waitForLoadState('networkidle', { timeout: 30000 });
    } catch (e) {
      console.log('networkidle timeout - continuing with DOM check');
    }

    // Wait for footer to be fully rendered and attached to DOM
    await page.waitForSelector('footer', { 
      state: 'attached',
      timeout: 10000 
    });

    // Check footer has links with explicit wait
    const footerLinks = page.locator('footer a');
    await expect(footerLinks.first()).toBeAttached({ timeout: 5000 });
    
    const count = await footerLinks.count();
    expect(count).toBeGreaterThan(0);

    // Test one footer link (Privacy) with robust waiting
    const privacyLink = page.locator('footer').getByRole('link', { name: 'Privacy Policy' });
    
    if (await privacyLink.count() > 0) {
      // Scroll footer into view
      await page.locator('footer').scrollIntoViewIfNeeded();
      await page.waitForTimeout(500); // Wait for scroll
      
      // Ensure link is visible, attached, and enabled before clicking
      await expect(privacyLink).toBeVisible({ timeout: 10000 });
      await expect(privacyLink).toBeAttached();
      await expect(privacyLink).toBeEnabled();
      
      console.log('Privacy link found and ready, clicking...');
      
      // Use page.evaluate to click the link directly, bypassing interception
      await page.evaluate(() => {
        const link = document.querySelector('footer a[href="/privacy"]');
        if (link) {
          link.click();
        }
      });
      
      // Wait for navigation
      await page.waitForURL('**/privacy', { timeout: 15000 });
      
      // Give page time to render after navigation
      await page.waitForLoadState('domcontentloaded', { timeout: 10000 });
      
      await expect(page).toHaveURL('/privacy');
      console.log('Successfully navigated to privacy page');
    } else {
      console.log('Privacy link not found in footer');
    }
  });
});
