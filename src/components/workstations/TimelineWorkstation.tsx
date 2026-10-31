/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import type { FilmProject, TimelineClip } from '../../types/film';
import {
  Film,
  Play,
  Pause,
  ZoomIn,
  ZoomOut,
  Scissors,
  Split,
  Volume2,
  Sliders,
  Maximize2,
  Clock,
  Layers,
  Sparkles,
} from 'lucide-react';

interface Props {
  project: FilmProject;
  onUpdateProject: (p: FilmProject) => void;
  onNavigateToTab: (tab: string) => void;
}

export const TimelineWorkstation: React.FC<Props> = ({
  project,
  onUpdateProject,
  onNavigateToTab,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playheadTime, setPlayheadTime] = useState(45);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [selectedClipId, setSelectedClipId] = useState<string | null>(project.timelineClips[0]?.id || null);

  const totalDuration = project.durationSeconds || 300;
  const selectedClip = project.timelineClips.find((c) => c.id === selectedClipId);

  // Group clips by track
  const v1Clips = project.timelineClips.filter((c) => c.trackId === 'V1');
  const a1Clips = project.timelineClips.filter((c) => c.trackId === 'A1');
  const a2Clips = project.timelineClips.filter((c) => c.trackId === 'A2');
  const a3Clips = project.timelineClips.filter((c) => c.trackId === 'A3');
  const a4Clips = project.timelineClips.filter((c) => c.trackId === 'A4');

  const formatTimecode = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const frames = Math.floor((seconds % 1) * 24);
    return `00:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}:${frames.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Timeline Header Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-sky-900/30 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Film className="w-5 h-5 text-sky-400" />
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white tracking-wide">
              Multitrack Timeline Editor
            </h1>
            <p className="text-xs text-slate-300">
              {project.timelineClips.length} Media Clips • 6 Tracks (2 Video, 4 Audio) • 24.000 FPS Timebase
            </p>
          </div>
        </div>

        {/* Transport & Zoom Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-3.5 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs flex items-center gap-1.5 shadow"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 fill-white" /> : <Play className="w-3.5 h-3.5 fill-white" />}
            <span>{isPlaying ? 'PAUSE' : 'PLAY'}</span>
          </button>

          <div className="px-3 py-1.5 rounded-lg bg-black/60 border border-slate-800 text-xs font-mono-code text-amber-300">
            {formatTimecode(playheadTime)}
          </div>

          <div className="flex items-center gap-1 bg-black/50 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setZoomLevel(Math.max(0.6, zoomLevel - 0.2))}
              className="p-1 text-slate-400 hover:text-white"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono-code text-slate-300 px-1">{Math.round(zoomLevel * 100)}%</span>
            <button
              onClick={() => setZoomLevel(Math.min(2.0, zoomLevel + 0.2))}
              className="p-1 text-slate-400 hover:text-white"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Multitrack Canvas Container */}
      <div className="glass-panel rounded-2xl border border-sky-900/30 overflow-hidden shadow-2xl">
        {/* Timecode Ruler */}
        <div className="h-8 bg-black/70 border-b border-slate-800 flex items-center px-28 select-none relative overflow-x-auto">
          <div className="flex justify-between w-full text-[10px] font-mono-code text-slate-400">
            <span>00:00:00:00</span>
            <span>00:01:00:00</span>
            <span>00:02:00:00</span>
            <span>00:03:00:00</span>
            <span>00:04:00:00</span>
            <span>00:05:00:00 (5 MIN)</span>
          </div>

          {/* Scrubber Playhead indicator */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-amber-400 shadow-[0_0_10px_#f59e0b] pointer-events-none z-30"
            style={{ left: `calc(112px + ${(playheadTime / totalDuration) * 85}%)` }}
          />
        </div>

        {/* Tracks List */}
        <div className="divide-y divide-slate-800/80 bg-[#060912]">
          {/* Track V1: Main Video Scenes */}
          <div className="flex h-16 items-center">
            <div className="w-28 flex-shrink-0 px-3 py-2 bg-black/60 border-r border-slate-800 flex flex-col justify-center text-xs">
              <span className="font-bold text-sky-400">V1 MAIN</span>
              <span className="text-[10px] text-slate-400">Cinematic</span>
            </div>
            <div className="flex-1 h-full p-1.5 relative flex gap-1 overflow-x-auto">
              {v1Clips.map((clip) => {
                const isSelected = selectedClipId === clip.id;
                const widthPct = (clip.duration / totalDuration) * 100;
                return (
                  <div
                    key={clip.id}
                    onClick={() => {
                      setSelectedClipId(clip.id);
                      setPlayheadTime(clip.startTime);
                    }}
                    style={{ width: `${Math.max(12, widthPct)}%` }}
                    className={`h-full rounded-lg px-2.5 py-1.5 flex flex-col justify-between cursor-pointer transition-all border ${
                      isSelected
                        ? 'border-sky-300 bg-sky-600/70 shadow-lg text-white font-semibold'
                        : 'border-sky-800/40 bg-sky-950/40 hover:bg-sky-900/40 text-sky-200'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] truncate">
                      <span className="truncate">{clip.label}</span>
                      <span className="font-mono-code text-[10px] opacity-80">{clip.duration}s</span>
                    </div>
                    <div className="text-[9px] text-sky-300/80 uppercase font-mono-code">
                      {clip.transitionIn || 'CUT'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Track A1: Master Score */}
          <div className="flex h-12 items-center">
            <div className="w-28 flex-shrink-0 px-3 py-2 bg-black/60 border-r border-slate-800 flex flex-col justify-center text-xs">
              <span className="font-bold text-indigo-400">A1 SCORE</span>
              <span className="text-[10px] text-slate-400">Orchestral</span>
            </div>
            <div className="flex-1 h-full p-1 relative flex gap-1">
              {a1Clips.map((clip) => (
                <div
                  key={clip.id}
                  onClick={() => setSelectedClipId(clip.id)}
                  style={{ width: '100%' }}
                  className="h-full rounded bg-indigo-950/60 border border-indigo-700/50 hover:bg-indigo-900/50 px-2 flex items-center justify-between text-indigo-200 text-xs cursor-pointer"
                >
                  <span className="truncate">{clip.label}</span>
                  <span className="font-mono-code text-[10px]">{clip.duration}s</span>
                </div>
              ))}
            </div>
          </div>

          {/* Track A2: Ambience (Thunderstorm) */}
          <div className="flex h-12 items-center">
            <div className="w-28 flex-shrink-0 px-3 py-2 bg-black/60 border-r border-slate-800 flex flex-col justify-center text-xs">
              <span className="font-bold text-cyan-400">A2 ATMO</span>
              <span className="text-[10px] text-slate-400">Rain & Gale</span>
            </div>
            <div className="flex-1 h-full p-1 relative flex gap-1">
              {a2Clips.map((clip) => (
                <div
                  key={clip.id}
                  onClick={() => setSelectedClipId(clip.id)}
                  style={{ width: '85%' }}
                  className="h-full rounded bg-cyan-950/60 border border-cyan-700/50 hover:bg-cyan-900/50 px-2 flex items-center justify-between text-cyan-200 text-xs cursor-pointer"
                >
                  <span className="truncate">{clip.label}</span>
                  <span className="font-mono-code text-[10px]">{clip.duration}s</span>
                </div>
              ))}
            </div>
          </div>

          {/* Track A3: Foley & Footsteps */}
          <div className="flex h-12 items-center">
            <div className="w-28 flex-shrink-0 px-3 py-2 bg-black/60 border-r border-slate-800 flex flex-col justify-center text-xs">
              <span className="font-bold text-emerald-400">A3 FOLEY</span>
              <span className="text-[10px] text-slate-400">Footsteps</span>
            </div>
            <div className="flex-1 h-full p-1 relative flex gap-1">
              {a3Clips.map((clip) => (
                <div
                  key={clip.id}
                  onClick={() => setSelectedClipId(clip.id)}
                  style={{ width: '70%', marginLeft: '15%' }}
                  className="h-full rounded bg-emerald-950/60 border border-emerald-700/50 hover:bg-emerald-900/50 px-2 flex items-center justify-between text-emerald-200 text-xs cursor-pointer"
                >
                  <span className="truncate">{clip.label}</span>
                  <span className="font-mono-code text-[10px]">{clip.duration}s</span>
                </div>
              ))}
            </div>
          </div>

          {/* Track A4: Sound Effects */}
          <div className="flex h-12 items-center">
            <div className="w-28 flex-shrink-0 px-3 py-2 bg-black/60 border-r border-slate-800 flex flex-col justify-center text-xs">
              <span className="font-bold text-amber-400">A4 SFX</span>
              <span className="text-[10px] text-slate-400">Lightning/Relic</span>
            </div>
            <div className="flex-1 h-full p-1 relative flex gap-1">
              {a4Clips.map((clip) => (
                <div
                  key={clip.id}
                  onClick={() => setSelectedClipId(clip.id)}
                  style={{ width: '35%', marginLeft: '65%' }}
                  className="h-full rounded bg-amber-950/60 border border-amber-700/50 hover:bg-amber-900/50 px-2 flex items-center justify-between text-amber-200 text-xs cursor-pointer"
                >
                  <span className="truncate">{clip.label}</span>
                  <span className="font-mono-code text-[10px]">{clip.duration}s</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Clip Inspector Card */}
      {selectedClip && (
        <div className="glass-panel p-5 rounded-2xl border border-sky-800/30 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400">Selected Clip Inspector</span>
            <div className="text-sm font-bold text-white mt-0.5">{selectedClip.label}</div>
            <div className="text-slate-400 text-xs mt-0.5">
              Track: {selectedClip.trackId} • In: {selectedClip.startTime}s • Out: {selectedClip.startTime + selectedClip.duration}s • Duration: {selectedClip.duration}s
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateToTab('VIDEO STUDIO')}
              className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs shadow"
            >
              Preview Clip in Studio →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
