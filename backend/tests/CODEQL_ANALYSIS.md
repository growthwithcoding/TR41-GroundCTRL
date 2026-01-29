# CodeQL Security Analysis

## Overview

CodeQL is GitHub's semantic code analysis engine that helps identify security vulnerabilities and coding errors in the GroundCTRL codebase.

## Configuration

### Automatic Analysis
- **File**: [`.github/workflows/codeql-analysis.yml`](../.github/workflows/codeql-analysis.yml)
- **Languages**: JavaScript/TypeScript
- **Triggers**: Push to main/sprint2tests, Pull requests, Weekly schedule
- **Queries**: Security and quality queries

### Features
- ✅ **Explicit CLI Version**: Specifies CodeQL CLI version 2.24.0 to avoid version warnings
- ✅ **Proper Permissions**: Includes `security-events: write` for SARIF upload
- ✅ **Comprehensive Analysis**: Uses security-and-quality query suite
- ✅ **Dependency Installation**: Installs both backend and frontend dependencies for complete analysis

### Security Permissions

All workflow files now include the required permission:
```yaml
permissions:
  security-events: read  # Required for CodeQL integration
```

This resolves the "Resource not accessible by integration" error.

## Results

CodeQL results are available in:
- **GitHub Security tab**: Repository security advisories and alerts
- **Pull Request checks**: Inline security feedback on PRs
- **SARIF artifacts**: Detailed analysis results for download

## Troubleshooting

### Common Issues Fixed
1. ✅ **CLI Version Warning**: Explicitly specify `tools: 2.24.0`
2. ✅ **Permission Errors**: Added `security-events: write` permission
3. ✅ **Fork Limitations**: Analysis runs on repository (not fork) events

### Manual Triggers
```bash
# Trigger CodeQL analysis manually via GitHub API
gh workflow run "CodeQL Analysis" --ref main
```

## Integration with Testing

CodeQL complements the existing test suite:
- **Unit/Integration Tests**: Functional correctness
- **CodeQL Analysis**: Security vulnerabilities and code quality
- **Combined Coverage**: Comprehensive codebase validation