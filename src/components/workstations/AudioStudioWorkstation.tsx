/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import type { FilmProject } from '../../types/film';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  CloudRain,
  Zap,
  Activity,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { audioEngine } from '../../utils/audioEngine';

interface Props {
  project: FilmProject;
  onUpdateProject: (p: FilmProject) => void;
}

export const AudioStudioWorkstation: React.FC<Props> = ({
  project,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [masterVolume, setMasterVolume] = useState(0.7);
  const [ambienceVolume, setAmbienceVolume] = useState(0.6);
  const [scoreVolume, setScoreVolume] = useState(0.5);
  const [sfxVolume, setSfxVolume] = useState(0.8);

  const toggleSoundscape = () => {
    if (isPlaying) {
      audioEngine.stopAtmosphere();
      setIsPlaying(false);
    } else {
      audioEngine.startAtmosphere('thunderstorm');
      setIsPlaying(true);
    }
  };

  const handleTriggerThunder = () => {
    audioEngine.triggerThunder();
  };

  const updateFader = (track: 'master' | 'ambience' | 'score' | 'sfx', val: number) => {
    if (track === 'master') setMasterVolume(val);
    if (track === 'ambience') setAmbienceVolume(val);
    if (track === 'score') setScoreVolume(val);
    if (track === 'sfx') setSfxVolume(val);
    audioEngine.setFader(track, val);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Header Banner */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-sky-900/30 shadow-2xl relative overflow-hidden">
        <div className="max-w-3xl space-y-3 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 text-xs font-semibold tracking-wider uppercase">
            <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Procedural Soundscape & Synthesizer</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white font-cinematic tracking-tight">
            Audio Production Studio
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Real-time multi-channel Web Audio engine. Generates continuous rainfall noise, low-frequency orchestral drones,
            dynamic acoustic thunder claps, and atmospheric dialogue ducking with zero external 404 dependencies.
          </p>
        </div>
      </div>

      {/* Live Audio Control Console */}
      <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-sky-800/40 shadow-xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSoundscape}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs tracking-wide transition-all flex items-center gap-2 shadow-lg ${
                isPlaying
                  ? 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-cyan-500/25'
                  : 'bg-slate-800 hover:bg-slate-700 text-white'
              }`}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-black" /> : <Play className="w-4 h-4 fill-white" />}
              <span>{isPlaying ? 'STOP SOUNDSCAPE' : 'START LIVE SOUNDSCAPE'}</span>
            </button>

            <button
              onClick={handleTriggerThunder}
              className="px-4 py-2.5 rounded-xl bg-amber-600/30 hover:bg-amber-600/50 border border-amber-500/50 text-amber-200 font-semibold text-xs flex items-center gap-2 transition-all"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>Trigger Thunder Climax</span>
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono-code text-slate-400">
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>48,000 Hz • 32-Bit Float Web Audio Output</span>
          </div>
        </div>

        {/* Multitrack Faders Console */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 pt-2">
          {/* Master */}
          <div className="p-4 rounded-xl bg-black/40 border border-slate-800 space-y-3 text-xs">
            <div className="flex items-center justify-between font-bold text-white uppercase text-[11px]">
              <span>Master Output</span>
              <span className="font-mono-code text-sky-400">{Math.round(masterVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={masterVolume}
              onChange={(e) => updateFader('master', parseFloat(e.target.value))}
              className="w-full accent-sky-400 cursor-pointer"
            />
            <p className="text-[11px] text-slate-400">Main mix bus to final video render</p>
          </div>

          {/* Ambience / Rain */}
          <div className="p-4 rounded-xl bg-black/40 border border-slate-800 space-y-3 text-xs">
            <div className="flex items-center justify-between font-bold text-cyan-300 uppercase text-[11px]">
              <span className="flex items-center gap-1.5">
                <CloudRain className="w-3.5 h-3.5" />
                <span>Storm Ambience</span>
              </span>
              <span className="font-mono-code">{Math.round(ambienceVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={ambienceVolume}
              onChange={(e) => updateFader('ambience', parseFloat(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <p className="text-[11px] text-slate-400">Procedural pink-noise rain & wind filter</p>
          </div>

          {/* Score / Drone */}
          <div className="p-4 rounded-xl bg-black/40 border border-slate-800 space-y-3 text-xs">
            <div className="flex items-center justify-between font-bold text-indigo-300 uppercase text-[11px]">
              <span>Orchestral Score</span>
              <span className="font-mono-code">{Math.round(scoreVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={scoreVolume}
              onChange={(e) => updateFader('score', parseFloat(e.target.value))}
              className="w-full accent-indigo-400 cursor-pointer"
            />
            <p className="text-[11px] text-slate-400">55Hz Sub-bass harmonic drone oscillator</p>
          </div>

          {/* SFX / Foley */}
          <div className="p-4 rounded-xl bg-black/40 border border-slate-800 space-y-3 text-xs">
            <div className="flex items-center justify-between font-bold text-amber-300 uppercase text-[11px]">
              <span>SFX & Thunder</span>
              <span className="font-mono-code">{Math.round(sfxVolume * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={sfxVolume}
              onChange={(e) => updateFader('sfx', parseFloat(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
            <p className="text-[11px] text-slate-400">Dynamic thunder resonance & footsteps</p>
          </div>
        </div>
      </div>
    </div>
  );
};
