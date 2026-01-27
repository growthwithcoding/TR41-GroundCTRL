# Frontend Updates Needed - Priority Tasks

**Date:** January 25, 2026  
**Status:** 🔴 ACTION REQUIRED  
**Assigned:** Frontend Team

---

## 📋 Task Summary

1. ✅ **Password Validation Review** - Update to match Security Document requirements
2. ⚠️ **Remove Notification System** - Clean up unused toast/notification components
3. ⚠️ **Account & Settings Pages** - Migrate from Firebase Auth to Backend API
4. ⚠️ **CRUD & Auth** - Ensure async API calls to backend
5. 📝 **Email Server DNS Setup** - Configuration note added

---

## 1. ✅ PASSWORD VALIDATION - SECURITY ALIGNMENT

### Current Status
**Location:** 
- `backend/src/utils/passwordValidation.js` - Minimum 8 characters
- `backend/src/schemas/authSchemas.js` - Zod schema enforces 8 characters

### Security Document Requirements
Per `SECURITY_REQUIREMENTS_CHECKLIST_UPDATED.md` and `SECURITY_COVERAGE_ANALYSIS.md`:
- ⚠️ **REQUIRED:** Minimum 12-14 characters (currently 8)
- ✅ Uppercase letter requirement - IMPLEMENTED
- ✅ Lowercase letter requirement - IMPLEMENTED
- ✅ Number requirement - IMPLEMENTED
- ✅ Special character requirement - IMPLEMENTED
- ✅ Common password blocking (25+ passwords) - IMPLEMENTED

### Required Changes

#### Backend Change 1: `passwordValidation.js`
```javascript
// UPDATE LINE 23
const PASSWORD_RULES = {
  minLength: 12,  // CHANGED FROM 8 to 12
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: true,
  specialChars: '@$!%*?&#^()_+-=[]{}|;:,.<>/'
};
```

#### Backend Change 2: `authSchemas.js`
```javascript
// UPDATE LINES 20, 54, 85, 107 - All password schemas
password: z.string()
  .min(12, 'Password must be at least 12 characters')  // CHANGED FROM 8
  .max(128, 'Password must not exceed 128 characters')
  // ... rest remains the same
```

#### Frontend Change: Update validation messages
- Search for password validation error messages
- Update to reflect 12-character minimum
- Ensure consistency across all forms

---

## 2. ⚠️ REMOVE NOTIFICATION SYSTEM COMPLETELY

### Components to Remove/Clean

#### Files to DELETE:
```
✗ frontend/src/hooks/use-toast.js (151 lines)
✗ frontend/src/components/ui/use-toast.js
✗ frontend/src/components/ui/toaster.jsx
✗ frontend/src/components/ui/toast.jsx
✗ frontend/src/components/ui/sonner.jsx
```

#### Files to UPDATE:

**`frontend/src/pages/Settings.jsx`**
- Remove entire "Notifications" card (lines ~50-90)
- Remove references to:
  - Email Notifications toggle
  - Push Notifications toggle
  - Notification preferences section

**`frontend/src/lib/help-data.js`**
- Remove article with id: "art_028" (Notification Preferences)
- Remove from tags array: "notifications", "preferences"

**`frontend/src/components/app-header.jsx`**
- Remove notifications button/icon from header
- Clean up associated state/handlers

**`frontend/src/contexts/SimulatorStateContext.jsx`**
- Review `ADD_ALERT` action type
- Note: Keep alert-panel.jsx for **system alerts** (different from notifications)
  - Alert Panel = In-simulator system alerts (KEEP)
  - Notifications = User notifications/toasts (REMOVE)

#### Package Cleanup:
```bash
# Check package.json for these dependencies and remove if unused elsewhere:
npm uninstall sonner
npm uninstall @radix-ui/react-toast
```

---

## 3. ⚠️ ACCOUNT & SETTINGS PAGES - MIGRATE TO BACKEND API

### Current Issue
**`frontend/src/pages/Account.jsx`** directly uses Firebase Auth:
```javascript
// LINE 11 - INCORRECT APPROACH
import { updateProfile } from "firebase/auth"

// LINE 38 - DIRECT FIREBASE CALL
await firebaseUpdateProfile(user, { displayName })
```

### Required Changes

#### Account Page Updates
**File:** `frontend/src/pages/Account.jsx`

```javascript
// REMOVE direct Firebase import
// ❌ import { updateProfile } from "firebase/auth"

// ADD API service imports
// ✅ import { updateUserProfile, deleteUserAccount } from "@/lib/api/userService"

// UPDATE handleSaveProfile function:
const handleSaveProfile = async () => {
  if (!user) return
  
  setSaving(true)
  try {
    // ✅ Use backend API instead of Firebase Auth
    await updateUserProfile(user.uid, { displayName })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  } catch (error) {
    console.error("Error updating profile:", error)
    // Show error to user
  }
  setSaving(false)
}

// UPDATE handleDeleteAccount function:
const handleDeleteAccount = async () => {
  if (confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
    try {
      // ✅ Use backend API instead of direct Firebase
      await deleteUserAccount(user.uid)
      await signOut()
      navigate("/")
    } catch (error) {
      console.error("Error deleting account:", error)
      // Show error to user
    }
  }
}
```

#### Settings Page Updates
**File:** `frontend/src/pages/Settings.jsx`

Review for any direct Firebase calls and migrate to backend API:
- Theme preferences → Store in Firestore via backend API
- Display settings → Store in Firestore via backend API
- Privacy settings → Store in Firestore via backend API

#### Create API Service Layer
**File:** `frontend/src/lib/api/userService.js` (CREATE NEW)

```javascript
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1'

/**
 * Update user profile
 */
export async function updateUserProfile(userId, data) {
  const token = await getAuthToken()
  const response = await axios.patch(
    `${API_BASE_URL}/users/${userId}`,
    data,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  )
  return response.data
}

/**
 * Delete user account
 */
export async function deleteUserAccount(userId) {
  const token = await getAuthToken()
  const response = await axios.delete(
    `${API_BASE_URL}/users/${userId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  )
  return response.data
}

/**
 * Get auth token from Firebase
 */
