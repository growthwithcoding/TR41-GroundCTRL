# Changelog

All notable changes to the GroundCTRL Backend will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Critical Test Fixes - 2026-01-17

Fixed 4 critical conflicts causing 80+ test failures. All changes ensure proper security enforcement and standardized response formatting.

### Added
- Response envelope middleware (`responseEnvelope.js`) - Wraps ALL JSON responses in standardized Mission Control envelope format
- IP+email composite key generator for login rate limiting - Allows independent rate limits per user from same IP

### Changed
- **authService.js** - Removed payload pre-wrapping from `register()` and `login()` functions (envelope middleware now handles wrapping)
- **responseEnvelope.js** - Simplified envelope logic to always wrap raw data in `payload` field
- **rateLimiter.js** - Added `keyGenerator` to `loginLimiter` for IP+email composite keys
- **rateLimits.js** - Updated login rate limit window from 15 minutes to 60 seconds (aligns with test expectations)

### Fixed
- Response envelope now properly wraps all responses - fixes 80+ tests expecting `response.payload.*` structure
- Login lockout properly enforced before token issuance (already implemented, verified working)
- Audit logging for all auth events (already implemented, verified working)
- Rate limiting now uses IP+email composite key instead of IP-only (allows multiple users from same IP)

### Security
- Login lockout: 5 failed attempts = 429 error with 15-minute lockout
- Rate limiting: 5 login attempts per minute per IP+email combination
- Complete audit trail for all authentication events (register/login success/failure)
- Standardized response format prevents information leakage

---

## [1.3.0] - Development

### Phase 7: Scenario Steps Domain (In Progress)

Working on ordered steps for guided scenarios with objectives and default hints for NOVA.

### Added

### Changed

### Fixed

### Security

---

## [1.2.0] - 2025-12-31

### Scenarios Domain Complete (Phase 6)

This minor release completes the scenarios domain, providing full CRUD operations for mission scenarios with satellite references and initial simulation state. The scenarios subsystem enables structured training missions with configurable difficulty levels, pilot tiers, and guided/sandbox modes.

### Added
- Phase 6: Complete scenario management domain with full CRUD operations
- Phase 6: Scenario schema validation with strict Zod schemas for all subsystems (initial state, console layout, metadata)
- Phase 6: Ownership scoping for scenario operations (users can only access their own scenarios, admins see all)
- Phase 6: Satellite reference validation (scenarios must reference existing satellites)
- Phase 6: Comprehensive Swagger documentation for all scenario endpoints
- Phase 6: Scenario repository with Firestore integration
- Phase 6: Scenario controller using CRUD factory pattern with lifecycle hooks
- Phase 6: Initial state configuration for simulation seeding (orbit, power, attitude, thermal)
- Phase 6: Console layout configuration for mission control interface
- Phase 6: Scenario metadata (difficulty, tier, type, duration, tags, objectives, prerequisites)

### Changed

### Fixed

### Security

---

## [1.1.0] - 2025-01-02

### Checkpoint C: Core Domain APIs Ready (Phase 5 Complete)

This minor release completes the satellite management domain, marking the first core domain API ready for client integration. The satellite subsystem provides full CRUD operations with ownership scoping, comprehensive validation, and complete Swagger documentation.

### Added
- Phase 5: Complete satellite management domain with full CRUD operations
- Phase 5: Satellite schema validation with strict Zod schemas for all subsystems (orbit, power, attitude, thermal, propulsion, payload)
- Phase 5: Ownership scoping for satellite operations (users can only access their own satellites, admins see all)
- Phase 5: Comprehensive Swagger documentation for all satellite endpoints
- Phase 5: Satellite repository with Firestore integration
- Phase 5: Satellite controller using CRUD factory pattern with lifecycle hooks

### Changed

### Fixed

### Security

---

## [1.0.1] - 2025-12-28

### Checkpoint B: Foundation Complete (Phases 0-4)

This patch release completes the foundation layer with security hardening, validation infrastructure, and CRUD factory improvements. No new API endpoints were added, making this a backward-compatible patch release.

### Added
- Phase 0: Project versioning and documentation framework
- Phase 0: Helper scripts for file structure mapping and line ending conversion
- Phase 0.5: Identity policy corrections in Swagger documentation
- Phase 3: Reusable validation middleware (`src/middleware/validate.js`)
- Phase 4: CRUD Factory lifecycle hooks system (11 hooks: ownershipScope, before/after for create/update/patch/delete/read, auditMetadata)
- Phase 4: MAX_PAGE_LIMIT constant (100) exported from crudFactory
- Phase 2: Global API rate limiting middleware (`apiLimiter`) mounted for all `/api/v1/*` routes
- Phase 2: Centralized HTTP client (`src/utils/httpClient.js`) with configurable timeout (default 8000ms)
- Phase 2: Authentication error normalizer middleware for production security
- Phase 2: Environment variables for HTTP client configuration (`HTTP_CLIENT_TIMEOUT_MS`, `HTTP_CLIENT_RETRY_ATTEMPTS`, `HTTP_CLIENT_RETRY_DELAY_MS`)

### Changed
- Phase 0.5: Updated Swagger documentation to reflect uid-based identity policy
- Phase 0.5: Clarified callSign as non-unique display label (not identifier)
- Phase 0.5: Documented email as unique constraint for data integrity only
- Phase 1: Removed callSign uniqueness checks - multiple users can now share the same callSign
- Phase 1: All user-targeted endpoints operate by uid only
- Phase 2: Global rate limiter applied to all `/api/v1` routes
- Phase 2: Outbound HTTP calls now have explicit timeouts for DoS protection
- Phase 2: Auth error messages normalized in production mode
- Phase 3: All schemas now use `.strict()` mode to reject unknown fields
- Phase 3: Query parameters capped (limit ≤ 100) and whitelisted (sortBy fields)
- Phase 3: Auth and user routes now use validation middleware
- Phase 3: Updated README with Phase 3 features and removed outdated port troubleshooting
- Phase 3: Enhanced environment configuration with `user_uid` variable
- Phase 4: CRUD Factory signature now requires hooks parameter (4th argument)
- Phase 4: Pagination hardening in getAll() - enforces MAX_PAGE_LIMIT=100 and auto-normalizes page/limit values
- Phase 4: All CRUD handlers now consistently use `req.user?.uid || 'ANONYMOUS'` for audit logging
- Phase 4: Ownership scoping support via hooks - filters can be applied to queries without repository changes
- Phase 4: Enhanced JSDoc documentation with comprehensive hook examples

### Security
- Phase 2: Global API rate limiting prevents abuse
- Phase 2: Outbound HTTP timeout protection against DoS attacks
- Phase 2: Production auth errors no longer leak internal details

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
- **[1.0.1]** - 2025-12-28 - Foundation hardening (security, validation, CRUD improvements)
- **[1.1.0]** - 2025-01-02 - Satellites domain complete (Checkpoint C)
- **[1.2.0]** - 2025-12-31 - Scenarios domain complete (Phase 6)
- **[1.3.0]** - Development - Scenario Steps domain (Phase 7)

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
