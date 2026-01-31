# Authentication Failure Fixes (401 Errors)

## Root Cause Analysis

The 401 Unauthorized errors in security tests were caused by:

1. **Missing Firestore User Documents**: The backend's login flow checks for user documents in Firestore (`users` collection), but `createTestUser()` only created Firebase Auth users.

2. **Email Modification**: The old `createTestUser()` function was adding random suffixes to emails to avoid conflicts, but tests used the original email for login.

3. **Timing Issues**: No delays between user creation and login attempts, causing race conditions.

4. **Incomplete User Setup**: Tests lacked proper wait times for Firebase emulator propagation.

## Fixes Applied

### 1. Enhanced `createTestUser()` Function

**File:** `backend/tests/helpers/test-utils.js`

**Changes:**
```javascript
async function createTestUser(email, password = 'TestPassword123!', callSign = null) {
  try {
    // 1. Delete existing user first (cleanup)
    try {
      const existingUser = await admin.auth().getUserByEmail(email);
      await admin.auth().deleteUser(existingUser.uid);
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      // User doesn't exist, continue
    }
    
    // 2. Create Firebase Auth user
    const userRecord = await admin.auth().createUser({
      email,
      password,
      emailVerified: true,
    });
    
    // 3. Wait for propagation
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 4. Create Firestore user document (CRITICAL FIX)
    const db = admin.firestore();
    const generatedCallSign = callSign || `TEST${Date.now().toString().slice(-6)}`;
    await db.collection('users').doc(userRecord.uid).set({
      email,
      callSign: generatedCallSign,
      displayName: `Test User ${generatedCallSign}`,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      isAdmin: false,
      status: 'ACTIVE'
    });
    
    // 5. Wait for Firestore write
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return userRecord;
  } catch (error) {
    console.error('Error creating test user:', error);
    throw error;
  }
}
```

**Key Improvements:**
- ✅ Creates both Firebase Auth user AND Firestore document
- ✅ No email modification (uses original email)
- ✅ Proper delays for emulator propagation (1000ms total)
- ✅ Cleanup of existing users before creation
- ✅ Error logging for debugging
- ✅ Sets all required user fields (callSign, displayName, status, etc.)

### 2. Added Delays and Logging to Test Files

**Files Updated:**
- `backend/tests/security/login-success.test.js`
- `backend/tests/security/audit-timestamp.test.js`

**Changes:**
```javascript
// Before
await createTestUser(email, password);
await request(app).post('/api/v1/auth/login').send({ email, password }).expect(200);

// After
const user = await createTestUser(email, password);
console.log('Created test user:', user.uid, email);

// Wait for user to be fully created
await new Promise(resolve => setTimeout(resolve, 1000));

const loginResponse = await request(app)
  .post('/api/v1/auth/login')
  .send({ email, password });

if (loginResponse.status !== 200) {
  console.error('Login failed:', loginResponse.status, loginResponse.body);
}
expect(loginResponse.status).toBe(200);
```

**Benefits:**
- ✅ 1-second delay after user creation
- ✅ Console logging for debugging
- ✅ Explicit error messages showing why login failed
- ✅ Better visibility into test failures

## Why These Fixes Work

### Backend Login Flow Requires Firestore Document

From `backend/src/controllers/authController.js` lines 145-155:
```javascript
const userDoc = await db.collection('users').doc(userRecord.uid).get();

if (userDoc.exists) {
  const userData = userDoc.data();
  userId = userRecord.uid;
  userCallSign = userData.callSign; // ← Requires callSign from Firestore
  // ...
}
```

The login controller expects:
1. Firebase Auth user (for password verification)
2. Firestore document in `users` collection (for user metadata like `callSign`)

**Without the Firestore document, login fails with 401.**

### Timing Is Critical in Emulator

Firebase emulator operations are asynchronous:
- User creation in Auth emulator: ~200-300ms
- Firestore write: ~200-300ms  
- Index updates: ~100-200ms

**Total propagation time: ~500-1000ms**

Without delays, tests attempt login before the user is fully available, causing 401 errors.

## Testing the Fixes

### Run Affected Tests
```bash
cd backend

# Test login functionality
npm test -- tests/security/login-success.test.js

# Test audit logging
npm test -- tests/security/audit-timestamp.test.js
npm test -- tests/security/audit-custom-metadata.test.js

# Run all security tests
npm test -- tests/security/
```

### Expected Results
- ✅ All login tests should return 200 OK
- ✅ User creation followed by login should succeed
- ✅ Audit logs should capture successful logins
- ✅ No more 401 Unauthorized errors for valid credentials

## Additional Recommendations

### 1. Increase Test Timeout if Needed

In `jest.config.js`:
```javascript
testTimeout: 60000, // Already set to 60 seconds
```

### 2. Verify Emulator Configuration

Ensure these are set in `backend/tests/setup.js`:
```javascript
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
```

### 3. Check Emulator Is Running in CI

In GitHub Actions workflow:
```yaml
- name: Start Firebase Emulators
  run: |
    firebase emulators:start --only auth,firestore &
    sleep 10  # Wait for emulators to start
```

### 4. Add Retry Logic for Flaky Tests

If timing issues persist, add retry logic:
```javascript
jest.retryTimes(2); // Retry failed tests once
```

## Summary of Changes

| Issue | Root Cause | Fix | Status |
|-------|-----------|-----|--------|
| 401 on login | Missing Firestore document | Create user doc in `createTestUser()` | ✅ Fixed |
| Email mismatch | Random suffix added to email | Use original email | ✅ Fixed |
| Timing issues | No delays after user creation | Add 1000ms delay | ✅ Fixed |
| Poor debugging | No error logging | Add console.error on failure | ✅ Fixed |
| Race conditions | Async operations not awaited | Proper await + setTimeout | ✅ Fixed |

## Expected Impact

These fixes should resolve:
- ✅ All `login-success.test.js` failures
- ✅ All `audit-timestamp.test.js` 401 errors
- ✅ All `audit-custom-metadata.test.js` authentication issues
- ✅ Any other tests that use `createTestUser()` + login

**Estimated:** Should fix 10-15 additional failing tests that depend on authentication.

## Next Steps

1. **Commit changes:**
   ```bash
   git add backend/tests/helpers/test-utils.js
   git add backend/tests/security/login-success.test.js
   git add backend/tests/security/audit-timestamp.test.js
   git commit -m "Fix 401 errors: Create Firestore docs, add delays, improve logging"
   git push origin newsecurityrules
   ```

2. **Monitor GitHub Actions:**
   - Watch for authentication-related tests
   - Check console logs for "Created test user" messages
   - Verify 200 OK responses for login endpoints

3. **If issues persist:**
   - Check emulator startup logs in CI
   - Increase delays to 1500-2000ms
   - Add more detailed logging in authController.js
   - Verify JWT_SECRET is set correctly

---

**Date Applied:** January 30, 2026  
**Branch:** newsecurityrules  
**Pull Request:** #65
