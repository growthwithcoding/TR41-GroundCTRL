# Quick Start - Automated Testing

## Prerequisites

### Backend
```bash
cd backend
npm install
```

### Frontend
```bash
cd frontend
npm install
npx playwright install
```

## Running Tests

### Backend Tests (Jest + SuperTest)

```bash
cd backend

# All tests
npm test

# Specific suites
npm run test:unit
npm run test:integration
npm run test:security

# With coverage
npm run test:coverage
```

### Frontend E2E Tests (Playwright)

```bash
cd frontend

# Run tests
npm run test:e2e

# Interactive mode
npm run test:e2e:ui

# View report
npm run test:e2e:report
```

## CI/CD

Tests run automatically on every PR via GitHub Actions:
- ✅ Backend unit tests
- ✅ Backend integration tests  
- ✅ Security tests
- ✅ Lint checks
- ✅ E2E tests with Playwright

## Test Files

### Backend
- **Integration**: `backend/tests/integration/api/`
  - `users.test.js` - User API endpoints
  - `satellites.test.js` - Satellite API endpoints

### Frontend
- **E2E**: `frontend/e2e/`
  - `navigation.spec.js` - UI navigation tests
  - `authentication.spec.js` - Login/register flows
  - `workflows.spec.js` - Complete user workflows

## Writing Tests

### Backend Integration Test
```javascript
const request = require('supertest');

describe('API Tests', () => {
  let app;
  
  beforeAll(() => {
    app = require('../../../src/app');
  });

  it('should return 200', async () => {
    await request(app)
      .get('/api/v1/health')
      .expect(200);
  });
});
```

### Frontend E2E Test
```javascript
import { test, expect } from '@playwright/test';

test('user can login', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[type="email"]', 'test@test.com');
  await page.fill('input[type="password"]', 'password');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL(/dashboard/);
});
```

## Full Documentation

See [TESTING_GUIDE.md](./TESTING_GUIDE.md) for comprehensive documentation.
