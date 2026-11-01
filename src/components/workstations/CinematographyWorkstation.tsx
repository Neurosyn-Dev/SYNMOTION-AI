/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Camera,
  Sliders,
  Eye,
  Film,
  Sparkles,
  Maximize2,
  CheckCircle2,
  Move,
  RotateCw,
} from 'lucide-react';
import type { FilmProject, StoryboardScene } from '../../types/film';

interface CinematographyWorkstationProps {
  project: FilmProject;
  activeScene: StoryboardScene;
  onUpdateCameraParams?: (fov: number, movement: string) => void;
}

export const CinematographyWorkstation: React.FC<CinematographyWorkstationProps> = ({
  project,
  activeScene,
  onUpdateCameraParams,
}) => {
  const [selectedLens, setSelectedLens] = useState<'18mm' | '24mm' | '35mm' | '50mm' | '85mm' | '135mm'>('35mm');
  const [anamorphicSqueeze, setAnamorphicSqueeze] = useState<string>('2.0x (CinemaScope 2.39:1)');
  const [shutterAngle, setShutterAngle] = useState<number>(180);
  const [focusDistance, setFocusDistance] = useState<number>(8.5);
  const [aperture, setAperture] = useState<string>('f/2.0');
  const [cameraMotionMode, setCameraMotionMode] = useState<string>('dolly_in');

  const LENSES = [
    { mm: '18mm', fov: 62, desc: 'Ultra-Wide Panoramic / Architectural' },
    { mm: '24mm', fov: 52, desc: 'Wide Master / Environmental' },
    { mm: '35mm', fov: 38, desc: 'Standard Cinematic Prime' },
    { mm: '50mm', fov: 28, desc: 'Human Eye Perspective' },
    { mm: '85mm', fov: 18, desc: 'Portrait / Hero Compression' },
    { mm: '135mm', fov: 11, desc: 'Telephoto Isolation' },
  ];

  const handleSelectLens = (lens: typeof LENSES[0]) => {
    setSelectedLens(lens.mm as any);
    onUpdateCameraParams?.(lens.fov, cameraMotionMode);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#070b14] text-slate-200 select-none overflow-hidden">
      {/* Cinematography Header */}
      <div className="h-10 px-4 border-b border-slate-800 flex items-center justify-between bg-black/40">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-sky-400" />
          <span className="font-semibold text-xs">Cinematography & Optical Lens Suite</span>
          <span className="px-1.5 py-0.2 rounded bg-sky-950 border border-sky-500/30 text-[9px] font-mono-code text-sky-300">
            ARRI ALEXA 35 / COOKE ANAMORPHIC SIMULATION
          </span>
        </div>

        <div className="flex items-center gap-2 font-mono-code text-[11px] text-slate-400">
          <span>Active Lens: <span className="text-sky-400 font-bold">{selectedLens}</span></span>
          <span>•</span>
          <span>Aperture: <span className="text-amber-400 font-bold">{aperture}</span></span>
          <span>•</span>
          <span>Shutter: <span className="text-emerald-400 font-bold">{shutterAngle}°</span></span>
        </div>
      </div>

      <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 overflow-y-auto">
        {/* Left Column: Lens Selection & Optical Properties */}
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-black/40 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-slate-200 font-semibold text-xs border-b border-slate-800 pb-2">
              <span>Prime Cine Lens Selection</span>
              <span className="text-[10px] text-sky-400 font-mono-code">6 PRESETS</span>
            </div>

            <div className="space-y-2">
              {LENSES.map((l) => (
                <div
                  key={l.mm}
                  onClick={() => handleSelectLens(l)}
                  className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                    selectedLens === l.mm
                      ? 'bg-sky-600/25 border-sky-400 text-white shadow-md'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-xs">
                    <span>{l.mm} Cine Prime</span>
                    <span className="font-mono-code text-[10px] text-sky-400">{l.fov}° FOV</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{l.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center Column: Optical Depth of Field & Shutter */}
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-black/40 border border-slate-800 space-y-4">
            <div className="text-slate-200 font-semibold text-xs border-b border-slate-800 pb-2">
              Optical Sensor & Depth of Field (DoF)
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Aperture / Iris</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {['f/1.4', 'f/2.0', 'f/2.8', 'f/4.0', 'f/5.6', 'f/8.0', 'f/11', 'f/16'].map((f) => (
                    <button
                      key={f}
                      onClick={() => setAperture(f)}
                      className={`py-1.5 rounded font-mono-code text-xs border transition-colors ${
                        aperture === f
                          ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                  <span>Focus Distance (Puller)</span>
                  <span className="font-mono-code text-sky-400">{focusDistance.toFixed(1)} meters</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="30.0"
                  step="0.5"
                  value={focusDistance}
                  onChange={(e) => setFocusDistance(Number(e.target.value))}
                  className="w-full accent-sky-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                  <span>Shutter Angle (Motion Blur)</span>
                  <span className="font-mono-code text-emerald-400">{shutterAngle}° ({Math.round(1000 / (24 * (360 / shutterAngle)))} ms)</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { angle: 90, label: '90° Action Crisp' },
                    { angle: 180, label: '180° Standard Cine' },
                    { angle: 270, label: '270° Dreamy Blur' },
                  ].map((s) => (
                    <button
                      key={s.angle}
                      onClick={() => setShutterAngle(s.angle)}
                      className={`p-1.5 rounded text-[10px] font-medium border text-center transition-colors ${
                        shutterAngle === s.angle
                          ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Framing Guides & Camera Rigs */}
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-black/40 border border-slate-800 space-y-4">
            <div className="text-slate-200 font-semibold text-xs border-b border-slate-800 pb-2">
              Camera Movement Rig & Composition
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Camera Dolly / Crane Track</label>
                <div className="space-y-1.5">
                  {[
                    { id: 'dolly_in', name: 'Dolly Push-In', desc: 'Smooth forward track toward actor' },
                    { id: 'crane_sweep', name: 'Elevated Crane Sweep', desc: 'Vertical descending reveal' },
                    { id: 'tracking_follow', name: 'Tracking Follow', desc: 'Lateral moving follow shot' },
                    { id: 'orbit_reveal', name: '360° Hero Orbit', desc: 'Full rotational orbital sweep' },
                    { id: 'handheld_drift', name: 'Cinematic Handheld', desc: 'Organic subtle micro-shake' },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => {
                        setCameraMotionMode(mode.id);
                        onUpdateCameraParams?.(38, mode.id);
                      }}
                      className={`w-full text-left p-2 rounded-lg border transition-colors ${
                        cameraMotionMode === mode.id
                          ? 'bg-sky-500/20 border-sky-400 text-white'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="font-bold text-xs">{mode.name}</div>
                      <div className="text-[10px] text-slate-400">{mode.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-lg bg-sky-950/40 border border-sky-800/40 text-[11px] text-sky-300 space-y-1">
                <div className="font-semibold">Composition Safe Frames</div>
                <div>2.39:1 Anamorphic letterbox mask, Rule of Thirds grid, and center optical crosshair are active in the 3D viewport.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
