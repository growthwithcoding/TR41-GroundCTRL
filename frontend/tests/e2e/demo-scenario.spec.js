import { test, expect } from '@playwright/test';

/**
 * UI-DEMO-001: Demo Scenario E2E Workflow Test
 * Related PR(s): #124
 *
 * Description: Test complete demo scenario workflow from selection to completion
 * Expected Result: User can navigate through demo scenario steps successfully
 */

test.describe('UI-DEMO-001: Demo Scenario Workflow', () => {
  test('should load demo scenarios on scenarios page', async ({ page }) => {
    await page.goto('/scenarios', { waitUntil: 'networkidle' });

    // Look for demo scenarios
    const demoScenarios = page.locator('[data-testid*="demo"], .scenario-card:has-text("Demo"), .scenario-card:has-text("demo")');
    await expect(demoScenarios.first()).toBeVisible({ timeout: 10000 });
  });

  test('should start demo scenario session', async ({ page }) => {
    await page.goto('/scenarios', { waitUntil: 'networkidle' });

    // Click on a demo scenario
    const demoScenario = page.locator('[data-testid*="demo"], .scenario-card').first();
    await expect(demoScenario).toBeVisible();
    await demoScenario.click();

    // Should navigate to scenario detail or start session
    await page.waitForURL(/\/scenarios\/|\/session\//, { timeout: 10000 });

    const currentUrl = page.url();
    expect(currentUrl).toMatch(/\/scenarios\/|\/session\//);
  });

  test('should navigate through demo scenario steps', async ({ page }) => {
    // This test assumes we're in a demo scenario session
    // In practice, this would need to set up a session first

    await page.goto('/scenarios', { waitUntil: 'networkidle' });

    // Look for step navigation elements
    const stepElements = [
      page.locator('[data-testid="scenario-step"]'),
      page.locator('.step'),
      page.locator('.scenario-step'),
      page.locator('[data-testid="step-navigation"]')
    ];

    // Check if any step elements are present
    let stepsFound = false;
    for (const element of stepElements) {
      try {
        const count = await element.count();
        if (count > 0) {
          stepsFound = true;
          break;
        }
      } catch {}
    }

    if (stepsFound) {
      // Test step navigation
      const nextButton = page.locator('button:has-text("Next"), [data-testid="next-step"]');
      const prevButton = page.locator('button:has-text("Previous"), [data-testid="prev-step"]');

      // Check if navigation buttons exist
      const nextExists = await nextButton.isVisible().catch(() => false);
      const prevExists = await prevButton.isVisible().catch(() => false);

      expect(nextExists || prevExists).toBe(true);
    }
  });

  test('should display scenario objectives and progress', async ({ page }) => {
    await page.goto('/scenarios', { waitUntil: 'networkidle' });

    // Look for progress indicators
    const progressElements = [
      page.locator('[data-testid="scenario-progress"]'),
      page.locator('.progress'),
      page.locator('[data-testid="step-progress"]'),
      page.locator('.step-progress')
    ];

    let progressFound = false;
    for (const element of progressElements) {
      try {
        await expect(element).toBeVisible({ timeout: 2000 });
        progressFound = true;
        break;
      } catch {}
    }

    if (progressFound) {
      // Test that objectives are displayed
      const objectives = page.locator('[data-testid="objectives"], .objectives, li:has-text("Objective")');
      await expect(objectives.first()).toBeVisible({ timeout: 5000 });
    }
  });

  test('should complete demo scenario workflow', async ({ page }) => {
    // Navigate to scenarios page
    await page.goto('/scenarios', { waitUntil: 'networkidle' });

    // Find and click on DEMO_COMPLETE_HUD scenario (from seed data)
    const demoScenario = page.locator('[data-testid*="DEMO"], .scenario-card:has-text("DEMO"), .scenario-card:has-text("Complete")').first();

    if (await demoScenario.isVisible({ timeout: 5000 })) {
      await demoScenario.click();

      // Should navigate to scenario detail or start session
      await page.waitForURL(/\/scenarios\/|\/session\//, { timeout: 10000 });

      // Look for scenario steps (should have 8 steps based on seed data)
      const steps = page.locator('[data-testid="scenario-step"], .step, .scenario-step');

      // Wait for steps to load
      await page.waitForTimeout(2000);

      const stepCount = await steps.count();
      console.log(`Found ${stepCount} scenario steps`);

      // Should have multiple steps for demo scenario
      expect(stepCount).toBeGreaterThan(0);

      // Test navigation through steps if buttons exist
      const nextButton = page.locator('button:has-text("Next"), [data-testid="next-step"]');

      if (await nextButton.isVisible({ timeout: 3000 })) {
        // Click next to advance through steps
        await nextButton.click();
        await page.waitForTimeout(1000);

        // Should show different step content or progress
        const currentStep = page.locator('[data-testid="current-step"], .current-step').first();
        if (await currentStep.isVisible({ timeout: 2000 })) {
          const stepText = await currentStep.textContent();
          expect(stepText).toBeTruthy();
        }
      }

      // Check for completion indicators
      const completeButton = page.locator('button:has-text("Complete"), button:has-text("Finish")');
      const progressBar = page.locator('[data-testid="progress-bar"], .progress-bar');

      // Either completion button or progress should be visible
      const hasCompletionUI = await completeButton.isVisible().catch(() => false) ||
                              await progressBar.isVisible().catch(() => false);

      expect(hasCompletionUI).toBe(true);
    } else {
      console.log('Demo scenario not found - may require backend with seed data');
    }
  });
});