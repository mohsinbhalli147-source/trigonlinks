import { logger } from '../utils/logger';
import { generateMonthlyBillsBackground } from './billing';
import { createJob, updateJobProgress, completeJob, failJob } from './jobStore';

/**
 * Daily scheduler that auto-generates invoices for customers whose billing date
 * matches today's date. Runs once per day at a configurable hour (default 02:00).
 *
 * Uses a setInterval-based tick every hour, but only executes the actual
 * generation once per day (guarded by lastRunDate).
 */
export class InvoiceScheduler {
  private intervalHandle: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;
  private lastRunDate: string | null = null;

  start(intervalMinutes: number = 60): void {
    if (this.isRunning) {
      logger.warn('[INVOICE-CRON] Scheduler already running');
      return;
    }
    this.isRunning = true;
    logger.info(`[INVOICE-CRON] Auto-invoice scheduler started (checking every ${intervalMinutes} min, runs once daily at ~02:00)`);

    this.intervalHandle = setInterval(() => {
      this.maybeRun().catch((err) => {
        logger.error('[INVOICE-CRON] Error in scheduled run:', err);
      });
    }, intervalMinutes * 60 * 1000);
  }

  stop(): void {
    if (this.intervalHandle) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
      this.isRunning = false;
      logger.info('[INVOICE-CRON] Scheduler stopped');
    }
  }

  /**
   * Run the auto-invoice generation if today hasn't been run yet and it's
   * at/after the target hour.
   */
  private async maybeRun(): Promise<void> {
    const now = new Date();
    const todayKey = now.toISOString().slice(0, 10);

    if (this.lastRunDate === todayKey) {
      return; // already ran today
    }

    const hour = now.getHours();
    if (hour < 2) {
      return; // only run at/after 2 AM
    }

    await this.runAutoGeneration(todayKey);
  }

  /**
   * Generate invoices for all active customers whose billing date === today.
   * Uses the background generator with forceAll=false so only matching billing
   * dates get billed.
   */
  async runAutoGeneration(todayKey: string): Promise<void> {
    const jobId = createJob('auto-invoice-daily', 0);

    try {
      logger.info(`[INVOICE-CRON] Starting auto invoice generation for ${todayKey}`);

      const result = await generateMonthlyBillsBackground(
        'system-auto',
        false, // forceAll=false: only customers with billing date === today
        undefined, // all areas
        jobId,
        (current, total) => updateJobProgress(jobId, current)
      );

      this.lastRunDate = todayKey;
      completeJob(jobId, result);

      if (result.success) {
        logger.info(`[INVOICE-CRON] Auto generation complete: ${result.billsGenerated} bills generated`);
      } else {
        logger.warn(`[INVOICE-CRON] Auto generation reported failure: ${result.message}`);
      }
    } catch (error: any) {
      failJob(jobId, error?.message || String(error));
      logger.error('[INVOICE-CRON] Auto generation failed:', error);
    }
  }

  /**
   * Manually trigger a run (bypassing the daily/hour guards).
   */
  async runNow(): Promise<any> {
    const todayKey = new Date().toISOString().slice(0, 10);
    await this.runAutoGeneration(todayKey);
    return { success: true, date: todayKey };
  }

  isSchedulerRunning(): boolean {
    return this.isRunning;
  }
}

let scheduler: InvoiceScheduler | null = null;

export const getInvoiceScheduler = (): InvoiceScheduler => {
  if (!scheduler) {
    scheduler = new InvoiceScheduler();
  }
  return scheduler;
};