async function getAuthToken() {
  const auth = getAuth()
  const user = auth.currentUser
  if (!user) throw new Error('No authenticated user')
  return await user.getIdToken()
}
```

---

## 4. ⚠️ CRUD & FIREBASE AUTH - BACKEND API CALLS AUDIT

### Files to Audit for Direct Firebase Calls

Run this search to find direct Firebase operations:
```bash
# Search for direct Firestore calls
grep -r "collection(" frontend/src --include="*.jsx" --include="*.js"
grep -r "doc(" frontend/src --include="*.jsx" --include="*.js"
grep -r "setDoc(" frontend/src --include="*.jsx" --include="*.js"
grep -r "updateDoc(" frontend/src --include="*.jsx" --include="*.js"
grep -r "deleteDoc(" frontend/src --include="*.jsx" --include="*.js"
grep -r "getDoc(" frontend/src --include="*.jsx" --include="*.js"

# Search for direct Auth calls
grep -r "updateProfile(" frontend/src --include="*.jsx" --include="*.js"
grep -r "updatePassword(" frontend/src --include="*.jsx" --include="*.js"
grep -r "deleteUser(" frontend/src --include="*.jsx" --include="*.js"
```

### Services Already Implemented (GOOD ✅):
- `frontend/src/lib/firebase/sessionService.js` - Likely OK if manages session state
- `frontend/src/lib/firebase/scenariosService.js` - Check for direct Firestore calls
- `frontend/src/lib/firebase/userProgressService.js` - Check for direct Firestore calls

### Migration Strategy:
1. **Authentication Operations** → Backend `/api/v1/auth/*` endpoints
2. **User CRUD** → Backend `/api/v1/users/*` endpoints
3. **Firestore Data** → Backend endpoints (scenarios, progress, sessions)
4. **Firebase Auth** → Only for token generation and auth state

---

## 5. 📝 EMAIL SERVER DNS SETUP NOTE

### Action Required - Infrastructure Team

**Priority:** MEDIUM  
**Status:** ⚠️ NOT CONFIGURED

### Required DNS Records

For email functionality (password reset, notifications), configure DNS records:

```dns
# SPF Record
Type: TXT
Name: @
Value: v=spf1 include:_spf.google.com ~all
TTL: 3600

# DKIM Record (Get from email provider)
Type: TXT
Name: google._domainkey
Value: [PROVIDED BY GOOGLE WORKSPACE/SENDGRID/ETC]
TTL: 3600

# DMARC Record
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=none; rua=mailto:dmarc@groundctrl.io
TTL: 3600

# MX Records (if using custom domain)
Type: MX
Priority: 1
Value: aspmx.l.google.com
TTL: 3600

Type: MX
Priority: 5
Value: alt1.aspmx.l.google.com
TTL: 3600
```

### Configuration Steps:
1. **Choose Email Provider:**
   - SendGrid (recommended for transactional emails)
   - AWS SES
   - Google Workspace
   - Mailgun

2. **Configure Backend:**
   ```env
   # Add to .env
   EMAIL_PROVIDER=sendgrid
   SENDGRID_API_KEY=your_key_here
   EMAIL_FROM=noreply@groundctrl.io
   EMAIL_FROM_NAME=GroundCTRL Mission Control
   ```

3. **Update `backend/src/services/emailService.js`:**
   - Verify SMTP/API configuration
   - Test email delivery
   - Configure templates for:
     - Password reset
     - Email verification
     - Account notifications

4. **DNS Verification:**
   ```bash
   # Verify SPF
   dig txt yourdomain.com
   
   # Verify DKIM
   dig txt google._domainkey.yourdomain.com
   
   # Verify DMARC
   dig txt _dmarc.yourdomain.com
   ```

5. **Testing:**
   - Send test password reset email
   - Verify deliverability
   - Check spam score
   - Monitor bounce rates

---

## ✅ Implementation Checklist

### Phase 1: Security (PRIORITY 1)
- [ ] Update `passwordValidation.js` minimum to 12 characters
- [ ] Update all Zod schemas to require 12 characters
- [ ] Update frontend validation messages
- [ ] Test registration with new requirements
- [ ] Update documentation/user-facing messages

### Phase 2: Notification Cleanup (PRIORITY 2)
- [ ] Remove toast component files (5 files)
- [ ] Remove notification section from Settings page
- [ ] Remove notification button from app header
- [ ] Remove notification article from help-data.js
- [ ] Uninstall unused npm packages
- [ ] Test build for broken imports
- [ ] Verify simulator alert-panel still works (KEEP THIS)

### Phase 3: API Migration (PRIORITY 1)
- [ ] Create `frontend/src/lib/api/userService.js`
- [ ] Implement `updateUserProfile()` function
- [ ] Implement `deleteUserAccount()` function
- [ ] Update `Account.jsx` to use new API service
- [ ] Update `Settings.jsx` to use backend APIs
- [ ] Audit all Firebase direct calls
- [ ] Test all CRUD operations through backend
- [ ] Verify authentication token handling

### Phase 4: Email DNS (PRIORITY 2)
- [ ] Choose email service provider
- [ ] Configure DNS records (SPF, DKIM, DMARC, MX)
- [ ] Update backend environment variables
- [ ] Configure emailService.js
- [ ] Test password reset emails
- [ ] Verify email deliverability
- [ ] Document email setup in README

---

## 🧪 Testing Requirements

### Password Validation Testing:
```javascript
// Test cases for 12-character minimum:
✓ "ShortPass1!" - SHOULD FAIL (11 chars)
✓ "ValidPass123!" - SHOULD PASS (13 chars)
✓ "StrongP@ssw0rd!" - SHOULD PASS (15 chars)
```

### API Integration Testing:
```javascript
// Test Account.jsx changes:
✓ Update display name via backend API
✓ Delete account via backend API
✓ Error handling for network failures
✓ Token refresh on 401 errors
```

### Notification Removal Testing:
```bash
✓ Build completes without errors
✓ No console errors about missing toast components
✓ Settings page renders correctly
✓ Simulator alerts still display (alert-panel.jsx)
```

---

## 📚 Related Documentation

- `backend/tests-backend/SECURITY_REQUIREMENTS_CHECKLIST_UPDATED.md` - Security requirements
- `backend/tests-backend/SECURITY_COVERAGE_ANALYSIS.md` - Detailed security analysis
- `backend/tests-backend/IMPLEMENTATION_ROADMAP.md` - Backend implementation guide
- `backend/README.md` - API documentation
- `FRONTEND_FIX_NOTES.md` - General frontend issues

---

## 🚨 Breaking Changes

### Password Minimum Change:
- **Impact:** Existing users with 8-11 character passwords can still log in
- **Action:** Force password reset on next login for affected users
- **Migration:** Add check in login flow to detect weak passwords

### API Migration:
- **Impact:** Frontend must communicate with backend for all user operations
- **Action:** Ensure backend endpoints are deployed before frontend changes
- **Rollback:** Keep Firebase direct calls commented out temporarily

---

## 📞 Questions / Blockers

### For Backend Team:
- [ ] Are `/api/v1/users/:id` PATCH/DELETE endpoints implemented?
- [ ] Does updateUser endpoint support displayName field?
- [ ] Is user deletion properly cascading to related data?
- [ ] Are audit logs capturing profile updates?

### For DevOps/Infrastructure:
- [ ] Which email provider should we use?
- [ ] Do we have access to DNS management?
- [ ] What domain will emails send from?
- [ ] Is there a budget for email service?

### For Security/Mohana:
- [ ] Confirm 12-character minimum is sufficient
- [ ] Should we implement password history (prevent reuse)?
- [ ] Do we need password expiration policies?
- [ ] Should we add password strength meter to UI?

---

## 🎯 Success Criteria

✅ **Password Validation:**
- Backend rejects passwords < 12 characters
- Frontend shows clear error messages
- All tests pass with new requirements

✅ **Notification Removal:**
- Zero references to toast/notification components
- Clean build with no warnings
- Reduced bundle size

✅ **API Migration:**
- All user operations go through backend API
- No direct Firebase CRUD calls (except auth tokens)
- Proper error handling and loading states

✅ **Email DNS:**
- DNS records configured and verified
- Test emails delivered successfully
- SPF/DKIM/DMARC passing

---

**Next Steps:**
1. Review this document with team
2. Assign tasks to team members
3. Create GitHub issues for each phase
4. Update JIRA/project tracker
5. Schedule pair programming session for API migration

**Estimated Time:**
- Phase 1 (Security): 2 hours
- Phase 2 (Notifications): 3 hours
- Phase 3 (API Migration): 8 hours
- Phase 4 (Email DNS): 4 hours (with infrastructure team)
**Total: ~17 hours** (2-3 days)

---

## 🎨 ADDITIONAL UI/UX IMPROVEMENTS COMPLETED

### 1. ✅ Help Page - NOVA Chat Layout Fixed
**File:** `frontend/src/pages/Help.jsx`

**Issue:** NOVA chat sidebar was not taking up full column height, causing "Ask Nova" input to appear right below first message.

**Solution:**
```jsx
// Changed from:
<NovaChat sessionId={`help-${sessionId}`} context="help" className="hidden lg:block sticky top-16" />

// To:
<NovaChat sessionId={`help-${sessionId}`} context="help" className="hidden lg:flex h-[calc(100vh-4rem)] sticky top-16" />
```

**Result:** NOVA chat now properly spans the full height of the viewport, with messages scrollable and input fixed at bottom.

---

### 2. ✅ Footer - Removed Redundant Help Link
**File:** `frontend/src/components/footer.jsx`

**Issue:** Help link was redundant since it's already in the main navigation.

**Change:** Removed Help link from footer, keeping only:
- Privacy Policy
- Terms of Service
- Contact

**Result:** Cleaner footer with less redundancy.

---

### 3. ✅ Quick Actions - Improved Spacing & Padding
**File:** `frontend/src/components/dashboard/quick-actions.jsx`

**Changes:**
```jsx
// Improved spacing between buttons
<div className="p-4 space-y-3">  // Changed from space-y-2

// Better button padding and icon sizing
<Button
  variant={action.variant}
  className={`w-full justify-start gap-4 h-auto py-4 px-4 ${...}`}  // Increased from gap-3, py-3
>
  <action.icon className="w-5 h-5 flex-shrink-0" />  // Increased from w-4 h-4
  <div className="flex-1 text-left">
    <div className="text-sm font-medium mb-0.5">{action.label}</div>  // Added mb-0.5
    <div className="text-xs text-muted-foreground">{action.description}</div>
  </div>
</Button>
```

**Result:** More comfortable spacing, better visual hierarchy, easier to tap/click.

---

### 4. ✅ Dashboard - Real Logged Mission Time
**Files:** 
- `frontend/src/pages/Dashboard.jsx`
- `frontend/src/lib/firebase/userProgressService.js`

**Issue:** Dashboard showed current UTC time instead of user's actual logged simulator time.

**Solution:**

#### A. Added Utility Functions (userProgressService.js)
```javascript
/**
 * Calculate total logged mission time from all sessions
 * Sums up time from startedAt to completedAt/updatedAt for all scenario sessions
 */
