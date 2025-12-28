# 🛰️ GroundCTRL Backend API

**Mission Control Platform for Satellite Simulation**

A production-ready Node.js/Express API with enterprise-grade security, Firebase integration, and aerospace-themed mission control interfaces.

---

## 🆕 Recent Updates

### Phase 0-1 Enhancements (December 2025)
- ✅ **Identity Policy Enforcement** - uid-based targeting (canonical identifier), callSign as non-unique display label
- ✅ **Versioning Framework** - Established SemVer approach with CHANGELOG.md and release documentation
- ✅ **Repository Hygiene** - Added CONTRIBUTING.md, VERSIONING.md, RELEASE.md for team workflow
- ✅ **Enhanced Documentation** - Updated Swagger to reflect identity policy and architectural decisions
- ✅ **ESLint v9 Migration** - Upgraded to flat config for modern linting standards

---

## 🚀 Features

### Core Capabilities
- ✅ **JWT Authentication** - Access tokens (15m) + Refresh tokens (7d)
- ✅ **Token Blacklisting** - Immediate token revocation via Firebase
- ✅ **Account Lockout** - 5 failed logins = 15 minute lockout
- ✅ **Rate Limiting** - Configurable per-endpoint protection
- ✅ **Audit Logging** - Comprehensive operation tracking with severity levels
- ✅ **Mission Control Responses** - GO/NO-GO/HOLD/ABORT status codes
- ✅ **Admin Role Management** - Fine-grained permission control
- ✅ **Call Sign System** - Non-unique display labels for operators (uid is canonical identifier)
- ✅ **Swagger Documentation** - Interactive API documentation at `/api/v1/docs`

### Architecture
- **Separation of Concerns**: Routes → Controllers → Services → Repositories
- **Factory Pattern**: Reusable CRUD, response, audit, and lockout factories
- **Middleware Stack**: Auth, rate limiting, audit logging, error handling
- **Firebase Integration**: Firestore + Firebase Auth
- **Zod Validation**: Runtime type safety for all inputs
- **Identity Policy**: uid-based targeting (canonical), callSign for display only (non-unique), email unique for data integrity
- **HTTP Client Resilience**: Configurable timeouts and retry logic for external calls
- **Vercel-Ready**: Serverless-compatible structure

---

## 📋 Prerequisites

- **Node.js** 18.x or higher
- **npm** 9.x or higher
- **Firebase Project** with Firestore and Auth enabled
- **Firebase Service Account** credentials

---

## 🔧 Installation

### 1. Clone & Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Configuration

Create `.env` file from the sample:

```bash
cp .env.sample .env
```

Edit `.env` with your configuration. See **Environment Variables Reference** below for detailed explanations.

#### Environment Variables Reference

##### Server Configuration

| Variable | Required | Description | Example | Default |
|----------|----------|-------------|---------|---------|
| `PORT` | Yes | Port number for the API server | `3001` | `3001` |
| `NODE_ENV` | Yes | Application environment mode<br>• `development` - Verbose logging, detailed errors<br>• `production` - Optimized for performance, sanitized errors | `development` | `development` |
| `CALL_SIGN` | Yes | Station identifier for this API instance (appears in telemetry responses) | `GROUNDCTRL-01` | `GROUNDCTRL-01` |

##### Firebase Configuration

**Source:** Firebase Console → Project Settings → Service Accounts → Generate New Private Key

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `FIREBASE_PROJECT_ID` | Yes | Your Firebase project ID | `my-project-123` |
| `FIREBASE_PRIVATE_KEY` | Yes | Private key from service account JSON<br>⚠️ **Security:** Keep quotes, preserve `\n` line breaks | `"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"` |
| `FIREBASE_CLIENT_EMAIL` | Yes | Service account email address | `firebase-adminsdk-xyz@my-project.iam.gserviceaccount.com` |
| `FIREBASE_WEB_API_KEY` | Yes | Web API key from Firebase project settings<br>Used for Firebase Authentication REST API calls | `AIzaSyA...` |

**Setup Instructions:**
1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate New Private Key"
3. Copy values from downloaded JSON to your `.env` file
4. Ensure Firebase Authentication and Firestore are enabled

