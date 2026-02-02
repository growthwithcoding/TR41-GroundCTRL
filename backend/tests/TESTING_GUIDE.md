# Testing Guide - GroundCTRL

Quick reference for running and writing tests.

## Quick Start

```bash
# Backend
cd backend
npm test                    # All tests
npm run test:unit           # Unit tests only
npm run test:integration    # Integration tests
npm run test:security       # Security tests

# With coverage
npm run test:coverage
```

## Test Structure

See [TEST_STRUCTURE.md](./TEST_STRUCTURE.md) for detailed test organization.

## Testing Stack

- **Jest** - Test runner
- **SuperTest** - HTTP assertions
- **Firebase Emulators** - Local Firebase testing

## Writing Tests

### Unit Test Example
```javascript
describe('Feature', () => {
  it('should validate input', () => {
    expect(validateInput('test')).toBe(true);
  });
});
```

### Integration Test Example
```javascript
const request = require('supertest');
const { getTestApp } = require('../../helpers/test-utils');

describe('API Endpoint', () => {
  let app;
  
  beforeAll(() => {
    app = getTestApp();
  });

  it('should return 200', async () => {
    await request(app)
      .get('/api/v1/health')
      .expect(200);
  });
});
```

## Firebase Emulators

Tests run against Firebase emulators for isolation:

```bash
# Start emulators
firebase emulators:start --only auth,firestore

# In another terminal
npm test
```

Environment variables:
```env
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
FIRESTORE_EMULATOR_HOST=localhost:8080
```

## CI/CD

Tests run automatically on every PR via GitHub Actions. Check the "Checks" tab on your PR.

## Documentation

- **[TEST_STRUCTURE.md](./TEST_STRUCTURE.md)** - Test organization & what each test does
- **[QUICKSTART.md](./QUICKSTART.md)** - Quick reference commands
- **[AUTOMATION_SUMMARY.md](./AUTOMATION_SUMMARY.md)** - What's been automated
- **[CODEQL_ANALYSIS.md](./CODEQL_ANALYSIS.md)** - Security analysis setup
