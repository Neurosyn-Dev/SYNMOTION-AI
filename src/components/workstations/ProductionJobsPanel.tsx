/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import type { ProductionJob } from '../../types/film';
import {
  Server,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  RotateCcw,
  Activity,
  Layers,
} from 'lucide-react';

interface Props {
  projectId: string;
}

export const ProductionJobsPanel: React.FC<Props> = ({ projectId }) => {
  const [jobs, setJobs] = useState<ProductionJob[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchJobs = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/jobs`);
      const data = await res.json();
      if (data.success) {
        setJobs(data.jobs || []);
      }
    } catch (err) {
      console.error('Failed to fetch jobs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 6000);
    return () => clearInterval(interval);
  }, [projectId]);

  const handleCancelJob = async (jobId: string) => {
    try {
      await fetch(`/api/jobs/${jobId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Cancelled by operator in UI' }),
      });
      fetchJobs();
    } catch (err) {
      console.error('Failed to cancel job:', err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-600/50 text-emerald-300 text-[10px] font-bold font-mono-code flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>COMPLETED</span>
          </span>
        );
      case 'PROCESSING':
      case 'QUALITY_CHECK':
        return (
          <span className="px-2 py-0.5 rounded bg-sky-950/80 border border-sky-500/50 text-sky-300 text-[10px] font-bold font-mono-code flex items-center gap-1 animate-pulse">
            <Activity className="w-3 h-3 text-sky-400" />
            <span>{status}</span>
          </span>
        );
      case 'RETRYING':
        return (
          <span className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-600/50 text-amber-300 text-[10px] font-bold font-mono-code flex items-center gap-1">
            <RotateCcw className="w-3 h-3 text-amber-400" />
            <span>RETRYING</span>
          </span>
        );
      case 'FAILED':
        return (
          <span className="px-2 py-0.5 rounded bg-red-950/80 border border-red-600/50 text-red-300 text-[10px] font-bold font-mono-code flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-red-400" />
            <span>FAILED</span>
          </span>
        );
      case 'CANCELLED':
      default:
        return (
          <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400 text-[10px] font-bold font-mono-code">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="glass-panel p-6 rounded-2xl border border-sky-900/30 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-sky-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Persistent Production Jobs Queue ({jobs.length})
          </h3>
        </div>

        <button
          onClick={fetchJobs}
          disabled={isLoading}
          className="px-2.5 py-1 rounded bg-black/40 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 flex items-center gap-1 transition-all"
        >
          <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin text-sky-400' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {jobs.length === 0 ? (
        <div className="p-6 rounded-xl bg-black/30 border border-slate-800 text-center text-xs text-slate-500">
          No background production jobs queued for this project yet.
        </div>
      ) : (
        <div className="space-y-2.5">
          {jobs.map((job) => {
            const isActive =
              job.status === 'PROCESSING' ||
              job.status === 'QUEUED' ||
              job.status === 'QUALITY_CHECK' ||
              job.status === 'PENDING' ||
              job.status === 'RETRYING';
            return (
              <div
                key={job.id}
                className="p-3.5 rounded-xl bg-black/40 border border-slate-800 text-xs space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white font-mono-code">{job.jobType}</span>
                    {getStatusBadge(job.status)}
                    <span className="text-[10px] font-mono-code text-slate-400">
                      Retries: {job.retryCount} / {job.maxRetries}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono-code text-slate-500">
                      {new Date(job.createdAt).toLocaleTimeString()}
                    </span>

                    {isActive && (
                      <button
                        onClick={() => handleCancelJob(job.id)}
                        className="px-2 py-0.5 rounded bg-red-950/60 hover:bg-red-900 border border-red-700/50 text-[10px] text-red-300 flex items-center gap-1"
                      >
                        <XCircle className="w-3 h-3" />
                        <span>Cancel</span>
                      </button>
                    )}
                  </div>
                </div>

                {job.progress > 0 && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400 font-mono-code">
                      <span>Progress</span>
                      <span>{job.progress}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all duration-300"
                        style={{ width: `${job.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {job.errorDetails && (
                  <div className="text-[11px] text-amber-300 bg-amber-950/30 p-2 rounded border border-amber-900/40">
                    {job.errorDetails}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
