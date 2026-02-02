# Security & Quality Roadmap - GroundCTRL

**Project:** GroundCTRL - Satellite Operations Training Platform  
**Stack:** Frontend (React + Vite) | Backend (Node.js + Express)  
**Goal:** Enterprise-grade security, quality, and observability  
**Last Updated:** 2/1/2026

---

## 🎯 Executive Summary

This roadmap provides a comprehensive, security-first plan to transform GroundCTRL into a production-ready application that passes all GitHub AI bot checks, security scans, and industry best practices. The approach is prioritized and incremental, allowing for safe implementation without disrupting ongoing development.

### Key Objectives:
1. **Security-First:** Remove secrets, enable SAST/SCA, tighten auth/session flows
2. **CI/Checks:** GitHub Actions + CodeQL + Dependabot for automated quality gates
3. **Code Quality:** Strict linting, comprehensive testing, type safety
4. **Infrastructure:** Secure Docker, SBOM generation, observability
5. **Simulator UI:** Responsive, performant, accessible controls with robust WebSocket UX

---

## 📋 Implementation Phases

### Phase 0 — Immediate (Critical Security & Repo Hygiene) 🔴

**Priority:** CRITICAL  
**Timeline:** 1-2 weeks  
**Why:** GitHub security bots will flag these as HIGH priority

#### 0.1 Secrets & Credentials
**Status:** 🔴 REQUIRED

**Tasks:**
- [ ] Run repo-wide secret scan using trufflehog or git-secrets
- [ ] Enable GitHub Secret Scanning in repository settings
- [ ] Review git history for accidentally committed secrets
- [ ] If secrets found: Use BFG Repo-Cleaner or git-filter-repo to remove from history
- [ ] Rotate ALL compromised credentials immediately
- [ ] Migrate secrets to secrets manager (GitHub Secrets for CI, env vars for local)
- [ ] Create `.env.example` files with dummy values
- [ ] Document secret management in README

**Acceptance Criteria:**
- ✅ No secrets detected by GitHub secret scanning
- ✅ Proof of rotated credentials documented
- ✅ All secrets in secrets manager (not in code)
- ✅ `.env` files in `.gitignore`

**Tools:**
- trufflehog: `docker run --rm -v $(pwd):/repo trufflesecurity/trufflehog filesystem /repo`
- git-secrets: `git secrets --scan-history`
- BFG: `bfg --delete-files secret.key`

---

#### 0.2 Lockfile & Dependency Hygiene
**Status:** 🟡 IN PROGRESS

**Tasks:**
- [x] Ensure `package-lock.json` checked in (frontend & backend)
- [ ] Enable Dependabot via `.github/dependabot.yml`
- [ ] Configure Dependabot for: npm, Docker, GitHub Actions
- [ ] Run initial `npm audit` and document vulnerabilities
- [ ] Create mitigation plan for high/critical vulnerabilities
- [ ] Consider switching to `pnpm` for faster, more secure installs

**Acceptance Criteria:**
- ✅ Dependabot enabled with weekly checks
- ✅ Lockfile present in both frontend and backend
- ✅ No high or critical open vulnerabilities (or documented exceptions)
- ✅ Automated PRs from Dependabot being reviewed

**Dependabot Config Template:**
```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/frontend"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5
    
  - package-ecosystem: "npm"
    directory: "/backend"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5
    
  - package-ecosystem: "docker"
    directory: "/"
    schedule:
      interval: "weekly"
      
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
```

---

#### 0.3 Code Scanning (SAST)
**Status:** 🟢 COMPLETED (CodeQL enabled)

**Tasks:**
- [x] Enable CodeQL for JavaScript/Node.js
- [ ] Configure CodeQL to run on all PRs
- [ ] Set up baseline and triage existing alerts
- [ ] Add ESLint security plugin (`eslint-plugin-security`)
- [ ] Configure security rules in `.eslintrc`
- [ ] Add Snyk or similar for dependency scanning

**Acceptance Criteria:**
- ✅ CodeQL runs in CI on every PR
- ✅ Baseline alerts triaged and assigned owners
- ✅ ESLint security rules enforced
- ✅ No new HIGH severity alerts introduced

**ESLint Security Config:**
```javascript
{
  "plugins": ["security"],
  "extends": ["plugin:security/recommended"],
  "rules": {
    "security/detect-object-injection": "warn",
    "security/detect-non-literal-regexp": "warn",
    "security/detect-unsafe-regex": "error"
  }
}
```

---

#### 0.4 License & Repo Metadata
**Status:** 🟡 PARTIAL

