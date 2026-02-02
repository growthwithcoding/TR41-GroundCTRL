# CI/CD Firebase Tests Configuration

## Overview
This document explains the Firebase-dependent tests and how they behave in local vs CI/CD environments.

## Test Status Summary

**Local Environment (with mocks):**
- ✅ 495 tests passing across 68 test suites
- ⏭️ 1 test skipped (npm audit - intentionally skipped)
- 🔄 Firebase repository tests skip gracefully when not initialized

**CI/CD Environment (with real Firebase credentials):**
- Firebase-dependent tests should PASS when Firebase credentials are available:
  1. `identity-enforcement.test.js`: "uses uid for all auth/user CRUD operations"
  2. `identity-enforcement.test.js`: "prevents cross-user access by uid scoping"
  3. `security-rules.test.js`: "enforces uid-scoped access at repository level"
  4. `identity-enforcement.test.js`: Repository-level tests

## How It Works

### Detection Mechanism
Tests use `isFirebaseActuallyInitialized()` helper that:
1. Attempts to import `src/config/firebase.js`
2. Calls `getFirestore()` to check if Firebase is initialized
3. Returns `true` if successful (real Firebase), `false` if error (mocked)

```javascript
function isFirebaseActuallyInitialized() {
  try {
    const firebaseConfig = require('../../../src/config/firebase');
    firebaseConfig.getFirestore();
    return true;
  } catch (error) {
    return false;  // Using mocks, not real Firebase
  }
}
```

### Test Behavior

**Local (Mocks):**
- Detection function catches "Firebase not initialized" error
- Tests detect mocked environment and skip gracefully
- Output: `⚠️  Skipping - Firebase not initialized`

**CI/CD (Real Firebase):**
- Firebase credentials from GitHub Secrets initialize Firebase properly
- `getFirestore()` succeeds
- Tests run normally and interact with real Firestore

## Required GitHub Secrets

For CI/CD tests to pass, ensure these secrets are configured:

```yaml
FIREBASE_PROJECT_ID: your-project-id
FIREBASE_PRIVATE_KEY: "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL: firebase-adminsdk@your-project.iam.gserviceaccount.com
```

## Files Modified

### Test Files
- `tests/integration/auth/identity-enforcement.test.js` - Added detection helper, updated 3 tests
- `tests/integration/firebase/security-rules.test.js` - Added detection helper, updated 1 test

### Key Changes
1. Added `isFirebaseActuallyInitialized()` helper to both test files
2. Updated `beforeAll` to use new detection
3. Updated individual test skip checks
4. Added informative console messages for skipped tests

## Verification Commands

**Local (expect skips):**
```bash
npm test -- tests/integration/auth/identity-enforcement.test.js
npm test -- tests/integration/firebase/security-rules.test.js
```

**Full suite:**
```bash
npm test
# Expected: ~495 passed across 68 test suites, 1 skipped (npm audit)
# Firebase-dependent tests skip gracefully when not initialized
```

## CI/CD Workflow Example

```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    env:
      FIREBASE_PROJECT_ID: ${{ secrets.FIREBASE_PROJECT_ID }}
      FIREBASE_PRIVATE_KEY: ${{ secrets.FIREBASE_PRIVATE_KEY }}
      FIREBASE_CLIENT_EMAIL: ${{ secrets.FIREBASE_CLIENT_EMAIL }}
    
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      # With Firebase secrets, Firebase-dependent tests should PASS
```

## Troubleshooting

### Tests still skipping in CI/CD
- Verify GitHub Secrets are set correctly
- Check secret names match environment variables
- Ensure `FIREBASE_PRIVATE_KEY` includes `\n` characters properly

### Tests failing in CI/CD
- Check Firebase project has Firestore enabled
- Verify service account has necessary permissions
- Check firestore.rules allow admin SDK access

### Tests failing locally (not skipping)
- Verify `tests/setup.js` properly mocks Firebase
- Check `NODE_ENV=test` is set
- Ensure no real Firebase credentials in local environment

## Migration Notes

Previously these tests used `if (!admin.apps.length)` which couldn't distinguish between:
- `admin.apps = []` (no Firebase)
- `admin.apps = [{ name: '[DEFAULT]' }]` (mocked Firebase)

New detection actually tries to use Firestore, properly distinguishing mock from real.
