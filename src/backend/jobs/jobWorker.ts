/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import path from 'path';
import fs from 'fs';
import { JobManager } from './jobManager.js';
import { JobRepository } from '../db/jobRepository.js';
import { ProjectRepository } from '../db/projectRepository.js';
import { MediaAssetService } from '../storage/mediaAssetService.js';
import { ProceduralVideoGenerator } from '../media/proceduralVideoGenerator.js';
import { MasterAssemblyEngine } from '../media/assemblyEngine.js';
import { AudioSynthesisService } from '../media/audioSynthesis.js';
import { QualityControlService } from '../media/qualityControl.js';
import type { ProductionJob, StoryboardScene } from '../../types/film.js';

export class JobWorker {
  private static isRunning = false;
  private static pollTimer: NodeJS.Timeout | null = null;
  private static processingJobs = new Set<string>();

  /**
   * Starts the background job polling worker.
   */
  public static start(pollIntervalMs = 2000): void {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('[JobWorker] Started background production worker pool.');

    // Immediate check
    this.processPendingQueue().catch((err) =>
      console.error('[JobWorker] Error in initial queue poll:', err)
    );

    this.pollTimer = setInterval(() => {
      this.processPendingQueue().catch((err) =>
        console.error('[JobWorker] Error in queue poll cycle:', err)
      );
    }, pollIntervalMs);
  }

  public static stop(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    this.isRunning = false;
    console.log('[JobWorker] Stopped background production worker.');
  }

  /**
   * Process all eligible active jobs.
   */
  public static async processPendingQueue(): Promise<void> {
    const activeJobs = JobRepository.listActive();
    for (const job of activeJobs) {
      if (this.processingJobs.has(job.id)) continue;

      if (job.status === 'QUEUED' || job.status === 'RETRYING') {
        // Dispatch job asynchronously
        this.executeJob(job.id).catch((err) => {
          console.error(`[JobWorker] Unhandled failure executing job ${job.id}:`, err);
        });
      }
    }
  }

  /**
   * Executes a single production job through its lifecycle.
   */
  public static async executeJob(jobId: string): Promise<void> {
    if (this.processingJobs.has(jobId)) return;
    this.processingJobs.add(jobId);

    try {
      const job = JobManager.getJob(jobId);
      if (!job || job.status === 'CANCELLED' || job.status === 'COMPLETED') {
        return;
      }

      console.log(`[JobWorker] Dispatching job ${job.id} (${job.jobType})`);
      JobManager.transitionStatus(job.id, 'PROCESSING', 5);

      switch (job.jobType) {
        case 'PROCEDURAL_RENDER':
          await this.handleProceduralRender(job);
          break;

        case 'AUDIO_GENERATION':
          await this.handleAudioGeneration(job);
          break;

        case 'MASTER_ASSEMBLY':
        case 'EXPORT':
          await this.handleMasterAssembly(job);
          break;

        case 'QUALITY_CONTROL':
          await this.handleQualityControl(job);
          break;

        default:
          console.log(`[JobWorker] Job type ${job.jobType} handled synchronously or by external provider.`);
          JobManager.transitionStatus(job.id, 'COMPLETED', 100);
          break;
      }
    } catch (err: any) {
      console.error(`[JobWorker] Error processing job ${jobId}:`, err);
      const currentJob = JobManager.getJob(jobId);
      if (currentJob && currentJob.status !== 'CANCELLED') {
        const canRetry = currentJob.retryCount < currentJob.maxRetries;
        if (canRetry) {
          const nextRetry = currentJob.retryCount + 1;
          JobRepository.save({
            ...currentJob,
            status: 'RETRYING',
            retryCount: nextRetry,
            errorDetails: `Execution error (attempt ${nextRetry}): ${err.message}`,
            updatedAt: new Date().toISOString(),
          });
        } else {
          JobManager.transitionStatus(
            jobId,
            'FAILED',
            undefined,
            `Fatal job error after ${currentJob.retryCount} retries: ${err.message}`
          );
        }
      }
    } finally {
      this.processingJobs.delete(jobId);
    }
  }

  // ==========================================
  // HANDLERS
  // ==========================================