**Tasks:**
- [x] `LICENSE` file exists
- [ ] Create `SECURITY.md` with vulnerability reporting process
- [ ] Create `CODE_OF_CONDUCT.md`
- [ ] Update `CONTRIBUTING.md` with security guidelines
- [ ] Add security contact email in SECURITY.md
- [ ] Document responsible disclosure policy

**Acceptance Criteria:**
- ✅ All required files present and up to date
- ✅ Security contact clearly documented
- ✅ Process for reporting vulnerabilities defined

**SECURITY.md Template:**
```markdown
# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

**DO NOT** create a public GitHub issue for security vulnerabilities.

Instead, email: security@groundctrl.org (or your security contact)

We will respond within 48 hours.
```

---

### Phase 1 — CI/CD / Dev Tooling (GitHub AI Bot Expectations) 🟡

**Priority:** HIGH  
**Timeline:** 2-3 weeks  
**Why:** Ensures deterministic, strict checks that bots expect

#### 1.1 GitHub Actions Workflows
**Status:** 🟡 PARTIAL

**Required Workflows:**

1. **`ci.yml` - Main CI Pipeline**
   ```yaml
   name: CI
   on: [push, pull_request]
   jobs:
     frontend:
       - Install dependencies
       - Run ESLint
       - Run type check (if TS)
       - Run unit tests
       - Build production bundle
       - Fail if any step fails
     
     backend:
       - Install dependencies
       - Run ESLint
       - Run unit tests
       - Run integration tests
       - Check code coverage threshold
       - Fail if any step fails
   ```

2. **`security.yml` - Security Scanning**
   ```yaml
   name: Security
   on: [push, pull_request]
   jobs:
     codeql:
       - Run CodeQL analysis
     
     dependencies:
       - Run npm audit
       - Run Snyk test (optional)
       - Fail on high/critical
   ```

3. **`e2e.yml` - End-to-End Tests**
   ```yaml
   name: E2E Tests
   on: [push, pull_request]
   jobs:
     playwright:
       - Start backend server
       - Start frontend dev server
       - Run Playwright tests
       - Upload screenshots/videos on failure
   ```

**Acceptance Criteria:**
- ✅ All workflows run on PR and push to main
- ✅ Branch protection requires passing checks
- ✅ Failing checks block merge
- ✅ Clear error messages when checks fail

---

#### 1.2 Pre-commit Hooks
**Status:** 🔴 NOT STARTED

**Tasks:**
- [ ] Install Husky: `npm install -D husky`
- [ ] Install lint-staged: `npm install -D lint-staged`
- [ ] Configure pre-commit hook
- [ ] Run ESLint with `--fix` on staged files
- [ ] Run Prettier with `--write` on staged files
- [ ] Run fast type check (no emit)
- [ ] Optional: Run affected tests

**Configuration:**
```json
// package.json
{
  "lint-staged": {
    "*.{js,jsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md}": [
      "prettier --write"
    ]
  }
}
```

**Acceptance Criteria:**
- ✅ Pre-commit hooks active for all developers
- ✅ Lint-staged configured and working
- ✅ Commits fail if linting fails
- ✅ Documentation for bypassing in emergencies

---

#### 1.3 PR Template & Checklist
**Status:** 🔴 NOT STARTED

**Tasks:**
- [ ] Create `.github/PULL_REQUEST_TEMPLATE.md`
- [ ] Add security review checklist
- [ ] Add testing requirements
- [ ] Add documentation requirements
- [ ] Require manual confirmation of no secrets

**PR Template:**
```markdown
## Description
<!-- What does this PR do? -->

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Security Checklist
- [ ] No secrets or credentials in code
- [ ] Input validation added where needed
- [ ] Authentication/authorization checked
- [ ] No SQL/NoSQL injection vulnerabilities
- [ ] XSS prevention considered

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] E2E tests pass (if applicable)

## Performance
- [ ] No performance regression
- [ ] Bundle size checked (frontend)
- [ ] Database queries optimized (backend)
```

**Acceptance Criteria:**
- ✅ PR template enforced via branch protection
- ✅ Checklist must be completed before merge
- ✅ Reviews required from code owners

---

### Phase 2 — Backend Hardening (Node + Express) 🔐

**Priority:** HIGH  
**Timeline:** 3-4 weeks  
**Why:** Prevents most common bot alerts and real security risks

#### 2.1 Project Structure & Organization
**Status:** 🟢 GOOD

