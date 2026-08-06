# Production Deployment Checklist
## TrigonLinks ISP ERP System

**Version:** 1.0.0  
**Last Updated:** August 3, 2026

---

## Pre-Deployment Checklist

### Environment Configuration ✅

- [ ] **JWT Secrets Configured**
  - [ ] `JWT_SECRET` set in environment variables (minimum 32 characters, random string)
  - [ ] `JWT_REFRESH_SECRET` set in environment variables (minimum 32 characters, random string)
  - [ ] Secrets are different from each other
  - [ ] Secrets are stored securely (not in code)

- [ ] **Database Configuration**
  - [ ] `SUPABASE_URL` configured
  - [ ] `SUPABASE_SERVICE_ROLE_KEY` configured
  - [ ] `DATABASE_URL` configured (for backup operations)
  - [ ] `DATABASE_HOST` configured
  - [ ] `DATABASE_PORT` configured (default: 5432)
  - [ ] `DATABASE_NAME` configured
  - [ ] `DATABASE_USER` configured
  - [ ] `DATABASE_PASSWORD` configured

- [ ] **Email Configuration (Optional)**
  - [ ] `EMAIL_HOST` configured
  - [ ] `EMAIL_PORT` configured
  - [ ] `EMAIL_USER` configured
  - [ ] `EMAIL_PASS` configured
  - [ ] `EMAIL_FROM` configured
  - [ ] `EMAIL_SECURE` configured

- [ ] **Google Integration (Optional)**
  - [ ] `GOOGLE_CLIENT_ID` configured
  - [ ] `GOOGLE_CLIENT_SECRET` configured
  - [ ] `GOOGLE_REDIRECT_URI` configured

- [ ] **Server Configuration**
  - [ ] `PORT` configured (default: 5000)
  - [ ] `NODE_ENV` set to `production`
  - [ ] `BACKUP_INTERVAL_HOURS` configured (default: 24)

- [ ] **CORS Configuration**
  - [ ] `ALLOWED_ORIGINS` configured if additional origins needed
  - [ ] Production origins verified in code
  - [ ] Development origins removed from production build

---

### Database Preparation ✅

- [ ] **Database Backup**
  - [ ] Full database backup taken before deployment
  - [ ] Backup file stored securely
  - [ ] Backup verified for integrity

- [ ] **Migration Check**
  - [ ] All migration files reviewed
  - [ ] Migration status verified
  - [ ] Pending migrations identified
  - [ ] Rollback plan prepared if migration fails

- [ ] **Schema Verification**
  - [ ] Schema integrity verified
  - [ ] Indexes verified
  - [ ] RLS policies verified
  - [ ] Views and functions verified

---

### Code Preparation ✅

- [ ] **Build Verification**
  - [ ] Backend builds successfully (`npm run build`)
  - [ ] Frontend builds successfully (`npm run build`)
  - [ ] No build warnings or errors
  - [ ] TypeScript compilation successful

- [ ] **Code Review**
  - [ ] No TODO/FIXME comments in production code
  - [ ] No console.log statements in production code
  - [ ] No hardcoded credentials
  - [ ] No placeholder values

- [ ] **Security Review**
  - [ ] Input sanitization enabled
  - [ ] Rate limiting configured
  - [ ] Security headers configured
  - [ ] Authentication working
  - [ ] Authorization working

---

### Testing ✅

- [ ] **Unit Tests**
  - [ ] All unit tests passing
  - [ ] Test coverage acceptable (>80%)

- [ ] **Integration Tests**
  - [ ] API endpoints tested
  - [ ] Database operations tested
  - [ ] External integrations tested

- [ ] **E2E Tests**
  - [ ] Playwright tests passing (141/142)
  - [ ] Critical user flows tested
  - [ ] Error scenarios tested

- [ ] **Performance Tests**
  - [ ] Load testing completed
  - [ ] Response times acceptable
  - [ ] No memory leaks detected

---

### Deployment Infrastructure ✅

- [ ] **Server Setup**
  - [ ] Server resources verified (CPU, RAM, Storage)
  - [ ] Node.js installed (version 18+)
  - [ ] PM2 or process manager configured
  - [ ] SSL certificate configured
  - [ ] Firewall rules configured

