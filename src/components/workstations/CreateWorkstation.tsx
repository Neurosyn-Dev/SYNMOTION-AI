/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import type { FilmProject, ProductionDuration, AspectRatio, OutputQuality } from '../../types/film';
import {
  Sparkles,
  Clapperboard,
  Clock,
  Ratio,
  Sliders,
  Layers,
  Image as ImageIcon,
  Video as VideoIcon,
  Play,
  CheckCircle2,
  AlertCircle,
  Film,
  Zap,
} from 'lucide-react';
import { ProductionJobsPanel } from './ProductionJobsPanel';

interface Props {
  project: FilmProject;
  onUpdateProject: (p: FilmProject) => void;
  onStartOrchestration: (prompt: string, duration: ProductionDuration, ratio: AspectRatio, quality: OutputQuality) => Promise<void>;
  isGenerating: boolean;
  onNavigateToTab: (tab: string) => void;
}

const PRESET_PROMPTS = [
  {
    title: 'Thunderstorm Wanderer (Master 5-Min Film)',
    prompt:
      'Create a cinematic five-minute short film about a mysterious hooded character walking through an abandoned city during a thunderstorm. Begin with distant establishing shots, gradually introduce the character, follow their journey through the city, build emotional tension, and finish with a dramatic cinematic sequence. Use dark atmospheric lighting, realistic rain, detailed environments, emotional orchestral music, and cinematic camera movement.',
    duration: '5m' as ProductionDuration,
    genre: 'Neo-Noir Sci-Fi',
  },
  {
    title: 'Cyberpunk Rooftop Pursuit',
    prompt:
      'A thrilling 3-minute high-octane chase across rain-soaked neon skyscrapers. An agile courier leaping across air-conditioning vents pursued by automated search drones, ending with a heart-stopping leap onto a hovering mag-train.',
    duration: '3m' as ProductionDuration,
    genre: 'Cyberpunk Thriller',
  },
  {
    title: 'The Solitary Titan Monolith',
    prompt:
      'A contemplative 5-minute documentary-style cinematic exploration of an ancient alien megastructure discovered in an arctic blizzard. Towering scale, ominous sonic drones, slow crane reveals, and expedition research crew silhouettes.',
    duration: '5m' as ProductionDuration,
    genre: 'Sci-Fi Mystery',
  },
];

