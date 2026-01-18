# IMPLEMENTATION_PLAN.md

**Repository:** GroundCTRL Backend (Node.js 18+ / Express / Firebase Auth + Firestore)  
**Created:** 2025-12-25  
**Purpose:** Phase-by-phase implementation guide with explicit execution control (one phase per PR)  
**Team:** 3 Backend Developers (self-assign from Slack Project Tracker)

---

## How this plan is executed (non-negotiable)

**One Phase per PR.** A “phase” includes any “.5” items listed under it (single PR).

1. A BE dev **self-assigns Phase X** from the Slack Project Tracker.
2. Implement **ONLY Phase X** (code + docs within phase scope).
3. Ensure basic functionality locally before creating PR.
4. Open a PR titled: `Phase X - <Phase Title>`
5. Peer review required (at least 1 backend developer approving).
6. **Merge PR** to main after peer approval.
7. Notify QA Team via Slack (QA tests merged code and creates automated tests).
8. Notify Cybersecurity Team via Slack (if security-related, tests merged code).
9. Follow-up fixes (if needed) come as new PRs based on QA/Security findings.
6. Update this file: set Phase X **Status = DONE**, add an entry to the Execution Log.
7. STOP. Next phase is a new PR and a new self-assignment.

### Phase rules
- No cross-phase changes “because it’s nearby.”
- If a blocking dependency is discovered:
  - document it in the phase notes,
  - open a small “follow-up task” in Slack,
  - stop and keep the PR limited to the phase scope.

---

## Non-negotiable identity policy

These rules MUST be enforced in code and documentation:

- **uid** is the ONLY canonical identifier for users (targeting, authorization, audits)
- **callSign** is **NON-UNIQUE** (display/context only)
- **email** is **UNIQUE** in Firestore `users` collection as a data-integrity constraint
- **email is NOT used** for targeting/authorization; only uid is used for operations
- Admin actions, audits, and security decisions **target by uid** only

Violations are bugs.

---

## CRUD Factory policy

- Use `crudFactory` **as much as possible** for standard operations.
- Keep domain-specific behavior in **controller wrappers** (scenario rules, step advancement rules, simulation state transitions, NOVA behaviors).
- The factory should provide consistent:
  - pagination handling
  - response formatting (Mission Control protocol)
  - validation hooks (once validation middleware exists)
  - audit hooks (standardized + consistent)

---

## Versioning strategy (best-method approach)

**Baseline:** `v1.0.0` is the current baseline.

We do **not** bump versions after every phase. We bump versions when a meaningful "release slice" is complete.

### Release decision gates (recommended)
Bump version when a phase set reaches one of these checkpoints:

1. **Patch release (1.0.x)**  
   Security fixes, bug fixes, wiring fixes (no API contract changes, no new resources).

2. **Minor release (1.x.0)**  
   New backwards-compatible features (new endpoints, new resources, new capabilities) without breaking existing clients.

3. **Major release (2.0.0)**  
   Breaking API changes, renamed endpoints, changed response structures, changed auth contract, or changes requiring client rewrites.

### Planned releases aligned with RELEASE.md (re-evaluated at each gate)

Each new domain adds new API endpoints/resources, which per semantic versioning = MINOR version bump.

| Phase Range | Domain | Version | Type | Checkpoint | Trigger |
|-------------|--------|---------|------|------------|---------|
| 0-4 | Foundation | v1.0.1 | PATCH | B | Security/validation/CRUD hardening (no new endpoints) |
| 5 | Satellites | v1.1.0 | MINOR | C | New `/api/v1/satellites` endpoints (PATCH resets to 0) |
| 6 | Scenarios | v1.2.0 | MINOR | - | New `/api/v1/scenarios` endpoints |
| 7 | Scenario Steps | v1.3.0 | MINOR | - | New `/api/v1/scenarios/:id/steps` endpoints |
| 8 | Sessions/State | v1.4.0 | MINOR | - | New `/api/v1/sessions` endpoints |
| 9 | Commands | v1.5.0 | MINOR | - | New `/api/v1/commands` endpoints |
| 10 | NOVA AI | v1.6.0 | MINOR | D | New `/api/v1/ai/messages` endpoints |
| 11 | Testing/Docs | v1.6.1 | PATCH | - | Bug fixes, hardening (PATCH from 1.6.0) |

