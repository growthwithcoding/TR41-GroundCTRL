# Firebase Direct Write Audit - GroundCTRL Frontend

## 🔴 CRITICAL: Security & Data Integrity Issue

**Date:** January 29, 2026  
**Audited By:** AI Assistant  
**Status:** 🔴 URGENT - Multiple direct Firestore writes found

---

## Executive Summary

Found **11 direct Firestore write operations** in the frontend that bypass backend validation, audit logging, and authorization checks. This poses critical security risks.

### Risk Level: 🔴 CRITICAL
- **Security**: Users can bypass authorization and write directly to Firestore
- **Audit Trail**: No logging of user actions (compliance violation)
- **Data Integrity**: No validation before writes (corrupt data possible)
- **Business Logic**: Complex rules not enforced

---

## 🔍 Audit Findings

### Category 1: User Authentication Writes ⚠️ HIGH RISK

**File:** `frontend/src/lib/firebase/auth.js`

#### Finding 1.1: User Registration (signUp function)
**Location:** Line 34  
**Operation:** `setDoc(doc(db, "users", uid), {...})`  
**Risk Level:** 🔴 CRITICAL

**Current Code:**
```javascript
await setDoc(doc(db, "users", userCredential.user.uid), {
  email: userCredential.user.email,
  displayName: displayName || "",
  callSign: callSign || "",
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  missionProgress: {},
  achievements: [],
  totalMissionPoints: 0
})
```

**Problems:**
- ❌ No validation of callSign format
- ❌ No uniqueness check for callSign
- ❌ No audit log created
- ❌ Bypasses backend `/auth/register` endpoint
- ❌ Can set arbitrary fields (missionProgress, achievements, totalMissionPoints)

**Attack Vector:**
```javascript
// User could modify the frontend code and call:
await setDoc(doc(db, "users", "victim-uid"), {
  isAdmin: true,
  totalMissionPoints: 999999,
  achievements: ["HACKER_BADGE"]
})
```

#### Finding 1.2: Google Sign-In User Creation
**Location:** Lines 64, 72  
**Operations:** Multiple `setDoc` calls with merge  
**Risk Level:** 🔴 CRITICAL

**Current Code:**
```javascript
await setDoc(userDoc, {
  email: userCredential.user.email,
  displayName: userCredential.user.displayName || "",
  callSign: "",
  updatedAt: serverTimestamp(),
}, { merge: true })

await setDoc(userDoc, {
  createdAt: serverTimestamp(),
  missionProgress: {},
  achievements: [],
  totalMissionPoints: 0
}, { merge: true, mergeFields: [...] })
```

**Problems:**
- ❌ No audit log
- ❌ Can overwrite existing user data
- ❌ No backend validation
- ❌ Bypasses `/auth/register` endpoint

---

### Category 2: Session Management Writes 🔴 CRITICAL RISK

**File:** `frontend/src/lib/firebase/sessionService.js`

#### Finding 2.1: Create Session
**Location:** Line 91  
**Operation:** `addDoc(collection(db, 'scenario_sessions'), {...})`  
**Risk Level:** 🔴 CRITICAL

**Current Code:**
```javascript
export async function createSession(sessionData) {
  const docRef = await addDoc(collection(db, SESSIONS_COLLECTION), {
    ...sessionData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  })
  return docRef.id
}
```

**Used In:** 
- `MissionBriefing.jsx` (Line 313, 395)

**Problems:**
- ❌ No validation of sessionData
- ❌ User can create sessions for any scenario (even unpublished)
- ❌ Can create sessions for other users
- ❌ No audit log
- ❌ Bypasses backend `/scenario-sessions` POST endpoint

**Attack Vector:**
```javascript
// User could create fake completed sessions:
await createSession({
  user_id: "victim-uid",
  scenario_id: "any-scenario",
  status: "COMPLETED",
  score: 100,
  completedSteps: 999,
  totalSteps: 10
})
```

#### Finding 2.2: Update Session
**Location:** Line 113  
**Operation:** `updateDoc(sessionRef, {...})`  
**Risk Level:** 🔴 CRITICAL

**Current Code:**
```javascript
export async function updateSession(sessionId, updates) {
  const sessionRef = doc(db, SESSIONS_COLLECTION, sessionId)
  await updateDoc(sessionRef, {
    ...updates,
    updatedAt: serverTimestamp()
  })
}
```