##### JWT Configuration

| Variable | Required | Description | Example | Default |
|----------|----------|-------------|---------|---------|
| `JWT_SECRET` | Yes | Secret key for signing JWT tokens<br>⚠️ **Security:** Minimum 64 characters, use cryptographically random string<br>Generate: `openssl rand -base64 64` | `your-super-secret-jwt-key...` | None |
| `JWT_ACCESS_TOKEN_EXPIRY` | Yes | Access token lifespan (short-lived)<br>Format: `#s` (seconds), `#m` (minutes), `#h` (hours), `#d` (days) | `15m` | `15m` |
| `JWT_REFRESH_TOKEN_EXPIRY` | Yes | Refresh token lifespan (long-lived)<br>Format: `#s` (seconds), `#m` (minutes), `#h` (hours), `#d` (days) | `7d` | `7d` |

##### CORS Configuration

| Variable | Required | Description | Example | Default |
|----------|----------|-------------|---------|---------|
| `ALLOWED_ORIGINS` | Yes | Comma-separated list of allowed origins for CORS<br>Include all frontend URLs (local development + production) | `http://localhost:3001,http://localhost:5173,https://myapp.com` | `http://localhost:3001,http://localhost:5173` |

##### HTTP Client Configuration

**Purpose:** Resilience for outbound HTTP calls (Firebase Auth API, future external integrations)

| Variable | Required | Description | Example | Default |
|----------|----------|-------------|---------|---------|
| `HTTP_CLIENT_TIMEOUT_MS` | No | Request timeout in milliseconds<br>Prevents hanging requests to external services | `8000` | `8000` |
| `HTTP_CLIENT_RETRY_ATTEMPTS` | No | Number of retry attempts for failed requests<br>⚠️ Set to `0` to disable retries (recommended for auth flows) | `0` | `0` |
| `HTTP_CLIENT_RETRY_DELAY_MS` | No | Delay between retry attempts in milliseconds | `1000` | `1000` |

##### Rate Limiting Configuration

**Purpose:** Protect against brute-force attacks and API abuse

| Variable | Required | Description | Example | Default |
|----------|----------|-------------|---------|---------|
| `LOGIN_RATE_LIMIT_WINDOW_MS` | No | Time window for login rate limiting (milliseconds)<br>`900000` = 15 minutes | `900000` | `900000` |
| `LOGIN_RATE_LIMIT_MAX_REQUESTS` | No | Maximum login attempts per window | `5` | `5` |
| `API_RATE_LIMIT_WINDOW_MS` | No | Time window for general API rate limiting (milliseconds) | `900000` | `900000` |
| `API_RATE_LIMIT_MAX_REQUESTS` | No | Maximum API requests per window | `100` | `100` |

**Example:** Default config allows 5 login attempts per 15 minutes, 100 general API calls per 15 minutes

##### Lockout Configuration

**Purpose:** Automatic account protection after repeated failed login attempts

| Variable | Required | Description | Example | Default |
|----------|----------|-------------|---------|---------|
| `LOCKOUT_THRESHOLD` | No | Number of failed login attempts before lockout | `5` | `5` |
| `LOCKOUT_DURATION_MINUTES` | No | How long account remains locked (minutes) | `15` | `15` |
| `LOCKOUT_WINDOW_HOURS` | No | Time window to count failed attempts (hours)<br>Failed attempts outside this window are ignored | `1` | `1` |

**Example:** 5 failed logins within 1 hour triggers 15-minute lockout

##### Logging Configuration

| Variable | Required | Description | Example | Default |
|----------|----------|-------------|---------|---------|
| `LOG_LEVEL` | No | Logging verbosity level<br>• `debug` - All logs (development)<br>• `info` - General info + warnings + errors<br>• `warn` - Warnings + errors only<br>• `error` - Errors only (production) | `info` | `info` |

#### Example `.env` File