**Rationale:** Each domain adds backwards-compatible new resources/endpoints without breaking existing API contracts. This provides clear version signals to frontend/clients about new capabilities.

**Rule:** Each release must have:
- updated `CHANGELOG.md`
- a tag
- a documented release checklist in `RELEASE.md`

---

## Phase Overview

- **Phase 0:** Repo hygiene + versioning docs + helper scripts verification + Swagger identity docs (includes 0.5) → **Checkpoint A: v1.0.0**
- **Phase 1:** Identity enforcement: callSign non-unique + eliminate callSign-based targeting
- **Phase 2:** Security quick wins: global rate limiting + outbound timeouts + safer auth error messaging + correctness fixes
- **Phase 3:** Validation layer: add reusable validate middleware + strict schemas + query caps/whitelists
- **Phase 4:** CRUD factory hardening for safe-by-default reuse across domains → **Checkpoint B: v1.0.1 (PATCH)**
- **Phase 5:** Satellites domain implementation → **Checkpoint C: v1.1.0 (MINOR)**
- **Phase 6:** Scenarios domain implementation → **v1.2.0 (MINOR)**
- **Phase 7:** Scenario Steps domain implementation → **v1.3.0 (MINOR)**
- **Phase 8:** User Scenario Sessions & Simulation State → **v1.4.0 (MINOR)**
- **Phase 9:** Mission Commands (logging + validation + feedback hooks) → **v1.5.0 (MINOR)**
- **Phase 10:** NOVA (AI Tutor) end-to-end integration → **Checkpoint D: v1.6.0 (MINOR)**
- **Phase 11:** Testing + Documentation Verification → **v1.6.1 (PATCH)**
- **Final:** Release prep (as needed for each checkpoint)

---

# PHASE 0: Repo Hygiene + Versioning Docs + Swagger Identity Docs (includes 0.5)

**Status:** DONE 
**Owner:** Austin Carlson  
**Release:** Checkpoint A - v1.0.0 (baseline)

## Goal
Establish repo discipline, contributor workflow, and correct identity language in documentation.

## What needs to be added/updated
### Repo / workflow docs
Create (root):
- `CHANGELOG.md` (Keep a Changelog format)
- `VERSIONING.md` (SemVer + decision gates described above)
- `RELEASE.md` (PR → merge → changelog → tag workflow)
- `CONTRIBUTING.md` (phase workflow, review rules, conventions)

Create:
- `.github/PULL_REQUEST_TEMPLATE.md` (phase number, checklist, changelog checkbox)

### Helper scripts (verify + document usage)
- Verify `src/scripts/map_file_structure.py` exists and works
- Verify `src/scripts/convert_crlf_to_lf.py` exists and works
- Add short usage notes for both in `CONTRIBUTING.md` or `RELEASE.md`

### Swagger identity corrections (docs-only)
Update:
- `src/config/swagger.js` to remove any claim that callSign is unique; document `uid` as canonical identity; document email uniqueness as integrity constraint only.
- `src/routes/auth.js` Swagger comments: remove “unique call sign identifier” language.

## Acceptance criteria
- All listed docs exist and are consistent with team PR workflow
- No docs claim callSign is unique
- Swagger describes uid as canonical identity
- CHANGELOG includes `[Unreleased]` and a clear baseline entry for `1.0.0`
- Phase 0 marked DONE + execution log entry added

---

# PHASE 1: Identity Enforcement (callSign non-unique + remove callSign targeting)

**Status:** DONE  
**Owner:** AUSTIN CARLSON 

## Goal
Ensure runtime behavior follows identity policy (uid canonical, callSign display-only).

## What needs to be added/updated
- Remove callSign uniqueness checks (create/update/patch user flows).
- Audit any repository/controller methods that fetch users by callSign and either:
  - remove them, or
  - convert them to list/search methods that are explicitly “UI convenience” and never used for targeting/authorization.
- Ensure no endpoint accepts email or callSign in place of `:uid` anywhere.

**Likely files involved**
- `src/services/userService.js`
- `src/repositories/userRepository.js`
- `src/controllers/userController.js` (if any controller logic assumes uniqueness)

## Acceptance criteria
- Two different users can share the same callSign without conflict
- All user-targeted endpoints operate by uid only
- Any callSign-based lookup is explicitly non-authoritative (list/search only) or removed
- Phase 1 marked DONE + execution log entry added

---