**Current Structure:**
```
backend/src/
├── routes/          ✅ Good
├── controllers/     ✅ Good
├── services/        ✅ Need more
├── models/          ❓ Could improve
├── middleware/      ✅ Good
├── utils/           ✅ Good
├── config/          ✅ Good
└── tests/           ✅ Good
```

**Improvements Needed:**
- [ ] Separate business logic into services
- [ ] Add validators/ directory for input schemas
- [ ] Add types/ directory (if using JSDoc or TS)
- [ ] Improve error handling consistency

---

#### 2.2 Input Validation & Sanitization
**Status:** 🟡 PARTIAL

**Tasks:**
- [ ] Install Zod: `npm install zod`
- [ ] Create validation schemas for all endpoints
- [ ] Add validation middleware
- [ ] Reject unknown keys in request bodies
- [ ] Validate MongoDB ObjectIds explicitly
- [ ] Sanitize HTML inputs (prevent XSS)

**Example Schema:**
```javascript
// validators/sessionSchema.js
const { z } = require('zod');

const createSessionSchema = z.object({
  body: z.object({
    scenarioId: z.string().regex(/^[a-f0-9]{24}$/),
    userId: z.string().min(1),
    settings: z.object({
      difficulty: z.enum(['easy', 'medium', 'hard'])
    }).optional()
  })
});
```

**Acceptance Criteria:**
- ✅ All POST/PUT/PATCH endpoints have validation
- ✅ Query parameters validated
- ✅ Tests verify validation works
- ✅ Clear error messages for invalid input

---

#### 2.3 Authentication & Session Management
**Status:** 🟡 IN PROGRESS

**Current:** Firebase Auth (✅ Fixed HIGH security issues)

**Improvements Needed:**
- [ ] Implement refresh token rotation
- [ ] Add token revocation list (Redis)
- [ ] Use HTTP-only, Secure, SameSite=Strict cookies
- [ ] Implement rate limiting on auth endpoints
- [ ] Add brute force protection
- [ ] Log all authentication events

**JWT Best Practices:**
```javascript
// Short-lived access tokens (15 minutes)
const accessToken = jwt.sign(payload, secret, { expiresIn: '15m' });

// Long-lived refresh tokens (7 days) - stored in DB
const refreshToken = jwt.sign(payload, refreshSecret, { expiresIn: '7d' });

// Set cookies with strict security
res.cookie('accessToken', accessToken, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  maxAge: 15 * 60 * 1000
});
```

**Acceptance Criteria:**
- ✅ Refresh token rotation implemented
- ✅ Tokens stored in HTTP-only cookies
- ✅ No tokens in localStorage or sessionStorage
- ✅ Rate limiting active (max 5 login attempts/min)

---

#### 2.4 Authorization (RBAC)
**Status:** 🔴 NOT STARTED

**Tasks:**
- [ ] Define roles: `user`, `admin`, `super_admin`
- [ ] Create RBAC middleware
- [ ] Protect admin endpoints
- [ ] Audit admin actions
- [ ] Implement least privilege principle

**Example Middleware:**
```javascript
function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

// Usage
router.delete('/users/:id', 
  authMiddleware, 
  requireRole(['admin', 'super_admin']), 
  deleteUser
);
```

**Acceptance Criteria:**
- ✅ All endpoints have explicit permission checks
- ✅ Admin actions logged for audit
- ✅ Tests verify unauthorized access blocked

---

#### 2.5 HTTP Security Headers
**Status:** 🔴 NOT STARTED

**Tasks:**
- [ ] Install helmet: `npm install helmet`
- [ ] Configure helmet with strict settings
- [ ] Configure Content Security Policy (CSP)
- [ ] Enable HSTS
- [ ] Set X-Frame-Options, X-Content-Type-Options

**Configuration:**
```javascript
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Remove unsafe-inline
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "https://api.groundctrl.org"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

**Acceptance Criteria:**
- ✅ All security headers present
- ✅ CSP configured without unsafe-inline/unsafe-eval
- ✅ HSTS enabled with preload
- ✅ Security scan passes (securityheaders.com)

---

#### 2.6 Rate Limiting
**Status:** 🔴 NOT STARTED

**Tasks:**
- [ ] Install express-rate-limit: `npm install express-rate-limit`
- [ ] Add global rate limit (100 req/15min per IP)
- [ ] Add strict limits for auth endpoints (5 req/15min)
- [ ] Add limits for simulator commands
- [ ] Consider Redis store for distributed rate limiting

**Configuration:**
```javascript
const rateLimit = require('express-rate-limit');

// Global limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests, please try again later'
});

// Auth limiter (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true
});