**Problems:**
- ❌ No authorization check (can update anyone's session)
- ❌ No validation of updates
- ❌ Can set arbitrary fields
- ❌ No audit log
- ❌ Bypasses backend `/scenario-sessions/:id` PATCH endpoint

#### Finding 2.3: Mark Session In Progress
**Location:** Line 141  
**Operation:** `updateDoc(sessionRef, {...})`  
**Risk Level:** 🟠 HIGH

**Current Code:**
```javascript
await updateDoc(sessionRef, {
  status: 'IN_PROGRESS',
  startedAt: serverTimestamp(),
  updatedAt: serverTimestamp()
})
```

**Problems:**
- ❌ No authorization check
- ❌ No audit log
- ❌ Can mark other users' sessions in progress

#### Finding 2.4: Save Session Progress
**Location:** Line 220  
**Operation:** `updateDoc(sessionRef, updates)`  
**Risk Level:** 🟠 HIGH

**Current Code:**
```javascript
await updateDoc(sessionRef, updates)
```

**Problems:**
- ❌ No authorization check
- ❌ No audit log
- ❌ Can update anyone's progress
- ❌ Could cheat by setting completedSteps high

#### Finding 2.5: Complete Session
**Location:** Line 241  
**Operation:** `updateDoc(sessionRef, {...})`  
**Risk Level:** 🔴 CRITICAL

**Current Code:**
```javascript
await updateDoc(sessionRef, {
  status: 'COMPLETED',
  completedAt: serverTimestamp(),
  updatedAt: serverTimestamp(),
  ...completionData
})
```

**Problems:**
- ❌ No authorization check
- ❌ No validation of completionData
- ❌ Can mark any session as complete
- ❌ Can fabricate scores/achievements
- ❌ No audit log

**Attack Vector:**
```javascript
// Complete any session with perfect score:
await completeSession("victim-session-id", {
  score: 100,
  hintsUsed: 0,
  timeToComplete: 1
})
```

---

### Category 3: Generic Firestore Helpers ⚠️ MEDIUM RISK

**File:** `frontend/src/lib/firebase/firestore.js`

These are helper functions that wrap Firestore operations. Currently **NOT USED** in the codebase, but pose risk if used in future.

#### Finding 3.1: addDocument
**Location:** Line 52  
**Operation:** `addDoc`  
**Status:** ⚠️ Not currently used

#### Finding 3.2: setDocument  
**Location:** Line 65  
**Operation:** `setDoc`  
**Status:** ⚠️ Not currently used

#### Finding 3.3: updateDocument
**Location:** Line 82  
**Operation:** `updateDoc`  
**Status:** ⚠️ Not currently used

#### Finding 3.4: deleteDocument
**Location:** Line 94  
**Operation:** `deleteDoc`  
**Status:** ⚠️ Not currently used

**Recommendation:** Delete these helper functions to prevent future misuse.

---

## 📊 Summary Statistics

| Category | Count | Risk Level |
|----------|-------|------------|
| User Auth Writes | 3 | 🔴 CRITICAL |
| Session Writes | 5 | 🔴 CRITICAL |
| Generic Helpers (unused) | 4 | ⚠️ MEDIUM |
| **Total Direct Writes** | **12** | **🔴 CRITICAL** |

---

## 🛡️ Backend API Coverage Check

### Existing Backend Endpoints

#### Authentication Endpoints ✅
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/me` - Get current user
- `PATCH /api/v1/users/:uid` - Update user profile

#### Session Endpoints ✅
- `POST /api/v1/scenario-sessions` - Create session
- `GET /api/v1/scenario-sessions/:id` - Get session
- `PATCH /api/v1/scenario-sessions/:id` - Update session
- `GET /api/v1/scenario-sessions` - List user sessions

### Coverage Analysis

| Frontend Operation | Backend Endpoint | Status |
|-------------------|------------------|--------|
| signUp (user creation) | POST /auth/register | ✅ EXISTS |
| signInWithGoogle (user creation) | POST /auth/register | ✅ EXISTS |
| createSession | POST /scenario-sessions | ✅ EXISTS |
| updateSession | PATCH /scenario-sessions/:id | ✅ EXISTS |
| markSessionInProgress | PATCH /scenario-sessions/:id | ✅ EXISTS |
| saveSessionProgress | PATCH /scenario-sessions/:id | ✅ EXISTS |
| completeSession | PATCH /scenario-sessions/:id | ✅ EXISTS |

**Result:** ✅ **All operations have backend API coverage!**

---

## 🎯 Migration Plan

### Phase 1: Critical - Auth & Sessions (Priority 1) 🔴

#### Task 1.1: Migrate User Registration
**File:** `frontend/src/lib/firebase/auth.js`

**Current:**
```javascript
// Direct Firestore write
await setDoc(doc(db, "users", uid), {...})
```

**Replace With:**
```javascript
// Use backend API
const response = await fetch(`${API_BASE_URL}/auth/register`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email,
    password,
    displayName,
    callSign
  })
})

