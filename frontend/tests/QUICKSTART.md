# Frontend E2E Tests - Quick Start Guide

## 🚀 Quick Setup

```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install dependencies (if not already done)
npm install

# 3. Install Playwright browsers
npx playwright install

# 4. Copy environment configuration
cp tests/.env.test tests/.env
```

## ▶️ Running Tests

```bash
# Run all tests
npm run test:e2e

# Run with browser UI visible (headed mode)
npm run test:e2e:headed

# Run in debug mode (step through tests)
npm run test:e2e:debug

# Run with Playwright UI (interactive)
npm run test:e2e:ui

# View test report
npm run test:e2e:report
```

## 🎯 Run Specific Tests

```bash
# Run a single test file
npx playwright test basic-rendering.spec.js

# Run tests containing "login"
npx playwright test --grep login

# Run in specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## 📋 Test Files

- `ui-001-basic-rendering.spec.js` - Basic page rendering
- `ui-002-valid-login.spec.js` - Valid login flow
- `ui-003-invalid-login.spec.js` - Invalid login handling
- `ui-004-duplicate-callsign.spec.js` - Duplicate callSign registration
- `ui-005-code-splitting.spec.js` - Code splitting and lazy loading
- `ui-006-tailwind-styling.spec.js` - Tailwind CSS styling
- `ui-007-mobile-responsive.spec.js` - Mobile responsiveness
- `ui-008-es-module-imports.spec.js` - ES module verification

## ⚙️ Prerequisites

Before running tests:

1. **Dev Server**: Tests automatically start the dev server, or you can start it manually:
   ```bash
   npm run dev
   ```

2. **Backend API** (for auth tests): Ensure backend is running on `http://localhost:3000`

3. **Test User**: Some tests require a test user. Update `tests/.env` with valid credentials:
   ```
   TEST_USER_EMAIL=test-user@groundctrl.test
   TEST_USER_PASSWORD=TestPassword123!
   ```

## 🔍 Debugging

```bash
# Debug mode - opens inspector
npm run test:e2e:debug

# Run with traces
npx playwright test --trace on

# View trace file
npx playwright show-trace test-results/trace.zip
```

## 📊 CI/CD Integration

Tests are designed to run in CI/CD pipelines:

```yaml
- name: Install Playwright
  run: npx playwright install --with-deps

- name: Run tests
  run: npm run test:e2e

- name: Upload report
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: playwright-report/
```

## 🆘 Troubleshooting

**Tests fail to start:**
- Run `npx playwright install` to ensure browsers are installed
- Check that port 5173 is available

**Element not found:**
- Run in headed mode to see what's happening: `npm run test:e2e:headed`
- Check selector syntax in test files

**Authentication tests fail:**
- Verify test user exists in database
- Check backend API is running
- Update credentials in `tests/.env`

## 📚 More Information

See [tests/README.md](README.md) for complete documentation.
