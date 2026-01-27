# Test Suite Organization

This directory contains all automated tests for the GroundCTRL backend, organized by test type and consolidated to eliminate duplication.

## Quick Start

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run specific test suites
npm run test:unit           # Unit tests only
npm run test:integration    # Integration tests (SuperTest)
npm run test:security       # Security tests only

# Run with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch
```

## Directory Structure

```
tests/
├── setup.js                # Global test configuration (runs before all tests)
├── unit/                    # Unit tests (isolated component testing)
│   ├── config/             # Configuration unit tests (Firebase, environment)
│   │   └── firebase.test.js
│   ├── middleware/         # Middleware unit tests (auth, validation, rate limiting)
│   │   ├── validation.test.js
│   │   └── rateLimiter.test.js
│   └── services/           # Service layer unit tests (business logic)
│       ├── authService.test.js
│       └── userService.test.js
├── integration/            # Integration tests (API endpoint testing with SuperTest)
│   ├── api/               # NEW: Comprehensive API endpoint tests
│   │   ├── users.test.js        # User CRUD operations
│   │   └── satellites.test.js   # Satellite management
│   ├── auth/              # Authentication integration tests
│   │   └── authentication.test.js
│   ├── rate-limiting/     # Rate limiter integration tests
│   │   └── rate-limiter.test.js
│   ├── crud/              # CRUD factory integration tests
│   │   └── crud-factory.test.js
│   ├── validation/        # Schema validation integration tests
│   │   └── validation.test.js
│   └── domain/            # Domain-specific tests (satellites, help, AI)
│       ├── satellites.test.js
│       ├── help.test.js
│       └── ai-help.test.js
├── e2e/                    # End-to-end tests (placeholder - actual E2E tests in frontend/e2e/)
│   ├── ui/                # UI navigation and interaction tests
│   │   └── navigation.test.js
│   └── workflows/         # Complete workflow tests
│       ├── user-registration.test.js
│       └── login-flow.test.js
├── security/               # Security-focused tests
│   ├── injection.test.js  # SQL/NoSQL injection, XSS tests
│   ├── timing.test.js     # Timing attack prevention
│   ├── enumeration.test.js # User enumeration prevention
│   └── error-handling.test.js # Error disclosure tests
├── performance/            # Performance and load tests
│   ├── load-testing.test.js # Load and stress tests
│   └── pagination.test.js   # Pagination performance
├── ci-cd/                  # CI/CD pipeline tests
│   └── pipeline.test.js   # Lint, build, deployment checks
└── helpers/                # Shared test utilities
    ├── test-utils.js      # Common test functions
    ├── fixtures.js        # Test data fixtures
    └── mocks.js           # Mock implementations
```

## Test Configuration

### Global Setup (`setup.js`)

The `setup.js` file runs before all tests and configures:
- **Environment**: Sets `NODE_ENV=test`
- **Firebase Emulators**: Configures Auth (port 9099) and Firestore (port 8080)
- **Emulator Hub**: Sets up emulator hub on port 4400 to prevent external network calls
- **Console Output**: Optional suppression via `SUPPRESS_TEST_LOGS=true`
- **Timeouts**: Default 10-second timeout for all tests
- **Cleanup**: Global afterAll hook for graceful shutdown

This centralized configuration ensures consistent test environment across all test types.

## Test Categories

### 1. Unit Tests (`/unit`)
**Purpose**: Test individual components in isolation  
**Characteristics**:
- Fast execution (< 1s per test)
- No external dependencies (mocked Firebase, DB)
- Test single functions/classes
- High code coverage target (80%+)

**Test IDs Covered**: VAL-001 to VAL-008, LIM-001 to LIM-003, CRUD-001 to CRUD-005

### 2. Integration Tests (`/integration`)
**Purpose**: Test API endpoints and component interactions  
**Characteristics**:
- Use Firebase emulators
- Test request/response cycles
- Verify database interactions
- Moderate execution time (1-5s per test)

**Test IDs Covered**: AUTH-001 to AUTH-015, CRUD-006 to CRUD-008, SAT-001 to SAT-002, HELP-001 to HELP-002, AI-001 to AI-003, FIRE-001 to FIRE-008

### 3. End-to-End Tests (`/e2e`)
**Purpose**: Test complete user workflows  
**Characteristics**:
- Full browser automation (Playwright/Cypress)
- Test entire user journeys
- Verify UI and backend integration
- Slower execution (5-30s per test)

**Test IDs Covered**: UI-001 to UI-008

### 4. Security Tests (`/security`)
**Purpose**: Identify security vulnerabilities  
**Characteristics**:
- Test injection attacks (XSS, SQL/NoSQL)
- Verify authentication/authorization
- Test rate limiting effectiveness
- Check error message disclosure

**Test IDs Covered**: SEC-001 to SEC-008

### 5. Performance Tests (`/performance`)
**Purpose**: Validate system performance under load  
**Characteristics**:
- Load testing (concurrent requests)
- Stress testing (system limits)
- Response time validation
- Resource usage monitoring

**Test IDs Covered**: PERF-001 to PERF-005

### 6. CI/CD Tests (`/ci-cd`)
**Purpose**: Validate build and deployment processes  
**Characteristics**:
- Lint verification
- Build process validation
- Package version checks
- Deployment configuration

**Test IDs Covered**: T-001 to T-006, CI-001 to CI-005

## Running Tests

### Prerequisites
```bash
# Install dependencies
npm install