app.use('/api/', globalLimiter);
app.use('/api/auth/', authLimiter);
```

**Acceptance Criteria:**
- ✅ Rate limits enforced on all endpoints
- ✅ Auth endpoints have strict limits
- ✅ Proper 429 error responses
- ✅ Redis store for production

---

#### 2.7 Database Security (MongoDB/Firestore)
**Status:** 🟡 PARTIAL

**Tasks:**
- [ ] Use parameterized queries (Mongoose models)
- [ ] Never use `JSON.parse()` on untrusted query strings
- [ ] Sanitize all query objects
- [ ] Enable query logging in dev
- [ ] Create indexes for performance
- [ ] Implement query timeouts
- [ ] Add database connection pooling

**NoSQL Injection Prevention:**
```javascript
// BAD - vulnerable to injection
const user = await User.findOne({ 
  email: req.body.email  // Could be {"$gt": ""}
});

// GOOD - explicit validation
const emailSchema = z.string().email();
const email = emailSchema.parse(req.body.email);
const user = await User.findOne({ email });
```

**Acceptance Criteria:**
- ✅ No unparameterized queries
- ✅ Tests demonstrate injection prevention
- ✅ Indexes created for common queries
- ✅ Query monitoring enabled

---

#### 2.8 Error Handling & Logging
**Status:** 🟡 PARTIAL

**Tasks:**
- [ ] Centralized error handler (already exists, improve)
- [ ] Sanitize error messages (no stack traces in prod)
- [ ] Implement structured logging (Pino or Winston)
- [ ] Add request-id correlation
- [ ] Never log PII or secrets
- [ ] Add log rotation
- [ ] Configure log levels by environment

**Structured Logging Example:**
```javascript
const pino = require('pino');

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  redact: ['req.headers.authorization', 'password', 'token'],
  serializers: {
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
    err: pino.stdSerializers.err
  }
});

// Usage
logger.info({ 
  userId: req.user.id, 
  method: req.method, 
  url: req.url,
  requestId: req.id 
}, 'Request received');
```

**Acceptance Criteria:**
- ✅ Structured JSON logs
- ✅ Request ID in all logs
- ✅ PII redacted
- ✅ No stack traces in production errors

---

#### 2.9 Monitoring & Incident Response
**Status:** 🔴 NOT STARTED

**Tasks:**
- [ ] Integrate Sentry for error tracking
- [ ] Set up Prometheus metrics
- [ ] Create Grafana dashboards
- [ ] Add health check endpoints (`/healthz`, `/readyz`)
- [ ] Implement graceful shutdown
- [ ] Set up alerting (PagerDuty, Slack)

**Health Check Example:**
```javascript
app.get('/healthz', (req, res) => {
  res.json({ status: 'healthy', uptime: process.uptime() });
});

app.get('/readyz', async (req, res) => {
  try {
    await mongoose.connection.db.admin().ping();
    res.json({ status: 'ready', database: 'connected' });
  } catch (err) {
    res.status(503).json({ status: 'not ready', database: 'disconnected' });
  }
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await server.close();
  await mongoose.connection.close();
  process.exit(0);
});
```

**Acceptance Criteria:**
- ✅ Sentry DSN configured
- ✅ Metrics exposed at `/metrics`
- ✅ Health checks respond correctly
- ✅ Graceful shutdown implemented

---

#### 2.10 Testing
**Status:** 🟡 PARTIAL

**Required Coverage:**
- Unit tests: >70%
- Integration tests: Critical paths
- Security tests: Auth flows, injection attempts

**Tasks:**
- [ ] Achieve 70% code coverage
- [ ] Add integration tests with Testcontainers
- [ ] Add security-specific tests
- [ ] Test error handling paths
- [ ] Add API contract tests

**Security Test Examples:**
```javascript
describe('Authentication Security', () => {
  it('should reject expired tokens', async () => {
    const expiredToken = jwt.sign({}, secret, { expiresIn: '-1s' });
    const res = await request(app)
      .get('/api/protected')
      .set('Authorization', `Bearer ${expiredToken}`);
    expect(res.status).toBe(401);
  });

  it('should prevent NoSQL injection in queries', async () => {
    const res = await request(app)
      .post('/api/users/login')
      .send({ email: { $gt: "" }, password: "test" });
    expect(res.status).toBe(400);
  });
});
```

**Acceptance Criteria:**
- ✅ CI runs tests with coverage report
- ✅ Coverage threshold enforced (70%)
- ✅ Security tests pass
- ✅ Integration tests use test database

---

### Phase 3 — Frontend Hardening (React + Vite) 🎨

**Priority:** MEDIUM-HIGH  
**Timeline:** 3-4 weeks

#### 3.1 TypeScript Migration (Optional but Recommended)
**Status:** 🔴 NOT STARTED (Currently JavaScript-only per .clinerules)

**Note:** Per project rules, this is currently JavaScript-only. If migrating to TypeScript:

**Tasks:**
- [ ] Install TypeScript and types
- [ ] Create strict tsconfig.json
- [ ] Migrate files incrementally (.js → .ts)
- [ ] Add type checking to CI
- [ ] Fix all type errors

**Strict TypeScript Config:**
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true
  }
}
```

