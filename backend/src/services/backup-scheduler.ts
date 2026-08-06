import { logger } from '../utils/logger';
import { getSupabaseClient } from '../database/client';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class BackupScheduler {
  private supabase: any;
  private backupInterval: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  constructor() {
    this.supabase = getSupabaseClient();
  }

  /**
   * Start automated backup scheduler
   * @param intervalHours - Backup interval in hours (default: 24 for daily backups)
   */
  start(intervalHours: number = 24): void {
    if (this.isRunning) {
      logger.warn('[BACKUP] Backup scheduler is already running');
      return;
    }

    this.isRunning = true;
    const intervalMs = intervalHours * 60 * 60 * 1000;

    logger.info(`[BACKUP] Starting automated backup scheduler (interval: ${intervalHours} hours)`);

    // Run initial backup
    this.runBackup();

    // Schedule recurring backups
    this.backupInterval = setInterval(() => {
      this.runBackup();
    }, intervalMs);
  }

  /**
   * Stop automated backup scheduler
   */
  stop(): void {
    if (this.backupInterval) {
      clearInterval(this.backupInterval);
      this.backupInterval = null;
      this.isRunning = false;
      logger.info('[BACKUP] Backup scheduler stopped');
    }
  }

  /**
   * Run a single backup operation
   */
  async runBackup(): Promise<boolean> {
    try {
      logger.info('[BACKUP] Starting backup operation...');

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupFileName = `trigonlinks-backup-${timestamp}.sql`;
      const backupDir = path.join(process.cwd(), 'backups');
      
      // Ensure backup directory exists
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      const backupPath = path.join(backupDir, backupFileName);

      // Use pg_dump for PostgreSQL backup via Supabase connection string
      const databaseUrl = process.env.DATABASE_URL || 
        `postgresql://${process.env.DATABASE_USER}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${process.env.DATABASE_NAME}`;

      const command = `pg_dump "${databaseUrl}" > "${backupPath}"`;

      try {
        await execAsync(command);
        
        // Compress the backup file
        const compressedPath = `${backupPath}.gz`;
        await execAsync(`gzip "${backupPath}"`);

        const stats = fs.statSync(compressedPath);
        logger.info(`[BACKUP] Backup completed successfully: ${compressedPath} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);

        // Clean up old backups (keep last 7 days)
        await this.cleanupOldBackups(backupDir, 7);

        // Record backup in database
        await this.recordBackup(compressedPath, stats.size);

        return true;
      } catch (execError: any) {
        logger.error('[BACKUP] pg_dump failed, falling back to Supabase export:', execError);
        
        // Fallback: Use Supabase export API
        return await this.fallbackBackup(backupDir, backupFileName);
      }
    } catch (error: any) {
      logger.error('[BACKUP] Backup operation failed:', error);
      return false;
    }
  }

  /**
   * Fallback backup using Supabase export
   */
  private async fallbackBackup(backupDir: string, backupFileName: string): Promise<boolean> {
    try {
      // Export all tables using Supabase client
      const tables = [
        'users', 'customers', 'packages', 'areas', 'connections',
        'invoices', 'payments', 'inventory', 'inventory_transactions',
        'staff', 'expenses', 'complaints', 'announcements',
        'notifications', 'roles', 'logs'
      ];

      const backupData: any = {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        tables: {}
      };

      for (const table of tables) {
        const { data, error } = await this.supabase
          .from(table)
          .select('*');

        if (error) {
          logger.warn(`[BACKUP] Failed to export table ${table}:`, error);
        } else {
          backupData.tables[table] = data;
          logger.info(`[BACKUP] Exported ${data?.length || 0} records from ${table}`);
        }
      }

      const backupPath = path.join(backupDir, `${backupFileName}.json`);
      fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));

      const stats = fs.statSync(backupPath);
      logger.info(`[BACKUP] Fallback backup completed: ${backupPath} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);

      await this.recordBackup(backupPath, stats.size);

      return true;
    } catch (error: any) {
      logger.error('[BACKUP] Fallback backup failed:', error);
      return false;
    }
  }

  /**
   * Record backup in database
   */
  private async recordBackup(filePath: string, fileSize: number): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('backups')
        .insert({
          file_path: filePath,
          file_size: fileSize,
          status: 'completed',
          created_at: new Date().toISOString()
        });

      if (error) {
        logger.warn('[BACKUP] Failed to record backup in database:', error);
      }
    } catch (error) {
      logger.warn('[BACKUP] Failed to record backup in database:', error);
    }
  }

  /**
   * Clean up old backups beyond retention period
   */
  private async cleanupOldBackups(backupDir: string, retentionDays: number): Promise<void> {
    try {
      const files = fs.readdirSync(backupDir);
      const now = Date.now();
      const retentionMs = retentionDays * 24 * 60 * 60 * 1000;

      for (const file of files) {
        const filePath = path.join(backupDir, file);
        const stats = fs.statSync(filePath);
        const fileAge = now - stats.mtimeMs;

        if (fileAge > retentionMs) {
          fs.unlinkSync(filePath);
          logger.info(`[BACKUP] Deleted old backup: ${file}`);
        }
      }
    } catch (error) {
      logger.error('[BACKUP] Failed to cleanup old backups:', error);
    }
  }

  /**
   * Restore from backup file
   */
  async restoreBackup(backupFilePath: string): Promise<boolean> {
    try {
      logger.info(`[BACKUP] Starting restore from: ${backupFilePath}`);

      if (!fs.existsSync(backupFilePath)) {
        throw new Error(`Backup file not found: ${backupFilePath}`);
      }

      // Check if it's a compressed file
      if (backupFilePath.endsWith('.gz')) {
        await execAsync(`gunzip -c "${backupFilePath}" | psql "${process.env.DATABASE_URL}"`);
      } else if (backupFilePath.endsWith('.sql')) {
        await execAsync(`psql "${process.env.DATABASE_URL}" < "${backupFilePath}"`);
      } else if (backupFilePath.endsWith('.json')) {
        // Restore from JSON backup
        const backupData = JSON.parse(fs.readFileSync(backupFilePath, 'utf-8'));

        for (const [table, records] of Object.entries(backupData.tables || {})) {
          if (Array.isArray(records) && records.length > 0) {
            const { error } = await this.supabase
              .from(table)
              .insert(records);

            if (error) {
              logger.warn(`[BACKUP] Failed to restore table ${table}:`, error);
            } else {
              logger.info(`[BACKUP] Restored ${records.length} records to ${table}`);
            }
          }
        }
      } else {
        throw new Error('Unsupported backup file format');
      }

      logger.info('[BACKUP] Restore completed successfully');
      return true;
    } catch (error: any) {
      logger.error('[BACKUP] Restore failed:', error);
      return false;
    }
  }

  /**
   * Get backup status
   */
  async getBackupStatus(): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .from('backups')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      return {
        isRunning: this.isRunning,
        recentBackups: data || [],
        backupDirectory: path.join(process.cwd(), 'backups')
      };
    } catch (error) {
      logger.error('[BACKUP] Failed to get backup status:', error);
      return {
        isRunning: this.isRunning,
        recentBackups: [],
        error: 'Failed to retrieve backup status'
      };
    }
  }
}

// Singleton instance
let backupScheduler: BackupScheduler | null = null;

export const getBackupScheduler = (): BackupScheduler => {
  if (!backupScheduler) {
    backupScheduler = new BackupScheduler();
  }
  return backupScheduler;
};
