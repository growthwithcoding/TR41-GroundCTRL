# Sprint 0 – Orientation & Setup

> **Test Directory:** `backend/tests-backend/sprint0/`  
> **Run Command:** `npm test -- tests-backend/sprint0`

---

## Overview

Sprint 0 establishes the foundational development environment, CI/CD pipeline, and Firebase emulator integration. These tests validate that the backend architecture is correctly wired and ready for feature development.

---

## Manual Test Charters

### S0 001 – Verify Repository Cloning & CI Setup
| Field | Value |
|-------|-------|
| **Purpose** | Confirm the Git repository can be cloned and CI (GitHub Actions → Vercel) runs cleanly |
| **Preconditions** | GitHub access; Vercel project linked to repo |
| **Expected** | Commands finish without errors; Actions workflow green; Vercel preview URL produced |
| **Automation** | ❌ Manual only (requires CI/CD infrastructure) |

**Steps:**
1. Clone repo locally
2. Run `npm install` at root for backend and frontend separately
3. Run `npm run lint` and `npm run test` in each package
4. Create a dummy commit/PR to trigger CI; monitor GitHub Actions and Vercel deploy

---

### S0 002 – Verify Vite Development Server Starts
| Field | Value |
|-------|-------|
| **Purpose** | Ensure frontend dev server boots and serves the app |
| **Preconditions** | Frontend dependencies installed; port 5173 free |
| **Expected** | No console errors; page loads within 2 seconds |
| **Automation** | ❌ Manual only (requires browser/UI) |

**Steps:**
1. From `frontend/`, run `npm run dev`
2. Open `http://localhost:5173` in Chrome
3. Confirm landing page renders (logo, "Sign In" button)

---

### S0 003 – Verify Firebase Emulator Configuration
| Field | Value |
|-------|-------|
| **Purpose** | Confirm Firebase Auth and Firestore emulators are wired to the backend API |
| **Preconditions** | Firebase CLI installed; backend `.env` configured with emulator ports |
| **Expected** | Auth user created; Firestore doc mirrors UID; API responds without credential errors |
| **Automation** | ✅ **Automated** – `firebaseEmulator.test.js` |

**Steps:**
1. Start emulators: `firebase emulators:start`
2. Start API: `npm run dev`
3. Create test user in Auth emulator
4. Verify Firestore doc created with matching UID
5. Test API health endpoint connectivity

---

## Automated Test Files

### 📁 `firebaseEmulator.test.js`

**Test Suite:** `S0 003 – Firebase Emulator Configuration`

| Test Case | Description |
|-----------|-------------|
| `verifies emulators are running and accessible` | Confirms Auth emulator responds and Firestore is connectable |
| `creates a user via Auth emulator and returns a UID` | Tests Firebase Auth user creation with valid UID generation |
| `writes Firestore doc with same UID in users collection` | Verifies UID consistency between Auth and Firestore |
| `API connects to emulators without credential errors` | Tests `/api/v1/health` responds with `operational` status |
| `properly handles emulator environment isolation` | Ensures NODE_ENV ≠ production and localhost connections |

---

### 📁 `backendPhase1IdentityEnforcement.test.js`

**Test Suite:** `Phase 1 – Identity Enforcement`

| Test Case | Description |
|-----------|-------------|
| `allows duplicate callSign across users` | Verifies callSign is not a unique constraint |
| `rejects callSign-based targeting for lookups/updates` | Ensures no `/users/callsign/:callSign` routes exist |
| `uses uid for all auth/user CRUD operations` | Confirms repository methods use uid exclusively |
| `ensures audit logs record actor uid, not callSign/email` | Validates audit trail identity format |
| `prevents cross-user access by uid scoping` | Tests ownership-based access control |

---

### 📁 `backendPhase2SecurityQuickWins.test.js`

**Test Suite:** `Phase 2 – Security Quick Wins`

| Test Case | Description |
|-----------|-------------|
| `applies global API rate limit to /api/v1 routes` | Verifies rate limiter middleware configuration |
| `applies login-specific rate limit window/max` | Tests stricter limits on `/auth/login` (5 per 15 min) |
| `sets outbound HTTP client timeout from env and enforces it` | Confirms HTTP_TIMEOUT_MS is applied |
| `normalizes auth errors in production (no sensitive details)` | Tests generic error messages prevent user enumeration |
| `maintains pagination output shape after correctness fixes` | Validates response structure consistency |
| `enforces outbound HTTP timeout by aborting long requests` | Tests timeout enforcement on external calls |

---

### 📁 `backendPhase3ValidationLayer.test.js`

**Test Suite:** `Phase 3 – Validation Layer`

| Test Case | Description |
|-----------|-------------|
| `rejects unknown fields via Zod .strict() for bodies/params/query` | Tests strict schema validation |
| `caps pagination limit to 100 and normalizes page/limit` | Validates MAX_PAGE_LIMIT enforcement |
| `whitelists sortBy/query fields and rejects others` | Tests sort field validation |
| `returns consistent validation error payload shape` | Verifies 422 error response structure |
| `enforces strict mode on all schemas` | Confirms no schema allows unknown keys |
| `validates query parameters with proper types and constraints` | Tests query param coercion and validation |

---

### 📁 `backendPhase4CRUDFactory.test.js`

**Test Suite:** `Phase 4 – CRUD Factory`

| Test Case | Description |
|-----------|-------------|
| `returns pagination metadata with MAX_PAGE_LIMIT enforcement` | Tests pagination response shape |
| `applies ownership scoping hook for non-admin users` | Validates ownership-based filtering |
| `executes lifecycle hooks (before/after create/update/patch/delete/read)` | Tests hook execution order |
| `logs audits with req.user?.uid or "ANONYMOUS"` | Verifies audit logging captures actor |
| `maintains mission-control response format via responseFactory` | Tests standardized response envelope |
| `handles errors gracefully and passes to error handler` | Validates error propagation |

---

## Running Tests

```bash
# Run all Sprint 0 tests
cd backend
npm test -- tests-backend/sprint0

# Run specific test file
npm test -- tests-backend/sprint0/firebaseEmulator.test.js

# Run with verbose output
npm test -- tests-backend/sprint0 --verbose
```

---

## Environment Prerequisites

| Variable | Value | Description |
|----------|-------|-------------|
| `FIREBASE_AUTH_EMULATOR_HOST` | `localhost:9099` | Auth emulator connection |
| `FIRESTORE_EMULATOR_HOST` | `localhost:8080` | Firestore emulator connection |
| `API_BASE_URL` | `http://localhost:3001/api/v1` | Backend API endpoint |
| `NODE_ENV` | `test` | Environment mode |

---

## Test File Summary

| File | Tests | Purpose |
|------|-------|---------|
| `firebaseEmulator.test.js` | 5 | Firebase emulator wiring validation |
| `backendPhase1IdentityEnforcement.test.js` | 5 | UID-based identity architecture |
| `backendPhase2SecurityQuickWins.test.js` | 6 | Security hardening & rate limits |
| `backendPhase3ValidationLayer.test.js` | 6 | Input validation & Zod schemas |
| `backendPhase4CRUDFactory.test.js` | 6 | CRUD patterns & response format |
| **Total** | **28** | |
