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

    // If multiple clips, use concat filter with explicit PTS normalization
    const inputArgs: string[] = [];
    let filterGraph = '';

    for (let i = 0; i < sceneVideoPaths.length; i++) {
      inputArgs.push('-i', sceneVideoPaths[i]);
      // Standardize each input: scale & pad to width x height, set sar=1, force fps, normalize PTS to 0-based monotonic
      filterGraph += `[${i}:v]scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=${fps},setpts=PTS-STARTPTS[v${i}];`;
      filterGraph += `[${i}:a]aformat=sample_rates=48000:channel_layouts=stereo,asetpts=PTS-STARTPTS[a${i}];`;
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
        '-b:a', '160k',
        '-vsync', 'cfr',
        '-r', fps.toString(),
        '-max_muxing_queue_size', '4096'
      );
    } else {
      // High-compatibility MP4 with constant frame rate and atomic faststart
      encodeArgs.push(
        '-c:v', 'libx264',
        '-profile:v', 'high',
        '-preset', 'veryfast',
        '-pix_fmt', 'yuv420p',
        '-vsync', 'cfr',
        '-r', fps.toString(),
        '-c:a', 'aac',
        '-b:a', '192k',
        '-ar', '48000',
        '-ac', '2',
        '-max_muxing_queue_size', '4096',
        '-movflags', '+faststart'
      );
    }

    // Isolate writing to a dedicated temp file to prevent MOOV duplication or partial reads
    const tempAssemblyPath = path.join(
      outDir,
      `.assembly_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.tmp.${format}`
    );

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
      tempAssemblyPath,
    ];

    try {
      await execFileAsync('/usr/bin/ffmpeg', args);

      // Deep stream decode verification before publishing file
      const streamCheck = await QualityControlService.verifyStreamIntegrity(tempAssemblyPath);
      if (!streamCheck.valid) {
        throw new Error(
          `MasterAssemblyEngine: Assembled stream failed integrity decoding check: ${streamCheck.errors.join('; ')}`
        );
      }

      // Safe atomic publish
      if (fs.existsSync(outputPath)) {
        try {
          fs.unlinkSync(outputPath);
        } catch {}
      }
      fs.renameSync(tempAssemblyPath, outputPath);
    } catch (err) {
      if (fs.existsSync(tempAssemblyPath)) {
        try {
          fs.unlinkSync(tempAssemblyPath);
        } catch {}
      }
      throw err;
    }

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
