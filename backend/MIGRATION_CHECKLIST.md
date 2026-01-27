# Test Migration Checklist

## Pre-Migration
- [x] Backup current test files
- [x] Review all test configurations

## Configuration Updates
- [x] Update `jest.config.js` to use `tests/` directory
- [x] Update `package.json` test scripts
- [x] Update `.gitignore` to ignore `tests-backend/`
- [x] Update `eslint.config.js` to ignore old directory
- [x] Update `CONTRIBUTING.md` documentation

## File Migration
- [ ] Move all test files from `tests-backend/` to `tests/`
- [ ] Verify `tests/setup.js` exists and is configured correctly
- [ ] Verify test directory structure matches README

## Verification
- [ ] Run `node scripts/verify-test-migration.js`
- [ ] Run `npm run lint` - should pass
- [ ] Run `npm test` - all tests should pass
- [ ] Run `firebase emulators:start` and verify connection
- [ ] Run integration tests with emulators

## Cleanup
- [ ] Delete `tests-backend/` directory
- [ ] Remove any references to `tests-backend` in code
- [ ] Commit all changes

## Post-Migration
- [ ] Update PR with migration details
- [ ] Notify team of directory structure change
- [ ] Update any CI/CD pipelines
- [ ] Archive this checklist

## Commands to Run
```bash
# Verify migration
node scripts/verify-test-migration.js

# Run tests
npm test

# Run with emulators
firebase emulators:exec --only auth,firestore "npm test"
```
