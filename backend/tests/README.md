# GroundCTRL Testing Documentation

**Complete testing suite for GroundCTRL backend**

## Quick Start

```bash
# Install & run
npm install
npm test

# By category
npm run test:unit           # Unit tests
npm run test:integration    # API tests (SuperTest)
npm run test:security       # Security hardening tests
npm run test:coverage       # With coverage report
```

## Documentation

- **[TEST_STRUCTURE.md](./TEST_STRUCTURE.md)** - **START HERE** - What each test does & folder structure
- **[QUICKSTART.md](./QUICKSTART.md)** - Quick command reference
- **[TESTING_GUIDE.md](./TESTING_GUIDE.md)** - Writing tests & examples
- **[AUTOMATION_SUMMARY.md](./AUTOMATION_SUMMARY.md)** - What's automated
- **[CODEQL_ANALYSIS.md](./CODEQL_ANALYSIS.md)** - Security scanning


## Test Categories

**Unit Tests** (`unit/`) - Individual components, mocked dependencies, <1s each
**Integration Tests** (`integration/`) - API endpoints with SuperTest, Firebase emulators
**Security Tests** (`security/`) - Injection, rate limiting, validation, auth
**Performance Tests** (`performance/`) - Load testing, benchmarks
**CI/CD Tests** (`ci-cd/`) - Build, lint, dependency checks

See [TEST_STRUCTURE.md](./TEST_STRUCTURE.md) for detailed breakdown of each test file.

## Key Testing Principles

✅ **UID-only operations** - No callSign lookups
✅ **Rate limiting** - All endpoints protected  
✅ **Input validation** - Zod strict mode enforced
✅ **Ownership scoping** - Users only access their data
✅ **Error normalization** - Consistent error responses

## CI/CD Integration

Tests run automatically on every PR via GitHub Actions:
- Backend unit/integration/security tests
- CodeQL security analysis  
- Lint checks
- Build verification

Check the "Checks" tab on your PR for results.

## Firebase Emulators

Tests use Firebase emulators for isolation:

```bash
# Emulator ports
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
FIRESTORE_EMULATOR_HOST=localhost:8080
```

Emulators start automatically during tests via `setup.js`.

