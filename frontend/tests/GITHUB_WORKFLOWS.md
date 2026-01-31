# GitHub Workflows Configuration for Frontend E2E Tests

## ✅ Yes! The tests are now fully configured to work with GitHub workflows.

## 📋 Available Workflows

### 1. **Dedicated E2E Test Workflow** ✨ NEW
**File:** `.github/workflows/frontend-e2e-tests.yml`

**Triggers:**
- Pull requests that change frontend files
- Pushes to `main` or `develop` branches
- Manual workflow dispatch

**What it does:**
- Runs all Playwright E2E tests
- Uploads test results and artifacts
- Comments on PRs with test summary
- Configures CI-specific settings (retries, single worker)

**Features:**
- ✅ Installs Playwright browsers automatically
- ✅ Runs tests in headless mode
- ✅ Captures screenshots/videos on failure
- ✅ Uploads artifacts for 7 days
- ✅ PR comments with test results
- ✅ Proper concurrency handling

### 2. **Firebase Hosting PR Workflow** (Updated)
**File:** `.github/workflows/firebase-hosting-pull-request.yml`

**Now includes:**
- Optional E2E tests before deployment
- Test results uploaded as artifacts
- Non-blocking tests (deployment continues even if tests fail)

**Flow:**
1. Install dependencies
2. Install Playwright browsers
3. **Run E2E tests** ⬅️ NEW
4. Upload test results ⬅️ NEW
5. Build frontend
6. Deploy to Firebase preview channel

## 🎯 Playwright Configuration for CI

The `playwright.config.js` is already CI-ready with:

```javascript
{
  forbidOnly: !!process.env.CI,        // Fail if test.only in CI
  retries: process.env.CI ? 2 : 0,     // Retry flaky tests in CI
  workers: process.env.CI ? 1 : undefined, // Single worker in CI
  reporter: [
    ['html'],
    ['list'],
    ['json', { outputFile: 'test-results/results.json' }]
  ]
}
```

## 🔧 Required Secrets

For full E2E test functionality, optionally configure:

```
TEST_USER_EMAIL=test-user@groundctrl.test
TEST_USER_PASSWORD=TestPassword123!
```

These have defaults if not set, but you can customize them in:
**Settings → Secrets and variables → Actions**

## 🚀 Running Tests in CI

### Automatically
Tests run automatically on:
- Any PR with frontend changes
- Pushes to main/develop

### Manually
1. Go to **Actions** tab
2. Select **Frontend E2E Tests** workflow
3. Click **Run workflow**
4. Select branch and run

## 📊 Test Results

### Artifacts
After each run, the following artifacts are uploaded:
- `playwright-report/` - HTML test report
- `test-results/` - Screenshots, videos, traces (on failure)

**Retention:** 7 days

### PR Comments
Both workflows post comments on PRs with:
- ✅ Pass/fail status
- Test counts (passed, failed, skipped)
- Links to detailed logs
- Commit information

### Example PR Comment

```
✅ Frontend E2E Tests Passed

📊 Test Summary:
- Total Tests: 30
- Passed: ✅ 30
- Failed: ❌ 0
- Skipped: ⏭️ 0

🔍 Details:
- Workflow: View logs
- Commit: abc1234
- Branch: feature/new-login

🎉 All tests passed!
```

## 🎨 Workflow Features

### Concurrency Control
```yaml
concurrency:
  group: frontend-e2e-${{ github.workflow }}-${{ github.event.pull_request.number || github.ref }}
  cancel-in-progress: true
```
- Cancels old workflow runs when new commits are pushed
- Saves CI minutes and reduces clutter

### Conditional Execution
```yaml
paths:
  - 'frontend/**'
  - '.github/workflows/frontend-e2e-tests.yml'
```
- Only runs when frontend files change
- Efficient use of CI resources

### Browser Installation
```yaml
- name: Install Playwright browsers
  run: npx playwright install --with-deps chromium
```
- Installs only Chromium for faster CI runs
- Includes system dependencies with `--with-deps`

## 📦 Test Execution Flow

```
┌─────────────────────────────────────┐
│  Push/PR to GitHub                  │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  Checkout Code                      │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  Setup Node.js 20                   │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  Install Dependencies (npm ci)      │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  Install Playwright Browsers        │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  Build Frontend                     │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  Run E2E Tests                      │
│  (npm run test:e2e)                 │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  Upload Artifacts                   │
│  - Test results                     │
│  - Screenshots                      │
│  - Videos                           │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  Comment on PR                      │
│  (Test results summary)             │
└─────────────────────────────────────┘
```

## 🔍 Viewing Test Results

### In GitHub Actions UI
1. Go to **Actions** tab
2. Click on workflow run
3. View logs and artifacts

### Download Reports
1. Scroll to bottom of workflow run
2. Download `playwright-report` artifact
3. Extract and open `index.html` in browser

### View in PR
- Test summary automatically posted as comment
- Click workflow link for detailed logs

## 🐛 Debugging Failed Tests

### Check Screenshots
1. Download `test-results` artifact
2. Look for `*-failed.png` files

### View Videos
- Videos are in `test-results/` (if test failed)
- Show exactly what happened during test

### View Traces
1. Download trace file from artifacts
2. Run: `npx playwright show-trace trace.zip`
3. Interactive debugging UI opens

## ⚙️ Customizing Workflows

### Change Test Timeout
In `frontend-e2e-tests.yml`:
```yaml
timeout-minutes: 15  # Change this value
```

### Run Different Browsers
In `playwright.config.js`, enable more browsers:
```javascript
projects: [
  { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  { name: 'firefox', use: { ...devices['Desktop Firefox'] } },   // Uncomment
  { name: 'webkit', use: { ...devices['Desktop Safari'] } },     // Uncomment
]
```

### Change Retry Count
In `playwright.config.js`:
```javascript
retries: process.env.CI ? 3 : 0,  // Change from 2 to 3
```

## 📝 Best Practices

1. **Keep tests fast** - CI time is limited
2. **Use test.skip** - Skip flaky tests temporarily
3. **Mock external APIs** - Don't depend on external services
4. **Use unique test data** - Avoid conflicts between parallel tests
5. **Check artifacts** - Always review failures before re-running

## 🔗 Related Documentation

- [Playwright CI Docs](https://playwright.dev/docs/ci)
- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Frontend Test README](../frontend/tests/README.md)
- [Test Quickstart](../frontend/tests/QUICKSTART.md)

---

**Status:** ✅ Fully configured and ready to use!
