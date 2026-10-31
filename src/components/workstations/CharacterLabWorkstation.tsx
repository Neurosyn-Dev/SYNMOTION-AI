/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import type { FilmProject, CharacterDNA } from '../../types/film';
import {
  User,
  Sparkles,
  ShieldCheck,
  Palette,
  Activity,
  Layers,
  Camera,
  Shirt,
  Footprints,
  Eye,
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

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-sky-900/30 shadow-2xl relative overflow-hidden">
        <div className="max-w-3xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-400/30 text-sky-300 text-xs font-semibold tracking-wider uppercase">
            <User className="w-3.5 h-3.5 text-sky-400" />
            <span>Character Design & Motion Lab</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white font-cinematic tracking-tight">
            Character Lab & Visual Identity
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Craft reusable protagonist profiles. Define silhouette boundaries, coat materials, concealed facial aesthetics,
            gait inertia, and motion traits that remain stable across multiple productions.
          </p>
        </div>
      </div>

      {activeChar && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Silhouette & Visual Overview */}
          <div className="glass-panel p-6 rounded-2xl border border-sky-800/30 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">{activeChar.name}</h2>
                <span className="text-xs text-sky-400 font-medium">{activeChar.archetype}</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-sky-950 border border-sky-800 text-[10px] font-semibold text-sky-300 uppercase">
                Active Hero
              </span>
            </div>

            {/* Silhouette Card */}
            <div className="h-64 rounded-xl bg-gradient-to-b from-sky-950/30 via-black to-[#050810] border border-sky-800/40 flex flex-col items-center justify-center p-4 relative overflow-hidden text-center">
              <div className="w-20 h-36 border-2 border-dashed border-sky-400/40 rounded-t-full rounded-b-lg flex flex-col items-center justify-between p-2">
                <div className="w-8 h-8 rounded-full bg-sky-400/20 border border-sky-400/50 flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-sky-300 shadow-[0_0_8px_#38bdf8]" />
                </div>
                <div className="w-12 h-16 bg-sky-950/80 border border-sky-500/30 rounded" />
                <div className="w-10 h-3 bg-sky-900/50 rounded" />
              </div>
              <span className="text-xs text-sky-300 font-semibold mt-3">3D Composite Silhouette Verified</span>
              <span className="text-[10px] text-slate-400">Pivoted bottom-center • Wet asphalt contact grounded</span>
            </div>

            {/* Color Swatches */}
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

          {/* Right Column: Detailed Traits & Continuity Specifications */}
          <div className="lg:col-span-2 glass-panel p-6 sm:p-8 rounded-2xl border border-sky-800/30 space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Production Continuity Rules (Enforced by AI Director)</span>
            </h3>

            <div className="space-y-4 text-xs text-slate-200">
              <div className="p-4 rounded-xl bg-black/40 border border-slate-800 space-y-1">
                <span className="font-bold text-sky-300 uppercase text-[10px] flex items-center gap-1.5">
                  <Shirt className="w-3.5 h-3.5" />
                  <span>Costume & Clothing Specifications:</span>
                </span>
                <p className="leading-relaxed text-slate-300">{activeChar.clothing}</p>
              </div>

              <div className="p-4 rounded-xl bg-black/40 border border-slate-800 space-y-1">
                <span className="font-bold text-indigo-300 uppercase text-[10px] flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5" />
                  <span>Facial Concealment & Silhouette Rules:</span>
                </span>
                <p className="leading-relaxed text-slate-300">{activeChar.facialFeatures}</p>
              </div>

              <div className="p-4 rounded-xl bg-black/40 border border-slate-800 space-y-1">
                <span className="font-bold text-amber-300 uppercase text-[10px] flex items-center gap-1.5">
                  <Footprints className="w-3.5 h-3.5" />
                  <span>Kinematic Movement & Wind Physics:</span>
                </span>
                <p className="leading-relaxed text-slate-300">{activeChar.movementTraits}</p>
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center text-xs text-slate-400">
              <span>Saved in personal asset library • Reusable across new films</span>
              <span className="font-mono-code text-sky-400">ID: {activeChar.id}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
