# GroundCTRL – QA Test Plan  

*Version: 1.0.0* *Created: 2026‑01‑27* *Target PRs: #3, #7, #8, #9, #10, #11, #14, #20, #30‑#35, #39‑#41, #43, #45‑#48*  

---

## Table of Contents
- [1️⃣ Project‑wide / Tooling Tests](#1️⃣-project‑wide--tooling-tests)  
- [2️⃣ Front‑end Architecture & UI](#2️⃣-frontend-architecture--ui)  
- [3️⃣ Backend Authentication & Authorization](#3️⃣-backend-authentication--authorization)  
- [4️⃣ Validation & Schema Hardening](#4️⃣-validation--schema-hardening)  
- [5️⃣ CRUD Factory Hardening](#5️⃣-crud-factory-hardening)  
- [6️⃣ Domain‑Specific Additions (Sat / Help / AI)](#6️⃣-domain‑specific-additions-sat--help--ai)  
- [7️⃣ Firebase / Emulator & Environment Config](#7️⃣-firebase--emulator--environment-config)  
- [8️⃣ Rate‑Limiter & Global Middleware](#8️⃣-rate‑limiter--global-middleware)  
- [9️⃣ CI/CD Workflow & Deployment Checks](#9️⃣-ci‑cd-workflow--deployment-checks)  
- [🔟 Security‑Focused Tests](#🔟-security‑focused-tests)  
- [1️⃣1️⃣ Performance / Load Tests](#1️⃣1️⃣-performance--load-tests)  
- [1️⃣2️⃣ Regression / Smoke Tests](#1️⃣2️⃣-regression--smoke-tests)  
- [📋 How to Execute the Tests](#📋-how-to-execute-the-tests)  
- [🔗 References](#🔗-references)

---  

> **Note** – All automated tests should be run **against the `.env.test` configuration** (Firebase emulators enabled, `HTTP_CLIENT_TIMEOUT_MS=8000`, `RATE_LIMIT_GLOBAL=100/15min`, etc.).  
> For production‑like runs, clear the emulator vars and use real credentials.

---

## 1️⃣ Project‑wide / Tooling Tests  

| ID | Related PR(s) | Test Type | Description | Expected Result |
|----|---------------|----------|-------------|-----------------|
| T‑001 | #7 | CI/CD – Lint | Run `npm run lint` (ESLint 9.39.2). | **0** errors, **0** warnings. |
| T‑002 | #7 | CI/CD – Unit | Run `npm test`. | All Jest tests pass (green). |
| T‑003 | #7 | CI/CD – Dependency | Verify `package-lock.json` lists Jest 30.2.0. | Jest version appears under `devDependencies`. |
| T‑004 | #45 | CI/CD – Build | Execute `npm run build` (Vite 5) and `npm run preview`. | Build succeeds; preview serves `/` with **200** and no console errors. |
| T‑005 | #47 | CI/CD – Import Style | Lint for explicit namespace imports (`import * as React from 'react'`). | No import‑style violations. |
| T‑006 | #47 | CI/CD – LF Line Endings | Run `git diff --check` after a clean checkout. | No **CRLF** warnings. |

---

## 2️⃣ Front‑end Architecture & UI  

| ID | Related PR(s) | Test Type | Description | Expected Result |
|----|---------------|----------|-------------|-----------------|
| UI‑001 | #3, #45 | E2E | Load the app; verify Navbar, Footer, Home page render without JS errors. | All three components visible; console‑free. |
| UI‑002 | #39 | E2E | Login with valid credentials → redirect to Home; avatar appears. | 302 → Home; Navbar shows avatar. |
| UI‑003 | #39 | E2E | Login with invalid credentials (prod mode). Verify generic error (`Invalid credentials`). | Error displayed; no hint of email existence. |
| UI‑004 | #39 | E2E | Register a new user with a **duplicate callSign**. Verify registration succeeds. | 201 Created; both users share same callSign. |
| UI‑005 | #45 | E2E | Navigate from `/login` to `/register`; confirm a new JS chunk is fetched. | New chunk request (e.g., `register.[hash].js`). |
| UI‑006 | #45 | E2E | Check Tailwind class `bg-primary` is applied to the login button. | Computed style matches Tailwind config. |
| UI‑007 | #45 | E2E | Mobile view (≤480 px): hamburger menu appears & toggles drawer. | Hamburger visible; click toggles navigation. |
| UI‑008 | #47 | E2E | Scan built bundle for `require('react')`; ensure only ES‑module imports exist. | No CommonJS `require` for React. |

---

## 3️⃣ Backend Authentication & Authorization  

| ID | Related PR(s) | Test Type | Description | Expected Result |
|----|---------------|----------|-------------|-----------------|
| AUTH‑001 | #3, #8 | Integration | `POST /api/v1/users` with unique email, duplicate callSign, password. | 201, envelope `{ data: { uid, token } }`. |
| AUTH‑002 | #8 | Integration | `PATCH /api/v1/users/:uid` changing callSign to an existing one. | 200, callSign updated – no conflict error. |
| AUTH‑003 | #8 | Integration | Attempt GET `/api/v1/users?callSign=xyz`. | **404 Not Found** – no callSign lookup. |
| AUTH‑004 | #9 | Integration | Send **101** requests to any `/api/v1/*` route from same IP (15 min window). | 429 Too Many Requests on 101‑st, `Retry-After: 900`. |
| AUTH‑005 | #31 | Integration | 6 failed login attempts from same IP **different emails**. | Each email limited independently → 5×401, 6th email still 401. |
| AUTH‑006 | #31 | Integration | 6 failed logins from same IP **same email**. | 429 on 6th attempt (lockout). |
| AUTH‑007 | #9 | Integration | In `NODE_ENV=production`, login with non‑existent email → generic error. | 401, envelope `{ error: { message: 'Invalid credentials' } }`. |
| AUTH‑008 | #9 | Integration | In `NODE_ENV=development`, login with non‑existent email → detailed Firebase error. | 401, envelope includes `auth/user-not-found`. |
| AUTH‑009 | #40 | Integration | `POST /api/v1/ai/help/ask` **without** Authorization header, valid payload. | 200, envelope `{ data: { conversationId, answer } }`. |
| AUTH‑010 | #40 | Integration | 21st request to `/ai/help/ask` (rate‑limit 20/5 min). | 429 Too Many Requests. |
| AUTH‑011 | #41 | Integration | Simulate Firebase init failure → server should start, health endpoint reports degraded. | Server up; `/health` → `"firebase":"degraded"`; other routes work. |
| AUTH‑012 | #41 | Integration | Normal start with valid Firebase ➜ health is healthy. | `/health` → `{ status:'ok', firebase:'healthy' }`. |
| AUTH‑013 | #30 / #31 | Integration | Verify **response envelope** (`{ data: … }` or `{ error: … }`) on any endpoint. | Uniform envelope across all routes. |
| AUTH‑014 | #9 | Integration | Mock an external call > 8 s (using `nock`). Verify timeout → 504 wrapped in envelope. | 504, `{ error:{ message:'External service timeout' } }`. |
| AUTH‑015 | #31 | Integration | Set `HTTP_CLIENT_RETRY_ATTEMPTS=3`; mock a flaky service (2 failures, 1 success). Verify 2 retries then success. | 200; logs show 2 retries. |

---

## 4️⃣ Validation & Schema Hardening  

| ID | Related PR(s) | Test Type | Description | Expected Result |
|----|---------------|----------|-------------|-----------------|
| VAL‑001 | #10 | Unit | `validate` middleware with **valid** body (matches Zod). | Calls `next()` → request proceeds. |
| VAL‑002 | #10 | Unit | `validate` with **unknown field** (`extra`). | 400, error mentions the unknown key. |
| VAL‑003 | #10 | Unit | Query `limit=150` (> 100). | 400, message “limit must be ≤ 100”. |
| VAL‑004 | #10 | Unit | Query `sortBy` not in whitelist. | 400, “Invalid sortBy value”. |
| VAL‑005 | #10 | Integration | Params validation – invalid UID format in `GET /api/v1/users/:uid`. | 400, UID format error. |
| VAL‑006 | #10 | Integration | Body validation – missing required `email` on user creation. | 400, Zod error “email is required”. |
| VAL‑007 | #10 | Integration | Valid body **plus** extra fields (`extra`). | 400, unknown field rejection (strict mode). |
| VAL‑008 | #10 | Integration | Successful validation – confirm controller receives **typed** data (e.g., numbers as numbers). | Controller receives correctly typed payload. |

---

## 5️⃣ CRUD Factory Hardening  

| ID | Related PR(s) | Test Type | Description | Expected Result |
|----|---------------|----------|-------------|-----------------|
| CRUD‑001 | #11 | Unit | Spy on `ownershipScope` hook for `GET /api/v1/satellites`. Verify filter `{ ownerUid: <uid> }` is added. | Hook called; query contains ownership filter. |
| CRUD‑002 | #11 | Unit | Verify order of lifecycle hooks: `beforeCreate → create → afterCreate`. | Hook order matches expectation. |
| CRUD‑003 | #11 | Unit | Pagination normalisation: `page=0&limit=200`. | Response contains `page=1`, `limit=100`. |
| CRUD‑004 | #11 | Unit | After creating a user, audit log entry includes `performedBy` (`uid` or `'ANONYMOUS'`). | Audit document exists with correct metadata. |
| CRUD‑005 | #11 | Unit | `afterRead` adds custom metadata (`readAt`). | Response `data` includes `readAt` timestamp. |
| CRUD‑006 | #11 | Integration | PATCH request triggers `beforePatch` & `afterPatch`. Use a mock to verify both run. | Both hooks invoked; patch applied only if `beforePatch` passes. |
| CRUD‑007 | #11 | Integration | Attempt to delete another user’s record (ownership mismatch). | 403 Forbidden, envelope with “Not authorized”. |
| CRUD‑008 | #11 | Integration | Verify **max page limit** (100) enforced on all factory‑generated list endpoints. | Returned list size ≤ 100; DB not overloaded. |

---

## 6️⃣ Domain‑Specific Additions (Sat / Help / AI)  

| ID | Related PR(s) | Test Type | Description | Expected Result |
|----|---------------|----------|-------------|-----------------|
| SAT‑001 | #14 | Integration | `POST /api/v1/satellites` with required fields. | 201, response includes `sid`; DB entry created. |
| SAT‑002 | #14 | Integration | `GET /api/v1/satellites/:sid` for non‑existent sid. | 404, envelope `{ error:{ message:'Satellite not found' } }`. |
| HELP‑001 | #48 | Integration | Run `node seeders/index.js` (help seeder). Verify expected number of categories/articles/FAQs are created. | Count matches seed file; DB populated. |
| HELP‑002 | #48 | Integration | Query a collection that **requires** the new composite index (`WHERE category==X AND createdAt>=today`). | Query succeeds – no “requires index” error. |
| AI‑001 | #40 | Integration | `POST /ai/help/ask` with missing `question`. | 400, validation error. |
| AI‑002 | #40 | Integration | Send a request with a `conversationId` and then another with the same ID → treats as continuation. | 200, answer reflects prior context. |
| AI‑003 | #40 | Performance | 50 concurrent requests to `/ai/help/ask` from same IP. | 20 × 200, 30 × 429 (rate‑limit). |
| AI‑004 | #40 | Security | Attempt script injection in `question` (`<script>alert(1)</script>`). | Response does **not** contain raw script; no XSS. |

---

## 7️⃣ Firebase / Emulator & Environment Config  

| ID | Related PR(s) | Test Type | Description | Expected Result |
|----|---------------|----------|-------------|-----------------|
| FIRE‑001 | #20 | Integration | Start backend with `FIREBASE_EMULATOR_HOST` vars. Verify connection to Auth (9099) & Firestore (8080) emulators. | Logs show successful emulator connections. |
| FIRE‑002 | #20 | Integration | Start without emulator vars **and** without service‑account creds. Expect graceful failure. | Process exits with clear “Missing Firebase credentials” error. |
| FIRE‑003 | #30 | CI/CD | Run GitHub Action `firebase-emulator-test.yml` (workflow_dispatch). Verify steps: deps → emulator start → `npm test` → lint → PR comment. | Workflow ✅, comment posted on PR. |
| FIRE‑004 | #31 | Integration | Set `HTTP_CLIENT_TIMEOUT_MS=1000`; mock remote call > 1500 ms. Verify timeout obeys env var. | 504 (or custom) after 1 s. |
| FIRE‑005 | #32 | Integration | Deploy to Cloud Run (`PORT=8080`). Verify server binds immediately to `0.0.0.0:8080`. | `netstat` shows listening on 0.0.0.0:8080; no port‑search logic executed. |
| FIRE‑006 | #34 | Integration | Production mode – ensure Firebase Admin uses **Application Default Credentials** (no service‑account file). | Log: “Using ADC for Firebase admin”. |
| FIRE‑007 | #34 | Integration | Development mode – set `FIREBASE_SERVICE_ACCOUNT_PATH`; verify file is read. | Log shows “Loading service account from …”. |
| FIRE‑008 | #30 | CI/CD | Verify Firebase Secret Manager vars are passed to deployment steps (masked in logs). | Secrets used without leaking values; deployment succeeds. |

---

## 8️⃣ Rate‑Limiter & Global Middleware  

| ID | Related PR(s) | Test Type | Description | Expected Result |
|----|---------------|----------|-------------|-----------------|
| LIM‑001 | #9 | Unit | Issue 100 requests from same IP; verify internal counters reset after 15 min window. | After 15 min the 101‑st request succeeds. |
| LIM‑002 | #31 | Unit | Import `createRateLimiter` from `src/middleware/rateLimiter.js`. | Import succeeds; exported value is a function. |
| LIM‑003 | #43 | Integration | Temporarily remove `createRateLimiter` export; run CI. Verify build fails with clear “Cannot find module” error. | CI step fails, error logged. |
| LIM‑004 | #31 | Integration | With `RATE_LIMIT_GLOBAL=100/15min` & `RATE_LIMIT_LOGIN=5/15min`, attempt 5 failed logins (same email) → allowed, 6th → blocked. Global limiter still permits other requests. | 429 from login limiter only. |
| LIM‑005 | #31 | Integration | Verify `Retry-After` header present on 429 responses, containing correct seconds remaining. | Header present, numeric value matches remaining window. |

---

## 9️⃣ CI/CD Workflow & Deployment Checks  

| ID | Related PR(s) | Test Type | Description | Expected Result |
|----|---------------|----------|-------------|-----------------|
| CI‑001 | #30 | CI/CD | Push to `main`; trigger `firebase-hosting-merge.yml`. Verify lint → build → deploy → PR comment with URL. | Workflow ✅, comment with production URL. |
| CI‑002 | #30 | CI/CD | Open a PR; trigger `firebase-hosting-pull-request.yml`. Verify preview channel creation & comment with preview URL. | Preview deployed; comment contains link. |
| CI‑003 | #43 | CI/CD | Introduce a failing Jest test; run `firebase-emulator-test.yml`. Verify workflow marks PR **failed** and posts detailed comment. | Red check, comment with failures. |
| CI‑004 | #43 | CI/CD | Add a lint error; ensure lint step fails before test step. | Lint step fails, test step skipped. |
| CI‑005 | #43 | CI/CD | Enable concurrency cancellation; fire two identical runs. Verify the earlier run is cancelled. | Earlier run status = `cancelled`. |

---

## 🔟 Security‑Focused Tests  

| ID | Related PR(s) | Test Type | Description | Expected Result |
|----|---------------|----------|-------------|-----------------|
| SEC‑001 | #8 | Security | Try `GET /api/v1/users?callSign=known`. Verify endpoint does not exist. | 404, no user data disclosed. |
| SEC‑002 | #9 | Security | In prod, trigger auth error → confirm generic message only. | “Invalid credentials” only. |
| SEC‑003 | #31 | Security | Measure response time for existent vs non‑existent users during login attempts; confirm no timing leak. | No statistically significant difference. |
| SEC‑004 | #40 | Security | Submit payload `question` > 4096 bytes. Verify request rejected. | 400, error mentions length limit. |
| SEC‑005 | #41 | Security | Simulate Firebase connection loss; health endpoint shows degraded mode but other routes still serve. | Health → `"firebase":"degraded"`; other routes return 200. |
| SEC‑006 | #48 | Security | Run Firestore security rules test that attempts a disallowed read. Expect denial. | 403 Forbidden. |
| SEC‑007 | #31 | Security | Verify response envelope in prod does **not** contain stack traces. | 500 responses → `{ error:{ message:'Internal server error' } }`. |
| SEC‑008 | #45 | Security | Run `npm audit`; ensure no critical/high vulnerabilities. | Audit passes or only low‑severity findings. |

---

## 1️⃣1️⃣ Performance / Load Tests  

| ID | Related PR(s) | Test Type | Description | Expected Result |
|----|---------------|----------|-------------|-----------------|
| PERF‑001 | #9 | Load | 500 concurrent requests to a protected endpoint (`/api/v1/users/me`). | Average response ≤ 5 s; 429 after limit reached. |
| PERF‑002 | #31 | Load | 200 rps to login endpoint from 1 IP; after 5 failed attempts per email, expect lockout. | First 5 attempts → 401; thereafter → 429 per email. |
| PERF‑003 | #40 | Load | 100 concurrent public‑help AI requests (limit 20/5 min). | 20 × 200, 80 × 429; server remains stable. |
| PERF‑004 | #11 | Load | Paginated list with `limit=100` over 10 pages; verify ≤ 300 ms per page. | Each page ≤ 300 ms. |
| PERF‑005 | #34 | Load | Deploy to Cloud Run with autoscaling; burst 1000 requests/min; confirm scaling to `max‑instances` without 5xx errors. | Instances increase; 200 responses, no 500s. |

---

## 1️⃣2️⃣ Regression / Smoke Tests  

| ID | Related PR(s) | Test Type | Description | Expected Result |
|----|---------------|----------|-------------|-----------------|
| SM‑001 | All | Smoke | Start backend & frontend using `.env.test`; hit `/health` and load home page. | Health 200 `"ok"`; frontend home loads (200). |
| SM‑002 | #8, #9 | Regression | Login with a user that has a duplicate `callSign`. | 200, token returned – callSign ignored. |
| SM‑03 | #10, #11 | Regression | Run full Jest suite (`npm test`). | All tests green. |
| SM‑04 | #30, #31, #43 | Regression | Execute full GitHub Actions CI pipeline on a fresh commit. | All stages pass. |
| SM‑05 | #45 | Regression | Serve production build (`serve -s dist`). Verify deep‑link routes (`/login`, `/register`) return 200. | SPA fallback works; 200 for each route. |
| SM‑06 | #41 | Regression | Stop Firebase emulator; start server; health shows degraded; static routes still work. | Health → `"firebase":"degraded"`; other routes 200. |
| SM‑07 | #48 | Regression | Run `node seeders/seedScenarios.js --dry-run`. Verify only logs, no DB writes. | Log output only; no data persisted. |
| SM‑08 | #39 | Regression | Verify that after UI changes, the **Navbar** correctly reflects auth state (logged‑in vs logged‑out). | Avatar shown when logged in; login/register links when not. |

---

## 📋 How to Execute the Tests  

### 1. Prerequisites  
| Tool | Version (as of PR) |
|------|--------------------|
| Node.js | `>= 20.x` |
| npm / pnpm | `>= 9.x` |
| Firebase CLI | `>= 13.x` |
| Docker (for emulators) | `>= 24.x` |
| Cypress (or Playwright) | `>= 13.x` |
| k6 / Artillery (optional) | latest |

### 2. Local Test Run  

```bash
# Install deps (uses lockfile)
npm ci          # or pnpm i --frozen-lockfile

# Lint
npm run lint

# Unit / Integration (Jest)
npm test

# Start Firebase emulators (in a separate terminal)
firebase emulators:start --only auth,firestore

# Run backend (test env)
cp backend/.env.sample backend/.env.test
npm run dev   # backend

# Run frontend (test env)
cd frontend
npm run dev   # Vite dev server

# End‑to‑End (Cypress example)
npx cypress open   # UI mode
npx cypress run    # headless CI mode
```

### 3. CI Integration  

* Add the following jobs to your GitHub Actions workflow (example snippets):*  

```yaml
# .github/workflows/ci.yml
jobs:
  lint:
    runs-on: ubuntu-latest
    steps: [ checkout, setup-node, npm ci, npm run lint ]

  test:
    runs-on: ubuntu-latest
    services:
      firebase:
        image: firebase-emulator:latest   # custom Docker image with emulators
        ports: [9099, 8080]
    steps: [ checkout, setup-node, npm ci, npm run test ]

  e2e:
    runs-on: ubuntu-latest
    needs: [test]
    steps: [ checkout, setup-node, npm ci, npx cypress run ]

  deploy:
    runs-on: ubuntu-latest
    needs: [e2e]
    if: github.ref == 'refs/heads/main'
    steps: [ checkout, setup-node, npm ci, firebase deploy ... ]
```

### 4. Performance / Load (Manual)  

```bash
# k6 example
k6 run load-tests/auth-rate-limit.k6.js
```

The scripts live under `load-tests/` (not in repo yet – create as needed).

### 5. Reporting  

* All test results are published as GitHub Check annotations.  
* Cypress generates a `cypress/results` JSON/HTML report that can be uploaded as an artifact.  
* Performance scripts should output a markdown summary that can be posted back to the PR via the `actions/github-script` step.

---

## 🔗 References  

| PR | Description |
|----|-------------|
| #3 | Front‑end restructure & Backend API initial commit |
| #7 | Upgrade to ESLint 9, Jest 30, flat config |
| #8 | CallSign uniqueness removed; UID‑only lookups |
| #9 | Global rate limiting, HTTP client timeout, auth error normalizer |
| #10 | Zod‑based strict validation middleware |
| #11 | CRUD factory hardening – hooks, pagination, audit |
| #14 | Added Sat domain |
| #20 | Firebase setup – env‑based config, emulator support |
| #30 | CI/CD – automated Firebase Hosting & emulator workflows |
| #31 | Response envelope, login rate‑limit (IP + email), retry/timeout config |
| #32 | Cloud Run port‑binding fix |
| #34 | Firebase Admin credential handling (ADC) & simplified start‑up |
| #35 | v1.6.0 release – core domains, help seeder, auth placeholders |
| #39 | Front‑end UI – routing, forms, Material UI, Bootstrap |
| #40 | Public help AI endpoint – anonymous sessions, stricter limits |
| #41 | Graceful degradation on Firebase init failure |
| #43 | Backend bug fix (missing rate‑limiter export) + CI enhancements |
| #45 | Full migration to React + Vite, Tailwind, shadcn/ui |
| #47 | UI import style standardisation, line‑ending config |
| #48 | Composite Firestore index, WebSocket dev endpoints, seeder script |

*All PR numbers in this document are hyper‑linked when viewed on GitHub (`#3`, `#7`, …) and will resolve to the respective pull‑request pages.*  

---  

*End of test plan.*  