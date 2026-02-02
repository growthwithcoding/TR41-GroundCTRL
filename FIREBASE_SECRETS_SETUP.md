# Firebase App Hosting Secrets Setup

## Quick Setup Guide

This guide helps you configure the required secrets for Firebase App Hosting deployment.

## Required Secrets

### 1. JWT_SECRET (REQUIRED)

Used for signing and verifying JWT tokens for authentication.

```bash
# Generate a secure random string (32+ characters recommended)
# Option 1: Using OpenSSL
openssl rand -base64 32

# Option 2: Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Set the secret in Firebase
firebase apphosting:secrets:set JWT_SECRET --project groundctrl-c8860
# Paste the generated value when prompted
```

### 2. FIREBASE_PRIVATE_KEY (Optional in Production)

**Note:** When using Firebase App Hosting/Cloud Run, Application Default Credentials (ADC) are used automatically. You do NOT need to set this secret for production deployments.

Only set this for:
- Local development (use `.env` file instead)
- Testing environments that don't have ADC

### 3. GEMINI_API_KEY (Optional)

Required only if you want to enable AI-powered features (Nova AI assistant).

```bash
# Get your API key from https://makersuite.google.com/app/apikey
firebase apphosting:secrets:set GEMINI_API_KEY --project groundctrl-c8860
# Paste your Gemini API key when prompted
```

**If not set:** AI features will be gracefully disabled, but the server will start normally.

## Verify Secrets

### List all configured secrets:
```bash
firebase apphosting:secrets:list --project groundctrl-c8860
```

### Check a specific secret:
```bash
firebase apphosting:secrets:describe JWT_SECRET --project groundctrl-c8860
```

### Update a secret:
```bash
firebase apphosting:secrets:set JWT_SECRET --project groundctrl-c8860 --force
```

### Delete a secret:
```bash
firebase apphosting:secrets:delete JWT_SECRET --project groundctrl-c8860
```

## Secrets vs Environment Variables

### Use Secrets For:
- ✅ JWT_SECRET
- ✅ API keys (GEMINI_API_KEY)
- ✅ Database passwords
- ✅ Service account keys (when not using ADC)
- ✅ Any sensitive credentials

### Use Environment Variables For:
- ✅ Non-sensitive configuration (set in `apphosting.yaml`)
- ✅ Public URLs
- ✅ Feature flags
- ✅ Timeout values
- ✅ Rate limit settings

Already configured in [backend/apphosting.yaml](../backend/apphosting.yaml):
- `NODE_ENV=production`
- `FIREBASE_PROJECT_ID=groundctrl-c8860`
- `LOG_LEVEL=info`
- `ALLOWED_ORIGINS`
- Rate limiting configuration
- JWT expiry settings
- etc.

## Troubleshooting

### Error: "JWT_SECRET is not defined"

**Solution:**
```bash
# Set the JWT_SECRET
firebase apphosting:secrets:set JWT_SECRET --project groundctrl-c8860
```

### Error: "Secret not found"

**Cause:** Secret is set but not associated with the backend service.

**Solution:**
```bash
# Re-set the secret to associate it
firebase apphosting:secrets:set JWT_SECRET --project groundctrl-c8860 --force
```

### Error: "Permission denied"

**Cause:** You don't have permission to manage secrets.

**Solution:**
```bash
# Login with admin account
firebase login

# Or check your IAM permissions
# You need "Firebase App Hosting Admin" or "Secret Manager Admin" role
```

### Verify secrets are being used:

After deployment, check the logs:
```bash
firebase apphosting:logs --project groundctrl-c8860 --limit 20
```

Look for messages about missing secrets or configuration errors.

## Security Best Practices

1. **Never commit secrets** to version control
2. **Use different secrets** for each environment (dev/staging/prod)
3. **Rotate secrets regularly** (e.g., every 90 days)
4. **Use strong random values** (32+ characters)
5. **Limit secret access** to only necessary services
6. **Audit secret access** regularly

## Firebase Console Access

You can also manage secrets in the Firebase Console:
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `groundctrl-c8860`
3. Navigate to: App Hosting → Your backend → Settings → Secrets

## See Also

- [DEPLOYMENT_TROUBLESHOOTING.md](./DEPLOYMENT_TROUBLESHOOTING.md) - Deployment issues
- [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md) - Full deployment guide
- [Firebase Secrets Documentation](https://firebase.google.com/docs/app-hosting/manage-secrets)
