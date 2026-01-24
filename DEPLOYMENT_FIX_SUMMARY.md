# Deployment Fix Summary

## Overview
This document explains the critical bug that was preventing Cloud Run container startup and the fixes applied.

## Critical Bug: Container Crash on Startup

### Problem
The backend container was crashing immediately upon startup with no logs, causing the Firebase App Hosting deployment to fail with `failed_precondition` error.

### Root Cause
**File:** `backend/src/routes/ai.js` (Line 579)
**Error:** `TypeError: createRateLimiter is not a function`

The `ai.js` route file was attempting to import and use `createRateLimiter`:
```javascript
const { createRateLimiter } = require('../middleware/rateLimiter');
// ...
router.post('/help/ask', createRateLimiter(helpAiLimit), ...);
```

However, `createRateLimiter` was **not exported** from `backend/src/middleware/rateLimiter.js`.

### Impact
- Container crashed immediately before any logs could be written
- Cloud Run health checks failed
- No application logs available (crashed before logger initialized)
- Deployment showed "No data found" in logs

## Solution

### Fix 1: Export createRateLimiter Function
**File:** `backend/src/middleware/rateLimiter.js`
**Commit:** `e04702d`

Added the missing `createRateLimiter` function and exported it:

```javascript
/**
 * Create a custom rate limiter with the given configuration
 * @param {object} config - Rate limit configuration
 * @returns {function} Express middleware
 */
function createRateLimiter(config) {
  return rateLimit({
    ...config,
    handler: (req, res) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        path: req.path,
        userId: req.user?.uid,
        callSign: req.callSign
      });
      
      const error = {
        statusCode: 429,
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later.',
        details: 'Rate limit exceeded'
      };
      
      const response = responseFactory.createErrorResponse(error, {
        callSign: req.callSign || 'UNKNOWN',
        requestId: req.id || uuidv4()
      });
      
      res.status(429).json(response);
    }
  });
}

module.exports = {
  apiLimiter,
  loginLimiter,
  authLimiter,
  passwordChangeLimiter,
  passwordResetRequestLimiter,
  passwordResetLimiter,
  createRateLimiter  // <- Added export
};
```

### Fix 2: GitHub Actions Permissions
**File:** `.github/workflows/firebase-hosting-pull-request.yml`
**Commit:** `73c3e4b`

Added `checks: write` permission to allow Firebase action to create check runs:

```yaml
permissions:
  checks: write        # Required for Firebase action to create check runs
  contents: read
  pull-requests: write
```

### Fix 3: Firebase Action Workaround
**File:** `.github/workflows/firebase-hosting-pull-request.yml`
**Commit:** `7a55efb`

Added `continue-on-error` to handle known Firebase action bug:

```yaml
- name: Deploy to Firebase Hosting Preview
  id: firebase_deploy
  continue-on-error: true  # Known issue: action fails to parse expireTime
```

### Fix 4: Explicit Channel ID
**File:** `.github/workflows/firebase-hosting-pull-request.yml`
**Commit:** `fc336bb`

Added explicit channel ID to prevent automatic normalization issues:

```yaml
- uses: FirebaseExtended/action-hosting-deploy@v0
  with:
    channelId: pr-${{ github.event.pull_request.number }}-fix
```

## Testing

### Local Testing
```bash
node backend/src/server.js
```

**Result:** Server starts successfully on port 8080 ✅

```
========================================
   🛰️  GROUNDCTRL MISSION CONTROL  🛰️
========================================
Status: GO FOR LAUNCH ✓
Station: GROUNDCTRL-01
Port: 8080
```

## Deployment

### Branch
`fix/add-create-rate-limiter-function`

### Commits
1. `e04702d` - Add missing createRateLimiter export (CRITICAL FIX)
2. `73c3e4b` - Add GitHub Actions permissions
3. `7a55efb` - Add Firebase action workaround
4. `fc336bb` - Add explicit channel ID

## Expected Results After Merge

- ✅ Container starts successfully
- ✅ Server listens on port 8080
- ✅ Cloud Run health checks pass
- ✅ No `failed_precondition` errors
- ✅ NOVA AI endpoints functional (authenticated and public)
- ✅ All backend features operational

## NOVA AI Dual-Mode Implementation

The backend now supports NOVA AI in dual mode:

1. **Authenticated Mode:** `/api/v1/ai/*` - Requires JWT token
2. **Public Mode:** `/api/v1/ai/help/ask` - No authentication required

The public help endpoint uses the `createRateLimiter` with `helpAiLimit` configuration to prevent abuse while allowing unauthenticated access for help queries.

## Related Files

- `backend/src/middleware/rateLimiter.js` - Rate limiting middleware
- `backend/src/routes/ai.js` - NOVA AI routes
- `backend/src/config/rateLimits.js` - Rate limit configurations
- `backend/NOVA_DUAL_MODE_IMPLEMENTATION.md` - NOVA features documentation

## Resolution Date
January 24, 2026
