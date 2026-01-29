# NOVA AI Configuration Guide

## Issue Summary

**Date**: January 28, 2026  
**Status**: ⚠️ REQUIRES CONFIGURATION

### Problem
NOVA AI assistant is only using fallback messages instead of actual AI responses.

### Root Cause
The `GEMINI_API_KEY` environment variable is **not configured in production**. When this key is missing, the NOVA service automatically falls back to generic responses to maintain functionality.

---

## Solution: Configure Gemini API Key

### Step 1: Get Your Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click **"Create API Key"** or **"Get API Key"**
4. Copy the generated API key (starts with `AIza...`)

**Important**: Keep this key secure and never commit it to version control!

### Step 2: Set the Secret in Firebase

Run the following command to set the API key in Firebase Secret Manager:

```bash
firebase apphosting:secrets:set GEMINI_API_KEY --project groundctrl-c8860
```

When prompted, paste your Gemini API key.

### Step 3: Verify the Secret

Check that the secret was set correctly:

```bash
firebase apphosting:secrets:describe GEMINI_API_KEY --project groundctrl-c8860
```

You should see output confirming the secret exists (the actual value won't be displayed for security).

### Step 4: Redeploy Backend

The backend needs to restart to pick up the new secret. You have two options:

**Option A: Automatic (via Git push)**
```bash
# Make any small change to trigger redeploy, or push this configuration update
git push origin fix/prod-env-backend-url
```

**Option B: Manual (via Firebase Console)**
1. Go to [Firebase Console → App Hosting](https://console.firebase.google.com/project/groundctrl-c8860/apphosting)
2. Click on your backend service
3. Click **"Rollouts"** tab
4. Click **"Create new rollout"** or wait for automatic deployment

### Step 5: Verify NOVA is Working

1. Go to production: https://groundctrl-c8860.web.app/missions
2. Start a mission
3. Ask NOVA a question
4. You should receive an AI-generated response (not a fallback message)

**Fallback message format:**
> "NOVA here. I'm experiencing some communication delays..."

**AI-generated response format:**
> Natural, contextual responses about the mission, commands, or concepts

---

## How It Works

### Code Logic (from `backend/src/services/novaService.js`)

```javascript
function getGeminiModel() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    logger.warn('GEMINI_API_KEY not configured - NOVA will use fallback responses');
    return null;  // ← This causes fallback responses
  }
  // ... initialize Gemini AI
}
```

When `GEMINI_API_KEY` is missing:
- ✅ NOVA still works (graceful degradation)
- ⚠️ Responses are generic fallback messages
- ⚠️ No context-aware AI tutoring

When `GEMINI_API_KEY` is configured:
- ✅ NOVA provides intelligent, context-aware responses
- ✅ Step-aware hints and guidance
- ✅ Command-aware troubleshooting
- ✅ Progressive learning support

---

## Local Development Setup

For local development, add to your `backend/.env` file:

```bash
# Gemini AI Configuration
GEMINI_API_KEY=AIza...your-key-here
```

**Never commit your `.env` file!** It's in `.gitignore` for security.

---

## Troubleshooting

### NOVA Still Using Fallback Responses After Setup

**Check 1: Verify Secret is Set**
```bash
firebase apphosting:secrets:describe GEMINI_API_KEY --project groundctrl-c8860
```

**Check 2: Check Backend Logs**
```bash
# View logs in Firebase Console
# Look for: "GEMINI_API_KEY not configured" warning
```

**Check 3: Verify Backend Restarted**
- Secrets are only loaded on backend startup
- Check Cloud Run logs for recent restart
- Force restart by creating a new rollout

### API Key Invalid or Quota Exceeded

**Symptom**: NOVA returns fallback after 3 retry attempts

**Check Gemini API Console:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to **APIs & Services** → **Credentials**
3. Verify API key is valid and not restricted
4. Check **APIs & Services** → **Dashboard** for quota usage

**Common Issues:**
- API key restrictions blocking Cloud Run
- Free tier quota exceeded
- API not enabled in Google Cloud project

### Enable Gemini API

If you get "API not enabled" errors:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Navigate to **APIs & Services** → **Library**
4. Search for "Generative Language API"
5. Click **Enable**

---

## Cost Considerations

### Gemini 1.5 Flash Pricing (as of 2026)

**Free Tier:**
- 15 requests per minute
- 1 million tokens per day
- 1,500 requests per day

**Paid Tier** (if you exceed free tier):
- $0.075 per 1M input tokens
- $0.30 per 1M output tokens

### Estimated Usage

For typical satellite training scenarios:
- Average prompt: ~1,500 tokens (scenario context + history + user message)
- Average response: ~300 tokens
- Cost per NOVA interaction: ~$0.0003 (paid tier)

**For 1,000 users doing 10 missions each with 20 NOVA questions:**
- Total interactions: 200,000
- Estimated cost: ~$60 (if exceeding free tier)

**Free tier covers:** ~1,000 NOVA interactions per day

---

## Security Best Practices

### ✅ DO:
1. **Use Firebase Secret Manager** for production API keys
2. **Rotate API keys** periodically
3. **Monitor API usage** in Google Cloud Console
4. **Set usage quotas** to prevent unexpected charges
5. **Restrict API key** to specific services if possible

### ❌ DON'T:
1. **Don't commit API keys** to version control
2. **Don't share API keys** in documentation or messages
3. **Don't use same key** for dev and production
4. **Don't store keys** in frontend code
5. **Don't ignore quota warnings**

---

## Alternative: Using Environment Variables (Not Recommended)

While you could set `GEMINI_API_KEY` as a regular environment variable in `apphosting.yaml`, this is **NOT recommended** because:

1. ❌ API keys are visible in deployment configs
2. ❌ Harder to rotate keys
3. ❌ Less secure than Secret Manager
4. ❌ Keys visible in Firebase Console UI

**Always use Firebase Secret Manager for API keys!**

---

## Monitoring NOVA Performance

### Check if AI is Working

Look for these indicators in backend logs:

**AI Working:**
```
[INFO] NOVA generation successful
[INFO] Generated response with model: gemini-1.5-flash
```

**Fallback Mode:**
```
[WARN] GEMINI_API_KEY not configured - NOVA will use fallback responses
[WARN] NOVA generation attempt 1 failed
[ERROR] NOVA generation failed after all retries
```

### Frontend Detection

The frontend receives an `is_fallback` flag in NOVA responses:

```javascript
{
  content: "NOVA here. I'm experiencing...",
  is_fallback: true,  // ← Indicates fallback response
  hint_type: "FALLBACK"
}
```

You can use this to show a warning banner when AI is unavailable.

---

## Related Documentation

- [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md) - General deployment guide
- [backend/NOVA_DUAL_MODE_IMPLEMENTATION.md](./backend/NOVA_DUAL_MODE_IMPLEMENTATION.md) - NOVA architecture
- [Gemini API Documentation](https://ai.google.dev/docs)
- [Firebase Secret Manager](https://firebase.google.com/docs/app-hosting/manage-secrets)

---

## Summary

**Problem**: NOVA using fallback responses  
**Cause**: `GEMINI_API_KEY` not configured in production  
**Solution**: Set API key in Firebase Secret Manager  
**Command**: `firebase apphosting:secrets:set GEMINI_API_KEY --project groundctrl-c8860`  
**Status**: ⚠️ Waiting for configuration

Once configured, NOVA will provide intelligent, context-aware AI tutoring! 🚀
