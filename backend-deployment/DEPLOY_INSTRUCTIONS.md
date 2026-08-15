# CORS Fix Deployment Instructions for Hostinger

## Summary
The CORS configuration has been updated to allow Flutter Web development from any localhost port (dynamic ports). The backend code has been rebuilt and the deployment files are ready.

## Changes Made
1. **Backend CORS Configuration** (`backend/src/index.ts`):
   - Added support for `http://localhost:*` (any port)
   - Added support for `http://127.0.0.1:*` (any port)
   - Updated both CORS middleware and OPTIONS preflight handler

2. **Files Updated in `backend-deployment/`**:
   - `dist/` folder - Rebuilt with CORS fix
   - `package.json` - Updated to match backend
   - `package-lock.json` - Updated to match backend
   - `env.production.template` - Updated ALLOWED_ORIGINS
   - `DEPLOYMENT.md` - Updated CORS instructions

## Deployment Steps

### Option 1: Via Hostinger File Manager (Recommended)

1. **Access Hostinger File Manager**
   - Log in to Hostinger cPanel
   - Open File Manager
   - Navigate to your backend directory (usually `public_html` or a subfolder)

2. **Backup Current Files**
   - Select and download current `dist/` folder as backup
   - Download current `package.json` and `package-lock.json`

3. **Upload Updated Files**
   - Upload entire `dist/` folder from `backend-deployment/dist/`
   - Upload `package.json` from `backend-deployment/`
   - Upload `package-lock.json` from `backend-deployment/`

4. **Update Environment Variables**
   - Edit `.env` file in your backend directory
   - Update `ALLOWED_ORIGINS` line to:
     ```
     ALLOWED_ORIGINS=https://trigonlinks-pasrur.web.app,http://localhost:5173,http://localhost:3000,http://localhost:8080
     ```

5. **Restart the Server**
   - If using PM2:
     ```bash
     pm2 restart trigonlinks-backend
     ```
   - Or if running directly:
     ```bash
     # Stop current process
     pkill -f "node dist/index.js"
     # Start new process
     npm start
     ```

### Option 2: Via SSH

1. **Connect to Hostinger via SSH**
   ```bash
   ssh your-user@your-hostinger-domain
   ```

2. **Navigate to backend directory**
   ```bash
   cd public_html  # or your backend directory
   ```

3. **Backup current deployment**
   ```bash
   cp -r dist dist.backup
   cp package.json package.json.backup
   ```

4. **Upload new files**
   - Use SCP to upload from local:
     ```bash
     # From your local machine
     scp -r D:\trigonlinks-erp\backend-deployment\dist\* your-user@your-hostinger-domain:public_html/dist/
     scp D:\trigonlinks-erp\backend-deployment\package.json your-user@your-hostinger-domain:public_html/
     scp D:\trigonlinks-erp\backend-deployment\package-lock.json your-user@your-hostinger-domain:public_html/
     ```

5. **Update .env file**
   ```bash
   nano .env
   # Update ALLOWED_ORIGINS line
   # Save and exit (Ctrl+X, Y, Enter)
   ```

6. **Restart server**
   ```bash
   pm2 restart trigonlinks-backend
   # or
   npm start
   ```

## Verification

After deployment, test the CORS configuration:

### Test 1: Health Check
```bash
curl https://lightgreen-rhinoceros-358548.hostingersite.com/health
```
Expected: `{"status":"ok","timestamp":"..."}`

### Test 2: OPTIONS Preflight (from your local machine)
```powershell
$headers = @{"Origin" = "http://localhost:60843"; "Access-Control-Request-Method" = "POST"; "Access-Control-Request-Headers" = "content-type"}
Invoke-WebRequest -Uri "https://lightgreen-rhinoceros-358548.hostingersite.com/api/auth/customer-login" -Method OPTIONS -Headers $headers
```

Expected response should include:
- `Access-Control-Allow-Origin: http://localhost:60843`
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With`

### Test 3: Flutter Web Login
1. Start Flutter Web: `flutter run -d edge`
2. Try to login from the Flutter Web app
3. Should work without CORS errors

## Troubleshooting

**If CORS error still occurs:**
1. Check that the new `dist/index.js` file was uploaded (check file modification time)
2. Verify `.env` file has updated ALLOWED_ORIGINS
3. Check PM2 logs: `pm2 logs trigonlinks-backend`
4. Ensure server was actually restarted
5. Clear browser cache and retry

**If server won't start:**
1. Check Node.js version (should be 18+)
2. Reinstall dependencies: `npm install --production`
3. Check `.env` file syntax
4. Check error logs in PM2

## What the Fix Does

The updated CORS configuration now:
- ✅ Allows any `http://localhost:*` origin (Flutter Web dynamic ports)
- ✅ Allows any `http://127.0.0.1:*` origin
- ✅ Still allows configured production origins
- ✅ Still allows mobile apps (no origin header)
- ✅ Properly handles OPTIONS preflight requests
- ✅ No need to hardcode specific localhost ports

This means Flutter Web will work regardless of which port the dev server chooses (60843, 12345, etc.).
