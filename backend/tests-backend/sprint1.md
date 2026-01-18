# Sprint 1 – Authentication & Foundation

> **Test Directory:** `backend/tests-backend/sprint1/`  
> **Run Command:** `npm test -- tests-backend/sprint1`

---

## Overview

Sprint 1 establishes the core authentication system, user registration flow, login with JWT issuance, account lockout protection, Firestore security rules enforcement, and scenario visibility filtering. These tests validate the authentication foundation that all subsequent features depend upon.

---

## Manual Test Charters

### S1 AUTH 001 – Successful User Registration
| Field | Value |
|-------|-------|
| **Purpose** | Validate a new user can register and both `auth_users` and `users` collections are populated |
| **Preconditions** | Email not present in Firebase Auth; emulators or connected project running |
| **Expected** | UI shows welcome screen; two new docs share UID; `users.callSign` auto-generated (e.g., "Pilot alice") |
| **Automation** | ✅ **Automated** – `authenticationFlow.test.js` |

**Steps:**
1. Go to Sign Up page
2. Enter email `alice@example.com` and strong password
3. Submit
4. In Firestore emulator, locate new docs in `auth_users` and `users`

---

### S1 AUTH 002 – Registration Validation Errors
| Field | Value |
|-------|-------|
| **Purpose** | Ensure frontend/backend validation blocks malformed input |
| **Preconditions** | Email not in system; emulators running |
| **Expected** | Validation messages: "Enter a valid email", "Password must be at least 8 characters"; no docs created |
| **Automation** | ✅ **Automated** – `authenticationFlow.test.js` |

**Steps:**
1. Attempt register with `invalid email` and short password
2. Submit
3. Verify appropriate validation errors returned

---

### S1 AUTH 003 – Login Success & JWT Issuance
| Field | Value |
|-------|-------|
| **Purpose** | Confirm login returns JWT and audit log is recorded |
| **Preconditions** | Existing user `alice@example.com`; backend running with emulators |
| **Expected** | JWT present and stored; audit log entry includes userId for `LOGIN_SUCCESS` |
| **Automation** | ✅ **Automated** – `authenticationFlow.test.js` |

**Steps:**
1. Log in with correct credentials
2. Inspect network response for `/api/v1/auth/login`; capture token
3. In Firestore, check `auditLogs` for eventType `LOGIN_SUCCESS`

---

### S1 AUTH 004 – Login Failure & Lockout After 5 Bad Attempts
| Field | Value |
|-------|-------|
| **Purpose** | Verify `loginAttempts` tracks failures and locks account |
| **Preconditions** | Existing user; backend + emulators running |
| **Expected** | After 5 failures, account locked; subsequent attempts rejected with "Account locked" |
| **Automation** | ✅ **Automated** – `authenticationFlow.test.js` |

**Steps:**
1. Attempt login 5 times with wrong password
2. On 6th attempt (correct), observe response
3. Check `loginAttempts` doc for user (`isLocked: true`, `lockedUntil` future)

---

### S1 SEC 001 – Firestore Rule: Users Cannot Read Others' Profiles
| Field | Value |
|-------|-------|
| **Purpose** | Ensure security rules and API prevent cross-user reads |
| **Preconditions** | Authenticated as Alice; obtain ID token; Firestore access |
| **Expected** | Request denied (permission denied); no data returned |
| **Automation** | ✅ **Automated** – `firebaseSecurityRules.test.js` |

**Steps:**
1. Issue REST request for `users/<bob uid>` with Alice's token
2. Observe response is denied
3. Verify only own profile accessible

---

### S1 UI 001 – Dashboard Shows Correct User Context
| Field | Value |
|-------|-------|
| **Purpose** | Verify dashboard displays user call sign and progress |
| **Preconditions** | Logged in as Alice; dashboard route available |
| **Expected** | Header shows callSign; progress widget shows "0 scenarios completed" for new user |
| **Automation** | ✅ **Automated** – `scenarioVisibility.test.js` |

**Steps:**
1. Log in as Alice
2. Access user profile endpoint
3. Verify callSign, email, role, and active status returned

---

