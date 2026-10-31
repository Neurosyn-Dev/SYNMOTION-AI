/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { execFile } from 'child_process';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import type { AspectRatio, OutputQuality } from '../../types/film.js';
import { QualityControlService, QualityControlResult } from './qualityControl.js';
import { ProceduralVideoGenerator } from './proceduralVideoGenerator.js';

const execFileAsync = promisify(execFile);

export interface AssembleScenesOptions {
  sceneVideoPaths: string[];
  outputPath: string;
  format?: 'mp4' | 'webm';
  aspectRatio?: AspectRatio;
  quality?: OutputQuality;
  fps?: number;
  expectedDuration?: number;
}

export class MasterAssemblyEngine {
  public static async isFFmpegAvailable(): Promise<boolean> {
    try {
      await execFileAsync('/usr/bin/ffmpeg', ['-version']);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Concatenates and standardizes multiple video scenes into a unified master cut.
   */
  public static async assembleProject(
    options: AssembleScenesOptions
  ): Promise<{ outputPath: string; qc: QualityControlResult }> {
    const {
      sceneVideoPaths,
      outputPath,
      format = 'mp4',
      aspectRatio = '16:9',
      quality = '1080p',
      fps = 24,
      expectedDuration,
    } = options;

    if (!sceneVideoPaths || sceneVideoPaths.length === 0) {
      throw new Error('MasterAssemblyEngine: No video scenes provided for assembly.');
    }

    // Verify all input files exist
    for (const p of sceneVideoPaths) {
      if (!fs.existsSync(p)) {
        throw new Error(`MasterAssemblyEngine: Input scene file does not exist: ${p}`);
      }
    }

    const ffmpegReady = await this.isFFmpegAvailable();
    if (!ffmpegReady) {
      throw new Error('MasterAssemblyEngine: FFmpeg binary is not available or executable on the system.');
    }

    const outDir = path.dirname(outputPath);
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    const { width, height } = ProceduralVideoGenerator.getDimensions(aspectRatio, quality);

    // If only one clip and already matching, we can re-encode or copy; if multiple clips, use concat filter
    const inputArgs: string[] = [];
    let filterGraph = '';

    for (let i = 0; i < sceneVideoPaths.length; i++) {
      inputArgs.push('-i', sceneVideoPaths[i]);
      // Standardize each input: scale & pad to width x height, set sar=1, force fps
      filterGraph += `[${i}:v]scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=${fps}[v${i}];`;
      filterGraph += `[${i}:a]aformat=sample_rates=48000:channel_layouts=stereo[a${i}];`;
    }

    // Concat all inputs
    let concatInputs = '';
    for (let i = 0; i < sceneVideoPaths.length; i++) {
      concatInputs += `[v${i}][a${i}]`;
    }
    filterGraph += `${concatInputs}concat=n=${sceneVideoPaths.length}:v=1:a=1[outv][outa]`;

    const encodeArgs: string[] = [];
    if (format === 'webm') {
      encodeArgs.push(
        '-c:v', 'libvpx-vp9',
        '-b:v', '2M',
        '-c:a', 'libopus',
        '-b:a', '160k'
      );
    } else {
      // High-compatibility MP4
      encodeArgs.push(
        '-c:v', 'libx264',
        '-profile:v', 'high',
        '-preset', 'fast',
        '-pix_fmt', 'yuv420p',
        '-c:a', 'aac',
        '-b:a', '192k',
        '-movflags', '+faststart'
      );
    }

    const args = [
      '-y',
      ...inputArgs,
      '-filter_complex',
      filterGraph,
      '-map',
      '[outv]',
      '-map',
      '[outa]',
      ...encodeArgs,
      outputPath,
    ];

    await execFileAsync('/usr/bin/ffmpeg', args);

    // Run Automated Quality Control on the assembled master cut
    const qc = await QualityControlService.inspectMedia(outputPath, {
      targetDuration: expectedDuration,
      durationToleranceSec: 4.0,
      minWidth: Math.floor(width * 0.9),
      minHeight: Math.floor(height * 0.9),
      requireAudio: true,
    });

    if (!qc.passed) {
      console.warn('[MasterAssemblyEngine] QC Warnings on Master Cut:', qc.issues);
    }

    return { outputPath, qc };
  }
}
