# Test Fixes - Quick Reference Checklist

## ✅ Changes Already Applied

- [x] Fixed import path in `tests/security/auth/authentication.test.js`
  - Changed: `require('../helpers/test-utils')` → `require('../../helpers/test-utils')`
  
- [x] Fixed Jest config warning
  - Removed `runInBand: true` from `jest.config.js`
  - Added `--runInBand` flag to test script in `package.json`

## 📋 Next Steps - Run These Commands

### 1. **Local Testing (Do This First)**

```bash
# Navigate to backend
cd backend

# Install dependencies (if not already done)
npm install

# Run all tests
npm test

# If tests pass, run security tests specifically
npm run test:security

# If you see failures, note the exact error message
# Copy it and compare with EXPECTATION_MISMATCH_FIXES.md
```

### 2. **Debug Specific Failures**

If tests fail with assertion errors, use these commands:

```bash
# Run test with verbose output
npm test -- --verbose tests/security/auth/authentication.test.js

# Run with pattern matching
npm test -- --testNamePattern="Login Security" --verbose

# See which tests are failing
npm test -- --listTests

# Get detailed error info
npm test -- --detectOpenHandles tests/security/auth/authentication.test.js
```

### 3. **Check for Missing Files**

```bash
# Verify all critical files exist
test -f backend/src/app.js && echo "✓ app.js" || echo "✗ app.js MISSING"
test -f backend/tests/helpers/test-utils.js && echo "✓ test-utils.js" || echo "✗ test-utils.js MISSING"
test -f backend/tests/setup.js && echo "✓ setup.js" || echo "✗ setup.js MISSING"
```

### 4. **If Tests Still Fail**

**For Import/Module Errors:**
- Read `TEST_FIX_SUMMARY.md` for detailed debugging steps
- Check the relative paths from the test file location

**For Assertion Failures (Expected ≠ Received):**
- Read `EXPECTATION_MISMATCH_FIXES.md` for fix patterns
- Use the 3-step diagnosis process
- Search for error messages in app code

### 5. **Before Pushing to GitHub**

```bash
# Final comprehensive test run
npm test -- --runInBand --detectOpenHandles

# If all pass:
git add backend/jest.config.js backend/package.json backend/tests/security/auth/authentication.test.js
git commit -m "fix: correct test imports and jest config

- Fixed relative path in authentication.test.js
- Moved runInBand flag from config to CLI
- Tests now load correctly without module errors"
git push
```

## 🔍 Understanding Your Test Failures

### Type 1: "Cannot find module" Errors
- **Fix Location**: Import paths in test files
- **Guide**: TEST_FIX_SUMMARY.md → Section 1
- **Status**: ✅ ALREADY FIXED in authentication.test.js

### Type 2: "Expected X, Received Y" Assertion Failures
- **Fix Location**: Error messages in app code OR test expectations
- **Guide**: EXPECTATION_MISMATCH_FIXES.md
- **Status**: ⚠️ REQUIRES INVESTIGATION & FIXING

### Type 3: Jest Config Warnings
- **Fix Location**: jest.config.js and package.json scripts
- **Guide**: TEST_FIX_SUMMARY.md → Section 2
- **Status**: ✅ ALREADY FIXED

### Type 4: Open Handles / Force Exit
- **Fix Location**: Test cleanup (afterAll hooks) and Firebase teardown
- **Guide**: TEST_FIX_SUMMARY.md → Section "Remaining Known Issues"
- **Status**: ⚠️ REQUIRES TESTING TO IDENTIFY ISSUES

## 📚 Documentation Files Created

| File | Purpose |
|------|---------|
| `TEST_FIX_SUMMARY.md` | Overview of all fixes applied + next steps |
| `EXPECTATION_MISMATCH_FIXES.md` | Detailed guide for fixing assertion failures |
| `CI_CD_IMPROVEMENTS.md` | Enhanced GitHub Actions workflow recommendations |
| `QUICK_REFERENCE.md` | This file - quick commands and status |

## 🚀 Recommended Order of Operations

### Phase 1: Verify Local Setup (15 min)
1. Run `npm test` in backend folder
2. Note any errors (type 1, 2, 3, or 4)
3. Check specific error messages

### Phase 2: Fix Module/Config Issues (5 min)
- ✅ Already done! See "Changes Already Applied" section

### Phase 3: Fix Assertion Mismatches (30-60 min)
- Use EXPECTATION_MISMATCH_FIXES.md as guide
- For each failing test:
  1. Identify the mismatch (Expected vs Received)
  2. Decide: Fix code or test?
  3. Apply fix
  4. Re-run test to verify
- Repeat until all pass

### Phase 4: Test in CI/CD (5-10 min)
- Commit changes
- Push to branch
- Monitor GitHub Actions workflow
- Check `firebase-emulator-test.yml` results

### Phase 5: Apply CI/CD Improvements (Optional, 20 min)
- Use CI_CD_IMPROVEMENTS.md to enhance workflow
- Add better diagnostics and logging
- Reduce log truncation issues

## 🆘 Troubleshooting Quick Links

| Problem | Solution |
|---------|----------|
| "Cannot find module" | TEST_FIX_SUMMARY.md § Missing Modules |
| "Expected X, Received Y" | EXPECTATION_MISMATCH_FIXES.md |
| Jest warns about "runInBand" | TEST_FIX_SUMMARY.md § Jest Config Warning |
| Tests timeout or hang | TEST_FIX_SUMMARY.md § Open Handles |
| Logs are truncated | TEST_FIX_SUMMARY.md § Truncated Logs |
| Need better CI feedback | CI_CD_IMPROVEMENTS.md § Complete Workflow |

## ⚡ Common Commands

```bash
# Run all backend tests
npm test

# Run security tests only
npm run test:security

# Run single test file with debugging
npm test -- tests/security/auth/authentication.test.js --verbose

# Run tests matching a pattern
npm test -- --testNamePattern="Login"

# Check what would happen without running
npm test -- --listTests

# Find open handles blocking cleanup
npm test -- --detectOpenHandles

# Full debug run
npm test -- --verbose --detectOpenHandles --bail
```

## 📊 Current Status

| Category | Status | Action |
|----------|--------|--------|
| Import Paths | ✅ Fixed | None needed |
| Jest Config | ✅ Fixed | None needed |
| Assertion Mismatches | ⚠️ Unknown | Run tests & analyze |
| Open Handles | ⚠️ Unknown | Run with --detectOpenHandles |
| CI/CD Workflow | ⚠️ Could improve | Optional enhancements available |

## 🎯 Success Criteria

✅ You've succeeded when:
1. `npm test` runs without "Cannot find module" errors
2. All Jest config warnings are gone
3. No assertion failures reported
4. Tests complete without "Force exiting Jest"
5. GitHub Actions workflow completes successfully

## 📞 If You Get Stuck

1. **First**, run `npm test` and capture the EXACT error message
2. **Then**, search for that error in the three guide files (TEST_FIX_SUMMARY.md, EXPECTATION_MISMATCH_FIXES.md, or CI_CD_IMPROVEMENTS.md)
3. **Follow** the debugging steps for that specific error type
4. **Re-run** to verify the fix

---

**Generated:** 2026-02-01  
**For:** GroundCTRL Backend (TR41)  
**Branch:** additionalsecurityaddons  
**PR:** #82
