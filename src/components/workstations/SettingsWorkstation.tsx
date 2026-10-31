/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import type { FilmProject, MediaProviderInfo } from '../../types/film';
import {
  Settings,
  Cpu,
  Video,
  Database,
  HardDrive,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Server,
} from 'lucide-react';

interface Props {
  project: FilmProject;
  onUpdateProject: (p: FilmProject) => void;
}

export const SettingsWorkstation: React.FC<Props> = ({
  project,
  onUpdateProject,
}) => {
  const [selectedAiModel, setSelectedAiModel] = useState('gemini-3.8-flash');
  const [defaultFps, setDefaultFps] = useState<number>(project.fps || 24);
  const [autoQcThreshold, setAutoQcThreshold] = useState(90);

  const [providers, setProviders] = useState<MediaProviderInfo[]>([]);
  const [storageStatus, setStorageStatus] = useState<any>(null);
  const [isLoadingProviders, setIsLoadingProviders] = useState(false);

  const fetchProviderStatus = async () => {
    setIsLoadingProviders(true);
    try {
      const res = await fetch('/api/providers/status');
      const data = await res.json();
      if (data.success) {
        setProviders(data.providers || []);
        setStorageStatus(data.storage);
      }
    } catch (err) {
      console.error('Failed to query provider status:', err);
    } finally {
      setIsLoadingProviders(false);
    }
  };

  useEffect(() => {
    fetchProviderStatus();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPERATIONAL':
      case 'AUTHENTICATED':
        return (
          <span className="px-2.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-600/60 text-emerald-300 text-[10px] font-bold font-mono-code flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>{status}</span>
          </span>
        );
      case 'CONFIGURED':
      case 'AVAILABLE':
        return (
          <span className="px-2.5 py-0.5 rounded bg-amber-950/80 border border-amber-600/60 text-amber-300 text-[10px] font-bold font-mono-code flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-amber-400" />
            <span>{status}</span>
          </span>
        );
      case 'UNAVAILABLE':
      default:
        return (
          <span className="px-2.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400 text-[10px] font-bold font-mono-code">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-sky-900/30 shadow-2xl relative overflow-hidden">
        <div className="max-w-3xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold tracking-wider uppercase">
            <Settings className="w-3.5 h-3.5 text-sky-400" />
            <span>Studio Production Infrastructure</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white font-cinematic tracking-tight">
            Settings & Infrastructure Matrix
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Persistent SQLite database storage, media asset management, asynchronous production job queue, and genuine
            media provider status reporting.
          </p>
        </div>
      </div>

      {/* Production Infrastructure Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Persistent Database */}
        <div className="glass-panel p-6 rounded-2xl border border-sky-800/30 space-y-4">
          <div className="flex items-center gap-2 text-sky-400 font-bold text-xs uppercase tracking-wider">
            <Database className="w-4 h-4" />
            <span>Persistent Database</span>
          </div>

          <div className="space-y-2 text-xs text-slate-300">
            <div className="flex justify-between items-center py-1 border-b border-slate-800">
              <span className="text-slate-400">Engine:</span>
              <span className="font-semibold text-white">SQLite 3.x (WAL Mode)</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-800">
              <span className="text-slate-400">Location:</span>
              <span className="font-mono-code text-[11px] text-sky-300">data/synmotion.db</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Survivability:</span>
              <span className="text-emerald-400 font-semibold">Survives Server Restarts</span>
            </div>
          </div>
        </div>

        {/* Card 2: Media Asset Storage */}
        <div className="glass-panel p-6 rounded-2xl border border-sky-800/30 space-y-4">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
            <HardDrive className="w-4 h-4" />
            <span>Media Asset Storage</span>
          </div>

          <div className="space-y-2 text-xs text-slate-300">
            <div className="flex justify-between items-center py-1 border-b border-slate-800">
              <span className="text-slate-400">Active Driver:</span>
              <span className="font-semibold text-white">{storageStatus?.type || 'Local File Storage'}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-800">
              <span className="text-slate-400">Status:</span>
              <span className="text-emerald-400 font-semibold">
                {storageStatus?.operational ? 'Operational & Protected' : 'Initializing'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Security:</span>
              <span className="text-sky-300">Path Traversal Blocked</span>
            </div>
          </div>
        </div>

        {/* Card 3: Production Job Queue */}
        <div className="glass-panel p-6 rounded-2xl border border-sky-800/30 space-y-4">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
            <Server className="w-4 h-4" />
            <span>Production Job Engine</span>
          </div>

          <div className="space-y-2 text-xs text-slate-300">
            <div className="flex justify-between items-center py-1 border-b border-slate-800">
              <span className="text-slate-400">State Machine:</span>
              <span className="font-semibold text-white">8 Lifecycle States</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-800">
              <span className="text-slate-400">Crash Recovery:</span>
              <span className="text-emerald-400 font-semibold">Auto-Resumes on Restart</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Job History:</span>
              <span className="text-sky-300 font-semibold">Persisted in SQLite</span>
            </div>
          </div>
        </div>
      </div>

      {/* Configuration Defaults */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: AI Reasoning Model */}
        <div className="glass-panel p-6 rounded-2xl border border-sky-800/30 space-y-4">
          <div className="flex items-center gap-2 text-sky-400 font-bold text-xs uppercase tracking-wider">
            <Cpu className="w-4 h-4" />
            <span>AI Director Reasoning Model</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-300 block mb-1 font-semibold">Active Director Model:</label>
              <select
                value={selectedAiModel}
                onChange={(e) => setSelectedAiModel(e.target.value)}
                className="w-full bg-black/60 border border-slate-700 rounded-lg p-2.5 text-slate-200"
              >
                <option value="gemini-3.8-flash">Google Gemini 3.8 Flash (Autonomous Director & Multimodal)</option>
                <option value="gemini-4-argon">Google Gemini 4 Argon (Deep Reasoning & STEM)</option>
              </select>
            </div>

            <p className="text-slate-400 leading-relaxed">
              Handles creative brief interpretation, screenplay decomposition, production bible generation, Visual DNA
              extraction, and Director&apos;s Cut intelligent change detection.
            </p>
          </div>
        </div>

        {/* Card 2: Production Defaults */}
        <div className="glass-panel p-6 rounded-2xl border border-sky-800/30 space-y-4">
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider">
            <Video className="w-4 h-4" />
            <span>Cinematic Render Defaults</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-slate-300 block mb-1 font-semibold">Master Frame Rate:</label>
              <select
                value={defaultFps}
                onChange={(e) => {
                  setDefaultFps(Number(e.target.value));
                  onUpdateProject({ ...project, fps: Number(e.target.value) });
                }}
                className="w-full bg-black/60 border border-slate-700 rounded-lg p-2 text-slate-200"
              >
                <option value={24}>24.000 FPS (Cinematic Standard)</option>
                <option value={30}>30.000 FPS (Broadcast)</option>
                <option value={60}>60.000 FPS (High Motion)</option>
              </select>
            </div>

            <div>
              <label className="text-slate-300 block mb-1 font-semibold">Autonomous QC Pass Cutoff:</label>
              <select
                value={autoQcThreshold}
                onChange={(e) => setAutoQcThreshold(Number(e.target.value))}
                className="w-full bg-black/60 border border-slate-700 rounded-lg p-2 text-slate-200"
              >
                <option value={90}>Score &gt;= 90% (Strict)</option>
                <option value={85}>Score &gt;= 85% (Balanced)</option>
                <option value={80}>Score &gt;= 80% (Permissive)</option>
              </select>
            </div>
          </div>

          <p className="text-[11px] text-slate-400">
            Scenes scoring below this threshold are automatically queued for autonomous director retry.
          </p>
        </div>
      </div>

      {/* Provider Status Matrix (Genuine Live Capability Discovery) */}
      <div className="glass-panel p-6 rounded-2xl border border-sky-900/30 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-sky-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Media Provider Capabilities Matrix (Live Discovery)
            </h3>
          </div>

          <button
            onClick={fetchProviderStatus}
            disabled={isLoadingProviders}
            className="px-3 py-1 rounded bg-black/50 hover:bg-slate-800 border border-slate-700 text-xs text-slate-300 flex items-center gap-1.5 transition-all"
          >
            <RefreshCw className={`w-3 h-3 ${isLoadingProviders ? 'animate-spin text-sky-400' : ''}`} />
            <span>Refresh Providers</span>
          </button>
        </div>

        <div className="divide-y divide-slate-800 text-xs">
          {providers.map((prov) => (
            <div key={prov.id} className="py-4 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="font-bold text-white text-sm">{prov.name}</span>
                  {getStatusBadge(prov.status)}
                  <span className="text-[10px] text-slate-400 uppercase font-mono-code bg-black/40 px-2 py-0.5 rounded border border-slate-800">
                    {prov.type}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-mono-code text-slate-300">{prov.latency}</span>
                </div>
              </div>

              {prov.statusMessage && (
                <p className="text-[11px] text-slate-300 leading-relaxed">{prov.statusMessage}</p>
              )}

              {prov.capabilities && prov.capabilities.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {prov.capabilities.map((cap, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded bg-sky-950/40 border border-sky-800/40 text-[10px] text-sky-300 font-medium"
                    >
                      {cap}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
