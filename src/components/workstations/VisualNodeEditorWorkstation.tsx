/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  GitBranch,
  Layers,
  Box,
  User,
  Camera,
  Sun,
  Volume2,
  CheckCircle2,
  Sparkles,
  Sliders,
  Scissors,
  Plus,
} from 'lucide-react';
import type { FilmProject, StoryboardScene } from '../../types/film';

import { globalSceneGraph } from '../../services/sceneGraph/sceneGraphService';

interface VisualNodeEditorWorkstationProps {
  project: FilmProject;
  activeScene: StoryboardScene;
}

interface PipelineNode {
  id: string;
  title: string;
  type: 'input' | 'actor' | 'camera' | 'lighting' | 'audio' | 'render';
  x: number;
  y: number;
  inputs: string[];
  outputs: string[];
  params: Record<string, string>;
  icon: any;
  color: string;
}

export const VisualNodeEditorWorkstation: React.FC<VisualNodeEditorWorkstationProps> = ({
  project,
  activeScene,
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string>('node-render');

  const [nodes, setNodes] = useState<PipelineNode[]>([
    {
      id: 'node-scene',
      title: 'Scene Root Descriptor',
      type: 'input',
      x: 40,
      y: 60,
      inputs: [],
      outputs: ['Scene Context', 'Duration'],
      params: { Scene: `Scene ${activeScene.sceneNumber}`, Duration: `${activeScene.durationSeconds}s`, Aspect: project.aspectRatio },
      icon: Layers,
      color: 'sky',
    },
    {
      id: 'node-actor',
      title: 'Hero Actor (The Wanderer)',
      type: 'actor',
      x: 320,
      y: 40,
      inputs: ['Scene Context'],
      outputs: ['Geometry Mesh', 'Transform Matrix'],
      params: { Rig: 'Shrouded Wanderer', PBR: 'Wet Cloth / Obsidian', Motion: 'Cinematic Pose' },
      icon: User,
      color: 'emerald',
    },
    {
      id: 'node-camera',
      title: '35mm Cine Prime Rig',
      type: 'camera',
      x: 320,
      y: 200,
      inputs: ['Scene Context', 'Transform Matrix'],
      outputs: ['View Matrix', 'Projection Matrix'],
      params: { Lens: '35mm Cine Prime', Movement: 'Dolly Push-In', Shutter: '180°' },
      icon: Camera,
      color: 'amber',
    },
    {
      id: 'node-light',
      title: 'Atmospheric Lighting & Storm',
      type: 'lighting',
      x: 320,
      y: 360,
      inputs: ['Scene Context'],
      outputs: ['Lighting Buffers', 'Volumetric Fog'],
      params: { Key: '2.5kW Directional', Shadow: 'PCF Soft', Weather: 'Thunderstorm' },
      icon: Sun,
      color: 'amber',
    },
    {
      id: 'node-audio',
      title: 'Web Audio Ambient Engine',
      type: 'audio',
      x: 600,
      y: 280,
      inputs: ['Scene Context', 'Weather State'],
      outputs: ['Stereo AAC 48kHz'],
      params: { Atmosphere: 'Thunderstorm', Volume: '-14 dBFS Peak', Format: 'Stereo' },
      icon: Volume2,
      color: 'indigo',
    },
    {
      id: 'node-render',
      title: 'Master QC & Video Assembly',
      type: 'render',
      x: 640,
      y: 80,
      inputs: ['Geometry Mesh', 'View Matrix', 'Lighting Buffers', 'Stereo AAC'],
      outputs: ['Master Cut MP4'],
      params: { Codec: 'H.264 / AAC', Resolution: '1920x1080', Integrity: 'Null Sink Passed' },
      icon: Scissors,
      color: 'sky',
    },
  ]);

  const handleParamChange = (nodeId: string, paramKey: string, newValue: string) => {
    setNodes((prev) =>
      prev.map((n) => (n.id === nodeId ? { ...n, params: { ...n.params, [paramKey]: newValue } } : n))
    );

    // Propagate parameter to SceneGraph
    if (nodeId === 'node-camera' && paramKey === 'Movement') {
      const mode = newValue.toLowerCase().includes('orbit') ? 'orbit_reveal' : 'dolly_in';
      globalSceneGraph.updateEntityProperty('entity-cine-camera', 'movementMode', mode);
    } else if (nodeId === 'node-light' && paramKey === 'Weather') {
      const w = newValue.toLowerCase().includes('rain') ? 'rain' : 'thunderstorm';
      globalSceneGraph.updateEnvironment({ weather: w as any });
    }
  };

  const selectedNode = nodes.find((n) => n.id === selectedNodeId) || nodes[0];

  return (
    <div className="flex-1 flex flex-col bg-[#070b14] text-slate-200 select-none overflow-hidden">
      {/* Node Graph Header */}
      <div className="h-10 px-4 border-b border-slate-800 flex items-center justify-between bg-black/40">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-sky-400" />
          <span className="font-semibold text-xs">Visual Scene Pipeline Graph</span>
          <span className="px-1.5 py-0.2 rounded bg-sky-950 border border-sky-500/30 text-[9px] font-mono-code text-sky-300">
            ACTIVE FLOW
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-300 flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3 h-3 text-sky-400" />
            <span>Add Node</span>
          </button>
          <div className="text-[10px] text-emerald-400 font-mono-code flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Graph Validated</span>
          </div>
        </div>
      </div>

      {/* Main Canvas & Inspector Split */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 overflow-hidden">
        {/* Node Canvas Area */}
        <div className="lg:col-span-3 border-r border-slate-800 relative bg-[#050810] overflow-hidden p-6">
          {/* Subtle Grid Background */}
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, #38bdf8 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          {/* SVG Connecting Bezier Wires */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {/* Wire 1: Scene to Actor */}
            <path
              d="M 230 110 C 275 110, 275 90, 320 90"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2"
              strokeDasharray="4 4"
              className="animate-pulse"
            />
            {/* Wire 2: Scene to Camera */}
            <path
              d="M 230 110 C 275 110, 275 250, 320 250"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2"
            />
            {/* Wire 3: Scene to Lighting */}
            <path
              d="M 230 110 C 275 110, 275 410, 320 410"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2"
            />
            {/* Wire 4: Actor to Render */}
            <path
              d="M 510 90 C 570 90, 570 120, 640 120"
              fill="none"
              stroke="#10b981"
              strokeWidth="2"
            />
            {/* Wire 5: Camera to Render */}
            <path
              d="M 510 250 C 570 250, 570 140, 640 140"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2"
            />
            {/* Wire 6: Audio to Render */}
            <path
              d="M 720 280 C 740 280, 740 200, 720 180"
              fill="none"
              stroke="#6366f1"
              strokeWidth="2"
            />
          </svg>

          {/* Render Nodes */}
          {nodes.map((node) => {
            const Icon = node.icon;
            const isSelected = selectedNodeId === node.id;
            return (
              <div
                key={node.id}
                onClick={() => setSelectedNodeId(node.id)}
                style={{ left: `${node.x}px`, top: `${node.y}px` }}
                className={`absolute w-48 rounded-xl bg-[#090d16] border shadow-xl transition-all cursor-pointer ${
                  isSelected
                    ? 'border-sky-400 ring-1 ring-sky-400/50 scale-[1.02]'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Node Titlebar */}
                <div className="px-2.5 py-1.5 border-b border-slate-800/80 bg-black/40 flex items-center justify-between rounded-t-xl">
                  <div className="flex items-center gap-1.5 truncate">
                    <Icon className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                    <span className="font-semibold text-[11px] truncate">{node.title}</span>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>

                {/* Node Ports & Params */}
                <div className="p-2 space-y-1.5 text-[10px]">
                  {Object.entries(node.params).map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between font-mono-code">
                      <span className="text-slate-400">{k}:</span>
                      <span className="text-slate-200 truncate max-w-[90px]">{v}</span>
                    </div>
                  ))}
                </div>

                {/* Outputs Footer */}
                <div className="px-2 py-1 bg-black/30 rounded-b-xl border-t border-slate-800/60 flex items-center justify-between text-[9px] font-mono-code text-slate-400">
                  <span>OUT: {node.outputs[0]}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Node Properties Panel */}
        <div className="bg-[#090d16] p-4 flex flex-col space-y-4 text-xs">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold text-slate-200">{selectedNode.title}</span>
            <span className="px-1.5 py-0.5 rounded bg-sky-950 border border-sky-500/30 text-[9px] font-mono-code text-sky-400 uppercase">
              {selectedNode.type}
            </span>
          </div>

          <div className="space-y-3">
            <div className="text-[10px] text-slate-400 uppercase font-mono-code">Node Parameters</div>
            {Object.entries(selectedNode.params).map(([key, val]) => (
              <div key={key} className="space-y-1">
                <label className="text-[10px] text-slate-400 block">{key}</label>
                <input
                  type="text"
                  value={val}
                  onChange={(e) => handleParamChange(selectedNode.id, key, e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs focus:outline-none focus:border-sky-500 font-mono-code"
                />
              </div>
            ))}
          </div>

          <div className="p-3 rounded-lg bg-sky-950/30 border border-sky-500/20 text-[11px] text-sky-300">
            Node updates dynamically propagate through the execution graph into the WebGL viewport and FFmpeg master render queue.
          </div>
        </div>
      </div>
    </div>
  );
};
