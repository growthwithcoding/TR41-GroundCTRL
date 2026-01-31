# Frontend E2E Tests

This directory contains end-to-end (E2E) tests for the GroundCTRL frontend application using Playwright.

## Test Coverage

The tests implement UI-specific requirements based on the actual app structure:

### Active Tests (Run in CI)
- **UI-001**: Basic App Rendering - Verifies Header, Footer, and page load without errors
- **UI-005**: Code Splitting - Tests lazy loading and chunk fetching with React.lazy()
- **UI-006**: Tailwind Styling - Validates Tailwind CSS classes are applied correctly
- **UI-007**: Mobile Responsive - Tests responsive layout at different viewport sizes
- **UI-008**: ES Module Imports - Verifies no CommonJS require statements
- **UI-009**: Theme Toggle - Tests dark/light mode switching
- **UI-010**: Lazy Loading - Tests React Suspense and loading states
- **UI-011**: Navigation - Tests nav links and routing
- **UI-012**: 404 Not Found - Tests error page handling

### Backend-Dependent Tests (Skipped in CI)
- **UI-002**: Valid Login - Tests successful login flow (requires backend)
- **UI-003**: Invalid Login - Tests error handling for invalid credentials (requires backend)
- **UI-004**: Duplicate CallSign - Verifies registration with duplicate callSigns (requires backend)

> **Note:** Auth tests are skipped in CI but can be run locally with backend running.

## Setup

### Prerequisites

- Node.js 18+ installed
- Frontend dev server running (or will be started automatically)
- Backend API running (for tests that require authentication)

### Installation

```bash
# Install dependencies (from frontend directory)
npm install

# Install Playwright browsers
npx playwright install
```

### Environment Configuration

Copy the test environment template:

```bash
cp tests/.env.test tests/.env
```

Edit `tests/.env` with your test credentials if needed.

## Running Tests

### Run All Tests

```bash
# Run all tests in headless mode
npm run test:e2e

# Run tests with UI (headed mode)
npm run test:e2e:headed

# Run tests in debug mode
npm run test:e2e:debug
```

### Run Specific Tests

```bash
# Run a specific test file
npx playwright test basic-rendering.spec.js

# Run tests matching a pattern
npx playwright test --grep "login"

# Run tests in a specific browser
npx playwright test --project=chromium
```

### View Test Reports

```bash
# Open the HTML report
npx playwright show-report
```

## Test Structure

```
tests/
├── helpers.js                           # Shared test utilities
├── .env.test                            # Test environment configuration
├── basic-rendering.spec.js              # Basic rendering tests
├── valid-login.spec.js                  # Valid login tests
├── invalid-login.spec.js                # Invalid login tests
├── duplicate-callsign.spec.js           # Duplicate callSign tests
├── code-splitting.spec.js               # Code splitting tests
├── tailwind-styling.spec.js             # Tailwind CSS tests
├── mobile-responsive.spec.js            # Mobile responsiveness tests
└── es-module-imports.spec.js            # ES module import tests
2. Import Playwright test utilities:
   ```javascript
   import { test, expect } from '@playwright/test';
   ```
3. Use helper functions from `helpers.js` for common operations
4. Follow the existing test structure and documentation patterns

### Example Test

```javascript
import { test, expect } from '@playwright/test';

test.describe('UI-XXX: Feature Name', () => {
  test('should perform expected behavior', async ({ page }) => {
    await page.goto('/');
    // Your test logic here
    await expect(page.locator('h1')).toBeVisible();
  });
});
```

## Helper Functions

The `helpers.js` file provides utility functions:

- `generateTestEmail()` - Generate unique test email addresses
- `generateTestCallSign()` - Generate test callSigns
- `generateTestPassword()` - Generate test passwords
- `login(page, email, password)` - Helper for login flow
- `register(page, userData)` - Helper for registration flow
- `getComputedStyle(page, selector, property)` - Get computed CSS styles
- `isVisibleInViewport(page, selector)` - Check element visibility

## CI/CD Integration

These tests can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Actions workflow
- name: Install Playwright
  run: npx playwright install --with-deps

- name: Run E2E tests
  run: npm run test:e2e
  
- name: Upload test results
  uses: actions/upload-artifact@v3
  if: always()
  with:
    name: playwright-report
    path: playwright-report/
```

## Debugging Tests

### Debug Mode

Run tests in debug mode to step through them:

```bash
npx playwright test --debug
```

### Screenshots and Videos

Tests automatically capture:
- Screenshots on failure
- Videos on failure (if configured)
- Traces on first retry

Find these in the `test-results/` directory.

### View Traces

```bash
npx playwright show-trace test-results/trace.zip
```

## Best Practices

1. **Use data-testid attributes** in components for reliable selectors
2. **Wait for network idle** before making assertions
3. **Test in multiple browsers** to ensure cross-browser compatibility
4. **Mock external APIs** when possible to avoid flaky tests
5. **Use descriptive test names** that explain the expected behavior
6. **Clean up test data** after tests complete
7. **Run tests in isolation** - each test should be independent

## Troubleshooting

### Tests Timing Out

- Increase timeout in `playwright.config.js`
- Check if dev server is running
- Verify network connectivity

### Element Not Found

- Use `page.waitForSelector()` before interacting
- Check if element is in viewport
- Verify selector syntax

### Flaky Tests

- Add appropriate wait conditions
- Use `waitForLoadState('networkidle')`
- Avoid hard-coded timeouts when possible

## Related Documentation

- [Playwright Documentation](https://playwright.dev/)
- [Comprehensive Test Plan](../../backend/tests/COMPREHENSIVE_TEST_PLAN.md)
- [Testing Strategy](../../backend/tests/TESTING_STRATEGY.md)

## Contributing

When adding new tests:

1. Follow the existing naming conventions
2. Add JSDoc comments explaining the test purpose
3. Reference related PRs and test IDs from the test plan
4. Update this README if adding new test categories
5. Ensure tests pass in CI before merging