### S1 API 001 – GET /api/scenarios Returns Only Active, Public Scenarios
| Field | Value |
|-------|-------|
| **Purpose** | Confirm backend filters scenarios by isActive and isPublic |
| **Preconditions** | Valid JWT; backend running with seeded scenarios |
| **Expected** | Only scenarios with `isActive: true` AND `isPublic: true`; no inactive entries |
| **Automation** | ✅ **Automated** – `scenarioVisibility.test.js` |

**Steps:**
1. Call `/api/v1/scenarios` with Authorization Bearer token
2. Inspect JSON array
3. Verify filtering, pagination, and response format

---

## Automated Test Files

### 📁 `authenticationFlow.test.js`

**Test Suite:** `Sprint 1 – Authentication & Foundation`

#### S1 AUTH 001 – Successful User Registration
| Test Case | Description |
|-----------|-------------|
| `registers user and persists Firestore doc with auto-generated callSign` | Tests full registration flow with auto-generated callSign |
| `registers user with custom callSign and displayName` | Validates custom callSign and displayName persistence |
| `creates audit log entry for successful registration` | Verifies audit trail for registration events |

#### S1 AUTH 002 – Registration Validation Errors
| Test Case | Description |
|-----------|-------------|
| `rejects registration with invalid email format` | Tests email format validation |
| `rejects registration with weak password` | Validates password strength requirements |
| `rejects registration with missing required fields` | Tests required field enforcement |
| `rejects registration with unknown fields (strict mode)` | Validates Zod strict mode rejects extra fields |
| `rejects duplicate email registration` | Prevents duplicate email accounts |
| `creates audit log for failed registration` | Audit trail for failed registration attempts |

#### S1 AUTH 003 – Login Success & JWT Issuance
| Test Case | Description |
|-----------|-------------|
| `logs in user with valid credentials and returns JWT` | Tests successful login flow |
| `creates audit log for successful login` | Verifies LOGIN_SUCCESS audit entries |
| `returns user profile data with login response` | Validates profile data in login response |

#### S1 AUTH 004 – Login Failure & Lockout After 5 Bad Attempts
| Test Case | Description |
|-----------|-------------|
| `rejects login with invalid credentials` | Tests failed login handling |
| `tracks failed login attempts in audit logs` | Verifies LOGIN_FAILED audit entries |
| `locks account after 5 failed login attempts` | Tests account lockout threshold |
| `records lockout expiry time after threshold reached` | Validates lockout timestamp |
| `allows login after lockout period expires` | Tests lockout expiry functionality |
| `normalizes auth error messages to prevent user enumeration` | Security: generic error messages |

---

### 📁 `firebaseSecurityRules.test.js`

**Test Suite:** `S1 SEC 001 – Firestore Security Rules Enforcement`

#### User Profile Access Control
| Test Case | Description |
|-----------|-------------|
| `allows user to read their own profile via API` | Tests self-access to profile |
| `prevents user from reading another user's profile via API` | Cross-user access prevention |
| `prevents unauthorized access to user profiles` | Unauthenticated access blocked |
| `allows user to update their own profile via API` | Tests self-update capability |
| `prevents user from updating another user's profile via API` | Cross-user update prevention |

#### Direct Firestore Access Control
| Test Case | Description |
|-----------|-------------|
| `verifies uid-scoped access at repository level` | Repository-level scoping validation |
| `enforces uid as the only identity anchor in Firestore documents` | UID-based identity enforcement |
| `prevents callSign-based queries in repositories` | No callSign-based lookups allowed |

#### Admin vs Non-Admin Access
| Test Case | Description |
|-----------|-------------|
| `allows non-admin users to only access their own data` | Role-based access control |
| `enforces uid-based scoping in all user operations` | Comprehensive uid scoping |

#### Audit Log Privacy
| Test Case | Description |
|-----------|-------------|
| `ensures audit logs use uid, not email/callSign for identity` | Identity anonymization in logs |
| `prevents users from reading other users' audit logs` | Audit log isolation |

#### Token-Based Authentication
| Test Case | Description |
|-----------|-------------|
| `rejects expired or invalid tokens` | Token validation enforcement |
| `validates JWT signature and payload` | JWT integrity checks |
| `attaches authenticated user to request context` | Request context population |

