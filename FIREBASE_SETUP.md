# Firebase Setup Guide

This document provides instructions for setting up Firebase App Hosting for the backend and Firebase Hosting for the frontend.

## Project Information
- **Firebase Project ID**: `groundctrl-c8860`
- **Firebase Project Name**: GroundCTRL
- **GitHub Repository**: https://github.com/E-Y-J/TR41-GroundCTRL.git

## Frontend: Firebase Hosting (✅ Configured)

The frontend is configured to deploy automatically via GitHub Actions workflows.

### Configuration Files
- `.firebaserc` - Firebase project configuration
- `firebase.json` - Firebase Hosting configuration (deploys from `frontend/dist`)
- `.github/workflows/firebase-hosting-merge.yml` - Auto-deploy on merge to main
- `.github/workflows/firebase-hosting-pull-request.yml` - Preview deployments on PRs

### GitHub Secret Required
You need to add the Firebase service account secret to your GitHub repository:

1. Generate a service account key:
   ```bash
   firebase login
   firebase init hosting:github
   ```
   OR manually create it in Firebase Console:
   - Go to Project Settings > Service Accounts
   - Generate new private key
   - Copy the JSON content

2. Add the secret to GitHub:
   - Go to your repository: https://github.com/E-Y-J/TR41-GroundCTRL
   - Settings > Secrets and variables > Actions
   - Click "New repository secret"
   - Name: `FIREBASE_SERVICE_ACCOUNT`
   - Value: Paste the service account JSON

### Manual Deploy (Optional)
To manually deploy the frontend:
```bash
cd frontend
npm install
npm run build
cd ..
firebase deploy --only hosting
```

---

## Backend: Firebase App Hosting (⚠️ Manual Setup Required)

Firebase App Hosting for the backend requires manual setup through Firebase Console or CLI.

### Option 1: Firebase Console Setup (Recommended)

1. **Navigate to Firebase Console**
   - Go to: https://console.firebase.google.com/project/groundctrl-c8860
   - Select "App Hosting" from the left menu

2. **Create Backend**
   - Click "Add backend" or "Create backend"
   - Connect your GitHub repository: `E-Y-J/TR41-GroundCTRL`
   - Authorize Firebase to access your GitHub account if prompted

3. **Configure Backend Settings**
   - **Backend name**: `groundctrl-backend` (or your preferred name)
   - **Branch**: `main` (or your production branch)
   - **Root directory**: `backend/`
   - **Build command**: `npm install` (Cloud Build will handle this)
   - **Region**: Choose closest to your users (e.g., `us-central1`)

4. **Environment Variables**
   - Add any required environment variables from `backend/.env.sample`:
     - `JWT_SECRET`
     - `NODE_ENV`
     - Firebase credentials (automatically available in Cloud Run)
     - Any other custom variables

5. **Deploy**
   - Click "Create" or "Save and Deploy"
   - Firebase will:
     - Clone your repository
     - Build the backend using Cloud Build
     - Deploy to Cloud Run
     - Auto-redeploy on pushes to the main branch

### Option 2: Firebase CLI Setup

```bash
# Make sure you're logged in
firebase login

# Create the backend
firebase apphosting:backends:create groundctrl-backend \
  --project groundctrl-c8860 \
  --location us-central1

# Note: Connecting the repository to an existing backend is done via
# Firebase Console. See the console setup steps above for details.

# Set environment variables (secrets)
firebase apphosting:secrets:set JWT_SECRET \
  --project groundctrl-c8860

# Note: Firebase App Hosting backends are deployed automatically
# after you connect your GitHub repository and push to the configured branch.
# There is no separate "firebase deploy" command for App Hosting backends.
```

### Backend Auto-Deploy

Once configured, Firebase App Hosting automatically:
- ✅ Monitors the `main` branch for changes
- ✅ Triggers Cloud Build on push
- ✅ Builds the Node.js backend
- ✅ Deploys to Cloud Run
- ✅ Provides a URL for the backend API

### Backend URL
After deployment, your backend will be available at:
- `https://<backend-name>--groundctrl-c8860.<region>.hosted.app`
- Example: `https://groundctrl--groundctrl-c8860.us-central1.hosted.app`
- Check Firebase Console > App Hosting for the exact URL

### Update Frontend Configuration
Once your backend is deployed, update the frontend to use the backend URL:

```javascript
// frontend/src/config/apiConfig.js (create if doesn't exist)
export const API_BASE_URL = process.env.VITE_API_URL || 'https://groundctrl--groundctrl-c8860.us-central1.hosted.app';
```

Add to `frontend/.env.production`:
```
VITE_API_URL=https://groundctrl--groundctrl-c8860.us-central1.hosted.app
```

---

## Workflow: Making Changes

### For Frontend Changes
1. Create a branch: `git checkout -b feature/my-feature`
2. Make changes in `frontend/`
3. Commit and push: `git push origin feature/my-feature`
4. Create PR: `gh pr create --fill`
5. Preview URL will be posted as a comment on the PR
6. Merge to main → Auto-deploys to live site

### For Backend Changes
1. Create a branch: `git checkout -b feature/my-backend-feature`
2. Make changes in `backend/`
3. Commit and push: `git push origin feature/my-backend-feature`
4. Create PR and merge to main
5. Firebase App Hosting automatically builds and deploys to Cloud Run

---

## Verification

### Frontend Deployment
After merging to main, verify:
1. Check GitHub Actions: https://github.com/E-Y-J/TR41-GroundCTRL/actions
2. Visit your site: Check Firebase Console for the hosting URL
3. Check deployment status: `firebase hosting:channel:list`

### Backend Deployment
1. Check Firebase Console > App Hosting
2. Verify Cloud Run deployment status
3. Test backend endpoint: `curl https://groundctrl--groundctrl-c8860.us-central1.hosted.app/api/v1/health`

---

## Troubleshooting

### Frontend Issues
- **Build fails**: Check `npm run build` works locally in `frontend/`
- **Deployment fails**: Verify `FIREBASE_SERVICE_ACCOUNT` secret is set
- **404 errors**: Ensure `firebase.json` rewrites are configured for SPA routing

### Backend Issues
- **Build fails**: Test `npm install && npm start` locally in `backend/`
- **Environment variables**: Check they're set in Firebase Console > App Hosting > Backend Settings
- **Connection errors**: Verify Cloud Run service is running and has proper IAM permissions

---

## Resources

- [Firebase App Hosting Documentation](https://firebase.google.com/docs/app-hosting)
- [Firebase Hosting Documentation](https://firebase.google.com/docs/hosting)
- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [GitHub Actions for Firebase](https://github.com/FirebaseExtended/action-hosting-deploy)
