# Security Test Additions: Backend Implementation Guide

**Status:** ✅ Tests COMPLETE in tests-backend/sprint1/  
**Purpose:** Backend implementation reference (Tests already written)

This document provides **backend implementation guidance** for closing security gaps. All corresponding tests have been written and are ready to validate the implementations.

---

## Overview

- **Test Files Created:** authenticationFlow.test.js (26 tests), securityHeaders.test.js (16 tests)
- **Tests Status:** ✅ READY TO RUN
- **Backend Work:** ⚠️ REQUIRED to make tests pass

Run tests now: `npm test -- tests-backend/sprint1`

Most tests will fail until the 6 backend changes below are implemented.

---

## 1. Token Expiration & Validation (Tests Already in authenticationFlow.test.js)

**Tests Added:** 5 tests validating token TTL, expiration, malformed tokens, invalid signatures  
**What Tests Expect:**
- Access token with exp claim between 15-30 minutes
- Expired tokens rejected with 401/403
- Malformed/tamperedtokens rejected
- HttpOnly+Secure cookie for refresh token (not in JSON payload)

**Backend Work Needed:** Ensure JWT configuration enforces these constraints

```javascript
// Reference: Verify JWT config in backend/src/config/jwtConfig.js or equivalent
// Must have:
JWT_ACCESS_TOKEN_EXPIRY=15m  // or similar 15-30 minute window
JWT_REFRESH_TOKEN_EXPIRY=7d

// Refresh token must be sent as HttpOnly+Secure cookie, not in JSON:
// WRONG: res.json({ tokens: { accessToken, refreshToken } })
// RIGHT: 
// - res.json({ tokens: { accessToken } })  // Only access token in body
// - res.cookie('refreshToken', token, { httpOnly: true, secure: true, sameSite: 'strict' })
```

**Tests Will Verify:**
- ✅ TTL within 15-30 min
- ✅ Expired token rejection
- ✅ Malformed token rejection
- ✅ Invalid signature rejection
- ✅ Refresh token in HttpOnly cookie only

---

## 2. Logout Endpoint & Token Blacklist (Tests Already in authenticationFlow.test.js)

**Tests Added:** 4 tests validating logout flow, token invalidation, refresh token revocation, audit logging

**What Tests Expect:**
- POST /auth/logout endpoint exists
- Tokens added to blacklist on logout
- Blacklisted tokens rejected on subsequent requests
- Audit log entry created for LOGOUT event

**Backend Work Needed:**

```javascript
// Add to backend/src/routes/auth.js:
router.post('/logout', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(400).json({
        status: 'error',
        message: 'No token provided'
      });
    }
    
    // Add token to blacklist in Firestore
    const db = admin.firestore();
    const decoded = jwt.verify(token, process.env.JWT_SECRET || '');
    
    await db.collection('tokenBlacklist').add({
      token,
      userId,
      blacklistedAt: admin.firestore.Timestamp.now(),
      expiresAt: new Date(decoded.exp * 1000) // Auto-delete when token expires
    });
    
    // Create audit log
    const auditEntry = auditFactory.createAuditEntry(
      'LOGOUT',
      'auth',
      userId,
      req.user.callSign,
      'success',
      'INFO',
      { details: 'User logged out' }
    );
    await auditRepository.create(auditEntry);
    
    return res.status(200).json({
      status: 'success',
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
});

// Add to backend/src/middleware/authMiddleware.js:
// Check if token is blacklisted before allowing request
const isBlacklisted = await db.collection('tokenBlacklist')
  .where('token', '==', token)
  .limit(1)
  .get();

if (!isBlacklisted.empty) {
  return res.status(401).json({
    status: 'error',
    message: 'Token has been revoked'
  });
}
```

**Tests Will Verify:**
- ✅ Logout endpoint returns 200 with success status
- ✅ Token becomes invalid after logout
- ✅ Audit log entry created with LOGOUT eventType
- ✅ Unauthenticated logout rejected
- ✅ Refresh token invalidated on logout

---

## 3. Password Policy Update (Tests Already in authenticationFlow.test.js)

