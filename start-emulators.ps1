# Start Firebase Emulators
Write-Host "Starting Firebase emulators from: $PWD" -ForegroundColor Cyan

# Verify firebase.json exists
if (-not (Test-Path "firebase.json")) {
    Write-Host "ERROR: firebase.json not found in current directory" -ForegroundColor Red
    Write-Host "Please run this script from the project root" -ForegroundColor Red
    exit 1
}

Write-Host "✓ firebase.json found" -ForegroundColor Green

# Start emulators
Write-Host "Starting emulators (Auth:9099, Firestore:8080)..." -ForegroundColor Yellow
firebase emulators:start --only auth,firestore
