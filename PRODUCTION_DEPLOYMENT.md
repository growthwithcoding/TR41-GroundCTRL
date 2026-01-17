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
3. Name: `FIREBASE_SERVICE_ACCOUNT_GROUNDCTRL_C8860`
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
When prompted, enter the **entire private key** (copy from the `.env` file):
```
-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDkf+N8SJw7DSKK
jrW1MzwvUhY9ZW8US/IEmnYVT/SFgjIRawsEpPUGGrODJ1Lhy9EcIi6G/uaz95OS
MGkPksxAg18kL12P2Dja/0ORFVio/0peK5d7F8ob76xqjh+Aj40uaRuyfKYuXybk
RQuhumkGdNbXj2lOSF15MyFAG+iEEObodyVIFQzdruJLDJDD50ETzQhzH2aEcmKe
w6CpENE8wj266sJezRHCbq+gKOzYNLFjGVyT/YLPR4SYOUr02k1gJZU40TthELEX
5XuWFMinsrCVRF/HlmYaJt26Mz22HeHLST8ngS5NgPqmndEwvlnG9/d63hBJ3XOr
yqzZp3+lAgMBAAECggEAIkfmkO+S0tAsabWx4LLEWYQa9pCYeubO8y5aP2XMtVf8
W30f/M0jvov0eR2F837Ay1P8f3/QDFl9IA5XwMChGJ+s/zCE/K7vjrmDwUk+0THl
zh2DnzHJPmo1h5H1e3Pt9jPKNju5sdTQMKiEL3oYRiHy1om7PoWgUm3fk+7r8h4P
Ydcf1yiwjoga+1Oax1wb5RP1YVLvE7Jif6JV5+dimXthQeEn3JRJLLHW+dw0VtKl
x9g+Z5cv8CFcXY8voMOEl46iRMD+kws7rF8xEfMnBzXEcM+33TczZFi52XqLUiQ4
FKnT24fCTTvLAvuDaF7dTCpmmDETgjGCz7KdwNjniQKBgQD+BKnGXBfsptiZOkd+
tJuhpQmGQSvUJyav/RgDnH3LlX7GuPvfxr7hpeR9RnWTgkXIHQ4Bp4nnU6kCsEZl
6aPRtv5DrtjHMlpqKZ6q5OL67M9x0Xy1O4jLt1hQ49V6G2Jw4k9oytLuA6+DOs4F
LV5iil+IkM4fcMOM6B7X9nDiGQKBgQDmSEInbHC8iinbSIMkiKSGc7iUqthSATEO
nMefGYvKUAIjjzlTERIKkSUmafFdBOg8kmqDV/EmPnvLRfJbJ4Ylc3kQwyxHKfV0
xbOrgGBWoorIBaRvEwarALDS9kpEi/LjF0I4EZZs47gWV6bvYXHz6o4QWKskCSvJ
3wFUwvZzbQKBgB7++KyAvladQV7pMqIubbM6zT+5ohyALoNZEd4W8W6vLkoXdnym
5tHoCUqUF3LJebRifzwKcpRsq/ntApoa+Wd0ufAOXNtptIixzW+zAFN4JBQSaPJA
cn/RPpCYTIta3hdCNkhmP3jVsEwGF++fyp2hnuiuKsjBXMtL47+cjce5AoGBAM5p
xqJ/2S2myo38GVEOCitaXwEjgnM/DjIC5gv+YgceYExvfPqwOnOuVpZwMCEo3OIu
e7rvgQC+0UgLkomSi/PV5ZbY2z+OpK3e6IW5tKDzYWKZbCMD8t4k6Fqw2TFIIJbd
qkWHvkYseD3Oo5u+xN3WSTDtybmrXsy8T/0iJLahAoGBALEDHplDzKNLhUDSR0wY
J0wZ6Np6JclTkl/UrofZRgELDyeFKNW+P67wLUztVOZVAFMrzAFAnwIJ7+sgc50p
Cg3O/m7+hh8veLe7XfvoIeRioBDOqm94KlQdD0fAutquMTd+CIWVhniDM2PThVUb
xj+Pv/1HroxjsWgDM6rc8PLj
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
- Verify `FIREBASE_SERVICE_ACCOUNT_GROUNDCTRL_C8860` secret is set correctly
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