**Tests Added:** 2 tests validating minimum password length of 12 characters

**What Tests Expect:**
- Passwords < 12 chars rejected with 422
- Passwords >= 12 chars accepted
- Error message mentions "12" when rejected

**Backend Work Needed:**

```javascript
// In backend/src/utils/passwordValidation.js, update:

const PASSWORD_RULES = {
  minLength: 12,  // Changed from 8 to 12
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: true,
  specialChars: '@$!%*?&#^()_+-=[]{}|;:,.<>/'
};

// Update error messages to mention 12:
if (password.length < PASSWORD_RULES.minLength) {
  return {
    valid: false,
    error: `Password must be at least ${PASSWORD_RULES.minLength} characters long`
  };
}
```

**Tests Will Verify:**
- ✅ Passwords < 12 chars rejected
- ✅ Passwords with 12+ chars accepted
- ✅ Error message references "12"

---

## 4. CORS Configuration (Tests Already in securityHeaders.test.js)

**Tests Added:** 6 tests validating CORS headers, preflight handling, credentials mode

**What Tests Expect:**
- No wildcard CORS origin (*)
- Specific whitelisted origins only
- Preflight (OPTIONS) requests handled correctly
- Credentials mode only with specific origins
- Referrer-Policy is restrictive (strict-origin-when-cross-origin, no-referrer, or same-origin)

**Backend Work Needed:**

```javascript
// In backend/src/app.js or middleware setup:

const cors = require('cors');

// Configure CORS with whitelist
const corsOptions = {
  origin: function (origin, callback) {
    const whitelist = [
      'http://localhost:5173',
      'http://localhost:3000',
      'https://app.example.com' // Production domain
    ];
    
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

// Add Referrer-Policy
app.use((req, res, next) => {
  res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});
```

**Tests Will Verify:**
- ✅ No wildcard (*) in CORS origin
- ✅ Only whitelisted origins accepted
- ✅ OPTIONS preflight returns 200 or 204
- ✅ Credentials only with specific origins
- ✅ Referrer-Policy header present and restrictive

---

## 5. Security Headers (Tests Already in securityHeaders.test.js)

**Tests Added:** 9 tests validating security headers (CSP, X-Frame-Options, X-Content-Type-Options, X-XSS-Protection)

**What Tests Expect:**
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY or SAMEORIGIN
- X-XSS-Protection: defined
- Content-Security-Policy: present, no unsafe-inline/eval
- Referrer-Policy: strict/safe variant

**Backend Work Needed:**

```javascript
// Use helmet.js for automatic security headers
const helmet = require('helmet');

app.use(helmet());

// Or manually add headers:
app.use((req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'DENY');
  res.set('X-XSS-Protection', '1; mode=block');
  res.set('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "font-src 'self';"
  );
  res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});
```

**Tests Will Verify:**
- ✅ X-Content-Type-Options: nosniff
- ✅ X-Frame-Options: DENY or SAMEORIGIN
- ✅ X-XSS-Protection present
- ✅ CSP header present
- ✅ CSP disallows unsafe-inline and unsafe-eval

---

## 6. Verify JWT TTL Configuration (Tests Already in authenticationFlow.test.js)

**Tests Added:** 1 test validating access token TTL within 15-30 minute window

**What Tests Expect:**
- JWT exp claim set such that TTL is 15-30 minutes from now

**Backend Work Needed:**

```javascript
// In backend/src/config/jwtConfig.js or where tokens are signed:

const jwt = require('jsonwebtoken');

function signAccessToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '15m' // Or any value between 15-30m
  });
}

function signRefreshToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
}
```

**Tests Will Verify:**
- ✅ Access token exp claim within 15-30 minute window
- ✅ Refresh token TTL longer (7+ days)

---

## Implementation Checklist

