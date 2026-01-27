# E2E Testing Setup - Playwright Guide (FUTURE IMPLEMENTATION)

## Overview

**⚠️ NOTICE: E2E tests have been temporarily removed from this project as of January 2026 to prevent interference with frontend development. This document is preserved for future implementation.**

This guide covers setting up and running End-to-End (E2E) tests for GroundCTRL using Playwright. E2E tests verify complete user workflows from the browser perspective.

## Status

- **Current State**: E2E tests removed
- **Reason**: Potential interference with frontend development
- **Future Plan**: Re-implement when frontend is more stable
- **Files Removed**: 
  - `frontend/e2e/` directory (authentication.spec.js, navigation.spec.js, workflows.spec.js)
  - `frontend/playwright.config.js`
  - Playwright dependencies from package.json

## Prerequisites

### System Requirements
- Node.js 18+
- 2GB+ available RAM
- Internet connection (for browser downloads)

### Installation

```bash
# Navigate to frontend directory
cd frontend

# Install Playwright
npm install

# Install Playwright browsers and system dependencies
npx playwright install --with-deps
```

This installs:
- **Chromium** (~170MB) - Chrome/Edge engine
- **Firefox** (~80MB) - Firefox engine  
- **WebKit** (~80MB) - Safari engine
- **System dependencies** - OS-specific libraries

---

## Configuration

### Playwright Config

File: [frontend/playwright.config.js](../../frontend/playwright.config.js)

Key settings:
```javascript
module.exports = {
  testDir: './e2e',
  baseURL: 'http://localhost:5173',
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
    { name: 'mobile-safari', use: { ...devices['iPhone 12'] } }
  ]
};
```

### Environment Setup

Playwright automatically starts the development server:
```javascript
webServer: {
  command: 'npm run dev',
  port: 5173,
  reuseExistingServer: !process.env.CI
}
```

---

## Running E2E Tests

### Basic Commands

```bash
cd frontend

# Run all E2E tests (headless)
npm run test:e2e

# Run with interactive UI
npm run test:e2e:ui

# Run with browser visible (headed mode)
npm run test:e2e:headed

# Debug mode (pauses at each step)
npm run test:e2e:debug
```

### Browser-Specific Tests

```bash
# Test specific browsers
npm run test:e2e:chromium
npm run test:e2e:firefox
npm run test:e2e:webkit

# Mobile testing
npm run test:e2e:mobile
```

### Advanced Options

```bash
# Run specific test file
npx playwright test navigation.spec.js

# Run tests matching pattern
npx playwright test --grep "login"

# Run with trace (for debugging)
npx playwright test --trace on

# Run with video recording
npx playwright test --video on

# Run in parallel (faster)
npx playwright test --workers 4
```

---

## Test Structure

### Directory Layout

```
frontend/e2e/
├── navigation.spec.js      # Navigation and UI tests
├── authentication.spec.js  # Login/register workflows
├── workflows.spec.js       # Complete user journeys
└── support/               # Helper functions and utilities
```

### Test File Example

```javascript
import { test, expect } from '@playwright/test';

test.describe('User Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Setup before each test
    await page.goto('/');
  });

  test('user can register successfully', async ({ page }) => {
    // Navigate to register page
    await page.click('[data-testid="register-link"]');
    
    // Fill registration form
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="callSign"]', 'TestPilot');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Verify success
    await expect(page).toHaveURL(/dashboard/);
    await expect(page.locator('[data-testid="welcome-message"]')).toBeVisible();
  });
});
```

---

## Writing E2E Tests

### Best Practices

#### 1. Use Data-TestId Selectors
```javascript
// ✅ Good - Stable selector
await page.click('[data-testid="login-button"]');

// ❌ Bad - Brittle selector
await page.click('.btn.btn-primary.login');
```

#### 2. Wait for Elements Properly
```javascript
// ✅ Good - Wait for element to be visible
await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();

// ❌ Bad - Arbitrary wait
await page.waitForTimeout(3000);
```