if (!response.ok) {
  const error = await response.json()
  throw new Error(error.brief || 'Registration failed')
}

const data = await response.json()
return data.payload.user
```

**Benefits:**
- ✅ Backend validates callSign uniqueness
- ✅ Audit log created automatically
- ✅ Authorization enforced
- ✅ Rate limiting applied

#### Task 1.2: Migrate Google Sign-In
**File:** `frontend/src/lib/firebase/auth.js`

**Note:** Google Sign-In is more complex. Two options:

**Option A:** Hybrid approach (keep Firebase Auth, call backend after)
```javascript
const userCredential = await signInWithPopup(auth, googleProvider)

// Call backend to create/update user profile
await fetch(`${API_BASE_URL}/auth/google-signin`, {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${await userCredential.user.getIdToken()}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: userCredential.user.email,
    displayName: userCredential.user.displayName
  })
})
```

**Option B:** Full backend OAuth (recommended long-term)
- Implement backend Google OAuth endpoint
- Frontend redirects to backend OAuth URL
- Backend handles token exchange and user creation
- Backend returns JWT tokens

**Recommendation:** Option A for quick fix, Option B for production.

#### Task 1.3: Migrate Session Creation
**File:** `frontend/src/lib/firebase/sessionService.js`  
**File:** `frontend/src/pages/MissionBriefing.jsx`

**Current:**
```javascript
const newSessionId = await createSession(sessionData)
```

**Replace With:**
```javascript
async function createSessionViaAPI(sessionData) {
  const token = await auth.currentUser.getIdToken()
  
  const response = await fetch(`${API_BASE_URL}/scenario-sessions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(sessionData)
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.brief || 'Failed to create session')
  }
  
  const data = await response.json()
  return data.payload.id
}
```

**Update in MissionBriefing.jsx:**
```javascript
// Line 313, 395
const newSessionId = await createSessionViaAPI(sessionData)
```

#### Task 1.4: Migrate Session Updates
**File:** `frontend/src/lib/firebase/sessionService.js`

**Replace all update functions:**
```javascript
async function updateSessionViaAPI(sessionId, updates) {
  const token = await auth.currentUser.getIdToken()
  
  const response = await fetch(`${API_BASE_URL}/scenario-sessions/${sessionId}`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.brief || 'Failed to update session')
  }
  
  return await response.json()
}

// Use this for:
// - updateSession()
// - markSessionInProgress()
// - saveSessionProgress()
// - completeSession()
```

---

### Phase 2: Cleanup (Priority 2) 🟡

#### Task 2.1: Remove Unused Firestore Helpers
**File:** `frontend/src/lib/firebase/firestore.js`

**Delete these functions:**
- `addDocument()`
- `setDocument()`
- `updateDocument()`
- `deleteDocument()`

**Keep only read operations:**
- `getDocument()`
- `getDocuments()`

#### Task 2.2: Update Imports
Remove write operation imports from:
```javascript
import { doc, setDoc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore'
```

To:
```javascript
import { doc, getDoc, getDocs, query, where, orderBy } from 'firebase/firestore'
```

---

### Phase 3: Verification (Priority 3) ✅

#### Task 3.1: Test All Migrations
- [ ] Test user registration with backend API
- [ ] Test Google sign-in with backend
- [ ] Test session creation through API
- [ ] Test session updates through API
- [ ] Verify audit logs are being created
- [ ] Test with invalid data (should be rejected by backend)

#### Task 3.2: Security Audit
- [ ] Run grep for remaining write operations
- [ ] Verify Firestore security rules deny frontend writes
- [ ] Test with browser console (should fail)
- [ ] Check audit logs for all operations

#### Task 3.3: Performance Testing
- [ ] Compare response times (API vs direct Firestore)
- [ ] Test under load
- [ ] Verify no regressions

---

## 🚨 Immediate Actions Required

### 1. **STOP THE BLEEDING** (Do This First)
```bash
# Update Firestore security rules to DENY frontend writes:
# firestore.rules

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // DENY ALL WRITES FROM FRONTEND
    match /{document=**} {
      allow read: if request.auth != null;
      allow write: if false;  // <-- Block all frontend writes
    }
    
    // Backend service account can still write via Admin SDK
  }
}
```

Deploy immediately:
```bash
firebase deploy --only firestore:rules
```

**Warning:** This will break current functionality but prevents security exploits.

### 2. **Create API Service Layer** (Do This Second)
Create `frontend/src/lib/api/` directory with:
- `authService.js` - Wrap auth endpoints
- `sessionService.js` - Wrap session endpoints
- `httpClient.js` - Centralized fetch wrapper

### 3. **Migrate Critical Paths** (Do This Third)
Priority order:
1. Session completion (cheating risk)
2. User registration (data integrity)
3. Session creation (authorization)
4. Session updates (audit logs)

---

## ❓ Questions & Answers

### Q: Are read-only Firebase calls acceptable short-term?
**A: YES, but with caveats:**

**Acceptable:**
- ✅ Reading public data (scenarios, satellites)
- ✅ Reading user's own data (sessions, progress)
- ✅ Real-time subscriptions (onSnapshot for live updates)

**Not Acceptable:**
- ❌ Reading other users' private data
- ❌ Reading admin-only data
- ❌ Reading sensitive audit logs

**Recommendation:**
- Keep read operations for now (migration can be gradual)
- Migrate reads to API eventually for:
  - Rate limiting
  - Caching
  - Query optimization
  - Better error handling

### Q: Any legacy paths we intentionally keep?
**A: Consider keeping:**

**Firebase Auth (Keep)**
- Firebase Auth SDK for authentication is standard
- signIn, signOut, onAuthStateChanged are safe
- Only migrate the *user profile creation* to backend

**Real-time Listeners (Keep for now)**
- onSnapshot for live updates is Firebase's strength
- Migrate to WebSocket later if needed

**Public Data Reads (Keep for now)**
- Reading scenarios doesn't need API
- Reading satellites doesn't need API
- Low risk, high performance

**Must Migrate:**
- ❌ ALL write operations
- ❌ Sensitive data reads (audit logs, other users)
- ❌ Complex queries (better on backend)

---

## 📋 Implementation Checklist

### Pre-Migration
- [ ] Review this audit with team
- [ ] Get stakeholder approval for Firestore rules change
- [ ] Create feature branch: `feature/api-migration`
- [ ] Set up API environment variables

### Migration
- [ ] Create API service layer (`frontend/src/lib/api/`)
- [ ] Migrate user registration (auth.js)
- [ ] Migrate Google sign-in (auth.js)
- [ ] Migrate session creation (sessionService.js + MissionBriefing.jsx)
- [ ] Migrate session updates (sessionService.js)
- [ ] Delete unused Firestore helpers (firestore.js)
- [ ] Update all imports
- [ ] Add proper error handling for API calls

### Testing
- [ ] Unit tests for API services
- [ ] Integration tests for auth flow
- [ ] Integration tests for session flow
- [ ] Manual testing in development
- [ ] Security testing (try to bypass via console)
- [ ] Load testing

### Deployment
- [ ] Deploy backend first (if API changes needed)
- [ ] Deploy frontend with new API calls
- [ ] Deploy Firestore rules (AFTER frontend deployed)
- [ ] Monitor error rates
- [ ] Verify audit logs working
- [ ] Rollback plan ready

---

## 🎯 Success Criteria

✅ **Migration is successful when:**
1. Zero direct Firestore writes from frontend (except auth SDK)
2. All operations go through backend API
3. Audit logs capture all user actions
4. Security rules deny frontend writes
5. No functionality regressions
6. Response times acceptable (<500ms for most operations)
7. Error handling graceful

---

## 📞 Support & Resources

### Documentation
- Backend API Docs: `/api/v1/docs` (Swagger)
- Firestore Security Rules: `firestore.rules`
- Backend Repository: `backend/src/`

### Need Help?
- Backend API questions → Backend team
- Authentication questions → Auth specialist
- Security questions → Security team

---

## Status: 🔴 CRITICAL - IMMEDIATE ACTION REQUIRED

**Next Steps:**
1. Review this audit
2. Get approval to break current functionality temporarily
3. Deploy blocking Firestore rules
4. Start migration (estimate: 2-3 days)
5. Test thoroughly
6. Deploy with monitoring

**Timeline:**
- **Day 1:** Audit review + API service layer
- **Day 2:** Migrate auth + session creation
- **Day 3:** Migrate session updates + testing
- **Day 4:** Deploy + monitor

---

**Generated:** January 29, 2026  
**Document Version:** 1.0  
**Classification:** INTERNAL - Security Audit
