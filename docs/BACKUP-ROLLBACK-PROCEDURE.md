# Backup and Rollback Procedure
## TrigonLinks ISP ERP System

**Version:** 1.0.0  
**Last Updated:** August 3, 2026

---

## Overview

This document outlines the complete backup and rollback procedures for the TrigonLinks ISP ERP system. The system includes automated backup scheduling, manual backup capabilities, and multiple restore options.

---

## Backup System Architecture

### Components

1. **Backup Scheduler** (`backend/src/services/backup-scheduler.ts`)
   - Automated backup scheduling
   - Configurable backup intervals
   - Backup retention management
   - Backup status tracking

2. **Backup API** (`backend/src/routes/backup.ts`)
   - Manual backup trigger
   - Backup status monitoring
   - Restore operations
   - Backup file management

3. **Backup Storage**
   - Local file system storage (`/backups` directory)
   - Compressed backup files (.gz)
   - JSON fallback backups
   - Database tracking of backup history

---

## Automated Backup Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `BACKUP_INTERVAL_HOURS` | Backup interval in hours | 24 | No |
| `NODE_ENV` | Environment mode | development | No |
| `DATABASE_URL` | PostgreSQL connection string | - | Yes (for pg_dump) |

### Backup Schedule

**Production Mode:**
- Automatic backups run every 24 hours (configurable)
- Backups start immediately on server startup
- Retention period: 7 days
- Old backups automatically cleaned up

**Development Mode:**
- Automatic backups disabled
- Manual backups available via API

---

## Backup Procedures

### 1. Automated Backup (Production)

**Status:** Automatic - No manual intervention required

**Process:**
1. Server starts in production mode
2. Backup scheduler initializes with configured interval
3. Initial backup runs immediately
4. Recurring backups run at configured interval
5. Old backups (older than 7 days) automatically deleted

**Monitoring:**
```bash
# Check backup status via API
curl -X GET http://localhost:5000/api/backup/status \
  -H "Authorization: Bearer <admin-token>"
```

**Expected Output:**
```json
{
  "isRunning": true,
  "recentBackups": [
    {
      "file_path": "/backups/trigonlinks-backup-2026-08-03T10-00-00-000Z.sql.gz",
      "file_size": 5242880,
      "status": "completed",
      "created_at": "2026-08-03T10:00:00.000Z"
    }
  ],
  "backupDirectory": "/backups"
}
```

### 2. Manual Backup

**Trigger via API:**
```bash
curl -X POST http://localhost:5000/api/backup/trigger \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json"
```

**Expected Output:**
```json
{
  "message": "Manual backup completed successfully"
}
```

**Backup File Location:**
- Directory: `/backups` (relative to application root)
- Naming convention: `trigonlinks-backup-<timestamp>.sql.gz`
- Example: `trigonlinks-backup-2026-08-03T10-30-00-000Z.sql.gz`

### 3. Export Backup via API

**Download backup as JSON:**
```bash
curl -X GET http://localhost:5000/api/backup/export \
  -H "Authorization: Bearer <admin-token>" \
  -o backup-$(date +%Y%m%d-%H%M%S).json
```

**Backup Contents:**
- Customers
- Connections
- Invoices
- Payments
- Expenses
- Inventory
- Inventory Transactions
- Logs (last 500 entries)

---

## Restore Procedures

### 1. Restore from Backup File (SQL)

**Prerequisites:**
- Backup file exists in `/backups` directory
- Application has database access
- Admin authentication token

**Restore via API:**
```bash
curl -X POST http://localhost:5000/api/backup/restore-file \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "filePath": "/backups/trigonlinks-backup-2026-08-03T10-00-00-000Z.sql.gz"
  }'
```

**Expected Output:**
```json
{
  "message": "Backup restore completed successfully"
}
```

**Process:**
1. Application validates backup file exists
2. Decompresses backup file if compressed
3. Executes SQL restore using psql
4. Records restore operation in audit log
5. Returns success/failure status

### 2. Restore from JSON Backup

**Restore via API:**
```bash
curl -X POST http://localhost:5000/api/backup/restore \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d @backup-20260803-103000.json
```

**Process:**
1. Application parses JSON backup
2. Iterates through each table
3. Inserts records using Supabase client
4. Logs restore progress
5. Returns success/failure status

### 3. Manual Restore via Command Line