# PHASE 2: Security Quick Wins + Correctness Fixes

**Status:** DONE  
**Owner:** AUSTIN CARLSON 

## Goal
Close the highest-risk items from the security review: global abuse protection and external-call resilience.

## What needs to be added/updated
### Global API rate limiting
- Ensure `apiLimiter` is mounted globally for `/api/v1/*` routes (not only auth routes).
- Confirm auth routes continue using stricter limiters (login/auth).

### Outbound HTTP timeouts (DoS protection)
- Add explicit timeouts for outbound HTTP calls used during authentication flows (e.g., Firebase Identity Toolkit calls).
- Add a single “central outbound http client config” approach to avoid forgetting timeouts in new files.

### Auth error normalization (prod)
- Ensure auth failures do not leak internal detail in production env (consistent “invalid credentials” style messaging, avoid revealing lockout thresholds).

### Correctness fixes discovered during review
- While implementing, confirm/fix any correctness issues that affect API output shape (e.g., pagination response formatting).

**Likely files involved**
- `src/app.js`
- `src/middleware/rateLimiter.js`
- `src/services/authService.js`
- `src/utils/*` (shared client config / constants)
- `src/factories/responseFactory.js` (if output bug exists)

## Acceptance criteria
- Global rate limiter is applied to `/api/v1` routes
- All outbound auth-related HTTP calls have timeouts
- Auth errors are normalized in production mode
- Phase 2 marked DONE + execution log entry added

---

# PHASE 3: Validation Layer (Middleware + Strict Schemas + Query Caps)

**Status:** DONE  
**Owner:** Austin Carlson

## Goal
Enforce strict validation at route boundaries to prevent integrity issues and future privilege bypass.

## What needs to be added/updated
### Create reusable validation middleware
Create:
- `src/middleware/validate.js` supporting:
  - `body`, `params`, `query` sources
  - Zod parsing (safeParse)
  - consistent ValidationError formatting

### Harden schemas
Update schemas to:
- use `.strict()` where appropriate
- cap `limit` (<= 100) consistently
- whitelist `sortBy` fields per resource
- normalize query types (numbers/booleans) consistently

### Apply middleware across existing endpoints
- Apply to auth routes and user routes first.
- Document the validation pattern for new route modules.

**Likely files involved**
- `src/middleware/validate.js` (new)
- `src/schemas/authSchemas.js`, `src/schemas/userSchemas.js`
- `src/routes/auth.js`, `src/routes/users.js`

## Acceptance criteria
- Unknown fields rejected
- Query parameters capped and whitelisted
- Controllers do not pass raw unvalidated body to services
- Phase 3 marked DONE + execution log entry added

---

# PHASE 4: CRUD Factory Hardening (safe-by-default reuse)

**Status:** DONE  
**Owner:** AUSTIN CARLSON  
**Release:** Checkpoint B - v1.0.1 (PATCH) - Foundation complete

## Goal
Make `crudFactory` a reliable engine for upcoming domain work without burying domain rules inside it.

## What needs to be added/updated
- Align factory behavior with validation middleware:
  - accept hooks/callbacks for:
    - ownership scoping (e.g., createdBy uid)
    - audit event naming (resource/action)
    - domain-level request shaping (controller wrapper)
- Ensure consistent pagination:
  - enforce max limits
  - consistent response meta shape
- Ensure audit logging is consistent and uses uid as actor identity.
- Ensure domain controllers can override/extend behavior.

**Likely files involved**
- `src/factories/crudFactory.js`
- `src/factories/auditFactory.js`
- `src/constants/auditEvents.js` (if audit taxonomy needs updates)
- `src/repositories/auditRepository.js`

## Acceptance criteria
- ✅ Factory supports reuse for satellites/scenarios/steps/commands standard CRUD
- ✅ Ownership enforcement is possible without duplicating logic per route file
- ✅ Domain logic stays in controller wrappers, not the factory
- ✅ Phase 4 marked DONE + execution log entry added

## Implementation Summary
- Added lifecycle hooks system (11 hooks: ownershipScope, before/after for create/update/patch/delete/read, auditMetadata)
- Hardened pagination with MAX_PAGE_LIMIT = 100 enforcement and auto-normalization
- All audit logging standardized to use `req.user?.uid || 'ANONYMOUS'`
- Ownership scoping implemented as filter builder pattern (no repository changes needed)
- Comprehensive JSDoc with usage examples
- Mission Control response format preserved throughout

