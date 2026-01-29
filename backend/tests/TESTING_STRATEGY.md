# GroundCTRL Test Strategy & Coverage Guide

**Last Updated:** January 26 2025  
**Project Phase:** Sprint 2 - Testing Implementation  
**Test Framework:** Jest + Supertest + Firebase Emulators

---

## Overview

This document provides the comprehensive testing strategy for GroundCTRL backend, consolidating phase-by-phase requirements, security coverage analysis, and implementation patterns. For directory structure and running tests, see [README.md](./README.md).

**Current Status:**
- ✅ **Sprint 0 (Foundation):** 28 tests passing - Firebase emulators, identity enforcement, security quick wins, validation, CRUD factory
- ⚠️ **Sprint 1 (Authentication):** 81 tests written - Auth flows, security rules, scenario visibility, security headers (requires backend implementation)
- 📋 **Sprint 2+ (Domains):** Planned - Satellites, scenarios, sessions, commands, NOVA AI

---

## Testing Philosophy

### Test Pyramid Distribution

```
        E2E Tests (5%)
       ├─ Critical user journeys
       └─ Full stack validation
       
      Integration Tests (25%)
     ├─ API endpoint testing
     ├─ Firebase emulator usage
     └─ Database interactions
     
    Unit Tests (70%)
   ├─ Business logic
   ├─ Utility functions
   └─ Service methods
```

**Why This Matters:**
- **Unit tests** catch logic bugs early, run fast (<1s each)
- **Integration tests** validate API contracts and middleware chains (1-5s each)
- **E2E tests** ensure end-to-end workflows work (5-30s each, prone to flakiness)

---

## Phase-by-Phase Test Coverage

### Phase 0-4: Architectural Foundation ✅

**Status:** Complete (28 tests passing)

| Phase | Focus Area | Test Count | Key Validations |
|-------|-----------|------------|-----------------|
| **Phase 1** | Identity Enforcement | 5 | UID-only operations, no callSign lookups, audit trails use UID |
| **Phase 2** | Security Quick Wins | 6 | Global rate limiting, error normalization, HTTP timeouts |
| **Phase 3** | Validation Layer | 6 | Zod strict mode, pagination caps, query whitelisting |
| **Phase 4** | CRUD Factory | 6 | Pagination format, ownership scoping, lifecycle hooks, audit logging |
| **Emulators** | Firebase Config | 5 | Auth/Firestore connectivity, environment isolation |

**Files:** `sprint0/*.test.js`

**Run:** `npm run test:unit`

---

### Phase 5-11: Feature Implementation

#### Sprint 1: Authentication & Access Control ⚠️

**Status:** 81 tests written, awaiting backend implementation

**Test Coverage:**

| Test Suite | Tests | Coverage Area |
|------------|-------|---------------|
| `authenticationFlow.test.js` | 26 | Registration, login, JWT lifecycle, lockout, token expiration, logout |
| `firebaseSecurityRules.test.js` | 17 | Cross-user access prevention, UID-based scoping, token validation |
| `scenarioVisibility.test.js` | 22 | Public/private filtering, ownership, pagination, sorting |
| `securityHeaders.test.js` | 16 | CORS, CSP, HTTP security headers, debug endpoint enumeration |

**Backend Implementation Required:**

```javascript
// Priority 1 (Blocking)
- [ ] Implement /auth/logout endpoint + token blacklist
- [ ] Update password minLength: 8 → 12 chars
- [ ] Move refresh token to HttpOnly+Secure cookie (remove from JSON)

// Priority 2 (High)
- [ ] Configure CORS (whitelist origins, no wildcards)
- [ ] Add security headers (helmet: nosniff, X-Frame-Options, CSP, Referrer-Policy)
- [ ] Verify JWT exp claim: 15-30 minute window

// Priority 3 (Medium)
- [ ] Add HSTS header for production
- [ ] Implement token refresh rotation
```

**Estimated Implementation Time:** 7-8 hours

**Run:** `npm test -- tests/integration/auth`

---

#### Sprint 2: Domain Features 📋

**Planned Test Suites:**

| Domain | Test Focus | Estimated Tests |
|--------|-----------|-----------------|
| **Satellites** | CRUD operations, admin-only creation, FK validation | 15 |
| **Scenarios** | CRUD, satellite relationships, difficulty/type enums, visibility | 18 |
| **Scenario Steps** | Step ordering, nested routes, progression validation | 12 |
| **Sessions** | Creation, state transitions, step progression, ownership | 16 |
| **Commands** | Registry validation, session context, error tracking | 10 |
| **NOVA AI** | Message persistence, step-aware context, hint delivery | 8 |

**Total Sprint 2:** ~79 additional tests

**Run:** `npm test -- tests/integration/domain`

---

## Security Requirements Coverage

### Current Status Summary