  private static async handleProceduralRender(job: ProductionJob): Promise<void> {
    const project = ProjectRepository.getById(job.projectId);
    if (!project) throw new Error(`Project not found: ${job.projectId}`);

    const scene = project.storyboard.find((s) => s.id === job.sceneId) || project.storyboard[0];
    if (!scene) throw new Error(`Scene not found for job: ${job.sceneId}`);

    JobManager.transitionStatus(job.id, 'PROCESSING', 20);

    const tempDir = path.resolve(process.cwd(), 'data', 'temp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const outputPath = path.join(tempDir, `render_${scene.id}_${Date.now()}.mp4`);
    const duration = job.inputParams?.durationSeconds || scene.durationSeconds || 10;
    const fps = job.inputParams?.fps || project.fps || 24;
    const weather = scene.procedural3DConfig?.weather || 'thunderstorm';
    const cameraMovement = scene.procedural3DConfig?.cameraMovement || 'dolly_in';

    JobManager.transitionStatus(job.id, 'PROCESSING', 45);

    const { videoPath, qc } = await ProceduralVideoGenerator.renderScene({
      sceneTitle: scene.title,
      sceneNumber: scene.sceneNumber,
      durationSeconds: duration,
      fps,
      aspectRatio: project.aspectRatio,
      quality: project.quality,
      weather: weather as any,
      cameraMovement,
      outputPath,
    });

    JobManager.transitionStatus(job.id, 'QUALITY_CHECK', 85);

    if (!qc.passed) {
      console.warn(`[JobWorker] QC warning for scene ${scene.id}:`, qc.issues);
    }

    // Register asset in persistent media storage
    const videoBuffer = fs.readFileSync(videoPath);
    const asset = await MediaAssetService.storeAssetBuffer({
      projectId: project.id,
      sceneId: scene.id,
      assetType: 'procedural_3d_capture',
      originalFilename: `scene_${scene.sceneNumber}_procedural.mp4`,
      mimeType: 'video/mp4',
      buffer: videoBuffer,
      metadata: {
        duration: qc.duration,
        fps: qc.fps,
        width: qc.width,
        height: qc.height,
        qualityControl: qc,
      },
    });

    // Clean up temp file
    try {
      fs.unlinkSync(videoPath);
    } catch {}

    // Update scene with generated URL
    const updatedStoryboard = project.storyboard.map((s) => {
      if (s.id === scene.id) {
        return {
          ...s,
          generatedVideoUrl: asset.url,
          status: 'COMPLETED' as const,
        };
      }
      return s;
    });

    ProjectRepository.save({
      ...project,
      storyboard: updatedStoryboard,
      updatedAt: new Date().toISOString(),
    });

    JobManager.transitionStatus(job.id, 'COMPLETED', 100, undefined, [asset.id]);
  }

  private static async handleAudioGeneration(job: ProductionJob): Promise<void> {
    const project = ProjectRepository.getById(job.projectId);
    if (!project) throw new Error(`Project not found: ${job.projectId}`);

    JobManager.transitionStatus(job.id, 'PROCESSING', 30);

    const tempDir = path.resolve(process.cwd(), 'data', 'temp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const outputPath = path.join(tempDir, `audio_${job.id}_${Date.now()}.aac`);
    const duration = job.inputParams?.durationSeconds || 30;
    const weather = job.inputParams?.weather || 'thunderstorm';

    await AudioSynthesisService.synthesizeAtmosphere({
      durationSeconds: duration,
      weather,
      outputPath,
    });

    JobManager.transitionStatus(job.id, 'QUALITY_CHECK', 80);

    const audioBuffer = fs.readFileSync(outputPath);
    const asset = await MediaAssetService.storeAssetBuffer({
      projectId: project.id,
      sceneId: job.sceneId,
      assetType: 'music',
      originalFilename: `atmosphere_${duration}s.aac`,
      mimeType: 'audio/aac',
      buffer: audioBuffer,
      metadata: {
        duration,
        weather,
      },
    });

    try {
      fs.unlinkSync(outputPath);
    } catch {}

    JobManager.transitionStatus(job.id, 'COMPLETED', 100, undefined, [asset.id]);
  }

  private static async handleMasterAssembly(job: ProductionJob): Promise<void> {
    const project = ProjectRepository.getById(job.projectId);
    if (!project) throw new Error(`Project not found: ${job.projectId}`);

    JobManager.transitionStatus(job.id, 'PROCESSING', 15);

    const tempDir = path.resolve(process.cwd(), 'data', 'temp');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const format = job.inputParams?.format || 'mp4';
    const quality = job.inputParams?.quality || project.quality || '1080p';
    const aspectRatio = job.inputParams?.aspectRatio || project.aspectRatio || '16:9';
    const fps = job.inputParams?.fps || project.fps || 24;

    // Gathers scene video files. If any scene lacks footage, generates real procedural footage for it!
    const sceneVideoPaths: string[] = [];
    const scenesToProcess = project.storyboard.length > 0 ? project.storyboard : [];

    const totalScenes = scenesToProcess.length;
    let sceneIndex = 0;

    for (const scene of scenesToProcess) {
      sceneIndex++;
      const sceneProgress = 15 + Math.floor((sceneIndex / Math.max(1, totalScenes)) * 45);
      JobManager.transitionStatus(job.id, 'PROCESSING', sceneProgress);

      let localPath: string | null = null;

      // Check if scene already has an asset on disk
      if (scene.generatedVideoUrl) {
        const assetId = scene.generatedVideoUrl.replace('/api/assets/', '').replace('/stream', '');
        const asset = MediaAssetService.getAsset(assetId);
        if (asset && asset.storageLocation === 'local') {
          const testPath = path.resolve(process.cwd(), 'data', 'assets', asset.storageKey);
          if (fs.existsSync(testPath)) {
            localPath = testPath;
          }
        }
      }

      // If not already rendered, render this scene right now
      if (!localPath) {
        const sceneOutPath = path.join(tempDir, `scene_${scene.id}_${Date.now()}.mp4`);
        const { videoPath, qc } = await ProceduralVideoGenerator.renderScene({
          sceneTitle: scene.title,
          sceneNumber: scene.sceneNumber,
          durationSeconds: scene.durationSeconds,
          fps,
          aspectRatio,
          quality,
          weather: (scene.procedural3DConfig?.weather as any) || 'thunderstorm',
          cameraMovement: scene.procedural3DConfig?.cameraMovement || 'dolly_in',
          outputPath: sceneOutPath,
        });

        // Store scene asset
        const buf = fs.readFileSync(videoPath);
        const sceneAsset = await MediaAssetService.storeAssetBuffer({
          projectId: project.id,
          sceneId: scene.id,
          assetType: 'procedural_3d_capture',
          originalFilename: `scene_${scene.sceneNumber}.mp4`,
          mimeType: 'video/mp4',
          buffer: buf,
          metadata: { duration: qc.duration, fps, width: qc.width, height: qc.height },
        });

        scene.generatedVideoUrl = sceneAsset.url;
        localPath = path.resolve(process.cwd(), 'data', 'assets', sceneAsset.storageKey);
      }

      sceneVideoPaths.push(localPath);
    }

    JobManager.transitionStatus(job.id, 'PROCESSING', 70);

    // Now assemble all scenes
    const masterOutName = `master_${project.id}_${Date.now()}.${format}`;
    const masterOutPath = path.join(tempDir, masterOutName);

    const totalDuration = scenesToProcess.reduce((sum, s) => sum + s.durationSeconds, 0);

    const { outputPath, qc } = await MasterAssemblyEngine.assembleProject({
      sceneVideoPaths,
      outputPath: masterOutPath,
      format,
      aspectRatio,
      quality,
      fps,
      expectedDuration: totalDuration,
    });

    JobManager.transitionStatus(job.id, 'QUALITY_CHECK', 90);

    // Save final master asset to storage
    const masterBuffer = fs.readFileSync(outputPath);
    const masterAsset = await MediaAssetService.storeAssetBuffer({
      projectId: project.id,
      assetType: 'rendered_export',
      originalFilename: `${project.title.replace(/\s+/g, '_')}_Master.${format}`,
      mimeType: format === 'webm' ? 'video/webm' : 'video/mp4',
      buffer: masterBuffer,
      metadata: {
        duration: qc.duration,
        fileSize: qc.fileSize,
        fps: qc.fps,
        width: qc.width,
        height: qc.height,
        videoCodec: qc.videoCodec,
        audioCodec: qc.audioCodec,
        qualityControl: qc,
      },
    });

    // Cleanup temp assembly
    try {
      fs.unlinkSync(outputPath);
    } catch {}

    // Update project with master video URL
    project.renderedVideoUrl = masterAsset.url;
    project.currentPhase = 'COMPLETED';
    project.phaseProgress = 100;
    ProjectRepository.save(project);

    JobManager.transitionStatus(job.id, 'COMPLETED', 100, undefined, [masterAsset.id]);
  }

  private static async handleQualityControl(job: ProductionJob): Promise<void> {
    const assetId = job.inputParams?.assetId;
    if (!assetId) throw new Error('Asset ID required for quality control job');

    const asset = MediaAssetService.getAsset(assetId);
    if (!asset) throw new Error(`Asset not found: ${assetId}`);

    const filePath = path.resolve(process.cwd(), 'data', 'assets', asset.storageKey);
    const qc = await QualityControlService.inspectMedia(filePath);

    await MediaAssetService.updateAssetMetadata(asset.id, {
      qualityControl: qc,
    });

    JobManager.transitionStatus(job.id, 'COMPLETED', 100, undefined, [asset.id]);
  }
}
