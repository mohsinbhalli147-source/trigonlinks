# Backend Deployment Guide - TrigonLinks ERP

## Quick Deployment Options

### Option 1: Render (Recommended - Free Automatic Deployment)

1. **Create Render Account:**
   - Go to https://render.com
   - Sign up for free account

2. **Connect GitHub:**
   - Link your GitHub account
   - Import this repository

3. **Create Web Service:**
   - Click "New +"
   - Select "Web Service"
   - Connect your GitHub repository
   - Root directory: `backend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Environment Variables: Add from your current Render backend configuration

4. **Add Environment Variables:**
   - PORT: 5000
   - NODE_ENV: production
   - SUPABASE_URL: (your Supabase URL)
   - SUPABASE_ANON_KEY: (your Supabase anon key)
   - SUPABASE_SERVICE_ROLE_KEY: (your Supabase service role key)
   - JWT_SECRET: (your JWT secret)
   - JWT_REFRESH_SECRET: (your JWT refresh secret)

5. **Deploy:**
   - Click "Create Web Service"
   - Render will automatically build and deploy

### Option 2: Hostinger (Manual Deployment)

1. **Build Backend:**
   ```bash
   cd backend
   npm install
   npm run build
   ```

2. **Upload to Hostinger:**
   - Open FileZilla or any FTP client
   - Connect to your Hostinger FTP account
   - Navigate to `public_html` folder
   - Upload all files from `backend/dist` folder
   - Replace old files with new files

3. **Configure Environment Variables:**
   - Go to Hostinger Control Panel
   - Navigate to File Manager
   - Create `.env` file in backend directory
   - Add your environment variables

### Option 3: Using Deployment Script

Run the PowerShell script:
```powershell
.\deploy-backend.ps1
```

This will:
- Build the backend
- Provide FTP deployment instructions
- Guide you through the process

## Current Configuration

- **Backend URL:** https://lightgreen-rhinoceros-358548.hostingersite.com
- **Frontend URL:** https://trigonlinks-pasrur.web.app
- **Build Output:** `backend/dist/`

## Verification

After deployment, test:
1. Backend health check: https://lightgreen-rhinoceros-358548.hostingersite.com/health
2. API endpoints: https://lightgreen-rhinoceros-358548.hostingersite.com/api/auth/login
3. Invoice creation: Try creating an invoice from frontend

## Notes

- Render provides free automatic deployment with SSL
- Hostinger requires manual FTP upload
- Both options will work for production
- Ensure environment variables are properly configured before deployment