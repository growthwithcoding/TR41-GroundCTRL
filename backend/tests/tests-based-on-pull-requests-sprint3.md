# Test Checklist Based on Recent Pull Requests

## Current Test Coverage

### Backend
- Unit, integration, and security tests for:
  - Authentication, JWT, OAuth, and token exchange
  - Input validation (Zod, property-based, body size, injection, sort whitelist, query caps)
  - Rate limiting, audit logging, CORS, cookies, headers, health checks
  - Firebase emulator, index enforcement, secret scanning, CI/CD
  - CRUD operations, domain scenarios, satellites, users

### Frontend
- E2E tests for:
  - Theme toggle, navigation, smoke tests, mobile responsiveness, lazy loading, ES module imports
  - Debugging (env vars, network errors, browser)
  - Code splitting, basic rendering, 404 handling

## Areas to Add/Review Based on PRs

### Backend
- Add tests for:
  - New `/auth/sync-oauth-profile` endpoint (PRs 74, 76)
  - Expanded command schemas and commissioning/data management (PR 81)
  - NOVA help endpoint input validation and fallback handling (PR 81, 124)
  - Satellite seed data enhancements and scenario steps (PR 124)
  - Secure email management for OAuth users (PR 76)
  - User profile provider tracking (PR 76)
  - Tightened rate limits (5 req/min login, 100 req/15min API) and security headers (PR #51)
  - New `/health` endpoint functionality (PR #51)
  - GEMINI_API_KEY configuration and NOVA AI fallback behavior (PR #57)

### Frontend
- Add/update tests for:
  - Google sign-in flow and OAuth sync integration (PR 74)
  - Demo scenario E2E workflow (PR 124)
  - NOVA help assistant personalized responses (PR 124)
  - Dependency upgrades and UI changes (PRs 123, 122)
  - Secure account deletion flow with confirmation (PR #58)
  - Backend persistence for user theme preferences (PR #58)
  - Comprehensive E2E test suite update (UI-001 through now) with Playwright (PR #60)

### General
- Ensure E2E tests run full-stack (backend + frontend) as per new workflow (PR 124)
- Update documentation to reflect new/changed test cases
- Integrate Playwright E2E tests into CI/CD pipeline with GitHub Actions (PR #60)
- Add automated test workflows for frontend changes (PR #60)

---

_Review this checklist after each major PR to ensure coverage for new features, security, and integration changes._
