/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import type { FilmProject } from '../../types/film';
import { globalSceneGraph } from '../../services/sceneGraph/sceneGraphService';
import {
  User,
  Sparkles,
  ShieldCheck,
  Palette,
  Activity,
  Layers,
  Shirt,
  Footprints,
  Eye,
  Sliders,
  CheckCircle2,
  Smile,
  Zap,
} from 'lucide-react';

interface Props {
  project: FilmProject;
  onUpdateProject: (p: FilmProject) => void;
}

export const CharacterLabWorkstation: React.FC<Props> = ({
  project,
  onUpdateProject,
}) => {
  const [selectedCharIndex, setSelectedCharIndex] = useState(0);
  const activeChar = project.visualDna.characters[selectedCharIndex] || project.visualDna.characters[0];

  // Character Rig State
  const [activeClip, setActiveClip] = useState<string>('Heroic Stand');
  const [facialMood, setFacialMood] = useState<string>('Grim / Focused');
  const [fabricRoughness, setFabricRoughness] = useState<number>(0.45);
  const [fabricMetalness, setFabricMetalness] = useState<number>(0.15);
  const [wetness, setWetness] = useState<number>(0.85);
  const [emissiveColor, setEmissiveColor] = useState<string>('#38bdf8');
  const [glowIntensity, setGlowIntensity] = useState<number>(1.5);
  const [cowlDepth, setCowlDepth] = useState<number>(0.65);

  const ANIMATION_CLIPS = [
    { id: 'Heroic Stand', name: 'Heroic Stand (Cinematic Idle)', desc: 'Subtle chest breathing & steady stance', speed: '1.0x' },
    { id: 'Combat Stance', name: 'Combat Ready (Wide Stance)', desc: 'Lower center of gravity, forward anticipation', speed: '1.2x' },
    { id: 'Stealth Approach', name: 'Stealth Crouch (Low Profile)', desc: 'Silenced slow pacing, concealed silhouette', speed: '0.8x' },
    { id: 'Walking Gait', name: 'Atmospheric Walk Cycle', desc: 'Forward momentum with overcoat cloth physics bob', speed: '1.0x' },
    { id: 'Dramatic Turn', name: '180° Dramatic Reveal', desc: 'Sweeping rotation facing director camera', speed: '0.9x' },
  ];

  const FACIAL_MOODS = [
    { mood: 'Grim / Focused', desc: 'Concealed brow, focused gaze beneath cowl' },
    { mood: 'Intense Vigilance', desc: 'Alert stance with heightened eye contraction' },
    { mood: 'Weary Veteran', desc: 'Slight head tilt, steady resolute jaw' },
    { mood: 'Heroic Defiance', desc: 'Elevated chin, firm jawline' },
  ];

  const handleApplyRigChanges = (clip: string, mood = facialMood) => {
    setActiveClip(clip);
    setFacialMood(mood);

    // Sync directly to the SceneGraph character entity
    globalSceneGraph.updateEntityProperty('entity-hero-actor', 'posture', clip);
    globalSceneGraph.updateEntityProperty('entity-hero-actor', 'facialMood', mood);
    globalSceneGraph.updateEntityMaterial('entity-hero-actor', {
      roughness: fabricRoughness,
      metalness: fabricMetalness,
      emissive: emissiveColor,
      emissiveIntensity: glowIntensity,
    });
  };

  const handleUpdateMaterial = (roughness: number, metalness: number, glow: number) => {
    setFabricRoughness(roughness);
    setFabricMetalness(metalness);
    setGlowIntensity(glow);
    globalSceneGraph.updateEntityMaterial('entity-hero-actor', {
      roughness,
      metalness,
      emissiveIntensity: glow,
      emissive: emissiveColor,
    });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 select-none">
      {/* Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-sky-900/30 flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-sky-500/10 border border-sky-400/30 text-sky-300 text-[11px] font-semibold uppercase mb-1">
            <User className="w-3.5 h-3.5 text-sky-400" />
            <span>Digital Human Rigging & Character Studio</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white font-cinematic">
            Character Studio & Skeletal Kinematics
          </h1>
          <p className="text-xs text-slate-300">
            Control the skeletal animation clips, PBR materials, cloth specularity, and facial morphs for persistent digital actors.
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-lg bg-emerald-950 border border-emerald-500/30 text-emerald-300 text-xs font-mono-code flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Scene Graph Synced</span>
          </span>
        </div>
      </div>

      {activeChar && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: 3D Actor Representation & Costume Palette */}
          <div className="glass-panel p-6 rounded-2xl border border-sky-800/30 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h2 className="text-base font-bold text-white">{activeChar.name}</h2>
                <span className="text-xs text-sky-400 font-medium">{activeChar.archetype}</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-sky-950 border border-sky-800 text-[10px] font-semibold text-sky-300 uppercase">
                Active Hero
              </span>
            </div>

            {/* Visual 3D Rig Schematic Card */}
            <div className="h-64 rounded-xl bg-gradient-to-b from-sky-950/40 via-black to-[#050810] border border-sky-800/40 flex flex-col items-center justify-center p-4 relative overflow-hidden text-center">
              <div className="w-24 h-40 border border-sky-400/40 rounded-t-full rounded-b-lg flex flex-col items-center justify-between p-2 relative bg-black/40">
                {/* Cowl */}
                <div className="w-10 h-10 rounded-full bg-slate-900 border border-sky-400/60 flex items-center justify-center relative shadow-lg">
                  <div
                    className="w-3 h-3 rounded-full transition-all"
                    style={{
                      backgroundColor: emissiveColor,
                      boxShadow: `0 0 ${glowIntensity * 8}px ${emissiveColor}`,
                    }}
                  />
                </div>
                {/* Torso with Cloth Roughness representation */}
                <div
                  className="w-14 h-20 rounded border border-slate-700 transition-all flex flex-col items-center justify-center text-[8px] font-mono-code text-slate-400"
                  style={{
                    backgroundColor: `rgba(13, 17, 23, ${1 - fabricRoughness * 0.4})`,
                  }}
                >
                  <span className="text-sky-300 font-bold">{activeClip.split(' ')[0]}</span>
                  <span>FK Rig</span>
                </div>
                {/* Feet */}
                <div className="w-12 h-3 bg-slate-800 border border-slate-600 rounded-sm" />
              </div>

              <span className="text-xs text-sky-300 font-semibold mt-3">{activeClip}</span>
              <span className="text-[10px] text-slate-400">IK Foot Contact Grounded • Wet Asphalt Reflection Active</span>
            </div>

            {/* Costume Color Palette */}
            <div>
              <span className="text-xs font-semibold text-slate-300 block mb-2">Costume Color Palette:</span>
              <div className="flex gap-2">
                {activeChar.colorPalette.map((color, idx) => (
                  <div key={idx} className="flex-1 text-center">
                    <div
                      className="w-full h-8 rounded-lg border border-slate-700 shadow"
                      style={{ backgroundColor: color }}
                    />
                    <span className="font-mono-code text-[10px] text-slate-400 block mt-1">{color}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Center Column: Skeletal Animation Clips */}
          <div className="glass-panel p-6 rounded-2xl border border-sky-800/30 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Footprints className="w-3.5 h-3.5 text-sky-400" />
                <span>Animation Clips & Kinematics</span>
              </span>
              <span className="text-[10px] text-sky-400 font-mono-code">5 CLIPS</span>
            </div>

            <div className="space-y-2">
              {ANIMATION_CLIPS.map((clip) => {
                const isSelected = activeClip === clip.id;
                return (
                  <div
                    key={clip.id}
                    onClick={() => handleApplyRigChanges(clip.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-sky-600/25 border-sky-400 text-white shadow-md'
                        : 'bg-black/40 border-slate-800 text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-xs">
                      <span>{clip.name}</span>
                      <span className="font-mono-code text-[10px] text-sky-400">{clip.speed}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">{clip.desc}</div>
                  </div>
                );
              })}
            </div>

            {/* Facial Mood Morph Targets */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Smile className="w-3.5 h-3.5 text-amber-400" />
                <span>Facial Mood & Expression</span>
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {FACIAL_MOODS.map((m) => (
                  <button
                    key={m.mood}
                    onClick={() => handleApplyRigChanges(activeClip, m.mood)}
                    className={`p-2 rounded-lg border text-left text-[10px] transition-colors ${
                      facialMood === m.mood
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                        : 'bg-black/30 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {m.mood}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: PBR Material Shaders & Relic Emissive */}
          <div className="glass-panel p-6 rounded-2xl border border-sky-800/30 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                <span>PBR Shaders & Fabrics</span>
              </span>
              <span className="text-[10px] text-indigo-400 font-mono-code">SURFACE</span>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span>Fabric Roughness / Diffuse</span>
                  <span className="font-mono-code text-sky-400">{fabricRoughness.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.95"
                  step="0.05"
                  value={fabricRoughness}
                  onChange={(e) => handleUpdateMaterial(Number(e.target.value), fabricMetalness, glowIntensity)}
                  className="w-full accent-sky-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span>Metallic Armor Accents</span>
                  <span className="font-mono-code text-sky-400">{fabricMetalness.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.0"
                  max="1.0"
                  step="0.05"
                  value={fabricMetalness}
                  onChange={(e) => handleUpdateMaterial(fabricRoughness, Number(e.target.value), glowIntensity)}
                  className="w-full accent-sky-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span>Cowl Concealment Shadow Depth</span>
                  <span className="font-mono-code text-slate-300">{cowlDepth.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="0.95"
                  step="0.05"
                  value={cowlDepth}
                  onChange={(e) => setCowlDepth(Number(e.target.value))}
                  className="w-full accent-slate-400"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span>Relic Emissive Glow Color</span>
                  <span className="font-mono-code text-sky-400">{emissiveColor}</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={emissiveColor}
                    onChange={(e) => {
                      setEmissiveColor(e.target.value);
                      globalSceneGraph.updateEntityMaterial('entity-hero-actor', { emissive: e.target.value });
                    }}
                    className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                  />
                  <div className="flex-1">
                    <input
                      type="range"
                      min="0.5"
                      max="4.0"
                      step="0.1"
                      value={glowIntensity}
                      onChange={(e) => handleUpdateMaterial(fabricRoughness, fabricMetalness, Number(e.target.value))}
                      className="w-full accent-sky-400"
                    />
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-sky-950/40 border border-sky-800/40 text-[11px] text-sky-300 space-y-1">
                <div className="font-semibold">Persistent Visual Identity Active</div>
                <div>All changes made here update the 3D character across all storyboard scenes, timeline playback, and master rendering.</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