---

#### 3.2 Code Quality (ESLint + Prettier)
**Status:** 🟡 PARTIAL

**Tasks:**
- [ ] Configure ESLint with security plugin
- [ ] Add eslint-config-airbnb or similar
- [ ] Configure Prettier
- [ ] Add pre-commit hooks
- [ ] Enforce in CI (0 errors)

**ESLint Config:**
```javascript
{
  "extends": [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:jsx-a11y/recommended",
    "plugin:security/recommended"
  ],
  "rules": {
    "react/prop-types": "off", // If using TS
    "no-console": "warn",
    "no-eval": "error",
    "no-implied-eval": "error"
  }
}
```

**Acceptance Criteria:**
- ✅ Zero ESLint errors in CI
- ✅ Prettier formatting enforced
- ✅ Security rules active

---

#### 3.3 Vite Configuration & Build Optimization
**Status:** 🟡 PARTIAL

**Tasks:**
- [ ] Configure production optimizations
- [ ] Enable code splitting
- [ ] Configure deterministic hashing
- [ ] Add bundle analyzer
- [ ] Set bundle size threshold
- [ ] Enable compression

**Vite Config:**
```javascript
export default defineConfig({
  build: {
    target: 'es2020',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['lucide-react'],
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
});
```

**Acceptance Criteria:**
- ✅ Bundle size < 1MB (gzipped)
- ✅ Code splitting working
- ✅ CI fails if bundle exceeds threshold

---

#### 3.4 Security Best Practices
**Status:** 🟡 PARTIAL

**Tasks:**
- [ ] Never use `dangerouslySetInnerHTML` (or sanitize with DOMPurify)
- [ ] Configure strict CSP from backend
- [ ] Use React strict mode
- [ ] Avoid deprecated lifecycle methods
- [ ] Validate all user input
- [ ] Sanitize URLs before redirects

**XSS Prevention:**
```javascript
import DOMPurify from 'dompurify';

// If you MUST use dangerouslySetInnerHTML
function SafeHTML({ html }) {
  const sanitized = DOMPurify.sanitize(html);
  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
}
```

**Acceptance Criteria:**
- ✅ No XSS vulnerabilities
- ✅ CSP headers configured
- ✅ React strict mode enabled

---

#### 3.5 Performance Optimization
**Status:** 🟡 PARTIAL

**Tasks:**
- [ ] Implement code splitting
- [ ] Use dynamic imports for heavy components
- [ ] Add react-window for virtualization
- [ ] Use requestAnimationFrame for animations
- [ ] Optimize bundle size
- [ ] Lazy load routes

**Code Splitting Example:**
```javascript
// Lazy load simulator components
const Simulator = lazy(() => import('./pages/Simulator'));
const MissionBriefing = lazy(() => import('./pages/MissionBriefing'));

// Usage
<Suspense fallback={<Loading />}>
  <Routes>
    <Route path="/simulator" element={<Simulator />} />
    <Route path="/briefing" element={<MissionBriefing />} />
  </Routes>
</Suspense>
```

**Acceptance Criteria:**
- ✅ Initial bundle < 300KB
- ✅ Lazy loading for routes
- ✅ Virtualization for long lists
- ✅ Lighthouse score > 90

---

#### 3.6 Accessibility (a11y)
**Status:** 🟡 PARTIAL

**Tasks:**
- [ ] Install eslint-plugin-jsx-a11y
- [ ] Fix all a11y lint errors
- [ ] Add ARIA labels where needed
- [ ] Ensure keyboard navigation works
- [ ] Test with screen reader
- [ ] Run axe-core in CI

**Accessibility Testing:**
```javascript
// Install: npm install -D @axe-core/playwright
import { injectAxe, checkA11y } from 'axe-playwright';

test('simulator page is accessible', async ({ page }) => {
  await page.goto('/simulator');
  await injectAxe(page);
  await checkA11y(page, null, {
    detailedReport: true,
    detailedReportOptions: { html: true }
  });
});
```

