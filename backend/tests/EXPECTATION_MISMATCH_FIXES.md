# Test Expectation Mismatch Fixes

## Overview

This guide helps you identify and fix test assertion failures where the actual response doesn't match what the test expects. These are NOT module loading errors—they happen when tests run but assertions fail.

## Quick Diagnosis: The 3-Step Process

### Step 1: Find Which Tests Are Failing

Run your tests locally with specific output:

```bash
cd backend
npm test -- --verbose --no-coverage 2>&1 | tee test-output.log
```

Look for lines starting with:
- `FAIL` - Test suite failed
- `● Test name` - Specific failing test
- `Expected:` and `Received:` - The mismatch

### Step 2: Identify the Pattern

Most expectation mismatches fall into these categories:

**Category A: Error Messages Don't Match**
```
Expected: "Invalid credentials"
Received: "Invalid email or password"
```

**Category B: Response Structure Doesn't Match**
```
Expected: { message: "error" }
Received: { payload: { error: { message: "error" } } }
```

**Category C: Regex Patterns Don't Match**
```
Expected: /email|invalid/i
Received: "Validation failed"
```

### Step 3: Debug Specific Test

```bash
# Run just one test file to see detailed output
npm test -- tests/security/auth/authentication.test.js --verbose

# Or run matching test pattern
npm test -- --testNamePattern="Login Security" --verbose
```

---

## Fix Strategies by Category

### Category A: Error Message Mismatches

**Problem:** Your app changed error messages, but tests still expect old ones.

**Location:** Usually in route handlers or error middleware

```bash
# Find where error messages are generated
grep -r "Invalid credentials" backend/src/
# or
grep -r "Invalid email or password" backend/src/
```

**Example Fix:**

**In `backend/src/routes/auth.js` or `controllers/authController.js`:**

Before (Old code):
```javascript
res.status(401).json({
  payload: {
    error: { message: 'Invalid credentials' }
  }
});
```

After (Matches test):
```javascript
res.status(401).json({
  payload: {
    error: { message: 'Invalid email or password' }
  }
});
```

OR, update the test to match new message:

**In `backend/tests/security/auth/authentication.test.js`:**

Before:
```javascript
expect(response.body.payload.error.message).toBe('Invalid credentials');
```

After (Match actual response):
```javascript
expect(response.body.payload.error.message).toBe('Invalid email or password');
```

OR, use a loose matcher for flexibility:

```javascript
// Matches any of these messages
expect(response.body.payload.error.message).toMatch(
  /invalid (credentials|email|password)/i
);
```

### Category B: Response Structure Mismatches

**Problem:** The JSON structure of responses changed.

**Location:** Response formatting in controllers or middleware

**Example:**

You're getting:
```json
{
  "error": "User not found",
  "code": "AUTH_001"
}
```

But test expects:
```json
{
  "payload": {
    "error": { "message": "User not found" }
  }
}
```

**Solution:** Standardize response format across app

Create `backend/src/utils/responseFormatter.js`:
```javascript
const formatError = (message, code = 'UNKNOWN_ERROR', statusCode = 500) => ({
  payload: {
    error: {
      message,
      code,
    },
  },
});

const formatSuccess = (data) => ({
  payload: {
    data,
  },
});

module.exports = { formatError, formatSuccess };
```

Then use consistently in routes:
```javascript
const { formatError } = require('../utils/responseFormatter');

router.post('/login', (req, res) => {
  try {
    // ... auth logic ...
    if (!user) {
      return res.status(401).json(
        formatError('Invalid email or password', 'AUTH_001')
      );
    }
  } catch (err) {
    return res.status(500).json(
      formatError('Internal server error', 'INTERNAL_ERROR')
    );
  }
});
```

### Category C: Regex Pattern Mismatches

**Problem:** Test uses regex expecting one format, app returns different format.

**Example:**

Test:
```javascript
expect(response.body.error).toMatch(/email|invalid/i);
```

Response:
```
"Validation failed"  // Doesn't contain "email" or "invalid"
```

**Solution 1: Update Regex to Match Actual Output**

```javascript
// More flexible: matches any validation-related message
expect(response.body.error).toMatch(/validation|invalid/i);
```

**Solution 2: Make Error Messages More Specific**

In your error handler:
```javascript
// OLD
throw new Error('Validation failed');

// NEW - includes field info
throw new Error('Validation failed: invalid email format');
```

**Solution 3: Return Detailed Error Object**

```javascript
res.status(400).json({
  payload: {
    error: {
      message: 'Validation failed',
      fields: {
        email: 'Invalid format',
        password: 'Too short'
      }
    }
  }
});
```

Then test can check:
```javascript
expect(response.body.payload.error.fields.email).toBe('Invalid format');
```

---

## Common Patterns in Your Codebase

### Pattern 1: Authentication Error Messages

**File:** `backend/src/routes/auth.js` or `backend/src/controllers/authController.js`

```javascript
// Review these error messages
const errors = {
  INVALID_CREDENTIALS: 'Invalid email or password',  // ← Check this message
  USER_NOT_FOUND: 'User not found',
  EMAIL_ALREADY_EXISTS: 'Email already registered',
  INVALID_EMAIL_FORMAT: 'Invalid email format',
};
```

