# Production Deployment Guide

This document provides step-by-step instructions for deploying GroundCTRL to Firebase App Hosting (backend) and Firebase Hosting (frontend).

## Prerequisites

- [x] Repo owner access to add GitHub secrets
- [x] Firebase CLI installed: `npm install -g firebase-tools`
- [x] Firebase project access
- [x] New service account credentials generated

## Step 1: Add GitHub Secret for Frontend Deployment

### Generate Service Account JSON
You already have this file: `your-service-account-key.json`

### Add to GitHub
1. Go to: https://github.com/E-Y-J/TR41-GroundCTRL/settings/secrets/actions
2. Click **"New repository secret"**
3. Name: `FIREBASE_SERVICE_ACCOUNT`
4. Value: Paste the **entire JSON** content from `your-service-account-key.json`
5. Click **"Add secret"**

## Step 2: Set Backend Secrets in Firebase Secret Manager

### Login to Firebase
```bash
firebase login
```

### Set JWT Secret
```bash
firebase apphosting:secrets:set JWT_SECRET --project groundctrl-c8860
# When prompted, enter a strong, randomly generated secret (for example, run `openssl rand -hex 64` locally and paste the output here).
```

### Set Firebase Private Key
The private key is multi-line, so you'll need to format it properly:

```bash
firebase apphosting:secrets:set FIREBASE_PRIVATE_KEY --project groundctrl-c8860
```

**⚠️ SECURITY WARNING: Never include real private keys in documentation or version control**

When prompted, enter the **entire private key** from your Firebase service account JSON file downloaded from Firebase Console:

1. Go to Firebase Console > Project Settings > Service Accounts
2. Click "Generate New Private Key" (if you haven't already)
3. Download the JSON file
4. Copy the `private_key` field value from the JSON
5. Paste it when prompted by the CLI

The private key format should look like this (DO NOT use this placeholder, get your actual key from Firebase):
```
-----BEGIN PRIVATE KEY-----
[YOUR_ACTUAL_PRIVATE_KEY_CONTENT_HERE]
[MULTIPLE_LINES_OF_BASE64_ENCODED_KEY_DATA]
[GET_THIS_FROM_FIREBASE_CONSOLE_SERVICE_ACCOUNT]
-----END PRIVATE KEY-----
```

### Set SMTP Password
```bash
firebase apphosting:secrets:set SMTP_PASSWORD --project groundctrl-c8860
# When prompted, enter the SMTP password retrieved from your team's secure secret store (for example, your password manager or secrets vault).
```

### Verify Secrets
```bash
firebase apphosting:secrets:describe JWT_SECRET --project groundctrl-c8860
firebase apphosting:secrets:describe FIREBASE_PRIVATE_KEY --project groundctrl-c8860
firebase apphosting:secrets:describe SMTP_PASSWORD --project groundctrl-c8860
```

## Step 3: Connect Backend to GitHub Repository

### Option A: Firebase Console (Recommended)
1. Go to: https://console.firebase.google.com/project/groundctrl-c8860/apphosting
2. Click on the **"groundctrl"** backend
3. Look for **"Connect repository"** or **"Source"** settings
4. Click **"Connect"** or **"Edit"**
5. Configure:
   - Repository: `E-Y-J/TR41-GroundCTRL`
   - Branch: `main`
   - Root directory: `backend/`
6. Save changes

### Option B: Manual Trigger (if needed)
If you need to trigger a deployment manually, you can do so from the Firebase Console after the repository is connected.

## Step 4: Merge Pull Request

Once Steps 1-3 are complete:

1. Review PR #30: https://github.com/E-Y-J/TR41-GroundCTRL/pull/30
2. Verify all CI checks pass
3. **Merge the PR** to `main` branch

## Step 5: Verify Deployments

### Frontend Deployment
1. Check GitHub Actions: https://github.com/E-Y-J/TR41-GroundCTRL/actions
2. Wait for "Deploy to Firebase Hosting on merge" workflow to complete
3. Get hosting URL from Firebase Console: https://console.firebase.google.com/project/groundctrl-c8860/hosting
4. Visit the deployed site

### Backend Deployment
1. Check Firebase Console: https://console.firebase.google.com/project/groundctrl-c8860/apphosting
2. Monitor the build progress in Cloud Build
3. Once deployed, get the backend URL (format: `https://groundctrl--groundctrl-c8860.us-central1.hosted.app`)
4. Test backend health endpoint:
   ```bash
   curl https://groundctrl--groundctrl-c8860.us-central1.hosted.app/health
   ```

## Step 6: Update Frontend with Backend URL

Once the backend is deployed and you have the URL:

1. Create `frontend/.env.production`:
   ```
   VITE_API_URL=https://groundctrl--groundctrl-c8860.us-central1.hosted.app
   ```

2. Update frontend API configuration if needed

3. Commit and push to trigger a new frontend deployment

## Troubleshooting

### Frontend Deployment Fails
- Verify `FIREBASE_SERVICE_ACCOUNT` secret is set correctly
- Check GitHub Actions logs for specific error messages
- Ensure `npm run build` works locally in the `frontend/` directory

### Backend Deployment Fails
- Check Cloud Build logs in Firebase Console
- Verify all secrets are set correctly in Secret Manager
- Ensure `backend/apphosting.yaml` is properly configured
- Test `npm install && npm start` locally in the `backend/` directory

### Backend Can't Access Secrets
- Verify secrets are set with correct names
- Check IAM permissions for the Cloud Run service account
- Review logs in Cloud Run console

## Security Notes

🔒 **IMPORTANT**: 
- Never commit the `backend/.env` file (it's in `.gitignore`)
- Keep the service account JSON files (`groundctrl-c8860-*.json`) secure and private
- Rotate secrets regularly
- Use Firebase Secret Manager for all production secrets
- The old credentials from the previous `.env` file are now invalid and should be discarded

### Firebase Emulator Configuration Protection

🛡️ **Automated Safeguard**: The application includes a startup check that prevents deployment if Firebase emulator variables are accidentally configured in production:

- **Protected Variables**: 
  - `FIREBASE_AUTH_EMULATOR_HOST`
  - `FIRESTORE_EMULATOR_HOST`

- **How it works**: 
  - When `NODE_ENV=production`, the application checks for emulator variables during Firebase initialization
  - If detected, the application will **fail to start** with a clear error message
  - This prevents production traffic from being routed to non-existent local emulators

- **Best Practices**:
  - Emulator variables should **ONLY** be set in your local `.env` file for development
  - **DO NOT** add these variables to `backend/apphosting.yaml`
  - **DO NOT** set these as environment variables in Cloud Run console
  - The `.env.sample` file has these variables commented out by default

- **For Local Development**:
  - Uncomment the emulator variables in your local `.env` file when working with Firebase emulators
  - Keep `NODE_ENV=development` in your local environment
  - See `backend/.env.sample` for the correct format

## Auto-Deployment

After initial setup, deployments are automatic:
- **Frontend**: Push to `main` branch → Auto-deploys via GitHub Actions
- **Backend**: Push to `main` branch → Auto-deploys via Firebase App Hosting
- **PR Previews**: Every PR gets a preview deployment URL

## Summary

✅ **What's Configured**:
- Frontend hosting configuration
- Backend runtime configuration (`apphosting.yaml`)
- GitHub Actions workflows
- `.gitignore` properly configured

⏳ **What Requires Your Action**:
1. Add GitHub secret for frontend deployments
2. Set backend secrets in Firebase Secret Manager  
3. Connect backend to GitHub repository
4. Merge PR #30

🚀 **Result**: Fully automated CI/CD pipeline!
