# Test Structure Overview

## Test Organization

```
backend/tests/
├── unit/              # Isolated component tests
├── integration/       # API & service interaction tests
├── security/          # Security hardening tests
├── ci-cd/            # Pipeline & dependency tests
├── performance/      # Load & performance tests
├── helpers/          # Test utilities
├── scripts/          # Test automation scripts
└── __mocks__/        # Mock data and utilities
```

## Unit Tests (`unit/`)

**Purpose:** Test individual components in isolation

- `config/firebase.test.js` - Firebase initialization & config
- `validation/schema-validation.test.js` - Zod schema validation
- `crud/crud-factory.test.js` - CRUD factory patterns

## Integration Tests (`integration/`)

**Purpose:** Test API endpoints & service interactions

- `auth/` - Authentication flows (login, register, token refresh)
- `domain/` - Domain-specific operations (satellites, scenarios, sessions)
- `firebase/` - Firebase security rules & emulator tests

## Security Tests (`security/`)

**Purpose:** Validate security hardening measures

### Validation (`security/validation/`)
- `injection.test.js` - SQL/NoSQL injection prevention
- `input-validation.test.js` - Input sanitization & validation
- `ownership-crud.test.js` - UID-based ownership enforcement
- `no-callSign-lookup.test.js` - Prevents callSign-based queries
- `zod-strict-schema.test.js` - Strict schema validation
- `query-caps.test.js` - Query parameter limits
- `sort-whitelist.test.js` - Whitelisted sort fields only
- `body-size-limit.test.js` - Request body size limits
- `property-based-validation.test.js` - Property-based testing for edge cases

### Rate Limiting (`security/rate-limit/`)
- `rate-limiting.test.js` - Global rate limits
- `login-composite-key.test.js` - IP+Email composite key limiting
- `help-ai-strict-limit.test.js` - AI endpoint rate limits
- `rate-limit-memory-leak.test.js` - Memory leak prevention
- `rate-limit-concurrent.test.js` - Concurrent request handling
- `global-window-reset.test.js` - Rate limit window reset behavior

### Authentication (`security/auth/`)
- `authentication.test.js` - Auth flows & token validation
- `auth-error-normalization.test.js` - Consistent error responses
- `token-revocation.test.js` - Token blacklist & revocation
- `login-success.test.js` - Successful login flow validation
- `login-bad-password.test.js` - Failed login handling
- `refresh-reuse.test.js` - Refresh token reuse detection
- `jwt-expiration.test.js` - JWT expiration enforcement
- `jwt-algorithm.test.js` - JWT algorithm validation

### HTTP Security Headers (`security/headers/`)
- `headers.test.js` - General security headers
- `hsts-header.test.js` - HTTP Strict Transport Security
- `csp-script-whitelist.test.js` - Content Security Policy script whitelisting

### CORS (`security/cors/`)
- `cors.test.js` - CORS configuration validation
- `cors-credentials.test.js` - CORS credentials handling
- `cors-cache-maxage.test.js` - CORS preflight cache settings

### Cookies (`security/cookies/`)
- `cookie-max-age.test.js` - Cookie expiration settings
- `session-cookies.test.js` - Session cookie security
- `cookie-path-scope.test.js` - Cookie path restrictions
- `cookie-same-site-none-blocked.test.js` - SameSite attribute enforcement

### Health Checks (`security/health/`)
- `health-check.test.js` - Basic health endpoint validation
- `health-ready.test.js` - Readiness probe checks
- `health-metrics.test.js` - Health metrics reporting

### HTTP Client (`security/http-client/`)
- `timeout-enforced.test.js` - HTTP timeout enforcement
- `retry-policy.test.js` - Retry policy validation
- `circuit-breaker-fallback.test.js` - Circuit breaker pattern

### Firebase Security (`security/firebase/`)
- `firebase-emulator-guard.test.js` - Emulator-only operations
- `index-enforcement.test.js` - Firestore index requirements

### CI Security (`security/ci/`)
- `dependency-pinning.test.js` - Dependency lock file validation
- `npm-audit.test.js` - NPM vulnerability scanning
- `secret-scan.test.js` - Secret detection in code
- `secrets-ci-hardening.test.js` - CI secret management
- `eslint-security.test.js` - ESLint security rule compliance

### Audit (`security/audit/`)
- `audit-anonymous.test.js` - Anonymous user tracking
- `audit-custom-metadata.test.js` - Custom audit metadata
- `audit-timestamp.test.js` - Audit timestamp accuracy
- `audit-logging.test.js` - Comprehensive audit logging
- `audit-payload-sanitisation.test.js` - Audit payload sanitization

## CI/CD Tests (`ci-cd/`)

**Purpose:** Validate build, lint, and deployment processes

- `pipeline.test.js` - CI/CD workflow validation
- `sanity.test.js` - Basic sanity checks

Note: Dependency pinning and linting tests have been moved to `security/ci/` for better organization.

## Performance Tests (`performance/`)

**Purpose:** Validate performance under load

- Load testing
- Memory profiling
- Response time benchmarks

## Running Tests

```bash
# All tests
npm test

# By category
npm run test:unit
npm run test:integration
npm run test:security

# Specific file
npm test -- path/to/test.test.js

# With coverage
npm run test:coverage
```

## Why This Structure?

1. **Clear Separation:** Unit, integration, security, and CI/CD concerns separated
2. **Security First:** Dedicated security test suite ensures hardening measures work
3. **UID Enforcement:** Tests validate no callSign lookups occur (identity-by-UID only)
4. **Rate Limit Validation:** Ensures DoS protection and fair usage
5. **CI/CD Integration:** Automated validation on every PR

## Key Testing Principles

- ✅ **UID-only operations** - No callSign-based queries
- ✅ **Rate limiting** - All endpoints protected
- ✅ **Input validation** - Zod strict mode enforced
- ✅ **Ownership scoping** - Users only access their data
- ✅ **Error normalization** - Consistent error responses
- ✅ **Audit logging** - All operations tracked by UID

## Documentation

- **QUICKSTART.md** - Fast setup & common commands
- **TESTING_GUIDE.md** - Comprehensive testing documentation
- **AUTOMATION_SUMMARY.md** - What's been automated
- **CODEQL_ANALYSIS.md** - Security analysis configuration
- **CI_CD_FIREBASE_TESTS.md** - Firebase test configuration
