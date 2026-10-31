/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getDatabase } from './database.js';
import type { MediaAsset, AssetType } from '../../types/film.js';

export class AssetRepository {
  public static getById(id: string): MediaAsset | null {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM assets WHERE id = ?').get(id) as any;
    if (!row) return null;
    return this.mapRowToAsset(row);
  }

  public static listByProject(projectId: string): MediaAsset[] {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM assets WHERE project_id = ? ORDER BY created_at DESC').all(projectId) as any[];
    return rows.map((r) => this.mapRowToAsset(r));
  }

  public static listAll(): MediaAsset[] {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM assets ORDER BY created_at DESC').all() as any[];
    return rows.map((r) => this.mapRowToAsset(r));
  }

  public static save(asset: MediaAsset): void {
    const db = getDatabase();
    const now = new Date().toISOString();
    if (!asset.createdAt) asset.createdAt = now;
    asset.updatedAt = now;

    const stmt = db.prepare(`
      INSERT INTO assets (
        id, project_id, scene_id, asset_type, original_filename,
        mime_type, file_size, storage_key, storage_location, url,
        metadata, status, duration, width, height, created_at, updated_at
      ) VALUES (
        @id, @project_id, @scene_id, @asset_type, @original_filename,
        @mime_type, @file_size, @storage_key, @storage_location, @url,
        @metadata, @status, @duration, @width, @height, @created_at, @updated_at
      )
      ON CONFLICT(id) DO UPDATE SET
        scene_id = excluded.scene_id,
        asset_type = excluded.asset_type,
        original_filename = excluded.original_filename,
        mime_type = excluded.mime_type,
        file_size = excluded.file_size,
        storage_key = excluded.storage_key,
        storage_location = excluded.storage_location,
        url = excluded.url,
        metadata = excluded.metadata,
        status = excluded.status,
        duration = excluded.duration,
        width = excluded.width,
        height = excluded.height,
        updated_at = excluded.updated_at
    `);

    stmt.run({
      id: asset.id,
      project_id: asset.projectId,
      scene_id: asset.sceneId || null,
      asset_type: asset.assetType,
      original_filename: asset.originalFilename,
      mime_type: asset.mimeType,
      file_size: asset.fileSize,
      storage_key: asset.storageKey,
      storage_location: asset.storageLocation,
      url: asset.url,
      metadata: asset.metadata ? JSON.stringify(asset.metadata) : null,
      status: asset.status,
      duration: asset.duration ?? null,
      width: asset.width ?? null,
      height: asset.height ?? null,
      created_at: asset.createdAt,
      updated_at: asset.updatedAt,
    });
  }

  public static delete(id: string): boolean {
    const db = getDatabase();
    const res = db.prepare('DELETE FROM assets WHERE id = ?').run(id);
    return res.changes > 0;
  }

  private static mapRowToAsset(row: any): MediaAsset {
    let meta: Record<string, any> | undefined = undefined;
    if (row.metadata) {
      try {
        meta = JSON.parse(row.metadata);
      } catch {
        // Ignore
      }
    }
    return {
      id: row.id,
      projectId: row.project_id,
      sceneId: row.scene_id || undefined,
      assetType: row.asset_type as AssetType,
      originalFilename: row.original_filename,
      mimeType: row.mime_type,
      fileSize: row.file_size,
      storageKey: row.storage_key,
      storageLocation: row.storage_location as any,
      url: row.url,
      metadata: meta,
      status: row.status as any,
      duration: row.duration ?? undefined,
      width: row.width ?? undefined,
      height: row.height ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
