/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from 'crypto';
import { JobRepository } from '../db/jobRepository.js';
import type { ProductionJob, JobStatus, JobType } from '../../types/film.js';

const VALID_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  PENDING: ['QUEUED', 'PROCESSING', 'CANCELLED'],
  QUEUED: ['PROCESSING', 'CANCELLED'],
  PROCESSING: ['QUALITY_CHECK', 'COMPLETED', 'FAILED', 'RETRYING', 'CANCELLED'],
  QUALITY_CHECK: ['COMPLETED', 'RETRYING', 'FAILED', 'CANCELLED'],
  RETRYING: ['QUEUED', 'PROCESSING', 'FAILED', 'CANCELLED'],
  COMPLETED: [], // Terminal
  FAILED: [], // Terminal
  CANCELLED: [], // Terminal
};

export class JobManager {
  public static createJob(params: {
    projectId: string;
    sceneId?: string;
    jobType: JobType;
    inputParams?: Record<string, any>;
    maxRetries?: number;
    initialStatus?: 'PENDING' | 'QUEUED';
  }): ProductionJob {
    const job: ProductionJob = {
      id: `job-${crypto.randomUUID()}`,
      projectId: params.projectId,
      sceneId: params.sceneId,
      jobType: params.jobType,
      status: params.initialStatus || 'QUEUED',
      progress: 0,
      retryCount: 0,
      maxRetries: params.maxRetries ?? 3,
      inputParams: params.inputParams,
      outputAssets: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    JobRepository.save(job);
    return job;
  }

  public static transitionStatus(
    jobId: string,
    newStatus: JobStatus,
    progress?: number,
    errorDetails?: string,
    outputAssets?: string[]
  ): ProductionJob {
    const job = JobRepository.getById(jobId);
    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }

    if (job.status === newStatus) {
      // Idempotent update of progress/details
      JobRepository.updateStatus(jobId, newStatus, progress, errorDetails, outputAssets);
      return JobRepository.getById(jobId)!;
    }

    const allowed = VALID_TRANSITIONS[job.status];
    if (!allowed || !allowed.includes(newStatus)) {
      throw new Error(
        `Invalid job status transition: cannot transition from ${job.status} to ${newStatus}`
      );
    }

    JobRepository.updateStatus(jobId, newStatus, progress, errorDetails, outputAssets);
    return JobRepository.getById(jobId)!;
  }

  public static cancelJob(jobId: string, reason = 'Cancelled by user'): ProductionJob {
    return this.transitionStatus(jobId, 'CANCELLED', undefined, reason);
  }

  public static getJob(jobId: string): ProductionJob | null {
    return JobRepository.getById(jobId);
  }

  public static listProjectJobs(projectId: string): ProductionJob[] {
    return JobRepository.listByProject(projectId);
  }

  public static recoverOnStartup(): number {
    const recovered = JobRepository.recoverInterruptedJobs();
    if (recovered > 0) {
      console.log(`[JobManager] Recovered ${recovered} interrupted job(s) from previous server run.`);
    }
    return recovered;
  }
}
