/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { execFile } from 'child_process';
import fs from 'fs';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export interface QualityControlResult {
  passed: boolean;
  duration: number;
  fileSize: number;
  width?: number;
  height?: number;
  fps?: number;
  videoCodec?: string;
  hasAudio: boolean;
  audioCodec?: string;
  audioChannels?: number;
  bitrate?: number;
  formatName?: string;
  issues: string[];
  rawProbe?: any;
}

export class QualityControlService {
  /**
   * Run comprehensive FFprobe inspection on a media file.
   */
  public static async inspectMedia(
    filePath: string,
    expected?: {
      targetDuration?: number;
      durationToleranceSec?: number;
      minWidth?: number;
      minHeight?: number;
      requireAudio?: boolean;
    }
  ): Promise<QualityControlResult> {
    const issues: string[] = [];

    // 1. Verify file exists on disk
    if (!fs.existsSync(filePath)) {
      return {
        passed: false,
        duration: 0,
        fileSize: 0,
        hasAudio: false,
        issues: [`File not found at path: ${filePath}`],
      };
    }

    const stats = fs.statSync(filePath);
    if (stats.size === 0) {
      return {
        passed: false,
        duration: 0,
        fileSize: 0,
        hasAudio: false,
        issues: ['File exists but is empty (0 bytes)'],
      };
    }

    // 2. Execute ffprobe to extract format and stream details
    try {
      const { stdout } = await execFileAsync('/usr/bin/ffprobe', [
        '-v',
        'quiet',
        '-print_format',
        'json',
        '-show_format',
        '-show_streams',
        filePath,
      ]);

      const probeData = JSON.parse(stdout);
      const streams = probeData.streams || [];
      const format = probeData.format || {};

      const videoStream = streams.find((s: any) => s.codec_type === 'video');
      const audioStream = streams.find((s: any) => s.codec_type === 'audio');

      // Video check
      if (!videoStream) {
        issues.push('No video stream detected in media container');
      }

      // Audio check
      if (expected?.requireAudio && !audioStream) {
        issues.push('Audio stream is required but none was found in container');
      }

      // Parse duration
      const durationSec = parseFloat(format.duration || videoStream?.duration || '0');
      if (durationSec <= 0) {
        issues.push(`Invalid media duration: ${durationSec}s`);
      }

      // Parse fps
      let fps = 0;
      if (videoStream?.r_frame_rate) {
        const parts = videoStream.r_frame_rate.split('/');
        if (parts.length === 2 && parseFloat(parts[1]) > 0) {
          fps = Math.round(parseFloat(parts[0]) / parseFloat(parts[1]));
        } else {
          fps = parseFloat(videoStream.r_frame_rate);
        }
      }

      const width = videoStream?.width ? parseInt(videoStream.width, 10) : undefined;
      const height = videoStream?.height ? parseInt(videoStream.height, 10) : undefined;

      // Validate dimensions if specified
      if (expected?.minWidth && width && width < expected.minWidth) {
        issues.push(`Video width ${width}px is less than required minimum ${expected.minWidth}px`);
      }
      if (expected?.minHeight && height && height < expected.minHeight) {
        issues.push(`Video height ${height}px is less than required minimum ${expected.minHeight}px`);
      }

      // Validate duration tolerance if specified
      if (expected?.targetDuration) {
        const tolerance = expected.durationToleranceSec ?? 3.0;
        const diff = Math.abs(durationSec - expected.targetDuration);
        if (diff > tolerance) {
          issues.push(
            `Duration discrepancy: measured ${durationSec.toFixed(1)}s, expected ${expected.targetDuration}s (tolerance +/- ${tolerance}s)`
          );
        }
      }

      return {
        passed: issues.length === 0,
        duration: durationSec,
        fileSize: stats.size,
        width,
        height,
        fps,
        videoCodec: videoStream?.codec_name,
        hasAudio: !!audioStream,
        audioCodec: audioStream?.codec_name,
        audioChannels: audioStream?.channels,
        bitrate: format.bit_rate ? parseInt(format.bit_rate, 10) : undefined,
        formatName: format.format_name,
        issues,
        rawProbe: {
          format_name: format.format_name,
          duration: format.duration,
          size: format.size,
          bit_rate: format.bit_rate,
          video_codec: videoStream?.codec_name,
          audio_codec: audioStream?.codec_name,
        },
      };
    } catch (err: any) {
      issues.push(`FFprobe analysis failed: ${err.message}`);
      return {
        passed: false,
        duration: 0,
        fileSize: stats.size,
        hasAudio: false,
        issues,
      };
    }
  }
}
