# Session Validation Error Fix

## Problem
The frontend was sending a **400 VALIDATION_ERROR** with the message "Invalid trajectory parameters" when trying to create a new training session. This was NOT an authentication issue - the JWT authentication was working correctly. It was a **data validation mismatch** between what the frontend was sending and what the backend schema expected.

## Root Cause
The `MissionBriefing.jsx` component was sending extra fields that were not defined in the backend's `createScenarioSessionSchema`:

### ❌ Fields Being Sent (INCORRECT)
```javascript
const sessionData = {
  user_id: user.uid,              // ❌ Set by backend from JWT token
  scenario_id: id,                 // ✅ Correct
  scenario: {                      // ❌ Not in schema
    title: scenario.name,
    description: scenario.description,
    category: scenario.category,
    difficulty: scenario.difficulty,
  },
  steps: scenarioSteps,            // ❌ Not in schema
  satellite: {                     // ❌ Not in schema
    id: scenario._firestore.satellite_id,
    name: 'SAT-01',
    orbit: { ... },
    power: { ... },
    // ... etc
  },
  status: 'NOT_STARTED',           // ✅ Correct
  currentStepOrder: 0,             // ✅ Correct
  completedSteps: [],              // ✅ Correct
  total_hints_used: 0,             // ✅ Correct
  total_errors: 0,                 // ✅ Correct
  attemptNumber: 1,                // ✅ Correct
  state: {},                       // ✅ Correct
  version: 1                       // ✅ Correct
}
```

### Backend Schema Requirements
According to `backend/src/schemas/scenarioSessionSchemas.js`:

**Required:**
- `scenario_id` - FK to scenarios collection

**Optional (with defaults):**
- `status` - Defaults to 'NOT_STARTED'
- `currentStepOrder` - Defaults to 0
- `completedSteps` - Defaults to []
- `total_hints_used` - Defaults to 0
- `total_errors` - Defaults to 0
- `attemptNumber` - Defaults to 1
- `state` - Defaults to {}
- `version` - Defaults to 1

**NOT Allowed:**
- `user_id` - Set by controller from `req.user.uid` (JWT token)
- `scenario` - Scenario details fetched from database, not from client
- `steps` - Steps fetched from database, not from client
- `satellite` - Satellite data managed separately, not in session creation

## Solution
Updated `MissionBriefing.jsx` to send only the fields defined in the backend schema:

### ✅ Fixed Session Data
```javascript
const sessionData = {
  scenario_id: id,
  status: 'NOT_STARTED',
  currentStepOrder: 0,
  completedSteps: [],
  total_hints_used: 0,
  total_errors: 0,
  attemptNumber: 1,
  state: {},
  version: 1
}
```

## Changes Made

### File: `frontend/src/pages/MissionBriefing.jsx`

**Function: `handleStartMission()`**
- Removed `user_id` field (backend sets from JWT)
- Removed `scenario` object (backend fetches from database)
- Removed `steps` array (backend fetches from database)
- Removed `satellite` object (not needed for session creation)

**Function: `handleSkipBriefing()`**
- Applied same fixes as `handleStartMission()`

## Architecture Notes

### Why This Design?
1. **Security**: Client shouldn't dictate `user_id` - backend extracts from authenticated JWT token
2. **Data Integrity**: Scenario details come from the source of truth (database), not client
3. **Separation of Concerns**: Session creation only needs to know WHICH scenario, not its details
4. **Schema Validation**: Zod schema enforces `.strict()` which rejects unknown fields

### Data Flow
```
Frontend                Backend                 Firestore
--------                -------                 ---------
Session request    →    Extract user_id
with scenario_id        from JWT token
                   →    Fetch scenario         ← Read scenario
                        details from DB          document
                   →    Create session doc     → Write session
                        with all data            with enriched data
                   ←    Return session ID
```

## Testing Recommendations

### Test Case 1: Create Session
```javascript
// Should succeed
POST /scenario-sessions
{
  "scenario_id": "scenario_123",
  "status": "NOT_STARTED"
}

// Expected: 201 Created with session ID
```

### Test Case 2: Extra Fields
```javascript
// Should fail with validation error
POST /scenario-sessions
{
  "scenario_id": "scenario_123",
  "user_id": "user_456",  // ❌ Not allowed
  "extra_field": "value"  // ❌ Unknown field
}

// Expected: 400 Bad Request
```

### Test Case 3: Missing Required Field
```javascript
// Should fail with validation error
POST /scenario-sessions
{
  "status": "NOT_STARTED"
  // Missing scenario_id
}

// Expected: 400 Bad Request - "Scenario ID is required"
```

## Related Files
- `frontend/src/pages/MissionBriefing.jsx` - Fixed session creation
- `frontend/src/lib/api/sessionService.js` - API client
- `backend/src/schemas/scenarioSessionSchemas.js` - Schema definition
- `backend/src/controllers/scenarioSessionController.js` - Request handler

## Secondary Issue: Firestore Permission Error

After fixing the validation error, a second issue appeared: **"Missing or insufficient permissions"** when the frontend tried to read the created session from Firestore.

### Root Cause
The backend was setting `createdBy` in metadata, but the Firestore security rules check for `user_id`:

```javascript
// Firestore rules (firestore.rules)
match /scenario_sessions/{sessionId} {
  allow read: if isAuthenticated() && 
                 (resource.data.user_id == request.auth.uid || isAdmin());
  //                          ^^^^^^^ - Checking for user_id
}
```

But the backend wasn't setting `user_id` in the document data - only `createdBy` in metadata.

### Solution
Updated `scenarioSessionController.js` to set `user_id` in the `beforeCreate` hook:

```javascript
beforeCreate: async (req, data) => {
  // CRITICAL: Set user_id from authenticated user
  // This is required for Firestore security rules
  data.user_id = req.user?.uid;
  
  logger.debug('Session pre-create validation', {
    scenario_id: data.scenario_id,
    userId: req.user?.uid,
    user_id: data.user_id
  });
}
```

Also updated `ownershipScope` to filter by `user_id` instead of `createdBy`:

```javascript
ownershipScope: async (req, operation, options) => {
  if (req.user?.isAdmin) {
    return options;
  }
  return { ...options, user_id: req.user?.uid };
}
```

### Why This Design?
- **Security**: Frontend reads directly from Firestore for performance
- **Authorization**: Firestore rules enforce that users can only read their own sessions
- **Consistency**: Both `user_id` (for rules) and `createdBy` (for audit) are tracked

## Status
✅ **FIXED** - Both validation error and permission error resolved.

---
**Date:** 2/1/2026  
**Issue Type:** Data Validation + Firestore Permissions  
**Severity:** High (blocking mission start)  
**Resolution:** Schema alignment + user_id field population