# Start Firebase emulators (required for integration tests)
firebase emulators:start

# Optional: Suppress console logs during tests
export SUPPRESS_TEST_LOGS=true
```

### Run All Tests
```bash
npm test
```

### Run Specific Test Categories
```bash
npm run test:unit          # Unit tests only (~50 tests, <10s)
npm run test:integration   # Integration tests only (~60 tests, 30-60s, requires emulators)
npm run test:e2e           # E2E tests only (~15 tests, 2-5min, requires emulators)
npm run test:security      # Security tests only (~10 tests, 10-20s)
npm run test:performance   # Performance tests only (~5 tests, 1-2min, requires emulators)
npm run test:ci-cd         # CI/CD tests only (~10 tests, 10-20s)
```

### Development Workflows
```bash
# Watch mode for TDD (re-runs on file changes)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run fast tests only (unit + ci-cd)
npm run test:all

# Run tests for a specific file
npm test -- firebase.test.js

# Run tests matching a pattern
npm test -- --testNamePattern="AUTH-001"
```

## Test Matrix Coverage

This test suite implements a comprehensive test matrix covering **142+ test cases** across **12 categories**:

| Category | Test IDs | Count | Type |
|----------|----------|-------|------|
| **Tooling/CI** | T-001 to T-006 | 6 | CI/CD |
| **Frontend UI** | UI-001 to UI-008 | 8 | E2E |
| **Authentication** | AUTH-001 to AUTH-015 | 15 | Integration |
| **Validation** | VAL-001 to VAL-008 | 8 | Unit/Integration |
| **CRUD Factory** | CRUD-001 to CRUD-008 | 8 | Unit/Integration |
| **Domain (Sat/Help/AI)** | SAT-001 to AI-004 | 7 | Integration |
| **Firebase/Config** | FIRE-001 to FIRE-008 | 8 | Integration |
| **Rate Limiting** | LIM-001 to LIM-005 | 5 | Unit/Integration |
| **CI/CD Pipeline** | CI-001 to CI-005 | 5 | CI/CD |
| **Security** | SEC-001 to SEC-008 | 8 | Security |
| **Performance** | PERF-001 to PERF-005 | 5 | Performance |
| **Regression/Smoke** | SM-001 to SM-007 | 7 | Smoke |

**Total**: 90+ documented test cases with room for expansion to 142+

See the full test specification in your project documentation for detailed test descriptions and expected results.

## Writing New Tests

### Naming Conventions
- **File names**: `[feature].test.js` (e.g., `authentication.test.js`)
- **Test suites**: Descriptive with test ID reference
- **Test cases**: Clear action and expected result

### Example Test Structure
```javascript
/**
 * Integration Tests for Authentication
 * Tests: AUTH-001, AUTH-002, AUTH-007
 */

const request = require('supertest');
const { createTestUser, cleanupTestData } = require('../../helpers/test-utils');

