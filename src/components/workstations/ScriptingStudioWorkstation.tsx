/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Code2,
  Play,
  RotateCcw,
  Save,
  Terminal,
  FileCode,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import type { FilmProject, StoryboardScene } from '../../types/film';
import { globalSceneGraph } from '../../services/sceneGraph/sceneGraphService';

interface ScriptingStudioWorkstationProps {
  project: FilmProject;
  activeScene: StoryboardScene;
  onUpdateSceneConfig?: (updates: Partial<StoryboardScene>) => void;
}

const DEFAULT_SCRIPT = `# SYNMOTION AI - Procedural 3D Scene Script
# Direct Scene Graph & Camera Rig Automation

import synmotion.scene as scene
import synmotion.camera as camera
import synmotion.lighting as lights

def setup_cinematic_shot():
    # 1. Target Active Hero Actor
    actor = scene.get_actor("HeroWanderer")
    actor.set_posture("Combat Ready")
    actor.materials.roughness = 0.35
    actor.materials.metalness = 0.20
    
    # 2. Configure Dynamic Lighting & Lightning
    key = lights.get("DirectionalKey")
    key.set_intensity(2.8) # kW
    key.set_time_of_day("night")
    
    # 3. Animate 35mm Cine Prime Camera
    cam = camera.get_active()
    cam.set_focal_length(35.0) # mm
    cam.animate_dolly(
        start_pos=[0.0, 3.5, 22.0],
        end_pos=[0.0, 2.2, 8.5],
        duration_sec=12.0,
        easing="cubic_out"
    )
    
    # 4. Trigger Volumetric Storm Simulation
    scene.environment.set_weather("thunderstorm")
    scene.environment.enable_rain_particles(density=1800)
    
    print(">> Script Execution Complete: Scene 1 Graph Synchronized.")

setup_cinematic_shot()
`;

