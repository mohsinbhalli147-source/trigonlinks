# Setup TrigonLinks Customer Android App
# This script helps set up the development environment

Write-Host "Setting up TrigonLinks Customer Android App" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# Check Flutter installation
Write-Host "Checking Flutter installation..." -ForegroundColor Yellow
flutter --version
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Flutter is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Flutter from https://flutter.dev/docs/get-started/install" -ForegroundColor Yellow
    exit 1
}

# Check Android SDK
Write-Host "Checking Android SDK..." -ForegroundColor Yellow
flutter doctor -v
if ($LASTEXITCODE -ne 0) {
    Write-Host "Warning: Flutter doctor found issues" -ForegroundColor Yellow
    Write-Host "Please run 'flutter doctor' to see and fix issues" -ForegroundColor Yellow
}

# Navigate to project directory
$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectDir
Write-Host "Project directory: $projectDir" -ForegroundColor Green

# Install Flutter dependencies
Write-Host "Installing Flutter dependencies..." -ForegroundColor Yellow
flutter pub get
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Check local.properties
$localProperties = "android\local.properties"
if (-not (Test-Path $localProperties)) {
    Write-Host "Warning: local.properties not found" -ForegroundColor Yellow
    Write-Host "Please create android\local.properties with your SDK paths:" -ForegroundColor Yellow
    Write-Host "sdk.dir=C:\\Users\\YourUsername\\AppData\\Local\\Android\\Sdk" -ForegroundColor Yellow
    Write-Host "flutter.sdk=C:\\flutter" -ForegroundColor Yellow
}

# Check Firebase configuration
$firebaseConfig = "android\app\google-services.json"
if (-not (Test-Path $firebaseConfig)) {
    Write-Host "Warning: Firebase configuration not found" -ForegroundColor Yellow
    Write-Host "Please place google-services.json in android\app\ directory" -ForegroundColor Yellow
    Write-Host "Get it from Firebase Console after creating your project" -ForegroundColor Yellow
}

# Check keystore configuration
$keystoreTemplate = "android\key.properties.template"
$keystoreConfig = "android\key.properties"
if (-not (Test-Path $keystoreConfig)) {
    if (Test-Path $keystoreTemplate) {
        Write-Host "Keystore template found. Please create key.properties from the template for production builds." -ForegroundColor Yellow
    } else {
        Write-Host "Warning: Keystore configuration not found" -ForegroundColor Yellow
        Write-Host "For production builds, create key.properties from key.properties.template" -ForegroundColor Yellow
    }
}

Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "Setup complete!" -ForegroundColor Green
Write-Host "Run 'flutter run' to start the app" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Cyan