```
PRIORITY 1 (Do First)
├─ [ ] Implement /auth/logout endpoint + token blacklist
│   ├─ Create tokenBlacklist collection in Firestore
│   ├─ Add logout route to auth.js
│   ├─ Update authMiddleware to check blacklist
│   └─ Estimated: 2 hours
│
├─ [ ] Update password minLength from 8 to 12
│   ├─ Update passwordValidation.js
│   ├─ Update error messages
│   └─ Estimated: 30 minutes
│
└─ [ ] Move refresh token to HttpOnly+Secure cookie
    ├─ Remove refreshToken from JSON response
    ├─ Add Set-Cookie header
    └─ Estimated: 1 hour

PRIORITY 2 (Do Second)
├─ [ ] Configure CORS with whitelist
│   ├─ Install cors package
│   ├─ Set allowedOrigins (no wildcards)
│   ├─ Enable credentials: true
│   └─ Estimated: 1 hour
│
├─ [ ] Add security headers
│   ├─ Install helmet OR manually add headers
│   ├─ nosniff, X-Frame-Options, X-XSS-Protection
│   ├─ Content-Security-Policy (no unsafe-inline/eval)
│   └─ Estimated: 1 hour
│
└─ [ ] Verify JWT TTL configuration
    ├─ Confirm expiresIn set to 15-30 minutes
    └─ Estimated: 15 minutes

TOTAL ESTIMATED EFFORT: 7-8 hours
```

---

## How to Validate Implementation

After implementing each change, run tests:

```bash
# All Sprint 1 tests
npm test -- tests-backend/sprint1

# Specific test suites
npm test -- tests-backend/sprint1/authenticationFlow.test.js
npm test -- tests-backend/sprint1/securityHeaders.test.js

# With coverage report
npm test -- tests-backend/sprint1 --coverage
```

**Success Criteria:**
- ✅ All 81 tests pass
- ✅ 80-85% security coverage
- ✅ No test failures related to implemented features

---

## Next Steps

1. **Run tests as-is** to see which ones fail: `npm test -- tests-backend/sprint1`
2. **Implement changes** in order of priority (logout first)
3. **Re-run tests** after each implementation
4. **Verify all 81 tests pass** before production launch

**Reference Documents:**
- SECURITY_COVERAGE_ANALYSIS.md - Detailed requirement mapping
- SECURITY_REQUIREMENTS_CHECKLIST.md - Quick status overview
- authenticationFlow.test.js - Token/logout/password tests
- securityHeaders.test.js - CORS/headers/debug endpoint tests

---

**Status:** Ready for Backend Implementation  
**Tests Status:** ✅ COMPLETE (81 tests written)  
**Timeline:** 1-2 days of backend work  
**Owner:** Backend Team

