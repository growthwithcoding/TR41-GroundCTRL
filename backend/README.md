# TR41-GroundCTRL Backend

A Node.js backend for the TR41-GroundCTRL project using Express.js and Firebase Admin SDK.

## 🚀 Features

- ✔ Express.js REST API server with modular routing
- ✔ Firebase Admin SDK integration
- ✔ Environment variable configuration (`.env`)
- ✔ Health and Firebase status endpoints
- ✔ **New**: Authentication route infrastructure (stubbed for Sprint 1)
- ✔ Modular middleware system
- ✔ Enhanced error handling
- ✔ Graceful shutdown handling

## 📦 Installation

1. Navigate to the backend directory:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

## ⚙️ Configuration (Environment Variables)

Create a `.env` file in the **backend directory root**:

```env
# Server Configuration
PORT=3001

# Firebase Admin SDK Credentials
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
YOUR_KEY_CONTENT
-----END PRIVATE KEY-----
"
```

These values come from your Firebase service account JSON.
Never commit real credentials to GitHub.

## 🧪 Available Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start production server |
| `npm run dev` | Start in development mode with nodemon |
| `npm test` | Run tests (future integration) |

## 🌐 API Endpoints

### Base URL
```
http://localhost:3001/api/v1
```

### Available Endpoints

| Method | Route | Description |
|--------|--------|-------------|
| GET | `/api/v1` | Base endpoint - returns welcome message |
| GET | `/api/v1/health` | Health check endpoint |
| GET | `/api/v1/firebase/status` | Validates Firebase connection |
| POST | `/api/v1/auth/register` | User registration (stubbed - Sprint 1) |
| POST | `/api/v1/auth/login` | User login (stubbed - Sprint 1) |
| POST | `/api/v1/auth/logout` | User logout (stubbed - Sprint 1) |
| GET | `/api/v1/auth/me` | User profile (stubbed - Sprint 1) |

## 🔥 Firebase Integration

This backend uses the **Firebase Admin SDK** for secure server-side access to Firestore. The SDK is initialized in `src/app.js` using credentials from `.env` files.

Current implementation includes:
- Firebase Admin SDK initialization
- Firestore connection validation
- Basic error handling for Firebase operations

## 📁 Project Structure

```bash
backend/
├── src/
│   ├── app.js                # Express configuration + Firebase Admin initialization
│   ├── server.js             # Server entry point with graceful shutdown
│   ├── routes/               # Modular route system
│   │   ├── index.js          # Main router entry point
│   │   ├── api.js            # General API routes
│   │   ├── auth.js           # Authentication routes (stubbed)
│   │   ├── health.js         # Health check routes
│   │   └── firebase.js       # Firebase-related routes
│   └── middleware/           # Custom middleware
│       ├── auth.js           # Authentication middleware (stubbed)
│       └── error.js          # Error handling middleware
├── docs/
│   └── Sprint1.md            # Sprint 1 specification and requirements
├── .env                      # Environment variables (ignored by Git)
├── package.json
└── README.md
```

## ▶️ Usage

Start the server:

```bash
npm start
```

Access API endpoints:

```bash
# Core endpoints
GET http://localhost:3001/api/v1
GET http://localhost:3001/api/v1/health
GET http://localhost:3001/api/v1/firebase/status

# Authentication endpoints (stubbed - Sprint 1)
POST http://localhost:3001/api/v1/auth/register
POST http://localhost:3001/api/v1/auth/login
POST http://localhost:3001/api/v1/auth/logout
GET http://localhost:3001/api/v1/auth/me
```

## 🔮 Future Enhancements

- **Sprint 1**: Implement authentication endpoints with JWT
- **Sprint 1**: Firestore CRUD operations for user management
- **Sprint 1**: Role-based access control
- **Future**: Additional API endpoints for core functionality
- **Future**: Enhanced security and rate limiting

## 📋 Sprint 1 Implementation Status

### ✅ Completed (Foundation)
- Modular routing architecture
- Authentication route infrastructure
- Auth middleware stub
- Enhanced error handling
- Updated documentation

### 🚀 Sprint 1 Goals
- Full authentication implementation
- JWT token generation and validation
- Firestore user data operations
- Session management
- Security hardening

## 📊 API Response Examples

### Health Check
```bash
curl http://localhost:3001/api/v1/health
```
```json
{
  "status": "healthy",
  "timestamp": "2025-12-13T17:00:00.000Z"
}
```

### Firebase Status
```bash
curl http://localhost:3001/api/v1/firebase/status
```
```json
{
  "firebase": "connected",
  "projectId": "your-project-id",
  "status": "success",
  "timestamp": "2025-12-13T17:00:00.000Z"
}
```

### Authentication Endpoints (Stubbed)
```bash
curl -X POST http://localhost:3001/api/v1/auth/register
```
```json
{
  "message": "Registration endpoint not yet implemented"
}