- [ ] **Monitoring**
  - [ ] Logging configured
  - [ ] Error tracking configured
  - [ ] Performance monitoring configured
  - [ ] Uptime monitoring configured

- [ ] **Backup System**
  - [ ] Backup directory created
  - [ ] Backup scheduler configured
  - [ ] Backup retention policy set (7 days)
  - [ ] Backup monitoring configured

---

## Deployment Steps

### 1. Deploy Backend

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install --production

# Build the application
npm run build

# Set environment variables
export NODE_ENV=production
export JWT_SECRET=<your-secret>
export JWT_REFRESH_SECRET=<your-refresh-secret>
# ... other environment variables

# Start the application
pm2 start dist/index.js --name trigonlinks-backend
```

### 2. Deploy Frontend

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install --production

# Build the application
npm run build

# Deploy build files to web server
# (e.g., copy dist/ to Nginx/Apache document root)
```

### 3. Verify Deployment

- [ ] Backend health check: `curl http://localhost:5000/health`
- [ ] Frontend accessible via browser
- [ ] Login functionality working
- [ ] Database connectivity verified
- [ ] API endpoints responding

### 4. Post-Deployment Verification

- [ ] Check application logs for errors
- [ ] Verify migrations ran successfully
- [ ] Verify backup scheduler started
- [ ] Test critical user flows
- [ ] Monitor performance metrics

---

## Post-Deployment Checklist

### Monitoring ✅

- [ ] **Application Health**
  - [ ] Server running without errors
  - [ ] Memory usage stable
  - [ ] CPU usage normal
  - [ ] Disk space sufficient

- [ ] **Database Health**
  - [ ] Database connections stable
  - [ ] Query performance normal
  - [ ] No slow queries detected
  - [ ] Backup system working

- [ ] **Security**
  - [ ] No unauthorized access attempts
  - [ ] Rate limiting working
  - [ ] CORS policies enforced
  - [ ] Authentication working

### User Acceptance ✅

- [ ] **Critical Flows**
  - [ ] User login working
  - [ ] Customer management working
  - [ ] Billing operations working
  - [ ] Reports generating correctly

- [ ] **Performance**
  - [ ] Page load times acceptable
  - [ ] API response times acceptable
  - [ ] No timeout errors
  - [ ] No memory leaks

---

## Rollback Procedure

### Immediate Rollback (< 5 minutes)

1. **Stop Application**
   ```bash
   pm2 stop trigonlinks-backend
   ```

2. **Restore Previous Version**
   ```bash
   # Restore previous backend build
   git checkout <previous-commit>
   cd backend
   npm run build
   pm2 restart trigonlinks-backend
   ```

3. **Verify Rollback**
   - [ ] Health check passing
   - [ ] Application accessible
   - [ ] Database connectivity working

### Database Rollback

1. **Stop Application**
   ```bash
   pm2 stop trigonlinks-backend
   ```

2. **Restore Database Backup**
   ```bash
   # Using backup scheduler
   curl -X POST http://localhost:5000/api/backup/restore-file \
     -H "Authorization: Bearer <admin-token>" \
     -H "Content-Type: application/json" \
     -d '{"filePath": "/path/to/backup-file.sql.gz"}'
   ```

3. **Restart Application**
   ```bash
   pm2 start trigonlinks-backend
   ```

4. **Verify Rollback**
   - [ ] Database integrity verified
   - [ ] Data restored correctly
   - [ ] Application working

---

## Emergency Contacts

- **DevOps Lead:** [Contact Information]
- **Database Administrator:** [Contact Information]
- **Security Team:** [Contact Information]

---

## Deployment Sign-Off

**Deployed By:** __________________________  
**Date:** __________________________  
**Version:** __________________________  
**Environment:** __________________________  

**Pre-Deployment Checklist:** [ ] Complete  
**Deployment Steps:** [ ] Complete  
**Post-Deployment Verification:** [ ] Complete  

**Approved for Production:** [ ] Yes [ ] No  

**Notes:** __________________________  
__________________________  
__________________________

---

*This checklist must be completed for every production deployment. Any item marked as incomplete must be resolved before proceeding.*