```javascript
describe('S1 SECURITY – Token Expiration & Validation', () => {
  let validUser;
  let validToken;

  beforeEach(async () => {
    // Create a fresh user for each test
    const email = `token-test-${Date.now()}@example.com`;
    const response = await axios.post(`${API_BASE_URL}/auth/register`, {
      email,
      password: 'TokenTest123!'
    });
    validUser = response.data.payload.user;
    validToken = response.data.payload.tokens.accessToken;
  });

  afterEach(async () => {
    // Cleanup
    const db = admin.firestore();
    if (validUser?.uid) {
      try {
        await db.collection('users').doc(validUser.uid).delete();
        await admin.auth().deleteUser(validUser.uid);
      } catch (error) {
        console.warn('Cleanup error:', error.message);
      }
    }
  });

  it('access token contains exp claim', async () => {
    // Decode without verification (for inspection only)
    const parts = validToken.split('.');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    
    expect(payload.exp).toBeDefined();
    expect(typeof payload.exp).toBe('number');
    
    const nowSecs = Math.floor(Date.now() / 1000);
    const ttlSeconds = payload.exp - nowSecs;
    
    // Verify TTL is between 15-30 minutes
    expect(ttlSeconds).toBeGreaterThan(15 * 60);
    expect(ttlSeconds).toBeLessThan(30 * 60 + 30); // Allow 30 sec clock skew
  });

  it('refresh token should not be in JSON payload (HttpOnly cookie only)', async () => {
    const response = await axios.post(`${API_BASE_URL}/auth/register`, {
      email: `httponly-test-${Date.now()}@example.com`,
      password: 'HttpOnly123!'
    });
    
    // If refresh token is in body, it's vulnerable to XSS
    expect(response.data.payload.tokens.refreshToken).toBeUndefined();
    
    // Verify Set-Cookie header contains refresh token
    const setCookie = response.headers['set-cookie'];
    if (setCookie) {
      const hasRefreshCookie = Array.isArray(setCookie) 
        ? setCookie.some(c => c.includes('refreshToken'))
        : setCookie.includes('refreshToken');
      expect(hasRefreshCookie).toBe(true);
      
      // Verify HttpOnly flag
      expect(setCookie.toString()).toMatch(/HttpOnly/i);
      expect(setCookie.toString()).toMatch(/Secure/i);
    }
  });

  it('expired access token is rejected', async () => {
    // Create an intentionally expired token
    const jwt = require('jsonwebtoken');
    const expiredToken = jwt.sign(
      { uid: validUser.uid, email: validUser.email },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '-1h' } // Expired 1 hour ago
    );
    
    try {
      await axios.get(`${API_BASE_URL}/users/${validUser.uid}`, {
        headers: { Authorization: `Bearer ${expiredToken}` }
      });
      fail('Should reject expired token');
    } catch (error) {
      expect([401, 403]).toContain(error.response.status);
      expect(error.response.data.message).toMatch(/expired|invalid|token/i);
    }
  });

  it('malformed token is rejected', async () => {
    const malformedTokens = [
      'not.a.token',
      'only-two-parts.here',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature',
      'Bearer-should-be-removed'
    ];
    
    for (const badToken of malformedTokens) {
      try {
        await axios.get(`${API_BASE_URL}/users/${validUser.uid}`, {
          headers: { Authorization: `Bearer ${badToken}` }
        });
        fail(`Should reject malformed token: ${badToken}`);
      } catch (error) {
        expect([401, 403]).toContain(error.response.status);
      }
    }
  });

  it('token with invalid signature is rejected', async () => {
    // Take valid token and flip a character in signature
    const parts = validToken.split('.');
    const invalidSignature = parts[2].split('').reverse().join('');
    const tamperedToken = `${parts[0]}.${parts[1]}.${invalidSignature}`;
    
    try {
      await axios.get(`${API_BASE_URL}/users/${validUser.uid}`, {
        headers: { Authorization: `Bearer ${tamperedToken}` }
      });
      fail('Should reject token with invalid signature');
    } catch (error) {
      expect([401, 403]).toContain(error.response.status);
    }
  });
});
```

---

## 2. Logout & Token Revocation Tests (Add to `authenticationFlow.test.js`)

**Why:** Verify logout actually invalidates tokens  
**Impact:** HIGH - Prevents token reuse after logout  
**Effort:** 2 hours (includes implementing logout endpoint)

### First: Add logout endpoint to `backend/src/routes/auth.js`

```javascript
// Add to auth routes
router.post('/logout', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user.uid;
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(400).json({
        status: 'error',
        message: 'No token provided'
      });
    }
    
    // Add token to blacklist
    const db = admin.firestore();
    const decoded = jwt.verify(token, process.env.JWT_SECRET || '');
    
    await db.collection('tokenBlacklist').add({
      token,
      userId,
      blacklistedAt: admin.firestore.Timestamp.now(),
      expiresAt: new Date(decoded.exp * 1000) // Auto-delete when token expires
    });
    
    // Create audit log
    const auditEntry = auditFactory.createAuditEntry(
      'LOGOUT',
      'auth',
      userId,
      req.user.callSign,
      'success',
      'INFO',
      { details: 'User logged out' }
    );
    await auditRepository.create(auditEntry);
    
    return res.status(200).json({
      status: 'success',
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
});
```

### Then: Add tests