```
✅ Password Security        75%  (min-length tests added; code at 8 chars)
⚠️ Token Security           60%  (exp/logout tests added; rotation pending)
⚠️ Transport Security       33%  (header tests added; HSTS pending)
⚠️ Session Security         67%  (logout tests added; backend missing)
✅ Privacy by Design       100%  (UID scoping, no PII leakage)
✅ Rate Limiting            67%  (login lockout working; per-IP pending)
⚠️ Audit & Logging          67%  (LOGIN events logged; LOGOUT pending)
⚠️ Environment Security     37%  (CORS/headers tests added; HTTPS pending)

Overall Test Coverage: ~80-85% (Backend implementation: ~40-45%)
```

### Critical Security Gaps

**Must Fix Before Production:**

1. **Token Lifecycle**
   - ✅ Tests written for expiration, blacklist, refresh invalidation
   - ❌ Backend: Logout endpoint, blacklist middleware, HttpOnly cookies

2. **Password Policy**
   - ✅ Tests enforce 12-character minimum
   - ⚠️ Backend: Code still at 8 characters (update `passwordValidation.js`)

3. **CORS & Headers**
   - ✅ Tests validate no wildcards, preflight, credentials mode
   - ❌ Backend: Configure CORS middleware, add security headers

4. **Transport Security**
   - ⚠️ Tests check common headers
   - ❌ Backend: Add HSTS, enforce HTTPS redirects

**Implementation Priority:**
1. Logout + blacklist (2 hours)
2. Password policy update (30 minutes)
3. Refresh token → HttpOnly cookie (1 hour)
4. CORS configuration (1 hour)
5. Security headers (1 hour)
6. JWT TTL verification (15 minutes)

---

## Test Patterns & Best Practices

### ✅ DO: Integration Test with Firebase Emulators

```javascript
// tests/integration/auth/registration.test.js
const request = require('supertest');
const app = require('../../../src/app');
const admin = require('firebase-admin');

describe('User Registration', () => {
  let db;

  beforeAll(() => {
    // Emulators auto-configured via setup.js
    db = admin.firestore();
  });

  afterEach(async () => {
    // Clean up test data
    const snapshot = await db.collection('users')
      .where('email', '==', 'test@example.com')
      .get();
    
    for (const doc of snapshot.docs) {
      await doc.ref.delete();
    }
  });

  it('creates user with auto-generated callSign', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'test@example.com',
        password: 'StrongPassword123!'
      });

    expect(res.status).toBe(201);
    expect(res.body.payload.user.callSign).toMatch(/^Pilot\s+\w+$/);
    
    // Verify Firestore persistence
    const userDoc = await db.collection('users')
      .doc(res.body.payload.user.uid)
      .get();
    
    expect(userDoc.exists).toBe(true);
  });
});
```

---

### ✅ DO: Test Response Envelope Consistency

```javascript
// tests/helpers/assertions.js
function expectMissionControlFormat(response) {
  expect(response.body).toMatchObject({
    status: expect.stringMatching(/success|error|hold|abort/i),
    code: expect.any(String),
    payload: expect.any(Object),
    telemetry: expect.objectContaining({
      missionTime: expect.any(String),
      operatorCallSign: expect.any(String),
      stationId: expect.any(String),
      requestId: expect.any(String)
    }),
    timestamp: expect.any(String),
    meta: expect.any(Object)
  });
}

// Usage in tests
it('returns standardized response format', async () => {
  const res = await request(app).get('/api/v1/scenarios');
  expectMissionControlFormat(res);
});
```

---

### ✅ DO: Test Error Cases Thoroughly

```javascript
describe('POST /api/v1/auth/register', () => {
  describe('Success Cases', () => {
    it('registers user with valid data', async () => { /* ... */ });
  });

  describe('Validation Errors', () => {
    it('rejects invalid email format', async () => { /* ... */ });
    it('rejects password under 12 characters', async () => { /* ... */ });
    it('rejects missing required fields', async () => { /* ... */ });
    it('rejects unknown fields (strict mode)', async () => { /* ... */ });
  });

  describe('Business Logic Errors', () => {
    it('prevents duplicate email registration', async () => { /* ... */ });
  });
});
```

---

### ❌ DON'T: Test Implementation Details

```javascript
// ❌ BAD - Tests internal method calls
it('calls userService.getByEmail', () => {
  const spy = jest.spyOn(userService, 'getByEmail');
  // ... test ...
  expect(spy).toHaveBeenCalled();
  // Refactoring breaks this test even if behavior unchanged
});

// ✅ GOOD - Tests observable behavior
it('returns user profile when authenticated', async () => {
  const res = await request(app)
    .get('/api/v1/users/me')
    .set('Authorization', `Bearer ${token}`);

  expect(res.body.payload.email).toBe('test@example.com');
  expect(res.body.payload.uid).toBeDefined();
});
```

