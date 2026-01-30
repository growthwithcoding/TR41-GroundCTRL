import { test, expect } from '@playwright/test';
import { register, generateTestEmail, generateTestPassword } from './helpers.js';

/**
 * UI-004: Duplicate CallSign Registration Test
 * Related PR(s): #39
 * 
 * Description: Register a new user with a duplicate callSign. Verify registration succeeds.
 * Expected Result: 201 Created; both users share same callSign.
 */

test.describe('UI-004: Duplicate CallSign Registration', () => {
  const sharedCallSign = 'SHARED-TEST-CS';
  
  test('should allow registration with duplicate callSign', async ({ page }) => {
    // Register first user with the callSign
    const user1 = {
      email: generateTestEmail(),
      password: generateTestPassword(),
      callSign: sharedCallSign,
    };
    
    await register(page, user1);
    
    // Wait for success indication (redirect or success message)
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Registration should succeed - check we're redirected away from register page
    const url1 = page.url();
    const isRegistered1 = !url1.includes('/register') || url1.includes('/login') || url1.includes('/home') || url1.includes('/dashboard');
    expect(isRegistered1).toBe(true);
    
    // Logout if needed (navigate to register or login)
    await page.goto('/register');
    
    // Register second user with the SAME callSign
    const user2 = {
      email: generateTestEmail(),
      password: generateTestPassword(),
      callSign: sharedCallSign, // Same callSign as user1
    };
    
    await register(page, user2);
    
    // Wait for processing
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Second registration should also succeed
    const url2 = page.url();
    const isRegistered2 = !url2.includes('/register') || url2.includes('/login') || url2.includes('/home') || url2.includes('/dashboard');
    expect(isRegistered2).toBe(true);
    
    // Should NOT show an error about duplicate callSign
    const errorMessage = page.locator('[role="alert"], .error, [class*="error"]');
    const hasError = await errorMessage.count();
    
    if (hasError > 0) {
      const errorText = await errorMessage.first().textContent();
      expect(errorText.toLowerCase()).not.toContain('callsign');
      expect(errorText.toLowerCase()).not.toContain('call sign');
      expect(errorText.toLowerCase()).not.toContain('already exists');
    }
  });

  test('should enforce unique email even with duplicate callSign', async ({ page }) => {
    const duplicateEmail = `duplicate-test-${Date.now()}@groundctrl.test`;
    const user1 = {
      email: duplicateEmail,
      password: generateTestPassword(),
      callSign: 'TEST-CS-1',
    };
    
    // Register first user
    await register(page, user1);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Try to register with same email but different callSign
    await page.goto('/register');
    
    const user2 = {
      email: duplicateEmail, // Same email
      password: generateTestPassword(),
      callSign: 'TEST-CS-2', // Different callSign
    };
    
    await register(page, user2);
    await page.waitForTimeout(2000);
    
    // Should show error about duplicate email
    const errorMessage = page.locator('[role="alert"], .error, [class*="error"]');
    
    if (await errorMessage.count() > 0) {
      const errorText = await errorMessage.first().textContent();
      expect(errorText.toLowerCase()).toMatch(/email|already|exists|taken/i);
    }
    
    // Should still be on register page
    expect(page.url()).toContain('/register');
  });
});
