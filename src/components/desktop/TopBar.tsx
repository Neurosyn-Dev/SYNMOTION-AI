/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Clapperboard,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  RotateCw,
  Download,
  Film,
  Sparkles,
  Sliders,
  Box,
  User,
  Camera,
  Code2,
  GitBranch,
  Volume2,
  CheckCircle2,
  Layers,
  Settings,
  Scissors,
} from 'lucide-react';
import type { FilmProject, ProductionDuration, AspectRatio, OutputQuality } from '../../types/film';

export type WorkspaceId =
  | 'DIRECTOR'
  | '3D_STUDIO'
  | 'CHARACTER_LAB'
  | 'ANIMATION'
  | 'CINEMATOGRAPHY'
  | 'SCRIPTING'
  | 'NODE_EDITOR'
  | 'AUDIO_STUDIO'
  | 'STORYBOARD'
  | 'RENDER_JOBS'
  | 'SETTINGS';

interface TopBarProps {
  project: FilmProject;
  activeWorkspace: WorkspaceId;
  onSelectWorkspace: (ws: WorkspaceId) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  currentTimeSec: number;
  totalDurationSec: number;
  onOpenExportModal: () => void;
  onRenderMasterCut: () => void;
  isRenderingMaster: boolean;
  onUpdateProjectTitle?: (newTitle: string) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  project,
  activeWorkspace,
  onSelectWorkspace,
  isPlaying,
  onTogglePlay,
  currentTimeSec,
  totalDurationSec,
  onOpenExportModal,
  onRenderMasterCut,
  isRenderingMaster,
  onUpdateProjectTitle,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
}) => {
  // Format timecode into HH:MM:SS:FF at 24fps
  const formatTimecode = (sec: number) => {
    const totalFrames = Math.floor(sec * 24);
    const frames = totalFrames % 24;
    const s = Math.floor(sec) % 60;
    const m = Math.floor(sec / 60) % 60;
    const h = Math.floor(sec / 3600);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}:${String(frames).padStart(2, '0')}`;
  };

  const WORKSPACES: { id: WorkspaceId; label: string; icon: any }[] = [
    { id: 'DIRECTOR', label: 'Director', icon: Sparkles },
    { id: '3D_STUDIO', label: '3D Viewport', icon: Box },
    { id: 'CHARACTER_LAB', label: 'Characters', icon: User },
    { id: 'ANIMATION', label: 'Animation', icon: Sliders },
    { id: 'CINEMATOGRAPHY', label: 'Cameras', icon: Camera },
    { id: 'SCRIPTING', label: 'Scripting', icon: Code2 },
    { id: 'NODE_EDITOR', label: 'Node Graph', icon: GitBranch },
    { id: 'AUDIO_STUDIO', label: 'Audio', icon: Volume2 },
    { id: 'STORYBOARD', label: 'Storyboard', icon: Film },
    { id: 'RENDER_JOBS', label: 'Render Queue', icon: Layers },
  ];

  return (
    <header className="h-14 bg-[#070b14] border-b border-sky-950/60 select-none flex items-center justify-between px-3 text-xs text-slate-300 z-50 shrink-0">
      {/* Brand & Project Metadata */}
      <div className="flex items-center gap-3 min-w-[240px]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center shadow-md shadow-sky-500/20 text-white font-bold">
            <Clapperboard className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-xs tracking-wider text-white font-cinematic">
                SYNMOTION
              </span>
              <span className="px-1.5 py-0.2 rounded bg-sky-950/80 border border-sky-500/30 text-[9px] font-mono-code font-bold text-sky-400">
                PRO 3D
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
              <input
                type="text"
                defaultValue={project.title}
                onBlur={(e) => onUpdateProjectTitle?.(e.target.value)}
                className="bg-transparent hover:bg-slate-900/60 focus:bg-slate-900 px-1 py-0.5 rounded text-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500/50 truncate max-w-[140px]"
              />
              <span className="w-1 h-1 rounded-full bg-emerald-500 inline-block" title="Persistent SQLite Synced" />
              <span className="text-[9px] text-emerald-400/80 font-mono-code">SQLite OK</span>
            </div>
          </div>
        </div>

        {/* Undo / Redo */}
        <div className="hidden lg:flex items-center gap-0.5 ml-2 border-l border-slate-800/80 pl-2 text-slate-400">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className="p-1 hover:text-white hover:bg-slate-800/50 rounded transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Shift+Z)"
            className="p-1 hover:text-white hover:bg-slate-800/50 rounded transition-colors disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Center Workspaces Switcher */}
      <div className="flex items-center gap-1 bg-black/40 border border-slate-800/80 p-0.5 rounded-lg overflow-x-auto no-scrollbar max-w-2xl">
        {WORKSPACES.map((ws) => {
          const Icon = ws.icon;
          const isActive = activeWorkspace === ws.id;
          return (
            <button
              key={ws.id}
              onClick={() => onSelectWorkspace(ws.id)}
              className={`px-2.5 py-1.5 rounded-md font-medium tracking-wide flex items-center gap-1.5 transition-all whitespace-nowrap text-[11px] ${
                isActive
                  ? 'bg-sky-500/20 text-sky-300 border border-sky-400/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-sky-400' : 'text-slate-500'}`} />
              <span>{ws.label}</span>
            </button>
          );
        })}
      </div>

      {/* Right Controls: Playback HUD & Master Render */}
      <div className="flex items-center gap-2">
        {/* Timecode & Transport */}
        <div className="hidden xl:flex items-center gap-2 px-2.5 py-1 rounded-md bg-black/60 border border-slate-800/80 font-mono-code text-[11px]">
          <button
            onClick={onTogglePlay}
            className="p-1 hover:text-sky-400 text-slate-300 transition-colors"
            title="Play / Pause (Space)"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          </button>
          <span className="text-sky-400 font-bold">{formatTimecode(currentTimeSec)}</span>
          <span className="text-slate-600">/</span>
          <span className="text-slate-400">{formatTimecode(totalDurationSec)}</span>
          <span className="px-1 py-0.2 rounded bg-slate-800 text-[9px] text-slate-400">24 FPS</span>
        </div>

        {/* Master Assembly Action */}
        <button
          onClick={onRenderMasterCut}
          disabled={isRenderingMaster}
          className="px-3 py-1.5 rounded-lg bg-sky-950 hover:bg-sky-900 border border-sky-500/40 text-sky-300 hover:text-white font-semibold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
          title="Concatenate all scenes into a zero-error master MP4 cut"
        >
          <Scissors className="w-3.5 h-3.5 text-sky-400" />
          <span>{isRenderingMaster ? 'RENDERING MASTER...' : 'ASSEMBLE CUT'}</span>
        </button>

        {/* Export Button */}
        <button
          onClick={onOpenExportModal}
          className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-[11px] shadow-sm shadow-sky-500/20 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
        >
          <Download className="w-3.5 h-3.5" />
          <span>EXPORT</span>
        </button>
      </div>
    </header>
  );
};
