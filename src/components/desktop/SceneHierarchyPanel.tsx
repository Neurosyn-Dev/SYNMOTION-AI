/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  FolderTree,
  Box,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Camera,
  Sun,
  User,
  Sparkles,
  CloudRain,
  Plus,
  Search,
  Layers,
  ChevronDown,
  ChevronRight,
  Flame,
  Wand2,
} from 'lucide-react';
import type { FilmProject, StoryboardScene } from '../../types/film';

export type SelectedEntityType = 'character' | 'camera' | 'key_light' | 'rim_light' | 'rain_system' | 'towers' | 'ground' | 'scene_root';

interface SceneHierarchyPanelProps {
  project: FilmProject;
  activeScene: StoryboardScene;
  selectedEntity: SelectedEntityType;
  onSelectEntity: (entity: SelectedEntityType) => void;
  onApplyAIDirectorCommand?: (prompt: string) => void;
  onAddSceneObject?: (type: string) => void;
}

export const SceneHierarchyPanel: React.FC<SceneHierarchyPanelProps> = ({
  project,
  activeScene,
  selectedEntity,
  onSelectEntity,
  onApplyAIDirectorCommand,
  onAddSceneObject,
}) => {
  const [activeTab, setActiveTab] = useState<'HIERARCHY' | 'ASSETS' | 'DIRECTOR'>('HIERARCHY');
  const [searchQuery, setSearchQuery] = useState('');
  const [directorPrompt, setDirectorPrompt] = useState('');
  const [isApplyingPrompt, setIsApplyingPrompt] = useState(false);

  const sceneEntities: { id: SelectedEntityType; name: string; type: string; icon: any; category: string }[] = [
    { id: 'camera', name: 'Cinematic Camera Rig', type: 'Camera (35mm Prime)', icon: Camera, category: 'Cameras' },
    { id: 'character', name: 'Hero Actor (The Wanderer)', type: 'Rigged 3D Character', icon: User, category: 'Actors' },
    { id: 'key_light', name: 'Key Light (Directional)', type: 'Directional 2.5kW', icon: Sun, category: 'Lighting' },
    { id: 'rim_light', name: 'Cyan Rim Accent', type: 'Accent Backlight', icon: Sun, category: 'Lighting' },
    { id: 'rain_system', name: 'Atmospheric Rain & Fog', type: 'Volumetric Particle Emitter', icon: CloudRain, category: 'Atmosphere' },
    { id: 'towers', name: 'Monolith Skyscraper Canyon', type: 'Architectural Geometry', icon: Box, category: 'Environment' },
    { id: 'ground', name: 'Wet Asphalt & Puddles', type: 'Reflective Surface Plane', icon: Layers, category: 'Environment' },
  ];

  const filteredEntities = sceneEntities.filter((e) =>
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDirectorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!directorPrompt.trim()) return;
    setIsApplyingPrompt(true);
    onApplyAIDirectorCommand?.(directorPrompt);
    setTimeout(() => {
      setIsApplyingPrompt(false);
      setDirectorPrompt('');
    }, 600);
  };

  return (
    <aside className="w-72 bg-[#090d16] border-r border-slate-800/80 flex flex-col shrink-0 select-none text-xs">
      {/* Panel Tab Strip */}
      <div className="flex items-center border-b border-slate-800/80 bg-black/30 p-1 gap-1">
        <button
          onClick={() => setActiveTab('HIERARCHY')}
          className={`flex-1 py-1.5 px-2 rounded font-medium text-[11px] flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'HIERARCHY'
              ? 'bg-sky-500/20 text-sky-300 border border-sky-400/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FolderTree className="w-3.5 h-3.5 text-sky-400" />
          <span>Outliner</span>
        </button>
        <button
          onClick={() => setActiveTab('DIRECTOR')}
          className={`flex-1 py-1.5 px-2 rounded font-medium text-[11px] flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'DIRECTOR'
              ? 'bg-sky-500/20 text-sky-300 border border-sky-400/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Wand2 className="w-3.5 h-3.5 text-amber-400" />
          <span>AI Director</span>
        </button>
        <button
          onClick={() => setActiveTab('ASSETS')}
          className={`flex-1 py-1.5 px-2 rounded font-medium text-[11px] flex items-center justify-center gap-1.5 transition-all ${
            activeTab === 'ASSETS'
              ? 'bg-sky-500/20 text-sky-300 border border-sky-400/40'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          <span>Assets</span>
        </button>
      </div>

      {activeTab === 'HIERARCHY' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Search & Add Action */}
          <div className="p-2 border-b border-slate-800/60 flex items-center gap-1.5">
            <div className="flex-1 relative">
              <Search className="w-3 h-3 absolute left-2 top-2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter entities..."
                className="w-full bg-black/40 border border-slate-800 rounded pl-7 pr-2 py-1 text-[11px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500/60"
              />
            </div>
            <button
              onClick={() => onAddSceneObject?.('light')}
              title="Add Object to Scene"
              className="p-1 rounded bg-slate-800/60 hover:bg-sky-600/30 text-slate-300 hover:text-sky-300 border border-slate-700/60 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Scene Header */}
          <div className="px-3 py-1.5 bg-slate-900/40 text-[10px] font-mono-code text-slate-400 border-b border-slate-800/40 flex items-center justify-between">
            <span>SCENE {activeScene.sceneNumber}: {activeScene.title.slice(0, 20)}</span>
            <span className="text-sky-400">{sceneEntities.length} ENTITIES</span>
          </div>

          {/* Entity List */}
          <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
            {filteredEntities.map((ent) => {
              const Icon = ent.icon;
              const isSelected = selectedEntity === ent.id;
              return (
                <div
                  key={ent.id}
                  onClick={() => onSelectEntity(ent.id)}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-sky-600/25 border border-sky-400/50 text-white'
                      : 'hover:bg-slate-800/50 text-slate-300 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-sky-400' : 'text-slate-500'}`} />
                    <div className="truncate">
                      <div className="font-medium text-[11px] truncate leading-tight">{ent.name}</div>
                      <div className="text-[9px] text-slate-400 font-mono-code">{ent.type}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-60 hover:opacity-100">
                    <button className="p-0.5 hover:text-white" title="Toggle Visibility">
                      <Eye className="w-3 h-3 text-slate-400" />
                    </button>
                    <button className="p-0.5 hover:text-white" title="Lock Transform">
                      <Unlock className="w-3 h-3 text-slate-400" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Viewport Transform Shortcuts Footer */}
          <div className="p-2 border-t border-slate-800/80 bg-black/40 text-[10px] text-slate-400 space-y-1">
            <div className="font-semibold text-slate-300">Transform Hotkeys</div>
            <div className="flex items-center justify-between font-mono-code text-[9px]">
              <span>[G] Move</span>
              <span>[R] Rotate</span>
              <span>[S] Scale</span>
              <span>[K] Keyframe</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'DIRECTOR' && (
        <div className="flex-1 p-3 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-amber-400 font-semibold text-xs">
              <Sparkles className="w-4 h-4" />
              <span>AI Director Prompt</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Direct the 3D scene in real-time. Describe changes to lighting, actor motion, camera paths, or atmospheric conditions.
            </p>

            <form onSubmit={handleDirectorSubmit} className="space-y-2">
              <textarea
                value={directorPrompt}
                onChange={(e) => setDirectorPrompt(e.target.value)}
                placeholder="e.g. 'Push camera closer to the shrouded wanderer, increase rain intensity, and trigger dynamic thunder flashes...'"
                rows={4}
                className="w-full bg-black/60 border border-slate-800 rounded p-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-400/60 resize-none"
              />
              <button
                type="submit"
                disabled={isApplyingPrompt || !directorPrompt.trim()}
                className="w-full py-1.5 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 text-amber-300 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all disabled:opacity-50 cursor-pointer"
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>{isApplyingPrompt ? 'DIRECTING SCENE...' : 'APPLY TO 3D SCENE'}</span>
              </button>
            </form>

            <div className="space-y-1.5 pt-2 border-t border-slate-800/60">
              <span className="text-[10px] font-mono-code text-slate-400 font-semibold">DIRECTOR PRESETS:</span>
              {[
                'Cinematic Orbit Around Wanderer',
                'Volumetric Storm with Intense Fog',
                'Golden Hour Sunset Lighting',
                'Fast Dolly-In Action Beat',
              ].map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setDirectorPrompt(preset);
                    onApplyAIDirectorCommand?.(preset);
                  }}
                  className="w-full text-left px-2 py-1.5 rounded bg-slate-900/60 hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-300 hover:text-white transition-colors block"
                >
                  ⚡ {preset}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'ASSETS' && (
        <div className="flex-1 p-3 overflow-y-auto space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-300 text-xs">Project Media</span>
            <span className="text-[10px] text-slate-400 font-mono-code">
              {project.imageReferences.length + project.videoReferences.length} Assets
            </span>
          </div>

          <div className="space-y-2">
            <div className="text-[10px] text-slate-400 font-mono-code">VISUAL DNA REFERENCES:</div>
            {project.imageReferences.map((ref) => (
              <div key={ref.id} className="flex items-center gap-2 p-1.5 rounded bg-black/40 border border-slate-800">
                <img src={ref.url} alt={ref.name} className="w-8 h-8 rounded object-cover bg-slate-800" />
                <div className="truncate flex-1">
                  <div className="text-[11px] font-medium text-slate-200 truncate">{ref.name}</div>
                  <div className="text-[9px] text-sky-400 font-mono-code uppercase">{ref.category}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
};
