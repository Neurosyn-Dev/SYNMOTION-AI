/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { AnimationTrack, KeyframeData, Vector3D } from '../sceneGraph/types';

export class AnimationEngine {
  /**
   * Evaluates an animation track at a specific time (in seconds), interpolating between keyframes.
   */
  public static evaluateTrack(track: AnimationTrack, timeSec: number): any {
    const kfs = track.keyframes;
    if (!kfs || kfs.length === 0) return null;

    // If before first keyframe or single keyframe
    if (kfs.length === 1 || timeSec <= kfs[0].timeSec) {
      return kfs[0].value;
    }

    // If after last keyframe
    if (timeSec >= kfs[kfs.length - 1].timeSec) {
      return kfs[kfs.length - 1].value;
    }

    // Find bounding keyframes
    let prev = kfs[0];
    let next = kfs[1];
    for (let i = 0; i < kfs.length - 1; i++) {
      if (timeSec >= kfs[i].timeSec && timeSec <= kfs[i + 1].timeSec) {
        prev = kfs[i];
        next = kfs[i + 1];
        break;
      }
    }

    const span = next.timeSec - prev.timeSec;
    if (span <= 0) return prev.value;

    let t = (timeSec - prev.timeSec) / span;

    // Apply easing
    t = this.applyEasing(t, prev.easing);

    // Interpolate based on type
    if (typeof prev.value === 'number' && typeof next.value === 'number') {
      return prev.value + (next.value - prev.value) * t;
    }

    // Vector3D interpolation (e.g. position, rotation, scale)
    if (this.isVector3D(prev.value) && this.isVector3D(next.value)) {
      return {
        x: prev.value.x + (next.value.x - prev.value.x) * t,
        y: prev.value.y + (next.value.y - prev.value.y) * t,
        z: prev.value.z + (next.value.z - prev.value.z) * t,
      };
    }

    // Discrete/Stepped values (strings, postures, presets)
    return t < 0.5 ? prev.value : next.value;
  }

  private static isVector3D(v: any): v is Vector3D {
    return v && typeof v.x === 'number' && typeof v.y === 'number' && typeof v.z === 'number';
  }

  private static applyEasing(t: number, easing?: string): number {
    switch (easing) {
      case 'easeIn':
        return t * t;
      case 'easeOut':
        return t * (2 - t);
      case 'easeInOut':
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      case 'step':
        return t < 1 ? 0 : 1;
      case 'linear':
      default:
        return t;
    }
  }

  /**
   * Inserts or updates a keyframe at timeSec in the track.
   */
  public static insertKeyframe(
    track: AnimationTrack,
    timeSec: number,
    value: any,
    easing: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' = 'easeInOut'
  ): AnimationTrack {
    const existingIndex = track.keyframes.findIndex(
      (kf) => Math.abs(kf.timeSec - timeSec) < 0.04 // Snap within ~1 frame at 24fps
    );

    const newKf: KeyframeData = {
      id: `kf-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timeSec: Math.round(timeSec * 100) / 100,
      value: JSON.parse(JSON.stringify(value)),
      easing,
    };

    let updatedKfs = [...track.keyframes];
    if (existingIndex >= 0) {
      updatedKfs[existingIndex] = newKf;
    } else {
      updatedKfs.push(newKf);
      updatedKfs.sort((a, b) => a.timeSec - b.timeSec);
    }

    return {
      ...track,
      keyframes: updatedKfs,
    };
  }

  /**
   * Removes a keyframe by ID.
   */
  public static removeKeyframe(track: AnimationTrack, keyframeId: string): AnimationTrack {
    return {
      ...track,
      keyframes: track.keyframes.filter((kf) => kf.id !== keyframeId),
    };
  }
}