export function getTotalMissionTime(sessions) {
  let totalSeconds = 0;
  
  sessions.forEach(session => {
    if (session.startedAt) {
      const startTime = session.startedAt instanceof Date ? session.startedAt : new Date(session.startedAt);
      
      let endTime;
      if (session.completedAt) {
        endTime = session.completedAt instanceof Date ? session.completedAt : new Date(session.completedAt);
      } else if (session.updatedAt) {
        endTime = session.updatedAt instanceof Date ? session.updatedAt : new Date(session.updatedAt);
      } else {
        return;
      }
      
      const durationMs = endTime - startTime;
      if (durationMs > 0) {
        totalSeconds += Math.floor(durationMs / 1000);
      }
    }
  });
  
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  return { hours, minutes, seconds, totalSeconds };
}

/**
 * Format mission time for display
 * Examples: "2h 15m 30s", "45m 20s", "30s"
 */
export function formatMissionTime(timeObject) {
  const { hours, minutes, seconds } = timeObject;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  } else {
    return `${seconds}s`;
  }
}
```

#### B. Updated Dashboard Component
```javascript
import { fetchUserProgress, getTotalMissionTime, formatMissionTime } from "@/lib/firebase/userProgressService"

// Added state for mission time
const [missionTime, setMissionTime] = useState({ hours: 0, minutes: 0, seconds: 0 })
const [loadingMissionTime, setLoadingMissionTime] = useState(true)

// Fetch on mount
useEffect(() => {
  async function loadMissionTime() {
    if (!user) return
    
    try {
      setLoadingMissionTime(true)
      const sessions = await fetchUserProgress(user.uid)
      const totalTime = getTotalMissionTime(sessions)
      setMissionTime(totalTime)
    } catch (error) {
      console.error('Error loading mission time:', error)
    } finally {
      setLoadingMissionTime(false)
    }
  }
  
  loadMissionTime()
}, [user])

