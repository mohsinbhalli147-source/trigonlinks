# Build TrigonLinks Customer Android App - APK
# This script builds a release APK for testing/distribution

Write-Host "Building TrigonLinks Customer Android App - Release APK" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Check if Flutter is installed
Write-Host "Checking Flutter installation..." -ForegroundColor Yellow
flutter --version
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Flutter is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

# Navigate to project directory
$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectDir
Write-Host "Project directory: $projectDir" -ForegroundColor Green

# Clean previous builds
Write-Host "Cleaning previous builds..." -ForegroundColor Yellow
flutter clean

# Get dependencies
Write-Host "Getting dependencies..." -ForegroundColor Yellow
flutter pub get

# Build release APK
Write-Host "Building release APK..." -ForegroundColor Yellow
flutter build apk --release

if ($LASTEXITCODE -eq 0) {
    $apkPath = "build\app\outputs\flutter-apk\app-release.apk"
    if (Test-Path $apkPath) {
        Write-Host "================================================" -ForegroundColor Cyan
        Write-Host "Build successful!" -ForegroundColor Green
        Write-Host "APK location: $projectDir\$apkPath" -ForegroundColor Green
        Write-Host "================================================" -ForegroundColor Cyan
    } else {
        Write-Host "Build completed but APK not found at expected location" -ForegroundColor Yellow
    }
} else {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}
