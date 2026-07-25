# Northflank Deployment Instructions

## Prerequisites
- Northflank account
- Supabase project with PostgreSQL database
- Production environment variables configured

## Deployment Steps

### 1. Create a New Service in Northflank

1. Log in to your Northflank dashboard
2. Click "Create Service" → "Combined Service"
3. Choose "Dockerfile" as the build type

### 2. Configure Build Settings

**Repository:**
- Connect your Git repository (GitHub/GitLab/Bitbucket)
- Select the `trigonlinks-erp` repository
- Working directory: `backend`

**Dockerfile:**
- Path: `Dockerfile` (in the backend directory)
- Context: `backend`

**Build Arguments:** (None required)

### 3. Configure Environment Variables

Add the following environment variables in Northflank:

```
PORT=5000
NODE_ENV=production
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
JWT_SECRET=your-production-jwt-secret-min-32-chars
JWT_REFRESH_SECRET=your-production-refresh-secret-min-32-chars
```

**IMPORTANT:** Replace all placeholder values with your actual production credentials.

### 4. Configure Resources

**CPU:** 0.5 - 1 vCPU (minimum)
**RAM:** 512MB - 1GB (minimum)
**Replicas:** 1 (can scale up based on traffic)

### 5. Configure Ports

- **Internal Port:** 5000
- **External Port:** 80 (HTTP) or 443 (HTTPS)
- **Protocol:** TCP

### 6. Configure Health Check

Northflank will use the health check defined in the Dockerfile:
- **Endpoint:** `/health`
- **Interval:** 30s
- **Timeout:** 3s
- **Start Period:** 40s

### 7. Deploy

1. Click "Create Service"
2. Northflank will build and deploy your application
3. Monitor the logs for any errors

### 8. Get Your Backend URL

After deployment, Northflank will provide:
- A service URL (e.g., `https://your-service.northflank.com`)
- Or a custom domain if configured

**This is your production backend URL.**

### 9. Update Frontend Configuration

Update the frontend `.env` file with the new backend URL:
```
VITE_API_BASE_URL=https://your-backend-url.northflank.com
```

### 10. Verify Deployment

Check the health endpoint:
```bash
curl https://your-backend-url.northflank.com/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Security Notes

1. **Never commit** `.env` or `.env.production` to Git
2. Use strong, random JWT secrets (minimum 32 characters)
3. Enable HTTPS for all connections
4. Regularly rotate secrets and credentials
5. Monitor logs for suspicious activity

## Troubleshooting

### Build Failures
- Check Dockerfile is in the correct location
- Verify `npm run build` completed successfully locally
- Check Node.js version compatibility (using Node 20)

### Runtime Errors
- Check environment variables are correctly set
- Verify Supabase database is accessible
- Check database connection string format

### Database Connection Issues
- Verify Supabase project is active
- Check IP whitelist (if enabled)
- Verify database credentials

## Scaling

For production with 50-100 concurrent users:
- **CPU:** 1-2 vCPU
- **RAM:** 1-2GB
- **Replicas:** 2-3 (for high availability)

## Monitoring

Northflank provides:
- Real-time logs
- Metrics (CPU, RAM, Network)
- Alerting
- Auto-scaling options

Configure alerts for:
- High CPU usage (>80%)
- High RAM usage (>80%)
- Service downtime
- Error rate spikes