// Display in header
<div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted border border-border">
  <Clock className="h-4 w-4 text-primary" />
  <div className="text-xs">
    <div className="text-muted-foreground">LOGGED MISSION TIME</div>
    <div className="font-mono text-foreground">
      {loadingMissionTime ? (
        <Loader2 className="h-3 w-3 animate-spin inline" />
      ) : (
        formatMissionTime(missionTime)
      )}
    </div>
  </div>
</div>
```

**Result:** Dashboard now displays actual cumulative time spent in simulator across all missions, not just current time.

**Data Source:** Firestore `scenario_sessions` collection
- Calculates: `(completedAt || updatedAt) - startedAt` for each session
- Aggregates: All sessions for the user
- Displays: Total in hours, minutes, seconds format

---

## 📊 Summary of UI/UX Improvements

| Component | Issue | Status | Impact |
|-----------|-------|--------|--------|
| Help Page NOVA | Chat not full height | ✅ Fixed | Better UX, proper layout |
| Footer Links | Redundant Help link | ✅ Removed | Cleaner design |
| Quick Actions | Tight spacing | ✅ Improved | Better touch targets |
| Dashboard Time | Shows UTC not logged time | ✅ Fixed | Shows actual progress |

**Files Modified:**
1. `frontend/src/pages/Help.jsx`
2. `frontend/src/components/footer.jsx`
3. `frontend/src/components/dashboard/quick-actions.jsx`
4. `frontend/src/pages/Dashboard.jsx`
5. `frontend/src/lib/firebase/userProgressService.js`

**Testing Notes:**
- Verify NOVA chat scrolls properly on Help page
- Confirm logged mission time updates after completing missions
- Test Quick Actions button spacing on mobile/tablet
- Ensure footer links work correctly

---

## 🚀 ADDITIONAL DASHBOARD & FEATURES REQUIREMENTS

### 5. ⚠️ Dashboard Mission Progress - Show Actual User Progress
**File:** `frontend/src/components/dashboard/mission-progress.jsx`

**Current Issue:** Mission Progress component likely shows static/mock data instead of user's actual scenario completion progress.

**Required Changes:**
1. Fetch user's scenario sessions from Firestore
2. Calculate completion percentage based on completed vs total available missions
3. Show progress by tier (Rookie Pilot, Mission Specialist, Mission Commander)
4. Display visual progress bars with actual data

**Implementation:**
```javascript
import { fetchUserProgress, getCompletedScenarioCodes } from "@/lib/firebase/userProgressService"
import { fetchPublishedScenarios } from "@/lib/firebase/scenariosService"

// In component:
const [sessions, setSessions] = useState([])
const [scenarios, setScenarios] = useState([])
const [progress, setProgress] = useState({
  totalCompleted: 0,
  totalAvailable: 0,
  byTier: {
    ROOKIE_PILOT: { completed: 0, total: 0 },
    MISSION_SPECIALIST: { completed: 0, total: 0 },
    MISSION_COMMANDER: { completed: 0, total: 0 }
  }
})

useEffect(() => {
  async function loadProgress() {
    const userSessions = await fetchUserProgress(user.uid)
    const allScenarios = await fetchPublishedScenarios()
    const completedCodes = getCompletedScenarioCodes(userSessions)
    
    // Calculate progress by tier
    const progressData = calculateProgressByTier(allScenarios, completedCodes)
    setProgress(progressData)
  }
  loadProgress()
}, [user])
```

**Data Source:** 
- `scenario_sessions` collection (user's completed missions)
- `scenarios` collection (all available missions)

---

### 6. ⚠️ Dashboard Recent Activity - Connect to Audit Logs
**File:** `frontend/src/components/dashboard/recent-activity.jsx`

**Current Issue:** Recent Activity component shows static/mock data instead of user's actual activity from audit logs.

**Required Changes:**
1. Fetch user's recent audit logs from Firestore
2. Display actual login events, mission starts/completions, achievements
3. Show timestamps and activity types
4. Limit to most recent 5-10 activities

**Implementation:**
```javascript
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase/config'

async function fetchUserActivity(userId) {
  const auditRef = collection(db, 'audit_logs')
  const q = query(
    auditRef,
    where('userId', '==', userId),
    where('severity', 'in', ['INFO', 'SUCCESS']), // Only show positive events
    orderBy('timestamp', 'desc'),
    limit(10)
  )
  
  const snapshot = await getDocs(q)
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    timestamp: doc.data().timestamp?.toDate()
  }))
}

