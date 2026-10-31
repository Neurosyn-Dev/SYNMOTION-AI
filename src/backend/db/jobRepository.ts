/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getDatabase } from './database.js';
import type { ProductionJob, JobStatus, JobType } from '../../types/film.js';

export class JobRepository {
  public static getById(id: string): ProductionJob | null {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM jobs WHERE id = ?').get(id) as any;
    if (!row) return null;
    return this.mapRowToJob(row);
  }

  public static listByProject(projectId: string): ProductionJob[] {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM jobs WHERE project_id = ? ORDER BY created_at DESC').all(projectId) as any[];
    return rows.map((r) => this.mapRowToJob(r));
  }

  public static listActive(): ProductionJob[] {
    const db = getDatabase();
    const rows = db.prepare(`SELECT * FROM jobs WHERE status IN ('PENDING', 'QUEUED', 'PROCESSING', 'QUALITY_CHECK', 'RETRYING') ORDER BY created_at ASC`).all() as any[];
    return rows.map((r) => this.mapRowToJob(r));
  }

  public static save(job: ProductionJob): void {
    const db = getDatabase();
    const now = new Date().toISOString();
    if (!job.createdAt) job.createdAt = now;
    job.updatedAt = now;

    const stmt = db.prepare(`
      INSERT INTO jobs (
        id, project_id, scene_id, job_type, status, progress,
        retry_count, max_retries, error_details, input_params,
        output_assets, created_at, started_at, completed_at, updated_at
      ) VALUES (
        @id, @project_id, @scene_id, @job_type, @status, @progress,
        @retry_count, @max_retries, @error_details, @input_params,
        @output_assets, @created_at, @started_at, @completed_at, @updated_at
      )
      ON CONFLICT(id) DO UPDATE SET
        scene_id = excluded.scene_id,
        status = excluded.status,
        progress = excluded.progress,
        retry_count = excluded.retry_count,
        max_retries = excluded.max_retries,
        error_details = excluded.error_details,
        input_params = excluded.input_params,
        output_assets = excluded.output_assets,
        started_at = excluded.started_at,
        completed_at = excluded.completed_at,
        updated_at = excluded.updated_at
    `);

    stmt.run({
      id: job.id,
      project_id: job.projectId,
      scene_id: job.sceneId || null,
      job_type: job.jobType,
      status: job.status,
      progress: job.progress || 0,
      retry_count: job.retryCount || 0,
      max_retries: job.maxRetries || 3,
      error_details: job.errorDetails || null,
      input_params: job.inputParams ? JSON.stringify(job.inputParams) : null,
      output_assets: job.outputAssets ? JSON.stringify(job.outputAssets) : null,
      created_at: job.createdAt,
      started_at: job.startedAt || null,
      completed_at: job.completedAt || null,
      updated_at: job.updatedAt,
    });
  }

  public static updateStatus(
    id: string,
    status: JobStatus,
    progress?: number,
    errorDetails?: string,
    outputAssets?: string[]
  ): boolean {
    const job = this.getById(id);
    if (!job) return false;

    job.status = status;
    if (progress !== undefined) job.progress = progress;
    if (errorDetails !== undefined) job.errorDetails = errorDetails;
    if (outputAssets !== undefined) job.outputAssets = outputAssets;

    const now = new Date().toISOString();
    if (status === 'PROCESSING' && !job.startedAt) {
      job.startedAt = now;
    }
    if (status === 'COMPLETED' || status === 'FAILED' || status === 'CANCELLED') {
      job.completedAt = now;
    }

    this.save(job);
    return true;
  }

  public static recoverInterruptedJobs(): number {
    const db = getDatabase();
    const now = new Date().toISOString();
    const res = db.prepare(`
      UPDATE jobs
      SET status = 'RETRYING',
          error_details = 'Interrupted by backend restart; flagged for retry/recovery',
          updated_at = ?
      WHERE status IN ('PROCESSING', 'QUEUED')
    `).run(now);

    return res.changes;
  }

  private static mapRowToJob(row: any): ProductionJob {
    let inputParams: Record<string, any> | undefined = undefined;
    if (row.input_params) {
      try {
        inputParams = JSON.parse(row.input_params);
      } catch {
        // Ignore
      }
    }
    let outputAssets: string[] | undefined = undefined;
    if (row.output_assets) {
      try {
        outputAssets = JSON.parse(row.output_assets);
      } catch {
        // Ignore
      }
    }

    return {
      id: row.id,
      projectId: row.project_id,
      sceneId: row.scene_id || undefined,
      jobType: row.job_type as JobType,
      status: row.status as JobStatus,
      progress: row.progress,
      retryCount: row.retry_count,
      maxRetries: row.max_retries,
      errorDetails: row.error_details || undefined,
      inputParams,
      outputAssets,
      createdAt: row.created_at,
      startedAt: row.started_at || undefined,
      completedAt: row.completed_at || undefined,
      updatedAt: row.updated_at,
    };
  }
}
