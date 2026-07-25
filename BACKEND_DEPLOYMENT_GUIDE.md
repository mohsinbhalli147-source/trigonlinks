# Backend Deployment Guide - Trigonlinks ERP

## 📋 Backend Architecture Summary

**Tech Stack:**
- **Runtime:** Node.js (18.x+)
- **Framework:** Express.js
- **Language:** TypeScript (compiled to JavaScript)
- **Database:** Supabase PostgreSQL (via REST API)
- **Authentication:** JWT (jsonwebtoken)
- **Security:** Helmet, CORS, Rate Limiting, Input Sanitization

**Port Configuration:**
- Default: 5000 (configurable via PORT env variable)

**Build & Start Commands:**
- Build: `npm run build` (TypeScript compilation)
- Start: `npm start` (runs `node dist/index.js`)
- Dev: `npm run dev` (development with hot reload)

---

## 🎯 Recommended Deployment Platforms

Based on the tech stack and requirements, here are the recommended platforms:

### 1. **Hostinger VPS (Recommended)**
**Why:** Full control, Node.js support, cost-effective, same provider as frontend

**Requirements:**
- VPS with 1GB+ RAM
- Ubuntu 20.04+ or similar
- Node.js 18.x installed
- PM2 for process management

**Pros:**
- Full server control
- Easy integration with frontend on same provider
- Cost-effective (~$5-10/month)
- Direct SSH access
- Can run multiple services

**Cons:**
- Requires manual setup
- Need to manage updates/security

### 2. **Render (Alternative)**
**Why:** Easy deployment, automatic SSL, free tier available

**Requirements:**
- Render account
- Connect GitHub repository

**Pros:**
- Zero-config deployment
- Automatic SSL
- Built-in monitoring
- Free tier available
- Auto-deploys on git push

**Cons:**
- Limited control
- Cold starts on free tier
- Potential latency from frontend

### 3. **Railway (Alternative)**
**Why:** Simple deployment, good for Node.js apps

**Requirements:**
- Railway account
- Connect GitHub repository

**Pros:**
- Easy setup
- Built-in database options
- Good documentation
- Reasonable pricing

**Cons:**
- Newer platform
- Less mature than Render

---

## 🚀 Deployment Instructions

### Option 1: Hostinger VPS Deployment

#### Step 1: Prepare VPS
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Create application directory
mkdir -p /var/www/trigonlinks-backend
cd /var/www/trigonlinks-backend
```

#### Step 2: Upload & Extract
```bash
# Upload backend-deployment-hostinger.tar.gz to VPS
# Then extract:
tar -xzf backend-deployment-hostinger.tar.gz
```

#### Step 3: Install Dependencies
```bash
npm install --production
```

#### Step 4: Configure Environment Variables
Create `.env` file:
```bash
nano .env
```

Add the following (replace with actual values):
```env
PORT=5000
# PostgreSQL Database (Supabase)
DATABASE_HOST=your-project.supabase.co
DATABASE_PORT=5432
DATABASE_NAME=postgres
DATABASE_USER=postgres
DATABASE_PASSWORD=your-database-password
DATABASE_POOL_MAX=20
DATABASE_IDLE_TIMEOUT=30000
DATABASE_CONNECTION_TIMEOUT=2000
# Supabase Keys
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
# JWT Secrets
JWT_SECRET=your-jwt-secret-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key-change-in-production
NODE_ENV=production
```

#### Step 5: Start with PM2
```bash
# Start application
pm2 start dist/index.js --name trigonlinks-backend

# Configure PM2 to start on boot
pm2 startup
pm2 save

# View logs
pm2 logs trigonlinks-backend

# Monitor
pm2 monit
```

#### Step 6: Setup Nginx Reverse Proxy (Optional but Recommended)
```bash
sudo apt install nginx

# Configure Nginx
sudo nano /etc/nginx/sites-available/trigonlinks-backend
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name trigonlink.pakdata.net;

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/trigonlinks-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Step 7: Setup SSL with Certbot (Optional but Recommended)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d trigonlink.pakdata.net
```

---

### Option 2: Render Deployment

#### Step 1: Prepare Repository
Push your code to GitHub (ensure `.env` is in `.gitignore`)

#### Step 2: Create Render Service
1. Go to [render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name:** trigonlinks-backend
   - **Region:** Choose nearest to your users
   - **Branch:** main
   - **Runtime:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Instance Type:** Free (or paid for better performance)

#### Step 3: Add Environment Variables
In Render dashboard, add these environment variables:
```
PORT=5000
DATABASE_HOST=your-project.supabase.co
DATABASE_PORT=5432
DATABASE_NAME=postgres
DATABASE_USER=postgres
DATABASE_PASSWORD=your-database-password
DATABASE_POOL_MAX=20
DATABASE_IDLE_TIMEOUT=30000
DATABASE_CONNECTION_TIMEOUT=2000
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-jwt-secret-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key-change-in-production
NODE_ENV=production
```

#### Step 4: Deploy
Render will automatically deploy. You'll get a URL like:
`https://trigonlinks-backend.onrender.com`

