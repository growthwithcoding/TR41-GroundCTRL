# Deployment Fix Summary

**Issue:** Firebase App Hosting deployment fails with "Container failed to start and listen on port 8080"

**Date:** February 2, 2026

## Root Cause Analysis

The deployment was failing because:

1. **Blocking initialization** - Firebase and other services were initialized synchronously before the server could bind to port 8080
2. **Fatal error handling** - Any initialization error would prevent the server from starting
3. **Insufficient logging** - Limited visibility into what was failing during startup
4. **Missing secrets handling** - No graceful degradation when required secrets (like JWT_SECRET) were missing

The Cloud Run startup probe expects the container to:
- Bind to port 8080 within 240 seconds
- Respond to TCP health checks immediately
- Handle initialization errors gracefully

## Changes Made

### 1. Server Startup Refactoring ([backend/src/server.js](backend/src/server.js))

**Changes:**
- ✅ Load `app.js` inside try-catch to handle initialization errors
- ✅ Create HTTP server immediately after app loads
- ✅ Bind to port 8080 BEFORE any non-critical initialization
- ✅ Move WebSocket initialization AFTER port binding (non-blocking)
- ✅ Add comprehensive startup logging for debugging
- ✅ Improved error messages with troubleshooting steps
- ✅ Add server error handler for better diagnostics

**Key improvements:**
```javascript
// OLD: WebSocket initialized before port binding (could delay/block)
const io = initializeWebSocket(server);
server.listen(PORT, HOST, callback);

// NEW: Port binding first, WebSocket after (non-blocking)
server.listen(PORT, HOST, () => {
  // Server is now accepting connections!
  // Initialize WebSocket with error handling
  try {
    const io = initializeWebSocket(server);
  } catch (error) {
    // Log error but continue - server still works
  }
});
```

### 2. Application Initialization Hardening ([backend/src/app.js](backend/src/app.js))

**Changes:**
- ✅ Load all middleware with error handling
- ✅ Set fallback values for failed modules
- ✅ Enhanced Firebase initialization logging
- ✅ Make routes optional with fallback handlers
- ✅ Ensure critical endpoints (`/`, `/health`) always work
- ✅ Add Firebase status to health checks

**Key improvements:**
```javascript
// OLD: If routes fail to load, app crashes
const routes = require('./routes');
app.use('/api/v1', routes);

// NEW: Graceful fallback if routes fail
try {
  routes = require('./routes');
  app.use('/api/v1', routes);
} catch (error) {
  // Use fallback route with error message
  app.get('/api/v1', (req, res) => {
    res.status(503).json({ error: 'Routes unavailable' });
  });
}
```

### 3. Documentation Added

#### [DEPLOYMENT_TROUBLESHOOTING.md](DEPLOYMENT_TROUBLESHOOTING.md)
Comprehensive troubleshooting guide covering:
- Common deployment failures and solutions
- Missing secrets diagnostics
- Startup timeout issues
- Port binding verification
- Memory/CPU limit checks
- Deployment best practices
- Quick diagnostic checklist

#### [FIREBASE_SECRETS_SETUP.md](FIREBASE_SECRETS_SETUP.md)
Step-by-step guide for:
- Setting up required secrets (JWT_SECRET, etc.)
- Generating secure random values
- Managing secrets via CLI and console
- Troubleshooting secret-related errors
- Security best practices

## Graceful Degradation Strategy

The server now supports graceful degradation for non-critical features:

| Component | Failure Impact | Server Behavior |
|-----------|---------------|-----------------|
| Firebase Init | Non-fatal | Server starts, Firebase features disabled |
| WebSocket Init | Non-fatal | Server starts, real-time features disabled |
| Route Loading | Non-fatal | Server starts, fallback routes used |
| Swagger Docs | Non-fatal | Server starts, docs return 503 |
| JWT_SECRET Missing | Fatal | Clear error message in logs |

**Critical endpoints that MUST always work:**
- `GET /` - Root endpoint  
- `GET /health` - Health check
- `GET /api/v1/health` - API health check

