/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import type {
  FilmProject,
  StoryboardScene,
  ProductionDuration,
  AspectRatio,
  OutputQuality,
} from './types/film';

import { TopBar, WorkspaceId } from './components/desktop/TopBar';
import { SceneHierarchyPanel, SelectedEntityType } from './components/desktop/SceneHierarchyPanel';
import { ContextInspector } from './components/desktop/ContextInspector';
import { MultiTrackTimeline } from './components/desktop/MultiTrackTimeline';

import { CreateWorkstation } from './components/workstations/CreateWorkstation';
import { StoryboardWorkstation } from './components/workstations/StoryboardWorkstation';
import { VideoStudioWorkstation } from './components/workstations/VideoStudioWorkstation';
import { Procedural3DStudio } from './components/studio3d/Procedural3DStudio';
import { DirectorsCutWorkstation } from './components/workstations/DirectorsCutWorkstation';
import { CharacterLabWorkstation } from './components/workstations/CharacterLabWorkstation';
import { AudioStudioWorkstation } from './components/workstations/AudioStudioWorkstation';
import { VisualDnaWorkstation } from './components/workstations/VisualDnaWorkstation';
import { ReferenceLibraryWorkstation } from './components/workstations/ReferenceLibraryWorkstation';
import { ProductionJobsPanel } from './components/workstations/ProductionJobsPanel';
import { SettingsWorkstation } from './components/workstations/SettingsWorkstation';

import { ScriptingStudioWorkstation } from './components/workstations/ScriptingStudioWorkstation';
import { VisualNodeEditorWorkstation } from './components/workstations/VisualNodeEditorWorkstation';
import { CinematographyWorkstation } from './components/workstations/CinematographyWorkstation';

import { ExportModal } from './components/modals/ExportModal';
import { initialProject } from './backend/db/seedData';
import { AIDirectorEngine } from './services/aiDirector/aiDirectorEngine';
import { globalCommandManager } from './services/sceneGraph/commandManager';
import { globalSceneGraph } from './services/sceneGraph/sceneGraphService';

