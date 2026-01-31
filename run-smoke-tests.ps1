#!/usr/bin/env pwsh
# Run smoke tests with Firebase emulators

Write-Host "🚀 Starting Firebase Emulators and running smoke tests..." -ForegroundColor Cyan

# Ensure we're in the project root
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

# Verify firebase.json exists
if (-not (Test-Path "firebase.json")) {
    Write-Host "❌ ERROR: firebase.json not found. Please run from project root." -ForegroundColor Red
    exit 1
}

Write-Host "✓ Running from project root: $PWD" -ForegroundColor Green

# Run smoke tests with emulators
Write-Host "`n📋 Running smoke tests..." -ForegroundColor Yellow
firebase emulators:exec --only auth,firestore "cd backend && npm test tests/smoke.test.js"

$exitCode = $LASTEXITCODE
if ($exitCode -eq 0) {
    Write-Host "`n✅ Smoke tests PASSED!" -ForegroundColor Green
} else {
    Write-Host "`n❌ Smoke tests FAILED with exit code: $exitCode" -ForegroundColor Red
}

exit $exitCode