---

# PHASE 5: Satellites Domain Implementation

**Status:** DONE 
**Owner:** CAMERON CARMODY  
**Release:** Checkpoint C - v1.1.0 (MINOR) - Satellites domain

## Goal
Implement satellite “spec templates” used by scenarios.

## Data model alignment
Collection: `satellites`  
Minimum fields:
- `id`
- `name`
- `orbitAltitude` (km)
- `inclination` (degrees)

## What needs to be added/updated
- Decide implementation shape:
  - Option A: dedicated satellites repository (recommended if following existing architecture)
  - Option B: small generic Firestore repository helper and use it in satellites controller wrapper
- Add strict schemas for create/update/query.
- Add controller wrapper to enforce:
  - required fields
  - allowed updates
  - access policy (admin-only vs creator-owned vs open)
- Replace stub `src/routes/satellites.js` with real handlers using crudFactory where possible.
- Update Swagger docs.

**Likely files involved**
- `src/routes/satellites.js`
- `src/controllers/satelliteController.js` (new)
- `src/schemas/satelliteSchemas.js` (new)
- `src/repositories/satelliteRepository.js` (new) if chosen
- `src/config/swagger.js`

## Acceptance criteria
- Satellites endpoints return Mission Control responses
- Strict validation enforced
- Access policy enforced
- Swagger accurate
- Phase 5 marked DONE + execution log entry added

---

# PHASE 6: Scenarios Domain Implementation

**Status:** DONE 
**Owner:** CAMERON CARMODY  
**Release:** v1.2.0 (MINOR) - Scenarios domain

## Goal
Implement scenarios (missions) that reference satellites and define initial state.

## Data model alignment
Collection: `scenarios`  
Minimum viable fields:
- `id`
- `code`
- `title`
- `description`
- `difficulty` (INTRO/EASY/MEDIUM/HARD)
- `type` (GUIDED/SANDBOX)
- `is_active`
- `is_core`
- `estimated_duration_minutes`
- `satellite_id` (FK to satellites.id)
- `initial_state` (json)
- `console_layout` (json)
- `created_at`

## What needs to be added/updated
- Add strict scenario schemas.
- Add controller wrapper:
  - enforce enums
  - validate referenced satellite exists
  - constrain writable fields
- Repository decision consistent with Phase 5.
- Replace stub route logic in `src/routes/scenarios.js` using crudFactory for standard CRUD.
- Update Swagger docs.

**Likely files involved**
- `src/routes/scenarios.js`
- `src/controllers/scenarioController.js` (new)
- `src/schemas/scenarioSchemas.js` (new)
- `src/repositories/scenarioRepository.js` (new) if chosen
- `src/config/swagger.js`

## Acceptance criteria
- Scenarios CRUD works with strict validation
- Scenario → satellite FK validated
- Swagger accurate
- Phase 6 marked DONE + execution log entry added

---

# PHASE 7: Scenario Steps Domain Implementation

**Status:** NOT STARTED  
**Owner:** SELF-ASSIGN  
**Release:** v1.3.0 (MINOR) - Scenario Steps domain

## Goal
Implement ordered steps for guided scenarios with objectives and default hints for NOVA.

## Data model alignment
Collection: `scenario_steps`  
Minimum fields:
- `id`
- `scenario_id`
- `step_order`
- `title`
- `instruction`
- `objective`
- `completion_condition`
- `is_checkpoint`
- `expected_duration_seconds`
- `hint_suggestion`

## What needs to be added/updated
- Add strict step schemas.
- Add controller wrapper:
  - validate scenario exists
  - enforce ordering uniqueness: (scenario_id, step_order)
- Define nested APIs (recommended):
  - `/scenarios/:scenarioId/steps`
  - `/scenarios/:scenarioId/steps/:stepId`
- Repository decision consistent with Phase 5/6.
- Update Swagger docs.

**Likely files involved**
- `src/routes/scenarios.js` (nested) or `src/routes/scenarioSteps.js` (new)
- `src/controllers/scenarioStepsController.js` (new)
- `src/schemas/scenarioStepsSchemas.js` (new)
- `src/repositories/scenarioStepsRepository.js` (new) if chosen
- `src/config/swagger.js`

