import { logger } from '../utils/logger';

export interface BackgroundJob {
  id: string;
  type: string;
  status: 'running' | 'completed' | 'failed';
  progress: { current: number; total: number };
  result?: any;
  error?: string;
  startedAt: number;
  completedAt?: number;
}

const jobs = new Map<string, BackgroundJob>();

export function createJob(type: string, total: number): string {
  const id = `job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  jobs.set(id, {
    id,
    type,
    status: 'running',
    progress: { current: 0, total },
    startedAt: Date.now(),
  });
  logger.info(`Background job created: ${id} (${type}) total=${total}`);
  return id;
}

export function getJob(id: string): BackgroundJob | undefined {
  return jobs.get(id);
}

export function updateJobProgress(id: string, current: number): void {
  const job = jobs.get(id);
  if (job) {
    job.progress.current = current;
  }
}

export function completeJob(id: string, result: any): void {
  const job = jobs.get(id);
  if (job) {
    job.status = 'completed';
    job.progress.current = job.progress.total;
    job.result = result;
    job.completedAt = Date.now();
    logger.info(`Background job completed: ${id}`);
  }
}

export function failJob(id: string, error: string): void {
  const job = jobs.get(id);
  if (job) {
    job.status = 'failed';
    job.error = error;
    job.completedAt = Date.now();
    logger.error(`Background job failed: ${id} - ${error}`);
  }
}

// Run an async task in the background, tracking progress via a job ID
export function runInBackground(
  type: string,
  total: number,
  task: (jobId: string) => Promise<any>
): string {
  const jobId = createJob(type, total);
  task(jobId).then(
    (result) => completeJob(jobId, result),
    (err) => failJob(jobId, err?.message || String(err))
  );
  return jobId;
}
