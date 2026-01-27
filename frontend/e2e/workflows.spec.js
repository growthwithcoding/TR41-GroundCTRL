import { test, expect } from '@playwright/test';

test.describe('Satellite Management Workflow E2E Tests', () => {
  const testEmail = `satellite-test-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';

  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/register');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
  });

  test('should complete full satellite creation workflow', async ({ page }) => {
    // Navigate to satellites page
    await page.goto('/satellites');
    
    // Click create new satellite button
    const createButton = page.locator('button').filter({ hasText: /create|add|new.*satellite/i });
    await createButton.click();
    
    // Fill satellite form
    const satelliteName = `TestSat-${Date.now()}`;
    await page.fill('input[name="name"]', satelliteName);
    
    // Select orbit type if available
    const orbitSelect = page.locator('select[name="orbit"]');
    if (await orbitSelect.isVisible()) {
      await orbitSelect.selectOption('LEO');
    }
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Verify success message or redirect
    await page.waitForTimeout(2000);
    
    // Should see the new satellite in the list
    const satelliteCard = page.locator(`text=${satelliteName}`);
    await expect(satelliteCard).toBeVisible();
  });

  test('should view satellite details', async ({ page }) => {
    // Navigate to satellites page
    await page.goto('/satellites');
    await page.waitForLoadState('networkidle');
    
    // Click on first satellite
    const firstSatellite = page.locator('[data-testid="satellite-card"]').first().or(
      page.locator('.satellite-item').first()
    );
    
    if (await firstSatellite.isVisible()) {
      await firstSatellite.click();
      
      // Should navigate to details page
      await page.waitForLoadState('networkidle');
      
      // Verify details are displayed
      const detailsContainer = page.locator('[data-testid="satellite-details"]').or(
        page.locator('.satellite-details')
      );
      await expect(detailsContainer).toBeVisible();
    }
  });

  test('should update satellite status', async ({ page }) => {
    await page.goto('/satellites');
    await page.waitForLoadState('networkidle');
    
    // Click on first satellite
    const firstSatellite = page.locator('[data-testid="satellite-card"]').first().or(
      page.locator('.satellite-item').first()
    );
    
    if (await firstSatellite.isVisible()) {
      await firstSatellite.click();
      await page.waitForLoadState('networkidle');
      
      // Look for edit or status change button
      const editButton = page.locator('button').filter({ hasText: /edit|update/i });
      if (await editButton.isVisible()) {
        await editButton.click();
        
        // Change status
        const statusSelect = page.locator('select[name="status"]');
        if (await statusSelect.isVisible()) {
          await statusSelect.selectOption('maintenance');
          
          // Save changes
          await page.click('button[type="submit"]');
          await page.waitForTimeout(1000);
          
          // Verify status changed
          const statusText = page.locator('text=/maintenance/i');
          await expect(statusText).toBeVisible();
        }
      }
    }
  });

  test('should send command to satellite', async ({ page }) => {
    await page.goto('/satellites');
    await page.waitForLoadState('networkidle');
    
    const firstSatellite = page.locator('[data-testid="satellite-card"]').first();
    
    if (await firstSatellite.isVisible()) {
      await firstSatellite.click();
      await page.waitForLoadState('networkidle');
      
      // Look for command button
      const commandButton = page.locator('button').filter({ hasText: /command|send.*command/i });
      if (await commandButton.isVisible()) {
        await commandButton.click();
        
        // Fill command form
        const commandInput = page.locator('select[name="command"]').or(
          page.locator('input[name="command"]')
        );
        
        if (await commandInput.isVisible()) {
          if (commandInput.locator('select').count() > 0) {
            await commandInput.selectOption({ index: 1 });
          } else {
            await commandInput.fill('ADJUST_ORBIT');
          }
          
          // Submit command
          await page.click('button[type="submit"]');
          await page.waitForTimeout(1000);
          
          // Verify command sent (success message or status change)
          const successMessage = page.locator('text=/command.*sent|success/i');
          await expect(successMessage).toBeVisible({ timeout: 5000 });
        }
      }
    }
  });

  test('should filter satellites by status', async ({ page }) => {
    await page.goto('/satellites');
    await page.waitForLoadState('networkidle');
    
    // Look for filter dropdown
    const filterSelect = page.locator('select[name="status"]').or(
      page.locator('select').filter({ hasText: /filter|status/i })
    );
    
    if (await filterSelect.isVisible()) {
      await filterSelect.selectOption('active');
      await page.waitForTimeout(1000);
      
      // Verify only active satellites are shown
      const satelliteCards = page.locator('[data-testid="satellite-card"]').or(
        page.locator('.satellite-item')
      );
      const count = await satelliteCards.count();
      
      if (count > 0) {
        // Check first few satellites have active status
        for (let i = 0; i < Math.min(count, 3); i++) {
          const card = satelliteCards.nth(i);
          const statusText = await card.textContent();
          expect(statusText?.toLowerCase()).toContain('active');
        }
      }
    }
  });

  test('should search for satellites', async ({ page }) => {
    await page.goto('/satellites');
    await page.waitForLoadState('networkidle');
    
    // Look for search input
    const searchInput = page.locator('input[type="search"]').or(
      page.locator('input[placeholder*="search" i]')
    );
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('test');
      await page.waitForTimeout(1000);
      
      // Results should be filtered
      const results = page.locator('[data-testid="satellite-card"]').or(
        page.locator('.satellite-item')
      );
      
      if (await results.first().isVisible()) {
        const firstResult = await results.first().textContent();
        expect(firstResult?.toLowerCase()).toContain('test');
      }
    }
  });

  test('should delete satellite', async ({ page }) => {
    // First create a satellite to delete
    await page.goto('/satellites');
    
    const createButton = page.locator('button').filter({ hasText: /create|add|new.*satellite/i });
    if (await createButton.isVisible()) {
      await createButton.click();
      
      const satelliteName = `DeleteMe-${Date.now()}`;
      await page.fill('input[name="name"]', satelliteName);
      await page.click('button[type="submit"]');
      await page.waitForTimeout(2000);
      
      // Find and click the satellite we just created
      const satelliteToDelete = page.locator(`text=${satelliteName}`);
      await satelliteToDelete.click();
      await page.waitForLoadState('networkidle');
      
      // Look for delete button
      const deleteButton = page.locator('button').filter({ hasText: /delete|remove/i });
      if (await deleteButton.isVisible()) {
        await deleteButton.click();
        
        // Confirm deletion if modal appears
        const confirmButton = page.locator('button').filter({ hasText: /confirm|yes|delete/i });
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
        }
        
        await page.waitForTimeout(1000);
        
        // Verify satellite is gone
        await page.goto('/satellites');
        await page.waitForLoadState('networkidle');
        
        const deletedSatellite = page.locator(`text=${satelliteName}`);
        await expect(deletedSatellite).not.toBeVisible();
      }
    }
  });
});

test.describe('Help Center Workflow E2E Tests', () => {
  const testEmail = `help-test-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';

  test.beforeEach(async ({ page }) => {
    // Setup - create and login user
    await page.goto('/register');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');
    await page.waitForTimeout(2000);
  });

  test('should browse help articles', async ({ page }) => {
    await page.goto('/help');
    await page.waitForLoadState('networkidle');
    
    // Check for help articles
    const articles = page.locator('[data-testid="help-article"]').or(
      page.locator('.help-article')
    );
    
    if (await articles.first().isVisible()) {
      await articles.first().click();
      await page.waitForLoadState('networkidle');
      
      // Verify article content is displayed
      const articleContent = page.locator('[data-testid="article-content"]').or(
        page.locator('.article-content')
      );
      await expect(articleContent).toBeVisible();
    }
  });

  test('should search help articles', async ({ page }) => {
    await page.goto('/help');
    
    const searchInput = page.locator('input[type="search"]').or(
      page.locator('input[placeholder*="search" i]')
    );
    
    if (await searchInput.isVisible()) {
      await searchInput.fill('satellite');
      await searchInput.press('Enter');
      await page.waitForTimeout(1000);
      
      // Results should be related to search term
      const results = await page.textContent('body');
      expect(results?.toLowerCase()).toContain('satellite');
    }
  });

  test('should use AI help assistant', async ({ page }) => {
    await page.goto('/help');
    
    // Look for AI chat or assistant button
    const aiButton = page.locator('button').filter({ hasText: /ai|assistant|chat/i });
    
    if (await aiButton.isVisible()) {
      await aiButton.click();
      
      // Type a question
      const chatInput = page.locator('textarea').or(page.locator('input[type="text"]'));
      if (await chatInput.isVisible()) {
        await chatInput.fill('How do I create a satellite?');
        await page.keyboard.press('Enter');
        
        // Wait for AI response
        await page.waitForTimeout(3000);
        
        // Should see a response
        const response = page.locator('[data-testid="ai-response"]').or(
          page.locator('.ai-message')
        );
        await expect(response).toBeVisible({ timeout: 10000 });
      }
    }
  });
});