## Acceptance criteria
- Steps CRUD works and is properly scoped to scenario
- Ordering constraints enforced
- hint_suggestion is available for NOVA
- Phase 7 marked DONE + execution log entry added

---

# PHASE 8: User Scenario Sessions & Simulation State

**Status:** NOT STARTED  
**Owner:** SELF-ASSIGN  
**Release:** v1.4.0 (MINOR) - Sessions domain

## Goal
Track per-user runs and store simplified simulation state.

## Data model alignment
Collection: `user_scenario_sessions`  
Expected fields:
- `id`
- `user_id` (uid)
- `scenario_id`
- `started_at`
- `completed_at` (nullable)
- `last_activity_at`
- `status` (IN_PROGRESS/COMPLETED/FAILED/ABANDONED)
- `current_step_id`
- `score`
- `total_hints_used`
- `total_errors`
- `state` (json)

## What needs to be added/updated
- Add strict session schemas.
- Add controller wrapper domain actions:
  - start session
  - resume session
  - update state safely
  - advance step (server-controlled)
  - complete/fail/abandon transitions
- Define route shapes:
  - `/scenarios/:scenarioId/sessions`
  - `/sessions/:sessionId`
  - `/sessions/:sessionId/advance`
- Enforce ownership: user only accesses their sessions; admin behavior optional.

**Likely files involved**
- `src/routes/scenarios.js` and/or `src/routes/sessions.js` (new)
- `src/controllers/sessionController.js` (new)
- `src/schemas/sessionSchemas.js` (new)
- `src/repositories/sessionRepository.js` (new) if chosen
- `src/middleware/authMiddleware.js` (ensure owner checks exist)

## Acceptance criteria
- Sessions can be created and progressed by owning user
- State is stored and retrievable
- Step progression is validated
- Phase 8 marked DONE + execution log entry added

---

# PHASE 9: Mission Commands (logging + validation + feedback hooks)

**Status:** NOT STARTED  
**Owner:** SELF-ASSIGN  
**Release:** v1.5.0 (MINOR) - Commands domain

## Goal
Persist and validate commands issued in the console, bound to session + step.

## Data model alignment
Collection: `user_commands`  
Expected fields:
- `id`
- `session_id`
- `scenario_step_id`
- `issued_at`
- `command_name`
- `command_payload` (json)
- `result_status` (OK/ERROR/NO_EFFECT)
- `result_message`
- `is_valid`

## What needs to be added/updated
- Define a minimal command registry to validate command_name and payload shape.
- Add endpoints to:
  - submit command
  - validate + store result
  - update session counters (errors, etc.) where appropriate
- Enforce:
  - authenticated user
  - ownership of session
  - correctness relative to current step
- Make results usable for NOVA tutoring.

**Likely files involved**
- `src/routes/commands.js`
- `src/controllers/commandsController.js` (new)
- `src/schemas/commandSchemas.js` (new)
- `src/repositories/commandRepository.js` (new) if chosen
- `src/controllers/sessionController.js` (counters/state)
- `src/config/swagger.js`

## Acceptance criteria
- Commands persisted and queryable by session
- Basic validation exists (name + payload + step context)
- result_status/result_message consistent
- Phase 9 marked DONE + execution log entry added

---

# PHASE 10: NOVA (AI Tutor) End-to-End Integration

**Status:** NOT STARTED  
**Owner:** SELF-ASSIGN  
**Release:** Checkpoint D - v1.6.0 (MINOR) - NOVA AI complete

## Goal
Implement NOVA as AI tutoring layer with persistence and step-aware guidance.

## Data model alignment
Collection: `ai_messages`

## What needs to be added/updated
### Persistence + conversation APIs
- Define strict schema for messages:
  - `session_id`, `user_id`, `role`, `content`, timestamps
  - optional metadata: step_id, command_id, hint_type, etc.
- Endpoints:
  - list conversation by session
  - post user message (store)
  - store NOVA assistant response

### Step-aware behaviors
- Compose context from:
  - scenario + current_step
  - recent commands and results
  - current session state
  - step hint_suggestion fallback
- Define “hint usage” rules (increment total_hints_used).

### Provider integration (implementation choice)
- If using an external LLM provider:
  - enforce timeouts
  - retry-with-jitter
  - fail gracefully with fallback hints

**Likely files involved**
- `src/routes/ai.js`
- `src/controllers/novaController.js` (new)
- `src/schemas/novaSchemas.js` (new)
- `src/repositories/aiMessagesRepository.js` (new) if chosen
- `src/services/novaService.js` (new, recommended)
- `src/config/swagger.js`

