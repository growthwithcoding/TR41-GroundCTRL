# Testing Documentation - GroundCTRL

This guide covers how to run, write, and maintain automated tests for the GroundCTRL platform.

## Table of Contents

1. [Overview](#overview)
2. [Backend Testing](#backend-testing)
3. [Frontend E2E Testing](#frontend-e2e-testing)
4. [CI/CD Testing](#cicd-testing)
5. [Writing Tests](#writing-tests)
6. [Troubleshooting](#troubleshooting)

---

## Overview

GroundCTRL uses a comprehensive testing strategy with multiple testing layers:

- **Unit Tests**: Test individual functions and components in isolation
- **Integration Tests**: Test API endpoints with SuperTest
- **Security Tests**: Test security measures and attack prevention
- **E2E Tests**: Test complete user workflows with Playwright
- **CI/CD Tests**: Automated testing on every PR

### Testing Stack

- **Backend**: Jest + SuperTest
- **Frontend E2E**: Playwright
- **CI/CD**: GitHub Actions
- **Emulators**: Firebase Auth & Firestore

---

## Backend Testing

### Prerequisites

```bash
cd backend
npm install
```

### Running Backend Tests

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit           # Unit tests only
npm run test:integration    # Integration tests only
npm run test:security       # Security tests only
npm run test:performance    # Performance tests only

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests with Firebase emulators
npm run test:emulator
```

### Backend Test Structure

```
backend/tests/
├── unit/                    # Unit tests
│   ├── config/             # Configuration tests
│   ├── crud/               # CRUD factory tests
│   └── validation/         # Schema validation tests
├── integration/            # Integration tests
│   ├── api/               # API endpoint tests (NEW)
│   │   ├── users.test.js
│   │   └── satellites.test.js
│   ├── auth/              # Authentication tests
│   └── domain/            # Domain-specific tests
├── security/              # Security tests
├── performance/           # Performance tests
└── helpers/               # Test utilities
```

### SuperTest Integration Tests

Integration tests use SuperTest to make HTTP requests to the API:

```javascript
const request = require('supertest');

describe('User API Tests', () => {
  let app;
  let authToken;

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    app = require('../../../src/app');
  });

  it('should create a new user', async () => {
    const response = await request(app)
      .post('/api/v1/users')
      .send({ email: 'test@example.com', password: 'Test123!' })
      .expect(201);

    expect(response.body).toHaveProperty('payload.data.uid');
    authToken = response.body.payload.data.token;
  });
});
```

### Firebase Emulators

Tests run against Firebase emulators for isolation:

```bash
# Start emulators
firebase emulators:start --only auth,firestore

# In another terminal, run tests
npm test
```

Environment variables for emulators:
```env
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
FIRESTORE_EMULATOR_HOST=localhost:8080
FIREBASE_PROJECT_ID=groundctrl-test
```

---

## Frontend E2E Testing

### Prerequisites

```bash
cd frontend
npm install

# Install Playwright browsers
npx playwright install
```

### Running E2E Tests

```bash
# Run all E2E tests (headless)
npm run test:e2e

# Run with UI mode (interactive)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Run in debug mode
npm run test:e2e:debug

# Run specific browser
npm run test:e2e:chromium
npm run test:e2e:firefox
npm run test:e2e:webkit

# Run mobile tests
npm run test:e2e:mobile

# View test report
npm run test:e2e:report
```

### E2E Test Structure

```
frontend/e2e/
├── navigation.spec.js      # Navigation and UI tests
├── authentication.spec.js  # Login/register flows
└── workflows.spec.js       # Complete user workflows
```

### Writing E2E Tests

```javascript
import { test, expect } from '@playwright/test';

test('user login flow', async ({ page }) => {
  // Navigate to login page
  await page.goto('/login');
  
  // Fill form
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'password');
  
  // Submit
  await page.click('button[type="submit"]');
  
  // Verify success
  await expect(page).toHaveURL(/.*dashboard/);
  await expect(page.locator('[data-testid="user-avatar"]')).toBeVisible();
});
```

### Playwright Configuration

Configuration is in [frontend/playwright.config.js](../frontend/playwright.config.js):

- **Base URL**: `http://localhost:5173`
- **Browsers**: Chromium, Firefox, WebKit
- **Mobile**: Pixel 5, iPhone 12
- **Retries**: 2 in CI, 0 locally
- **Artifacts**: Screenshots, videos on failure

---

## CI/CD Testing

### GitHub Actions Workflows

All tests run automatically on every PR:

#### Test Suite Workflow (`.github/workflows/test-suite.yml`)

Jobs:
1. **Backend Unit Tests**: Runs unit tests with Jest
2. **Backend Integration Tests**: Runs with Firebase emulators
3. **Backend Security Tests**: Security-focused tests
4. **Lint Backend**: ESLint checks
5. **Lint Frontend**: ESLint checks
6. **Frontend Build**: Verifies build succeeds
7. **E2E Tests**: Full Playwright suite
8. **Test Summary**: Aggregates results

#### PR Validation Workflow (`.github/workflows/pr-validation.yml`)

Validates PR:
- Checks PR title follows conventional commits
- Adds appropriate labels
- Triggers test suite

### Viewing Test Results

1. **GitHub PR Checks**: See status in PR checks section
2. **Playwright Report**: Downloadable artifact in Actions
3. **Coverage Reports**: Uploaded to Codecov
4. **Test Summary**: View in GitHub Actions summary

### Running Tests Locally Like CI

```bash
# Backend
cd backend
npm ci
npm run test:all

# Frontend E2E
cd frontend
npm ci
npx playwright install --with-deps
npm run test:e2e
```

---

## Writing Tests

### Best Practices

#### Backend Tests

1. **Use descriptive test names**:
   ```javascript
   it('should return 401 when authentication token is missing', async () => {
     // test code
   });
   ```

2. **Setup and teardown**:
   ```javascript
   beforeAll(async () => {
     // Initialize app, connect to emulators
   });

   afterAll(async () => {
     // Cleanup
   });
   ```

3. **Use factories for test data**:
   ```javascript
   const testUser = {
     email: `test-${Date.now()}@example.com`,
     password: 'TestPassword123!',
     callSign: `TEST-${Date.now()}`,
   };
   ```

4. **Test error cases**:
   ```javascript
   await request(app)
     .post('/api/v1/users')
     .send({ email: 'invalid' })
     .expect(400);
   ```

#### E2E Tests

1. **Use data-testid attributes**:
   ```javascript
   await page.locator('[data-testid="submit-button"]').click();
   ```

2. **Wait for network idle**:
   ```javascript
   await page.waitForLoadState('networkidle');
   ```

3. **Handle async operations**:
   ```javascript
   await expect(async () => {
     await page.locator('.loading').waitFor({ state: 'hidden' });
   }).toPass({ timeout: 10000 });
   ```

4. **Test mobile viewports**:
   ```javascript
   await page.setViewportSize({ width: 375, height: 667 });
   ```

### Test Naming Conventions

- **Unit tests**: `*.test.js` in `tests/unit/`
- **Integration tests**: `*.test.js` in `tests/integration/`
- **E2E tests**: `*.spec.js` in `e2e/`

### Test Coverage Goals

- **Unit Tests**: > 80% coverage
- **Integration Tests**: All API endpoints
- **E2E Tests**: Critical user flows
- **Security Tests**: All security measures

---

## Troubleshooting

### Common Issues

#### Firebase Emulator Connection

**Problem**: Tests fail with Firebase connection errors

**Solution**:
```bash
# Start emulators first
firebase emulators:start --only auth,firestore

# In another terminal
npm test
```

#### Port Already in Use

**Problem**: `EADDRINUSE: address already in use`

**Solution**:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :3000
kill -9 <PID>
```

#### Playwright Browser Install

**Problem**: Playwright can't find browsers

**Solution**:
```bash
npx playwright install --with-deps
```

#### Test Timeouts

**Problem**: Tests timeout in CI

**Solution**: Increase timeout in test:
```javascript
test('slow operation', async ({ page }) => {
  test.setTimeout(60000); // 60 seconds
  // test code
});
```

#### Mock Data Conflicts

**Problem**: Tests fail due to duplicate data

**Solution**: Use unique identifiers:
```javascript
const uniqueEmail = `test-${Date.now()}@example.com`;
const uniqueCallSign = `TEST-${Date.now()}`;
```

### Debug Mode

#### Backend Tests
```bash
# Run single test file
npm test -- tests/integration/api/users.test.js

# Run with verbose output
npm test -- --verbose

# Run with debugger
node --inspect-brk node_modules/.bin/jest --runInBand
```

#### E2E Tests
```bash
# Debug mode (pauses at each step)
npm run test:e2e:debug

# Headed mode (see browser)
npm run test:e2e:headed

# Slow motion
npx playwright test --headed --slow-mo=1000
```

### Getting Help

1. Check test output for specific error messages
2. Review [Jest documentation](https://jestjs.io/docs/getting-started)
3. Review [Playwright documentation](https://playwright.dev/docs/intro)
4. Check GitHub Actions logs for CI failures
5. Ask team in Slack #testing channel

---

## Continuous Improvement

### Adding New Tests

1. Identify the feature or bug fix
2. Write test first (TDD approach)
3. Implement the feature
4. Verify test passes
5. Add to appropriate test suite

### Updating Tests

When API changes:
1. Update integration tests
2. Update E2E tests if user flow changes
3. Update test documentation
4. Run full test suite

### Performance Monitoring

Monitor test execution time:
```bash
npm test -- --testTimeout=5000 --verbose
```

Flag slow tests and optimize.

---

## Quick Reference

### Backend Commands
```bash
npm test                    # All tests
npm run test:unit          # Unit tests
npm run test:integration   # Integration tests
npm run test:security      # Security tests
npm run test:watch         # Watch mode
npm run test:coverage      # With coverage
```

### Frontend Commands
```bash
npm run test:e2e           # All E2E tests
npm run test:e2e:ui        # Interactive UI
npm run test:e2e:headed    # See browser
npm run test:e2e:debug     # Debug mode
npm run test:e2e:report    # View report
```

### CI/CD
- Tests run automatically on every PR
- View results in PR checks
- Download artifacts for detailed reports
- All tests must pass before merge

---

**Last Updated**: January 2026
**Maintained By**: GroundCTRL Testing Team
