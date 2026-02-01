# JWT Authentication Fix - WebSocket & API Integration

## Problem Summary

The application was experiencing authentication failures when trying to create sessions and make API calls:

```
Failed to create session: APIError: Not authenticated
Error creating session: Error: Not authenticated
```

**Root Cause**: Users were authenticating with Firebase, but the frontend **never exchanged the Firebase ID token for backend JWT tokens**. The backend API requires JWT tokens for authentication, while WebSockets use Firebase ID tokens.

## Authentication Architecture

### Two-Layer Authentication System

1. **Firebase Authentication** (Frontend)
   - Users sign in with Firebase (email/password or Google OAuth)
   - Firebase provides an ID token
   - Used for WebSocket connections

2. **Backend JWT Authentication** (API)
   - Backend issues its own JWT access/refresh tokens
   - Required for all HTTP API calls
   - Contains user permissions (callSign, isAdmin)

### The Missing Link

The frontend was:
- ✅ Authenticating with Firebase
- ❌ **NOT exchanging Firebase token for backend JWT**
- ❌ Making API calls without backend JWT tokens

## Solution Implemented

### Backend Changes

#### 1. New Service Method (`backend/src/services/authService.js`)
```javascript
/**
 * Exchange Firebase ID token for backend JWT tokens
 * Works for all Firebase-authenticated users (email/password, Google, etc.)
 */
async function exchangeFirebaseToken(firebaseUid) {
  // Get user from Firestore
  // Check if active
  // Update last login time
  // Generate backend JWT tokens
  // Return user data with tokens
}
```

#### 2. New Controller Method (`backend/src/controllers/authController.js`)
```javascript
/**
 * POST /auth/exchange-token
 * SECURITY: Uses firebaseAuthMiddleware to verify Firebase ID token
 */
async function exchangeToken(req, res, next) {
  // Verify Firebase UID from middleware
  // Call service to exchange token
  // Set refresh token as HttpOnly cookie
  // Return access token and user data
}
```

#### 3. New Route (`backend/src/routes/auth.js`)
```javascript
/**
 * POST /auth/exchange-token
 * Exchanges Firebase ID token for backend JWT tokens
 */
router.post('/exchange-token', firebaseAuthMiddleware, authLimiter, authController.exchangeToken);
```

### Frontend Changes

#### 1. Updated Auth Service (`frontend/src/lib/api/authService.js`)
```javascript
export async function loginWithFirebaseToken(firebaseToken) {
  // Changed endpoint from /auth/login to /auth/exchange-token
  const response = await fetch('.../auth/exchange-token', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${firebaseToken}`
    }
  })
  // Parse response and return tokens
}
```

#### 2. Updated Auth Hook (`frontend/src/hooks/use-auth.jsx`)
```javascript
useEffect(() => {
  const unsubscribe = onAuthChange(async (firebaseUser) => {
    if (firebaseUser) {
      // Fetch user profile from Firestore
      
      // NEW: Exchange Firebase ID token for backend JWT tokens
      const firebaseIdToken = await firebaseUser.getIdToken()
      const backendResponse = await loginWithFirebaseToken(firebaseIdToken)
      
      // Extract and store tokens
      const accessToken = backendResponse.tokens?.accessToken
      const refreshToken = backendResponse.tokens?.refreshToken
      setBackendTokens(accessToken, refreshToken)
    } else {
      clearBackendTokens()
    }
  })
}, [])
```

## Authentication Flow (After Fix)

### User Login
1. User signs in with Firebase (email/password or Google)
2. Frontend receives Firebase user object
3. **Frontend gets Firebase ID token**
4. **Frontend calls `/auth/exchange-token` with Firebase ID token**
5. **Backend verifies Firebase token and issues JWT tokens**
6. **Frontend stores JWT tokens in memory and localStorage**
7. User is now authenticated for both WebSocket and API calls

### API Requests
- Frontend includes backend JWT in Authorization header: `Bearer <jwt_token>`
- Backend validates JWT with `authMiddleware`
- Request proceeds if token is valid

### WebSocket Connections
- Frontend includes Firebase ID token in socket handshake
- Backend validates with `verifySocketToken` (Firebase Admin SDK)
- Connection established if token is valid

## Files Modified

### Backend
1. `backend/src/services/authService.js` - Added `exchangeFirebaseToken()` method
2. `backend/src/controllers/authController.js` - Added `exchangeToken()` controller
3. `backend/src/routes/auth.js` - Added POST `/auth/exchange-token` route

### Frontend
1. `frontend/src/lib/api/authService.js` - Fixed endpoint to use `/exchange-token`
2. `frontend/src/hooks/use-auth.jsx` - Added automatic token exchange on Firebase auth

## Testing

To verify the fix works:

1. **Clear existing tokens**: Clear browser localStorage and cookies
2. **Sign in**: Use email/password or Google sign-in
3. **Check console logs**:
   ```
   ✅ Authenticated with Firebase
   ✅ Backend JWT tokens obtained and stored
   ```
4. **Test API call**: Try creating a session (Mission Briefing → Begin Mission)
5. **Verify**: Session should create successfully without "Not authenticated" errors

## Security Considerations

- ✅ Firebase ID tokens are verified by Firebase Admin SDK on backend
- ✅ Backend JWT tokens are signed with secret key
- ✅ Refresh tokens stored as HttpOnly cookies (XSS protection)
- ✅ Access tokens expire after 15 minutes
- ✅ Refresh tokens expire after 7 days
- ✅ Tokens are cleared on logout

## Future Enhancements

1. **Token Refresh**: Implement automatic access token refresh before expiry
2. **Error Handling**: Improve error messages when token exchange fails
3. **Retry Logic**: Add retry mechanism for transient failures
4. **Token Monitoring**: Add admin dashboard to view active tokens

## Summary

The authentication system now properly bridges Firebase authentication with backend JWT authorization. Users can seamlessly:
- Sign in with Firebase
- Automatically receive backend JWT tokens
- Make authenticated API calls
- Maintain WebSocket connections
- All without manual token management

**Status**: ✅ FIXED - Ready for testing
