/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Plus,
  Volume2,
  Video,
  Camera,
  User,
  Sun,
  Layers,
  Sparkles,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import type { StoryboardScene } from '../../types/film';

interface MultiTrackTimelineProps {
  storyboard: StoryboardScene[];
  activeScene: StoryboardScene;
  onSelectScene: (scene: StoryboardScene) => void;
  currentTimeSec: number;
  totalDurationSec: number;
  onSeek: (timeSec: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onAddKeyframe?: () => void;
}

export const MultiTrackTimeline: React.FC<MultiTrackTimelineProps> = ({
  storyboard,
  activeScene,
  onSelectScene,
  currentTimeSec,
  totalDurationSec,
  onSeek,
  isPlaying,
  onTogglePlay,
  onAddKeyframe,
}) => {
  const rulerRef = useRef<HTMLDivElement>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Convert time to percentage on ruler
  const duration = Math.max(1, totalDurationSec);
  const playheadPercent = Math.min(100, Math.max(0, (currentTimeSec / duration) * 100));

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!rulerRef.current) return;
    const rect = rulerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(pct * duration);
  };

  const formatSec = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = Math.floor(s % 60);
    const frames = Math.floor((s % 1) * 24);
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}:${String(frames).padStart(2, '0')}`;
  };

  if (isCollapsed) {
    return (
      <div className="h-8 bg-[#070b14] border-t border-slate-800/80 px-3 flex items-center justify-between text-xs text-slate-400 select-none">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCollapsed(false)}
            className="hover:text-white p-1 rounded bg-slate-800/50 flex items-center gap-1 text-[11px]"
          >
            <Maximize2 className="w-3 h-3 text-sky-400" />
            <span>Show Animation Timeline</span>
          </button>
          <span className="font-mono-code text-sky-400 font-bold">{formatSec(currentTimeSec)}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onTogglePlay} className="p-1 hover:text-white">
            {isPlaying ? <Pause className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
          </button>
        </div>
      </div>
    );
  }

  return (
    <footer className="h-56 bg-[#070b14] border-t border-slate-800/80 flex flex-col shrink-0 select-none text-xs">
      {/* Timeline Controls Header */}
      <div className="h-9 px-3 border-b border-slate-800/80 flex items-center justify-between bg-black/40 text-slate-300">
        <div className="flex items-center gap-3">
          {/* Transport buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onSeek(0)}
              title="Return to Start"
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onTogglePlay}
              title="Play / Pause (Space)"
              className="p-1.5 rounded bg-sky-500/20 hover:bg-sky-500/30 border border-sky-400/40 text-sky-300 transition-colors"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            </button>
            <button
              onClick={() => onSeek(duration)}
              title="Go to End"
              className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Timecode display */}
          <div className="flex items-center gap-2 font-mono-code text-[11px] px-2 py-0.5 rounded bg-black/60 border border-slate-800">
            <span className="text-sky-400 font-bold">{formatSec(currentTimeSec)}</span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-400">{formatSec(duration)}</span>
            <span className="text-slate-500 text-[10px]">24 FPS</span>
          </div>

          {/* Insert Keyframe */}
          <button
            onClick={onAddKeyframe}
            className="px-2 py-1 rounded bg-slate-800/80 hover:bg-sky-600/30 border border-slate-700 text-slate-300 hover:text-sky-300 font-medium text-[10px] flex items-center gap-1 transition-colors"
            title="Insert Keyframe at Playhead [K]"
          >
            <Plus className="w-3 h-3 text-sky-400" />
            <span>Keyframe [K]</span>
          </button>
        </div>

        {/* Track Legend & Collapse */}
        <div className="flex items-center gap-3 text-[10px] text-slate-400">
          <div className="hidden sm:flex items-center gap-2 font-mono-code">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-500" /> V1 Video</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> CAM Rig</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Actor</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-500" /> Audio</span>
          </div>
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1 hover:text-white"
            title="Collapse Timeline"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Track Sequencer Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Track Headers Column */}
        <div className="w-36 bg-[#090d16] border-r border-slate-800/80 flex flex-col shrink-0 select-none text-[11px]">
          <div className="h-6 border-b border-slate-800/80 px-2 flex items-center text-[10px] text-slate-500 font-mono-code bg-black/20">
            TRACKS
          </div>
          <div className="h-9 border-b border-slate-800/40 px-2 flex items-center gap-1.5 text-sky-300 bg-sky-950/20">
            <Video className="w-3.5 h-3.5" />
            <span className="font-semibold text-[10px]">V1: Scenes</span>
          </div>
          <div className="h-8 border-b border-slate-800/40 px-2 flex items-center gap-1.5 text-amber-300 bg-amber-950/10">
            <Camera className="w-3.5 h-3.5" />
            <span className="font-semibold text-[10px]">CAM: Movement</span>
          </div>
          <div className="h-8 border-b border-slate-800/40 px-2 flex items-center gap-1.5 text-emerald-300 bg-emerald-950/10">
            <User className="w-3.5 h-3.5" />
            <span className="font-semibold text-[10px]">ACT: Hero Rig</span>
          </div>
          <div className="h-8 border-b border-slate-800/40 px-2 flex items-center gap-1.5 text-indigo-300 bg-indigo-950/10">
            <Volume2 className="w-3.5 h-3.5" />
            <span className="font-semibold text-[10px]">A1: Atmosphere</span>
          </div>
        </div>

        {/* Tracks Timeline Canvas Area */}
        <div
          ref={rulerRef}
          onClick={handleTimelineClick}
          className="flex-1 relative bg-[#050810] flex flex-col overflow-x-hidden cursor-crosshair"
        >
          {/* Time Ruler */}
          <div className="h-6 border-b border-slate-800/80 bg-black/40 flex items-center relative select-none">
            {Array.from({ length: 11 }).map((_, i) => {
              const tickPct = (i / 10) * 100;
              const tickSec = (i / 10) * duration;
              return (
                <div
                  key={i}
                  style={{ left: `${tickPct}%` }}
                  className="absolute top-0 bottom-0 flex flex-col justify-between"
                >
                  <span className="text-[9px] font-mono-code text-slate-500 transform -translate-x-1/2">
                    {formatSec(tickSec)}
                  </span>
                  <div className="w-px h-2 bg-slate-700" />
                </div>
              );
            })}
          </div>

          {/* Red Playhead Vertical Needle */}
          <div
            style={{ left: `${playheadPercent}%` }}
            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-30 pointer-events-none"
          >
            <div className="w-2.5 h-3 bg-red-500 transform -translate-x-1/2 rounded-b shadow-sm shadow-red-500/50" />
          </div>

          {/* Track 1: Scene Clips */}
          <div className="h-9 border-b border-slate-800/40 flex items-center px-1 relative">
            {storyboard.map((scene, idx) => {
              const sceneWidthPct = (scene.durationSeconds / duration) * 100;
              const isSelected = activeScene.id === scene.id;
              return (
                <div
                  key={scene.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectScene(scene);
                  }}
                  style={{ width: `${sceneWidthPct}%` }}
                  className={`h-7 mx-0.5 rounded px-2 flex items-center justify-between text-[10px] font-medium border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-sky-600/40 border-sky-400 text-white shadow-sm'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span className="truncate">Scene {scene.sceneNumber}: {scene.title}</span>
                  <span className="font-mono-code text-[9px] text-sky-400">{scene.durationSeconds}s</span>
                </div>
              );
            })}
          </div>

          {/* Track 2: Camera Movement Keyframes */}
          <div className="h-8 border-b border-slate-800/40 flex items-center px-2 relative bg-amber-950/5">
            <div className="w-full h-2 rounded-full bg-slate-900/60 relative">
              {[0.1, 0.35, 0.65, 0.95].map((pct, idx) => (
                <div
                  key={idx}
                  style={{ left: `${pct * 100}%` }}
                  className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rotate-45 bg-amber-400 border border-black shadow"
                  title={`Camera Keyframe at ${Math.round(pct * duration)}s`}
                />
              ))}
            </div>
          </div>

          {/* Track 3: Actor Keyframes */}
          <div className="h-8 border-b border-slate-800/40 flex items-center px-2 relative bg-emerald-950/5">
            <div className="w-full h-2 rounded-full bg-slate-900/60 relative">
              {[0.0, 0.45, 0.8].map((pct, idx) => (
                <div
                  key={idx}
                  style={{ left: `${pct * 100}%` }}
                  className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rotate-45 bg-emerald-400 border border-black shadow"
                  title={`Hero Rig Keyframe at ${Math.round(pct * duration)}s`}
                />
              ))}
            </div>
          </div>

          {/* Track 4: Audio Track Waveform Simulation */}
          <div className="h-8 border-b border-slate-800/40 flex items-center px-2 relative bg-indigo-950/10">
            <div className="w-full h-5 flex items-center gap-0.5 opacity-60">
              {Array.from({ length: 64 }).map((_, idx) => (
                <div
                  key={idx}
                  style={{ height: `${20 + Math.sin(idx * 0.4) * 50 + (idx % 5) * 6}%` }}
                  className="flex-1 bg-indigo-500/70 rounded-full"
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
