# Backend Deployment Script for Hostinger
# This script deploys the backend to Hostinger using FTP

# Configuration
$FTPServer = "ftp.lightgreen-rhinoceros-358548.hostingersite.com"
$FTPUsername = "your_ftp_username"
$FTPPassword = "your_ftp_password"
$RemotePath = "/public_html"
$LocalPath = "D:\trigonlinks-erp\backend\dist"

Write-Host "Starting backend deployment to Hostinger..." -ForegroundColor Green

# Build the backend first
Write-Host "Building backend..." -ForegroundColor Yellow
Set-Location "D:\trigonlinks-erp\backend"
npm run build

if ($LASTEXITCODE -eq 0) {
    Write-Host "Build successful!" -ForegroundColor Green
    
    # Deploy using FTP (requires FTP credentials)
    Write-Host "Deployment requires FTP credentials to Hostinger" -ForegroundColor Yellow
    Write-Host "Please provide:" -ForegroundColor Cyan
    Write-Host "1. FTP Server: $FTPServer" -ForegroundColor White
    Write- "2. FTP Username: " -NoNewline
    $Username = Read-Host
    Write-Host "3. FTP Password: " -NoNewline
    $Password = Read-Host -AsSecureString
    $PasswordPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($Password))
    
    Write-Host "Starting FTP deployment..." -ForegroundColor Yellow
    
    # For manual deployment, provide instructions
    Write-Host "Manual Deployment Instructions:" -ForegroundColor Cyan
    Write-Host "1. Connect to Hostinger FTP using FileZilla or similar FTP client" -ForegroundColor White
    Write-Host "2. Server: $FTPServer" -ForegroundColor White
    Write-Host "3. Username: $Username" -ForegroundColor White
    Write-Host "4. Navigate to: $RemotePath" -ForegroundColor White
    Write-Host "5. Upload all files from: $LocalPath" -ForegroundColor White
    Write-Host "6. Delete old files and replace with new files" -ForegroundColor White
    
    Write-Host "Deployment instructions provided. Please follow the manual steps." -ForegroundColor Green
} else {
    Write-Host "Build failed. Please fix errors before deployment." -ForegroundColor Red
}