// Activity types to display:
// - USER_LOGIN
// - SCENARIO_STARTED
// - SCENARIO_COMPLETED
// - ACHIEVEMENT_EARNED
// - COMMAND_EXECUTED (successful)
```

**Data Source:** `audit_logs` collection

**UI Display:**
```jsx
{activities.map(activity => (
  <div key={activity.id} className="flex items-center gap-3 p-3">
    <ActivityIcon type={activity.eventType} />
    <div className="flex-1">
      <p className="text-sm text-foreground">{activity.message}</p>
      <p className="text-xs text-muted-foreground">
        {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
      </p>
    </div>
  </div>
))}
```

---

### 7. ⚠️ Dashboard Current Mission - Match Actual Session Data
**File:** `frontend/src/components/dashboard/satellite-overview.jsx` OR create new component

**Current Issue:** Dashboard doesn't show user's current in-progress mission or suggest next mission based on their progress.

**Required Changes:**

#### A. Show Current In-Progress Mission
```javascript
import { 
  fetchUserProgress, 
  getInProgressSession, 
  getCompletedScenarioCodes,
  getNextAvailableMission 
} from "@/lib/firebase/userProgressService"

const [currentMission, setCurrentMission] = useState(null)
const [suggestedMission, setSuggestedMission] = useState(null)

useEffect(() => {
  async function loadCurrentMission() {
    const sessions = await fetchUserProgress(user.uid)
    const inProgress = getInProgressSession(sessions)
    
    if (inProgress) {
      // Fetch scenario details
      const scenario = await fetchScenarioById(inProgress.scenario_id)
      setCurrentMission({
        ...scenario,
        session: inProgress,
        progress: calculateStepProgress(inProgress)
      })
    } else {
      // Suggest next mission based on completed missions
      const completedCodes = getCompletedScenarioCodes(sessions)
      const allScenarios = await fetchPublishedScenarios()
      const nextMission = getNextAvailableMission(allScenarios, completedCodes)
      setSuggestedMission(nextMission)
    }
  }
  loadCurrentMission()
}, [user])
```

#### B. Display Logic
```jsx
{currentMission ? (
  <div className="bg-card border border-border rounded-lg p-6">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold">Current Mission</h3>
      <Badge variant="default">In Progress</Badge>
    </div>
    <p className="text-sm text-muted-foreground mb-2">{currentMission.title}</p>
    <p className="text-xs text-muted-foreground mb-4">{currentMission.description}</p>
    
    {/* Progress Bar */}
    <div className="space-y-2">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">Progress</span>
        <span className="font-mono">{currentMission.progress.currentStep}/{currentMission.progress.totalSteps}</span>
      </div>
      <Progress value={(currentMission.progress.currentStep / currentMission.progress.totalSteps) * 100} />
    </div>
    
    <Link to="/simulator">
      <Button className="w-full mt-4">
        <Play className="w-4 h-4 mr-2" />
        Continue Mission
      </Button>
    </Link>
  </div>
) : suggestedMission ? (
  <div className="bg-card border border-border rounded-lg p-6">
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold">Suggested Next Mission</h3>
      <Badge variant="outline">{suggestedMission._firestore.tier}</Badge>
    </div>
    <p className="text-sm text-muted-foreground mb-2">{suggestedMission.title}</p>
    <p className="text-xs text-muted-foreground mb-4">{suggestedMission.description}</p>
    
    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
      <Clock className="w-3 h-3" />
      <span>{suggestedMission.estimatedDuration} min</span>
      <span>•</span>
      <span>{suggestedMission.difficulty}</span>
    </div>
    
    <Link to={`/missions/${suggestedMission.id}`}>
      <Button className="w-full">
        <Rocket className="w-4 h-4 mr-2" />
        Start Mission
      </Button>
    </Link>
  </div>
) : (
  <div className="bg-card border border-border rounded-lg p-6 text-center">
    <Trophy className="w-12 h-12 mx-auto mb-4 text-primary" />
    <h3 className="text-lg font-semibold mb-2">All Missions Completed!</h3>
    <p className="text-sm text-muted-foreground">
      Congratulations! You've completed all available missions.
    </p>
  </div>
)}
```

**Helper Function:**
```javascript
function calculateStepProgress(session) {
  const completedSteps = session.steps_completed || []
  const totalSteps = session.total_steps || 1
  return {
    currentStep: completedSteps.length,
    totalSteps: totalSteps,
    percentage: (completedSteps.length / totalSteps) * 100
  }
}
```

---

### 8. 🆕 Scenario Creation Page - Admin & User Tool
**New File:** `frontend/src/pages/ScenarioCreator.jsx`

**Purpose:** Allow admins (and potentially users) to create new scenarios that conform to the backend schema structure.

**Route:** `/scenarios/create` (protected, admin-only initially)

**Features Required:**

#### A. Form Structure (Multi-Step Wizard)

**Step 1: Basic Information**
```javascript
- Scenario Code (unique identifier)
- Title
- Description
- Category (dropdown)
- Difficulty (Beginner/Intermediate/Advanced/Expert)
- Estimated Duration (minutes)
- Tier (ROOKIE_PILOT/MISSION_SPECIALIST/MISSION_COMMANDER)
- Is Core Mission (boolean)
- Is Active (boolean)
```

**Step 2: Prerequisites & Learning Objectives**
```javascript
- Prerequisites (multi-select from existing scenarios)
- Learning Objectives (list of strings)
- Tags (comma-separated or tag input)
```

**Step 3: Satellite Configuration**
```javascript
- Satellite Name
- Initial Orbit Parameters:
  - Perigee (km)
  - Apogee (km)
  - Inclination (degrees)
  - RAAN (degrees)
  - Argument of Perigee (degrees)
  - True Anomaly (degrees)
- Fuel Level (%)
- Battery Level (%)
- Solar Panel Status
- Communication System Status
```

**Step 4: Mission Steps (Dynamic List)**
```javascript
For each step:
- Step Number (auto-generated)
- Title
- Description
- Step Type (EXECUTE_COMMAND, OBSERVE_STATE, DECISION_POINT, etc.)
- Success Criteria (JSON or form fields)
- Failure Conditions (optional)
- Hints (list of strings)
- Expected Commands (if applicable)
- Time Limit (optional, seconds)
- Points Awarded
```

**Step 5: Success/Failure Conditions & Rewards**
```javascript
- Success Message
- Failure Message
- Points Awarded
- Achievements Unlocked (multi-select)
- Next Recommended Scenarios (multi-select)
```

**Step 6: Preview & Validation**
```javascript
- Show JSON preview
- Validate against backend schema
- Test scenario configuration
- Submit to Firestore
```

#### B. Implementation Structure

**File:** `frontend/src/pages/ScenarioCreator.jsx`
```javascript
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/hooks/use-auth"
import { createScenario } from "@/lib/firebase/scenariosService"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ScenarioCreator() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [scenarioData, setScenarioData] = useState({
    code: "",
    title: "",
    description: "",
    category: "ORBITAL_MECHANICS",
    difficulty: "BEGINNER",
    estimatedDuration: 30,
    tier: "ROOKIE_PILOT",
    isCore: true,
    isActive: true,
    prerequisites: [],
    learningObjectives: [],
    tags: [],
    satellite: {
      name: "SAT-001",
      orbit: {
        perigee: 400,
        apogee: 600,
        inclination: 51.6,
        raan: 0,
        argumentOfPerigee: 0,
        trueAnomaly: 0
      },
      fuel: 100,
      battery: 100,
      solarPanelStatus: "DEPLOYED",
      commStatus: "NOMINAL"
    },
    steps: [],
    successMessage: "",
    failureMessage: "",
    pointsAwarded: 100,
    achievements: [],
    nextRecommendedScenarios: []
  })

  const handleSubmit = async () => {
    try {
      // Validate scenario data against schema
      const validatedData = validateScenarioSchema(scenarioData)
      
      // Create scenario in Firestore
      await createScenario(validatedData)
      
      // Navigate to scenarios list
      navigate("/scenarios")
    } catch (error) {
      console.error("Error creating scenario:", error)
      // Show error toast
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Create New Scenario</h1>
        
        {/* Multi-step form implementation */}
        <Tabs value={`step-${currentStep}`} onValueChange={(v) => setCurrentStep(parseInt(v.split('-')[1]))}>
          <TabsList className="grid grid-cols-6 w-full">
            <TabsTrigger value="step-1">Basic</TabsTrigger>
            <TabsTrigger value="step-2">Prerequisites</TabsTrigger>
            <TabsTrigger value="step-3">Satellite</TabsTrigger>
            <TabsTrigger value="step-4">Steps</TabsTrigger>
            <TabsTrigger value="step-5">Rewards</TabsTrigger>
            <TabsTrigger value="step-6">Preview</TabsTrigger>
          </TabsList>
          
          {/* Form content for each step */}
          <TabsContent value="step-1">
            {/* Basic Information Form */}
          </TabsContent>
          
          {/* ... other tabs ... */}
          
          <TabsContent value="step-6">
            {/* JSON Preview and Submit */}
            <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-96">
              {JSON.stringify(scenarioData, null, 2)}
            </pre>
            <Button onClick={handleSubmit} className="mt-4">
              Create Scenario
            </Button>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
```

#### C. Backend Schema Validation

**File:** `frontend/src/lib/schemas/scenarioSchema.js`
```javascript
import { z } from 'zod'

export const scenarioSchema = z.object({
  code: z.string().min(3).max(50).regex(/^[A-Z0-9_-]+$/),
  title: z.string().min(5).max(100),
  description: z.string().min(20).max(500),
  category: z.enum(['ORBITAL_MECHANICS', 'COMMUNICATION', 'POWER_MANAGEMENT', 'ANOMALY_RESOLUTION', 'ADVANCED']),
  difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']),
  estimatedDuration: z.number().min(5).max(180),
  tier: z.enum(['ROOKIE_PILOT', 'MISSION_SPECIALIST', 'MISSION_COMMANDER']),
  isCore: z.boolean(),
  isActive: z.boolean(),
  prerequisites: z.array(z.string()),
  learningObjectives: z.array(z.string()),
  tags: z.array(z.string()),
  satellite: z.object({
    name: z.string(),
    orbit: z.object({
      perigee: z.number(),
      apogee: z.number(),
      inclination: z.number(),
      raan: z.number(),
      argumentOfPerigee: z.number(),
      trueAnomaly: z.number()
    }),
    fuel: z.number().min(0).max(100),
    battery: z.number().min(0).max(100),
    solarPanelStatus: z.enum(['STOWED', 'DEPLOYED', 'DAMAGED']),
    commStatus: z.enum(['NOMINAL', 'DEGRADED', 'OFFLINE'])
  }),
  steps: z.array(z.object({
    stepNumber: z.number(),
    title: z.string(),
    description: z.string(),
    stepType: z.string(),
    successCriteria: z.any(),
    hints: z.array(z.string()),
    pointsAwarded: z.number()
  })),
  successMessage: z.string(),
  failureMessage: z.string(),
  pointsAwarded: z.number(),
  achievements: z.array(z.string()),
  nextRecommendedScenarios: z.array(z.string())
})

export function validateScenarioSchema(data) {
  return scenarioSchema.parse(data)
}
```

#### D. Firestore Service Function

**File:** `frontend/src/lib/firebase/scenariosService.js`
```javascript
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './config'

export async function createScenario(scenarioData) {
  const scenariosRef = collection(db, 'scenarios')
  
  const docData = {
    ...scenarioData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdBy: auth.currentUser?.uid,
    version: 1
  }
  
  const docRef = await addDoc(scenariosRef, docData)
  return docRef.id
}
```

---

## 📋 Updated Implementation Checklist

### Phase 5: Dashboard Real Data Integration (PRIORITY 1)
- [ ] Update Mission Progress to show actual user completion data
- [ ] Fetch and display progress by tier (Rookie/Specialist/Commander)
- [ ] Connect Recent Activity to audit_logs collection
- [ ] Filter and display recent user events (logins, completions, achievements)
- [ ] Update Current Mission to show in-progress session or suggest next mission
- [ ] Add progress calculation for current mission steps
- [ ] Test all dashboard components with real Firestore data

### Phase 6: Scenario Creator Tool (PRIORITY 2)
- [ ] Create `/scenarios/create` route (admin-protected)
- [ ] Build multi-step wizard UI (6 steps)
- [ ] Implement form validation with Zod schema
- [ ] Add step configuration UI (dynamic list)
- [ ] Create JSON preview panel
- [ ] Implement Firestore submission function
- [ ] Add success/error handling
- [ ] Test scenario creation end-to-end
- [ ] Add admin role check middleware
- [ ] Document scenario creation process

---

## 🎯 Additional Testing Requirements

### Dashboard Real Data Testing:
```javascript
// Test Mission Progress:
✓ Completed missions count correctly
✓ Progress bars reflect actual completion percentage
✓ Tier breakdown (Rookie/Specialist/Commander) accurate

// Test Recent Activity:
✓ Shows last 10 audit log events
✓ Timestamps display correctly (relative time)
✓ Icons match event types
✓ Activity updates in real-time

// Test Current Mission:
✓ Shows in-progress mission with correct progress
✓ Suggests appropriate next mission when no active mission
✓ "Continue Mission" button links to simulator
✓ Handles edge case: all missions completed
```

### Scenario Creator Testing:
```javascript
✓ Form validation prevents invalid data
✓ Multi-step wizard navigation works
✓ JSON preview updates in real-time
✓ Scenario saves to Firestore correctly
✓ Schema validation catches errors
✓ Admin-only access enforced
✓ Created scenarios appear in missions list
```

---

## 📊 Updated File Structure

**New Files to Create:**
- `frontend/src/pages/ScenarioCreator.jsx`
- `frontend/src/lib/schemas/scenarioSchema.js`
- `frontend/src/components/dashboard/current-mission.jsx` (optional, if refactoring)
- `frontend/src/components/scenario-creator/` (step components)
  - `BasicInfoStep.jsx`
  - `PrerequisitesStep.jsx`
  - `SatelliteConfigStep.jsx`
  - `MissionStepsStep.jsx`
  - `RewardsStep.jsx`
  - `PreviewStep.jsx`

**Files to Modify:**
- `frontend/src/components/dashboard/mission-progress.jsx`
- `frontend/src/components/dashboard/recent-activity.jsx`
- `frontend/src/components/dashboard/satellite-overview.jsx` (or create current-mission.jsx)
- `frontend/src/lib/firebase/scenariosService.js`
- `frontend/src/App.jsx` (add route for /scenarios/create)

---

## ⏱️ Updated Time Estimates

**Phase 5 (Dashboard Real Data):** 6-8 hours
- Mission Progress: 2 hours
- Recent Activity: 2 hours
- Current Mission: 2-3 hours
- Testing & refinement: 1 hour

**Phase 6 (Scenario Creator):** 12-16 hours
- UI Components (6 steps): 6 hours
- Form validation & state management: 3 hours
- Firestore integration: 2 hours
- Testing & debugging: 3 hours
- Documentation: 1 hour

**Grand Total: ~35-41 hours** (approximately 5-6 days)

---

## 🔧 ACCOUNT PAGE FIXES REQUIRED

### 9. ⚠️ Password Change Functionality
**File:** `frontend/src/pages/Account.jsx`

**Current Issue:** Password change button exists but doesn't implement actual password change functionality.

**Firebase Auth Password Change Flow:**
Firebase Auth handles password changes via email link (passwordless). The flow is:
1. User clicks "Change Password"
2. System sends password reset email to user's registered email
3. User clicks link in email
4. Firebase redirects to password reset page
5. User enters new password

**Implementation:**

```javascript
import { sendPasswordResetEmail } from "firebase/auth"
import { auth } from "@/lib/firebase/config"

const [sendingPasswordReset, setSendingPasswordReset] = useState(false)
const [passwordResetSent, setPasswordResetSent] = useState(false)

const handleChangePassword = async () => {
  if (!user?.email) return
  
  try {
    setSendingPasswordReset(true)
    
    // Send password reset email via Firebase Auth
    await sendPasswordResetEmail(auth, user.email, {
      url: `${window.location.origin}/login`, // Return URL after password reset
      handleCodeInApp: false
    })
    
    setPasswordResetSent(true)
    
    // Show success message
    alert(`Password reset email sent to ${user.email}. Please check your inbox.`)
    
    // Reset state after 5 seconds
    setTimeout(() => setPasswordResetSent(false), 5000)
  } catch (error) {
    console.error("Error sending password reset email:", error)
    alert("Failed to send password reset email. Please try again.")
  } finally {
    setSendingPasswordReset(false)
  }
}
```

**Update UI:**
```jsx
<div className="flex items-center justify-between">
  <div>
    <p className="font-medium text-foreground">Password</p>
    <p className="text-sm text-muted-foreground">
      {passwordResetSent 
        ? `Reset email sent to ${user.email}` 
        : 'Change your password via email'
      }
    </p>
  </div>
  <Button 
    variant="outline" 
    onClick={handleChangePassword}
    disabled={sendingPasswordReset || passwordResetSent}
  >
    {sendingPasswordReset ? (
      <>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Sending...
      </>
    ) : passwordResetSent ? (
      'Email Sent ✓'
    ) : (
      'Change Password'
    )}
  </Button>
</div>
```

**Alternative: Backend API Approach**

If you prefer to use backend API instead of direct Firebase:

```javascript
// frontend/src/lib/api/authService.js
export async function requestPasswordChange(email) {
  const token = await getAuthToken()
  const response = await axios.post(
    `${API_BASE_URL}/auth/request-password-reset`,
    { email },
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  )
  return response.data
}
```

**Required Environment Variables:**
```env
# Backend .env
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your_key_here
PASSWORD_RESET_URL=https://groundctrl.io/reset-password
PASSWORD_RESET_EXPIRY=3600 # 1 hour in seconds
```

---

### 10. ⚠️ Two-Factor Authentication - Coming Soon
**File:** `frontend/src/pages/Account.jsx`

**Current Issue:** 2FA section is visible but not implemented.

**Required Changes:**

1. **Gray out the 2FA section**
2. **Add "Coming Soon" badge**
3. **Disable the Enable button**
4. **Add tooltip explaining it's not available yet**

**Implementation:**

```jsx
{/* Security Section */}
<Card>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <Shield className="h-5 w-5" />
      Security
    </CardTitle>
    <CardDescription>Manage your security settings</CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    {/* Password Change */}
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium text-foreground">Password</p>
        <p className="text-sm text-muted-foreground">
          Change your password via email
        </p>
      </div>
      <Button variant="outline" onClick={handleChangePassword}>
        Change Password
      </Button>
    </div>
    
    {/* Two-Factor Authentication - DISABLED/COMING SOON */}
    <div className="flex items-center justify-between opacity-50 cursor-not-allowed">
      <div>
        <div className="flex items-center gap-2">
          <p className="font-medium text-foreground">Two-Factor Authentication</p>
          <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Add an extra layer of security (Feature in development)
        </p>
      </div>
      <Button variant="outline" disabled>
        Enable
      </Button>
    </div>
  </CardContent>
</Card>
```

**With Tooltip (Optional):**

```jsx
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

<TooltipProvider>
  <Tooltip>
    <TooltipTrigger asChild>
      <div className="flex items-center justify-between opacity-50 cursor-not-allowed">
        {/* ... 2FA content ... */}
      </div>
    </TooltipTrigger>
    <TooltipContent>
      <p>Two-Factor Authentication will be available in a future update</p>
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

---

### 11. 🐛 Account Delete Not Working
**File:** `frontend/src/pages/Account.jsx`

**Current Issue:** Delete account button exists but doesn't actually delete the account.

**Root Causes:**
1. Missing Firebase Auth delete user implementation
2. No backend API call to cascade delete user data
3. No Firestore cleanup for user's scenarios, sessions, progress

**Complete Fix Required:**

#### A. Frontend Implementation

```javascript
import { deleteUser } from "firebase/auth"
import { auth } from "@/lib/firebase/config"

const [deleting, setDeleting] = useState(false)

const handleDeleteAccount = async () => {
  const confirmMessage = `
    ⚠️ WARNING: This action cannot be undone!
    
    This will permanently delete:
    - Your account and profile
    - All mission progress and sessions
    - Achievement history
    - Activity logs
    
    Type "DELETE" to confirm:
  `
  
  const confirmation = prompt(confirmMessage)
  
  if (confirmation !== "DELETE") {
    return
  }
  
  try {
    setDeleting(true)
    
    // Step 1: Call backend to delete all user data from Firestore
    await deleteUserData(user.uid)
    
    // Step 2: Delete Firebase Auth user
    const currentUser = auth.currentUser
    if (currentUser) {
      await deleteUser(currentUser)
    }
    
    // Step 3: Sign out and redirect
    await signOut()
    navigate("/", { replace: true })
    
  } catch (error) {
    console.error("Error deleting account:", error)
    
    // Handle re-authentication required error
    if (error.code === 'auth/requires-recent-login') {
      alert(
        "For security, please log out and log back in, then try deleting your account again."
      )
    } else {
      alert("Failed to delete account. Please contact support.")
    }
  } finally {
    setDeleting(false)
  }
}
```

#### B. Backend API Endpoint

**File:** `backend/src/controllers/userController.js`

```javascript
/**
 * Delete user account and all associated data
 * DELETE /api/v1/users/:userId
 */
async function deleteUserAccount(req, res) {
  try {
    const { userId } = req.params
    const requestingUserId = req.user.uid
    
    // Security: Users can only delete their own account (unless admin)
    if (userId !== requestingUserId && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized to delete this account'
      })
    }
    
    // Delete user data from Firestore collections
    await deleteUserFromFirestore(userId)
    
    // Delete user from Firebase Auth
    await admin.auth().deleteUser(userId)
    
    // Log the deletion in audit logs
    await auditLog({
      eventType: 'USER_ACCOUNT_DELETED',
      userId: userId,
      severity: 'WARNING',
      message: `User account ${userId} was permanently deleted`
    })
    
    return res.status(200).json({
      success: true,
      message: 'Account successfully deleted'
    })
    
  } catch (error) {
    console.error('Error deleting user account:', error)
    return res.status(500).json({
      success: false,
      error: 'Failed to delete account'
    })
  }
}

/**
 * Delete all user data from Firestore
 */
async function deleteUserFromFirestore(userId) {
  const db = admin.firestore()
  const batch = db.batch()
  
  // Delete scenario sessions
  const sessionsQuery = await db.collection('scenario_sessions')
    .where('user_id', '==', userId)
    .get()
  sessionsQuery.forEach(doc => batch.delete(doc.ref))
  
  // Delete user progress
  const progressQuery = await db.collection('user_progress')
    .where('user_id', '==', userId)
    .get()
  progressQuery.forEach(doc => batch.delete(doc.ref))
  
  // Delete audit logs (or keep for compliance - depends on policy)
  const auditQuery = await db.collection('audit_logs')
    .where('userId', '==', userId)
    .get()
  auditQuery.forEach(doc => batch.delete(doc.ref))
  
  // Delete user profile
  const userDoc = db.collection('users').doc(userId)
  batch.delete(userDoc)
  
  // Commit all deletions
  await batch.commit()
}

module.exports = {
  deleteUserAccount,
  // ... other exports
}
```

#### C. Frontend API Service

**File:** `frontend/src/lib/api/userService.js`

```javascript
/**
 * Delete user account and all data
 */
export async function deleteUserData(userId) {
  const token = await getAuthToken()
  const response = await axios.delete(
    `${API_BASE_URL}/users/${userId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    }
  )
  return response.data
}
```

#### D. Update UI with Better Confirmation

```jsx
{/* Danger Zone */}
<Card className="border-red-500/20">
  <CardHeader>
    <CardTitle className="flex items-center gap-2 text-red-500">
      <Trash2 className="h-5 w-5" />
      Danger Zone
    </CardTitle>
    <CardDescription>Irreversible actions</CardDescription>
  </CardHeader>
  <CardContent>
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium text-foreground">Delete Account</p>
        <p className="text-sm text-muted-foreground">
          Permanently delete your account and all data
        </p>
        <p className="text-xs text-red-500 mt-1">
          ⚠️ This cannot be undone. All progress will be lost.
        </p>
      </div>
      <Button 
        variant="destructive" 
        onClick={handleDeleteAccount}
        disabled={deleting}
      >
        {deleting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Deleting...
          </>
        ) : (
          'Delete Account'
        )}
      </Button>
    </div>
  </CardContent>