```env
# Server Configuration
PORT=3001
NODE_ENV=development
CALL_SIGN=GROUNDCTRL-01

# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_WEB_API_KEY=your-web-api-key-from-firebase-console

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-minimum-64-characters-long-for-production
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_TOKEN_EXPIRY=7d

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3001,http://localhost:5173

# HTTP Client Configuration
HTTP_CLIENT_TIMEOUT_MS=8000
HTTP_CLIENT_RETRY_ATTEMPTS=0
HTTP_CLIENT_RETRY_DELAY_MS=1000

# Rate Limiting Configuration
LOGIN_RATE_LIMIT_WINDOW_MS=900000
LOGIN_RATE_LIMIT_MAX_REQUESTS=5
API_RATE_LIMIT_WINDOW_MS=900000
API_RATE_LIMIT_MAX_REQUESTS=100

# Lockout Configuration
LOCKOUT_THRESHOLD=5
LOCKOUT_DURATION_MINUTES=15
LOCKOUT_WINDOW_HOURS=1

# Logging
LOG_LEVEL=info
```

### 3. Firebase Setup

#### Enable Firebase Authentication

In Firebase Console → Authentication:
- Enable **Email/Password** sign-in method

---

## 🏃 Running the Application

### Development Mode (with auto-restart)

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

### Linting

```bash
npm run lint
npm run lint:fix
```

---

## 📖 API Documentation

### Interactive Swagger Documentation

The API includes comprehensive Swagger/OpenAPI documentation with:
- **Interactive API Explorer** - Test endpoints directly from your browser
- **Mission Control Protocol** - Detailed GO/NO-GO/HOLD/ABORT status codes
- **Request/Response Schemas** - Complete data structures with examples
- **Authentication Guide** - JWT Bearer token setup and usage
- **Rate Limiting Info** - Per-endpoint rate limit specifications
- **Security Schemas** - Account lockout and token management details

**Access Swagger UI:**
```
http://localhost:3001/api/v1/docs
```

The documentation includes:
- All authentication endpoints (register, login, refresh, logout, revoke)
- Request body schemas with validation rules
- Response examples with mission control formatting
- Security requirements for protected endpoints
- Rate limiting and error response details

**Features:**
- 🎯 Try out API calls directly from the browser
- 🔐 Built-in authorization support (add your JWT token)
- 📋 Copy/paste ready request examples
- 🚀 Mission control themed with aerospace terminology
- 📊 Complete error response documentation

---

## 📡 API Endpoints

### Base URL
```
http://localhost:3001/api/v1
```

### Health Check
```http
GET /api/v1/health
```
No authentication required. Returns system status.

### Authentication

#### Register New User
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "pilot@groundctrl.com",
  "password": "SecurePass123!",
  "callSign": "APOLLO-11",
  "displayName": "Neil Armstrong"
}
```

#### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "pilot@groundctrl.com",
  "password": "SecurePass123!"
}
```

Returns:
```json
{
  "status": "GO",
  "code": 200,
  "brief": "Satellite uplink established. Telemetry nominal.",
  "payload": {
    "data": {
      "user": {
        "uid": "abc123",
        "email": "pilot@groundctrl.com",
        "callSign": "APOLLO-11",
        "displayName": "Neil Armstrong",
        "isAdmin": false
      },
      "tokens": {
        "accessToken": "eyJhbGc...",
        "refreshToken": "eyJhbGc..."
      }
    }
  },
  "telemetry": {
    "missionTime": "2025-01-01T00:00:00.000Z",
    "operatorCallSign": "APOLLO-11",
    "stationId": "GROUNDCTRL-01",
    "requestId": "uuid-here"
  },
  "timestamp": 1704067200000
}
```

#### Refresh Token
```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGc..."
}
```

#### Logout
```http
POST /api/v1/auth/logout
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "refreshToken": "eyJhbGc..."
}
```

#### Revoke Token (Admin Only)
```http
POST /api/v1/auth/revoke
Authorization: Bearer {AccessToken}
Content-Type: application/json

{
  "userId": "abc123"
}
```

---

