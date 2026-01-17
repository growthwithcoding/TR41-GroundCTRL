# 🚀 GroundCTRL Firebase Setup Guide

Complete Firebase configuration for GroundCTRL with frontend on Firebase Hosting, backend on Firebase App Hosting, and backend tests using local Firebase emulators + remote API.

## 📋 Overview

- **Frontend:** React (Vite) → Firebase Hosting
- **Backend:** Node/Express → Firebase App Hosting
- **Testing:** Local Firebase Emulators (Auth/Firestore) + Remote API (`https://api.missionctrl.org/api/v1`)
- **CI/CD:** GitHub Actions with emulator tests
- **Firebase Project:** `groundctrl-prod`

---

## 🏗️ Project Structure

```
project-root/
├── backend/
│   ├── firebase.json          # Emulator configuration
│   ├── .env.sample           # Backend environment template
│   ├── src/
│   │   ├── config/
│   │   │   ├── emulatorConfig.js   # Emulator detection logic
│   │   │   └── firebase.js         # Firebase Admin SDK setup
│   │   └── ...
│   ├── package.json          # Includes emulator scripts
│   └── tests-backend/        # Jest tests
├── frontend/
│   ├── src/
│   │   └── config/
│   │       └── firebaseConfig.js   # Firebase client SDK
│   ├── .env.sample          # Frontend environment template
│   └── package.json
├── .github/
│   └── workflows/
│       └── firebase-emulator-test.yml  # CI emulator tests
├── firebase.json             # Root hosting + backend mapping
├── .firebaserc              # Firebase project configuration
└── .gitignore               # Git ignore rules

```

---

## 🔧 Initial Setup

### 1. Install Firebase CLI

```bash
npm install -g firebase-tools
```

### 2. Login to Firebase

```bash
firebase login
```

### 3. Configure Environment Variables

#### Backend (.env.sample → .env.local)

```bash
cd backend
cp .env.sample .env.local
```

Edit `.env.local` and add your Firebase credentials:

```env
# MissionCTRL API Configuration
API_BASE_URL=https://api.missionctrl.org/api/v1

# Firebase Configuration
FIREBASE_PROJECT_ID=groundctrl-prod

# Firebase Emulator Configuration (for local development)
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
FIRESTORE_EMULATOR_HOST=localhost:8080
```

**Important:** Also update the full `.env.sample` with other required variables (JWT secrets, Firebase service account, etc.)

#### Frontend (.env.sample → .env.local)

```bash
cd frontend
cp .env.sample .env.local
```

Edit `.env.local` with your Firebase web app configuration:

```env
VITE_API_BASE_URL=https://api.missionctrl.org/api/v1
VITE_FIREBASE_PROJECT_ID=groundctrl-prod
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=groundctrl-prod.firebaseapp.com
VITE_FIREBASE_STORAGE_BUCKET=groundctrl-prod.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

### 4. Install Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

---

## 🧪 Local Development

### Backend with Emulators

#### Option 1: Run emulators and backend separately

**Terminal 1 - Start Emulators:**
```bash
cd backend
npm run emulators:start
```

This starts:
- Firebase Auth Emulator: `http://localhost:9099`
- Firestore Emulator: `http://localhost:8080`
- Emulator UI: `http://localhost:4000` (if configured)

**Terminal 2 - Start Backend:**
```bash
cd backend
npm run dev
```

#### Option 2: Run tests with emulators (auto-start/stop)

```bash
cd backend
npm run test:local
```

This automatically:
1. Starts the emulators
2. Runs all Jest tests
3. Stops the emulators

### Frontend Development

```bash
cd frontend
npm run dev
```

Access at: `http://localhost:5173`

---

## 🧩 How Emulator Detection Works

The backend automatically detects when to use emulators:

**File: `backend/src/config/emulatorConfig.js`**
```javascript
const config = {
  apiBaseUrl: process.env.API_BASE_URL || "https://api.missionctrl.org/api/v1",
  firebaseProjectId: process.env.FIREBASE_PROJECT_ID || "groundctrl-prod",
  useEmulators:
    !!process.env.FIREBASE_AUTH_EMULATOR_HOST ||
    !!process.env.FIRESTORE_EMULATOR_HOST,
  authEmulatorHost: process.env.FIREBASE_AUTH_EMULATOR_HOST || "localhost:9099",
  firestoreEmulatorHost: process.env.FIRESTORE_EMULATOR_HOST || "localhost:8080"
};
```

**File: `backend/src/config/firebase.js`**
- Checks `emulatorConfig.useEmulators`
- If true: Connects to local emulators (no service account needed)
- If false: Uses production Firebase with service account credentials

---

## 🧪 Testing

### Run Backend Tests Locally

```bash
cd backend

# Run tests with emulators (recommended)
npm run test:local

# Or run tests without auto-starting emulators
# (make sure emulators are running in another terminal)
npm test
```

### Test Configuration