</Card>
```

---

## 📋 Account Page Implementation Checklist

### Password Change
- [ ] Import `sendPasswordResetEmail` from Firebase Auth
- [ ] Implement `handleChangePassword` function
- [ ] Add loading and success states
- [ ] Test email delivery (requires Email DNS setup from Phase 4)
- [ ] Add user feedback (success/error messages)
- [ ] Update button UI with loading spinner

### Two-Factor Authentication
- [ ] Add "Coming Soon" badge to 2FA section
- [ ] Set opacity to 50% and disable pointer
- [ ] Disable "Enable" button
- [ ] Optional: Add tooltip explaining unavailability
- [ ] Document 2FA roadmap for future sprint

### Account Deletion
- [ ] Create backend endpoint `/api/v1/users/:userId` DELETE
- [ ] Implement Firestore cascade delete function
- [ ] Add Firebase Auth user deletion
- [ ] Add strong confirmation dialog (type "DELETE")
- [ ] Handle re-authentication required error
- [ ] Add audit logging for deletions
- [ ] Test deletion flow end-to-end
- [ ] Verify all user data is removed from Firestore
- [ ] Add loading state to delete button

---

## 🧪 Account Page Testing Requirements

```javascript
// Password Change Testing:
✓ Email is sent to user's registered address
✓ Email contains valid reset link
✓ Link redirects to password reset page
✓ New password meets 12-character requirement
✓ User can log in with new password
✓ Old password no longer works
✓ Error handling for network failures

// 2FA Display Testing:
✓ 2FA section is visible but grayed out
✓ "Coming Soon" badge displays
✓ Enable button is disabled
✓ Tooltip appears on hover (if implemented)
✓ No console errors

// Account Deletion Testing:
✓ Confirmation dialog requires "DELETE" input
✓ Backend API deletes all user data
✓ scenario_sessions deleted
✓ user_progress deleted
✓ audit_logs deleted (or marked as deleted)
✓ users document deleted
✓ Firebase Auth user deleted
✓ User is signed out and redirected
✓ Deleted user cannot log in
✓ Audit log records deletion event
✓ Re-authentication error handled gracefully
```

---

## ⏱️ Updated Time Estimates

**Account Page Fixes:** 4-6 hours
- Password Change: 1-2 hours
- 2FA Coming Soon UI: 30 minutes
- Account Deletion (Full Implementation): 2-3 hours
  - Backend endpoint: 1 hour
  - Firestore cascade delete: 1 hour
  - Frontend integration & testing: 1 hour

**Updated Grand Total: ~39-47 hours** (approximately 5-6 days)

---
