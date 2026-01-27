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
  
  beforeAll(() => {
    app = require('../../../src/app');
  });

  it('should create user successfully', async () => {
    const response = await request(app)
      .post('/api/v1/users')
      .send({
        email: 'test@example.com',
        password: 'password123',
        callSign: 'TestPilot'
      })
      .expect(201);

    expect(response.body.payload.data).toHaveProperty('uid');
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
  
  // Fill login form
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'password123');
  
  // Submit form
  await page.click('button[type="submit"]');
  
  // Verify redirect to dashboard
  await expect(page).toHaveURL(/dashboard/);
  
  // Verify user avatar appears
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

---

## CodeQL Security Analysis

### Overview

CodeQL is GitHub's semantic code analysis engine that automatically runs security scans on the GroundCTRL codebase to identify vulnerabilities and coding errors.

### Configuration

**File**: [`.github/workflows/codeql-analysis.yml`](../../.github/workflows/codeql-analysis.yml)

Key features:
- **Languages**: JavaScript/TypeScript analysis
- **Triggers**: Push to main/sprint2tests, Pull requests, Weekly schedule  
- **Queries**: Security-and-quality query suite for comprehensive analysis
- **Dependencies**: Installs both backend and frontend dependencies for complete analysis

### What CodeQL Detects

CodeQL analyzes code semantically to find:
- **Injection vulnerabilities**: SQL injection, XSS, command injection
- **Authentication flaws**: Weak password policies, insecure token handling
- **Data flow issues**: Sensitive data exposure, improper validation
- **Code quality**: Dead code, unreachable code, type mismatches

### Workflow Integration

```yaml
# Runs automatically on:
on:
  push:
    branches: [ main, sprint2tests ]
  pull_request:
    branches: [ main ]
  schedule:
    - cron: '25 3 * * 1'  # Weekly on Mondays
```

### Permissions Fixed

The workflow includes proper permissions to avoid common errors:
```yaml
permissions:
  contents: read
  security-events: write  # Required for uploading SARIF results
  actions: read          # Required for private repositories
```

### Viewing Results

CodeQL results are available in:
1. **GitHub Security tab**: Repository-level security advisories
2. **Pull Request checks**: Inline security feedback on PRs  
3. **Actions artifacts**: SARIF files for detailed analysis

### Integration with Testing

CodeQL complements existing tests:
- **Unit/Integration Tests**: Functional correctness
- **CodeQL Analysis**: Security vulnerabilities and code quality  
- **Combined Coverage**: Comprehensive validation

This provides an additional security layer beyond manual testing.

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
   it('should return 404 when user does not exist', async () => {
     // Test implementation
   });
   ```

2. **Setup and teardown**:
   ```javascript
   beforeEach(async () => {
     // Clean database state
   });
   
   afterEach(async () => {
     // Cleanup resources
   });
   ```

3. **Use factories for test data**:
   ```javascript
   const testUser = {
     email: 'test@example.com',
     password: 'password123',
     callSign: 'TestPilot'
   };
   ```

4. **Test error cases**:
   ```javascript
   it('should handle invalid email format', async () => {
     await request(app)
       .post('/api/v1/users')
       .send({ email: 'invalid-email' })
       .expect(400);
   });
   ```

#### E2E Tests

1. **Use data-testid attributes**:
   ```javascript
   await page.click('[data-testid="login-button"]');
   ```

2. **Wait for network idle**:
   ```javascript
   await page.goto('/dashboard', { waitUntil: 'networkidle' });
   ```

3. **Handle async operations**:
   ```javascript
   await expect(page.locator('.loading')).toBeHidden();
   await expect(page.locator('.content')).toBeVisible();
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
  test.setTimeout(30000); // 30 seconds
  // Test implementation
});
```

#### Firebase Admin Initialization

**Problem**: Firebase Admin SDK initialization errors

**Solution**:
```bash
# Set environment variables
export FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
export FIRESTORE_EMULATOR_HOST=localhost:8080
export FIREBASE_PROJECT_ID=groundctrl-test
```

#### Memory Leaks in Tests

**Problem**: Jest reports memory leaks or open handles

**Solution**:
```javascript
afterAll(async () => {
  // Close database connections
  await admin.app().delete();
  // Close server
  if (server) {
    await server.close();
  }
});
```

### Debug Mode

#### Backend Tests
```bash
# Run with debug output
DEBUG=* npm test

# Run specific test with verbose output
npm test -- --verbose users.test.js
```

#### E2E Tests
```bash
# Run in debug mode (pauses at each step)
npm run test:e2e:debug

# Run with browser visible
npm run test:e2e:headed

# Generate trace for debugging
npm run test:e2e -- --trace on
```

---

## Performance Considerations

### Backend Tests
- Use `beforeAll`/`afterAll` for expensive setup
- Mock external services
- Use test database with smaller datasets
- Parallel test execution where possible

### E2E Tests
- Run in parallel (configured in playwright.config.js)
- Use page.waitForLoadState() instead of arbitrary waits
- Reuse browser contexts where possible
- Clean state between tests

---

## Test Data Management

### Backend
```javascript
// Use factories for consistent test data
const UserFactory = {
  create: (overrides = {}) => ({
    email: 'test@example.com',
    password: 'password123',
    callSign: 'TestPilot',
    ...overrides
  })
};
```

### Frontend E2E
```javascript
// Use test-specific data
test('user registration', async ({ page }) => {
  const timestamp = Date.now();
  const testUser = {
    email: `test+${timestamp}@example.com`,
    password: 'password123',
    callSign: `TestPilot${timestamp}`
  };
  
  // Use testUser in test
});
```

---

## Continuous Integration Best Practices

1. **Fast Feedback**: Unit tests run first and fail fast
2. **Parallel Execution**: Tests run in parallel where possible
3. **Artifact Collection**: Screenshots, videos, and reports saved
4. **Flaky Test Detection**: Retries configured for E2E tests
5. **Coverage Reporting**: Coverage reports generated and tracked

---

## Advanced Topics

### Custom Matchers
```javascript
// jest.config.js
module.exports = {
  setupFilesAfterEnv: ['<rootDir>/tests/helpers/custom-matchers.js']
};

// tests/helpers/custom-matchers.js
expect.extend({
  toBeValidUser(received) {
    const pass = received.uid && received.email;
    return {
      pass,
      message: () => `Expected ${received} to be a valid user`
    };
  }
});
```

### Page Object Model (E2E)
```javascript
// e2e/pages/LoginPage.js
class LoginPage {
  constructor(page) {
    this.page = page;
    this.emailInput = page.locator('input[type="email"]');
    this.passwordInput = page.locator('input[type="password"]');
    this.loginButton = page.locator('button[type="submit"]');
  }

  async login(email, password) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}
```

---

## Resources

- **Jest Documentation**: https://jestjs.io/
- **SuperTest Documentation**: https://github.com/visionmedia/supertest
- **Playwright Documentation**: https://playwright.dev/
- **Firebase Emulator Suite**: https://firebase.google.com/docs/emulator-suite

---

**Last Updated**: January 27, 2026  
**Version**: 2.0.0