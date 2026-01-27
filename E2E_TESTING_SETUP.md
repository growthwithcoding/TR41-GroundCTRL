# E2E Testing Setup Guide

## Installation

### 1. Install Playwright

```bash
cd frontend
npm install -D @playwright/test
npx playwright install
```

### 2. Install Playwright Browsers (with dependencies)

```bash
npx playwright install --with-deps
```

This installs:
- Chromium
- Firefox
- WebKit (Safari)
- System dependencies

## Configuration

Configuration is in `frontend/playwright.config.js`:

```javascript
export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

## Running Tests

### Local Development

```bash
# Run all tests (headless)
npm run test:e2e

# Run with UI mode (recommended for development)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Run in debug mode (pauses at each step)
npm run test:e2e:debug

# Run specific test file
npx playwright test e2e/navigation.spec.js

# Run specific browser
npm run test:e2e:chromium
npm run test:e2e:firefox
npm run test:e2e:webkit
```

### CI/CD

Tests run automatically on every PR via GitHub Actions.

## Test Structure

```
frontend/
├── playwright.config.js     # Playwright configuration
├── e2e/
│   ├── navigation.spec.js   # Navigation and UI tests
│   ├── authentication.spec.js # Login/register tests
│   └── workflows.spec.js    # Complete workflows
└── test-results/            # Test artifacts (auto-generated)
```

## Writing E2E Tests

### Basic Test

```javascript
import { test, expect } from '@playwright/test';

test('homepage loads correctly', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/GroundCTRL/);
});
```

### Test with Authentication

```javascript
test.describe('Protected Routes', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL(/dashboard/);
  });

  test('can access dashboard', async ({ page }) => {
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
  });
});
```

### Test Mobile Viewport

```javascript
test('mobile menu works', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/');
  
  const menuButton = page.locator('[aria-label*="menu"]');
  await menuButton.click();
  
  await expect(page.locator('[role="dialog"]')).toBeVisible();
});
```

### Test with Network Requests

```javascript
test('form submission works', async ({ page }) => {
  await page.goto('/create-satellite');
  
  // Wait for API response
  const responsePromise = page.waitForResponse(
    response => response.url().includes('/api/v1/satellites') && response.status() === 201
  );
  
  await page.fill('input[name="name"]', 'TestSat');
  await page.click('button[type="submit"]');
  
  await responsePromise;
  await expect(page.locator('.success-message')).toBeVisible();
});
```

## Best Practices

### 1. Use Data-TestId Attributes

```jsx
// Component
<button data-testid="submit-button">Submit</button>

// Test
await page.locator('[data-testid="submit-button"]').click();
```

### 2. Wait for Conditions

```javascript
// Wait for element to be visible
await page.locator('.loading').waitFor({ state: 'hidden' });

// Wait for network to be idle
await page.waitForLoadState('networkidle');

// Wait for URL
await page.waitForURL(/dashboard/);
```

### 3. Use Auto-Waiting

Playwright automatically waits for elements before acting:

```javascript
// No need for manual waits - Playwright waits automatically
await page.click('button'); // Waits for button to be clickable
await page.fill('input', 'text'); // Waits for input to be editable
```

### 4. Generate Unique Test Data

```javascript
const testEmail = `test-${Date.now()}@example.com`;
const testName = `TestSat-${Date.now()}`;
```

### 5. Handle Authentication

Create a setup script for authenticated tests:

```javascript
// tests/auth.setup.js
import { test as setup } from '@playwright/test';

setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'password');
  await page.click('button[type="submit"]');
  
  // Save authentication state
  await page.context().storageState({ path: 'auth.json' });
});
```

Then use it in tests:

```javascript
// playwright.config.js
export default defineConfig({
  use: {
    storageState: 'auth.json',
  },
});
```

## Debugging

### Visual Debugging

```bash
# Debug mode - pauses at each step
npm run test:e2e:debug

# Headed mode - see browser
npm run test:e2e:headed

# Slow motion
npx playwright test --headed --slow-mo=1000
```

### Playwright Inspector

```bash
# Opens Playwright Inspector
npx playwright test --debug
```

### Screenshots and Videos

Configure in `playwright.config.js`:

```javascript
use: {
  screenshot: 'only-on-failure',
  video: 'retain-on-failure',
  trace: 'on-first-retry',
}
```

### View Test Report

```bash
# Generate and open HTML report
npm run test:e2e:report
```

## Continuous Integration

### GitHub Actions

Tests run automatically on every PR:

```yaml
- name: Install Playwright Browsers
  run: npx playwright install --with-deps

- name: Run E2E tests
  run: npm run test:e2e
  env:
    CI: true

- name: Upload Playwright Report
  if: always()
  uses: actions/upload-artifact@v4
  with:
    name: playwright-report
    path: playwright-report/
```

## Troubleshooting

### Browser Not Found

```bash
# Reinstall browsers
npx playwright install --with-deps
```

### Tests Timing Out

Increase timeout in test:

```javascript
test('slow test', async ({ page }) => {
  test.setTimeout(60000); // 60 seconds
  // test code
});
```

Or in config:

```javascript
// playwright.config.js
export default defineConfig({
  timeout: 60000,
});
```

### Element Not Found

Use better selectors:

```javascript
// ❌ Fragile
await page.click('.btn-primary');

// ✅ Better
await page.click('[data-testid="submit-button"]');

// ✅ Even better - multiple fallbacks
await page.locator('[data-testid="submit-button"]')
  .or(page.locator('button:has-text("Submit")'))
  .click();
```

### Port Already in Use

```bash
# Kill process on port 5173
# Windows
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :5173
kill -9 <PID>
```

## Resources

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Playwright API Reference](https://playwright.dev/docs/api/class-playwright)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Testing Library](https://playwright.dev/docs/test-assertions)

## Next Steps

1. ✅ Install Playwright
2. ✅ Run existing tests
3. ✅ View test report
4. ✅ Write your first test
5. ✅ Add to CI/CD

See [TESTING_GUIDE.md](./TESTING_GUIDE.md) for complete testing documentation.