describe('Authentication - Integration Tests', () => {
  let app;

  beforeAll(async () => {
    // Setup
    process.env.NODE_ENV = 'test';
    app = require('../../../src/app');
  });

  afterAll(async () => {
    // Cleanup
    await cleanupTestData('users');
  });

  describe('AUTH-001: CreateUser with duplicate callSign', () => {
    it('should create user successfully even with duplicate callSign', async () => {
      const userData = {
        email: `test-${Date.now()}@example.com`,
        password: 'TestPassword123!',
        callSign: 'DUPLICATE',
      };

      const response = await request(app)
        .post('/api/v1/users')
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('uid');
      expect(response.body.data).toHaveProperty('token');
    });
  });
});
```

### Best Practices
1. **Include test IDs in comments** for traceability (e.g., `// Tests: AUTH-001, AUTH-002`)
2. **Use descriptive test names** that explain what is being tested
3. **Follow AAA pattern**: Arrange, Act, Assert
4. **Keep tests independent** - each test should work in isolation
5. **Use test helpers** from `helpers/test-utils.js` for common operations
6. **Clean up after tests** - remove test data to prevent pollution
7. **Mock external services** in unit tests
8. **Use Firebase emulators** for integration tests
9. **Set appropriate timeouts** for slow tests (performance, E2E)
10. **Document complex test scenarios** with comments

## Firebase Emulator Requirements

Integration and E2E tests require Firebase emulators to be running:

```bash
# Start all emulators
firebase emulators:start

# Start specific emulators
firebase emulators:start --only auth,firestore

# Run in background
firebase emulators:start &
```

### Emulator Configuration
The test suite is configured to use the following emulator endpoints:
- **Auth Emulator**: `localhost:9099`
- **Firestore Emulator**: `localhost:8080`
- **Emulator Hub**: `localhost:4400`
- **Configuration**: See `firebase.json` in project root and `tests/setup.js`

**Important**: The `FIREBASE_EMULATOR_HUB` environment variable is set in `setup.js` to ensure all Firebase SDK calls are routed through emulators and prevent accidental production API calls.

## Troubleshooting

### Common Issues

**1. Firebase Emulator Connection Errors**
```bash
# Ensure emulators are running
firebase emulators:start

# Check emulator status
curl http://localhost:8080
curl http://localhost:9099
curl http://localhost:4400  # Emulator hub
```

**2. Test Timeouts**
The global timeout is set to 10 seconds in `setup.js`. For tests that need more time:
```javascript
// Increase timeout for specific test suite
describe('Slow tests', () => {
  jest.setTimeout(30000); // 30 seconds
  
  it('should handle long-running operation', async () => {
    // ...
  });
});
```

**3. Port Conflicts**
```bash
# Kill processes on Firebase ports
lsof -ti:8080,9099,4400 | xargs kill -9

# Or kill specific port
lsof -ti:8080 | xargs kill -9
```

**4. Flaky Tests**
- Add retry logic using `retryOperation` helper
- Increase wait times for async operations
- Use `waitFor` utilities for timing-dependent tests

**5. Environment Variables**
Environment variables are automatically set in `tests/setup.js`:
- `NODE_ENV=test`
- `FIREBASE_AUTH_EMULATOR_HOST=localhost:9099`
- `FIRESTORE_EMULATOR_HOST=localhost:8080`
- `FIREBASE_EMULATOR_HUB=localhost:4400`

Optional: Suppress test console output:
```bash
# Linux/Mac
export SUPPRESS_TEST_LOGS=true

# Windows
set SUPPRESS_TEST_LOGS=true

# Then run tests
npm test
```

**6. Async Cleanup Issues**
The global `afterAll` hook in `setup.js` includes a 500ms delay to allow async operations to complete. If you experience hanging tests, check for:
- Unclosed database connections
- Active timers or intervals
- Pending promises

## Test Data Management

### Fixtures
Test data fixtures are stored in `helpers/fixtures.js`:
```javascript
const { userFixtures } = require('../helpers/fixtures');
const testUser = userFixtures.validUser;
```

### Cleanup
Always clean up test data after tests:
```javascript
afterEach(async () => {
  await cleanupTestData('users');
});
```

## Contributing

When adding new features:
1. Write tests first (TDD approach)
2. Ensure tests pass locally before pushing
3. Add test IDs to new tests
4. Update this README if adding new test categories
5. Maintain or improve code coverage

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [SuperTest Guide](https://github.com/visionmedia/supertest)
- [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)
- [Testing Best Practices](https://testingjavascript.com/)

## Support

For questions or issues with tests:
- Check existing test examples in the respective directories
- Review `helpers/test-utils.js` for available utilities
- Consult team documentation or reach out to the team lead