#### Step 5: Update Frontend API URL
Update frontend `.env` to point to Render URL:
```
VITE_API_BASE_URL=https://trigonlinks-backend.onrender.com/api
```

---

### Option 3: Railway Deployment

#### Step 1: Create Railway Account
Go to [railway.app](https://railway.app) and sign up

#### Step 2: Create New Project
1. Click "New Project"
2. Select "Deploy from GitHub repo"
3. Choose your repository

#### Step 3: Configure Service
Railway will auto-detect Node.js. Configure:
- **Build Command:** `npm install && npm run build`
- **Start Command:** `npm start`

#### Step 4: Add Environment Variables
In Railway dashboard, add the same environment variables as above

#### Step 5: Deploy
Railway will provide a URL. Update frontend to use this URL.

---

## 🔐 Required Environment Variables

### Database Configuration
- `PORT` - Server port (default: 5000)
- `DATABASE_HOST` - Supabase database host
- `DATABASE_PORT` - Database port (5432)
- `DATABASE_NAME` - Database name (postgres)
- `DATABASE_USER` - Database user
- `DATABASE_PASSWORD` - Database password
- `DATABASE_POOL_MAX` - Connection pool max (20)
- `DATABASE_IDLE_TIMEOUT` - Idle timeout (30000)
- `DATABASE_CONNECTION_TIMEOUT` - Connection timeout (2000)

### Supabase Configuration
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (admin access)

### Security Configuration
- `JWT_SECRET` - Secret key for JWT token signing
- `JWT_REFRESH_SECRET` - Secret key for refresh tokens
- `NODE_ENV` - Environment (production)

---

## ✅ Verification Steps

### 1. Health Check
```bash
curl https://your-backend-url/health
```
Should return: `{"status":"ok","timestamp":"..."}`

### 2. API Test
```bash
curl https://your-backend-url/api/auth/test
```

### 3. Frontend Integration
- Open frontend at https://trigonlink.pakdata.net
- Try to login
- Check browser console for API errors
- Check network tab for API calls

### 4. CORS Verification
Ensure API calls from https://trigonlink.pakdata.net are successful without CORS errors.

---

## 📦 Deployment Archive Contents

**File:** `backend-deployment-hostinger.tar.gz` (222 KB)

**Contents:**
- `dist/` - Compiled JavaScript (ready to run)
- `src/` - TypeScript source (for reference)
- `package.json` - Dependencies and scripts
- `package-lock.json` - Dependency lock file
- `tsconfig.json` - TypeScript configuration
- `.env.example` - Environment variable template
- `scripts/` - Utility scripts
- `Dockerfile` - Docker configuration (optional)

**Excluded:**
- `node_modules/` (will be installed on server)
- Test files
- Development files

---

## 🔧 Troubleshooting

### Port Already in Use
```bash
# Find process using port 5000
sudo lsof -i :5000
# Kill process
sudo kill -9 <PID>
```

### PM2 Issues
```bash
# Restart app
pm2 restart trigonlinks-backend

# Stop app
pm2 stop trigonlinks-backend

# Delete app
pm2 delete trigonlinks-backend

# View logs
pm2 logs trigonlinks-backend
```

### Database Connection Issues
- Verify Supabase credentials
- Check Supabase project status
- Ensure IP whitelist allows server IP
- Test connection manually

### CORS Errors
- Verify CORS settings in `src/index.ts`
- Ensure frontend URL is in allowed origins
- Check that credentials are enabled

---

## 🎯 Deployment Checklist

- [ ] Choose deployment platform (Hostinger VPS recommended)
- [ ] Upload deployment archive to server
- [ ] Install Node.js dependencies (`npm install --production`)
- [ ] Configure all environment variables
- [ ] Start application with PM2
- [ ] Setup reverse proxy (Nginx) if using VPS
- [ ] Configure SSL certificate
- [ ] Test health endpoint
- [ ] Test API endpoints
- [ ] Verify frontend connectivity
- [ ] Monitor logs for errors
- [ ] Setup monitoring/alerting

---

## 📝 Notes

- Backend uses Supabase REST API for all database operations
- No database migration required (Supabase already configured)
- CORS is configured to allow https://trigonlink.pakdata.net
- Application includes rate limiting and security middleware
- Graceful shutdown handling is implemented
- Health check endpoint available at `/health`

---

## 🆘 Support

If you encounter issues:
1. Check application logs: `pm2 logs trigonlinks-backend`
2. Verify environment variables are set correctly
3. Test database connection manually
4. Check firewall/security group settings
5. Ensure Node.js version is 18.x or higher
