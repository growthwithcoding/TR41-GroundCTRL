E# Changelog

All notable changes to the GroundCTRL Backend will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Phase 0: Project versioning and documentation framework
- Phase 0: Helper scripts for file structure mapping and line ending conversion
- Phase 0.5: Identity policy corrections in Swagger documentation
- Phase 3: Reusable validation middleware (`src/middleware/validate.js`)
- Phase 2: Global API rate limiting middleware (`apiLimiter`) mounted for all `/api/v1/*` routes
- Phase 2: Centralized HTTP client (`src/utils/httpClient.js`) with configurable timeout (default 8000ms)
- Phase 2: Authentication error normalizer middleware for production security
- Phase 2: Environment variables for HTTP client configuration (`HTTP_CLIENT_TIMEOUT_MS`, `HTTP_CLIENT_RETRY_ATTEMPTS`, `HTTP_CLIENT_RETRY_DELAY_MS`)

### Changed
- Phase 0.5: Updated Swagger documentation to reflect uid-based identity policy
- Phase 0.5: Clarified callSign as non-unique display label (not identifier)
- Phase 0.5: Documented email as unique constraint for data integrity only
- Phase 3: All schemas now use `.strict()` mode to reject unknown fields
- Phase 3: Query parameters capped (limit ≤ 100) and whitelisted (sortBy fields)
- Phase 3: Auth and user routes now use validation middleware
- Phase 3: Updated README with Phase 3 features and removed outdated port troubleshooting
- Phase 3: Enhanced environment configuration with `user_uid` variable

### Security
- Phase 3: Unknown fields in requests now rejected at route boundaries
- Phase 3: Query parameter injection prevented through strict validation
- Phase 3: Type coercion vulnerabilities eliminated with Zod schemas
- Phase 1: Updated userService to allow duplicate callSign values across users
- Phase 2: Authentication service now uses centralized `httpClient` for all Firebase Identity Toolkit calls
- Phase 2: Auth error messages are now generic in production to prevent user enumeration attacks

### Removed
- Phase 1: Removed `getByCallSign` method from userRepository (callSign lookups no longer supported)
- Phase 1: Removed callSign uniqueness checks from create, update, and patch user flows

### Security
- Phase 2: Protection against DoS attacks via slow external HTTP responses (outbound timeout enforcement)
- Phase 2: Auth error normalization prevents user enumeration in production environment
- Phase 2: All Firebase authentication calls now have explicit 8-second timeout protection
- Phase 2: Global rate limiting protects API from abuse (100 requests per 15-minute window per IP)

---

## [1.0.0] - 2025-12-22

### Initial Release - Mission Control Platform MVP

#### Core Features

**Authentication & Security**
- JWT-based authentication with access and refresh tokens
- Token blacklisting for immediate revocation
- Account lockout system (5 failed attempts = 15 minute lockout)
- Role-based access control (operator/admin)
- Call sign system for operator identification
- Firebase Authentication integration

**Mission Control Architecture**
- Mission control response protocol (GO/NO-GO/HOLD/ABORT)
- Aerospace-themed API responses with telemetry data
- Comprehensive audit logging system
- Mission-specific event classification

**API Infrastructure**
- RESTful API with Express.js
- Swagger/OpenAPI documentation
- Rate limiting (global and endpoint-specific)
- CORS configuration
- Environment-based configuration
- Error handling middleware
- Request validation with Zod schemas

**User Management**
- User registration and authentication
- Profile management (CRUD operations)
- Admin user management endpoints
- Password validation and security

**Data Persistence**
- Firebase Firestore integration
- User repository with audit trails
- Token blacklist repository
- Audit event repository

**Development Tools**
- ESLint configuration for code quality
- Nodemon for development hot-reloading
- Testing framework setup (Jest)
- Environment variable management
- Postman collection for API testing

#### API Endpoints

**Health**
- `GET /api/v1/health` - System health check

**Authentication**
- `POST /api/v1/auth/register` - Operator registration
- `POST /api/v1/auth/login` - Operator authentication
- `POST /api/v1/auth/refresh` - Refresh access token
- `GET /api/v1/auth/me` - Get current user
- `POST /api/v1/auth/logout` - Operator logout
- `POST /api/v1/auth/revoke` - Admin token revocation

**Users**
- `GET /api/v1/users` - List all users (admin)
- `GET /api/v1/users/:uid` - Get user by ID
- `PUT /api/v1/users/:uid` - Update user
- `DELETE /api/v1/users/:uid` - Delete user (admin)

**Placeholder Routes** (to be implemented)
- `/api/v1/satellites` - Satellite operations
- `/api/v1/scenarios` - Mission scenarios
- `/api/v1/commands` - Command operations
- `/api/v1/ai` - AI-powered features

#### Technical Stack
- Node.js 18+
- Express.js 4.18
- Firebase Admin SDK 12.0
- JWT (jsonwebtoken 9.0)
- Zod 3.22 (validation)
- Swagger/OpenAPI 3.0
- Express Rate Limit 7.1

#### Security Features
- JWT token security with configurable expiration
- Password validation (min 8 chars, uppercase, lowercase, number, special char)
- Rate limiting on authentication endpoints
- Account lockout after failed login attempts
- Token blacklisting for revocation
- Admin-only endpoints protection
- Audit logging for security events

#### Documentation
- Comprehensive Swagger/OpenAPI documentation
- Architecture documentation (ARCHITECTURE.md)
- README with setup instructions
- Postman collection with example requests
- Environment configuration samples

---

## Version History

- **[1.0.0]** - 2025-12-25 - Initial release with core authentication and user management
- **[Unreleased]** - Current development version

---

## Release Decision Checkpoints

As per VERSIONING.md, version bumps are evaluated at these checkpoints:

- **Checkpoint A** (after Phase 0.5): Docs/process baseline complete
- **Checkpoint B** (after Phase 4): Security quick wins + validation baseline
- **Checkpoint C** (after Phase 8): Core domain APIs ready for client integration
- **Checkpoint D** (after Phase 11): Tests + docs + Nova + analytics stabilized

---

## Categories

- **Added**: New features
- **Changed**: Changes to existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Security improvements or fixes