**Using psql (SQL backup):**
```bash
# Decompress if needed
gunzip -c /backups/trigonlinks-backup-2026-08-03T10-00-00-000Z.sql.gz | \
  psql $DATABASE_URL
```

**Using Supabase CLI:**
```bash
supabase db restore -f backup-20260803-103000.sql
```

---

## Rollback Procedures

### Scenario 1: Application Rollback (Code Only)

**Use Case:** Bug introduced in new deployment, database is fine

**Steps:**

1. **Stop Current Version**
   ```bash
   pm2 stop trigonlinks-backend
   ```

2. **Restore Previous Code**
   ```bash
   cd /path/to/application
   git checkout <previous-commit-tag>
   cd backend
   npm install --production
   npm run build
   ```

3. **Restart Application**
   ```bash
   pm2 restart trigonlinks-backend
   ```

4. **Verify Rollback**
   ```bash
   curl http://localhost:5000/health
   ```

**Time Estimate:** 5-10 minutes

### Scenario 2: Database Rollback (Data Only)

**Use Case:** Data corruption or bad migration, code is fine

**Steps:**

1. **Stop Application**
   ```bash
   pm2 stop trigonlinks-backend
   ```

2. **Restore Database Backup**
   ```bash
   # Identify latest good backup
   ls -lt /backups/ | head -5
   
   # Restore via API
   curl -X POST http://localhost:5000/api/backup/restore-file \
     -H "Authorization: Bearer <admin-token>" \
     -H "Content-Type: application/json" \
     -d '{"filePath": "/backups/trigonlinks-backup-<timestamp>.sql.gz"}'
   ```

3. **Restart Application**
   ```bash
   pm2 start trigonlinks-backend
   ```

4. **Verify Data Integrity**
   ```bash
   # Check critical tables
   curl -X GET http://localhost:5000/api/customers \
     -H "Authorization: Bearer <admin-token>"
   ```

**Time Estimate:** 10-30 minutes (depending on database size)

### Scenario 3: Full Rollback (Code + Database)

**Use Case:** Complete system failure, both code and data affected

**Steps:**

1. **Stop Application**
   ```bash
   pm2 stop trigonlinks-backend
   ```

2. **Restore Previous Code**
   ```bash
   cd /path/to/application
   git checkout <previous-commit-tag>
   cd backend
   npm install --production
   npm run build
   ```

3. **Restore Database Backup**
   ```bash
   curl -X POST http://localhost:5000/api/backup/restore-file \
     -H "Authorization: Bearer <admin-token>" \
     -H "Content-Type: application/json" \
     -d '{"filePath": "/backups/trigonlinks-backup-<timestamp>.sql.gz"}'
   ```

4. **Restart Application**
   ```bash
   pm2 start trigonlinks-backend
   ```

5. **Full Verification**
   ```bash
   # Health check
   curl http://localhost:5000/health
   
   # Test authentication
   curl -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@trigonlinks.com","password":"<password>"}'
   
   # Verify data
   curl -X GET http://localhost:5000/api/dashboard/statistics \
     -H "Authorization: Bearer <token>"
   ```

**Time Estimate:** 15-40 minutes

---

## Backup Verification

### Verify Backup Integrity

**Check backup file exists:**
```bash
ls -lh /backups/
```

**Verify backup file size:**
```bash
# Backup should be > 1MB for production database
du -h /backups/trigonlinks-backup-*.sql.gz
```

**Test backup decompression:**
```bash
gunzip -t /backups/trigonlinks-backup-*.sql.gz
```

**Verify backup contents:**
```bash
gunzip -c /backups/trigonlinks-backup-*.sql.gz | head -50
```

### Verify Backup in Database

**Check backup records:**
```sql
SELECT * FROM backups 
ORDER BY created_at DESC 
LIMIT 10;
```

**Expected Columns:**
- `id`: UUID
- `file_path`: Path to backup file
- `file_size`: Size in bytes
- `status`: 'completed' or 'failed'
- `created_at`: Timestamp

---

## Backup Retention Policy

### Default Policy

- **Retention Period:** 7 days
- **Cleanup Schedule:** After each backup
- **Minimum Backups:** Always keep at least 1 backup

### Custom Retention

**Modify retention period in code:**
```typescript
// In backup-scheduler.ts
await this.cleanupOldBackups(backupDir, 7); // Change 7 to desired days
```

**Or via environment variable (future enhancement):**
```bash
export BACKUP_RETENTION_DAYS=14
```