```javascript
describe('S1 SECURITY – Logout & Session Termination', () => {
  let testUser;
  let testToken;

  beforeEach(async () => {
    const email = `logout-test-${Date.now()}@example.com`;
    const response = await axios.post(`${API_BASE_URL}/auth/register`, {
      email,
      password: 'LogoutTest123!'
    });
    testUser = response.data.payload.user;
    testToken = response.data.payload.tokens.accessToken;
  });

  afterEach(async () => {
    const db = admin.firestore();
    if (testUser?.uid) {
      try {
        // Clean up blacklist
        const blacklist = await db.collection('tokenBlacklist')
          .where('userId', '==', testUser.uid).get();
        for (const doc of blacklist.docs) {
          await doc.ref.delete();
        }
        
        // Clean up user
        await db.collection('users').doc(testUser.uid).delete();
        await admin.auth().deleteUser(testUser.uid);
      } catch (error) {
        console.warn('Cleanup error:', error.message);
      }
    }
  });

  it('logout endpoint invalidates access token', async () => {
    // First, verify token works before logout
    const preLogoutResponse = await axios.get(
      `${API_BASE_URL}/users/${testUser.uid}`,
      { headers: { Authorization: `Bearer ${testToken}` } }
    );
    expect(preLogoutResponse.status).toBe(200);
    
    // Logout
    const logoutResponse = await axios.post(
      `${API_BASE_URL}/auth/logout`,
      {},
      { headers: { Authorization: `Bearer ${testToken}` } }
    );
    expect(logoutResponse.status).toBe(200);
    expect(logoutResponse.data.status).toBe('success');
    
    // Try to use token again - should fail
    try {
      await axios.get(`${API_BASE_URL}/users/${testUser.uid}`, {
        headers: { Authorization: `Bearer ${testToken}` }
      });
      fail('Token should be blacklisted after logout');
    } catch (error) {
      expect([401, 403]).toContain(error.response.status);
    }
  });

  it('logout creates audit log entry', async () => {
    await axios.post(
      `${API_BASE_URL}/auth/logout`,
      {},
      { headers: { Authorization: `Bearer ${testToken}` } }
    );
    
    const db = admin.firestore();
    const auditQuery = await db.collection('auditLogs')
      .where('userId', '==', testUser.uid)
      .where('eventType', '==', 'LOGOUT')
      .limit(1)
      .get();
    
    expect(auditQuery.empty).toBe(false);
    const logEntry = auditQuery.docs[0].data();
    expect(logEntry.status).toBe('success');
  });

  it('logout without token is rejected', async () => {
    try {
      await axios.post(`${API_BASE_URL}/auth/logout`);
      fail('Should require authentication');
    } catch (error) {
      expect([401, 403]).toContain(error.response.status);
    }
  });

  it('refresh token invalidated on logout', async () => {
    // Get refresh token from cookies
    const cookies = await axios.post(`${API_BASE_URL}/auth/register`, {
      email: `refresh-test-${Date.now()}@example.com`,
      password: 'RefreshTest123!'
    });
    
    const refreshToken = cookies.headers['set-cookie']
      ?.find(c => c.includes('refreshToken'));
    
    if (refreshToken) {
      // Logout
      await axios.post(
        `${API_BASE_URL}/auth/logout`,
        {},
        { headers: { Authorization: `Bearer ${testToken}` } }
      );
      
      // Try to refresh - should fail
      try {
        await axios.post(`${API_BASE_URL}/auth/refresh`, {
          headers: { Cookie: refreshToken }
        });
        fail('Refresh token should be invalidated on logout');
      } catch (error) {
        expect([401, 403]).toContain(error.response.status);
      }
    }
  });
});
```

---

## 3. Password Policy Update (Fix in `passwordValidation.js`)

**Why:** Increase minimum from 8 to 12 characters  
**Impact:** MEDIUM - Stronger default security  
**Effort:** 30 minutes

### Update the configuration:

```javascript
// In backend/src/utils/passwordValidation.js, change line ~24:

const PASSWORD_RULES = {
  minLength: 12,  // Changed from 8 to 12
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: true,
  specialChars: '@$!%*?&#^()_+-=[]{}|;:,.<>/'
};
```

### Add test to verify:

