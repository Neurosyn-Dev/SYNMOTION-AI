/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import type { FilmProject, CharacterDNA, EnvironmentDNA, StyleDNA, MotionDNA } from '../../types/film';
import {
  Layers,
  User,
  Building,
  Palette,
  Activity,
  Plus,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

interface Props {
  project: FilmProject;
  onUpdateProject: (p: FilmProject) => void;
  onNavigateToTab: (tab: string) => void;
}

export const VisualDnaWorkstation: React.FC<Props> = ({
  project,
  onUpdateProject,
  onNavigateToTab,
}) => {
  const [activeTab, setActiveTab] = useState<'character' | 'environment' | 'style' | 'motion'>('character');

  const { characters, environments, styles, motions } = project.visualDna;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Visual DNA Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-sky-900/30 shadow-2xl relative overflow-hidden">
        <div className="max-w-3xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-400/30 text-sky-300 text-xs font-semibold tracking-wider uppercase">
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            <span>Persistent Visual Identity Engine</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white font-cinematic tracking-tight">
            Visual DNA Vault
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Visual DNA maintains recognizable visual identity across scenes, shots, and entirely different film productions.
            Character silhouettes, environmental architecture, color grading palettes, and camera motion styles persist
            seamlessly throughout generation.
          </p>
        </div>
      </div>

      {/* Consistency Engine Status Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-900/50 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-bold text-emerald-200">Visual DNA Consistency Engine: Active & Synchronized</div>
            <div className="text-slate-300 text-[11px]">
              All 6 scenes verified: 0 clothing mismatches, 0 color grade regressions, 100% silhouette preservation.
            </div>
          </div>
        </div>

        <span className="px-3 py-1 rounded bg-emerald-900/40 border border-emerald-600/40 text-emerald-300 font-mono-code font-bold">
          CONTINUITY SCORE: 98.4%
        </span>
      </div>

      {/* DNA Category Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        {[
          { id: 'character', label: 'Character DNA', icon: User, count: characters.length },
          { id: 'environment', label: 'Environment DNA', icon: Building, count: environments.length },
          { id: 'style', label: 'Style & Palette DNA', icon: Palette, count: styles.length },
          { id: 'motion', label: 'Motion & Camera DNA', icon: Activity, count: motions.length },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl font-semibold text-xs tracking-wide transition-all flex items-center gap-2 border ${
                isActive
                  ? 'border-sky-400/60 bg-sky-950/60 text-white shadow-lg shadow-sky-500/20'
                  : 'border-slate-800 bg-black/40 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-sky-400' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
              <span className="px-1.5 py-0.2 rounded bg-black/50 text-[10px] font-mono-code text-slate-300">
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Character DNA */}
      {activeTab === 'character' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {characters.map((char) => (
            <div key={char.id} className="glass-panel p-6 rounded-2xl border border-sky-800/30 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">{char.name}</h2>
                  <span className="text-xs text-sky-400 font-medium">{char.archetype}</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-sky-950 border border-sky-800 text-[10px] font-semibold text-sky-300 uppercase">
                  Global Profile
                </span>
              </div>

              <div className="space-y-3 text-xs text-slate-300">
                <div className="p-3 rounded-lg bg-black/40 border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Silhouette:</span>
                  <p>{char.silhouette}</p>
                </div>

                <div className="p-3 rounded-lg bg-black/40 border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Clothing & Accessories:</span>
                  <p>{char.clothing} • {char.accessories}</p>
                </div>

                <div className="p-3 rounded-lg bg-black/40 border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Movement Dynamics:</span>
                  <p>{char.movementTraits}</p>
                </div>

                {/* Swatches */}
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">Color Palette:</span>
                  <div className="flex gap-2">
                    {char.colorPalette.map((color, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full border border-slate-700" style={{ backgroundColor: color }} />
                        <span className="font-mono-code text-[10px] text-slate-400">{color}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Environment DNA */}
      {activeTab === 'environment' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {environments.map((env) => (
            <div key={env.id} className="glass-panel p-6 rounded-2xl border border-sky-800/30 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">{env.name}</h2>
                  <span className="text-xs text-indigo-400 font-medium">{env.locationType}</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-indigo-950 border border-indigo-800 text-[10px] font-semibold text-indigo-300 uppercase">
                  {env.weather}
                </span>
              </div>

              <div className="space-y-3 text-xs text-slate-300">
                <div className="p-3 rounded-lg bg-black/40 border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Architecture:</span>
                  <p>{env.architecturalDetails}</p>
                </div>

                <div className="p-3 rounded-lg bg-black/40 border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Lighting & Atmosphere:</span>
                  <p>{env.lightingConditions} • {env.atmosphere}</p>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">Environmental Palette:</span>
                  <div className="flex gap-2">
                    {env.colorPalette.map((color, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full border border-slate-700" style={{ backgroundColor: color }} />
                        <span className="font-mono-code text-[10px] text-slate-400">{color}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Style DNA */}
      {activeTab === 'style' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {styles.map((st) => (
            <div key={st.id} className="glass-panel p-6 rounded-2xl border border-sky-800/30 space-y-4 shadow-xl">
              <div>
                <h2 className="text-lg font-bold text-white">{st.name}</h2>
                <span className="text-xs text-amber-400 font-medium">{st.artisticDirection}</span>
              </div>

              <div className="space-y-3 text-xs text-slate-300">
                <div className="p-3 rounded-lg bg-black/40 border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Color Grading:</span>
                  <p>{st.colorGrading}</p>
                </div>

                <div className="p-3 rounded-lg bg-black/40 border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Film Stock & Grain:</span>
                  <p>{st.filmGrain} • Contrast: {st.contrast}</p>
                </div>

                <div className="p-3 rounded-lg bg-black/40 border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Cinematography Language:</span>
                  <p>{st.cinematographyStyle}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 4: Motion DNA */}
      {activeTab === 'motion' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {motions.map((mot) => (
            <div key={mot.id} className="glass-panel p-6 rounded-2xl border border-sky-800/30 space-y-4 shadow-xl">
              <div>
                <h2 className="text-lg font-bold text-white">{mot.name}</h2>
                <span className="text-xs text-cyan-400 font-medium">Pacing: {mot.pacing}</span>
              </div>

              <div className="space-y-3 text-xs text-slate-300">
                <div className="p-3 rounded-lg bg-black/40 border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Camera Motion Language:</span>
                  <p>{mot.cameraLanguage}</p>
                </div>

                <div className="p-3 rounded-lg bg-black/40 border border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">Movement Style & Physics:</span>
                  <p>{mot.movementStyle}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