#### Security Headers and Best Practices
| Test Case | Description |
|-----------|-------------|
| `does not expose sensitive data in error responses` | Error message sanitization |
| `normalizes auth errors to prevent user enumeration` | User enumeration prevention |
| `enforces HTTPS-only cookies in production` | Secure cookie configuration |

---

### 📁 `scenarioVisibility.test.js`

**Test Suite:** `S1 API 001 – Scenario Visibility & Filtering`

#### Public Scenario Visibility
| Test Case | Description |
|-----------|-------------|
| `returns only active AND public scenarios` | Tests isActive AND isPublic filtering |
| `excludes inactive scenarios from results` | Inactive scenario exclusion |
| `excludes private scenarios from public results` | Private scenario exclusion |
| `returns scenarios with proper pagination` | Pagination functionality |
| `allows filtering scenarios by difficulty` | Difficulty filter support |
| `allows filtering scenarios by tier` | Tier filter support |

#### Scenario Detail Access
| Test Case | Description |
|-----------|-------------|
| `allows access to active public scenario details` | Single scenario access |
| `denies access to inactive scenario details` | Inactive scenario protection |
| `allows owner to access their private scenarios` | Owner access to private scenarios |

#### Scenario List Response Format
| Test Case | Description |
|-----------|-------------|
| `returns scenarios with required fields` | Response field validation |
| `follows mission control response format` | Standardized response envelope |
| `includes pagination metadata` | Pagination metadata structure |

#### Authentication Requirements
| Test Case | Description |
|-----------|-------------|
| `requires authentication to access scenarios` | Auth requirement enforcement |
| `rejects invalid authentication tokens` | Invalid token handling |

#### Sorting and Ordering
| Test Case | Description |
|-----------|-------------|
| `supports sorting scenarios by createdAt` | Date-based sorting |
| `supports sorting scenarios by title` | Alphabetical sorting |

#### Error Handling
| Test Case | Description |
|-----------|-------------|
| `returns 404 for non-existent scenario` | Not found handling |
| `handles invalid query parameters gracefully` | Query param validation |
| `rejects unknown query parameters in strict mode` | Strict mode enforcement |

---

**Test Suite:** `S1 UI 001 – Dashboard User Context`

#### User Profile Context
| Test Case | Description |
|-----------|-------------|
| `returns user profile with callSign for dashboard display` | CallSign retrieval for UI |
| `includes user role for permission checks` | Role data for UI permissions |
| `shows active status for dashboard` | Active status display |

#### User Progress and Statistics
| Test Case | Description |
|-----------|-------------|
| `returns user profile data for progress tracking` | Profile data structure |
| `provides user creation timestamp for account age` | Account creation timestamp |

---

## Running Tests

```bash
# Run all Sprint 1 tests
cd backend
npm test -- tests-backend/sprint1

# Run specific test file
npm test -- tests-backend/sprint1/authenticationFlow.test.js
npm test -- tests-backend/sprint1/firebaseSecurityRules.test.js
npm test -- tests-backend/sprint1/scenarioVisibility.test.js

# Run with verbose output
npm test -- tests-backend/sprint1 --verbose
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
| `authenticationFlow.test.js` | 26 | Registration, login, JWT, lockout, token expiration, logout (expanded) |
| `firebaseSecurityRules.test.js` | 17 | Security rules, access control, tokens |
| `scenarioVisibility.test.js` | 22 | Scenario filtering, dashboard context |
| `securityHeaders.test.js` | 16 | CORS, CSP, HTTP headers, debug endpoints (NEW) |
| **Total** | **81** | |

---

## Cross-Reference to Sprint 0

Sprint 1 tests build upon the architectural foundation validated in Sprint 0:

| Sprint 0 Test Suite | Sprint 1 Dependency |
|---------------------|---------------------|
| `backendPhase1IdentityEnforcement.test.js` | UID-based identity used in all auth flows |
| `backendPhase2SecurityQuickWins.test.js` | Rate limiting on login, error normalization |
| `backendPhase3ValidationLayer.test.js` | Zod schemas for registration/login validation |
| `backendPhase4CRUDFactory.test.js` | Response format, pagination, audit logging |