**Acceptance Criteria:**
- ✅ No critical a11y violations
- ✅ Keyboard navigation works
- ✅ ARIA labels present
- ✅ Color contrast passes WCAG AA

---

#### 3.7 Testing (Unit + E2E)
**Status:** 🟡 PARTIAL

**Tasks:**
- [ ] Unit tests with Vitest
- [ ] React Testing Library for components
- [ ] E2E tests with Playwright
- [ ] Mock WebSocket scenarios
- [ ] Visual regression tests (optional)

**E2E Test Example:**
```javascript
test('simulator workflow', async ({ page }) => {
  await page.goto('/missions');
  await page.click('text=Start Mission');
  
  // Wait for simulator to load
  await page.waitForSelector('[data-testid="mission-panel"]');
  
  // Execute command
  await page.fill('[data-testid="command-input"]', 'STATUS');
  await page.press('[data-testid="command-input"]', 'Enter');
  
  // Verify telemetry updated
  await expect(page.locator('[data-testid="telemetry"]')).toContainText('Nominal');
});
```

**Acceptance Criteria:**
- ✅ E2E smoke tests pass on PR
- ✅ WebSocket scenarios mocked
- ✅ Critical user flows covered

---

### Phase 4 — Simulator UI Improvements 🛰️

**Priority:** MEDIUM  
**Timeline:** 4-6 weeks

#### 4.1 Responsive Workspace Layout
**Status:** 🟡 IN PROGRESS

**Tasks:**
- [ ] Implement multi-panel layout with react-grid-layout
- [ ] Allow drag/resize panels
- [ ] Save layout to localStorage
- [ ] Add preset layouts (beginner, advanced)
- [ ] Mobile-responsive design

**Acceptance Criteria:**
- ✅ Panels resizable and draggable
- ✅ Layout persists across sessions
- ✅ Mobile view functional

---

#### 4.2 WebSocket UX & Diagnostics
**Status:** 🟡 PARTIAL

**Tasks:**
- [ ] Add connection indicator (green/yellow/red)
- [ ] Show reconnection attempts
- [ ] Display WebSocket latency (RTT)
- [ ] Add manual reconnect button
- [ ] Show message queue status
- [ ] Add WebSocket debugger panel

