# Firebase Emulator & Testing Guide

## Overview

This guide provides comprehensive instructions for running the GroundCTRL test suite using Firebase Emulators. The testing environment requires **3 terminal windows** running simultaneously to properly test all backend functionality.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start (3-Terminal Setup)](#quick-start-3-terminal-setup)
3. [Detailed Setup Instructions](#detailed-setup-instructions)
4. [Running Tests](#running-tests)
5. [Accessing Emulator UI](#accessing-emulator-ui)
6. [Troubleshooting](#troubleshooting)
7. [Common Issues & Solutions](#common-issues--solutions)
8. [Configuration Reference](#configuration-reference)
9. [Production Safety & Emulator Safeguards](#production-safety--emulator-safeguards)
10. [Terminal Window Reference](#terminal-window-reference)
11. [Best Practices](#best-practices)
12. [Additional Resources](#additional-resources)
13. [Quick Reference Card](#quick-reference-card)

---

## Prerequisites

### Required Software

- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Firebase CLI**: Latest version

### Install Firebase CLI (if not installed)

```bash
npm install -g firebase-tools
```

Verify installation:
```bash
firebase --version
```

### Install Project Dependencies

```bash
# In project root
cd backend
npm install
```

---

## Quick Start (3-Terminal Setup)

### Terminal 1: Firebase Emulators

```bash
# From project root directory
firebase emulators:start
```

**Expected Output:**
```
┌─────────────────────────────────────────────────────────────┐
│ ✔  All emulators ready! It is now safe to connect your app. │
│ i  View Emulator UI at http://localhost:4000                │
└─────────────────────────────────────────────────────────────┘

┌────────────┬────────────────┬─────────────────────────────────┐
│ Emulator   │ Host:Port      │ View in Emulator UI             │
├────────────┼────────────────┼─────────────────────────────────┤
│ Auth       │ localhost:9099 │ http://localhost:4000/auth      │
│ Firestore  │ localhost:8080 │ http://localhost:4000/firestore │
└────────────┴────────────────┴─────────────────────────────────┘
```

> **Note:** Keep this terminal running. Do not close it.

---

### Terminal 2: Backend API Server

```bash
# From project root directory
cd backend
npm run dev
```

**Expected Output:**
```
[nodemon] starting `node src/server.js`
🔧 Firebase Emulators Configured:
   - Auth Emulator: localhost:9099
   - Firestore Emulator: localhost:8080
✅ Firebase initialized successfully
🚀 GroundCTRL Backend Server
📡 Mission Control Station: GROUNDCTRL-01
🌍 Server running on port 3001
🔗 API Base URL: http://localhost:3001/api/v1
📚 API Documentation: http://localhost:3001/api-docs
```

> **Note:** The dev server will auto-reload on file changes. Keep this terminal running.

---

### Terminal 3: Test Runner

```bash
# From project root directory
cd backend

# Run all tests with coverage
npm test

# OR run specific test suites
npm test tests-backend/sprint0/
npm test tests-backend/sprint1/

# OR run in watch mode for development
npm run test:watch
```

**Expected Output:**
```
=============================================================
🧪 TEST ENVIRONMENT INITIALIZED
=============================================================
Firebase Auth Emulator: localhost:9099
Firestore Emulator: localhost:8080
API Base URL: http://localhost:3001/api/v1
Project ID: test-project
Node Environment: test
=============================================================

 PASS  tests-backend/sanity.test.js
 PASS  tests-backend/sprint0/firebaseEmulator.test.js
 PASS  tests-backend/sprint0/backendPhase1IdentityEnforcement.test.js
 
Test Suites: 9 passed, 9 total
Tests:       87 passed, 87 total
```

---

## Detailed Setup Instructions

### Step 1: Configure Environment Variables

The project uses `.env.test` for testing. **This file is already configured** and includes:

```env
# Firebase Emulators
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
FIRESTORE_EMULATOR_HOST=localhost:8080

# Test Project
FIREBASE_PROJECT_ID=test-project
FIREBASE_WEB_API_KEY=test-api-key-12345

# Backend API
API_BASE_URL=http://localhost:3001/api/v1
PORT=3001
NODE_ENV=test
```

> ⚠️ **IMPORTANT**: These emulator variables are **ONLY** for testing. They must **NEVER** be set in production. See the [Production Safety & Emulator Safeguards](#production-safety--emulator-safeguards) section for details.

---

### Step 2: Start Firebase Emulators

The Firebase Emulators simulate Firebase services locally:

```bash
firebase emulators:start
```

**What this does:**
- Starts Firebase Auth on `localhost:9099`
- Starts Firestore on `localhost:8080`
- Starts Emulator UI on `localhost:4000`
- Starts Emulator Hub on `localhost:4400`

**Configuration Location:** `firebase.json` (project root)

---

### Step 3: Start Backend Server

The backend API must be running for integration tests:

```bash
cd backend
npm run dev
```

**What this does:**
- Starts Express server on port `3001`
- Connects to Firebase Emulators (not production Firebase)
- Enables hot-reload with nodemon
- Serves API at `http://localhost:3001/api/v1`

**Why this is needed:**
- Tests make real HTTP requests to the API
- Tests verify authentication flows end-to-end
- Tests validate request/response handling

---

### Step 4: Run Tests

With emulators and backend running, execute tests:

```bash
cd backend
npm test
```

**Available Test Commands:**

| Command | Description |
|---------|-------------|
| `npm test` | Run all tests with coverage report |
| `npm run test:watch` | Run tests in watch mode (auto-rerun on changes) |
| `npm test -- --testPathPattern=sprint0` | Run only Sprint 0 tests |
| `npm test -- --testPathPattern=sprint1` | Run only Sprint 1 tests |
| `npm test tests-backend/sanity.test.js` | Run a specific test file |

---

## Running Tests

### Full Test Suite

```bash
npm test
```

**Coverage Report Location:** `backend/coverage/`
- HTML Report: `backend/coverage/lcov-report/index.html`

### Specific Test Suites

**Sprint 0 Tests** (Backend Security & Infrastructure):
```bash
npm test tests-backend/sprint0/
```

Tests include:
- ✅ Firebase Emulator connectivity
- ✅ Identity enforcement (user ID validation)
- ✅ Security quick wins (rate limiting, headers)
- ✅ Validation layer (Zod schema validation)
- ✅ CRUD factory operations

**Sprint 1 Tests** (Authentication & Authorization):
```bash
npm test tests-backend/sprint1/
```

Tests include:
- ✅ Complete authentication flow (register, login, refresh, logout)
- ✅ Firebase security rules enforcement
- ✅ Scenario visibility and ownership
- ✅ Security headers validation

### Watch Mode (Development)

```bash
npm run test:watch
```

**Benefits:**
- Auto-reruns tests when files change
- Interactive menu for filtering tests
- Faster development workflow

---

## Accessing Emulator UI

While emulators are running, access the web-based UI:

**URL:** [http://localhost:4000](http://localhost:4000)

### Features Available:

1. **Authentication Tab** (`http://localhost:4000/auth`)
   - View all test users created during tests
   - Manually create/delete test users
   - Inspect user tokens

2. **Firestore Tab** (`http://localhost:4000/firestore`)
   - Browse all collections and documents
   - View data created during test runs
   - Manually add/edit/delete data
   - Export/import data snapshots

3. **Logs Tab**
   - View all emulator operations
   - Debug authentication requests
   - Monitor Firestore queries

---

## Troubleshooting

### Issue: "Port already in use"

**Error Message:**
```
Port 9099 is not open on localhost, could not start Auth Emulator.
```

**Solution:**

**Windows:**
```cmd
# Find process using port 9099
netstat -ano | findstr :9099

# Kill process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

**Linux/Mac:**
```bash
# Find and kill process
lsof -ti:9099 | xargs kill -9
lsof -ti:8080 | xargs kill -9
lsof -ti:4000 | xargs kill -9
```

---

### Issue: Tests fail with "ECONNREFUSED"

**Error Message:**
```
Error: connect ECONNREFUSED 127.0.0.1:3001
```

**Cause:** Backend API server is not running

**Solution:**
1. Open Terminal 2
2. Navigate to `backend/` directory
3. Run `npm run dev`
4. Wait for "Server running on port 3001" message
5. Re-run tests in Terminal 3

---

### Issue: "Firebase app already exists"

**Error Message:**
```
Error: Firebase app named '[DEFAULT]' already exists
```

**Cause:** Multiple Firebase initializations

**Solution:**
This is typically handled automatically by the test setup. If you encounter this:

1. Restart the backend server (Terminal 2)
2. Clear Jest cache: `npm test -- --clearCache`
3. Re-run tests

---

### Issue: Tests pass but server shows errors

**Symptom:** Tests show green checkmarks but server logs show errors

**Cause:** Tests are validating that the server correctly handles error cases

**This is expected behavior** when testing:
- Invalid authentication attempts
- Unauthorized access attempts
- Validation failures
- Rate limit enforcement

**Example Expected Errors:**
```
❌ ValidationError: Invalid email format
❌ AuthenticationError: Invalid credentials
❌ AuthorizationError: Access denied
```

These are **correct** - they verify error handling works properly.

---

### Issue: Emulator data persists between test runs

**Symptom:** Tests fail because data from previous runs exists

**Cause:** Emulators cache data by default

**Solution:**

**Option 1: Restart emulators with clean slate**
```bash
# Stop emulators (Ctrl+C)
# Restart
firebase emulators:start
```

**Option 2: Clear emulator data directory**
```bash
# Remove cached data (project root)
rm -rf .firebase/
firebase emulators:start
```

---

### Issue: "Firebase Admin SDK has not been initialized"

**Error Message:**
```
Error: Firebase Admin SDK has not been initialized
```

**Cause:** Backend server not connected to emulators

**Solution:**

1. Verify `.env.test` contains emulator variables:
   ```env
   FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
   FIRESTORE_EMULATOR_HOST=localhost:8080
   ```

2. Restart backend server:
   ```bash
   # Terminal 2
   cd backend
   npm run dev
   ```

3. Look for emulator connection confirmation:
   ```
   🔧 Firebase Emulators Configured:
      - Auth Emulator: localhost:9099
      - Firestore Emulator: localhost:8080
   ```

---

### Issue: "Production deployment blocked" error

**Error Message:**
```
🚨 PRODUCTION DEPLOYMENT BLOCKED: Firebase Emulator Variables Detected
```

**Cause:** Emulator variables set with `NODE_ENV=production`

**This is a safety feature!** See the [Production Safety & Emulator Safeguards](#production-safety--emulator-safeguards) section for details.

**Solution:**

For testing, ensure `NODE_ENV=test` (already configured in `.env.test`)

**DO NOT:**
- Set emulator variables in production
- Set `NODE_ENV=production` while testing locally

---

## Common Issues & Solutions

### Tests Timeout

**Problem:** Tests hang and eventually timeout

**Checklist:**
1. ✅ Firebase Emulators running? (Terminal 1)
2. ✅ Backend server running? (Terminal 2)
3. ✅ Correct ports open? (9099, 8080, 3001, 4000)
4. ✅ No firewall blocking localhost connections?

### Intermittent Test Failures

**Problem:** Tests sometimes pass, sometimes fail

**Common Causes:**
1. **Race conditions**: Async operations not properly awaited
2. **Port conflicts**: Another service using required ports
3. **Resource cleanup**: Previous test data not cleared

**Solution:**
```bash
# Restart all 3 terminals in order:
# 1. Stop all (Ctrl+C in each terminal)
# 2. Start Terminal 1: firebase emulators:start
# 3. Start Terminal 2: npm run dev
# 4. Start Terminal 3: npm test
```

### Coverage Reports Not Generated

**Problem:** Tests run but coverage report missing

**Solution:**
```bash
# Generate fresh coverage report
npm test -- --coverage --coverageDirectory=coverage

# View HTML report
# Windows
start coverage/lcov-report/index.html

# Mac
open coverage/lcov-report/index.html

# Linux
xdg-open coverage/lcov-report/index.html
```

---

## Configuration Reference

### Emulator Ports (firebase.json)

| Service | Port | URL | Purpose |
|---------|------|-----|---------|
| Auth | 9099 | localhost:9099 | Firebase Authentication |
| Firestore | 8080 | localhost:8080 | Cloud Firestore Database |
| Emulator UI | 4000 | http://localhost:4000 | Web-based management UI |
| Emulator Hub | 4400 | localhost:4400 | Inter-emulator communication |

### Backend Server (backend/.env.test)

| Variable | Value | Purpose |
|----------|-------|---------|
| `PORT` | 3001 | Express server port |
| `NODE_ENV` | test | Environment mode |
| `API_BASE_URL` | http://localhost:3001/api/v1 | Base URL for test requests |
| `FIREBASE_PROJECT_ID` | test-project | Test project identifier |

### Test Configuration (backend/jest.config.js)

```javascript
{
  setupFiles: ['./tests-backend/setup.js'],
  setupFilesAfterEnv: ['./tests-backend/setupAfterEnv.js'],
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: ['src/**/*.js']
}
```

---

## Production Safety & Emulator Safeguards

### Overview

The GroundCTRL project implements automated security safeguards to prevent Firebase emulator configuration variables from being accidentally used in production deployments. This section explains how these safeguards work and what they protect against.

### The Problem

Firebase emulator variables (`FIREBASE_AUTH_EMULATOR_HOST` and `FIRESTORE_EMULATOR_HOST`) are intended **only for local development and testing**. If these variables are accidentally set in a production environment, all Firebase traffic would be routed to non-existent local emulators, causing the application to fail completely.

### The Solution: Automated Startup Check

A validation function in `backend/src/config/firebase.js` provides automated protection:

1. **Checks NODE_ENV**: When `NODE_ENV` is set to `production`
2. **Detects Emulator Variables**: Looks for:
   - `FIREBASE_AUTH_EMULATOR_HOST`
   - `FIRESTORE_EMULATOR_HOST`
3. **Prevents Startup**: If emulator variables are detected in production, the application **fails to start** with a clear error message
4. **Logs Status**: In development/test environments, logs which emulators are configured

### Production Block Error Message

When emulator variables are detected in production mode, you'll see:

```
🚨 PRODUCTION DEPLOYMENT BLOCKED: Firebase Emulator Variables Detected

The following emulator environment variables are set:
  • FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
  • FIRESTORE_EMULATOR_HOST=localhost:8080

These variables MUST NOT be set in production as they would route
all Firebase traffic to non-existent local emulators.

To fix this:
  1. Remove FIREBASE_AUTH_EMULATOR_HOST and FIRESTORE_EMULATOR_HOST 
     from your production environment
  2. Ensure these variables are NOT in backend/apphosting.yaml
  3. These variables should ONLY be set in your local .env file 
     for development

See PRODUCTION_DEPLOYMENT.md for deployment guidelines.
```

### How It Works

**Production Environment (Blocked):**
```javascript
// NODE_ENV=production
// FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
// ❌ Application will FAIL TO START with error message
```

**Development/Test Environment (Allowed):**
```javascript
// NODE_ENV=development or NODE_ENV=test
// FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
// FIRESTORE_EMULATOR_HOST=localhost:8080
// ✅ Application will START successfully
// Console logs: "🔧 Firebase Emulators Configured"
```

### Implementation Files

| File | Purpose |
|------|---------|
| `backend/src/config/firebase.js` | Contains `validateEmulatorConfiguration()` function |
| `backend/apphosting.yaml` | Production config with warning comments |
| `backend/.env.sample` | Template with emulator variables commented out |
| `backend/.env.test` | Test config with emulator variables enabled |
| `backend/tests-backend/emulatorConfigValidation.test.js` | Test suite for validation logic |

### Best Practices

**For Local Development:**
1. Create a local `.env` file (not committed to git)
2. Set `NODE_ENV=development`
3. Uncomment emulator variables if using Firebase emulators:
   ```env
   NODE_ENV=development
   FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
   FIRESTORE_EMULATOR_HOST=localhost:8080
   ```

**For Testing:**
1. Use `.env.test` file (already configured)
2. `NODE_ENV=test` is automatically set by test setup
3. Emulator variables are pre-configured

**For Production:**
1. **Never** add emulator variables to `backend/apphosting.yaml`
2. **Never** set emulator variables in Cloud Run console
3. Set `NODE_ENV=production` (already configured in apphosting.yaml)
4. The automated safeguard will prevent startup if misconfigured

### Testing the Safeguards

Run the safeguard test suite:

```bash
cd backend
npm test tests-backend/emulatorConfigValidation.test.js
```

**Test Coverage:**
- ✅ Application fails to start when emulator variables are set in production
- ✅ Application starts successfully in production without emulator variables
- ✅ Application works with emulator variables in development
- ✅ Application works with emulator variables in test mode
- ✅ Error messages are clear and actionable

### Benefits

1. **Prevents Production Failures** - Catches misconfiguration before deployment
2. **Clear Error Messages** - Developers immediately understand the issue
3. **Automated Protection** - No manual checks required
4. **Development Friendly** - Doesn't interfere with local workflow
5. **Fail-Fast** - Errors caught at startup, not during runtime

---

## Terminal Window Reference

### Summary Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    TESTING ENVIRONMENT                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Terminal 1                Terminal 2              Terminal 3  │
│  ┌─────────────┐           ┌─────────────┐        ┌──────────┐ │
│  │  Firebase   │           │   Backend   │        │  Tests   │ │
│  │  Emulators  │◄──────────│   Server    │◄───────│  (Jest)  │ │
│  │             │           │             │        │          │ │
│  │  :9099 Auth │           │  :3001 API  │        │  npm test│ │
│  │  :8080 DB   │           │             │        │          │ │
│  │  :4000 UI   │           │  npm run dev│        │          │ │
│  └─────────────┘           └─────────────┘        └──────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Start Order

**IMPORTANT:** Start terminals in this order:

1. **Terminal 1** - Firebase Emulators (must start first)
2. **Terminal 2** - Backend Server (requires emulators)
3. **Terminal 3** - Tests (requires both emulators and server)

### Stop Order

**Safe shutdown procedure:**

1. **Terminal 3** - Stop tests (`Ctrl+C`)
2. **Terminal 2** - Stop backend server (`Ctrl+C`)
3. **Terminal 1** - Stop emulators (`Ctrl+C`)

---

## Best Practices

### During Development

1. **Keep emulators running** - No need to restart between test runs
2. **Use watch mode** - `npm run test:watch` for faster iteration
3. **Check Emulator UI** - Inspect data created during tests
4. **Review logs** - Both terminal output and Emulator UI logs

### Before Committing Code

1. **Run full test suite** - `npm test` (not just watch mode)
2. **Check coverage** - Ensure new code is tested
3. **Clear and restart** - Verify tests pass with fresh emulators
4. **Review test output** - Ensure no skipped or pending tests

### Debugging Failed Tests

1. **Isolate the test** - Run single test file: `npm test path/to/test.js`
2. **Check server logs** - Look at Terminal 2 output
3. **Inspect emulator data** - Use Emulator UI at `localhost:4000`
4. **Add console logs** - Temporarily add debugging output
5. **Use debugger** - Node.js debugging with `--inspect` flag

---

## Additional Resources

### Related Documentation

- `FIREBASE_SETUP.md` - Firebase project configuration
- `PRODUCTION_DEPLOYMENT.md` - Deployment guidelines
- `backend/tests-backend/sprint0.md` - Sprint 0 test specifications
- `backend/tests-backend/sprint1.md` - Sprint 1 test specifications

### Useful Commands

```bash
# View all npm scripts
npm run

# Clear Jest cache
npm test -- --clearCache

# Run tests with verbose output
npm test -- --verbose

# Run tests matching pattern
npm test -- --testNamePattern="authentication"

# Update test snapshots
npm test -- --updateSnapshot

# Run tests in specific file
npm test tests-backend/sanity.test.js

# Check Firebase CLI version
firebase --version

# List running Firebase emulators
firebase emulators:start --only auth,firestore
```

---

## Quick Reference Card

### 🚀 Start Testing (3 Commands)

```bash
# Terminal 1
firebase emulators:start

# Terminal 2
cd backend && npm run dev

# Terminal 3
cd backend && npm test
```

### 🔍 Access Points

- **Emulator UI**: http://localhost:4000
- **API Docs**: http://localhost:3001/api-docs
- **API Health**: http://localhost:3001/api/v1/health

### 🛑 Stop Everything

Press `Ctrl+C` in each terminal (3 → 2 → 1)

---

## Version History

- **2026-01-17**: Initial comprehensive testing guide
  - 3-terminal workflow documentation
  - Troubleshooting section
  - Configuration reference
  - Best practices guide

---

*Context improved by Giga AI using mission control protocols information, satellite state model documentation, and training progression system specifications for accurate aerospace operations testing.*
