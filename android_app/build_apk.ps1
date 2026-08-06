# Build TrigonLinks Customer Android App - APK
# This script builds a production debug APK for testing

Write-Host "Building TrigonLinks Customer Android App - Production Debug APK" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

# Check if Flutter is installed
Write-Host "Checking Flutter installation..." -ForegroundColor Yellow
$flutterPath = "C:\flutter\bin\flutter.bat"
if (-not (Test-Path $flutterPath)) {
    Write-Host "Error: Flutter is not installed at $flutterPath" -ForegroundColor Red
    exit 1
}
& $flutterPath --version

# Navigate to project directory
$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $projectDir
Write-Host "Project directory: $projectDir" -ForegroundColor Green

# Set Android SDK path
$env:ANDROID_HOME = "C:\Android\Sdk"
Write-Host "Android SDK path: $env:ANDROID_HOME" -ForegroundColor Green

# Set Java path to Android Studio's JBR
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"
Write-Host "Java path: $env:JAVA_HOME" -ForegroundColor Green

# Clean previous builds
Write-Host "Cleaning previous builds..." -ForegroundColor Yellow
& $flutterPath clean

# Get dependencies
Write-Host "Getting dependencies..." -ForegroundColor Yellow
& $flutterPath pub get

# Build release APK
Write-Host "Building release APK..." -ForegroundColor Yellow
& $flutterPath build apk --debug --flavor production

if ($LASTEXITCODE -eq 0) {
    $apkPath = "build\app\outputs\flutter-apk\app-production-debug.apk"
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