#### 3. Test User Flows, Not Implementation
```javascript
// ✅ Good - Tests user behavior
test('user can complete satellite creation workflow', async ({ page }) => {
  await page.goto('/satellites');
  await page.click('[data-testid="create-satellite"]');
  await page.fill('[data-testid="satellite-name"]', 'TestSat');
  await page.click('[data-testid="save-satellite"]');
  await expect(page.locator('[data-testid="satellite-list"]')).toContainText('TestSat');
});

// ❌ Bad - Tests implementation details
test('form validation runs on input change', async ({ page }) => {
  // Implementation-specific test
});
```

#### 4. Handle Async Operations
```javascript
// ✅ Good - Wait for network to be idle
await page.goto('/dashboard', { waitUntil: 'networkidle' });

// ✅ Good - Wait for specific API response
await page.waitForResponse(resp => resp.url().includes('/api/satellites'));

// ✅ Good - Wait for loading states
await expect(page.locator('.loading-spinner')).toBeHidden();
```

### Common Patterns

#### Form Interactions
```javascript
test('form validation works correctly', async ({ page }) => {
  await page.goto('/register');
  
  // Test empty form submission
  await page.click('button[type="submit"]');
  await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
  
  // Test invalid email format
  await page.fill('input[name="email"]', 'invalid-email');
  await page.click('button[type="submit"]');
  await expect(page.locator('[data-testid="email-error"]')).toContainText('Invalid email');
  
  // Test successful submission
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/dashboard/);
});
```

#### Navigation Testing
```javascript
test('navigation works across all pages', async ({ page }) => {
  await page.goto('/');
  
  // Test main navigation
  await page.click('[data-testid="nav-satellites"]');
  await expect(page).toHaveURL(/satellites/);
  
  await page.click('[data-testid="nav-help"]');
  await expect(page).toHaveURL(/help/);
  
  // Test breadcrumb navigation
  await page.click('[data-testid="breadcrumb-home"]');
  await expect(page).toHaveURL('/');
});
```

#### Mobile Testing
```javascript
test('mobile navigation works correctly', async ({ page }) => {
  // Set mobile viewport
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');
  
  // Mobile menu should be hidden initially
  await expect(page.locator('[data-testid="mobile-menu"]')).toBeHidden();
  
  // Click hamburger to open menu
  await page.click('[data-testid="hamburger-menu"]');
  await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
  
  // Navigate using mobile menu
  await page.click('[data-testid="mobile-nav-satellites"]');
  await expect(page).toHaveURL(/satellites/);
});
```

### Authentication in Tests

#### Test User Management
```javascript
// Create unique test users to avoid conflicts
test('user registration flow', async ({ page }) => {
  const timestamp = Date.now();
  const testEmail = `test+${timestamp}@example.com`;
  const testCallSign = `TestPilot${timestamp}`;
  
  await page.goto('/register');
  await page.fill('input[name="email"]', testEmail);
  await page.fill('input[name="callSign"]', testCallSign);
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  
  await expect(page).toHaveURL(/dashboard/);
});
```

#### Login Helper
```javascript
// tests/support/auth-helpers.js
export async function login(page, email = 'test@example.com', password = 'password123') {
  await page.goto('/login');
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/dashboard/);
}

// Usage in tests
import { login } from './support/auth-helpers.js';

test('authenticated user can access satellites', async ({ page }) => {
  await login(page);
  await page.goto('/satellites');
  await expect(page.locator('[data-testid="satellites-list"]')).toBeVisible();
});
```

---

## Debugging E2E Tests

### Debug Mode
```bash
# Run in debug mode (interactive)
npm run test:e2e:debug

# Or with npx
npx playwright test --debug
```

This opens the Playwright Inspector where you can:
- Step through tests line by line
- Inspect page state at each step
- Record new test actions
- Modify selectors on the fly

### Screenshots and Videos

Playwright automatically captures:
- **Screenshots** on test failure
- **Videos** of test execution (if configured)
- **Traces** for detailed debugging

