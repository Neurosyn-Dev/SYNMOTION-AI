/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Sliders,
  User,
  Camera,
  Sun,
  CloudRain,
  Layers,
  Box,
  Palette,
  Eye,
  Sparkles,
  Zap,
  Activity,
} from 'lucide-react';
import type { SelectedEntityType } from './SceneHierarchyPanel';
import type { StoryboardScene } from '../../types/film';

interface ContextInspectorProps {
  selectedEntity: SelectedEntityType;
  activeScene: StoryboardScene;
  weather: 'thunderstorm' | 'rain' | 'fog' | 'clear';
  onChangeWeather: (w: 'thunderstorm' | 'rain' | 'fog' | 'clear') => void;
  cameraMovement: 'dolly_in' | 'crane_sweep' | 'tracking_follow' | 'orbit_reveal' | 'handheld_drift';
  onChangeCameraMovement: (m: 'dolly_in' | 'crane_sweep' | 'tracking_follow' | 'orbit_reveal' | 'handheld_drift') => void;
  timeOfDay: 'night' | 'dusk' | 'golden_hour';
  onChangeTimeOfDay: (t: 'night' | 'dusk' | 'golden_hour') => void;
  cameraFov: number;
  onChangeCameraFov: (fov: number) => void;
  keyLightIntensity: number;
  onChangeKeyLightIntensity: (val: number) => void;
  characterPose?: string;
  onChangeCharacterPose?: (pose: string) => void;
}

