/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import type { FilmProject, OutputQuality, ProductionJob, MediaAsset } from '../../types/film';
import {
  Download,
  Film,
  CheckCircle2,
  X,
  Sparkles,
  Layers,
  FileVideo,
  AlertCircle,
  Activity,
  Play,
  Volume2,
  Check,
} from 'lucide-react';

interface Props {
  project: FilmProject;
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<Props> = ({ project, isOpen, onClose }) => {
  const [format, setFormat] = useState<'mp4' | 'webm'>('mp4');
  const [resolution, setResolution] = useState<OutputQuality>(project.quality || '1080p');
  const [isAssembling, setIsAssembling] = useState(false);
  const [currentJob, setCurrentJob] = useState<ProductionJob | null>(null);
  const [masterAsset, setMasterAsset] = useState<MediaAsset | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Poll active assembly job if one is running
  useEffect(() => {
    if (!currentJob || currentJob.status === 'COMPLETED' || currentJob.status === 'FAILED' || currentJob.status === 'CANCELLED') {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/jobs/${currentJob.id}`);
        const data = await res.json();
        if (data.success && data.job) {
          setCurrentJob(data.job);

          if (data.job.status === 'COMPLETED') {
            setIsAssembling(false);
            if (data.job.outputAssets && data.job.outputAssets.length > 0) {
              const assetRes = await fetch(`/api/assets/${data.job.outputAssets[0]}`);
              const assetData = await assetRes.json();
              if (assetData.success && assetData.asset) {
                setMasterAsset(assetData.asset);
              }
            }
          } else if (data.job.status === 'FAILED') {
            setIsAssembling(false);
            setErrorMessage(data.job.errorDetails || 'Master assembly encountered an error.');
          }
        }
      } catch (err: any) {
        console.error('Failed to poll job status:', err);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [currentJob]);

  if (!isOpen) return null;

  const handleStartMasterAssembly = async () => {
    setIsAssembling(true);
    setErrorMessage(null);
    setMasterAsset(null);

    try {
      const res = await fetch(`/api/projects/${project.id}/assemble`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format,
          quality: resolution,
          aspectRatio: project.aspectRatio,
          fps: project.fps || 24,
        }),
      });

      const data = await res.json();
      if (data.success && data.job) {
        setCurrentJob(data.job);
      } else {
        throw new Error(data.error || 'Failed to dispatch master assembly job');
      }
    } catch (err: any) {
      setIsAssembling(false);
      setErrorMessage(err.message);
    }
  };

  const getStageDescription = (job: ProductionJob) => {
    if (job.status === 'QUEUED') return 'Job queued in background worker pool...';
    if (job.status === 'PROCESSING') {
      if (job.progress < 30) return 'Rendering procedural Three.js scene passes...';
      if (job.progress < 60) return 'Synthesizing atmospheric multitrack audio & effects...';
      return 'FFmpeg master multi-stream concatenation & color grading...';
    }
    if (job.status === 'QUALITY_CHECK') return 'Automated FFprobe container, bitrate & audio stream inspection...';
    if (job.status === 'COMPLETED') return 'Master Assembly Complete & Quality-Verified!';
    if (job.status === 'FAILED') return 'Assembly failed';
    return 'Preparing production pipeline...';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="glass-panel w-full max-w-xl rounded-2xl border border-sky-500/40 p-6 space-y-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-950 border border-sky-500/50 flex items-center justify-center text-sky-400">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-wide">Autonomous Master Assembly</h2>
            <p className="text-xs text-slate-400">
              {project.title} • {project.durationSeconds}s Total Duration • {project.storyboard.length} Scenes
            </p>
          </div>
        </div>

        {/* Options */}
        <div className="space-y-4 text-xs">
          <div>
            <label className="text-slate-300 font-semibold block mb-1.5">Master Container & Codecs:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                disabled={isAssembling}
                onClick={() => setFormat('mp4')}
                className={`p-2.5 rounded-lg border text-center transition-all ${
                  format === 'mp4'
                    ? 'border-sky-400 bg-sky-950/60 text-white font-bold shadow'
                    : 'border-slate-800 bg-black/40 text-slate-400 hover:text-white'
                }`}
              >
                MP4 (H.264 / AAC Master Cut)
              </button>
              <button
                disabled={isAssembling}
                onClick={() => setFormat('webm')}
                className={`p-2.5 rounded-lg border text-center transition-all ${
                  format === 'webm'
                    ? 'border-sky-400 bg-sky-950/60 text-white font-bold shadow'
                    : 'border-slate-800 bg-black/40 text-slate-400 hover:text-white'
                }`}
              >
                WebM (VP9 / Opus Web Cut)
              </button>
            </div>
          </div>

          <div>
            <label className="text-slate-300 font-semibold block mb-1.5">Output Resolution:</label>
            <div className="grid grid-cols-3 gap-2">
              {(['720p', '1080p', '4k'] as const).map((q) => (
                <button
                  key={q}
                  disabled={isAssembling}
                  onClick={() => setResolution(q)}
                  className={`p-2 rounded-lg border text-center uppercase font-mono-code transition-all ${
                    resolution === q
                      ? 'border-sky-400 bg-sky-950/60 text-white font-bold shadow'
                      : 'border-slate-800 bg-black/40 text-slate-400 hover:text-white'
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Production Pipeline Progress Display */}
        {currentJob && currentJob.status !== 'COMPLETED' && (
          <div className="space-y-3 p-4 rounded-xl bg-black/60 border border-slate-800 text-xs">
            <div className="flex justify-between items-center text-slate-300">
              <span className="flex items-center gap-1.5 font-medium text-sky-300">
                <Activity className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
                <span>{getStageDescription(currentJob)}</span>
              </span>
              <span className="font-mono-code text-sky-400 font-bold">{currentJob.progress}%</span>
            </div>

            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-sky-500 via-indigo-500 to-cyan-400 transition-all duration-300"
                style={{ width: `${currentJob.progress}%` }}
              />
            </div>

            {/* Stage Checklist */}
            <div className="grid grid-cols-2 gap-2 pt-1 font-mono-code text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5">
                <Check className={`w-3 h-3 ${currentJob.progress >= 20 ? 'text-emerald-400' : 'text-slate-600'}`} />
                <span>1. Scene Rendering</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className={`w-3 h-3 ${currentJob.progress >= 50 ? 'text-emerald-400' : 'text-slate-600'}`} />
                <span>2. Audio Synthesis</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className={`w-3 h-3 ${currentJob.progress >= 75 ? 'text-emerald-400' : 'text-slate-600'}`} />
                <span>3. FFmpeg Assembly</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className={`w-3 h-3 ${currentJob.progress >= 90 ? 'text-emerald-400' : 'text-slate-600'}`} />
                <span>4. FFprobe QC Inspection</span>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-red-950/40 border border-red-500/40 flex items-center gap-2 text-xs text-red-300">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Master Cut Assembled State with Real Video Player & Download */}
        {masterAsset && (
          <div className="space-y-3 p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-xs">
            <div className="flex items-center justify-between text-emerald-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold">Production Master Assembled & Verified!</span>
              </div>
              <span className="font-mono-code text-[11px] text-emerald-400">
                {(masterAsset.fileSize / (1024 * 1024)).toFixed(2)} MB
              </span>
            </div>

            {/* Video Preview Player */}
            <div className="relative rounded-lg overflow-hidden bg-black aspect-video border border-emerald-500/30">
              <video
                src={masterAsset.url}
                controls
                className="w-full h-full object-contain"
                preload="metadata"
              />
            </div>

            {/* Quality Control Details from FFprobe */}
            {masterAsset.metadata?.qualityControl && (
              <div className="p-2.5 rounded bg-black/50 border border-emerald-900/40 font-mono-code text-[11px] text-slate-300 grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500">Duration: </span>
                  <span className="text-emerald-400">{masterAsset.metadata.qualityControl.duration?.toFixed(1)}s</span>
                </div>
                <div>
                  <span className="text-slate-500">Dimensions: </span>
                  <span className="text-emerald-400">{masterAsset.metadata.qualityControl.width}x{masterAsset.metadata.qualityControl.height}</span>
                </div>
                <div>
                  <span className="text-slate-500">Video Codec: </span>
                  <span className="text-emerald-400">{masterAsset.metadata.qualityControl.videoCodec}</span>
                </div>
                <div>
                  <span className="text-slate-500">Audio Codec: </span>
                  <span className="text-emerald-400">{masterAsset.metadata.qualityControl.audioCodec || 'None'}</span>
                </div>
              </div>
            )}

            {/* Real Download Button (fetches real video binary) */}
            <div className="flex justify-end pt-1">
              <a
                href={`${masterAsset.url}?download=true`}
                download={masterAsset.originalFilename}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-2 shadow-lg transition-all"
              >
                <Download className="w-4 h-4" />
                <span>DOWNLOAD MASTER VIDEO ({format.toUpperCase()})</span>
              </a>
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 text-xs hover:bg-slate-800"
          >
            Close
          </button>
          {!masterAsset && (
            <button
              disabled={isAssembling}
              onClick={handleStartMasterAssembly}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs tracking-wide shadow-lg flex items-center gap-2 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isAssembling ? 'ASSEMBLING MASTER...' : 'START MASTER ASSEMBLY'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