**Connection Indicator:**
```javascript
function WebSocketIndicator() {
  const { connected, latency, reconnecting } = useWebSocket();
  
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${
        connected ? 'bg-green-500' : 
        reconnecting ? 'bg-yellow-500 animate-pulse' : 
        'bg-red-500'
      }`} />
      <span>{latency}ms RTT</span>
      {!connected && <Button onClick={reconnect}>Reconnect</Button>}
    </div>
  );
}
```

**Acceptance Criteria:**
- ✅ Connection status always visible
- ✅ Latency displayed
- ✅ Reconnect button works
- ✅ Message inspector available

---

#### 4.3 Telemetry Enhancements
**Status:** 🟡 PARTIAL

**Tasks:**
- [ ] Virtualized telemetry table (react-window)
- [ ] Column filters and sorting
- [ ] CSV export functionality
- [ ] Real-time graphs with Chart.js or Recharts
- [ ] Historical data playback

**Acceptance Criteria:**
- ✅ Table handles 10,000+ rows smoothly
- ✅ Export to CSV works
- ✅ Graphs update in real-time

---

#### 4.4 Replay & Time Controls
**Status:** 🔴 NOT STARTED

**Tasks:**
- [ ] Add timeline slider
- [ ] Play/pause/step controls
- [ ] Adjustable playback speed (0.1x - 10x)
- [ ] Save replay sessions
- [ ] Export replay as JSON

**Acceptance Criteria:**
- ✅ Replay works smoothly
- ✅ Speed adjustment works
- ✅ Replay can be saved/loaded

---

#### 4.5 Command Safety Layer
**Status:** 🔴 NOT STARTED

**Tasks:**
- [ ] Add confirmation modal for destructive commands
- [ ] Implement "dry-run" mode
- [ ] Show predicted effects before execution
- [ ] Add undo functionality (if possible)
- [ ] Rate limit command execution

**Acceptance Criteria:**
- ✅ Destructive commands require confirmation
- ✅ Dry-run shows predicted outcomes
- ✅ User can cancel before execution

---

#### 4.6 Orbital Visualization
**Status:** 🔴 NOT STARTED

**Tasks:**
- [ ] Implement 2D ground track with canvas
- [ ] Optional: 3D orbit view with react-three-fiber
- [ ] Show ground stations
- [ ] Show visibility windows
- [ ] Toggle overlays (predicted vs actual orbit)
- [ ] Offload computation to Web Worker

**Acceptance Criteria:**
- ✅ Ground track visible and accurate
- ✅ Performance acceptable (60 FPS)
- ✅ Web Worker used for heavy calculations

---

#### 4.7 Debug & Diagnostics Panel
**Status:** 🔴 NOT STARTED

**Tasks:**
- [ ] WebSocket message inspector
- [ ] Show raw frames with timestamps
- [ ] Simulator logs with severity filters
- [ ] Telemetry anomaly detector
- [ ] Performance metrics (FPS, memory usage)

**Acceptance Criteria:**
- ✅ Debugger helps diagnose issues
- ✅ Message inspector shows all traffic
- ✅ Logs filterable by severity

---

#### 4.8 Accessibility & Keyboard Controls
**Status:** 🟡 PARTIAL

**Tasks:**
- [ ] All controls keyboard accessible
- [ ] Add keyboard shortcuts (documented)
- [ ] Screen reader support
- [ ] High contrast mode
- [ ] Focus indicators visible

**Acceptance Criteria:**
- ✅ All actions accessible via keyboard
- ✅ Shortcuts documented in UI
- ✅ Screen reader compatible

---

#### 4.9 Component Library & Storybook
**Status:** 🔴 NOT STARTED

**Tasks:**
- [ ] Install Storybook
- [ ] Document all simulator UI components
- [ ] Add sample telemetry mocks
- [ ] Create usage examples
- [ ] Add dark/light mode support

**Acceptance Criteria:**
- ✅ Storybook running and documented
- ✅ All components have stories
- ✅ Mocks available for development

---

### Phase 5 — Infrastructure & Deployment 🚀

**Priority:** MEDIUM  
**Timeline:** 2-3 weeks

#### 5.1 Docker Multi-Stage Builds
**Status:** 🔴 NOT STARTED

**Tasks:**
- [ ] Create multi-stage Dockerfile for frontend
- [ ] Create multi-stage Dockerfile for backend
- [ ] Use Alpine base images
- [ ] Run as non-root user
- [ ] Scan images in CI
- [ ] Optimize layer caching

**Dockerfile Example:**
```dockerfile
# Frontend
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
USER nodejs
```

**Acceptance Criteria:**
- ✅ Multi-stage builds working
- ✅ Images run as non-root
- ✅ Image size < 100MB (backend), < 50MB (frontend)
- ✅ No vulnerabilities in base images

---

#### 5.2 SBOM Generation
**Status:** 🔴 NOT STARTED

**Tasks:**
- [ ] Install CycloneDX CLI
- [ ] Generate SBOM during build
- [ ] Store SBOM with artifacts
- [ ] Scan SBOM for vulnerabilities

**Generation:**
```bash
npm install -g @cyclonedx/cyclonedx-npm
cyclonedx-npm --output-file sbom.json
```

**Acceptance Criteria:**
- ✅ SBOM generated on every build
- ✅ SBOM in CycloneDX format
- ✅ SBOM scanned for vulnerabilities

---

#### 5.3 Secrets Management
**Status:** 🟡 PARTIAL

**Tasks:**
- [ ] Use GitHub Secrets for CI/CD
- [ ] Consider HashiCorp Vault for production
- [ ] Rotate secrets regularly
- [ ] Document secret rotation process
- [ ] Never hardcode secrets

**Acceptance Criteria:**
- ✅ All secrets in secrets manager
- ✅ Rotation process documented
- ✅ No hardcoded secrets

---

#### 5.4 Kubernetes Manifests (Optional)
**Status:** 🔴 NOT STARTED

**Tasks:**
- [ ] Create Deployment manifests
- [ ] Create Service manifests
- [ ] Add HPA (Horizontal Pod Autoscaler)
- [ ] Add Ingress with TLS
- [ ] Add readiness/liveness probes

**Acceptance Criteria:**
- ✅ K8s manifests deploy successfully
- ✅ Auto-scaling works
- ✅ Health checks pass

---

#### 5.5 Observability Stack
**Status:** 🔴 NOT STARTED

**Tasks:**
- [ ] Structured logging to stdout (JSON)
- [ ] Prometheus metrics at `/metrics`
- [ ] OpenTelemetry for distributed tracing
- [ ] Grafana dashboards
- [ ] Sentry for error tracking

**Acceptance Criteria:**
- ✅ Logs structured and queryable
- ✅ Metrics scraped by Prometheus
- ✅ Traces visible in Jaeger/Tempo
- ✅ Dashboards show key metrics

---

## 📊 Success Metrics

### CI/CD Health
- ✅ All CI checks pass on main branch
- ✅ < 5% PR check failure rate
- ✅ < 10 minute CI pipeline duration
- ✅ Zero secrets in repository

### Security Posture
- ✅ Zero high/critical vulnerabilities
- ✅ CodeQL baseline cleared
- ✅ Dependabot enabled and responsive
- ✅ Security headers passing (securityheaders.com)

### Code Quality
- ✅ >70% test coverage
- ✅ Zero ESLint errors
- ✅ Bundle size < 1MB (frontend)
- ✅ Lighthouse score > 90

### Performance
- ✅ API response time < 200ms (p95)
- ✅ WebSocket latency < 100ms
- ✅ Frontend initial load < 3s
- ✅ Time to Interactive < 5s

### Accessibility
- ✅ Zero critical a11y violations
- ✅ WCAG 2.1 AA compliance
- ✅ Keyboard navigation works
- ✅ Screen reader compatible

---

## 🚦 Implementation Strategy

### PR-Based Incremental Rollout

**Small, Focused PRs:**
1. Each PR addresses 1-3 related tasks
2. PRs must pass all CI checks
3. PRs require security review
4. No PRs > 500 lines of code

**Suggested PR Sequence:**

| PR # | Title | Tasks | Priority |
|------|-------|-------|----------|
| 1 | Repo hygiene & CI baseline | Add ci.yml, CodeQL, Dependabot | 🔴 |
| 2 | Secrets removal & rotation | Secret scan, removal, rotation | 🔴 |
| 3 | Backend: Helmet & rate limiting | Add helmet, rate limiters | 🔴 |
| 4 | Backend: Input validation (Zod) | Add Zod schemas, validation middleware | 🔴 |
| 5 | Backend: Auth improvements | Refresh rotation, revocation | 🟡 |
| 6 | Frontend: ESLint + security rules | Add eslint-plugin-security | 🟡 |
| 7 | Frontend: Code splitting | Dynamic imports, lazy loading | 🟡 |
| 8 | Frontend: Accessibility fixes | Fix a11y violations, add axe tests | 🟡 |
| 9 | Backend: Logging & monitoring | Structured logs, Sentry, health checks | 🟡 |
| 10 | E2E tests (Playwright) | Critical user flow tests | 🟡 |
| 11 | Simulator UI: WebSocket UX | Connection indicator, diagnostics | 🟢 |
| 12 | Simulator UI: Telemetry enhancements | Virtualization, filters, export | 🟢 |
| 13 | Infrastructure: Docker multi-stage | Optimize images, security scan | 🟢 |
| 14 | Infrastructure: SBOM generation | CycloneDX, vulnerability scan | 🟢 |

---

## ✅ Quick Wins (1-2 Days Each)

These can be done immediately for fast impact:

1. ✅ **SECURITY.md + vulnerability reporting** (done)
2. ⏳ **Husky + lint-staged pre-commit hooks** (4 hours)
3. ⏳ **eslint-plugin-security** (2 hours)
4. ⏳ **WebSocket connection indicator** (4 hours)
5. ⏳ **CODEOWNERS file for critical paths** (1 hour)
6. ⏳ **Dependabot configuration** (1 hour)
7. ⏳ **Health check endpoints** (2 hours)
8. ⏳ **Helmet with basic config** (2 hours)

---

## 📚 References & Resources

### Security
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

### Testing
- [Testing Library](https://testing-library.com/)
- [Playwright Docs](https://playwright.dev/)
- [Jest Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

### CI/CD
- [GitHub Actions Security Best Practices](https://docs.github.com/en/actions/security-guides)
- [Dependabot Configuration](https://docs.github.com/en/code-security/dependabot)
- [CodeQL Documentation](https://codeql.github.com/docs/)

### Performance
- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [React Performance](https://react.dev/learn/render-and-commit)

### Accessibility
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [axe DevTools](https://www.deque.com/axe/devtools/)

---

## 🎯 Conclusion

This roadmap provides a comprehensive, prioritized plan to transform GroundCTRL into a secure, production-ready application. The incremental approach ensures:

1. **Safety:** Small PRs reduce risk
2. **Focus:** Clear priorities guide development
3. **Quality:** Automated checks enforce standards
4. **Compliance:** Meets GitHub bot expectations

**Next Action:** Begin with Phase 0 (Critical Security) tasks, starting with secret scanning and Dependabot configuration.

---

**Last Updated:** 2/1/2026  
**Maintained By:** Development Team  
**Review Schedule:** Monthly
