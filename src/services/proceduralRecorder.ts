/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { audioEngine } from '../utils/audioEngine';

export interface RecordOptions {
  canvas: HTMLCanvasElement;
  durationSeconds: number;
  fps?: number;
  projectId: string;
  sceneId?: string;
  onProgress?: (progressPercent: number, elapsedSec: number) => void;
}

export class ProceduralCanvasRecorder {
  /**
   * Captures the rendered Three.js WebGL canvas and synchronized Web Audio stream,
   * producing a real playable video recording and uploading it to persistent storage.
   */
  public static async recordAndUpload(options: RecordOptions): Promise<{ assetId: string; url: string }> {
    const { canvas, durationSeconds, fps = 24, projectId, sceneId, onProgress } = options;

    if (!canvas) {
      throw new Error('Canvas element is required for procedural recording.');
    }

    // 1. Capture canvas video stream
    const canvasStream = (canvas as any).captureStream ? (canvas as any).captureStream(fps) : null;
    if (!canvasStream) {
      throw new Error('Canvas captureStream() is not supported in this environment.');
    }

    // 2. Capture synchronized procedural audio
    const audioStream = audioEngine.getMediaStream();
    const tracks: MediaStreamTrack[] = [...canvasStream.getVideoTracks()];

    if (audioStream && audioStream.getAudioTracks().length > 0) {
      tracks.push(...audioStream.getAudioTracks());
    }

    const combinedStream = new MediaStream(tracks);

    // 3. Determine best supported codec
    const mimeTypes = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
    ];
    let selectedMimeType = '';
    for (const mime of mimeTypes) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(mime)) {
        selectedMimeType = mime;
        break;
      }
    }

    if (!selectedMimeType) {
      selectedMimeType = 'video/webm';
    }

    const recordedChunks: Blob[] = [];

    return new Promise((resolve, reject) => {
      let mediaRecorder: MediaRecorder;
      try {
        mediaRecorder = new MediaRecorder(combinedStream, {
          mimeType: selectedMimeType,
          videoBitsPerSecond: 6000000, // 6 Mbps high quality
        });
      } catch (err: any) {
        return reject(new Error(`MediaRecorder initialization failed: ${err.message}`));
      }

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunks.push(event.data);
        }
      };

      const startTime = performance.now();
      const intervalTimer = setInterval(() => {
        const elapsed = (performance.now() - startTime) / 1000;
        const progress = Math.min(99, Math.round((elapsed / durationSeconds) * 100));
        onProgress?.(progress, Math.min(durationSeconds, Math.round(elapsed)));
      }, 100);

      mediaRecorder.onstop = async () => {
        clearInterval(intervalTimer);
        onProgress?.(100, durationSeconds);

        try {
          const videoBlob = new Blob(recordedChunks, { type: selectedMimeType });
          if (videoBlob.size === 0) {
            throw new Error('Recorded video blob is empty (0 bytes).');
          }

          // 4. Upload finished recording to persistent storage
          const formData = new FormData();
          const filename = `scene_${sceneId || 'proc'}_${Date.now()}.webm`;
          formData.append('file', videoBlob, filename);
          formData.append('projectId', projectId);
          if (sceneId) formData.append('sceneId', sceneId);
          formData.append('assetType', 'procedural_3d_capture');

          const uploadRes = await fetch('/api/assets/upload', {
            method: 'POST',
            body: formData,
          });

          const result = await uploadRes.json();
          if (!result.success || !result.asset) {
            throw new Error(result.error || 'Failed to upload recorded scene asset.');
          }

          resolve({
            assetId: result.asset.id,
            url: result.asset.url,
          });
        } catch (err) {
          reject(err);
        }
      };

      mediaRecorder.onerror = (e) => {
        clearInterval(intervalTimer);
        reject(new Error(`MediaRecorder error: ${(e as any).error?.message || 'Unknown error'}`));
      };

      // Start recording with 250ms chunk interval
      mediaRecorder.start(250);

      // Stop automatically after durationSeconds
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, durationSeconds * 1000);
    });
  }
}
