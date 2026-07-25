# Hostinger Deployment Guide

## 📋 Deployment Summary

**Frontend:** React + Vite (Hostinger public_html)
**Backend:** Node.js + Express + TypeScript (Hostinger Node Environment)
**Database:** Supabase PostgreSQL (No migration required)

---

## 🎯 Step 1: Frontend Deployment (Hostinger public_html)

### Files to Upload
Upload the contents of `frontend/dist/` folder to your Hostinger `public_html/` directory:

```
public_html/
├── index.html
├── assets/
│   ├── index-CS3P8MBX.js
│   ├── generateCategoricalChart-C6b7xDRY.js
│   ├── Dashboard-vS6qkOXJ.js
│   └── [all other asset files...]
└── vite.svg
```

### Environment Configuration
The frontend is pre-configured with:
- `VITE_API_BASE_URL=https://trigonlink.pakdata.net/api`

No additional environment configuration needed on Hostinger for the frontend.

---

## 🎯 Step 2: Backend Deployment (Hostinger Node Environment)

### Files to Upload
Create a deployment package with the following structure:

```
backend-deployment/
├── dist/                    # Compiled TypeScript (from npm run build)
│   ├── index.js
│   ├── database/
│   ├── middleware/
│   ├── repositories/
│   ├── routes/
│   ├── services/
│   └── utils/
├── src/                    # Source TypeScript files (optional, for reference)
├── package.json             # Dependencies and scripts
├── package-lock.json        # Dependency lock file
├── tsconfig.json           # TypeScript configuration
└── .env                     # Environment variables (create from .env.example)
```

### Important: Exclude from Upload
- `node_modules/` (will be installed on Hostinger)
- `.git/`
- `test-*.js` files
- `create-test-admin.js`
- `trigonzip.zip`

### Environment Variables (.env)
Create `.env` file on Hostinger using the `.env.example` template:

```bash
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

### Deployment Commands on Hostinger

1. **Upload files** to your Node.js application directory
2. **Install dependencies:**
   ```bash
   npm install --production
   ```
3. **Start the application:**
   ```bash
   npm start
   ```
   (This runs: `node dist/index.js`)

### Hostinger Node.js Configuration
Ensure your Hostinger Node.js app is configured with:
- **Node.js Version:** 18.x or higher
- **Start Command:** `npm start`
- **Application Root:** Directory where you uploaded the files

---

## 🔧 CORS Configuration Update

The backend CORS configuration in `src/index.ts` currently allows:
- `https://trigonlinks-pasrur.web.app`
- `https://trigonlink.web.app`
- `http://localhost:5173`
- `http://localhost:3000`

**After deployment, update the CORS origins in `backend/src/index.ts` line 46:**

```typescript
app.use(cors({
  origin: ['https://your-frontend-domain.com', 'https://trigonlink.pakdata.net'],
  credentials: true
}));
```

Replace `your-frontend-domain.com` with your actual Hostinger frontend domain.

---

## ✅ Verification Steps

### Frontend Verification
1. Access your frontend URL in browser
2. Check browser console for any API connection errors
3. Verify API calls are going to `https://trigonlink.pakdata.net/api`

### Backend Verification
1. Check backend health: `https://trigonlink.pakdata.net/health`
2. Should return: `{"status":"ok","timestamp":"..."}`
3. Check Hostinger logs for any startup errors

---

## 🚀 Quick Deployment Checklist

- [ ] Frontend: Upload `frontend/dist/` contents to `public_html/`
- [ ] Backend: Upload deployment package to Hostinger Node.js directory
- [ ] Backend: Create `.env` file with production values
- [ ] Backend: Run `npm install --production`
- [ ] Backend: Run `npm start` to start the application
- [ ] Update CORS origins in backend to allow frontend domain
- [ ] Test frontend → backend API connectivity
- [ ] Verify health endpoint is accessible
- [ ] Test authentication flow
- [ ] Test critical user flows

---

## 📝 Notes

- The backend uses Supabase REST API for all database operations
- No database migration is required (Supabase setup is already in place)
- The backend is compiled to `dist/` folder and runs with `node dist/index.js`
- Frontend is a static build that can be served from any web server
- Both frontend and backend are now independent and can be deployed separately
