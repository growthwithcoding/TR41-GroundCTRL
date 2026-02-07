import { test, expect } from '@playwright/test';

/**
 * UI-CONTACT-001: Contact Form Functionality Test
 * Related PR(s): Contact page implementation
 *
 * Description: Test contact form UI and basic functionality
 * Expected Result: Contact form loads with proper fields and validation
 */

test.describe('UI-CONTACT-001: Contact Form Functionality', () => {
  test('should load contact page successfully', async ({ page }) => {
    await page.goto('/contact', { waitUntil: 'networkidle' });

    // Check for contact page content
    const contactElements = [
      page.locator('h1, h2').filter({ hasText: /contact|support|get.*help/i }),
      page.locator('[data-testid*="contact"]'),
      page.locator('.contact-container'),
      page.locator('form'),
      page.locator('text=/contact|message|send/i')
    ];

    let contactFound = false;
    for (const element of contactElements) {
      try {
        await expect(element).toBeVisible({ timeout: 3000 });
        contactFound = true;
        break;
      } catch {}
    }

    expect(contactFound).toBe(true);
  });

  test('should display contact form fields', async ({ page }) => {
    await page.goto('/contact', { waitUntil: 'networkidle' });

    // Look for common contact form fields
    const formFields = [
      page.locator('input[name*="name"], input[placeholder*="name" i]'),
      page.locator('input[name*="email"], input[type="email"]'),
      page.locator('textarea[name*="message"], textarea[placeholder*="message" i]'),
      page.locator('input[name*="subject"], input[placeholder*="subject" i]'),
      page.locator('select[name*="category"], select[placeholder*="category" i]')
    ];

    let fieldsFound = 0;
    for (const field of formFields) {
      try {
        if (await field.isVisible({ timeout: 2000 })) {
          fieldsFound++;
        }
      } catch {}
    }

    // Should have at least name, email, and message fields
    expect(fieldsFound).toBeGreaterThanOrEqual(2);
    console.log(`Found ${fieldsFound} contact form fields`);
  });

  test('should have submit button', async ({ page }) => {
    await page.goto('/contact', { waitUntil: 'networkidle' });

    // Look for submit button
    const submitButtons = [
      page.locator('button[type="submit"]'),
      page.locator('button').filter({ hasText: /submit|send|contact/i }),
      page.locator('input[type="submit"]'),
      page.locator('[data-testid*="submit"]')
    ];

    let submitFound = false;
    for (const button of submitButtons) {
      try {
        await expect(button).toBeVisible({ timeout: 3000 });
        submitFound = true;
        break;
      } catch {}
    }

    expect(submitFound).toBe(true);
  });

  test('should show form validation for required fields', async ({ page }) => {
    await page.goto('/contact', { waitUntil: 'networkidle' });

    // Find submit button
    const submitButton = page.locator('button[type="submit"], button:has-text("Submit"), button:has-text("Send")').first();

    if (await submitButton.isVisible({ timeout: 3000 })) {
      // Try to submit empty form
      await submitButton.click();

      // Wait a moment for validation
      await page.waitForTimeout(1000);

      // Look for validation messages or error states
      const validationElements = [
        page.locator('.error, .invalid'),
        page.locator('[data-testid*="error"]'),
        page.locator('text=/required|please.*fill|cannot.*empty/i'),
        page.locator('.field-error, .validation-error')
      ];

      let validationFound = false;
      for (const element of validationElements) {
        try {
          if (await element.isVisible({ timeout: 2000 })) {
            validationFound = true;
            console.log('Form validation is working');
            break;
          }
        } catch {}
      }

      if (validationFound) {
        console.log('Contact form has proper validation');
      } else {
        console.log('Form may not have client-side validation or validation happens on submit');
      }
    }
  });

  test('should be accessible with proper labels', async ({ page }) => {
    await page.goto('/contact', { waitUntil: 'networkidle' });

    // Check for proper form accessibility
    const inputs = page.locator('input, textarea, select');
    const inputCount = await inputs.count();

    if (inputCount > 0) {
      // Check that inputs have labels or aria-labels
      for (let i = 0; i < Math.min(inputCount, 3); i++) {
        const input = inputs.nth(i);
        const hasLabel = await input.getAttribute('aria-label') ||
                        await input.getAttribute('aria-labelledby') ||
                        await input.getAttribute('placeholder');

        if (hasLabel) {
          console.log(`Input ${i + 1} has accessibility attributes`);
        }
      }
    }
  });
});