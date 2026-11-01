/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import crypto from 'crypto';
import path from 'path';
import { AssetRepository } from '../db/assetRepository.js';
import { LocalStorageDriver } from './localStorageDriver.js';
import type { IStorageDriver } from './storageDriver.js';
import type { MediaAsset, AssetType } from '../../types/film.js';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'audio/aac',
]);

const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB maximum for media

export class MediaAssetService {
  private static driver: IStorageDriver = new LocalStorageDriver();

  public static setDriver(driver: IStorageDriver): void {
    this.driver = driver;
  }

  public static getDriverStatus() {
    return this.driver.getStatus();
  }

  public static async storeAsset(params: {
    projectId: string;
    sceneId?: string;
    assetType: AssetType;
    originalFilename: string;
    mimeType: string;
    buffer: Buffer;
    metadata?: Record<string, any>;
    duration?: number;
    width?: number;
    height?: number;
  }): Promise<MediaAsset> {
    const {
      projectId,
      sceneId,
      assetType,
      originalFilename,
      mimeType,
      buffer,
      metadata = {},
      duration,
      width,
      height,
    } = params;

    // Validation
    if (!buffer || buffer.length === 0) {
      throw new Error('File buffer is empty');
    }
    if (buffer.length > MAX_FILE_SIZE_BYTES) {
      throw new Error(`File size (${(buffer.length / (1024 * 1024)).toFixed(2)} MB) exceeds limit of 50 MB`);
    }
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      throw new Error(`Unsupported MIME type: ${mimeType}. Allowed formats: JPG, PNG, WEBP, MP4, WEBM, WAV, MP3`);
    }

    const assetId = `ast-${crypto.randomUUID()}`;
    const ext = path.extname(originalFilename) || this.getExtensionFromMime(mimeType);
    const sanitizedName = path.basename(originalFilename).replace(/[^a-zA-Z0-9._-]/g, '_');
    const storageKey = `${projectId}/${assetId}-${sanitizedName}${ext.startsWith('.') ? '' : '.'}${ext}`;

    // Store binary through driver
    await this.driver.put(storageKey, buffer, mimeType);

    const asset: MediaAsset = {
      id: assetId,
      projectId,
      sceneId,
      assetType,
      originalFilename: sanitizedName,
      mimeType,
      fileSize: buffer.length,
      storageKey,
      storageLocation: 'local',
      url: `/api/assets/${assetId}/content`,
      metadata,
      status: 'READY',
      duration,
      width,
      height,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    AssetRepository.save(asset);
    return asset;
  }

  public static async getAssetContent(assetId: string): Promise<{ buffer: Buffer; asset: MediaAsset }> {
    const asset = AssetRepository.getById(assetId);
    if (!asset) {
      throw new Error(`Media asset not found: ${assetId}`);
    }
    const buffer = await this.driver.get(asset.storageKey);
    return { buffer, asset };
  }

  public static getAssetMetadata(assetId: string): MediaAsset | null {
    return AssetRepository.getById(assetId);
  }

  public static getAsset(assetId: string): MediaAsset | null {
    return AssetRepository.getById(assetId);
  }

  public static getLocalFilePath(storageKey: string): string {
    if (this.driver instanceof LocalStorageDriver) {
      return (this.driver as LocalStorageDriver).getFullPath(storageKey);
    }
    return path.resolve(process.cwd(), 'data', 'assets', storageKey);
  }

  public static listProjectAssets(projectId: string): MediaAsset[] {
    return AssetRepository.listByProject(projectId);
  }

  public static async deleteAsset(assetId: string): Promise<boolean> {
    const asset = AssetRepository.getById(assetId);
    if (!asset) return false;

    try {
      await this.driver.delete(asset.storageKey);
    } catch (err) {
      console.warn(`Warning: Could not remove file for asset ${assetId}:`, err);
    }
    return AssetRepository.delete(assetId);
  }

  public static async storeAssetBuffer(params: {
    projectId: string;
    sceneId?: string;
    assetType: AssetType;
    originalFilename: string;
    mimeType: string;
    buffer: Buffer;
    metadata?: Record<string, any>;
    duration?: number;
    width?: number;
    height?: number;
  }): Promise<MediaAsset> {
    return this.storeAsset(params);
  }

  public static async updateAssetMetadata(
    assetId: string,
    metadataUpdate: Record<string, any>
  ): Promise<MediaAsset | null> {
    const asset = AssetRepository.getById(assetId);
    if (!asset) return null;
    asset.metadata = { ...(asset.metadata || {}), ...metadataUpdate };
    asset.updatedAt = new Date().toISOString();
    AssetRepository.save(asset);
    return asset;
  }

  private static getExtensionFromMime(mime: string): string {
    switch (mime) {
      case 'image/jpeg': return '.jpg';
      case 'image/png': return '.png';
      case 'image/webp': return '.webp';
      case 'video/mp4': return '.mp4';
      case 'video/webm': return '.webm';
      case 'audio/mpeg': return '.mp3';
      case 'audio/wav': return '.wav';
      default: return '.bin';
    }
  }
}
