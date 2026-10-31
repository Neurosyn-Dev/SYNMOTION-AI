/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import type { FilmProject, StoryboardScene } from '../../types/film';
import { Procedural3DStudio } from '../studio3d/Procedural3DStudio';
import {
  Film,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize2,
  Sliders,
  Sparkles,
  Layers,
  Camera,
  CheckCircle2,
  Download,
  Share2,
} from 'lucide-react';
import { audioEngine } from '../../utils/audioEngine';

interface Props {
  project: FilmProject;
  activeScene: StoryboardScene;
  onSelectScene: (scene: StoryboardScene) => void;
  onNavigateToTab: (tab: string) => void;
  onUpdateProject?: (p: FilmProject) => void;
}

export const VideoStudioWorkstation: React.FC<Props> = ({
  project,
  activeScene,
  onSelectScene,
  onNavigateToTab,
  onUpdateProject,
}) => {
  const [isPlaying, setIsPlaying] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState<'procedural_3d' | 'veo' | 'runway'>('procedural_3d');
  const [takeVariation, setTakeVariation] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'3d_viewport' | 'rendered_video'>('3d_viewport');
  const [isRenderingServer, setIsRenderingServer] = useState(false);

  const currentIndex = project.storyboard.findIndex((s) => s.id === activeScene.id);

  const handlePrev = () => {
    if (currentIndex > 0) {
      onSelectScene(project.storyboard[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (currentIndex < project.storyboard.length - 1) {
      onSelectScene(project.storyboard[currentIndex + 1]);
    }
  };

  const handleRecordingComplete = (assetUrl: string) => {
    const updatedStoryboard = project.storyboard.map((s) => {
      if (s.id === activeScene.id) {
        return {
          ...s,
          generatedVideoUrl: assetUrl,
          status: 'COMPLETED' as const,
        };
      }
      return s;
    });

    const updated = {
      ...project,
      storyboard: updatedStoryboard,
    };
    onUpdateProject?.(updated);
  };

  const handleTriggerServerRender = async () => {
    setIsRenderingServer(true);
    try {
      const res = await fetch(`/api/scenes/${activeScene.id}/render`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: project.id }),
      });
      const data = await res.json();
      if (!data.success || !data.job) {
        throw new Error(data.error || 'Failed to dispatch render job');
      }

      const jobId = data.job.id;
      const poll = setInterval(async () => {
        try {
          const pollRes = await fetch(`/api/jobs/${jobId}`);
          const pollData = await pollRes.json();
          if (pollData.success && pollData.job) {
            if (pollData.job.status === 'COMPLETED') {
              clearInterval(poll);
              setIsRenderingServer(false);
              const pRes = await fetch(`/api/projects/${project.id}`);
              const pData = await pRes.json();
              if (pData.success && pData.project) {
                onUpdateProject?.(pData.project);
              }
            } else if (pollData.job.status === 'FAILED') {
              clearInterval(poll);
              setIsRenderingServer(false);
            }
          }
        } catch {
          clearInterval(poll);
          setIsRenderingServer(false);
        }
      }, 1500);
    } catch {
      setIsRenderingServer(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Studio Monitor Top Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-sky-900/30 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sky-950 border border-sky-500/40 flex items-center justify-center text-sky-400 font-bold font-mono-code text-sm">
            #{activeScene.sceneNumber}
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold text-white tracking-wide">{activeScene.title}</h1>
            <p className="text-xs text-slate-300">
              Duration: {activeScene.durationSeconds}s • Format: {project.aspectRatio} • {project.quality}
            </p>
          </div>
        </div>

        {/* Viewport Mode Switcher & Server Render Action */}
        <div className="flex items-center gap-2">
          {activeScene.generatedVideoUrl && (
            <div className="flex gap-1 bg-black/60 p-1 rounded-lg border border-slate-800 text-xs mr-2">
              <button
                onClick={() => setViewMode('3d_viewport')}
                className={`px-2.5 py-1 rounded transition-all ${
                  viewMode === '3d_viewport' ? 'bg-sky-500 text-white font-bold' : 'text-slate-400'
                }`}
              >
                3D WebGL
              </button>
              <button
                onClick={() => setViewMode('rendered_video')}
                className={`px-2.5 py-1 rounded transition-all ${
                  viewMode === 'rendered_video' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400'
                }`}
              >
                Rendered Video
              </button>
            </div>
          )}

          <button
            disabled={isRenderingServer}
            onClick={handleTriggerServerRender}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-all shadow ${
              isRenderingServer
                ? 'bg-sky-950 border-sky-500/50 text-sky-300 animate-pulse'
                : 'bg-indigo-600 hover:bg-indigo-500 border-indigo-400/50 text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isRenderingServer ? 'Rendering Scene...' : 'Render Scene (Server)'}</span>
          </button>
        </div>
      </div>

      {/* Primary Cinematic Viewport with Procedural Three.js Engine or Rendered Video */}
      <div className="relative">
        {viewMode === 'rendered_video' && activeScene.generatedVideoUrl ? (
          <div className="w-full h-[620px] rounded-2xl overflow-hidden glass-panel border border-sky-900/30 shadow-2xl flex flex-col bg-black">
            <video
              src={activeScene.generatedVideoUrl}
              controls
              autoPlay
              className="w-full h-full object-contain"
            />
          </div>
        ) : (
          <Procedural3DStudio
            config={activeScene.procedural3DConfig}
            sceneTitle={`Scene ${activeScene.sceneNumber}: ${activeScene.title}`}
            durationSeconds={activeScene.durationSeconds}
            projectId={project.id}
            sceneId={activeScene.id}
            onRecordingComplete={handleRecordingComplete}
          />
        )}
      </div>

      {/* Cinematic Playback & Scrubber Controls */}
      <div className="glass-panel p-4 rounded-2xl border border-sky-900/30 space-y-4">
        {/* Scene Thumbnails / Scrubber */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>SCENE TIMELINE SCRUBBER</span>
            <span className="font-mono-code text-sky-400">
              Active Scene {currentIndex + 1} of {project.storyboard.length}
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {project.storyboard.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => onSelectScene(s)}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  s.id === activeScene.id
                    ? 'border-sky-400 bg-sky-950/60 shadow-lg shadow-sky-500/20'
                    : 'border-slate-800 bg-black/40 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] mb-1 font-mono-code">
                  <span className="font-bold text-sky-300">SCENE {idx + 1}</span>
                  <span className="text-slate-400">{s.durationSeconds}s</span>
                </div>
                <div className="text-xs text-slate-200 font-semibold truncate">{s.title}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Master Transport Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              disabled={currentIndex === 0}
              className="p-2 rounded-lg bg-black/50 hover:bg-slate-800 border border-slate-700 text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs flex items-center gap-2 shadow"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
              <span>{isPlaying ? 'PAUSE PREVIEW' : 'PLAY PREVIEW'}</span>
            </button>
            <button
              onClick={handleNext}
              disabled={currentIndex === project.storyboard.length - 1}
              className="p-2 rounded-lg bg-black/50 hover:bg-slate-800 border border-slate-700 text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <SkipForward className="w-4 h-4" />
            </button>

            <span className="text-xs font-mono-code text-slate-300 ml-2">
              TC 00:0{currentIndex * 45}:00 / 00:05:00:00 (24 FPS)
            </span>
          </div>

          {/* Takes Variations */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400 font-medium">TAKE:</span>
            <div className="flex gap-1">
              {[1, 2, 3].map((t) => (
                <button
                  key={t}
                  onClick={() => setTakeVariation(t)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono-code ${
                    takeVariation === t
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'bg-black/40 text-slate-400 hover:text-white border border-slate-800'
                  }`}
                >
                  Take {t}
                </button>
              ))}
            </div>

            <button
              onClick={() => onNavigateToTab('TIMELINE')}
              className="ml-4 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-medium text-slate-200"
            >
              Edit in Multitrack Timeline →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
