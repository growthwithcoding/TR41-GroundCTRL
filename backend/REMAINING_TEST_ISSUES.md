# Remaining Test Issues

## Critical Issues (Blocking Most Tests)

### 1. Registration Endpoint 500 Errors
**Status:** ❌ BLOCKER  
**Affected Tests:** 87 tests failing

**Root Cause:**
The `/auth/register` endpoint returns 500 errors. Most likely causes:
1. Missing `FIREBASE_WEB_API_KEY` environment variable (needed for password verification in authService)
2. Firebase Auth emulator may not support the Identity Toolkit API calls
3. Error in authService.register() implementation

**Fix Required:**
```javascript
// In authService.js - verifyPassword() function uses:
// https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword
// This won't work with emulators without proper configuration
```

**Environment Variable Needed:**
```bash
FIREBASE_WEB_API_KEY=<your-firebase-web-api-key>
```

---

### 2. Security Headers Not Appearing in Response
**Status:** ❌ FAILING  
**Affected Tests:** 6 tests in securityHeaders.test.js

**Issue:**
Despite helmet configuration in app.js, headers are undefined in axios responses:
- `x-content-type-options`: undefined
- `x-frame-options`: undefined  
- `x-xss-protection`: undefined
- `referrer-policy`: undefined

**Possible Causes:**
1. Helmet v8.1.0 changed default behavior
2. Headers may need to be explicitly enabled
3. Test axios client may not be receiving headers

**Current Helmet Config:**
```javascript
app.use(helmet({
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xContentTypeOptions: 'nosniff',
  xFrameOptions: { action: 'SAMEORIGIN' }
}));
```

**Investigation Needed:**
- Check if helmet v8 requires different configuration
- Verify axios receives all response headers
- Test headers with curl/postman to confirm they're being set

---

### 3. Validation Errors Return 400 Instead of 422
**Status:** ❌ FAILING  
**Affected Tests:** 4 tests in authenticationFlow.test.js

**Issue:**
Tests expect HTTP 422 (Unprocessable Entity) for validation errors, but receiving 400 (Bad Request).

**Root Cause:**
The ValidationError class correctly sets status to 422 (UNPROCESSABLE_ENTITY), but somewhere in the middleware chain it's being changed to 400.

**Check:**
1. Zod validation in authSchemas.js
2. validate.js middleware
3. Error handler middleware chain

---

## Medium Priority Issues

### 4. Pagination Limit Not Capped at 100
**Status:** ❌ FAILING  
**Test:** Phase 3 – Validation Layer

**Issue:**
```javascript
const result1 = await userRepository.getAll({ page: 1, limit: 500 });
expect(result1.limit).toBeLessThanOrEqual(100); // FAILS - returns 500
```

**Fix Required:**
In userRepository.getAll(), add:
```javascript
const {
  page = 1,
  limit = 10,
  // ... other options
} = options;

// Cap limit at MAX_PAGE_LIMIT
const cappedLimit = Math.min(limit, 100);
```

---

### 5. Scenario Schema Validation Failure
**Status:** ❌ FAILING  
**Test:** Phase 3 – Validation Layer

**Issue:**
```javascript
const validQuery = { sortBy: 'createdAt', page: 1, limit: 10 };
const validResult = scenarioSchemas.listScenariosSchema.safeParse(validQuery);
expect(validResult.success).toBe(true); // FAILS
```

**Fix Required:**
Check scenarioSchemas.js - ensure listScenariosSchema allows 'createdAt' as a valid sortBy field.

---

### 6. CRUD Factory Hooks Not Being Called
**Status:** ❌ FAILING  
**Tests:** 3 tests in backendPhase4CRUDFactory.test.js

**Issues:**
- afterDelete hook not called
- auditRepository.logAudit not called
- mockRes.json not called

**Investigation Needed:**
Check crudFactory.js implementation - hooks and audit logging may not be properly integrated.

---

### 7. Audit Entry Structure Mismatch
**Status:** ❌ FAILING  
**Test:** Phase 1 – Identity Enforcement

**Issue:**
```javascript
expect(auditEntry.userId).toBe("uid-string"); 
// FAILS - receives { userId: "uid-string" }
```

**Fix Required:**
The test expects auditEntry to be the object directly, but it's wrapped. Check how auditRepository.logAudit returns data.

---

### 8. Auth Error Normalizer Import Issue
**Status:** ❌ FAILING  
**Test:** Phase 2 – Security Quick Wins

**Issue:**
```javascript
expect(typeof authErrorNormalizer).toBe('function');
// FAILS - receives "undefined"
```

**Fix Required:**
The test imports authErrorNormalizer incorrectly. Check export in authErrorNormalizer.js:
```javascript
module.exports = authErrorNormalizer; // Correct
// vs
module.exports = { authErrorNormalizer }; // Would require destructuring
```

---

## Test Score Summary

**Total Tests:** 115
**Passing:** 28 (24%)
**Failing:** 87 (76%)

**By Suite:**
- ❌ authenticationFlow.test.js: 0/29 passing
- ❌ firebaseSecurityRules.test.js: 0/18 passing  
- ❌ scenarioVisibility.test.js: 0/25 passing
- ⚠️  backendPhase1IdentityEnforcement.test.js: 4/6 passing
- ⚠️  backendPhase2SecurityQuickWins.test.js: 7/9 passing
- ⚠️  backendPhase3ValidationLayer.test.js: 10/12 passing
- ⚠️  backendPhase4CRUDFactory.test.js: 4/7 passing
- ❌ firebaseEmulator.test.js: 2/3 passing
- ❌ securityHeaders.test.js: 1/7 passing

---

## Priority Action Plan

### Immediate (Blocker):
1. **Fix registration 500 errors**
   - Add FIREBASE_WEB_API_KEY to environment
   - Or modify authService to work with emulators without Identity Toolkit
   
2. **Fix helmet security headers**
   - Update helmet configuration
   - Test with curl to verify headers are set

### High Priority:
3. **Fix validation status codes** (400 → 422)
4. **Fix pagination limit capping**
5. **Fix scenario schema validation**

### Medium Priority:
6. Fix CRUD factory hooks
7. Fix audit entry structure
8. Fix authErrorNormalizer import

---

## Notes

- The Firebase CLI authentication warning is harmless and doesn't affect tests
- All infrastructure fixes (EADDRINUSE, dynamic ports, etc.) are working correctly
- The remaining failures are implementation bugs, not test infrastructure issues