## 🔐 Security Features

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character (@$!%*?&#^()_+-=[]{}|;:,.<>/)
- Not in common password list

### Rate Limiting
- **Login**: 5 attempts per 15 minutes
- **Auth Operations**: 10 attempts per 15 minutes
- **General API**: 100 requests per 15 minutes

### Account Lockout
- Triggers after 5 failed login attempts within 1 hour
- Lockout duration: 15 minutes
- Tracked via audit logs

### Token Management
- **Access tokens**: 15 minutes expiry
- **Refresh tokens**: 7 days expiry
- Immediate revocation via blacklist
- SHA-256 hashed storage

---

## 🗂️ Project Structure

```
backend/
├── src/
│   ├── config/           # Configuration files
│   │   ├── firebase.js
│   │   ├── jwtConfig.js
│   │   ├── rateLimits.js
│   │   └── missionControl.js
│   ├── constants/        # Constants and enums
│   │   ├── auditEvents.js
│   │   ├── auditSeverity.js
│   │   └── httpStatus.js
│   ├── controllers/      # HTTP request handlers
│   │   └── authController.js
│   ├── factories/        # Reusable object creators
│   │   ├── auditFactory.js
│   │   └── responseFactory.js
│   ├── middleware/       # Express middleware
│   │   ├── authMiddleware.js
│   │   ├── rateLimiter.js
│   │   ├── auditLogger.js
│   │   └── errorHandler.js
│   ├── repositories/     # Database abstraction
│   │   ├── auditRepository.js
│   │   └── tokenBlacklistRepository.js
│   ├── routes/           # API routes
│   │   ├── index.js
│   │   ├── health.js
│   │   └── auth.js
│   ├── schemas/          # Zod validation schemas
│   │   └── authSchemas.js
│   ├── services/         # Business logic
│   │   ├── authService.js
│   │   └── lockoutService.js
│   ├── utils/            # Utility functions
│   │   ├── errors.js
│   │   ├── jwt.js
│   │   ├── logger.js
│   │   └── passwordValidation.js
│   ├── app.js            # Express app configuration
│   └── server.js         # Server entry point
├── .env.sample           # Environment variables template
├── .eslintrc.json        # ESLint configuration
├── .gitignore            # Git ignore rules
├── nodemon.json          # Nodemon configuration
├── package.json          # Dependencies and scripts
└── README.md             # This file
```

---

## 🧪 Testing the API

### Using cURL

#### Health Check
```bash
curl http://localhost:3001/api/v1/health
```

#### Register New User
```bash
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@groundctrl.com",
    "password": "SecurePass123!",
    "callSign": "TEST-01",
    "displayName": "Test Pilot"
  }'
```

#### Login
```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@groundctrl.com",
    "password": "SecurePass123!"
  }'
```

#### Refresh Access Token
```bash
curl -X POST http://localhost:3001/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

#### Logout
```bash
curl -X POST http://localhost:3001/api/v1/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

#### Revoke User Token (Admin Only)
```bash
curl -X POST http://localhost:3001/api/v1/auth/revoke \
  -H "Authorization: Bearer YOUR_ADMIN_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_ID_TO_REVOKE"
  }'
```

---

## 📊 Monitoring & Audit Logs

### Viewing Audit Logs

Query Firestore `audit_logs` collection:
- Filter by `userId`, `action`, `severity`
- Sort by `timestamp` descending
- Export for compliance reporting

### Log Severity Levels
- **INFO**: Normal operations (login, read operations)
- **WARNING**: Suspicious activity (failed logins, permission denied)
- **ERROR**: Application errors (validation failures, not found)
- **CRITICAL**: Security incidents (lockouts, token revocation, deletions)

---

## 👨‍💻 Backend Development Team

- **Backend Software Engineers**  
  - Austin Allen Carlson — [@growthwithcoding](https://github.com/growthwithcoding)
  - Cameron Carmody — [@gotcurds](https://github.com/gotcurds)
  - Tessa Robinson — [@TeslamodelIT](https://github.com/TeslamodelIT)

---

## 🆘 Troubleshooting

### Firebase Connection Issues
- Verify service account credentials in `.env`
- Ensure Firebase project has Firestore and Auth enabled
- Check network connectivity to Firebase

### Port Already in Use
```bash
# Find process using port 3001
lsof -i :3001  # macOS/Linux
netstat -ano | findstr :3001  # Windows

# Kill process or change PORT in .env
```

### Token Verification Fails
- Check JWT_SECRET matches between token creation and verification
- Verify token hasn't expired
- Check if token is blacklisted

---

**Mission Status: GO FOR LAUNCH** 🚀
