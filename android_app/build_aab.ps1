# Build TrigonLinks Customer Android App - AAB (App Bundle)
# This script builds a release AAB for Google Play Store

Write-Host "Building TrigonLinks Customer Android App - Release AAB" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Check if Flutter is installed
Write-Host "Checking Flutter installation..." -ForegroundColor Yellow
flutter --version
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Flutter is not installed or not in PATH" -ForegroundColor Red
    exit 1
}

# Check if keystore configuration exists
$keystoreFile = "android\key.properties"
if (-not (Test-Path $keystoreFile)) {
    Write-Host "Warning: Keystore configuration not found at $keystoreFile" -ForegroundColor Yellow
    Write-Host "Using debug signing configuration" -ForegroundColor Yellow
    Write-Host "For production, create key.properties from key.properties.template" -ForegroundColor Yellow
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

# Build release AAB
Write-Host "Building release AAB..." -ForegroundColor Yellow
flutter build appbundle --release

if ($LASTEXITCODE -eq 0) {
    $aabPath = "build\app\outputs\bundle\release\app-release.aab"
    if (Test-Path $aabPath) {
        Write-Host "================================================" -ForegroundColor Cyan
        Write-Host "Build successful!" -ForegroundColor Green
        Write-Host "AAB location: $projectDir\$aabPath" -ForegroundColor Green
        Write-Host "================================================" -ForegroundColor Cyan
        Write-Host "Upload this AAB to Google Play Console" -ForegroundColor Yellow
    } else {
        Write-Host "Build completed but AAB not found at expected location" -ForegroundColor Yellow
    }
} else {
    Write-Host "Build failed!" -ForegroundColor Red
    exit 1
}