export const CreateWorkstation: React.FC<Props> = ({
  project,
  onUpdateProject,
  onStartOrchestration,
  isGenerating,
  onNavigateToTab,
}) => {
  const [promptText, setPromptText] = useState(project.userPrompt);
  const [duration, setDuration] = useState<ProductionDuration>(project.durationTarget || '5m');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(project.aspectRatio || '2.39:1');
  const [quality, setQuality] = useState<OutputQuality>(project.quality || '4k');
  const [selectedPreset, setSelectedPreset] = useState<number | null>(0);

  const handleApplyPreset = (index: number) => {
    setSelectedPreset(index);
    setPromptText(PRESET_PROMPTS[index].prompt);
    setDuration(PRESET_PROMPTS[index].duration);
  };

  const handleLaunch = () => {
    if (!promptText.trim()) return;
    onStartOrchestration(promptText, duration, aspectRatio, quality);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Hero Studio Banner */}
      <div className="relative rounded-3xl overflow-hidden glass-panel border border-sky-500/20 p-8 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-400/30 text-sky-300 text-xs font-semibold tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>Autonomous Film Production Studio</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white font-cinematic leading-tight">
            Imagine It. Direct It. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-indigo-300 to-amber-200">
              Watch It Come Alive.
            </span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Describe your film in one comprehensive brief. SYNMOTION autonomous AI Director architects the narrative,
            creates the production bible, designs Visual DNA, decomposes scenes, and renders procedural 3D & generative
            footage into a ready-to-watch master cut.
          </p>
        </div>
      </div>

      {/* Preset Inspirations */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Clapperboard className="w-4 h-4 text-sky-400" />
            <span>Curated Creative Briefs</span>
          </h2>
          <span className="text-xs text-slate-400">Select to load comprehensive production plan</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PRESET_PROMPTS.map((p, idx) => (
            <div
              key={p.title}
              onClick={() => handleApplyPreset(idx)}
              className={`p-4 rounded-xl cursor-pointer transition-all border ${
                selectedPreset === idx
                  ? 'glass-panel-active border-sky-400/50 bg-sky-950/30'
                  : 'glass-panel-subtle hover:border-slate-600 bg-black/40'
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-white">{p.title}</span>
                <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono-code font-bold">
                  {p.duration}
                </span>
              </div>
              <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">{p.prompt}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Main Creation Card */}
      <div className="glass-panel rounded-2xl p-6 sm:p-8 space-y-6 border border-sky-800/30 shadow-xl">
        {/* Natural Language Prompt Area */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Film className="w-4 h-4 text-sky-400" />
              <span>Master Film Production Brief</span>
            </label>
            <span className="text-xs text-slate-400">One prompt generates screenplay, bible, 3D scenes & edit</span>
          </div>

          <textarea
            value={promptText}
            onChange={(e) => {
              setPromptText(e.target.value);
              setSelectedPreset(null);
            }}
            rows={5}
            placeholder="Describe your film in detail: genre, character arcs, visual style, atmosphere, camera movement, audio design, and ending sequence..."
            className="w-full bg-[#050810]/80 border border-slate-700/80 rounded-xl p-4 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-all font-sans leading-relaxed"
          />
        </div>

        {/* Configuration Controls Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
          {/* Duration Selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Production Target Duration</span>
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value as ProductionDuration)}
              className="w-full bg-black/60 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-medium"
            >
              <option value="30s">30 Seconds (Teaser Short)</option>
              <option value="1m">1 Minute (Cinematic Commercial)</option>
              <option value="3m">3 Minutes (Narrative Scene)</option>
              <option value="5m">5 Minutes (Standard Feature Short) ★</option>
              <option value="10m">10 Minutes (Extended Narrative)</option>
              <option value="15m">15 Minutes (Full Short Film)</option>
              <option value="30m">30 Minutes (Anthology Pilot)</option>
            </select>
            <p className="text-[11px] text-slate-400">
              SYNMOTION calculates scene count & shot durations to deliver full run time.
            </p>
          </div>

          {/* Aspect Ratio */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Ratio className="w-3.5 h-3.5 text-sky-400" />
              <span>Cinematographic Aspect Ratio</span>
            </label>
            <select
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
              className="w-full bg-black/60 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-medium"
            >
              <option value="2.39:1">2.39:1 Anamorphic Panavision</option>
              <option value="16:9">16:9 Cinema Widescreen</option>
              <option value="9:16">9:16 Mobile Vertical</option>
              <option value="4:3">4:3 Academy Format</option>
            </select>
            <p className="text-[11px] text-slate-400">Lens simulation adjusts framing and letterboxing accordingly.</p>
          </div>

          {/* Render Quality */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-indigo-400" />
              <span>Render Resolution</span>
            </label>
            <select
              value={quality}
              onChange={(e) => setQuality(e.target.value as OutputQuality)}
              className="w-full bg-black/60 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 font-medium"
            >
              <option value="4k">Cinema 4K (3840x2160)</option>
              <option value="1080p">Studio 1080p (1920x1080)</option>
              <option value="720p">Draft 720p (Fast)</option>
            </select>
            <p className="text-[11px] text-slate-400">Procedural 3D & generative pipeline upscaled for production master.</p>
          </div>
        </div>

        {/* Reference & Visual DNA Context Chips */}
        <div className="p-4 rounded-xl bg-black/40 border border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-slate-400 font-semibold uppercase tracking-wider text-[11px]">Active References:</span>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-sky-950/60 border border-sky-800 text-sky-200">
              <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
              <span>{project.imageReferences.length} Images</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-indigo-950/60 border border-indigo-800 text-indigo-200">
              <VideoIcon className="w-3.5 h-3.5 text-indigo-400" />
              <span>{project.videoReferences.length} Video Motion Refs</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-950/60 border border-amber-800 text-amber-200">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>Visual DNA: Kaelen & Veridia Ruins</span>
            </div>
          </div>

          <button
            onClick={() => onNavigateToTab('REFERENCE LIBRARY')}
            className="text-sky-400 hover:text-sky-300 font-medium underline-offset-4 hover:underline text-xs"
          >
            Manage References & DNA →
          </button>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-between pt-2">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Autonomous Orchestrator Ready • Checkpoints saved persistently</span>
          </div>

          <button
            disabled={isGenerating || !promptText.trim()}
            onClick={handleLaunch}
            className={`px-8 py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all shadow-xl flex items-center gap-2.5 ${
              isGenerating
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white shadow-sky-500/25 cursor-pointer active:scale-95'
            }`}
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>AI DIRECTOR ORCHESTRATING PRODUCTION...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>CREATE FILM PRODUCTION</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Autonomous Production Orchestrator Status Monitor */}
      <div className="glass-panel rounded-2xl p-6 space-y-4 border border-sky-900/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-sky-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Autonomous Production Pipeline (7 Phases)
            </h3>
          </div>
          <span className="text-xs font-mono-code text-sky-300">
            {project.currentPhase === 'COMPLETED' ? 'STATUS: MASTER PRODUCTION READY' : `PHASE: ${project.currentPhase}`}
          </span>
        </div>

        {/* 7 Phase Pipeline Stepper */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {[
            { id: 'BRIEF_INTERPRETATION', label: '1. Creative Brief', desc: 'AI Screenwriter' },
            { id: 'SCREENPLAY_AND_BIBLE', label: '2. Story & Bible', desc: 'Narrative Arc' },
            { id: 'STORYBOARD_DECOMPOSITION', label: '3. Storyboard', desc: 'Scene Breakdown' },
            { id: 'VISUAL_DNA_SYNC', label: '4. Visual DNA', desc: 'Continuity Match' },
            { id: 'SCENE_GENERATION', label: '5. Scene Prod', desc: '3D & Generative' },
            { id: 'QUALITY_CONTROL', label: '6. Auto QC', desc: 'Consistency Check' },
            { id: 'ASSEMBLY_AND_RENDER', label: '7. Master Assembly', desc: 'Multitrack Final' },
          ].map((step, idx) => {
            const isDone = project.currentPhase === 'COMPLETED';
            return (
              <div
                key={step.id}
                className={`p-3 rounded-lg border text-left transition-all ${
                  isDone
                    ? 'bg-sky-950/40 border-sky-600/40 text-slate-200'
                    : 'bg-black/30 border-slate-800 text-slate-500'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold">{step.label}</span>
                  {isDone && <CheckCircle2 className="w-3 h-3 text-sky-400" />}
                </div>
                <span className="text-[10px] text-slate-400 block">{step.desc}</span>
              </div>
            );
          })}
        </div>

        {/* Quick Review of active film */}
        {project.storyboard.length > 0 && (
          <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs font-semibold text-white">{project.title}</span>
              <p className="text-xs text-slate-400">
                {project.storyboard.length} Scenes assembled • {project.durationSeconds}s Total Duration •{' '}
                {project.genre}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => onNavigateToTab('STORYBOARD')}
                className="px-3.5 py-1.5 rounded-lg bg-black/60 hover:bg-slate-800 border border-slate-700 text-xs font-medium text-slate-200 transition-all"
              >
                Inspect Storyboard ({project.storyboard.length})
              </button>
              <button
                onClick={() => onNavigateToTab('VIDEO STUDIO')}
                className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-xs font-semibold text-white transition-all shadow"
              >
                Watch Film in Studio →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Real Persistent Background Production Jobs Queue */}
      <ProductionJobsPanel projectId={project.id} />
    </div>
  );
};
