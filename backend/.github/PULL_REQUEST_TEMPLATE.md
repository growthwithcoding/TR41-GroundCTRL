# Pull Request: Backend Phase X - [Brief Description]

<!-- 
Replace "X" with the phase number and provide a brief description.
Example: "Backend Pull Request: Phase 6 - Satellites Domain Implementation"
-->

## Phase Information

**Phase Number:** <!-- e.g., Backend Phase 6 -->  
**Phase Name:** <!-- e.g., Satellites Domain Implementation -->  
**Reference:** [IMPLEMENTATION_PLAN.md](../IMPLEMENTATION_PLAN.md#phase-x)

---

## Summary

<!-- Provide a clear summary of what this phase implements -->

### What Changed
<!-- List the main changes -->
- 
- 
- 

### Why These Changes
<!-- Explain the reasoning/goals for this phase -->


---

## Prerequisites Verification

<!-- Confirm all prerequisite phases are complete -->

- [ ] All prerequisite phases are **DONE** (check IMPLEMENTATION_PLAN.md)
- [ ] No dependencies on incomplete phases
- [ ] This PR contains changes for **ONLY THIS PHASE** (no cross-phase modifications)

**Prerequisite Phases:** <!-- List any phases this depends on, or write "None" -->


---

## Implementation Checklist

### Code
- [ ] All planned features/endpoints implemented
- [ ] Code follows project standards (see CONTRIBUTING.md)
- [ ] Identity policy enforced (uid-based, callSign non-unique)
- [ ] CRUD factory used appropriately (if applicable)
- [ ] Error handling implemented correctly
- [ ] Logging added for key operations

### Testing
- [ ] Manual verification completed (code runs without errors)
- [ ] Basic smoke testing completed locally
- [ ] `npm run lint` passes without errors
- [ ] Existing tests still pass (if applicable)
- [ ] QA Team notified via Slack with PR details
- [ ] Cybersecurity Team notified (if auth/security/API changes)

### Documentation
- [ ] Code comments added for complex logic
- [ ] JSDoc comments for public functions
- [ ] Swagger/OpenAPI documentation updated
- [ ] CHANGELOG.md updated (in `[Unreleased]` section)
- [ ] README.md updated (if needed)
- [ ] ARCHITECTURE.md updated (if structural changes)

### Quality Checks
- [ ] `npm run lint` passes without errors
- [ ] Code is clean and maintainable
- [ ] No console.log or debug code left in
- [ ] No commented-out code blocks
- [ ] Environment variables properly configured (if new ones added)

---

## Files Changed

<!-- List key files modified/added. GitHub will show full diff, but highlight important ones here -->

**New Files:**
- 
- 

**Modified Files:**
- 
- 

**Deleted Files:**
- 

---

## Breaking Changes

<!-- Are there any breaking changes? If yes, describe them. If no, write "None" -->

- [ ] This PR includes breaking changes
- [ ] This PR does NOT include breaking changes

**Details:** <!-- If breaking changes, explain what breaks and migration path -->


---

## Testing Instructions

<!-- How should reviewers test this? -->

### Setup
```bash
# Any special setup needed?
```

### Manual Testing
1. 
2. 
3. 

### Expected Results
<!-- What should reviewers see when testing? -->


---

## Screenshots/Examples

<!-- If applicable, add screenshots, API response examples, or Swagger UI screenshots -->

### API Request Example
```json
// Example request
```

### API Response Example
```json
// Example response
```

---

## Security Considerations

<!-- Any security implications? Authentication/authorization changes? -->

- [ ] No new security considerations
- [ ] New security considerations documented below

**Details:**


---

## Performance Considerations

<!-- Any performance implications? Database queries? Heavy operations? -->

- [ ] No performance concerns
- [ ] Performance considerations documented below

**Details:**


---

## Deployment Notes

<!-- Anything special needed for deployment? Database migrations? Environment variables? -->

- [ ] No special deployment steps required
- [ ] Special deployment steps documented below

**Required:**
- Environment variables: 
- Database migrations: 
- Other: 

---

## Reviewer Notes

<!-- Any specific areas you want reviewers to focus on? Questions for reviewers? -->


---

## Phase Completion Checklist

After this PR is merged, the following should be updated:

- [ ] Update IMPLEMENTATION_PLAN.md phase status to **DONE**
- [ ] Add entry to Phase Execution Log in IMPLEMENTATION_PLAN.md
- [ ] Delete the feature branch
- [ ] Notify team of completion
- [ ] Consider if release checkpoint is reached (see VERSIONING.md)

---

## Related Issues

<!-- Link any related issues, discussions, or previous PRs -->

Closes # <!-- issue number if applicable -->
Related to # <!-- other PR/issue numbers -->

---

## Checklist for Reviewers

**For Reviewers: Please verify the following before approving**

### Phase Compliance
- [ ] Changes are within the stated phase scope only
- [ ] No cross-phase modifications
- [ ] Prerequisites were properly satisfied
- [ ] Identity policy is followed (uid-based, callSign non-unique)

### Code Quality
- [ ] Code is clear and maintainable
- [ ] Follows project coding standards
- [ ] Error handling is appropriate
- [ ] No security vulnerabilities introduced

### Testing
- [ ] Developer has completed manual verification
- [ ] Linting passes
- [ ] QA Team has been notified and will create tests
- [ ] Cybersecurity Team notified (if applicable)

### Documentation
- [ ] Code is properly documented
- [ ] API documentation (Swagger) is complete and accurate
- [ ] CHANGELOG.md properly updated

---

**Reviewer Approval:**
- [ ] Code reviewed and approved by at least 1 backend developer
- [ ] All requested changes addressed

---

<!-- 
Remember: 
- Keep PRs focused on ONE phase only
- Ensure all tests pass before requesting review
- Update documentation as you code, not as an afterthought
- Follow the identity policy (uid-based, callSign non-unique)
- Use CRUD factory where appropriate
-->

**Thank you for contributing to GroundCTRL!** 🛰️