## Testing Recommendations

### Before Deploying

1. **Verify secrets are set:**
```bash
firebase apphosting:secrets:list --project groundctrl-c8860
```

2. **Set JWT_SECRET if missing:**
```bash
# Generate secure random value
openssl rand -base64 32

# Set in Firebase
firebase apphosting:secrets:set JWT_SECRET --project groundctrl-c8860
```

3. **Run tests locally:**
```bash
cd backend
npm test
```

### After Deploying

1. **Check deployment logs immediately:**
```bash
firebase apphosting:logs --project groundctrl-c8860 --limit 50
```

2. **Look for startup indicators:**
- ✅ `📦 Loading Express application...`
- ✅ `✓ Express application loaded`
- ✅ `✓ Server listening on 0.0.0.0:8080`
- ⚠️ Any warning messages
- ❌ `LAUNCH ABORTED` (fatal error)

3. **Test health endpoint:**
```bash
curl https://groundctrl-339386417366.us-central1.run.app/health
```

Expected response:
```json
{
  "status": "GO",
  "service": "GroundCTRL API",
  "version": "1.6.0",
  "firebase": "initialized"
}
```

## Expected Deployment Flow

1. **Build phase** - Docker image built from source
2. **Container start** - Node.js process starts
3. **App initialization** (< 5 seconds)
   - Load environment variables
   - Load Express modules
   - Initialize Firebase (with error handling)
   - Set up middleware
4. **Server binding** (< 10 seconds)
   - Create HTTP server
   - Bind to 0.0.0.0:8080
   - **Health checks now pass** ✅
5. **Post-startup** (< 30 seconds)
   - Initialize WebSocket
   - Log startup complete
   - Ready for traffic

**Total startup time:** ~15-45 seconds (well under 240-second timeout)

## Next Steps

1. **Commit and push changes:**
```bash
git add backend/src/server.js backend/src/app.js
git add DEPLOYMENT_TROUBLESHOOTING.md FIREBASE_SECRETS_SETUP.md
git commit -m "fix: resolve Cloud Run startup issues with graceful degradation"
git push origin securitydeploymentfixes
```

2. **Verify JWT_SECRET is set:**
```bash
firebase apphosting:secrets:describe JWT_SECRET --project groundctrl-c8860
```

If not set:
```bash
firebase apphosting:secrets:set JWT_SECRET --project groundctrl-c8860
```

3. **Deploy and monitor:**
```bash
# Deployment should happen automatically via GitHub Actions
# Monitor logs:
firebase apphosting:logs --project groundctrl-c8860 --follow
```

4. **If deployment still fails:**
   - Check logs for specific error messages
   - Refer to [DEPLOYMENT_TROUBLESHOOTING.md](DEPLOYMENT_TROUBLESHOOTING.md)
   - Verify all steps in the checklist

## Files Changed

- ✏️ `backend/src/server.js` - Refactored startup sequence
- ✏️ `backend/src/app.js` - Added graceful error handling
- 📄 `DEPLOYMENT_TROUBLESHOOTING.md` - New troubleshooting guide
- 📄 `FIREBASE_SECRETS_SETUP.md` - New secrets setup guide
- 📄 `DEPLOYMENT_FIX_SUMMARY.md` - This summary

## Success Criteria

Deployment is successful when:
- ✅ Container starts within 240 seconds
- ✅ Server binds to port 8080
- ✅ Health checks return 200 OK
- ✅ Logs show "Server listening on 0.0.0.0:8080"
- ✅ No fatal errors in Cloud Run logs
- ✅ API endpoints are accessible

## Support

If issues persist after these fixes:
1. Review logs: `firebase apphosting:logs --project groundctrl-c8860`
2. Check [DEPLOYMENT_TROUBLESHOOTING.md](DEPLOYMENT_TROUBLESHOOTING.md)
3. Verify secrets: `firebase apphosting:secrets:list`
4. Check GitHub Actions for CI/CD issues