---

### ❌ DON'T: Make Tests Interdependent

```javascript
// ❌ BAD - Tests rely on execution order
let userId;
it('1. creates user', async () => {
  const res = await request(app).post('/api/v1/auth/register').send({...});
  userId = res.body.payload.uid; // Shared state!
});

it('2. updates user', async () => {
  await request(app).patch(`/api/v1/users/${userId}`).send({...});
});

// ✅ GOOD - Each test is independent
describe('User CRUD', () => {
  it('creates, reads, and updates user in single test', async () => {
    // Create
    const createRes = await request(app).post('/api/v1/auth/register').send({...});
    const userId = createRes.body.payload.uid;

    // Read
    const getRes = await request(app).get(`/api/v1/users/${userId}`);
    expect(getRes.status).toBe(200);

    // Update
    const updateRes = await request(app).patch(`/api/v1/users/${userId}`);
    expect(updateRes.status).toBe(200);
  });
});
```

---

## Test Utilities

### Authentication Helper

```javascript
// tests/helpers/auth.js
const request = require('supertest');
const app = require('../../src/app');

async function registerTestUser(email = null) {
  const testEmail = email || `test-${Date.now()}@example.com`;
  
  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({
      email: testEmail,
      password: 'TestPassword123!',
      callSign: `TEST-${Date.now()}`
    });

  if (res.status !== 201) {
    throw new Error(`Registration failed: ${JSON.stringify(res.body)}`);
  }

  return {
    user: res.body.payload.user,
    token: res.body.payload.tokens.accessToken,
    email: testEmail
  };
}

module.exports = { registerTestUser };
```

---

### Database Cleanup Helper

```javascript
// tests/helpers/cleanup.js
const admin = require('firebase-admin');

async function cleanupUser(uid) {
  const db = admin.firestore();
  
  // Delete user collections
  const collections = ['users', 'loginAttempts', 'auditLogs'];
  
  for (const collection of collections) {
    const snapshot = await db.collection(collection)
      .where('uid', '==', uid)
      .get();
    
    for (const doc of snapshot.docs) {
      await doc.ref.delete();
    }
  }

  // Delete auth user
  try {
    await admin.auth().deleteUser(uid);
  } catch (error) {
    if (!error.message.includes('No user record found')) {
      throw error;
    }
  }
}

module.exports = { cleanupUser };
```

---

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Backend Tests

on:
  push:
    branches: [main, develop, sprint2tests]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
        working-directory: ./backend
      
      - name: Start Firebase emulators
        run: |
          npm install -g firebase-tools
          firebase emulators:start --only auth,firestore &
          sleep 10
        working-directory: ./backend
      
      - name: Run unit tests
        run: npm run test:unit
        working-directory: ./backend
        env:
          NODE_ENV: test
      
      - name: Run integration tests
        run: npm run test:integration
        working-directory: ./backend
        env:
          NODE_ENV: test
          FIREBASE_AUTH_EMULATOR_HOST: localhost:9099
          FIRESTORE_EMULATOR_HOST: localhost:8080
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./backend/coverage/lcov.info
          flags: backend
```

---

## Next Steps & Roadmap

### Immediate (Week 1)
- [ ] Run Sprint 1 tests: `npm test -- tests/integration/auth`
- [ ] Document failing tests and root causes
- [ ] Implement logout endpoint + blacklist middleware
- [ ] Update password policy to 12 characters minimum
- [ ] Configure CORS and security headers

### Short-term (Weeks 2-4)
- [ ] Complete all Sprint 1 backend implementations
- [ ] Achieve 80%+ test pass rate on Sprint 1
- [ ] Add Sprint 2 domain tests (satellites, scenarios, sessions)
- [ ] Implement refresh token rotation

### Ongoing
- [ ] Maintain test coverage above 70%
- [ ] Add E2E tests for critical user journeys
- [ ] Monitor test execution times and optimize slow tests
- [ ] Update security requirements as threats evolve

---

## Resources

- **Test Organization:** [README.md](./README.md)
- **Sprint 0 Tests:** [sprint0.md](./sprint0.md)
- **Sprint 1 Tests:** [sprint1.md](./sprint1.md)
- **Security Coverage:** [SECURITY_COVERAGE_ANALYSIS.md](./SECURITY_COVERAGE_ANALYSIS.md)
- **Implementation Guide:** [IMPLEMENTATION_ROADMAP.md](./IMPLEMENTATION_ROADMAP.md)
- **Requirements Checklist:** [SECURITY_REQUIREMENTS_CHECKLIST_UPDATED.md](./SECURITY_REQUIREMENTS_CHECKLIST_UPDATED.md)

---

**Document Status:** Living Document - Update as phases complete  
**Maintainer:** Backend Team  
**Review Cycle:** Each sprint retrospective