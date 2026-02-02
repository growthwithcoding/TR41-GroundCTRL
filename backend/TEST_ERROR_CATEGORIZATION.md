# Test Errors Summary - Categorized & Actionable

## Quick Stats
- **Total Test Suites:** 51
- **Passing Suites:** 37+ (after import fixes)
- **Failing Suites:** 14 (was 16, now 14 after fixes)
- **Total Tests:** 422
- **Passing Tests:** 404+ (was 390, now 404+)
- **Failing Tests:** 18 (was 32, now 18 after fixes)

## Error Categories & Root Causes

### 1. ✅ FIXED: Module Import Path Issues (10 tests fixed)
**Status:** RESOLVED
- authErrorNormalizer: Import path corrected from ../../ to ../../../
- satelliteSchemas: Import path corrected from ../../ to ../../../
- **Tests Now Passing:** 10 additional tests

### 2. ❌ PORT BINDING ISSUES (10 tests failing)
**Affected Tests:** 
- tests/security/rate-limit/global-window-reset.test.js (3 failures)
- tests/security/rate-limit/login-composite-key.test.js (2 failures)
- tests/security/rate-limit/rate-limit-memory-leak.test.js (1 failure)
- tests/security/rate-limit/help-ai-strict-limit.test.js (3 failures)
- tests/security/audit/audit-anonymous.test.js (6 failures - but only when rate-limit tests run first)

**Error Pattern:** `connect EADDRINUSE 127.0.0.1:PORT_NUMBER`
- Different ports (52485, 52499, 56677, 52320, 63443, etc.)
- Happens after 2-3 tests in same file complete
- Suggests socket/server not being cleaned up between tests

**Investigation Needed:**
1. Check if Socket.IO is leaving connections open
2. Verify afterAll() cleanup in rate-limit and audit tests
3. Check if app initialization has side effects creating listeners
4. Verify test isolation in test-utils.js getTestApp()

**Potential Solutions:**
- Add explicit port cleanup in afterAll hooks
- Mock Socket.IO connections in tests
- Use dynamic ports instead of fixed ports
- Add test isolation delays

### 3. ❌ MISSING RESPONSE HEADERS (8 tests failing)
**Status:** Test assertions expect headers app doesn't send

**Tests & Expected Headers:**
1. audit-custom-metadata.test.js (2 failures)
   - Expects: `x-response-time` header
   - Expects: `x-request-id` header

2. cors-cache-maxage.test.js (2 failures)
   - Expects: `access-control-max-age` header

3. cookie-max-age.test.js (1 failure)
   - Expects: `set-cookie` header on 200 response

4. audit-anonymous.test.js (1 failure - if not port-blocked)
   - Expects: `x-session-id` header or set-cookie

5. audit-timestamp.test.js (1 failure - if not port-blocked)
   - Expects: `response.timestamp` field or Date header

**Solution Approaches:**
- Option A: Implement missing headers in app
- Option B: Update tests to handle optional headers
- Option C: Check if headers should be added conditionally

**Priority:** MEDIUM - Tests are checking for features that may or may not be implemented

### 4. ❌ ASSERTION LOGIC ISSUES (3 tests failing)
**Status:** Test expectations don't match app behavior

**Issues:**

1. **token-revocation.test.js** (2 failures)
   ```
   Line 94: expect([401, 403]).toContain(secondRequest.status)
   Line 130: expect([401, 403]).toContain(response.status)
   ```
   - Issue: Assertion seems backwards or logic is wrong
   - Fix: Review what should happen after token revocation

2. **property-based-validation.test.js** (1 failure)
   ```
   Expected: [200, 201, 400]
   Received: 409 Conflict
   ```
   - Issue: App returns 409 (Conflict) instead of expected status
   - Fix: Either update test or fix app to return correct status

### 5. ❌ LOCK FILE VALIDATION ISSUE (1 test failing)
**Test:** dependency-pinning.test.js
**Issue:** Test expects `pkg.integrity || pkg.resolved` fields but finds undefined
**Root Cause:** package-lock.json structure doesn't match test assumptions
**Fix:** Update test to match actual npm lock file format

### 6. ❌ CONNECTION TIMEOUT/RESET (2 tests failing)
**Status:** Network-level issues

1. query-caps.test.js: `ETIMEDOUT 127.0.0.1:49152`
2. body-size-limit.test.js: `read ECONNRESET`

**Likely Causes:**
- Server not started or not responding
- Connection dropped unexpectedly
- Resource exhaustion
- May be secondary to port binding issue

## Implementation Priority

### IMMEDIATE (Blocking entire test run)
1. **Fix Socket/Port cleanup** - Prevents 10+ tests from running
   - Investigate afterAll() hooks in rate-limit tests
   - Check Socket.IO connection cleanup

### HIGH (Improves test pass rate)
2. **Fix token-revocation assertions** (2 tests) - Logic issue
3. **Implement missing headers OR update tests** (6 tests, if port issue is fixed)

### MEDIUM (Nice-to-have)
4. **Fix property-based-validation 409 status** (1 test)
5. **Fix dependency-pinning lock file check** (1 test)
6. **Fix connection timeouts** (2 tests) - Likely resolves with port fix

## Next Steps

1. **Immediate:** 
   - Run single rate-limit test in isolation with --detectOpenHandles
   - Check for unclosed sockets/connections in teardown
   - Verify afterAll cleanup code

2. **Quick Wins:**
   - Fix token-revocation assertion logic
   - Implement missing response headers

3. **Validation:**
   - Run full test suite again after fixes
   - Monitor for any new failures
   - Check if connection timeouts resolve

## Test Output Location
Last security tests output: (full suite running in background)