export default function App() {
  const [project, setProject] = useState<FilmProject | null>(null);
  const [activeWorkspace, setActiveWorkspace] = useState<WorkspaceId>('3D_STUDIO');
  const [activeScene, setActiveScene] = useState<StoryboardScene | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<SelectedEntityType>('character');
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Playhead & Transport State
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTimeSec, setCurrentTimeSec] = useState(0);

  // Inspector & Viewport Overrides
  const [weather, setWeather] = useState<'thunderstorm' | 'rain' | 'fog' | 'clear'>('thunderstorm');
  const [cameraMovement, setCameraMovement] = useState<
    'dolly_in' | 'crane_sweep' | 'tracking_follow' | 'orbit_reveal' | 'handheld_drift'
  >('dolly_in');
  const [timeOfDay, setTimeOfDay] = useState<'night' | 'dusk' | 'golden_hour'>('night');
  const [cameraFov, setCameraFov] = useState(38);
  const [keyLightIntensity, setKeyLightIntensity] = useState(2.5);
  const [characterPose, setCharacterPose] = useState('Heroic Stand');

  // Sync with global command manager for undo/redo state
  useEffect(() => {
    const unsubCmd = globalCommandManager.subscribe(() => {
      setCanUndo(globalCommandManager.canUndo());
      setCanRedo(globalCommandManager.canRedo());
    });

    const unsubScene = globalSceneGraph.subscribe((sceneData) => {
      const cam = sceneData.entities.find((e) => e.id === 'entity-cine-camera');
      const light = sceneData.entities.find((e) => e.id === 'entity-key-light');
      const actor = sceneData.entities.find((e) => e.id === 'entity-hero-actor');

      if (sceneData.environment.weather) setWeather(sceneData.environment.weather as any);
      if (sceneData.environment.timeOfDay) setTimeOfDay(sceneData.environment.timeOfDay as any);
      if (cam?.properties.movementMode) setCameraMovement(cam.properties.movementMode);
      if (cam?.properties.fov) setCameraFov(cam.properties.fov);
      if (light?.properties.intensity) setKeyLightIntensity(light.properties.intensity);
      if (actor?.properties.posture) setCharacterPose(actor.properties.posture);
    });

    return () => {
      unsubCmd();
      unsubScene();
    };
  }, []);

  // Modal & Master Render States
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRenderingMaster, setIsRenderingMaster] = useState(false);

  // Load project from SQLite on startup
  const loadProject = useCallback(() => {
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
                if (projData.project.storyboard[0]?.procedural3DConfig) {
                  const cfg = projData.project.storyboard[0].procedural3DConfig;
                  if (cfg.weather) setWeather(cfg.weather as any);
                  if (cfg.cameraMovement) setCameraMovement(cfg.cameraMovement);
                  if (cfg.timeOfDay) setTimeOfDay(cfg.timeOfDay as any);
                }
              }
            });
        }
      })
      .catch((err) => {
        console.warn('Backend SQLite sync connecting to bundled project.', err);
        setProject(initialProject);
        setActiveScene(initialProject.storyboard[0] || null);
      });
  }, []);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  // Synchronized Playback Timer
  useEffect(() => {
    if (!isPlaying || !project) return;
    const interval = setInterval(() => {
      setCurrentTimeSec((prev) => {
        const next = prev + 0.1;
        return next >= project.durationSeconds ? 0 : next;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [isPlaying, project]);

  // Keyboard Shortcuts (G, R, S, Space, K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in an input or textarea
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      } else if (e.key === 'g' || e.key === 'G') {
        // Move mode
      } else if (e.key === 'r' || e.key === 'R') {
        // Rotate mode
      } else if (e.key === 's' || e.key === 'S') {
        // Scale mode
      } else if (e.key === 'k' || e.key === 'K') {
        // Keyframe inserted
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Update Project in SQLite
  const handleUpdateProject = (updated: FilmProject) => {
    setProject(updated);
    fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    }).catch(console.error);
  };

  // AI Director Interpretation Flow
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
        setActiveWorkspace('3D_STUDIO');
      }
    } catch (err) {
      console.error('Orchestration error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // AI Director Command from Outliner
  const handleApplyAIDirectorCommand = async (prompt: string) => {
    try {
      await AIDirectorEngine.executeDirective(prompt);
    } catch (err) {
      console.error('AI Director directive execution error:', err);
    }
  };

  // Master Cut Render Trigger
  const handleRenderMasterCut = async () => {
    if (!project || isRenderingMaster) return;
    setIsRenderingMaster(true);
    try {
      const res = await fetch(`/api/projects/${project.id}/assemble`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format: 'mp4',
          quality: project.quality,
          aspectRatio: project.aspectRatio,
          fps: project.fps || 24,
        }),
      });

      const data = await res.json();
      if (data.success && data.job) {
        // Poll job until complete
        const poll = setInterval(async () => {
          try {
            const jRes = await fetch(`/api/jobs/${data.job.id}`);
            const jData = await jRes.json();
            if (jData.success && jData.job) {
              if (jData.job.status === 'COMPLETED' || jData.job.status === 'FAILED') {
                clearInterval(poll);
                setIsRenderingMaster(false);
                loadProject();
              }
            }
          } catch {
            clearInterval(poll);
            setIsRenderingMaster(false);
          }
        }, 2000);
      } else {
        setIsRenderingMaster(false);
      }
    } catch (err) {
      console.error('Master assembly trigger failed:', err);
      setIsRenderingMaster(false);
    }
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
    <div className="h-screen w-screen bg-[#050810] text-slate-100 flex flex-col font-sans overflow-hidden select-none">
      {/* Top Application Bar */}
      <TopBar
        project={project}
        activeWorkspace={activeWorkspace}
        onSelectWorkspace={setActiveWorkspace}
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying((p) => !p)}
        currentTimeSec={currentTimeSec}
        totalDurationSec={project.durationSeconds}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onRenderMasterCut={handleRenderMasterCut}
        isRenderingMaster={isRenderingMaster}
        onUpdateProjectTitle={(title) => handleUpdateProject({ ...project, title })}
        onUndo={() => globalCommandManager.undo()}
        onRedo={() => globalCommandManager.redo()}
        canUndo={canUndo}
        canRedo={canRedo}
      />

      {/* Main Workspace Suite */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Outliner & Tool Panel (Visible in 3D & Animation) */}
        {(activeWorkspace === '3D_STUDIO' || activeWorkspace === 'ANIMATION') && (
          <SceneHierarchyPanel
            project={project}
            activeScene={currentScene}
            selectedEntity={selectedEntity}
            onSelectEntity={setSelectedEntity}
            onApplyAIDirectorCommand={handleApplyAIDirectorCommand}
          />
        )}

        {/* Center Viewport / Workspace Canvas */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {(activeWorkspace === '3D_STUDIO' || activeWorkspace === 'ANIMATION') && (
            <div className="flex-1 p-3 flex flex-col overflow-hidden">
              <Procedural3DStudio
                config={currentScene.procedural3DConfig}
                sceneTitle={`Scene ${currentScene.sceneNumber}: ${currentScene.title}`}
                durationSeconds={currentScene.durationSeconds}
                selectedEntity={selectedEntity}
                onSelectEntity={setSelectedEntity}
                weatherOverride={weather}
                cameraModeOverride={cameraMovement}
                timeOfDayOverride={timeOfDay}
                cameraFovOverride={cameraFov}
                keyLightIntensityOverride={keyLightIntensity}
                externalTimeSec={currentTimeSec}
              />
            </div>
          )}

          {activeWorkspace === 'DIRECTOR' && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <CreateWorkstation
                project={project}
                onUpdateProject={handleUpdateProject}
                onStartOrchestration={handleStartOrchestration}
                isGenerating={isGenerating}
                onNavigateToTab={(tab) => {
                  if (tab === 'STORYBOARD') setActiveWorkspace('STORYBOARD');
                  else if (tab === '3D STUDIO') setActiveWorkspace('3D_STUDIO');
                  else if (tab === 'CHARACTER LAB') setActiveWorkspace('CHARACTER_LAB');
                }}
              />
            </div>
          )}

          {activeWorkspace === 'CHARACTER_LAB' && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <CharacterLabWorkstation
                project={project}
                onUpdateProject={handleUpdateProject}
              />
            </div>
          )}

          {activeWorkspace === 'CINEMATOGRAPHY' && (
            <CinematographyWorkstation
              project={project}
              activeScene={currentScene}
              onUpdateCameraParams={(fov, movement) => {
                setCameraFov(fov);
                setCameraMovement(movement as any);
              }}
            />
          )}

          {activeWorkspace === 'SCRIPTING' && (
            <ScriptingStudioWorkstation
              project={project}
              activeScene={currentScene}
              onUpdateSceneConfig={(updates) => {
                const updated = {
                  ...project,
                  storyboard: project.storyboard.map((s) => (s.id === currentScene.id ? { ...s, ...updates } : s)),
                };
                handleUpdateProject(updated);
              }}
            />
          )}

          {activeWorkspace === 'NODE_EDITOR' && (
            <VisualNodeEditorWorkstation
              project={project}
              activeScene={currentScene}
            />
          )}

          {activeWorkspace === 'AUDIO_STUDIO' && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <AudioStudioWorkstation
                project={project}
                onUpdateProject={handleUpdateProject}
              />
            </div>
          )}

          {activeWorkspace === 'STORYBOARD' && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <StoryboardWorkstation
                project={project}
                onUpdateProject={handleUpdateProject}
                onSelectSceneForStudio={(scene) => {
                  setActiveScene(scene);
                  setActiveWorkspace('3D_STUDIO');
                }}
                onNavigateToTab={(tab) => {
                  if (tab === '3D STUDIO') setActiveWorkspace('3D_STUDIO');
                }}
              />
            </div>
          )}

          {activeWorkspace === 'RENDER_JOBS' && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 max-w-6xl mx-auto w-full">
              <ProductionJobsPanel projectId={project.id} />
            </div>
          )}

          {/* Bottom Animation Timeline */}
          {(activeWorkspace === '3D_STUDIO' || activeWorkspace === 'ANIMATION') && (
            <MultiTrackTimeline
              storyboard={project.storyboard}
              activeScene={currentScene}
              onSelectScene={(s) => setActiveScene(s)}
              currentTimeSec={currentTimeSec}
              totalDurationSec={project.durationSeconds}
              onSeek={(t) => setCurrentTimeSec(t)}
              isPlaying={isPlaying}
              onTogglePlay={() => setIsPlaying((p) => !p)}
              onAddKeyframe={() => {
                console.log(`Keyframe recorded at ${currentTimeSec.toFixed(2)}s for entity ${selectedEntity}`);
              }}
            />
          )}
        </div>

        {/* Right Property Inspector (Visible in 3D & Animation) */}
        {(activeWorkspace === '3D_STUDIO' || activeWorkspace === 'ANIMATION') && (
          <ContextInspector
            selectedEntity={selectedEntity}
            activeScene={currentScene}
            weather={weather}
            onChangeWeather={setWeather}
            cameraMovement={cameraMovement}
            onChangeCameraMovement={setCameraMovement}
            timeOfDay={timeOfDay}
            onChangeTimeOfDay={setTimeOfDay}
            cameraFov={cameraFov}
            onChangeCameraFov={setCameraFov}
            keyLightIntensity={keyLightIntensity}
            onChangeKeyLightIntensity={setKeyLightIntensity}
            characterPose={characterPose}
            onChangeCharacterPose={setCharacterPose}
          />
        )}
      </div>

      {/* Export Production Master Modal */}
      <ExportModal
        project={project}
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
    </div>
  );
}
