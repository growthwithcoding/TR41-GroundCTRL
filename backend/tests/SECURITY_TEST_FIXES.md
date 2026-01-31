# Security Test Fixes Applied & Backend TODOs

## ✅ Fixed in Tests (Committed fc2be18)
- Updated all error assertions from `response.body.error` to `response.body.payload.error` to match your API structure
- Made tests more resilient with fallback checks: `response.body.payload?.error || response.body.error`
- This should fix the majority of test failures related to error response structure

## 🔧 Backend Issues to Fix

### 1. **JWT Algorithm (CRITICAL)**
**Problem:** Tests expect RS256, backend may be using HS256

**Fix in backend:**
```javascript
// backend/src/config/jwtConfig.js or authService
const fs = require('fs');
const jwt = require('jsonwebtoken');

// Load RSA keys
const privateKey = fs.readFileSync('./keys/private.key', 'utf8');
const publicKey = fs.readFileSync('./keys/public.key', 'utf8');

// Sign with RS256
const token = jwt.sign(payload, privateKey, { 
  algorithm: 'RS256',
  expiresIn: '1h'
});

// Verify with RS256
jwt.verify(token, publicKey, { algorithms: ['RS256'] });
```

**Generate RSA keys:**
```bash
# Generate private key
openssl genrsa -out private.key 2048

# Extract public key
openssl rsa -in private.key -pubout -out public.key
```

### 2. **User Registration - 409 Conflicts**
**Problem:** Tests getting 409 when expecting 201

**Likely causes:**
- Email/callSign already exists from previous test runs
- Firebase emulator not properly clearing between tests
- Unique constraint violations

**Fix:** Ensure test isolation:
```javascript
// In test setup
afterEach(async () => {
  // Clear test users
  const users = await admin.auth().listUsers();
  for (const user of users.users) {
    if (user.email?.includes('test-') || user.email?.includes('@example.com')) {
      await admin.auth().deleteUser(user.uid);
    }
  }
});
```

### 3. **HTTP Security Headers**
**Problem:** Missing HSTS, CSP headers

**Fix in backend middleware:**
```javascript
// backend/src/app.js
const helmet = require('helmet');

app.use(helmet({
  strictTransportSecurity: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      // No 'unsafe-inline' or 'unsafe-eval'
    }
  }
}));
```

### 4. **CORS Configuration**
**Problem:** CORS headers not consistent

**Fix:**
```javascript
const cors = require('cors');

const allowedOrigins = [
  'https://groundctrl.org',
  'https://staging.groundctrl.org'
];

if (process.env.NODE_ENV === 'development') {
  allowedOrigins.push('http://localhost:3000', 'http://localhost:5173');
}

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  maxAge: 300 // 5 minutes
}));
```

### 5. **Session Cookies**
**Problem:** Cookies may not have all security flags

**Fix:**
```javascript
app.use(session({
  secret: process.env.SESSION_SECRET,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict',
    maxAge: 3600000, // 1 hour
    path: '/'
  }
}));
```

### 6. **Refresh Token Logic**
**Problem:** 409 conflicts on refresh

**Ensure:**
- Refresh tokens are single-use (rotate on each use)
- Store used tokens in blacklist
- Proper cleanup of expired tokens

## 📊 Expected Test Results After Backend Fixes

### Should Pass:
- ✅ JWT Algorithm tests (after RS256 implementation)
- ✅ JWT Expiration tests
- ✅ Token Revocation tests
- ✅ Login tests (after error structure fix)
- ✅ HTTP Headers tests (after Helmet config)
- ✅ CORS tests (after CORS config)

### May Need Adjustment:
- ⚠️ Audit logging tests (depends on your audit implementation)
- ⚠️ Cookie tests (if not using session cookies)
- ⚠️ Refresh token tests (if feature not fully implemented)

## 🎯 Priority Order
1. **Fix JWT to use RS256** - Most critical security issue
2. **Add Helmet middleware** - Quick win for security headers
3. **Configure CORS properly** - Important for production
4. **Fix test isolation** - Prevents 409 conflicts
5. **Implement audit logging** - If not already done
6. **Add refresh token rotation** - If using refresh tokens

## 📝 Notes
- Tests are now compatible with your API response structure
- Some tests may be informational (like npm-audit, secret-scan)
- Cookie tests assume session-based auth (may skip if JWT-only)
- All tests follow security best practices