Tests use:
- **Firebase Auth/Firestore:** Local emulators (localhost:9099, localhost:8080)
- **MissionCTRL API:** Remote production API (`https://api.missionctrl.org/api/v1`)

**Environment variables set for tests:**
```env
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
FIRESTORE_EMULATOR_HOST=localhost:8080
API_BASE_URL=https://api.missionctrl.org/api/v1
```

---

## 🚀 CI/CD - GitHub Actions

### Workflow: Backend Emulator Tests

**File: `.github/workflows/firebase-emulator-test.yml`**

**Triggers:**
- Push to `main` branch (backend changes only)
- Pull requests to `main` (backend changes only)

**What it does:**
1. Checks out code
2. Sets up Node.js 20
3. Installs backend dependencies
4. Installs Firebase CLI
5. Runs tests with emulators

**Environment variables:**
```yaml
FIREBASE_PROJECT_ID: groundctrl-prod
FIREBASE_AUTH_EMULATOR_HOST: localhost:9099
FIRESTORE_EMULATOR_HOST: localhost:8080
API_BASE_URL: https://api.missionctrl.org/api/v1
```

---

## 🔥 Firebase Console Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create project: `groundctrl-prod`
3. Enable Google Analytics (optional)

### 2. Enable Services

**Authentication:**
- Navigate to Authentication → Get Started
- Enable desired providers (Email/Password, Google, etc.)

**Firestore:**
- Navigate to Firestore Database → Create Database
- Start in production mode (or test mode for development)
- Choose a location

**Hosting:**
- Navigate to Hosting → Get Started
- Follow setup instructions

**App Hosting:**
- Navigate to App Hosting (under Build)
- Connect GitHub repository
- Configure backend deployment

### 3. Get Credentials

**Frontend (Web App):**
1. Project Settings → General
2. Scroll to "Your apps" → Web app
3. Copy configuration values to `frontend/.env.local`

**Backend (Service Account):**
1. Project Settings → Service Accounts
2. Generate new private key
3. Add credentials to `backend/.env.local`:
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_PRIVATE_KEY`
   - `FIREBASE_CLIENT_EMAIL`

---

## 📦 Deployment

### Frontend (Firebase Hosting)

```bash
cd frontend
npm run build
firebase deploy --only hosting
```

### Backend (Firebase App Hosting)

Backend deployment is typically automated via GitHub integration:
1. Push to main branch
2. Firebase App Hosting automatically builds and deploys

Or deploy manually:
```bash
cd backend
npm run build
# Follow Firebase App Hosting deployment instructions
```

---

## 🔒 Security Notes

### Environment Files

- **Never commit** `.env`, `.env.local`, or service account JSON files
- Always use `.env.sample` as templates
- Add sensitive files to `.gitignore`

### Emulators vs Production

- **Local Development/Tests:** Use emulators (no real data affected)
- **Production:** Use real Firebase project with proper credentials
- Emulator detection is automatic based on environment variables

### Firebase Security Rules

Ensure proper Firestore security rules are configured:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Add your security rules here
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## 🛠️ Troubleshooting

### Emulators Not Starting

```bash
# Check if ports are in use
netstat -ano | findstr :9099
netstat -ano | findstr :8080

# Kill processes if needed (Windows)
taskkill /PID <pid> /F

# Kill processes (Mac/Linux)
kill -9 <pid>
```

### Firebase Admin SDK Errors

**Error: "Firebase not initialized"**
- Ensure `initializeFirebase()` is called before using Firebase services
- Check environment variables are loaded (dotenv)

**Error: "Service account credentials"**
- Verify `.env.local` has correct Firebase credentials
- Ensure private key formatting is correct (newlines as `\n`)

### Tests Failing in CI

**Check:**
1. Environment variables are set in workflow
2. Firebase CLI version is compatible
3. Emulator ports are not conflicting
4. All dependencies are installed (`npm ci`)

### Frontend Not Connecting to Firebase

**Check:**
1. `.env.local` exists with correct variables
2. All `VITE_` prefixed variables are set
3. Vite server was restarted after changing `.env.local`

---

## 📚 Additional Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Emulators](https://firebase.google.com/docs/emulator-suite)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Firebase Hosting](https://firebase.google.com/docs/hosting)
- [Firebase App Hosting](https://firebase.google.com/docs/app-hosting)

---

## ✅ Success Criteria

- [ ] Frontend builds and deploys to Firebase Hosting
- [ ] Backend builds and deploys to Firebase App Hosting
- [ ] Local `npm test` uses local emulators + remote API
- [ ] GitHub Actions workflow passes on pushes/PRs
- [ ] No staging environment required (emulators provide safety)

---

## 🤝 Contributing

When making changes:
1. Update `.env.sample` files if new variables are needed
2. Test locally with emulators
3. Ensure tests pass in CI
4. Update this documentation if setup changes

---

**Last Updated:** January 2026