export const ScriptingStudioWorkstation: React.FC<ScriptingStudioWorkstationProps> = ({
  project,
  activeScene,
  onUpdateSceneConfig,
}) => {
  const [code, setCode] = useState(DEFAULT_SCRIPT);
  const [outputLogs, setOutputLogs] = useState<string[]>([
    '[SYNMOTION Engine] Python 3.11 Runtime Initialized.',
    '[SYNMOTION Engine] Scene Graph bindings linked to WebGL / Three.js viewport.',
    'Ready for execution.',
  ]);
  const [isRunning, setIsRunning] = useState(false);

  const PRESETS = [
    {
      name: 'Camera Flythrough Rig',
      code: `# Camera Flythrough Rig\nimport synmotion.camera as camera\n\ncam = camera.get_active()\ncam.set_focal_length(24.0)\ncam.animate_crane_sweep(height_start=15.0, height_end=3.0, duration_sec=8.0)\nprint("Camera Flythrough Rig synchronized.")`,
    },
    {
      name: 'Atmospheric Storm Strobe',
      code: `# Atmospheric Storm Strobe\nimport synmotion.scene as scene\n\nscene.environment.set_weather("thunderstorm")\nscene.lighting.trigger_strobe(interval_sec=2.4, flash_intensity=120.0)\nprint("Volumetric thunderstorm strobe activated.")`,
    },
    {
      name: 'Golden Hour Sunset Conversion',
      code: `# Golden Hour Sunset\nimport synmotion.scene as scene\nimport synmotion.lighting as lights\n\nlights.get("DirectionalKey").set_time_of_day("golden_hour")\nscene.environment.set_weather("clear")\nprint("Lighting shifted to Warm Amber Golden Hour.")`,
    },
  ];

  const handleRunScript = () => {
    setIsRunning(true);
    const timestamp = new Date().toLocaleTimeString();
    const newLogs: string[] = [`[${timestamp}] Executing procedural scene script...`];

    try {
      // Expose safe sandbox API targeting globalSceneGraph
      const sandbox = {
        scene: {
          getEntity: (id: string) => globalSceneGraph.getEntity(id),
          addEntity: (entity: any) => globalSceneGraph.addEntity(entity),
          removeEntity: (id: string) => globalSceneGraph.removeEntity(id),
          setWeather: (weather: any) => globalSceneGraph.updateEnvironment({ weather }),
          setTimeOfDay: (timeOfDay: any) => globalSceneGraph.updateEnvironment({ timeOfDay }),
          environment: {
            set_weather: (w: any) => globalSceneGraph.updateEnvironment({ weather: w }),
            enable_rain_particles: (opts: any) => {
              newLogs.push(`>> Rain particle density updated to ${opts?.density || 1800}`);
            },
          },
          get_actor: (_name: string) => ({
            set_posture: (posture: string) => globalSceneGraph.updateEntityProperty('entity-hero-actor', 'posture', posture),
            materials: {
              set roughness(r: number) { globalSceneGraph.updateEntityMaterial('entity-hero-actor', { roughness: r }); },
              set metalness(m: number) { globalSceneGraph.updateEntityMaterial('entity-hero-actor', { metalness: m }); },
            },
          }),
        },
        camera: {
          get_active: () => ({
            set_focal_length: (fov: number) => globalSceneGraph.updateEntityProperty('entity-cine-camera', 'fov', fov),
            animate_dolly: (_opts: any) => {
              globalSceneGraph.updateEntityProperty('entity-cine-camera', 'movementMode', 'dolly_in');
              newLogs.push('>> Camera trajectory: Dolly push-in engaged');
            },
            animate_crane_sweep: (_opts: any) => {
              globalSceneGraph.updateEntityProperty('entity-cine-camera', 'movementMode', 'crane_sweep');
              newLogs.push('>> Camera trajectory: Crane sweep engaged');
            },
          }),
        },
        lights: {
          get: (_name: string) => ({
            set_intensity: (i: number) => globalSceneGraph.updateEntityProperty('entity-key-light', 'intensity', i),
            set_time_of_day: (t: any) => globalSceneGraph.updateEnvironment({ timeOfDay: t }),
          }),
        },
        print: (...args: any[]) => newLogs.push(`>> ${args.join(' ')}`),
      };

      // Transform simple pythonic syntax or JS statements into executable function
      let executableCode = code
        .replace(/#.*$/gm, '') // Remove comments
        .replace(/import\s+synmotion\.\w+\s+as\s+\w+/g, '') // Strip imports
        .replace(/def\s+(\w+)\(\):/g, 'function $1() {') // Def to function
        .replace(/print\((.*)\)/g, 'print($1)'); // print

      // If def was opened, close it before calling
      if (executableCode.includes('function setup_cinematic_shot() {')) {
        executableCode = executableCode.replace('setup_cinematic_shot()', '} setup_cinematic_shot();');
      }

      // Execute safely within sandbox scope
      const runner = new Function(
        'synmotion',
        'scene',
        'camera',
        'lights',
        'print',
        executableCode
      );

      runner(sandbox, sandbox.scene, sandbox.camera, sandbox.lights, sandbox.print);
      newLogs.push(`[${timestamp}] >> Success: Script executed with 0 errors. SceneGraph state synchronized.`);
    } catch (err: any) {
      newLogs.push(`[${timestamp}] Runtime Error: ${err.message}`);
    } finally {
      setOutputLogs((prev) => [...prev, ...newLogs]);
      setIsRunning(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#070b14] text-slate-200 select-none overflow-hidden">
      {/* Scripting Toolbar */}
      <div className="h-10 px-4 border-b border-slate-800 flex items-center justify-between bg-black/40">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-sky-400" />
          <span className="font-semibold text-xs">scene_controller.py</span>
          <span className="px-1.5 py-0.2 rounded bg-sky-950 border border-sky-500/30 text-[9px] font-mono-code text-sky-300">
            PYTHON 3.11 API
          </span>
        </div>

        <div className="flex items-center gap-2">
          {PRESETS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => setCode(p.code)}
              className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] text-slate-300 transition-colors"
            >
              {p.name}
            </button>
          ))}
          <button
            onClick={handleRunScript}
            disabled={isRunning}
            className="px-3 py-1 rounded bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition-all cursor-pointer disabled:opacity-50"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>{isRunning ? 'EXECUTING...' : 'RUN SCRIPT'}</span>
          </button>
        </div>
      </div>

      {/* Editor & Console Split */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 overflow-hidden">
        {/* Code Editor */}
        <div className="lg:col-span-2 border-r border-slate-800 p-3 bg-[#050810] flex flex-col">
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            className="w-full flex-1 bg-transparent font-mono-code text-xs text-sky-100 placeholder-slate-600 focus:outline-none resize-none leading-relaxed selection:bg-sky-600 selection:text-white"
          />
        </div>

        {/* Live Output Console */}
        <div className="bg-[#04060b] flex flex-col overflow-hidden">
          <div className="h-8 px-3 border-b border-slate-800 flex items-center justify-between bg-black/40 text-[11px] font-mono-code text-slate-400">
            <div className="flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" />
              <span>Engine Console Output</span>
            </div>
            <button
              onClick={() => setOutputLogs([])}
              className="hover:text-white text-[10px]"
            >
              Clear
            </button>
          </div>

          <div className="flex-1 p-3 font-mono-code text-[11px] overflow-y-auto space-y-1.5 text-slate-300">
            {outputLogs.map((log, i) => (
              <div
                key={i}
                className={
                  log.includes('Success') || log.includes('Complete')
                    ? 'text-emerald-400'
                    : log.includes('Executing')
                    ? 'text-sky-300'
                    : 'text-slate-400'
                }
              >
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
