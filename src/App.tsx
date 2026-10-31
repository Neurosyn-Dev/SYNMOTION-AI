/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import type { FilmProject, StoryboardScene, ProductionDuration, AspectRatio, OutputQuality } from './types/film';
import { CreateWorkstation } from './components/workstations/CreateWorkstation';
import { StoryboardWorkstation } from './components/workstations/StoryboardWorkstation';
import { VideoStudioWorkstation } from './components/workstations/VideoStudioWorkstation';
import { Procedural3DStudio } from './components/studio3d/Procedural3DStudio';
import { DirectorsCutWorkstation } from './components/workstations/DirectorsCutWorkstation';
import { TimelineWorkstation } from './components/workstations/TimelineWorkstation';
import { VisualDnaWorkstation } from './components/workstations/VisualDnaWorkstation';
import { ReferenceLibraryWorkstation } from './components/workstations/ReferenceLibraryWorkstation';
import { CharacterLabWorkstation } from './components/workstations/CharacterLabWorkstation';
import { AudioStudioWorkstation } from './components/workstations/AudioStudioWorkstation';
import { SettingsWorkstation } from './components/workstations/SettingsWorkstation';
import { ExportModal } from './components/modals/ExportModal';

import {
  Sparkles,
  Clapperboard,
  Film,
  Video,
  Box,
  Scissors,
  SlidersHorizontal,
  Layers,
  Image as ImageIcon,
  Volume2,
  User,
  Settings,
  Download,
  Clock,
  Play,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';

const TABS = [
  { id: 'CREATE', label: 'CREATE', icon: Sparkles },
  { id: 'STORYBOARD', label: 'STORYBOARD', icon: Film },
  { id: 'VIDEO STUDIO', label: 'VIDEO STUDIO', icon: Video },
  { id: '3D STUDIO', label: '3D STUDIO', icon: Box },
  { id: "DIRECTOR'S CUT", label: "DIRECTOR'S CUT", icon: Scissors },
  { id: 'TIMELINE', label: 'TIMELINE', icon: SlidersHorizontal },
  { id: 'VISUAL DNA', label: 'VISUAL DNA', icon: Layers },
  { id: 'REFERENCE LIBRARY', label: 'REFERENCES', icon: ImageIcon },
  { id: 'AUDIO STUDIO', label: 'AUDIO STUDIO', icon: Volume2 },
  { id: 'CHARACTER LAB', label: 'CHARACTER LAB', icon: User },
  { id: 'SETTINGS', label: 'SETTINGS', icon: Settings },
];

export default function App() {
  const [project, setProject] = useState<FilmProject | null>(null);
  const [activeTab, setActiveTab] = useState<string>('CREATE');
  const [activeScene, setActiveScene] = useState<StoryboardScene | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Load initial project from server or fallback
  useEffect(() => {
    fetch('/api/projects')
      .then((res) => res.json())
      .then((data) => {
        if (data.projects && data.projects.length > 0) {
          fetch(`/api/projects/${data.projects[0].id}`)
            .then((r) => r.json())
            .then((projData) => {
              if (projData.project) {
                setProject(projData.project);
                setActiveScene(projData.project.storyboard[0] || null);
              }
            });
        }
      })
      .catch((err) => {
        console.error('Failed to load project from server:', err);
      });
  }, []);

  const handleStartOrchestration = async (
    prompt: string,
    duration: ProductionDuration,
    aspectRatio: AspectRatio,
    quality: OutputQuality
  ) => {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/director/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          duration,
          aspectRatio,
          quality,
          imageReferences: project?.imageReferences || [],
          videoReferences: project?.videoReferences || [],
        }),
      });

      const data = await res.json();
      if (data.success && data.project) {
        setProject(data.project);
        setActiveScene(data.project.storyboard[0] || null);
        setActiveTab('STORYBOARD');
      }
    } catch (err) {
      console.error('Orchestration error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateProject = (updated: FilmProject) => {
    setProject(updated);
    fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    }).catch(console.error);
  };

  if (!project) {
    return (
      <div className="min-h-screen bg-[#05070d] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono-code text-sky-300">INITIALIZING SYNMOTION AI STUDIO...</span>
        </div>
      </div>
    );
  }

  const currentScene = activeScene || project.storyboard[0];

  return (
    <div className="min-h-screen bg-[#05070d] text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      {/* Top Global Studio Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[#070b14]/90 backdrop-blur-xl border-b border-sky-900/30 px-4 sm:px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
              <Clapperboard className="w-5 h-5 text-white" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-wider text-white font-cinematic">
                  SYNMOTION AI
                </span>
                <span className="px-2 py-0.5 rounded-full bg-sky-950 border border-sky-500/40 text-[10px] font-mono-code font-bold text-sky-400">
                  STUDIO PRO
                </span>
              </div>
              <span className="text-[10px] text-slate-400 hidden sm:block">
                Autonomous AI Filmmaking & Procedural Animation
              </span>
            </div>
          </div>

          {/* Active Production Info */}
          <div className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-xl bg-black/40 border border-slate-800 text-xs">
            <span className="font-semibold text-slate-200 truncate max-w-xs">{project.title}</span>
            <span className="w-1 h-1 rounded-full bg-slate-600" />
            <span className="font-mono-code text-amber-300 font-bold flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>
                {Math.floor(project.durationSeconds / 60)}:00 ({project.durationTarget})
              </span>
            </span>
            <span className="w-1 h-1 rounded-full bg-slate-600" />
            <span className="text-slate-400 uppercase text-[10px] font-mono-code">
              {project.aspectRatio} • {project.quality}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsExportModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-xs tracking-wide shadow-lg shadow-sky-500/20 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span>EXPORT FILM</span>
            </button>
          </div>
        </div>

        {/* Workstation Tabs Strip */}
        <div className="max-w-7xl mx-auto mt-2 pt-2 border-t border-slate-800/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wider whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-400/50 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-sky-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Workspace Body */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        {activeTab === 'CREATE' && (
          <CreateWorkstation
            project={project}
            onUpdateProject={handleUpdateProject}
            onStartOrchestration={handleStartOrchestration}
            isGenerating={isGenerating}
            onNavigateToTab={setActiveTab}
          />
        )}

        {activeTab === 'STORYBOARD' && (
          <StoryboardWorkstation
            project={project}
            onUpdateProject={handleUpdateProject}
            onSelectSceneForStudio={(scene) => {
              setActiveScene(scene);
              setActiveTab('3D STUDIO');
            }}
            onNavigateToTab={setActiveTab}
          />
        )}

        {activeTab === 'VIDEO STUDIO' && (
          <VideoStudioWorkstation
            project={project}
            activeScene={currentScene}
            onSelectScene={setActiveScene}
            onNavigateToTab={setActiveTab}
          />
        )}

        {activeTab === '3D STUDIO' && (
          <div className="max-w-7xl mx-auto space-y-6 pb-12">
            <div className="glass-panel p-4 rounded-2xl border border-sky-900/30 flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold text-white">Procedural 3D WebGL Studio</h1>
                <p className="text-xs text-slate-300">
                  Real-time physics, dynamic rain particles, cinematic camera rigs, and composite 3D actor meshes.
                </p>
              </div>

              {/* Scene Switcher */}
              <select
                value={currentScene.id}
                onChange={(e) => {
                  const s = project.storyboard.find((item) => item.id === e.target.value);
                  if (s) setActiveScene(s);
                }}
                className="bg-black/60 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200"
              >
                {project.storyboard.map((s) => (
                  <option key={s.id} value={s.id}>
                    Scene {s.sceneNumber}: {s.title}
                  </option>
                ))}
              </select>
            </div>

            <Procedural3DStudio
              config={currentScene.procedural3DConfig}
              sceneTitle={`Scene ${currentScene.sceneNumber}: ${currentScene.title}`}
              durationSeconds={currentScene.durationSeconds}
            />
          </div>
        )}

        {activeTab === "DIRECTOR'S CUT" && (
          <DirectorsCutWorkstation
            project={project}
            onUpdateProject={handleUpdateProject}
            onNavigateToTab={setActiveTab}
          />
        )}

        {activeTab === 'TIMELINE' && (
          <TimelineWorkstation
            project={project}
            onUpdateProject={handleUpdateProject}
            onNavigateToTab={setActiveTab}
          />
        )}

        {activeTab === 'VISUAL DNA' && (
          <VisualDnaWorkstation
            project={project}
            onUpdateProject={handleUpdateProject}
            onNavigateToTab={setActiveTab}
          />
        )}

        {activeTab === 'REFERENCE LIBRARY' && (
          <ReferenceLibraryWorkstation
            project={project}
            onUpdateProject={handleUpdateProject}
          />
        )}

        {activeTab === 'AUDIO STUDIO' && (
          <AudioStudioWorkstation
            project={project}
            onUpdateProject={handleUpdateProject}
          />
        )}

        {activeTab === 'CHARACTER LAB' && (
          <CharacterLabWorkstation
            project={project}
            onUpdateProject={handleUpdateProject}
          />
        )}

        {activeTab === 'SETTINGS' && (
          <SettingsWorkstation
            project={project}
            onUpdateProject={handleUpdateProject}
          />
        )}
      </main>

      {/* Export Production Master Modal */}
      <ExportModal
        project={project}
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
    </div>
  );
}
