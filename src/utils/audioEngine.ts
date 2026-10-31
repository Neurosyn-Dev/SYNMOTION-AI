/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Procedural Web Audio Engine for SYNMOTION AI
// Generates realistic thunderstorm rain, sub-bass cinematic drones, thunderclaps, and harmonic orchestral pads without any external 404 dependencies.

class ProceduralAudioEngine {
  private ctx: AudioContext | null = null;
  private isPlaying = false;
  private rainNode: AudioNode | null = null;
  private droneOsc1: OscillatorNode | null = null;
  private droneOsc2: OscillatorNode | null = null;
  private padGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private faderGains: { [key: string]: GainNode } = {};
  private mediaStreamDest: MediaStreamAudioDestinationNode | null = null;

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  /**
   * Returns a live MediaStream containing the synthesized audio for recording into MediaRecorder.
   */
  public getMediaStream(): MediaStream | null {
    this.initContext();
    if (!this.ctx) return null;
    if (!this.mediaStreamDest) {
      this.mediaStreamDest = this.ctx.createMediaStreamDestination();
      if (this.masterGain) {
        this.masterGain.connect(this.mediaStreamDest);
      }
    }
    return this.mediaStreamDest.stream;
  }

  public startAtmosphere(weather: string = 'thunderstorm') {
    this.initContext();
    if (!this.ctx) return;
    if (this.isPlaying) return;

    this.isPlaying = true;
    const now = this.ctx.currentTime;

    // Master Gain
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0.7, now);
    this.masterGain.connect(this.ctx.destination);

    // Also connect to media stream destination for recorder if initialized
    if (!this.mediaStreamDest) {
      this.mediaStreamDest = this.ctx.createMediaStreamDestination();
    }
    this.masterGain.connect(this.mediaStreamDest);

    // Track Faders
    this.faderGains['ambience'] = this.ctx.createGain();
    this.faderGains['ambience'].gain.setValueAtTime(0.6, now);
    this.faderGains['ambience'].connect(this.masterGain);

    this.faderGains['score'] = this.ctx.createGain();
    this.faderGains['score'].gain.setValueAtTime(0.5, now);
    this.faderGains['score'].connect(this.masterGain);

    this.faderGains['sfx'] = this.ctx.createGain();
    this.faderGains['sfx'].gain.setValueAtTime(0.8, now);
    this.faderGains['sfx'].connect(this.masterGain);

    // 1. Procedural Rain Noise (Pink noise buffer through bandpass filter)
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
      b6 = white * 0.115926;
    }

    const whiteNoiseSource = this.ctx.createBufferSource();
    whiteNoiseSource.buffer = noiseBuffer;
    whiteNoiseSource.loop = true;

    const rainFilter = this.ctx.createBiquadFilter();
    rainFilter.type = 'lowpass';
    rainFilter.frequency.setValueAtTime(weather === 'thunderstorm' ? 3200 : 1800, now);

    whiteNoiseSource.connect(rainFilter);
    rainFilter.connect(this.faderGains['ambience']);
    whiteNoiseSource.start();
    this.rainNode = whiteNoiseSource;

    // 2. Cinematic Sub-Bass Drone (Deep atmospheric 55Hz & 82.5Hz)
    this.droneOsc1 = this.ctx.createOscillator();
    this.droneOsc1.type = 'sawtooth';
    this.droneOsc1.frequency.setValueAtTime(55, now); // A1 note

    this.droneOsc2 = this.ctx.createOscillator();
    this.droneOsc2.type = 'sine';
    this.droneOsc2.frequency.setValueAtTime(82.41, now); // E2 note

    const droneFilter = this.ctx.createBiquadFilter();
    droneFilter.type = 'lowpass';
    droneFilter.frequency.setValueAtTime(140, now);

    this.padGain = this.ctx.createGain();
    this.padGain.gain.setValueAtTime(0.12, now);

    this.droneOsc1.connect(droneFilter);
    this.droneOsc2.connect(droneFilter);
    droneFilter.connect(this.padGain);
    this.padGain.connect(this.faderGains['score']);

    this.droneOsc1.start();
    this.droneOsc2.start();
  }

  public triggerThunder() {
    this.initContext();
    if (!this.ctx || !this.faderGains['sfx']) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 1.2);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(250, now);

    gain.gain.setValueAtTime(0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 3.0);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.faderGains['sfx']);

    osc.start(now);
    osc.stop(now + 3.2);
  }

  public setFader(track: 'ambience' | 'score' | 'sfx' | 'master', value: number) {
    if (track === 'master' && this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(value, this.ctx.currentTime, 0.05);
    } else if (this.faderGains[track] && this.ctx) {
      this.faderGains[track].gain.setTargetAtTime(value, this.ctx.currentTime, 0.05);
    }
  }

  public stopAtmosphere() {
    if (!this.isPlaying) return;
    try {
      this.rainNode && (this.rainNode as any).stop?.();
      this.droneOsc1 && this.droneOsc1.stop();
      this.droneOsc2 && this.droneOsc2.stop();
    } catch {
      // Ignore cleanup errors
    }
    this.isPlaying = false;
  }

  public getStatus() {
    return this.isPlaying;
  }
}

export const audioEngine = new ProceduralAudioEngine();
