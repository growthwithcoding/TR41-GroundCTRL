# Deployment Troubleshooting Guide

## Issue: Container Failed to Start and Listen on Port 8080

### Symptoms
```
Default STARTUP TCP probe failed 1 time consecutively for container "groundctrl-1" on port 8080.
The user-provided container failed to start and listen on the port defined provided by the 
PORT=8080 environment variable within the allocated timeout.
```

### Common Causes & Solutions

#### 1. Missing Required Secrets

The backend requires several secrets to be configured in Firebase Secret Manager:

**Required Secrets:**
- `JWT_SECRET` - Used for JWT token signing
- `FIREBASE_PRIVATE_KEY` - Service account private key (production can use ADC)
- `GEMINI_API_KEY` - For AI features (optional, features will be disabled if missing)

**Check if secrets are configured:**
```bash
# List all secrets
firebase apphosting:secrets:list --project groundctrl-c8860

# Check specific secret
firebase apphosting:secrets:describe JWT_SECRET --project groundctrl-c8860
```

**Set missing secrets:**
```bash
# Set JWT_SECRET (generate a strong random string)
firebase apphosting:secrets:set JWT_SECRET --project groundctrl-c8860

# For GEMINI_API_KEY
firebase apphosting:secrets:set GEMINI_API_KEY --project groundctrl-c8860
```

**Note:** In production with Firebase App Hosting, `FIREBASE_PRIVATE_KEY` is NOT needed as the service uses Application Default Credentials (ADC) automatically.

#### 2. Application Startup Errors

The server now includes extensive logging to help diagnose startup issues. Check the Cloud Run logs:

```bash
# View recent logs
firebase apphosting:logs --project groundctrl-c8860 --limit 100

# Or use the Cloud Console URL provided in error messages
```

**Look for:**
- `📦 Loading Express application...` - App is starting
- `✓ Express application loaded` - App loaded successfully
- `✓ Server listening on 0.0.0.0:8080` - Server is bound to port
- `⚠️ WARNING:` messages - Non-fatal issues (features may be disabled)
- `❌ LAUNCH ABORTED` - Fatal startup error

#### 3. Startup Timeout

The current startup probe configuration:
- `timeoutSeconds`: 240 (4 minutes)
- `periodSeconds`: 240
- `failureThreshold`: 1

**If the server consistently takes longer than 4 minutes to start**, you may need to:

1. **Increase timeout in apphosting.yaml** (add this section):
```yaml
runConfig:
  startupProbe:
    timeoutSeconds: 300
    periodSeconds: 240
    failureThreshold: 1
```

2. **Or optimize startup** by:
   - Removing blocking operations during initialization
   - Deferring non-critical initialization
   - Using lazy loading for heavy dependencies

#### 4. Port Binding Issues

**Verify the server binds to the correct port:**
- Server MUST listen on `process.env.PORT` (defaults to 8080)
- Server MUST bind to `0.0.0.0` (not `localhost` or `127.0.0.1`)

The fixes applied ensure:
```javascript
const PORT = parseInt(process.env.PORT || '8080', 10);
const HOST = '0.0.0.0'; // Critical for Cloud Run
```

#### 5. Memory or CPU Limits

Current configuration:
- CPU: 1 vCPU
- Memory: 512Mi

If the server runs out of memory during startup:

1. **Increase memory in apphosting.yaml:**
```yaml
runConfig:
  memoryMiB: 1024  # Increase to 1GB
```

2. **Check memory usage in logs** for OOM (Out of Memory) errors

### Deployment Best Practices

#### Before Deploying

1. **Run tests locally:**
```bash
cd backend
npm test
```

2. **Test with production-like settings:**
```bash
NODE_ENV=production npm start
```

3. **Verify all required secrets are set:**
```bash
firebase apphosting:secrets:list --project groundctrl-c8860
```

#### After Deploying

1. **Check deployment status:**
```bash
firebase apphosting:rollouts:list --project groundctrl-c8860
```

2. **View logs immediately:**
```bash
firebase apphosting:logs --project groundctrl-c8860 --limit 50
```

3. **Test health endpoint:**
```bash
curl https://groundctrl-339386417366.us-central1.run.app/health
```

### Server Startup Flow (After Fixes)

The server now follows this startup sequence to ensure rapid port binding:

1. **Immediate logging** - Server logs startup information
2. **Load Express app** - With error handling
3. **Create HTTP server** - Immediately
4. **Bind to port 8080** - CRITICAL: Happens ASAP
5. **Initialize WebSocket** - After port binding (non-blocking)
6. **Report success** - Server is ready

This ensures the server responds to health checks quickly, even if some features fail to initialize.

### Graceful Degradation

The server now supports graceful degradation:

- **Firebase init fails** → Server starts, Firebase features disabled
- **WebSocket init fails** → Server starts, real-time features disabled
- **Routes fail to load** → Server starts with fallback routes
- **Swagger fails** → Server starts, docs endpoint returns 503

Critical endpoints that MUST always work:
- `GET /` - Root endpoint
- `GET /health` - Health check
- `GET /api/v1/health` - API health check

### Quick Diagnostic Checklist

When deployment fails:

- [ ] Are all required secrets set?
- [ ] Do Cloud Run logs show the server attempting to start?
- [ ] Do logs show `✓ Server listening on 0.0.0.0:8080`?
- [ ] Are there any `❌` or `⚠️` messages in logs?
- [ ] Is memory/CPU usage within limits?
- [ ] Are tests passing in CI/CD?

### Getting Help

If issues persist:

1. **Collect logs:**
   ```bash
   firebase apphosting:logs --project groundctrl-c8860 --limit 200 > deployment-logs.txt
   ```

2. **Check revision details:**
   ```bash
   gcloud run revisions describe groundctrl-build-YYYY-MM-DD-NNN \
     --region us-central1 --project groundctrl-c8860
   ```

3. **Review security logs** in Cloud Console

### Related Documentation

- [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md) - Full deployment guide
- [backend/README.md](./backend/README.md) - Backend setup
- [FIREBASE_SETUP.md](./backend/docs/FIREBASE_SETUP.md) - Firebase configuration
