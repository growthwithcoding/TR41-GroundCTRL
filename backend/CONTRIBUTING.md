# Contributing to GroundCTRL Backend

Thank you for contributing to the GroundCTRL Mission Control Platform! This document outlines our workflow, coding standards, and best practices.

**Current Version:** v1.6.0 (Checkpoint D - NOVA AI Complete)  
**Backend Team:** Austin Carlson, Cameron Carmody, Tessa Robinson  
**QA Team:** Adam Colyer, Austin Carlson

---

## Table of Contents

1. [Development Workflow](#development-workflow)
2. [Phase-Based Implementation](#phase-based-implementation)
3. [Code Standards](#code-standards)
4. [CRUD Factory Policy](#crud-factory-policy)
5. [Identity Policy (Non-Negotiable)](#identity-policy-non-negotiable)
6. [Testing Requirements](#testing-requirements)
7. [Pull Request Process](#pull-request-process)
8. [Code Review Guidelines](#code-review-guidelines)
9. [Documentation Requirements](#documentation-requirements)

---

## Development Workflow

### Getting Started

1. **Clone the repository:**
   ```bash
   git clone https://github.com/E-Y-J/TR41-GroundCTRL.git
   cd TR41-GroundCTRL/backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment:**
   ```bash
   cp .env.sample .env
   # Edit .env with your Firebase credentials and configuration
   ```

4. **Run development server:**
   ```bash
   npm run dev
   ```

5. **Run tests:**
   ```bash
   npm test
   ```

---

## Phase-Based Implementation

GroundCTRL follows a **phase-based development model** outlined in `IMPLEMENTATION_PLAN.md`.

### Phase Rules (Non-Negotiable)

1. **One phase per PR** - No exceptions
2. **Self-assign phases** - Choose an unassigned phase from the plan and assign yourself in Slack
3. **Check prerequisites** - Don't start a phase that depends on incomplete work
4. **No cross-phase changes** - Keep changes strictly within your phase scope
5. **Complete implementation** - Code + docs + tests required for each phase

### How to Self-Assign a Phase

1. **Check Slack Project Tracker** - View available phases and their prerequisites
2. **Self-assign in Slack** - This is the source of truth; claim the phase there first
3. **Create your feature branch** - Start your work in a new branch
4. **Update IMPLEMENTATION_PLAN.md in your branch**:
   ```markdown
   **Status:** IN PROGRESS
   **Owner:** YOUR_NAME
   ```
5. **Implement the phase** - All changes (including plan updates) go through PR

**Important:** The Slack Project Tracker is the authoritative source for phase assignments. When you create your PR, include your IMPLEMENTATION_PLAN.md update along with your code changes. After the PR is merged, the main branch will have your updated plan document.

### Phase Workflow

```
1. Self-assign phase → 2. Create branch → 3. Implement → 4. Test → 5. Document → 6. PR → 7. Review → 8. Merge → 9. Update plan
```

---

## Code Standards

### General Principles

- Write clean, readable, maintainable code
- Follow existing code patterns and conventions
- Comment complex logic, but prefer self-documenting code
- Keep functions small and focused (single responsibility)
- Use meaningful variable and function names

### JavaScript Style

- **ESLint:** Code must pass `npm run lint` without errors
- **Indentation:** 2 spaces (enforced by ESLint)
- **Quotes:** Single quotes for strings (except JSON)
- **Semicolons:** Required
- **Line endings:** LF (use `src/scripts/convert_crlf_to_lf.py` if needed)

### File Organization

```
src/
├── config/          # Configuration files
├── constants/       # Constant values and enums
├── controllers/     # Request handlers (thin layer)
├── factories/       # Generic factories (CRUD, response, audit)
├── middleware/      # Express middleware
├── repositories/    # Database access layer
├── routes/          # Route definitions
├── schemas/         # Zod validation schemas
├── services/        # Business logic
├── scripts/         # Utility scripts
└── utils/           # Helper functions
```

### Naming Conventions

- **Files:** camelCase (e.g., `userController.js`, `authService.js`)
- **Classes/Services:** camelCase (e.g., `authService`, `userService`)
- **Functions:** camelCase (e.g., `getUserById`)
- **Constants:** UPPER_SNAKE_CASE (e.g., `MAX_LOGIN_ATTEMPTS`)
- **Variables:** camelCase (e.g., `userId`, `callSign`)

### Error Handling

Always use the custom error classes from `src/utils/errors.js`:

```javascript
const { ValidationError, NotFoundError, UnauthorizedError } = require('../utils/errors');

// Example
if (!user) {
  throw new NotFoundError('User not found');
}
```

### Async/Await

- Prefer `async/await` over `.then()` chains
- Always handle errors with try/catch
- Use appropriate error types

```javascript
async function getUser(uid) {
  try {
    const user = await userRepository.getById(uid);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    return user;
  } catch (error) {
    logger.error('Error fetching user', { uid, error });
    throw error;
  }
}
```

---

## CRUD Factory Policy

Use `src/factories/crudFactory.js` for satellites, scenarios, scenario steps, and commands.

### When to Use the Factory

✅ **DO use the factory for:**
- Standard CRUD operations (Create, Read, Update, Delete)
- Pagination and filtering
- Basic ownership enforcement
- Standard validation

❌ **DON'T use the factory for:**
- Complex domain logic
- Multi-step operations
- Domain-specific workflows
- Custom business rules

### Controller Structure

Controllers should be thin wrappers around factory + domain logic:

```javascript
// ✅ GOOD: Controller delegates to factory for CRUD
const satelliteController = {
  create: crudFactory.create(satelliteRepository, { 
    ownershipField: 'createdBy' 
  }),
  
  // Custom domain logic stays in controller
  executeCommand: async (req, res, next) => {
    try {
      // Domain-specific implementation
      const result = await satelliteService.executeCommand(req.params.id, req.body);
      res.json(responseFactory.success(result));
    } catch (error) {
      next(error);
    }
  }
};
```

### Factory Responsibilities (Goal State)

- Standard CRUD handlers
- Pagination + limit caps
- Validation hooks
- Ownership enforcement hooks
- Consistent `responseFactory` usage
- Audit hooks for success/failure

---

## Identity Policy (Non-Negotiable)

These rules **MUST** be enforced in all code:

### The Rules

1. **uid is the ONLY canonical user identifier**
   - All auth, audits, admin actions, and resource ownership use `uid`
   - Never use anything else for identity or targeting

2. **callSign is NON-UNIQUE**
   - Display and context only
   - Never use for identity, authorization, or targeting
   - Multiple users may share the same callSign

3. **email is UNIQUE** (Firestore constraint)
   - Data integrity only (one profile per email)
   - NOT used for identity, authorization, or targeting
   - Internal lookups only for uniqueness checks

### Violations are Bugs

Any code that violates this policy is a bug and must be fixed immediately.

### Examples

```javascript
// ✅ CORRECT
const user = await userRepository.getById(req.user.uid);
await auditFactory.log(AUDIT_EVENTS.USER_UPDATED, req.user.uid);
const resources = await repository.getAllByOwner(req.user.uid);

// ❌ WRONG - Never target by callSign
const user = await userRepository.getByCallSign(req.body.callSign);

// ❌ WRONG - Never target by email
const user = await userRepository.getByEmail(req.body.email);
```

---

## Testing Requirements

### Testing Team Responsibilities

Testing is handled by dedicated teams:
- **Quality Assurance (QA):** Functional testing, integration testing, and test coverage
- **Cybersecurity:** Security testing, vulnerability assessment, and penetration testing

### Test Organization

Tests are organized in the `tests/` directory:
```
tests/
├── unit/
│   ├── controllers/
│   ├── factories/
│   ├── middleware/
│   ├── repositories/
│   ├── routes/
│   ├── schemas/
│   └── services/
├── integration/
│   ├── satellites/
│   ├── scenarios/
│   ├── scenario_steps/
│   └── commands/
└── e2e/
    ├── user/
    ├── satellite/
    └── command/
```

### Developer Testing Workflow

**Before PR Submission:**
1. **Manual verification:** Ensure your code runs without errors
2. **Basic smoke testing:** Test happy path functionality locally
3. **Linting:** Run `npm run lint` to ensure code quality

**After PR Submission:**
1. **Notify QA Team:** Contact QA team via Slack with:
   - PR link
   - Phase number and description
   - List of changes and new functionality
   - Any specific test scenarios to consider

2. **Notify Cybersecurity Team (if applicable):** For phases involving:
   - Authentication/authorization changes
   - New API endpoints
   - Security-related features
   - Data validation changes

### QA and Cybersecurity Contact

- **QA Team:** Contact via Slack
- **Cybersecurity Team:** Contact via Slack

### Test Coverage Goals (QA-Maintained)

- **Critical paths:** 100% (auth, security, identity)
- **Business logic:** 80%+
- **Controllers:** 70%+
- **Utilities:** 90%+

### Running Existing Tests

```bash
# Run existing tests (if available)
npm test

# Watch mode
npm run test:watch

# Coverage report
npm test -- --coverage
```

### Phase Testing Process

For each phase PR:
1. **Developer** ensures basic functionality locally before creating PR
2. **Developer** submits PR with functional code
3. **Peer review** by another backend developer (code quality, standards)
4. **PR merged** to main after peer approval
5. **QA Team** tests the merged code and creates automated tests
6. **Cybersecurity Team** performs security assessment on merged code (if applicable)
7. **Follow-up fixes** (if needed) come as new PRs based on QA/Security findings

---

## Pull Request Process

### Creating a Pull Request

1. **Create feature branch:**
   ```bash
   git checkout -b phase-X-description
   # Example: git checkout -b phase-6-satellites-api
   ```

2. **Implement the phase** (code + docs + tests)

3. **Run quality checks:**
   ```bash
   npm run lint        # Must pass
   npm test            # Must pass
   npm run lint:fix    # Auto-fix issues
   ```

4. **Commit with clear messages:**
   ```bash
   git add .
   git commit -m "Phase 6: Implement Satellites API"
   ```

5. **Push and create PR:**
   ```bash
   git push origin phase-6-satellites-api
   ```

6. **Fill out PR template** (auto-populated from `.github/PULL_REQUEST_TEMPLATE.md`)

### PR Title Format

```
Phase X: [Brief Description]
```

Examples:
- `Phase 0: Add versioning and helper scripts`
- `Phase 3: Global rate limiting and timeouts`
- `Phase 6: Satellites Domain Implementation`

### PR Description Checklist

Use the template and ensure:
- [ ] Phase number and description
- [ ] Prerequisites verified
- [ ] Code implemented and tested
- [ ] Documentation updated
- [ ] All tests passing
- [ ] No cross-phase changes
- [ ] CHANGELOG.md updated (in `[Unreleased]`)

---

## Code Review Guidelines

### For Authors

- Keep PRs focused on one phase only
- Respond to feedback promptly and professionally
- Make requested changes or explain why you disagree
- Don't merge your own PRs

### For Reviewers

At least **1 other backend developer** must review and approve.

#### Review Checklist

**Code Quality:**
- [ ] Follows coding standards
- [ ] No obvious bugs or errors
- [ ] Proper error handling
- [ ] Clear and maintainable

**Phase Compliance:**
- [ ] Changes are within phase scope
- [ ] No cross-phase modifications
- [ ] Prerequisites satisfied
- [ ] Identity policy followed

**Testing:**
- [ ] Tests included for new code
- [ ] Tests pass locally
- [ ] Coverage is adequate

**Documentation:**
- [ ] Code comments where needed
- [ ] Swagger docs updated
- [ ] CHANGELOG.md updated
- [ ] README updated if needed

**Security:**
- [ ] No security vulnerabilities
- [ ] Authentication/authorization correct
- [ ] Input validation present
- [ ] No sensitive data exposed

### Feedback Guidelines

- Be constructive and specific
- Suggest improvements with examples
- Explain the "why" behind requests
- Approve when satisfied or minor nits remain

---

## Documentation Requirements

### Code Documentation

- **JSDoc comments** for public functions
- **Inline comments** for complex logic
- **README updates** for new features
- **ARCHITECTURE.md updates** for structural changes

### JSDoc Example

```javascript
/**
 * Retrieves a user by their unique identifier
 * 
 * @param {string} uid - Firebase user ID (canonical identifier)
 * @returns {Promise<Object>} User object
 * @throws {NotFoundError} If user does not exist
 * @throws {DatabaseError} If database operation fails
 */
async function getUserById(uid) {
  // Implementation
}
```

### Swagger Documentation

All endpoints **must** have Swagger documentation:

```javascript
/**
 * @swagger
 * /satellites:
 *   get:
 *     tags:
 *       - Satellites
 *     summary: List all satellites
 *     description: Returns paginated list of satellites
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *     responses:
 *       200:
 *         description: GO - Satellites retrieved successfully
 */
router.get('/satellites', authMiddleware, satelliteController.list);
```

### CHANGELOG.md Updates

Every PR must update `CHANGELOG.md` in the `[Unreleased]` section:

```markdown
## [Unreleased]

### Added
- Phase 6: Satellites API with full CRUD operations
- Ownership enforcement for satellite resources
```

---

## Mission Control Terminology

Use aerospace-themed terminology consistently:

### Response States
- **GO** - Success (200-299)
- **NO-GO** - Client error (400-499)
- **HOLD** - Service unavailable (503-504)
- **ABORT** - Server error (500-599)

### Common Terms
- **Operator** or **Pilot** - User
- **Call Sign** - Display identifier (non-unique)
- **Mission** - Operation/request
- **Telemetry** - Metadata
- **Station** - Server instance
- **Uplink** - Request
- **Downlink** - Response

---

## Getting Help

### Resources

- **IMPLEMENTATION_PLAN.md** - Phase details and status
- **ARCHITECTURE.md** - System architecture
- **README.md** - Setup and usage
- **Swagger Docs** - API documentation (http://localhost:3001/api-docs)

### Questions?

1. Check existing documentation first
2. Search closed PRs and issues
3. Ask in team communication channel
4. Contact backend team lead

---

## Helper Scripts

Utility scripts available in `src/scripts/`:

### convert_crlf_to_lf.py
Converts line endings from CRLF (Windows) to LF (Unix/Linux) format:
```bash
python src/scripts/convert_crlf_to_lf.py
```
Use this if you encounter line ending issues.

### map_file_structure.py
Generates a text map of the project file structure:
```bash
python src/scripts/map_file_structure.py
```
Useful for documentation and project overview.

### FB_cleanup.js
Firestore cleanup utility for development:
```bash
npm run cleanup
```
Cleans up test data from Firestore (use with caution).

---

## Quick Reference

```bash
# Setup
npm install
cp .env.sample .env

# Development
npm run dev          # Start dev server
npm test             # Run tests
npm run lint         # Check code style
npm run lint:fix     # Auto-fix style issues

# Helper Scripts
python src/scripts/convert_crlf_to_lf.py  # Fix line endings
python src/scripts/map_file_structure.py  # Generate file map
npm run cleanup                            # Clean Firestore (dev only)

# Phase Workflow
git checkout -b phase-X-description
# ... implement phase ...
npm run lint && npm test
git commit -m "Phase X: Description"
git push origin phase-X-description
# ... create PR ...
```

---

Thank you for contributing to GroundCTRL! 🛰️