Configure in `playwright.config.js`:
```javascript
use: {
  screenshot: 'only-on-failure',
  video: 'retain-on-failure',
  trace: 'retain-on-failure'
}
```

### Viewing Test Results

```bash
# Generate and open HTML report
npx playwright show-report

# Or use npm script
npm run test:e2e:report
```

The HTML report includes:
- Test results summary
- Screenshots and videos
- Trace files for failed tests
- Performance metrics

---

## CI/CD Integration

### GitHub Actions

Tests run automatically in CI with this configuration:

```yaml
# .github/workflows/test-suite.yml
- name: Install Playwright
  run: |
    cd frontend
    npm ci
    npx playwright install --with-deps

- name: Run E2E tests
  run: |
    cd frontend
    npm run test:e2e
  env:
    CI: true

- name: Upload Playwright report
  uses: actions/upload-artifact@v3
  if: always()
  with:
    name: playwright-report
    path: frontend/playwright-report/
```

### Performance in CI

CI configuration optimizes for speed:
```javascript
// playwright.config.js
module.exports = {
  workers: process.env.CI ? 1 : undefined, // Single worker in CI
  retries: process.env.CI ? 2 : 0,         // Retry flaky tests in CI
  reporter: process.env.CI ? 'github' : 'html' // GitHub reporter for CI
};
```

---

## Troubleshooting

### Common Issues

#### Browser Installation Failed
```bash
# Clear browser cache and reinstall
rm -rf ~/.cache/ms-playwright
npx playwright install --with-deps
```

#### Test Timeouts
```javascript
// Increase timeout for slow tests
test('slow operation', async ({ page }) => {
  test.setTimeout(60000); // 60 seconds
  // Test implementation
});
```

#### Element Not Found
```javascript
// Wait for element before interacting
await page.waitForSelector('[data-testid="target-element"]');
await page.click('[data-testid="target-element"]');

// Or use expect with timeout
await expect(page.locator('[data-testid="target-element"]')).toBeVisible({ timeout: 10000 });
```

#### Flaky Tests
```javascript
// Use waitForFunction for complex conditions
await page.waitForFunction(() => {
  const element = document.querySelector('[data-testid="dynamic-content"]');
  return element && element.textContent.includes('Expected Text');
});
```

### Debug Tips

1. **Use page.pause()** to pause execution and inspect manually
2. **Add console.log()** statements to understand test flow
3. **Use headed mode** to see what the browser is doing
4. **Check network tab** in debug mode for failed API calls
5. **Verify selectors** in browser dev tools before using in tests

---

## Performance Optimization

### Test Speed
- Run tests in parallel (`--workers`)
- Use beforeAll for expensive setup
- Skip animations and transitions
- Use appropriate wait strategies

### CI Optimization
- Cache Playwright browsers
- Run critical tests first
- Use smaller Docker images
- Optimize test data setup

---

## Advanced Features

### Custom Fixtures
```javascript
// tests/support/fixtures.js
import { test as base } from '@playwright/test';

export const test = base.extend({
  authenticatedPage: async ({ page }, use) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
    await use(page);
  }
});

// Usage
test('authenticated user can access settings', async ({ authenticatedPage }) => {
  await authenticatedPage.goto('/settings');
  await expect(authenticatedPage.locator('h1')).toContainText('Settings');
});
```

### API Mocking
```javascript
test('handles API errors gracefully', async ({ page }) => {
  // Mock API to return error
  await page.route('/api/satellites', route => {
    route.fulfill({ status: 500, body: 'Server Error' });
  });
  
  await page.goto('/satellites');
  await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
});
```

---

## Resources

- **Playwright Documentation**: https://playwright.dev/
- **Best Practices Guide**: https://playwright.dev/docs/best-practices
- **Debugging Guide**: https://playwright.dev/docs/debug
- **CI/CD Guide**: https://playwright.dev/docs/ci

---

**Last Updated**: January 27, 2026