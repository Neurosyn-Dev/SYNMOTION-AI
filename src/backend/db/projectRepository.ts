/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getDatabase } from './database.js';
import type { FilmProject } from '../../types/film.js';

export interface ProjectSummary {
  id: string;
  title: string;
  userPrompt: string;
  durationTarget: string;
  durationSeconds: number;
  genre: string;
  currentPhase: string;
  sceneCount: number;
  updatedAt: string;
  createdAt: string;
}

export class ProjectRepository {
  public static getById(id: string): FilmProject | null {
    const db = getDatabase();
    const row = db.prepare('SELECT data FROM projects WHERE id = ?').get(id) as { data: string } | undefined;
    if (!row) return null;
    try {
      return JSON.parse(row.data) as FilmProject;
    } catch (err) {
      console.error(`Failed to parse project JSON for ${id}:`, err);
      return null;
    }
  }

  public static list(): ProjectSummary[] {
    const db = getDatabase();
    const rows = db.prepare('SELECT id, title, duration_target, duration_seconds, genre, current_phase, data, updated_at, created_at FROM projects ORDER BY updated_at DESC').all() as any[];

    return rows.map((r) => {
      let prompt = '';
      let sceneCount = 0;
      try {
        const full = JSON.parse(r.data);
        prompt = full.userPrompt || '';
        sceneCount = full.storyboard?.length || 0;
      } catch {
        // Fallback
      }

      return {
        id: r.id,
        title: r.title,
        userPrompt: prompt,
        durationTarget: r.duration_target,
        durationSeconds: r.duration_seconds,
        genre: r.genre,
        currentPhase: r.current_phase,
        sceneCount,
        updatedAt: r.updated_at,
        createdAt: r.created_at,
      };
    });
  }

  public static save(project: FilmProject): void {
    const db = getDatabase();
    const now = new Date().toISOString();
    project.updatedAt = now;
    if (!project.createdAt) {
      project.createdAt = now;
    }

    const stmt = db.prepare(`
      INSERT INTO projects (
        id, title, duration_target, duration_seconds, aspect_ratio,
        quality, fps, genre, visual_style, current_phase, phase_progress,
        data, created_at, updated_at
      ) VALUES (
        @id, @title, @duration_target, @duration_seconds, @aspect_ratio,
        @quality, @fps, @genre, @visual_style, @current_phase, @phase_progress,
        @data, @created_at, @updated_at
      )
      ON CONFLICT(id) DO UPDATE SET
        title = excluded.title,
        duration_target = excluded.duration_target,
        duration_seconds = excluded.duration_seconds,
        aspect_ratio = excluded.aspect_ratio,
        quality = excluded.quality,
        fps = excluded.fps,
        genre = excluded.genre,
        visual_style = excluded.visual_style,
        current_phase = excluded.current_phase,
        phase_progress = excluded.phase_progress,
        data = excluded.data,
        updated_at = excluded.updated_at
    `);

    stmt.run({
      id: project.id,
      title: project.title || 'Untitled Film',
      duration_target: project.durationTarget || '5m',
      duration_seconds: project.durationSeconds ?? 300,
      aspect_ratio: project.aspectRatio || '16:9',
      quality: project.quality || '1080p',
      fps: project.fps || 24,
      genre: project.genre || 'CYBERPUNK_NOIR',
      visual_style: project.visualStyle || '',
      current_phase: project.currentPhase || 'CONCEPT',
      phase_progress: project.phaseProgress || 0,
      data: JSON.stringify(project),
      created_at: project.createdAt || new Date().toISOString(),
      updated_at: project.updatedAt || new Date().toISOString(),
    });
  }

  public static delete(id: string): boolean {
    const db = getDatabase();
    const result = db.prepare('DELETE FROM projects WHERE id = ?').run(id);
    return result.changes > 0;
  }

  public static seedInitialIfEmpty(seedProject: FilmProject): void {
    const db = getDatabase();
    const countRow = db.prepare('SELECT count(*) as count FROM projects').get() as { count: number };
    if (countRow.count === 0) {
      this.save(seedProject);
    }
  }
}
