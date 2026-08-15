# Backend Deployment Instructions - Hostinger

## Hostinger Par Deploy Karne Ka Tareeqa

### 1. Files Upload Karein
- `backend-deployment` folder ke saare files Hostinger par upload karein
- Files ko `public_html` ya kisi specific folder mein upload karein

### 2. Environment Variables Set Karein
- `env.production.template` file ko copy karke `.env` banaayein
- Apni actual values se replace karein:
  - `DATABASE_HOST`: Apna Supabase database host
  - `DATABASE_PASSWORD`: Apna database password
  - `SUPABASE_URL`: Apna Supabase project URL
  - `SUPABASE_ANON_KEY`: Apna Supabase anon key
  - `SUPABASE_SERVICE_ROLE_KEY`: Apna Supabase service role key
  - `JWT_SECRET`: Strong random string generate karein
  - `JWT_REFRESH_SECRET`: Alag strong random string
  - `EMAIL_USER`, `EMAIL_PASS`: Apna email configuration

### 3. Node.js Install Karein
Hostinger cPanel mein:
- Node.js version select karein (18 ya 20 recommend hai)
- Application setup karein

### 4. Dependencies Install Karein
SSH ya File Manager se:
```bash
npm install --production
```

### 5. Server Start Karein
```bash
npm start
```

Ya agar PM2 use kar rahe hain:
```bash
pm2 start dist/index.js --name trigonlinks-backend
pm2 save
pm2 startup
```

### 6. Port Configuration
- `.env` file mein `PORT=5000` set hai
- Hostinger par port forwarding ya reverse proxy configure karna pad sakta hai
- Ya port ko 3000 ya available port par change karein

### 7. Firewall Check Karein
- Hostinger firewall mein selected port allow karein
- Security groups mein rule add karein

### 8. CORS Configuration Important
Production mein `.env` file mein ye line zaroor hai:
```
ALLOWED_ORIGINS=https://trigonlinks-pasrur.web.app,http://localhost:5173,http://localhost:3000,http://localhost:8080
NODE_ENV=production
```

**NOTE:** The updated CORS configuration now allows Flutter Web development from any localhost port (dynamic ports like http://localhost:60843) automatically. No need to add specific localhost ports to ALLOWED_ORIGINS.

### 9. Database Connection Test
Server start hone ke baad browser mein test karein:
```
https://your-domain.com/health
```
Response: `{"status":"ok","timestamp":"..."}`

### 10. Troubleshooting

**Agar server start nahi ho raha:**
- Node.js version check karein
- Dependencies properly install hain ya nahi
- `.env` file sahi configured hai ya nahi

**Agar CORS error aa raha hai:**
- `ALLOWED_ORIGINS` sahi set hai ya nahi
- Frontend URL sahi hai ya nahi

**Agar database connection fail ho raha hai:**
- Supabase credentials check karein
- Network connectivity test karein
- Supabase IP allowlist mein Hostinger IP add karein

### 11. SSL Certificate
- Hostinger par free SSL enable karein
- HTTPS force karein

### 12. Process Manager (PM2) Setup
Production ke liye PM2 recommend hai:
```bash
npm install -g pm2
pm2 start dist/index.js --name trigonlinks-backend
pm2 monit  # Monitor karein
pm2 logs trigonlinks-backend  # Logs dekhein
```

## Important Notes

- `.env` file ko kabhi public folder mein rakhein nahi
- Strong JWT secrets use karein
- Regular backup lein
- Logs monitor karte rahein
- Security updates regular check karein

## Support
Agar koi issue aaye to:
1. Logs check karein: `pm2 logs trigonlinks-backend`
2. Health check test karein
3. Database connection verify karein
