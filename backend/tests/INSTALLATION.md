# Testing Automation - Installation & Setup

This guide will help you get the automated testing suite up and running.

## Overview

We've implemented:
- ✅ **Backend Unit & Integration Tests** with Jest + SuperTest
- ✅ **Frontend E2E Tests** with Playwright
- ✅ **GitHub Actions CI/CD** that runs on every PR
- ✅ **Comprehensive Test Coverage** for API endpoints and user workflows

---

## Installation Steps

### 1. Backend Testing Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies (SuperTest is already in package.json)
npm install

# Verify installation
npm test -- --version
```

**What's included:**
- Jest test runner
- SuperTest for HTTP assertions
- Firebase emulators for testing

### 2. Frontend E2E Testing Setup

```bash
# Navigate to frontend directory
cd frontend

# Install Playwright
npm install

# Install Playwright browsers
npx playwright install --with-deps
```

This will install:
- Playwright test framework
- Chromium, Firefox, and WebKit browsers
- Required system dependencies

### 3. Verify Installation

#### Backend Tests
```bash
cd backend

# Run a quick sanity check
npm run test:ci-cd

# Run all unit tests
npm run test:unit
```

#### Frontend E2E Tests
```bash
cd frontend

# Run E2E tests in UI mode (recommended for first run)
npm run test:e2e:ui
```

---

## Quick Test Run

### Backend Tests

```bash
cd backend

# All tests
npm test

# Specific suites
npm run test:unit           # Unit tests
npm run test:integration    # API integration tests
npm run test:security       # Security tests
```

### Frontend E2E Tests

```bash
cd frontend

# Headless mode (like CI)
npm run test:e2e

# Interactive UI mode (development)
npm run test:e2e:ui

# Headed mode (see browser)
npm run test:e2e:headed
```

---

## What's Been Automated

### 1. Backend Integration Tests (SuperTest)

**Location:** `backend/tests/integration/api/`

New comprehensive test files:
- ✅ `users.test.js` - User CRUD operations
  - Registration
  - Profile updates
  - Deletion
  - Authentication flows

- ✅ `satellites.test.js` - Satellite management
  - Create satellite
  - List satellites
  - Update satellite
  - Command satellites
  - Delete satellite

**Example:**
```javascript
const response = await request(app)
  .post('/api/v1/users')
  .send({ email: 'test@test.com', password: 'password' })
  .expect(201);

expect(response.body.payload.data).toHaveProperty('uid');
```

### 2. Frontend E2E Tests (Playwright)

**Location:** `frontend/e2e/`

Test files:
- ✅ `navigation.spec.js` - Navigation and UI
  - Homepage loading
  - Menu navigation
  - Mobile responsive
  - 404 handling
  
- ✅ `authentication.spec.js` - Auth flows
  - User registration
  - Login/logout
  - Protected routes
  - Error handling

- ✅ `workflows.spec.js` - Complete workflows
  - Satellite creation workflow
  - Help center usage
  - AI assistant usage

**Example:**
```javascript
await page.goto('/login');
await page.fill('input[type="email"]', 'test@example.com');
await page.fill('input[type="password"]', 'password');
await page.click('button[type="submit"]');
await expect(page).toHaveURL(/dashboard/);
```

### 3. GitHub Actions CI/CD

**Location:** `.github/workflows/`

Workflows:
- ✅ `test-suite.yml` - Main test workflow
  - Backend unit tests
  - Backend integration tests
  - Security tests
  - Lint checks
  - Frontend build
  - E2E tests
  - Test summary

- ✅ `pr-validation.yml` - PR checks
  - Validates PR title format
  - Adds labels
  - Triggers test suite

**Triggers:**
- Every PR to `main` or `develop`
- Every push to `main` or `develop`
- Manual workflow dispatch

---

## Configuration Files

### Backend - Jest

**File:** `backend/jest.config.js`

Already configured for:
- Firebase emulators
- Test directory structure
- Coverage reporting
- Timeout settings

### Frontend - Playwright

**File:** `frontend/playwright.config.js`

Configured for:
- Multiple browsers (Chromium, Firefox, WebKit)
- Mobile viewports (Pixel 5, iPhone 12)
- Auto-start dev servers
- Screenshot/video capture on failure
- Trace on retry

---

## Environment Setup

### Backend Environment Variables

Create `.env.test` in backend directory:

```env
NODE_ENV=test
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
FIRESTORE_EMULATOR_HOST=localhost:8080
FIREBASE_PROJECT_ID=groundctrl-test
```

### Frontend Environment Variables

Tests will use local development servers automatically.

---

## Running Tests in CI/CD

Tests run automatically on GitHub Actions for every PR.

### View Results

1. Go to your PR on GitHub
2. Click "Checks" tab
3. See test results for each job:
   - ✅ Backend Unit Tests
   - ✅ Backend Integration Tests
   - ✅ Security Tests
   - ✅ Lint Checks
   - ✅ E2E Tests

### Download Artifacts

After tests run, download:
- Playwright HTML report
- Test results JSON
- Screenshots/videos of failures

---

## Documentation

Comprehensive guides created:

1. **[TESTING_GUIDE.md](./TESTING_GUIDE.md)**
   - Complete testing documentation
   - Writing tests
   - Best practices
   - Troubleshooting

2. **[QUICKSTART.md](./QUICKSTART.md)**
   - Quick reference
   - Common commands
   - Basic examples

3. **[E2E_TESTING.md](./E2E_TESTING.md)**
   - Playwright-specific guide
   - E2E test patterns
   - Debugging tips

4. **[TESTING_STRATEGY.md](./TESTING_STRATEGY.md)**
   - Backend test structure
   - Coverage analysis
   - Running backend tests

---

## Common Commands Cheat Sheet

### Backend
```bash
npm test                    # All tests
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:security      # Security tests only
npm run test:watch         # Watch mode
npm run test:coverage      # With coverage report
```

### Frontend
```bash
npm run test:e2e           # All E2E tests
npm run test:e2e:ui        # Interactive UI mode
npm run test:e2e:headed    # See browser
npm run test:e2e:debug     # Debug mode
npm run test:e2e:report    # View HTML report
```

---

## Next Steps

### 1. Run Tests Locally

```bash
# Backend
cd backend
npm test

# Frontend
cd frontend
npm run test:e2e:ui
```

### 2. Review Test Files

- Check out `backend/tests/integration/api/` for API tests
- Check out `frontend/e2e/` for E2E tests

### 3. Create a Test PR

Create a test PR to see GitHub Actions in action!

### 4. Start Writing Tests

Use existing tests as templates for new features.

---

## Troubleshooting

### Port Conflicts

If ports are in use:
```bash
# Windows - Kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Playwright Installation Issues

```bash
# Reinstall with dependencies
npx playwright install --with-deps
```

### Firebase Emulator Issues

```bash
# Verify emulators are running
firebase emulators:start --only auth,firestore
```

### Test Failures

1. Check logs in terminal
2. For E2E: View screenshots in `test-results/`
3. For E2E: Run with `--debug` flag
4. Verify environment variables are set

---

## Support

- **Documentation**: See guides above
- **Examples**: Check existing test files
- **CI/CD Logs**: GitHub Actions tab
- **Issues**: Open GitHub issue with test logs

---

## Summary

✅ Backend tests automated with Jest + SuperTest
✅ Frontend E2E tests automated with Playwright
✅ CI/CD pipeline running tests on every PR
✅ Comprehensive documentation and setup guides
✅ All testing tools and configurations ready

**Status**: 🎉 Production Ready | **Last Updated**: January 2026