## Acceptance criteria
- Conversation persisted by session
- NOVA responses use step context and recent command results
- total_hints_used updated
- graceful fallback if provider unavailable
- Phase 10 marked DONE + execution log entry added

---

# PHASE 11: Testing + Documentation Verification

**Status:** NOT STARTED  
**Owner:** SELF-ASSIGN  
**Release:** v1.6.1 (PATCH) - Testing and hardening

## Goal
Targeted backend tests + docs verified accurate.

## What needs to be added/updated
### Tests
- validation middleware tests
- crudFactory tests (pagination, audit hook, ownership hook)
- session ownership tests
- command validation tests
- NOVA endpoints tests (persistence + shape)

### Docs
- Update `ARCHITECTURE.md`:
  - identity policy
  - validation pattern
  - CRUD factory usage
  - scenario/session/command/ai flow descriptions
- Verify Swagger is accurate for all endpoints.

**Likely files involved**
- test directory/files (create where your setup expects)
- `ARCHITECTURE.md`
- `src/config/swagger.js`

## Acceptance criteria
- Critical flows covered by tests
- Swagger matches runtime behavior
- ARCHITECTURE.md matches current system design
- Phase 11 marked DONE + execution log entry added

---

# FINAL: Release Prep

**Status:** NOT STARTED  
**Owner:** SELF-ASSIGN

## Goal
Cut a clean release based on decision gates.

## What needs to be added/updated
- Update `CHANGELOG.md`: move `[Unreleased]` into a versioned section
- Decide version bump according to decision gates
- Tag the release
- Update execution log

## Acceptance criteria
- CHANGELOG accurate
- Version bump matches SemVer best-method approach
- Release tag exists
- Execution log updated

---

## Phase Execution Log

| Date | Phase | Owner | PR | Notes |
|------|-------|-------|----|------|
| 2025-12-27 | Phase 0 | Austin Carlson | DONE | Repo hygiene, versioning docs, Swagger identity corrections |
| 2025-12-27 | Phase 0.5 | Austin Carlson | DONE | Identity policy corrections in documentation |
| 2025-12-27 | Phase 1 | Austin Carlson | DONE | Identity enforcement - callSign non-unique implementation |
| 2025-12-27 | Phase 2 | Austin Carlson | DONE | Security quick wins: global rate limiting, HTTP timeouts, auth error normalization |
| 2025-12-28 | Phase 3 | Austin Carlson | DONE | Validation layer complete: created validate.js middleware, hardened all schemas with .strict(), applied validation to auth and user routes |
| 2025-12-28 | Phase 4 | Austin Carlson | Pending | CRUD Factory hardened with lifecycle hooks system (11 hooks), MAX_PAGE_LIMIT enforcement, ownership scoping, consistent audit logging with uid-based identity |
| 2025-12-25 | Plan created | - | - | Initial implementation plan |
| 2025-12-27 | Phase 0 | Austin Carlson | - | Repo hygiene, versioning docs, Swagger identity corrections |
| 2025-12-27 | Phase 0.5 | Austin Carlson | - | Identity policy corrections in documentation |
| 2025-12-27 | Phase 1 | Austin Carlson | - | Identity enforcement - callSign non-unique implementation |
| 2025-12-27 | Phase 2 | Austin Carlson | - | Security quick wins: global rate limiting, HTTP timeouts, auth error normalization |
| 2025-12-28 | Phase 3 | Austin Carlson | Pending | Validation layer complete: created validate.js middleware, hardened all schemas with .strict(), applied validation to auth and user routes |
| 2025-12-31 | Phase 5 | Cameron Carmody | DONE | Complete satellite management domain with full CRUD operations, ownership scoping, comprehensive Swagger docs, and validation middleware fixes |
| 2025-12-31 | Phase 6 | Cameron Carmody | DONE | Complete scenario management domain with full CRUD operations, satellite references, initial state, comprehensive Swagger docs, and validation middleware |
| 2026-01-17 | Critical Fixes | System | DONE | Fixed 4 critical test conflicts: (1) Response envelope middleware properly wraps all responses, (2) authService returns raw data (no pre-wrapping), (3) Rate limiting uses IP+email composite key, (4) Login lockout & audit logging verified working |
