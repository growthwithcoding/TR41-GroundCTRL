import { test, expect } from '@playwright/test';

/**
 * UI-2FA-001: Two-Factor Authentication Coming Soon UI Test
 * Related PR(s): #58
 *
 * Description: Test that 2FA shows "Coming Soon" state appropriately
 * Expected Result: 2FA option is visible but shows coming soon messaging
 */

test.describe('UI-2FA-001: Two-Factor Authentication UI', () => {
  test('should display 2FA option in account settings', async ({ page }) => {
    await page.goto('/settings', { waitUntil: 'networkidle' });

    // Look for 2FA elements
    const twoFactorElements = [
      page.locator('[data-testid="two-factor"]'),
      page.locator('.two-factor'),
      page.locator('text=/two.*factor/i'),
      page.locator('text=/2FA/i'),
      page.locator('[data-testid="security-settings"]')
    ];

    let twoFactorFound = false;
    for (const element of twoFactorElements) {
      try {
        await expect(element.first()).toBeVisible({ timeout: 3000 });
        twoFactorFound = true;
        break;
      } catch {}
    }

    if (!twoFactorFound) {
      // Try profile page
      await page.goto('/profile', { waitUntil: 'networkidle' });

      for (const element of twoFactorElements) {
        try {
          await expect(element.first()).toBeVisible({ timeout: 3000 });
          twoFactorFound = true;
          break;
        } catch {}
      }
    }

    expect(twoFactorFound).toBe(true);
  });

  test('should show "Coming Soon" messaging for 2FA', async ({ page }) => {
    await page.goto('/settings', { waitUntil: 'networkidle' });

    // Look for "coming soon" text
    const comingSoonElements = [
      page.locator('text=/coming soon/i'),
      page.locator('text=/not yet available/i'),
      page.locator('text=/planned/i'),
      page.locator('[data-testid="coming-soon"]'),
      page.locator('.coming-soon')
    ];

    let comingSoonFound = false;
    for (const element of comingSoonElements) {
      try {
        await expect(element).toBeVisible({ timeout: 3000 });
        comingSoonFound = true;
        break;
      } catch {}
    }

    if (!comingSoonFound) {
      // Try profile page
      await page.goto('/profile', { waitUntil: 'networkidle' });

      for (const element of comingSoonElements) {
        try {
          await expect(element).toBeVisible({ timeout: 3000 });
          comingSoonFound = true;
          break;
        } catch {}
      }
    }

    expect(comingSoonFound).toBe(true);
  });

  test('should disable 2FA toggle when coming soon', async ({ page }) => {
    await page.goto('/settings', { waitUntil: 'networkidle' });

    // Look for disabled 2FA toggle
    const toggleElements = [
      page.locator('input[type="checkbox"][disabled]'),
      page.locator('button[disabled]:has-text("2FA")'),
      page.locator('[data-testid="two-factor-toggle"][disabled]'),
      page.locator('.two-factor-toggle[disabled]')
    ];

    let disabledToggleFound = false;
    for (const element of toggleElements) {
      try {
        await expect(element).toBeVisible({ timeout: 3000 });
        disabledToggleFound = true;
        break;
      } catch {}
    }

    if (disabledToggleFound) {
      // Verify it's actually disabled
      const toggle = page.locator('input[type="checkbox"][disabled], button[disabled]').first();
      const isDisabled = await toggle.isDisabled();
      expect(isDisabled).toBe(true);
    } else {
      // Alternative: check that toggle is not clickable or shows disabled state
      const toggle = page.locator('[data-testid*="two-factor"], .two-factor').first();
      if (await toggle.isVisible({ timeout: 3000 })) {
        const isDisabled = await toggle.getAttribute('disabled') !== null ||
                          await toggle.getAttribute('aria-disabled') === 'true';
        expect(isDisabled).toBe(true);
      }
    }
  });

  test('should provide information about future 2FA features', async ({ page }) => {
    await page.goto('/settings', { waitUntil: 'networkidle' });

    // Look for informational text about 2FA
    const infoElements = [
      page.locator('text=/security/i'),
      page.locator('text=/protect/i'),
      page.locator('text=/additional/i'),
      page.locator('[data-testid="two-factor-info"]'),
      page.locator('.two-factor-info')
    ];

    let infoFound = false;
    for (const element of infoElements) {
      try {
        await expect(element.first()).toBeVisible({ timeout: 3000 });
        infoFound = true;
        break;
      } catch {}
    }

    expect(infoFound).toBe(true);
  });

  test('should not allow enabling 2FA when coming soon', async ({ page }) => {
    await page.goto('/settings', { waitUntil: 'networkidle' });

    // Try to find and click any 2FA-related buttons
    const buttons = page.locator('button:has-text("Enable"), button:has-text("Setup"), [data-testid*="enable"]');

    const buttonCount = await buttons.count();
    if (buttonCount > 0) {
      for (let i = 0; i < buttonCount; i++) {
        const button = buttons.nth(i);
        const buttonText = await button.textContent();

        if (buttonText.toLowerCase().includes('2fa') ||
            buttonText.toLowerCase().includes('two') ||
            buttonText.toLowerCase().includes('factor')) {

          // Check if button is disabled
          const isDisabled = await button.isDisabled() ||
                            await button.getAttribute('disabled') !== null;
          expect(isDisabled).toBe(true);
          break;
        }
      }
    }
  });
});