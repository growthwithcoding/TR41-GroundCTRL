# Versioning Scheme

**Project:** GroundCTRL Backend  
**Current Version:** 1.1.0  
**Last Updated:** 2025-01-02  
**Standard:** [Semantic Versioning 2.0.0](https://semver.org)

---

## Overview

This document defines the version numbering scheme for GroundCTRL Backend. For release processes and workflows, see [RELEASE.md](https://github.com/E-Y-J/TR41-GroundCTRL/tree/main/backend/RELEASE.md).

---

## Semantic Versioning Format

Version numbers follow the format: **MAJOR.MINOR.PATCH**

```
MAJOR.MINOR.PATCH
  │     │     │
  │     │     └─── Backward-compatible bug fixes and patches
  │     └─────────── Backward-compatible new features
  └───────────────── Breaking changes (not backward-compatible)
```

### Version Component Definitions

**MAJOR (X.y.z)** - Incompatible API changes
- Breaking changes to existing API contracts
- Removed or renamed endpoints
- Changed response/request payload structures
- Modified authentication/authorization mechanisms
- Changed HTTP status codes for existing operations
- Altered error response formats

**MINOR (x.Y.z)** - Backward-compatible functionality additions
- New API endpoints
- New resources and domains
- New optional parameters or fields
- New features that don't break existing clients
- Deprecated features (still functional)

**PATCH (x.y.Z)** - Backward-compatible fixes
- Bug fixes
- Security patches
- Performance improvements
- Documentation updates
- Internal refactoring without API changes
- Dependency updates (non-breaking)

---

## Version Increment Decision Matrix

| Change Type | API Impact | Version Bump | Example |
|-------------|------------|--------------|---------|
| New endpoint added | None to existing | MINOR | 1.0.1 → 1.1.0 |
| Endpoint removed | Breaking | MAJOR | 1.6.1 → 2.0.0 |
| Bug fix in existing endpoint | None | PATCH | 1.1.0 → 1.1.1 |
| New optional field in request | None | MINOR | 1.1.1 → 1.2.0 |
| Required field added to request | Breaking | MAJOR | 1.2.0 → 2.0.0 |
| Response field removed | Breaking | MAJOR | 1.2.0 → 2.0.0 |
| New optional field in response | None | MINOR | 1.2.0 → 1.3.0 |
| Security patch | None | PATCH | 1.3.0 → 1.3.1 |
| Documentation update | None | PATCH | 1.3.1 → 1.3.2 |
| Internal refactoring | None | PATCH | 1.3.2 → 1.3.3 |

---

## Compatibility Guarantees

### PATCH Releases (x.y.Z)
**Guarantee:** Drop-in replacement, no client changes needed

- All existing API calls work identically
- Response formats unchanged
- No new required fields
- No removed functionality
- Safe to upgrade without testing

### MINOR Releases (x.Y.z)
**Guarantee:** Backward-compatible, existing features unchanged

- All existing API calls work identically
- New endpoints available but not required
- New optional fields may be present in responses
- Deprecated features still functional
- Safe to upgrade, new features optional

### MAJOR Releases (X.y.z)
**Warning:** Breaking changes, migration required

- Existing API calls may fail or behave differently
- Client code changes likely required
- Migration guide provided in CHANGELOG.md
- Deprecation warnings issued in prior MINOR versions when possible
- Thorough testing required before upgrade

---

## Version Increment Rules for GroundCTRL

### Foundation Hardening (Phases 0-4)
Internal improvements without new endpoints warrant PATCH version bumps:
- v1.0.1 - Security hardening, validation, CRUD factory improvements (Checkpoint B)

### Domain-Based Versioning (Phases 5-10)
Each new domain implementation adds backward-compatible endpoints, warranting a MINOR version bump. Per standard SemVer, PATCH resets to 0 when MINOR increments:

| Phase | Domain | Version | Rationale |
|-------|--------|---------|-----------|
| 5 | Satellites | 1.1.0 | New `/api/v1/satellites/*` endpoints (MINOR bump resets PATCH to 0) |
| 6 | Scenarios | 1.2.0 | New `/api/v1/scenarios/*` endpoints |
| 7 | Steps | 1.3.0 | New `/api/v1/scenarios/:id/steps/*` endpoints |
| 8 | Sessions | 1.4.0 | New `/api/v1/sessions/*` endpoints |
| 9 | Commands | 1.5.0 | New `/api/v1/commands/*` endpoints |
| 10 | NOVA AI | 1.6.0 | New `/api/v1/ai/*` endpoints |

### Stabilization (Phase 11+)
Testing, bug fixes, and documentation without new endpoints warrant PATCH version bumps:
- v1.6.1 - Testing and documentation verification (PATCH bump from 1.6.0)

---

## Breaking Change Policy

### What Constitutes a Breaking Change

**API Contract Changes:**
- Endpoint URL changes (renaming, removing)
- HTTP method changes
- Required field additions to requests
- Field removals from responses
- Field type changes (string → number)
- Authentication/authorization changes

**Behavior Changes:**
- Status code changes for existing operations
- Error response format changes
- Validation rule changes (stricter)
- Rate limiting changes (stricter)

### Deprecation Process

Before introducing breaking changes:

1. **Announce deprecation** in MINOR release
   - Mark feature as deprecated in API docs
   - Add deprecation warnings to responses
   - Notify via CHANGELOG.md

2. **Provide alternative** in same MINOR release
   - New endpoint/field available
   - Migration path documented

3. **Maintain backward compatibility** for minimum one MAJOR version
   - Both old and new methods functional
   - Sufficient time for client migration

4. **Remove deprecated feature** in next MAJOR release
   - Full migration guide in CHANGELOG.md
   - Breaking change clearly documented

---

## Version Metadata Storage

### package.json
Single source of truth for version number:
```json
{
  "name": "groundctrl-backend",
  "version": "1.0.1",
  "description": "Mission Control Platform for Satellite Operations Training"
}
```

### Git Tags
Each release tagged with annotated git tag:
- **Format:** `vX.Y.Z` (e.g., `v1.0.1`)
- **Annotation:** Release notes summary
- **Signed:** Optional for security-critical releases

### API Response Headers
Version exposed via response headers:
```
X-API-Version: 1.0.1
```

---

## Dependency Version Constraints

When depending on GroundCTRL Backend API:

**Recommended constraints:**
- **Production:** `~1.0.1` - Accept PATCH updates only
- **Development:** `^1.0.1` - Accept MINOR and PATCH updates
- **Testing:** `1.0.1` - Exact version pinning

**Rationale:**
- PATCH updates are safe drop-in replacements
- MINOR updates require optional feature testing
- MAJOR updates require migration planning

---

## Version History

| Version | Date | Type | Description |
|---------|------|------|-------------|
| 1.0.0 | 2025-12-25 | INITIAL | MVP with authentication and user management |
| 1.0.1 | 2025-12-28 | PATCH | Foundation hardening (security, validation, CRUD) |
| 1.1.0 | 2025-01-02 | MINOR | Satellites domain (new endpoints) |
| 1.2.0 | TBD | MINOR | Scenarios domain (new endpoints) |
| 1.3.0 | TBD | MINOR | Steps domain (new endpoints) |
| 1.4.0 | TBD | MINOR | Sessions domain (new endpoints) |
| 1.5.0 | TBD | MINOR | Commands domain (new endpoints) |
| 1.6.0 | TBD | MINOR | NOVA AI domain (new endpoints) |
| 1.6.1 | TBD | PATCH | Testing and documentation hardening |

---

## Tooling Integration

### NPM Version Command
```bash
# Increment version in package.json and package-lock.json
npm version patch --no-git-tag-version  # x.y.Z+1
npm version minor --no-git-tag-version  # x.Y+1.0
npm version major --no-git-tag-version  # X+1.0.0
```

### Automated Version Checks
CI/CD pipelines should verify:
- Version number increased from base branch
- Version format matches SemVer (X.Y.Z)
- Git tag matches package.json version
- CHANGELOG.md includes version entry

---

## Related Documentation

- **[RELEASE.md](https://github.com/E-Y-J/TR41-GroundCTRL/tree/main/backend/RELEASE.md)** - Release process and GitHub workflows
- **[CHANGELOG.md](https://github.com/E-Y-J/TR41-GroundCTRL/tree/main/backend/CHANGELOG.md)** - Detailed version history and changes
- **[IMPLEMENTATION_PLAN.md](https://github.com/E-Y-J/TR41-GroundCTRL/tree/main/backend/IMPLEMENTATION_PLAN.md)** - Phase-based development plan
- **[Semantic Versioning 2.0.0](https://semver.org)** - Official SemVer specification