---

## Monitoring and Alerts

### Backup Status Monitoring

**Check backup scheduler status:**
```bash
curl -X GET http://localhost:5000/api/backup/status \
  -H "Authorization: Bearer <admin-token>"
```

**Monitor backup logs:**
```bash
pm2 logs trigonlinks-backend | grep BACKUP
```

### Alert Configuration

**Recommended Alerts:**

1. **Backup Failure Alert**
   - Trigger: Backup returns `success: false`
   - Severity: Critical
   - Action: Immediate investigation

2. **Backup Missing Alert**
   - Trigger: No backup in last 26 hours
   - Severity: High
   - Action: Check backup scheduler

3. **Disk Space Alert**
   - Trigger: Backup directory > 80% full
   - Severity: Medium
   - Action: Clean old backups or increase storage

---

## Disaster Recovery

### Complete System Failure

**Scenario:** Server completely unavailable, backups stored locally

**Recovery Steps:**

1. **Provision New Server**
   - Set up new server with same specifications
   - Install Node.js, PostgreSQL client tools
   - Configure environment variables

2. **Restore Application Code**
   ```bash
   git clone <repository-url>
   cd trigonlinks-erp/backend
   npm install --production
   npm run build
   ```

3. **Restore Database**
   - Copy backup files from backup location (if available)
   - Or restore from offsite backup storage
   - Use restore procedure outlined above

4. **Start Application**
   ```bash
   pm2 start dist/index.js --name trigonlinks-backend
   ```

5. **Verify System**
   - Run health checks
   - Test critical functionality
   - Monitor for 24 hours

**Time Estimate:** 2-4 hours

---

## Best Practices

### Backup Best Practices

1. **Regular Backups**
   - Keep automated backups running
   - Don't disable backup scheduler in production
   - Monitor backup execution logs

2. **Backup Testing**
   - Test restore procedure monthly
   - Verify backup integrity regularly
   - Document any issues

3. **Offsite Storage**
   - Consider storing backups in cloud storage (S3, GCS)
   - Implement backup replication to secondary location
   - Encrypt offsite backups

4. **Backup Security**
   - Restrict backup file access permissions
   - Encrypt sensitive backup data
   - Secure backup API endpoints

### Rollback Best Practices

1. **Test Rollbacks**
   - Practice rollback procedures in staging
   - Document rollback times
   - Identify potential issues

2. **Rollback Decision Tree**
   - Define when to rollback vs. fix forward
   - Get approval for production rollbacks
   - Communicate rollback to stakeholders

3. **Post-Rollback Verification**
   - Thoroughly test after rollback
   - Monitor for 24 hours post-rollback
   - Document rollback lessons learned

---

## Troubleshooting

### Backup Fails

**Symptoms:** Backup returns error, backup file not created

**Possible Causes:**
- Database connection issues
- Insufficient disk space
- Permission issues on backup directory

**Solutions:**
```bash
# Check disk space
df -h

# Check backup directory permissions
ls -ld /backups

# Check database connection
psql $DATABASE_URL -c "SELECT 1"

# Check application logs
pm2 logs trigonlinks-backend
```

### Restore Fails

**Symptoms:** Restore returns error, data not restored

**Possible Causes:**
- Corrupt backup file
- Database schema mismatch
- Permission issues

**Solutions:**
```bash
# Verify backup file integrity
gunzip -t /backups/backup-file.sql.gz

# Check database schema
psql $DATABASE_URL -c "\dt"

# Try alternative restore method
# Use JSON restore if SQL restore fails
```

### Backup Scheduler Not Running

**Symptoms:** No automatic backups, status shows "isRunning": false

**Possible Causes:**
- NODE_ENV not set to production
- Backup scheduler not started
- Application restarted without scheduler

**Solutions:**
```bash
# Check environment
echo $NODE_ENV

# Restart application with correct environment
pm2 restart trigonlinks-backend --update-env

# Manually trigger backup
curl -X POST http://localhost:5000/api/backup/trigger \
  -H "Authorization: Bearer <admin-token>"
```

---

## Contact Information

**For backup/restore issues:**
- **DevOps Team:** [Contact Information]
- **Database Administrator:** [Contact Information]
- **On-Call Engineer:** [Contact Information]

---

*This procedure must be reviewed annually and updated as needed. All changes must be tested in staging before production deployment.*
