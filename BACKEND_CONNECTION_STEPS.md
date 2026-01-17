# Connecting Backend to GitHub Repository

## Current Status
- **Backend Name**: `groundctrl`
- **Backend URL**: https://groundctrl--groundctrl-c8860.us-central1.hosted.app
- **Region**: us-central1
- **Repository**: ❌ Not connected yet

## Steps to Connect via Firebase Console

Since the Firebase CLI doesn't support updating an existing backend's repository connection, you'll need to use the Firebase Console:

### 1. Access Firebase Console
Navigate to: https://console.firebase.google.com/project/groundctrl-c8860/apphosting

### 2. Select the Backend
- Find and click on the `groundctrl` backend

### 3. Connect Repository
- Look for "Repository" or "Source" settings
- Click "Connect repository" or "Edit"
- Authorize Firebase to access GitHub if prompted
- Select repository: `E-Y-J/TR41-GroundCTRL`
- Select branch: `main`
- Set root directory: `backend/`

### 4. Configure Build Settings (if needed)
- Build command: `npm install` (automatic)
- Start command: `npm start` (should detect from package.json)

### 5. Environment Variables
Make sure these secrets are set (via Firebase Console or CLI):
```bash
# Via CLI (if not already set):
firebase apphosting:secrets:set JWT_SECRET --project groundctrl-c8860
firebase apphosting:secrets:set FIREBASE_PRIVATE_KEY --project groundctrl-c8860
firebase apphosting:secrets:set SMTP_PASSWORD --project groundctrl-c8860
```

### 6. Verify Connection
Once connected:
- Push to `main` branch should trigger automatic deployment
- Check Cloud Build logs for build status
- Backend will auto-deploy to Cloud Run

## Alternative: Create New Backend with Repository
If the console doesn't allow editing the repository, you could:
1. Delete the existing backend: `firebase apphosting:backends:delete groundctrl --project groundctrl-c8860`
2. Create new with repository: Use Firebase Console to create with repo connection from the start

But this is only needed if the console doesn't support editing.

## What Happens After Connection
✅ Automatic deployments on push to `main`
✅ Cloud Build triggers on every commit
✅ Backend deploys to Cloud Run
✅ Backend available at: https://groundctrl--groundctrl-c8860.us-central1.hosted.app