**Associated tests:**
- `tests/security/auth/authentication.test.js`
- `tests/security/auth/login-success.test.js`
- `tests/security/auth/login-bad-password.test.js`

### Pattern 2: Validation Error Messages

**File:** `backend/src/middleware/validationMiddleware.js` or in route handlers

```javascript
// Review these validation messages
const validationMessages = {
  MISSING_REQUIRED_FIELD: (field) => `Missing required field: ${field}`,
  INVALID_FORMAT: (field) => `Invalid format for ${field}`,
  PAYLOAD_TOO_LARGE: 'Request payload exceeds maximum size',
};
```

**Associated tests:**
- `tests/security/validation/input-validation.test.js`
- `tests/security/validation/body-size-limit.test.js`

### Pattern 3: Rate Limit Messages

**File:** `backend/src/middleware/rateLimitMiddleware.js`

```javascript
// Check rate limit error message
const rateLimitError = 'Too many requests, please try again later';
```

**Associated tests:**
- `tests/security/rate-limit/rate-limiting.test.js`

---

## Workflow for Fixing Each Mismatch

### For Each Failing Test:

1. **Read the error**
   ```
   Expected: "error message A"
   Received: "error message B"
   ```

2. **Decide: Fix code or fix test?**
   - If app behavior is **correct**: Update test to expect "B"
   - If test expectations are **correct**: Fix app code to return "A"
   - If **both reasonable**: Use pattern/regex in test

3. **Apply fix**
   - Edit the file (app code or test)
   - Save and commit

4. **Verify locally**
   ```bash
   npm test -- --testNamePattern="exact test name"
   ```

5. **Once all pass, commit and push**

---

## Testing Checklist for Expectation Fixes

After you've identified and fixed all mismatches:

```bash
# Run individual test suite that had failures
npm run test:security -- --detectOpenHandles

# Run all tests with verbose output
npm test -- --verbose

# Check that old failures are fixed
npm test -- --testNamePattern="Authentication" --verbose

# Run with coverage to see impact
npm test -- --coverage
```

---

## Quick Command Reference

```bash
# Search for error message in code
grep -r "Invalid credentials" backend/src/

# Find which tests expect a specific message
grep -r "Invalid credentials" backend/tests/

# Run single test file
npm test -- tests/security/auth/authentication.test.js

# Run tests matching pattern
npm test -- --testNamePattern="should return generic error"

# Run with detailed output
npm test -- --verbose --no-coverage

# Check which tests are failing
npm test -- --listTests

# Get test coverage
npm test -- --coverage
```

---

## Example: Complete Fix Walkthrough

### The Problem
Test fails with:
```
Expected: "Invalid credentials"
Received: "Invalid email or password"
```

In file: `tests/security/auth/authentication.test.js`

### Solution A: Fix the Test (Recommended if app is correct)

```javascript
// In tests/security/auth/authentication.test.js
// OLD
expect(response.body.payload.error.message).toBe('Invalid credentials');

// NEW
expect(response.body.payload.error.message).toBe('Invalid email or password');
```

### Solution B: Fix the App Code

Find where error is thrown (likely in `src/controllers/authController.js` or `src/routes/auth.js`):

```javascript
// Find this:
return res.status(401).json({
  payload: {
    error: { message: 'Invalid email or password' }
  }
});

// Change to:
return res.status(401).json({
  payload: {
    error: { message: 'Invalid credentials' }
  }
});
```

### Solution C: Use Flexible Matching (Best Practice)

```javascript
// In test - accepts either message
expect(response.body.payload.error.message).toMatch(
  /invalid (credentials|email|password)/i
);
```

This way, future changes to error messages won't break tests as long as they still mention "invalid".

---

## When Tests Pass Locally But Fail in CI

This usually means:

1. **Environment variable difference**
   - Check `.env.test` vs CI env vars
   - CI Firebase emulator might have different behavior

2. **Timing issue**
   - Test assumes fast response, but CI is slower
   - Use `jest.setTimeout(10000)` for specific tests

3. **Firebase emulator state**
   - Clear emulator data: `firebase emulators:start --import=<path>`
   - Ensure fresh state between runs

**Solution:**
```bash
# Test with CI environment locally
NODE_ENV=test \
FIREBASE_AUTH_EMULATOR_HOST=127.0.0.1:9099 \
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 \
npm test -- tests/security/auth/authentication.test.js
```

---

## Still Stuck?

If you can't match test expectations after these steps:

1. **Print actual response:**
   ```javascript
   console.log('Actual response:', JSON.stringify(response.body, null, 2));
   ```

2. **Run test with debugger:**
   Press F5 in VS Code with this `.vscode/launch.json`:
   ```json
   {
     "type": "node",
     "request": "launch",
     "name": "Debug Test",
     "program": "${workspaceFolder}/node_modules/.bin/jest",
     "args": ["--runInBand", "tests/security/auth/authentication.test.js"],
     "console": "integratedTerminal"
   }
   ```

3. **Temporarily loosen assertion:**
   ```javascript
   // Temporarily accept anything while debugging
   expect(response.body).toBeDefined();
   ```

---

**Created:** 2026-02-01  
**For:** GroundCTRL Backend Tests  
**Branch:** additionalsecurityaddons