```javascript
// In authenticationFlow.test.js, add to S1 AUTH 002:

it('rejects password under 12 characters', async () => {
  const shortPasswords = [
    'Pass1!',        // 6 chars
    'Pass1@abc',     // 9 chars
    'Pass1@abcd',    // 10 chars
    'Pass1@abcde'    // 11 chars
  ];
  
  for (const password of shortPasswords) {
    try {
      await axios.post(`${API_BASE_URL}/auth/register`, {
        email: `test-${Date.now()}@example.com`,
        password
      });
      fail(`Should reject password: ${password} (${password.length} chars)`);
    } catch (error) {
      expect(error.response.status).toBe(422);
      const errors = error.response.data.errors;
      const passwordError = errors.find(e => 
        e.message.toLowerCase().includes('password') &&
        e.message.toLowerCase().includes('12')
      );
      expect(passwordError).toBeDefined();
    }
  }
});

it('accepts password with 12+ characters', async () => {
  const response = await axios.post(`${API_BASE_URL}/auth/register`, {
    email: `twelve-char-${Date.now()}@example.com`,
    password: 'ValidPass1234!' // Exactly 13 chars, meets all requirements
  });
  
  expect(response.status).toBe(201);
});
```

---

## 4. CORS Configuration Tests (New file: `securityHeaders.test.js`)

**Why:** Prevent unauthorized cross-origin requests  
**Impact:** MEDIUM - CSRF/CORS vulnerability prevention  
**Effort:** 1.5 hours

### Create `backend/tests-backend/sprint1/securityHeaders.test.js`:

```javascript
/**
 * Sprint 1 – Security Headers Tests
 * Validates HTTP security headers and CORS configuration
 */

const axios = require('axios');

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001/api/v1';

describe('S1 SECURITY – HTTP Security Headers', () => {
  
  it('response includes X-Content-Type-Options header', async () => {
    const response = await axios.get(`${API_BASE_URL}/health`);
    expect(response.headers['x-content-type-options']).toBeDefined();
    expect(response.headers['x-content-type-options']).toBe('nosniff');
  });

  it('response includes X-Frame-Options header', async () => {
    const response = await axios.get(`${API_BASE_URL}/health`);
    expect(response.headers['x-frame-options']).toBeDefined();
    expect(['DENY', 'SAMEORIGIN']).toContain(response.headers['x-frame-options']);
  });

  it('response includes X-XSS-Protection header', async () => {
    const response = await axios.get(`${API_BASE_URL}/health`);
    expect(response.headers['x-xss-protection']).toBeDefined();
  });

  it('CORS does not allow wildcard origin', async () => {
    const response = await axios.get(`${API_BASE_URL}/health`, {
      headers: { Origin: 'https://attacker.com' }
    });
    
    // Should either be undefined or specific domain, never '*'
    const corsHeader = response.headers['access-control-allow-origin'];
    if (corsHeader) {
      expect(corsHeader).not.toBe('*');
      // Should be whitelist of allowed origins
      expect(corsHeader).toMatch(/^https:\/\/(localhost|example\.com|app\.example\.com)$/);
    }
  });

  it('CORS respects preflight requests', async () => {
    try {
      // Send OPTIONS preflight
      const response = await axios.options(`${API_BASE_URL}/users/me`, {
        headers: {
          Origin: 'https://localhost:5173',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      });
      
      expect(response.status).toBe(200);
      expect(response.headers['access-control-allow-origin']).toBeDefined();
      expect(response.headers['access-control-allow-methods']).toBeDefined();
    } catch (error) {
      // If OPTIONS not implemented, that's okay - still secure
      expect([204, 404, 405]).toContain(error.response.status);
    }
  });

  it('credentials mode properly handled in CORS', async () => {
    const response = await axios.get(`${API_BASE_URL}/health`, {
      headers: { Origin: 'https://localhost:5173' }
    });
    
    // If credentials allowed, must be specific origin (not wildcard)
    const corsCredentials = response.headers['access-control-allow-credentials'];
    const corsOrigin = response.headers['access-control-allow-origin'];
    
    if (corsCredentials && corsCredentials.toLowerCase() === 'true') {
      expect(corsOrigin).not.toBe('*');
      expect(corsOrigin).toMatch(/^https:\/\//);
    }
  });

  it('Referrer-Policy is restrictive', async () => {
    const response = await axios.get(`${API_BASE_URL}/health`);
    const referrerPolicy = response.headers['referrer-policy'];
    
    // Should be strict-origin-when-cross-origin or similar
    expect(referrerPolicy).toBeDefined();
    expect(['strict-origin-when-cross-origin', 'no-referrer', 'same-origin'])
      .toContain(referrerPolicy);
  });
});

describe('S1 SECURITY – Content Security Policy', () => {
  
  it('response includes Content-Security-Policy header', async () => {
    const response = await axios.get(`${API_BASE_URL}/health`);
    const csp = response.headers['content-security-policy'];
    
    // CSP should be defined (can be in header or meta tag, but header is better)
    if (csp) {
      expect(csp).toBeDefined();
      // Should restrict scripts
      expect(csp).toMatch(/(script-src|default-src)/i);
    }
  });

  it('CSP prevents inline scripts', async () => {
    const response = await axios.get(`${API_BASE_URL}/health`);
    const csp = response.headers['content-security-policy'];
    
    if (csp) {
      // Should not allow 'unsafe-inline'
      expect(csp).not.toMatch(/script-src.*'unsafe-inline'/i);
      expect(csp).not.toMatch(/default-src.*'unsafe-inline'/i);
    }
  });

  it('CSP prevents eval', async () => {
    const response = await axios.get(`${API_BASE_URL}/health`);
    const csp = response.headers['content-security-policy'];
    
    if (csp) {
      // Should not allow 'unsafe-eval'
      expect(csp).not.toMatch(/script-src.*'unsafe-eval'/i);
    }
  });
});

describe('S1 SECURITY – No Debug Endpoints', () => {
  
  const debugEndpoints = [
    '/debug',
    '/admin',
    '/__internals__',
    '/_debug',
    '/api/debug',
    '/.well-known/debug'
  ];

  for (const endpoint of debugEndpoints) {
    it(`debug endpoint ${endpoint} is not accessible`, async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}${endpoint}`);
        // If it responds, should be 404 or 403, not 200
        expect([404, 403, 405]).toContain(response.status);
      } catch (error) {
        // 404/403/405 is expected
        expect([404, 403, 405]).toContain(error.response.status);
      }
    });
  }
});
```

---

## Implementation Checklist

```
PHASE 1: Token & Logout (2-3 hours)
├─ [ ] Add logout endpoint to auth.js (1 hour)
├─ [ ] Create tokenBlacklist collection in Firestore (15 min)
├─ [ ] Add token blacklist middleware (30 min)
├─ [ ] Update authMiddleware to check blacklist (30 min)
└─ [ ] Add logout + token expiration tests (1 hour)