export const ContextInspector: React.FC<ContextInspectorProps> = ({
  selectedEntity,
  activeScene,
  weather,
  onChangeWeather,
  cameraMovement,
  onChangeCameraMovement,
  timeOfDay,
  onChangeTimeOfDay,
  cameraFov,
  onChangeCameraFov,
  keyLightIntensity,
  onChangeKeyLightIntensity,
  characterPose = 'Heroic Stand',
  onChangeCharacterPose,
}) => {
  return (
    <aside className="w-80 bg-[#090d16] border-l border-slate-800/80 flex flex-col shrink-0 select-none text-xs overflow-y-auto">
      {/* Inspector Header */}
      <div className="h-10 px-3 border-b border-slate-800/80 flex items-center justify-between bg-black/30">
        <div className="flex items-center gap-1.5 text-slate-200 font-semibold">
          <Sliders className="w-3.5 h-3.5 text-sky-400" />
          <span>Property Inspector</span>
        </div>
        <span className="text-[10px] font-mono-code px-1.5 py-0.5 rounded bg-sky-950 border border-sky-500/30 text-sky-300 uppercase">
          {selectedEntity.replace('_', ' ')}
        </span>
      </div>

      <div className="p-3 space-y-4">
        {/* Transform Component (Common to 3D Entities) */}
        <div className="space-y-2 bg-black/40 border border-slate-800/80 rounded-lg p-2.5">
          <div className="flex items-center justify-between text-slate-300 font-semibold text-[11px]">
            <span>Transform Coordinates</span>
            <span className="text-[9px] font-mono-code text-slate-500">WORLD SPACE</span>
          </div>

          <div className="space-y-1.5">
            {/* Position */}
            <div className="flex items-center gap-2">
              <span className="w-12 text-[10px] text-slate-400">Position</span>
              <div className="flex-1 grid grid-cols-3 gap-1">
                <div className="flex items-center bg-slate-900 border border-red-950 px-1.5 py-0.5 rounded text-[10px] font-mono-code text-red-400">
                  <span className="text-[8px] text-red-500 mr-1">X</span> 0.00
                </div>
                <div className="flex items-center bg-slate-900 border border-emerald-950 px-1.5 py-0.5 rounded text-[10px] font-mono-code text-emerald-400">
                  <span className="text-[8px] text-emerald-500 mr-1">Y</span> 2.10
                </div>
                <div className="flex items-center bg-slate-900 border border-sky-950 px-1.5 py-0.5 rounded text-[10px] font-mono-code text-sky-400">
                  <span className="text-[8px] text-sky-500 mr-1">Z</span> 0.00
                </div>
              </div>
            </div>

            {/* Rotation */}
            <div className="flex items-center gap-2">
              <span className="w-12 text-[10px] text-slate-400">Rotation</span>
              <div className="flex-1 grid grid-cols-3 gap-1">
                <div className="flex items-center bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-[10px] font-mono-code text-slate-300">
                  <span className="text-[8px] text-slate-500 mr-1">X</span> 0°
                </div>
                <div className="flex items-center bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-[10px] font-mono-code text-slate-300">
                  <span className="text-[8px] text-slate-500 mr-1">Y</span> 45°
                </div>
                <div className="flex items-center bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-[10px] font-mono-code text-slate-300">
                  <span className="text-[8px] text-slate-500 mr-1">Z</span> 0°
                </div>
              </div>
            </div>

            {/* Scale */}
            <div className="flex items-center gap-2">
              <span className="w-12 text-[10px] text-slate-400">Scale</span>
              <div className="flex-1 grid grid-cols-3 gap-1">
                <div className="flex items-center bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-[10px] font-mono-code text-slate-300">
                  <span className="text-[8px] text-slate-500 mr-1">X</span> 1.00
                </div>
                <div className="flex items-center bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-[10px] font-mono-code text-slate-300">
                  <span className="text-[8px] text-slate-500 mr-1">Y</span> 1.00
                </div>
                <div className="flex items-center bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded text-[10px] font-mono-code text-slate-300">
                  <span className="text-[8px] text-slate-500 mr-1">Z</span> 1.00
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Dynamic Context Properties */}
        {selectedEntity === 'character' && (
          <div className="space-y-3 bg-black/40 border border-slate-800/80 rounded-lg p-2.5">
            <div className="flex items-center gap-1.5 text-sky-400 font-semibold text-[11px]">
              <User className="w-3.5 h-3.5" />
              <span>Digital Human Rig</span>
            </div>

            <div className="space-y-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Actor Posture & Motion Preset</label>
                <select
                  value={characterPose}
                  onChange={(e) => onChangeCharacterPose?.(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-slate-200 text-xs focus:outline-none focus:border-sky-500"
                >
                  <option value="Heroic Stand">Heroic Stand (Cinematic Idle)</option>
                  <option value="Stealth Approach">Stealth Approach (Crouched)</option>
                  <option value="Combat Ready">Combat Ready (Wide Stance)</option>
                  <option value="Dynamic Leap">Dynamic Leap (Mid-air)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Fabric Specularity / Wetness</label>
                <input
                  type="range"
                  min="0.05"
                  max="0.95"
                  step="0.05"
                  defaultValue="0.45"
                  className="w-full accent-sky-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Cowl Concealment Depth</label>
                <input
                  type="range"
                  min="0.1"
                  max="0.9"
                  step="0.05"
                  defaultValue="0.65"
                  className="w-full accent-sky-500"
                />
              </div>

              <div className="p-2 rounded bg-sky-950/40 border border-sky-800/40 text-[10px] text-sky-300">
                Composite 3D Mesh: Procedural Cylinder Torso, Dual-Layer Shrouded Cowl, Emissive Obsidian Indicator.
              </div>
            </div>
          </div>
        )}

        {selectedEntity === 'camera' && (
          <div className="space-y-3 bg-black/40 border border-slate-800/80 rounded-lg p-2.5">
            <div className="flex items-center gap-1.5 text-sky-400 font-semibold text-[11px]">
              <Camera className="w-3.5 h-3.5" />
              <span>Cinematic Camera Rig</span>
            </div>

            <div className="space-y-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Camera Movement Mode</label>
                <select
                  value={cameraMovement}
                  onChange={(e) => onChangeCameraMovement(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-slate-200 text-xs focus:outline-none focus:border-sky-500"
                >
                  <option value="dolly_in">Dolly Push-In</option>
                  <option value="crane_sweep">Crane Sweep (Elevated)</option>
                  <option value="tracking_follow">Tracking Follow</option>
                  <option value="orbit_reveal">360° Orbit Reveal</option>
                  <option value="handheld_drift">Cinematic Handheld Drift</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                  <span>Focal Length (Lens FOV)</span>
                  <span className="font-mono-code text-sky-400">{cameraFov}° (approx {Math.round(1800 / cameraFov)}mm)</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="65"
                  value={cameraFov}
                  onChange={(e) => onChangeCameraFov(Number(e.target.value))}
                  className="w-full accent-sky-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Aperture / Depth of Field</label>
                <div className="grid grid-cols-4 gap-1">
                  {['f/1.4', 'f/2.8', 'f/4.0', 'f/8.0'].map((f, i) => (
                    <button
                      key={f}
                      className={`py-1 rounded text-[10px] font-mono-code border transition-colors ${
                        i === 1 ? 'bg-sky-500/20 border-sky-400 text-sky-300' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {(selectedEntity === 'key_light' || selectedEntity === 'rim_light') && (
          <div className="space-y-3 bg-black/40 border border-slate-800/80 rounded-lg p-2.5">
            <div className="flex items-center gap-1.5 text-amber-400 font-semibold text-[11px]">
              <Sun className="w-3.5 h-3.5" />
              <span>Studio Lighting Rig</span>
            </div>

            <div className="space-y-2">
              <div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                  <span>Key Intensity</span>
                  <span className="font-mono-code text-amber-400">{keyLightIntensity.toFixed(1)} kW</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="5.0"
                  step="0.1"
                  value={keyLightIntensity}
                  onChange={(e) => onChangeKeyLightIntensity(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Time of Day & Atmosphere</label>
                <select
                  value={timeOfDay}
                  onChange={(e) => onChangeTimeOfDay(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-slate-200 text-xs focus:outline-none focus:border-amber-500"
                >
                  <option value="night">Obsidian Midnight (Deep Blue)</option>
                  <option value="dusk">Twilight Dusk (Indigo)</option>
                  <option value="golden_hour">Golden Hour (Amber Warmth)</option>
                </select>
              </div>

              <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
                <span>Cast Dynamic Shadows</span>
                <span className="px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-500/30 text-emerald-400 font-mono-code">
                  PCF SOFT SHADOWS
                </span>
              </div>
            </div>
          </div>
        )}

        {(selectedEntity === 'rain_system' || selectedEntity === 'ground' || selectedEntity === 'towers') && (
          <div className="space-y-3 bg-black/40 border border-slate-800/80 rounded-lg p-2.5">
            <div className="flex items-center gap-1.5 text-sky-400 font-semibold text-[11px]">
              <CloudRain className="w-3.5 h-3.5" />
              <span>Environment & Weather Simulation</span>
            </div>

            <div className="space-y-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Active Weather System</label>
                <select
                  value={weather}
                  onChange={(e) => onChangeWeather(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-slate-200 text-xs focus:outline-none focus:border-sky-500"
                >
                  <option value="thunderstorm">Volumetric Thunderstorm & Lightning</option>
                  <option value="rain">Heavy Continuous Rainfall</option>
                  <option value="fog">Dense Atmospheric Fog Haze</option>
                  <option value="clear">Clear Atmospheric Night</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Ground Wetness & Puddle Specularity</label>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.05"
                  defaultValue="0.85"
                  className="w-full accent-sky-500"
                />
              </div>

              <div className="p-2 rounded bg-slate-900/60 border border-slate-800 text-[10px] text-slate-400">
                Scene environment utilizes RoomEnvironment reflection map and PCF Soft Shadows for realistic material response.
              </div>
            </div>
          </div>
        )}

        {/* Scene Quality Assurance Badge */}
        <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/30 space-y-1">
          <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Scene Quality Control</span>
          </div>
          <div className="text-[10px] text-slate-300">
            Automated FFmpeg null sink validation enabled. Zero NAL unit corruptions permitted.
          </div>
        </div>
      </div>
    </aside>
  );
};