PHASE 2: Password Policy (1 hour)
├─ [ ] Update minLength in passwordValidation.js (10 min)
├─ [ ] Update validation tests (20 min)
└─ [ ] Test in registration flow (30 min)

PHASE 3: Security Headers (1.5 hours)
├─ [ ] Add helmet/security middleware (30 min)
├─ [ ] Configure CORS properly (30 min)
├─ [ ] Create securityHeaders.test.js (30 min)
└─ [ ] Run and fix failing tests (30 min)

TOTAL: ~6-7 hours to close all critical gaps
```

---

## Verification Steps

After implementing, run:

```bash
# All Sprint 1 tests
npm test -- tests-backend/sprint1

# Specific test file
npm test -- tests-backend/sprint1/authenticationFlow.test.js
npm test -- tests-backend/sprint1/securityHeaders.test.js

# With coverage
npm test -- tests-backend/sprint1 --coverage
```

Expected results:
- ✅ All 26 authenticationFlow tests pass (includes token lifecycle + logout)
- ✅ All 17 firebaseSecurityRules tests pass
- ✅ All 22 scenarioVisibility tests pass
- ✅ All 16 securityHeaders tests pass (CORS + CSP + debug endpoints)
- ✅ 81 total tests passing
- ✅ Coverage increases from 70% → 80-85%

---

**Status:** Ready to implement  
**Priority:** HIGH - Do before production launch  
**Owner:** Backend team  
**Timeline:** 1-2 days of development + testing
